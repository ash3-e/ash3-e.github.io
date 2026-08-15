export type RoiPixels = { sx: number; sy: number; sw: number; sh: number };

export interface DecodeRequest {
  video: HTMLVideoElement;
  roi: RoiPixels;
  tryHarder: boolean;
  rotation?: 0 | 90 | 180 | 270;
  maxLongEdge?: number;
}

export interface QrDecoder {
  decode(request: DecodeRequest): string | null | Promise<string | null>;
  destroy?(): void;
}

