/* Spartacus visual-authoring profiles v46.
 * Only one artist-authored action transform exists per appearance+pose.
 * No detection-based resizing, no undocumented practice-only costume boosts.
 * Positive X moves right in FACING space; positive Y moves downward.
 */
(function(root){'use strict';
const KEY='spartacus.practice.visual-actions.v46';
const ACTIONS=Object.freeze(['idle','walk','attack','slash','sweep','thrust','heavy','special','guard','parry','dodge','hit','death','finisher','victory']);
// Attack subtypes inherit their base action ONLY when no artist override exists.
// The runtime and studio use this same mapping, with no scene-owned pose tweaks.
const ACTION_FALLBACK=Object.freeze({slash:'attack',sweep:'attack',thrust:'attack',heavy:'special'});
const fallbackAction=action=>ACTION_FALLBACK[action]||null;
const EFFECTS=Object.freeze(['auto','none','slash','sweep','thrust','hit','guard','parry','finisher','special','dash','victory']);
const FX_SIZES=Object.freeze({slash:[600,570],sweep:[655,605],thrust:[710,570],hit:[480,450],
 guard:[440,430],parry:[510,495],finisher:[690,650],special:[660,620],dash:[790,510],victory:[660,600]});
const PUBLISHED=root.SpartacusPublishedActions||{};
const scaleProfiles=()=>root.PracticeScaleProfiles;
const baseline=JSON.stringify(PUBLISHED);
const between=(n,a,b,d=0)=>Number.isFinite(Number(n))?Math.max(a,Math.min(b,Number(n))):d;
const round=(n)=>Math.round(n*1000)/1000;
function clean(value){
 const v=value&&typeof value==='object'?value:{},e=v.effect&&typeof v.effect==='object'?v.effect:{};
 return {
  x:Math.round(between(v.x,-180,180)),y:Math.round(between(v.y,-180,180)),
  scale:round(between(v.scale,.45,1.8,1)),
  effect:{kind:EFFECTS.includes(e.kind)?e.kind:'auto',
   x:Math.round(between(e.x,-300,300)),y:Math.round(between(e.y,-300,300)),
   scale:round(between(e.scale,.2,2.5,1))}
 };
}
const isDefault=v=>v.x===0&&v.y===0&&v.scale===1&&v.effect.kind==='auto'&&
 v.effect.x===0&&v.effect.y===0&&v.effect.scale===1;
function sanitize(data){
 const out={},allowed=Object.keys(scaleProfiles()?.DEFAULTS||{});
 for(const key of allowed){
  if(!data||!Object.hasOwn(data,key)||!data[key]||typeof data[key]!=='object')continue;
  const poses={};
  for(const action of ACTIONS)if(Object.hasOwn(data[key],action)){
   const v=clean(data[key][action]);if(!isDefault(v))poses[action]=v;
  }
  if(Object.keys(poses).length)out[key]=poses;
 }
 return out;
}
const published=sanitize(PUBLISHED);
let local=null;
function read(){
 if(local)return local;
 try{
  const stored=JSON.parse(root.localStorage?.getItem(KEY)||'{}');
  local=stored?.baseline===baseline?sanitize(stored?.actions||{}):{};
 }catch(_){local={};}
 return local;
}
function all(){
 const out={};
 for(const obj of [published,read()])for(const [key,poses] of Object.entries(obj))
  out[key]={...(out[key]||{}),...poses};
 return out;
}
function resolve(key,action='idle'){
 if(!key||!ACTIONS.includes(action))return clean();
 const v=read()?.[key]?.[action]||published[key]?.[action];
 if(v)return clean(v);
 const base=fallbackAction(action);
 return clean(base?(read()?.[key]?.[base]||published[key]?.[base]):undefined);
}
function write(values){
 const actions=sanitize(values);
 try{root.localStorage?.setItem(KEY,JSON.stringify({version:46,baseline,actions}));local=actions;return true;}
 catch(_){return false;}
}
function reset(){try{root.localStorage?.removeItem(KEY);local={};return true;}catch(_){return false;}}
function size(kind){return FX_SIZES[kind]||[600,560];}
root.PracticeVisualProfiles=Object.freeze({KEY,ACTIONS,ACTION_FALLBACK,fallbackAction,EFFECTS,FX_SIZES,clean,sanitize,read,all,resolve,write,reset,size});
if(typeof module!=='undefined')module.exports=root.PracticeVisualProfiles;
})(typeof window!=='undefined'?window:globalThis);
