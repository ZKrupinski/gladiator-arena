#!/usr/bin/env python3
"""Art-oriented, strict technical release check for shared animal VFX."""
from __future__ import annotations
import hashlib, json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/"public/assets/beasts/effects-v1"
QA=ROOT/"docs/beast-vfx-v1/qa.json"
EXPECTED={
  "claw": "ed27120e9f4546b857e3e9af7428afe951841ffb2eb25918b8ba1b7a341d5ca6",
  "sweep": "b91e68fb4d24541e245168ede5429640863b32de96a6cbabff86de72fddc9a8f",
  "bite": "81c79c021eea42f755514a860d0c1c62e1a2e7a77a1ef7bde7865b301f0fc254",
  "pounce": "b1ee74a75d314cc393e18feeb2644e9cd4dc71a8dc47407b778fa9caf5e99f17",
  "hit": "73e07c930308f60d85af450534eb8ad1f96342808215b248903092e83c9af8d7",
  "step": "457d27d257247145ef91b5587d0baea6c156da9acc5c13e9749c60c9f3df46b1",
  "roar": "a95d014aaf8ae39e24dee7b73b9f740172f5b3896521513baed299ea27c2fa96",
  "collapse": "879c8913d3c72daec82345fbc0abc19b6d2432724877d001cf02b0a9ae0647f6"
}
def verify():
    manifest=json.loads((BASE/"manifest.json").read_text())
    assert manifest["version"]==1 and manifest["previewOnly"] is True
    assert manifest["grid"]==[4,2] and manifest["frames"]==8
    assert set(manifest["families"])==set(EXPECTED)
    qa=json.loads(QA.read_text())
    assert qa["releaseAuthorized"] is False  # requires gameplay art sign-off
    checked={}
    for family,want_sha in EXPECTED.items():
        filename=family+".webp"
        assert manifest["families"][family]==filename
        data=(BASE/filename).read_bytes()
        got=hashlib.sha256(data).hexdigest()
        assert got==want_sha,(family,"BYTE_SHA_MISMATCH",got)
        with Image.open(BASE/filename) as im:
            im.load()
            assert im.mode=="RGBA",(family,"ALPHA_MISSING")
            W,H=im.size
            assert W>0 and H>0 and W%4==0 and H%2==0,(family,"GRID_BAD")
            cellW,cellH=W//4,H//2
            poses=set()
            pixels=[]
            margins=[]
            for n in range(8):
                frame=im.crop((n%4*cellW,n//4*cellH,(n%4+1)*cellW,(n//4+1)*cellH))
                alpha=frame.getchannel("A")
                bb=alpha.getbbox()
                assert bb is not None,(family,n,"EMPTY_FRAME")
                # Never infer art quality from absolute native dimensions.
                margin=min(bb[0],bb[1],cellW-bb[2],cellH-bb[3])
                assert margin>=max(2,min(cellW,cellH)//30),(family,n,"FRAME_SEAM_OR_TRUNCATION",margin)
                poses.add(hashlib.sha256(frame.tobytes()).hexdigest())
                pixels.append(sum(count for v,count in enumerate(alpha.histogram()) if v>32))
                margins.append(margin)
            assert len(poses)==8,(family,"DUPLICATE_POSES")
            checked[family]={"size":[W,H],"frames":8,"minAlphaPixels":min(pixels),
                             "minCellGutter":min(margins),"sha256":got}
    print("BEAST_VFX_V1_BYTES_ALPHA_GUTTERS_EIGHT_FRAMES_VERIFIED")
    return checked

if __name__=="__main__":
    import pprint
    pprint.pp(verify())
