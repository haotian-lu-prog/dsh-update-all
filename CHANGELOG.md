# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Documentation

- Document the `brew trust` step required by Homebrew 6+ before installing
  formulae from a third-party tap.

## [0.1.2] - 2026-09-11

### Changed

- The Homebrew formula now lives in this repository
  (`Formula/dsh-update-all.rb`); the separate `homebrew-tap` repository is no
  longer needed.
- The **Release** workflow updates the formula URL and sha256 immediately after
  publishing the GitHub release, so Homebrew always tracks the newest version
  without any extra secret.
- Homebrew install command is now
  `brew tap haotian-lu-prog/dsh-update-all https://github.com/haotian-lu-prog/dsh-update-all`
  followed by `brew install dsh-update-all`.

### Removed

- The optional `HOMEBREW_TAP_TOKEN` secret and the external tap sync step.

## [0.1.1] - 2026-09-11

### Added

- Homebrew installation through the
  [`haotian-lu-prog/homebrew-tap`](https://github.com/haotian-lu-prog/homebrew-tap)
  tap, with a formula that syncs to the latest release automatically.
- `--target-version` to print the newest version that would be installed and
  exit (useful for scripts and CI).
- Scheduled **Upstream check** workflow: every day it resolves the newest
  `@deepseek-ai/dsh` version and opens an issue when DSH has moved ahead of the
  tracked version.
- Tag-driven **Release** workflow: validates the tag against
  `UPDATER_VERSION`, creates the GitHub release with generated notes and
  attaches `dsh-update-all.sh` / `install.sh`.
- `scripts/release.sh` and `make release VERSION=x.y.z` for one-command
  releases.
- Optional `HOMEBREW_TAP_TOKEN` secret to trigger the tap update immediately
  after a release.

### Changed

- README / README.zh-CN now document Homebrew, `--target-version` and the
  release automation.
- Tests no longer hardcode the updater version.

## [0.1.0] - 2026-09-11

### Added

- One-command update of the global `@deepseek-ai/dsh` CLI and every profile
  plugin.
- Dynamic profile discovery under `$DSH_HOME/profiles/*/package.json`.
- Release resolution across all npm dist-tags (`latest`, `next`, `alpha`, …).
- `--channel`, `--min-age`, `--profile`, `--no-cli`, `--no-plugins`,
  `--dry-run`, `--yes` options.
- Automatic backup before updates and `--rollback` / `--list-backups`.
- npm/pnpm global-install detection.
- `install.sh` installer and `--install` self-install.
- English and Chinese README.
- Mock-based test suite and GitHub Actions CI.

[Unreleased]: https://github.com/haotian-lu-prog/dsh-update-all/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/haotian-lu-prog/dsh-update-all/releases/tag/v0.1.2
[0.1.1]: https://github.com/haotian-lu-prog/dsh-update-all/releases/tag/v0.1.1
[0.1.0]: https://github.com/haotian-lu-prog/dsh-update-all/releases/tag/v0.1.0
