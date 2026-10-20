#!/usr/bin/env python3
"""Safety regression: SpriteForge V3 may remove specks, not meaningful detached art."""
from PIL import Image, ImageDraw
import numpy as np
from audit_legacy_beasts_spriteforge_v3 import scan_image
from spriteforge_neighbor_ownership_v3 import remove_proven_foreign

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

# Identical substantial neighboring ANATOMY must be removed based on source
# ownership and image registration, not based on small pixel component size.
previous=actor(); target=actor()
from PIL import ImageDraw as D
D.Draw(previous).rectangle((428,240,468,280),fill=(250,40,30,255))
D.Draw(target).rectangle((32,240,72,280),fill=(250,40,30,255))
clean,info=remove_proven_foreign(target,left_neighbor=previous)
assert info["verifiedForeignPixels"]>500,info
assert np.asarray(clean)[255,55,3]==0,"FOREIGN_BODY_MUST_BE_REMOVED"
assert np.asarray(clean)[260,180,3]==255,"CURRENT_BODY_MUST_REMAIN"
# Conversely, another pose's ghost must not cause removal of a valid
# current-owned extension closer to the CURRENT frame center.
previous2=actor();target2=actor()
D.Draw(previous2).rectangle((478,240,508,268),fill=(180,70,200,255))
D.Draw(target2).rectangle((82,240,112,268),fill=(180,70,200,255))
kept,_=remove_proven_foreign(target2,left_neighbor=previous2)
assert np.asarray(kept)[250,95,3]==255,"CURRENT_OWNED_BODY_PART_WRONGLY_CUT"
print("SPRITEFORGE_V3_FRAME_OWNERSHIP_LARGE_FOREIGN_BODY_AND_LEGITIMATE_LIMB_PASS")
