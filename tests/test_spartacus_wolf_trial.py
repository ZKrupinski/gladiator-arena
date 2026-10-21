#!/usr/bin/env python3
"""Real offline input data and output framing smoke test for opt-in wolf trials."""
import io
import sys
import tempfile
import unittest
from pathlib import Path
from PIL import Image, ImageDraw

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
from spartacus_wolf_trial import MAP, EXTRA, prepare
from spartacus_uploader import check_asset

class TestWolfTrial(unittest.TestCase):
    def test_crop_free_original_pixels_and_all_nine_release_atlases(self):
        with tempfile.TemporaryDirectory() as temp:
            source=Path(temp)/"source"
            out=Path(temp)/"trial"
            source.mkdir()
            for idx,name in enumerate(sorted(set(MAP.values())|{EXTRA})):
                image=Image.new("RGBA",(1672,941))
                draw=ImageDraw.Draw(image)
                for frame in range(8):
                    x=(frame%4)*418; y=(frame//4)*470
                    draw.rectangle((x+30,y+40,x+380,y+380),
                                   fill=(40+idx,80+frame,170,255))
                    draw.rectangle((x+45,y+180,x+70,y+260),
                                   fill=(60+idx,90+frame,170,255))
                # Only the second row of one source touches the final y=940.
                if name=="28418.png":
                    draw.rectangle((25,938,50,940),fill=(255,0,22,255))
                image.save(source/name)
            payload,report=prepare(source,out)
            self.assertEqual(len(payload),10)
            self.assertEqual(len(report["sheets"]),9)
            self.assertEqual(report["excludedExtra"],EXTRA)
            self.assertTrue((out/"trial-qa.json").exists())
            for action in MAP:
                path="public/assets/beasts/wolf-trial/"+action+".webp"
                self.assertTrue(check_asset(path,payload[path],strict_art=True)["previewOnly"])
                with Image.open(io.BytesIO(payload[path])) as im:
                    self.assertEqual(im.size,(1672,942))
                    if action=="walk":
                        self.assertGreater(im.getpixel((35,940))[3],0)
            self.assertTrue(report["warnings"])
            self.assertFalse(report["productionArtApproved"])

if __name__=="__main__":
    unittest.main()
