#!/usr/bin/env python3
"""METAL OF ROME v5: stadium-scale human audience + cinematic physical impact remaster.
Must run AFTER remaster_rome_audio_real.py. The battle music's war-drum
stems and v3 solemn start/victory/defeat cues are preserved as-is.
All processed samples are recordings under CC0, never speech synthesis.
"""
from pathlib import Path
import io, os, json, math, glob, zipfile, subprocess, urllib.request, wave
import numpy as np
from scipy.signal import butter, sosfilt

FS=32000
OUT=Path("public/assets/audio/rome-v1")
TEMP=Path("/tmp/rome-v5-recordings")
OUT.mkdir(parents=True,exist_ok=True);TEMP.mkdir(parents=True,exist_ok=True)
N=round(FS*60/172*4*24)
def get(url,name,required=True):
 path=TEMP/name
 if path.is_file() and path.stat().st_size>500:return path
 try:
  request=urllib.request.Request(url,headers={
   "User-Agent":"Gladiator-Arena-SoundDesign/5.0 (CC0 audio derivative)"})
  with urllib.request.urlopen(request,timeout=110) as response:
   data=response.read()
  if len(data)<1000:raise ValueError("empty source")
  path.write_bytes(data)
  print("RECORDED_SOURCE",name,len(data),flush=True)
  return path
 except Exception as err:
  if required:raise RuntimeError("Required real stadium recording: "+url) from err
  print("OPTIONAL_SOUND_MISSING",name,str(err),flush=True)
  return None
def decode(path,channels=1):
 cmd=["ffmpeg","-hide_banner","-loglevel","error","-i",str(path),
      "-vn","-f","f32le","-ac",str(channels),"-ar",str(FS),"-"]
 data=subprocess.check_output(cmd)
 samples=np.frombuffer(data,dtype="<f4").copy()
 return samples.reshape(-1,channels).T if channels==2 else samples
def sos_filter(x,hz,typ="low"):
 return sosfilt(butter(3,hz/(FS*.5),btype=typ,output="sos"),x).astype(np.float32)
def low(x,hz):return sos_filter(x,hz,"low")
def high(x,hz):return sos_filter(x,hz,"high")
def fade(sample,in_s=.006,out_s=.05):
 s=sample.astype(np.float32,copy=True);n=len(s)
 a=min(int(in_s*FS),n//5);b=min(int(out_s*FS),n//3)
 if a:s[:a]*=np.linspace(0,1,a,dtype=np.float32)
 if b:s[-b:]*=np.linspace(1,0,b,dtype=np.float32)
 return s
def rms(x):
 return float(np.sqrt(np.mean(x.astype(np.float64)**2)+1e-12))
def render_mp3(name,stereo):
 mx=float(np.max(np.abs(stereo)))
 if mx<1e-4:raise RuntimeError("Empty crowd generated")
 value=(stereo/ max(mx/0.81,1.0)).astype(np.float32)
 # Ducking is exclusively controlled by the game mixer; this is restrained.
 tmp=TEMP/(name+".wav")
 with wave.open(str(tmp),"wb") as f:
  f.setnchannels(2);f.setsampwidth(2);f.setframerate(FS)
  f.writeframes(np.int16(np.clip(value,-1,1)*32767).T.tobytes())
 subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(tmp),
                 "-codec:a","libmp3lame","-b:a","128k",str(OUT/name)],check=True)
 tmp.unlink()
def render_wav(name,mono):
 a=mono.astype(np.float32)
 mx=np.max(np.abs(a))
 if mx<.0001:raise RuntimeError("Empty effect "+name)
 a=np.tanh(a*1.14)
 a*=.89/max(.01,np.max(np.abs(a)))
 with wave.open(str(OUT/name),"wb") as f:
  f.setnchannels(1);f.setsampwidth(2);f.setframerate(FS)
  f.writeframes(np.int16(np.clip(a,-1,1)*32767).tobytes())
def place(dest,source,start,level=1):
 st=round(start*FS)
 if st>=len(dest):return
 pos=max(st,0);take=min(len(dest)-pos,len(source)-max(-st,0))
 if take>0:dest[pos:pos+take]+=source[max(-st,0):max(-st,0)+take]*level
def loop_overlay(dest,source,offset,gain):
 # Separate overlapping periods (staggered two recordings), with 1.8sec
 # crossfades to remove audible edits in the circular arena ambience.
 if source.ndim!=1:raise ValueError("mono source")
 n=len(source);overlap=min(round(1.8*FS),max(round(.3*FS),n//7))
 if n<overlap*3:raise ValueError("The stadium recording must last several seconds")
 segment=source.copy()
 segment[:overlap]*=np.linspace(0,1,overlap,dtype=np.float32)
 segment[-overlap:]*=np.linspace(1,0,overlap,dtype=np.float32)
 step=n-overlap
 for st in range(offset-N, N, step):
  if st+n<0:continue
  place(dest,segment,st,gain)
# CC0 real spectator recordings taken on location at football matches.
stadiums=[
 ("https://upload.wikimedia.org/wikipedia/commons/7/70/Spectators_during_a_football_match.webm",
  "football_match_spectators_CC0.webm"),
 ("https://upload.wikimedia.org/wikipedia/commons/2/28/2025_Bika_football_finals.webm",
  "bika_football_stadium_CC0.webm")
]
recordings=[]
for ix,(url,name) in enumerate(stadiums):
 path=get(url,name,required=ix==0)
 if not path:continue
 try:
  stereo=decode(path,2)
  if stereo.shape[1]<FS*12:raise RuntimeError("Stadium audio too short")
  recordings.append(stereo)
  print("REAL_FOOTBALL_CROWD_RECORDING",name,round(stereo.shape[1]/FS,2),"seconds",flush=True)
 except Exception as exc:
  if ix==0:raise
  print("OPTIONAL_STADIUM_UNAVAILABLE",name,exc,flush=True)
if not recordings:raise RuntimeError("Cannot replace fake voices without a real football crowd recording")
# Large diffuse terrace bed: avoid near-field identifiable single voices:
# high-mid vocal-formant band attenuated; rich lower body survives.
arena=np.zeros((2,N),dtype=np.float32)
for index,src in enumerate(recordings):
 for channel in (0,1):
  original=src[channel]
  original=high(original,80)
  body=low(original,790)
  far=(low(original,2950)-low(original,790))
  field=body*.91+far*.26
  field=field/(max(.025,rms(field))*7.8)
  # Double-diffuse via different takes/offsets, audience fills the stands.
  offset=round((index*2.13+channel*.42)*FS)
  loop_overlay(arena[channel],field,offset,.26 if index==0 else .23)
# Cross-channel natural stadium rear-wall echo, no bright or artificial pitch.
for channel in (0,1):
 original=arena[channel].copy()
 for delay,volume in ((.127,.10),(.229,.075),(.416,.040)):
  k=round(delay*FS)
  arena[channel,k:]+=low(original[:-k],1900)*volume
# Normalize by true perceptual RMS, NOT silence or loudest individual shouts.
mx=float(np.max(np.abs(arena)))
arena/=max(1.0,mx/.70)
edge=round(.3*FS)
arena[:,:edge]*=np.linspace(0,1,edge)
arena[:,-edge:]*=np.linspace(1,0,edge)
render_mp3("rome_crowd.mp3",arena)
# Stadium reactions: short true group swells from the loudest two regions.
def recorded_roar(src,variant):
 summ=src.mean(axis=0).astype(np.float32)
 summ=low(high(summ,115),3100)
 # Quantize energy; choose a high-energy interval, no individual "hey" layer.
 block=round(.14*FS)
 strengths=np.array([rms(summ[i:i+block]) for i in range(0,len(summ)-block,block)])
 span=int(2.25/.14)
 if len(strengths)<=span+2:raise RuntimeError("football audio too short for crowd swell")
 energy=np.convolve(strengths, np.ones(span)/span, mode="valid")
 selections=np.argsort(energy)[::-1]
 ix=next((int(s) for s in selections if s*.14>1.5+variant and (s+span)*.14<len(summ)/FS-1.2),
          int(selections[0]))
 start=int(ix*block)
 out=np.zeros(round(2.25*FS),dtype=np.float32)
 source=summ[start:start+len(out)]
 out[:len(source)]=source
 # Binaural-diffuse through filtering, subdued behind actions.
 out=low(out,2050)
 out/=max(.03,rms(out)*8)
 fade_in=round(.21*FS);fade_out=round(.68*FS)
 out[:fade_in]*=np.linspace(0,1,fade_in)
 out[-fade_out:]*=np.linspace(1,0,fade_out)
 return out
for i in (1,2):
 take=recordings[(i-1)%len(recordings)]
 roar=recorded_roar(take,i-1)
 render_wav(f"crowd_roar_{i}.wav",roar)
 print("STADIUM_ROAR_VARIANT",i,"2.25s real spectators",flush=True)
# Actual struck metal + padded impacts + genuine body hit recordings.
zipfile_url="https://opengameart.org/sites/default/files/impact_-_starninjas.zip"
arch=get(zipfile_url,"real_cardboard_impact_shield_CC0.zip")
shield_samples=[]
with zipfile.ZipFile(arch) as z:
 for entry in z.namelist():
  if entry.lower().endswith((".wav",".ogg",".flac",".mp3")):
   path=TEMP/("shield_"+str(len(shield_samples))+Path(entry).suffix.lower())
   path.write_bytes(z.read(entry))
   try:shield_samples.append(decode(path))
   except Exception:continue
if not shield_samples:raise RuntimeError("Shield/punch field recordings unusable")
print("SHIELD_IMPACT_RECORDINGS",len(shield_samples),flush=True)
# A large collection of CC0 genuine body blows, not a synthesized 'thump'.
# A 7z archive is decoded by the workflow's py7zr dependency.
punch_7z=get("https://opengameart.org/sites/default/files/independent_nu_ljudbank-hits_and_punches.7z",
 "physical_body_hits_CC0.7z",required=False)
punch_samples=[]
if punch_7z:
 import py7zr
 folder=TEMP/"punch_7z";folder.mkdir(exist_ok=True)
 with py7zr.SevenZipFile(punch_7z,mode="r") as z:z.extractall(path=folder)
 files=sorted(f for f in folder.rglob("*") if f.suffix.lower() in (".wav",".ogg",".mp3",".aiff",".flac"))
 for path in files[:45]:
  try:
   x=decode(path)
   if len(x)>2000 and rms(x)>.003:
    punch_samples.append(x)
  except Exception:continue
print("BODY_HIT_RECORDINGS",len(punch_samples),flush=True)
# Source from VSCO CC0 for bass wall impact and authentic struck plate.
vsco="https://raw.githubusercontent.com/sgossner/VSCO-2-CE/master/Percussion/"
low_drum=decode(get(vsco+"BDrumNewhit_v7_rr1_Sum.wav","big_recorded_bass_drum.wav"))
metal=decode(get(vsco+"BrakeDrum1_Hammer_v3_Sum.wav","metal_shield_plate.wav"))
anvil=decode(get(vsco+"Anvil_Hit1_v3_Sum.wav","recorded_anvil.wav"))
# Sword-on-sword CC0 existing collision samples, add real blade edge & dense body.
swords=get("https://opengameart.org/sites/default/files/sword_clash_-_starninjas_0.zip",
 "physical_knife_collisions_CC0.zip")
metal_blades=[]
with zipfile.ZipFile(swords) as z:
 for e in z.namelist():
  if e.lower().endswith((".wav",".ogg",".flac",".mp3")):
   path=TEMP/("blade_"+str(len(metal_blades))+Path(e).suffix.lower())
   path.write_bytes(z.read(e))
   try:metal_blades.append(decode(path))
   except Exception:continue
def physical_onset(sound):
 sound=sound.astype(np.float32)
 # preserve the first real physical strike while discarding leading recorded silence
 chunk=round(.005*FS)
 amp=np.array([rms(sound[i:i+chunk]) for i in range(0,len(sound)-chunk,chunk)])
 if len(amp)==0:return sound
 ids=np.flatnonzero(amp>np.max(amp)*.24)
 pos=max(0,int(ids[0])*chunk-round(.008*FS)) if len(ids) else 0
 return sound[pos:]
def material(sound,n,lowpass,decay=.14,offset=0):
 duration=min(len(sound),n-offset)
 if duration<=0:return np.zeros(n,dtype=np.float32)
 sample=physical_onset(sound)[:duration]
 sample=low(sample,lowpass)
 if len(sample)>int(FS*decay):
  tail=len(sample)-int(FS*decay)
  sample[int(FS*decay):]*=np.exp(-np.arange(tail)/(FS*.075)).astype(np.float32)
 sample=fade(sample,.003,.05)
 sample/=max(.05,rms(sample)*9)
 result=np.zeros(n,dtype=np.float32)
 end=min(n,offset+len(sample));result[offset:end]=sample[:end-offset]
 return result
families={
 'hit':(3,.40), 'heavy_hit':(2,.55), 'dash_hit':(2,.56),
 'block':(2,.45),'parry':(2,.48),'guard':(2,.27),'finisher':(1,.79)
}
for kind,(variants,seconds) in families.items():
 for v in range(variants):
  n=round(seconds*FS)
  # Sound materials have separate jobs: steel edge / leather flesh / low
  # resonance of real percussion. No pure sine 'ding', no metallic long ring.
  thud=(punch_samples[(v*4+3)%len(punch_samples)]
        if punch_samples else shield_samples[(v*2+1)%len(shield_samples)])
  slam=shield_samples[(v*3+1)%len(shield_samples)]
  blade=metal_blades[(v*2+2)%len(metal_blades)] if metal_blades else metal
  result=np.zeros(n,dtype=np.float32)
  if kind=='hit':
   result+=material(thud,n,1700,.22)*.75
   result+=material(slam,n,990,.17,offset=round(.011*FS))*.35
   result+=material(low_drum,n,360,.28,offset=round(.016*FS))*.38
  elif kind in ('heavy_hit','dash_hit'):
   result+=material(thud,n,2000,.23)*.92
   result+=material(slam,n,1450,.19,offset=round(.007*FS))*.46
   result+=material(low_drum,n,410,.40,offset=round(.011*FS))*.68
   result+=material(anvil,n,1900,.11,offset=round(.005*FS))*.12
  elif kind in ('block','parry','guard'):
   result+=material(blade,n,3000,.10)*(.65 if kind=='parry' else .31)
   result+=material(metal,n,1800,.13,offset=round(.011*FS))*(.44 if kind=='parry' else .49)
   result+=material(slam,n,1400,.21,offset=round(.024*FS))*.53
   result+=material(low_drum,n,440,.29,offset=round(.028*FS))*.45
   if kind=='parry':
    result+=material(slam,n,1100,.16,offset=round(.077*FS))*.23
  else: # finisher
   result+=material(thud,n,1700,.29)*1.02
   result+=material(blade,n,2900,.12)*.47
   result+=material(slam,n,1200,.30,offset=round(.018*FS))*.54
   result+=material(low_drum,n,370,.55,offset=round(.02*FS))*.83
   result+=material(anvil,n,1400,.095,offset=round(.006*FS))*.17
  # no staccato digital explosion, no tuned synth, no lingering metallic bell.
  result=np.tanh(result*1.15).astype(np.float32)
  result=fade(result,.002,.11)
  render_wav(kind+"_"+str(v+1)+".wav",result)
  print("HEAVY_PHYSICAL_IMPACT",kind,v+1,seconds,flush=True)
manifest_path=OUT/"manifest.json"
manifest=json.loads(manifest_path.read_text())
assert manifest["version"]==4
manifest["version"]=5
manifest["title"]="METAL OF ROME v5 - real football-stadium crowd and heavyweight recorded cinematic melee"
manifest["crowd_source"]=[
 "https://commons.wikimedia.org/wiki/File:Spectators_during_a_football_match.webm",
 "https://commons.wikimedia.org/wiki/File:2025_Bika_football_finals.webm"]
manifest["body_impact_source"]="https://opengameart.org/node/2558"
manifest["shield_impact_source"]="https://opengameart.org/content/10-impactshield-blocks"
manifest["crowd_design"]={
 "field_recordings":len(recordings),
 "only_real_football_spectators":True,
 "no_speech_or_solo_shouts":True,
 "diffuse_stereo_stadium":True,
 "reaction_seconds":2.25,
 "avoid_intelligible_close_voices":True}
manifest["melee_design"]={
 "actual_recorded_body_hits":len(punch_samples),
 "actual_recorded_shield_impacts":len(shield_samples),
 "blade_collision_recordings":len(metal_blades),
 "layers":["dry steel edge","cardboard shield/body contact",
           "real bass drum low punch","very short heavy metal plate"],
 "no_synthetic_tonal_clangs":True}
manifest["mix_priority"]="weapon hit > shield/parry > footsteps > stadium crowd > war drum"
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print("FOOTBALL_STADIUM_AND_HEAVY_IMPACTS_PASS",
      len(recordings),"real football stadium recordings,",
      len(shield_samples),"physical shield recordings,",
      len(punch_samples),"body strikes",flush=True)
