"""Check the actual Cloudflare Pages site byte-for-byte against GitHub main."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import hashlib,subprocess,sys,time
ROOT=Path(__file__).resolve().parents[1]
SITE="https://gladiator-arena-git.pages.dev"
ACTIONS=('idle','walk','slash','sweep','thrust','heavy','guard','hit','death')
FILES=['index.html','market-scene.js','market-scene.css','market-pricing.js',
 'gladiator-registry.js','gladiator-custom-art.js','sprite-motion-registry.js',
 'practice-scale-profiles.js','ludus-roster.js','ludus-practice.js',
 'arena-body-collision.js','arena-coop.js','arena-coop-core.js','arena-coop-match.js',
 'practice-scale-published.js','tools/practice-scale-publish.js','alt-murmillo.js',
 'tools/practice-scale-calibrator.html',
 'assets/combat/murmillo-redcrest-alt-v1/manifest.json',
 'assets/combat/murmillo-redcrest-alt-v1/qa-redcrest-alt.json']+[
 'assets/combat/murmillo-redcrest-alt-v1/'+action+'.png' for action in ACTIONS]
def verify(path):
 expected=subprocess.check_output(['git','show','HEAD:public/'+path],cwd=ROOT)
 digest=hashlib.sha256(expected).hexdigest()[:16]
 address=SITE+'/'+('' if path=='index.html' else path)+'?verify='+digest
 result=subprocess.run(['curl','--fail','--location','--silent','--show-error',
   '--max-time','35','--header','Cache-Control: no-cache',address],capture_output=True)
 if result.returncode:raise RuntimeError(path+': '+result.stderr.decode(errors='replace'))
 if result.stdout!=expected:
  raise RuntimeError(path+': version or image bytes DIFFER from GitHub main')
 return (path,len(expected))
tries=int(sys.argv[1]) if len(sys.argv)>1 else 1
for n in range(tries):
 try:
  with ThreadPoolExecutor(max_workers=5) as pool:
   items=list(pool.map(verify,FILES))
  print('PASS Cloudflare production: exact current GitHub main bytes',SITE,flush=True)
  for path,size in items:print('  ',path,size,'bytes',flush=True)
  break
 except Exception as exc:
  print(f'Cloudflare mismatch attempt {n+1}/{tries}: {exc}',flush=True)
  if n+1==tries:raise
  time.sleep(12)
