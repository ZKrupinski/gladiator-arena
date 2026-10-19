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
 const manifest=await page.evaluate(()=>fetch('assets/audio/rome-v1/manifest.json?v=3-solemn').then(r=>r.json()));
 assert.equal(manifest.version,3,'must load remastered ceremony sound pack');
 assert.ok(manifest.ceremony.no_trumpet_or_flute,'remove bright pipe/trumpet from start and end');
 assert.ok(manifest.ceremony.no_upbeat_fanfare,'no short trumpet runs at victory/start');
 assert.ok(manifest.ceremony.no_pitched_bell_hits,'dry recorded collision effects retained');
 assert.ok(manifest.production.includes('no instrument oscillator'),'no keys or synthesized brass allowed');
 assert.equal(manifest.license,'CC0');
 assert.equal(await page.evaluate(()=>window.ArenaAudio.version),'3.0.0');
 await page.waitForFunction(()=>!!window.ArenaAudio,{timeout:18000});
 await page.locator('#startBtn').click();
 await page.waitForFunction(()=>window.ArenaAudio?.status()?.ready===true,{timeout:90000});
 await page.waitForFunction(()=>window.ArenaAudio?.status()?.started===true,{timeout:20000});
 const state=await page.evaluate(()=>{
  const a=window.ArenaAudio;
  const before=a.status(),parryPlayed=a.play('parry');
  a.update({phase:'fight',paused:false,combo:3,health:.24,boss:true});
  const triggered=['hit','heavy_hit','dash','block'].map(k=>a.play(k));
  return {before,parryPlayed,triggered,after:a.status()};
 });
 assert.equal(state.before.bpm,172);
 assert.ok(state.after.mix[1]>=.36,'battle drums rise when fight starts');
 assert.ok(state.after.mix[2]>=.31,'metal guitars rise with combos');
 assert.ok(state.after.mix[3]>=.33,'war horns and choir rise in danger');
 assert.equal(state.before.stems,5,'four sample-locked music stems and crowd ambience');
 assert.ok(state.before.loaded>=30,'music and multiple Foley WAVs decoded');
 assert.ok(state.parryPlayed,'actual parry WAV must play');
 assert.ok(state.triggered.every(Boolean),'other sounds sample-backed, not oscillators');
 assert.ok(state.before.playing,'audio context running under user gesture');
 assert.equal(state.before.loaded,31,'all 5 new real-instrument stems plus 26 dry Foley files decode');
 await page.locator('#soundToggle').click();
 const muted=await page.evaluate(()=>window.ArenaAudio.status());
 assert.equal(muted.enabled,false,'sound switch mutes all buses');
 await page.locator('#soundToggle').click();
 const restored=await page.evaluate(()=>window.ArenaAudio.status());
 assert.equal(restored.enabled,true);
 assert.deepEqual(errors,[],'browser no runtime JS exceptions');
 console.log('ROME_AUDIO_BROWSER_PASS '+JSON.stringify({state,muted,restored}));
}finally{await browser.close()}
