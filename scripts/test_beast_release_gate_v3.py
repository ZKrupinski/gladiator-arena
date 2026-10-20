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
    assert all(t["frames"]==8 and t["minimumNativePixelsPerFrame"]==[512,512] for t in tasks)
    assert all("NO_GENERATED_ACTION_QA" in b["reasons"] for b in r["blocked"])
    print("FIVE_BEAST_50_MOTION_RELEASE_BLOCKED_UNTIL_APPROVED_PASS")
