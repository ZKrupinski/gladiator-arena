// Dedicated regression checks for cinematics and corpse retirement.
// Run: node scripts/qa_arena_focus_and_cleanup.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root={};
const focus=fs.readFileSync(new URL('../public/arena-focus.js',import.meta.url),'utf8');
vm.runInNewContext(focus,{globalThis:root});
const F=root.ArenaFocus;
assert.equal(F.version,'2.4.0');
const spec=F.PRESETS.special;
assert.ok(spec.letterbox>=160,'special closes top and bottom 5x deeper');
assert.ok(spec.hitstop>=.20&&spec.minRate<=.08,'special freezes then slows hard');
assert.ok(F.PRESETS.strike.minRate<.7,'normal hits now punctuated with slow motion');
assert.ok(F.PRESETS.dodge.minRate<.2,'dodge slow motion more visible');
const huge=F.start('special',640);
F.advance(huge,.05);const bars=F.advance(huge,.05);
assert.ok(bars.cinemaBars>=145,'real rendered cinematic bars reach 5x the original 32px accent');
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
 if(name==='dash'){
  assert.ok(boost>.1,'dash punches camera');
  assert.ok(nonzero,'dash applies focused vignette');
 }else{
  assert.equal(boost,0,'perfect parry cannot zoom fighters off screen');
  assert.equal(nonzero,false,'perfect parry cannot eclipse fighters');
 }
 assert.ok(elapsed>.1,'time must eventually advance');
 assert.equal(F.advance(s,.02).active,false,'cinematic must end');
 assert.equal(F.advance(s,.02).timeScale,1,'world resumes 100% speed');
 if(name==='dash'){
  assert.ok(F.PRESETS[name].duration>=.95,'rush impact stays cinematic');
  assert.ok(F.PRESETS[name].hitstop>=.12,'rush impact briefly freezes');
  assert.ok(F.PRESETS[name].zoom>=.30,'rush camera is cinematic');
  assert.ok(F.PRESETS[name].vignette>=.33,'rush focuses the edges');
 }else{
  assert.ok(F.PRESETS[name].duration<1,'parry remains a short response, not a cutscene');
  assert.ok(F.PRESETS[name].hitstop<=.13,'parry contact pause keeps control responsive');
  assert.equal(F.PRESETS[name].zoom,0,'parry never forces close-up');
  assert.equal(F.PRESETS[name].vignette,0,'parry never dims combatants');
 }
 const peak=F.advance(F.start(name,575),.12);
 if(name==='dash'){
  assert.ok(peak.cinemaBars>12,'rush letterbox visible');
  assert.ok(peak.bloom>.08,'rush impact bloom visible');
 }else{
  assert.equal(peak.cinemaBars,0,'parry cannot letterbox fighter silhouettes');
  assert.ok(peak.bloom>0&&peak.bloom<.25,'parry contact glow is visible but restrained');
 }
 assert.equal(peak.duration,F.PRESETS[name].duration,'title fade must receive a finite duration');
 assert.ok(peak.duration-peak.elapsed>(name==='dash'?.5:.3),'active presentation still has recovery time');
 const reduced=F.advance(F.start(name,575),.04,true);
 assert.equal(reduced.timeScale,1,'reduced motion is respected');
}
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const carnifex=fs.readFileSync(new URL('../public/arena-carnifex.js',import.meta.url),'utf8');
assert.match(html,/arena-focus\.js\?v=combat-drama-v6/,'new combat focus loaded before main game');
assert.match(html,/drawCinematicWorldAccent\(\)/,'illustrated dash and parry burst layered in real world');
assert.match(html,/ArenaHerald\?\.drawCanvasCallout\?\.\(ctx,'CONTRA!'/,'defender Roman parry callout visible');
assert.match(html,/ArenaHerald\?\.drawCanvasCallout\?\.\(ctx,'FRVSTRA!'/,'attacker Roman parry callout visible');
assert.match(html,/IMPETUS/,'dramatic dash title visible');
assert.match(html,/clearCombatAfterimages\(winner,loser\)/,'KO explicitly removes lingering ghost sprite states');
assert.match(html,/clearCombatAfterimages\(p,e\)/,'timer finish also clears fighter ghosts');
assert.match(html,/if\(S.phase==='fight'&&f.comboDash&&/,'4th-hit dash ghosts never appear during a victory pose');
assert.match(html,/triggerCinematic\(reversal\?\.critical\?'reversal':'parry'/,'normal parry and low-health reversal choose distinct focus');
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
