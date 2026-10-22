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
 assert.deepEqual(errors,[],'no runtime errors in the actual combat pipeline');
 console.log('ARENA_COMBAT_PACING_V3_PASS '+JSON.stringify(sample));
}finally{await browser.close();}
