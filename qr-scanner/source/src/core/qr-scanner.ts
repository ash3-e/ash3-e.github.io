import { acquireCamera, applyTorchConstraint, profileFromTrack, requestFocusExposure, stopStream } from "../camera/media";
import {
  buildUnifiedModel,
  dialAngleToZoom,
  logicalToNativeZoom,
  logicalToSegment,
  probeCameras,
  zoomToDialAngle,
  type CameraProfile,
  type UnifiedZoomModel,
} from "../camera/zoom";
import type { QrDecoder } from "../decoder/types";
import { ZxingQrDecoder } from "../decoder/zxing";
import { createScannerTemplate, type ScannerElements } from "../ui/template";
import { clamp, clampRoi, coverRectToVideoRoi, padRoiPixels, pinchZoneFrame, roiToRect, type Point } from "./geometry";
import { LifecycleError } from "./lifecycle-error";
import { ResultPipeline } from "./result-pipeline";
import type {
  DialogAction,
  QrScannerController,
  ResultListener,
  Roi,
  ScanContext,
  ScanResult,
  ScannerActionControls,
  ScannerCodePresentation,
  ScannerDialog,
  ScannerOptions,
  ScannerState,
} from "./types";

type VideoFrameVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: (now: number) => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};
type NumericCapability = { min: number; max: number; step?: number };
type TrackCapabilities = MediaTrackCapabilities & { zoom?: NumericCapability; torch?: boolean };
type PointerOwner = "feed" | "dial";
type Gesture = {
  primaryId: number;
  mode: "scan" | "pinch";
  dragOffset: Point;
};
type ActiveDialog = {
  left: DialogAction | null;
  right: DialogAction | null;
  body: string;
  deletePresses: number;
  deleteAnimating: boolean;
};

const MOVE_THRESHOLD_PX = 7;
const TARGET_SCAN_INTERVAL_MS = 1000 / 30;
const TRY_HARDER_EVERY = 3;
const ROTATION_FALLBACK = [0, 90, 180, 270] as const;
const ANGLED_FALLBACK_AFTER_MISSES = 3;
const ANGLED_FALLBACK_INTERVAL_MS = 500;
const ROI_PADDING_RATIO = 0.12;
const DEFAULT_ZOOM_MODEL: UnifiedZoomModel = buildUnifiedModel([]);

const formatZoom = (zoom: number) => `${Number.isInteger(zoom) ? zoom.toFixed(0) : zoom.toFixed(1)}×`;
const dialogActionText = (action: DialogAction) => `${action.id} ${action.label}`.toLowerCase();
const isDeleteDialogAction = (action: DialogAction) => (
  action.tone === "delete" || /\b(delete|destroy|purge)\b/.test(dialogActionText(action))
);
const isConfirmDialogAction = (action: DialogAction) => (
  action.tone === "primary"
  || action.tone === "danger"
  || isDeleteDialogAction(action)
  || /\b(confirm|continue|acknowledge|accept|apply|proceed|retry|save|overwrite|replace|reassign|yes|ok|okay)\b/.test(dialogActionText(action))
);

export class QrScanner<TValue = string> extends EventTarget implements QrScannerController<TValue> {
  private readonly options: ScannerOptions<TValue>;
  private readonly elements: ScannerElements;
  private readonly pipeline: ResultPipeline<TValue>;
  private readonly decoder: QrDecoder;
  private readonly mediaDevices: MediaDevices | null;
  private readonly abort = new AbortController();
  private stream: MediaStream | null = null;
  private track: MediaStreamTrack | null = null;
  private cameraRequest = 0;
  private profiles: CameraProfile[] = [];
  private zoomModel = DEFAULT_ZOOM_MODEL;
  private activeSegment = DEFAULT_ZOOM_MODEL.segments[0]!;
  private frameHandle: number | null = null;
  private frameKind: "video" | "animation" | null = null;
  private decoding = false;
  private scanOwned = false;
  private lastDecodeAt = 0;
  private lastAngleFallbackAt = 0;
  private decodeAttempt = 0;
  private consecutiveMisses = 0;
  private liveDecoded: string | null = null;
  private pointers = new Map<number, Point>();
  private pointerOwners = new Map<number, PointerOwner>();
  private gesture: Gesture | null = null;
  private dialPointerId: number | null = null;
  private lastPointerPoint: Point | null = null;
  private dialogResolve: ((action: string) => void) | null = null;
  private activeDialog: ActiveDialog | null = null;
  private actionControls: ScannerActionControls = {};
  private dialogVisibility: { statusHidden: boolean; resultHidden: boolean } | null = null;
  private deleteAnimationFallback: ReturnType<typeof setTimeout> | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private state: ScannerState<TValue> = {
    lifecycle: "new",
    inputLocked: false,
    targeting: false,
    status: null,
    lastResult: null,
    cameraId: null,
    cameraLabel: null,
    cameraError: null,
    torch: false,
    torchSupported: false,
    zoom: 1,
    zoomSource: "software",
    zoomRange: { min: 1, max: 4, step: 0.01 },
    roi: { x: 0, y: 0, size: 180 },
  };

  constructor(options: ScannerOptions<TValue> = {}) {
    super();
    this.options = options;
    this.elements = createScannerTemplate();
    this.mediaDevices = options.mediaDevices ?? globalThis.navigator?.mediaDevices ?? null;
    this.decoder = options.decoder ?? new ZxingQrDecoder();
    this.pipeline = new ResultPipeline<TValue>({
      normalizePayload: options.normalizePayload,
      handler: options.handler,
      onResult: options.onResult,
      historyLimit: options.historyLimit,
      target: this,
    });
    this.bindUi();
  }

  mount(host: HTMLElement): this {
    this.assertAlive();
    if (this.elements.root.parentElement !== host) host.append(this.elements.root);
    if (this.state.lifecycle === "new") this.patchState({ lifecycle: "mounted" });
    this.measureStage();
    if (this.options.camera?.autoStart !== false) this.open();
    return this;
  }

  reparent(host: HTMLElement): this {
    this.assertAlive();
    if (this.elements.root.parentElement !== host) host.append(this.elements.root);
    this.measureStage();
    return this;
  }

  open(): this {
    this.assertAlive();
    if (!this.elements.root.parentElement) throw new Error("Mount the scanner before opening it.");
    this.elements.root.hidden = false;
    this.patchState({ lifecycle: "open" });
    if (this.options.camera?.autoStart !== false && !this.stream) void this.startCamera();
    return this;
  }

  close(): this {
    if (this.state.lifecycle === "destroyed") return this;
    this.endScan(false);
    this.stopCamera();
    this.elements.root.hidden = true;
    this.patchState({ lifecycle: "closed" });
    return this;
  }

  pause(): this {
    this.assertAlive();
    if (this.state.lifecycle === "paused") return this;
    this.endScan(false);
    if (this.track) this.track.enabled = false;
    this.patchState({ lifecycle: "paused" });
    return this;
  }

  resume(): this {
    this.assertAlive();
    if (this.track) this.track.enabled = true;
    this.elements.root.hidden = false;
    this.patchState({ lifecycle: "open" });
    if (!this.stream && this.options.camera?.autoStart !== false) void this.startCamera();
    return this;
  }

  destroy(): void {
    if (this.state.lifecycle === "destroyed") return;
    this.endScan(false);
    this.stopCamera();
    this.abort.abort();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.dismissDialog("scanner_destroyed");
    this.pipeline.destroy();
    this.decoder.destroy?.();
    this.elements.root.remove();
    this.patchState({ lifecycle: "destroyed" });
  }

  setInputLocked(locked: boolean): this {
    this.assertAlive();
    if (locked) this.endScan(false);
    this.elements.root.setAttribute("aria-disabled", String(locked));
    this.patchState({ inputLocked: locked });
    return this;
  }

  setTargeting(active: boolean): this {
    this.assertAlive();
    this.elements.root.dataset.targeting = String(active);
    this.patchState({ targeting: active });
    return this;
  }

  setStatus(status: ScannerState["status"]): this {
    this.assertAlive();
    if (status) this.elements.result.hidden = true;
    this.elements.status.hidden = !status;
    this.elements.status.classList.toggle("qr-assign", status?.layout === "confirmation");
    if (!status) {
      this.elements.status.replaceChildren();
    } else if (status.layout === "confirmation") {
      const text = document.createElement("span");
      text.textContent = status.text;
      const children: Node[] = [text];
      if (status.detail) {
        const detail = document.createElement("small");
        detail.textContent = status.detail;
        children.push(detail);
      }
      if (status.note) {
        const note = document.createElement("div");
        note.className = "qr-scanner__prompt-note";
        note.textContent = status.note;
        children.push(note);
      }
      this.elements.status.replaceChildren(...children);
    } else {
      this.elements.status.textContent = status.text;
    }
    if (status) this.elements.status.dataset.tone = status.tone;
    else delete this.elements.status.dataset.tone;
    this.patchState({ status });
    return this;
  }

  setCodePresentation(presentation: ScannerCodePresentation): this {
    this.assertAlive();
    this.elements.codeText.textContent = presentation.code ?? "------";
    this.elements.code.disabled = presentation.state === "idle";
    this.elements.code.classList.remove("is-preview", "is-known", "is-unknown");
    if (presentation.state !== "idle") this.elements.code.classList.add(`is-${presentation.state}`);
    this.elements.zone.hidden = presentation.state !== "preview";
    this.elements.zone.dataset.scanning = String(presentation.state === "preview");
    return this;
  }

  setActionControls(controls: ScannerActionControls): this {
    this.assertAlive();
    this.actionControls = controls;
    if (!this.activeDialog) this.renderActionControls(controls);
    return this;
  }

  private renderActionControls(controls: ScannerActionControls): void {
    const entries = [
      ["jump", this.elements.jump, controls.jump],
      ["accept", this.elements.accept, controls.accept],
      ["cancel", this.elements.cancel, controls.cancel],
    ] as const;
    for (const [kind, element, control] of entries) {
      element.hidden = !control;
      element.disabled = control?.disabled ?? false;
      if (control) {
        element.dataset.qrsControl = control.id;
        element.dataset.qrsKind = kind;
        element.setAttribute("aria-label", control.label);
      } else {
        delete element.dataset.qrsControl;
        delete element.dataset.qrsKind;
        element.removeAttribute("aria-label");
      }
    }
    this.elements.accept.classList.remove("is-delete", "is-deleting");
    delete this.elements.accept.dataset.deleteStep;
  }

  showDialog(dialog: ScannerDialog): Promise<string> {
    this.assertAlive();
    if (this.dialogResolve) this.dismissDialog("superseded");
    const only = dialog.actions.length === 1 ? dialog.actions[0]! : null;
    const semanticRight = dialog.actions.length > 1
      ? dialog.actions.find(isConfirmDialogAction) ?? dialog.actions[dialog.actions.length - 1]!
      : only && isConfirmDialogAction(only) ? only : null;
    const left = dialog.actions.length > 1
      ? dialog.actions.find((action) => action !== semanticRight) ?? null
      : only && !semanticRight ? only : null;
    const right = semanticRight
      ? isDeleteDialogAction(semanticRight) ? { ...semanticRight, tone: "delete" as const } : semanticRight
      : null;
    this.activeDialog = { left, right, body: dialog.body, deletePresses: 0, deleteAnimating: false };
    this.dialogVisibility = {
      statusHidden: this.elements.status.hidden,
      resultHidden: this.elements.result.hidden,
    };
    this.elements.status.hidden = true;
    this.elements.result.hidden = true;
    this.elements.dialogTitle.textContent = dialog.title;
    this.elements.dialogBody.textContent = dialog.body;
    this.elements.dialog.querySelector<HTMLElement>(".zombie-warning__dialog")
      ?.setAttribute("aria-label", dialog.title || "Stale QR code warning");
    const visibleActions = [left, right].filter((action): action is DialogAction => Boolean(action));
    const actions = visibleActions.flatMap((action, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = action.label;
      button.dataset.qrsAction = action.id;
      button.dataset.dialogSlot = action === left ? "left" : "right";
      button.dataset.tone = action === left ? "neutral" : action.tone === "delete" ? "delete" : "primary";
      if (index === 0) return [button];
      const separator = document.createElement("span");
      separator.textContent = "|";
      separator.setAttribute("aria-hidden", "true");
      return [separator, button];
    });
    this.elements.dialogActions.replaceChildren(...actions);
    this.elements.dialog.dataset.deleteStep = right?.tone === "delete" ? "idle" : "none";
    this.elements.dialog.hidden = false;
    this.renderDialogControls();
    return new Promise((resolve) => { this.dialogResolve = resolve; });
  }

  dismissDialog(actionId = "dismissed"): this {
    if (this.deleteAnimationFallback !== null) {
      clearTimeout(this.deleteAnimationFallback);
      this.deleteAnimationFallback = null;
    }
    this.elements.dialog.hidden = true;
    this.elements.dialogActions.replaceChildren();
    delete this.elements.dialog.dataset.deleteStep;
    this.activeDialog = null;
    if (this.dialogVisibility) {
      this.elements.status.hidden = this.dialogVisibility.statusHidden;
      this.elements.result.hidden = this.dialogVisibility.resultHidden;
      this.dialogVisibility = null;
    }
    this.renderActionControls(this.actionControls);
    const resolve = this.dialogResolve;
    this.dialogResolve = null;
    resolve?.(actionId);
    if (resolve) this.dispatchEvent(new CustomEvent("dialogaction", { detail: { actionId } }));
    return this;
  }

  private renderDialogControls(): void {
    const dialog = this.activeDialog;
    if (!dialog) return;
    this.renderActionControls({
      cancel: dialog.left ? { id: dialog.left.id, label: dialog.left.label } : null,
      accept: dialog.right ? { id: dialog.right.id, label: dialog.right.label } : null,
      jump: null,
    });
    const deleting = dialog.right?.tone === "delete";
    this.elements.accept.classList.toggle("is-delete", deleting);
    if (deleting) this.elements.accept.dataset.deleteStep = "idle";
  }

  private activateDialogAction(action: DialogAction): void {
    const dialog = this.activeDialog;
    if (!dialog || dialog.deleteAnimating) return;
    if (action === dialog.right && action.tone === "delete") {
      this.beginDeleteConfirmation();
      return;
    }
    this.dismissDialog(action.id);
  }

  private beginDeleteConfirmation(): void {
    const dialog = this.activeDialog;
    if (!dialog?.right || dialog.right.tone !== "delete" || dialog.deleteAnimating) return;
    dialog.deletePresses += 1;
    dialog.deleteAnimating = true;
    this.elements.accept.disabled = true;
    this.elements.accept.dataset.deleteStep = dialog.deletePresses === 1 ? "arming" : "confirming";
    this.elements.dialog.dataset.deleteStep = this.elements.accept.dataset.deleteStep;
    const pillAction = this.findDialogActionButton(dialog.right.id);
    if (pillAction) pillAction.disabled = true;
    this.elements.accept.classList.remove("is-deleting");
    void this.elements.deleteGlyph.offsetWidth;
    this.elements.accept.classList.add("is-deleting");
    this.deleteAnimationFallback = setTimeout(() => this.completeDeleteConfirmationAnimation(), 1050);
  }

  private completeDeleteConfirmationAnimation(): void {
    const dialog = this.activeDialog;
    if (!dialog?.right || dialog.right.tone !== "delete" || !dialog.deleteAnimating) return;
    if (this.deleteAnimationFallback !== null) {
      clearTimeout(this.deleteAnimationFallback);
      this.deleteAnimationFallback = null;
    }
    dialog.deleteAnimating = false;
    this.elements.accept.classList.remove("is-deleting");
    if (dialog.deletePresses >= 2) {
      this.dismissDialog(dialog.right.id);
      return;
    }
    this.elements.accept.disabled = false;
    this.elements.accept.dataset.deleteStep = "armed";
    this.elements.dialog.dataset.deleteStep = "armed";
    this.elements.dialogBody.textContent = `${dialog.body}\nPress ${dialog.right.label} again to confirm.`;
    this.elements.accept.setAttribute("aria-label", `${dialog.right.label} again`);
    const pillAction = this.findDialogActionButton(dialog.right.id);
    if (pillAction) {
      pillAction.disabled = false;
      pillAction.textContent = `${dialog.right.label} again`;
    }
  }

  private findDialogActionButton(actionId: string): HTMLButtonElement | null {
    return Array.from(this.elements.dialogActions.querySelectorAll<HTMLButtonElement>("[data-qrs-action]"))
      .find((button) => button.dataset.qrsAction === actionId) ?? null;
  }

  dismissResult(): this {
    this.elements.result.hidden = true;
    this.elements.codeText.textContent = "------";
    this.elements.code.classList.remove("is-known", "is-unknown", "is-preview");
    this.elements.code.disabled = true;
    return this;
  }

  async emitSynthetic(payload: string, context: Omit<ScanContext, "source"> = {}): Promise<ScanResult<TValue>> {
    this.assertAlive();
    return this.deliver(payload, { ...context, source: "synthetic" });
  }

  subscribe(listener: ResultListener<TValue>): () => void { return this.pipeline.subscribe(listener); }
  nextResult(): Promise<ScanResult<TValue>> { return this.pipeline.next(); }
  getLastResult(): ScanResult<TValue> | null { return this.pipeline.last(); }
  getHistory(): readonly ScanResult<TValue>[] { return this.pipeline.history(); }
  getState(): Readonly<ScannerState<TValue>> { return Object.freeze({ ...this.state, roi: { ...this.state.roi } }); }

  async enumerateCameras(): Promise<readonly MediaDeviceInfo[]> {
    if (!this.mediaDevices) return [];
    try {
      const devices = (await this.mediaDevices.enumerateDevices()).filter((device) => device.kind === "videoinput");
      this.renderCameraMenu(devices);
      return devices;
    } catch (error) {
      this.reportCameraError(error);
      return [];
    }
  }

  async selectCamera(deviceId: string): Promise<void> {
    this.assertAlive();
    await this.startCamera(deviceId);
  }

  async setTorch(enabled: boolean): Promise<boolean> {
    this.assertAlive();
    if (!this.track || !this.state.torchSupported) return false;
    try {
      await applyTorchConstraint(this.track, enabled);
      this.elements.torch.setAttribute("aria-pressed", String(enabled));
      this.patchState({ torch: enabled });
      return true;
    } catch (error) {
      this.reportCameraError(error);
      return false;
    }
  }

  async setZoom(value: number): Promise<number> {
    this.assertAlive();
    const range = this.zoomModel.range;
    const step = range.step && range.step > 0 ? range.step : 0.01;
    const requested = clamp(range.min + Math.round((value - range.min) / step) * step, range.min, range.max);
    const segment = logicalToSegment(requested, this.zoomModel);
    if (segment.deviceId && segment.deviceId !== this.state.cameraId) {
      await this.startCamera(segment.deviceId, requested);
      return this.state.zoom;
    }
    this.activeSegment = segment;
    if (segment.kind === "hardware" && this.track) {
      try {
        await this.track.applyConstraints({ advanced: [{ zoom: logicalToNativeZoom(requested, segment) } as MediaTrackConstraintSet] });
        this.elements.softwareZoom.style.transform = "";
        this.patchState({ zoomSource: "hardware" });
      } catch {
        this.applySoftwareZoom(requested);
      }
    } else {
      this.applySoftwareZoom(requested);
    }
    this.patchState({ zoom: requested });
    this.renderZoom();
    return requested;
  }

  resetRoi(): this {
    this.measureStage(true);
    return this;
  }

  private bindUi(): void {
    const signal = this.abort.signal;
    const { root, stage, dial, camera, cameraMenu, torch, close, result, dialogActions, jump, accept, cancel } = this.elements;
    stage.addEventListener("pointerdown", this.onFeedPointerDown, { signal });
    stage.addEventListener("pointermove", this.onFeedPointerMove, { signal });
    stage.addEventListener("pointerup", this.onPointerUp, { signal });
    stage.addEventListener("pointercancel", this.onPointerCancel, { signal });
    dial.addEventListener("pointerdown", this.onDialPointerDown, { signal });
    dial.addEventListener("pointermove", this.onDialPointerMove, { signal });
    dial.addEventListener("pointerup", this.onPointerUp, { signal });
    dial.addEventListener("pointercancel", this.onPointerCancel, { signal });
    root.addEventListener("wheel", this.onWheel, { signal, passive: false });
    root.addEventListener("keydown", this.onKeyDown, { signal });
    camera.addEventListener("click", async () => {
      if (!this.stream) await this.startCamera();
      const open = cameraMenu.hidden;
      cameraMenu.hidden = !open;
      camera.classList.toggle("is-open", open);
      camera.setAttribute("aria-expanded", String(open));
      if (open) void this.enumerateCameras();
    }, { signal });
    cameraMenu.addEventListener("click", (event) => {
      const option = (event.target as Element).closest<HTMLButtonElement>("[data-camera-id]");
      if (!option?.dataset.cameraId) return;
      cameraMenu.hidden = true;
      camera.classList.remove("is-open");
      camera.setAttribute("aria-expanded", "false");
      void this.selectCamera(option.dataset.cameraId);
    }, { signal });
    torch.addEventListener("click", () => void this.setTorch(!this.state.torch), { signal });
    close.addEventListener("click", () => {
      if (this.activeDialog) {
        if (this.activeDialog.left) this.activateDialogAction(this.activeDialog.left);
        else this.dismissDialog();
        return;
      }
      this.dispatchEvent(new Event("close"));
      this.close();
    }, { signal });
    result.addEventListener("click", (event) => {
      if ((event.target as Element).closest("button")) this.dismissResult();
    }, { signal });
    for (const element of [jump, accept, cancel]) {
      element.addEventListener("click", () => {
        if (this.activeDialog) {
          const action = element === cancel ? this.activeDialog.left : element === accept ? this.activeDialog.right : null;
          if (action) this.activateDialogAction(action);
          return;
        }
        const id = element.dataset.qrsControl;
        if (id) this.dispatchEvent(new CustomEvent("action", { detail: { id, kind: element.dataset.qrsKind } }));
      }, { signal });
    }
    dialogActions.addEventListener("click", (event) => {
      const button = (event.target as Element).closest<HTMLButtonElement>("[data-qrs-action]");
      const id = button?.dataset.qrsAction;
      if (!id || !this.activeDialog) return;
      const action = [this.activeDialog.left, this.activeDialog.right].find((candidate) => candidate?.id === id);
      if (action) this.activateDialogAction(action);
    }, { signal });
    accept.addEventListener("animationend", (event) => {
      const animation = event as AnimationEvent;
      if (
        animation.animationName === "job-delete-lid"
        && animation.target instanceof Element
        && animation.target.classList.contains("job-delete-glyph__lid")
      ) this.completeDeleteConfirmationAnimation();
    }, { signal });
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.measureStage());
      this.resizeObserver.observe(stage);
    } else {
      window.addEventListener("resize", () => this.measureStage(), { signal });
    }
  }

  private readonly onFeedPointerDown = (event: PointerEvent): void => {
    if (!this.canInteract() || (event.target as Element).closest(
      ".qrs-topbar, .qrs-dial, .qrs-result, .qrs-status, .qrs-dialog, .qr-scanner__jump, .qr-scanner__accept, .qr-scanner__cancel",
    )) return;
    event.preventDefault();
    this.elements.stage.setPointerCapture?.(event.pointerId);
    const point = this.stagePoint(event);
    this.pointers.set(event.pointerId, point);
    this.pointerOwners.set(event.pointerId, "feed");
    if (this.pointers.size === 1) {
      this.gesture = { primaryId: event.pointerId, mode: "scan", dragOffset: { x: 0, y: 0 } };
      this.updateRoi({ ...this.state.roi, x: point.x, y: point.y });
      this.lastPointerPoint = point;
      this.pulseFocus();
      void this.focusAt(point);
      this.beginScan();
    } else if (this.pointers.size >= 2) {
      this.gesture = { primaryId: event.pointerId, mode: "pinch", dragOffset: { x: 0, y: 0 } };
      this.updatePinch();
    }
  };

  private readonly onFeedPointerMove = (event: PointerEvent): void => {
    if (!this.pointers.has(event.pointerId)) return;
    event.preventDefault();
    const point = this.stagePoint(event);
    this.pointers.set(event.pointerId, point);
    if (this.pointers.size >= 2 || this.gesture?.mode === "pinch") {
      this.updatePinch();
      return;
    }
    if (this.gesture?.mode === "scan") {
      this.lastPointerPoint = point;
      this.updateRoi({
        ...this.state.roi,
        x: point.x + this.gesture.dragOffset.x,
        y: point.y + this.gesture.dragOffset.y,
      });
    }
  };

  private readonly onDialPointerDown = (event: PointerEvent): void => {
    if (!this.canInteract()) return;
    event.preventDefault();
    this.elements.dial.setPointerCapture?.(event.pointerId);
    this.dialPointerId = event.pointerId;
    this.pointerOwners.set(event.pointerId, "dial");
    this.beginScan();
    void this.updateDialFromPointer(event);
  };

  private readonly onDialPointerMove = (event: PointerEvent): void => {
    if (this.dialPointerId !== event.pointerId) return;
    event.preventDefault();
    void this.updateDialFromPointer(event);
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    event.preventDefault();
    const owner = this.pointerOwners.get(event.pointerId);
    this.pointerOwners.delete(event.pointerId);
    if (owner === "dial") this.dialPointerId = null;
    this.pointers.delete(event.pointerId);
    if (this.gesture?.mode === "pinch" && this.pointers.size === 1) {
      const [remaining] = this.pointers.entries();
      if (remaining) {
        const [primaryId, point] = remaining;
        this.gesture = {
          primaryId,
          mode: "scan",
          dragOffset: { x: this.state.roi.x - point.x, y: this.state.roi.y - point.y },
        };
        return;
      }
    }
    if (this.pointers.size === 0 && this.dialPointerId == null) {
      this.gesture = null;
      this.endScan(true);
    }
  };

  private readonly onPointerCancel = (event: PointerEvent): void => {
    this.pointerOwners.delete(event.pointerId);
    this.pointers.delete(event.pointerId);
    if (this.dialPointerId === event.pointerId) this.dialPointerId = null;
    if (this.pointers.size === 0 && this.dialPointerId == null) {
      this.gesture = null;
      this.endScan(false);
    }
  };

  private readonly onWheel = (event: WheelEvent): void => {
    if (!this.canInteract()) return;
    event.preventDefault();
    const span = this.state.zoomRange.max - this.state.zoomRange.min;
    void this.setZoom(this.state.zoom - Math.sign(event.deltaY) * Math.max(.05, span / 40));
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.canInteract()) return;
    const step = event.shiftKey ? 20 : 8;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
      const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
      this.updateRoi({ ...this.state.roi, x: this.state.roi.x + dx, y: this.state.roi.y + dy });
    } else if (["+", "="].includes(event.key)) {
      event.preventDefault();
      void this.setZoom(this.state.zoom + (this.state.zoomRange.step || .1) * 5);
    } else if (event.key === "-") {
      event.preventDefault();
      void this.setZoom(this.state.zoom - (this.state.zoomRange.step || .1) * 5);
    } else if (event.key === "Enter") {
      event.preventDefault();
      this.beginScan();
      queueMicrotask(() => this.endScan(true));
    }
  };

  private canInteract(): boolean {
    return this.state.lifecycle === "open" && !this.state.inputLocked && this.elements.dialog.hidden;
  }

  private renderCameraMenu(devices: readonly MediaDeviceInfo[]): void {
    if (!devices.length) {
      const fallback = document.createElement("span");
      fallback.textContent = "Default rear camera";
      this.elements.cameraMenu.replaceChildren(fallback);
      return;
    }
    this.elements.cameraMenu.replaceChildren(...devices.map((device, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "menuitemradio");
      button.dataset.cameraId = device.deviceId;
      button.textContent = device.label || `Rear camera ${index + 1}`;
      const active = device.deviceId === this.state.cameraId;
      button.setAttribute("aria-checked", String(active));
      button.classList.toggle("is-active", active);
      return button;
    }));
  }

  private stagePoint(event: PointerEvent): Point {
    const rect = this.elements.stage.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private updatePinch(): void {
    const points = [...this.pointers.values()];
    if (points.length < 2) return;
    const frame = pinchZoneFrame(points[0]!, points[1]!);
    this.updateRoi({ x: frame.centerX, y: frame.centerY, size: frame.side });
  }

  private updateRoi(roi: Roi): void {
    const stage = this.stageSize();
    const next = clampRoi(roi, stage);
    this.patchState({ roi: next });
    const zone = this.elements.zone;
    zone.style.left = `${next.x}px`;
    zone.style.top = `${next.y}px`;
    zone.style.width = `${next.size}px`;
    zone.style.height = `${next.size}px`;
    this.dispatchEvent(new CustomEvent("roichange", { detail: next }));
  }

  private measureStage(reset = false): void {
    const size = this.stageSize();
    if (size.width <= 0 || size.height <= 0) return;
    if (reset || this.state.roi.x === 0 || this.state.roi.y === 0) {
      this.updateRoi({ x: size.width / 2, y: size.height / 2, size: Math.min(size.width, size.height) * .42 });
    } else {
      this.updateRoi(this.state.roi);
    }
  }

  private stageSize(): { width: number; height: number } {
    const rect = this.elements.stage.getBoundingClientRect();
    return { width: rect.width || this.elements.stage.clientWidth, height: rect.height || this.elements.stage.clientHeight };
  }

  private beginScan(): void {
    if (this.scanOwned || !this.canInteract()) return;
    this.scanOwned = true;
    this.liveDecoded = null;
    this.decodeAttempt = 0;
    this.consecutiveMisses = 0;
    this.elements.zone.hidden = false;
    this.elements.zone.dataset.scanning = "true";
    this.elements.code.disabled = false;
    this.elements.code.classList.remove("is-known", "is-unknown");
    this.elements.code.classList.add("is-preview");
    this.elements.codeText.textContent = "------";
    this.dispatchEvent(new Event("scanstart"));
    this.scheduleFrame();
  }

  private endScan(commit: boolean): void {
    if (!this.scanOwned) return;
    this.scanOwned = false;
    this.cancelFrame();
    this.elements.zone.dataset.scanning = "false";
    this.elements.zone.hidden = true;
    this.elements.code.classList.remove("is-preview");
    const payload = this.liveDecoded;
    this.liveDecoded = null;
    if (commit && payload != null) {
      void this.deliver(payload, {
        source: "camera",
        cameraId: this.state.cameraId ?? undefined,
        zoom: this.state.zoom,
        roi: this.state.roi,
      });
    }
    this.dispatchEvent(new CustomEvent("scanend", { detail: { committed: Boolean(commit && payload != null), payload } }));
  }

  private scheduleFrame(): void {
    if (!this.scanOwned || this.frameHandle != null) return;
    const video = this.elements.video as VideoFrameVideo;
    if (video.requestVideoFrameCallback) {
      this.frameKind = "video";
      this.frameHandle = video.requestVideoFrameCallback((now) => {
        this.frameHandle = null;
        void this.decodeFrame(now);
      });
    } else {
      this.frameKind = "animation";
      this.frameHandle = requestAnimationFrame((now) => {
        this.frameHandle = null;
        void this.decodeFrame(now);
      });
    }
  }

  private cancelFrame(): void {
    if (this.frameHandle == null) return;
    const video = this.elements.video as VideoFrameVideo;
    if (this.frameKind === "video" && video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(this.frameHandle);
    if (this.frameKind === "animation") cancelAnimationFrame(this.frameHandle);
    this.frameHandle = null;
    this.frameKind = null;
  }

  private async decodeFrame(now: number): Promise<void> {
    if (!this.scanOwned) return;
    if (this.decoding || now - this.lastDecodeAt < TARGET_SCAN_INTERVAL_MS) {
      this.scheduleFrame();
      return;
    }
    const video = this.elements.video;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) {
      this.scheduleFrame();
      return;
    }
    this.decoding = true;
    this.lastDecodeAt = now;
    const stage = this.stageSize();
    const softwareZoom = this.state.zoomSource === "software" ? this.state.zoom : 1;
    const roi = padRoiPixels(
      coverRectToVideoRoi(roiToRect(this.state.roi), stage, { width: video.videoWidth, height: video.videoHeight }, softwareZoom),
      video.videoWidth,
      video.videoHeight,
      ROI_PADDING_RATIO,
    );
    try {
      this.decodeAttempt += 1;
      let payload = await this.decoder.decode({ video, roi, tryHarder: this.decodeAttempt % TRY_HARDER_EVERY === 0 });
      if (!payload) {
        this.consecutiveMisses += 1;
        if (this.consecutiveMisses >= ANGLED_FALLBACK_AFTER_MISSES && now - this.lastAngleFallbackAt >= ANGLED_FALLBACK_INTERVAL_MS) {
          this.lastAngleFallbackAt = now;
          const rotation = ROTATION_FALLBACK[this.decodeAttempt % ROTATION_FALLBACK.length]!;
          payload = await this.decoder.decode({ video, roi, tryHarder: true, rotation, maxLongEdge: 960 });
        }
      }
      if (payload != null) {
        this.liveDecoded = payload;
        this.consecutiveMisses = 0;
        this.elements.codeText.textContent = payload;
        this.dispatchEvent(new CustomEvent("scanpreview", { detail: { payload } }));
      }
    } finally {
      this.decoding = false;
      this.scheduleFrame();
    }
  }

  private async deliver(payload: string, context: ScanContext): Promise<ScanResult<TValue>> {
    const result = await this.pipeline.emit(payload, context);
    this.elements.status.hidden = true;
    this.elements.resultPayload.textContent = `QR ${payload} scanned successfully.`;
    this.elements.result.hidden = false;
    this.elements.codeText.textContent = payload;
    this.elements.code.disabled = false;
    this.elements.code.classList.remove("is-known", "is-preview");
    this.elements.code.classList.add("is-unknown");
    this.patchState({ lastResult: result });
    return result;
  }

  async startCamera(deviceId?: string, requestedZoom?: number): Promise<void> {
    if (!this.mediaDevices || this.isDestroyed()) {
      if (!this.mediaDevices) this.reportCameraError(new Error("Camera APIs are unavailable in this browser."));
      return;
    }
    const request = ++this.cameraRequest;
    const wasScanning = this.scanOwned;
    if (wasScanning) this.cancelFrame();
    stopStream(this.stream);
    this.stream = null;
    this.track = null;
    this.elements.video.srcObject = null;
    this.patchState({ cameraId: null, cameraLabel: null, cameraError: null, torch: false, torchSupported: false });
    try {
      const stream = await acquireCamera(this.mediaDevices, {
        deviceId: deviceId ?? this.options.camera?.deviceId,
        facingMode: this.options.camera?.facingMode,
        idealWidth: this.options.camera?.idealWidth,
        idealHeight: this.options.camera?.idealHeight,
      });
      if (this.isDestroyed() || request !== this.cameraRequest) { stopStream(stream); return; }
      this.stream = stream;
      this.track = stream.getVideoTracks()[0] ?? null;
      this.elements.video.srcObject = stream;
      try { await this.elements.video.play(); } catch { /* autoplay may wait for user activation */ }
      if (!this.track) throw new Error("The camera stream contained no video track.");
      const profile = profileFromTrack(this.track);
      this.profiles = [profile];
      this.zoomModel = buildUnifiedModel(this.profiles, {
        allowSwitching: this.options.camera?.allowSwitching ?? true,
        primaryDeviceId: profile.deviceId,
      });
      this.activeSegment = logicalToSegment(requestedZoom ?? profile.settingsZoom ?? 1, this.zoomModel);
      const capabilities = (this.track.getCapabilities?.() ?? {}) as TrackCapabilities;
      this.elements.torch.disabled = capabilities.torch !== true;
      this.patchState({
        cameraId: profile.deviceId,
        cameraLabel: profile.label || "Camera",
        cameraError: null,
        torchSupported: capabilities.torch === true,
        torch: false,
        zoom: clamp(requestedZoom ?? profile.settingsZoom ?? 1, this.zoomModel.range.min, this.zoomModel.range.max),
        zoomSource: this.activeSegment.kind,
        zoomRange: {
          min: this.zoomModel.range.min,
          max: this.zoomModel.range.max,
          step: this.zoomModel.range.step ?? .01,
        },
      });
      this.renderZoom();
      void this.discoverCameraProfiles(profile);
      if (requestedZoom != null) await this.setZoom(requestedZoom);
    } catch (error) {
      if (request === this.cameraRequest && !this.isDestroyed()) this.reportCameraError(error);
    } finally {
      if (wasScanning && request === this.cameraRequest) this.scheduleFrame();
    }
  }

  private async discoverCameraProfiles(seed: CameraProfile): Promise<void> {
    if (!this.mediaDevices || !this.track) return;
    const profiles = await probeCameras(this.mediaDevices, [seed]);
    if (!this.track || this.state.lifecycle === "destroyed") return;
    this.profiles = profiles;
    this.zoomModel = buildUnifiedModel(profiles, {
      allowSwitching: this.options.camera?.allowSwitching ?? true,
      primaryDeviceId: this.state.cameraId ?? undefined,
    });
    this.patchState({ zoomRange: {
      min: this.zoomModel.range.min,
      max: this.zoomModel.range.max,
      step: this.zoomModel.range.step ?? .01,
    } });
    this.renderZoom();
  }

  stopCamera(): this {
    this.cameraRequest += 1;
    this.cancelFrame();
    stopStream(this.stream);
    this.stream = null;
    this.track = null;
    this.elements.video.srcObject = null;
    this.elements.softwareZoom.style.transform = "";
    this.patchState({ cameraId: null, cameraLabel: null, cameraError: null, torch: false, torchSupported: false });
    return this;
  }

  private async cycleCamera(): Promise<void> {
    const devices = await this.enumerateCameras();
    if (!devices.length) return;
    const current = devices.findIndex((device) => device.deviceId === this.state.cameraId);
    const next = devices[(current + 1) % devices.length];
    if (next) await this.startCamera(next.deviceId);
  }

  private applySoftwareZoom(value: number): void {
    this.elements.softwareZoom.style.transform = `scale(${Math.max(1, value)})`;
    this.patchState({ zoomSource: "software" });
  }

  private renderZoom(): void {
    const { min, max } = this.state.zoomRange;
    const angle = zoomToDialAngle(this.state.zoom, { min, max });
    const point = (radius: number) => ({
      x: 100 + radius * Math.cos(angle),
      y: 100 - radius * Math.sin(angle),
    });
    const base = point(10);
    const tip = point(104);
    const edge = this.elements.dial.querySelector<SVGLineElement>(".qr-scanner__dial-needle-edge");
    for (const line of [edge, this.elements.dialNeedle]) {
      line?.setAttribute("x1", String(base.x));
      line?.setAttribute("y1", String(base.y));
      line?.setAttribute("x2", String(tip.x));
      line?.setAttribute("y2", String(tip.y));
    }
    for (const selector of ["#qr-dial-needle-gradient", "#qr-dial-needle-core-gradient"]) {
      const gradient = this.elements.dial.querySelector<SVGLinearGradientElement>(selector);
      gradient?.setAttribute("x1", String(base.x));
      gradient?.setAttribute("y1", String(base.y));
      gradient?.setAttribute("x2", String(tip.x));
      gradient?.setAttribute("y2", String(tip.y));
    }
    for (const selector of [".qr-scanner__dial-pivot-edge", ".qr-scanner__dial-pivot"]) {
      const pivot = this.elements.dial.querySelector<SVGCircleElement>(selector);
      pivot?.setAttribute("cx", String(base.x));
      pivot?.setAttribute("cy", String(base.y));
    }
    const progress = max > min ? ((this.state.zoom - min) / (max - min)) * 100 : 0;
    this.elements.dialProgress.setAttribute("stroke-dasharray", `${progress} 100`);
    this.elements.dial.querySelector<SVGPathElement>(".qr-scanner__dial-progress-border")
      ?.setAttribute("stroke-dasharray", `${progress} 100`);
    const labels = this.elements.dial.querySelectorAll<SVGTextElement>(".qr-scanner__dial-label");
    if (labels[0]) labels[0].textContent = formatZoom(min);
    if (labels[1]) labels[1].textContent = formatZoom(max);
    this.elements.dialValue.value = formatZoom(this.state.zoom);
    this.elements.dial.setAttribute("aria-valuemin", String(min));
    this.elements.dial.setAttribute("aria-valuemax", String(max));
    this.elements.dial.setAttribute("aria-valuenow", String(this.state.zoom));
    this.elements.dial.setAttribute("aria-valuetext", formatZoom(this.state.zoom));
  }

  private async updateDialFromPointer(event: PointerEvent): Promise<void> {
    const rect = this.elements.dial.getBoundingClientRect();
    const centerX = rect.right;
    const centerY = rect.bottom;
    const raw = Math.atan2(centerY - event.clientY, event.clientX - centerX);
    const angle = clamp(raw < 0 ? raw + Math.PI * 2 : raw, Math.PI / 2, Math.PI);
    await this.setZoom(dialAngleToZoom(angle, this.state.zoomRange));
  }

  private pulseFocus(): void {
    this.elements.focus.removeAttribute("data-pulse");
    void this.elements.focus.offsetWidth;
    this.elements.focus.dataset.pulse = "true";
  }

  private async focusAt(point: Point): Promise<void> {
    if (!this.track) return;
    const stage = this.stageSize();
    if (!stage.width || !stage.height) return;
    await requestFocusExposure(this.track, {
      x: clamp(point.x / stage.width, 0, 1),
      y: clamp(point.y / stage.height, 0, 1),
    });
  }

  private reportCameraError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.patchState({ cameraError: message });
    this.dispatchEvent(new CustomEvent("cameraerror", { detail: { error, message } }));
  }

  private patchState(patch: Partial<ScannerState<TValue>>): void {
    this.state = { ...this.state, ...patch };
    this.dispatchEvent(new CustomEvent("statechange", { detail: this.getState() }));
  }

  private assertAlive(): void {
    if (this.isDestroyed()) throw new LifecycleError();
  }

  private isDestroyed(): boolean { return this.state.lifecycle === "destroyed"; }
}

export function createQrScanner<TValue = string>(options: ScannerOptions<TValue> = {}): QrScannerController<TValue> {
  return new QrScanner(options);
}
