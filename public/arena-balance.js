/* Arena Balance v1.0 — one source of truth for career progression and enemy tiers.
 * No DOM; shared by classic duels and team arena. */
(function(root){
 'use strict';
 const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number.isFinite(n)?n:min));
 const TRAITS={
  murmillo:{armor:.16,parry:.22,stamina:1.12,speed:.90,role:'방패 수호자',special:'방패 충격·가드 파괴'},
  thraex:{armor:.06,parry:.12,stamina:1.00,speed:1.14,role:'기동 처형자',special:'연속 출혈·측면 기습'},
  retiarius:{armor:.03,parry:.09,stamina:1.05,speed:1.04,role:'거리 제어자',special:'그물 포박·원거리 견제'}
 };
 const MODES={
  '1v1':{allies:1,enemies:1,label:'정규 결투',reward:1},
  '1v2':{allies:1,enemies:2,label:'생존 시련',reward:1.55},
  '1v3':{allies:1,enemies:3,label:'영웅의 시련',reward:2.15},
  '2v2':{allies:2,enemies:2,label:'복식 대결',reward:1.4},
  '3v3':{allies:3,enemies:3,label:'군단전',reward:1.75}
 };
 function trainingCost(h,stat){
  const level=clamp(h?.stats?.[stat]||0,0,10);
  return Math.round(18+11*Math.pow(level,1.6));
 }
 function heroPower(h){
  if(!h)return 0;
  const s=h.stats||{},equip=h.equipment||{};
  const level=clamp(h.level||1,1,20);
  return Math.round(level*2.8+
    clamp(s.str||0,0,10)*6.5+
    clamp(s.agi||0,0,10)*5.2+
    clamp(s.end||0,0,10)*6.2+
    clamp(s.focus||0,0,10)*6.1+
    (equip.weapon&&equip.weapon!=='wood'?13:0)+
    (equip.shield?9:0)+(equip.armor?15:0));
 }
 function encounterLevel(round,heroLevel,boss=false){
  const r=clamp(round||1,1,90);
  const level=clamp(heroLevel||1,1,20);
  // Early bouts are difficult but beatable. Opponents outpace untrained
  // veterans so equipment and training matter beyond mere XP level.
  return Math.round(clamp(Math.max(1,level*.72+r*.35+(boss?3:0)),1,20));
 }
 function duelEnemy(base,opponent,round){
  const level=clamp(opponent?.level||1,1,20);
  const boss=!!opponent?.boss;
  const special=opponent?.appearance==='murmillo_champion_red';
  const rounds=clamp(round||1,1,40);
  const hpScale=1+level*.043+rounds*.014+(boss?.60:0)+(special?.30:0);
  const atkScale=1+level*.026+rounds*.013+(boss?.34:0)+(special?.19:0);
  return {
   hp:Math.round(base.hp*hpScale),
   atk:Math.round(base.atk*atkScale),
   sp:Math.round(base.sp*(1+level*.015+(boss?.23:0))),
   move:Math.round(base.move*(1+level*.007+(boss?.07:0))),
   armor:clamp((TRAITS[opponent?.cls]?.armor||0)+(boss?.14:0)+(special?.08:0),0,.44),
   tier:boss?(special?'LEGENDARY':'BOSS'):level>=12?'VETERAN':'CHALLENGER',
   boss,special
  };
 }
 function heroStats(h,base,gear={atk:0,hp:0}){
  const s=h?.stats||{};
  const trait=TRAITS[h?.cls]||TRAITS.murmillo;
  return {
   atk:Math.round(base.atk+clamp(s.str||0,0,10)*2.65+(gear.atk||0)),
   hp:Math.round(base.hp+clamp(s.end||0,0,10)*15+(gear.hp||0)),
   move:Math.round(base.move*(1+clamp(s.agi||0,0,10)*.041)),
   sp:Math.round(base.sp+clamp(s.focus||0,0,10)*4.9+clamp(s.str||0,0,10)*.65),
   staminaRegen:1+clamp(s.agi||0,0,10)*.048,
   specialCooldown:clamp(7-clamp(s.focus||0,0,10)*.33,3.7,7),
   armor:clamp(trait.armor+clamp(s.end||0,0,10)*.007,0,.38),
   focus:clamp(s.focus||0,0,10),
   parry:clamp(trait.parry+clamp(s.focus||0,0,10)*.016,0,.48)
  };
 }
 function enemyAi(level,boss=false,cls='murmillo',hpRatio=1){
  const stage=clamp(level||1,1,20),phase=boss&&hpRatio<.5;
  const base=TRAITS[cls]||TRAITS.murmillo;
  return {
   attacksPerSecond:clamp(.85+stage*.041+(boss?.37:0)+(phase?.24:0)+(cls==='thraex'?.12:0),.80,2.25),
   parriesPerSecond:clamp(.40+stage*.018+(boss?.31:0)+(cls==='murmillo'?.13:0),.4,1.28),
   specialChance:boss?.36:.13,
   recovery:clamp(.68-stage*.010-(boss?.11:0),.31,.70),
   counterArmor:base.armor+(boss?.14:0),
   retaliate:boss&&hpRatio<.5,
   parryInterval:boss?.57:.84
  };
 }
 function damageReduction(defender,blocked=false){
  const trait=TRAITS[defender?.cls]||TRAITS.murmillo;
  const armor=clamp(defender?.armor??trait.armor,0,.5);
  return clamp(armor+(blocked?.33:0),0,.65);
 }
 function playerParryDamage(f,enemy,career){
  if(!career)return null;
  const special=!!enemy?.championBoss;
  return Math.round(clamp(15+(f?.cfg?.atk||16)*.78+(f?.focus||0)*1.1,18,special?39:48));
 }
 function rewards(win,round,mode='1v1'){
  const m=MODES[mode]||MODES['1v1'],r=clamp(round||1,1,90);
  const mult=m.reward;
  return {
   gold:Math.round((win?75+r*6:18+r*2)*mult),
   xp:Math.round((win?38+r*2:12+r)*mult),
   glory:win?Math.round((9+r*2)*mult):0
  };
 }
 root.ArenaBalance={version:'1.0.0',TRAITS,MODES,trainingCost,heroPower,
  encounterLevel,duelEnemy,heroStats,enemyAi,damageReduction,
  playerParryDamage,rewards};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.ArenaBalance;
})(globalThis);