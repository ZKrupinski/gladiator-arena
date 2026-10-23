# Responsive UI QA — 2026-10-23

Base: 68105fde3ddc5f9cb0bc1e63964da0f43108a766 (Chat V17 handoff).

## Changes
- Remove inherited market-shell padding from full-height roster/draft screens.
- Use document scrolling for short screens instead of clipping a 480px minimum-height panel.
- Two-column phone fighter cards; prevent flex shrink from crushing name/class rows.
- Keep mode selectors left-aligned and horizontally reachable on phones.
- Keep beast selection side by side; move arrows below portraits on narrow screens.
- Hide the duplicate legacy navigation above the beast page, retaining its own back control.
- Extend existing unscaled armory portrait layout through 900px portrait tablets.
- Contain long equipment copy and return-button labels; reserve safe-area space.
- Result buttons remain outside the approved artwork, with bounded readable text.

## Verification
Cloud-browser QA uses a same-origin iframe with actual game scripts and assets;
no mock rendering. Fixtures create six gladiators in the isolated QA browser.
320x568, 390x844, 568x320, 844x390, 768x1024, 1024x768,
1920x1080, 2560x1440: draft, beasts, gear, roster (32 combinations).
Checks measure panel geometry and visible control/title horizontal overflow.
Scrollable content may exceed viewport height deliberately.
Additional visual inspection: draft and beast selection on phones, result
artwork and action buttons at 320x568 and 568x320.

11 real-game functional checks passed: solo rematch; incomplete 2v2/3v3;
complete enemy-team counts; full-team replacement rematch; enemy same-row
layout; horizontal beast roster; one selected fighter; alpha portrait drawing
and near-full-height content without edge clipping.

Inline script syntax, uploader unit tests (14), matchmaking reversal balance pass.
The older qa_squad_modes wrapper is not a pass: its VM fixture lacks crowdEvent
and throws before finishing. The browser checks above run the real application.
No claim of exhaustive device/browser coverage: iOS Safari, OS text scaling,
physical cutouts and the fixed-coordinate illustrated training/market scenes
need separate physical-device validation. This release does not replace art.

## Reproduce
Copy tests/responsive-qa.html temporarily to public/responsive-qa.html and serve
public. Open /responsive-qa.html in a clean QA browser. Use Audit all and Verify
flow; Show selects individual size/scene combinations for screenshots.
The QA harness is not included in the production public directory.
