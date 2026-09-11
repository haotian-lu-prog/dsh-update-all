// dsh-update-plugin host-side update core.
//
// This module intentionally depends on Node built-ins only. It mirrors the
// logic of the dsh-update-all shell script (resolve the newest CLI across all
// npm dist-tags, discover profiles, back up, update the CLI and every profile)
// so the plugin can work without Homebrew or a separately installed script.

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { copyFile, mkdir, readFile, readdir, realpath, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const PACKAGE_NAME = "@deepseek-ai/dsh";
export const REGISTRY = "https://registry.npmjs.org";
export const DEFAULT_PROFILE = "web";
export const MIN_AGE = process.env.DSH_UPDATE_MIN_AGE ?? "0";
export const CLI_TIMEOUT_MS = 10 * 60 * 1000;
export const PROFILE_TIMEOUT_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// semver helpers
// ---------------------------------------------------------------------------
export function parseSemver(value) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(String(value || ""));
  if (!match) return undefined;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? match[4].split(".") : [],
  };
}

function comparePrerelease(left, right) {
  if (left.length === 0 || right.length === 0) {
    if (left.length === right.length) return 0;
    return left.length === 0 ? 1 : -1;
  }
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const a = left[index];
    const b = right[index];
    if (a === undefined || b === undefined) {
      if (a === b) return 0;
      return a === undefined ? -1 : 1;
    }
    if (a === b) continue;
    const aNumeric = /^\d+$/.test(a);
    const bNumeric = /^\d+$/.test(b);
    if (aNumeric && bNumeric) {
      const aNumber = BigInt(a);
      const bNumber = BigInt(b);
      if (aNumber !== bNumber) return aNumber > bNumber ? 1 : -1;
      continue;
    }
    if (aNumeric !== bNumeric) return aNumeric ? -1 : 1;
    return a > b ? 1 : -1;
  }
  return 0;
}

export function compareSemver(left, right) {
  const a = parseSemver(left);
  const b = parseSemver(right);
  if (!a || !b) return 0;
  for (const key of ["major", "minor", "patch"]) {
    if (a[key] !== b[key]) return a[key] > b[key] ? 1 : -1;
  }
  return comparePrerelease(a.prerelease, b.prerelease);
}

export function isNewerVersion(current, candidate) {
  const a = parseSemver(current);
  const b = parseSemver(candidate);
  if (!b) return false;
  if (!a) return true;
  return compareSemver(candidate, current) > 0;
}

export function pickNewestVersion(tags) {
  const versions = [...new Set(Object.values(tags || {}))].filter((value) => typeof value === "string" && parseSemver(value));
  if (versions.length === 0) return undefined;
  versions.sort(compareSemver);
  return versions[versions.length - 1];
}

export function cleanVersion(value) {
  const match = String(value || "").match(/\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?/);
  return match ? match[0] : "";
}

// ---------------------------------------------------------------------------
// child-process helpers
// ---------------------------------------------------------------------------
function lastNonEmptyLine(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .pop();
}

export function runCommand(options) {
  const {
    cmd,
    args = [],
    cwd,
    env,
    timeoutMs = 0,
    onLine,
    shell = false,
  } = options || {};
  return new Promise((resolvePromise, rejectPromise) => {
    let child;
    try {
      child = spawn(cmd, args, {
        cwd,
        env: { ...process.env, NO_COLOR: "1", ...(env || {}) },
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
        shell,
      });
    } catch (error) {
      rejectPromise(error);
      return;
    }

    let stdout = "";
    let stderr = "";
    let timer = null;
    let settled = false;
    const finish = (callback, payload) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      callback(payload);
    };
    const emit = (text) => {
      if (!onLine) return;
      for (const line of String(text).split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed) onLine(trimmed);
      }
    };

    child.stdout?.on("data", (chunk) => {
      const text = String(chunk);
      stdout = (stdout + text).slice(-40000);
      emit(text);
    });
    child.stderr?.on("data", (chunk) => {
      const text = String(chunk);
      stderr = (stderr + text).slice(-40000);
      emit(text);
    });

    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        try {
          child.kill("SIGTERM");
        } catch {
          // ignore
        }
        const error = new Error(`command timed out after ${Math.round(timeoutMs / 1000)}s: ${cmd}`);
        error.code = "TIMEOUT";
        finish(rejectPromise, error);
      }, timeoutMs);
    }

    child.once("error", (error) => finish(rejectPromise, error));
    child.once("exit", (code) => {
      if (code === 0) {
        finish(resolvePromise, { code, stdout, stderr });
        return;
      }
      const detail = lastNonEmptyLine(stderr) || lastNonEmptyLine(stdout) || `command exited with code ${code}: ${cmd}`;
      const error = new Error(detail);
      error.code = code;
      error.stdout = stdout;
      error.stderr = stderr;
      finish(rejectPromise, error);
    });
  });
}

// ---------------------------------------------------------------------------
// runtime discovery
// ---------------------------------------------------------------------------
function isDshCliEntry(entry, manifest, packageRoot) {
  if (!manifest || typeof manifest !== "object" || manifest.name !== PACKAGE_NAME) return false;
  const bin = typeof manifest.bin === "string" ? manifest.bin : manifest.bin?.dsh;
  return typeof bin === "string" && bin !== "" && !bin.startsWith("/") && resolve(packageRoot, bin) === entry;
}

export function findCliEntry() {
  const raw = process.argv[1];
  if (!raw) return undefined;
  const entry = raw.startsWith("file:") ? fileURLToPath(raw) : resolve(process.cwd(), raw);
  if (!existsSync(entry)) return undefined;
  let directory = dirname(entry);
  for (;;) {
    const manifestPath = join(directory, "package.json");
    if (existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
        if (isDshCliEntry(entry, manifest, directory)) return entry;
      } catch {
        // keep walking
      }
    }
    const parent = dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
}

export function runtimeFromProcess() {
  const dshHome = process.env.DSH_HOME ? resolve(process.env.DSH_HOME) : join(homedir(), ".dsh");
  let profileName = process.env.DSH_PROFILE_NAME || "";
  if (!profileName && process.env.DSH_PROFILE_DIR) profileName = basename(process.env.DSH_PROFILE_DIR);
  const argv = process.argv;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--profile" && argv[index + 1]) {
      profileName = argv[index + 1];
      index += 1;
    } else if (arg.startsWith("--profile=")) {
      profileName = arg.slice("--profile=".length);
    }
  }
  if (!profileName || profileName === "." || profileName === ".." || profileName.includes("/") || profileName.includes("\\")) {
    profileName = DEFAULT_PROFILE;
  }
  const profileDir = process.env.DSH_PROFILE_DIR ? resolve(process.env.DSH_PROFILE_DIR) : join(dshHome, "profiles", profileName);
  return {
    dshHome,
    profileName,
    profileDir,
    cliEntry: findCliEntry(),
    nodePath: process.execPath,
  };
}

export function cliInvocation(runtime, args = []) {
  if (runtime.cliEntry) {
    return { cmd: runtime.nodePath || process.execPath, args: [runtime.cliEntry, ...args], shell: false };
  }
  return { cmd: "dsh", args, shell: process.platform === "win32" };
}

export async function currentCliVersion(runtime, options = {}) {
  const invocation = cliInvocation(runtime, ["--version"]);
  const result = await runCommand({
    ...invocation,
    cwd: options.cwd || runtime.profileDir,
    timeoutMs: 20000,
    onLine: options.onLine,
  });
  return cleanVersion(result.stdout || result.stderr);
}

// ---------------------------------------------------------------------------
// registry / profiles / backups
// ---------------------------------------------------------------------------
export async function fetchTargetVersion(fetchImpl = globalThis.fetch, options = {}) {
  if (typeof fetchImpl !== "function") throw new Error("global fetch is not available in this Node.js runtime");
  const url = `${REGISTRY}/-/package/${encodeURIComponent(PACKAGE_NAME)}/dist-tags`;
  const response = await fetchImpl(url, {
    headers: { accept: "application/json" },
    signal: typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(options.timeoutMs || 10000) : undefined,
  });
  if (!response || !response.ok) throw new Error(`registry returned HTTP ${response ? response.status : "?"}`);
  const tags = await response.json();
  const newest = pickNewestVersion(tags);
  if (!newest) throw new Error(`no published versions found for ${PACKAGE_NAME}`);
  return newest;
}

export async function listProfiles(dshHome) {
  const profilesDir = join(dshHome, "profiles");
  let entries = [];
  try {
    entries = await readdir(profilesDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const profiles = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = join(profilesDir, entry.name);
    try {
      const manifest = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
      const dependencies = { ...(manifest.dependencies || {}), ...(manifest.devDependencies || {}), ...(manifest.optionalDependencies || {}) };
      const dependencyCount = Object.keys(dependencies).length;
      if (dependencyCount > 0) profiles.push({ name: entry.name, dir, dependencyCount });
    } catch {
      // a profile without a readable package.json is not something we can update
    }
  }
  return profiles.sort((a, b) => a.name.localeCompare(b.name));
}

async function copyIfExists(from, to) {
  try {
    await copyFile(from, to);
  } catch {
    // optional file
  }
}

export async function createBackup(runtime, profiles, currentVersion) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = join(runtime.dshHome, "update-backups", `plugin-${stamp}`);
  await mkdir(join(dir, "profiles"), { recursive: true });
  const manifest = {
    source: "dsh-update-plugin",
    createdAt: new Date().toISOString(),
    cliVersion: currentVersion || null,
    profileNames: profiles.map((profile) => profile.name),
  };
  await writeFile(join(dir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  for (const profile of profiles) {
    const target = join(dir, "profiles", profile.name);
    await mkdir(target, { recursive: true });
    await copyIfExists(join(profile.dir, "package.json"), join(target, "package.json"));
    await copyIfExists(join(profile.dir, "pnpm-lock.yaml"), join(target, "pnpm-lock.yaml"));
  }
  return dir;
}

// ---------------------------------------------------------------------------
// global installer detection / CLI update
// ---------------------------------------------------------------------------
function isUnder(pathValue, root) {
  if (!root) return false;
  const normalizedRoot = root.endsWith(sep) ? root : `${root}${sep}`;
  return pathValue === root || pathValue.startsWith(normalizedRoot);
}

export async function detectGlobalInstaller(runtime, options = {}) {
  if (!runtime.cliEntry) return "npm";
  let real = runtime.cliEntry;
  try {
    real = await realpath(runtime.cliEntry);
  } catch {
    // fall back to the raw path
  }
  if (isUnder(real, options.pnpmRoot)) return "pnpm";
  if (isUnder(real, options.npmRoot)) return "npm";
  if (!options.skipDetection) {
    try {
      const result = await runCommand({ cmd: "pnpm", args: ["root", "-g"], timeoutMs: 15000 });
      if (isUnder(real, result.stdout.trim())) return "pnpm";
    } catch {
      // pnpm may not be installed
    }
  }
  try {
    const result = await runCommand({ cmd: "npm", args: ["root", "-g"], timeoutMs: 15000 });
    if (isUnder(real, result.stdout.trim())) return "npm";
  } catch {
    // npm may not be on PATH; default below
  }
  if (real.includes(`${sep}.pnpm${sep}`) || real.includes(`${sep}pnpm${sep}`)) return "pnpm";
  return "npm";
}

export async function installCli(runtime, version, options = {}) {
  const installer = await detectGlobalInstaller(runtime, options);
  if (installer === "pnpm") {
    await runCommand({
      cmd: "pnpm",
      args: ["add", "-g", `${PACKAGE_NAME}@${version}`],
      cwd: options.cwd,
      timeoutMs: CLI_TIMEOUT_MS,
      onLine: options.onLine,
      shell: process.platform === "win32",
    });
  } else {
    await runCommand({
      cmd: "npm",
      args: ["install", "-g", `${PACKAGE_NAME}@${version}`, "--no-audit", "--no-fund"],
      cwd: options.cwd,
      timeoutMs: CLI_TIMEOUT_MS,
      onLine: options.onLine,
      shell: process.platform === "win32",
    });
  }
  return installer;
}

// ---------------------------------------------------------------------------
// profile update
// ---------------------------------------------------------------------------
function minAgeArgs() {
  if (MIN_AGE === "" || MIN_AGE === undefined || MIN_AGE === null) return [];
  return [`--config.minimum-release-age=${MIN_AGE}`];
}

export async function updateProfile(runtime, profile, options = {}) {
  const dshArgs = ["plugin", "--profile", profile.name, "update", "--latest", ...minAgeArgs()];
  try {
    await runCommand({
      ...cliInvocation(runtime, dshArgs),
      cwd: profile.dir,
      timeoutMs: PROFILE_TIMEOUT_MS,
      onLine: options.onLine,
    });
    return { via: "dsh plugin" };
  } catch (error) {
    options.onLine?.(`dsh plugin failed for ${profile.name}: ${error.message}`);
  }
  const pnpmArgs = ["update", "--latest", ...minAgeArgs()];
  await runCommand({
    cmd: "pnpm",
    args: pnpmArgs,
    cwd: profile.dir,
    timeoutMs: PROFILE_TIMEOUT_MS,
    onLine: options.onLine,
    shell: process.platform === "win32",
  });
  return { via: "pnpm" };
}

// ---------------------------------------------------------------------------
// status / update orchestration
// ---------------------------------------------------------------------------
export async function checkStatus(runtime, options = {}) {
  const currentVersion = options.currentVersion !== undefined
    ? options.currentVersion
    : await currentCliVersion(runtime, { onLine: options.onLine }).catch(() => "");
  let targetVersion = null;
  let targetError = null;
  try {
    targetVersion = await fetchTargetVersion(options.fetchImpl || globalThis.fetch, options);
  } catch (error) {
    targetError = error instanceof Error ? error.message : String(error);
  }
  const profiles = await listProfiles(runtime.dshHome);
  return {
    profileName: runtime.profileName,
    dshHome: runtime.dshHome,
    currentVersion: currentVersion || null,
    targetVersion: targetVersion || null,
    targetError,
    updateAvailable: Boolean(targetVersion && (!currentVersion || isNewerVersion(currentVersion, targetVersion))),
    profiles: profiles.map((profile) => ({ name: profile.name, dependencyCount: profile.dependencyCount })),
    minAge: MIN_AGE,
    checkedAt: new Date().toISOString(),
  };
}

export async function runUpdate(runtime, hooks = {}) {
  const onPhase = hooks.onPhase || (() => {});
  const onLog = hooks.onLog || (() => {});
  onPhase("checking");
  const currentVersion = await currentCliVersion(runtime, { onLine: onLog });
  const targetVersion = await fetchTargetVersion(hooks.fetchImpl || globalThis.fetch, hooks);
  const profiles = await listProfiles(runtime.dshHome);
  onLog(`current: ${currentVersion || "unknown"}; target: ${targetVersion}; profiles: ${profiles.map((profile) => profile.name).join(", ") || "none"}`);

  onPhase("backup");
  const backupDir = await createBackup(runtime, profiles, currentVersion);
  onLog(`backup created: ${backupDir}`);

  const result = {
    ok: true,
    currentVersion,
    targetVersion,
    backupDir,
    cliUpdated: false,
    cliInstaller: null,
    profiles: [],
    errors: [],
    finishedAt: null,
  };

  if (!currentVersion || isNewerVersion(currentVersion, targetVersion)) {
    onPhase("cli");
    onLog(`installing ${PACKAGE_NAME}@${targetVersion}`);
    try {
      result.cliInstaller = await installCli(runtime, targetVersion, { onLine: onLog });
      result.cliUpdated = true;
      onLog(`CLI updated with ${result.cliInstaller}`);
    } catch (error) {
      result.ok = false;
      result.errors.push(`CLI: ${error.message}`);
      onLog(`CLI update failed: ${error.message}`);
    }
  } else {
    onLog(`CLI already at ${currentVersion}`);
  }

  if (result.ok) {
    for (const profile of profiles) {
      onPhase(`profile:${profile.name}`);
      onLog(`updating profile ${profile.name} (${profile.dependencyCount} dependencies)`);
      try {
        const update = await updateProfile(runtime, profile, { onLine: onLog });
        result.profiles.push({ name: profile.name, ok: true, via: update.via });
        onLog(`profile ${profile.name} updated via ${update.via}`);
      } catch (error) {
        result.ok = false;
        result.errors.push(`${profile.name}: ${error.message}`);
        result.profiles.push({ name: profile.name, ok: false, error: error.message });
        onLog(`profile ${profile.name} failed: ${error.message}`);
      }
    }
  }

  result.finishedAt = new Date().toISOString();
  return result;
}
