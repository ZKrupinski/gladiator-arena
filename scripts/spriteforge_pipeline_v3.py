#!/usr/bin/env python3
"""SpriteForge V3: mandatory pre-generation contract and fail-closed art QC.
No built-in image generator; requires an explicit adapter. Never auto-deploy.
"""
from __future__ import annotations
import argparse, hashlib, json, os, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

CORE=("idle","walk","slash","sweep","thrust","heavy","guard","hit","death")
BEASTS=("wolf","leopard","tiger","lion","elephant")
MIN_NATIVE=512
MARGIN=20
ALPHA=32

def digest(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()

def plan(reference,kind,action,out,extra=()):
    ref=Path(reference).resolve()
    out=Path(out).resolve()
    if not ref.is_file(): raise ValueError("MISSING_APPROVED_REFERENCE")
    if min(Image.open(ref).size)<768: raise ValueError("REFERENCE_RESOLUTION_TOO_LOW")
    if kind not in (*BEASTS,"murmillo","retiarius","thraex"): raise ValueError("UNKNOWN_CHARACTER")
    allowed=set(CORE)|set(extra)|({"roar"} if kind in BEASTS else set())
    if action not in allowed: raise ValueError("ACTION_NOT_REGISTERED")
    policy=Path(__file__).resolve().parents[1]/"config/spriteforge-qc-rules.json"
    rules=json.loads(policy.read_text())["rules"]
    out.mkdir(parents=True,exist_ok=True)
    job={
      "protocol":"spriteforge-v3","character":kind,"action":action,
      "reference":str(ref),"referenceSha256":digest(ref),
      "requiredFrames":8,"motionsPerJob":1,"nativeFrameMinimum":[MIN_NATIVE,MIN_NATIVE],
      "nativeSheetMinimum":[2048,1024],"sheetGrid":[4,2],
      "preferred":"eight_separate_transparent_PNGs",
      "rules":[r["id"] for r in rules],
      "instruction":f"Use only the approved {kind} reference. Generate ONE action, {action}, "
        "with exactly EIGHT distinct sequential full-body poses. Preserve face, equipment, scale, "
        "design, facing and high-frequency details. Each pose: native at least 512x512 real transparent "
        "RGBA, wide X/Y gutters, unclipped feet/tail/equipment. NO mixed-action board, extra animal, "
        "text, opaque background, cut body, duplicate frame or neighboring fragments. "
        "Prefer eight separate PNG files; 4x2 sheet only if at least 2048x1024.",
      "requiredStatus":"TECHNICAL_PASS_THEN_VISUAL_REVIEW",
      "releaseAuthorized":False}
    target=out/"generator_job.json"
    target.write_text(json.dumps(job,ensure_ascii=False,indent=2))
    return target

def rgba(p):
    src=Image.open(p)
    if src.mode not in ("RGBA","LA","P") or (src.mode=="P" and "transparency" not in src.info):
        raise ValueError("NOT_A_TRANSPARENT_IMAGE")
    return src.convert("RGBA")

def eight_images(response,root):
    if ("frames" in response)==("sheet" in response):
        raise ValueError("PROVIDE_EIGHT_FILES_OR_ONE_4X2_SHEET")
    if "frames" in response:
        paths=response["frames"]
        if not isinstance(paths,list) or len(paths)!=8 or len(set(paths))!=8:
            raise ValueError("REQUIRE_EIGHT_UNIQUE_FILE_PATHS")
        return [rgba((root/name).resolve()) for name in paths]
    sheet=rgba((root/response["sheet"]).resolve())
    w,h=sheet.size
    if w<2048 or h<1024: raise ValueError("LOW_NATIVE_RESOLUTION_SHEET")
    mask=np.asarray(sheet.getchannel("A"))>ALPHA
    labels,n=ndimage.label(mask,structure=np.ones((3,3),dtype=np.uint8))
    if n:
        yy,xx=np.where(labels>0)
        for k in np.unique(labels[yy,xx]):
            cy,cx=np.where(labels==k)
            if len(cx)<max(160,round(w*h*.0003)): continue
            if len(np.unique(cx*4//w))>1 or len(np.unique(cy*2//h))>1:
                raise ValueError("MERGED_SILHOUETTE_ACROSS_GRID_SEAM_REGENERATE")
    result=[]
    for i in range(8):
        x,y=i%4,i//4
        result.append(sheet.crop((round(x*w/4),round(y*h/2),
                                  round((x+1)*w/4),round((y+1)*h/2))))
    return result

def measure(frame):
    w,h=frame.size;fail=[]
    if min(w,h)<MIN_NATIVE: fail.append("UNDER_RES_NATIVE")
    a=np.asarray(frame.getchannel("A"))
    yy,xx=np.where(a>=ALPHA)
    if len(xx)<max(300,w*h*.0015):
        return {"fail":fail+["NO_CHARACTER"],"bbox":None}
    bbox=[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)]
    if min(bbox[0],bbox[1],w-bbox[2],h-bbox[3])<MARGIN:
        fail.append("CLIPPED_OR_TOO_CLOSE_TO_CANVAS_EDGE")
    if np.mean(a>250)>.92:fail.append("OPAQUE_BACKGROUND")
    labels,n=ndimage.label(a>=ALPHA,structure=np.ones((3,3),dtype=np.uint8))
    counts=np.bincount(labels.ravel(),minlength=n+1);counts[0]=0
    biggest=int(counts.max()) if n else 0
    if sum(c>max(100,biggest*.04) for c in counts[1:])>1:
        fail.append("MULTIPLE_SILHOUETTES_OR_SEPARATE_LIMBS_REQUIRE_REVIEW")
    if sum(max(20,biggest*.008)<c<=max(100,biggest*.04) for c in counts[1:]):
        fail.append("AMBIGUOUS_DETACHED_ART_NOT_AUTO_ERASED")
    if bbox[2]-bbox[0]<230 or bbox[3]-bbox[1]<220:
        fail.append("LOW_NATIVE_SUBJECT_PIXEL_DETAIL")
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
        images=eight_images(response,Path(result_path).resolve().parent)
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
            width=max(width,512);height=max(height,512)
            if max(width,height)>4096:raise ValueError("OUTPUT_CANVAS_OVERSIZE")
            dest=out/"draft_frames"/job["action"];dest.mkdir(parents=True,exist_ok=True)
            for i,(image,box,foot) in enumerate(zip(images,boxes,anchors)):
                crop=image.crop(box)
                x=round(width/2-foot[0]);y=round(height-84-foot[1])
                if min(x,y,width-x-crop.width,height-y-crop.height)<MARGIN:
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
    result=subprocess.run([sys.executable,str(adapter),str(job),str(result)],
                          capture_output=True,text=True,timeout=max(300,min(14400,int(os.getenv('SPRITEFORGE_GENERATOR_TIMEOUT','3600')))))
    if result.returncode:raise ValueError("GENERATOR_EXECUTION_FAILED: "+result.stderr[-450:])

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--mode",choices=["plan","generate","inspect"],required=True)
    p.add_argument("--reference");p.add_argument("--character");p.add_argument("--action")
    p.add_argument("--job");p.add_argument("--result");p.add_argument("--adapter")
    p.add_argument("--extra",action="append",default=[]);p.add_argument("--out",required=True)
    a=p.parse_args();out=Path(a.out).resolve()
    if a.mode=="plan":
        print(plan(a.reference,a.character,a.action,out,a.extra))
    else:
        if not a.job:p.error("--job required")
        if a.mode=="generate":
            out.mkdir(parents=True,exist_ok=True);response=out/"result.json"
            generate(a.job,a.adapter,response)
        else:
            if not a.result:p.error("--result required")
            response=Path(a.result)
        report=inspect(a.job,response,out)
        print(json.dumps({"status":report["status"],"failures":len(report["failures"])}))
        if report["status"]!="TECHNICAL_PASS_PENDING_ART_AND_GAME_REVIEW":raise SystemExit(2)
