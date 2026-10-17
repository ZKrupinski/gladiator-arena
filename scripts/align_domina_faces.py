#!/usr/bin/env python3
"""Produce exactly registered small facial pose overlays, never a new head.

The approved art remains the full original Domina. We align each existing
expression around the SAME fixed facial centre in the lobby, and mask only
eyes, cheeks and lips. Keeping the face size unchanged prevents the old
double-headed/small-face artifact.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import cv2

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/"public/assets/ludus"
PREVIEW=ROOT/"docs/qa/domina-corrected"
PREVIEW.mkdir(parents=True,exist_ok=True)
base=Image.open(ART/"ludus_ui.webp").convert("RGBA")
# Reference crop uses original image to confirm real eyes/nose/lips location.
original=Image.open(ART/"ludus_ui.webp").convert("RGB")
original.crop((228,260,492,495)).resize((528,470),Image.Resampling.NEAREST).save(
    PREVIEW/"zoom_original.webp","WEBP",quality=95)

W,H=base.size
assert (W,H)==(1448,1086)
# Fixed real facial location in the approved key visual (1448x1086).
# The head remains painted at its original scale, expression-only coverage.
target=(352.,385.)
# Manually anchored landmark centres based on the existing original poses.
source_centres=[(173,128),(173,134),(175,130),(174,132),(180,140),(178,135)]
scale=1.00
for i,(sx,sy) in enumerate(source_centres):
    im=Image.open(ART/f"domina_{i}.webp").convert("RGBA")
    rgba=np.asarray(im)
    h,w=rgba.shape[:2]
    tx=target[0]-sx*scale
    ty=target[1]-sy*scale
    warp=cv2.warpAffine(rgba,np.float32([[scale,0,tx],[0,scale,ty]]),
                        (W,H),flags=cv2.INTER_LANCZOS4,
                        borderMode=cv2.BORDER_CONSTANT,borderValue=(0,0,0,0))
    # Soft oval of expression only; transparent elsewhere. Face never changes
    # size, retains original coiffure, arms, posture and background.
    yy,xx=np.ogrid[:H,:W]
    oval=((xx-target[0])/65.)**2+((yy-target[1])/61.)**2
    fade=np.clip((1.15-oval)/.40,0,1)
    warp[:,:,3]=np.clip(warp[:,:,3].astype(np.float32)*fade,0,255).astype(np.uint8)
    overlay=Image.fromarray(warp,'RGBA')
    overlay.save(ART/f"domina_face_aligned_{i}.webp",format="WEBP",lossless=True,method=6)
    qa=base.copy();qa.alpha_composite(overlay)
    qa.convert("RGB").save(PREVIEW/f"aligned_{i}.webp",format="WEBP",quality=90)
    close=qa.crop((228,260,492,495))
    close=close.resize((528,470),Image.Resampling.NEAREST)
    close.convert("RGB").save(PREVIEW/f"zoom_{i}.webp",format="WEBP",quality=91)
    print("pose",i,"src",w,h,"transform",(tx,ty),"overlay pixels",int(np.count_nonzero(warp[:,:,3])))
