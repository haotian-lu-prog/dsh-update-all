#!/usr/bin/env bash
#
# Release helper for dsh-update-all.
#
# Usage:
#   scripts/release.sh <version>          # e.g. scripts/release.sh 0.2.0
#   make release VERSION=0.2.0
#
# It expects:
#   - you are on the main branch with a clean working tree;
#   - CHANGELOG.md already has a "## [<version>]" section;
#   - tests pass locally (they are run again here).
#
# It bumps UPDATER_VERSION, commits, creates an annotated tag and pushes both.
# GitHub Actions then publishes the release, uploads the assets and lets the
# Homebrew tap update itself.

set -euo pipefail

VERSION="${1:-}"
[ -n "$VERSION" ] || { printf 'usage: scripts/release.sh <version>\n' >&2; exit 2; }
case "$VERSION" in
  ''|*[!0-9.]*|.*|*..*|*.) printf 'invalid version: %s\n' "$VERSION" >&2; exit 2 ;;
esac

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

command -v git >/dev/null 2>&1 || { printf 'git is required\n' >&2; exit 1; }

branch="$(git rev-parse --abbrev-ref HEAD)"
if [ "$branch" != "main" ]; then
  printf 'release from the main branch (currently on %s)\n' "$branch" >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  printf 'working tree is not clean; commit or stash your changes first\n' >&2
  exit 1
fi

if ! grep -q "^## \\[$VERSION\\]" CHANGELOG.md; then
  printf 'CHANGELOG.md has no "## [%s]" section yet\n' "$VERSION" >&2
  exit 1
fi

printf '==> running tests\n'
bash tests/run-tests.sh

printf '==> syntax checks\n'
bash -n dsh-update-all.sh
bash -n install.sh
bash -n tests/run-tests.sh
if command -v shellcheck >/dev/null 2>&1; then
  shellcheck dsh-update-all.sh install.sh tests/run-tests.sh
else
  printf 'shellcheck not installed, skipping\n'
fi

printf '==> bumping UPDATER_VERSION to %s\n' "$VERSION"
python3 - "$VERSION" <<'PY'
import re
import sys

version = sys.argv[1]
path = "dsh-update-all.sh"
src = open(path).read()
new, count = re.subn(
    r'^UPDATER_VERSION="[^"]+"',
    'UPDATER_VERSION="%s"' % version,
    src,
    count=1,
    flags=re.M,
)
if count != 1:
    raise SystemExit("could not find UPDATER_VERSION in dsh-update-all.sh")
open(path, "w").write(new)
PY

git add dsh-update-all.sh CHANGELOG.md
git commit -m "release: v${VERSION}"
git tag -a "v${VERSION}" -m "v${VERSION}"

printf '==> pushing main and v%s\n' "$VERSION"
git push origin main
git push origin "v${VERSION}"

printf '\nreleased v%s\n' "$VERSION"
printf 'GitHub Actions will now:\n'
printf '  - run CI and the release version check\n'
printf '  - create the GitHub release and attach dsh-update-all.sh / install.sh\n'
printf '  - update haotian-lu-prog/homebrew-tap (daily schedule, or dispatch it manually)\n'
