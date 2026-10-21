#!/usr/bin/env python3
"""SpriteForge V3 automatic action regeneration and review preview.

Single motion, 8 frames. On ANY failed technical QC, relay the exact
failed frames and error codes to a REAL provider adapter and retry. Produce
checkered contact boards and looping GIFs for every render attempt.
Never overwrite production art or claim approval without human/game review.
"""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw
from spriteforge_pipeline_v3 import digest, eight_images, generate, inspect

GOOD="TECHNICAL_PASS_PENDING_ART_AND_GAME_REVIEW"
MAX_RETRIES_LIMIT=5


def _preview_images(result_file):
    response=json.loads(Path(result_file).read_text(encoding="utf8"))
    return eight_images(response,Path(result_file).resolve().parent)


def preview(images,root,character,action,failures=None):
    """PNG contact and GIF on checkerboard; result paths are suitable for review."""
    root=Path(root);root.mkdir(parents=True,exist_ok=True)
    bad=set()
    for entry in failures or []:
        if "frame" in entry:bad.add(int(entry["frame"])-1)
        bad.update(int(n)-1 for n in entry.get("frames",[]))
    frames=[]
    for i,art in enumerate(images):
        tile=Image.new("RGBA",(304,304),(34,38,45,255))
        grid=ImageDraw.Draw(tile)
        for y in range(0,304,16):
            for x in range(0,304,16):
                if (x//16+y//16)%2==0:
                    grid.rectangle((x,y,x+15,y+15),fill=(49,53,60,255))
        pict=art.copy()
        pict.thumbnail((282,272),Image.Resampling.LANCZOS)
        tile.alpha_composite(pict,((304-pict.width)//2,(282-pict.height)//2+12))
        outline=(239,85,73,255) if i in bad else (100,176,132,255)
        grid.rectangle((1,1,302,302),outline=outline,width=3)
        grid.text((10,284),f"{character} {action} / frame {i+1}",fill=(255,255,255,255))
        frames.append(tile)
    board=Image.new("RGBA",(304*4,304*2),(23,26,31,255))
    for i,f in enumerate(frames):
        board.alpha_composite(f,((i%4)*304,(i//4)*304))
    contact=root/"contact.png"
    board.convert("RGB").save(contact,optimize=True)
    anim=root/"motion.gif"
    gif_frames=[f.convert("RGB") for f in frames]
    gif_frames[0].save(anim,save_all=True,append_images=gif_frames[1:],loop=0,
                       duration=115,optimize=False)
    return {"contactPng":str(contact),"motionGif":str(anim)}


def _retry_job(original_job,source_sha,report,attempt,output):
    j=json.loads(Path(original_job).read_text(encoding="utf8"))
    if j.get("protocol")!="spriteforge-v3":
        raise ValueError("INVALID_SPRITEFORGE_V3_JOB")
    failures=report.get("failures",[])
    j["retryAttempt"]=attempt
    j["retryOfJobSha256"]=source_sha
    j["retryFailures"]=failures
    j["fixOnlyFailedAction"]=True
    j["regenerateFullActionEightFrames"]=True
    j["retryInstruction"]=(
        "PREVIOUS RESULT FAILED QC. Redraw the SAME action as exactly 8 "
        "distinct high-resolution isolated RGBA poses, preserving identity, "
        "facing, clothing and native detail. Address EACH failing frame and "
        "its supplied reason codes: "+json.dumps(failures,ensure_ascii=False)+
        ". The head, paws, tail or limbs belonging to ANY neighbor frame "
        "are FOREIGN regardless of size. Provide complete frames at any resolution "
        "with >=20px safety margins. Never paste/clone/crop a wrong limb."
    )
    output=Path(output)
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(j,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    return output


def auto_repair(job_path,output,adapter=None,initial_result=None,max_retries=3):
    """Returns durable report, with all requested attempts and preview paths."""
    if not 0<=max_retries<=MAX_RETRIES_LIMIT:
        raise ValueError("INVALID_MAX_RETRIES")
    job_path=Path(job_path).resolve()
    original=json.loads(job_path.read_text(encoding="utf8"))
    if original.get("protocol")!="spriteforge-v3":
        raise ValueError("INVALID_SPRITEFORGE_V3_JOB")
    if digest(original["reference"])!=original["referenceSha256"]:
        raise ValueError("APPROVED_REFERENCE_MODIFIED")
    out=Path(output).resolve()
    out.mkdir(parents=True,exist_ok=True)
    record={
        "protocol":"spriteforge-v3-auto-repair",
        "character":original["character"],"action":original["action"],
        "sourceJobSha256":digest(job_path),
        "maxRetries":max_retries,"attempts":[],
        "state":"BLOCKED","generatorConnected":bool(adapter),
        "technicalPass":False,"releaseAuthorized":False,
        "artReviewRequired":True,"gameReviewRequired":True,
        "sourceAssetsPreserved":True,
    }
    def save():
        (out/"repair_report.json").write_text(
            json.dumps(record,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    report=None
    parent_job=job_path
    result_file=Path(initial_result).resolve() if initial_result else None
    try:
        # Pass zero evaluates an existing bad image if supplied; otherwise
        # it generates first using the provided adapter.
        for turn in range(max_retries+1):
            folder=out/f"attempt_{turn:02}"
            folder.mkdir(parents=True,exist_ok=True)
            if turn>0:
                parent_job=_retry_job(job_path,digest(job_path),report,turn,
                                      folder/"generation_job.json")
                result_file=None
            if result_file is None:
                if not adapter:
                    record["state"]="GENERATOR_NOT_CONNECTED"
                    record["nextAction"]="CONNECT_COMFYUI_OR_PROVIDER_ADAPTER_AND_RETRY"
                    break
                result_file=folder/"result.json"
                try:
                    generate(parent_job,adapter,result_file)
                except Exception as error:
                    record["state"]="GENERATOR_FAILED"
                    record["error"]=str(error)
                    break
            qa=inspect(parent_job,result_file,folder/"qa")
            entry={"attempt":turn,"result":str(result_file),
                   "qaJson":str(folder/"qa/qa.json"),
                   "technicalStatus":qa["status"],"failures":qa["failures"]}
            try:
                imgs=_preview_images(result_file)
                entry["review"]=preview(imgs,folder/"review",
                                        original["character"],original["action"],
                                        qa["failures"])
            except (OSError,ValueError,KeyError,TypeError) as err:
                entry["previewError"]=str(err)
            record["attempts"].append(entry)
            report=qa
            result_file=None
            if qa["status"]==GOOD:
                record["state"]="TECHNICAL_PASS_PENDING_ART_AND_GAME_REVIEW"
                record["technicalPass"]=True
                record["finalDraft"]=str(folder/"qa/draft_frames"/original["action"])
                break
            if turn==max_retries:
                record["state"]="RETRY_LIMIT_REACHED"
                record["nextAction"]="REQUIRES_PROVIDER_REGENERATION_OR_ART_REVIEW"
        if not record["technicalPass"] and record["attempts"]:
            (out/"retry_pending.json").write_text(json.dumps({
                "character":original["character"],"action":original["action"],
                "referenceSha256":original["referenceSha256"],
                "failures":record["attempts"][-1]["failures"],
                "regenerateFullActionEightFrames":True,
                "blockedFromProduction":True},ensure_ascii=False,indent=2)+"\n",
                encoding="utf8")
        if not record["technicalPass"] and not record["attempts"]:
            (out/"retry_pending.json").write_text(json.dumps({
                "character":original["character"],"action":original["action"],
                "blockedFromProduction":True,
                "reason":record["state"],
                "regenerateFullActionEightFrames":True},ensure_ascii=False,indent=2)+"\n",
                encoding="utf8")
    finally:
        save()
    return record


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--job",required=True)
    parser.add_argument("--out",required=True)
    parser.add_argument("--adapter",help="Trusted ComfyUI/provider adapter .py; must be explicitly connected")
    parser.add_argument("--initial-result",help="Existing failed provider result.json; inspect before retries")
    parser.add_argument("--max-retries",type=int,default=3)
    args=parser.parse_args()
    result=auto_repair(args.job,args.out,args.adapter,args.initial_result,args.max_retries)
    print(json.dumps({"state":result["state"],"attempts":len(result["attempts"]),
                      "technicalPass":result["technicalPass"],
                      "releaseAuthorized":False},ensure_ascii=False))
    if not result["technicalPass"]:raise SystemExit(2)
