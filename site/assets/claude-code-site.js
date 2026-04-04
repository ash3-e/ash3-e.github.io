/* claude-code-site.js — Claude Code agent sitemap (isolated cc- prefix) */
(() => {
  "use strict";

  /* ─── Data (mirrors site.js) ─── */
  const DOC_META = {
    intro:                   { label: "Intro",                 file: "bcode-intro-v2.html",                  annotation: null,    summary: "Narrative introduction to BCODe fundamentals, stream framing, and practical engineering tradeoffs.",        subtitles: ["Architecture","Atomic latching","Example gallery"] },
    syntax:                  { label: "BCODe.syntax",          file: "bcode-syntax-v13.html",               annotation: null,    summary: "Normative syntax reference for terminators, payload rules, parser states, and conformance vectors.",             subtitles: ["Grammar","State machine","Conformance tests"] },
    interpretation:          { label: "BCODe.interpretation",  file: "bcode-interpretation-v10.html",       annotation: null,    summary: "Interpretation layer guidance for qualifiers, value classes, staleness, and typed access semantics.",            subtitles: ["Qualifier model","Reducer behavior","Accessor semantics"] },
    "meta-v9":               { label: "BCODe.meta",            file: "bcode-meta-v9.html",                  annotation: "][^\\", summary: "Current BCODe.meta conventions for request/response behavior, packets, counters, and transport usage.",     subtitles: ["Meta tags","Packeting","Sequence conventions"] },
    "meta-library-semantics":{ label: "Meta Library Semantics",file: "bcode-meta-library-semantics-v9.html",annotation: null,    summary: "Library-level semantics and API-oriented behavior for integrating BCODe.meta in tooling.",                    subtitles: ["Library flags","Unit handling","Consumer API"] },
    rest:                    { label: "BCODe.rest",             file: "bcode-rest-v6.1.3.html",             annotation: "a→f",  summary: "BCODe.rest conventions for resource-oriented request/response streams and operation sequencing.",              subtitles: ["Resource model","Verb mapping","Stream operations"] },
    "best-practices":        { label: "Best Practices",         file: "bcode-best-practices-v13.html",      annotation: null,    summary: "Design and interoperability best practices for schema discipline, resilience, and deployment consistency.",      subtitles: ["Schema discipline","Interoperability","Operational safety"] },
    "telemetry-guide":       { label: "Telemetry Guide",        file: "bcode-telemetry-guide.html",         annotation: null,    summary: "Scalable telemetry/control patterns from simple feeds to complex multi-line packet workflows.",                 subtitles: ["Scaling patterns","Control loops","Production telemetry"] }
  };

  const SUBTOPIC_ANCHORS = {
    intro: {
      "Architecture":    "structural-philosophy-determinism-by-ascii-columns",
      "Atomic latching": "the-atomic-line-model",
      "Example gallery": "example-gallery-optional-patterns-to-copy-paste"
    }
  };

  /* ─── Layout — SVG viewBox: 0 0 1150.5081 1008.1333
     x% = svgX / 1150.5081 * 100
     y% = svgY / 1008.1333 * 100
     w% = svgW / 1150.5081 * 100
     h  = fixed px (Codex approach, container is 950px tall)

     Protocol nodes pushed UP so "PROTOCOL REPRESENTATION" label
     can sit BELOW them without overlap.

     MODBUS: pushed to y≈7%  (was 15.5%)
     DNP3:   pushed to y≈11% (was 21.45%)
     Label:  at y≈17.5%      (below DNP3 bottom ~16%)
     Gallery panel: at y≈19% (below label)
  ─── */
  const LAYOUT = [
    /* Protocol zone — nodes pushed up */
    { id:"modbus", kind:"concept", x:  1.1, y:  6.5, w: 18.3, h: 48, label:"BCODe.MODBUS" },
    { id:"dnp3",   kind:"concept", x:  1.1, y: 10.55, w: 18.3, h: 48, label:"BCODe.DNP3" },
    /* Protocol label sits BELOW DNP3 */
    { id:"protocol-label", kind:"label", x: 1.9, y: 15.7, w: 16.7, text:"PROTOCOL\nREPRESENTATION" },
    /* Core stack (bottom→top) */
    { id:"intro",          kind:"doc",     x: 34.62, y: 81.83, w: 23.46, h: 148, slug:"intro",           gallery:true },
    { id:"syntax",         kind:"doc",     x: 35.49, y: 61.8,  w: 21.73, h: 148, slug:"syntax" },
    { id:"interpretation", kind:"doc",     x: 35.49, y: 41.76, w: 21.73, h: 148, slug:"interpretation" },
    { id:"meta-v9",        kind:"doc",     x: 35.49, y: 21.72, w: 21.73, h: 148, slug:"meta-v9" },
    /* Top branch */
    { id:"rest",           kind:"doc",     x: 32.35, y:  2.87, w: 13.56, h: 148, slug:"rest" },
    { id:"bcnode",         kind:"concept", x: 46.78, y:  2.87, w: 13.56, h: 148, label:"BCODe.node", subtitles:["State relay","Mode sync","Health flags"] },
    /* Right cluster */
    { id:"meta-library-semantics", kind:"doc", x: 76.05, y: 21.52, w: 21.74, h: 148, slug:"meta-library-semantics" },
    { id:"best-practices", kind:"doc",     x: 71.36, y: 81.83, w: 21.74, h: 148, slug:"best-practices" },
    { id:"telemetry-guide",kind:"doc",     x: 72.1,  y: 58.15, w: 22.5,  h: 132, slug:"telemetry-guide" },
    /* Freestyle */
    { id:"freestyle",      kind:"concept", x: 63.67, y: 67.56, w: 16.18, h: 52,  label:"FREESTYLE" },
  ];

  /* Gallery panel position — under protocol label */
  const GALLERY_POS = { x: 1.1, y: 19.2, w: 18.3 };

  /* Gallery items from SVG section 19 */
  const GALLERY = [
    "19.1 Atomic latching","19.2 Minimal single measurement","19.3 Multi-sensor readout",
    "19.4 Qualifier quick sampler","19.5 Stale-but-useful freshness","19.6 Bounds as intent",
    "19.7 Smallest step control","19.8 Diagnostics inline","19.9 Command/response tags",
    "19.10 Multiline packet: fixed","19.11 Multiline packet: open","19.12 Sequence counter dropout",
    "19.13 String payloads ($...)","19.14 Hex payloads (%...%)","19.15 Raw binary payloads ()",
    "19.16 Scientific notation","19.17 Resource-oriented (rest)","19.18 Ordinals as response lanes",
    "19.19 Temperature controller","19.20 Spectrometer diagnostics","19.21 Debugger grep tricks"
  ];

  /* ─── Connector SVG — exact paths from bcode-doc-nav-final.svg
     viewBox matches SVG native coords; preserveAspectRatio=none so
     percentage node positions align with connector path coords.

     Arrow markers match Codex exactly:
       codexArrowUp  — upward triangle, markerUnits=userSpaceOnUse
       ccArrAuto     — rightward triangle, auto-orient
  ─── */
  const CONNECTORS_BASE = `
<svg class="cc-connectors" id="ccConnectorsSvg"
     viewBox="0 0 1150.5081 1008.1333" preserveAspectRatio="none"
     xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <marker id="ccArrUp" viewBox="0 0 10 8" refX="5" refY="0"
            markerWidth="12" markerHeight="10" markerUnits="userSpaceOnUse" orient="0">
      <polygon points="5,0 10,8 0,8" fill="#6820e0"/>
    </marker>
    <marker id="ccArrAuto" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b13e0"/>
    </marker>
    <marker id="ccArrLeft" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b13e0"/>
    </marker>
  </defs>

  <!-- ── Dashed vertical separator ── -->
  <line x1="290" y1="26.515" x2="290" y2="979.160"
        stroke="#c4b5fd" stroke-width="1.42" stroke-dasharray="7,5" opacity="0.4"/>

  <!-- ── Central chain: Intro→Syntax→Interpretation→Meta (arrows point UP) ── -->
  <line x1="533.304" y1="824.983" x2="533.304" y2="779.591"
        stroke="#6820e0" stroke-width="2.18" marker-end="url(#ccArrUp)"/>
  <line x1="533.304" y1="622.983" x2="533.304" y2="577.484"
        stroke="#6820e0" stroke-width="2.18" marker-end="url(#ccArrUp)"/>
  <line x1="533.304" y1="420.983" x2="533.304" y2="375.583"
        stroke="#6820e0" stroke-width="2.18" marker-end="url(#ccArrUp)"/>

  <!-- ── Meta → BCODe.rest / BCODe.node (fork upward) ── -->
  <line x1="449.725" y1="218.412" x2="449.725" y2="185.586"
        stroke="#6820e0" stroke-width="2.16" marker-end="url(#ccArrUp)"/>
  <line x1="616.883" y1="218.412" x2="616.883" y2="185.586"
        stroke="#6820e0" stroke-width="2.16" marker-end="url(#ccArrUp)"/>

  <!-- ── Meta → Protocol Representation (L-shape left then down) ── -->
  <path d="m 408.304,295.188 h -82.780 h -2.923 h -68.833
           c -10.456,0 -10.489,-11.855 -10.489,-11.855 V 181.262"
        stroke="#3b13e0" stroke-width="2.05" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>

  <!-- ── Fork arrows left into MODBUS / DNP3
       Protocol nodes now at ~y=6.5% and ~y=10.55% in % space.
       In SVG native coords (×1008.1333):
         MODBUS top  ≈ 6.5%  × 1008.1333 = 65.5px,  bottom ≈ 65.5+48 = 113.5px, center ≈ 89.5px
         DNP3   top  ≈ 10.55% × 1008.1333 = 106.4px, bottom ≈ 106.4+48 = 154.4px, center ≈ 130.4px
         Right edge of protocol node: (1.1+18.3)/100 × 1150.5081 = 223.4px
       The L-path comes down to y=181.262 which is between MODBUS and DNP3 centers.
       We add two fork lines matching the adjusted vertical centers.
  ── -->
  <path d="m 243.311,89.5 h -20.657"
        stroke="#3b13e0" stroke-width="1.75" fill="none"
        marker-end="url(#ccArrLeft)"/>
  <line x1="242.498" y1="130.4" x2="222.654" y2="130.4"
        stroke="#3b13e0" stroke-width="1.75"
        marker-end="url(#ccArrLeft)"/>

  <!-- ── Meta dashed guide → Meta Library Semantics area ── -->
  <path d="m 658.474,292.983 h 155.084 c 12,0 12,12 12,12 v 204.055"
        stroke="#4338a8" stroke-width="2.2" stroke-dasharray="6,4"
        opacity="0.45" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>

  <!-- ── Meta Library dashed guide back-left ── -->
  <path d="M 990.261,292.983 H 835.422 c -6.250,0 -9.245,3.255 -10.680,6.374"
        stroke="#4338a8" stroke-width="2.2" stroke-dasharray="6,4"
        opacity="0.45" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>

  <!-- ── Interpretation → Freestyle (solid L, arrow right+down) ── -->
  <path d="m 658.558,497.038 h 155 c 12,0 12,12 12,12 v 163.405"
        stroke="#3b13e0" stroke-width="2.2" fill="none"
        stroke-linecap="round" stroke-linejoin="round"
        marker-end="url(#ccArrAuto)"/>

  <!-- ── Intro dashed guide left (toward protocol area) ── -->
  <path d="M 398.742,948.864 l -99.023,0.246"
        stroke="#7a34eb" stroke-width="2.2" stroke-dasharray="6,4"
        opacity="0.45" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

  /* ─── Helpers ─── */
  const DOC_BASE = "../docs/";
  const esc = (s) => String(s||"").replace(/[&<>"']/g, m=>
    ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const docUrl     = (slug)         => `${DOC_BASE}${DOC_META[slug].file}`;
  const anchorUrl  = (slug, anchor) => anchor ? `${DOC_BASE}${DOC_META[slug].file}#${anchor}` : docUrl(slug);
  const subtitleAnchor = (slug, label) => (SUBTOPIC_ANCHORS[slug] || {})[label] || null;

  /* ─── State ─── */
  let galleryOpen  = false;
  let searchQuery  = "";
  let searchHits   = new Set();
  const nodeEls    = {}; // id → .cc-node element
  let galleryRowEl = null; // the .is-gallery row element
  let galleryPanelEl = null;
  let svgEl        = null;

  /* ─── Search ─── */
  const docContains = (slug, q) => {
    if (!q || !DOC_META[slug]) return false;
    const lq = q.toLowerCase();
    const d  = DOC_META[slug];
    return [d.label, d.summary, ...d.subtitles].join(" ").toLowerCase().includes(lq);
  };

  const runSearch = (q) => {
    searchQuery = q.trim();
    searchHits  = new Set();
    if (searchQuery) {
      Object.keys(DOC_META).forEach(slug => {
        if (docContains(slug, searchQuery)) searchHits.add(slug);
      });
    }
    applyGlow();
    updateSearchMeta();
  };

  const updateSearchMeta = () => {
    const el = document.getElementById("ccSearchMeta");
    if (!el) return;
    if (!searchQuery) { el.textContent = "Hover a node to preview it."; return; }
    const n = searchHits.size;
    el.textContent = `${n} matching node${n===1?"":"s"}.`;
  };

  const applyGlow = () => {
    Object.entries(nodeEls).forEach(([id, el]) => {
      const slug = el.dataset.slug;
      const glows = !!slug && searchHits.has(slug);
      el.classList.toggle("is-glowing", glows);
      el.querySelectorAll(".cc-sub-row").forEach(row => {
        if (!glows || !searchQuery) { row.classList.remove("is-subtitle-glowing"); return; }
        const lbl = (row.dataset.label||"").toLowerCase();
        row.classList.toggle("is-subtitle-glowing", lbl.includes(searchQuery.toLowerCase()));
      });
    });
    document.querySelectorAll(".cc-gallery-item").forEach(item => {
      if (!searchQuery) { item.classList.remove("is-glowing"); return; }
      item.classList.toggle("is-glowing",
        (item.dataset.label||"").toLowerCase().includes(searchQuery.toLowerCase()));
    });
  };

  /* ─── Preview ─── */
  const showPreview = ({slug, subtitle, galleryItem, jumpUrl}) => {
    const titleEl   = document.getElementById("ccPvTitle");
    const metaEl    = document.getElementById("ccPvMeta");
    const summaryEl = document.getElementById("ccPvSummary");
    const snippetEl = document.getElementById("ccPvSnippet");
    const chipsEl   = document.getElementById("ccPvChips");
    const card      = document.getElementById("ccPreviewCard");
    if (!titleEl) return;

    const d = slug ? DOC_META[slug] : null;

    titleEl.textContent   = subtitle || galleryItem || (d ? d.label : "—");
    metaEl.textContent    = subtitle    ? `${d?.label} › ${subtitle}` :
                            galleryItem ? `${d?.label} › Example Gallery` :
                            (d ? d.file.replace(/\.html$/,"") : "");
    summaryEl.textContent = d ? (
      subtitle    ? `${subtitle} — ${d.summary}` :
      galleryItem ? `Example Gallery › ${galleryItem}. ${d.summary}` :
      d.summary
    ) : "";

    let snippet = "";
    if (searchQuery && d) {
      const lq = searchQuery.toLowerCase();
      if (d.label.toLowerCase().includes(lq)) snippet = `Matched in title: "${d.label}"`;
      else if (d.summary.toLowerCase().includes(lq)) {
        const i = d.summary.toLowerCase().indexOf(lq);
        const s = Math.max(0,i-40), e = Math.min(d.summary.length,i+searchQuery.length+60);
        snippet = (s>0?"…":"")+d.summary.slice(s,e)+(e<d.summary.length?"…":"");
      } else if (subtitle) snippet = `Matched in section: "${subtitle}"`;
    }
    snippetEl.textContent = snippet;
    snippetEl.classList.toggle("has-content", !!snippet);

    if (chipsEl && d) {
      chipsEl.innerHTML = d.subtitles.map(sub => {
        const a = subtitleAnchor(slug, sub);
        const url = a ? anchorUrl(slug, a) : docUrl(slug);
        return `<a class="cc-preview-chip${sub===subtitle?" is-active":""}" href="${url}">${esc(sub)}</a>`;
      }).join("");
    }

    if (card) {
      const url = jumpUrl || (
        subtitle    ? anchorUrl(slug, subtitleAnchor(slug, subtitle)) :
        galleryItem ? anchorUrl(slug, subtitleAnchor(slug, "Example gallery")) :
        (d ? docUrl(slug) : ""));
      card.dataset.jumpUrl = url || "";
    }
  };

  /* ─── Node builder ─── */
  const buildNode = (cfg) => {
    const el = document.createElement("div");
    const isProto = cfg.kind === "concept" || cfg.kind === "label";
    el.className = "cc-node" + (isProto ? " cc-proto" : "");
    el.style.left   = `${cfg.x}%`;
    el.style.top    = `${cfg.y}%`;
    el.style.width  = `${cfg.w}%`;
    el.style.height = `${cfg.h}px`;
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    if (cfg.slug) el.dataset.slug = cfg.slug;
    el.dataset.id = cfg.id;
    nodeEls[cfg.id] = el;

    const d = cfg.slug ? DOC_META[cfg.slug] : null;
    const label = d ? d.label : (cfg.label || "");
    const ann   = d ? d.annotation : null;

    /* Header */
    const hdr = document.createElement("div");
    hdr.className = "cc-node-hdr";

    if (d) {
      const a = document.createElement("a");
      a.className = "cc-node-title";
      a.href = docUrl(cfg.slug);
      a.textContent = label;
      a.addEventListener("click", e => e.stopPropagation());
      hdr.appendChild(a);
    } else {
      const span = document.createElement("span");
      span.className = "cc-node-title";
      span.textContent = label;
      hdr.appendChild(span);
    }
    if (ann) {
      const annEl = document.createElement("span");
      annEl.className = "cc-node-ann";
      annEl.textContent = ann;
      hdr.appendChild(annEl);
    }
    el.appendChild(hdr);

    /* Subtitle rows */
    const subs = d ? d.subtitles : (cfg.subtitles || []);
    subs.forEach(sub => {
      const isGallery = sub === "Example gallery";
      const row = document.createElement("div");
      row.className = "cc-sub-row" + (isGallery ? " is-gallery" : "");
      row.dataset.label = sub;
      row.setAttribute("tabindex", "0");

      if (isGallery) {
        /* Triangle on LEFT */
        const tri = document.createElement("span");
        tri.className = "cc-gallery-tri";
        tri.id = "ccGalleryTri";
        row.appendChild(tri);

        const span = document.createElement("span");
        span.textContent = sub;
        row.appendChild(span);

        galleryRowEl = row;

        row.addEventListener("click", e => {
          e.stopPropagation();
          setGallery(!galleryOpen);
        });
        row.addEventListener("keydown", e => {
          if (e.key==="Enter"||e.key===" ") { e.preventDefault(); setGallery(!galleryOpen); }
        });
        row.addEventListener("mouseenter", () => {
          clearHover(); el.classList.add("is-hovered");
          showPreview({slug:"intro", galleryItem:"Example Gallery"});
        });
      } else {
        const span = document.createElement("span");
        span.textContent = sub;
        row.appendChild(span);

        const anchor = d ? subtitleAnchor(cfg.slug, sub) : null;
        const url    = d ? (anchor ? anchorUrl(cfg.slug, anchor) : docUrl(cfg.slug)) : null;
        if (url) {
          row.addEventListener("click", e => { e.stopPropagation(); window.location.href = url; });
          row.addEventListener("keydown", e => {
            if ((e.key==="Enter"||e.key===" ") && url) { e.preventDefault(); window.location.href = url; }
          });
        }
        row.addEventListener("mouseenter", () => {
          clearHover(); el.classList.add("is-hovered"); row.classList.add("is-hovered");
          showPreview({slug: cfg.slug, subtitle: sub, jumpUrl: url});
        });
        row.addEventListener("mouseleave", () => row.classList.remove("is-hovered"));
      }
      el.appendChild(row);
    });

    /* Node-level events */
    el.addEventListener("mouseenter", () => {
      clearHover(); el.classList.add("is-hovered");
      if (cfg.slug) showPreview({slug: cfg.slug});
      else showPreview({slug: null, subtitle: null, galleryItem: cfg.label || cfg.id});
    });
    el.addEventListener("mouseleave", () => el.classList.remove("is-hovered"));
    el.addEventListener("click", () => { if (d) window.location.href = docUrl(cfg.slug); });
    el.addEventListener("keydown", e => {
      if ((e.key==="Enter"||e.key===" ") && d) { e.preventDefault(); window.location.href = docUrl(cfg.slug); }
    });

    return el;
  };

  const clearHover = () => {
    Object.values(nodeEls).forEach(n => n.classList.remove("is-hovered"));
    document.querySelectorAll(".cc-sub-row.is-hovered").forEach(r => r.classList.remove("is-hovered"));
    document.querySelectorAll(".cc-gallery-item.is-hovered").forEach(r => r.classList.remove("is-hovered"));
  };

  /* ─── Gallery panel ─── */
  const buildGalleryPanel = (layer) => {
    const panel = document.createElement("div");
    panel.className = "cc-gallery-panel";
    panel.id = "ccGalleryPanel";
    panel.style.left  = `${GALLERY_POS.x}%`;
    panel.style.top   = `${GALLERY_POS.y}%`;
    panel.style.width = `${GALLERY_POS.w}%`;

    const hdr = document.createElement("div");
    hdr.className = "cc-gallery-hdr";
    hdr.textContent = "Example Gallery";
    panel.appendChild(hdr);

    const galleryAnchor = subtitleAnchor("intro","Example gallery");
    const galleryUrl = galleryAnchor ? anchorUrl("intro", galleryAnchor) : docUrl("intro");

    GALLERY.forEach(item => {
      const row = document.createElement("div");
      row.className = "cc-gallery-item";
      row.dataset.label = item;
      row.setAttribute("tabindex", "0");
      row.textContent = item;
      row.addEventListener("mouseenter", () => {
        clearHover();
        if (nodeEls["intro"]) nodeEls["intro"].classList.add("is-hovered");
        row.classList.add("is-hovered");
        showPreview({slug:"intro", galleryItem: item, jumpUrl: galleryUrl});
      });
      row.addEventListener("mouseleave", () => row.classList.remove("is-hovered"));
      row.addEventListener("click", () => { window.location.href = galleryUrl; });
      row.addEventListener("keydown", e => {
        if (e.key==="Enter"||e.key===" ") { e.preventDefault(); window.location.href = galleryUrl; }
      });
      panel.appendChild(row);
    });

    layer.appendChild(panel);
    galleryPanelEl = panel;
    return panel;
  };

  /* ─── Dashed line: gallery panel right edge → gallery row left edge ─── */
  const updateGalleryLine = () => {
    const svg = svgEl;
    if (!svg) return;

    /* Remove existing dynamic line */
    const existing = svg.getElementById("ccGalleryLine");
    if (existing) existing.remove();

    if (!galleryOpen || !galleryPanelEl || !galleryRowEl) return;

    const shell = document.getElementById("ccSitemapShell");
    if (!shell) return;

    const shellRect  = shell.getBoundingClientRect();
    const panelRect  = galleryPanelEl.getBoundingClientRect();
    const rowRect    = galleryRowEl.getBoundingClientRect();

    /* Compute SVG-space coords from pixel positions relative to shell */
    const W = shellRect.width;
    const H = shellRect.height;
    const svgW = 1150.5081;
    const svgH = 1008.1333;

    const panelRightPx  = panelRect.right  - shellRect.left;
    const rowLeftPx     = rowRect.left     - shellRect.left;
    const rowCenterYpx  = rowRect.top - shellRect.top + rowRect.height / 2;

    const x1 = (panelRightPx / W) * svgW;
    const x2 = (rowLeftPx   / W) * svgW;
    const y  = (rowCenterYpx / H) * svgH;

    if (x2 <= x1) return; /* no space between panel and row */

    const line = document.createElementNS("http://www.w3.org/2000/svg","line");
    line.setAttribute("id", "ccGalleryLine");
    line.setAttribute("x1", x1.toFixed(2));
    line.setAttribute("y1", y.toFixed(2));
    line.setAttribute("x2", x2.toFixed(2));
    line.setAttribute("y2", y.toFixed(2));
    line.setAttribute("stroke", "#7a34eb");
    line.setAttribute("stroke-width", "2.2");
    line.setAttribute("stroke-dasharray", "6,4");
    line.setAttribute("opacity", "0.6");
    svg.appendChild(line);
  };

  const setGallery = (open) => {
    galleryOpen = open;
    if (galleryPanelEl) galleryPanelEl.classList.toggle("open", open);
    const tri = document.getElementById("ccGalleryTri");
    if (tri) tri.classList.toggle("open", open);
    if (open) applyGlow();
    /* Use rAF so panel has layout before we measure */
    requestAnimationFrame(updateGalleryLine);
  };

  /* ─── Protocol label ─── */
  const buildLabel = (cfg, layer) => {
    const el = document.createElement("div");
    el.className = "cc-map-label";
    el.style.left  = `${cfg.x}%`;
    el.style.top   = `${cfg.y}%`;
    el.style.width = `${cfg.w}%`;
    el.style.whiteSpace = "pre-line";
    el.textContent = cfg.text;
    layer.appendChild(el);
  };

  /* ─── Build the full map ─── */
  const buildMap = (shell) => {
    const outer = document.createElement("div");
    outer.className = "cc-map-outer";
    const inner = document.createElement("div");
    inner.className = "cc-map-inner";
    outer.appendChild(inner);

    /* SVG connector overlay */
    inner.insertAdjacentHTML("beforeend", CONNECTORS_BASE);
    svgEl = inner.querySelector("#ccConnectorsSvg");

    /* Node layer */
    const layer = document.createElement("div");
    layer.className = "cc-nodes-layer";
    inner.appendChild(layer);

    /* Gallery panel (hidden until opened) */
    buildGalleryPanel(layer);

    /* Nodes */
    LAYOUT.forEach(cfg => {
      if (cfg.kind === "label") { buildLabel(cfg, layer); return; }
      const el = buildNode(cfg);
      layer.appendChild(el);
    });

    shell.innerHTML = "";
    shell.appendChild(outer);
  };

  /* ─── Init ─── */
  const init = () => {
    const shell = document.getElementById("ccSitemapShell");
    if (!shell) return;
    buildMap(shell);

    const input = document.getElementById("ccSearchInput");
    if (input) {
      input.addEventListener("input", () => runSearch(input.value));
    }

    const card = document.getElementById("ccPreviewCard");
    if (card) {
      card.addEventListener("click", () => {
        const url = card.dataset.jumpUrl;
        if (url) window.location.href = url;
      });
      card.addEventListener("keydown", e => {
        if (e.key==="Enter"||e.key===" ") {
          const url = card.dataset.jumpUrl;
          if (url) { e.preventDefault(); window.location.href = url; }
        }
      });
    }

    showPreview({slug:"intro"});

    /* Update gallery line on resize */
    window.addEventListener("resize", () => { if (galleryOpen) updateGalleryLine(); });

    /* Theme sync */
    try {
      const t = localStorage.getItem("bcode-docs-theme");
      if (t && ["light","balanced","dark"].includes(t)) {
        document.body.classList.add(`theme-${t}`);
        document.body.classList.toggle("dark", t!=="light");
      }
    } catch {}
  };

  if (document.readyState==="loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
