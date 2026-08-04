const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createFrameScheduler,
  createMovementHandoff,
  createReclineRunController,
} = require("../renderer/animation-runtime.js");

function createFakeClock() {
  let now = 0;
  let pending = null;

  return {
    now: () => now,
    setTimeoutFn(callback, delay) {
      pending = { callback, delay };
      return pending;
    },
    clearTimeoutFn(handle) {
      if (pending === handle) pending = null;
    },
    elapse(ms) {
      now += ms;
    },
    fire() {
      assert.ok(pending, "expected a scheduled callback");
      const current = pending;
      pending = null;
      now += current.delay;
      current.callback();
    },
    get pending() {
      return pending;
    },
  };
}

function createScheduledRuntime(baseMs = 300) {
  const clock = createFakeClock();
  const scheduler = createFrameScheduler({
    now: clock.now,
    setTimeoutFn: clock.setTimeoutFn,
    clearTimeoutFn: clock.clearTimeoutFn,
    timeScale: 1,
    minDelay: 0,
  });
  scheduler.schedule(baseMs, () => {});
  return { clock, scheduler };
}

test("a 3x rate reschedules the remainder of the current frame", () => {
  const clock = createFakeClock();
  let completed = false;
  const scheduler = createFrameScheduler({
    now: clock.now,
    setTimeoutFn: clock.setTimeoutFn,
    clearTimeoutFn: clock.clearTimeoutFn,
    timeScale: 1,
    minDelay: 0,
  });

  scheduler.schedule(300, () => { completed = true; });
  assert.equal(clock.pending.delay, 300);
  clock.elapse(60);
  scheduler.setPlaybackRate(3);

  assert.equal(clock.pending.delay, 80);
  assert.equal(scheduler.snapshot.playbackRate, 3);
  clock.fire();
  assert.equal(completed, true);
});

test("returning from 3x to 1x preserves the partially elapsed remainder", () => {
  const { clock, scheduler } = createScheduledRuntime(300);

  scheduler.setPlaybackRate(3);
  assert.equal(clock.pending.delay, 100);
  clock.elapse(30);
  scheduler.setPlaybackRate(1);

  assert.equal(clock.pending.delay, 210);
  assert.equal(scheduler.snapshot.playbackRate, 1);
});

test("bridge plans remain accelerated until movement begins at 1x", () => {
  const { scheduler } = createScheduledRuntime();
  const handoff = createMovementHandoff({ scheduler });

  assert.equal(handoff.request("thinkingEyeOpen", "moveRight"), true);
  assert.equal(handoff.snapshot.targetPlan, "moveRight");
  assert.equal(scheduler.snapshot.playbackRate, 3);

  handoff.beforePlan("thinkingRecover");
  assert.equal(handoff.snapshot.targetPlan, "moveRight");
  assert.equal(scheduler.snapshot.playbackRate, 3);

  handoff.beforePlan("moveRight");
  assert.equal(handoff.snapshot.targetPlan, null);
  assert.equal(scheduler.snapshot.playbackRate, 1);
});

test("same-direction input is ignored and flip-back cancels an opposite handoff", () => {
  const { scheduler } = createScheduledRuntime();
  const handoff = createMovementHandoff({ scheduler });

  assert.equal(handoff.request("moveLeft", "moveLeft"), false);
  assert.equal(scheduler.snapshot.playbackRate, 1);

  assert.equal(handoff.request("moveLeft", "moveRight"), true);
  assert.equal(handoff.snapshot.targetPlan, "moveRight");
  assert.equal(scheduler.snapshot.playbackRate, 3);

  assert.equal(handoff.request("moveLeft", "moveLeft"), false);
  assert.equal(handoff.snapshot.targetPlan, null);
  assert.equal(scheduler.snapshot.playbackRate, 1);
});

test("cancelling before movement clears the target and restores 1x", () => {
  const { scheduler } = createScheduledRuntime();
  const handoff = createMovementHandoff({ scheduler });

  handoff.request("waiting", "moveRight");
  handoff.cancel();

  assert.equal(handoff.snapshot.targetPlan, null);
  assert.equal(scheduler.snapshot.playbackRate, 1);
});

test("one rest orientation survives lay down, repeated sleep, and wake", () => {
  let draws = 0;
  const controller = createReclineRunController({
    random: () => {
      draws += 1;
      return 0.75;
    },
  });

  controller.beforePlan("layDown");
  assert.equal(controller.isMirroredFor("layDown"), true);
  controller.beforePlan("sleeping");
  controller.beforePlan("sleeping");
  controller.beforePlan("wake");
  assert.equal(controller.isMirroredFor("wake"), true);
  assert.equal(draws, 1);

  controller.complete("wake");
  assert.deepEqual(controller.snapshot, { kind: null, mirrored: false });
});

test("each failed cycle draws once and unrelated plans are never mirrored", () => {
  const values = [0.25, 0.75];
  let index = 0;
  const controller = createReclineRunController({ random: () => values[index++] });

  controller.beforePlan("failed");
  assert.equal(controller.isMirroredFor("failed"), false);
  controller.beforePlan("failed");
  assert.equal(index, 1);

  controller.complete("failed");
  controller.beforePlan("failed");
  assert.equal(controller.isMirroredFor("failed"), true);
  assert.equal(controller.isMirroredFor("thinkingRecline"), false);
  assert.equal(index, 2);

  controller.beforePlan("idle");
  assert.deepEqual(controller.snapshot, { kind: null, mirrored: false });
});
