#!/usr/bin/env python3
"""SpriteForge V3 optional 8/8 preservation preview.

Keeps original RGBA artwork, exports all eight slots despite QA warnings,
never treats preview extraction as approved production artwork, and never
silently removes detached pixels. Strict V6 extraction is attempted first.
"""
from __future__ import annotations
import argparse
import json
import shutil
from pathlib import Path
from PIL import Image

ACTIONS = ('idle', 'walk', 'slash', 'sweep', 'thrust', 'heavy', 'guard', 'hit', 'death')


def extract_one(source: Path, output: Path, action: str) -> dict:
    original = Image.open(source)
    if original.mode != 'RGBA':
        raise ValueError(f'{action}: SOURCE_NOT_RGBA')
    if original.width < 4 or original.height < 2 or original.width % 4:
        raise ValueError(f'{action}: INVALID_4X2_GRID')
    output.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, output / 'source_original.png')
    image = original
    warnings = []
    # Approved user artwork may be odd-height (1672x941).
    # Pad with transparent pixels only: never crop or resample source artwork.
    pad_w = (-image.width) % 4
    pad_h = (-image.height) % 2
    if pad_w or pad_h:
        padded = Image.new('RGBA', (image.width + pad_w, image.height + pad_h))
        padded.paste(image, (0, 0))
        image = padded
        warnings.append('TRANSPARENT_GRID_PADDING')
    image.save(output / 'source_grid_padded.png')
    # Strict production ownership first. An ambiguous sheet becomes an 8/8
    # provisional preview with original source retained; never delete a pose.
    method = 'V6_CONNECTED_OWNERSHIP'
    try:
        from spriteforge_connected_mask_v6 import extract_owned_frames
        frames, evidence = extract_owned_frames(image)
        if len(frames) != 8:
            raise ValueError('V6_RETURNED_NOT_EIGHT_FRAMES')
    except (ImportError, ValueError) as error:
        method = 'REVIEW_GRID_FALLBACK_NOT_FOR_PRODUCTION'
        evidence = {'reason': str(error), 'manualOwnershipReviewRequired': True}
        warnings.append('FRAME_OWNERSHIP_REQUIRES_REVIEW')
        cw, ch = image.width // 4, image.height // 2
        frames = [image.crop(((i % 4) * cw, (i // 4) * ch,
                              (i % 4 + 1) * cw, (i // 4 + 1) * ch))
                  for i in range(8)]
    records = []
    for i, frame in enumerate(frames, 1):
        alpha = frame.getchannel('A')
        bbox = alpha.getbbox()
        state = 'OK' if method == 'V6_CONNECTED_OWNERSHIP' else 'WARN'
        flags = list(warnings)
        if bbox is None:
            state = 'FIX_LATER'
            flags.append('EMPTY_FRAME_SOURCE_RETAINED')
        elif min(bbox[0], bbox[1], frame.width - bbox[2], frame.height - bbox[3]) <= 1:
            state = 'WARN'
            flags.append('SILHOUETTE_TOUCHES_CELL_EDGE')
        filename = f'{action}_{i:02d}.png'
        frame.save(output / filename)
        records.append({'index': i, 'file': filename, 'status': state,
                        'warnings': sorted(set(flags)), 'bbox': bbox})
    assert len(records) == 8
    report = {'action': action, 'source': source.name, 'framesPreserved': 8,
              'frameDeletionAllowed': False, 'outputPurpose': 'QA_PREVIEW_ONLY',
              'publishToProduction': False, 'method': method, 'evidence': evidence,
              'frames': records}
    (output / 'qa.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf8')
    return report


def run(source_dir: Path, output_dir: Path) -> dict:
    report = {'protocol': 'spriteforge-v3-preserve8-preview',
              'framesPerAction': 8, 'releaseAuthorized': False, 'actions': {}}
    for action in ACTIONS:
        source = source_dir / f'{action}.png'
        if source.exists():
            report['actions'][action] = extract_one(source, output_dir / action, action)
    if not report['actions']:
        raise ValueError('NO_MATCHING_ACTION_SHEETS')
    report['totalFrames'] = 8 * len(report['actions'])
    (output_dir / 'manifest.json').write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding='utf8')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    result = run(args.source, args.out)
    print(json.dumps({'actions': len(result['actions']),
                      'framesPreserved': result['totalFrames'],
                      'releaseAuthorized': False}, ensure_ascii=False))
