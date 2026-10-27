#!/usr/bin/env python3
"""Regression: QA warnings cannot delete one of the eight original poses."""
from __future__ import annotations
import tempfile
import unittest
from pathlib import Path
from PIL import Image, ImageDraw
from spriteforge_preserve8_review import extract_review, review_directory


def example_sheet(fuse=False):
    image = Image.new("RGBA", (4 * 64, 2 * 60), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    for i in range(8):
        x, y = i % 4 * 64, i // 4 * 60
        d.rectangle((x + 16, y + 10, x + 47, y + 50),
                    fill=(120 + i, 90, 70, 255))
    if fuse:
        # Illegally merge two neighboring pose silhouettes. Production V6
        # must still fail, but 8 provisional previews must survive.
        d.rectangle((40, 29, 90, 34), fill=(100, 80, 70, 255))
    return image


class PreserveEightTests(unittest.TestCase):
    def test_good_sheet_keeps_eight(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "idle.png"
            example_sheet().save(source)
            report = extract_review(source, root / "out", "idle")
            self.assertEqual(report["framesPreserved"], 8)
            self.assertFalse(report["releaseAuthorized"])
            self.assertEqual(len(list((root / "out").glob("idle_??.png"))), 8)

    def test_fused_frames_warn_but_no_frame_is_deleted(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "slash.png"
            example_sheet(fuse=True).save(source)
            report = extract_review(source, root / "out", "slash")
            self.assertEqual(report["framesPreserved"], 8)
            self.assertEqual(len(report["frames"]), 8)
            self.assertEqual(report["extractionMethod"], "UNREVIEWED_GRID_PREVIEW_ONLY")
            self.assertTrue(all(p["status"] != "OK" for p in report["frames"]))
            self.assertEqual((root / "out" / "original_source.png").read_bytes(),
                             source.read_bytes())

    def test_odd_height_is_padded_not_amputated(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "guard.png"
            sample = Image.new("RGBA", (256, 119), (0, 0, 0, 0))
            ImageDraw.Draw(sample).rectangle((5, 5, 17, 29),
                                              fill=(200, 100, 50, 255))
            sample.save(source)
            report = extract_review(source, root / "out", "guard")
            self.assertEqual(report["framesPreserved"], 8)
            self.assertEqual(Image.open(root / "out" / "source_grid_padded.png").size,
                             (256, 120))
            self.assertFalse(report["releaseAuthorized"])

    def test_missing_action_sheets_not_replaced_with_silence(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "in"
            source.mkdir()
            for action in ("idle", "walk"):
                example_sheet().save(source / (action + ".png"))
            report = review_directory(source, root / "out")
            self.assertEqual(report["totalFrames"], 16)
            self.assertEqual(list(report["actions"]), ["idle", "walk"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
