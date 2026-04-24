import {
  AdaptiveQuality, TAU, clamp, cssColor, curlNoise, easeOutCubic,
  initialQualityTier, lerp, mixRgb, quatFromAxisAngle, quatIdentity,
  quatMultiply, quatRotateVec, rand, rgba, rgbString, hexToRgb
} from "./utils.js";

const TIERS = [
  { core: 1400, filaments: 1500, bloom: 1, arcs: 4  },
  { core: 2200, filaments: 2600, bloom: 1, arcs: 6  },
  { core: 3400, filaments: 3900, bloom: 2, arcs: 8  },
  { core: 5000, filaments: 5400, bloom: 2, arcs: 12 }
];

const TORUS_SCALE = 1.35;
const TORUS_SPHERE_LIMIT = 0.945;

// Dithering constants
const DITHER_GRID = 1.25;
const BAYER4 = new Float32Array([
  0.0000, 0.5000, 0.1250, 0.6250,
  0.7500, 0.2500, 0.8750, 0.3750,
  0.1875, 0.6875, 0.0625, 0.5625,
  0.9375, 0.4375, 0.8125, 0.3125
]);

export class PlasmaToroidSimulation {
  constructor(canvas, statusEl) {
    this.canvas   = canvas;
    this.ctx      = canvas.getContext("2d", { alpha: true });
    this.statusEl = statusEl;
    this.W = 0; this.H = 0; this.dpr = 1;
    this.time = 0; this.last = 0; this.frameId = 0;
    this.running = false; this.paused = false;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.basePose    = this.makeTorusPose();
    this.orientation = this.basePose;
    this.angularVelocity = {
      axis : { x: 0.04, y: 0.18, z: 0.1 },
      speed: this.reducedMotion ? 0.0008 : 0.0018
    };
    this.dragging = false;
    this.smear    = 0;
    this.cursor   = { x: -10000, y: -10000, active: false };
    this.lean     = { x: 0, y: 0 };
    this.ambient    = 0.45;
    this.avgDt      = 16.7;
    this.sphere     = { cx: 0, cy: 0, r: 1 };
    this.core      = [];
    this.filaments = [];
    this.arcs      = [];
    this.sparks    = [];
    this.bloomA    = document.createElement("canvas");
    this.bloomB    = document.createElement("canvas");
    this.bloomCtxA = this.bloomA.getContext("2d");
    this.bloomCtxB = this.bloomB.getContext("2d");
    // Burn canvas — low-res persistence layer for pixel burn trails
    this.burnCanvas = document.createElement("canvas");
    this.burnCtx    = this.burnCanvas.getContext("2d");
    this.burnScale  = 0.25;
    this._burnCore  = [];
    this._burnFil   = [];
    // Swirl/slosh global state
    this.globalSwirlAmount = 0;
    this.passiveArcDelay = rand(1, 2);
    this.quality   = new AdaptiveQuality(initialQualityTier(), tier => this.applyQuality(tier));
    this.colors    = this.readColors();
    this.applyQuality(this.quality.tier);
    this.resize();
    window.addEventListener("resize", () => this.resize(), { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.stop(); else this.start();
    });
  }

  readColors() {
    return {
      core    : cssColor("--plasma-core"),
      hot     : cssColor("--plasma-hot"),
      ring    : cssColor("--plasma-ring"),
      arc     : cssColor("--plasma-arc"),
      glint   : cssColor("--plasma-glint"),
      coreRgb : hexToRgb(cssColor("--plasma-core")),
      hotRgb  : hexToRgb(cssColor("--plasma-hot")),
      ringRgb : hexToRgb(cssColor("--plasma-ring")),
      arcRgb  : hexToRgb(cssColor("--plasma-arc"))
    };
  }

  makeTorusPose() {
    const sideTilt = quatFromAxisAngle({ x: 1, y: 0, z: 0 },  1.24);
    const yaw      = quatFromAxisAngle({ x: 0, y: 1, z: 0 }, -0.18);
    const roll     = quatFromAxisAngle({ x: 0, y: 0, z: 1 }, -0.08);
    return quatMultiply(roll, quatMultiply(yaw, sideTilt));
  }

  applyQuality(tier) {
    const cfg = TIERS[tier];
    this.alphaScale = Math.min(1, Math.sqrt(900 / (cfg.core + cfg.filaments)));
    this.ensureParticles(this.core, cfg.core, () => ({
      u: rand(0, TAU), v: rand(0, TAU),
      radial: rand(0.015, 0.18), phase: rand(0, TAU), du: rand(0.0018, 0.0042),
      swirlAmount: 0,
      radialDisplace: 0,
      radialVel: 0,
      helicalPitch: rand(1.7, 2.45),
      swirlDv: rand(-0.006, 0.006),
      springK: rand(0.04, 0.09),
      dampK: rand(0.07, 0.15)
    }));
    this.ensureParticles(this.filaments, cfg.filaments, () => ({
      u: rand(0, TAU), v: rand(0, TAU), phase: rand(0, TAU),
      pitch: rand(1.7, 2.45), tail: rand(0.045, 0.11),
      du: rand(0.001, 0.004), dv: rand(-0.006, 0.006), life: rand(0.4, 1)
    }));
  }

  ensureParticles(list, count, factory) {
    while (list.length < count) list.push(factory());
    if (list.length > count) list.length = count;
  }

  resize() {
    const narrow = window.matchMedia("(max-width: 767px)").matches;
    this.dpr = Math.min(narrow ? 1.45 : 1.9, Math.max(1, window.devicePixelRatio || 1));
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width  = Math.round(this.W * this.dpr);
    this.canvas.height = Math.round(this.H * this.dpr);
    this.canvas.style.width  = `${this.W}px`;
    this.canvas.style.height = `${this.H}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const baseR = narrow
      ? Math.min(this.W, this.H) * 0.31
      : Math.min(Math.min(this.W, this.H) * 0.26, this.H * 0.24, this.W * 0.215);
    this.sphere = {
      cx: this.W * 0.5,
      cy: this.H * (narrow ? 0.44 : 0.51),
      r : clamp(baseR, narrow ? 180 : 160, narrow ? 320 : 310)
    };
    this.resizeBloom();
    this.burnCanvas.width  = Math.max(1, Math.round(this.W * this.burnScale));
    this.burnCanvas.height = Math.max(1, Math.round(this.H * this.burnScale));
    this.paintBackground(1);
  }

  resizeBloom() {
    for (const [canvas, scale] of [[this.bloomA, 0.5], [this.bloomB, 0.25]]) {
      canvas.width  = Math.max(1, Math.round(this.W * scale));
      canvas.height = Math.max(1, Math.round(this.H * scale));
    }
  }

  getSphere()             { return this.sphere; }
  setCursor(x, y, active){ this.cursor.x = x; this.cursor.y = y; this.cursor.active = active; }
  beginDrag()             { this.dragging = true; }
  haltRotation()          { this.angularVelocity.speed = 0; this.smear = 0; }
  getAmbientBrightness()  { return this.ambient; }

  applyRotation(delta) {
    this.orientation = quatMultiply(delta, this.orientation);
    this.smear = lerp(this.smear, 0.55, 0.16);
  }

  endDrag(velocity) {
    this.dragging = false;
    if (velocity.speed > 0) this.angularVelocity = velocity;
    // Release settle — keep the dragged slosh alive, but bias it inward so
    // white core particles do not rebound past their widest drag position.
    const settle = clamp(this.smear * 0.08 + velocity.speed * 0.35, 0, 0.12);
    for (const p of this.core) {
      p.radialVel = lerp(p.radialVel, -settle * rand(0.35, 0.85), 0.42);
      p.radialDisplace = Math.min(p.radialDisplace, 0.32);
    }
  }

  addRotationImpulse(axis, speed) {
    this.angularVelocity = { axis, speed: Math.max(this.angularVelocity.speed, speed) };
  }

  setPaused(paused) {
    if (this.paused === paused) return;
    this.paused = paused;
    if (paused) this.stop(); else this.start();
  }

  start() {
    if (this.running || this.paused || document.hidden) return;
    this.running = true;
    this.last    = performance.now();
    this.frameId = requestAnimationFrame(now => this.tick(now));
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frameId);
  }

  tick(now) {
    if (!this.running) return;
    const dt   = clamp(now - this.last, 8, 48);
    this.last  = now;
    this.time += dt / 1000;
    this.avgDt = this.quality.sample(dt);
    this.update(dt);
    this.draw();
    if (this.statusEl)
      this.statusEl.textContent =
        `tier ${this.quality.tier} · ${Math.round(1000 / Math.max(this.avgDt, 1))} fps · ${this.core.length + this.filaments.length} particles`;
    this.frameId = requestAnimationFrame(next => this.tick(next));
  }

  update(dt) {
    const step    = dt / 16.67;
    const idleSpd = this.reducedMotion ? 0.0006 : 0.0013;
    const spin    = this.dragging ? 0 : Math.max(this.angularVelocity.speed, idleSpd);
    const axis    = this.dragging ? { x: 0, y: 1, z: 0 } : this.angularVelocity.axis;
    if (!this.dragging) {
      this.orientation = quatMultiply(quatFromAxisAngle(axis, spin * step), this.orientation);
      this.angularVelocity.speed *= Math.pow(this.reducedMotion ? 0.985 : 0.96, step);
    }
    const targetSmear = this.dragging
      ? 0.54
      : clamp(this.angularVelocity.speed / 0.32, 0, 1);
    this.smear = lerp(this.smear, targetSmear, this.dragging ? 0.14 : 0.055);
    if (!this.dragging && targetSmear < this.smear)
      this.smear = lerp(this.smear, targetSmear, easeOutCubic(0.09));

    // Swirl: ramp up while dragging, decay slowly on release
    if (this.dragging) {
      this.globalSwirlAmount = lerp(this.globalSwirlAmount, 0.88, 0.035 * step);
    } else {
      this.globalSwirlAmount = lerp(this.globalSwirlAmount, 0, 0.022 * step);
      if (this.globalSwirlAmount < 0.003) this.globalSwirlAmount = 0;
    }

    const s    = this.sphere;
    const dx   = this.cursor.x - s.cx;
    const dy   = this.cursor.y - s.cy;
    const dist = Math.hypot(dx, dy);
    const prox = this.cursor.active ? clamp(1 - dist / (s.r * 1.5), 0, 1) : 0;
    const lStr = prox * s.r * 0.03;
    this.lean.x = lerp(this.lean.x, dist ? (dx / dist) * lStr : 0, 0.08);
    this.lean.y = lerp(this.lean.y, dist ? (dy / dist) * lStr : 0, 0.08);
    this.updateParticles(step);
    this.updateArcs(step, prox, dist);
    const breathGlow = this.passiveCoreBreath() * 0.028;
    this.ambient = clamp(0.38 + Math.sin(this.time * 1.2) * 0.055 + prox * 0.22 + this.smear * 0.1 + breathGlow, 0, 1);
  }

  updateParticles(step) {
    const smearBoost = 1 + this.smear * 2.4;
    const swirl = this.globalSwirlAmount;

    // Core — swirl + slosh physics
    for (const p of this.core) {
      p.swirlAmount = lerp(p.swirlAmount, swirl, 0.05 * step);

      // u advance: blend normal speed with helical (faster, curl-influenced)
      const normalDu = p.du * step * (1 + this.smear * 1.5);
      const helicalDu = (p.du * 2.5 + curlNoise(p.u * 1.3, p.v * 0.9, this.time * 0.8 + p.phase).x * 0.003) * step;
      p.u = (p.u + lerp(normalDu, helicalDu, p.swirlAmount) + TAU) % TAU;
      p.phase += 0.015 * step;

      // Radial slosh — damped spring oscillator. On release the damping rises
      // as swirl fades so the core recoheres without an outward overshoot.
      const restDisplace = this.dragging ? 0.15 * p.swirlAmount : 0;
      const spring = p.springK * (this.dragging ? 1 : 1.16);
      const damp = p.dampK * (this.dragging ? 1.05 : 2.65);
      p.radialVel += (-spring * (p.radialDisplace - restDisplace) - damp * p.radialVel) * step;
      p.radialVel = clamp(p.radialVel, -0.032, 0.024 + p.swirlAmount * 0.028);
      p.radialDisplace += p.radialVel * step;
      p.radialDisplace = clamp(p.radialDisplace, -p.radial * 0.55, 0.22 + p.swirlAmount * 0.16);
      if (Math.abs(p.radialVel) < 0.0002 && Math.abs(p.radialDisplace) < 0.002) {
        p.radialVel = 0;
        p.radialDisplace *= 0.95;
      }
    }

    // Filaments
    for (const p of this.filaments) {
      const sw   = 3;
      const curl = curlNoise(p.u * 1.3, p.v * 0.9, this.time * 0.8 + p.phase);
      p.u = (p.u + (p.du + curl.x * 0.004 * smearBoost) * step * sw + TAU) % TAU;
      p.v = (p.v + (p.dv + curl.y * 0.006 * smearBoost) * step * sw + TAU) % TAU;
      p.phase = (p.phase + (0.006 + curl.y * 0.002) * step * sw) % TAU;
      p.life -= 0.002 * step;
      if (p.life <= 0) {
        p.u = rand(0, TAU); p.v = rand(0, TAU); p.phase = rand(0, TAU);
        p.life = rand(0.55, 1);
      }
    }

    // Spin burst sparks — pink-lavender plasma bursts
    if (this.smear > 0.26 && !this.reducedMotion) {
      const chance = (this.smear - 0.26) * 0.05 * step;
      if (Math.random() < chance) {
        const u = rand(0, TAU);
        const q = this.project(this.torusPoint(u, rand(0, TAU), "core", rand(0.04, 0.16)));
        const spd = (2 + this.smear * 4.5) * rand(0.6, 1.5);
        const ang = rand(0, TAU);
        this.sparks.push({
          x: q.x, y: q.y,
          vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
          size: rand(1.4, 3.2), life: rand(0.65, 1),
          decay: rand(0.024, 0.052), burst: true
        });
      }
    }
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.x += sp.vx * step; sp.y += sp.vy * step;
      sp.life -= sp.decay * step;
      if (sp.life <= 0) this.sparks.splice(i, 1);
    }
    if (this.sparks.length > 200) this.sparks.splice(0, this.sparks.length - 200);
  }

  updateArcs(step, prox, cursorDist) {
    const elapsed = (step * 16.67) / 1000;
    for (let i = this.arcs.length - 1; i >= 0; i--) {
      this.arcs[i].life -= this.arcs[i].decay * step;
      if (this.arcs[i].life <= 0) this.arcs.splice(i, 1);
    }
    if (this.reducedMotion && Math.random() < 0.8) return;
    const maxArcs = TIERS[this.quality.tier].arcs;

    this.passiveArcDelay -= elapsed;
    if (this.passiveArcDelay <= 0 && this.arcs.length < maxArcs) {
      this.spawnPassiveEdgeArc();
      this.passiveArcDelay = rand(1, 2);
    }

    const cursorOn = this.cursor.active && Number.isFinite(this.cursor.x);
    const screenDiag = Math.hypot(this.W, this.H);
    const wideProx   = cursorOn ? clamp(1 - cursorDist / (screenDiag * 0.55), 0, 1) : 0;
    const chance = cursorOn
      ? (0.005 + wideProx * 0.048) * (this.reducedMotion ? 0.2 : 1)
      : 0.01;
    if (this.arcs.length < maxArcs && Math.random() < chance)
      cursorOn ? this.spawnExternalArc(Math.max(0.16, wideProx)) : this.spawnPassiveEdgeArc();
  }

  spawnExternalArc(prox) {
    const s    = this.sphere;
    const dx   = this.cursor.x - s.cx;
    const dy   = this.cursor.y - s.cy;
    const dist = Math.hypot(dx, dy) || 1;
    const dir  = { x: dx / dist, y: dy / dist };
    const from = this.innerTorusArcOrigin(dir);
    const inside = dist <= s.r * 0.96;
    const reach  = clamp(0.87 + prox * 0.11, 0.87, 0.98);
    const to = inside
      ? { x: this.cursor.x, y: this.cursor.y }
      : { x: s.cx + dir.x * s.r * reach, y: s.cy + dir.y * s.r * reach };
    const span = Math.hypot(to.x - from.x, to.y - from.y);
    this.arcs.push(this.makeArc(from, to, Math.min(s.r * 0.13, span * 0.28) * prox, 5, rand(0.58, 1)));
    this.addSpark(from.x, from.y, inside ? 14 : 5);
    this.addSpark(to.x, to.y, inside ? 8 : 2);
  }

  spawnPassiveEdgeArc() {
    const s = this.sphere;
    const u = rand(0, TAU);
    const from = this.project(this.torusPoint(u, rand(0, TAU), "core", rand(0.025, 0.09)));
    const dx = from.x - s.cx;
    const dy = from.y - s.cy;
    const len = Math.hypot(dx, dy) || 1;
    const dir = { x: dx / len, y: dy / len };
    const to = {
      x: s.cx + dir.x * s.r * rand(0.88, 0.97),
      y: s.cy + dir.y * s.r * rand(0.88, 0.97)
    };
    const span = Math.hypot(to.x - from.x, to.y - from.y);
    this.arcs.push(this.makeArc(from, to, Math.min(s.r * 0.085, span * 0.24), 4, rand(0.28, 0.55)));
    this.addSpark(from.x, from.y, 4);
    this.addSpark(to.x, to.y, 2);
  }

  innerTorusArcOrigin(dir) {
    const s = this.sphere;
    let best = null, bestScore = -Infinity;
    const jitter = rand(0, TAU / 64);
    for (let i = 0; i < 64; i++) {
      const u  = (i / 64) * TAU + jitter;
      const q  = this.project(this.torusPoint(u, 0, "core", 0.035));
      const vx = q.x - s.cx; const vy = q.y - s.cy;
      const ln = Math.hypot(vx, vy) || 1;
      const score = (vx * dir.x + vy * dir.y) / ln * 1.6
        - Math.abs(vx * dir.y - vy * dir.x) / Math.max(s.r, 1) * 0.22
        + q.near * 0.08;
      if (score > bestScore) { bestScore = score; best = q; }
    }
    return best ? { x: best.x, y: best.y } : { x: s.cx, y: s.cy };
  }

  makeArc(from, to, displace, detail, alpha) {
    const branches = [];
    const points   = this.midpointArc(from, to, displace, detail, branches);
    return { points, branches, alpha, life: 1, decay: rand(0.22, 0.42) };
  }

  midpointArc(from, to, displace, detail, branches) {
    if (detail <= 0) return [from, to];
    const dx = to.x - from.x, dy = to.y - from.y;
    const ln = Math.hypot(dx, dy) || 1;
    const nx = -dy / ln, ny = dx / ln;
    const mid = {
      x: (from.x + to.x) * 0.5 + nx * rand(-displace, displace),
      y: (from.y + to.y) * 0.5 + ny * rand(-displace, displace)
    };
    if (Math.random() < 0.3 && detail > 2) {
      const be = {
        x: mid.x + dx * rand(0.1, 0.4) + nx * rand(-displace, displace),
        y: mid.y + dy * rand(0.1, 0.4) + ny * rand(-displace, displace)
      };
      branches.push(this.midpointArc(mid, be, displace * 0.5, detail - 2, []));
    }
    return this.midpointArc(from, mid, displace * 0.5, detail - 1, branches)
      .slice(0, -1)
      .concat(this.midpointArc(mid, to, displace * 0.5, detail - 1, branches));
  }

  addSpark(x, y, count) {
    for (let i = 0; i < count; i++)
      this.sparks.push({
        x, y, vx: rand(-2.4, 2.4), vy: rand(-2.4, 2.4),
        size: rand(1, 2.4), life: rand(0.5, 1),
        decay: rand(0.035, 0.07), burst: false
      });
  }

  passiveCoreBreath() {
    const speed = this.reducedMotion ? 0.36 : 0.96;
    const cycle = 0.5 + Math.sin(this.time * speed) * 0.5;
    const eased = 0.5 - Math.cos(cycle * Math.PI) * 0.5;
    return this.reducedMotion ? eased * 0.38 : eased;
  }

  torusDeformAmount() {
    if (this.reducedMotion) return 0.2;
    const drift = 0.5 + Math.sin(this.time * 0.23 + Math.sin(this.time * 0.09) * 0.55) * 0.5;
    return 0.08 + (0.5 - Math.cos(drift * Math.PI) * 0.5) * 0.92;
  }

  torusPoint(u, v, layer = "core", radialScale = 1) {
    const s      = this.sphere;
    const deform = this.torusDeformAmount();
    const breath = 1 + Math.sin(this.time * 1.25) * (this.reducedMotion ? 0.004 : 0.012);
    const fluid = (this.reducedMotion ? 0.006 : 0.038) * deform;
    const lobeA = Math.sin(u * 2.0 + this.time * 0.34);
    const lobeB = Math.sin(u * 3.0 - v * 0.65 - this.time * 0.26);
    const lobeC = Math.sin(u * 0.7 + v * 1.15 + this.time * 0.17);
    const R      = s.r * 0.575 * TORUS_SCALE * breath * (1 + (lobeA * 0.58 + lobeB * 0.3 + lobeC * 0.42) * fluid);
    let tube     = s.r * 0.1725 * TORUS_SCALE;
    if (layer === "filament") tube *= 1 + this.smear * 0.34;
    tube *= radialScale * (1 + (Math.sin(u * 2.6 + v * 0.8 + this.time * 0.62) + lobeC * 0.7) * fluid * 1.45);
    const cv = Math.cos(v);
    const sv = Math.sin(v);
    const phaseSlip = Math.sin(u * 1.35 - this.time * 0.28) * fluid * 0.75;
    const cu = Math.cos(u + phaseSlip);
    const su = Math.sin(u + phaseSlip);
    let x = (R + tube * cv) * cu;
    let y = (R + tube * cv) * su;
    let z = tube * sv;
    const len = Math.hypot(x, y, z);
    const limit = s.r * TORUS_SPHERE_LIMIT;
    if (len > limit) {
      const over = clamp((len - limit) / (s.r * 0.14), 0, 1);
      const squash = limit / len;
      const slide = 1 - over * 0.08;
      x *= squash;
      y *= squash;
      z *= squash * slide;
    }
    return { x, y, z };
  }

  project(point) {
    const s = this.sphere;
    const p = quatRotateVec(this.orientation, point);
    const focal = s.r * 3.15;
    const depth = focal / (focal - p.z);
    return {
      x: s.cx + (p.x + this.lean.x) * depth,
      y: s.cy + (p.y + this.lean.y) * depth,
      z: p.z, depth,
      near: clamp((p.z / s.r + 1) * 0.5, 0, 1)
    };
  }

  // ─── Draw pipeline ───────────────────────────────────────────────────────────

  draw() {
    const ctx  = this.ctx;
    const fade = this.smear > 0.2 ? 0.082 : 0.13;
    this.paintBackground(fade);
    this.decayBurn();
    this.drawGlobeGlow(ctx);
    this.drawGroundShadow(ctx);
    this.drawSphereBack(ctx);
    this.drawPlasma(ctx);
    this.drawBloom(ctx);
    this.drawArcs(ctx);
    this.drawSparks(ctx);
    this.drawGlassOverlay(ctx);
  }

  paintBackground(alpha) {
    const ctx = this.ctx;
    const bg = ctx.createRadialGradient(
      this.sphere.cx, this.sphere.cy, 0,
      this.sphere.cx, this.sphere.cy, Math.max(this.W, this.H) * 0.76
    );
    bg.addColorStop(0,    `rgba(0,0,2,${alpha})`);
    bg.addColorStop(0.22, `rgba(1,0,4,${alpha})`);
    bg.addColorStop(0.5,  `rgba(5,1,18,${alpha * 0.98})`);
    bg.addColorStop(0.76, `rgba(18,4,50,${alpha})`);
    bg.addColorStop(1,    `rgba(37,9,79,${alpha})`);
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.restore();
  }

  drawGlobeGlow(ctx) {
    const s = this.sphere;
    const b = this.ambient;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const g1 = ctx.createRadialGradient(s.cx, s.cy, s.r * 0.34, s.cx, s.cy, s.r * 1.05);
    g1.addColorStop(0,    `rgba(179,71,255,${0.09 * b})`);
    g1.addColorStop(0.42, `rgba(120,20,200,${0.05 * b})`);
    g1.addColorStop(1,    "rgba(0,0,0,0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, this.W, this.H);
    const g2 = ctx.createRadialGradient(s.cx, s.cy, s.r * 0.5, s.cx, s.cy, s.r * 1.35);
    g2.addColorStop(0,   `rgba(100,0,200,${0.04 * b})`);
    g2.addColorStop(0.5, `rgba(60,0,140,${0.022 * b})`);
    g2.addColorStop(1,   "rgba(0,0,0,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.restore();
  }

  drawGroundShadow(ctx) {
    const s = this.sphere;
    ctx.save();
    ctx.translate(s.cx, s.cy + s.r * 0.78);
    ctx.scale(1, 0.24);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s.r * 0.92);
    g.addColorStop(0,    "rgba(0,0,0,0.58)");
    g.addColorStop(0.48, "rgba(31,4,48,0.28)");
    g.addColorStop(1,    "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, s.r, 0, TAU); ctx.fill();
    ctx.restore();
  }

  drawSphereBack(ctx) {
    const s = this.sphere;
    ctx.save();
    const fill = ctx.createRadialGradient(
      s.cx - s.r * 0.2, s.cy - s.r * 0.25, s.r * 0.1, s.cx, s.cy, s.r
    );
    fill.addColorStop(0,    "rgba(255,255,255,0.032)");
    fill.addColorStop(0.72, "rgba(232,197,255,0.013)");
    fill.addColorStop(1,    "rgba(232,197,255,0.018)");
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.arc(s.cx, s.cy, s.r, 0, TAU); ctx.fill();
    ctx.restore();
  }

  drawPlasma(ctx) {
    const s = this.sphere;
    this.clearBloom();
    this._burnCore.length = 0;
    this._burnFil.length = 0;
    ctx.save();
    ctx.beginPath(); ctx.arc(s.cx, s.cy, s.r * 0.96, 0, TAU); ctx.clip();
    ctx.globalCompositeOperation = "lighter";
    this.drawFilaments(ctx);
    this.drawCore(ctx);
    this.flushBurn();
    this.drawBurn(ctx);
    ctx.restore();
  }

  clearBloom() {
    for (const [c, cv] of [[this.bloomCtxA, this.bloomA], [this.bloomCtxB, this.bloomB]]) {
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
    }
  }

  drawBloomParticle(point, radius, color, alpha, pass = 1) {
    const targets = pass === 2
      ? [[this.bloomCtxA, 0.5], [this.bloomCtxB, 0.25]]
      : [[this.bloomCtxA, 0.5]];
    for (const [c, scale] of targets) {
      c.save();
      c.globalCompositeOperation = "lighter";
      c.fillStyle = rgbString(color, alpha);
      c.beginPath(); c.arc(point.x * scale, point.y * scale, radius * scale, 0, TAU); c.fill();
      c.restore();
    }
  }

  drawFilaments(ctx) {
    const s   = this.sphere;
    const c   = mixRgb(this.colors.ringRgb, this.colors.arcRgb, clamp(this.smear * 0.48, 0, 1));
    const projected = [];
    const grid = DITHER_GRID;

    for (const p of this.filaments) {
      const pitch   = p.pitch || 2.1;
      const tail    = (p.tail  || 0.07) * (1 + this.smear * 1.15);
      const shimmer = Math.sin(this.time * 2.4 + p.phase + p.u * 1.2) * 0.1;
      const v1 = p.phase + p.u * pitch + p.v * 0.12 + shimmer;
      const u0 = p.u - tail;
      const v0 = p.phase + u0 * pitch + p.v * 0.12 + shimmer * 0.7;
      const q1 = this.project(this.torusPoint(p.u, v1, "filament", 0.9 + this.smear * 0.14));
      const q0 = this.project(this.torusPoint(u0, v0, "filament", 0.9 + this.smear * 0.14));
      const alpha = (0.11 + q1.near * 0.28) * p.life * (1 + this.smear * 0.36) * this.alphaScale;

      const fdx = q1.x - q0.x, fdy = q1.y - q0.y;
      const fln = Math.hypot(fdx, fdy) || 1;
      const fnx = -fdy / fln, fny = fdx / fln;
      const bend = Math.sin(p.phase * 3.1 + this.time * 0.7) * s.r * 0.024 * (1 + this.smear * 0.58);

      projected.push({
        q0, q1,
        bx: (q0.x + q1.x) * 0.5 + fnx * bend,
        by: (q0.y + q1.y) * 0.5 + fny * bend,
        alpha,
        color: mixRgb(c, this.colors.hotRgb, clamp(q1.near * 0.18 + this.smear * 0.3, 0, 1)),
        dot  : clamp(0.95 + q1.depth * 1.55 + this.smear * 0.3, 0.8, 2.9),
        width: clamp(0.5 + q1.depth * 1.1 + this.smear * 0.46, 0.5, 2.5)
      });
    }

    projected.sort((a, b) => a.q1.z - b.q1.z);

    // Pass 1 — wide outer glow (batched, single stroke)
    ctx.lineCap    = "round";
    ctx.lineWidth  = 5.8 + this.smear * 2.2;
    ctx.strokeStyle = rgbString(c, 0.038 * (1 + this.smear * 0.65));
    ctx.beginPath();
    for (const f of projected) {
      ctx.moveTo(f.q0.x, f.q0.y);
      ctx.quadraticCurveTo(f.bx, f.by, f.q1.x, f.q1.y);
    }
    ctx.stroke();

    // Pass 2 — medium glow (batched, single stroke)
    ctx.lineWidth   = 2.3 + this.smear * 0.9;
    ctx.strokeStyle = rgbString(c, 0.115 * (1 + this.smear * 0.48));
    ctx.beginPath();
    for (const f of projected) {
      ctx.moveTo(f.q0.x, f.q0.y);
      ctx.quadraticCurveTo(f.bx, f.by, f.q1.x, f.q1.y);
    }
    ctx.stroke();

    // Pass 3 — bucketed core strokes (5 buckets replace N per-filament gradient strokes)
    const buckets = [[], [], [], [], []];
    for (const f of projected) {
      const b = Math.min(4, Math.floor(f.alpha * 12));
      buckets[b].push(f);
    }
    for (let b = 0; b < 5; b++) {
      const group = buckets[b];
      if (!group.length) continue;
      const rep = group[group.length >> 1];
      ctx.strokeStyle = rgbString(rep.color, rep.alpha * 0.8);
      ctx.lineWidth = rep.width;
      ctx.beginPath();
      for (const f of group) {
        ctx.moveTo(f.q0.x, f.q0.y);
        ctx.quadraticCurveTo(f.bx, f.by, f.q1.x, f.q1.y);
      }
      ctx.stroke();
    }

    // Endpoint dots — dithered squares with Bayer pattern
    for (const f of projected) {
      const gx = Math.round(f.q1.x / grid);
      const gy = Math.round(f.q1.y / grid);
      const dx = gx * grid;
      const dy = gy * grid;
      const threshold = BAYER4[(gy & 3) * 4 + (gx & 3)];
      const dAlpha = f.alpha * (f.alpha * 2.5 > threshold ? 1.2 : 0.4);
      const dotSize = f.dot * 1.4;
      ctx.fillStyle = rgbString(f.color, clamp(dAlpha * 1.28, 0, 1));
      ctx.fillRect(dx - dotSize * 0.5, dy - dotSize * 0.5, dotSize, dotSize);

      if (f.alpha > 0.1) this._burnFil.push(dx, dy);
    }

    // Bloom (reduced frequency)
    for (const f of projected) {
      if (f.alpha > 0.17 && Math.random() < 0.015)
        this.drawBloomParticle(f.q1, f.dot * 3.9, f.color, f.alpha * 0.40, 1);
    }
  }

  drawCore(ctx) {
    const grid = DITHER_GRID;
    const projected = [];
    const breathPhase = this.passiveCoreBreath();

    for (const p of this.core) {
      // Effective radial: passive breathing eases the white core toward the
      // purple shell; manual swirl still adds the larger drag deformation.
      const swirlExpand = p.swirlAmount * 0.22;
      const shellTarget = 0.86 + Math.sin(p.u * 1.4 + p.phase * 0.35 + this.time * 0.28) * 0.035;
      const fluidDrift = Math.sin(p.u * 2.1 + p.phase * 0.7 + this.time * 0.88) * breathPhase * 0.035;
      const breathRadial = lerp(p.radial, shellTarget + fluidDrift, breathPhase);
      const effectiveRadial = Math.max(0.01, breathRadial + swirlExpand + p.radialDisplace);

      // v: blend normal wobble with helical winding
      const normalV = p.v + Math.sin(p.phase + this.time * 1.8) * (0.18 + this.smear * 0.17);
      const helicalV = p.phase + p.u * p.helicalPitch + p.v * 0.12;
      const motionSwirl = clamp(p.swirlAmount + breathPhase * 0.55, 0, 1);
      const v = lerp(normalV, helicalV, motionSwirl);

      const layer = p.swirlAmount > 0.15 ? "filament" : "core";
      const q = this.project(this.torusPoint(p.u, v, layer, effectiveRadial * (1 + this.smear * 0.44)));
      const center = clamp(1 - p.radial / 0.22, 0, 1);

      const spinShift = clamp(this.smear * 0.42, 0, 1);
      const baseColor = mixRgb(
        mixRgb(this.colors.hotRgb, this.colors.coreRgb, 0.72 + center * 0.28),
        this.colors.arcRgb,
        spinShift * 0.32
      );
      // Swirl shifts white particles toward the violet ring color
      const color = mixRgb(baseColor, this.colors.ringRgb, p.swirlAmount * 0.34 + breathPhase * 0.08);

      const size  = (0.9 + center * 1.62 + this.smear * 0.16 + breathPhase * 0.16) * q.depth;
      if (size < 0.5) continue;
      const alpha = (0.3 + center * 0.5) * (0.58 + q.near * 0.5) * this.alphaScale;
      projected.push({ q, color, size, alpha, center });
    }

    projected.sort((a, b) => a.q.z - b.q.z);

    // Dithered rendering — grid-snapped squares with Bayer threshold
    for (const { q, color, size, alpha, center } of projected) {
      const gx = Math.round(q.x / grid);
      const gy = Math.round(q.y / grid);
      const dx = gx * grid;
      const dy = gy * grid;
      const threshold = BAYER4[(gy & 3) * 4 + (gx & 3)];
      const dAlpha = alpha * (alpha * 2.2 > threshold ? 1.15 : 0.35);
      const s = Math.max(grid, size * 1.1);

      ctx.fillStyle = rgbString(color, clamp(dAlpha, 0, 1));
      ctx.fillRect(dx - s * 0.5, dy - s * 0.5, s, s);

      if (alpha > 0.15) this._burnCore.push(dx, dy);

      const bloomP = center > 0.52 ? 0.01 : 0.004;
      if (Math.random() < bloomP)
        this.drawBloomParticle(q, size * (2.85 + breathPhase * 0.45), color, alpha * 0.24, center > 0.72 ? 2 : 1);
    }
  }

  // ─── Burn canvas — pixel burn persistence ─────────────────────────────────

  decayBurn() {
    const bc = this.burnCtx;
    bc.globalCompositeOperation = "source-over";
    bc.fillStyle = "rgba(0,0,0,0.24)";
    bc.fillRect(0, 0, this.burnCanvas.width, this.burnCanvas.height);
  }

  flushBurn() {
    const bc = this.burnCtx;
    const s = this.burnScale;
    bc.globalCompositeOperation = "lighter";

    if (this._burnCore.length) {
      bc.fillStyle = "rgba(230,210,255,0.12)";
      bc.beginPath();
      for (let i = 0; i < this._burnCore.length; i += 2) {
        bc.rect(this._burnCore[i] * s, this._burnCore[i + 1] * s, 1.5, 1.5);
      }
      bc.fill();
    }

    if (this._burnFil.length) {
      bc.fillStyle = "rgba(170,90,255,0.08)";
      bc.beginPath();
      for (let i = 0; i < this._burnFil.length; i += 2) {
        bc.rect(this._burnFil[i] * s, this._burnFil[i + 1] * s, 1, 1);
      }
      bc.fill();
    }
  }

  drawBurn(ctx) {
    if (!this.burnCanvas.width) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.16;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.burnCanvas, 0, 0, this.W, this.H);
    ctx.imageSmoothingEnabled = true;
    ctx.restore();
  }

  // ─── Post-plasma effects ──────────────────────────────────────────────────

  drawBloom(ctx) {
    const passes = TIERS[this.quality.tier].bloom;
    if (passes <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const boost = 1 + this.smear * 0.58;
    ctx.globalAlpha = clamp(0.46 * boost, 0, 0.94);
    ctx.filter = "blur(15px)";
    ctx.drawImage(this.bloomA, 0, 0, this.W, this.H);
    if (passes > 1) {
      ctx.globalAlpha = clamp(0.28 * boost, 0, 0.72);
      ctx.filter = "blur(29px)";
      ctx.drawImage(this.bloomB, 0, 0, this.W, this.H);
    }
    ctx.filter = "none";
    ctx.restore();
  }

  drawArcs(ctx) {
    if (!this.arcs.length) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (const arc of this.arcs) {
      const alpha = arc.life * arc.alpha;
      this.strokeArcPoints(ctx, arc.points, alpha, false);
      for (const br of arc.branches) this.strokeArcPoints(ctx, br, alpha * 0.5, true);
    }
    ctx.restore();
  }

  strokeArcPoints(ctx, points, alpha, branch) {
    if (points.length < 2) return;
    ctx.strokeStyle = rgba(this.colors.arc, alpha * 0.45);
    ctx.lineWidth   = branch ? 3 : 4.8;
    ctx.shadowBlur  = 10; ctx.shadowColor = this.colors.arc;
    ctx.beginPath();
    points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.stroke();
    ctx.strokeStyle = rgba(this.colors.core, alpha);
    ctx.lineWidth   = branch ? 0.8 : 1.5;
    ctx.shadowBlur  = 3;
    ctx.beginPath();
    points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.stroke();
    this.drawDitheredArcPixels(ctx, points, alpha, branch);
    ctx.shadowBlur = 0;
  }

  drawDitheredArcPixels(ctx, points, alpha, branch) {
    const grid = Math.max(2, DITHER_GRID * 2);
    const step = grid * 0.72;
    ctx.shadowBlur = 0;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const samples = Math.max(1, Math.ceil(len / step));
      for (let j = 0; j <= samples; j++) {
        const t = j / samples;
        const x = a.x + dx * t;
        const y = a.y + dy * t;
        const gx = Math.round(x / grid);
        const gy = Math.round(y / grid);
        const threshold = BAYER4[(gy & 3) * 4 + (gx & 3)];
        const fade = (1 - Math.abs(t - 0.5) * 0.9);
        const pxAlpha = alpha * fade * (branch ? 0.42 : 0.7);
        if (pxAlpha * 2.8 <= threshold) continue;
        ctx.fillStyle = rgba(this.colors.core, clamp(pxAlpha, 0, 1));
        ctx.fillRect(gx * grid - grid * 0.5, gy * grid - grid * 0.5, grid, grid);
      }
    }
  }

  drawSparks(ctx) {
    if (!this.sparks.length) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const sp of this.sparks) {
      const col = sp.burst ? this.colors.hot : this.colors.arc;
      ctx.fillStyle = rgba(col, sp.life * (sp.burst ? 0.92 : 0.78));
      ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.size * sp.life, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  drawGlassOverlay(ctx) {
    const s = this.sphere;
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    const lag = 0.85 + this.smear * 0.05;
    const hx  = s.cx - s.r * 0.35 * lag;
    const hy  = s.cy - s.r * (0.55 - this.smear * 0.04);
    const hi  = ctx.createRadialGradient(hx, hy, 0, hx, hy, s.r * 0.46);
    hi.addColorStop(0,   "rgba(255,255,255,0.26)");
    hi.addColorStop(0.3, "rgba(255,255,255,0.07)");
    hi.addColorStop(1,   "rgba(255,255,255,0)");
    ctx.fillStyle = hi;
    ctx.beginPath(); ctx.arc(s.cx, s.cy, s.r * 0.98, 0, TAU); ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    const caust = ctx.createRadialGradient(
      s.cx + s.r * 0.22, s.cy + s.r * 0.42, 0,
      s.cx + s.r * 0.22, s.cy + s.r * 0.42, s.r * 0.48
    );
    caust.addColorStop(0, "rgba(0,0,0,0.15)");
    caust.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = caust;
    ctx.beginPath(); ctx.arc(s.cx, s.cy, s.r * 0.98, 0, TAU); ctx.fill();

    ctx.restore();
  }
}
