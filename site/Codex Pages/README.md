# Codex Pages

This is an isolated Next.js implementation of the requested portfolio site. Everything for this attempt lives inside `Codex Pages` so it can run in parallel with other agent work without collisions.

## Why this stack

I used a local Next.js App Router app because it cleanly supports:

- filesystem-backed page content
- server-side file reads and writes
- a simple local admin login flow without a third-party service
- reusable page modules across landing, subsidiary, portfolio, and resume routes

## Run locally

1. `cd "Codex Pages"`
2. Duplicate `.env.example` as `.env.local`
3. Set `CODEX_ADMIN_USER`, `CODEX_ADMIN_PASSWORD`, and `CODEX_SESSION_SECRET`
4. `npm install`
5. `npm run dev` or `npm run dev:clean` if Next cache has gotten weird`r`n6. Open `http://localhost:3001`

## Port notes

- The default dev and start port is now `3001`.
- To run another copy on a different port, use `npm run dev -- --port 3002`.
- You can swap `3002` for any free port, like `3003`, `3010`, or `4000`.


## Cache recovery

If Next throws an error like `Cannot find module ''./719.js''` from `.next/server/webpack-runtime.js`, the local build cache is stale or mixed between runs.

Use:

- `npm run dev:clean`

Or manually:

- `npm run clean`
- `npm run dev`

This removes `.next` and forces a fresh rebuild.
## Routes

- `/`
- `/portfolio`
- `/resume`
- `/gyre`
- `/emblazon`
- `/trillium`
- `/admin/login`
- `/admin`

## Content tree

The site reads directly from `content/`.

```text
content/
  site/
    footer.md
    landing-activities-title.md
    subsidiary-links.json
  Pages/
    Landing/
      landing-title.md
      landing-intro.md
      Landing Images/
      Landing Text/
    Resume/
      title.md
      intro.md
      Resume.pdf
    Portfolio/
      title.md
      welcome.md
      Summary Text A.md
      Portfolio Images A/
      Portfolio Text A/
      Summary Text B.md
      Portfolio Images B/
      Portfolio Text B/
    Gyre/
    Emblazon/
    Trillium/
```

## Naming rules for slider pairs

The pairing logic supports all of these patterns:

- `1I` with `1IT`
- `1AI` with `1AT`
- `1IA` with `1ITA`

Images can be `.png`, `.jpg`, `.jpeg`, `.svg`, or `.webp`.
Text can be `.md` or `.txt`.

## Adding more portfolio groups

To add another auto-discovered portfolio stack without touching code:

1. Add `Summary Text C.md`
2. Add `Portfolio Images C/`
3. Add `Portfolio Text C/`
4. Add matching files like `1IC.png` with `1ITC.md`, or `1CI.png` with `1CT.md`

The portfolio page will discover and render the new section automatically.

## Admin mode

Admin mode is intentionally lightweight and local:

- text files edit inline and save directly back to disk
- image and PDF files replace the existing file in place
- public routes keep pointing at the same file-backed source

This covers the `/e` content requirement without coupling the site to a hosted CMS.

## Notes

- The design direction is informed by the provided reference PNGs and the teal/moss/cream palette sheet.
- The `bcode site reference` folder was used only as a loose technical reference for self-contained site organization, not for direct layout or style copying.
- `content/Pages/Resume/Resume.pdf` currently contains a tiny starter PDF so the embed/download flow works immediately.

