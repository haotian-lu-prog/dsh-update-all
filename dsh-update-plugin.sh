#!/usr/bin/env bash
#
# dsh-update-plugin — update DeepSeek Harness (DSH), its bundled packages and
# every profile plugin, in one command.
#
# Project: https://github.com/haotian-lu-prog/dsh-update-plugin
# License: MIT
#
# This script only needs bash + node + the package manager you already use
# for DSH (npm or pnpm). It finds profiles dynamically, so new profiles and
# new plugins keep working without editing this file.

set -euo pipefail

UPDATER_VERSION="0.1.2"
PKG="@deepseek-ai/dsh"

DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
NPM_CACHE="${DSH_NPM_CACHE:-$HOME/.cache/dsh-update/npm}"
BACKUP_ROOT="${DSH_UPDATE_BACKUP_DIR:-$DSH_HOME/update-backups}"
MIN_AGE="${DSH_UPDATE_MIN_AGE:-0}"
CHANNEL="${DSH_UPDATE_CHANNEL:-auto}"

DRY_RUN=0
ASSUME_YES=0
UPDATE_CLI=1
UPDATE_PLUGINS=1
DO_BACKUP=1
ROLLBACK_ID=""
LIST_BACKUPS=0
PRINT_TARGET=0
SELECTED_PROFILES=()

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  C_RESET=$'\033[0m'; C_BLUE=$'\033[1;36m'; C_GREEN=$'\033[1;32m'
  C_YELLOW=$'\033[1;33m'; C_RED=$'\033[1;31m'
else
  C_RESET=""; C_BLUE=""; C_GREEN=""; C_YELLOW=""; C_RED=""
fi

log()  { printf '%s==>%s %s\n' "$C_BLUE" "$C_RESET" "$*"; }
ok()   { printf '%s ok %s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
warn() { printf '%swarn:%s %s\n' "$C_YELLOW" "$C_RESET" "$*" >&2; }
err()  { printf '%serror:%s %s\n' "$C_RED" "$C_RESET" "$*" >&2; }
die()  { err "$*"; exit 1; }

usage() {
  cat <<'USAGE'
dsh-update-plugin — update DeepSeek Harness (DSH) and all profile plugins.

Usage:
  dsh-update-plugin [options]

Update options:
  --channel <auto|stable|next|alpha>
                         Release channel to follow. auto (default) picks the
                         highest version across all npm dist-tags.
  --min-age <minutes>    Only accept versions released at least N minutes ago.
                         Default: 0 (always newest; bypasses pnpm's
                         minimumReleaseAge safety delay for this run).
                         1440 = 24 hours (safer).
  --profile <name>       Update only this profile (repeatable).
  --no-cli               Do not update the global dsh CLI.
  --no-plugins           Do not update profile plugins.
  --no-backup            Skip the automatic pre-update backup.
  -n, --dry-run, --check Show what would change without changing anything.
  -y, --yes              Do not ask for confirmation.

Backup / rollback:
  --list-backups         List available backups and exit.
  --rollback [id]        Restore a backup (default: the latest one).

Other:
  --target-version       Print the newest version that would be installed and exit.
  --install              Install this script to ~/.local/bin/dsh-update-plugin.
  -h, --help             Show this help.
  -V, --version          Show updater version.

Environment:
  DSH_HOME               DSH home directory (default: ~/.dsh).
  DSH_UPDATE_CHANNEL     Same as --channel.
  DSH_UPDATE_MIN_AGE     Same as --min-age.
  DSH_NPM_CACHE          npm cache used for metadata and global installs.
  DSH_UPDATE_BACKUP_DIR  Backup directory (default: $DSH_HOME/update-backups).
  DSH_UPDATE_INSTALL_DIR Install target for --install (default: ~/.local/bin).
  NO_COLOR               Disable colored output when set.

Exit codes: 0 success, 1 update failed, 2 usage error.
USAGE
}

die_usage() { err "$*"; printf '\n'; usage; exit 2; }

install_self() {
  local target_dir="${DSH_UPDATE_INSTALL_DIR:-$HOME/.local/bin}"
  local target="$target_dir/dsh-update-plugin"
  mkdir -p "$target_dir"
  install -m 755 "$0" "$target"
  ok "installed to $target"
  case ":$PATH:" in
    *":$target_dir:"*) : ;;
    *) warn "$target_dir is not in PATH; add it to your shell profile" ;;
  esac
}

# ---------------------------------------------------------------------------
# argument parsing
# ---------------------------------------------------------------------------
while [ $# -gt 0 ]; do
  case "$1" in
    --channel)
      [ $# -ge 2 ] || die_usage "--channel requires a value"
      CHANNEL="$2"; shift 2 ;;
    --min-age)
      [ $# -ge 2 ] || die_usage "--min-age requires a value"
      MIN_AGE="$2"; shift 2 ;;
    --profile)
      [ $# -ge 2 ] || die_usage "--profile requires a name"
      SELECTED_PROFILES+=("$2"); shift 2 ;;
    --no-cli)     UPDATE_CLI=0; shift ;;
    --no-plugins) UPDATE_PLUGINS=0; shift ;;
    --no-backup)  DO_BACKUP=0; shift ;;
    -n|--dry-run|--check) DRY_RUN=1; shift ;;
    -y|--yes)     ASSUME_YES=1; shift ;;
    --list-backups) LIST_BACKUPS=1; shift ;;
    --rollback)
      ROLLBACK_ID="__latest__"; shift
      if [ $# -gt 0 ] && [ "${1#-}" = "$1" ]; then
        ROLLBACK_ID="$1"; shift
      fi ;;
    --target-version) PRINT_TARGET=1; shift ;;
    --install) install_self; exit 0 ;;
    -h|--help) usage; exit 0 ;;
    -V|--version) printf 'dsh-update-plugin %s\n' "$UPDATER_VERSION"; exit 0 ;;
    --) shift; break ;;
    -*) die_usage "unknown option: $1" ;;
    *) die_usage "unexpected argument: $1" ;;
  esac
done

case "$CHANNEL" in
  auto|stable|next|alpha) : ;;
  *) die_usage "invalid channel: $CHANNEL (use auto, stable, next or alpha)" ;;
esac
case "$MIN_AGE" in
  ''|*[!0-9]*) die_usage "invalid --min-age: $MIN_AGE (expected a non-negative integer)" ;;
esac

# ---------------------------------------------------------------------------
# prerequisites
# ---------------------------------------------------------------------------
command -v node >/dev/null 2>&1 || die "node is required (DSH itself needs Node.js)"
command -v npm >/dev/null 2>&1 || die "npm is required to query the npm registry"
if [ "$PRINT_TARGET" -ne 1 ]; then
  [ -d "$DSH_HOME" ] || die "DSH_HOME does not exist: $DSH_HOME"
fi

# ---------------------------------------------------------------------------
# version resolution
# ---------------------------------------------------------------------------
VERSION_JS=""
read -r -d '' VERSION_JS <<'JS' || true
const channel = process.argv[1] || "auto";
let input = "";
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => {
  const tags = JSON.parse(input || "{}");
  const tagName = channel === "stable" ? "latest" : channel;
  if (channel !== "auto") {
    if (!tags[tagName]) {
      console.error("dist-tag not found: " + tagName);
      process.exit(3);
    }
    process.stdout.write(tags[tagName]);
    return;
  }
  const parse = (v) => {
    const [core, pre = ""] = String(v).split("-");
    const [M, m, p] = core.split(".").map(Number);
    return { M, m, p, pre: pre ? pre.split(".") : [] };
  };
  const cmp = (a, b) => {
    const A = parse(a), B = parse(b);
    if (A.M !== B.M) return A.M - B.M;
    if (A.m !== B.m) return A.m - B.m;
    if (A.p !== B.p) return A.p - B.p;
    if (!A.pre.length && !B.pre.length) return 0;
    if (!A.pre.length) return 1;
    if (!B.pre.length) return -1;
    for (let i = 0; i < Math.max(A.pre.length, B.pre.length); i++) {
      const x = A.pre[i], y = B.pre[i];
      if (x === undefined) return -1;
      if (y === undefined) return 1;
      const nx = /^\d+$/.test(x), ny = /^\d+$/.test(y);
      if (nx && ny) { if (+x !== +y) return +x - +y; }
      else if (nx !== ny) return nx ? -1 : 1;
      else if (x !== y) return x < y ? -1 : 1;
    }
    return 0;
  };
  const versions = [...new Set(Object.values(tags))].sort(cmp);
  process.stdout.write(versions[versions.length - 1] || "");
});
JS

resolve_target_version() {
  local tags_json
  mkdir -p "$NPM_CACHE"
  printf '%s==>%s resolving newest %s (channel: %s)\n' "$C_BLUE" "$C_RESET" "$PKG" "$CHANNEL" >&2
  tags_json="$(npm view "$PKG" dist-tags --json --cache "$NPM_CACHE")" \
    || die "could not query npm for $PKG"
  printf '%s' "$tags_json" | node -e "$VERSION_JS" "$CHANNEL"
}

if [ "$PRINT_TARGET" -eq 1 ]; then
  resolve_target_version
  exit 0
fi

current_cli_version() {
  if command -v dsh >/dev/null 2>&1; then
    dsh --version 2>/dev/null | head -n 1 | tr -d '[:space:]'
  fi
}

detect_installer() {
  local dsh_bin real npm_root pnpm_root
  dsh_bin="$(command -v dsh 2>/dev/null || true)"
  [ -n "$dsh_bin" ] || { printf 'npm'; return 0; }
  real="$(node -e 'try{process.stdout.write(require("fs").realpathSync(process.argv[1]))}catch(e){process.stdout.write(process.argv[1])}' "$dsh_bin" 2>/dev/null || printf '%s' "$dsh_bin")"
  if command -v pnpm >/dev/null 2>&1; then
    pnpm_root="$(pnpm root -g 2>/dev/null || true)"
    if [ -n "$pnpm_root" ]; then
      case "$real" in "$pnpm_root"/*) printf 'pnpm'; return 0 ;; esac
    fi
  fi
  case "$real" in
    */.pnpm/*|*/pnpm/global/*) printf 'pnpm'; return 0 ;;
  esac
  npm_root="$(npm root -g 2>/dev/null || true)"
  if [ -n "$npm_root" ]; then
    case "$real" in "$npm_root"/*) printf 'npm'; return 0 ;; esac
  fi
  printf 'npm'
}

install_cli() {
  local version="$1" installer
  installer="$(detect_installer)"
  case "$installer" in
    pnpm)
      log "installing $PKG@$version with pnpm"
      pnpm add -g "$PKG@$version" ;;
    npm)
      log "installing $PKG@$version with npm"
      mkdir -p "$NPM_CACHE"
      npm install -g "$PKG@$version" --no-audit --no-fund --cache "$NPM_CACHE" ;;
    *)
      die "unsupported global installer: $installer" ;;
  esac
}

# ---------------------------------------------------------------------------
# profiles
# ---------------------------------------------------------------------------
list_profiles() {
  if [ "${#SELECTED_PROFILES[@]}" -gt 0 ]; then
    printf '%s\n' "${SELECTED_PROFILES[@]}"
    return 0
  fi
  local pkg
  shopt -s nullglob
  for pkg in "$DSH_HOME"/profiles/*/package.json; do
    basename "$(dirname "$pkg")"
  done
}

profile_dep_count() {
  node -e 'const fs=require("fs");const p=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));const d=Object.assign({},p.dependencies,p.devDependencies,p.optionalDependencies);process.stdout.write(String(Object.keys(d).length))' "$1"
}

# ---------------------------------------------------------------------------
# backup / rollback
# ---------------------------------------------------------------------------
create_backup() {
  local cli_version ts dir p
  cli_version="$(current_cli_version || true)"
  ts="$(date +%Y%m%dT%H%M%S)"
  dir="$BACKUP_ROOT/$ts"
  mkdir -p "$dir/profiles"
  node -e 'const fs=require("fs");const [dir,updater,ts,cli,target,channel,...profiles]=process.argv.slice(1);fs.writeFileSync(dir+"/manifest.json",JSON.stringify({updater_version:updater,created_at:ts,cli_version:cli,target_version:target,channel:channel,profiles:profiles},null,2)+"\n");' \
    "$dir" "$UPDATER_VERSION" "$ts" "$cli_version" "$TARGET_VERSION" "$CHANNEL" ${PROFILES[@]+"${PROFILES[@]}"}
  for p in ${PROFILES[@]+"${PROFILES[@]}"}; do
    mkdir -p "$dir/profiles/$p"
    cp -p "$DSH_HOME/profiles/$p/package.json" "$dir/profiles/$p/" 2>/dev/null || true
    if [ -f "$DSH_HOME/profiles/$p/pnpm-lock.yaml" ]; then
      cp -p "$DSH_HOME/profiles/$p/pnpm-lock.yaml" "$dir/profiles/$p/"
    fi
  done
  printf '%s' "$dir"
}

latest_backup_dir() {
  local latest
  latest="$(find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort | tail -n 1)"
  [ -n "$latest" ] || return 1
  printf '%s' "$latest"
}

list_backups() {
  local dirs dir
  shopt -s nullglob
  dirs=("$BACKUP_ROOT"/*/)
  if [ "${#dirs[@]}" -eq 0 ]; then
    printf 'No backups found in %s\n' "$BACKUP_ROOT"
    return 0
  fi
  printf 'Backups in %s:\n' "$BACKUP_ROOT"
  for dir in "${dirs[@]}"; do
    if [ -f "$dir/manifest.json" ]; then
      node -e 'const m=require(process.argv[1]);console.log("  "+m.created_at+"  cli="+(m.cli_version||"?")+"  target="+(m.target_version||"?")+"  profiles="+(m.profiles||[]).join(","))' "$dir/manifest.json"
    else
      printf '  %s (no manifest)\n' "$(basename "$dir")"
    fi
  done
}

cmd_rollback() {
  local id="$1" dir manifest_cli current p profile_dir
  if [ "$id" = "__latest__" ]; then
    dir="$(latest_backup_dir)" || die "no backups found in $BACKUP_ROOT"
  else
    dir="$BACKUP_ROOT/$id"
    [ -d "$dir" ] || die "backup not found: $id"
  fi
  [ -f "$dir/manifest.json" ] || die "invalid backup (manifest.json missing): $dir"
  log "restoring backup: $(basename "$dir")"
  shopt -s nullglob
  for profile_dir in "$dir"/profiles/*/; do
    p="$(basename "$profile_dir")"
    [ -f "$profile_dir/package.json" ] || continue
    log "restoring profile: $p"
    if [ "$DRY_RUN" -eq 1 ]; then
      printf '  [dry-run] restore %s\n' "$DSH_HOME/profiles/$p"
      continue
    fi
    mkdir -p "$DSH_HOME/profiles/$p"
    cp -p "$profile_dir/package.json" "$DSH_HOME/profiles/$p/package.json"
    if [ -f "$profile_dir/pnpm-lock.yaml" ]; then
      cp -p "$profile_dir/pnpm-lock.yaml" "$DSH_HOME/profiles/$p/pnpm-lock.yaml"
    fi
    if command -v dsh >/dev/null 2>&1; then
      if ! dsh plugin --profile "$p" install --frozen-lockfile; then
        warn "frozen install failed for $p; retrying without --frozen-lockfile"
        dsh plugin --profile "$p" install
      fi
    else
      ( cd "$DSH_HOME/profiles/$p" && pnpm install --frozen-lockfile ) || \
        ( cd "$DSH_HOME/profiles/$p" && pnpm install )
    fi
  done
  manifest_cli="$(node -e 'const m=require(process.argv[1]);process.stdout.write(m.cli_version||"")' "$dir/manifest.json" 2>/dev/null || true)"
  if [ -n "$manifest_cli" ]; then
    current="$(current_cli_version || true)"
    if [ "$current" != "$manifest_cli" ]; then
      log "restoring dsh CLI: ${current:-none} -> $manifest_cli"
      if [ "$DRY_RUN" -eq 0 ]; then
        install_cli "$manifest_cli"
      fi
    fi
  fi
  ok "rollback finished"
}

# ---------------------------------------------------------------------------
# profile update
# ---------------------------------------------------------------------------
update_profile() {
  local name="$1" dir
  dir="$DSH_HOME/profiles/$name"
  if [ ! -d "$dir" ]; then
    err "profile not found: $name"
    return 1
  fi
  log "updating profile: $name"
  if command -v dsh >/dev/null 2>&1; then
    if dsh plugin --profile "$name" update --latest --config.minimum-release-age="$MIN_AGE"; then
      return 0
    fi
    warn "dsh plugin failed for $name; trying pnpm directly"
  fi
  if command -v pnpm >/dev/null 2>&1; then
    ( cd "$dir" && pnpm update --latest --config.minimum-release-age="$MIN_AGE" )
  else
    err "cannot update profile $name: dsh plugin failed and pnpm is not installed"
    return 1
  fi
}

# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------
if [ "$LIST_BACKUPS" -eq 1 ]; then
  list_backups
  exit 0
fi

if [ -n "$ROLLBACK_ID" ]; then
  cmd_rollback "$ROLLBACK_ID"
  exit $?
fi

TARGET_VERSION="$(resolve_target_version)"
CURRENT_CLI="$(current_cli_version || true)"

PROFILES=()
if [ "$UPDATE_PLUGINS" -eq 1 ]; then
  if [ "${#SELECTED_PROFILES[@]}" -gt 0 ]; then
    for p in "${SELECTED_PROFILES[@]}"; do
      pkgfile="$DSH_HOME/profiles/$p/package.json"
      [ -f "$pkgfile" ] || die "profile not found: $p"
      PROFILES+=("$p")
    done
  else
    while IFS= read -r p; do
      [ -n "$p" ] || continue
      pkgfile="$DSH_HOME/profiles/$p/package.json"
      [ -f "$pkgfile" ] || continue
      if [ "$(profile_dep_count "$pkgfile")" -gt 0 ]; then
        PROFILES+=("$p")
      fi
    done < <(list_profiles)
  fi
fi

log "current dsh: ${CURRENT_CLI:-not installed}"
log "target dsh:  $TARGET_VERSION"

if [ "$UPDATE_PLUGINS" -eq 1 ]; then
  if [ "${#PROFILES[@]}" -gt 0 ]; then
    log "profiles: ${PROFILES[*]}"
  else
    warn "no profiles with plugin dependencies found under $DSH_HOME/profiles"
  fi
fi

if [ "$DRY_RUN" -eq 1 ]; then
  log "dry run: no changes will be made"
  if [ "$UPDATE_CLI" -eq 1 ]; then
    if [ "$CURRENT_CLI" != "$TARGET_VERSION" ]; then
      printf '  [dry-run] install dsh CLI: %s -> %s\n' "${CURRENT_CLI:-none}" "$TARGET_VERSION"
    else
      printf '  [dry-run] dsh CLI already at %s\n' "$TARGET_VERSION"
    fi
  fi
  if [ "$UPDATE_PLUGINS" -eq 1 ] && [ "${#PROFILES[@]}" -gt 0 ]; then
    for p in "${PROFILES[@]}"; do
      printf '  [dry-run] dsh plugin --profile %s update --latest --config.minimum-release-age=%s\n' "$p" "$MIN_AGE"
    done
  fi
  exit 0
fi

if [ -t 0 ] && [ "$ASSUME_YES" -ne 1 ]; then
  printf 'Proceed? [y/N] '
  read -r reply || reply=""
  case "$reply" in
    [yY]|[yY][eE][sS]) : ;;
    *) printf 'aborted\n'; exit 0 ;;
  esac
fi

BACKUP_DIR=""
if [ "$DO_BACKUP" -eq 1 ]; then
  BACKUP_DIR="$(create_backup)"
  ok "backup saved: $BACKUP_DIR"
fi

FAILED=0

if [ "$UPDATE_CLI" -eq 1 ]; then
  if [ "$CURRENT_CLI" != "$TARGET_VERSION" ]; then
    if ! install_cli "$TARGET_VERSION"; then
      err "failed to install $PKG@$TARGET_VERSION"
      FAILED=$((FAILED + 1))
    fi
  else
    ok "dsh CLI already at $TARGET_VERSION"
  fi
fi

if [ "$UPDATE_PLUGINS" -eq 1 ] && [ "${#PROFILES[@]}" -gt 0 ]; then
  for p in "${PROFILES[@]}"; do
    if ! update_profile "$p"; then
      err "failed to update profile: $p"
      FAILED=$((FAILED + 1))
    fi
  done
fi

if [ "$FAILED" -gt 0 ]; then
  err "$FAILED step(s) failed. Backup: ${BACKUP_DIR:-none}"
  if [ -n "$BACKUP_DIR" ]; then
    printf 'To roll back: dsh-update-plugin --rollback %s\n' "$(basename "$BACKUP_DIR")" >&2
  fi
  exit 1
fi

NEW_CLI="$(current_cli_version || true)"
ok "all done (dsh ${NEW_CLI:-unknown})"
log "restart any running 'dsh web' / DSH session to load the new code"
