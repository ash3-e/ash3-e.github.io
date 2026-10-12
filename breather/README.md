# Breather

Responsive WebGL explorer at https://ash3-e.github.io/breather/.

Run `npm ci` and `npm run build` in this folder. Commit `index.html`, `assets/`, and the source together; the parent repository's existing Pages workflow publishes the static folder. Serve the parent directory over HTTP for local preview. No backend, account, CDN, or remote runtime dependency is required.

The default surface uses the [Virtual Math Museum parametrization](https://virtualmathmuseum.org/Surface/breather/breather.html), uniformly scaled for display and rotated to put its long axis upright. A moving parameter window samples it at `v + t`. The space–time view plots the exact sine–Gordon field with a moving time cross-section. Boomerang playback uses `t = (span / 2) sin(phase)` so both ends reverse smoothly and the same states are retraced.

Variation modulates the shape parameter by `0.13 × variation × sin(0.42t)`, constrained inside `(0, 1)`. This explores a family of breathers; it is not a numerical solution of a driven PDE. With variation zero, the field is an exact fixed-parameter breather. Velocity vectors are the partial time derivative at fixed shape, rather than a derivative of the display clock or modulation. Surface normals and time tangents are normalized; field arrows are scaled for readability. Singular curves in the immersion are part of the mathematical surface.

The surface is evaluated and shaded on the GPU. Touch supports orbit, pinch zoom, and two-finger pan. All controls remain available from the Controls button on phones. Space toggles playback, R resets the camera, V toggles vectors, H opens mobile controls, and F requests fullscreen where supported. Background tabs suspend rendering; WebGL context restoration resumes the scene.

The dark canvas, floating control panel, and transport styling follow [Isospin & Flavor](../isospin/). Viridis, Lagoon, Spectral, and Pearl palettes are sampled continuously across surface height or field displacement. Three.js is distributed under the MIT license, included in the generated bundle's legal notice.
