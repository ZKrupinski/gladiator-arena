/* Spartacus Training Aptitude v72. A failed training consumes the quoted
 * denarii but awards no stat/XP. Uses immutable Lv.0 identity, NEVER mutable
 * current stats. Per-stat attempts share existing trainingAttempts saved on
 * the gladiator. Both defense and endurance train END and share its count.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 root.LudusTrainingRisk=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const KEYS=['str','agi','end','focus'];
 const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,Number.isFinite(+v)?+v:lo));
 const attempts=(h,key)=>Math.max(0,Math.floor(Number(h?.trainingAttempts?.[key])||0));
 function potential(h,key){
  const identity=h?.birthStats||h?.innateStats;
  // Legacy units do not have a trustworthy pre-training baseline.
  const birth=identity&&Number.isFinite(+identity[key])?clamp(identity[key],1,9):4;
  const aptitude=clamp(h?.aptitudes?.[key]??1,.6,1.6);
  return clamp(.65+(aptitude-1)*1.05+(birth-4)*.088,.28,1.72);
 }
 function quote(h,key){
  if(!h||!KEYS.includes(key))return {attempts:0,turn:1,chance:0,percent:0,risk:'안정',weakness:0};
  const done=attempts(h,key),strength=potential(h,key);
  const mean=KEYS.reduce((sum,k)=>sum+potential(h,k),0)/KEYS.length;
  // Lower-at-birth strengths lose consistency increasingly with repetition.
  const handicap=clamp((mean-strength)/Math.max(.28,mean),-.6,1);
  const multiplier=clamp(1+handicap*1.65,.72,2.35);
  // Five free-of-random-risk sessions. On sixth: baseline 3.4%, then grow.
  const steps=Math.max(0,done-4);
  const chance=steps===0?0:Math.min(.72,steps*.034*multiplier);
  const percent=Math.round(chance*100);
  return {attempts:done,turn:done+1,chance,percent,weakness:Math.round(handicap*100),
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
