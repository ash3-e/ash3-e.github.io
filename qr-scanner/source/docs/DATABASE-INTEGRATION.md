# Database Integration Without Core Contamination

This document describes an adapter boundary. It is not part of the scanner core and names database concepts only to show where they must remain.

## Rule

Never import Supabase, QRQT contracts, address parsers, BPN parsers, assignment policy, stale-code policy, or application navigation into `src/`. Put those dependencies in the consuming database application.

## Adapter shape

```ts
import { createQrScanner, type ScanResult } from "@cyberia-modulus/qr-scan-core";
import { canonicalizeQrCode } from "./qrCode";
import { resolveQrCode } from "./search";

const scanner = createQrScanner({
  normalizePayload(raw) {
    return canonicalizeQrCode(raw) ?? raw;
  },
  async handler(payload) {
    const address = await resolveQrCode(payload);
    return { payload, address };
  },
  onResult(result) {
    void applyDatabaseResult(result);
  },
});

async function applyDatabaseResult(result: ScanResult<{ payload: string; address: string | null }>) {
  if (result.value.address) {
    scanner.setStatus({ tone: "found", text: `Located ${result.value.address}` });
    navigateToAddress(result.value.address);
    return;
  }
  scanner.setStatus({ tone: "unmatched", text: "No match" });
}
```

The imports above belong in the host adapter, never in this repository's core source.

## Reassignment example

1. Receive the neutral scan result.
2. Ask the database/QRQT adapter for current state.
3. Convert that response into host-owned copy and neutral status tone.
4. If confirmation is required, call `showDialog` with opaque action identifiers.
5. On the returned action, run the mutation in the adapter.
6. Update status or show another dialog from the adapter response.

The scanner must not decide whether replacement is allowed.

## Stale, retired, and tombstoned examples

Resolve lifecycle state outside the scanner. Map it to neutral UI only after the adapter has authoritative data:

```ts
scanner.setInputLocked(true);
scanner.setStatus({ tone: "error", text: hostLifecycleMessage });
const action = await scanner.showDialog({
  title: hostLifecycleTitle,
  body: hostLifecycleMessage,
  actions: hostActions,
});
scanner.setInputLocked(false);
await runHostAction(action);
```

The core does not know why input was locked or what any action means.

## React ownership

Create one scanner per owning route or modal component. Store it in a ref. Update host callbacks through stable refs or recreate the controller only when integration configuration truly changes. Call `close()` when hiding a reusable modal and `destroy()` when the route unmounts.

## Contamination review

Before merging an integration:

- no core source imports the host application;
- no core type mentions QRQT, Z1Q, Supabase, inventory, address, BPN, assignment, or host routes;
- synthetic scans work with the network disabled;
- the harness still exercises every neutral UI state;
- adapter errors cannot prevent scanner teardown;
- `docs/IMPLEMENTATION.md` was updated if the integration establishes new reusable instructions or extension patterns.

