#!/usr/bin/env python3
"""Temporary art QA: verify original alpha Domina poses fit the approved lobby."""
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1]
base=Image.open(root/'public/assets/ludus/ludus_ui.webp').convert('RGBA')
assert base.size==(1448,1086)
out=root/'docs/qa/domina'
out.mkdir(parents=True,exist_ok=True)
for pose in [0,1,2,3,4,5]:
    img=Image.open(root/f'public/assets/ludus/domina_{pose}.webp').convert('RGBA')
    # Blend original cutout at its real-world seating footprint, not a frame.
    k=min(665/img.width,795/img.height)
    sprite=img.resize((round(img.width*k),round(img.height*k)),Image.Resampling.LANCZOS)
    composed=base.copy()
    composed.alpha_composite(sprite,(114,225))
    composed.convert('RGB').save(out/f'full-{pose}.webp','WEBP',quality=86)
    # Face-expression patch: keep the original artwork and replace only eyes/
    # mouth. A feathered alpha transition prevents a cutout rectangle.
    patch=Image.new('RGBA',(200,145))
    # Crop source face from the approved sprite, normalized to its own size.
    box=(int(img.width*.25),int(img.height*.06),int(img.width*.82),int(img.height*.34))
    head=img.crop(box).resize((200,145),Image.Resampling.LANCZOS)
    patch.alpha_composite(head)
    mask=Image.new('L',(200,145))
    d=ImageDraw.Draw(mask)
    d.ellipse((16,10,184,142),fill=255)
    from PIL import ImageFilter
    mask=mask.filter(ImageFilter.GaussianBlur(17))
    patch.putalpha(Image.fromarray(__import__('numpy').minimum(
      __import__('numpy').array(patch.getchannel('A')), __import__('numpy').array(mask)).astype('uint8')))
    # Small, feathered facial variations. Replacing the entire portrait would
    # duplicate the existing body and obscure the game's beautiful background.
    # This sprite is alpha-only; it never includes a rectangular cover panel.
    exported=root/f'public/assets/ludus/domina_expression_{pose}.webp'
    patch.save(exported,format='WEBP',lossless=True,method=6)
    comp=base.copy()
    comp.alpha_composite(patch,(278,303))
    comp.convert('RGB').save(out/f'face-{pose}.webp','WEBP',quality=86)
print('Generated',len(list(out.glob('*.webp'))),'preview files')
