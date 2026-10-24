/* Five simultaneous fighters per side. Simulation has no DOM or save access. */
(function(root,factory){
 'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.ArenaCoopCore=api;
})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.45);
 const finite=(n,f)=>Number.isFinite(Number(n))?Number(n):f;
 function rng(seed){let s=seed>>>0;return ()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};}
 function makeUnit(h,side,seat){
  const stats=h.combat||{},maxHp=Math.max(40,finite(stats.hp,160));
  return {...h,id:side+seat,side,seat,maxHp,hp:Math.max(1,maxHp-clamp(finite(h.injury,0),0,maxHp-1)),
   startHp:Math.max(1,maxHp-clamp(finite(h.injury,0),0,maxHp-1)),
   atk:Math.max(4,finite(stats.atk,20)),armor:clamp(finite(stats.armor,.1),0,.48),
   parry:clamp(finite(stats.parry,.14),.05,.4),speed:clamp(finite(stats.move,220)*.48,70,160),
   x:side==='ally'?250-(seat%2)*75:1030+(seat%2)*75,y:405+seat*62,
   face:side==='ally'?1:-1,cooldown:.4+seat*.2,linkReady:0,specialReady:4+seat,
   hit:0,guard:0,swing:0,rooted:0,exposed:0,dead:false,moving:false,attack:null,
   damage:0,assists:0,blocks:0,kills:0};
 }
 function create(allies,enemies,{seed=Date.now(),limit=120}={}){
  if(allies.length!==5||enemies.length!==5)throw Error('각 팀은 정확히 5명이어야 합니다.');
  if(new Set(allies.map(h=>h.index)).size!==5)throw Error('같은 검투사를 중복 출전시킬 수 없습니다.');
  if(allies.some(h=>finite(h.injury,0)>=80||finite(h.fatigue,0)>=80))throw Error('중상 또는 탈진한 검투사는 출전할 수 없습니다.');
  return {units:[...allies.map((h,i)=>makeUnit(h,'ally',i)),...enemies.map((h,i)=>makeUnit(h,'enemy',i))],
   time:0,limit:clamp(finite(limit,120),10,180),random:rng(seed),events:[],serial:0,links:[],
   meter:25,focus:null,cover:null,focusReady:0,coverReady:0,paused:false,result:null,teamwork:{ally:0,enemy:0}};
 }
 const alive=(s,side)=>s.units.filter(u=>!u.dead&&(!side||u.side===side));
 function emit(s,type,a,b,text,extra={}){
  s.events.push({id:++s.serial,time:s.time,type,source:a?.id,target:b?.id,x:b?.x??a?.x,y:b?.y??a?.y,text,...extra});
  if(s.events.length>60)s.events.shift();
 }
 function link(s,source,target,kind){
  if(source.dead||target.dead)return false;
  const ally=alive(s,source.side).filter(u=>u!==source&&u.linkReady<=s.time&&distance(u,target)<340)
   .sort((a,b)=>distance(a,target)-distance(b,target))[0];
  if(!ally)return false;
  ally.linkReady=s.time+5;
  s.links.push({actor:ally.id,target:target.id,due:s.time+.48,expires:s.time+1.6,kind});
  emit(s,'link',source,ally,source.name+' → '+ally.name+' · '+kind,{victim:target.id});
  return true;
 }
 function hurt(s,a,b,mult=1,kind='hit',chain=true){
  if(a.dead||b.dead)return;
  let target=b,amount=a.atk*.52*mult*(.87+s.random()*.26)*(1-b.armor);
  if(chain&&s.random()<b.parry){
   b.guard=.5;b.blocks++;emit(s,'parry',b,a,b.name+' 패링');
   a.exposed=1.6;link(s,b,a,'패링 반격');return;
  }
  const protectedUnit=s.cover&&s.cover.until>s.time&&s.cover.id===b.id;
  if(chain&&(b.hp/b.maxHp<.4||protectedUnit)){
   const shield=alive(s,b.side).filter(u=>u!==b&&u.cls==='murmillo'&&u.linkReady<=s.time&&distance(u,b)<220)
    .sort((x,y)=>distance(x,b)-distance(y,b))[0];
   if(shield){target=shield;amount*=.45;shield.guard=.7;shield.linkReady=s.time+4;shield.blocks++;
    s.teamwork[b.side]++;if(b.side==='ally')s.meter=clamp(s.meter+8,0,100);
    emit(s,'cover',shield,b,shield.name+' → '+b.name+' 엄호');}
   else if(protectedUnit){amount*=.55;b.guard=.5;}
  }
  if(b.exposed>0)amount*=1.25;
  const damage=Math.min(target.hp,Math.max(1,Math.round(amount)));
  target.hp-=damage;target.hit=.24;a.damage+=damage;
  emit(s,kind,a,target,(kind==='assist'?'협공 ':'')+'−'+damage,{damage});
  if(target.hp<=0){target.dead=true;target.attack=null;target.moving=false;target.deathAt=s.time;a.kills++;
   emit(s,'ko',a,target,target.name+' 전투 불능');}
 }
 function finish(s,reason){
  if(s.result)return s.result;
  const allies=alive(s,'ally'),enemies=alive(s,'enemy');
  const ratio=side=>s.units.filter(u=>u.side===side).reduce((n,u)=>n+u.hp/u.maxHp,0);
  const win=reason!=='retreat'&&(enemies.length===0&&allies.length>0||reason==='timeout'&&ratio('ally')>ratio('enemy'));
  s.result={win,reason,time:s.time,teamwork:s.teamwork.ally,units:s.units.map(u=>({...u,attack:null})),
   defeated:5-enemies.length};
  emit(s,'result',null,null,reason==='retreat'?'전투 철수':win?'협동전 승리':'협동전 패배');return s.result;
 }
 function command(s,kind,id){
  if(s.result||s.paused)return false;
  if(kind==='focus'){
   const target=s.units.find(u=>u.id===id&&u.side==='enemy'&&!u.dead);
   if(!target||s.time<s.focusReady)return false;
   s.focus={id,until:s.time+6};s.focusReady=s.time+10;emit(s,'command',null,target,target.name+' 집중 공격 · 6초');return true;
  }
  if(kind==='cover'){
   const target=s.units.find(u=>u.id===id&&u.side==='ally'&&!u.dead)||alive(s,'ally').sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
   if(!target||s.time<s.coverReady)return false;
   s.cover={id:target.id,until:s.time+7};s.coverReady=s.time+15;
   emit(s,'command',null,target,target.name+' 보호 진형 · 7초');return true;
  }
  if(kind==='rally'&&s.meter>=60){
   const allies=alive(s,'ally'),enemies=alive(s,'enemy');if(!allies.length||!enemies.length)return false;
   s.meter-=60;
   for(const u of allies){const t=enemies.slice().sort((a,b)=>distance(u,a)-distance(u,b))[0];
    s.links.push({actor:u.id,target:t.id,due:s.time+.25+u.seat*.15,expires:s.time+2,kind:'총공세'});u.cooldown=Math.min(u.cooldown,.3);}
   emit(s,'command',null,null,'연계 총공세!');return true;
  }
  return false;
 }
 function step(s,dt){
  if(s.result||s.paused)return s;dt=clamp(finite(dt,0),0,.05);s.time+=dt;
  s.turn=(s.turn||0)+1;
  for(const u of (s.turn%2?s.units:s.units.slice().reverse())){
   u.moving=false;if(u.dead)continue;
   for(const k of ['cooldown','hit','guard','swing','rooted','exposed'])u[k]=Math.max(0,u[k]-dt);
   if(u.attack){
    u.attack.remaining-=dt;
    if(u.attack.remaining<=0){
     const atk=u.attack;u.attack=null;u.swing=.32;
     const target=s.units.find(v=>v.id===atk.target);
     if(target&&!target.dead&&distance(u,target)<205){
      if(atk.special&&u.cls==='retiarius'){
       target.rooted=2;target.exposed=2;emit(s,'net',u,target,u.name+' 그물 포획');link(s,u,target,'포획 협공');
      }else{
       hurt(s,u,target,atk.special?1.5:1);
       if(atk.special&&!target.dead){target.x=clamp(target.x+u.face*55,90,1190);target.exposed=1.4;
        emit(s,'push',u,target,u.name+' 밀어내기');link(s,u,target,'측면 협공');}
      }
     }else emit(s,'miss',u,target,'빗나감');
    }
    continue;
   }
   const enemies=alive(s,u.side==='ally'?'enemy':'ally');if(!enemies.length)continue;
   const directed=u.side==='ally'&&s.focus?.until>s.time?enemies.find(t=>t.id===s.focus.id):null;
   const target=directed||enemies.slice().sort((a,b)=>(distance(u,a)+(a.seat===u.seat?-35:0))-(distance(u,b)+(b.seat===u.seat?-35:0)))[0];
   u.target=target.id;u.face=target.x>=u.x?1:-1;
   // Approach from separate lanes, then dynamically retarget after knockouts.
   if(distance(u,target)>155&&u.rooted<=0){
    const dx=target.x-u.face*135-u.x,dy=target.y+((u.seat%3)-1)*18-u.y,d=Math.hypot(dx,dy)||1;
    const speed=u.speed*(u.side==='ally'&&s.cover?.id===u.id&&s.cover.until>s.time?.65:1);
    u.x+=dx/d*Math.min(d,speed*dt);u.y+=dy/d*Math.min(d,speed*dt);u.moving=true;
   }else if(u.cooldown<=0&&u.rooted<=0){
    const special=s.time>=u.specialReady;u.attack={target:target.id,special,remaining:special?.64:.4,total:special?.64:.4};
    u.cooldown=1.4+s.random()*.6;if(special)u.specialReady=s.time+8;
   }
  }
  // Soft separation prevents a pile of ten sprites and has no gameplay teleport.
  const live=alive(s);
  for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++){
   const a=live[i],b=live[j],dx=b.x-a.x,dy=(b.y-a.y)*1.6,d=Math.hypot(dx,dy);
   if(d<112){const push=(112-d)*dt*4,nx=d?dx/d:(i%2?1:-1),ny=d?dy/d:.3;
    if(a.rooted<=0){a.x-=nx*push;a.y-=ny*push/1.6;}if(b.rooted<=0){b.x+=nx*push;b.y+=ny*push/1.6;}}
  }
  for(const u of s.units){u.x=clamp(u.x,85,1195);u.y=clamp(u.y,395,675);}
  s.links=s.links.filter(l=>{
   const a=s.units.find(u=>u.id===l.actor),b=s.units.find(u=>u.id===l.target);
   if(!a||!b||a.dead||b.dead||s.time>l.expires)return false;
   if(s.time<l.due)return true;
   if(distance(a,b)>230)return true;
   a.face=b.x>=a.x?1:-1;a.swing=.4;hurt(s,a,b,.8,'assist',false);a.assists++;s.teamwork[a.side]++;
   if(a.side==='ally'&&l.kind!=='총공세')s.meter=clamp(s.meter+10,0,100);
   return false;
  });
  if(!alive(s,'ally').length||!alive(s,'enemy').length)finish(s,'elimination');
  else if(s.time>=s.limit)finish(s,'timeout');
  return s;
 }
 return {create,step,command,finish,alive,distance};
});
