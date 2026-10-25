// Matchmaking and paced 5vs5 battle regressions: node tests/arena-coop-match.js
'use strict';
const assert=require('node:assert/strict');
const Match=require('../public/arena-coop-match'),Core=require('../public/arena-coop-core');
const roles=['murmillo','retiarius','thraex','murmillo','thraex'];
const team=(level=1,injury=0,spread=0,fatigue=0)=>roles.map((cls,i)=>({
 index:i,name:'Hero '+i,cls,level:Math.round(Math.max(1,level*8)),
 injury,fatigue,combat:{
  hp:(cls==='murmillo'?220:180)*level*(1+(i-2)*spread/2),
  atk:(cls==='retiarius'?22:24)*level*(1+(i-2)*spread/2),
  move:260+level*12,armor:cls==='murmillo'?.2:.1,parry:.23}
}));
assert.deepEqual(Match.build([]),[],'incomplete squad never advertises a match');
assert.deepEqual(Match.build(team().slice(1)),[],'four fighters cannot start a 5v5 match');
const normal=team(),injured=team(1,50,0,30),elite=team(3,12,.4),mixed=team(1,15,.55);
const frozen=JSON.stringify(normal),base=Match.build(normal);
assert.equal(base.length,5);assert.equal(JSON.stringify(normal),frozen,'match generation must not change equipment/HP/roster');
assert.deepEqual(base,Match.build(normal),'same lineup creates stable visual preview and battle enemies');
assert(base.every((u,i)=>u.cls===roles[i]&&u.combat.hp>0&&u.combat.atk>=4&&u.look));
const summary=Match.summary(normal,base);
assert.equal(summary.allies,5);assert.equal(summary.enemies,5);
assert(Match.summary(elite,Match.build(elite)).enemyAttack>summary.enemyAttack*2.5,
 'well-trained 5-person team faces significantly stronger opponents');
assert(Match.summary(elite,Match.build(elite)).enemyHp>summary.enemyHp*2.5,
 'enemy endurance scales to selected five');
const injuryRivals=Match.build(injured);
assert(injuryRivals.reduce((n,u)=>n+u.combat.atk,0)<base.reduce((n,u)=>n+u.combat.atk,0),
 'injured/exhausted team receives weaker opposing offense');
assert(injuryRivals.every(u=>u.combat.hp>=40),'rivals remain real fighters, never instant KOs');
assert(Core.create(normal,base).units.every(u=>u.maxHp>=Math.round(1.49*(u.combat.hp||0))),
 '5vs5 endurance is temporary and equally provided to both teams');
const factions=[['healthy',normal],['injured',injured],['mixed',mixed],['elite',elite]];
for(const [tag,allies] of factions){
 let minutes=0,wins=0,fast=0,formations=0,flanks=0,rallies=0,ended=0,mid=[];
 const enemies=Match.build(allies);
 for(let seed=1;seed<=55;seed++){
  const sim=Core.create(allies,enemies,{seed}),active=seed%2===0;let ticks=0;
  while(!sim.result&&ticks++<3650){
   if(active){
    if(sim.time>=1&&sim.time>=sim.formationReady&&Core.command(sim,'formation'))formations++;
    if(sim.time>=3&&sim.time>=sim.flankReady&&Core.command(sim,'flank'))flanks++;
    if(sim.meter>=60&&Core.command(sim,'rally'))rallies++;
    if(sim.time>=5&&sim.time>=sim.focusReady){
     const e=Core.alive(sim,'enemy').sort((x,y)=>x.hp-y.hp)[0];
     if(e)Core.command(sim,'focus',e.id);
    }
    if(sim.time>=7&&sim.time>=sim.coverReady){
     const u=Core.alive(sim,'ally').sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0];
     if(u)Core.command(sim,'cover',u.id);
    }
   }
   Core.step(sim,.05);
   for(let i=0;i<sim.units.length;i++)for(let j=i+1;j<sim.units.length;j++){
    const a=sim.units[i],b=sim.units[j];
    if(!a.dead&&!b.dead)assert(Core.footDistance(a,b)>=101.9,'alive collision retained');
   }
  }
  assert(sim.result,'match must finish before timeout');
  const t=sim.time;mid.push(t);minutes+=t;wins+=sim.result.win?1:0;fast+=t<30?1:0;ended++;
 }
 mid.sort((a,b)=>a-b);
 assert(mid[Math.floor(ended/2)]>=42,tag+' should offer time for repeated tactics');
 assert(fast<=3,tag+' should almost never end in under 30s');
 assert(mid[Math.floor(ended/2)]<105,tag+' should not become a stalled slugfest');
 assert(formations>=45&&flanks>=45,tag+' active matches should support multiple formations and flanks');
 console.log('MATCH '+tag+': '+ended+' seeded matches, median '+mid[Math.floor(ended/2)].toFixed(1)+'s, wins '+wins+'/'+ended+
  ', formation '+formations+', flank '+flanks+', rally '+rallies+', under-30s '+fast);
}
// Actual Lv.50 archetypes can output huge specialty hits. They too need
// multiple command opportunities, without modifying player stats.
const Balance=require('../public/arena-balance');
const lvl50=roles.map((cls,i)=>{
 const h={index:i,cls,name:'Legend '+i,level:50,
  stats:{str:i===0?8:4,agi:i===1?8:4,end:i===2?8:4,focus:i===3?8:4},
  birthStats:{str:i===0?8:3,agi:i===1?8:3,end:i===2?8:3,focus:i===3?8:3},
  aptitudes:{str:i===0?1.5:.8,agi:i===1?1.5:.8,end:i===2?1.5:.8,focus:i===3?1.5:.8}};
 return {...h,combat:Balance.heroStats(h,{atk:18,hp:140,move:220,sp:45})};
});
const lv50Rivals=Match.build(lvl50);
assert(lv50Rivals.every(u=>u.level===50),'rivals show Lv.50 instead of Lv.20');
const durations=[];
for(let seed=1;seed<=35;seed++){
 const s=Core.create(lvl50,lv50Rivals,{seed});let ticks=0;
 while(!s.result&&ticks++<2450){
  if(seed%2===0){
   if(s.time>=1&&s.time>=s.formationReady)Core.command(s,'formation');
   if(s.time>=3&&s.time>=s.flankReady)Core.command(s,'flank');
   if(s.meter>=60)Core.command(s,'rally');
  }
  Core.step(s,.05);
 }
 assert(s.result,'high-level round must finish');
 durations.push(s.time);
}
durations.sort((a,b)=>a-b);
assert(durations[17]>=45&&durations[17]<105,
 'even max-level tactical parties should get a meaningful 5v5 engagement');
console.log('MATCH level-50: 35 seeds, median '+durations[17].toFixed(1)+'s, tactics reusable');
console.log('PASS: real selected-stat matchmaking, injury compensation, adaptive 5v5 endurance and repeated tactics');
