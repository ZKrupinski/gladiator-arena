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
rects=[(434,788,542,892),(549,789,661,893),(670,786,774,890)]
mask=np.zeros((H,W),np.uint8)
for x0,y0,x1,y1 in rects:
    cv2.rectangle(mask,(x0,y0),(x1,y1),255,-1)
mask=cv2.dilate(mask,np.ones((5,5),np.uint8),iterations=1)

# Large-object inpainting produced blurry diamond-shaped streaks. Instead,
# reconstruct the robe and stone underneath from the genuine undamaged
# clothing immediately above the buttons. Vertical reflection at the border
# continues all of the folds and painted colours without copying fake UI.
yy,xx=np.indices((H,W),dtype=np.float32)
boundary=783.0
sy=np.where(yy>=boundary,2*boundary-yy*1.0,yy)
sy=np.clip(sy,0,H-1).astype(np.float32)
reflected=cv2.remap(img,xx,sy,interpolation=cv2.INTER_CUBIC,
                     borderMode=cv2.BORDER_REFLECT)
# Smooth only the reflected texture in the covered area for printed WebP
# quality; original image pixels outside the three old button silhouettes
# remain intact (i.e. no added panel behind Domina's legs).
clean=cv2.GaussianBlur(reflected,(0,0),.8)
blend=cv2.GaussianBlur(mask,(0,0),7).astype(np.float32)[...,None]/255.0
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
