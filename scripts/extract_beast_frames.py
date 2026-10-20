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
    """Cut the actual connected character silhouette, not its rectangular cell.

    Adjacent ghost feet/heads are separate components. Keep the dominant
    center-owned connected subject and only *tiny interior* separated details.
    Never keep a foreign component simply because its bbox is within 11px.
    """
    left,right=round(col*CX),round((col+1)*CX)
    top,bottom=round(row*CY),round((row+1)*CY)
    x0,x1=max(0,left-27),min(W,right+27)
    y0,y1=max(0,top-19),min(H,bottom+19)
    crop=np.array(sheet.crop((x0,y0,x1,y1)).convert('RGBA'))
    alpha=crop[:,:,3]
    labels,total=ndimage.label(alpha>=24,structure=np.ones((3,3),dtype=np.uint8))
    if not total:raise ValueError(f'empty {row=} {col=}')
    sizes=np.bincount(labels.ravel(),minlength=total+1);sizes[0]=0
    yy,xx=np.ogrid[y0:y1,x0:x1]
    # The actual actor must own the center of its specified animation cell.
    centre=(xx>=left+CX*.15)&(xx<=right-CX*.15)&(yy>=top+CY*.12)&(yy<=bottom-CY*.12)
    core=np.bincount(labels[np.broadcast_to(centre,labels.shape)].ravel(),minlength=total+1)
    core[0]=0
    main=int(np.argmax(core+.03*sizes))
    keep=labels==main
    ys,xs=np.where(keep)
    if len(xs)<50:raise ValueError(f'tiny main sprite {row=} {col=}')
    bb=(int(xs.min()),int(xs.max()),int(ys.min()),int(ys.max()))
    removed=0;keptSmall=0
    # Neighboring-frame leftovers are typically independent LARGE islands.
    # Detached pixels are only preserved if tiny and visually INSIDE the
    # central body bounds (ear highlight etc.), never outside as a second paw.
    for component in range(1,total+1):
        if component==main:continue
        size=int(sizes[component])
        if size<=0:continue
        py,px=np.where(labels==component)
        bx=(int(px.min()),int(px.max()),int(py.min()),int(py.max()))
        inside=(bx[0]>=bb[0]-3 and bx[1]<=bb[1]+3 and
                bx[2]>=bb[2]-3 and bx[3]<=bb[3]+3)
        tiny=size<=max(8,int(sizes[main]*.003))
        inowncell=(left+CX*.07<x0+(bx[0]+bx[1])/2<right-CX*.07 and
                   top+CY*.05<y0+(bx[2]+bx[3])/2<bottom-CY*.05)
        if inside and tiny and inowncell:
            keep|=(labels==component);keptSmall+=size
        else:
            removed+=size
    # Keep the original antialiased outline, not jagged hard alpha edges.
    padded=ndimage.binary_dilation(keep,iterations=2)
    crop[~padded]=0
    base=Image.new('RGBA',(256,256))
    dx=round((256-CX)/2+x0-left)
    dy=round((256-CY)/2+y0-top)
    base.alpha_composite(Image.fromarray(crop),(dx,dy))
    result=base.resize((512,512),Image.Resampling.LANCZOS)
    # In the final published canvas the actor should not contain a second
    # independent substantial blob. Export explicit metrics for QC.
    mask=np.asarray(result.getchannel('A'))>=35
    cleanLabels,n=ndimage.label(mask,structure=np.ones((3,3),dtype=np.uint8))
    counts=np.bincount(cleanLabels.ravel(),minlength=n+1)
    if len(counts):counts[0]=0
    large=sorted((int(x) for x in counts[1:] if x>max(48,int(mask.sum()*.02))),reverse=True)
    if len(large)>1:
        raise ValueError(f'Unowned substantial silhouette components in {row=} {col=} sizes={large[:4]}')
    return result,{"removedForeignPixels":removed,"retainedTinyPixels":keptSmall,
                   "largestComponentPixels":int(sizes[main]),"secondaryAfter":len(large)-1}

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
    manifest={'version':3,'source':'approved 1586x992 8x5 original art','pixelSize':[512,512],
              'nativePerCellResolution':'~198x198','upscale':'LANCZOS 2x; not redrawn',
              'actions':list(ACTIONS),'species':{},'count':200,'warnings':[]}
    for kind in KINDS:
        sheet=Image.open(ROOT/(kind+'-40.png')).convert('RGBA')
        assert sheet.size==(W,H),f'{kind}: wrong source size'
        spec={}
        for row,action in enumerate(ACTIONS):
            dst=OUT/kind/action;dst.mkdir(parents=True,exist_ok=True)
            pixels=[];removedTotal=0
            for col in range(8):
                frame,clean=separate(sheet,row,col)
                removedTotal+=clean['removedForeignPixels']
                frame.save(dst/f'{col:02}.png',compress_level=4)
                ink=int(np.count_nonzero(np.asarray(frame.getchannel('A'))>30))
                pixels.append(ink)
                if row==0 and col==0:
                    thumb(frame).save(OUT/kind/'thumb.png',compress_level=4)
            spec[action]={'paths':[f'assets/beasts/individual/{kind}/{action}/{i:02}.png' for i in range(8)],'visiblePixels':pixels,'removedForeignPixels':removedTotal}
            if min(pixels)<200:manifest['warnings'].append(f'{kind}/{action} low ink at {[i for i,n in enumerate(pixels) if n<200]}')
        manifest['species'][kind]={'thumbnail':f'assets/beasts/individual/{kind}/thumb.png','actions':spec}
        print(kind,' / '.join(f'{a} min={min(spec[a]["visiblePixels"])}' for a in ACTIONS),flush=True)
    (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print('200_FRAMES_PUBLISHED_LOCAL',len(manifest['warnings']),flush=True)
    print('GHOST_COMPONENT_PIXELS_REMOVED',sum(action['removedForeignPixels'] for beast in manifest['species'].values() for action in beast['actions'].values()),flush=True)
if __name__=='__main__':main()
