import type { Roi } from "./types";
import type { RoiPixels } from "../decoder/types";

export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type Rect = Point & Size;

export const MIN_SCAN_ZONE_PX = 56;
export const MAX_SCAN_ZONE_RATIO = 0.92;

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function pinchZoneFrame(a: Point, b: Point): { centerX: number; centerY: number; side: number } {
  return {
    centerX: (a.x + b.x) / 2,
    centerY: (a.y + b.y) / 2,
    side: Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)),
  };
}

export function clampRoi(roi: Roi, stage: Size): Roi {
  const maxSize = Math.max(MIN_SCAN_ZONE_PX, Math.min(stage.width, stage.height) * MAX_SCAN_ZONE_RATIO);
  const size = clamp(roi.size, MIN_SCAN_ZONE_PX, maxSize);
  return {
    size,
    x: clamp(roi.x, size / 2, Math.max(size / 2, stage.width - size / 2)),
    y: clamp(roi.y, size / 2, Math.max(size / 2, stage.height - size / 2)),
  };
}

export function roiToRect(roi: Roi): Rect {
  return { x: roi.x - roi.size / 2, y: roi.y - roi.size / 2, width: roi.size, height: roi.size };
}

/** Map a stage-space rectangle through object-fit: cover and centered software zoom. */
export function coverRectToVideoRoi(rect: Rect, stage: Size, video: Size, softwareZoom = 1): RoiPixels {
  if (stage.width <= 0 || stage.height <= 0 || video.width <= 0 || video.height <= 0) {
    return { sx: 0, sy: 0, sw: 0, sh: 0 };
  }
  const coverScale = Math.max(stage.width / video.width, stage.height / video.height);
  const displayedWidth = video.width * coverScale;
  const displayedHeight = video.height * coverScale;
  const cropX = (displayedWidth - stage.width) / 2;
  const cropY = (displayedHeight - stage.height) / 2;
  const zoom = Math.max(1, softwareZoom);
  const visibleVideoWidth = video.width / zoom;
  const visibleVideoHeight = video.height / zoom;
  const visibleOriginX = (video.width - visibleVideoWidth) / 2;
  const visibleOriginY = (video.height - visibleVideoHeight) / 2;
  const sx = visibleOriginX + ((rect.x + cropX) / displayedWidth) * visibleVideoWidth;
  const sy = visibleOriginY + ((rect.y + cropY) / displayedHeight) * visibleVideoHeight;
  const sw = (rect.width / displayedWidth) * visibleVideoWidth;
  const sh = (rect.height / displayedHeight) * visibleVideoHeight;
  const x = clamp(Math.round(sx), 0, video.width - 1);
  const y = clamp(Math.round(sy), 0, video.height - 1);
  return {
    sx: x,
    sy: y,
    sw: Math.max(1, Math.min(Math.round(sw), video.width - x)),
    sh: Math.max(1, Math.min(Math.round(sh), video.height - y)),
  };
}

export function padRoiPixels(
  roi: RoiPixels,
  videoWidth: number,
  videoHeight: number,
  paddingRatio: number,
): RoiPixels {
  const padX = Math.round(roi.sw * paddingRatio);
  const padY = Math.round(roi.sh * paddingRatio);
  const sx = clamp(roi.sx - padX, 0, Math.max(0, videoWidth - 1));
  const sy = clamp(roi.sy - padY, 0, Math.max(0, videoHeight - 1));
  return {
    sx,
    sy,
    sw: Math.min(roi.sw + padX * 2, videoWidth - sx),
    sh: Math.min(roi.sh + padY * 2, videoHeight - sy),
  };
}

