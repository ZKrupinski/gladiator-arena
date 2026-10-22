/* Ludus V6 regression: discoverable gear, shared storeroom, fighter loadouts, spectator-rated loot. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const scope={};vm.createContext(scope);
for(const file of ['public/arena-gear-catalog.js','public/arena-loot.js','public/arena-excitement.js'])
 vm.runInContext(fs.readFileSync(file,'utf8'),scope,{filename:file});
const {ArenaLoot:loot,ArenaCrowd:crowd,ArenaGearCatalog:gear}=scope;
function hero(name,items=['wood'],weapon='wood',level=12){
 return {name,level,inventory:items,equipment:{weapon,shield:null,armor:null},stats:{str:0,end:0,agi:0,focus:0}};
}
const a=hero('A',['wood','iron','iron','falcata'],'iron');
const b=hero('B',['wood'],'wood');
const state={roster:[a,b],gold:3000};
loot.ensure(state);
assert.equal(loot.quantity(state,'iron'),1,'only spare iron remains in storage');
assert.equal(loot.allocated(state,'iron'),1,'one iron equipped');
assert.equal(loot.quantity(state,'falcata'),1);
assert.equal(loot.quantity(state,'wood'),1,'unused A starter wood was returned');
assert.equal(a.inventory.length,0);assert.equal(b.inventory.length,0);
assert.equal(loot.shopEnabled(state,gear.items.find(g=>g.id==='iron')),true,'legacy discovered');
assert.equal(loot.shopEnabled(state,gear.items.find(g=>g.id==='blood_oath')),false,'battle-only rarity');
const migrated=state.armoryInventory.length;loot.ensure(state);assert.equal(state.armoryInventory.length,migrated,'no double migration');
const equipmentResult=loot.equip(state,b,'iron');assert(equipmentResult.ok);
assert.equal(loot.quantity(state,'iron'),0);assert.equal(loot.allocated(state,'iron'),2);
assert.equal(loot.quantity(state,'wood'),2,'replaced starter returned to storage');
assert.equal(loot.equip(state,b,'iron').ok,true);
assert.equal(loot.quantity(state,'iron'),0,'same gear equip is a no-op');
assert.equal(loot.equip(state,a,'falcata').ok,true);
assert.equal(loot.quantity(state,'falcata'),0);
assert.equal(loot.quantity(state,'iron'),1,'replaced sword returned');
assert.equal(loot.remove(state,a,'falcata').ok,true);
assert.equal(loot.quantity(state,'falcata'),1);
assert.equal(loot.allocated(state,'falcata'),0);
const beforeSell=state.gold,remaining=loot.quantity(state,'iron');
assert.equal(loot.sell(state,'iron').ok,true);
assert.equal(state.gold,beforeSell+Math.floor(90*.42),'sale returns 42% of purchase value');
assert.equal(loot.quantity(state,'iron'),remaining-1);
assert.equal(loot.sell(state,'iron').ok,false,'cannot sell allocated-only copy');
assert.equal(loot.buy(state,'blood_oath').ok,false,'rare item cannot be bought');
assert.equal(loot.buy(state,'iron').ok,true,'discovered common can be bought');
assert.equal(loot.quantity(state,'iron'),1);
const fresh={roster:[hero('C',[],null,1)],gold:8000,armoryInventory:[],gearStorageV2:true,discoveredGear:[]};
loot.ensure(fresh);
assert.equal(loot.offer(fresh,fresh.roster[0]).length,0,'fresh armory starts empty');
assert.equal(loot.buy(fresh,'iron').ok,false,'undiscovered items cannot be bought');
assert.equal(loot.sell(fresh,'iron').ok,false);
const novice=hero('Novice',[],null,1);fresh.roster=[novice];
let low=loot.awardBattle(fresh,novice,{excitement:0},()=>0);
assert(low.length<=1,'quiet fights cap at one roll');
assert(low.every(item=>['common','uncommon'].includes(item.rarity)),'novice reward tiers capped');
assert(low.every(item=>item.level<=1),'loot meets gladiator level');
if(low.length)assert.equal(loot.shopEnabled(fresh,gear.items.find(g=>g.id===low[0].id)),true,'first drop unlocks shop');
const champion=hero('Champion',[],null,20);const excited={roster:[champion],gold:4000,armoryInventory:[],gearStorageV2:true,discoveredGear:[]};
loot.ensure(excited);
const high=loot.awardBattle(excited,champion,{excitement:100,boss:true},()=>0);
assert(high.length>=1&&high.length<=5,'five maximum drops on spectacle');
assert.equal(high.length,5,'only winning all independent rolls awards five pieces');
const unlucky=loot.awardBattle({roster:[champion],gold:0,armoryInventory:[],gearStorageV2:true,discoveredGear:[]},champion,{excitement:100,boss:true},()=>.999);
assert.equal(unlucky.length,0,'even a 100-point spectacular battle can receive no item due to RNG');
// High heat creates opportunities, NOT a guaranteed haul. A full five-drop
// jackpot must be rare under seeded uniform rolls, even for a champion.
let seed=37521;
const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const tallies=[0,0,0,0,0,0];
for(let attempt=0;attempt<3500;attempt++){
 const h=hero('Sampler',[],null,20);
 const c={roster:[h],gold:0,armoryInventory:[],gearStorageV2:true,discoveredGear:[],lootDryStreak:0,lootRareStreak:0};
 const arr=loot.awardBattle(c,h,{excitement:100},rnd);
 tallies[arr.length]++;
}
assert.equal(tallies.reduce((p,q)=>p+q,0),3500);
assert(tallies[5]>0&&tallies[5]<90,'perfect five-drop jackpots remain below 2.6% at 100 excitement: '+tallies);
assert(tallies[0]>0&&tallies[1]>0&&tallies[2]>0,'variable outcome exists at maximum heat: '+tallies);
assert.equal(excited.armoryInventory.length,5);
assert(high.every(item=>item.level<=20));
// Every drop is checked against BOTH its fighter-level rarity cap and its
// per-equipment minimum level, even during a 100/100 crowd spectacle.
const rarityCap={1:1,2:1,3:2,6:2,7:3,12:3,13:4,18:4,19:5,20:5};
for(const [lvText,maximum] of Object.entries(rarityCap)){
 const lv=Number(lvText);
 const fighter=hero('Level '+lv,[],null,lv);
 const storage={roster:[fighter],gold:0,armoryInventory:[],gearStorageV2:true,discoveredGear:[],lootDryStreak:0,lootRareStreak:0};
 let seed=lv+34021;
 const dice=()=>{seed=(Math.imul(seed,1103515245)+12345)>>>0;return seed/4294967296;};
 for(let round=0;round<350;round++){
  const found=loot.awardBattle(storage,fighter,{excitement:100,boss:true},dice);
  for(const item of found){
   assert(loot.rank.indexOf(item.rarity)<=maximum,'Lv.'+lv+' may not get '+item.rarity);
   assert(item.level<=lv,'Lv.'+lv+' may not get equipment requiring Lv.'+item.level);
  }
 }
}
const take=crowd.create();
assert.equal(crowd.snapshot(take).score,0);
assert(crowd.record(take,'clash',10)>0);
assert.equal(crowd.record(take,'clash',10.1),0,'same frame exploit prevented');
assert(crowd.record(take,'parry',11)>crowd.record(take,'clash',11.3),'parry is an impressive moment');
for(let i=0;i<90;i++)crowd.record(take,['guard','parry','reversal','special','rush','combo','clash','finisher'][i%8],20+i*2);
assert(take.score<=100&&take.score>=58,'a lengthy varied fight eventually excites the crowd');
const short=crowd.create();
for(let i=0;i<12;i++)crowd.record(short,['clash','guard','clash','clash','guard','dodge'][i%6],10+i*.5);
assert(short.score<22,'repeated ordinary exchanges must not easily reach crowd reward thresholds');
assert.equal(crowd.grade(90).key,'legend');
assert(crowd.grade(take.score).key!=='common','long varied combat still earns visible spectator rewards');
const src=fs.readFileSync('public/index.html','utf8');
for(const pattern of ['arena-excitement.js','arena-loot.js','id="endLoot"','renderBattleRewardTray()','ArenaLoot.awardBattle','ArenaCrowd.record','S.matchLoot=loot','S.matchGold='])assert(src.includes(pattern),'source integration: '+pattern);
assert(!src.includes('ArenaLoot.award(CAREER'),'no leftover single-drop awarding');
const live=fs.readFileSync('public/ludus-armory-live.js','utf8');
for(const pattern of ['data-item','a.gearCount','a.gearAllocated','raBuy','raSell','a.shopUnlocked'])assert(live.includes(pattern),'armory controls: '+pattern);
console.log('PASS: shared Ludus storage, no duplicated equipment, discovery-only shop, 42% resale, level-scaled 0–5 crowd rewards and mandatory result UI');
