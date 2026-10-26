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
  const level=clamp(Math.round(avg(allies,h=>clamp(h?.level,1,50))),1,50);
  const stage=level>=20?5:level>=15?4:level>=10?3:level>=5?2:1;
  // Stay forgiving when real fighters are injured/exhausted, but give the
  // opposing team enough stamina to make protecting and rallying meaningful.
  const offense=clamp(.92-injuryRatio*.40-fatigueRatio*.10,.76,.92);
  return CLASSES.map((cls,i)=>{
   const h=allies[i],unitHp=hpOf(h),unitAtk=atkOf(h);
   const hp=160+(clamp(unitHp,hpAvg*.72,hpAvg*1.28)-160)*.75;
   const atk=18+(clamp(unitAtk,atkAvg*.76,atkAvg*1.26)-18)*.75;
   const look=cls+'_a_L'+stage;
   return {name:NAMES[i],cls,level,stage,growthType:cls+'_a',look,visualId:look,
    combat:{
     // A fighter's current condition affects enemy offense more than enemy
     // endurance: avoids five-minute sprints ending in an instant with injuries.
     // Lv.20+ innate specialists hit much harder than raw level suggests.
     // More enemy endurance (not burst damage) preserves repeated command rounds.
     hp:Math.max(40,Math.round((hp-injuryOf(h)*.4)*1.12*
      (1+.45*clamp((level-15)/35,0,1)))),
     atk:Math.max(4,Math.round(atk*offense*(cls==='thraex'?1.025:cls==='retiarius'?.985:1))),
     move:Math.round((244+(moveAvg-244)*.75)*.95),
     // Carry part of advanced defensive/tempo growth into rivals, avoiding free wins
     // at Lv.50 while retaining the player's trained advantage.
     armor:clamp((cls==='murmillo'?.16:cls==='retiarius'?.08:.10)+Math.max(0,avg(allies,h=>h.combat.armor??.1)-.16)*.65,0,.52),
     parry:clamp((cls==='murmillo'?.21:cls==='retiarius'?.17:.19)+Math.max(0,avg(allies,h=>h.combat.parry??.2)-.22)*.65,.05,.42),
     recovery:1-(1-avg(allies,h=>h.combat.recovery??1))*.65,
     dodgeChance:avg(allies,h=>h.combat.dodgeChance??0)*.65,
     guardEfficiency:avg(allies,h=>h.combat.guardEfficiency??0)*.65,
     sp:Math.max(1,Math.round((h.combat.sp??unitAtk*2.5)*.88)),
     specialCooldown:8-Math.max(0,7-avg(allies,h=>h.combat.specialCooldown??7))*.65
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
