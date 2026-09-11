# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/YOUR_GITHUB_USER/dsh-update-all/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/YOUR_GITHUB_USER/dsh-update-all/releases/tag/v0.1.0
