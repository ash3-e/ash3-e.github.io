export const TAU = Math.PI * 2;

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function easeOutCubic(t) {
  return 1 - Math.pow(1 - clamp(t, 0, 1), 3);
}

export function rand(min = 0, max = 1) {
  return min + Math.random() * (max - min);
}

export function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function cssColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function hexToRgb(hex) {
  const clean = hex.replace("#", "").trim();
  const full = clean.length === 3 ? clean.split("").map((v) => v + v).join("") : clean;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16)
  };
}

export function rgba(hex, alpha = 1) {
  const c = hexToRgb(hex);
  return `rgba(${c.r},${c.g},${c.b},${alpha})`;
}

export function mixRgb(a, b, t) {
  return {
    r: Math.round(lerp(a.r, b.r, t)),
    g: Math.round(lerp(a.g, b.g, t)),
    b: Math.round(lerp(a.b, b.b, t))
  };
}

export function rgbString(c, alpha = 1) {
  return `rgba(${c.r},${c.g},${c.b},${alpha})`;
}

export function normalize3(v) {
  const len = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

export function cross3(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

export function dot3(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function quatIdentity() {
  return { x: 0, y: 0, z: 0, w: 1 };
}

export function quatNormalize(q) {
  const len = Math.hypot(q.x, q.y, q.z, q.w) || 1;
  return { x: q.x / len, y: q.y / len, z: q.z / len, w: q.w / len };
}

export function quatMultiply(a, b) {
  return quatNormalize({
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w
  });
}

export function quatFromAxisAngle(axis, angle) {
  const n = normalize3(axis);
  const s = Math.sin(angle / 2);
  return quatNormalize({ x: n.x * s, y: n.y * s, z: n.z * s, w: Math.cos(angle / 2) });
}

export function quatFromVectors(a, b) {
  const v0 = normalize3(a);
  const v1 = normalize3(b);
  const d = clamp(dot3(v0, v1), -1, 1);
  if (d > 0.9999) return quatIdentity();
  if (d < -0.9999) {
    const axis = Math.abs(v0.x) < 0.8 ? cross3(v0, { x: 1, y: 0, z: 0 }) : cross3(v0, { x: 0, y: 1, z: 0 });
    return quatFromAxisAngle(axis, Math.PI);
  }
  const c = cross3(v0, v1);
  return quatNormalize({ x: c.x, y: c.y, z: c.z, w: 1 + d });
}

export function quatRotateVec(q, v) {
  const x = v.x;
  const y = v.y;
  const z = v.z;
  const qx = q.x;
  const qy = q.y;
  const qz = q.z;
  const qw = q.w;
  const ix = qw * x + qy * z - qz * y;
  const iy = qw * y + qz * x - qx * z;
  const iz = qw * z + qx * y - qy * x;
  const iw = -qx * x - qy * y - qz * z;
  return {
    x: ix * qw + iw * -qx + iy * -qz - iz * -qy,
    y: iy * qw + iw * -qy + iz * -qx - ix * -qz,
    z: iz * qw + iw * -qz + ix * -qy - iy * -qx
  };
}

export function trackballPoint(px, py, cx, cy, radius) {
  const x = clamp((px - cx) / radius, -1, 1);
  const y = clamp((py - cy) / radius, -1, 1);
  const d = x * x + y * y;
  const z = d > 1 ? 0 : Math.sqrt(1 - d);
  return normalize3({ x, y, z });
}

function hash(n) {
  return Math.sin(n) * 43758.5453123 % 1;
}

export function noise3(x, y, z) {
  const p =
    Math.sin(x * 1.71 + y * 2.31 + z * 2.73) * 0.36 +
    Math.sin(x * 3.11 - y * 1.93 + z * 1.37 + 3.4) * 0.28 +
    Math.sin(x * 0.97 + y * 4.01 - z * 2.19 + hash(x + y + z) * 2) * 0.2;
  return p;
}

// Numerical curl of a small analytic noise field. It is intentionally cheap:
// smooth enough for filaments, deterministic enough to avoid random-walk jitter.
export function curlNoise(x, y, z) {
  const e = 0.07;
  const n1 = (a, b, c) => noise3(a + 11.1, b, c);
  const n2 = (a, b, c) => noise3(a, b + 17.7, c);
  const n3 = (a, b, c) => noise3(a, b, c + 23.3);
  const dy3 = (n3(x, y + e, z) - n3(x, y - e, z)) / (2 * e);
  const dz2 = (n2(x, y, z + e) - n2(x, y, z - e)) / (2 * e);
  const dz1 = (n1(x, y, z + e) - n1(x, y, z - e)) / (2 * e);
  const dx3 = (n3(x + e, y, z) - n3(x - e, y, z)) / (2 * e);
  const dx2 = (n2(x + e, y, z) - n2(x - e, y, z)) / (2 * e);
  const dy1 = (n1(x, y + e, z) - n1(x, y - e, z)) / (2 * e);
  return normalize3({ x: dy3 - dz2, y: dz1 - dx3, z: dx2 - dy1 });
}

export function initialQualityTier() {
  const cores = navigator.hardwareConcurrency || 4;
  const dpr = window.devicePixelRatio || 1;
  const narrow = window.matchMedia("(max-width: 767px)").matches;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 1;
  if (narrow && (cores < 6 || dpr > 2.5)) return 1;
  if (cores >= 8 && !narrow) return 3;
  return 2;
}

export class AdaptiveQuality {
  constructor(tier, onChange) {
    this.tier = tier;
    this.onChange = onChange;
    this.samples = [];
    this.slowFrames = 0;
    this.fastFrames = 0;
  }

  sample(dt) {
    this.samples.push(dt);
    if (this.samples.length > 60) this.samples.shift();
    const avg = this.samples.reduce((sum, v) => sum + v, 0) / this.samples.length;
    if (avg > 22) {
      this.slowFrames += 1;
      this.fastFrames = 0;
    } else if (avg < 14) {
      this.fastFrames += 1;
      this.slowFrames = 0;
    } else {
      this.slowFrames = 0;
      this.fastFrames = 0;
    }
    if (this.slowFrames > 60 && this.tier > 0) {
      this.tier -= 1;
      this.slowFrames = 0;
      this.onChange(this.tier);
    }
    if (this.fastFrames > 180 && this.tier < 3 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.tier += 1;
      this.fastFrames = 0;
      this.onChange(this.tier);
    }
    return avg;
  }
}
