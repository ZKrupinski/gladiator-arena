/* GLADIATOR SpriteMotionRegistry
 * Shared New Champion Murmillo 9x8 core contract + optional motions.
 * Additional animations are registered ONLY when eight individual approved
 * frames exist. A registry entry never implies the artwork has been generated.
 */
(function(root){'use strict';
const CORE=Object.freeze(['idle','walk','slash','sweep','thrust','heavy','guard','hit','death']);
const BEASTS=Object.freeze(['wolf','leopard','tiger','lion','elephant']);
const SEMANTICS=Object.freeze({
 wolf:{slash:'bite',sweep:'claw',thrust:'leap',heavy:'charge',guard:'crouch_guard'},
 leopard:{slash:'bite',sweep:'claw',thrust:'leap',heavy:'pounce',guard:'crouch_guard'},
 tiger:{slash:'bite',sweep:'claw',thrust:'leap',heavy:'pounce',guard:'crouch_guard'},
 lion:{slash:'bite',sweep:'claw',thrust:'leap',heavy:'pounce',guard:'crouch_guard'},
 elephant:{slash:'tusk',sweep:'trunk_sweep',thrust:'rush',heavy:'stomp',guard:'brace'}
});
const map=new Map();
function blank(type){return {type,core:[...CORE],extra:new Map(),semantics:SEMANTICS[type]||{}};}
for(const type of [...BEASTS,'murmillo','retiarius','thraex','murmillo_champion_red']){
 const p=blank(type);if(BEASTS.includes(type))p.extra.set('roar',{name:'roar',fps:8,paths:null,status:'awaiting_art',frames:null,promise:null});
 map.set(type,p);
}
function profile(type){return map.get(type)||null;}
function registerCharacter(type,{extras=[],semantics={}}={}){
 if(!/^[a-z][a-z0-9_-]{1,48}$/.test(type))throw Error('Invalid character ID');
 const p=map.get(type)||blank(type);
 p.semantics={...p.semantics,...semantics};map.set(type,p);
 for(const motion of extras)registerExtra(type,motion);
 return p;
}
function registerExtra(type,record){
 if(!map.has(type))registerCharacter(type);
 const name=record?.name;
 if(!/^[a-z][a-z0-9_-]{1,47}$/.test(name||'')||CORE.includes(name))
  throw Error('Extra must have a distinct lower-case animation name');
 const paths=record.paths;
 if(!Array.isArray(paths)||paths.length!==8||
   paths.some(p=>typeof p!=='string'||!/^assets\/[a-z0-9_./-]+\.(png|webp)(\?v=[a-z0-9_.-]+)?$/i.test(p)||p.includes('..')))
  throw Error('Extra requires exactly eight local transparent sprite images');
 const fps=Math.max(2,Math.min(24,Number(record.fps)||8));
 const value={name,fps,paths:[...paths],status:'unloaded',frames:null,promise:null};
 map.get(type).extra.set(name,value);
 return value;
}
function describe(type){const p=map.get(type);if(!p)return null;return {
 type,core:[...p.core],semantics:{...p.semantics},extras:[...p.extra.values()].map(
 e=>({name:e.name,fps:e.fps,registered:!!e.paths,ready:e.status==='ready',status:e.status}))
};}
function hasExtra(type,name){return map.get(type)?.extra.get(name)?.status==='ready';}
function getExtraFrames(type,name){return hasExtra(type,name)?map.get(type).extra.get(name).frames:null;}
function loadExtra(type,name){
 const action=map.get(type)?.extra.get(name);
 if(!action?.paths)return Promise.resolve(false);
 if(action.status==='ready')return Promise.resolve(true);
 if(action.promise)return action.promise;
 if(typeof Image==='undefined')return Promise.resolve(false);
 action.status='loading';
 action.promise=Promise.all(action.paths.map(src=>new Promise((resolve,reject)=>{
  const image=new Image();
  image.onload=()=>image.naturalWidth>=64&&image.naturalHeight>=64?resolve(image):reject(Error('Too small '+src));
  image.onerror=()=>reject(Error('Missing approved extra frame '+src));
  image.src=src;
 }))).then(frames=>{action.frames=frames;action.status='ready';return true;})
 .catch(()=>{action.status='missing_assets';return false;})
 .finally(()=>{action.promise=null});
 return action.promise;
}
function canRoar(type){
 if(hasExtra(type,'roar'))return true;
 // The wolf V3 opt-in art preview can also carry an approved roar atlas.
 const v=root.ArenaBeasts?.status?.()?.wolfV3;
 return type==='wolf'&&v?.status==='ready'&&v.actions?.includes('roar');
}
function triggerStandoffRoar(f,other,now,dt,rng=Math.random){
 if(!f?.beastType||!other||!canRoar(f.beastType)||f.dead||other.dead||f.stagger>0||
 f.actionT>0||f.guard||f.comboDash||f.dodge>0||f.knockT>0)return false;
 if(!Number.isFinite(now)||!Number.isFinite(dt)||dt<=0||dt>.2)return false;
 const distance=Math.abs((f.x||0)-(other.x||0));
 if(distance<Math.max(340,1.9*Math.max(f.cfg?.reach||170,other.cfg?.reach||170))||
   Math.abs(f.vx||0)>55||Math.abs(other.vx||0)>65||
   now<(f._beastRoarCooldownUntil||0))return false;
 if(rng()>=Math.min(1,dt*.10))return false;
 f._beastRoarSince=now;
 f._beastRoarUntil=now+1.0;
 f._beastRoarCooldownUntil=now+9+Math.max(0,Math.min(1,rng()))*5;
 return true;
}
function overridePose(f,pose,now){
 if(!f?.beastType||!canRoar(f.beastType))return pose;
 if((pose==='idle'||pose==='walk')&&now>=f._beastRoarSince&&
   now<(f._beastRoarUntil||0)&&!f.guard&&f.actionT<=0&&!f.dead&&
   Math.abs(f.vx||0)<60)return 'special';
 return pose;
}
root.SpriteMotionRegistry={version:'1.0.0',CORE,BEASTS,profile,describe,registerCharacter,
 registerExtra,loadExtra,hasExtra,getExtraFrames,canRoar,triggerStandoffRoar,overridePose};
})(typeof window!=='undefined'?window:globalThis);
