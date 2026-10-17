#!/usr/bin/env python3
"""Register facial expressions for the stylized 5-head-tall Domina.

Alignment is defined by BOTH eye centres, nose and mouth (not neck, chin or
generic face-box centroid). Export only eye, nose-highlight and mouth pixels.
The approved face, hair, jaw, jewellery and hands otherwise remain unchanged.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import cv2
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'public/assets/ludus'
QA=ROOT/'docs/qa/domina-corrected'
QA.mkdir(parents=True,exist_ok=True)
BASE=Image.open(ART/'ludus_ui.webp').convert('RGBA')
W,H=BASE.size
assert (W,H)==(1448,1086)

# Landmark order: viewer-left eye, viewer-right eye, nose tip, mouth centre.
# These are native pixel coordinates in the APPROVED lobby key visual.
dst=np.float32([[339,365],[409,391],[388,396],[371,419]])
# Source PNG/WebP face-specific landmarks in each posed sprite; the head size
# and expression position vary per pose, especially in pose 5.
landmarks={
    0:[[147,84],[205,103],[178,106],[174,122]],
    1:[[144,87],[201,103],[175,107],[173,125]],
    2:[[145,95],[205,102],[177,111],[175,127]],
    3:[[150,91],[206,106],[181,114],[178,129]],
    4:[[154,99],[207,112],[181,117],[181,132]],
    5:[[152,113],[207,126],[180,133],[181,148]],
}
# Blurred feature masks in approved-image space, never a complete face oval.
# Cover original eyelashes and painted mouth so both original and new
# expressions cannot be simultaneously visible.
features=[
    (339,365,31,20,15),  # left eye
    (409,391,29,20,14),  # right eye
    (388,397,10,10,0),  # nose glint
    (371,420,30,18,10), # mouth
]
def overlay_mask():
    hard=np.zeros((H,W),np.uint8)
    for x,y,rx,ry,degrees in features:
        cv2.ellipse(hard,(x,y),(rx,ry),degrees,0,360,255,-1,cv2.LINE_AA)
    # 5px soft edge inside each tiny facial feature only; exclude neck/hair.
    return cv2.GaussianBlur(hard,(0,0),4).astype(np.float32)/255

mask=overlay_mask()
qa_data=[]
for pose in range(6):
    source=Image.open(ART/f'domina_{pose}.webp').convert('RGBA')
    src=np.float32(landmarks[pose])
    # Similarity transform using actual eyes first; nose and lips refine.
    M, inliers=cv2.estimateAffinePartial2D(src,dst,method=cv2.LMEDS)
    if M is None: raise RuntimeError(f'Landmark registration failed {pose}')
    projected=cv2.transform(src[None,:,:],M)[0]
    eye_distance=np.linalg.norm(projected[1]-projected[0])
    approved_eye_distance=np.linalg.norm(dst[1]-dst[0])
    residual=np.linalg.norm(projected-dst,axis=1)
    if abs(eye_distance-approved_eye_distance)>5:
        raise AssertionError((pose,eye_distance,approved_eye_distance))
    # Warp full sprite so the local eye/mouth pixels follow facial movement;
    # export only selected feature patches, not jaw, neck or hands.
    rgba=np.asarray(source)
    warped=cv2.warpAffine(rgba,M,(W,H),
        flags=cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT,
        borderValue=(0,0,0,0))
    if pose==0:
        warped[:,:,3]=0  # EXACT approved idle artwork, no change.
    elif pose in (3,4,5):
        # Some source smiles land above the fixed mouth landmarks, causing
        # doubled lips and an artificial jaw. Preserve the painted original
        # mouth/nose completely. Use only eye-expression differences here.
        eyes=np.zeros((H,W),np.uint8)
        for x,y,rx,ry,angle in features[:2]:
            cv2.ellipse(eyes,(x,y),(rx,ry),angle,0,360,255,-1,cv2.LINE_AA)
        eye_alpha=cv2.GaussianBlur(eyes,(0,0),4).astype(np.float32)/255
        warped[:,:,3]=np.clip(warped[:,:,3].astype(np.float32)*eye_alpha,0,255).astype('uint8')
    else:
        warped[:,:,3]=np.clip(warped[:,:,3].astype(np.float32)*mask,0,255).astype('uint8')
    overlay=Image.fromarray(warped,'RGBA')
    overlay.save(ART/f'domina_face_aligned_{pose}.webp','WEBP',lossless=True,method=6)
    comp=BASE.copy()
    comp.alpha_composite(overlay)
    comp.convert('RGB').save(QA/f'aligned_{pose}.webp','WEBP',quality=92)
    crop=comp.crop((228,260,492,495))
    crop.resize((528,470),Image.Resampling.NEAREST).convert('RGB').save(
        QA/f'zoom_{pose}.webp','WEBP',quality=91)
    # Markers show exact alignment to the source keyvisual (red=original,
    # green=warped expression landmarks) for numerical and human QA.
    proof=comp.convert('RGB')
    d=ImageDraw.Draw(proof)
    for p,q in zip(dst,projected):
        x,y=map(int,p); xx,yy=map(int,q)
        d.ellipse((x-6,y-6,x+6,y+6),outline='#ff3232',width=2)
        d.line((xx-4,yy,xx+4,yy),fill='#4cff44',width=2)
        d.line((xx,yy-4,xx,yy+4),fill='#4cff44',width=2)
    proof.crop((228,260,492,495)).resize((528,470),Image.Resampling.NEAREST).save(
        QA/f'debug_{pose}.webp','WEBP',quality=89)
    scale=np.linalg.norm(M[0,:2])
    qa_data.append((pose,round(float(scale),3),
        round(float(eye_distance),2),list(np.round(residual,2))))
    print('pose=',pose,'transform=',np.round(M,2),'per-point residual=',np.round(residual,2),
          'alpha pixels=',int(np.count_nonzero(warped[:,:,3])))
BASE.crop((228,260,492,495)).resize((528,470),Image.Resampling.NEAREST).convert('RGB').save(
    QA/'zoom_original.webp','WEBP',quality=95)
print('Landmark QA:',qa_data)
