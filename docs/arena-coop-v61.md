# Concordia v61 — fallen fighters are nonblocking

Date: 2026-10-25

## Game rules
- Dead gladiators remain in their death pose, fully opaque, at the same ground position until the match ends. They are rendered below live fighters so an active fighter can pass visually in front of a fallen fighter.
- Corpses **do not participate in physical collision checks**. Walking, dashing, parry follow-ups, pursuit, rescue movement, and knockback may pass through fallen bodies.
- **Living gladiators still collide with one another**, including during dashes and knockback. Arena boundaries remain unchanged.
- 5vs5 tactics, focus/cover/rally commands, awards/save rules, 1vs1 combat and practice mode are unchanged.

## QA
- Updated `tests/arena-coop-core.js`: 100 deterministic full fights and a dedicated scene with a live fighter crossing an immobile corpse entirely, while still checking live-live spacing and unchanged corpse location.
- Updated `tests/arena-coop-tactics.js`: 250 varied 5vs5 battles, checking live-live collision only, tactical event generation, HP/positions, and match completion.
- Dry-run results for this change: 100 basic matches passed (40.7 sec average); 250 mixed-team matches passed (34.0 sec average), 250/250 ended by elimination. The shorter matches result from removing corpse path blocking; no deliberate rebalance was introduced.
- No actual Playwright/mobile device or Cloudflare deployment confirmation during this QA. Production delivery is dependent on external Git-backed Cloudflare Pages deployment.
