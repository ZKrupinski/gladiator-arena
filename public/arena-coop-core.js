/* CONCORDIA: five simultaneous fighters per side; no DOM or save dependencies. */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.ArenaCoopCore=api;
})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const finite=(n,f)=>Number.isFinite(Number(n))?Number(n):f;
 const distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.45);
 const footDistance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.6);
 const SOLID_GAP=102; // One constant for standing AND corpses, preventing a new overlap on death.
 function rng(seed){let n=seed>>>0;return ()=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n/4294967296;};}
 function makeUnit(h,side,seat){
  const stats=h.combat||{},maxHp=Math.max(40,finite(stats.hp,160));
  const hp=Math.max(1,maxHp-clamp(finite(h.injury,0),0,maxHp-1));
  return {...h,id:side+seat,side,seat,maxHp,hp,startHp:hp,
   atk:Math.max(4,finite(stats.atk,20)),armor:clamp(finite(stats.armor,.1),0,.48),
   parry:clamp(finite(stats.parry,.14),.05,.4),speed:clamp(finite(stats.move,220)*.48,70,160),
   x:side==='ally'?(seat%2?125:265):(seat%2?1155:1015),y:405+seat*62,
   face:side==='ally'?1:-1,cooldown:.4+seat*.2,linkReady:0,specialReady:4+seat,
   hit:0,guard:0,swing:0,rooted:0,exposed:0,stagger:0,dash:0,dashReady:2+seat*.5,
   counter:null,mode:'',tacticUntil:0,retreatReady:5+seat*1.7,recoverBudget:0,lastHitAt:-10,
   dead:false,moving:false,attack:null,damage:0,assists:0,blocks:0,kills:0};
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
 function free(s,u,x,y){
  return x>=85&&x<=1195&&y>=395&&y<=675&&
    s.units.every(v=>v===u||footDistance({x,y},v)>=SOLID_GAP-.01);
 }
 function travel(s,u,tx,ty,step){
  const dx=tx-u.x,dy=ty-u.y,len=Math.hypot(dx,dy);
  if(len<1||step<=0||u.dead)return false;
  const stride=Math.min(step,len),ang=Math.atan2(dy,dx),sign=u.seat%2?-1:1;
  for(const a of [0,sign*.43,-sign*.43,sign*.9,-sign*.9,sign*1.5,-sign*1.5,sign*2,-sign*2,Math.PI]){
   const vx=Math.cos(ang+a),vy=Math.sin(ang+a);let x=u.x,y=u.y,ok=true;
   for(let t=0;t<stride;t+=7){
    const d=Math.min(7,stride-t);x=clamp(x+vx*d,85,1195);y=clamp(y+vy*d,395,675);
    if(!free(s,u,x,y)){ok=false;break;}
   }
   if(ok&&Math.hypot(x-u.x,y-u.y)>.15){u.x=x;u.y=y;u.moving=true;return true;}
  }
  return false;
 }
 function shove(s,u,amount){
  const sign=Math.sign(amount);
  for(let t=0;t<Math.abs(amount);t+=5){
   const x=clamp(u.x+sign*Math.min(5,Math.abs(amount)-t),85,1195);
   if(!free(s,u,x,u.y))break;
   u.x=x;
  }
 }
 function link(s,source,target,kind,count=1){
  if(source.dead||target.dead)return false;
  const candidates=alive(s,source.side).filter(u=>u!==source&&u.linkReady<=s.time&&distance(u,target)<540)
    .sort((a,b)=>distance(a,target)-distance(b,target)).slice(0,count);
  candidates.forEach((ally,i)=>{
   ally.linkReady=s.time+4.5;
   s.links.push({actor:ally.id,target:target.id,due:s.time+.35+i*.28,expires:s.time+3.4+i*.25,kind});
   emit(s,'link',source,ally,source.name+' → '+ally.name+' · '+kind,{victim:target.id});
  });
  return candidates.length>0;
 }
 function hurt(s,a,b,mult=1,kind='hit',chain=true){
  if(a.dead||b.dead)return 0;
  let target=b,amount=a.atk*.52*mult*(.87+s.random()*.26)*(1-b.armor);
  if(chain&&b.stagger<=0&&b.rooted<=0&&s.random()<b.parry){
   b.guard=.5;b.blocks++;b.counter={target:a.id,due:s.time+.18,expires:s.time+1.7};
   b.attack=null;b.dash=.55;b.dashReady=s.time+3;
   a.exposed=1.7;a.stagger=.55;shove(s,a,a.x>=b.x?85:-85);
   emit(s,'parry',b,a,b.name+' 패링 → 돌진 반격');
   link(s,b,a,'패링 추격',2);return 0;
  }
  const protecting=s.cover&&s.cover.until>s.time&&s.cover.id===b.id;
  if(chain&&(b.hp/b.maxHp<.4||protecting)){
   const shield=alive(s,b.side).filter(u=>u!==b&&u.cls==='murmillo'&&u.linkReady<=s.time&&distance(u,b)<220)
    .sort((x,y)=>distance(x,b)-distance(y,b))[0];
   if(shield){
    target=shield;amount*=.45;shield.guard=.7;shield.linkReady=s.time+4;shield.blocks++;
    s.teamwork[b.side]++;if(b.side==='ally')s.meter=clamp(s.meter+8,0,100);
    emit(s,'cover',shield,b,shield.name+' → '+b.name+' 엄호');
   }else if(protecting){amount*=.55;b.guard=.5;}
  }
  if(b.exposed>0)amount*=1.25;
  const damage=Math.min(target.hp,Math.max(1,Math.round(amount)));
  target.hp-=damage;target.hit=.24;target.lastHitAt=s.time;a.damage+=damage;
  emit(s,kind,a,target,(kind==='assist'?'협공 ':'')+'−'+damage,{damage});
  if(target.hp<=0){
   target.dead=true;target.attack=null;target.counter=null;target.mode='';target.moving=false;target.deathAt=s.time;a.kills++;
   emit(s,'ko',a,target,target.name+' 전투 불능');
  }else if(chain&&kind==='hit'&&s.random()<.18){
   target.stagger=Math.max(target.stagger,.24);target.exposed=Math.max(target.exposed,.7);
   link(s,a,target,'빈틈 추격',1);
  }
  return damage;
 }
 function finish(s,reason){
  if(s.result)return s.result;
  const allies=alive(s,'ally'),enemies=alive(s,'enemy');
  const ratio=side=>s.units.filter(u=>u.side===side).reduce((n,u)=>n+u.hp/u.maxHp,0);
  const win=reason!=='retreat'&&(enemies.length===0&&allies.length>0||reason==='timeout'&&ratio('ally')>ratio('enemy'));
  s.result={win,reason,time:s.time,teamwork:s.teamwork.ally,
    units:s.units.map(u=>({...u,attack:null,counter:null})),defeated:5-enemies.length};
  emit(s,'result',null,null,reason==='retreat'?'전투 철수':win?'협동전 승리':'협동전 패배');
  return s.result;
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
   s.cover={id:target.id,until:s.time+7};s.coverReady=s.time+15;emit(s,'command',null,target,target.name+' 보호 진형 · 7초');return true;
  }
  if(kind==='rally'&&s.meter>=60){
   const allies=alive(s,'ally'),enemies=alive(s,'enemy');if(!allies.length||!enemies.length)return false;
   s.meter-=60;
   for(const u of allies){
    const t=enemies.slice().sort((a,b)=>distance(u,a)-distance(u,b))[0];
    s.links.push({actor:u.id,target:t.id,due:s.time+.25+u.seat*.15,expires:s.time+3.4,kind:'총공세'});
    u.cooldown=Math.min(u.cooldown,.3);
   }
   emit(s,'command',null,null,'연계 총공세!');return true;
  }
  return false;
 }
 function step(s,dt){
  if(s.result||s.paused)return s;
  dt=clamp(finite(dt,0),0,.05);s.time+=dt;s.turn=(s.turn||0)+1;
  for(const u of (s.turn%2?s.units:s.units.slice().reverse())){
   u.moving=false;if(u.dead)continue;
   for(const k of ['cooldown','hit','guard','swing','rooted','exposed','stagger','dash'])u[k]=Math.max(0,u[k]-dt);
   if(u.counter){
    const foe=s.units.find(v=>v.id===u.counter.target);
    if(!foe||foe.dead||s.time>u.counter.expires){u.counter=null;}
    else{
     u.face=foe.x>=u.x?1:-1;
     if(s.time>=u.counter.due&&distance(u,foe)<205){
      u.counter=null;u.attack=null;u.swing=.55;
      const dealt=hurt(s,u,foe,1.6,'counter',false);
      if(dealt&&!foe.dead){
       foe.exposed=Math.max(foe.exposed,1.35);foe.stagger=Math.max(foe.stagger,.48);
       link(s,u,foe,'반격 추가타',2);
      }
      emit(s,'riposte',u,foe,u.name+' 돌진 반격');
     }else travel(s,u,foe.x-u.face*130,foe.y+((u.seat%3)-1)*24,u.speed*dt*2.8);
     continue;
    }
   }
   if(u.stagger>0)continue;
   const assist=s.links.find(l=>l.actor===u.id&&l.expires>=s.time&&s.units.some(v=>v.id===l.target&&!v.dead));
   if(assist){
    const foe=s.units.find(v=>v.id===assist.target);
    u.face=foe.x>=u.x?1:-1;
    if(distance(u,foe)>190){
     u.dash=Math.max(u.dash,.15);
     travel(s,u,foe.x-u.face*127,foe.y+((u.seat%3)-1)*24,u.speed*dt*2.3);
    }
    continue;
   }
   if(u.attack){
    u.attack.remaining-=dt;
    if(u.attack.remaining<=0){
     const atk=u.attack;u.attack=null;u.swing=.32;
     const target=s.units.find(v=>v.id===atk.target);
     if(target&&!target.dead&&distance(u,target)<205){
      if(atk.special&&u.cls==='retiarius'){
       target.rooted=1.35;target.exposed=2;target.stagger=.4;
       emit(s,'net',u,target,u.name+' 그물 포획');link(s,u,target,'포획 협공',2);
      }else{
       const dealt=hurt(s,u,target,atk.special?1.5:1);
       if(atk.special&&dealt&&!target.dead){
        shove(s,target,u.face*90);target.exposed=1.5;target.stagger=.55;
        emit(s,'push',u,target,u.name+' 강타 밀어내기');
        link(s,u,target,'밀려난 적 추격',3);
       }
      }
     }else emit(s,'miss',u,target,'빗나감');
    }
    continue;
   }
   const enemies=alive(s,u.side==='ally'?'enemy':'ally');
   if(!enemies.length)continue;
   const directed=u.side==='ally'&&s.focus?.until>s.time?enemies.find(v=>v.id===s.focus.id):null;
   const target=directed||enemies.slice().sort((a,b)=>distance(u,a)+(a.seat===u.seat?-32:0)-distance(u,b)-(b.seat===u.seat?-32:0))[0];
   const near=enemies.slice().sort((a,b)=>distance(u,a)-distance(u,b))[0],nearDist=distance(u,near);
   u.target=target.id;u.face=target.x>=u.x?1:-1;
   if(!u.mode&&s.time>=u.retreatReady&&nearDist<255&&s.random()<dt*(u.hp/u.maxHp<.48?.42:.016)){
    u.mode='retreat';u.tacticUntil=s.time+2.5+s.random()*1.2;
    u.retreatReady=s.time+16+s.random()*6;u.recoverBudget=u.maxHp*.11;
    emit(s,'retreat',u,near,u.name+' 전열 이탈!');
   }
   if(u.mode==='retreat'&&s.time<u.tacticUntil){
    const dx=u.x-near.x,dy=u.y-near.y,len=Math.hypot(dx,dy)||1;
    const goalX=clamp(u.x+dx/len*190,85,1195);
    const goalY=clamp(u.y+dy/len*90+(u.seat%2?38:-38),395,675);
    if(!u.rooted)travel(s,u,goalX,goalY,u.speed*dt*1.85);
    if(nearDist>245&&s.time-u.lastHitAt>1.1&&u.recoverBudget>0){
     const gain=Math.min(u.maxHp-u.hp,u.recoverBudget,u.maxHp*.04*dt);
     if(gain>0){
      u.hp+=gain;u.recoverBudget-=gain;
      if(!u.nextHeal||s.time>=u.nextHeal){emit(s,'recover',u,u,u.name+' 안전 거리 · 체력 회복');u.nextHeal=s.time+.85;}
     }
    }
    continue;
   }
   if(u.mode==='retreat'){u.mode='';emit(s,'rejoin',u,target,u.name+' 전선 복귀');}
   if(!u.mode&&u.cooldown>.2&&nearDist>170&&nearDist<310&&s.random()<dt*.13){
    u.mode='feint';u.tacticUntil=s.time+.7+s.random()*.95;
    emit(s,'feint',u,target,u.name+' 간격 탐색 · 견제');
   }
   if(u.mode==='feint'&&s.time<u.tacticUntil){
    if(!u.rooted)travel(s,u,u.x-u.face*75,u.y+(u.seat%2?85:-85),u.speed*dt*.75);
    continue;
   }
   if(u.mode==='feint')u.mode='';
   if(u.rooted>0)continue;
   if(nearDist>205&&nearDist<415&&s.time>=u.dashReady&&s.random()<dt*.45){
    u.dash=.65;u.dashReady=s.time+6+s.random()*3;emit(s,'dash',u,target,u.name+' 전력 돌진!');
   }
   if(distance(u,target)>198){
    const speed=u.speed*(u.dash>0?2.65:1)*(u.side==='ally'&&s.cover?.id===u.id&&s.cover.until>s.time?.75:1);
    travel(s,u,target.x-u.face*130,target.y+((u.seat%3)-1)*25,speed*dt);
   }else if(u.cooldown<=0){
    const special=s.time>=u.specialReady;
    u.attack={target:target.id,special,remaining:special?.64:.4,total:special?.64:.4};
    u.cooldown=1.25+s.random()*.5;if(special)u.specialReady=s.time+8;
   }
  }
  // The shared collision field is never disabled for a corpse or during a dash.
  s.links=s.links.filter(l=>{
   const a=s.units.find(u=>u.id===l.actor),b=s.units.find(u=>u.id===l.target);
   if(!a||!b||a.dead||b.dead||s.time>l.expires)return false;
   if(s.time<l.due||distance(a,b)>215)return true;
   a.face=b.x>=a.x?1:-1;a.swing=.4;
   const dealt=hurt(s,a,b,l.kind==='총공세'?.85:1.05,'assist',false);
   if(dealt){
    a.assists++;s.teamwork[a.side]++;
    if(a.side==='ally'&&l.kind!=='총공세')s.meter=clamp(s.meter+10,0,100);
   }
   return false;
  });
  if(!alive(s,'ally').length||!alive(s,'enemy').length)finish(s,'elimination');
  else if(s.time>=s.limit)finish(s,'timeout');
  return s;
 }
 return {create,step,command,finish,alive,distance,footDistance};
});