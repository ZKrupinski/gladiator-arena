"""Verify production HTML, loader, manifest, and every deployed frame byte."""
from pathlib import Path
from urllib.request import urlopen, Request
from concurrent.futures import ThreadPoolExecutor
import hashlib,json,time,sys,subprocess
root=Path(__file__).resolve().parents[1]
site='https://gladiator-arena-git.pages.dev'
paths=['index.html','arena-raster-vfx.js','vfx-gallery.html','assets/new-era/directional-v4/manifest.json']
m=json.loads((root/'public'/paths[-1]).read_text())
paths += ['assets/new-era/directional-v4/'+f['file'] for kind in m['families'].values() for f in kind['frames']]
paths += ['assets/new-era/directional-v4/'+kind+'-sheet.png' for kind in m['families']]
def check(path):
 # Compare committed blobs, avoiding Windows checkout line-ending conversion.
 expected=subprocess.check_output(['git','show','HEAD:public/'+path],cwd=root)
 url=site+'/'+('' if path=='index.html' else path)+'?verify='+hashlib.sha256(expected).hexdigest()[:16]
 with urlopen(Request(url,headers={'Cache-Control':'no-cache'}),timeout=25) as r: actual=r.read()
 assert actual==expected,'Production differs: '+path
 return path
attempts=int(sys.argv[1]) if len(sys.argv)>1 else 1
for attempt in range(attempts):
 try:
  with ThreadPoolExecutor(max_workers=6) as pool: list(pool.map(check,paths))
  print('LIVE_DEPLOY_PASS: exact bytes match for HTML, loader, gallery, manifest and all 80 frames. '+site,flush=True)
  break
 except Exception as e:
  print(f'Attempt {attempt+1}/{attempts}: {e}',flush=True)
  if attempt+1==attempts: raise
  time.sleep(14)
