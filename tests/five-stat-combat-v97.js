/* node tests/five-stat-combat-v97.js: actual battle engines, isolated saves/RNG. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const P=require('../public/arena-progression'),B=require('../public/arena-balance');
const C=require('../public/arena-coop-core'),M=require('../public/arena-coop-match');
const base={hp:138,atk:17,move:244,sp:42};
const hero=(key,n=5)=>({cls:'murmillo',level:1,stats:{str:0,def:0,end:0,agi:0,focus:0,...(key?{[key]:n}:{})}});
const stats=(key,n)=>B.heroStats(hero(key,n),base);
const zero=stats(),str=stats('str'),def=stats('def'),end=stats('end'),agi=stats('agi'),focus=stats('focus');
assert(str.atk>zero.atk*1.5);assert(end.hp>zero.hp*1.5);
assert((1-def.armor)/(1-zero.armor)<.90,'DEF +5 cuts actual incoming damage by over 10%');
assert(def.guardEfficiency>0&&def.hp===zero.hp);
assert(agi.recovery<.90&&agi.dodgeChance>zero.dodgeChance&&agi.staminaRegen>zero.staminaRegen);
assert(agi.dodgeCost<zero.dodgeCost&&agi.dodgeWindow>zero.dodgeWindow);
assert(focus.sp>zero.sp*1.5&&focus.specialCooldown<zero.specialCooldown&&focus.parryWindow>0);
const legacy={...hero(),level:50,birthStats:{end:8},aptitudes:{end:1.4}},keep=JSON.stringify(legacy);
assert.equal(P.growth(legacy,'def'),P.growth(legacy,'end'),'legacy defense identity preserved');
const independent={...legacy,birthStats:{def:2,end:8},aptitudes:{def:.7,end:1.4}};
assert(P.growth(independent,'end')>P.growth(independent,'def')*2);
B.heroStats(legacy,base);assert.equal(JSON.stringify(legacy),keep,'reads never mutate saves');
const marketContext={Image:class{},module:{exports:{}},console};vm.createContext(marketContext);
vm.runInContext(fs.readFileSync('public/market-scene.js','utf8'),marketContext);
const stock=marketContext.module.exports;
let independentBirths=0;
for(let seed=1;seed<=100;seed++)for(const offer of stock.makeStock({marketSeed:seed,roster:[]})){
 assert(offer.defense>=1&&offer.defense<=9);assert(offer.aptitudes.def>=.6&&offer.aptitudes.def<=1.6);
 independentBirths+=offer.defense!==offer.vals[2];
}
assert(independentBirths>30,'new DEF is not merely copied from END');
// Load the exact practice engine, exposing private functions only in this test VM.
let roster=[hero()],time=0;
const ctx={console,Math:Object.assign(Object.create(Math),{random:()=>.99}),ArenaBalance:B,
 LudusBridge:{state:()=>({roster}),combatStats:i=>B.heroStats(roster[i],base)},module:{exports:{}}};
vm.createContext(ctx);
let source=fs.readFileSync('public/ludus-practice.js','utf8');
source=source.replace('root.LudusPractice={open,close',`sparks=()=>{};emitVfx=()=>{};playCombatSound=()=>{};beginRemoval=()=>{};
root.testPractice={heroFor,prepareStrike,contact,deal,setBattle:t=>{battle={clock:t,wave:1,kills:0};}};
root.LudusPractice={open,close`);
vm.runInContext(source,ctx);const T=ctx.testPractice;
function unit(key){roster=[hero(key)];return T.heroFor(0,0);}
function target(){return {side:'enemy',seat:0,x:T.heroFor(0,0).x+100,y:676,hp:5000,maxHp:5000,armor:.1,guard:0,parry:0,dodge:0,guardCD:99,stun:0};}
T.setBattle(10);let u=unit(),t=target();u.swings=3;T.prepareStrike(u,t);
assert(u.special);const ready=u.specialReady,cooldown=u.cooldown;T.contact(u,t);const damage=5000-t.hp;
u=unit('focus');t=target();u.swings=3;T.prepareStrike(u,t);assert(u.specialReady<ready);T.contact(u,t);assert(5000-t.hp>damage*1.4,'practice FOCUS consumes special power');
u=unit('agi');t=target();u.swings=3;T.prepareStrike(u,t);assert(u.cooldown<cooldown*.91,'AGI reduces real practice recovery');
roster=[{...hero(),level:50,birthStats:{agi:9},aptitudes:{agi:1.5}}];assert(T.heroFor(0,0).speed>unit().speed*1.5,'practice consumes innate agility');
function team(key){return Array.from({length:5},(_,i)=>({...hero(key),index:i,name:'F'+i,combat:stats(key)}));}
const early=C.create(team(),team(),{seed:2});
const agile=C.create(team('agi'),team(),{seed:2});assert(agile.units[0].recovery<early.units[0].recovery);
const high=team();high[0].combat={...stats('agi',40),move:600};assert(C.create(high,team()).units[0].speed>160,'no old early speed ceiling');
const rivals=M.build(team()),strongRivals=M.build(team('str'));
const relativeHero=str.atk/zero.atk,relativeRival=strongRivals[0].combat.atk/rivals[0].combat.atk;
assert(relativeRival<relativeHero,'match scaling leaves training advantage');
const match0=B.makeMatch(1,[hero()]),match1=B.makeMatch(1,[hero('str')]);
assert(match1.atk/match0.atk<relativeHero,'regular match scaling also leaves training advantage');
// Execute the real duel dodge/guard handlers with rendering-only dependencies stubbed.
const html=fs.readFileSync('public/index.html','utf8');
const dodgeCode=html.slice(html.indexOf('function dodge(f){'),html.indexOf('// One short manual input reservation:'));
const guardCode=html.slice(html.indexOf('function beginGuard(f,'),html.indexOf('function autoPilotPlayer('));
const duel={window:{},S:{phase:'fight',player:null,enemy:{x:950}},clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),
 PARRY_WINDOW:.2,PARRY_GUARD_HOLD:.4,crowdEvent:()=>{},setAction:()=>{},triggerCinematic:()=>{}};
vm.createContext(duel);vm.runInContext(dodgeCode+'\n'+guardCode,duel);
function manual(stat){return {x:335,face:1,st:100,stagger:0,dodge:0,guard:false,guardHold:0,...stat,statParryWindow:stat.parryWindow};}
let normal=manual(zero),nimble=manual(agi);duel.dodge(normal);duel.dodge(nimble);
assert(nimble.st>normal.st&&nimble.dodge<normal.dodge&&nimble.invuln>normal.invuln,'actual duel dodge cost, recovery and i-frames');
normal=manual(zero);let skilled=manual(focus);duel.beginGuard(normal);duel.beginGuard(skilled);
assert(skilled.parry>normal.parry,'actual duel parry window');
for(const level of [1,25,50]){
 const squad=['str','agi','def','end','focus'].map((key,i)=>{
  const h={index:i,name:key,cls:['murmillo','retiarius','thraex'][i%3],level,
   stats:Object.fromEntries(['str','agi','def','end','focus'].map(k=>[k,k===key?8:4])),
   birthStats:Object.fromEntries(['str','agi','def','end','focus'].map(k=>[k,k===key?8:3])),
   aptitudes:Object.fromEntries(['str','agi','def','end','focus'].map(k=>[k,k===key?1.5:.8]))};
  return {...h,combat:B.heroStats(h,base)};
 });
 const durations=[];let victories=0;
 for(let seed=1;seed<=30;seed++){
  const s=C.create(squad,M.build(squad),{seed});while(!s.result)C.step(s,.05);
  durations.push(s.time);victories+=+s.result.win;
 }
 durations.sort((a,b)=>a-b);assert(durations[15]>=35&&durations[15]<110,'multiple tactics remain possible at level '+level);
 console.log('LV'+level,JSON.stringify({wins:victories,trials:30,medianSeconds:+durations[15].toFixed(1)}));
}
const outcomes={};
for(const key of [null,'str','def','end','agi','focus']){
 let wins=0,seconds=0;
 for(let seed=1;seed<=100;seed++){
  const s=C.create(team(key),team(),{seed});while(!s.result)C.step(s,.05);
  wins+=+s.result.win;seconds+=s.time;
  assert(s.units.every(u=>Number.isFinite(u.hp)&&u.hp>=0));
 }
 outcomes[key||'baseline']={wins,averageSeconds:+(seconds/100).toFixed(1)};
}
for(const key of ['str','def','end','agi','focus'])assert(outcomes[key].wins>=outcomes.baseline.wins+15,key+' should materially improve fixed-opponent outcomes');
console.log('PASS: five actual stat effects, old-save compatibility, independent DEF identity, real practice special timing/damage, innate AGI, paced matching and 600 seeded coop bouts.');
console.log(JSON.stringify(outcomes));
