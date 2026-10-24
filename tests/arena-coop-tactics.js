// Run: node tests/arena-coop-tactics.js
// Deterministic stress test for tactical 5v5 combat and permanent body collision.
'use strict';
const assert=require('node:assert/strict');
const Core=require('../public/arena-coop-core');
const roster=()=>Array.from({length:5},(_,i)=>({
 index:i,name:'Unit '+i,cls:['murmillo','retiarius','thraex'][i%3],
 combat:{hp:160,atk:21,move:240,parry:.18,armor:.12}
}));
const events=new Set(),finishReasons={},wins={ally:0,enemy:0};
let elapsed=0,finished=0;
for(let seed=1;seed<=250;seed++){
 const allies=roster(),enemies=roster();
 for(let i=0;i<5;i++){
  allies[i].combat.atk*=.7+((seed+i)%7)*.10;
  enemies[i].combat.atk*=.7+((seed*3+i)%8)*.10;
  allies[i].combat.move*=.8+((seed+i)%5)*.10;
  enemies[i].combat.move*=.8+((seed*2+i)%5)*.10;
 }
 const sim=Core.create(allies,enemies,{seed});
 let tick=0,lastEvent=0;
 while(!sim.result&&tick++<2450){
  Core.step(sim,.05);
  for(const e of sim.events)if(e.id>lastEvent){events.add(e.type);lastEvent=e.id;}
  for(let i=0;i<10;i++){
   const u=sim.units[i];
   assert(Number.isFinite(u.hp)&&Number.isFinite(u.x)&&Number.isFinite(u.y));
   assert(u.hp>=0&&u.hp<=u.maxHp+.0001,'bounded HP, including retreat healing');
   assert(u.x>=85&&u.x<=1195&&u.y>=395&&u.y<=675,'valid arena boundary');
   for(let j=i+1;j<10;j++)assert(Core.footDistance(u,sim.units[j])>=101.9,
    'collision with living fighter or fallen body in seed '+seed);
  }
 }
 assert(sim.result,'every game must finish before/at 120-second limit');
 finished++;elapsed+=sim.time;finishReasons[sim.result.reason]=(finishReasons[sim.result.reason]||0)+1;
 wins[sim.result.win?'ally':'enemy']++;
}
for(const kind of ['chase','bait','ambush-call','ambush','rescue-call','rescue',
 'parry','riposte','push','assist','retreat','recover','rejoin','net','ko'])assert(events.has(kind),kind);
console.log('PASS: '+finished+' varied team fights, all dynamic tactics, no overlap through permanent corpses; mean '+(elapsed/finished).toFixed(1)+'s; '+JSON.stringify({finishReasons,wins}));
