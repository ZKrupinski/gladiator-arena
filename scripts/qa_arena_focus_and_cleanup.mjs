// Dedicated regression checks for cinematics and corpse retirement.
// Run: node scripts/qa_arena_focus_and_cleanup.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root={};
const focus=fs.readFileSync(new URL('../public/arena-focus.js',import.meta.url),'utf8');
vm.runInNewContext(focus,{globalThis:root});
const F=root.ArenaFocus;
assert.equal(F.version,'2.0.0');
for(const name of ['dash','parry']){
 const s=F.start(name,575);
 assert.equal(s.kind,name);
 let min=1,boost=0,nonzero=false,elapsed=0;
 for(let i=0;i<85;i++){
  const out=F.advance(s,.02);
  assert.ok(out.gameDt>=0&&out.gameDt<=.02+1e-10);
  assert.ok(out.timeScale>=.03&&out.timeScale<=1);
  if(out.active){boost=Math.max(boost,out.zoom);nonzero ||= out.shade>0;}
  min=Math.min(min,out.timeScale);elapsed+=out.gameDt;
 }
 assert.ok(min<=F.PRESETS[name].minRate,name+' slows');
 assert.ok(boost>.1,name+' punches camera');
 assert.ok(nonzero,name+' applies focused vignette');
 assert.ok(elapsed>.1,'time must eventually advance');
 assert.equal(F.advance(s,.02).active,false,'cinematic must end');
 assert.equal(F.advance(s,.02).timeScale,1,'world resumes 100% speed');
 assert.ok(F.PRESETS[name].duration>=.95,'strong focus lasts near a second');
 assert.ok(F.PRESETS[name].hitstop>=.12,'impact pose pauses visibly');
 assert.ok(F.PRESETS[name].zoom>=.30,'camera zoom is cinematic');
 assert.ok(F.PRESETS[name].vignette>=.33,'edges are focused');
 const peak=F.advance(F.start(name,575),.12);
 assert.ok(peak.cinemaBars>12,'letterbox bars must appear');
 assert.ok(peak.bloom>.08,'premium impact bloom must appear');
 const reduced=F.advance(F.start(name,575),.04,true);
 assert.equal(reduced.timeScale,1,'reduced motion is respected');
}
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const carnifex=fs.readFileSync(new URL('../public/arena-carnifex.js',import.meta.url),'utf8');
assert.match(html,/arena-focus\.js\?v=2/,'focus v2 loaded before main game');
assert.match(html,/drawCinematicWorldAccent\(\)/,'illustrated dash and parry burst layered in real world');
assert.match(html,/PARRY PERFECTA/,'dramatic parry title visible');
assert.match(html,/IMPETUS/,'dramatic dash title visible');
assert.match(html,/triggerCinematic\('parry'/,'perfect parry triggers focus');
assert.match(html,/triggerCinematic\('dash'/,'successful dash triggers focus');
assert.match(html,/S\.cinematic=focus\.state/,'cinematic state expires');
assert.match(html,/update\(gameDt,dt\)/,'game clock slow, presentation stays realtime');
assert.match(html,/if\(!f\|\|f\.removedFromArena\)return;/,'removed actors are never repainted');
assert.match(html,/removedFighter\.removedFromArena=true/,'corpse removal persists after cleanup');
assert.match(html,/renderResultPortrait\(id,f,id==='winnerPose'\?10:11\)/,'result portrait remains visible after body removal');
assert.doesNotMatch(html,/id==='loserPose'&&S\.gauntlet&&f\.removedFromArena/,'retired body must NOT hide its historical defeat portrait');
assert.match(html,/arena-result-roman-v2\.css\?v=5/,'new ornate result styling loaded');
assert.doesNotMatch(carnifex,/brightness\(\.86\)/,'no darkening filter applied to corpses');
assert.doesNotMatch(carnifex,/saturate\(\.82\)/,'no saturation reduction on corpses');
console.log('PASS: dash/parry hitstop, follow-through, recovery, reduced motion, corpse saturation, permanent retirement.');
