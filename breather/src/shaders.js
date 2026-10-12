export const vertexShader = `
uniform float uShape;
uniform float uTime;
uniform float uSpan;
uniform float uMode;
varying vec3 vNormalW;
varying vec3 vPositionW;
varying vec2 vUV;
varying float vColor;
float coshSafe(float x) { return (exp(x) + exp(-x)) * 0.5; }
vec3 pointAt(vec2 st) {
  float a = uShape;
  float w = sqrt(1.0-a*a);
  if (uMode > .5) {
    float x = (st.x-.5)*22.0;
    float t = (st.y-.5)*uSpan;
    float phi = 4.0*atan(a*sin(w*t)/(w*coshSafe(a*x)));
    return vec3(x*.5, phi*1.3, (st.y-.5)*9.0);
  }
  float u = (st.x-.5)*8.4/a;
  float v = (st.y-.5)*uSpan*2.0 + uTime;
  float c = coshSafe(a*u);
  float s = (exp(a*u)-exp(-a*u))*.5;
  float sv = sin(w*v), cv = cos(w*v);
  float d = a*(w*w*c*c+a*a*sv*sv);
  return a*1.3*vec3(
    2.0*w*c*(-w*cos(v)*cv-sin(v)*sv)/d,
    -u+2.0*w*w*c*s/d,
    2.0*w*c*(-w*sin(v)*cv+cos(v)*sv)/d);
}
void main() {
  vUV = uv;
  vec3 p = pointAt(uv);
  float e = .00012;
  vec3 du = pointAt(uv+vec2(e,0))-pointAt(uv-vec2(e,0));
  vec3 dv = pointAt(uv+vec2(0,e))-pointAt(uv-vec2(0,e));
  vec3 n = cross(du,dv);
  vNormalW = mat3(modelMatrix) * (n/max(length(n),.0000001));
  vPositionW = (modelMatrix*vec4(p,1)).xyz;
  vColor = uMode>.5 ? .5+p.y/5.5 : .5+p.y/1.9;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1);
}`;
export const fragmentShader = `
uniform float uPalette;
uniform float uWire;
uniform float uMode;
uniform float uTime;
uniform float uSpan;
varying vec3 vNormalW;
varying vec3 vPositionW;
varying vec2 vUV;
varying float vColor;
vec3 palette(float t) {
  t = clamp(t,0.0,1.0);
  vec3 c0, c1, c2, c3, c4, c5;
  if(uPalette<.5) {
    c0=vec3(.267,.005,.329);c1=vec3(.254,.265,.529);c2=vec3(.164,.471,.558);
    c3=vec3(.135,.659,.518);c4=vec3(.478,.821,.318);c5=vec3(.993,.906,.144);
  } else if(uPalette<1.5) {
    c0=vec3(.08,.24,.47);c1=vec3(.27,.57,.66);c2=vec3(.65,.86,.79);
    c3=vec3(.99,.98,.64);c4=vec3(.87,.82,.29);c5=vec3(.09,.40,.20);
  } else if(uPalette<2.5) {
    c0=vec3(.31,.22,.64);c1=vec3(.20,.51,.78);c2=vec3(.23,.77,.71);
    c3=vec3(.97,.89,.43);c4=vec3(.96,.49,.28);c5=vec3(.79,.22,.36);
  } else {
    c0=vec3(.22,.29,.41);c1=vec3(.35,.43,.56);c2=vec3(.50,.60,.68);
    c3=vec3(.69,.77,.80);c4=vec3(.82,.87,.88);c5=vec3(.94,.96,.96);
  }
  float k=t*5.0;
  if(k<1.0)return mix(c0,c1,k);
  if(k<2.0)return mix(c1,c2,k-1.0);
  if(k<3.0)return mix(c2,c3,k-2.0);
  if(k<4.0)return mix(c3,c4,k-3.0);
  return mix(c4,c5,k-4.0);
}
void main() {
  vec3 N = normalize(vNormalW);
  if(!gl_FrontFacing) N=-N;
  vec3 V = normalize(cameraPosition-vPositionW);
  vec3 L = normalize(vec3(-.7,1.3,1.1));
  float diffuse = max(dot(N,L),0.0);
  float fill = max(dot(N,normalize(vec3(1.1,.15,-.8))),0.0);
  float rim = pow(1.0-abs(dot(N,V)),2.5);
  float spec = pow(max(dot(N,normalize(L+V)),0.0),38.0);
  vec3 color = palette(vColor)*(.58+.48*diffuse+.17*fill)+vec3(.12,.16,.18)*rim+spec*.14;
  vec2 grid = vUV*vec2(32.0,72.0);
  vec2 g = abs(fract(grid-.5)-.5)/max(fwidth(grid),vec2(.0001));
  float line = 1.0-smoothstep(.15,.95,min(g.x,g.y));
  color *= 1.0-line*mix(.035,.43,uWire);
  if(uMode>.5) {
    float slice = abs(vUV.y-(uTime/uSpan+.5));
    color = mix(color,vec3(.98,.91,.55),.36*(1.0-smoothstep(.0,.005,slice)));
  }
  gl_FragColor=vec4(color,1.0);
}`;
