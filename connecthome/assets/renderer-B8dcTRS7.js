import{Sampler as e,TRANSITION_END as t,TRANSITION_START as n,Universe as r}from"./core-CGfFiYC0.js";import{d as i,i as a,n as o,r as s,u as c}from"./index-ZFk1C19l.js";var l=`#version 300 es
precision highp float;
uniform vec4 camera;
uniform vec4 rawCamera;
out vec2 vPosition;
out vec2 vRawPosition;
void main() {
  vec2 position = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
  vec2 pos = vec2(position.x, 1.0 - position.y);
  vPosition = mix(camera.xy, camera.zw, pos);
  vRawPosition = mix(rawCamera.xy, rawCamera.zw, pos);
}`,u=`#version 300 es
precision highp float;
precision highp int;
precision highp usampler2D;
precision highp sampler2D;
const ivec2 GRAPH_TEX_LOG_SIZE = ivec2(10, 11);
const ivec2 TILES_TEX_LOG_SIZE = ivec2(7, 5);
const ivec2 GRAPH_TEX_SIZE = ivec2(1024, 2048);
const ivec2 TILES_TEX_SIZE = ivec2(128, 32);
const int OFFSET_FOR_EACH_LEVEL[10] = int[10](0, 0, 0, 0, 43566, 102445, 191663, 326396, 581726, 1009870);
uniform vec2 resolution;
uniform highp usampler2D graph;
uniform highp usampler2D tiles;
uniform highp usampler2D topTiles;
uniform vec4 camera;
uniform vec4 rawCamera;
uniform bool preRendering;
uniform sampler2D prerenderedTopTiles;
uniform float transition;
uniform float heat;
in vec2 vPosition;
in vec2 vRawPosition;
out vec4 oColor;

highp uvec4 fetchPixelIndex(highp usampler2D tex, ivec2 size, ivec2 logSize, int index) {
  return texelFetch(tex, ivec2(index & (size.x - 1), index >> logSize.x), 0);
}
highp uvec4 getNode(int level, int index) {
  int pixelIndex = index + OFFSET_FOR_EACH_LEVEL[level];
  return fetchPixelIndex(graph, GRAPH_TEX_SIZE, GRAPH_TEX_LOG_SIZE, pixelIndex);
}
int sampleBitLevel9(int index, ivec2 pos) {
  int level = 9;
  for (int iter = 0; iter < 7; iter++) {
    int size = 1 << (level - 1);
    highp uvec4 node = getNode(level, index);
    highp ivec4 children = ivec4(int(node.r & 0xffffffu), int(node.g & 0xffffffu), int(node.b), int(node.a));
    if (pos.y < size) {
      if (pos.x < size) index = children[0];
      else { index = children[1]; pos.x -= size; }
    } else {
      pos.y -= size;
      if (pos.x < size) index = children[2];
      else { index = children[3]; pos.x -= size; }
    }
    level--;
  }
  int bitIndex = 15 ^ ((pos.y << 2) | pos.x);
  return (index >> bitIndex) & 1;
}
int popcount16(int i) {
  i = (i & 0x5555) + ((i >> 1) & 0x5555);
  i = (i & 0x3333) + ((i >> 2) & 0x3333);
  i = (i & 0x0f0f) + ((i >> 4) & 0x0f0f);
  return (i & 0x00ff) + (i >> 8);
}
int popcount4(int i) {
  i = (i & 5) + ((i >> 1) & 5);
  return (i & 3) + (i >> 2);
}
float linearstep(float edge0, float edge1, float t) {
  return clamp((t - edge0) / (edge1 - edge0), 0.0, 1.0);
}
float correctDensity(float rawDensity, int level, float cellState) {
  float zero = 0.002;
  float one = 0.005;
  float t = smoothstep(0.5, 1.0, float(level) / 9.0);
  float v1 = linearstep(zero, one, rawDensity);
  float v2 = linearstep(pow(zero, cellState * 2.0), pow(one, cellState * 2.0), rawDensity);
  return mix(v1, v2, t);
}
float sampleBitLevel9(int index, ivec2 pos, float res, float cellState) {
  int level = 9;
  float invArea = 1.0 / (512.0 * 512.0);
  float prevValue = 0.0;
  float pixelSize = 1.0;
  for (int iter = 0; iter < 7; iter++) {
    int size = 1 << (level - 1);
    highp uvec4 node = getNode(level, index);
    highp ivec4 children = ivec4(int(node.r & 0xffffffu), int(node.g & 0xffffffu), int(node.b), int(node.a));
    highp uint population = (node.r >> 24) | ((node.g >> 24) << 8);
    float density = float(population) * invArea;
    float value = population == 0u ? 0.0 : correctDensity(density, level, cellState);
    if (iter == 0) prevValue = value;
    if (res <= pixelSize) {
      float t = (pixelSize - res) / res;
      return value + t * (prevValue - value);
    }
    // An empty subtree contributes no density at finer sampling levels.
    if (population == 0u) return 0.0;
    prevValue = value;
    if (pos.y < size) {
      if (pos.x < size) index = children[0];
      else { index = children[1]; pos.x -= size; }
    } else {
      pos.y -= size;
      if (pos.x < size) index = children[2];
      else { index = children[3]; pos.x -= size; }
    }
    level--;
    res *= 0.5;
    invArea *= 4.0;
  }
  {
    float density = float(popcount16(index)) * invArea;
    float value = correctDensity(density, level, cellState);
    if (res <= pixelSize) {
      float t = (pixelSize - res) / res;
      return value + t * (prevValue - value);
    }
    prevValue = value;
  }
  if (pos.y < 2) {
    if (pos.x < 2) index = ((index >> 0xa) & 3) | (((index >> 0xe) & 3) << 2);
    else { index = ((index >> 0x8) & 3) | (((index >> 0xc) & 3) << 2); pos.x -= 2; }
  } else {
    pos.y -= 2;
    if (pos.x < 2) index = ((index >> 0x2) & 3) | (((index >> 0x6) & 3) << 2);
    else { index = ((index >> 0x0) & 3) | (((index >> 0x4) & 3) << 2); pos.x -= 2; }
  }
  res *= 0.5;
  invArea *= 4.0;
  {
    float density = float(popcount4(index)) * invArea;
    float value = correctDensity(density, level, cellState);
    if (res <= pixelSize) {
      float t = (pixelSize - res) / res;
      return value + t * (prevValue - value);
    }
    prevValue = value;
  }
  res *= 0.5;
  float value = float((index >> (3 ^ (pos.y << 1) ^ pos.x)) & 1);
  if (res <= pixelSize) {
    float t = (pixelSize - res) / res;
    return value + t * (prevValue - value);
  }
  return value;
}
int getTileNodeIndex(int frameIndexId, ivec2 pos, int pattern) {
  int offset = 1024 * 16 * frameIndexId;
  int rawIndex = offset | (((pos.y << 2) | pos.x) << 10) | pattern;
  int pixelIndex = rawIndex >> 2;
  int pixelOffset = rawIndex & 3;
  return int(fetchPixelIndex(tiles, TILES_TEX_SIZE, TILES_TEX_LOG_SIZE, pixelIndex)[pixelOffset]);
}
int fetchTile(ivec2 index, int channel) {
  if (index.x < 0 || index.x >= 16 || index.y < 0 || index.y >= 16) return -1;
  return int(texelFetch(topTiles, index, 0)[channel]);
}
ivec2 samplePixel(ivec2 pixCoord, ivec2 offset) {
  pixCoord += offset;
  pixCoord = ivec2(pixCoord.x, textureSize(prerenderedTopTiles, 0).y - 1 - pixCoord.y);
  return ivec2(texelFetch(prerenderedTopTiles, pixCoord, 0).xy);
}
int samplePattern(ivec2 pixCoord) {
  ivec2 center = samplePixel(pixCoord, ivec2(0));
  int bit = samplePixel(pixCoord, ivec2(-1, -1)).x;
  bit |= samplePixel(pixCoord, ivec2(0, -1)).x << 1;
  bit |= samplePixel(pixCoord, ivec2(1, -1)).x << 2;
  bit |= samplePixel(pixCoord, ivec2(-1, 0)).x << 3;
  bit |= center.x << 4;
  bit |= samplePixel(pixCoord, ivec2(1, 0)).x << 5;
  bit |= samplePixel(pixCoord, ivec2(-1, 1)).x << 6;
  bit |= samplePixel(pixCoord, ivec2(0, 1)).x << 7;
  bit |= samplePixel(pixCoord, ivec2(1, 1)).x << 8;
  bit |= center.y << 9;
  bit ^= ((bit >> 4) & 1) << 9;
  return bit;
}
vec3 colorAt(vec2 pos) {
  float twopi = 2.0 * 3.141592653589793;
  vec2 p = fract(pos) * 2.0 - 1.0;
  vec2 s = sign(p) * pow(abs(p), 2.0 - (p * p).yx) * 0.5;
  float ang = 1.0 + dot(s, vec2(1.0)) * twopi;
  float amp = 0.35 - cos(ang) * 0.05;
  return (1.0 - amp) + amp * cos(ang + vec3(twopi / 3.0, -twopi / 3.0, 0.0));
}
void main() {
  float outerRes = resolution.x / (camera.z - camera.x);
  float innerRes = outerRes / 2048.0;
  vec2 tileCoord = vPosition * 4.0;
  if (preRendering) {
    ivec2 tileIndex = ivec2(floor(tileCoord));
    ivec2 insideTileIndex = ivec2(fract(tileCoord) * 512.0);
    int index = fetchTile(tileIndex, 0);
    int pindex = fetchTile(tileIndex, 1);
    int pop = sampleBitLevel9(index, insideTileIndex);
    int ppop = sampleBitLevel9(pindex, insideTileIndex);
    oColor = vec4(float(pop), float(ppop), 0.0, 1.0);
  } else {
    int outerPattern = samplePattern(ivec2(tileCoord * 512.0));
    vec2 insidePixelCoord = fract(tileCoord * 512.0) * 4.0;
    ivec2 innerTileIndex = ivec2(insidePixelCoord);
    float cellState = mix(float(((outerPattern >> 9) ^ (outerPattern >> 4)) & 1), float((outerPattern >> 4) & 1), transition);
    int level9Index = getTileNodeIndex(0, innerTileIndex, outerPattern);
    float pop = sampleBitLevel9(level9Index, ivec2(fract(insidePixelCoord) * 512.0), innerRes * 0.25, cellState);
    if (pop == 0.0) { oColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
    vec3 color1 = colorAt(fract(vRawPosition));
    vec3 color2 = colorAt(fract(vRawPosition * 2048.0));
    float colorCoeff = pow(linearstep(log(2.0), log(4096.0), log(innerRes)), 2.0);
    vec3 color = mix(color1, color2, colorCoeff);
    vec3 heatColor = heat > 0.0 ? vec3(heat, heat * 0.3, heat * -0.1) : vec3(heat * 0.2, heat * -0.2, heat * -1.0);
    vec3 colorWithHeat = (color / max(color.x, max(color.y, color.z)) + heatColor) / (heat >= 0.0 ? 1.0 + heat : 1.0 - heat * 4.0);
    oColor = vec4(colorWithHeat * pop, 1.0);
  }
}`;function d(e,t,n){return{columns:n,rows:Math.max(1,Math.round(n*t/e))}}var f=`#version 300 es
out vec2 uv;
void main() {
  uv = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
}`,p=`#version 300 es
precision highp float;
precision highp int;
in vec2 uv;
out vec4 color;
uniform sampler2D source;
uniform sampler2D bloom;
uniform bool presenting, led, glow;
uniform vec2 grid, displayPixels, axis;
uniform float centerWeight;
uniform int tapCount;
uniform vec2 taps[8];

// Each emitter's halo ends before the next dot's center. Only the four
// surrounding centers can light this point in the gap.
vec3 ledHalo(vec2 p, vec2 pitchInCells) {
  vec2 centers = p - 0.5;
  ivec2 first = ivec2(floor(centers));
  vec2 offset = fract(centers);
  vec3 light = vec3(0.0);
  for (int y = 0; y <= 1; ++y) {
    for (int x = 0; x <= 1; ++x) {
      ivec2 stepCell = ivec2(x, y);
      ivec2 emitter = first + stepCell;
      if (any(lessThan(emitter, ivec2(0))) || any(greaterThanEqual(emitter, ivec2(grid)))) continue;
      float distance = length((offset - vec2(stepCell)) * pitchInCells);
      float falloff = 1.0 - smoothstep(0.4, 0.9, distance);
      light += texelFetch(source, emitter, 0).rgb * (0.14 * falloff * falloff);
    }
  }
  return light;
}

void main() {
  if (!presenting) {
    vec3 sum = texture(source, uv).rgb * centerWeight;
    for (int i = 0; i < 8; ++i) {
      if (i >= tapCount) break;
      vec2 stepUV = axis * taps[i].x;
      sum += (texture(source, uv - stepUV).rgb
            + texture(source, uv + stepUV).rgb) * taps[i].y;
    }
    color = vec4(sum, 1.0);
    return;
  }
  vec2 p = uv * grid;
  vec3 cell = texelFetch(source, ivec2(floor(p)), 0).rgb;
  if (led) {
    vec2 pitch = displayPixels / grid;
    float diameter = min(pitch.x, pitch.y);
    float distancePx = length((fract(p) - 0.5) * pitch);
    float coverage = clamp(0.4 * diameter - distancePx + 0.5, 0.0, 1.0);
    // At subpixel pitches a display pixel integrates the aperture's area.
    coverage = mix(0.502655, coverage, smoothstep(1.0, 2.0, diameter));
    vec3 face = any(greaterThan(cell, vec3(0.0))) ? cell : vec3(22.0, 19.0, 29.0) / 255.0;
    vec3 halo = vec3(0.0);
    if (glow && coverage < 1.0) halo = ledHalo(p, pitch / diameter);
    cell = mix(halo, face, coverage);
  } else if (glow) {
    vec3 light = texture(bloom, uv).rgb * 0.75;
    cell += (1.0 - cell) * light;
  }
  color = vec4(cell, 1.0);
}`;function m(e){let t=new Float32Array(16),n=Math.min(16,Math.ceil(3*e)),r=1,i=0,a=t=>Math.exp(-.5*(t/e)**2);for(let e=1;e<=n;e+=2){let o=a(e),s=e<n?a(e+1):0,c=o+s;if(c<1e-8)break;t[i*2]=e+s/c,t[i*2+1]=c,r+=2*c,i++}for(let e=0;e<i;e++)t[e*2+1]/=r;return{taps:t,count:i,center:1/r}}var h=[`source`,`bloom`,`presenting`,`led`,`glow`,`grid`,`displayPixels`,`axis`,`centerWeight`,`tapCount`,`taps[0]`];function g(e,t){let n=Object.fromEntries(h.map(n=>[n,e.getUniformLocation(t,n)])),r=[],i=[],a=()=>{r.forEach(t=>e.deleteTexture(t)),i.forEach(t=>e.deleteFramebuffer(t)),e.deleteProgram(t)},o=e.getParameter(e.MAX_TEXTURE_SIZE);try{e.activeTexture(e.TEXTURE4);for(let t=0;t<=2;t++){let t=e.createTexture(),n=e.createFramebuffer();if(t&&r.push(t),n&&i.push(n),!t||!n)throw Error(`Life matrix target allocation failed.`);e.bindTexture(e.TEXTURE_2D,t),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.bindFramebuffer(e.FRAMEBUFFER,n),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0)}e.bindFramebuffer(e.FRAMEBUFFER,null),e.useProgram(t),e.uniform1i(n.source,4),e.uniform1i(n.bloom,5)}catch(e){throw a(),e}let s=0,c=0,l=0,u=0,f=0,p=0,g,_;function v(t,n,a){if(e.bindTexture(e.TEXTURE_2D,r[t]),e.texImage2D(e.TEXTURE_2D,0,e.RGBA8,n,a,0,e.RGBA,e.UNSIGNED_BYTE,null),e.bindFramebuffer(e.FRAMEBUFFER,i[t]),e.checkFramebufferStatus(e.FRAMEBUFFER)!==e.FRAMEBUFFER_COMPLETE)throw Error(`Life matrix framebuffer unavailable.`)}function y(t,n,r){let i=d(t,n,r);if(i.columns>o||i.rows>o)throw Error(`Life matrix exceeds this renderer’s texture capacity.`);e.activeTexture(e.TEXTURE4),(i.columns!==l||i.rows!==u)&&v(0,i.columns,i.rows),l=i.columns,u=i.rows,s=t,c=n;let a=Math.max(2,.8*s/l);g=m(a*l/s),_=m(a*u/c)}function b(t,a,o,s,c){e.bindFramebuffer(e.FRAMEBUFFER,i[a]),e.bindTexture(e.TEXTURE_2D,r[t]),e.uniform2f(n.axis,s,c),e.uniform1f(n.centerWeight,o.center),e.uniform1i(n.tapCount,o.count),e.uniform2fv(n[`taps[0]`],o.taps),e.drawArrays(e.TRIANGLES,0,3)}return{get columns(){return l},get rows(){return u},begin(t,n,r){(t!==s||n!==c||r!==l)&&y(t,n,r),e.bindFramebuffer(e.FRAMEBUFFER,i[0]),e.viewport(0,0,l,u)},present(i,a,o){e.useProgram(t);let s=o.view===`raw`&&o.glow;s&&(e.activeTexture(e.TEXTURE5),e.bindTexture(e.TEXTURE_2D,r[0]),e.activeTexture(e.TEXTURE4),(f!==l||p!==u)&&(v(1,l,u),v(2,l,u),f=l,p=u),e.viewport(0,0,l,u),e.uniform1i(n.presenting,0),b(0,1,g,1/l,0),b(1,2,_,0,1/u)),e.bindFramebuffer(e.FRAMEBUFFER,null),e.activeTexture(e.TEXTURE4),e.bindTexture(e.TEXTURE_2D,r[0]),e.activeTexture(e.TEXTURE5),e.bindTexture(e.TEXTURE_2D,r[s?2:0]),e.viewport(0,0,i,a),e.uniform1i(n.presenting,1),e.uniform1i(n.led,+(o.view===`led`)),e.uniform1i(n.glow,+!!o.glow),e.uniform2f(n.grid,l,u),e.uniform2f(n.displayPixels,i,a),e.drawArrays(e.TRIANGLES,0,3)},dispose:a}}var _=1024,v=2048,y=128,b=32,x=[43566,58879,89218,134733,255330,428144,477174],S=60,C=Math.exp(a/S),w=o/S,T=600;function E(e,t,n){let r=e.createShader(t);if(!r)throw Error(`Life shader allocation failed.`);if(e.shaderSource(r,n),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS)){let t=e.getShaderInfoLog(r);throw e.deleteShader(r),Error(`Life shader compilation failed: ${t||`unsupported renderer`}`)}return r}function D(e,t,n){let r=E(e,e.VERTEX_SHADER,t),i=null,a=null;try{if(i=E(e,e.FRAGMENT_SHADER,n),a=e.createProgram(),!a)throw Error(`Life program allocation failed.`);if(e.attachShader(a,r),e.attachShader(a,i),e.linkProgram(a),!e.getProgramParameter(a,e.LINK_STATUS))throw Error(`Life program link failed: ${e.getProgramInfoLog(a)||``}`);return a}catch(t){throw a&&e.deleteProgram(a),t}finally{e.deleteShader(r),i&&e.deleteShader(i)}}function O(e){let t=new Uint32Array(_*v*4);for(let t=0;t<x.length;t++)if(e.numNodesOfLevel(t+3)!==x[t])throw Error(`Life graph does not match the pinned shader data.`);return e.writeGraphTexturePixels(t),t}function k(e,t){let n=D(e,l,u),r=[],i=null,a=null;try{if(e.useProgram(n),i=e.createVertexArray(),a=e.createFramebuffer(),!i||!a)throw Error(`Life renderer allocation failed.`);let o=(t,i,a,o,s)=>{let c=e.createTexture();if(!c)throw Error(`Life texture allocation failed.`);return r.push(c),e.activeTexture(e.TEXTURE0+t),e.bindTexture(e.TEXTURE_2D,c),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),t===3?e.texImage2D(e.TEXTURE_2D,0,e.RG8,1,1,0,e.RG,e.UNSIGNED_BYTE,null):e.texImage2D(e.TEXTURE_2D,0,e.RGBA32UI,a,o,0,e.RGBA_INTEGER,e.UNSIGNED_INT,s),e.uniform1i(e.getUniformLocation(n,i),t),c},s=o(0,`graph`,_,v,O(t.graph)),c=o(1,`tiles`,y,b,null),l=o(2,`topTiles`,16,16,new Uint32Array(1024)),u=o(3,`prerenderedTopTiles`,1,1,null),d=e.createTexture();if(!d)throw Error(`Life placeholder texture allocation failed.`);r.push(d),e.bindTexture(e.TEXTURE_2D,d),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texImage2D(e.TEXTURE_2D,0,e.RG8,1,1,0,e.RG,e.UNSIGNED_BYTE,new Uint8Array([0,0]));let m=Object.fromEntries([`resolution`,`camera`,`rawCamera`,`preRendering`,`transition`,`heat`].map(t=>[t,e.getUniformLocation(n,t)]));if(e.disable(e.DEPTH_TEST),e.disable(e.CULL_FACE),e.disable(e.BLEND),e.disable(e.DITHER),e.bindVertexArray(i),e.uniform1f(m.heat,0),e.getError()!==e.NO_ERROR)throw Error(`Life textures are unsupported on this renderer.`);let h=g(e,D(e,f,p));return{program:n,vao:i,graph:s,tiles:c,topTiles:l,preRendered:u,blank:d,framebuffer:a,uniforms:m,matrix:h,preWidth:0,preHeight:0,lastFrame:-1,lastTopTiles:new Uint32Array(1024).fill(4294967295)}}catch(t){throw r.forEach(t=>e.deleteTexture(t)),a&&e.deleteFramebuffer(a),i&&e.deleteVertexArray(i),e.deleteProgram(n),t}}function A(e,t){t.matrix.dispose();for(let n of[t.graph,t.tiles,t.topTiles,t.preRendered,t.blank])e.deleteTexture(n);e.deleteFramebuffer(t.framebuffer),e.deleteVertexArray(t.vao),e.deleteProgram(t.program)}function j(a,o){let l=a.getContext(`webgl2`,{alpha:!1,antialias:!1,depth:!1,stencil:!1,preserveDrawingBuffer:!1,powerPreference:`low-power`});if(!l)return null;let u=k(l,o),d=!1,f=null,p=0,m=0,h=0,g=0,_=null,v=0,x=0,E=new Uint32Array(16384),D=new Uint32Array(1024),O=l.getParameter(l.MAX_TEXTURE_SIZE),j=e=>{e.preventDefault(),u=null},M=()=>{if(!d)try{u=k(l,o),!document.hidden&&_&&N.render(..._)}catch{u&&!l.isContextLost()&&A(l,u),u=null}};a.addEventListener(`webglcontextlost`,j),a.addEventListener(`webglcontextrestored`,M);let N={render(k,A,j,M,N=c){if(d||!Number.isFinite(k)||!Number.isFinite(A)||!Number.isFinite(j)||A<=0||j<=0||(_?(_[0]=k,_[1]=A,_[2]=j,_[3]=M,_[4]=N):_=[k,A,j,M,N],!u||l.isContextLost()))return;m=Math.max(0,k);let P=Math.min(Number.isFinite(M)&&M>0?M:1,Math.sqrt(2e6/(A*j))),F=Math.min(1.5,P),I=Math.max(1,Math.floor(A*F)),L=Math.max(1,Math.floor(j*F)),R=Math.max(1,Math.floor(A*P)),z=Math.max(1,Math.floor(j*P));(a.width!==R||a.height!==z)&&(a.width=R,a.height=z),f||(f=new r(new e(o.graph,o.frames),A/j),f.scaleCamera(A/8),f.normalizeZoom(I),h=f.recursionDepth),f.setCameraAspect(A/j),f.normalizeZoom(I);let B=Math.floor(m*S+1e-7),V=Math.min(B,p+T);for(;p<V;p++)f.scaleCamera(C),f.translateCamera(w,-w),f.step(s),f.normalizeZoom(I);let H=f.getTimeFract(),U=p===B?Math.max(0,m*S-p):0,W=f.getViewInfo(I,L,C**U,w*U),G=W.visibleTiles.length,K=W.visibleTiles[0].length,q=K*512,J=G*512;if(q>O||J>O)throw Error(`Life view exceeds this renderer’s texture capacity.`);let Y=u;l.useProgram(Y.program),l.bindVertexArray(Y.vao),l.uniform2f(Y.uniforms.resolution,I,L),Y.lastFrame!==H&&(o.frames.writeFrame(H,E),l.activeTexture(l.TEXTURE1),l.bindTexture(l.TEXTURE_2D,Y.tiles),l.texSubImage2D(l.TEXTURE_2D,0,0,0,y,b,l.RGBA_INTEGER,l.UNSIGNED_INT,E),Y.lastFrame=H),D.fill(0);for(let e=0;e<G;e++)for(let t=0;t<K;t++){let n=(e*16+t)*4;D[n]=W.visibleTiles[e][t][0],D[n+1]=W.visibleTiles[e][t][1]}let X=q!==Y.preWidth||J!==Y.preHeight;for(let e=0;e<D.length&&!X;e++)D[e]!==Y.lastTopTiles[e]&&(X=!0);if(X){if(l.activeTexture(l.TEXTURE2),l.bindTexture(l.TEXTURE_2D,Y.topTiles),l.texSubImage2D(l.TEXTURE_2D,0,0,0,16,16,l.RGBA_INTEGER,l.UNSIGNED_INT,D),Y.lastTopTiles.set(D),l.activeTexture(l.TEXTURE3),l.bindTexture(l.TEXTURE_2D,Y.preRendered),(q!==Y.preWidth||J!==Y.preHeight)&&(l.texImage2D(l.TEXTURE_2D,0,l.RG8,q,J,0,l.RG,l.UNSIGNED_BYTE,null),Y.preWidth=q,Y.preHeight=J),l.bindFramebuffer(l.FRAMEBUFFER,Y.framebuffer),l.framebufferTexture2D(l.FRAMEBUFFER,l.COLOR_ATTACHMENT0,l.TEXTURE_2D,Y.preRendered,0),l.checkFramebufferStatus(l.FRAMEBUFFER)!==l.FRAMEBUFFER_COMPLETE)throw Error(`Life bit-plane framebuffer is unavailable.`);l.bindTexture(l.TEXTURE_2D,Y.blank),l.viewport(0,0,q,J),l.uniform4f(Y.uniforms.camera,0,0,K/4,G/4),l.uniform1i(Y.uniforms.preRendering,1),l.drawArrays(l.TRIANGLES,0,3),l.bindFramebuffer(l.FRAMEBUFFER,null)}l.activeTexture(l.TEXTURE3),l.bindTexture(l.TEXTURE_2D,Y.preRendered),Y.matrix.begin(A,j,i(N.columns,N.view)),l.uniform1i(Y.uniforms.preRendering,0),l.uniform4fv(Y.uniforms.camera,W.cameraBounds),l.uniform4fv(Y.uniforms.rawCamera,W.rawCameraBounds),l.uniform1f(Y.uniforms.transition,Math.max(0,Math.min(1,(H-n)/(t-n)))),l.drawArrays(l.TRIANGLES,0,3),Y.matrix.present(R,z,N),(v!==Y.matrix.columns||x!==Y.matrix.rows)&&(v=Y.matrix.columns,x=Y.matrix.rows,a.dataset.matrixColumns=String(v),a.dataset.matrixRows=String(x)),g++},getDiagnostics(){return{source:`saharan/works/life`,ready:!!u&&!d,activeSeconds:p/S,requestedSeconds:m,recursionCount:f?f.recursionDepth-h:0,recursionPhase:p/S/8%1,simulationSpeed:s,secondsPerRecursion:8,frameTime:f?.getTimeFract()??0,cameraWidth:f?.cameraWidth()??0,preRenderSize:[u?.preWidth??0,u?.preHeight??0],drawnFrames:g}},dispose(){d||(d=!0,a.removeEventListener(`webglcontextlost`,j),a.removeEventListener(`webglcontextrestored`,M),u&&!l.isContextLost()&&A(l,u),u=null,f=null,_=null,a.width=1,a.height=1,delete a.dataset.matrixColumns,delete a.dataset.matrixRows)}};return N}export{j as createRecursiveRenderer};