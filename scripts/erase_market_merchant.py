#!/usr/bin/env python3
"""Build a character-free market backplate from the approved key visual.

The approved original remains untouched.  This removes the *baked merchant*
from a derivative bitmap so the game can place the independently animated
transparent merchant on the same stage without any rectangular cover-up.
"""
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public/assets/market/market_keyvisual.webp"
OUT = ROOT / "public/assets/market/market_keyvisual_no_merchant.webp"

im = cv2.imread(str(SRC), cv2.IMREAD_COLOR)
if im is None:
    raise RuntimeError(f"Failed to read market art {SRC}")
height, width = im.shape[:2]
assert width == 1672 and height == 941, (width, height)
mask = np.zeros((height, width), dtype=np.uint8)

# The NPC occupies the original left stall from head down to waist/robe hem.
# Includes hands and extended toga, avoids the first candidate card and
# preserves all market UI along the bottom and the main shop banner at top.
merchant = np.array([
    (0, 115), (120, 109), (249, 88), (306, 100),
    (362, 142), (399, 211), (421, 303), (457, 370),
    (466, 491), (477, 598), (478, 688), (449, 709),
    (0, 707),
], dtype=np.int32)
cv2.fillPoly(mask, [merchant], 255)
# Do not let the inpaint affect any of the game illustration outside the
# exact removed area. Preserve original UI, columns and all 3 gladiators.
# The new transparent actor will occupy most of the retouched area.
inpainted = cv2.inpaint(im, mask, 7, cv2.INPAINT_TELEA)
# Preserve untouched source pixels exactly while fading only at the irregular
# merchant silhouette edge so no dark rectangular frame can appear.
a = cv2.GaussianBlur(mask, (0, 0), 4).astype(np.float32) / 255.0
a = a[..., None]
merged = np.clip(im * (1 - a) + inpainted * a, 0, 255).astype(np.uint8)
rgb = cv2.cvtColor(merged, cv2.COLOR_BGR2RGB)
Image.fromarray(rgb).save(OUT, format="WEBP", quality=95, method=6)
print(f"Wrote {OUT} ({OUT.stat().st_size} bytes) at {width}x{height}")
