# QR Scan Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone, framework-neutral QR scanner module and complete offline debugging harness from the database scanner's physical behavior.

**Architecture:** An imperative TypeScript `QrScanner` owns DOM, camera, decoder, gestures, zoom, statuses, dialogs, and result delivery. Focused camera/decoder/geometry modules support the controller; a Vite harness consumes the same public API and imports the canonical Markdown guide as raw text.

**Tech Stack:** TypeScript 5, Vite 6, Vitest 3, jsdom, `@zxing/library`, DOM/Media Capture APIs.

**Spec:** `docs/superpowers/specs/2026-08-13-qr-scan-core-design.md`

## Global Constraints

- Core runtime has no React, Supabase, QRQT, Z1Q, inventory, address, BPN, assignment, or network dependency.
- Phone is `max-width: 767px and pointer: coarse`; tablet is `768px–1199px and pointer: coarse`.
- Scanner-owned touch targets are at least 44 × 44 CSS pixels and account for safe-area insets.
- `docs/IMPLEMENTATION.md` is the only guide source and the harness downloads it unchanged.
- All scanner styling is scoped to `.qrs-root` and important choices use `--qrs-*` custom properties.
- Verification runs only at the final pre-push gate; coverage is not requested.

---

### Task 1: Public result and lifecycle core

**Files:**
- Create: `tests/result-pipeline.test.ts`
- Create: `src/core/types.ts`
- Create: `src/core/result-pipeline.ts`
- Create: `src/core/lifecycle-error.ts`

**Interfaces:**
- Produces: `ResultPipeline.emit(payload, context)`, `subscribe`, `next`, `last`, `history`, and `destroy`.

- [ ] Write behavior tests for raw/default results, async and function handler values, callbacks/events, bounded history, and pending Promise rejection on destroy.
- [ ] Implement the smallest typed result pipeline satisfying those contracts.
- [ ] Keep payloads and handler values unparsed and unserialized.
- [ ] Commit as `feat: add neutral scan result contract`.

### Task 2: Camera, decode, zoom, and geometry primitives

**Files:**
- Create: `tests/geometry.test.ts`
- Create: `tests/zoom.test.ts`
- Create: `src/core/geometry.ts`
- Create: `src/camera/zoom.ts`
- Create: `src/camera/media.ts`
- Create: `src/decoder/types.ts`
- Create: `src/decoder/zxing.ts`

**Interfaces:**
- Produces: cover-video coordinate mapping, padded ROI, pinch frames, dial mappings, logical camera segments, camera probing, torch constraints, and `QrDecoder.decode`.

- [ ] Write literal geometry and zoom expectations that detect transform, clamp, and segment boundary errors.
- [ ] Port the database scanner's 384-pixel ROI, contrast stretch, QR-only hints, hard/inverted fallback, runtime camera probing, and logical zoom segmentation.
- [ ] Preserve capability degradation through feature detection.
- [ ] Commit as `feat: preserve scanner camera and decode primitives`.

### Task 3: Imperative scanner and scoped UI

**Files:**
- Create: `tests/scanner.test.ts`
- Create: `src/core/qr-scanner.ts`
- Create: `src/ui/template.ts`
- Create: `src/ui/scanner.css`
- Create: `src/index.ts`

**Interfaces:**
- Consumes: result pipeline, geometry, media, zoom, and decoder modules.
- Produces: `createQrScanner(options): QrScannerController` and all public lifecycle, status, dialog, targeting, synthetic scan, camera, zoom, and ROI methods.

- [ ] Write controller tests for idempotent lifecycle, listener and media cleanup, reparenting, input locks, cancel-without-commit, final-pointer commit, neutral statuses, and resolved dialog actions.
- [ ] Implement the DOM tree and state controller.
- [ ] Preserve press-to-scan, drag, opposing-corner pinch, pinch-to-single continuity, dial-owned scan sessions, wheel/keyboard zoom, focus/exposure, torch, camera selection, hardware/software zoom, and camera switching.
- [ ] Port database-derived visual geometry into scoped `qrs-*` CSS with custom properties and reduced-motion behavior.
- [ ] Commit as `feat: add framework neutral scanner controller`.

### Task 4: Terminal-wall harness and examples

**Files:**
- Create: `index.html`
- Create: `harness/main.ts`
- Create: `harness/style.css`
- Create: `examples/react/QrScannerView.tsx`
- Create: `public/floppy.svg`

**Interfaces:**
- Consumes: `createQrScanner`, public options/types, and `docs/IMPLEMENTATION.md?raw`.
- Produces: deployable preview, full state emulator, live event log, CSS editor, and exact guide download.

- [ ] Build stable phone/tablet/web preview geometry without scanner recreation.
- [ ] Wire lifecycle, synthetic payload presets, statuses, dialogs, host-context examples, camera simulations, ROI controls, and state inspectors through public APIs.
- [ ] Adapt the supplied terminal-wall shell while keeping scanner CSS independent.
- [ ] Normalize the floppy icon to `currentColor` and pin Save Guide to the panel bottom.
- [ ] Commit as `feat: add scanner debugging harness`.

### Task 5: Documentation and delivery

**Files:**
- Create: `README.md`
- Create: `docs/IMPLEMENTATION.md`
- Create: `docs/EXTRACTION-NOTES.md`
- Create: `docs/DATABASE-INTEGRATION.md`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`

**Interfaces:**
- Documents all exported interfaces, ownership boundaries, browser constraints, theming, deployment, React integration, and clean database reconnection.

- [ ] Write the canonical guide with its same-change maintenance rule near the top.
- [ ] Map each extracted source symbol to its destination, removed coupling, and neutral replacement.
- [ ] Document adapter-only database integration and contamination checks.
- [ ] Initialize `main`, create coherent commits, and run focused tests plus production build only at the final pre-push gate.
- [ ] Present exact remote and deployment operations for user approval before pushing or deploying.

