"""Extract seven isolated poses without changing a pixel of the approved original.
Use alpha components rather than rectangular crops; the fifth image is the sole
wide, straight-whip contact frame. Generated assets are lossless RGBA PNG.
"""
from pathlib import Path
from hashlib import sha256
import json
import numpy as np
from PIL import Image
from scipy import ndimage

BASE=Path(__file__).resolve().parents[1]/'public/assets/ludus'
SRC=BASE/'doctore-whip-user-v1.png'
DST=BASE/'doctore-whip-clean-v2'
EXPECTED='4866225fe2d9184c627ed68c84cdcfe305ee3f3452c0bf23844bd11f9dcddf52'

def main():
    assert sha256(SRC.read_bytes()).hexdigest()==EXPECTED,'Approved PNG modified'
    pixels=np.array(Image.open(SRC).convert('RGBA'))
    assert pixels.shape==(1086,1448,4)
    labels,_=ndimage.label(pixels[:,:,3]>=16,structure=np.ones((3,3),dtype=np.uint8))
    sizes=np.bincount(labels.ravel())
    selected=np.argsort(sizes[1:])[-7:]+1
    selected=sorted(selected,key=lambda k:(
        int(np.mean(np.where(labels==k)[0])>=570),
        float(np.mean(np.where(labels==k)[1]))))
    assert len(selected)==7 and min(int(sizes[k]) for k in selected)>60000
    closest=np.full(labels.shape,np.inf,dtype=np.float32)
    nearest=np.full(labels.shape,-1,dtype=np.int8)
    for ix,k in enumerate(selected):
        distance=ndimage.distance_transform_edt(labels!=k).astype(np.float32)
        fresh=distance<closest
        closest[fresh]=distance[fresh]
        nearest[fresh]=ix
    DST.mkdir(parents=True,exist_ok=True)
    manifest=[]
    for ix in range(7):
        inside=(pixels[:,:,3]>0)&(nearest==ix)&(closest<=28)
        yx=np.argwhere(inside)
        y0,x0=yx.min(axis=0);y1,x1=yx.max(axis=0)+1
        x0=max(0,int(x0)-5);y0=max(0,int(y0)-5)
        x1=min(1448,int(x1)+5);y1=min(1086,int(y1)+5)
        chunk=pixels[y0:y1,x0:x1].copy()
        chunk[~inside[y0:y1,x0:x1]]=0
        Image.fromarray(chunk,'RGBA').save(DST/('frame-%d.png'%ix),optimize=True)
        manifest.append({'frame':ix,'x':x0,'y':y0,'width':x1-x0,'height':y1-y0})
    assert manifest[4]['width']>=800,'Extended lash must be one wide pose'
    (DST/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    assert sha256(SRC.read_bytes()).hexdigest()==EXPECTED
    print('WHIP_ISOLATION_OK',json.dumps(manifest))

if __name__=='__main__':
    main()
