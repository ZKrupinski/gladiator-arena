/* Gladiator Arena | Painted Animation VFX v1
 * 8 distinct effect families, 12–16 separately rasterized transparent frames
 * composed entirely from the approved hand-painted WebP effect artwork.
 *
 * No CSS/SVG/vector slash geometry. No copying neighbouring atlas cells.
 * Each effect frame is rasterized into an independent alpha canvas on demand,
 * cached with a strict mobile memory cap, and plays according to real-time
 * event progress (including during existing gameplay hitstop).
 */
(function(root){
'use strict';
const clamp=(a,b=0,c=1)=>Math.max(b,Math.min(c,a));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const FAMILIES=Object.freeze({
 slash:Object.freeze({frames:12,width:384,height:384,source:'hit_slash',duration:.23,profile:'cut'}),
 sweep:Object.freeze({frames:12,width:384,height:384,source:'hit_slash',duration:.25,profile:'sweep'}),
 thrust:Object.freeze({frames:12,width:480,height:320,source:'dash_trail',duration:.24,profile:'thrust'}),
 guard:Object.freeze({frames:12,width:384,height:384,source:'parry_burst',duration:.32,profile:'guard'}),
 parry:Object.freeze({frames:16,width:448,height:448,source:'parry_burst',duration:.58,profile:'parry'}),
 dash:Object.freeze({frames:16,width:512,height:288,source:'dash_trail',duration:.54,profile:'dash'}),
 special:Object.freeze({frames:16,width:448,height:448,source:'special_aura',duration:.59,profile:'special'}),
 finisher:Object.freeze({frames:16,width:448,height:448,source:'parry_burst',duration:.58,profile:'finish'})
});
const frameCache=new Map();
const MAX_CACHED_PIXELS=9_000_000; // ~36 MiB raw alpha, mobile friendly.
let cachePixels=0;
const ready=im=>!!(im&&im.complete&&im.naturalWidth>0&&im.naturalHeight>0);
const images=root.__ArenaVFXAssets||{};
function bind(art){if(art&&typeof art==='object')Object.assign(images,art);}
function specs(){return Object.fromEntries(Object.entries(FAMILIES).map(([k,s])=>[k,{frames:s.frames,width:s.width,height:s.height,duration:s.duration,source:s.source}]));}
function frameIndex(kind,progress){
 const n=FAMILIES[kind]?.frames||0;
 return n?Math.min(n-1,Math.floor(clamp(Number(progress)||0,0,.999999)*n)):-1;
}
function sourcesLoaded(kind){
 const s=FAMILIES[kind];if(!s)return false;
 return ready(images[s.source]);
}
function rasterize(kind,i){
 const s=FAMILIES[kind];
 if(!s||i<0||i>=s.frames||!sourcesLoaded(kind)||typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');
 canvas.width=s.width;canvas.height=s.height;
 const g=canvas.getContext('2d',{alpha:true});
 if(!g)return null;
 g.clearRect(0,0,s.width,s.height);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
 const w=s.width,h=s.height,u=(i+.48)/s.frames,em=Math.sin(Math.PI*u);
 const appear=ease(u/.21),tail=1-ease((u-.62)/.38);
 const power=clamp(em*1.22)*appear*tail;
 const main=images[s.source];
 const img=key=>ready(images[key])?images[key]:main;
 const paint=(sprite,x,y,rw,rh,opacity,rotation=0,mirrored=false,blend='source-over')=>{
  if(!ready(sprite)||opacity<=.008)return;
  g.save();g.translate(x*w,y*h);g.rotate(rotation);
  if(mirrored)g.scale(-1,1);
  g.globalAlpha=clamp(opacity,0,1);
  g.globalCompositeOperation=blend;
  // The effect picture is painted raster art, never an artificial vector arc.
  // Keep source aspect in the design envelope without cropping its outer flames.
  const fitted=Math.min(w*rw/sprite.naturalWidth,h*rh/sprite.naturalHeight);
  const fw=sprite.naturalWidth*fitted,fh=sprite.naturalHeight*fitted;
  g.drawImage(sprite,-fw/2,-fh/2,fw,fh);
  g.restore();
 };
 const flare=img('hit_slash'),burst=img('parry_burst');
 const tailAsset=img('dash_trail'),aura=img('special_aura');
 if(kind==='slash'||kind==='sweep'){
  const horizontal=kind==='sweep';
  const travel=ease(u/.62);
  const sweepDir=horizontal?-1:1;
  paint(flare,.39+travel*.22,.54-(horizontal?.015:.08)*travel,
    .24+power*.74,.32+power*.64,power*.99,
    (horizontal?-.43:.30)+travel*(horizontal?1.12:-.76));
  if(u>.24&&u<.85)
   paint(flare,.45+travel*.16,.47,.30+power*.53,.30+power*.53,
     power*.32,(horizontal?-.2:.4)+travel*.56,true,'screen');
  if(u>.4)paint(burst,.54+travel*.12,.51,.25+power*.42,.28+power*.50,
   power*.36,.10,'screen');
 }
 else if(kind==='thrust'){
  const movement=ease(u/.75);
  const intensity=clamp(power*1.4);
  paint(tailAsset,.27+movement*.28,.51,.13+intensity*.80,.24+intensity*.31,
   intensity*.86,-.08);
  if(u>.30)paint(flare,.56+movement*.19,.51,.18+intensity*.36,
   .20+intensity*.40,intensity*.71,.12,'','screen');
  if(u>.53)paint(burst,.68+movement*.13,.5,.13+intensity*.21,
   .24+intensity*.35,intensity*.66,0,false,'screen');
 }
 else if(kind==='guard'){
  const strength=Math.max(0,1-Math.abs(u-.36)/.48);
  paint(aura,.5,.5,.24+strength*.49,.24+strength*.48,
    strength*.19,-.10);
  paint(burst,.51,.49,.16+strength*.68,.18+strength*.67,
    strength*.94,(u-.4)*.48,false,'screen');
  if(u>.28&&u<.72)paint(flare,.57,.47,.16+strength*.32,
    .20+strength*.35,strength*.36,-.35,false,'screen');
 }
 else if(kind==='parry'){
  const strike=Math.max(0,1-Math.abs(u-.36)/.42);
  paint(aura,.50,.52,.22+u*.62,.20+u*.63,power*.45,(u-.5)*.22);
  paint(burst,.48,.5,.23+strike*.74,.23+strike*.72,
    strike*.94,(u-.35)*.12,false,'screen');
  paint(flare,.52,.48,.16+strike*.53,.16+strike*.52,
    Math.pow(strike,1.5)*.62,-.12,false,'screen');
  if(u>.45)paint(burst,.55,.48,.20+power*.55,.20+power*.53,
    power*.30,.65,true,'screen');
 }
 else if(kind==='dash'){
  const speed=ease(u/.72),clash=Math.max(0,1-Math.abs(u-.65)/.32);
  paint(tailAsset,.35+speed*.19,.52,.25+power*.71,.20+power*.43,
    power*.88,-.06);
  if(u>.30)paint(flare,.37+speed*.28,.49,.15+clash*.61,
    .18+clash*.65,clash*.85,-.08,false,'screen');
  if(u>.53)paint(burst,.51+speed*.26,.52,.13+clash*.62,
    .19+clash*.70,clash*.89,0,false,'screen');
  if(u>.65)paint(tailAsset,.48,.53,.43+power*.42,.19+power*.21,
    power*.3,-.02,true,'screen');
 }
 else if(kind==='special'){
  const impact=Math.max(0,1-Math.abs(u-.48)/.49);
  paint(aura,.5,.5,.25+u*.59,.26+u*.57,power*.88,
    (u-.5)*.30,false,'screen');
  if(u>.18)paint(flare,.5,.5,.21+impact*.65,.22+impact*.65,
    impact*.5,-.25,false,'screen');
  if(u>.33)paint(burst,.51,.51,.20+impact*.67,.22+impact*.67,
    impact*.79,0,false,'screen');
  if(u>.62)paint(aura,.50,.5,.39+u*.40,.38+u*.42,
    power*.34,.34,true,'screen');
 }
 else if(kind==='finisher'){
  const crash=Math.max(0,1-Math.abs(u-.37)/.45);
  paint(aura,.49,.52,.15+u*.70,.16+u*.67,power*.6,.15);
  paint(burst,.5,.50,.23+crash*.76,.22+crash*.77,
   crash*.94,(u-.5)*.1,false,'screen');
  if(u>.28)paint(flare,.52,.51,.24+crash*.59,.24+crash*.58,
   crash*.77,-.22,false,'screen');
 }
 // Fade the independently rasterized final frames to clean transparent pixels;
 // never leave one original still-image "stuck" on the last frame.
 if(u>.78){
  const alpha=clamp((1-u)/.22);
  g.globalCompositeOperation='destination-in';g.globalAlpha=alpha;
  g.fillStyle='#fff';g.fillRect(0,0,w,h);
  g.globalAlpha=1;g.globalCompositeOperation='source-over';
 }
 return canvas;
}
function obtain(kind,index){
 const key=kind+':'+index;
 if(frameCache.has(key)){
  const hit=frameCache.get(key);frameCache.delete(key);frameCache.set(key,hit);
  return hit;
 }
 const img=rasterize(kind,index);
 if(!img)return null;
 const pixels=img.width*img.height;
 while(frameCache.size&&cachePixels+pixels>MAX_CACHED_PIXELS){
  const oldest=frameCache.keys().next().value;
  const dead=frameCache.get(oldest);cachePixels-=dead.width*dead.height;
  frameCache.delete(oldest);
 }
 frameCache.set(key,img);cachePixels+=pixels;
 return img;
}
function draw(ctx,kind,x,y,w,h,progress=0,alpha=1,flip=false,rotation=0){
 if(!ctx||!FAMILIES[kind])return false;
 const pic=obtain(kind,frameIndex(kind,progress));if(!pic)return false;
 ctx.save();ctx.translate(x,y);ctx.rotate(rotation);
 if(flip)ctx.scale(-1,1);
 ctx.globalAlpha=clamp(alpha);
 ctx.drawImage(pic,-w/2,-h/2,w,h);
 ctx.restore();return true;
}
function inspect(kind,progress){
 const i=frameIndex(kind,progress);
 const c=obtain(kind,i);
 return c?{kind,index:i,frames:FAMILIES[kind].frames,width:c.width,height:c.height,
  alpha:true,canvas:c}:null;
}
root.ArenaAnimatedFX={version:'1.0.0',FAMILIES,specs,bind,frameIndex,draw,inspect,
  available:sourcesLoaded,cacheSize:()=>frameCache.size};
if(typeof module!=='undefined'&&module.exports)module.exports=root.ArenaAnimatedFX;
})(globalThis);
