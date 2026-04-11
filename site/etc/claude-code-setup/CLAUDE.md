# BCODe Documentation Portal

Binary/text protocol with syntax layers (syntax, interpretation, meta, rest, node) and protocol adapters (INCOM, MODBUS, DNP3). Static HTML/CSS/JS site — no build step except `codex-build-docs-data.ps1` for search index.

## Multi-Agent Protocol — READ FIRST
An AI Workspace Coordination Protocol is active. Read `AI_WORKSPACE_MANAGER.md` and `AI_TASK_BOARD.md` before any code work.
- **You are Agent Alpha (Claude).** Domain: front-end, UI, CSS, JS, DOM manipulation.
- **Antigravity is the Manager/Architect** with global scope.
- If the user's prompt begins with `//` → execute the 4-Phase Consensus Protocol.
- If not → operate as standard assistant, no protocol trigger.
- **NEVER modify shared files or other agents' prefixed files.** Write only to `claude-code-*` prefixed files.

## vexp — ALWAYS USE FIRST
**YOU MUST call `run_pipeline` before any code modification.** vexp indexes the codebase and returns only relevant code in token-efficient capsules (65-70% reduction).
- New task → `run_pipeline` with task description
- Before refactor → `get_impact_graph` on the target symbol
- Recall past decisions → `search_memory` or `get_session_context`
- After key decisions → `save_observation` to persist reasoning

## Token Discipline — IMPORTANT
- Use subagents for research; keep main context for implementation
- Batch related file edits into single operations
- `/compact` at ~50% context; `/clear` between unrelated tasks
- Never read entire directories — scope to specific files
- Prefer `get_skeleton` over reading full files when exploring
- NEVER read `codex-last-20-prompts-context.md` (339K context dump)

## File Layout (flat root — no subdirectories for docs)
```
├── index.html                      # Main portal (shared)
├── styles.css / site.js            # Shared design system + doc metadata
├── claude-code-index.html          # YOUR agent implementation
├── claude-code-site.js             # YOUR agent JS
├── claude-code-styles.css          # YOUR agent CSS
├── codex-index.html                # Codex agent (DO NOT TOUCH)
├── codex-site.js / codex-styles.css
├── antigravity-index.html          # Antigravity agent (DO NOT TOUCH)
├── antigravity-site.js / antigravity-styles.css
├── bcode-*.html                    # Documentation reader pages (shared reference)
├── bcode_lang.js / hljs-theme.css  # Syntax highlighting (shared)
├── codex-docs-data.js              # Search index (built by PS1 script)
├── codex-build-docs-data.ps1       # PowerShell build for search data
├── lavalamp.js / lavalamp_gen.py   # Background effect
├── logo.png                        # Logo (use .png, not .svg)
├── *.png                           # Compact SVG rasters + ASCII table variants
├── AI_WORKSPACE_MANAGER.md         # Multi-agent protocol
├── AI_TASK_BOARD.md                # Current task assignments
└── prompt.txt                      # Master implementation spec
```

## Stack
- highlight.js with custom `bcode_lang.js` grammar
- Key colors: purple `#6820E0`, indigo-blue `#4338a8`
- CSS custom properties for theming (light/dark/balanced)
- `codex-docs-data.js` generated via `codex-build-docs-data.ps1`

## Code Style
- ES modules, no build step
- CSS custom properties for theming
- Match existing voice in docs: technical, direct, second-person
- Agent-prefixed files inherit shared `styles.css` then layer agent-specific CSS

## Gotchas
- SVG-in-SVG embedding (`<image href="logo.svg">`) fails cross-renderer — use logo.png
- Compact SVGs omit 0x0_ and 0x1_ columns (control chars)
- BCODe.meta is advanced — warn users to avoid unless targeting a specific design decision
- `documentation-tree.html` is just a redirect to `codex-index.html`
- `_gitignore`, `_cursorrules`, `_clinerules` use underscores (not dots) — rename with dots for git/editor to pick them up
- `prompt.txt` is the master spec for the interactive sitemap tree — read it for any tree/portal work

## Workflow
1. `run_pipeline` → understand scope
2. Read `AI_TASK_BOARD.md` if `//` prefix task
3. Plan in a single message (no back-and-forth)
4. Implement in `claude-code-*` prefixed files only
5. Test → commit → `save_observation`
