# Contributing

Thanks for taking the time to improve `dsh-update-all`!

## Ways to help

- Report bugs with the [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml).
- Request features with the [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml).
- Improve the README, add translations, or add tests.
- When DSH changes its CLI layout, open an issue or send a PR so the updater
  keeps working.

## Development setup

```bash
git clone https://github.com/haotian-lu-prog/dsh-update-all.git
cd dsh-update-all

# run the test suite (uses mocks, never touches your real DSH)
bash tests/run-tests.sh

# syntax checks
make lint
```

There is no build step, no runtime dependencies and no package manager needed
for development beyond `bash` and `node`.

## Guidelines

- Keep the main script compatible with **Bash 3.2**, the default `/bin/bash` on
  macOS. In particular, avoid `mapfile`, associative arrays and `${var,,}`.
- Always quote variables, and keep `set -euo pipefail` at the top.
- Prefer POSIX-ish tools that exist on both macOS and Linux (`sed`, `find`,
  `sort`, `tail`), and use `node` when real parsing is needed.
- Never write outside `$DSH_HOME`, the global npm/pnpm prefix and the temporary
  directory.
- Every new option or behaviour should come with a test in
  `tests/run-tests.sh` using the existing mock helpers.
- Update `README.md`, `README.zh-CN.md` and `CHANGELOG.md` when user-facing
  behaviour changes.

## Tests

The test suite creates a temporary `HOME` and `DSH_HOME`, puts fake `npm`,
`dsh` and `pnpm` executables first in `PATH`, and asserts on the commands that
were executed. It covers:

- help and version output
- `--dry-run` not changing anything
- full update (CLI + profile plugins)
- `--no-cli`, `--profile`, `--channel`, `--min-age`
- backup and `--rollback`
- usage errors

## Release process

1. Run `make lint test` with a clean tree.
2. Update `CHANGELOG.md` and bump `UPDATER_VERSION` in `dsh-update-all.sh`.
3. Commit, then tag: `git tag -a vX.Y.Z -m "vX.Y.Z"`.
4. Push the commit and the tag.
5. Create a GitHub release from the tag and paste the changelog entry.
6. If the project URL changed, run `make set-repo OWNER=<owner>` so every
   placeholder is updated.

## Code of conduct

Be kind and constructive. This project follows the spirit of the
[Contributor Covenant](https://www.contributor-covenant.org/).
