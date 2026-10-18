(function(root){
 'use strict';
 const classes=['murmillo','thraex','retiarius'];
 const names={murmillo:'무르밀로',thraex:'트라엑스',retiarius:'레티아리우스'};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const stage=level=>level>=20?5:level>=15?4:level>=10?3:level>=5?2:1;
 function create(cls,number,extra={}){return {cls,name:names[cls]+' '+number,stats:{str:0,agi:0,end:0,focus:0},injury:0,equipment:{weapon:'wood',shield:null,armor:null},inventory:['wood'],fights:0,wins:0,level:1,xp:0,growthType:cls+'_a',...extra};}
 function encounter(state,hero,rng=Math.random){
  if(state.pendingOpponent)return state.pendingOpponent;
  const round=(state.wins||0)+1,boss=round%5===0;
  const cls=boss?classes[(Math.floor(round/5)-1)%3]:classes[Math.floor(rng()*3)];
  const level=clamp(Math.max(Math.floor(round*.8),Number(hero?.level)||1)+Math.floor(rng()*5)-2+(boss?2:0),1,20);
  return state.pendingOpponent={cls,level,stage:stage(level),boss,bossId:boss?cls:null,round,
   growthType:cls==='thraex'&&rng()<.5?'thraex_b':cls+'_a',name:boss?'챔피언 '+names[cls]:names[cls]+' 도전자'};
 }
 function recruitBoss(state,enemy){
  if(!enemy?.boss||state.roster.some(h=>h.bossId===enemy.bossId))return null;
  const h=create(enemy.cls,state.roster.length+1,{name:enemy.name,bossId:enemy.bossId,appearance:'legacy',level:enemy.level,stats:{str:2,agi:2,end:2,focus:2}});
  state.roster.push(h);return h;
 }
 // Face-based adjustment; increasingly large high-tier illustrations need a
 // stronger reduction, consistently for allies and enemies. Feet stay anchored.
 function scale(type,level){const s=clamp(Number(level)||1,1,5);return ({murmillo_a:[.90,.82,.76,.70,.75],retiarius_a:[.90,.85,.82,.76,.72],thraex_a:[.94,.86,.84,.80,.78],thraex_b:[.86,.84,.78,.73,.70]}[type]||[.86,.82,.78,.74,.70])[s-1];}
 root.LudusRoster={create,encounter,recruitBoss,scale,stage};
 if(typeof module!=='undefined')module.exports=root.LudusRoster;
})(globalThis);
