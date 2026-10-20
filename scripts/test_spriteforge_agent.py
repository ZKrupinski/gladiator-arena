#!/usr/bin/env python3
import json, tempfile
from pathlib import Path
from PIL import Image,ImageDraw
from spriteforge_agent import run
def demo(s,blocked=False):
    im=Image.new("RGBA",(2400,1200))
    d=ImageDraw.Draw(im)
    for i in range(8):
        x=(i%4)*600+130;y=(i//4)*600+135
        d.ellipse((x,y,x+338+(i%4)*4,y+305+(i//4)*7),fill=(194,127,88,255))
    if blocked:
        d.rectangle((0,25,85,90),fill=(220,100,80,255))
    im.save(s)
with tempfile.TemporaryDirectory() as d:
    root=Path(d)
    demo(root/"idle.png")
    demo(root/"walk.png",True)
    (root/"manifest.json").write_text(json.dumps({"character":"wolf","actions":{"idle":"idle.png","walk":"walk.png"}}))
    r=run(root/"manifest.json",root/"out")
    assert r==2
    q=json.loads((root/"out/qa.json").read_text())
    assert q["actions"]["idle"]["status"]=="MACHINE_PASS"
    assert q["actions"]["walk"]["status"]=="BLOCKED"
    assert len(q["unprovided"])==8
    assert (root/"out/contact_idle.jpg").exists()
    assert (root/"out/preview_walk.gif").exists()
    assert not q["fullGameReplacementAllowed"]
    print("AGENT_SPRITEFORGE_TEST_PASS")
