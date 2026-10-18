#!/usr/bin/env python3
"""Murmillo B: export independent key drawings for one extra playable fighter.

Uses the approved original sprite pixels as paint layers rather than screen-space
strip warping. The new frames are author-composited native-resolution bitmaps.
Original 12 frames stay unchanged and remain available as a fallback.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import json, math

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/"public/assets/combat/murmillo-v2"
DEST=ROOT/"public/assets/combat/murmillo-b"
DEST.mkdir(parents=True,exist_ok=True)
old=json.loads((SOURCE/"manifest.json").read_text(encoding="utf-8"))
base={}
frames=[]
for n, spec in enumerate(old["frames"]):
    im=Image.open(SOURCE/spec["file"]).convert("RGBA")
    assert im.size==(spec["width"],spec["height"])
    base[spec["name"]]=(im,spec)
    filename=f"{n:02d}-{spec['name']}.webp"
    im.save(DEST/filename,lossless=True,format="WEBP",method=6)
    frames.append({**spec,"file":filename})

W,H,PX,FY=560,520,280,476

def prepared(key,dx=0,dy=0,sx=1.0,sy=1.0,angle=0):
    im,spec=base[key]
    # Whole-art motion is precomputed once, at native pixel resolution,
    # not distorted or jittered on every render frame.
    tw=max(1,round(im.width*sx));th=max(1,round(im.height*sy))
    scaled=im.resize((tw,th),Image.Resampling.LANCZOS)
    anchorx=spec["pivotX"]*sx
    foot=spec["footY"]*sy
    cv=Image.new("RGBA",(W,H))
    cv.alpha_composite(scaled,(round(PX-anchorx+dx),round(FY-foot+dy)))
    if angle:
        cv=cv.rotate(angle,resample=Image.Resampling.BICUBIC,center=(PX,FY),expand=False)
    return cv

def trail(image,kind):
    # Paint a subtle character-attached sword swipe on a separate plate.
    # The blade direction itself comes from the original thrust/forward art.
    fx=Image.new("RGBA",(W,H))
    brush=ImageDraw.Draw(fx)
    if kind=="vertical":
        curves=[(267,126,477,380),(278,137,469,368),(292,149,459,351)]
        for i,rect in enumerate(curves):
            brush.arc(rect,start=290,end=351,fill=[(253,210,136,180),(255,238,191,140),(255,251,221,80)][i],width=4-i)
    else:
        for i in range(3):
            y=301+i*7
            brush.arc((322,200+i*5,544,420+i*6),start=248,end=316,
                      fill=[(247,223,174,145),(255,240,198,105),(240,212,172,62)][i],width=3)
    fx=fx.filter(ImageFilter.GaussianBlur(.45))
    image.alpha_composite(fx)
    return image

def add(name,im):
    assert im.size==(W,H)
    assert im.getchannel("A").getbbox(),name
    no=len(frames)
    path=f"{no:02d}-{name}.webp"
    im.save(DEST/path,"WEBP",lossless=True,method=6)
    frames.append({"name":name,"file":path,"pivotX":PX,"footY":FY,"width":W,"height":H})
    return no

# Three breathing art plates. Feet stay grounded, upper body shifts only 1–3px.
idx={}
idx["idle_inhale"]=add("idle-inhale",prepared("idle",dy=-2,sy=1.006))
idx["idle_exhale"]=add("idle-exhale",prepared("idle",dy=0,sx=.998))
idx["idle_settle"]=add("idle-settle",prepared("ready",dy=0,sx=1.0))
# Four grounded steps; never use the diving dodge frame in a walk cycle.
idx["walk_contact_a"]=add("walk-contact-a",prepared("walk",dx=-4,dy=0))
idx["walk_pass_a"]=add("walk-pass-a",prepared("ready",dx=-1,dy=-2))
idx["walk_contact_b"]=add("walk-contact-b",prepared("walk",dx=5,dy=0,sx=.996))
idx["walk_pass_b"]=add("walk-pass-b",prepared("idle",dx=1,dy=-1))
# New forward-directed sword contact images for strikes 1 and 2.
# The pre-painted thrust sword projects right, unlike the old slash silhouette.
idx["slash_forward"]=add("slash-forward",trail(prepared("thrust",dx=8,dy=-3,sy=1.012),"vertical"))
idx["sweep_forward"]=add("sweep-forward",trail(prepared("thrust",dx=13,dy=1,sx=1.018),"horizontal"))
# Clearly staged knockdown, then a stable final corpse frame.
idx["fall_stagger"]=add("fall-stagger",prepared("hit",dx=-4,dy=12,angle=9))
idx["fall_collapse"]=add("fall-collapse",prepared("defeat",dx=6,dy=0,angle=-8))
idx["fall_final"]=add("fall-final",prepared("defeat"))
manifest={"version":3,"baseVersion":2,"source":"murmillo_a_L5",
          "cellWidth":old["cellWidth"],"cellHeight":old["cellHeight"],
          "frames":frames,"extra":idx,
          "description":"Independent authored composite frames, fixed foot pivot and forward sword keyposes"}
(DEST/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
# Opaque QA contact board for visual inspection of all 12 new frames.
preview=Image.new("RGBA",(1120,4*292),(28,31,38,255))
d=ImageDraw.Draw(preview)
for i,(name,index) in enumerate(idx.items()):
    src=Image.open(DEST/frames[index]["file"]).convert("RGBA")
    k=min(268/src.width,257/src.height)
    thumb=src.resize((round(src.width*k),round(src.height*k)),Image.Resampling.LANCZOS)
    x=(i%4)*280+(280-thumb.width)//2
    y=(i//4)*292+260-thumb.height
    preview.alpha_composite(thumb,(x,y))
    d.text(((i%4)*280+8,(i//4)*292+265),name,fill="#e9d4b1")
preview.convert("RGB").save(DEST/"qa-frames.webp",format="WEBP",quality=90)
print("Murmillo B complete:",len(frames),"frames, custom",len(idx),flush=True)
