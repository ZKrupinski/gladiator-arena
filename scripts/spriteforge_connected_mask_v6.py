#!/usr/bin/env python3
"""SpriteForge V6: extract source-owned connected silhouettes BEFORE any crop.

The 4x2 grid is only a way to find the *core* of eight poses, NOT a guillotine.
Start from the FULL source alpha map, attach each connected alpha island to
its unique frame core, and copy the complete island (including legal overflow
across the nominal rectangle) to a padded, shared canvas.

Uncertain disconnected equipment, glued poses, or any missing body BLOCK the
release instead of being guessed away. No minimum pixel dimensions.
"""
from __future__ import annotations
import numpy as np
from PIL import Image
from scipy import ndimage

ALPHA_THRESHOLD = 32
EIGHT_NEIGHBORS = np.ones((3, 3), dtype=np.uint8)


class OwnershipError(ValueError):
    pass


def _cell_bounds(i, cw, ch):
    x = (i % 4) * cw
    y = (i // 4) * ch
    return (x, y, x + cw, y + ch)


def extract_owned_frames(source, *, alpha_threshold=ALPHA_THRESHOLD):
    """Return (eight RGBA images, machine-readable ownership report).

    No direct sheet.crop(cell) is used as the extraction mechanism. A
    rectangular cell supplies a core seed only; the connected alpha component
    owns every one of its pixels even when it overhangs a neighboring cell.

    Frame identity is fail-closed, not determined by 'largest blob wins':
    * A component owning two frame cores == merged drawings, regenerate.
    * Two components competing for one core == possible detached/foreign limb,
      require provenance/manual review; do not erase either.
    * A component owning no core == orphan; fail even if just a tiny piece.
    """
    img = source.convert("RGBA")
    w, h = img.size
    if min(w, h) <= 0 or w % 4 or h % 2:
        raise OwnershipError("INVALID_4x2_SHEET_GRID")
    cw, ch = w // 4, h // 2
    rgba = np.asarray(img)
    alpha = rgba[:, :, 3]
    foreground = alpha >= alpha_threshold
    labels, number = ndimage.label(foreground, structure=EIGHT_NEIGHBORS)
    if number == 0:
        raise OwnershipError("MISSING_OR_MERGED_FRAME_SILHOUETTE")
    counts = np.bincount(labels.ravel(), minlength=number + 1)
    counts[0] = 0
    core_claims = {i: [] for i in range(8)}
    identity = {}
    # Each frame uses a central seed, but do NOT demand that *all* of the
    # silhouette fit inside it. Small frames are equally valid.
    for component in range(1, number + 1):
        region = labels == component
        if not region.any():
            continue
        owners = []
        for i in range(8):
            x0, y0, x1, y1 = _cell_bounds(i, cw, ch)
            # Local inner 70% = initial identity cue, not final crop boundary.
            ix0, ix1 = x0 + cw * 15 // 100, x1 - cw * 15 // 100
            iy0, iy1 = y0 + ch * 15 // 100, y1 - ch * 15 // 100
            # Very small cells must still have a nonempty seed.
            ix1, iy1 = max(ix0 + 1, ix1), max(iy0 + 1, iy1)
            pixels = int(np.count_nonzero(region[iy0:iy1, ix0:ix1]))
            if pixels:
                owners.append((i, pixels))
        if len(owners) >= 2:
            # Absolutely never disconnect a merged silhouette at the grid seam.
            raise OwnershipError(
                "FUSED_NEIGHBOR_POSES_AMBIGUOUS_OWNERSHIP: "
                f"component={component} seeded_by={[i + 1 for i, _ in owners]}")
        if not owners:
            yy, xx = np.nonzero(region)
            # An orphan may be another frame's finger, a sword or a tail.
            # Geometry cannot prove intent; NEVER discard based on area.
            raise OwnershipError(
                "DETACHED_OR_FOREIGN_PART_OWNERSHIP_UNPROVEN: "
                f"component={component} pixels={int(counts[component])} "
                f"at={int(xx.min())},{int(yy.min())}")
        owner = owners[0][0]
        core_claims[owner].append(component)
        identity[component] = owner
    for index, components in core_claims.items():
        if not components:
            raise OwnershipError(f"NO_OWNED_CHARACTER_IN_FRAME:{index + 1}")
        if len(components) != 1:
            raise OwnershipError(
                "MULTIPLE_BODY_COMPONENTS_WITH_SAME_CORE_REQUIRE_REVIEW:"
                f"frame={index + 1} components={components}")

    max_left = max_right = max_top = max_bottom = 0
    items = []
    for i in range(8):
        component = core_claims[i][0]
        yy, xx = np.where(labels == component)
        x0, y0, x1, y1 = int(xx.min()), int(yy.min()), int(xx.max()) + 1, int(yy.max()) + 1
        if x0 == 0 or y0 == 0 or x1 == w or y1 == h:
            raise OwnershipError(f"SOURCE_SILHOUETTE_CLIPPED_AT_SHEET_EDGE:{i+1}")
        cell_left, cell_top, _, _ = _cell_bounds(i, cw, ch)
        max_left = max(max_left, cell_left - x0)
        max_right = max(max_right, x1 - (cell_left + cw))
        max_top = max(max_top, cell_top - y0)
        max_bottom = max(max_bottom, y1 - (cell_top + ch))
        items.append((component, (x0, y0, x1, y1), (cell_left, cell_top)))

    # Keep the *same* origin and canvas for all frames. This is not a per-pose
    # resize or bbox-centered crop, and cannot cause scale popping.
    gutter = max(2, min(cw, ch) // 25)
    pad_l = max_left + gutter
    pad_r = max_right + gutter
    pad_t = max_top + gutter
    pad_b = max_bottom + gutter
    out_w, out_h = cw + pad_l + pad_r, ch + pad_t + pad_b
    frames, details = [], []
    for i, (component, rect, (cell_x, cell_y)) in enumerate(items):
        # A 1px alpha halo restores valid antialiased edges without extending
        # the actor to an unrelated full-color neighbor.
        pixels = labels == component
        halo = ndimage.binary_dilation(pixels, structure=EIGHT_NEIGHBORS) & (labels == 0) & (alpha > 0)
        owned = pixels | halo
        yy, xx = np.where(owned)
        x0, y0, x1, y1 = int(xx.min()), int(yy.min()), int(xx.max()) + 1, int(yy.max()) + 1
        payload = np.asarray(img.crop((x0, y0, x1, y1))).copy()
        payload[:, :, 3] = np.where(owned[y0:y1, x0:x1], payload[:, :, 3], 0)
        payload[payload[:, :, 3] == 0, :3] = 0
        dx, dy = pad_l + x0 - cell_x, pad_t + y0 - cell_y
        if min(dx, dy, out_w - dx - payload.shape[1], out_h - dy - payload.shape[0]) < 0:
            raise OwnershipError(f"OWNED_MASK_OUTPUT_OVERFLOW:{i+1}")
        frame = Image.new("RGBA", (out_w, out_h))
        frame.alpha_composite(Image.fromarray(payload, "RGBA"), (dx, dy))
        frames.append(frame)
        details.append({
            "index": i + 1, "sourceConnectedComponent": component,
            "ownedPixels": int(counts[component]),
            "sourceBoundingBox": [x0, y0, x1, y1],
            "crossesNominalCell": bool(
                x0 < cell_x or y0 < cell_y or x1 > cell_x + cw or y1 > cell_y + ch),
            "outputOrigin": [dx, dy],
        })
    return frames, {
        "extractor": "CONNECTED_ALPHA_FULL_SHEET_UNIQUE_CORE_V6",
        "method": "complete_unique_connected_component_not_rectangle_crop",
        "sourceSize": [w, h],
        "nominalCell": [cw, ch],
        "sharedOutputSize": [out_w, out_h],
        "frameOwners": details,
        "orphanComponentsDiscarded": 0,
        "requiresVisualReview": True,
    }
