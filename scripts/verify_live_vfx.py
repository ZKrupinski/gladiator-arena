"""Verify production HTML, loader, manifest, and every deployed frame byte."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib,json,time,sys,subprocess
root=Path(__file__).resolve().parents[1]
site='https://gladiator-arena-git.pages.dev'
paths=['index.html','arena-raster-vfx.js','vfx-gallery.html','assets/new-era/directional-v4/manifest.json']
m=json.loads((root/'public'/paths[-1]).read_text())
paths += ['assets/new-era/directional-v4/'+f['file'] for kind in m['families'].values() for f in kind['frames']]
paths += ['assets/new-era/directional-v4/'+kind+'-sheet.png' for kind in m['families']]
# The crowd must be the actual wide-stadium recording, not a stale close-voice mix.
# Compare the production crowd loop and both recorded reaction layers byte-for-byte.
audio_manifest_path='assets/audio/rome-v1/manifest.json'
audio=json.loads((root/'public'/audio_manifest_path).read_text())
assert audio['version']>=5 and audio['crowd']=='rome_crowd.mp3'
reactions=audio['sfx']['crowd_roar']
assert len(reactions)>=2
paths += ['arena-audio.js',audio_manifest_path]
paths += ['assets/audio/rome-v1/'+name for name in [audio['crowd'],*reactions]]
def check(path):
 # Compare committed blobs, avoiding Windows checkout line-ending conversion.
 expected=subprocess.check_output(['git','show','HEAD:public/'+path],cwd=root)
 url=site+'/'+('' if path=='index.html' else path)+'?verify='+hashlib.sha256(expected).hexdigest()[:16]
 # Use the same standard curl client as the repository's previous deploy probe.
 # Cloudflare rejects urllib's default client signature with error 1010.
 result=subprocess.run(['curl','--fail','--location','--silent','--show-error',
  '--max-time','25','--header','Cache-Control: no-cache',url],capture_output=True)
 assert result.returncode==0,path+': '+result.stderr.decode(errors='replace')
 actual=result.stdout
 assert actual==expected,'Production differs: '+path
 return path
attempts=int(sys.argv[1]) if len(sys.argv)>1 else 1
for attempt in range(attempts):
 try:
  with ThreadPoolExecutor(max_workers=6) as pool: list(pool.map(check,paths))
  print('LIVE_DEPLOY_PASS: exact bytes match for game HTML, directional VFX loader, 80 PNG frames, 10 preview sheets, and v5 stadium crowd loop + reaction WAVs + audio loader. '+site,flush=True)
  break
 except Exception as e:
  print(f'Attempt {attempt+1}/{attempts}: {e}',flush=True)
  if attempt+1==attempts: raise
  time.sleep(14)
