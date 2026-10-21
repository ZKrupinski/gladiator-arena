/* ARENA BESTIAE · independent shared beast VFX (8 motions × 8 frames).
 * No sword/guard/weapon trail reused. Source cells are 4x2 lossless RGBA
 * with visual QC and review receipts kept outside the game.
 * Missing/unapproved assets render nothing (never unrelated gladiator FX).
 */
(function(root){
 'use strict';
 const BASE='assets/beasts/effects-v1/';
 const TYPES=Object.freeze(['claw','sweep','bite','pounce','hit','step','roar','collapse']);
 const DURATION=Object.freeze({claw:.27,sweep:.31,bite:.24,pounce:.47,hit:.25,step:.27,roar:.68,collapse:.72});
 const MAP=Object.freeze({attack1:'claw',attack2:'sweep',attack3:'bite',attack4:'pounce',
   special:'pounce',walk:'step',hit:'hit',defeat:'collapse',roar:'roar'});
 const cache=new Map(),state={status:'unrequested',error:null,version:null};
 const clamp=(n,lo=0,hi=1)=>Math.max(lo,Math.min(hi,Number.isFinite(n)?n:lo));
 function ensure(){
  if(state.status!=='unrequested'||typeof fetch!=='function'||typeof Image==='undefined')return;
  state.status='loading';
  (async()=>{
   let release=String(Date.now());
   try{
    const m=await fetch('uploader-release.json',{cache:'no-store'});
    if(m.ok){
     const r=await m.json();
     if(r?.releaseProtocol==='spartacus-uploader-v1'&&
       r?.assetSha256?.['public/'+BASE+'manifest.json']&&
       /^[a-z0-9_-]{6,80}$/i.test(r.releaseId||''))release=r.releaseId;
    }
   }catch(_){}
   const result=await fetch(BASE+'manifest.json?v='+encodeURIComponent(release),{cache:'no-store'});
   if(!result.ok)throw Error('BEAST_VFX_NOT_PUBLISHED');
   const manifest=await result.json();
   if(manifest.version!==1||manifest.grid?.[0]!==4||manifest.grid?.[1]!==2||
     manifest.frames!==8||typeof manifest.families!=='object')throw Error('INVALID_BEAST_VFX_MANIFEST');
   for(const kind of TYPES){
    if(manifest.families[kind]!==kind+'.webp')throw Error('MISSING_BEAST_VFX_FAMILY_'+kind);
   }
   const loaded=await Promise.all(TYPES.map(kind=>new Promise((ok,bad)=>{
    const img=new Image();
    img.onload=()=>{
     if(!img.naturalWidth||!img.naturalHeight||img.naturalWidth%4||img.naturalHeight%2)
       return bad(Error('INVALID_4x2_EFFECT_ATLAS_'+kind));
     ok([kind,img]);
    };
    img.onerror=()=>bad(Error('FAILED_BEAST_VFX_ASSET_'+kind));
    img.src=BASE+kind+'.webp?v='+encodeURIComponent(release);
   })));
   cache.clear();
   for(const [kind,img] of loaded)cache.set(kind,img);
   state.status='ready';state.version=release;
  })().catch(error=>{state.status='unavailable';state.error=String(error)});
 }
 function frameFor(kind,progress){
  return TYPES.includes(kind)?Math.min(7,Math.floor(clamp(progress,0,.999999)*8)):-1;
 }
 function draw(ctx,kind,x,y,w,h,progress=0,alpha=1,face=1,rotation=0){
  if(!ctx||state.status!=='ready'||!cache.has(kind))return false;
  const img=cache.get(kind),cellW=img.naturalWidth/4,cellH=img.naturalHeight/2;
  const frame=frameFor(kind,progress);
  if(frame<0)return false;
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(Number.isFinite(rotation)?rotation:0);
  if(face<0)ctx.scale(-1,1);
  ctx.globalAlpha*=clamp(alpha);
  ctx.drawImage(img,frame%4*cellW,Math.floor(frame/4)*cellH,
    cellW,cellH,-w/2,-h/2,w,h);
  ctx.restore();
  return true;
 }
 root.ArenaBeastFX=Object.freeze({
  version:'1.0.0',types:TYPES,mapping:MAP,durations:DURATION,
  ensure,draw,frameFor,
  status:()=>({state:state.status,version:state.version,error:state.error,ready:[...cache.keys()]})
 });
 if(typeof module!=='undefined'&&module.exports)module.exports=root.ArenaBeastFX;
})(typeof window!=='undefined'?window:globalThis);
