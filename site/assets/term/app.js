import { SABParser, bcode_sab_state_name, bcode_sab_parse_error_name } from "./assets/term/bcode_sab.js";
import BCODe from "./assets/term/bcode.mjs";

const $ = (id) => document.getElementById(id);

const DOM = {
  body: document.body,
  tabs: [...document.querySelectorAll(".tab")],
  titleText: $("title-text"),
  termMenu: $("term-menu"),
  homeView: $("home-view"),
  terminalView: $("terminal-view"),
  docsBody: $("docs-body"),
  stateBody: $("state-body"),
  historyBody: $("history-body"),
  reqrespBody: $("reqresp-body"),
  feedBody: $("feed-body"),
  prompt: $("prompt"),
  sendBtn: $("send-btn"),
  cmdInput: $("cmd-input"),
  inputMirror: $("input-hl"),
  cmdBox: $("cmd-box")
};

const GUIDE_ENTRIES = [
  { cmd: "24A 0.0s", desc: "set blob target" },
  { cmd: "4.8B 0.0s", desc: "set blob radius" },
  { cmd: "0.18C 0.0s", desc: "raise buoyancy" },
  { cmd: ">20A 0.0s", desc: "clamp to at least 20 blobs" },
  { cmd: "0.0q", desc: "query current sim snapshot" }
];

const GUIDE_NOTES = [
  "Enter latches only when a real BCODe command terminator commits.",
  "A B C drive the lamp profile; H I J K arrive from the sim snapshot.",
  "u traffic stays unsolicited and separate from the request/response channel."
];

const SEEDED_HISTORY = [
  { cmd: "24A 0.0s", output: "24A 0.0s" },
  { cmd: "4.8B 0.0s", output: "4.8B 0.0s" },
  { cmd: "0.18C 0.0s", output: "0.18C 0.0s" },
  { cmd: ">20A 0.0s", output: "24A 0.0s" },
  { cmd: "0.0q", output: "312H 24I 0.63J 60K 0.0q" }
];

const SEEDED_FEED = [
  "301H 24I 0.61J 59K 0.0u",
  "305H 24I 0.62J 60K 0.1u",
  "309H 24I 0.63J 60K 0.2u",
  "!309H 24I 0.63J 58K 0.3u",
  "312H 24I 0.64J 60K 0.4u",
  "318H 25I 0.66J 60K 0.5u"
];

const state = {
  view: "home",
  historyOpen: true,
  homeHistory: [...SEEDED_HISTORY],
  reqresp: [...SEEDED_HISTORY],
  feed: [...SEEDED_FEED],
  live: {
    text: "",
    latched: false,
    stateName: "normal",
    errors: []
  }
};

const sim = {
  A: 24,
  B: 4.8,
  C: 0.18,
  H: 312,
  I: 24,
  J: 0.63,
  K: 60,
  tick: 0.5
};

let feedTimer = null;

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
    return window.hljs.highlight(text, { language: "bcode" }).value;
  } catch {
    return escapeHtml(text);
  }
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return String(value);
  if (Math.abs(value - Math.round(value)) < 1e-9) return String(Math.round(value));
  return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function createComposeField(strValue, qualifiers = {}) {
  return {
    strValue: String(strValue),
    greaterthan: !!qualifiers.greaterthan,
    lessthan: !!qualifiers.lessthan,
    indefinite: !!qualifiers.indefinite
  };
}

// bcode.mjs is used as the line/reference composition path for seeded lines and generated outputs.
function composeLine(params, cmdValue, cmdCode, options = {}) {
  const record = {
    params: {},
    cmd: createComposeField(cmdValue, options.cmdQualifiers),
    code: cmdCode
  };
  params.forEach((part) => {
    record.params[part.term] = createComposeField(part.value, part.qualifiers);
  });
  const composed = BCODe.Line.compose([record]);
  const trimmed = composed.replace(/\r?\n$/, "");
  return options.leading ? `${options.leading}${trimmed}` : trimmed;
}

function currentSnapshotParts() {
  return [
    { term: "H", value: formatNumber(sim.H) },
    { term: "I", value: formatNumber(sim.I) },
    { term: "J", value: formatNumber(sim.J) },
    { term: "K", value: formatNumber(sim.K) }
  ];
}

function buildTelemetryLine({ tick = sim.tick, stale = false } = {}) {
  return composeLine(currentSnapshotParts(), formatNumber(tick), "u", { leading: stale ? "!" : "" });
}

function resetSimulation() {
  sim.A = 24;
  sim.B = 4.8;
  sim.C = 0.18;
  sim.H = 312;
  sim.I = 24;
  sim.J = 0.63;
  sim.K = 60;
  sim.tick = 0.5;
}

function updateDerivedState() {
  sim.H = Math.max(280, Math.round(255 + sim.A * 2.3 + sim.B * 7.5 + sim.C * 145 + Math.random() * 8));
  sim.I = Math.max(1, Math.round(sim.A + (Math.random() * 2 - 0.5)));
  sim.J = Number(Math.min(0.98, 0.44 + sim.H / 1600 + sim.C * 0.18).toFixed(2));
  sim.K = Math.max(57, Math.min(61, Math.round(60 - Math.abs(sim.C - 0.18) * 10 + (Math.random() * 2 - 1))));
}

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
  prefix.textContent = "○ ";
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

function renderGuide() {
  DOM.docsBody.innerHTML = "";
  GUIDE_ENTRIES.forEach((entry, index) => {
    const row = document.createElement("div");
    row.className = "guide-entry";

    const bullet = document.createElement("span");
    bullet.className = "guide-bullet";
    bullet.textContent = index === 0 ? "●" : "○";

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

function renderHomeStateFeed() {
  DOM.stateBody.innerHTML = "";
  state.feed.slice(-6).forEach((line) => {
    DOM.stateBody.append(createHighlightedLine(line));
  });
}

// SABParser supplies the stream-native live state; partial and incomplete lines stay valid parser states.
function analyzeLiveStream(text) {
  const snapshot = {
    latched: false,
    stateName: "normal",
    errors: []
  };

  const parser = new SABParser({
    on_line_latched() {
      snapshot.latched = true;
    },
    on_parse_error(_, code, offendingByte, st) {
      snapshot.errors.push({
        code,
        errorName: bcode_sab_parse_error_name(code),
        offendingByte,
        stateName: bcode_sab_state_name(st)
      });
    }
  });

  try {
    parser.feed(text);
  } catch (error) {
    snapshot.errors.push({
      code: "RUNTIME",
      errorName: error.message,
      offendingByte: 0,
      stateName: "runtime"
    });
  }

  snapshot.stateName = bcode_sab_state_name(parser.state);
  return snapshot;
}

function updateInputMirror() {
  const text = DOM.cmdInput.value;
  DOM.inputMirror.innerHTML = text ? highlightBcode(text) : "";
  state.live = analyzeLiveStream(text);
  const errorText = state.live.errors.length ? ` / ${state.live.errors[0].errorName}` : "";
  DOM.cmdBox.title = text ? `parser: ${state.live.stateName}${state.live.latched ? " / latched" : ""}${errorText}` : "";
}

async function parseReferenceLine(text) {
  try {
    const lines = await BCODe.parseData(text);
    return lines[0] || null;
  } catch {
    return null;
  }
}

function applySetLine(line) {
  const touched = [];
  ["A", "B", "C"].forEach((term) => {
    if (!line.bool(term)) return;
    const field = line.params[term];
    const nextValue = line.numeric(term);
    if (field.greaterthan) sim[term] = Math.max(sim[term], nextValue);
    else if (field.lessthan) sim[term] = Math.min(sim[term], nextValue);
    else sim[term] = nextValue;
    touched.push({ term, value: formatNumber(sim[term]) });
  });
  updateDerivedState();
  return composeLine(touched, "0.0", "s");
}

function generateOutput(rawText, line) {
  if (!line) return null;
  switch (line.code) {
    case "s":
      return applySetLine(line);
    case "q":
      return composeLine(currentSnapshotParts(), "0.0", "q");
    case "r":
      resetSimulation();
      return composeLine([], "0.0", "r");
    default:
      return rawText;
  }
}

function appendTransaction(cmd, output) {
  const entry = { cmd, output };
  state.homeHistory.push(entry);
  state.reqresp.push(entry);
  if (state.homeHistory.length > 18) state.homeHistory.shift();
  if (state.reqresp.length > 18) state.reqresp.shift();
}

async function submitCurrentCommand() {
  const text = DOM.cmdInput.value.trim();
  if (!text) return;

  const live = analyzeLiveStream(text);
  if (!live.latched || live.errors.length) {
    updateInputMirror();
    DOM.cmdInput.focus();
    return;
  }

  const line = await parseReferenceLine(text);
  if (!line) return;

  const output = generateOutput(text, line);
  appendTransaction(text, output);
  renderHistory();
  renderReqResp();
  renderHomeStateFeed();

  DOM.cmdInput.value = "";
  updateInputMirror();
  DOM.cmdInput.focus();
}

function switchView(view) {
  state.view = view;
  DOM.body.dataset.view = view;
  DOM.tabs.forEach((tab) => {
    const active = tab.dataset.view === view;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
  });
  DOM.homeView.classList.toggle("active", view === "home");
  DOM.terminalView.classList.toggle("active", view === "terminal");
  DOM.titleText.style.display = view === "home" ? "" : "none";
  DOM.termMenu.style.display = view === "terminal" ? "" : "inline-block";
}

function handlePrompt() {
  if (state.view === "home") {
    state.historyOpen = !state.historyOpen;
    $("history-panel").classList.toggle("hidden", !state.historyOpen);
  }
  DOM.cmdInput.focus();
}

function handleTerminalMenu() {
  const action = DOM.termMenu.value;
  if (action === "reset") {
    state.reqresp.length = 0;
    renderReqResp();
    DOM.cmdInput.value = "";
    updateInputMirror();
  } else if (action === "clear") {
    state.feed.length = 0;
    renderFeed();
    renderHomeStateFeed();
  }
  DOM.termMenu.selectedIndex = 0;
}

function pushTelemetryTick() {
  sim.tick = Number((sim.tick + 0.1).toFixed(1));
  sim.H = Math.max(280, Math.min(360, sim.H + Math.round(Math.random() * 8 - 3)));
  sim.I = Math.max(1, Math.min(48, sim.I + Math.round(Math.random() * 2 - 0.3)));
  sim.J = Number(Math.min(0.99, 0.45 + sim.H / 1600 + Math.random() * 0.02).toFixed(2));
  sim.K = Math.max(57, Math.min(61, 59 + Math.round(Math.random() * 2)));
  const stale = Math.random() < 0.08;
  state.feed.push(buildTelemetryLine({ tick: sim.tick, stale }));
  if (state.feed.length > 50) state.feed.shift();
  renderFeed();
  renderHomeStateFeed();
}

function startFeedTimer() {
  if (feedTimer) clearInterval(feedTimer);
  feedTimer = setInterval(pushTelemetryTick, 2800);
}

function bootstrap() {
  renderGuide();
  renderHistory();
  renderReqResp();
  renderFeed();
  renderHomeStateFeed();
  switchView("home");

  DOM.cmdInput.value = "24A 0.0s";
  updateInputMirror();

  DOM.tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });

  DOM.cmdInput.addEventListener("input", updateInputMirror);
  DOM.cmdInput.addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await submitCurrentCommand();
    }
  });

  DOM.sendBtn.addEventListener("click", submitCurrentCommand);
  DOM.prompt.addEventListener("click", handlePrompt);
  DOM.termMenu.addEventListener("change", handleTerminalMenu);

  startFeedTimer();
  DOM.cmdInput.focus();
}

bootstrap();
