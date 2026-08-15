import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  QRCodeReader,
  RGBLuminanceSource,
  type LuminanceSource,
} from "@zxing/library";
import type { DecodeRequest, QrDecoder, RoiPixels } from "./types";

export const ROI_WORKING_SIZE = 384;
const CONTRAST_CLIP = 0.02;
const MIN_DYNAMIC_RANGE = 8;

export class ZxingQrDecoder implements QrDecoder {
  private readonly reader = new QRCodeReader();
  private readonly canvas = document.createElement("canvas");
  private readonly context: CanvasRenderingContext2D;
  private readonly cheapHints = new Map<DecodeHintType, unknown>([
    [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]],
  ]);
  private readonly hardHints = new Map<DecodeHintType, unknown>();
  private luma: Uint8ClampedArray | null = null;

  constructor() {
    const context = this.canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("2D canvas context unavailable for QR decoding.");
    this.context = context;
    this.hardHints = new Map(this.cheapHints);
    this.hardHints.set(DecodeHintType.TRY_HARDER, true);
  }

  decode(request: DecodeRequest): string | null {
    const { roi, rotation = 0, tryHarder } = request;
    if (roi.sw <= 0 || roi.sh <= 0) return null;
    const maxEdge = request.maxLongEdge ?? ROI_WORKING_SIZE;
    const scale = Math.min(1, maxEdge / Math.max(roi.sw, roi.sh));
    return this.drawAndDecode(request.video, roi, Math.max(1, Math.round(roi.sw * scale)),
      Math.max(1, Math.round(roi.sh * scale)), rotation, tryHarder);
  }

  private drawAndDecode(
    video: HTMLVideoElement,
    roi: RoiPixels,
    width: number,
    height: number,
    rotation: 0 | 90 | 180 | 270,
    tryHarder: boolean,
  ): string | null {
    const rotated = rotation === 90 || rotation === 270;
    this.canvas.width = rotated ? height : width;
    this.canvas.height = rotated ? width : height;
    let saved = false;
    try {
      this.context.save();
      saved = true;
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      if (rotation === 90) { this.context.translate(this.canvas.width, 0); this.context.rotate(Math.PI / 2); }
      if (rotation === 180) { this.context.translate(this.canvas.width, this.canvas.height); this.context.rotate(Math.PI); }
      if (rotation === 270) { this.context.translate(0, this.canvas.height); this.context.rotate(-Math.PI / 2); }
      this.context.drawImage(video, roi.sx, roi.sy, roi.sw, roi.sh, 0, 0, width, height);
      this.context.restore();
      saved = false;
      const source = new RGBLuminanceSource(
        this.toContrastLuma(this.context.getImageData(0, 0, this.canvas.width, this.canvas.height)),
        this.canvas.width,
        this.canvas.height,
      );
      return this.attempt(source, tryHarder) ?? (tryHarder ? this.attempt(source.invert(), true) : null);
    } catch {
      if (saved) this.context.restore();
      return null;
    }
  }

  private attempt(source: LuminanceSource, hard: boolean): string | null {
    try {
      this.reader.reset();
      return this.reader.decode(
        new BinaryBitmap(new HybridBinarizer(source)),
        hard ? this.hardHints : this.cheapHints,
      ).getText();
    } catch {
      return null;
    }
  }

  private toContrastLuma(image: ImageData): Uint8ClampedArray {
    const size = image.width * image.height;
    if (!this.luma || this.luma.length !== size) this.luma = new Uint8ClampedArray(size);
    const histogram = new Uint32Array(256);
    for (let index = 0, pixel = 0; index < size; index++, pixel += 4) {
      const value = (image.data[pixel]! * 77 + image.data[pixel + 1]! * 150 + image.data[pixel + 2]! * 29) >> 8;
      this.luma[index] = value;
      histogram[value]!++;
    }
    const clip = size * CONTRAST_CLIP;
    let low = 0;
    let high = 255;
    let total = 0;
    for (let value = 0; value < 256; value++) {
      total += histogram[value]!;
      if (total >= clip) { low = value; break; }
    }
    total = 0;
    for (let value = 255; value >= 0; value--) {
      total += histogram[value]!;
      if (total >= clip) { high = value; break; }
    }
    if (high - low < MIN_DYNAMIC_RANGE) return this.luma;
    const stretch = 255 / (high - low);
    for (let index = 0; index < size; index++) {
      const value = this.luma[index]!;
      this.luma[index] = value <= low ? 0 : value >= high ? 255 : (value - low) * stretch;
    }
    return this.luma;
  }
}

