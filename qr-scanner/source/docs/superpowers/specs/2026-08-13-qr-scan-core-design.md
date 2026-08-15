# QR Scan Core Extraction Design

## Goal

Extract the database application's physical QR-scanning experience into a framework-neutral, reusable TypeScript module and a deployable debugging harness. The core preserves camera, decode, ROI, gesture, focus, exposure, torch, zoom, and presentation behavior while containing no inventory, QRQT, Z1Q, Supabase, assignment, address, or BPN policy.

## Architecture

`QrScanner` is an imperative controller and DOM renderer. It owns one mounted scanner subtree, its media stream, decoder, frame loop, pointer sessions, zoom model, transient dialogs, statuses, and in-memory results. Hosts mount and reparent the same instance, configure neutral hooks, and control surrounding routes or dialogs.

The public surface is exported from `src/index.ts`. Camera and zoom math live in focused modules, the decoder is replaceable through `QrDecoder`, and database-derived states are inert configuration primitives. React is represented only by an example adapter.

## Result contract

Every camera or synthetic payload follows one pipeline: optional normalization, configurable handler, stored result record, visible result card, callback, `scanresult` event, and queued Promise resolution. The default normalizer and handler are identity operations. Handler return values remain live JavaScript values in memory, including functions and resolved Promise values.

## Lifecycle

`mount`, `open`, `close`, `pause`, `resume`, `setInputLocked`, `reparent`, and `destroy` are idempotent. Closing stops frame work and media tracks but keeps the instance reusable. Reparenting and viewport changes do not recreate the instance or intentionally drop a live stream. Destroying removes DOM and listeners, stops tracks and scheduling, clears timers, and rejects pending `nextResult()` requests.

## Presentation and extension points

All module CSS is scoped beneath `.qrs-root`, uses a `qrs-` class prefix, and exposes theme variables. The module provides neutral status variants, dialogs and action identifiers, input locking, targeting state, result confirmation, host validation, and host action callbacks. None is triggered by application concepts.

The harness uses the supplied terminal-wall design only around the scanner. It supports phone, tablet, and web preview modes; orientation and safe-area simulation; lifecycle and camera failure simulation; synthetic scanning; state, dialog, event, gesture, and CSS-variable inspection. Database-derived scenarios are explicitly labelled host-integration examples.

## Documentation source of truth

`docs/IMPLEMENTATION.md` is the canonical, editable integration guide. Vite imports it as raw text into the harness, and **Save Guide** downloads those exact bytes. The guide prominently requires maintainers to update it in the same change whenever scanner behavior, APIs, lifecycle, browser support, styling, deployment, or integration instructions change.

## Verification

Focused Vitest coverage validates result delivery, handler values, lifecycle cleanup, geometry, zoom mapping, and inert extension points. The production build validates type safety and subpath-safe assets. Camera-dependent behavior is also represented by injectable media/decoder dependencies and harness simulation. Per the source repository policy, verification is deferred to the final pre-push gate.

