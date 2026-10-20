#!/usr/bin/env python3
"""Test real adapter handshake, negative gates and intact 8-frame outputs."""
import hashlib,json,tempfile
from pathlib import Path
from PIL import Image,ImageDraw
from spriteforge_pipeline_v3 import plan,generate,inspect
with tempfile.TemporaryDirectory() as tmp:
    p=Path(tmp);ref=p/"approved.png"
    image=Image.new("RGBA",(1024,1024))
    ImageDraw.Draw(image).ellipse((100,100,860,910),fill=(155,95,55,255))
    image.save(ref)
    jobpath=plan(ref,"wolf","idle",p/"job")
    job=json.loads(jobpath.read_text())
    assert job["requiredFrames"]==8 and job["motionsPerJob"]==1
    assert job["nativeFrameMinimum"]==[512,512]
    assert "frame_ownership_over_pixel_size" in job["rules"]
    assert "full head, tail or leg" in job["frameOwnershipPolicy"]
    adapter=p/"provider.py"
    adapter.write_text("""
import sys,json,hashlib
from pathlib import Path
from PIL import Image,ImageDraw
j=Path(sys.argv[1]);s=json.loads(j.read_text())
assert s["motionsPerJob"]==1 and s["requiredFrames"]==8 and s["action"]=="idle"
dest=Path(sys.argv[2]);paths=[]
for i in range(8):
 im=Image.new("RGBA",(640,640));d=ImageDraw.Draw(im)
 d.ellipse((105+i*4,125,490+i*4,500+(i%3)*6),fill=(193,130,70,255))
 path=dest.parent/("frame"+str(i)+".png");im.save(path);paths.append(path.name)
dest.write_text(json.dumps({"jobSha256":hashlib.sha256(j.read_bytes()).hexdigest(),"frames":paths}))
""")
    result=p/"result.json"
    generate(jobpath,adapter,result)
    ok=inspect(jobpath,result,p/"qa")
    assert ok["status"]=="TECHNICAL_PASS_PENDING_ART_AND_GAME_REVIEW",ok["failures"]
    assert not ok["releaseAuthorized"]
    assert len(list((p/"qa/draft_frames/idle").glob("*.png")))==8
    assert ok["frames"][0]["exportFoot"]==ok["frames"][7]["exportFoot"]
    # A disconnected neighboring-pose body chunk must block even when it
    # resembles real anatomy rather than tiny alpha dust.
    first=p/"frame0.png";before=Image.open(first).copy()
    contamination=before.copy()
    ImageDraw.Draw(contamination).ellipse((558,170,612,227),fill=(193,130,70,255))
    contamination.save(first)
    body=inspect(jobpath,result,p/"foreign-body-QA")
    assert "POSSIBLE_FOREIGN_NEIGHBOR_BODY_PART_VERIFY_OWNERSHIP" in str(body["failures"]),body["failures"]
    before.save(first)
    # Identical poses cannot pass.
    Image.open(p/"frame0.png").save(p/"frame1.png")
    bad=inspect(jobpath,result,p/"duplicate")
    assert "DUPLICATE_POSE" in str(bad["failures"])
    # Reject legacy 1586 x 992 8x5 source: too small for 4x2 high-res.
    low=Image.new("RGBA",(1586,992));low.save(p/"legacy.png")
    (p/"legacy.json").write_text(json.dumps({
        "jobSha256":hashlib.sha256(jobpath.read_bytes()).hexdigest(),
        "sheet":"legacy.png"}))
    bad=inspect(jobpath,p/"legacy.json",p/"legacy-QA")
    assert "LOW_NATIVE_RESOLUTION_SHEET" in str(bad["failures"])
    # A physically merged actor across a cell seam must be rejected.
    sheet=Image.new("RGBA",(2560,1280));d=ImageDraw.Draw(sheet)
    for i in range(8):
        x=i%4*640;y=i//4*640
        d.ellipse((x+100,y+105,x+510,y+520),fill=(180,115,70,255))
    d.rectangle((480,300,745,365),fill=(180,115,70,255))
    sheet.save(p/"merged.png")
    (p/"merged.json").write_text(json.dumps({
        "jobSha256":hashlib.sha256(jobpath.read_bytes()).hexdigest(),
        "sheet":"merged.png"}))
    bad=inspect(jobpath,p/"merged.json",p/"joined-QA")
    assert "MERGED_SILHOUETTE_ACROSS_GRID_SEAM_REGENERATE" in str(bad["failures"])
    try:generate(jobpath,None,p/"fake-result.json")
    except ValueError as err: assert "GENERATOR_NOT_CONNECTED" in str(err)
    else:raise AssertionError("missing provider must not claim generation success")
    print("SPRITEFORGE_V3_GENERATION_CONTRACT_ALPHA_RESOLUTION_GATES_PASS")
