"""Build nine independent 4x2 transparent 960x540 atlases from the supplied 8-frame sheets.
Keeps existing hero classes, source drawings and per-look identity untouched.
"""
import hashlib, json, os, sys, urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import cv2

SOURCES = {
 'sweep': ('28643.png','https://d2ol7oe51mr4n9.cloudfront.net/user_3KlCHKRIJO34SPkOC5UMUPo7vEp/73efdba6-591b-4f92-8450-27af735075a6.png'),
 'thrust': ('28635.png','https://d2ol7oe51mr4n9.cloudfront.net/user_3KlCHKRIJO34SPkOC5UMUPo7vEp/945e270e-5470-474a-a2d6-508b506ab8fe.png'),
 'slash': ('28636.png','https://d2ol7oe51mr4n9.cloudfront.net/user_3KlCHKRIJO34SPkOC5UMUPo7vEp/355f5d12-23b8-43ea-85b6-ba5111ed24a8.png'),
 'guard': ('28637.png','https://d2ol7oe51mr4n9.cloudfront.net/user_3KlCHKRIJO34SPkOC5UMUPo7vEp/fc8ac9f1-a837-452c-b4fa-cef403f3a100.png'),
 'hit': ('28638.png','https://d2ol7oe51mr4n9.cloudfront.net/user_3KlCHKRIJO34SPkOC5UMUPo7vEp/8e3cc7a9-8b6f-4cb2-a43c-694d84490b40.png'),
 'death': ('28639.png','https://d2ol7oe51mr4n9.cloudfront.net/user_3KlCHKRIJO34SPkOC5UMUPo7vEp/d0e171aa-e310-42a8-907d-7d6ff3a748bb.png'),
 'walk': ('28640.png','https://d2ol7oe51mr4n9.cloudfront.net/user_3KlCHKRIJO34SPkOC5UMUPo7vEp/9b9f495e-8658-4962-a354-54ba1e7a1716.png'),
 'heavy': ('28641.png','https://d2ol7oe51mr4n9.cloudfront.net/user_3KlCHKRIJO34SPkOC5UMUPo7vEp/63bdddf7-6293-4473-9180-d2981c0dbe4b.png'),
 'idle': ('28642.png','https://d2ol7oe51mr4n9.cloudfront.net/user_3KlCHKRIJO34SPkOC5UMUPo7vEp/b60d8c9e-3e9e-4b99-a4ea-269e34f9b414.png'),
}
EXPECTED_SOURCE_SHA256 = {'28643.png': '700dfa0ed4199a1b971eb4790ae95d05f8ff981f811d3881442c15c98262ad14', '28635.png': 'dfa66a0d949189c8cc04c2ce4695e3938d1928c05ff1edd1fc44a833e5486c9f', '28636.png': '79efeee4eba0683df15055731210b1ce50d699bd61293125596c5eddf46734cc', '28637.png': '2195ff22ee4861fb514a01149e5ab76d468fe9df911789d5180c474d28706be2', '28638.png': '68dd5d9498ed51367ff10587d72f079a5579c26fba03a9f65e0d1988e50c64ff', '28639.png': 'd0414c92d3b3a5bf821de2f7ab7e890989e1a9ea33a862f719c3b343205ef652', '28640.png': '8bfd49069bafeb627df5426285cf630994fa0e019238653649677bfc9adaccc1', '28641.png': 'a4ff1930efd96d0416278bfb30133994d79509ae1afda247ec42f6410bc2146e', '28642.png': '6e87fdbf183eefc5875d0ead731c6dabab7fed3f5f660fc25c5df1b48d186034'}
TILE_W,TILE_H = 960,540
X=[0,443,886,1330,1774];Y=[0,444,887]
CACHE=Path(os.environ.get('SPARTACUS_SOURCE_DIR','/tmp/redcrest-inputs'))
OUT=Path(os.environ.get('SPARTACUS_OUTPUT_DIR','public/assets/combat/murmillo-redcrest-alt-v1'))
CACHE.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)

def largest_alpha(frame):
    a=np.array(frame.convert('RGBA'))
    threshold=(a[:,:,3]>=20).astype('uint8')
    count,labels,stats,_=cv2.connectedComponentsWithStats(threshold,8)
    if count<2: raise ValueError('Frame has no silhouette')
    main=1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA]))
    keep=cv2.dilate((labels==main).astype('uint8'),np.ones((5,5),dtype='uint8'),iterations=1)
    removed=int(np.count_nonzero((a[:,:,3]>0)&(keep==0)))
    a[keep==0]=0
    a[a[:,:,3]<8]=0
    return Image.fromarray(a,'RGBA'),removed

def heavy_special(frame, index):
    # Original frame six's wide forward blade crosses the next sprite's rear foot.
    # Its leading edge belongs only to frame six. Never assign it to frame seven.
    if index==5:
        mask=Image.new('L',frame.size)
        d=ImageDraw.Draw(mask)
        d.rectangle((0,0,399,443),fill=255)
        d.polygon([(395,168),(412,178),(429,233),(429,305),(413,352),(395,354)],fill=255)
        d.polygon([(395,348),(407,352),(447,368),(479,387),(508,410),(506,434),(480,433),(437,431),(395,415)],fill=255)
        final=Image.new('RGBA',frame.size)
        final.paste(frame,(0,0),mask)
        return final
    if index==6:
        # This frame is intentionally extracted without intruding knife pixels.
        # Recover its sandal/foot from the matching 8th-frame recovery artwork.
        mask=Image.new('L',frame.size)
        d=ImageDraw.Draw(mask)
        d.polygon([(0,349),(18,356),(50,374),(74,396),(100,416),(100,434),(75,435),(35,433),(0,420)],fill=255)
        mask=mask.filter(ImageFilter.MaxFilter(3))
        blank=Image.new('RGBA',frame.size)
        frame.paste(blank,(0,0),mask)
    return frame

def trim_and_render(im,action):
    frames=[]; removed=[]
    for i in range(8):
        col=i%4; row=i//4
        x0,x1=X[col],X[col+1];y0,y1=Y[row],Y[row+1]
        if action=='heavy' and i==5:
            # Extend this one pose's own sword beyond x=886; never let it remain in frame seven.
            crop=im.crop((x0,y0,1005,y1))
            crop=heavy_special(crop,5)
        else:
            crop=im.crop((x0,y0,x1,y1))
            if action=='heavy' and i==6:
                # Adjacent sword intrudes into the LEFT of the 7th frame;
                # only remove that sliver rather than an entire foot silhouette.
                # Rear sole is protected separately by later canvas cropping.
                pass
        crop,rem=largest_alpha(crop)
        if action=='idle':
            # Slightly inset the transparency silhouette to eliminate bright scanline
            # fringes on the idle redraw. Never change the actual armor colors.
            a=np.array(crop)
            old=a[:,:,3].copy()
            tightened=cv2.erode(old,np.ones((3,3),dtype='uint8'),iterations=1)
            a[:,:,3]=tightened
            crop=Image.fromarray(a,'RGBA')
        bound=crop.getchannel('A').getbbox()
        if bound is None:raise ValueError(f'Empty {action} #{i+1}')
        frames.append(crop.crop(bound));removed.append(rem)
    # One consistent scale for all eight poses. Retain original aspect ratio, foot anchor.
    scale=min(502/max(f.height for f in frames),900/max(f.width for f in frames))
    atlas=Image.new('RGBA',(TILE_W*4,TILE_H*2),(0,0,0,0))
    boxes=[]
    for i,f in enumerate(frames):
        w,h=round(f.width*scale),round(f.height*scale)
        if w>930 or h>510:raise ValueError(f'bad cell dimensions: {action} {i} {(w,h)}')
        sized=f.resize((w,h),Image.Resampling.LANCZOS)
        x=(i%4)*TILE_W+(TILE_W-w)//2
        y=(i//4)*TILE_H+TILE_H-12-h
        atlas.alpha_composite(sized,(x,y))
        tile=atlas.crop(((i%4)*TILE_W,(i//4)*TILE_H,(i%4+1)*TILE_W,(i//4+1)*TILE_H))
        bbox=tile.getchannel('A').getbbox()
        if not bbox or bbox[0]<10 or bbox[1]<10 or bbox[2]>950 or bbox[3]>530:raise ValueError(f'overflow: {action} {i} {bbox}')
        boxes.append(bbox)
    return atlas,{'frames':8,'cell':[TILE_W,TILE_H],'removedForeignPixels':removed,'bounds':boxes}

def heavy_fixed_atlas(src):
    # Surgical reconstruction of the authored eight cells: reclaim wide blade
    # for its owner (frame 6), remove sword leakage from frame 7, restore toe
    # pixels from the following recovery frame. No redrawing, no changed armor.
    work=src.copy()
    mask=Image.new('L',src.size,0)
    d=ImageDraw.Draw(mask)
    d.polygon([(886,793),(901,801),(936,818),(960,829),(978,840),(993,858),
               (994,876),(974,879),(930,875),(886,862)],fill=255)
    mask=mask.filter(ImageFilter.MaxFilter(5))
    seven=src.copy()
    seven.paste(Image.new('RGBA',src.size),(0,0),mask)
    fmask=Image.new('L',src.size,0)
    ImageDraw.Draw(fmask).polygon([(911,812),(934,809),(957,813),(983,819),
      (1000,837),(1011,863),(1001,877),(917,877)],fill=255)
    fmask=fmask.filter(ImageFilter.GaussianBlur(2.0))
    patch=Image.new('RGBA',src.size)
    patch.alpha_composite(src.crop((1360,765,1515,880)),dest=(905,769))
    seven=Image.composite(patch,seven,fmask)
    m6=Image.new('L',src.size)
    d=ImageDraw.Draw(m6)
    d.rectangle((489,444,885,885),fill=255)
    d.polygon([(883,612),(898,622),(914,677),(915,749),(899,791),(883,795)],fill=255)
    d.polygon([(883,792),(895,796),(935,812),(967,831),(996,854),
      (992,875),(968,877),(925,875),(883,859)],fill=255)
    frame6=Image.new('RGBA',src.size);frame6.paste(src,(0,0),m6)
    m5=Image.new('L',src.size)
    d=ImageDraw.Draw(m5)
    d.rectangle((0,444,442,885),fill=255)
    d.polygon([(439,784),(461,796),(489,808),(499,826),(502,859),
               (469,872),(439,872)],fill=255)
    frame5=Image.new('RGBA',src.size);frame5.paste(src,(0,0),m5)
    frames=[];removed=[]
    for i in range(8):
        x0,x1=X[i%4],X[i%4+1]
        y0,y1=(0,444) if i<4 else (444,887)
        if i==4:frame=frame5.crop((0,y0,520,y1))
        elif i==5:frame=frame6.crop((486,y0,1005,y1))
        elif i==6:frame=seven.crop((886,y0,1330,y1))
        else:frame=src.crop((x0,y0,x1,y1))
        frame,rem=largest_alpha(frame)
        box=frame.getchannel('A').getbbox()
        if not box:raise ValueError(f'empty heavy frame {i+1}')
        frames.append(frame.crop(box));removed.append(rem)
    scale=min(502/max(f.height for f in frames),930/max(f.width for f in frames))
    out=Image.new('RGBA',(3840,1080))
    boxes=[]
    for i,f in enumerate(frames):
        w,h=round(f.width*scale),round(f.height*scale)
        sized=f.resize((w,h),Image.Resampling.LANCZOS)
        xx=i%4*960+(960-w)//2;yy=i//4*540+540-h-12
        out.alpha_composite(sized,(xx,yy))
        tile=out.crop((i%4*960,i//4*540,(i%4+1)*960,(i//4+1)*540))
        b=tile.getchannel('A').getbbox()
        if b[0]<10 or b[1]<10 or b[2]>950 or b[3]>530:raise ValueError(f'heavy frame boundary {i+1}: {b}')
        boxes.append(b)
    return out,{'frames':8,'cell':[960,540],'removedForeignPixels':removed,'bounds':boxes}

qa={}
for action,(filename,url) in SOURCES.items():
    local=CACHE/filename
    if not local.exists():
        with urllib.request.urlopen(url,timeout=60) as stream:local.write_bytes(stream.read())
    checksum=hashlib.sha256(local.read_bytes()).hexdigest()
    if checksum!=EXPECTED_SOURCE_SHA256[filename]:
        raise ValueError('Source file integrity mismatch: '+filename)
    src=Image.open(local).convert('RGBA')
    if src.size!=(1774,887):raise ValueError(f'Invalid source size {action}: {src.size}')
    if action=='heavy':
        out,check=heavy_fixed_atlas(src)
    else:
        out,check=trim_and_render(src,action)
    path=OUT/(action+'.png');out.save(path,optimize=True)
    check['sha256']=hashlib.sha256(path.read_bytes()).hexdigest()
    qa[action]=check
manifest={'character':'murmillo_redcrest_alt_v1','version':2,'approved':True,
 'artStatus':'NINE_DISTINCT_USER_SUPPLIED_SHEETS_WITH_FIXED_HEAVY',
 'actions':list(SOURCES),'framesPerAction':8,
 'sourceNote':'2026-10-27 user supplied independent drawings; only alt slot replaced',
 'qa':'qa-redcrest-alt.json'}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(OUT/'qa-redcrest-alt.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2)+'\n')
print('VALIDATED',len(qa),'sheets',sum(x['frames'] for x in qa.values()),'frames')
for name,check in qa.items():print(name,check['sha256'][:12],sum(check['removedForeignPixels']))