## What changed

<!-- A short description of the change and why it is needed. -->

## How to test

<!-- Commands a reviewer can run. -->

```bash
bash tests/run-tests.sh
```

## Checklist

- [ ] `bash tests/run-tests.sh` passes
- [ ] `make lint` passes (or shellcheck is not available locally)
- [ ] Bash 3.2 compatible (no `mapfile`, associative arrays, `${var,,}`)
- [ ] README / README.zh-CN / CHANGELOG updated for user-facing changes
- [ ] New behaviour is covered by a test in `tests/run-tests.sh`
