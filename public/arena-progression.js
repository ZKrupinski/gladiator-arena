/* SPARTACUS — 50-level innate progression.
 * Birth statistics and aptitudes are immutable identity; training remains mutable.
 * Bonuses are derived at runtime (no save-file stat inflation / no double grant).
 */
(function(root,factory){'use strict';
 const progression=factory();
 if(root)root.ArenaProgression=progression;
 if(typeof module==='object'&&module.exports)module.exports=progression;
})(typeof window==='object'?window:globalThis,function(){'use strict';
 const LEVEL_CAP=50,STATS=['str','agi','end','focus','def'];
 const NAMES={str:'근력',agi:'민첩',def:'방어',end:'체력',focus:'집중'};
 const clamp=(v,min,max)=>Math.min(max,Math.max(min,Number.isFinite(+v)?+v:min));
 const level=h=>Math.round(clamp(h?.level??1,1,LEVEL_CAP));
 const born=h=>h?.birthStats||h?.innateStats||null;
 function strengths(h){
  return Object.fromEntries(STATS.map(key=>{
   const aptitude=clamp(h?.aptitudes?.[key]??(key==='def'?h?.aptitudes?.end:undefined)??1,.6,1.6);
   // Market Lv.0 rolls are 1~9; center 4 is ordinary.
   const origin=clamp(born(h)?.[key]??(key==='def'?born(h)?.end:undefined)??4,1,9);
   // Better inherited attributes become increasingly significant at Lv.50.
   const potential=clamp(.65+(aptitude-1)*1.05+(origin-4)*.088,.28,1.72);
   return [key,potential];
  }));
 }
 function growth(h,key){
  if(!STATS.includes(key))return 0;
  // Lv.1: 0, Lv.25: ~6, Lv.50: 16 * innate multiplier.
  // Nonlinear by design: higher levels reveal more of a born specialty.
  const t=(level(h)-1)/(LEVEL_CAP-1);
  return 16*Math.pow(t,1.34)*strengths(h)[key];
 }
 function describe(h){
  const scores=strengths(h);
  const ranking=STATS.slice().sort((a,b)=>scores[b]-scores[a]);
  const best=ranking[0],weak=ranking[ranking.length-1];
  const advantage=scores[best]-scores[weak];
  return {best,weak,name:NAMES[best]+' 특화',weakness:NAMES[weak],distinctiveness:advantage,
   growth:Object.fromEntries(STATS.map(k=>[k,+growth(h,k).toFixed(2)]))};
 }
 function initial(h){
  if(!h)return null;
  if(h.birthStats)return h.birthStats;
  // Earlier save files did not preserve Lv.0 values.
  // Approximate only for near-new hires; never overwrite progressed stats.
  const s=h.stats||{};
  return Object.fromEntries(STATS.map(k=>[k,clamp(3+(Number(s[k])||0),1,9)]));
 }
 return Object.freeze({LEVEL_CAP,STATS,NAMES,level,strengths,growth,describe,initial});
});
