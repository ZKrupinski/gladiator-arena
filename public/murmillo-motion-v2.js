/*
 * Murmillo Motion v3 — visible, continuously advancing fight animations.
 * Keeps 12 isolated source artworks and fixed-foot pivots. Unlike v2,
 * idle/walk/guard/victory animate even when no attack input occurs.
 * No scanline slicing, sprite-cell bleed or alpha strobing.
 */
(function(root){
'use strict';
const pose={idle:0,walk:1,slash:2,sweep:3,thrust:4,heavy:5,guard:6,hit:7,dodge:8,ready:9,victory:10,defeat:11};
const tracks={
  slash:[[0,9],[.13,6],[.27,5],[.39,2],[.76,2],[.88,9],[.98,0]],
  sweep:[[0,9],[.12,6],[.26,3],[.72,3],[.87,9],[.97,0]],
  thrust:[[0,9],[.14,8],[.31,4],[.77,4],[.89,9],[.98,0]],
  heavy:[[0,6],[.18,9],[.31,5],[.78,5],[.93,9]],
  dash:[[0,8],[.18,1],[.32,4],[.58,5],[.80,2],[.95,9]],
  dodge:[[0,9],[.16,8],[.74,8],[.89,9]],
  hit:[[0,9],[.15,7],[.79,7],[.95,9]],
  guard:[[0,6]],victory:[[0,10]],defeat:[[0,11]]
};
const cycleTracks={
 idle:{duration:2.8,steps:[[0,0],[.23,9],[.38,0],[.57,9],[.70,0],[.84,6],[.91,9],[.96,0]]},
 walk:{duration:.75,steps:[[0,9],[.16,1],[.40,9],[.55,1],[.79,8],[.92,9]]},
 guard:{duration:1.65,steps:[[0,6],[.58,9],[.69,6]]},
 victory:{duration:1.7,steps:[[0,10],[.63,9],[.76,10]]}
};
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,Number.isFinite(v)?v:0));
function stateAt(f,scene,clock=0){
 if(!f)return {action:'idle',progress:0,loop:true};
 if(scene&&(scene.phase==='finisher'||scene.phase==='result')&&scene.resultApplied){
   const won=(f===scene.player)===!!scene.resultWin;
   if(scene.phase==='finisher'&&scene.resultAnim<.26)
     return {action:won?'heavy':'hit',progress:clamp(scene.resultAnim/.26),loop:false};
   return {action:won?'victory':'defeat',progress:1,loop:won};
 }
 if(f.dead)return {action:'defeat',progress:1,loop:false};
 if(f.actionT>0){
   const progress=clamp(1-f.actionT/Math.max(.001,f.actionDuration||f.actionT));
   if(f.action==='attack')return {action:['slash','sweep','thrust'][clamp(f.attackVariant|0,0,2)],progress,loop:false};
   if(f.action==='special')return {action:'heavy',progress,loop:false};
   if(f.action==='comboDash')return {action:'dash',progress,loop:false};
   if(f.action==='dodge')return {action:'dodge',progress,loop:false};
   if(f.action==='hit')return {action:'hit',progress,loop:false};
   if(f.action==='guard')return {action:'guard',progress,loop:true};
   if(f.action==='finisher')return {action:'victory',progress:1,loop:true};
   if(f.action==='defeat')return {action:'defeat',progress:1,loop:false};
 }
 if(f.guard)return {action:'guard',progress:0,loop:true};
 return {action:Math.abs(f.vx||0)>7?'walk':'idle',progress:0,loop:true};
}
function poseAt(f,scene,clock=0){
 const state=stateAt(f,scene,clock),loop=cycleTracks[state.action];
 const time=Math.max(0,Number.isFinite(clock)?clock:0)+(f?.footworkSeed||0)*.15;
 const cycle=loop?((time%loop.duration)/loop.duration):state.progress;
 const timeline=loop?.steps||tracks[state.action]||[[0,0]];
 let index=timeline[0][1];
 for(let i=1;i<timeline.length;i++){
   if(cycle+1e-9<timeline[i][0])break;
   index=timeline[i][1];
 }
 return {index,action:state.action,progress:cycle,loop:!!loop};
}
function motionAt(f,scene,clock=0){
 const sample=poseAt(f,scene,clock),p=sample.progress;
 const wave=Math.sin(p*Math.PI*2),lift=Math.pow(Math.sin(p*Math.PI*2),2);
 let x=0,y=0,lean=0,sx=1,sy=1;
 switch(sample.action){
  case 'idle':
    y=-3.8*(.5+.5*wave);lean=.018*wave;
    sx=1+.014*(.5+.5*wave);sy=1+.018*(.5+.5*wave);break;
  case 'walk':
    x=6*Math.sin(p*Math.PI*4);y=-9*lift;
    lean=.044*Math.sin(p*Math.PI*4);sx=1+.016*lift;sy=1-.020*lift;break;
  case 'guard':
    y=-2*Math.max(0,wave);lean=.008*wave;break;
  case 'slash':
    x=19*Math.sin(Math.PI*p);y=-7*Math.sin(Math.PI*p);
    lean=.065*Math.sin(Math.PI*p);break;
  case 'sweep':
    x=25*Math.sin(Math.PI*p);lean=.050*Math.sin(Math.PI*p);sx=1+.03*Math.sin(Math.PI*p);break;
  case 'thrust':
    x=34*Math.sin(Math.PI*p);y=3*Math.sin(Math.PI*p);lean=.035*Math.sin(Math.PI*p);break;
  case 'heavy':
    x=14*Math.sin(Math.PI*p);y=-13*Math.sin(Math.PI*p);lean=-.048*Math.sin(Math.PI*p);break;
  case 'dash': x=28*Math.sin(Math.PI*p);y=-15*Math.sin(Math.PI*p);break;
  case 'dodge':y=-6*Math.sin(Math.PI*p);lean=-.055*Math.sin(Math.PI*p);break;
  case 'hit':x=-7*Math.sin(Math.PI*p);lean=-.055*Math.sin(Math.PI*p);break;
  case 'victory':y=-7*(.5+.5*wave);lean=.014*wave;break;
 }
 return {...sample,x,y,lean,sx,sy};
}
let independentAtlas=null,loadPromise=null,assetState='loading';
function loadAssets(){
 if(loadPromise)return loadPromise;
 if(typeof fetch!=='function'||typeof Image==='undefined')return Promise.resolve(null);
 loadPromise=fetch('assets/combat/murmillo-v2/manifest.json?v=3')
 .then(response=>{if(!response.ok)throw Error('sprite manifest '+response.status);return response.json();})
 .then(async manifest=>{
  if(manifest.version!==2||manifest.frames?.length!==12)throw Error('invalid sprite manifest');
  const frames=await Promise.all(manifest.frames.map(meta=>new Promise((resolve,reject)=>{
   const img=new Image();
   img.onload=()=>{
    if(img.naturalWidth!==meta.width||img.naturalHeight!==meta.height)return reject(Error('sprite dimensions mismatch'));
    resolve({canvas:img,pivotX:meta.pivotX,footY:meta.footY});
   };
   img.onerror=()=>reject(Error('sprite '+meta.file+' unavailable'));
   img.src='assets/combat/murmillo-v2/'+meta.file+'?v=3';
  })));
  independentAtlas={frames,cellWidth:manifest.cellWidth,cellHeight:manifest.cellHeight};
  assetState='ready';return independentAtlas;
 }).catch(e=>{assetState='fallback: '+e.message;return null;});
 return loadPromise;
}
function draw(ctx,o){
 const a=independentAtlas||o?.atlas,f=o?.fighter;
 if(!a?.frames||a.frames.length<12||!root.GrowthFrames?.draw||!f||!ctx)return false;
 const m=motionAt(f,o.scene,o.clock);
 const x=Number(o.x)||0,y=Number(o.y)||0,w=Number(o.w)||348,h=Number(o.h)||348;
 const center=x+w/2,feet=y+h;
 // The whole pose follows a gentle, foot-anchored transformation. No per-pixel
 // warps, strip deformation, frame slicing or floating ground pivot.
 ctx.save();
 ctx.translate(center,feet);
 ctx.rotate(m.lean*(o.flip?-1:1));
 ctx.scale(m.sx,m.sy);
 ctx.translate(-center,-feet);
 const ok=root.GrowthFrames.draw(ctx,a,m.index,x+m.x*(o.flip?-1:1),y+m.y,w,h,!!o.flip,o.alpha??1);
 ctx.restore();
 return !!ok;
}
root.MurmilloMotion={version:'3.0.0',pose,tracks,cycleTracks,stateAt,poseAt,motionAt,draw,loadAssets,
 hasStandaloneAssets:()=>!!independentAtlas,assetStatus:()=>assetState};
if(typeof document!=='undefined'&&typeof fetch==='function')loadAssets();
if(typeof module!=='undefined'&&module.exports)module.exports=root.MurmilloMotion;
})(globalThis);
