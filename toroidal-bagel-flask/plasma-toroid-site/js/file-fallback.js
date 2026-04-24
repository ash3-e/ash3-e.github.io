(function () {
  "use strict";
  setTimeout(function () {
    if (window.__plasmaModuleStarted) return;
    var canvas = document.getElementById("plasmaCanvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var root = getComputedStyle(document.documentElement);
    var colors = {
      core: root.getPropertyValue("--plasma-core").trim() || "#ffd9ff",
      hot: root.getPropertyValue("--plasma-hot").trim() || "#ff7cff",
      ring: root.getPropertyValue("--plasma-ring").trim() || "#b347ff"
    };
    var W = 0;
    var H = 0;
    var dpr = 1;
    var cx = 0;
    var cy = 0;
    var sr = 1;
    var particles = [];
    var rot = { x: 1.2, y: -0.18, z: -0.08 };
    var pointer = { x: -9999, y: -9999, down: false, lastX: 0, lastY: 0 };
    var baseCount = innerWidth < 768 ? 1700 : 2900;
    var coreCount = Math.floor(baseCount * 0.45);
    var count = coreCount + Math.floor(baseCount * 0.55 * 2);

    function resize() {
      dpr = Math.min(innerWidth < 768 ? 1.4 : 1.8, Math.max(1, devicePixelRatio || 1));
      W = innerWidth;
      H = innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sr = Math.max(W < 768 ? 185 : 160, Math.min(Math.min(W, H) * (W < 768 ? 0.32 : 0.15), W < 768 ? 330 : 310));
      cx = W * 0.5;
      cy = H * (W < 768 ? 0.48 : 0.52);
    }

    function seed() {
      particles.length = 0;
      for (var i = 0; i < count; i++) {
        var core = i < coreCount;
        particles.push({
          core: core,
          u: Math.random() * Math.PI * 2,
          v: Math.random() * Math.PI * 2,
          phase: Math.random() * Math.PI * 2,
          radial: core ? 0.015 + Math.random() * 0.16 : 0.88 + Math.random() * 0.14,
          pitch: 1.7 + Math.random() * 0.75,
          tail: 0.045 + Math.random() * 0.08,
          s: core ? 0.9 + Math.random() * 2.1 : 0.8 + Math.random() * 1.8,
          du: 0.001 + Math.random() * 0.004,
          dv: -0.004 + Math.random() * 0.008
        });
      }
    }

    function rotate(p) {
      var sx = Math.sin(rot.x), cxr = Math.cos(rot.x);
      var sy = Math.sin(rot.y), cyr = Math.cos(rot.y);
      var sz = Math.sin(rot.z), czr = Math.cos(rot.z);
      var y1 = p.y * cxr - p.z * sx;
      var z1 = p.y * sx + p.z * cxr;
      var x2 = p.x * cyr + z1 * sy;
      var z2 = -p.x * sy + z1 * cyr;
      return { x: x2 * czr - y1 * sz, y: x2 * sz + y1 * czr, z: z2 };
    }

    function torus(u, v, radial) {
      var R = sr * 0.5;
      var tube = sr * 0.15 * (radial === undefined ? 1 : radial);
      return {
        x: (R + tube * Math.cos(v)) * Math.cos(u),
        y: (R + tube * Math.cos(v)) * Math.sin(u),
        z: tube * Math.sin(v)
      };
    }

    function project(p) {
      var r = rotate(p);
      var focal = sr * 3.1;
      var depth = focal / (focal - r.z);
      return { x: cx + r.x * depth, y: cy + r.y * depth, z: r.z, depth: depth, near: Math.max(0, Math.min(1, (r.z / sr + 1) * 0.5)) };
    }

    function draw(t) {
      var bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.72);
      bg.addColorStop(0, "rgba(1,0,4,.12)");
      bg.addColorStop(0.36, "rgba(2,0,6,.12)");
      bg.addColorStop(0.64, "rgba(7,2,25,.118)");
      bg.addColorStop(1, "rgba(37,9,79,.12)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.translate(cx, cy + sr * 0.78);
      ctx.scale(1, 0.24);
      var sh = ctx.createRadialGradient(0, 0, 0, 0, 0, sr);
      sh.addColorStop(0, "rgba(0,0,0,.58)");
      sh.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sh;
      ctx.beginPath();
      ctx.arc(0, 0, sr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      var rim = ctx.createRadialGradient(cx, cy, sr * 0.86, cx, cy, sr * 1.02);
      rim.addColorStop(0, "rgba(230,200,255,0)");
      rim.addColorStop(0.72, "rgba(230,200,255,.24)");
      rim.addColorStop(1, "rgba(230,200,255,0)");
      ctx.fillStyle = rim;
      ctx.beginPath();
      ctx.arc(cx, cy, sr, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      for (var i = 0; i < particles.length; i++) {
        var part = particles[i];
        if (part.core) continue;
        part.u += part.du * 3;
        part.v += (part.dv + Math.sin(t + i) * 0.0008) * 3;
        part.phase += 0.018;
        var u0 = part.u - part.tail;
        var v1 = part.phase + part.u * part.pitch + part.v * 0.12 + Math.sin(t * 2.4 + part.phase) * 0.1;
        var v0 = part.phase + u0 * part.pitch + part.v * 0.12;
        var p0 = project(torus(u0, v0, part.radial));
        var p = project(torus(part.u, v1, part.radial));
        var alpha = 0.06 + p.near * 0.15;
        var tr = ctx.createLinearGradient(p0.x, p0.y, p.x, p.y);
        tr.addColorStop(0, "rgba(179,71,255,0)");
        tr.addColorStop(0.5, "rgba(179,71,255," + (alpha * 0.32) + ")");
        tr.addColorStop(1, "rgba(179,71,255," + alpha + ")");
        ctx.strokeStyle = tr;
        ctx.lineWidth = 0.55 + p.depth * 1.15;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.fillStyle = "rgba(179,71,255," + (alpha * 1.1) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, part.s * p.depth, 0, Math.PI * 2);
        ctx.fill();
      }
      for (var j = 0; j < particles.length; j++) {
        var corePart = particles[j];
        if (!corePart.core) continue;
        corePart.u += corePart.du;
        corePart.phase += 0.015;
        var cv = corePart.v + Math.sin(corePart.phase + t * 1.8) * 0.18;
        var cp = project(torus(corePart.u, cv, corePart.radial));
        var ca = 0.14 + cp.near * 0.2;
        ctx.fillStyle = "rgba(255,217,255," + ca + ")";
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, corePart.s * cp.depth, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      var hi = ctx.createRadialGradient(cx - sr * 0.35, cy - sr * 0.55, 0, cx - sr * 0.35, cy - sr * 0.55, sr * 0.45);
      hi.addColorStop(0, "rgba(255,255,255,.18)");
      hi.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = hi;
      ctx.beginPath();
      ctx.arc(cx, cy, sr * 0.98, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      rot.z += 0.0008;
      requestAnimationFrame(draw);
    }

    addEventListener("resize", resize, { passive: true });
    addEventListener("pointermove", function (event) {
      if (!pointer.down) return;
      rot.y += (event.clientX - pointer.lastX) * 0.004;
      rot.x += (event.clientY - pointer.lastY) * 0.004;
      pointer.lastX = event.clientX;
      pointer.lastY = event.clientY;
    }, { passive: true });
    addEventListener("pointerdown", function (event) {
      pointer.down = true;
      pointer.lastX = event.clientX;
      pointer.lastY = event.clientY;
    }, { passive: true });
    addEventListener("pointerup", function () { pointer.down = false; }, { passive: true });
    resize();
    seed();
    requestAnimationFrame(draw);
  }, 600);
})();
