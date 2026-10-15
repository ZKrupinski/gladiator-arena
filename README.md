# GLADIATOR — SPARTACUS / THE GLADIUS RENAISSANCE

Version: **New Era v2.9.1**. One playable version only. The old **「전설의 시작」 classic combat** and its assets are no longer distributed from `public/`.

## Play / deployment
- Git-backed Cloudflare Pages: https://gladiator-arena-git.pages.dev/
- Repository: https://github.com/ZKrupinski/gladiator-arena
- Deployment branch: `main`; output directory: `public`
- No build step is required; `public/index.html` is the self-contained playable HTML5 Canvas game.

## Active source of truth
- `public/index.html`: modern game runtime, responsive Ludus title, combat HUD/controls, fighter selection, winner/loser result screen, image loading and class-specific hit effects.
- `public/assets/new-era/{murmillo,thraex,retiarius}_atlas.png`: current 5 × 2 pose atlases, **10 poses per fighter**: idle, walk, attack, special, guard, dodge, hit, net, finisher, defeat.
- `public/assets/new-era/fx*_atlas.png`: per-class combat FX frame sheets.
- `public/assets/new-era/arena.webp`: active arena background.
- `public/deployment-health.json`: Cloudflare Git deploy connectivity probe.

## Game loop
- Choose your fighter and opponent, enter the arena; move, attack, guard, dodge and special.
- AUTO takes over after 5 seconds without manual input.
- Victory/defeat key poses are held and shown on the results screen with dedicated previews.
- '다시 하기' rematches; after a win '계속 하기' advances; after a defeat 'Ludus로 돌아가기' returns to the title.

## Scope of the art
The 10 frames per fighter are **key poses**, not fully in-betweened 3D skeletal animation. Movement between them uses simple runtime offsets. Attack effects follow their own attacking fighter; the title roster order is Retiarius, Thraex, Murmillo. Current PNG art should be refined separately when clipped weapon edges, transparent fringe pixels, or art-layer misalignment is present. The source images themselves are not modified by a runtime layout update.

## Local play
```sh
python -m http.server 8000 --directory public
```
Open http://localhost:8000/ .

## Hosting note
A commit to `main` triggers Git-integrated Cloudflare Pages when the external Cloudflare integration is enabled. Repository commit success alone is not proof that the Cloudflare production deployment succeeded.
