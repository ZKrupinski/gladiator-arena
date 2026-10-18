/* ARENA LINEUP v1 — deterministic event-preview and one-at-a-time duel queue.
 * Intentionally does not draw sprites: the proven original 1:1 engine handles
 * EVERY bout, all existing attacks, effects, camera and controls.
 */
(function(root){
 'use strict';
 const CLASSES=['murmillo','thraex','retiarius'];
 const NAMES={murmillo:'무르밀로',thraex:'트라엑스',retiarius:'레티아리우스'};
 const INJURY_LIMIT=80,FATIGUE_LIMIT=80;
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,Number.isFinite(Number(v))?Number(v):lo));
 const modes=root.ArenaBalance?.MODES||{
  '1v1':{allies:1,enemies:1},'1v2':{allies:1,enemies:2},
  '1v3':{allies:1,enemies:3},'2v2':{allies:2,enemies:2},'3v3':{allies:3,enemies:3}
 };
 function condition(hero){
  const injury=clamp(hero?.injury,0,120),fatigue=clamp(hero?.fatigue,0,100);
  const reason=injury>=INJURY_LIMIT?'중상':fatigue>=FATIGUE_LIMIT?'탈진':null;
  return {eligible:!reason,reason,injury,fatigue,injuryLimit:INJURY_LIMIT,fatigueLimit:FATIGUE_LIMIT};
 }
 function preview(mode,leader){
  const spec=modes[mode];if(!spec||!leader)throw Error('대진 정보가 없습니다.');
  const finalClass=CLASSES.includes(leader.cls)?leader.cls:'murmillo';
  const ci=CLASSES.indexOf(finalClass),round=clamp(leader.round,1,100);
  const size=spec.enemies;
  return Array.from({length:size},(_,i)=>{
   if(i===size-1)return {...leader,order:i+1,stage:clamp(leader.stage||1,1,5),
    label:leader.boss?'최종 챔피언':'최종 도전자'};
   const cls=CLASSES[(ci+i+1)%CLASSES.length];
   const level=clamp((leader.level||1)-(size-1-i),1,20);
   return {cls,level,stage:level>=20?5:level>=15?4:level>=10?3:level>=5?2:1,
    round,boss:false,bossId:null,appearance:null,growthType:cls+'_a',
    name:(i+1)+'차 도전자 · '+NAMES[cls],order:i+1,label:'선봉 도전자'};
  });
 }
 function create(mode,indices,roster,leader){
  const spec=modes[mode];if(!spec)throw Error('알 수 없는 경기 방식');
  if(!Array.isArray(indices)||indices.length!==spec.allies||
   new Set(indices).size!==indices.length)throw Error('출전 선수 수 및 순서를 확인하세요.');
  for(const idx of indices){
   if(!Number.isInteger(idx)||!roster?.[idx])throw Error('등록되지 않은 출전 선수');
   const status=condition(roster[idx]);
   if(!status.eligible)throw Error(roster[idx].name+' · '+status.reason+'으로 출전 불가');
  }
  return {mode,allies:[...indices],enemies:preview(mode,leader),allyIndex:0,
   enemyIndex:0,defeatedAllies:0,defeatedEnemies:0,round:1,finished:false,
   won:null,encounterLeader:{...leader},eliminatedAllies:[],eliminatedEnemies:[]};
 }
 function resolve(queue,allyWon){
  if(queue.finished)throw Error('이미 종료된 경기');
  const defeatedAlly=!allyWon?queue.allies[queue.allyIndex]:null;
  const defeatedEnemy=allyWon?queue.enemies[queue.enemyIndex]:null;
  if(allyWon){queue.eliminatedEnemies.push(defeatedEnemy);queue.enemyIndex++;queue.defeatedEnemies++;}
  else {queue.eliminatedAllies.push(defeatedAlly);queue.allyIndex++;queue.defeatedAllies++;}
  queue.round++;
  queue.finished=queue.allyIndex>=queue.allies.length||queue.enemyIndex>=queue.enemies.length;
  queue.won=queue.finished?queue.enemyIndex>=queue.enemies.length:null;
  return {finished:queue.finished,win:queue.won,nextAllyIndex:queue.allies[queue.allyIndex]??null,
   nextEnemy:queue.enemies[queue.enemyIndex]??null,
   defeatedAlly,defeatedEnemy,round:queue.round};
 }
 function fatigueGain(startHp,endHp,bouts=1){
  const lost=clamp((Number(startHp)||1)-Math.max(0,Number(endHp)||0),0,100000);
  const ratio=lost/Math.max(1,Number(startHp)||1);
  return Math.round(11+8*Math.max(1,Number(bouts)||1)+ratio*32);
 }
 function restCost(hero){return Math.max(18,Math.round(16+condition(hero).fatigue*.75));}
 root.ArenaLineup={version:'1.0.0',INJURY_LIMIT,FATIGUE_LIMIT,modes,
  condition,preview,create,resolve,fatigueGain,restCost};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.ArenaLineup;
})(globalThis);