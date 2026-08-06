(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={t1:{kind:`linear`,angle:90},t2:{kind:`radial`,angle:0},t3:{kind:`linear`,angle:0},t3a:{kind:`linear`,angle:0},t4:{kind:`linear`,angle:90},t5:{kind:`radial`,angle:0},t6:{kind:`band`,angle:0},t7:{kind:`linear`,angle:135},t8:{kind:`ring`,angle:0}},t={main:`rgba(8,4,20,.54)`,elevated:`rgba(14,8,32,.82)`,chrome:`rgba(10,6,24,.58)`,code:`rgba(4,2,12,.8)`,input:`rgba(6,2,16,.68)`,overlay:`rgba(7,3,18,.8)`},n={main:`rgba(198,168,255,.14)`,elevated:`rgba(198,168,255,.28)`,chrome:`rgba(198,168,255,.14)`,code:`rgba(198,168,255,.14)`,input:`rgba(198,168,255,.14)`,overlay:`rgba(216,196,255,.42)`},r={main:12,elevated:14,chrome:2,code:2,input:8,overlay:12},i={main:null,elevated:null,chrome:`left`,code:null,input:null,overlay:`top`},a=`#07040d`,o={main:24,elevated:24,chrome:24,code:24,input:24,overlay:30},s=[`main`,`elevated`,`chrome`,`code`,`input`,`overlay`],c=[`dome`,`cone`,`pillow`,`chisel`,`round`,`flat`],l={dome:[1,1],cone:[.55,1.35],pillow:[1.9,.8],chisel:[.32,1.7],round:[1.45,.9],flat:[2.8,.45]},u={gl:[1,0,0,0,0,1,0,0,0,0,1,0],dx:[1,0,0,0,0,-1,0,1,0,0,1,0],fx:[-1,0,0,1,0,1,0,0,0,0,1,0],swap:[0,1,0,0,1,0,0,0,0,0,1,0],flat:[1,0,0,0,0,1,0,0,0,0,.35,.4]},ee={flow:0,burst:1,"burst-b":2},d={normal:0,screen:1,overlay:2,"soft-light":3,multiply:4},te={tangent:0,height:1,slope:2,raw:3},f=4,ne=8,re=1,p=512,ie=2048,ae=520,oe=340,se=e=>ne/Math.max(1,Math.round(ne/e)),ce=3*Math.sqrt(2*Math.PI)/4,m=(e,t)=>t?m(t,e%t):e,le=[];for(let e=-3;e<=3;e+=1)for(let t=-3;t<=3;t+=1)(e||t)&&m(Math.abs(e),Math.abs(t))===1&&le.push([e,t]);function h(e,t,n=0){let r=e[t];return typeof r==`number`&&Number.isFinite(r)?r:n}function g(e,t,n=``){let r=e[t];return typeof r==`string`?r:n}function ue(e,t,n=!1){let r=e[t];return typeof r==`boolean`?r:n}function de(e){return{preset:g(e,`preset`,`t3`),cell:h(e,`cell`,6),hard:h(e,`hard`,22),dense:h(e,`dense`,40),sparse:h(e,`sparse`,88),reach:h(e,`reach`,100),speed:h(e,`speed`,42),run:h(e,`run`,22),jit:h(e,`jit`,58),dir:h(e,`dir`,0),flip:ue(e,`flip`),emit:g(e,`emit`,`mirror`),vanish:h(e,`vanish`,100),vwidth:h(e,`vwidth`,100),vstrength:h(e,`vstrength`,10),ox:h(e,`ox`,45),oy:h(e,`oy`,20)}}function fe(e,t){let n=le[0],r=-2;for(let i of le){let a=(i[0]*e+i[1]*t)/Math.hypot(i[0],i[1]);a>r&&(r=a,n=i)}return n}function _(e,t){let n=(t+(e.flip?180:0))*Math.PI/180;return fe(Math.sin(n),-Math.cos(n))}var v=[[0,0,135],[100,0,225],[100,100,315],[0,100,45]];function pe(t){let n=e[t.preset]??e.t3,r=n.kind===`radial`||n.kind===`ring`,i=(e,n,r,i,a,o,s=[t.ox/100,t.oy/100])=>({kind:e,anim:o,angle:n,half:r,invert:i,origin:s,state:t,vector:a});if(t.emit===`edges`)return[0,90,180,270].map(e=>i(`linear`,e,!0,!1,_(t,e),`flow`));if(t.emit===`corners`)return v.map(([e,n,r])=>i(`corner`,r,!1,!1,_(t,r),`flow`,[e/100,n/100]));if(r){let e=[i(n.kind,n.angle,!1,!1,[0,0],`burst`)];return t.emit!==`single`&&e.push(i(n.kind,n.angle,!1,!0,[0,0],`burst-b`)),e}let a=t.emit===`mirror`,o=[i(n.kind,n.angle,a,!1,_(t,t.dir),`flow`)];return t.emit!==`single`&&o.push(i(n.kind,n.angle+180,a,!1,_(t,t.dir+180),`flow`)),o}function me(e,t,n){let r=n/100*1.7,i=(.5-.5*r).toFixed(4),a=(1/(t*3)).toFixed(4),o=e=>`<feFunc${e} type="linear" slope="${r.toFixed(4)}" intercept="${i}"/>`;return`<svg xmlns="http://www.w3.org/2000/svg" width="${e}" height="${e}"><filter id="n" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${a}" numOctaves="3" seed="11" stitchTiles="stitch"/><feColorMatrix type="matrix" values="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 1"/><feComponentTransfer>${o(`R`)}${o(`G`)}${o(`B`)}</feComponentTransfer></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`}var he=`<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='0.04'/></svg>`;function ge(e){return new Promise((t,n)=>{let r=new Image;r.onload=()=>t(r),r.onerror=()=>n(Error(`svg rasterisation failed`)),r.src=`data:image/svg+xml,${encodeURIComponent(e)}`})}function _e(e){let t=Math.max(8,Math.min(100,e.reach))*Math.max(4,Math.min(100,e.vwidth))/100,n=Math.max(0,Math.min(100,e.vanish))/100*t;return[n,Math.min(t,n+Math.max(.5,t*(e.vstrength/100)))]}function ve(e,t,n,r,i){let a=r*Math.PI/180,o=Math.sin(a),s=-Math.cos(a),c=Math.abs(t*o)+Math.abs(n*s),l=e.createLinearGradient(t/2-o*c/2,n/2-s*c/2,t/2+o*c/2,n/2+s*c/2);for(let[e,t]of i)l.addColorStop(Math.max(0,Math.min(1,e/100)),t);e.fillStyle=l,e.fillRect(0,0,t,n)}function y(e,t,n,r,i,a,o){let s=r/100*t,c=i/100*n,l=e.createRadialGradient(s,c,0,s,c,Math.max(a,.01));for(let[e,t]of o)l.addColorStop(Math.max(0,Math.min(1,e/100)),t);e.fillStyle=l,e.fillRect(0,0,t,n)}function b(e,t,n,r,i,a,o,s){e.save(),e.translate(r/100*t,i/100*n),e.scale(Math.max(a/100*t,.01),Math.max(o/100*n,.01));let c=e.createRadialGradient(0,0,0,0,0,1);for(let[e,t]of s)c.addColorStop(Math.max(0,Math.min(1,e/100)),t);e.fillStyle=c,e.fillRect(-8,-8,16,16),e.restore()}var x=(e,t,n,r)=>{let i=n/100*e,a=r/100*t;return Math.hypot(Math.max(i,e-i),Math.max(a,t-a))},S=(e,t,n,r)=>{let i=n/100*e,a=r/100*t;return Math.max(Math.max(i,e-i),Math.max(a,t-a))};function ye(e,t,n,r){let i=r.state,a=i.dense/100,o=i.sparse/100,s=Math.max(8,Math.min(100,i.reach)),c=e=>e*s,l=e=>`rgba(0,0,0,${e.toFixed(3)})`,u=e=>`rgba(255,255,255,${e.toFixed(3)})`;if(e.clearRect(0,0,t,n),r.kind===`corner`){let i=s*.5;b(e,t,n,r.origin[0]*100,r.origin[1]*100,i,i,[[0,l(a)],[52,l(0)],[64,u(0)],[100,u(o)]]);return}if(r.kind===`radial`){let s=x(t,n,i.ox,i.oy);r.invert?y(e,t,n,i.ox,i.oy,s,[[0,u(o)],[44,u(o)],[58,u(0)],[66,l(0)],[100,l(a)]]):y(e,t,n,i.ox,i.oy,s,[[0,l(a)],[c(.34),l(0)],[c(.44),u(0)],[c(.96),u(o)]]);return}if(r.kind===`ring`){let r=S(t,n,i.ox,i.oy);y(e,t,n,i.ox,i.oy,r,[[0,u(o)],[20,u(0)],[28,l(0)],[c(.46),l(a)],[c(.64),l(0)],[c(.72),u(0)],[100,u(o)]]);return}if(r.kind===`band`){r.half?ve(e,t,n,r.angle,[[0,u(o)],[26,u(0)],[36,l(0)],[50,l(a)],[100,l(a)]]):ve(e,t,n,r.angle,[[0,u(o)],[26,u(0)],[36,l(0)],[50,l(a)],[64,l(0)],[74,u(0)],[100,u(o)]]);return}r.half?ve(e,t,n,r.angle,[[0,l(a)],[c(.46),l(0)],[c(.58),u(0)],[c(1),u(o)],[100,u(o)]]):ve(e,t,n,r.angle,[[0,l(a)],[48,l(0)],[52,u(0)],[100,u(o)]])}function be(e,t,n,r){let i=r.state,[a,o]=_e(i),s=e=>`rgba(255,255,255,${e})`;if(e.clearRect(0,0,t,n),r.kind===`corner`){let c=Math.max(8,Math.min(100,i.reach))*.5;b(e,t,n,r.origin[0]*100,r.origin[1]*100,c,c,[[0,s(1)],[a,s(1)],[o,s(0)]]);return}if(r.kind===`radial`||r.kind===`ring`){let c=x(t,n,i.ox,i.oy);r.invert?y(e,t,n,i.ox,i.oy,c,[[100-o,s(0)],[100-a,s(1)],[100,s(1)]]):y(e,t,n,i.ox,i.oy,c,[[0,s(1)],[a,s(1)],[o,s(0)]]);return}ve(e,t,n,r.angle+(i.flip?180:0),[[0,s(1)],[a,s(1)],[o,s(0)]])}var C=`#version 300 es
void main() {
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  gl_Position = vec4(p, 0.0, 1.0);
}`,w=`
float softLightC(float b, float s) {
  if (s <= 0.5) return b - (1.0 - 2.0 * s) * b * (1.0 - b);
  float d = (b <= 0.25) ? ((16.0 * b - 12.0) * b + 4.0) * b : sqrt(b);
  return b + (2.0 * s - 1.0) * (d - b);
}`,xe=e=>`
uniform vec2 u${e}Box;
uniform int u${e}Count;
uniform int u${e}Anim[${f}];
uniform float u${e}CellPx;
uniform float u${e}TilePx;
uniform vec2 u${e}OverPx[${f}];
uniform vec2 u${e}FlowPx[${f}];
uniform vec2 u${e}OriginPx[${f}];
uniform float u${e}Dur[${f}];
uniform float u${e}Hard;
uniform float u${e}RampOn;
uniform float u${e}Time;
uniform sampler2D u${e}Noise;
uniform sampler2D u${e}Atlas;
uniform sampler2D u${e}Cone;

/** One RGBA tile per chamber: R ramp grey, G ramp alpha, B vanish alpha. The
 *  two masks are always sampled at the same uv, so packing them halves the
 *  atlas traffic. */
vec4 atlas${e}(int slot, vec2 uv) {
  vec2 c = clamp(uv, 0.002, 0.998);
  return texture(u${e}Atlas, vec2((float(slot) + c.x) / 4.0, c.y));
}

float lattice${e}(vec2 m) {
  // The cone is a repeating CSS background tile, so Chromium rasterises it once
  // at the tile's pixel size and repeats that bitmap. At the small-cell presets
  // (cell 3 -> ~12px on screen) that quantisation is a large part of the dot's
  // shape, so it is baked the same way rather than evaluated analytically.
  float cone = texture(u${e}Cone, m / u${e}CellPx).r;
  float n = texture(u${e}Noise, m / u${e}TilePx).r;
  return softLightC(cone, n);
}

/** Returns (ink alpha, vanish mask) — one atlas fetch serves both. */
vec2 ink${e}(int i, vec2 p) {
  // The vanish mask gates the whole chamber, so read it before doing any
  // lattice work: where it is zero the cone and noise fetches are dead. For the
  // edges presets each of the four chambers covers only part of the frame, so
  // most pixels skip most chambers outright. Exact: the masked result is
  // unchanged.
  vec4 m = atlas${e}(i, p / u${e}Box);
  if (m.b < 0.002) return vec2(0.0);
  float phase = fract(u${e}Time / u${e}Dur[i]);
  float v;
  if (u${e}Anim[i] == 0) {
    // flow: oversized by the travel and slid one tile. .lattice.b is hidden
    // for flow, so exactly one lattice contributes.
    v = lattice${e}(p + u${e}OverPx[i] - u${e}FlowPx[i] * phase);
  } else {
    // burst: two lattices half a period apart, scaled about the origin.
    bool rev = u${e}Anim[i] == 2;
    v = 1.0;                       // the .screen background is #fff
    for (int L = 0; L < 2; L++) {
      float ph = fract(phase + (L == 1 ? 0.5 : 0.0));
      float s = rev ? mix(2.0, 1.0, ph) : mix(1.0, 2.0, ph);
      float env = rev
        ? (ph < 0.20 ? ph / 0.20 : (ph < 0.78 ? 1.0 : 1.0 - (ph - 0.78) / 0.22))
        : (ph < 0.22 ? ph / 0.22 : (ph < 0.78 ? 1.0 : 1.0 - (ph - 0.78) / 0.22));
      if (env <= 0.0) continue;
      v = mix(v, lattice${e}((p - u${e}OriginPx[i]) / s + u${e}OriginPx[i]), env);
    }
  }
  // .ramp sits over the lattices with plain source-over: no blend, no opacity.
  // The normal chambers have no ramp at all: the bench sets --cramp on them but
  // the .s-n .ramp rule reads var(--ramp), which is never set anywhere, so the
  // declaration is invalid and background-image resolves to none. This is a
  // latent bug in the bench; it is reference behaviour, so it is reproduced.
  v = mix(v, m.r, m.g * u${e}RampOn);
  v = clamp((v - 0.5) * u${e}Hard + 0.5, 0.0, 1.0);   // CSS contrast()
  return vec2(1.0 - v, m.b);                            // luminance -> alpha
}
`,Se=`#version 300 es
precision highp float;
out vec4 outColor;
uniform float uPixel;
uniform int uSS;           // box-filter width; 1 when a texel already is a device px
${w}
${xe(`L`)}
void main() {
  // contrast(hard) makes the ink a near-binary mask, and the bench blurs it at
  // full resolution. Point-sampling it on the quarter-res grid would alias the
  // dot edges into the height field, so box-filter each texel over the
  // QUARTER_RES x QUARTER_RES device pixels it stands for.
  int SS = uSS;
  vec4 a = vec4(0.0);
  vec2 base = (gl_FragCoord.xy - 0.5) * uPixel;
  float step = uPixel / float(SS);
  for (int sy = 0; sy < SS; sy++) {
    for (int sx = 0; sx < SS; sx++) {
      vec2 p = base + (vec2(float(sx), float(sy)) + 0.5) * step;
      if (0 < uLCount) a.r += inkL(0, p).x;
      if (1 < uLCount) a.g += inkL(1, p).x;
      if (2 < uLCount) a.b += inkL(2, p).x;
      if (3 < uLCount) a.a += inkL(3, p).x;
    }
  }
  outColor = a / float(SS * SS);
}`,Ce=`#version 300 es
precision highp float;
out vec4 outColor;
uniform sampler2D uSrc;
uniform vec2 uAxis;
uniform float uHalf;
uniform int uTaps;         // floor(uHalf - 0.5); the loop bound must be dynamic,
                           // or every pass pays for the widest radius it allows
void main() {
  vec2 texel = 1.0 / vec2(textureSize(uSrc, 0));
  float n = float(uTaps);
  // A box filter weights every tap equally, so a LINEAR fetch halfway between
  // two texels returns their mean in one sample. Pairing the taps this way
  // halves the fetch count exactly, with no approximation.
  vec4 sum = texture(uSrc, gl_FragCoord.xy * texel);
  float w = 1.0;
  int k = 1;
  for (; k + 1 <= uTaps; k += 2) {
    float o = float(k) + 0.5;
    sum += 2.0 * texture(uSrc, (gl_FragCoord.xy + o * uAxis) * texel);
    sum += 2.0 * texture(uSrc, (gl_FragCoord.xy - o * uAxis) * texel);
    w += 4.0;
  }
  if (k <= uTaps) {
    sum += texture(uSrc, (gl_FragCoord.xy + float(k) * uAxis) * texel);
    sum += texture(uSrc, (gl_FragCoord.xy - float(k) * uAxis) * texel);
    w += 2.0;
  }
  float frac = uHalf - 0.5 - n;      // keeps the box continuous in width
  if (frac > 0.0) {
    sum += frac * texture(uSrc, (gl_FragCoord.xy + (n + 1.0) * uAxis) * texel);
    sum += frac * texture(uSrc, (gl_FragCoord.xy - (n + 1.0) * uAxis) * texel);
    w += 2.0 * frac;
  }
  outColor = sum / max(w, 1e-4);
}`,we=`#version 300 es
precision highp float;
out vec4 outColor;

uniform vec2 uViewport;
uniform float uPixel;
uniform vec2 uSpecOrigin;
uniform sampler2D uBackground;
uniform sampler2D uSheen;
uniform sampler2D uInkHeight;
uniform sampler2D uNrmHeight;
uniform vec3 uTint;
uniform vec2 uLight;
uniform float uSurfaceScale;
uniform float uConvGain;
uniform int uEnc;
uniform mat4 uRemap;
uniform float uToneAlpha;
uniform int uToneBlend;
uniform int uNrmBlend;
uniform float uNrmAlpha;
uniform vec2 uEdge;
uniform vec4 uClip;
uniform float uRadius;
${w}
${xe(`I`)}
${xe(`N`)}

float overlayC(float b, float s) { return b <= 0.5 ? 2.0*b*s : 1.0 - 2.0*(1.0-b)*(1.0-s); }
vec3 blendMode(int m, vec3 b, vec3 s) {
  if (m == 1) return 1.0 - (1.0 - b) * (1.0 - s);
  if (m == 2) return vec3(overlayC(b.r,s.r), overlayC(b.g,s.g), overlayC(b.b,s.b));
  if (m == 3) return vec3(softLightC(b.r,s.r), softLightC(b.g,s.g), softLightC(b.b,s.b));
  if (m == 4) return b * s;
  return s;
}
vec4 over(vec4 dst, vec4 src) { return src + dst * (1.0 - src.a); }

float chan(vec4 v, int i) { return i == 0 ? v.r : i == 1 ? v.g : i == 2 ? v.b : v.a; }

/** The SVG filter spec's interior Sobel/4 surface normal from a height field. */
/** The spec's interior kernel is Sobel/4, whose columns (t + 2m + b) collapse
 *  to 4m on a field already blurred by sigma >> 1px, leaving the central
 *  difference -ss * (h(x+1) - h(x-1)).
 *  Hardware dFdx/dFdy would give this gradient with no fetches at all, but they
 *  are constant across each 2x2 quad, and the specular's exponent of 24 turns
 *  that into visibly blocked highlights — measured, and it cost preset A 27
 *  points of fidelity. The explicit taps stay. */
vec3 surfaceNormal(sampler2D h, int c, vec2 uv, vec2 d, float ss) {
  float ml = chan(texture(h, uv - vec2(d.x, 0.0)), c);
  float mr = chan(texture(h, uv + vec2(d.x, 0.0)), c);
  float tc = chan(texture(h, uv - vec2(0.0, d.y)), c);
  float bc = chan(texture(h, uv + vec2(0.0, d.y)), c);
  return normalize(vec3(-ss * (mr - ml), -ss * (bc - tc), 1.0));
}

/** #normals: signed Sobel gradient packed to RGB, gain from mapConv's divisor. */
vec3 packedNormal(sampler2D h, int c, vec2 uv, vec2 d, float gain) {
  float ml = chan(texture(h, uv - vec2(d.x, 0.0)), c);
  float mr = chan(texture(h, uv + vec2(d.x, 0.0)), c);
  float tc = chan(texture(h, uv - vec2(0.0, d.y)), c);
  float bc = chan(texture(h, uv + vec2(0.0, d.y)), c);
  float gx = (ml - mr) * gain;
  float gy = (tc - bc) * gain;
  return vec3(clamp(0.5*gx + 0.5, 0.0, 1.0), clamp(0.5*gy + 0.5, 0.0, 1.0), 1.0);
}

vec3 applyRemap(vec3 c) {
  return clamp(vec3(dot(uRemap[0].xyz, c) + uRemap[0].w,
                    dot(uRemap[1].xyz, c) + uRemap[1].w,
                    dot(uRemap[2].xyz, c) + uRemap[2].w), 0.0, 1.0);
}

/* .specimen { overflow:hidden; border-radius } */
float roundedBox(vec2 p, vec2 o, vec2 s, float r) {
  vec2 q = abs(p - o - s * 0.5) - s * 0.5 + r;
  float d = min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  return clamp(0.5 - d, 0.0, 1.0);
}

void main() {
  vec2 vp = vec2(gl_FragCoord.x, uViewport.y / uPixel - gl_FragCoord.y) * uPixel;
  vec2 p = vp - uSpecOrigin;
  vec3 col = texture(uBackground, vp / uViewport).rgb;

  float clip = roundedBox(vp, uClip.xy, uClip.zw, uRadius);
  if (clip > 0.0) {
    vec2 uv = p / uIBox;
    vec2 hd = vec2(uPixel) / uIBox;
    vec3 L = vec3(cos(uLight.x) * cos(uLight.y), sin(uLight.x) * cos(uLight.y), sin(uLight.y));
    vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));

    vec4 tone = vec4(0.0);
    for (int i = 0; i < ${f}; i++) {
      if (i >= uICount) break;
      vec2 iv = inkI(i, p);
      float ink = iv.x * iv.y;
      if (ink <= 0.002) continue;
      vec3 N = surfaceNormal(uInkHeight, i, uv, hd, uSurfaceScale);
      vec3 dif = clamp(1.05 * max(dot(N, L), 0.0) * uTint, 0.0, 1.0);
      float sp = 1.2 * pow(max(dot(N, H), 0.0), 24.0);
      vec3 spc = clamp(vec3(sp), 0.0, 1.0);
      // feSpecularLighting sets A = max(R,G,B), and its result is already in
      // premultiplied form, so the colour is not scaled again here.
      float spcA = max(max(spc.r, spc.g), spc.b);
      // feComposite "in" ink on both, then feBlend screen (premultiplied)
      vec4 s = vec4(spc, spcA) * ink;
      vec4 b = vec4(dif, 1.0) * ink;
      tone = over(tone, vec4(s.rgb + b.rgb - s.rgb * b.rgb, s.a + b.a - s.a * b.a));
    }

    for (int i = 0; i < ${f}; i++) {
      if (i >= uNCount) break;
      vec2 nv = inkN(i, p);
      float ink = nv.x * nv.y * uNrmAlpha;
      if (ink <= 0.002) continue;
      vec3 c = uEnc == 1
        ? vec3(chan(texture(uNrmHeight, uv), i))
        : packedNormal(uNrmHeight, i, uv, hd, uConvGain);
      c = applyRemap(c);
      vec3 backdrop = tone.a > 0.0 ? tone.rgb / tone.a : vec3(0.0);
      vec3 cs = mix(c, blendMode(uNrmBlend, backdrop, c), tone.a);
      tone = over(tone, vec4(cs * ink, ink));
    }

    float fx = uEdge.x <= 0.0005 ? 1.0
      : clamp(uv.x / uEdge.x, 0.0, 1.0) * clamp((1.0 - uv.x) / uEdge.x, 0.0, 1.0);
    float fy = uEdge.y <= 0.0005 ? 1.0
      : clamp(uv.y / uEdge.y, 0.0, 1.0) * clamp((1.0 - uv.y) / uEdge.y, 0.0, 1.0);
    tone *= uToneAlpha * fx * fy * clip;

    vec3 ts = tone.a > 0.0 ? tone.rgb / tone.a : vec3(0.0);
    col = mix(col, blendMode(uToneBlend, col, ts), tone.a);

    vec4 sheen = texture(uSheen, vp / uViewport);
    col = mix(col, sheen.rgb, sheen.a * clip);
  }
  outColor = vec4(col, 1.0);
}`;function Te(e,t,n){let r=e.createShader(t);if(e.shaderSource(r,n),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS))throw Error(e.getShaderInfoLog(r)??`shader compile failed`);return r}function Ee(e,t){let n=e.createProgram();if(e.attachShader(n,Te(e,e.VERTEX_SHADER,C)),e.attachShader(n,Te(e,e.FRAGMENT_SHADER,t)),e.linkProgram(n),!e.getProgramParameter(n,e.LINK_STATUS))throw Error(e.getProgramInfoLog(n)??`program link failed`);return n}function T(e,t){let n=e.createTexture();return e.bindTexture(e.TEXTURE_2D,n),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,t?e.REPEAT:e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,t?e.REPEAT:e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),n}function De(e,t,n){e.bindTexture(e.TEXTURE_2D,t),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.NONE),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,n)}function E(e,t){let n=document.createElement(`canvas`);return n.width=Math.max(1,Math.round(e)),n.height=Math.max(1,Math.round(t)),n}function Oe(e,t){let n=Math.floor(e*ce+.5);if(n<1)return t===3?[1,1,1]:[1,1];let r=n%2==1?[n,n,n]:[n,n,n+1];return t===3?r:[Math.round(n*1.22),Math.round(n*1.22)]}function D(e,ce,m={}){let le=m.fit??`cover`,fe=m.blurBoxes===2?2:3,_=document.createElement(`canvas`),v=_.getContext(`webgl2`,{alpha:!1,antialias:!1,depth:!1,stencil:!1,powerPreference:`high-performance`});if(!v)return null;let _e,y,b;try{_e=Ee(v,Se),y=Ee(v,Ce),b=Ee(v,we)}catch(e){return typeof console<`u`&&console.error(`[modulus] shader build failed`,e),null}let x=ce.S,S=ce.N,C=de(x),w=de(S),xe=m.layers===`nrm`?[]:pe(C).slice(0,f),Te=m.layers===`ink`?[]:pe(w).slice(0,f),D=g(x,`glass`,`main`),ke=g(x,`tint`,`#c6a8ff`),Ae=g(S,`enc`,`tangent`),je=g(S,`remap`,`gl`),Me=ce.L??{},[O,Ne]=l[ue(x,`latch`,!1)||ue(Me,`bevel`,!0)?c[Math.max(0,s.indexOf(D))]:g(S,`bevel`,`dome`)]??l.dome,k=document.createElement(`div`);k.className=`visualizer-stage visualizer-stage--gl`,k.dataset.renderer=`webgl-bench`,k.dataset.running=`true`,k.append(_),e.replaceChildren(k);let A=Math.max(1,window.innerWidth),j=Math.max(1,window.innerHeight),M=1,N=1,P=1,F=ae,I=oe,L=0,R=0,z=0,B=0,V=ae,H=oe,U=!0,Pe=()=>{if(M=Math.min(window.devicePixelRatio||1,2)*Math.max(.25,Math.min(2,m.scale??1)),le===`contain`){let e=Math.min((A-28)/ae,(j-28)/oe);N=Math.max(.4,Math.round(e*100)/100)}else N=Math.max(A/ae,j/oe);let e=ae*N,t=oe*N;(Math.abs(e-F)>.01||Math.abs(t-I)>.01)&&(U=!0),F=e,I=t,L=(A-F)/2,R=(j-I)/2,P=m.heightDiv===4?4:2;let n=i[D],r=n===`left`?3:1,a=n===`top`?3:1;z=L+r,B=R+a,V=F-r-1,H=I-a-1};Pe();let Fe=T(v,!1),W=T(v,!1),Ie=T(v,!0),G=T(v,!0),K=T(v,!1),Le=T(v,!1),q=T(v,!0),J=T(v,!0),Re=()=>({tex:T(v,!1),fbo:v.createFramebuffer(),w:0,h:0}),ze=Re(),Be=Re(),Ve=Re(),He=Re(),Ue=(e,t,n)=>{(e.w!==t||e.h!==n)&&(e.w=t,e.h=n,v.bindTexture(v.TEXTURE_2D,e.tex),v.texImage2D(v.TEXTURE_2D,0,v.RGBA8,t,n,0,v.RGBA,v.UNSIGNED_BYTE,null),v.bindFramebuffer(v.FRAMEBUFFER,e.fbo),v.framebufferTexture2D(v.FRAMEBUFFER,v.COLOR_ATTACHMENT0,v.TEXTURE_2D,e.tex,0),v.bindFramebuffer(v.FRAMEBUFFER,null))},We=()=>{},Ge=new Promise(e=>{We=e}),Ke=(e,t)=>{let n=E(p*4,p),r=n.getContext(`2d`),i=E(p,p).getContext(`2d`),a=(e,t)=>(i.setTransform(1,0,0,1,0,0),i.clearRect(0,0,p,p),i.scale(p/V,p/H),e(i,V,H,t),i.setTransform(1,0,0,1,0,0),i.getImageData(0,0,p,p));e.forEach((e,t)=>{let n=a(ye,e),i=a(be,e),o=r.createImageData(p,p);for(let e=0;e<o.data.length;e+=4)o.data[e]=n.data[e],o.data[e+1]=n.data[e+3],o.data[e+2]=i.data[e+3],o.data[e+3]=255;r.putImageData(o,t*p,0)}),De(v,t,n)},qe=async()=>{let e=C.cell*N,s=C.run*e,c=w.cell*N,l=w.run*c,u=await ge(me(s,C.cell,C.jit)),ee=await ge(me(Math.max(8,Math.round(l)),c,w.jit)),d=(e,t,n)=>{let r=Math.min(ie,Math.max(8,Math.round(t*M))),i=E(r,r);i.getContext(`2d`).drawImage(e,0,0,r,r),De(v,n,i)};d(u,s,Ie),d(ee,l,G);let te=(e,t)=>{let n=Math.max(2,Math.round(e*M)),r=E(n,n),i=r.getContext(`2d`),a=i.createRadialGradient(n/2,n/2,0,n/2,n/2,n*.70710678);a.addColorStop(0,`#000`),a.addColorStop(1,`#fff`),i.fillStyle=a,i.fillRect(0,0,n,n),De(v,t,r)};te(e,q),te(c,J),Ke(xe,K),Ke(Te,Le);{let e=Math.max(1,Math.round(A*M)),s=Math.max(1,Math.round(j*M)),c=E(e,s),l=c.getContext(`2d`);l.scale(e/A,s/j),l.fillStyle=a,l.fillRect(0,0,A,j);let u=(r[D]??12)*N,ee=()=>{l.beginPath();let e=Math.min(u,F/2,I/2);l.moveTo(L+e,R),l.arcTo(L+F,R,L+F,R+I,e),l.arcTo(L+F,R+I,L,R+I,e),l.arcTo(L,R+I,L,R,e),l.arcTo(L,R,L+F,R,e),l.closePath()},d=E(e,s);d.getContext(`2d`).drawImage(c,0,0),l.save(),ee(),l.clip(),l.filter=`blur(${o[D]??24}px) saturate(1.8)`,l.drawImage(d,0,0,A,j),l.filter=`none`,l.fillStyle=t[D]??t.main,l.fillRect(L,R,F,I);let te=await ge(he);for(let e=R;e<R+I;e+=200)for(let t=L;t<L+F;t+=200)l.drawImage(te,t,e,200,200);l.restore(),l.save(),l.lineWidth=1,ee(),l.strokeStyle=n[D]??n.main,l.stroke();let f=i[D];f&&(l.fillStyle=`rgba(198,168,255,.45)`,f===`left`?l.fillRect(L,R,3,I):l.fillRect(L,R,F,3)),l.restore(),De(v,Fe,c)}{let e=Math.max(1,Math.round(A*M)),t=Math.max(1,Math.round(j*M)),n=E(e,t),r=n.getContext(`2d`);r.scale(e/A,t/j),r.translate(z,B),ve(r,V,H,135,[[0,`rgba(198,168,255,.06)`],[50,`rgba(198,168,255,0)`],[100,`rgba(198,168,255,.02)`]]),De(v,W,n)}U=!1},Y=(e,t)=>v.getUniformLocation(e,t),Je=(e,t,n)=>{let r=t.cell*N,i=t.run*r,a=[],o=[],s=[],c=[],l=[],u=0,d=0;for(let t of e)u=Math.max(u,Math.abs(t.vector[0])),d=Math.max(d,Math.abs(t.vector[1]));let te=e.length?Math.hypot(e[0].vector[0],e[0].vector[1])*i/Math.max(1,t.speed):1,ne=260/Math.max(1,t.speed);for(let re=0;re<f;re+=1){let f=e[re]??e[0];if(!f){a.push(0),o.push(0,0),s.push(0,0),c.push(0,0),l.push(1);continue}a.push(n?ee[f.anim]:ee[f.anim===`flow`?`flow`:`burst`]),n?o.push((u*t.run+1)*r,(d*t.run+1)*r):o.push((Math.abs(f.vector[0])*t.run+1)*r,(Math.abs(f.vector[1])*t.run+1)*r),s.push(f.vector[0]*i,f.vector[1]*i),c.push(f.origin[0]*V,f.origin[1]*H);let p=f.anim===`flow`?n?te:Math.max(.05,Math.hypot(f.vector[0],f.vector[1])*i/Math.max(1,t.speed)):ne;l.push(se(Math.max(.05,p)))}return{chambers:e,cell:r,tile:i,hard:t.hard,rampOn:+!!n,anim:a,over:o,flow:s,origin:c,dur:l}},Ye=Je(xe,C,!0),Xe=Je(Te,w,!1),Ze=(e,t,n,r,i,a,o)=>{v.uniform2f(Y(e,`u${t}Box`),V,H),v.uniform1i(Y(e,`u${t}Count`),n.chambers.length),v.uniform1iv(Y(e,`u${t}Anim`),n.anim),v.uniform1f(Y(e,`u${t}CellPx`),n.cell),v.uniform1f(Y(e,`u${t}TilePx`),n.tile),v.uniform2fv(Y(e,`u${t}OverPx`),n.over),v.uniform2fv(Y(e,`u${t}FlowPx`),n.flow),v.uniform2fv(Y(e,`u${t}OriginPx`),n.origin),v.uniform1fv(Y(e,`u${t}Dur`),n.dur),v.uniform1f(Y(e,`u${t}Hard`),n.hard),v.uniform1f(Y(e,`u${t}RampOn`),n.rampOn),v.uniform1f(Y(e,`u${t}Time`),r),v.uniform1i(Y(e,`u${t}Noise`),i),v.uniform1i(Y(e,`u${t}Atlas`),a),v.uniform1i(Y(e,`u${t}Cone`),o)},X=(e,t)=>{v.activeTexture(v.TEXTURE0+e),v.bindTexture(v.TEXTURE_2D,t)},Qe=(e,t,n)=>{v.useProgram(y),v.uniform1i(Y(y,`uSrc`),0);let r=e,i=t;for(let e of Oe(n,fe))for(let t of[[1,0],[0,1]]){v.bindFramebuffer(v.FRAMEBUFFER,i.fbo),v.viewport(0,0,i.w,i.h),X(0,r.tex),v.uniform2f(Y(y,`uAxis`),t[0],t[1]),v.uniform1f(Y(y,`uHalf`),e/2),v.uniform1i(Y(y,`uTaps`),Math.max(0,Math.floor(e/2-.5))),v.drawArrays(v.TRIANGLES,0,3);let n=r;r=i,i=n}return r},$e=(e,t,n,r,i,a)=>{v.useProgram(_e),v.bindFramebuffer(v.FRAMEBUFFER,e.fbo),v.viewport(0,0,e.w,e.h),X(0,r),X(1,i),X(2,a),Ze(_e,`L`,t,n,0,1,2),v.uniform1f(Y(_e,`uPixel`),P/M),v.uniform1i(Y(_e,`uSS`),re),v.drawArrays(v.TRIANGLES,0,3)},et=()=>{_.width=Math.max(2,Math.round(A*M)),_.height=Math.max(2,Math.round(j*M)),_.style.width=`${A}px`,_.style.height=`${j}px`;let e=Math.max(2,Math.ceil(V*M/P)),t=Math.max(2,Math.ceil(H*M/P));for(let n of[ze,Be,Ve,He])Ue(n,e,t)};et();let tt=v.getExtension(`EXT_disjoint_timer_query_webgl2`),Z=[],nt=0,rt=null,it=()=>{if(!tt||Z.length>6)return;let e=v.createQuery();e&&(v.beginQuery(tt.TIME_ELAPSED_EXT,e),rt=e)},at=()=>{!tt||!rt||(v.endQuery(tt.TIME_ELAPSED_EXT),Z.push(rt),rt=null)},ot=()=>{if(tt){if(v.getParameter(tt.GPU_DISJOINT_EXT)){for(let e of Z)v.deleteQuery(e);Z=[];return}for(;Z.length;){let e=Z[0];if(!v.getQueryParameter(e,v.QUERY_RESULT_AVAILABLE))break;let t=Number(v.getQueryParameter(e,v.QUERY_RESULT))/1e6;v.deleteQuery(e),Z.shift(),nt=nt?nt*.85+t*.15:t}}},st=e=>{ot(),it();let t=Ye.cell,n=t/5*M/P,i=t/5*O*(h(S,`rad`,100)/100)*M/P;$e(ze,Ye,e,Ie,K,q);let a=Qe(ze,Be,n);$e(Ve,Xe,e,G,Le,J);let o=Qe(Ve,He,i);v.bindFramebuffer(v.FRAMEBUFFER,null),v.viewport(0,0,_.width,_.height),v.useProgram(b),X(0,Fe),X(1,W),X(2,a.tex),X(3,o.tex),X(4,Ie),X(5,K),X(6,G),X(7,Le),X(8,q),X(9,J),v.uniform1i(Y(b,`uBackground`),0),v.uniform1i(Y(b,`uSheen`),1),v.uniform1i(Y(b,`uInkHeight`),2),v.uniform1i(Y(b,`uNrmHeight`),3),Ze(b,`I`,Ye,e,4,5,8),Ze(b,`N`,Xe,e,6,7,9),v.uniform2f(Y(b,`uViewport`),A,j),v.uniform1f(Y(b,`uPixel`),1/M),v.uniform2f(Y(b,`uSpecOrigin`),z,B),v.uniform3fv(Y(b,`uTint`),(e=>{let t=/^#([0-9a-f]{6})$/i.exec(e),n=t?parseInt(t[1],16):13019391;return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]})(ke)),v.uniform2f(Y(b,`uLight`),h(x,`azi`,135)*Math.PI/180,h(x,`ele`,52)*Math.PI/180),v.uniform1f(Y(b,`uSurfaceScale`),h(x,`relh`,5)*N),v.uniform1f(Y(b,`uConvGain`),Ne*(h(S,`amp`,100)/100)),v.uniform1i(Y(b,`uEnc`),te[Ae]??0);let s=u[je]??u.gl;v.uniformMatrix4fv(Y(b,`uRemap`),!1,new Float32Array([s[0],s[1],s[2],s[3],s[4],s[5],s[6],s[7],s[8],s[9],s[10],s[11],0,0,0,1])),v.uniform1f(Y(b,`uToneAlpha`),h(x,`alpha`,100)/100),v.uniform1i(Y(b,`uToneBlend`),d[g(x,`blend`,`normal`)]??0),v.uniform1i(Y(b,`uNrmBlend`),d[g(S,`blend`,`normal`)]??0),v.uniform1f(Y(b,`uNrmAlpha`),h(S,`mix`,100)/100),v.uniform2f(Y(b,`uEdge`),h(x,`ex`,0)/100,h(x,`ey`,0)/100),v.uniform4f(Y(b,`uClip`),z,B,V,H),v.uniform1f(Y(b,`uRadius`),Math.max(0,(r[D]??12)*N-1)),v.drawArrays(v.TRIANGLES,0,3),at()},ct=!1;qe().then(()=>{ct=!0,We()});let Q=0,$=!0,lt=performance.now(),ut=0,dt=e=>{Q=0,ct&&(U?(ct=!1,qe().then(()=>{ct=!0})):st((e-lt)/1e3%ne)),$&&(Q=requestAnimationFrame(dt))};return Q=requestAnimationFrame(dt),{start(){$||($=!0,lt=performance.now()-ut,k.dataset.running=`true`,Q||=requestAnimationFrame(dt))},pause(){$=!1,ut=performance.now()-lt,k.dataset.running=`false`,Q&&=(cancelAnimationFrame(Q),0)},freeze(){$=!1,ut=performance.now()-lt,k.dataset.running=`frozen`,Q&&=(cancelAnimationFrame(Q),0)},resize(e,t){A=Math.max(1,e),j=Math.max(1,t),Pe(),Ye=Je(xe,C,!0),Xe=Je(Te,w,!1),et()},destroy(){$=!1,Q&&cancelAnimationFrame(Q),v.getExtension(`WEBGL_lose_context`)?.loseContext(),k.remove()},step(e){$=!1,Q&&=(cancelAnimationFrame(Q),0),st(e/1e3%ne)},ready:Ge,gpuMs:()=>nt}}var ke={A:{v:1,S:{showCursor:!0,preset:`t2`,glass:`input`,zoom:1,w:520,h:340,latch:!1,disp:`relief`,tint:`#6200ff`,blend:`normal`,emit:`mirror`,reach:100,inksurf:`input`,panel:!0,ncursor:!1,curs:100,ncurs:100,bead:22,gb:19,gsat:190,gbri:128,rim:34,spk:100,content:!1,vanish:85,vwidth:57,vstrength:63,nrm:!0,nblend:`normal`,nmix:100,azi:37,ele:46,relh:3,cell:13,hard:48,dense:81,sparse:69,speed:180,run:48,jit:71,dir:0,flip:!0,running:!0,mirror:!1,ex:0,ey:0,alpha:100,ox:50,oy:51},N:{preset:`t2`,cell:6,hard:40,dense:64,sparse:20,reach:100,speed:180,run:48,jit:71,dir:0,flip:!1,emit:`mirror`,vanish:85,vwidth:57,vstrength:63,ox:50,oy:51,px:50,py:50,bevel:`flat`,enc:`height`,remap:`swap`,detail:`sharp`,view:`over`,amp:10,rad:55,ex:0,ey:28,mix:100,blend:`overlay`},L:{preset:!1,cell:!1,hard:!1,dense:!1,sparse:!1,reach:!1,speed:!1,run:!1,jit:!1,dir:!1,flip:!1,emit:!1,vanish:!1,vwidth:!1,vstrength:!1,ox:!0,oy:!0,bevel:!1,ex:!1,ey:!1}},B:{v:1,S:{showCursor:!0,preset:`t2`,glass:`input`,zoom:1.6,w:520,h:340,latch:!1,disp:`relief`,tint:`#6200ff`,blend:`normal`,emit:`mirror`,reach:100,inksurf:`input`,panel:!0,ncursor:!1,curs:100,ncurs:100,bead:22,gb:19,gsat:190,gbri:128,rim:34,spk:100,content:!1,vanish:85,vwidth:55,vstrength:95.5,nrm:!0,nblend:`normal`,nmix:100,azi:37,ele:46,relh:2,cell:3,hard:48,dense:81,sparse:69,speed:180,run:48,jit:71,dir:0,flip:!0,running:!0,mirror:!1,ex:0,ey:0,alpha:100,ox:50,oy:51},N:{preset:`t2`,cell:3,hard:60,dense:100,sparse:100,reach:100,speed:180,run:48,jit:71,dir:0,flip:!1,emit:`mirror`,vanish:62.5,vwidth:37,vstrength:45,ox:50,oy:51,px:50,py:50,bevel:`flat`,enc:`height`,remap:`gl`,detail:`sharp`,view:`over`,amp:10,rad:55,ex:0,ey:28,mix:100,blend:`overlay`},L:{preset:!1,cell:!1,hard:!1,dense:!1,sparse:!1,reach:!1,speed:!1,run:!1,jit:!1,dir:!1,flip:!1,emit:!1,vanish:!1,vwidth:!1,vstrength:!1,ox:!0,oy:!0,bevel:!1,ex:!1,ey:!1}},C:{v:1,S:{showCursor:!0,preset:`t8`,glass:`input`,zoom:2.4,w:520,h:340,latch:!1,disp:`relief`,tint:`#6200ff`,blend:`screen`,emit:`single`,reach:100,inksurf:`input`,panel:!0,ncursor:!1,curs:100,ncurs:100,bead:36,gb:6,gsat:295,gbri:160,rim:54,spk:24,content:!1,vanish:100,vwidth:98,vstrength:100,nrm:!0,nblend:`normal`,nmix:33,azi:0,ele:63,relh:2,cell:3,hard:33,dense:47,sparse:100,speed:127,run:15,jit:100,dir:100,flip:!0,running:!0,mirror:!1,ex:25,ey:11,alpha:98,ox:50,oy:50},N:{preset:`t3`,cell:5,hard:60,dense:61,sparse:100,reach:100,speed:144,run:22,jit:99,dir:181,flip:!1,emit:`edges`,vanish:93,vwidth:50,vstrength:92,ox:50,oy:51,px:50,py:50,bevel:`dome`,enc:`tangent`,remap:`swap`,detail:`fine`,view:`over`,amp:210,rad:165,ex:45,ey:28,mix:100,blend:`soft-light`},L:{preset:!1,cell:!1,hard:!1,dense:!1,sparse:!1,reach:!1,speed:!1,run:!1,jit:!1,dir:!1,flip:!1,emit:!1,vanish:!1,vwidth:!1,vstrength:!1,ox:!0,oy:!0,bevel:!1,ex:!1,ey:!1}},D:{v:1,S:{showCursor:!0,preset:`t8`,glass:`input`,zoom:2.4,w:520,h:340,latch:!1,disp:`relief`,tint:`#6200ff`,blend:`screen`,emit:`mirror`,reach:100,inksurf:`input`,panel:!0,ncursor:!1,curs:100,ncurs:100,bead:36,gb:6,gsat:295,gbri:160,rim:54,spk:24,content:!1,vanish:100,vwidth:98,vstrength:100,nrm:!0,nblend:`normal`,nmix:61,azi:0,ele:63,relh:2,cell:3,hard:33,dense:47,sparse:100,speed:127,run:15,jit:100,dir:100,flip:!0,running:!0,mirror:!1,ex:25,ey:11,alpha:98,ox:50,oy:50},N:{preset:`t3`,cell:5,hard:60,dense:61,sparse:100,reach:89,speed:144,run:22,jit:99,dir:181,flip:!1,emit:`edges`,vanish:36,vwidth:45.5,vstrength:100,ox:50,oy:51,px:50,py:50,bevel:`dome`,enc:`tangent`,remap:`dx`,detail:`blur`,view:`over`,amp:210,rad:340,ex:45,ey:28,mix:100,blend:`overlay`},L:{preset:!1,cell:!1,hard:!1,dense:!1,sparse:!1,reach:!1,speed:!1,run:!1,jit:!1,dir:!1,flip:!1,emit:!1,vanish:!1,vwidth:!1,vstrength:!1,ox:!0,oy:!0,bevel:!1,ex:!1,ey:!1}},E:{v:1,S:{showCursor:!0,preset:`t6`,glass:`chrome`,zoom:2.4,w:520,h:340,latch:!1,disp:`relief`,tint:`#7fe3d4`,blend:`screen`,emit:`mirror`,reach:59,inksurf:`overlay`,panel:!0,ncursor:!1,curs:100,ncurs:100,bead:36,gb:13,gsat:400,gbri:164,rim:100,spk:100,content:!1,vanish:89.5,vwidth:88,vstrength:19,nrm:!0,nblend:`normal`,nmix:61,azi:359,ele:43,relh:6,cell:12,hard:60,dense:48,sparse:86,speed:180,run:48,jit:100,dir:169,flip:!1,running:!0,mirror:!1,ex:18,ey:28,alpha:100,ox:50,oy:50},N:{preset:`t3`,cell:4,hard:60,dense:100,sparse:81,reach:58,speed:180,run:48,jit:99,dir:359,flip:!0,emit:`edges`,vanish:65.5,vwidth:83,vstrength:100,ox:50,oy:51,px:50,py:50,bevel:`cone`,enc:`tangent`,remap:`dx`,detail:`sharp`,view:`over`,amp:400,rad:115,ex:45,ey:28,mix:100,blend:`overlay`},L:{preset:!1,cell:!1,hard:!1,dense:!1,sparse:!1,reach:!1,speed:!1,run:!1,jit:!1,dir:!1,flip:!1,emit:!1,vanish:!1,vwidth:!1,vstrength:!1,ox:!0,oy:!0,bevel:!1,ex:!1,ey:!1}}},Ae=`modulus-link.presets.v1`,je=.5,Me=6,O=e=>document.getElementById(e),Ne=O(`stage`),k=O(`tiles`);function A(e,t){let n=e=>!!e&&typeof e==`object`&&typeof e.S==`object`&&e.S!==null&&typeof e.N==`object`&&e.N!==null;if(n(e)){let n=e.name;return[{name:typeof n==`string`&&n?n:t,preset:e,imported:!0}]}return Array.isArray(e)?e.flatMap((e,n)=>A(e,`${t}·${n+1}`)):e&&typeof e==`object`?Object.entries(e).flatMap(([e,t])=>n(t)?[{name:e,preset:t,imported:!0}]:[]):[]}var j=Object.keys(ke).map(e=>({name:String(e),preset:ke[e],imported:!1})),M=()=>{try{let e=JSON.parse(localStorage.getItem(Ae)??`[]`);return Array.isArray(e)?e.flatMap(e=>A(e?.preset,String(e?.name??`imported`)).map(t=>({...t,name:String(e?.name??t.name)}))):[]}catch{return[]}},N=[...j,...M()],P=0,F=`grid`,I=null,L=[],R=[],z=1,B=80,V=!1,H=2,U=3,Pe=()=>{let e=N.filter(e=>e.imported).map(e=>({name:e.name,preset:e.preset}));try{localStorage.setItem(Ae,JSON.stringify(e))}catch{}},Fe={heightDiv:5,blurBoxes:2};function W(){if(I?.destroy(),I=null,F===`single`){if(I=D(Ne,N[P].preset,{fit:`cover`,scale:z,heightDiv:H,blurBoxes:U}),!I){Ne.innerHTML=`<p style="color:#ff7a7a;font:13px monospace;padding:24px">WebGL2 unavailable</p>`;return}I.resize(window.innerWidth,window.innerHeight),O(`presetName`).textContent=N[P].name,O(`res`).textContent=`${Math.round(window.innerWidth*z)}×${Math.round(window.innerHeight*z)}`}}function Ie(){for(let e of R)e.disconnect();for(let e of L)e.destroy();R=[],L=[],k.replaceChildren()}function G(){if(Ie(),F!==`grid`)return;let e=N.slice(0,Me);if(e.forEach((e,t)=>{let n=document.createElement(`div`);n.className=`tile`;let r=document.createElement(`div`);r.className=`tile__host`;let i=document.createElement(`div`);i.className=`tile__tag`,i.innerHTML=`<b></b><span></span>`,i.querySelector(`b`).textContent=e.name,n.append(r,i),n.addEventListener(`click`,()=>Le(t)),k.append(n);let a=D(r,e.preset,{fit:`cover`,scale:je,heightDiv:4,blurBoxes:2});if(!a){i.querySelector(`span`).textContent=`no webgl2`;return}L.push(a),i.querySelector(`span`).textContent=e.imported?`imported`:`built-in`;let o=new ResizeObserver(()=>{let e=r.clientWidth,t=r.clientHeight;e>0&&t>0&&a.resize(e,t)});o.observe(r),R.push(o)}),e.length<Me){let e=document.createElement(`div`);e.className=`tile tile--drop`,e.innerHTML=`Drop a <b>Modulus JSON</b> export<br />to add a preset`,e.addEventListener(`click`,()=>O(`file`).click()),k.append(e)}}function K(e){e!==F&&(F=e,document.body.dataset.view=F,F===`grid`?(I?.destroy(),I=null,G()):(Ie(),W()))}function Le(e){P=e,q(),K(`single`)}function q(){let e=O(`presets`);e.replaceChildren();let t=document.createElement(`button`);t.className=`chip back`,t.textContent=`▦`,t.title=`Back to panels (G)`,t.setAttribute(`aria-label`,`Back to panels`),t.addEventListener(`click`,()=>K(`grid`)),e.append(t),N.forEach((t,n)=>{let r=document.createElement(`button`);if(r.className=`chip`,r.setAttribute(`aria-pressed`,String(n===P)),r.textContent=t.name,r.addEventListener(`click`,()=>{P=n,q(),W()}),t.imported){let e=document.createElement(`span`);e.className=`x`,e.textContent=`×`,e.title=`remove`,e.addEventListener(`click`,e=>{e.stopPropagation(),N.splice(n,1),P>=N.length&&(P=N.length-1),Pe(),q(),W()}),r.append(e)}e.append(r)})}function J(){let e=O(`detail`);e.setAttribute(`aria-pressed`,String(H===2)),e.textContent=H===2?`Lighting detail: high`:`Lighting detail: fast`;let t=O(`boxes`);t.setAttribute(`aria-pressed`,String(U===3)),t.textContent=U===3?`Blur: 3 box (SVG)`:`Blur: 2 box`;let n=[];H===4&&n.push(`lighting detail ~${Fe.heightDiv} pts`),U===2&&n.push(`blur ~${Fe.blurBoxes} pts`),z<1&&n.push(`render ${Math.round(z*100)}%`);let r=O(`fidelity`);r.textContent=n.length?`traded`:`baseline`,r.className=n.length?`traded`:``,O(`cost`).textContent=n.length?`Trading: ${n.join(`, `)}. Reset to return to baseline.`:`All settings at baseline, nothing traded.`}O(`boxes`).addEventListener(`click`,()=>{U=U===3?2:3,J(),W()}),O(`detail`).addEventListener(`click`,()=>{H=H===2?4:2,J(),W()});var Re=e=>{let t=O(`err`);t.textContent=e,t.hidden=!e};async function ze(e){let t=[],n=[];for(let r of Array.from(e))try{let e=A(JSON.parse(await r.text()),r.name.replace(/\.json$/i,``));e.length||n.push(`${r.name}: no S/N preset found`),t.push(...e)}catch(e){n.push(`${r.name}: ${e.message}`)}if(t.length){for(let e of t){let t=N.findIndex(t=>t.name===e.name&&t.imported);t>=0?N[t]=e:N.push(e)}P=N.indexOf(t[t.length-1]),Pe(),q(),F===`grid`?G():W()}Re(n.join(` · `))}var Be=O(`drop`);Be.addEventListener(`click`,()=>O(`file`).click()),O(`file`).addEventListener(`change`,e=>{let t=e.target;t.files&&ze(t.files),t.value=``});for(let e of[`dragenter`,`dragover`])document.addEventListener(e,e=>{e.preventDefault(),Be.classList.add(`over`),document.querySelector(`.tile--drop`)?.classList.add(`over`)});for(let e of[`dragleave`,`drop`])document.addEventListener(e,()=>{Be.classList.remove(`over`),document.querySelector(`.tile--drop`)?.classList.remove(`over`)});document.addEventListener(`drop`,e=>{e.preventDefault(),e.dataTransfer?.files.length&&ze(e.dataTransfer.files)});var Ve=O(`scale`);Ve.addEventListener(`input`,()=>{z=Number(Ve.value),O(`scaleOut`).textContent=`${Math.round(z*100)}%`,J(),W()});var He=O(`target`);He.addEventListener(`input`,()=>{B=Number(He.value),O(`targetOut`).textContent=String(B)}),O(`auto`).addEventListener(`click`,e=>{V=!V,e.currentTarget.setAttribute(`aria-pressed`,String(V))}),addEventListener(`keydown`,e=>{(e.key===`g`||e.key===`G`)&&K(F===`grid`?`single`:`grid`),e.key===`Escape`&&F===`single`&&K(`grid`),(e.key===`h`||e.key===`H`)&&document.body.classList.toggle(`hidechrome`),(e.key===`f`||e.key===`F`)&&(document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen().catch(()=>{}))});var Ue=0;addEventListener(`resize`,()=>{window.clearTimeout(Ue),Ue=window.setTimeout(()=>{F===`single`?(I?.resize(window.innerWidth,window.innerHeight),O(`res`).textContent=`${Math.round(window.innerWidth*z)}×${Math.round(window.innerHeight*z)}`):G()},160)});var We=[],Ge=performance.now(),Ke=Ge,qe=0,Y=e=>{let t=e-Ge;if(Ge=e,t>0&&t<500&&We.push(t),e-Ke>=500&&We.length>8){let t=[...We].sort((e,t)=>e-t),n=e=>t[Math.min(t.length-1,Math.floor(t.length*e))],r=n(.5),i=n(.95),a=1e3/r,o=I?.gpuMs()??0,s=o>0?1e3/o:a,c=O(`fps`);if(c.textContent=s.toFixed(0),c.className=`fps ${s>=B?`ok`:s>=B*.7?`mid`:`low`}`,O(`gpu`).textContent=o>0?`${o.toFixed(2)}ms`:`n/a`,O(`ceil`).textContent=o>0?`${s.toFixed(0)}fps`:`n/a`,O(`verdict`).textContent=o>0?s>=B?`meets target`:`under target`:``,O(`p50`).textContent=`${r.toFixed(1)}ms`,O(`p95`).textContent=`${i.toFixed(1)}ms`,O(`fpsbar`).style.width=`${Math.min(100,s/B*100).toFixed(0)}%`,V&&F===`single`&&e>qe&&o>0){let t=1e3/B,n=!1;o>t*1.06?H===2?(H=4,n=!0):z>.5&&(z=Math.max(.5,z-.05),n=!0):o<t*.82&&(z<1?(z=Math.min(1,z+.05),n=!0):H===4&&(H=2,n=!0)),n&&(Ve.value=String(z),O(`scaleOut`).textContent=`${Math.round(z*100)}%`,J(),W(),qe=e+900)}We.length=0,Ke=e}requestAnimationFrame(Y)};requestAnimationFrame(Y),document.body.dataset.view=F,J(),q(),G();