/* CONCORDIA: five simultaneous fighters per side; no DOM or save dependencies. */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.ArenaCoopCore=api;
})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const Personality=(typeof window==='object'?window:globalThis).ArenaPersonality;
 const finite=(n,f)=>Number.isFinite(Number(n))?Number(n):f;
 const distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.45);
 const footDistance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.6);
 // A unit's world-space Y is its grounded foot position. Draw back-to-front
 // by this value alone: a corpse has exactly the same depth rules as a live fighter.
 function depthOrder(units){return units.slice().sort((a,b)=>a.y-b.y);}
 const SOLID_GAP=102; // Solid spacing applies only to living fighters. Corpses remain visual, nonblocking.
 // Team-only endurance: the crowd can see multiple tactics before eliminations.
 // Not written to roster stats; both sides benefit from the same multiplier.
 const STAMINA_MULT=1.5,CONTACT_RATE=.42;
 // Keep facing stable during close-quarter crossings and collision stalls.
 const FACE_DEADZONE=36,FACE_DWELL=.18,FACE_COOLDOWN=.50;
 function faceToward(s,u,foe){
  if(!foe||u.dead)return u.face;
  const dx=foe.x-u.x;
  if(Math.abs(dx)<FACE_DEADZONE){u.pendingFace=0;return u.face;}
  const desired=dx>0?1:-1;
  if(u.face===desired){u.pendingFace=0;return u.face;}
  if(u.pendingFace!==desired){u.pendingFace=desired;u.pendingFaceAt=s.time;return u.face;}
  if(s.time-u.pendingFaceAt>=FACE_DWELL&&s.time-(u.lastFaceAt??-Infinity)>=FACE_COOLDOWN){
   u.face=desired;u.lastFaceAt=s.time;u.pendingFace=0;
  }
  return u.face;
 }
 function rng(seed){let n=seed>>>0;return ()=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n/4294967296;};}
 function makeUnit(h,side,seat){
  const stats=h.combat||{},maxHp=Math.max(40,Math.round(finite(stats.hp,160)*STAMINA_MULT));
  const hp=Math.max(1,maxHp-clamp(Math.round(finite(h.injury,0)*1.3),0,maxHp-1));
  return {...h,id:side+seat,side,seat,maxHp,hp,startHp:hp,
   personality:Personality?.profile?.(h,stats,h.cls),mind:null,
   atk:Math.max(4,finite(stats.atk,20)),armor:clamp(finite(stats.armor,.1),0,.62),
   parry:clamp(finite(stats.parry,.14),.05,.48),speed:Math.max(70,finite(stats.move,220)*.48),
   sp:Math.max(1,finite(stats.sp,finite(stats.atk,20)*2.5)),specialCooldown:Math.max(3.1,finite(stats.specialCooldown,8)),
   recovery:clamp(finite(stats.recovery,1),.6,1),dodgeChance:clamp(finite(stats.dodgeChance,0),0,.30),
   guardEfficiency:clamp(finite(stats.guardEfficiency,0),0,.32),evadeReady:0,evade:0,
   x:side==='ally'?(seat%2?125:265):(seat%2?1155:1015),y:405+seat*62,
   face:side==='ally'?1:-1,cooldown:.4+seat*.2,linkReady:0,specialReady:4+seat,
   hit:0,guard:0,swing:0,rooted:0,exposed:0,stagger:0,dash:0,dashReady:2+seat*.5,
   counter:null,reaction:null,reactionReady:5+seat*.55,rescueAlertReady:0,chase:null,chaseReady:6+seat*.45,lure:false,protectedUntil:0,mode:'',tacticUntil:0,retreatReady:5+seat*1.7,recoverBudget:0,lastHitAt:-10,
   dead:false,moving:false,attack:null,damage:0,assists:0,blocks:0,kills:0};
 }
 function create(allies,enemies,{seed=Date.now(),limit=120}={}){
  if(allies.length!==5||enemies.length!==5)throw Error('각 팀은 정확히 5명이어야 합니다.');
  if(new Set(allies.map(h=>h.index)).size!==5)throw Error('같은 검투사를 중복 출전시킬 수 없습니다.');
  if(allies.some(h=>finite(h.injury,0)>=80||finite(h.fatigue,0)>=80))throw Error('중상 또는 탈진한 검투사는 출전할 수 없습니다.');
  return {units:[...allies.map((h,i)=>makeUnit(h,'ally',i)),...enemies.map((h,i)=>makeUnit(h,'enemy',i))],
   time:0,limit:clamp(finite(limit,120),10,180),random:rng(seed),events:[],serial:0,links:[],
   meter:25,focus:null,cover:null,focusReady:0,coverReady:0,formation:null,formationReady:0,flank:null,flankReady:0,paused:false,result:null,teamwork:{ally:0,enemy:0}};
 }
 const alive=(s,side)=>s.units.filter(u=>!u.dead&&(!side||u.side===side));
 function emit(s,type,a,b,text,extra={}){
  s.events.push({id:++s.serial,time:s.time,type,source:a?.id,target:b?.id,x:b?.x??a?.x,y:b?.y??a?.y,text,...extra});
  if(s.events.length>60)s.events.shift();
 }
 function free(s,u,x,y){
  return x>=85&&x<=1195&&y>=395&&y<=675&&
    s.units.every(v=>v===u||v.dead||footDistance({x,y},v)>=SOLID_GAP-.01);
 }
 function travel(s,u,tx,ty,step){
  const dx=tx-u.x,dy=ty-u.y,len=Math.hypot(dx,dy);
  if(len<1||step<=0||u.dead)return false;
  const stride=Math.min(step,len),ang=Math.atan2(dy,dx);
  // Sticky obstacle side; never take the former 180-degree reverse step.
  const sign=u.steerSide||(u.seat%2?-1:1);
  const angles=[0,sign*.42,sign*.85,sign*1.24,sign*1.47,-sign*.42,-sign*.85,-sign*1.24,-sign*1.47];
  for(const a of angles){
   const vx=Math.cos(ang+a),vy=Math.sin(ang+a);let x=u.x,y=u.y,ok=true;
   for(let t=0;t<stride;t+=7){
    const d=Math.min(7,stride-t);x=clamp(x+vx*d,85,1195);y=clamp(y+vy*d,395,675);
    if(!free(s,u,x,y)){ok=false;break;}
   }
   const actual=Math.hypot(x-u.x,y-u.y),forward=((x-u.x)*dx+(y-u.y)*dy)/len;
   if(ok&&actual>.65&&forward>Math.min(.12,stride*.04)){
    u.x=x;u.y=y;u.moving=actual>1.4;
    u.steerSide=a===0?0:Math.sign(a);
    return true;
   }
  }
  u.steerSide=0;return false; // Stuck means idle, not rapid walk jitter.
 }
 function shove(s,u,amount){
  const from=u.x,sign=Math.sign(amount);
  for(let t=0;t<Math.abs(amount);t+=5){
   const x=clamp(u.x+sign*Math.min(5,Math.abs(amount)-t),85,1195);
   if(!free(s,u,x,u.y))break;
   u.x=x;
  }
  if(Math.abs(u.x-from)>1){u.recoilFromX=from;u.recoilAt=s.time;u.recoilEndX=u.x;}
 }
 function beginFlight(s,u,fromX,kind){
  // Positions resolve immediately for squad collision; the canvas interpolates
  // from the contact point across the exact same displacement and landing.
  const reduced=!!(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  u.flight={fromX,at:s.time,duration:kind==='death'?1.16:.78,
   height:reduced?12:kind==='death'?145:90,reduced,kind};
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
 // Crisis reactions are scheduled on the rescuer, never the victim. Limited cooldowns
 // prevent a cascade of reactions triggering themselves.
 function callReaction(s,kind,ward,foe){
  if(!ward||!foe||ward.dead||foe.dead)return false;
  const candidates=alive(s,ward.side).filter(u=>u!==ward&&!u.reaction&&
   !u.counter&&u.stagger<=0&&u.rooted<=0&&u.mode!=='retreat'&&u.reactionReady<=s.time&&distance(u,foe)<485)
    .sort((a,b)=>(distance(a,foe)-(a.cls==='murmillo'&&kind==='rescue'?45:0))-
                  (distance(b,foe)-(b.cls==='murmillo'&&kind==='rescue'?45:0)));
  const actor=candidates[0];if(!actor)return false;
  actor.reaction={kind,target:foe.id,ward:ward.id,due:s.time+.24,expires:s.time+3.2};
  actor.reactionReady=s.time+(kind==='rescue'?12:14);
  actor.attack=null;actor.mode='';actor.lure=false;
  emit(s,kind==='rescue'?'rescue-call':'ambush-call',actor,ward,
    actor.name+(kind==='rescue'?' 동료 구출!':' 매복 준비!'),{victim:foe.id});
  return true;
 }
 function hurt(s,a,b,mult=1,kind='hit',chain=true){
  if(a.dead||b.dead)return 0;
  let target=b,amount=a.atk*CONTACT_RATE*mult*(.87+s.random()*.26)*(1-b.armor);
  // A brief, visible evasion; rooting/stagger prevents dodges and stops chain immunity.
  if(chain&&b.stagger<=0&&b.rooted<=0&&s.time>=b.evadeReady&&b.dodgeChance>0&&s.random()<b.dodgeChance){
   b.evadeReady=s.time+2.4;b.evade=.30;b.dash=.28;shove(s,b,b.x>=a.x?38:-38);
   emit(s,'dodge',b,a,b.name+' 회피!');return 0;
  }
  if(chain&&b.stagger<=0&&b.rooted<=0&&b.guardEfficiency>0&&s.random()<b.guardEfficiency){
   amount*=.55;b.guard=.4;b.blocks++;emit(s,'guard',b,a,b.name+' 방패 방어');
  }
  if(chain&&b.stagger<=0&&b.rooted<=0&&s.random()<Math.min(.65,b.parry*(b.side==='ally'&&s.formation?.until>s.time?1.38:1))){
   b.guard=.5;b.blocks++;b.counter={target:a.id,due:s.time+.18,expires:s.time+1.7};
   b.attack=null;b.dash=.55;b.dashReady=s.time+3;
   a.exposed=1.7;a.stagger=.82;a.attack=null;
   const fromX=a.x;shove(s,a,a.x>=b.x?215:-215);beginFlight(s,a,fromX,'parry');
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
  if(target.side==='ally'&&s.formation?.until>s.time)amount*=.74;
  if(target.protectedUntil>s.time)amount*=.58;
  const damage=Math.min(target.hp,Math.max(1,Math.round(amount)));
  target.hp-=damage;target.hit=.24;target.lastHitAt=s.time;a.damage+=damage;
  emit(s,kind,a,target,(kind==='assist'?'협공 ':'')+'−'+damage,{damage});
  if(target.hp<=0){
   target.dead=true;target.attack=null;target.counter=null;target.mode='';target.moving=false;target.deathAt=s.time;a.kills++;
   const fromX=target.x;shove(s,target,target.x>=a.x?330:-330);beginFlight(s,target,fromX,'death');
   emit(s,'ko',a,target,target.name+' 전투 불능');
  }else{
   if(chain&&target.hp/target.maxHp<.53&&s.time>=target.rescueAlertReady){
    target.rescueAlertReady=s.time+10;
    callReaction(s,'rescue',target,a);
   }
   if(chain&&kind==='hit'&&s.random()<.18){
    target.stagger=Math.max(target.stagger,.24);target.exposed=Math.max(target.exposed,.7);
    link(s,a,target,'빈틈 추격',1);
   }
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
  if(kind==='formation'){
   if(s.time<s.formationReady||!alive(s,'ally').length)return false;
   s.formation={until:s.time+5.3};s.formationReady=s.time+19;
   for(const u of alive(s,'ally'))u.guard=Math.max(u.guard,.62);
   emit(s,'command',null,null,'방어진형 · 5초간 피해 감소, 패링 확률 상승');
   return true;
  }
  if(kind==='flank'){
   if(s.time<s.flankReady||!alive(s,'ally').length||!alive(s,'enemy').length)return false;
   s.flank={until:s.time+4.5};s.flankReady=s.time+17;
   for(const u of alive(s,'ally')){u.dash=Math.max(u.dash,.65);u.cooldown=Math.min(u.cooldown,.28);}
   emit(s,'command',null,null,'양익 돌파 · 4.5초간 돌진속도 상승');
   return true;
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
  if(s.paused)return s;
  dt=clamp(finite(dt,0),0,.05);
  // Let the final body complete its real-time flight before the results dialog.
  if(s.result){s.time+=dt;return s;}
  s.time+=dt;s.turn=(s.turn||0)+1;
  for(const u of (s.turn%2?s.units:s.units.slice().reverse())){
   u.moving=false;if(u.dead)continue;
   for(const k of ['cooldown','hit','guard','swing','rooted','exposed','stagger','dash','evade'])u[k]=Math.max(0,u[k]-dt);
   if(u.counter){
    const foe=s.units.find(v=>v.id===u.counter.target);
    if(!foe||foe.dead||s.time>u.counter.expires){u.counter=null;}
    else{
     faceToward(s,u,foe);
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
   // Rescuers and ambushers dash into range before making one decisive interruption.
   if(u.reaction){
    const r=u.reaction,foe=s.units.find(v=>v.id===r.target),ward=s.units.find(v=>v.id===r.ward);
    if(!foe||foe.dead||!ward||ward.dead||s.time>r.expires)u.reaction=null;
    else{
     faceToward(s,u,foe);
     if(s.time>=r.due&&distance(u,foe)<215){
      u.reaction=null;u.swing=.56;u.dash=.4;
      const dealt=hurt(s,u,foe,r.kind==='ambush'?1.32:1.04,r.kind,false);
      if(dealt){
       foe.stagger=Math.max(foe.stagger,r.kind==='ambush'?.9:.75);
       foe.exposed=Math.max(foe.exposed,1.3);
       shove(s,foe,u.face*(r.kind==='ambush'?154:120));
       u.blocks++;s.teamwork[u.side]++;
       if(u.side==='ally')s.meter=clamp(s.meter+12,0,100);
       if(r.kind==='rescue'){ward.protectedUntil=s.time+1.8;ward.guard=Math.max(ward.guard,.85);}
       if(!foe.dead)link(s,u,foe,r.kind==='rescue'?'구출 후 반격':'매복 협공',2);
       emit(s,r.kind,u,foe,u.name+(r.kind==='rescue'?' 구출 성공 → 반격!':' 기습 성공 → 연속 공격!'));
      }
     }else{
      u.dash=Math.max(u.dash,.18);
      travel(s,u,foe.x-u.face*135,foe.y+((u.seat%3)-1)*22,u.speed*dt*2.75);
     }
     continue;
    }
   }
   if(u.stagger>0)continue;
   const assist=s.links.find(l=>l.actor===u.id&&l.expires>=s.time&&s.units.some(v=>v.id===l.target&&!v.dead));
   if(assist){
    const foe=s.units.find(v=>v.id===assist.target);
    faceToward(s,u,foe);
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
       hurt(s,u,target,u.sp*.35/u.atk,'net-hit',false);
       if(target.dead)continue;
       target.rooted=1.35;target.exposed=2;target.stagger=.4;
       emit(s,'net',u,target,u.name+' 그물 포획');link(s,u,target,'포획 협공',2);
      }else{
       const dealt=hurt(s,u,target,atk.special?u.sp*.60/u.atk:1);
       if(atk.special&&dealt&&!target.dead){
        shove(s,target,u.face*165);target.exposed=1.5;target.stagger=.55;
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
   const chasing=u.chase?.until>s.time?enemies.find(v=>v.id===u.chase.target):null;
   const preferred=enemies.slice().sort((a,b)=>distance(u,a)+(a.seat===u.seat?-32:0)-distance(u,b)-(b.seat===u.seat?-32:0))[0];
   const previous=enemies.find(v=>v.id===u.target);
   // Avoid retargeting between equally close enemies on successive frames.
   const target=directed||chasing||(previous&&distance(u,previous)<=distance(u,preferred)+58?previous:preferred);
   const near=enemies.slice().sort((a,b)=>distance(u,a)-distance(u,b))[0],nearDist=distance(u,near);
   const mood=Personality?.parameters?.(u,s.time,s.random);
   u.target=target.id;faceToward(s,u,target);
   if(u.chase&&(!chasing||s.time>=u.chase.until))u.chase=null;
   if(!directed&&target.mode==='retreat'&&nearDist<435&&
       s.time>=u.chaseReady&&!u.chase&&u.hp/u.maxHp>.26){
    u.chase={target:target.id,until:s.time+2.6};
    u.chaseReady=s.time+11+s.random()*4;u.dash=Math.max(.55,u.dash);
    emit(s,'chase',u,target,u.name+' 도주자 추격!');
    if(target.lure)callReaction(s,'ambush',target,u);
   }
   if(!u.mode&&s.time>=u.retreatReady&&nearDist<255&&s.random()<dt*(u.hp/u.maxHp<.48?.42:.016)*(mood?.retreat?3.1:.65)){
    u.mode='retreat';u.tacticUntil=s.time+2.5+s.random()*1.2;
    u.retreatReady=s.time+16+s.random()*6;u.recoverBudget=u.maxHp*.11;
    // An occasional intentional retreat invites enemy pursuit into a friendly ambush.
    u.lure=u.hp/u.maxHp>.38&&s.random()<.42&&
       alive(s,u.side).some(v=>v!==u&&!v.dead&&v.reactionReady<=s.time&&distance(v,near)<485);
    if(u.lure){u.recoverBudget=0;emit(s,'bait',u,near,u.name+' 후퇴로 적을 유인!');}
    else emit(s,'retreat',u,near,u.name+' 전열 이탈!');
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
   if(u.mode==='retreat'){u.mode='';u.lure=false;emit(s,'rejoin',u,target,u.name+' 전선 복귀');}
   if(!u.mode&&u.cooldown>.2&&nearDist>170&&nearDist<310&&s.random()<dt*.13*(mood?.mode==='feint'?5:mood?.mode==='circle'?2.1:.7)){
    u.mode='feint';u.tacticUntil=s.time+.7+s.random()*.95;
    emit(s,'feint',u,target,u.name+' 간격 탐색 · 견제');
   }
   if(u.mode==='feint'&&s.time<u.tacticUntil){
    if(!u.rooted)travel(s,u,u.x-u.face*75,u.y+(u.seat%2?85:-85),u.speed*dt*.75);
    continue;
   }
   if(u.mode==='feint')u.mode='';
   if(u.rooted>0)continue;
   if(nearDist>205&&nearDist<415&&s.time>=u.dashReady&&s.random()<dt*.45*(mood?.rush||1)){
    u.dash=.65;u.dashReady=s.time+6+s.random()*3;emit(s,'dash',u,target,u.name+' 전력 돌진!');
   }
   if(distance(u,target)>clamp(198+(mood?.spacing||0)*.27,185,222)){
    const speed=u.speed*(u.dash>0?2.65:1)*(u.chase?1.55:1)*
     (u.side==='ally'&&s.flank?.until>s.time?1.38:1)*
     (u.side==='ally'&&s.cover?.id===u.id&&s.cover.until>s.time?.75:1)*(mood?.speed||1);
    travel(s,u,target.x-u.face*(130+(mood?.spacing||0)*.22),target.y+((u.seat%3)-1)*25,speed*dt);
   }else if(u.cooldown<=0){
    const special=s.time>=u.specialReady&&(mood?.mode==='burst'||mood?.mode==='press'||s.random()<.75);
    u.attack={target:target.id,special,remaining:special?.64:.4,total:special?.64:.4};
    u.cooldown=(1.25+s.random()*.5)*u.recovery/clamp(mood?.aggression||1,.65,1.55);if(special)u.specialReady=s.time+u.specialCooldown;
   }
  }
  // Only living fighters block movement, including dash and knockback. Fallen bodies persist visually.
  s.links=s.links.filter(l=>{
   const a=s.units.find(u=>u.id===l.actor),b=s.units.find(u=>u.id===l.target);
   if(!a||!b||a.dead||b.dead||s.time>l.expires)return false;
   if(s.time<l.due||distance(a,b)>215)return true;
   faceToward(s,a,b);a.swing=.4;
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
 return {create,step,command,finish,alive,distance,footDistance,depthOrder,faceToward,travel};
});