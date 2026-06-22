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

const GUIDE_QUERY_COMMANDS = [
  { cmd: "Vq", desc: "query average absolute blob velocity" },
  { cmd: "Rq", desc: "query average blob radius" },
];

const GUIDE_PRIMARY_COMMANDS = [
  { cmd: "s", desc: "latches the line with the set command." },
  { cmd: "q", desc: "queries the current lava-lamp state." },
  { cmd: "r", desc: "reset configurable values" },
  { cmd: "c", desc: "clear all loaded blobs" },
  { cmd: "p", desc: "pause/unpause the simulation" },
];

const GUIDE_GLASS_COMMANDS = [
  { cmd: "1g", desc: "enable glass rendering mode" },
  { cmd: "0g", desc: "disable glass rendering mode" },
];

const GUIDE_CONTROL_COMMANDS = [
  { cmd: "Rr", desc: "reset radius variation" },
  { cmd: "Br", desc: "reset blob-count bounds" },
];

// ── Seeded data ───────────────────────────────────────────────────────────────

const SEEDED_HISTORY = [
  { cmd: "1.0Rs", output: "1.0R^s" },
  { cmd: "1.0Vs", output: "1.0V^s" },
  { cmd: ">14Bs", output: ">14B^s" },
  { cmd: "<24Bs", output: "<24B^s" },
  { cmd: "1.0Fs", output: "1.0F^s" },
];

const SEEDED_FEED = [
  "20B 1V 6R 0.0u",
  "20B 0.99V 6R 0.1u",
  "19B 1.02V 6.1R 0.2u",
  "!19B 0.98V 6R 0.3u",
  "20B 1V 6R 0.4u",
  "21B 1.03V 5.9R 0.5u",
];

// ── Runtime state ─────────────────────────────────────────────────────────────

const state = {
  view:        "home",
  historyOpen: false,          // history drawer starts closed
  homeHistory: [...SEEDED_HISTORY],
  reqresp:     [...SEEDED_HISTORY],
  feed:        SEEDED_FEED.map((line, index) => ({ seq: index + 1, line })),
  feedSequence: SEEDED_FEED.length,
  guideCommand: ">14Bs",
  guideParsed: null,
  live: {
    text:      "",
    latched:   false,
    stateName: "normal",
    errors:    [],
  },
};

// ── Simulation values (lava-lamp profile) ────────────────────────────────────

const SIM_DEFAULTS = {
  blobs: 20,
  minBlobs: 14,
  maxBlobs: 24,
  radiusSpread: 1.0,
  velocitySpread: 1.0,
  blobForce: 1.0,
  averageVelocity: 1.0,
  averageRadius: 6.0,
  glass: true,
  paused: false,
  cleared: false,
  tick: 0.5,
};

const sim = Object.assign({}, SIM_DEFAULTS);

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

function highlightResponseBcode(text) {
  const source = String(text);
  const tagMatch = source.match(/(-?\d+(?:\.\d+)?\\|\\[a-z]|\^[a-z])(?=$|\s)/);
  if (!tagMatch) return highlightBcode(source);

  const index = tagMatch.index;
  const tag = tagMatch[0];
  const before = source.slice(0, index);
  const after = source.slice(index + tag.length);
  const className = tag[0] === "^" ? "response-tag response-tag-ok" : "response-tag response-tag-error";

  return [
    highlightBcode(before),
    `<span class="${className}">${escapeHtml(tag)}</span>`,
    highlightBcode(after),
  ].join("");
}

const RESPONSE_ERROR_CODES = Object.freeze({
  GEN: Object.freeze({
    CMD_UNKNOWN: "-1.0",
    RES_UNKNOWN: "-1.1",
    SEQ_MISSING: "-1.2",
    SEQ_UNKNOWN: "-1.3",
    PAYLOAD_MISSING: "-1.4",
    PAYLOAD_OVERFLOW: "-1.5",
    PAYLOAD_INVALID: "-1.6",
    INDEX_MISSING: "-1.7",
    INDEX_UNKNOWN: "-1.8",
    PARAM_MISSING: "-1.9",
    PARAM_OVERRANGE: "-1.10",
    PARAM_UNDERRANGE: "-1.11",
    PARAM_BADQUAL: "-1.12",
    PARAM_INVALID: "-1.13",
    RESP_OVERFLOW: "-1.14",
    RANGE_MISSING: "-1.15",
    RANGE_OVERFLOW: "-1.16",
    LINE_MISSING: "-1.17",
  }),
  ML: Object.freeze({
    EXPECTED: "-2.0",
    LAST_MISSING: "-2.1",
    LAST_OVERFLOW: "-2.2",
    LAST_ALTERED: "-2.3",
    CNTR_START: "-2.4",
    CNTR_OVERRANGE: "-2.5",
    CNTR_SEQUENCE: "-2.6",
  }),
  REST_GENERIC: Object.freeze({
    MALFORMED: "-95.1",
    INVALID_TARGET: "-95.2",
    ACCESS_DENIED: "-95.3",
    NOT_SUPPORTED: "-95.4",
    BUSY: "-95.5",
  }),
  UPDATE: Object.freeze({
    MALFORMED: "-98.1",
    PARAM_MISSING: "-98.10",
    INVALID_COMBINATION: "-98.11",
    VALUE_REJECTED: "-98.12",
    LOCKED_OUT: "-98.20",
    CONFLICT: "-98.22",
    COMMIT_FAILED: "-98.23",
  }),
  DELTA: Object.freeze({
    MALFORMED: "-100.1",
    PARAM_NOT_SUPPORTED: "-100.10",
    WOULD_EXCEED_RANGE: "-100.11",
    WOULD_BE_INVALID: "-100.12",
    LOCKED_OUT: "-100.20",
    CONFLICT: "-100.22",
    COMMIT_FAILED: "-100.23",
  }),
  CONTROL: Object.freeze({
    MALFORMED: "-99.1",
    LOCKED_OUT: "-99.20",
    ILLEGAL_STATE: "-99.21",
    CONFLICT: "-99.22",
    SEQ_MISSING: "-99.30",
  }),
  FEED: Object.freeze({
    MALFORMED: "-102.1",
    NOT_SUPPORTED: "-102.4",
    BUSY: "-102.5",
    INVALID_RANGE: "-102.10",
    RELEASE_REJECTED: "-102.11",
    PLAYBACK_REJECTED: "-102.12",
    EVENT_NOT_FOUND: "-102.13",
    RELEASE_PRECONDITION_FAILED: "-102.14",
    SINGLE_EVENT_UNSUPPORTED: "-102.15",
    RANGE_UNSUPPORTED: "-102.16",
    RELEASE_TARGET_INVALID: "-102.17",
  }),
  ALLOCATE: Object.freeze({
    GROUP: "-105",
  }),
});

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

function normalizeBlobBounds() {
  sim.minBlobs = Math.max(0, Math.round(sim.minBlobs));
  sim.maxBlobs = Math.max(0, Math.round(sim.maxBlobs));
  if (sim.minBlobs > sim.maxBlobs) sim.maxBlobs = sim.minBlobs;
}

// ── Simulation ────────────────────────────────────────────────────────────────

function resetSimulation() {
  Object.assign(sim, SIM_DEFAULTS, { glass: document.body?.dataset.glassMode === "on" });
  normalizeBlobBounds();
}

function applyLavaState(detail = {}) {
  if (typeof detail.blobs === "number" && Number.isFinite(detail.blobs)) sim.blobs = Math.round(detail.blobs);
  if (typeof detail.minBlobs === "number" && Number.isFinite(detail.minBlobs)) sim.minBlobs = Math.round(detail.minBlobs);
  if (typeof detail.maxBlobs === "number" && Number.isFinite(detail.maxBlobs)) sim.maxBlobs = Math.round(detail.maxBlobs);
  if (typeof detail.radiusSpread === "number" && Number.isFinite(detail.radiusSpread)) sim.radiusSpread = detail.radiusSpread;
  if (typeof detail.velocitySpread === "number" && Number.isFinite(detail.velocitySpread)) sim.velocitySpread = detail.velocitySpread;
  if (typeof detail.blobForce === "number" && Number.isFinite(detail.blobForce)) sim.blobForce = detail.blobForce;
  if (typeof detail.averageVelocity === "number" && Number.isFinite(detail.averageVelocity)) sim.averageVelocity = detail.averageVelocity;
  if (typeof detail.averageRadius === "number" && Number.isFinite(detail.averageRadius)) sim.averageRadius = detail.averageRadius;
  if (typeof detail.glass === "boolean") sim.glass = detail.glass;
  if (typeof detail.paused === "boolean") sim.paused = detail.paused;
  if (typeof detail.cleared === "boolean") sim.cleared = detail.cleared;
  normalizeBlobBounds();
}

function buildTelemetryLine({ tick = sim.tick, stale = false } = {}) {
  const lead = stale ? "!" : "";
  return `${lead}${sim.blobs}B ${formatNumber(sim.averageVelocity)}V ${formatNumber(sim.averageRadius)}R ${formatNumber(tick)}u`;
}

function formatFeedEntry(entry, index = 0) {
  if (typeof entry === "string") return `${index + 1}] ^\\ ${entry}`;
  return `${entry.seq}] ^\\ ${entry.line}`;
}

function addAcceptedResponseTag(output, parsed) {
  if (!parsed?.cmd?.code || !output) return output;
  const cmd = parsed.cmd.code;
  const text = String(output).trim();
  if (text.includes(`^${cmd}`) || text.includes(`\\${cmd}`)) return text;
  return text.endsWith(cmd) ? `${text.slice(0, -cmd.length)}^${cmd}` : `^${cmd} ${text}`;
}

function splitTrailingCommand(text) {
  const source = String(text || "").trimEnd();
  const match = source.match(/^(.*)([a-z])$/);
  return match ? { body: match[1], cmd: match[2] } : null;
}

function rejectedResponseTag(requestText, errorCode = RESPONSE_ERROR_CODES.GEN.PARAM_INVALID) {
  const request = splitTrailingCommand(requestText);
  if (request) return `${errorCode}\\ ${String(requestText).trim()}`;
  return `${RESPONSE_ERROR_CODES.GEN.LINE_MISSING}\\s`;
}

function snapshotLine() {
  return [
    `${sim.blobs}B`,
    `>${sim.minBlobs}B`,
    `<${sim.maxBlobs}B`,
    `${formatNumber(sim.radiusSpread)}R`,
    `${formatNumber(sim.velocitySpread)}V`,
    `${formatNumber(sim.blobForce)}F`,
    `${sim.glass ? 1 : 0}g`,
    "q"
  ].join(" ");
}

function queryLine(parsed) {
  if (parsed.params.V) return `${formatNumber(sim.averageVelocity)}Vq`;
  if (parsed.params.R) return `${formatNumber(sim.averageRadius)}Rq`;
  return snapshotLine();
}

function percentText(value) {
  return `\u00b1${Math.round(value * 100)}%`;
}

function currentGuideSetCommands() {
  return [
    { cmd: `${formatNumber(sim.radiusSpread)}Rs`, desc: "set blob radius variation (1.0 default)" },
    { cmd: `${formatNumber(sim.velocitySpread)}Vs`, desc: "set blob velocity variation (1.0 default)" },
    { cmd: `>${sim.minBlobs}Bs`, desc: "set minimum blob count" },
    { cmd: `<${sim.maxBlobs}Bs`, desc: "set maximum blob count" },
    { cmd: `${formatNumber(sim.blobForce)}Fs`, desc: "set blob attraction/repulsion force (1.0 default)" },
  ];
}

function stagedDescription(parsed) {
  if (!parsed) return '-> stage B as "at least 14 blobs,"';
  const params = parsed.params || {};
  if (params.R) return `-> stage R as "radius variation ${formatNumber(sim.radiusSpread)},"`;
  if (params.V) return `-> stage V as "velocity variation ${formatNumber(sim.velocitySpread)},"`;
  if (params.B) {
    const kind = params.B.lessthan ? "at most" : "at least";
    const value = params.B.lessthan ? sim.maxBlobs : sim.minBlobs;
    return `-> stage B as "${kind} ${value} blobs,"`;
  }
  if (params.F) return `-> stage F as "blob force ${formatNumber(sim.blobForce)},"`;
  return "-> stage the current command";
}

function guideExampleDescription(parsed, rawText) {
  if (!parsed) return stagedDescription(parsed);
  switch (parsed.cmd.code) {
    case "s": return stagedDescription(parsed);
    case "q": return "-> query the current lava-lamp state";
    case "r": return Object.keys(parsed.params).length ? "-> reset selected configurable values" : "-> reset all configurable values";
    case "c": return "-> clear all loaded blobs from the simulation";
    case "p": return parsed.cmd.hasValue && parsed.cmd.value === 0 ? "-> resume the simulation" : "-> pause the simulation";
    case "g": return parsed.cmd.hasValue && parsed.cmd.value < 1 ? "-> disable glass rendering mode" : "-> enable glass rendering mode";
    default: return `-> parse ${rawText}`;
  }
}

function guideExampleContinuation(parsed) {
  if (!parsed || parsed.cmd.code === "s") {
    return `then <code class="guide-code hljs language-bcode">${highlightBcode("s")}</code> commits the update with the set command.`;
  }
  return "";
}

function dispatchLavaParams(detail) {
  if (!detail || Object.keys(detail).length === 0) return;
  applyLavaState(detail);
  window.dispatchEvent(new CustomEvent("bcode:lava-params", { detail }));
}

function dispatchLavaControl(detail) {
  window.dispatchEvent(new CustomEvent("bcode:lava-control", { detail }));
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
  body.innerHTML = highlightResponseBcode(text);
  line.append(prefix, body);
  return line;
}

function createBlankLine() {
  const line = document.createElement("div");
  line.className = "blank-line";
  return line;
}

function createStateLine(bullet, keyText, valText, valueClass = "") {
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
  if (valueClass) v.classList.add(valueClass);

  line.append(b, k, v);
  return line;
}

// ── Render functions ──────────────────────────────────────────────────────────

function renderGuide() {
  DOM.docsBody.innerHTML = "";
  const appendRow = (bulletText, cmdText, descText, extraClass = "") => {
    const row = document.createElement("div");
    row.className = `guide-entry${extraClass ? ` ${extraClass}` : ""}`;

    const bullet = document.createElement("span");
    bullet.className = "guide-bullet";
    bullet.textContent = bulletText;

    const code = document.createElement("code");
    code.className = "guide-code hljs language-bcode";
    code.innerHTML = highlightBcode(cmdText);

    const desc = document.createElement("span");
    desc.className = "guide-desc";
    desc.textContent = descText;

    row.append(bullet, code, desc);
    DOM.docsBody.append(row);
  };

  GUIDE_PRIMARY_COMMANDS.forEach((entry) => appendRow("\u2022", entry.cmd, entry.desc, "guide-rule"));
  DOM.docsBody.append(createBlankLine());

  [
    ["R", "controls random radius spread."],
    ["V", "controls random velocity spread."],
    ["B", "controls blob-count bounds."],
    ["F", "controls blob-to-blob force scaling."],
  ].forEach(([cmd, desc]) => appendRow("\u2022", cmd, desc, "guide-rule"));

  DOM.docsBody.append(createBlankLine());
  currentGuideSetCommands().forEach((entry) => appendRow("o", entry.cmd, entry.desc, "guide-command"));
  DOM.docsBody.append(createBlankLine());
  GUIDE_QUERY_COMMANDS.forEach((entry) => appendRow("o", entry.cmd, entry.desc, "guide-command"));
  GUIDE_CONTROL_COMMANDS.forEach((entry) => appendRow("o", entry.cmd, entry.desc, "guide-command"));
  DOM.docsBody.append(createBlankLine());
  GUIDE_GLASS_COMMANDS.forEach((entry) => appendRow("o", entry.cmd, entry.desc, "guide-command"));

  DOM.docsBody.append(createBlankLine());
  const divider = document.createElement("div");
  divider.className = "guide-note guide-divider";
  divider.textContent = "------------------------------------------------";
  DOM.docsBody.append(divider);

  const title = document.createElement("div");
  title.className = "guide-note guide-example-title";
  title.textContent = "Example breakdown:";
  DOM.docsBody.append(title);

  appendRow("\u2022", state.guideCommand, guideExampleDescription(state.guideParsed, state.guideCommand), "guide-example");

  const continuation = document.createElement("div");
  continuation.className = "guide-note guide-continuation";
  continuation.innerHTML = guideExampleContinuation(state.guideParsed);
  DOM.docsBody.append(continuation);
  return;

  [].forEach((entry, index) => {
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

  [].forEach((note) => {
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
  state.feed.forEach((entry, index) => {
    DOM.feedBody.append(createHighlightedLine(formatFeedEntry(entry, index)));
  });
  DOM.feedBody.scrollTop = DOM.feedBody.scrollHeight;
}

// State feed: structured bullet-list reflecting live sim/parser state.
function renderHomeStateFeed() {
  DOM.stateBody.innerHTML = "";
  [
    { key: "blobs",            val: String(sim.blobs) },
    { key: "min blobs",        val: String(sim.minBlobs) },
    { key: "max blobs",        val: String(sim.maxBlobs) },
    { key: "max/min radius",   val: `\u00b1${formatNumber(sim.radiusSpread * 100)}%` },
    { key: "max/min velocity", val: `\u00b1${formatNumber(sim.velocitySpread * 12)}%` },
    { key: "blob force",       val: `\u00b1${formatNumber(Math.abs(sim.blobForce - 1) * 100)}%` },
    { key: "average velocity", val: formatNumber(sim.averageVelocity) },
    { key: "average radius",   val: formatNumber(sim.averageRadius) },
    { key: "glass",            val: sim.glass ? "enabled" : "disabled", valueClass: sim.glass ? "state-enabled" : "" },
  ].forEach((item) => {
    DOM.stateBody.append(createStateLine("\u2022", item.key, item.val, item.valueClass));
  });
  return;

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

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseTerminalCommand(text) {
  const source = text.trim();
  if (!source) return { errorCode: RESPONSE_ERROR_CODES.GEN.LINE_MISSING };
  const parsed = { params: {}, cmd: null };
  let i = 0;

  const skipSpace = () => {
    while (i < source.length && /\s/.test(source[i])) i++;
  };

  while (i < source.length) {
    skipSpace();
    if (i >= source.length) break;

    const field = { greaterthan: false, lessthan: false, indefinite: false, hasValue: false, value: NaN };
    while (source[i] === ">" || source[i] === "<" || source[i] === "?") {
      if (source[i] === ">") field.greaterthan = true;
      if (source[i] === "<") field.lessthan = true;
      if (source[i] === "?") field.indefinite = true;
      i++;
      skipSpace();
    }

    let sign = 1;
    if (source[i] === "-" && /[0-9.]/.test(source[i + 1] || "")) {
      sign = -1;
      i++;
    }

    const numberStart = i;
    while (i < source.length && /[0-9]/.test(source[i])) i++;
    if (source[i] === ".") {
      i++;
      while (i < source.length && /[0-9]/.test(source[i])) i++;
    }
    const numberText = source.slice(numberStart, i);
    if (numberText && numberText !== ".") {
      field.hasValue = true;
      field.value = sign * Number(numberText);
    }

    skipSpace();
    if (i >= source.length) return { errorCode: RESPONSE_ERROR_CODES.GEN.LINE_MISSING };
    const term = source[i++];

    if ("RVBF".includes(term)) {
      parsed.params[term] = field;
    } else if (/[a-z]/.test(term)) {
      parsed.cmd = Object.assign({ code: term }, field);
      skipSpace();
      if (i < source.length) return { errorCode: RESPONSE_ERROR_CODES.GEN.PARAM_INVALID };
      break;
    } else {
      return { errorCode: RESPONSE_ERROR_CODES.GEN.PARAM_INVALID };
    }
  }

  if (!parsed.cmd) return { errorCode: RESPONSE_ERROR_CODES.GEN.LINE_MISSING };
  return parsed;
}

function rangeErrorCode(value, min, max) {
  if (!Number.isFinite(value)) return RESPONSE_ERROR_CODES.GEN.PARAM_INVALID;
  if (value < min) return RESPONSE_ERROR_CODES.GEN.PARAM_UNDERRANGE;
  if (value > max) return RESPONSE_ERROR_CODES.GEN.PARAM_OVERRANGE;
  return null;
}

function validateTerminalCommand(parsed) {
  if (!parsed?.cmd) return RESPONSE_ERROR_CODES.GEN.LINE_MISSING;
  const cmd = parsed.cmd.code;
  const params = parsed.params || {};
  const paramKeys = Object.keys(params);

  if (!"sqgrcp".includes(cmd)) return RESPONSE_ERROR_CODES.GEN.CMD_UNKNOWN;
  if (parsed.cmd.indefinite || parsed.cmd.greaterthan || parsed.cmd.lessthan) {
    return RESPONSE_ERROR_CODES.GEN.PARAM_BADQUAL;
  }

  for (const key of paramKeys) {
    const field = params[key];
    if (field.indefinite) return RESPONSE_ERROR_CODES.GEN.PARAM_BADQUAL;
  }

  if (cmd === "s") {
    if (!paramKeys.length) return RESPONSE_ERROR_CODES.GEN.PARAM_MISSING;
    for (const key of paramKeys) {
      const field = params[key];
      if (!field.hasValue) return RESPONSE_ERROR_CODES.GEN.PARAM_MISSING;
      if ((field.greaterthan || field.lessthan) && key !== "B") {
        return RESPONSE_ERROR_CODES.GEN.PARAM_BADQUAL;
      }
      if (key === "R" || key === "V" || key === "F") {
        const err = rangeErrorCode(field.value, 0, 10);
        if (err) return err;
      } else if (key === "B") {
        const err = rangeErrorCode(field.value, 0, 120);
        if (err) return err;
      }
    }
    return null;
  }

  if (cmd === "q") {
    if (paramKeys.some((key) => !["R", "V"].includes(key))) return RESPONSE_ERROR_CODES.GEN.PARAM_INVALID;
    if (paramKeys.some((key) => params[key].hasValue || params[key].greaterthan || params[key].lessthan)) {
      return RESPONSE_ERROR_CODES.GEN.PARAM_INVALID;
    }
    return null;
  }

  if (cmd === "r") {
    if (paramKeys.some((key) => params[key].hasValue || params[key].greaterthan || params[key].lessthan)) {
      return RESPONSE_ERROR_CODES.GEN.PARAM_INVALID;
    }
    return null;
  }

  if (cmd === "c") {
    if (paramKeys.length) return RESPONSE_ERROR_CODES.CONTROL.MALFORMED;
    return null;
  }

  if (cmd === "p" || cmd === "g") {
    if (paramKeys.length) return RESPONSE_ERROR_CODES.GEN.PARAM_INVALID;
    if (parsed.cmd.hasValue && parsed.cmd.value !== 0 && parsed.cmd.value !== 1) {
      return RESPONSE_ERROR_CODES.GEN.PARAM_INVALID;
    }
    return null;
  }

  return RESPONSE_ERROR_CODES.GEN.CMD_UNKNOWN;
}

// ── Command processing ────────────────────────────────────────────────────────

function applySetLine(rawText, parsed) {
  const detail = {};
  const setSpread = (term, key) => {
    const field = parsed.params[term];
    if (!field || !field.hasValue) return;
    const value = clampNumber(field.value, 0, 10);
    sim[key] = value;
    detail[key] = value;
  };

  setSpread("R", "radiusSpread");
  setSpread("V", "velocitySpread");

  if (parsed.params.B && parsed.params.B.hasValue) {
    const value = clampNumber(Math.round(parsed.params.B.value), 0, 120);
    if (parsed.params.B.lessthan) {
      sim.maxBlobs = value;
      detail.maxBlobs = value;
    } else {
      sim.minBlobs = value;
      detail.minBlobs = value;
    }
    normalizeBlobBounds();
    detail.minBlobs = sim.minBlobs;
    detail.maxBlobs = sim.maxBlobs;
  }

  if (parsed.params.F && parsed.params.F.hasValue) {
    const value = clampNumber(parsed.params.F.value, 0, 10);
    sim.blobForce = value;
    detail.blobForce = value;
  }

  if (Object.keys(detail).length) sim.cleared = false;
  dispatchLavaParams(detail);
  return rawText;
}

function applyGlassMode(parsed) {
  const enable = parsed.cmd.hasValue ? parsed.cmd.value >= 1 : true;
  sim.glass = enable;
  window.dispatchEvent(new CustomEvent("bcode:glass-mode", { detail: { enabled: enable } }));
  return `${enable ? 1 : 0}g`;
}

function resetKeysFromParams(params) {
  const keys = ["R", "V", "B", "F"].filter((key) => params[key]);
  return keys.length ? keys : ["R", "V", "B", "F"];
}

function applyReset(parsed) {
  const keys = resetKeysFromParams(parsed.params);
  if (keys.includes("R")) sim.radiusSpread = SIM_DEFAULTS.radiusSpread;
  if (keys.includes("V")) sim.velocitySpread = SIM_DEFAULTS.velocitySpread;
  if (keys.includes("B")) {
    sim.minBlobs = SIM_DEFAULTS.minBlobs;
    sim.maxBlobs = SIM_DEFAULTS.maxBlobs;
  }
  if (keys.includes("F")) sim.blobForce = SIM_DEFAULTS.blobForce;
  normalizeBlobBounds();
  dispatchLavaControl({ command: "reset", keys });
  return `${Object.keys(parsed.params).join("")}r`;
}

function applyClear() {
  sim.blobs = 0;
  sim.cleared = false;
  dispatchLavaControl({ command: "clear" });
  return "c";
}

function applyPause(parsed) {
  const paused = parsed.cmd.hasValue ? parsed.cmd.value !== 0 : !sim.paused;
  sim.paused = paused;
  dispatchLavaControl({ command: "pause", paused });
  return parsed.cmd.hasValue ? `${paused ? 1 : 0}p` : "p";
}

function generateOutput(rawText, parsed) {
  if (!parsed) return null;
  switch (parsed.cmd.code) {
    case "s": return applySetLine(rawText, parsed);
    case "q": return queryLine(parsed);
    case "r": return applyReset(parsed);
    case "c": return applyClear();
    case "p": return applyPause(parsed);
    case "g": return applyGlassMode(parsed);
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
  let parsed = null;
  let errorCode = RESPONSE_ERROR_CODES.GEN.PARAM_INVALID;
  let accepted = false;
  try {
    parsed = parseTerminalCommand(text);
    errorCode = parsed?.errorCode || validateTerminalCommand(parsed);
    if (!errorCode) {
      output = generateOutput(text, parsed) ?? text;
      output = addAcceptedResponseTag(output, parsed);
      accepted = true;
      state.guideCommand = text;
      state.guideParsed = parsed;
    }
  } catch {
    errorCode = RESPONSE_ERROR_CODES.GEN.PARAM_INVALID;
  }

  if (!accepted) output = rejectedResponseTag(text, errorCode);

  appendTransaction(text, output);
  renderGuide();
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
    state.feedSequence = 0;
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
  if (sim.paused) return;
  sim.tick = Number((sim.tick + 0.1).toFixed(1));
  if (!sim.cleared) {
    sim.blobs = Math.max(0, sim.blobs + Math.round(Math.random() * 2 - 0.8));
    sim.averageVelocity = Number(Math.max(0, sim.averageVelocity + (Math.random() * 0.08 - 0.04)).toFixed(2));
    sim.averageRadius = Number(Math.max(1, sim.averageRadius + (Math.random() * 0.08 - 0.04)).toFixed(1));
  }

  const stale = Math.random() < 0.08;
  let line;
  try {
    line = buildTelemetryLine({ tick: sim.tick, stale });
  } catch {
    // If compose fails, fall back to a plain string
    const t = formatNumber(sim.tick);
    line = `${stale ? "!" : ""}${sim.blobs}B ${formatNumber(sim.averageVelocity)}V ${formatNumber(sim.averageRadius)}R ${t}u`;
  }

  state.feedSequence += 1;
  state.feed.push({ seq: state.feedSequence, line });
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
  DOM.cmdInput.value = ">14Bs";
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
  window.addEventListener("bcode:lava-state", (event) => {
    if (!event || !event.detail) return;
    applyLavaState(event.detail);
    renderGuide();
    renderHomeStateFeed();
  });

  queueMicrotask(() => {
    if (window.__bcodeLava && typeof window.__bcodeLava.getState === "function") {
      applyLavaState(window.__bcodeLava.getState());
      renderGuide();
      renderHomeStateFeed();
    }
  });

  startFeedTimer();

  // Focus the input
  DOM.cmdInput.focus();
}

bootstrap();
