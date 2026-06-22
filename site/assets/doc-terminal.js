/**
 * doc-terminal.js — BCODe α terminal panel for documentation reader pages.
 *
 * Injects a full multi-pane terminal (matching term/terminal.html structure)
 * as a slide-up panel anchored to the reader content column width.
 * Uses SABParser + BCODe for real parse/compose; dispatches bcode:lava-params
 * to modulate the lava lamp simulation.
 *
 * Import paths are relative to assets/ → ../term/ for parser modules.
 */

import { SABParser, bcode_sab_state_name, bcode_sab_parse_error_name }
  from "../term/bcode_sab.js";
import BCODe from "../term/bcode.mjs";

// ── Guard: reader pages only ─────────────────────────────────────────────────

if (!document.querySelector(".reader-head")) {
  throw new Error("doc-terminal: not a reader page, aborting.");
}

// ── Guide content (mirrors app.js) ───────────────────────────────────────────

const GUIDE_QUERY_COMMANDS = [
  { cmd: "Vq", desc: "query average absolute blob velocity" },
  { cmd: "Rq", desc: "query average blob radius" },
];

const GUIDE_PRIMARY_COMMANDS = [
  { cmd: "s", desc: "latches the line with the set command." },
  { cmd: "q", desc: "queries the current lava-lamp state." },
  { cmd: "r", desc: "reset configurable values" },
  { cmd: "c", desc: "clear all loaded blobs" },
  { cmd: "p", desc: "pause/unpause the simulation" },
];

const GUIDE_GLASS_COMMANDS = [
  { cmd: "1g", desc: "enable glass rendering mode" },
  { cmd: "0g", desc: "disable glass rendering mode" },
];

const GUIDE_CONTROL_COMMANDS = [
  { cmd: "Rr", desc: "reset radius variation" },
  { cmd: "Br", desc: "reset blob-count bounds" },
];

// ── Seeded history / feed ────────────────────────────────────────────────────

const SEEDED_HISTORY = [
  { cmd: "1.0Rs", output: "1.0R^s" },
  { cmd: "1.0Vs", output: "1.0V^s" },
  { cmd: ">14Bs", output: ">14B^s" },
  { cmd: "<24Bs", output: "<24B^s" },
  { cmd: "1.0Fs", output: "1.0F^s" },
];

const SEEDED_FEED = [
  "20B 1V 6R 0.0u",
  "20B 0.99V 6R 0.1u",
  "19B 1.02V 6.1R 0.2u",
  "!19B 0.98V 6R 0.3u",
  "20B 1V 6R 0.4u",
  "21B 1.03V 5.9R 0.5u",
];

// ── Runtime state ────────────────────────────────────────────────────────────

const state = {
  view:        "home",
  historyOpen: false,
  homeHistory: [...SEEDED_HISTORY],
  reqresp:     [...SEEDED_HISTORY],
  feed:        SEEDED_FEED.map((line, index) => ({ seq: index + 1, line })),
  feedSequence: SEEDED_FEED.length,
  guideCommand: ">14Bs",
  guideParsed: null,
  live: { text: "", latched: false, stateName: "normal", errors: [] },
};

const SIM_DEFAULTS = {
  blobs: 20,
  minBlobs: 14,
  maxBlobs: 24,
  radiusSpread: 1.0,
  velocitySpread: 1.0,
  blobForce: 1.0,
  averageVelocity: 1.0,
  averageRadius: 6.0,
  glass: document.body?.dataset.glassMode === "on",
  paused: false,
  cleared: false,
  tick: 0.5,
};

const sim = Object.assign({}, SIM_DEFAULTS);

let feedTimer = null;

// ── Panel HTML ────────────────────────────────────────────────────────────────

function buildPanelHTML() {
  return `
<div id="doc-terminal-overlay" aria-hidden="false">
  <div id="doc-terminal-panel" role="complementary" aria-label="BCODe alpha terminal">
    <header id="dt-tab-bar">
      <div id="dt-tab-strip" role="tablist" aria-label="Views">
        <button type="button" class="dt-tab dt-active" data-dtview="home"
                role="tab" aria-selected="true">&#x2302; Home</button>
        <button type="button" class="dt-tab" data-dtview="terminal"
                role="tab" aria-selected="false">Terminal</button>
      </div>
      <div id="dt-title-area">
        <div id="dt-menu-wrap">
          <button type="button" id="dt-menu-btn"
                  aria-haspopup="true" aria-expanded="false">BCODe &#x03b1; &#x25be;</button>
          <div id="dt-menu-drop" role="menu" aria-hidden="true">
            <button type="button" class="dt-menu-item" data-action="reset"
                    role="menuitem">Parser reset - DEL</button>
            <button type="button" class="dt-menu-item" data-action="clear"
                    role="menuitem">Clear feed</button>
          </div>
        </div>
        <button type="button" id="dt-close-btn" aria-label="Close terminal">&#x2715;</button>
      </div>
    </header>

    <section id="dt-main-area">

      <section id="dt-home-view" class="dt-view dt-active" aria-label="Home view">
        <div class="dt-panes-row">
          <section class="dt-pane" aria-label="docs guide">
            <div class="dt-pane-label"> docs / guide </div>
            <div class="dt-pane-body" id="dt-docs-body"></div>
            <div class="dt-pane-foot">docs / guide</div>
          </section>
          <section class="dt-pane" aria-label="state feed">
            <div class="dt-pane-label">state feed</div>
            <div class="dt-pane-body" id="dt-state-body"></div>
            <div class="dt-pane-foot">state feed</div>
          </section>
        </div>
      </section>

      <section id="dt-terminal-view" class="dt-view" aria-label="Terminal view">
        <div class="dt-panes-row">
          <section class="dt-pane" aria-label="request response channel">
            <div class="dt-pane-label">request/response channel</div>
            <div class="dt-pane-body" id="dt-reqresp-body"></div>
            <div class="dt-pane-foot">request/response channel</div>
          </section>
          <section class="dt-pane" aria-label="unsolicited feed">
            <div class="dt-pane-label">unsolicited feed</div>
            <div class="dt-pane-body" id="dt-feed-body"></div>
            <div class="dt-pane-foot">unsolicited feed</div>
          </section>
        </div>
      </section>

      <section id="dt-history-panel" class="dt-hidden" aria-label="command output history">
        <div class="dt-history-label"> command / output history </div>
        <div id="dt-history-body"></div>
      </section>

    </section>

    <footer id="dt-command-bar">
      <div id="dt-cmd-box">
        <button type="button" id="dt-prompt" aria-label="Toggle history">[&gt;]</button>
        <div id="dt-input-wrap">
          <div id="dt-input-hl" aria-hidden="true"></div>
          <input id="dt-cmd-input" type="text" spellcheck="false"
                 autocomplete="off" autocapitalize="off"
                 aria-label="BCODe command input">
        </div>
      </div>
      <button type="button" id="dt-send-btn" aria-label="Send command">&#x2192;</button>
    </footer>
  </div>
  ${buildToggleBtnHTML()}
</div>`;
}

function buildToggleBtnHTML() {
  return `<button type="button" id="dt-toggle-btn" class="mode-switcher pill-btn"
    aria-pressed="false" aria-label="Toggle BCODe terminal">
  <img class="mode-switcher-icon" src="../assets/terminal.svg" alt="" aria-hidden="true">
</button>`;
}

// ── Inject HTML ───────────────────────────────────────────────────────────────

document.body.insertAdjacentHTML("beforeend", buildPanelHTML());

// ── DOM refs ──────────────────────────────────────────────────────────────────

const D = {
  panel:       document.getElementById("doc-terminal-panel"),
  toggleBtn:   document.getElementById("dt-toggle-btn"),
  tabs:        [...document.querySelectorAll(".dt-tab")],
  homeView:    document.getElementById("dt-home-view"),
  termView:    document.getElementById("dt-terminal-view"),
  docsBody:    document.getElementById("dt-docs-body"),
  stateBody:   document.getElementById("dt-state-body"),
  reqrespBody: document.getElementById("dt-reqresp-body"),
  feedBody:    document.getElementById("dt-feed-body"),
  historyPanel:document.getElementById("dt-history-panel"),
  historyBody: document.getElementById("dt-history-body"),
  prompt:      document.getElementById("dt-prompt"),
  sendBtn:     document.getElementById("dt-send-btn"),
  cmdInput:    document.getElementById("dt-cmd-input"),
  inputHl:     document.getElementById("dt-input-hl"),
  cmdBox:      document.getElementById("dt-cmd-box"),
  menuWrap:    document.getElementById("dt-menu-wrap"),
  menuBtn:     document.getElementById("dt-menu-btn"),
  menuDrop:    document.getElementById("dt-menu-drop"),
  closeBtn:    document.getElementById("dt-close-btn"),
};

// ── Panel open/close ──────────────────────────────────────────────────────────

let panelOpen = false;

function isMobileReaderView() {
  return !!document.body &&
    (document.body.classList.contains("is-mobile") ||
      (window.matchMedia("(pointer: coarse)").matches && window.innerWidth <= 1120));
}

function focusCommandInput() {
  if (isMobileReaderView()) return;
  try {
    D.cmdInput.focus({ preventScroll: true });
  } catch {
    D.cmdInput.focus();
  }
}

function resetMobileDocumentScroll() {
  if (!isMobileReaderView()) return;
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function openPanel() {
  panelOpen = true;
  resetMobileDocumentScroll();
  document.body?.classList.add("doc-terminal-open");
  D.panel.classList.add("dt-open");
  D.toggleBtn?.setAttribute("aria-pressed", "true");
  D.toggleBtn?.classList.add("is-active");
  if (!feedTimer) feedTimer = setInterval(tickFeed, 2800);
  setTimeout(() => {
    resetMobileDocumentScroll();
    focusCommandInput();
  }, 60);
}

function closePanel() {
  panelOpen = false;
  document.body?.classList.remove("doc-terminal-open");
  D.panel.classList.remove("dt-open");
  D.toggleBtn?.setAttribute("aria-pressed", "false");
  D.toggleBtn?.classList.remove("is-active");
  closeMenu();
  clearInterval(feedTimer);
  feedTimer = null;
}

D.toggleBtn?.addEventListener("click", () => panelOpen ? closePanel() : openPanel());
D.closeBtn.addEventListener("click", closePanel);
window.addEventListener("bcode:doc-terminal-close", closePanel);

// ── Width/position tracking ───────────────────────────────────────────────────

function pxNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function controlClusterGap() {
  const lavaToggle = document.querySelector(".reader-head .lava-toggle");
  const tableToggle = document.querySelector(".reader-head .reader-table-toggle");
  if (lavaToggle && tableToggle) {
    const lavaRect = lavaToggle.getBoundingClientRect();
    const tableRect = tableToggle.getBoundingClientRect();
    const gap = tableRect.left - lavaRect.right;
    if (Number.isFinite(gap) && gap > 0) return gap;
  }
  const header = document.querySelector(".reader-head");
  if (header) {
    const headerStyle = getComputedStyle(header);
    const inlineGap = pxNumber(headerStyle.getPropertyValue("--reader-tool-gap-inline"), NaN);
    if (Number.isFinite(inlineGap)) return inlineGap;
  }
  return 8;
}

function headerButtonBottomInset() {
  const header = document.querySelector(".reader-head");
  if (!header) return 12;
  const mobilePaddingInset = pxNumber(getComputedStyle(header).paddingBottom, NaN);
  if (document.body.classList.contains("is-mobile") && Number.isFinite(mobilePaddingInset)) {
    return mobilePaddingInset;
  }
  const headerRect = header.getBoundingClientRect();
  const candidates = header.querySelectorAll(
    "button, .pill, .pill-btn, .mode-switcher, .lava-toggle, .reader-table-toggle"
  );
  let minInset = Infinity;
  candidates.forEach((b) => {
    const r = b.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    const inset = headerRect.bottom - r.bottom;
    if (Number.isFinite(inset) && inset >= 0 && inset < minInset) minInset = inset;
  });
  return Number.isFinite(minInset) ? minInset : 12;
}

const MOBILE_ICON_RATIO = 20 / 34;
let lastMobileFloatingButtonSize = 0;
let lastMobileFloatingButtonGap = 0;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function positionPanel() {
  const reader = document.querySelector(".reader") ||
                 document.querySelector(".reader-body") ||
                 document.querySelector(".container");
  const readerBody = document.querySelector("#readerBody") ||
                     document.querySelector(".reader-body") ||
                     reader;
  const content = document.querySelector("#content") ||
                  readerBody?.querySelector(".markdown-body") ||
                  reader;
  if (!reader || !readerBody || !content) return;

  const readerRect = reader.getBoundingClientRect();
  const readerBodyRect = readerBody.getBoundingClientRect();
  const contentRect = content.getBoundingClientRect();
  const splitView = document.body.classList.contains("codex-split-view");
  const dtStyle = getComputedStyle(document.documentElement);
  const lineHeight = pxNumber(dtStyle.getPropertyValue("--dt-rh"), 19);
  const panelTopOffset = 5;
  const naturalHeight = Math.min(
    Math.round(lineHeight * 22),
    Math.round(window.innerHeight * 0.58)
  );
  const availableHeight = Math.max(180, Math.round(window.innerHeight - 24));
  const panelHeight = clamp(naturalHeight - panelTopOffset, 175, availableHeight);

  D.panel.style.left = `${Math.round(readerRect.left)}px`;
  D.panel.style.width = `${Math.round(readerRect.width)}px`;
  D.panel.style.bottom = "0px";
  D.panel.style.height = `${Math.round(panelHeight)}px`;

  const isMobile = document.body.classList.contains("is-mobile");
  const icon = D.toggleBtn?.querySelector(".mode-switcher-icon");

  const cardLink = document.querySelector("#cardLink");
  const tableCloseBtn = document.getElementById("readerTableMobileClose");

  if (isMobile && D.toggleBtn) {
    const gap = controlClusterGap();
    const headerInset = headerButtonBottomInset();
    const viewportRight = window.innerWidth || document.documentElement.clientWidth || readerBodyRect.right;
    let anchorRight = readerBodyRect.right;
    let marginWidth = Math.max(0, viewportRight - anchorRight);
    const contentMarginWidth = Math.max(0, viewportRight - contentRect.right);
    const minMobileButtonSize = 18;
    if (marginWidth < gap * 2 + minMobileButtonSize && contentMarginWidth > marginWidth) {
      anchorRight = contentRect.right;
      marginWidth = contentMarginWidth;
    }
    const rawButtonSize = marginWidth - 2 * gap;
    let horizontalGap = gap;
    let computedButtonSize = Math.round(rawButtonSize);
    if (computedButtonSize < minMobileButtonSize) {
      computedButtonSize = Math.max(12, Math.round(Math.min(minMobileButtonSize, marginWidth)));
      horizontalGap = Math.max(0, (marginWidth - computedButtonSize) / 2);
    }
    const mobilePanel = document.body.dataset.mobilePanel || "reader";
    if (mobilePanel === "reader" && computedButtonSize > 0) {
      lastMobileFloatingButtonSize = computedButtonSize;
      lastMobileFloatingButtonGap = horizontalGap;
    }
    const buttonSize = mobilePanel === "reader" || !lastMobileFloatingButtonSize
      ? computedButtonSize
      : lastMobileFloatingButtonSize;
    horizontalGap = mobilePanel === "reader" || !lastMobileFloatingButtonGap
      ? horizontalGap
      : lastMobileFloatingButtonGap;
    const iconSize = Math.max(8, Math.round(buttonSize * MOBILE_ICON_RATIO));
    const toggleCenterX = anchorRight + horizontalGap + buttonSize / 2;

    // Force a square past the mobile .pill-btn overrides (min-height: 40px,
    // padding: 0 12px) which would otherwise stretch height and eat width.
    D.toggleBtn.style.position = "fixed";
    D.toggleBtn.style.width = `${buttonSize}px`;
    D.toggleBtn.style.height = `${buttonSize}px`;
    D.toggleBtn.style.minWidth = "0";
    D.toggleBtn.style.minHeight = "0";
    D.toggleBtn.style.padding = "0";
    D.toggleBtn.style.display = "inline-flex";
    D.toggleBtn.style.alignItems = "center";
    D.toggleBtn.style.justifyContent = "center";
    if (icon) {
      icon.style.width = `${iconSize}px`;
      icon.style.height = `${iconSize}px`;
      icon.style.display = "block";
      icon.style.objectFit = "contain";
    }
    D.toggleBtn.style.left = `${toggleCenterX.toFixed(2)}px`;
    D.toggleBtn.style.bottom = `${Math.round(headerInset)}px`;

    // Mirror cardLink to the left margin, across the viewport centerline.
    if (cardLink) {
      // Move out of .reader-head to escape its overflow: clip and any
      // ancestor that might create a containing block for fixed positioning.
      if (cardLink.parentElement !== document.body) {
        cardLink.dataset.dtMobileMoved = "1";
        document.body.appendChild(cardLink);
      }
      const cardLeft = Math.max(0, horizontalGap);
      // Use setProperty with !important to defeat any conflicting CSS rules.
      const setImp = (prop, val) => cardLink.style.setProperty(prop, val, "important");
      setImp("position", "fixed");
      setImp("left", `${cardLeft.toFixed(2)}px`);
      setImp("right", "auto");
      setImp("top", "auto");
      setImp("bottom", `${Math.round(headerInset)}px`);
      setImp("width", `${buttonSize}px`);
      setImp("height", `${buttonSize}px`);
      setImp("min-width", "0");
      setImp("min-height", "0");
      setImp("max-width", "none");
      setImp("max-height", "none");
      setImp("padding", "0");
      setImp("margin", "0");
      setImp("transform", "none");
      setImp("z-index", "12");
      setImp("display", "inline-flex");
      setImp("align-items", "center");
      setImp("justify-content", "center");
      setImp("gap", "0");
      const cardImg = cardLink.querySelector("img.cardview-toggle-icon");
      if (cardImg) {
        cardImg.style.setProperty("width", `${iconSize}px`, "important");
        cardImg.style.setProperty("height", `${iconSize}px`, "important");
        cardImg.style.setProperty("display", "block", "important");
      }
      const cardSpan = cardLink.querySelector("span");
      if (cardSpan) cardSpan.style.setProperty("display", "none", "important");
    }

    // Mirror reader-table close button vertically: same horizontal slot as the
    // terminal toggle, but at the top of the viewport instead of the bottom.
    if (tableCloseBtn) {
      if (tableCloseBtn.parentElement !== document.body) {
        tableCloseBtn.dataset.dtMobileMoved = "1";
        document.body.appendChild(tableCloseBtn);
      }
      const setCloseImp = (prop, val) =>
        tableCloseBtn.style.setProperty(prop, val, "important");
      setCloseImp("position", "fixed");
      setCloseImp("top", `${Math.round(headerInset)}px`);
      setCloseImp("right", `${Math.round(gap)}px`);
      setCloseImp("left", "auto");
      setCloseImp("bottom", "auto");
      setCloseImp("width", `${buttonSize}px`);
      setCloseImp("height", `${buttonSize}px`);
      setCloseImp("min-width", "0");
      setCloseImp("min-height", "0");
      setCloseImp("max-width", "none");
      setCloseImp("max-height", "none");
      setCloseImp("padding", "0");
      setCloseImp("margin", "0");
      setCloseImp("transform", "none");
      setCloseImp("z-index", "12");
      setCloseImp("display", "inline-flex");
      setCloseImp("align-items", "center");
      setCloseImp("justify-content", "center");
      // Border/border-radius/background/box-sizing intentionally left to CSS so
      // glass-mode rules can override (inline !important would beat them).
      const closeSvg = tableCloseBtn.querySelector("svg");
      if (closeSvg) {
        closeSvg.style.setProperty("width", `${iconSize}px`, "important");
        closeSvg.style.setProperty("height", `${iconSize}px`, "important");
      }
    }

    D.panel.classList.add("dt-positioned");
    return;
  }

  if (D.toggleBtn) {
    D.toggleBtn.style.position = "";
    D.toggleBtn.style.width = "";
    D.toggleBtn.style.height = "";
    D.toggleBtn.style.minWidth = "";
    D.toggleBtn.style.minHeight = "";
    D.toggleBtn.style.padding = "";
    D.toggleBtn.style.display = "";
    D.toggleBtn.style.alignItems = "";
    D.toggleBtn.style.justifyContent = "";
  }
  if (icon) {
    icon.style.width = "";
    icon.style.height = "";
    icon.style.display = "";
    icon.style.objectFit = "";
  }
  if (cardLink) {
    // Restore to original parent (.reader-head .links) if we moved it.
    if (cardLink.dataset.dtMobileMoved === "1") {
      const links = document.querySelector(".reader-head .links");
      if (links) links.insertBefore(cardLink, links.firstChild);
      delete cardLink.dataset.dtMobileMoved;
    }
    [
      "position", "left", "right", "top", "bottom",
      "width", "height", "min-width", "min-height", "max-width", "max-height",
      "padding", "margin", "transform", "z-index",
      "display", "align-items", "justify-content", "gap",
      "opacity", "visibility", "pointer-events",
    ].forEach((p) => cardLink.style.removeProperty(p));
    const cardImg = cardLink.querySelector("img.cardview-toggle-icon");
    if (cardImg) {
      cardImg.style.removeProperty("width");
      cardImg.style.removeProperty("height");
      cardImg.style.removeProperty("display");
    }
    const cardSpan = cardLink.querySelector("span");
    if (cardSpan) cardSpan.style.removeProperty("display");
  }
  if (tableCloseBtn) {
    if (tableCloseBtn.dataset.dtMobileMoved === "1") {
      const tableHead = document.querySelector(".reader-table-head");
      if (tableHead) tableHead.appendChild(tableCloseBtn);
      delete tableCloseBtn.dataset.dtMobileMoved;
    }
    [
      "position", "left", "right", "top", "bottom",
      "width", "height", "min-width", "min-height", "max-width", "max-height",
      "padding", "margin", "transform", "z-index",
      "display", "align-items", "justify-content",
    ].forEach((p) => tableCloseBtn.style.removeProperty(p));
    const closeSvg = tableCloseBtn.querySelector("svg");
    if (closeSvg) {
      closeSvg.style.removeProperty("width");
      closeSvg.style.removeProperty("height");
    }
  }

  const toggleWidth = Math.max(34, Math.round(D.toggleBtn?.offsetWidth || 34));
  const toggleHalf = toggleWidth / 2;
  const gap = controlClusterGap();
  const bodyStyle = getComputedStyle(readerBody);
  const rightInset = Math.max(8, pxNumber(bodyStyle.borderRightWidth, 0) + 6);
  const fullscreenScrollbarGapTrim = splitView ? 0 : 4;
  const gutterLeft = contentRect.right;
  const gutterRight = Math.max(gutterLeft + 18, readerBodyRect.right - rightInset - fullscreenScrollbarGapTrim);
  const gutterCenter = gutterLeft + ((gutterRight - gutterLeft) / 2);
  const toggleNudgeX = .50; // could be tweaked to shift the toggle left/right based on layout
  const maxToggleCenter = gutterRight - toggleHalf;
  const minToggleCenter = gutterLeft + toggleHalf;
  let toggleCenterX;
  let toggleBottom;
  const modeKey = splitView ? "split" : "full";
  const cachedInsetFromRight = toggleInsetFromRightByMode[modeKey];

  if (splitView) {
    toggleBottom = Math.max(8, Math.round(gap));
    const baseRightEdgeGap = Math.max(8, Math.round((readerRect.right - gutterRight) + toggleBottom));
    const targetRightEdgeGap = baseRightEdgeGap * 3;
    toggleCenterX = readerRect.right - targetRightEdgeGap - toggleHalf;
    toggleCenterX = clamp(toggleCenterX, readerRect.left + toggleHalf + 4, readerRect.right - toggleHalf - 4);
    toggleInsetFromRightByMode[modeKey] = readerRect.right - toggleCenterX;
  } else {
    toggleCenterX = gutterCenter + toggleNudgeX;
    toggleBottom = 14;
    toggleCenterX = clamp(toggleCenterX, minToggleCenter, maxToggleCenter);
    if (cachedInsetFromRight == null) {
      toggleInsetFromRightByMode[modeKey] = readerRect.right - toggleCenterX;
    }
    toggleCenterX = readerRect.right - (toggleInsetFromRightByMode[modeKey] ?? 0);
    toggleCenterX = clamp(toggleCenterX, readerRect.left + toggleHalf + 4, readerRect.right - toggleHalf - 4);
  }
  D.toggleBtn.style.left = `${toggleCenterX.toFixed(2)}px`;
  D.toggleBtn.style.bottom = `${Math.round(toggleBottom)}px`;
  D.panel.classList.add("dt-positioned");
}

let lastLayoutKey = "";
let layoutSyncTimer = 0;
let layoutSyncRaf = 0;
let layoutSyncDeadline = 0;
const toggleInsetFromRightByMode = { full: null, split: null };

function stopPanelPositionTracking() {
  if (layoutSyncRaf) {
    window.cancelAnimationFrame(layoutSyncRaf);
    layoutSyncRaf = 0;
  }
  layoutSyncDeadline = 0;
}

function trackPanelPosition(duration = 460) {
  stopPanelPositionTracking();
  layoutSyncDeadline = performance.now() + Math.max(0, duration);
  const tick = () => {
    layoutSyncRaf = 0;
    positionPanel();
    if (performance.now() < layoutSyncDeadline) {
      layoutSyncRaf = window.requestAnimationFrame(tick);
    } else {
      layoutSyncDeadline = 0;
      positionPanel();
    }
  };
  layoutSyncRaf = window.requestAnimationFrame(tick);
}

function layoutKey() {
  const body = document.body;
  if (!body) return "";
  return [
    body.classList.contains("codex-split-view") ? "split" : "full",
    body.classList.contains("is-mobile") ? "mobile" : "desktop",
    body.classList.contains("meta-collapsed") ? "toc-closed" : "toc-open",
    body.classList.contains("reader-table-open") ? "table-open" : "table-closed",
    body.classList.contains("split-fill-left") ? "fill-left" : "",
    body.classList.contains("split-fill-right") ? "fill-right" : "",
    body.style.getPropertyValue("--reader-split-max-width") || ""
  ].join("|");
}

function queuePanelPositionSync(duration = 460) {
  positionPanel();
  trackPanelPosition(duration);
  if (layoutSyncTimer) {
    window.clearTimeout(layoutSyncTimer);
    layoutSyncTimer = 0;
  }
  layoutSyncTimer = window.setTimeout(() => {
    layoutSyncTimer = 0;
    stopPanelPositionTracking();
    positionPanel();
  }, duration + 40);
}

positionPanel();
window.addEventListener("resize", () => queuePanelPositionSync(260));
requestAnimationFrame(() => requestAnimationFrame(() => queuePanelPositionSync(260)));

const bodyClassObserver = new MutationObserver(() => {
  const nextKey = layoutKey();
  if (nextKey === lastLayoutKey) return;
  lastLayoutKey = nextKey;
  queuePanelPositionSync();
  bindLayoutObservers();
});

let layoutResizeObserver = null;
let observedLayoutNodes = [];

function bindLayoutObservers() {
  if (typeof ResizeObserver === "undefined") return;
  const reader = document.querySelector(".reader");
  const readerBody = document.querySelector("#readerBody") || document.querySelector(".reader-body");
  const content = document.querySelector("#content") || readerBody?.querySelector(".markdown-body");
  const nextNodes = [reader, readerBody, content].filter(Boolean);
  if (
    layoutResizeObserver &&
    observedLayoutNodes.length === nextNodes.length &&
    observedLayoutNodes.every((node, idx) => node === nextNodes[idx])
  ) {
    return;
  }
  if (layoutResizeObserver) {
    observedLayoutNodes.forEach((node) => layoutResizeObserver.unobserve(node));
  } else {
    layoutResizeObserver = new ResizeObserver(() => queuePanelPositionSync(260));
  }
  observedLayoutNodes = nextNodes;
  observedLayoutNodes.forEach((node) => layoutResizeObserver.observe(node));
}

lastLayoutKey = layoutKey();
if (document.body) {
  bodyClassObserver.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
}
bindLayoutObservers();

// ── Utility ───────────────────────────────────────────────────────────────────

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlightBcode(text) {
  if (!text) return "";
  if (!window.hljs) return escapeHtml(text);
  try {
    return window.hljs.highlight(text, { language: "bcode", ignoreIllegals: true }).value;
  } catch {
    return escapeHtml(text);
  }
}

function highlightResponseBcode(text) {
  const source = String(text);
  const tagMatch = source.match(/(-?\d+(?:\.\d+)?\\|\\[a-z]|\^[a-z])(?=$|\s)/);
  if (!tagMatch) return highlightBcode(source);

  const index = tagMatch.index;
  const tag = tagMatch[0];
  const before = source.slice(0, index);
  const after = source.slice(index + tag.length);
  const className = tag[0] === "^" ? "dt-response-tag dt-response-tag-ok" : "dt-response-tag dt-response-tag-error";

  return [
    highlightBcode(before),
    `<span class="${className}">${escapeHtml(tag)}</span>`,
    highlightBcode(after),
  ].join("");
}

const RESPONSE_ERROR_CODES = Object.freeze({
  GEN: Object.freeze({
    CMD_UNKNOWN: "-1.0",
    RES_UNKNOWN: "-1.1",
    SEQ_MISSING: "-1.2",
    SEQ_UNKNOWN: "-1.3",
    PAYLOAD_MISSING: "-1.4",
    PAYLOAD_OVERFLOW: "-1.5",
    PAYLOAD_INVALID: "-1.6",
    INDEX_MISSING: "-1.7",
    INDEX_UNKNOWN: "-1.8",
    PARAM_MISSING: "-1.9",
    PARAM_OVERRANGE: "-1.10",
    PARAM_UNDERRANGE: "-1.11",
    PARAM_BADQUAL: "-1.12",
    PARAM_INVALID: "-1.13",
    RESP_OVERFLOW: "-1.14",
    RANGE_MISSING: "-1.15",
    RANGE_OVERFLOW: "-1.16",
    LINE_MISSING: "-1.17",
  }),
  ML: Object.freeze({
    EXPECTED: "-2.0",
    LAST_MISSING: "-2.1",
    LAST_OVERFLOW: "-2.2",
    LAST_ALTERED: "-2.3",
    CNTR_START: "-2.4",
    CNTR_OVERRANGE: "-2.5",
    CNTR_SEQUENCE: "-2.6",
  }),
  REST_GENERIC: Object.freeze({
    MALFORMED: "-95.1",
    INVALID_TARGET: "-95.2",
    ACCESS_DENIED: "-95.3",
    NOT_SUPPORTED: "-95.4",
    BUSY: "-95.5",
  }),
  UPDATE: Object.freeze({
    MALFORMED: "-98.1",
    PARAM_MISSING: "-98.10",
    INVALID_COMBINATION: "-98.11",
    VALUE_REJECTED: "-98.12",
    LOCKED_OUT: "-98.20",
    CONFLICT: "-98.22",
    COMMIT_FAILED: "-98.23",
  }),
  DELTA: Object.freeze({
    MALFORMED: "-100.1",
    PARAM_NOT_SUPPORTED: "-100.10",
    WOULD_EXCEED_RANGE: "-100.11",
    WOULD_BE_INVALID: "-100.12",
    LOCKED_OUT: "-100.20",
    CONFLICT: "-100.22",
    COMMIT_FAILED: "-100.23",
  }),
  CONTROL: Object.freeze({
    MALFORMED: "-99.1",
    LOCKED_OUT: "-99.20",
    ILLEGAL_STATE: "-99.21",
    CONFLICT: "-99.22",
    SEQ_MISSING: "-99.30",
  }),
  FEED: Object.freeze({
    MALFORMED: "-102.1",
    NOT_SUPPORTED: "-102.4",
    BUSY: "-102.5",
    INVALID_RANGE: "-102.10",
    RELEASE_REJECTED: "-102.11",
    PLAYBACK_REJECTED: "-102.12",
    EVENT_NOT_FOUND: "-102.13",
    RELEASE_PRECONDITION_FAILED: "-102.14",
    SINGLE_EVENT_UNSUPPORTED: "-102.15",
    RANGE_UNSUPPORTED: "-102.16",
    RELEASE_TARGET_INVALID: "-102.17",
  }),
  ALLOCATE: Object.freeze({
    GROUP: "-105",
  }),
});

function fmtNum(v) {
  if (!Number.isFinite(v)) return String(v);
  if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
  return v.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

// ── BCODe compose helpers ─────────────────────────────────────────────────────

function makeField(val, q = {}) {
  return { strValue: String(val), greaterthan: !!q.gt, lessthan: !!q.lt, indefinite: !!q.indef };
}

function composeLine(params, cmdValue, cmdCode, opts = {}) {
  const record = {
    params: {},
    cmd:    makeField(cmdValue, opts.cmdQ),
    code:   cmdCode,
  };
  params.forEach(p => {
    record.params[p.term] = makeField(p.value, p.q);
  });
  const s = BCODe.Line.compose([record]).replace(/\r?\n$/, "");
  return opts.leading ? opts.leading + s : s;
}

function normalizeBlobBounds() {
  sim.minBlobs = Math.max(0, Math.round(sim.minBlobs));
  sim.maxBlobs = Math.max(0, Math.round(sim.maxBlobs));
  if (sim.minBlobs > sim.maxBlobs) sim.maxBlobs = sim.minBlobs;
}

// ── Simulation helpers ────────────────────────────────────────────────────────

function resetSim() {
  Object.assign(sim, SIM_DEFAULTS, { glass: document.body?.dataset.glassMode === "on" });
  normalizeBlobBounds();
}

function applyLavaState(detail = {}) {
  if (typeof detail.blobs === "number" && Number.isFinite(detail.blobs)) sim.blobs = Math.round(detail.blobs);
  if (typeof detail.minBlobs === "number" && Number.isFinite(detail.minBlobs)) sim.minBlobs = Math.round(detail.minBlobs);
  if (typeof detail.maxBlobs === "number" && Number.isFinite(detail.maxBlobs)) sim.maxBlobs = Math.round(detail.maxBlobs);
  if (typeof detail.radiusSpread === "number" && Number.isFinite(detail.radiusSpread)) sim.radiusSpread = detail.radiusSpread;
  if (typeof detail.velocitySpread === "number" && Number.isFinite(detail.velocitySpread)) sim.velocitySpread = detail.velocitySpread;
  if (typeof detail.blobForce === "number" && Number.isFinite(detail.blobForce)) sim.blobForce = detail.blobForce;
  if (typeof detail.averageVelocity === "number" && Number.isFinite(detail.averageVelocity)) sim.averageVelocity = detail.averageVelocity;
  if (typeof detail.averageRadius === "number" && Number.isFinite(detail.averageRadius)) sim.averageRadius = detail.averageRadius;
  if (typeof detail.glass === "boolean") sim.glass = detail.glass;
  if (typeof detail.paused === "boolean") sim.paused = detail.paused;
  if (typeof detail.cleared === "boolean") sim.cleared = detail.cleared;
  normalizeBlobBounds();
}

function dispatchLavaParams(detail) {
  if (!detail || Object.keys(detail).length === 0) return;
  applyLavaState(detail);
  window.dispatchEvent(new CustomEvent("bcode:lava-params", { detail }));
}

function dispatchLavaControl(detail) {
  window.dispatchEvent(new CustomEvent("bcode:lava-control", { detail }));
}

function snapshotLine() {
  return [
    `${sim.blobs}B`,
    `>${sim.minBlobs}B`,
    `<${sim.maxBlobs}B`,
    `${fmtNum(sim.radiusSpread)}R`,
    `${fmtNum(sim.velocitySpread)}V`,
    `${fmtNum(sim.blobForce)}F`,
    `${sim.glass ? 1 : 0}g`,
    "q"
  ].join(" ");
}

function queryLine(parsed) {
  if (parsed.params.V) return `${fmtNum(sim.averageVelocity)}Vq`;
  if (parsed.params.R) return `${fmtNum(sim.averageRadius)}Rq`;
  return snapshotLine();
}

function buildTelemetryLine({ tick = sim.tick, stale = false } = {}) {
  const lead = stale ? "!" : "";
  return `${lead}${sim.blobs}B ${fmtNum(sim.averageVelocity)}V ${fmtNum(sim.averageRadius)}R ${fmtNum(tick)}u`;
}

function formatFeedEntry(entry, index = 0) {
  if (typeof entry === "string") return `${index + 1}] ^\\ ${entry}`;
  return `${entry.seq}] ^\\ ${entry.line}`;
}

function addAcceptedResponseTag(output, parsed) {
  if (!parsed?.cmd?.code || !output) return output;
  const cmd = parsed.cmd.code;
  const text = String(output).trim();
  if (text.includes(`^${cmd}`) || text.includes(`\\${cmd}`)) return text;
  return text.endsWith(cmd) ? `${text.slice(0, -cmd.length)}^${cmd}` : `^${cmd} ${text}`;
}

function splitTrailingCommand(text) {
  const source = String(text || "").trimEnd();
  const match = source.match(/^(.*)([a-z])$/);
  return match ? { body: match[1], cmd: match[2] } : null;
}

function rejectedResponseTag(requestText, errorCode = RESPONSE_ERROR_CODES.GEN.PARAM_INVALID) {
  const request = splitTrailingCommand(requestText);
  if (request) return `${errorCode}\\ ${String(requestText).trim()}`;
  return `${RESPONSE_ERROR_CODES.GEN.LINE_MISSING}\\s`;
}

function percentText(value) {
  return `±${Math.round(value * 100)}%`;
}

function currentGuideSetCommands() {
  return [
    { cmd: `${fmtNum(sim.radiusSpread)}Rs`,  desc: "set blob radius variation (1.0 default)" },
    { cmd: `${fmtNum(sim.velocitySpread)}Vs`,  desc: "set blob velocity variation (1.0 default)" },
    { cmd: `>${sim.minBlobs}Bs`,  desc: "set minimum blob count" },
    { cmd: `<${sim.maxBlobs}Bs`,  desc: "set maximum blob count" },
    { cmd: `${fmtNum(sim.blobForce)}Fs`,  desc: "set blob attraction/repulsion force (1.0 default)" },
  ];
}

function stagedDescription(parsed) {
  if (!parsed) return '-> stage B as "at least 14 blobs,"';
  const params = parsed.params || {};
  if (params.R) return `-> stage R as "radius variation ${fmtNum(sim.radiusSpread)},"`;
  if (params.V) return `-> stage V as "velocity variation ${fmtNum(sim.velocitySpread)},"`;
  if (params.B) {
    const kind = params.B.lessthan ? "at most" : "at least";
    const value = params.B.lessthan ? sim.maxBlobs : sim.minBlobs;
    return `-> stage B as "${kind} ${value} blobs,"`;
  }
  if (params.F) return `-> stage F as "blob force ${fmtNum(sim.blobForce)},"`;
  return "-> stage the current command";
}

function guideExampleDescription(parsed, raw) {
  if (!parsed) return stagedDescription(parsed);
  switch (parsed.cmd.code) {
    case "s": return stagedDescription(parsed);
    case "q": return "-> query the current lava-lamp state";
    case "r": return Object.keys(parsed.params).length ? "-> reset selected configurable values" : "-> reset all configurable values";
    case "c": return "-> clear all loaded blobs from the simulation";
    case "p": return parsed.cmd.hasValue && parsed.cmd.value === 0 ? "-> resume the simulation" : "-> pause the simulation";
    case "g": return parsed.cmd.hasValue && parsed.cmd.value < 1 ? "-> disable glass rendering mode" : "-> enable glass rendering mode";
    default: return `-> parse ${raw}`;
  }
}

function guideExampleContinuation(parsed) {
  if (!parsed || parsed.cmd.code === "s") {
    return `then <code class="dt-guide-code hljs language-bcode">${highlightBcode("s")}</code> commits the update with the set command.`;
  }
  return "";
}

// ── DOM builders (mirror app.js) ─────────────────────────────────────────────

function mkHlLine(text, extra = "") {
  const d = document.createElement("div");
  d.className = "dt-bcode-line" + (extra ? " " + extra : "");
  d.innerHTML = highlightBcode(text);
  return d;
}

function mkOutputLine(text) {
  const d = document.createElement("div");
  d.className = "dt-bcode-line";
  const pre = document.createElement("span");
  pre.className = "dt-output-prefix";
  pre.textContent = "\u25cb ";
  const body = document.createElement("span");
  body.innerHTML = highlightResponseBcode(text);
  d.append(pre, body);
  return d;
}

function mkBlank() {
  const d = document.createElement("div");
  d.className = "dt-blank-line";
  return d;
}

function mkStateLine(bullet, key, val, valueClass = "") {
  const d = document.createElement("div");
  d.className = "dt-state-line";
  const b = document.createElement("span");
  b.className = "dt-state-bullet"; b.textContent = bullet;
  const k = document.createElement("span");
  k.className = "dt-state-key"; k.textContent = key + ": ";
  const v = document.createElement("span");
  v.className = "dt-state-val"; v.textContent = val;
  if (valueClass) v.classList.add(valueClass);
  d.append(b, k, v);
  return d;
}

// ── Render functions ──────────────────────────────────────────────────────────

function renderGuide() {
  D.docsBody.innerHTML = "";

  const appendRow = (bulletText, cmdText, descText, extra = "") => {
    const row = document.createElement("div");
    row.className = `dt-guide-entry${extra ? ` ${extra}` : ""}`;

    const bullet = document.createElement("span");
    bullet.className = "dt-guide-bullet";
    bullet.textContent = bulletText;

    const code = document.createElement("code");
    code.className = "dt-guide-code hljs language-bcode";
    code.innerHTML = highlightBcode(cmdText);

    const desc = document.createElement("span");
    desc.className = "dt-guide-desc";
    desc.textContent = descText;

    row.append(bullet, code, desc);
    D.docsBody.append(row);
  };

  GUIDE_PRIMARY_COMMANDS.forEach(entry => appendRow("\u2022", entry.cmd, entry.desc, "dt-guide-rule"));
  D.docsBody.append(mkBlank());

  [
    ["R", "controls random radius spread."],
    ["V", "controls random velocity spread."],
    ["B", "controls blob-count bounds."],
    ["F", "controls blob-to-blob force scaling."],
  ].forEach(([cmd, desc]) => appendRow("\u2022", cmd, desc, "dt-guide-rule"));

  D.docsBody.append(mkBlank());
  currentGuideSetCommands().forEach(entry => appendRow("o", entry.cmd, entry.desc, "dt-guide-command"));
  D.docsBody.append(mkBlank());
  GUIDE_QUERY_COMMANDS.forEach(entry => appendRow("o", entry.cmd, entry.desc, "dt-guide-command"));
  GUIDE_CONTROL_COMMANDS.forEach(entry => appendRow("o", entry.cmd, entry.desc, "dt-guide-command"));
  D.docsBody.append(mkBlank());
  GUIDE_GLASS_COMMANDS.forEach(entry => appendRow("o", entry.cmd, entry.desc, "dt-guide-command"));

  D.docsBody.append(mkBlank());
  const divider = document.createElement("div");
  divider.className = "dt-guide-note dt-guide-divider";
  divider.textContent = "------------------------------------------------";
  D.docsBody.append(divider);

  const title = document.createElement("div");
  title.className = "dt-guide-note dt-guide-example-title";
  title.textContent = "Example breakdown:";
  D.docsBody.append(title);

  appendRow("\u2022", state.guideCommand, guideExampleDescription(state.guideParsed, state.guideCommand), "dt-guide-example");

  const continuation = document.createElement("div");
  continuation.className = "dt-guide-note dt-guide-continuation";
  continuation.innerHTML = guideExampleContinuation(state.guideParsed);
  D.docsBody.append(continuation);
}

function renderHistory() {
  D.historyBody.innerHTML = "";
  state.homeHistory.forEach(e => {
    D.historyBody.append(mkHlLine(e.cmd));
    if (e.output) D.historyBody.append(mkOutputLine(e.output));
    D.historyBody.append(mkBlank());
  });
  D.historyBody.scrollTop = D.historyBody.scrollHeight;
}

function renderReqResp() {
  D.reqrespBody.innerHTML = "";
  state.reqresp.forEach(e => {
    D.reqrespBody.append(mkHlLine(e.cmd));
    if (e.output) D.reqrespBody.append(mkOutputLine(e.output));
    D.reqrespBody.append(mkBlank());
  });
  D.reqrespBody.scrollTop = D.reqrespBody.scrollHeight;
}

function renderFeed() {
  D.feedBody.innerHTML = "";
  state.feed.forEach((entry, index) => D.feedBody.append(mkHlLine(formatFeedEntry(entry, index))));
  D.feedBody.scrollTop = D.feedBody.scrollHeight;
}

function renderStateFeed() {
  D.stateBody.innerHTML = "";
  [
    { key: "blobs",            val: String(sim.blobs) },
    { key: "min blobs",        val: String(sim.minBlobs) },
    { key: "max blobs",        val: String(sim.maxBlobs) },
    { key: "max/min radius",   val: `\u00b1${fmtNum(sim.radiusSpread * 100)}%` },
    { key: "max/min velocity", val: `\u00b1${fmtNum(sim.velocitySpread * 12)}%` },
    { key: "blob force",       val: `\u00b1${fmtNum(Math.abs(sim.blobForce - 1) * 100)}%` },
    { key: "average velocity", val: fmtNum(sim.averageVelocity) },
    { key: "average radius",   val: fmtNum(sim.averageRadius) },
    { key: "glass",            val: sim.glass ? "enabled" : "disabled", valueClass: sim.glass ? "dt-state-enabled" : "" },
  ].forEach(item => D.stateBody.append(mkStateLine("\u2022", item.key, item.val, item.valueClass)));
}

// ── Input mirror + live parser ────────────────────────────────────────────────

function updateMirror() {
  const text = D.cmdInput.value;
  if (D.inputHl) {
    D.inputHl.innerHTML = text ? (highlightBcode(text) + "&nbsp;") : "";
    D.inputHl.scrollLeft = D.cmdInput.scrollLeft;
  }
  state.live = analyzeLive(text);
  renderStateFeed();
}

function analyzeLive(text) {
  const snap = { latched: false, stateName: "normal", errors: [] };
  try {
    const p = new SABParser({
      on_line_latched() { snap.latched = true; },
      on_parse_error(_, code, byte, st) {
        snap.errors.push({
          code, errorName: bcode_sab_parse_error_name(code),
          offendingByte: byte, stateName: bcode_sab_state_name(st),
        });
      },
    });
    p.feed(text);
    snap.stateName = bcode_sab_state_name(p.state);
  } catch (err) {
    snap.errors.push({ code: "RT", errorName: err.message, offendingByte: 0, stateName: "runtime" });
  }
  return snap;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseTerminalCommand(text) {
  const source = text.trim();
  if (!source) return { errorCode: RESPONSE_ERROR_CODES.GEN.LINE_MISSING };
  const parsed = { params: {}, cmd: null };
  let i = 0;

  const skipSpace = () => {
    while (i < source.length && /\s/.test(source[i])) i++;
  };

  while (i < source.length) {
    skipSpace();
    if (i >= source.length) break;

    const field = { greaterthan: false, lessthan: false, indefinite: false, hasValue: false, value: NaN };
    while (source[i] === ">" || source[i] === "<" || source[i] === "?") {
      if (source[i] === ">") field.greaterthan = true;
      if (source[i] === "<") field.lessthan = true;
      if (source[i] === "?") field.indefinite = true;
      i++;
      skipSpace();
    }

    let sign = 1;
    if (source[i] === "-" && /[0-9.]/.test(source[i + 1] || "")) {
      sign = -1;
      i++;
    }

    const numberStart = i;
    while (i < source.length && /[0-9]/.test(source[i])) i++;
    if (source[i] === ".") {
      i++;
      while (i < source.length && /[0-9]/.test(source[i])) i++;
    }
    const numberText = source.slice(numberStart, i);
    if (numberText && numberText !== ".") {
      field.hasValue = true;
      field.value = sign * Number(numberText);
    }

    skipSpace();
    if (i >= source.length) return { errorCode: RESPONSE_ERROR_CODES.GEN.LINE_MISSING };
    const term = source[i++];

    if ("RVBF".includes(term)) {
      parsed.params[term] = field;
    } else if (/[a-z]/.test(term)) {
      parsed.cmd = Object.assign({ code: term }, field);
      skipSpace();
      if (i < source.length) return { errorCode: RESPONSE_ERROR_CODES.GEN.PARAM_INVALID };
      break;
    } else {
      return { errorCode: RESPONSE_ERROR_CODES.GEN.PARAM_INVALID };
    }
  }

  if (!parsed.cmd) return { errorCode: RESPONSE_ERROR_CODES.GEN.LINE_MISSING };
  return parsed;
}

function rangeErrorCode(value, min, max) {
  if (!Number.isFinite(value)) return RESPONSE_ERROR_CODES.GEN.PARAM_INVALID;
  if (value < min) return RESPONSE_ERROR_CODES.GEN.PARAM_UNDERRANGE;
  if (value > max) return RESPONSE_ERROR_CODES.GEN.PARAM_OVERRANGE;
  return null;
}

function validateTerminalCommand(parsed) {
  if (!parsed?.cmd) return RESPONSE_ERROR_CODES.GEN.LINE_MISSING;
  const cmd = parsed.cmd.code;
  const params = parsed.params || {};
  const paramKeys = Object.keys(params);

  if (!"sqgrcp".includes(cmd)) return RESPONSE_ERROR_CODES.GEN.CMD_UNKNOWN;
  if (parsed.cmd.indefinite || parsed.cmd.greaterthan || parsed.cmd.lessthan) {
    return RESPONSE_ERROR_CODES.GEN.PARAM_BADQUAL;
  }

  for (const key of paramKeys) {
    const field = params[key];
    if (field.indefinite) return RESPONSE_ERROR_CODES.GEN.PARAM_BADQUAL;
  }

  if (cmd === "s") {
    if (!paramKeys.length) return RESPONSE_ERROR_CODES.GEN.PARAM_MISSING;
    for (const key of paramKeys) {
      const field = params[key];
      if (!field.hasValue) return RESPONSE_ERROR_CODES.GEN.PARAM_MISSING;
      if ((field.greaterthan || field.lessthan) && key !== "B") {
        return RESPONSE_ERROR_CODES.GEN.PARAM_BADQUAL;
      }
      if (key === "R" || key === "V" || key === "F") {
        const err = rangeErrorCode(field.value, 0, 10);
        if (err) return err;
      } else if (key === "B") {
        const err = rangeErrorCode(field.value, 0, 120);
        if (err) return err;
      }
    }
    return null;
  }

  if (cmd === "q") {
    if (paramKeys.some((key) => !["R", "V"].includes(key))) return RESPONSE_ERROR_CODES.GEN.PARAM_INVALID;
    if (paramKeys.some((key) => params[key].hasValue || params[key].greaterthan || params[key].lessthan)) {
      return RESPONSE_ERROR_CODES.GEN.PARAM_INVALID;
    }
    return null;
  }

  if (cmd === "r") {
    if (paramKeys.some((key) => params[key].hasValue || params[key].greaterthan || params[key].lessthan)) {
      return RESPONSE_ERROR_CODES.GEN.PARAM_INVALID;
    }
    return null;
  }

  if (cmd === "c") {
    if (paramKeys.length) return RESPONSE_ERROR_CODES.CONTROL.MALFORMED;
    return null;
  }

  if (cmd === "p" || cmd === "g") {
    if (paramKeys.length) return RESPONSE_ERROR_CODES.GEN.PARAM_INVALID;
    if (parsed.cmd.hasValue && parsed.cmd.value !== 0 && parsed.cmd.value !== 1) {
      return RESPONSE_ERROR_CODES.GEN.PARAM_INVALID;
    }
    return null;
  }

  return RESPONSE_ERROR_CODES.GEN.CMD_UNKNOWN;
}

// ── Command processing ────────────────────────────────────────────────────────

function applySet(raw, parsed) {
  const detail = {};
  const setSpread = (term, key) => {
    const field = parsed.params[term];
    if (!field || !field.hasValue) return;
    const value = clampNumber(field.value, 0, 10);
    sim[key] = value;
    detail[key] = value;
  };

  setSpread("R", "radiusSpread");
  setSpread("V", "velocitySpread");

  if (parsed.params.B && parsed.params.B.hasValue) {
    const value = clampNumber(Math.round(parsed.params.B.value), 0, 120);
    if (parsed.params.B.lessthan) {
      sim.maxBlobs = value;
      detail.maxBlobs = value;
    } else {
      sim.minBlobs = value;
      detail.minBlobs = value;
    }
    normalizeBlobBounds();
    detail.minBlobs = sim.minBlobs;
    detail.maxBlobs = sim.maxBlobs;
  }

  if (parsed.params.F && parsed.params.F.hasValue) {
    const value = clampNumber(parsed.params.F.value, 0, 10);
    sim.blobForce = value;
    detail.blobForce = value;
  }

  if (Object.keys(detail).length) sim.cleared = false;
  dispatchLavaParams(detail);
  return raw;
}

function applyGlassMode(parsed) {
  const enable = parsed.cmd.hasValue ? parsed.cmd.value >= 1 : true;
  sim.glass = enable;
  window.dispatchEvent(new CustomEvent("bcode:glass-mode", { detail: { enabled: enable } }));
  return `${enable ? 1 : 0}g`;
}

function resetKeysFromParams(params) {
  const keys = ["R", "V", "B", "F"].filter((key) => params[key]);
  return keys.length ? keys : ["R", "V", "B", "F"];
}

function applyReset(parsed) {
  const keys = resetKeysFromParams(parsed.params);
  if (keys.includes("R")) sim.radiusSpread = SIM_DEFAULTS.radiusSpread;
  if (keys.includes("V")) sim.velocitySpread = SIM_DEFAULTS.velocitySpread;
  if (keys.includes("B")) {
    sim.minBlobs = SIM_DEFAULTS.minBlobs;
    sim.maxBlobs = SIM_DEFAULTS.maxBlobs;
  }
  if (keys.includes("F")) sim.blobForce = SIM_DEFAULTS.blobForce;
  normalizeBlobBounds();
  dispatchLavaControl({ command: "reset", keys });
  return `${Object.keys(parsed.params).join("")}r`;
}

function applyClear() {
  sim.blobs = 0;
  sim.cleared = false;
  dispatchLavaControl({ command: "clear" });
  return "c";
}

function applyPause(parsed) {
  const paused = parsed.cmd.hasValue ? parsed.cmd.value !== 0 : !sim.paused;
  sim.paused = paused;
  dispatchLavaControl({ command: "pause", paused });
  return parsed.cmd.hasValue ? `${paused ? 1 : 0}p` : "p";
}

function generateOutput(raw, parsed) {
  if (!parsed) return null;
  switch (parsed.cmd.code) {
    case "s": return applySet(raw, parsed);
    case "q": return queryLine(parsed);
    case "r": return applyReset(parsed);
    case "c": return applyClear();
    case "p": return applyPause(parsed);
    case "g": return applyGlassMode(parsed);
    default:  return raw;
  }
}

function appendTransaction(cmd, output) {
  const e = { cmd, output };
  state.homeHistory.push(e);
  state.reqresp.push(e);
  if (state.homeHistory.length > 18) state.homeHistory.shift();
  if (state.reqresp.length > 18)     state.reqresp.shift();
}

async function submit() {
  const text = D.cmdInput.value.trim();
  if (!text) return;

  let output = text;
  let parsed = null;
  let errorCode = RESPONSE_ERROR_CODES.GEN.PARAM_INVALID;
  let accepted = false;
  try {
    parsed = parseTerminalCommand(text);
    errorCode = parsed?.errorCode || validateTerminalCommand(parsed);
    if (!errorCode) {
      output = generateOutput(text, parsed) ?? text;
      output = addAcceptedResponseTag(output, parsed);
      accepted = true;
      state.guideCommand = text;
      state.guideParsed = parsed;
    }
  } catch {
    errorCode = RESPONSE_ERROR_CODES.GEN.PARAM_INVALID;
  }

  if (!accepted) output = rejectedResponseTag(text, errorCode);

  appendTransaction(text, output);
  renderGuide();
  renderHistory();
  renderReqResp();
  renderStateFeed();

  D.cmdInput.value = "";
  updateMirror();
  focusCommandInput();
}

// ── Tab switching ─────────────────────────────────────────────────────────────

function switchView(view) {
  state.view = view;
  D.tabs.forEach(tab => {
    const active = tab.dataset.dtview === view;
    tab.classList.toggle("dt-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  D.homeView.classList.toggle("dt-active",  view === "home");
  D.termView.classList.toggle("dt-active",  view === "terminal");
  if (view !== "terminal") closeMenu();
}

// ── BCODe α menu ─────────────────────────────────────────────────────────────

function openMenu() {
  D.menuDrop.classList.add("dt-open");
  D.menuBtn.setAttribute("aria-expanded", "true");
  D.menuDrop.setAttribute("aria-hidden", "false");
}

function closeMenu() {
  D.menuDrop.classList.remove("dt-open");
  D.menuBtn.setAttribute("aria-expanded", "false");
  D.menuDrop.setAttribute("aria-hidden", "true");
}

D.menuBtn.addEventListener("click", e => {
  e.stopPropagation();
  D.menuDrop.classList.contains("dt-open") ? closeMenu() : openMenu();
});

D.menuDrop.addEventListener("click", e => {
  const item = e.target.closest(".dt-menu-item");
  if (!item) return;
  closeMenu();
  if (item.dataset.action === "reset") {
    state.reqresp.length = 0;
    renderReqResp();
    D.cmdInput.value = "";
    updateMirror();
  } else if (item.dataset.action === "clear") {
    state.feed.length = 0;
    state.feedSequence = 0;
    renderFeed();
    renderStateFeed();
  }
  focusCommandInput();
});

document.addEventListener("click", e => {
  if (!D.menuWrap.contains(e.target)) closeMenu();
});

// ── [>] history drawer ────────────────────────────────────────────────────────

D.prompt.addEventListener("click", () => {
  state.historyOpen = !state.historyOpen;
  D.historyPanel.classList.toggle("dt-hidden", !state.historyOpen);
  focusCommandInput();
});

// ── Feed ticker ───────────────────────────────────────────────────────────────

function tickFeed() {
  if (sim.paused) return;
  sim.tick = Number((sim.tick + 0.1).toFixed(1));
  if (!window.__bcodeLava) {
    sim.blobs = Math.max(0, sim.blobs + Math.round(Math.random() * 2 - 0.8));
    sim.averageVelocity = Number(Math.max(0, sim.averageVelocity + (Math.random() * 0.08 - 0.04)).toFixed(2));
    sim.averageRadius = Number(Math.max(1, sim.averageRadius + (Math.random() * 0.08 - 0.04)).toFixed(1));
  }

  const stale = Math.random() < 0.08;
  let line;
  try {
    line = buildTelemetryLine({ tick: sim.tick, stale });
  } catch {
    const t = fmtNum(sim.tick);
    line = `${stale ? "!" : ""}${sim.blobs}B ${fmtNum(sim.averageVelocity)}V ${fmtNum(sim.averageRadius)}R ${t}u`;
  }

  state.feedSequence += 1;
  state.feed.push({ seq: state.feedSequence, line });
  if (state.feed.length > 50) state.feed.shift();

  renderFeed();
  renderStateFeed();
}

// ── Wire up events ────────────────────────────────────────────────────────────

D.tabs.forEach(tab => tab.addEventListener("click", () => switchView(tab.dataset.dtview)));

D.cmdInput.addEventListener("input", updateMirror);
D.cmdInput.addEventListener("scroll", () => {
  if (D.inputHl) D.inputHl.scrollLeft = D.cmdInput.scrollLeft;
});
D.cmdInput.addEventListener("keydown", async e => {
  if (e.key === "Enter") { e.preventDefault(); await submit(); }
  if (e.key === "Escape") { closePanel(); }
});

D.sendBtn.addEventListener("click", () => submit());

window.addEventListener("bcode:lava-state", (e) => {
  if (!e || !e.detail) return;
  applyLavaState(e.detail);
  renderGuide();
  renderStateFeed();
});

const glassObserver = new MutationObserver(() => {
  sim.glass = document.body?.dataset.glassMode === "on";
  renderStateFeed();
});
if (document.body) {
  glassObserver.observe(document.body, { attributes: true, attributeFilter: ["data-glass-mode"] });
}

queueMicrotask(() => {
  if (window.__bcodeLava && typeof window.__bcodeLava.getState === "function") {
    applyLavaState(window.__bcodeLava.getState());
    renderGuide();
    renderStateFeed();
  }
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeMenu();
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────

renderGuide();
renderHistory();
renderReqResp();
renderFeed();
renderStateFeed();
switchView("home");
// feedTimer starts only when the panel is opened, not at page load.
