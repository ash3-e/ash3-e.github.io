import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { vertexShader, fragmentShader } from './shaders.js';
import { surfacePoint, field, fieldVelocity } from './model.js';

export function createScene(canvas, viewport) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x0e1014);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, matchMedia('(max-width:760px)').matches ? 1.7 : 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 160);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = .08;
  controls.minDistance = 7;
  controls.maxDistance = 50;
  controls.autoRotateSpeed = .65;
  controls.enablePan = true;
  const uniforms = {
    uShape: { value: .45 }, uTime: { value: 0 }, uSpan: { value: 18 },
    uMode: { value: 0 }, uPalette: { value: 0 }, uWire: { value: 0 }
  };
  const small = matchMedia('(max-width:760px)').matches;
  const geometry = new THREE.PlaneGeometry(1, 1, small ? 84 : 120, small ? 220 : 340);
  const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const surface = new THREE.Mesh(geometry, material);
  surface.frustumCulled = false;
  scene.add(surface);
  const grid = new THREE.GridHelper(34, 34, 0x374556, 0x263340);
  grid.material.transparent = true;
  grid.material.opacity = .24;
  grid.material.depthWrite = false;
  grid.position.y = -3.15;
  scene.add(grid);

  const slicePositions = new Float32Array(181 * 3);
  const sliceGeometry = new THREE.BufferGeometry();
  sliceGeometry.setAttribute('position', new THREE.BufferAttribute(slicePositions, 3).setUsage(THREE.DynamicDrawUsage));
  const slice = new THREE.Line(sliceGeometry, new THREE.LineBasicMaterial({ color: 0xf9efad, transparent: true, opacity: .9, depthTest: false, depthWrite: false }));
  slice.frustumCulled = false;
  slice.renderOrder = 2;
  scene.add(slice);
  const vectors = new THREE.Group();
  const arrows = Array.from({ length: 45 }, () => {
    const arrow = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(), .4, 0x8ab6ff, .10, .045);
    arrow.line.material.transparent = true;
    arrow.line.material.opacity = .85;
    arrow.cone.material.transparent = true;
    arrow.cone.material.opacity = .95;
    for(const part of [arrow.line,arrow.cone]) {
      part.material.depthTest=false;
      part.material.depthWrite=false;
      part.renderOrder=3;
    }
    vectors.add(arrow);
    return arrow;
  });
  vectors.visible = false;
  scene.add(vectors);

  const axisOrigin = new THREE.Vector3(-3.9,-3.05,1);
  const axisDirections = [new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1)];
  const axisColors = [0xe88e9c,0x74dcb7,0x82a9ed];
  const axisHelpers = axisDirections.map((dir,i) => {
    const arrow=new THREE.ArrowHelper(dir,axisOrigin,.8,axisColors[i],.11,.05);
    for(const part of [arrow.line,arrow.cone]) { part.material.depthTest=false; part.renderOrder=4; }
    scene.add(arrow); return arrow;
  });
  const axisEnds = axisDirections.map(dir=>axisOrigin.clone().addScaledVector(dir,1.03));
  const labels = [...document.querySelectorAll('[data-axis]')];
  const point = new THREE.Vector3(), tangent = new THREE.Vector3(), du = new THREE.Vector3(), dv = new THREE.Vector3();
  let width = 1, height = 1, mode = 'surface';
  function resize() {
    width = Math.max(1,viewport.clientWidth); height = Math.max(1,viewport.clientHeight);
    camera.aspect = width/height;
    camera.updateProjectionMatrix();
    renderer.setSize(width,height,false);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(viewport);
  function resetView() {
    const narrow = viewport.clientWidth/viewport.clientHeight < .7;
    camera.position.set(mode === 'surface' ? 7.5 : 11, mode === 'surface' ? 3.4 : 10, mode === 'surface' ? 11.5 : 14);
    if(narrow) camera.position.multiplyScalar(1.15);
    controls.target.set(0,mode==='surface' ? 0 : -.3,0);
    controls.update();
    controls.saveState();
  }
  resize(); resetView();
  function setMode(next) {
    mode = next;
    uniforms.uMode.value = mode==='field' ? 1 : 0;
    grid.position.y = mode==='field' ? -3.7 : -3.15;
    slice.material.color.setHex(mode==='field' ? 0xff9485 : 0xf9efad);
    axisOrigin.set(...(mode==='field' ? [-5.7,-1.8,4.5] : [-3.9,-3.05,1]));
    axisHelpers.forEach((helper,i)=>{helper.position.copy(axisOrigin);axisEnds[i].copy(axisOrigin).addScaledVector(axisDirections[i],1.03);});
    labels.forEach((label,i)=>{label.textContent = mode==='field' ? ['x','φ','t'][i] : ['x','y','z'][i];});
    resetView();
  }
  function update(state, delta) {
    uniforms.uShape.value = state.a;
    uniforms.uTime.value = state.time;
    uniforms.uSpan.value = state.span;
    uniforms.uPalette.value = state.palette;
    uniforms.uWire.value = state.wireframe ? 1 : 0;
    controls.autoRotate = state.orbit && state.playing;
    controls.update(delta);
    const a = state.a, t = state.time, span = state.span;
    for(let i=0; i<=180; i++) {
      const f = i/180;
      const p = mode==='surface' ? surfacePoint((f-.5)*8.4/a,t,a) : [(f-.5)*11,field((f-.5)*22,t,a)*1.3+.018,t*9/span];
      slicePositions[i*3]=p[0]; slicePositions[i*3+1]=p[1]; slicePositions[i*3+2]=p[2];
    }
    sliceGeometry.attributes.position.needsUpdate = true;
    vectors.visible = state.vectors;
    if(state.vectors) {
      for(let i=0;i<arrows.length;i++) {
        const arrow = arrows[i];
        if(mode==='surface') {
          const u = ((i%5)-2)*1.25/a, v = (Math.floor(i/5)-4)*span/5+t;
          point.fromArray(surfacePoint(u,v,a));
          du.fromArray(surfacePoint(u+.002,v,a)).sub(new THREE.Vector3().fromArray(surfacePoint(u-.002,v,a)));
          dv.fromArray(surfacePoint(u,v+.002,a)).sub(new THREE.Vector3().fromArray(surfacePoint(u,v-.002,a)));
          tangent.copy(state.vectorType==='tangent' ? dv : du.cross(dv));
          const size=tangent.length();
          arrow.visible = size>1e-7;
          if(!arrow.visible)continue;
          tangent.divideScalar(size);
          arrow.position.copy(point).addScaledVector(tangent,.018);
          arrow.setDirection(tangent);
          arrow.setLength(state.vectorType==='tangent' ? .55 : .46,.10,.05);
          arrow.setColor(state.vectorType==='tangent' ? 0xf3a0ae : 0x8ab6ff);
        } else {
          arrow.visible = i<23;
          if(!arrow.visible)continue;
          const x=(i-11)*.78, phi=field(x,t,a);
          const velocity=state.vectorType==='velocity';
          const val=velocity ? fieldVelocity(x,t,a)*.45 : phi*1.3;
          arrow.visible = Math.abs(val)>.025;
          if(!arrow.visible)continue;
          arrow.position.set(x*.5,velocity ? phi*1.3 : 0,t*9/span);
          arrow.setDirection(tangent.set(0,Math.sign(val),0));
          arrow.setLength(Math.max(.03,Math.abs(val)),Math.min(.11,Math.abs(val)*.3),Math.min(.06,Math.abs(val)*.2));
          arrow.setColor(velocity ? 0xf3a0ae : 0x8ab6ff);
        }
      }
    }
    renderer.render(scene,camera);
    axisEnds.forEach((end,i)=>{
      axisHelpers[i].visible=width>=640;
      point.copy(end).project(camera);
      labels[i].style.transform=`translate(${(point.x*.5+.5)*width}px,${(-point.y*.5+.5)*height}px)`;
      labels[i].style.visibility=width>=640&&point.z<1&&point.z>-1 ? 'visible':'hidden';
    });
  }
  function dispose() {
    observer.disconnect(); controls.dispose(); geometry.dispose(); material.dispose();
    sliceGeometry.dispose(); slice.material.dispose(); grid.geometry.dispose(); grid.material.dispose();
    renderer.dispose();
  }
  return { update, resetView, setMode, resize, dispose, renderer };
}
