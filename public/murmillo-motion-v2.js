/*
 * Murmillo Motion v2 — authored key-pose timeline for real combat.
 * No scanline warping, morphs, procedural stretching, alpha crossfades,
 * frame flicker, or five-tier-specific sprite dependencies.
 * Source frames: unaltered, alpha-isolated Murmillo L5 4x3 atlas.
 * Separate animation state from the game's gameplay/hit detection.
 */
(function(root){
'use strict';
const pose={idle:0,walk:1,slash:2,sweep:3,thrust:4,heavy:5,guard:6,hit:7,dodge:8,ready:9,victory:10,defeat:11};
const tracks={
 idle:[[0,0]],
 walk:[[0,1]],
 slash:[[0,0],[.12,9],[.25,6],[.34,2],[.80,2],[.89,9],[.96,0]],
 sweep:[[0,0],[.13,9],[.25,3],[.81,3],[.90,9],[.96,0]],
 thrust:[[0,0],[.13,8],[.25,4],[.83,4],[.92,9],[.97,0]],
 heavy:[[0,0],[.16,6],[.32,5],[.86,5],[.94,9]],
 dash:[[0,8],[.22,8],[.34,4],[.67,5],[.87,2]],
 guard:[[0,6]],
 dodge:[[0,8]],
 hit:[[0,7],[.78,7],[.94,9]],
 victory:[[0,10]],
 defeat:[[0,11]]
};
function clamp(t){return Math.min(1,Math.max(0,Number.isFinite(t)?t:0));}
function stateAt(f,scene,clock){
 if(!f)return {action:'idle',progress:0};
 if(scene&&(scene.phase==='finisher'||scene.phase==='result')&&scene.resultApplied){
   const won=(f===scene.player)===!!scene.resultWin;
   if(scene.phase==='finisher'&&scene.resultAnim<.26)
     return {action:won?'heavy':'hit',progress:clamp(scene.resultAnim/.26)};
   return {action:won?'victory':'defeat',progress:1};
 }
 if(f.dead)return {action:'defeat',progress:1};
 if(f.guard&&f.actionT<=0)return {action:'guard',progress:1};
 if(f.actionT>0){
   const progress=clamp(1-f.actionT/Math.max(.001,f.actionDuration||f.actionT));
   if(f.action==='attack')return {action:['slash','sweep','thrust'][Math.max(0,Math.min(2,f.attackVariant|0))],progress};
   if(f.action==='special')return {action:'heavy',progress};
   if(f.action==='comboDash')return {action:'dash',progress};
   if(f.action==='guard')return {action:'guard',progress};
   if(f.action==='dodge')return {action:'dodge',progress};
   if(f.action==='hit')return {action:'hit',progress};
   if(f.action==='finisher')return {action:'victory',progress};
   if(f.action==='defeat')return {action:'defeat',progress};
 }
 return {action:Math.abs(f.vx||0)>7?'walk':'idle',progress:0};
}
function poseAt(f,scene,clock){
 const s=stateAt(f,scene,clock),timeline=tracks[s.action]||tracks.idle;
 let index=timeline[0][1];
 for(let i=1;i<timeline.length;i++){
   if(s.progress+1e-9<timeline[i][0])break;
   index=timeline[i][1];
 }
 return {index,action:s.action,progress:s.progress};
}
let independentAtlas=null,loadPromise=null;
function loadAssets(){
 if(loadPromise)return loadPromise;
 loadPromise=fetch('assets/combat/murmillo-v2/manifest.json?v=2')
 .then(response=>{if(!response.ok)throw Error('standalone sprites unavailable');return response.json();})
 .then(async manifest=>{
  if(manifest.version!==2||manifest.frames?.length!==12)throw Error('sprite manifest invalid');
  const frames=await Promise.all(manifest.frames.map(meta=>new Promise((resolve,reject)=>{
   const img=new Image();
   img.onload=()=>{
    if(img.naturalWidth!==meta.width||img.naturalHeight!==meta.height)return reject(Error('size mismatch'));
    resolve({canvas:img,pivotX:meta.pivotX,footY:meta.footY});
   };
   img.onerror=()=>reject(Error('sprite load failed'));
   img.src='assets/combat/murmillo-v2/'+meta.file;
  })));
  independentAtlas={frames,cellWidth:manifest.cellWidth,cellHeight:manifest.cellHeight};
  return independentAtlas;
 })
 .catch(()=>null); // Existing L5 atlas is a safe fallback.
 return loadPromise;
}
function draw(ctx,o){
 const a=independentAtlas||o?.atlas,f=o?.fighter;
 if(!a?.frames||a.frames.length<12||!root.GrowthFrames?.draw||!f||!ctx)return false;
 const sample=poseAt(f,o.scene,o.clock);
 // GrowthFrames.draw uses pixel-owned alpha mask, per-pose foot pivot,
 // and the full original frame (weapons/shield never cross a crop cell).
 return !!root.GrowthFrames.draw(ctx,a,sample.index,
   o.x,o.y,o.w,o.h,!!o.flip,o.alpha??1);
}
root.MurmilloMotion={version:'2.1.0',pose,tracks,stateAt,poseAt,draw,loadAssets,hasStandaloneAssets:()=>!!independentAtlas};
if(typeof document!=='undefined'&&typeof fetch==='function')loadAssets();
if(typeof module!=='undefined'&&module.exports)module.exports=root.MurmilloMotion;
})(globalThis);
