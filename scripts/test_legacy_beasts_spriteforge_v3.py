#!/usr/bin/env python3
"""Safety regression: SpriteForge V3 may remove specks, not meaningful detached art."""
from PIL import Image, ImageDraw
import numpy as np
from audit_legacy_beasts_spriteforge_v3 import scan_image

def actor():
    im=Image.new("RGBA",(512,512))
    dr=ImageDraw.Draw(im)
    dr.ellipse((110,130,376,420),fill=(188,140,72,255))
    return im

base=actor()
d=ImageDraw.Draw(base)
d.rectangle((475,476,477,478),fill=(222,30,20,255))
before=np.asarray(base).copy()
fixed,qa=scan_image(base,True)
after=np.asarray(fixed)
assert qa["fixedIslands"]==1,qa
assert qa["fixedAlphaPixels"]>=9,qa
assert after[477,476,3]==0
assert np.array_equal(before[140:410,120:360],after[140:410,120:360]),"REAL_ACTOR_ALTERED"

detached=actor()
ImageDraw.Draw(detached).ellipse((430,435,467,473),fill=(255,180,0,255))
out,qa=scan_image(detached,True)
assert qa["ambiguousIslands"],qa
assert np.array_equal(np.asarray(detached),np.asarray(out)),"DETACHED_PART_AMPUTATED"

edge=Image.new("RGBA",(512,512))
ImageDraw.Draw(edge).ellipse((2,80,310,470),fill=(100,140,200,255))
_,qa=scan_image(edge,True)
assert "EDGE_RISK_REVIEW_BODY_OR_TAIL" in qa["problems"]

print("SPRITEFORGE_V3_LEGACY_SAFE_SPECK_AND_DETACHED_BODY_TESTS_PASS")
