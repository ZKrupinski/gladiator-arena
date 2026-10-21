#!/usr/bin/env python3
"""TEST-ONLY mock provider demonstrating the mandatory briefing handshake.

Not a drawing model and not for game production. Accepts a locked preflight
before producing exactly ONE high-resolution 4x2 RGBA sheet.
"""
import hashlib,json,os,sys
from pathlib import Path
from PIL import Image,ImageDraw

def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()

def main(argv):
    if len(argv)==4 and argv[1]=="--preflight":
        brief_path=Path(argv[2]);ack_path=Path(argv[3])
        b=json.loads(brief_path.read_text(encoding="utf8"))
        if b.get("requiredGenerationArtifact")!="ONE_TRANSPARENT_4x2_SPRITE_SHEET_ONLY":
            raise RuntimeError("MOCK_WILL_NOT_START_WITHOUT_SINGLE_SHEET_BRIEF")
        if b.get("previousAttemptErrors") and not isinstance(b["previousAttemptErrors"],list):
            raise RuntimeError("UNRECOGNIZED_RETRY_FAILURES")
        if os.getenv("SPRITEFORGE_MOCK_REFUSE_ACK")=="1":
            raise RuntimeError("TEST_PREFLIGHT_REJECTED")
        ack={
            "briefingSha256":sha(brief_path),
            "jobSha256":b["jobSha256"],"policySha256":b["policySha256"],
            "referenceSha256":b["referenceSha256"],
            "character":b["character"],"action":b["action"],
            "understoodRuleIds":[r["id"] for r in b["blockingRules"]],
            "checks":{k:True for k in b["mustAcknowledgeChecks"]},
            "executionPlan":"Read the locked reference; draw precisely ONE 4x2 native-resolution RGBA sheet with eight distinct poses, preserve pixels and safe margins, QA every pose and regenerate faults.",
        }
        ack_path.write_text(json.dumps(ack,ensure_ascii=False,indent=2),encoding="utf8")
        return
    if len(argv)!=3:raise RuntimeError("MOCK_ADAPTER_USAGE")
    job_path=Path(argv[1]);answer=Path(argv[2])
    job=json.loads(job_path.read_text(encoding="utf8"))
    brief_path=answer.parent/"preflight"/"briefing.json"
    if not brief_path.is_file() or not (answer.parent/"preflight"/"acknowledgement.json").is_file():
        raise RuntimeError("MOCK_ATTEMPTED_RENDER_BEFORE_BRIEFING")
    brief=json.loads(brief_path.read_text(encoding="utf8"))
    if brief["jobSha256"]!=sha(job_path):
        raise RuntimeError("MOCK_WRONG_JOB_BRIEF")
    size=384
    sheet=Image.new("RGBA",(4*size,2*size))
    brush=ImageDraw.Draw(sheet)
    for i in range(8):
        x=(i%4)*size;y=(i//4)*size
        brush.ellipse((x+size*.20+i*3,y+size*.18,x+size*.71+i*3,y+size*.78),
                      fill=(90+i*6,120+i*3,160,255))
        if i==3 and not job.get("retryAttempt") and os.getenv("SPRITEFORGE_MOCK_FAIL_FIRST")=="1":
            brush.rectangle((x+size-11,y+45,x+size-2,y+110),fill=(240,55,50,255))
    output=answer.parent/"single-4x2-sheet.png"
    sheet.save(output)
    answer.write_text(json.dumps({
        "jobSha256":sha(job_path),
        "preflightSha256":sha(brief_path),
        "sheet":output.name,
        "outputFormat":"ONE_NATIVE_4x2_RGBA_PNG_SHEET",
    },ensure_ascii=False,indent=2),encoding="utf8")

if __name__=="__main__": main(sys.argv)
