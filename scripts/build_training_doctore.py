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
  # The 2x2 concept sheet contains flat-colour strip fragments on the
  # right edge of some cells. Detect ONLY broad, uniformly-filled regions,
  # rather than cutting the character with a rectangular crop. This keeps
  # textured fingers, hair, shields and the whip intact.
  pixels=np.asarray(pose).copy()
  colour=pixels[:,:,:3].astype(np.int16)
  alpha=pixels[:,:,3]
  ph,pw=alpha.shape
  flat_x=np.zeros((ph,pw),bool)
  flat_y=np.zeros((ph,pw),bool)
  flat_x[:,12:-12]=(np.max(np.abs(colour[:,24:]-colour[:,:-24]),axis=2)<12)
  flat_y[6:-6,:]=(np.max(np.abs(colour[12:,:,:]-colour[:-12,:,:]),axis=2)<12)
  threshold=[.67,.71,.67,.54][i]
  region=np.broadcast_to((np.arange(pw)[None,:]>pw*threshold),(ph,pw))
  flat=(flat_x&flat_y&region&(alpha>45)).astype('uint8')
  count,labels,stats,_=cv2.connectedComponentsWithStats(flat,8)
  band=np.zeros((ph,pw),np.uint8)
  for component in range(1,count):
      x0,y0,ww,hh,area=stats[component]
      if ww>36 and area>95 and (ww>hh*1.4 or area>1800):
          band[labels==component]=255
  # Expand inside the flat region slightly to clear anti-aliasing remnants.
  band=cv2.dilate(band,np.ones((5,5),np.uint8),iterations=2)
  pixels[:,:,3][band>0]=0
  # The contact sheet has rectangular stray pixels bleeding in from the
  # adjacent cell. Clip these ONLY on the original right edge outside the
  # instructor's contour; never blur the real silhouette.
  yy=lambda f:int(round(ph*f))
  xx=lambda f:int(round(pw*f))
  if i==0:
      pixels[yy(.40):yy(.64),xx(.76):,3]=0
  elif i==1:
      pixels[yy(.15):yy(.68),xx(.78):,3]=0
      pixels[yy(.43):yy(.64),xx(.755):,3]=0
  elif i==2:
      pixels[:yy(.027),:,3]=0
      pixels[yy(.28):yy(.57),xx(.77):,3]=0
  else:
      # Whip is an independently thin arc on the right; retain it while
      # clearing the underlying rectangular red concept-sheet residue.
      arc=np.zeros((ph,pw),np.uint8)
      trace=np.array([(int(pw*x),int(ph*y)) for x,y in [
          (.55,.13),(.67,.05),(.83,.03),(.96,.11),
          (.98,.24),(.95,.34),(.86,.43),(.74,.48),(.69,.49)
      ]],np.int32)
      cv2.polylines(arc,[trace],False,255,thickness=20,lineType=cv2.LINE_AA)
      prior=pixels[:,:,3].copy()
      pixels[yy(.18):yy(.65),xx(.69):,3]=0
      pixels[yy(.30):yy(.50),xx(.62):,3]=0
      pixels[yy(.83):,xx(.81):,3]=0
      pixels[:yy(.027),:,3]=0
      pixels[:,:,3][arc>0]=prior[arc>0]
  # Fully erase the known *rectangular* source-image contamination. These
  # strips have no relationship to the actor. Restrict cuts to the far-right
  # cell edge so the textured body and face are never masked.
  def clear_rect(x0,y0,x1,y1):
      xa=max(0,int(pw*x0/708));xb=min(pw,int(pw*x1/708))
      ya=max(0,int(ph*y0/540));yb=min(ph,int(ph*y1/540))
      pixels[ya:yb,xa:xb,3]=0
  if i==0:
      clear_rect(534,208,708,352)
      clear_rect(608,336,708,540)
  elif i==1:
      clear_rect(559,58,708,218)
      clear_rect(531,212,708,360)
      clear_rect(534,352,708,540)
  elif i==2:
      clear_rect(542,153,708,309)
      clear_rect(610,303,708,540)
  else:
      saved=pixels[:,:,3].copy()
      clear_rect(466,122,708,355)
      clear_rect(532,351,708,540)
      # Preserve only the narrow curved whip (not colored bands behind it).
      arc=np.zeros((ph,pw),np.uint8)
      coords=[(.57,.135),(.67,.05),(.83,.035),(.96,.105),
              (.985,.22),(.965,.31),(.90,.375),(.80,.43),(.70,.475)]
      pts=np.array([(int(pw*x),int(ph*y)) for x,y in coords],np.int32)
      cv2.polylines(arc,[pts],False,255,thickness=15,lineType=cv2.LINE_AA)
      pixels[:,:,3][arc>0]=saved[arc>0]
  pose=Image.fromarray(pixels,'RGBA')
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
