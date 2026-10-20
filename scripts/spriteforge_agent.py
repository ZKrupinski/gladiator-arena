#!/usr/bin/env python3
"""GLADIATOR SpriteForge Agent: automated, conservative, non-destructive asset QA.

Usage: python scripts/spriteforge_agent.py --manifest wolf_sources.json --out /tmp/wolf_agent
The agent calls this CLI; no user-operated browser is required.
It NEVER paints missing poses, erases artifacts, or releases incomplete art.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np

ACTIONS=("idle","walk","run","attack_bite","attack_claw","attack_leap",
         "hit","stagger","death","special_roar")
FPS={"idle":6,"walk":10,"run":14,"attack_bite":14,"attack_claw":14,
     "attack_leap":12,"hit":10,"stagger":8,"death":10,"special_roar":8}
ALPHA_CUTOFF=28
OUT_W,OUT_H=960,720
SAFE_MARGIN=12

def subject_metrics(tile, margin=SAFE_MARGIN):
    a=np.asarray(tile.getchannel("A"))
    mask=a>=ALPHA_CUTOFF
    yy,xx=np.where(mask)
    h,w=a.shape
    fail=[];warnings=[]
    if len(xx)<max(160, int(h*w*.0005)):
        return {"bbox":None,"alpha":int(len(xx)),"margins":[],
                "fail":["MISSING_OR_TINY_SUBJECT"],"warn":[]}
    bbox=[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)]
    margins=[bbox[0],w-bbox[2],bbox[1],h-bbox[3]]
    if min(margins)<margin:
        fail.append("FRAME_BORDER_TOUCH__REGENERATE_SOURCE")
    # A conservative alpha component test. Small disconnected jewelry, tail and
    # floating cloth fragments are allowed; substantial duplicated silhouettes
    # receive an explicit review warning.
    try:
        from scipy.ndimage import label
        ids,n=label(mask,np.ones((3,3),dtype=np.uint8))
        if n:
            freq=np.bincount(ids.ravel()); freq[0]=0
            big=np.sort(freq[freq>max(220,len(xx)*.18)])[::-1]
            if len(big)>=2:
                warnings.append("MULTIPLE_LARGE_ALPHA_ISLANDS__INSPECT_FOR_DUPLICATE")
    except ImportError:
        warnings.append("SCIPY_ABSENT_COMPONENT_SCAN_SKIPPED")
    return {"bbox":bbox,"alpha":int(len(xx)),"margins":margins,
            "fail":fail,"warn":warnings}

def grid_frames(src:Path, manifest_mode:str):
    im=Image.open(src).convert("RGBA")
    if manifest_mode=="eight_files":
        raise ValueError("eight_files uses separate list")
    w,h=im.size
    if min(w,h)<512: raise ValueError("source too low-resolution; do not upscale blindly")
    out=[]
    for i in range(8):
        x0=round((i%4)*w/4);x1=round((i%4+1)*w/4)
        y0=round((i//4)*h/2);y1=round((i//4+1)*h/2)
        out.append(im.crop((x0,y0,x1,y1)))
    return out

def load_action(source,root):
    if isinstance(source,list):
        if len(source)!=8:raise ValueError("independent-frame input must contain 8 files")
        return [Image.open(root/p).convert("RGBA") for p in source]
    return grid_frames(root/source,"sheet")

def canvas_frame(tile,frame_scale):
    target=Image.new("RGBA",(OUT_W,OUT_H))
    tw=max(1,round(tile.width*frame_scale))
    th=max(1,round(tile.height*frame_scale))
    if tw>OUT_W-20 or th>OUT_H-20:
        raise ValueError("frame exceeds destination resolution")
    art=tile.resize((tw,th),Image.Resampling.LANCZOS) if (tw,th)!=tile.size else tile
    target.alpha_composite(art,((OUT_W-tw)//2,OUT_H-30-th))
    return target

def strip_preview(frames,action,out):
    thumbs=[]
    for f in frames:
        thumb=f.copy();thumb.thumbnail((430,320),Image.Resampling.LANCZOS)
        thumbs.append(thumb)
    board=Image.new("RGBA",(4*450,2*355),(35,29,28,255))
    d=ImageDraw.Draw(board)
    for i,im in enumerate(thumbs):
        x=(i%4)*450+(450-im.width)//2
        y=(i//4)*355+24+(315-im.height)//2
        board.alpha_composite(im,(x,y))
        d.text(((i%4)*450+8,(i//4)*355+5),
               f"{action}  {i+1}/8",fill=(255,224,176,255))
    board.convert("RGB").save(out/f"contact_{action}.jpg",quality=88)
    gifs=[]
    for f in frames:
        preview=f.copy();preview.thumbnail((400,300),Image.Resampling.LANCZOS)
        # GIF palette with solid backdrop for consistent playback.
        base=Image.new("RGB",(400,300),(40,35,34))
        base.paste(preview,((400-preview.width)//2,(300-preview.height)//2),preview)
        gifs.append(base)
    gifs[0].save(out/f"preview_{action}.gif",save_all=True,append_images=gifs[1:],
                 duration=round(1000/FPS.get(action,10)),loop=0,optimize=True)

def compare_frames(tiles):
    """Find exact duplicates, not subjective similarities."""
    hashes=[hashlib.sha256(t.tobytes()).hexdigest() for t in tiles]
    duplicates=[]
    for j in range(8):
        for i in range(j):
            if tiles[i].size==tiles[j].size and hashes[i]==hashes[j]:
                duplicates.append([i+1,j+1])
    return duplicates

def run(spec_path,outdir,expected=ACTIONS):
    spec_path=Path(spec_path).resolve()
    srcdir=spec_path.parent
    spec=json.loads(spec_path.read_text(encoding="utf-8"))
    character=spec.get("character","unnamed")
    out=Path(outdir).resolve();out.mkdir(parents=True,exist_ok=True)
    outputs=out/"preview_frames";outputs.mkdir(exist_ok=True)
    sources=spec.get("actions",{})
    summary={"tool":"SpriteForge Agent v1.0","character":character,
             "source_spec":str(spec_path),"expected":list(expected),"actions":{},
             "unprovided":[],"blocked":[],"machinePassed":[],
             "fullGameReplacementAllowed":False,"destructiveChanges":False}
    for action in expected:
        if action not in sources:
            summary["unprovided"].append(action);continue
        print(f"[SPRITEFORGE] inspecting {character}/{action}",flush=True)
        try:
            tiles=load_action(sources[action],srcdir)
            stats=[subject_metrics(t) for t in tiles]
            exact=compare_frames(tiles)
            if exact:
                for i,j in exact:
                    for idx in (i-1,j-1):
                        if "DUPLICATE_SOURCE_FRAME" not in stats[idx]["fail"]:
                            stats[idx]["fail"].append("DUPLICATE_SOURCE_FRAME")
            # Lock scale within action. No recentering/auto cropping per pose.
            factor=min(1,(OUT_W-60)/max(t.width for t in tiles),
                       (OUT_H-75)/max(t.height for t in tiles))
            rendered=[canvas_frame(t,factor) for t in tiles]
            action_dir=outputs/action;action_dir.mkdir(exist_ok=True)
            for k,f in enumerate(rendered):
                f.save(action_dir/f"{k:02}.png",compress_level=5)
            strip_preview(rendered,action,out)
            invalid=sorted(set(i+1 for i,s in enumerate(stats) if s["fail"] or s["warn"]))
            entry={"files":8,"status":"MACHINE_PASS" if not invalid else "BLOCKED",
                   "unverifiedArtistQuality":True,"frameSize":[OUT_W,OUT_H],
                   "frameChecks":stats,"issuesOnFrames":invalid,
                   "exactDuplicatePairs":exact,"fps":FPS[action]}
            summary["actions"][action]=entry
            (summary["machinePassed"] if not invalid else summary["blocked"]).append(action)
        except Exception as exc:
            summary["actions"][action]={"status":"BLOCKED","reason":str(exc)}
            summary["blocked"].append(action)
    # Even if all geometry checks pass, do not assert subjective art consistency.
    summary["fullGameReplacementAllowed"]=False
    summary["reason"]="Agent must also inspect all contact sheets visually; missing and blocked poses prohibit release."
    (out/"qa.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding="utf-8")
    missing=len(summary["unprovided"]);blocked=len(summary["blocked"])
    print(json.dumps({"character":character,"machinePass":summary["machinePassed"],
                       "blocked":summary["blocked"],"missing":summary["unprovided"],
                       "complete":False,"report":str(out/"qa.json")},
                     ensure_ascii=False,indent=2))
    return 2 if blocked or missing else 0

if __name__=="__main__":
    ap=argparse.ArgumentParser(description="Noninteractive sprite QA & atlas packaging for GLADIATOR")
    ap.add_argument("--manifest",required=True,help="JSON: character and actions {idle: filename.png, ...}")
    ap.add_argument("--out",required=True)
    ap.add_argument("--allow-partial",action="store_true",help="Return 0 even if actions are incomplete; reports remain blocked.")
    a=ap.parse_args()
    ret=run(a.manifest,a.out)
    raise SystemExit(0 if a.allow_partial else ret)
