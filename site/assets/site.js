(() => {
  "use strict";

  const THEME_KEY = "bcode-docs-theme";
  const THEME_OPTIONS = [
    { id: "light", label: "Light", icon: "sun.svg" },
    { id: "balanced", label: "Balanced", icon: "half.svg" },
    { id: "dark", label: "Dark", icon: "moon.svg" }
  ];
  const THEME_IDS = THEME_OPTIONS.map((x) => x.id);
  const THEME_MAP = Object.fromEntries(THEME_OPTIONS.map((x) => [x.id, x]));
  const DOC_TEXT_SCALE_KEY = "bcode-doc-text-scale";
  const LAVA_ENABLED_KEY = "bcode-lavalamp-enabled";
  const DOC_TEXT_SCALE_MIN = 0.7;
  const DOC_TEXT_SCALE_MAX = 1.3;

  const DOC_PORTAL_META = {
    intro: {
      summary: "Narrative introduction to BCODe fundamentals, stream framing, and practical engineering tradeoffs.",
      subheaders: ["Architecture", "Atomic latching", "Example gallery"]
    },
    syntax: {
      summary: "Normative syntax reference for terminators, payload rules, parser states, and conformance vectors.",
      subheaders: ["Grammar", "State machine", "Conformance tests"]
    },
    interpretation: {
      summary: "Interpretation layer guidance for qualifiers, value classes, staleness, and typed access semantics.",
      subheaders: ["Qualifier model", "Reducer behavior", "Accessor semantics"]
    },
    "meta-v9": {
      summary: "Current BCODe.meta conventions for request/response behavior, packets, counters, and transport usage.",
      subheaders: ["Meta tags", "Packeting", "Sequence conventions"]
    },
    "meta-library-semantics": {
      summary: "Library-level semantics and API-oriented behavior for integrating BCODe.meta in tooling.",
      subheaders: ["Library flags", "Unit handling", "Consumer API"]
    },
    rest: {
      summary: "BCODe.rest conventions for resource-oriented request/response streams and operation sequencing.",
      subheaders: ["Resource model", "Verb mapping", "Stream operations"]
    },
    "best-practices": {
      summary: "Design and interoperability best practices for schema discipline, resilience, and deployment consistency.",
      subheaders: ["Schema discipline", "Interoperability", "Operational safety"]
    },
    "telemetry-guide": {
      summary: "Scalable telemetry/control patterns from simple feeds to complex multi-line packet workflows.",
      subheaders: ["Scaling patterns", "Control loops", "Production telemetry"]
    }
  };

  const READER_FILE_MAP = {
    intro: "bcode-intro-v2.html",
    syntax: "bcode-syntax-v13.html",
    interpretation: "bcode-interpretation-v10.html",
    "meta-v9": "bcode-meta-v9.html",
    "meta-library-semantics": "bcode-meta-library-semantics-v9.html",
    rest: "bcode-rest-v6.1.3.html",
    "best-practices": "bcode-best-practices-v13.html",
    "telemetry-guide": "bcode-telemetry-guide.html"
  };

  const READER_LINK_MAP = Object.fromEntries(
    Object.entries(READER_FILE_MAP).flatMap(([slug, file]) => [
      [`${slug}.html`, file],
      [`${slug}-reader.html`, file],
      [file, file]
    ])
  );

  const EXCLUDED_DOC_SLUGS = new Set(["syntax-v12"]);
  const DOC_CARD_VERSION_OVERRIDES = {
    intro: "v2",
    syntax: "v13",
    interpretation: "v10",
    "meta-v9": "v9",
    "meta-library-semantics": "v9",
    rest: "v6.1.3",
    "best-practices": "v13"
  };

  const SUBTOPIC_ANCHORS = {
    intro: {
      Architecture: "structural-philosophy-determinism-by-ascii-columns",
      "Atomic latching": "the-atomic-line-model",
      "Example gallery": "example-gallery-optional-patterns-to-copy-paste"
    }
  };

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  const readerFileForSlug = (slug) => READER_FILE_MAP[String(slug || "")] || `${String(slug || "")}-reader.html`;
  const currentSearchParams = () => new URLSearchParams(location.search);

  const currentReaderSlug = () => {
    const fileName = String(location.pathname || "").split("/").pop().toLowerCase();
    const direct = Object.entries(READER_FILE_MAP).find(([, file]) => file.toLowerCase() === fileName);
    if (direct) return direct[0];
    if (fileName.endsWith("-reader.html")) return fileName.slice(0, -"-reader.html".length);
    if (fileName.endsWith(".html")) return fileName.slice(0, -".html".length);
    return fileName;
  };

  const normalizeMojibake = (s) => String(s || "");

  const esc = (s) =>
    normalizeMojibake(s).replace(/[&<>"']/g, (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
    );

  const ere = (s) => String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const pageType = () => (document.body && document.body.dataset && document.body.dataset.pageType) || "";

  const assetBase = () => (pageType() === "home" ? "assets/" : "../assets/");
  const iconPath = (name) => `${assetBase()}${name}`;
  const TOC_LAYOUT_TRANSITION_MS = 360;
  const TOC_PANE_TRANSITION_MS = 380;
  const TOC_SUBLIST_TRANSITION_MS = 320;
  const TOC_GRID_TRANSITION_MS = 320;
  const READER_PANEL_BASELINE_WIDTH = 330;
  const READER_PANEL_BASELINE_HEIGHT = 1088;
  const READER_PANEL_BASELINE_GAP = 24;
  const READER_PANEL_BASELINE_VIEWPORT_WIDTH = 2560;
  const READER_PANEL_BASELINE_VIEWPORT_HEIGHT = 1440;
  const READER_PEEK_HANDLE_OPEN_WIDTH = 124;
  const READER_PEEK_HANDLE_COLLAPSED_WIDTH = 208;
  const READER_CARD_COLLAPSED_WIDTH_SCALE = 1.25;
  const SPLIT_VIEW_MAX_WIDTH = 1120;
  const SPLIT_VIEW_MIN_WIDTH = 600;
  let tocAutoScrollUnlockTimer = 0;
  let quickJumpStageTimer = 0;
  let quickJumpOpenReleaseTimer = 0;
  let splitReaderWidthTimer = 0;

  const lockTocAutoScroll = (duration = TOC_SUBLIST_TRANSITION_MS) => {
    if (!document.body) return;
    document.body.dataset.tocAutoScrollLockUntil = String(Date.now() + Math.max(0, duration));
    clearTimeout(tocAutoScrollUnlockTimer);
    tocAutoScrollUnlockTimer = window.setTimeout(() => {
      if (!document.body) return;
      delete document.body.dataset.tocAutoScrollLockUntil;
      document.body.dispatchEvent(new CustomEvent("tocautoscrollunlock"));
    }, Math.max(0, duration) + 20);
  };

  const isQuickJumpOpeningHoldActive = () =>
    !!document.body && document.body.classList.contains("quickjump-opening-hold");


  const setSplitReaderFillSide = (side = "none") => {
    if (!document.body) return;
    document.body.classList.remove("split-fill-left", "split-fill-right");
    if (side === "left") document.body.classList.add("split-fill-left");
    if (side === "right") document.body.classList.add("split-fill-right");
  };

  const scheduleSplitReaderWidth = (widthPx, delay = 0) => {
    if (!document.body) return;
    if (splitReaderWidthTimer) {
      clearTimeout(splitReaderWidthTimer);
      splitReaderWidthTimer = 0;
    }
    const apply = () => {
      if (!document.body || !isSplitView()) return;
      document.body.style.setProperty("--reader-split-max-width", `${Math.round(widthPx)}px`);
    };
    if (delay > 0) {
      splitReaderWidthTimer = window.setTimeout(() => {
        splitReaderWidthTimer = 0;
        apply();
      }, delay);
    } else {
      apply();
    }
  };

  const isSplitView = () => {
    // On phone or tablet portrait, never use split view (mobile CSS handles layout)
    const b = document.body;
    if (b && (b.classList.contains("is-phone") || (b.classList.contains("is-tablet") && b.classList.contains("is-portrait")))) {
      return false;
    }
    const w = window.innerWidth || 0;
    if (w < SPLIT_VIEW_MIN_WIDTH) return false;
    if (w <= SPLIT_VIEW_MAX_WIDTH) return true;
    // For larger monitors (1440p, 4K), detect split-screen via screen width ratio
    const sw = screen.width || 3840;
    return w <= Math.round(sw * 0.55);
  };

  const syncQuickJumpButtonLabel = () => {
    const cardLink = document.querySelector("#cardLink");
    if (!cardLink) return;
    const isCollapsed = document.body.classList.contains("meta-collapsed");
    const spanEl = cardLink.querySelector("span");
    if (!spanEl) return;
    const expectedText = isCollapsed ? "Open Quick Jump" : "Close Quick Jump";
    if (spanEl.textContent !== expectedText) {
      const icon = isCollapsed ? "arrowleft.svg" : "arrowright.svg";
      cardLink.innerHTML = `<img class="cardview-toggle-icon" src="${iconPath(icon)}" alt="${expectedText}"><span>${expectedText}</span>`;
      cardLink.setAttribute("aria-label", expectedText);
      cardLink.setAttribute("title", expectedText);
    }
  };

  const syncSplitViewClass = () => {
    if (!document.body) return;
    const split = isSplitView();
    const wasSplit = document.body.classList.contains("codex-split-view");
    const preserveTabletLandscapeQuickJump =
      document.body.classList.contains("is-tablet") &&
      document.body.classList.contains("is-landscape");
    document.body.classList.toggle("codex-split-view", split);
    if (split && pageType() === "reader") {
      // Force quick jump collapsed when first entering split view
      if (!preserveTabletLandscapeQuickJump && !wasSplit && !document.body.classList.contains("meta-collapsed")) {
        document.body.classList.add("meta-collapsed");
      }
      const vw = window.innerWidth || 0;
      const isTableOpen = document.body.classList.contains("reader-table-open");
      const isTocOpen = !document.body.classList.contains("meta-collapsed");
      if (isTocOpen || isTableOpen) {
        const paneWidth = Math.max(180, Math.round(vw * 0.34));
        const readerMaxW = Math.max(320, vw - paneWidth - 28);
        document.body.style.setProperty("--reader-split-max-width", `${readerMaxW}px`);
      } else {
        document.body.style.setProperty("--reader-split-max-width", `${Math.round(vw * 0.98)}px`);
      }
      // Sync button label with current state
      syncQuickJumpButtonLabel();
    } else if (!split) {
      document.body.style.removeProperty("--reader-split-max-width");
      // Leaving split view: restore quick jump if split view had collapsed it
      if (wasSplit && pageType() === "reader" && document.body.classList.contains("meta-collapsed")) {
        document.body.classList.remove("meta-collapsed");
        syncQuickJumpButtonLabel();
      }
    }
  };

  const stageQuickJumpPaneTransition = (mode = "toggle") => {
    if (!document.body) return;
    document.body.classList.remove("quickjump-opening", "quickjump-opening-hold", "quickjump-closing");
    document.body.classList.add("quickjump-staged");
    clearTimeout(quickJumpStageTimer);
    clearTimeout(quickJumpOpenReleaseTimer);
    if (mode === "opening") {
      document.body.classList.add("quickjump-opening");
      document.body.classList.add("quickjump-opening-hold");
      quickJumpOpenReleaseTimer = window.setTimeout(() => {
        if (!document.body) return;
        window.requestAnimationFrame(() => {
          syncTocFixedLane(true);
          window.requestAnimationFrame(() => {
            syncTocFixedLane(true);
            if (!document.body) return;
            document.body.classList.remove("quickjump-opening-hold");
          });
        });
      }, (isSplitView() ? TOC_LAYOUT_TRANSITION_MS : TOC_GRID_TRANSITION_MS) + 20);
    } else if (mode === "closing") {
      document.body.classList.add("quickjump-closing");
    }
    quickJumpStageTimer = window.setTimeout(() => {
      if (!document.body) return;
      document.body.classList.remove(
        "quickjump-staged",
        "quickjump-opening",
        "quickjump-opening-hold",
        "quickjump-closing"
      );
    }, TOC_LAYOUT_TRANSITION_MS + TOC_PANE_TRANSITION_MS + 40);
  };

  const cleanPreviewLabel = (s) =>
    normalizeMojibake(s)
      .replace(/\s*(?:\u2014|--?|-|窶・)\s*(?:Local\s+)?Preview\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

  const cleanPortalMetaLabel = (s) =>
    cleanPreviewLabel(s)
      .replace(/^[-: ]+/, "")
      .trim();

  const cleanMenuTitle = (s) =>
    normalizeMojibake(s)
      .replace(/\s*\(v[\d.]+\)\s*/gi, " ")
      .replace(/\bv[\d.]+\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

  const normalizeHeader = () => {
    const tag = document.querySelector(".brand .tag");
    if (tag) tag.remove();
    document.querySelectorAll(".header-link").forEach((el) => el.remove());
  };

  const normalizeDocMeta = () => {
    [".reader-meta", ".doc-sub"].forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        const cleaned = cleanPreviewLabel(el.textContent);
        if (cleaned) el.textContent = cleaned;
      });
    });

    if (document.title) {
      const cleanedTitle = cleanPreviewLabel(document.title);
      if (cleanedTitle) document.title = cleanedTitle;
    }
  };

  const normalizeHubSearchLayout = () => {
    if (pageType() !== "hub") return;
    const stack = $(".stack");
    if (!stack) return;

    const topCard = stack.querySelector(".card");
    if (!topCard) return;

    const legacyCard = stack.querySelector(".card.hub-search");
    let row = topCard.querySelector(".search-row");
    if (!row && legacyCard) row = legacyCard.querySelector(".search-row");
    if (!row) return;

    row.classList.add("hub-top-search");
    if (!topCard.contains(row)) topCard.appendChild(row);
    if (legacyCard && legacyCard !== topCard) legacyCard.remove();
  };

  const ensureDocumentationButton = () => {
    const header = $(".header-content");
    if (!header || header.querySelector(".fixed-doc-btn")) return;

    const a = document.createElement("a");
    a.className = "fixed-doc-btn";
    a.href = pageType() === "home" ? "docs/documentation-tree.html" : "../docs/documentation-tree.html";
    a.setAttribute("aria-label", "Documentation");
    a.innerHTML = `<img src="${iconPath("documentation.svg")}" alt=""><span>Documentation</span>`;
    header.appendChild(a);
  };

  const forceReaderFooterLinks = () => {
    document.querySelectorAll("footer a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (!href) return;
      const parts = href.split("?");
      const path = parts[0];
      const query = parts[1] ? `?${parts[1]}` : "";
      const slash = path.lastIndexOf("/");
      const dir = slash >= 0 ? path.slice(0, slash + 1) : "";
      const name = slash >= 0 ? path.slice(slash + 1) : path;

      if (name === "syntax-v12.html" || name === "syntax-v12-reader.html") {
        a.remove();
        return;
      }

      const repl = READER_LINK_MAP[name];
      if (repl) a.setAttribute("href", `${dir}${repl}${query}`);
    });

    document.querySelectorAll("footer nav").forEach((nav) => {
      nav.querySelectorAll(".footer-sep").forEach((sep) => {
        const prev = sep.previousElementSibling;
        const next = sep.nextElementSibling;
        if (!prev || !next || prev.classList.contains("footer-sep") || next.classList.contains("footer-sep")) {
          sep.remove();
        }
      });
    });
  };

  const readTheme = () => {
    try {
      const v = localStorage.getItem(THEME_KEY);
      if (v === "half" || v === "auto") return "balanced";
      if (THEME_IDS.includes(v)) return v;
    } catch { }
    return "light";
  };

  const writeTheme = (v) => {
    try {
      localStorage.setItem(THEME_KEY, v);
    } catch { }
  };

  const readLavaEnabled = () => {
    try {
      const raw = localStorage.getItem(LAVA_ENABLED_KEY);
      if (raw == null) return true;
      return raw !== "0" && raw !== "false";
    } catch { }
    return true;
  };

  const writeLavaEnabled = (enabled) => {
    try {
      localStorage.setItem(LAVA_ENABLED_KEY, enabled ? "1" : "0");
    } catch { }
  };

  const applyLavaEnabled = (enabled) => {
    const b = document.body;
    if (!b) return;
    const on = !!enabled;
    b.classList.toggle("lava-enabled", on);
    b.classList.toggle("lava-disabled", !on);
    b.dataset.lavaEnabled = on ? "1" : "0";
    window.dispatchEvent(new CustomEvent("bcode:lavalamp-toggle", { detail: { enabled: on } }));
  };

  const updateLavaToggles = (enabled) => {
    const on = !!enabled;
    $$(".lava-toggle").forEach((btn) => {
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.setAttribute("title", on ? "Disable lava lamp background" : "Enable lava lamp background");
      btn.setAttribute("aria-label", on ? "Disable lava lamp background" : "Enable lava lamp background");
    });
  };

  const toggleLavaEnabled = () => {
    const next = !readLavaEnabled();
    writeLavaEnabled(next);
    applyLavaEnabled(next);
    updateLavaToggles(next);
  };

  const clampDocTextScale = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 1;
    return Math.max(DOC_TEXT_SCALE_MIN, Math.min(DOC_TEXT_SCALE_MAX, n));
  };

  const readDocTextScale = () => {
    try {
      const raw = localStorage.getItem(DOC_TEXT_SCALE_KEY);
      if (raw == null) return 1;
      return clampDocTextScale(raw);
    } catch { }
    return 1;
  };

  const writeDocTextScale = (v) => {
    try {
      localStorage.setItem(DOC_TEXT_SCALE_KEY, String(clampDocTextScale(v)));
    } catch { }
  };

  const applyDocTextScale = (v) => {
    const scale = clampDocTextScale(v);
    document.documentElement.style.setProperty("--doc-font-scale", String(scale));
    return scale;
  };

  const syncDocTextScaleControls = (scale) => {
    const clamped = clampDocTextScale(scale);
    const pct = Math.round(clamped * 100);
    const progress = ((clamped - DOC_TEXT_SCALE_MIN) / (DOC_TEXT_SCALE_MAX - DOC_TEXT_SCALE_MIN)) * 100;
    const centerColor = pct === 100 ? "rgba(0,0,0,0)" : "rgba(240,246,255,0.96)";
    $$(".mode-text-size-range").forEach((range) => {
      range.value = String(pct);
      range.style.setProperty("--range-progress", `${progress}%`);
      range.style.setProperty("--range-center-color", centerColor);
    });
    $$(".mode-text-size-value").forEach((node) => {
      node.textContent = `${pct}%`;
    });
  };

  const applyTheme = (mode) => {
    const b = document.body;
    if (!b) return;
    THEME_IDS.forEach((m) => b.classList.remove(`theme-${m}`));
    b.classList.add(`theme-${mode}`);
    b.classList.toggle("dark", mode !== "light");
    b.dataset.themeMode = mode;
    updateAsciiThemeCharts(mode);
  };

  const getAsciiChartAssets = (mode, variant = "full") => {
    const currentMode = THEME_IDS.includes(mode) ? mode : readTheme();
    if (variant === "compact") {
      if (currentMode === "balanced") {
        return { png: "compact-midnight-opus-400dpi.jpg", svg: "compact-midnight-opus.svg" };
      }
      if (currentMode === "dark") {
        return { png: "compact-dark-opus-400dpi.jpg", svg: "compact-dark-opus.svg" };
      }
      return { png: "compact-light-opus-400dpi.jpg", svg: "compact-light-opus.svg" };
    }
    if (currentMode === "balanced") {
      return { png: "ascii-balanced.png", svg: "ascii-balanced.svg" };
    }
    if (currentMode === "dark") {
      return { png: "ascii-dark.png", svg: "ascii-dark.svg" };
    }
    return { png: "ascii.png", svg: "ascii.svg" };
  };

  const syncAsciiThemeChartImage = (img, mode) => {
    if (!img) return;
    const variant = img.classList.contains("ascii-compact-theme-chart") ? "compact" : "full";
    const assets = getAsciiChartAssets(mode, variant);
    const previewVariant = img.dataset.previewVariant || variant;
    const previewAssets = getAsciiChartAssets(mode, previewVariant);
    const jpgSrc = `${assetBase()}${assets.png}`;
    const svgSrc = `${assetBase()}${assets.svg}`;
    // If the compact table is already open and settled, use SVG for crispness;
    // otherwise use the lightweight JPG (ready for smooth animation)
    const tableOpen = variant === "compact" && document.body && document.body.classList.contains("reader-table-open") && !readerTableSvgSwapPending && !readerTableResizeSvgSwapTimer && !readerTableChromeMotionActive;
    const src = tableOpen ? svgSrc : jpgSrc;
    if (img.getAttribute("src") !== src) img.setAttribute("src", src);
    img.dataset.svgSrc = svgSrc;
    img.dataset.chartVariant = variant;
    img.dataset.previewPngSrc = `${assetBase()}${previewAssets.png}`;
    img.dataset.previewSvgSrc = `${assetBase()}${previewAssets.svg}`;
  };

  const updateAsciiThemeCharts = (mode) => {
    const currentMode = THEME_IDS.includes(mode) ? mode : readTheme();
    $$(".ascii-theme-chart, .ascii-compact-theme-chart").forEach((img) => {
      syncAsciiThemeChartImage(img, currentMode);
    });
    const previewImg = document.getElementById("asciiPreviewImage");
    if (previewImg && previewImg.dataset.followTheme === "1") {
      const previewVariant = previewImg.dataset.chartVariant || "full";
      const assets = getAsciiChartAssets(currentMode, previewVariant);
      previewImg.setAttribute("src", `${assetBase()}${assets.svg}`);
      previewImg.dataset.svgSrc = `${assetBase()}${assets.svg}`;
    }
  };

  const downloadAsset = async (src, fallbackName) => {
    if (!src) return;
    const a = document.createElement("a");
    a.href = src;
    let name = fallbackName || "download";
    try {
      const u = new URL(src, location.href);
      const p = u.pathname.split("/").pop();
      if (p) name = p;
    } catch { }
    a.download = name;
    try {
      const res = await fetch(src, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      a.href = blobUrl;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const ensureAsciiPreviewOverlay = () => {
    let overlay = document.getElementById("asciiPreviewOverlay");
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = "asciiPreviewOverlay";
    overlay.className = "ascii-preview-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML =
      '<div class="ascii-preview-shell" role="dialog" aria-modal="true" aria-label="ASCII chart preview">' +
      '<div class="ascii-preview-actions">' +
      `<button type="button" class="ascii-preview-btn ascii-preview-save" id="asciiPreviewSave" aria-label="Save chart"><img src="${iconPath("floppy.svg")}" alt=""></button>` +
      `<button type="button" class="ascii-preview-btn ascii-preview-close" id="asciiPreviewClose" aria-label="Close preview"><img src="${iconPath("x.svg")}" alt=""></button>` +
      "</div>" +
      '<img id="asciiPreviewImage" class="ascii-preview-image" alt="ASCII reference chart enlarged preview">' +
      "</div>";
    document.body.appendChild(overlay);

    const close = () => {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("ascii-preview-open");
    };

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    const closeBtn = overlay.querySelector("#asciiPreviewClose");
    if (closeBtn) closeBtn.addEventListener("click", close);

    const saveBtn = overlay.querySelector("#asciiPreviewSave");
    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        const img = overlay.querySelector("#asciiPreviewImage");
        if (!img) return;
        const svgSrc = img.dataset.svgSrc || "";
        const pngSrc = img.getAttribute("src") || "";
        const src = svgSrc || pngSrc;
        if (!src) return;
        await downloadAsset(src, "ascii-reference-chart.svg");
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
    });

    return overlay;
  };

  const openAsciiPreviewFromImage = (sourceImg) => {
    if (!sourceImg) return;
    const src = sourceImg.dataset.previewSvgSrc || sourceImg.dataset.svgSrc || sourceImg.getAttribute("src") || "";
    if (!src) return;

    document.body.classList.remove("reader-header-peek-pinned");
    document.body.classList.remove("reader-header-peek");

    const overlay = ensureAsciiPreviewOverlay();
    const target = overlay.querySelector("#asciiPreviewImage");
    if (!target) return;
    target.setAttribute("src", src);
    target.dataset.followTheme = "1";
    target.dataset.chartVariant = sourceImg.dataset.previewVariant || sourceImg.dataset.chartVariant || "full";
    target.dataset.svgSrc = sourceImg.dataset.previewSvgSrc || sourceImg.dataset.svgSrc || src.replace(/\.png$/i, ".svg");
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("ascii-preview-open");
  };

  const bindAsciiChartPreview = (root) => {
    if (!root) return;
    root.querySelectorAll(".ascii-chart-figure").forEach((figure) => {
      if (figure.dataset.previewBound === "1") return;
      const sourceImg = figure.querySelector(".ascii-theme-chart, .ascii-compact-theme-chart");
      if (!sourceImg) return;
      figure.dataset.previewBound = "1";
      figure.tabIndex = 0;
      figure.setAttribute("role", "button");
      figure.setAttribute("aria-label", "Open large ASCII chart preview");

      const open = () => openAsciiPreviewFromImage(sourceImg);

      figure.addEventListener("click", open);
      figure.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
  };

  const syncReaderHeaderToolExpansion = () => {
    if (pageType() !== "reader") return;
    const head = $(".reader-head");
    if (!head) return;
    const searchOpen = !!$("#readerSearchPanel")?.classList.contains("is-open");
    const modeOpen = $$(".mode-switcher-menu").some((m) => m.classList.contains("is-open"));
    head.classList.toggle("reader-search-open", searchOpen);
    head.classList.toggle("reader-mode-open", modeOpen);
    invalidateReaderChromeMetrics();
    syncReaderToolRow();
    requestAnimationFrame(syncReaderToolRow);
  };

  const closeModeMenus = () => {
    $$(".mode-switcher-menu").forEach((m) => m.classList.remove("is-open"));
    $$(".mode-switcher").forEach((m) => m.setAttribute("aria-expanded", "false"));
    syncReaderHeaderToolExpansion();
  };

  const closeReaderSearchPanel = () => {
    const panel = $("#readerSearchPanel");
    if (panel) {
      panel.classList.remove("is-open");
      const wrap = panel.querySelector(".reader-search-input-wrap");
      if (wrap) {
        const token = String(Date.now());
        panel.dataset.hideToolsToken = token;
        window.setTimeout(() => {
          if (!panel || panel.dataset.hideToolsToken !== token) return;
          if (!panel.classList.contains("is-open")) wrap.classList.remove("tools-visible");
        }, 190);
      }
    }
    syncReaderHeaderToolExpansion();
  };

  const updateModeSwitchers = (mode) => {
    const meta = THEME_MAP[mode] || THEME_MAP.light;
    $$(".mode-switcher-wrap").forEach((wrap) => {
      const trigger = wrap.querySelector(".mode-switcher");
      const icon = wrap.querySelector(".mode-switcher-icon");
      if (icon) {
        icon.src = iconPath(meta.icon);
        icon.alt = meta.label;
      }
      if (trigger) {
        trigger.setAttribute("title", `Theme: ${meta.label}`);
        trigger.setAttribute("aria-label", `Theme: ${meta.label}`);
      }
      wrap.querySelectorAll(".mode-switcher-item").forEach((item) => {
        const active = item.dataset.mode === mode;
        item.classList.toggle("is-active", active);
      });
    });
  };

  const mountModeSwitcher = () => {
    $$("#darkToggle").forEach((el) => el.remove());

    const readerToolsHost = $(".reader-head .links") || $(".reader-head");
    const host =
      (pageType() === "home" && $(".title-card")) ||
      (pageType() === "hub" && $(".stack .card")) ||
      (pageType() === "doc" && $(".doc-head")) ||
      (pageType() === "reader" && readerToolsHost) ||
      $(".card");

    if (!host || host.querySelector(".mode-switcher-wrap")) return;

    host.classList.add("mode-switcher-host");

    const wrap = document.createElement("div");
    wrap.className = "mode-switcher-wrap";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "mode-switcher";
    trigger.setAttribute("aria-expanded", "false");
    trigger.innerHTML = '<img class="mode-switcher-icon" alt=""><span class="mode-caret">&#9662;</span>';

    const lavaToggle = document.createElement("button");
    lavaToggle.type = "button";
    lavaToggle.className = "mode-switcher lava-toggle";
    lavaToggle.setAttribute("aria-pressed", "true");
    lavaToggle.innerHTML = `<img class="mode-switcher-icon lava-toggle-icon" src="${iconPath("lava.svg")}" alt="Lava lamp">`;
    lavaToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleLavaEnabled();
    });

    let tableToggle = null;
    if (pageType() === "reader") {
      tableToggle = document.createElement("button");
      tableToggle.type = "button";
      tableToggle.className = "mode-switcher reader-table-toggle";
      tableToggle.setAttribute("aria-pressed", "false");
      tableToggle.innerHTML = `<img class="mode-switcher-icon" src="${iconPath("table.svg")}" alt="Table view">`;
      tableToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        setReaderTableOpen(!document.body.classList.contains("reader-table-open"));
      });
    }

    const menu = document.createElement("div");
    menu.className = "mode-switcher-menu";
    const modeRow = document.createElement("div");
    modeRow.className = "mode-switcher-row";

    THEME_OPTIONS.forEach((opt) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "mode-switcher-item";
      item.dataset.mode = opt.id;
      item.innerHTML =
        `<img class="mode-switcher-item-icon" src="${iconPath(opt.icon)}" alt="">` +
        `<span class="mode-switcher-item-label">${esc(opt.label)}</span>` +
        '<span class="mode-switcher-check">&#10003;</span>';
      item.addEventListener("click", () => {
        applyTheme(opt.id);
        writeTheme(opt.id);
        updateModeSwitchers(opt.id);
      });
      modeRow.appendChild(item);
    });
    if (pageType() === "doc" || pageType() === "reader") {
      menu.classList.add("has-size-control");
      const textSizeWrap = document.createElement("div");
      textSizeWrap.className = "mode-text-size-wrap";
      textSizeWrap.innerHTML =
        '<label class="mode-text-size-label" for="docTextSizeRange">Font Size</label>' +
        '<div class="mode-text-size-row">' +
        '<span class="mode-text-size-prefix" aria-hidden="true">Font Size:</span>' +
        `<input id="docTextSizeRange" class="mode-text-size-range" type="range" min="${Math.round(DOC_TEXT_SCALE_MIN * 100)}" max="${Math.round(DOC_TEXT_SCALE_MAX * 100)}" step="1" value="100" aria-label="Font Size">` +
        '<span class="mode-text-size-value">100%</span>' +
        "</div>";
      menu.appendChild(textSizeWrap);

      const range = textSizeWrap.querySelector(".mode-text-size-range");
      if (range) {
        const onScaleInput = () => {
          let pct = Number(range.value);
          if (Math.abs(pct - 100) <= 1.5) pct = 100;
          const scale = applyDocTextScale(pct / 100);
          if (Number(range.value) !== pct) range.value = String(pct);
          syncDocTextScaleControls(scale);
        };
        const onScaleCommit = () => {
          let pct = Number(range.value);
          if (Math.abs(pct - 100) <= 1.5) pct = 100;
          const scale = applyDocTextScale(pct / 100);
          if (Number(range.value) !== pct) range.value = String(pct);
          writeDocTextScale(scale);
          syncDocTextScaleControls(scale);
          if (pageType() === "reader") {
            invalidateReaderChromeMetrics();
            requestAnimationFrame(ensureReaderEndPad);
            requestAnimationFrame(updateReaderChromeMotion);
          }
        };
        const onScaleWheel = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const min = Number(range.min) || Math.round(DOC_TEXT_SCALE_MIN * 100);
          const max = Number(range.max) || Math.round(DOC_TEXT_SCALE_MAX * 100);
          const magnitude = Math.max(1, Math.round(Math.abs(e.deltaY) / 60));
          const dir = e.deltaY < 0 ? 1 : -1;
          const next = Math.max(min, Math.min(max, Number(range.value) + dir * magnitude));
          range.value = String(next);
          onScaleCommit();
        };
        range.addEventListener("input", onScaleInput);
        range.addEventListener("change", onScaleCommit);
        range.addEventListener("wheel", onScaleWheel, { passive: false });
      }
    }
    menu.appendChild(modeRow);

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      closeReaderSearchPanel();
      const open = !menu.classList.contains("is-open");
      closeModeMenus();
      if (open) {
        menu.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
      syncReaderHeaderToolExpansion();
    });

    wrap.appendChild(trigger);
    wrap.appendChild(lavaToggle);
    if (tableToggle) wrap.appendChild(tableToggle);
    wrap.appendChild(menu);
    host.appendChild(wrap);

    syncDocTextScaleControls(readDocTextScale());
    updateLavaToggles(readLavaEnabled());
    updateReaderTableToggles(document.body.classList.contains("reader-table-open"));
  };

  const initTheme = () => {
    const mode = readTheme();
    const textScale = applyDocTextScale(readDocTextScale());
    const lavaEnabled = readLavaEnabled();
    applyTheme(mode);
    applyLavaEnabled(lavaEnabled);
    mountModeSwitcher();
    updateModeSwitchers(mode);
    updateLavaToggles(lavaEnabled);
    syncDocTextScaleControls(textScale);

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".mode-switcher-wrap") && !e.target.closest(".mode-switcher-menu")) closeModeMenus();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModeMenus();
    });
  };

  const slug = (t) => {
    const s = String(t || "")
      .trim()
      .replace(/^\s*\d+(?:\.\d+)*\s*[.\-:)]\s*/, "")
      .toLowerCase()
      .replace(/[^\w\s-]+/g, "")
      .trim()
      .replace(/\s+/g, "-");
    return s || "section";
  };

  const cleanHeadingLabel = (t) => {
    let x = String(t || "").trim();
    const leadNum = /^[^\w]*\d+(?:\.\d+)*(?:\s*[.)\-:])?\s+/;
    while (leadNum.test(x)) x = x.replace(leadNum, "");
    return x.replace(/\s+/g, " ").trim();
  };

  const headingNumber = (t) => {
    const m = String(t || "").trim().match(/^(\d+(?:\.\d+)*)\b/);
    return m ? m[1] : "";
  };

  const ids = (root) => {
    const used = {};
    const hs = [...root.querySelectorAll("h1,h2,h3,h4")];
    hs.forEach((h) => {
      if (h.id) return;
      const base = slug(h.textContent);
      used[base] = (used[base] || 0) + 1;
      h.id = used[base] === 1 ? base : `${base}-${used[base]}`;
    });
    return hs;
  };

  const markCode = () => {
    if (!window.hljs) return;
    document.querySelectorAll("pre code").forEach((el) => {
      try {
        hljs.highlightElement(el);
      } catch { }
    });
  };

  const looksLikeSyntaxReaderBcode = (text) => {
    const raw = normalizeMojibake(text || "").trim();
    if (!raw) return false;
    if (/^(?:FIELD|PSTR_BEGIN|PHEX_BEGIN|PRAW_BEGIN|RESET|LATCH)\b/m.test(raw)) return false;
    if (/^(?:NUL|HTAB|LF|CR|SP|WSP|OWS|PARAM|CMD|QUAL|PAIRSEP|EXPMARK|EXPDIGS|EXP|bcode-line|element|final-field|field|number|frac|decnum|decfrac|hexnum|hexfrac|hexdig-uc|payload|lenint|string-payload|string-char|hex-payload|hex-body|rawbin-payload|comment|semi-comment|paren-comment)\s*=+/m.test(raw)) {
      return false;
    }
    if (/^(?:#include|typedef|static inline|enum\b|struct\b|\/\*)/m.test(raw)) return false;
    if (/^ASCII:\s*/m.test(raw)) {
      return looksLikeSyntaxReaderBcode(raw.replace(/^ASCII:\s*/gm, ""));
    }

    const lines = raw
      .split(/\r?\n/)
      .map((line) => line.replace(/\s*;.*$/, "").trim())
      .filter(Boolean);
    if (!lines.length) return false;

    return lines.every((line) => /^[A-Za-z0-9\s#%$&<>=?!*\/.,()'`~^\\[\]{}|:+_-]+$/.test(line));
  };

  const prepareSyntaxReaderCodeBlocks = (root) => {
    if (!root) return;
    if (currentReaderSlug() !== "syntax") return;

    root.querySelectorAll("pre code").forEach((el) => {
      if (/\blanguage-/.test(el.className || "")) return;
      const text = normalizeMojibake(el.textContent || "").trim();
      if (!text) return;

      let lang = "plaintext";
      if (/^(?:#include|typedef|static inline|enum\b|struct\b|\/\*)/m.test(text) && /[{};]/.test(text)) {
        lang = "c";
      } else if (looksLikeSyntaxReaderBcode(text)) {
        lang = "bcode";
      }

      el.classList.add(`language-${lang}`);
    });
  };

  const clearMarks = (root) => {
    root.querySelectorAll("mark.bh").forEach((m) => {
      const p = m.parentNode;
      if (!p) return;
      p.replaceChild(document.createTextNode(m.textContent), m);
      p.normalize();
    });
  };

  const findMarks = (root, q) => {
    clearMarks(root);
    q = String(q || "").trim();
    if (!q) return 0;

    const re = new RegExp(ere(q), "gi");
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = n.parentElement;
        return !p || p.closest("pre,code,script,style,mark")
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    let node;
    while ((node = w.nextNode())) nodes.push(node);

    let count = 0;
    nodes.forEach((n) => {
      const t = n.nodeValue;
      re.lastIndex = 0;
      if (!re.test(t)) return;

      const frag = document.createDocumentFragment();
      let last = 0;
      let m;
      re.lastIndex = 0;
      while ((m = re.exec(t))) {
        if (m.index > last) frag.appendChild(document.createTextNode(t.slice(last, m.index)));
        const mk = document.createElement("mark");
        mk.className = "bh";
        mk.textContent = t.slice(m.index, m.index + m[0].length);
        frag.appendChild(mk);
        last = m.index + m[0].length;
        count++;
      }
      if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
      n.parentNode.replaceChild(frag, n);
    });

    return count;
  };

  const qLinks = (q) => {
    ["readerLink", "cardLink"].forEach((id) => {
      const a = document.getElementById(id);
      if (!a || a.dataset.noQuery === "1") return;
      try {
        const u = new URL(a.getAttribute("href"), location.href);
        if (q && q.trim()) u.searchParams.set("q", q);
        else u.searchParams.delete("q");
        a.setAttribute("href", u.pathname.split("/").pop() + (u.search || ""));
      } catch { }
    });
  };

  const stripContentsHyperlinks = (root) => {
    if (!root) return;
    const hs = [...root.querySelectorAll("h1,h2,h3,h4,h5,h6")];
    hs.forEach((h) => {
      if (cleanHeadingLabel(h.textContent).toLowerCase() !== "contents") return;
      const level = Number(h.tagName.slice(1));
      let el = h.nextElementSibling;
      while (el) {
        if (/^H[1-6]$/.test(el.tagName) && Number(el.tagName.slice(1)) <= level) break;
        el.querySelectorAll("a").forEach((a) => {
          const span = document.createElement("span");
          span.className = "contents-text-link";
          span.textContent = a.textContent || "";
          a.replaceWith(span);
        });
        el = el.nextElementSibling;
      }
    });
  };

  const render = () => {
    const src = $("#md-source");
    const out = $("#content");
    if (!src || !out) return [];
    const md = normalizeMojibake(src.textContent || "");
    out.innerHTML = window.marked ? marked.parse(md) : md;
    if (currentReaderSlug() === "intro") {
      const introAsciiHeading = [...out.querySelectorAll("h1,h2,h3,h4,h5,h6")].find(
        (h) => headingNumber(h.textContent || "") === "3.1" &&
          cleanHeadingLabel(h.textContent || "").toLowerCase() === "ascii columns used"
      );
      if (introAsciiHeading) introAsciiHeading.classList.add("ascii-section-anchor-hidden");
    }
    updateAsciiThemeCharts(readTheme());
    bindAsciiChartPreview(out);
    stripContentsHyperlinks(out);
    const hs = ids(out);
    prepareSyntaxReaderCodeBlocks(out);
    markCode();
    return hs;
  };

  const buildTocGroups = (hs) => {
    const groups = [];
    let current = null;
    let lastTopNumber = 0;
    let hasNumberedHeadings = false;

    hs.forEach((h) => {
      const level = Number(h.tagName.slice(1));
      const title = cleanHeadingLabel(h.textContent) || "Section";
      const num = headingNumber(h.textContent);
      const top = num ? num.split(".")[0] : "";

      if (num && !num.includes(".")) {
        if (!hasNumberedHeadings) {
          hasNumberedHeadings = true;
          if (groups.length && groups.every((g) => !g.number)) groups.length = 0;
        }
        const asInt = Number.parseInt(top, 10);
        if (Number.isFinite(asInt)) lastTopNumber = Math.max(lastTopNumber, asInt);
        current = { title, number: num, top, items: [{ heading: h, level, number: num }] };
        groups.push(current);
        return;
      }

      if (num && num.includes(".")) {
        if (!hasNumberedHeadings) {
          hasNumberedHeadings = true;
          if (groups.length && groups.every((g) => !g.number)) groups.length = 0;
        }
        const asInt = Number.parseInt(top, 10);
        if (Number.isFinite(asInt)) lastTopNumber = Math.max(lastTopNumber, asInt);
        let target = [...groups].reverse().find((g) => g.top === top);
        if (!target) {
          target = { title: `Section ${top}`, number: top, top, items: [] };
          groups.push(target);
        }
        target.items.push({ heading: h, level, number: num });
        current = target;
        return;
      }

      if (hasNumberedHeadings && level <= 2 && /^references$/i.test(title) && lastTopNumber > 0) {
        const refNum = String(lastTopNumber + 1);
        lastTopNumber += 1;
        current = { title, number: refNum, top: refNum, items: [{ heading: h, level, number: refNum }] };
        groups.push(current);
        return;
      }

      if (hasNumberedHeadings && level <= 2) {
        return;
      }

      if (level <= 2) {
        current = { title, number: "", top: "", items: [{ heading: h, level, number: "" }] };
        groups.push(current);
        return;
      }

      if (!current) {
        current = { title: "Overview", number: "", top: "", items: [] };
        groups.push(current);
      }
      current.items.push({ heading: h, level, number: "" });
    });

    return groups;
  };

  const readerScrollTopForHeading = (rb, heading) => {
    if (!rb || !heading) return 0;
    const rbRect = rb.getBoundingClientRect();
    const hRect = heading.getBoundingClientRect();
    const rawTop = rb.scrollTop + (hRect.top - rbRect.top) - 2;
    return Math.max(0, Number.isFinite(rawTop) ? rawTop : 0);
  };

  const scrollReaderToHeading = (rb, heading, smooth = true) => {
    if (!rb || !heading) return;
    rb.scrollTo({
      top: readerScrollTopForHeading(rb, heading),
      behavior: smooth ? "smooth" : "auto"
    });
  };

  const syncReaderToolRow = () => {
    if (pageType() !== "reader") return;
    const head = $(".reader-head");
    if (!head) return;
    const meta = head.querySelector(".reader-meta");
    const links = head.querySelector(".links");
    const wrap = head.querySelector(".mode-switcher-wrap");
    const tableToggle = wrap?.querySelector(".reader-table-toggle");
    const headStyle = getComputedStyle(head);

    let linksTop = Number.parseFloat(headStyle.getPropertyValue("--reader-tools-links-top"));
    if (!Number.isFinite(linksTop)) linksTop = 12;
    if (links) {
      const parsed = Number.parseFloat(getComputedStyle(links).top);
      if (Number.isFinite(parsed)) linksTop = parsed;
    }

    let rowTop = Number.parseFloat(headStyle.getPropertyValue("--reader-tools-row-top"));
    if (!Number.isFinite(rowTop)) rowTop = 56;
    const headRect = head.getBoundingClientRect();
    if (meta) {
      const metaRect = meta.getBoundingClientRect();
      const controlHeight = Number.parseFloat(headStyle.getPropertyValue("--reader-tool-height")) || 32;
      const controlHalf = controlHeight / 2;
      rowTop = Math.round(metaRect.top - headRect.top + metaRect.height / 2 - controlHalf);
      rowTop = Math.max(Math.round(linksTop + 18), rowTop);
    }

    let panelRight = 58;
    let menuRight = 0;
    if (!isSplitView() && tableToggle && wrap) {
      const tableRect = tableToggle.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      panelRight = Math.round(headRect.right - tableRect.right);
      menuRight = Math.round(wrapRect.right - tableRect.right);
    }

    head.style.setProperty("--reader-tools-links-top", `${Math.round(linksTop)}px`);
    head.style.setProperty("--reader-tools-row-top", `${Math.round(rowTop)}px`);
    head.style.setProperty("--reader-tools-panel-right", `${panelRight}px`);
    head.style.setProperty("--reader-mode-menu-right", `${menuRight}px`);
  };

  const syncReaderModeMenuHost = () => {
    if (pageType() !== "reader") return;
    const head = $(".reader-head");
    const wrap = head?.querySelector(".links .mode-switcher-wrap");
    if (!head || !wrap) return;

    const directMenu = [...head.children].find((node) => node.classList?.contains("mode-switcher-menu")) || null;
    const wrapMenu = wrap.querySelector(".mode-switcher-menu");
    const menu = directMenu || wrapMenu;
    if (!menu) return;

    const split = isSplitView();
    if (split) {
      if (menu.parentElement !== head) head.appendChild(menu);
      head.classList.add("reader-mode-menu-hosted");
      return;
    }

    if (menu.parentElement !== wrap) wrap.appendChild(menu);
    head.classList.remove("reader-mode-menu-hosted");
    menu.classList.remove("is-open");
    const trigger = wrap.querySelector(".mode-switcher");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  };

  let readerChromeMetrics = null;
  let readerTocTopAnchor = null;
  let readerPeekHandleSyncRaf = 0;
  let readerChromeHeaderVisible = true;
  let readerChromeFooterVisible = true;
  let deferImmediateReaderLaneSync = false;
  let lastReaderChromeState = {
    headerHidden: null,
    headerPeek: null,
    headerPeekPinned: null,
    footerVisible: null
  };

  const invalidateReaderChromeMetrics = (resetAnchor = false) => {
    readerChromeMetrics = null;
    if (resetAnchor) {
      readerTocTopAnchor = null;
    }
  };
  const setBodyStyleVar = (name, value) => {
    if (!document.body) return;
    if (document.body.style.getPropertyValue(name) !== value) {
      document.body.style.setProperty(name, value);
    }
  };

  const applyReaderPeekHandlePosition = () => {
    if (pageType() !== "reader") return;
    const handle = document.querySelector(".reader-header-peek-handle");
    if (!handle) return;

    if (!isSplitView()) {
      handle.style.removeProperty("left");
      handle.style.removeProperty("transform");
      return;
    }

    const reader = document.querySelector(".reader");
    const head = reader?.querySelector(".reader-head");
    const title = head?.querySelector(".reader-title");
    const quickJumpToggle = head?.querySelector("#cardLink, .cardview-toggle");
    if (!reader || !head || !title || !quickJumpToggle) {
      handle.style.removeProperty("left");
      handle.style.removeProperty("transform");
      return;
    }

    const readerRect = reader.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    const toggleRect = quickJumpToggle.getBoundingClientRect();
    const handleRect = handle.getBoundingClientRect();
    const handleWidth = Math.max(
      Math.round(handle.offsetWidth || 0),
      Math.round(handleRect.width || 0)
    );
    if (!handleWidth || !readerRect.width) {
      handle.style.removeProperty("left");
      handle.style.removeProperty("transform");
      return;
    }

    const margin = 12;
    const defaultCenterX = readerRect.width / 2;
    const defaultLeft = defaultCenterX - handleWidth / 2;
    const defaultRight = defaultCenterX + handleWidth / 2;
    // Anchor to the actual quick-jump button edge so the handle stays centered
    // in the visible gap between the title and that button.
    const toggleLeft = toggleRect.left - readerRect.left;
    const overlapsToggle =
      defaultRight > (toggleLeft - margin) &&
      defaultLeft < (toggleRect.right - readerRect.left + margin);
    const titleRight = titleRect.right - readerRect.left;
    const sideCardOpen = !document.body.classList.contains("meta-collapsed") || document.body.classList.contains("reader-table-open");

    if (!sideCardOpen && !overlapsToggle) {
      handle.style.removeProperty("left");
      handle.style.removeProperty("transform");
      return;
    }

    // Place handle in the visible gap between the title edge and toggle edge.
    const visibleGapLeft = titleRight;
    const visibleGapRight = toggleLeft;
    let targetCenter;
    const minCenter = visibleGapLeft + margin + handleWidth / 2;
    const maxCenter = visibleGapRight - margin - handleWidth / 2;

    if (minCenter <= maxCenter) {
      // Enough room — center in the visible gap, then clamp for breathing room.
      targetCenter = Math.max(minCenter, Math.min(maxCenter, (visibleGapLeft + visibleGapRight) / 2));
    } else {
      // Gap too narrow — push handle to the left of the toggle, clamped to card bounds
      targetCenter = Math.max(
        handleWidth / 2 + margin,
        Math.min(toggleLeft - margin - handleWidth / 2, readerRect.width - handleWidth / 2 - margin)
      );
      // If still overlapping, hard-push to left side of card
      if (targetCenter + handleWidth / 2 > toggleLeft - margin) {
        targetCenter = Math.max(handleWidth / 2 + margin, titleRight + margin + handleWidth / 2);
      }
    }

    handle.style.left = `${Math.round(targetCenter)}px`;
    handle.style.transform = "translateX(-50%)";
  };

  const syncReaderPeekHandlePosition = (immediate = false) => {
    if (pageType() !== "reader") return;
    if (immediate) {
      if (readerPeekHandleSyncRaf) {
        window.cancelAnimationFrame(readerPeekHandleSyncRaf);
        readerPeekHandleSyncRaf = 0;
      }
      applyReaderPeekHandlePosition();
      return;
    }
    if (readerPeekHandleSyncRaf) return;
    readerPeekHandleSyncRaf = window.requestAnimationFrame(() => {
      readerPeekHandleSyncRaf = 0;
      applyReaderPeekHandlePosition();
    });
  };

  const updateReaderPanelScaleVars = () => {
    if (pageType() !== "reader" || !document.body) return null;
    const anchorGap = Number.parseFloat(getComputedStyle(document.body).getPropertyValue("--toc-anchor-gap")) || 92;
    const availableHeight = Math.max(160, Math.floor(window.innerHeight - anchorGap * 2));
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const screenWidthPx = Math.max(window.innerWidth, Math.round((window.screen?.width || window.innerWidth) * dpr));
    const screenHeightPx = Math.max(window.innerHeight, Math.round((window.screen?.height || window.innerHeight) * dpr));
    const monitorScale = Math.min(
      1,
      screenWidthPx / READER_PANEL_BASELINE_VIEWPORT_WIDTH,
      screenHeightPx / READER_PANEL_BASELINE_VIEWPORT_HEIGHT
    );

    const readerCardScale = Number.isFinite(monitorScale) && monitorScale > 0 ? monitorScale : 1;
    let panelScale = Math.min(1, readerCardScale * 1.3);
    let panelWidth = Math.max(160, Math.round(READER_PANEL_BASELINE_WIDTH * panelScale));
    let panelHeight = Math.max(160, Math.round(READER_PANEL_BASELINE_HEIGHT * panelScale));
    let panelGap = Math.max(12, Math.round(READER_PANEL_BASELINE_GAP * panelScale));

    if (panelHeight > availableHeight) {
      const fitScale = availableHeight / panelHeight;
      panelScale *= fitScale;
      panelWidth = Math.max(160, Math.round(panelWidth * fitScale));
      panelHeight = Math.max(160, Math.round(panelHeight * fitScale));
      panelGap = Math.max(12, Math.round(panelGap * fitScale));
    }

    const readerCardTargetWidth = Math.round(1320 * readerCardScale);
    const availableCenterWidth = Math.max(
      320,
      Math.floor(window.innerWidth - (panelWidth * 2) - (panelGap * 2))
    );
    const availableCollapsedCenterWidth = Math.max(320, Math.floor(window.innerWidth * 0.98));
    const readerCardMaxWidth = Math.max(320, Math.min(readerCardTargetWidth, availableCenterWidth));
    const readerCardCollapsedMaxWidth = Math.max(
      readerCardMaxWidth,
      Math.min(
        Math.round(readerCardMaxWidth * READER_CARD_COLLAPSED_WIDTH_SCALE),
        availableCollapsedCenterWidth
      )
    );

    setBodyStyleVar("--reader-card-scale", readerCardScale.toFixed(4));
    setBodyStyleVar("--reader-card-max-width", `${readerCardMaxWidth}px`);
    setBodyStyleVar("--reader-card-collapsed-max-width", `${readerCardCollapsedMaxWidth}px`);
    setBodyStyleVar("--reader-panel-scale", panelScale.toFixed(4));
    setBodyStyleVar("--reader-panel-width", `${panelWidth}px`);
    setBodyStyleVar("--reader-panel-height", `${panelHeight}px`);
    setBodyStyleVar("--reader-side-gap", `${panelGap}px`);

    return {
      readerCardScale,
      readerCardMaxWidth,
      readerCardCollapsedMaxWidth,
      panelScale,
      panelWidth,
      panelHeight,
      panelGap,
      availableHeight
    };
  };

  const ensureTocScrollContainer = (pane) => {
    if (!pane) return null;
    let scrollEl = pane.querySelector(".toc-scroll");
    if (scrollEl) return scrollEl;

    const tocHead = pane.querySelector(".toc-head");
    const tocJumps = pane.querySelector(".toc-jumps");
    scrollEl = document.createElement("div");
    scrollEl.className = "toc-scroll";
    let node = tocJumps ? tocJumps.nextSibling : tocHead ? tocHead.nextSibling : pane.firstChild;
    while (node) {
      const next = node.nextSibling;
      scrollEl.appendChild(node);
      node = next;
    }
    pane.appendChild(scrollEl);
    return scrollEl;
  };

  const readReaderChromeMetrics = () => {
    if (pageType() !== "reader") return null;
    if (readerChromeMetrics) return readerChromeMetrics;

    const header = document.querySelector("header");
    const footer = document.querySelector("footer");
    const main = document.querySelector("main");
    const tocPane = document.querySelector(".toc-pane");
    if (!header || !footer || !main) return null;

    const headerHeight = header.offsetHeight;
    const footerHeight = footer.offsetHeight;
    const mainTopPad = Number.parseFloat(getComputedStyle(main).paddingTop) || 0;
    const topGap = Math.max(16, mainTopPad - headerHeight);
    const hiddenTopPad =
      Number.parseFloat(getComputedStyle(document.body).getPropertyValue("--reader-peek-gap")) || 58;
    const tocPaneHeight = tocPane ? Math.max(0, tocPane.offsetHeight || 0) : 0;

    readerChromeMetrics = {
      headerHeight,
      footerHeight,
      mainTopPad,
      topGap,
      hiddenTopPad,
      tocPaneHeight
    };
    return readerChromeMetrics;
  };

  let readerTocLaneSyncRaf = 0;
  let readerTableLaneSyncRaf = 0;
  let readerChromeLaneMidTimer = 0;
  let readerChromeLaneEndTimer = 0;

  const clearReaderChromeLaneTimers = () => {
    if (readerChromeLaneMidTimer) {
      window.clearTimeout(readerChromeLaneMidTimer);
      readerChromeLaneMidTimer = 0;
    }
    if (readerChromeLaneEndTimer) {
      window.clearTimeout(readerChromeLaneEndTimer);
      readerChromeLaneEndTimer = 0;
    }
  };

  const queueReaderChromeLaneSettleSync = () => {
    if (pageType() !== "reader") return;
    clearReaderChromeLaneTimers();
    const run = () => {
      syncTocFixedLane(true);
      syncReaderTableFixedLane(true);
      syncReaderPeekHandlePosition(true);
    };
    readerChromeLaneMidTimer = window.setTimeout(() => {
      readerChromeLaneMidTimer = 0;
      requestAnimationFrame(run);
    }, 120);
    readerChromeLaneEndTimer = window.setTimeout(() => {
      readerChromeLaneEndTimer = 0;
      requestAnimationFrame(run);
    }, 350);
  };

  const computeReaderPanelFrame = ({ panelWidth, panelHeight, panelGap, headerHeight, footerHeight, headerVisible, footerVisible, maxWidth = Infinity, aspectRatio = null, fitMode = "height" }) => {
    const baseWidth = Math.max(0, Math.round(panelWidth || 0));
    const baseHeight = Math.max(0, Math.round(panelHeight || 0));
    const gap = Math.max(0, Math.round(panelGap || 0));
    if (!baseWidth || !baseHeight) {
      return { top: 0, width: baseWidth, height: baseHeight };
    }

    // Gap displacement only from chrome elements that are visible;
    // cards latch to viewport edges where no chrome is present
    const topInset = headerVisible ? (Math.max(0, Math.round(headerHeight || 0)) + gap) : 0;
    const bottomInset = footerVisible ? (Math.max(0, Math.round(footerHeight || 0)) + gap) : 0;
    const maxAvailableHeight = Math.max(0, Math.round(window.innerHeight - topInset - bottomInset));
    const ratio = Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : (baseWidth / baseHeight);

    let width = baseWidth;
    let height = baseHeight;

    if (fitMode === "width") {
      width = Number.isFinite(maxWidth) && maxWidth > 0 ? Math.min(baseWidth, Math.floor(maxWidth)) : baseWidth;
      height = Math.max(1, Math.round(width / ratio));
      if (maxAvailableHeight > 0 && height > maxAvailableHeight) {
        height = maxAvailableHeight;
        width = Math.max(1, Math.round(height * ratio));
      }
    } else {
      const availableHeight = Math.max(baseHeight, maxAvailableHeight);
      height = availableHeight;
      width = Math.round(height * ratio);
      if (Number.isFinite(maxWidth) && maxWidth > 0 && width > maxWidth) {
        width = Math.max(0, Math.floor(maxWidth));
        height = Math.max(baseHeight, Math.round(width / ratio));
      }
    }

    return { top: topInset, bottom: bottomInset, width, height };
  };

  const computeSplitReaderPanelFrame = (params) => computeReaderPanelFrame(params);

  const applyTocFixedLane = () => {
    if (pageType() !== "reader") return;
    const pane = document.querySelector(".toc-pane");
    if (!pane) return;

    const inSplit = isSplitView();

    if (window.innerWidth <= 1120 && !inSplit) {
      pane.classList.remove("is-fixed");
      pane.style.removeProperty("--toc-fixed-top");
      pane.style.removeProperty("--toc-fixed-left");
      pane.style.removeProperty("--toc-fixed-width");
      pane.style.removeProperty("--toc-fixed-height");
      return;
    }

    if (readerTocTopAnchor == null) return;

    const metrics = readReaderChromeMetrics();
    const bodyStyle = getComputedStyle(document.body);
    const panelGap = Math.round(Number.parseFloat(bodyStyle.getPropertyValue("--reader-side-gap")) || 24);

    if (inSplit) {
      // Split view: position the TOC pane on the left side of the viewport
      const reader = document.querySelector(".reader");
      const readerRect = reader?.getBoundingClientRect() || null;
      const vw = window.innerWidth;
      const gap = 10;
      // TOC pane width: ~34% of viewport in split view
      const splitPaneWidth = Math.max(180, Math.round(vw * 0.34));
      const maxSplitPaneWidth = Math.max(180, Math.floor(vw - gap * 2));
      // Height matches reader card
      const readerHeight = readerRect ? Math.round(readerRect.height) : Math.round(window.innerHeight - panelGap * 2);
      const basePaneHeight = Math.max(200, readerHeight);
      const panelFrame = computeSplitReaderPanelFrame({
        panelWidth: splitPaneWidth,
        panelHeight: basePaneHeight,
        panelGap,
        headerHeight: metrics?.headerHeight || 0,
        footerHeight: metrics?.footerHeight || 0,
        headerVisible: readerChromeHeaderVisible,
        footerVisible: readerChromeFooterVisible,
        maxWidth: maxSplitPaneWidth
      });
      const baseLeft = Math.round(vw * 0.01);
      const fixedLeft = Math.round(baseLeft + splitPaneWidth - panelFrame.width);

      pane.classList.remove("is-bottom-anchored");
      pane.style.removeProperty("--toc-fixed-bottom");
      pane.style.setProperty("--toc-fixed-top", `${panelFrame.top}px`);
      pane.style.setProperty("--toc-fixed-left", `${fixedLeft}px`);
      pane.style.setProperty("--toc-fixed-width", `${panelFrame.width}px`);
      pane.style.setProperty("--toc-fixed-height", `${panelFrame.height}px`);
      pane.classList.add("is-fixed");

      // Update reader card max-width so it doesn't overlap with the toc pane
      if (readerRect && !document.body.classList.contains("meta-collapsed")) {
        const readerMaxW = Math.max(320, vw - panelFrame.width - gap * 3);
        document.body.style.setProperty("--reader-split-max-width", `${readerMaxW}px`);
      } else {
        document.body.style.setProperty("--reader-split-max-width", `${Math.round(vw * 0.98)}px`);
      }
      return;
    }

    updateReaderPanelScaleVars();

    const reader = document.querySelector(".reader");
    const grid = document.querySelector(".reader-grid");
    const scaledPanelWidth = Math.round(Number.parseFloat(bodyStyle.getPropertyValue("--reader-panel-width")) || 0);
    const scaledPanelHeight = Math.round(Number.parseFloat(bodyStyle.getPropertyValue("--reader-panel-height")) || 0);
    const paneRect = pane.getBoundingClientRect();
    const readerRect = reader?.getBoundingClientRect() || null;
    const gridStyle = grid ? getComputedStyle(grid) : null;
    const laneGap = Math.round(Number.parseFloat(gridStyle?.getPropertyValue("--reader-gap")) || 24);
    const maxPanelWidth = readerRect ? Math.max(160, Math.floor(readerRect.left - laneGap)) : Infinity;
    const panelFrame = computeReaderPanelFrame({
      panelWidth: scaledPanelWidth || Math.round(paneRect.width || pane.offsetWidth || 0),
      panelHeight: scaledPanelHeight || Math.round(paneRect.height || pane.offsetHeight || 0),
      panelGap,
      headerHeight: metrics?.headerHeight || 0,
      footerHeight: metrics?.footerHeight || 0,
      headerVisible: readerChromeHeaderVisible,
      footerVisible: readerChromeFooterVisible,
      maxWidth: maxPanelWidth
    });
    const paneWidth = Math.max(0, panelFrame.width);
    const paneHeight = Math.max(0, panelFrame.height);
    let fixedLeft = Math.round(paneRect.left);
    if (readerRect && grid && paneWidth > 0) {
      fixedLeft = Math.round(readerRect.left - laneGap - paneWidth);
    }

    pane.classList.add("is-bottom-anchored");
    pane.style.removeProperty("--toc-fixed-top");
    pane.style.setProperty("--toc-fixed-bottom", `${Math.max(0, Math.round(panelFrame.bottom || 0))}px`);
    pane.style.setProperty("--toc-fixed-left", `${fixedLeft}px`);
    if (paneWidth > 0) pane.style.setProperty("--toc-fixed-width", `${paneWidth}px`);
    if (paneHeight > 0) pane.style.setProperty("--toc-fixed-height", `${paneHeight}px`);
    pane.classList.add("is-fixed");
  };

  const syncTocFixedLane = (immediate = false) => {
    if (pageType() !== "reader") return;
    if (!immediate && isQuickJumpOpeningHoldActive()) return;
    if (immediate) {
      if (readerTocLaneSyncRaf) {
        window.cancelAnimationFrame(readerTocLaneSyncRaf);
        readerTocLaneSyncRaf = 0;
      }
      applyTocFixedLane();
      return;
    }
    if (readerTocLaneSyncRaf) return;
    readerTocLaneSyncRaf = window.requestAnimationFrame(() => {
      readerTocLaneSyncRaf = 0;
      applyTocFixedLane();
    });
  };

  const updateReaderTableToggles = (open) => {
    const isOpen = !!open;
    $$(".reader-table-toggle").forEach((btn) => {
      btn.classList.toggle("is-active", isOpen);
      btn.setAttribute("aria-pressed", isOpen ? "true" : "false");
      btn.setAttribute("title", isOpen ? "Close compact table" : "Open compact table");
      btn.setAttribute("aria-label", isOpen ? "Close compact table" : "Open compact table");
    });
  };

  const applyReaderTableFixedLane = () => {
    if (pageType() !== "reader") return;
    const reader = document.querySelector(".reader");
    const grid = document.querySelector(".reader-grid");
    const tocPane = document.querySelector(".toc-pane");
    const panel = document.getElementById("readerTablePane");
    if (!reader || !grid || !tocPane || !panel) return;

    const inSplit = isSplitView();

    if (window.innerWidth <= 1120 && !inSplit) {
      panel.style.removeProperty("--reader-table-fixed-top");
      panel.style.removeProperty("--reader-table-fixed-left");
      panel.style.removeProperty("--reader-table-fixed-width");
      panel.style.removeProperty("--reader-table-fixed-height");
      panel.classList.remove("is-fixed");
      return;
    }

    const metrics = readReaderChromeMetrics();
    const bodyStyle = getComputedStyle(document.body);
    const panelGap = Math.round(Number.parseFloat(bodyStyle.getPropertyValue("--reader-side-gap")) || 24);

    if (inSplit) {
      // Split view: position the table pane on the right side of the viewport
      const readerRect = reader.getBoundingClientRect();
      const vw = window.innerWidth;
      const gap = 10;
      // Table pane width: ~34% of viewport in split view
      const splitPaneWidth = Math.max(180, Math.round(vw * 0.34));
      const maxSplitPaneWidth = Math.max(180, Math.floor(vw - gap * 2));
      const readerHeight = readerRect ? Math.round(readerRect.height) : Math.round(window.innerHeight - panelGap * 2);
      const basePaneHeight = Math.max(200, readerHeight);
      const panelFrame = computeSplitReaderPanelFrame({
        panelWidth: splitPaneWidth,
        panelHeight: basePaneHeight,
        panelGap,
        headerHeight: metrics?.headerHeight || 0,
        footerHeight: metrics?.footerHeight || 0,
        headerVisible: readerChromeHeaderVisible,
        footerVisible: readerChromeFooterVisible,
        maxWidth: maxSplitPaneWidth
      });
      const fixedLeft = Math.round(vw - panelFrame.width - vw * 0.01);

      panel.classList.remove("is-bottom-anchored");
      panel.style.removeProperty("--reader-table-fixed-bottom");
      panel.style.setProperty("--reader-table-fixed-top", `${panelFrame.top}px`);
      panel.style.setProperty("--reader-table-fixed-left", `${fixedLeft}px`);
      panel.style.setProperty("--reader-table-fixed-width", `${panelFrame.width}px`);
      panel.style.setProperty("--reader-table-fixed-height", `${panelFrame.height}px`);
      panel.classList.add("is-fixed");

      // Update reader card max-width for table open state
      if (document.body.classList.contains("reader-table-open")) {
        const readerMaxW = Math.max(320, vw - panelFrame.width - gap * 3);
        document.body.style.setProperty("--reader-split-max-width", `${readerMaxW}px`);
      } else if (document.body.classList.contains("meta-collapsed")) {
        document.body.style.setProperty("--reader-split-max-width", `${Math.round(vw * 0.98)}px`);
      }
      return;
    }

    updateReaderPanelScaleVars();
    const readerRect = reader.getBoundingClientRect();
    const scaledPanelWidth = Math.round(Number.parseFloat(bodyStyle.getPropertyValue("--reader-panel-width")) || 0);
    const scaledPanelHeight = Math.round(Number.parseFloat(bodyStyle.getPropertyValue("--reader-panel-height")) || 0);
    const maxPanelWidth = Math.max(160, Math.floor(window.innerWidth - readerRect.right - panelGap));
    const panelFrame = computeReaderPanelFrame({
      panelWidth: scaledPanelWidth,
      panelHeight: scaledPanelHeight,
      panelGap,
      headerHeight: metrics?.headerHeight || 0,
      footerHeight: metrics?.footerHeight || 0,
      headerVisible: readerChromeHeaderVisible,
      footerVisible: readerChromeFooterVisible,
      maxWidth: maxPanelWidth
    });
    const panelHeight = Math.max(0, panelFrame.height);
    const panelWidth = Math.max(0, panelFrame.width);

    panel.classList.add("is-bottom-anchored");
    panel.style.removeProperty("--reader-table-fixed-top");
    panel.style.setProperty("--reader-table-fixed-bottom", `${Math.max(0, Math.round(panelFrame.bottom || 0))}px`);
    panel.style.setProperty("--reader-table-fixed-left", `${Math.round(readerRect.right + panelGap)}px`);
    if (panelWidth > 0) panel.style.setProperty("--reader-table-fixed-width", `${panelWidth}px`);
    if (panelHeight > 0) panel.style.setProperty("--reader-table-fixed-height", `${panelHeight}px`);
  };

  const syncReaderTableFixedLane = (immediate = false) => {
    if (pageType() !== "reader") return;
    if (immediate) {
      if (readerTableLaneSyncRaf) {
        window.cancelAnimationFrame(readerTableLaneSyncRaf);
        readerTableLaneSyncRaf = 0;
      }
      applyReaderTableFixedLane();
      return;
    }
    if (readerTableLaneSyncRaf) return;
    readerTableLaneSyncRaf = window.requestAnimationFrame(() => {
      readerTableLaneSyncRaf = 0;
      applyReaderTableFixedLane();
    });
  };

  let readerTableSvgSwapPending = false;
  let readerTablePreloadedSvg = null;

  const swapCompactChartToJpg = () => {
    const panel = document.getElementById("readerTablePane");
    if (!panel) return;
    const img = panel.querySelector(".ascii-compact-theme-chart");
    if (!img) return;
    const assets = getAsciiChartAssets(readTheme(), "compact");
    const jpgSrc = `${assetBase()}${assets.png}`;
    if (img.getAttribute("src") !== jpgSrc) img.setAttribute("src", jpgSrc);
  };

  const swapCompactChartToSvg = () => {
    const panel = document.getElementById("readerTablePane");
    if (!panel) return;
    const img = panel.querySelector(".ascii-compact-theme-chart");
    if (!img || !img.dataset.svgSrc) return;
    if (img.getAttribute("src") !== img.dataset.svgSrc) {
      img.setAttribute("src", img.dataset.svgSrc);
    }
  };

  const preloadCompactSvg = () => {
    const assets = getAsciiChartAssets(readTheme(), "compact");
    const svgSrc = `${assetBase()}${assets.svg}`;
    const preload = new Image();
    preload.src = svgSrc;
    readerTablePreloadedSvg = preload;
  };

  const handleTableTransitionEnd = (e) => {
    if (!readerTableSvgSwapPending) return;
    if (e.target !== e.currentTarget) return;
    // Trigger on opacity — it finishes while transform is still in motion,
    // so the swap happens during animation, not after the panel settles
    if (e.propertyName !== "opacity") return;
    readerTableSvgSwapPending = false;
    const panel = e.currentTarget;
    panel.removeEventListener("transitionend", handleTableTransitionEnd);
    if (!document.body.classList.contains("reader-table-open")) return;
    // If preloaded SVG is decoded, swap immediately; otherwise wait for it
    if (readerTablePreloadedSvg && readerTablePreloadedSvg.complete) {
      swapCompactChartToSvg();
    } else if (readerTablePreloadedSvg) {
      readerTablePreloadedSvg.onload = () => swapCompactChartToSvg();
    } else {
      swapCompactChartToSvg();
    }
  };

  let readerTableResizeSvgSwapTimer = 0;
  let readerTableChromeMotionActive = false;

  const primeCompactChartForResizeMotion = (forcePaint = false) => {
    if (!document.body.classList.contains("reader-table-open")) return false;
    readerTableChromeMotionActive = true;
    swapCompactChartToJpg();
    preloadCompactSvg();
    if (forcePaint) {
      const panel = document.getElementById("readerTablePane");
      const img = panel ? panel.querySelector(".ascii-compact-theme-chart") : null;
      if (img) void img.offsetHeight;
      if (panel) void panel.offsetHeight;
    }
    return true;
  };

  const scheduleResizeSvgSwap = (prime = true) => {
    cancelResizeSvgSwap();
    const ready = prime ? primeCompactChartForResizeMotion(false) : document.body.classList.contains("reader-table-open");
    if (!ready) return;
    readerTableChromeMotionActive = true;
    // Swap back to SVG on the last practical frame of the 240ms resize motion.
    readerTableResizeSvgSwapTimer = setTimeout(() => {
      readerTableResizeSvgSwapTimer = 0;
      if (!document.body.classList.contains("reader-table-open")) {
        readerTableChromeMotionActive = false;
        return;
      }
      if (readerTablePreloadedSvg && readerTablePreloadedSvg.complete) {
        swapCompactChartToSvg();
        readerTableChromeMotionActive = false;
      } else if (readerTablePreloadedSvg) {
        readerTablePreloadedSvg.onload = () => {
          swapCompactChartToSvg();
          readerTableChromeMotionActive = false;
        };
      } else {
        swapCompactChartToSvg();
        readerTableChromeMotionActive = false;
      }
    }, 232);
  };

  const cancelResizeSvgSwap = () => {
    if (readerTableResizeSvgSwapTimer) {
      clearTimeout(readerTableResizeSvgSwapTimer);
      readerTableResizeSvgSwapTimer = 0;
    }
    readerTableChromeMotionActive = false;
  };

  const setReaderTableOpen = (open) => {
    if (!document.body) return;
    const isOpen = !!open;
    const isPhoneReaderSingleCard =
      pageType() === "reader" && document.body.classList.contains("is-phone");
    if (isPhoneReaderSingleCard) {
      if (isOpen) {
        swapCompactChartToJpg();
        preloadCompactSvg();
      } else {
        swapCompactChartToJpg();
      }
      setMobilePanel(isOpen ? "table" : "reader");
      updateReaderTableToggles(isOpen);
      requestAnimationFrame(syncReaderTableFixedLane);
      requestAnimationFrame(syncReaderPeekHandlePosition);
      return;
    }
    // Cancel any pending SVG swap from a prior open
    readerTableSvgSwapPending = false;
    const panel = document.getElementById("readerTablePane");
    if (panel) panel.removeEventListener("transitionend", handleTableTransitionEnd);
    // In split view, opening the table must close the quick jump (only one side card at a time)
    if (isOpen && isSplitView() && !document.body.classList.contains("meta-collapsed")) {
      // Close quick jump first, then open table after the shift animation
      document.body.classList.add("meta-collapsed");
      const cardLink = document.querySelector("#cardLink");
      if (cardLink) {
        const action = "Open Quick Jump";
        const icon = iconPath("arrowleft.svg");
        cardLink.innerHTML = `<img class="cardview-toggle-icon" src="${icon}" alt="${action}"><span>${action}</span>`;
        cardLink.setAttribute("aria-label", action);
        cardLink.setAttribute("title", action);
        requestAnimationFrame(syncReaderPeekHandlePosition);
      }
      stageQuickJumpPaneTransition("closing");
      invalidateReaderChromeMetrics();
      syncTocFixedLane(true);
    }
    // Use JPG during animation for smooth performance; preload SVG in background
    if (isOpen) {
      swapCompactChartToJpg();
      preloadCompactSvg();
      updateReaderChromeMotion();
      syncTocFixedLane(true);
      syncReaderTableFixedLane(true);
    } else {
      // Closing: ensure JPG is shown for the close animation
      swapCompactChartToJpg();
    }
    // Update split-view reader width for table open/close
    if (isSplitView()) {
      const vw = window.innerWidth || 0;
      if (isOpen) {
        const paneWidth = Math.max(180, Math.round(vw * 0.34));
        setSplitReaderFillSide("right");
        scheduleSplitReaderWidth(Math.max(320, vw - paneWidth - 28), 0);
      } else if (document.body.classList.contains("meta-collapsed")) {
        setSplitReaderFillSide("right");
        scheduleSplitReaderWidth(Math.round(vw * 0.98), TOC_LAYOUT_TRANSITION_MS + 30);
      }
    }
    document.body.classList.toggle("reader-table-open", isOpen);
    updateReaderTableToggles(isOpen);
    requestAnimationFrame(syncReaderTableFixedLane);
    requestAnimationFrame(syncReaderPeekHandlePosition);
    queueReaderChromeLaneSettleSync();
    // Swap to crisp SVG on the final frame of the open transition
    if (isOpen && panel) {
      readerTableSvgSwapPending = true;
      panel.addEventListener("transitionend", handleTableTransitionEnd);
    }
  };

  const ensureReaderTablePanel = () => {
    if (pageType() !== "reader") return;
    const host = document.querySelector(".reader-phantom-col");
    if (!host) return;

    let panel = document.getElementById("readerTablePane");
    if (!panel) {
      panel = document.createElement("aside");
      panel.id = "readerTablePane";
      panel.className = "reader-table-pane";
      panel.setAttribute("aria-label", "Compact ASCII table");
      panel.innerHTML =
        '<div class="reader-table-actions">' +
        `<button type="button" class="ascii-preview-btn reader-table-save" id="readerTableSave" aria-label="Save compact table"><img src="${iconPath("floppy.svg")}" alt=""></button>` +
        `<button type="button" class="ascii-preview-btn reader-table-close" id="readerTableClose" aria-label="Close compact table"><img src="${iconPath("x.svg")}" alt=""></button>` +
        "</div>" +
        '<figure class="ascii-chart-figure reader-table-figure">' +
        `<img class="ascii-compact-theme-chart" data-preview-variant="full" src="${assetBase()}${getAsciiChartAssets(readTheme(), "compact").png}" alt="Compact ASCII reference chart">` +
        "</figure>";
      host.appendChild(panel);
    }

    const saveBtn = panel.querySelector("#readerTableSave");
    if (saveBtn && !saveBtn.dataset.bound) {
      saveBtn.dataset.bound = "1";
      saveBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const assets = getAsciiChartAssets(readTheme(), "compact");
        await downloadAsset(`${assetBase()}${assets.svg}`, assets.svg);
      });
    }

    const closeBtn = panel.querySelector("#readerTableClose");
    if (closeBtn && !closeBtn.dataset.bound) {
      closeBtn.dataset.bound = "1";
      closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        setReaderTableOpen(false);
      });
    }

    bindAsciiChartPreview(panel);
    updateAsciiThemeCharts(readTheme());
    updateReaderTableToggles(document.body.classList.contains("reader-table-open"));
    requestAnimationFrame(() => {
      syncReaderTableFixedLane();
      requestAnimationFrame(syncReaderTableFixedLane);
    });
  };

  const updateReaderChromeMotion = () => {
    if (pageType() !== "reader") return;
    const rb = $("#readerBody");
    const metrics = readReaderChromeMetrics();
    if (!rb || !metrics) return;

    const prevHeaderHidden = !!document.body.classList.contains("reader-header-hidden");
    const prevHeaderPeek = !!document.body.classList.contains("reader-header-peek");
    const prevHeaderPeekPinned = !!document.body.classList.contains("reader-header-peek-pinned");
    const scrollTop = Math.max(0, rb.scrollTop);
    const atTop = scrollTop <= 0.5;
    const isHeaderHidden = scrollTop > Math.max(20, metrics.headerHeight - 10);
    const headerShift = isHeaderHidden ? -metrics.headerHeight : 0;

    const nextHeaderHidden = isHeaderHidden;
    const nextHeaderPeek = nextHeaderHidden ? prevHeaderPeek : false;
    const nextHeaderPeekPinned = nextHeaderHidden ? prevHeaderPeekPinned : false;
    const nextFooterVisible = atTop;
    const chromeStateImminent =
      prevHeaderHidden !== nextHeaderHidden ||
      prevHeaderPeek !== nextHeaderPeek ||
      prevHeaderPeekPinned !== nextHeaderPeekPinned ||
      lastReaderChromeState.headerHidden !== nextHeaderHidden ||
      lastReaderChromeState.headerPeek !== nextHeaderPeek ||
      lastReaderChromeState.headerPeekPinned !== nextHeaderPeekPinned ||
      lastReaderChromeState.footerVisible !== nextFooterVisible;

    if (chromeStateImminent && !readerTableSvgSwapPending && !readerTableResizeSvgSwapTimer) {
      primeCompactChartForResizeMotion(true);
    }

    setBodyStyleVar("--reader-header-size", `${metrics.headerHeight}px`);
    setBodyStyleVar("--reader-header-shift", `${headerShift}px`);
    document.body.classList.toggle("reader-header-hidden", isHeaderHidden);
    if (!isHeaderHidden) {
      document.body.classList.remove("reader-header-peek");
      document.body.classList.remove("reader-header-peek-pinned");
    }
    syncReaderPeekHandlePosition();

    const footerShift = atTop ? 0 : metrics.footerHeight + 20;
    const footerVisible = 0;
    const mainBottomPad = 0;

    setBodyStyleVar("--reader-footer-shift", `${footerShift}px`);
    setBodyStyleVar("--reader-footer-visible", `${footerVisible}px`);
    setBodyStyleVar("--reader-main-bottom-pad", `${mainBottomPad}px`);

    // Update chrome visibility state for panel frame calculations
    readerChromeHeaderVisible = !isHeaderHidden || document.body.classList.contains("reader-header-peek");
    readerChromeFooterVisible = atTop;

    const tocPane = document.querySelector(".toc-pane");
    if (tocPane) {
      let needsImmediateLaneSync = false;
      const chromeStateChanged = chromeStateImminent;

      const panelGap = Math.round(Number.parseFloat(
        getComputedStyle(document.body).getPropertyValue("--reader-side-gap")
      ) || 24);

      if (readerTocTopAnchor == null) {
        readerTocTopAnchor = Math.max(0, metrics.headerHeight + panelGap);
        needsImmediateLaneSync = true;
      }
      setBodyStyleVar("--toc-top-anchor", `${readerTocTopAnchor}px`);
      if (window.innerWidth > 1120) {
        const mainTopPad = readerChromeHeaderVisible ? (metrics.headerHeight + panelGap) : 0;
        setBodyStyleVar("--reader-main-top-pad", `${mainTopPad}px`);
        setBodyStyleVar("--reader-hidden-main-top", "0px");
      } else {
        if (document.body.style.getPropertyValue("--reader-main-top-pad")) {
          document.body.style.removeProperty("--reader-main-top-pad");
        }
        if (document.body.style.getPropertyValue("--reader-hidden-main-top")) {
          document.body.style.removeProperty("--reader-hidden-main-top");
        }
      }
      if (chromeStateChanged && !deferImmediateReaderLaneSync) needsImmediateLaneSync = true;
      if (!tocPane.classList.contains("is-fixed")) needsImmediateLaneSync = true;
      lastReaderChromeState = {
        headerHidden: nextHeaderHidden,
        headerPeek: nextHeaderPeek,
        headerPeekPinned: nextHeaderPeekPinned,
        footerVisible: nextFooterVisible
      };

      // JPG/SVG swap for compact chart during chrome resize
      if (chromeStateChanged && !readerTableSvgSwapPending) {
        scheduleResizeSvgSwap(false);
      }

      if (chromeStateChanged) queueReaderChromeLaneSettleSync();
      if (needsImmediateLaneSync) {
        syncTocFixedLane(true);
        syncReaderTableFixedLane(true);
      } else {
        syncTocFixedLane();
        syncReaderTableFixedLane();
      }
    }
  };

  const ensureReaderEndPad = () => {
    if (pageType() !== "reader") return;
    const rb = $("#readerBody");
    const out = $("#content");
    if (!rb) return;

    let pad = rb.querySelector(".reader-end-pad");
    if (!pad) {
      pad = document.createElement("div");
      pad.className = "reader-end-pad";
      pad.innerHTML = '<button class="reader-return-top" type="button">Return to Top of Documentation</button>';
      rb.appendChild(pad);
    }

    const btn = pad.querySelector(".reader-return-top");
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = "1";
      btn.addEventListener("click", () => {
        rb.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    const lineHeight = Number.parseFloat(getComputedStyle(out || rb).lineHeight) || 24;
    const bottomLineGap = Math.max(24, Math.round(lineHeight * 2));
    const padHeightNow = pad.offsetHeight;
    const naturalScrollHeight = Math.max(0, rb.scrollHeight - padHeightNow);
    const maxWithoutPad = Math.max(0, naturalScrollHeight - rb.clientHeight);
    const headings = out ? [...out.querySelectorAll("h1,h2,h3,h4")] : [];
    const lastHeading = headings.length ? headings[headings.length - 1] : null;
    const targetScroll = lastHeading ? readerScrollTopForHeading(rb, lastHeading) : 0;
    const requiredExtra = Math.max(0, Math.ceil(targetScroll - maxWithoutPad));
    const finalPad = bottomLineGap + requiredExtra;
    pad.style.minHeight = `${finalPad}px`;
  };

  const ensureReaderHeaderPeekHandle = () => {
    if (pageType() !== "reader") return;
    const reader = document.querySelector(".reader");
    if (!reader) return;
    let handle = document.querySelector(".reader-header-peek-handle");
    if (!handle) {
      handle = document.createElement("button");
      handle.type = "button";
      handle.className = "reader-header-peek-handle";
      handle.setAttribute("aria-label", "Show header");
      handle.innerHTML =
        '<span class="reader-header-peek-line"></span>' +
        '<span class="reader-header-peek-line"></span>' +
        '<span class="reader-header-peek-line"></span>';
      reader.appendChild(handle);
    } else if (handle.parentElement !== reader) {
      reader.appendChild(handle);
    }

    let hoverTimer = 0;
    let hideTimer = 0;
    const clearHoverTimer = () => {
      if (!hoverTimer) return;
      window.clearTimeout(hoverTimer);
      hoverTimer = 0;
    };
    const clearHideTimer = () => {
      if (!hideTimer) return;
      window.clearTimeout(hideTimer);
      hideTimer = 0;
    };
    const isHidden = () => document.body.classList.contains("reader-header-hidden");
    const isPinned = () => document.body.classList.contains("reader-header-peek-pinned");
    const isPreviewOpen = () => document.body.classList.contains("ascii-preview-open");
    const syncReaderSidePanels = () => {
      deferImmediateReaderLaneSync = true;
      invalidateReaderChromeMetrics();
      updateReaderChromeMotion();
      requestAnimationFrame(() => {
        deferImmediateReaderLaneSync = false;
        syncReaderPeekHandlePosition();
        updateReaderChromeMotion();
      });
    };

    const showHeader = (pin = false) => {
      if (isPreviewOpen()) return;
      if (!isHidden()) return;
      clearHideTimer();
      const wasPeek = document.body.classList.contains("reader-header-peek");
      const wasPinned = isPinned();
      document.body.classList.add("reader-header-peek");
      if (pin) document.body.classList.add("reader-header-peek-pinned");
      if (!wasPeek || (!wasPinned && pin)) syncReaderSidePanels();
    };
    const queueShowHeader = (delay = 220) => {
      if (isPreviewOpen()) return;
      if (!isHidden()) return;
      if (isPinned()) return;
      if (document.body.classList.contains("reader-header-peek")) return;
      clearHideTimer();
      if (hoverTimer) return;
      hoverTimer = window.setTimeout(() => {
        hoverTimer = 0;
        if (!isHidden() || isPinned()) return;
        showHeader(false);
      }, delay);
    };

    const hideHeaderNow = () => {
      if (!isHidden()) return;
      if (isPinned()) return;
      if (!document.body.classList.contains("reader-header-peek")) return;
      document.body.classList.remove("reader-header-peek");
      syncReaderSidePanels();
    };
    const queueHideHeader = (e, delay = 220) => {
      clearHoverTimer();
      const next = e && e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget : null;
      if (next && (next.closest(".reader-header-peek-handle") || next.closest("header"))) return;
      if (!isHidden()) return;
      if (isPinned()) return;
      clearHideTimer();
      hideTimer = window.setTimeout(() => {
        hideTimer = 0;
        hideHeaderNow();
      }, delay);
    };

    const togglePinnedHeader = () => {
      if (isPreviewOpen()) return;
      if (!isHidden()) return;
      const pinned = isPinned();
      if (pinned) {
        document.body.classList.remove("reader-header-peek-pinned");
        document.body.classList.remove("reader-header-peek");
        syncReaderSidePanels();
        return;
      }
      clearHoverTimer();
      showHeader(true);
    };

    if (!handle.dataset.bound) {
      handle.dataset.bound = "1";
      handle.addEventListener("mouseenter", () => queueShowHeader(120));
      handle.addEventListener("focus", () => showHeader(false));
      handle.addEventListener("mouseleave", (e) => queueHideHeader(e, 220));
      handle.addEventListener("blur", (e) => queueHideHeader(e, 120));
      handle.addEventListener("click", (e) => {
        e.preventDefault();
        togglePinnedHeader();
      });
    }
    const header = document.querySelector("header");
    if (header && !header.dataset.peekBound) {
      header.dataset.peekBound = "1";
      header.addEventListener("mouseenter", () => {
        clearHoverTimer();
        clearHideTimer();
        showHeader(false);
      });
      header.addEventListener("mouseleave", (e) => queueHideHeader(e, 240));
    }

    if (!document.body.dataset.peekKeyBound) {
      document.body.dataset.peekKeyBound = "1";
      document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        if (!isPinned()) return;
        document.body.classList.remove("reader-header-peek-pinned");
        if (isHidden()) document.body.classList.remove("reader-header-peek");
        syncReaderSidePanels();
      });
    }

    syncReaderPeekHandlePosition();
  };

  const toc = (hs) => {
    const list = $("#tocList");
    const rb = $("#readerBody");
    const out = $("#content");
    const pane = $(".toc-pane");
    const scrollEl = ensureTocScrollContainer(pane);
    if (!list || !rb || !out || !pane || !scrollEl) return;

    const groups = buildTocGroups(hs);
    const headingMap = new Map();
    const sublists = [];
    const tocEntryEls = [];
    const manualExpanded = new Set();
    let pinnedEntryEl = null;
    let refreshJumpLinks = () => { };
    list.innerHTML = "";

    const setPinnedEntry = (el) => {
      if (pinnedEntryEl && pinnedEntryEl !== el) pinnedEntryEl.classList.remove("toc-pinned");
      pinnedEntryEl = el || null;
      if (pinnedEntryEl) pinnedEntryEl.classList.add("toc-pinned");
    };

    let deferredVisibleEl = null;
    let deferredVisibleTimer = 0;
    const queueKeepEntryVisible = () => {
      clearTimeout(deferredVisibleTimer);
      deferredVisibleTimer = window.setTimeout(() => {
        deferredVisibleTimer = 0;
        if (deferredVisibleEl) keepEntryVisible(deferredVisibleEl, true);
      }, TOC_SUBLIST_TRANSITION_MS + 24);
    };
    const isTocAutoScrollLocked = () => {
      const raw = document.body && document.body.dataset ? document.body.dataset.tocAutoScrollLockUntil : "";
      const until = Number.parseInt(raw || "", 10);
      return Number.isFinite(until) && until > Date.now();
    };

    const getVisibleTocEntries = () =>
      tocEntryEls.filter((node) => !node.closest(".toc-sublist.is-collapsed, .toc-sublist.is-hidden"));

    const keepEntryVisible = (el, force = false) => {
      if (!force && isTocAutoScrollLocked()) {
        deferredVisibleEl = el || null;
        queueKeepEntryVisible();
        return;
      }
      if (!el || !scrollEl) return;
      deferredVisibleEl = null;
      const visibleEntries = getVisibleTocEntries();
      const fallbackEl = visibleEntries.includes(el)
        ? el
        : el.closest(".toc-group")?.querySelector(".toc-group-toggle") || el;
      const entryIndex = visibleEntries.indexOf(fallbackEl);
      const contextCount = 3;
      const topPad = 12;
      const botPad = 12;
      const paneRect = scrollEl.getBoundingClientRect();
      const offsetWithinPane = (node) => {
        const rect = node.getBoundingClientRect();
        return scrollEl.scrollTop + (rect.top - paneRect.top);
      };
      const topAnchor = entryIndex >= 0 ? visibleEntries[Math.max(0, entryIndex - contextCount)] : fallbackEl;
      const bottomAnchor = entryIndex >= 0 ? visibleEntries[Math.min(visibleEntries.length - 1, entryIndex + contextCount)] : fallbackEl;
      const currentTop = scrollEl.scrollTop;
      const desiredTop = Math.max(0, offsetWithinPane(topAnchor) - topPad);
      const bottomRect = bottomAnchor.getBoundingClientRect();
      const desiredBottom = Math.max(
        0,
        offsetWithinPane(bottomAnchor) + bottomRect.height + botPad - scrollEl.clientHeight
      );

      if (currentTop > desiredTop) {
        scrollEl.scrollTop = desiredTop;
      } else if (currentTop < desiredBottom) {
        scrollEl.scrollTop = desiredBottom;
      }
    };

    groups.forEach((g, groupIndex) => {
      const groupHeading = g.items.find((entry) => entry.number && !entry.number.includes(".")) || g.items[0] || null;
      const subEntries = g.items.filter((entry) => entry.number && entry.number.includes("."));
      const hasChildren = subEntries.length > 0;
      const groupKey = g.top || `group-${groupIndex + 1}`;

      const groupItem = document.createElement("li");
      groupItem.className = "toc-group";

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "toc-group-toggle";
      toggle.dataset.groupKey = groupKey;
      const groupNumber = g.number || String(groupIndex + 1);
      const groupNumberText = groupNumber.includes(".") ? groupNumber : `${groupNumber}.`;
      toggle.innerHTML =
        `<span class="toc-group-title">${esc(groupNumberText)} ${esc(g.title)}</span>` +
        (hasChildren
          ? '<span class="toc-caret-hit" role="button" tabindex="-1" aria-label="Toggle sub sections"><span class="toc-caret" aria-hidden="true">&#9662;</span></span>'
          : "");
      toggle.setAttribute("aria-expanded", "false");
      tocEntryEls.push(toggle);

      const sub = document.createElement("ul");
      sub.className = "toc-sublist is-collapsed";

      subEntries.forEach((entry, itemIndex) => {
        const li = document.createElement("li");
        li.className = `l${entry.level}`;

        const a = document.createElement("a");
        a.href = `#${entry.heading.id}`;
        const num = document.createElement("span");
        num.className = "toc-item-number";
        const entryNumber = entry.number || (g.number ? `${g.number}.${itemIndex + 1}` : `${groupIndex + 1}.${itemIndex + 1}`);
        num.textContent = entryNumber;
        const label = document.createElement("span");
        label.className = "toc-item-label";
        label.textContent = cleanHeadingLabel(entry.heading.textContent);
        a.appendChild(num);
        a.appendChild(label);
        tocEntryEls.push(a);
        a.onclick = (e) => {
          e.preventDefault();
          manualExpanded.add(groupKey);
          setPinnedEntry(a);
          lockTocAutoScroll(TOC_SUBLIST_TRANSITION_MS);
          scrollReaderToHeading(rb, entry.heading, true);
        };

        li.appendChild(a);
        sub.appendChild(li);
        headingMap.set(entry.heading.id, { link: a, sub, toggle, hasChildren, heading: entry.heading, isDecimal: true });
      });

      if (hasChildren) {
        toggle.classList.add("has-children");
        toggle.onclick = (e) => {
          const fromCaret = !!e.target.closest(".toc-caret-hit");
          if (fromCaret) {
            lockTocAutoScroll(TOC_SUBLIST_TRANSITION_MS);
            const collapsed = sub.classList.toggle("is-collapsed");
            toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
            if (collapsed) manualExpanded.delete(groupKey);
            else manualExpanded.add(groupKey);
            setPinnedEntry(toggle);
            window.setTimeout(() => requestAnimationFrame(refreshJumpLinks), TOC_SUBLIST_TRANSITION_MS + 20);
            return;
          }
          const isCollapsed = sub.classList.contains("is-collapsed");
          if (isCollapsed) {
            lockTocAutoScroll(TOC_SUBLIST_TRANSITION_MS);
            sub.classList.remove("is-collapsed");
            toggle.setAttribute("aria-expanded", "true");
            manualExpanded.add(groupKey);
            setPinnedEntry(toggle);
            window.setTimeout(() => requestAnimationFrame(refreshJumpLinks), TOC_SUBLIST_TRANSITION_MS + 20);
            return;
          }
          if (groupHeading && groupHeading.heading) {
            setPinnedEntry(toggle);
            scrollReaderToHeading(rb, groupHeading.heading, true);
          }
        };
      } else {
        toggle.classList.add("is-leaf");
        sub.classList.add("is-hidden");
        toggle.onclick = (e) => {
          e.preventDefault();
          if (!groupHeading || !groupHeading.heading) return;
          setPinnedEntry(toggle);
          scrollReaderToHeading(rb, groupHeading.heading, true);
        };
      }

      if (groupHeading && groupHeading.heading && groupHeading.heading.id) {
        headingMap.set(groupHeading.heading.id, {
          link: null,
          sub,
          toggle,
          hasChildren,
          heading: groupHeading.heading,
          isDecimal: false
        });
      }

      groupItem.appendChild(toggle);
      groupItem.appendChild(sub);
      list.appendChild(groupItem);
      sublists.push({ sub, toggle, hasChildren });
    });

    let allExpanded = false;
    const setUnifiedTocHeight = () => {
      const panelMetrics = updateReaderPanelScaleVars();
      const chromeMetrics = readReaderChromeMetrics();
      if (readerTocTopAnchor == null && chromeMetrics) {
        const pGap = Math.round(Number.parseFloat(
          getComputedStyle(document.body).getPropertyValue("--reader-side-gap")
        ) || 24);
        readerTocTopAnchor = Math.max(0, chromeMetrics.headerHeight + pGap);
        setBodyStyleVar("--toc-top-anchor", `${readerTocTopAnchor}px`);
      }
      const lockedHeight = Math.max(160, Math.round(panelMetrics?.panelHeight || 160));
      pane.style.setProperty("--toc-locked-height", `${Math.round(lockedHeight)}px`);
      syncTocFixedLane(true);
      syncReaderTableFixedLane(true);
    };
    setUnifiedTocHeight();

    const applyAllExpandedState = (expanded, syncManual = false) => {
      allExpanded = !!expanded;
      lockTocAutoScroll(TOC_SUBLIST_TRANSITION_MS);
      sublists.forEach(({ sub, toggle, hasChildren }) => {
        if (!hasChildren) return;
        sub.classList.toggle("is-collapsed", !allExpanded);
        toggle.setAttribute("aria-expanded", allExpanded ? "true" : "false");
        if (syncManual) {
          const key = toggle.dataset.groupKey || "";
          if (!key) return;
          if (allExpanded) manualExpanded.add(key);
          else manualExpanded.delete(key);
        }
      });
      if (tg) tg.textContent = allExpanded ? "Collapse all" : "Expand all";
      window.setTimeout(() => requestAnimationFrame(refreshJumpLinks), TOC_SUBLIST_TRANSITION_MS + 20);
    };

    const shouldAutoExpandAllBySpace = () => {
      if (!sublists.some((x) => x.hasChildren)) return false;
      const prevCollapsed = sublists.map(({ sub, hasChildren }) =>
        hasChildren ? sub.classList.contains("is-collapsed") : false
      );
      pane.classList.add("is-measuring");
      sublists.forEach(({ sub, toggle, hasChildren }) => {
        if (!hasChildren) return;
        sub.classList.remove("is-collapsed");
        toggle.setAttribute("aria-expanded", "true");
      });
      const expandedHeight = scrollEl.scrollHeight;
      const availableHeight = Math.floor(scrollEl.clientHeight || scrollEl.getBoundingClientRect().height || 0);
      sublists.forEach(({ sub, toggle, hasChildren }, idx) => {
        if (!hasChildren) return;
        const collapsed = !!prevCollapsed[idx];
        sub.classList.toggle("is-collapsed", collapsed);
        toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      });
      pane.classList.remove("is-measuring");
      return availableHeight > 0 && expandedHeight <= availableHeight + 2;
    };

    const tg = $("#tocToggle");
    if (tg) {
      tg.textContent = "Expand all";
      tg.onclick = () => {
        applyAllExpandedState(!allExpanded, true);
      };
    }
    applyAllExpandedState(true, false);

    let anchorOffset = 8;
    const recalcAnchorOffset = () => {
      const lh = Number.parseFloat(getComputedStyle(out).lineHeight);
      anchorOffset = Number.isFinite(lh) ? Math.max(8, Math.round(lh * 1.1)) : 8;
    };
    recalcAnchorOffset();

    // Track only headings that actually exist in quick-jump.
    const trackedHeadings = hs.filter((h) => headingMap.has(h.id));
    const headingTrack = trackedHeadings.map((h) => {
      const meta = headingMap.get(h.id);
      return { id: h.id, heading: h, top: 0, isDecimal: !!(meta && meta.isDecimal && meta.link) };
    });
    const decimalTrack = headingTrack.filter((x) => x.isDecimal);
    let measuredScrollHeight = -1;
    const recalcHeadingTops = () => {
      headingTrack.forEach((x) => {
        x.top = readerScrollTopForHeading(rb, x.heading);
      });
      measuredScrollHeight = rb.scrollHeight;
    };
    recalcHeadingTops();

    const findLastAtOrBefore = (arr, pos) => {
      let lo = 0;
      let hi = arr.length - 1;
      let ans = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (arr[mid].top <= pos) {
          ans = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      return ans;
    };

    const applyExpandState = (activeToggle, activeEntry) => {
      if (!allExpanded) {
        let changed = false;
        sublists.forEach(({ sub, toggle, hasChildren }) => {
          if (!hasChildren) return;
          const groupId = toggle.dataset.groupKey || "";
          const manual = manualExpanded.has(groupId);
          const isCurrent = !!(activeToggle && toggle === activeToggle);
          const shouldOpen = manual || isCurrent;
          if (sub.classList.contains("is-collapsed") === shouldOpen) changed = true;
          sub.classList.toggle("is-collapsed", !shouldOpen);
          toggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
        });
        if (changed) {
          lockTocAutoScroll(TOC_SUBLIST_TRANSITION_MS);
          window.setTimeout(() => requestAnimationFrame(refreshJumpLinks), TOC_SUBLIST_TRANSITION_MS + 20);
        }
      } else if (activeEntry && activeEntry.hasChildren && activeEntry.sub.classList.contains("is-collapsed")) {
        lockTocAutoScroll(TOC_SUBLIST_TRANSITION_MS);
        activeEntry.sub.classList.remove("is-collapsed");
        activeEntry.toggle.setAttribute("aria-expanded", "true");
        window.setTimeout(() => requestAnimationFrame(refreshJumpLinks), TOC_SUBLIST_TRANSITION_MS + 20);
      }
    };

    let lastCurId = "";
    let lastDecimalId = "";
    let lastActiveToggle = null;
    const active = () => {
      if (!headingTrack.length) return;
      if (rb.scrollHeight !== measuredScrollHeight) recalcHeadingTops();

      const p = rb.scrollTop + anchorOffset;
      const curIdx = findLastAtOrBefore(headingTrack, p);
      const curId = curIdx >= 0 ? headingTrack[curIdx].id : headingTrack[0].id;
      const curEntry = headingMap.get(curId) || null;

      let decimalId = "";
      if (decimalTrack.length && curEntry) {
        const decIdx = findLastAtOrBefore(decimalTrack, p);
        if (decIdx >= 0) {
          const candidateId = decimalTrack[decIdx].id;
          const candidateEntry = headingMap.get(candidateId);
          if (candidateEntry && candidateEntry.toggle === curEntry.toggle) {
            decimalId = candidateId;
          }
        }
      }

      if (lastDecimalId !== decimalId) {
        if (lastDecimalId) {
          const prevDec = headingMap.get(lastDecimalId);
          if (prevDec && prevDec.link) prevDec.link.classList.remove("active");
        }
        if (decimalId) {
          const nextDec = headingMap.get(decimalId);
          if (nextDec && nextDec.link) nextDec.link.classList.add("active");
        }
        lastDecimalId = decimalId;
      }

      if (lastCurId === curId) return;
      lastCurId = curId;

      const nextActiveToggle = curEntry && curEntry.toggle ? curEntry.toggle : null;
      const toggleChanged = nextActiveToggle !== lastActiveToggle;
      if (toggleChanged) {
        if (lastActiveToggle) {
          lastActiveToggle.classList.remove("active");
          lastActiveToggle.classList.remove("is-current-block");
        }
        lastActiveToggle = nextActiveToggle;
        if (lastActiveToggle) {
          lastActiveToggle.classList.add("active");
          lastActiveToggle.classList.add("is-current-block");
        }
      }
      if (toggleChanged) applyExpandState(lastActiveToggle, curEntry);
      if (curEntry) keepEntryVisible(curEntry.link || curEntry.toggle);
    };

    let activeRaf = 0;
    const scheduleActive = () => {
      if (activeRaf) return;
      activeRaf = requestAnimationFrame(() => {
        activeRaf = 0;
        active();
      });
    };

    let chromeRaf = 0;
    const scheduleChrome = () => {
      if (chromeRaf) return;
      chromeRaf = requestAnimationFrame(() => {
        chromeRaf = 0;
        updateReaderChromeMotion();
      });
    };

    rb.addEventListener("scroll", scheduleActive, { passive: true });
    rb.addEventListener("scroll", scheduleChrome, { passive: true });
    window.addEventListener("resize", () => {
      invalidateReaderChromeMetrics();
      setUnifiedTocHeight();
      recalcAnchorOffset();
      recalcHeadingTops();
      scheduleActive();
      syncTocFixedLane();
      syncReaderTableFixedLane();
      syncReaderPeekHandlePosition();
    });
    window.addEventListener("resize", () => {
      invalidateReaderChromeMetrics();
      scheduleChrome();
      syncTocFixedLane();
      syncReaderTableFixedLane();
      syncReaderPeekHandlePosition();
    });
    const syncReaderPanelsAfterLoad = () => {
      invalidateReaderChromeMetrics();
      updateReaderPanelScaleVars();
      updateReaderChromeMotion();
      syncTocFixedLane(true);
      syncReaderTableFixedLane(true);
      syncReaderPeekHandlePosition(true);
    };
    if (!document.body.dataset.readerPanelLoadBound) {
      document.body.dataset.readerPanelLoadBound = "1";
      window.addEventListener("load", () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(syncReaderPanelsAfterLoad);
        });
      }, { once: true });
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
          requestAnimationFrame(syncReaderPanelsAfterLoad);
        }).catch(() => {});
      }
    }
    active();
    updateReaderChromeMotion();
    lockTocAutoScroll(TOC_LAYOUT_TRANSITION_MS + 40);
    if (!document.body.dataset.tocUnlockBound) {
      document.body.dataset.tocUnlockBound = "1";
      document.body.addEventListener("tocautoscrollunlock", () => {
        if (deferredVisibleEl) keepEntryVisible(deferredVisibleEl, true);
      });
    }

    const top = $("#toTop");
    const bot = $("#toBottom");
    const jumpBar = pane.querySelector(".toc-jumps");
    if (top) top.textContent = "Back to Top";
    if (bot) bot.textContent = "Go to Bottom";
    if (bot && jumpBar) jumpBar.prepend(bot);

    let bottomWrap = scrollEl.querySelector(".toc-bottom-jump");
    if (!bottomWrap) {
      bottomWrap = document.createElement("div");
      bottomWrap.className = "toc-bottom-jump";
      scrollEl.appendChild(bottomWrap);
    }
    if (top) bottomWrap.appendChild(top);

    if (top) {
      top.onclick = (e) => {
        e.preventDefault();
        scrollEl.scrollTo({ top: 0, behavior: "smooth" });
      };
    }
    if (bot) {
      bot.onclick = (e) => {
        e.preventDefault();
        const bottomTarget = bottomWrap
          ? Math.max(0, bottomWrap.offsetTop + bottomWrap.offsetHeight - scrollEl.clientHeight)
          : scrollEl.scrollHeight;
        scrollEl.scrollTo({ top: bottomTarget, behavior: "smooth" });
      };
    }

    const updateJumpLinks = () => {
      const overflow = scrollEl.scrollHeight > scrollEl.clientHeight + 4;
      const atTop = scrollEl.scrollTop <= 4;
      if (jumpBar) jumpBar.classList.toggle("is-visible", overflow && atTop);
      if (bottomWrap) bottomWrap.classList.toggle("is-visible", overflow);
      if (top) top.classList.toggle("is-visible", overflow);
      if (bot) bot.classList.toggle("is-visible", overflow);
    };
    refreshJumpLinks = updateJumpLinks;

    scrollEl.addEventListener("scroll", updateJumpLinks, { passive: true });
    window.addEventListener("resize", updateJumpLinks);
    requestAnimationFrame(updateJumpLinks);
    requestAnimationFrame(() => {
      syncTocFixedLane(true);
      syncReaderTableFixedLane(true);
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        syncTocFixedLane(true);
        syncReaderTableFixedLane(true);
      });
    });
  };

  const setupReaderCardMode = () => {
    const cardLink = $("#cardLink");
    const readerHead = $(".reader-head");
    const links = $(".reader-head .links");
    if (!cardLink || !readerHead || !links) return;

    cardLink.href = "#";
    cardLink.dataset.noQuery = "1";
    cardLink.classList.add("cardview-toggle");

    const existingMetaToggle = $("#metaToggle");
    if (existingMetaToggle) existingMetaToggle.remove();

    const setCardToggleLabel = (collapsed) => {
      const action = collapsed ? "Open Quick Jump" : "Close Quick Jump";
      const icon = collapsed ? "arrowleft.svg" : "arrowright.svg";
      cardLink.innerHTML = `<img class="cardview-toggle-icon" src="${iconPath(icon)}" alt="${action}"><span>${action}</span>`;
      cardLink.setAttribute("aria-label", action);
      cardLink.setAttribute("title", action);
    };

    const setCollapsed = (collapsed, options = {}) => {
      const isPhoneReaderSingleCard =
        pageType() === "reader" &&
        document.body &&
        document.body.classList.contains("is-phone");
      if (isPhoneReaderSingleCard) {
        setCardToggleLabel(collapsed);
        setMobilePanel(collapsed ? "reader" : "quickjump");
        requestAnimationFrame(syncReaderPeekHandlePosition);
        return;
      }
      const skipTransition = !!options.skipTransition;
      const isOpeningWithTransition = !collapsed && !skipTransition;
      if (!skipTransition) {
        stageQuickJumpPaneTransition(collapsed ? "closing" : "opening");
        lockTocAutoScroll(TOC_LAYOUT_TRANSITION_MS + TOC_PANE_TRANSITION_MS + 40);
      }
      document.body.classList.toggle("meta-collapsed", collapsed);
      setCardToggleLabel(collapsed);
      // Update split-view reader width
      if (isSplitView()) {
        const vw = window.innerWidth || 0;
        if (!collapsed) {
          const paneWidth = Math.max(180, Math.round(vw * 0.34));
          setSplitReaderFillSide("left");
          scheduleSplitReaderWidth(Math.max(320, vw - paneWidth - 28), 0);
        } else if (!document.body.classList.contains("reader-table-open")) {
          setSplitReaderFillSide("left");
          scheduleSplitReaderWidth(Math.round(vw * 0.98), skipTransition ? 0 : TOC_LAYOUT_TRANSITION_MS + 30);
        }
      }
      const inSplitView = isSplitView();
      const shouldQueueLaneSettle = inSplitView || isOpeningWithTransition;
      const laneSettleDelay = isOpeningWithTransition
        ? (inSplitView ? TOC_GRID_TRANSITION_MS + TOC_PANE_TRANSITION_MS + 40 : TOC_LAYOUT_TRANSITION_MS + 30)
        : TOC_LAYOUT_TRANSITION_MS + 30;
      syncReaderPeekHandlePosition();
      invalidateReaderChromeMetrics();
      updateReaderChromeMotion();
      if (!isOpeningWithTransition) syncTocFixedLane(true);
      syncReaderTableFixedLane(true);
      requestAnimationFrame(updateReaderChromeMotion);
      requestAnimationFrame(syncReaderPeekHandlePosition);
      if (!isOpeningWithTransition) requestAnimationFrame(syncTocFixedLane);
      requestAnimationFrame(syncReaderTableFixedLane);
      if (shouldQueueLaneSettle) {
        window.setTimeout(() => {
          requestAnimationFrame(updateReaderChromeMotion);
          requestAnimationFrame(syncReaderPeekHandlePosition);
          requestAnimationFrame(syncTocFixedLane);
          requestAnimationFrame(syncReaderTableFixedLane);
        }, laneSettleDelay);
      }
      if (inSplitView) {
        if (!isOpeningWithTransition) {
          window.setTimeout(() => requestAnimationFrame(syncReaderPeekHandlePosition), TOC_LAYOUT_TRANSITION_MS + 30);
        } else {
          window.setTimeout(
            () => requestAnimationFrame(syncReaderPeekHandlePosition),
            TOC_GRID_TRANSITION_MS + TOC_PANE_TRANSITION_MS + 40
          );
        }
      }
    };

    const toggle = () => {
      const willCollapse = !document.body.classList.contains("meta-collapsed");
      // In split view, switching from compact chart to quick jump should be a direct
      // side-to-side handoff: hide the chart, move the reader to the right, then
      // let quick jump reveal after the reader slide completes.
      if (!willCollapse && isSplitView() && document.body.classList.contains("reader-table-open")) {
        readerTableSvgSwapPending = false;
        const panel = document.getElementById("readerTablePane");
        if (panel) panel.removeEventListener("transitionend", handleTableTransitionEnd);
        swapCompactChartToJpg();
        document.body.classList.remove("reader-table-open");
        updateReaderTableToggles(false);
        requestAnimationFrame(syncReaderTableFixedLane);
      }
      setCollapsed(willCollapse);
    };

    cardLink.onclick = (e) => {
      e.preventDefault();
      toggle();
    };

    // Default quick jump state:
    // - phone/tablet portrait: reader-first (collapsed)
    // - tablet landscape + desktop: preserve normal split-view behavior
    const isMobilePortrait =
      document.body &&
      document.body.classList.contains("is-mobile") &&
      document.body.classList.contains("is-portrait");
    const isPhone =
      document.body &&
      document.body.classList.contains("is-phone");
    const isTabletLandscape =
      document.body &&
      document.body.classList.contains("is-tablet") &&
      document.body.classList.contains("is-landscape");
    const startCollapsed = (isPhone || isMobilePortrait) ? true : (isSplitView() && !isTabletLandscape);
    setCollapsed(startCollapsed, { skipTransition: true });
  };

  const ensureReaderSearchTools = () => {
    const head = $(".reader-head");
    const links = $(".reader-head .links");
    if (!head || !links) return;

    $$(".reader-head .links #findCount").forEach((el) => el.remove());
    links.classList.add("reader-doc-tools");

    let toggle = $("#searchToggle");
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.type = "button";
      toggle.id = "searchToggle";
      toggle.className = "pill-btn search-toggle-btn";
      toggle.innerHTML = `<img src="${iconPath("magnify.svg")}" alt=""><span>Search</span>`;
    }
    const modeWrap = links.querySelector(".mode-switcher-wrap");
    if (modeWrap) links.insertBefore(toggle, modeWrap);
    else links.appendChild(toggle);

    let panel = $("#readerSearchPanel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "readerSearchPanel";
      panel.className = "reader-search-panel";
      panel.innerHTML =
        '<div class="reader-search-input-wrap">' +
        `<img class="reader-search-input-icon" src="${iconPath("magnify.svg")}" alt="">` +
        '<input class="dock-input" id="findInput" type="search" placeholder="Search this document" aria-label="Search this document">' +
        '<span class="find-count find-count-inline" id="findCount" aria-live="polite">0/0</span>' +
        '<div class="reader-search-inline-nav">' +
        '<button class="dock-btn dock-btn-icon dock-btn-inline" id="findPrevBtn" type="button" aria-label="Previous result" title="Previous result">&#9650;</button>' +
        '<button class="dock-btn dock-btn-icon dock-btn-inline" id="findNextBtn" type="button" aria-label="Next result" title="Next result">&#9660;</button>' +
        '<button class="dock-btn dock-btn-icon dock-btn-inline" id="findClearInputBtn" type="button" aria-label="Clear search text" title="Clear search text">&times;</button>' +
        "</div>" +
        '</div>' +
        '<button class="dock-btn" id="findBtn" type="button">Find</button>' +
        '<button class="dock-btn dock-btn-close" id="clearFindBtn" type="button" aria-label="Close search panel"><span>Close</span></button>';
      head.appendChild(panel);
    }
    const inputWrap = panel.querySelector(".reader-search-input-wrap");
    const deferHideInlineTools = () => {
      if (!inputWrap || !panel) return;
      const token = String(Date.now());
      panel.dataset.hideToolsToken = token;
      window.setTimeout(() => {
        if (!panel || panel.dataset.hideToolsToken !== token) return;
        if (!panel.classList.contains("is-open")) inputWrap.classList.remove("tools-visible");
      }, 190);
    };

    toggle.onclick = () => {
      const open = !panel.classList.contains("is-open");
      closeModeMenus();
      panel.classList.toggle("is-open", open);
      if (open) {
        if (inputWrap) inputWrap.classList.remove("tools-visible");
      } else {
        deferHideInlineTools();
      }
      if (open) {
        const input = $("#findInput");
        if (input) input.focus();
      }
      syncReaderHeaderToolExpansion();
    };
  };

  const scrollReaderToHash = () => {
    const rb = $("#readerBody");
    if (!rb) return false;
    const raw = location.hash ? location.hash.slice(1) : "";
    if (!raw) return false;

    let id = raw;
    try {
      id = decodeURIComponent(raw);
    } catch { }

    const target = document.getElementById(id);
    if (!target) return false;

    scrollReaderToHeading(rb, target, true);
    return true;
  };

  const scrollReaderToJump = () => {
    if (location.hash) return false;
    const rb = $("#readerBody");
    const out = $("#content");
    if (!rb || !out) return false;
    const jump = new URLSearchParams(location.search).get("jump") || "";
    if (!jump.trim()) return false;

    const wanted = cleanHeadingLabel(normalizeMojibake(jump)).toLowerCase();
    if (!wanted) return false;

    const hs = [...out.querySelectorAll("h1,h2,h3,h4")];
    const score = (h) => {
      const label = cleanHeadingLabel(h.textContent || "").toLowerCase();
      if (!label) return -1;
      if (label === wanted) return 3;
      if (label.startsWith(wanted)) return 2;
      if (label.includes(wanted) || wanted.includes(label)) return 1;
      return -1;
    };
    const target = hs
      .map((h) => ({ h, s: score(h) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s)[0];
    if (!target) return false;

    scrollReaderToHeading(rb, target.h, true);
    return true;
  };

  const markByteStreamSketchBlocks = () => {
    const out = $("#content");
    if (!out) return;
    out.querySelectorAll("pre > code").forEach((code) => {
      const text = String(code.textContent || "");
      const isParserLoopSketch =
        text.includes("for each byte b in stream:") &&
        text.includes("param_index(b)") &&
        text.includes("commit_line(cmd=b)") &&
        text.includes("reset_line_state()");
      const isAtomicLineSketch =
        text.includes("72A -> qualifiers=∅") &&
        text.includes("0.0a -> qualifiers=∅") &&
        text.includes("frac_width=1");
      const isFractionWidthParseSketch =
        text.includes("(1) 12.34A") &&
        text.includes("frac_width=2") &&
        text.includes("(3) 1.2A") &&
        text.includes("3.045B");
      const isArithmeticResultsSketch =
        text.includes("For (1) fixed-point at 2 fractional digits:") &&
        text.includes("A + B = 17.40") &&
        text.includes("A mod B = 2.22") &&
        text.includes("A - B = -1.845");
      const isQualityMarkerSketch =
        text.includes("unknown/pending") &&
        text.includes("noisy/unstable") &&
        text.includes("null (no-data)") &&
        text.includes("NaN (invalid result)") &&
        text.includes("sNaN (diagnostic payload code in value1)") &&
        text.includes("stale (orthogonal modifier)") &&
        text.includes("bounds (not hard values)");
      const isParsePipelineSketch =
        text.includes("stream bytes") &&
        text.includes("parse (latch on CMD)") &&
        text.includes("optional transforms") &&
        text.includes("reduce line") &&
        text.includes("typed accessors") &&
        text.includes("policy logic");
      if (!isParserLoopSketch && !isAtomicLineSketch && !isFractionWidthParseSketch && !isArithmeticResultsSketch && !isQualityMarkerSketch && !isParsePipelineSketch) return;
      code.classList.add("byte-stream-sketch-code");
      const pre = code.closest("pre");
      if (pre) pre.classList.add("byte-stream-sketch");
    });
  };

  const shouldExportPreview = () => currentSearchParams().get("preview_export") === "1";
  const previewExportToken = () => currentSearchParams().get("preview_token") || "";
  const postPreviewExport = () => {
    if (!shouldExportPreview() || window === window.parent) return;
    const content = $("#content");
    if (!content) return;
    try {
      window.parent.postMessage({
        type: "codex-preview-export",
        token: previewExportToken(),
        slug: currentReaderSlug(),
        html: content.innerHTML || ""
      }, "*");
    } catch { }
  };

  const initDoc = (isReader) => {
    const hs = render();
    markByteStreamSketchBlocks();
    if (isReader) {
      $$(".reader-meta").forEach((el) => el.remove());
      syncSplitViewClass();
      toc(hs);
      setupReaderCardMode();
      ensureReaderSearchTools();
      ensureReaderTablePanel();
      ensureReaderEndPad();
      ensureReaderHeaderPeekHandle();
      syncReaderModeMenuHost();
      syncReaderToolRow();
      syncReaderHeaderToolExpansion();
      const jumpToInitialPosition = () => {
        if (!scrollReaderToHash()) scrollReaderToJump();
      };
      requestAnimationFrame(() => requestAnimationFrame(jumpToInitialPosition));
      requestAnimationFrame(syncReaderToolRow);
      window.addEventListener("hashchange", () => {
        scrollReaderToHash();
      });
      window.addEventListener("resize", () => {
        invalidateReaderChromeMetrics();
        ensureReaderEndPad();
      });
      window.addEventListener("resize", () => {
        invalidateReaderChromeMetrics();
        syncReaderModeMenuHost();
        syncReaderToolRow();
        syncReaderTableFixedLane();
      });
      window.addEventListener("resize", () => {
        syncSplitViewClass();
        syncReaderModeMenuHost();
        syncReaderToolRow();
        requestAnimationFrame(syncReaderToolRow);
      });
      requestAnimationFrame(updateReaderChromeMotion);
    }

    const q = new URLSearchParams(location.search).get("q") || "";
    const i = $("#findInput");
    const fb = $("#findBtn");
    const fp = $("#findPrevBtn");
    const fn = $("#findNextBtn");
    const fc = $("#findClearInputBtn");
    const cb = $("#clearFindBtn");
    const cn = $("#findCount");
    const out = $("#content");
    const panel = $("#readerSearchPanel");
    const inputWrap = panel ? panel.querySelector(".reader-search-input-wrap") : null;

    const cardLink = $("#cardLink");
    if (cardLink) cardLink.classList.remove("primary");
    if (!out) return;

    let marks = [];
    let activeIndex = -1;
    let lastQuery = "";
    const deferHideInlineTools = () => {
      if (!inputWrap || !panel) return;
      const token = String(Date.now());
      panel.dataset.hideToolsToken = token;
      window.setTimeout(() => {
        if (!panel || panel.dataset.hideToolsToken !== token) return;
        if (!panel.classList.contains("is-open")) inputWrap.classList.remove("tools-visible");
      }, 190);
    };

    const syncCounter = () => {
      if (!cn) return;
      const total = marks.length;
      const current = total > 0 && activeIndex >= 0 ? activeIndex + 1 : 0;
      cn.textContent = `${current}/${total}`;
    };

    const setActiveMark = (index, smooth) => {
      marks.forEach((m, idx) => m.classList.toggle("bh-active", idx === index));
      if (index >= 0 && marks[index]) {
        marks[index].scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "center" });
      }
      syncCounter();
    };

    const runSearch = (value, step = 0) => {
      const qv = String(value || "").trim();

      if (!qv) {
        findMarks(out, "");
        marks = [];
        activeIndex = -1;
        lastQuery = "";
        qLinks("");
        syncCounter();
        return;
      }

      const sameQuery = qv === lastQuery;
      if (!sameQuery) {
        findMarks(out, qv);
        marks = [...out.querySelectorAll("mark.bh")];
        activeIndex = marks.length ? (step < 0 ? marks.length - 1 : 0) : -1;
        lastQuery = qv;
        qLinks(qv);
        setActiveMark(activeIndex, true);
        return;
      }

      if (!marks.length) {
        findMarks(out, qv);
        marks = [...out.querySelectorAll("mark.bh")];
        activeIndex = marks.length ? (step < 0 ? marks.length - 1 : 0) : -1;
        setActiveMark(activeIndex, true);
        return;
      }

      if (step !== 0) {
        activeIndex = (activeIndex + step + marks.length) % marks.length;
      }
      setActiveMark(activeIndex, true);
    };

    const closeSearchAndClear = () => {
      if (i) i.value = "";
      runSearch("", 0);
      if (panel) panel.classList.remove("is-open");
      deferHideInlineTools();
    };

    if (fb) {
      fb.onclick = () => {
        runSearch(i ? i.value : "", 1);
        if (inputWrap && String(i ? i.value : "").trim()) inputWrap.classList.add("tools-visible");
      };
    }
    if (fn) {
      fn.onclick = () => {
        runSearch(i ? i.value : "", 1);
        if (inputWrap && String(i ? i.value : "").trim()) inputWrap.classList.add("tools-visible");
      };
    }
    if (fp) {
      fp.onclick = () => {
        runSearch(i ? i.value : "", -1);
        if (inputWrap && String(i ? i.value : "").trim()) inputWrap.classList.add("tools-visible");
      };
    }
    if (fc) {
      fc.onclick = () => {
        if (i) i.value = "";
        runSearch("", 0);
        if (inputWrap) inputWrap.classList.add("tools-visible");
        if (i) i.focus();
      };
    }
    if (cb) {
      cb.onclick = closeSearchAndClear;
    }
    if (i) {
      i.addEventListener("input", () => {
        runSearch(i.value, 0);
        if (!inputWrap) return;
        if (String(i.value || "").trim()) inputWrap.classList.add("tools-visible");
      });
      i.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === "ArrowDown") {
          e.preventDefault();
          runSearch(i.value, 1);
          if (inputWrap && String(i.value || "").trim()) inputWrap.classList.add("tools-visible");
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          runSearch(i.value, -1);
          if (inputWrap && String(i.value || "").trim()) inputWrap.classList.add("tools-visible");
        }
      });
    }

    if (q) {
      if (i) i.value = q;
      runSearch(q, 0);
    } else {
      qLinks("");
      syncCounter();
    }
    if (shouldExportPreview()) {
      requestAnimationFrame(() => requestAnimationFrame(postPreviewExport));
    }
  };

  const hi = (txt, q) => {
    txt = normalizeMojibake(txt);
    q = String(q || "").trim();
    if (!q) return esc(txt);

    const re = new RegExp(ere(q), "ig");
    let out = "";
    let last = 0;
    let m;
    while ((m = re.exec(txt))) {
      out += esc(txt.slice(last, m.index)) + `<mark class="bh">${esc(m[0])}</mark>`;
      last = m.index + m[0].length;
    }
    return out + esc(txt.slice(last));
  };

  const trimSummary = (txt) => {
    const clean = normalizeMojibake(txt)
      .replace(/\s+/g, " ")
      .replace(/[-]{3,}/g, " ")
      .trim();
    if (!clean) return "No summary available.";
    return clean.length > 180 ? `${clean.slice(0, 177).trim()}...` : clean;
  };

  const snip = (d, q, inMode) => {
    const fallback = DOC_PORTAL_META[d.slug] && DOC_PORTAL_META[d.slug].summary
      ? DOC_PORTAL_META[d.slug].summary
      : trimSummary(d.description || d.corpus_text || "");

    const corpus = normalizeMojibake(d.corpus_text || "");
    q = String(q || "").trim();
    if (!inMode || !q) return fallback;

    const idx = corpus.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return fallback;

    const s = Math.max(0, idx - 90);
    const e = Math.min(corpus.length, idx + q.length + 130);
    let x = corpus.slice(s, e).trim();
    if (s > 0) x = `...${x}`;
    if (e < corpus.length) x = `${x}...`;
    return x;
  };

  const portalMeta = (d) => {
    const meta = DOC_PORTAL_META[d.slug] || {};
    const summary = meta.summary || trimSummary(d.description || d.corpus_text || "");
    const subheaders = Array.isArray(meta.subheaders) ? meta.subheaders.slice(0, 3) : [];
    return { summary, subheaders, preview: cleanPortalMetaLabel(d.preview_title || "") };
  };

  const extractVersion = (d) => {
    const slug = String(d.slug || "");
    if (slug === "telemetry-guide") return "";

    const fromTitle = normalizeMojibake(`${d.display_title || ""} ${d.preview_title || ""}`);
    let match = fromTitle.match(/\bv\d+(?:\.\d+){0,2}\b/i);
    if (match) return match[0].toLowerCase();

    match = slug.match(/-v(\d+(?:[.-]\d+)*)$/i);
    if (match) return `v${match[1].replace(/-/g, ".")}`;

    return DOC_CARD_VERSION_OVERRIDES[slug] || "";
  };

  const subtopicHref = (d, sub, rawQuery) => {
    const params = new URLSearchParams();
    if (rawQuery) params.set("q", rawQuery);
    if (sub) params.set("jump", sub);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const anchor = SUBTOPIC_ANCHORS[d.slug] && SUBTOPIC_ANCHORS[d.slug][sub]
      ? `#${SUBTOPIC_ANCHORS[d.slug][sub]}`
      : "";
    return `${readerFileForSlug(d.slug)}${suffix}${anchor}`;
  };

  const hub = () => {
    const ds = (Array.isArray(window.__DOCS_DATA__) ? window.__DOCS_DATA__ : [])
      .map((d) => ({
        ...d,
        display_title: normalizeMojibake(d.display_title || ""),
        preview_title: normalizeMojibake(d.preview_title || ""),
        description: normalizeMojibake(d.description || ""),
        corpus_text: normalizeMojibake(d.corpus_text || "")
      }))
      .filter((d) => !EXCLUDED_DOC_SLUGS.has(String(d.slug || "")));
    const i = $("#docSearch");
    const box = $("#docCards");
    const m = $("#searchMeta");
    if (m) m.remove();
    if (!i || !box) return;

    const ok = (d, q) => {
      if (!q) return true;
      return String(d.corpus_text || "").toLowerCase().includes(q);
    };

    const paint = () => {
      const raw = i.value.trim();
      const q = raw.toLowerCase();
      const rs = ds.filter((d) => ok(d, q));

      if (!rs.length) {
        box.innerHTML = '<p class="search-empty">No matches found.</p>';
      } else {
        box.innerHTML = rs
          .map((d) => {
            const suffix = raw ? `?q=${encodeURIComponent(raw)}` : "";
            const meta = portalMeta(d);
            const detail = raw ? snip(d, raw, true) : meta.summary;
            const titleLabel = cleanMenuTitle(d.display_title);
            const chips = meta.subheaders
              .map(
                (s) =>
                  `<a class="sub-pill sub-pill-link" href="${subtopicHref(d, s, raw)}">${esc(s)}</a>`
              )
              .join("");
            const readerHref = `${readerFileForSlug(d.slug)}${suffix}`;
            const version = extractVersion(d);

            return `<article class="doc-card doc-card-click" data-href="${readerHref}" tabindex="0" role="link" aria-label="Open ${esc(
              titleLabel
            )}"><div class="doc-card-main"><p class="title">${esc(titleLabel)}</p><div class="meta">${esc(
              meta.preview || d.display_title
            )}</div></div>${chips ? `<div class="subheaders">${chips}</div>` : ""
              }<p class="desc">${hi(detail, raw)}</p>${version ? `<span class="doc-card-version">${esc(version)}</span>` : ""
              }</article>`;
          })
          .join("");

        box.querySelectorAll(".doc-card-click").forEach((card) => {
          const open = () => {
            const href = card.dataset.href;
            if (href) location.href = href;
          };

          card.addEventListener("click", (e) => {
            if (e.target.closest("a,button,input,label")) return;
            open();
          });

          card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              open();
            }
          });
        });
      }
    };

    i.addEventListener("input", paint);
    paint();
  };

  normalizeHeader();
  normalizeDocMeta();
  normalizeHubSearchLayout();
  ensureDocumentationButton();
  forceReaderFooterLinks();
  initTheme();

  // ── Mobile Detection & State Management ──────────────────────────────────
  // Detects phone/tablet via pointer:coarse + viewport dimensions.
  // Sets body classes: is-mobile, is-phone/is-tablet, is-portrait/is-landscape.
  // Sets data-mobile-mode and data-mobile-panel attributes.
  // Desktop remains completely unaffected (no coarse pointer = desktop).

  const MOBILE_PHONE_NARROW_MAX = 480;

  const _mob = { mode: "desktop", panel: "reader", hubSearchToggle: false, transitionTimer: 0 };

  const detectMobileMode = () => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (!coarse) return "desktop";
    const w = window.innerWidth || 0;
    const h = window.innerHeight || 0;
    const narrow = Math.min(w, h);
    const portrait = h >= w;
    if (narrow <= MOBILE_PHONE_NARROW_MAX) {
      return portrait ? "phone-portrait" : "phone-landscape";
    }
    return portrait ? "tablet-portrait" : "tablet-landscape";
  };

  const applyMobileMode = () => {
    const b = document.body;
    if (!b) return;
    const mode = detectMobileMode();
    const prev = _mob.mode;
    _mob.mode = mode;
    const isPhone = mode.startsWith("phone");
    const isTablet = mode.startsWith("tablet");
    const isMobile = isPhone || isTablet;
    b.dataset.mobileMode = mode;
    b.classList.toggle("is-mobile", isMobile);
    b.classList.toggle("is-phone", isPhone);
    b.classList.toggle("is-tablet", isTablet);
    b.classList.toggle("is-portrait", mode.endsWith("portrait"));
    b.classList.toggle("is-landscape", isMobile && !mode.endsWith("portrait"));
    const readerPage = pageType() === "reader";
    // Remove first-pass mobile bottom rail if present.
    const legacyRail = document.getElementById("mobileNavRail");
    if (legacyRail) legacyRail.remove();
    // Phone reader pages: enforce one-card model, reader-first.
    if (isPhone && readerPage) {
      if (!b.dataset.mobilePanel) setMobilePanel("reader", { immediate: true });
      injectMobileCloseButtons();
    }
    // Tablet portrait reader: start focused on full-width reader.
    if (isTablet && mode === "tablet-portrait" && readerPage) {
      b.classList.add("meta-collapsed");
      b.classList.remove("reader-table-open");
    }
    // Non-phone reader: clear phone-only active-card state.
    if ((!isPhone || !readerPage) && b.dataset.mobilePanel) {
      delete b.dataset.mobilePanel;
      delete b.dataset.mobilePanelPrev;
      b.classList.remove("mobile-panel-transition");
      _mob.panel = "reader";
    }
    // On phone hub pages, inject search toggle if needed
    if (isPhone && pageType() === "hub" && !_mob.hubSearchToggle) {
      injectMobileHubSearchToggle();
    }
    // Leaving mobile: clean up panel state
    if (!isMobile && prev !== "desktop") {
      delete b.dataset.mobilePanel;
      delete b.dataset.mobilePanelPrev;
      b.classList.remove("meta-collapsed");
      b.classList.remove("mobile-panel-transition");
    }
    // Tablet landscape reader: allow split view behavior
    if (mode === "tablet-landscape" && pageType() === "reader") {
      if (prev !== "tablet-landscape") {
        b.classList.remove("reader-table-open");
        b.classList.remove("meta-collapsed");
        syncQuickJumpButtonLabel();
      }
      syncSplitViewClass();
    }
    // Phone and tablet portrait: disable split view (mobile CSS handles layout)
    if (isPhone || (isTablet && mode.endsWith("portrait"))) {
      b.classList.remove("codex-split-view");
    }
  };

  const setMobilePanel = (panel, options = {}) => {
    const b = document.body;
    if (!b || pageType() !== "reader") return;
    const next = panel === "quickjump" || panel === "table" ? panel : "reader";
    const prev = b.dataset.mobilePanel || _mob.panel || "reader";
    const immediate = !!options.immediate;
    const phoneReaderSingleCard = b.classList.contains("is-phone");
    _mob.panel = next;
    b.dataset.mobilePanel = next;
    if (phoneReaderSingleCard && prev !== next && !immediate) {
      b.dataset.mobilePanelPrev = prev;
      b.classList.add("mobile-panel-transition");
      clearTimeout(_mob.transitionTimer);
      _mob.transitionTimer = window.setTimeout(() => {
        if (!document.body) return;
        delete document.body.dataset.mobilePanelPrev;
        document.body.classList.remove("mobile-panel-transition");
      }, 380);
    } else if (!phoneReaderSingleCard || immediate) {
      delete b.dataset.mobilePanelPrev;
      b.classList.remove("mobile-panel-transition");
    }
    // Sync TOC collapsed state — quickjump opens TOC, all others collapse it
    b.classList.toggle("meta-collapsed", next !== "quickjump");
    // Sync table state — properly toggle on/off when switching panels
    b.classList.toggle("reader-table-open", next === "table");
    updateReaderTableToggles(next === "table");
    syncQuickJumpButtonLabel();
    const searchPanel = document.getElementById("readerSearchPanel");
    if (searchPanel && next !== "reader") searchPanel.classList.remove("is-open");
  };

  const injectMobileCloseButtons = () => {
    // Close button for TOC/Quick Jump pane
    const tocPane = document.querySelector(".toc-pane");
    if (tocPane && !tocPane.querySelector(".mobile-panel-close")) {
      const btn = document.createElement("button");
      btn.className = "mobile-panel-close";
      btn.type = "button";
      btn.setAttribute("aria-label", "Close quick jump");
      btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        setMobilePanel("reader");
      });
      // Insert at the beginning of toc-scroll or toc-head
      const tocHead = tocPane.querySelector(".toc-head");
      if (tocHead) {
        tocHead.appendChild(btn);
      } else {
        tocPane.insertBefore(btn, tocPane.firstChild);
      }
    }
    // Close button for table pane
    const tablePane = document.getElementById("readerTablePane") || document.querySelector(".reader-table-pane");
    if (tablePane && !tablePane.querySelector(".mobile-panel-close")) {
      const btn = document.createElement("button");
      btn.className = "mobile-panel-close";
      btn.type = "button";
      btn.setAttribute("aria-label", "Close chart");
      btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        setMobilePanel("reader");
      });
      tablePane.insertBefore(btn, tablePane.firstChild);
    }
  };

  const injectMobileHubSearchToggle = () => {
    _mob.hubSearchToggle = true;
    const heroCard = document.querySelector(".card") || document.querySelector(".codex-hero-card");
    if (!heroCard) return;
    // Create floating search toggle
    const toggle = document.createElement("button");
    toggle.id = "mobileSearchToggle";
    toggle.className = "mobile-search-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "Search documentation");
    toggle.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    toggle.addEventListener("click", () => {
      document.body.classList.toggle("mobile-hub-search-open");
      const input = document.querySelector("#docSearch") || document.querySelector(".dock-input");
      if (document.body.classList.contains("mobile-hub-search-open") && input) {
        requestAnimationFrame(() => input.focus());
      }
    });
    document.body.appendChild(toggle);
    // Close search overlay when pressing escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("mobile-hub-search-open")) {
        document.body.classList.remove("mobile-hub-search-open");
      }
    });
  };

  // Initial detection
  applyMobileMode();
  // Re-detect on resize / orientation change
  window.addEventListener("resize", applyMobileMode);
  if (screen.orientation) {
    screen.orientation.addEventListener("change", () => {
      requestAnimationFrame(applyMobileMode);
    });
  }

  // ── Glass Mode State Management ──────────────────────────────────────────────
  // Activated exclusively by the TUI via a `bcode:glass-mode` custom event.
  // Persisted to sessionStorage so glass survives page navigation within the
  // same browser session, but requires TUI re-activation in new sessions.
  // Sets `data-glass-mode="on"` on <body> and layers glass CSS variables
  // on top of the active theme.

  const GLASS_STORAGE_KEY = "bcode-glass-mode";

  const setGlassMode = (enabled) => {
    const b = document.body;
    if (!b) return;
    if (enabled) {
      b.dataset.glassMode = "on";
      try { sessionStorage.setItem(GLASS_STORAGE_KEY, "1"); } catch {}
    } else {
      delete b.dataset.glassMode;
      try { sessionStorage.removeItem(GLASS_STORAGE_KEY); } catch {}
    }
  };

  // Listen for TUI command
  window.addEventListener("bcode:glass-mode", (e) => {
    setGlassMode(!!e.detail?.enabled);
  });

  // Restore glass mode from session (only if previously activated by TUI in this session)
  try {
    if (sessionStorage.getItem(GLASS_STORAGE_KEY) === "1") {
      setGlassMode(true);
    }
  } catch {}

  const t = pageType();
  if (t === "hub") hub();
  else if (t === "doc") initDoc(false);
  else if (t === "reader") initDoc(true);
})();
