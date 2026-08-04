const test = require("node:test");
const assert = require("node:assert/strict");

const { hidePetWindow, showPetWindow } = require("../src/window-actions.cjs");

function fakeWindow({ minimized = false } = {}) {
  const calls = [];
  return {
    calls,
    isDestroyed: () => false,
    isMinimized: () => minimized,
    restore: () => calls.push("restore"),
    show: () => calls.push("show"),
    showInactive: () => calls.push("showInactive"),
    hide: () => calls.push("hide"),
  };
}

test("hiding Lain removes the pet window without quitting", () => {
  const window = fakeWindow();

  assert.equal(hidePetWindow(window), true);
  assert.deepEqual(window.calls, ["hide"]);
});

test("showing Lain restores a minimized window and reapplies pinning", () => {
  const window = fakeWindow({ minimized: true });
  let pinRefreshes = 0;

  assert.equal(showPetWindow(window, { reapplyAlwaysOnTop: () => { pinRefreshes += 1; } }), true);
  assert.deepEqual(window.calls, ["restore", "show"]);
  assert.equal(pinRefreshes, 1);
});

test("inactive startup and missing windows are handled safely", () => {
  const window = fakeWindow();

  assert.equal(showPetWindow(window, { inactive: true }), true);
  assert.deepEqual(window.calls, ["showInactive"]);
  assert.equal(hidePetWindow(null), false);
  assert.equal(showPetWindow({ isDestroyed: () => true }), false);
});
