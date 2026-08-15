import { describe, expect, it } from "vitest";
import {
  buildUnifiedModel,
  dialAngleToZoom,
  logicalToNativeZoom,
  logicalToSegment,
  zoomToDialAngle,
} from "../src/camera/zoom";

describe("zoom model", () => {
  it("round-trips zoom across the radial quadrant", () => {
    const range = { min: 1, max: 5, step: 0.1 };
    const angle = zoomToDialAngle(3, range);
    expect(angle).toBeCloseTo(3 * Math.PI / 4);
    expect(dialAngleToZoom(angle, range)).toBeCloseTo(3);
  });

  it("uses a software segment when cameras expose no hardware zoom", () => {
    const model = buildUnifiedModel([], { softwareMaxHint: 6 });
    expect(model.range).toEqual({ min: 1, max: 6, step: 0.01 });
    expect(model.segments).toEqual([expect.objectContaining({ kind: "software", logicalMin: 1, logicalMax: 6 })]);
  });

  it("maps logical values into the selected camera segment", () => {
    const model = buildUnifiedModel([
      { deviceId: "wide", label: "rear wide", facing: "environment", zoom: { min: 1, max: 4 }, settingsZoom: 1 },
      { deviceId: "tele", label: "rear tele", facing: "environment", zoom: { min: 2, max: 12 }, settingsZoom: 2 },
    ]);
    const segment = logicalToSegment(12, model);
    expect(segment.deviceId).toBe("tele");
    expect(logicalToNativeZoom(segment.logicalMax, segment)).toBe(12);
  });
});

