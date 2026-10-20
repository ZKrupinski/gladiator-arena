# GLADIATOR SpriteForge Agent V2 (AI assistant's production tool)

This is the **agent-facing production gate** used in art creation. It is not an application the user needs to operate. Legacy SpriteForge v1 remains available for manual previews, but all NEW authoring follows V2.

## Canonical New Champion Murmillo contract (9 motions x 8 frames)

| Engine / canonical | Gladiator animation | Wolf animation |
|---|---|---|
| idle | 대기 | 대기 |
| walk | 이동 | 이동 |
| slash | 종베기 | 공격1 물기 |
| sweep | 횡베기 | 공격2 할퀴기 |
| thrust | 찌르기 | 공격3 도약 덮치기 |
| heavy | 강베기 | 공격4 돌진 강공격 |
| guard | 방어 | 몸을 웅크린 방어 |
| hit | 피격 | 피격 |
| death | 죽음 | 죽음 |

**Roar / 포효 is an OPTIONAL 10th special animation, never the substitute for Guard.**

## Authoring loop: before and after EVERY generated action

1. Create one-action-at-a-time plan BEFORE generating images:

    python scripts/spriteforge_agent_v2.py --plan-only --character wolf --out /tmp/wolf-plan

    Read `generation_contract.json` and `action_by_action_plan.json`.
    Every generation request is exactly one approved character × one action × eight independent poses.
    High-resolution full-body output, transparent background, one isolated 4×2 sheet OR eight independent full PNGs.
    Extra horizontal/vertical cell gutter is mandatory. Do not make a board of different actions.

2. After each image generation, immediately run component-based extraction and QC:

    python scripts/spriteforge_agent_v2.py --manifest /art/wolf_sources.json --out /tmp/wolf-qc --only attack2 --allow-partial

3. Check `qa.json`, `regeneration_requests.json`, `attack2_contact.jpg` and `attack2_motion.gif`. A BLOCKED result must send the SAME action back to generation with the specific failure information. Never move onto the next action or deploy a failed result.

4. SpriteForge finds dominant connected RGBA subject pixels and discards **disconnected non-owned neighboring chunks**. It preserves antialiasing. **If bodies are physically merged across cells, it blocks the source** and requests regeneration rather than cropping off limbs.

5. It uses one non-upscaled source scale for all eight frames, aligns ground foot coordinates to the SAME export point (480,684) on a 960×720 transparent canvas, and supplies per-frame signed `rootMotion.dx/dy` for attack preparation, strike, airborne leap, recoil and settling. Motion preview GIF visualizes these offsets; engine should apply facing direction to dx when using metadata.

6. Even when geometric checks pass: inspect original visual quality, details, outfit consistency, and actual game-rendered animation. Machine-only PASS does NOT authorize game assets replacement.

## Manifest example

    {
      "character":"wolf","scale":1,
      "actions":{
        "idle":"wolf_idle.png","walk":"wolf_walk.png",
        "attack1":"wolf_bite.png","attack2":"wolf_claw.png",
        "attack3":"wolf_leap.png","attack4":"wolf_heavy.png",
        "guard":"wolf_guard.png","hit":"wolf_hit.png",
        "death":"wolf_death.png","special_roar":"wolf_roar.png"
      }
    }

Alternate per action input: exactly eight paths, for example `"attack2":["frame00.png",...,"frame07.png"]`.

## Boundaries and safety

- An external image generation tool is still needed to DRAW new poses. SpriteForge V2 prepares the per-action generation contract, inspects each actual generation result, and emits precise regeneration instructions. **It cannot invoke ImageGen by itself**.
- Connected component analysis is conservative, not semantic knowledge: if a connected artifact cannot be isolated safely, the QA result blocks release. Physical duplicates fused into one contiguous blob cannot always be identified automatically.
- Game runtime currently has its existing locomotion and attack logic. Exported V2 root-motion curves are **authoring metadata** until explicitly consumed by an approved character runtime. Do not claim new motion physics or a production art swap merely because metadata exists.
- No automated overwriting/deleting old sprites. Existing champion and menagerie assets remain unchanged until an entire full action set is approved and playtested.
