function isUsableWindow(window) {
  return Boolean(window) && !(window.isDestroyed?.());
}

function hidePetWindow(window) {
  if (!isUsableWindow(window)) return false;
  window.hide();
  return true;
}

function showPetWindow(window, { inactive = false, reapplyAlwaysOnTop } = {}) {
  if (!isUsableWindow(window)) return false;
  if (window.isMinimized?.()) window.restore();
  if (inactive && typeof window.showInactive === "function") window.showInactive();
  else window.show();
  reapplyAlwaysOnTop?.();
  return true;
}

module.exports = { hidePetWindow, showPetWindow };
