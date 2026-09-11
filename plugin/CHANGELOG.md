# Changelog

All notable changes to `dsh-update-plugin` are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-09-12

### Added

- **Settings → General** row titled **Check for Updates... / 检查更新**, registered
  through the public `settings.general.item` slot.
- Full **Settings → Check for Updates...** section page with status, update
  channel, minimum release age, profile details, backup list and rollback.
- Native DSH right-sidebar tab (`sidebarRightTabs` / `sidebarRight`) with a live
  badge when an update is available and a compact check/update panel.
- Built-in update logic (no Homebrew or separate shell script needed):
  all npm dist-tags, channel selection (`auto` / `stable` / `next` / `alpha`),
  `$DSH_HOME/profiles/*` discovery, npm/pnpm CLI detection, per-profile
  `dsh plugin --profile <name> update --latest` with a `pnpm update` fallback.
- Automatic backups under `~/.dsh/update-backups/` plus one-click rollback of
  profile manifests, lockfiles, dependencies and the previous CLI version.
- Host endpoints under `/api/dsh-update-plugin/`: `status`, `update`, `config`,
  `backups`, `rollback`; all mutating endpoints are loopback and same-origin
  only.
- Two documented fallbacks: the plugin can always be upgraded from the terminal
  (`dsh plugin --profile web add dsh-update-plugin@latest`), and a broken plugin
  cannot break DSH itself.

### Changed

- Installation documentation insists on `dsh plugin add` (not plain `pnpm add`)
  so the package joins `dsh.profile.bundles`, and documents the pnpm
  `minimumReleaseAge` workaround (`--config.minimum-release-age=0`).
