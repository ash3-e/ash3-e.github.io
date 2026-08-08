# Modulus visualizer — optimized

## modulus-gl.html — WebGL fast renderer (the real optimization)

Self-contained, dependency-free rewrite of the Modulus scene as a **single
WebGL2 fragment-shader pass**. One dot's styling (the relief ink disc and the
normal-map discs) is defined once, analytically, and repeated per cell; ramps,
vanish masks, edge fades, flow/burst motion, tone drift and layer blend modes
are all evaluated in the same pass, and masked-out regions skip their dot work
entirely. The canvas backing store renders at half resolution and upscales for
free, so the whole scene costs a fraction of one DOM layer.

Open the file, pick presets A–E, watch the built-in meter: 60fps on an Intel
Iris Xe iGPU (even with heavy background GPU load), where the original CSS/SVG
scene managed 2–12fps. Visually close to the original; not pixel-identical
(the website uses pre-rendered 60fps video loops of the true scene for that,
with this renderer as the live fallback).

## tape-filter-bench.html — optimized original bench

Updated copy of `modulus-visualizer/tape-filter-bench.html` (source:
ash3-e/ash3-e.github.io, fetched 2026-08-05).

## Changes

- **Sample content toggle removed completely** — the Host section button, the
  `.content` overlay markup, its CSS, the `S.content` state key, and the
  animated-transition entry are all gone.
- **New "fast zoom / crisp zoom" render mode in the Host section (fast is the
  default).** Fast mode builds the specimen at zoom 1 and scales it up with a
  `transform`, so the per-frame SVG lighting filters (relief / matte / glass /
  normals) process ~zoom² fewer pixels. Crisp mode is the original behaviour —
  every length re-renders sharp at scale. Full-screen preview still works in
  both modes.

## Measured effect (Intel Iris Xe iGPU, 1600×1000 window, presets A–E)

| preset | original | fast zoom |
|--------|----------|-----------|
| A | 2 fps | 13 fps |
| B | 4 fps | 8 fps |
| C | 0 fps | 1 fps |
| D | 2 fps | 4 fps |
| E | 3 fps | 1–2 fps |

Fast zoom helps most where zoom is the multiplier (A/B/D). Presets C and E stay
slow on integrated GPUs regardless of resolution: their normal-map layers run
four Sobel `feConvolveMatrix` passes per chamber, per frame, across up to four
chambers — that filter chain is the bottleneck, not the pixel count. On a
discrete GPU all presets are substantially faster.

For a 60fps production surface the website port takes a different route: the
per-frame SVG filters are replaced with pre-baked sprite textures, and the
backdrop itself ships as a pre-rendered 60fps video loop of the scene.
