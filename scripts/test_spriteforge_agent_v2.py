#!/usr/bin/env python3
import json,tempfile
from pathlib import Path
from PIL import Image,ImageDraw
from spriteforge_agent_v2 import execute,ACTIONS,canonical,contract,MOTION
def make(file,debris=False,merge=False):
 im=Image.new("RGBA",(2800,1600));d=ImageDraw.Draw(im)
 for i in range(8):
  x=i%4*700;y=i//4*800
  d.ellipse((x+155+i%3*8,y+180,x+545+i%3*8,y+646),fill=(220,165-i,88,255))
  d.ellipse((x+460+i%3*8,y+520,x+549+i%3*8,y+656),fill=(220,165-i,88,255))
  if i==0 and debris:d.ellipse((x+677,y+410,x+692,y+425),fill=(230,40,60,255))
  if i==1 and merge:d.rectangle((x+530,y+365,x+780,y+415),fill=(230,155,88,255))
 im.save(file)
with tempfile.TemporaryDirectory() as root:
 base=Path(root)
 for case in ["clean","debris","merged"]:
  make(base/(case+".png"),case=="debris",case=="merged")
  (base/"manifest.json").write_text(json.dumps({"character":"wolf","actions":{"idle":case+".png"}}))
  data=execute(base/"manifest.json",base/case,only=["idle"])
  item=data["actions"]["idle"];assert item["frameCount"]==8
  assert all(f["scaleFactorIdenticalAcrossAllFrames"]==1 for f in item["frames"])
  assert (base/case/"idle_contact.jpg").exists()
  assert all((base/case/"frames/idle"/f"{i:02}.png").exists() for i in range(8))
  if case=="clean":assert item["status"]=="MACHINE_PASS"
  if case=="debris":
   assert item["frames"][0]["foreignPixelsRemoved"]>0
   assert item["status"]=="MACHINE_PASS"
  if case=="merged":
   assert item["status"]=="BLOCKED"
   assert any(x["errors"] for x in item["frames"])
   assert json.loads((base/case/"regeneration_requests.json").read_text())[0]["status"]=="REGENERATE_ONLY_THIS_ACTION"
  assert not data["mayReplaceGameArt"]
 # Dynamic extra motion, with its own approved 8-frame timeline and QA contract.
 curve=[[0,0],[0,-2],[0,-6],[4,-10],[9,-8],[3,-3],[0,0],[0,0]]
 (base/"extra.json").write_text(json.dumps({"character":"wolf","extraActions":{"custom_howl":{"fps":9,"rootMotion":curve}},"actions":{"custom_howl":"clean.png"}}))
 extra=execute(base/"extra.json",base/"extra_out",only=["custom_howl"])
 assert extra["actions"]["custom_howl"]["frameCount"]==8
 assert extra["actions"]["custom_howl"]["fps"]==9
 assert extra["actions"]["custom_howl"]["frames"][4]["rootMotion"]=={"dx":9,"dy":-8}
 policy=json.loads((base/"extra_out"/"generation_contract.json").read_text())
 assert "guard_and_roar_separate" in policy["qcRuleIds"]
 assert "custom_howl" in policy["optionalRegistered"]
 assert canonical("attack2")=="sweep" and canonical("attack4")=="heavy"
 assert canonical("special_roar")=="roar"
 assert len(ACTIONS)==9 and "guard" in ACTIONS and "roar" not in ACTIONS
 assert contract("wolf")["canonicalActions"]==list(ACTIONS)
 assert len(MOTION["thrust"])==8 and max(x for x,y in MOTION["thrust"])>25
 assert min(y for x,y in MOTION["thrust"])<0
 print("SPRITEFORGE_V2_GENERATION_QA_9X8_PASS")
