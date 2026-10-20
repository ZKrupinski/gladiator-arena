#!/usr/bin/env python3
"""SpriteForge V3 legacy beast QA: fail-closed, pixel-preserving speck cleanup.

The five original 1586x992 atlases are NEVER modified. The 200 legacy 512px
exports are derivatives of ~198px frames; they cannot earn native V3 approval.
Only tiny, isolated, far-away alpha garbage is erased. Anything resembling
a detached limb or neighboring character is flagged for visual review.
"""
import argparse
import collections
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public/assets/beasts"
ACTIONS = ("idle", "walk", "attack", "hit", "defeat")
TYPES = ("wolf", "leopard", "tiger", "lion", "elephant")
ALPHA = 24
CONNECTION = np.ones((3, 3), dtype=np.uint8)


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def scan_image(image, fix_safe=False):
    if image.mode != "RGBA" or image.size != (512, 512):
        return image, {"problems": ["NON_RGBA_OR_WRONG_SIZE"], "fixedIslands": 0}
    pixels = np.array(image)
    alpha = pixels[:, :, 3]
    labels, n = ndimage.label(alpha >= ALPHA, structure=CONNECTION)
    if not n:
        return image, {"problems": ["EMPTY_ALPHA"], "fixedIslands": 0}
    sizes = np.bincount(labels.ravel(), minlength=n + 1)
    sizes[0] = 0
    main_id = int(np.argmax(sizes))
    biggest = int(sizes[main_id])
    if biggest < 300:
        return image, {"problems": ["INSUFFICIENT_CHARACTER_ALPHA"], "fixedIslands": 0}
    main = labels == main_id
    ys, xs = np.where(main)
    bbox = [int(xs.min()), int(ys.min()), int(xs.max()+1), int(ys.max()+1)]
    problems = []
    if min(bbox[0], bbox[1], 512-bbox[2], 512-bbox[3]) < 10:
        problems.append("EDGE_RISK_REVIEW_BODY_OR_TAIL")
    if bbox[2]-bbox[0] < 110 or bbox[3]-bbox[1] < 90:
        problems.append("UNEXPECTED_SMALL_ACTOR")
    spacing = ndimage.distance_transform_edt(~main)
    objects = ndimage.find_objects(labels)
    candidate_ids = []
    ambiguous = []
    unclassified = []
    detached = 0
    limit = max(12, round(biggest * .00018))
    for cid, roi in enumerate(objects, 1):
        if cid == main_id or roi is None:
            continue
        area = int(sizes[cid])
        if not area:
            continue
        detached += 1
        yy, xx = roi
        y0, y1, x0, x1 = yy.start, yy.stop, xx.start, xx.stop
        region = labels[roi] == cid
        gap = float(spacing[roi][region].min())
        wholly_outside = (x1 < bbox[0]-9 or x0 > bbox[2]+9 or
                           y1 < bbox[1]-9 or y0 > bbox[3]+9)
        if area <= limit and gap >= 26 and wholly_outside:
            candidate_ids.append(cid)
        elif area >= max(48, round(biggest * .002)) or gap >= 18:
            ambiguous.append({"pixels": area, "bbox": [x0, y0, x1, y1],
                              "distanceToBodyPx": round(gap, 1)})
        else:
            unclassified.append({"pixels":area,"distanceToBodyPx":round(gap,1)})
    if ambiguous:
        problems.append("AMBIGUOUS_DETACHED_ART_REQUIRE_VISUAL_REVIEW")
    if len(ambiguous) >= 2:
        problems.append("POSSIBLE_NEIGHBOR_FRAME_GHOSTS")
    fixed_pixels = 0
    if fix_safe and candidate_ids:
        # Include their anti-aliased border WITHOUT eating into the real actor.
        tiny = np.isin(labels, candidate_ids)
        halo = ndimage.binary_dilation(tiny, iterations=2)
        halo &= (spacing >= 20)
        fixed_pixels = int(np.count_nonzero(alpha[halo]))
        pixels[halo, 3] = 0
        image = Image.fromarray(pixels, "RGBA")
    if candidate_ids and not fix_safe:
        problems.append("HIGH_CONFIDENCE_SPECKS_NOT_YET_REMOVED")
    return image, {
        "problems":problems, "bodyBBox":bbox, "bodyAlphaPixels":biggest,
        "detachedIslands":detached, "candidateSpecks":len(candidate_ids),
        "fixedIslands":len(candidate_ids) if fix_safe else 0,
        "fixedAlphaPixels":fixed_pixels,
        "ambiguousIslands":ambiguous[:10], "otherIslands":unclassified[:10]
    }


def make_contact(kind, frames, records, directory):
    cw, ch, pad = 176, 180, 8
    contact = Image.new("RGB", (cw*8, ch*5+32), "#21242a")
    draw = ImageDraw.Draw(contact)
    draw.text((12, 9), kind.upper()+" — existing 8x5 legacy sprites / SpriteForge V3 QA",
              fill="#f2f2f2")
    for row, action in enumerate(ACTIONS):
        for col in range(8):
            image = frames[(action,col)]
            rec = records[(action,col)]
            x,y = col*cw, row*ch+32
            color = "#e65353" if rec["ambiguousIslands"] else (
                "#e8b95a" if rec["problems"] else "#5b7180")
            draw.rectangle((x,y,x+cw-2,y+ch-2),outline=color,width=2)
            draw.rectangle((x+2,y+2,x+cw-4,y+ch-22),fill="#343a43")
            for ay in range(y+3,y+ch-22,20):
                for ax in range(x+3,x+cw-3,20):
                    if ((ax-x)//20+(ay-y)//20)%2:
                        draw.rectangle((ax,ay,min(ax+19,x+cw-4),min(ay+19,y+ch-23)),
                                       fill="#3d444e")
            thumb=image.copy()
            thumb.thumbnail((cw-14,ch-37),Image.Resampling.LANCZOS)
            contact.paste(thumb,(x+(cw-thumb.width)//2,y+4),thumb)
            draw.text((x+7,y+ch-18),f"{action} {col:02}  {color.upper()}",fill="#eee")
    directory.mkdir(parents=True,exist_ok=True)
    contact.save(directory/(kind+".png"), optimize=True)


def run(fix_safe=False, output=None, previews=None):
    source = json.loads((ASSETS/"manifest.json").read_text(encoding="utf8"))
    individuals_path = ASSETS/"individual/manifest.json"
    individuals = json.loads(individuals_path.read_text(encoding="utf8"))
    source_index = {s["name"]:s for s in source["species"]}
    records = []
    totals = collections.Counter()
    per_kind = {}
    for kind in TYPES:
        legacy = ASSETS/(kind+"-40.png")
        expected = source_index[kind]["sha256"]
        if not legacy.exists() or digest(legacy) != expected:
            raise RuntimeError(f"SOURCE_ATLAS_SHA256_MISMATCH: {kind} (do not touch originals)")
        if Image.open(legacy).size != (1586,992):
            raise RuntimeError(f"SOURCE_ATLAS_SIZE_MISMATCH: {kind}")
        frames = {}
        notes = {}
        stats = collections.Counter()
        for action in ACTIONS:
            paths = individuals["species"][kind]["actions"][action]["paths"]
            if len(paths) != 8:
                raise RuntimeError(f"NOT_EIGHT_FRAMES {kind}/{action}")
            for col, p in enumerate(paths):
                src = ROOT/"public"/p
                if not src.is_file():
                    raise RuntimeError(f"MISSING_FRAME: {p}")
                before = digest(src)
                im = Image.open(src)
                clean, item = scan_image(im, fix_safe)
                if item["problems"] == ["NON_RGBA_OR_WRONG_SIZE"]:
                    raise RuntimeError(f"UNUSABLE_FRAME_FORMAT: {p}")
                if item["fixedAlphaPixels"] > 0:
                    clean.save(src,format="PNG",compress_level=6)
                    individuals["species"][kind]["actions"][action]["visiblePixels"][col] = int(
                        np.count_nonzero(np.asarray(clean.getchannel("A"))>30))
                item.update({"species":kind,"action":action,"index":col,"path":p,
                             "changed":before!=digest(src)})
                frames[(action,col)] = clean
                notes[(action,col)] = item
                records.append(item)
                stats["frames"] += 1
                stats["fixedIslands"] += item["fixedIslands"]
                stats["fixedAlphaPixels"] += item["fixedAlphaPixels"]
                stats["ambiguousIslands"] += len(item["ambiguousIslands"])
                stats["edgeRiskFrames"] += int("EDGE_RISK_REVIEW_BODY_OR_TAIL" in item["problems"])
                stats["modifiedFrames"] += int(item["changed"])
                stats["framesNeedingVisualReview"] += int(bool(item["problems"]))
        if previews is not None:
            make_contact(kind,frames,notes,Path(previews))
        per_kind[kind] = dict(stats)
        totals.update(stats)
        print(kind,dict(stats),flush=True)
    if fix_safe and totals["modifiedFrames"]:
        individuals_path.write_text(json.dumps(individuals,ensure_ascii=False,indent=2)+"\n",
                                    encoding="utf8")
    report = {
        "protocol":"spriteforge-v3",
        "scope":"five existing 8x5 legacy atlases + 200 extracted PNGs",
        "checkedSourceAtlases":5,
        "checkedFrames":len(records),
        "sourceAtlasesPreserved":True,
        "nativeFramePixelsApprox":[198,198],
        "exportFramePixels":[512,512],
        "nativeV3GenerationApproved":False,
        "releaseAuthorized":False,
        "visualReviewRequired":True,
        "status":"LEGACY_AUDITED_SAFELY_CLEANED_PENDING_REVIEW" if fix_safe else "LEGACY_AUDITED_ONLY",
        "totals":dict(totals),"species":per_kind,"frames":records,
        "unresolvedWarning":"Large detached artifacts, attached ghost limbs and clipped body parts require source-level visual review or re-generation; never auto-erase.",
    }
    if len(records)!=200:raise RuntimeError("EXPECTED_200_FRAMES")
    if output:
        Path(output).parent.mkdir(parents=True,exist_ok=True)
        Path(output).write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("SPRITEFORGE_V3_LEGACY_QA_SUMMARY",json.dumps(report["totals"]),flush=True)
    return report


if __name__ == "__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--fix-safe",action="store_true")
    p.add_argument("--report",default="docs/qa/beast-legacy-v3-audit.json")
    p.add_argument("--previews",default="docs/qa/beast-v3-previews")
    args=p.parse_args()
    run(args.fix_safe, args.report, args.previews)
