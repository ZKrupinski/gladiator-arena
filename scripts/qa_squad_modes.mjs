/* Squad arena and balance integration QA. Run:
 * node scripts/qa_squad_modes.mjs
 * Tests real combat simulation without DOM, confirms five selectable modes,
 * escalating training power, unique bosses and reproducible win-rate trends.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const pub=new URL('../public/',import.meta.url);
const root={};
for(const file of ['arena-balance.js','ludus-roster.js','squad-arena.js']){
 const code=fs.readFileSync(new URL(file,pub),'utf8');
 vm.runInNewContext(code,{globalThis:root},{filename:file});
}
const {ArenaBalance:B,LudusRoster:L,SquadArena:A}=root;
assert.ok(B&&L&&A);
assert.deepEqual(Object.keys(B.MODES),['1v1','1v2','1v3','2v2','3v3']);
const hero=(i,stats)=>({name:'GLADIATOR '+(i+1),
 cls:['murmillo','thraex','retiarius'][i%3],level:5,injury:0,
 stats:{str:stats,agi:stats,end:stats,focus:stats}});
const opponent={round:4,cls:'murmillo',level:5,stage:2,boss:false,
 name:'ARENA CHALLENGER',growthType:'murmillo_a'};
function makeRandom(seed){
 let n=seed>>>0;return ()=>(n=(n*1664525+1013904223)>>>0)/4294967296;
}
function battle(mode,power,seed,boss=false){
 const config=B.MODES[mode],party=Array.from({length:config.allies},(_,i)=>hero(i,power));
 const o={...opponent,boss,round:boss?5:4,
  appearance:boss?'murmillo_champion_red':null};
 const state=A.makeBattle(mode,party,o,makeRandom(seed));
 assert.equal(state.party.length,config.allies);
 assert.equal(state.foes.length,config.enemies);
 assert.ok(state.party.every(f=>f.side==='ally')&&state.foes.every(f=>f.side==='enemy'));
 if(config.enemies>1)assert.equal(new Set(state.foes.map(f=>f.lane)).size,2,'two-depth team display');
 if(boss)assert.equal(state.foes.filter(f=>f.boss).length,1,'one unique champion');
 for(let i=0;i<4400&&state.state==='fight';i++)A.advance(state,.04);
 assert.equal(state.state,'finished');
 return state.win;
}
for(const mode of ['1v2','1v3','2v2','3v3']){
 const config=B.MODES[mode],badges=[0,3,6,10].map(stat=>{
  let wins=0;
  for(let i=1;i<=36;i++)if(battle(mode,stat,281*i+5))wins++;
  return wins;
 });
 assert.ok(badges[3]>badges[0],mode+' training must increase ability to win');
 assert.ok(badges[2]>=badges[1],mode+' experienced team win rate should not decrease');
 console.log(mode,'wins out of 36, stats 0/3/6/10:',badges.join('/'));
 battle(mode,6,73,true);
}
const weak=B.heroStats(hero(0,0),{hp:138,atk:17,sp:42,move:244});
const strong=B.heroStats(hero(0,8),{hp:138,atk:17,sp:42,move:244});
for(const field of ['atk','hp','move','sp','staminaRegen']){
 assert.ok(strong[field]>weak[field],field+' must respond to training');
}
assert.ok(B.trainingCost(hero(0,7),'str')>B.trainingCost(hero(0,1),'str'));
const base={hp:138,atk:17,sp:42,move:244};
const rival=B.duelEnemy(base,{...opponent,level:7},5);
const boss=B.duelEnemy(base,{...opponent,level:7,boss:true,
 appearance:'murmillo_champion_red'},5);
assert.ok(boss.hp>rival.hp*1.5&&boss.atk>rival.atk*1.3&&boss.armor>rival.armor);
const fifth=L.encounter({wins:4,roster:[]},{level:3},()=>.5);
assert.ok(fifth.boss&&fifth.appearance==='murmillo_champion_red');
const draft=fs.readFileSync(new URL('ludus-cards.js',pub),'utf8');
assert.match(draft,/data-battle-mode/);
assert.match(draft,/a\.squadStart\?\.\(matchMode,squadPicks\)/);
const index=fs.readFileSync(new URL('index.html',pub),'utf8');
assert.match(index,/squadStart:\(mode,indices\)=>/);
assert.match(index,/squad-arena\.js\?v=2/);
assert.match(index,/arena-balance\.js\?v=1/);
console.log('PASS: arena modes, two depth lanes, training progression, boss threat and integration.');
