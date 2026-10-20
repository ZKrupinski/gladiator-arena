# SpriteForge Agent v1 · GLADIATOR
This is the **agent-facing tool**, not the optional user-facing /sprite-forge.html page.

Run in a Python environment with Pillow, NumPy and SciPy:
\`\`\`sh
pip install pillow numpy scipy
python scripts/spriteforge_agent.py --manifest /path/to/wolf_sources.json --out /tmp/spriteforge-wolf --allow-partial
\`\`\`
Example source manifest (paths relative to the manifest):
\`\`\`json
{"character":"wolf","actions":{"idle":"wolf_idle.png","walk":"wolf_walk.png","attack_bite":"wolf_bite.png"}}
\`\`\`

Input: **ONE 4×2 transparent high-resolution PNG per action**, or 8 independent PNG frame paths as a JSON list. Never feed a mixed all-action board.

Outputs: independent aligned 960×720 PNGs, 4×2 internal QA contact images, animation GIF previews, machine-readable qa.json with missing actions and faults. Used by assistant/CI autonomously, not delegated to the user.

Auto-blocks near-border cropping, missing sprites, exact duplicated frames, and multiple large transparency islands (conservative heuristic). Uses constant per-action scale and fixed foot anchor, with no body auto-rescale per frame. Never fills in missing poses or claims 2x upscale is new high-resolution drawing.

**Safety:** Source files remain untouched. Automatic pass is *not* final art approval. Assistant inspects the previews and only after all actions are valid may it commit a new approved game manifest; do not switch current production or delete existing sprites while action coverage is incomplete.
