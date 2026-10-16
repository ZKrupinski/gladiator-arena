# GLADIATOR — SPARTACUS / THE GLADIUS RENAISSANCE

Version: **New Era v3.3**. One playable version only. The old **「전설의 시작」 classic combat** and its assets are no longer distributed from `public/`.

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
- v3.2 camera: smooth tracking of the fighter midpoint, proximity-aware zoom during close combat with extra emphasis on hits, parries and leap rushes; separately clamped, overscanned arena parallax so image edges cannot enter the frame.
- v3.3 arena grounding: draw the original 2172 × 724 wide background in aligned wall and foreground-sand bands. Keep the arena's architectural ground line near screen y=500 and fighter feet near y=617 (117px of visible sand behind the feet). Floor occupies roughly the bottom 31% of the screen; dynamic zoom reveals slightly more. Horizontal scrolling clamps to >=80px image overscan per side. Idle/walk no longer animate the entire sprite vertically, preventing false floating; dodge and leap-rush keep their intended upward movement.
- `public/deployment-health.json`: Cloudflare Git deploy connectivity probe.

## Game loop
- Choose your fighter and opponent, enter the arena; move, attack, guard, dodge and special.
- Basic strikes randomly alternate among **horizontal slash**, **rising strike** and **forward thrust** (no identical back-to-back move), each with matched body interpolation and rotated/offset class-specific FX.
- **Land 3 consecutive ordinary hits** within a **3.8-second** chain window; the **4th regular attack input** triggers a short leap followed by a high-speed dash hit that damages and powerfully knocks back the target. Guarded/missed/parried hits do not count. The chain breaks if the attacker is hit or uses a special attack.
- AUTO takes over after **2 seconds** without manual input; it prioritizes ordinary strikes while building a four-hit combo.
- Opponent AI v3.1: roughly half the previous attack frequency, lower parry frequency, and a 0.92-second pressure/recovery window after each connected, unguarded player ordinary strike. The rival resumes normal fighting once the pressure expires.
- Victory/defeat key poses are held and shown on the results screen with dedicated previews.
- '다시 하기' rematches; after a win '계속 하기' advances; after a defeat 'Ludus로 돌아가기' returns to the title.

## Scope of the art
The 10 frames per fighter are **key poses**, not fully in-betweened 3D skeletal animation. The additional attack styles and leap-dash are runtime combinations of existing poses, body translation/rotation/scale and FX layers—not newly illustrated sprite sheets. Attack effects follow their own attacking fighter; the title roster order is Murmillo, Thraex, Retiarius. Current PNG art should be refined separately when clipped weapon edges, transparent fringe pixels, or art-layer misalignment is present. The source images themselves are not modified by a runtime layout update.

## Local play
```sh
python -m http.server 8000 --directory public
```
Open http://localhost:8000/ .

## Hosting note
A commit to `main` triggers Git-integrated Cloudflare Pages when the external Cloudflare integration is enabled. Repository commit success alone is not proof that the Cloudflare production deployment succeeded.

## Ludus hosted growth sprites (v4.5)

The 20 approved PNG atlases load automatically from `public/assets/ludus-growth/`: Thraex A/B, Murmillo A and Retiarius A, five stages each. PNG bytes are preserved exactly from the review ZIP. The adjacent manifest records actual packaged SHA-256 values and retains the supplied source hashes separately. ZIP import and IndexedDB image storage are no longer required. Failed image requests expose a retry button; arcade art remains the fallback. The Ludus hub preview follows the selected type and stage as images finish loading. Career saves, progression and arcade mode are preserved.
