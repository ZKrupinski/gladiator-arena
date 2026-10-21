#!/usr/bin/env python3
"""Spartacus-only versioned asset/code uploader and Cloudflare release verifier.

Usage:
  python scripts/spartacus_uploader.py status
  python scripts/spartacus_uploader.py package --source /mnt/data/wolf_apply_package --out /tmp/review.json
  python scripts/spartacus_uploader.py publish --input ./staged --confirm
  python scripts/spartacus_uploader.py process-request ops/uploader-requests/example.json
  python scripts/spartacus_uploader.py verify --release-id <id> --attempts 20

The authenticated local publish path uses GITHUB_TOKEN/GH_TOKEN. The
GitHub Actions request path uses its own scoped GITHUB_TOKEN. Neither needs
a manually copied repository path. Cloudflare's Git integration is external;
upload success NEVER means production success until the live marker matches.
"""
from __future__ import annotations
import argparse, base64, hashlib, ipaddress, json, os, re, socket, subprocess
import sys, time, uuid
from pathlib import Path, PurePosixPath
from urllib.parse import urlsplit, quote
from urllib.request import Request, urlopen
from urllib.error import HTTPError

ROOT = Path(__file__).resolve().parents[1]
REPO = "ZKrupinski/gladiator-arena"
MAIN = "main"
SITE = "https://gladiator-arena-git.pages.dev"
RELEASE_PROBE = "public/uploader-release.json"
API_ROOT = "https://api.github.com/repos/" + REPO
ALLOWED_PREFIXES = (
    "public/assets/", "public/arena-", "public/index.html",
    "public/growth-frames.js", "public/sprite-", "public/wolf-",
    "public/uploader-release.json", "scripts/", "config/",
    "docs/", "tests/"
)
IGNORE_NAMES = {".DS_Store", "Thumbs.db", ".gitkeep"}
MAX_BINARY = 18 * 1024 * 1024
MAX_FILES = 240
PROTECTED = (".github/", ".git/", "ops/uploader-requests/", "AGENTS.md")
IGNORED_COPIED = {"wolf_manifest.json", "recommended_mapping.json"}
ALLOWED_HOSTS = ("github.com", "raw.githubusercontent.com", "objects.githubusercontent.com",
                 "d2ol7oe51mr4n9.cloudfront.net", "drive.google.com",
                 "storage.googleapis.com", "cdn.discordapp.com")

class UploadError(RuntimeError):
    pass

def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def normalized_path(path: str) -> str:
    """Reject path traversal, hidden credentials and arbitrary repo writes."""
    if not isinstance(path, str) or not path or "\\" in path or "\x00" in path:
        raise UploadError("INVALID_DESTINATION")
    p = PurePosixPath(path)
    if (path.startswith("/") or p.as_posix() != path or
        any(part in (".", "..", "") for part in path.split("/")) or
        any(path.startswith(x) for x in PROTECTED) or
        not any(path.startswith(x) for x in ALLOWED_PREFIXES)):
        raise UploadError("DESTINATION_OUTSIDE_GAME_UPLOAD_ALLOWLIST: " + path)
    if p.suffix.lower() not in {".png", ".webp", ".jpg", ".jpeg", ".gif", ".json",
                               ".js", ".mjs", ".css", ".html", ".svg", ".wav",
                               ".mp3", ".ogg", ".txt", ".md", ".py"}:
        raise UploadError("UNSUPPORTED_ASSET_TYPE: " + path)
    return path

def check_asset(path: str, data: bytes, *, strict_art: bool = False) -> dict:
    path = normalized_path(path)
    if len(data) == 0 or len(data) > MAX_BINARY:
        raise UploadError("ASSET_SIZE_INVALID: " + path)
    suffix = PurePosixPath(path).suffix.lower()
    info = {"path": path, "size": len(data), "sha256": digest(data)}
    if suffix == ".png":
        if len(data) < 29 or data[:8] != b"\x89PNG\r\n\x1a\n":
            raise UploadError("NOT_PNG: " + path)
        import struct
        w, h = struct.unpack(">II", data[16:24])
        if not (0 < w <= 16000 and 0 < h <= 16000):
            raise UploadError("INVALID_PNG_DIMENSIONS: " + path)
        info["width"], info["height"] = w, h
        if strict_art and "wolf-v3/" in path and path.endswith(".png"):
            if "sheet" in path and (w < 3072 or h < 1536):
                raise UploadError("SPRITEFORGE_V3_NATIVE_SHEET_TOO_SMALL: " + path)
    elif suffix == ".webp" and not data.startswith(b"RIFF"):
        raise UploadError("NOT_WEBP: " + path)
    elif suffix == ".json":
        try: json.loads(data.decode("utf-8"))
        except Exception as e: raise UploadError("INVALID_JSON: " + path) from e
    elif suffix in (".js", ".mjs", ".html", ".css", ".py", ".md", ".txt", ".svg"):
        try: data.decode("utf-8")
        except Exception as e: raise UploadError("INVALID_UTF8: " + path) from e
    return info

def verify_local_code(paths: dict[str, bytes]) -> None:
    """Syntax-check JavaScript without running arbitrary contributed code."""
    for name, data in paths.items():
        if PurePosixPath(name).suffix not in (".js", ".mjs"):
            continue
        if not shutil_which("node"):
            raise UploadError("NODE_REQUIRED_FOR_JS_VALIDATION")
        # Use same tempfile for each source and pass only its path to node.
        import tempfile
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / ("source.mjs" if name.endswith(".mjs") else "source.js")
            p.write_bytes(data)
            r = subprocess.run(["node", "--check", str(p)], capture_output=True, text=True)
            if r.returncode:
                raise UploadError("JS_PARSE_ERROR " + name + ": " + r.stderr[-400:])

def shutil_which(binary: str):
    from shutil import which
    return which(binary)

class GitHub:
    def __init__(self, token: str | None = None):
        self.token = token or os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
        if not self.token:
            raise UploadError("GITHUB_TOKEN_MISSING_FOR_GITHUB_WRITE")
    def request(self, method: str, path: str, body=None):
        data = None if body is None else json.dumps(body).encode()
        req = Request("https://api.github.com" + path, data=data, method=method,
                      headers={"Accept":"application/vnd.github+json",
                               "X-GitHub-Api-Version":"2022-11-28",
                               "Authorization":"Bearer " + self.token,
                               "User-Agent":"Spartacus-uploader-v1",
                               **({"Content-Type":"application/json"} if data is not None else {})})
        try:
            with urlopen(req, timeout=65) as res:
                raw = res.read()
                return json.loads(raw) if raw else {}
        except HTTPError as e:
            details = e.read(500).decode("utf8","replace")
            raise UploadError("GITHUB_HTTP_" + str(e.code) + ": " + details) from e
    def main_sha(self):
        return self.request("GET", f"/repos/{REPO}/git/ref/heads/{MAIN}")["object"]["sha"]
    def commit(self, items: dict[str,bytes], message: str, expected_main: str):
        """One atomic Git tree/commit/ref fast-forward, never overwrite races."""
        if self.main_sha() != expected_main:
            raise UploadError("MAIN_MOVED_REFRESH_VERSION_BEFORE_WRITE")
        base = self.request("GET", f"/repos/{REPO}/git/commits/{expected_main}")
        entries = []
        for path, content in sorted(items.items()):
            blob = self.request("POST", f"/repos/{REPO}/git/blobs",
                                {"content":base64.b64encode(content).decode(),
                                 "encoding":"base64"})
            entries.append({"path":path, "mode":"100644", "type":"blob", "sha":blob["sha"]})
        tree = self.request("POST", f"/repos/{REPO}/git/trees",
                            {"base_tree":base["tree"]["sha"],"tree":entries})
        commit = self.request("POST", f"/repos/{REPO}/git/commits",
                              {"message":message,"tree":tree["sha"],"parents":[expected_main]})
        self.request("PATCH", f"/repos/{REPO}/git/refs/heads/{MAIN}",
                     {"sha":commit["sha"],"force":False})
        return commit["sha"]

def marker(release_id: str, asset_hashes: dict, base: str) -> bytes:
    value = {
        "project":"GLADIATOR ARENA / SPARTACUS",
        "branch":"main", "releaseId":release_id,
        "baseCommit":base,"assetSha256":asset_hashes,
        "releaseProtocol":"spartacus-uploader-v1"
    }
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2)+"\n").encode()

def safe_release_id(value: str) -> str:
    if not re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9_-]{5,70}", value):
        raise UploadError("INVALID_RELEASE_ID")
    return value

def stage_from_folder(folder: Path, mapping: dict[str,str] | None = None):
    folder = Path(folder).resolve()
    if not folder.is_dir():raise UploadError("SOURCE_FOLDER_NOT_FOUND")
    items = {}
    mapping = mapping or {}
    for file in sorted(folder.rglob("*")):
        if not file.is_file() or file.name in IGNORE_NAMES or file.name in IGNORED_COPIED:
            continue
        rel = file.relative_to(folder).as_posix()
        dest = mapping.get(rel, "public/assets/spartacus-uploads/" + rel)
        normalized_path(dest)
        if file.is_symlink():
            raise UploadError("SYMLINK_NOT_ALLOWED: " + rel)
        if dest in items:raise UploadError("DUPLICATE_DESTINATION: " + dest)
        items[dest] = file.read_bytes()
    if not items:raise UploadError("NO_SOURCE_FILES")
    if len(items) > MAX_FILES:raise UploadError("TOO_MANY_ASSETS")
    return items

def reject_private_address(url: str):
    split=urlsplit(url)
    if split.scheme!="https" or split.username or split.password or split.port:
        raise UploadError("HTTPS_SOURCE_REQUIRED")
    host=(split.hostname or "").lower()
    if not host or not any(host==d for d in ALLOWED_HOSTS):
        raise UploadError("SOURCE_HOST_NOT_ALLOWLISTED: " + host)
    return host

def download_asset(url: str) -> bytes:
    reject_private_address(url)
    from urllib.request import build_opener, HTTPRedirectHandler
    class GuardRedirect(HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            reject_private_address(newurl)
            return super().redirect_request(req,fp,code,msg,headers,newurl)
    opener = build_opener(GuardRedirect())
    req = Request(url,headers={"User-Agent":"Spartacus-uploader-v1"})
    with opener.open(req,timeout=55) as response:
        content = response.read(MAX_BINARY+1)
    if len(content)>MAX_BINARY:
        raise UploadError("SOURCE_TOO_LARGE")
    return content

def stage_request(spec: dict, *, main_sha: str):
    if spec.get("protocol")!="spartacus-uploader-v1":
        raise UploadError("UNKNOWN_UPLOADER_REQUEST")
    if spec.get("expectedMainSha")!=main_sha:
        raise UploadError("STALE_REQUEST_EXPECTED_MAIN_SHA")
    if spec.get("mode")!="publish":
        raise UploadError("REQUEST_MODE_MUST_BE_PUBLISH")
    if spec.get("approvedForProduction") is not True:
        raise UploadError("EXPLICIT_PRODUCTION_APPROVAL_REQUIRED")
    files=spec.get("files")
    if not isinstance(files,list) or not (1<=len(files)<=MAX_FILES):
        raise UploadError("INVALID_REQUEST_FILE_COUNT")
    items={}
    for row in files:
        path=normalized_path(row["path"])
        if path==RELEASE_PROBE or path in items:
            raise UploadError("RESERVED_OR_DUPLICATE_UPLOAD_TARGET")
        if ("url" in row)==("utf8" in row):
            raise UploadError("EXACTLY_ONE_URL_OR_UTF8_REQUIRED")
        if "url" in row:
            data=download_asset(row["url"])
        else:
            data=row["utf8"].encode("utf8")
        if not re.fullmatch("[a-f0-9]{64}",row.get("sha256","")) or digest(data)!=row["sha256"]:
            raise UploadError("SHA256_MISMATCH: "+path)
        check_asset(path,data,strict_art=True)
        items[path]=data
    verify_local_code(items)
    return items

def fetch_public(url: str) -> bytes:
    with urlopen(Request(url,headers={"User-Agent":"Mozilla/5.0 SpartacusVerifier",
                                       "Cache-Control":"no-cache"}),timeout=30) as r:
        return r.read(MAX_BINARY+1)

def verify_live(release_id: str, asset_hashes: dict | None = None, attempts: int = 18, pause: float = 15.0):
    release_id=safe_release_id(release_id)
    if not (1<=attempts<=100 and 0<=pause<=60):
        raise UploadError("INVALID_VERIFY_RETRY")
    failure = ""
    for index in range(attempts):
        try:
            response=fetch_public(SITE+"/uploader-release.json?rid="+quote(release_id)+"&n="+str(index))
            found=json.loads(response)
            if found.get("releaseId")!=release_id:
                raise UploadError("CLOUDFLARE_OLD_DEPLOYMENT")
            if found.get("releaseProtocol")!="spartacus-uploader-v1":
                raise UploadError("CLOUDFLARE_UNEXPECTED_MARKER")
            want=asset_hashes if asset_hashes is not None else found["assetSha256"]
            if want!=found.get("assetSha256"):
                raise UploadError("RELEASE_MANIFEST_MISMATCH")
            for path,expected in want.items():
                if not path.startswith("public/"): continue
                actual=fetch_public(SITE+"/"+quote(path[len("public/"):],safe="/")+"?rid="+quote(release_id))
                if digest(actual)!=expected:
                    raise UploadError("CLOUDFLARE_CONTENT_MISMATCH: "+path)
            html=fetch_public(SITE+"/?release="+quote(release_id))
            if b"<html" not in html[:5000].lower():
                raise UploadError("CLOUDFLARE_GAME_HTML_NOT_AVAILABLE")
            return {"state":"DEPLOYED_VERIFIED","releaseId":release_id,"site":SITE+"/",
                    "checkedAssets":len(want),"attempt":index+1}
        except Exception as exc:
            failure=str(exc)[:600]
            if index+1<attempts:time.sleep(pause)
    raise UploadError("DEPLOYMENT_UNVERIFIED: "+failure)

def publish_files(items: dict[str,bytes], *, confirm: bool, release_id: str | None = None,
                  verify: bool = True, git: GitHub | None = None, expected_sha: str | None = None,
                  message: str | None = None):
    if not confirm:raise UploadError("PRODUCTION_NEEDS_EXPLICIT_CONFIRM")
    if not items or len(items)>MAX_FILES:raise UploadError("INVALID_FILE_COUNT")
    if RELEASE_PROBE in items:raise UploadError("RELEASE_PROBE_RESERVED")
    audit={}
    for name,data in items.items():
        audit[name]=check_asset(name,data,strict_art=True)
    verify_local_code(items)
    git=git or GitHub()
    head=git.main_sha()
    if expected_sha and head!=expected_sha:
        raise UploadError("MAIN_MOVED_REFRESH_VERSION_BEFORE_WRITE")
    rid=safe_release_id(release_id or "sp"+uuid.uuid4().hex[:18])
    fingerprints={name:digest(data) for name,data in sorted(items.items())}
    items=dict(items)
    items[RELEASE_PROBE]=marker(rid,fingerprints,head)
    sha=git.commit(items,message or ("deploy(spartacus): "+rid),head)
    result={"state":"COMMITTED_DEPLOY_NOT_YET_VERIFIED","releaseId":rid,"commit":sha,
            "commitUrl":"https://github.com/"+REPO+"/commit/"+sha,
            "site":SITE+"/","checks":audit}
    if verify:
        try:result["deployment"]=verify_live(rid,fingerprints)
        except UploadError as e:
            result["deployment"]={"state":"UNVERIFIED","reason":str(e)}
    return result

def main(argv=None):
    p=argparse.ArgumentParser(description="Spartacus uploader: version → QA → commit → Cloudflare verify")
    s=p.add_subparsers(dest="command",required=True)
    s.add_parser("status")
    make=s.add_parser("package")
    make.add_argument("--source",required=True)
    make.add_argument("--out",required=True)
    pub=s.add_parser("publish")
    pub.add_argument("--input",required=True)
    pub.add_argument("--confirm",action="store_true")
    pub.add_argument("--expected-sha")
    pub.add_argument("--release-id")
    pub.add_argument("--no-verify",action="store_true")
    request=s.add_parser("process-request")
    request.add_argument("manifest")
    request.add_argument("--no-verify",action="store_true")
    check=s.add_parser("verify")
    check.add_argument("--release-id",required=True)
    check.add_argument("--attempts",type=int,default=18)
    args=p.parse_args(argv)
    try:
        if args.command=="status":
            gh=GitHub(); head=gh.main_sha()
            result={"repo":REPO,"branch":MAIN,"commit":head,"site":SITE+"/",
                    "version":"https://github.com/"+REPO+"/commit/"+head,
                    "deploymentVerified":False}
        elif args.command=="package":
            items=stage_from_folder(Path(args.source))
            checks=[check_asset(n,b) for n,b in items.items()]
            result={"state":"LOCAL_PACKAGE_REVIEW_ONLY","files":checks,
                    "gameRepo":REPO,"next":"publish --input DIR --confirm"}
            dest=Path(args.out);dest.parent.mkdir(parents=True,exist_ok=True)
            dest.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
        elif args.command=="publish":
            result=publish_files(stage_from_folder(Path(args.input)),
                                 confirm=args.confirm,expected_sha=args.expected_sha,
                                 release_id=args.release_id,verify=not args.no_verify)
        elif args.command=="process-request":
            spec=json.loads(Path(args.manifest).read_text(encoding="utf8"))
            gh=GitHub(); head=gh.main_sha()
            items=stage_request(spec,main_sha=head)
            result=publish_files(items,confirm=True,git=gh,expected_sha=head,
                                 release_id=spec["releaseId"],
                                 verify=not args.no_verify,
                                 message="deploy(spartacus): "+spec["releaseId"])
        else:
            result=verify_live(args.release_id,attempts=args.attempts)
        print(json.dumps(result,ensure_ascii=False,indent=2))
        # A GitHub commit does not imply completed deployment.
        if result.get("deployment",{}).get("state")=="UNVERIFIED":
            return 3
        return 0
    except Exception as exc:
        print(json.dumps({"state":"FAILED","reason":str(exc)},ensure_ascii=False),file=sys.stderr)
        return 2

if __name__=="__main__":
    sys.exit(main())
