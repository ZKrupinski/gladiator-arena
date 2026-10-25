/* Spartacus recovery economy v69: serious injury comes ONLY from deliberately
 * repeated bouts with BOTH untreated injury and fatigue. A knockout or a
 * heavy hit alone can never trigger a new severe injury. */
(function(root){
'use strict';
const bounded=(x,lo,hi)=>Math.min(hi,Math.max(lo,Number(x)||0));
const severe=h=>!!h?.severeInjury;
const tired=h=>bounded(h?.fatigue,0,100)>0;
const hurt=h=>bounded(h?.injury,0,120)>0;
function healQuote(h){
 const injury=bounded(h?.injury,0,120),level=bounded(h?.level,0,50);
 const serious=severe(h);
 return {needed:injury>0||serious,severe:serious,
  gold:serious?Math.max(520,Math.ceil(injury*4+level*10+200)):Math.max(12,Math.ceil(injury*.6)),
  glory:serious?12+Math.ceil(level/4):0};
}
function restQuote(h){
 const fatigue=bounded(h?.fatigue,0,100);
 return {needed:fatigue>0,gold:Math.max(18,Math.round(16+fatigue*.75)),glory:0};
}
// A bout is risky only when both conditions already existed BEFORE entering
// combat. Repeated risky bouts without either recovery action raise the rare
// chance: third 1%, fourth 1.5%, fifth and later 2%.
// Existing normal injury scores above 80 keep their regular treatment quote;
// only the severeInjury flag marks an actual severe-injury event.
function maybeSevere(h,{injuryBefore=0,fatigueBefore=0,glory=0,rosterCount=1,roll=Math.random}={}){
 if(!h||severe(h))return false;
 const bothUntreated=bounded(injuryBefore,0,120)>0&&bounded(fatigueBefore,0,100)>0;
 if(!bothUntreated){h.untreatedBouts=0;return false;}
 h.untreatedBouts=Math.min(50,Math.max(0,Math.floor(Number(h.untreatedBouts)||0))+1);
 if(h.untreatedBouts<3)return false;
 // Do not irreversibly strand the only available character, or create a
 // high-honor treatment obligation before the economy can support it.
 if(rosterCount<2||bounded(glory,0,Infinity)<12+Math.ceil(bounded(h.level,0,50)/4))return false;
 const chance=Math.min(.02,.01+(h.untreatedBouts-3)*.005);
 if(Number(roll())>=chance)return false;
 h.injury=Math.max(85,bounded(h.injury,0,120));
 h.severeInjury=true;
 return true;
}
function recovered(h){
 if(!h)return;
 h.untreatedBouts=0;
}
const api={healQuote,restQuote,maybeSevere,severe,recovered};
root.LudusRecovery=api;
if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
