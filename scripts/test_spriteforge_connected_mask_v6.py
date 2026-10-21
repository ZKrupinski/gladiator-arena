#!/usr/bin/env python3
"""Regression corpus: tiny gladiator, wolf, oversized tail, neighbor overlap.

No animation source is deleted and no ambiguous piece can pass automatically.
"""
import unittest
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import numpy as np
from PIL import Image, ImageDraw
from spriteforge_connected_mask_v6 import OwnershipError, extract_owned_frames

CW,CH=80,72

def atlas(w=CW,h=CH):
    img=Image.new("RGBA",(4*w,2*h),(0,0,0,0))
    draw=ImageDraw.Draw(img)
    for i in range(8):
        x=i%4*w;y=i//4*h
        # Solid center plus small native accessory, but all one component.
        draw.rectangle((x+int(w*.28),y+int(h*.22),
                        x+int(w*.65),y+int(h*.79)),
                       fill=(80+i*12,114,162,255))
    return img

class TestTopologyExtraction(unittest.TestCase):
    def test_eight_complete_frames_and_no_resampling(self):
        original=atlas()
        frames,report=extract_owned_frames(original)
        self.assertEqual(len(frames),8)
        self.assertEqual(report["extractor"],"CONNECTED_ALPHA_FULL_SHEET_UNIQUE_CORE_V6")
        self.assertEqual([p.size for p in frames],[frames[0].size]*8)
        self.assertEqual(report["orphanComponentsDiscarded"],0)
        self.assertEqual([int(np.asarray(f)[:,:,3].sum()) for f in frames],
                         [int(np.asarray(original.crop((i%4*CW,i//4*CH,
                             (i%4+1)*CW,(i//4+1)*CH)))[:,:,3].sum()) for i in range(8)])
        # X origin is shared, not recentered from each bbox.
        self.assertEqual([x["outputOrigin"][0] for x in report["frameOwners"]],
                         [report["frameOwners"][0]["outputOrigin"][0]]*8)

    def test_real_connected_tail_crosses_seam_and_is_preserved(self):
        img=atlas()
        d=ImageDraw.Draw(img)
        # First wolf's tail extends across the nominal x=80 seam, never
        # touches neighbor pose, and is CONNECTED to the first body.
        d.rectangle((CW//2,CH//2,CW+5,CH//2+5),fill=(80,114,162,255))
        frames,report=extract_owned_frames(img)
        self.assertTrue(report["frameOwners"][0]["crossesNominalCell"])
        self.assertFalse(report["frameOwners"][1]["crossesNominalCell"])
        self.assertEqual(len(frames),8)
        # In the source, sample x=83 y=38 belongs to first actor, not second.
        mask0=np.asarray(frames[0].getchannel("A"))
        mask1=np.asarray(frames[1].getchannel("A"))
        self.assertGreater(int(np.count_nonzero(mask0)),int(np.count_nonzero(mask1)))
        self.assertTrue(all(f.size==frames[0].size for f in frames))

    def test_glued_neighbor_poses_must_block_not_amputate(self):
        img=atlas()
        d=ImageDraw.Draw(img)
        d.rectangle((CW//2,CH//2,CW+CW//2,CH//2+5),fill=(100,100,100,255))
        with self.assertRaisesRegex(OwnershipError,"FUSED_NEIGHBOR_POSES"):
            extract_owned_frames(img)

    def test_orphan_piece_near_frame_is_not_deleted_as_noise(self):
        img=atlas()
        ImageDraw.Draw(img).ellipse((CW-8,3,CW+6,15),fill=(245,60,40,255))
        with self.assertRaisesRegex(OwnershipError,"DETACHED_OR_FOREIGN_PART"):
            extract_owned_frames(img)

    def test_two_separate_core_objects_need_review_even_if_small(self):
        img=atlas()
        ImageDraw.Draw(img).rectangle((CW//2,4,CW//2+3,11),fill=(240,60,90,255))
        # This new object is outside the main body, but still central x.
        with self.assertRaisesRegex(OwnershipError,"MULTIPLE_BODY_COMPONENTS"):
            extract_owned_frames(img)

    def test_large_disconnected_neighbor_head_is_not_allowed(self):
        img=atlas()
        ImageDraw.Draw(img).ellipse((CW-12,2,CW+12,24),fill=(230,60,40,255))
        with self.assertRaisesRegex(OwnershipError,"DETACHED_OR_FOREIGN_PART|MULTIPLE_BODY_COMPONENTS"):
            extract_owned_frames(img)

    def test_tiny_character_is_accepted(self):
        img=Image.new("RGBA",(64,32))
        d=ImageDraw.Draw(img)
        for k in range(8):
            x=k%4*16;y=k//4*16
            d.rectangle((x+6,y+5,x+9,y+10),fill=(80+k,90,100,255))
        frames,report=extract_owned_frames(img)
        self.assertEqual(len(frames),8)
        self.assertEqual(report["nominalCell"],[16,16])

    def test_edge_cut_source_cannot_be_reconstructed_by_padding(self):
        img=atlas()
        ImageDraw.Draw(img).rectangle((0,CH//2,35,CH//2+5),fill=(85,93,110,255))
        with self.assertRaisesRegex(OwnershipError,"SOURCE_SILHOUETTE_CLIPPED_AT_SHEET_EDGE"):
            extract_owned_frames(img)

    def test_core_presence_is_required(self):
        img=atlas()
        d=ImageDraw.Draw(img)
        d.rectangle((2*CW,0,3*CW,CH),fill=(0,0,0,0))
        with self.assertRaisesRegex(OwnershipError,"NO_OWNED_CHARACTER|MISSING_OR_MERGED"):
            extract_owned_frames(img)

if __name__=="__main__":
    unittest.main(verbosity=2)
