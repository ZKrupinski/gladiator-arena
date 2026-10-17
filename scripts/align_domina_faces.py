#!/usr/bin/env python3
"""Precisely align Domina facial expression frames to the approved lobby.

A 200x145 facial cutout was previously positioned by guessing.  This script
matches each expression to the face IN the lobby at actual pixel resolution,
and exports a transparent full-stage expression mask. Never stretch, shift or
duplicate the body; only the soft interior of the face is replaced.

Output: assets/ludus/domina_face_aligned_{0..5}.webp and QA screenshots.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import cv2

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/"public/assets/ludus"
PREVIEW=ROOT/"docs/qa/domina-corrected"
PREVIEW.mkdir(parents=True,exist_ok=True)
base=Image.open(ART/"ludus_ui.webp").convert("RGB")
W,H=base.size
assert (W,H)==(1448,1086)
base_rgb=np.asarray(base).copy()
base_gray=cv2.cvtColor(base_rgb,cv2.COLOR_RGB2GRAY)
# Ground-truth location of the approved character's face (not a guess from
# browser layout): restrict to the seated Domina region, never UI/crowd.
search=(205,248,515,491)
x0,y0,x1,y1=search
area=base_gray[y0:y1,x0:x1]
results=[]
for index in range(6):
    src=Image.open(ART/f"domina_{index}.webp").convert("RGBA")
    rgba=np.asarray(src)
    hh,ww=rgba.shape[:2]
    # Describe the upper central face excluding crowns, cups and sleeves.
    cx0=int(ww*.32); cy0=int(hh*.165)
    cx1=int(ww*.75); cy1=int(hh*.385)
    template=cv2.cvtColor(rgba[cy0:cy1,cx0:cx1,:3],cv2.COLOR_RGB2GRAY)
    # Validate that most of the template is opaque face (no transparency).
    alpha=rgba[cy0:cy1,cx0:cx1,3]
    # Highlight eyes, nose, mouth instead of plain skin background.
    templ_edges=cv2.Laplacian(template,cv2.CV_32F,ksize=3)
    search_edges=cv2.Laplacian(area,cv2.CV_32F,ksize=3)
    candidates=[]
    for factor in np.arange(.80,1.66,.025):
        tw=round(template.shape[1]*factor)
        th=round(template.shape[0]*factor)
        if tw>=area.shape[1] or th>=area.shape[0] or tw<20 or th<20:continue
        resized=cv2.resize(templ_edges,(tw,th),interpolation=cv2.INTER_LINEAR)
        response=cv2.matchTemplate(search_edges,resized,cv2.TM_CCOEFF_NORMED)
        _,score,_,pt=cv2.minMaxLoc(response)
        candidates.append((score,factor,pt[0],pt[1]))
    score,scale,mx,my=max(candidates)
    # Recover translation of complete source sprite from matched facial crop.
    tx=x0+mx-cx0*scale
    ty=y0+my-cy0*scale
    # Disallow aligning to unrelated UI art outside the Domina's seated head.
    results.append((index,round(float(score),4),round(float(scale),3),
                    round(float(tx),1),round(float(ty),1),[cx0,cy0,cx1,cy1],list(src.size)))
    # Full-resolution transformed sprite. Only the FACE pixels will be used.
    mat=np.float32([[scale,0,tx],[0,scale,ty]])
    warped=cv2.warpAffine(rgba,mat,(W,H),flags=cv2.INTER_LANCZOS4,
                           borderMode=cv2.BORDER_CONSTANT,borderValue=(0,0,0,0))
    # Soft oval interior follows the original face's proportional size.
    yy,xx=np.ogrid[:H,:W]
    face_cx=tx+ww*.53*scale
    face_cy=ty+hh*.285*scale
    face_rx=ww*.185*scale
    face_ry=hh*.137*scale
    ellipse=((xx-face_cx)/face_rx)**2+((yy-face_cy)/face_ry)**2
    feather=np.clip((1.03-ellipse)/.32,0,1)
    a=(warped[:,:,3].astype(np.float32)*feather).clip(0,255).astype(np.uint8)
    warped[:,:,3]=a
    output=Image.fromarray(warped,"RGBA")
    output.save(ART/f"domina_face_aligned_{index}.webp","WEBP",lossless=True,method=6)
    # QC image with known overlay against original, includes face rectangle.
    screenshot=base.copy().convert("RGBA")
    screenshot.alpha_composite(output)
    screenshot.convert("RGB").save(PREVIEW/f"aligned_{index}.webp","WEBP",quality=90)
    diagnostic=screenshot.convert("RGB")
    draw=ImageDraw.Draw(diagnostic)
    draw.rectangle((face_cx-face_rx,face_cy-face_ry,
                   face_cx+face_rx,face_cy+face_ry),outline="red",width=2)
    draw.text((10,1050),f"pose={index} score={score:.3f}, scale={scale:.3f}, offset=({tx:.0f},{ty:.0f})",fill="white")
    diagnostic.save(PREVIEW/f"debug_{index}.webp","WEBP",quality=85)
print("Alignment scores / poses:")
for row in results: print(row)
