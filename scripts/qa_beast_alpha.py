#!/usr/bin/env python3
"""Release gate: no second major alpha silhouette in ANY generated beast frame."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy import ndimage

root=Path('public/assets/beasts/individual')
data=json.loads((root/'manifest.json').read_text())
assert data['version']>=3 and data['count']==200
assert len(data['species'])==5
count=0
for kind,info in data['species'].items():
    assert len(info['actions'])==5,kind
    for action,record in info['actions'].items():
        paths=record['paths']
        assert len(paths)==8,(kind,action)
        for i,file in enumerate(paths):
            img=Image.open(Path('public')/file).convert('RGBA')
            assert img.size==(512,512),(kind,action,i,img.size)
            mask=np.asarray(img.getchannel('A'))>=35
            labels,n=ndimage.label(mask,structure=np.ones((3,3),dtype=np.uint8))
            sizes=np.bincount(labels.ravel(),minlength=n+1)
            sizes[0]=0
            dominant=int(sizes.max()) if len(sizes) else 0
            assert dominant>100,(kind,action,i,'missing subject')
            other=[int(x) for x in sizes[1:] if x>max(48,dominant*.02)]
            assert len(other)==1,(kind,action,i,'multiple silhouettes',sorted(other,reverse=True)[:4])
            count+=1
print('BEAST_ALPHA_200_SPRITES_CONNECTED_SILHOUETTE_PASS',count)
