"""Extract ONLY the original Murmillo combat-ready key pose for animation design.
No redrawing, rescaling of a complete crowded atlas, or neighboring cell bleed.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import base64, io, json
root=Path(__file__).resolve().parents[1]
src=root/'public/assets/ludus-growth'
out=root/'docs/qa/murmillo-animation-reference'
out.mkdir(parents=True,exist_ok=True)
cut_data=json.loads((src/'frame-cuts.json').read_text())
key='murmillo_a_L5'
sheet=cut_data['sheets'][key]
image=Image.open(src/(key+'.png')).convert('RGBA')
assert tuple(image.size)==tuple(sheet['size'])
poses=[]
for idx,spec in enumerate(sheet['frames']):
    x,y,w,h=spec['box']
    color=image.crop((x,y,x+w,y+h))
    alphas=bytearray(w*h)
    for pos,length in zip(spec['runs'][::2],spec['runs'][1::2]):
        alphas[pos:pos+length]=b'\xff'*length
    silhouette=Image.frombytes('L',(w,h),bytes(alphas))
    # Original sheet may already have transparent edges; multiply preserves them.
    from PIL import ImageChops
    color.putalpha(ImageChops.multiply(color.getchannel('A'),silhouette))
    poses.append(color)
reference=poses[0]
assert reference.width>150 and reference.height>150
# Native original pose, no generated replacement art.
reference.save(out/'murmillo_L5_idle_original.png')
# Visually enlarged solely for inspection and reference; source PNG remains native.
factor=min(3.2,950/max(reference.size))
enlarged=reference.resize((round(reference.width*factor),round(reference.height*factor)),Image.Resampling.LANCZOS)
enlarged.save(out/'murmillo_L5_idle_visual.webp','WEBP',quality=93)
# Tiny transfer copy for model preview/verification via connected tools.
for quality in (85,75,65,55,45,35):
    b=io.BytesIO();enlarged.save(b,'WEBP',quality=quality,method=5)
    if len(b.getvalue())<45000:break
(out/'murmillo_L5_idle_ref.b64.txt').write_text(base64.b64encode(b.getvalue()).decode('ascii'))
cell_w,cell_h=340,345
contact=Image.new('RGB',(cell_w*4,cell_h*3),'#30383f')
d=ImageDraw.Draw(contact)
for i,pose in enumerate(poses):
    r,c=divmod(i,4)
    k=min(320/pose.width,310/pose.height)
    small=pose.resize((round(pose.width*k),round(pose.height*k)),Image.Resampling.LANCZOS)
    xx=c*cell_w+(cell_w-small.width)//2
    yy=r*cell_h+325-small.height
    contact.paste(small,(xx,yy),small)
    d.text((c*cell_w+9,r*cell_h+8),f'MURMILLO L5 / original key {i:02}',fill='#ffffff')
contact.save(out/'murmillo_L5_all_original_poses.webp','WEBP',quality=83)
print('MURMILLO L5 SOURCE',image.size,'keypose',reference.size,'visual',enlarged.size,'encoded transfer bytes',len(b.getvalue()))
