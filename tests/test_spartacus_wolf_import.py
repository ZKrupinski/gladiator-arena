"""SpriteForge V3 wolf profile must not silently deploy undersized sprites."""
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
    def test_legacy_image_native_resolution_cannot_be_upscaled(self):
        with tempfile.TemporaryDirectory() as td:
            root=pathlib.Path(td)
            im=Image.new("RGBA",(1672,941))
            for x in range(0,1672,418):
                ImageDraw.Draw(im).rectangle((x+25,100,x+385,420),fill=(50,75,100,255))
            im.save(root/"idle.png")
            with self.assertRaisesRegex(UploadError,"SPRITEFORGE_V3_NATIVE_HIGH_RES_NOT_MET"):
                convert(root,root/"previews")
            self.assertFalse((root/"previews"/"manifest.json").exists())
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
