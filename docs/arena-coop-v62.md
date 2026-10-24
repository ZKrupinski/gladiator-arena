# Concordia v62 — corpse and living fighter depth correction

- In 5vs5 cooperative combat, all fighter sprites are now painted strictly back-to-front in ascending **world-space ground-foot Y**.
- A corpse at Y=550 draws over a living fighter at Y=500; a living fighter at Y=610 draws over the corpse.
- Dead/alive state does not affect depth order. Equal-Y ties retain their existing relative ordering. Drawing uses a sorted copy; simulation and saved fighter positions remain unchanged.
- Corpses remain fully opaque and fixed at their death location, but continue to be **nonblocking** for walk, dash, knockback and team combat moves.
- Existing character art, scaling profiles, tool-published offsets, 1v1 and practical training mode, settlement and tactics are unchanged.

## QA
- `tests/arena-coop-core.js` now asserts mixed corpse/live depth order, identical-Y stability, no mutation of the simulation order and corpse traversal; plus 100 full deterministic battles.
- `tests/arena-coop-tactics.js` stresses 250 mixed-power fights with living-body collision rules.
- This verifies the sort and simulation but does not on its own confirm Cloudflare delivery or visually inspect all character-specific animation feet on every mobile screen.
