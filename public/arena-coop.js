(function(root){
 'use strict';
 const C=root.ArenaCoopCore,escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let current=null;
 function open(allies,enemies,{onFinish,onClose,seed}={}){
  if(current)return false;
  const sim=C.create(allies,enemies,{seed}),host=document.createElement('section');
  host.className='arena-coop';host.setAttribute('aria-label','5vs5 실시간 협동전투');
  const previousFocus=document.activeElement,oldOverflow=document.body.style.overflow;
  const state={sim,host,frame:0,last:0,eventId:0,fx:[],paused:false,settled:false,selected:null,flash:0,nextCinematicAt:0,cinematic:null,focusFrame:null};current=state;
  host.innerHTML='<header class="coop-header"><div><small>CONCORDIA · TEAM ARENA</small><h1>5 vs 5 협동전투</h1></div><div class="coop-clock" aria-label="남은 시간">2:00</div><div class="coop-header-actions"><button data-pause>일시정지</button><button data-exit>철수</button></div></header>'+
   '<div class="coop-scoreboard"><div class="coop-team coop-allies" aria-label="아군"></div><div class="coop-versus">VS</div><div class="coop-team coop-enemies" aria-label="적군"></div></div>'+
   '<div class="coop-field"><canvas width="1280" height="720" aria-label="열 명이 동시에 싸우는 전장. 아래와 위의 버튼으로 명령할 수 있습니다."></canvas><div class="coop-callout" role="status"></div><div class="coop-pause-layer" hidden><strong>전투 일시정지</strong><span>명령과 전투 시간이 함께 멈춥니다.</span><button data-resume>계속하기</button></div></div>'+
   '<footer class="coop-footer"><div class="coop-orders"><button data-cover>엄호 <small>위험한 아군 보호</small></button><button data-rally>연계 총공세 <small>연계 60 소모</small></button><div class="coop-gauge"><label>연계 <b data-meter>25 / 100</b></label><progress max="100" value="25"></progress></div></div><p class="coop-help"><span data-focus>집중 공격 준비</span> · 자동 전투 · 적 카드를 눌러 6초 집중 공격 · 아군 선택 후 엄호 · 패링/포획/밀치기에 동료가 호응</p><div class="coop-log" aria-label="최근 전투 상황"></div></footer>'+
   '<div class="coop-modal" hidden></div>';
  document.body.append(host);document.body.style.overflow='hidden';
  const $=q=>host.querySelector(q),canvas=$('canvas'),ctx=canvas.getContext('2d'),bg=new Image();
  bg.src='assets/new-era/arena.webp';
  for(const side of ['ally','enemy']){
   const team=$(side==='ally'?'.coop-allies':'.coop-enemies');
   team.innerHTML=sim.units.filter(u=>u.side===side).map(u=>'<button class="coop-unit" data-unit="'+u.id+'" aria-label="'+escape(u.name)+'"><span class="coop-unit-name">'+escape(u.name)+'</span><small>'+({murmillo:'방패 · 엄호',thraex:'검 · 측면',retiarius:'그물 · 포획'}[u.cls]||'검투사')+'</small><progress max="'+u.maxHp+'" value="'+u.hp+'"></progress><span class="coop-hp"></span></button>').join('');
  }
  function tell(text,kind=''){const callout=$('.coop-callout');callout.textContent=text;
   callout.dataset.kind=['rescue','ambush','chase','bait'].includes(kind)?kind:'';
   state.calloutUntil=sim.time+(kind?2.2:2.8);}
  function pause(value){state.paused=value;sim.paused=value;$('.coop-pause-layer').hidden=!value;$('[data-pause]').textContent=value?'계속하기':'일시정지';}
  function sound(kind){root.ArenaAudio?.play?.(kind,{gain:.55});}
  host.addEventListener('click',e=>{
   const unit=e.target.closest('[data-unit]');
   if(unit&&!sim.result){const u=sim.units.find(v=>v.id===unit.dataset.unit);if(u.dead)return;
    if(u.side==='ally'){state.selected=u.id;tell(u.name+' 선택 · 엄호 명령으로 보호');}
    else if(!C.command(sim,'focus',u.id))tell(state.paused?'계속하기를 눌러 전투를 재개하세요.':'집중 공격 재사용 대기 중');}
  });
  $('[data-cover]').onclick=()=>{if(!C.command(sim,'cover',state.selected))tell('엄호를 아직 사용할 수 없습니다.');};
  $('[data-rally]').onclick=()=>{if(!C.command(sim,'rally'))tell('연계 60이 필요합니다.');};
  $('[data-pause]').onclick=()=>{if(!sim.result)pause(!state.paused);};
  $('[data-resume]').onclick=()=>pause(false);
  function close(){
   cancelAnimationFrame(state.frame);document.removeEventListener('visibilitychange',visibility);
   document.removeEventListener('keydown',keys);root.removeEventListener('beforeunload',unload);
   root.ArenaAudio?.leave?.();host.remove();document.body.style.overflow=oldOverflow;current=null;
   onClose?.();if(previousFocus?.isConnected)previousFocus.focus();
  }
  function results(){
   if(state.settled)return;state.settled=true;
   const result=sim.result;let reward;
   try{reward=onFinish?.(result)||{};}catch(error){console.error('COOP_SETTLEMENT_FAILED',error);reward={error:'결과 저장에 실패했습니다. 저장 공간을 확인하세요.'};}
   root.ArenaAudio?.endMatch?.(result.win);const modal=$('.coop-modal');modal.hidden=false;
   const reason=result.reason==='retreat'?'자진 철수':result.reason==='timeout'?'제한 시간 · 팀 잔여 체력 비율 판정':result.win?'상대팀 전투 불능':'아군 전투 불능';
   modal.innerHTML='<section class="coop-result" role="dialog" aria-modal="true" aria-label="협동전 결과"><small>CONCORDIA · RESULT</small><h2>'+ (result.reason==='retreat'?'전투 철수':result.win?'협동전 승리':'협동전 패배')+'</h2><p>'+reason+' · '+Math.ceil(result.time)+'초 · 협동 '+result.teamwork+'회</p><div class="coop-prize">'+escape(reward.error||('보상 +'+(reward.gold||0)+' D · 명예 +'+(reward.glory||0)))+'</div><div class="coop-result-list">'+result.units.filter(u=>u.side==='ally').map(u=>{
    const r=reward.heroes?.find(h=>h.index===u.index);
    return '<div><strong>'+escape(u.name)+'</strong><span>피해 '+u.damage+' · 협공 '+u.assists+' · 방어 '+u.blocks+'</span><small>EXP +'+(r?.xp||0)+' · 부상 '+(r?.injury??'—')+' · 피로 '+(r?.fatigue??'—')+'</small></div>';
   }).join('')+'</div><p data-save-note>'+escape(reward.error?'':reward.saved===false?'저장 실패 · 이 화면을 유지하고 저장 재시도를 눌러주세요.':'결과 저장 완료 · 일반 결투 진행도는 유지됩니다.')+'</p>'+(reward.saved===false?'<button data-retry>저장 재시도</button>':'')+'<button data-back>편성 화면으로</button></section>';
   modal.querySelector('[data-back]').onclick=close;
   modal.querySelector('[data-retry]')?.addEventListener('click',e=>{if(reward.retry?.()){e.target.textContent='저장 완료';e.target.disabled=true;modal.querySelector('[data-save-note]').textContent='결과 저장 완료 · 일반 결투 진행도는 유지됩니다.';}});
   modal.querySelector('button').focus();
  }
  $('[data-exit]').onclick=()=>{
   if(sim.result)return;const wasPaused=state.paused;pause(true);const modal=$('.coop-modal');modal.hidden=false;
   modal.innerHTML='<section class="coop-result" role="dialog" aria-modal="true" aria-label="철수 확인"><h2>전투에서 철수할까요?</h2><p>승리 보상 없이 종료합니다.<br>출전 피로와 현재까지 받은 부상은 저장됩니다.</p><button data-stay>전투 계속</button><button data-retreat>철수 확정</button></section>';
   modal.querySelector('[data-stay]').onclick=()=>{modal.hidden=true;pause(wasPaused);};
   modal.querySelector('[data-retreat]').onclick=()=>{C.finish(sim,'retreat');results();};modal.querySelector('[data-stay]').focus();
  };
  function visibility(){if(document.hidden&&!sim.result)pause(true);}
  function unload(e){if(!sim.result){e.preventDefault();e.returnValue='';}}
  function keys(e){
   if(e.key==='Tab'){const scope=!$('.coop-modal').hidden?$('.coop-modal'):host;
    const buttons=Array.from(scope.querySelectorAll('button:not(:disabled)')).filter(b=>b.getClientRects().length);
    if(buttons.length&&(e.shiftKey&&document.activeElement===buttons[0]||!e.shiftKey&&document.activeElement===buttons.at(-1))){e.preventDefault();buttons[e.shiftKey?buttons.length-1:0].focus();}}
   if(e.key==='Escape'&&!sim.result&&$('.coop-modal').hidden){e.preventDefault();pause(!state.paused);}
  }
  document.addEventListener('visibilitychange',visibility);document.addEventListener('keydown',keys);root.addEventListener('beforeunload',unload);
  function art(u,pose,tick){return u.side==='ally'?root.LudusBridge.squadSprite(u,pose,tick):root.LudusBridge.practiceEnemySprite(u.look,pose);}
  function drawUnit(u){
   const pose=u.dead?'death':u.hit>0?'hit':u.guard>0?'guard':u.attack||u.swing>0?'attack':u.moving?'walk':'idle';
   const progress=u.dead?Math.min(1,(sim.time-u.deathAt)/.8):u.attack? .4*(1-u.attack.remaining/u.attack.total):u.swing>0?.4+.6*(1-u.swing/.4):pose==='hit'?1-u.hit/.24:(sim.time*.8)%1;
   const action=pose==='attack'?(u.cls==='retiarius'?'thrust':'slash'):pose;
   const look=root.PracticeScaleProfiles?.look?.(u,root.LudusBridge?.state?.()?.roster)||u.look,
    profile=root.PracticeVisualProfiles?.resolve(look,action)||{x:0,y:0,scale:1};
   const motion=root.PracticeVisualProfiles?.sampleMotion(profile,progress)||{x:0,y:0};
   const tick=pose==='death'?Math.floor(progress*7):pose==='attack'?Math.floor(progress*7):sim.time*8;
   const image=art(u,pose,tick),idle=art(u,'idle',0);if(!image||!idle?.height)return;
   const z=.60,k=(root.PracticeScaleProfiles?.framePixels?.(look,idle.height,202)||
    202/idle.height*(root.PracticeScaleProfiles?.scale?.(look)||1))*z*profile.scale;
   const reduced=!!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
   const body=root.ArenaMotion?.pose?.(u,sim.time,reduced)||{x:0,y:0,tilt:0};
   const impact=root.ArenaMotion?.visual?.(u,reduced,true)||{scale:1,flash:0};
   const frame=root.LudusBridge.practiceFrame(u,pose),px=frame?.canvas===image&&Number.isFinite(frame.pivotX)?frame.pivotX:image.width/2,py=frame?.canvas===image&&Number.isFinite(frame.footY)?frame.footY:image.height;
   ctx.save();ctx.translate(u.x+(profile.x+motion.x)*z*u.face,u.y+((root.PracticeScaleProfiles?.foot(look)||0)+profile.y+motion.y)*z);
   if(!u.dead){ctx.translate(body.x,body.y);ctx.rotate(body.tilt||0);ctx.scale(impact.scale||1,impact.scale||1);}
   ctx.scale(u.face,1);
   if(impact.flash>0)ctx.filter='brightness('+(1+impact.flash*2.5).toFixed(2)+')';
   if(!u.dead&&u.recoilAt!==undefined&&sim.time-u.recoilAt<.58){
    const life=1-(sim.time-u.recoilAt)/.58;
    for(const [t,alpha] of [[0,.14],[.25,.23],[.5,.36],[.75,.48]]){
     ctx.globalAlpha=life*alpha;
     ctx.drawImage(image,-px*k+(u.recoilFromX-u.x)*(1-t)*u.face,-py*k,image.width*k,image.height*k);
    }
   }
   if(u.dash>0&&!u.dead){
    for(const [offset,alpha] of [[-69,.12],[-38,.23]]){
     ctx.globalAlpha=alpha*Math.min(1,u.dash/.25);
     ctx.drawImage(image,-px*k+offset,-py*k,image.width*k,image.height*k);
    }
   }
   ctx.globalAlpha=1;ctx.drawImage(image,-px*k,-py*k,image.width*k,image.height*k);ctx.restore();
   if(u.dead)return;
   const tactic=u.reaction?u.reaction.kind:u.chase?.until>sim.time?'chase':u.mode==='retreat'&&u.lure?'bait':u.mode;
   const tag={rescue:'구출 돌진',ambush:'기습!',chase:'맹추격',bait:'유인 중',retreat:'후퇴 · 회복',feint:'견제'}[tactic];
   if(tag){
    ctx.save();ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#171008';
    ctx.fillStyle=({rescue:'#b4f9df',ambush:'#ffcf7d',chase:'#ffc6b1',bait:'#d1c6ff',retreat:'#bdeba9',feint:'#f0d394'})[tactic];
    ctx.strokeText(tag,u.x,u.y-118);ctx.fillText(tag,u.x,u.y-118);ctx.restore();
   }
   if(u.protectedUntil>sim.time){
    ctx.save();ctx.strokeStyle='#a4e6cd';ctx.lineWidth=3;ctx.globalAlpha=.4+.4*Math.sin(sim.time*12);
    ctx.beginPath();ctx.ellipse(u.x,u.y-63,47,74,0,0,Math.PI*2);ctx.stroke();ctx.restore();
   }
   ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillStyle=u.side==='ally'?'#d9ffd0':'#ffd3b5';ctx.strokeStyle='#20110a';ctx.lineWidth=3;ctx.strokeText(String(u.seat+1),u.x-40,u.y+15);ctx.fillText(String(u.seat+1),u.x-40,u.y+15);
   ctx.fillStyle='#170e0c';ctx.fillRect(u.x-31,u.y+8,62,6);ctx.fillStyle=u.side==='ally'?'#a7dca4':'#ed9276';ctx.fillRect(u.x-30,u.y+9,60*u.hp/u.maxHp,4);
   if(u.attack){ctx.fillStyle='#f2b95d';ctx.fillRect(u.x-24,u.y+18,48*(1-u.attack.remaining/u.attack.total),3);}
   if(u.rooted>0){ctx.strokeStyle='#eac78b';ctx.lineWidth=2;ctx.strokeRect(u.x-30,u.y-55,60,50);ctx.fillStyle='#fff2ca';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText('포획',u.x,u.y-65);}
   if(sim.focus?.id===u.id&&sim.focus.until>sim.time||state.selected===u.id){ctx.strokeStyle=u.side==='ally'?'#d9f0c7':'#ffcd77';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(u.x,u.y+10,40,12,0,0,Math.PI*2);ctx.stroke();}
  }
  function draw(){
   const mobile=host.clientWidth<=700,field=$('.coop-field');
   const width=mobile?Math.round(field.clientWidth*1.5):1280,height=mobile?Math.round(field.clientHeight*1.5):720;
   if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
   ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#100c09';ctx.fillRect(0,0,width,height);
   if(mobile){const visible=C.alive(sim),xs=visible.map(u=>u.x),left=Math.min(...xs,640),right=Math.max(...xs,640);
    const desired=Math.max(620,right-left+220);state.cameraWidth=(state.cameraWidth||1280)+(desired-(state.cameraWidth||1280))*.06;
    const scale=Math.min(width/state.cameraWidth,height/720),center=(left+right)/2;
    ctx.setTransform(scale,0,0,scale,width/2-center*scale,(height-720*scale)/2);
   }
   if(bg.complete&&bg.naturalWidth){const horizon=bg.naturalHeight*.76;ctx.drawImage(bg,0,0,bg.naturalWidth,horizon,0,0,1280,350);ctx.drawImage(bg,0,horizon,bg.naturalWidth,bg.naturalHeight-horizon,0,350,1280,370);}else{ctx.fillStyle='#69503b';ctx.fillRect(0,0,1280,720);}
   // A wide camera keeps all ten fighters on the approved arena floor.
   ctx.fillStyle='#120b0744';ctx.fillRect(0,0,1280,720);
   // World Y is each fighter's foot/depth anchor: smaller Y first (farther back).
   // Dead and living sprites use identical depth ordering; corpses stay fully opaque.
   for(const u of C.depthOrder(sim.units))drawUnit(u);
   for(const e of state.fx){
    const age=sim.time-e.time;if(age>1.3)continue;
    if(['link','cover','rescue-call','ambush-call','chase','bait'].includes(e.type)){
     const a=sim.units.find(u=>u.id===e.source),b=sim.units.find(u=>u.id===e.target);if(!a||!b)continue;
     ctx.save();ctx.globalAlpha=Math.max(0,1-age/1.3);
     ctx.strokeStyle=['rescue-call','cover'].includes(e.type)?'#a2e9d3':['ambush-call','bait'].includes(e.type)?'#f6c875':e.type==='chase'?'#f4a18e':'#f8d38b';
     ctx.lineWidth=e.type==='rescue-call'||e.type==='ambush-call'?5:3;ctx.setLineDash([9,7]);
     ctx.beginPath();ctx.moveTo(a.x,a.y-75);ctx.lineTo(b.x,b.y-75);ctx.stroke();ctx.restore();
    }
    if(['hit','assist','parry','counter','riposte','rescue','ambush','push'].includes(e.type)&&age<.52){
     const kind=['parry','counter','riposte','rescue'].includes(e.type)?'parry':
      ['ambush','push'].includes(e.type)?'special':'hit';
     const big=['counter','riposte','rescue','ambush','push'].includes(e.type);
     root.ArenaRasterFX?.draw(ctx,kind,e.x,e.y-80,big?305:180,big?270:166,age/.52,big?1:.90,1);
    }
    if(['dash','push','retreat','recover','chase','bait','rescue-call','ambush-call'].includes(e.type)&&age<.9){
     ctx.save();ctx.globalAlpha=Math.max(0,.68-age*.75);ctx.lineWidth=e.type==='push'?5:3;
     ctx.strokeStyle=['recover','rescue-call'].includes(e.type)?'#8ce3a8':['retreat','bait'].includes(e.type)?'#bba6f3':e.type==='chase'?'#ee8d72':'#f9cb82';
     ctx.beginPath();ctx.ellipse(e.x,e.y+7,22+age*65,9+age*19,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    if(e.damage){ctx.save();ctx.globalAlpha=Math.max(0,1-age/1.3);ctx.fillStyle=e.type==='assist'?'#ffdf84':'#fff1dd';ctx.strokeStyle='#29160f';ctx.lineWidth=4;ctx.textAlign='center';ctx.font='bold 22px sans-serif';ctx.strokeText(e.text,e.x,e.y-110-age*35);ctx.fillText(e.text,e.x,e.y-110-age*35);ctx.restore();}
   }
  }
  function hud(){
   const time=Math.ceil(Math.max(0,sim.limit-sim.time));$('.coop-clock').textContent=Math.floor(time/60)+':'+String(time%60).padStart(2,'0');
   for(const u of sim.units){const b=$('[data-unit="'+u.id+'"]');b.disabled=u.dead||!!sim.result;b.classList.toggle('is-selected',u.id===state.selected||sim.focus?.id===u.id&&sim.focus.until>sim.time);b.classList.toggle('is-dead',u.dead);b.querySelector('progress').value=u.hp;b.querySelector('.coop-hp').textContent=u.dead?'전투 불능':Math.ceil(u.hp)+' / '+u.maxHp;}
   $('[data-meter]').textContent=Math.floor(sim.meter)+' / 100';$('progress[max="100"]').value=sim.meter;
   const cd=Math.max(0,Math.ceil(sim.coverReady-sim.time));$('[data-cover]').disabled=!!sim.result||state.paused||cd>0;
   $('[data-cover]').innerHTML='엄호 <small>'+(cd?cd+'초 후 사용':state.selected?escape(sim.units.find(u=>u.id===state.selected)?.name):'가장 위험한 아군')+'</small>';
   $('[data-rally]').disabled=!!sim.result||state.paused||sim.meter<60;
   $('[data-focus]').textContent=sim.focusReady>sim.time?'집중 공격 '+Math.ceil(sim.focusReady-sim.time)+'초 후 사용':'집중 공격 준비';
   $('.coop-enemies').setAttribute('aria-label','적군 · 집중 공격 재사용 '+Math.max(0,Math.ceil(sim.focusReady-sim.time))+'초');
   if(state.calloutUntil<sim.time)$('.coop-callout').textContent='';
  }
  function loop(now){
   if(current!==state)return;
   const dt=state.last?Math.min(.05,(now-state.last)/1000):0;state.last=now;
   C.step(sim,dt);
   const events=sim.events.filter(e=>e.id>state.eventId);
   for(const e of events){state.eventId=e.id;state.fx.push(e);
    if(['link','cover','net','push','ko','command','dash','riposte','retreat','recover','feint','rejoin','bait','chase','ambush-call','ambush','rescue-call','rescue'].includes(e.type)){
     const row=document.createElement('span');row.textContent=e.text;$('.coop-log').prepend(row);while($('.coop-log').children.length>3)$('.coop-log').lastChild.remove();
     if(['link','command','ko','riposte','retreat','bait','ambush-call','ambush','rescue-call','rescue'].includes(e.type))tell(e.text,e.type.startsWith('rescue')?'rescue':e.type.startsWith('ambush')?'ambush':e.type==='bait'?'bait':'');
    }
   }
   const audible=events.find(e=>['parry','riposte','ambush','rescue'].includes(e.type))||
     events.find(e=>['counter','push','chase'].includes(e.type))||events.find(e=>e.type==='assist')||events.find(e=>e.type==='hit');
   if(audible&&sim.time>(state.nextSound||0)){
    sound(audible.type==='parry'?'parry':['assist','counter','riposte','push','ambush','rescue'].includes(audible.type)?'heavy_hit':'hit');
    state.nextSound=sim.time+.12;
   }
   state.fx=state.fx.filter(e=>sim.time-e.time<1.3);
   draw();if(!state.lastHud||now-state.lastHud>100){hud();state.lastHud=now;}
   root.ArenaAudio?.update?.({phase:sim.result?'result':'fight',paused:state.paused,combo:sim.teamwork.ally,health:C.alive(sim,'ally').reduce((n,u)=>n+u.hp/u.maxHp,0)/5,distance:100});
   if(sim.result)results();state.frame=requestAnimationFrame(loop);
  }
  root.ArenaAudio?.unlock?.();root.ArenaAudio?.enterArena?.();tell('전투 개시 · 적을 지정하고 동료에게 기회를 만드세요');
  $('[data-pause]').focus();state.frame=requestAnimationFrame(loop);return true;
 }
 root.ArenaCoop={open,isOpen:()=>!!current};
})(window);
