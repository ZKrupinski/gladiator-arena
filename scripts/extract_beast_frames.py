#!/usr/bin/env python3
"""VENATIO: separate all approved original 5x8 RGBA pose sheets into independent 512px PNGs.
Original sheet pixels are retained and resampled 2x; the script does not invent extra source details.
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT=Path(__file__).resolve().parents[1]/'public/assets/beasts'
OUT=ROOT/'individual'
KINDS=('wolf','leopard','tiger','lion','elephant')
ACTIONS=('idle','walk','attack','hit','defeat')
W,H,CX,CY=1586,992,1586/8,992/5

def separate(sheet,row,col):
    left,right=round(col*CX),round((col+1)*CX)
    top,bottom=round(row*CY),round((row+1)*CY)
    x0,x1=max(0,left-27),min(W,right+27)
    y0,y1=max(0,top-19),min(H,bottom+19)
    crop=np.array(sheet.crop((x0,y0,x1,y1)).convert('RGBA'))
    labels,total=ndimage.label(crop[:,:,3]>18,structure=np.ones((3,3),dtype='uint8'))
    if not total:raise ValueError(f'empty {row=} {col=}')
    counts=np.bincount(labels.ravel());counts[0]=0
    yy,xx=np.ogrid[y0:y1,x0:x1]
    center=(xx>=left+CX*.18)&(xx<=right-CX*.18)&(yy>=top+CY*.12)&(yy<=bottom-CY*.12)
    core=np.bincount(labels[np.broadcast_to(center,labels.shape)].ravel(),minlength=total+1);core[0]=0
    main=int(np.argmax(core+.04*counts))
    keep=(labels==main)
    ys,xs=np.where(keep)
    if len(xs)<20:raise ValueError(f'tiny main {row=} {col=}')
    bbox=(xs.min(),ys.min(),xs.max(),ys.max())
    for i in range(1,total+1):
        if i==main or counts[i]<max(12,counts[main]*.005):continue
        yy,xx=np.where(labels==i)
        if not len(xx):continue
        bx=(xx.min(),yy.min(),xx.max(),yy.max())
        centreX=x0+(bx[0]+bx[2])/2
        centreY=y0+(bx[1]+bx[3])/2
        near=(bx[0]<bbox[2]+12 and bx[2]>bbox[0]-12 and bx[1]<bbox[3]+12 and bx[3]>bbox[1]-12)
        belongs=(left-CX*.13<centreX<right+CX*.13 and top-CY*.12<centreY<bottom+CY*.12)
        if near and belongs:keep|=(labels==i)
    keep=ndimage.binary_dilation(keep,iterations=2)
    crop[~keep]=0
    base=Image.new('RGBA',(256,256))
    dx=round((256-CX)/2+x0-left)
    dy=round((256-CY)/2+y0-top)
    base.alpha_composite(Image.fromarray(crop),(dx,dy))
    return base.resize((512,512),Image.Resampling.LANCZOS)

def thumb(frame):
    arr=np.asarray(frame.getchannel('A'))
    yy,xx=np.where(arr>20)
    if not len(xx):raise ValueError('missing thumbnail art')
    box=(max(0,int(xx.min())-12),max(0,int(yy.min())-12),min(512,int(xx.max())+13),min(512,int(yy.max())+13))
    picture=frame.crop(box)
    scale=min(570/picture.width,365/picture.height)
    picture=picture.resize((round(picture.width*scale),round(picture.height*scale)),Image.Resampling.LANCZOS)
    bg=Image.new('RGBA',(600,400))
    bg.alpha_composite(picture,((600-picture.width)//2,380-picture.height))
    return bg

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    manifest={'version':2,'source':'approved 1586x992 8x5 original art','pixelSize':[512,512],
              'nativePerCellResolution':'~198x198','upscale':'LANCZOS 2x; not redrawn',
              'actions':list(ACTIONS),'species':{},'count':200,'warnings':[]}
    for kind in KINDS:
        sheet=Image.open(ROOT/(kind+'-40.png')).convert('RGBA')
        assert sheet.size==(W,H),f'{kind}: wrong source size'
        spec={}
        for row,action in enumerate(ACTIONS):
            dst=OUT/kind/action;dst.mkdir(parents=True,exist_ok=True)
            pixels=[]
            for col in range(8):
                frame=separate(sheet,row,col)
                frame.save(dst/f'{col:02}.png',compress_level=4)
                ink=int(np.count_nonzero(np.asarray(frame.getchannel('A'))>30))
                pixels.append(ink)
                if row==0 and col==0:
                    thumb(frame).save(OUT/kind/'thumb.png',compress_level=4)
            spec[action]={'paths':[f'assets/beasts/individual/{kind}/{action}/{i:02}.png' for i in range(8)],'visiblePixels':pixels}
            if min(pixels)<200:manifest['warnings'].append(f'{kind}/{action} low ink at {[i for i,n in enumerate(pixels) if n<200]}')
        manifest['species'][kind]={'thumbnail':f'assets/beasts/individual/{kind}/thumb.png','actions':spec}
        print(kind,' / '.join(f'{a} min={min(spec[a]["visiblePixels"])}' for a in ACTIONS),flush=True)
    (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print('200_FRAMES_PUBLISHED_LOCAL',len(manifest['warnings']),flush=True)
if __name__=='__main__':main()
