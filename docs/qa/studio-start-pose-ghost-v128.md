# v128 Motion studio preview + first-frame ghost

The browser-based animation correction studio at
`public/tools/practice-scale-calibrator.html` now provides:

- A slightly larger **preview-only** sprite zoom (0.52 → 0.60).
  Authored character dimensions, per-pose transforms and actual game scale
  are unchanged.
- A default-on **13% alpha first-frame silhouette** using the selected
  character's current action frame 0. It is drawn *behind* the current
  animated character, at the original motion position at t=0.
- A toggle beside Play, labeled "시작 포즈 잔상 ON / OFF".
  The underlying frame source remains unmodified.
- v127 X/Y atomic key captures and the v126 clickable timeline markers are
  retained.

Real browser QA **PASS** including actual canvas drawImage at
`globalAlpha=.13`, detected changed pixels with the ghost toggle and
no JavaScript errors, plus X/Y single-axis autosave and timeline clicks:
https://github.com/ZKrupinski/gladiator-arena/actions/runs/40687495558

Uploader release ID:
`spartacus-studio-start-pose-ghost-v128-20261028`.
Source HTML SHA256:
`87cdd12b75035d6b3f8d83ca7f0fd0c424235ceaca0230e7e43926ffaea561f7`.

Cloudflare Git integration may lag the GitHub uploader commit; the independent
verification workflow checks that the live release marker and the actual
served HTML match SHA256 before declaring `DEPLOYED_VERIFIED`.
