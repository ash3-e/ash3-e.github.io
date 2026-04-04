// ── Import paths relative to term/ ──────────────────────────────────────────
// bcode_sab.js and bcode.mjs live next to this file in term/
import { SABParser, bcode_sab_state_name, bcode_sab_parse_error_name } from "./bcode_sab.js";
import BCODe from "./bcode.mjs";

// type="module" implies defer — DOM is assembled when this runs.

// ── DOM refs ─────────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

const DOM = {
  body:          document.body,
  tabs:          [...document.querySelectorAll(".tab")],
  homeView:      $("home-view"),
  terminalView:  $("terminal-view"),
  docsBody:      $("docs-body"),
  stateBody:     $("state-body"),
  historyPanel:  $("history-panel"),
  historyBody:   $("history-body"),
  reqrespBody:   $("reqresp-body"),
  feedBody:      $("feed-body"),
  prompt:        $("prompt"),
  sendBtn:       $("send-btn"),
  cmdInput:      $("cmd-input"),
  inputMirror:   $("input-hl"),
  cmdBox:        $("cmd-box"),
  termMenuWrap:  $("term-menu-wrap"),
  termMenuBtn:   $("term-menu-btn"),
  termMenuDrop:  $("term-menu-drop"),
};

// ── Guide content ─────────────────────────────────────────────────────────────

const GUIDE_ENTRIES = [
  { cmd: "24A 0.0s",  desc: "set blob target" },
  { cmd: "4.8B 0.0s", desc: "set blob radius" },
  { cmd: "0.18C 0.0s",desc: "raise buoyancy" },
  { cmd: ">20A 0.0s", desc: "clamp to at least 20 blobs" },
  { cmd: "0.0q",       desc: "query current sim snapshot" },
];

const GUIDE_NOTES = [
  "Enter latches only when a real BCODe command terminator commits.",
  "A B C drive the lamp profile; H I J K arrive from the sim snapshot.",
  "u traffic stays unsolicited and separate from the request/response channel.",
];

// ── Seeded data ───────────────────────────────────────────────────────────────

const SEEDED_HISTORY = [
  { cmd: "24A 0.0s",  output: "24A 0.0s" },
  { cmd: "4.8B 0.0s", output: "4.8B 0.0s" },
  { cmd: "0.18C 0.0s",output: "0.18C 0.0s" },
  { cmd: ">20A 0.0s", output: "24A 0.0s" },
  { cmd: "0.0q",       output: "312H 24I 0.63J 60K 0.0q" },
];

const SEEDED_FEED = [
  "301H 24I 0.61J 59K 0.0u",
  "305H 24I 0.62J 60K 0.1u",
  "309H 24I 0.63J 60K 0.2u",
  "!309H 24I 0.63J 58K 0.3u",
  "312H 24I 0.64J 60K 0.4u",
  "318H 25I 0.66J 60K 0.5u",
];

// ── Runtime state ─────────────────────────────────────────────────────────────

const state = {
  view:        "home",
  historyOpen: false,          // history drawer starts closed
  homeHistory: [...SEEDED_HISTORY],
  reqresp:     [...SEEDED_HISTORY],
  feed:        [...SEEDED_FEED],
  live: {
    text:      "",
    latched:   false,
    stateName: "normal",
    errors:    [],
  },
};

// ── Simulation values (lava-lamp profile) ────────────────────────────────────

const sim = {
  A: 24,    // blob count target
  B: 4.8,   // radius / size
  C: 0.18,  // buoyancy / drift
  H: 312,   // dense cell count
  I: 24,    // visible blob count
  J: 0.63,  // average density
  K: 60,    // fps / tick rate
  tick: 0.5,
};

let feedTimer = null;

// ── Utility ───────────────────────────────────────────────────────────────────

function escapeHtml(text) {
  return String(text)
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

function formatNumber(value) {
  if (!Number.isFinite(value)) return String(value);
  if (Math.abs(value - Math.round(value)) < 1e-9) return String(Math.round(value));
  return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

// ── BCODe composition helpers ─────────────────────────────────────────────────

function createComposeField(strValue, qualifiers = {}) {
  return {
    strValue:     String(strValue),
    greaterthan:  !!qualifiers.greaterthan,
    lessthan:     !!qualifiers.lessthan,
    indefinite:   !!qualifiers.indefinite,
  };
}

function composeLine(params, cmdValue, cmdCode, options = {}) {
  const record = {
    params: {},
    cmd:    createComposeField(cmdValue, options.cmdQualifiers),
    code:   cmdCode,
  };
  params.forEach((part) => {
    record.params[part.term] = createComposeField(part.value, part.qualifiers);
  });
  const composed = BCODe.Line.compose([record]);
  const trimmed  = composed.replace(/\r?\n$/, "");
  return options.leading ? `${options.leading}${trimmed}` : trimmed;
}

function currentSnapshotParts() {
  return [
    { term: "H", value: formatNumber(sim.H) },
    { term: "I", value: formatNumber(sim.I) },
    { term: "J", value: formatNumber(sim.J) },
    { term: "K", value: formatNumber(sim.K) },
  ];
}

function buildTelemetryLine({ tick = sim.tick, stale = false } = {}) {
  return composeLine(currentSnapshotParts(), formatNumber(tick), "u", { leading: stale ? "!" : "" });
}

// ── Simulation ────────────────────────────────────────────────────────────────

function resetSimulation() {
  sim.A = 24; sim.B = 4.8; sim.C = 0.18;
  sim.H = 312; sim.I = 24; sim.J = 0.63; sim.K = 60; sim.tick = 0.5;
}

function updateDerivedState() {
  sim.H = Math.max(280, Math.round(255 + sim.A * 2.3 + sim.B * 7.5 + sim.C * 145 + Math.random() * 8));
  sim.I = Math.max(1, Math.round(sim.A + (Math.random() * 2 - 0.5)));
  sim.J = Number(Math.min(0.98, 0.44 + sim.H / 1600 + sim.C * 0.18).toFixed(2));
  sim.K = Math.max(57, Math.min(61, Math.round(60 - Math.abs(sim.C - 0.18) * 10 + (Math.random() * 2 - 1))));
}

// ── DOM builders ──────────────────────────────────────────────────────────────

function createHighlightedLine(text, extraClass = "") {
  const line = document.createElement("div");
  line.className = `bcode-line${extraClass ? ` ${extraClass}` : ""}`;
  line.innerHTML = highlightBcode(text);
  return line;
}

function createOutputLine(text) {
  const line = document.createElement("div");
  line.className = "bcode-line";
  const prefix = document.createElement("span");
  prefix.className = "output-prefix";
  prefix.textContent = "\u25cb ";    // ○
  const body = document.createElement("span");
  body.innerHTML = highlightBcode(text);
  line.append(prefix, body);
  return line;
}

function createBlankLine() {
  const line = document.createElement("div");
  line.className = "blank-line";
  return line;
}

function createStateLine(bullet, keyText, valText) {
  const line = document.createElement("div");
  line.className = "state-line";

  const b = document.createElement("span");
  b.className = "state-bullet";
  b.textContent = bullet;

  const k = document.createElement("span");
  k.className = "state-key";
  k.textContent = keyText + ": ";

  const v = document.createElement("span");
  v.className = "state-val";
  v.textContent = valText;

  line.append(b, k, v);
  return line;
}

// ── Render functions ──────────────────────────────────────────────────────────

function renderGuide() {
  DOM.docsBody.innerHTML = "";
  GUIDE_ENTRIES.forEach((entry, index) => {
    const row = document.createElement("div");
    row.className = "guide-entry";

    const bullet = document.createElement("span");
    bullet.className = "guide-bullet";
    bullet.textContent = index === 0 ? "\u25cf" : "\u25cb";    // ● / ○

    const code = document.createElement("code");
    code.className = "guide-code hljs language-bcode";
    code.innerHTML = highlightBcode(entry.cmd);

    const desc = document.createElement("span");
    desc.className = "guide-desc";
    desc.textContent = entry.desc;

    row.append(bullet, code, desc);
    DOM.docsBody.append(row);
  });

  DOM.docsBody.append(createBlankLine());

  GUIDE_NOTES.forEach((note) => {
    const line = document.createElement("div");
    line.className = "guide-note";
    line.textContent = note;
    DOM.docsBody.append(line);
  });
}

function renderHistory() {
  DOM.historyBody.innerHTML = "";
  state.homeHistory.forEach((entry) => {
    DOM.historyBody.append(createHighlightedLine(entry.cmd));
    if (entry.output) DOM.historyBody.append(createOutputLine(entry.output));
    DOM.historyBody.append(createBlankLine());
  });
  DOM.historyBody.scrollTop = DOM.historyBody.scrollHeight;
}

function renderReqResp() {
  DOM.reqrespBody.innerHTML = "";
  state.reqresp.forEach((entry) => {
    DOM.reqrespBody.append(createHighlightedLine(entry.cmd));
    if (entry.output) DOM.reqrespBody.append(createOutputLine(entry.output));
    DOM.reqrespBody.append(createBlankLine());
  });
  DOM.reqrespBody.scrollTop = DOM.reqrespBody.scrollHeight;
}

function renderFeed() {
  DOM.feedBody.innerHTML = "";
  state.feed.forEach((line) => {
    DOM.feedBody.append(createHighlightedLine(line));
  });
  DOM.feedBody.scrollTop = DOM.feedBody.scrollHeight;
}

// State feed: structured bullet-list reflecting live sim/parser state.
function renderHomeStateFeed() {
  DOM.stateBody.innerHTML = "";
  const parserState = state.live.stateName || "normal";
  const items = [
    { key: "parser",       val: state.live.errors.length ? `${parserState} / error` : parserState },
    { key: "blobs",        val: String(sim.I) },
    { key: "cells",        val: String(sim.H) },
    { key: "density mean", val: String(sim.J) },
    { key: "fps",          val: String(sim.K) },
    { key: "status",       val: state.live.errors.length ? "parse error" : "ready" },
  ];
  items.forEach((item) => {
    DOM.stateBody.append(createStateLine("\u2022", item.key, item.val));  // •
  });
}

// ── Input mirror (live syntax highlight) ─────────────────────────────────────

function updateInputMirror() {
  const text = DOM.cmdInput.value;
  DOM.inputMirror.innerHTML = text ? (highlightBcode(text) + "&nbsp;") : "";
  // Sync horizontal scroll so the mirror tracks cursor position
  DOM.inputMirror.scrollLeft = DOM.cmdInput.scrollLeft;
  state.live = analyzeLiveStream(text);
  const errorText = state.live.errors.length ? ` / ${state.live.errors[0].errorName}` : "";
  DOM.cmdBox.title = text
    ? `parser: ${state.live.stateName}${state.live.latched ? " / latched" : ""}${errorText}`
    : "";
  // Refresh state feed whenever parse state changes
  renderHomeStateFeed();
}

// ── SABParser integration ─────────────────────────────────────────────────────

function analyzeLiveStream(text) {
  const snapshot = { latched: false, stateName: "normal", errors: [] };
  const parser = new SABParser({
    on_line_latched() { snapshot.latched = true; },
    on_parse_error(_, code, offendingByte, st) {
      snapshot.errors.push({
        code, errorName: bcode_sab_parse_error_name(code), offendingByte,
        stateName: bcode_sab_state_name(st),
      });
    },
  });
  try {
    parser.feed(text);
  } catch (err) {
    snapshot.errors.push({ code: "RUNTIME", errorName: err.message, offendingByte: 0, stateName: "runtime" });
  }
  snapshot.stateName = bcode_sab_state_name(parser.state);
  return snapshot;
}

async function parseReferenceLine(text) {
  try {
    const lines = await BCODe.parseData(text);
    return lines[0] || null;
  } catch {
    return null;
  }
}

// ── Command processing ────────────────────────────────────────────────────────

function applySetLine(line) {
  const touched = [];
  ["A", "B", "C"].forEach((term) => {
    if (!line.bool(term)) return;
    const field    = line.params[term];
    const nextVal  = line.numeric(term);
    if      (field.greaterthan) sim[term] = Math.max(sim[term], nextVal);
    else if (field.lessthan)    sim[term] = Math.min(sim[term], nextVal);
    else                        sim[term] = nextVal;
    touched.push({ term, value: formatNumber(sim[term]) });
  });
  updateDerivedState();
  return composeLine(touched, "0.0", "s");
}

function generateOutput(rawText, line) {
  if (!line) return null;
  switch (line.code) {
    case "s": return applySetLine(line);
    case "q": return composeLine(currentSnapshotParts(), "0.0", "q");
    case "r": resetSimulation(); return composeLine([], "0.0", "r");
    default:  return rawText;
  }
}

function appendTransaction(cmd, output) {
  const entry = { cmd, output };
  state.homeHistory.push(entry);
  state.reqresp.push(entry);
  if (state.homeHistory.length > 18) state.homeHistory.shift();
  if (state.reqresp.length > 18)     state.reqresp.shift();
}

async function submitCurrentCommand() {
  const text = DOM.cmdInput.value.trim();
  if (!text) return;

  // Always submit on Enter/send — don't gate on latch state.
  // Try proper BCODe parse to generate a meaningful output; fall back to
  // echoing the raw input if parsing fails (mirrors antigravity behaviour).
  let output = text;
  try {
    const line = await parseReferenceLine(text);
    if (line) output = generateOutput(text, line) ?? text;
  } catch { /* keep raw echo */ }

  appendTransaction(text, output);
  renderHistory();
  renderReqResp();
  renderHomeStateFeed();

  DOM.cmdInput.value = "";
  updateInputMirror();
  DOM.cmdInput.focus();
}

// ── View switching ────────────────────────────────────────────────────────────

function switchView(view) {
  state.view = view;
  DOM.body.dataset.view = view;

  DOM.tabs.forEach((tab) => {
    const active = tab.dataset.view === view;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
  });

  DOM.homeView.classList.toggle("active",     view === "home");
  DOM.terminalView.classList.toggle("active", view === "terminal");

  // Custom dropdown visibility is handled entirely by CSS (body[data-view="terminal"]).
  // Close the dropdown if we're switching away from terminal.
  if (view !== "terminal") closeTermMenu();
}

// ── Terminal menu (custom dropdown) ──────────────────────────────────────────

function openTermMenu() {
  DOM.termMenuDrop.classList.add("open");
  DOM.termMenuBtn.setAttribute("aria-expanded", "true");
  DOM.termMenuDrop.setAttribute("aria-hidden", "false");
}

function closeTermMenu() {
  DOM.termMenuDrop.classList.remove("open");
  DOM.termMenuBtn.setAttribute("aria-expanded", "false");
  DOM.termMenuDrop.setAttribute("aria-hidden", "true");
}

function toggleTermMenu() {
  if (DOM.termMenuDrop.classList.contains("open")) closeTermMenu();
  else openTermMenu();
}

function handleTermMenuAction(action) {
  closeTermMenu();
  if (action === "reset") {
    // Parser reset: clear request/response channel and input
    state.reqresp.length = 0;
    renderReqResp();
    DOM.cmdInput.value = "";
    updateInputMirror();
  } else if (action === "clear") {
    // Clear unsolicited feed
    state.feed.length = 0;
    renderFeed();
    renderHomeStateFeed();
  }
  DOM.cmdInput.focus();
}

// ── [>] prompt button ─────────────────────────────────────────────────────────

function handlePrompt() {
  // [>] toggles history drawer in both Home and Terminal views.
  // History panel now lives in #main-area (outside any view), so it can
  // overlay whichever view is currently active.
  state.historyOpen = !state.historyOpen;
  DOM.historyPanel.classList.toggle("hidden", !state.historyOpen);
  DOM.cmdInput.focus();
}

// ── Feed ticker ───────────────────────────────────────────────────────────────

function pushTelemetryTick() {
  sim.tick = Number((sim.tick + 0.1).toFixed(1));
  sim.H    = Math.max(280, Math.min(360, sim.H + Math.round(Math.random() * 8 - 3)));
  sim.I    = Math.max(1,   Math.min(48,  sim.I + Math.round(Math.random() * 2 - 0.3)));
  sim.J    = Number(Math.min(0.99, 0.45 + sim.H / 1600 + Math.random() * 0.02).toFixed(2));
  sim.K    = Math.max(57,  Math.min(61,  59 + Math.round(Math.random() * 2)));

  const stale = Math.random() < 0.08;
  let line;
  try {
    line = buildTelemetryLine({ tick: sim.tick, stale });
  } catch {
    // If compose fails, fall back to a plain string
    const t = formatNumber(sim.tick);
    line = `${stale ? "!" : ""}${sim.H}H ${sim.I}I ${sim.J}J ${sim.K}K ${t}u`;
  }

  state.feed.push(line);
  if (state.feed.length > 50) state.feed.shift();

  renderFeed();
  renderHomeStateFeed();
}

function startFeedTimer() {
  if (feedTimer) clearInterval(feedTimer);
  feedTimer = setInterval(pushTelemetryTick, 2800);
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

function bootstrap() {
  // Render all pane content
  renderGuide();
  renderHistory();
  renderReqResp();
  renderFeed();
  renderHomeStateFeed();

  // Set initial view (also sets body[data-view] and clears term menu)
  switchView("home");

  // Seed the input field with a sample so the mirror is exercised on load
  DOM.cmdInput.value = "24A 0.0s";
  updateInputMirror();
  // Clear it so users start with a blank field
  DOM.cmdInput.value = "";
  updateInputMirror();

  // ── Tab buttons ──
  DOM.tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });

  // ── Input field ──
  DOM.cmdInput.addEventListener("input", () => {
    updateInputMirror();
  });

  DOM.cmdInput.addEventListener("scroll", () => {
    DOM.inputMirror.scrollLeft = DOM.cmdInput.scrollLeft;
  });

  DOM.cmdInput.addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await submitCurrentCommand();
    }
  });

  // ── [>] toggle + send ──
  DOM.prompt.addEventListener("click", handlePrompt);
  DOM.sendBtn.addEventListener("click", () => submitCurrentCommand());

  // ── Custom dropdown ──
  DOM.termMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleTermMenu();
  });

  DOM.termMenuDrop.addEventListener("click", (e) => {
    const item = e.target.closest(".term-menu-item");
    if (item) handleTermMenuAction(item.dataset.action);
  });

  // Close dropdown when clicking outside of it
  document.addEventListener("click", (e) => {
    if (!DOM.termMenuWrap.contains(e.target)) closeTermMenu();
  });

  // Close dropdown on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeTermMenu();
  });

  // ── Telemetry ticker ──
  startFeedTimer();

  // Focus the input
  DOM.cmdInput.focus();
}

bootstrap();
