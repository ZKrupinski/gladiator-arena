# SpriteForge V3 — GLADIATOR production constitution

Goal: maximize first-pass correctness by enforcing rules BEFORE art generation and refusing to publish ambiguous or invalid frames.

Core motions: idle, walk, slash, sweep, thrust, heavy, guard, hit, death. Optional creature roar is NOT guard. For each approved character use exactly ONE motion per generator request and EIGHT distinct high-resolution full-body poses.

Step 1: Create a locked, SHA256-referenced generation job:
python scripts/spriteforge_pipeline_v3.py --mode plan --reference /art/approved_leopard.png --character leopard --action idle --out /tmp/leopard-idle

Step 2: Connect a real provider adapter that reads the generation_job.json, follows its instructions and returns result.json with EITHER eight PNG filenames OR one 4x2 sheet plus jobSha256 equal to the SHA256 of the original job file:
python scripts/spriteforge_pipeline_v3.py --mode generate --job /tmp/leopard-idle/generator_job.json --adapter /trusted/provider_adapter.py --out /tmp/render

Generator adapter is NOT connected to ChatGPT ImageGen. Without an actual provider adapter, generation FAILS. It is wrong to claim autonomous drawing is done when only the job contract exists.

Step 3: For images already produced, run:
python scripts/spriteforge_pipeline_v3.py --mode inspect --job /tmp/leopard-idle/generator_job.json --result /art/result.json --out /tmp/leopard-qa

Quality gates: native pixel resolution at least 512x512 per frame, or 4x2 at least 2048x1024; eight unique frames; transparent alpha; no body clipping, shared cell boundary components, second major actor or uncertain detached parts. For accepted images, preserve original pixels, do NOT upscale, and align to estimated foot coordinates on a dynamically sized transparent output canvas.

A sheet is examined on its full alpha mask BEFORE cutting into cells. If linked silhouettes cross frame seams, STOP and request regeneration rather than amputating parts. Alpha-based bbox cuts remove transparent padding only. Ambiguous detached pieces are NOT silently erased.

Every technical pass is pending an art review and game playback review. No original assets are deleted or overwritten and production release is not authorized. Gameplay root motion and airborne foot anchors still need semantic pose review. All generated failures are scoped to the one animation, not the whole character.

Known limitation: geometry checks alone cannot guarantee source art fidelity or distinguish all connected double bodies. Generation prompt does not provide hard compliance with an image model; the actual outputs are checked afterward. A future provider adapter must be connected before this is an automatic one-step generation tool.
