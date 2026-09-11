// dsh-update-plugin host half.
//
// Registers two loopback-only endpoints next to the DSH web server:
//
//   GET  /api/dsh-update-plugin/status   current/target version + job state
//   POST /api/dsh-update-plugin/update   start an update job
//
// The real work lives in update-core.js.

import { checkStatus, runUpdate, runtimeFromProcess } from "./update-core.js";

export const name = "dsh-update-plugin";
export const inject = ["webServer"];

const HEADER = "x-dsh-update-plugin";
const STATUS_PATH = "/api/dsh-update-plugin/status";
const UPDATE_PATH = "/api/dsh-update-plugin/update";
const LOG_LIMIT = 200;

function header(request, key) {
  const value = request.headers?.[key];
  return Array.isArray(value) ? value[0] : value;
}

function isLoopbackAddress(value) {
  const address = String(value || "").toLowerCase().replace(/^\[|\]$/g, "");
  return (
    address === "localhost" ||
    address === "localhost." ||
    address === "::1" ||
    address.startsWith("127.") ||
    address.startsWith("::ffff:127.")
  );
}

function isTrustedUpdateRequest(request) {
  if (header(request, HEADER) !== "1") return false;
  if (!isLoopbackAddress(request.socket?.remoteAddress)) return false;
  const site = header(request, "sec-fetch-site");
  if (site !== undefined && site !== "same-origin") return false;
  const origin = header(request, "origin");
  const host = header(request, "host");
  if (!origin || !host) return false;
  try {
    const url = new URL(origin);
    return (url.protocol === "http:" || url.protocol === "https:") && isLoopbackAddress(url.hostname) && url.host === host;
  } catch {
    return false;
  }
}

function publicError(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (/\/Users\/|\/home\/|\/root\/|\/private\/|[A-Za-z]:\\/.test(message)) {
    return "更新失败，请查看 DSH 日志或使用终端命令。";
  }
  return message || "更新失败。";
}

function json(response, statusCode, value) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(value));
}

const job = {
  running: false,
  phase: "idle",
  logs: [],
  error: null,
  result: null,
  status: null,
  startedAt: 0,
  finishedAt: 0,
  restartRequired: false,
};

function pushLog(line) {
  job.logs.push(String(line));
  if (job.logs.length > LOG_LIMIT) job.logs.splice(0, job.logs.length - LOG_LIMIT);
}

function snapshot() {
  return {
    ...(job.status || {}),
    running: job.running,
    phase: job.phase,
    logs: job.logs.slice(-20),
    error: job.error,
    result: job.result,
    restartRequired: job.restartRequired,
  };
}

async function handleStatus(runtime, refresh, response) {
  if (job.running) {
    json(response, 200, snapshot());
    return;
  }
  if (job.finishedAt > 0 && !refresh) {
    json(response, 200, snapshot());
    return;
  }
  if (refresh) {
    job.logs = [];
    job.error = null;
    job.result = null;
    job.finishedAt = 0;
    job.restartRequired = false;
    job.phase = "idle";
  }
  const status = await checkStatus(runtime, { onLine: () => {} });
  job.status = status;
  json(response, 200, {
    ...status,
    running: false,
    phase: "idle",
    logs: [],
    error: null,
    result: null,
    restartRequired: false,
  });
}

function startUpdate(runtime, ctx) {
  job.running = true;
  job.phase = "checking";
  job.logs = [];
  job.error = null;
  job.result = null;
  job.startedAt = Date.now();
  job.finishedAt = 0;
  job.restartRequired = false;

  const onPhase = (phase) => {
    job.phase = phase;
  };
  const onLog = (line) => {
    pushLog(line);
    try {
      ctx?.logger?.info?.(`dsh-update-plugin: ${line}`);
    } catch {
      // logging must never break the update
    }
  };

  void (async () => {
    try {
      const result = await runUpdate(runtime, { onPhase, onLog });
      job.result = result;
      job.status = {
        ...(job.status || {}),
        currentVersion: result.cliUpdated ? result.targetVersion : result.currentVersion,
        targetVersion: result.targetVersion,
        updateAvailable: false,
      };
      if (result.ok) {
        job.phase = "done";
        job.restartRequired = true;
      } else {
        job.phase = "error";
        job.error = result.errors.join("; ") || "更新失败。";
      }
    } catch (error) {
      job.phase = "error";
      job.error = publicError(error);
      onLog(`error: ${job.error}`);
    } finally {
      job.running = false;
      job.finishedAt = Date.now();
    }
  })();
}

function handleUpdate(runtime, request, response, ctx) {
  if (!isTrustedUpdateRequest(request)) {
    json(response, 403, { error: "forbidden" });
    return;
  }
  if (job.running) {
    json(response, 409, { error: "update already running" });
    return;
  }
  startUpdate(runtime, ctx);
  json(response, 202, { started: true });
}

export function apply(ctx) {
  const runtime = runtimeFromProcess();
  try {
    ctx?.logger?.info?.(`dsh-update-plugin loaded (profile: ${runtime.profileName})`);
  } catch {
    // ignore logging failures
  }

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: "exact",
        path: STATUS_PATH,
        handler: async (request, response) => {
          try {
            const url = new URL(request.url || "/", "http://localhost");
            const refresh = url.searchParams.get("refresh") === "1";
            await handleStatus(runtime, refresh, response);
          } catch (error) {
            json(response, 500, { error: publicError(error) });
          }
        },
      }),
    "dsh-update-plugin: status endpoint",
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: "exact",
        path: UPDATE_PATH,
        handler: (request, response) => {
          handleUpdate(runtime, request, response, ctx);
        },
      }),
    "dsh-update-plugin: update endpoint",
  );
}
