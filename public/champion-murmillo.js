/* Champion Murmillo · 9 actions × 8 individually isolated key drawings.
 * Custom sprite renderer only; legacy 5-stage Murmillo remains untouched.
 * Uses proper 16:9 independent frames after asset build, with source-sheet
 * emergency fallback while the CI export is running. No blur/strip warping/VFX.
 */
(function(root){
'use strict';
const VARIANT='murmillo_champion_red';
const FPS={idle:6,walk:9,slash:14,sweep:14,thrust:14,heavy:12,guard:7,hit:10,death:10};
const ACTIONS=Object.keys(FPS);
const BASE='assets/combat/champion-murmillo/';
const cache=new Map(),pending=new Map();
let manifest=null,sourceFallback=false,status='loading',startPromise=null,portraitCache=null;
const motionHistory=new WeakMap();
const observers=new Set();
function notifyReady(){for(const fn of observers){try{fn();}catch(error){console.warn('Champion portrait refresh:',error);}}}
function onReady(fn){if(typeof fn!=='function')return ()=>{};observers.add(fn);if(cache.has('idle'))queueMicrotask(fn);return ()=>observers.delete(fn);}
function loadImage(url){return new Promise((resolve,reject)=>{
 const im=new Image();
 im.onload=()=>resolve(im);
 im.onerror=()=>reject(Error('sprite unavailable: '+url));
 im.src=url;
});}
async function loadSourceAction(action){
 const image=await loadImage(BASE+'source/'+action+'.png?v=2');
 if(image.naturalWidth!==1672||image.naturalHeight!==941)throw Error('source sheet size mismatch');
 const w=image.naturalWidth/4,h=Math.floor(image.naturalHeight/2);
 return Array.from({length:8},(_,i)=>{
  const c=document.createElement('canvas');c.width=960;c.height=540;
  // Individual 16:9 padding, no source-pixel resampling.
  c.getContext('2d').drawImage(image,(i%4)*w,Math.floor(i/4)*h,w,h,
                                 (960-w)/2,512-h,w,h);
  return {canvas:c,pivotX:480,footY:512};
 });}
async function loadAction(action){
 if(!ACTIONS.includes(action))return null;
 if(cache.has(action)){const v=cache.get(action);cache.delete(action);cache.set(action,v);return v;}
 if(pending.has(action))return pending.get(action);
 const request=(async()=>{
  let frames;
  if(manifest){
   const info=manifest.actions[action];
   if(!Array.isArray(info)||info.length!==8)throw Error('missing animation '+action);
   frames=await Promise.all(info.map(async f=>{
    const img=await loadImage(BASE+f.file+'?v=2');
    if(img.naturalWidth!==960||img.naturalHeight!==540)throw Error('incorrect 16:9 keypose size');
    return {canvas:img,pivotX:f.pivotX,footY:f.footY};
   }));
  }else frames=await loadSourceAction(action);
  cache.set(action,frames);
  // Idle is never evicted: portraits, startup and any action transition must
  // always use this champion's own artwork, never the old Murmillo atlas.
  while(cache.size>4){const candidate=[...cache.keys()].find(key=>key!=='idle'&&key!==action);if(!candidate)break;cache.delete(candidate);}
  if(action==='idle'){portraitCache=null;notifyReady();}
  return frames;
 })().finally(()=>pending.delete(action));
 pending.set(action,request);
 return request;
}
async function loadAssets(){
 if(startPromise)return startPromise;
 if(typeof document==='undefined'||typeof fetch==='undefined')return Promise.resolve(false);
 startPromise=(async()=>{
  try{
   const res=await fetch(BASE+'manifest.json?v=2',{cache:'no-store'});
   if(res.ok){
    const file=await res.json();
    if(file.character===VARIANT&&Object.keys(file.actions||{}).length===9){
     manifest=file;status='individual-72';
    }
   }
  }catch(err){}
  if(!manifest){sourceFallback=true;status='source-sheets';}
  try{await loadAction('idle');
   // Load the walk cycle before player motion starts, avoiding idle-frame jitter.
   loadAction('walk').catch(err=>{status='walk: '+err.message;});
   return true;
  }catch(err){status='error: '+err.message;return false;}
 })();
 return startPromise;
}
function sample(f,scene,clock){
 if(root.MurmilloMotion?.stateAt)return root.MurmilloMotion.stateAt(f,scene,clock);
 if(f?.dead)return {action:'death',progress:1,loop:false};
 return {action:Math.abs(f?.vx||0)>7?'walk':'idle',progress:0,loop:true};
}
function motion(f,scene,clock){
 const st=sample(f,scene,clock);
 const action=st.action==='defeat'||st.action==='death'?'death':
   st.action==='dodge'?'walk':st.action==='dash'?'heavy':
   st.action==='victory'?'idle':
   ACTIONS.includes(st.action)?st.action:'idle';
 const looping=['idle','walk','guard'].includes(action);
 const tick=Number.isFinite(clock)?Math.max(0,clock):0;
 const seed=(f?.footworkSeed||0)*.13;
 let index;
 if(action==='walk'&&f){
  // Eight genuine walking drawings, stepped in order and paced by movement.
  // Starting a new stride at frame zero avoids snapping between idle and a
  // random globally-clocked mid-stride pose.
  const prev=motionHistory.get(f);
  const dt=prev?.action==='walk'?Math.max(0,Math.min(.07,tick-prev.tick)):0;
  const speed=Math.max(.78,Math.min(1.16,Math.abs(f.vx||0)/180||1));
  const phase=(prev?.action==='walk'?prev.phase:0)+dt*FPS.walk*speed;
  motionHistory.set(f,{action,tick,phase});
  index=Math.floor(phase)%8;
 }else{
  motionHistory.set(f,{action,tick,phase:0});
  index=looping?Math.floor((tick+seed)*FPS[action])%8:
    Math.min(7,Math.max(0,Math.floor((st.progress??0)*8)));
 }
 return {action,index,looping};
}
function actionFrames(name){return cache.get(name)||null;}
// Upper-body follow-through grows toward the opponent while the planted toe
// remains an unmoving ground anchor. Applied only to authored attack poses.
const ATTACK_LEAN={
 slash:[0,.025,.065,.095,.105,.055,.018,0],
 sweep:[0,.025,.07,.105,.115,.07,.02,0],
 thrust:[0,.03,.085,.135,.15,.105,.04,0],
 heavy:[0,.02,.06,.1,.115,.065,.025,0]
};
function paint(ctx,frame,x,y,w,h,flip,alpha,scaleFactor=1,lean=0){
 const scale=Math.min(w/540,h/540)*scaleFactor;
 const image=frame?.canvas;
 if(!image)return false;
 ctx.save();ctx.globalAlpha*=alpha;
 const anchor=x+w/2,feet=y+h;
 if(flip){ctx.translate(anchor,0);ctx.scale(-1,1);ctx.translate(-anchor,0);}
 if(lean){
  // Shear about floor contact, NOT the changing artwork/bounding box.
  ctx.translate(anchor,feet);
  ctx.transform(1,0,-lean,1,0,0);
  ctx.translate(-anchor,-feet);
 }
 // Real artwork is ~400px across inside an intentionally padded 960px canvas.
 ctx.drawImage(image,anchor-frame.pivotX*scale,feet-frame.footY*scale,
                       image.width*scale,image.height*scale);
 ctx.restore();return true;
}
function draw(ctx,options){
 const o=options||{},f=o.fighter; if(!ctx||!f)return false;
 const state=motion(f,o.scene,o.clock);
 const frames=actionFrames(state.action);
 if(!frames)loadAction(state.action).catch(err=>{status='error: '+err.message;});
 const fallback=frames||actionFrames('idle');
 if(!fallback)return false;
 return paint(ctx,fallback[frames?state.index:0],o.x,o.y,o.w,o.h,o.flip,o.alpha??1,
              1,
              frames?(ATTACK_LEAN[state.action]?.[state.index]||0):0);
}
function frame(action='idle',tick=0){
 const name=ACTIONS.includes(action)?action:'idle';
 if(!cache.has(name))loadAction(name).catch(()=>{});
 const list=cache.get(name)||cache.get('idle');
 return list?.[Math.floor(Math.max(0,tick))%8]?.canvas||null;
}
function portrait(){
 const img=frame('idle',0);if(!img)return null;
 if(portraitCache)return portraitCache;
 // Champion-only roster artwork: crop the central 960×540 sprite's wide
 // transparent margins. Never borrow a thumbnail from growth-tier Murmillo.
 const canvas=document.createElement('canvas');canvas.width=500;canvas.height=520;
 canvas.getContext('2d').drawImage(img,260,25,490,515,0,0,500,520);
 return portraitCache=canvas;
}
root.ChampionMurmillo={version:'2.0.0',variant:VARIANT,FPS,ACTIONS,loadAssets,onReady,
 draw,portrait,frame,motion,status:()=>status,hasFrames:()=>cache.has('idle'),
 hasIndividualFrames:()=>!!manifest};
if(typeof document!=='undefined')loadAssets();
if(typeof module!=='undefined'&&module.exports)module.exports=root.ChampionMurmillo;
})(globalThis);
