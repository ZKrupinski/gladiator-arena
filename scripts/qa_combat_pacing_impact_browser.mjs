/* Combat pacing V3 regression: real attack pipeline, parry/rush drama and no unexpected one-shots. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {chromium} from 'playwright';
const model={globalThis:{}};
vm.runInNewContext(readFileSync(new URL('../public/arena-balance.js',import.meta.url),'utf8'),model);
const balance=model.globalThis.ArenaBalance;
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
assert.ok(focus.PRESETS.special.hitstop>=.08);
assert.ok(focus.PRESETS.special.zoom<.09,'specials must not crop opponents');
const camera={globalThis:{}};
vm.runInNewContext(readFileSync(new URL('../public/arena-motion.js',import.meta.url),'utf8'),camera);
assert.ok(camera.globalThis.ArenaMotion.PRESETS.parry.amp>=34);
assert.ok(camera.globalThis.ArenaMotion.PRESETS.dash.amp>=36);
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
    guardHold:0,invuln:0,attackCD:0,cd:0,comboDash:null,chainHits:0,knockVX:0,knockT:0});
   p.cfg={...p.cfg,atk:30,reach:300};e.cfg={...e.cfg,atk:25,reach:300};
  }
  ready();attack(p,e,false,false);
  const normal={damage:300-e.hp,phase:s.phase};
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
 // sprite ghosts and low painted dash textures carry the visible action.
 const enhanced=await page.evaluate(()=>{
  const {state:s}=window.__arenaQA,p=s.player,e=s.enemy;
  s.phase='fight';s.paused=false;s.fx=true;
  s.autoplayEnabled=false;s.autoPlaying=false;s.sparks=[];s.cinematic=null;
  for(const f of [p,e])Object.assign(f,{hp:300,maxHp:300,st:100,stagger:0,
   invuln:0,dodge:0,dodgeEcho:null,dead:false,guard:false,parry:0,
   attackCD:0,cd:0,chainHits:0,comboDash:null,knockVX:0,knockT:0});
  p.x=550;p.face=1;e.x=815;e.face=-1;
  window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyL',bubbles:true}));
  const dodge={from:p.dodgeEcho?.fromX,to:p.x,total:p.dodgeEcho?.total,
   invulnerable:p.invuln,cost:100-p.st,frames:s.sparks.filter(v=>v.sequence==='dash'&&v.layer==='back').length};
  // New fighter timing: do not allow a leftover dodge visual to interfere.
  p.st=100;p.dodge=0;p.invuln=0;p.dodgeEcho=null;p.stagger=0;p.attackCD=0;p.cd=0;
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
   note:s.notice};
  return {dodge,special};
 });
 assert.ok(enhanced.dodge.from-enhanced.dodge.to>=105,JSON.stringify(enhanced));
 assert.ok(enhanced.dodge.total>=.53&&enhanced.dodge.frames>=2,JSON.stringify(enhanced));
 assert.equal(enhanced.dodge.invulnerable,.3,'existing fair dodge i-frames retained');
 assert.equal(enhanced.dodge.cost,23);
 assert.ok(enhanced.special.damage>0&&enhanced.special.cooldown>0,JSON.stringify(enhanced));
 assert.equal(enhanced.special.focus,'special',JSON.stringify(enhanced));
 assert.ok(enhanced.special.duration>=.75&&enhanced.special.strikeFrames>=2,JSON.stringify(enhanced));
 assert.ok(enhanced.special.directional&&enhanced.special.backdrop,JSON.stringify(enhanced));
 assert.ok(enhanced.special.knock>=200&&enhanced.special.flash>=.23,JSON.stringify(enhanced));
 assert.ok(enhanced.special.title,'class special title must appear during cinematic');
 assert.deepEqual(errors,[],'no runtime errors in the actual combat pipeline');
 console.log('ARENA_COMBAT_PACING_V4_PASS '+JSON.stringify({sample,enhanced}));
}finally{await browser.close();}
