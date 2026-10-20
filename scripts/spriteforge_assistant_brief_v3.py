#!/usr/bin/env python3
"""One-command SpriteForge V3 briefing for ChatGPT ImageGen or any other artist.

Does not draw an image and never fakes a generator acknowledgement. It returns
the SAME authoritative V3 briefing that provider adapters must acknowledge.
Run it before invoking any image-generation tool or each action retry.
"""
import argparse
import json
from pathlib import Path
from spriteforge_pipeline_v3 import plan
from spriteforge_preflight_v3 import make_brief,validate_acknowledgement,POLICY

def assistant_brief(out,job=None,reference=None,character=None,action=None):
    out=Path(out).resolve()
    if job:
        if reference or character or action:
            raise ValueError("PROVIDE_JOB_OR_CHARACTER_ACTION_REFERENCE_NOT_BOTH")
        job_path=Path(job).resolve()
    else:
        if not all((reference,character,action)):
            raise ValueError("APPROVED_REFERENCE_CHARACTER_AND_ONE_ACTION_REQUIRED")
        job_path=plan(reference,character,action,out/"locked-job")
    briefing=make_brief(job_path,out/"preflight")
    content=json.loads(briefing.read_text(encoding="utf8"))
    md=(out/"preflight/briefing.md").read_text(encoding="utf8")
    # This is a tool/artist briefing, not automatic compliance attestation.
    session={
      "protocol":"spriteforge-v3-assistant-start",
      "trigger":"GAME_ANIMATION_SPRITE_SHEET_REQUEST",
      "jobPath":str(job_path),
      "briefingPath":str(briefing),
      "readableBriefingPath":str(out/"preflight/briefing.md"),
      "jobSha256":content["jobSha256"],
      "policySha256":content["policySha256"],
      "character":content["character"],
      "action":content["action"],
      "generatedSprite":False,
      "providerAcked":False,
      "artReviewed":False,
      "readyForImageGenerationOnlyAfterArtistReadsBriefing":True,
    }
    (out/"assistant_preflight.json").write_text(json.dumps(session,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    return md,session

if __name__=="__main__":
    p=argparse.ArgumentParser(description="Read SpriteForge V3 latest rules BEFORE you create an animation sprite.")
    p.add_argument("--job",help="locked SpriteForge V3 job, especially for a retry")
    p.add_argument("--reference",help="approved character reference image, mandatory for new work")
    p.add_argument("--character",help="approved actor name")
    p.add_argument("--action",help="one movement/action only")
    p.add_argument("--out",required=True)
    args=p.parse_args()
    body,metadata=assistant_brief(args.out,args.job,args.reference,args.character,args.action)
    print(body)
    print("\nBRIEFING_COMPLETE_TOOL_NOT_GENERATOR",metadata["jobSha256"])
