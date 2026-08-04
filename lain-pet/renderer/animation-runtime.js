(function exposeAnimationRuntime(global) {
  const MOVEMENT_PLANS = new Set(["moveLeft", "moveRight"]);
  const REST_PLANS = new Set(["layDown", "sleeping", "wake"]);

  function createFrameScheduler({
    now = () => performance.now(),
    setTimeoutFn = setTimeout,
    clearTimeoutFn = clearTimeout,
    timeScale = 1,
    minDelay = 16,
  } = {}) {
    let handle = null;
    let pending = null;
    let playbackRate = 1;

    function arm() {
      if (!pending) return;
      pending.startedAt = now();
      pending.rate = playbackRate;
      const delay = Math.max(minDelay, Math.round(pending.remainingScaledMs / playbackRate));
      pending.scheduledDelay = delay;
      handle = setTimeoutFn(() => {
        const callback = pending?.callback;
        handle = null;
        pending = null;
        callback?.();
      }, delay);
    }

    function cancel() {
      if (handle !== null) clearTimeoutFn(handle);
      handle = null;
      pending = null;
    }

    function schedule(baseMs, callback) {
      cancel();
      pending = {
        callback,
        remainingScaledMs: Math.max(0, Number(baseMs) * timeScale),
        startedAt: now(),
        rate: playbackRate,
        scheduledDelay: 0,
      };
      arm();
    }

    function setPlaybackRate(value) {
      const nextRate = Math.max(0.01, Number(value) || 1);
      if (nextRate === playbackRate) return;

      if (pending) {
        const elapsed = Math.max(0, now() - pending.startedAt);
        pending.remainingScaledMs = Math.max(0, pending.remainingScaledMs - elapsed * pending.rate);
        if (handle !== null) clearTimeoutFn(handle);
        handle = null;
      }

      playbackRate = nextRate;
      if (pending) arm();
    }

    return {
      schedule,
      setPlaybackRate,
      cancel,
      get snapshot() {
        const elapsed = pending ? Math.max(0, now() - pending.startedAt) : 0;
        const remainingScaledMs = pending
          ? Math.max(0, pending.remainingScaledMs - elapsed * pending.rate)
          : 0;
        return {
          playbackRate,
          pending: Boolean(pending),
          remainingScaledMs,
          scheduledDelay: pending?.scheduledDelay ?? 0,
        };
      },
    };
  }

  function createMovementHandoff({ scheduler }) {
    let targetPlan = null;

    function cancel() {
      if (targetPlan === null) return;
      targetPlan = null;
      scheduler.setPlaybackRate(1);
    }

    function request(activePlan, requestedPlan) {
      if (!MOVEMENT_PLANS.has(requestedPlan)) return false;
      if (MOVEMENT_PLANS.has(activePlan) && requestedPlan === activePlan) {
        cancel();
        return false;
      }
      if (targetPlan === requestedPlan) return false;

      targetPlan = requestedPlan;
      scheduler.setPlaybackRate(3);
      return true;
    }

    function beforePlan(planName) {
      if (!MOVEMENT_PLANS.has(planName)) return;
      targetPlan = null;
      scheduler.setPlaybackRate(1);
    }

    return {
      request,
      beforePlan,
      cancel,
      get snapshot() {
        return { targetPlan };
      },
    };
  }

  function createReclineRunController({ random = Math.random } = {}) {
    let run = null;

    function begin(kind) {
      run = { kind, mirrored: random() >= 0.5 };
    }

    function clear() {
      run = null;
    }

    function beforePlan(planName) {
      if (REST_PLANS.has(planName) && run?.kind !== "rest") begin("rest");
      else if (planName === "failed" && run?.kind !== "failed") begin("failed");
      else if (!REST_PLANS.has(planName) && planName !== "failed") clear();
    }

    function complete(planName) {
      if (planName === "wake" || planName === "failed") clear();
    }

    function isMirroredFor(planName) {
      if (!run?.mirrored) return false;
      if (run.kind === "rest") return REST_PLANS.has(planName);
      return run.kind === "failed" && planName === "failed";
    }

    return {
      beforePlan,
      complete,
      clear,
      isMirroredFor,
      get snapshot() {
        return run ? { ...run } : { kind: null, mirrored: false };
      },
    };
  }

  const api = { createFrameScheduler, createMovementHandoff, createReclineRunController };
  global.LainAnimationRuntime = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
