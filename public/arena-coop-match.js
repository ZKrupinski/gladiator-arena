/* CONCORDIA · selected-roster matchmaking.
 * Opponents are generated from five ACTUAL post-equipment combatStats, never
 * uninjured averages or cosmetic level alone. Pure; no saved-stat mutations.
 */
(function(root,factory){'use strict';
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.ArenaCoopMatch=api;
})(typeof window==='object'?window:globalThis,function(){'use strict';
 const clamp=(n,a,b)=>Math.min(b,Math.max(a,Number.isFinite(Number(n))?Number(n):a));
 const CLASSES=['murmillo','retiarius','thraex','murmillo','thraex'];
 const NAMES=['방패장 루키우스','포획수 네로','검객 카시우스','호위병 티투스','돌격수 마르쿠스'];
 const avg=(items,fn)=>items.reduce((n,h)=>n+fn(h),0)/items.length;
 const hpOf=h=>clamp(h?.combat?.hp,40,20000);
 const atkOf=h=>clamp(h?.combat?.atk,4,2000);
 const injuryOf=h=>clamp(h?.injury,0,79);
 const fatigueOf=h=>clamp(h?.fatigue,0,79);
 function build(allies){
  if(!Array.isArray(allies)||allies.length!==5||allies.some(h=>!h?.combat))return [];
  const hpAvg=avg(allies,h=>hpOf(h)),atkAvg=avg(allies,h=>atkOf(h));
  const moveAvg=avg(allies,h=>clamp(h?.combat?.move,80,1000));
  const injuryRatio=avg(allies,h=>injuryOf(h)/hpOf(h));
  const fatigueRatio=avg(allies,h=>fatigueOf(h)/100);
  const level=clamp(Math.round(avg(allies,h=>clamp(h?.level,1,20))),1,20);
  const stage=level>=20?5:level>=15?4:level>=10?3:level>=5?2:1;
  // Stay forgiving when real fighters are injured/exhausted, but give the
  // opposing team enough stamina to make protecting and rallying meaningful.
  const offense=clamp(.92-injuryRatio*.24-fatigueRatio*.075,.79,.92);
  return CLASSES.map((cls,i)=>{
   const h=allies[i],unitHp=hpOf(h),unitAtk=atkOf(h);
   const hp=clamp(unitHp,hpAvg*.72,hpAvg*1.28);
   const atk=clamp(unitAtk,atkAvg*.76,atkAvg*1.26);
   const look=cls+'_a_L'+stage;
   return {name:NAMES[i],cls,level,stage,growthType:cls+'_a',look,visualId:look,
    combat:{
     // A fighter's current condition affects enemy offense more than enemy
     // endurance: avoids five-minute sprints ending in an instant with injuries.
     hp:Math.round((hp-injuryOf(h)*.4)*1.12),
     atk:Math.max(4,Math.round(atk*offense*(cls==='thraex'?1.025:cls==='retiarius'?.985:1))),
     move:Math.round(moveAvg*.95),
     armor:cls==='murmillo'?.16:cls==='retiarius'?.08:.10,
     parry:cls==='murmillo'?.21:cls==='retiarius'?.17:.19
    },injury:0,fatigue:0};
  });
 }
 function summary(allies,enemies){
  if(!allies?.length||!enemies?.length)return null;
  return {allies:allies.length,enemies:enemies.length,
   allyHp:Math.round(avg(allies,h=>hpOf(h)-injuryOf(h))),
   enemyHp:Math.round(avg(enemies,h=>hpOf(h))),
   allyAttack:Math.round(avg(allies,atkOf)),
   enemyAttack:Math.round(avg(enemies,atkOf)),
   label:'선택한 5명의 장비·훈련·부상 기준 도전 가능 매칭'};
 }
 return {build,summary};
});
