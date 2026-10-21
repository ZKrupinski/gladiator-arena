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
    def test_frame_seam_is_hard_blocked_even_if_sheet_pixels_are_large(self):
        with tempfile.TemporaryDirectory() as td:
            root=pathlib.Path(td)
            im=Image.new("RGBA",(3072,1536))
            brush=ImageDraw.Draw(im)
            for j in range(2):
                for i in range(4):
                    x=i*768;y=j*768
                    brush.rectangle((x+50,y+70,x+720,y+700),fill=(55,80,110,255))
            brush.rectangle((10,100,100,160),fill=(50,75,100,255))
            im.save(root/"idle.png")
            with self.assertRaisesRegex(UploadError,"SPRITEFORGE_FRAME_OWNERSHIP_EDGE_RISK"):
                convert(root,root/"previews")

if __name__=="__main__":unittest.main()
