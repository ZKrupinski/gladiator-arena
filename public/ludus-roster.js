(function(root){
 'use strict';
 const classes=['murmillo','thraex','retiarius'];
 const names={murmillo:'무르밀로',thraex:'트라엑스',retiarius:'레티아리우스'};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const stage=level=>level>=20?5:level>=15?4:level>=10?3:level>=5?2:1;
 // Roman individual names are identity labels, never replacements for class or rank.
 const romanNames=['Atilius','Lucanus','Severus','Cassius','Valerius','Drusus','Tiberius',
  'Corvinus','Marcellus','Varro','Aurelius','Flavius','Maximus','Quintus','Gallus',
  'Regulus','Aquila','Crispus','Silvanus','Decimus','Rufus','Felix','Sextus','Brutus',
  'Sabinus','Cato','Lupus','Scaeva','Titus','Lucius','Gaius','Publius','Aulus',
  'Nero','Fabius','Celsus','Longinus','Priscus','Naso','Paullus','Plautus',
  'Agrippa','Vitalis','Faustus','Serranus','Calvus','Gracchus','Cinna'];
 const placeholder=/^(?:(?:신규\s+)?챔피언(?:\s+(?:검투사|무르밀로|트라엑스|레티아리우스))?|(?:무르밀로|트라엑스|레티아리우스)\s*(?:도전자|[0-9]+)|무르밀로\s*[·•]\s*애니메이션|검투사(?:\s*[0-9]+)?)$/i;
 const isPlaceholderName=name=>!String(name||'').trim()||placeholder.test(String(name).trim());
 function romanName(unit,number,used=new Set()){
  const classIndex=classes.indexOf(unit?.cls);
  const variant=unit?.appearance==='murmillo_champion_red'?17:
   unit?.appearance==='murmillo_motion_v3'?9:unit?.appearance==='legacy'?13:0;
  const seed=(Math.max(1,Math.trunc(Number(number)||1))*7+(classIndex<0?0:classIndex)*11+variant)%romanNames.length;
  for(let attempt=0;attempt<romanNames.length;attempt++){
   const candidate=romanNames[(seed+attempt)%romanNames.length];
   if(!used.has(candidate.toLocaleLowerCase('en-US')))return candidate;
  }
  return 'Cornelius '+Math.max(1,Math.trunc(Number(number)||1));
 }
 function normalizeNames(roster){
  if(!Array.isArray(roster))return 0;
  // Preserve purchased and manually named gladiators; reserve their names first.
  const used=new Set(roster.filter(h=>h&&!isPlaceholderName(h.name))
   .map(h=>String(h.name).trim().toLocaleLowerCase('en-US')));
  let changed=0;
  roster.forEach((h,index)=>{
   if(!h||!isPlaceholderName(h.name))return;
   h.name=romanName(h,index+1,used);
   used.add(h.name.toLocaleLowerCase('en-US'));
   changed++;
  });
  return changed;
 }
 function create(cls,number,extra={}){
  const h={cls,name:romanName({cls,appearance:extra.appearance},number),
   stats:{str:0,agi:0,def:0,end:0,focus:0},injury:0,
   equipment:{weapon:'wood',shield:null,armor:null},inventory:['wood'],
   fights:0,wins:0,level:1,xp:0,growthType:cls+'_a',...extra};
  if(isPlaceholderName(h.name))h.name=romanName(h,number);
  return h;
 }
 function encounter(state,hero,rng=Math.random,team=null){
  const round=(state.wins||0)+1,boss=round%5===0;
  const roster=Array.isArray(team)&&team.length?team.filter(Boolean):[hero].filter(Boolean);
  const match=root.ArenaBalance?.makeMatch(round,roster,boss)||null;
  // Recalculate when the selected fighter, their equipment, current injuries,
  // or the team composition changes. The same selection remains stable.
  const matchKey=JSON.stringify(['five-stats-v97',round,roster.map(h=>[
   h.name,h.cls,h.level,h.stats,h.equipment,h.injury,h.fatigue
  ])]);
  if(state.pendingOpponent?.matchKey===matchKey){
   const old=state.pendingOpponent;
   if(isPlaceholderName(old.name))old.name=romanName(old,round,new Set((state.roster||[]).map(h=>String(h.name||'').toLowerCase())));
   return old;
  }
  const preferred=hero?.cls==='murmillo'?'retiarius':
    hero?.cls==='retiarius'?'thraex':'murmillo';
  const special=boss&&(round%20===5);
  const cls=boss?(special?'murmillo':classes[(Math.floor(round/5)-1)%3]):
   (rng()<.60?preferred:classes[Math.floor(rng()*3)]);
  const level=clamp(match?.level??1,1,50);
  // Registered, art-validated studio looks may also join normal rival lineups.
  // Boss identities and their existing art are intentionally kept unchanged.
  const eligible=root.SpartacusGladiators?.custom?.().filter(look=>look.cls===cls)||[];
  const selected=!boss&&eligible.length&&rng()<.18?
   eligible[Math.floor(clamp(rng(),0,.999999)*eligible.length)]:null;
  // First and every fourth championship round introduces the new red-plume
  // Murmillo boss. Other classic bosses keep their established rotation.
  return state.pendingOpponent={cls,level,stage:stage(level),boss,match,matchKey,
   appearance:special?'murmillo_champion_red':selected?.visualId||null,
   visualId:selected?.visualId||null,
   bossId:special?'murmillo_champion_red':boss?cls:null,round,
   growthType:selected?.growthType||(special?'murmillo_a':cls==='thraex'&&rng()<.5?'thraex_b':cls+'_a'),
   name:romanName({cls,appearance:special?'murmillo_champion_red':boss?'legacy':null},
    round,new Set((state.roster||[]).map(h=>String(h.name||'').toLowerCase())))};
 }
 // Backwards-compatible entrypoint. Defeating bosses does not auto-hire them.
 function recruitBoss(){return null;}
 // Face-based adjustment; increasingly large high-tier illustrations need a
 // stronger reduction, consistently for allies and enemies. Feet stay anchored.
 function scale(type,level){const s=clamp(Number(level)||1,1,5);return ({murmillo_a:[.90,.82,.76,.70,.75],retiarius_a:[.90,.85,.82,.76,.72],thraex_a:[.94,.86,.84,.80,.78],thraex_b:[.86,.84,.78,.73,.70]}[type]||[.86,.82,.78,.74,.70])[s-1];}
 root.LudusRoster={create,encounter,recruitBoss,scale,stage,romanName,normalizeNames,isPlaceholderName};
 if(typeof module!=='undefined')module.exports=root.LudusRoster;
})(globalThis);
