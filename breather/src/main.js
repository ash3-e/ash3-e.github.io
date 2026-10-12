import { createScene } from './scene.js';
import { defaults, presets, TAU, effectiveShape, timeAtPhase, seekPhase } from './model.js';

const $ = id => document.getElementById(id);
const target = { ...defaults };
const current = { ...defaults };
const state = { ...defaults, a: defaults.shape, time: 0, phase: .22, playing: true, mode: 'surface', palette: 0, vectors: false, vectorType: 'normal', wireframe: false, orbit: false };
const canvas = $('scene');
let engine, lastFrame=0, lastHud=0, scrubbing=false, contextLost=false;
const format = value => `${value<0?'−':'+'}${Math.abs(value).toFixed(2)}`;
function paintRange(input) {
  const fraction = (Number(input.value)-Number(input.min))/(Number(input.max)-Number(input.min));
  input.style.setProperty('--fill', `${Math.max(0,Math.min(100,fraction*100))}%`);
}
function syncParameter(key) {
  const input = $(key);
  input.value=target[key];
  $(`${key}-value`).textContent = Number(input.value).toFixed(key==='span'?1:2)+(key==='speed'?'×':'');
  input.setAttribute('aria-valuetext',$(`${key}-value`).textContent);
  paintRange(input);
}
function markPreset(name) {
  document.querySelectorAll('[data-preset]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.preset===name)));
}
Object.keys(defaults).forEach(key=>{
  syncParameter(key);
  $(key).addEventListener('input',()=>{
    target[key]=Number($(key).value);
    syncParameter(key);
    markPreset('');
  });
});
function applyPreset(name) {
  Object.assign(target,presets[name]);
  Object.keys(defaults).forEach(syncParameter);
  markPreset(name);
}
document.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>applyPreset(button.dataset.preset)));
$('reset-parameters').addEventListener('click',()=>applyPreset('classic'));
function syncPlayback() {
  $('play').setAttribute('aria-label',state.playing?'Pause animation':'Play animation');
  $('pause-icon').toggleAttribute('hidden',!state.playing);
  $('play-icon').toggleAttribute('hidden',state.playing);
}
function togglePlayback() { state.playing=!state.playing; syncPlayback(); updateHud(); }
$('play').addEventListener('click',togglePlayback);
function syncVectors() {
  state.vectors=$('vectors').checked;
  $('vector-options').hidden=!state.vectors;
}
$('vectors').addEventListener('change',syncVectors);
function syncVectorType() {
  state.vectorType=$('vector-type').value;
  $('vector-description').textContent = ({normal:'Unit normals · blue arrows',tangent:'Unit time tangents · rose arrows',displacement:'Field displacement φ · blue arrows',velocity:'Field velocity ∂φ/∂t · rose arrows'})[state.vectorType];
}
$('vector-type').addEventListener('change',syncVectorType);
$('wireframe').addEventListener('change',()=>{state.wireframe=$('wireframe').checked;});
$('orbit').addEventListener('change',()=>{state.orbit=$('orbit').checked;});
const gradients=[['#440154','#414487','#2a788e','#22a884','#7ad151','#fde725'],['#143d78','#4591a8','#a6dbca','#fcfaa3','#ded149','#176633'],['#4f38a3','#3382c7','#3bc4b5','#f7e36e','#f57d47','#c9385c'],['#384a69','#596e8f','#8099ad','#b0c4cc','#d1dee0','#f0f5f5']];
$('palette').addEventListener('change',()=>{
  state.palette=Number($('palette').value);
  $('gradient').style.background=`linear-gradient(90deg,${gradients[state.palette].join(',')})`;
});
function setMode(mode) {
  state.mode=mode;
  document.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===mode)));
  $('vector-type').replaceChildren(...(mode==='surface' ? [['normal','Surface normals'],['tangent','Time tangents']] : [['displacement','Displacement φ'],['velocity','Velocity ∂φ/∂t']]).map(([value,label])=>new Option(label,value)));
  syncVectorType();
  $('color-label').textContent=mode==='surface'?'Surface height':'Field displacement φ';
  engine?.setMode(mode);
}
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.view)));
const timeline=$('timeline');
timeline.addEventListener('pointerdown',()=>{scrubbing=true;});
window.addEventListener('pointerup',()=>{scrubbing=false;});
window.addEventListener('pointercancel',()=>{scrubbing=false;});
timeline.addEventListener('input',()=>{
  state.phase=seekPhase(Number(timeline.value),current.span,Math.cos(state.phase)<0);
  state.time=timeAtPhase(state.phase,current.span);
  paintRange(timeline);updateHud();
});
function updateHud() {
  const half=current.span/2;
  // Keep native range step alignment stable while span eases between values.
  timeline.min=(-half).toFixed(3); timeline.max=half.toFixed(3);
  if(!scrubbing)timeline.value=state.time;
  timeline.setAttribute('aria-valuetext',`Time ${state.time.toFixed(2)}`);
  paintRange(timeline);
  $('time-min').textContent=`−${half.toFixed(half%1>.01?1:0)}`;
  $('time-max').textContent=`+${half.toFixed(half%1>.01?1:0)}`;
  $('time-value').textContent=`t = ${format(state.time)}`;
  const reverse=Math.cos(state.phase)<0;
  $('direction').firstChild.textContent=state.playing?(reverse?'Reverse ':'Forward '):'Paused ';
  $('direction').lastElementChild.textContent=reverse?'←':'→';
}
function togglePanel() {
  const open=$('config').classList.toggle('open');
  $('app').classList.toggle('controls-open',open);
  $('panel-toggle').setAttribute('aria-expanded',String(open));
  $('panel-toggle').textContent=open?'Close':'Controls';
}
$('panel-toggle').addEventListener('click',togglePanel);
$('reset-view').addEventListener('click',()=>engine?.resetView());
$('about-open').addEventListener('click',()=>$('about').showModal());
$('about-close').addEventListener('click',()=>$('about').close());
$('about').addEventListener('click',event=>{if(event.target===$('about')){const r=$('about').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('about').close();}});
async function toggleFullscreen() {
  try {
    if(document.fullscreenElement) await document.exitFullscreen();
    else if(document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else togglePanel();
  } catch { /* Browsers can decline fullscreen; the viewport remains usable. */ }
}
$('fullscreen').addEventListener('click',toggleFullscreen);
if(!document.fullscreenEnabled)$('fullscreen').hidden=true;
document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Exit full screen':'Enter full screen');});
document.addEventListener('keydown',event=>{
  if(event.ctrlKey||event.metaKey||event.altKey||event.repeat||$('about').open||['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement?.tagName))return;
  switch(event.key.toLowerCase()) {
    case ' ':event.preventDefault();togglePlayback();break;
    case 'r':engine?.resetView();break;
    case 'f':toggleFullscreen();break;
    case 'h':if(matchMedia('(max-width:760px),(max-height:520px)').matches)togglePanel();break;
    case 'v':$('vectors').checked=!$('vectors').checked;syncVectors();break;
  }
});
if(matchMedia('(pointer:coarse)').matches)$('gesture-hint').textContent='Drag to orbit · pinch to zoom';
$('reload').addEventListener('click',()=>location.reload());
function showError(title,message) {
  $('loading').hidden=true;
  $('error').hidden=false;
  $('error').querySelector('h2').textContent=title;
  $('error').querySelector('p').textContent=message;
}
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;showError('Graphics paused','The graphics context was interrupted. The simulation resumes when your browser restores it, or you can try again.');});
canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;$('error').hidden=true;lastFrame=0;});
document.addEventListener('visibilitychange',()=>{lastFrame=0;});
function frame(now) {
  requestAnimationFrame(frame);
  if(document.hidden||contextLost){lastFrame=0;return;}
  const delta=lastFrame?Math.min((now-lastFrame)/1000,.065):0;
  lastFrame=now;
  const blend=1-Math.exp(-delta*8);
  Object.keys(defaults).forEach(key=>{current[key]+=(target[key]-current[key])*blend;});
  if(state.playing&&!scrubbing)state.phase=(state.phase+delta*current.speed*.28)%TAU;
  state.time=timeAtPhase(state.phase,current.span);
  state.span=current.span;
  state.a=effectiveShape(current.shape,current.variation,state.time);
  engine.update(state,delta);
  if(now-lastHud>65){updateHud();lastHud=now;}
}
try {
  engine=createScene(canvas,$('viewport'));
  engine.renderer.debug.onShaderError=()=>{contextLost=true;showError('The surface could not render','This browser could not compile the WebGL surface. Try a current browser with hardware acceleration enabled.');};
  $('loading').hidden=true;
  syncPlayback();
  updateHud();
  requestAnimationFrame(frame);
} catch(error) {
  console.error('Breather could not initialize:',error);
  showError('WebGL is unavailable','Try enabling hardware acceleration or opening this page in a current browser.');
}
