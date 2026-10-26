/* Spartacus Training Aptitude v72. A failed training consumes the quoted
 * denarii but awards no stat/XP. Risk uses both lifetime total bouts
 * of training and repeated concentration in the selected ability. Uses immutable Lv.0 identity, NEVER mutable
 * current stats. DEF and END have independent training attempts/cost/gains.
 * DEF's inherited training aptitude comes from immutable birth END potential.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 root.LudusTrainingRisk=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const KEYS=['str','agi','def','end','focus'];
 const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,Number.isFinite(+v)?+v:lo));
 const attempts=(h,key)=>Math.max(0,Math.floor(Number(h?.trainingAttempts?.[key])||0));
 function potential(h,key){
  const identity=h?.birthStats||h?.innateStats;
  // DEF owns its trained point pool, but inherits END-born aptitude.
  const origin=key==='def'?'end':key;
  // Legacy units do not have a trustworthy pre-training baseline.
  const birth=identity&&Number.isFinite(+identity[origin])?clamp(identity[origin],1,9):4;
  const aptitude=clamp(h?.aptitudes?.[key]??h?.aptitudes?.[origin]??1,.6,1.6);
  return clamp(.65+(aptitude-1)*1.05+(birth-4)*.088,.28,1.72);
 }
 function quote(h,key){
  if(!h||!KEYS.includes(key))return {attempts:0,totalAttempts:0,turn:1,chance:0,percent:0,risk:'안정',weakness:0};
  const done=attempts(h,key),total=KEYS.reduce((n,k)=>n+attempts(h,k),0);
  const strength=potential(h,key);
  const mean=KEYS.reduce((sum,k)=>sum+potential(h,k),0)/KEYS.length;
  // Lower-at-birth strengths lose consistency increasingly with repetition.
  const handicap=clamp((mean-strength)/Math.max(.28,mean),-.6,1);
  const multiplier=clamp(1+handicap*1.65,.72,2.35);
  // The gladiator's overall accumulated practice starts causing risk from
  // the eighth session. Repeating one ability piles on additional fatigue.
  const generalSteps=Math.max(0,total-6);
  const focusedSteps=Math.max(0,done-4);
  const chance=generalSteps===0?0:Math.min(.72,
   (generalSteps*.023+focusedSteps*.010)*multiplier);
  const percent=Math.round(chance*100);
  return {attempts:done,totalAttempts:total,turn:done+1,chance,percent,weakness:Math.round(handicap*100),
   risk:percent===0?'안정':percent<15?'주의':percent<36?'부담':'고위험'};
 }
 function attempt(h,key,random=Math.random){
  if(!h||!KEYS.includes(key))throw Error('Valid gladiator and ability required');
  const info=quote(h,key),value=clamp(random(),0,1);
  h.trainingAttempts=h.trainingAttempts||{};
  h.trainingAttempts[key]=info.turn;
  const failed=info.chance>0&&value<info.chance;
  return {...info,failed,total:h.trainingAttempts[key]};
 }
 return Object.freeze({KEYS,quote,attempt,potential});
});
