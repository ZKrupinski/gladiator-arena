#!/usr/bin/env python3
"""Export 12 independent Murmillo combat sprites from the approved L5 source.
No warping, inpainting, adjacent-cell bleed, or resizing.
Each transparent file keeps the original foot-pivot coordinates.
"""
from pathlib import Path
import json
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public/assets/ludus-growth"
DEST = ROOT / "public/assets/combat/murmillo-v2"
DEST.mkdir(parents=True, exist_ok=True)
KEY = "murmillo_a_L5"
NAMES = ("idle", "walk", "slash", "sweep", "thrust", "heavy",
         "guard", "hit", "dodge", "ready", "victory", "defeat")
GUTTER = 12
cut = json.loads((SRC / "frame-cuts.json").read_text(encoding="utf-8"))
sheet = cut["sheets"][KEY]
original = Image.open(SRC / f"{KEY}.png").convert("RGBA")
assert tuple(sheet["size"]) == original.size
assert len(sheet["frames"]) == len(NAMES) == 12
rows = []
for idx, (name, spec) in enumerate(zip(NAMES, sheet["frames"])):
    x, y, w, h = spec["box"]
    assert 0 <= x and 0 <= y and x+w <= original.width and y+h <= original.height
    cutout = original.crop((x,y,x+w,y+h))
    alpha = bytearray(w*h)
    for offset, length in zip(spec["runs"][::2], spec["runs"][1::2]):
        row, col = divmod(offset, w)
        assert row < h and col + length <= w
        alpha[offset:offset+length] = b"\xff"*length
    mask = Image.frombytes("L", (w,h), bytes(alpha))
    cutout.putalpha(ImageChops.multiply(cutout.getchannel("A"), mask))
    assert cutout.getchannel("A").getbbox(), f"Empty pose: {name}"
    padded = Image.new("RGBA", (w+GUTTER*2, h+GUTTER*2), (0,0,0,0))
    padded.alpha_composite(cutout, (GUTTER,GUTTER))
    assert padded.getpixel((0,0))[3] == 0
    filename = f"{idx:02d}-{name}.webp"
    padded.save(DEST / filename, "WEBP", lossless=True, method=6)
    rows.append({
        "name": name, "file": filename, "pivotX": spec["pivotX"]+GUTTER,
        "footY": h+GUTTER, "width": padded.width, "height": padded.height
    })
manifest = {
    "version": 2, "source": KEY, "cellWidth": sheet["size"][0]/4,
    "cellHeight": sheet["size"][1]/3, "frames": rows
}
(DEST / "manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("exported",len(rows),"independent alpha-isolated sprites",DEST,flush=True)
