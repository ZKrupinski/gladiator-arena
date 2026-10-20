#!/usr/bin/env python3
"""Require a fresh briefing on EACH retry of exactly one 4x2 sprite sheet."""
import json,os,tempfile
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
    adapter=Path(__file__).with_name("mock_spriteforge_adapter_v3.py")
    os.environ["SPRITEFORGE_MOCK_FAIL_FIRST"]="1"
    try:
        result=auto_repair(job,root/"auto",adapter,max_retries=3)
    finally:
        os.environ.pop("SPRITEFORGE_MOCK_FAIL_FIRST",None)
    assert result["state"]=="TECHNICAL_PASS_PENDING_ART_AND_GAME_REVIEW",result
    assert len(result["attempts"])==2,result
    assert result["attempts"][0]["failures"],result
    assert not result["attempts"][1]["failures"],result
    assert not result["releaseAuthorized"]
    assert Path(result["attempts"][0]["review"]["contactPng"]).exists()
    assert Path(result["attempts"][1]["review"]["motionGif"]).exists()
    assert len(list(Path(result["finalDraft"]).glob("*.png")))==8

    first=root/"auto/attempt_00/preflight/briefing.json"
    second=root/"auto/attempt_01/preflight/briefing.json"
    first_ack=root/"auto/attempt_00/preflight/acknowledgement.json"
    second_ack=root/"auto/attempt_01/preflight/acknowledgement.json"
    assert all(x.exists() for x in (first,second,first_ack,second_ack))
    a=json.loads(first.read_text());b=json.loads(second.read_text())
    assert a["action"]==b["action"]=="idle"
    assert a["requiredGenerationArtifact"]==b["requiredGenerationArtifact"]=="ONE_TRANSPARENT_4x2_SPRITE_SHEET_ONLY"
    assert not a["previousAttemptErrors"] and b["previousAttemptErrors"]
    assert a["jobSha256"]!=b["jobSha256"]
    for attempt in result["attempts"]:
        info=json.loads(Path(attempt["result"]).read_text())
        assert info["sheet"] and "frames" not in info
        assert Path(attempt["result"]).parent.joinpath(info["sheet"]).exists()
        assert Path(attempt["result"]).parent.joinpath("preflight/acknowledgement.json").exists()

    disconnected=auto_repair(job,root/"disconnected",max_retries=2)
    assert disconnected["state"]=="GENERATOR_NOT_CONNECTED"
    assert disconnected["technicalPass"] is False
    assert (root/"disconnected/retry_pending.json").exists()
    print("SPRITEFORGE_V3_EACH_RETRY_BRIEFING_SINGLE_NATIVE_SHEET_AUTO_REQA_GIF_PASS")
