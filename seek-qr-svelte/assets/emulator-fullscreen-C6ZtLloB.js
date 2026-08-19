const s=`# QR Scan Core Implementation Guide\r
\r
> **Documentation maintenance contract — update this guide in the same change.**\r
>\r
> This file is the canonical, editable integration guide for QR Scan Core. Iterate on it whenever a change affects scanner behavior, public APIs, lifecycle or cleanup, result delivery, browser or camera support, gestures, styling variables, build or deployment steps, or instructions for current or possible future integrations. A feature or integration change that makes any instruction incomplete, misleading, or obsolete is not complete until this guide is updated. The debugging harness's **Save Guide** button downloads this exact Markdown file; do not maintain a separate generated guide.\r
>\r
> **Two-implementation parity contract:** every functional or UI change must be carried into both the initial implementation and the side-by-side Svelte implementation in the same change. Update their skeletons, emulators, tests, and this guide together. Neither implementation is a temporary branch or a replacement for the other; both live on \`main\`.\r
\r
This module contains the physical QR scanning feature, its camera and decode implementation, the complete accepted source scanner UI, its radial zoom control, and its gesture controls. It contains no QRQT, Z1Q, inventory, address, BPN, Supabase, assignment, or application-specific logic. By default, a successful scan stores and displays the decoded payload and performs no other action.\r
\r
## Side-by-side implementation methodology\r
\r
This repository deliberately ships two scanner implementations, each with a functional skeleton and an integration emulator. The implementations must not be collapsed or allowed to drift:\r
\r
- **Initial implementation:** \`src/core/qr-scanner.ts\`, \`skeleton/\`, and \`harness/\`. It owns an imperative DOM surface and its controller lifecycle.\r
- **Svelte implementation:** \`svelte/src/QrScanner.svelte\`, \`svelte/src/runtime/\`, \`svelte/skeleton/\`, and \`svelte/harness/\`. Svelte owns its scanner markup and reactive surface projection; its runtime preserves the same public behavior and camera lifecycle.\r
- **Shared neutral modules:** \`src/camera/\`, \`src/core/geometry.ts\`, \`src/core/result-pipeline.ts\`, \`src/core/dialog-actions.ts\`, \`src/core/handedness.ts\`, \`src/decoder/\`, \`src/ui/scanner.css\`, \`src/assets/\`, and \`examples/scanner-examples.ts\`. Sharing these modules reduces drift but does not remove the requirement to verify both rendered implementations.\r
\r
Within each implementation, the two pages serve different roles:\r
\r
1. **Bare-bones functional skeleton — \`/skeleton/\`.** This is the one-to-one scanner surface without the emulator control wall. It owns a real camera feed, ROI gestures, ZXing QR decoding, the live code pill, statuses, dialogs, and tethered face controls. A successful physical scan displays and delivers the decoded payload exactly as the reusable feature does. It contains no QRQT, Z1Q, database, network, inventory, assignment, navigation, or application-data persistence behavior. The only browser-persisted value is the user-interface handedness preference. Host-looking actions resolve through named no-op hooks so integrators can replace them without reverse-engineering the UI.\r
2. **Integration emulator — \`/emulator/\`.** This is the dedicated controls pane and preview device. It can select every neutral example status, dialog, lifecycle, camera, gesture, result, device, orientation, and theme state. It is an inspection and development tool, not the starting shell for a product integration. The development build also retains \`/\` as a compatibility entry, but published links should use the explicit \`/emulator/\` route.\r
\r
The initial pages are \`/skeleton/\` and \`/emulator/\`. Their Svelte equivalents are \`/svelte/skeleton/\` and \`/svelte/emulator/\`. All four import the same accepted styles, icons, camera/decode primitives, and inert example catalog. An emulator may expose more controls, but it must never own a scanner state or example definition that its skeleton cannot import and reference.\r
\r
### Required implementation sequence\r
\r
Use this sequence for every future scanner feature or integration:\r
\r
1. Add or change neutral primitives in the shared modules under \`src/\`; do not add host policy there.\r
2. Implement the behavior in the initial imperative controller and its owned markup.\r
3. Implement the same behavior in the Svelte runtime and Svelte-owned component markup.\r
4. Keep reusable example dialogs, statuses, and actions in \`examples/scanner-examples.ts\`, with callbacks inert until a host supplies behavior.\r
5. Prove the capability in both \`/skeleton/\` and \`/svelte/skeleton/\` with real camera and result delivery, keeping application hooks null/no-op.\r
6. Expose and inspect the capability through both \`/emulator/\` and \`/svelte/emulator/\`.\r
7. Run the initial tests, Svelte tests, Svelte accessibility/type checks, production build, and browser parity states before considering the change complete.\r
8. Only after both implementations agree should a future host attach QRQT, Z1Q, database, routing, assignment, or network behavior outside this repository.\r
9. Update this guide in the same change whenever an API, example, asset, control mapping, test route, or integration instruction changes.\r
\r
An implementation is incomplete if it exists only in one framework, one emulator, one skeleton, or a host application. The development loop is **shared neutral primitives -> initial surface -> Svelte surface -> both skeletons -> both emulators -> host integration**.\r
\r
## Scope and ownership\r
\r
QR Scan Core owns:\r
\r
- camera stream acquisition, selection, switching, and teardown;\r
- QR-only frame decoding and ROI preprocessing;\r
- camera-frame scheduling and hard/rotated decode fallbacks;\r
- scan-region geometry and video-coordinate conversion;\r
- feed pointer, touch, pinch, wheel, keyboard, and radial-dial controls;\r
- best-effort focus, exposure, torch, hardware zoom, and software zoom;\r
- top-row controls, status primitives, inline dialogs, targeting state, and result display;\r
- the source camera picker, torch, QR-code pill, close control, held scan region, focus pulse, glass radial dial, jump/accept/cancel controls, inline confirmation prompt, and stale-warning surface;\r
- dialog-to-control tethering and the two-press animated trash confirmation state machine; the host still owns every operation those controls request;\r
- result callbacks, events, Promise waiters, handler values, and in-memory history.\r
\r
The host owns:\r
\r
- where and when the scanner is mounted or opened;\r
- routes, modal shells, stacking order, mount dimensions, and surrounding layout;\r
- authentication, network requests, database reads and writes, navigation, and storage;\r
- interpretation, validation, lookup, assignment, replacement, and conflict policy;\r
- application-specific status and dialog copy;\r
- persistence or serialization of results and all storage other than the scanner's local handedness preference.\r
\r
The core never calls the network and never parses payloads as inventory identifiers.\r
\r
## Install\r
\r
From a source checkout:\r
\r
\`\`\`sh\r
npm install\r
npm run build\r
\`\`\`\r
\r
The library build emits:
\r
\`\`\`text\r
dist/qr-scan-core.js\r
dist/qr-scan-core.css\r
dist/index.d.ts
\`\`\`

Vite snapshots repository identity at dev-server startup and production build time. The snapshot records the configured upstream tracking branch and its locally fetched commit (the last pull/fetch visible to Git), plus the current local branch and \`HEAD\`; it never makes a browser-side Gitea request or exposes credentials. Source archives without Git metadata build successfully with \`unknown\` placeholders.
\r
The initial pages are emitted at \`dist/harness/emulator/index.html\` and \`dist/harness/skeleton/index.html\`. The Svelte pages are emitted at \`dist/harness/svelte/emulator/index.html\` and \`dist/harness/svelte/skeleton/index.html\`. A compatibility copy of the initial emulator remains at \`dist/harness/index.html\`. Every URL is relative so the complete directory can be hosted at a project subpath.\r
\r
## Static ESM use\r
\r
\`\`\`html\r
<link rel="stylesheet" href="./vendor/qr-scan-core.css">\r
<div id="scanner-slot"></div>\r
<script type="module">\r
  import { createQrScanner } from "./vendor/qr-scan-core.js";\r
\r
  const scanner = createQrScanner();\r
  scanner.mount(document.querySelector("#scanner-slot")).open();\r
<\/script>\r
\`\`\`\r
\r
The mount node must have a usable width and height. The host determines whether that node is full viewport, a bounded container, or part of a dialog.\r
\r
## Bare-bones functional skeleton\r
\r
Run \`npm run dev\` and open \`/skeleton/\` to use the scanner without the emulator wall. This interface mounts the accepted scanner full-viewport, requests the environment-facing camera, decodes physical QR codes through the real ROI/ZXing path, displays the payload, and emits the same result events as the library. The top camera control retries permission or camera acquisition when no stream is active.\r
\r
The page intentionally exposes its neutral extension surface as \`window.qrScanSkeleton\` for local development:\r
\r
\`\`\`ts\r
window.qrScanSkeleton.scanner.addEventListener("scanresult", onScan);\r
window.qrScanSkeleton.runExample("assign");\r
await window.qrScanSkeleton.showDialog("destructive");\r
\`\`\`\r
\r
These calls drive scanner UI only. They do not assign, overwrite, delete, notify, navigate, persist, or call a network. A future integration should import \`mountSkeleton()\` from \`skeleton/app.ts\` and pass optional \`onScan\`, \`onAction\`, and \`onDialogAction\` hooks instead of editing scanner internals.\r
\r
For linkable visual states without adding an emulator pane, use \`?example=<name>\` or \`?dialog=<name>\`. For example, \`/skeleton/?example=assign\` shows the assignment prompt and \`/skeleton/?dialog=destructive\` shows the two-press delete dialogue. The definitions come from \`examples/scanner-examples.ts\`, the same catalog used by the emulator.\r
\r
## Lifecycle\r
\r
\`\`\`ts\r
const scanner = createQrScanner({\r
  handedness: "right",\r
  camera: {\r
    autoStart: true,\r
    facingMode: "environment",\r
    allowSwitching: true,\r
  },\r
});\r
\r
scanner.mount(hostElement); // appends one scanner subtree\r
scanner.open();             // visible and camera-enabled\r
await scanner.startCamera();// explicitly start/retry the default camera\r
scanner.stopCamera();       // stop tracks while keeping the scanner open\r
scanner.pause();            // keeps stream ownership; stops scan work\r
scanner.resume();\r
scanner.setHandedness("left"); // mirrors dial/action placement without mirroring labels or icons\r
scanner.close();            // stops tracks; instance can reopen\r
scanner.reparent(otherHost);// moves the same instance\r
scanner.destroy();          // final cleanup; do not reuse\r
\`\`\`\r
\r
Lifecycle calls are idempotent. \`close()\` stops decoding, animation/video-frame callbacks, and media tracks. \`destroy()\` additionally removes DOM and listeners, disconnects resize observation, destroys the decoder, and rejects pending \`nextResult()\` Promises with \`LifecycleError\` code \`scanner_destroyed\`.\r
\r
Handedness is the scanner's one persistent UI preference. A pivot toggle or \`setHandedness()\` call writes \`left\` or \`right\` to the \`qr-scan-core:handedness\` browser-storage key. A newly constructed scanner restores that saved value, so the choice survives page refreshes and scanner destruction/recreation; closing and reopening the same instance also preserves its current state. An explicit \`handedness\` constructor option remains authoritative for that instance. Storage access is best-effort and never prevents scanning when browser storage is blocked or unavailable.\r
\r
### Route teardown\r
\r
\`\`\`ts\r
const scanner = createQrScanner().mount(routeOutlet).open();\r
\r
router.onBeforeLeave(() => {\r
  scanner.destroy();\r
});\r
\`\`\`\r
\r
Use \`close()\` when the same scanner instance will reopen. Use \`destroy()\` when the owning route or feature is permanently unmounted.\r
\r
\`startCamera(deviceId?)\` and \`stopCamera()\` provide feed-only control for embedded previews and development simulators. \`startCamera()\` requests the configured environment-facing camera when no device ID is supplied. \`stopCamera()\` releases every media track, clears the video element, and leaves the scanner UI and synthetic result path available. Use \`open()\` and \`close()\` when visibility and camera ownership should change together.\r
\r
## How scanning behaves\r
\r
This is intentionally not an always-decoding scanner.\r
\r
- A feed press positions the movable scan region and requests focus/exposure. Its one-shot focus glow expands from the complete scan-region edge, so pinched or otherwise resized regions emit a proportionally sized pulse instead of a second fixed-size box at their center.
- Holding or dragging owns a scan session and decodes inside the live ROI.\r
- Dragging moves the ROI.\r
- Two registered pointers latch opposing corners, resize the square ROI, and recenter it.\r
- When a pinch becomes one pointer, the remaining pointer continues dragging with a stored offset; the ROI does not jump.\r
- Releasing the final registered pointer commits the most recent live decoded payload.\r
- Pointer cancellation stops without committing.\r
- Pressing or dragging anywhere in the radial dial quadrant changes zoom. When no feed-owned scan is active, the dial hold also owns one passive scan session using the default-size ROI latched to the stage center; releasing the dial commits that session without changing the saved movable ROI. If a movable feed scan already owns the ROI—or begins while the dial is held—it takes precedence, stays at its feed-selected location, and remains active until the final feed/dial pointer is released. The protected dial input region is the full quarter-circle area bounded by the arc's outer edge and the adjacent bottom and vertical viewport edges, not only the visible glass band.
- A feed-owned scan gesture may continue across the protected dial quadrant and move the already-active ROI there; entering the region never cancels or steals that existing gesture.\r
- Tapping the dial pivot toggles right- and left-handed modes. Left-handed mode mirrors the dial geometry and moves dial-adjacent jump, confirm, cancel, and delete controls to the left edge, while counter-mirroring the \`1x\`/maximum-zoom labels so all text and icons remain readable. The selection is saved locally and restored by replacement scanner instances and page refreshes. Hosts may set an explicit mode for an instance with \`handedness\` or change it through \`setHandedness()\`; otherwise a saved preference is used before the \`right\` fallback.\r
- Wheel and \`+\`/\`-\` adjust zoom; arrow keys move the ROI; Enter performs a keyboard scan commit.
- Four simultaneous touch pointers on unobstructed camera-feed space reveal the embedded build identity in the shared status/result pill. On pointer/web input, Ctrl+click on unobstructed feed space reveals the same text. Initial routes begin with \`seek-qr\`; Svelte routes begin with \`seek-qr-svelte\`. Both diagnostics put \`local:\` on a second line and calculate its leading spaces so its colon aligns with the upstream branch label's colon. Each commit is truncated to six characters. Scanner controls, prompts, and the radial dial do not trigger the diagnostic. A short touch-recognition window prevents the four-finger tap from starting a scan or moving the saved ROI.
- There is no left-edge vertical zoom slider.
\r
The frame loop targets approximately 30 decode attempts per second. Every third attempt enables ZXing \`TRY_HARDER\` and the inverted retry. After repeated misses, the scanner periodically tries one rotated hard decode. The working ROI is capped at 384 pixels on its longest edge for ordinary attempts.\r
\r
## Results\r
\r
### Callback\r
\r
\`\`\`ts\r
const scanner = createQrScanner({\r
  onResult(result) {\r
    console.log(result.payload, result.value, result.context);\r
  },\r
});\r
\`\`\`\r
\r
### Event\r
\r
\`\`\`ts\r
scanner.addEventListener("scanresult", (event) => {\r
  const result = (event as CustomEvent).detail;\r
  console.log(result);\r
});\r
\`\`\`\r
\r
### Await the next scan\r
\r
\`\`\`ts\r
const next = await scanner.nextResult();\r
\`\`\`\r
\r
Every waiter pending at emission time resolves with the same result record.\r
\r
### Last result and history\r
\r
\`\`\`ts\r
scanner.getLastResult(); // ScanResult | null\r
scanner.getHistory();    // readonly ScanResult[]\r
\`\`\`\r
\r
The latest result remains available even when \`historyLimit\` is \`0\`. History defaults to 20 records and remains in memory only.\r
\r
### Result record\r
\r
\`\`\`ts\r
interface ScanResult<TValue> {\r
  id: string;\r
  payload: string;           // decoder output, unchanged\r
  normalizedPayload: string; // injected normalizer output\r
  value: TValue;             // resolved handler return value\r
  context: Readonly<ScanContext>;\r
  timestamp: number;\r
}\r
\`\`\`\r
\r
Camera and synthetic scans use the same pipeline. Synthetic scans are useful for tests and offline integration work:\r
\r
\`\`\`ts\r
await scanner.emitSynthetic("example payload", { fixture: "empty-network" });\r
\`\`\`\r
\r
## Normalizers and handler values\r
\r
Both defaults are identity operations. No trimming, uppercasing, URL extraction, address parsing, or code validation occurs unless the host injects it.\r
\r
\`\`\`ts\r
const scanner = createQrScanner({\r
  normalizePayload: (raw) => raw.normalize("NFC"),\r
  handler: async (normalized, context) => {\r
    return hostApi.validate(normalized, context);\r
  },\r
});\r
\`\`\`\r
\r
The handler may return any JavaScript value: the original payload, transformed text, an object, a function, or a Promise. Promises are awaited and the resolved value is stored as \`result.value\`. Values remain live in memory and are not serialized by the core.\r
\r
If the host treats the handler as validation, return a validation result and separately drive status or dialog UI. Do not import host validation into this package.\r
\r
## Status, targeting, input, and dialogs\r
\r
\`\`\`ts\r
scanner.setStatus({ tone: "pending", text: "Checking with host…" });\r
scanner.setStatus({ tone: "success", text: "Host accepted result" });\r
scanner.setStatus(null);\r
\r
scanner.setTargeting(true);\r
scanner.setInputLocked(true);\r
scanner.pause();\r
\`\`\`\r
\r
Status tones are \`neutral\`, \`pending\`, \`found\`, \`unmatched\`, \`success\`, \`warning\`, and \`error\`. They are visual semantics only.\r
\r
### Presentation-aware action contract\r
\r
The public action and dialog signatures are:\r
\r
\`\`\`ts\r
setActionControls(\r
  controls: ScannerActionControls,\r
  presentation?: ScannerPresentationOptions,\r
): this;\r
\r
showDialog(\r
  dialog: ScannerDialog,\r
  presentation?: ScannerPresentationOptions,\r
): Promise<string>;\r
\r
interface ScannerPresentationOptions {\r
  interaction?: "unlocked" | "locked-glass";\r
  mirrorActionsInPrompt?: boolean;\r
  dismissAfterAction?: boolean;\r
}\r
\`\`\`\r
\r
\`interaction\` is a reusable presentation choice, not host policy. \`"unlocked"\` is the default: the live feed and zoom dial remain usable behind the prompt. \`"locked-glass"\` temporarily locks scan and zoom input and shows the interaction layer over the feed and dial while prompt actions are available. That layer reuses the radial band's dark glass background and backdrop filter at \`0.5\` opacity, approximately half the liquid-glass fill strength of the dialogue surface. Prompt and radial actions remain above it and usable. This option may be applied to any future status or dialog, but the shared example catalog currently uses it only for accepted reference UI states; ordinary dialogs remain unlocked and glass-free by default.
\r
Host and presentation locks are independent. \`setInputLocked(true)\` is host-owned and remains in force until the host calls \`setInputLocked(false)\`. A \`"locked-glass"\` presentation contributes a temporary lock only while that presentation is active. The effective \`state.inputLocked\` value is true when either lock is active; dismissing an accepted presentation releases its presentation lock but never clears a host lock. A host lock alone does not imply that the interaction-glass layer is visible.\r
\r
Use the accepted assignment presentation without giving the core assignment policy:\r
\r
\`\`\`ts\r
scanner.setActionControls({\r
  cancel: { id: "cancel", label: "Cancel assignment", promptLabel: "Cancel" },\r
  accept: { id: "confirm", label: "Confirm assignment", promptLabel: "Confirm", tone: "primary" },\r
}, {\r
  interaction: "locked-glass",\r
  mirrorActionsInPrompt: true,\r
  dismissAfterAction: true,\r
});\r
\`\`\`\r
\r
\`mirrorActionsInPrompt: true\` renders popup text controls from the same action records as the radial controls. The popup and radial copies retain one \`id\`, action \`kind\`, disabled state, and activation path; they are two presentations of one operation, not duplicate actions. For non-dialog action controls with \`dismissAfterAction: true\`, activation dispatches the \`action\` event first. Only after synchronous action listeners run does the controller clear the status and controls, release the presentation lock, hide the glass, and stop targeting. This action-before-dismiss order lets a host read the active state during its listener without risking a second activation.\r
\r
Use the source confirmation layout without giving the core any assignment policy:\r
\r
\`\`\`ts\r
scanner.setStatus({\r
  tone: "warning",\r
  layout: "confirmation",\r
  text: "Overwrite the current host value?",\r
  detail: "Use the checkmark to confirm or × to cancel.",\r
  note: "Optional host-owned conflict detail.",\r
});\r
\r
scanner.setCodePresentation({ code: "204811", state: "known" });\r
scanner.setCodePresentation({ code: null, state: "preview" });\r
\r
scanner.setActionControls({\r
  jump: { id: "jump", label: "Open the matched host record", promptLabel: "Jump" },\r
  accept: { id: "accept", label: "Confirm host action", promptLabel: "Confirm", tone: "primary" },\r
  cancel: { id: "cancel", label: "Cancel host action", promptLabel: "Cancel" },\r
});\r
\r
scanner.addEventListener("action", (event) => {\r
  const { id, kind } = (event as CustomEvent).detail;\r
  hostActions.run(id, kind);\r
});\r
\`\`\`\r
\r
\`setCodePresentation()\` exposes the accepted \`idle\`, \`preview\`, \`known\`, and \`unknown\` visual states for host-driven lookup flows. A non-empty \`known\` or \`unknown\` value makes the complete top QR pill a copy control: pointer activation anywhere inside the pill, plus Enter or Space, writes the exact displayed payload through the Clipboard API. Idle placeholders and live, uncommitted \`preview\` values stay disabled. Successful copies briefly pulse the existing success accent and expose an accessible confirmation without replacing the visible code; a missing or rejected Clipboard API leaves scanner, status, result, and dialog state unchanged. Production hosts therefore need a secure context, as they do for camera access.\r
\r
\`setActionControls()\` configures visibility, accessible labels, optional shorter \`promptLabel\` copy, semantic tone, disabled state, presentation policy, and emitted action identifiers. It never navigates, assigns, rewrites, overwrites, or mutates host data.\r
\r
\`\`\`ts\r
const action = await scanner.showDialog({\r
  title: "Replace existing value?",\r
  body: "This copy and policy came from the host.",\r
  actions: [\r
    { id: "cancel", label: "Cancel" },\r
    { id: "replace", label: "Replace", tone: "primary" },\r
  ],\r
});\r
\r
if (action === "replace") await hostApi.replace();\r
\`\`\`\r
\r
Dialogs never open a full-screen modal or opaque overlay. Their title, body, and text actions occupy the live glass prompt directly beneath the top scanner controls, leaving the camera, dial, and tethered action controls visible. A dialog uses the exact same single liquid-glass prompt surface as a one-line notification and simply grows vertically to fit its content; its inner layout wrapper stays transparent, so it never adds a second opaque panel, rim, shadow, or blur. \`showDialog(dialog)\` defaults to \`interaction: "unlocked"\` and mirrored prompt actions, so scanning and zoom remain available outside the dialog and its interactive controls. Pass \`interaction: "locked-glass"\` explicitly only when the state must suspend feed and dial input.\r
\r
Popup status and dialog copy use the shared QRQT-conflict-note typography: the same monospaced family, weight, spacing, case, and shadow across all tones while each state keeps its current text color. Conflict guidance such as \`QRQT conflict. Confirm again to replace it.\` belongs in the secondary/detail slot at the smaller reference size; no separate red instruction line is added. Popup action labels retain their established stronger weight and semantic colors rather than inheriting body-copy styling. The shared prompt block padding is also the action row's top gap, keeping the copy-to-actions and actions-to-bottom-edge spacing symmetric.\r
\r
When the camera picker is open at the same time as a dialog, status, or scan-result prompt, its options remain horizontally anchored beneath the camera button but are vertically placed one shared prompt gap below the visible prompt's measured bottom edge. Prompt height is authoritative: wrapped copy and destructive-confirmation text can grow without overlapping the camera options. When no prompt is visible, the options return to the normal one-gap position beneath the top-row camera button.\r
\r
- With two actions, the cancel/back/ignore-style action is white and the confirm/continue/acknowledge/overwrite/reassign-style action uses its semantic color. Semantic tone and familiar action labels win over input order, so reversed host arrays are still grouped sensibly.\r
- In right-handed mode, neutral/white popup actions precede colored actions in both DOM and visual order; the neutral radial control occupies the cancel/jump slot and the colored control occupies the accept slot. Left-handed mode reverses both popup order and radial geometry: colored actions move to the left and neutral/white actions move to the right. This ordering derives from the same persisted handedness value and updates immediately when handedness changes.\r
- Jump is a neutral action and uses the exact cancel-control diameter and slot in either handedness. It replaces, rather than creates a second position beside, cancel and uses the shipped jump-arrow asset.\r
- Clicking a text action in the prompt and clicking its tethered circle are the same operation.\r
- While a dialog is active, the top toolbar **X** also invokes the left/cancel action instead of closing the scanner.\r
- A single neutral dismiss/close/cancel-style action is treated as white cancellation and uses only the **X**. A single \`primary\`, \`danger\`, Continue, Acknowledge, Confirm, Overwrite, or Reassign-style action is treated as green confirmation and uses only the checkmark.\r
- Keep dialogs to one or two actions so every visible action has a physical control tether.\r
\r
Use the explicit \`delete\` tone only for irreversible deletion:\r
\r
\`\`\`ts\r
const action = await scanner.showDialog({\r
  title: "Delete this record?",\r
  body: "This cannot be undone.",\r
  actions: [\r
    { id: "cancel", label: "Cancel" },\r
    { id: "delete", label: "Delete", tone: "delete" },\r
  ],\r
});\r
\r
if (action === "delete") await hostApi.deleteRecord();\r
\`\`\`\r
\r
### Stage-relative radial cluster\r
\r
Radial geometry is resolved from the rendered camera stage's shorter edge, not the browser viewport. Confirm is tethered beside the maximum-zoom label; Cancel is diagonally down-left in right-handed mode and down-right in left-handed mode; Jump occupies Cancel's exact slot. The same computed values size the visible controls and their hit regions.\r
\r
### QR pill assets\r
\r
Every QR-pill state uses \`src/assets/qr.svg\`, including the base icon and the glow layer. The asset contains only the seven regular QR module paths, and \`src/assets/copyqr.svg\` is intentionally absent. Committed copyable \`known\` and \`unknown\` states retain the subtle inherited-color 4.5-second full-icon glow without switching to link/copy artwork. The full pill copies the payload, and provisional values remain non-copyable.
\r
### Destructive confirmation\r
\r
Popup and radial Delete controls share \`idle -> armed -> confirming\`. The first activation from either surface opens and holds the lid and changes the action to \`Confirm Delete\`; the second activation from either surface plays the final animation and resolves once. Cancel, dismissal, close, detach, supersession, and destroy reset the closed idle state.\r
\r
The scanner resolves an action identifier and emits \`dialogaction\`. It performs no associated operation, including deletion. Dialog popup and radial buttons route through the same dialog activation record and resolve the same Promise exactly once.\r
\r
## Camera permissions and secure contexts\r
\r
Real camera acquisition requires HTTPS or a browser-recognized localhost origin. An insecure remote HTTP page can run the synthetic harness but cannot obtain \`getUserMedia\`.\r
\r
Ask for camera permission from a visible user-initiated flow when possible. Permission may be denied permanently, blocked by iframe policy, unavailable because another app owns the camera, or interrupted after acquisition. Listen for \`cameraerror\` and show host-appropriate recovery copy.\r
\r
\`\`\`ts\r
scanner.addEventListener("cameraerror", (event) => {\r
  console.error((event as CustomEvent).detail.message);\r
});\r
\`\`\`\r
\r
Camera labels may be empty until permission is granted. \`enumerateCameras()\` therefore returns raw browser devices without inventing stable identity.\r
\r
For an interactive integration, provide a visible Start/Retry control even when \`camera.autoStart\` is enabled. It gives users a recovery path after a denied, dismissed, interrupted, or browser-blocked permission request:\r
\r
\`\`\`ts\r
startButton.addEventListener("click", async () => {\r
  await scanner.startCamera(selectedDeviceId || undefined);\r
});\r
\r
stopButton.addEventListener("click", () => {\r
  scanner.stopCamera();\r
});\r
\`\`\`\r
\r
The scanner's \`<video>\` is the real preview surface. Once a stream is active, press and hold over a visible QR code to position the ROI and decode live frames; release to commit the most recently decoded payload through the normal result pipeline.\r
\r
## iOS Safari\r
\r
- Use HTTPS and a direct user gesture for the first camera open.\r
- Keep the \`<video>\` inline; the module sets \`playsinline\` and \`muted\`.\r
- Expect torch and hardware zoom capabilities to be absent even when the physical device supports them.\r
- Safari may provide one logical rear camera rather than separate lens device IDs.\r
- Viewport size changes as browser chrome expands or collapses. Give the host container a modern \`dvh\`/\`svh\` strategy.\r
- Do not depend on user-agent model detection for camera behavior.\r
\r
The scanner uses runtime capabilities as truth and falls back to software zoom. Missing torch, focus, exposure, or multi-camera control degrades independently and never disables raw QR decoding.\r
\r
## Zoom and camera switching\r
\r
The radial dial exposes a logical zoom range. Runtime camera profiles become contiguous segments:\r
\r
- a hardware segment applies \`MediaTrackConstraints.zoom\`;\r
- a software segment scales the preview and adjusts ROI-to-video mapping;\r
- crossing into a segment backed by another device opens that camera and resumes the owned scan session.\r
\r
The module does not infer an ultrawide or telephoto camera solely from a label. Runtime capabilities drive the model. \`allowSwitching: false\` confines the range to one active camera.\r
\r
## Layout, touch, and orientation\r
\r
The host owns mount geometry. The scanner fills its host.\r
\r
\`\`\`css\r
.scanner-route {\r
  position: fixed;\r
  inset: 0;\r
  min-height: 100dvh;\r
}\r
\r
.scanner-card {\r
  width: min(100%, 42rem);\r
  height: min(80dvh, 56rem);\r
}\r
\`\`\`\r
\r
The module uses safe-area insets, \`touch-action: none\` only on scanner-owned gesture surfaces, 44-pixel minimum targets, and scoped scroll prevention. Scanner-owned surfaces suppress text selection, WebKit touch callouts, and tap-highlight rectangles so a mobile press-and-hold never displays copy-selection chrome; standalone skeleton and emulator shells apply the same rule to their complete page. It observes host resizing and preserves the instance through orientation changes and reparenting. The host must assign an intentional stacking context if scanner and application dialogs overlap.\r
\r
On coarse-pointer hardware—or in any viewport no wider than 480 CSS pixels—the top controls, code pill, dialog copy, action controls, and radial dial use a larger touch scale. The capability branch is intentional: foldables such as the Galaxy Z Fold can report a tablet-sized or desktop-style CSS viewport even while the interface is operated at phone distance, so a width-only phone breakpoint can make fixed controls physically tiny. Do not replace this rule with user-agent detection or restrict it to only a narrow-width media query. Ordinary mouse and trackpad layouts retain the compact reference scale; narrow windows receive the accessible scale, and very narrow touch viewports receive a fit-preserving override so the complete top row remains visible.\r
\r
Primary coarse-pointer breakpoints match the source application:\r
\r
- phone: \`pointer: coarse\` and \`max-width: 767px\`;\r
- tablet: \`pointer: coarse\` and \`768px–1199px\`;\r
- desktop: fallback and debugging compatibility.\r
\r
Reduced-motion preferences shorten decorative animation without disabling controls.\r
\r
## Svelte functional skeleton and component use\r
\r
Run \`npm run dev\` and open \`/svelte/skeleton/\` for the Svelte-owned scanner surface. It exposes \`window.qrScanSvelteSkeleton\` with the same neutral development operations as the initial skeleton: scanner access, inert examples, and inert dialogs. Query-string visual states use the same \`?example=<name>\` and \`?dialog=<name>\` catalog.\r
\r
Use \`svelte/src/QrScanner.svelte\` when a Svelte host owns rendering. Supply a runtime when the host needs controller access, or let the component create and destroy its own runtime:\r
\r
\`\`\`svelte\r
<script lang="ts">\r
  import QrScanner from "./svelte/src/QrScanner.svelte";\r
  import { createSvelteScannerRuntime } from "./svelte/src/runtime/scanner-runtime";\r
\r
  const scanner = createSvelteScannerRuntime({\r
    onResult(result) {\r
      console.log(result.payload);\r
    },\r
  });\r
<\/script>\r
\r
<QrScanner runtime={scanner} />\r
\`\`\`\r
\r
An externally supplied runtime remains host-owned and is detached, not destroyed, when the component unmounts. An internally created runtime is destroyed on unmount, including media tracks, frame callbacks, pending result waiters, and the decoder. Handedness uses the same \`qr-scan-core:handedness\` key in both implementations, so the preference survives switching pages and scanner recreation. Blocked storage access is best-effort and never blocks scanning.\r
\r
## Theming\r
\r
Set variables on the scanner host or \`.qrs-root\`:\r
\r
\`\`\`css\r
.my-scanner {\r
  --qrs-bg: #04020c;\r
  --qrs-accent: #c6a8ff;\r
  --qrs-success: #7fe3d4;\r
  --qrs-zone-size: 4.95rem;\r
}\r
\`\`\`\r
\r
The stylesheet preserves the accepted \`.qr-scanner\` and \`.qr-scanner__*\` class anatomy and also keeps \`qrs-\` hooks where either implementation needs stable references. The source camera, lightbulb, and jump SVG assets are shipped in \`src/assets\`. Do not replace the accepted chrome with a newly designed shell. If the scanner UI changes, port the changed markup, assets, accessible names, states, SVG identifiers, and relevant style rules to both renderers; update both harness state galleries and this guide in the same change.\r
\r
The stylesheet is scoped beneath \`.qrs-root\`/\`.qr-scanner\` and does not target the host's \`body\` or unrelated controls. The harness's violet terminal-wall styling is separate and can be deleted without affecting the scanner.\r
\r
## Events\r
\r
The controller is an \`EventTarget\` and emits:\r
\r
| Event | Detail |\r
| --- | --- |\r
| \`statechange\` | complete public state snapshot |\r
| \`scanstart\` | none |\r
| \`scanpreview\` | latest live payload found during an owned gesture |\r
| \`scanend\` | \`{ committed, payload }\` |\r
| \`scanresult\` | final \`ScanResult\` |\r
| \`roichange\` | normalized scanner ROI in stage pixels |\r
| \`dialogaction\` | \`{ actionId }\` |\r
| \`action\` | \`{ id, kind }\` from a configured jump, accept, or cancel control |\r
| \`cameraerror\` | \`{ error, message }\` |\r
| \`close\` | none; emitted by the top close control |\r
\r
## Replacing the decoder\r
\r
Inject an object implementing \`QrDecoder\`:\r
\r
\`\`\`ts\r
const scanner = createQrScanner({\r
  decoder: {\r
    async decode({ video, roi, tryHarder, rotation }) {\r
      return myDecoder.read(video, roi, { tryHarder, rotation });\r
    },\r
    destroy() {\r
      myDecoder.release();\r
    },\r
  },\r
});\r
\`\`\`\r
\r
The decoder receives source-video pixel coordinates after object-fit, software-zoom, ROI padding, resize, and orientation transforms have been applied.\r
\r
## React adapter\r
\r
React is not a runtime dependency. A small integration example lives in \`examples/react/QrScannerView.tsx\`:\r
\r
\`\`\`tsx\r
function QrScannerView({ open, onScan }) {\r
  const host = useRef<HTMLDivElement>(null);\r
\r
  useEffect(() => {\r
    if (!host.current) return;\r
    const scanner = createQrScanner({ onResult: onScan }).mount(host.current);\r
    if (open) scanner.open();\r
    return () => scanner.destroy();\r
  }, []);\r
\r
  return <div ref={host} className="scanner-route" />;\r
}\r
\`\`\`\r
\r
In a real adapter, keep the scanner in a ref and use a second effect to call \`open()\` or \`close()\` when the prop changes.\r
\r
## Debugging harness\r
\r
\`\`\`sh\r
npm run dev\r
\`\`\`\r
\r
The Vite server exposes all development surfaces at the same origin:\r
\r
- \`/skeleton/\` — bare-bones functional scanner;\r
- \`/emulator/\` — integration emulator and controls wall;\r
- \`/svelte/skeleton/\` — Svelte functional scanner;\r
- \`/svelte/emulator/\` — Svelte integration emulator and controls wall;\r
- \`/\` — compatibility entry for the emulator.\r
\r
The harness defaults to a 440 × 956 logical phone preview. Its **Accepted reference UI states** group previews every source state: idle camera, held/live scanning, known and unknown QR results, jump and accept affordances, assign/rewrite/overwrite confirmations, QRQT conflict presentation, stale/retired/permanently-tombstoned warnings, and camera errors. These are inert UI skeletons backed by \`setCodePresentation()\`, \`setActionControls()\`, \`setStatus()\`, and \`showDialog()\`; they do not carry database behavior into the core.\r
\r
Accepted reference states that present popup/radial decisions use \`interaction: "locked-glass"\`, mirrored prompt actions, and dismissal through the shared action identity. Assign, rewrite, replace, conflict, stale, retired, and blocked examples therefore suspend scanning and zoom until a popup or radial action resolves them. Ordinary entries from the **Dialogs** group use the unlocked default: no interaction glass, with feed scanning and dial zoom still available outside interactive dialog controls. These defaults and their exact action labels, ordering, lock behavior, styling, and dismissal path must remain identical in the initial skeleton, initial emulator, Svelte skeleton, and Svelte emulator. A change verified in only one route is incomplete.\r
\r
The harness requests the real environment-facing camera on startup and renders that stream directly inside the preview device. Its **Start / retry camera** and **Stop camera** controls manage the feed without destroying or hiding the scanner. Hold over a QR code in the device preview to decode live frames and release to commit the result. The harness also exercises the synthetic result path, handler values, result history, lifecycle, device/orientation sizing, safe areas, targeting, camera failure states, ROI changes, event logs, and theme variables when a camera is unavailable.\r
\r
The fixed controls panel never changes position when ordinary preview modes change. Phone and tablet modes resize the existing host and scanner. The preview header's **Match current device fullscreen** button temporarily hides the device chrome and control wall, expands the same live scanner instance to the current viewport, and preserves its selected scenario and runtime state. Its return tooltip is \`Double tap (or click, depending on what mode) to return to control wall.\` Mouse/keyboard users return with one activation; touch users double-tap while fullscreen. The scanner instance is recreated only by the explicit **Destroy + recreate** command.
\r
The **Save Guide** control uses an inline SVG so the canonical Markdown download remains visually complete when the emulator is built or hosted at a nested project path.

## Build identity release contract

Build identity is a compile-time static diagnostic. \`scripts/git-build-info.ts\` reads the checked-out branch's configured upstream tracking ref with \`@{upstream}\` and reads the local branch and \`HEAD\` separately. Both Vite configurations embed that snapshot into their generated JavaScript. The deployed scanner performs no runtime forge request, needs no Gitea or GitHub credentials, and uses \`unknown\` when Git metadata is unavailable.

The product label belongs to the rendering implementation rather than the Git snapshot. Initial scanner and emulator routes pass \`seek-qr\`; Svelte scanner and emulator routes pass \`seek-qr-svelte\`. With an upstream \`main\` commit of \`8d3d63…\` and local \`main\` commit of \`6cd63c…\`, the visible monospaced output is:

\`\`\`text
seek-qr - main: (8d3d63)
         local: main (6cd63c)
\`\`\`

\`\`\`text
seek-qr-svelte - main: (8d3d63)
                local: main (6cd63c)
\`\`\`

The formatter derives the indentation from the product and upstream branch labels; do not hardcode a fixed number of spaces for every branch name.

An agent performing a source push must follow this sequence:

1. Read root \`AGENTS.md\`, this contract, and the deployment section below.
2. Identify the checked-out local branch and its configured upstream. Pull or fetch as required by the requested workflow and resolve \`@{upstream}\`; never invent a missing branch or hash.
3. Run the required tests, commit the intended source changes, and push that commit.
4. After the push succeeds, run a fresh production build. This ensures the generated static output embeds the pushed local commit and updated upstream tracking ref.
5. Re-run the build-identification unit, runtime, and browser checks. Verify that initial routes show \`seek-qr\`, Svelte routes show \`seek-qr-svelte\`, commits have six characters, and the newline/aligned colons remain intact.
6. Publish the verified Pages files, run the live verifier, and report the embedded upstream/local branches and hashes with the four preview links.

Do not try to commit an artifact containing the hash of that same final commit: changing the artifact changes the commit hash, making the value self-referential. Commit and push source first, then build the static deployment. For a Pages-only preview without a source push, build from the current local \`HEAD\` and tracking ref, report both values, and explicitly state that the source repository was not pushed.

## Deployment
\r
Build with relative asset URLs:\r
\r
\`\`\`sh\r
npm run build\r
\`\`\`\r
\r
The accepted GitHub Pages deployment maps the built pages as follows:\r
\r
| Implementation | Built page | Published path |\r
| --- | --- | --- |\r
| Initial scanner | \`dist/harness/skeleton/index.html\` | \`/seek-qr/scanner/\` |\r
| Initial emulator | \`dist/harness/emulator/index.html\` | \`/seek-qr/emulator/\` |\r
| Svelte scanner | \`dist/harness/svelte/skeleton/index.html\` | \`/seek-qr-svelte/scanner/\` |\r
| Svelte emulator | \`dist/harness/svelte/emulator/index.html\` | \`/seek-qr-svelte/emulator/\` |\r
\r
Deploy each implementation with its generated shared \`assets/\` directory and preserve the relative module paths. The Svelte HTML moves one directory shallower than its build-tree location, so its generated \`../../assets/\` references must become \`../assets/\` in the Pages copy. Preserve HTTPS for camera access. Do not publish compatibility copies under a previous project namespace; only the accepted paths above should exist.\r
\r
After deployment propagation, run \`npm run verify:live -- <https-origin>\`. The verifier loads all four accepted published paths in headless Chromium, requires the scanner dialog and radial dial to render without console/page errors, checks the mobile selection guard, and requires a protected-dial click to start exactly one centered passive scan in every scanner/emulator. It then opens the locked Assign state through each skeleton's development API or emulator control, requires visible interaction glass, activates the scoped popup Confirm action, and requires the status, glass, and radial actions to dismiss. The same gate requires the deprecated \`/qr-scanner/\`, \`/qr-scanner/skeleton/\`, and \`/qr-scanner/emulator/\` paths to return HTTP 404.
\r
For source consumption, publish or mirror the whole repository. Do not replace an existing website repository's source history merely to deploy the harness; copy the harness build into an isolated subdirectory instead.\r
\r
## Future integration checklist\r
\r
When adding a new host integration:\r
\r
1. Keep host parsing and policy outside \`src/\`.\r
2. Pass payload interpretation through \`normalizePayload\`, \`handler\`, or external listeners.\r
3. Drive code presentation, action controls, statuses, dialogs, targeting, and locks explicitly from the host.\r
4. Destroy the scanner when its owner is removed.\r
5. Exercise the integration with synthetic payloads before requesting camera permission.\r
6. Add its neutral scenario to \`examples/scanner-examples.ts\`, prove it in both skeletons, and expose it through both emulator controls.\r
7. Confirm the skeleton still contains no QRQT, Z1Q, database, network, assignment, routing, or persistence implementation.\r
8. Update this guide in the same change whenever instructions, contracts, compatibility, or future integration guidance changed.\r
9. If the accepted source UI changes, port its complete markup, visible copy structure, icons/assets, states, styling, accessibility semantics, and responsive behavior to both the initial and Svelte implementations; do not substitute a simplified or newly invented scanner shell.\r
10. Run \`npm test\`, \`npm run test:svelte\`, \`npm run check\`, and \`npm run build\`, then compare the same browser states in all affected routes.\r
`,o="Match current device fullscreen",i="Double tap (or click, depending on what mode) to return to control wall.";function l(t=450){let e=Number.NEGATIVE_INFINITY;return{shouldToggle({fullscreen:r,pointerType:a,timestamp:n}){return!r||a!=="touch"||n-e<=t?(e=Number.NEGATIVE_INFINITY,!0):(e=n,!1)}}}export{o as E,i as a,l as c,s as g};
//# sourceMappingURL=emulator-fullscreen-C6ZtLloB.js.map
