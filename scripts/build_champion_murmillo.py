#!/usr/bin/env python3
"""Champion Murmillo — edge-aware 4x2 sprite extraction with STABLE front-toe pivots.

Original sources remain untouched. No generated or resized art: RGBA pixels are
copied to independently padded 960x540 output. A narrow, connected blade/cape
extension can be reclaimed over a cell seam; neighbouring pose fragments are
discarded rather than copied indiscriminately.
"""
from __future__ import annotations
from pathlib import Path
from PIL import Image, ImageDraw
from scipy import ndimage
import numpy as np
import json

BASE = Path(__file__).resolve().parents[1] / "public/assets/combat/champion-murmillo"
SRC = BASE / "source"
DEST = BASE / "frames"
DEST.mkdir(parents=True, exist_ok=True)
ACTIONS = ("idle", "walk", "slash", "sweep", "thrust", "heavy", "guard", "hit", "death")
FPS = {"idle": 6, "walk": 10, "slash": 14, "sweep": 14, "thrust": 14, "heavy": 12, "guard": 7, "hit": 10, "death": 10}
W, H, CELL_W, CELL_H = 960, 540, 418, 470
PIVOT_X, CONTACT_X, CONTACT_Y = 480, 560, 512
ALPHA_THRESHOLD = 40
STRUCTURE = np.ones((3, 3), dtype=np.uint8)
SEAM_REACH = 115
report = {"version": 2, "processing": "connected-dominant-region+seam-recovery+front-toe-anchor",
          "source": "original 4x2 user artwork", "actions": {}, "borderWarnings": []}
manifest = {"version": 2, "character": "murmillo_champion_red",
            "name": "신규 챔피언 무르밀로", "cellWidth": CELL_W, "cellHeight": CELL_H,
            "canvas": {"width": W, "height": H, "transparent": True},
            "anchor": {"kind": "front-toe", "x": CONTACT_X, "y": CONTACT_Y,
                       "pivotX": PIVOT_X, "footY": CONTACT_Y},
            "fps": FPS, "actions": {}}
contact = Image.new("RGB", (8 * 234, len(ACTIONS) * 160), (27, 29, 35))
draw = ImageDraw.Draw(contact)

def runs(values):
    if not len(values):
        return []
    spans = []
    start = previous = int(values[0])
    for y in values[1:]:
        y = int(y)
        if y > previous + 1:
            spans.append((start, previous + 1))
            start = y
        previous = y
    spans.append((start, previous + 1))
    return spans

def extract(sheet, column, row):
    """Return one character with pixels in sheet coordinates and its foot anchor."""
    start_x, start_y = column * CELL_W, row * CELL_H
    rgba = np.asarray(sheet, dtype=np.uint8)
    alpha = rgba[start_y:start_y + CELL_H, start_x:start_x + CELL_W, 3]
    solid = alpha > ALPHA_THRESHOLD
    labels, total = ndimage.label(solid, structure=STRUCTURE)
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    if not total or not sizes.max():
        raise ValueError(f"Empty cell ({column},{row})")
    dominant = int(sizes.argmax())
    base = labels == dominant
    # Small highlights directly touching the primary silhouette may belong to
    # the figure, but large disconnected pieces from the next pose NEVER do.
    touching = ndimage.binary_dilation(base, iterations=3)
    for label_id in range(1, total + 1):
        if label_id != dominant and sizes[label_id] < sizes[dominant] * .05:
            candidate = labels == label_id
            if np.any(candidate & touching):
                base |= candidate
    cy, cx = np.where(base)
    ground = int(np.quantile(cy, .997))
    # Rightmost standing/toe contact is independent of swinging swords and cloak:
    # take only the foremost pixels near the feet of the dominant character.
    ground_mask = base & (np.arange(CELL_H)[:, None] >= ground - 25)
    sy, sx = np.where(ground_mask)
    if len(sx) < 15:
        raise ValueError(f"Insufficient toe pixels in cell ({column},{row})")
    contact_x = int(round(np.quantile(sx, .985)))
    contact_y = int(round(np.quantile(sy, .995)))
    # Bounding rectangle is expanded to incorporate thin weapon tips continuing
    # across a SHEET cell seam. Only a narrow component CONNECTED to the actor
    # at the seam can be borrowed, and it must not connect to the next figure.
    ext = {}
    for direction in (-1, 1):
        if (direction < 0 and column == 0) or (direction > 0 and column == 3):
            continue
        border = base[:, :3].any(axis=1) if direction < 0 else base[:, -3:].any(axis=1)
        for lo, hi in runs(np.where(border)[0]):
            if hi - lo > 34 or lo >= CELL_H - 37:
                continue
            y0 = max(0, lo - 16)
            y1 = min(CELL_H, hi + 16)
            if direction > 0:
                x0, x1 = start_x + CELL_W - 4, start_x + CELL_W + SEAM_REACH
            else:
                x0, x1 = start_x - SEAM_REACH, start_x + 4
            cut = rgba[start_y + y0:start_y + y1, x0:x1, 3] > ALPHA_THRESHOLD
            groups, _ = ndimage.label(cut, structure=STRUCTURE)
            seed = groups[(lo-y0):(hi-y0), :4] if direction > 0 else groups[(lo-y0):(hi-y0), -4:]
            connected = set(int(k) for k in np.unique(seed) if k)
            for k in connected:
                group = groups == k
                outside = group[:, 4:] if direction > 0 else group[:, :-4]
                area = int(outside.sum())
                # Large connected blocks are the neighbouring pose, not the sword.
                if area == 0 or area > 3500:
                    continue
                ys, xs = np.where(outside)
                for yy, xx in zip(ys, xs):
                    full_x = (x0 + 4 + int(xx) if direction > 0 else x0 + int(xx))
                    full_y = start_y + y0 + int(yy)
                    ext[(full_x, full_y)] = True
    # Reconstruct an RGBA tile using original source pixels, not interpolation.
    full = {(start_x + int(x), start_y + int(y)) for y,x in zip(*np.where(base))}
    full.update(ext)
    if not full:
        raise ValueError("Blank connected body")
    bx0 = min(x for x,y in full)
    bx1 = max(x for x,y in full)+1
    by0 = min(y for x,y in full)
    by1 = max(y for x,y in full)+1
    # Preserve the original antialiased contour within 2px of the chosen mask.
    keep_img = np.zeros((by1-by0, bx1-bx0), dtype=bool)
    for x,y in full:
        keep_img[y-by0,x-bx0] = True
    padded = ndimage.binary_dilation(keep_img, iterations=2)
    sub = np.array(sheet.crop((bx0,by0,bx1,by1)))
    sub[:,:,3] = np.where(padded,sub[:,:,3],0).astype(np.uint8)
    sub_img = Image.fromarray(sub,"RGBA")
    if not sub_img.getchannel("A").getbbox():
        raise ValueError("Empty alpha after segmentation")
    # The selected front standing toe is *the* placement reference for every
    # action and frame. We never re-centre each changing bounding rectangle.
    dx = CONTACT_X - (start_x + contact_x - bx0)
    dy = CONTACT_Y - (start_y + contact_y - by0)
    if dx < 12 or dy < 12 or dx+sub_img.width > W-12 or dy+sub_img.height > H-12:
        raise ValueError(f"No safe frame padding ({column},{row}): x={dx} y={dy} size={sub_img.size}")
    image = Image.new("RGBA",(W,H),(0,0,0,0))
    image.alpha_composite(sub_img,(dx,dy))
    if any((image.getchannel('A').getbbox()[i] <= 1 for i in (0,1))):
        raise ValueError("Crop touches export edge")
    removed = int(solid.sum()-base.sum())
    return image, {"toeSource": [int(contact_x),int(contact_y)],
                   "removedForeignPixels": removed, "recoveredSeamPixels": len(ext),
                   "sourceBBox": [int(bx0-start_x),int(by0-start_y),
                                  int(bx1-start_x),int(by1-start_y)],
                   "visualBBox": list(image.getchannel("A").getbbox())}

for action_no, action in enumerate(ACTIONS):
    sheet = Image.open(SRC / (action+".png")).convert("RGBA")
    if sheet.size != (1672,941):
        raise ValueError(f"Unexpected source image dimensions: {action} {sheet.size}")
    frames = []
    statistics = []
    for index in range(8):
        frame, info = extract(sheet, index%4, index//4)
        path = f"{action}_{index:02d}.webp"
        frame.save(DEST/path,format="WEBP",lossless=True,method=0)
        frames.append({"file":"frames/"+path,"pivotX":PIVOT_X,"footY":CONTACT_Y,
                       "width":W,"height":H,"sourceFrame":index,
                       "toeSource":info["toeSource"],"sourceBBox":info["sourceBBox"],
                       "recoveredSeamPixels":info["recoveredSeamPixels"]})
        statistics.append(info)
        preview = frame.copy()
        preview.thumbnail((222,126),Image.Resampling.LANCZOS)
        tile=Image.new("RGBA",(234,150),(27,29,35,255))
        tile.alpha_composite(preview,((234-preview.width)//2,(140-preview.height)//2))
        contact.paste(tile.convert("RGB"),(index*234,action_no*160))
        draw.text((index*234+9,action_no*160+143),f"{action} {index+1}",fill="#ffe4b1")
    report["actions"][action] = statistics
    manifest["actions"][action] = frames
(BASE/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(BASE/"qa-extraction.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
contact.save(BASE/"qa-contact.webp","WEBP",quality=88)
print("PASS: 72 independent unscaled frames, dominant-body masking and stable planted-toe alignment.")
for action,statistics in report["actions"].items():
    print(f"{action}: removed={sum(f['removedForeignPixels'] for f in statistics)} "
          f"recovered_seam={sum(f['recoveredSeamPixels'] for f in statistics)} "
          f"anchors={[f['toeSource'] for f in statistics]}")
