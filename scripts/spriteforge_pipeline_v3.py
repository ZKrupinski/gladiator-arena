#!/usr/bin/env python3
"""SpriteForge V3: mandatory pre-generation contract and fail-closed art QC.
No built-in image generator; requires an explicit adapter. Never auto-deploy.
"""
from __future__ import annotations
import argparse, hashlib, json, os, subprocess, sys, math
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

CORE=("idle","walk","slash","sweep","thrust","heavy","guard","hit","death")
BEASTS=("wolf","leopard","tiger","lion","elephant")
MARGIN=20
ALPHA=32

def digest(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()

def plan(reference,kind,action,out,extra=()):
    ref=Path(reference).resolve()
    out=Path(out).resolve()
    if not ref.is_file(): raise ValueError("MISSING_APPROVED_REFERENCE")
    if kind not in (*BEASTS,"murmillo","retiarius","thraex"): raise ValueError("UNKNOWN_CHARACTER")
    allowed=set(CORE)|set(extra)|({"roar"} if kind in BEASTS else set())
    if action not in allowed: raise ValueError("ACTION_NOT_REGISTERED")
    policy=Path(__file__).resolve().parents[1]/"config/spriteforge-qc-rules.json"
    rules=json.loads(policy.read_text())["rules"]
    out.mkdir(parents=True,exist_ok=True)
    job={
      "protocol":"spriteforge-v3","character":kind,"action":action,
      "reference":str(ref),"referenceSha256":digest(ref),
      "requiredFrames":8,"motionsPerJob":1,"sheetGrid":[4,2],
      "resolutionPolicy":"ANY_POSITIVE_4x2_GRID_NO_PIXEL_FLOOR",
      "onlyAllowedGeneratedOutput":"ONE_4x2_TRANSPARENT_PNG_SHEET",
      "separatePngFiles":"EXPORTED_ONLY_AFTER_VALIDATED_SHEET_CUT",
      "noArtificialUpscaling":True,
      "rulesSha256":digest(policy),
      "mandatoryPreGenerationBriefing":True,
      "mandatoryProviderPreflightAcknowledgement":True,
      "rules":[r["id"] for r in rules],
      "instruction":f"Use only the approved {kind} reference. Generate ONE action, {action}, "
        "with exactly EIGHT distinct sequential full-body poses. Preserve face, equipment, scale, "
        "design, facing and recognizable details. Any source size is permitted. "
        "Generate exactly ONE transparent RGBA 4x2 sheet with eight frames and no pixel-size floor. "
        "NEVER generate eight separate PNG input files or falsely claim more detail via upscaling. "
        "Retain the approved reference's original microdetails. Keep wide X/Y gutters, "
        "unclipped feet/tail/equipment. NO mixed actions, extra animals, opaque background, "
        "cut body, duplicate frame, merged poses or neighboring fragments.",
      "frameOwnershipPolicy":"Any anatomy from a neighboring pose is FOREIGN, even a full head, tail or leg, regardless of size. Preserve only this frame's actor. Compare original sheet and adjacent poses; erase pixel-proven foreign body parts; block uncertain glued regions. Never decide ownership by speck size.",
      "requiredStatus":"TECHNICAL_PASS_THEN_VISUAL_REVIEW",
      "releaseAuthorized":False}
    target=out/"generator_job.json"
    target.write_text(json.dumps(job,ensure_ascii=False,indent=2))
    # Prepare human-readable briefing during planning and FRESH before each
    # actual generation/re-generation attempt.
    from spriteforge_preflight_v3 import make_brief
    make_brief(target,out/"preflight")
    return target

def rgba(p):
    src=Image.open(p)
    if src.mode not in ("RGBA","LA","P") or (src.mode=="P" and "transparency" not in src.info):
        raise ValueError("NOT_A_TRANSPARENT_IMAGE")
    return src.convert("RGBA")

def eight_images(response,root,job=None):
    """Production generation MUST be one native 4x2 transparent sheet."""
    if "frames" in response or "sheet" not in response:
        raise ValueError("SINGLE_4x2_HIGH_RES_SHEET_REQUIRED_EIGHT_FILES_REJECTED")
    if response.get("upscaledFrom") or response.get("resampledLowResolution"):
        raise ValueError("ARTIFICIALLY_UPSCALED_SOURCE_FORBIDDEN")
    sheet=rgba((root/response["sheet"]).resolve())
    w,h=sheet.size
    if not w or not h or w%4 or h%2:
        raise ValueError("INVALID_4x2_SHEET_GRID")
    mask=np.asarray(sheet.getchannel("A"))>ALPHA
    labels,n=ndimage.label(mask,structure=np.ones((3,3),dtype=np.uint8))
    if n:
        yy,xx=np.where(labels>0)
        for k in np.unique(labels[yy,xx]):
            cy,cx=np.where(labels==k)
            if len(cx)<max(1,round(w*h*.0003)): continue
            if len(np.unique(cx*4//w))>1 or len(np.unique(cy*2//h))>1:
                raise ValueError("MERGED_SILHOUETTE_ACROSS_GRID_SEAM_REGENERATE")
    return [sheet.crop((i%4*w//4,i//4*h//2,(i%4+1)*w//4,(i//4+1)*h//2))
            for i in range(8)]

def measure(frame):
    w,h=frame.size;fail=[]
    a=np.asarray(frame.getchannel("A"))
    yy,xx=np.where(a>=ALPHA)
    if not len(xx):
        return {"fail":fail+["NO_CHARACTER"],"bbox":None}
    bbox=[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)]
    safety_margin=min(MARGIN, max(0,min(w,h)//16))
    if min(bbox[0],bbox[1],w-bbox[2],h-bbox[3])<safety_margin:
        fail.append("CLIPPED_OR_TOO_CLOSE_TO_CANVAS_EDGE")
    if np.mean(a>250)>.92:fail.append("OPAQUE_BACKGROUND")
    labels,n=ndimage.label(a>=ALPHA,structure=np.ones((3,3),dtype=np.uint8))
    counts=np.bincount(labels.ravel(),minlength=n+1);counts[0]=0
    biggest=int(counts.max()) if n else 0
    if sum(c>max(100,biggest*.04) for c in counts[1:])>1:
        fail.append("MULTIPLE_SILHOUETTES_OR_SEPARATE_LIMBS_REQUIRE_REVIEW")
    if sum(max(20,biggest*.008)<c<=max(100,biggest*.04) for c in counts[1:]):
        fail.append("AMBIGUOUS_DETACHED_ART_NOT_AUTO_ERASED")
    # Frame ownership outranks pixel count: even large neighbor heads/paws/tails
    # are foreign. At the boundary, isolated bodies require provenance proof.
    # Fused/attached bodies cannot be classified from alpha geometry alone.
    objects=ndimage.find_objects(labels)
    for comp_id,roi in enumerate(objects,1):
        if roi is None or counts[comp_id]==biggest:continue
        yslice,xslice=roi
        edge=min(xslice.start,yslice.start,w-xslice.stop,h-yslice.stop)
        if edge < MARGIN*3 and counts[comp_id]>=max(24,biggest*.0004):
            fail.append("POSSIBLE_FOREIGN_NEIGHBOR_BODY_PART_VERIFY_OWNERSHIP")
            break
    bottom=yy>=np.percentile(yy,97)
    foot=[float(np.median(xx[bottom])-bbox[0]),
          float(np.percentile(yy,99.5)-bbox[1])]
    return {"fail":fail,"bbox":bbox,"native":[w,h],"footEstimate":foot}

def inspect(job_path,result_path,destination):
    out=Path(destination).resolve();out.mkdir(parents=True,exist_ok=True)
    job=json.loads(Path(job_path).read_text())
    if job.get("protocol")!="spriteforge-v3":raise ValueError("INVALID_CONTRACT")
    if digest(job["reference"])!=job["referenceSha256"]:
        raise ValueError("APPROVED_REFERENCE_MODIFIED")
    response=json.loads(Path(result_path).read_text())
    report={"character":job["character"],"action":job["action"],
            "status":"BLOCKED","releaseAuthorized":False,
            "frames":[],"failures":[],"visualReviewRequired":True}
    try:
        if response.get("jobSha256")!=digest(job_path):
            raise ValueError("GENERATOR_DID_NOT_ACKNOWLEDGE_APPROVED_JOB")
        from spriteforge_preflight_v3 import validate_acknowledgement
        preflight=Path(result_path).resolve().parent/"preflight"
        receipt=validate_acknowledgement(job_path,preflight/"briefing.json",
                                         preflight/"acknowledgement.json")
        if response.get("preflightSha256")!=receipt["briefingSha256"]:
            raise ValueError("GENERATOR_DID_NOT_BIND_RESULT_TO_PREFLIGHT")
        report["preflight"]=receipt
        images=eight_images(response,Path(result_path).resolve().parent,job)
        for i,frame in enumerate(images):
            entry=measure(frame);entry["index"]=i+1
            report["frames"].append(entry)
            if entry["fail"]:
                report["failures"].append({"frame":i+1,"reasons":entry["fail"]})
        hashes=[hashlib.sha256(f.tobytes()).hexdigest() for f in images]
        for j in range(8):
            for i in range(j):
                if hashes[i]==hashes[j]:
                    report["failures"].append({"frames":[i+1,j+1],"reasons":["DUPLICATE_POSE"]})
        if job["action"] in ("idle","walk","guard") and len(report["frames"])==8:
            sizes=[r["bbox"][3]-r["bbox"][1] for r in report["frames"] if r["bbox"]]
            if sizes:
                median=np.median(sizes)
                for entry in report["frames"]:
                    if entry["bbox"] and not (.65*median <= entry["bbox"][3]-entry["bbox"][1] <= 1.45*median):
                        report["failures"].append({"frame":entry["index"],"reasons":["SCALE_JUMP"]})
        if not report["failures"]:
            boxes=[r["bbox"] for r in report["frames"]]
            anchors=[r["footEstimate"] for r in report["frames"]]
            width=int(128+2*max(max(f[0],box[2]-box[0]-f[0]) for f,box in zip(anchors,boxes)))
            height=int(152+max(max(f[1],box[3]-box[1]-f[1]) for f,box in zip(anchors,boxes)))
            if max(width,height)>4096:raise ValueError("OUTPUT_CANVAS_OVERSIZE")
            dest=out/"draft_frames"/job["action"];dest.mkdir(parents=True,exist_ok=True)
            for i,(image,box,foot) in enumerate(zip(images,boxes,anchors)):
                crop=image.crop(box)
                x=round(width/2-foot[0]);y=round(height-84-foot[1])
                output_margin=min(MARGIN,max(0,min(width,height)//16))
                if min(x,y,width-x-crop.width,height-y-crop.height)<output_margin:
                    raise ValueError("ALIGNMENT_OVERFLOW")
                canvas=Image.new("RGBA",(width,height))
                canvas.alpha_composite(crop,(x,y))
                canvas.save(dest/f"{i:02}.png")
                report["frames"][i]["exportFoot"]=[width//2,height-84]
                report["frames"][i]["exportPixels"]=[width,height]
            report["status"]="TECHNICAL_PASS_PENDING_ART_AND_GAME_REVIEW"
    except Exception as error:
        report["failures"].append({"reasons":[str(error)]})
    (out/"qa.json").write_text(json.dumps(report,ensure_ascii=False,indent=2))
    (out/"retry_this_action.json").write_text(json.dumps({
       "action":job["action"],"character":job["character"],
       "fixOnlyThisMotion":True,"failures":report["failures"],
       "neverPublishAutomatically":True},ensure_ascii=False,indent=2))
    return report

def generate(job,adapter,result):
    if not adapter:raise ValueError("GENERATOR_NOT_CONNECTED")
    adapter=Path(adapter)
    if not adapter.is_file():raise ValueError("GENERATOR_ADAPTER_MISSING")
    from spriteforge_preflight_v3 import make_brief, validate_acknowledgement
    job=Path(job).resolve()
    result_path=Path(result).resolve()
    result_path.parent.mkdir(parents=True,exist_ok=True)
    preflight=result_path.parent/"preflight"
    brief=make_brief(job,preflight)
    ack=preflight/"acknowledgement.json"
    # First mandatory adapter handshake; drawing forbidden until every
    # blocking rule is acknowledged for this job and current policy.
    handshake=subprocess.run([sys.executable,str(adapter),"--preflight",str(brief),str(ack)],
                             capture_output=True,text=True,timeout=180)
    if handshake.returncode:
        raise ValueError("PREFLIGHT_PROVIDER_BRIEFING_REJECTED: "+handshake.stderr[-450:])
    receipt=validate_acknowledgement(job,brief,ack)
    print("SPRITEFORGE_V3_PREGEN_BRIEFING_ACCEPTED",
          receipt["character"],receipt["action"],receipt["acknowledgedRuleCount"],flush=True)
    finished=subprocess.run([sys.executable,str(adapter),str(job),str(result_path)],
                            capture_output=True,text=True,
                            timeout=max(300,min(14400,int(os.getenv('SPRITEFORGE_GENERATOR_TIMEOUT','3600')))))
    if finished.returncode:
        raise ValueError("GENERATOR_EXECUTION_FAILED: "+finished.stderr[-450:])
    data=json.loads(result_path.read_text(encoding="utf8"))
    if data.get("jobSha256")!=digest(job) or data.get("preflightSha256")!=receipt["briefingSha256"]:
        raise ValueError("GENERATOR_RESULT_NOT_BOUND_TO_BRIEFED_JOB")
    if "sheet" not in data or "frames" in data:
        raise ValueError("GENERATOR_MUST_RETURN_EXACTLY_ONE_SHEET")

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--mode",choices=["plan","brief","generate","inspect","repair"],required=True)
    p.add_argument("--reference");p.add_argument("--character");p.add_argument("--action")
    p.add_argument("--job");p.add_argument("--result");p.add_argument("--adapter")
    p.add_argument("--extra",action="append",default=[]);p.add_argument("--out",required=True)
    p.add_argument("--initial-result");p.add_argument("--max-retries",type=int,default=3)
    a=p.parse_args();out=Path(a.out).resolve()
    if a.mode=="plan":
        print(plan(a.reference,a.character,a.action,out,a.extra))
    elif a.mode=="brief":
        if not a.job:p.error("--job required")
        from spriteforge_preflight_v3 import make_brief
        pth=make_brief(a.job,out/"preflight")
        print(pth.with_name("briefing.md").read_text(encoding="utf8"))
    elif a.mode in ("generate","repair") or (a.mode=="inspect" and a.adapter):
        # Connected generator is ALWAYS auto-correcting: no silent one-shot
        # failure or manual retry chores for diagnosed animation defects.
        if not a.job:p.error("--job required")
        if a.mode=="inspect" and not (a.result or a.initial_result):
            p.error("--result required for inspect")
        from spriteforge_auto_repair_v3 import auto_repair
        response=auto_repair(a.job,out,adapter=a.adapter,
                             initial_result=(a.result if a.mode=="inspect" else a.initial_result),
                             max_retries=a.max_retries)
        print(json.dumps({"state":response["state"],"attempts":len(response["attempts"]),
                          "releaseAuthorized":False},ensure_ascii=False))
        if not response["technicalPass"]:raise SystemExit(2)
    else:
        if not a.job:p.error("--job required")
        if not a.result:p.error("--result required")
        # With no generator connected inspect provides QA + retry manifest,
        # NEVER claims actual sprite regeneration or a released game version.
        response=Path(a.result)
        report=inspect(a.job,response,out)
        if report["status"]!="TECHNICAL_PASS_PENDING_ART_AND_GAME_REVIEW":
            (out/"repair_not_connected.json").write_text(json.dumps({
                "state":"GENERATOR_NOT_CONNECTED","needRegeneration":True,
                "action":json.loads(Path(a.job).read_text()).get("action"),
                "failures":report["failures"]},ensure_ascii=False,indent=2))
        print(json.dumps({"status":report["status"],"failures":len(report["failures"])}))
        if report["status"]!="TECHNICAL_PASS_PENDING_ART_AND_GAME_REVIEW":raise SystemExit(2)
