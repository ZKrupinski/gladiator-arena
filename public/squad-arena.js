/* GLADIATOR ARENA · Team Arena 1.0
 * Real squads (1v2 / 1v3 / 2v2 / 3v3), two arena depth lanes and live
 * combat. Preserves original single-fighter engine for all 1v1 matches.
 */
(function(root){
'use strict';
const B=root.ArenaBalance;
const CLASSES=['murmillo','thraex','retiarius'];
const BASE={
 murmillo:{hp:138,atk:17,sp:42,move:244,reach:226},
 thraex:{hp:113,atk:18,sp:35,move:290,reach:239},
 retiarius:{hp:116,atk:16,sp:36,move:271,reach:282}
};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const safe=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;','\'':'&#39;'}[c]));
let session=null,raf=0,previous=0,held=new Set(),lastManual=0,cache=new WeakMap();
const now=()=>typeof performance!=='undefined'?performance.now():Date.now();
function unit(hero,side,i,round,mainEnemy=false){
 const cls=CLASSES.includes(hero.cls)?hero.cls:'murmillo';
 const boss=side==='enemy'&&!!hero.boss;
 const rank=side==='ally'
  ?B.heroStats(hero,BASE[cls],hero.gearBonus||{atk:0,hp:0})
  :B.duelEnemy(BASE[cls],hero,round);
 const near=i%2===0,lane=near?0:1;
 const x=side==='ally'?240+(i%3)*115:1040-(i%3)*115;
 const level=hero.level||1;
 const maxHp=rank.hp;
 const injury=side==='ally'?Math.max(0,hero.injury||0):0;
 return {
  side,id:side+'-'+i,index:i,hero,cls,lane,x,face:side==='ally'?1:-1,
  personality:root.ArenaPersonality?.profile?.(hero,rank,cls),mind:null,
  y:near?580:459,size:boss?(near?280:237):(near?252:207),boss,
  hp:Math.max(1,maxHp-injury),maxHp,atk:rank.atk,sp:rank.sp,
  speed:rank.move,range:BASE[cls].reach,armor:rank.armor??B.TRAITS[cls].armor,
  stamina:100,regen:rank.staminaRegen||1,focus:rank.focus||0,
  cooldown:0,skillCD:0,specialCooldown:rank.specialCooldown||7,
  stagger:0,dodge:0,guard:0,rooted:0,bleed:0,bleedPower:0,
  attackT:0,attackDuration:.42,action:'idle',time:0,phase:0,
  hits:0,damageDone:0,dead:false,caption:boss?'BOSS':B.TRAITS[cls].role,
  level,mainEnemy,swingIndex:0,artScale:0
 };
}
function makeBattle(mode,party,opponent,random=Math.random){
 const spec=B?.MODES?.[mode];
 if(!spec||mode==='1v1'||party.length!==spec.allies)throw Error('invalid squad composition');
 const round=opponent?.round||1;
 const friends=party.map((h,i)=>unit(h,'ally',i,round,false));
 const foes=Array.from({length:spec.enemies},(_,i)=>{
  const cls=i===spec.enemies-1?opponent.cls:CLASSES[(CLASSES.indexOf(opponent.cls)+i+1)%3];
  const level=clamp((opponent.level||1)+(i%2===0?0:-1),1,20);
  const hero={cls,level,stage:B?.encounterLevel?.(round,level)||level,boss:i===spec.enemies-1&&opponent.boss,
   appearance:i===spec.enemies-1&&opponent.boss?(opponent.appearance||'legacy'):null,
   name:i===spec.enemies-1?opponent.name:B.TRAITS[cls].role,
   growthType:i===spec.enemies-1?opponent.growthType:cls+'_a'};
  hero.stage=level>=20?5:level>=15?4:level>=10?3:level>=5?2:1;
  return unit(hero,'enemy',i,round,i===spec.enemies-1);
 });
 // Solo survival has multiple coordinated threats, but must remain
 // realistically beatable by a trained fighter using dodges and class skills.
 // Small pressure scaling avoids the old three-enemy stun-lock death spiral.
 if(spec.allies===spec.enemies&&spec.allies>=2){
  // Coordinated opposing formations need genuine preparation, not just an
  // extra body count. The bonus applies only to team-versus-team modes.
  for(const foe of foes){
   foe.atk=Math.round(foe.atk*1.20);
   foe.sp=Math.round(foe.sp*1.16);
   foe.maxHp=Math.round(foe.maxHp*1.18);
   foe.hp=foe.maxHp;
   foe.armor=clamp(foe.armor+.025,0,.46);
  }
 }
 if(spec.allies===1&&spec.enemies>=2){
  const factor=spec.enemies===3?.70:.84;
  for(const foe of foes){
   foe.atk=Math.max(8,Math.round(foe.atk*factor));
   foe.sp=Math.max(15,Math.round(foe.sp*(factor+.06)));
   foe.maxHp=Math.round(foe.maxHp*(spec.enemies===3?.83:.90));
   foe.hp=foe.maxHp;
  }
  friends[0].regen*=1.15;
  friends[0].specialCooldown=Math.max(3.2,friends[0].specialCooldown*.83);
 }
 return {mode,spec,round,party:friends,foes,all:[...friends,...foes],t:0,
  maxTime:mode==='1v3'||mode==='3v3'?150:125,state:'fight',win:false,
  champion:foes.some(x=>x.boss),events:[],log:[],focusAlly:0,focusEnemy:0,reported:false,
  lastAuto:0,damage:0,random};
}
function alive(team){return team.filter(u=>!u.dead)}
function closest(battle,unit,override){
 const choices=alive(unit.side==='ally'?battle.foes:battle.party);
 if(!choices.length)return null;
 if(override&&choices.includes(override))return override;
 return choices.reduce((best,target)=>{
  const score=u=>Math.abs(u.x-unit.x)+Math.abs(u.lane-unit.lane)*64+(u.boss?-10:0);
  return !best||score(target)<score(best)?target:best;
 },null);
}
function startFlight(battle,target,fromX,direction,kind){
 const reduced=!!(root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
 const distance=reduced?(kind==='death'?70:38):kind==='death'?275:175;
 const landing=clamp(target.x+direction*distance,85,1195);
 target.x=landing;target.flight={fromX,at:battle.t,duration:kind==='death'?1.12:.78,
  height:reduced?12:kind==='death'?145:95,reduced,kind};
 if(kind==='parry'){target.stagger=Math.max(target.stagger,.82);target.action='hit';target.attackT=.78;target.attackDuration=.78;}
}
function performAttack(battle,unit,target,special=false){
 if(!target||target.dead||unit.dead||unit.stagger>0||unit.cooldown>0)return false;
 const stamina=special?31:14;
 if(unit.stamina<stamina||(special&&unit.skillCD>0))return false;
 unit.stamina-=stamina;unit.action=special?'special':'attack';
 unit.attackT=special?.61:.37;unit.attackDuration=unit.attackT;
 unit.cooldown=special?.83:unit.cls==='thraex'?.49:.60;
 if(special)unit.skillCD=unit.specialCooldown;
 const laneGap=Math.abs(target.lane-unit.lane)*55,dist=Math.abs(target.x-unit.x)+laneGap;
 if(dist>unit.range+(special?68:0)){battle.log.push({text:'MISS',x:target.x,y:target.y,t:.6});return false;}
 if(target.dodge>0){battle.log.push({text:'DODGE',x:target.x,y:target.y,t:.6});return false;}
 // A real guarded parry repels the incoming attacker before the next strike.
 if(target.guard>0&&target.stagger<=0&&battle.random()<.36){
  const fromX=unit.x,away=Math.sign(unit.x-target.x)||unit.face*-1;
  startFlight(battle,unit,fromX,away,'parry');unit.cooldown=Math.max(unit.cooldown,.82);
  target.guard=0;target.stamina=Math.max(0,target.stamina-6);
  battle.events.push({x:fromX,y:unit.y-110,t:.5,text:'PARRY',critical:true,side:target.side});
  battle.log.push({text:'PARRY',x:fromX,y:unit.y,t:.6});return true;
 }
 const critical=unit.cls==='thraex'&&battle.random()<(.12+unit.focus*.015);
 let dmg=(special?unit.sp:unit.atk)*(critical?1.45:1);
 const affinity=root.ArenaMatchup?.multiplier?.(unit,target)??1;
 if(unit.boss&&unit.hp<unit.maxHp*.5)dmg*=1.23;
 if(unit.guard>0)dmg*=.65;
 dmg*=1-B.damageReduction(target,false);
 if(target.guard>0)dmg*=target.cls==='murmillo'?.36:.53;
 dmg=Math.max(1,Math.round(dmg*affinity));
 target.hp=Math.max(0,target.hp-dmg);unit.damageDone+=dmg;unit.hits++;
 target.stagger=Math.max(target.stagger,target.boss?.10:.15);
 target.action='hit';target.attackT=.20;target.attackDuration=.20;
 const knock=target.side==='enemy'?1:-1,contactX=target.x;
 target.x=clamp(target.x+knock*(special?25:9),105,1175);
 if(special&&target.hp>0)startFlight(battle,target,contactX,knock,'parry');
 if(special){
  if(unit.cls==='retiarius'){target.rooted=1.9;target.stagger=.38;}
  if(unit.cls==='thraex'){target.bleed=3.2;target.bleedPower=Math.max(1,unit.atk*.1*affinity);}
  if(unit.cls==='murmillo'){target.stamina=Math.max(0,target.stamina-28);target.guard=0;}
 }
 // Heroic crowd-control attacks are the counterplay to 1v2 / 1v3.
 // Splash is modest and limited to nearby enemies; single-target duels retain
 // precise damage and class-specific special effects.
 if(special&&unit.side==='ally'&&battle.spec.enemies>1){
  for(const nearby of battle.foes){
   if(nearby===target||nearby.dead)continue;
   if(Math.abs(nearby.x-target.x)+Math.abs(nearby.lane-target.lane)*35>175)continue;
   const nearbyAffinity=root.ArenaMatchup?.multiplier?.(unit,nearby)??1;
   const splash=Math.max(1,Math.round(dmg/Math.max(.1,affinity)*.38*(1-B.damageReduction(nearby,false))*nearbyAffinity));
   nearby.hp=Math.max(0,nearby.hp-splash);unit.damageDone+=splash;
   nearby.stagger=Math.max(nearby.stagger,.24);
   battle.events.push({x:nearby.x,y:nearby.y-110,t:.36,text:'-'+splash,critical:false,side:unit.side});
   if(nearby.hp<=0){nearby.dead=true;nearby.action='death';nearby.attackT=1.12;
    startFlight(battle,nearby,nearby.x,knock,'death');}
  }
 }
 battle.events.push({x:target.x,y:target.y-120,t:.36,text:'-'+dmg,critical,side:unit.side});
 if(target.hp<=0){target.dead=true;target.action='death';target.attackT=1.12;
  startFlight(battle,target,contactX,knock,'death');}
 return true;
}
function advance(battle,dt,commands={}){
 if(!battle)return battle;
 dt=clamp(dt,0,.05);
 if(battle.state==='finished'){battle.t+=dt;return battle;}
 if(battle.state!=='fight')return battle;
 battle.t+=dt;
 battle.events=battle.events.filter(e=>(e.t-=dt)>0);
 battle.log=battle.log.filter(e=>(e.t-=dt)>0);
 const manual=commands.manual||null;
 for(const f of battle.all){
  if(f.dead)continue;
  f.time+=dt;f.cooldown=Math.max(0,f.cooldown-dt);
  f.skillCD=Math.max(0,f.skillCD-dt);f.attackT=Math.max(0,f.attackT-dt);
  f.stagger=Math.max(0,f.stagger-dt);f.guard=Math.max(0,f.guard-dt);
  f.rooted=Math.max(0,f.rooted-dt);f.dodge=Math.max(0,f.dodge-dt);
  f.stamina=clamp(f.stamina+dt*19*f.regen,0,100);
  if(f.bleed>0){f.hp=Math.max(0,f.hp-f.bleedPower*dt);f.bleed=Math.max(0,f.bleed-dt);}
  if(f.hp<=0){f.dead=true;f.action='death';continue;}
  if(f.flight&&battle.t-f.flight.at<f.flight.duration)continue;
  const actorControl=f.side==='ally'&&battle.party[battle.focusAlly]===f?manual:null;
  const chosen=actorControl?battle.foes[battle.focusEnemy]:null;
  const target=closest(battle,f,chosen);
  if(!target)continue;
  f.face=target.x>=f.x?1:-1;
  if(f.stagger>0)continue;
  const distance=Math.abs(target.x-f.x)+Math.abs(target.lane-f.lane)*55;
  const mood=actorControl?null:root.ArenaPersonality?.parameters?.(f,battle.t,battle.random);
  if(actorControl&&actorControl.move){
   f.x=clamp(f.x+actorControl.move*f.speed*dt*.60,105,1175);
  }else if(!f.rooted&&distance>f.range-18+(mood?.spacing||0)*.22){
   f.x=clamp(f.x+(target.x>f.x?1:-1)*f.speed*dt*.52*(mood?.speed||1),105,1175);
  }else if(!f.rooted&&distance<f.range*.50&&f.cls==='retiarius'){
   f.x=clamp(f.x-(target.x>f.x?1:-1)*f.speed*dt*.23*(mood?.evade||1),105,1175);
  }
  if(!actorControl&&!f.rooted&&distance<f.range+24&&mood?.mode==='feint'&&f.cooldown>.1){
   f.x=clamp(f.x-f.face*f.speed*dt*.32,105,1175);
  }
  if(actorControl?.dodge&&f.stamina>18){f.stamina-=18;f.dodge=.38;f.x=clamp(f.x-f.face*52,105,1175);f.action='dodge';f.attackT=.38;}
  if(actorControl?.guard){f.guard=.28;f.action='guard';f.stamina=Math.max(0,f.stamina-11*dt);}
  if(actorControl?.special)performAttack(battle,f,target,true);
  else if(actorControl?.attack)performAttack(battle,f,target,false);
  else if(!actorControl&&f.cooldown<=0){
   const phase=f.boss&&f.hp<f.maxHp*.5?1.38:1;
   const freq=f.side==='enemy'
    ?(.98+f.level*.026+(f.boss?.36:0))*phase
    :(.81+f.level*.016);
   const p=dt*freq*(mood?.aggression||1);
   if(f.boss&&f.skillCD<=0&&battle.random()<dt*.55*(mood?.special||1))performAttack(battle,f,target,true);
   else if(battle.random()<p)performAttack(battle,f,target,false);
   if(f.stamina>20&&battle.random()<dt*.23*(mood?.guard||1)){
    f.guard=.26;f.action='guard';
   }
  }
  if(f.attackT<=0&&f.stagger<=0&&f.guard<=0)f.action=Math.abs(distance)>f.range?'walk':'idle';
 }
 // Same-lane allies maintain readable formation spacing instead of
 // collapsing into the same sprite when chasing one remaining opponent.
 for(const team of [battle.party,battle.foes]){
  const members=alive(team);
  for(let i=0;i<members.length;i++)for(let j=i+1;j<members.length;j++){
   const left=members[i],right=members[j];
   if(left.lane!==right.lane)continue;
   const delta=right.x-left.x;
   if(Math.abs(delta)>=96)continue;
   const push=(96-Math.abs(delta))*.5;
   const sign=delta>=0?1:-1;
   left.x=clamp(left.x-sign*push,105,1175);
   right.x=clamp(right.x+sign*push,105,1175);
  }
 }
 const a=alive(battle.party),e=alive(battle.foes);
 if(!a.length||!e.length||battle.t>=battle.maxTime){
  battle.state='finished';
  if(!a.length)battle.win=false;
  else if(!e.length)battle.win=true;
  else{
   const left=a.reduce((v,f)=>v+f.hp/f.maxHp,0)/battle.party.length;
   const right=e.reduce((v,f)=>v+f.hp/f.maxHp,0)/battle.foes.length;
   battle.win=left>right+.10;
  }
 }
 return battle;
}
function centerStats(battle){
 const a=alive(battle.party),b=alive(battle.foes);
 return {allies:a.length,enemies:b.length,time:Math.ceil(battle.maxTime-battle.t),
  mode:battle.mode,state:battle.state};
}
function spriteBounds(img){
 if(cache.has(img))return cache.get(img);
 const c=document.createElement('canvas');c.width=120;c.height=90;
 const g=c.getContext('2d',{willReadFrequently:true});
 let box={x:0,y:0,w:img.width,h:img.height};
 try{
  g.drawImage(img,0,0,c.width,c.height);
  const d=g.getImageData(0,0,c.width,c.height).data;
  let l=120,r=-1,t=90,b=-1;
  for(let y=0;y<90;y++)for(let x=0;x<120;x++)if(d[(y*120+x)*4+3]>=65){
   l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);
  }
  if(r>=l){const x=Math.max(0,(l-1)/120*img.width),y=Math.max(0,(t-1)/90*img.height);
   box={x,y,w:Math.min(img.width,(r+2)/120*img.width)-x,
    h:Math.min(img.height,(b+2)/90*img.height)-y};}
 }catch(err){}
 cache.set(img,box);return box;
}
function drawUnit(ctx,u,bridge,battle){
 const rectY=u.y+(u.lane?0:8),time=battle.t;
 ctx.save();ctx.globalAlpha=1;
 if(u.boss){
  ctx.strokeStyle=u.hp<u.maxHp*.5?'#ee554e':'#e7ae50';
  ctx.lineWidth=5;
  ctx.beginPath();ctx.ellipse(u.x,rectY+11,81,21,0,0,Math.PI*2);ctx.stroke();
 }
 if(u===battle.party[battle.focusAlly]){
  ctx.strokeStyle='#fbe09b';ctx.lineWidth=4;
  ctx.beginPath();ctx.ellipse(u.x,rectY+10,77,19,0,0,Math.PI*2);ctx.stroke();
 }
 ctx.fillStyle='#0a0505a0';ctx.beginPath();ctx.ellipse(u.x,rectY+7,66,13,0,0,Math.PI*2);ctx.fill();
 const flight=u.flight,flightT=flight?clamp((battle.t-flight.at)/flight.duration,0,1):1;
 const airborne=flight&&flightT<1;
 const action=u.dead?(airborne&&flightT<.78?'hit':'death'):airborne?'hit':u.action==='special'?'special':
  u.action==='attack'?'attack':u.action==='hit'?'hit':u.action==='guard'?'guard':u.action==='walk'?'walk':'idle';
 const frame=Math.floor(time*11)%8;
 const img=bridge.squadSprite?.(u.hero,action,frame)||bridge.squadSprite?.(u.hero,'idle',0);
 if(img?.width&&img?.height){
  const box=spriteBounds(img);
  if(!u.artScale){
   const reference=bridge.squadSprite?.(u.hero,'idle',0)||img;
   const refBox=spriteBounds(reference);
   u.artScale=Math.min(u.size/Math.max(1,refBox.h),u.size*1.32/Math.max(1,refBox.w));
  }
  const w=box.w*u.artScale,h=box.h*u.artScale;
  const lean=u.attackT>0&&u.action==='attack'?Math.sin(Math.PI*clamp(1-u.attackT/u.attackDuration,0,1))*14*u.face:0;
  const flightX=airborne?(flight.fromX-u.x)*Math.pow(1-flightT,1.6):0;
  const flightY=airborne&&!flight.reduced?-4*flight.height*flightT*(1-flightT):0;
  ctx.translate(u.x+lean+flightX,rectY+flightY);
  if(airborne&&!flight.reduced)ctx.rotate(u.face*(u.dead?.17:.11)*Math.sin(Math.PI*flightT));
  if(u.side==='enemy')ctx.scale(-1,1);
  ctx.drawImage(img,box.x,box.y,box.w,box.h,-w/2,-h,w,h);
 }else{
  ctx.fillStyle=u.side==='ally'?'#ceaa6e':'#8b332b';
  ctx.fillRect(u.x-27,rectY-120,54,120);
 }
 ctx.restore();
 const hpW=u.lane?114:134;
 ctx.fillStyle='#130807dc';ctx.fillRect(u.x-hpW/2,rectY-u.size-29,hpW,9);
 ctx.fillStyle=u.side==='ally'?'#5ad6a4':'#dc6653';
 ctx.fillRect(u.x-hpW/2,rectY-u.size-29,hpW*clamp(u.hp/u.maxHp,0,1),9);
 ctx.fillStyle=u.boss?'#ffcb67':'#f7dfb5';
 ctx.textAlign='center';ctx.font=u.boss?'bold 18px system-ui':'bold 15px system-ui';
 ctx.fillText((u.boss?'★ ':'')+String(u.hero.name||u.cls).slice(0,15),u.x,rectY-u.size-38);
 if(!u.dead){
  const opponent=closest(battle,u);
  if(!u._levelFx)root.ArenaCombatSignals?.drawAdvantage?.(ctx,u,opponent,{
    x:u.x,y:rectY-u.size-68,time:battle.t,size:u.lane?17:21});
  root.ArenaCombatSignals?.drawLevelUp?.(ctx,u,{x:u.x,y:rectY-u.size-65,time:battle.t,scale:1});
 }
}
function canvasRender(battle,ctx,background,bridge){
 const w=1280,h=720;ctx.clearRect(0,0,w,h);
 if(root.CapuaVenue?.draw(ctx,{width:w,height:h,time:battle.t})){
  // Match current venue selection; original Colosseum branch follows untouched.
 }
 else if(background.complete&&background.naturalWidth){
  // Fill 16:9 without stretching the panoramic Colosseum artwork.
  const rw=background.naturalWidth,rh=background.naturalHeight;
  const cropW=Math.min(rw,rh*w/h),cropH=Math.min(rh,rw*h/w);
  ctx.drawImage(background,(rw-cropW)/2,(rh-cropH)/2,cropW,cropH,0,0,w,h);
 }
 else {ctx.fillStyle='#24120d';ctx.fillRect(0,0,w,h);}
 ctx.fillStyle='#1a100c63';ctx.fillRect(0,400,w,260);
 ctx.fillStyle='#e7b56c23';ctx.fillRect(0,464,w,2);
 ctx.fillStyle='#f4ca8142';ctx.fillRect(0,601,w,2);
 ctx.font='bold 18px Georgia';ctx.textAlign='left';ctx.fillStyle='#d3b17aa6';
 ctx.fillText('FAR LANE · 원경',40,447);ctx.fillText('FRONT LANE · 근경',40,587);
 for(const u of [...battle.all].sort((a,b)=>a.y-b.y||a.x-b.x))drawUnit(ctx,u,bridge,battle);
 for(const e of battle.events){
  ctx.save();ctx.globalAlpha=clamp(e.t/.36,0,1);
  ctx.fillStyle=e.critical?'#ffe47a':'#fff4d2';ctx.strokeStyle='#210902';ctx.lineWidth=5;
  ctx.font='bold 25px system-ui';ctx.textAlign='center';
  ctx.strokeText(e.text,e.x,e.y-(.36-e.t)*52);
  ctx.fillText(e.text,e.x,e.y-(.36-e.t)*52);ctx.restore();
 }
 ctx.fillStyle='#0b0605db';ctx.fillRect(0,0,w,93);
 ctx.strokeStyle='#b48c50';ctx.lineWidth=3;ctx.strokeRect(2,2,w-4,89);
 ctx.font='bold 25px Georgia';ctx.textAlign='center';ctx.fillStyle='#ffe4a7';
 ctx.fillText(battle.spec.label+'  ·  '+battle.mode+'    '+Math.max(0,Math.ceil(battle.maxTime-battle.t))+'s',w/2,35);
 ctx.font='bold 21px system-ui';ctx.fillStyle='#86e5c8';
 ctx.fillText('MY LUDUS  '+alive(battle.party).length+' / '+battle.party.length,274,65);
 ctx.fillStyle='#ef9c88';ctx.fillText('ENEMIES  '+alive(battle.foes).length+' / '+battle.foes.length,1000,65);
 const target=battle.foes[battle.focusEnemy],unit=battle.party[battle.focusAlly];
 ctx.font='17px system-ui';ctx.fillStyle='#f0d8a5';
 ctx.fillText('조작 '+(unit?.hero?.name||'—')+'   ·   대상 '+(target?.hero?.name||'—'),w/2,76);
}
function createUI(){
 const screen=document.createElement('section');screen.className='sa-screen';
 screen.setAttribute('role','dialog');screen.setAttribute('aria-label','팀 대전 아레나');
 screen.innerHTML='<div class="sa-layout">'+
  '<canvas id="saCanvas" width="1280" height="720" aria-label="다대다 전투"></canvas>'+
  '<div class="sa-top"><button data-action="retreat">↩ 포기</button><span id="saInfo">TEAM ARENA</span>'+
  '<button data-action="switch">아군 변경 [TAB]</button><button data-action="target">적 변경 [Q]</button></div>'+
  '<div class="sa-controls"><div><button data-action="left">◀ 이동</button>'+
  '<button data-action="right">이동 ▶</button><button data-action="dodge">회피 [L]</button></div>'+
  '<div><button data-action="guard">방어 [K]</button><button data-action="attack">공격 [J]</button>'+
  '<button data-action="special">필살기 [I]</button></div></div>'+
  '<div class="sa-outcome" hidden><h2></h2><p></p><button data-action="return">루두스로 돌아가기</button></div></div>';
 document.body.appendChild(screen);
 return screen;
}
function start({mode,party,opponent,bridge,onFinish,onReturn}){
 root.CapuaVenue?.nextMatch?.();
 if(session)close();
 const battle=makeBattle(mode,party,opponent);
 const screen=createUI(),canvas=screen.querySelector('#saCanvas'),ctx=canvas.getContext('2d',{alpha:false});
 const bg=new Image();bg.src='assets/new-era/arena.webp';
 session={battle,screen,canvas,ctx,background:bg,bridge,onFinish,onReturn,done:false};
 const ss=session;lastManual=now();held.clear();
 const action=key=>{
  if(key==='retreat'){complete(false,'후퇴');return;}
  if(key==='return'){close();onReturn?.();return;}
  if(battle.state!=='fight')return;
  if(key==='switch'){
   const slots=alive(battle.party);if(slots.length){
    const idx=battle.focusAlly;let next=idx;
    for(let t=0;t<battle.party.length;t++){
     next=(next+1)%battle.party.length;
     if(!battle.party[next].dead){battle.focusAlly=next;break;}
    }
   }
  }else if(key==='target'){
   let next=battle.focusEnemy;
   for(let t=0;t<battle.foes.length;t++){
    next=(next+1)%battle.foes.length;if(!battle.foes[next].dead){battle.focusEnemy=next;break;}
   }
  }else if(key==='dodge'||key==='attack'||key==='special'||key==='guard'){
   lastManual=now();ss.command=key;
  }
 };
 screen.querySelectorAll('[data-action]').forEach(button=>{
  const key=button.dataset.action;
  button.addEventListener('pointerdown',event=>{
   if(['left','right','guard'].includes(key)){held.add(key);lastManual=now();}
   else action(key);
   try{button.setPointerCapture(event.pointerId);}catch(err){}
  });
  button.addEventListener('pointerup',()=>held.delete(key));
  button.addEventListener('pointercancel',()=>held.delete(key));
  button.addEventListener('click',event=>{if(event.detail===0)action(key);});
 });
 ss.keyboard=event=>{
  if(!session||session!==ss)return;
  const key={KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',
   KeyJ:'attack',Space:'attack',KeyI:'special',KeyK:'guard',KeyL:'dodge',
   Tab:'switch',KeyQ:'target',Escape:'retreat'}[event.code];
  if(!key)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(event.type==='keyup'){held.delete(key);return;}
  if(['left','right','guard'].includes(key)){held.add(key);lastManual=now();}
  else if(!event.repeat)action(key);
 };
 window.addEventListener('keydown',ss.keyboard,true);
 window.addEventListener('keyup',ss.keyboard,true);
 previous=0;
 const frame=stamp=>{
  if(!session||session!==ss)return;
  const dt=previous?clamp((stamp-previous)/1000,0,.05):0;
  previous=stamp;
  if(battle.state==='fight'){
   const command=ss.command;ss.command=null;
   const player=battle.party[battle.focusAlly];
   if(player?.dead){
    const next=battle.party.findIndex(u=>!u.dead);
    if(next>=0)battle.focusAlly=next;
   }
   let manual=null;
   if(command||held.size||(now()-lastManual)<800){
    manual={move:(held.has('right')?1:0)-(held.has('left')?1:0),
     attack:command==='attack',special:command==='special',
     guard:held.has('guard')||command==='guard',dodge:command==='dodge'};
   }
   advance(battle,dt,{manual});
   if(battle.state==='finished'&&!battle.all.some(u=>u.flight&&battle.t-u.flight.at<u.flight.duration))complete(battle.win);
  }else if(battle.state==='finished'&&!ss.done){
   advance(battle,dt);
   if(!battle.all.some(u=>u.flight&&battle.t-u.flight.at<u.flight.duration))complete(battle.win);
  }
  canvasRender(battle,ctx,bg,bridge);
  const label=screen.querySelector('#saInfo');
  if(label)label.textContent='LV.'+battle.round+' · '+battle.spec.label+' · 근경/원경';
  raf=requestAnimationFrame(frame);
 };
 raf=requestAnimationFrame(frame);
 return battle;
 function complete(win,reason){
  if(ss.done)return;ss.done=true;ss.battle.state='finished';ss.battle.win=!!win;
  const out=screen.querySelector('.sa-outcome');out.hidden=false;
  out.querySelector('h2').textContent=win?'VICTORIA · 전원 격파!':'DEFEAT · 패배';
  out.querySelector('p').textContent=(reason||'')+' 생존 아군 '+alive(battle.party).length+
    '명 · 적 '+alive(battle.foes).length+'명 · 훈련 및 장비 강화 권장';
  onFinish?.(!!win,{mode,battle,party:battle.party,foes:battle.foes});
 }
}
function close(){
 if(!session)return;
 const s=session;session=null;cancelAnimationFrame(raf);
 window.removeEventListener('keydown',s.keyboard,true);
 window.removeEventListener('keyup',s.keyboard,true);
 s.screen.remove();held.clear();previous=0;
}
root.SquadArena={version:'1.0.0',makeBattle,advance,centerStats,start,close,
 active:()=>!!session};
if(typeof module!=='undefined'&&module.exports)module.exports=root.SquadArena;
})(globalThis);