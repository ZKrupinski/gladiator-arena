/* SPARTACUS · Class and beast affinity matrix
 * One editable source for every battle mode, including future classes.
 * Applied to successful damage, not to hit/animation probability or visual scale.
 */
(function(root,factory){'use strict';
 const api=factory();root.ArenaMatchup=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis,function(){'use strict';
 const OWN=Object.prototype.hasOwnProperty;
 const valid=id=>typeof id==='string'&&/^[a-z][a-z0-9_-]{1,49}$/.test(id);
 const classes=new Set(['murmillo','retiarius','thraex']);
 const pair=Object.create(null);
 const beast=Object.create(null);
 // Directional damage ratios: advantage is noticeable but never a guaranteed win.
 const WIN=1.16,LOSS=.88;
 function setMatchup(attacker,defender,ratio){
  if(!valid(attacker)||!valid(defender)||!Number.isFinite(ratio)||ratio<.5||ratio>1.6)
   throw Error('Invalid directional class matchup');
  classes.add(attacker);classes.add(defender);
  (pair[attacker]??=Object.create(null))[defender]=ratio;
 }
 function setRivalry(winner,loser,{win=WIN,loss=LOSS}={}){
  if(winner===loser)throw Error('Cannot assign class advantage over itself');
  setMatchup(winner,loser,win);setMatchup(loser,winner,loss);
 }
 // Future class: registerClass('dimachaerus') followed by setRivalry() and
 // setBeastMatchup(); undefined relationships stay neutral (1.0x).
 function registerClass(id){if(!valid(id))throw Error('Invalid class ID');classes.add(id);return id;}
 function setBeastMatchup(id,{vsBeast=1,beastVs=1}={}){
  if(!valid(id)||!Number.isFinite(vsBeast)||!Number.isFinite(beastVs)||
   vsBeast<.5||vsBeast>1.6||beastVs<.5||beastVs>1.6)
   throw Error('Invalid beast matchup');
  classes.add(id);beast[id]={vsBeast,beastVs};
 }
 setRivalry('retiarius','murmillo');
 setRivalry('murmillo','thraex');
 setRivalry('thraex','retiarius');
 setBeastMatchup('retiarius',{vsBeast:1.22,beastVs:.82});
 setBeastMatchup('murmillo',{vsBeast:.80,beastVs:1.30});
 setBeastMatchup('thraex',{vsBeast:.92,beastVs:1.10});
 const category=f=>!!(f?.beastType||f?.species==='beast'||f?.isBeast||f?.type==='beast');
 function multiplier(attacker,defender){
  if(!attacker||!defender)return 1;
  const aBeast=category(attacker),dBeast=category(defender);
  if(aBeast&&dBeast)return 1;
  if(aBeast)return beast[defender.cls]?.beastVs??1;
  if(dBeast)return beast[attacker.cls]?.vsBeast??1;
  return OWN.call(pair[attacker.cls]||{},defender.cls)?
   pair[attacker.cls][defender.cls]:1;
 }
 function damage(amount,attacker,defender){
  const n=Number(amount)||0;
  return n<=0?0:Math.max(1,Math.round(n*multiplier(attacker,defender)));
 }
 function table(){
  return {classes:[...classes],versusClasses:Object.fromEntries(
   Object.entries(pair).map(([k,v])=>[k,{...v}])),
   versusBeasts:Object.fromEntries(Object.entries(beast).map(([k,v])=>[k,{...v}]))};
 }
 return {version:'1.0.0',multiplier,damage,registerClass,setMatchup,setRivalry,setBeastMatchup,table};
});
