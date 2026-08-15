import{c as f,a as x,b as S}from"./scanner-examples-DeC4fR_Z.js";const T=`# QR Scan Core Implementation Guide

> **Documentation maintenance contract — update this guide in the same change.**
>
> This file is the canonical, editable integration guide for QR Scan Core. Iterate on it whenever a change affects scanner behavior, public APIs, lifecycle or cleanup, result delivery, browser or camera support, gestures, styling variables, build or deployment steps, or instructions for current or possible future integrations. A feature or integration change that makes any instruction incomplete, misleading, or obsolete is not complete until this guide is updated. The debugging harness's **Save Guide** button downloads this exact Markdown file; do not maintain a separate generated guide.

This module contains the physical QR scanning feature, its camera and decode implementation, the complete accepted source scanner UI, its radial zoom control, and its gesture controls. It contains no QRQT, Z1Q, inventory, address, BPN, Supabase, assignment, or application-specific logic. By default, a successful scan stores and displays the decoded payload and performs no other action.

## Two-interface implementation methodology

This repository deliberately ships two separate web interfaces backed by the same scanner core and the same accepted assets. They serve different implementation roles and must not be collapsed into one page:

1. **Bare-bones functional skeleton — \`/skeleton/\`.** This is the one-to-one scanner surface without the emulator control wall. It owns a real camera feed, ROI gestures, ZXing QR decoding, the live code pill, statuses, dialogs, and tethered face controls. A successful physical scan displays and delivers the decoded payload exactly as the reusable feature does. It contains no QRQT, Z1Q, database, network, inventory, assignment, navigation, or persistence behavior. Host-looking actions resolve through named no-op hooks so integrators can replace them without reverse-engineering the UI.
2. **Integration emulator — \`/emulator/\`.** This is the dedicated controls pane and preview device. It can select every neutral example status, dialog, lifecycle, camera, gesture, result, device, orientation, and theme state. It is an inspection and development tool, not the starting shell for a product integration. The development build also retains \`/\` as a compatibility entry, but published links should use the explicit \`/emulator/\` route.

Both pages import the same framework-neutral scanner, source-derived markup, styles, icons, radial dial, camera/decode pipeline, and shared inert example catalog. The emulator may expose more controls, but it must never own a scanner state or example definition that the skeleton cannot import and reference.

### Required implementation sequence

Use this sequence for every future scanner feature or integration:

1. Add or change the neutral capability in \`src/\`; do not add host policy there.
2. Keep reusable example dialogs, statuses, and actions in \`examples/scanner-examples.ts\`, with callbacks that are inert until a host supplies behavior.
3. Prove the capability in \`/skeleton/\` as a usable scanner with real camera and result delivery, while keeping every application-specific hook null/no-op.
4. Expose the same capability in \`/\` with dedicated emulator controls and inspectable state.
5. Only after the core, skeleton, and emulator agree should a future host integration attach QRQT, Z1Q, database, routing, assignment, or network behavior outside this repository.
6. Update this guide in the same change whenever any step, API, example, asset, control mapping, or integration instruction changes.

An implementation is incomplete if it exists only in the emulator, only in the bare-bones skeleton, or only in a host application. The intended development loop is **core -> functional skeleton -> emulator reference -> host integration**.

## Scope and ownership

QR Scan Core owns:

- camera stream acquisition, selection, switching, and teardown;
- QR-only frame decoding and ROI preprocessing;
- camera-frame scheduling and hard/rotated decode fallbacks;
- scan-region geometry and video-coordinate conversion;
- feed pointer, touch, pinch, wheel, keyboard, and radial-dial controls;
- best-effort focus, exposure, torch, hardware zoom, and software zoom;
- top-row controls, status primitives, inline dialogs, targeting state, and result display;
- the source camera picker, torch, QR-code pill, close control, held scan region, focus pulse, glass radial dial, jump/accept/cancel controls, inline confirmation prompt, and stale-warning surface;
- dialog-to-control tethering and the two-press animated trash confirmation state machine; the host still owns every operation those controls request;
- result callbacks, events, Promise waiters, handler values, and in-memory history.

The host owns:

- where and when the scanner is mounted or opened;
- routes, modal shells, stacking order, mount dimensions, and surrounding layout;
- authentication, network requests, database reads and writes, navigation, and storage;
- interpretation, validation, lookup, assignment, replacement, and conflict policy;
- application-specific status and dialog copy;
- persistence or serialization of results.

The core never calls the network and never parses payloads as inventory identifiers.

## Install

From a source checkout:

\`\`\`sh
npm install
npm run build
\`\`\`

The library build emits:

\`\`\`text
dist/qr-scan-core.js
dist/qr-scan-core.css
dist/index.d.ts
\`\`\`

The deployable emulator is emitted at \`dist/harness/emulator/index.html\`; the bare-bones functional scanner is emitted at \`dist/harness/skeleton/index.html\`. A compatibility copy of the emulator remains at \`dist/harness/index.html\`. Every URL is relative so either interface can be hosted at a project subpath.

## Static ESM use

\`\`\`html
<link rel="stylesheet" href="./vendor/qr-scan-core.css">
<div id="scanner-slot"></div>
<script type="module">
  import { createQrScanner } from "./vendor/qr-scan-core.js";

  const scanner = createQrScanner();
  scanner.mount(document.querySelector("#scanner-slot")).open();
<\/script>
\`\`\`

The mount node must have a usable width and height. The host determines whether that node is full viewport, a bounded container, or part of a dialog.

## Bare-bones functional skeleton

Run \`npm run dev\` and open \`/skeleton/\` to use the scanner without the emulator wall. This interface mounts the accepted scanner full-viewport, requests the environment-facing camera, decodes physical QR codes through the real ROI/ZXing path, displays the payload, and emits the same result events as the library. The top camera control retries permission or camera acquisition when no stream is active.

The page intentionally exposes its neutral extension surface as \`window.qrScanSkeleton\` for local development:

\`\`\`ts
window.qrScanSkeleton.scanner.addEventListener("scanresult", onScan);
window.qrScanSkeleton.runExample("assign");
await window.qrScanSkeleton.showDialog("destructive");
\`\`\`

These calls drive scanner UI only. They do not assign, overwrite, delete, notify, navigate, persist, or call a network. A future integration should import \`mountSkeleton()\` from \`skeleton/app.ts\` and pass optional \`onScan\`, \`onAction\`, and \`onDialogAction\` hooks instead of editing scanner internals.

For linkable visual states without adding an emulator pane, use \`?example=<name>\` or \`?dialog=<name>\`. For example, \`/skeleton/?example=assign\` shows the assignment prompt and \`/skeleton/?dialog=destructive\` shows the two-press delete dialogue. The definitions come from \`examples/scanner-examples.ts\`, the same catalog used by the emulator.

## Lifecycle

\`\`\`ts
const scanner = createQrScanner({
  camera: {
    autoStart: true,
    facingMode: "environment",
    allowSwitching: true,
  },
});

scanner.mount(hostElement); // appends one scanner subtree
scanner.open();             // visible and camera-enabled
await scanner.startCamera();// explicitly start/retry the default camera
scanner.stopCamera();       // stop tracks while keeping the scanner open
scanner.pause();            // keeps stream ownership; stops scan work
scanner.resume();
scanner.close();            // stops tracks; instance can reopen
scanner.reparent(otherHost);// moves the same instance
scanner.destroy();          // final cleanup; do not reuse
\`\`\`

Lifecycle calls are idempotent. \`close()\` stops decoding, animation/video-frame callbacks, and media tracks. \`destroy()\` additionally removes DOM and listeners, disconnects resize observation, destroys the decoder, and rejects pending \`nextResult()\` Promises with \`LifecycleError\` code \`scanner_destroyed\`.

### Route teardown

\`\`\`ts
const scanner = createQrScanner().mount(routeOutlet).open();

router.onBeforeLeave(() => {
  scanner.destroy();
});
\`\`\`

Use \`close()\` when the same scanner instance will reopen. Use \`destroy()\` when the owning route or feature is permanently unmounted.

\`startCamera(deviceId?)\` and \`stopCamera()\` provide feed-only control for embedded previews and development simulators. \`startCamera()\` requests the configured environment-facing camera when no device ID is supplied. \`stopCamera()\` releases every media track, clears the video element, and leaves the scanner UI and synthetic result path available. Use \`open()\` and \`close()\` when visibility and camera ownership should change together.

## How scanning behaves

This is intentionally not an always-decoding scanner.

- A feed press positions the scan region and requests focus/exposure.
- Holding or dragging owns a scan session and decodes inside the live ROI.
- Dragging moves the ROI.
- Two registered pointers latch opposing corners, resize the square ROI, and recenter it.
- When a pinch becomes one pointer, the remaining pointer continues dragging with a stored offset; the ROI does not jump.
- Releasing the final registered pointer commits the most recent live decoded payload.
- Pointer cancellation stops without committing.
- Pressing and dragging the radial dial can own the same scan session while changing zoom.
- Wheel and \`+\`/\`-\` adjust zoom; arrow keys move the ROI; Enter performs a keyboard scan commit.
- There is no left-edge vertical zoom slider.

The frame loop targets approximately 30 decode attempts per second. Every third attempt enables ZXing \`TRY_HARDER\` and the inverted retry. After repeated misses, the scanner periodically tries one rotated hard decode. The working ROI is capped at 384 pixels on its longest edge for ordinary attempts.

## Results

### Callback

\`\`\`ts
const scanner = createQrScanner({
  onResult(result) {
    console.log(result.payload, result.value, result.context);
  },
});
\`\`\`

### Event

\`\`\`ts
scanner.addEventListener("scanresult", (event) => {
  const result = (event as CustomEvent).detail;
  console.log(result);
});
\`\`\`

### Await the next scan

\`\`\`ts
const next = await scanner.nextResult();
\`\`\`

Every waiter pending at emission time resolves with the same result record.

### Last result and history

\`\`\`ts
scanner.getLastResult(); // ScanResult | null
scanner.getHistory();    // readonly ScanResult[]
\`\`\`

The latest result remains available even when \`historyLimit\` is \`0\`. History defaults to 20 records and remains in memory only.

### Result record

\`\`\`ts
interface ScanResult<TValue> {
  id: string;
  payload: string;           // decoder output, unchanged
  normalizedPayload: string; // injected normalizer output
  value: TValue;             // resolved handler return value
  context: Readonly<ScanContext>;
  timestamp: number;
}
\`\`\`

Camera and synthetic scans use the same pipeline. Synthetic scans are useful for tests and offline integration work:

\`\`\`ts
await scanner.emitSynthetic("example payload", { fixture: "empty-network" });
\`\`\`

## Normalizers and handler values

Both defaults are identity operations. No trimming, uppercasing, URL extraction, address parsing, or code validation occurs unless the host injects it.

\`\`\`ts
const scanner = createQrScanner({
  normalizePayload: (raw) => raw.normalize("NFC"),
  handler: async (normalized, context) => {
    return hostApi.validate(normalized, context);
  },
});
\`\`\`

The handler may return any JavaScript value: the original payload, transformed text, an object, a function, or a Promise. Promises are awaited and the resolved value is stored as \`result.value\`. Values remain live in memory and are not serialized by the core.

If the host treats the handler as validation, return a validation result and separately drive status or dialog UI. Do not import host validation into this package.

## Status, targeting, input, and dialogs

\`\`\`ts
scanner.setStatus({ tone: "pending", text: "Checking with host…" });
scanner.setStatus({ tone: "success", text: "Host accepted result" });
scanner.setStatus(null);

scanner.setTargeting(true);
scanner.setInputLocked(true);
scanner.pause();
\`\`\`

Status tones are \`neutral\`, \`pending\`, \`found\`, \`unmatched\`, \`success\`, \`warning\`, and \`error\`. They are visual semantics only.

Use the source confirmation layout without giving the core any assignment policy:

\`\`\`ts
scanner.setStatus({
  tone: "warning",
  layout: "confirmation",
  text: "Overwrite the current host value?",
  detail: "Use the checkmark to confirm or × to cancel.",
  note: "Optional host-owned conflict detail.",
});

scanner.setCodePresentation({ code: "204811", state: "known" });
scanner.setCodePresentation({ code: null, state: "preview" });

scanner.setActionControls({
  jump: { id: "jump", label: "Open the matched host record" },
  accept: { id: "accept", label: "Confirm host action" },
  cancel: { id: "cancel", label: "Cancel host action" },
});

scanner.addEventListener("action", (event) => {
  const { id, kind } = (event as CustomEvent).detail;
  hostActions.run(id, kind);
});
\`\`\`

\`setCodePresentation()\` exposes the accepted \`idle\`, \`preview\`, \`known\`, and \`unknown\` visual states for host-driven lookup flows. \`setActionControls()\` only configures visibility, accessibility labels, disabled state, and emitted action identifiers. It never navigates, assigns, rewrites, overwrites, or mutates host data.

\`\`\`ts
const action = await scanner.showDialog({
  title: "Replace existing value?",
  body: "This copy and policy came from the host.",
  actions: [
    { id: "cancel", label: "Cancel" },
    { id: "replace", label: "Replace", tone: "primary" },
  ],
});

if (action === "replace") await hostApi.replace();
\`\`\`

Dialogs never open a full-screen modal or opaque overlay. Their title, body, and text actions occupy the live glass prompt directly beneath the top scanner controls, leaving the camera, dial, and tethered action controls visible.

- With two actions, the cancel/back/ignore-style action is white and is tethered to the lower-left circular **X**. The confirm/continue/acknowledge/overwrite/reassign-style action is green and is tethered to the upper-right circular **checkmark**. Semantic tone and familiar action labels win over input order, so reversed host arrays are still latched sensibly.
- Clicking a text action in the prompt and clicking its tethered circle are the same operation.
- While a dialog is active, the top toolbar **X** also invokes the left/cancel action instead of closing the scanner.
- A single neutral dismiss/close/cancel-style action is treated as white cancellation and uses only the **X**. A single \`primary\`, \`danger\`, Continue, Acknowledge, Confirm, Overwrite, or Reassign-style action is treated as green confirmation and uses only the checkmark.
- Keep dialogs to one or two actions so every visible action has a physical control tether.

Use the explicit \`delete\` tone only for irreversible deletion:

\`\`\`ts
const action = await scanner.showDialog({
  title: "Delete this record?",
  body: "This cannot be undone.",
  actions: [
    { id: "cancel", label: "Cancel" },
    { id: "delete", label: "Delete", tone: "delete" },
  ],
});

if (action === "delete") await hostApi.deleteRecord();
\`\`\`

The delete action replaces the checkmark with the Job Editor trash glyph. It requires two separate presses. Each press runs the complete 900 ms lid/morsel/bin animation; after the first finishes, the prompt explicitly asks for the second press, and the Promise resolves only after the second animation finishes. Cancel remains available between presses. Reduced-motion preferences compress the decorative timing without removing the two confirmation steps.

The scanner resolves an action identifier and emits \`dialogaction\`. It performs no associated operation, including deletion.

## Camera permissions and secure contexts

Real camera acquisition requires HTTPS or a browser-recognized localhost origin. An insecure remote HTTP page can run the synthetic harness but cannot obtain \`getUserMedia\`.

Ask for camera permission from a visible user-initiated flow when possible. Permission may be denied permanently, blocked by iframe policy, unavailable because another app owns the camera, or interrupted after acquisition. Listen for \`cameraerror\` and show host-appropriate recovery copy.

\`\`\`ts
scanner.addEventListener("cameraerror", (event) => {
  console.error((event as CustomEvent).detail.message);
});
\`\`\`

Camera labels may be empty until permission is granted. \`enumerateCameras()\` therefore returns raw browser devices without inventing stable identity.

For an interactive integration, provide a visible Start/Retry control even when \`camera.autoStart\` is enabled. It gives users a recovery path after a denied, dismissed, interrupted, or browser-blocked permission request:

\`\`\`ts
startButton.addEventListener("click", async () => {
  await scanner.startCamera(selectedDeviceId || undefined);
});

stopButton.addEventListener("click", () => {
  scanner.stopCamera();
});
\`\`\`

The scanner's \`<video>\` is the real preview surface. Once a stream is active, press and hold over a visible QR code to position the ROI and decode live frames; release to commit the most recently decoded payload through the normal result pipeline.

## iOS Safari

- Use HTTPS and a direct user gesture for the first camera open.
- Keep the \`<video>\` inline; the module sets \`playsinline\` and \`muted\`.
- Expect torch and hardware zoom capabilities to be absent even when the physical device supports them.
- Safari may provide one logical rear camera rather than separate lens device IDs.
- Viewport size changes as browser chrome expands or collapses. Give the host container a modern \`dvh\`/\`svh\` strategy.
- Do not depend on user-agent model detection for camera behavior.

The scanner uses runtime capabilities as truth and falls back to software zoom. Missing torch, focus, exposure, or multi-camera control degrades independently and never disables raw QR decoding.

## Zoom and camera switching

The radial dial exposes a logical zoom range. Runtime camera profiles become contiguous segments:

- a hardware segment applies \`MediaTrackConstraints.zoom\`;
- a software segment scales the preview and adjusts ROI-to-video mapping;
- crossing into a segment backed by another device opens that camera and resumes the owned scan session.

The module does not infer an ultrawide or telephoto camera solely from a label. Runtime capabilities drive the model. \`allowSwitching: false\` confines the range to one active camera.

## Layout, touch, and orientation

The host owns mount geometry. The scanner fills its host.

\`\`\`css
.scanner-route {
  position: fixed;
  inset: 0;
  min-height: 100dvh;
}

.scanner-card {
  width: min(100%, 42rem);
  height: min(80dvh, 56rem);
}
\`\`\`

The module uses safe-area insets, \`touch-action: none\` only on scanner-owned gesture surfaces, 44-pixel minimum targets, and scoped scroll prevention. It observes host resizing and preserves the instance through orientation changes and reparenting. The host must assign an intentional stacking context if scanner and application dialogs overlap.

On coarse-pointer hardware—or in any viewport no wider than 480 CSS pixels—the top controls, code pill, dialog copy, action controls, and radial dial use a larger touch scale. The capability branch is intentional: foldables such as the Galaxy Z Fold can report a tablet-sized or desktop-style CSS viewport even while the interface is operated at phone distance, so a width-only phone breakpoint can make fixed controls physically tiny. Do not replace this rule with user-agent detection or restrict it to only a narrow-width media query. Ordinary mouse and trackpad layouts retain the compact reference scale; narrow windows receive the accessible scale, and very narrow touch viewports receive a fit-preserving override so the complete top row remains visible.

Primary coarse-pointer breakpoints match the source application:

- phone: \`pointer: coarse\` and \`max-width: 767px\`;
- tablet: \`pointer: coarse\` and \`768px–1199px\`;
- desktop: fallback and debugging compatibility.

Reduced-motion preferences shorten decorative animation without disabling controls.

## Theming

Set variables on the scanner host or \`.qrs-root\`:

\`\`\`css
.my-scanner {
  --qrs-bg: #04020c;
  --qrs-accent: #c6a8ff;
  --qrs-success: #7fe3d4;
  --qrs-zone-size: 4.95rem;
}
\`\`\`

The stylesheet preserves the accepted \`.qr-scanner\` and \`.qr-scanner__*\` class anatomy and also keeps \`qrs-\` hooks where the framework-neutral controller needs stable element references. The source camera, lightbulb, and jump SVG assets are shipped in \`src/assets\`. Do not replace the accepted chrome with a newly designed shell. If the source scanner UI changes, port the changed markup, assets, states, and relevant style rules together, update the harness state gallery, and update this guide in the same change.

The stylesheet is scoped beneath \`.qrs-root\`/\`.qr-scanner\` and does not target the host's \`body\` or unrelated controls. The harness's violet terminal-wall styling is separate and can be deleted without affecting the scanner.

## Events

The controller is an \`EventTarget\` and emits:

| Event | Detail |
| --- | --- |
| \`statechange\` | complete public state snapshot |
| \`scanstart\` | none |
| \`scanpreview\` | latest live payload found during an owned gesture |
| \`scanend\` | \`{ committed, payload }\` |
| \`scanresult\` | final \`ScanResult\` |
| \`roichange\` | normalized scanner ROI in stage pixels |
| \`dialogaction\` | \`{ actionId }\` |
| \`action\` | \`{ id, kind }\` from a configured jump, accept, or cancel control |
| \`cameraerror\` | \`{ error, message }\` |
| \`close\` | none; emitted by the top close control |

## Replacing the decoder

Inject an object implementing \`QrDecoder\`:

\`\`\`ts
const scanner = createQrScanner({
  decoder: {
    async decode({ video, roi, tryHarder, rotation }) {
      return myDecoder.read(video, roi, { tryHarder, rotation });
    },
    destroy() {
      myDecoder.release();
    },
  },
});
\`\`\`

The decoder receives source-video pixel coordinates after object-fit, software-zoom, ROI padding, resize, and orientation transforms have been applied.

## React adapter

React is not a runtime dependency. A small integration example lives in \`examples/react/QrScannerView.tsx\`:

\`\`\`tsx
function QrScannerView({ open, onScan }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!host.current) return;
    const scanner = createQrScanner({ onResult: onScan }).mount(host.current);
    if (open) scanner.open();
    return () => scanner.destroy();
  }, []);

  return <div ref={host} className="scanner-route" />;
}
\`\`\`

In a real adapter, keep the scanner in a ref and use a second effect to call \`open()\` or \`close()\` when the prop changes.

## Debugging harness

\`\`\`sh
npm run dev
\`\`\`

The Vite server exposes both development surfaces at the same origin:

- \`/skeleton/\` — bare-bones functional scanner;
- \`/emulator/\` — integration emulator and controls wall;
- \`/\` — compatibility entry for the emulator.

The harness defaults to a 440 × 956 logical phone preview. Its **Accepted reference UI states** group previews every source state: idle camera, held/live scanning, known and unknown QR results, jump and accept affordances, assign/rewrite/overwrite confirmations, QRQT conflict presentation, stale/retired/permanently-tombstoned warnings, and camera errors. These are inert UI skeletons backed by \`setCodePresentation()\`, \`setActionControls()\`, \`setStatus()\`, and \`showDialog()\`; they do not carry database behavior into the core.

The harness requests the real environment-facing camera on startup and renders that stream directly inside the preview device. Its **Start / retry camera** and **Stop camera** controls manage the feed without destroying or hiding the scanner. Hold over a QR code in the device preview to decode live frames and release to commit the result. The harness also exercises the synthetic result path, handler values, result history, lifecycle, device/orientation sizing, safe areas, targeting, camera failure states, ROI changes, event logs, and theme variables when a camera is unavailable.

The fixed controls panel never changes position when preview mode changes. Phone and tablet modes resize the existing host and scanner. The scanner instance is recreated only by the explicit **Destroy + recreate** command.

The **Save Guide** control uses an inline SVG so the canonical Markdown download remains visually complete when the emulator is built or hosted at a nested project path.

## Deployment

Build with relative asset URLs:

\`\`\`sh
npm run build
\`\`\`

Deploy \`dist/harness/\` as a complete directory so the explicit \`emulator/\` and \`skeleton/\` routes stay together. It can live at \`/qr-scanner/\`, \`/database/tools/scanner/\`, or another project subpath. Preserve HTTPS for camera access. Publish and share the explicit \`/emulator/\` and \`/skeleton/\` links; the directory root remains an emulator compatibility entry.

For source consumption, publish or mirror the whole repository. Do not replace an existing website repository's source history merely to deploy the harness; copy the harness build into an isolated subdirectory instead.

## Future integration checklist

When adding a new host integration:

1. Keep host parsing and policy outside \`src/\`.
2. Pass payload interpretation through \`normalizePayload\`, \`handler\`, or external listeners.
3. Drive code presentation, action controls, statuses, dialogs, targeting, and locks explicitly from the host.
4. Destroy the scanner when its owner is removed.
5. Exercise the integration with synthetic payloads before requesting camera permission.
6. Add its neutral scenario to \`examples/scanner-examples.ts\`, prove it in the bare-bones skeleton, and expose it through the emulator controls.
7. Confirm the skeleton still contains no QRQT, Z1Q, database, network, assignment, routing, or persistence implementation.
8. Update this guide in the same change whenever instructions, contracts, compatibility, or future integration guidance changed.
9. If the accepted source UI changes, port its complete markup, visible copy structure, icons/assets, states, styling, and responsive behavior; do not substitute a simplified or newly invented scanner shell.
`,a=e=>{const n=document.querySelector(e);if(!n)throw new Error(`Harness is missing ${e}`);return n},g=a("#lab"),y=a("#scanner-host"),d=a("#event-log"),R=a("#state-output"),I=a("#runtime-badge"),v=a("#payload"),u=a("#handler-mode"),E=a("#handler-output"),C=a("#status-text"),L=a("#dialog-title"),q=a("#dialog-body"),A=a("#dialog-output"),l=a("#camera-list"),i=a("#camera-feed-status");let s,h,m=!1;function p(e){if(typeof e=="function")return`[function ${e.name||"anonymous"}] → ${String(e())}`;if(typeof e=="string")return JSON.stringify(e);try{return JSON.stringify(e)}catch{return String(e)}}function o(e,n){var c;const t=document.createElement("li"),r=new Date().toISOString().slice(11,23);for(t.innerHTML=`<time>${r}</time> <b>${e}</b>${n===void 0?"":` / ${O(p(n))}`}`,d.prepend(t);d.children.length>80;)(c=d.lastElementChild)==null||c.remove()}function O(e){return e.replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}function Q(e){return u.value==="uppercase"?e.toUpperCase():u.value==="function"?()=>`callable:${e}`:u.value==="async"?Promise.resolve({accepted:!0,payload:e,source:"async harness handler"}):e}function w(){const e=S({camera:{autoStart:!0,facingMode:"environment",idealWidth:1920,idealHeight:1080,allowSwitching:!0},historyLimit:25,handler:n=>Q(n)});for(const n of["scanstart","scanend","scanpreview","scanresult","statechange","roichange","dialogaction","cameraerror","action","close"])e.addEventListener(n,t=>{const r="detail"in t?t.detail:void 0;n!=="statechange"&&o(n,r),n==="statechange"&&b(r),n==="roichange"&&(a("#gesture-output").value="pointer/keyboard ROI update"),n==="scanresult"&&(E.value=`handler value / ${p(r.value)}`,a("#last-result").value=p(r.payload)),n==="cameraerror"&&(i.value=`error / ${r.message}`,e.setStatus({tone:"error",text:`Camera unavailable: ${r.message}`}))});return e.mount(y).open(),e}function b(e){I.value=`INSTANCE / ${e.lifecycle.toUpperCase()}${e.inputLocked?" / LOCKED":""}`,R.textContent=JSON.stringify(e,(n,t)=>typeof t=="function"?"[function]":t,2),e.cameraLabel?i.value=`live / ${e.cameraLabel}`:e.cameraError?i.value=`error / ${e.cameraError}`:e.lifecycle!=="open"&&(i.value="stopped / start camera to test live scanning"),a("#roi-output").value=`x ${e.roi.x.toFixed(0)} / y ${e.roi.y.toFixed(0)} / ${e.roi.size.toFixed(0)}px`,a("#camera-output").value=`${e.cameraLabel??"no live camera"} / ${e.zoom.toFixed(2)}× ${e.zoomSource}`}s=w();h=f(s);b(s.getState());o("harness-ready","requesting a live camera; press and hold the preview to decode, then release to commit");document.addEventListener("click",e=>{const n=e.target.closest("button");if(!n)return;const t=n.dataset.command;if(t==="open"&&s.open(),t==="close"&&s.close(),t==="pause"&&s.pause(),t==="resume"&&s.resume(),t==="lock"&&(m=!0,s.setInputLocked(!0)),t==="unlock"&&(m=!1,s.setInputLocked(!1)),t==="dismiss-result"&&s.dismissResult(),t==="target-on"&&s.setTargeting(!0).setStatus({tone:"pending",text:"Targeting mode controlled by host"}),t==="target-off"&&s.setTargeting(!1).setStatus({tone:"neutral",text:"Targeting cancelled by host"}),t==="roi-reset"&&s.resetRoi(),t==="recreate"&&(s.destroy(),s=w(),h=f(s),s.setInputLocked(m),o("instance-recreated")),t==="rapid"){const r=v.value;Promise.all(Array.from({length:5},(c,k)=>s.emitSynthetic(r,{rapidIndex:k})))}});a("#device-controls").addEventListener("click",e=>{const n=e.target.closest("[data-device]");n!=null&&n.dataset.device&&(g.dataset.device=n.dataset.device,document.querySelectorAll("[data-device]").forEach(t=>t.setAttribute("aria-pressed",String(t===n))),requestAnimationFrame(()=>s.resetRoi()),o("preview-device",n.dataset.device))});a("#orientation-controls").addEventListener("click",e=>{const n=e.target.closest("[data-orientation]");n!=null&&n.dataset.orientation&&(g.dataset.orientation=n.dataset.orientation,document.querySelectorAll("[data-orientation]").forEach(t=>t.setAttribute("aria-pressed",String(t===n))),requestAnimationFrame(()=>s.resetRoi()),o("preview-orientation",n.dataset.orientation))});a("#safe-area").addEventListener("change",e=>{g.dataset.safeArea=String(e.target.checked),requestAnimationFrame(()=>s.resetRoi())});a("#emit-scan").addEventListener("click",()=>void s.emitSynthetic(v.value));a("#payload-presets").addEventListener("click",e=>{const n=e.target.closest("[data-payload]");(n==null?void 0:n.dataset.payload)!==void 0&&(v.value=n.dataset.payload)});a("#status-controls").addEventListener("click",e=>{const n=e.target.closest("[data-tone]"),t=n==null?void 0:n.dataset.tone;t&&s.setStatus(t==="clear"?null:{tone:t,text:C.value})});a("#dialog-controls").addEventListener("click",e=>{const n=e.target.closest("[data-dialog]");if(!(n!=null&&n.dataset.dialog))return;const t=n.dataset.dialog,r=t==="custom"?{title:L.value,body:q.value}:void 0;h.showDialog(t,r).then(c=>{A.value=`resolved action / ${c}`})});a("#context-controls").addEventListener("click",e=>{const n=e.target.closest("[data-context]"),t=n!=null&&n.dataset.context?h.states[n.dataset.context]:void 0;t&&t()});a("#enumerate").addEventListener("click",async()=>{const e=await s.enumerateCameras();l.replaceChildren(...e.length?e.map((n,t)=>new Option(n.label||`Camera ${t+1}`,n.deviceId)):[new Option("No camera available","")]),o("camera-enumeration",e.map(n=>({id:n.deviceId,label:n.label})))});a("#start-camera").addEventListener("click",async()=>{i.value="requesting camera access",await s.startCamera(l.value||void 0);const e=s.getState();e.cameraLabel&&(s.setStatus({tone:"success",text:"Camera live. Press and hold over a QR code; release to commit the scan."}),o("camera-started",{id:e.cameraId,label:e.cameraLabel}))});a("#stop-camera").addEventListener("click",()=>{s.stopCamera(),i.value="stopped / start camera to test live scanning",s.setStatus({tone:"neutral",text:"Camera stopped. The simulator and synthetic scan controls remain available."}),o("camera-stopped")});l.addEventListener("change",()=>{l.value&&(i.value="switching camera",s.selectCamera(l.value))});a("#camera-simulations").addEventListener("click",e=>{const n=e.target.closest("[data-camera-state]"),t=n!=null&&n.dataset.cameraState?x[n.dataset.cameraState]:void 0;t&&(s.setStatus(t),o("camera-simulation",n.dataset.cameraState))});document.querySelectorAll("[data-css-var]").forEach(e=>{const n=()=>y.style.setProperty(e.dataset.cssVar,e.value);e.addEventListener("input",n)});a("#clear-log").addEventListener("click",()=>d.replaceChildren());a("#save-guide").addEventListener("click",()=>{const e=URL.createObjectURL(new Blob([T],{type:"text/markdown;charset=utf-8"})),n=document.createElement("a");n.href=e,n.download="QR-SCAN-CORE-IMPLEMENTATION.md",n.click(),URL.revokeObjectURL(e),o("guide-saved","exact docs/IMPLEMENTATION.md content")});
//# sourceMappingURL=emulator-kpvsCAvS.js.map
