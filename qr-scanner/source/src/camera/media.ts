import { classifyFacing, normalizeZoomCapability, type CameraProfile } from "./zoom";

export type NumericCapability = { min: number; max: number; step?: number };
export type ScannerCapabilities = MediaTrackCapabilities & {
  focusMode?: string[];
  pointsOfInterest?: boolean | unknown[];
  exposureMode?: string[];
  zoom?: NumericCapability;
  torch?: boolean;
};

export async function acquireCamera(
  mediaDevices: MediaDevices,
  options: { deviceId?: string; facingMode?: "environment" | "user"; idealWidth?: number; idealHeight?: number },
): Promise<MediaStream> {
  return mediaDevices.getUserMedia({
    audio: false,
    video: {
      ...(options.deviceId
        ? { deviceId: { exact: options.deviceId } }
        : { facingMode: { ideal: options.facingMode ?? "environment" } }),
      width: { ideal: options.idealWidth ?? 1920 },
      height: { ideal: options.idealHeight ?? 1080 },
    },
  });
}

export function profileFromTrack(track: MediaStreamTrack): CameraProfile {
  const caps = (track.getCapabilities?.() ?? {}) as ScannerCapabilities;
  const settings = (track.getSettings?.() ?? {}) as MediaTrackSettings & { zoom?: number };
  return {
    deviceId: settings.deviceId ?? "",
    groupId: settings.groupId,
    label: track.label,
    facing: classifyFacing(settings.facingMode, track.label),
    zoom: normalizeZoomCapability(caps.zoom),
    settingsZoom: typeof settings.zoom === "number" ? settings.zoom : null,
  };
}

export async function applyTorchConstraint(track: MediaStreamTrack, enabled: boolean): Promise<void> {
  try {
    await track.applyConstraints({ advanced: [{ torch: enabled } as MediaTrackConstraintSet] });
  } catch (primary) {
    try {
      await track.applyConstraints({ torch: enabled } as MediaTrackConstraints);
    } catch {
      throw primary;
    }
  }
}

export async function requestFocusExposure(
  track: MediaStreamTrack,
  normalizedPoint: { x: number; y: number },
): Promise<void> {
  const caps = (track.getCapabilities?.() ?? {}) as ScannerCapabilities;
  const advanced: MediaTrackConstraintSet = {};
  if (caps.pointsOfInterest) {
    (advanced as MediaTrackConstraintSet & { pointsOfInterest: { x: number; y: number }[] }).pointsOfInterest = [normalizedPoint];
  }
  if (caps.focusMode?.includes("continuous")) {
    (advanced as MediaTrackConstraintSet & { focusMode: string }).focusMode = "continuous";
  } else if (caps.focusMode?.includes("single-shot")) {
    (advanced as MediaTrackConstraintSet & { focusMode: string }).focusMode = "single-shot";
  }
  if (caps.exposureMode?.includes("continuous")) {
    (advanced as MediaTrackConstraintSet & { exposureMode: string }).exposureMode = "continuous";
  }
  if (Object.keys(advanced).length) {
    try {
      await track.applyConstraints({ advanced: [advanced] });
    } catch {
      // Focus/exposure is an enhancement; unsupported shapes do not stop scanning.
    }
  }
}

export function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

