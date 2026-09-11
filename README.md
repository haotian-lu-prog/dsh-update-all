# dsh-update-all

[![CI](https://github.com/haotian-lu-prog/dsh-update-all/actions/workflows/ci.yml/badge.svg)](https://github.com/haotian-lu-prog/dsh-update-all/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Update **DeepSeek Harness (DSH)**, its bundled `@deepseek-ai/dsh-*` packages and
**all profile plugins** with one command.

[中文说明](README.zh-CN.md) · [Changelog](CHANGELOG.md) · [Contributing](CONTRIBUTING.md)

---

## Why

DSH is updated in at least two places:

1. the global CLI package (`@deepseek-ai/dsh`) — it also ships all
   `@deepseek-ai/dsh-*` bundles;
2. every profile under `~/.dsh/profiles/<name>` — community plugins are normal
   `pnpm` dependencies of each profile.

Doing this by hand means remembering `npm install -g @deepseek-ai/dsh@next`,
then `dsh plugin --profile web update`, and so on for every profile. This tool
does all of it, discovers new profiles and new plugins automatically, and knows
that npm's `latest` dist-tag is not always the newest DSH release.

## Features

- **One command**: `dsh-update-all`.
- **CLI + plugins**: updates the global CLI and every profile's plugins.
- **Always actually latest**: compares *all* npm dist-tags (`latest`, `next`,
  `alpha`, …) instead of trusting `latest`.
- **Future proof**: profiles are discovered from `$DSH_HOME/profiles/*/package.json`,
  so new profiles and new plugins work without editing this script.
- **Installer aware**: uses `npm` or `pnpm`, depending on how DSH is installed.
- **Safe by default**: automatic backup before every update, plus a
  `--rollback` command.
- **Preview mode**: `--dry-run` shows exactly what would change.
- **Tunable channels**: `--channel stable|next|alpha|auto` and
  `--min-age <minutes>` for pnpm's `minimumReleaseAge` supply-chain delay.
- **Small**: a single Bash script; works with macOS's default Bash 3.2.

## Requirements

- macOS or Linux (WSL works)
- `bash` 3.2 or newer
- `node` (DSH itself requires Node.js)
- `npm` (to query the registry; also used to update DSH when it was installed
  with npm)
- `pnpm` is used through `dsh plugin`, so it only needs to be available if your
  DSH installation already uses it
- DSH installed — although the script can also bootstrap a missing CLI

## Install

### One-liner

```bash
curl -fsSL https://github.com/haotian-lu-prog/dsh-update-all/releases/latest/download/install.sh | bash
```

The installer downloads the updater script from `refs/heads/main`, so you always get the newest code. To run the installer itself from the main branch instead of the latest release:

```bash
curl -fsSL https://raw.githubusercontent.com/haotian-lu-prog/dsh-update-all/refs/heads/main/install.sh | bash
```

### Manual

```bash
git clone https://github.com/haotian-lu-prog/dsh-update-all.git
cd dsh-update-all
./install.sh --local dsh-update-all.sh
```

### From a local checkout (without installing)

```bash
bash ./dsh-update-all.sh --dry-run
```

If `~/.local/bin` is not in your `PATH`, the installer prints the line to add.

## Usage

```bash
# Update everything to the newest release (default)
dsh-update-all

# Preview only
dsh-update-all --dry-run

# Follow the stable dist-tag only
dsh-update-all --channel stable

# Be conservative: only accept packages published at least 24h ago
dsh-update-all --min-age 1440

# Only one profile
dsh-update-all --profile web

# CLI only / plugins only
dsh-update-all --no-plugins
dsh-update-all --no-cli

# No confirmation prompt (for scripts / cron)
dsh-update-all --yes

# List backups and roll back
dsh-update-all --list-backups
dsh-update-all --rollback
dsh-update-all --rollback 20260911T211500
```

Restart any running `dsh web` / DSH session afterwards to load the new code.

## Options

| Option | Description |
| --- | --- |
| `--channel <auto\|stable\|next\|alpha>` | Which npm dist-tag to follow. `auto` (default) picks the highest version across all tags. `stable` means `latest`. |
| `--min-age <minutes>` | Only accept versions published at least N minutes ago. `0` (default) always takes the newest; `1440` = 24h. |
| `--profile <name>` | Update only this profile. Repeatable. |
| `--no-cli` | Do not update the global `dsh` CLI. |
| `--no-plugins` | Do not update profile plugins. |
| `--no-backup` | Skip the automatic pre-update backup. |
| `-n`, `--dry-run`, `--check` | Print the plan without changing anything. |
| `-y`, `--yes` | Do not ask for confirmation. |
| `--list-backups` | List available backups. |
| `--rollback [id]` | Restore a backup (latest by default). |
| `--install` | Install this script into `~/.local/bin`. |
| `-h`, `--help` | Show help. |
| `-V`, `--version` | Show the updater version. |

### Environment variables

| Variable | Default | Meaning |
| --- | --- | --- |
| `DSH_HOME` | `~/.dsh` | DSH home directory. |
| `DSH_UPDATE_CHANNEL` | `auto` | Same as `--channel`. |
| `DSH_UPDATE_MIN_AGE` | `0` | Same as `--min-age`. |
| `DSH_NPM_CACHE` | `~/.cache/dsh-update/npm` | npm cache used for metadata and installs. |
| `DSH_UPDATE_BACKUP_DIR` | `$DSH_HOME/update-backups` | Where backups are stored. |
| `DSH_UPDATE_INSTALL_DIR` | `~/.local/bin` | Install target for `--install` / `install.sh`. |
| `NO_COLOR` | unset | Disable colored output. |

## How it works

1. **Resolve the target version.** The script asks npm for the
   `dist-tags` of `@deepseek-ai/dsh` and compares them with semver rules.
   With the default `--channel auto`, the highest version wins — which is how
   it finds `next` releases that are newer than `latest`.
2. **Detect how DSH was installed.** It resolves the real path behind `dsh`
   and chooses `npm` or `pnpm` global install accordingly.
3. **Back up.** Each selected profile's `package.json` and `pnpm-lock.yaml`
   plus the current CLI version are copied to
   `$DSH_HOME/update-backups/<timestamp>/`, with a `manifest.json`.
4. **Update the CLI and bundles.** One global install updates
   `@deepseek-ai/dsh` and all of its bundled `@deepseek-ai/dsh-*` dependencies.
5. **Update the profiles.** For each profile with dependencies it runs
   `dsh plugin --profile <name> update --latest`, falling back to
   `pnpm update --latest` in the profile directory.
6. **Summarize.** Finally it prints the new CLI version and reminds you to
   restart DSH.

## Safety and rollback

- Always preview first: `dsh-update-all --dry-run`.
- Every real run creates a backup by default. Backups live in
  `~/.dsh/update-backups/`.
- To roll back everything — profile manifests, lockfiles, reinstall of
  dependencies and the previous CLI version:

  ```bash
  dsh-update-all --rollback
  ```

- By default the script passes `--config.minimum-release-age=0` to pnpm, so
  plugin updates are not held back by the 24h supply-chain delay. Use
  `dsh-update-all --min-age 1440` (or `DSH_UPDATE_MIN_AGE=1440`) if you prefer
  the safer behaviour.
- This tool only ever writes inside your DSH home and your global npm/pnpm
  prefix. It never sends your data anywhere; npm/pnpm talk to their registries.

## FAQ

**Why is `latest` not the newest version?**
DSH is still releasing prereleases. At the time of writing,
`latest` pointed to `0.1.5-rc.1` while `next` was `0.1.5-rc.2`. `--channel auto`
compares all dist-tags and picks the actual highest version.

**Will it update my plugins to a version that is younger than 24h?**
With the default `--min-age 0`, yes. Pass `--min-age 1440` to opt into a delay.

**I installed DSH with pnpm. Does it still work?**
Yes. The script inspects where the `dsh` binary really lives and updates it with
the matching package manager.

**Does it update DSH Desktop?**
No. This project updates the CLI and the profile plugins. The desktop app has
its own updater.

**Does it work on Windows?**
Use WSL, or Git Bash. The script is tested on macOS and Linux. Native Windows
PowerShell is not supported.

**I don't have any profiles.**
That is fine — the profile update step is simply skipped. The CLI and its
bundled packages are still updated.

## Contributing

Issues and pull requests are very welcome. See [CONTRIBUTING.md](CONTRIBUTING.md)
for local development and test instructions.

## License

[MIT](LICENSE)
