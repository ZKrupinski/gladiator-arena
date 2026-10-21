#!/usr/bin/env python3
"""No visual defects may remain as passive warnings: make retryable action jobs."""
import json,tempfile
from pathlib import Path
from build_beast_regeneration_queue_v3 import queue_from_audit
with tempfile.TemporaryDirectory() as dir:
 p=Path(dir)
 audit=p/"audit.json";queue=p/"queue.json"
 frames=[
    {"species":"wolf","action":"idle","index":0,"problems":[]},
    {"species":"wolf","action":"walk","index":3,
     "problems":["EDGE_RISK_REVIEW_BODY_OR_TAIL"],"ambiguousIslands":[]},
    {"species":"wolf","action":"walk","index":4,
     "problems":["VERIFIED_NEIGHBOR_BODY_PIXELS_REQUIRE_VISUAL_REVIEW"],
     "ambiguousIslands":[],"neighborOwnership":{"proofs":[{"side":"left","matchedPixels":800}]}},
    {"species":"leopard","action":"attack","index":6,
     "problems":["AMBIGUOUS_DETACHED_ART_REQUIRE_VISUAL_REVIEW"],
     "ambiguousIslands":[{"pixels":3441}]},
 ]
 audit.write_text(json.dumps({"protocol":"spriteforge-v3","checkedFrames":200,"frames":frames}))
 result=queue_from_audit(audit,queue)
 assert result["actionsRequiringRegeneration"]==2,result
 assert result["framesFlaggedByQA"]==3,result
 assert {j["character"] for j in result["items"]}=={"wolf","leopard"}
 assert all(j["framesPerAction"]==8 and j["status"]=="WAITING_FOR_CONNECTED_GENERATOR" for j in result["items"])
 assert all(j["preferred"]=="one transparent 4x2 RGBA sprite sheet per character/action at any valid resolution" and
            j["independentPngRole"]=="EXTRACTED_AFTER_QA_ONLY" for j in result["items"])
 assert "autoRegenerate" not in result or result["autoRunOnGeneratorConnection"] is True
 assert result["releaseAuthorized"] is False
 assert "--mode repair" in result["items"][0]["localRunCommand"]
 assert queue.exists()
 print("SPRITEFORGE_V3_ALL_FAILED_FRAMES_QUEUED_FOR_AUTO_REGENERATION_PASS")
