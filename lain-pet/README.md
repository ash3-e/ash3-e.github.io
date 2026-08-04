# Lain Pet 1.4.12

Source and the exact verified `app.asar` for the standalone Lain desktop pet.

## Included

- `renderer/`, `src/`, and `assets/`: application source and sprites.
- `tests/`: animation, window-action, and active-session regression tests.
- `release/app.asar`: the packaged archive installed and tested on Windows.

The release archive has SHA-256:

```text
590C326A7614215745FE2023BFA57CB97E641A0A923F49DB240B32F3AD484F55
```

## Verification

```powershell
node --check renderer\animation-runtime.js
node --check renderer\app.js
node --check src\main.cjs
node --test tests\*.test.cjs
```

The packaged QA covers active-session title/output synchronization, reply handling, 3× movement handoffs, stable randomized recline direction, title controls, minimize-to-tray, and native hide/restore behavior.
