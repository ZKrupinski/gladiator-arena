const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
global.Image=class{constructor(){this.src=''}};
const market=require('../public/market-scene.js'),balance=require('../public/arena-balance.js');
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
for(let k=1;k<=500;k++){
 const offers=market.makeStock({marketSeed:k,roster:[]},rng(k));
 assert.equal(offers.length,3);assert.equal(new Set(offers.map(h=>h.name)).size,3);
 assert(new Set(offers.map(h=>h.id)).size>=2);
 for(const h of offers){
  assert(['murmillo','retiarius','thraex'].includes(h.id));
  assert(!h.bossId&&!h.beast&&!h.appearance);
  assert(Object.values(h.aptitudes).some(x=>x>=1.3));
  assert(Object.values(h.aptitudes).some(x=>x<=.83));
  assert(h.innateSummary.includes('×'));assert(h.cost>0);
 }
}
const fast={stats:{str:1},aptitudes:{str:1.50}};
const slow={stats:{str:1},aptitudes:{str:.67}};
let f=0,s=0;for(let i=0;i<50;i++){f+=balance.trainingGain(fast,'str',2);s+=balance.trainingGain(slow,'str',2);}
assert(f>s*1.7);
assert(balance.trainingCost(fast,'str')<balance.trainingCost(slow,'str'));
assert.equal(balance.trainingGain({},'str',2),2);
assert.equal(balance.trainingGain(fast,'str',0),0);
const src=fs.readFileSync(path.join(__dirname,'../public/market-scene.js'),'utf8');
assert(src.includes("ensureInventory();selection=pick(0);mode='idle'"));
assert(!src.includes('newVisit()'));
assert(src.includes("restock.disabled=Number(state.gold)<RESTOCK_COST"));
assert(!src.includes("if(!stock.includes(null))"));
const method=src.slice(src.indexOf('function restock(){'),src.indexOf('function close(){'));
assert(method.includes('state.marketInventory=makeStock(state)'));
assert(method.includes('state.gold-=RESTOCK_COST'));
console.log('PASS: persistent market, paid 3/3 refresh, 500 procedural lots, names, eligible classes, innate growth');
