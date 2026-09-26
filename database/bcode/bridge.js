import { setTerminalVisible } from './assets/doc-terminal.js';

const send = (type, detail) => parent.postMessage({ source: 'inventory-terminal', type, detail }, location.origin);
let liveState = {};
window.__bcodeLava = { getState: () => liveState };
for (const type of ['bcode:lava-params', 'bcode:lava-control', 'inventory:background']) {
  window.addEventListener(type, event => send(type, event.detail));
}
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== parent || event.data?.source !== 'inventory-host') return;
  if (event.data.type === 'state') {
    liveState = event.data.detail;
    window.dispatchEvent(new CustomEvent('bcode:lava-state', { detail: liveState }));
  }
  if (event.data.type === 'focus') document.getElementById('dt-cmd-input')?.focus();
  if (event.data.type === 'visibility') setTerminalVisible(event.data.detail === true);
});
// Keep the code available while keyboard focus is inside the terminal frame.
const code = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let progress = 0;
let lastKey = 0;
window.addEventListener('keydown', event => {
  if (event.repeat || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
  if (Date.now() - lastKey > 2000) progress = 0;
  lastKey = Date.now();
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  progress = key === code[progress] ? progress + 1 : key === code[0] ? 1 : 0;
  if (progress >= code.length - 1) event.preventDefault();
  if (progress === code.length) { progress = 0; event.preventDefault(); send('konami'); }
}, true);
send('ready');
