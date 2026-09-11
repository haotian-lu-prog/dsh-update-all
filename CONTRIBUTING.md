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

1. Make sure `main` is up to date and the working tree is clean.
2. Add the new version section to `CHANGELOG.md` (Keep a Changelog format).
3. Run `make release VERSION=x.y.z`.
   This runs the test suite, bumps `UPDATER_VERSION`, commits, creates an
   annotated tag and pushes both.
4. The **Release** workflow validates the tag, creates the GitHub release with
   generated notes and attaches `dsh-update-all.sh` / `install.sh`.
5. The same **Release** workflow updates `Formula/dsh-update-all.rb`
   (URL + sha256) on `main`, so Homebrew points at the new version immediately.
6. If the project URL changed, run `make set-repo OWNER=<owner>` so every
   placeholder — including the formula's `homepage` and `url` — is updated.

## Code of conduct

Be kind and constructive. This project follows the spirit of the
[Contributor Covenant](https://www.contributor-covenant.org/).
