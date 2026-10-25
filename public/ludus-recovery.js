/* Spartacus recovery economy v68. Applies only to actual settled arena bouts.
 * Ordinary injuries retain their legacy price. Severe injuries (80+) demand
 * a costly treatment and honors; early squads with no viable reserve/renown
 * do not roll an extra severe injury. All UI quotes use this exact model.
 */
(function(root){
'use strict';
const bounded=(x,lo,hi)=>Math.min(hi,Math.max(lo,Number(x)||0));
const severe=h=>!!h?.severeInjury||bounded(h?.injury,0,120)>=80;
function healQuote(h){
 const injury=bounded(h?.injury,0,120),level=bounded(h?.level,0,50);
 const serious=severe(h);
 return {needed:injury>0||!!h?.severeInjury,severe:serious,
  gold:serious?Math.max(520,Math.ceil(injury*4+level*10+200)):Math.max(12,Math.ceil(injury*.6)),
  glory:serious?12+Math.ceil(level/4):0};
}
function restQuote(h){
 const fatigue=bounded(h?.fatigue,0,100);
 return {needed:fatigue>0,gold:Math.max(18,Math.round(16+fatigue*.75)),glory:0};
}
// Stable, idempotent once per match because the combat settlement is guarded.
// No injury spike for a healthy rookie squad unable to pay the honor cost,
// and no extra injury while already severely injured.
function maybeSevere(h,{knockout=false,damageRatio=0,glory=0,rosterCount=1,roll=Math.random}={}){
 if(!h||severe(h)||bounded(h?.injury,0,120)>=80)return false;
 if(rosterCount<2||bounded(glory,0,Infinity)<12+Math.ceil(bounded(h.level,0,50)/4))return false;
 const severity=bounded(damageRatio,0,1);
 const chance=knockout?.075:severity>=.70?.025:severity>=.40?.008:0;
 if(chance===0||Number(roll())>=chance)return false;
 h.injury=Math.max(85,bounded(h.injury,0,120));
 h.severeInjury=true;
 return true;
}
const api={healQuote,restQuote,maybeSevere,severe};
root.LudusRecovery=api;
if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
