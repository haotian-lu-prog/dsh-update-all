import assert from "node:assert/strict";
import { chmod, mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import test from "node:test";

import {
  checkStatus,
  fetchTargetVersion,
  isNewerVersion,
  listProfiles,
  pickNewestVersion,
  runCommand,
  runUpdate,
} from "../lib/update-core.js";

test("pickNewestVersion follows semver across dist-tags", () => {
  assert.equal(
    pickNewestVersion({ latest: "0.1.5-rc.1", next: "0.1.5-rc.2", alpha: "0.1.5-alpha.2" }),
    "0.1.5-rc.2",
  );
  assert.equal(pickNewestVersion({ latest: "0.2.0", next: "0.3.0-rc.1" }), "0.3.0-rc.1");
  assert.equal(pickNewestVersion({ latest: "0.3.0", next: "0.2.0" }), "0.3.0");
  assert.equal(pickNewestVersion({ latest: "0.1.5", next: "0.1.5-rc.2" }), "0.1.5");
  assert.equal(pickNewestVersion({ latest: "0.1.5-rc.9", next: "0.1.5-rc.10" }), "0.1.5-rc.10");
  assert.equal(pickNewestVersion({}), undefined);
});

test("isNewerVersion compares releases and prereleases", () => {
  assert.equal(isNewerVersion("0.1.5-rc.1", "0.1.5-rc.2"), true);
  assert.equal(isNewerVersion("0.1.5-rc.2", "0.1.5"), true);
  assert.equal(isNewerVersion("0.1.5", "0.1.5-rc.2"), false);
  assert.equal(isNewerVersion("0.1.5-rc.2", "0.1.5-rc.2"), false);
  assert.equal(isNewerVersion("", "0.1.5-rc.2"), true);
});

test("fetchTargetVersion picks the newest dist-tag", async () => {
  const fakeFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ latest: "0.1.5-rc.1", next: "0.1.5-rc.2" }),
  });
  assert.equal(await fetchTargetVersion(fakeFetch), "0.1.5-rc.2");
});

test("checkStatus reports update availability and profiles", async () => {
  const home = await mkdtemp(join(tmpdir(), "dsh-update-plugin-test-"));
  const profiles = join(home, "profiles");
  await mkdir(join(profiles, "web"), { recursive: true });
  await mkdir(join(profiles, "empty"), { recursive: true });
  await writeFile(
    join(profiles, "web", "package.json"),
    JSON.stringify({ name: "dsh-profile-web", dependencies: { "dsh-better-sidebar": "0.19.1" } }),
  );
  await writeFile(join(profiles, "empty", "package.json"), JSON.stringify({ name: "dsh-profile-empty" }));

  const listed = await listProfiles(home);
  assert.deepEqual(
    listed.map((profile) => [profile.name, profile.dependencyCount]),
    [["web", 1]],
  );

  const runtime = {
    dshHome: home,
    profileName: "web",
    profileDir: join(profiles, "web"),
    cliEntry: process.argv[1],
    nodePath: process.execPath,
  };
  const status = await checkStatus(runtime, {
    currentVersion: "0.1.5-rc.1",
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => ({ latest: "0.1.5-rc.1", next: "0.1.5-rc.2" }),
    }),
  });
  assert.equal(status.targetVersion, "0.1.5-rc.2");
  assert.equal(status.updateAvailable, true);
  assert.deepEqual(status.profiles, [{ name: "web", dependencyCount: 1 }]);
});

test("runCommand captures output and exit status", async () => {
  const result = await runCommand({
    cmd: process.execPath,
    args: ["-e", "process.stdout.write('hello')"],
  });
  assert.equal(result.stdout, "hello");

  await assert.rejects(
    runCommand({ cmd: process.execPath, args: ["-e", "process.exit(3)"] }),
    (error) => error.code === 3,
  );
});

test("runUpdate updates the CLI and every profile with mocked commands", async () => {
  const home = await mkdtemp(join(tmpdir(), "dsh-update-plugin-run-"));
  const profiles = join(home, "profiles");
  const webDir = join(profiles, "web");
  const bin = join(home, "bin");
  await mkdir(webDir, { recursive: true });
  await mkdir(bin, { recursive: true });
  await writeFile(
    join(webDir, "package.json"),
    JSON.stringify({ name: "dsh-profile-web", dependencies: { "dsh-better-sidebar": "0.19.1" } }),
  );

  const logPath = join(home, "fake.log");
  const fakeDsh = join(home, "fake-dsh.js");
  await writeFile(
    fakeDsh,
    [
      "#!/usr/bin/env node",
      "const fs = require('node:fs');",
      "const args = process.argv.slice(2);",
      "fs.appendFileSync(process.env.FAKE_LOG, 'dsh ' + args.join(' ') + '\\n');",
      "if (args[0] === '--version') { process.stdout.write('0.1.5-rc.1\\n'); process.exit(0); }",
      "process.exit(0);",
    ].join("\n"),
  );
  const fakeNpm = join(bin, "npm");
  await writeFile(
    fakeNpm,
    [
      "#!/usr/bin/env node",
      "const fs = require('node:fs');",
      "fs.appendFileSync(process.env.FAKE_LOG, 'npm ' + process.argv.slice(2).join(' ') + '\\n');",
      "if (process.argv[2] === 'root') { process.stdout.write(process.env.FAKE_NPM_ROOT || ''); process.exit(0); }",
      "process.exit(0);",
    ].join("\n"),
  );
  const fakePnpm = join(bin, "pnpm");
  await writeFile(
    fakePnpm,
    [
      "#!/usr/bin/env node",
      "const fs = require('node:fs');",
      "fs.appendFileSync(process.env.FAKE_LOG, 'pnpm ' + process.argv.slice(2).join(' ') + '\\n');",
      "if (process.argv[2] === 'root') { process.stdout.write(process.env.FAKE_PNPM_ROOT || ''); process.exit(0); }",
      "process.exit(0);",
    ].join("\n"),
  );
  await chmod(fakeNpm, 0o755);
  await chmod(fakePnpm, 0o755);

  const oldPath = process.env.PATH;
  const oldLog = process.env.FAKE_LOG;
  process.env.PATH = `${bin}${delimiter}${oldPath}`;
  process.env.FAKE_LOG = logPath;
  process.env.FAKE_NPM_ROOT = join(home, "npm-root");
  process.env.FAKE_PNPM_ROOT = join(home, "pnpm-root");
  try {
    const result = await runUpdate(
      {
        dshHome: home,
        profileName: "web",
        profileDir: webDir,
        cliEntry: fakeDsh,
        nodePath: process.execPath,
      },
      {
        fetchImpl: async () => ({
          ok: true,
          status: 200,
          json: async () => ({ latest: "0.1.5-rc.1", next: "0.1.5-rc.2" }),
        }),
        onPhase: () => {},
        onLog: () => {},
      },
    );

    assert.equal(result.ok, true);
    assert.equal(result.cliUpdated, true);
    assert.equal(result.targetVersion, "0.1.5-rc.2");
    assert.ok(result.backupDir.includes("update-backups"));
    assert.deepEqual(result.errors, []);

    const log = await readFile(logPath, "utf8");
    assert.match(log, /npm install -g @deepseek-ai\/dsh@0\.1\.5-rc\.2/);
    assert.match(log, /dsh plugin --profile web update --latest/);

    const manifest = JSON.parse(await readFile(join(result.backupDir, "manifest.json"), "utf8"));
    assert.deepEqual(manifest.profileNames, ["web"]);
    assert.equal(manifest.cliVersion, "0.1.5-rc.1");
  } finally {
    process.env.PATH = oldPath;
    if (oldLog === undefined) delete process.env.FAKE_LOG;
    else process.env.FAKE_LOG = oldLog;
    delete process.env.FAKE_NPM_ROOT;
    delete process.env.FAKE_PNPM_ROOT;
  }
});
