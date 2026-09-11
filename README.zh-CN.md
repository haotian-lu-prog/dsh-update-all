# dsh-update-all

[![CI](https://github.com/haotian-lu-prog/dsh-update-all/actions/workflows/ci.yml/badge.svg)](https://github.com/haotian-lu-prog/dsh-update-all/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

一条命令更新 **DeepSeek Harness (DSH)**、随包的 `@deepseek-ai/dsh-*` 以及
**所有 profile 插件**。

[English](README.md) · [更新日志](CHANGELOG.md) · [贡献指南](CONTRIBUTING.md)

---

## 为什么需要它

DSH 的更新通常分散在至少两个地方：

1. 全局 CLI 包 `@deepseek-ai/dsh`——它同时携带所有
   `@deepseek-ai/dsh-*` bundle；
2. `~/.dsh/profiles/<name>` 下的每个 profile——社区插件本质上是每个
   profile 的普通 `pnpm` 依赖。

手动更新意味着要记住 `npm install -g @deepseek-ai/dsh@next`，然后
`dsh plugin --profile web update`，还要对每个 profile 重复一遍。本工具会
全部处理：自动发现新 profile、新插件，并且知道 npm 的 `latest` dist-tag
对 DSH 来说并不一定是最新版本。

## 特性

- **一条命令**：`dsh-update-all`。
- **CLI + 插件**：同时更新全局 CLI 和所有 profile 的插件。
- **真正最新**：比较 npm 的**所有** dist-tag（`latest`、`next`、`alpha`…），
  不盲信 `latest`。
- **面向未来**：从 `$DSH_HOME/profiles/*/package.json` 动态发现 profile，
  以后新增 profile/插件无需改脚本。
- **识别安装方式**：根据 `dsh` 的真实安装位置选择 `npm` 或 `pnpm`。
- **默认安全**：每次实际更新前自动备份，支持 `--rollback` 一键回滚。
- **预览模式**：`--dry-run` 只显示将要执行的操作。
- **可控通道**：`--channel stable|next|alpha|auto`，以及用于 pnpm
  `minimumReleaseAge` 的 `--min-age <分钟>`。
- **体积小**：单个 Bash 脚本，兼容 macOS 自带的 Bash 3.2。

## 环境要求

- macOS 或 Linux（WSL 可用）
- `bash` 3.2 及以上
- `node`（DSH 本身就需要 Node.js）
- `npm`（查询 registry；当 DSH 由 npm 安装时也用于更新 DSH）
- `pnpm` 通过 `dsh plugin` 调用，DSH 安装中已有
- 已安装 DSH——没有也可以用它来引导安装

## 安装

### 一行安装

```bash
curl -fsSL https://github.com/haotian-lu-prog/dsh-update-all/releases/latest/download/install.sh | bash
```

安装器会从 `refs/heads/main` 拉取最新版 updater。若想直接用 main 分支上的安装器：

```bash
curl -fsSL https://raw.githubusercontent.com/haotian-lu-prog/dsh-update-all/refs/heads/main/install.sh | bash
```

### 手动安装

```bash
git clone https://github.com/haotian-lu-prog/dsh-update-all.git
cd dsh-update-all
./install.sh --local dsh-update-all.sh
```

### 本地直接运行（不安装）

```bash
bash ./dsh-update-all.sh --dry-run
```

如果 `~/.local/bin` 不在 `PATH` 中，安装脚本会提示需要添加的配置。

## 使用

```bash
# 更新所有东西到最新（默认）
dsh-update-all

# 只预览，不做修改
dsh-update-all --dry-run

# 只跟随 stable（latest）通道
dsh-update-all --channel stable

# 保守模式：只接受发布满 24 小时的版本
dsh-update-all --min-age 1440

# 只更新一个 profile
dsh-update-all --profile web

# 只更新 CLI / 只更新插件
dsh-update-all --no-plugins
dsh-update-all --no-cli

# 跳过确认（脚本 / cron）
dsh-update-all --yes

# 查看备份并回滚
dsh-update-all --list-backups
dsh-update-all --rollback
dsh-update-all --rollback 20260911T211500
```

更新完成后请重启正在运行的 `dsh web` / DSH 会话。

## 选项

| 选项 | 说明 |
| --- | --- |
| `--channel <auto\|stable\|next\|alpha>` | 跟随哪个 npm dist-tag。`auto`（默认）取所有 tag 中版本最高者；`stable` 即 `latest`。 |
| `--min-age <分钟>` | 只接受发布满 N 分钟的版本。`0`（默认）总是最新；`1440` = 24 小时。 |
| `--profile <name>` | 只更新指定 profile，可重复。 |
| `--no-cli` | 不更新全局 `dsh` CLI。 |
| `--no-plugins` | 不更新 profile 插件。 |
| `--no-backup` | 跳过自动备份。 |
| `-n`、`--dry-run`、`--check` | 只打印计划，不做任何修改。 |
| `-y`、`--yes` | 跳过确认。 |
| `--list-backups` | 列出可用备份。 |
| `--rollback [id]` | 回滚到指定备份（默认最新）。 |
| `--install` | 把本脚本安装到 `~/.local/bin`。 |
| `-h`、`--help` | 查看帮助。 |
| `-V`、`--version` | 查看 updater 版本。 |

### 环境变量

| 变量 | 默认值 | 含义 |
| --- | --- | --- |
| `DSH_HOME` | `~/.dsh` | DSH home 目录。 |
| `DSH_UPDATE_CHANNEL` | `auto` | 同 `--channel`。 |
| `DSH_UPDATE_MIN_AGE` | `0` | 同 `--min-age`。 |
| `DSH_NPM_CACHE` | `~/.cache/dsh-update/npm` | 元数据与全局安装使用的 npm cache。 |
| `DSH_UPDATE_BACKUP_DIR` | `$DSH_HOME/update-backups` | 备份目录。 |
| `DSH_UPDATE_INSTALL_DIR` | `~/.local/bin` | `--install` / `install.sh` 的安装目录。 |
| `NO_COLOR` | 未设置 | 设置后关闭彩色输出。 |

## 工作原理

1. **解析目标版本**：向 npm 查询 `@deepseek-ai/dsh` 的 `dist-tags`，按
   semver 规则比较。默认 `--channel auto` 取最高版本，因此能拿到比
   `latest` 更新的 `next` 版本。
2. **识别安装方式**：解析 `dsh` 背后的真实路径，选择 `npm` 或 `pnpm` 全局安装。
3. **备份**：把每个选中 profile 的 `package.json` 与 `pnpm-lock.yaml`，以及
   当前 CLI 版本，复制到 `$DSH_HOME/update-backups/<时间戳>/` 并写入
   `manifest.json`。
4. **更新 CLI 与 bundle**：一次全局安装即可更新 `@deepseek-ai/dsh` 及其全部
   `@deepseek-ai/dsh-*` 依赖。
5. **更新 profile**：对每个有依赖的 profile 执行
   `dsh plugin --profile <name> update --latest`，必要时回退到 profile 目录里的
   `pnpm update --latest`。
6. **收尾**：打印新的 CLI 版本，并提醒重启 DSH。

## 安全与回滚

- 先预览：`dsh-update-all --dry-run`。
- 每次实际更新默认都会备份，位置在 `~/.dsh/update-backups/`。
- 一键回滚（恢复 profile 清单、lockfile、依赖以及旧版 CLI）：

  ```bash
  dsh-update-all --rollback
  ```

- 默认会给 pnpm 传 `--config.minimum-release-age=0`，即不等待 24 小时供应链延迟。
  如需更保守：`dsh-update-all --min-age 1440`（或
  `DSH_UPDATE_MIN_AGE=1440`）。
- 本工具只写入你的 DSH home 以及全局 npm/pnpm 前缀，不会向任何其他服务器
  发送数据；npm/pnpm 只会访问它们各自的 registry。

## 常见问题

**为什么 `latest` 不是最新版？**
DSH 目前仍在发布预发布版，例如某段时间 `latest` 是 `0.1.5-rc.1`，而 `next`
已经是 `0.1.5-rc.2`。`--channel auto` 会比较所有 dist-tag，选取真正的最高版本。

**会把插件更新到发布不足 24 小时的新版本吗？**
默认 `--min-age 0` 会。需要延迟保护请加 `--min-age 1440`。

**我是用 pnpm 安装的 DSH，能用吗？**
可以。脚本会检测 `dsh` 可执行文件的真实路径，并用对应的包管理器更新。

**会更新 DSH Desktop 吗？**
不会。本项目更新 CLI 和 profile 插件；桌面端有自己的更新机制。

**Windows 能用吗？**
请在 WSL 或 Git Bash 中使用；原生 PowerShell 不支持。CI 覆盖 macOS 与 Linux。

**没有 profile 怎么办？**
没关系，插件步骤会自动跳过，CLI 及其 bundle 仍会更新。

## 贡献

欢迎提 Issue 和 PR。本地开发与测试说明见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

[MIT](LICENSE)
