# Concordia v58 — simultaneous 5 vs 5 arena

The regular arena draft now has a `5v5 실시간 협동전` tab. Select five eligible owned fighters. This is a single-player team command mode with autonomous allies and opponents, not network multiplayer. Existing 1v1/sequential modes and the practice engine remain independent.

- Ten actors move and fight concurrently. Parry opportunities, nets, shield interception and knockback can trigger nearby allies' follow-up attacks. Dead actors/targets invalidate queued assists; assists cannot recursively generate other assists.
- Enemy card: focus fire for six seconds, ten-second cooldown. Ally card + cover: protection for seven seconds, fifteen-second cooldown. With no ally selected, cover chooses the lowest health ratio.
- Cooperation generates meter; 60 meter buys a team assault. Assaults do not refund their own meter.
- Soft spacing, depth ordering, full authored sprite anchors, per-look scale/foot calibration and motion-key sampling. Mobile uses a shared camera zoom to keep the live team readable.
- 120-second limit. On timeout, total remaining per-fighter health ratios decide the winner; ties do not grant a win. Pausing or hiding the page pauses combat.

## Persistence and settlement

Participation immediately adds 8 fatigue and one `coopRuns`, including abandoned/reloaded battles. A failed initial save rolls back those changes and prevents entry. Reload does not resume an unfinished battle.

Definitive results settle once: victory gives `220 + 25 × average level` gold and 8 glory, plus each fighter receives `35 + 4 × average level` XP. Defeat gives only `12 + 2 × average level` XP. Retreat gives neither currency nor XP. Additional fatigue depends on elapsed combat, and injury depends only on health lost during this battle (plus a knockout penalty). Normal duel wins/fights and boss progression are not incremented. Cooperation counters and the last result are serialized explicitly. Failed result saves offer a storage-only retry, without applying rewards again.

## Validation

- `node tests/arena-coop-core.js`: 100 deterministic seeded battles; all ten fighters participate, all four cooperation triggers occur, finite bounded positions/health, dead-target cancellation, commands/cooldowns, pause, timeout, retreat, deterministic replay and terminal idempotence. Equal-team baseline: 51.3 seconds average, 53 allied wins out of 100; this is a smoke balance sample, not a player balance study.
- `node tests/arena-coop-browser.js` (Playwright): desktop 1440×1000 and simulated mobile 390×844; draft eligibility/count, ten rendered unit controls, pause/resume, targeting, actual end-to-end combat settlement, repeated result frames, reload, retreat, initial-save rollback, result-save retry, return to 1v1 and actual 1v1 combat, and unchanged practice entry. No browser page errors.
- Existing `scripts/qa_matchmaking_reversal.mjs`, `tests/practice-motion-timeline-v53.cjs`, `tests/studio-bulk-persistence-v57.cjs` pass.
- Two old tests already fail on the unchanged base commit: `tests/endless-practice-v26.js` asserts an obsolete v35 script query string; `scripts/qa_sequential_lineup.mjs` omits `crowdEvent` from its VM stub. Reproduced against the original `index.html`; not silently treated as passing.
- `ludus-practice.js` and `ludus-practice.css` are byte-for-byte unchanged. Existing approved art is reused; no generated artwork.
