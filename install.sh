#!/usr/bin/env bash
#
# dsh-update-plugin installer.
#
# One-liner:
#   curl -fsSL https://github.com/haotian-lu-prog/dsh-update-plugin/releases/latest/download/install.sh | bash
#
# Options:
#   --dir <dir>       install directory (default: ~/.local/bin)
#   --ref <ref>       git ref to download (default: main)
#   --repo <owner/repo>
#   --local <file>    install from a local checkout instead of downloading
#   -h, --help
#
# Environment:
#   DSH_UPDATE_PLUGIN_REPO   same as --repo
#   DSH_UPDATE_PLUGIN_REF    same as --ref
#   DSH_UPDATE_INSTALL_DIR   same as --dir

set -euo pipefail

REPO="${DSH_UPDATE_PLUGIN_REPO:-haotian-lu-prog/dsh-update-plugin}"
REF="${DSH_UPDATE_PLUGIN_REF:-main}"
INSTALL_DIR="${DSH_UPDATE_INSTALL_DIR:-$HOME/.local/bin}"
LOCAL_SRC=""

usage() {
  cat <<'USAGE'
dsh-update-plugin installer

Usage:
  install.sh [options]

Options:
  --dir <dir>       install directory (default: ~/.local/bin)
  --ref <ref>       git ref to download (default: main)
  --repo <owner/repo>
  --local <file>    install from a local checkout instead of downloading
  -h, --help
USAGE
}

die() { printf 'error: %s\n' "$*" >&2; exit 1; }

while [ $# -gt 0 ]; do
  case "$1" in
    --dir)
      [ $# -ge 2 ] || die "--dir requires a value"
      INSTALL_DIR="$2"; shift 2 ;;
    --ref)
      [ $# -ge 2 ] || die "--ref requires a value"
      REF="$2"; shift 2 ;;
    --repo)
      [ $# -ge 2 ] || die "--repo requires a value"
      REPO="$2"; shift 2 ;;
    --local)
      [ $# -ge 2 ] || die "--local requires a path"
      LOCAL_SRC="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown option: $1" ;;
  esac
done

mkdir -p "$INSTALL_DIR"
TARGET="$INSTALL_DIR/dsh-update-plugin"

if [ -n "$LOCAL_SRC" ]; then
  [ -f "$LOCAL_SRC" ] || die "local script not found: $LOCAL_SRC"
  install -m 755 "$LOCAL_SRC" "$TARGET"
else
  case "$REPO" in
    */*) : ;;
    *) die "--repo must be <owner>/<repo> (got: $REPO)" ;;
  esac
  case "$REF" in
    main|master) URL="https://raw.githubusercontent.com/$REPO/refs/heads/$REF/dsh-update-plugin.sh" ;;
    *)           URL="https://raw.githubusercontent.com/$REPO/$REF/dsh-update-plugin.sh" ;;
  esac
  TMP="$(mktemp "${TMPDIR:-/tmp}/dsh-update-plugin.XXXXXX")"
  trap 'rm -f "$TMP"' EXIT
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$URL" -o "$TMP" || die "download failed: $URL"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO "$TMP" "$URL" || die "download failed: $URL"
  else
    die "curl or wget is required"
  fi
  install -m 755 "$TMP" "$TARGET"
fi

printf 'installed: %s\n' "$TARGET"
"$TARGET" --version || true

case ":$PATH:" in
  *":$INSTALL_DIR:"*)
    printf 'run: dsh-update-plugin\n' ;;
  *)
    # shellcheck disable=SC2016  # $PATH is printed literally on purpose
    printf '\n%s is not in PATH. Add this to your shell profile:\n  export PATH="%s:$PATH"\n' "$INSTALL_DIR" "$INSTALL_DIR" ;;
esac
