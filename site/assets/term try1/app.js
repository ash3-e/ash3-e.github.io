/* ================================================================
   app.js — BCODe Terminal Prototype
   ================================================================

   Architecture overview
   ---------------------
   1.  bcode_sab.js (SABParser) provides streaming BCODe parse/state
       behavior.  SABParser.feed() processes bytes synchronously
       through a callback-driven state machine.  A command "latches"
       when a CMD terminator (byte 0x60–0x7E) is encountered,
       at which point the on_line_latched callback fires.

   2.  highlight.js + bcode_lang.js (loaded in terminal.html before
       this module) provide syntax highlighting.  The IIFE in
       bcode_lang.js registers the "bcode" language with window.hljs.
       We call hljs.highlight(text, { language: 'bcode' }) to produce
       highlighted HTML for any BCODe string.

   3.  Live input highlighting uses an overlay approach: a transparent
       <input> sits atop a highlighted <div> mirror.  On every
       `input` event the mirror's innerHTML is refreshed with the
       hljs-highlighted text.  The <input> handles keyboard, caret,
       selection, and copy/paste natively; the mirror provides color.

   4.  Output generation simulates a lava-lamp application profile.
       Set (s) commands update simulation state; query (q) commands
       return a full snapshot; unsolicited (u) telemetry lines are
       appended on a 3-second timer.

   Lava-lamp application profile (application-defined semantics):
       A = blob target          H = dense-cell count
       B = blob radius          I = visible blob count
       C = buoyancy             J = average density
       s = set   q = query      K = fps
       u = unsolicited          r = reset
   ================================================================ */

import { SABParser, BC_SHAPE } from './assets/term/bcode_sab.js';

// ── DOM shorthand ─────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

// ── Simulation state ──────────────────────────────────────────────
const sim = {
  A: 24,      // blob target
  B: 4.8,     // blob radius / size control
  C: 0.18,    // buoyancy / drift control
  H: 312,     // dense-cell count (# class count)
  I: 24,      // visible blob count
  J: 0.63,    // average density (normalized)
  K: 60,      // fps / tick-rate metric
  tick: 0.8,  // telemetry tick counter (starts after seeded lines)
};

// ── Application state ─────────────────────────────────────────────
let currentView = 'home';
const homeHistory = [];   // [{cmd, output}]  — Home history panel
const termReqResp = [];   // [{cmd, output}]  — Terminal req/resp pane
const termFeed    = [];   // [string]         — Terminal unsolicited feed
let feedTimer = null;

/* ================================================================
   Syntax Highlighting
   ================================================================
   hljs.highlight() is the canonical path.  The bcode language
   grammar (bcode_lang.js) and theme CSS (merged into styles.css)
   drive all token coloring.  hl() is called for every rendered
   BCODe line: live input mirror, history, req/resp, feed, and
   seeded examples.
   ================================================================ */

function hl(text) {
  if (!text) return '';
  try {
    return hljs.highlight(text, { language: 'bcode' }).value;
  } catch {
    return esc(text);
  }
}

function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ================================================================
   BCODe Parser Integration
   ================================================================
   parseCommand() creates a fresh SABParser, feeds the input string
   (plus a newline to flush any pending string-payload state), and
   synchronously collects the resulting events.

   The parser fires:
     on_field        — for each PARAM (0x40–0x5F) or CMD (0x60–0x7E)
     on_line_latched — when a CMD terminator commits the line
     on_parse_error  — on malformed input (enters resync)

   A "latched" result means the input was valid BCODe with at least
   one CMD terminator.  Partial or invalid input still displays in
   the UI but produces no output line.
   ================================================================ */

function parseCommand(text) {
  const result = {
    latched: false,
    cmdByte: 0,
    cmdChar: '',
    fields: [],       // [{term, is_cmd, field}]
    errors: [],
    hasPayload: false,
  };

  const p = new SABParser({
    on_field(_, term, is_cmd, field) {
      result.fields.push({
        term: String.fromCharCode(term),
        is_cmd,
        field: { ...field },
      });
    },
    on_line_latched(_, cmd) {
      result.latched = true;
      result.cmdByte = cmd;
      result.cmdChar = String.fromCharCode(cmd);
    },
    on_parse_error(_, code, byte, st) {
      result.errors.push({ code, byte, st });
    },
    on_payload_string_begin() { result.hasPayload = true; },
    on_payload_hex_begin()    { result.hasPayload = true; },
  });

  // Newline terminates any open string payload and is whitespace otherwise
  p.feed(text + '\n');
  return result;
}

// ── Numeric extraction from a parsed field ────────────────────────
function fieldToNumber(f) {
  if (f.shape === BC_SHAPE.EMPTY) return 0;
  let v = Number(f.value1);
  if (f.shape === BC_SHAPE.PAIR) {
    const frac = Number(f.value2) / Math.pow(10, f.frac_width);
    v = f.value2_neg ? v - frac : v + frac;
  }
  if (f.qual_mask & 0x01) v = -v;  // '-' qualifier
  return v;
}

// ── Simulation helpers ────────────────────────────────────────────

function updateSimDerived() {
  sim.H = Math.floor(280 + sim.A * 1.3 + Math.random() * 10);
  sim.I = Math.max(1, sim.A + Math.floor(Math.random() * 2));
  sim.J = parseFloat(Math.min(0.99, 0.50 + sim.H / 1000).toFixed(2));
  sim.K = 59 + Math.floor(Math.random() * 3);
}

function fmtNum(v) {
  if (Number.isInteger(v)) return String(v);
  const s = String(v);
  return s.length > 8 ? v.toFixed(2) : s;
}

/* ================================================================
   Output Generation
   ================================================================
   Generates a latched output line matching the lava-lamp profile.

   s (set)   — Update sim params, echo current values.
   q (query) — Return full snapshot: H I J K + version.
   r (reset) — Reset sim to defaults, confirm.
   other     — Echo input.

   The ○ prefix is added at render time, not here.
   ================================================================ */

function generateOutput(inputText, parsed) {
  if (!parsed.latched) return null;

  switch (parsed.cmdChar) {
    case 's': {
      for (const f of parsed.fields) {
        if (f.is_cmd) continue;
        const val = fieldToNumber(f.field);
        const gt = f.field.qual_mask & 0x04;  // '>'
        const lt = f.field.qual_mask & 0x02;  // '<'
        switch (f.term) {
          case 'A': sim.A = gt ? Math.max(sim.A, val) : lt ? Math.min(sim.A, val) : val; break;
          case 'B': sim.B = val; break;
          case 'C': sim.C = val; break;
        }
      }
      updateSimDerived();
      // Echo the current value of each set param
      let out = '';
      for (const f of parsed.fields) {
        if (f.is_cmd) continue;
        const cur = sim[f.term];
        if (cur !== undefined) out += fmtNum(cur) + f.term + ' ';
      }
      out += '0.0s';
      return out;
    }

    case 'q':
      return `${sim.H}H ${sim.I}I ${sim.J.toFixed(2)}J ${sim.K}K 0.0q`;

    case 'r':
      Object.assign(sim, { A: 24, B: 4.8, C: 0.18 });
      updateSimDerived();
      return '0.0r';

    default:
      return inputText;
  }
}

/* ================================================================
   DOM Creation Helpers
   ================================================================
   Every rendered BCODe line is wrapped in a <div class="bcode-line">
   with innerHTML set to the hljs-highlighted output.  The ○ prefix
   for latched output lines is a separate <span> that preserves the
   terminal foreground color while the BCODe body keeps full syntax
   highlighting.
   ================================================================ */

function mkLine(text, cls) {
  const d = document.createElement('div');
  d.className = 'bcode-line' + (cls ? ' ' + cls : '');
  d.innerHTML = hl(text);
  return d;
}

function mkOutputLine(text) {
  const d = document.createElement('div');
  d.className = 'bcode-line';
  const pfx = document.createElement('span');
  pfx.className = 'output-prefix';
  pfx.textContent = '\u25CB ';   // ○ open circle
  const body = document.createElement('span');
  body.innerHTML = hl(text);
  d.append(pfx, body);
  return d;
}

function mkBlank() {
  const d = document.createElement('div');
  d.className = 'bcode-line blank-line';
  return d;
}

/* ================================================================
   Rendering
   ================================================================ */

function renderHistory() {
  const el = $('history-body');
  el.innerHTML = '';
  for (const e of homeHistory) {
    el.appendChild(mkLine(e.cmd));
    if (e.output != null) el.appendChild(mkOutputLine(e.output));
    el.appendChild(mkBlank());
  }
  el.scrollTop = el.scrollHeight;
}

function renderReqResp() {
  const el = $('reqresp-body');
  el.innerHTML = '';
  for (const e of termReqResp) {
    el.appendChild(mkLine(e.cmd));
    if (e.output != null) el.appendChild(mkOutputLine(e.output));
    el.appendChild(mkBlank());
  }
  el.scrollTop = el.scrollHeight;
}

function renderFeed() {
  const el = $('feed-body');
  el.innerHTML = '';
  for (const line of termFeed) {
    el.appendChild(mkLine(line));
  }
  el.scrollTop = el.scrollHeight;
}

function renderStateFeed() {
  const el = $('state-body');
  el.innerHTML = '';
  const items = [
    'parser: normal',
    `blobs: ${sim.I}`,
    `# cells: ${sim.H}`,
    `density mean: ${sim.J.toFixed(2)}`,
    `fps: ${sim.K}`,
    'status: ready',
  ];
  for (const text of items) {
    const d = document.createElement('div');
    d.className = 'bcode-line state-item';
    d.textContent = '\u2022 ' + text;   // • bullet
    el.appendChild(d);
  }
}

/* ================================================================
   Seed Content
   ================================================================
   Pre-populate all panes with BCODe-consistent, syntax-highlighted
   content matching the lava-lamp application profile.  The exact
   command/output pairs come from the .tui reference data.
   ================================================================ */

function seedDocs() {
  const el = $('docs-body');
  const examples = [
    { cmd: '24A 0.0s',       desc: 'set blob target' },
    { cmd: '4.9B 0.0s',      desc: 'radius pair example' },
    { cmd: '<18A 0.0s',      desc: 'bound-style input' },
    { cmd: '$neon$ 0.0s',    desc: 'string payload' },
    { cmd: '#414243# 0.0s',  desc: 'hex payload' },
    { cmd: '0.0q',           desc: 'query snapshot' },
  ];
  for (let i = 0; i < examples.length; i++) {
    const d = document.createElement('div');
    d.className = 'bcode-line doc-example';
    // ● for first item (selected), ○ for rest — matches TUI list
    const bullet = document.createElement('span');
    bullet.className = 'doc-bullet';
    bullet.textContent = i === 0 ? '\u25CF ' : '\u25CB ';
    const code = document.createElement('span');
    code.innerHTML = hl(examples[i].cmd);
    const desc = document.createElement('span');
    desc.className = 'doc-desc';
    desc.textContent = '  ' + examples[i].desc;
    d.append(bullet, code, desc);
    el.appendChild(d);
  }
}

function seedHistory() {
  // 5 command/output pairs as required — matches the request examples
  homeHistory.push(
    { cmd: '24A 0.0s',   output: '24A 0.0s' },
    { cmd: '4.8B 0.0s',  output: '4.8B 0.0s' },
    { cmd: '0.18C 0.0s', output: '0.18C 0.0s' },
    { cmd: '>20A 0.0s',  output: '24A 0.0s' },
    { cmd: '0.0q',       output: '312H 24I 0.63J 60K 0.0q' },
  );
}

function seedReqResp() {
  // Populated terminal view — from bcode-alpha-terminal-populated.tui
  termReqResp.push(
    { cmd: '24A 0.0s',   output: '24A 0.0s' },
    { cmd: '4.8B 0.0s',  output: '4.8B 0.0s' },
    { cmd: '0.18C 0.0s', output: '0.18C 0.0s' },
    { cmd: '>20A 0.0s',  output: '24A 0.0s' },
    { cmd: '0.0q',       output: '312H 24I 0.63J 60K 0.0q' },
  );
}

function seedFeed() {
  // Unsolicited telemetry lines — from bcode-alpha-terminal-populated.tui
  termFeed.push(
    '301H 24I 0.61J 59K 0.0u',
    '305H 24I 0.62J 60K 0.1u',
    '309H 24I 0.63J 60K 0.2u',
    '!309H 24I 0.63J 58K 0.3u',
    '312H 24I 0.64J 60K 0.4u',
    '318H 25I 0.66J 60K 0.5u',
    '324H 25I 0.67J 60K 0.6u',
    '329H 25I 0.68J 60K 0.7u',
  );
}

/* ================================================================
   Live Input Highlighting
   ================================================================
   On every keystroke the input mirror (#input-hl) is re-rendered
   with hljs.highlight().  The transparent <input> preserves caret,
   selection, copy/paste, and typing natively.  The mirror provides
   syntax colors in perfect alignment (same font metrics & padding).
   Partial/incomplete BCODe is highlighted as far as the grammar can
   match — no breakage for unterminated fields or payloads.
   ================================================================ */

function updateInputHighlight() {
  const text = $('cmd-input').value;
  $('input-hl').innerHTML = text ? hl(text) : '';
}

/* ================================================================
   Command Submission
   ================================================================
   Pressing Enter or clicking → processes the current input:
   1. Feed text to a fresh SABParser and collect events.
   2. If the line latched, generate an output line.
   3. Append to both Home history and Terminal req/resp.
   4. Re-render affected panes.
   5. Clear the input and highlight mirror.
   ================================================================ */

function submitCommand(text) {
  text = text.trim();
  if (!text) return;

  const parsed = parseCommand(text);
  const output = parsed.latched ? generateOutput(text, parsed) : null;
  const entry = { cmd: text, output };

  homeHistory.push(entry);
  termReqResp.push(entry);

  renderHistory();
  renderReqResp();
  renderStateFeed();

  $('cmd-input').value = '';
  updateInputHighlight();
  $('cmd-input').focus();
}

/* ================================================================
   Tab Switching
   ================================================================ */

function switchView(view) {
  currentView = view;
  document.querySelectorAll('.tab').forEach((t) =>
    t.classList.toggle('active', t.dataset.view === view)
  );
  $('home-view').classList.toggle('active', view === 'home');
  $('terminal-view').classList.toggle('active', view === 'terminal');

  // Home shows plain title; Terminal shows the action menu
  $('title-text').style.display = view === 'home' ? '' : 'none';
  $('term-menu').style.display  = view === 'terminal' ? '' : 'none';

  $('cmd-input').focus();
}

/* ================================================================
   Unsolicited Telemetry Feed
   ================================================================
   A 3-second interval timer adds a new telemetry line with slight
   random-walk variation in H, I, J, K.  Occasionally (~8%) the
   line is prefixed with ! (stale qualifier).  The feed is capped
   at 50 lines to prevent unbounded growth.
   ================================================================ */

function startFeedTimer() {
  feedTimer = setInterval(() => {
    sim.tick = parseFloat((sim.tick + 0.1).toFixed(1));

    // Random walk on derived metrics
    sim.H += Math.floor(Math.random() * 7 - 3);
    sim.H = Math.max(280, Math.min(350, sim.H));
    sim.I = Math.max(1, sim.A + Math.floor(Math.random() * 3 - 1));
    sim.J = parseFloat(Math.min(0.99, sim.H / 480).toFixed(2));
    sim.K = 58 + Math.floor(Math.random() * 4);

    const stale = Math.random() < 0.08 ? '!' : '';
    const line =
      `${stale}${sim.H}H ${sim.I}I ${sim.J.toFixed(2)}J ${sim.K}K ${sim.tick.toFixed(1)}u`;

    termFeed.push(line);
    if (termFeed.length > 50) termFeed.shift();

    if (currentView === 'terminal') renderFeed();
    renderStateFeed();
  }, 3000);
}

/* ================================================================
   Terminal Menu Actions
   ================================================================ */

function handleTermMenu(e) {
  const val = e.target.value;
  if (val === 'reset') {
    // Parser reset — clear session traffic
    termReqResp.length = 0;
    renderReqResp();
  } else if (val === 'clear') {
    // Clear unsolicited feed
    termFeed.length = 0;
    renderFeed();
  }
  // Always snap back to the label option
  e.target.selectedIndex = 0;
}

/* ================================================================
   Initialization
   ================================================================ */

function init() {
  // Seed all panes with BCODe-consistent example content
  seedDocs();
  seedHistory();
  seedReqResp();
  seedFeed();

  // Initial render
  renderHistory();
  renderReqResp();
  renderFeed();
  renderStateFeed();

  // Tab switching
  document.querySelectorAll('.tab').forEach((t) =>
    t.addEventListener('click', () => switchView(t.dataset.view))
  );

  // Command input: live highlighting + submit on Enter
  const input = $('cmd-input');
  input.addEventListener('input', updateInputHighlight);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitCommand(input.value);
  });

  // Send button
  $('send-btn').addEventListener('click', () =>
    submitCommand($('cmd-input').value)
  );
  $('send-btn').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') submitCommand($('cmd-input').value);
  });

  // Terminal menu
  $('term-menu').addEventListener('change', handleTermMenu);

  // Start unsolicited telemetry feed timer
  startFeedTimer();

  // Default to Home tab (matching TUI bcode-alpha-history.tui activeTab:0)
  switchView('home');
  input.focus();
}

init();
