# GLADIATOR ARENA — assistant / coding-agent production instructions

## Startup protocol for resumed Chat / Work development sessions (2026-10-25)

The user expects existing game-development connectors and release tools to be
**rediscovered and used automatically** at the start of each resumed session,
rather than being asked to reconnect tools that are already available.

1. Identify the game/project from the current conversation and project history.
   For this game, immediately inspect `ZKrupinski/gladiator-arena` on `main`,
   recent commits, `AGENTS.md`, uploader docs and open QA failures. Do not ask
   the user to repeat a known repository, asset path, deployment URL or version.
2. Discover **currently available** GitHub, Google Drive, image and file tools
   before claiming that repository writes or uploads are impossible. Use the
   connected GitHub integration for code reads/writes when authorized; use
   the configured project uploader or approved GitHub Actions upload request
   protocol for supported binary assets. Do not request a new personal access
   token if the connected integration already has sufficient permission.
3. For user-approved changes, use **inspect GitHub main → edit real project
   files → QA → GitHub commit/upload → report SHA and tests**. On 2026-10-28
   the user removed Cloudflare from the factory. Do NOT trigger, poll, wait
   for or require Cloudflare deployment/live-file validation. GitHub source
   completion is not evidence of playable web hosting.
4. A new Chat session **cannot itself grant, reconnect, authorize or persist**
   plugin access. Never represent account-level OAuth activation, tool
   availability in another session, or future background execution as
   guaranteed. If an actual connector is missing/expired, identify the exact
   unavailable capability and only request user reauthorization when needed.
5. Never claim "no GitHub access" based solely on assumptions or earlier
   failures: attempt the available connector first. Never store tokens,
   credentials or sensitive connection strings in repository files.
6. Applies to this repository. For other games, identify their correct
   project/repository rather than blindly reusing Spartacus deployment paths.

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
   image dimensions and character size have NO minimum; maintain valid 4x2 structure.
   Preserve detail, proportions, equipment, foot anchors and safe gutters.
   A neighbor frame's head/limb/tail/torso is foreign regardless of size.
   Never clip a valid part of the current frame.
4. For ChatGPT ImageGen or any tool without a trusted provider adapter,
   perform this human/assistant briefing explicitly **before** image
   generation. The image-generation tool is not connected to the adapter and
   cannot provide a machine-signed acknowledgement; do NOT pretend it did.
   Nevertheless the tool's latest brief is mandatory input to the artist.
5. **Extraction V6 immutable rule:** The 4×2 nominal rectangle is ONLY a
   pose-ID seed. Run `scripts/spriteforge_connected_mask_v6.py` on the WHOLE
   source alpha mask first. Export each uniquely connected pose INCLUDING its
   legitimate tail/weapon crossing a rectangle. Never use a hard rectangle
   as a final cutting mask or choose the largest blob then erase the rest.
   If two core poses are fused or separated anatomy cannot be attributed,
   mark BLOCKED and retry the same action. This applies to both gladiators
   and beasts, at any source resolution. Leave approved production art intact.
6. After generation, verify source pixels and run SpriteForge V3 sheet
   inspections, cutting QA, eight-frame animation preview and compare against
   the approved design. Fix diagnosed issues and regenerate just the failing
   action automatically, with a **fresh briefing on each retry**. Do not
   declare success merely because the image tool returned a picture.
7. Production game integration only after all frames and playback are
   validated, preserving the previous working assets during review. If
   source access, generator connection, or identity reference is genuinely
   missing, state the precise blocker instead of claiming a completed game
   deployment.

Never skip a tool briefing because you believe you remember the rules.
Brief every time because **the policy and failed-frame history can change**.

## Spartacus gameplay update / asset upload / live publish — mandatory one-stop tool

When the user says **"게임에 적용해"**, **"적용하고 배포해"**,
**"버전 수정해"**, **"업로더 이용해"**, or equivalent for this game:

* **Never ask again for the repository address or game assets path.**
  Repo: `ZKrupinski/gladiator-arena`; branch: `main`; game root:
  `public/`. The former Cloudflare site is not a release gate. GitHub Pages
  is currently disabled; never invent a working GitHub Pages URL.
* Use `scripts/spartacus_uploader.py` and the docs at
  `docs/spartacus-uploader.md` as the standard release protocol.
  Get the current `main` code SHA using the connected GitHub tool first.
* Code changes are made in GitHub and tested. Image files in an environment
  with authenticated network access can use
  `python scripts/spartacus_uploader.py publish --input DIR --mapping MAP.json --confirm`
  for an atomic direct upload. When using GitHub text-only connector, create
  a single trusted upload request at `ops/uploader-requests/<id>.json`;
  the GitHub Actions release uploader handles approved HTTPS asset URLs.
  Actual binary bytes MUST be accessible to the runner; never invent links.
* For the nine action V3 wolf atlas, if all source sheets pass the production
  native-resolution and ownership checks, use
  `scripts/spartacus_wolf_import.py`. It saves to
  `public/assets/beasts/wolf-v3/` and existing `arena-beasts.js`
  automatically loads its manifest. **Do not bypass SpriteForge briefing,
  art review, frame ownership, cut/ground alignment, or visual integrity gates.**
* Prefer update `main` → QA → atomic GitHub commit → report commit link,
  checksums and test results. The factory has NO Cloudflare stage, no site
  polling and no external verification. GitHub repo links are source links,
  not proof of a running hosted game. For a playable link, separately
  establish a hosting provider if explicitly requested.
* This rule stays game-specific. Do not transfer the repo URL/branch to
  another game automatically.

