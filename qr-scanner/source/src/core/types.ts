export type ScanSource = "camera" | "synthetic";

export interface ScanContext {
  source: ScanSource;
  cameraId?: string;
  zoom?: number;
  roi?: Roi;
  timestamp?: number;
  [key: string]: unknown;
}

export interface ScanResult<TValue = unknown> {
  id: string;
  payload: string;
  normalizedPayload: string;
  value: TValue;
  context: Readonly<ScanContext>;
  timestamp: number;
}

export interface Roi {
  x: number;
  y: number;
  size: number;
}

export type PayloadNormalizer = (payload: string, context: Readonly<ScanContext>) => string | Promise<string>;
export type PayloadHandler<TValue = unknown> = (
  payload: string,
  context: Readonly<ScanContext>,
) => TValue | Promise<TValue>;

export type ResultListener<TValue = unknown> = (result: ScanResult<TValue>) => void;

export type StatusTone = "neutral" | "pending" | "found" | "unmatched" | "success" | "warning" | "error";

export interface ScannerStatus {
  tone: StatusTone;
  text: string;
  layout?: "status" | "confirmation";
  detail?: string;
  note?: string;
}

export interface ScannerCodePresentation {
  code: string | null;
  state: "idle" | "preview" | "known" | "unknown";
}

export interface DialogAction {
  id: string;
  label: string;
  tone?: "neutral" | "primary" | "danger" | "delete";
}

export interface ScannerDialog {
  title: string;
  body: string;
  actions: DialogAction[];
}

export interface ScannerActionControl {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface ScannerActionControls {
  jump?: ScannerActionControl | null;
  accept?: ScannerActionControl | null;
  cancel?: ScannerActionControl | null;
}

export interface CameraOptions {
  autoStart?: boolean;
  facingMode?: "environment" | "user";
  deviceId?: string;
  idealWidth?: number;
  idealHeight?: number;
  allowSwitching?: boolean;
}

export interface ScannerOptions<TValue = unknown> {
  normalizePayload?: PayloadNormalizer;
  handler?: PayloadHandler<TValue>;
  onResult?: ResultListener<TValue>;
  historyLimit?: number;
  camera?: CameraOptions;
  decoder?: import("../decoder/types").QrDecoder;
  mediaDevices?: MediaDevices;
}

export type ScannerLifecycle = "new" | "mounted" | "open" | "paused" | "closed" | "destroyed";

export interface ScannerState<TValue = unknown> {
  lifecycle: ScannerLifecycle;
  inputLocked: boolean;
  targeting: boolean;
  status: ScannerStatus | null;
  lastResult: ScanResult<TValue> | null;
  cameraId: string | null;
  cameraLabel: string | null;
  cameraError: string | null;
  torch: boolean;
  torchSupported: boolean;
  zoom: number;
  zoomSource: "hardware" | "software";
  zoomRange: { min: number; max: number; step: number };
  roi: Roi;
}

export interface QrScannerController<TValue = unknown> extends EventTarget {
  mount(host: HTMLElement): this;
  reparent(host: HTMLElement): this;
  open(): this;
  close(): this;
  pause(): this;
  resume(): this;
  destroy(): void;
  setInputLocked(locked: boolean): this;
  setTargeting(active: boolean): this;
  setStatus(status: ScannerStatus | null): this;
  setCodePresentation(presentation: ScannerCodePresentation): this;
  setActionControls(controls: ScannerActionControls): this;
  showDialog(dialog: ScannerDialog): Promise<string>;
  dismissDialog(actionId?: string): this;
  dismissResult(): this;
  emitSynthetic(payload: string, context?: Omit<ScanContext, "source">): Promise<ScanResult<TValue>>;
  subscribe(listener: ResultListener<TValue>): () => void;
  nextResult(): Promise<ScanResult<TValue>>;
  getLastResult(): ScanResult<TValue> | null;
  getHistory(): readonly ScanResult<TValue>[];
  getState(): Readonly<ScannerState<TValue>>;
  enumerateCameras(): Promise<readonly MediaDeviceInfo[]>;
  startCamera(deviceId?: string): Promise<void>;
  stopCamera(): this;
  selectCamera(deviceId: string): Promise<void>;
  setTorch(enabled: boolean): Promise<boolean>;
  setZoom(value: number): Promise<number>;
  resetRoi(): this;
}
