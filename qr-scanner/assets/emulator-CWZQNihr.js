import{c as y,a as x,b as S}from"./scanner-examples-BgsFcUKH.js";const T=`# QR Scan Core Implementation Guide\r
\r
> **Documentation maintenance contract — update this guide in the same change.**\r
>\r
> This file is the canonical, editable integration guide for QR Scan Core. Iterate on it whenever a change affects scanner behavior, public APIs, lifecycle or cleanup, result delivery, browser or camera support, gestures, styling variables, build or deployment steps, or instructions for current or possible future integrations. A feature or integration change that makes any instruction incomplete, misleading, or obsolete is not complete until this guide is updated. The debugging harness's **Save Guide** button downloads this exact Markdown file; do not maintain a separate generated guide.\r
\r
This module contains the physical QR scanning feature, its camera and decode implementation, the complete accepted source scanner UI, its radial zoom control, and its gesture controls. It contains no QRQT, Z1Q, inventory, address, BPN, Supabase, assignment, or application-specific logic. By default, a successful scan stores and displays the decoded payload and performs no other action.\r
\r
## Two-interface implementation methodology\r
\r
This repository deliberately ships two separate web interfaces backed by the same scanner core and the same accepted assets. They serve different implementation roles and must not be collapsed into one page:\r
\r
1. **Bare-bones functional skeleton — \`/skeleton/\`.** This is the one-to-one scanner surface without the emulator control wall. It owns a real camera feed, ROI gestures, ZXing QR decoding, the live code pill, statuses, dialogs, and tethered face controls. A successful physical scan displays and delivers the decoded payload exactly as the reusable feature does. It contains no QRQT, Z1Q, database, network, inventory, assignment, navigation, or persistence behavior. Host-looking actions resolve through named no-op hooks so integrators can replace them without reverse-engineering the UI.\r
2. **Integration emulator — \`/emulator/\`.** This is the dedicated controls pane and preview device. It can select every neutral example status, dialog, lifecycle, camera, gesture, result, device, orientation, and theme state. It is an inspection and development tool, not the starting shell for a product integration. The development build also retains \`/\` as a compatibility entry, but published links should use the explicit \`/emulator/\` route.\r
\r
Both pages import the same framework-neutral scanner, source-derived markup, styles, icons, radial dial, camera/decode pipeline, and shared inert example catalog. The emulator may expose more controls, but it must never own a scanner state or example definition that the skeleton cannot import and reference.\r
\r
### Required implementation sequence\r
\r
Use this sequence for every future scanner feature or integration:\r
\r
1. Add or change the neutral capability in \`src/\`; do not add host policy there.\r
2. Keep reusable example dialogs, statuses, and actions in \`examples/scanner-examples.ts\`, with callbacks that are inert until a host supplies behavior.\r
3. Prove the capability in \`/skeleton/\` as a usable scanner with real camera and result delivery, while keeping every application-specific hook null/no-op.\r
4. Expose the same capability in \`/\` with dedicated emulator controls and inspectable state.\r
5. Only after the core, skeleton, and emulator agree should a future host integration attach QRQT, Z1Q, database, routing, assignment, or network behavior outside this repository.\r
6. Update this guide in the same change whenever any step, API, example, asset, control mapping, or integration instruction changes.\r
\r
An implementation is incomplete if it exists only in the emulator, only in the bare-bones skeleton, or only in a host application. The intended development loop is **core -> functional skeleton -> emulator reference -> host integration**.\r
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
- persistence or serialization of results.\r
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
The library build emits:\r
\r
\`\`\`text\r
dist/qr-scan-core.js\r
dist/qr-scan-core.css\r
dist/index.d.ts\r
\`\`\`\r
\r
The deployable emulator is emitted at \`dist/harness/emulator/index.html\`; the bare-bones functional scanner is emitted at \`dist/harness/skeleton/index.html\`. A compatibility copy of the emulator remains at \`dist/harness/index.html\`. Every URL is relative so either interface can be hosted at a project subpath.\r
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
scanner.close();            // stops tracks; instance can reopen\r
scanner.reparent(otherHost);// moves the same instance\r
scanner.destroy();          // final cleanup; do not reuse\r
\`\`\`\r
\r
Lifecycle calls are idempotent. \`close()\` stops decoding, animation/video-frame callbacks, and media tracks. \`destroy()\` additionally removes DOM and listeners, disconnects resize observation, destroys the decoder, and rejects pending \`nextResult()\` Promises with \`LifecycleError\` code \`scanner_destroyed\`.\r
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
- A feed press positions the scan region and requests focus/exposure.\r
- Holding or dragging owns a scan session and decodes inside the live ROI.\r
- Dragging moves the ROI.\r
- Two registered pointers latch opposing corners, resize the square ROI, and recenter it.\r
- When a pinch becomes one pointer, the remaining pointer continues dragging with a stored offset; the ROI does not jump.\r
- Releasing the final registered pointer commits the most recent live decoded payload.\r
- Pointer cancellation stops without committing.\r
- Pressing and dragging the radial dial can own the same scan session while changing zoom.\r
- Wheel and \`+\`/\`-\` adjust zoom; arrow keys move the ROI; Enter performs a keyboard scan commit.\r
- There is no left-edge vertical zoom slider.\r
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
  jump: { id: "jump", label: "Open the matched host record" },\r
  accept: { id: "accept", label: "Confirm host action" },\r
  cancel: { id: "cancel", label: "Cancel host action" },\r
});\r
\r
scanner.addEventListener("action", (event) => {\r
  const { id, kind } = (event as CustomEvent).detail;\r
  hostActions.run(id, kind);\r
});\r
\`\`\`\r
\r
\`setCodePresentation()\` exposes the accepted \`idle\`, \`preview\`, \`known\`, and \`unknown\` visual states for host-driven lookup flows. \`setActionControls()\` only configures visibility, accessibility labels, disabled state, and emitted action identifiers. It never navigates, assigns, rewrites, overwrites, or mutates host data.\r
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
Dialogs never open a full-screen modal or opaque overlay. Their title, body, and text actions occupy the live glass prompt directly beneath the top scanner controls, leaving the camera, dial, and tethered action controls visible. A dialog uses the exact same single liquid-glass prompt surface as a one-line notification and simply grows vertically to fit its content; its inner layout wrapper stays transparent, so it never adds a second opaque panel, rim, shadow, or blur.
\r
- With two actions, the cancel/back/ignore-style action is white and is tethered to the lower-left circular **X**. The confirm/continue/acknowledge/overwrite/reassign-style action is green and is tethered to the upper-right circular **checkmark**. Semantic tone and familiar action labels win over input order, so reversed host arrays are still latched sensibly.\r
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
The delete action replaces the checkmark with the Job Editor trash glyph. It requires two separate presses. Each press runs the complete 900 ms lid/morsel/bin animation; after the first finishes, the prompt explicitly asks for the second press, and the Promise resolves only after the second animation finishes. Cancel remains available between presses. Reduced-motion preferences compress the decorative timing without removing the two confirmation steps.\r
\r
The scanner resolves an action identifier and emits \`dialogaction\`. It performs no associated operation, including deletion.\r
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
The module uses safe-area insets, \`touch-action: none\` only on scanner-owned gesture surfaces, 44-pixel minimum targets, and scoped scroll prevention. It observes host resizing and preserves the instance through orientation changes and reparenting. The host must assign an intentional stacking context if scanner and application dialogs overlap.\r
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
The stylesheet preserves the accepted \`.qr-scanner\` and \`.qr-scanner__*\` class anatomy and also keeps \`qrs-\` hooks where the framework-neutral controller needs stable element references. The source camera, lightbulb, and jump SVG assets are shipped in \`src/assets\`. Do not replace the accepted chrome with a newly designed shell. If the source scanner UI changes, port the changed markup, assets, states, and relevant style rules together, update the harness state gallery, and update this guide in the same change.\r
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
The Vite server exposes both development surfaces at the same origin:\r
\r
- \`/skeleton/\` — bare-bones functional scanner;\r
- \`/emulator/\` — integration emulator and controls wall;\r
- \`/\` — compatibility entry for the emulator.\r
\r
The harness defaults to a 440 × 956 logical phone preview. Its **Accepted reference UI states** group previews every source state: idle camera, held/live scanning, known and unknown QR results, jump and accept affordances, assign/rewrite/overwrite confirmations, QRQT conflict presentation, stale/retired/permanently-tombstoned warnings, and camera errors. These are inert UI skeletons backed by \`setCodePresentation()\`, \`setActionControls()\`, \`setStatus()\`, and \`showDialog()\`; they do not carry database behavior into the core.\r
\r
The harness requests the real environment-facing camera on startup and renders that stream directly inside the preview device. Its **Start / retry camera** and **Stop camera** controls manage the feed without destroying or hiding the scanner. Hold over a QR code in the device preview to decode live frames and release to commit the result. The harness also exercises the synthetic result path, handler values, result history, lifecycle, device/orientation sizing, safe areas, targeting, camera failure states, ROI changes, event logs, and theme variables when a camera is unavailable.\r
\r
The fixed controls panel never changes position when preview mode changes. Phone and tablet modes resize the existing host and scanner. The scanner instance is recreated only by the explicit **Destroy + recreate** command.\r
\r
The **Save Guide** control uses an inline SVG so the canonical Markdown download remains visually complete when the emulator is built or hosted at a nested project path.\r
\r
## Deployment\r
\r
Build with relative asset URLs:\r
\r
\`\`\`sh\r
npm run build\r
\`\`\`\r
\r
Deploy \`dist/harness/\` as a complete directory so the explicit \`emulator/\` and \`skeleton/\` routes stay together. It can live at \`/qr-scanner/\`, \`/database/tools/scanner/\`, or another project subpath. Preserve HTTPS for camera access. Publish and share the explicit \`/emulator/\` and \`/skeleton/\` links; the directory root remains an emulator compatibility entry.\r
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
6. Add its neutral scenario to \`examples/scanner-examples.ts\`, prove it in the bare-bones skeleton, and expose it through the emulator controls.\r
7. Confirm the skeleton still contains no QRQT, Z1Q, database, network, assignment, routing, or persistence implementation.\r
8. Update this guide in the same change whenever instructions, contracts, compatibility, or future integration guidance changed.\r
9. If the accepted source UI changes, port its complete markup, visible copy structure, icons/assets, states, styling, and responsive behavior; do not substitute a simplified or newly invented scanner shell.\r
`,r=e=>{const n=document.querySelector(e);if(!n)throw new Error(`Harness is missing ${e}`);return n},g=r("#lab"),f=r("#scanner-host"),d=r("#event-log"),R=r("#state-output"),I=r("#runtime-badge"),v=r("#payload"),u=r("#handler-mode"),E=r("#handler-output"),C=r("#status-text"),L=r("#dialog-title"),q=r("#dialog-body"),A=r("#dialog-output"),l=r("#camera-list"),i=r("#camera-feed-status");let a,h,m=!1;function p(e){if(typeof e=="function")return`[function ${e.name||"anonymous"}] → ${String(e())}`;if(typeof e=="string")return JSON.stringify(e);try{return JSON.stringify(e)}catch{return String(e)}}function o(e,n){var c;const t=document.createElement("li"),s=new Date().toISOString().slice(11,23);for(t.innerHTML=`<time>${s}</time> <b>${e}</b>${n===void 0?"":` / ${O(p(n))}`}`,d.prepend(t);d.children.length>80;)(c=d.lastElementChild)==null||c.remove()}function O(e){return e.replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}function Q(e){return u.value==="uppercase"?e.toUpperCase():u.value==="function"?()=>`callable:${e}`:u.value==="async"?Promise.resolve({accepted:!0,payload:e,source:"async harness handler"}):e}function w(){const e=S({camera:{autoStart:!0,facingMode:"environment",idealWidth:1920,idealHeight:1080,allowSwitching:!0},historyLimit:25,handler:n=>Q(n)});for(const n of["scanstart","scanend","scanpreview","scanresult","statechange","roichange","dialogaction","cameraerror","action","close"])e.addEventListener(n,t=>{const s="detail"in t?t.detail:void 0;n!=="statechange"&&o(n,s),n==="statechange"&&b(s),n==="roichange"&&(r("#gesture-output").value="pointer/keyboard ROI update"),n==="scanresult"&&(E.value=`handler value / ${p(s.value)}`,r("#last-result").value=p(s.payload)),n==="cameraerror"&&(i.value=`error / ${s.message}`,e.setStatus({tone:"error",text:`Camera unavailable: ${s.message}`}))});return e.mount(f).open(),e}function b(e){I.value=`INSTANCE / ${e.lifecycle.toUpperCase()}${e.inputLocked?" / LOCKED":""}`,R.textContent=JSON.stringify(e,(n,t)=>typeof t=="function"?"[function]":t,2),e.cameraLabel?i.value=`live / ${e.cameraLabel}`:e.cameraError?i.value=`error / ${e.cameraError}`:e.lifecycle!=="open"&&(i.value="stopped / start camera to test live scanning"),r("#roi-output").value=`x ${e.roi.x.toFixed(0)} / y ${e.roi.y.toFixed(0)} / ${e.roi.size.toFixed(0)}px`,r("#camera-output").value=`${e.cameraLabel??"no live camera"} / ${e.zoom.toFixed(2)}× ${e.zoomSource}`}a=w();h=y(a);b(a.getState());o("harness-ready","requesting a live camera; press and hold the preview to decode, then release to commit");document.addEventListener("click",e=>{const n=e.target.closest("button");if(!n)return;const t=n.dataset.command;if(t==="open"&&a.open(),t==="close"&&a.close(),t==="pause"&&a.pause(),t==="resume"&&a.resume(),t==="lock"&&(m=!0,a.setInputLocked(!0)),t==="unlock"&&(m=!1,a.setInputLocked(!1)),t==="dismiss-result"&&a.dismissResult(),t==="target-on"&&a.setTargeting(!0).setStatus({tone:"pending",text:"Targeting mode controlled by host"}),t==="target-off"&&a.setTargeting(!1).setStatus({tone:"neutral",text:"Targeting cancelled by host"}),t==="roi-reset"&&a.resetRoi(),t==="recreate"&&(a.destroy(),a=w(),h=y(a),a.setInputLocked(m),o("instance-recreated")),t==="rapid"){const s=v.value;Promise.all(Array.from({length:5},(c,k)=>a.emitSynthetic(s,{rapidIndex:k})))}});r("#device-controls").addEventListener("click",e=>{const n=e.target.closest("[data-device]");n!=null&&n.dataset.device&&(g.dataset.device=n.dataset.device,document.querySelectorAll("[data-device]").forEach(t=>t.setAttribute("aria-pressed",String(t===n))),requestAnimationFrame(()=>a.resetRoi()),o("preview-device",n.dataset.device))});r("#orientation-controls").addEventListener("click",e=>{const n=e.target.closest("[data-orientation]");n!=null&&n.dataset.orientation&&(g.dataset.orientation=n.dataset.orientation,document.querySelectorAll("[data-orientation]").forEach(t=>t.setAttribute("aria-pressed",String(t===n))),requestAnimationFrame(()=>a.resetRoi()),o("preview-orientation",n.dataset.orientation))});r("#safe-area").addEventListener("change",e=>{g.dataset.safeArea=String(e.target.checked),requestAnimationFrame(()=>a.resetRoi())});r("#emit-scan").addEventListener("click",()=>void a.emitSynthetic(v.value));r("#payload-presets").addEventListener("click",e=>{const n=e.target.closest("[data-payload]");(n==null?void 0:n.dataset.payload)!==void 0&&(v.value=n.dataset.payload)});r("#status-controls").addEventListener("click",e=>{const n=e.target.closest("[data-tone]"),t=n==null?void 0:n.dataset.tone;t&&a.setStatus(t==="clear"?null:{tone:t,text:C.value})});r("#dialog-controls").addEventListener("click",e=>{const n=e.target.closest("[data-dialog]");if(!(n!=null&&n.dataset.dialog))return;const t=n.dataset.dialog,s=t==="custom"?{title:L.value,body:q.value}:void 0;h.showDialog(t,s).then(c=>{A.value=`resolved action / ${c}`})});r("#context-controls").addEventListener("click",e=>{const n=e.target.closest("[data-context]"),t=n!=null&&n.dataset.context?h.states[n.dataset.context]:void 0;t&&t()});r("#enumerate").addEventListener("click",async()=>{const e=await a.enumerateCameras();l.replaceChildren(...e.length?e.map((n,t)=>new Option(n.label||`Camera ${t+1}`,n.deviceId)):[new Option("No camera available","")]),o("camera-enumeration",e.map(n=>({id:n.deviceId,label:n.label})))});r("#start-camera").addEventListener("click",async()=>{i.value="requesting camera access",await a.startCamera(l.value||void 0);const e=a.getState();e.cameraLabel&&(a.setStatus({tone:"success",text:"Camera live. Press and hold over a QR code; release to commit the scan."}),o("camera-started",{id:e.cameraId,label:e.cameraLabel}))});r("#stop-camera").addEventListener("click",()=>{a.stopCamera(),i.value="stopped / start camera to test live scanning",a.setStatus({tone:"neutral",text:"Camera stopped. The simulator and synthetic scan controls remain available."}),o("camera-stopped")});l.addEventListener("change",()=>{l.value&&(i.value="switching camera",a.selectCamera(l.value))});r("#camera-simulations").addEventListener("click",e=>{const n=e.target.closest("[data-camera-state]"),t=n!=null&&n.dataset.cameraState?x[n.dataset.cameraState]:void 0;t&&(a.setStatus(t),o("camera-simulation",n.dataset.cameraState))});document.querySelectorAll("[data-css-var]").forEach(e=>{const n=()=>f.style.setProperty(e.dataset.cssVar,e.value);e.addEventListener("input",n)});r("#clear-log").addEventListener("click",()=>d.replaceChildren());r("#save-guide").addEventListener("click",()=>{const e=URL.createObjectURL(new Blob([T],{type:"text/markdown;charset=utf-8"})),n=document.createElement("a");n.href=e,n.download="QR-SCAN-CORE-IMPLEMENTATION.md",n.click(),URL.revokeObjectURL(e),o("guide-saved","exact docs/IMPLEMENTATION.md content")});
//# sourceMappingURL=emulator-CWZQNihr.js.map
