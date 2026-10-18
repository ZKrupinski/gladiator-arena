#!/usr/bin/env python3
"""Export 12 independent Murmillo combat sprites from the approved L5 source.
No warping, inpainting, adjacent-cell bleed, or resizing.
Each transparent file keeps the original foot-pivot coordinates.
"""
from pathlib import Path
import json
from collections import Counter
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public/assets/ludus-growth"
DEST = ROOT / "public/assets/combat/murmillo-v2"
DEST.mkdir(parents=True, exist_ok=True)
KEY = "murmillo_a_L5"
NAMES = ("idle", "walk", "slash", "sweep", "thrust", "heavy",
         "guard", "hit", "dodge", "ready", "victory", "defeat")
GUTTER = 12

def remove_flat_edge_blocks(tile):
    """Exclude low-alpha rectangular atlas spill while preserving antialiasing
    near solid source-art silhouettes. This operates only at asset build time.
    """
    alpha=tile.getchannel("A")
    core=alpha.point(lambda v:255 if v>=225 else 0)
    # Keep original feather, weapon, shield and cloth antialiasing within 8px
    # of real opaque artwork. Unattached translucent colour bars disappear.
    keep=core.filter(ImageFilter.MaxFilter(17))
    clean=ImageChops.multiply(alpha,keep)
    before=alpha.histogram()
    after=clean.histogram()
    removed=sum(before[1:])-sum(after[1:])
    tile.putalpha(clean)
    return tile,removed,1

# Conservative per-pose right-side alpha limits, measured on the native
# exported artwork (coordinates include the 12px transparent gutter).
# The original sword/shield always stays inside the retained region.
RIGHT_LIMITS = {
 0:[(0,401),(12,350),(96,343),(135,348),(177,395),(340,395),(372,370),(414,356)],
 1:[(0,395),(12,348),(106,342),(139,348),(179,390),(355,390),(392,361),(413,340)],
 2:[(0,429),(12,384),(99,380),(136,390),(180,423),(358,423),(392,396),(419,382)],
 3:[(0,337),(12,318),(94,314),(124,319),(173,334),(324,334),(365,326),(385,315)],
 4:[(0,456),(12,370),(99,370),(133,370),(199,397),(240,453),(291,453),(328,397),(364,392)],
 5:[(0,365),(12,313),(101,312),(134,334),(178,353),(331,354),(375,337),(385,337)],
 6:[(0,361),(12,312),(105,307),(142,329),(186,355),(328,355),(372,331),(386,331)],
 7:[(0,346),(12,328),(111,326),(162,336),(304,340),(346,337),(364,331)],
 8:[(0,419),(12,399),(116,399),(166,413),(275,411),(313,378),(322,374)],
 9:[(0,369),(12,298),(113,298),(155,348),(201,361),(327,361),(372,345),(384,342)],
10:[(0,368),(12,276),(113,279),(146,337),(186,360),(325,361),(359,348),(368,343)],
11:[(0,360),(12,333),(112,332),(155,344),(277,348),(316,343),(325,339)]
}
def remove_outside_artwork_right(tile,pose_idx):
    knots=RIGHT_LIMITS[pose_idx]
    w,h=tile.size
    p=tile.load()
    removed=0
    for y in range(h):
        yy=y+GUTTER
        j=0
        while j<len(knots)-2 and yy>knots[j+1][0]:j+=1
        y0,x0=knots[j];y1,x1=knots[j+1]
        t=max(0,min(1,(yy-y0)/max(1,y1-y0)))
        edge=max(0,min(w,round(x0+(x1-x0)*t-GUTTER)))
        for x in range(edge,w):
            r,g,b,a=p[x,y]
            if a:removed+=1;p[x,y]=(r,g,b,0)
    return tile,removed

cut = json.loads((SRC / "frame-cuts.json").read_text(encoding="utf-8"))
sheet = cut["sheets"][KEY]
original = Image.open(SRC / f"{KEY}.png").convert("RGBA")
assert tuple(sheet["size"]) == original.size
assert len(sheet["frames"]) == len(NAMES) == 12
rows = []
quality = []
for idx, (name, spec) in enumerate(zip(NAMES, sheet["frames"])):
    x, y, w, h = spec["box"]
    assert 0 <= x and 0 <= y and x+w <= original.width and y+h <= original.height
    cutout = original.crop((x,y,x+w,y+h))
    alpha = bytearray(w*h)
    for offset, length in zip(spec["runs"][::2], spec["runs"][1::2]):
        row, col = divmod(offset, w)
        assert row < h and col + length <= w
        alpha[offset:offset+length] = b"\xff"*length
    mask = Image.frombytes("L", (w,h), bytes(alpha))
    cutout.putalpha(ImageChops.multiply(cutout.getchannel("A"), mask))
    pixel_hist=Counter()
    pix=cutout.load()
    for yy in range(h):
        for xx in range(int(w*.74),w):
            rr,gg,bb,aa=pix[xx,yy]
            if aa>=40:pixel_hist[(rr//8*8,gg//8*8,bb//8*8)]+=1
    hottest=[{"rgb":list(rgb),"count":n} for rgb,n in pixel_hist.most_common(12)]
    cutout,removed,colors=remove_flat_edge_blocks(cutout)
    cutout,clipped=remove_outside_artwork_right(cutout,idx)
    removed+=clipped
    edge_info=[]
    px=cutout.load()
    for fy in (.07,.17,.29,.43,.57,.71,.86,.94):
        yy=min(h-1,int(h*fy))
        xx=w-1
        while xx>=0 and px[xx,yy][3]<40:xx-=1
        if xx<0:continue
        base=px[xx,yy]
        length=0
        for kk in range(xx,-1,-1):
            col=px[kk,yy]
            if col[3]<20 or max(abs(col[j]-base[j]) for j in range(3))>18:break
            length+=1
        edge_info.append({"y":yy,"x":xx,"rgba":list(base),"near_run18":length})
    quality.append({"pose":name,"flat_colours":colors,"removed_pixels":removed,"source_area":w*h,"edge":edge_info,"top_edge_colours":hottest})
    print(f"cleanup {name}: removed {removed} flat-colour pixels from {colors} atlas colours",flush=True)
    assert cutout.getchannel("A").getbbox(), f"Empty pose: {name}"
    padded = Image.new("RGBA", (w+GUTTER*2, h+GUTTER*2), (0,0,0,0))
    padded.alpha_composite(cutout, (GUTTER,GUTTER))
    assert padded.getpixel((0,0))[3] == 0
    filename = f"{idx:02d}-{name}.webp"
    padded.save(DEST / filename, "WEBP", lossless=True, method=6)
    rows.append({
        "name": name, "file": filename, "pivotX": spec["pivotX"]+GUTTER,
        "footY": h+GUTTER, "width": padded.width, "height": padded.height
    })
manifest = {
    "version": 2, "source": KEY, "cellWidth": sheet["size"][0]/4,
    "cellHeight": sheet["size"][1]/3, "frames": rows
}
(DEST / "qa-report.json").write_text(json.dumps(quality,indent=2)+"\n",encoding="utf-8")
(DEST / "manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("exported",len(rows),"independent alpha-isolated sprites",DEST,flush=True)
