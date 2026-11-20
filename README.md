# NEON COAST COVER LAB

A GTA-style cover maker for the **gta6-cover-art-01** bounty ("Make GTA 6 Cover Art", $250, escrowed) — round 2. Round 1 ("Vice City Cover Studio", judge 657232, rank 3624/4654) had 4 layouts and 4 grades; this round rebuilds the art engine to push for the top 10: 8 layouts, 8 grades, a halftone title band with gradient lettering, a glowing script subtitle, a badge pill, a heat-meter of stars, seeded film grain, photo upload, drag-to-pan, undo/redo and one-click export of all three post sizes. Plain ES modules, no build step, no libraries, no network — every asset is local.

## What it does

- **Layouts (8)** — Hero, Duo, Triptych, Grid 4, Mosaic 9, Tilted Stack (rotated snapshot panels), Hero + Strip, Comic 3
- **Grades (8)** — Sunset, Neon, Noir, Vice, Gold, Miami, Dusk, Palm, each with its own colour washes, title gradient and halftone density
- **Title band** — halftone dot field, letter-spaced tagline, big gradient title with ink outline and drop shadow (or solid / outline styles), glowing script subtitle, gold rule, "EST. 2026 • VICE CITY" badge pill, 5-star heat meter
- **Panels** — each panel picks its own photo, zoom (1.0–2.5) and crop offsets; click a panel in the preview to select it, drag to pan, scroll to zoom
- **Photos** — the two kit sample photos, plus any photo uploaded from the user's machine (read locally, never uploaded anywhere)
- **Moods** — one-click presets: Neon Night, Retro Sunset, Gritty Noir, Palm Gold
- **Export** — one click renders the cover offscreen at 1080×1080, 1080×1350 or 1920×1080 and downloads it as PNG; "Export all 3" downloads every size
- **Undo / redo** — 30-step history for layout, grade, preset, crop and title changes; Shuffle for a quick new look

## Try it

```bash
node serve.ts          # serves app/ on http://localhost:8080
```

Open the page, upload a photo (or use a sample), pick a mood, tweak the panels, and export.

## Deterministic screenshots

The app supports a shot mode for reproducible captures:

- `?shot=cover` — hides all chrome and paints the cover edge to edge
- `?shot=editor` — keeps the editor visible, photo loaded in the preview
- Add `&photo=pier|boulevard` to force every panel to one photo, `&caption=TEXT` to set the caption, `&layout=` / `&grade=` / `&preset=` to pick a look

Either mode sets `window.__shotReady` when the frame is painted, and `window.__shotError` on failure. Shot mode never uses randomness. The four captures are listed in `shots.json`.

## How the cover is drawn

`app/src/cover.js` exports `drawCover(ctx, images, state, W, H)`:

1. Each layout panel is painted cover-fit from its photo, zoomed and panned per panel (tilted panels are rotated with a drop shadow).
2. White frame lines separate the panels (thick ink outlines on the comic layout).
3. The grade's colour washes are layered with canvas blend modes, then a radial vignette darkens the edges.
4. The title band is drawn last: dark gradient, halftone dots, tagline, gradient title, gold rule, script subtitle, badge pill and heat stars, then seeded grain over everything.

State lives in `app/src/presets.js` (`SIZES`, `LAYOUTS`, `GRADES`, `PRESETS`, `PHOTOS`, `defaultState()`); the editor in `app/src/main.js` wires the toolbar to that state.

## Files

```
app/
├── index.html          # editor shell
├── style.css           # dark studio theme
├── samples/
│   ├── pier.jpg        # kit photo
│   └── boulevard.jpg   # kit photo
└── src/
    ├── main.js         # editor state + toolbar wiring + upload + undo/redo
    ├── cover.js        # cover renderer
    ├── presets.js      # sizes, layouts, grades, presets, photos
    └── shots.js        # ?shot= staging
main.ts                 # build script: copies app/ + screenshots/, writes dossier.json
shots.json              # the four screenshot captures
serve.ts                # tiny local static server (kit)
vendor/makefun-app.ts   # kit dossier builder (do not edit)
```

## Notes

- **Typography**: system fonts only (Arial Black / Impact for titles, Brush Script MT for the script subtitle). No downloaded fonts.
- **Images**: only the two kit photos under `app/samples/`. No other artwork.
- **Originality**: an original cover-making tool. No Rockstar logos, artwork, fonts or game assets are used anywhere.

## Badges

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

[![rank](https://make.fun/badge/gta6-cover-art-01/tronolllanj-creator/gta6-cover-art-01-r2/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

[![reward](https://make.fun/badge/gta6-cover-art-01/tronolllanj-creator/gta6-cover-art-01-r2/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

---

[Join via referral](https://make.fun/r/3bm3ytwk)
