# --- BCODe Project: Claude Code + vexp Setup (Windows) ---
# Run once from project root: powershell -ExecutionPolicy Bypass -File setup-claude.ps1
# Requires: Node.js 18+, VS Code with vexp extension

$ErrorActionPreference = "Stop"

function Log($msg)  { Write-Host "  + " -NoNewline -ForegroundColor Green; Write-Host $msg }
function Info($msg) { Write-Host "    $msg" -ForegroundColor DarkGray }
function Err($msg)  { Write-Host "  X " -NoNewline -ForegroundColor Red; Write-Host $msg; exit 1 }

Write-Host ""
Write-Host "  === BCODe Claude Code + vexp Setup ===" -ForegroundColor Magenta
Write-Host ""

# -- 1. Verify project root --
if (-not (Test-Path "AI_WORKSPACE_MANAGER.md")) {
    Err "Run this from the BCODe project root (AI_WORKSPACE_MANAGER.md not found)"
}
Log "Project root detected"

# -- 2. Check Node.js --
try {
    $nodeVer = (node -v) -replace '^v',''
    $major = [int]($nodeVer.Split('.')[0])
    if ($major -lt 18) { Err "Node.js 18+ required (found v$nodeVer)" }
    Log "Node.js v$nodeVer detected"
} catch {
    Err "Node.js not found. Install Node 18+ first."
}

# -- 3. Locate vexp MCP server --
$vexpPath = $null
$searchDirs = @(
    "$env:USERPROFILE\.vscode\extensions",
    "$env:USERPROFILE\.cursor\extensions",
    "$env:USERPROFILE\.windsurf\extensions"
)

foreach ($dir in $searchDirs) {
    $found = Get-ChildItem "$dir\vexp.vexp-vscode-*\dist\mcp-server.cjs" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $vexpPath = $found.FullName
        break
    }
}

if (-not $vexpPath) {
    Err "vexp extension not found. Install it from VS Code Extensions panel (search 'vexp')."
}
Log "vexp MCP server found: $vexpPath"

# -- 4. Write .mcp.json --
$escapedPath = $vexpPath -replace '\\','\\'
$mcpJson = '{"mcpServers":{"vexp":{"type":"stdio","command":"node","args":["' + $escapedPath + '"]}}}'
$mcpPretty = $mcpJson | ConvertFrom-Json | ConvertTo-Json -Depth 4
Set-Content -Path ".mcp.json" -Value $mcpPretty -Encoding UTF8
Log ".mcp.json written (project-local MCP config)"

# -- 5. Drop CLAUDE.md if empty or missing --
$claudeMd = "CLAUDE.md"
$isEmpty = (-not (Test-Path $claudeMd)) -or ((Get-Item $claudeMd).Length -eq 0)

if ($isEmpty) {
    Info "CLAUDE.md is empty - writing project codex..."
    $L = @()
    $L += "# BCODe Documentation Portal"
    $L += ""
    $L += "Binary/text protocol with syntax layers (syntax, interpretation, meta, rest, node) and protocol adapters (INCOM, MODBUS, DNP3). Static HTML/CSS/JS site - no build step except codex-build-docs-data.ps1 for search index."
    $L += ""
    $L += "## Multi-Agent Protocol - READ FIRST"
    $L += "An AI Workspace Coordination Protocol is active. Read AI_WORKSPACE_MANAGER.md and AI_TASK_BOARD.md before any code work."
    $L += "- **You are Agent Alpha (Claude).** Domain: front-end, UI, CSS, JS, DOM manipulation."
    $L += "- **Antigravity is the Manager/Architect** with global scope."
    $L += "- If the user prompt begins with // then execute the 4-Phase Consensus Protocol."
    $L += "- If not then operate as standard assistant, no protocol trigger."
    $L += "- **NEVER modify shared files or other agents prefixed files.** Write only to claude-code-* prefixed files."
    $L += ""
    $L += "## vexp - ALWAYS USE FIRST"
    $L += "**YOU MUST call run_pipeline before any code modification.** vexp indexes the codebase and returns only relevant code in token-efficient capsules (65-70% reduction)."
    $L += "- New task: run_pipeline with task description"
    $L += "- Before refactor: get_impact_graph on the target symbol"
    $L += "- Recall past decisions: search_memory or get_session_context"
    $L += "- After key decisions: save_observation to persist reasoning"
    $L += ""
    $L += "## Token Discipline - IMPORTANT"
    $L += "- Use subagents for research; keep main context for implementation"
    $L += "- Batch related file edits into single operations"
    $L += "- /compact at ~50% context; /clear between unrelated tasks"
    $L += "- Never read entire directories - scope to specific files"
    $L += "- Prefer get_skeleton over reading full files when exploring"
    $L += "- NEVER read codex-last-20-prompts-context.md (339K context dump)"
    $L += ""
    $L += "## File Layout (flat root - no subdirectories)"
    $L += "- index.html - Main portal (shared)"
    $L += "- styles.css / site.js - Shared design system + doc metadata"
    $L += "- claude-code-index.html - YOUR agent implementation"
    $L += "- claude-code-site.js - YOUR agent JS"
    $L += "- claude-code-styles.css - YOUR agent CSS"
    $L += "- codex-index.html - Codex agent (DO NOT TOUCH)"
    $L += "- antigravity-index.html - Antigravity agent (DO NOT TOUCH)"
    $L += "- bcode-*.html - Documentation reader pages (shared reference)"
    $L += "- bcode_lang.js / hljs-theme.css - Syntax highlighting (shared)"
    $L += "- codex-docs-data.js - Search index (built by PS1 script)"
    $L += "- prompt.txt - Master implementation spec for sitemap tree"
    $L += "- AI_WORKSPACE_MANAGER.md - Multi-agent protocol"
    $L += "- AI_TASK_BOARD.md - Current task assignments"
    $L += "- logo.png - Logo (use .png not .svg in SVGs)"
    $L += ""
    $L += "## Stack"
    $L += "- highlight.js with custom bcode_lang.js grammar"
    $L += "- Key colors: purple #6820E0, indigo-blue #4338a8"
    $L += "- CSS custom properties for theming (light/dark/balanced)"
    $L += ""
    $L += "## Code Style"
    $L += "- ES modules, no build step"
    $L += "- CSS custom properties for theming"
    $L += "- Match existing voice in docs: technical, direct, second-person"
    $L += "- Agent-prefixed files inherit shared styles.css then layer agent-specific CSS"
    $L += ""
    $L += "## Gotchas"
    $L += "- SVG-in-SVG embedding fails cross-renderer - always use logo.png"
    $L += "- Compact SVGs omit 0x0_ and 0x1_ columns (control chars)"
    $L += "- BCODe.meta is advanced - warn users to avoid unless targeting a specific design decision"
    $L += "- documentation-tree.html is just a redirect to codex-index.html"
    $L += "- prompt.txt is the master spec for the interactive sitemap tree"
    $L += "- Config files use underscores (_gitignore, _cursorrules) - rename with dots for tooling"
    $L += ""
    $L += "## Workflow"
    $L += "1. run_pipeline to understand scope"
    $L += "2. Read AI_TASK_BOARD.md if // prefix task"
    $L += "3. Plan in a single message (no back-and-forth)"
    $L += "4. Implement in claude-code-* prefixed files only"
    $L += "5. Test, commit, save_observation"
    $L -join "`r`n" | Set-Content -Path $claudeMd -Encoding UTF8
    Log "CLAUDE.md written"
} else {
    Info "CLAUDE.md already has content - skipping (review manually)"
}

# -- 6. Drop .claudeignore if missing --
if (-not (Test-Path ".claudeignore")) {
    $I = @()
    $I += "# Context bombs"
    $I += "codex-last-20-prompts-context.md"
    $I += "codex-docs-data.js"
    $I += ""
    $I += "# Other agents implementations"
    $I += "codex-site.js"
    $I += "codex-styles.css"
    $I += "antigravity-index.html"
    $I += "antigravity-site.js"
    $I += "antigravity-styles.css"
    $I += ""
    $I += "# Heavy / irrelevant"
    $I += "node_modules/"
    $I += ".git/"
    $I += ".vexp/"
    $I += "backup*/"
    $I += "_restore/"
    $I += "drive-download-*/"
    $I += "REQUESTED_CHANGE_IMAGES_LETTERED/"
    $I += "*.min.js"
    $I += "*.min.css"
    $I += ""
    $I += "# Binaries Claude cannot parse"
    $I += "*.woff"
    $I += "*.woff2"
    $I += "*.ttf"
    $I += "*.eot"
    $I += "*.zip"
    $I += ""
    $I += "# OS junk"
    $I += ".DS_Store"
    $I += "Thumbs.db"
    $I -join "`r`n" | Set-Content -Path ".claudeignore" -Encoding UTF8
    Log ".claudeignore created"
} else {
    Info ".claudeignore already exists - skipping"
}

# -- 7. Create slash commands --
$cmdDir = ".claude\commands"
if (-not (Test-Path $cmdDir)) { New-Item -ItemType Directory -Path $cmdDir -Force | Out-Null }

if (-not (Test-Path "$cmdDir\svg.md")) {
    $svgCmd = "Generate or update SVG assets for the BCODe documentation site.`r`n`r`n"
    $svgCmd += "1. run_pipeline with task: SVG generation for ARGUMENTS`r`n"
    $svgCmd += "2. Read the Python generator script (e.g. gen_compact.py)`r`n"
    $svgCmd += "3. Apply requested changes to the generator - NOT the SVG directly`r`n"
    $svgCmd += "4. Run the generator to produce all 3 theme variants (light, dark, balanced)`r`n"
    $svgCmd += "5. Verify dimensions match across all variants`r`n"
    $svgCmd += "6. save_observation noting what changed and why"
    Set-Content -Path "$cmdDir\svg.md" -Value $svgCmd -Encoding UTF8
    Log "Slash command /svg created"
}

if (-not (Test-Path "$cmdDir\doc.md")) {
    $docCmd = "Edit BCODe documentation HTML files.`r`n`r`n"
    $docCmd += "1. run_pipeline with task: documentation edit for ARGUMENTS`r`n"
    $docCmd += "2. Match existing voice: technical, direct, second-person`r`n"
    $docCmd += "3. Use highlight.js code blocks with class language-bcode for syntax examples`r`n"
    $docCmd += "4. BCODe.meta references must include the advanced-concept warning`r`n"
    $docCmd += "5. Batch all related edits into a single operation`r`n"
    $docCmd += "6. save_observation with section numbers modified"
    Set-Content -Path "$cmdDir\doc.md" -Value $docCmd -Encoding UTF8
    Log "Slash command /doc created"
}

if (-not (Test-Path "$cmdDir\review.md")) {
    $reviewCmd = "Quick project review. Use subagents for all investigation.`r`n`r`n"
    $reviewCmd += "Use subagents to:`r`n"
    $reviewCmd += "1. Check all HTML files for broken internal links`r`n"
    $reviewCmd += "2. Verify SVG theme variants have matching dimensions`r`n"
    $reviewCmd += "3. Confirm bcode_lang.js grammar covers all documented syntax`r`n"
    $reviewCmd += "4. Check hljs-theme.css colors match site design tokens`r`n`r`n"
    $reviewCmd += "Report findings as a concise checklist. Do NOT read files in main context."
    Set-Content -Path "$cmdDir\review.md" -Value $reviewCmd -Encoding UTF8
    Log "Slash command /review created"
}

# -- 8. Update gitignore --
$gitignoreFile = $null
if (Test-Path "_gitignore") { $gitignoreFile = "_gitignore" }
elseif (Test-Path ".gitignore") { $gitignoreFile = ".gitignore" }

if ($gitignoreFile) {
    $content = Get-Content $gitignoreFile -Raw -ErrorAction SilentlyContinue
    if (-not $content) { $content = "" }
    $additions = @()
    if ($content -notmatch '\.vexp/')            { $additions += ".vexp/" }
    if ($content -notmatch '\.mcp\.json')        { $additions += ".mcp.json" }

    if ($additions.Count -gt 0) {
        $block = "`r`n# vexp + Claude Code`r`n" + ($additions -join "`r`n")
        Add-Content -Path $gitignoreFile -Value $block
        Log "Updated $gitignoreFile with vexp/mcp entries"
    }
} else {
    $gi = @(".vexp/", "!.vexp/manifest.json", ".mcp.json") -join "`r`n"
    Set-Content -Path ".gitignore" -Value "# vexp local index`r`n$gi" -Encoding UTF8
    Log ".gitignore created"
}

# -- 9. Run vexp index if available --
$hasVexp = Get-Command vexp -ErrorAction SilentlyContinue
if ($hasVexp) {
    if (Test-Path ".vexp") {
        Info "Running vexp incremental sync..."
        & vexp index --incremental 2>$null
    } else {
        Info "Running first-time vexp index..."
        & vexp index
    }
    Log "vexp index ready"
} else {
    Info "vexp CLI not found globally - that is OK"
    Info "Install globally with: npm install -g vexp-cli"
    Info "Or run vexp: Setup Workspace from VS Code Command Palette"
}

# -- Done --
Write-Host ""
Write-Host "  === Setup Complete ===" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor White
Write-Host "    1. Launch:     claude"
Write-Host "    2. Verify MCP: /mcp  (should show vexp connected)"
Write-Host ""
Write-Host "  If /mcp shows vexp disconnected:" -ForegroundColor Yellow
Write-Host "    - Check path in .mcp.json matches your vexp extension version"
Write-Host "    - Try: claude --mcp-config .\.mcp.json"
Write-Host ""
Write-Host "  Slash commands:  /svg  /doc  /review" -ForegroundColor Cyan
Write-Host ""
