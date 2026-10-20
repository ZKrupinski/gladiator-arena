"""Package reviewed ImageGen art into isolated PNGs; never synthesize effect art.

Find empty source gutters rather than assuming an AI atlas has uniform cells.
Keep a common nominal grid pivot and native pixels (no per-frame normalization).
"""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import json, hashlib, shutil, sys

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/new-era/directional-v4'
SOURCES = ROOT / 'docs/vfx-v4/sources'
FILES = {
 'slash':'exec-7cc27e51-6280-4205-afee-f7ea62339ad4.png',
 'sweep':'exec-1a8016e7-9945-44ae-813b-c450a59e694f.png',
 'thrust':'exec-d0e84e70-2758-4b30-86a8-12e6ec6da270.png',
 'hit':'exec-c876b7a6-d407-4fef-84dc-e684b6fd08e9.png',
 'guard':'exec-9adcaac4-0d0d-4765-a1a8-2badfd4fd067.png',
 'parry':'exec-b9d381d5-2abb-4e54-87f7-f6a615a1ac71.png',
 'finisher':'exec-bf62a293-8555-42e6-a8a2-11ea4058a4b5.png',
 'dash':'exec-560ddbe4-bdcd-4e99-8c85-cae98919b206.png',
 'victory':'exec-df8560e3-5ee7-41fe-bcdf-581e8232077e.png',
 'special':'exec-48634c86-948b-44cb-bdb5-f1f29cb0a54b.png',
}
OUT.mkdir(parents=True, exist_ok=True)
SOURCES.mkdir(parents=True, exist_ok=True)
if len(sys.argv)>1:
 for kind,name in FILES.items(): shutil.copy2(Path(sys.argv[1])/name,SOURCES/(kind+'.png'))

def gap(projection, nominal, radius=60):
 lo,hi=max(0,round(nominal-radius)),min(len(projection),round(nominal+radius))
 # Prefer an entirely empty run, nearest the nominal boundary.
 candidates=[]; start=None
 for x in range(lo,hi+1):
  empty=x<hi and projection[x]==0
  if empty and start is None: start=x
  if not empty and start is not None:
   if x-start>=4: candidates.append((start,x))
   start=None
 assert candidates, ('No safe gutter',nominal)
 a,b=min(candidates,key=lambda ab:abs((ab[0]+ab[1])/2-nominal))
 return (a+b)//2

manifest={'version':'4.0.0','frameSize':512,'frames':8,'families':{}}
for kind in FILES:
 im=Image.open(SOURCES/(kind+'.png')).convert('RGBA')
 pix=np.array(im); h,w=pix.shape[:2]
 # Remove <=2/255 alpha quantization specks in otherwise empty source gutters.
 # The painted antialiasing and glow above that noise floor remain unchanged.
 pix[pix[:,:,3]<=2]=0
 # The parry source has isolated ruler-like seams on grid lines. Exclude ONLY
 # those reviewed 36px gutter strips, far outside the effect silhouettes.
 if kind=='parry':
  for col in (1,2,3): pix[:,round(w*col/4)-18:round(w*col/4)+19]=0
  pix[round(h/2)-18:round(h/2)+19,:]=0
  pix[:18]=0;pix[-18:]=0;pix[:,:18]=0;pix[:,-18:]=0
 im=Image.fromarray(pix)
 a=pix[:,:,3]
 ymid=gap(np.count_nonzero(a>0,axis=1),h/2,75)
 ys=[0,ymid,h]; entries=[]
 sheet=Image.new('RGBA',(2048,1024))
 contact=Image.new('RGB',(1280,680),(23,28,36)); pen=ImageDraw.Draw(contact)
 for row in range(2):
  projection=np.count_nonzero(a[ys[row]:ys[row+1]]>0,axis=0)
  xs=[0]+[gap(projection,w*c/4,70) for c in (1,2,3)]+[w]
  for col in range(4):
   index=row*4+col
   rect=(xs[col],ys[row],xs[col+1],ys[row+1])
   region=im.crop(rect); box=region.getbbox(); assert box
   # Keep ALL alpha, including faint glow, inside the selected source region.
   source=(rect[0]+box[0],rect[1]+box[1],rect[0]+box[2],rect[1]+box[3])
   ink=im.crop(source)
   # Constant native-scale grid origin preserves animation growth and motion.
   dx=round(256 + source[0] - (col+.5)*w/4)
   dy=round(256 + source[1] - (row+.5)*h/2)
   assert min(dx,dy,512-dx-ink.width,512-dy-ink.height)>=20,(kind,index,'unsafe margin',dx,dy,ink.size)
   frame=Image.new('RGBA',(512,512));frame.paste(ink,(dx,dy))
   path=OUT/f'{kind}-{index:02}.png';frame.save(path,optimize=True)
   sheet.paste(frame,(col*512,row*512))
   thumb=frame.resize((300,300),Image.Resampling.LANCZOS)
   contact.paste(thumb,(col*320+10,row*340+28),thumb)
   pen.rectangle((col*320+9,row*340+27,col*320+310,row*340+328),outline='#537082')
   pen.text((col*320+16,row*340+8),f'{kind} / {index+1:02}',fill='#f5cf83')
   entries.append({'file':path.name,'sourceRect':list(source),'paste':[dx,dy],
    'bounds':list(frame.getbbox()),'margin':min(dx,dy,512-dx-ink.width,512-dy-ink.height),
    'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
 sheet.save(OUT/f'{kind}-sheet.png',optimize=True)
 contact.save(ROOT/f'docs/vfx-v4/{kind}-review.jpg',quality=92)
 manifest['families'][kind]={'sourceSize':[w,h],'frames':entries}
 print(kind,'8 frames; minimum transparent margin:',min(e['margin'] for e in entries))
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
