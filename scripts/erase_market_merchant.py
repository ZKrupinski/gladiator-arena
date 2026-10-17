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
# Large-object inpainting alone creates blurry radial streaks. For the void
# behind the new actor, take *actual textured Roman architecture* from the
# project's approved clean arena art and merge it directly into the bitmap.
# There is no floating CSS panel or viewport; this is now background pixels.
environment = cv2.imread(str(ROOT / "public/assets/new-era/arena.webp"), cv2.IMREAD_COLOR)
if environment is None:
    raise RuntimeError("Arena architecture reference unavailable")
eh, ew = environment.shape[:2]
stone_and_banners = environment[:, int(ew * .12):int(ew * .58)]
patch = cv2.resize(stone_and_banners, (550, height), interpolation=cv2.INTER_CUBIC)
patch = cv2.convertScaleAbs(patch, alpha=1.08, beta=9)
staged = im.copy()
staged[:, :550] = patch
# Feather only along the silhouette perimeter to preserve all art/UI outside
# the old merchant, never cut a rectangular seam into the market scene.
a = cv2.GaussianBlur(mask, (0, 0), 12).astype(np.float32) / 255.0
a = a[..., None]
merged = np.clip(im * (1 - a) + staged * a, 0, 255).astype(np.uint8)

# The old bottom-left painted "Back" graphic is no longer a button. The
# actual live return control is top-right. Remove this dead image too from
# the derivative, using the neighboring cobblestone/crate texture.
dead_back = np.zeros((height, width), dtype=np.uint8)
cv2.rectangle(dead_back, (16, 840), (242, 918), 255, -1)
# This small, relatively featureless corner can be filled from its
# immediate surroundings; a pasted rectangle caused an obvious seam.
filled_corner = cv2.inpaint(merged, dead_back, 7, cv2.INPAINT_TELEA)
fade = cv2.GaussianBlur(dead_back, (0, 0), 8).astype(np.float32)[..., None] / 255.0
merged = np.clip(merged * (1-fade) + filled_corner * fade, 0, 255).astype(np.uint8)
# Clear the *painted* Cassius portrait, name and sample description in
# the lower information plaque. Retain the ornate border and Hire artwork.
# The live market data renderer paints the selected candidate here instead.
# Unlike a CSS cover, the replacement becomes actual game background pixels.
x0,y0,x1,y1 = 563,763,1122,894
ys,xs = np.mgrid[y0:y1,x0:x1]
depth = (ys-y0)/max(1,(y1-y0))
warm = 0.5 + 0.5*np.cos((xs-x0)/(x1-x0)*np.pi)
rng = np.random.default_rng(20261017)
grain = rng.normal(0,1.7,(y1-y0,x1-x0))
# OpenCV BGR: naturally aged, dark walnut interior, not a solid black block.
bgr = np.stack([
  15 + 9*warm - 3*depth + grain,
  27 + 8*warm - 4*depth + grain,
  41 + 9*warm - 3*depth + grain,
],axis=-1)
bgr = np.clip(bgr,0,255).astype(np.uint8)
# Subtle planked-leather texture in the center without baked glyphs.
for ty in range(0,bgr.shape[0],19):
    bgr[ty:ty+1,:,0:3] = np.clip(bgr[ty:ty+1,:,0:3].astype('int16') + 3,0,255)
# Keep all outer brass trim: only the already-black interior is repainted.
merged[y0:y1,x0:x1] = bgr
rgb = cv2.cvtColor(merged, cv2.COLOR_BGR2RGB)
Image.fromarray(rgb).save(OUT, format="WEBP", quality=95, method=6)
print(f"Wrote {OUT} ({OUT.stat().st_size} bytes) at {width}x{height}")


# Build a local-composition QA preview (not used by the game).
# It validates the merchant's live sprite footprint against the real game
# background without needing a screenshot from a running browser.
from PIL import ImageOps
pose = Image.open(ROOT / "public/assets/market/merchant_pose_1.webp").convert("RGBA")
box_w, box_h = 758, 765
k = min(box_w / pose.width, box_h / pose.height)
sprite = pose.resize((round(pose.width*k), round(pose.height*k)), Image.Resampling.LANCZOS)
block = Image.new("RGBA", (box_w, box_h))
block.alpha_composite(sprite, ((box_w-sprite.width)//2, 0))
# CSS left=-161, top=83, right inset 127. The stage itself clips at x=0.
cropped = block.crop((161, 0, box_w-127, box_h))
prev = Image.fromarray(rgb).convert("RGBA")
prev.alpha_composite(cropped, (0, 83))
# The existing speech plate is a foreground game graphic.
raw = Image.open(SRC).convert("RGBA")
prev.alpha_composite(raw.crop((0, 708, 495, 843)), (0, 708))
preview = ROOT / "docs/qa/market-merchant-layout.webp"
preview.parent.mkdir(parents=True, exist_ok=True)
prev.convert("RGB").save(preview, format="WEBP", quality=84, method=5)
print(f"Wrote QA composition {preview} ({pose.width}x{pose.height} source sprite)")
# Rebuild after all frontend source and style updates are committed.
