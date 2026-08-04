(function exposeAnimationPlan(global) {
  const source = (index, options = {}) => ({
    src: `../assets/source/frame-${String(index).padStart(2, "0")}${options.mirror ? "-mirror" : ""}.png`,
    ms: options.ms || 120,
    pulse: Boolean(options.pulse),
    pulseKind: options.pulseKind,
  });
  const jump = (index, ms = 105) => ({ src: `../assets/source/jump-${String(index).padStart(2, "0")}.png`, ms });
  const atlas = (row, frame, ms = 130) => ({ src: `../assets/atlas/r${row}-f${frame}.png`, ms });
  const recline = (state, ms = 360, pulseKind = "thinking") => ({
    src: `../assets/source/thinking-recline-${state}.png`,
    ms,
    pulse: true,
    pulseKind,
  });
  const seated = (index, ms = 360) => source(index, { ms, pulse: true, pulseKind: "thinking" });

  const idleTwelve = [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1].map((frame) => atlas(0, frame, 145));
  const activeForward = [0, 1, 2, 3, 4, 5, 6].map((frame) => source(frame));
  const reviewGesture = [7, 8, 9, 10].map((frame) => source(frame));
  const activeReverse = [6, 5, 4, 3, 2, 1, 0].map((frame) => source(frame));
  const tumble = [11, 12, 13, 14, 15, 16, 17, 18, 19];
  const recovery = [26, 27, 28, 29].map((frame) => source(frame, { ms: 105 }));
  const sourceLook = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
  ].map((frame) => source(frame, { ms: frame === 0 ? 180 : 115 }));

  const plans = {
    idle: { loop: true, frames: idleTwelve },
    hover: {
      loop: true,
      // Exact requested structure, expanded with source frames omitted by row 7.
      frames: [...activeForward, ...reviewGesture, ...reviewGesture, ...activeReverse, ...idleTwelve],
    },
    thinking: {
      loop: true,
      frames: idleTwelve,
    },
    thinkingRecline: {
      loop: false,
      // The source GIF's seated family: upright -> low sit -> settled open-eyed sit.
      frames: [source(0, { ms: 180 }), seated(29, 220), seated(20, 260), seated(21, 280)],
    },
    thinkingReclineOpen: { loop: true, frames: [seated(21, 650)] },
    thinkingEyeClose: {
      loop: false,
      // Exactly two seconds through the three user-selected seated poses.
      frames: [seated(21, 650), seated(20, 700), seated(29, 650)],
    },
    thinkingReclineClosed: { loop: true, frames: [seated(29, 650)] },
    thinkingEyeOpen: {
      loop: false,
      frames: [seated(29, 650), seated(20, 700), seated(21, 650)],
    },
    thinkingRecover: {
      loop: false,
      // Exact inverse of the seated entry so interaction exits never jump.
      frames: [seated(21, 280), seated(20, 260), seated(29, 220), source(0, { ms: 180 })],
    },
    waiting: {
      loop: true,
      frames: [source(0, { ms: 180 }), source(20), source(21, { ms: 480 }), source(22), source(23, { ms: 420 }), source(22), source(21, { ms: 480 }), source(20), source(0, { ms: 220 })],
    },
    failed: {
      loop: true,
      frames: [source(0), source(24), source(25, { ms: 900, pulse: true }), source(26), source(27), source(28), source(29), source(0, { ms: 420 })],
    },
    // Reverse every sit-up pose to recover the source GIF's omitted lie-down
    // in-betweens. The 960 ms total is exactly half the old playback speed.
    layDown: { loop: false, frames: [0, 29, 28, 27, 26, 25].map((frame) => source(frame, { ms: 160 })) },
    sleeping: { loop: true, frames: [recline("closed", 1900, "sleeping")] },
    wake: { loop: false, frames: [source(26), source(27), source(28), source(29), source(0, { ms: 180 })] },
    moveLeft: { loop: true, frames: tumble.map((frame) => source(frame, { ms: 75 })) },
    moveRight: { loop: true, frames: tumble.map((frame) => source(frame, { ms: 75, mirror: true })) },
    moveRecover: { loop: false, frames: [...recovery, source(0, { ms: 180 })] },
    neutral: { loop: false, frames: [source(0, { ms: 180 })] },
    jump: { loop: false, frames: [source(0), jump(12), jump(13), jump(14), jump(15), jump(16), source(0)] },
    review: { loop: false, frames: [...sourceLook, ...idleTwelve] },
  };

  global.LainAnimationPlan = { plans, idleTwelve };
  if (typeof module !== "undefined") module.exports = { plans, idleTwelve };
})(typeof window !== "undefined" ? window : globalThis);
