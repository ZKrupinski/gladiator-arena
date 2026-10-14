# GLADIATOR — The Gladius Renaissance

Korean-language HTML5 Canvas 2D gladiator game. Current playable version: **v1.4**.

## v1.4 — Class specials and finishers

- **Murmillo:** shield impact, stronger knockback, and guard stamina crush.
- **Thraex:** second hit during the special and a double sickle-cut visual.
- **Retiarius:** basic attack pulls netted enemies into melee range.
- **Finishers:** class-specific ~1.25-second victory flourish after a counter or special defeat.
- **Artwork:** original pixel composites and painterly arena remain unchanged.

> v1.4 is deployed only after this PR is reviewed and merged into `main`.

## Source layout

- `public/index.html` — game entry point
- `public/css/game.css` — styling
- `public/js/game.js` — game logic and classes/manifest data
- `public/assets/characters/{class}/composite` — original pixel frames, unchanged
- `public/assets/characters/{class}/head` — original face assets
- `public/assets/backgrounds/colosseum` — original painterly background
- `public/assets/data` — game manifest and class/equipment definitions

## Local test

From the repository root, run `python -m http.server 8000 --directory public`, then open `http://localhost:8000`.

## Cloudflare Pages auto deployment

Create a **new** Pages project using Git integration and select this repository.

| Cloudflare setting | Value |
|---|---|
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `exit 0` (or blank, if accepted) |
| Build output directory | `public` |
| Root directory | `/` (default) |

Every push to `main` will deploy automatically. The existing Direct Upload project cannot be switched to Git integration, so the Git-integrated Pages project must be separate.

**Note:** Original character sprites are composite images, not yet layer-separated equipment. Source imagery was preserved.
