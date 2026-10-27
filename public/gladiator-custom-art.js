/* Generic approved 9-action x 8-frame custom gladiator renderer.
 * New registry looks use their OWN unique assets/combat/<id>/ files.
 * Never fall back to another gladiator's costume when an atlas is missing.
 */
(function(root){'use strict';
const registry=root.SpartacusGladiators;
if(!registry)throw Error('Gladiator registry must load before custom art');
const actions=registry.ACTIONS,PER=8,W=960,H=540;
const state=new Map(),listeners=new Map(),clockHistory=new WeakMap();
const animationFPS={idle:6,walk:9,slash:14,sweep:14,thrust:14,heavy:12,guard:7,hit:10,death:10};
const aliases={attack:'slash',special:'heavy',finisher:'heavy',defeat:'death',
 dodge:'walk',dash:'heavy',parry:'guard',victory:'idle',net:'slash'};
function getState(id){
 if(!registry.isCustom(id))return null;
 if(!state.has(id))state.set(id,{frames:new Map(),tasks:new Map(),status:'unloaded',portrait:null});
 return state.get(id);
}
function notify(id){
 for(const fn of listeners.get(id)||[])try{fn();}catch(error){root.console?.warn?.(error);}
}
function loadAction(id,action='idle'){
 const st=getState(id);if(!st)return Promise.resolve(null);
 const name=actions.includes(action)?action:(aliases[action]||'idle');
 if(st.frames.has(name))return Promise.resolve(st.frames.get(name));
 if(st.tasks.has(name))return st.tasks.get(name);
 const path=registry.artPath(id,name);if(!path)return Promise.resolve(null);
 const task=new Promise((resolve,reject)=>{
  const img=new Image();
  img.onload=()=>{
   if(img.naturalWidth!==3840||img.naturalHeight!==1080)
    return reject(Error('Wrong 4×2 sprite size: '+path));
   const frames=Array.from({length:PER},(_,i)=>{
    const canvas=root.document.createElement('canvas');canvas.width=W;canvas.height=H;
    canvas.getContext('2d').drawImage(img,(i%4)*W,Math.floor(i/4)*H,W,H,0,0,W,H);
    return canvas;
   });
   resolve(frames);
  };
  img.onerror=()=>reject(Error('Missing unique gladiator art: '+path));
  img.src='/'+path+'?v=unified-registry-v1';
 }).then(frames=>{
  st.frames.set(name,frames);st.status='ready';
  if(name==='idle'){st.portrait=null;notify(id);}
  return frames;
 }).catch(e=>{
  st.status='missing '+name;root.console?.warn?.(e);return null;
 }).finally(()=>st.tasks.delete(name));
 st.tasks.set(name,task);return task;
}
function loadAssets(id){return loadAction(id,'idle').then(v=>{
 if(!v)return false;
 for(const action of ['walk','slash','heavy','guard','hit','death'])loadAction(id,action);
 return true;
});}
function onReady(id,fn){
 if(typeof fn!=='function')return()=>{};
 if(!listeners.has(id))listeners.set(id,new Set());
 const all=listeners.get(id);all.add(fn);
 if(getState(id)?.frames.has('idle'))root.queueMicrotask?.(fn);
 return()=>all.delete(fn);
}
function frame(id,name='idle',tick=0){
 const st=getState(id);if(!st)return null;
 const action=actions.includes(name)?name:(aliases[name]||'idle');
 if(!st.frames.has(action))loadAction(id,action);
 return st.frames.get(action)?.[Math.max(0,Math.floor(Number(tick)||0))%PER]||
  st.frames.get('idle')?.[0]||null;
}
function portrait(id){
 const st=getState(id);if(!st)return null;
 if(st.portrait)return st.portrait;
 const img=frame(id,'idle',0);if(!img)return null;
 const canvas=root.document.createElement('canvas');canvas.width=canvas.height=540;
 canvas.getContext('2d').drawImage(img,210,0,540,540,0,0,540,540);
 return st.portrait=canvas;
}
function actionAt(f,clock){
 const raw=f?.dead||f?.hp<=0?'death':f?.action==='attack'&&f?.actionT>0?
  ['slash','sweep','thrust'][f.attackVariant]||'slash':
  f?.action==='special'||f?.comboDash?'heavy':f?.action||'idle';
 const name=actions.includes(raw)?raw:(aliases[raw]||'idle');
 const elapsed=Math.max(0,Number(clock)||0);
 let idx=0;
 if(['idle','walk','guard'].includes(name))idx=Math.floor(elapsed*(animationFPS[name]||8))%PER;
 else{
  const duration=Number(f?.actionDuration)||.7;
  idx=Math.min(7,Math.floor(Math.max(0,Math.min(1,1-(Number(f?.actionT)||0)/duration))*8));
 }
 return {name,idx};
}
function draw(ctx,{id,fighter,clock=0,x=0,y=0,w=540,h=540,flip=false,alpha=1}={}){
 if(!ctx)return false;
 const code=id||fighter?.registeredAppearance;
 if(!registry.isCustom(code))return false;
 const pose=actionAt(fighter,clock);
 const image=frame(code,pose.name,pose.idx);
 if(!image)return false;
 const scale=Math.min((Number(w)||540)/H,(Number(h)||540)/H);
 const anchor=Number(x)+(Number(w)||540)/2,feet=Number(y)+(Number(h)||540);
 ctx.save();ctx.globalAlpha*=alpha;
 if(flip){ctx.translate(anchor,0);ctx.scale(-1,1);ctx.translate(-anchor,0);}
 ctx.drawImage(image,anchor-480*scale,feet-512*scale,W*scale,H*scale);
 ctx.restore();return true;
}
const api=Object.freeze({actions,loadAction,loadAssets,onReady,frame,portrait,draw,
 status:id=>getState(id)?.status||'not-registered'});
root.SpartacusExtraGladiatorArt=api;
registry.subscribe(list=>{for(const item of list)if(item.kind==='custom')loadAssets(item.visualId);});
for(const item of registry.custom())loadAssets(item.visualId);
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
