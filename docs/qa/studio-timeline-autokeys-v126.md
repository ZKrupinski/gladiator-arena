# Sprite studio left-timeline auto-key / marker synchronization v126

The existing studio `public/tools/practice-scale-calibrator.html` now
synchronizes timeline progress and the right motion key editor.

## User behaviors

- Scrubbing to a new moment previews interpolated X/Y, without modifying any existing keys.
- Adjusting the motion X or Y range or numeric input writes a key at that
  exact progress (0.1% clock). If both axes are changed at the same clock time,
  exactly one key is created and the other axis remains intact.
- Small diamond markers appear immediately beneath the left timeline slider,
  positioned at each persisted motion key time.
- Clicking any marker pauses playback there and updates left timeline time,
  right selected key, key time, X/Y slider and numeric values.
- Per-pose persistence still uses the existing PracticeVisualProfiles
  `cleanMotion` and `write` APIs; no art / sprites / physics were modified.

## Verification

Real Chromium regression in `scripts/qa_studio_motion_scrub_browser.cjs`
verified these operations, keyboard/numeric inputs, unchanged pre-existing
keys and absence of JavaScript errors. PASS:
https://github.com/ZKrupinski/gladiator-arena/actions/runs/40685734837

Uploader commit: `cebadb4b4ba0a04230c0eb255a1cf1e8a9581870`.
Release ID `spartacus-studio-timeline-autokeys-v126-20261028`.
Expected SHA256 of `public/tools/practice-scale-calibrator.html`:
`aefe6788b8d8fc52340ec97b78090d81ed5848ecedc6c2111fa3a56c0bef2318`.

The initial uploader failed live verification with
`DEPLOYMENT_UNVERIFIED: CLOUDFLARE_OLD_DEPLOYMENT`.
A commit on main may trigger the delayed Cloudflare Pages Git integration again;
the separate live verification workflow must return `DEPLOYED_VERIFIED`
before production deployment is reported as complete.
