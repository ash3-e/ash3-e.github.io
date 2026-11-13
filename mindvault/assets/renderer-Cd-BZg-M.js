import{Sampler as e,TRANSITION_END as t,TRANSITION_START as n,Universe as r}from"./core-C7pqblJN.js";import{n as i,t as a}from"./index-KUmhK82V.js";var o=`#version 300 es
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
}`,s=`#version 300 es
precision highp float;
precision highp int;
precision highp usampler2D;
precision highp sampler2D;
const ivec2 GRAPH_TEX_LOG_SIZE = ivec2(10, 11);
const ivec2 TILES_TEX_LOG_SIZE = ivec2(7, 7);
const ivec2 GRAPH_TEX_SIZE = ivec2(1024, 2048);
const ivec2 TILES_TEX_SIZE = ivec2(128, 128);
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
    float value = correctDensity(density, level, cellState);
    if (iter == 0) prevValue = value;
    if (res <= pixelSize) {
      float t = (pixelSize - res) / res;
      return value + t * (prevValue - value);
    }
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
    vec3 color1 = colorAt(fract(vRawPosition));
    vec3 color2 = colorAt(fract(vRawPosition * 2048.0));
    float colorCoeff = pow(linearstep(log(2.0), log(4096.0), log(innerRes)), 2.0);
    vec3 color = mix(color1, color2, colorCoeff);
    vec3 heatColor = heat > 0.0 ? vec3(heat, heat * 0.3, heat * -0.1) : vec3(heat * 0.2, heat * -0.2, heat * -1.0);
    vec3 colorWithHeat = (color / max(color.x, max(color.y, color.z)) + heatColor) / (heat >= 0.0 ? 1.0 + heat : 1.0 - heat * 4.0);
    oColor = vec4(colorWithHeat * pop, 1.0);
  }
}`,c=1024,l=2048,u=128,d=[43566,58879,89218,134733,255330,428144,477174],f=60,p=600;function m(e,t,n){let r=e.createShader(t);if(!r)throw Error(`Life shader allocation failed.`);if(e.shaderSource(r,n),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS)){let t=e.getShaderInfoLog(r);throw e.deleteShader(r),Error(`Life shader compilation failed: ${t||`unsupported renderer`}`)}return r}function h(e){let t=new Uint32Array(c*l*4);for(let t=0;t<d.length;t++)if(e.numNodesOfLevel(t+3)!==d[t])throw Error(`Life graph does not match the pinned shader data.`);return e.writeGraphTexturePixels(t),t}function g(e,t){let n=m(e,e.VERTEX_SHADER,o),r=null,i=null,a=[],d=null,f=null;try{if(r=m(e,e.FRAGMENT_SHADER,s),i=e.createProgram(),!i)throw Error(`Life program allocation failed.`);if(e.attachShader(i,n),e.attachShader(i,r),e.linkProgram(i),!e.getProgramParameter(i,e.LINK_STATUS))throw Error(`Life program link failed: ${e.getProgramInfoLog(i)||``}`);if(e.useProgram(i),d=e.createVertexArray(),f=e.createFramebuffer(),!d||!f)throw Error(`Life renderer allocation failed.`);let o=(t,n,r,o,s)=>{let c=e.createTexture();if(!c)throw Error(`Life texture allocation failed.`);return a.push(c),e.activeTexture(e.TEXTURE0+t),e.bindTexture(e.TEXTURE_2D,c),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),t===3?e.texImage2D(e.TEXTURE_2D,0,e.RG8,1,1,0,e.RG,e.UNSIGNED_BYTE,null):e.texImage2D(e.TEXTURE_2D,0,e.RGBA32UI,r,o,0,e.RGBA_INTEGER,e.UNSIGNED_INT,s),e.uniform1i(e.getUniformLocation(i,n),t),c},p=o(0,`graph`,c,l,h(t.graph)),g=o(1,`tiles`,u,u,new Uint32Array(65536)),_=o(2,`topTiles`,16,16,new Uint32Array(1024)),v=o(3,`prerenderedTopTiles`,1,1,null),y=e.createTexture();if(!y)throw Error(`Life placeholder texture allocation failed.`);a.push(y),e.bindTexture(e.TEXTURE_2D,y),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texImage2D(e.TEXTURE_2D,0,e.RG8,1,1,0,e.RG,e.UNSIGNED_BYTE,new Uint8Array([0,0]));let b=Object.fromEntries([`resolution`,`camera`,`rawCamera`,`preRendering`,`transition`,`heat`].map(t=>[t,e.getUniformLocation(i,t)]));if(e.disable(e.DEPTH_TEST),e.disable(e.CULL_FACE),e.disable(e.BLEND),e.disable(e.DITHER),e.bindVertexArray(d),e.uniform1f(b.heat,0),e.getError()!==e.NO_ERROR)throw Error(`Life textures are unsupported on this renderer.`);return{program:i,vao:d,graph:p,tiles:g,topTiles:_,preRendered:v,blank:y,framebuffer:f,uniforms:b,preWidth:0,preHeight:0,lastFrame:-1,lastTopTiles:new Uint32Array(1024).fill(4294967295)}}catch(t){throw a.forEach(t=>e.deleteTexture(t)),f&&e.deleteFramebuffer(f),d&&e.deleteVertexArray(d),i&&e.deleteProgram(i),t}finally{e.deleteShader(n),r&&e.deleteShader(r)}}function _(e,t){for(let n of[t.graph,t.tiles,t.topTiles,t.preRendered,t.blank])e.deleteTexture(n);e.deleteFramebuffer(t.framebuffer),e.deleteVertexArray(t.vao),e.deleteProgram(t.program)}function v(o,s){let c=o.getContext(`webgl2`,{alpha:!1,antialias:!1,depth:!1,stencil:!1,preserveDrawingBuffer:!1,powerPreference:`low-power`});if(!c)return null;let l=g(c,s),d=!1,m=null,h=0,v=0,y=0,b=0,x=null,S=new Uint32Array(65536),C=new Uint32Array(1024),w=c.getParameter(c.MAX_TEXTURE_SIZE),T=e=>{e.preventDefault(),l=null},E=()=>{if(!d)try{l=g(c,s),!document.hidden&&x&&D.render(...x)}catch{l&&!c.isContextLost()&&_(c,l),l=null}};o.addEventListener(`webglcontextlost`,T),o.addEventListener(`webglcontextrestored`,E);let D={render(g,_,T,E){if(d||!Number.isFinite(g)||!Number.isFinite(_)||!Number.isFinite(T)||_<=0||T<=0||(x=[g,_,T,E],!l||c.isContextLost()))return;v=Math.max(0,g);let D=Math.min(1.5,Number.isFinite(E)&&E>0?E:1,Math.sqrt(2e6/(_*T))),O=Math.max(1,Math.floor(_*D)),k=Math.max(1,Math.floor(T*D));(o.width!==O||o.height!==k)&&(o.width=O,o.height=k),m||(m=new r(new e(s.graph,s.frames),_/T),m.scaleCamera(_/8),m.normalizeZoom(O),y=m.recursionDepth),m.setCameraAspect(_/T),m.normalizeZoom(O);let A=Math.floor(v*f+1e-7),j=Math.min(A,h+p),M=Math.exp(i/f);for(;h<j;h++)m.scaleCamera(M),m.step(a),m.normalizeZoom(O);let N=m.getTimeFract(),P=m.getViewInfo(O,k),F=P.visibleTiles.length,I=P.visibleTiles[0].length,L=I*512,R=F*512;if(L>w||R>w)throw Error(`Life view exceeds this renderer’s texture capacity.`);let z=l;if(c.useProgram(z.program),c.bindVertexArray(z.vao),c.uniform2f(z.uniforms.resolution,O,k),c.uniform1f(z.uniforms.heat,0),c.activeTexture(c.TEXTURE0),c.bindTexture(c.TEXTURE_2D,z.graph),c.activeTexture(c.TEXTURE1),c.bindTexture(c.TEXTURE_2D,z.tiles),z.lastFrame!==N){let e=0;for(let t of s.frames.restoreFrame(N))for(let n of t)S[e++]=n;c.texSubImage2D(c.TEXTURE_2D,0,0,0,u,u,c.RGBA_INTEGER,c.UNSIGNED_INT,S),z.lastFrame=N}C.fill(0);for(let e=0;e<F;e++)for(let t=0;t<I;t++){let n=(e*16+t)*4;C[n]=P.visibleTiles[e][t][0],C[n+1]=P.visibleTiles[e][t][1]}let B=L!==z.preWidth||R!==z.preHeight;for(let e=0;e<C.length&&!B;e++)C[e]!==z.lastTopTiles[e]&&(B=!0);if(c.activeTexture(c.TEXTURE2),c.bindTexture(c.TEXTURE_2D,z.topTiles),B){if(c.texSubImage2D(c.TEXTURE_2D,0,0,0,16,16,c.RGBA_INTEGER,c.UNSIGNED_INT,C),z.lastTopTiles.set(C),c.activeTexture(c.TEXTURE3),c.bindTexture(c.TEXTURE_2D,z.preRendered),(L!==z.preWidth||R!==z.preHeight)&&(c.texImage2D(c.TEXTURE_2D,0,c.RG8,L,R,0,c.RG,c.UNSIGNED_BYTE,null),z.preWidth=L,z.preHeight=R),c.bindFramebuffer(c.FRAMEBUFFER,z.framebuffer),c.framebufferTexture2D(c.FRAMEBUFFER,c.COLOR_ATTACHMENT0,c.TEXTURE_2D,z.preRendered,0),c.checkFramebufferStatus(c.FRAMEBUFFER)!==c.FRAMEBUFFER_COMPLETE)throw Error(`Life bit-plane framebuffer is unavailable.`);c.bindTexture(c.TEXTURE_2D,z.blank),c.viewport(0,0,L,R),c.uniform4f(z.uniforms.camera,0,0,I/4,F/4),c.uniform1i(z.uniforms.preRendering,1),c.drawArrays(c.TRIANGLES,0,3),c.bindFramebuffer(c.FRAMEBUFFER,null)}c.activeTexture(c.TEXTURE3),c.bindTexture(c.TEXTURE_2D,z.preRendered),c.viewport(0,0,O,k),c.uniform1i(z.uniforms.preRendering,0),c.uniform4fv(z.uniforms.camera,P.cameraBounds),c.uniform4fv(z.uniforms.rawCamera,P.rawCameraBounds),c.uniform1f(z.uniforms.transition,Math.max(0,Math.min(1,(N-n)/(t-n)))),c.drawArrays(c.TRIANGLES,0,3),b++},getDiagnostics(){return{source:`saharan/works/life`,ready:!!l&&!d,activeSeconds:h/f,requestedSeconds:v,recursionCount:m?m.recursionDepth-y:0,recursionPhase:h/f/8%1,simulationSpeed:a,secondsPerRecursion:8,frameTime:m?.getTimeFract()??0,cameraWidth:m?.cameraWidth()??0,preRenderSize:[l?.preWidth??0,l?.preHeight??0],drawnFrames:b}},dispose(){d||(d=!0,o.removeEventListener(`webglcontextlost`,T),o.removeEventListener(`webglcontextrestored`,E),l&&!c.isContextLost()&&_(c,l),l=null,m=null,x=null,o.width=1,o.height=1)}};return D}export{v as createRecursiveRenderer};