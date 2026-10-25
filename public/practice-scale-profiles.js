/* Spartacus / cross-scene appearance size profiles.
 * A neutral ×1 default, with artist-controlled values from the same editor.
 */
(function(root){'use strict';
const KEY='spartacus.practice.scale.v32';
const FEET_KEY='spartacus.practice.feet.v42';
const FOOT_MIN=-70,FOOT_MAX=40;
const clampFoot=v=>Math.max(FOOT_MIN,Math.min(FOOT_MAX,Math.round(Number(v)||0)));
const TYPES=['murmillo_a','thraex_a','thraex_b','retiarius_a'];
// The baseline for EVERY costume is neutral ×1. No class-specific Murmillo,
// Thraex or Retiarius correction is hidden in the runtime. A non-1 value
// can now only come from the artist's published or device draft studio data.
const EXTRAS=Object.freeze(['murmillo_champion_red','murmillo_motion_v3','legacy_murmillo','legacy_thraex','legacy_retiarius']);
const BEASTS=Object.freeze(['beast_wolf','beast_leopard','beast_tiger','beast_lion','beast_elephant']);
const NPCS=Object.freeze(['npc_carnifex']);
const BASE=Object.freeze({...Object.fromEntries(TYPES.flatMap(type=>Array.from({length:5},(_,i)=>[type+'_L'+(i+1),1]))),...Object.fromEntries(EXTRAS.concat(BEASTS,NPCS).map(key=>[key,1]))});
const source=root.SpartacusPublishedScales||{};
const published={};
for(const key of Object.keys(BASE))if(Object.prototype.hasOwnProperty.call(source,key)&&
 Number.isFinite(Number(source[key]))&&Number(source[key])>=.65&&Number(source[key])<=1.85)
 published[key]=Number(source[key]);
const DEFAULTS=Object.freeze({...BASE,...published});
// A foot adjustment is a visual Y displacement in arena pixels; positive = down.
// Missing keys remain exactly zero, preserving approved ground contacts.
const footSource=root.SpartacusPublishedFeet||{};
const PUBLISHED_FEET=Object.freeze(Object.fromEntries(Object.keys(BASE).map(key=>[
 key,Number.isFinite(Number(footSource[key]))?clampFoot(footSource[key]):0
])));
const FOOT_DEFAULTS=Object.freeze({...PUBLISHED_FEET});
const feetBaseline=JSON.stringify({sizes:DEFAULTS,feet:FOOT_DEFAULTS});
const baseline=JSON.stringify(DEFAULTS);
const clamp=v=>Math.max(.65,Math.min(1.85,Number(v)));
function read(){
 try{
  const stored=JSON.parse(root.localStorage?.getItem(KEY)||'{}');
  // A changed published look invalidates ONLY that look's stale device draft.
  // Other 30 artist-calibrated characters must not lose their unpublished edits
  // when a single champion is corrected in GitHub.
  let previous=null;
  if(stored?.baseline!==baseline){
   if(stored?.baseline===undefined){
    if(Object.keys(published).length)return {};
   }else{
    try{previous=JSON.parse(stored.baseline);}catch(_){return {};}
    if(!previous||typeof previous!=='object')return {};
   }
  }
  const input=stored?.overrides||stored;
  const out={};
  for(const key of Object.keys(DEFAULTS))
   if((!previous||(Object.hasOwn(previous,key)&&previous[key]===DEFAULTS[key]))&&
    Object.prototype.hasOwnProperty.call(input,key)&&Number.isFinite(Number(input[key])))
    out[key]=clamp(input[key]);
  return out;
 }catch(_){return {};}
}
function write(input){
 const overrides={};
 for(const key of Object.keys(DEFAULTS))
  if(input&&Number.isFinite(Number(input[key])))overrides[key]=clamp(input[key]);
 try{
  root.localStorage?.setItem(KEY,JSON.stringify({version:38,baseline,overrides}));
  return true;
 }catch(_){return false;}
}
function reset(){try{root.localStorage?.removeItem(KEY);return true;}catch(_){return false;}}
function readFeet(){
 try{
  const stored=JSON.parse(root.localStorage?.getItem(FEET_KEY)||'{}');
  let previousFeet=null;
  if(stored?.baseline!==feetBaseline){
   // The foot baseline historically also serialized every body scale.
   // Changing a helmet/body scale must not erase unrelated foot editing.
   try{previousFeet=JSON.parse(stored.baseline).feet;}catch(_){return {};}
   if(!previousFeet||typeof previousFeet!=='object')return {};
  }
  const input=stored?.overrides||{};
  return Object.fromEntries(Object.keys(FOOT_DEFAULTS).filter(key=>
   (!previousFeet||(Object.hasOwn(previousFeet,key)&&previousFeet[key]===FOOT_DEFAULTS[key]))&&
   Object.hasOwn(input,key)&&Number.isFinite(Number(input[key])))
   .map(key=>[key,clampFoot(input[key])]));
 }catch(_){return {};}
}
function writeFeet(input){
 const overrides={};
 for(const key of Object.keys(FOOT_DEFAULTS))
  if(input&&Number.isFinite(Number(input[key])))overrides[key]=clampFoot(input[key]);
 try{root.localStorage?.setItem(FEET_KEY,JSON.stringify({version:42,baseline:feetBaseline,overrides}));return true;}
 catch(_){return false;}
}
function resetFeet(){try{root.localStorage?.removeItem(FEET_KEY);return true;}catch(_){return false;}}
function foot(key){return key?(readFeet()[key]??FOOT_DEFAULTS[key]??0):0;}
function look(unit,roster){
 if(unit?.side==='enemy')return DEFAULTS[unit.look]?unit.look:null;
 if(unit?.side!=='ally')return null;
 const hero=roster?.[unit.index];if(!hero)return null;
 if(hero.appearance==='murmillo_champion_red')return 'murmillo_champion_red';
 if(hero.appearance==='murmillo_motion_v3')return 'murmillo_motion_v3';
 if(hero.appearance==='legacy')return DEFAULTS['legacy_'+hero.cls]?'legacy_'+hero.cls:null;
 if(DEFAULTS[hero.visualId])return hero.visualId;
 const type=hero.growthType||(hero.cls==='thraex'?'thraex_a':hero.cls+'_a');
 const key=type+'_L'+Math.max(1,Math.min(5,Math.floor(Number(hero.stage)||1)));
 return DEFAULTS[key]?key:null;
}
// Cache the last substantial opaque row; transparent padding is not a foot.
const feetCache=new WeakMap();
function footY(image,fallback){
 if(!image)return fallback;
 if(feetCache.has(image))return feetCache.get(image);
 const w=image.naturalWidth||image.width,h=image.naturalHeight||image.height;
 if(!w||!h)return fallback;
 try{
  const canvas=root.document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  const bytes=ctx.getImageData(0,0,w,h).data,minimum=Math.max(2,Math.floor(w*.004));
  for(let y=h-1;y>=0;y--){let count=0;
   for(let x=0;x<w;x++)if(bytes[(y*w+x)*4+3]>=56)count++;
   if(count>=minimum){feetCache.set(image,y+1);return y+1;}
  }
 }catch(_){}
 return fallback;
}
function scale(key){return key?(read()[key]??DEFAULTS[key]??1):1;}
// All scenes project the SAME published per-look size against the COMPLETE
// idle frame, never alpha bounds or a scene-specific champion/class boost.
function framePixels(key,referenceHeight,worldHeight=202,actionScale=1){
 const h=Number(referenceHeight),base=Number(worldHeight),pose=Number(actionScale);
 if(!Number.isFinite(h)||h<=0||!Number.isFinite(base)||base<=0)return 0;
 return base/h*scale(key)*(Number.isFinite(pose)&&pose>0?pose:1);
}
// Match GrowthFrames.draw: project a fixed square world-space body against
// the UNTRIMMED source atlas cell, never the trimmed action/idle image canvas.
// Published scale and one artist-authored action multiplier are separate.
function cellPixels(key,cellWidth,cellHeight,worldSize=202){
 const w=Number(cellWidth),h=Number(cellHeight),s=Number(worldSize);
 if(!(w>0&&h>0&&s>0))return 0;
 return Math.min(s/w,s/h)*scale(key);
}
root.PracticeScaleProfiles={KEY,FEET_KEY,TYPES,EXTRAS,BEASTS,NPCS,BASE,DEFAULTS,FOOT_DEFAULTS,FOOT_MIN,FOOT_MAX,footY,clamp,clampFoot,read,write,reset,readFeet,writeFeet,resetFeet,foot,look,scale,framePixels,cellPixels};
if(typeof module!=='undefined')module.exports=root.PracticeScaleProfiles;
})(typeof window!=='undefined'?window:globalThis);
