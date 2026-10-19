// End-to-end decoded music and sampled combat sound in Chromium.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:1280,height:850}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
try{
 // Any attempt to create a pitched oscillator (old "ding" fallback) must fail.
 await page.addInitScript(()=>{
  for(const AC of [window.AudioContext,window.webkitAudioContext].filter(Boolean)){
   AC.prototype.createOscillator=function(){throw Error('SYNTH_DING_FORBIDDEN')}
  }
 });
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 const manifest=await page.evaluate(()=>fetch('assets/audio/rome-v1/manifest.json?v=5-stadium-heavy-impacts').then(r=>r.json()));
 assert.equal(manifest.version,5,'must load physical football-stadium sound pack');
 assert.ok(manifest.crowd_design.only_real_football_spectators,'replace artificial isolated voices with actual match audience');
 assert.ok(manifest.crowd_design.diffuse_stereo_stadium,'large crowd must be wide and diffuse');
 assert.ok(manifest.crowd_design.field_recordings>=1,'requires real stadium field audio');
 assert.ok(manifest.melee_design.actual_recorded_shield_impacts>=6,'heavy Foley from real impacts');
 assert.ok(manifest.melee_design.no_synthetic_tonal_clangs,'no metal bell synthesis');
 assert.ok(manifest.battle_mix.no_bright_horn_melody,'combat has zero lead-brass melody');
 assert.ok(manifest.battle_mix.sfx_priority,'sword/parry SFX outrank ambience');
 assert.equal(manifest.sfx.crowd_roar.length,2,'at least two crowd celebration variants');
 assert.ok(Array.isArray(manifest.crowd_source)&&manifest.crowd_source.length===2,
  'source must be real stadium-recorded spectators from two football matches');
 assert.ok(manifest.crowd_source.every(url=>url.includes('commons.wikimedia.org/wiki/File:')),
  'the old close-up speaker pack cannot be used');
 assert.equal(manifest.melee_design.actual_recorded_body_hits,37,
  'must include genuine physical body contact variants');
 assert.equal(manifest.melee_design.blade_collision_recordings,10,
  'must retain real steel edge Foley');
 assert.ok(manifest.ceremony.no_trumpet_or_flute,'remove bright pipe/trumpet from start and end');
 assert.ok(manifest.ceremony.no_upbeat_fanfare,'no short trumpet runs at victory/start');
 assert.ok(manifest.ceremony.no_pitched_bell_hits,'dry recorded collision effects retained');
 assert.ok(manifest.production.includes('no instrument oscillator'),'no keys or synthesized brass allowed');
 assert.equal(manifest.license,'CC0');
 // The stadium bed must be rendered as a real stereo room-scale recording.
 const crowd=await page.evaluate(async()=>{
  const r=await fetch('assets/audio/rome-v1/rome_crowd.mp3?v=5-stadium-heavy-impacts');
  if(!r.ok)throw Error('Missing recorded stadium ambience');
  const ctx=new AudioContext();
  const clip=await ctx.decodeAudioData(await r.arrayBuffer());
  const out={channels:clip.numberOfChannels,duration:clip.duration,
    samplePeak:Math.max(...Array.from(clip.getChannelData(0).filter((_,i)=>i%256===0)).slice(0,4096).map(Math.abs))};
  await ctx.close();
  return out;
 });
 assert.equal(crowd.channels,2,'football crowd must have wide left-right audience');
 assert.ok(crowd.duration>=33,'loop large enough for the synchronized arena music');
 assert.ok(crowd.samplePeak>.005,'there must be recorded distant spectators, not silence');

 const impacts=await page.evaluate(async()=>{
  const sounds=['hit_1.wav','block_1.wav','parry_1.wav','heavy_hit_1.wav','dash_hit_1.wav','finisher_1.wav'];
  const ctx=new AudioContext(),durations={};
  for(const f of sounds){
   const r=await fetch('assets/audio/rome-v1/'+f+'?v=5-stadium-heavy-impacts');
   if(!r.ok)throw Error('Missing remastered impact '+f);
   const audio=await ctx.decodeAudioData(await r.arrayBuffer());
   durations[f]=audio.duration;
  }
  await ctx.close();
  return durations;
 });
 assert.ok(impacts['hit_1.wav']>=.39,'close-miked body hits must have physical body');
 assert.ok(impacts['heavy_hit_1.wav']>=.54,'power attack must have heavy bass-drum body');
 assert.ok(impacts['parry_1.wav']>=.47,'shield clang must have short forceful mass');

 // Verify the REAL new 2-3s ceremony recordings (not cached 0.95s
 // four-note fanfares), while attack/parry audio stays on its v2 sound files.
 const ceremonies=await page.evaluate(async()=>{
  const audio=new AudioContext();
  const cues={};
  for(const key of ['start','victory','defeat']){
   const response=await fetch('assets/audio/rome-v1/'+key+'_1.wav?v=5-stadium-heavy-impacts');
   if(!response.ok)throw Error('missing solemn '+key);
   const pcm=await audio.decodeAudioData(await response.arrayBuffer());
   cues[key]=pcm.duration;
  }
  await audio.close();
  return cues;
 });
 assert.ok(ceremonies.start>=2.15,'no chirpy sub-second start trumpet');
 assert.ok(ceremonies.victory>=2.60,'grand resonant horn triumph is sustained');
 assert.ok(ceremonies.defeat>=2.15,'somber horn/tuba defeat is sustained');
 assert.equal(await page.evaluate(()=>window.ArenaAudio.version),'5.0.0');
 await page.waitForFunction(()=>!!window.ArenaAudio,{timeout:18000});
 await page.locator('#startBtn').click();
 await page.waitForFunction(()=>window.ArenaAudio?.status()?.ready===true,{timeout:90000});
 await page.waitForFunction(()=>window.ArenaAudio?.status()?.started===true,{timeout:20000});
 const state=await page.evaluate(()=>{
  const a=window.ArenaAudio;
  const before=a.status(),parryPlayed=a.play('parry');
  a.update({phase:'fight',paused:false,combo:3,health:.24,boss:true,distance:190});
  const triggered=['hit','heavy_hit','dash','block'].map(k=>a.play(k));
  return {before,parryPlayed,triggered,after:a.status()};
 });
 assert.equal(state.before.bpm,172);
 assert.ok(state.after.mix[0]>.35,'giant ceremonial drum pulse must dominate');
 assert.ok(state.after.mix[1]>=.42,'drum ensemble gains intensity on close combos');
 assert.ok(state.after.mix[2]<=.03,'no loud melody or continuous metal guitar line');
 assert.ok(state.after.mix[3]>=.20,'extra war-drum fills (not horns) enter at climax');
 assert.ok(state.after.mix[4]>=.40,'crowd grows with close fighting and danger');
 assert.equal(state.after.priority.type,'block','last guarded strike triggers duck');
 assert.ok(state.after.priority.music<=.21&&state.after.priority.crowd<=.09,
  'combat SFX force music and audience under shield and weapon action');
 assert.ok(state.after.crowdReactions>=1,'parry raises true crowd reaction');
 assert.equal(state.before.stems,5,'four sample-locked music stems and crowd ambience');
 assert.ok(state.before.loaded>=30,'music and multiple Foley WAVs decoded');
 assert.ok(state.parryPlayed,'actual parry WAV must play');
 assert.ok(state.triggered.every(Boolean),'other sounds sample-backed, not oscillators');
 assert.ok(state.before.playing,'audio context running under user gesture');
 assert.equal(state.before.loaded,33,'all five stems plus 28 dry Foley and crowd samples decode');
 await page.locator('#soundToggle').click();
 const muted=await page.evaluate(()=>window.ArenaAudio.status());
 assert.equal(muted.enabled,false,'sound switch mutes all buses');
 await page.locator('#soundToggle').click();
 const restored=await page.evaluate(()=>window.ArenaAudio.status());
 assert.equal(restored.enabled,true);
 assert.deepEqual(errors,[],'browser no runtime JS exceptions');
 console.log('ROME_AUDIO_BROWSER_PASS '+JSON.stringify({state,muted,restored}));
}finally{await browser.close()}
