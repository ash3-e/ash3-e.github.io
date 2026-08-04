(() => {
  const { plans } = window.LainAnimationPlan;
  const { createFrameScheduler, createMovementHandoff, createReclineRunController } = window.LainAnimationRuntime;
  const sprite = document.querySelector("#sprite");
  const pet = document.querySelector("#pet");
  const interactionRegion = document.querySelector("#interaction-region");
  const hoverBridge = document.querySelector("#hover-bridge");
  const stage = document.querySelector("#sprite-stage");
  const status = document.querySelector("#status");
  const bubble = document.querySelector("#activity-bubble");
  const bubbleTitleLine = document.querySelector("#bubble-title");
  const bubbleTitle = document.querySelector("#bubble-title-text");
  const bubbleDetailLine = document.querySelector("#bubble-detail");
  const bubbleDetail = document.querySelector("#bubble-detail-text");
  const bubbleMeta = document.querySelector("#bubble-meta-text");
  const bubbleMetaRow = document.querySelector("#bubble-meta");
  const bubbleProgress = document.querySelector("#bubble-progress");
  const bubbleProgressText = document.querySelector("#bubble-progress-text");
  const bubbleStage = document.querySelector("#bubble-stage");
  const bubbleStageText = document.querySelector("#bubble-stage-text");
  const bubbleCommentary = document.querySelector("#bubble-commentary");
  const bubbleCommentaryText = document.querySelector("#bubble-commentary-text");
  const commentaryThrobber = document.querySelector("#commentary-throbber");
  const titleThrobber = document.querySelector("#title-throbber");
  const titleLoadingDots = document.querySelector("#title-loading-dots");
  const detailLoadingDots = document.querySelector("#detail-loading-dots");
  const progressLoadingDots = document.querySelector("#progress-loading-dots");
  const stageLoadingDots = document.querySelector("#stage-loading-dots");
  const activityLoadingDots = document.querySelector("#activity-loading-dots");
  const minimizeToggle = document.querySelector("#minimize-toggle");
  const pinToggle = document.querySelector("#pin-toggle");
  const bubbleActivity = document.querySelector("#bubble-activity");
  const bubbleActivityText = document.querySelector("#bubble-activity-text");
  const bubbleActivityFile = document.querySelector("#bubble-activity-file");
  const bubbleActivityAdd = document.querySelector("#bubble-activity-add");
  const bubbleActivityRemove = document.querySelector("#bubble-activity-remove");
  const replyForm = document.querySelector("#reply-form");
  const replyInput = document.querySelector("#reply-input");
  const bubbleFeedback = document.querySelector("#bubble-feedback");
  const query = new URLSearchParams(location.search);
  const speed = Math.max(0.05, Number(query.get("speed")) || 1);
  const timerScale = Math.max(0.01, Number(query.get("timerScale")) || 1);
  const deterministicTiming = query.get("deterministicTiming") === "1";
  const deterministicVisual = query.get("deterministicVisual") === "1";
  // QA consumes one value while scheduling the initial idle rest. The next
  // values deliberately leave enough reclined time to prove the full eye
  // close/open cycle before recovery, then prove a second recline.
  const deterministicRandom = [0.8, 0.8, 0, 0.2, 0.6, 0.1, 0.7];
  let deterministicRandomIndex = 0;
  const deterministicVisualRandom = [0.25, 0.75];
  let deterministicVisualRandomIndex = 0;
  let debugMinimizeCount = 0;
  const debugSubmissions = [];
  const api = window.lainPet || {
    focusCodex: async () => ({ ok: true, debug: true, message: "Host focus simulated" }),
    minimize: async () => {
      debugMinimizeCount += 1;
      document.body.dataset.minimizeCount = String(debugMinimizeCount);
      return { ok: true, debug: true };
    },
    getPinned: async () => true,
    setPinned: async (pinned) => ({ ok: true, pinned }),
    resizeHost: () => {},
    getHostBounds: async () => ({ x: 0, y: 0, width: innerWidth, height: innerHeight }),
    submitReply: async (text) => {
      const submissionId = `debug-${Date.now()}`;
      debugSubmissions.push({ submissionId, text });
      return { ok: true, submissionId, debug: true };
    },
  };
  const frameScheduler = createFrameScheduler({ timeScale: speed, minDelay: 16 });
  const movementHandoff = createMovementHandoff({ scheduler: frameScheduler });
  const reclineRun = createReclineRunController({
    random: () => deterministicVisual
      ? deterministicVisualRandom[deterministicVisualRandomIndex++ % deterministicVisualRandom.length]
      : Math.random(),
  });

  let codexState = "idle";
  let activeName = "idle";
  let frameIndex = 0;
  let generation = 0;
  let hovered = false;
  let hoverReady = false;
  let hoverSettled = false;
  let hoverReturnRequested = false;
  let hoverDelayTimer = null;
  let hoverLeaveTimer = null;
  let composerFocused = false;
  let feedbackTimer = null;
  let focusBusy = false;
  let pinBusy = false;
  let pinned = true;
  let submitBusy = false;
  const pendingDrafts = new Map();
  let dragging = false;
  let movedDuringDrag = false;
  let lastPointerX = 0;
  let pointerStartX = 0;
  let pointerStartY = 0;
  const CLICK_DRAG_THRESHOLD = 6;
  let desiredMoveName = "moveRight";
  let lastReviewId = null;
  let pendingReview = false;
  let idleSince = Date.now();
  let layDownTimer = null;
  let sleepTimer = null;
  let sleeping = false;
  let restRequested = false;
  let wakeRequested = false;
  let activityPayload = {};
  let activityTicker = null;
  const HOST_BASE_HEIGHT = 500;
  const HOST_BUBBLE_BOTTOM_PX = 156;
  const HOST_TOP_GUTTER_PX = 12;
  let hostResizeFrame = null;
  let lastRequestedHostHeight = 0;
  const COMMENTARY_REVEAL_MS = 1200;
  const THINKING_TEXT_FADE_MS = 160;
  let commentaryRevealTimer = null;
  let commentarySource = "";
  let commentaryExpanded = false;
  let commentaryLatched = false;
  let commentaryLoading = false;
  let thinkingReclineTimer = null;
  let thinkingIdleTimer = null;
  let thinkingEyeTimer = null;
  let thinkingReclined = false;
  let thinkingReclineRequested = false;
  let thinkingRecoverRequested = false;
  let thinkingEyesOpen = true;
  let thinkingEyeRequested = false;
  let thinkingHoverArmed = false;
  const thinkingLineTimers = new Map();

  function randomMs(minSeconds, maxSeconds) {
    const random = deterministicTiming
      ? deterministicRandom[deterministicRandomIndex++ % deterministicRandom.length]
      : Math.random();
    return Math.round((minSeconds + random * (maxSeconds - minSeconds)) * 1000 * timerScale);
  }

  function clearFrameTimer() {
    frameScheduler.cancel();
  }

  function clearRestTimer() {
    if (layDownTimer) clearTimeout(layDownTimer);
    layDownTimer = null;
  }

  function clearSleepTimer() {
    if (sleepTimer) clearTimeout(sleepTimer);
    sleepTimer = null;
  }

  function clearThinkingTimers() {
    if (thinkingReclineTimer) clearTimeout(thinkingReclineTimer);
    if (thinkingIdleTimer) clearTimeout(thinkingIdleTimer);
    if (thinkingEyeTimer) clearTimeout(thinkingEyeTimer);
    thinkingReclineTimer = null;
    thinkingIdleTimer = null;
    thinkingEyeTimer = null;
  }

  function sessionTitle(value) {
    const text = String(value || "Lain").replace(/\s+/g, " ").trim() || "Lain";
    return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
  }

  function setFitAwareDots(dots, wantsDots, line, textNode) {
    dots.dataset.active = String(Boolean(wantsDots));
    if (!wantsDots) return;
    requestAnimationFrame(() => {
      const available = line.clientWidth;
      const required = textNode.scrollWidth + dots.offsetWidth + 5;
      dots.dataset.active = String(required <= available);
    });
  }

  function normalizeCommentary(value) {
    return String(value || "")
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " ").trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function desiredHostHeight() {
    const currentCommentaryHeight = bubbleCommentary.hidden ? 0 : bubbleCommentary.offsetHeight;
    const measuredCommentaryHeight = Number.parseFloat(bubbleCommentary.dataset.measuredHeight) || 0;
    const expectedCommentaryHeight = bubble.dataset.expanded === "true"
      ? Math.max(currentCommentaryHeight, measuredCommentaryHeight)
      : currentCommentaryHeight;
    const expectedBubbleHeight = Math.max(
      0,
      bubble.offsetHeight - currentCommentaryHeight + expectedCommentaryHeight,
    );
    return Math.max(
      HOST_BASE_HEIGHT,
      Math.ceil(expectedBubbleHeight + HOST_BUBBLE_BOTTOM_PX + HOST_TOP_GUTTER_PX),
    );
  }

  function requestHostResize() {
    if (hostResizeFrame !== null) return;
    hostResizeFrame = requestAnimationFrame(() => {
      hostResizeFrame = null;
      const height = desiredHostHeight();
      if (height === lastRequestedHostHeight) return;
      lastRequestedHostHeight = height;
      api.resizeHost?.(height);
    });
  }

  function measureCommentaryHeight() {
    requestAnimationFrame(() => {
      if (bubbleCommentary.hidden) return;
      const commentaryStyle = getComputedStyle(bubbleCommentary);
      const verticalChrome = Math.max(10, [
        commentaryStyle.paddingTop,
        commentaryStyle.paddingBottom,
        commentaryStyle.borderTopWidth,
        commentaryStyle.borderBottomWidth,
      ].reduce((total, value) => total + (Number.parseFloat(value) || 0), 0));
      const textHeight = Math.max(
        bubbleCommentaryText.scrollHeight,
        bubbleCommentaryText.getBoundingClientRect().height,
      );
      const targetHeight = commentaryLoading
        ? 96
        : Math.max(28, Math.ceil(textHeight + verticalChrome + 12));
      bubbleCommentary.style.setProperty("--commentary-expanded-height", `${targetHeight}px`);
      bubbleCommentary.dataset.measuredHeight = String(targetHeight);
      requestHostResize();
    });
  }

  function renderCommentary(value, available, expanded, animateThoughtTransition = false) {
    const source = available ? normalizeCommentary(value) : "";
    bubbleCommentary.hidden = !source;
    bubbleCommentary.setAttribute("aria-hidden", String(!expanded));
    bubbleCommentary.setAttribute("aria-pressed", String(commentaryLatched));
    bubbleCommentary.dataset.latched = String(commentaryLatched);
    bubbleCommentary.dataset.revealMs = String(COMMENTARY_REVEAL_MS);
    if (!source) {
      if (commentaryRevealTimer) clearTimeout(commentaryRevealTimer);
      commentaryRevealTimer = null;
      commentarySource = "";
      commentaryExpanded = false;
      commentaryLatched = false;
      commentaryLoading = false;
      bubbleCommentaryText.textContent = "";
      bubbleCommentary.dataset.loading = "false";
      bubbleCommentary.dataset.latched = "false";
      bubbleCommentary.dataset.truncated = "false";
      bubbleCommentary.dataset.rendered = "false";
      bubbleCommentary.removeAttribute("aria-label");
      return;
    }
    const sourceChanged = source !== commentarySource;
    commentaryExpanded = expanded;
    bubbleCommentary.dataset.truncated = "false";
    bubbleCommentary.setAttribute("aria-label", source);
    if (sourceChanged) {
      commentarySource = source;
      if (commentaryRevealTimer) clearTimeout(commentaryRevealTimer);
      commentaryRevealTimer = null;
      bubbleCommentary.dataset.rendered = "false";
      if (animateThoughtTransition && expanded) {
        commentaryLoading = true;
        bubbleCommentary.dataset.loading = "true";
        bubbleCommentaryText.textContent = "";
        measureCommentaryHeight();
        commentaryRevealTimer = setTimeout(() => {
          commentaryRevealTimer = null;
          if (source !== commentarySource || bubbleCommentary.hidden) return;
          commentaryLoading = false;
          bubbleCommentary.dataset.loading = "false";
          bubbleCommentaryText.textContent = source;
          bubbleCommentary.dataset.rendered = "true";
          measureCommentaryHeight();
          updateBubble();
        }, COMMENTARY_REVEAL_MS);
      } else {
        commentaryLoading = false;
        bubbleCommentary.dataset.loading = "false";
        bubbleCommentaryText.textContent = source;
        bubbleCommentary.dataset.rendered = "true";
      }
    } else if (!commentaryLoading && bubbleCommentaryText.textContent !== source) {
      bubbleCommentaryText.textContent = source;
      bubbleCommentary.dataset.rendered = "true";
    }
    measureCommentaryHeight();
  }

  function clearThinkingLineTimer(line) {
    const timer = thinkingLineTimers.get(line);
    if (timer) clearTimeout(timer);
    thinkingLineTimers.delete(line);
  }

  function renderThinkingLine(line, textNode, value, visible, animate) {
    const nextText = visible ? String(value || "") : "";
    const targetText = textNode.dataset.targetText ?? textNode.textContent;

    if (!animate || !visible) {
      clearThinkingLineTimer(line);
      delete textNode.dataset.targetText;
      line.dataset.textTransition = "idle";
      textNode.textContent = nextText;
      line.hidden = !visible;
      return;
    }

    line.hidden = false;
    if (nextText === targetText) return;

    clearThinkingLineTimer(line);
    textNode.dataset.targetText = nextText;
    line.dataset.textTransition = "out";
    const swapTimer = setTimeout(() => {
      thinkingLineTimers.delete(line);
      if (textNode.dataset.targetText !== nextText) return;
      textNode.textContent = nextText;
      line.dataset.textTransition = "in";
      const settleTimer = setTimeout(() => {
        thinkingLineTimers.delete(line);
        if (textNode.dataset.targetText !== nextText) return;
        delete textNode.dataset.targetText;
        line.dataset.textTransition = "idle";
      }, THINKING_TEXT_FADE_MS);
      thinkingLineTimers.set(line, settleTimer);
    }, textNode.textContent ? THINKING_TEXT_FADE_MS : 0);
    thinkingLineTimers.set(line, swapTimer);
  }

  function splitFinalOutput(value) {
    const lines = String(value || "").replace(/\r\n?/g, "\n").split("\n").map((line) => line.trim()).filter(Boolean);
    return { summary: lines[0] || "", transcript: lines.slice(1).join("\n") };
  }

  function updateActivityLine() {
    const activity = activityPayload.activity || null;
    bubbleActivity.hidden = !activity || codexState !== "thinking";
    bubbleActivityText.textContent = "";
    bubbleActivityFile.textContent = "";
    bubbleActivityAdd.textContent = "";
    bubbleActivityRemove.textContent = "";
    activityLoadingDots.dataset.active = "false";
    if (bubbleActivity.hidden) return;

    if (activity.kind === "command") {
      const elapsed = Math.max(0, Math.floor((Date.now() - Number(activity.startedAt || Date.now())) / 1000));
      bubbleActivityText.textContent = `Running command for ${elapsed}s`;
      setFitAwareDots(activityLoadingDots, true, bubbleActivity, bubbleActivityText);
      return;
    }

    if (activity.kind === "edit") {
      bubbleActivityText.textContent = "Edited";
      bubbleActivityFile.textContent = activity.file || "file";
      bubbleActivityAdd.textContent = `+${Number(activity.additions) || 0}`;
      bubbleActivityRemove.textContent = `-${Number(activity.deletions) || 0}`;
    }
  }

  function scheduleActivityTicker() {
    if (activityTicker) clearInterval(activityTicker);
    activityTicker = null;
    updateActivityLine();
    if (codexState === "thinking" && activityPayload.activity?.kind === "command") {
      activityTicker = setInterval(updateActivityLine, 1000);
    }
  }

  function scheduleThinkingEyeChange() {
    if (thinkingEyeTimer) clearTimeout(thinkingEyeTimer);
    thinkingEyeTimer = setTimeout(() => {
      thinkingEyeTimer = null;
      if (codexState !== "thinking" || !thinkingReclined || thinkingRecoverRequested || (hovered && thinkingHoverArmed) || composerFocused || dragging || pendingReview) return;
      thinkingEyeRequested = true;
    }, randomMs(10, 15));
  }

  function scheduleThinkingRecovery() {
    if (thinkingReclineTimer) clearTimeout(thinkingReclineTimer);
    thinkingReclineTimer = setTimeout(() => {
      thinkingReclineTimer = null;
      if (codexState !== "thinking" || !thinkingReclined) return;
      thinkingRecoverRequested = true;
    }, randomMs(10, 35));
  }

  function scheduleThinkingRecline() {
    if (thinkingIdleTimer) clearTimeout(thinkingIdleTimer);
    thinkingIdleTimer = setTimeout(() => {
      thinkingIdleTimer = null;
      if (codexState !== "thinking" || (hovered && thinkingHoverArmed) || composerFocused || dragging || pendingReview) return;
      thinkingReclineRequested = true;
    }, randomMs(5, 10));
  }

  function clearHoverDelay() {
    if (hoverDelayTimer) clearTimeout(hoverDelayTimer);
    hoverDelayTimer = null;
  }

  function clearHoverLeave() {
    if (hoverLeaveTimer) clearTimeout(hoverLeaveTimer);
    hoverLeaveTimer = null;
  }

  function setBridgeActive(value) {
    interactionRegion.dataset.bridgeActive = String(Boolean(value));
  }

  function resizeReplyInput() {
    replyInput.dataset.overflow = "false";
    replyInput.style.height = "19px";
    const desiredHeight = Math.max(19, replyInput.scrollHeight);
    replyInput.style.height = `${Math.min(96, desiredHeight)}px`;
    replyInput.dataset.overflow = String(desiredHeight > 96);
  }

  function showFeedback(message, timeout = 3200) {
    if (feedbackTimer) clearTimeout(feedbackTimer);
    feedbackTimer = null;
    bubbleFeedback.textContent = message || "";
    bubbleFeedback.hidden = !message;
    if (message) {
      setBridgeActive(true);
      if (timeout > 0) {
        feedbackTimer = setTimeout(() => {
          feedbackTimer = null;
          bubbleFeedback.hidden = true;
          updateBubble();
        }, timeout);
      }
    }
    updateBubble();
  }

  function scheduleHoverDelay() {
    clearHoverDelay();
    hoverReady = false;
    if (!hovered || dragging || !hoverSettled || (codexState === "thinking" && !thinkingHoverArmed)) return;
    hoverDelayTimer = setTimeout(() => {
      hoverDelayTimer = null;
      if (!hovered || dragging || !hoverSettled) return;
      hoverReady = true;
    }, frameDelay(1500));
  }

  function settleHoverAtIdle() {
    if (!hovered || dragging) return;
    hoverReturnRequested = false;
    hoverSettled = true;
    scheduleHoverDelay();
  }

  function frameDelay(ms) {
    return Math.max(16, Math.round(ms * speed));
  }

  function updateBubble() {
    let detail = "Drag to move";
    let meta = "Click to bring Lain forward";
    let tone = "neutral";
    let visible = hovered || composerFocused || !bubbleFeedback.hidden;

    const liveThinking = codexState === "thinking" && !(pendingReview || activeName === "review");
    const finalOutput = splitFinalOutput(activityPayload.finalText);
    if (pendingReview || activeName === "review" || finalOutput.summary) {
      detail = finalOutput.summary || "Lain finished this task.";
      meta = "Review the latest reply.";
      tone = "ready";
      visible = true;
    } else if (codexState === "thinking") {
      detail = "Lain is thinking";
      meta = "";
      tone = "working";
      visible = true;
    } else if (codexState === "waiting") {
      detail = activityPayload.request?.summary || "Lain needs your decision.";
      meta = "Review the pending request for Lain";
      tone = "waiting";
      visible = true;
    } else if (codexState === "failed") {
      detail = "Lain hit a problem.";
      meta = activityPayload.threadPreview || "Bring the task forward to inspect it.";
      tone = "blocked";
      visible = true;
    }

    bubbleTitle.textContent = sessionTitle(activityPayload.threadTitle);
    bubbleDetail.textContent = detail;
    bubbleMeta.textContent = meta;
    const progressText = String(activityPayload.progressText || "").trim();
    const hasProgress = Boolean(progressText);
    const stageText = activityPayload.stageTitle || "";
    const outputText = liveThinking ? (activityPayload.commentaryText || "") : finalOutput.transcript;
    const normalizedOutput = normalizeCommentary(outputText);
    const outputAvailable = Boolean(normalizedOutput);
    const transcriptExpanded = outputAvailable && (hovered || composerFocused || commentaryLatched || commentaryLoading);
    const compactThinking = liveThinking && !transcriptExpanded;
    renderThinkingLine(bubbleProgress, bubbleProgressText, progressText, liveThinking && hasProgress, compactThinking);
    renderThinkingLine(bubbleStage, bubbleStageText, stageText, liveThinking && Boolean(stageText), compactThinking);
    bubble.dataset.expanded = String(transcriptExpanded);
    renderCommentary(normalizedOutput, outputAvailable, transcriptExpanded, liveThinking);
    bubbleMetaRow.hidden = liveThinking;
    replyForm.hidden = liveThinking;
    titleThrobber.dataset.active = String(codexState === "thinking" || codexState === "waiting");
    setFitAwareDots(titleLoadingDots, false, bubbleTitleLine, bubbleTitle);
    setFitAwareDots(detailLoadingDots, liveThinking, bubbleDetailLine, bubbleDetail);
    setFitAwareDots(progressLoadingDots, liveThinking && hasProgress && !stageText, bubbleProgress, bubbleProgressText);
    setFitAwareDots(stageLoadingDots, liveThinking && Boolean(stageText), bubbleStage, bubbleStageText);
    replyInput.placeholder = codexState === "waiting" ? "answer / follow up" : "reply / follow up";
    pinToggle.setAttribute("aria-pressed", String(pinned));
    pinToggle.setAttribute("aria-label", pinned ? "Stop keeping Lain on top" : "Keep Lain on top");
    pinToggle.title = pinned ? "Lain is pinned on top" : "Pin Lain on top";
    bubbleCommentary.title = commentaryLatched ? "Click to let this message collapse" : "Click to keep this message open";
    bubble.dataset.visible = String(visible);
    bubble.dataset.tone = tone;
    setBridgeActive(visible || dragging || composerFocused);
    scheduleActivityTicker();
    requestHostResize();
  }

  function renderFrame(frame) {
    sprite.src = frame.src;
    sprite.classList.toggle("pulse", Boolean(frame.pulse));
    sprite.dataset.pulseKind = frame.pulseKind || "none";
  }

  function syncReclineOrientation(name = activeName) {
    sprite.dataset.reclineMirrored = String(reclineRun.isMirroredFor(name));
  }

  function startPlan(name) {
    if (!plans[name]) name = "idle";
    generation += 1;
    const run = generation;
    clearFrameTimer();
    movementHandoff.beforePlan(name);
    reclineRun.beforePlan(name);
    activeName = name;
    frameIndex = 0;
    syncReclineOrientation(name);
    status.textContent = name;
    updateBubble();

    const advance = () => {
      if (run !== generation) return;
      const plan = plans[name];
      const frame = plan.frames[frameIndex];
      renderFrame(frame);
      frameScheduler.schedule(frame.ms, () => {
        if (run !== generation) return;
        frameIndex += 1;
        if (frameIndex >= plan.frames.length) {
          clearFrameTimer();
          handleBoundary(name);
          return;
        }
        advance();
      });
    };

    advance();
  }

  function playDebugPlan(name) {
    movementHandoff.cancel();
    reclineRun.clear();
    startPlan(name);
  }

  function scheduleLayDown() {
    if (layDownTimer || restRequested || sleeping) return;
    if (codexState !== "idle" || hovered || composerFocused || dragging || pendingReview) return;
    layDownTimer = setTimeout(() => {
      layDownTimer = null;
      restRequested = true;
      if (activeName === "idle" || activeName === "neutral") resolveIntent();
    }, randomMs(20, 40));
  }

  function beginSleepingTimer() {
    clearSleepTimer();
    sleepTimer = setTimeout(() => {
      sleepTimer = null;
      wakeRequested = true;
    }, randomMs(10, 60));
  }

  function wantsWake() {
    return wakeRequested || hovered || composerFocused || dragging || pendingReview || codexState !== "idle";
  }

  function isThinkingReclinePlan(name = activeName) {
    return [
      "thinkingRecline",
      "thinkingReclineOpen",
      "thinkingEyeClose",
      "thinkingReclineClosed",
      "thinkingEyeOpen",
      "thinkingRecover",
    ].includes(name);
  }

  function requestThinkingRecovery() {
    if (!thinkingReclined && !isThinkingReclinePlan()) return;
    thinkingRecoverRequested = true;
    thinkingReclineRequested = false;
    if (thinkingReclineTimer) clearTimeout(thinkingReclineTimer);
    if (thinkingIdleTimer) clearTimeout(thinkingIdleTimer);
    thinkingReclineTimer = null;
    thinkingIdleTimer = null;
  }

  function resolveThinkingIntent() {
    const interactionOverride = dragging || pendingReview || (hovered && thinkingHoverArmed) || composerFocused || codexState !== "thinking";

    if (thinkingReclined || isThinkingReclinePlan()) {
      if (interactionOverride) requestThinkingRecovery();
      if (thinkingRecoverRequested) {
        if (!thinkingEyesOpen) {
          startPlan("thinkingEyeOpen");
          return true;
        }
        startPlan("thinkingRecover");
        return true;
      }
      if (thinkingEyeRequested) {
        thinkingEyeRequested = false;
        startPlan(thinkingEyesOpen ? "thinkingEyeClose" : "thinkingEyeOpen");
        return true;
      }
      startPlan(thinkingEyesOpen ? "thinkingReclineOpen" : "thinkingReclineClosed");
      return true;
    }

    if (codexState === "thinking" && !interactionOverride) {
      if (thinkingReclineRequested) {
        thinkingReclineRequested = false;
        startPlan("thinkingRecline");
      } else {
        startPlan("idle");
        if (!thinkingIdleTimer) scheduleThinkingRecline();
      }
      return true;
    }
    return false;
  }

  function resolveIntent() {
    if (resolveThinkingIntent()) return;
    if (dragging && movedDuringDrag) {
      startPlan(desiredMoveName);
      return;
    }
    if (pendingReview) {
      pendingReview = false;
      startPlan("review");
      return;
    }
    if (restRequested && codexState === "idle" && !hovered && !dragging) {
      restRequested = false;
      sleeping = true;
      startPlan("layDown");
      return;
    }
    if (hovered && hoverReturnRequested) {
      startPlan("neutral");
      return;
    }
    if (hovered && hoverReady) {
      startPlan("hover");
      return;
    }
    if (hovered && hoverSettled) {
      startPlan("idle");
      if (!hoverDelayTimer) scheduleHoverDelay();
      return;
    }
    const target = codexState === "thinking" ? "idle" : (plans[codexState] ? codexState : "idle");
    startPlan(target);
    if (target === "idle") scheduleLayDown();
  }

  function handleBoundary(completedName) {
    reclineRun.complete(completedName);
    if (completedName === "neutral" && hovered && hoverReturnRequested) {
      settleHoverAtIdle();
      startPlan("idle");
      return;
    }
    if (completedName === "moveLeft" || completedName === "moveRight") {
      if (dragging && movedDuringDrag) startPlan(desiredMoveName);
      else startPlan("moveRecover");
      return;
    }
    if (completedName === "moveRecover") {
      resolveIntent();
      return;
    }
    if (completedName === "thinkingRecline") {
      thinkingReclined = true;
      thinkingEyesOpen = true;
      if (!thinkingRecoverRequested) {
        scheduleThinkingRecovery();
        scheduleThinkingEyeChange();
      }
      resolveIntent();
      return;
    }
    if (completedName === "thinkingReclineOpen" || completedName === "thinkingReclineClosed") {
      resolveIntent();
      return;
    }
    if (completedName === "thinkingEyeClose") {
      thinkingEyesOpen = false;
      if (!thinkingRecoverRequested) scheduleThinkingEyeChange();
      resolveIntent();
      return;
    }
    if (completedName === "thinkingEyeOpen") {
      thinkingEyesOpen = true;
      if (!thinkingRecoverRequested) scheduleThinkingEyeChange();
      resolveIntent();
      return;
    }
    if (completedName === "thinkingRecover") {
      clearThinkingTimers();
      activeName = "neutral";
      thinkingReclined = false;
      thinkingRecoverRequested = false;
      thinkingEyeRequested = false;
      thinkingEyesOpen = true;
      if (codexState === "thinking" && !(hovered && thinkingHoverArmed) && !composerFocused && !dragging && !pendingReview) scheduleThinkingRecline();
      resolveIntent();
      return;
    }
    if (completedName === "layDown") {
      if (wantsWake()) startPlan("wake");
      else {
        startPlan("sleeping");
        beginSleepingTimer();
      }
      return;
    }
    if (completedName === "sleeping") {
      if (wantsWake()) {
        clearSleepTimer();
        startPlan("wake");
      } else {
        startPlan("sleeping");
      }
      return;
    }
    if (completedName === "wake") {
      sleeping = false;
      wakeRequested = false;
      idleSince = Date.now();
      resolveIntent();
      return;
    }
    resolveIntent();
  }

  function markInteraction(interruptThinking = true) {
    idleSince = Date.now();
    clearRestTimer();
    restRequested = false;
    if (interruptThinking) {
      if (thinkingIdleTimer) clearTimeout(thinkingIdleTimer);
      thinkingIdleTimer = null;
      thinkingReclineRequested = false;
      requestThinkingRecovery();
    }
    if (sleeping || activeName === "layDown" || activeName === "sleeping") wakeRequested = true;
    updateBubble();
  }

  function setHover(value, { deliberate = true, forceTransition = false } = {}) {
    clearHoverLeave();
    const wasHovered = hovered;
    const wasThinkingHoverArmed = thinkingHoverArmed;
    hovered = Boolean(value);
    if (!hovered) thinkingHoverArmed = false;
    else if (codexState === "thinking" && deliberate) thinkingHoverArmed = true;
    const newlyArmed = thinkingHoverArmed && !wasThinkingHoverArmed;
    markInteraction(codexState !== "thinking" || thinkingHoverArmed);
    if (hovered && codexState === "thinking" && !thinkingHoverArmed) {
      clearHoverDelay();
      hoverReady = false;
      hoverSettled = false;
      hoverReturnRequested = false;
      updateBubble();
      return;
    }
    if (hovered && wasHovered && !newlyArmed && !forceTransition) {
      updateBubble();
      return;
    }
    if (hovered) {
      clearHoverDelay();
      hoverReady = false;
      if (activeName === "hover") {
        hoverReturnRequested = false;
        hoverSettled = true;
        hoverReady = true;
      } else if (["idle", "neutral"].includes(activeName)) {
        hoverReturnRequested = false;
        hoverSettled = true;
        scheduleHoverDelay();
      } else {
        hoverReturnRequested = true;
        hoverSettled = false;
      }
    } else {
      clearHoverDelay();
      hoverReady = false;
      hoverSettled = false;
      hoverReturnRequested = false;
      thinkingHoverArmed = false;
      if (activeName === "hover") startPlan("neutral");
    }
    updateBubble();
    // Entry waits 1.5 seconds; exit cancels hover immediately.
  }

  function scheduleHoverExit() {
    clearHoverLeave();
    hoverLeaveTimer = setTimeout(() => {
      hoverLeaveTimer = null;
      if (!composerFocused && !dragging) setHover(false);
    }, 140);
  }

  function handleInteractiveLeave(event) {
    const next = event.relatedTarget;
    if (next && interactionRegion.contains(next)) return;
    scheduleHoverExit();
  }

  function setCodexState(payload = {}) {
    const previousState = codexState;
    activityPayload = payload;
    if (payload.reviewId !== null && payload.reviewId !== undefined && payload.reviewId !== lastReviewId) {
      lastReviewId = payload.reviewId;
      pendingReview = true;
    }
    codexState = payload.state || "idle";
    if (codexState === "thinking" && previousState !== "thinking") {
      clearThinkingTimers();
      thinkingHoverArmed = false;
      thinkingReclineRequested = !(composerFocused || dragging || pendingReview);
      thinkingRecoverRequested = false;
      thinkingEyeRequested = false;
      thinkingEyesOpen = true;
    } else if (codexState !== "thinking" && previousState === "thinking") {
      thinkingReclineRequested = false;
      if (thinkingReclineTimer) clearTimeout(thinkingReclineTimer);
      if (thinkingIdleTimer) clearTimeout(thinkingIdleTimer);
      thinkingReclineTimer = null;
      thinkingIdleTimer = null;
      requestThinkingRecovery();
    }
    if (codexState !== "idle" || pendingReview) {
      clearRestTimer();
      restRequested = false;
      if (sleeping || activeName === "layDown" || activeName === "sleeping") wakeRequested = true;
    }
    updateBubble();
  }

  function beginDrag(direction = null) {
    clearHoverDelay();
    hoverReady = false;
    hoverSettled = false;
    hoverReturnRequested = false;
    dragging = true;
    movedDuringDrag = false;
    document.body.classList.add("dragging");
    markInteraction();
    if (direction) requestMovement(direction);
  }

  function requestMovement(direction) {
    desiredMoveName = direction === "left" ? "moveLeft" : "moveRight";
    movedDuringDrag = true;
    movementHandoff.request(activeName, desiredMoveName);
  }

  function changeDirection(direction) {
    requestMovement(direction);
  }

  function endDrag({ openIfClick = false } = {}) {
    if (!dragging) return;
    const wasMoved = movedDuringDrag;
    dragging = false;
    movedDuringDrag = false;
    movementHandoff.cancel();
    document.body.classList.remove("dragging");
    window.lainPet?.dragEnd();
    if (!wasMoved) {
      if (openIfClick) requestHostFocus();
      if (hovered) {
        hoverSettled = ["idle", "neutral"].includes(activeName);
        hoverReturnRequested = !hoverSettled;
        if (hoverSettled) scheduleHoverDelay();
      }
      return;
    }
    if (hovered) {
      hoverReady = false;
      hoverSettled = false;
      hoverReturnRequested = true;
    }
    // The active tumble is not interrupted. Its boundary starts moveRecover.
  }

  function toggleCommentaryLatch() {
    if (bubbleCommentary.hidden || !commentarySource) return;
    commentaryLatched = !commentaryLatched;
    updateBubble();
  }

  async function requestHostFocus() {
    if (focusBusy) return { ok: false, busy: true };
    focusBusy = true;
    showFeedback("BRINGING THE MAIN WINDOW FORWARD...", 0);
    try {
      const result = await api.focusCodex?.();
      showFeedback(result?.ok ? "LAIN'S MAIN WINDOW IS READY" : (result?.message || "THE MAIN APP WINDOW WAS NOT FOUND"), result?.ok ? 1800 : 5200);
      return result;
    } catch (error) {
      showFeedback(`FOCUS FAILED // ${error?.message || "UNKNOWN ERROR"}`, 5200);
      return { ok: false, message: error?.message || "UNKNOWN ERROR" };
    } finally {
      focusBusy = false;
    }
  }

  async function togglePinned() {
    if (pinBusy) return;
    pinBusy = true;
    pinToggle.disabled = true;
    try {
      const result = await api.setPinned?.(!pinned);
      if (result?.ok !== false) pinned = Boolean(result?.pinned ?? !pinned);
      updateBubble();
    } finally {
      pinBusy = false;
      pinToggle.disabled = false;
    }
  }

  async function minimizePet() {
    try {
      await api.minimize?.();
    } catch {}
  }

  async function submitReply(text) {
    const message = String(text || "").trim();
    if (!message || submitBusy) return;
    submitBusy = true;
    showFeedback("TRANSMITTING TO LAIN…", 0);
    try {
      const result = await api.submitReply?.(message);
      if (!result?.ok) {
        showFeedback(result?.message || "REPLY COULD NOT BE SENT", 6000);
        return;
      }
      if (result.submissionId) pendingDrafts.set(result.submissionId, message);
      replyInput.value = "";
      resizeReplyInput();
      showFeedback("REPLY TRANSMITTED", 2400);
    } catch (error) {
      showFeedback(`SEND FAILED // ${error?.message || "UNKNOWN ERROR"}`, 6000);
    } finally {
      submitBusy = false;
      replyInput.focus();
    }
  }

  function handleInteractiveMove() {
    if (!hovered) return;
    if (codexState === "thinking" && !thinkingHoverArmed) {
      setHover(true, { deliberate: true, forceTransition: true });
    }
  }

  for (const surface of [stage, hoverBridge, bubble]) {
    surface.addEventListener("pointerenter", () => setHover(true, { deliberate: codexState !== "thinking" }));
    surface.addEventListener("pointermove", handleInteractiveMove);
    surface.addEventListener("pointerleave", handleInteractiveLeave);
  }
  stage.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    beginDrag();
    pointerStartX = event.screenX;
    pointerStartY = event.screenY;
    lastPointerX = event.screenX;
    stage.setPointerCapture(event.pointerId);
    window.lainPet?.dragStart({ screenX: event.screenX, screenY: event.screenY });
  });
  stage.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const travelX = event.screenX - pointerStartX;
    const travelY = event.screenY - pointerStartY;
    const deltaX = event.screenX - lastPointerX;
    if (!movedDuringDrag && Math.hypot(travelX, travelY) < CLICK_DRAG_THRESHOLD) return;
    if (!movedDuringDrag) movedDuringDrag = true;
    if (Math.abs(deltaX) >= 2) changeDirection(deltaX < 0 ? "left" : "right");
    lastPointerX = event.screenX;
    window.lainPet?.dragMove({ screenX: event.screenX, screenY: event.screenY });
  });
  stage.addEventListener("pointerup", () => endDrag({ openIfClick: true }));
  stage.addEventListener("pointercancel", () => endDrag());
  bubble.addEventListener("pointerdown", (event) => event.stopPropagation());
  bubble.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.target.closest("#reply-form, #bubble-controls, #bubble-commentary")) return;
    requestHostFocus();
  });
  bubble.addEventListener("focusin", () => {
    composerFocused = true;
    setHover(true);
  });
  bubble.addEventListener("focusout", () => {
    setTimeout(() => {
      composerFocused = bubble.contains(document.activeElement);
      if (!composerFocused && !interactionRegion.matches(":hover")) scheduleHoverExit();
      updateBubble();
    }, 0);
  });
  pinToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    togglePinned();
  });
  minimizeToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    minimizePet();
  });
  for (const eventName of ["pointerdown", "pointerup"]) {
    pinToggle.addEventListener(eventName, (event) => event.stopPropagation());
    minimizeToggle.addEventListener(eventName, (event) => event.stopPropagation());
    bubbleCommentary.addEventListener(eventName, (event) => event.stopPropagation());
  }
  bubbleCommentary.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleCommentaryLatch();
  });
  bubbleCommentary.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    toggleCommentaryLatch();
  });
  replyInput.addEventListener("input", resizeReplyInput);
  replyInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      replyForm.requestSubmit();
    }
  });
  replyForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitReply(replyInput.value);
  });

  const hostResizeObserver = new ResizeObserver(requestHostResize);
  hostResizeObserver.observe(bubble);
  hostResizeObserver.observe(bubbleCommentary);
  window.addEventListener("resize", requestHostResize);

  api.onCodexState?.(setCodexState);
  api.onReplyResult?.((result) => {
    const draft = pendingDrafts.get(result?.submissionId);
    if (result?.submissionId) pendingDrafts.delete(result.submissionId);
    if (result?.ok) {
      showFeedback("LAIN RECEIVED THE REPLY", 2200);
      return;
    }
    if (draft && !replyInput.value) {
      replyInput.value = draft;
      resizeReplyInput();
    }
    showFeedback(result?.message || "LAIN COULD NOT CONTINUE THIS TASK", 6500);
  });

  if (query.get("debug") === "1") {
    document.body.classList.add("debug");
    document.querySelector("#debug-panel").hidden = false;
    const buttons = document.querySelector("#debug-buttons");
    for (const name of Object.keys(plans)) {
      const button = document.createElement("button");
      button.textContent = name;
      button.dataset.animation = name;
      button.addEventListener("click", () => {
        if (["idle", "thinking", "waiting", "failed"].includes(name)) {
          setCodexState(name === "thinking"
            ? { state: name, threadTitle: "Install it", progressText: "Verifying UI element alignment and sizes", stageTitle: "Planning QA capture enhancement", activity: { kind: "edit", file: "app.js", additions: 2, deletions: 2 } }
            : { state: name });
        }
        else if (name === "review") setCodexState({ state: "idle", reviewId: `debug-${Date.now()}` });
        else playDebugPlan(name);
      });
      buttons.append(button);
    }
  }

  renderFrame(plans.idle.frames[0]);
  startPlan("idle");
  scheduleLayDown();
  Promise.resolve(api.getPinned?.()).then((value) => {
    pinned = Boolean(value ?? true);
    updateBubble();
  }).catch(() => {});
  if (query.get("debug") === "1" && query.get("hover") === "1") setHover(true);

  window.LainPetDebug = {
    play: playDebugPlan,
    setHover,
    setCodexState,
    beginDrag,
    changeDirection,
    endDrag,
    requestHostFocus,
    submitReply,
    toggleCommentaryLatch,
    get submissions() { return [...debugSubmissions]; },
    get active() { return activeName; },
    get idleSince() { return idleSince; },
    get snapshot() {
      return {
        activeName,
        frameIndex,
        hovered,
        composerFocused,
        bridgeActive: interactionRegion.dataset.bridgeActive === "true",
        hoverReady,
        hoverSettled,
        hoverReturnRequested,
        dragging,
        movedDuringDrag,
        desiredMoveName,
        framePlaybackRate: frameScheduler.snapshot.playbackRate,
        movementHandoffTarget: movementHandoff.snapshot.targetPlan,
        reclineKind: reclineRun.snapshot.kind,
        reclineMirrored: reclineRun.snapshot.mirrored,
        minimizeCount: debugMinimizeCount,
        pendingReview,
        sleeping,
        wakeRequested,
        pinned,
        commentaryExpanded,
        commentaryLatched,
        commentaryLoading,
        commentaryThrobberVisible: getComputedStyle(commentaryThrobber).display !== "none",
        requestedHostHeight: lastRequestedHostHeight,
        viewportHeight: innerHeight,
        bubbleTop: Math.round(bubble.getBoundingClientRect().top * 10) / 10,
        thinkingReclined,
        thinkingReclineRequested,
        thinkingRecoverRequested,
        thinkingEyesOpen,
        thinkingEyeRequested,
        thinkingHoverArmed,
        sprite: sprite.getAttribute("src"),
      };
    },
  };
})();
