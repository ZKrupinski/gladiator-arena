# GLADIATOR ARENA — assistant / coding-agent production instructions

## MANDATORY: SpriteForge V3 pre-art briefing for ALL artists and tools

This rule applies to **the ChatGPT assistant itself**, including when using
ChatGPT image generation, as well as to ComfyUI, online generators, humans,
coding agents, and all future image pipelines. SpriteForge does **not** have
to be the image generator; it is the production constitution and briefing gate.

### Conversational triggers

Any user instruction equivalent to **"게임에 적용할 애니메이션 시트 만들자"**,
"게임에 적용할 애니메이션 시트 제작", "애니메이션 시트 만들어",
"스프라이트 시트 만들자", or a request to newly draw/recreate an
animation sprite sheet for the game, MUST trigger this procedure **before**
you call any image generation or manually compose any sprite.

Do not require the user to explicitly say "SpriteForge"; the game-animation
sheet intent is enough. Applies equally to follow-up prompts like "다음
동작 만들어", preserving known subject/action/reference details.

### The order is not optional

1. Identify the **approved character reference** and **exactly one action**.
   Inspect the repository/project approved references first. Do not invent a
   reference or an action. Only ask for a genuinely missing prerequisite.
2. BEFORE any drawing tool call, obtain SpriteForge V3's latest job-specific
   Korean briefing by running:
   ```bash
   python scripts/spriteforge_assistant_brief_v3.py \
     --reference /path/to/approved_reference.png \
     --character wolf --action walk \
     --out /tmp/spriteforge/wolf-walk
   ```
   For subsequent retries pass `--job /path/to/retry_generation_job.json`
   instead. **Actually read the printed briefing** and its previous failures.
3. Recap the key restrictions and apply them to the image-generation prompt.
   Use the exact source character, **ONE motion, exactly EIGHT distinct frames
   in ONE single transparent native-resolution 4×2 sheet**. Distinct PNG
   frames are an OUTPUT of extraction, never the generation input. Native
   cell resolution scales with the approved reference, with 768px minimum.
   Preserve detail, proportions, equipment, foot anchors and safe gutters.
   A neighbor frame's head/limb/tail/torso is foreign regardless of size.
   Never clip a valid part of the current frame.
4. For ChatGPT ImageGen or any tool without a trusted provider adapter,
   perform this human/assistant briefing explicitly **before** image
   generation. The image-generation tool is not connected to the adapter and
   cannot provide a machine-signed acknowledgement; do NOT pretend it did.
   Nevertheless the tool's latest brief is mandatory input to the artist.
5. After generation, verify source pixels and run SpriteForge V3 sheet
   inspections, cutting QA, eight-frame animation preview and compare against
   the approved design. Fix diagnosed issues and regenerate just the failing
   action automatically, with a **fresh briefing on each retry**. Do not
   declare success merely because the image tool returned a picture.
6. Production game integration only after all frames and playback are
   validated, preserving the previous working assets during review. If
   source access, generator connection, or identity reference is genuinely
   missing, state the precise blocker instead of claiming a completed game
   deployment.

Never skip a tool briefing because you believe you remember the rules.
Brief every time because **the policy and failed-frame history can change**.
