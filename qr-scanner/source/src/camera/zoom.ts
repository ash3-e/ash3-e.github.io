import { clamp } from "../core/geometry";

export type ZoomRange = { min: number; max: number; step?: number };
export type ZoomKind = "hardware" | "software";
export type CameraFacing = "environment" | "user" | "unknown";
export type CameraProfile = {
  deviceId: string;
  groupId?: string;
  label: string;
  facing: CameraFacing;
  zoom: ZoomRange | null;
  settingsZoom: number | null;
};
export type ZoomSegment = {
  deviceId: string;
  kind: ZoomKind;
  nativeMin: number;
  nativeMax: number;
  logicalMin: number;
  logicalMax: number;
};
export type UnifiedZoomModel = { segments: ZoomSegment[]; range: ZoomRange };

export const DIAL_MIN_ANGLE = Math.PI;
export const DIAL_MAX_ANGLE = Math.PI / 2;
export const DIAL_UNITY_ANGLE = 3 * Math.PI / 4;
const EPS = 1e-3;

export function normalizeZoomCapability(raw: unknown): ZoomRange | null {
  if (!raw || typeof raw !== "object") return null;
  const { min, max, step } = raw as { min?: unknown; max?: unknown; step?: unknown };
  if (typeof min !== "number" || typeof max !== "number" || !Number.isFinite(min)
    || !Number.isFinite(max) || max <= min) return null;
  return { min, max, step: typeof step === "number" && step > 0 ? step : 0.01 };
}

export function classifyFacing(facing: string | string[] | undefined, label = ""): CameraFacing {
  const modes = Array.isArray(facing) ? facing : facing ? [facing] : [];
  if (modes.includes("environment")) return "environment";
  if (modes.includes("user")) return "user";
  if (/back|rear|environment|world/i.test(label)) return "environment";
  if (/front|face|user|selfie/i.test(label)) return "user";
  return "unknown";
}

function makeSegment(
  deviceId: string,
  kind: ZoomKind,
  nativeMin: number,
  nativeMax: number,
  logicalMin: number,
  logicalMax: number,
): ZoomSegment {
  return { deviceId, kind, nativeMin, nativeMax, logicalMin, logicalMax };
}

function pickPrimary(profiles: CameraProfile[], preferredId?: string): CameraProfile | null {
  const candidates = profiles.filter((profile) => profile.zoom && profile.zoom.max > profile.zoom.min);
  const preferred = candidates.find((profile) => profile.deviceId === preferredId);
  if (preferred) return preferred;
  const containingOne = candidates.filter((profile) => profile.zoom!.min <= 1 && profile.zoom!.max >= 1);
  return (containingOne.length ? containingOne : candidates).reduce<CameraProfile | null>((best, profile) => {
    if (!best) return profile;
    const span = (candidate: CameraProfile) => candidate.zoom!.max / candidate.zoom!.min;
    return span(profile) > span(best) ? profile : best;
  }, null);
}

export function buildUnifiedModel(
  profiles: CameraProfile[],
  options: {
    softwareRange?: ZoomRange;
    softwareMaxHint?: number | null;
    allowSwitching?: boolean;
    primaryDeviceId?: string;
  } = {},
): UnifiedZoomModel {
  const software = options.softwareRange ?? { min: 1, max: 4, step: 0.01 };
  const rear = profiles.filter((profile) => profile.facing === "environment");
  const pool = rear.length ? rear : profiles;
  const primary = pickPrimary(pool, options.primaryDeviceId);
  if (!primary?.zoom) {
    const max = Math.max(software.max, options.softwareMaxHint ?? software.max);
    return {
      segments: [makeSegment(pool[0]?.deviceId ?? "", "software", 1, max, 1, max)],
      range: { min: 1, max, step: software.step ?? 0.01 },
    };
  }

  const base = primary.zoom;
  const segments = [makeSegment(primary.deviceId, "hardware", base.min, base.max, base.min, base.max)];
  if (options.allowSwitching ?? true) {
    const others = pool.filter((profile) => profile.deviceId !== primary.deviceId && profile.zoom);
    const below = others.filter((profile) => profile.zoom!.min < base.min - EPS)
      .sort((a, b) => a.zoom!.min - b.zoom!.min)[0];
    if (below?.zoom) {
      const scale = base.min / below.zoom.max;
      segments.push(makeSegment(
        below.deviceId, "hardware", below.zoom.min, below.zoom.max,
        below.zoom.min * scale, base.min,
      ));
    }
    const above = others.filter((profile) => profile.zoom!.max > base.max + EPS)
      .sort((a, b) => b.zoom!.max - a.zoom!.max)[0];
    if (above?.zoom) {
      const scale = base.max / above.zoom.min;
      segments.push(makeSegment(
        above.deviceId, "hardware", above.zoom.min, above.zoom.max,
        base.max, above.zoom.max * scale,
      ));
    }
  }
  segments.sort((a, b) => a.logicalMin - b.logicalMin);
  return {
    segments,
    range: {
      min: segments[0]!.logicalMin,
      max: segments.at(-1)!.logicalMax,
      step: base.step ?? 0.01,
    },
  };
}

export function logicalToSegment(logical: number, model: UnifiedZoomModel): ZoomSegment {
  const direct = model.segments.find((segment) => logical >= segment.logicalMin - EPS
    && logical <= segment.logicalMax + EPS);
  if (direct) return direct;
  return model.segments.reduce((best, segment) => {
    const distance = logical < segment.logicalMin ? segment.logicalMin - logical : logical - segment.logicalMax;
    const bestDistance = logical < best.logicalMin ? best.logicalMin - logical : logical - best.logicalMax;
    return distance < bestDistance ? segment : best;
  });
}

export function logicalToNativeZoom(logical: number, segment: ZoomSegment): number {
  const span = segment.logicalMax - segment.logicalMin;
  const t = span > EPS ? (clamp(logical, segment.logicalMin, segment.logicalMax) - segment.logicalMin) / span : 0;
  return segment.nativeMin + t * (segment.nativeMax - segment.nativeMin);
}

export function nativeToLogicalZoom(native: number, segment: ZoomSegment): number {
  const span = segment.nativeMax - segment.nativeMin;
  const t = span > EPS ? (clamp(native, segment.nativeMin, segment.nativeMax) - segment.nativeMin) / span : 0;
  return segment.logicalMin + t * (segment.logicalMax - segment.logicalMin);
}

export function zoomToDialAngle(zoom: number, range: ZoomRange): number {
  const span = range.max - range.min;
  if (span <= 0) return DIAL_UNITY_ANGLE;
  const t = (clamp(zoom, range.min, range.max) - range.min) / span;
  return DIAL_MIN_ANGLE + t * (DIAL_MAX_ANGLE - DIAL_MIN_ANGLE);
}

export function dialAngleToZoom(angle: number, range: ZoomRange): number {
  const bounded = clamp(angle, DIAL_MAX_ANGLE, DIAL_MIN_ANGLE);
  const t = (DIAL_MIN_ANGLE - bounded) / (DIAL_MIN_ANGLE - DIAL_MAX_ANGLE);
  return range.min + t * (range.max - range.min);
}

export async function probeCameras(
  mediaDevices: Pick<MediaDevices, "enumerateDevices" | "getUserMedia">,
  seed: CameraProfile[] = [],
): Promise<CameraProfile[]> {
  const profiles = new Map(seed.map((profile) => [profile.deviceId, profile]));
  let devices: MediaDeviceInfo[];
  try {
    devices = await mediaDevices.enumerateDevices();
  } catch {
    return [...profiles.values()];
  }
  for (const device of devices.filter((entry) => entry.kind === "videoinput" && entry.deviceId)) {
    if (profiles.has(device.deviceId)) continue;
    let stream: MediaStream | null = null;
    try {
      stream = await mediaDevices.getUserMedia({ video: { deviceId: { exact: device.deviceId }, width: 640 }, audio: false });
      const track = stream.getVideoTracks()[0];
      const capabilities = (track?.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { zoom?: unknown };
      const settings = (track?.getSettings?.() ?? {}) as MediaTrackSettings & { zoom?: number };
      profiles.set(device.deviceId, {
        deviceId: device.deviceId,
        groupId: device.groupId,
        label: track?.label || device.label,
        facing: classifyFacing(settings.facingMode, track?.label || device.label),
        zoom: normalizeZoomCapability(capabilities.zoom),
        settingsZoom: typeof settings.zoom === "number" ? settings.zoom : null,
      });
    } catch {
      // Permission, busy, or virtual inputs are expected to fail independently.
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
    }
  }
  return [...profiles.values()];
}

