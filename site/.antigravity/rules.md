# Antigravity workspace rules

This workspace uses a two-stage workflow.

## Stage 1: Planning
- Prefer model: Opus
- Prefer mode: Planning
- Produce a concrete implementation plan before making risky changes.
- Present the plan as numbered steps with rollback notes and validation checks.

## Stage 2: Execution
- Prefer model: GPT-OSS 120B
- Prefer mode: Fast
- Execute only from the approved plan in `.antigravity-orchestrator/approved-plan.md`.
- If the approved plan is missing or ambiguous, stop and ask for clarification instead of guessing.

## vexp usage
- Before code modification, use the vexp MCP tools when available.
- First choice: `run_pipeline`
- Use the current vexp HTTP/SSE endpoint: http://localhost:7822
- Summarize the key files/context discovered before editing.


## vexp <!-- vexp v1.2.30 -->

**MANDATORY: use `run_pipeline` — do NOT grep or glob the codebase.**
vexp returns pre-indexed, graph-ranked context in a single call.

### Workflow
1. `run_pipeline` with your task description — ALWAYS FIRST (replaces all other tools)
2. Make targeted changes based on the context returned
3. `run_pipeline` again only if you need more context

### Available MCP tools
- `run_pipeline` — **PRIMARY TOOL**. Runs capsule + impact + memory in 1 call.
  Example: `run_pipeline({ "task": "fix auth bug" })`
- `get_context_capsule` — lightweight, for simple questions only
- `get_impact_graph` — impact analysis of a specific symbol
- `search_logic_flow` — execution paths between functions
- `get_skeleton` — compact file structure
- `index_status` — indexing status
- `get_session_context` — recall observations from sessions
- `search_memory` — cross-session search
- `save_observation` — persist insights (prefer run_pipeline's observation param)

### Agentic search
- Do NOT use built-in file search, grep, or codebase indexing — always call `run_pipeline` first
- If you spawn sub-agents or background tasks, pass them the context from `run_pipeline`
  rather than letting them search the codebase independently

### Smart Features
Intent auto-detection, hybrid ranking, session memory, auto-expanding budget.

### Multi-Repo
`run_pipeline` auto-queries all indexed repos. Use `repos: ["alias"]` to scope. Run `index_status` to see aliases.
<!-- /vexp -->