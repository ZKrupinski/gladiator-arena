#!/usr/bin/env python3
import json,tempfile
from pathlib import Path
from check_beast_release_v3 import validate
with tempfile.TemporaryDirectory() as tmp:
    p=Path(tmp)
    r=validate("config/beast-production-queue-v3.json",p/"no_art",p/"report.json")
    assert r["expected"]==50 and r["approved"]==0 and len(r["blocked"])==50
    assert not r["releaseReady"] and not r["productionAssetsModified"]
    tasks=json.loads(Path("config/beast-production-queue-v3.json").read_text())["tasks"]
    assert len(set(x["id"] for x in tasks))==50
    assert sum(t["required"] for t in tasks)==45
    assert all(t["frames"]==8 and t["sheetGrid"]==[4,2] and
               t["sourceMode"]=="EXACTLY_ONE_NATIVE_RGBA_4X2_SHEET" for t in tasks)
    assert all("minimumNativePixelsPerFrame" not in t and
               "minimumNativePixelsPerSheet" not in t for t in tasks)
    # A forged 'technical pass' on 512px cutouts with no generation preflight
    # must never lift the release gate.
    test_task=tasks[0]
    fake=p/"no_art"/test_task["character"]/test_task["action"]
    fake.mkdir(parents=True)
    (fake/"qa.json").write_text(json.dumps({
        "character":test_task["character"],"action":test_task["action"],
        "status":"TECHNICAL_PASS_PENDING_ART_AND_GAME_REVIEW",
        "releaseAuthorized":False,
        "frames":[{"native":[16,16]} for _ in range(8)]
    }))
    denied=validate("config/beast-production-queue-v3.json",p/"no_art",p/"fake-report.json")
    errors=next(row["reasons"] for row in denied["blocked"] if row["task"]==test_task["id"])
    assert "MISSING_VERIFIED_V3_PREGEN_BRIEFING" in errors, errors
    assert "SOURCE_SHEET_NATIVE_DETAIL_BELOW_FLOOR" not in errors, errors
    assert "INVALID_SOURCE_SHEET_CELL_GEOMETRY" not in errors, errors
    assert all("NO_GENERATED_ACTION_QA" in b["reasons"] for b in r["blocked"])
    print("FIVE_BEAST_50_MOTION_RELEASE_BLOCKED_UNTIL_APPROVED_PASS")
