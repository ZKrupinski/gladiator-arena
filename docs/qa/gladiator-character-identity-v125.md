# Gladiator visual identity — v125 (2026-10-28)

## Confirmed root cause and fix

The shared duel renderer incorrectly used assignment instead of strict equality:

```js
if(f.championVariant=CHAMPION_MURMILLO_VARIANT||...)
```

Every duel fighter was mutated into the same red-crested Murmillo variant on draw.
The production `public/index.html` now uses strict equality on each variant,
without changing fighter identities, roster state, source sprites or combat math.

## QA evidence

- `tests/duel-character-identity-v125.cjs`: **PASS**, ten appearance routes.
- `scripts/qa_duel_character_identity_browser.cjs`: **PASS** in real Chromium,
  selected Murmillo, Thraex and Retiarius each produced different canvas
  pixel hashes. The 1v2 lineup retained its selected Thraex.
- GitHub Actions run: https://github.com/ZKrupinski/gladiator-arena/actions/runs/40677505455

## Release status

The trusted v125 uploader committed `public/index.html` to `main`, SHA256
`2999a6630a21e3f3d5ae3f7980ef4f12684d8ab34c12a29c2ff14bf5f0314233`.
Uploader commit `0a54115ca86af6548c649cfd194642581827098d`.

**IMPORTANT:** Uploader run 40677639895 returned
`COMMITTED_DEPLOY_NOT_YET_VERIFIED` because Cloudflare served an older release
marker during its initial retry window. A successful Git commit is not proof
that production users received v125. This documentation commit may retrigger
the Pages Git integration. The independent recheck must report
`DEPLOYED_VERIFIED` before announcing live completion.
