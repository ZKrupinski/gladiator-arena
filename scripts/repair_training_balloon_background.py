#!/usr/bin/env python3
"""Repair the BAKED brown interior at left of the training speech balloon.
Only the existing background bitmap is edited; characters/UI are untouched.
"""
from PIL import Image, ImageChops
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'public/assets/ludus/training_blank_v71.webp'
DEST=ROOT/'public/assets/ludus/training_blank_v74.webp'
def repair(src):
    if src.size!=(1672,941): raise ValueError(f'Unexpected canvas {src.size}')
    old=src.convert('RGB')
    out=old.copy()
    # Painted speech balloon spans approximately x506..819, y99..228.
    # Replace only its brown LEFT INNER face; preserve outline and tail.
    L,R,T,B=516,555,106,204
    for y in range(T,B):
        vertical=min(1.,(y-T+1)/3.,(B-y)/5.)
        for x in range(L,R):
            donor=old.getpixel((558+(x-L)//2,y))
            pixel=old.getpixel((x,y))
            horizontal=min(1.,(x-L+1)/2.,(R-x)/9.)
            alpha=min(1.,horizontal*vertical)
            out.putpixel((x,y),tuple(round(pixel[i]*(1-alpha)+donor[i]*alpha) for i in range(3)))
    changed=ImageChops.difference(old,out).getbbox()
    if not changed or not(L<=changed[0]<changed[2]<=R and T<=changed[1]<changed[3]<=B):
        raise AssertionError(f'Repair changed unexpected area: {changed}')
    print('PARCHMENT_PIXEL_REPAIR_PASS',changed,
          'before',old.getpixel((522,154)),
          'after',out.getpixel((522,154)),
          'sample',old.getpixel((562,154)),flush=True)
    return out
if __name__=='__main__':
    source=Image.open(SOURCE)
    output=repair(source)
    output.save(DEST,'WEBP',lossless=True,method=6)
    restored=Image.open(DEST).convert('RGB')
    assert restored.size==(1672,941)
    assert restored.getpixel((100,300))==source.convert('RGB').getpixel((100,300))
    print('TRAINING_V74_WEBP_READY',DEST.stat().st_size,flush=True)
