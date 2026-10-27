/* Spartacus market price levels v1: one tier per human appearance, no beasts.
 * A local draft is device-only. Published prices are sourced from
 * practice-scale-published.js and apply to every device after deployment.
 */
(function(root){'use strict';
const STORAGE_KEY='spartacus.market.price-levels.v1';
const LEVELS=Object.freeze([
 {level:1,label:'저가형',target:420},
 {level:2,label:'일반형',target:580},
 {level:3,label:'숙련형',target:780},
 {level:4,label:'특수형',target:1020},
 {level:5,label:'최고가형',target:1350}
]);
const registry=root.SpartacusGladiators||
 (typeof module!=='undefined'&&module.exports?require('./gladiator-registry.js'):null);
if(!registry)throw Error('Unified gladiator registry must load before market pricing');
const BASE=Object.create(null),DEFAULTS=Object.create(null),LOOK_IDS=[];
const isMarketLook=id=>!!registry.get(id);
function sync(){
 for(const look of registry.market()){
  const id=look.visualId;
  if(!Object.hasOwn(BASE,id)){
   BASE[id]=look.priceLevel??2;
   DEFAULTS[id]=sanitizePublished(id)??BASE[id];
   LOOK_IDS.push(id);
  }
 }
}
function sanitizePublished(id){
 const value=root.SpartacusPublishedMarketPrices?.[id];
 return Number.isInteger(value)&&value>=1&&value<=5?value:null;
}
function sanitize(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return {};
 return Object.fromEntries(LOOK_IDS.filter(id=>Number.isInteger(value[id])&&value[id]>=1&&value[id]<=5)
  .map(id=>[id,value[id]]));
}
sync();
registry.subscribe(sync);
function read(){
 try{
  const data=root.localStorage?.getItem(STORAGE_KEY);
  return data?sanitize(JSON.parse(data)):{};
 }catch(_){return {};}
}
function write(value){
 try{root.localStorage?.setItem(STORAGE_KEY,JSON.stringify(sanitize(value)));return Boolean(root.localStorage);}
 catch(_){return false;}
}
function reset(){
 try{root.localStorage?.removeItem(STORAGE_KEY);return true;}catch(_){return false;}
}
function levelFor(id){
 if(!isMarketLook(id))return null;
 sync();
 const draft=read(),published=sanitize(root.SpartacusPublishedMarketPrices);
 return draft[id]??published[id]??BASE[id];
}
function normalize(value){
 sync();const clean=sanitize(value);
 return Object.fromEntries(LOOK_IDS.map(id=>[id,clean[id]??DEFAULTS[id]]));
}
function variation(id,seed){
 // FNV-1a: repeatable per stock refresh, independent of RNG consumption.
 const str=String(id)+'|'+String(Math.trunc(Number(seed)||0));
 let h=2166136261;
 for(let i=0;i<str.length;i++)h=Math.imul(h^str.charCodeAt(i),16777619)>>>0;
 return .94+(h/4294967296)*.12; // approx +/-6%, rounded to 10 denarii
}
function quote(id,seed=0){
 const level=levelFor(id);
 if(level===null)return null;
 const target=LEVELS[level-1].target;
 return Object.freeze({
  level,cost:Math.max(100,Math.round(target*variation(id,seed)/10)*10),
  target,min:Math.round(target*.94/10)*10,max:Math.round(target*1.06/10)*10,
  model:2
 });
}
const api=Object.freeze({STORAGE_KEY,LOOK_IDS,LEVELS,BASE,DEFAULTS,
 isMarketLook,sanitize,normalize,read,write,reset,levelFor,quote});
root.SpartacusMarketPricing=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
