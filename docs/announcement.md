# Community announcement drafts

Ready-to-paste copy for GitHub Discussions, X/Twitter, Reddit and other DSH
communities. Replace release links if needed.

---

## 中文 · GitHub Discussion / Release 公告

**标题**

`dsh-update-plugin`：一条命令更新 DSH CLI 和所有插件，现在也有 DSH Web 插件

**正文**

大家好，分享两个 DSH 生态工具，用来解决更新分散、版本麻烦的问题。

DSH 的更新通常分散在几处：全局 `@deepseek-ai/dsh` CLI、随包的
`@deepseek-ai/dsh-*`、以及每个 profile 下的社区插件。手动更新要记住一堆命令，
而且 pnpm 的 `minimumReleaseAge` 策略经常把新版本挡住。

**`dsh-update-plugin`** 是一条命令的更新器：

- 一条命令更新 CLI、bundle 和所有 profile 插件
- 自动发现 `~/.dsh/profiles` 下新增的 profile
- 比较全部 npm dist-tags，不会漏掉 `next` / `alpha` 上的新版
- 支持 `--channel`、`--min-age`、`--dry-run`
- 更新前自动备份，支持 `--rollback`

**`dsh-update-plugin`** 是它的 DSH Web 插件版：

- 在 **设置 → 通用设置** 里加入「检查更新」一行
- 完整设置页：频道选择、`minimumReleaseAge`、profile 明细、备份和回滚
- 右侧边栏原生 tab，有更新时显示红点角标
- 「测试更新提醒」按钮，可以快速验证角标和浏览器通知
- 不依赖 Homebrew 或外部脚本，更新逻辑完整内置

**安装**

命令行工具：

```bash
brew tap haotian-lu-prog/dsh-update-plugin
brew install dsh-update-plugin
```

或者：

```bash
curl -fsSL https://github.com/haotian-lu-prog/dsh-update-plugin/releases/latest/download/install.sh | bash
```

DSH Web 插件：

```bash
dsh plugin --profile web add dsh-update-plugin
```

<img src="https://raw.githubusercontent.com/haotian-lu-prog/dsh-update-plugin/refs/heads/main/plugin/assets/screenshots/general-zh.webp" width="720" alt="通用设置里的检查更新">
<img src="https://raw.githubusercontent.com/haotian-lu-prog/dsh-update-plugin/refs/heads/main/plugin/assets/screenshots/plugin-cn.png" width="720" alt="设置 → 检查更新完整页面">
<img src="https://raw.githubusercontent.com/haotian-lu-prog/dsh-update-plugin/refs/heads/main/plugin/assets/screenshots/sidebar-cn.png" width="720" alt="右侧栏更新提醒">

**链接**

- GitHub：https://github.com/haotian-lu-prog/dsh-update-plugin
- npm：https://www.npmjs.com/package/dsh-update-plugin
- 插件 Release：https://github.com/haotian-lu-prog/dsh-update-plugin/releases/tag/plugin-v0.1.0

欢迎提 Issue、Discussion 和 PR，也欢迎反馈 DSH 新版适配问题。

---

## English · GitHub Discussion / Release announcement

**Title**

`dsh-update-plugin`: one command to update the DSH CLI and all plugins, now with a DSH Web plugin

**Body**

Hi everyone. I built two tools for the DSH ecosystem to make updates less
painful.

DSH updates are spread across several places: the global `@deepseek-ai/dsh`
CLI, the bundled `@deepseek-ai/dsh-*` packages, and every community plugin under
each profile. Updating by hand means remembering several commands, and pnpm's
`minimumReleaseAge` policy often hides the newest release.

**`dsh-update-plugin`** is a one-command updater:

- Updates the CLI, bundles and every profile plugin in one run
- Discovers new profiles under `~/.dsh/profiles` automatically
- Compares every npm dist-tag, so `next` / `alpha` releases are not missed
- Supports `--channel`, `--min-age` and `--dry-run`
- Creates a backup before every update and supports `--rollback`

**`dsh-update-plugin`** brings the same updater into DSH Web:

- A **Check for Updates...** row in **Settings → General**
- A full settings page: channel, `minimumReleaseAge`, profiles, backups, rollback
- A native right-sidebar tab with an update badge
- A **Send test reminder** button to verify the badge and browser notification
- Built-in update logic: no Homebrew or external script required

**Install**

CLI:

```bash
brew tap haotian-lu-prog/dsh-update-plugin
brew install dsh-update-plugin
```

or:

```bash
curl -fsSL https://github.com/haotian-lu-prog/dsh-update-plugin/releases/latest/download/install.sh | bash
```

DSH Web plugin:

```bash
dsh plugin --profile web add dsh-update-plugin
```

<img src="https://raw.githubusercontent.com/haotian-lu-prog/dsh-update-plugin/refs/heads/main/plugin/assets/screenshots/general-en.webp" width="720" alt="Check for Updates row">
<img src="https://raw.githubusercontent.com/haotian-lu-prog/dsh-update-plugin/refs/heads/main/plugin/assets/screenshots/sidebar-en.png" width="720" alt="Right sidebar card">
<img src="https://raw.githubusercontent.com/haotian-lu-prog/dsh-update-plugin/refs/heads/main/plugin/assets/screenshots/plugin-en.png" width="720" alt="Check for Updates settings page">

**Links**

- GitHub: https://github.com/haotian-lu-prog/dsh-update-plugin
- npm: https://www.npmjs.com/package/dsh-update-plugin
- Plugin release: https://github.com/haotian-lu-prog/dsh-update-plugin/releases/tag/plugin-v0.1.0

Issues, Discussions and PRs are welcome, especially compatibility reports for
new DSH releases.

---

## X / Twitter

中文：

> DSH 更新太分散？我做了 `dsh-update-plugin`：一条命令更新 CLI、bundle 和所有 profile 插件；还有 DSH Web 插件版，设置里直接「检查更新」，支持频道、min-age、备份和回滚。
> https://github.com/haotian-lu-prog/dsh-update-plugin
> `dsh plugin --profile web add dsh-update-plugin`

English:

> Tired of updating DSH in five places? `dsh-update-plugin` updates the CLI, bundles and every profile plugin in one command. There is also a DSH Web plugin with a Check for Updates row, channels, backups and rollback.
> https://github.com/haotian-lu-prog/dsh-update-plugin
> `dsh plugin --profile web add dsh-update-plugin`

---

## Reddit / V2EX / forum post

**Title**

One command to update DeepSeek Harness and all profile plugins (plus a DSH Web plugin)

**Body**

I built `dsh-update-plugin` for the DSH community. It updates the global CLI, the
bundled `@deepseek-ai/dsh-*` packages and every plugin under
`~/.dsh/profiles/*` in one command.

It compares all npm dist-tags, so it can pick up `next` / `rc` releases that
`latest` does not point to, supports pnpm `minimumReleaseAge` with `--min-age`,
and creates a backup before every update. `--rollback` restores the previous
state.

There is also `dsh-update-plugin`, a DSH Web plugin that puts a
**Check for Updates...** row in Settings → General, plus a full settings page
with channels, profiles, backups and rollback, and a right-sidebar tab with an
update badge.

Install:

```bash
brew tap haotian-lu-prog/dsh-update-plugin
brew install dsh-update-plugin

dsh plugin --profile web add dsh-update-plugin
```

Feedback and compatibility reports are welcome:
https://github.com/haotian-lu-prog/dsh-update-plugin
