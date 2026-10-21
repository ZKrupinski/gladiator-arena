#!/usr/bin/env python3
"""Convert nine approved SpriteForge V3 wolf actions into the LIVE game's atlas pack.

Single command builds assets (no game JS changes required). --publish will use
Spartacus uploader to version-check, commit and verify the deployed game.
Art dimensions are unrestricted; source detail is never invented by upscaling.
"""
from __future__ import annotations
import argparse, json, sys, tempfile
from pathlib import Path
from PIL import Image, ImageSequence

from spartacus_uploader import UploadError, publish_files, REPO
from spriteforge_connected_mask_v6 import extract_owned_frames, OwnershipError

ACTIONS=("idle","walk","attack1","attack2","attack3","attack4","hit","death","roar")
DEST="public/assets/beasts/wolf-v3/"
MIN_MARGIN=12

def convert(source: Path, preview: Path):
    """Fail closed on bad alpha, incomplete frames or seams, never on small size."""
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
            if not w or not h or w%4 or h%2:
                raise UploadError("WOLF_ATLAS_INVALID_4x2_GRID: "+action)
            # The atlas grid is a FRAME-SEED map, never a hard-cutting tool.
            # Extract all owned connected alpha directly from the entire sheet
            # before assembling new padded action cells.
            try:
                snapshots, ownership=extract_owned_frames(original)
            except OwnershipError as err:
                raise UploadError("SPRITEFORGE_CONNECTED_MASK_QA_FAILED: "+action+
                                  " "+str(err)) from err
            ow,oh=snapshots[0].size
            cells=[]
            normalized=Image.new("RGBA",(ow*4,oh*2))
            for i,frame in enumerate(snapshots):
                bbox=frame.getchannel("A").getbbox()
                if bbox is None:
                    raise UploadError("EMPTY_WOLF_POSE: "+action+"/"+str(i))
                edge_margin=min(MIN_MARGIN,max(1,min(ow,oh)//20))
                if (bbox[0]<edge_margin or bbox[1]<edge_margin or
                    bbox[2]>ow-edge_margin or bbox[3]>oh-edge_margin):
                    raise UploadError("SPRITEFORGE_FRAME_OWNERSHIP_EDGE_RISK: "+
                                      action+"/"+str(i)+" bbox="+str(bbox))
                cells.append({"index":i,"bounds":list(bbox),
                              "cellPixels":[ow,oh],
                              "sourceOwner":ownership["frameOwners"][i]})
                normalized.alpha_composite(frame,((i%4)*ow,(i//4)*oh))
            # Animation previews and game atlas must use the EXACT SAME frames.
            gif=preview/(action+".gif")
            snapshots[0].save(gif,save_all=True,append_images=snapshots[1:],
                              optimize=True,disposal=2,duration=110,loop=0)
            output=preview/(action+".webp")
            normalized.save(output,"WEBP",lossless=True,quality=100,method=5)
            payload[DEST+action+".webp"]=output.read_bytes()
            qa["actions"][action]={"source":str(src),"nativeSize":[w,h],
                                   "cells":cells,"preview":str(gif),
                                   "connectedAlphaOwnership":ownership,
                                   "finalSheetPixels":list(normalized.size)}
    manifest={
        "version":3,
        "source":"approved SpriteForge V6 connected-mask cuts from whole 4x2 sheets",
        "extractionPolicy":"UNIQUE_CONNECTED_ALPHA_OWNERSHIP_NOT_RECTANGLE",
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
