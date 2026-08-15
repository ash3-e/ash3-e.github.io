import { describe, expect, it } from "vitest";
import { coverRectToVideoRoi, padRoiPixels, pinchZoneFrame } from "../src/core/geometry";

describe("scanner geometry", () => {
  it("maps a cover-cropped stage rectangle into source-video pixels", () => {
    expect(coverRectToVideoRoi(
      { x: 100, y: 50, width: 200, height: 200 },
      { width: 400, height: 300 },
      { width: 1920, height: 1080 },
      1,
    )).toEqual({ sx: 600, sy: 180, sw: 720, sh: 720 });
  });

  it("accounts for software zoom around the video center", () => {
    expect(coverRectToVideoRoi(
      { x: 100, y: 50, width: 200, height: 200 },
      { width: 400, height: 300 },
      { width: 1920, height: 1080 },
      2,
    )).toEqual({ sx: 780, sy: 360, sw: 360, sh: 360 });
  });

  it("forms an opposing-corner square pinch frame", () => {
    expect(pinchZoneFrame({ x: 40, y: 70 }, { x: 160, y: 130 })).toEqual({
      centerX: 100,
      centerY: 100,
      side: 120,
    });
  });

  it("pads and clamps an ROI at video boundaries", () => {
    expect(padRoiPixels({ sx: 4, sy: 2, sw: 100, sh: 80 }, 120, 100, 0.1)).toEqual({
      sx: 0,
      sy: 0,
      sw: 120,
      sh: 96,
    });
  });
});

