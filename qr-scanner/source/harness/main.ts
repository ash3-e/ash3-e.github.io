import "./style.css";
import { createQrScanner, type QrScannerController, type ScannerState, type StatusTone } from "../src";
import {
  cameraSimulationExamples,
  createScannerExamples,
  type ScannerDialogExampleName,
  type ScannerExampleName,
} from "../examples/scanner-examples";
import guide from "../docs/IMPLEMENTATION.md?raw";

const required = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Harness is missing ${selector}`);
  return element;
};

const lab = required<HTMLElement>("#lab");
const host = required<HTMLElement>("#scanner-host");
const log = required<HTMLOListElement>("#event-log");
const stateOutput = required<HTMLElement>("#state-output");
const runtimeBadge = required<HTMLOutputElement>("#runtime-badge");
const payloadInput = required<HTMLTextAreaElement>("#payload");
const handlerMode = required<HTMLSelectElement>("#handler-mode");
const handlerOutput = required<HTMLOutputElement>("#handler-output");
const statusText = required<HTMLInputElement>("#status-text");
const dialogTitle = required<HTMLInputElement>("#dialog-title");
const dialogBody = required<HTMLTextAreaElement>("#dialog-body");
const dialogOutput = required<HTMLOutputElement>("#dialog-output");
const cameraList = required<HTMLSelectElement>("#camera-list");
const cameraFeedStatus = required<HTMLOutputElement>("#camera-feed-status");

let scanner: QrScannerController<unknown>;
let examples: ReturnType<typeof createScannerExamples>;
let inputLocked = false;

function printable(value: unknown): string {
  if (typeof value === "function") return `[function ${value.name || "anonymous"}] → ${String(value())}`;
  if (typeof value === "string") return JSON.stringify(value);
  try { return JSON.stringify(value); } catch { return String(value); }
}

function addLog(type: string, detail?: unknown): void {
  const entry = document.createElement("li");
  const timestamp = new Date().toISOString().slice(11, 23);
  entry.innerHTML = `<time>${timestamp}</time> <b>${type}</b>${detail === undefined ? "" : ` / ${escapeHtml(printable(detail))}`}`;
  log.prepend(entry);
  while (log.children.length > 80) log.lastElementChild?.remove();
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

function configuredHandler(payload: string): unknown | Promise<unknown> {
  if (handlerMode.value === "uppercase") return payload.toUpperCase();
  if (handlerMode.value === "function") return () => `callable:${payload}`;
  if (handlerMode.value === "async") return Promise.resolve({ accepted: true, payload, source: "async harness handler" });
  return payload;
}

function createInstance(): QrScannerController<unknown> {
  const instance = createQrScanner<unknown>({
    camera: {
      autoStart: true,
      facingMode: "environment",
      idealWidth: 1920,
      idealHeight: 1080,
      allowSwitching: true,
    },
    historyLimit: 25,
    handler: (payload) => configuredHandler(payload),
  });
  for (const type of ["scanstart", "scanend", "scanpreview", "scanresult", "statechange", "roichange", "dialogaction", "cameraerror", "action", "close"]) {
    instance.addEventListener(type, (event) => {
      const detail = "detail" in event ? (event as CustomEvent).detail : undefined;
      if (type !== "statechange") addLog(type, detail);
      if (type === "statechange") renderState(detail as ScannerState);
      if (type === "roichange") required<HTMLOutputElement>("#gesture-output").value = "pointer/keyboard ROI update";
      if (type === "scanresult") {
        handlerOutput.value = `handler value / ${printable(detail.value)}`;
        required<HTMLOutputElement>("#last-result").value = printable(detail.payload);
      }
      if (type === "cameraerror") {
        cameraFeedStatus.value = `error / ${detail.message}`;
        instance.setStatus({ tone: "error", text: `Camera unavailable: ${detail.message}` });
      }
    });
  }
  instance.mount(host).open();
  return instance;
}

function renderState(state: ScannerState): void {
  runtimeBadge.value = `INSTANCE / ${state.lifecycle.toUpperCase()}${state.inputLocked ? " / LOCKED" : ""}`;
  stateOutput.textContent = JSON.stringify(state, (_key, value) => typeof value === "function" ? "[function]" : value, 2);
  if (state.cameraLabel) cameraFeedStatus.value = `live / ${state.cameraLabel}`;
  else if (state.cameraError) cameraFeedStatus.value = `error / ${state.cameraError}`;
  else if (state.lifecycle !== "open") cameraFeedStatus.value = "stopped / start camera to test live scanning";
  required<HTMLOutputElement>("#roi-output").value = `x ${state.roi.x.toFixed(0)} / y ${state.roi.y.toFixed(0)} / ${state.roi.size.toFixed(0)}px`;
  required<HTMLOutputElement>("#camera-output").value = `${state.cameraLabel ?? "no live camera"} / ${state.zoom.toFixed(2)}× ${state.zoomSource}`;
}

scanner = createInstance();
examples = createScannerExamples(scanner);
renderState(scanner.getState());
addLog("harness-ready", "requesting a live camera; press and hold the preview to decode, then release to commit");

document.addEventListener("click", (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>("button");
  if (!button) return;
  const command = button.dataset.command;
  if (command === "open") scanner.open();
  if (command === "close") scanner.close();
  if (command === "pause") scanner.pause();
  if (command === "resume") scanner.resume();
  if (command === "lock") { inputLocked = true; scanner.setInputLocked(true); }
  if (command === "unlock") { inputLocked = false; scanner.setInputLocked(false); }
  if (command === "dismiss-result") scanner.dismissResult();
  if (command === "target-on") scanner.setTargeting(true).setStatus({ tone: "pending", text: "Targeting mode controlled by host" });
  if (command === "target-off") scanner.setTargeting(false).setStatus({ tone: "neutral", text: "Targeting cancelled by host" });
  if (command === "roi-reset") scanner.resetRoi();
  if (command === "recreate") {
    scanner.destroy();
    scanner = createInstance();
    examples = createScannerExamples(scanner);
    scanner.setInputLocked(inputLocked);
    addLog("instance-recreated");
  }
  if (command === "rapid") {
    const raw = payloadInput.value;
    void Promise.all(Array.from({ length: 5 }, (_, index) => scanner.emitSynthetic(raw, { rapidIndex: index })));
  }
});

required("#device-controls").addEventListener("click", (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>("[data-device]");
  if (!button?.dataset.device) return;
  lab.dataset.device = button.dataset.device;
  document.querySelectorAll<HTMLButtonElement>("[data-device]").forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button)));
  requestAnimationFrame(() => scanner.resetRoi());
  addLog("preview-device", button.dataset.device);
});

required("#orientation-controls").addEventListener("click", (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>("[data-orientation]");
  if (!button?.dataset.orientation) return;
  lab.dataset.orientation = button.dataset.orientation;
  document.querySelectorAll<HTMLButtonElement>("[data-orientation]").forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button)));
  requestAnimationFrame(() => scanner.resetRoi());
  addLog("preview-orientation", button.dataset.orientation);
});

required<HTMLInputElement>("#safe-area").addEventListener("change", (event) => {
  lab.dataset.safeArea = String((event.target as HTMLInputElement).checked);
  requestAnimationFrame(() => scanner.resetRoi());
});

required<HTMLButtonElement>("#emit-scan").addEventListener("click", () => void scanner.emitSynthetic(payloadInput.value));
required("#payload-presets").addEventListener("click", (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>("[data-payload]");
  if (button?.dataset.payload !== undefined) payloadInput.value = button.dataset.payload;
});

required("#status-controls").addEventListener("click", (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>("[data-tone]");
  const tone = button?.dataset.tone;
  if (!tone) return;
  scanner.setStatus(tone === "clear" ? null : { tone: tone as StatusTone, text: statusText.value });
});

required("#dialog-controls").addEventListener("click", (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>("[data-dialog]");
  if (!button?.dataset.dialog) return;
  const name = button.dataset.dialog as ScannerDialogExampleName;
  const overrides = name === "custom" ? { title: dialogTitle.value, body: dialogBody.value } : undefined;
  void examples.showDialog(name, overrides).then((action) => { dialogOutput.value = `resolved action / ${action}`; });
});

required("#context-controls").addEventListener("click", (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>("[data-context]");
  const context = button?.dataset.context
    ? examples.states[button.dataset.context as ScannerExampleName]
    : undefined;
  if (!context) return;
  context();
});

required<HTMLButtonElement>("#enumerate").addEventListener("click", async () => {
  const devices = await scanner.enumerateCameras();
  cameraList.replaceChildren(...(devices.length ? devices.map((device, index) => new Option(device.label || `Camera ${index + 1}`, device.deviceId)) : [new Option("No camera available", "")]));
  addLog("camera-enumeration", devices.map((device) => ({ id: device.deviceId, label: device.label })));
});
required<HTMLButtonElement>("#start-camera").addEventListener("click", async () => {
  cameraFeedStatus.value = "requesting camera access";
  await scanner.startCamera(cameraList.value || undefined);
  const state = scanner.getState();
  if (state.cameraLabel) {
    scanner.setStatus({ tone: "success", text: "Camera live. Press and hold over a QR code; release to commit the scan." });
    addLog("camera-started", { id: state.cameraId, label: state.cameraLabel });
  }
});
required<HTMLButtonElement>("#stop-camera").addEventListener("click", () => {
  scanner.stopCamera();
  cameraFeedStatus.value = "stopped / start camera to test live scanning";
  scanner.setStatus({ tone: "neutral", text: "Camera stopped. The simulator and synthetic scan controls remain available." });
  addLog("camera-stopped");
});
cameraList.addEventListener("change", () => {
  if (!cameraList.value) return;
  cameraFeedStatus.value = "switching camera";
  void scanner.selectCamera(cameraList.value);
});

required("#camera-simulations").addEventListener("click", (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>("[data-camera-state]");
  const simulation = button?.dataset.cameraState
    ? cameraSimulationExamples[button.dataset.cameraState]
    : undefined;
  if (!simulation) return;
  scanner.setStatus(simulation);
  addLog("camera-simulation", button!.dataset.cameraState);
});

document.querySelectorAll<HTMLInputElement>("[data-css-var]").forEach((input) => {
  const update = () => host.style.setProperty(input.dataset.cssVar!, input.value);
  input.addEventListener("input", update);
});

required<HTMLButtonElement>("#clear-log").addEventListener("click", () => log.replaceChildren());
required<HTMLButtonElement>("#save-guide").addEventListener("click", () => {
  const url = URL.createObjectURL(new Blob([guide], { type: "text/markdown;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "QR-SCAN-CORE-IMPLEMENTATION.md";
  anchor.click();
  URL.revokeObjectURL(url);
  addLog("guide-saved", "exact docs/IMPLEMENTATION.md content");
});
