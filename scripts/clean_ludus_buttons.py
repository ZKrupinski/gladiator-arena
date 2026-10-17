#!/usr/bin/env python3
"""Remove 3 obsolete Domina leg buttons from the *actual lobby bitmap*.

Source approval image is never overwritten. Three non-functional tiles above
the real roster are erased in a derived WebP, using nearby cloth/stone visual
information as fill. The backdrop remains 1448x1086 so UI anchors are intact.
"""
from pathlib import Path
from PIL import Image
import cv2
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/"public/assets/ludus/ludus_ui.webp"
OUT=ROOT/"public/assets/ludus/ludus_lobby_no_buttons.webp"
QA=ROOT/"docs/qa/ludus-lobby-buttons"
QA.mkdir(parents=True,exist_ok=True)

img=cv2.imread(str(SRC),cv2.IMREAD_COLOR)
if img is None: raise RuntimeError("Original lobby artwork missing")
H,W=img.shape[:2]
assert (W,H)==(1448,1086)
# User-approved 3 icons: helmet / gift / hourglass at the knees.
# Surround only their gold frames (not the separate major arena buttons).
# All three button frames form one contiguous band over the shin/drape.
# Treat it as ONE continuation of cloth; separately filling three rectangles
# caused unacceptable duplicated knees and hard vertical seams.
mask=np.zeros((H,W),np.uint8)
cv2.rectangle(mask,(423,776),(786,907),255,-1)

# The character is already painted above y~780. Extend the LAST
# uninterrupted rows of the robe, shin and white dress into the bottom
# strip, without copying a full circular knee or other button borders.
# The playable roster covers the bottom part of this repaired band.
yy,xx=np.indices((H,W),dtype=np.float32)
sy=np.where(yy>=776,775.0-np.clip((yy-776)*.34,0,47),yy)
sy=np.clip(sy,0,H-1).astype(np.float32)
continued=cv2.remap(img,xx,sy,interpolation=cv2.INTER_CUBIC,
                    borderMode=cv2.BORDER_REFLECT)
# Blend vertically so the transition to the original painted dress is
# gradual and coherent instead of having three rectangular clip seams.
clean=cv2.GaussianBlur(continued,(0,0),1.6)
blend=cv2.GaussianBlur(mask,(0,0),8).astype(np.float32)[...,None]/255.0
result=np.clip(img*(1-blend)+clean*blend,0,255).astype(np.uint8)
result[mask==0]=img[mask==0]

Image.fromarray(cv2.cvtColor(result,cv2.COLOR_BGR2RGB)).save(OUT,"WEBP",quality=96,method=6)
Image.fromarray(cv2.cvtColor(result,cv2.COLOR_BGR2RGB)).save(QA/"full.webp","WEBP",quality=89,method=5)
Image.fromarray(cv2.cvtColor(result[704:931,365:822],cv2.COLOR_BGR2RGB)).resize((914,454),Image.Resampling.NEAREST).save(
    QA/"leg-area.webp","WEBP",quality=93,method=6
)
Image.fromarray(cv2.cvtColor(img[704:931,365:822],cv2.COLOR_BGR2RGB)).resize((914,454),Image.Resampling.NEAREST).save(
    QA/"before.webp","WEBP",quality=89,method=6
)
# Hard guarantee all original pixels outside mask are identical pre-compression.
changed=np.any(result!=img,axis=2)
assert not np.any(changed[mask==0]),"Unexpected pixels changed outside icon artwork"
print("Saved",OUT,OUT.stat().st_size,"bytes")
print("Removed precisely",int(np.count_nonzero(mask)),"pixels, preserved all other UI/artwork")
