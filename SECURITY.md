# Security policy

## Supported versions

Only the latest release of `dsh-update-all` is supported with security fixes.

## Reporting a vulnerability

Please report security issues privately through
[GitHub Security Advisories](https://github.com/YOUR_GITHUB_USER/dsh-update-all/security/advisories/new)
rather than opening a public issue. We aim to acknowledge reports within a few
days.

## What this tool does

`dsh-update-all` runs with your user privileges and:

- runs `npm install -g` or `pnpm add -g` for `@deepseek-ai/dsh`;
- runs `dsh plugin --profile <name> update --latest` (or `pnpm update --latest`)
  inside each profile directory under `$DSH_HOME/profiles`;
- reads and writes `package.json` / `pnpm-lock.yaml` inside `$DSH_HOME`;
- writes backups under `$DSH_HOME/update-backups`.

It does not phone home. Network requests are made only by `npm`/`pnpm` to the
configured registry (by default `https://registry.npmjs.org`).

## Supply-chain considerations

By default the script passes `--config.minimum-release-age=0` to pnpm, which
disables pnpm's `minimumReleaseAge` delay for that run. This means a
freshly-published plugin version can be installed immediately. Use
`dsh-update-all --min-age 1440` to require releases to be at least 24 hours old,
or review `--dry-run` output first.

Because the project is distributed as a shell script, prefer the signed GitHub
release tarball or review the script before running the `curl | bash`
installer. You can also clone the repository and run
`./install.sh --local dsh-update-all.sh`.
