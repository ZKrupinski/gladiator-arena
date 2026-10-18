#!/usr/bin/env python3
"""Build player/boss-ready, individually padded 16:9 art frames.
Never rescale source pixels. Never embed game VFX in the character art.
Original user-provided 4x2 sheets are retained as provenance.
"""
from pathlib import Path
from PIL import Image, ImageDraw
from scipy import ndimage
import numpy as np, json

BASE=Path(__file__).resolve().parents[1]/"public/assets/combat/champion-murmillo"
SRC=BASE/"source"; DEST=BASE/"frames"; DEST.mkdir(parents=True,exist_ok=True)
SOURCE_ACTIONS=("idle","walk","slash","sweep","thrust","heavy","guard","hit","death")
FPS={"idle":6,"walk":10,"slash":14,"sweep":14,"thrust":14,"heavy":12,"guard":7,"hit":10,"death":10}
W,H=960,540
manifest={"version":1,"character":"murmillo_champion_red","name":"신규 챔피언 무르밀로",
          "cellWidth":430,"cellHeight":430,"canvas":{"width":W,"height":H,"transparent":True},
          "actions":{},"fps":FPS}
contact=Image.new("RGB",(8*234,9*160),(29,30,35))
labels=ImageDraw.Draw(contact)
for row,action in enumerate(SOURCE_ACTIONS):
    im=Image.open(SRC/(action+".png")).convert("RGBA")
    sw,sh=im.size
    if sw!=1672 or sh!=941:raise ValueError(f"wrong {action} sheet size: {im.size}")
    cw,ch=sw//4,sh//2
    frames=[]
    for index in range(8):
        cx=index%4;cy=index//4
        original=im.crop((cx*cw,cy*ch,(cx+1)*cw,(cy+1)*ch))
        rgba=np.array(original)
        fg=rgba[:,:,3]>38
        components,count=ndimage.label(fg)
        sizes=np.bincount(components.ravel());sizes[0]=0
        if not count or not np.max(sizes):raise ValueError(f"empty art: {action} {index}")
        biggest=np.argmax(sizes)
        keep=(components==biggest)
        threshold=max(100,int(sizes[biggest]*.002))
        for item in range(1,len(sizes)):
            if sizes[item]>=threshold:keep|=(components==item)
        keep=ndimage.binary_dilation(keep,iterations=3)
        rgba[:,:,3]=np.where(keep,rgba[:,:,3],0)
        art=Image.fromarray(rgba,"RGBA")
        rect=art.getchannel("A").getbbox()
        if not rect:raise ValueError(f"blank after cleanup: {action} {index}")
        cropped=art.crop(rect)
        if cropped.width>905 or cropped.height>485:
            raise ValueError(f"source frame too large to pad without scaling: {action} {index}")
        frame=Image.new("RGBA",(W,H),(0,0,0,0))
        frame.alpha_composite(cropped,((W-cropped.width)//2,512-cropped.height))
        filename=f"{action}_{index:02d}.webp"
        frame.save(DEST/filename,format="WEBP",lossless=True,method=0)
        frames.append({"file":"frames/"+filename,"pivotX":W//2,"footY":512,
                       "width":W,"height":H,"sourceFrame":index,"sourceBBox":rect})
        preview=frame.copy()
        preview.thumbnail((220,124),Image.Resampling.LANCZOS)
        tile=Image.new("RGBA",(234,150),(29,30,35,255))
        tile.alpha_composite(preview,((234-preview.width)//2,(140-preview.height)//2))
        contact.paste(tile.convert("RGB"),(index*234,row*160))
        labels.text((index*234+9,row*160+143),f"{action} {index+1}",fill="#ffedc6")
    manifest["actions"][action]=frames
(BASE/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
contact.save(BASE/"qa-contact.webp","WEBP",quality=88)
print("72 lossless padded independent transparent sprites exported; none resampled.")
