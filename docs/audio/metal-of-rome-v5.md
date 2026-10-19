# Metal of Rome v5 — Stadium-scale crowd and heavy cinematic combat

Prior feedback: the v4 'crowd' was a staged family protest recording by StarNinjas, with distracting individual close-up calls, not thousands of sports spectators. Removed entirely.

**New material (CC0 source):**
- Real football spectators in Uganda during a stadium match, original on-location audio (31-second video; audio remixed): https://commons.wikimedia.org/wiki/File:Spectators_during_a_football_match.webm
- Stadium spectators during the 2025 Bika football finals (30-second live field recording video): https://commons.wikimedia.org/wiki/File:2025_Bika_football_finals.webm
- 37 hits/punches CC0 human physical recordings: https://opengameart.org/node/2558
- 10 CC0 padded shield/cardboard impacts: https://opengameart.org/content/10-impactshield-blocks
- 20 CC0 actual knife collisions: https://opengameart.org/content/20-sword-sound-effects-attacks-and-clashes
- Real low drums and struck iron from VSCO 2 CE: https://github.com/sgossner/VSCO-2-CE

**Sound construction:**
- Real football crowd audio becomes a continuous 33.49 s diffuse stereo bed, independent of 172 BPM war drums. Two distant, desynchronized layers, soft midrange to make individual nearby spoken phrases unintelligible, early-reflection delays to simulate a huge amphitheater, wide seating terraces.
- Two separate genuine group reaction moments selected based on rolling high crowd energy; no solo-person "yay!" recording and no speech synthesizer.
- Seven melee families rewritten: body 'thump' and shield 'crack' are two separate materials, reinforced by real recorded large bass drum/metal plate. Dry knife and iron edges remain brief. No long tonal 'ding' tails.
- In game, blade contact triggers music attenuation of -6dB or greater and even stronger crowd attenuation, restoring over 200–600ms. Large drum and stadium ambience sit behind unmasked combat signals. Synth fanfare remains permanently disabled. No changes to graphics/game mechanics.

**Quality QA:** real Chromium audio decoding for 5 stems and 28 triggered SFX; all revised durations verified; no oscillator fallback; game visuals CI independently checked.
