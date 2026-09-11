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
    var STYLE_ID = "dsh-update-plugin-style";

    var CSS = [
      ".dsh-update-plugin-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:4px 0}",
      ".dsh-update-plugin-main{display:flex;flex-direction:column;gap:2px;min-width:0}",
      ".dsh-update-plugin-title{color:var(--dsw-alias-label-primary,#fff);font-size:14px;line-height:20px;font-weight:500}",
      ".dsh-update-plugin-desc{color:var(--dsw-alias-label-secondary,#c2c4ca);font-size:12px;line-height:18px}",
      ".dsh-update-plugin-meta{color:var(--dsw-alias-label-tertiary,#9da1aa);font-size:12px;line-height:18px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}",
      ".dsh-update-plugin-control{display:flex;align-items:center;gap:8px;flex:0 0 auto}",
      ".dsh-update-plugin-btn{display:inline-flex;align-items:center;justify-content:center;min-height:28px;padding:0 10px;border:1px solid var(--dsw-alias-border-l2,#4b4d52);border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary,#b8bbc2);font:inherit;font-size:12px;line-height:18px;white-space:nowrap;cursor:pointer}",
      ".dsh-update-plugin-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#3a3b3f);color:var(--dsw-alias-label-primary,#fff)}",
      ".dsh-update-plugin-btn:disabled{cursor:not-allowed;opacity:.55}",
      ".dsh-update-plugin-btn-primary{border-color:var(--dsw-alias-state-business-primary,#4f8cff);background:var(--dsw-alias-state-business-primary,#4f8cff);color:#fff}",
      ".dsh-update-plugin-btn-primary:hover:not(:disabled){background:var(--dsw-alias-state-business-primary-hover,#3d7bea);color:#fff}",
      ".dsh-update-plugin-error{color:var(--dsw-alias-state-error-primary,#ff6464);font-size:12px;line-height:18px;word-break:break-word}",
      ".dsh-update-plugin-manual{margin-top:6px;display:flex;flex-direction:column;gap:4px}",
      ".dsh-update-plugin-manual code{display:block;overflow:auto;white-space:nowrap;border-radius:6px;padding:6px 8px;background:var(--dsw-alias-bg-layer-3,#252527);color:var(--dsw-alias-label-secondary,#c2c4ca);font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px;line-height:16px}",
    ].join("");

    var ZH = {
      title: "检查更新",
      check: "检查更新",
      update: "立即更新",
      checking: "正在检查…",
      latest: "已是最新版本",
      found: "发现新版本 {version}",
      updating: "正在更新…",
      phase: "阶段：{phase}",
      failed: "检查或更新失败",
      partial: "部分更新失败",
      restart: "更新完成，请重启 DSH",
      current: "当前 {version}",
      target: "最新 {version}",
      profiles: "{count} 个 profile",
      manual: "自动更新失败时，可在终端执行：",
      recheck: "重新检查",
      forbidden: "仅本机 DSH Web 可以执行更新。",
    };

    var EN = {
      title: "Check for Updates...",
      check: "Check for updates",
      update: "Update now",
      checking: "Checking...",
      latest: "You are up to date",
      found: "New version available: {version}",
      updating: "Updating...",
      phase: "Phase: {phase}",
      failed: "Update check or update failed",
      partial: "Some updates failed",
      restart: "Update complete. Restart DSH.",
      current: "Current {version}",
      target: "Latest {version}",
      profiles: "{count} profiles",
      manual: "If automatic update fails, run this in a terminal:",
      recheck: "Check again",
      forbidden: "Updates can only be started from a local DSH Web page.",
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
      if (options && options.headers) {
        Object.assign(headers, options.headers);
      }
      return fetch(url, {
        credentials: "same-origin",
        ...(options || {}),
        headers: headers,
      });
    }

    function getStatus(refresh) {
      return request(STATUS_PATH + (refresh ? "?refresh=1" : "")).then(function (response) {
        return response.json().catch(function () {
          return { error: "HTTP " + response.status };
        });
      });
    }

    function startUpdate() {
      return request(UPDATE_PATH, { method: "POST" }).then(function (response) {
        return response.json().catch(function () {
          return { error: "HTTP " + response.status };
        });
      });
    }

    function statusText(t, data, error) {
      if (error) return t("failed");
      if (!data) return t("checking");
      if (data.running) {
        var phase = data.phase && data.phase !== "idle" ? " · " + t("phase", { phase: data.phase }) : "";
        return t("updating") + phase;
      }
      if (data.result && data.result.ok === false) return t("partial");
      if (data.restartRequired) return t("restart");
      if (data.updateAvailable) return t("found", { version: data.targetVersion || "?" });
      if (data.currentVersion) return t("latest");
      return t("checking");
    }

    function UpdateRow(props) {
      var t = props.t;
      var state = React.useState({ loading: true, data: null, error: null });
      var value = state[0];
      var setValue = state[1];

      var load = React.useCallback(function (refresh) {
        setValue(function (previous) {
          return { loading: true, data: previous.data, error: null };
        });
        getStatus(Boolean(refresh))
          .then(function (data) {
            var message = data && (data.error || data.targetError) ? String(data.error || data.targetError) : null;
            setValue({ loading: false, data: data, error: message });
          })
          .catch(function (error) {
            setValue({ loading: false, data: null, error: String((error && error.message) || error) });
          });
      }, []);

      React.useEffect(
        function () {
          load(false);
        },
        [load],
      );

      var running = Boolean(value.data && value.data.running);
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

      var data = value.data || {};
      var profileName = data.profileName || "web";
      var description = statusText(t, value.data, value.error);
      var metaParts = [];
      if (data.currentVersion) metaParts.push(t("current", { version: data.currentVersion }));
      if (data.targetVersion) metaParts.push(t("target", { version: data.targetVersion }));
      if (data.profiles && data.profiles.length) metaParts.push(t("profiles", { count: data.profiles.length }));
      var meta = metaParts.join(" · ");

      var children = [
        h(
          "div",
          { className: "dsh-update-plugin-main", key: "main" },
          [
            h("div", { className: "dsh-update-plugin-title", key: "title" }, t("title")),
            h("div", { className: "dsh-update-plugin-desc", key: "desc" }, description),
            meta ? h("div", { className: "dsh-update-plugin-meta", key: "meta" }, meta) : null,
            value.error ? h("div", { className: "dsh-update-plugin-error", key: "error" }, value.error) : null,
          ],
        ),
        h(
          "div",
          { className: "dsh-update-plugin-control", key: "control" },
          [
            h(
              "button",
              {
                key: "check",
                type: "button",
                className: "dsh-update-plugin-btn",
                disabled: value.loading || running,
                onClick: function () {
                  load(true);
                },
              },
              t("check"),
            ),
            h(
              "button",
              {
                key: "update",
                type: "button",
                className: "dsh-update-plugin-btn dsh-update-plugin-btn-primary",
                disabled: value.loading || running || !data.updateAvailable,
                onClick: function () {
                  startUpdate()
                    .then(function (result) {
                      if (result && result.error) {
                        setValue({ loading: false, data: value.data, error: result.error });
                        return;
                      }
                      load(false);
                    })
                    .catch(function (error) {
                      setValue({ loading: false, data: value.data, error: String((error && error.message) || error) });
                    });
                },
              },
              t("update"),
            ),
          ],
        ),
      ];

      if (value.error) {
        children.push(
          h(
            "div",
            { className: "dsh-update-plugin-manual", key: "manual" },
            [
              h("div", { className: "dsh-update-plugin-desc", key: "label" }, t("manual")),
              h("code", { key: "cmd1" }, "dsh plugin --profile " + profileName + " update --latest"),
              h("code", { key: "cmd2" }, "dsh plugin --profile " + profileName + " add dsh-update-plugin@latest"),
            ],
          ),
        );
      }

      return h("div", { className: "dsh-update-plugin-row" }, children);
    }

    function apply(ctx) {
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

      ctx.slots.inject("settings.general.item", function () {
        return ctx.slots.register(
          {
            name: "settings.general.item",
            id: "dsh-update-plugin",
            order: 80,
            locale: NS,
            inject: function () {
              return {};
            },
          },
          UpdateRow,
        );
      });
    }

    module.exports.name = "dsh-update-plugin";
    module.exports.apply = apply;
    module.exports.inject = ["slots", "locale"];
    return module.exports;
  },
});
