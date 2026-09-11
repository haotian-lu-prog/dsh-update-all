import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import test from "node:test";

import { apply } from "../lib/index.js";

function responseRecorder() {
  return {
    statusCode: 0,
    headers: null,
    body: "",
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(chunk) {
      if (chunk) this.body += String(chunk);
    },
  };
}

function requestRecorder(overrides = {}) {
  return {
    method: "GET",
    url: "/",
    headers: {},
    socket: { remoteAddress: "127.0.0.1" },
    ...overrides,
  };
}

test("host registers status and update endpoints with security checks", async () => {
  const home = await mkdtemp(join(tmpdir(), "dsh-update-host-"));
  const profileDir = join(home, "profiles", "web");
  const bin = join(home, "bin");
  await mkdir(profileDir, { recursive: true });
  await mkdir(bin, { recursive: true });
  await writeFile(
    join(profileDir, "package.json"),
    JSON.stringify({ name: "dsh-profile-web", dependencies: { "dsh-better-sidebar": "0.19.1" } }),
  );

  const fakeScript = (body) => ["#!/usr/bin/env node", body, "process.exit(0);"].join("\n");
  await writeFile(join(bin, "dsh"), fakeScript("const args = process.argv.slice(2); if (args[0] === '--version') { process.stdout.write('0.1.5-rc.1\\n'); process.exit(0); }"));
  await writeFile(join(bin, "npm"), fakeScript("if (process.argv[2] === 'root') { process.stdout.write(''); }"));
  await writeFile(join(bin, "pnpm"), fakeScript("if (process.argv[2] === 'root') { process.stdout.write(''); }"));
  await chmod(join(bin, "dsh"), 0o755);
  await chmod(join(bin, "npm"), 0o755);
  await chmod(join(bin, "pnpm"), 0o755);

  const oldPath = process.env.PATH;
  const oldHome = process.env.DSH_HOME;
  const oldProfileDir = process.env.DSH_PROFILE_DIR;
  const oldFetch = globalThis.fetch;
  process.env.PATH = `${bin}${delimiter}${oldPath}`;
  process.env.DSH_HOME = home;
  process.env.DSH_PROFILE_DIR = profileDir;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ latest: "0.1.5-rc.1", next: "0.1.5-rc.2" }),
  });

  const routes = new Map();
  const ctx = {
    logger: { info() {} },
    effect(fn) {
      return fn();
    },
    webServer: {
      register(route) {
        routes.set(route.path, route);
        return () => {};
      },
    },
  };

  try {
    apply(ctx);
    const statusRoute = routes.get("/api/dsh-update-plugin/status");
    const updateRoute = routes.get("/api/dsh-update-plugin/update");
    assert.ok(statusRoute, "status route registered");
    assert.ok(updateRoute, "update route registered");

    const statusResponse = responseRecorder();
    await statusRoute.handler(requestRecorder({ headers: { "x-dsh-update-plugin": "1" } }), statusResponse);
    assert.equal(statusResponse.statusCode, 200);
    const status = JSON.parse(statusResponse.body);
    assert.equal(status.profileName, "web");
    assert.equal(status.currentVersion, "0.1.5-rc.1");
    assert.equal(status.targetVersion, "0.1.5-rc.2");
    assert.equal(status.updateAvailable, true);

    const forbiddenResponse = responseRecorder();
    updateRoute.handler(requestRecorder({ method: "POST", headers: {} }), forbiddenResponse);
    assert.equal(forbiddenResponse.statusCode, 403);

    const remoteResponse = responseRecorder();
    updateRoute.handler(
      requestRecorder({
        method: "POST",
        headers: {
          "x-dsh-update-plugin": "1",
          "sec-fetch-site": "same-origin",
          origin: "http://127.0.0.1:4321",
          host: "127.0.0.1:4321",
        },
        socket: { remoteAddress: "203.0.113.9" },
      }),
      remoteResponse,
    );
    assert.equal(remoteResponse.statusCode, 403);

    const startResponse = responseRecorder();
    updateRoute.handler(
      requestRecorder({
        method: "POST",
        headers: {
          "x-dsh-update-plugin": "1",
          "sec-fetch-site": "same-origin",
          origin: "http://127.0.0.1:4321",
          host: "127.0.0.1:4321",
        },
      }),
      startResponse,
    );
    assert.equal(startResponse.statusCode, 202);

    let finished = null;
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const poll = responseRecorder();
      // eslint-disable-next-line no-await-in-loop
      await statusRoute.handler(requestRecorder({ headers: { "x-dsh-update-plugin": "1" } }), poll);
      const payload = JSON.parse(poll.body);
      if (!payload.running) {
        finished = payload;
        break;
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(finished, "update job finished");
    assert.equal(finished.restartRequired, true);
    assert.equal(finished.result.ok, true);
    assert.equal(finished.result.cliUpdated, true);
    assert.equal(finished.result.targetVersion, "0.1.5-rc.2");
  } finally {
    process.env.PATH = oldPath;
    if (oldHome === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = oldHome;
    if (oldProfileDir === undefined) delete process.env.DSH_PROFILE_DIR;
    else process.env.DSH_PROFILE_DIR = oldProfileDir;
    globalThis.fetch = oldFetch;
  }
});
