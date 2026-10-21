#!/usr/bin/env python3
"""Convert nine approved SpriteForge V3 wolf actions into the LIVE game's atlas pack.

Single command builds assets (no game JS changes required). --publish will use
Spartacus uploader to version-check, commit and verify the deployed game.
This cannot turn low-resolution legacy art into native high-resolution art.
"""
from __future__ import annotations
import argparse, json, sys, tempfile
from pathlib import Path
from PIL import Image, ImageSequence

from spartacus_uploader import UploadError, publish_files, REPO

ACTIONS=("idle","walk","attack1","attack2","attack3","attack4","hit","death","roar")
DEST="public/assets/beasts/wolf-v3/"
NATIVE_MIN=768
MIN_MARGIN=12

def convert(source: Path, preview: Path):
    """Fail closed if frames would bleed across grid seams or be tiny."""
    source=Path(source).resolve()
    if not source.is_dir(): raise UploadError("WOLF_SOURCE_DIRECTORY_MISSING")
    preview=Path(preview).resolve()
    preview.mkdir(parents=True,exist_ok=True)
    payload={}
    qa={"character":"wolf","version":3,"actions":{},"releaseAuthorized":False}
    for action in ACTIONS:
        png=source/(action+".png")
        webp=source/(action+".webp")
        if png.exists(): src=png
        elif webp.exists(): src=webp
        else:raise UploadError("WOLF_ACTION_NOT_PRESENT: "+action)
        with Image.open(src) as original:
            if original.mode!="RGBA":
                raise UploadError("WOLF_SOURCE_MUST_BE_RGBA: "+action)
            w,h=original.size
            if (w<4*NATIVE_MIN or h<2*NATIVE_MIN or w%4 or h%2 or
                w//4<NATIVE_MIN or h//2<NATIVE_MIN):
                raise UploadError("SPRITEFORGE_V3_NATIVE_HIGH_RES_NOT_MET: "+
                                  action+f" ({w}x{h}, required at least 3072x1536)")
            cw,ch=w//4,h//2
            alpha=original.getchannel("A")
            cells=[]
            snapshots=[]
            for i in range(8):
                x=(i%4)*cw;y=(i//4)*ch
                frame=original.crop((x,y,x+cw,y+ch))
                a=frame.getchannel("A")
                bbox=a.getbbox()
                if bbox is None:
                    raise UploadError("EMPTY_WOLF_POSE: "+action+"/"+str(i))
                if (bbox[0]<MIN_MARGIN or bbox[1]<MIN_MARGIN or
                    bbox[2]>cw-MIN_MARGIN or bbox[3]>ch-MIN_MARGIN):
                    raise UploadError("SPRITEFORGE_FRAME_OWNERSHIP_EDGE_RISK: "+
                                      action+"/"+str(i)+" bbox="+str(bbox))
                cells.append({"index":i,"bounds":list(bbox),"cellPixels":[cw,ch]})
                snapshots.append(frame)
            # Fast manual QA preview; not a substitute for artist approval.
            gif=(preview/(action+".gif"))
            snapshots[0].save(gif,save_all=True,append_images=snapshots[1:],
                              optimize=True,disposal=2,duration=110,loop=0)
            output=preview/(action+".webp")
            original.save(output,"WEBP",lossless=True,quality=100,method=5)
            payload[DEST+action+".webp"]=output.read_bytes()
            qa["actions"][action]={"source":str(src),"nativeSize":[w,h],
                                   "cells":cells,"preview":str(gif)}
    manifest={
        "version":3,
        "source":"approved SpriteForge V3 single-action high-resolution 4x2 sheets",
        "actions":{action:action+".webp" for action in ACTIONS},
    }
    manifest_bytes=(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n").encode()
    payload[DEST+"manifest.json"]=manifest_bytes
    (preview/"manifest.json").write_bytes(manifest_bytes)
    (preview/"technical-qa.json").write_text(
        json.dumps(qa,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    return payload,qa

def main():
    parser=argparse.ArgumentParser(description="Import exactly 9 complete 4x2 wolf motions to live Spartacus game")
    parser.add_argument("--source",required=True,help="folder with idle.png, walk.png, attack1..4.png, hit.png, death.png, roar.png")
    parser.add_argument("--review-out",default="/tmp/spartacus-wolf-v3-review")
    parser.add_argument("--publish",action="store_true",help="actually change GitHub main and verify Cloudflare")
    parser.add_argument("--confirm",action="store_true",help="explicitly authorize production release")
    parser.add_argument("--art-reviewed",action="store_true",help="all 9 GIF previews have been inspected and approved")
    parser.add_argument("--expected-sha",help="optional locked GitHub main SHA for concurrency safety")
    opts=parser.parse_args()
    try:
        data,qa=convert(Path(opts.source),Path(opts.review_out))
        if opts.publish:
            if not (opts.confirm and opts.art_reviewed):
                raise UploadError("WOLF_RELEASE_REQUIRES_CONFIRMED_VISUAL_ART_REVIEW")
            result=publish_files(data,confirm=True,expected_sha=opts.expected_sha)
        else:
            result={"state":"TECHNICAL_CHECK_PASSED_WAITING_FOR_VISUAL_APPROVAL",
                    "repo":REPO,"previewDir":opts.review_out,
                    "actions":list(qa["actions"]),"releaseAuthorized":False}
        print(json.dumps(result,ensure_ascii=False,indent=2))
        return 0 if result.get("deployment",{}).get("state")!="UNVERIFIED" else 3
    except Exception as exc:
        print(json.dumps({"state":"FAILED","reason":str(exc)},ensure_ascii=False),file=sys.stderr)
        return 2
if __name__=="__main__":sys.exit(main())
