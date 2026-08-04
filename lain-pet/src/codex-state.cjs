const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const OUTGOING_TARGET = "codex_app_server::outgoing_message";

function shorten(value, max = 140) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function cleanLiveText(value, max = 110) {
  return shorten(String(value || "")
    .replace(/\*\*|__|`/g, "")
    .replace(/^\s*[-*]\s+/, "")
    .trim(), max);
}

function cleanCommentaryText(value, max = 4000) {
  const lines = String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/\*\*|__/g, "")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .split("\n")
    .map((line) => line
      .replace(/^\s*#{1,6}\s+/, "")
      .replace(/^\s*[-*]\s+/, "")
      .replace(/[ \t]+/g, " ")
      .trim())
    .filter((line) => line && !/^(?:summary|qa|screenshots?|evidence)$/i.test(line));
  const text = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return text.length > max ? text.slice(0, max).trimEnd() : text;
}

// Codex records machine-readable assistant turns in the same rollout as the
// prose it writes for the user — the sandbox escalation verdict
// ({"risk_level":…,"outcome":"allow",…}) is the common one. Those are never
// meant for a human reader, so keep raw JSON documents out of the bubble.
function isMachineReadableText(value) {
  const text = String(value || "").trim();
  if (!text.startsWith("{") && !text.startsWith("[")) return false;
  try {
    const parsed = JSON.parse(text);
    return parsed !== null && typeof parsed === "object";
  } catch {
    return false;
  }
}

function assistantTextFromPayload(payload = {}, phase) {
  if (
    payload.type !== "message"
    || payload.role !== "assistant"
    || payload.phase !== phase
    || !Array.isArray(payload.content)
  ) return null;
  const text = payload.content
    .filter((item) => item?.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n");
  if (isMachineReadableText(text)) return null;
  return cleanCommentaryText(text) || null;
}

function commentaryTextFromPayload(payload = {}) {
  return assistantTextFromPayload(payload, "commentary");
}

function finalTextFromPayload(payload = {}) {
  return assistantTextFromPayload(payload, "final_answer");
}

function stageTitleFromPayload(payload = {}) {
  if (!/^(?:function_call|custom_tool_call)$/.test(String(payload.type || ""))) return null;
  const raw = String(payload.arguments || payload.input || "");
  let candidate = "";
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") candidate = parsed;
    else if (parsed && typeof parsed === "object") {
      if (typeof parsed.title === "string") return cleanLiveText(parsed.title, 56);
      candidate = String(parsed.code || parsed.source || raw);
    }
  } catch {
    candidate = raw;
  }
  const match = candidate.match(/\btitle\s*:\s*(?:"([^"]+)"|'([^']+)'|`([^`]+)`)/);
  return cleanLiveText(match?.[1] || match?.[2] || match?.[3] || "", 56) || null;
}

function callInputText(payload = {}) {
  const raw = payload.arguments ?? payload.input ?? "";
  const values = [typeof raw === "string" ? raw : JSON.stringify(raw)];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (parsed && typeof parsed === "object") {
      for (const key of ["command", "cmd", "code", "source", "patch", "input"]) {
        if (typeof parsed[key] === "string") values.push(parsed[key]);
      }
    }
  } catch {}
  return values.join("\n");
}

function editFromCall(payload = {}) {
  const input = callInputText(payload);
  if (!/\*\*\*\s+(?:Update|Add)\s+File:/.test(input)) return null;
  let current = null;
  for (const line of input.replace(/\\n/g, "\n").split(/\r?\n/)) {
    const header = line.match(/^\*\*\*\s+(?:Update|Add)\s+File:\s*(.+?)\s*$/);
    if (header) {
      current = { kind: "edit", file: path.basename(header[1].trim()), additions: 0, deletions: 0 };
      continue;
    }
    if (!current) continue;
    if (line.startsWith("+") && !line.startsWith("+++")) current.additions += 1;
    if (line.startsWith("-") && !line.startsWith("---")) current.deletions += 1;
  }
  return current;
}

function isCommandCall(payload = {}) {
  const name = String(payload.name || payload.tool_name || payload.tool || "");
  const input = callInputText(payload);
  return /(?:shell|exec_command|command)/i.test(name) || /(?:shell_command|exec_command)\s*\(/i.test(input);
}

function outputText(payload = {}) {
  const output = payload.output ?? payload.result ?? "";
  const values = Array.isArray(output) ? output : [output];
  return values.map((value) => {
    if (typeof value === "string") return value;
    if (typeof value?.text === "string") return value.text;
    try { return JSON.stringify(value); } catch { return ""; }
  }).join("\n");
}

function waitCellId(payload = {}) {
  const name = String(payload.name || payload.tool_name || payload.tool || "");
  if (!/(?:^|[_.])wait$/i.test(name)) return null;
  const raw = payload.arguments ?? payload.input ?? "";
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (parsed?.cell_id !== undefined && parsed?.cell_id !== null) return String(parsed.cell_id);
  } catch {}
  const match = String(raw).match(/\bcell_id\b\s*[:=]\s*["']?([^\s,"'}]+)/i);
  return match?.[1] || null;
}

function yieldedCellId(payload = {}) {
  return outputText(payload).match(/\bScript running with cell ID\s+([^\s]+)/i)?.[1] || null;
}

function eventTime(event) {
  const parsed = Date.parse(String(event?.timestamp || ""));
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function classifyLiveActivity(events, previous = {}) {
  let progressText = previous.progressText || null;
  let stageTitle = previous.stageTitle || null;
  let commentaryText = previous.commentaryText || null;
  let finalText = previous.finalText || null;
  let stageCallId = previous.stageCallId || null;
  const activeCommands = { ...(previous.activeCommands || {}) };
  const pendingEdits = { ...(previous.pendingEdits || {}) };
  let lastEdit = previous.lastEdit || null;

  for (const event of events) {
    const payload = event?.payload || {};
    const type = String(payload.type || "");
    if (event?.type === "event_msg") {
      if (type === "task_started") {
        progressText = null;
        stageTitle = null;
        commentaryText = null;
        finalText = null;
        stageCallId = null;
        Object.keys(activeCommands).forEach((key) => delete activeCommands[key]);
        Object.keys(pendingEdits).forEach((key) => delete pendingEdits[key]);
        lastEdit = null;
      }
      if (type === "agent_reasoning") {
        const next = cleanLiveText(payload.text, 110);
        if (next) progressText = next;
      }
      if (type === "mcp_tool_call_end" && payload.call_id === stageCallId) {
        stageTitle = null;
        stageCallId = null;
      }
      if (type === "mcp_tool_call_end" && payload.call_id) {
        delete activeCommands[payload.call_id];
        if (pendingEdits[payload.call_id]) {
          lastEdit = pendingEdits[payload.call_id];
          delete pendingEdits[payload.call_id];
        }
      }
      if (/task_complete|task_failed|turn_aborted|turn_error/.test(type)) {
        progressText = null;
        stageTitle = null;
        commentaryText = null;
        stageCallId = null;
        Object.keys(activeCommands).forEach((key) => delete activeCommands[key]);
        Object.keys(pendingEdits).forEach((key) => delete pendingEdits[key]);
      }
    }

    if (event?.type === "response_item") {
      const nextCommentary = commentaryTextFromPayload(payload);
      if (nextCommentary) commentaryText = nextCommentary;
      const nextFinal = finalTextFromPayload(payload);
      if (nextFinal) finalText = nextFinal;
      if (/^(?:function_call|custom_tool_call)$/.test(type)) {
        const callId = payload.call_id || payload.id || `call-${eventTime(event)}`;
        const edit = editFromCall(payload);
        const cellId = waitCellId(payload);
        if (edit) pendingEdits[callId] = edit;
        else if (cellId) {
          const activeCell = activeCommands[`cell:${cellId}`];
          activeCommands[callId] = {
            kind: "command",
            startedAt: activeCell?.startedAt || eventTime(event),
            cellId,
          };
        }
        else if (isCommandCall(payload)) activeCommands[callId] = { kind: "command", startedAt: eventTime(event) };
        const nextStage = stageTitleFromPayload(payload);
        if (nextStage) {
          stageTitle = nextStage;
          stageCallId = payload.call_id || null;
        }
      }
      if (/^(?:function_call_output|custom_tool_call_output)$/.test(type)) {
        const callId = payload.call_id || payload.id;
        if (callId) {
          const activeCommand = activeCommands[callId];
          delete activeCommands[callId];
          const yieldedCell = yieldedCellId(payload);
          if (yieldedCell) {
            activeCommands[`cell:${yieldedCell}`] = {
              kind: "command",
              startedAt: activeCommand?.startedAt || eventTime(event),
              cellId: yieldedCell,
            };
          } else if (activeCommand?.cellId) {
            delete activeCommands[`cell:${activeCommand.cellId}`];
          }
          if (pendingEdits[callId]) {
            lastEdit = pendingEdits[callId];
            delete pendingEdits[callId];
          }
        }
        if (callId === stageCallId) {
          stageTitle = null;
          stageCallId = null;
        }
      }
    }
  }

  const longestCommand = Object.values(activeCommands).sort((a, b) => a.startedAt - b.startedAt)[0] || null;
  return {
    progressText,
    stageTitle,
    commentaryText,
    finalText,
    stageCallId,
    activeCommands,
    pendingEdits,
    lastEdit,
    activity: longestCommand || lastEdit,
  };
}

function requestFromPayload(payload = {}) {
  const type = String(payload.type || "");
  if (!/approval_request|request_user_input|elicitation_request/.test(type)) return null;
  const command = Array.isArray(payload.command) ? payload.command.join(" ") : payload.command;
  const reason = shorten(payload.reason || payload.message || payload.prompt || command);
  return {
    kind: type,
    requestId: payload.request_id || payload.requestId || payload.id || null,
    summary: reason || (type.includes("exec") ? "Command approval required." : "Lain needs your decision."),
    actionable: false,
  };
}

function classifyRows(rows, previousState = "idle", previousRequest = null) {
  let state = previousState;
  let reviewId = null;
  let request = previousRequest;

  for (const row of rows) {
    const body = String(row.feedback_log_body || "");
    if (String(row.target) === OUTGOING_TARGET) {
      if (/turn\/started/.test(body)) state = "thinking";
      if (/requestApproval|requestUserInput|elicitation\/request/.test(body)) {
        state = "waiting";
        request = { kind: "app-server-request", requestId: null, summary: "Lain needs your decision.", actionable: false };
      }
      if (/serverRequest\/resolved/.test(body)) { state = "thinking"; request = null; }
      if (/turn\/completed/.test(body)) {
        state = "idle";
        reviewId = Number(row.id);
        request = null;
      }
      if (/turn\/interrupted/.test(body)) { state = "idle"; request = null; }
    }

    if (
      String(row.level).toUpperCase() === "ERROR" &&
      row.thread_id &&
      /turn|response|fatal|failed/i.test(body)
    ) state = "failed";
  }

  return { state, reviewId, request };
}

function classifyRolloutEvents(events, previousState = "idle", markerPrefix = "rollout", previousRequest = null) {
  let state = previousState;
  let reviewId = null;
  let request = previousRequest;

  events.forEach((event, index) => {
    const envelopeType = event?.type;
    const payload = event?.payload || {};
    const type = String(payload.type || "");

    if (envelopeType === "event_msg") {
      if (type === "task_started") state = "thinking";
      if (/approval_request|request_user_input|elicitation_request/.test(type)) {
        state = "waiting";
        request = requestFromPayload(payload);
      }
      if (/approval_resolved|request_user_input_response|elicitation_response/.test(type)) { state = "thinking"; request = null; }
      if (type === "task_complete") {
        state = "idle";
        reviewId = `${markerPrefix}:${index}:${event.timestamp || "complete"}`;
        request = null;
      }
      if (/task_failed|turn_aborted|turn_error/.test(type)) { state = "failed"; request = null; }
    }

    if (
      state === "waiting" &&
      envelopeType === "response_item" &&
      /(?:function|custom_tool)_call_output/.test(type)
    ) { state = "thinking"; request = null; }
  });

  return { state, reviewId, request };
}

function findLatestDatabase(codexHome, prefix) {
  const candidates = fs.readdirSync(codexHome)
    .filter((name) => new RegExp(`^${prefix}_\\d+\\.sqlite$`).test(name))
    .map((name) => ({ name, modified: fs.statSync(path.join(codexHome, name)).mtimeMs }))
    .sort((a, b) => b.modified - a.modified);
  return candidates.length ? path.join(codexHome, candidates[0].name) : null;
}

class CodexStateWatcher {
  constructor(onState, options = {}) {
    this.onState = onState;
    this.codexHome = options.codexHome || path.join(os.homedir(), ".codex");
    this.logsPath = options.logsPath || null;
    this.statePath = options.statePath || null;
    this.pollMs = options.pollMs || 450;
    this.lastLogId = 0;
    this.state = "idle";
    this.timer = null;
    this.logsDb = null;
    this.stateDb = null;
    this.hasThreadSourceColumn = null;
    this.rolloutPath = null;
    this.rolloutOffset = 0;
    this.partialLine = "";
    this.pollCount = 0;
    this.threadId = null;
    this.threadTitle = null;
    this.threadPreview = null;
    this.approvalMode = null;
    this.pendingRequest = null;
    this.progressText = null;
    this.stageTitle = null;
    this.commentaryText = null;
    this.finalText = null;
    this.stageCallId = null;
    this.activeCommands = {};
    this.pendingEdits = {};
    this.lastEdit = null;
    this.activity = null;
    this.lastPayloadSignature = null;
  }

  start() {
    try {
      this.openDatabases();
      this.refreshThread(true);
      this.emit(this.state, null, null);
    } catch (error) {
      this.emit("idle", null, `Lain's task state is unavailable: ${error.message}`);
    }
    this.timer = setInterval(() => this.poll(), this.pollMs);
  }

  openDatabases() {
    const { DatabaseSync } = require("node:sqlite");
    this.logsPath ||= findLatestDatabase(this.codexHome, "logs");
    this.statePath ||= findLatestDatabase(this.codexHome, "state");
    if (!this.logsPath || !this.statePath) throw new Error("Lain's task databases were not found");
    this.logsDb = new DatabaseSync(this.logsPath, { readOnly: true });
    this.stateDb = new DatabaseSync(this.statePath, { readOnly: true });
    this.hasThreadSourceColumn = null;
    this.lastLogId = Number(this.logsDb.prepare("SELECT COALESCE(MAX(id), 0) AS id FROM logs").get().id);
  }

  poll() {
    try {
      if (!this.logsDb || !this.stateDb) this.openDatabases();
      this.pollLogs();
      if ((this.pollCount++ % 4) === 0) this.refreshThread(false);
      this.readRollout(false);
    } catch {
      this.closeDatabases();
    }
  }

  pollLogs() {
    const rows = this.logsDb.prepare(`
      SELECT id, ts, level, target, feedback_log_body, thread_id
      FROM logs
      WHERE id > ?
        AND (target = ? OR (level = 'ERROR' AND thread_id IS NOT NULL))
      ORDER BY id ASC
      LIMIT 2000
    `).all(this.lastLogId, OUTGOING_TARGET);
    if (rows.length) this.lastLogId = Number(rows[rows.length - 1].id);
    // App-server lifecycle rows are shared by every user task, subagent, and
    // guardian process, and many of them do not carry a thread id at all. A
    // completion from one of those internal sessions must never clear the
    // selected user task's live commentary or command state.
    const selectedThreadId = String(this.threadId || "").toLowerCase();
    const scopedRows = selectedThreadId
      ? rows.filter((row) => String(row.thread_id || "").toLowerCase() === selectedThreadId)
      : [];
    const result = classifyRows(scopedRows, this.state, this.pendingRequest);
    this.setState(result.state, result.reviewId, result.request);
  }

  refreshThread(initial) {
    if (this.hasThreadSourceColumn === null) {
      this.hasThreadSourceColumn = this.stateDb.prepare("PRAGMA table_info(threads)")
        .all()
        .some((column) => column.name === "thread_source");
    }
    const threadSourceFilter = this.hasThreadSourceColumn
      ? "AND COALESCE(thread_source, 'user') = 'user'"
      : "";
    const thread = this.stateDb.prepare(`
      SELECT id, rollout_path, title, name, preview, first_user_message, approval_mode
      FROM threads
      WHERE archived = 0
        AND rollout_path <> ''
        ${threadSourceFilter}
      ORDER BY recency_at_ms DESC, updated_at_ms DESC
      LIMIT 1
    `).get();
    if (!thread?.rollout_path) return;
    this.threadId = thread.id;
    this.threadTitle = shorten(thread.name || thread.title || thread.first_user_message || "Task with Lain", 90);
    this.threadPreview = shorten(thread.preview || thread.first_user_message || thread.title, 140);
    this.approvalMode = thread.approval_mode || null;
    const nextPath = String(thread.rollout_path).replace(/^\\\\\?\\/, "");
    if (nextPath === this.rolloutPath) {
      if (!initial) this.emit(this.state, null, null);
      return;
    }
    this.rolloutPath = nextPath;
    this.progressText = null;
    this.stageTitle = null;
    this.commentaryText = null;
    this.finalText = null;
    this.stageCallId = null;
    this.activeCommands = {};
    this.pendingEdits = {};
    this.lastEdit = null;
    this.activity = null;
    this.rolloutOffset = 0;
    this.partialLine = "";
    this.readRollout(true);
    if (!initial) this.setState(this.state, null, this.pendingRequest);
  }

  readRollout(initial) {
    if (!this.rolloutPath || !fs.existsSync(this.rolloutPath)) return;
    const size = fs.statSync(this.rolloutPath).size;
    if (size < this.rolloutOffset) {
      this.rolloutOffset = 0;
      this.partialLine = "";
    }
    if (size === this.rolloutOffset) return;

    let start = this.rolloutOffset;
    // A single long-running Codex turn can append several megabytes before it
    // completes, so inspect a generous tail once at startup to recover the
    // latest task_started/task_complete pair.
    if (initial && start === 0) start = Math.max(0, size - 32 * 1024 * 1024);
    const length = size - start;
    const buffer = Buffer.alloc(length);
    const descriptor = fs.openSync(this.rolloutPath, "r");
    try { fs.readSync(descriptor, buffer, 0, length, start); } finally { fs.closeSync(descriptor); }
    this.rolloutOffset = size;

    let text = this.partialLine + buffer.toString("utf8");
    const lines = text.split(/\r?\n/);
    this.partialLine = lines.pop() || "";
    if (initial && start > 0) lines.shift();
    const events = [];
    for (const line of lines) {
      try { events.push(JSON.parse(line)); } catch {}
    }
    const result = classifyRolloutEvents(events, this.state, `${this.rolloutPath}:${start}`, this.pendingRequest);
    const live = classifyLiveActivity(events, {
      progressText: this.progressText,
      stageTitle: this.stageTitle,
      commentaryText: this.commentaryText,
      finalText: this.finalText,
      stageCallId: this.stageCallId,
      activeCommands: this.activeCommands,
      pendingEdits: this.pendingEdits,
      lastEdit: this.lastEdit,
    });
    const liveChanged = live.progressText !== this.progressText
      || live.stageTitle !== this.stageTitle
      || live.commentaryText !== this.commentaryText
      || live.finalText !== this.finalText
      || live.stageCallId !== this.stageCallId
      || JSON.stringify(live.activity) !== JSON.stringify(this.activity);
    this.progressText = live.progressText;
    this.stageTitle = live.stageTitle;
    this.commentaryText = live.commentaryText;
    this.finalText = live.finalText;
    this.stageCallId = live.stageCallId;
    this.activeCommands = live.activeCommands;
    this.pendingEdits = live.pendingEdits;
    this.lastEdit = live.lastEdit;
    this.activity = live.activity;
    if (initial) {
      this.state = result.state;
      this.pendingRequest = result.request;
    } else {
      this.setState(result.state, result.reviewId, result.request, liveChanged);
    }
  }

  setState(nextState, reviewId, request = this.pendingRequest, force = false) {
    const requestChanged = JSON.stringify(request) !== JSON.stringify(this.pendingRequest);
    if (nextState !== "thinking") {
      this.progressText = null;
      this.stageTitle = null;
      this.commentaryText = null;
      this.stageCallId = null;
      this.activeCommands = {};
      this.pendingEdits = {};
      this.lastEdit = null;
      this.activity = null;
    }
    if (nextState !== this.state || reviewId !== null || requestChanged || force) {
      this.state = nextState;
      this.pendingRequest = request;
      this.emit(nextState, reviewId, null);
    }
  }

  emit(state, reviewId, warning) {
    const payload = {
      state,
      reviewId,
      warning,
      observedAt: Date.now(),
      threadId: this.threadId,
      threadTitle: this.threadTitle,
      threadPreview: this.threadPreview,
      approvalMode: this.approvalMode,
      request: this.pendingRequest,
      progressText: this.progressText,
      stageTitle: this.stageTitle,
      commentaryText: this.commentaryText,
      finalText: this.finalText,
      activity: this.activity,
    };
    const signature = JSON.stringify({ ...payload, observedAt: 0 });
    if (signature === this.lastPayloadSignature && reviewId === null && warning === null) return;
    this.lastPayloadSignature = signature;
    this.onState(payload);
  }

  closeDatabases() {
    try { this.logsDb?.close(); } catch {}
    try { this.stateDb?.close(); } catch {}
    this.logsDb = null;
    this.stateDb = null;
    this.hasThreadSourceColumn = null;
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.closeDatabases();
  }
}

module.exports = {
  CodexStateWatcher,
  classifyRows,
  classifyRolloutEvents,
  classifyLiveActivity,
  commentaryTextFromPayload,
  finalTextFromPayload,
  stageTitleFromPayload,
};
