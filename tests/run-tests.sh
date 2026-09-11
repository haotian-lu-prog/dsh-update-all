#!/usr/bin/env bash
#
# Test suite for dsh-update-all. It never touches the real DSH installation:
# every external command (npm, dsh, pnpm) is replaced by a mock in a temp dir.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT="$ROOT/dsh-update-all.sh"

TMPROOT="$(mktemp -d "${TMPDIR:-/tmp}/dsh-update-all-tests.XXXXXX")"
trap 'rm -rf "$TMPROOT"' EXIT

PASS=0
FAIL=0

pass() { PASS=$((PASS + 1)); printf '  ok   %s\n' "$1"; }
fail() { FAIL=$((FAIL + 1)); printf '  FAIL %s\n' "$1"; }

assert_contains() {
  local file="$1" needle="$2" label="$3"
  if grep -Fq -- "$needle" "$file"; then pass "$label"; else
    fail "$label (missing: $needle)"
    printf '---- %s ----\n' "$file"; sed -n '1,120p' "$file"; printf -- '-------------\n'
  fi
}

assert_not_contains() {
  local file="$1" needle="$2" label="$3"
  if grep -Fq -- "$needle" "$file"; then fail "$label (unexpected: $needle)"; else pass "$label"; fi
}

assert_eq() {
  local actual="$1" expected="$2" label="$3"
  if [ "$actual" = "$expected" ]; then pass "$label"; else fail "$label (expected [$expected], got [$actual])"; fi
}

# ---------------------------------------------------------------------------
# sandbox
# ---------------------------------------------------------------------------
setup() {
  WORK="$TMPROOT/case-$1"
  STATE="$WORK/state"
  BIN="$WORK/bin"
  HOME_DIR="$WORK/home"
  DSH_HOME="$WORK/dsh"
  LOG="$WORK/log.txt"

  mkdir -p "$STATE" "$BIN" "$HOME_DIR" "$DSH_HOME/profiles/web" "$DSH_HOME/profiles/headless"
  : > "$LOG"

  export HOME="$HOME_DIR"
  export DSH_HOME
  export DSH_NPM_CACHE="$HOME_DIR/.cache/npm"
  export DSH_UPDATE_BACKUP_DIR="$DSH_HOME/update-backups"
  export TEST_LOG="$LOG"
  export TEST_STATE="$STATE"
  export PATH="$BIN:$PATH"

  printf '%s' '0.1.5-rc.1' > "$STATE/dsh-version"
  printf '%s' '{"latest":"0.1.5-rc.1","next":"0.1.5-rc.2","alpha":"0.1.5-alpha.2"}' > "$STATE/dist-tags.json"
  printf '%s\n' "$STATE/npm-root" > /dev/null
  mkdir -p "$STATE/npm-root" "$STATE/pnpm-root"

  cat > "$BIN/dsh" <<'MOCK_DSH'
#!/usr/bin/env bash
printf 'dsh %s\n' "$*" >> "$TEST_LOG"
if [ "${1:-}" = "--version" ]; then
  cat "$TEST_STATE/dsh-version"
  exit 0
fi
exit 0
MOCK_DSH

  cat > "$BIN/npm" <<'MOCK_NPM'
#!/usr/bin/env bash
printf 'npm %s\n' "$*" >> "$TEST_LOG"
case "${1:-}" in
  view)
    cat "$TEST_STATE/dist-tags.json" ;;
  root)
    printf '%s\n' "$TEST_STATE/npm-root" ;;
  install)
    for arg in "$@"; do
      case "$arg" in
        @deepseek-ai/dsh@*) printf '%s' "${arg##*@}" > "$TEST_STATE/dsh-version" ;;
      esac
    done
    exit 0 ;;
  *) exit 0 ;;
esac
MOCK_NPM

  cat > "$BIN/pnpm" <<'MOCK_PNPM'
#!/usr/bin/env bash
printf 'pnpm %s\n' "$*" >> "$TEST_LOG"
case "${1:-}" in
  root) printf '%s\n' "$TEST_STATE/pnpm-root" ;;
  *) exit 0 ;;
esac
MOCK_PNPM

  chmod +x "$BIN/dsh" "$BIN/npm" "$BIN/pnpm"

  cat > "$DSH_HOME/profiles/web/package.json" <<'WEB_PKG'
{
  "name": "dsh-profile-web",
  "private": true,
  "dependencies": {
    "dsh-better-sidebar": "0.18.1"
  }
}
WEB_PKG
  printf 'lockfileVersion: 9.0\n' > "$DSH_HOME/profiles/web/pnpm-lock.yaml"
  cat > "$DSH_HOME/profiles/headless/package.json" <<'HEADLESS_PKG'
{
  "name": "dsh-profile-headless",
  "private": true
}
HEADLESS_PKG
}

# ---------------------------------------------------------------------------
# tests
# ---------------------------------------------------------------------------
test_help_and_version() {
  printf 'test: help & version\n'
  local out
  out="$(bash "$SCRIPT" --version)"
  case "$out" in
    "dsh-update-all "*)
      if printf '%s' "$out" | grep -Eq 'dsh-update-all [0-9]+\.[0-9]+\.[0-9]+'; then
        pass "prints updater version"
      else
        fail "prints updater version (got: $out)"
      fi ;;
    *) fail "prints updater version (got: $out)" ;;
  esac
  if bash "$SCRIPT" --help | grep -Fq -- '--rollback'; then pass "help mentions rollback"; else fail "help mentions rollback"; fi
}

test_dry_run_does_not_change() {
  printf 'test: dry-run makes no changes\n'
  setup dry-run
  local out
  out="$(bash "$SCRIPT" --dry-run 2>&1)"
  printf '%s\n' "$out" > "$WORK/out.txt"
  assert_contains "$WORK/out.txt" 'install dsh CLI: 0.1.5-rc.1 -> 0.1.5-rc.2' "dry-run plans CLI update"
  assert_contains "$WORK/out.txt" 'dsh plugin --profile web update --latest --config.minimum-release-age=0' "dry-run plans profile update"
  assert_not_contains "$WORK/out.txt" 'headless' "dry-run skips profiles without dependencies"
  assert_eq "$(cat "$STATE/dsh-version")" '0.1.5-rc.1' "dry-run leaves CLI version untouched"
  assert_not_contains "$LOG" 'npm install' "dry-run does not call npm install"
}

test_full_update() {
  printf 'test: full update\n'
  setup full
  bash "$SCRIPT" --yes > "$WORK/out.txt" 2>&1
  assert_eq "$(cat "$STATE/dsh-version")" '0.1.5-rc.2' "CLI was upgraded"
  assert_contains "$LOG" 'npm install -g @deepseek-ai/dsh@0.1.5-rc.2' "npm install was called"
  assert_contains "$LOG" 'dsh plugin --profile web update --latest --config.minimum-release-age=0' "profile plugin update was called"
  assert_contains "$WORK/out.txt" 'backup saved:' "backup was created"
  if find "$DSH_HOME/update-backups" -name manifest.json | grep -q .; then pass "manifest exists"; else fail "manifest exists"; fi
}

test_no_cli() {
  printf 'test: --no-cli\n'
  setup no-cli
  bash "$SCRIPT" --yes --no-cli > "$WORK/out.txt" 2>&1
  assert_eq "$(cat "$STATE/dsh-version")" '0.1.5-rc.1' "CLI stays untouched"
  assert_not_contains "$LOG" 'npm install -g' "npm install is not called"
  assert_contains "$LOG" 'dsh plugin --profile web update' "plugins are still updated"
}

test_channel_and_min_age() {
  printf 'test: --channel stable and --min-age\n'
  setup channel
  printf '%s' '{"latest":"0.2.0","next":"0.3.0-rc.1","alpha":"0.3.0-alpha.1"}' > "$STATE/dist-tags.json"
  local out
  out="$(bash "$SCRIPT" --channel stable --dry-run 2>&1)"
  printf '%s\n' "$out" > "$WORK/out.txt"
  assert_contains "$WORK/out.txt" 'install dsh CLI: 0.1.5-rc.1 -> 0.2.0' "stable channel picks latest tag"
  out="$(bash "$SCRIPT" --min-age 1440 --dry-run 2>&1)"
  printf '%s\n' "$out" > "$WORK/out.txt"
  assert_contains "$WORK/out.txt" 'minimum-release-age=1440' "min-age is forwarded to pnpm"
}

test_profile_filter() {
  printf 'test: --profile\n'
  setup profile
  bash "$SCRIPT" --yes --profile web > "$WORK/out.txt" 2>&1
  assert_contains "$LOG" 'dsh plugin --profile web update' "selected profile updated"
  if bash "$SCRIPT" --profile nope --dry-run > "$WORK/out.txt" 2>&1; then
    fail "unknown profile should fail"
  else
    pass "unknown profile fails"
  fi
}

test_backup_and_rollback() {
  printf 'test: backup & rollback\n'
  setup rollback
  cp "$DSH_HOME/profiles/web/package.json" "$WORK/package-before.json"
  bash "$SCRIPT" --yes > "$WORK/out.txt" 2>&1
  assert_eq "$(cat "$STATE/dsh-version")" '0.1.5-rc.2' "CLI upgraded before rollback"

  # simulate a plugin update that changed the manifest
  printf '{"name":"web","dependencies":{"x":"9.9.9"}}\n' > "$DSH_HOME/profiles/web/package.json"
  bash "$SCRIPT" --rollback > "$WORK/rollback.txt" 2>&1

  if diff -q "$WORK/package-before.json" "$DSH_HOME/profiles/web/package.json" >/dev/null; then
    pass "profile package.json restored"
  else
    fail "profile package.json restored"
  fi
  assert_eq "$(cat "$STATE/dsh-version")" '0.1.5-rc.1' "CLI version restored"
  assert_contains "$LOG" 'dsh plugin --profile web install' "rollback reinstalls profile deps"
}

test_unknown_option() {
  printf 'test: unknown option\n'
  setup usage
  local status=0
  bash "$SCRIPT" --definitely-not-an-option >/dev/null 2>&1 || status=$?
  assert_eq "$status" '2' "unknown option exits 2"
}

# ---------------------------------------------------------------------------
# runner
# ---------------------------------------------------------------------------
printf 'dsh-update-all test suite\n'
printf 'script: %s\n\n' "$SCRIPT"
test_help_and_version
test_dry_run_does_not_change
test_full_update
test_no_cli
test_channel_and_min_age
test_profile_filter
test_backup_and_rollback
test_unknown_option

printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
