# Directional VFX v4 — 2026-10-20

The old combat/victory PNGs contain already-clipped shapes and fragments from
adjacent rows. The old review gallery used different WebP assets from the game.
Changing uniform cell coordinates could not repair those missing pixels.

This revision uses 10 newly illustrated sequences × 8 frames. Each runtime PNG
is 512 × 512 with a common pivot and at least 23px of transparent margin. Native
generated pixels are preserved without enlargement; the 1774 × 887 source sheets
are not falsely described as native 4K artwork. Download sheets are 2048 × 1024.

The built-in ImageGen tool created the artwork. `sources/` retains selected
originals. `scripts/package_directional_fx.py` chooses genuinely empty gutters
per row instead of assuming a uniform AI-generated grid, excludes <=2/255 alpha
noise, and removes reviewed parry grid-line remnants from otherwise empty gutters.
Every remaining source pixel is assigned exactly once to an isolated frame.
There is no runtime source-sheet cropping or adjacent texture sampling.

Plain attacks use only slash/sweep/thrust swordlight. Heavy contacts use their
own small hit effect. Guard, parry, dash, special, finisher and victory use
different artwork. Facing mirrors the complete local effect, including rotation.
Victory halo remains behind the fighter; only pink petal pixels overlay it.
The duplicate cinematic dash burst was removed. Finisher art was resized and
raised after a browser screenshot exposed bottom-of-screen clipping.

`/vfx-gallery.html` uses the actual game renderer, with frame stepping, left/right
switching, transparent background, boundary overlays and individual frame images.

## Validation

- `python scripts/qa_directional_frames.py`: all 80 frames have transparent gutters,
  unique hashes, disjoint source ownership, exact retained source pixels and no
  original-sheet outer-edge clipping. Results: `pixel-qa.json`.
- `node scripts/qa_directional_vfx.mjs`: all 80 decoded frames mirrored pixel-for-
  pixel, 12 actual left/right combat scenarios, distinct PNG selection, no atlas
  slicing, sound events, camera kicks, parry/dash focus and reduced-motion checks.
  Results/screenshots: this directory. Optional ARENA_URL targets production.
- Existing focus, secondary-motion, audio-browser, parry-visibility and fighter-
  proportion checks passed locally in Microsoft Edge. Audio decoded all 33 files,
  played the existing stadium crowd and impacts, and verified ducking/mute.
- Existing `tests/ludus-roster.cjs` fails at line 6 because it expects every boss
  appearance to be `legacy`, while the unchanged roster now returns
  `murmillo_champion_red`. This occurs before reading the changed game HTML.
  Neither that roster module nor its old test is changed by this revision.
- `python scripts/verify_live_vfx.py`: compares production HTML, renderer, gallery,
  manifest and all 80 PNGs byte-for-byte against the checkout. A push alone does
  not establish deployment success.

Audio artwork, fighter graphics, controls, damage rules and progression remain
the existing versions. The optional crowd replacement was already present as
the v5 stadium-recording pack, so this revision validates it rather than claiming
to have replaced those recordings again.
