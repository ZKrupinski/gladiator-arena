"""Remove ONLY the baked fake trainer speech panel from the approved backdrop.
The rest of the training room remains bit-for-bit equivalent in decoded RGB;
no character or tile artwork is modified. Live DOM dialogue replaces the panel.
"""
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

BASE=Path(__file__).resolve().parents[1]/'public/assets/ludus'
ORIGINAL=BASE/'training_no_doctore.webp'
OUTPUT=BASE/'training_no_dialogue_v1.webp'

def main():
    original=Image.open(ORIGINAL).convert('RGB')
    assert original.size==(1672,941),'Unexpected approved training key-art dimensions'
    frame=np.asarray(original).copy()
    mask=np.zeros((941,1672),dtype=np.uint8)
    # Speech frame, left-facing ornamental pointer, gold border and baked text.
    # Keep the arena facade, title ribbon and five training tiles untouched.
    points=np.array([
      [513,91],[827,91],[841,101],[842,218],[836,228],
      [519,231],[506,218],[487,205],[493,190],
      [485,182],[509,174],[509,114]
    ],dtype=np.int32)
    cv2.fillPoly(mask,[points],255)
    mask=cv2.dilate(mask,np.ones((9,9),np.uint8),iterations=1)
    repaired=cv2.inpaint(frame[:,:,::-1].copy(),mask,9,cv2.INPAINT_TELEA)[:,:,::-1]
    # Do not alter a single background pixel outside the speech panel.
    repaired[mask==0]=frame[mask==0]
    Image.fromarray(repaired,'RGB').save(OUTPUT,format='WEBP',lossless=True,method=6)
    test=np.asarray(Image.open(OUTPUT).convert('RGB'))
    assert test.shape==frame.shape
    assert np.array_equal(test[mask==0],frame[mask==0]),'Background changed outside fake text'
    print('APPROVED_TRAINING_DIALOGUE_ERASED',OUTPUT.stat().st_size,
          'mask_pixels',int((mask>0).sum()))

if __name__=='__main__':
    main()
