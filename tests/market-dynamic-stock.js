const assert=require('node:assert/strict');
global.Image=class{set src(v){this._src=v;}get src(){return this._src;}};
const market=require('../public/market-scene.js');
function fixed(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
const all=new Set(),offersSeen=new Set();let rares=0,slots=0,duplicated=0;
for(let visit=1;visit<=2500;visit++){
 const state={marketSeed:visit,roster:[{name:'Marcus'}],gold:3200};
 const batch=market.makeStock(state,fixed(visit*919));
 assert.equal(batch.length,3);
 assert(new Set(batch.map(x=>x.id)).size>=2,'every 3-lot market must show >1 class');
 assert.equal(new Set(batch.map(x=>x.name)).size,3,'unique market names');
 assert(!batch.some(x=>x.name==='Marcus'),'avoid an owned gladiator name');
 for(const o of batch){
  slots++;all.add(o.id);offersSeen.add(o.name);
  assert(market.types.some(x=>x.id===o.id),'known growth class');
  assert(!('bossId' in o)&&!('appearance' in o),'no boss-exclusive recruit');
  assert(!/wolf|lion|tiger|elephant|beast/.test(JSON.stringify(o)),'no beast');
  assert(o.vals.length===4&&o.vals.every(v=>v>=1&&v<=9),'bounded stats');
  if(o.quality==='rare'){rares++;assert(o.cost>=5300,'specials expensive');}
  else assert(o.cost<2100,'normal prices constrained');
 }
}
assert.deepEqual([...all].sort(),['murmillo','retiarius','thraex']);
assert(offersSeen.size>=28,'many distinct names');
assert(rares>7&&rares<85,'special chance should be about 0.6% per lot');
const stock=market.makeStock({marketSeed:1,roster:[]},fixed(1));
assert(stock.every(o=>typeof o.desc==='string'&&o.trait),'every offer gets a trait');
const two=market.newOffer(1,3,new Set(['cassius']),['murmillo','murmillo'],fixed(3));
assert.notEqual(two.id,'murmillo','fill vacancies without triple duplicate class');
console.log('PASS market: random arrival, varied classes/traits/prices, rare economics, no boss/beast, uniqueness; '+rares+'/'+slots+' rare slots');
