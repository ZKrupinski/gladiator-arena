#!/usr/bin/env python3
"""Convert 200-frame SpriteForge V3 audit failures into actionable 8-frame jobs.

Any unclean OR uncertain imported frame triggers regeneration of the ENTIRE
affected action, not permanent NEEDS QA. With a real provider adapter, each
job is executed and retried automatically. Without one, no fake results.
"""
import argparse,json
from collections import defaultdict
from pathlib import Path
from spriteforge_pipeline_v3 import plan
from spriteforge_auto_repair_v3 import auto_repair

ROOT=Path(__file__).resolve().parents[1]

def queue_from_audit(audit_path, queue_path, adapter=None, output=None, max_retries=3):
    audit=json.loads(Path(audit_path).read_text(encoding="utf8"))
    if audit.get("protocol")!="spriteforge-v3" or audit.get("checkedFrames")!=200:
        raise ValueError("NOT_A_COMPLETE_SPRITEFORGE_V3_BEAST_AUDIT")
    bad=defaultdict(list)
    for frame in audit["frames"]:
        problems=frame.get("problems",[])
        if problems:
            bad[(frame["species"],frame["action"])].append({
              "frame":int(frame["index"])+1,
              "errorCodes":sorted(set(problems)),
              "ambiguousNeighborBodyCount":len(frame.get("ambiguousIslands",[])),
              "sourceNeighborProof":frame.get("neighborOwnership",{}).get("proofs",[]),
              "mandatoryCorrection":"Replace the foreign-owned body or clipped anatomy; preserve only this pose's full actor.",
            })
    pending=[]
    root=Path(output or Path(queue_path).parent/"beast-v3-auto-repair")
    for (kind,action),fails in sorted(bad.items()):
        reference=f"public/assets/beasts/{kind}-40.png"
        data={
          "character":kind,"action":action,"framesPerAction":8,
          "referencePath":reference,
          "failures":fails,"status":"REGENERATION_REQUIRED",
          "causeKnown":True,
          "preferred":"one native high-resolution 4x2 RGBA sprite sheet per character/action",
          "independentPngRole":"EXTRACTED_AFTER_QA_ONLY",
          "doNotReuseContaminatedFrames":True,
          "retryPolicy":{"attempts":max_retries,"autoRegenerate":True,
                         "autoQC":True,"emitAnimatedPreview":True},
        }
        folder=root/kind/action
        if adapter:
            if not Path(adapter).is_file():
                data["status"]="GENERATOR_ADAPTER_NOT_CONNECTED"
            else:
                job=plan(ROOT/reference,kind,action,folder/"job",extra=(action,))
                result=auto_repair(job,folder/"result",adapter,max_retries=max_retries)
                data["status"]=result["state"]
                data["attemptCount"]=len(result["attempts"])
                data["reviewFolder"]=str(folder/"result")
                data["productionApproved"]=False
        else:
            data["status"]="WAITING_FOR_CONNECTED_GENERATOR"
            data["localRunCommand"]=(
                f"python scripts/spriteforge_pipeline_v3.py --mode plan "
                f"--reference {reference} --character {kind} --action {action} "
                f"--extra {action} --out build/beasts/{kind}/{action}/job "
                f"&& python scripts/spriteforge_pipeline_v3.py --mode repair "
                f"--job build/beasts/{kind}/{action}/job/generator_job.json "
                f"--adapter /trusted/comfyui_adapter.py --max-retries {max_retries} "
                f"--out build/beasts/{kind}/{action}/auto-repair"
            )
        pending.append(data)
    queue={"protocol":"spriteforge-v3-action-regeneration-queue",
           "auditedSourceFrames":200,"actionsRequiringRegeneration":len(pending),
           "framesFlaggedByQA":sum(len(j["failures"]) for j in pending),
           "connectedProvider":bool(adapter),
           "autoRunOnGeneratorConnection":True,
           "releaseAuthorized":False,
           "items":pending}
    target=Path(queue_path)
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(queue,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    return queue

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--audit",default="docs/qa/beast-legacy-v3-audit.json")
    p.add_argument("--queue",default="docs/qa/beast-v3-regeneration-queue.json")
    p.add_argument("--adapter",help="Trusted connected provider adapter; if omitted create queue without faking art")
    p.add_argument("--out",default="build/spriteforge-beasts")
    p.add_argument("--max-retries",type=int,default=3)
    args=p.parse_args()
    report=queue_from_audit(args.audit,args.queue,args.adapter,args.out,args.max_retries)
    print(json.dumps({"status":"REGENERATION_JOBS_PREPARED",
                      "actions":report["actionsRequiringRegeneration"],
                      "flaggedFrames":report["framesFlaggedByQA"],
                      "connectedProvider":report["connectedProvider"],
                      "releaseAuthorized":False},ensure_ascii=False))
