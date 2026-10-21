#!/usr/bin/env python3
"""Conservative release gate. Never copy draft sprites to the game automatically."""
import argparse,json
from pathlib import Path
from PIL import Image

def validate(queue,root,report_path):
    spec=json.loads(Path(queue).read_text(encoding="utf8"))
    root=Path(root)
    report={"expected":len(spec["tasks"]),"approved":0,"blocked":[],
            "releaseReady":False,"productionAssetsModified":False}
    for task in spec["tasks"]:
        base=root/task["character"]/task["action"]
        reasons=[];qa_path=base/"qa.json";sign_path=base/"approval.json"
        if not qa_path.exists():reasons.append("NO_GENERATED_ACTION_QA")
        else:
            try:
                q=json.loads(qa_path.read_text())
                if (q.get("character"),q.get("action"))!=(task["character"],task["action"]):
                    reasons.append("WRONG_ACTION_OR_CHARACTER")
                if q.get("status")!="TECHNICAL_PASS_PENDING_ART_AND_GAME_REVIEW":
                    reasons.append("V3_QA_NOT_PASSED")
                if q.get("releaseAuthorized") is not False:reasons.append("UNTRUSTED_RELEASE_FLAG")
                frames=q.get("frames",[])
                if len(frames)!=8:reasons.append("NOT_EIGHT_QA_FRAMES")
                preflight=q.get("preflight")
                if (not isinstance(preflight,dict) or
                    preflight.get("preflightAccepted") is not True or
                    (preflight.get("character"),preflight.get("action"))!=
                      (task["character"],task["action"])):
                    reasons.append("MISSING_VERIFIED_V3_PREGEN_BRIEFING")
                # Validate recorded geometry when provided, but accept any
                # positive dimensions. Image size NEVER approves/rejects art.
                if len(frames)==8:
                    for frame in frames:
                        dims=frame.get("native") if isinstance(frame,dict) else None
                        if (not isinstance(dims,list) or len(dims)!=2 or
                            any(type(value) is not int or value<=0 for value in dims)):
                            reasons.append("INVALID_SOURCE_SHEET_CELL_GEOMETRY")
                            break
                images=sorted((base/"draft_frames"/task["action"]).glob("*.png"))
                if len(images)!=8:reasons.append("NOT_EIGHT_PNGS")
                for im_path in images:
                    with Image.open(im_path) as im:
                        if im.mode!="RGBA" or not all(d>0 for d in im.size):
                            reasons.append("INVALID_OR_MISSING_ALPHA")
                            break
            except (ValueError,OSError,KeyError) as e:
                reasons.append("INVALID_QA_OR_IMAGE_"+type(e).__name__)
        if not sign_path.exists():reasons.append("NO_VISUAL_AND_GAMEPLAY_APPROVAL")
        else:
            try:
                a=json.loads(sign_path.read_text())
                if (a.get("character"),a.get("action"),a.get("referenceSha256"))!=(
                        task["character"],task["action"],task["approvedReferenceSha256"]):
                    reasons.append("REFERENCE_IDENTITY_NOT_APPROVED")
                if a.get("visualReviewApproved") is not True or a.get("inGamePlaytestApproved") is not True:
                    reasons.append("ART_AND_GAME_REVIEW_NOT_APPROVED")
            except (ValueError,OSError,KeyError):
                reasons.append("INVALID_APPROVAL_JSON")
        if reasons:report["blocked"].append({"task":task["id"],"reasons":reasons})
        else:report["approved"]+=1
    report["releaseReady"]=report["approved"]==report["expected"] and not report["blocked"]
    target=Path(report_path);target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf8")
    return report

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--queue",default="config/beast-production-queue-v3.json")
    p.add_argument("--packs",required=True)
    p.add_argument("--report",required=True)
    p.add_argument("--audit-only",action="store_true")
    a=p.parse_args()
    r=validate(a.queue,a.packs,a.report)
    print(json.dumps({"expected":r["expected"],"approved":r["approved"],"blocked":len(r["blocked"]),"releaseReady":r["releaseReady"]}))
    if not r["releaseReady"] and not a.audit_only:raise SystemExit(2)
