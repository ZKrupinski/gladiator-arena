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

test('old unsold candidates keep their prices, names and stats on migration',()=>{
 const original=makeStock({roster:[],marketSeed:4},()=>.5);
 const existing=[original[0],original[9],original[23]].map(o=>({...o}));
 const upgraded=makeStock({roster:[],marketSeed:4},()=>.3,existing);
 assert.equal(upgraded.length,27);
 for(const old of existing){
  const n=upgraded.find(x=>x.visualId===old.visualId);
  assert.equal(n?.name,old.name);
  assert.equal(n?.cost,old.cost);
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
  assert.equal(final.cost,original.cost);
  assert.deepEqual(final.vals,original.vals);
  assert.equal(final.visualId,original.visualId);
 }
 assert.ok(migrated.every(o=>isRomanFullName(o.name)));
});
