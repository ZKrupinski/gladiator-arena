/* GLADIATOR Avatar Resource Registry v1.6
 * Data-only staging loader; does not replace original fight renderer.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.GladiatorAvatarResources=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const CLASS_IDS=['murmillo','thraex','retiarius'];
const STAGES=['trainee','novice','gladiator','veteran','champion'];
const POSES=['idle','walk','guard','high','mid','low'];
const ABSENT='not-created';
function validateRig(rig){
 const errors=[];
 if(!rig||rig.canonicalRigId!=='gladiator_sd_shared_v1')errors.push('Invalid shared rig ID');
 if(!rig?.canvas||rig.canvas.width!==320||rig.canvas.height!==320)errors.push('Shared canvas mismatch');
 if(rig?.scalePolicy?.classScale!==1||rig?.scalePolicy?.stageScale!==1)errors.push('Body scale must stay 1');
 if(!Array.isArray(rig?.slots)||!rig.slots.some(s=>s.id==='weapon'))errors.push('Missing essential slots');
 return errors;
}
function validateManifest(rig,manifest){
 const errors=validateRig(rig);
 if(!CLASS_IDS.includes(manifest?.classId))errors.push('Unknown class ID');
 if(manifest?.rig!==rig?.canonicalRigId)errors.push('Rig mismatch');
 if(manifest?.bodyScale!==1)errors.push('Noncanonical body scale');
 for(const stage of STAGES){
  const kit=manifest?.stageLoadouts?.[stage];
  if(!kit)errors.push('Missing stage: '+stage);
  else for(const [slot,id] of Object.entries(kit)){
   if(id!==null&&!manifest?.equipment?.[slot]?.variants?.[stage])errors.push('Unknown stage item: '+slot+' '+stage);
   if(id&&manifest?.equipment?.[slot]?.variants?.[stage]?.id!==id)errors.push('Wrong item ID: '+id);
  }
 }
 for(const pose of POSES)if(!(pose in (manifest?.poseAssets||{})))errors.push('Missing pose: '+pose);
 return errors;
}
function getResourceReport(rig,manifest){
 const errors=validateManifest(rig,manifest);
 const all=Object.values(manifest.equipment||{}).flatMap(s=>Object.values(s.variants||{}));
 const created=all.filter(v=>v.productionStatus!==ABSENT&&v.resource);
 const missing=all.filter(v=>v.productionStatus===ABSENT||!v.resource);
 const legacyAvailable=POSES.every(p=>!!manifest.legacyCompositePath&&manifest.legacyCompositePath.includes('{pose}'));
 return {classId:manifest.classId,errors,mode:missing.length===0&&!!manifest.baseBody?.sprite2d?'layered-ready':'composite-fallback',createdCount:created.length,pendingCount:missing.length,totalCount:all.length,legacyAvailable,requiredRuntimeReady:errors.length===0&&missing.length===0&&!!manifest.baseBody?.sprite2d};
}
function getLoadout(manifest,stage='trainee'){
 if(!STAGES.includes(stage))throw new Error('Unknown stage: '+stage);
 return {...manifest.stageLoadouts[stage]};
}
async function load(fetcher=fetch,prefix='./assets/'){
 const source=async uri=>{const res=await fetcher(prefix+uri);if(!res.ok)throw Error('HTTP '+res.status+' '+uri);return res.json();};
 const rig=await source('data/avatar-rig.shared.json');
 const animation=await source('data/avatar-animations.json');
 const classes={};for(const id of CLASS_IDS)classes[id]=await source('avatars/'+id+'/manifest.json');
 const reports=Object.fromEntries(CLASS_IDS.map(id=>[id,getResourceReport(rig,classes[id])]));
 return {rig,animation,classes,reports,ready:Object.values(reports).every(r=>r.errors.length===0)};
}
return {CLASS_IDS,STAGES,POSES,validateRig,validateManifest,getResourceReport,getLoadout,load};
});