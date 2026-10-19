# Perfect parry — REPVLSIO (attack reversal)

**Intent:** A parry is not merely a blocked hit. The winner steals the momentum of a committed strike; the loser is denied their attack, weapon line and balance. Both roles should remain readable even without words.

## Three beats (real presentation time)

1. **Interruption, 0–90 ms.** Cancel pending illustrated offensive trails attached to the defeated attacker; one silver painted parry spark at actual shield/weapon contact (about 338 world px authored before global VFX scale). Sharp metal attack, immediate .145 s cinematic hitstop. The frozen strike must **not** continue through the shield.
2. **Reversal, 55–340 ms.** Defender's *guard_painted* 12-frame shield crescent expands into the attacker with a short planted-foot brace/forward torso push. Painted light is pale gold/silver, never a circular explosion, and stays attached to the winner's live sprite transform.
3. **Failure and aftermath, 110–740 ms.** Attacker leans / skids back, the previous attack pose is interrupted by the hit pose, and a dim red *dash_painted* horizontal momentum streak trails **behind** the loser. Opposed Roman identifiers: warm-gold **CONTRA!** on winner, iron-red **FRVSTRA!** on loser. Damage text belongs to loser, not defender.

FX source reuse: the three beats use existing illustrated atlases while the character sprite art is kept intact. This is a code-based first visual treatment, not a claim of newly commissioned illustration.

## Acceptance checks

- Original perfect-parry hit logic, damage, iframe duration, class differences and auto-play behavior must remain unchanged.
- A late pending slash/sweep/thrust/special/dash attached to the failed attacker is removed on contact.
- One world-anchored white/silver parry impact at the shield rim; not attached to recoiling striker.
- Exactly one gold/silver winning guard follow-through attached to defender.
- Exactly one muted red trailing backward motion accent on defeated attacker; both actors have independently timed recoil/bracing render transforms.
- Real-time VFX timing unaffected by slowed game time; reduced-motion and FX toggle retain existing user controls.
- No new procedural circles, electric geometry, duplicated parry flash, unstable sprite-cutting or continuous blinking.
