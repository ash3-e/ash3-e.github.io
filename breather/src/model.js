export const TAU = Math.PI * 2;
export const defaults = Object.freeze({ shape: .45, span: 18, speed: 1, variation: .2 });
export const presets = Object.freeze({ classic: defaults, petals: { shape: .28, span: 36, speed: .8, variation: .1 }, pulse: { shape: .72, span: 12, speed: .7, variation: .4 } });
export const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
export const effectiveShape = (shape, variation, time) => clamp(shape + variation * .13 * Math.sin(time * .42), .12, .92);
export function field(x, time, a) {
  const w = Math.sqrt(1 - a * a);
  return 4 * Math.atan(a * Math.sin(w * time) / (w * Math.cosh(a * x)));
}
export function fieldVelocity(x, time, a) {
  const w = Math.sqrt(1 - a * a), c = Math.cosh(a * x);
  const q = a * Math.sin(w * time) / (w * c);
  return 4 * a * Math.cos(w * time) / (c * (1 + q * q));
}
// Virtual Math Museum's parametrization, with its axial x mapped to scene y.
// Uniform a-dependent display scaling keeps the family in the camera frame.
export function surfacePoint(u, v, a) {
  const w = Math.sqrt(1 - a * a), c = Math.cosh(a * u), s = Math.sinh(a * u);
  const sv = Math.sin(w * v), cv = Math.cos(w * v);
  const d = a * (w * w * c * c + a * a * sv * sv), scale = a * 1.3;
  return [scale * 2 * w * c * (-w * Math.cos(v) * cv - Math.sin(v) * sv) / d,
    scale * (-u + 2 * w * w * c * s / d),
    scale * 2 * w * c * (-w * Math.sin(v) * cv + Math.cos(v) * sv) / d];
}
export function timeAtPhase(phase, span) { return .5 * span * Math.sin(phase); }
export function seekPhase(time, span, backwards) {
  const p = Math.asin(clamp(time / (.5 * span), -1, 1));
  return backwards ? Math.PI - p : p;
}
