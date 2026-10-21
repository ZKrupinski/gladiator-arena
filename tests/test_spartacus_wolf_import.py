"""SpriteForge V3 wolf importer accepts any image size, not malformed artwork."""
import importlib.util
import pathlib
import sys
import tempfile
import unittest
from PIL import Image,ImageDraw

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from spartacus_uploader import UploadError
from spartacus_wolf_import import convert,ACTIONS

class TestWolfImport(unittest.TestCase):
    def test_nine_actions_required_and_no_false_release(self):
        self.assertEqual(ACTIONS,("idle","walk","attack1","attack2","attack3",
                                  "attack4","hit","death","roar"))
        with tempfile.TemporaryDirectory() as td:
            root=pathlib.Path(td)
            with self.assertRaisesRegex(UploadError,"WOLF_ACTION_NOT_PRESENT"):
                convert(root,root/"previews")
    def test_small_sheets_are_allowed_when_4x2_rgba_and_complete(self):
        with tempfile.TemporaryDirectory() as td:
            root=pathlib.Path(td)
            im=Image.new("RGBA",(160,80))
            draw=ImageDraw.Draw(im)
            for i in range(8):
                x=(i%4)*40;y=(i//4)*40
                draw.rectangle((x+5,y+5,x+30,y+30),
                               fill=(50+i*6,75,100,255))
            for action in ACTIONS:
                im.save(root/(action+".png"))
            package,review=convert(root,root/"previews")
            self.assertEqual(len(package),10)
            self.assertEqual(review["actions"]["idle"]["nativeSize"],[160,80])
    def test_connected_tail_across_nominal_grid_is_not_amputated(self):
        with tempfile.TemporaryDirectory() as td:
            root=pathlib.Path(td)
            atlas=Image.new("RGBA",(320,144))
            draw=ImageDraw.Draw(atlas)
            for i in range(8):
                x=(i%4)*80;y=(i//4)*72
                draw.rectangle((x+22,y+17,x+55,y+55),
                               fill=(80+i*5,115,140,255))
            # Tail protrudes five pixels into the next column. Its source
            # pixels belong to frame 0 and must not leak into frame 1.
            draw.rectangle((52,35,85,41),fill=(80,115,140,255))
            for action in ACTIONS: atlas.save(root/(action+".png"))
            package,report=convert(root,root/"previews")
            self.assertEqual(len(package),10)
            info=report["actions"]["idle"]["connectedAlphaOwnership"]
            self.assertTrue(info["frameOwners"][0]["crossesNominalCell"])
            self.assertFalse(info["frameOwners"][1]["crossesNominalCell"])
            self.assertEqual(info["orphanComponentsDiscarded"],0)
            from io import BytesIO
            rendered=Image.open(BytesIO(package[
                "public/assets/beasts/wolf-v3/idle.webp"])).convert("RGBA")
            self.assertGreater(rendered.width,320)
            cw=rendered.width//4
            first=rendered.crop((0,0,cw,rendered.height//2))
            other=rendered.crop((cw,0,cw*2,rendered.height//2))
            self.assertGreater(first.getchannel("A").getbbox()[2]-
                               first.getchannel("A").getbbox()[0],
                               other.getchannel("A").getbbox()[2]-
                               other.getchannel("A").getbbox()[0])

    def test_frame_seam_is_hard_blocked_even_if_sheet_pixels_are_large(self):
        with tempfile.TemporaryDirectory() as td:
            root=pathlib.Path(td)
            im=Image.new("RGBA",(3072,1536))
            brush=ImageDraw.Draw(im)
            for j in range(2):
                for i in range(4):
                    x=i*768;y=j*768
                    brush.rectangle((x+50,y+70,x+720,y+700),fill=(55,80,110,255))
            brush.rectangle((0,100,100,160),fill=(50,75,100,255))
            im.save(root/"idle.png")
            with self.assertRaisesRegex(UploadError,"SOURCE_SILHOUETTE_CLIPPED_AT_SHEET_EDGE"):
                convert(root,root/"previews")

if __name__=="__main__":unittest.main()
