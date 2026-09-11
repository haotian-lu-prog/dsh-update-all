// dsh-update-plugin host half.
//
// Registers loopback-only endpoints next to the DSH web server:
//
//   GET  /api/dsh-update-plugin/status    current/target version + job state
//   POST /api/dsh-update-plugin/update    start an update job
//   GET  /api/dsh-update-plugin/config    read channel/minAge
//   POST /api/dsh-update-plugin/config    write channel/minAge
//   GET  /api/dsh-update-plugin/backups   list backups
//   POST /api/dsh-update-plugin/rollback  start a rollback job
//
// The real work lives in update-core.js.

import {
  checkStatus,
  listBackups,
  readConfig,
  rollbackBackup,
  runUpdate,
  runtimeFromProcess,
  writeConfig,
} from "./update-core.js";

export const name = "dsh-update-plugin";
export const inject = ["webServer"];

const HEADER = "x-dsh-update-plugin";
const STATUS_PATH = "/api/dsh-update-plugin/status";
const UPDATE_PATH = "/api/dsh-update-plugin/update";
const CONFIG_PATH = "/api/dsh-update-plugin/config";
const BACKUPS_PATH = "/api/dsh-update-plugin/backups";
const ROLLBACK_PATH = "/api/dsh-update-plugin/rollback";
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

function isTrustedRequest(request) {
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

function readJsonBody(request, limit = 1 << 20) {
  return new Promise((resolvePromise, rejectPromise) => {
    let size = 0;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        rejectPromise(new Error("body too large"));
        request.destroy?.();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolvePromise(text ? JSON.parse(text) : {});
      } catch (error) {
        rejectPromise(error);
      }
    });
    request.on("error", rejectPromise);
  });
}

const job = {
  running: false,
  kind: null,
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
    kind: job.kind,
    phase: job.phase,
    logs: job.logs.slice(-40),
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
    job.kind = null;
    job.phase = "idle";
  }
  const status = await checkStatus(runtime, { onLine: () => {} });
  job.status = status;
  json(response, 200, {
    ...status,
    running: false,
    kind: null,
    phase: "idle",
    logs: [],
    error: null,
    result: null,
    restartRequired: false,
  });
}

function startJob(kind, runner, ctx) {
  job.running = true;
  job.kind = kind;
  job.phase = kind === "rollback" ? "rollback" : "checking";
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
      // logging must never break the job
    }
  };

  void (async () => {
    try {
      const result = await runner(onPhase, onLog);
      job.result = result;
      if (kind === "update") {
        job.status = {
          ...(job.status || {}),
          currentVersion: result.cliUpdated ? result.targetVersion : result.currentVersion,
          targetVersion: result.targetVersion,
          updateAvailable: false,
        };
      }
      if (result.ok) {
        job.phase = "done";
        job.restartRequired = true;
      } else {
        job.phase = "error";
        job.error = result.errors?.join("; ") || "更新失败。";
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
  if (!isTrustedRequest(request)) {
    json(response, 403, { error: "forbidden" });
    return;
  }
  if (job.running) {
    json(response, 409, { error: "job already running" });
    return;
  }
  startJob("update", (onPhase, onLog) => runUpdate(runtime, { onPhase, onLog }), ctx);
  json(response, 202, { started: true, kind: "update" });
}

async function handleRollback(runtime, request, response, ctx) {
  if (!isTrustedRequest(request)) {
    json(response, 403, { error: "forbidden" });
    return;
  }
  if (job.running) {
    json(response, 409, { error: "job already running" });
    return;
  }
  let body = {};
  try {
    body = await readJsonBody(request);
  } catch (error) {
    json(response, 400, { error: publicError(error) });
    return;
  }
  let backupId = typeof body.id === "string" ? body.id : "";
  if (!backupId) {
    const backups = await listBackups(runtime.dshHome).catch(() => []);
    backupId = backups[0]?.id || "";
  }
  if (!backupId) {
    json(response, 404, { error: "no backup found" });
    return;
  }
  startJob("rollback", (_onPhase, onLog) => rollbackBackup(runtime, backupId, { onLine: onLog }), ctx);
  json(response, 202, { started: true, kind: "rollback", id: backupId });
}

async function handleConfig(runtime, request, response) {
  try {
    if (request.method === "GET" || request.method === "HEAD") {
      json(response, 200, await readConfig(runtime.dshHome));
      return;
    }
    if (request.method !== "POST") {
      json(response, 405, { error: "method not allowed" });
      return;
    }
    if (!isTrustedRequest(request)) {
      json(response, 403, { error: "forbidden" });
      return;
    }
    const body = await readJsonBody(request);
    json(response, 200, await writeConfig(runtime.dshHome, body));
  } catch (error) {
    json(response, 500, { error: publicError(error) });
  }
}

async function handleBackups(runtime, request, response) {
  try {
    if (request.method !== "GET" && request.method !== "HEAD") {
      json(response, 405, { error: "method not allowed" });
      return;
    }
    json(response, 200, { backups: await listBackups(runtime.dshHome) });
  } catch (error) {
    json(response, 500, { error: publicError(error) });
  }
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
        handler: (request, response) => handleUpdate(runtime, request, response, ctx),
      }),
    "dsh-update-plugin: update endpoint",
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: "exact",
        path: CONFIG_PATH,
        handler: (request, response) => handleConfig(runtime, request, response),
      }),
    "dsh-update-plugin: config endpoint",
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: "exact",
        path: BACKUPS_PATH,
        handler: (request, response) => handleBackups(runtime, request, response),
      }),
    "dsh-update-plugin: backups endpoint",
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: "exact",
        path: ROLLBACK_PATH,
        handler: (request, response) => {
          void handleRollback(runtime, request, response, ctx);
        },
      }),
    "dsh-update-plugin: rollback endpoint",
  );
}
