#!/usr/bin/env python3
"""METAL OF ROME: deterministic, original physically-inspired audio prototype.
No third-party music, soundfonts, commercial samples or recorded songs.
Renders tempo-locked music stems and independent cinematic Foley layers.
"""
import os, math, wave, subprocess
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

OUT="public/assets/audio/rome-v1"
os.makedirs(OUT,exist_ok=True)
FS=32000
BPM=172
BEAT=60/BPM
BARS=24
LENGTH=BEAT*4*BARS
N=int(round(FS*LENGTH))
RNG=np.random.default_rng(20261019)
PI=np.pi
PITCH={"D1":36.708,"F1":43.654,"G1":48.999,"A1":55.0,"Bb1":58.27,"C2":65.406,"D2":73.416,"F2":87.307,"G2":97.999,"A2":110,"Bb2":116.54,"C3":130.81,"D3":146.832,"F3":174.614,"G3":196,"A3":220,"Bb3":233.08,"C4":261.626,"D4":293.665,"F4":349.23,"G4":392,"A4":440,"Bb4":466.16,"C5":523.25,"D5":587.33}

def env(n,attack=.009,decay=.22,release=.08):
    a=np.arange(n)/FS
    aa=np.clip(a/max(.0001,attack),0,1)
    tail=np.exp(-a/max(.005,decay))
    rr=np.clip((n-np.arange(n))/(FS*max(.003,release)),0,1)
    return (aa*tail*np.minimum(1,rr)).astype(np.float32)

def lp(x,hz):
    return sosfilt(butter(2,min(.98,hz/(FS/2)),btype='low',output='sos'),x).astype(np.float32)
def hp(x,hz):
    return sosfilt(butter(2,min(.98,hz/(FS/2)),btype='high',output='sos'),x).astype(np.float32)
def stereo():
    return np.zeros((2,N),dtype=np.float32)
def add(a,start,sound,volume=1.,pan=0):
    ix=int(round(start*FS));n=min(sound.size,N-ix)
    if n<=0 or ix>=N:return
    if ix<0:sound=sound[-ix:];n=min(sound.size,N);ix=0
    l=np.sqrt((1-pan)*.5);r=np.sqrt((1+pan)*.5)
    a[0,ix:ix+n]+=sound[:n]*volume*l
    a[1,ix:ix+n]+=sound[:n]*volume*r

def chord(freq,dur,kind='horn',detune=0):
    n=max(128,int(dur*FS));t=np.arange(n,dtype=np.float32)/FS
    vib=.003*np.sin(2*PI*5.2*t)
    phase=2*PI*freq*(1+detune)*t+vib
    if kind=='horn':
        # Warm Roman war-horn-ish lip brass: drifting formant partials + breath onset.
        s=np.zeros(n,dtype=np.float32)
        for j,weight in enumerate([.62,.75,.38,.24,.19,.10,.06],1):
            s+=weight*np.sin(j*phase+.014*j*np.sin(2*PI*3*t))
        breath=lp(RNG.standard_normal(n).astype(np.float32),2100)*.045
        s=(s+breath)*(1-np.exp(-t*95))*np.clip((dur-t)/.15,0,1)
        s=lp(np.tanh(s*.95),4200)
    elif kind=='choir':
        # Four independent vowel formants, synthetic male chanting approximation.
        s=np.zeros(n,dtype=np.float32)
        for j in range(1,18):
            fh=j*freq
            weights=.75*np.exp(-((fh-520)/160)**2)+.5*np.exp(-((fh-1040)/240)**2)+.24*np.exp(-((fh-1800)/330)**2)
            s+=(weights+.01)/j*np.sin(j*phase+.22*j)
        s=np.tanh(s*2.3)
        s*=np.minimum(1,t/.26)*np.minimum(1,(dur-t)/.33)
    elif kind=='string':
        s=np.sin(phase)*.25+np.sin(2*phase)*.38+np.sin(3*phase)*.24+np.sin(4*phase)*.11
        s=(s+hp(RNG.standard_normal(n).astype(np.float32),1200)*.04)*np.minimum(1,t/.085)
        s*=np.minimum(1,(dur-t)/.12)
    else:
        s=np.sin(phase)
    return s.astype(np.float32)

def guitar(freq,dur,seed=0,heavy=False):
    n=max(128,int(dur*FS));t=np.arange(n,dtype=np.float32)/FS
    # Detuned multi-string power chord and pick transient through saturated amp.
    core=np.zeros(n,dtype=np.float32)
    for f,v in [(freq,.9),(freq*2,.38),(freq*1.502,.57),(freq*2.997,.32)]:
        for det in [1.0,1.006]:
            p=(f*det*t)%1
            saw=2*p-1
            core+=v*(.65*saw+.35*np.sin(2*PI*f*det*t))
    pick=hp(RNG.standard_normal(n).astype(np.float32),1700)
    core=lp(core,3600 if not heavy else 4800)
    core=np.tanh(core*2.8+pick*.18)
    damp=np.exp(-t/(.105 if not heavy else .30))
    pickenv=np.clip(t/.002,0,1)
    out=(core*damp*pickenv+pick*.065*np.exp(-t/.018))
    return out.astype(np.float32)

def bass(freq,dur):
    n=int(dur*FS);t=np.arange(n)/FS
    ph=2*PI*freq*t
    s=.85*np.sin(ph)+.42*np.sin(2*ph)+.16*np.sin(3*ph)
    return np.tanh(s*1.85).astype(np.float32)*env(n,.003,.18,.08)

def kick():
    t=np.arange(int(.35*FS),dtype=np.float32)/FS
    f=47+130*np.exp(-t*55)
    phase=2*PI*np.cumsum(f)/FS
    s=np.sin(phase)*np.exp(-t*16)+hp(RNG.standard_normal(t.size).astype(np.float32),2700)*.12*np.exp(-t*85)
    return np.tanh(s*1.55).astype(np.float32)
def snare():
    t=np.arange(int(.26*FS),dtype=np.float32)/FS
    noise=hp(RNG.standard_normal(t.size).astype(np.float32),320)
    body=np.sin(2*PI*(168*t+64*t*np.exp(-t*33)))*np.exp(-t*23)
    return (noise*.47*np.exp(-t*19)+body*.52).astype(np.float32)
def hat(open=False):
    t=np.arange(int((.29 if open else .083)*FS))/FS
    noise=hp(RNG.standard_normal(t.size).astype(np.float32),4900)
    return (noise*np.exp(-t*(15 if open else 61))*.40).astype(np.float32)
def tom():
    t=np.arange(int(.39*FS),dtype=np.float32)/FS
    freq=70+125*np.exp(-t*35)
    return (np.sin(2*PI*np.cumsum(freq)/FS)*np.exp(-t*12)).astype(np.float32)
def war_drum():
    t=np.arange(int(.8*FS),dtype=np.float32)/FS
    f=61+74*np.exp(-t*12)
    ring=np.sin(2*PI*np.cumsum(f)/FS)*np.exp(-t*6)
    cloth=lp(RNG.standard_normal(t.size).astype(np.float32),750)*np.exp(-t*25)
    return (ring+cloth*.21).astype(np.float32)
def whoosh(dur=.37,intensity=1):
    n=int(dur*FS);t=np.arange(n)/FS
    noise=hp(RNG.standard_normal(n).astype(np.float32),300)
    contour=np.sin(PI*np.minimum(1,t/dur))**1.4
    return lp(noise,5700)*contour*intensity
def metallic(dur=.57,bright=1):
    n=int(FS*dur);t=np.arange(n)/FS
    partial=np.zeros(n,dtype=np.float32)
    for freq,amp,dec in [(392,.31,.27),(689,.46,.22),(1026,.22,.16),(1753,.17,.11),(2934,.12,.08),(4682,.08,.04)]:
        partial+=amp*np.sin(2*PI*freq*t+RNG.uniform(0,6))*np.exp(-t/dec)
    click=hp(RNG.standard_normal(n).astype(np.float32),1000)*np.exp(-t*48)*.32
    return (partial*bright+click).astype(np.float32)
def impact(dur=.65,depth=1):
    n=int(FS*dur);t=np.arange(n)/FS
    f=39+125*np.exp(-t*34)
    sub=np.sin(2*PI*np.cumsum(f)/FS)*np.exp(-t*12)*depth
    snap=hp(RNG.standard_normal(n).astype(np.float32),1100)*np.exp(-t*27)*.42
    return (sub+snap).astype(np.float32)
def verb(x,amt=.21):
    # Dispersed sparse stadium reflections, retaining dry transient definition.
    output=x.copy()
    for delay,gain in [(.064,.23),(.109,.18),(.183,.13),(.276,.08),(.39,.045)]:
        n=int(delay*FS)
        output[n:]+=x[:-n]*gain*amt/.21
    return output

def normalized(a,peak=.88):
    a=np.tanh(a*1.05)
    mx=max(np.max(np.abs(a)),.00001)
    return (a*(peak/mx)).astype(np.float32)

def write_wav(name,a):
    a=normalized(a)
    path=os.path.join(OUT,name+'.wav')
    with wave.open(path,'wb') as w:
        w.setnchannels(1 if a.ndim==1 else 2);w.setsampwidth(2);w.setframerate(FS)
        pcm=np.int16(np.clip(a,-1,1)*32767)
        w.writeframes((pcm if a.ndim==1 else pcm.T).tobytes())
    return path

def write_mp3(name,a):
    path=write_wav(name,a)
    dst=os.path.join(OUT,name+'.mp3')
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',path,
      '-codec:a','libmp3lame','-b:a','112k','-ar','32000',dst],check=True)
    os.remove(path)

if __name__=='__main__':
    bed=stereo();drums=stereo();guitars=stereo();epic=stereo()
    K,S,H,HO,T,W=kick(),snare(),hat(),hat(True),tom(),war_drum()
    # All stems share the SAME sample count and bar start, for sample-locked crossfades.
    roots=['D2','D2','Bb1','C2','D2','D2','F2','G2',
           'D2','D2','Bb1','A1','G1','A1','C2','D2',
           'D2','F2','G2','Bb1','D2','C2','Bb1','A1']
    chorus=['D3','F3','G3','A3','Bb3','A3','G3','F3',
            'D3','F3','G3','D4','C4','Bb3','A3','F3',
            'D3','F3','G3','A3','Bb3','A3','G3','D4']
    for bar in range(BARS):
        base=bar*4*BEAT
        root=PITCH[roots[bar]]
        add(bed,base,W,.16 if bar%4 else .24,pan=(-.18 if bar%2 else .18))
        for b in [0,2]:
            add(bed,base+b*BEAT,W,.13,pan=(.15 if b else -.15))
        if bar>=2:
            # Doublekick and grinding snare; 16th pickups on bars with urgency.
            for sixteenth in range(16):
                at=base+sixteenth*BEAT/4
                if sixteenth in [0,3,4,6,8,10,11,12,14,15]:
                    add(drums,at,K,.47 if sixteenth%4==0 else .31)
                if sixteenth in [4,12]:
                    add(drums,at,S,.54,pan=.055)
                if sixteenth%2==0:
                    add(drums,at,H,.095,pan=-.15 if sixteenth%4 else .15)
                if sixteenth in [7,15]:
                    add(drums,at,HO,.08,pan=.31)
                if sixteenth in [0,2,4,6,8,10,12,14]:
                    # Instrument stems carry guitars without percussion backing.
                    pitch=root if sixteenth<8 else (root*(2**(3/12)) if bar%2 else root)
                    longer=sixteenth in [0,8,12]
                    d=.18 if not longer else .29
                    add(guitars,at,guitar(pitch,d,heavy=longer),.24,pan=-.47)
                    add(guitars,at+.004,guitar(pitch*1.003,d,heavy=longer),.23,pan=.47)
                    add(guitars,at,bass(root,.35 if longer else .2),.21)
            if bar%4==3:
                for step in range(4):
                    add(drums,base+(3+step*.25)*BEAT,T,.27+.045*step,pan=-.3+step*.2)
        # Roman cornu calls, answered by violins and massive synthesized choir.
        for note_idx in range(4):
            at=base+note_idx*BEAT
            if bar%4==0 and note_idx==0:
                for p in [PITCH['D3'],PITCH['A3'],PITCH['D4']]:
                    add(bed,at,chord(p,2.0,'horn'),.14,pan=.05)
            if note_idx%2==0:
                freq=PITCH[chorus[bar]]*(1 if note_idx==0 else 1.122)
                add(bed,at,chord(freq,.71,'horn'),.13,pan=.28 if note_idx==0 else -.28)
                add(bed,at,chord(freq*2,.54,'string'),.085,pan=-.2)
            if bar>=8 and bar%4 in [2,3] and note_idx in [0,2]:
                add(epic,at,chord(PITCH[chorus[bar]]/2,1.15,'choir'),.24,pan=-.18)
                add(epic,at,chord(PITCH[chorus[bar]],.95,'horn'),.10,pan=.14)
        if bar>=16:
            for beat in [0,1,2,3]:
                freq=PITCH[chorus[bar]]
                add(epic,base+beat*BEAT,chord(freq*2,.32,'string'),.085,pan=(-.3 if beat%2 else .3))
    # Add depth without drowning transients; music is layer-composed in Web Audio.
    for name,arr in [('rome_bed',bed),('rome_drums',drums),('rome_guitars',guitars),('rome_epic',epic)]:
        for channel in range(2):arr[channel]=verb(arr[channel],.10 if name=='rome_drums' else .22)
        # gentle loop seam, preserving groove and note attack.
        ramp=int(.025*FS);arr[:,:ramp]*=np.linspace(0,1,ramp)
        arr[:,-ramp:]*=np.linspace(1,0,ramp)
        write_mp3(name,arr)
        print("MUSIC",name,round(LENGTH,2),"seconds",flush=True)
    # Original custom sound-design one-shots, layered as movie Foley.
    sfx={}
    variants={'swing':3,'hit':3,'block':2,'parry':2,'heavy_swing':2,
              'heavy_hit':2,'dash':2,'dash_hit':2,'dodge':2,'guard':2,
              'finisher':1,'victory':1,'defeat':1,'start':1}
    for kind,nvar in variants.items():
        for v in range(nvar):
            if kind in ['swing','dodge','dash','heavy_swing']:
                clip=whoosh(.33 if kind=='swing' else .46,.64)+(RNG.standard_normal(int(FS*(.33 if kind=='swing' else .46))).astype(np.float32)*0)
                if kind in ['dash','heavy_swing']:
                    m=impact(.46,.29);clip=np.pad(clip,(0,max(0,len(m)-len(clip))))[:max(len(clip),len(m))]
                    clip[:len(m)]+=m*.33
            elif kind in ['hit','block','parry','heavy_hit','dash_hit','finisher']:
                heavy=kind in ['heavy_hit','dash_hit','finisher']
                dur=.71 if heavy else .46
                clip=impact(dur,1.1 if heavy else .65)
                metal=metallic(dur,1.45 if kind in ['parry','block'] else .8)
                clip+=metal*(.92 if kind=='parry' else .62)
                if kind=='parry':
                    # dry CLANG then rising deflection and opponent recoil
                    second=metallic(.4,.6)
                    j=int(.08*FS);clip[j:j+min(len(second),len(clip)-j)]+=second[:len(clip)-j]*.48
                if kind=='finisher':
                    j=int(.14*FS);boom=impact(.45,1.4)
                    clip[j:j+min(len(boom),len(clip)-j)]+=boom[:len(clip)-j]*.65
            elif kind=='guard':
                clip=metallic(.24,.25)+impact(.24,.28)
            elif kind in ['victory','defeat','start']:
                dur=2.2 if kind=='victory' else 1.55
                clip=np.zeros(int(FS*dur),dtype=np.float32)
                notes=(['D3','F3','A3','D4'] if kind=='victory' else
                       ['D3','Bb2','A2','D2'] if kind=='defeat' else ['D3','A3','D4'])
                for idx,n in enumerate(notes):
                    at=.26*idx
                    sig=chord(PITCH[n],dur-at-.08,'horn')
                    pos=int(at*FS);clip[pos:pos+len(sig)]+=sig*.46
                clip=verb(clip,.29)
                clip[:min(len(clip),len(W))]+=W[:min(len(clip),len(W))]*.28
            else:clip=impact(.35,.5)
            if kind not in ['start','victory','defeat']:
                clip=verb(clip,.12)
            if v%2:clip*=.91
            write_wav(kind+'_'+str(v+1),clip)
            sfx.setdefault(kind,[]).append(kind+'_'+str(v+1)+'.wav')
    # Base crowd rumble: heavily smoothed distant stadium-like mass.
    t=np.arange(N)/FS
    rumble=lp(RNG.standard_normal(N).astype(np.float32),340)
    air=lp(RNG.standard_normal(N).astype(np.float32),1800)
    swell=.85+.15*np.sin(2*PI*t/LENGTH*5)
    ambience=np.stack([rumble*.13*swell+air*.045,
                        np.roll(rumble,int(.11*FS))*.13*swell+np.roll(air,int(.03*FS))*.045])
    write_mp3('rome_crowd',ambience)
    import json
    with open(os.path.join(OUT,'manifest.json'),'w') as fp:
        json.dump({'version':1,'title':'METAL OF ROME - original procedural prototype',
                   'bpm':BPM,'bars':BARS,'durationSeconds':round(LENGTH,4),
                   'stems':['rome_bed.mp3','rome_drums.mp3','rome_guitars.mp3','rome_epic.mp3'],
                   'crowd':'rome_crowd.mp3','sfx':sfx,
                   'note':'Self-generated DSP proof-of-concept, not recorded AAA final masters.'},fp,indent=2)
    print("GENERATED",len(sfx),"SFX families",sum(len(v) for v in sfx.values()),"WAV",flush=True)
