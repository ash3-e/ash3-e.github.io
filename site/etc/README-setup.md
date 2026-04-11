# Claude Code + vexp Setup Kit (Windows)

Drop these files into your BCODe project root (`~\downloads\site`) and run the bootstrap.

## Quick Start

```powershell
# From your project root:
.\setup-claude.ps1

# Then update Claude Code and launch:
winget upgrade Anthropic.ClaudeCode
claude
```

The script handles everything: locates your vexp extension, writes `.mcp.json`, populates `CLAUDE.md`, creates `.claudeignore`, and sets up slash commands.

## What's In The Box

| File | Purpose |
|------|---------|
| `setup-claude.ps1` | One-shot PowerShell bootstrap — run once |
| `CLAUDE.md` | Written by the script if empty — project codex for Claude Code |
| `.claudeignore` | Blocks context bombs (339K prompt file, 466K docs-data, other agents' code) |
| `.mcp.json` | Project-local MCP config pointing to your vexp extension |
| `.claude/commands/svg.md` | `/svg` — SVG asset generation workflow |
| `.claude/commands/doc.md` | `/doc` — documentation editing workflow |
| `.claude/commands/review.md` | `/review` — project health check via subagents |

## Verifying vexp Connection

After launching `claude`, run `/mcp`. You should see `vexp` listed and connected. If not:

1. Check `.mcp.json` — the path must match your installed vexp version
2. Your current path: `C:\Users\^w^\.vscode\extensions\vexp.vexp-vscode-1.2.28\dist\mcp-server.cjs`
3. If you update vexp, re-run `setup-claude.ps1` to pick up the new path
4. Alternative: launch with `claude --mcp-config .\.mcp.json`

## How This Saves Tokens

**Without vexp:** Claude Code reads entire files to understand context. A single `site.js` read = 102K tokens.

**With vexp:** `run_pipeline` returns only relevant pivot nodes + skeletons. ~65-70% reduction.

**With `.claudeignore`:** The 339K `codex-last-20-prompts-context.md` and 466K `codex-docs-data.js` never enter context at all.

**With CLAUDE.md:** Claude Code knows your multi-agent protocol, file ownership, and project structure on first turn — no wasted exploration.

**Combined:** You're looking at roughly 70-80% fewer tokens per session vs naked Claude Code on this repo.

## Multi-Agent Note

This CLAUDE.md tells Claude Code it's "Agent Alpha" with front-end domain scope. It will only write to `claude-code-*` prefixed files and respect the Antigravity workspace protocol. The `//` prefix trigger for the 4-Phase Consensus Protocol is preserved.

## This Claude.ai Project vs Claude Code CLI

This Claude.ai project (where you're reading this) is a separate context from Claude Code in your terminal. They don't share memory or sessions. The project knowledge here feeds *this* chat; the CLAUDE.md + vexp feed the CLI. Think of it as two different team members with access to the same repo but different briefing packets.
