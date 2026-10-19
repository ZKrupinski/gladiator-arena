/* GLADIATOR ARENA · Cinematic Painted VFX v3
 * Eight materially distinct painted 12-frame sprites: NO geometric/vector FX,
 * no reused generic explosion on unrelated actions, no frame-to-frame bleed.
 *
 * All source atlases are 1448 x 1086 with 4x3 true RGBA cells (362 x 362).
 * Art is authored externally and repacked with 14px transparent cell gutters.
 * Runtime only reads source cells at native aspect; no AI art is generated here.
 */
(function(root){
 'use strict';
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const FAMILIES=Object.freeze({
  slash: Object.freeze({frames:12,width:362,height:362,source:'slash_trail',duration:.23,profile:'vertical-swordlight'}),
  sweep: Object.freeze({frames:12,width:362,height:362,source:'sweep_trail',duration:.25,profile:'horizontal-swordlight'}),
  thrust:Object.freeze({frames:12,width:362,height:362,source:'thrust_trail',duration:.24,profile:'linear-swordlight'}),
  guard: Object.freeze({frames:12,width:362,height:362,source:'guard_painted',duration:.32,profile:'forward-shield-crescent'}),
  parry: Object.freeze({frames:12,width:362,height:362,source:'parry_painted',duration:.60,profile:'precise-cross-flash'}),
  finisher:Object.freeze({frames:12,width:362,height:362,source:'finisher_painted',duration:.60,profile:'wide-radial-impact'}),
  dash:  Object.freeze({frames:12,width:362,height:362,source:'dash_painted',duration:.54,profile:'long-horizontal-red-strike'}),
  special:Object.freeze({frames:12,width:362,height:362,source:'special_painted',duration:.59,profile:'rotating-cyan-gold-aura'})
 });
 const COLS=4,ROWS=3;
 const images=root.__ArenaVFXAssets||{};
 const frames=new Map(),PIXEL_BUDGET=10_000_000;
 let pixelCount=0;
 const ready=img=>!!(img&&img.complete&&img.naturalWidth===1448&&img.naturalHeight===1086);
 function bind(map){
  if(!map||typeof map!=='object')return;
  // Rebinding new/updated URLs invalidates cached frames to avoid stale art.
  let changed=false;
  for(const [key,img] of Object.entries(map)){
   if(images[key]!==img){images[key]=img;changed=true}
  }
  if(changed){frames.clear();pixelCount=0}
 }
 function specs(){
  return Object.fromEntries(Object.entries(FAMILIES).map(([key,v])=>
    [key,{frames:v.frames,width:v.width,height:v.height,source:v.source,duration:v.duration,profile:v.profile}]));
 }
 function available(kind){const spec=FAMILIES[kind];return !!spec&&ready(images[spec.source])}
 function frameIndex(kind,progress){
  const spec=FAMILIES[kind];
  if(!spec)return -1;
  return Math.min(spec.frames-1,Math.floor(clamp(Number(progress)||0,0,.999999)*spec.frames));
 }
 function rasterize(kind,index){
  const spec=FAMILIES[kind];
  if(!spec||!available(kind)||index<0||index>=spec.frames||typeof document==='undefined')return null;
  const canvas=document.createElement('canvas');
  canvas.width=spec.width;canvas.height=spec.height;
  const c=canvas.getContext('2d',{alpha:true});
  if(!c)return null;
  const src=images[spec.source];
  const sourceX=(index%COLS)*spec.width,sourceY=Math.floor(index/COLS)*spec.height;
  // Discrete true-12-frame source; no overlaid burst sprites or synthetic arcs.
  c.clearRect(0,0,canvas.width,canvas.height);
  c.drawImage(src,sourceX,sourceY,spec.width,spec.height,0,0,spec.width,spec.height);
  return canvas;
 }
 function frame(kind,index){
  const key=kind+':'+index;
  if(frames.has(key)){
   const hit=frames.get(key);frames.delete(key);frames.set(key,hit);return hit;
  }
  const canvas=rasterize(kind,index);
  if(!canvas)return null;
  const weight=canvas.width*canvas.height;
  while(frames.size&&pixelCount+weight>PIXEL_BUDGET){
   const oldest=frames.keys().next().value,discard=frames.get(oldest);
   frames.delete(oldest);pixelCount-=discard.width*discard.height;
  }
  frames.set(key,canvas);pixelCount+=weight;
  return canvas;
 }
 function draw(ctx,kind,x,y,w,h,progress=0,alpha=1,flip=false,rotation=0){
  if(!ctx||!FAMILIES[kind])return false;
  const canvas=frame(kind,frameIndex(kind,progress));
  if(!canvas)return false;
  ctx.save();ctx.translate(x,y);ctx.rotate(rotation);
  if(flip)ctx.scale(-1,1);
  ctx.globalAlpha=clamp(alpha);
  ctx.drawImage(canvas,-w/2,-h/2,w,h);
  ctx.restore();return true;
 }
 function inspect(kind,progress){
  const n=frameIndex(kind,progress),img=frame(kind,n);
  return img?{kind,index:n,frames:FAMILIES[kind].frames,
   width:img.width,height:img.height,alpha:true,canvas:img}:null;
 }
 root.ArenaAnimatedFX={
  version:'3.0.0',FAMILIES,specs,bind,frameIndex,draw,inspect,
  available,cacheSize:()=>frames.size
 };
 if(typeof module!=='undefined'&&module.exports)module.exports=root.ArenaAnimatedFX;
})(globalThis);
