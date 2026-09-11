import assert from "node:assert/strict";
import test from "node:test";

test("client bundle registers the General settings row", async () => {
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
  const registrations = [];
  const ctx = {
    effect(fn) {
      effects.push(fn() || (() => {}));
    },
    locale: {
      register() {
        return () => {};
      },
    },
    slots: {
      inject(name, callback) {
        assert.equal(name, "settings.general.item");
        callback();
      },
      register(options, component) {
        registrations.push({ options, component });
        return () => {};
      },
    },
  };

  exports.apply(ctx);

  assert.equal(effects.length, 2);
  assert.equal(registrations.length, 1);
  assert.equal(registrations[0].options.name, "settings.general.item");
  assert.equal(registrations[0].options.id, "dsh-update-plugin");
  assert.equal(registrations[0].options.locale, "dsh-update-plugin");
  assert.equal(typeof registrations[0].component, "function");

  const rendered = registrations[0].component({ t: (key) => key });
  assert.equal(rendered.type, "element");
});
