// dsh-update-plugin browser half.
//
// Built in the DSH lazy-CJS bundle format: executing this file only registers
// a factory; the module body (styles, locale, slot registration) runs when the
// browser materializes the module.

window.__ModuleLoader__.load({
  id: "dsh-update-plugin",
  factory: (require) => {
    var module = { exports: {} };
    Object.defineProperty(module.exports, Symbol.toStringTag, { value: "Module" });

    var React = require("react");
    var h = React.createElement;

    var NS = "dsh-update-plugin";
    var HEADER = "x-dsh-update-plugin";
    var STATUS_PATH = "/api/dsh-update-plugin/status";
    var UPDATE_PATH = "/api/dsh-update-plugin/update";
    var CONFIG_PATH = "/api/dsh-update-plugin/config";
    var BACKUPS_PATH = "/api/dsh-update-plugin/backups";
    var ROLLBACK_PATH = "/api/dsh-update-plugin/rollback";
    var STYLE_ID = "dsh-update-plugin-style";
    var SIDEBAR_ID = "dsh-update-plugin";

    var CSS = [
      ".dsu-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:4px 0}",
      ".dsu-main{display:flex;flex-direction:column;gap:2px;min-width:0}",
      ".dsu-title{color:var(--dsw-alias-label-primary,#fff);font-size:14px;line-height:20px;font-weight:500}",
      ".dsu-desc{color:var(--dsw-alias-label-secondary,#c2c4ca);font-size:12px;line-height:18px}",
      ".dsu-meta{color:var(--dsw-alias-label-tertiary,#9da1aa);font-size:12px;line-height:18px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}",
      ".dsu-control{display:flex;align-items:center;gap:8px;flex:0 0 auto}",
      ".dsu-btn{display:inline-flex;align-items:center;justify-content:center;min-height:28px;padding:0 10px;border:1px solid var(--dsw-alias-border-l2,#4b4d52);border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary,#b8bbc2);font:inherit;font-size:12px;line-height:18px;white-space:nowrap;cursor:pointer}",
      ".dsu-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#3a3b3f);color:var(--dsw-alias-label-primary,#fff)}",
      ".dsu-btn:disabled{cursor:not-allowed;opacity:.55}",
      ".dsu-btn-primary{border-color:var(--dsw-alias-state-business-primary,#4f8cff);background:var(--dsw-alias-state-business-primary,#4f8cff);color:#fff}",
      ".dsu-btn-primary:hover:not(:disabled){background:var(--dsw-alias-state-business-primary-hover,#3d7bea);color:#fff}",
      ".dsu-error{color:var(--dsw-alias-state-error-primary,#ff6464);font-size:12px;line-height:18px;word-break:break-word}",
      ".dsu-ok{color:var(--dsw-alias-state-success-primary,#36d67a);font-size:12px;line-height:18px}",
      ".dsu-manual{display:flex;flex-direction:column;gap:4px;margin-top:6px}",
      ".dsu-manual code,.dsu-log{display:block;overflow:auto;white-space:pre-wrap;border-radius:6px;padding:6px 8px;background:var(--dsw-alias-bg-layer-3,#252527);color:var(--dsw-alias-label-secondary,#c2c4ca);font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px;line-height:16px}",
      ".dsu-page{display:flex;flex-direction:column;gap:16px;padding:4px 2px 24px;max-width:820px}",
      ".dsu-card{display:flex;flex-direction:column;gap:10px;border:1px solid var(--dsw-alias-border-l2,#3a3b3f);border-radius:10px;padding:14px}",
      ".dsu-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}",
      ".dsu-card-title{color:var(--dsw-alias-label-primary,#fff);font-size:14px;line-height:20px;font-weight:600}",
      ".dsu-field{display:flex;align-items:center;justify-content:space-between;gap:12px}",
      ".dsu-field-label{display:flex;flex-direction:column;gap:2px;min-width:0}",
      ".dsu-select,.dsu-input{min-height:28px;border:1px solid var(--dsw-alias-border-l2,#4b4d52);border-radius:7px;background:var(--dsw-alias-bg-layer-3,#252527);color:var(--dsw-alias-label-primary,#fff);font:inherit;font-size:12px;padding:0 8px}",
      ".dsu-input{width:72px}",
      ".dsu-list{display:flex;flex-direction:column;gap:6px;margin:0;padding:0;list-style:none}",
      ".dsu-list-item{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#c2c4ca)}",
      ".dsu-list-item code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--dsw-alias-label-primary,#fff)}",
      ".dsu-backup{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--dsw-alias-border-l2,#3a3b3f)}",
      ".dsu-backup:last-child{border-bottom:none}",
      ".dsu-badge{display:inline-block;width:7px;height:7px;margin-left:6px;border-radius:50%;background:var(--dsw-alias-state-error-primary,#ff6464);vertical-align:middle}",
      ".dsu-empty{color:var(--dsw-alias-label-tertiary,#9da1aa);font-size:12px;line-height:18px}",
      ".dsu-link{border:none;background:transparent;padding:0;color:var(--dsw-alias-state-business-primary,#4f8cff);font:inherit;font-size:12px;cursor:pointer}",
    ].join("");

    var ZH = {
      title: "检查更新",
      sidebarDescription: "检查并更新 DSH CLI 和所有 profile 插件",
      check: "检查更新",
      recheck: "重新检查",
      update: "立即更新",
      checking: "正在检查…",
      latest: "已是最新版本",
      found: "发现新版本 {version}",
      updating: "正在更新…",
      rollbacking: "正在回滚…",
      phase: "阶段：{phase}",
      failed: "检查或更新失败",
      partial: "部分更新失败",
      restart: "更新完成，请重启 DSH",
      current: "当前 {version}",
      target: "最新 {version}",
      profiles: "{count} 个 profile",
      manual: "自动更新失败时，可在终端执行：",
      openSidebar: "打开侧边卡片",
      statusTitle: "状态",
      settingsTitle: "更新设置",
      profilesTitle: "Profiles",
      backupsTitle: "备份",
      channel: "更新频道",
      channelHint: "auto 会从所有 dist-tag 中选最高版本",
      channelAuto: "自动（最高版本）",
      channelStable: "stable（latest）",
      channelNext: "next（预发布）",
      channelAlpha: "alpha（内测）",
      minAge: "最小释出时间",
      minAgeUnit: "分钟",
      minAgeHint: "0 = 总是最新；1440 = 24 小时",
      save: "保存",
      saved: "已保存",
      saveFailed: "保存失败",
      profilesCount: "{count} 个依赖",
      noBackups: "暂无备份",
      backupMeta: "{date} · CLI {version} · {profiles}",
      rollback: "回滚",
      rollbackConfirm: "确定回滚到这个备份吗？DSH 会自动恢复 package.json / lockfile 并重装依赖。",
      rollbackStarted: "正在回滚…",
      rollbackDone: "回滚完成，请重启 DSH",
      rollbackFailed: "回滚失败",
      refresh: "刷新",
      sidebarPanelTitle: "DSH 更新",
      viewSettingsHint: "更多设置请到 设置 → 通用设置 / 更新。",
      forbidden: "仅本机 DSH Web 可以执行此操作。",
      noJob: "空闲",
      badgeUpdate: "有可用更新",
    };

    var EN = {
      title: "Check for Updates...",
      sidebarDescription: "Check and update the DSH CLI and all profile plugins",
      check: "Check for updates",
      recheck: "Check again",
      update: "Update now",
      checking: "Checking...",
      latest: "You are up to date",
      found: "New version available: {version}",
      updating: "Updating...",
      rollbacking: "Rolling back...",
      phase: "Phase: {phase}",
      failed: "Update check or update failed",
      partial: "Some updates failed",
      restart: "Update complete. Restart DSH.",
      current: "Current {version}",
      target: "Latest {version}",
      profiles: "{count} profiles",
      manual: "If automatic update fails, run this in a terminal:",
      openSidebar: "Open side card",
      statusTitle: "Status",
      settingsTitle: "Update settings",
      profilesTitle: "Profiles",
      backupsTitle: "Backups",
      channel: "Update channel",
      channelHint: "auto picks the highest version across all dist-tags",
      channelAuto: "Auto (highest version)",
      channelStable: "stable (latest)",
      channelNext: "next (prerelease)",
      channelAlpha: "alpha (canary)",
      minAge: "Minimum release age",
      minAgeUnit: "minutes",
      minAgeHint: "0 = always newest; 1440 = 24 hours",
      save: "Save",
      saved: "Saved",
      saveFailed: "Save failed",
      profilesCount: "{count} dependencies",
      noBackups: "No backups yet",
      backupMeta: "{date} · CLI {version} · {profiles}",
      rollback: "Roll back",
      rollbackConfirm: "Roll back to this backup? DSH will restore package.json / lockfile and reinstall dependencies.",
      rollbackStarted: "Rolling back...",
      rollbackDone: "Rollback complete. Restart DSH.",
      rollbackFailed: "Rollback failed",
      refresh: "Refresh",
      sidebarPanelTitle: "DSH updates",
      viewSettingsHint: "More settings live in Settings → General / Updates.",
      forbidden: "This action is only available from a local DSH Web page.",
      noJob: "Idle",
      badgeUpdate: "Update available",
    };

    function injectStyle() {
      if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
      var style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    function removeStyle() {
      if (typeof document === "undefined") return;
      var style = document.getElementById(STYLE_ID);
      if (style) style.remove();
    }

    function request(url, options) {
      var headers = { [HEADER]: "1" };
      if (options && options.headers) Object.assign(headers, options.headers);
      return fetch(url, { credentials: "same-origin", ...(options || {}), headers: headers });
    }

    function parseJson(response) {
      return response.json().catch(function () {
        return { error: "HTTP " + response.status };
      });
    }

    function getStatus(refresh) {
      return request(STATUS_PATH + (refresh ? "?refresh=1" : "")).then(parseJson);
    }

    function startUpdate() {
      return request(UPDATE_PATH, { method: "POST" }).then(parseJson);
    }

    function getConfig() {
      return request(CONFIG_PATH).then(parseJson);
    }

    function saveConfig(config) {
      return request(CONFIG_PATH, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(config),
      }).then(parseJson);
    }

    function getBackups() {
      return request(BACKUPS_PATH).then(parseJson);
    }

    function startRollback(id) {
      return request(ROLLBACK_PATH, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: id }),
      }).then(parseJson);
    }

    function manualCommands(profileName) {
      return [
        "dsh plugin --profile " + (profileName || "web") + " update --latest",
        "dsh plugin --profile " + (profileName || "web") + " add dsh-update-plugin@latest",
      ];
    }

    function statusText(t, data, error) {
      if (error) return t("failed");
      if (!data) return t("checking");
      if (data.running) {
        var phase = data.phase && data.phase !== "idle" ? " · " + t("phase", { phase: data.phase }) : "";
        return (data.kind === "rollback" ? t("rollbacking") : t("updating")) + phase;
      }
      if (data.kind === "rollback" && data.restartRequired) return t("rollbackDone");
      if (data.result && data.result.ok === false) return data.kind === "rollback" ? t("rollbackFailed") : t("partial");
      if (data.restartRequired) return t("restart");
      if (data.updateAvailable) return t("found", { version: data.targetVersion || "?" });
      if (data.currentVersion) return t("latest");
      return t("checking");
    }

    function metaText(t, data) {
      if (!data) return "";
      var parts = [];
      if (data.currentVersion) parts.push(t("current", { version: data.currentVersion }));
      if (data.targetVersion) parts.push(t("target", { version: data.targetVersion }));
      if (data.profiles && data.profiles.length) parts.push(t("profiles", { count: data.profiles.length }));
      return parts.join(" · ");
    }

    function useUpdater(t) {
      var pair = React.useState({ loading: true, data: null, error: null });
      var state = pair[0];
      var setState = pair[1];

      var load = React.useCallback(function (refresh) {
        setState(function (previous) {
          return { loading: true, data: previous.data, error: null };
        });
        return getStatus(Boolean(refresh))
          .then(function (data) {
            var message = data && (data.error || data.targetError) ? String(data.error || data.targetError) : null;
            setState({ loading: false, data: data, error: message });
            return data;
          })
          .catch(function (error) {
            setState({ loading: false, data: null, error: String((error && error.message) || error) });
            return null;
          });
      }, []);

      React.useEffect(
        function () {
          load(false);
        },
        [load],
      );

      var running = Boolean(state.data && state.data.running);
      React.useEffect(
        function () {
          if (!running) return undefined;
          var timer = setInterval(function () {
            load(false);
          }, 1500);
          return function () {
            clearInterval(timer);
          };
        },
        [running, load],
      );

      var update = React.useCallback(function () {
        setState(function (previous) {
          return { loading: true, data: previous.data, error: null };
        });
        return startUpdate()
          .then(function (result) {
            if (result && result.error) {
              setState(function (previous) {
                return { loading: false, data: previous.data, error: result.error };
              });
              return result;
            }
            return load(false);
          })
          .catch(function (error) {
            setState(function (previous) {
              return { loading: false, data: previous.data, error: String((error && error.message) || error) };
            });
            return null;
          });
      }, [load]);

      return { state: state, load: load, update: update, running: running };
    }

    function useConfig(t) {
      var pair = React.useState({ loading: true, config: null, error: null, saved: false });
      var state = pair[0];
      var setState = pair[1];

      var load = React.useCallback(function () {
        return getConfig()
          .then(function (config) {
            setState({ loading: false, config: config, error: config && config.error ? config.error : null, saved: false });
          })
          .catch(function (error) {
            setState({ loading: false, config: null, error: String((error && error.message) || error), saved: false });
          });
      }, []);

      React.useEffect(
        function () {
          load();
        },
        [load],
      );

      var save = React.useCallback(function (config) {
        setState(function (previous) {
          return { loading: true, config: previous.config, error: null, saved: false };
        });
        return saveConfig(config)
          .then(function (next) {
            if (next && next.error) {
              setState({ loading: false, config: config, error: next.error, saved: false });
              return null;
            }
            setState({ loading: false, config: next, error: null, saved: true });
            return next;
          })
          .catch(function (error) {
            setState({ loading: false, config: config, error: String((error && error.message) || error), saved: false });
            return null;
          });
      }, []);

      return { state: state, load: load, save: save };
    }

    function useBackups(t) {
      var pair = React.useState({ loading: true, backups: [], error: null });
      var state = pair[0];
      var setState = pair[1];

      var load = React.useCallback(function () {
        return getBackups()
          .then(function (result) {
            if (result && result.error) {
              setState({ loading: false, backups: [], error: result.error });
              return;
            }
            setState({ loading: false, backups: (result && result.backups) || [], error: null });
          })
          .catch(function (error) {
            setState({ loading: false, backups: [], error: String((error && error.message) || error) });
          });
      }, []);

      React.useEffect(
        function () {
          load();
        },
        [load],
      );

      return { state: state, load: load };
    }

    function UpdateRow(props) {
      var t = props.t;
      var updater = useUpdater(t);
      var data = updater.state.data || {};
      var description = statusText(t, updater.state.data, updater.state.error);
      var meta = metaText(t, updater.state.data);
      var showSidebar = typeof props.showSidebar === "function" && props.showSidebar();

      var children = [
        h(
          "div",
          { className: "dsu-main", key: "main" },
          [
            h("div", { className: "dsu-title", key: "title" }, t("title")),
            h("div", { className: "dsu-desc", key: "desc" }, description),
            meta ? h("div", { className: "dsu-meta", key: "meta" }, meta) : null,
            updater.state.error ? h("div", { className: "dsu-error", key: "error" }, updater.state.error) : null,
          ],
        ),
        h(
          "div",
          { className: "dsu-control", key: "control" },
          [
            showSidebar
              ? h(
                  "button",
                  {
                    key: "sidebar",
                    type: "button",
                    className: "dsu-link",
                    onClick: function () {
                      if (typeof props.openSidebar === "function") props.openSidebar();
                    },
                  },
                  t("openSidebar"),
                )
              : null,
            h(
              "button",
              {
                key: "check",
                type: "button",
                className: "dsu-btn",
                disabled: updater.state.loading || updater.running,
                onClick: function () {
                  updater.load(true);
                },
              },
              t("check"),
            ),
            h(
              "button",
              {
                key: "update",
                type: "button",
                className: "dsu-btn dsu-btn-primary",
                disabled: updater.state.loading || updater.running || !data.updateAvailable,
                onClick: function () {
                  updater.update();
                },
              },
              t("update"),
            ),
          ],
        ),
      ];

      if (updater.state.error) {
        children.push(
          h(
            "div",
            { className: "dsu-manual", key: "manual" },
            [h("div", { className: "dsu-desc", key: "label" }, t("manual"))].concat(
              manualCommands(data.profileName).map(function (command, index) {
                return h("code", { key: "cmd" + index }, command);
              }),
            ),
          ),
        );
      }

      return h("div", { className: "dsu-row" }, children);
    }

    function SettingsPage(props) {
      var t = props.t;
      var updater = useUpdater(t);
      var configState = useConfig(t);
      var backupsState = useBackups(t);
      var draftPair = React.useState({ channel: "auto", minAge: 0 });
      var draft = draftPair[0];
      var setDraft = draftPair[1];

      React.useEffect(
        function () {
          if (configState.state.config) {
            setDraft({
              channel: configState.state.config.channel || "auto",
              minAge: Number.isInteger(configState.state.config.minAge) ? configState.state.config.minAge : 0,
            });
          }
        },
        [configState.state.config],
      );

      var restartRequired = Boolean(updater.state.data && updater.state.data.restartRequired);
      React.useEffect(
        function () {
          if (restartRequired) {
            backupsState.load();
          }
        },
        [restartRequired, backupsState.load],
      );

      var data = updater.state.data || {};
      var profiles = data.profiles || [];
      var backups = backupsState.state.backups || [];

      function saveDraft() {
        configState.save({
          channel: draft.channel,
          minAge: Number(draft.minAge) || 0,
        });
      }

      function rollback(id) {
        if (typeof window !== "undefined" && typeof window.confirm === "function" && !window.confirm(t("rollbackConfirm"))) {
          return;
        }
        startRollback(id).then(function (result) {
          if (result && result.error) {
            updater.load(false);
            return;
          }
          updater.load(false);
        });
      }

      return h("div", { className: "dsu-page" }, [
        h(
          "div",
          { className: "dsu-card", key: "status" },
          [
            h(
              "div",
              { className: "dsu-card-head", key: "head" },
              [
                h("div", { className: "dsu-main", key: "main" }, [
                  h("div", { className: "dsu-card-title", key: "title" }, t("statusTitle")),
                  h("div", { className: "dsu-desc", key: "desc" }, statusText(t, updater.state.data, updater.state.error)),
                  h("div", { className: "dsu-meta", key: "meta" }, metaText(t, updater.state.data)),
                ]),
                h("div", { className: "dsu-control", key: "control" }, [
                  h(
                    "button",
                    {
                      key: "check",
                      type: "button",
                      className: "dsu-btn",
                      disabled: updater.state.loading || updater.running,
                      onClick: function () {
                        updater.load(true);
                      },
                    },
                    t("check"),
                  ),
                  h(
                    "button",
                    {
                      key: "update",
                      type: "button",
                      className: "dsu-btn dsu-btn-primary",
                      disabled: updater.state.loading || updater.running || !data.updateAvailable,
                      onClick: function () {
                        updater.update();
                      },
                    },
                    t("update"),
                  ),
                ]),
              ],
            ),
            updater.state.error ? h("div", { className: "dsu-error", key: "error" }, updater.state.error) : null,
            data.logs && data.logs.length
              ? h("pre", { className: "dsu-log", key: "log" }, data.logs.slice(-12).join("\n"))
              : null,
            updater.state.error
              ? h(
                  "div",
                  { className: "dsu-manual", key: "manual" },
                  [h("div", { className: "dsu-desc", key: "label" }, t("manual"))].concat(
                    manualCommands(data.profileName).map(function (command, index) {
                      return h("code", { key: "cmd" + index }, command);
                    }),
                  ),
                )
              : null,
          ],
        ),
        h(
          "div",
          { className: "dsu-card", key: "config" },
          [
            h("div", { className: "dsu-card-title", key: "title" }, t("settingsTitle")),
            h(
              "div",
              { className: "dsu-field", key: "channel" },
              [
                h("div", { className: "dsu-field-label", key: "label" }, [
                  h("div", { className: "dsu-title", key: "t" }, t("channel")),
                  h("div", { className: "dsu-desc", key: "d" }, t("channelHint")),
                ]),
                h(
                  "select",
                  {
                    key: "select",
                    className: "dsu-select",
                    value: draft.channel,
                    onChange: function (event) {
                      setDraft({ channel: event.target.value, minAge: draft.minAge });
                    },
                  },
                  [
                    h("option", { key: "auto", value: "auto" }, t("channelAuto")),
                    h("option", { key: "stable", value: "stable" }, t("channelStable")),
                    h("option", { key: "next", value: "next" }, t("channelNext")),
                    h("option", { key: "alpha", value: "alpha" }, t("channelAlpha")),
                  ],
                ),
              ],
            ),
            h(
              "div",
              { className: "dsu-field", key: "min-age" },
              [
                h("div", { className: "dsu-field-label", key: "label" }, [
                  h("div", { className: "dsu-title", key: "t" }, t("minAge")),
                  h("div", { className: "dsu-desc", key: "d" }, t("minAgeHint")),
                ]),
                h("div", { className: "dsu-control", key: "control" }, [
                  h("input", {
                    key: "input",
                    className: "dsu-input",
                    type: "number",
                    min: 0,
                    step: 60,
                    value: draft.minAge,
                    onChange: function (event) {
                      setDraft({ channel: draft.channel, minAge: Math.max(0, Number(event.target.value) || 0) });
                    },
                  }),
                  h("span", { className: "dsu-desc", key: "unit" }, t("minAgeUnit")),
                ]),
              ],
            ),
            h(
              "div",
              { className: "dsu-control", key: "actions" },
              [
                h(
                  "button",
                  { key: "save", type: "button", className: "dsu-btn dsu-btn-primary", disabled: configState.state.loading, onClick: saveDraft },
                  t("save"),
                ),
                configState.state.saved ? h("span", { key: "saved", className: "dsu-ok" }, t("saved")) : null,
                configState.state.error ? h("span", { key: "error", className: "dsu-error" }, configState.state.error) : null,
              ],
            ),
          ],
        ),
        h(
          "div",
          { className: "dsu-card", key: "profiles" },
          [
            h("div", { className: "dsu-card-title", key: "title" }, t("profilesTitle")),
            profiles.length
              ? h(
                  "ul",
                  { className: "dsu-list", key: "list" },
                  profiles.map(function (profile) {
                    return h(
                      "li",
                      { className: "dsu-list-item", key: profile.name },
                      [
                        h("code", { key: "name" }, profile.name),
                        h("span", { key: "count" }, t("profilesCount", { count: profile.dependencyCount })),
                      ],
                    );
                  }),
                )
              : h("div", { className: "dsu-empty", key: "empty" }, "—"),
          ],
        ),
        h(
          "div",
          { className: "dsu-card", key: "backups" },
          [
            h("div", { className: "dsu-card-title", key: "title" }, t("backupsTitle")),
            backups.length
              ? h(
                  "div",
                  { key: "list" },
                  backups.slice(0, 20).map(function (backup) {
                    var date = backup.createdAt ? new Date(backup.createdAt).toLocaleString() : backup.id;
                    var profileNames = Array.isArray(backup.profiles) ? backup.profiles.join(", ") : "";
                    return h(
                      "div",
                      { className: "dsu-backup", key: backup.id },
                      [
                        h("div", { className: "dsu-main", key: "main" }, [
                          h("div", { className: "dsu-title", key: "id" }, backup.id),
                          h("div", { className: "dsu-meta", key: "meta" }, t("backupMeta", {
                            date: date,
                            version: backup.cliVersion || "?",
                            profiles: profileNames || "—",
                          })),
                        ]),
                        h(
                          "button",
                          {
                            key: "rollback",
                            type: "button",
                            className: "dsu-btn",
                            disabled: updater.running,
                            onClick: function () {
                              rollback(backup.id);
                            },
                          },
                          t("rollback"),
                        ),
                      ],
                    );
                  }),
                )
              : h("div", { className: "dsu-empty", key: "empty" }, t("noBackups")),
          ],
        ),
      ]);
    }

    function UpdatePanel(props) {
      var t = props.t;
      var updater = useUpdater(t);
      var data = updater.state.data || {};
      var description = statusText(t, updater.state.data, updater.state.error);
      var meta = metaText(t, updater.state.data);

      return h("div", { className: "dsu-page", style: { padding: "12px", maxWidth: "none" } }, [
        h("div", { className: "dsu-card", key: "status" }, [
          h("div", { className: "dsu-main", key: "main" }, [
            h("div", { className: "dsu-title", key: "title" }, t("sidebarPanelTitle")),
            h("div", { className: "dsu-desc", key: "desc" }, description),
            meta ? h("div", { className: "dsu-meta", key: "meta" }, meta) : null,
            updater.state.error ? h("div", { className: "dsu-error", key: "error" }, updater.state.error) : null,
          ]),
          h("div", { className: "dsu-control", key: "control", style: { marginTop: "10px" } }, [
            h(
              "button",
              {
                key: "check",
                type: "button",
                className: "dsu-btn",
                disabled: updater.state.loading || updater.running,
                onClick: function () {
                  updater.load(true);
                },
              },
              t("check"),
            ),
            h(
              "button",
              {
                key: "update",
                type: "button",
                className: "dsu-btn dsu-btn-primary",
                disabled: updater.state.loading || updater.running || !data.updateAvailable,
                onClick: function () {
                  updater.update();
                },
              },
              t("update"),
            ),
          ]),
          data.logs && data.logs.length
            ? h("pre", { className: "dsu-log", key: "log", style: { marginTop: "10px" } }, data.logs.slice(-8).join("\n"))
            : null,
          h("div", { className: "dsu-desc", key: "hint", style: { marginTop: "10px" } }, t("viewSettingsHint")),
        ]),
      ]);
    }

    function SidebarTitle(props) {
      var t = props.t;
      var pair = React.useState({ updateAvailable: false, running: false });
      var state = pair[0];
      var setState = pair[1];

      React.useEffect(
        function () {
          var active = true;
          function tick() {
            getStatus(false)
              .then(function (data) {
                if (!active) return;
                setState({
                  updateAvailable: Boolean(data && data.updateAvailable),
                  running: Boolean(data && data.running),
                });
              })
              .catch(function () {});
          }
          tick();
          var timer = setInterval(tick, 30000);
          return function () {
            active = false;
            clearInterval(timer);
          };
        },
        [],
      );

      return h(
        "span",
        { className: "dsu-title" },
        [
          h("span", { key: "label" }, t("title")),
          state.updateAvailable || state.running
            ? h("span", { key: "badge", className: "dsu-badge", title: state.updateAvailable ? t("found", { version: "" }) : t("updating") })
            : null,
        ],
      );
    }

    function apply(ctx) {
      function t(key, params) {
        return ctx.locale.bind(NS)(key, params);
      }

      ctx.effect(
        function () {
          injectStyle();
          return removeStyle;
        },
        "dsh-update-plugin: styles",
      );

      ctx.effect(
        function () {
          return ctx.locale.register(NS, { zh: ZH, en: EN });
        },
        "dsh-update-plugin: dictionaries",
      );

      var sidebarRight = null;
      ctx.inject(["sidebarRightTabs", "sidebarRight"], function (sideCtx) {
        sidebarRight = sideCtx.sidebarRight;
        sideCtx.effect(
          function () {
            return sideCtx.sidebarRightTabs.register({
              id: SIDEBAR_ID,
              kind: SIDEBAR_ID,
              title: function () {
                return t("title");
              },
            });
          },
          "dsh-update-plugin: sidebar tab type",
        );
        sideCtx.effect(
          function () {
            return sideCtx.slots.register(
              { name: "sidebar.right.pane.tab", key: SIDEBAR_ID },
              function SidebarBodyWrapper(props) {
                return h(UpdatePanel, Object.assign({}, props, { t: t }));
              },
            );
          },
          "dsh-update-plugin: sidebar tab body",
        );
        sideCtx.effect(
          function () {
            return sideCtx.slots.register(
              { name: "sidebar.right.pane.tab.title", key: SIDEBAR_ID },
              function SidebarTitleWrapper() {
                return h(SidebarTitle, { t: t });
              },
            );
          },
          "dsh-update-plugin: sidebar tab title",
        );
      });

      ctx.slots.inject("settings.general.item", function () {
        return ctx.slots.register(
          {
            name: "settings.general.item",
            id: "dsh-update-plugin",
            order: 80,
            locale: NS,
            inject: function () {
              return {
                showSidebar: function () {
                  return Boolean(sidebarRight);
                },
                openSidebar: function () {
                  if (sidebarRight && typeof sidebarRight.openTab === "function") {
                    sidebarRight.openTab(SIDEBAR_ID);
                  }
                },
              };
            },
          },
          function GeneralRowWrapper(props) {
            return h(UpdateRow, Object.assign({}, props, { t: props.t || t }));
          },
        );
      });

      ctx.slots.inject("settings.section", function () {
        return ctx.slots.register(
          {
            name: "settings.section",
            id: "dsh-update-plugin",
            order: 80,
            label: function () {
              return t("title");
            },
            locale: NS,
          },
          function SettingsPageWrapper(props) {
            return h(SettingsPage, Object.assign({}, props, { t: props.t || t }));
          },
        );
      });
    }

    module.exports.name = "dsh-update-plugin";
    module.exports.apply = apply;
    module.exports.inject = ["slots", "locale"];
    return module.exports;
  },
});
