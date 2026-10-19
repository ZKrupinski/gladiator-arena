# METAL OF ROME — V2, real sampled sound

**Art direction:** remove all synthesized brass/piano/keyboard timbres and pitched sword-hit bells; keep hard-playing metal feel with actual instrument recordings.

Sources (all explicitly CC0 public domain):
- Real French horn, trumpet, tuba, bass drum, snare, cymbals, log drum, anvil, brake drum: **VSCO 2 Community Edition** / Versilian Studios / sgossner. https://github.com/sgossner/VSCO-2-CE and https://versilian-studios.com/vsco-community/
- **Actual overdriven electric Fender guitar**, direct recorded notes from the FreePats CC0 FSBS distorted electric-guitar bank. https://github.com/freepats/electric-guitar-FSBS-dist1 and https://freepats.zenvoid.org/ElectricGuitar/distorted-electric-guitar.html
- **Actual knife-on-knife clashes and weapon whooshes**: StarNinjas “20 Sword Sound Effects (Attacks and Clashes)”, explicitly CC0, recorded using two knives; https://opengameart.org/content/20-sword-sound-effects-attacks-and-clashes
- If OpenGameArt file server is unavailable, substitute CC0 recordings of hammered anvil, brake drum and bass-drum friction from VSCO. These are genuine recorded sources, never synthesizers.

Rendering:
- 172 BPM, four synchronized recorded-instrument stems and real-room acoustic ambience.
- Sword impact SFX are brief **~100–160ms dry recorded clashes** plus close-recorded bass-drum body; acoustic metallic tails cut. No pitched harmonic sine partials, no resonant reverb or high glassy “ting~”.
- Switch off old WebAudio oscillators completely even during first-load asset fetching, preventing a synthetic fallback “ding”.
- Sound files generated via `python scripts/remaster_rome_audio_real.py` and published on GitHub Actions. Source rights remain CC0. Recorded assets from third parties are processed and remixed into original compositions.
- Music composed with a genuine orchestral horn and trumpet rather than Roman-period cornu performances. Cornu-like arrangement is a creative interpretation, **not** a claim of genuine Roman instrument recording.
