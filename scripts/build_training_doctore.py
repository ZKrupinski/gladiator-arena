#!/usr/bin/env python3
"""Export actual animation layers for training Doctore, without changing art originals.

The original 1672x941 key visual has a painted Doctore. This derives an
NPC-free background so independent, transparent poses can animate in its
original scene coordinates. Source art and game data remain unchanged.
"""
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/"public/assets/ludus"
original=Image.open(ART/"training_approved.webp").convert("RGB")
assert original.size == (1672,941), original.size

# Native, preexisting approved 2x2 transparent expression/action sheet.
sheet=Image.open(ART/"domina_poses_approved.webp").convert("RGBA")
sw,sh=sheet.size
assert sw%2==0 and sh%2==0,(sw,sh)
for i in range(4):
  x=(i%2)*(sw//2); y=(i//2)*(sh//2)
  pose=sheet.crop((x,y,x+sw//2,y+sh//2))
  bounds=pose.getchannel("A").getbbox()
  if not bounds: raise RuntimeError(f"Empty instructor pose {i}")
  pad=8
  bounds=(max(0,bounds[0]-pad),max(0,bounds[1]-pad),
          min(pose.width,bounds[2]+pad),min(pose.height,bounds[3]+pad))
  pose=pose.crop(bounds)
  out=ART/f"doctore_pose_{i}.webp"
  pose.save(out,"WEBP",lossless=True,method=6)
  print("pose",i,pose.size,out.stat().st_size)

rgb=np.array(original)
image=cv2.cvtColor(rgb,cv2.COLOR_RGB2BGR)
mask=np.zeros((941,1672),np.uint8)
# Trace Doctore's figure only: head/whip/pointing arm/legs, without the
# main header, candidate panel, or the illustrated speech plate at x510-840.
points=np.array([
 (311,117),(400,108),(464,126),(509,162),(510,214),
 (553,235),(637,217),(680,229),(689,248),(684,270),
 (621,295),(576,306),(551,360),(568,401),(575,461),
 (603,512),(620,574),(613,596),(136,596),(151,550),
 (172,503),(134,460),(118,405),(106,370),(124,323),
 (150,267),(194,223),(218,159)
],dtype=np.int32)
cv2.fillPoly(mask,[points],255)
# Preserve the original parchment speech bubble and training heading.
mask[0:222,510:858]=0
mask[0:103,:]=0
mask[606:,:]=0
# Put artwork-textured environment behind the actor, not a CSS rectangle.
env=cv2.imread(str(ROOT/"public/assets/new-era/arena.webp"))
if env is None: raise RuntimeError("Arena architectural source missing")
h,w=env.shape[:2]
patch=cv2.resize(env[:,int(w*.04):int(w*.51)],(750,941),cv2.INTER_CUBIC)
# A warmth-adjusted texture patch blends with the approved Roman set.
patch=cv2.convertScaleAbs(patch,alpha=1.07,beta=7)
staged=image.copy()
staged[:,:750]=patch
mix=cv2.GaussianBlur(mask,(0,0),8).astype(np.float32)[...,None]/255
result=np.clip(image*(1-mix)+staged*mix,0,255).astype(np.uint8)
clean=Image.fromarray(cv2.cvtColor(result,cv2.COLOR_BGR2RGB))
out=ART/"training_no_doctore.webp"
clean.save(out,"WEBP",quality=94,method=6)
print("training clear",out.stat().st_size)

# Static scene-layout QA composition, non-runtime. The genuine parchment is
# kept in front, matching browser layer order.
composed=clean.convert("RGBA")
sprite=Image.open(ART/"doctore_pose_1.webp").convert("RGBA")
dw,dh=625,510
k=min(dw/sprite.width,dh/sprite.height)
actor=sprite.resize((round(sprite.width*k),round(sprite.height*k)),Image.Resampling.LANCZOS)
layer=Image.new("RGBA",(dw,dh))
layer.alpha_composite(actor,((dw-actor.width)//2,dh-actor.height))
composed.alpha_composite(layer,(85,102))
# Speech bubble overlay over the NPC's pointing arm.
box=clean.crop((499,92,854,249)).convert("RGBA")
composed.alpha_composite(box,(499,92))
output=ROOT/"docs/qa/training-doctore-layer.webp"
output.parent.mkdir(parents=True,exist_ok=True)
composed.convert("RGB").save(output,format="WEBP",quality=84)
print("preview",output.stat().st_size)
