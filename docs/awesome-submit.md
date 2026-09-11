# Submit `dsh-update-plugin` to awesome-dsh-plugin

Status: **prepared, waiting for the repository age gate.**

- Repository: https://github.com/haotian-lu-prog/dsh-update-all
- Plugin entry URL: https://github.com/haotian-lu-prog/dsh-update-all/tree/main/plugin
- npm package: https://www.npmjs.com/package/dsh-update-plugin
- Topic `dsh-plugin`: already added to the repository
- Repository created at: `2026-09-11T13:01:27Z`

The awesome-dsh-plugin submission gate requires the repository to be at least
**1 day old** (`MIN_AGE_DAYS = 1` in `scripts/check-submission.mjs`). Submit no
earlier than:

```
2026-09-12T13:01:28Z UTC
2026-09-12 22:01 JST
```

The exact entry file is ready at
[`docs/awesome-dsh-plugin-entry.yml`](awesome-dsh-plugin-entry.yml).

## Submit steps

```bash
# 1. Fork the list (once)
gh repo fork awesome-dsh-plugin/awesome-dsh-plugin --clone=false

# 2. Clone your fork
rm -rf /tmp/awesome-dsh
git clone https://github.com/haotian-lu-prog/awesome-dsh-plugin /tmp/awesome-dsh
cd /tmp/awesome-dsh
git checkout -b add-dsh-update-plugin

# 3. Copy the prepared entry, one file per plugin
cp "/Users/lu.haotian/Library/Mobile Documents/com~apple~CloudDocs/Ai/DSH/dsh-update-all/docs/awesome-dsh-plugin-entry.yml" \
  data/plugins/haotian-lu-prog__dsh-update-all--plugin.yml

# 4. Optional: preview the generated README line
#    (the maintainers regenerate on main after merge; do not edit READMEs by hand)
npm ci
node scripts/generate-readme.mjs

# 5. Commit and push
git add data/plugins/haotian-lu-prog__dsh-update-all--plugin.yml
git commit -m "Add dsh-update-plugin"
git push -u origin add-dsh-update-plugin

# 6. Open the PR
gh pr create --repo awesome-dsh-plugin/awesome-dsh-plugin \
  --head haotian-lu-prog:add-dsh-update-plugin \
  --title "Add dsh-update-plugin" \
  --body-file "/Users/lu.haotian/Library/Mobile Documents/com~apple~CloudDocs/Ai/DSH/dsh-update-all/docs/awesome-pr-body.md"
```

## Why this entry is useful next to existing updaters

The list already has update managers such as
`Airmetro/dsh-update-checker`, `hezhongtang/dsh-update-copilot` and
`crTnT/dsh-plugin-suite#dsh-plugin-updater`. This plugin adds:

- A `Check for Updates...` row directly in **Settings → General**.
- A native **right-sidebar card** with a badge when an update is available.
- Explicit npm **channel selection**: `auto` / `stable` / `next` / `alpha`.
- **Minimum release age** control for pnpm's `minimumReleaseAge` policy.
- A built-in **test reminder** button that exercises the badge and browser
  notification.
- One-command update of the DSH CLI **and every profile plugin**, using the
  logic of `dsh-update-all`, with backup and one-click rollback.
