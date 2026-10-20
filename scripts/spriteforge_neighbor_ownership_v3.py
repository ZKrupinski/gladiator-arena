#!/usr/bin/env python3
"""SpriteForge V3 frame-ownership proof for neighboring exports of ONE source sheet.

An adjacent actor's head, paw or tail is foreign even if it is a BIG,
anatomically intact piece. Size is not a keep criterion: source ownership wins.

For legacy 8-column, 512px exports cut from the SAME atlas, neighboring
exports contain identical RGB patches in overlapping parts of the sheet.
We use that provenance (with canvas shifts ~396-397px) to remove ONLY
verified neighbor-owned pixels. Attached or unprovable artifacts BLOCK review;
never arbitrarily slice the playable actor by drawing a vertical line.
"""
import numpy as np
from PIL import Image
from scipy import ndimage

ALPHA=24
STRUCT=np.ones((3,3),dtype=np.uint8)


def owner_proof_mask(frame, neighbor, side, shifts=(394,395,396,397,398,399)):
    """Return evidence mask: same atlas pixels and closer to the neighbor's center.

    side='left' means current exported frame contains parts of its LEFT
    neighbor. side='right' means parts belonging to its RIGHT neighbor.
    Comparison requires real nontransparent pixels on BOTH images.
    """
    a=np.asarray(frame.convert("RGBA")).astype(np.int16)
    b=np.asarray(neighbor.convert("RGBA")).astype(np.int16)
    if a.shape != (512,512,4) or b.shape != a.shape:
        raise ValueError("OWNER_PROOF_REQUIRES_512_RGBA_EXPORTS")
    evidence=np.zeros((512,512),dtype=bool)
    strongest={"side":side,"matchedPixels":0,"shift":None}
    for shift in shifts:
        if side=="left":
            x0,x1=0,512-shift
            current=a[:,x0:x1,:]
            other=b[:,shift:512,:]
            xx=np.arange(x0,x1)[None,:]
            xx_other=xx+shift
        elif side=="right":
            x0,x1=shift,512
            current=a[:,x0:x1,:]
            other=b[:,0:512-shift,:]
            xx=np.arange(x0,x1)[None,:]
            xx_other=xx-shift
        else:
            raise ValueError("INVALID_NEIGHBOR_SIDE")
        # A few pixels of padding overlap can belong to the CURRENT actor.
        # Use only clear central-owner advantage (>30px).
        neighbor_closer=(np.abs(xx_other-256)+30<np.abs(xx-256))
        alpha_match=(current[:,:,3]>=ALPHA)&(other[:,:,3]>=ALPHA)
        rgb_match=np.max(np.abs(current[:,:,:3]-other[:,:,:3]),axis=2)<=28
        alpha_close=np.abs(current[:,:,3]-other[:,:,3])<=55
        match=alpha_match&rgb_match&alpha_close&neighbor_closer
        robust=ndimage.binary_opening(match,structure=np.ones((2,2),dtype=np.uint8))
        # Provenance must occupy a real patch, not coincidentally similar dots.
        labels,n=ndimage.label(robust,structure=STRUCT)
        counts=np.bincount(labels.ravel(),minlength=n+1);counts[0]=0
        allowed=np.where(counts>=48)[0]
        allowed=allowed[allowed!=0]
        if allowed.size:
            approved=np.isin(labels,allowed)
            evidence[:,x0:x1]|=approved
            count=int(np.count_nonzero(approved))
            if count>strongest["matchedPixels"]:
                strongest={"side":side,"matchedPixels":count,"shift":shift}
    return evidence,strongest


def remove_proven_foreign(frame, left_neighbor=None, right_neighbor=None):
    """Erase foreign neighbor pixels, preserving current RGB and alpha elsewhere.

    Does not claim to fix an entire foreign mass unless provenance accounts for
    that mass. Conservative 2px mask expansion restores antialias coverage.
    Does NOT auto-cut through the subject based on pixel count or alpha island
    connectivity.
    """
    pixels=np.asarray(frame.convert("RGBA")).copy()
    evidence=np.zeros((512,512),dtype=bool)
    matches=[]
    if left_neighbor is not None:
        mask,info=owner_proof_mask(frame,left_neighbor,"left")
        evidence|=mask;matches.append(info)
    if right_neighbor is not None:
        mask,info=owner_proof_mask(frame,right_neighbor,"right")
        evidence|=mask;matches.append(info)
    if evidence.any():
        # 1px halo accounts for interpolation differences; deletion limited to
        # far-edge x zones where neighbor-centered ownership is proven.
        region=ndimage.binary_dilation(evidence,iterations=1)
        x=np.arange(512)[None,:]
        region&=((x<100) if left_neighbor is not None and right_neighbor is None else
                 (x>412) if right_neighbor is not None and left_neighbor is None else
                 ((x<100)|(x>412)))
        pixels[region,3]=0
    else:
        region=evidence
    report={
       "proofs":matches,"verifiedForeignPixels":int(evidence.sum()),
       "erasedAlphaPixels":int(np.count_nonzero(region & (np.asarray(frame.getchannel("A"))>0))),
       "needsVisualReview":True,
       "reason":"NEIGHBOR_SOURCE_OWNERSHIP_PROVEN_BUT_CONNECTED_BODY_MAY_REQUIRE_SEMANTIC_REVIEW"
                if evidence.any() else "UNPROVEN_FOREIGN_BODY_NOT_AUTO_ERASED"
    }
    return Image.fromarray(pixels,"RGBA"),report
