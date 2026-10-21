#!/usr/bin/env python3
"""Production contract: briefing before render, one native 4x2 sheet, 8 cuts."""
import hashlib,json,os,tempfile,subprocess,sys
from pathlib import Path
from PIL import Image,ImageDraw
from spriteforge_pipeline_v3 import plan,generate,inspect
from spriteforge_preflight_v3 import make_brief,validate_acknowledgement,POLICY,CHECKS

def includes(report,code):
    assert code in str(report["failures"]),report["failures"]

with tempfile.TemporaryDirectory() as tmp:
    p=Path(tmp)
    ref=p/"approved.png"
    image=Image.new("RGBA",(1024,1024))
    ImageDraw.Draw(image).ellipse((100,100,860,910),fill=(155,95,55,255))
    image.save(ref)
    job_path=plan(ref,"wolf","idle",p/"job")
    job=json.loads(job_path.read_text(encoding="utf8"))
    assert job["requiredFrames"]==8 and job["motionsPerJob"]==1
    assert job["sheetGrid"]==[4,2]
    assert job["onlyAllowedGeneratedOutput"]=="ONE_4x2_TRANSPARENT_PNG_SHEET"
    assert "nativeFrameMinimum" not in job
    assert "nativeSheetMinimum" not in job
    assert job["resolutionPolicy"]=="ANY_POSITIVE_4x2_GRID_NO_PIXEL_FLOOR"
    assert "one_action_one_sheet_eight_frames_any_resolution" in job["rules"]
    assert "mandatory_before_every_generation_briefing" in job["rules"]
    assert job["rulesSha256"]==hashlib.sha256(POLICY.read_bytes()).hexdigest()
    b=json.loads((p/"job/preflight/briefing.json").read_text())
    assert b["resolutionPolicy"]=="ANY_POSITIVE_4x2_GRID_NO_PIXEL_FLOOR"
    assert len(b["briefingKorean"])>=10
    assert any("한 장" in line for line in b["briefingKorean"])

    adapter=Path(__file__).with_name("mock_spriteforge_adapter_v3.py")
    result=p/"art/result.json"
    generate(job_path,adapter,result)
    data=json.loads(result.read_text())
    assert "sheet" in data and "frames" not in data
    assert (p/"art/preflight/acknowledgement.json").exists()
    receipt=validate_acknowledgement(job_path,p/"art/preflight/briefing.json",
                                     p/"art/preflight/acknowledgement.json")
    assert receipt["preflightAccepted"]
    ok=inspect(job_path,result,p/"qa")
    assert ok["status"]=="TECHNICAL_PASS_PENDING_ART_AND_GAME_REVIEW",ok["failures"]
    assert not ok["releaseAuthorized"]
    exports=list((p/"qa/draft_frames/idle").glob("*.png"))
    assert len(exports)==8
    assert all(min(Image.open(file).size)>0 for file in exports)
    assert ok["frames"][0]["exportFoot"]==ok["frames"][7]["exportFoot"]

    saved=json.loads(result.read_text())
    result.write_text(json.dumps({
        "jobSha256":saved["jobSha256"],
        "preflightSha256":saved["preflightSha256"],
        "frames":["not-accepted.png"]*8
    }))
    includes(inspect(job_path,result,p/"eight-input"),"SINGLE_4x2_HIGH_RES_SHEET_REQUIRED_EIGHT_FILES_REJECTED")
    result.write_text(json.dumps(saved))

    # A small, complete source is valid. Alignment is still checked.
    low=p/"art/small-sheet.png"
    Image.open(p/"art"/saved["sheet"]).resize((640,320)).save(low)
    bad=dict(saved,sheet=low.name)
    result.write_text(json.dumps(bad))
    small=inspect(job_path,result,p/"small-resolution")
    assert small["status"]=="TECHNICAL_PASS_PENDING_ART_AND_GAME_REVIEW",small["failures"]
    result.write_text(json.dumps(saved))

    # The whole 4x2 sheet must be checked before any crops, not merely
    # individual cut-outs that would quietly amputate another pose.
    sheet_path=p/"art"/saved["sheet"]
    sheet=Image.open(sheet_path).copy()
    cell=sheet.width//4
    ImageDraw.Draw(sheet).rectangle((cell-95,300,cell+95,380),fill=(110,120,160,255))
    merged=p/"art/merged.png"
    sheet.save(merged)
    result.write_text(json.dumps(dict(saved,sheet=merged.name)))
    includes(inspect(job_path,result,p/"merged"),"MERGED_SILHOUETTE_ACROSS_GRID_SEAM_REGENERATE")
    result.write_text(json.dumps(saved))

    # Missing/wrong/stale acknowledgement cannot retrospectively count as
    # having listened to the pre-generation constitution.
    ack=p/"art/preflight/acknowledgement.json"
    old=ack.read_text()
    invalid=json.loads(old)
    invalid["checks"].pop("exactly_one_transparent_4x2_sheet_any_resolution")
    ack.write_text(json.dumps(invalid))
    includes(inspect(job_path,result,p/"no-ack"),"PREFLIGHT_OWNERSHIP_OR_CONTRACT_CHECK_UNACKNOWLEDGED")
    ack.write_text(old)

    assert not (p/"new.png").exists()
    os.environ["SPRITEFORGE_MOCK_REFUSE_ACK"]="1"
    try:
        generate(job_path,adapter,p/"blocked/result.json")
    except ValueError as err:
        assert "PREFLIGHT_PROVIDER_BRIEFING_REJECTED" in str(err)
    else:
        raise AssertionError("SHEET_RENDERED_WITHOUT_RULE_BRIEFING")
    finally:
        os.environ.pop("SPRITEFORGE_MOCK_REFUSE_ACK",None)
    assert not (p/"blocked/single-4x2-sheet.png").exists()

    try:generate(job_path,None,p/"disconnected/result.json")
    except ValueError as err:assert "GENERATOR_NOT_CONNECTED" in str(err)
    else:raise AssertionError("DISCONNECTED_PROVIDER_SHOULD_NEVER_DRAW")
    print("SPRITEFORGE_V3_MANDATORY_BRIEFING_ONE_NATIVE_4x2_SHEET_SOURCE_DETAIL_AND_QA_PASS")
