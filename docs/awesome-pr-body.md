Adds one entry for **dsh-update-plugin**, a DSH Web plugin that updates the DSH
CLI and every profile plugin from Settings or the right sidebar.

- `data/plugins/haotian-lu-prog__dsh-update-plugin--plugin.yml`
- Monorepo subpackage entry: `plugin/` declares `dsh.bundle` and ships
  `cordis.patch.yml`
- npm package: https://www.npmjs.com/package/dsh-update-plugin
- Install: `dsh plugin --profile web add dsh-update-plugin`
- Repository has the `dsh-plugin` topic
- Repo age gate: submit after `2026-09-12T13:01:28Z`

Features: a Check for Updates row in Settings → General, a full settings page, a
native right-sidebar card with an update badge, npm channel selection
(auto/stable/next/alpha), minimum release age, backups, one-click rollback and
a test reminder for the badge and browser notification.
