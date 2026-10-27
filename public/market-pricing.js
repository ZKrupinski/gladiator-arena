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
const BASE=Object.freeze({
 ...Object.fromEntries(['murmillo_a','thraex_a','thraex_b','retiarius_a']
  .flatMap(family=>[1,2,3,4,5].map((n,i)=>[family+'_L'+n,[1,2,2,3,3][i]]))),
 murmillo_champion_red:5,
 murmillo_redcrest_new_v1:4,
 murmillo_redcrest_alt_v1:4,
 murmillo_motion_v3:4,
 legacy_murmillo:3,
 legacy_thraex:3,
 legacy_retiarius:3
});
const LOOK_IDS=Object.freeze(Object.keys(BASE));
const isMarketLook=id=>Object.hasOwn(BASE,String(id));
function sanitize(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return {};
 return Object.fromEntries(LOOK_IDS.filter(id=>Number.isInteger(value[id])&&value[id]>=1&&value[id]<=5)
  .map(id=>[id,value[id]]));
}
const DEFAULTS=Object.freeze({...BASE,...sanitize(root.SpartacusPublishedMarketPrices)});
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
 const draft=read(),published=sanitize(root.SpartacusPublishedMarketPrices);
 return draft[id]??published[id]??BASE[id];
}
function normalize(value){
 const clean=sanitize(value);
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
