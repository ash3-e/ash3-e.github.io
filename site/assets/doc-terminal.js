/**
 * doc-terminal.js — BCODe α terminal panel for documentation reader pages.
 *
 * Injects a full multi-pane terminal (matching term/terminal.html structure)
 * as a slide-up panel anchored to the reader content column width.
 * Uses SABParser + BCODe for real parse/compose; dispatches bcode:lava-params
 * to modulate the lava lamp simulation.
 *
 * Import paths are relative to assets/ → ../term/ for parser modules.
 */

import { SABParser, bcode_sab_state_name, bcode_sab_parse_error_name }
  from "../term/bcode_sab.js";
import BCODe from "../term/bcode.mjs";

// ── Guard: reader pages only ─────────────────────────────────────────────────

if (!document.querySelector(".reader-head")) {
  throw new Error("doc-terminal: not a reader page, aborting.");
}

// ── Guide content (mirrors app.js) ───────────────────────────────────────────

const GUIDE_ENTRIES = [
  { cmd: "24A 0.0s",   desc: "set blob target" },
  { cmd: "4.8B 0.0s",  desc: "set blob radius" },
  { cmd: "0.18C 0.0s", desc: "raise buoyancy" },
  { cmd: ">20A 0.0s",  desc: "clamp to at least 20 blobs" },
  { cmd: "0.0q",        desc: "query current sim snapshot" },
  { cmd: "1g",           desc: "enable glass rendering mode" },
  { cmd: "0g",           desc: "disable glass rendering mode" },
];

const GUIDE_NOTES = [
  "A B C drive the lamp profile.",
  "H I J K arrive from the sim snapshot.",
  "u traffic stays in the unsolicited feed.",
  "g toggles glass UI rendering layer.",
];

// ── Seeded history / feed ────────────────────────────────────────────────────

const SEEDED_HISTORY = [
  { cmd: "24A 0.0s",    output: "24A 0.0s" },
  { cmd: "4.8B 0.0s",   output: "4.8B 0.0s" },
  { cmd: "0.18C 0.0s",  output: "0.18C 0.0s" },
  { cmd: ">20A 0.0s",   output: "24A 0.0s" },
  { cmd: "0.0q",         output: "312H 24I 0.63J 60K 0.0q" },
];

const SEEDED_FEED = [
  "301H 24I 0.61J 59K 0.0u",
  "305H 24I 0.62J 60K 0.1u",
  "309H 24I 0.63J 60K 0.2u",
  "!309H 24I 0.63J 58K 0.3u",
  "312H 24I 0.64J 60K 0.4u",
  "318H 25I 0.66J 60K 0.5u",
];

// ── Runtime state ────────────────────────────────────────────────────────────

const state = {
  view:        "home",
  historyOpen: false,
  homeHistory: [...SEEDED_HISTORY],
  reqresp:     [...SEEDED_HISTORY],
  feed:        [...SEEDED_FEED],
  live: { text: "", latched: false, stateName: "normal", errors: [] },
};

const sim = {
  A: 24, B: 4.8, C: 0.18,
  H: 312, I: 24, J: 0.63, K: 60,
  tick: 0.5,
};

let feedTimer = null;

// ── Panel HTML ────────────────────────────────────────────────────────────────

function buildPanelHTML() {
  return `
<div id="doc-terminal-overlay" aria-hidden="false">
  <div id="doc-terminal-panel" role="complementary" aria-label="BCODe alpha terminal">
    <header id="dt-tab-bar">
      <div id="dt-tab-strip" role="tablist" aria-label="Views">
        <button type="button" class="dt-tab dt-active" data-dtview="home"
                role="tab" aria-selected="true">&#x2302; Home</button>
        <button type="button" class="dt-tab" data-dtview="terminal"
                role="tab" aria-selected="false">Terminal</button>
      </div>
      <div id="dt-title-area">
        <div id="dt-menu-wrap">
          <button type="button" id="dt-menu-btn"
                  aria-haspopup="true" aria-expanded="false">BCODe &#x03b1; &#x25be;</button>
          <div id="dt-menu-drop" role="menu" aria-hidden="true">
            <button type="button" class="dt-menu-item" data-action="reset"
                    role="menuitem">Parser reset - DEL</button>
            <button type="button" class="dt-menu-item" data-action="clear"
                    role="menuitem">Clear feed</button>
          </div>
        </div>
        <button type="button" id="dt-close-btn" aria-label="Close terminal">&#x2715;</button>
      </div>
    </header>

    <section id="dt-main-area">

      <section id="dt-home-view" class="dt-view dt-active" aria-label="Home view">
        <div class="dt-panes-row">
          <section class="dt-pane" aria-label="docs guide">
            <div class="dt-pane-label"> docs / guide </div>
            <div class="dt-pane-body" id="dt-docs-body"></div>
            <div class="dt-pane-foot">examples and docs</div>
          </section>
          <section class="dt-pane" aria-label="state feed">
            <div class="dt-pane-label">state feed</div>
            <div class="dt-pane-body" id="dt-state-body"></div>
            <div class="dt-pane-foot">live unsolicited state</div>
          </section>
        </div>
      </section>

      <section id="dt-terminal-view" class="dt-view" aria-label="Terminal view">
        <div class="dt-panes-row">
          <section class="dt-pane" aria-label="request response channel">
            <div class="dt-pane-label">request/response channel</div>
            <div class="dt-pane-body" id="dt-reqresp-body"></div>
          </section>
          <section class="dt-pane" aria-label="unsolicited feed">
            <div class="dt-pane-label">unsolicited feed</div>
            <div class="dt-pane-body" id="dt-feed-body"></div>
          </section>
        </div>
      </section>

      <section id="dt-history-panel" class="dt-hidden" aria-label="command output history">
        <div class="dt-history-label"> command / output history </div>
        <div id="dt-history-body"></div>
      </section>

    </section>

    <footer id="dt-command-bar">
      <div id="dt-cmd-box">
        <button type="button" id="dt-prompt" aria-label="Toggle history">[&gt;]</button>
        <div id="dt-input-wrap">
          <div id="dt-input-hl" aria-hidden="true"></div>
          <input id="dt-cmd-input" type="text" spellcheck="false"
                 autocomplete="off" autocapitalize="off"
                 aria-label="BCODe command input">
        </div>
      </div>
      <button type="button" id="dt-send-btn" aria-label="Send command">&#x2192;</button>
    </footer>
  </div>
  ${buildToggleBtnHTML()}
</div>`;
}

function buildToggleBtnHTML() {
  return `<button type="button" id="dt-toggle-btn" class="mode-switcher pill-btn"
    aria-pressed="false" aria-label="Toggle BCODe terminal">
  <img class="mode-switcher-icon" src="../assets/terminal.svg" alt="" aria-hidden="true">
</button>`;
}

// ── Inject HTML ───────────────────────────────────────────────────────────────

document.body.insertAdjacentHTML("beforeend", buildPanelHTML());

// ── DOM refs ──────────────────────────────────────────────────────────────────

const D = {
  panel:       document.getElementById("doc-terminal-panel"),
  toggleBtn:   document.getElementById("dt-toggle-btn"),
  tabs:        [...document.querySelectorAll(".dt-tab")],
  homeView:    document.getElementById("dt-home-view"),
  termView:    document.getElementById("dt-terminal-view"),
  docsBody:    document.getElementById("dt-docs-body"),
  stateBody:   document.getElementById("dt-state-body"),
  reqrespBody: document.getElementById("dt-reqresp-body"),
  feedBody:    document.getElementById("dt-feed-body"),
  historyPanel:document.getElementById("dt-history-panel"),
  historyBody: document.getElementById("dt-history-body"),
  prompt:      document.getElementById("dt-prompt"),
  sendBtn:     document.getElementById("dt-send-btn"),
  cmdInput:    document.getElementById("dt-cmd-input"),
  inputHl:     document.getElementById("dt-input-hl"),
  cmdBox:      document.getElementById("dt-cmd-box"),
  menuWrap:    document.getElementById("dt-menu-wrap"),
  menuBtn:     document.getElementById("dt-menu-btn"),
  menuDrop:    document.getElementById("dt-menu-drop"),
  closeBtn:    document.getElementById("dt-close-btn"),
};

// ── Panel open/close ──────────────────────────────────────────────────────────

let panelOpen = false;

function openPanel() {
  panelOpen = true;
  D.panel.classList.add("dt-open");
  D.toggleBtn?.setAttribute("aria-pressed", "true");
  D.toggleBtn?.classList.add("is-active");
  if (!feedTimer) feedTimer = setInterval(tickFeed, 2800);
  setTimeout(() => D.cmdInput.focus(), 60);
}

function closePanel() {
  panelOpen = false;
  D.panel.classList.remove("dt-open");
  D.toggleBtn?.setAttribute("aria-pressed", "false");
  D.toggleBtn?.classList.remove("is-active");
  closeMenu();
  clearInterval(feedTimer);
  feedTimer = null;
}

D.toggleBtn?.addEventListener("click", () => panelOpen ? closePanel() : openPanel());
D.closeBtn.addEventListener("click", closePanel);

// ── Width/position tracking ───────────────────────────────────────────────────

function pxNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function controlClusterGap() {
  const lavaToggle = document.querySelector(".reader-head .lava-toggle");
  const tableToggle = document.querySelector(".reader-head .reader-table-toggle");
  if (lavaToggle && tableToggle) {
    const lavaRect = lavaToggle.getBoundingClientRect();
    const tableRect = tableToggle.getBoundingClientRect();
    const gap = tableRect.left - lavaRect.right;
    if (Number.isFinite(gap) && gap > 0) return gap;
  }
  return 8;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function positionPanel() {
  const reader = document.querySelector(".reader") ||
                 document.querySelector(".reader-body") ||
                 document.querySelector(".container");
  const readerBody = document.querySelector("#readerBody") ||
                     document.querySelector(".reader-body") ||
                     reader;
  const content = document.querySelector("#content") ||
                  readerBody?.querySelector(".markdown-body") ||
                  reader;
  if (!reader || !readerBody || !content) return;

  const readerRect = reader.getBoundingClientRect();
  const readerBodyRect = readerBody.getBoundingClientRect();
  const contentRect = content.getBoundingClientRect();
  const splitView = document.body.classList.contains("codex-split-view");
  const dtStyle = getComputedStyle(document.documentElement);
  const lineHeight = pxNumber(dtStyle.getPropertyValue("--dt-rh"), 19);
  const panelTopOffset = 5;
  const naturalHeight = Math.min(
    Math.round(lineHeight * 22),
    Math.round(window.innerHeight * 0.58)
  );
  const availableHeight = Math.max(180, Math.round(window.innerHeight - 24));
  const panelHeight = clamp(naturalHeight - panelTopOffset, 175, availableHeight);

  D.panel.style.left = `${Math.round(readerRect.left)}px`;
  D.panel.style.width = `${Math.round(readerRect.width)}px`;
  D.panel.style.bottom = "0px";
  D.panel.style.height = `${Math.round(panelHeight)}px`;

  const toggleWidth = Math.max(34, Math.round(D.toggleBtn?.offsetWidth || 34));
  const toggleHalf = toggleWidth / 2;
  const gap = controlClusterGap();
  const bodyStyle = getComputedStyle(readerBody);
  const rightInset = Math.max(8, pxNumber(bodyStyle.borderRightWidth, 0) + 6);
  const fullscreenScrollbarGapTrim = splitView ? 0 : 4;
  const gutterLeft = contentRect.right;
  const gutterRight = Math.max(gutterLeft + 18, readerBodyRect.right - rightInset - fullscreenScrollbarGapTrim);
  const gutterCenter = gutterLeft + ((gutterRight - gutterLeft) / 2);
  const toggleNudgeX = .50; // could be tweaked to shift the toggle left/right based on layout
  const maxToggleCenter = gutterRight - toggleHalf;
  const minToggleCenter = gutterLeft + toggleHalf;
  let toggleCenterX;
  let toggleBottom;
  const modeKey = splitView ? "split" : "full";
  const cachedInsetFromRight = toggleInsetFromRightByMode[modeKey];

  if (splitView) {
    toggleBottom = Math.max(8, Math.round(gap));
    const baseRightEdgeGap = Math.max(8, Math.round((readerRect.right - gutterRight) + toggleBottom));
    const targetRightEdgeGap = baseRightEdgeGap * 3;
    toggleCenterX = readerRect.right - targetRightEdgeGap - toggleHalf;
    toggleCenterX = clamp(toggleCenterX, readerRect.left + toggleHalf + 4, readerRect.right - toggleHalf - 4);
    toggleInsetFromRightByMode[modeKey] = readerRect.right - toggleCenterX;
  } else {
    toggleCenterX = gutterCenter + toggleNudgeX;
    toggleBottom = 14;
    toggleCenterX = clamp(toggleCenterX, minToggleCenter, maxToggleCenter);
    if (cachedInsetFromRight == null) {
      toggleInsetFromRightByMode[modeKey] = readerRect.right - toggleCenterX;
    }
    toggleCenterX = readerRect.right - (toggleInsetFromRightByMode[modeKey] ?? 0);
    toggleCenterX = clamp(toggleCenterX, readerRect.left + toggleHalf + 4, readerRect.right - toggleHalf - 4);
  }
  D.toggleBtn.style.left = `${toggleCenterX.toFixed(2)}px`;
  D.toggleBtn.style.bottom = `${Math.round(toggleBottom)}px`;
  D.panel.classList.add("dt-positioned");
}

let lastLayoutKey = "";
let layoutSyncTimer = 0;
let layoutSyncRaf = 0;
let layoutSyncDeadline = 0;
const toggleInsetFromRightByMode = { full: null, split: null };

function stopPanelPositionTracking() {
  if (layoutSyncRaf) {
    window.cancelAnimationFrame(layoutSyncRaf);
    layoutSyncRaf = 0;
  }
  layoutSyncDeadline = 0;
}

function trackPanelPosition(duration = 460) {
  stopPanelPositionTracking();
  layoutSyncDeadline = performance.now() + Math.max(0, duration);
  const tick = () => {
    layoutSyncRaf = 0;
    positionPanel();
    if (performance.now() < layoutSyncDeadline) {
      layoutSyncRaf = window.requestAnimationFrame(tick);
    } else {
      layoutSyncDeadline = 0;
      positionPanel();
    }
  };
  layoutSyncRaf = window.requestAnimationFrame(tick);
}

function layoutKey() {
  const body = document.body;
  if (!body) return "";
  return [
    body.classList.contains("codex-split-view") ? "split" : "full",
    body.classList.contains("meta-collapsed") ? "toc-closed" : "toc-open",
    body.classList.contains("reader-table-open") ? "table-open" : "table-closed",
    body.classList.contains("split-fill-left") ? "fill-left" : "",
    body.classList.contains("split-fill-right") ? "fill-right" : "",
    body.style.getPropertyValue("--reader-split-max-width") || ""
  ].join("|");
}

function queuePanelPositionSync(duration = 460) {
  positionPanel();
  trackPanelPosition(duration);
  if (layoutSyncTimer) {
    window.clearTimeout(layoutSyncTimer);
    layoutSyncTimer = 0;
  }
  layoutSyncTimer = window.setTimeout(() => {
    layoutSyncTimer = 0;
    stopPanelPositionTracking();
    positionPanel();
  }, duration + 40);
}

positionPanel();
window.addEventListener("resize", () => queuePanelPositionSync(260));
requestAnimationFrame(() => requestAnimationFrame(() => queuePanelPositionSync(260)));

const bodyClassObserver = new MutationObserver(() => {
  const nextKey = layoutKey();
  if (nextKey === lastLayoutKey) return;
  lastLayoutKey = nextKey;
  queuePanelPositionSync();
  bindLayoutObservers();
});

let layoutResizeObserver = null;
let observedLayoutNodes = [];

function bindLayoutObservers() {
  if (typeof ResizeObserver === "undefined") return;
  const reader = document.querySelector(".reader");
  const readerBody = document.querySelector("#readerBody") || document.querySelector(".reader-body");
  const content = document.querySelector("#content") || readerBody?.querySelector(".markdown-body");
  const nextNodes = [reader, readerBody, content].filter(Boolean);
  if (
    layoutResizeObserver &&
    observedLayoutNodes.length === nextNodes.length &&
    observedLayoutNodes.every((node, idx) => node === nextNodes[idx])
  ) {
    return;
  }
  if (layoutResizeObserver) {
    observedLayoutNodes.forEach((node) => layoutResizeObserver.unobserve(node));
  } else {
    layoutResizeObserver = new ResizeObserver(() => queuePanelPositionSync(260));
  }
  observedLayoutNodes = nextNodes;
  observedLayoutNodes.forEach((node) => layoutResizeObserver.observe(node));
}

lastLayoutKey = layoutKey();
if (document.body) {
  bodyClassObserver.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
}
bindLayoutObservers();

// ── Utility ───────────────────────────────────────────────────────────────────

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlightBcode(text) {
  if (!text) return "";
  if (!window.hljs) return escapeHtml(text);
  try {
    return window.hljs.highlight(text, { language: "bcode", ignoreIllegals: true }).value;
  } catch {
    return escapeHtml(text);
  }
}

function fmtNum(v) {
  if (!Number.isFinite(v)) return String(v);
  if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
  return v.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

// ── BCODe compose helpers ─────────────────────────────────────────────────────

function makeField(val, q = {}) {
  return { strValue: String(val), greaterthan: !!q.gt, lessthan: !!q.lt, indefinite: !!q.indef };
}

function composeLine(params, cmdValue, cmdCode, opts = {}) {
  const record = {
    params: {},
    cmd:    makeField(cmdValue, opts.cmdQ),
    code:   cmdCode,
  };
  params.forEach(p => {
    record.params[p.term] = makeField(p.value, p.q);
  });
  const s = BCODe.Line.compose([record]).replace(/\r?\n$/, "");
  return opts.leading ? opts.leading + s : s;
}

function snapshotParts() {
  return [
    { term: "H", value: fmtNum(sim.H) },
    { term: "I", value: fmtNum(sim.I) },
    { term: "J", value: fmtNum(sim.J) },
    { term: "K", value: fmtNum(sim.K) },
  ];
}

function buildTelemetryLine({ tick = sim.tick, stale = false } = {}) {
  return composeLine(snapshotParts(), fmtNum(tick), "u", { leading: stale ? "!" : "" });
}

// ── Simulation helpers ────────────────────────────────────────────────────────

function resetSim() {
  sim.A = 24; sim.B = 4.8; sim.C = 0.18;
  sim.H = 312; sim.I = 24; sim.J = 0.63; sim.K = 60; sim.tick = 0.5;
}

function updateDerived() {
  sim.H = Math.max(280, Math.round(255 + sim.A * 2.3 + sim.B * 7.5 + sim.C * 145 + Math.random() * 8));
  sim.I = Math.max(1, Math.round(sim.A + (Math.random() * 2 - 0.5)));
  sim.J = Number(Math.min(0.98, 0.44 + sim.H / 1600 + sim.C * 0.18).toFixed(2));
  sim.K = Math.max(57, Math.min(61, Math.round(60 - Math.abs(sim.C - 0.18) * 10 + (Math.random() * 2 - 1))));
}

function dispatchLavaParams(A, B, C) {
  const detail = {};
  if (A != null) detail.A = A;
  if (B != null) detail.B = B;
  if (C != null) detail.C = C;
  if (Object.keys(detail).length > 0) {
    window.dispatchEvent(new CustomEvent("bcode:lava-params", { detail }));
  }
}

// ── DOM builders (mirror app.js) ─────────────────────────────────────────────

function mkHlLine(text, extra = "") {
  const d = document.createElement("div");
  d.className = "dt-bcode-line" + (extra ? " " + extra : "");
  d.innerHTML = highlightBcode(text);
  return d;
}

function mkOutputLine(text) {
  const d = document.createElement("div");
  d.className = "dt-bcode-line";
  const pre = document.createElement("span");
  pre.className = "dt-output-prefix";
  pre.textContent = "\u25cb ";
  const body = document.createElement("span");
  body.innerHTML = highlightBcode(text);
  d.append(pre, body);
  return d;
}

function mkBlank() {
  const d = document.createElement("div");
  d.className = "dt-blank-line";
  return d;
}

function mkStateLine(bullet, key, val) {
  const d = document.createElement("div");
  d.className = "dt-state-line";
  const b = document.createElement("span");
  b.className = "dt-state-bullet"; b.textContent = bullet;
  const k = document.createElement("span");
  k.className = "dt-state-key"; k.textContent = key + ": ";
  const v = document.createElement("span");
  v.className = "dt-state-val"; v.textContent = val;
  d.append(b, k, v);
  return d;
}

// ── Render functions ──────────────────────────────────────────────────────────

function renderGuide() {
  D.docsBody.innerHTML = "";
  GUIDE_ENTRIES.forEach((entry, i) => {
    const row = document.createElement("div");
    row.className = "dt-guide-entry";

    const bullet = document.createElement("span");
    bullet.className = "dt-guide-bullet";
    bullet.textContent = i === 0 ? "\u25cf" : "\u25cb";

    const code = document.createElement("code");
    code.className = "dt-guide-code hljs language-bcode";
    code.innerHTML = highlightBcode(entry.cmd);

    const desc = document.createElement("span");
    desc.className = "dt-guide-desc";
    desc.textContent = entry.desc;

    row.append(bullet, code, desc);
    D.docsBody.append(row);
  });

  D.docsBody.append(mkBlank());

  GUIDE_NOTES.forEach(note => {
    const d = document.createElement("div");
    d.className = "dt-guide-note";
    d.textContent = note;
    D.docsBody.append(d);
  });
}

function renderHistory() {
  D.historyBody.innerHTML = "";
  state.homeHistory.forEach(e => {
    D.historyBody.append(mkHlLine(e.cmd));
    if (e.output) D.historyBody.append(mkOutputLine(e.output));
    D.historyBody.append(mkBlank());
  });
  D.historyBody.scrollTop = D.historyBody.scrollHeight;
}

function renderReqResp() {
  D.reqrespBody.innerHTML = "";
  state.reqresp.forEach(e => {
    D.reqrespBody.append(mkHlLine(e.cmd));
    if (e.output) D.reqrespBody.append(mkOutputLine(e.output));
    D.reqrespBody.append(mkBlank());
  });
  D.reqrespBody.scrollTop = D.reqrespBody.scrollHeight;
}

function renderFeed() {
  D.feedBody.innerHTML = "";
  state.feed.forEach(line => D.feedBody.append(mkHlLine(line)));
  D.feedBody.scrollTop = D.feedBody.scrollHeight;
}

function renderStateFeed() {
  D.stateBody.innerHTML = "";
  const ps = state.live.stateName || "normal";
  [
    { key: "parser",       val: state.live.errors.length ? `${ps} / error` : ps },
    { key: "blobs",        val: String(sim.I) },
    { key: "cells",        val: String(sim.H) },
    { key: "density mean", val: String(sim.J) },
    { key: "fps",          val: String(sim.K) },
    { key: "status",       val: state.live.errors.length ? "parse error" : "ready" },
  ].forEach(item => D.stateBody.append(mkStateLine("\u2022", item.key, item.val)));
}

// ── Input mirror + live parser ────────────────────────────────────────────────

function updateMirror() {
  const text = D.cmdInput.value;
  if (D.inputHl) {
    D.inputHl.innerHTML = text ? (highlightBcode(text) + "&nbsp;") : "";
    D.inputHl.scrollLeft = D.cmdInput.scrollLeft;
  }
  state.live = analyzeLive(text);
  renderStateFeed();
}

function analyzeLive(text) {
  const snap = { latched: false, stateName: "normal", errors: [] };
  try {
    const p = new SABParser({
      on_line_latched() { snap.latched = true; },
      on_parse_error(_, code, byte, st) {
        snap.errors.push({
          code, errorName: bcode_sab_parse_error_name(code),
          offendingByte: byte, stateName: bcode_sab_state_name(st),
        });
      },
    });
    p.feed(text);
    snap.stateName = bcode_sab_state_name(p.state);
  } catch (err) {
    snap.errors.push({ code: "RT", errorName: err.message, offendingByte: 0, stateName: "runtime" });
  }
  return snap;
}

async function parseLine(text) {
  try {
    const lines = await BCODe.parseData(text);
    return lines[0] || null;
  } catch {
    return null;
  }
}

// ── Command processing ────────────────────────────────────────────────────────

function applySet(line) {
  const touched = [];
  let A = null, B = null, C = null;
  ["A", "B", "C"].forEach(term => {
    if (!line.bool(term)) return;
    const f  = line.params[term];
    const nv = line.numeric(term);
    if      (f.greaterthan) sim[term] = Math.max(sim[term], nv);
    else if (f.lessthan)    sim[term] = Math.min(sim[term], nv);
    else                    sim[term] = nv;
    touched.push({ term, value: fmtNum(sim[term]) });
    if (term === "A") A = sim.A;
    if (term === "B") B = sim.B;
    if (term === "C") C = sim.C;
  });
  updateDerived();
  dispatchLavaParams(A, B, C);
  return composeLine(touched, "0.0", "s");
}

function applyGlassMode(line) {
  const nv = line.cmd ? parseFloat(line.cmd.strValue) : 0;
  const enable = nv >= 1;
  window.dispatchEvent(new CustomEvent("bcode:glass-mode", { detail: { enabled: enable } }));
  return composeLine([], enable ? "1" : "0", "g");
}

function generateOutput(raw, line) {
  if (!line) return null;
  switch (line.code) {
    case "s": return applySet(line);
    case "q": return composeLine(snapshotParts(), "0.0", "q");
    case "r": resetSim(); return composeLine([], "0.0", "r");
    case "g": return applyGlassMode(line);
    default:  return raw;
  }
}

function appendTransaction(cmd, output) {
  const e = { cmd, output };
  state.homeHistory.push(e);
  state.reqresp.push(e);
  if (state.homeHistory.length > 18) state.homeHistory.shift();
  if (state.reqresp.length > 18)     state.reqresp.shift();
}

async function submit() {
  const text = D.cmdInput.value.trim();
  if (!text) return;

  let output = text;
  try {
    const line = await parseLine(text);
    if (line) output = generateOutput(text, line) ?? text;
  } catch { /* echo raw */ }

  appendTransaction(text, output);
  renderHistory();
  renderReqResp();
  renderStateFeed();

  D.cmdInput.value = "";
  updateMirror();
  D.cmdInput.focus();
}

// ── Tab switching ─────────────────────────────────────────────────────────────

function switchView(view) {
  state.view = view;
  D.tabs.forEach(tab => {
    const active = tab.dataset.dtview === view;
    tab.classList.toggle("dt-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  D.homeView.classList.toggle("dt-active",  view === "home");
  D.termView.classList.toggle("dt-active",  view === "terminal");
  if (view !== "terminal") closeMenu();
}

// ── BCODe α menu ─────────────────────────────────────────────────────────────

function openMenu() {
  D.menuDrop.classList.add("dt-open");
  D.menuBtn.setAttribute("aria-expanded", "true");
  D.menuDrop.setAttribute("aria-hidden", "false");
}

function closeMenu() {
  D.menuDrop.classList.remove("dt-open");
  D.menuBtn.setAttribute("aria-expanded", "false");
  D.menuDrop.setAttribute("aria-hidden", "true");
}

D.menuBtn.addEventListener("click", e => {
  e.stopPropagation();
  D.menuDrop.classList.contains("dt-open") ? closeMenu() : openMenu();
});

D.menuDrop.addEventListener("click", e => {
  const item = e.target.closest(".dt-menu-item");
  if (!item) return;
  closeMenu();
  if (item.dataset.action === "reset") {
    state.reqresp.length = 0;
    renderReqResp();
    D.cmdInput.value = "";
    updateMirror();
  } else if (item.dataset.action === "clear") {
    state.feed.length = 0;
    renderFeed();
    renderStateFeed();
  }
  D.cmdInput.focus();
});

document.addEventListener("click", e => {
  if (!D.menuWrap.contains(e.target)) closeMenu();
});

// ── [>] history drawer ────────────────────────────────────────────────────────

D.prompt.addEventListener("click", () => {
  state.historyOpen = !state.historyOpen;
  D.historyPanel.classList.toggle("dt-hidden", !state.historyOpen);
  D.cmdInput.focus();
});

// ── Feed ticker ───────────────────────────────────────────────────────────────

function tickFeed() {
  sim.tick = Number((sim.tick + 0.1).toFixed(1));
  sim.H = Math.max(280, Math.min(360, sim.H + Math.round(Math.random() * 8 - 3)));
  sim.I = Math.max(1,   Math.min(48,  sim.I + Math.round(Math.random() * 2 - 0.3)));
  sim.J = Number(Math.min(0.99, 0.45 + sim.H / 1600 + Math.random() * 0.02).toFixed(2));
  sim.K = Math.max(57,  Math.min(61,  59 + Math.round(Math.random() * 2)));

  const stale = Math.random() < 0.08;
  let line;
  try {
    line = buildTelemetryLine({ tick: sim.tick, stale });
  } catch {
    const t = fmtNum(sim.tick);
    line = `${stale ? "!" : ""}${sim.H}H ${sim.I}I ${sim.J}J ${sim.K}K ${t}u`;
  }

  state.feed.push(line);
  if (state.feed.length > 50) state.feed.shift();

  renderFeed();
  renderStateFeed();
}

// ── Wire up events ────────────────────────────────────────────────────────────

D.tabs.forEach(tab => tab.addEventListener("click", () => switchView(tab.dataset.dtview)));

D.cmdInput.addEventListener("input", updateMirror);
D.cmdInput.addEventListener("scroll", () => {
  if (D.inputHl) D.inputHl.scrollLeft = D.cmdInput.scrollLeft;
});
D.cmdInput.addEventListener("keydown", async e => {
  if (e.key === "Enter") { e.preventDefault(); await submit(); }
  if (e.key === "Escape") { closePanel(); }
});

D.sendBtn.addEventListener("click", () => submit());

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeMenu();
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────

renderGuide();
renderHistory();
renderReqResp();
renderFeed();
renderStateFeed();
switchView("home");
// feedTimer starts only when the panel is opened, not at page load.
