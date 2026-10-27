/* Run: node --test tests/market-all-human-looks.test.cjs
 * No browser or paid network services needed. Market stock is deterministic
 * under the supplied RNG. Visual quality and live hosting require separate QA.
 */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
global.Image=class Image{set src(url){this.url=url;}};
const {MARKET_LOOKS,PAGE_SIZE,PAGE_COUNT,makeStock,isRomanFullName}=require('../public/market-scene.js');
const allIds=MARKET_LOOKS.map(x=>x.visualId);
const pricing=require('../public/market-pricing.js');
const humanClasses=['murmillo','thraex','retiarius'];

test('every non-beast appearance has a unique, visible market page slot',()=>{
 assert.equal(MARKET_LOOKS.length,27);
 assert.equal(PAGE_SIZE,3);
 assert.equal(PAGE_COUNT,9);
 assert.equal(new Set(allIds).size,27);
 assert.ok(MARKET_LOOKS.every(x=>humanClasses.includes(x.cls)));
 assert.ok(!allIds.some(id=>/beast_|npc_|wolf|lion|tiger|leopard|elephant/.test(id)));
 assert.equal(MARKET_LOOKS.filter(x=>!x.special).length,20);
 assert.equal(MARKET_LOOKS.filter(x=>x.special).length,7);
 for(const id of [
  'murmillo_redcrest_new_v1','murmillo_redcrest_alt_v1','murmillo_champion_red',
  'murmillo_motion_v3','legacy_murmillo','legacy_thraex','legacy_retiarius'
 ])assert.ok(allIds.includes(id),id);
});

test('generated market always includes all looks with distinct art identities',()=>{
 for(const value of [0.01,0.42,0.98]){
  const offers=makeStock({roster:[],marketSeed:3},()=>value);
  assert.equal(offers.length,27);
  assert.equal(new Set(offers.map(o=>o.visualId)).size,27);
  for(let i=0;i<offers.length;i++){
   assert.equal(offers[i].id,MARKET_LOOKS[i].cls);
   assert.equal(offers[i].visualId,MARKET_LOOKS[i].visualId);
   assert.equal(offers[i].appearance,MARKET_LOOKS[i].appearance);
   assert.equal(typeof offers[i].cost,'number');
   assert.ok(offers[i].cost>0);
  }
 }
});

test('old unsold candidates preserve names/stats and use the balanced tier price on migration',()=>{
 const original=makeStock({roster:[],marketSeed:4},()=>.5);
 const existing=[original[0],original[9],original[23]].map(o=>({...o,cost:12000,priceModelVersion:0}));
 const upgraded=makeStock({roster:[],marketSeed:4},()=>.3,existing);
 assert.equal(upgraded.length,27);
 for(const old of existing){
  const n=upgraded.find(x=>x.visualId===old.visualId);
  assert.equal(n?.name,old.name);
  assert.equal(n?.cost,pricing.quote(old.visualId,4).cost);
  assert.ok(n.cost<1500,'legacy overpriced saved lots must reprice');
  assert.deepEqual(n?.vals,old.vals);
 }
});

test('initial stock has nine distinct pages without sold-out or paid gating',()=>{
 const stock=makeStock({roster:[],marketSeed:0},()=>.4);
 for(let page=0;page<PAGE_COUNT;page++){
  const visible=stock.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
  assert.equal(visible.length,3);
  assert.ok(visible.every(Boolean));
 }
});

test('all 27 market candidates receive authentic Roman two-part names, even after restock',()=>{
 for(const roll of [0.01,0.42,0.98]){
  const stock=makeStock({roster:[{name:'Marcus Aurelius'}],marketSeed:5},()=>roll);
  assert.equal(stock.length,27);
  assert.equal(new Set(stock.map(o=>o.name.toLowerCase())).size,27);
  assert.ok(stock.every(o=>/^([A-Za-z]+) ([A-Za-z]+)$/.test(o.name)), 'two Latin name parts');
  assert.ok(stock.every(o=>isRomanFullName(o.name)), 'Roman praenomen and family');
  assert.ok(!stock.some(o=>o.name==='Marcus Aurelius'),'never duplicate an existing hire');
 }
});

test('saved unpurchased old Roman surnames become two-part names without changing data',()=>{
 const old=makeStock({roster:[],marketSeed:1},()=>0.3);
 const first={...old[0],name:'Manlius'};
 const second={...old[1],name:'Tullius'};
 const third={...old[2],name:'Cornelius'};
 const migrated=makeStock({roster:[{name:'Marcus Aurelius'}],marketSeed:2},()=>0.7,[first,second,third]);
 for(const [original,final] of [[first,migrated[0]],[second,migrated[1]],[third,migrated[2]]]){
  assert.equal(final.name.split(' ')[1],original.name);
  assert.equal(final.cost,pricing.quote(original.visualId,2).cost);
  assert.deepEqual(final.vals,original.vals);
  assert.equal(final.visualId,original.visualId);
 }
 assert.ok(migrated.every(o=>isRomanFullName(o.name)));
});

test('Roman candidate family names vary within each three-podium market page',()=>{
 for(const seed of [0,1,2]){
  const stock=makeStock({roster:[],marketSeed:seed},()=>.42);
  for(let page=0;page<PAGE_COUNT;page++){
   const names=stock.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
   assert.ok(new Set(names.map(x=>x.name.split(' ')[1])).size>=2, 'repeated surname on page '+page);
  }
 }
});

test('five price tiers are affordable and preserve uniqueness of all 27 looks',()=>{
 assert.deepEqual(pricing.LEVELS.map(x=>x.target),[420,580,780,1020,1350]);
 assert.equal(pricing.LOOK_IDS.length,27);
 assert.deepEqual(new Set(pricing.LOOK_IDS),new Set(allIds));
 for(const id of pricing.LOOK_IDS){
  const sale=pricing.quote(id,3);
  assert.ok(sale.cost>=390&&sale.cost<=1450,id+' must be balanced');
  assert.equal(sale.level,pricing.DEFAULTS[id]);
  assert.equal(sale.model,2);
 }
 for(const id of ['beast_wolf','beast_tiger','npc_carnifex']){
  assert.equal(pricing.isMarketLook(id),false);
  assert.equal(pricing.quote(id,0),null);
 }
});

test('price drafts apply to offers immediately while preserving purchased roster',()=>{
 const memory=new Map();
 const prev=global.localStorage;
 global.localStorage={getItem:key=>memory.get(key)??null,
  setItem:(key,value)=>memory.set(key,value),removeItem:key=>memory.delete(key)};
 try{
  const id='murmillo_redcrest_alt_v1';
  const previous=pricing.quote(id,2);
  assert.equal(pricing.write({...pricing.DEFAULTS,[id]:1}),true);
  assert.equal(pricing.read()[id],1);
  assert.equal(pricing.levelFor(id),1);
  const after=pricing.quote(id,2);
  assert.ok(after.cost<=450&&after.cost<previous.cost);
  const roster=[{name:'Marcus Aurelius',cost:9000,visualId:id,vals:[5,5,5,5]}];
  const stock=makeStock({roster,marketSeed:2},()=>0.3);
  assert.equal(stock.find(x=>x.visualId===id).cost,after.cost);
  assert.equal(roster[0].cost,9000,'existing hired fighter unaffected');
  assert.equal(roster[0].vals[0],5);
  assert.equal(pricing.write({...pricing.DEFAULTS,beast_wolf:5,npc_carnifex:5}),true);
  assert.equal(pricing.read().beast_wolf,undefined);
  assert.equal(pricing.reset(),true);
  assert.equal(pricing.levelFor(id),pricing.BASE[id]);
 }finally{
  if(prev===undefined)delete global.localStorage;else global.localStorage=prev;
 }
});

test('historical saved high-price rare candidates are rebalanced without changing their power',()=>{
 const one=makeStock({roster:[],marketSeed:5},()=>0.4);
 const old={...one[21],cost:10720,priceModelVersion:0};
 const migrated=makeStock({roster:[],marketSeed:5},()=>0.5,[old]);
 assert.deepEqual(migrated[21].vals,old.vals);
 assert.equal(migrated[21].name,old.name);
 assert.equal(migrated[21].visualId,old.visualId);
 assert.ok(migrated[21].cost<=1450);
 assert.equal(migrated[21].priceModelVersion,2);
});
