const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const { CodexStateWatcher } = require("./codex-state.cjs");
const { hidePetWindow, showPetWindow } = require("./window-actions.cjs");

const qaMode = process.argv.includes("--qa");
const focusQaMode = process.argv.includes("--qa-focus");
const qaCaptureBase = process.argv.find((value) => value.startsWith("--qa-capture="))?.slice("--qa-capture=".length) || null;
const launchWithCodex = process.argv.includes("--start-with-codex");
const BASE_WINDOW_HEIGHT = 500;
const WINDOW = qaMode ? { width: 620, height: BASE_WINDOW_HEIGHT } : { width: 280, height: BASE_WINDOW_HEIGHT };
const PREVIOUS_WINDOW_HEIGHT = 370;
const LAYOUT_VERSION = 6;
let petWindow;
let tray;
let watcher;
let dragOffset = null;
let lastStatePayload = null;
let pinned = true;
let requestedHostHeight = BASE_WINDOW_HEIGHT;
let codexLaunchTimer = null;
let qaMinimizeRequests = 0;
const activeReplyChildren = new Set();
const configPath = path.join(app.getPath("userData"), "window.json");

function helperPath(filename = "focus-codex.ps1") {
  const helperDirectory = __dirname.includes("app.asar")
    ? __dirname.replace("app.asar", "app.asar.unpacked")
    : __dirname;
  return path.join(helperDirectory, filename);
}

function restorePetLayer() {
  if (!petWindow || petWindow.isDestroyed()) return;
  petWindow.setFocusable(true);
  if (pinned) {
    // Re-enter the topmost band after Codex has accepted foreground focus.
    // Toggling the flag also repairs stale z-order left by another topmost app.
    petWindow.setAlwaysOnTop(false);
    petWindow.setAlwaysOnTop(true, "screen-saver");
    petWindow.moveTop();
  } else {
    petWindow.setAlwaysOnTop(false);
  }
}

function focusCodex() {
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.setAlwaysOnTop(false);
    petWindow.setFocusable(false);
    petWindow.blur();
  }
  // Never invoke codex:// here: protocol activation can wake Codex's built-in
  // pet. The native helper targets only the already-open main Codex window.
  const child = spawn(helperPath("submit-codex.exe"), ["--focus-only", "--trace"], {
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  return new Promise((resolve) => {
    let settled = false;
    let output = "";
    let diagnostics = "";
    const startedAt = Date.now();
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      setTimeout(restorePetLayer, 80);
      setTimeout(restorePetLayer, 500);
      resolve({ ...result, protocolLaunched: false, elapsedMs: Date.now() - startedAt });
    };
    const timeout = setTimeout(() => {
      child.kill();
      finish({ ok: false, message: "THE MAIN APP WINDOW DID NOT ACCEPT FOCUS", detail: diagnostics.trim() });
    }, 120000);

    child.once("error", () => finish({ ok: false, message: "WINDOW CONTROL FOR LAIN COULD NOT START" }));
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => { diagnostics += chunk; });
    child.stdout.on("data", (chunk) => {
      output += chunk;
      const newline = output.indexOf("\n");
      if (newline < 0) return;
      try {
        const result = JSON.parse(output.slice(0, newline).trim());
        finish(result);
      } catch {
        finish({ ok: false, message: "THE MAIN APP WINDOW RETURNED AN INVALID RESPONSE" });
      }
      child.stdout.destroy();
    });
    child.once("close", (code) => {
      if (settled) return;
      try {
        finish(JSON.parse(output.trim().split(/\r?\n/)[0]));
      } catch {
        finish({ ok: false, message: code === 1 ? "THE MAIN APP WINDOW WAS NOT FOUND" : "THE MAIN APP WINDOW COULD NOT BE FOCUSED" });
      }
    });
  });
}

function submitReply(rawText) {
  const text = String(rawText || "").trim();
  if (!text) return Promise.resolve({ ok: false, message: "TYPE A REPLY FIRST" });
  if (text.length > 4000) return Promise.resolve({ ok: false, message: "REPLY IS LONGER THAN 4000 CHARACTERS" });

  const threadId = String(lastStatePayload?.threadId || "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(threadId)) {
    return Promise.resolve({ ok: false, message: "NO ACTIVE TASK IS LINKED TO LAIN" });
  }

  const threadTitle = String(lastStatePayload?.threadTitle || "").trim();
  if (!threadTitle) return Promise.resolve({ ok: false, message: "THE ACTIVE TASK TITLE IS NOT AVAILABLE" });

  const submissionId = crypto.randomUUID();
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.setAlwaysOnTop(false);
    petWindow.setFocusable(false);
    petWindow.blur();
  }

  const child = spawn(helperPath("submit-codex.exe"), [
    "--thread-title-base64", Buffer.from(threadTitle, "utf8").toString("base64"),
  ], {
    windowsHide: true,
    stdio: ["pipe", "pipe", "pipe"],
  });
  activeReplyChildren.add(child);

  return new Promise((resolve) => {
    let settled = false;
    let stdout = "";
    let stderr = "";
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      activeReplyChildren.delete(child);
      setTimeout(restorePetLayer, 180);
      resolve({ ...result, submissionId });
    };
    const timeout = setTimeout(() => {
      child.kill();
      finish({ ok: false, message: "THE REPLY FIELD DID NOT RESPOND IN TIME" });
    }, 10000);

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      const newline = stdout.indexOf("\n");
      if (newline < 0) return;
      try {
        finish(JSON.parse(stdout.slice(0, newline).trim()));
      } catch {
        finish({ ok: false, message: "THE REPLY FIELD RETURNED AN INVALID RESPONSE" });
      }
    });

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => { stderr = (stderr + chunk).slice(-2000); });
    child.once("close", (code) => {
      if (!settled) {
        finish({
          ok: false,
          message: stderr.trim() || `REPLY BRIDGE CLOSED (${Number.isInteger(code) ? code : "?"})`,
        });
      }
    });
    child.once("error", () => {
      finish({ ok: false, message: "REPLY CONNECTION FOR LAIN COULD NOT START" });
    });
    child.stdin.on("error", () => {});
    child.stdin.end(text, "utf8");
  });
}

function readPosition() {
  try {
    const value = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (typeof value.pinned === "boolean") pinned = value.pinned;
    if ([LAYOUT_VERSION, 5].includes(value.layoutVersion) && Number.isFinite(value.x) && Number.isFinite(value.y)) {
      const migratedY = value.layoutVersion === 5 ? value.y - (WINDOW.height - PREVIOUS_WINDOW_HEIGHT) : value.y;
      const area = screen.getDisplayMatching({ x: value.x, y: migratedY, ...WINDOW }).workArea;
      return {
        x: Math.min(Math.max(value.x, area.x), area.x + area.width - WINDOW.width),
        y: Math.min(Math.max(migratedY, area.y), area.y + area.height - WINDOW.height),
      };
    }
  } catch {}
  const area = screen.getPrimaryDisplay().workArea;
  return { x: area.x + area.width - WINDOW.width - 28, y: area.y + area.height - WINDOW.height - 18 };
}

function savePosition() {
  if (qaMode || !petWindow || petWindow.isDestroyed()) return;
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  const bounds = petWindow.getBounds();
  const baseY = bounds.y + bounds.height - BASE_WINDOW_HEIGHT;
  fs.writeFileSync(configPath, JSON.stringify({ layoutVersion: LAYOUT_VERSION, x: bounds.x, y: baseY, pinned }));
}

function resizeHost(rawHeight) {
  if (!petWindow || petWindow.isDestroyed()) return null;
  const numericHeight = Number(rawHeight);
  if (!Number.isFinite(numericHeight)) return null;
  requestedHostHeight = Math.max(BASE_WINDOW_HEIGHT, Math.round(numericHeight));
  const current = petWindow.getBounds();
  const area = screen.getDisplayMatching(current).workArea;
  const height = Math.min(requestedHostHeight, area.height);
  const anchoredBottom = current.y + current.height;
  const maxY = area.y + area.height - height;
  const y = Math.min(Math.max(anchoredBottom - height, area.y), maxY);
  const next = { x: current.x, y, width: current.width, height };
  if (current.y !== next.y || current.height !== next.height) petWindow.setBounds(next, false);
  return {
    requestedHeight: requestedHostHeight,
    actualHeight: height,
    anchorBottomBefore: anchoredBottom,
    anchorBottomAfter: y + height,
    bounds: petWindow.getBounds(),
    workArea: area,
  };
}

function codexIsRunning() {
  return new Promise((resolve) => {
    const child = spawn("tasklist.exe", ["/FI", "IMAGENAME eq Codex.exe", "/FO", "CSV", "/NH"], {
      windowsHide: true,
      stdio: ["ignore", "pipe", "ignore"],
    });
    let output = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { output = (output + chunk).slice(-4096); });
    child.once("error", () => resolve(false));
    child.once("close", () => resolve(/"Codex\.exe"/i.test(output)));
  });
}

function showPet({ inactive = false } = {}) {
  return showPetWindow(petWindow, {
    inactive,
    reapplyAlwaysOnTop: () => petWindow.setAlwaysOnTop(pinned, "screen-saver"),
  });
}

function showWhenCodexStarts() {
  const check = async () => {
    if (!petWindow || petWindow.isDestroyed()) return;
    if (await codexIsRunning()) {
      showPet({ inactive: true });
      codexLaunchTimer = null;
      return;
    }
    codexLaunchTimer = setTimeout(check, 2000);
  };
  check();
}

function enableCodexStartup() {
  if (qaMode || !app.isPackaged) return;
  const executable = process.env.PORTABLE_EXECUTABLE_FILE || process.execPath;
  app.setLoginItemSettings({
    openAtLogin: true,
    path: executable,
    args: ["--start-with-codex"],
  });
}

function createWindow() {
  const position = readPosition();
  petWindow = new BrowserWindow({
    ...WINDOW,
    ...position,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    alwaysOnTop: pinned,
    skipTaskbar: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });
  petWindow.setAlwaysOnTop(pinned, "screen-saver");
  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  petWindow.loadFile(
    path.join(__dirname, "..", "renderer", "index.html"),
    qaMode ? { query: {
      debug: "1",
      speed: "0.2",
      timerScale: "0.02",
      deterministicTiming: "1",
      deterministicVisual: "1",
    } } : undefined,
  );
  petWindow.webContents.on("did-finish-load", async () => {
    if (lastStatePayload) petWindow.webContents.send("codex-state", lastStatePayload);
    if (qaCaptureBase && focusQaMode) {
      const focusResult = await petWindow.webContents.executeJavaScript(`window.LainPetDebug.requestHostFocus()`);
      await new Promise((resolve) => setTimeout(resolve, 650));
      fs.writeFileSync(`${qaCaptureBase}-focus-metrics.json`, JSON.stringify({
        focusResult,
        petAlwaysOnTopAfterFocus: petWindow.isAlwaysOnTop(),
        petFocusableAfterFocus: petWindow.isFocusable(),
      }, null, 2));
      app.quit();
      return;
    }
    if (qaCaptureBase) {
      const interactionQa = {};
      const featureQa = {};
      let featureQaPassed = false;
      petWindow.webContents.send("codex-state", {
        state: "thinking",
        threadTitle: "Install it",
      });
      await new Promise((resolve) => setTimeout(resolve, 140));
      fs.writeFileSync(`${qaCaptureBase}-thinking-initial.png`, (await petWindow.webContents.capturePage()).toPNG());
      interactionQa.initialThinking = await petWindow.webContents.executeJavaScript(`(() => ({
        detail: document.querySelector("#bubble-detail-text").textContent,
        progressHidden: document.querySelector("#bubble-progress").hidden,
        detailDotsActive: document.querySelector("#detail-loading-dots").dataset.active,
        titleDotsActive: document.querySelector("#title-loading-dots").dataset.active,
        titleThrobberActive: document.querySelector("#title-throbber").dataset.active,
      }))()`);
      await petWindow.webContents.executeJavaScript(`window.LainPetDebug.setHover(true, { deliberate: false })`);
      await new Promise((resolve) => setTimeout(resolve, 80));
      interactionQa.passiveThinkingOverlap = await petWindow.webContents.executeJavaScript(`window.LainPetDebug.snapshot`);
      await petWindow.webContents.executeJavaScript(`window.LainPetDebug.setHover(false)`);
      await new Promise((resolve) => setTimeout(resolve, 80));
      const initialHostBounds = petWindow.getBounds();
      const initialSpriteBottom = await petWindow.webContents.executeJavaScript(`document.querySelector("#sprite-stage").getBoundingClientRect().bottom`);
      interactionQa.hostInitial = {
        ...initialHostBounds,
        spriteScreenBottom: Math.round((initialHostBounds.y + initialSpriteBottom) * 10) / 10,
      };
      const commentaryQaSource = [
        "I confirmed the current code is clearing Lain’s field on process spawn, before Codex accepts anything.",
        "    Every explicit newline now begins at the same left edge after normalization.",
        "The complete thinking message uses the full interior width instead of retaining broken indentation.",
        "Long unbroken paths still wrap safely: C:\\Users\\ashe\\AppData\\Local\\Programs\\Lain Pet 1.4.12\\resources\\app.asar.",
        "The panel grows vertically until every rendered line is visible.",
        "The transparent native host now grows upward with the panel instead of clipping it at the screen boundary.",
        "Lain's feet remain anchored to the same screen pixel while the window changes height.",
        "Hover expansion and the click latch share the same measured geometry.",
        "Clicking the panel again releases the latch without invoking the parent dialogue action.",
        "The collapse follows the inverse panel transition and returns the host to its compact base height.",
        "Pin, focus, reply, command telemetry, and animation state remain independent of host sizing.",
        "No binary-search clamp, passive ellipsis, hidden overflow, or clipped first line remains.",
      ].join("\n");
      petWindow.webContents.send("codex-state", {
        state: "thinking",
        threadTitle: "Install it",
        progressText: "Inspecting compact thinking state",
        stageTitle: "Preparing text transition",
        commentaryText: "Compact commentary is cached without opening the expanded transcript.",
        activity: { kind: "edit", file: "app.js", additions: 2, deletions: 2 },
      });
      await new Promise((resolve) => setTimeout(resolve, 220));
      petWindow.webContents.send("codex-state", {
        state: "thinking",
        threadTitle: "Install it",
        progressText: "Verifying UI element alignment and sizes",
        stageTitle: "Planning QA capture enhancement",
        commentaryText: commentaryQaSource,
        activity: { kind: "edit", file: "app.js", additions: 2, deletions: 2 },
      });
      // Compact updates cross-fade their visible status lines. Commentary is
      // cached, but the full panel and its task-pane loader must remain closed.
      await new Promise((resolve) => setTimeout(resolve, 80));
      interactionQa.commentaryCompactUpdate = await petWindow.webContents.executeJavaScript(`(() => {
        const output = document.querySelector("#bubble-commentary");
        const throbber = document.querySelector("#commentary-throbber");
        return {
          loading: output.dataset.loading,
          revealMs: output.dataset.revealMs,
          bubbleExpanded: document.querySelector("#activity-bubble").dataset.expanded,
          throbberVisible: getComputedStyle(throbber).display !== "none",
          progressTransition: document.querySelector("#bubble-progress").dataset.textTransition,
          stageTransition: document.querySelector("#bubble-stage").dataset.textTransition,
        };
      })()`);
      fs.writeFileSync(`${qaCaptureBase}-commentary-compact-update.png`, (await petWindow.webContents.capturePage()).toPNG());
      await new Promise((resolve) => setTimeout(resolve, 220));
      fs.writeFileSync(`${qaCaptureBase}-commentary-compact.png`, (await petWindow.webContents.capturePage()).toPNG());
      interactionQa.commentaryCompact = await petWindow.webContents.executeJavaScript(`(() => {
        const output = document.querySelector("#bubble-commentary");
        const outputRect = output.getBoundingClientRect();
        return {
          fullText: output.getAttribute("aria-label"),
          bubbleExpanded: document.querySelector("#activity-bubble").dataset.expanded,
          ariaHidden: output.getAttribute("aria-hidden"),
          outputHeight: Math.round(outputRect.height * 10) / 10,
        };
      })()`);
      interactionQa.thinkingTimeline = [];
      interactionQa.thinkingPhaseCaptures = {};
      const thinkingCaptureNames = new Set([
        "thinkingRecline",
        "thinkingEyeClose",
        "thinkingEyeOpen",
        "thinkingRecover",
        "idle",
      ]);
      for (let sample = 0; sample < 26; sample += 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const snapshot = await petWindow.webContents.executeJavaScript(`window.LainPetDebug.snapshot`);
        interactionQa.thinkingTimeline.push(snapshot);
        if (thinkingCaptureNames.has(snapshot.activeName) && !interactionQa.thinkingPhaseCaptures[snapshot.activeName]) {
          const captureName = snapshot.activeName.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
          fs.writeFileSync(`${qaCaptureBase}-${captureName}.png`, (await petWindow.webContents.capturePage()).toPNG());
          interactionQa.thinkingPhaseCaptures[snapshot.activeName] = sample;
        }
      }
      fs.writeFileSync(`${qaCaptureBase}-thinking.png`, (await petWindow.webContents.capturePage()).toPNG());
      await petWindow.webContents.executeJavaScript(`window.LainPetDebug.setHover(true)`);
      await new Promise((resolve) => setTimeout(resolve, 380));
      petWindow.webContents.send("codex-state", {
        state: "thinking",
        threadTitle: "Install it",
        progressText: "Verifying UI element alignment and sizes",
        stageTitle: "Planning QA capture enhancement",
        commentaryText: commentaryQaSource + "\nExpanded transcript updates retain the 1.2 second task-pane loader.",
        activity: { kind: "edit", file: "app.js", additions: 2, deletions: 2 },
      });
      await new Promise((resolve) => setTimeout(resolve, 220));
      fs.writeFileSync(`${qaCaptureBase}-commentary-loading.png`, (await petWindow.webContents.capturePage()).toPNG());
      interactionQa.commentaryLoading = await petWindow.webContents.executeJavaScript(`(() => {
        const output = document.querySelector("#bubble-commentary");
        const throbber = document.querySelector("#commentary-throbber");
        const throbberRect = throbber.getBoundingClientRect();
        const throbberStyle = getComputedStyle(throbber);
        return {
          loading: output.dataset.loading,
          revealMs: output.dataset.revealMs,
          bubbleExpanded: document.querySelector("#activity-bubble").dataset.expanded,
          throbberVisible: throbberStyle.display !== "none",
          throbberWidth: Math.round(Number.parseFloat(throbberStyle.width)),
          throbberHeight: Math.round(Number.parseFloat(throbberStyle.height)),
          throbberBorderWidth: Math.round(Number.parseFloat(throbberStyle.borderTopWidth) * 10) / 10,
          transformedBoundsWidth: Math.round(throbberRect.width),
          transformedBoundsHeight: Math.round(throbberRect.height),
          titlePrompt: document.querySelector("#title-throbber").textContent,
        };
      })()`);
      await new Promise((resolve) => setTimeout(resolve, 1300));
      for (let attempt = 0; attempt < 40; attempt += 1) {
        const commentaryReady = await petWindow.webContents.executeJavaScript(`(() => {
          const output = document.querySelector("#bubble-commentary");
          return output.dataset.loading === "false" && Boolean(document.querySelector("#bubble-commentary-text").textContent);
        })()`);
        if (commentaryReady) break;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      await new Promise((resolve) => setTimeout(resolve, 360));
      fs.writeFileSync(`${qaCaptureBase}-commentary-expanded.png`, (await petWindow.webContents.capturePage()).toPNG());
      interactionQa.commentaryExpanded = await petWindow.webContents.executeJavaScript(`(() => {
        const output = document.querySelector("#bubble-commentary");
        const activity = document.querySelector("#bubble-activity");
        const stage = document.querySelector("#bubble-stage");
        const text = document.querySelector("#bubble-commentary-text");
        const outputRect = output.getBoundingClientRect();
        const activityRect = activity.getBoundingClientRect();
        const textRect = text.getBoundingClientRect();
        const outputStyle = getComputedStyle(output);
        const contentTop = outputRect.top + Number.parseFloat(outputStyle.borderTopWidth) + Number.parseFloat(outputStyle.paddingTop);
        const contentBottom = outputRect.bottom - Number.parseFloat(outputStyle.borderBottomWidth) - Number.parseFloat(outputStyle.paddingBottom);
        const visibleText = text.textContent;
        return {
          fullText: output.getAttribute("aria-label"),
          visibleText,
          truncated: output.dataset.truncated,
          passiveDots: visibleText.endsWith("..."),
          completeTextVisible: visibleText === output.getAttribute("aria-label"),
          everyLineStartsFlush: visibleText.split("\\n").every((line) => line === line.trimStart()),
          contentFits: textRect.top >= contentTop - 1 && textRect.bottom <= contentBottom + 1,
          scrollHeight: output.scrollHeight,
          clientHeight: output.clientHeight,
          measuredHeight: output.dataset.measuredHeight,
          textHeight: Math.round(textRect.height * 10) / 10,
          textTop: Math.round(textRect.top * 10) / 10,
          textBottom: Math.round(textRect.bottom * 10) / 10,
          contentTop: Math.round(contentTop * 10) / 10,
          contentBottom: Math.round(contentBottom * 10) / 10,
          bubbleExpanded: document.querySelector("#activity-bubble").dataset.expanded,
          ariaHidden: output.getAttribute("aria-hidden"),
          outputHeight: Math.round(outputRect.height * 10) / 10,
          outputMaxHeight: getComputedStyle(output).maxHeight,
          outputFontSize: getComputedStyle(output).fontSize,
          stageFontSize: getComputedStyle(stage).fontSize,
          activityFontSize: getComputedStyle(activity).fontSize,
          activityBelowOutput: activityRect.top >= outputRect.bottom,
        };
      })()`);
      const expandedHostBounds = petWindow.getBounds();
      const expandedHostGeometry = await petWindow.webContents.executeJavaScript(`(() => {
        const bubble = document.querySelector("#activity-bubble").getBoundingClientRect();
        const sprite = document.querySelector("#sprite-stage").getBoundingClientRect();
        return {
          bubbleTop: Math.round(bubble.top * 10) / 10,
          bubbleBottom: Math.round(bubble.bottom * 10) / 10,
          spriteBottom: Math.round(sprite.bottom * 10) / 10,
          viewportHeight: innerHeight,
          requestedHeight: window.LainPetDebug.snapshot.requestedHostHeight,
        };
      })()`);
      interactionQa.hostExpanded = {
        ...expandedHostBounds,
        ...expandedHostGeometry,
        completeBubbleVisible: expandedHostGeometry.bubbleTop >= 0,
        grewBeyondBase: expandedHostBounds.height > BASE_WINDOW_HEIGHT,
        spriteScreenBottom: Math.round((expandedHostBounds.y + expandedHostGeometry.spriteBottom) * 10) / 10,
        spriteAnchorStable: Math.abs(
          expandedHostBounds.y + expandedHostGeometry.spriteBottom - interactionQa.hostInitial.spriteScreenBottom
        ) <= 1,
      };
      interactionQa.commentaryClickIsolation = await petWindow.webContents.executeJavaScript(`(() => {
        const output = document.querySelector("#bubble-commentary");
        const feedback = document.querySelector("#bubble-feedback");
        output.click();
        return {
          latched: output.dataset.latched,
          feedbackHidden: feedback.hidden,
          feedbackText: feedback.textContent,
        };
      })()`);
      await petWindow.webContents.executeJavaScript(`window.LainPetDebug.setHover(false)`);
      await new Promise((resolve) => setTimeout(resolve, 320));
      fs.writeFileSync(`${qaCaptureBase}-commentary-latched.png`, (await petWindow.webContents.capturePage()).toPNG());
      interactionQa.commentaryLatched = await petWindow.webContents.executeJavaScript(`(() => {
        const output = document.querySelector("#bubble-commentary");
        return {
          latched: output.dataset.latched,
          bubbleExpanded: document.querySelector("#activity-bubble").dataset.expanded,
          ariaHidden: output.getAttribute("aria-hidden"),
          outputHeight: Math.round(output.getBoundingClientRect().height * 10) / 10,
          glow: getComputedStyle(output).boxShadow,
        };
      })()`);
      interactionQa.commentaryLatched.heightStable = Math.abs(
        interactionQa.commentaryLatched.outputHeight - interactionQa.commentaryExpanded.outputHeight,
      ) <= 1;
      const latchedHostBounds = petWindow.getBounds();
      const latchedSpriteBottom = await petWindow.webContents.executeJavaScript(`document.querySelector("#sprite-stage").getBoundingClientRect().bottom`);
      interactionQa.hostLatched = {
        ...latchedHostBounds,
        stayedExpanded: latchedHostBounds.height === expandedHostBounds.height,
        spriteScreenBottom: Math.round((latchedHostBounds.y + latchedSpriteBottom) * 10) / 10,
        spriteAnchorStable: Math.abs(
          latchedHostBounds.y + latchedSpriteBottom - interactionQa.hostInitial.spriteScreenBottom
        ) <= 1,
      };
      await petWindow.webContents.executeJavaScript(`document.querySelector("#bubble-commentary").click()`);
      await new Promise((resolve) => setTimeout(resolve, 130));
      interactionQa.commentaryCollapseMid = await petWindow.webContents.executeJavaScript(`Math.round(document.querySelector("#bubble-commentary").getBoundingClientRect().height * 10) / 10`);
      await new Promise((resolve) => setTimeout(resolve, 190));
      fs.writeFileSync(`${qaCaptureBase}-commentary-collapsed.png`, (await petWindow.webContents.capturePage()).toPNG());
      interactionQa.commentaryCollapsed = await petWindow.webContents.executeJavaScript(`(() => {
        const output = document.querySelector("#bubble-commentary");
        return {
          bubbleExpanded: document.querySelector("#activity-bubble").dataset.expanded,
          ariaHidden: output.getAttribute("aria-hidden"),
          outputHeight: Math.round(output.getBoundingClientRect().height * 10) / 10,
        };
      })()`);
      const collapsedHostBounds = petWindow.getBounds();
      const collapsedSpriteBottom = await petWindow.webContents.executeJavaScript(`document.querySelector("#sprite-stage").getBoundingClientRect().bottom`);
      interactionQa.hostCollapsed = {
        ...collapsedHostBounds,
        returnedToBase: collapsedHostBounds.height === BASE_WINDOW_HEIGHT,
        spriteScreenBottom: Math.round((collapsedHostBounds.y + collapsedSpriteBottom) * 10) / 10,
        spriteAnchorStable: Math.abs(
          collapsedHostBounds.y + collapsedSpriteBottom - interactionQa.hostInitial.spriteScreenBottom
        ) <= 1,
      };
      interactionQa.pinClickIsolation = await petWindow.webContents.executeJavaScript(`(() => {
        const pin = document.querySelector("#pin-toggle");
        const feedback = document.querySelector("#bubble-feedback");
        pin.click();
        return { feedbackHidden: feedback.hidden, feedbackText: feedback.textContent };
      })()`);
      await new Promise((resolve) => setTimeout(resolve, 120));
      await petWindow.webContents.executeJavaScript(`document.querySelector("#pin-toggle").click()`);
      await new Promise((resolve) => setTimeout(resolve, 120));
      petWindow.webContents.send("codex-state", {
        state: "thinking",
        threadTitle: "Install it",
        progressText: "Verifying live command telemetry",
        stageTitle: "Run packaged UI capture",
        activity: { kind: "command", startedAt: Date.now() - 12300 },
      });
      await new Promise((resolve) => setTimeout(resolve, 80));
      interactionQa.commandBeforeTick = await petWindow.webContents.executeJavaScript(`document.querySelector("#bubble-activity-text").textContent`);
      await new Promise((resolve) => setTimeout(resolve, 1050));
      fs.writeFileSync(`${qaCaptureBase}-command.png`, (await petWindow.webContents.capturePage()).toPNG());
      interactionQa.command = await petWindow.webContents.executeJavaScript(`(() => {
        const title = document.querySelector("#bubble-title-text").getBoundingClientRect();
        const titleDots = document.querySelector("#title-loading-dots").getBoundingClientRect();
        const activityDots = document.querySelector("#activity-loading-dots");
        const activityTextRect = document.querySelector("#bubble-activity-text").getBoundingClientRect();
        const activityDotsRect = activityDots.getBoundingClientRect();
        const titleThrobber = document.querySelector("#title-throbber");
        const titleThrobberStyle = getComputedStyle(titleThrobber);
        const titleLine = document.querySelector("#bubble-title");
        const baselineProbe = document.createElement("span");
        baselineProbe.style.cssText = "display:block;width:0;height:0;padding:0;margin:0";
        titleLine.append(baselineProbe);
        const baseline = baselineProbe.getBoundingClientRect().bottom;
        baselineProbe.remove();
        return {
          afterTick: document.querySelector("#bubble-activity-text").textContent,
          activityDotsActive: activityDots.dataset.active,
          titleDotsActive: document.querySelector("#title-loading-dots").dataset.active,
          titleThrobberActive: titleThrobber.dataset.active,
          titlePrompt: titleThrobber.textContent,
          titleThrobberAnimation: titleThrobberStyle.animationName,
          titleThrobberDuration: titleThrobberStyle.animationDuration,
          activityDotGap: Math.round((activityDotsRect.left - activityTextRect.right) * 10) / 10,
          titleLineBoxDescent: Math.round(Math.abs(title.bottom - titleDots.bottom) * 10) / 10,
          titleBaselineDelta: Math.round(Math.abs(baseline - titleDots.bottom) * 10) / 10,
        };
      })()`);
      interactionQa.command.beforeTick = interactionQa.commandBeforeTick;
      interactionQa.hoverStart = null;
      for (let attempt = 0; attempt < 60; attempt += 1) {
        const snapshot = await petWindow.webContents.executeJavaScript(`window.LainPetDebug.snapshot`);
        if (snapshot.thinkingReclined && snapshot.activeName !== "thinkingRecover") {
          interactionQa.hoverStart = snapshot;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      await petWindow.webContents.executeJavaScript(`window.LainPetDebug.setHover(true)`);
      await new Promise((resolve) => setTimeout(resolve, 60));
      fs.writeFileSync(`${qaCaptureBase}-hover-return.png`, (await petWindow.webContents.capturePage()).toPNG());
      interactionQa.hoverReturn = await petWindow.webContents.executeJavaScript(`window.LainPetDebug.snapshot`);
      interactionQa.hoverRecoveryTimeline = [interactionQa.hoverReturn];
      for (let attempt = 0; attempt < 60; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const snapshot = await petWindow.webContents.executeJavaScript(`window.LainPetDebug.snapshot`);
        interactionQa.hoverRecoveryTimeline.push(snapshot);
        if (snapshot.activeName === "idle" && snapshot.hoverSettled) break;
      }
      fs.writeFileSync(`${qaCaptureBase}-hover-idle.png`, (await petWindow.webContents.capturePage()).toPNG());
      interactionQa.hoverIdle = await petWindow.webContents.executeJavaScript(`window.LainPetDebug.snapshot`);
      for (let attempt = 0; attempt < 40; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const snapshot = await petWindow.webContents.executeJavaScript(`window.LainPetDebug.snapshot`);
        if (snapshot.activeName === "hover") break;
      }
      fs.writeFileSync(`${qaCaptureBase}-hover-active.png`, (await petWindow.webContents.capturePage()).toPNG());
      interactionQa.hoverActive = await petWindow.webContents.executeJavaScript(`window.LainPetDebug.snapshot`);
      await petWindow.webContents.executeJavaScript(`window.LainPetDebug.setHover(false)`);
      await new Promise((resolve) => setTimeout(resolve, 60));
      interactionQa.hoverAfterLeave = await petWindow.webContents.executeJavaScript(`window.LainPetDebug.snapshot`);
      await new Promise((resolve) => setTimeout(resolve, 900));
      try {
        const waitForDebugSnapshot = async (predicate, timeoutMs = 2500) => {
          const startedAt = Date.now();
          let snapshot = await petWindow.webContents.executeJavaScript(`window.LainPetDebug.snapshot`);
          while (!predicate(snapshot) && Date.now() - startedAt < timeoutMs) {
            await new Promise((resolve) => setTimeout(resolve, 10));
            snapshot = await petWindow.webContents.executeJavaScript(`window.LainPetDebug.snapshot`);
          }
          return {
            elapsedMs: Date.now() - startedAt,
            timedOut: !predicate(snapshot),
            snapshot,
          };
        };
        const readVisualSnapshot = () => petWindow.webContents.executeJavaScript(`(() => {
          const snapshot = window.LainPetDebug.snapshot;
          const sprite = document.querySelector("#sprite");
          const style = getComputedStyle(sprite);
          const transform = style.transform;
          let transformScaleX = 1;
          try {
            transformScaleX = transform === "none" ? 1 : new DOMMatrixReadOnly(transform).a;
          } catch {}
          return {
            ...snapshot,
            reclineDatasetMirrored: sprite.dataset.reclineMirrored,
            pulseKind: sprite.dataset.pulseKind,
            animationName: style.animationName,
            transform,
            transformScaleX,
          };
        })()`);

        featureQa.deterministicVisual = await petWindow.webContents.executeJavaScript(`(() => {
          const params = new URL(location.href).searchParams;
          return {
            queryValue: params.get("deterministicVisual"),
            enabled: params.get("deterministicVisual") === "1",
            locationSearch: location.search,
          };
        })()`);

        const longThreadTitle = "A deliberately long active thread title that must stay on one line and truncate before both title controls";
        await petWindow.webContents.executeJavaScript(`(() => {
          const input = document.querySelector("#reply-input");
          input.blur();
          window.LainPetDebug.setHover(false);
          window.LainPetDebug.setCodexState({
            state: "waiting",
            threadTitle: "A deliberately long active thread title that must stay on one line and truncate before both title controls",
            request: { summary: "Lain needs your decision.", actionable: false },
          });
          window.LainPetDebug.play("waiting");
        })()`);
        await new Promise((resolve) => setTimeout(resolve, 220));
        featureQa.titleControls = await petWindow.webContents.executeJavaScript(`(() => {
          const row = document.querySelector("#bubble-title-row");
          const title = document.querySelector("#bubble-title");
          const titleText = document.querySelector("#bubble-title-text");
          const controls = document.querySelector("#bubble-controls");
          const minimize = document.querySelector("#minimize-toggle");
          const pin = document.querySelector("#pin-toggle");
          const spriteStage = document.querySelector("#sprite-stage");
          const minimizeRect = minimize?.getBoundingClientRect();
          const pinRect = pin?.getBoundingClientRect();
          const titleStyle = getComputedStyle(title);
          const titleTextStyle = getComputedStyle(titleText);
          return {
            rowExists: Boolean(row),
            controlsExist: Boolean(controls && minimize && pin),
            controlOrder: controls ? [...controls.children].map((control) => control.id) : [],
            minimizeRect: minimizeRect ? {
              left: minimizeRect.left,
              right: minimizeRect.right,
              width: minimizeRect.width,
              height: minimizeRect.height,
            } : null,
            pinRect: pinRect ? {
              left: pinRect.left,
              right: pinRect.right,
              width: pinRect.width,
              height: pinRect.height,
            } : null,
            equalSize: Boolean(minimizeRect && pinRect)
              && Math.abs(minimizeRect.width - pinRect.width) <= 0.1
              && Math.abs(minimizeRect.height - pinRect.height) <= 0.1,
            minimizeLeftOfPin: Boolean(minimizeRect && pinRect) && minimizeRect.right <= pinRect.left,
            renderedTitle: titleText?.textContent || "",
            titleWhiteSpace: titleStyle.whiteSpace,
            titleOverflow: titleStyle.overflow,
            titleTextOverflow: titleTextStyle.textOverflow,
            titleClientWidth: titleText?.clientWidth || 0,
            titleScrollWidth: titleText?.scrollWidth || 0,
            longTitleTruncated: Boolean(titleText) && titleText.scrollWidth > titleText.clientWidth,
            spriteStageTitle: spriteStage?.getAttribute("title") ?? null,
            spriteStageTitledDescendants: spriteStage?.querySelectorAll("[title]").length ?? -1,
          };
        })()`);
        featureQa.titleControls.screenshot = qaCaptureBase + "-title-controls.png";
        fs.writeFileSync(
          featureQa.titleControls.screenshot,
          (await petWindow.webContents.capturePage()).toPNG(),
        );
        await petWindow.webContents.executeJavaScript(`(() => {
          window.__qaMinimizeBubbleClicks = 0;
          window.__qaMinimizeBubbleListener = () => { window.__qaMinimizeBubbleClicks += 1; };
          document.querySelector("#activity-bubble").addEventListener("click", window.__qaMinimizeBubbleListener);
        })()`);
        const minimizeRequestsBefore = qaMinimizeRequests;
        const visibleBeforeMinimize = petWindow.isVisible();
        await petWindow.webContents.executeJavaScript(`document.querySelector("#minimize-toggle").click()`);
        for (let attempt = 0; attempt < 40 && qaMinimizeRequests === minimizeRequestsBefore; attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        featureQa.titleControls.minimize = {
          requestsBefore: minimizeRequestsBefore,
          requestsAfter: qaMinimizeRequests,
          visibleBefore: visibleBeforeMinimize,
          visibleAfter: petWindow.isVisible(),
          minimizedAfter: petWindow.isMinimized(),
          bubbleClickCount: await petWindow.webContents.executeJavaScript(`(() => {
            const count = window.__qaMinimizeBubbleClicks;
            document.querySelector("#activity-bubble").removeEventListener("click", window.__qaMinimizeBubbleListener);
            delete window.__qaMinimizeBubbleClicks;
            delete window.__qaMinimizeBubbleListener;
            return count;
          })()`),
        };
        const nativeVisibleBefore = petWindow.isVisible();
        const nativeHideResult = hidePetWindow(petWindow);
        await new Promise((resolve) => setTimeout(resolve, 80));
        const nativeHiddenAfterHide = !petWindow.isVisible();
        const nativeShowResult = showPet();
        await new Promise((resolve) => setTimeout(resolve, 80));
        featureQa.titleControls.nativeWindowActions = {
          visibleBefore: nativeVisibleBefore,
          hideResult: nativeHideResult,
          hiddenAfterHide: nativeHiddenAfterHide,
          showResult: nativeShowResult,
          visibleAfterShow: petWindow.isVisible(),
          pinStateReapplied: petWindow.isAlwaysOnTop() === pinned,
        };

        featureQa.movementHandoff = await petWindow.webContents.executeJavaScript(`(async () => {
          const requestedAt = performance.now();
          window.LainPetDebug.beginDrag("left");
          const immediate = window.LainPetDebug.snapshot;
          let began = null;
          while (performance.now() - requestedAt < 1500) {
            const snapshot = window.LainPetDebug.snapshot;
            if (snapshot.activeName === "moveLeft") {
              began = snapshot;
              break;
            }
            await new Promise((resolve) => setTimeout(resolve, 2));
          }
          return {
            immediate,
            began,
            handoffElapsedMs: Math.round((performance.now() - requestedAt) * 10) / 10,
          };
        })()`);
        featureQa.movementHandoff.end = await petWindow.webContents.executeJavaScript(`(() => {
          window.LainPetDebug.endDrag();
          return {
            ...window.LainPetDebug.snapshot,
            bodyDragging: document.body.classList.contains("dragging"),
          };
        })()`);
        featureQa.movementHandoff.recovered = await waitForDebugSnapshot(
          (snapshot) => snapshot.activeName === "waiting" && !snapshot.dragging,
        );

        const runRestCycle = async (captureSuffix) => {
          await petWindow.webContents.executeJavaScript(`(() => {
            window.LainPetDebug.setHover(false);
            window.LainPetDebug.setCodexState({ state: "idle", threadTitle: "Deterministic recline QA" });
            window.LainPetDebug.play("layDown");
          })()`);
          const layDown = await readVisualSnapshot();
          const sleepingWait = await waitForDebugSnapshot((snapshot) => snapshot.activeName === "sleeping");
          const sleeping = await readVisualSnapshot();
          let screenshot = null;
          if (!sleepingWait.timedOut && sleeping.activeName === "sleeping") {
            screenshot = qaCaptureBase + "-" + captureSuffix + ".png";
            fs.writeFileSync(screenshot, (await petWindow.webContents.capturePage()).toPNG());
          }
          await petWindow.webContents.executeJavaScript(`window.LainPetDebug.setHover(true)`);
          const wakeWait = await waitForDebugSnapshot((snapshot) => snapshot.activeName === "wake");
          const wake = await readVisualSnapshot();
          await petWindow.webContents.executeJavaScript(`(() => {
            window.LainPetDebug.setCodexState({
              state: "waiting",
              threadTitle: "Deterministic recline QA",
              request: { summary: "Continue QA.", actionable: false },
            });
            window.LainPetDebug.setHover(false);
          })()`);
          const settled = await waitForDebugSnapshot(
            (snapshot) => snapshot.activeName === "waiting" && snapshot.reclineKind === null,
          );
          return { layDown, sleepingWait, sleeping, wakeWait, wake, settled, screenshot };
        };

        featureQa.recline = {
          first: await runRestCycle("recline-unmirrored"),
          second: await runRestCycle("recline-mirrored"),
        };

        await petWindow.webContents.executeJavaScript(`(() => {
          window.LainPetDebug.setCodexState({ state: "idle", threadTitle: "Deterministic failed QA" });
          window.LainPetDebug.play("failed");
        })()`);
        const firstFailed = await readVisualSnapshot();
        await petWindow.webContents.executeJavaScript(`window.LainPetDebug.play("failed")`);
        const secondFailed = await readVisualSnapshot();
        featureQa.failed = { first: firstFailed, second: secondFailed };

        await petWindow.webContents.executeJavaScript(`(() => {
          window.LainPetDebug.setHover(false);
          window.LainPetDebug.setCodexState({
            state: "waiting",
            threadTitle: "Install it",
            request: { summary: "Lain needs your decision.", actionable: false },
          });
          window.LainPetDebug.play("waiting");
        })()`);

        const firstRest = featureQa.recline.first;
        const secondRest = featureQa.recline.second;
        featureQa.checks = {
          deterministicVisualEnabled:
            featureQa.deterministicVisual.enabled
            && featureQa.deterministicVisual.queryValue === "1",
          titleControlsExistAndMatch:
            featureQa.titleControls.rowExists
            && featureQa.titleControls.controlsExist
            && featureQa.titleControls.equalSize,
          titleControlsOrdered:
            featureQa.titleControls.minimizeLeftOfPin
            && featureQa.titleControls.controlOrder.join(",") === "minimize-toggle,pin-toggle",
          titleTruncatesOnOneLine:
            featureQa.titleControls.renderedTitle === longThreadTitle
            && featureQa.titleControls.titleWhiteSpace === "nowrap"
            && featureQa.titleControls.titleOverflow === "hidden"
            && featureQa.titleControls.titleTextOverflow === "ellipsis"
            && featureQa.titleControls.longTitleTruncated,
          spriteStageHasNoTitle:
            featureQa.titleControls.spriteStageTitle === null
            && featureQa.titleControls.spriteStageTitledDescendants === 0,
          minimizeHandledWithoutHiding:
            featureQa.titleControls.minimize.requestsAfter === minimizeRequestsBefore + 1
            && featureQa.titleControls.minimize.visibleBefore
            && featureQa.titleControls.minimize.visibleAfter
            && !featureQa.titleControls.minimize.minimizedAfter
            && featureQa.titleControls.minimize.bubbleClickCount === 0,
          nativeWindowHideAndRestore:
            featureQa.titleControls.nativeWindowActions.visibleBefore
            && featureQa.titleControls.nativeWindowActions.hideResult
            && featureQa.titleControls.nativeWindowActions.hiddenAfterHide
            && featureQa.titleControls.nativeWindowActions.showResult
            && featureQa.titleControls.nativeWindowActions.visibleAfterShow
            && featureQa.titleControls.nativeWindowActions.pinStateReapplied,
          movementWaitsForBoundary:
            featureQa.movementHandoff.immediate.activeName === "waiting"
            && featureQa.movementHandoff.immediate.framePlaybackRate === 3
            && featureQa.movementHandoff.immediate.movementHandoffTarget === "moveLeft",
          movementBeginsAtFrameZero:
            featureQa.movementHandoff.began?.activeName === "moveLeft"
            && featureQa.movementHandoff.began?.frameIndex === 0
            && featureQa.movementHandoff.began?.framePlaybackRate === 1
            && featureQa.movementHandoff.began?.movementHandoffTarget === null,
          movementHandoffTiming:
            featureQa.movementHandoff.handoffElapsedMs > 0
            && featureQa.movementHandoff.handoffElapsedMs <= 1000,
          movementEndsCleanly:
            !featureQa.movementHandoff.end.dragging
            && !featureQa.movementHandoff.end.movedDuringDrag
            && !featureQa.movementHandoff.end.bodyDragging
            && featureQa.movementHandoff.end.movementHandoffTarget === null
            && featureQa.movementHandoff.end.framePlaybackRate === 1
            && !featureQa.movementHandoff.recovered.timedOut,
          firstRestUnmirrored:
            firstRest.layDown.activeName === "layDown"
            && firstRest.layDown.reclineKind === "rest"
            && firstRest.layDown.reclineMirrored === false
            && firstRest.layDown.reclineDatasetMirrored === "false",
          secondRestMirrored:
            secondRest.layDown.activeName === "layDown"
            && secondRest.layDown.reclineKind === "rest"
            && secondRest.layDown.reclineMirrored === true
            && secondRest.layDown.reclineDatasetMirrored === "true",
          restOrientationStable:
            firstRest.sleeping.activeName === "sleeping"
            && firstRest.wake.activeName === "wake"
            && firstRest.sleeping.reclineMirrored === firstRest.layDown.reclineMirrored
            && firstRest.wake.reclineMirrored === firstRest.layDown.reclineMirrored
            && firstRest.sleeping.reclineDatasetMirrored === firstRest.layDown.reclineDatasetMirrored
            && firstRest.wake.reclineDatasetMirrored === firstRest.layDown.reclineDatasetMirrored
            && secondRest.sleeping.activeName === "sleeping"
            && secondRest.wake.activeName === "wake"
            && secondRest.sleeping.reclineMirrored === secondRest.layDown.reclineMirrored
            && secondRest.wake.reclineMirrored === secondRest.layDown.reclineMirrored
            && secondRest.sleeping.reclineDatasetMirrored === secondRest.layDown.reclineDatasetMirrored
            && secondRest.wake.reclineDatasetMirrored === secondRest.layDown.reclineDatasetMirrored,
          restCyclesSettleCleanly:
            !firstRest.sleepingWait.timedOut
            && !firstRest.wakeWait.timedOut
            && !firstRest.settled.timedOut
            && !secondRest.sleepingWait.timedOut
            && !secondRest.wakeWait.timedOut
            && !secondRest.settled.timedOut,
          breathingPreservesOrientationSign:
            firstRest.sleeping.pulseKind === "sleeping"
            && firstRest.sleeping.animationName.includes("sleeping-breathe")
            && firstRest.sleeping.transformScaleX > 0
            && secondRest.sleeping.pulseKind === "sleeping"
            && secondRest.sleeping.animationName.includes("sleeping-breathe")
            && secondRest.sleeping.transformScaleX < 0,
          failedRunsAlternate:
            firstFailed.activeName === "failed"
            && firstFailed.reclineKind === "failed"
            && firstFailed.reclineMirrored === false
            && firstFailed.reclineDatasetMirrored === "false"
            && firstFailed.transformScaleX > 0
            && secondFailed.activeName === "failed"
            && secondFailed.reclineKind === "failed"
            && secondFailed.reclineMirrored === true
            && secondFailed.reclineDatasetMirrored === "true"
            && secondFailed.transformScaleX < 0,
        };
        featureQaPassed = Object.values(featureQa.checks).every(Boolean);
      } catch (error) {
        featureQa.qaError = error?.stack || error?.message || String(error);
        featureQaPassed = false;
        try {
          await petWindow.webContents.executeJavaScript(`(() => {
            window.LainPetDebug.endDrag();
            window.LainPetDebug.setHover(false);
            window.LainPetDebug.setCodexState({
              state: "waiting",
              threadTitle: "Install it",
              request: { summary: "Lain needs your decision.", actionable: false },
            });
            window.LainPetDebug.play("waiting");
          })()`);
        } catch {}
      }
      petWindow.webContents.send("codex-state", {
        state: "waiting",
        threadTitle: "Install it",
        request: { summary: "Lain needs your decision.", actionable: false },
      });
      await new Promise((resolve) => setTimeout(resolve, 260));
      fs.writeFileSync(`${qaCaptureBase}-waiting.png`, (await petWindow.webContents.capturePage()).toPNG());
      petWindow.webContents.send("codex-state", {
        state: "idle",
        reviewId: "qa-final",
        threadTitle: "Install it",
        finalText: [
          "Installed and running Lain Pet 1.4.12.",
          "Captures the complete latest Codex commentary separately from short stage text.",
          "Displays every line beneath the thinking stage and above the activity row.",
          "Expands vertically to the full message without adding a truncation ellipsis.",
          "The native transparent host expands upward to contain the complete rendered bubble.",
          "Lain remains anchored while the host grows and while the panel is latched open.",
          "Clicking the panel again reverses the expansion and restores the compact host.",
          "Every explicit newline begins at the same left edge and long paths wrap safely.",
          "The commentary and pin controls stay isolated from the parent focus action.",
          "Typography hierarchy: stage 10px, commentary 9.5px, activity 9px.",
          "Bubble remains 18.2px above Lain without clipping.",
          "Autostart targets 1.4.12; 1.4.11 is preserved as rollback.",
        ].join("\n"),
      });
      await new Promise((resolve) => setTimeout(resolve, 300));
      fs.writeFileSync(`${qaCaptureBase}-final-compact.png`, (await petWindow.webContents.capturePage()).toPNG());
      interactionQa.finalCompact = await petWindow.webContents.executeJavaScript(`(() => {
        const output = document.querySelector("#bubble-commentary");
        return {
          detail: document.querySelector("#bubble-detail-text").textContent,
          fullText: output.getAttribute("aria-label"),
          bubbleExpanded: document.querySelector("#activity-bubble").dataset.expanded,
          outputHeight: Math.round(output.getBoundingClientRect().height * 10) / 10,
        };
      })()`);
      await petWindow.webContents.executeJavaScript(`window.LainPetDebug.setHover(true)`);
      await new Promise((resolve) => setTimeout(resolve, 380));
      fs.writeFileSync(`${qaCaptureBase}-final-expanded.png`, (await petWindow.webContents.capturePage()).toPNG());
      interactionQa.finalExpanded = await petWindow.webContents.executeJavaScript(`(() => {
        const output = document.querySelector("#bubble-commentary");
        const text = document.querySelector("#bubble-commentary-text");
        const visibleText = text.textContent;
        const outputRect = output.getBoundingClientRect();
        const textRect = text.getBoundingClientRect();
        const outputStyle = getComputedStyle(output);
        const contentTop = outputRect.top + Number.parseFloat(outputStyle.borderTopWidth) + Number.parseFloat(outputStyle.paddingTop);
        const contentBottom = outputRect.bottom - Number.parseFloat(outputStyle.borderBottomWidth) - Number.parseFloat(outputStyle.paddingBottom);
        return {
          detail: document.querySelector("#bubble-detail-text").textContent,
          visibleText,
          truncated: output.dataset.truncated,
          passiveDots: visibleText.endsWith("..."),
          completeTextVisible: visibleText === output.getAttribute("aria-label"),
          contentFits: textRect.top >= contentTop - 1 && textRect.bottom <= contentBottom + 1,
          scrollHeight: output.scrollHeight,
          clientHeight: output.clientHeight,
          measuredHeight: output.dataset.measuredHeight,
          textTop: Math.round(textRect.top * 10) / 10,
          textBottom: Math.round(textRect.bottom * 10) / 10,
          contentTop: Math.round(contentTop * 10) / 10,
          contentBottom: Math.round(contentBottom * 10) / 10,
          bubbleExpanded: document.querySelector("#activity-bubble").dataset.expanded,
          outputHeight: Math.round(output.getBoundingClientRect().height * 10) / 10,
        };
      })()`);
      const finalHostBounds = petWindow.getBounds();
      const finalHostGeometry = await petWindow.webContents.executeJavaScript(`(() => {
        const bubble = document.querySelector("#activity-bubble").getBoundingClientRect();
        const sprite = document.querySelector("#sprite-stage").getBoundingClientRect();
        return { bubbleTop: bubble.top, spriteBottom: sprite.bottom, viewportHeight: innerHeight };
      })()`);
      interactionQa.hostFinalExpanded = {
        ...finalHostBounds,
        completeBubbleVisible: finalHostGeometry.bubbleTop >= 0,
        grewBeyondBase: finalHostBounds.height > BASE_WINDOW_HEIGHT,
        viewportMatchesWindow: finalHostGeometry.viewportHeight === finalHostBounds.height,
        spriteAnchorStable: Math.abs(
          finalHostBounds.y + finalHostGeometry.spriteBottom - interactionQa.hostInitial.spriteScreenBottom
        ) <= 1,
      };
      await petWindow.webContents.executeJavaScript(`window.LainPetDebug.setHover(false)`);
      await new Promise((resolve) => setTimeout(resolve, 320));
      petWindow.webContents.send("codex-state", { state: "idle", threadTitle: "Install it" });
      await new Promise((resolve) => setTimeout(resolve, 900));
      await petWindow.webContents.executeJavaScript(`(() => {
        window.LainPetDebug.setHover(true);
        const input = document.querySelector("#reply-input");
        input.focus();
        input.value = Array.from({ length: 12 }, (_, index) => "line " + (index + 1) + " from the reply field").join("\\n");
        input.dispatchEvent(new Event("input", { bubbles: true }));
      })()`);
      await new Promise((resolve) => setTimeout(resolve, 300));
      fs.writeFileSync(`${qaCaptureBase}-reply.png`, (await petWindow.webContents.capturePage()).toPNG());
      interactionQa.focusResult = await petWindow.webContents.executeJavaScript(`window.LainPetDebug.requestHostFocus()`);
      await new Promise((resolve) => setTimeout(resolve, 650));
      interactionQa.petAlwaysOnTopAfterFocus = petWindow.isAlwaysOnTop();
      interactionQa.petFocusableAfterFocus = petWindow.isFocusable();
      interactionQa.focusedMainCodexOnly = ["ChatGPT", "Codex"].includes(interactionQa.focusResult?.title)
        && interactionQa.focusResult?.protocolLaunched === false;
      let metrics;
      try {
        metrics = await Promise.race([petWindow.webContents.executeJavaScript(`(async () => {
        const input = document.querySelector("#reply-input");
        const form = document.querySelector("#reply-form");
        const bubble = document.querySelector("#activity-bubble");
        const tail = document.querySelector("#bubble-tail");
        const sprite = document.querySelector("#sprite");
        const pin = document.querySelector("#pin-toggle");
        const inputRect = input.getBoundingClientRect();
        const formRect = form.getBoundingClientRect();
        const bubbleRect = bubble.getBoundingClientRect();
        const tailRect = tail.getBoundingClientRect();
        const spriteRect = sprite.getBoundingClientRect();
        const probe = new Image();
        probe.src = "../assets/atlas/r0-f0.png";
        await probe.decode();
        const canvas = document.createElement("canvas");
        canvas.width = probe.naturalWidth;
        canvas.height = probe.naturalHeight;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(probe, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let firstOpaqueY = canvas.height;
        for (let y = 0; y < canvas.height && firstOpaqueY === canvas.height; y += 1) {
          for (let x = 0; x < canvas.width; x += 1) {
            if (pixels[(y * canvas.width + x) * 4 + 3] > 8) { firstOpaqueY = y; break; }
          }
        }
        const containScale = Math.min(spriteRect.width / probe.naturalWidth, spriteRect.height / probe.naturalHeight);
        const drawnHeight = probe.naturalHeight * containScale;
        const spriteImageTop = spriteRect.top + (spriteRect.height - drawnHeight) / 2;
        const firstOpaqueScreenY = spriteImageTop + firstOpaqueY * containScale;
        return {
          inputHeight: inputRect.height,
          inputScrollHeight: input.scrollHeight,
          inputWidth: inputRect.width,
          formInnerWidth: form.clientWidth,
          overflowY: getComputedStyle(input).overflowY,
          overflowFlag: input.dataset.overflow,
          sendButtonAbsent: document.querySelector("#reply-submit") === null,
          horizontalFit: inputRect.left >= formRect.left && inputRect.right <= formRect.right,
          bubbleHeight: bubbleRect.height,
          bubbleToVisibleSpriteGap: Math.round((firstOpaqueScreenY - tailRect.bottom) * 10) / 10,
          pinPressed: pin.getAttribute("aria-pressed"),
          sessionTitle: document.querySelector("#bubble-title-text").textContent,
        };
        })()`), new Promise((_, reject) => setTimeout(() => reject(new Error("QA metrics timed out")), 5000))]);
      } catch (error) {
        metrics = { qaError: error.message };
      }
      metrics.interactionQa = interactionQa;
      metrics.featureQa = featureQa;
      metrics.featureQaPassed = featureQaPassed;
      fs.writeFileSync(`${qaCaptureBase}-metrics.json`, JSON.stringify(metrics, null, 2));
      if (!featureQaPassed) process.exitCode = 1;
      app.quit();
    }
  });
  petWindow.once("ready-to-show", () => {
    if (qaMode || !launchWithCodex) showPet({ inactive: true });
    else showWhenCodexStarts();
  });
  petWindow.on("moved", savePosition);
}

function createTray() {
  const iconPath = path.join(__dirname, "..", "assets", "atlas", "r0-f0.png");
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 24, height: 24 });
  tray = new Tray(icon);
  tray.setToolTip("Lain Pet");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Show Lain", click: () => showPet() },
    { label: "Center on screen", click: () => {
      const area = screen.getPrimaryDisplay().workArea;
      const bounds = petWindow.getBounds();
      petWindow.setPosition(area.x + Math.round((area.width - bounds.width) / 2), area.y + Math.round((area.height - bounds.height) / 2));
    } },
    { type: "separator" },
    { label: "Quit", click: () => app.quit() },
  ]));
  tray.on("double-click", () => showPet());
}

app.whenReady().then(() => {
  enableCodexStartup();
  createWindow();
  if (!qaMode) {
    createTray();
    watcher = new CodexStateWatcher((payload) => {
      lastStatePayload = payload;
      if (petWindow && !petWindow.isDestroyed()) petWindow.webContents.send("codex-state", payload);
    });
    watcher.start();
  }
});

ipcMain.on("drag-start", (_event, point) => {
  const [x, y] = petWindow.getPosition();
  dragOffset = { x: point.screenX - x, y: point.screenY - y };
});
ipcMain.on("drag-move", (_event, point) => {
  if (!dragOffset) return;
  petWindow.setPosition(Math.round(point.screenX - dragOffset.x), Math.round(point.screenY - dragOffset.y), false);
});
ipcMain.on("drag-end", () => {
  dragOffset = null;
  resizeHost(requestedHostHeight);
  savePosition();
});
ipcMain.handle("focus-codex", focusCodex);
ipcMain.handle("minimize-pet", () => {
  if (qaMode) {
    qaMinimizeRequests += 1;
    return { ok: true, debug: true, requests: qaMinimizeRequests };
  }
  return { ok: hidePetWindow(petWindow) };
});
ipcMain.handle("get-pinned", () => pinned);
ipcMain.on("resize-host", (_event, height) => { resizeHost(height); });
ipcMain.handle("get-host-bounds", () => petWindow?.getBounds() || null);
ipcMain.handle("set-pinned", (_event, value) => {
  pinned = Boolean(value);
  if (petWindow && !petWindow.isDestroyed()) petWindow.setAlwaysOnTop(pinned, "screen-saver");
  savePosition();
  return { ok: true, pinned };
});
ipcMain.handle("submit-reply", (_event, text) => submitReply(text));
ipcMain.on("close-pet", () => app.quit());

app.on("before-quit", () => {
  watcher?.stop();
  if (codexLaunchTimer) clearTimeout(codexLaunchTimer);
});
app.on("window-all-closed", (event) => event.preventDefault());
