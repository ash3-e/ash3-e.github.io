# QR Scan Core

QR Scan Core is a framework-neutral physical QR scanner extracted from the Lab Inventory database application. It preserves the camera lifecycle, QR decoding, focus/exposure, torch, hardware/software/cross-camera zoom, radial dial, draggable and pinch-resizable ROI, keyboard/touch controls, and base result UI without carrying any database or assignment policy.

> This module contains the physical QR scanning feature, its camera and decode implementation, its base scanner UI, its radial zoom control, and its gesture controls. It contains no QRQT, Z1Q, inventory, address, BPN, Supabase, assignment, or application-specific logic. By default, a successful scan stores and displays the decoded payload and performs no other action.

## Quick start

```ts
import { createQrScanner } from "@cyberia-modulus/qr-scan-core";
import "@cyberia-modulus/qr-scan-core/style.css";

const scanner = createQrScanner({
  onResult(result) {
    console.log(result.payload);
  },
});

scanner.mount(document.querySelector("#scanner")!).open();
```

The public contract also supports `scanresult` events, `nextResult()` Promises, `getLastResult()`, bounded history, injected normalization, and arbitrary sync/async handler return values.

## Development

```sh
npm install
npm run dev
```

Vite serves two standalone interfaces:

- `http://127.0.0.1:5173/skeleton/` — the full-screen, live-camera functional skeleton with no application or database behavior;
- `http://127.0.0.1:5173/emulator/` — the terminal-wall emulator with the dedicated control pane and preview device (`/` remains a compatibility entry).

Both use the same scanner core, accepted assets, and inert example catalog. The emulator's **Save Guide** button downloads the canonical [`docs/IMPLEMENTATION.md`](docs/IMPLEMENTATION.md) file exactly.

## Documentation

- [Implementation and integration guide](docs/IMPLEMENTATION.md)
- [Source extraction traceability](docs/EXTRACTION-NOTES.md)
- [Database adapter boundary](docs/DATABASE-INTEGRATION.md)
- [Approved design](docs/superpowers/specs/2026-08-13-qr-scan-core-design.md)

The implementation guide must be updated in the same change whenever behavior, APIs, lifecycle, browser support, styling, deployment, or future integration instructions change.

## Build

```sh
npm run build
```

The library is emitted in `dist/`; both subpath-safe web interfaces are emitted beneath `dist/harness/skeleton/` and `dist/harness/emulator/`. The emulator also remains at `dist/harness/index.html` as a compatibility entry.

## License

MIT
