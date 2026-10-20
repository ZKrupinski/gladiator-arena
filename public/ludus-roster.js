(function(root){
 'use strict';
 const classes=['murmillo','thraex','retiarius'];
 const names={murmillo:'무르밀로',thraex:'트라엑스',retiarius:'레티아리우스'};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const stage=level=>level>=20?5:level>=15?4:level>=10?3:level>=5?2:1;
 function create(cls,number,extra={}){return {cls,name:names[cls]+' '+number,stats:{str:0,agi:0,end:0,focus:0},injury:0,equipment:{weapon:'wood',shield:null,armor:null},inventory:['wood'],fights:0,wins:0,level:1,xp:0,growthType:cls+'_a',...extra};}
 function encounter(state,hero,rng=Math.random,team=null){
  const round=(state.wins||0)+1,boss=round%5===0;
  const roster=Array.isArray(team)&&team.length?team.filter(Boolean):[hero].filter(Boolean);
  const match=root.ArenaBalance?.makeMatch(round,roster,boss)||null;
  // Recalculate when the selected fighter, their equipment, current injuries,
  // or the team composition changes. The same selection remains stable.
  const matchKey=JSON.stringify([round,roster.map(h=>[
   h.name,h.cls,h.level,h.stats,h.equipment,h.injury,h.fatigue
  ])]);
  if(state.pendingOpponent?.matchKey===matchKey)return state.pendingOpponent;
  const preferred=hero?.cls==='murmillo'?'retiarius':
    hero?.cls==='retiarius'?'thraex':'murmillo';
  const special=boss&&(round%20===5);
  const cls=boss?(special?'murmillo':classes[(Math.floor(round/5)-1)%3]):
   (rng()<.60?preferred:classes[Math.floor(rng()*3)]);
  const level=clamp(match?.level??1,1,20);
  // First and every fourth championship round introduces the new red-plume
  // Murmillo boss. Other classic bosses keep their established rotation.
  return state.pendingOpponent={cls,level,stage:stage(level),boss,match,matchKey,
   appearance:special?'murmillo_champion_red':null,
   bossId:special?'murmillo_champion_red':boss?cls:null,round,
   growthType:special?'murmillo_a':cls==='thraex'&&rng()<.5?'thraex_b':cls+'_a',
   name:special?'신규 챔피언 무르밀로':boss?'챔피언 '+names[cls]:names[cls]+' 도전자'};
 }
 function recruitBoss(state,enemy){
  if(!enemy?.boss||state.roster.some(h=>h.bossId===enemy.bossId))return null;
  const h=create(enemy.cls,state.roster.length+1,{name:enemy.name,bossId:enemy.bossId,
   appearance:enemy.appearance==='murmillo_champion_red'?'murmillo_champion_red':'legacy',
   level:enemy.level,stats:enemy.appearance==='murmillo_champion_red'?{str:4,agi:2,end:4,focus:3}:enemy.cls==='thraex'?{str:4,agi:4,end:2,focus:3}:enemy.cls==='retiarius'?{str:3,agi:3,end:2,focus:5}:{str:3,agi:2,end:5,focus:2}});
  state.roster.push(h);return h;
 }
 // Face-based adjustment; increasingly large high-tier illustrations need a
 // stronger reduction, consistently for allies and enemies. Feet stay anchored.
 function scale(type,level){const s=clamp(Number(level)||1,1,5);return ({murmillo_a:[.90,.82,.76,.70,.75],retiarius_a:[.90,.85,.82,.76,.72],thraex_a:[.94,.86,.84,.80,.78],thraex_b:[.86,.84,.78,.73,.70]}[type]||[.86,.82,.78,.74,.70])[s-1];}
 root.LudusRoster={create,encounter,recruitBoss,scale,stage};
 if(typeof module!=='undefined')module.exports=root.LudusRoster;
})(globalThis);
