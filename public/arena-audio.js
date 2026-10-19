/* GLADIATOR ARENA | METAL OF ROME v5.
 * No battle melody: real huge war drums and recorded live crowd drive the fight.
 * Independent MUSIC / CROWD / COMBAT SFX buses; true sidechain-like ducker.
 * Action sounds always win the mix. The score is not retriggered on impacts.
 * Actual playable recordings are in assets/audio/rome-v1/.
 */
(function(root){
'use strict';
const BASE='assets/audio/rome-v1/';
const ASSET_VERSION='?v=5-stadium-heavy-impacts';
const visualQA=typeof location!=='undefined'&&new URLSearchParams(location.search).has('__arena_qa');
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
 defeat:['defeat_1.wav'],start:['start_1.wav'],
 crowd_roar:['crowd_roar_1.wav','crowd_roar_2.wav']
};
// [deep rhythmic bed, responsive war drums, barely-there low guitar,
//  dramatic extra real drum fills, actual human crowd ambience].
const STATES=Object.freeze({
 title:[0,0,0,0,0],
 fight:[.38,.32,0,.07,.21],
 cleanup:[.21,.11,0,.035,.23],
 finisher:[.20,.25,0,.26,.39],
 result:[0,0,0,0,.19]
});
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
let ctx=null,master=null,musicBus=null,crowdBus=null,sfxBus=null,compressor=null;
let ready=false,loading=null,started=false,enabled=true,played=0;
let crowdBoostUntil=0,lastCrowdReaction=-100,crowdReactionCount=0;
const buffers=new Map(),voices=[],stemGains=[],stemTargets=[0,0,0,0,0];
let lastDuck={type:'none',music:.43,crowd:.48,hold:0};
function context(){
 if(ctx)return ctx;
 const AC=root.AudioContext||root.webkitAudioContext;
 if(!AC)return null;
 ctx=new AC();
 master=ctx.createGain();master.gain.value=.81;
 compressor=ctx.createDynamicsCompressor();
 compressor.threshold.value=-9;compressor.knee.value=10;
 compressor.ratio.value=2.8;compressor.attack.value=.006;compressor.release.value=.23;
 musicBus=ctx.createGain();musicBus.gain.value=.43;
 crowdBus=ctx.createGain();crowdBus.gain.value=.48;
 sfxBus=ctx.createGain();sfxBus.gain.value=1.18;
 // Stadium people never share the weapon SFX channel:
 // a shield clang cannot be buried by an audience roar.
 musicBus.connect(compressor);crowdBus.connect(compressor);
 sfxBus.connect(compressor);compressor.connect(master);master.connect(ctx.destination);
 return ctx;
}
async function preload(){
 if(visualQA)return false;
 if(loading)return loading;
 loading=(async()=>{
  const names=STEMS.concat(Object.values(SFX).flat());
  const raw=await Promise.all(names.map(async name=>{
   try{
    const r=await fetch(BASE+name+ASSET_VERSION,{cache:'force-cache'});
    if(!r.ok)throw Error(r.status+' '+name);
    return [name,await r.arrayBuffer()];
   }catch(err){console.warn('[Rome sound]',name,String(err));return [name,null]}
  }));
  const c=context();if(!c)return false;
  await Promise.all(raw.map(async([name,bytes])=>{
   if(!bytes)return;
   try{buffers.set(name,await c.decodeAudioData(bytes))}
   catch(err){console.warn('[Rome decode]',name,String(err))}
  }));
  ready=STEMS.every(name=>buffers.has(name));
  return ready;
 })().catch(err=>{console.warn('[Rome preload]',err);return false});
 return loading;
}
function beginMusic(){
 if(!ctx||started||!ready||!enabled)return;
 const now=ctx.currentTime+.055;
 STEMS.forEach((name,i)=>{
  const source=ctx.createBufferSource(),gain=ctx.createGain();
  source.buffer=buffers.get(name);
  source.loop=true;gain.gain.value=0;
  source.connect(gain).connect(i===4?crowdBus:musicBus);
  source.start(now);voices.push(source);stemGains.push(gain);
 });
 started=true;
}
function unlock(){
 if(visualQA)return false;
 const c=context();if(!c)return false;
 if(c.state==='suspended')c.resume().catch(()=>{});
 preload().then(ok=>{if(ok)beginMusic()});
 return true;
}
// Threshold-specific ducking: combat hits retain their initial crack,
// then crowd/music bloom back with a controlled decaying cinematic tail.
const DUCK=Object.freeze({
 swing:[.34,.27,.072,.23],heavy_swing:[.27,.19,.11,.29],
 dodge:[.35,.26,.055,.16],guard:[.27,.18,.11,.23],
 hit:[.20,.09,.17,.31],block:[.21,.085,.17,.32],
 heavy_hit:[.15,.066,.26,.43],dash:[.23,.14,.17,.32],
 dash_hit:[.14,.052,.24,.48],parry:[.12,.045,.30,.46],
 finisher:[.095,.035,.45,.67]
});
function duck(kind){
 if(!ctx||!musicBus||!crowdBus)return;
 const [music,crowd,hold,release]=DUCK[kind]||[.29,.18,.14,.31];
 const t=ctx.currentTime;
 lastDuck={type:kind,music,crowd,hold};
 for(const [bus,target,base] of [[musicBus,music,.43],[crowdBus,crowd,.48]]){
  bus.gain.cancelScheduledValues(t);
  bus.gain.setValueAtTime(bus.gain.value,t);
  bus.gain.linearRampToValueAtTime(target,t+.018);
  bus.gain.setTargetAtTime(base,t+hold,release);
 }
}
function crowdReact(reason='combo'){
 if(visualQA||!ctx||!enabled)return false;
 if(ctx.currentTime-lastCrowdReaction<1.8)return false;
 lastCrowdReaction=ctx.currentTime;
 crowdBoostUntil=Math.max(crowdBoostUntil,ctx.currentTime+1.95);
 const ok=play('crowd_roar',{
  gain:reason==='victory'?.37:reason==='parry'?.26:.22,
  delay:reason==='parry'?.27:reason==='victory'?.20:.30
 });
 if(ok)crowdReactionCount++;
 return ok;
}
function play(kind,opt={}){
 if(visualQA)return false;
 if(!enabled)return true;
 if(!ctx||ctx.state!=='running'){unlock();return false;}
 const options=SFX[kind];if(!options)return false;
 const available=options.filter(name=>buffers.has(name));
 if(!available.length)return false;
 const file=available[(played++)%available.length],source=ctx.createBufferSource();
 source.buffer=buffers.get(file);
 const gain=ctx.createGain();
 const audience=kind==='crowd_roar';
 gain.gain.value=clamp(opt.gain??(
  audience?.20:kind==='parry'?1.04:kind==='heavy_hit'?1.03:
  kind==='hit'?.92:.80),.02,1.25);
 if(!audience&&!['start','victory','defeat'].includes(kind))
  source.playbackRate.value=.975+Math.random()*.05;
 source.connect(gain);
 const pan=ctx.createStereoPanner?ctx.createStereoPanner():null;
 if(pan){
  pan.pan.value=clamp(opt.pan||0,-.8,.8);
  gain.connect(pan).connect(audience?crowdBus:sfxBus);
 }else gain.connect(audience?crowdBus:sfxBus);
 source.start(ctx.currentTime+.007+clamp(opt.delay||0,0,1));
 if(DUCK[kind])duck(kind);
 if(kind==='parry')crowdReact('parry');
 if(kind==='finisher'||kind==='victory')crowdReact('victory');
 return true;
}
function setMuted(muted){
 enabled=!muted;
 if(master&&ctx)master.gain.setTargetAtTime(enabled?.81:0,ctx.currentTime,.055);
 if(enabled)unlock();
}
function update(state={}){
 if(!ctx||!started)return;
 const phase=state.phase||'title';
 const targets=(STATES[phase]||STATES.title).slice();
 if(state.paused){targets.fill(0);}
 else if(phase==='fight'){
  const fury=clamp((state.combo||0)/5,0,1);
  const danger=clamp(1-(state.health??1),0,1);
  const close=clamp((520-(state.distance??550))/300,0,1);
  const climax=state.boss?.5:0;
  // More WEIGHT, not more MELODY: drums and audience respond to combat.
  targets[0]+=.055*fury+.055*close;
  targets[1]+=.11*fury+.10*close+.07*climax;
  targets[2]+=.025*climax; // guitar effectively absent in normal duels
  targets[3]+=.12*danger+.11*fury+.07*climax; // drum fills
  targets[4]+=.12*close+.10*fury+.065*danger+.055*climax;
 }
 if(phase==='fight'||phase==='finisher'){
  const burst=clamp((crowdBoostUntil-ctx.currentTime)/1.6,0,1);
  targets[4]+=burst*.13;
 }
 for(let i=0;i<stemGains.length;i++){
  targets[i]=clamp(targets[i],0,.74);
  if(Math.abs(stemTargets[i]-targets[i])>.012){
   stemTargets[i]=targets[i];
   stemGains[i].gain.setTargetAtTime(targets[i],ctx.currentTime,i===4?.48:.32);
  }
 }
}
function status(){
 return {ready,started,enabled,playing:!!ctx&&ctx.state==='running',
  stems:stemGains.length,loaded:buffers.size,variants:Object.keys(SFX).length,bpm:172,
  mix:stemTargets.slice(),master:master?.gain.value??0,
  musicBus:musicBus?.gain.value??0,crowdBus:crowdBus?.gain.value??0,
  sfxBus:sfxBus?.gain.value??0,priority:lastDuck,
  crowdReactions:crowdReactionCount};
}
root.ArenaAudio={version:'5.0.0',unlock,preload,play,update,setMuted,status,crowdReact,SFX,STEMS};
if(typeof document!=='undefined'){
 document.addEventListener('pointerdown',()=>{if(!ctx)unlock()},{once:true,passive:true});
}
})(globalThis);
