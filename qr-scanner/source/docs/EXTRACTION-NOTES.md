# Extraction Notes

The database repository was treated as read-only. These notes map its scanner behaviors to the standalone destination and identify removed coupling.

## Physical scanner mapping

| Source file and symbol/area | Destination | Coupling removed | Neutral replacement |
| --- | --- | --- | --- |
| `src/components/QrScanner.tsx` / `QrScanner` | `src/core/qr-scanner.ts` / `QrScanner` | React component lifecycle and inventory props | Imperative `mount/open/close/pause/resume/reparent/destroy` controller |
| `QrScanner.tsx` / `ScanMode`, pointer ownership, gesture session | `QrScanner.beginScan`, pointer handlers | Assignment/lookup actions after decode | Gesture owns decode; final pointer release emits neutral result; cancel never commits |
| `QrScanner.tsx` / pinch frame and drag offset | `src/core/geometry.ts`, `updatePinch`, pinch-to-single branch | none | Framework-neutral opposing-corner ROI resize with continuous remaining-finger drag |
| `QrScanner.tsx` / decode cadence and hard attempts | `QrScanner.decodeFrame` | result lookup branches | 30 Hz target, every-third hard decode, periodic rotated fallback, preview then neutral commit |
| `QrScanner.tsx` / ROI transform | `coverRectToVideoRoi`, `padRoiPixels` | component refs only | Host-size/video-size/software-zoom-aware source pixel ROI |
| `QrScanner.tsx` / focus and exposure constraints | `src/camera/media.ts` / `requestFocusExposure` | none | capability-detected, best-effort camera enhancement |
| `QrScanner.tsx` / torch toggle | `applyTorchConstraint`, `setTorch` | scanner-specific React state | public Promise API plus neutral control state |
| `QrScanner.tsx` / camera selection and storage | `enumerateCameras`, `selectCamera`, `cycleCamera` | database-specific local-storage key | live-instance selection; hosts may persist an ID themselves |
| `QrScanner.tsx` / radial quadrant zoom | `src/camera/zoom.ts`, `setZoom`, dial handlers | React SVG rendering | scoped SVG dial and public logical zoom API |
| `QrScanner.tsx` / wheel and keyboard controls | `onWheel`, `onKeyDown` | none | scanner-owned wheel/keyboard input; no global listeners |
| `src/lib/qrScanEngine.ts` / `QrDecodeEngine` | `src/decoder/zxing.ts` / `ZxingQrDecoder` | fixed component construction | injected `QrDecoder` boundary; preserved QR-only, contrast, hard and inverted behavior |
| `src/lib/cameraZoom.ts` / capability and unified model functions | `src/camera/zoom.ts` | none | public, runtime-first zoom primitives |
| `src/lib/phoneZoomDb.ts` / model hint table | not copied | user-agent/model inference and stale device catalog | runtime camera capabilities plus deterministic 1×–4× software fallback |
| `src/styles.css` / `.qr-scanner*` geometry | `src/ui/scanner.css` | global stylesheet and host selectors | `.qrs-root` scope, `qrs-` prefix, `--qrs-*` variables |
| `src/components/QrScanner.test.tsx` / physical interaction expectations | `tests/scanner.test.ts`, `tests/geometry.test.ts`, `tests/zoom.test.ts` | inventory mocks and React render scaffolding | public controller behavior and literal geometry tests |
| `src/styles.test.ts` / scanner structure checks | scoped runtime UI and production build | source-string assertions | observable DOM/accessibility behavior and isolated CSS artifact |

## Database-conditioned branches removed

| Source | Removed behavior | Neutral capability |
| --- | --- | --- |
| `src/lib/qrCode.ts` / `canonicalizeQrCode` | six-character QRQT key and `z1q.us` URL normalization | identity normalizer by default; optional `normalizePayload` hook |
| `src/lib/search.ts` / `resolveQrCode` and QR binding operations | Supabase queries, address/BPN lookup, assignment, release, navigation | `handler`, `onResult`, `scanresult`, and `nextResult`; host owns all calls |
| `src/lib/zombieQr.ts` / stale lookup, notification, retirement | Supabase RPC and QRQT edge-function state | neutral warning/error statuses, dialogs, action IDs, and host callbacks |
| `src/lib/qrqtErrors.ts` / error parsing | QRQT response interpretation | host chooses status tone/text and dialog copy |
| `src/lib/qrqtLifecycleStatus.ts` / lifecycle mapping | QRQT lifecycle vocabulary and assignability | inert `StatusTone`, `ScannerStatus`, and generic dialogs |
| `src/components/ZombieQrWarning.tsx` | stale/retired/tombstoned policy copy and notification operation | generic dialogs with arbitrary title/body/actions; harness-only labelled examples |
| `src/components/QrScanner.tsx` / `currentTarget`, `currentTargetQr`, `targetKind` | address/BPN targeting and rewrite prompts | boolean targeting state and host-chosen status/dialogs |
| `QrScanner` / `onAssign`, `resolveCode`, `resolveZombieCode`, `notifyZombie` | data lookup and mutation | handler and external listener integration |
| `QrScanner` / `stagingMode` and apply-next | inventory editor staging | host callback receives the same result and decides next action |
| `src/App.tsx` / scanner mode and routing | React route/modal state and navigation to matches | host owns mount, open/close, route teardown, and reparenting |

## Behaviors deliberately changed

- React is no longer required. DOM rendering is internal to an imperative controller.
- Camera choice is not stored under the database application's local-storage key. Persistence belongs to the host.
- The phone-model zoom hint table is omitted. It was advisory and age-sensitive; the standalone core trusts runtime capabilities and uses a safe software fallback.
- Database statuses and warnings are not automatic. The harness demonstrates them as explicitly labelled host examples.
- A successful result remains visible until either checkmark or dismiss control is used. Both controls only dismiss presentation.

## Invariants retained

- Idle does not decode continuously.
- Feed or dial interaction begins a scan session.
- Press positions the ROI and requests focus/exposure.
- Drag moves the ROI; pinch resizes/recenters it.
- Pinch-to-single transition uses a drag offset and does not jump.
- Final registered pointer release commits the latest live decode.
- Pointer cancellation never commits.
- Radial zoom can own scanning.
- Hardware, software, and camera-segment zoom paths preserve ROI agreement.
- No left-edge vertical zoom slider was introduced.

