/* Spartacus visual-authoring profiles v52.
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
const neutralPoint=()=>({x:0,y:0});
const cleanPoint=p=>({
 x:Math.round(between(p?.x,-150,150)),
 y:Math.round(between(p?.y,-150,150))
});
function cleanMotion(motion){
 const m=motion&&typeof motion==='object'?motion:{};
 return {start:cleanPoint(m.start),middle:cleanPoint(m.middle),end:cleanPoint(m.end)};
}
function sampleMotion(value,progress=0){
 const m=cleanMotion(value?.motion||value);
 const t=between(progress,0,1),u=t<=.5?t*2:(t-.5)*2;
 const from=t<=.5?m.start:m.middle,to=t<=.5?m.middle:m.end;
 // Continuous ease-in/ease-out interpolation through start/50%/end keys.
 const e=u*u*(3-2*u);
 return {x:round(from.x+(to.x-from.x)*e),y:round(from.y+(to.y-from.y)*e)};
}
function clean(value){
 const v=value&&typeof value==='object'?value:{},e=v.effect&&typeof v.effect==='object'?v.effect:{};
 return {
  x:Math.round(between(v.x,-180,180)),y:Math.round(between(v.y,-180,180)),
  scale:round(between(v.scale,.45,1.8,1)),
  effect:{kind:EFFECTS.includes(e.kind)?e.kind:'auto',
   x:Math.round(between(e.x,-300,300)),y:Math.round(between(e.y,-300,300)),
   scale:round(between(e.scale,.2,2.5,1))},
  motion:cleanMotion(v.motion)
 };
}
const isDefault=v=>v.x===0&&v.y===0&&v.scale===1&&v.effect.kind==='auto'&&
 v.effect.x===0&&v.effect.y===0&&v.effect.scale===1&&
 Object.values(v.motion).every(key=>key.x===0&&key.y===0);
function sanitize(data){
 const out={},allowed=Object.keys(scaleProfiles()?.DEFAULTS||{});
 for(const key of allowed){
  if(!data||!Object.hasOwn(data,key)||!data[key]||typeof data[key]!=='object')continue;
  const poses={};
  for(const action of ACTIONS)if(Object.hasOwn(data[key],action)){
   // Explicit neutral poses override published/inherited non-neutral poses.
   poses[action]=clean(data[key][action]);
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
  // Preserve drafts edited on this device across unrelated game releases.
  // Published defaults may change, but a user's unpublished FX tweaks must
  // never disappear merely because the repo deployed a new code version.
  local=sanitize(stored?.actions||{});
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
 try{root.localStorage?.setItem(KEY,JSON.stringify({version:52,baseline,actions}));local=actions;return true;}
 catch(_){return false;}
}
function reset(){try{root.localStorage?.removeItem(KEY);local={};return true;}catch(_){return false;}}
function size(kind){return FX_SIZES[kind]||[600,560];}
// Single game/editor effect transform. All offsets use the same world-space
// unit as the original fighter sheet, then inherit ONLY the scene camera scale.
// The normal arena's render-camera scale is separate from extra effect boosts.
function effectGeometry({kind,baseX=0,baseY=0,face=1,zoom=1,pose=null,
 effect=null,applyPoseOffset=true,applyMotionOffset=true,progress=.5}={}){
 const p=clean(pose),e=effect?clean({effect}).effect:p.effect;
 const [width,height]=size(kind);
 const z=between(zoom,.01,10,1),direction=face<0?-1:1;
 const move=applyMotionOffset?sampleMotion(p,progress):neutralPoint();
 return Object.freeze({
  kind,x:baseX+direction*((applyPoseOffset?p.x:0)+e.x+move.x)*z,
  y:baseY+((applyPoseOffset?p.y:0)+e.y+move.y)*z,
  width:width*z*e.scale,height:height*z*e.scale,
  zoom:z,scale:e.scale
 });
}
root.PracticeVisualProfiles=Object.freeze({KEY,ACTIONS,ACTION_FALLBACK,fallbackAction,
 EFFECTS,FX_SIZES,clean,cleanMotion,sampleMotion,sanitize,read,all,resolve,write,reset,size,effectGeometry});
if(typeof module!=='undefined')module.exports=root.PracticeVisualProfiles;
})(typeof window!=='undefined'?window:globalThis);
