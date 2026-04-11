# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BCODe Documentation Portal** — A static HTML/CSS/JavaScript documentation site for BCODe (a streaming-first ASCII protocol for telemetry and control). No build step; assets are served directly.

## Architecture

### Directory Structure
```
root/
├── index.html              # Portal home page (shared)
├── assets/                 # Shared CSS, JS, images, SVG
│   ├── styles.css         # Global design system
│   ├── site.js            # Portal nav, theme switching, doc metadata
│   ├── tree-site.js       # Interactive doc tree/map visualization
│   ├── tree-styles.css    # Tree styling
│   ├── doc-terminal.js    # Inline code runner/terminal
│   ├── bcode_lang.js      # highlight.js grammar for BCODe syntax
│   ├── hljs-theme.css     # Syntax highlighting theme (light/dark)
│   ├── lavalamp.js        # Animated background effects
│   └── [logos, diagrams]  # .png and .svg assets
├── docs/                   # Documentation pages
│   ├── bcode-intro-v*.html              # Intro to BCODe
│   ├── bcode-syntax-v*.html             # Syntax reference
│   ├── bcode-interpretation-v*.html     # Interpretation layer
│   ├── bcode-meta-v*.html               # Meta tag conventions
│   ├── bcode-rest-v*.html               # REST conventions
│   ├── bcode-best-practices-v*.html     # Design practices
│   ├── bcode-telemetry-guide.html       # Telemetry patterns
│   ├── documentation-tree.html          # Interactive tree/sitemap
│   ├── claude-code-index.html           # Claude agent-specific page
│   ├── codex-index.html                 # Codex agent page (do not modify)
│   └── antigravity-index.html           # Antigravity agent page (do not modify)
├── refs/                   # References (build-time data, not used at runtime)
├── etc/                    # Setup, config, and workspace coordination
├── .git/                   # Git history
└── .mcp.json              # MCP server config (if using vexp indexing)
```

### Core Design Patterns

**Theme System**
- CSS custom properties for all theme variables (see `styles.css`)
- Three theme modes: `light`, `balanced` (half), `dark`
- Stored in `localStorage` under `bcode-docs-theme` key
- Body gets classes: `theme-{mode}`, and `dark` if not light mode

**Documentation Portal**
- Portal aggregates doc pages with metadata (summaries, subheader anchors)
- `site.js` maintains mappings: `DOC_PORTAL_META`, `READER_FILE_MAP`, `READER_LINK_MAP`
- Reader pages are self-contained HTML files; portal links and embeds them

**Interactive Tree Visualization** (`tree-site.js`, `tree-styles.css`)
- Renders hierarchical doc structure as interactive card-based tree
- Connectors between nodes (parent-child relationships)
- Glass-mode view for zoomed perspective
- Responds to mobile/desktop viewport sizing

**Syntax Highlighting**
- Uses highlight.js with custom BCODe grammar (`bcode_lang.js`)
- Grammar rules defined in `bcode_lang.js`; CSS theme in `hljs-theme.css`
- Inline code blocks can be highlighted via `<code class="language-bcode">...</code>`

### Multi-Agent Workspace Protocol (Important)

This repository uses an **AI Workspace Coordination Protocol** managed by Antigravity.

**Key Rules:**
- **Agent role**: Claude (Agent Alpha) owns front-end, UI, CSS, JS, DOM
- **File ownership**: Only modify files prefixed `claude-code-*` or explicitly assigned to you
- **Protocol trigger**: If user prompt begins with `//`, execute the 4-Phase Consensus Protocol (see `etc/AI_WORKSPACE_MANAGER.md`)
- **Do not modify**: `codex-*`, `antigravity-*` prefixed files, or shared docs pages

**Key Shared Files** (read-only reference):
- `etc/AI_WORKSPACE_MANAGER.md` — Multi-agent coordination rules
- `etc/AI_TASK_BOARD.md` — Current task assignments and domain boundaries

## Development & Common Commands

### Running the Site
```bash
# Simple HTTP server (Python 3)
python -m http.server 8000
# Then open http://localhost:8000

# Node.js http-server (if installed)
npx http-server -p 8000

# Windows (PowerShell)
python -m http.server 8000
# Or use built-in IIS if available
```

### Documentation Structure & Editing

**Adding or modifying a doc page:**
1. Edit the HTML file in `docs/` directly (e.g., `docs/bcode-syntax-v14.html`)
2. Update `site.js` mappings:
   - `DOC_PORTAL_META` — add summary and subheader anchors
   - `READER_FILE_MAP` — map slug to filename
   - `DOC_CARD_VERSION_OVERRIDES` — version label on card
3. Commit and test in browser

**Doc page template:**
- Copy an existing doc page (e.g., `bcode-intro-v2.html`)
- Keep consistent header/footer structure
- Use semantic HTML (`<section>`, `<h1>`, `<p>`, etc.)
- Code blocks: `<code class="language-bcode">...</code>` for syntax highlighting
- Links to other docs: use relative paths, e.g., `docs/bcode-syntax-v13.html`

**Voice & Style:**
- Technical, direct, second-person ("you should understand...")
- Avoid jargon without explanation
- Use active voice and imperative mood
- Code examples should be copy-pasteable and minimal

### Styling & Theming

**Global design system** (`assets/styles.css`):
- CSS custom properties: `--color-primary`, `--color-bg`, `--color-text`, etc.
- Base typography, spacing, button, card, and layout classes
- Media queries for mobile/tablet/desktop

**Agent-specific styling:**
- If modifying `claude-code-styles.css`: import `styles.css` first, then layer agent-specific overrides
- Do NOT duplicate shared styles — reference via custom properties

**Tree visualization** (`assets/tree-styles.css`):
- Separate color palette for tree nodes (`--tree-node-*`), connectors, and shadows
- Overrides theme colors for better contrast in tree context
- Dark mode variables for `body.theme-balanced` and `body.theme-dark`

### JavaScript & ES Modules

**No bundler** — all JS is served as-is. Module syntax:
```javascript
// assets/my-module.js
export const myFunction = () => { /* ... */ };

// doc page or other module
import { myFunction } from '../assets/my-module.js';
```

**Shared utilities** (`site.js`):
- Theme switching: `setTheme(id)`, `getTheme()`
- DOM helpers: `$(selector)`, `$$(selector)` (querySelector shortcuts)
- Portal navigation: `readerFileForSlug(slug)`, `currentReaderSlug()`
- Doc metadata retrieval via `DOC_PORTAL_META`

**Entry points:**
- `index.html` → `site.js` (portal home)
- `docs/documentation-tree.html` → `tree-site.js` (tree view)
- Doc pages → `doc-terminal.js` (if inline code runner needed)

### Version Control

**Commit message style:**
- Action-focused: "Fix", "Add", "Refactor", "Update"
- Examples: "Match tree arrowheads to connector styling", "Refine mobile reader chart overlays"
- Include what changed and why in brief form

**Tracked files for development:**
- `assets/*.js`, `assets/*.css` — core styling and JS
- `docs/*.html` — doc content
- `index.html` — portal home
- `.gitignore` respects binary limits

**Do not commit:**
- `node_modules/` (if added)
- `.DS_Store`, `Thumbs.db`
- `.vexp/` (vexp caching)
- Backup or temporary directories

## Important Gotchas & Constraints

1. **SVG-in-SVG embedding fails across renderers** — always use `.png` for logos, especially in SVG context
2. **Compact SVGs omit control char columns** (`0x0_` and `0x1_`) intentionally to reduce file size
3. **BCODe.meta is advanced** — warn users to avoid unless targeting a specific design decision
4. **Tree visualization is viewport-sensitive** — test on mobile (600px) and desktop (1200px+) layouts
5. **localStorage keys are global** — prefix to avoid collisions (e.g., `bcode-docs-theme`)
6. **Syntax highlighting requires explicit language class** — `language-bcode` or `language-javascript`
7. **Documentation pages should be self-contained** — they may be linked independently, not always through the portal

## Workflow for Common Tasks

### Adding a theme color or updating design tokens
1. Edit `assets/styles.css` — update CSS custom property values
2. For tree-specific colors, also update `assets/tree-styles.css`
3. Test across all three theme modes in browser
4. Commit: "Update [component] colors for [reason]"

### Fixing a bug in doc navigation or portal
1. Run `python -m http.server 8000` locally
2. Open `http://localhost:8000` and reproduce bug
3. Check `assets/site.js` or `assets/tree-site.js` for the issue
4. Make targeted fix; test in browser on multiple pages
5. Commit: "Fix [what was broken]"

### Adding a new documentation page
1. Copy an existing page from `docs/` to preserve structure
2. Update `site.js`: add entry to `DOC_PORTAL_META`, `READER_FILE_MAP`, version override
3. Update `index.html` footer if adding a top-level doc link
4. Test: open portal, check tree view, verify links work
5. Commit: "Add [doc title] page"

### Responsive design debugging
1. Use browser DevTools mobile device emulator
2. Test breakpoints: 600px (mobile), 900px (tablet), 1200px+ (desktop)
3. Edit `assets/tree-styles.css` or `assets/styles.css` media queries as needed
4. Pay attention to the glass mode responsiveness in tree view

## Key Files & Their Responsibilities

| File | Role |
|------|------|
| `assets/styles.css` | Design system; typography, spacing, color tokens, shared components |
| `assets/site.js` | Portal logic: theme switching, doc metadata, nav routing |
| `assets/tree-site.js` | Tree visualization: rendering, interaction, layout |
| `assets/tree-styles.css` | Tree-specific styling (nodes, connectors, layout) |
| `assets/doc-terminal.js` | Inline code runner/REPL for BCODe snippets (if used) |
| `assets/bcode_lang.js` | highlight.js grammar rules for BCODe syntax |
| `assets/hljs-theme.css` | Syntax highlighting colors (light/dark) |
| `assets/lavalamp.js` | Animated background effects |
| `docs/*.html` | Individual documentation pages (self-contained) |
| `index.html` | Portal home; aggregates doc cards and navigation |
| `etc/AI_WORKSPACE_MANAGER.md` | Multi-agent coordination protocol (reference) |
| `etc/CLAUDE.md` | Setup kit docs (reference) |

## Related Resources

- **BCODe specification**: See `docs/` for full documentation suite
- **Multi-agent protocol**: `etc/AI_WORKSPACE_MANAGER.md` and `etc/AI_TASK_BOARD.md`
- **Setup kit**: `etc/README-setup.md` (for vexp integration and Claude Code CLI)
- **Color reference**: Use `--color-*` custom properties in CSS, avoid hard-coded hex values
