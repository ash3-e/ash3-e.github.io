const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("lainPet", {
  onCodexState: (callback) => ipcRenderer.on("codex-state", (_event, payload) => callback(payload)),
  dragStart: (point) => ipcRenderer.send("drag-start", point),
  dragMove: (point) => ipcRenderer.send("drag-move", point),
  dragEnd: () => ipcRenderer.send("drag-end"),
  focusCodex: () => ipcRenderer.invoke("focus-codex"),
  minimize: () => ipcRenderer.invoke("minimize-pet"),
  getPinned: () => ipcRenderer.invoke("get-pinned"),
  setPinned: (pinned) => ipcRenderer.invoke("set-pinned", Boolean(pinned)),
  resizeHost: (height) => ipcRenderer.send("resize-host", Number(height)),
  getHostBounds: () => ipcRenderer.invoke("get-host-bounds"),
  submitReply: (text) => ipcRenderer.invoke("submit-reply", text),
  onReplyResult: (callback) => ipcRenderer.on("reply-result", (_event, payload) => callback(payload)),
  close: () => ipcRenderer.send("close-pet"),
});
