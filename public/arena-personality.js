/* Individual fighter decisions across duel, squad, survival practice and 5v5.
   Pure stat-based personality; never changes the saved roster or authored scale.
   Uses all five STR/AGI/DEF/END/FOCUS, starting aptitudes and a stable quirk.
   Deliberate, short-lived "surprise" actions prevent identical loops. */
(function(root,factory){'use strict';
 const api=factory();root.ArenaPersonality=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis,function(){'use strict';
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const val=(x,f=0)=>Number.isFinite(Number(x))?Number(x):f;
 const TYPES=['str','agi','def','end','focus'];
 const hash=s=>{let h=2166136261;for(const ch of String(s)){h=Math.imul(h^ch.charCodeAt(0),16777619);}return h>>>0;};
 function profile(hero={},combat={},cls=null){
  hero=hero||{};combat=combat||hero.combat||{};
  const type=cls||hero.cls||'murmillo',base=hero.stats||{};
  // No roster stat available: deduce a conservative silhouette from its
  // real combat attributes, rather than granting fabricated trained points.
  const fallback={
   str:val(combat.atk,18)/3.4,agi:val(combat.move,255)/33,
   def:val(combat.armor,.14)*44+2,end:val(combat.hp,160)/28,
   focus:val(combat.focus,val(combat.sp,38)/5.8)
  };
  const raw=TYPES.map(k=>clamp(val(base[k],fallback[k]),0,100));
  const mean=Math.max(2,raw.reduce((a,b)=>a+b,0)/5);
  const innate=hero.aptitudes||{};
  const affinities=raw.map((v,i)=>clamp(.55+v/mean*.46+
   (val(innate[TYPES[i]],1)-1)*.32,.45,2.05));
  const [str,agi,def,end,focus]=affinities;
  const signature=hash([hero.id??hero.index??'',hero.name||'',type,hero.appearance||''].join('|'));
  const variance=(((signature%997)/997)-.5)*.30;
  return Object.freeze({
   key:signature,cls:type,
   str,agi,def,end,focus,
   press:clamp(.62+str*.42+agi*.14-def*.11+variance,.48,1.75),
   circle:clamp(.35+agi*.68+focus*.18+variance,.48,1.9),
   guard:clamp(.30+def*.62+end*.20+variance,.55,1.9),
   counter:clamp(.32+focus*.53+def*.25+variance,.5,1.9),
   recover:clamp(.40+end*.65+def*.16+variance,.55,1.9),
   burst:clamp(.28+str*.55+focus*.38+variance,.53,1.9),
   tempo:clamp(.85+agi*.22+focus*.11+variance*.4,.83,1.33),
   quirk:1+signature%4
  });
 }
 const MODES=['press','circle','guard','counter','recover','burst','feint'];
 function choose(unit,time,rng=Math.random){
  if(!unit)return {mode:'press',until:Infinity};
  if(unit.mind?.until>time)return unit.mind;
  const p=unit.personality||profile(unit.hero||unit,unit.combat||unit,unit.cls);
  const hp=clamp(val(unit.hp,100)/Math.max(1,val(unit.maxHp,100)),0,1);
  // Tailored weights with controlled wildcard; no fighter repeats one move
  // indefinitely. Changing HP changes the decision tree mid-bout.
  const weights=[
   p.press*(hp<.35?.80:1.12),p.circle,p.guard*(hp<.5?1.55:1),
   p.counter*(hp<.60?1.3:1),p.recover*(hp<.42?2.3:.40),
   p.burst*(hp<.28?1.65:1),(.30+p.agi*.22+p.focus*.12)
  ];
  if(unit.mind?.mode){const old=MODES.indexOf(unit.mind.mode);if(old>=0)weights[old]*=.38;}
  // A rare misdirection in any build, not a constant random animation.
  if(rng()<.105){const wildcard=(p.key+Math.floor(time*3))%MODES.length;weights[wildcard]*=2.8;}
  const sum=weights.reduce((n,v)=>n+v,0),roll=clamp(rng(),0,.99999)*sum;
  let at=0,mode=MODES[0];
  for(let i=0;i<MODES.length;i++){at+=weights[i];if(roll<=at){mode=MODES[i];break;}}
  const until=time+(1.20+clamp(rng(),0,1)*1.55)/p.tempo;
  return unit.mind={mode,until,changedAt:time};
 }
 function parameters(unit,time,rng=Math.random){
  const p=unit?.personality||profile(unit?.hero||unit,unit?.combat||unit,unit?.cls);
  const state=choose(unit,time,rng),mode=state.mode;
  return {mode,until:state.until,
   aggression:clamp(p.press*(mode==='press'?1.50:mode==='burst'?1.25:
     mode==='recover'?.42:mode==='guard'?.70:1),.37,2.1),
   guard:clamp(p.guard*(mode==='guard'?1.65:mode==='counter'?1.50:
     mode==='burst'?.65:mode==='feint'?1.15:1),.45,2.25),
   evade:clamp(p.circle*(mode==='circle'?1.65:mode==='feint'?1.40:1),.55,2.2),
   rush:clamp(p.burst*(mode==='burst'?1.9:mode==='press'?1.4:mode==='recover'?.4:1),.4,2.25),
   spacing:mode==='circle'?33:mode==='feint'?25:mode==='counter'?15:
     mode==='guard'?12:mode==='recover'?45:mode==='burst'?-17:mode==='press'?-12:0,
   lateral:mode==='circle'?48:mode==='feint'?31:mode==='recover'?21:0,
   speed:clamp(p.tempo*(mode==='burst'?1.18:mode==='guard'?.76:mode==='recover'?.85:1),.68,1.5),
   special:clamp((.65+p.focus*.26+p.str*.15)*(mode==='burst'?1.7:mode==='counter'?1.2:.92),.48,2.1),
   patience:mode==='counter'||mode==='guard'||mode==='recover',
   retreat:mode==='recover'&&val(unit?.hp,100)<val(unit?.maxHp,100)*.80};
 }
 return {version:'1.0.0',profile,choose,parameters,MODES};
});
