#!/usr/bin/env python3
"""All art generators, including manual ChatGPT art, get the same V3 briefing."""
from pathlib import Path
import hashlib,json,subprocess,sys,tempfile
from PIL import Image,ImageDraw
from spriteforge_assistant_brief_v3 import assistant_brief

ROOT=Path(__file__).resolve().parents[1]
instructions=(ROOT/"AGENTS.md").read_text(encoding="utf8")
assert "게임에 적용할 애니메이션 시트 만들자" in instructions
assert "ChatGPT image generation" in instructions
assert "before" in instructions.lower()

with tempfile.TemporaryDirectory() as temp:
    root=Path(temp)
    reference=root/"approved.png"
    pic=Image.new("RGBA",(1200,1000))
    ImageDraw.Draw(pic).ellipse((130,95,960,924),fill=(140,140,55,255))
    pic.save(reference)
    brief,session=assistant_brief(root/"run",reference=reference,character="wolf",action="walk")
    job_path=Path(session["jobPath"])
    j=json.loads(job_path.read_text(encoding="utf8"))
    assert session["character"]=="wolf" and session["action"]=="walk"
    assert "nativeFrameMinimum" not in j
    assert "nativeSheetMinimum" not in j
    assert j["resolutionPolicy"]=="ANY_POSITIVE_4x2_GRID_NO_PIXEL_FLOOR"
    assert "무조건 캐릭터 하나·동작 하나" in brief
    assert "4×2" in brief
    assert "옆 프레임" in brief
    assert "원본" in brief
    assert session["generatedSprite"] is False
    assert session["providerAcked"] is False
    assert session["artReviewed"] is False
    assert len(json.loads(Path(session["briefingPath"]).read_text())["blockingRules"])>5

    # Previously diagnosed failures are repeated in the next briefing.
    retry=json.loads(job_path.read_text())
    retry["retryAttempt"]=1
    retry["retryFailures"]=[{"frame":4,"reasons":["FOREIGN_NEIGHBOR_HEAD_AND_TAIL"]}]
    retry_path=root/"retry.json"
    retry_path.write_text(json.dumps(retry))
    retry_brief,session2=assistant_brief(root/"retry",job=retry_path)
    assert "FOREIGN_NEIGHBOR_HEAD_AND_TAIL" in retry_brief
    assert session2["jobSha256"] != session["jobSha256"]

    # Tool cannot pretend a missing approved reference exists.
    try:assistant_brief(root/"missing",character="wolf",action="walk")
    except ValueError as e: assert "APPROVED_REFERENCE" in str(e)
    else:raise AssertionError("MISSING_REFERENCE_MUST_BLOCK")

    # Policy must be current at the moment the briefing is printed.
    old=json.loads(job_path.read_text())
    old["rulesSha256"]="0"*64
    stale=root/"stale.json"
    stale.write_text(json.dumps(old))
    try:assistant_brief(root/"outdated",job=stale)
    except ValueError as e: assert "POLICY_CHANGED" in str(e)
    else:raise AssertionError("OLD_RULES_ACCEPTED")

    # No image file is generated merely by briefing.
    assert not list((root/"run").rglob("*.png"))
print("SPRITEFORGE_V3_ASSISTANT_TRIGGER_MANDATORY_PREFLIGHT_BEFORE_IMAGEGEN_PASS")
