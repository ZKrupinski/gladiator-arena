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
# Sustained LIVE horn / low tuba performances for ceremonial start/end cues.
# Absolutely no trumpet or staccato melody in the cues.
ceremony_horn=decode(source(VSCO,'Brass/F Horn/sus/MOHorn_sus_C3_v3_1.wav','live_sustained_horn_C3.wav'))
ceremony_tuba=decode(source(VSCO,'Brass/Tuba/sus/Tuba3_sus_D2_v2_rr1_Mid.wav','live_sustained_tuba_D2.wav'))
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
# V4: BATTLE HAS NO MELODY. Physical recorded large drums lead all 24 bars.
# Heavy footstep pattern: DOOM-DOOM DODOM, changing accent every four bars.
# Horns are reserved only for solemn title/result *stingers*, never battle.
# Sidechained in game engine so strikes remain louder than any ensemble.
beat_patterns=[
 [(0.0,.48),(1.0,.40),(2.50,.50),(3.0,.56)],
 [(0.0,.52),(1.0,.42),(2.0,.35),(2.75,.46),(3.25,.50)],
 [(0.0,.55),(1.0,.39),(2.5,.52),(3.0,.55)],
 [(0.0,.48),(1.0,.42),(2.25,.46),(2.75,.51),(3.25,.58)]
]
low_kick=cut(bd,.56,.21,1150)
earth_drum=cut(wood,.50,.19,1400)
dry_kick=cut(bd,.31,.12,890)
dry_tom=cut(wood,.29,.10,1400)
dry_snare=cut(sn,.17,.08,2200)
for bar in range(BARS):
 t=bar*4*BEAT
 beats=beat_patterns[bar%4]
 # Spacious, doom-laden giant war drums; absolutely no upper-register tune.
 for k,(beat,vol) in enumerate(beats):
  at=t+beat*BEAT
  add(bed,at,low_kick,vol*.67,pan=.06 if k%2 else -.06)
  add(bed,at+.014,earth_drum,vol*.34,pan=.22 if k%2 else -.21)
  if bar>=4:
   add(drums,at,dry_kick,.21+.10*(k%2==0))
   if k%2==1:add(drums,at,dry_tom,.14,pan=-.19)
 # Performance crescendos are extra rhythmic rolls, never brass or keys.
 if bar%4==3:
  for step in range(4):
   at=t+(3.0+step*.22)*BEAT
   add(drums,at,dry_tom,.12+step*.04,pan=-.26+step*.17)
 if bar>=8:
  for beat in [0,2.0]:
   add(epic,t+beat*BEAT,earth_drum,.22,pan=.15)
  if bar%4==3:
   for k in range(6):
    at=t+(2.4+k*.25)*BEAT
    add(epic,at,dry_tom,.08+.016*k,pan=(-.30 if k%2 else .30))
 # Electric metal source is kept as a mostly-silent optional intensity layer,
 # not a repeating lead motif. Only two sparse low-string hits per four bars.
 if bar>=16 and bar%4==0:
  guitar_note=guitar['D3']
  for beat in [0,2]:
   add(guitars,t+beat*BEAT,fmt(guitar_note,.45,PITCH['D3'],PITCH['D3'],.15),.09,
       pan=-.33 if beat==0 else .33)
for name,arr in [('rome_bed.mp3',bed),('rome_drums.mp3',drums),
                 ('rome_guitars.mp3',guitars),('rome_epic.mp3',epic)]:
 edge=round(.016*FS)
 arr[:,:edge]*=np.linspace(0,1,edge)
 arr[:,-edge:]*=np.linspace(1,0,edge)
 mp3(name,arr)
 print("WAR_DRUM_STEM_NO_MELODY",name,round(DURATION,3),flush=True)
# A dedicated REAL human crowd, not the prior synthetic horn-room drone.
CROWD_URL="https://opengameart.org/sites/default/files/crowd_shouting_0.ogg"
crowd_raw=decode(get(CROWD_URL,"starninjas_crowd_shouting_CC0.ogg"))
assert len(crowd_raw)>FS*.7,"CC0 crowd asset unexpectedly short"
crowd_raw=lpf(hpf(crowd_raw.astype(np.float32),135),4400)
maxpeak=max(.01,float(np.percentile(np.abs(crowd_raw),99)))
crowd_raw=np.clip(crowd_raw/maxpeak,-1,1)*.63
crowd=stereo()
chunk_size=len(crowd_raw)
# Crossfade genuine human voices through overlapping passages for loop continuity.
step=max(int(chunk_size*.68),int(.45*FS))
edge=max(1,min(round(.16*FS),chunk_size//6))
for channel in (0,1):
 offset=round(.27*FS)*channel
 for offset_samples in range(-round(.2*FS),N,step):
  cutpiece=crowd_raw.copy()
  cutpiece[:edge]*=np.linspace(0,1,edge)
  cutpiece[-edge:]*=np.linspace(1,0,edge)
  start=offset_samples+offset
  lo=max(0,start);hi=min(N,start+len(cutpiece))
  if hi>lo:
   crowd[channel,lo:hi]+=cutpiece[lo-start:hi-start]*(.24 if channel==0 else .22)
# The crowd stem is deliberately subdued; live crowd swells follow combos.
fade=round(.15*FS)
crowd[:,:fade]*=np.linspace(0,1,fade)
crowd[:,-fade:]*=np.linspace(1,0,fade)
mp3('rome_crowd.mp3',crowd)
print("REAL_CROWD_VOICES",round(len(crowd_raw)/FS,2),"sec source, 33.488sec loop",flush=True)
# 2) Sword-hit field recordings from direct knife-on-knife recording, CC0.
CLASH="https://opengameart.org/sites/default/files/sword_clash_-_starninjas_0.zip"
SWING="https://opengameart.org/sites/default/files/sword_-_starninjas_1.zip"
clash_path=get(CLASH,"StarNinjas_sword_clash_CC0.zip",required=False)
swing_path=get(SWING,"StarNinjas_sword_swing_CC0.zip",required=False)
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
anvil=decode(source(VSCO,'Percussion/Anvil_Hit1_v3_Sum.wav','recorded_anvil.wav'))
brakedrum=decode(source(VSCO,'Percussion/BrakeDrum1_Hammer_v3_Sum.wav','recorded_brakedrum.wav'))
clashes=zip_recordings(clash_path) if clash_path else [anvil,brakedrum]
swishes=zip_recordings(swing_path) if swing_path else [hpf(decode(source(VSCO,'Percussion/bassdrum_rub4_v1.wav','real_bassdrum_rub.wav')),180)]
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
 'victory':(1,2.65,'ceremony_victory'),'defeat':(1,2.20,'ceremony_defeat'),
 'start':(1,2.20,'ceremony_start'),
 'crowd_roar':(2,1.85,'recorded_crowd_reaction')
}
for key,(var,dur,kind) in SFX.items():
 for v in range(var):
  n=round(dur*FS);result=np.zeros(n,dtype=np.float32)
  if kind=='recorded_crowd_reaction':
   # Real human shouts over a short 1.85-second crescendo with a natural tail.
   # Slight offset avoids repeating an identical excerpt each parry.
   start=int(round(v*.63*FS))%max(1,len(crowd_raw))
   src=np.concatenate((crowd_raw[start:],crowd_raw[:start]))
   repeats=int(np.ceil(n/max(1,len(src))))
   raw=np.tile(src,repeats)[:n]
   attack=min(round(.11*FS),n//6)
   release=min(round(.48*FS),n//3)
   contour=np.ones(n,dtype=np.float32)
   contour[:attack]=np.linspace(.08,1,attack)
   contour[-release:]=np.linspace(1,0,release)
   result[:]=raw*contour*.40
  elif kind=='swish':
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
  elif kind.startswith('ceremony_'):
   # Grand Roman stone-arena cue: ONE long, breathed-in low brass chord,
   # one deep ceremonial bass drum, long spacious decay. Never 'pa-ra-ra-bam'.
   # Exactly zero trumpet/flute/keyboard notes, high lead runs or bell chimes.
   # The room reflections are filtered delayed RECORDINGS, not synthesized notes.
   music=np.zeros(n,dtype=np.float32)
   def place(performance,source_freq,target_freq,at,length,level,attack,release):
    sample=fmt(performance,length,source_freq,target_freq,release)
    k=round(at*FS)
    if k>=n:return
    size=min(len(sample),n-k)
    # Slow attack = massed horn breath rather than a tooting fanfare.
    e=min(size,round(attack*FS))
    if e>0:sample[:e]*=np.sin(np.linspace(0,np.pi/2,e))**2
    music[k:k+size]+=sample[:size]*level
   if kind=='ceremony_start':
    # Fight commencement: one massive low drum, then the ancient sounding
    # horn slowly opens into the entrance, WITHOUT an up-tempo flourish.
    result+=body(dur,.65)
    place(ceremony_horn,PITCH['C3'],PITCH['D3'],.07,1.73,.60,.34,.44)
    place(ceremony_tuba,PITCH['D2'],PITCH['D2'],.04,1.76,.33,.30,.46)
   elif kind=='ceremony_victory':
    # Triumph: broad heroic D-minor chord from recordings of real players,
    # not a D-F-A-D trumpet melody. Deep timpani-like heartbeat once.
    result+=body(dur,.70)
    place(ceremony_horn,PITCH['C3'],PITCH['D3'],.04,2.25,.60,.33,.62)
    place(ceremony_horn,PITCH['C3'],PITCH['F3'],.11,2.10,.26,.40,.66)
    place(ceremony_tuba,PITCH['D2'],PITCH['D2'],.03,2.18,.33,.37,.67)
   else:
    # Defeat: restrained funeral horn and low tuba falling into silence,
    # no chirpy victory fanfare and no struck metal at the end.
    result+=body(dur,.39)
    place(ceremony_horn,PITCH['C3'],PITCH['D3'],.10,1.55,.30,.40,.70)
    place(ceremony_tuba,PITCH['D2'],PITCH['D2'],.02,1.82,.46,.37,.65)
   # Large enclosed stone arena: dark broadband reflected *instrument*
   # recordings. No synthetic harmonic partials are introduced.
   music=lpf(music,2350)
   room=np.zeros(n,dtype=np.float32)
   for delay,gain in [(0.085,.11),(0.147,.105),(0.238,.08),(0.329,.06),
                       (0.451,.045),(0.63,.031)]:
    ix=round(delay*FS)
    room[ix:]+=lpf(music[:-ix],1800)*gain
   result+=music+room
   # Limit to a single continuous note attack and prevent the reverb ending
   # as a conspicuous hard cut.
   tail=min(round(.27*FS),n//4)
   result[-tail:]*=np.linspace(1,0,tail)**1.35
  # Close with soft non-pitched impulse; no reverb / repeated harmonic ringing.
  peak=max(.01,np.max(np.abs(result)))
  result=np.tanh((result/peak)*1.1).astype(np.float32)
  wav(f'{key}_{v+1}.wav',result)
manifest={
 'version':4,'title':'METAL OF ROME v4 - war drums and live crowd dominate, no combat melody',
 'bpm':BPM,'bars':BARS,'durationSeconds':round(DURATION,4),
 'stems':['rome_bed.mp3','rome_drums.mp3','rome_guitars.mp3','rome_epic.mp3'],
 'crowd':'rome_crowd.mp3',
 'sfx':{k:[f'{k}_{i+1}.wav' for i in range(val[0])] for k,val in SFX.items()},
 'production':'CC0 real recorded brass, real distorted guitar, acoustic drums, recorded metal + swords; no instrument oscillator, no pitched bell attacks.',
 'brass_source':'https://github.com/sgossner/VSCO-2-CE',
 'guitar_source':'https://github.com/freepats/electric-guitar-FSBS-dist1',
 'sword_source':'https://opengameart.org/content/20-sword-sound-effects-attacks-and-clashes',
 'crowd_source':'https://opengameart.org/content/crowd-shoutingspeaking-ambience',
 'battle_mix':{'no_bright_horn_melody':True,'dominant':'recorded war drums and real human crowd',
               'sfx_priority':True,'crowd_reaction_variants':2},
 'ceremony':{'start':'single low recorded horn/tuba swell, no fast notes',
             'victory':'one broad low recorded horn chord with deep war drum',
             'defeat':'slow low horn and tuba funeral cadence',
             'no_trumpet_or_flute':True,'no_upbeat_fanfare':True,
             'no_pitched_bell_hits':True},
 'license':'CC0'
}
with open(os.path.join(OUT,'manifest.json'),'w') as f:json.dump(manifest,f,ensure_ascii=False,indent=2)
print("REAL_BRASS_AND_DRY_FOLEY_PASS",sum(len(v) for v in manifest['sfx'].values()),'variants',flush=True)
