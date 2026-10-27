#!/usr/bin/env python3
"""SpriteForge V3: never lose any of eight frame slots during art review.

This is an *additional*, non-destructive review path, not an override for the
production V6 silhouette-ownership release gate. Failed ownership produces
8 provisional cells + the untouched source + warnings; it never erases a
source image, invents anatomy, or declares damaged art production-ready.
"""
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path
from PIL import Image

ACTIONS = ("idle", "walk", "slash", "sweep", "thrust", "heavy",
           "guard", "hit", "death")


def extract_review(source: Path, destination: Path, action: str) -> dict:
    source = Path(source)
    destination = Path(destination)
    if not source.is_file():
        raise FileNotFoundError(source)
    if action not in ACTIONS:
        raise ValueError("UNKNOWN_ACTION")
    with Image.open(source) as original:
        if original.mode != "RGBA":
            raise ValueError("SOURCE_MUST_HAVE_ALPHA")
        if original.width < 4 or original.height < 2:
            raise ValueError("INVALID_SOURCE_DIMENSIONS")
        image = original.copy()
    destination.mkdir(parents=True, exist_ok=True)
    # Retain the original pixel-for-pixel, including antialias fringes.
    shutil.copyfile(source, destination / "original_source.png")
    pad_w = (-image.width) % 4
    pad_h = (-image.height) % 2
    if pad_w or pad_h:
        padded = Image.new("RGBA", (image.width + pad_w, image.height + pad_h))
        padded.alpha_composite(image)
        image = padded
    image.save(destination / "source_grid_padded.png")
    warnings = []
    if pad_w or pad_h:
        warnings.append("TRANSPARENT_PADDING_ONLY_NO_CROP")
    method = "V6_CONNECTED_MASK"
    try:
        from spriteforge_connected_mask_v6 import extract_owned_frames
        frames, evidence = extract_owned_frames(image)
        if len(frames) != 8:
            raise ValueError("EIGHT_FRAMES_REQUIRED")
    except (ValueError, ImportError) as exc:
        # The fallback does NOT claim to solve ownership; adjacent parts may
        # appear in a preview. Source pixels stay in original_source.png.
        # Never silently discard an action just because it needs manual repair.
        method = "UNREVIEWED_GRID_PREVIEW_ONLY"
        evidence = {"error": str(exc), "manualOwnershipReviewRequired": True}
        warnings.append("CONNECTED_OWNERSHIP_NOT_PROVEN")
        cw, ch = image.width // 4, image.height // 2
        frames = [image.crop((i % 4 * cw, i // 4 * ch,
                              (i % 4 + 1) * cw, (i // 4 + 1) * ch))
                  for i in range(8)]
    records = []
    for i, frame in enumerate(frames, 1):
        alpha_box = frame.getchannel("A").getbbox()
        flags = list(warnings)
        status = "OK" if method == "V6_CONNECTED_MASK" else "WARN"
        if alpha_box is None:
            status = "FIX_LATER"
            flags.append("EMPTY_SOURCE_FRAME")
        elif min(alpha_box[0], alpha_box[1],
                 frame.width - alpha_box[2],
                 frame.height - alpha_box[3]) <= 1:
            status = "WARN"
            flags.append("TOUCHES_PREVIEW_FRAME_EDGE")
        filename = f"{action}_{i:02d}.png"
        frame.save(destination / filename)
        records.append({"frame": i, "file": filename, "status": status,
                        "warnings": sorted(set(flags)), "alphaBBox": alpha_box})
    assert len(records) == 8, "FRAME_LOSS_NOT_ALLOWED"
    report = {
        "action": action, "source": source.name,
        "framesPreserved": 8, "frameDeletionAllowed": False,
        "outputPurpose": "QA_PREVIEW_ONLY",
        "productionApproved": False, "releaseAuthorized": False,
        "extractionMethod": method, "ownership": evidence,
        "frames": records,
    }
    (destination / "qa.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8")
    return report


def review_directory(source: Path, out: Path) -> dict:
    source, out = Path(source), Path(out)
    out.mkdir(parents=True, exist_ok=True)
    records = {}
    for action in ACTIONS:
        path = source / (action + ".png")
        if path.is_file():
            records[action] = extract_review(path, out / action, action)
    if not records:
        raise ValueError("NO_ACTION_SHEETS_FOUND")
    manifest = {
        "format": "spriteforge-v3-preserve-eight-review",
        "frameCountPerAction": 8, "totalFrames": len(records) * 8,
        "releaseAuthorized": False, "actions": records,
    }
    (out / "review_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8")
    return manifest


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--source", type=Path, required=True)
    p.add_argument("--out", type=Path, required=True)
    p.add_argument("--action", choices=ACTIONS)
    opts = p.parse_args()
    report = (extract_review(opts.source, opts.out, opts.action)
              if opts.action else review_directory(opts.source, opts.out))
    print(json.dumps({
        "framesPreserved": report.get("framesPreserved", report.get("totalFrames")),
        "productionApproved": False, "releaseAuthorized": False,
    }, ensure_ascii=False))
