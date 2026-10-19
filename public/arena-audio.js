/* METAL OF ROME v2 — CC0 RECORDED brass / real guitar / acoustic drums / real sword Foley.
 * Synthesized keyboard brass and pitched combat oscillator FX are removed.
 * Web Audio is only activated after a user interaction (mobile safe).
 * Missing/failed recorded audio never falls back to any pitched oscillator.
 */
(function(root){
'use strict';
const BASE='assets/audio/rome-v1/';
const ASSET_VERSION='?v=2-real';
// Visual QA uses a different browser suite that deliberately exercises slow
// motion frame timing. Keep audio decoding out of THAT suite; real audio has
// a separate end-to-end browser test with decoded WAV and MP3 verification.
const visualQA=typeof location!=='undefined'&&
 new URLSearchParams(location.search).has('__arena_qa');
const STATES={title:[0,0,0,0,0],fight:[.32,.28,.14,.10,.20],
 finisher:[.17,.13,.08,.35,.23],cleanup:[.21,.11,.03,.08,.26],
 result:[.02,.01,.01,.01,.14]};
const STEMS=['rome_bed.mp3','rome_drums.mp3','rome_guitars.mp3','rome_epic.mp3','rome_crowd.mp3'];
const SFX={
 swing:['swing_1.wav','swing_2.wav','swing_3.wav'],
 hit:['hit_1.wav','hit_2.wav','hit_3.wav'],
 block:['block_1.wav','block_2.wav'],parry:['parry_1.wav','parry_2.wav'],
 heavy_swing:['heavy_swing_1.wav','heavy_swing_2.wav'],
 heavy_hit:['heavy_hit_1.wav','heavy_hit_2.wav'],
 dash:['dash_1.wav','dash_2.wav'],dash_hit:['dash_hit_1.wav','dash_hit_2.wav'],
 dodge:['dodge_1.wav','dodge_2.wav'],guard:['guard_1.wav','guard_2.wav'],
 finisher:['finisher_1.wav'],victory:['victory_1.wav'],
 defeat:['defeat_1.wav'],start:['start_1.wav']
};
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
let ctx=null,master=null,bgmBus=null,sfxBus=null,compressor=null;
let ready=false,loading=null,enabled=true,started=false;
const buffers=new Map(),voices=[],stemGains=[],stemTargets=[0,0,0,0,0];
let startTime=0,played=0;
function context(){
 if(ctx)return ctx;
 const AC=root.AudioContext||root.webkitAudioContext;
 if(!AC)return null;
 ctx=new AC();
 master=ctx.createGain();master.gain.value=.78;
 compressor=ctx.createDynamicsCompressor();
 compressor.threshold.value=-13;compressor.knee.value=13;compressor.ratio.value=3.4;
 compressor.attack.value=.007;compressor.release.value=.22;
 bgmBus=ctx.createGain();bgmBus.gain.value=.76;
 sfxBus=ctx.createGain();sfxBus.gain.value=.82;
 bgmBus.connect(compressor);sfxBus.connect(compressor);
 compressor.connect(master);master.connect(ctx.destination);
 return ctx;
}
async function preload(){
 if(visualQA)return false;
 if(loading)return loading;
 loading=(async()=>{
  const all=STEMS.concat(Object.values(SFX).flat());
  const items=await Promise.all(all.map(async name=>{
   try{
    const res=await fetch(BASE+name+ASSET_VERSION,{cache:'force-cache'});
    if(!res.ok)throw Error(res.status+' '+name);
    return [name,await res.arrayBuffer()];
   }catch(e){console.warn('[ROME audio asset]',name,String(e));return [name,null]}
  }));
  const c=context();
  if(!c)return false;
  const decoded=await Promise.all(items.map(async ([name,data])=>{
   if(!data)return [name,null];
   try{return [name,await c.decodeAudioData(data)]}catch(e){console.warn('[ROME decode]',name,String(e));return [name,null]}
  }));
  decoded.forEach(([name,buf])=>{if(buf)buffers.set(name,buf)});
  ready=STEMS.every(name=>buffers.has(name));
  return ready;
 })().catch(err=>{console.warn('[ROME startup]',err);return false});
 return loading;
}
function beginMusic(){
 if(!ctx||started||!ready||!enabled)return;
 const now=ctx.currentTime+.07;
 STEMS.forEach((name,i)=>{
  const source=ctx.createBufferSource(),gain=ctx.createGain();
  source.buffer=buffers.get(name);source.loop=true;
  gain.gain.value=0;source.connect(gain).connect(bgmBus);
  source.start(now);voices.push(source);stemGains.push(gain);
 });
 started=true;startTime=now;
}
function unlock(){
 if(visualQA)return false;
 const c=context();
 if(!c)return false;
 if(c.state==='suspended')c.resume().catch(()=>{});
 preload().then(ok=>{if(ok)beginMusic()});
 return true;
}
function play(kind,opt={}){
 if(visualQA)return false;
 if(!enabled)return true;
 if(!ctx||ctx.state!=='running'){unlock();return false}
 const variants=SFX[kind];if(!variants)return false;
 const playable=variants.filter(n=>buffers.has(n));
 if(!playable.length)return false;
 const name=playable[(played++)%playable.length],source=ctx.createBufferSource();
 source.buffer=buffers.get(name);
 const gain=ctx.createGain();
 gain.gain.value=clamp(opt.gain??(kind==='parry'?1:kind==='hit'?.84:.74),.02,1.5);
 source.playbackRate.value=.96+Math.random()*.08;
 const pan=ctx.createStereoPanner?ctx.createStereoPanner():null;
 source.connect(gain);
 if(pan){pan.pan.value=clamp(opt.pan||0,-.8,.8);gain.connect(pan).connect(sfxBus);}
 else gain.connect(sfxBus);
 const t=ctx.currentTime+.005;source.start(t);
 if(['parry','finisher','heavy_hit','dash_hit'].includes(kind))duck(kind==='parry'?.52:.40);
 return true;
}
function duck(level=.45){
 if(!bgmBus||!ctx)return;
 const t=ctx.currentTime;
 bgmBus.gain.cancelScheduledValues(t);
 bgmBus.gain.setValueAtTime(bgmBus.gain.value,t);
 bgmBus.gain.linearRampToValueAtTime(level,t+.023);
 bgmBus.gain.setTargetAtTime(.76,t+.14,.27);
}
function setMuted(muted){
 enabled=!muted;
 if(master&&ctx)master.gain.setTargetAtTime(enabled?.78:0,ctx.currentTime,.055);
 if(enabled)unlock();
}
function update(state={}){
 if(!ctx||!started)return;
 const phase=state.phase||'title';
 const goals=(STATES[phase]||STATES.title).slice();
 if(phase==='fight'&&!state.paused){
  const danger=clamp(1-(state.health??1),0,1);
  const fury=clamp((state.combo||0)/5,0,1);
  goals[1]+=.085;goals[2]+=.17+fury*.09;
  goals[3]+=(state.boss?.18:0)+danger*.13+fury*.085;
 }else if(state.paused){goals.fill(0)}
 for(let i=0;i<stemGains.length;i++){
  if(Math.abs(stemTargets[i]-goals[i])>.012){
   const t=ctx.currentTime;
   stemTargets[i]=goals[i];stemGains[i].gain.setTargetAtTime(goals[i],t,.35);
  }
 }
}
function status(){return {ready,started,enabled,playing:!!ctx&&ctx.state==='running',stems:stemGains.length,
  loaded:buffers.size,variants:Object.keys(SFX).length,bpm:172,
  mix:stemTargets.slice(),master:master?.gain.value??0}}
root.ArenaAudio={version:'2.0.0',unlock,preload,play,update,setMuted,status,SFX,STEMS};
if(typeof document!=='undefined'){
 document.addEventListener('pointerdown',()=>{if(!ctx)unlock()},{once:true,passive:true});
 // Download assets before user presses start; decoding occurs after unlock.
}
})(globalThis);
