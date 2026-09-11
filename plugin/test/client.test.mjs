import assert from "node:assert/strict";
import test from "node:test";

test("client bundle registers the General row, settings page and sidebar card", async () => {
  let loaded;
  globalThis.window = {
    __ModuleLoader__: {
      load(entry) {
        loaded = entry;
      },
    },
  };

  await import("../lib/client.js");
  assert.ok(loaded, "bundle should call window.__ModuleLoader__.load");
  assert.equal(loaded.id, "dsh-update-plugin");
  assert.equal(typeof loaded.factory, "function");

  const fakeReact = {
    createElement() {
      return { type: "element" };
    },
    useState(value) {
      return [value, () => {}];
    },
    useEffect() {},
    useCallback(fn) {
      return fn;
    },
  };

  const exports = loaded.factory((id) => {
    if (id === "react") return fakeReact;
    throw new Error(`unexpected require: ${id}`);
  });

  assert.equal(exports.name, "dsh-update-plugin");
  assert.deepEqual(exports.inject, ["slots", "locale"]);
  assert.equal(typeof exports.apply, "function");

  const effects = [];
  const slotNames = [];
  const registrations = [];
  const tabTypes = [];
  const openTabs = [];

  const slots = {
    inject(name, callback) {
      slotNames.push(name);
      callback();
    },
    register(options, component) {
      registrations.push({ options, component });
      return () => {};
    },
  };

  const makeEffect = (fn) => {
    effects.push(fn() || (() => {}));
  };

  const ctx = {
    effect: makeEffect,
    locale: {
      bind() {
        return (key) => key;
      },
      register() {
        return () => {};
      },
    },
    slots,
    inject(deps, callback) {
      assert.deepEqual(deps, ["sidebarRightTabs", "sidebarRight"]);
      const sideCtx = {
        effect: makeEffect,
        slots,
        sidebarRight: {
          openTab(id) {
            openTabs.push(id);
          },
        },
        sidebarRightTabs: {
          register(definition) {
            tabTypes.push(definition);
            return () => {};
          },
        },
      };
      callback(sideCtx);
    },
  };

  exports.apply(ctx);

  assert.deepEqual(slotNames.sort(), ["settings.general.item", "settings.section"]);
  assert.equal(effects.length, 5);
  assert.equal(tabTypes.length, 1);
  assert.equal(tabTypes[0].id, "dsh-update-plugin");
  assert.equal(tabTypes[0].kind, "dsh-update-plugin");
  assert.equal(tabTypes[0].single, true);

  const names = registrations.map((entry) => entry.options.name).sort();
  assert.deepEqual(names, [
    "settings.general.item",
    "settings.section",
    "sidebar.right.pane.tab",
    "sidebar.right.pane.tab.title",
  ]);

  const general = registrations.find((entry) => entry.options.name === "settings.general.item");
  assert.equal(general.options.id, "dsh-update-plugin");
  assert.equal(general.options.locale, "dsh-update-plugin");

  const injected = general.options.inject();
  assert.equal(typeof injected.openSidebar, "function");
  assert.equal(typeof injected.showSidebar, "function");
  injected.openSidebar();
  assert.deepEqual(openTabs, ["dsh-update-plugin"]);

  const rendered = general.component({ t: (key) => key, showSidebar: () => false });
  assert.equal(rendered.type, "element");
});
