# SpriteForge V3 — GLADIATOR production constitution

Goal: maximize first-pass correctness by enforcing rules BEFORE art generation and refusing to publish ambiguous or invalid frames.

Core motions: idle, walk, slash, sweep, thrust, heavy, guard, hit, death. Optional creature roar is NOT guard. For each approved character use exactly ONE motion per generator request and EIGHT distinct high-resolution full-body poses.

Step 1: Create a locked, SHA256-referenced generation job:
python scripts/spriteforge_pipeline_v3.py --mode plan --reference /art/approved_leopard.png --character leopard --action idle --out /tmp/leopard-idle

Step 2: Connect a real provider adapter that reads the generation_job.json, follows its instructions and returns result.json with EXACTLY ONE native-resolution transparent 4x2 sheet plus jobSha256 equal to the SHA256 of the original job file. Eight separately generated PNGs are prohibited; PNG frames are cut only AFTER source-sheet QA:
python scripts/spriteforge_pipeline_v3.py --mode generate --job /tmp/leopard-idle/generator_job.json --adapter /trusted/provider_adapter.py --out /tmp/render

Generator adapter is NOT connected to ChatGPT ImageGen. Without an actual provider adapter, generation FAILS. It is wrong to claim autonomous drawing is done when only the job contract exists.

Step 3: For images already produced, run:
python scripts/spriteforge_pipeline_v3.py --mode inspect --job /tmp/leopard-idle/generator_job.json --result /art/result.json --out /tmp/leopard-qa

Quality gates: NO minimum character, frame, reference or sheet pixel size. Any valid positive-size 4x2 sheet is accepted; eight unique frames; transparent alpha; no body clipping, shared cell boundary components, second major actor or uncertain detached parts. For accepted images, preserve original pixels, do NOT upscale, and align to estimated foot coordinates on a dynamically sized transparent output canvas.

A sheet is examined on its full alpha mask BEFORE cutting into cells. If linked silhouettes cross frame seams, STOP and request regeneration rather than amputating parts. Alpha-based bbox cuts remove transparent padding only. Ambiguous detached pieces are NOT silently erased.

Every technical pass is pending an art review and game playback review. No original assets are deleted or overwritten and production release is not authorized. Gameplay root motion and airborne foot anchors still need semantic pose review. All generated failures are scoped to the one animation, not the whole character.

Known limitation: geometry checks alone cannot guarantee source art fidelity or distinguish all connected double bodies. Generation prompt does not provide hard compliance with an image model; the actual outputs are checked afterward. A future provider adapter must be connected before this is an automatic one-step generation tool.

## 2026-10-21 amendment — frame ownership outranks fragment size (mandatory)

A head, leg, paw, tail, torso or ANY anatomy from a different animation frame
is garbage in the current frame, even if it is a large perfectly drawn body part.
Conversely, a real part belonging to this frame must never be erased only
because it is tiny, disconnected, or near an edge.

Before judging connected-component size, compare the source sheet frame identity
and adjacent frame provenance. For the existing beast 8-column exports,
`scripts/spriteforge_neighbor_ownership_v3.py` compares pixel correspondence
against each adjacent extracted pose and may delete foreign-owned body pixels
at either edge regardless of their size. The per-frame JSON report records
the evidence and deletions. `scripts/audit_legacy_beasts_spriteforge_v3.py`
applies this classification to the 200 legacy PNGs on a review branch.

**If attribution is uncertain or two bodies are physically fused, block release
and request visual reconstruction or regeneration; never report 100% clean.**
A technical alpha-connected-component PASS never proves correct body ownership.
The approved original source atlas remains immutable.

## 2026-10-21 amendment — AUTO REPAIR, RE-QA, AND PREVIEW (mandatory)

Known defects must NOT become open-ended user questions. On any failed cut,
adjacent-frame contamination, missing body, native-resolution failure, wrong
action, or duplicate pose, **retry the same animation's complete eight frames**
with the QA error report attached to the next generation job. Repeat technical
QA on every retry. After each attempt, save `contact.png` and
`motion.gif`; expose the attempt history so the corrected motion can be
visually compared before game replacement.

Run:
```bash
python scripts/spriteforge_pipeline_v3.py --mode repair \
  --job /art/wolf-attack/generator_job.json \
  --adapter /trusted/comfyui_adapter.py \
  --initial-result /art/wolf-attack/bad-result.json \
  --max-retries 3 --out /art/wolf-attack/auto-repair
```
`--initial-result` is optional for a new animation. An adapter must be
explicitly installed and connected; NO claimed art creation without it.
If the adapter is missing, an executable retry job remains queued, not "done".

Regenerate only the failing character/action (8 poses), preserving the
approved design. Technical pass yields a preview and art/game review, NOT an
automatic production deployment. If root causes remain unknown after
reasonable repeated repair attempts, ask the user with concrete evidence.

## 2026-10-21 amendment — MANDATORY PRE-GENERATION BRIEFING + NATIVE SHEET ONLY

**Absolute rule:** Every character sprite generation request and automatic retry
is ONE character × ONE motion × EIGHT distinct sequential poses × EXACTLY ONE
transparent 4-column × 2-row sprite sheet. No generator request
may produce eight independent PNG files or mix motions on a board. Independent
PNG files are **only the output of SpriteForge's later cutting/QA step**.

Each of the eight source cells may be any positive pixel dimensions. There is
**no minimum resolution or character-size requirement**, including for tiny game
actors. A sheet still has to encode exactly four equal columns and two equal
rows. The eight complete sprites must preserve art detail at their source
scale, stable foot anchors, visually consistent proportions and safe frame
ownership. Never label a simple enlargement as genuinely reconstructed detail.

### Tool briefs BEFORE any artist or provider begins a pose

For manual art work or an assistant about to use an image generator:

```bash
python scripts/spriteforge_pipeline_v3.py --mode plan --reference /art/approved_wolf.png --character wolf --action walk --out /art/wolf-walk
python scripts/spriteforge_pipeline_v3.py --mode brief --job /art/wolf-walk/generator_job.json --out /art/wolf-walk
```

**READ the entire printed Korean briefing** and mandatory action-specific
failure history before invoking any generation. The briefing contains the
reference checksum, exact motion, 4×2 native resolution, silhouette ownership,
gutter requirements, original design constraints, and previous QA errors.

For a connected trusted adapter, `generate` and each automatic repair retry
perform a **fresh preflight handshake**:
1. SpriteForge creates `preflight/briefing.md` and `briefing.json`.
2. The provider must read them and write job- and policy-hash-bound
   `preflight/acknowledgement.json` containing all blocking rules and a
   meaningful execution plan.
3. SpriteForge validates acknowledgement and only THEN allows drawing.
4. Provider must return exactly ONE 4×2 native sheet, bound to the
   corresponding briefing checksum. Any eight-file result is rejected.
5. SpriteForge checks source-sheet seams before cutting into eight individual
   PNGs, performs QC, previews, retries failures, and blocks production until
   art/game validation.

Missing, expired, incomplete or wrong-job acknowledgement -> NO drawing.
Any policy revision or updated approved reference -> remake the job and rebrief.
This is a behavioral gate that prevents accidental skips; it does not magically
grant a generator the ability to understand all anatomy or create high-quality
original detail. Missing ComfyUI/provider adapter -> NOT GENERATED.

## 2026-10-21 amendment — ChatGPT draws only AFTER the SpriteForge briefing

**Natural-language trigger in this game:** the user says
`게임에 적용할 애니메이션 시트 만들자`, `애니메이션 시트 만들자`,
`스프라이트 애니메이션 제작하자`, or any equivalent intent to make a new
game animation sprite sheet. This applies equally when **ChatGPT itself** will
draw with its own image generator; no external provider is required merely
to get the briefing.

Before a single art/image generation call:
1. Resolve the approved reference, character, and ONE action from the current
   project context; only ask for truly missing information.
2. Run `python scripts/spriteforge_assistant_brief_v3.py --reference
   <approved.png> --character <character> --action <one_action> --out
   <qa_dir>`; for a failed motion retry, pass `--job <retry_job.json>`
   instead. The tool prints the latest Korean briefing and records
   `assistant_preflight.json`. **Read it before art generation.**
3. Give the drawing tool ALL source-specific requirements from the briefing.
   Exactly one transparent 4×2 transparent PNG sheet per
   motion, 8 unique full-body poses, no clipped body or neighbor-owned
   anatomy. No combined multi-motion boards; no separate source pose files.
4. Run cutting and visual QC; on failure re-brief (including specific earlier
   faults) and retry this ONE animation automatically; inspect the 8-pose GIF
   before marking the art ready for production.

For directly invoked ChatGPT image generation, the model reads a printed
briefing but **does not have a signed provider handshake**: the assistant must
not claim an automated image-provider acknowledgement. For a connected
ComfyUI/provider adapter, the cryptographic acknowledgement remains
mandatory. This policy cannot by itself force ChatGPT UI to execute arbitrary
repository scripts; agents working in this repo must execute this
pre-generation step in their normal tool workflow. Never claim a drawing
or code integration occurred if it has not.
