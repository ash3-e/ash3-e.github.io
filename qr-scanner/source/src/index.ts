import "./ui/scanner.css";

export { createQrScanner, QrScanner } from "./core/qr-scanner";
export { LifecycleError } from "./core/lifecycle-error";
export { ResultPipeline } from "./core/result-pipeline";
export { ZxingQrDecoder, ROI_WORKING_SIZE } from "./decoder/zxing";
export type { DecodeRequest, QrDecoder, RoiPixels } from "./decoder/types";
export type {
  CameraOptions,
  DialogAction,
  PayloadHandler,
  PayloadNormalizer,
  QrScannerController,
  ResultListener,
  Roi,
  ScanContext,
  ScanResult,
  ScannerDialog,
  ScannerActionControl,
  ScannerActionControls,
  ScannerCodePresentation,
  ScannerLifecycle,
  ScannerOptions,
  ScannerState,
  ScannerStatus,
  StatusTone,
} from "./core/types";
export {
  clampRoi,
  coverRectToVideoRoi,
  padRoiPixels,
  pinchZoneFrame,
  roiToRect,
} from "./core/geometry";
export {
  buildUnifiedModel,
  classifyFacing,
  dialAngleToZoom,
  logicalToNativeZoom,
  logicalToSegment,
  nativeToLogicalZoom,
  normalizeZoomCapability,
  probeCameras,
  zoomToDialAngle,
} from "./camera/zoom";
export type { CameraFacing, CameraProfile, UnifiedZoomModel, ZoomKind, ZoomRange, ZoomSegment } from "./camera/zoom";
