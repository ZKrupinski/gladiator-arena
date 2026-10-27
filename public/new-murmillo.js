/* New Murmillo appearance: 9 independent 8-frame transparent atlases.
 * Existing champion, Murmillo Motion, growth skins and all combat balance stay unchanged.
 * Provisional SpriteForge art: retain all eight frames; warn instead of dropping slots.
 */
(function(root){
'use strict';
const VARIANT='murmillo_redcrest_new_v1';
const BASE='assets/combat/murmillo-redcrest-v1/';
const FPS={idle:6,walk:9,slash:14,sweep:14,thrust:14,heavy:12,guard:7,hit:10,death:10};
const ACTIONS=Object.keys(FPS), FRAMES_PER_ACTION=8, CELL_W=960,CELL_H=540;
const cache=new Map(),pending=new Map(),history=new WeakMap();
let status='loading',portraitCache=null;
const listeners=new Set();
function loadImage(url){return new Promise((resolve,reject)=>{
 const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('missing new Murmillo sprite: '+url));im.src=url;
});}
function loadAction(action){
 if(!ACTIONS.includes(action))return Promise.resolve(null);
 if(cache.has(action))return Promise.resolve(cache.get(action));
 if(pending.has(action))return pending.get(action);
 const task=loadImage(BASE+action+'.png?v=20261027-new').then(img=>{
  if(img.naturalWidth!==CELL_W*4||img.naturalHeight!==CELL_H*2)throw new Error('Invalid 4x2 sprite: '+action);
  // Keep all 8 frames, even if QA flags ownership for later repair.
  const frames=Array.from({length:FRAMES_PER_ACTION},(_,i)=>{
   const canvas=document.createElement('canvas');canvas.width=CELL_W;canvas.height=CELL_H;
   canvas.getContext('2d').drawImage(img,i%4*CELL_W,Math.floor(i/4)*CELL_H,CELL_W,CELL_H,0,0,CELL_W,CELL_H);
   return canvas;
  });
  cache.set(action,frames);status='ready';
  if(action==='idle'){portraitCache=null;for(const f of listeners){try{f()}catch(e){console.warn(e)}}}
  while(cache.size>4){
   const oldest=[...cache.keys()].find(a=>a!=='idle'&&a!==action);
   if(!oldest)break;cache.delete(oldest);
  }
  return frames;
 }).catch(error=>{status='error: '+error.message;throw error}).finally(()=>pending.delete(action));
 pending.set(action,task);return task;
}
function loadAssets(){return loadAction('idle').then(()=>{loadAction('walk').catch(()=>{});return true;}).catch(()=>false)}
function onReady(fn){if(typeof fn!=='function')return()=>{};listeners.add(fn);if(cache.has('idle'))queueMicrotask(fn);return()=>listeners.delete(fn)}
function getAction(f,scene,clock){
 const st=root.MurmilloMotion?.stateAt?.(f,scene,clock)||
   (f?.dead?{action:'death',progress:1,loop:false}:{action:Math.abs(f?.vx||0)>7?'walk':'idle',progress:0,loop:true});
 const actual={defeat:'death',dodge:'walk',dash:'heavy',victory:'idle'}[st.action]||st.action;
 const action=ACTIONS.includes(actual)?actual:'idle';
 let index=0;
 const time=Number.isFinite(clock)?clock:0;
 if(action==='walk'&&f){
  const prev=history.get(f),dt=prev?.action==='walk'?Math.max(0,Math.min(.06,time-prev.time)):0;
  const phase=(prev?.action==='walk'?prev.phase:0)+dt*FPS.walk;
  history.set(f,{action,time,phase});index=Math.floor(phase)%FRAMES_PER_ACTION;
 }else{
  history.set(f,{action,time,phase:0});
  index=['idle','walk','guard'].includes(action)?
    Math.floor(Math.max(0,time)*FPS[action])%FRAMES_PER_ACTION:
    Math.min(7,Math.max(0,Math.floor((st.progress??0)*8)));
 }
 return {action,index};
}
function draw(ctx,opts){
 const o=opts||{},f=o.fighter;
 if(!ctx||!f)return false;
 const st=getAction(f,o.scene,o.clock);
 if(!cache.has(st.action))loadAction(st.action).catch(()=>{});
 const image=cache.get(st.action)?.[st.index]||cache.get('idle')?.[0];
 if(!image)return false;
 const w=Number(o.w)||540,h=Number(o.h)||540;
 const scale=Math.min(w/CELL_H,h/CELL_H);
 const x=Number(o.x)||0,y=Number(o.y)||0;
 const anchor=x+w/2,feet=y+h;
 ctx.save();ctx.globalAlpha*=o.alpha??1;
 if(o.flip){ctx.translate(anchor,0);ctx.scale(-1,1);ctx.translate(-anchor,0);}
 ctx.drawImage(image,anchor-480*scale,feet-512*scale,CELL_W*scale,CELL_H*scale);
 ctx.restore();
 return true;
}
function frame(name='idle',index=0){
 const action=ACTIONS.includes(name)?name:'idle';
 if(!cache.has(action))loadAction(action).catch(()=>{});
 return cache.get(action)?.[Math.floor(Math.max(0,index))%8]||cache.get('idle')?.[0]||null;
}
function portrait(){
 if(portraitCache)return portraitCache;
 const f=frame('idle',0);
 if(!f)return null;
 const c=document.createElement('canvas');c.width=c.height=540;
 c.getContext('2d').drawImage(f,210,0,540,540,0,0,540,540);
 return portraitCache=c;
}
root.NewMurmillo={version:'1.0.0',variant:VARIANT,ACTIONS,FPS,loadAssets,loadAction,onReady,
 draw,frame,portrait,status:()=>status,hasFrames:()=>cache.has('idle')};
if(typeof document!=='undefined')loadAssets();
if(typeof module!=='undefined'&&module.exports)module.exports=root.NewMurmillo;
})(globalThis);
