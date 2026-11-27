import{f as e,g as t}from"./index-BQUYGVIo.js";import{t as n}from"./scrymapDisplay-bLTlM6pE.js";var r={};r.VS=`#version 300 es
out vec2 uv;
void main(){uv=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(uv*2.0-1.0,0.0,1.0);}`,r.MAXN=48,r.NO_COLOR=new Float32Array(192),r.GLSL=`
uniform vec4 uNodeA[48]; // x, y, vx, vy   (grid cells, cells/s)
uniform vec4 uNodeB[48]; // prevX, prevY, radius, speedNorm
uniform int uNodeCount;
uniform vec3 uPal[6];
uniform vec2 grid;
vec3 ramp(float t){
  t = clamp(t, 0.0, 1.0) * 5.0;
  int i = int(min(floor(t), 4.0));
  return mix(uPal[i], uPal[i + 1], smoothstep(0.0, 1.0, t - float(i)));
}
float segDist(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
ivec2 clampCell(ivec2 c){ return clamp(c, ivec2(0), ivec2(grid) - 1); }
ivec2 wrapCell(ivec2 c){ ivec2 g = ivec2(grid); return ((c % g) + g) % g; }
`,r.FS=(e,t)=>`#version 300 es
precision highp float;
precision highp int;
in vec2 uv;
${t?Array.from({length:t===!0?2:t},(e,t)=>`layout(location=${t}) out vec4 o${t};`).join(`
`):`out vec4 o;`}
${r.GLSL}
${e}`,r.PALETTES=e,r.KIND_COLORS={article:`#e5ac83`,image:`#9ec8ac`,video:`#a9a0df`,note:`#cba0ce`,link:`#79b9c6`,pdf:`#d69391`,attachment:`#9cadd1`},r.rgb=e=>{if(Array.isArray(e))return e;if(typeof e!=`string`)return null;let t=e.trim().replace(`#`,``);if(t.length===3&&(t=t.replace(/./g,e=>e+e)),!/^[0-9a-f]{6}$/i.test(t))return null;let n=parseInt(t,16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]},r.palette=e=>{let t=(r.PALETTES[e]||r.PALETTES.wired).stops,n=new Float32Array(18);return t.forEach((e,t)=>{let r=parseInt(e.slice(1),16);n[t*3]=(r>>16&255)/255,n[t*3+1]=(r>>8&255)/255,n[t*3+2]=(r&255)/255}),n},r.createGL=function(e,t){let n=e.getContext(`webgl2`,{alpha:!!(t&&t.alpha),antialias:!1,depth:!1,stencil:!1,powerPreference:`high-performance`,preserveDrawingBuffer:!1});if(!n)throw Error(`WebGL2 is not available in this browser.`);let i=n.getExtension(`EXT_color_buffer_float`),a=n.getExtension(`EXT_color_buffer_half_float`);if(!i&&!a)throw Error(`This GPU cannot render to float textures.`);let o=n.getExtension(`OES_texture_float_linear`);n.bindVertexArray(n.createVertexArray()),n.disable(n.DEPTH_TEST),n.disable(n.BLEND),n.disable(n.DITHER);let s={gl:n,canReadFloat:!!i,floatLinear:!!(i&&o)};return s.program=(e,t=r.VS)=>{let i=(e,t)=>{let r=n.createShader(e);if(n.shaderSource(r,t),n.compileShader(r),!n.getShaderParameter(r,n.COMPILE_STATUS))throw Error(n.getShaderInfoLog(r)+`
`+t.split(`
`).map((e,t)=>t+1+`: `+e).join(`
`));return r},a=n.createProgram();if(n.attachShader(a,i(n.VERTEX_SHADER,t)),n.attachShader(a,i(n.FRAGMENT_SHADER,e)),n.linkProgram(a),!n.getProgramParameter(a,n.LINK_STATUS))throw Error(n.getProgramInfoLog(a));let o=new Map;return{p:a,loc:e=>(o.has(e)||o.set(e,n.getUniformLocation(a,e)),o.get(e))}},s.tex=(e,t,r={})=>{let a=n.createTexture();n.bindTexture(n.TEXTURE_2D,a);let o=r.nearest?n.NEAREST:n.LINEAR,s=r.repeat?n.REPEAT:n.CLAMP_TO_EDGE;return n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,o),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MAG_FILTER,o),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,s),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,s),i&&r.f32?n.texImage2D(n.TEXTURE_2D,0,n.RGBA32F,e,t,0,n.RGBA,n.FLOAT,null):n.texImage2D(n.TEXTURE_2D,0,n.RGBA16F,e,t,0,n.RGBA,n.HALF_FLOAT,null),a},s.target=(e,t,r={},i=1)=>{let a=n.createFramebuffer();n.bindFramebuffer(n.FRAMEBUFFER,a);let o=[];for(let a=0;a<i;a++){let i=s.tex(e,t,r);n.framebufferTexture2D(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+a,n.TEXTURE_2D,i,0),o.push(i)}return i>1&&n.drawBuffers(o.map((e,t)=>n.COLOR_ATTACHMENT0+t)),n.clearColor(0,0,0,0),n.clear(n.COLOR_BUFFER_BIT),n.bindFramebuffer(n.FRAMEBUFFER,null),{fb:a,tex:o[0],texs:o,w:e,h:t,dispose(){o.forEach(e=>n.deleteTexture(e)),n.deleteFramebuffer(a)}}},s.pp=(e,t,n)=>{let r=s.target(e,t,n),i=s.target(e,t,n);return{get read(){return r},get write(){return i},swap(){let e=r;r=i,i=e},dispose(){r.dispose(),i.dispose()}}},s.run=(e,t,r={},i={})=>{n.useProgram(e.p),t?(n.bindFramebuffer(n.FRAMEBUFFER,t.fb),n.viewport(0,0,t.w,t.h)):(n.bindFramebuffer(n.FRAMEBUFFER,null),n.viewport(0,0,n.drawingBufferWidth,n.drawingBufferHeight));let a=0;for(let t in r){let i=r[t],o=e.loc(t);o!==null&&i!==void 0&&(i instanceof WebGLTexture||i&&i.fb?(n.activeTexture(n.TEXTURE0+a),n.bindTexture(n.TEXTURE_2D,i.fb?i.tex:i),n.uniform1i(o,a++)):typeof i==`number`?n.uniform1f(o,i):typeof i==`boolean`?n.uniform1i(o,+!!i):i.i===void 0?i.v3?n.uniform3fv(o,i.v3):i instanceof Float32Array?n.uniform4fv(o,i):i.length===2?n.uniform2f(o,i[0],i[1]):i.length===3?n.uniform3f(o,i[0],i[1],i[2]):i.length===4&&n.uniform4f(o,i[0],i[1],i[2],i[3]):n.uniform1i(o,i.i))}i.clear&&(n.clearColor(0,0,0,0),n.clear(n.COLOR_BUFFER_BIT)),i.blend&&(n.enable(n.BLEND),n.blendFunc(n.ONE,n.ONE)),i.points?n.drawArrays(n.POINTS,0,i.points):n.drawArrays(n.TRIANGLES,0,3),i.blend&&n.disable(n.BLEND)},s.ppN=(e,t,n,r)=>{let i=s.target(e,t,n,r),a=s.target(e,t,n,r);return{get read(){return i},get write(){return a},swap(){let e=i;i=a,a=e},dispose(){i.dispose(),a.dispose()}}},s},r.Present=function(e){let t=e.program(r.FS(`
uniform sampler2D src; uniform vec2 dir; uniform float thresh;
void main(){
  vec2 q = gl_FragCoord.xy / grid;
  vec3 s = vec3(0.0); float wsum = 0.0;
  for (int i = -6; i <= 6; i++) { float w = exp(-float(i * i) / 18.0); vec3 c = texture(src, q + dir * float(i) / grid).rgb; s += max(c - thresh, 0.0) * w; wsum += w; }
  o = vec4(s / wsum, 1.0);
}`)),n=e.program(r.FS(`
uniform sampler2D colorTex, shapeTex, bloomTex; uniform bool useShape, useStretch, rawPixels;
uniform vec4 rect; uniform float dotSize, halo, bloom, unlit, gain, see;
void main(){
  vec2 px = gl_FragCoord.xy - rect.xy;
  if (any(lessThan(px, vec2(0.0))) || any(greaterThan(px, rect.zw))) { o = vec4(0.0, 0.0, 0.0, 1.0 - see); return; }
  vec2 pitch = rect.zw / grid;
  float diam = min(pitch.x, pitch.y);
  vec2 p = px / pitch;
  if (rawPixels) {
    vec3 c = texelFetch(colorTex, clamp(ivec2(floor(p)), ivec2(0), ivec2(grid)-1), 0).rgb;
    c = min(c + texture(bloomTex, p / grid).rgb * bloom, vec3(1.0));
    o = vec4(c, mix(1.0, max(max(c.r, c.g), c.b), see));
    return;
  }
  ivec2 base = ivec2(floor(p - 0.5));                       /* the four dots nearest this pixel */
  vec3 glow = vec3(0.0), face = vec3(0.0); float cover = 0.0;
  for (int y = 0; y <= 1; y++) for (int x = 0; x <= 1; x++) {
    ivec2 q = base + ivec2(x, y);
    if (any(lessThan(q, ivec2(0))) || any(greaterThanEqual(q, ivec2(grid)))) continue;
    vec4 sh = useShape ? texelFetch(shapeTex, q, 0) : vec4(0.0, 0.0, 1.0, 0.0);
    float rad = 0.4 * diam * dotSize * sh.z;
    vec2 e = (p - (vec2(q) + 0.5 + sh.xy)) * pitch;
    if (useStretch && sh.w > 0.0 && dot(sh.xy, sh.xy) > 1e-8) { /* ellipse stretched along the dot's offset (flow) direction */
      vec2 ax = normalize(sh.xy); e = vec2(dot(e, ax) / (1.0 + min(sh.w, 1.2)), dot(e, vec2(-ax.y, ax.x)));
    }
    float d = length(e);
    float cv = clamp(rad - d + 0.5, 0.0, 1.0);
    cv = mix(0.5, cv, smoothstep(1.0, 2.0, diam));
    float f = 1.0 - smoothstep(rad * 0.8, rad + diam * 0.75, d);
    if (f <= 0.0 && cv <= cover) continue;                 /* out of reach: skip the colour fetch (same result) */
    vec3 col = texelFetch(colorTex, q, 0).rgb * gain;
    glow += col * (0.16 * halo * f * f);
    if (cv > cover) { cover = cv; face = col; }
  }
  vec3 dark = vec3(22.0, 19.0, 29.0) / 255.0 * unlit;
  vec3 c = mix(glow, dark + face, cover);
  c += texture(bloomTex, p / grid).rgb * bloom;
  c = min(c, vec3(1.0));
  /* see-through: premultiplied alpha = brightest channel, so dark liquid lets the page behind show (close to a screen blend, and it works inside any stacking context) */
  o = vec4(c, mix(1.0, max(max(c.r, c.g), c.b), see));
}`)),i=null,a=null,o=0,s=0;return{resize(t,n){(t!==o||n!==s)&&(o=t,s=n,i&&i.dispose(),a&&a.dispose(),i=e.target(o,s),a=e.target(o,s))},draw(r,c,l){c.bloom>0&&(e.run(t,i,{src:r.color,grid:[o,s],dir:[1,0],thresh:.12}),e.run(t,a,{src:i,grid:[o,s],dir:[0,1],thresh:0})),e.run(n,null,{colorTex:r.color,shapeTex:r.shape||r.color,bloomTex:a,rawPixels:!!c.rawPixels,useShape:!!r.shape,useStretch:!!r.stretch,grid:[o,s],rect:l,dotSize:c.dotSize,halo:c.halo,bloom:c.bloom,unlit:1,gain:1,see:+!!c.see})}}},r.noTouch=function(e,t,n,r,i,a,o){let s=e.length,c=new Float64Array(s),l=new Float64Array(s),u=new Float64Array(s),d=new Float64Array(s);if(s<2)return{VX:c,VY:l,SX:u,SY:d,pairs:0};let f=(10**o-1)/99,p=Float64Array.from(e),m=Float64Array.from(t),h=Array.from(n).sort((e,t)=>e-t)[Math.min(s-1,Math.floor(s*.98))],g=4*h,_=[],v=new Float64Array(s),y=new Map;for(let e=0;e<s;e++){if(n[e]>h){_.push(e),v[e]=NaN;continue}let t=Math.floor(p[e]/g),r=Math.floor(m[e]/g),i=(t+1048576)*2097152+(r+1048576);v[e]=i;let a=y.get(i);a||y.set(i,a=[]),a.push(e)}let b=[],x=(e,t)=>{if(!(r[e]+r[t]))return;let i=n[e]+n[t],a=p[t]-p[e],o=m[t]-m[e];Math.abs(a)<2*i&&Math.abs(o)<2*i&&b.push(e,t)},S=[[1,0],[-1,1],[0,1],[1,1]];for(let[e,t]of y){for(let e=0;e<t.length;e++)for(let n=e+1;n<t.length;n++)x(t[e],t[n]);let n=Math.floor(e/2097152),r=e-n*2097152;for(let[e,i]of S){let a=y.get((n+e)*2097152+r+i);if(a)for(let e of t)for(let t of a)x(e,t)}}for(let e=0;e<_.length;e++){let t=_[e];for(let e=0;e<s;e++)e!==t&&(v[e]===v[e]||e>t)&&x(Math.min(t,e),Math.max(t,e))}for(let e=0;e<b.length;e+=2){let t=b[e],s=b[e+1],u=r[t]+r[s],d=p[s]-p[t],h=m[s]-m[t],g=n[t]+n[s],_=Math.hypot(d,h);_<.001?(d=Math.cos(t*2.4+s),h=Math.sin(t*2.4+s),_=1):(d/=_,h/=_);let v=_-g;if(v>=g)continue;let y=Math.min(2e4,a*((g/Math.max(v,.02*g))**+o-1)/f)*i/u;r[t]&&(c[t]-=d*y,l[t]-=h*y),r[s]&&(c[s]+=d*y,l[s]+=h*y)}for(let e=0;e<6;e++){let e=!1;for(let t=0;t<b.length;t+=2){let i=b[t],a=b[t+1],o=r[i]+r[a],s=p[a]-p[i],c=m[a]-m[i],l=n[i]+n[a];if(Math.abs(s)>=l||Math.abs(c)>=l)continue;let f=Math.hypot(s,c);if(f>=l)continue;f<.001?(s=Math.cos(i*2.4+a),c=Math.sin(i*2.4+a),f=0):(s/=f,c/=f);let h=(l-f)/o;e=!0,r[i]&&(p[i]-=s*h,m[i]-=c*h,u[i]-=s*h,d[i]-=c*h),r[a]&&(p[a]+=s*h,m[a]+=c*h,u[a]+=s*h,d[a]+=c*h)}if(!e)break}return{VX:c,VY:l,SX:u,SY:d,pairs:b.length/2}},r.Probe=function(e){let t=e.gl;if(!e.canReadFloat||!t.fenceSync)return null;let n=e.program(`#version 300 es
precision highp float; uniform sampler2D src; uniform vec2 srcSize, dstSize; out vec4 o;
void main(){
  vec3 s = vec3(0.0);
  for (int j = 0; j < 4; j++) for (int i = 0; i < 4; i++) {
    vec2 q = (floor(gl_FragCoord.xy) + (vec2(i, j) + 0.5) / 4.0) / dstSize * srcSize;
    s += texelFetch(src, ivec2(clamp(q, vec2(0.0), srcSize - 1.0)), 0).rgb;
  }
  s /= 16.0; o = vec4(dot(s, vec3(0.3, 0.55, 0.15)), 0.0, 0.0, 1.0);
}`),r=null,i=t.createBuffer(),a=null,o=0,s=null,c={data:null,w:0,h:0};return c.tick=(l,u,d)=>{if(a){let e=t.clientWaitSync(a,0,0);if(e===t.ALREADY_SIGNALED||e===t.CONDITION_SATISFIED){t.bindBuffer(t.PIXEL_PACK_BUFFER,i),t.getBufferSubData(t.PIXEL_PACK_BUFFER,0,s),t.bindBuffer(t.PIXEL_PACK_BUFFER,null),t.deleteSync(a),a=null;let e=c.data&&c.data.length===r.w*r.h?c.data:new Float32Array(r.w*r.h);for(let t=0;t<e.length;t++)e[t]=s[t*4];c.data=e,c.w=r.w,c.h=r.h}else e===t.WAIT_FAILED&&(t.deleteSync(a),a=null);return}if(++o%3||!l)return;let f=Math.max(8,Math.min(64,Math.round(32*d/Math.max(1,u))));r&&r.w===32&&r.h===f||(r&&r.dispose(),r=e.target(32,f,{f32:!0,nearest:!0}),s=new Float32Array(32*f*4),t.bindBuffer(t.PIXEL_PACK_BUFFER,i),t.bufferData(t.PIXEL_PACK_BUFFER,s.byteLength,t.STREAM_READ),t.bindBuffer(t.PIXEL_PACK_BUFFER,null),c.data=null),e.run(n,r,{src:l,srcSize:[u,d],dstSize:[32,f]}),t.bindBuffer(t.PIXEL_PACK_BUFFER,i),t.readPixels(0,0,32,f,t.RGBA,t.FLOAT,0),t.bindBuffer(t.PIXEL_PACK_BUFFER,null),t.bindFramebuffer(t.FRAMEBUFFER,null),a=t.fenceSync(t.SYNC_GPU_COMMANDS_COMPLETE,0),t.flush()},c.slope=(e,t)=>{let n=c.data,r=c.w,i=c.h;if(!n)return null;let a=(e,t)=>n[Math.min(i-1,Math.max(0,t))*r+Math.min(r-1,Math.max(0,e))],o=Math.round(e-.5),s=Math.round(t-.5);return o<0||s<0||o>=r||s>=i?null:[(a(o+1,s)-a(o-1,s))*.5,(a(o,s+1)-a(o,s-1))*.5]},c},r.Lab=function(e){let t=r.FS;return e=>{e.gl;let n={splat:e.program(t(`
uniform sampler2D vel, heat; uniform float dt, force, radiusMul, gain, swirl; uniform int mode;
void main(){
  vec2 p = gl_FragCoord.xy; ivec2 c = ivec2(p);
  vec2 v = texelFetch(vel, c, 0).xy; float h = texelFetch(heat, c, 0).r;
  for (int i = 0; i < ${r.MAXN}; i++) {
    if (i >= uNodeCount) break;
    vec4 A = uNodeA[i], B = uNodeB[i];
    float r = max(B.z * radiusMul, 0.75), d = segDist(p, B.xy, A.xy), w = exp(-d * d / (r * r));
    v += (A.zw - v) * w * min(1.0, force * dt);
    float t = w * pow(B.w, 0.8) * gain;
    h += max(t - h, 0.0) * min(1.0, dt * 14.0) + w * B.w * gain * dt * 0.6;
    if (swirl > 0.0) {   /* standing whirlpool around every node: the current itself orbits */
      vec2 e = p - A.xy; float l = length(e), R = r * 4.0;
      v += vec2(-e.y, e.x) / max(l, 1.0) * swirl * exp(-(l - R) * (l - R) / (R * R)) * dt;
    }
  }
  o = mode == 0 ? vec4(v, 0.0, 1.0) : vec4(min(h, 3.0), 0.0, 0.0, 1.0);
}`)),forces:e.program(t(`
uniform sampler2D vel, heat; uniform float dt, buoy, simmer, t;
void main(){
  vec2 p = gl_FragCoord.xy; ivec2 c = ivec2(p);
  vec2 v = texelFetch(vel, c, 0).xy; float h = texelFetch(heat, c, 0).r;
  v.y += buoy * h * dt;
  vec2 q = p / max(grid.y, 1.0) * 6.0;
  v += vec2(sin(q.y * 1.7 + t * 0.6 + 2.0 * sin(q.x * 0.9 + t * 0.21)), cos(q.x * 1.3 - t * 0.5 + 2.0 * sin(q.y * 1.1 - t * 0.17))) * simmer * dt;
  o = vec4(v, 0.0, 1.0);
}`)),advect:e.program(t(`
uniform sampler2D src, vel; uniform float dt, decay;
void main(){ vec2 p = gl_FragCoord.xy, v = texelFetch(vel, ivec2(p), 0).xy; o = texture(src, (p - dt * v) / grid) * decay; }`)),curl:e.program(t(`
uniform sampler2D vel;
void main(){
  ivec2 c = ivec2(gl_FragCoord.xy);
  float L = texelFetch(vel, clampCell(c - ivec2(1, 0)), 0).y, R = texelFetch(vel, clampCell(c + ivec2(1, 0)), 0).y;
  float B = texelFetch(vel, clampCell(c - ivec2(0, 1)), 0).x, T = texelFetch(vel, clampCell(c + ivec2(0, 1)), 0).x;
  o = vec4(0.5 * (R - L - (T - B)), 0.0, 0.0, 1.0);
}`)),vort:e.program(t(`
uniform sampler2D vel, cu; uniform float dt, eps;
void main(){
  ivec2 c = ivec2(gl_FragCoord.xy);
  float L = texelFetch(cu, clampCell(c - ivec2(1, 0)), 0).r, R = texelFetch(cu, clampCell(c + ivec2(1, 0)), 0).r;
  float B = texelFetch(cu, clampCell(c - ivec2(0, 1)), 0).r, T = texelFetch(cu, clampCell(c + ivec2(0, 1)), 0).r;
  vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L)); f /= length(f) + 1e-4; f *= eps * texelFetch(cu, c, 0).r; f.y = -f.y;
  o = vec4(clamp(texelFetch(vel, c, 0).xy + f * dt, -400.0, 400.0), 0.0, 1.0);
}`)),divg:e.program(t(`
uniform sampler2D vel;
void main(){
  ivec2 c = ivec2(gl_FragCoord.xy);
  float L = texelFetch(vel, clampCell(c - ivec2(1, 0)), 0).x, R = texelFetch(vel, clampCell(c + ivec2(1, 0)), 0).x;
  float B = texelFetch(vel, clampCell(c - ivec2(0, 1)), 0).y, T = texelFetch(vel, clampCell(c + ivec2(0, 1)), 0).y;
  if (c.x == 0) L = -texelFetch(vel, c, 0).x; if (c.x == int(grid.x) - 1) R = -texelFetch(vel, c, 0).x;
  if (c.y == 0) B = -texelFetch(vel, c, 0).y; if (c.y == int(grid.y) - 1) T = -texelFetch(vel, c, 0).y;
  o = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`)),jacobi:e.program(t(`
uniform sampler2D pr, dv;
void main(){
  ivec2 c = ivec2(gl_FragCoord.xy);
  o = vec4((texelFetch(pr, clampCell(c - ivec2(1, 0)), 0).r + texelFetch(pr, clampCell(c + ivec2(1, 0)), 0).r
          + texelFetch(pr, clampCell(c - ivec2(0, 1)), 0).r + texelFetch(pr, clampCell(c + ivec2(0, 1)), 0).r - texelFetch(dv, c, 0).r) * 0.25, 0.0, 0.0, 1.0);
}`)),project:e.program(t(`
uniform sampler2D pr, vel;
void main(){
  ivec2 c = ivec2(gl_FragCoord.xy);
  float L = texelFetch(pr, clampCell(c - ivec2(1, 0)), 0).r, R = texelFetch(pr, clampCell(c + ivec2(1, 0)), 0).r;
  float B = texelFetch(pr, clampCell(c - ivec2(0, 1)), 0).r, T = texelFetch(pr, clampCell(c + ivec2(0, 1)), 0).r;
  o = vec4(texelFetch(vel, c, 0).xy - 0.5 * vec2(R - L, T - B), 0.0, 1.0);
}`)),heatDiffuse:e.program(t(`
uniform sampler2D heat; uniform float dt, cool;
void main(){
  ivec2 c = ivec2(gl_FragCoord.xy); float h = texelFetch(heat, c, 0).r;
  float n = texelFetch(heat, clampCell(c + ivec2(1, 0)), 0).r + texelFetch(heat, clampCell(c - ivec2(1, 0)), 0).r
          + texelFetch(heat, clampCell(c + ivec2(0, 1)), 0).r + texelFetch(heat, clampCell(c - ivec2(0, 1)), 0).r;
  o = vec4(mix(h, n * 0.25, clamp(dt * 2.8, 0.0, 0.5)) * exp(-dt * cool), 0.0, 0.0, 1.0);
}`)),mat:e.program(t(`
uniform sampler2D mat, vel; uniform float dt, spring, part, radiusMul;
void main(){
  vec2 p = gl_FragCoord.xy, v = texelFetch(vel, ivec2(p), 0).xy;
  vec2 d = (texture(mat, (p - dt * v) / grid).xy + dt * v) * exp(-dt * spring);
  for (int i = 0; i < ${r.MAXN}; i++) {
    if (i >= uNodeCount) break;
    float r = max(uNodeB[i].z * radiusMul, 1.0); vec2 e = p - uNodeA[i].xy; float l = length(e);
    if (l > r * 2.6 || l < 1e-3) continue;
    float ring = l < r ? l / r : exp(-(l - r) * (l - r) / (r * r * 0.6));
    d = mix(d, e / l * part * r * ring, clamp(dt * 10.0, 0.0, 1.0) * smoothstep(r * 2.6, r * 0.6, l));
  }
  float l = length(d); if (l > 48.0) d *= 48.0 / l;
  o = vec4(d, 0.0, 1.0);
}`))},i=e.program(t(`
uniform float seed, density; uniform int variant;
void main(){
  vec2 p = gl_FragCoord.xy; float r = hash12(p + seed);
  float a = r < density ? 1.0 : 0.0;
  float sp = floor(hash12(p * 1.7 + seed) * 4.0);                   /* species for QuadLife */
  float st = floor(hash12(p * 2.3 + seed) * 3.0);                   /* phase for cyclic (313 rule) */
  /* SmoothLife wants blobs, not salt: fill random discs. */
  vec2 cell = floor(p / 7.0); vec2 ctr = (cell + 0.2 + 0.6 * vec2(hash12(cell + seed), hash12(cell * 1.3 + seed))) * 7.0;
  float blob = hash12(cell * 2.1 + seed) < 0.5 && length(p - ctr) < 2.6 + 1.5 * hash12(cell + 9.1) ? 1.0 : 0.0;
  if (variant == 4) a = r < 0.18 ? 1.0 : 0.0;
  o = variant == 6 ? vec4(blob, 0.0, 0.0, 0.0) : variant == 9 ? vec4(1.0, 0.0, st, 0.0) : vec4(a, 0.0, (variant == 4 || variant == 5) ? 0.0 : sp, 0.0);
}`)),a=e.program(t(`
uniform sampler2D S, vel, heat, flock; uniform int variant; uniform bool join; uniform float dt, carry, salt, spark, seedP, eat;
vec4 at(ivec2 c){ return texelFetch(S, wrapCell(c), 0); }
bool inMask(int n, int mask){ return ((mask >> n) & 1) == 1; }
void main(){
  ivec2 c = ivec2(gl_FragCoord.xy); vec2 p = gl_FragCoord.xy;
  /* Cells ride the current: fetch from upstream, rounded stochastically so slow flow still moves them on average. */
  vec2 v = texelFetch(vel, c, 0).xy * carry * dt;
  ivec2 up = ivec2(floor(p - v + vec2(hash12(vec2(salt, 1.3)), hash12(vec2(salt, 7.1))) - 0.5));   /* one dither per step for the whole grid: neighbours move together, so patterns are not torn */
  ivec2 o2 = up - c;
  vec4 me = at(c + o2);
  float h = texelFetch(heat, c, 0).r;
  int n = 0, n2 = 0; vec4 sum = vec4(0.0); int spc[4] = int[4](0, 0, 0, 0);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    if (x == 0 && y == 0) continue;
    vec4 q = at(c + o2 + ivec2(x, y));
    bool on = q.r > 0.5;
    if (variant == 4 || variant == 5) on = q.b < 0.5 && q.r > 0.5;   /* only fully alive cells count */
    if (on) { n++; spc[int(q.b) & 3]++; }
    if (variant == 9 && abs(q.b - mod(me.b + 1.0, 3.0)) < 0.5) n2++;
  }
  float alive = me.r > 0.5 ? 1.0 : 0.0; float age = me.g, st = me.b, trail = me.a * 0.92;
  int B = 8, Sv = 12;                                     /* masks: bit n set = n neighbours */
  if (variant == 1) { B = 8 | 64; }
  if (variant == 2) { B = 8 | 64 | 128 | 256; Sv = 8 | 16 | 64 | 128 | 256; }
  if (variant == 7) { float w = smoothstep(0.08, 0.5, h); if (w > 0.66) { B = 8 | 64 | 128 | 256; Sv = 8 | 16 | 64 | 128 | 256; } else if (w > 0.2) { B = 8 | 64; } }
  vec4 outv;
  if (variant == 4) {                                     /* Brian's Brain: off -> on (2), on -> dying, dying -> off */
    float s = me.r > 0.5 ? (me.b < 0.5 ? 1.0 : 2.0) : 0.0;
    float ns = s == 1.0 ? 2.0 : s == 2.0 ? 0.0 : (n == 2 ? 1.0 : 0.0);
    outv = vec4(ns > 0.0 ? 1.0 : 0.0, ns == 1.0 ? 0.0 : age + dt, ns == 2.0 ? 1.0 : 0.0, max(trail, ns > 0.0 ? 1.0 : 0.0));
  } else if (variant == 5) {                              /* Star Wars 345/2/4: dying cells fade through two steps */
    float s = me.r > 0.5 ? me.b : -1.0; float ns;
    if (s < 0.0) ns = n == 2 ? 0.0 : -1.0;
    else if (s < 0.5) ns = (n == 3 || n == 4 || n == 5) ? 0.0 : 1.0;
    else ns = s + 1.0 >= 3.0 ? -1.0 : s + 1.0;
    outv = vec4(ns >= 0.0 ? 1.0 : 0.0, ns == 0.0 ? min(age + dt, 9.0) : 0.0, max(ns, 0.0), max(trail, ns >= 0.0 ? 1.0 : 0.0));
  } else if (variant == 6) {                              /* SmoothLife-lite: inner disk vs ring, continuous */
    float inner = 0.0, ring = 0.0, ni = 0.0, nr = 0.0;
    for (int y = -5; y <= 5; y++) for (int x = -5; x <= 5; x++) {
      float d = length(vec2(x, y)); if (d > 5.5) continue;
      float s = at(c + o2 + ivec2(x, y)).r;
      if (d < 1.9) { inner += s; ni++; } else { ring += s; nr++; }
    }
    float m = 1.0 / (1.0 + exp(-(inner / ni - 0.5) * 6.8)), rr = ring / nr;
    float sig1 = 1.0 / (1.0 + exp(-(rr - mix(0.278, 0.267, m)) * 28.0)), sig2 = 1.0 / (1.0 + exp((rr - mix(0.365, 0.445, m)) * 28.0));
    float target = sig1 * sig2;
    float s = clamp(me.r + (target * 2.0 - 1.0) * dt * 6.0, 0.0, 1.0);
    outv = vec4(s, s > 0.5 ? age + dt : 0.0, 0.0, max(trail, s));
  } else if (variant == 9) {                              /* cyclic: a cell advances when 3+ neighbours are one step ahead */
    float ns = n2 >= 3 ? mod(me.b + 1.0, 3.0) : me.b;
    outv = vec4(1.0, ns != me.b ? 0.0 : age + dt, ns, trail);
  } else if (variant == 3) {                              /* Seeds B2/S- erupts only in hot water; cold water is Conway */
    bool hot = h > 0.25;
    float na = hot ? (alive < 0.5 && n == 2 ? 1.0 : 0.0) : (alive > 0.5 ? (n == 2 || n == 3 ? 1.0 : 0.0) : (n == 3 ? 1.0 : 0.0));
    outv = vec4(na, na > 0.5 ? (alive > 0.5 ? age + dt : 0.0) : 0.0, me.b, max(trail, na));
  } else {
    float na = alive > 0.5 ? (inMask(n, Sv) ? 1.0 : 0.0) : (inMask(n, B) ? 1.0 : 0.0);
    float sp = st;
    if (variant == 8 && alive < 0.5 && na > 0.5) {       /* QuadLife: newborn takes its parents' majority colour */
      int best = 0; for (int k = 1; k < 4; k++) if (spc[k] > spc[best]) best = k;
      sp = float(best);
    }
    outv = vec4(na, na > 0.5 ? (alive > 0.5 ? age + dt : 0.0) : 0.0, sp, max(trail, na));
  }
  /* Heat sparks new life; flocks seed it where they swim. */
  float rs = variant == 6 ? hash12(floor(p / 4.0) * 0.91 + salt * 1.7) * 6.0 : hash12(p * 0.91 + salt * 1.7);
  float sparkP = spark * smoothstep(0.15, 0.9, h) * 0.08;
  vec4 fl = texelFetch(flock, c, 0);
  float sparked = step(rs, sparkP), joined = step(rs, fl.a * seedP), seeded = sparked + joined;
  if (join && sparked == 0.0 && joined > 0.0 && variant != 9) {
    /* Round 6: a boid writes itself in as an ordinary live cell. A cell that was already alive keeps its age, a newborn
       takes its parents' colour (QuadLife), and from then on the rule alone decides whether it lives once the boid moves on. */
    bool was = outv.r > 0.5;
    outv.r = variant == 6 ? max(outv.r, 0.9) : 1.0;
    if (!was) outv.g = 0.0;
    if (variant == 4 || variant == 5) { outv.b = 0.0; if (!was || me.b > 0.5) outv.g = 0.0; }
    if (variant == 8 && !was) { int best = int(floor(hash12(p + salt) * 4.0)) & 3; for (int k = 0; k < 4; k++) if (spc[k] > spc[best]) best = k; outv.b = float(best); }
    outv.a = 1.0;
    seeded = 0.0;
  }
  if (seeded > 0.0 && variant != 9) { outv.r = variant == 6 ? max(outv.r, 0.9) : 1.0; outv.g = 0.0; if (variant == 4 || variant == 5) outv.b = 0.0; if (variant == 8) outv.b = floor(hash12(p + salt) * 4.0); outv.a = 1.0; }
  if (seeded > 0.0 && variant == 9) outv.b = mod(outv.b + 1.0, 3.0);
  if (eat > 0.0 && fl.a > 0.0 && variant != 9) { outv.r = 0.0; outv.g = 0.0; outv.a = 1.0; }   /* grazers eat what they swim over */
  o = outv;
}`)),o=e.program(t(`
uniform float seed; uniform vec2 world;
void main(){ vec2 p = gl_FragCoord.xy; o = vec4(hash12(p + seed) * world.x, hash12(p * 1.9 + seed) * world.y, hash12(p * 3.1) - 0.5, hash12(p * 4.7) - 0.5); }`)),s=e.program(`#version 300 es
precision highp float; in vec4 val; out vec4 o; void main(){ o = val; }`,`#version 300 es
precision highp float; precision highp int;
uniform sampler2D B0; uniform int count; uniform vec2 target, world; uniform int stamp, variant;
out vec4 val;
void main(){
  int id = gl_VertexID / 5, part = gl_VertexID % 5;
  if (id >= count) { gl_Position = vec4(2.0, 2.0, 0.0, 1.0); return; }
  vec4 b = texelFetch(B0, ivec2(id % 64, id / 64), 0);
  vec2 off = vec2(0.0);
  if (stamp == 1) {                                     /* draw a glider pointing the way the boid swims */
    vec2 g[5] = vec2[5](vec2(0, 1), vec2(1, 0), vec2(-1, -1), vec2(0, -1), vec2(1, -1));
    vec2 dir = sign(b.zw + 1e-5);
    off = g[part] * vec2(dir.x, -dir.y);
  } else if (part > 0) { gl_Position = vec4(2.0, 2.0, 0.0, 1.0); return; }
  float pred = (variant == 4 && (id % 9) == 0) ? 1.0 : 0.0;
  vec2 p = floor(b.xy / world * target + (stamp == 1 ? off : vec2(0.0))) + 0.5;
  val = vec4(b.zw, pred, 1.0);
  gl_Position = vec4(p / target * 2.0 - 1.0, 0.0, 1.0); gl_PointSize = 1.0;
}`),c=e.program(t(`
uniform sampler2D B0, coarse, vel, S; uniform int variant, count; uniform vec2 world, cgrid;
uniform float dt, t, minSp, maxSp, orbit, ringK, align, cohere, separate, carry, capture, wander;
vec2 perp(vec2 v){ return vec2(-v.y, v.x); }
void main(){
  ivec2 c = ivec2(gl_FragCoord.xy); int id = c.x + c.y * 64;
  vec4 b = texelFetch(B0, c, 0);
  if (id >= count) { o = b; return; }
  vec2 p = b.xy, v = b.zw;
  float hid = hash12(vec2(float(id), 7.7)), dirSign = hid < 0.5 ? 1.0 : -1.0;
  /* Neighbours from the coarse grid. */
  vec2 cq = p / world * cgrid;
  vec4 here = texture(coarse, cq / cgrid);
  vec2 dx = vec2(1.0 / cgrid.x, 0.0), dy = vec2(0.0, 1.0 / cgrid.y);
  vec2 grad = vec2(texture(coarse, cq / cgrid + dx).a - texture(coarse, cq / cgrid - dx).a, texture(coarse, cq / cgrid + dy).a - texture(coarse, cq / cgrid - dy).a);
  vec2 predGrad = vec2(texture(coarse, cq / cgrid + dx).b - texture(coarse, cq / cgrid - dx).b, texture(coarse, cq / cgrid + dy).b - texture(coarse, cq / cgrid - dy).b);
  vec2 avgV = here.a > 0.0 ? here.rg / here.a : v;
  /* Relative density gradient (about ±1) so flocking stays on the same scale as steering: cohere toward company,
     push apart once a coarse cell holds more than cohere / separate boids. */
  vec2 rel = grad / (here.a + 2.0);
  vec2 acc = (avgV - v) * align + rel * (cohere - separate * here.a) * 0.25;
  /* Nearest two nodes and the hottest node. */
  int n1 = -1, n2 = -1, hot = -1; float d1 = 1e9, d2 = 1e9, hs = 0.0;
  for (int i = 0; i < ${r.MAXN}; i++) {
    if (i >= uNodeCount) break;
    float d = length(uNodeA[i].xy - p);
    if (d < d1) { d2 = d1; n2 = n1; d1 = d; n1 = i; } else if (d < d2) { d2 = d; n2 = i; }
    if (uNodeB[i].w > hs) { hs = uNodeB[i].w; hot = i; }
  }
  vec2 desire = vec2(0.0); float steer = 0.0;
  if (n1 >= 0 && d1 < capture * grid.y) {
    vec2 cN = uNodeA[n1].xy; float rN = max(uNodeB[n1].z, 1.0); vec2 e = p - cN; float l = max(length(e), 1e-3); vec2 rad = e / l;
    float R = rN * ringK;
    float nodeSign = (n1 & 1) == 0 ? 1.0 : -1.0;   /* every boid round one node turns the same way, so alignment helps */
    if (variant == 0 || variant == 1 || variant == 7) dirSign = nodeSign;
    if (variant == 0 || variant == 1 || variant == 2 || variant == 7) {
      desire = perp(rad) * dirSign * maxSp - rad * (l - R) * orbit * 0.6;
      steer = variant == 2 ? 0.25 : 1.0;
    } else if (variant == 3) {                            /* lanes at 1.5, 2.5, 3.5 × ring, inner lanes faster */
      float lane = (1.0 + floor(hid * 3.0)) * R * 0.75; float w = maxSp * pow(R / lane, 1.5);
      desire = perp(rad) * w - rad * (l - lane) * orbit; steer = 1.0;
    } else if (variant == 4) {
      bool pred = (id % 9) == 0;
      desire = pred ? normalize(grad + 1e-4) * maxSp * 1.3 : perp(rad) * dirSign * maxSp - rad * (l - R) * orbit * 0.6 - predGrad * 30.0;
      steer = 1.0;
    } else if (variant == 5 && n2 >= 0) {                /* clockwise round one node, anticlockwise round the next */
      vec2 e2 = p - uNodeA[n2].xy; float side = n1 < n2 ? 1.0 : -1.0;
      desire = perp(rad) * side * maxSp - rad * (l - R) * orbit * 0.4 + normalize(e2 + 1e-4) * -0.3 * maxSp * smoothstep(R * 2.0, R * 5.0, length(e2));
      steer = 1.0;
    } else if (variant == 6 && hot >= 0) {               /* murmuration: loose loop round the fastest node */
      vec2 e3 = p - uNodeA[hot].xy; float l3 = max(length(e3), 1e-3);
      desire = perp(e3 / l3) * maxSp - e3 / l3 * (l3 - R * 3.0) * orbit * 0.25;
      steer = 0.6;
    } else if (variant == 8) {                           /* epicycles: chase a point that circles a circle */
      float a1 = t * maxSp / (R * 2.0) * dirSign + hid * 6.28, a2 = a1 * 4.0 + hid * 3.0;
      vec2 target = cN + vec2(cos(a1), sin(a1)) * R * 1.6 + vec2(cos(a2), sin(a2)) * R * 0.6;
      desire = (target - p) * 2.0; steer = 1.0;
    } else if (variant == 9) {                           /* slow spiral in; a fast node flings its captives away */
      desire = perp(rad) * dirSign * maxSp * 1.2 - rad * maxSp * 0.15;
      steer = 1.0;
      if (uNodeB[n1].w > 0.35) acc += uNodeA[n1].zw * 0.8 + rad * maxSp * 6.0 * uNodeB[n1].w;
    }
    if (variant == 7) {                                  /* grazers drift toward live cells */
      vec2 lp = vec2(0.0);
      for (int k = 0; k < 6; k++) { float a = float(k) * 1.047; vec2 q = vec2(cos(a), sin(a)); lp += q * texelFetch(S, wrapCell(ivec2(p + q * 3.0)), 0).r; }
      desire += lp * maxSp * 0.6;
    }
  } else if (variant == 6 && hot >= 0) {
    desire = normalize(uNodeA[hot].xy - p + 1e-4) * maxSp * 0.6; steer = 0.4;
  }
  acc += (desire - v) * steer * 1.6;
  float th = (hash12(vec2(float(id), floor(t * 2.0))) - 0.5) * 6.28;
  acc += vec2(cos(th), sin(th)) * wander;
  /* Soft walls. */
  acc += vec2(smoothstep(6.0, 0.0, p.x) - smoothstep(world.x - 6.0, world.x, p.x), smoothstep(6.0, 0.0, p.y) - smoothstep(world.y - 6.0, world.y, p.y)) * maxSp * 4.0;
  v += acc * dt;
  float s = length(v), lo = variant == 4 && (id % 9) == 0 ? minSp * 1.3 : minSp, hi = variant == 4 && (id % 9) == 0 ? maxSp * 1.4 : maxSp;
  if (variant == 9) hi = maxSp * 4.0;
  if (s < lo) v *= lo / max(s, 1e-4); if (s > hi) v *= hi / s;
  /* The current carries every boid. */
  vec2 fv = texture(vel, p / world).xy;
  p += (v + fv * carry) * dt;
  p = clamp(p, vec2(0.5), world - 0.5);
  o = vec4(p, v);
}`)),l=e.program(t(`
vec3 rainbow(float h){ return clamp(abs(fract(h + vec3(1.0, 0.6667, 0.3333)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }   /* full HSV hue wheel */
vec3 spectral(float h){ vec3 c = rainbow(h); return mix(vec3(dot(c, vec3(0.33))), c, 1.25); }
uniform sampler2D D, vel; uniform float dt, relax, t;
void main(){
  vec2 p = gl_FragCoord.xy; vec2 v = texelFetch(vel, ivec2(p), 0).xy;
  vec4 d = texture(D, (p - v * dt) / grid);
  float base = (p.x + p.y * 0.6) / grid.x * 1.3 + t * 0.03;
  vec2 target = vec2(cos(base * 6.28318), sin(base * 6.28318));
  if (dot(d.xy, d.xy) < 0.01) d.xy = target;
  d.xy = normalize(mix(d.xy, target, 1.0 - exp(-relax * dt)) + 1e-5);
  o = vec4(d.xy, 0.0, 1.0);
}`)),u=e.program(t(`
uniform vec4 uNodeC[${r.MAXN}];   // r, g, b, spread (0 = no dye)
uniform sampler2D D, vel; uniform float dt, relax; uniform vec3 bg;
void main(){
  vec2 p = gl_FragCoord.xy; vec2 v = texelFetch(vel, ivec2(p), 0).xy;
  vec4 d = texture(D, (p - v * dt) / grid);
  if (abs(d.a - 2.0) > 0.5) d = vec4(bg, 2.0);
  for (int i = 0; i < ${r.MAXN}; i++) {
    if (i >= uNodeCount) break;
    vec4 K = uNodeC[i]; if (K.a <= 0.0) continue;
    float r = max(uNodeB[i].z, 1.0), l = length(p - uNodeA[i].xy);
    float w = smoothstep(r * 3.5 * K.a + 2.5, r * 0.9, l) * (0.6 + 2.5 * min(uNodeB[i].w, 1.5)) * dt * 4.0;
    d.rgb = mix(d.rgb, K.rgb, clamp(w, 0.0, 1.0));
  }
  d.rgb = mix(d.rgb, bg, 1.0 - exp(-relax * 0.5 * dt));
  o = vec4(d.rgb, 2.0);
}`)),d=e.program(t(`
vec3 rainbow(float h){ return clamp(abs(fract(h + vec3(1.0, 0.6667, 0.3333)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }   /* full HSV hue wheel */
vec3 spectral(float h){ vec3 c = rainbow(h); return mix(vec3(dot(c, vec3(0.33))), c, 1.25); }
uniform sampler2D S, vel, heat, mat, cu, flock, D;
uniform int lifeVar, rainbowVar, stamp, flockLook; uniform bool flocking; uniform float lifeLevel, trailLevel, flockLevel, overlay, passive, react, velRef, boil, stretch, shimmer, t, energy, heatMix;
const vec3 LAV = vec3(0.671, 0.475, 0.992), DEEP = vec3(0.325, 0.0, 0.847);
vec4 cellAt(ivec2 q){ return texelFetch(S, wrapCell(q), 0); }
/* Round 6: a boid is a live Life cell that moves. Its dot is the cell it sits on, set to whatever "alive" means for
   the current rule, so the Life colour, age, overlay hue and heat ramp below all treat it exactly like any other cell. */
vec4 asLife(vec4 L, ivec2 q){
  bool was = L.r > 0.5;
  if (lifeVar == 4 || lifeVar == 5) return vec4(1.0, was && L.b < 0.5 ? L.g : 0.0, 0.0, 1.0);   /* firing / fully alive state */
  if (lifeVar == 6) return vec4(max(L.r, 0.9), L.g, L.b, 1.0);
  if (lifeVar == 9) return vec4(1.0, 0.0, mod(L.b + 1.0, 3.0), L.a);                            /* advances the cycle, like a seed does */
  float sp = L.b;
  if (lifeVar == 8 && !was) {                                                                    /* QuadLife: the majority colour around it */
    int cnt[4] = int[4](0, 0, 0, 0);
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec4 nb = cellAt(q + ivec2(x, y)); if (nb.r > 0.5) cnt[int(nb.b) & 3]++; }
    int best = int(floor(hash12(vec2(q)) * 4.0)) & 3; for (int k = 0; k < 4; k++) if (cnt[k] > cnt[best]) best = k;
    sp = float(best);
  }
  return vec4(1.0, was ? L.g : 0.0, sp, 1.0);                                                    /* keeps its age if the cell was already alive */
}
void main(){
  vec2 p = gl_FragCoord.xy; ivec2 c = ivec2(p);
  vec2 v = texelFetch(vel, c, 0).xy; float h = texelFetch(heat, c, 0).r; vec2 d = texelFetch(mat, c, 0).xy;
  ivec2 src = ivec2(floor(p - d));
  vec4 L = cellAt(src);
  vec4 fl = texelFetch(flock, c, 0);
  bool boid = flocking && flockLook == 0 && fl.a > 0.0;
  if (boid) { L = asLife(L, src); h += fl.b > 0.0 ? 0.2 : 0.0; }   /* predators run a little hot, so the heat map marks them, not a fixed red */
  float sp = length(v) / velRef;
  /* Base Life colour per variant. */
  float on = L.r, lum = 0.0; vec3 base;
  if (lifeVar == 4) { base = L.b > 0.5 ? DEEP * 0.55 : vec3(0.85, 0.8, 1.0); lum = on; }
  else if (lifeVar == 5) { base = mix(LAV, DEEP * 0.5, L.b / 2.0); lum = on; }
  else if (lifeVar == 6) { base = mix(DEEP, LAV, smoothstep(0.3, 1.0, L.r)); lum = smoothstep(0.15, 0.6, L.r); on = lum; }
  else if (lifeVar == 8) { vec3 q[4] = vec3[4](vec3(0.9, 0.55, 0.45), vec3(0.55, 0.8, 0.65), vec3(0.6, 0.6, 0.95), vec3(0.85, 0.55, 0.85)); base = q[int(L.b) & 3]; lum = on; }
  else if (lifeVar == 9) { float ph = L.b / 3.0; base = mix(DEEP * 0.5, LAV, ph * 1.4); lum = 0.12 + 0.55 * ph * ph + 0.4 * exp(-L.g * 3.0); on = 1.0; }
  else { base = mix(LAV, DEEP, 0.35 + 0.65 * min(L.g * 0.15, 1.0)); lum = on; }
  vec3 col = base * lum * lifeLevel + DEEP * L.a * trailLevel * 0.35 * (1.0 - on);
  /* Rainbow overlays: a hue field that the medium pushes around. */
  if (rainbowVar >= 0) {
    float hue = 0.0, sat = 1.0;
    float cr = texelFetch(cu, c, 0).r;
    if (rainbowVar == 0) { hue = atan(v.y, v.x) / 6.28318 + 0.5; sat = smoothstep(0.02, 0.4 * react, sp); hue = mix((p.x + p.y) / (grid.x + grid.y) + t * 0.02, hue, sat); sat = max(sat, 0.55); }
    else if (rainbowVar == 1) { hue = (p.x * 0.8 + p.y) / grid.x * 1.2 - energy; }
    else if (rainbowVar == 2) { hue = 0.75 - clamp((h + sp * 0.2) * 0.9 * react, 0.0, 0.75) + p.y / grid.y * 0.04; }   /* violet when still, through blue, green, yellow to red when hot */
    else if (rainbowVar == 3) { vec2 dd = texelFetch(D, c, 0).xy; hue = atan(dd.y, dd.x) / 6.28318; }
    else if (rainbowVar == 4) {
      float best = 1e9; float bs = 0.0;
      for (int i = 0; i < ${r.MAXN}; i++) { if (i >= uNodeCount) break; float l = length(p - uNodeA[i].xy); if (l < best) { best = l; bs = uNodeB[i].w; } }
      hue = best / (grid.y * 0.18) - t * (0.05 + bs * react * 0.6);
    }
    else if (rainbowVar == 5) { hue = length(d) * 0.08 * react + (p.x - p.y) / grid.x * 0.25 + t * 0.01; sat = 0.75; }
    else if (rainbowVar == 6) { hue = L.g * 0.08 + sp * 0.3 * react + (lifeVar == 9 ? L.b / 3.0 : 0.0); }
    else if (rainbowVar == 7) { vec2 e = p - grid * 0.5; hue = atan(e.y, e.x) / 6.28318 + cr * 0.02 * react + t * 0.02 + length(e) / grid.x * 0.3; }
    else if (rainbowVar == 8) {                             /* prism: each channel of Life sampled along the flow */
      vec2 s = v / max(velRef, 1e-3) * 2.5 * react;
      float r = cellAt(ivec2(floor(p - d + s))).r, g = L.r, b = cellAt(ivec2(floor(p - d - s))).r;
      vec3 pr = vec3(r, g, b);
      col = mix(col, base * pr * lifeLevel * 1.2 + spectral(dot(s, vec2(0.3, 0.2)) + 0.6) * abs(r - b) * 0.5, overlay);
      hue = (p.y / grid.y) * 0.5 + t * 0.02;
    }
    else if (rainbowVar == 9) {                             /* aurora curtains that sway with the current */
      float x = p.x / grid.x * 5.0 + v.x / max(velRef, 1e-3) * 0.6 * react + sin(p.y / grid.y * 3.0 + t * 0.4) * 0.35;
      hue = 0.33 + 0.25 * sin(x * 1.3 + t * 0.2) + p.y / grid.y * 0.25;
      float curtain = pow(0.5 + 0.5 * sin(x * 3.1 + sin(x * 1.7 + t * 0.6)), 3.0) * smoothstep(0.0, 0.7, p.y / grid.y);
      col += rainbow(hue) * curtain * passive * 0.5;
    }
    vec3 rb = rainbowVar == 10 ? texelFetch(D, c, 0).rgb : mix(vec3(0.5), rainbow(hue), sat);
    if (rainbowVar != 8) col = mix(col, rb * lum * lifeLevel * 1.15 + col * 0.15, overlay);   /* replace, not max: max kept every cell lavender */
    col += rb * passive * 0.06;                             /* the gradient itself, faint on the unlit dots */
  }
  /* The old look: flocks drawn over everything as white sprites. */
  if (flocking && flockLook == 1 && fl.a > 0.0) col = max(col, (fl.b > 0.0 ? vec3(1.0, 0.45, 0.35) : vec3(0.95, 0.92, 1.0)) * flockLevel * (0.6 + 0.4 * min(fl.a, 3.0)));
  /* Heat on top (round 2 fluid look). */
  float tt = (h + sp * 0.3) * heatMix, k = smoothstep(0.03, 0.25, tt);
  float bub = step(1.0 - 0.45 * smoothstep(0.35, 1.1, tt), hash12(p + floor(t * 18.0) * 17.31));
  col = mix(col, max(col, ramp(tt + bub * boil * 0.25) * (0.3 + 0.7 * k)), k);
  o0 = vec4(col, 1.0);
  vec2 off = clamp(v / velRef * shimmer * 0.4, -0.38, 0.38);
  o1 = vec4(off, 1.0 + min(tt, 1.2) * 0.2, min(sp * stretch, 1.2));
}`,!0)),f=0,p=0,m,h,g,_,v,y,b,x,S,C,w,T,E=0,D=0,O=0,k=0,A=!1;e.target(1,1);let j=t=>{e.run(i,x.read,{grid:[f,p],seed:Math.random()*99,density:.28,variant:{i:t.lifeVar}})},M=-1;return{resize(t,n){[m,h,g,_,x,T].forEach(e=>e&&e.dispose()),[v,y,b,S,C].forEach(e=>e&&e.dispose()),f=t,p=n,m=e.pp(f,p),h=e.pp(f,p),g=e.pp(f,p),_=e.pp(f,p),T=e.pp(f,p),v=e.target(f,p),y=e.target(f,p),b=e.target(f,p,{},2),x=e.pp(f,p,{nearest:!0}),S=e.target(f,p,{nearest:!0}),C=e.target(Math.max(4,Math.round(f/6)),Math.max(4,Math.round(p/6))),w||=e.pp(64,64,{f32:!0,nearest:!0}),A=!1,M=-1},reset(){M=-1,A=!1},step(t,i,N,P,F){k++,F.lifeVar=+F.lifeVar,F.orbitVar=+F.orbitVar,F.rainbowVar=+F.rainbowVar;let I={grid:[f,p]};F.lifeVar!==M&&(j(F),M=F.lifeVar);let L=0;for(let e=0;e<N.uNodeCount.i;e++)L+=N.uNodeB[e*4+3];E+=(L-E)*Math.min(1,t*2),D+=t*(.02+E*.05*F.react);let R={...N,vel:m.read,heat:h.read,dt:t,force:F.force,radiusMul:F.wake,gain:F.heatGain,swirl:F.orbitVar===2?F.swirl:0};e.run(n.splat,h.write,{...R,mode:{i:1}}),e.run(n.splat,m.write,{...R,mode:{i:0}}),m.swap(),h.swap(),e.run(n.forces,m.write,{...I,vel:m.read,heat:h.read,dt:t,buoy:F.buoyancy,simmer:F.simmer,t:i}),m.swap(),e.run(n.advect,m.write,{...I,src:m.read,vel:m.read,dt:t,decay:Math.exp(-t*F.viscosity)}),m.swap(),e.run(n.curl,y,{...I,vel:m.read}),e.run(n.vort,m.write,{...I,vel:m.read,cu:y,dt:t,eps:F.vorticity}),m.swap(),e.run(n.divg,v,{...I,vel:m.read});for(let t=0;t<16;t++)e.run(n.jacobi,_.write,{...I,pr:_.read,dv:v}),_.swap();e.run(n.project,m.write,{...I,pr:_.read,vel:m.read}),m.swap(),e.run(n.advect,h.write,{...I,src:h.read,vel:m.read,dt:t,decay:1}),h.swap(),e.run(n.heatDiffuse,h.write,{...I,heat:h.read,dt:t,cool:F.cooling}),h.swap(),e.run(n.mat,g.write,{...N,mat:g.read,vel:m.read,dt:t,spring:F.spring,part:F.part,radiusMul:F.wake}),g.swap();let z=F.orbitVar>=0,B=[f,p],V=Math.round(F.boids);z?(A||=(e.run(o,w.read,{seed:Math.random()*50,world:B}),!0),e.run(s,C,{B0:w.read,count:{i:V},target:[C.w,C.h],world:B,stamp:{i:0},variant:{i:F.orbitVar}},{points:V*5,blend:!0,clear:!0}),e.run(c,w.write,{...N,B0:w.read,coarse:C,vel:m.read,S:x.read,variant:{i:F.orbitVar},count:{i:V},world:B,cgrid:[C.w,C.h],dt:t,t:i,minSp:F.boidSpeed*.4,maxSp:F.boidSpeed,orbit:F.orbitPull,ringK:F.ringSize,align:F.align,cohere:F.cohere,separate:F.separate,carry:F.carry,capture:F.capture,wander:F.wander}),w.swap(),e.run(s,S,{B0:w.read,count:{i:V},target:[f,p],world:B,stamp:{i:+(F.orbitVar===1)},variant:{i:F.orbitVar}},{points:V*5,blend:!0,clear:!0})):e.run(s,S,{B0:w.read,count:{i:0},target:[f,p],world:B,stamp:{i:0},variant:{i:0}},{points:0,clear:!0}),O+=t*F.lifeSpeed;let H=Math.min(3,Math.floor(O));for(O-=H;H-->0;)e.run(a,x.write,{...N,S:x.read,vel:m.read,heat:h.read,flock:S,variant:{i:F.lifeVar},dt:1/F.lifeSpeed,carry:F.flowCarry,salt:(k*.618+H)%97,spark:F.spark,seedP:F.orbitVar===7?0:F.seedLife,eat:F.orbitVar===7&&z?1:0,join:+F.flockLook==0}),x.swap();if(F.rainbowVar===3&&(e.run(l,T.write,{...I,D:T.read,vel:m.read,dt:t,relax:F.dyeRelax,t:i}),T.swap()),F.rainbowVar===10){let n=N.uPal.v3,i=[0,1,2].map(e=>.2+.55*n[6+e]);e.run(u,T.write,{...N,D:T.read,vel:m.read,dt:t,relax:F.dyeRelax,bg:i,uNodeC:N.uNodeC||r.NO_COLOR}),T.swap()}return e.run(d,b,{...N,S:x.read,vel:m.read,heat:h.read,mat:g.read,cu:y,flock:S,D:T.read,lifeVar:{i:F.lifeVar},rainbowVar:{i:F.rainbowVar},stamp:{i:0},flockLook:{i:+F.flockLook},flocking:z,lifeLevel:F.lifeLevel,trailLevel:F.trailLevel,flockLevel:z?F.flockLevel:0,overlay:F.overlay,passive:F.passive,react:F.react,velRef:F.hotSpeed/r.view.W*f,boil:F.boil,stretch:F.stretch,shimmer:F.shimmer,t:i,energy:D,heatMix:F.heatMix}),{color:b.texs[0],shape:b.texs[1],stretch:F.stretch>0}}}}},r.Idle=class{constructor(e){this.o=Object.assign({motion:`brownian`,amp:1,speed:1,wash:1,nudge:.6,zoomFix:!0,baseZoom:.62,noTouch:!1,touchStrength:1,touchFalloff:2},e||{}),this.T=0,this.z=2654435769,this.S=new WeakMap}set(e){return Object.assign(this.o,e),this}kick(e,t,n){let r=this.S.get(e);return r&&(r.qvx+=t,r.qvy+=n),this}step(e,t,n){if(n||={},!e||!e.length||!(t>0)||e.some(e=>!(Number.isFinite(e.x)&&Number.isFinite(e.y)))&&(e=e.filter(e=>Number.isFinite(e.x)&&Number.isFinite(e.y)),!e.length))return;let r=this.o,i=r.motion||`still`,a=+r.amp,o=t*r.speed,s=this.T+=o,c=Math.sqrt(o),l=n.zoom||1,u=this.S,d=this.z,f=()=>{d=d+1831565813|0;let e=Math.imul(d^d>>>15,1|d);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296},p=()=>Math.sqrt(-2*Math.log(1-f()))*Math.cos(6.2832*f()),m=e=>{let t=u.get(e);return t||u.set(e,t={mx:0,my:0,qx:0,qy:0,qvx:0,qvy:0,ux:0,uy:0,uvx:0,uvy:0,ang:0,ph:f()*6.2832,dir:f()<.5?-1:1,f:.7+f()*.6,pbx:null,pby:null,vbx:0,vby:0}),t},h=0,g=0;for(let n of e){let e=m(n);e.vbx=e.pbx==null?0:(n.x-e.pbx)/t,e.vby=e.pby==null?0:(n.y-e.pby)/t,e.pbx=n.x,e.pby=n.y,h+=n.x,g+=n.y}h/=e.length,g/=e.length;let _={brownian:1,jitter:1,levy:1,epicycle:1,rosette:1,lissajous:1},v=r.zoomFix?Math.min(4,Math.max(.25,r.baseZoom/Math.max(.05,l))):1,y={article:`brownian`,pdf:`brownian`,note:`rosette`,image:`epicycle`,video:`jitter`,link:`hub`,attachment:`hubBrown`},b=+r.wash;if(b>0){let n=[];for(let t of e){let e=u.get(t);Math.hypot(e.vbx,e.vby)>=120&&n.push(t)}let r=null;if(n.length&&n.length*e.length>4e3){r=new Map;for(let t of e){if(t.fx!=null)continue;let e=u.get(t),n=Math.floor((t.x+e.mx)/240)*65536+Math.floor((t.y+e.my)/240),i=r.get(n);i||r.set(n,i=[]),i.push(t)}}let i=(e,t,n,r)=>{if(n===e||n.fx!=null)return;let i=u.get(n),a=Math.hypot(n.x+i.mx-e.x-t.mx,n.y+i.my-e.y-t.my);if(a>240)return;let o=(1-a/240)*(1-a/240)*r;i.qvx+=(t.vbx-i.qvx)*o,i.qvy+=(t.vby-i.qvy)*o};for(let a of n){let n=u.get(a),o=Math.hypot(n.vbx,n.vby),s=Math.min(1,(o-120)/600)*b*2.2*t;if(!r){for(let t of e)i(a,n,t,s);continue}let c=Math.floor((a.x+n.mx)/240),l=Math.floor((a.y+n.my)/240);for(let e=-1;e<=1;e++)for(let t=-1;t<=1;t++){let o=r.get((c+e)*65536+l+t);if(o)for(let e of o)i(a,n,e,s)}}}let x=n.layer,S=n.toScreen;if(x&&S&&r.nudge>0){let n=420*r.nudge*t/l;for(let t of e){if(t.fx!=null)continue;let e=u.get(t),r=S(t.x+e.mx,t.y+e.my),i=x.slope(r.x,r.y);i&&(e.qvx-=i[0]*n,e.qvy-=i[1]*n)}}let C=+(r.touchSpring||40),w=2*Math.sqrt(C)*.85;for(let n of e){let e=u.get(n);e.qvx+=(-2.2*e.qx-2.6*e.qvx)*t,e.qvy+=(-2.2*e.qy-2.6*e.qvy)*t,e.qx+=e.qvx*t,e.qy+=e.qvy*t;let r=Math.hypot(e.qx,e.qy);r>90&&(e.qx*=90/r,e.qy*=90/r),e.tqx===void 0&&(e.tqx=e.tqy=e.tqvx=e.tqvy=0),e.tqvx+=(-C*e.tqx-w*e.tqvx)*t,e.tqvy+=(-C*e.tqy-w*e.tqvy)*t,e.tqx+=e.tqvx*t,e.tqy+=e.tqvy*t;let i=Math.hypot(e.tqx,e.tqy);i>300&&(e.tqx*=300/i,e.tqy*=300/i)}let T=(e,t,n,r)=>{let i=t*Math.sqrt(2*r*n);e.uvx+=(-n*e.ux-r*e.uvx)*o+i*c*p(),e.uvy+=(-n*e.uy-r*e.uvy)*o+i*c*p(),e.ux+=e.uvx*o,e.uy+=e.uvy*o},E=(e,t,n,r,i)=>{let a=e.x-n,s=e.y-r;t.ang+=i*o;let c=Math.cos(t.ang),l=Math.sin(t.ang);return[a*c-s*l-a,a*l+s*c-s]};for(let r of e){let e=u.get(r),c=0,l=0,d=n.hub?n.hub(r):null,p=d?m(d):null,b=i===`kind`?r.kind?y[r.kind]||`brownian`:`still`:i,x=_[b]?v:1;switch(b){case`brownian`:T(e,r.kind===`pdf`?9:14,r.kind===`pdf`?.6:1.2,1.6),c=e.ux,l=e.uy;break;case`jitter`:T(e,5,40,8),c=e.ux,l=e.uy;break;case`levy`:if(T(e,6,.8,1.4),f()<.18*o){let t=f()*6.2832,n=90+f()*120;e.uvx+=Math.cos(t)*n,e.uvy+=Math.sin(t)*n}c=e.ux,l=e.uy;break;case`epicycle`:{let t=1.4*e.f*e.dir*s+e.ph;c=16*Math.cos(t),l=16*Math.sin(t);break}case`rosette`:{let t=1.6*e.f*s+e.ph,n=.22*e.dir*s+e.ph,r=26*Math.cos(t),i=9*Math.sin(t);c=r*Math.cos(n)-i*Math.sin(n),l=r*Math.sin(n)+i*Math.cos(n);break}case`lissajous`:{let t=.55*e.f*s;c=22*Math.sin(3*t+e.ph),l=22*Math.sin(2*t);break}case`hub`:case`hubBrown`:if(d&&a>0){let t=Math.hypot(r.x-d.x,r.y-d.y),n=(b===`hub`?.8:.45)*a*(120/Math.max(t,50))**1.5*p.dir;[c,l]=E(r,e,d.x,d.y,n)}b===`hubBrown`&&(T(e,8,1.2,1.6),c+=e.ux*a,l+=e.uy*a),a>0&&(c/=a,l/=a);break;case`galaxy`:if(a>0){let t=Math.hypot(r.x-h,r.y-g),n=.3*a*(300/Math.max(t,80))**.8;[c,l]=E(r,e,h,g,n),c/=a,l/=a}break;case`breathe`:{let e=d?d.x:h,t=d?d.y:g,n=Math.hypot(r.x-e,r.y-t),i=.08*Math.sin(1.3*s-n/60);c=(r.x-e)*i,l=(r.y-t)*i;break}}c*=a*x,l*=a*x,c+=e.qx+e.tqx,l+=e.qy+e.tqy,r.fx!=null&&(c=l=0,e.qx=e.qy=e.qvx=e.qvy=e.tqx=e.tqy=e.tqvx=e.tqvy=0);let S=Math.min(1,t*6);e.mx+=(c-e.mx)*S,e.my+=(l-e.my)*S,Number.isFinite(e.mx)&&Number.isFinite(e.my)&&Number.isFinite(e.qvx)&&Number.isFinite(e.qvy)||Object.assign(e,{mx:0,my:0,qx:0,qy:0,qvx:0,qvy:0,tqx:0,tqy:0,tqvx:0,tqvy:0,ux:0,uy:0,uvx:0,uvy:0}),r.idleX=e.mx,r.idleY=e.my}this.z=d,r.noTouch&&this.separate(e,t,n)}separate(e,t,n){let i=this.o,a=this.S,o=2.5/(n.zoom||1),s=e.map(e=>a.get(e)),c=r.noTouch(e.map((e,t)=>e.x+s[t].mx),e.map((e,t)=>e.y+s[t].my),e.map(e=>(n.radius?n.radius(e):e.r||10)+o),e.map(e=>+(e.fx==null)),t,60*i.touchStrength,+i.touchFalloff);e.forEach((e,t)=>{let n=s[t];n.tqvx+=c.VX[t],n.tqvy+=c.VY[t];let r=c.SX[t],i=c.SY[t];(r||i)&&(n.tqx+=r,n.tqy+=i,n.mx+=r,n.my+=i),e.idleX=n.mx,e.idleY=n.my})}},r.EMBED_DEFAULTS=t,r.mount=function(e,t={}){let n=Object.assign({},r.EMBED_DEFAULTS,t.settings||{});for(let e of[`overlay`,`flock`,`columns`,`quality`,`fpsTarget`,`fpsCap`,`palette`,`see`])t[e]!=null&&(n[e]=t[e]);let i=window.matchMedia?.(`(prefers-reduced-motion: reduce)`),a=r.createGL(e,{alpha:!0}),o=r.Present(a),s=r.Lab()(a),c=null;try{c=r.Probe(a)}catch{c=null}let l=a.gl.getParameter(a.gl.MAX_TEXTURE_SIZE)||4096,u={},d=()=>{let e=!!i?.matches;Object.assign(u,n),u.orbitVar=e?-1:n.orbitVar==null?n.flock?0:-1:+n.orbitVar,u.rainbowVar=n.rainbowVar==null?n.overlay===`dye`?3:n.overlay===`halos`?4:n.overlay===`kinds`?10:-1:+n.rainbowVar,u.overlay=n.overlayStrength,e&&(u.simmer=0,u.lifeSpeed=Math.min(n.lifeSpeed,3),u.boil=0)};d();let f=r.palette(n.palette),p=0,m=0,h=0,g=0,_=0,v=48,y=!0,b=0,x=performance.now(),S=0,C=!1,w=-1e9,T=-1,E=new Map,D={W:1,H:1,C:1,R:1,cssRect:[0,0,1,1]},O=new Float32Array(r.MAXN*4),k=new Float32Array(r.MAXN*4),A=[],j=[],M=new Map,N=new Float32Array(r.MAXN*4),P=new Map,F=e=>{let t=e.color||e.kind&&(n.kindColors&&n.kindColors[e.kind]||r.KIND_COLORS[e.kind]);if(!t)return null;if(Array.isArray(t))return t;let i=P.get(t);return i===void 0&&(i=r.rgb(t),P.set(t,i)),i},I={full:1,high:.8,medium:.65,low:.5},L={scale:1,n:0,t0:0,low:0,high:0,hold:0,block:0,fps:0},R=e=>{if(L.t0===0){L.t0=e,L.n=0;return}L.n++;let t=e-L.t0;if(t<1e3)return;let r=L.fps=L.n*1e3/t;if(L.t0=e,L.n=0,n.quality!==`auto`||document.hidden){L.low=L.high=0;return}let i=+n.fpsTarget||30,a=n.fpsCap===`off`?1e9:+n.fpsCap;L.hold>0?L.hold--:r<i*1.05?(L.high=0,++L.low>=2&&L.scale>.5&&(L.scale=Math.max(.5,+(L.scale*.85).toFixed(3)),L.low=0,L.hold=2,e<L.block&&(L.block=e+2e4))):r>Math.min(i*1.5,a*.9)?(L.low=0,++L.high>=4&&L.scale<1&&e>=L.block&&(L.scale=Math.min(1,+(L.scale/.85).toFixed(3)),L.high=0,L.hold=2,L.block=e+3e3)):L.low=L.high=0},z=()=>{let t=e.clientWidth,r=e.clientHeight,i=window.devicePixelRatio||1;if(!t||!r){p=m=0;return}v=Math.max(48,Math.min(Math.floor(t*i),l,Math.floor(l*t/Math.max(1,r))));let a=n.columns===`auto`?Math.max(48,Math.min(+n.autoMax||200,v,Math.round(t/Math.max(1,+n.pitch||4.5)))):Math.max(1,Math.min(n.columns,v)),c=Math.round(a)/Math.max(1,t),u=Math.max(Math.min(2,i,Math.sqrt(35e5/Math.max(1,t*r))),Math.min(i,c)),d=n.quality===`auto`?L.scale:I[n.quality]||1,f=Math.max(Math.min(u,1),Math.min(u,c),u*d);if(!y&&t===p&&r===m&&f===_)return;p=t,m=r,_=f,y=!1,e.width=Math.max(1,Math.round(p*_)),e.height=Math.max(1,Math.round(m*_));let b=Math.round(a),x=Math.max(8,Math.round(a*m/Math.max(p,1)));(b!==h||x!==g)&&(h=b,g=x,o.resize(h,g),s.resize(h,g)),Object.assign(D,{W:p,H:m,C:h,R:g,cssRect:[0,0,p,m]})},B=window.ResizeObserver?new ResizeObserver(()=>{y=!0}):null;B&&B.observe(e);let V=(i,a=!1)=>{let l=n.fpsCap===`off`?0:+n.fpsCap,d=n.calmFps>0&&i-w>n.calmAfter;if(d&&(!l||l>n.calmFps)&&(l=+n.calmFps),W.calm=d,!a&&l&&i-S<1e3/l-3)return;S=i;let _=Math.max(.001,(i-x)/1e3),v=Math.min(.05,_);if(x=i,R(i),z(),!p||!m)return;r.view=D;let y=h/p,b=g/m,C=(t.nodes?t.nodes():[])||[],P=Math.exp(-v*1.6),I=0,L=0;A.length=0;for(let e=0;e<C.length;e++){let t=C[e],r=t.id==null?e:t.id,a=E.get(r);if(!(Number.isFinite(t.x)&&Number.isFinite(t.y)))continue;let o=0,s=0;a&&_<.25&&(o=(t.x-a.x)/_,s=(t.y-a.y)/_),Number.isFinite(t.vx)&&Number.isFinite(t.vy)&&(o=t.vx,s=t.vy);{let e=Math.hypot(o,s);e>6e3&&(o*=6e3/e,s*=6e3/e)}let c=a?a.vx+(o-a.vx)*.55:0,l=a?a.vy+(s-a.vy)*.55:0,d=Math.hypot(c,l);d>L&&(L=d);let f=Math.min(1,d/n.hotSpeed),p=a&&a.heat>f?a.heat*P:f;a?(a.x=t.x,a.y=t.y,a.vx=c,a.vy=l,a.heat=p,a.seen=i):E.set(r,{x:t.x,y:t.y,vx:c,vy:l,heat:p,seen:i});let v=t.r>0?t.r:10,x=t.x*y,S=(m-t.y)*b,w=v*y;if(x<-w*2||S<-w*2||x>h+w*2||S>g+w*2)continue;let T=c*y,D=-l*b,O=Math.hypot(c,l)/n.hotSpeed;A.push({key:r,gx:x,gy:S,gvx:T,gvy:D,gr:w,sp:O,col:u.rainbowVar===10?F(t):null,spread:t.dyeSpread>0?+t.dyeSpread:1,s:4*Math.min(1,O)+2*p+Math.min(v,40)/400+(M.has(r)?.15:0)})}let B=A;if(A.length>r.MAXN){B=A.slice().sort((e,t)=>t.s-e.s).slice(0,r.MAXN);let e=new Set(B.map(e=>e.key)),t=[];for(let n=0;n<r.MAXN;n++){let r=j[n];r!==void 0&&e.has(r)||(r!==void 0&&M.delete(r),j[n]=void 0,t.push(n))}for(let e of B)if(!M.has(e.key)){let n=t.shift();j[n]=e.key,M.set(e.key,n)}let n=Array(r.MAXN);for(let e of B)n[M.get(e.key)]=e;B=n}else M.size&&(M.clear(),j.length=0);for(let e of B)e&&(O.set([e.gx,e.gy,e.gvx,e.gvy],I*4),k.set([e.gx-e.gvx*v,e.gy-e.gvy*v,e.gr,e.sp],I*4),e.col?N.set([e.col[0],e.col[1],e.col[2],e.spread],I*4):N.fill(0,I*4,I*4+4),I++);if((L>n.calmSpeed||C.length!==T)&&(w=i),T=C.length,W.fastest=L,E.size>C.length*2+64)for(let[e,t]of E)i-t.seen>2e3&&E.delete(e);let V={uNodeA:O,uNodeB:k,uNodeC:N,uNodeCount:{i:I},uPal:{v3:f},grid:[h,g]},H=s.step(v,i/1e3,V,null,u);c&&n.probe&&H&&H.color&&c.tick(H.color,h,g),o.draw(H,n,[0,0,e.width,e.height]),t.onFrame&&t.onFrame(v)},H=e=>{C&&(b=requestAnimationFrame(H),V(e))},U=(e,t)=>{e=Math.min(1,Math.max(0,e))*5;let n=Math.min(Math.floor(e),4),r=e-n,i=r*r*(3-2*r),a=e=>Math.round(255*(f[n*3+e]+(f[n*3+3+e]-f[n*3+e])*i));return`rgba(${a(0)},${a(1)},${a(2)},${t??1})`},W={start(){return C||(C=!0,x=performance.now(),b=requestAnimationFrame(H)),W},stop(){return C=!1,cancelAnimationFrame(b),W},set(e){let t=`columns`in e||`quality`in e||`pitch`in e||`autoMax`in e;return Object.assign(n,e),`palette`in e&&(f=r.palette(n.palette)),d(),t&&(y=!0),W},drawStill(){d(),V(performance.now(),!0)},get settings(){return Object.assign({},n)},get active(){return{lifeVar:+u.lifeVar,orbitVar:u.orbitVar,rainbowVar:u.rainbowVar}},get grid(){return{columns:h,rows:g}},get columnsMax(){return v},get fps(){return L.fps},get scale(){return n.quality===`auto`?L.scale:I[n.quality]||1},heat(e){let t=E.get(e);return t?t.heat:0},heatColor:U,drawHeatRing(e,t,n,r,i){let a=W.heat(t);if(a<=.04)return;let o=Math.min(1,(a-.04)/.3),s=.25+.75*a;e.save(),e.lineWidth=1.6+1.6*a,e.strokeStyle=U(s,o),e.shadowColor=U(s,1),e.shadowBlur=6+16*a,e.beginPath(),e.arc(n,r,i+.5,0,6.2832),e.stroke(),e.restore()},slope(e,t){if(!c||!c.data||!p)return null;let n=c.slope(e/p*c.w,(m-t)/m*c.h);return n?[n[0],-n[1]]:null},destroy(e=!0){W.stop(),B&&B.disconnect(),e&&a.gl.getExtension(`WEBGL_lose_context`)?.loseContext()}};return W};var i=r.mount,a=r.Idle,o=class{scene;settings;idle;proxies=new Map;hubs=new Map;graph;previous=new Map;lastStep=0;selected=null;waves=[];awake=!1;timer=0;layer=null;constructor(e,t){this.scene=e,this.settings=t,this.idle=new a({}),this.configure(t)}configure(e){this.settings=e;let{idle:t,amp:n,speed:r,wash:i,nudge:a,zoomFix:o,noTouch:s,touchStrength:c,touchFalloff:l}=e;this.idle.set({motion:t,amp:n,speed:r,wash:i,nudge:a,zoomFix:o,noTouch:s,touchStrength:c,touchFalloff:l}),this.scene.invalidate()}offset(e){return this.awake&&!this.scene.pixelPaused?this.proxies.get(e):void 0}updateGraph(e){if(this.graph===e)return;this.graph=e;let t=new Map(e.nodes.map(e=>[e.id,e]));this.hubs.clear();for(let{a:n,b:r}of e.edges)!t.get(n)?.item&&t.get(r)?.item&&!this.hubs.has(r)?this.hubs.set(r,n):!t.get(r)?.item&&t.get(n)?.item&&!this.hubs.has(n)&&this.hubs.set(n,r);for(let e of this.proxies.keys())t.has(e)||this.proxies.delete(e);for(let e of this.previous.keys())t.has(e)||this.previous.delete(e);this.waves=this.waves.filter(e=>t.has(e.node.id))}step(e){let t=this.scene,n=this.settings;if(clearTimeout(this.timer),this.timer=0,!t.graph)return;if(this.updateGraph(t.graph),this.awake=!t.pixelPaused&&(n.idle!==`still`||n.noTouch),!this.awake){this.lastStep=0,this.selected=t.selected,this.waves.length=0;return}let{width:r,height:i}=t.pixelViewport,a=t.camera.z,o=[];for(let e of t.graph.nodes){let n=t.bodies.get(e.id);if(!n)continue;let{x:s,y:c}=t.projectRest(n);if(s<-200||s>r+200||c<-200||c>i+200)continue;let l=this.proxies.get(e.id);l||(l={id:e.id,x:0,y:0,fx:null,radius:0,idleX:0,idleY:0},this.proxies.set(e.id,l)),l.x=n.x,l.y=n.y,l.fx=t.pixelHeld===e.id||n.fx!=null?n.x:null,l.kind=e.item?.kind,l.radius=t.radius(e)/a,o.push(l)}if(!o.length||o.length>n.idleMax){this.lastStep=0;return}let s=this.lastStep?Math.max(0,Math.min(.05,(e-this.lastStep)/1e3)):1/60;if(this.lastStep=e,this.selected!==t.selected){this.selected=t.selected;let r=this.selected&&t.bodies.get(this.selected);if(r&&n.ripple>0)for(let t of o){let i=t.x-r.x,a=t.y-r.y,o=Math.hypot(i,a);if(o<1||o>520)continue;let s=n.ripple*140*(1-o/520)/o;this.waves.push({node:t,time:e+o/.7,vx:i*s,vy:a*s})}}this.waves=this.waves.filter(t=>e<t.time||(t.node.fx??this.idle.kick(t.node,t.vx,t.vy),!1)),this.idle.step(o,s,{zoom:a,layer:this.layer,hub:e=>this.proxies.get(this.hubs.get(e.id)??``),toScreen:(e,n)=>t.projectRest({x:e,y:n}),radius:e=>e.radius}),n.idleFps===0?t.invalidate():this.timer=window.setTimeout(t.invalidate,Math.max(0,1e3/n.idleFps-5))}nodes(){let e=this.scene;if(!e.graph)return[];let{width:t,height:r}=e.pixelViewport,i=performance.now(),a=[];for(let o of e.graph.nodes){let s=e.bodies.get(o.id);if(!s)continue;let{x:c,y:l}=e.project(s),u=e.radius(o);if(c<-u-40||l<-u-40||c>t+u+40||l>r+u+40)continue;let d=o.item?.kind,f=d?e.settings.kindColors[d]:this.settings.tagDye&&o.tag?n(o.tag,e.settings.tagColors):void 0,p={id:o.id,x:c,y:l,r:u,kind:d,color:f,dyeSpread:d?1:3};if(!this.settings.stirPan){let t=this.offset(o.id),n=s.x+(t?.idleX??0),r=s.y+(t?.idleY??0),a=this.previous.get(o.id),c=a?(i-a.time)/1e3:0;p.vx=a&&c>0&&c<.25?(n-a.x)*e.camera.z/c:0,p.vy=a&&c>0&&c<.25?(r-a.y)*e.camera.z/c:0,this.previous.set(o.id,{x:n,y:r,time:i})}a.push(p)}return a}ringPadding(e){if(!this.layer||!this.settings.heatRings||this.scene.pixelPaused)return 0;let t=this.layer.heat(e);return t<=.04?0:Math.ceil(1.5*(6+16*t)+4)}paintRings(e,t,n){if(!this.layer||!this.settings.heatRings||this.scene.pixelPaused)return;let r=!1;for(let i of t){if(this.layer.heat(i.id)<=.04)continue;let t=n.get(i.id);this.layer.drawHeatRing(e,i.id,t.x,t.y,this.scene.radius(i)),r=!0}r&&!this.timer&&(this.timer=window.setTimeout(this.scene.invalidate,33))}destroy(){clearTimeout(this.timer),this.proxies.clear(),this.previous.clear(),this.waves.length=0,this.layer=null}};function s({host:e,scene:t},n,r){let a=document.createElement(`canvas`);a.className=`pl-medium`,a.setAttribute(`aria-hidden`,`true`),a.style.cssText=`position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none`,e.prepend(a);let s=t?new o(t,n):null;t&&(t.pixelMotion=s);let c=window.matchMedia?.(`(prefers-reduced-motion: reduce)`),l=null,u=!1;function d(){return{...n,columns:n.autoColumns?`auto`:n.columns,fpsCap:n.fpsCap===0?`off`:n.fpsCap,see:n.blend===`see`,rawPixels:r.view===`raw`,halo:r.glow?n.halo:0,bloom:r.glow?n.bloom:0}}function f(){a.style.opacity=String(n.opacity),a.style.mixBlendMode=n.blend===`see`?`normal`:n.blend}function p(){l&&!u&&(document.hidden?l.stop():c?.matches?(l.stop(),l.drawStill()):(l.set({}),l.start()),t?.invalidate())}function m(){try{typeof WebGL2RenderingContext<`u`&&(l=i(a,{nodes:()=>s?.nodes()??[],settings:d()}))}catch{l=null;try{a.getContext(`webgl2`)?.getExtension?.(`WEBGL_lose_context`)?.loseContext()}catch{}}e.dataset.pixelRenderer=l?`ready`:`unavailable`,s&&(s.layer=l),p()}function h(t){t.preventDefault(),u=!0,l?.stop(),s&&(s.layer=null),e.dataset.pixelRenderer=`unavailable`}function g(){l?.destroy(!1),l=null,u=!1,m()}function _(){c?.matches&&!document.hidden&&!u&&l?.drawStill()}f(),m();let v=typeof ResizeObserver<`u`?new ResizeObserver(_):null;return v?.observe(a),document.addEventListener(`visibilitychange`,p),c?.addEventListener(`change`,p),a.addEventListener(`webglcontextlost`,h),a.addEventListener(`webglcontextrestored`,g),{configure(e,t){n=e,r=t,f(),s?.configure(e),l?.set(d()),_()},destroy(){v?.disconnect(),document.removeEventListener(`visibilitychange`,p),c?.removeEventListener(`change`,p),a.removeEventListener(`webglcontextlost`,h),a.removeEventListener(`webglcontextrestored`,g),s?.destroy(),t&&(t.pixelMotion=null),l?.destroy(),a.remove(),delete e.dataset.pixelRenderer}}}export{s as createPixelSurface};