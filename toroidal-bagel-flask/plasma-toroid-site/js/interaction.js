import {
  clamp,
  distance,
  quatFromAxisAngle,
  quatFromVectors,
  trackballPoint
} from "./utils.js";

function ignoresDrag(target) {
  if (!target) return false;
  if (target.id === "globeFocus") return false;
  return Boolean(target.closest("a, button, input, textarea, select, .glass-card, .nav-shell"));
}

export class InteractionController {
  constructor(simulation, focusTarget) {
    this.sim = simulation;
    this.focusTarget = focusTarget;
    this.dragging = false;
    this.pointerId = null;
    this.lastBall = null;
    this.history = [];
    this.joystick = { x: 0, y: 0 };
    this.joystickFrame = 0;
    this.mobileMode = window.matchMedia("(pointer: coarse), (max-width: 767px)");
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.bind();
  }

  bind() {
    window.addEventListener("pointermove", (event) => {
      this.sim.setCursor(event.clientX, event.clientY, true);
      if (!this.dragging || event.pointerId !== this.pointerId) return;
      if (this.mobileMode.matches) {
        event.preventDefault();
        this.joystick.x = event.clientX;
        this.joystick.y = event.clientY;
        return;
      }
      this.moveDrag(event);
    }, { passive: false });

    window.addEventListener("pointerleave", () => {
      this.sim.setCursor(-10000, -10000, false);
    });

    window.addEventListener("pointerdown", (event) => {
      if (this.reducedMotion || ignoresDrag(event.target)) return;
      const s = this.sim.getSphere();
      const d = distance({ x: event.clientX, y: event.clientY }, { x: s.cx, y: s.cy });
      if (d > s.r) return;
      if (this.mobileMode.matches) event.preventDefault();
      this.dragging = true;
      this.pointerId = event.pointerId;
      this.lastBall = trackballPoint(event.clientX, event.clientY, s.cx, s.cy, s.r);
      this.joystick.x = event.clientX;
      this.joystick.y = event.clientY;
      this.history = [{ x: event.clientX, y: event.clientY, t: performance.now(), ball: this.lastBall }];
      this.sim.beginDrag();
      if (this.mobileMode.matches) this.startJoystick();
      this.focusTarget?.focus({ preventScroll: true });
    });

    window.addEventListener("pointerup", (event) => this.endDrag(event));
    window.addEventListener("pointercancel", (event) => this.endDrag(event));

    this.focusTarget?.addEventListener("keydown", (event) => {
      const amount = 0.035;
      if (event.code === "Space") {
        event.preventDefault();
        this.sim.haltRotation();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.sim.addRotationImpulse({ x: 0, y: -1, z: 0 }, amount);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        this.sim.addRotationImpulse({ x: 0, y: 1, z: 0 }, amount);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        this.sim.addRotationImpulse({ x: -1, y: 0, z: 0 }, amount);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        this.sim.addRotationImpulse({ x: 1, y: 0, z: 0 }, amount);
      }
    });
  }

  moveDrag(event) {
    const s = this.sim.getSphere();
    const ball = trackballPoint(event.clientX, event.clientY, s.cx, s.cy, s.r);
    const delta = quatFromVectors(this.lastBall, ball);
    this.sim.applyRotation(delta);
    this.lastBall = ball;
    const now = performance.now();
    this.history.push({ x: event.clientX, y: event.clientY, t: now, ball });
    this.history = this.history.filter((item) => now - item.t <= 90);
  }

  startJoystick() {
    if (this.joystickFrame) return;
    const tick = () => {
      if (!this.dragging || !this.mobileMode.matches) {
        this.joystickFrame = 0;
        return;
      }
      const velocity = this.mobileJoystickVelocity();
      if (velocity.speed > 0.0015) {
        this.sim.applyRotation(quatFromAxisAngle(velocity.axis, velocity.speed));
      }
      this.joystickFrame = requestAnimationFrame(tick);
    };
    this.joystickFrame = requestAnimationFrame(tick);
  }

  mobileJoystickVelocity() {
    const s = this.sim.getSphere();
    const dx = (this.joystick.x - s.cx) / Math.max(s.r, 1);
    const dy = (this.joystick.y - s.cy) / Math.max(s.r, 1);
    const mag = clamp(Math.hypot(dx, dy), 0, 1);
    if (mag < 0.045) return { axis: { x: 0, y: 0, z: 1 }, speed: 0 };
    return {
      axis: { x: dy / mag, y: -dx / mag, z: (dx * dy) * 0.08 },
      speed: (0.0025 + mag * 0.024) * mag
    };
  }

  endDrag(event) {
    if (!this.dragging || event.pointerId !== this.pointerId) return;
    const recent = this.history;
    this.dragging = false;
    this.pointerId = null;
    if (this.joystickFrame) {
      cancelAnimationFrame(this.joystickFrame);
      this.joystickFrame = 0;
    }
    if (this.mobileMode.matches) {
      const velocity = this.mobileJoystickVelocity();
      this.sim.endDrag({
        axis: velocity.axis,
        speed: clamp(velocity.speed * 3.5, 0, 0.16)
      });
      return;
    }
    if (recent.length < 2) {
      this.sim.endDrag({ axis: { x: 0, y: 0, z: 1 }, speed: 0 });
      return;
    }
    const first = recent[0];
    const last = recent[recent.length - 1];
    const dt = Math.max(16, last.t - first.t);
    const q = quatFromVectors(first.ball, last.ball);
    const axisLen = Math.hypot(q.x, q.y, q.z) || 1;
    const angle = 2 * Math.atan2(axisLen, clamp(q.w, -1, 1));
    this.sim.endDrag({
      axis: { x: q.x / axisLen, y: q.y / axisLen, z: q.z / axisLen },
      speed: clamp(angle / (dt / 16.67), 0, 0.42)
    });
  }
}
