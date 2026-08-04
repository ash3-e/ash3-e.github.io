const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { DatabaseSync } = require("node:sqlite");

const { CodexStateWatcher, classifyLiveActivity } = require("../src/codex-state.cjs");

function createThreadsDatabase({ includeThreadSource = true } = {}) {
  const database = new DatabaseSync(":memory:");
  database.exec(`
    CREATE TABLE threads (
      id TEXT PRIMARY KEY,
      rollout_path TEXT NOT NULL,
      title TEXT NOT NULL,
      name TEXT,
      preview TEXT NOT NULL DEFAULT '',
      first_user_message TEXT NOT NULL DEFAULT '',
      approval_mode TEXT,
      archived INTEGER NOT NULL DEFAULT 0,
      recency_at_ms INTEGER NOT NULL DEFAULT 0,
      updated_at_ms INTEGER NOT NULL DEFAULT 0
      ${includeThreadSource ? ", thread_source TEXT" : ""}
    )
  `);
  return database;
}

function createLogsDatabase() {
  const database = new DatabaseSync(":memory:");
  database.exec(`
    CREATE TABLE logs (
      id INTEGER PRIMARY KEY,
      ts INTEGER,
      level TEXT,
      target TEXT,
      feedback_log_body TEXT,
      thread_id TEXT
    )
  `);
  return database;
}

function writeRollout(directory, name, events) {
  const rolloutPath = path.join(directory, name);
  fs.writeFileSync(rolloutPath, `${events.map((event) => JSON.stringify(event)).join("\n")}\n`, "utf8");
  return rolloutPath;
}

test("active task payload ignores newer internal sessions and keeps the user task metadata", (context) => {
  const fixtureDirectory = fs.mkdtempSync(path.join(process.cwd(), ".codex-state-test-"));
  context.after(() => fs.rmSync(fixtureDirectory, { recursive: true, force: true }));

  const userRollout = writeRollout(fixtureDirectory, "user.jsonl", [
    { timestamp: "2026-08-03T23:30:00.000Z", type: "event_msg", payload: { type: "task_started" } },
    {
      timestamp: "2026-08-03T23:30:01.000Z",
      type: "response_item",
      payload: {
        type: "message",
        role: "assistant",
        phase: "commentary",
        content: [{ type: "output_text", text: "The user task is still running." }],
      },
    },
    {
      timestamp: "2026-08-03T23:30:02.000Z",
      type: "response_item",
      payload: {
        type: "custom_tool_call",
        name: "exec",
        call_id: "user-command",
        input: "await tools.shell_command({ command: 'Get-ChildItem' });",
      },
    },
  ]);
  const internalRollout = writeRollout(fixtureDirectory, "internal.jsonl", [
    { timestamp: "2026-08-03T23:31:00.000Z", type: "event_msg", payload: { type: "task_started" } },
  ]);

  const threads = createThreadsDatabase();
  context.after(() => threads.close());
  const insert = threads.prepare(`
    INSERT INTO threads (
      id, rollout_path, title, name, preview, first_user_message,
      approval_mode, archived, recency_at_ms, updated_at_ms, thread_source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insert.run(
    "019fc9cc-fba2-7ff0-84d2-d2b1d7a93d91",
    userRollout,
    "Serve inventory via Tailscale",
    null,
    "Serve the inventory app",
    "Please serve the inventory app",
    "on-request",
    0,
    100,
    100,
    "user",
  );
  insert.run(
    "019fc9e6-8a68-7843-8b6a-7d0f1146fb70",
    internalRollout,
    "just showing a white screen?",
    null,
    "guardian transcript",
    "guardian transcript",
    "on-request",
    0,
    200,
    200,
    "subagent",
  );

  const payloads = [];
  const watcher = new CodexStateWatcher((payload) => payloads.push(payload));
  watcher.stateDb = threads;
  watcher.refreshThread(true);
  watcher.emit(watcher.state, null, null);

  assert.equal(payloads.length, 1);
  assert.equal(payloads[0].threadId, "019fc9cc-fba2-7ff0-84d2-d2b1d7a93d91");
  assert.equal(payloads[0].threadTitle, "Serve inventory via Tailscale");
  assert.equal(payloads[0].commentaryText, "The user task is still running.");
  assert.equal(payloads[0].activity?.kind, "command");
});

test("legacy user tasks without thread_source remain eligible", (context) => {
  const threads = createThreadsDatabase();
  context.after(() => threads.close());
  const insert = threads.prepare(`
    INSERT INTO threads (
      id, rollout_path, title, name, preview, first_user_message,
      approval_mode, archived, recency_at_ms, updated_at_ms, thread_source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insert.run(
    "019fc945-aa1b-7901-b2de-53db7c85b023",
    path.join(process.cwd(), "legacy-user.jsonl"),
    "Legacy user task",
    null,
    "Legacy preview",
    "Legacy prompt",
    "on-request",
    0,
    100,
    100,
    null,
  );
  insert.run(
    "019fc9e6-8a68-7843-8b6a-7d0f1146fb70",
    path.join(process.cwd(), "newer-subagent.jsonl"),
    "Internal task",
    null,
    "Internal preview",
    "Internal prompt",
    "on-request",
    0,
    200,
    200,
    "subagent",
  );

  const watcher = new CodexStateWatcher(() => {});
  watcher.stateDb = threads;
  watcher.refreshThread(true);

  assert.equal(watcher.threadId, "019fc945-aa1b-7901-b2de-53db7c85b023");
  assert.equal(watcher.threadTitle, "Legacy user task");
});

test("pre-migration databases without a thread_source column remain readable", (context) => {
  const threads = createThreadsDatabase({ includeThreadSource: false });
  context.after(() => threads.close());
  threads.prepare(`
    INSERT INTO threads (
      id, rollout_path, title, name, preview, first_user_message,
      approval_mode, archived, recency_at_ms, updated_at_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "019fc945-aa1b-7901-b2de-53db7c85b023",
    path.join(process.cwd(), "pre-migration-user.jsonl"),
    "Pre-migration user task",
    null,
    "Legacy preview",
    "Legacy prompt",
    "on-request",
    0,
    100,
    100,
  );

  const watcher = new CodexStateWatcher(() => {});
  watcher.stateDb = threads;
  watcher.refreshThread(true);

  assert.equal(watcher.threadId, "019fc945-aa1b-7901-b2de-53db7c85b023");
  assert.equal(watcher.threadTitle, "Pre-migration user task");
});

test("generated title changes are emitted for the same active user task", (context) => {
  const threads = createThreadsDatabase();
  context.after(() => threads.close());
  const threadId = "019fc9cc-fba2-7ff0-84d2-d2b1d7a93d91";
  const rolloutPath = path.join(process.cwd(), "same-user-rollout.jsonl");
  threads.prepare(`
    INSERT INTO threads (
      id, rollout_path, title, name, preview, first_user_message,
      approval_mode, archived, recency_at_ms, updated_at_ms, thread_source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    threadId,
    rolloutPath,
    "just showing a white screen?",
    null,
    "Initial prompt",
    "Initial prompt",
    "on-request",
    0,
    100,
    100,
    "user",
  );

  const payloads = [];
  const watcher = new CodexStateWatcher((payload) => payloads.push(payload));
  watcher.stateDb = threads;
  watcher.refreshThread(true);
  watcher.emit(watcher.state, null, null);

  threads.prepare("UPDATE threads SET title = ?, updated_at_ms = ? WHERE id = ?")
    .run("Serve inventory via Tailscale", 200, threadId);
  watcher.refreshThread(false);

  assert.equal(payloads.length, 2);
  assert.equal(payloads[0].threadTitle, "just showing a white screen?");
  assert.equal(payloads[1].threadId, threadId);
  assert.equal(payloads[1].threadTitle, "Serve inventory via Tailscale");
});

test("unscoped and other-session logs cannot clear the selected task's live output", (context) => {
  const logs = createLogsDatabase();
  context.after(() => logs.close());
  const insert = logs.prepare(`
    INSERT INTO logs (id, ts, level, target, feedback_log_body, thread_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insert.run(
    1,
    1,
    "TRACE",
    "codex_app_server::outgoing_message",
    "app-server event: turn/completed targeted_connections=3",
    null,
  );
  insert.run(
    2,
    2,
    "ERROR",
    "codex_core::other_task",
    "turn failed in another task",
    "019fc9f8-b40b-7863-8cd0-1224e7ca2d68",
  );

  const payloads = [];
  const watcher = new CodexStateWatcher((payload) => payloads.push(payload));
  watcher.logsDb = logs;
  watcher.threadId = "019fc9cc-fba2-7ff0-84d2-d2b1d7a93d91";
  watcher.state = "thinking";
  watcher.commentaryText = "The user task is still running.";
  watcher.activity = { kind: "command", startedAt: 1 };

  watcher.pollLogs();

  assert.equal(watcher.state, "thinking");
  assert.equal(watcher.commentaryText, "The user task is still running.");
  assert.deepEqual(watcher.activity, { kind: "command", startedAt: 1 });
  assert.equal(payloads.length, 0);
});

test("an error tied to the selected task still transitions it to failed", (context) => {
  const logs = createLogsDatabase();
  context.after(() => logs.close());
  const threadId = "019fc9cc-fba2-7ff0-84d2-d2b1d7a93d91";
  logs.prepare(`
    INSERT INTO logs (id, ts, level, target, feedback_log_body, thread_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(1, 1, "ERROR", "codex_core::active_task", "turn failed", threadId);

  const payloads = [];
  const watcher = new CodexStateWatcher((payload) => payloads.push(payload));
  watcher.logsDb = logs;
  watcher.threadId = threadId;
  watcher.state = "thinking";
  watcher.commentaryText = "The user task is still running.";
  watcher.activity = { kind: "command", startedAt: 1 };

  watcher.pollLogs();

  assert.equal(watcher.state, "failed");
  assert.equal(watcher.commentaryText, null);
  assert.equal(watcher.activity, null);
  assert.equal(payloads.length, 1);
  assert.equal(payloads[0].threadId, threadId);
  assert.equal(payloads[0].state, "failed");
});

test("yielded commands stay active through wait and clear only when the command finishes", () => {
  const startedAt = "2026-08-03T23:34:15.833Z";
  const started = classifyLiveActivity([
    {
      timestamp: startedAt,
      type: "response_item",
      payload: {
        type: "custom_tool_call",
        name: "exec",
        call_id: "exec-call",
        input: "await tools.shell_command({ command: 'long-running task' });",
      },
    },
  ]);

  const yielded = classifyLiveActivity([
    {
      timestamp: "2026-08-03T23:34:26.905Z",
      type: "response_item",
      payload: {
        type: "custom_tool_call_output",
        call_id: "exec-call",
        output: "Script running with cell ID 8\nWall time 11.0 seconds\nOutput:\n",
      },
    },
  ], started);

  assert.equal(yielded.activity?.kind, "command");
  assert.equal(yielded.activity?.startedAt, Date.parse(startedAt));

  const waiting = classifyLiveActivity([
    {
      timestamp: "2026-08-03T23:34:29.680Z",
      type: "response_item",
      payload: {
        type: "function_call",
        name: "wait",
        call_id: "wait-call",
        arguments: JSON.stringify({ cell_id: "8", yield_time_ms: 10000 }),
      },
    },
  ], yielded);

  assert.equal(waiting.activity?.kind, "command");
  assert.equal(waiting.activity?.startedAt, Date.parse(startedAt));

  const yieldedAgain = classifyLiveActivity([
    {
      timestamp: "2026-08-03T23:34:36.621Z",
      type: "response_item",
      payload: {
        type: "function_call_output",
        call_id: "wait-call",
        output: [{ type: "input_text", text: "Script running with cell ID 8\nWall time 21.0 seconds\nOutput:\n" }],
      },
    },
  ], waiting);

  assert.equal(yieldedAgain.activity?.kind, "command");
  assert.equal(yieldedAgain.activity?.startedAt, Date.parse(startedAt));

  const stillWaiting = classifyLiveActivity([
    {
      timestamp: "2026-08-03T23:34:37.000Z",
      type: "response_item",
      payload: {
        type: "function_call",
        name: "wait",
        call_id: "second-wait-call",
        arguments: JSON.stringify({ cell_id: "8", yield_time_ms: 10000 }),
      },
    },
  ], yieldedAgain);

  assert.equal(stillWaiting.activity?.kind, "command");
  assert.equal(stillWaiting.activity?.startedAt, Date.parse(startedAt));

  const finished = classifyLiveActivity([
    {
      timestamp: "2026-08-03T23:34:48.000Z",
      type: "response_item",
      payload: {
        type: "function_call_output",
        call_id: "second-wait-call",
        output: "Script completed\nWall time 20.4 seconds\nOutput:\n",
      },
    },
  ], stillWaiting);

  assert.equal(finished.activity, null);
  assert.deepEqual(finished.activeCommands, {});
});
