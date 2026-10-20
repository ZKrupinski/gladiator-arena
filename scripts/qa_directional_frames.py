"""Verify exported pixels, gutter safety, unique frames and disjoint source cuts."""
from pathlib import Path
from PIL import Image
import numpy as np
import json, hashlib
root=Path(__file__).resolve().parents[1]
base=root/'public/assets/new-era/directional-v4'
m=json.loads((base/'manifest.json').read_text())
report={}
for kind,family in m['families'].items():
 source=np.array(Image.open(root/f'docs/vfx-v4/sources/{kind}.png').convert('RGBA'))
 source[source[:,:,3]<=2]=0
 h,w=source.shape[:2]
 if kind=='parry':
  for col in (1,2,3): source[:,round(w*col/4)-18:round(w*col/4)+19]=0
  source[round(h/2)-18:round(h/2)+19,:]=0
  source[:18]=0;source[-18:]=0;source[:,:18]=0;source[:,-18:]=0
 ownership=np.zeros((h,w),np.uint8);signatures=[];margins=[]
 for frame in family['frames']:
  p=base/frame['file'];data=np.array(Image.open(p))
  assert data.shape==(512,512,4)
  a=data[:,:,3]
  assert not (a[:20].any() or a[-20:].any() or a[:,:20].any() or a[:,-20:].any()),p
  assert np.count_nonzero(a>8)>100,p
  digest=hashlib.sha256(p.read_bytes()).hexdigest();assert digest==frame['sha256']
  signatures.append(digest);margins.append(frame['margin'])
  x0,y0,x1,y1=frame['sourceRect'];dx,dy=frame['paste']
  ownership[y0:y1,x0:x1]+=1
  assert ownership.max()<=1,'overlapping source ownership'
  assert np.array_equal(data[dy:dy+y1-y0,dx:dx+x1-x0],source[y0:y1,x0:x1]),p
  # Full source art must be inset from the original sheet border too.
  assert x0>0 and y0>0 and x1<w and y1<h,(kind,frame,'source edge clipping')
 assert len(set(signatures))==8,(kind,'duplicate frames')
 assert np.all(ownership[source[:,:,3]>0]==1),(kind,'discarded or unassigned paint')
 report[kind]={'frames':8,'minimumTransparentMargin':min(margins),'sourcePixelsPreserved':True}
(root/'docs/vfx-v4/pixel-qa.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS: 80 distinct PNGs, all source paint assigned exactly once; transparent gutters, no original-sheet clipping.')
