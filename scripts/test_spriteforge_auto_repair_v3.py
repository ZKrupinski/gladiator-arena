#!/usr/bin/env python3
"""Test the real SpriteForge V3 failed-action regenerate/recheck/preview flow."""
import json,hashlib,tempfile
from pathlib import Path
from PIL import Image,ImageDraw
from spriteforge_pipeline_v3 import plan
from spriteforge_auto_repair_v3 import auto_repair

with tempfile.TemporaryDirectory() as temp:
    root=Path(temp)
    ref=root/"reference.png"
    im=Image.new("RGBA",(1024,1024))
    ImageDraw.Draw(im).ellipse((110,130,850,900),fill=(110,125,168,255))
    im.save(ref)
    job=plan(ref,"wolf","idle",root/"job")
    # Adapter deliberately returns an invalid output first, then correctly
    # uses QC failure evidence to regenerate every frame in this action.
    adapter=root/"adapter.py"
    adapter.write_text("""
import json,hashlib,sys
from pathlib import Path
from PIL import Image,ImageDraw
job_file=Path(sys.argv[1]);answer=Path(sys.argv[2])
job=json.loads(job_file.read_text())
retry=job.get("retryAttempt",0)
if retry:
  assert job["fixOnlyFailedAction"] and job["regenerateFullActionEightFrames"]
  assert job["retryFailures"]
frames=[]
for i in range(8):
  im=Image.new("RGBA",(640,640));d=ImageDraw.Draw(im)
  d.ellipse((108+i*3,138,490+i*3,522),fill=(112,175,105,255))
  if retry==0 and i==3:
    d.ellipse((570,90,623,144),fill=(200,10,10,255))
  file=answer.parent/("pose"+str(i)+".png")
  im.save(file)
  frames.append(file.name)
answer.write_text(json.dumps({"jobSha256":hashlib.sha256(job_file.read_bytes()).hexdigest(),"frames":frames}))
""",encoding="utf8")
    result=auto_repair(job,root/"auto",adapter,max_retries=3)
    assert result["state"]=="TECHNICAL_PASS_PENDING_ART_AND_GAME_REVIEW",result
    assert len(result["attempts"])==2,result
    assert result["attempts"][0]["failures"],result
    assert not result["attempts"][1]["failures"],result
    assert not result["releaseAuthorized"]
    assert Path(result["attempts"][0]["review"]["contactPng"]).exists()
    assert Path(result["attempts"][1]["review"]["motionGif"]).exists()
    assert len(list(Path(result["finalDraft"]).glob("*.png")))==8
    # No installed image provider: fail closed without claiming regenerated art.
    blocked=auto_repair(job,root/"disconnected",max_retries=2)
    assert blocked["state"]=="GENERATOR_NOT_CONNECTED" and not blocked["technicalPass"]
    assert (root/"disconnected/retry_pending.json").exists()
    print("SPRITEFORGE_V3_QA_AUTO_REGENERATION_RETRY_GIF_AND_PROVIDER_DISCONNECT_PASS")
