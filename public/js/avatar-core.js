/* GLADIATOR — avatar foundation v1.5. No edits to the v1.4 combat loop.
 * Pure state management; equipment art remains intentionally absent until isolated sprites exist.
 * Browser: window.GladiatorAvatar  |  Node: module.exports */
(function(root, factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.GladiatorAvatar=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SCHEMA=1;
  const DEFAULT_APPEARANCE={skinTone:'warm',hairStyle:'crop',expression:'focused',bodyType:'chibi'};
  const ensure=(condition,message)=>{if(!condition)throw new Error(message);};
  const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj||{},key);
  const clone=obj=>JSON.parse(JSON.stringify(obj));
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const itemFor=(catalog,id)=>catalog.items[id]||null;
  const allowedClass=(catalog,id)=>own(catalog.classes,id);
  function validateCatalog(catalog){
    const errors=[];
    if(!catalog||typeof catalog!=='object')return ['Missing catalog'];
    if(!catalog.classes||!catalog.items||!catalog.slots||!catalog.stages)errors.push('Catalog is incomplete');
    if(errors.length)return errors;
    const slots=new Set(catalog.slots.map(x=>x.id));
    for(const [key,item] of Object.entries(catalog.items)){
      if(item.id!==key)errors.push('Item ID mismatch: '+key);
      if(!slots.has(item.slot))errors.push('Unknown slot: '+key);
      if(!allowedClass(catalog,item.classId))errors.push('Unknown class on item: '+key);
      if(!(item.durability>0))errors.push('Invalid durability: '+key);
    }
    for(const [key,klass] of Object.entries(catalog.classes)){
      for(const [slot,id] of Object.entries(klass.defaultItems||{})){
        if(!slots.has(slot))errors.push('Unknown default slot: '+slot);
        if(id && (!itemFor(catalog,id)||itemFor(catalog,id).classId!==key||itemFor(catalog,id).slot!==slot))errors.push('Bad default equipment: '+id);
      }
      for(const pose of catalog.render.poses||[]){
        if(!klass.poses?.[pose]?.composite)errors.push('Missing composite fallback: '+key+'/'+pose);
      }
    }
    return errors;
  }
  function slotsOf(catalog){return catalog.slots.map(slot=>slot.id);}
  function createAvatar(catalog,classId='murmillo',opts={}){
    ensure(allowedClass(catalog,classId),'Unknown class: '+classId);
    const stageId=opts.stageId||'captivus';
    ensure(catalog.stages.some(s=>s.id===stageId),'Unknown stage: '+stageId);
    const equipment=Object.fromEntries(slotsOf(catalog).map(slot=>[slot,null]));
    const avatar={schema:SCHEMA,classId,stageId,level:1,appearance:clone(DEFAULT_APPEARANCE),equipment,durability:{}};
    if(opts.appearance)for(const [key,val] of Object.entries(opts.appearance)){
      if(own(DEFAULT_APPEARANCE,key)&&catalog.appearanceOptions?.[key+'s']?.includes(val))avatar.appearance[key]=val;
    }
    if(opts.equipped===true){
      const preset=catalog.classes[classId].defaultItems||{};
      for(const id of Object.values(preset))if(id)applyEquip(catalog,avatar,id);
    }
    return avatar;
  }
  function applyEquip(catalog,avatar,itemId){
    const item=itemFor(catalog,itemId);
    ensure(item,'Unknown item: '+itemId);
    ensure(item.classId===avatar.classId,'Item class mismatch: '+itemId);
    ensure(own(avatar.equipment,item.slot),'Unknown equipment slot: '+item.slot);
    const last=avatar.equipment[item.slot];
    if(last)delete avatar.durability[last];
    avatar.equipment[item.slot]=itemId;avatar.durability[itemId]=item.durability;
    return avatar;
  }
  function equip(catalog,avatar,itemId){const next=clone(avatar);return applyEquip(catalog,next,itemId);}
  function unequip(catalog,avatar,slot){
    ensure(slotsOf(catalog).includes(slot),'Unknown slot: '+slot);
    const next=clone(avatar),id=next.equipment[slot];
    if(id)delete next.durability[id];next.equipment[slot]=null;return next;
  }
  function setClass(catalog,avatar,classId){
    ensure(allowedClass(catalog,classId),'Unknown class: '+classId);
    const next=createAvatar(catalog,classId,{stageId:avatar.stageId,appearance:avatar.appearance});
    next.level=avatar.level;return next;
  }
  function setStage(catalog,avatar,stageId){
    ensure(catalog.stages.some(s=>s.id===stageId),'Unknown stage: '+stageId);
    const next=clone(avatar);next.stageId=stageId;
    const stage=catalog.stages.find(s=>s.id===stageId);
    next.level=Math.max(next.level,stage.minLevel);
    return next;
  }
  function setAppearance(catalog,avatar,field,value){
    const options=catalog.appearanceOptions?.[field+'s'];
    ensure(Array.isArray(options)&&options.includes(value),'Unsupported appearance: '+field+'='+value);
    const next=clone(avatar);next.appearance[field]=value;return next;
  }
  function damageSlot(catalog,avatar,slot,amount){
    ensure(slotsOf(catalog).includes(slot),'Unknown slot: '+slot);
    const next=clone(avatar),id=next.equipment[slot];
    if(!id)return next;
    next.durability[id]=clamp(Math.round((next.durability[id]??itemFor(catalog,id).durability)-Math.max(0,amount)),0,itemFor(catalog,id).durability);
    return next;
  }
  function repairSlot(catalog,avatar,slot){
    ensure(slotsOf(catalog).includes(slot),'Unknown slot: '+slot);
    const next=clone(avatar),id=next.equipment[slot];
    if(id)next.durability[id]=itemFor(catalog,id).durability;return next;
  }
  function getSlotStates(catalog,avatar){
    return catalog.slots.map(slot=>{
      const id=avatar.equipment[slot.id],item=id?itemFor(catalog,id):null;
      const max=item?.durability||0,value=item?clamp(avatar.durability[id]??max,0,max):0;
      return {slot:slot.id,name:slot.name,itemId:id,itemName:item?.name||'미착용',durability:value,maxDurability:max,broken:!!item&&value<=0,equipped:!!item};
    });
  }
  /* Never stack loose overlays on top of an already-composed sprite.
     Layered mode only becomes available once transparent base and EVERY equipped item
     has a matching pose asset; otherwise keep the original 18 animation files. */
  function getRenderPlan(catalog,avatar,pose='idle'){
    ensure(catalog.render.poses.includes(pose),'Unknown pose: '+pose);
    const klass=catalog.classes[avatar.classId],spec=klass.poses[pose];
    const requirements=getSlotStates(catalog,avatar).filter(s=>s.equipped&&!s.broken);
    const ready=!!spec.base&&requirements.every(s=>!!itemFor(catalog,s.itemId)?.appearanceByPose?.[pose]);
    if(!ready)return {mode:'composite',pose,src:spec.composite,drawOrder:[],reason:'투명 베이스/장비별 스프라이트 미제작',equipmentVisualsLive:false};
    const layerMap={base:spec.base};
    for(const s of requirements){
      const item=itemFor(catalog,s.itemId);
      layerMap[s.slot]=item.appearanceByPose[pose];
    }
    return {mode:'layered',pose,src:null,drawOrder:catalog.render.order.filter(k=>layerMap[k]).map(k=>({slot:k,src:layerMap[k]})),reason:'',equipmentVisualsLive:true};
  }
  function exportAvatar(avatar){return JSON.stringify(avatar,null,2);}
  function importAvatar(catalog,text){
    const raw=typeof text==='string'?JSON.parse(text):text;
    ensure(raw&&raw.schema===SCHEMA,'Unsupported avatar schema');
    const out=createAvatar(catalog,raw.classId,{stageId:raw.stageId,appearance:raw.appearance});
    out.level=clamp(Math.floor(Number(raw.level)||1),1,100);
    for(const slot of slotsOf(catalog)){
      const id=raw.equipment?.[slot];if(!id)continue;
      const item=itemFor(catalog,id);
      ensure(item&&item.classId===out.classId&&item.slot===slot,'Invalid equipped item: '+id);
      applyEquip(catalog,out,id);
      out.durability[id]=clamp(Math.floor(Number(raw.durability?.[id]??item.durability)),0,item.durability);
    }
    return out;
  }
  return {SCHEMA,validateCatalog,createAvatar,equip,unequip,setClass,setStage,setAppearance,damageSlot,repairSlot,getSlotStates,getRenderPlan,exportAvatar,importAvatar};
});
