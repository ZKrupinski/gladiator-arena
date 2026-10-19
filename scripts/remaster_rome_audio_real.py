#!/usr/bin/env python3
"""METAL OF ROME v2: recorded CC0 performance-source remaster, NO synth notes or ding.
All musical notes derive from real acoustic brass or a real distorted guitar sample.
Real drum hits and recorded knife clashes drive impacts (short transient, no pitched bell).
Sources and licenses documented in docs/audio/metal-of-rome-v2.md.
"""
import os,io,zipfile,urllib.request,subprocess,json,wave,math,sys
from urllib.parse import quote
import numpy as np
from scipy.signal import sosfilt,butter
FS=32000;BPM=172;BEAT=60/BPM;BARS=24;N=round(FS*BEAT*4*BARS);DURATION=N/FS
OUT="public/assets/audio/rome-v1"
RAW="/tmp/rome-recordings"
os.makedirs(OUT,exist_ok=True);os.makedirs(RAW,exist_ok=True)
RNG=np.random.default_rng(20261019)
PITCH={'D2':73.416,'F2':87.307,'G2':97.999,'A2':110,'Bb2':116.54,
       'C3':130.813,'D3':146.832,'F3':174.614,'G3':196,'A3':220,
       'Bb3':233.082,'C4':261.626,'D4':293.665,'F4':349.228,'G4':392,'A4':440}
def get(url,filename,required=True):
 path=os.path.join(RAW,filename)
 if not os.path.isfile(path):
  try:
   req=urllib.request.Request(url,headers={'User-Agent':'GladiatorArena-OriginalAudio/2'})
   with urllib.request.urlopen(req,timeout=75) as res:
    data=res.read()
   if len(data)<600:raise RuntimeError("Unexpectedly short recording "+str(len(data)))
   with open(path,'wb') as fp:fp.write(data)
  except Exception as exc:
   if required:raise RuntimeError("The real recorded source is required: "+url) from exc
   print("OPTIONAL_SOURCE_UNAVAILABLE",url,exc,flush=True);return None
 print("RECORDED_CC0",filename,os.stat(path).st_size,flush=True)
 return path
def source(repo,path,dest):
 return get("https://raw.githubusercontent.com/"+repo+"/master/"+quote(path,safe="/"),dest)
def decode(path):
 dat=subprocess.check_output(['ffmpeg','-hide_banner','-loglevel','error','-i',path,
  '-f','f32le','-ac','1','-ar',str(FS),'-'])
 return np.frombuffer(dat,dtype='<f4').copy()
def lpf(x,hz):
 return sosfilt(butter(2,hz/(FS/2),btype='low',output='sos'),x).astype('float32')
def hpf(x,hz):
 return sosfilt(butter(2,hz/(FS/2),btype='high',output='sos'),x).astype('float32')
def stereo():return np.zeros((2,N),dtype=np.float32)
def add(arr,sec,signal,amp=.3,pan=0):
 i=round(sec*FS)
 if i<0 or i>=N:return
 n=min(len(signal),N-i)
 l=math.sqrt((1-pan)/2);r=math.sqrt((1+pan)/2)
 arr[0,i:i+n]+=signal[:n]*amp*l
 arr[1,i:i+n]+=signal[:n]*amp*r
def fmt(samples,dur,srcpitch,target,release=.06):
 n=round(dur*FS)
 rate=target/srcpitch
 src=np.arange(n,dtype=np.float32)*rate
 if len(samples)<2:return np.zeros(n,dtype=np.float32)
 out=np.interp(src,np.arange(len(samples)),samples,left=0,right=0).astype(np.float32)
 attack=min(round(.012*FS),n//6)
 end=min(round(release*FS),n//4)
 out[:attack]*=np.linspace(0,1,attack,endpoint=True)
 out[-end:]*=np.linspace(1,0,end,endpoint=True)
 return out
def cut(sample,seconds,fade=.06,brightness=3800):
 n=round(seconds*FS)
 out=np.zeros(n,dtype=np.float32);size=min(n,len(sample))
 out[:size]=sample[:size]
 if brightness:out=lpf(out,brightness)
 env=int(min(fade,seconds/3)*FS)
 if env:out[-env:]*=np.linspace(1,0,env)
 return out
def wav(file,signal):
 a=signal.astype(np.float32)
 a=np.tanh(a*.85)
 peak=max(.01,np.max(np.abs(a)))
 a*=.87/peak
 with wave.open(os.path.join(OUT,file),'wb') as w:
  w.setnchannels(1);w.setsampwidth(2);w.setframerate(FS)
  w.writeframes(np.int16(np.clip(a,-1,1)*32767).tobytes())
def mp3(file,arr):
 v=np.tanh(arr*.90)
 mx=max(.05,np.max(np.abs(v)))
 v*=.82/mx
 tmp=os.path.join(RAW,file+'.wav')
 with wave.open(tmp,'wb') as w:
  w.setnchannels(2);w.setsampwidth(2);w.setframerate(FS)
  w.writeframes(np.int16(np.clip(v,-1,1)*32767).T.tobytes())
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',tmp,
  '-codec:a','libmp3lame','-b:a','112k',os.path.join(OUT,file)],check=True)
 os.remove(tmp)
# 1) Recorded instrument multisamples — never fall back to synthesis.
VSCO="sgossner/VSCO-2-CE"
horns={
 'D4':decode(source(VSCO,'Brass/F Horn/stac/MOHorn_stac_D4_v3_rr1.wav','horn_D4.wav')),
 'F4':decode(source(VSCO,'Brass/F Horn/stac/MOHorn_stac_F4_v3_rr1.wav','horn_F4.wav')),
 'C3':decode(source(VSCO,'Brass/F Horn/stac/MOHorn_stac_C3_v3_rr1.wav','horn_C3.wav')),
 'A2':decode(source(VSCO,'Brass/F Horn/stac/MOHorn_stac_A2_v3_rr1.wav','horn_A2.wav'))
}
trumpets={
 'D4':decode(source(VSCO,'Brass/Trumpet/stac/Sum_SHTrumpet_stac_D4_v3_rr1.wav','trumpet_D4.wav')),
 'F4':decode(source(VSCO,'Brass/Trumpet/stac/Sum_SHTrumpet_stac_F4_v3_rr1.wav','trumpet_F4.wav')),
 'G3':decode(source(VSCO,'Brass/Trumpet/stac/Sum_SHTrumpet_stac_G3_v3_rr1.wav','trumpet_G3.wav')),
 'A4':decode(source(VSCO,'Brass/Trumpet/stac/Sum_SHTrumpet_stac_A4_v3_rr1.wav','trumpet_A4.wav'))
}
tuba=decode(source(VSCO,'Brass/Tuba/stac/Tuba3_stac_D2_v2_rr1_Sum.wav','tuba_D2.wav'))
bd=decode(source(VSCO,'Percussion/BDrumNewhit_v7_rr1_Sum.wav','acoustic_bassdrum.wav'))
sn=decode(source(VSCO,'Percussion/Snare2-HitNS_v5_rr1_Sum.wav','acoustic_snare.wav'))
hat=decode(source(VSCO,'Percussion/cymbal-crashshort_v1.wav','acoustic_cymbal.wav'))
wood=decode(source(VSCO,'Percussion/LogDrumLo_MedM_v3_rr1_Sum.wav','acoustic_low_drum.wav'))
# Proper real distorted guitar: FreePats records electric Fender strings through
# an overdriven amplifier. Never generate a waveform-based 'guitar' oscillation.
GTR="https://raw.githubusercontent.com/freepats/electric-guitar-FSBS-dist1/master/samples/bridge/"
guitar={
 'D3':decode(get(GTR+'D3_s3_01.flac','recorded_guitar_D3.flac')),
 'F2':decode(get(GTR+'F2_s1_01.flac','recorded_guitar_F2.flac')),
 'A2':decode(get(GTR+'A2_s2_01.flac','recorded_guitar_A2.flac')),
 'C3':decode(get(GTR+'C3_s2_01.flac','recorded_guitar_C3.flac'))
}
def pick(bank,note):
 freq=PITCH[note]
 src=min(bank,key=lambda k:abs(math.log2(PITCH[k]/freq)))
 return bank[src],PITCH[src]
bed=stereo();drums=stereo();guitars=stereo();epic=stereo()
roots=['D2','D2','Bb2','C3','D2','D2','F2','G2',
       'D2','D2','Bb2','A2','G2','A2','C3','D2',
       'D2','F2','G2','Bb2','D2','C3','Bb2','A2']
melody=['D4','F4','G4','A4','F4','G4','F4','D4',
        'D4','F4','A4','G4','F4','G4','D4','D4',
        'D4','A4','G4','F4','D4','G4','F4','D4']
# Exact beat-locked multitracks. Dynamic stems use pre-recorded *acoustic*
# sources exclusively. Bass synth, keys, synthesized choir and oscillators removed.
for b in range(BARS):
 t=b*BEAT*4;root=roots[b];note=melody[b]
 add(bed,t,cut(bd,.38,.07,900),.31,pan=-.12)
 for beat in [0,2]:
  add(bed,t+beat*BEAT,cut(wood,.32,.08,1200),.23,pan=.20)
 for beat in [0,2]:
  instrument,freq=pick(horns,note)
  add(bed,t+beat*BEAT,fmt(instrument,.6,freq,PITCH[note]),.22,pan=-.12)
  instrument,freq=pick(trumpets,note)
  add(bed,t+beat*BEAT+.018,fmt(instrument,.45,freq,PITCH[note]),.16,pan=.20)
 # Low real tuba swells instead of synthetic bass keyboard.
 add(bed,t,fmt(tuba,.64,PITCH['D2'],PITCH[root]),.21,pan=0)
 if b>=2:
  kick=cut(bd,.19,.04,600)
  snare=cut(sn,.18,.04,5000)
  bright=cut(hat,.15,.08,6500)
  for idx in range(16):
   at=t+idx*BEAT/4
   if idx in [0,2,4,6,8,10,12,14]:
    add(drums,at,kick,.23 if idx%4 else .35,pan=0)
   if idx in [4,12]:
    add(drums,at,snare,.37,pan=.08)
   if idx%2==0:
    add(drums,at,bright,.09,pan=-.24 if idx%4 else .25)
   # Chugging *real recorded overdrive guitar*, not sawtooth.
   if idx in [0,2,4,6,8,10,12,14]:
    for mul,pan,vol in [(1,-.44,.32),(2**(7/12),.42,.16)]:
     target=PITCH[root]*mul
     closest=min(guitar,key=lambda k:abs(math.log2(PITCH[k]/target)))
     orig=guitar[closest]
     # A recorded distorted guitar has a real pick, attack and string grit.
     sig=fmt(orig,.23 if idx%4 else .34,PITCH[closest],target,.05)
     add(guitars,at,sig,vol,pan=pan)
  if b%4==3:
   for k in range(4):
    add(drums,t+(3+k*.25)*BEAT,cut(wood,.26,.05,1200),.24+.04*k,pan=-.3+.20*k)
 if b>=8:
  # Epic layer: only actual section-like doubled horn/trumpet recordings,
  # never a piano, synthetic choir or keys.
  for beat in [0,1,2,3]:
   if beat%2==0 or b>=16:
    inst,freq=pick(horns,note)
    add(epic,t+beat*BEAT,fmt(inst,.58,freq,PITCH[note]),.19,pan=-.23)
    inst,freq=pick(trumpets,note)
    add(epic,t+beat*BEAT+.012,fmt(inst,.48,freq,PITCH[note]),.17,pan=.29)
  if b%4==3:
   add(epic,t+3*BEAT,cut(hat,.7,.17,7600),.20)
for name,arr in [('rome_bed.mp3',bed),('rome_drums.mp3',drums),
                 ('rome_guitars.mp3',guitars),('rome_epic.mp3',epic)]:
 edge=round(.016*FS)
 arr[:,:edge]*=np.linspace(0,1,edge)
 arr[:,-edge:]*=np.linspace(1,0,edge)
 mp3(name,arr)
 print("REAL_INSTRUMENT_STEM",name,round(DURATION,3),flush=True)
# 2) Sword-hit field recordings from direct knife-on-knife recording, CC0.
CLASH="https://opengameart.org/sites/default/files/sword_clash_-_starninjas_0.zip"
SWING="https://opengameart.org/sites/default/files/sword_-_starninjas_1.zip"
clash_path=get(CLASH,"StarNinjas_sword_clash_CC0.zip")
swing_path=get(SWING,"StarNinjas_sword_swing_CC0.zip")
def zip_recordings(zpath):
 with zipfile.ZipFile(zpath) as z:
  result=[]
  for member in z.namelist():
   if not member.lower().endswith(('.wav','.mp3','.ogg','.flac')):continue
   data=z.read(member)
   ext=os.path.splitext(member)[-1].lower()
   name=os.path.join(RAW,'zip_'+str(len(result))+'_'+('clash' if 'clash' in zpath else 'swing')+ext)
   with open(name,'wb') as f:f.write(data)
   try:out=decode(name)
   except subprocess.CalledProcessError:continue
   if len(out)>1000 and np.max(np.abs(out))>0.01:result.append(out)
  if not result:raise RuntimeError("No real recorded sword Foley decoded in CC0 archive "+zpath)
  print("ORIGINAL_REAL_KNIFE_RECORDINGS",len(result),zpath,flush=True)
  return result
clashes=zip_recordings(clash_path)
swishes=zip_recordings(swing_path)
def onset(a):
 x=np.abs(a)
 # Avoid leading silence; quickly locate strong acoustic contact.
 block=256;energies=np.array([np.sqrt(np.mean(x[i:i+block]**2)) for i in range(0,len(a)-block,block)])
 if len(energies)<3:return a
 pk=np.max(energies);candidates=np.flatnonzero(energies>.27*pk)
 if not len(candidates):return a
 start=max(0,int(candidates[0])*block-int(.015*FS))
 return a[start:]
def body(l,depth=.8):
 # Pure transient/noise from original recorded bass drum; no pitched tone.
 d=onset(bd)
 n=round(l*FS)
 out=np.zeros(n,dtype=np.float32)
 sig=cut(d,min(l,.34),.10,550)
 out[:len(sig)]+=sig*depth
 return out
SFX={
 'swing':(3,.28,'swish'),'hit':(3,.24,'strike'),
 'block':(2,.25,'shield'),'parry':(2,.24,'parry'),
 'heavy_swing':(2,.36,'swish'),'heavy_hit':(2,.33,'heavy'),
 'dash':(2,.34,'swish'),'dash_hit':(2,.32,'heavy'),
 'dodge':(2,.21,'swish'),'guard':(2,.20,'shield'),
 'finisher':(1,.45,'heavy'),
 'victory':(1,1.20,'fanfare'),'defeat':(1,.85,'low'),
 'start':(1,.95,'fanfare')
}
for key,(var,dur,kind) in SFX.items():
 for v in range(var):
  n=round(dur*FS);result=np.zeros(n,dtype=np.float32)
  if kind=='swish':
   raw=onset(swishes[(v+1)%len(swishes)])
   sig=cut(raw,min(dur,.26),.04,4600)
   result[:len(sig)]+=sig*.88
  elif kind in ('strike','shield','parry','heavy'):
   raw=onset(clashes[(v*3+(2 if kind=='parry' else 0))%len(clashes)])
   # Hard cut dull low clang; remove all sustained inharmonic 'ding' tails.
   length=min(dur,.105 if kind=='strike' else .13 if kind=='parry' else .16)
   sig=cut(raw,length,.045,2300 if kind in ('shield','parry') else 1800)
   result[:len(sig)]+=sig*.63
   result+=body(dur,.55 if kind=='strike' else .82 if kind in ('shield','parry') else 1.13)
   if kind=='parry':
    # Layered low shield shove at +80ms, with no sustained metallic pitch.
    delayed=cut(onset(clashes[(v*3+1)%len(clashes)]),.09,.04,1450)
    pos=round(.085*FS);result[pos:pos+len(delayed)]+=delayed*.29
  elif kind=='low':
   result+=body(dur,1.0)
  elif kind=='fanfare':
   # Recorded trumpet and horn, NO oscillator melody or synthesized chime.
   for i,note in enumerate(['D4','F4','A4','D4']):
    t=.23*i
    if t+.21>dur:break
    arr,p=pick(trumpets,note)
    sample=fmt(arr,.29,p,PITCH[note],.10)
    pos=round(t*FS);last=min(n-pos,len(sample))
    result[pos:pos+last]+=sample[:last]*.37
  # Close with soft non-pitched impulse; no reverb / repeated harmonic ringing.
  peak=max(.01,np.max(np.abs(result)))
  result=np.tanh((result/peak)*1.1).astype(np.float32)
  wav(f'{key}_{v+1}.wav',result)
# Do not retain noise-only 'crowd': use subdued live room/noise background
# from the genuine orchestra recording tails rather than a synthetic drone.
crowd=stereo()
for channel in range(2):
 raw=horns['C3']
 # Low natural room residue from a long acoustic sample recording.
 room=lpf(raw,680)
 room=room[int(.09*FS):int(.40*FS)]
 room=room*0.02
 for k in range(0,N,len(room)):
  m=min(len(room),N-k);crowd[channel,k:k+m]+=room[:m]
mp3('rome_crowd.mp3',crowd)
manifest={
 'version':2,'title':'METAL OF ROME v2 - 100% recorded instruments, dry real combat Foley',
 'bpm':BPM,'bars':BARS,'durationSeconds':round(DURATION,4),
 'stems':['rome_bed.mp3','rome_drums.mp3','rome_guitars.mp3','rome_epic.mp3'],
 'crowd':'rome_crowd.mp3',
 'sfx':{k:[f'{k}_{i+1}.wav' for i in range(val[0])] for k,val in SFX.items()},
 'production':'CC0 real recorded brass, real distorted guitar, acoustic drums, recorded swords; no instrument oscillator, no pitched bell attacks.',
 'brass_source':'https://github.com/sgossner/VSCO-2-CE',
 'guitar_source':'https://github.com/freepats/electric-guitar-FSBS-dist1',
 'sword_source':'https://opengameart.org/content/20-sword-sound-effects-attacks-and-clashes',
 'license':'CC0'
}
with open(os.path.join(OUT,'manifest.json'),'w') as f:json.dump(manifest,f,ensure_ascii=False,indent=2)
print("REAL_BRASS_AND_DRY_FOLEY_PASS",sum(len(v) for v in manifest['sfx'].values()),'variants',flush=True)
