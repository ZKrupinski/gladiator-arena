# Contact flash and character vibration — v122

Surviving fighters now start one translucent white silhouette and a local body
vibration on the same confirmed-contact clock. This covers the shared duel
renderer (1v1, sequential lineups and beast battles), survival practice and 5v5.

- Removed the 100 ms delayed flash start. White glint lasts 85 ms with a maximum
  alpha of 0.29; local vibration decays to zero at 160 ms.
- Passed flash alpha into the actual sprite painter. Legacy atlas renderers
  assign globalAlpha internally and previously discarded the outer multiplier.
- Practice and 5v5 use the same alpha-preserving white overlay as duels, replacing
  a brightness-only filter. Vibration follows scene depth and camera projection.
- 5v5 damage events trigger each victim independently of the camera's 150 ms
  throttle. Windups/dashes without damage do not trigger victim flashes.
- Death, reduced-motion and disabled-FX guards return neutral output. Positions,
  collision footprints, saved profiles and source art remain unchanged.

## Validation

`node tests/hit-contact-feedback-v122.cjs` covers eight fighter/beast labels at
30/60/120 Hz, immediate onset, opposite vibration directions, decay, repeated
contacts, death, pause, FX/reduced-motion suppression, alpha restoration and
simultaneous damage dispatch to multiple 5v5 targets.

`node scripts/qa_arena_motion.mjs` and `node tests/arena-combat-feel.js` pass.
Existing depth, footwork, independent layers, edited effects, artist proportions,
executioner scale, 5v5 core/camera/UX and parry-KO regressions pass (13 Node test
entrypoints including the new test).

`CHROMIUM_PATH=/path/to/chromium node scripts/qa_hit_contact_browser.cjs` launches
an ephemeral local server and an isolated browser context. Test-only hooks are
injected into responses, not production files. It exercises the real duel,
lion, practice and 5v5 sprite renderers: each produces one white overlay at
alpha 0.2886, increased rendered pixel brightness and a simultaneous nonzero
body offset. Actual duel and practice damage also start both effects immediately.
No page errors occurred. Local fixture testing does not purchase gladiators or
write to the user's production save. Native mobile device testing is not covered.
