#!/usr/bin/env python3
"""Offline regression suite for the Spartacus uploader production guards."""
import hashlib
import importlib.util
import json
import os
import pathlib
import tempfile
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("spartacus_uploader", ROOT/"scripts"/"spartacus_uploader.py")
u = importlib.util.module_from_spec(spec)
spec.loader.exec_module(u)
FAKE_PNG = (b"\x89PNG\r\n\x1a\n"+b"\x00\x00\x00\x0dIHDR"+
            b"\x00\x00\x03\x20\x00\x00\x03\x20\x08\x06\x00\x00\x00"+
            b"\x00\x00\x00\x00"+b"\x00\x00\x00\x00IEND\xaeB\x60\x82")

class TestSpartacusUploader(unittest.TestCase):
    def test_hardcoded_version_and_cloudflare_destination(self):
        self.assertEqual(u.REPO,"ZKrupinski/gladiator-arena")
        self.assertEqual(u.MAIN,"main")
        self.assertIn("gladiator-arena-git.pages.dev",u.SITE)
    def test_path_sandbox(self):
        valid=["public/assets/beasts/wolf-v3/idle.webp","public/arena-beasts.js",
               "public/index.html","scripts/test_any.py"]
        for p in valid:self.assertEqual(u.normalized_path(p),p)
        for p in ("../secret",".github/workflows/hijack.yml","AGENTS.md",
                  "public/assets/../secret.env","/public/evil.js",
                  "public//assets/a.png","public/assets/file.exe",
                  "ops/uploader-requests/abc.json","public/index.html/../../../hijack",
                  "public\\assets\\a.png","public/assets/.env"):
            with self.subTest(path=p):
                with self.assertRaises(u.UploadError):u.normalized_path(p)
    def test_binary_hash_and_grid_security(self):
        safe=u.check_asset("public/assets/spartacus-uploads/idle.png",FAKE_PNG,strict_art=True)
        self.assertEqual(safe["width"],800)
        self.assertEqual(safe["height"],800)
        from PIL import Image,ImageDraw
        import io
        small=Image.new("RGBA",(160,80))
        brush=ImageDraw.Draw(small)
        for i in range(8):
            x=(i%4)*40;y=(i//4)*40
            brush.rectangle((x+5,y+5,x+30,y+30),fill=(50+i,40,90,255))
        tmp=io.BytesIO();small.save(tmp,"PNG")
        info=u.check_asset("public/assets/beasts/wolf-v3/sheet-idle.png",
                           tmp.getvalue(),strict_art=True)
        self.assertEqual(info["width"],160)
        self.assertEqual(u.digest(b"hello"),hashlib.sha256(b"hello").hexdigest())
        with self.assertRaisesRegex(u.UploadError,"NOT_PNG"):
            u.check_asset("public/assets/foo.png",b"fake.png")
        with self.assertRaisesRegex(u.UploadError,"INVALID_JSON"):
            u.check_asset("public/assets/foo.json",b"not json")
    def test_native_wolf_webp_4x2_integrity(self):
        import io
        from PIL import Image,ImageDraw
        img=Image.new("RGBA",(3072,1536))
        brush=ImageDraw.Draw(img)
        for i in range(8):
            x=(i%4)*768;y=(i//4)*768
            brush.rectangle((x+65,y+75,x+700,y+680),fill=(85+i,110,140,255))
        file=io.BytesIO()
        img.save(file,"WEBP",lossless=True,method=3)
        atlas=file.getvalue()
        path="public/assets/beasts/wolf-v3/idle.webp"
        info=u.check_asset(path,atlas,strict_art=True)
        self.assertTrue(info["nativeValidated"])
        self.assertEqual(info["frames"],8)
        with self.assertRaisesRegex(u.UploadError,"NOT_WEBP"):
            u.check_asset(path,b"RIFF" + b"x"*60,strict_art=True)
        small=io.BytesIO()
        img.resize((1672,940)).save(small,"WEBP",lossless=True,method=3)
        info_small=u.check_asset(path,small.getvalue(),strict_art=True)
        self.assertTrue(info_small["nativeValidated"])
        self.assertEqual(info_small["width"],1672)
        bad=img.copy()
        ImageDraw.Draw(bad).rectangle((0,90,70,135),fill=(55,66,77,255))
        merged=io.BytesIO()
        bad.save(merged,"WEBP",lossless=True,method=3)
        with self.assertRaisesRegex(u.UploadError,"FRAME_SEAM_OR_CLIPPING"):
            u.check_asset(path,merged.getvalue(),strict_art=True)
        dup=Image.new("RGBA",(3072,1536))
        draw=ImageDraw.Draw(dup)
        for i in range(8):
            x=(i%4)*768;y=(i//4)*768
            draw.rectangle((x+65,y+75,x+700,y+680),fill=(85,110,140,255))
        repeated=io.BytesIO();dup.save(repeated,"WEBP",lossless=True,method=3)
        with self.assertRaisesRegex(u.UploadError,"DUPLICATE_FRAME"):
            u.check_asset(path,repeated.getvalue(),strict_art=True)
    def test_package_discovery_and_symlink_refusal(self):
        with tempfile.TemporaryDirectory() as d:
            base=pathlib.Path(d)
            (base/"a.png").write_bytes(FAKE_PNG)
            (base/"wolf_manifest.json").write_text("{}")
            items=u.stage_from_folder(base)
            self.assertEqual(list(items),["public/assets/spartacus-uploads/a.png"])
            (base/"link.png").symlink_to(base/"a.png")
            with self.assertRaisesRegex(u.UploadError,"SYMLINK_NOT_ALLOWED"):
                u.stage_from_folder(base)
    def test_request_version_source_sha_and_approval(self):
        head="b"*40
        row={"path":"public/arena-beasts.js","utf8":"const ready=true;",
             "sha256":u.digest(b"const ready=true;")}
        spec={"protocol":"spartacus-uploader-v1","expectedMainSha":head,"mode":"publish",
              "approvedForProduction":True,"releaseId":"wolf-a1-20261021","files":[row]}
        with patch.object(u,"verify_local_code"):
            items=u.stage_request(spec,main_sha=head)
        self.assertEqual(items["public/arena-beasts.js"],b"const ready=true;")
        for key,value,needle in (
            ("expectedMainSha","0"*40,"STALE"),
            ("approvedForProduction",False,"APPROVAL"),
            ("mode","preview","MODE"),
        ):
            broken=json.loads(json.dumps(spec));broken[key]=value
            with self.subTest(key=key):
                with self.assertRaisesRegex(u.UploadError,needle):
                    u.stage_request(broken,main_sha=head)
        bad=json.loads(json.dumps(spec));bad["files"][0]["sha256"]="a"*64
        with self.assertRaisesRegex(u.UploadError,"SHA256_MISMATCH"):
            u.stage_request(bad,main_sha=head)
        urlspec=json.loads(json.dumps(spec))
        del urlspec["files"][0]["utf8"]
        urlspec["files"][0]["url"]="http://localhost/evil"
        with self.assertRaisesRegex(u.UploadError,"HTTPS"):
            u.stage_request(urlspec,main_sha=head)
    def test_source_url_allowlist_and_security(self):
        for url in ("http://github.com/foo","https://127.0.0.1/private",
                    "https://evil.example/payload.png","https://user:pass@github.com/file",
                    "https://github.com:8443/bypass"):
            with self.subTest(url=url):
                with self.assertRaises(u.UploadError):u.reject_private_address(url)
        self.assertEqual(u.reject_private_address("https://raw.githubusercontent.com/path"),
                         "raw.githubusercontent.com")
    def test_atomic_release_and_no_false_deploy_claim(self):
        class FakeGit:
            def __init__(self):
                self.head="a"*40
                self.uploaded=None
            def main_sha(self):return self.head
            def commit(self,items,message,expected_main):
                if expected_main!=self.head:raise u.UploadError("MAIN_MOVED")
                self.uploaded=items
                return "b"*40
        gh=FakeGit()
        items={"public/assets/new-test.json":b'{"ok":true}'}
        with self.assertRaisesRegex(u.UploadError,"PRODUCTION_NEEDS_EXPLICIT_CONFIRM"):
            u.publish_files(items,confirm=False,git=gh,verify=False)
        with self.assertRaisesRegex(u.UploadError,"MAIN_MOVED"):
            u.publish_files(items,confirm=True,git=gh,expected_sha="0"*40,verify=False)
        with patch.object(u,"verify_live",return_value={"state":"DEPLOYED_VERIFIED"}) as verify:
            result=u.publish_files(items,confirm=True,git=gh,release_id="wolf-release-v1")
        self.assertEqual(result["deployment"]["state"],"DEPLOYED_VERIFIED")
        assert gh.uploaded
        self.assertEqual(json.loads(gh.uploaded["public/uploader-release.json"])["releaseId"],
                         "wolf-release-v1")
        self.assertEqual(result["checks"]["public/assets/new-test.json"]["sha256"],u.digest(items["public/assets/new-test.json"]))
        verify.assert_called_once()
        with patch.object(u,"verify_live",side_effect=u.UploadError("CLOUDFLARE_OLD_DEPLOYMENT")):
            pending=u.publish_files(items,confirm=True,git=gh,release_id="wolf-release-v2")
        self.assertEqual(pending["deployment"]["state"],"UNVERIFIED")
        self.assertEqual(pending["state"],"COMMITTED_DEPLOY_NOT_YET_VERIFIED")
        self.assertNotEqual(pending["deployment"]["state"],"DEPLOYED_VERIFIED")
    def test_request_can_not_replace_deployment_probe(self):
        head="c"*40
        row={"path":"public/uploader-release.json","utf8":"{}","sha256":u.digest(b"{}")}
        request={"protocol":"spartacus-uploader-v1","expectedMainSha":head,"mode":"publish",
                 "approvedForProduction":True,"releaseId":"wolf-release-v3","files":[row]}
        with self.assertRaisesRegex(u.UploadError,"RESERVED"):
            u.stage_request(request,main_sha=head)
    def test_trial_remote_source_sha_then_lossless_transcode(self):
        import io
        from PIL import Image,ImageDraw
        art=Image.new("RGBA",(1672,941))
        brush=ImageDraw.Draw(art)
        for i in range(8):
            x=(i%4)*418; y=(i//4)*470
            brush.rectangle((x+20,y+20,x+395,y+420),
                             fill=(70+i,80,100,255))
        brush.rectangle((14,939,24,940),fill=(255,0,25,255))
        original=io.BytesIO()
        art.save(original,format="PNG")
        raw=original.getvalue()
        target="public/assets/beasts/wolf-trial/walk.webp"
        row={"path":target,"url":"https://d2ol7oe51mr4n9.cloudfront.net/path.png",
             "sha256":u.digest(raw),"transform":"wolf-trial-source-png"}
        req={"protocol":"spartacus-uploader-v1","expectedMainSha":"a"*40,
             "mode":"publish","approvedForProduction":True,
             "releaseId":"wolf-remote-smoke","files":[row]}
        with patch.object(u,"download_asset",return_value=raw):
            staged=u.stage_request(req,main_sha="a"*40)
        self.assertEqual(list(staged),[target])
        with Image.open(io.BytesIO(staged[target])) as transformed:
            self.assertEqual(transformed.size,(1672,942))
            self.assertEqual(transformed.getpixel((18,940)),(255,0,25,255))
        with patch.object(u,"download_asset",return_value=raw):
            req["files"][0]["sha256"]="0"*64
            with self.assertRaisesRegex(u.UploadError,"SHA256_MISMATCH"):
                u.stage_request(req,main_sha="a"*40)
        with self.assertRaisesRegex(u.UploadError,"TRIAL_TRANSCODE_DESTINATION"):
            u.transcode_trial_source(raw,"public/assets/beasts/wolf-v3/walk.webp")

    def test_wolf_trial_is_isolated_and_reports_edge_risks(self):
        import io
        from PIL import Image, ImageDraw
        art=Image.new("RGBA",(1672,940))
        brush=ImageDraw.Draw(art)
        for i in range(8):
            x=i%4*418;y=i//4*470
            brush.rectangle((x,y+20,x+417,y+430),fill=(30+i,60,110,255))
        data=io.BytesIO()
        art.save(data,"WEBP",lossless=True,method=3)
        trial="public/assets/beasts/wolf-trial/idle.webp"
        review=u.check_asset(trial,data.getvalue(),strict_art=True)
        self.assertFalse(review["nativeValidated"])
        self.assertTrue(review["previewOnly"])
        self.assertEqual(review["edgeRiskFrames"],list(range(1,9)))
        with self.assertRaisesRegex(u.UploadError,"FRAME_SEAM_OR_CLIPPING"):
            u.check_asset("public/assets/beasts/wolf-v3/idle.webp",data.getvalue(),strict_art=True)
        with self.assertRaisesRegex(u.UploadError,"NO_PARTIAL_SPRITE_UPLOADS"):
            u.publish_files({trial:data.getvalue()},confirm=True,verify=False)
        actions=("idle","walk","attack1","attack2","attack3",
                 "attack4","hit","death","roar")
        folder="public/assets/beasts/wolf-trial/"
        base={folder+a+".webp":data.getvalue() for a in actions}
        bad=dict(base)
        bad[folder+"manifest.json"]=json.dumps({"version":3,"previewOnly":False,
          "actions":{a:a+".webp" for a in actions}}).encode()
        with self.assertRaisesRegex(u.UploadError,"EXPLICIT_PREVIEW_ONLY"):
            u.publish_files(bad,confirm=True,verify=False)

    def test_inbox_survives_unrelated_main_commit_but_not_asset_overwrite(self):
        from unittest.mock import Mock
        head="b"*40
        event="c"*40
        base="a"*40
        class GH:
            def main_sha(self):return head
            def request(self,method,path):
                if "/git/commits/" in path:return {"parents":[{"sha":base}]}
                if "/compare/" in path:return {"status":"ahead",
                    "files":[{"filename":"docs/unrelated-qa.md"}]}
                raise AssertionError(path)
        spec={"releaseId":"wolf-test-run"}
        with tempfile.TemporaryDirectory() as temp:
            filename=pathlib.Path(temp)/"release.json"
            filename.write_text(json.dumps(spec))
            with patch.dict(os.environ,{"GITHUB_SHA":event}), \
                 patch.object(u,"GitHub",return_value=GH()), \
                 patch.object(u,"stage_request",return_value={"public/assets/beasts/wolf-trial/idle.webp":b"data"}) as stage, \
                 patch.object(u,"publish_files",return_value={"state":"COMMITTED_DEPLOY_NOT_YET_VERIFIED","deployment":{"state":"DEPLOYED_VERIFIED"}}) as pub:
                self.assertEqual(u.main(["process-request",str(filename)]),0)
                stage.assert_called_once_with(spec,main_sha=base)
                self.assertEqual(pub.call_args.kwargs["expected_sha"],head)
            class Changed(GH):
                def request(self,method,path):
                    if "/compare/" in path:return {"status":"ahead",
                        "files":[{"filename":"public/assets/beasts/wolf-trial/idle.webp"}]}
                    return super().request(method,path)
            with patch.dict(os.environ,{"GITHUB_SHA":event}), \
                 patch.object(u,"GitHub",return_value=Changed()), \
                 patch.object(u,"stage_request",return_value={"public/assets/beasts/wolf-trial/idle.webp":b"data"}), \
                 patch.object(u,"publish_files") as pub:
                self.assertEqual(u.main(["process-request",str(filename)]),2)
                pub.assert_not_called()

    def test_marker_never_claims_live_deployment(self):
        obj=json.loads(u.marker("wolf-release-v5",{"public/index.html":"a"*64},"b"*40))
        self.assertEqual(obj["branch"],"main")
        self.assertEqual(obj["releaseProtocol"],"spartacus-uploader-v1")
        self.assertNotIn("deployed",obj)

if __name__=="__main__":
    unittest.main()
