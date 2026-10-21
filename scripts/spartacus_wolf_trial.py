#!/usr/bin/env python3
"""Prepare ONLY an explicit wolfTrial=1 gameplay experiment from ten supplied sheets.

Original source pixels are preserved. This tool does not repair connected,
truncated, neighboring anatomy or pretend that 1672x940 is native SpriteForge V3.
The optional tenth attack FX sheet is preserved in source, not silently mapped.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image

from spartacus_uploader import UploadError, publish_files

MAP = {
    "idle": "28419.png",
    "walk": "28418.png",
    "attack1": "28424.png",
    "attack2": "28420.png",
    "attack3": "28417.png",
    "attack4": "28421.png",
    "hit": "28416.png",
    "death": "28423.png",
    "roar": "28422.png",
}
EXTRA = "28415.png"
DEST = "public/assets/beasts/wolf-trial/"
MIN_MARGIN = 12


def prepare(source: Path, destination: Path):
    source = Path(source).resolve()
    destination = Path(destination).resolve()
    if not source.is_dir():
        raise UploadError("TRIAL_SOURCE_DIRECTORY_MISSING")
    if not (source / EXTRA).is_file():
        raise UploadError("TRIAL_TENTH_SOURCE_MISSING: " + EXTRA)
    destination.mkdir(parents=True, exist_ok=True)
    atlas_bytes = {}
    report = {"protocol": "wolf-trial-review-v1", "previewOnly": True,
              "productionArtApproved": False, "sheets": [],
              "excludedExtra": EXTRA, "warnings": []}
    for action, original_name in MAP.items():
        filename = source / original_name
        if not filename.is_file():
            raise UploadError("TRIAL_SOURCE_MISSING: " + original_name)
        with Image.open(filename) as image:
            if image.mode != "RGBA":
                raise UploadError("TRIAL_SOURCE_RGBA_REQUIRED: " + original_name)
            width, height = image.size
            if (width, height) != (1672, 941):
                raise UploadError("TRIAL_SOURCE_DIMENSIONS_CHANGED: " + original_name)
            if image.getchannel("A").crop((0,940,1672,941)).getbbox():
                raise UploadError("TRIAL_LAST_ROW_HAS_PIXELS_CANNOT_SAFE_TRIM: " + original_name)
            # Only remove one fully transparent bottom row for an even 4x2
            # grid; no sprite is scaled, erased or artificially reconstructed.
            atlas=image.crop((0,0,1672,940))
            cw,ch=418,470
            risk=[]
            for frame_index in range(8):
                x=frame_index%4*cw
                y=frame_index//4*ch
                bbox=atlas.crop((x,y,x+cw,y+ch)).getchannel("A").getbbox()
                if not bbox:
                    raise UploadError("TRIAL_EMPTY_FRAME: " + action)
                if (bbox[0]<MIN_MARGIN or bbox[1]<MIN_MARGIN or
                    bbox[2]>cw-MIN_MARGIN or bbox[3]>ch-MIN_MARGIN):
                    risk.append(frame_index+1)
            target=destination/(action+".webp")
            atlas.save(target,format="WEBP",lossless=True,quality=100,method=6)
            payload=target.read_bytes()
            atlas_bytes[DEST+action+".webp"]=payload
            report["sheets"].append({"action":action,"original":original_name,
                "originalSha256":hashlib.sha256(filename.read_bytes()).hexdigest(),
                "nativePixels":[1672,940],"frames":8,"edgeRiskFrames":risk,
                "sha256":hashlib.sha256(payload).hexdigest()})
            if risk:
                report["warnings"].append(action+": frames at risk "+str(risk))
    manifest={"version":3,"previewOnly":True,
              "source":"user submitted 1672x941 crop-only experiment, not SpriteForge native V3",
              "actions":{a:a+".webp" for a in MAP}}
    manifest_bytes=(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n").encode()
    atlas_bytes[DEST+"manifest.json"]=manifest_bytes
    (destination/"manifest.json").write_bytes(manifest_bytes)
    (destination/"trial-qa.json").write_text(
        json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    return atlas_bytes,report


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--source",required=True,
                        help="folder with original 28415...28424.png")
    parser.add_argument("--out",required=True,
                        help="temporary review output folder")
    parser.add_argument("--publish",action="store_true")
    parser.add_argument("--confirm",action="store_true")
    parser.add_argument("--expected-sha")
    opts=parser.parse_args()
    try:
        atlas,report=prepare(Path(opts.source),Path(opts.out))
        if opts.publish:
            if not opts.confirm:
                raise UploadError("EXPLICIT_TRIAL_DEPLOYMENT_CONFIRM_REQUIRED")
            result=publish_files(atlas,confirm=True,expected_sha=opts.expected_sha,
                                 message="trial(wolf): opt-in nine-motion art comparison")
        else:
            result={"state":"TRIAL_PACK_PREPARED_NOT_PUBLISHED",
                    "path":opts.out,"artNativeApproved":False,
                    "count":len(atlas)}
        result["qa"]={"warnings":report["warnings"],"previewOnly":True}
        print(json.dumps(result,ensure_ascii=False,indent=2))
        return 0 if result.get("deployment",{}).get("state")!="UNVERIFIED" else 3
    except Exception as exc:
        print(json.dumps({"state":"FAILED","reason":str(exc)},ensure_ascii=False))
        return 2

if __name__=="__main__":
    raise SystemExit(main())
