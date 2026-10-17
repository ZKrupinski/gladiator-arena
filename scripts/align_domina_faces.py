#!/usr/bin/env python3
"""Create Domina expressions exclusively FROM THE APPROVED LOBBY'S OWN PIXELS.

The previous attempt transferred eyes from *other drawings* of the 5-head-tall
character, causing geometry mismatch. This version changes the exact two
eyes already present in the lobby: no copied face, no facial repositioning,
no change of mouth, nose, scale, jaw, neck, hair or hand. Each frame is a
native-coordinate alpha delta, not a second portrait.

Asset 0: exact source face (empty alpha)
Asset 1: short blink
Asset 2: left-eye wink
Asset 3: right-eye wink
Asset 4: gentle squint
Asset 5: intentionally neutral (no patch, reserved for compatibility)
"""
from pathlib import Path
from PIL import Image
import numpy as np
import cv2

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'public/assets/ludus'
QA=ROOT/'docs/qa/domina-corrected'
QA.mkdir(parents=True,exist_ok=True)
base_pil=Image.open(ART/'ludus_ui.webp').convert('RGBA')
W,H=base_pil.size
assert (W,H)==(1448,1086)
base_rgba=np.array(base_pil)
base_rgb=base_rgba[...,:3].copy()
base_bgr=cv2.cvtColor(base_rgb,cv2.COLOR_RGB2BGR)

# These are the true pixel-space eye positions in the 1448x1086 source art.
# No source-sprite coordinates, resize factor or neck anchor is ever used.
eyes=[
 dict(cx=339,cy=365,rx=28,ry=15,angle=14),
 dict(cx=409,cy=391,rx=27,ry=16,angle=19),
]
def feature_ellipse(eye,pad=0):
    canvas=np.zeros((H,W),np.uint8)
    cv2.ellipse(canvas,(eye['cx'],eye['cy']),
        (eye['rx']+pad,eye['ry']+pad),eye['angle'],
        0,360,255,-1,cv2.LINE_AA)
    return canvas

def closed_frame(eye_index):
    e=eyes[eye_index]
    eye_mask=feature_ellipse(e,2)
    # Restore skin from nearby *original* cheek and eyelid colors.
    # The inpaint radius is local and cannot alter the skull silhouette.
    clean=cv2.inpaint(base_bgr,eye_mask,6,cv2.INPAINT_TELEA)
    clean=cv2.cvtColor(clean,cv2.COLOR_BGR2RGB)
    # Draw a soft up-curved eyelash along the actual original eye centre.
    x0=e['cx']; y0=e['cy']
    angle=np.deg2rad(e['angle'])
    stroke=np.zeros((H,W,3),np.uint8)
    samples=[]
    for t in np.linspace(-1,1,35):
        q=t*e['rx']*.86
        local_y=-3.0 + 4.8*t*t
        x=x0+q*np.cos(angle)-local_y*np.sin(angle)
        y=y0+q*np.sin(angle)+local_y*np.cos(angle)
        samples.append((round(x),round(y)))
    # Strongest in centre, narrowing toward corner.
    for i in range(len(samples)-1):
        thick=max(1,round(3.5*(1-abs((i+0.5)/(len(samples)-1)*2-1)*.46)))
        cv2.line(clean,samples[i],samples[i+1],(80,48,44),thick,cv2.LINE_AA)
    # Soft blush/eyelid crease just above the lash, matching skin colors.
    crease=[]
    for t in np.linspace(-.8,.8,25):
        q=t*e['rx']*.83
        local_y=-9.0 + 3*t*t
        x=x0+q*np.cos(angle)-local_y*np.sin(angle)
        y=y0+q*np.sin(angle)+local_y*np.cos(angle)
        crease.append((round(x),round(y)))
    cv2.polylines(clean,[np.array(crease,np.int32)],False,(156,109,100),1,cv2.LINE_AA)
    # Feather inside the exact ocular mask (not a large whole-head ellipse).
    alpha=cv2.GaussianBlur(eye_mask,(0,0),2.7).astype(np.float32)/255.
    return clean,alpha

blink=[closed_frame(i) for i in range(2)]
def compose(indices,strength=1.):
    result=base_rgb.astype(np.float32).copy()
    combined=np.zeros((H,W),np.float32)
    for i in indices:
        color,alpha=blink[i]
        alpha=np.clip(alpha*strength,0,1)
        result=result*(1-alpha[...,None])+color.astype(np.float32)*alpha[...,None]
        combined=np.maximum(combined,alpha)
    out=result.clip(0,255).astype(np.uint8)
    return out,combined

states=[
 ([],0.0),      # literal unchanged source
 ([0,1],1.0),   # genuine simultaneous blink
 ([0],1.0),     # wink left
 ([1],1.0),     # wink right
 ([0,1],.48),   # a small relaxed squint
 ([],0.0),      # neutral reserved for old cached clients
]
original_crop=base_pil.crop((228,260,492,495))
original_crop.resize((528,470),Image.Resampling.NEAREST).convert('RGB').save(
 QA/'zoom_original.webp','WEBP',quality=95)
for idx,(chosen,amt) in enumerate(states):
    rgb,alpha=compose(chosen,amt)
    # Delta on precisely those eye pixels. Mouth and nose never become
    # foreign drawing parts and cannot be double-rendered.
    canvas=np.dstack([rgb,np.rint(alpha*255).astype(np.uint8)])
    if idx in (0,5):
        canvas[...,3]=0
    output=Image.fromarray(canvas,'RGBA')
    output.save(ART/f'domina_face_aligned_{idx}.webp','WEBP',
                lossless=True,method=6)
    result=base_pil.copy()
    result.alpha_composite(output)
    result.convert('RGB').save(QA/f'aligned_{idx}.webp','WEBP',quality=91)
    close=result.crop((228,260,492,495))
    close.resize((528,470),Image.Resampling.NEAREST).save(
        QA/f'zoom_{idx}.webp','WEBP',quality=94)
    if idx==0: assert np.array_equal(np.asarray(result),base_rgba)
    # Verify pixels outside a 78x57 area at each eye were not touched.
    pixels_changed=np.any(np.asarray(result)[...,:3]!=base_rgb,axis=2)
    allowed=np.zeros((H,W),np.uint8)
    for eye in eyes:
        cv2.ellipse(allowed,(eye['cx'],eye['cy']),
            (eye['rx']+13,eye['ry']+13),eye['angle'],0,360,255,-1)
    bad=int(np.count_nonzero(pixels_changed&(allowed==0)))
    if bad: raise AssertionError(f'Frame {idx}: {bad} changed pixels outside eye landmarks')
    print('pose',idx,'alpha pixels',np.count_nonzero(canvas[...,3]),
          'changed pixels',int(np.count_nonzero(pixels_changed)),
          'off-target pixels',bad)
print('All expressions are native-pixel transformations of approved key visual.')
