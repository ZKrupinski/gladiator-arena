"""Build lossless pixel ownership runs; PNG source files are never modified.
Requires Pillow, numpy and scipy. Run from any working directory.
"""
from pathlib import Path
import json
import hashlib
import heapq
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'public/assets/ludus-growth'
PREVIEW=Path('/tmp/gladiator-cut-review');PREVIEW.mkdir(exist_ok=True)
output={'version':2,'sheets':{}}
for path in sorted(SOURCE.glob('*.png')):
    rgba=np.array(Image.open(path).convert('RGBA'));h,w=rgba.shape[:2]
    mask=rgba[:,:,3]>=24
    opaque=bool((rgba[:,:,3]>250).mean()>.98)
    if opaque:
        # Remove only near-black matte connected to exterior/background. Enclosed
        # dark details remain part of the original fighter silhouette.
        black=rgba[:,:,:3].max(axis=2)<=22
        bg,n=ndi.label(black)
        counts=np.bincount(bg.ravel());counts[0]=0
        mask &= bg!=int(counts.argmax())
    labels,n=ndi.label(mask,structure=np.ones((3,3)))
    counts=np.bincount(labels.ravel());counts[0]=0
    large=np.flatnonzero(counts>15000)
    ownership=np.zeros((h,w),np.uint8)
    assignments={}
    markers=np.zeros((h,w),np.int32)
    for index in range(12):
        row,col=divmod(index,4);cx=(col+.59)*w/4;cy=(row+.57)*h/3
        yy,xx=np.mgrid[:h,:w]
        allowed=np.isin(labels,large)&(abs(xx-cx)<w*.1)&(abs(yy-cy)<h*.11)
        d=(xx-cx)**2+(yy-cy)**2;d[~allowed]=1e12
        sy,sx=np.unravel_index(d.argmin(),d.shape)
        assert allowed[sy,sx],(path,index)
        component=int(labels[sy,sx]);assignments.setdefault(component,[]).append(index)
        markers[sy,sx]=index+1
    assert len(assignments)==len(large),(path,large,assignments)
    for component,indices in assignments.items():
        region=labels==component
        if len(indices)==1:ownership[region]=indices[0]+1
        else:
            # Only touching silhouettes need watershed. Narrow contacts are cut
            # at their neck, rather than at an arbitrary equal-grid boundary.
            distance=ndi.distance_transform_edt(region)
            # Mask-constrained watershed: a full-image watershed can travel
            # through the exterior and incorrectly steal another pose's outline.
            split=np.zeros((h,w),np.uint8);queue=[];age=0
            for index in indices:
                sy,sx=np.argwhere(markers==index+1)[0]
                split[sy,sx]=index+1
                heapq.heappush(queue,(-distance[sy,sx],age,int(sy),int(sx),index+1));age+=1
            while queue:
                cost,_,y,x,owner=heapq.heappop(queue)
                for dy,dx in ((0,1),(0,-1),(1,0),(-1,0),(1,1),(1,-1),(-1,1),(-1,-1)):
                    ny,nx=y+dy,x+dx
                    if 0<=ny<h and 0<=nx<w and region[ny,nx] and not split[ny,nx]:
                        split[ny,nx]=owner
                        heapq.heappush(queue,(max(cost,-distance[ny,nx]),age,ny,nx,owner));age+=1
            ownership[region]=split[region]
    # Keep anti-alias pixels and tiny attached details only within 2 source pixels
    # of an assigned silhouette. Never keep a detached neighbour by size alone.
    dist,nearest=ndi.distance_transform_edt(ownership==0,return_indices=True)
    near=(ownership==0)&(dist<=2)&(rgba[:,:,3]>0)
    if opaque:near &= rgba[:,:,:3].max(axis=2)>10
    ownership[near]=ownership[tuple(nearest[:,near])]
    frames=[];raw=[]
    for index in range(12):
        yy,xx=np.where(ownership==index+1)
        assert len(xx)>15000,(path,index,len(xx))
        x0,x1=int(xx.min()),int(xx.max()+1);y0,y1=int(yy.min()),int(yy.max()+1)
        own=ownership[y0:y1,x0:x1]==index+1
        # Row runs avoid storing or resampling any artwork. Source RGBA pixels are
        # copied into isolated canvases with a transparent gutter at load time.
        runs=[]
        for y,line in enumerate(own):
            edge=np.diff(np.pad(line.astype(np.int8),(1,1)))
            for a,b in zip(np.flatnonzero(edge==1),np.flatnonzero(edge==-1)):
                runs.extend([int(y*(x1-x0)+a),int(b-a)])
        depth=ndi.distance_transform_edt(own)
        weights=depth**2
        pivot=float((weights*np.arange(x1-x0)[None,:]).sum()/weights.sum())
        frame={'box':[x0,y0,x1-x0,y1-y0],'pivotX':round(pivot,2),'runs':runs}
        frames.append(frame)
        cut=rgba[y0:y1,x0:x1].copy();cut[~own]=0
        raw.append(Image.fromarray(cut))
    # One shared scale for all poses: preserve attack reach, crouching and death
    # height, unlike individually stretching each trimmed rectangle to a square.
    scale=min(320/max(im.width for im in raw),330/max(im.height for im in raw))
    sheet=Image.new('RGB',(4*370,3*390),(45,48,54));draw=ImageDraw.Draw(sheet)
    for i,im in enumerate(raw):
        r,c=divmod(i,4);im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
        sheet.paste(im,(c*370+(370-im.width)//2,r*390+365-im.height),im)
        draw.text((c*370+8,r*390+8),f'{path.stem} / {i}',fill='white')
    sheet.save(PREVIEW/(path.stem+'.jpg'),quality=88)
    output['sheets'][path.stem]={'size':[w,h],'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'opaqueMatte':opaque,'frames':frames}
    print(path.stem,'12 frames', 'split contacts' if len(large)<12 else '',flush=True)
(SOURCE/'frame-cuts.json').write_text(json.dumps(output,separators=(',',':'))+'\n')
print('Metadata bytes:',(SOURCE/'frame-cuts.json').stat().st_size)
