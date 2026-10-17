#!/usr/bin/env python3
"""Export unchanged approved Murmillo keyposes for animation reference.

Reads the game's pixel-ownership frame cuts. Produces exactly the original
alpha-masked keypose pixels. Never recolours, replaces, warps or inpaints art.
Use this as source for hand-authored in-between frames.
"""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/"public/assets/ludus-growth"
OUT=ROOT/"docs/qa/murmillo-original-reference"
OUT.mkdir(parents=True,exist_ok=True)
cuts=json.loads((SOURCE/"frame-cuts.json").read_text(encoding="utf-8"))
names=["idle","walk","attack","special","guard_alt","net","guard","hit","dodge","standing","victory","defeat"]
for tier in (1,2,3,4,5):
    key=f"murmillo_a_L{tier}"
    spec=cuts["sheets"][key]
    image=Image.open(SOURCE/f"{key}.png").convert("RGBA")
    assert tuple(spec["size"])==image.size
    thumbs=[]
    for i,frame in enumerate(spec["frames"]):
        x,y,w,h=frame["box"]
        tile=image.crop((x,y,x+w,y+h))
        alpha=Image.new("L",(w,h),0)
        ink=ImageDraw.Draw(alpha)
        for j in range(0,len(frame["runs"]),2):
            p,count=frame["runs"][j:j+2]
            row,col=divmod(p,w)
            assert col+count<=w and row<h
            ink.line((col,row,col+count-1,row),fill=255)
        # Preserve source pixel transparency too.
        from PIL import ImageChops
        tile.putalpha(ImageChops.multiply(tile.getchannel("A"),alpha))
        tile.save(OUT/f"{key}_{i:02d}_{names[i]}.webp",format="WEBP",lossless=True,method=6)
        # Review boards are previews only; retain native transparent original assets.
        thumb=Image.new("RGBA",(250,270),(0,0,0,0))
        scale=min(232/max(1,w),245/max(1,h))
        pic=tile.resize((max(1,round(w*scale)),max(1,round(h*scale))),Image.Resampling.LANCZOS)
        thumb.alpha_composite(pic,((250-pic.width)//2,265-pic.height))
        thumbs.append(thumb)
    board=Image.new("RGBA",(1000,3*298),(34,28,25,255))
    draw=ImageDraw.Draw(board)
    for j,thumb in enumerate(thumbs):
        col,row=j%4,j//4
        board.alpha_composite(thumb,(col*250,row*298))
        draw.text((col*250+10,row*298+266),f"{j:02d} {names[j]}",
                  fill=(245,223,176,255))
    board.convert("RGB").save(OUT/f"{key}_contact.webp",format="WEBP",quality=88)
    print("EXPORT",key,"12 original 100% unchanged alpha masks",flush=True)
