/* Combat pacing V3 regression: real attack pipeline, parry/rush drama and no unexpected one-shots. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {chromium} from 'playwright';
const model={globalThis:{}};
vm.runInNewContext(readFileSync(new URL('../public/arena-balance.js',import.meta.url),'utf8'),model);
const balance=model.globalThis.ArenaBalance;
const combatSource=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const dodgeStops=combatSource.match(/for\(const \[t,a\] of (\[\[[^\n]+?\]\])\)\{/);
const attackStops=combatSource.match(/const echoes=strong\s*\?\s*(\[\[[^\n]+\]\])\s*:\s*(\[\[[^\n]+\]\]);/);
assert.ok(dodgeStops&&attackStops,'real sprite afterimage curves must exist');
const ghostCurves={
 dodge:JSON.parse(dodgeStops[1]),
 special:JSON.parse(attackStops[1]),
 normal:JSON.parse(attackStops[2])
};
for(const [kind,stops] of Object.entries(ghostCurves)){
 assert.ok(stops.length>=5,'several physical afterimages for '+kind);
 for(let i=1;i<stops.length;i++){
  assert.ok(stops[i][0]>stops[i-1][0],'echo positions get closer to fighter '+kind);
  assert.ok(stops[i][1]>stops[i-1][1],'farther echoes must be FAINTER '+kind);
 }
 assert.ok(stops[0][1]<=.11&&stops.at(-1)[1]>=.65,
  'distant ghosts subtle while close ghosts visibly opaque '+kind);
}
assert.equal(balance.combatDamage(17),8,'more than 14 normal hits at 138 HP');
assert.equal(Math.ceil(138/balance.combatDamage(17)),18);
assert.equal(balance.combatDamage(50,'parry'),30,'timed parry keeps premium damage');
assert.equal(balance.combatDamage(50,'rush'),30,'rush keeps premium damage');
assert.ok(balance.combatDamage(50,'special')>balance.combatDamage(50));
const fx={globalThis:{}};
vm.runInNewContext(readFileSync(new URL('../public/arena-focus.js',import.meta.url),'utf8'),fx);
const focus=fx.globalThis.ArenaFocus;
assert.ok(focus.PRESETS.parry.duration>.8);
assert.equal(focus.PRESETS.parry.zoom,0,'no camera cut that hides fighters');
assert.ok(focus.PRESETS.dash.hitstop>=.16);
assert.ok(focus.PRESETS.special.hitstop>=.20);
assert.ok(focus.PRESETS.special.letterbox>=160,
  'five times bigger special scene crop');
assert.ok(focus.PRESETS.special.minRate<=.08,
  'special time practically stops on a major hit');
assert.ok(focus.PRESETS.strike.duration>=.29,
  'normal confirmed attacks have independent micro-slow');
assert.ok(focus.PRESETS.dodge.duration>=.55&&focus.PRESETS.dodge.minRate<=.3);
assert.ok(focus.PRESETS.special.zoom<.09,'specials must not crop opponents');
const camera={globalThis:{}};
vm.runInNewContext(readFileSync(new URL('../public/arena-motion.js',import.meta.url),'utf8'),camera);
assert.ok(camera.globalThis.ArenaMotion.PRESETS.parry.amp>=34);
assert.ok(camera.globalThis.ArenaMotion.PRESETS.dash.amp>=36);
assert.ok(camera.globalThis.ArenaMotion.PRESETS.special.amp>=85);
assert.ok(camera.globalThis.ArenaMotion.PRESETS.parry.amp>=55);
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:820}});
const errors=[];page.on('pageerror',error=>errors.push(String(error)));
try{
 await page.goto('http://127.0.0.1:8765/?__arena_qa=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.__arenaQA?.attack&&!!window.ArenaBalance,{timeout:22000});
 // Arcade mode is intentionally hidden by the Blood & Glory Ludus title.
 // Use the supported QA hook to enter the actual fight phase, then exercise
 // the real attack(), counter, FX and damage routines on real fighters.
 await page.evaluate(()=>{
  const state=window.__arenaQA.state;
  state.phase='fight';state.time=110;state.paused=false;
  state.autoplayEnabled=false;state.autoPlaying=false;
 });
 const sample=await page.evaluate(()=>{
  const {state:s,attack}=window.__arenaQA;
  s.paused=false;s.autoplayEnabled=false;s.autoPlaying=false;s.beastHunt=false;s.gauntlet=null;
  const p=s.player,e=s.enemy;
  function ready(){
   s.phase='fight';s.cinematic=null;s.focusFrame=null;s.cameraKick=null;s.parryBursts=[];s.sparks=[];
   p.x=455;e.x=650;p.face=1;e.face=-1;
   for(const f of [p,e])Object.assign(f,{hp:300,maxHp:300,st:100,stagger:0,
    dead:false,removedFromArena:false,dodge:0,guard:false,parry:0,
    guardHold:0,invuln:0,attackCD:0,cd:0,comboDash:null,chainHits:0,knockVX:0,knockT:0,
    attackLunge:null,specialLunge:null,specialRecoil:null});
   p.cfg={...p.cfg,atk:30,reach:300};e.cfg={...e.cfg,atk:25,reach:300};
  }
  ready();attack(p,e,false,false);
  const normal={damage:300-e.hp,phase:s.phase,
   attackerForward:p.x-455,victimKnock:e.x-650,
   trail:p.attackLunge?{...p.attackLunge}:null};
  ready();attack(p,e,false,true);
  const rush={damage:300-e.hp,focus:s.cinematic?.kind,duration:s.cinematic?.duration,
   knock:e.knockVX,shake:s.cameraKick?.amplitude,
   fx:s.sparks.map(x=>x.sequence).filter(Boolean)};
  ready();p.guard=true;p.parry=.28;attack(e,p,false,false);
  const parry={damage:300-e.hp,playerHp:p.hp,focus:s.cinematic?.kind,
   duration:s.cinematic?.duration,shake:s.cameraKick?.amplitude,
   fx:s.sparks.map(x=>x.sequence).filter(Boolean),
   flash:s.flash,playerInPlay:!p.dead,enemyInPlay:!e.dead};
  return {normal,rush,parry};
 });
 assert.ok(sample.normal.damage>0&&sample.normal.damage<=18,JSON.stringify(sample));
 assert.ok(sample.normal.attackerForward>=80&&sample.normal.attackerForward<=90,
  'every normal strike must lunge ~85px: '+JSON.stringify(sample));
 assert.ok(sample.normal.trail?.total>=.55&&sample.normal.trail?.travel>=.13,
  'normal strike leaves full-proportioned sprite echoes after motion');
 assert.ok(sample.normal.victimKnock>=80,
  'normal hit must maintain fighter spacing after forward body lunge');
 assert.equal(sample.normal.phase,'fight');
 assert.ok(sample.rush.damage>sample.normal.damage*2,JSON.stringify(sample));
 assert.equal(sample.rush.focus,'dash');assert.ok(sample.rush.duration>=1.15);
 assert.ok(Math.abs(sample.rush.knock)>=900);
 assert.ok(sample.rush.fx.includes('dash'));
 assert.equal(sample.parry.focus,'parry');assert.ok(sample.parry.duration>=.85);
 assert.equal(sample.parry.playerHp,300,'perfect parry negates incoming blow');
 assert.ok(sample.parry.damage>=sample.normal.damage,'parry must feel rewarding');
 assert.ok(sample.parry.fx.includes('parry')&&sample.parry.fx.includes('guard'));
 assert.ok(sample.parry.playerInPlay&&sample.parry.enemyInPlay);
 assert.ok(sample.parry.shake>=34);
 // Exercise the ACTUAL configured keyboard inputs, not an artificial helper.
 // Dodge displacement is immediate for fair hitboxes, while real approved
 // sprite ghosts carry the visible motion; squashed dash FX are removed.
 const enhanced=await page.evaluate(()=>{
  const {state:s}=window.__arenaQA,p=s.player,e=s.enemy;
  s.phase='fight';s.paused=false;s.fx=true;
  s.autoplayEnabled=false;s.autoPlaying=false;s.sparks=[];s.cinematic=null;
  for(const f of [p,e])Object.assign(f,{hp:300,maxHp:300,st:100,stagger:0,
   invuln:0,dodge:0,dodgeEcho:null,dead:false,guard:false,parry:0,
   attackCD:0,cd:0,chainHits:0,comboDash:null,knockVX:0,knockT:0,
   attackLunge:null,specialLunge:null,specialRecoil:null});
  p.x=550;p.face=1;e.x=815;e.face=-1;
  window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyL',bubbles:true}));
  const dodge={from:p.dodgeEcho?.fromX,to:p.x,total:p.dodgeEcho?.total,
   travel:p.dodgeEcho?.travel,cinematic:s.cinematic?.kind,
   slowSpec:window.ArenaFocus.PRESETS.dodge.minRate,
   invulnerable:p.invuln,cost:100-p.st,
   squashedFx:s.sparks.filter(v=>v.sequence==='dash').length};
  // New fighter timing: do not allow a leftover dodge visual to interfere.
  p.st=100;p.dodge=0;p.invuln=0;p.dodgeEcho=null;p.stagger=0;p.attackCD=0;p.cd=0;p.specialLunge=null;
  p.x=500;e.x=729;p.face=1;e.face=-1;
  e.hp=300;e.stagger=0;e.invuln=0;e.guard=false;
  s.sparks=[];s.cinematic=null;s.cameraKick=null;
  window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyI',bubbles:true}));
  const special={damage:300-e.hp,focus:s.cinematic?.kind,
   duration:s.cinematic?.duration,title:s.cinematic?.title,
   strikeFrames:s.sparks.filter(v=>v.sequence==='special').length,
   directional:s.sparks.some(v=>['slash','sweep','thrust'].includes(v.sequence)),
   backdrop:s.sparks.some(v=>v.layer==='back'&&v.sequence==='special'),
   knock:e.knockVX,flash:s.flash,cooldown:p.cd,
   attackerForward:p.x-500,lunge:p.specialLunge,
   recoil:e.specialRecoil?{...e.specialRecoil}:null,
   shake:s.cameraKick?.amplitude,note:s.notice};
  return {dodge,special};
 });
 assert.ok(enhanced.dodge.from-enhanced.dodge.to>=290,JSON.stringify(enhanced));
 assert.ok(enhanced.dodge.total>=.9&&enhanced.dodge.travel>=.24,JSON.stringify(enhanced));
 assert.equal(enhanced.dodge.cinematic,'dodge');
 assert.ok(enhanced.dodge.slowSpec<=.3,'dodge must visibly slow');
 assert.equal(enhanced.dodge.squashedFx,0,'no crushed dash textures during dodge');
 assert.equal(enhanced.dodge.invulnerable,.3,'existing fair dodge i-frames retained');
 assert.equal(enhanced.dodge.cost,23);
 assert.ok(enhanced.special.damage>0&&enhanced.special.cooldown>0,JSON.stringify(enhanced));
 assert.equal(enhanced.special.focus,'special',JSON.stringify(enhanced));
 assert.ok(enhanced.special.duration>=.75&&enhanced.special.strikeFrames>=2,JSON.stringify(enhanced));
 assert.ok(enhanced.special.directional&&enhanced.special.backdrop,JSON.stringify(enhanced));
 assert.ok(enhanced.special.attackerForward>=148&&enhanced.special.attackerForward<=151,
  'special must actually step ~150px forward: '+JSON.stringify(enhanced));
 assert.ok(enhanced.special.lunge?.travel>=.1,'visibly interpolated special lunge');
 assert.ok(enhanced.special.recoil?.farX-enhanced.special.recoil?.startX>=395,
  'special must launch enemy up to 400px: '+JSON.stringify(enhanced));
 assert.ok(enhanced.special.recoil?.restX-enhanced.special.recoil?.startX>=115,
  'enemy must spring back toward its original fighting range');
 assert.ok(enhanced.special.recoil?.total>=1.15,'slow outgoing/recoil travel');
 assert.ok(enhanced.special.lunge?.total>=.8,'visibly lingering special afterimages');
 assert.ok(enhanced.special.knock>=1000&&enhanced.special.flash>=.3,JSON.stringify(enhanced));
 assert.ok(enhanced.special.shake>=65,'huge camera shake on hit');
 assert.ok(enhanced.special.title,'class special title must appear during cinematic');
 // The animation must actually move the enemy across successive REAL frames:
 // first rocket outward, then rebound part-way to a playable distance.
 await page.waitForTimeout(465);
 const displaced=await page.evaluate(()=>({
   enemy:window.__arenaQA.state.enemy.x,
   recoil:window.__arenaQA.state.enemy.specialRecoil?.elapsed,
   phase:window.__arenaQA.state.phase
 }));
 assert.equal(displaced.phase,'fight','special effect cannot unexpectedly end duel');
 assert.ok(displaced.enemy-enhanced.special.recoil.startX>305,
  'enemy must visibly fly far from the striker: '+JSON.stringify({enhanced,displaced}));
 // The browser may render slower under CI (game loop caps dt to 50ms).
 // Inspect only AFTER the actual rebound is complete, not after a fixed
 // wall-clock interval that can cut the 1.18s realtime choreography short.
 await page.waitForFunction(()=>!window.__arenaQA.state.enemy.specialRecoil,
   null,{timeout:8500,polling:'raf'});
 const returned=await page.evaluate(()=>({
   enemy:window.__arenaQA.state.enemy.x,
   recoil:window.__arenaQA.state.enemy.specialRecoil
 }));
 assert.ok(returned.enemy<displaced.enemy-120,
  'enemy must visibly rebound after reaching the peak: '+JSON.stringify({displaced,returned}));
 assert.ok(Math.abs(returned.enemy-enhanced.special.recoil.restX)<70,
  'settle near recoverable combat distance: '+JSON.stringify({displaced,returned}));
 // Real VENATIO target: a beast opponent uses identical attack path
 // (fighter lunges, beast flies back) instead of isolated arcade-only FX.
 const beast=await page.evaluate(()=>{
   const {state:s,attack}=window.__arenaQA,p=s.player,e=s.enemy;
   s.phase='fight';s.paused=false;s.fx=true;s.autoplayEnabled=false;s.autoPlaying=false;
   s.cinematic=null;s.focusFrame=null;s.sparks=[];
   const restore={beastType:e.beastType,cfg:e.cfg,enemy:e.enemy};
   Object.assign(p,{x:470,face:1,attackCD:0,stagger:0,st:100,cd:0,
     hp:300,maxHp:300,dead:false,attackLunge:null,specialLunge:null,chainHits:0});
   Object.assign(e,{x:720,face:-1,attackCD:0,stagger:0,st:100,
     hp:300,maxHp:300,dead:false,invuln:0,dodge:0,
     parry:0,guard:false,specialRecoil:null,beastType:'wolf'});
   attack(p,e,false);
   const normal={step:p.x-470,beastPush:e.x-720,ghost:p.attackLunge?.total};
   p.x=470;p.attackCD=0;p.st=100;p.cd=0;p.chainHits=0;p.stagger=0;
   p.attackLunge=null;p.specialLunge=null;
   e.x=720;e.hp=300;e.stagger=0;e.attackCD=0;e.specialRecoil=null;
   attack(p,e,true);
   const special={step:p.x-470,beastLaunched:e.x-720,
    beastRecoil:e.specialRecoil?{...e.specialRecoil}:null,
    fighterGhost:p.specialLunge?.total,
    cinematic:s.cinematic?.kind};
   Object.assign(e,restore);return {normal,special};
 });
 assert.ok(beast.normal.step>=80&&beast.normal.beastPush>=75&&beast.normal.ghost>=.55,
  'VENATIO normal attacks must share 85px entry: '+JSON.stringify(beast));
 assert.ok(beast.special.step>=145&&beast.special.beastLaunched>=150,
  'VENATIO special attacks must share 150px lunge and heavy beast knock: '+JSON.stringify(beast));
 assert.ok(beast.special.beastRecoil?.farX-beast.special.beastRecoil?.startX>=395,
  'beast must be thrown 400px when arena space permits: '+JSON.stringify(beast));
 assert.ok(beast.special.fighterGhost>=.8&&beast.special.cinematic==='special');
 // Real KO transition: a fighter may still have an active afterimage,
 // a fourth-hit combo dash and cinematic when the final lethal strike lands.
 // All those MUST be removed before the victory pose is painted.
 const winCleanup=await page.evaluate(()=>{
  const {state:s,attack,render}=window.__arenaQA,p=s.player,e=s.enemy;
  s.phase='fight';s.paused=false;s.fx=true;s.gauntlet=null;s.careerMatch=false;
  s.autoplayEnabled=false;s.autoPlaying=false;s.cinematic=null;s.focusFrame=null;
  p.x=480;p.face=1;p.hp=300;p.maxHp=300;p.st=100;p.cd=0;
  p.attackCD=0;p.stagger=0;p.chainHits=0;p.comboDash=null;
  p.attackLunge={fromX:380,toX:480,t:.5,total:.5,travel:.15};
  p.dodgeEcho={fromX:500,toX:480,t:.6,total:.6,travel:.2};
  p.specialLunge={fromX:390,toX:480,t:.7,total:.7,travel:.2};
  e.x=700;e.face=-1;e.hp=4;e.maxHp=300;e.stagger=0;
  e.guard=false;e.parry=0;e.dodge=0;e.invuln=0;e.dead=false;
  e.comboDash={t:.25,victim:p,dir:-1,hit:false};
  e.specialRecoil={startX:680,initialX:700,farX:900,restX:735,elapsed:.1,total:1.18};
  attack(p,e,false);
  const result={phase:s.phase,pEcho:p.dodgeEcho,pAttack:p.attackLunge,
   pSpecial:p.specialLunge,pDash:p.comboDash,eDash:e.comboDash,
   eRecoil:e.specialRecoil,focus:s.cinematic,frame:s.focusFrame,
   lingering:s.sparks.filter(v=>['dash','slash','sweep','thrust','special','hit'].includes(v.sequence)).length};
  render();return result;
 });
 assert.equal(winCleanup.phase,'finisher','the real attack should terminate the fight');
 for(const key of ['pEcho','pAttack','pSpecial','pDash','eDash','eRecoil','focus','frame'])
  assert.equal(winCleanup[key],null,'NO lingering ghosts in the victory pose: '+key);
 assert.equal(winCleanup.lingering,0,'only the approved victory/finisher art may remain');
 assert.deepEqual(errors,[],'no runtime errors in the actual combat pipeline');
 console.log('ARENA_COMBAT_DRAMA_V7_PASS '+JSON.stringify({
  sample,enhanced,displaced,returned,beast,ghostCurves,winCleanup
 }));
}finally{await browser.close();}
