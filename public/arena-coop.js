(function(root){
 'use strict';
 const C=root.ArenaCoopCore,escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let current=null;
 // A dead fighter is always rendered as a horizontal, motionless body.
 // Use the reliable 'hit' frame instead of relying on an optional 'death'
 // frame: legacy 10-frame fighters may otherwise fall back to standing idle.
 function corpseFall(u,time){
  if(!u?.dead)return 0;
  const f=u.flight;
  const phase=f?
   Math.max(0,Math.min(1,(time-f.at)/Math.max(.01,f.duration))):
   Math.max(0,Math.min(1,(time-(Number.isFinite(u.deathAt)?u.deathAt:time))/.35));
  const t=Math.max(0,Math.min(1,f?(phase-.55)/.45:phase));
  return t*t*(3-2*t);
 }
 // Depth follows the exact planted FOOT y coordinate (far 395 / near 675).
 // Linear and clamped: 0.76 at far feet, 1.22 at near feet (formerly 1.14).
 const perspectiveScale=y=>{
  const t=Math.max(0,Math.min(1,((Number(y)||395)-395)/280));
  return .76+t*.46;
 };
 function open(allies,enemies,{onFinish,onClose,seed}={}){
  if(current)return false;
  const sim=C.create(allies,enemies,{seed}),host=document.createElement('section');
  host.className='arena-coop';host.setAttribute('aria-label','5vs5 실시간 협동전투');
  const previousFocus=document.activeElement,oldOverflow=document.body.style.overflow;
  const state={sim,host,frame:0,last:0,eventId:0,fx:[],paused:false,settled:false,selected:null,flash:0,nextCinematicAt:0,cinematic:null,focusFrame:null, director:root.ArenaCoopCamera?.create?.()||null,lens:{zoom:1,x:640,y:360}};current=state;
  host.innerHTML='<header class="coop-header"><div><small>CONCORDIA · TEAM ARENA</small><h1>5 vs 5 협동전투</h1></div><div class="coop-clock" aria-label="남은 시간">2:00</div><div class="coop-header-actions"><button data-pause>일시정지</button><button data-exit>철수</button></div></header>'+
   '<div class="coop-field"><canvas width="1280" height="720" aria-label="열 명이 동시에 싸우는 전장. 아래와 위의 버튼으로 명령할 수 있습니다."></canvas><div class="coop-callout" role="status"></div><div class="coop-pause-layer" hidden><strong>전투 일시정지</strong><span>명령과 전투 시간이 함께 멈춥니다.</span><button data-resume>계속하기</button></div></div>'+
   '<div class="coop-scoreboard" aria-label="전투중 아군·적군을 지정하는 썸네일 전술 패널"><div class="coop-team coop-allies" role="group" aria-label="아군 썸네일 · 누르면 즉시 엄호"></div><div class="coop-versus" aria-hidden="true">VS</div><div class="coop-team coop-enemies" role="group" aria-label="적군 썸네일 · 누르면 즉시 집중공격"></div></div>'+
   '<footer class="coop-footer"><div class="coop-orders"><button data-formation>방어진형 <small>아군 전체 피해 감소 · 패링 강화</small></button><button data-flank>양익 돌파 <small>아군 전체 4.5초 돌진</small></button><button data-rally>연계 총공세 <small>연계 60 소모 · 전원 협공</small></button><div class="coop-gauge"><label>연계 <b data-meter>25 / 100</b></label><progress max="100" value="25"></progress></div></div><p class="coop-help">파란 아군 썸네일을 누르면 7초 엄호 · 붉은 적 썸네일을 누르면 6초 집중 공격 · 하단은 전원에게 적용되는 전술</p><div class="coop-log" aria-label="최근 전투 상황"></div></footer>'+
   '<div class="coop-modal" hidden></div>';
  document.body.append(host);document.body.style.overflow='hidden';
  const $=q=>host.querySelector(q),canvas=$('canvas'),ctx=canvas.getContext('2d'),bg=new Image();
  bg.src='assets/new-era/arena.webp';
  for(const side of ['ally','enemy']){
   const team=$(side==='ally'?'.coop-allies':'.coop-enemies');
   team.innerHTML=sim.units.filter(u=>u.side===side).map(u=>
     '<button class="coop-unit" type="button" data-unit="'+u.id+'" aria-label="'+escape(u.name)+(side==='ally'?' 즉시 엄호':' 즉시 집중 공격')+'" aria-pressed="false">'+
     '<canvas class="coop-thumb" width="112" height="104" data-thumb="'+u.id+'" aria-hidden="true"></canvas>'+
     '<span class="coop-unit-name">'+escape(u.name)+'</span><progress max="'+u.maxHp+'" value="'+u.hp+'"></progress>'+
     '<small class="coop-unit-state">'+(side==='ally'?'터치 · 엄호':'터치 · 집중')+'</small></button>').join('');
  }
  // Approved roster art. Only human opponents are mirrored for confrontation.
  function paintThumbnails(){
   for(const u of sim.units){
    const canvas=$('[data-thumb="'+u.id+'"]');if(!canvas)continue;
    const sprite=u.side==='ally'?
      (root.LudusBridge?.squadSprite?.(u,'idle',0)||root.LudusBridge?.portrait?.(u.index)):
      (u.beastType?root.ArenaBeasts?.portrait?.(u.beastType):
       root.LudusBridge?.practiceEnemySprite?.(u.look,'idle'));
    if(!sprite?.width&&!sprite?.naturalWidth)continue;
    const flip=u.side==='enemy'&&!u.beastType;
    if(root.ArenaPortraitFit?.draw?.(canvas,sprite,{inset:.055,flipX:flip}))continue;
    const c=canvas.getContext('2d');if(!c)continue;
    const w=canvas.width,h=canvas.height,sw=sprite.naturalWidth||sprite.width,sh=sprite.naturalHeight||sprite.height;
    const scale=Math.min(w*.9/sw,h*.9/sh);
    c.clearRect(0,0,w,h);c.save();if(flip){c.translate(w,0);c.scale(-1,1);}
    try{c.drawImage(sprite,(w-sw*scale)/2,h-sh*scale*.98,sw*scale,sh*scale);}catch(_){}
    c.restore();
   }
  }
  paintThumbnails();
  function tell(text,kind=''){const callout=$('.coop-callout');callout.textContent=text;
   callout.dataset.kind=['rescue','ambush','chase','bait'].includes(kind)?kind:'';
   state.calloutUntil=sim.time+(kind?2.2:2.8);}
  function pause(value){state.paused=value;sim.paused=value;$('.coop-pause-layer').hidden=!value;$('[data-pause]').textContent=value?'계속하기':'일시정지';}
  function sound(kind){root.ArenaAudio?.play?.(kind,{gain:.55});}
  host.addEventListener('click',e=>{
   const unit=e.target.closest('[data-unit]');
   if(unit&&!sim.result){const u=sim.units.find(v=>v.id===unit.dataset.unit);if(!u||u.dead)return;
    state.selected=u.id;state.pickedUntil=sim.time+2.8;
    const action=u.side==='ally'?'cover':'focus',ready=u.side==='ally'?sim.coverReady:sim.focusReady;
    if(C.command(sim,action,u.id)){
     tell((u.side==='ally'?'아군 엄호 지정 · ':'집중 공격 지정 · ')+u.name+(u.side==='ally'?' (7초)':' (6초)'));
     sound(u.side==='ally'?'guard':'parry');
    }else tell(state.paused?'일시정지 중 · 전투 재개 후 지정 가능':u.name+' 지정됨 · 전술 재사용 '+Math.ceil(Math.max(0,ready-sim.time))+'초 남음');
   }
  });
  $('[data-formation]').onclick=()=>{if(C.command(sim,'formation')){tell('방어진형! 전체 아군 방어 및 패링 강화 · 5초');sound('guard');}else tell('방어진형 재사용 대기 중');};
  $('[data-flank]').onclick=()=>{if(C.command(sim,'flank')){tell('양익 돌파! 전원 돌진 · 4.5초');sound('dash');}else tell('양익 돌파 재사용 대기 중');};
  $('[data-rally]').onclick=()=>{if(C.command(sim,'rally')){tell('연계 총공세! 전원 협공');sound('heavy_swing');}else tell('연계 60이 필요합니다.');};
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
   const flight=u.flight,flightT=flight?Math.max(0,Math.min(1,(sim.time-flight.at)/flight.duration)):1;
    const airborne=flight&&flightT<1;
    const pose=u.dead?'hit':airborne?'hit':u.hit>0?'hit':u.guard>0?'guard':u.attack||u.swing>0?'attack':u.moving?'walk':'idle';
   const progress=u.dead?Math.min(1,(sim.time-u.deathAt)/.8):u.attack? .4*(1-u.attack.remaining/u.attack.total):u.swing>0?.4+.6*(1-u.swing/.4):pose==='hit'?1-u.hit/.24:(sim.time*.8)%1;
   const action=pose==='attack'?(u.cls==='retiarius'?'thrust':'slash'):pose;
   const look=root.PracticeScaleProfiles?.look?.(u,root.LudusBridge?.state?.()?.roster)||u.look,
    profile=root.PracticeVisualProfiles?.resolve(look,action)||{x:0,y:0,scale:1};
   const motion=u.dead?{x:0,y:0}:(root.PracticeVisualProfiles?.sampleMotion(profile,progress)||{x:0,y:0});
   const tick=u.dead?0:pose==='attack'?Math.floor(progress*7):sim.time*8;
   const image=art(u,pose,tick),idle=art(u,'idle',0);if(!image||!idle?.height)return;
   const basis=root.LudusBridge?.practiceNominal?.(u);
   const sourceScale=basis?.width>0&&basis?.height>0?
    root.PracticeScaleProfiles?.cellPixels?.(look,basis.width,basis.height,202):0;
   const z=.60,depth=perspectiveScale(u.y),k=(sourceScale||
    root.PracticeScaleProfiles?.framePixels?.(look,idle.height,202)||
    202/idle.height*(root.PracticeScaleProfiles?.scale?.(look)||1))*z*profile.scale;
   const reduced=!!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
   const body=root.ArenaMotion?.pose?.(u,sim.time,reduced)||{x:0,y:0,tilt:0};
   const impact=root.ArenaMotion?.visual?.(u,reduced,true)||{scale:1,flash:0};
   const frame=root.LudusBridge.practiceFrame(u,pose),px=frame?.canvas===image&&Number.isFinite(frame.pivotX)?frame.pivotX:image.width/2,py=frame?.canvas===image&&Number.isFinite(frame.footY)?frame.footY:image.height;
   const flightX=airborne?(flight.fromX-u.x)*Math.pow(1-flightT,1.6):0;
   const flightY=airborne&&!flight.reduced?-4*flight.height*flightT*(1-flightT):0;
   // First translate to the fixed world foot, then scale only this fighter.
   // Keeps parry flight, pose frames and trails on the same perspective plane.
   ctx.save();
   ctx.translate(u.x+flightX,u.y+flightY*depth);
   ctx.scale(depth,depth);
   ctx.translate((profile.x+motion.x)*z*u.face,((root.PracticeScaleProfiles?.foot(look)||0)+profile.y+motion.y)*z);
   if(airborne&&!flight.reduced)ctx.rotate(u.face*(u.dead?.16:.11)*Math.sin(Math.PI*flightT));
   if(!u.dead){if(!airborne)ctx.translate(body.x,body.y);ctx.rotate(airborne?0:body.tilt||0);ctx.scale(impact.scale||1,impact.scale||1);}
   ctx.scale(u.face,1);
   // Rotate around the actual planted foot, NOT the sprite center.
   // Progressively turn into a prone corpse during the last portion of KO
   // flight, then hold the same horizontal pose until the battle ends.
   if(u.dead)ctx.rotate(-Math.PI*.5*corpseFall(u,sim.time));
   if(!u.dead&&impact.flash>0)ctx.filter='brightness('+(1+impact.flash*2.5).toFixed(2)+')';
   if(!u.dead&&!airborne&&u.recoilAt!==undefined&&sim.time-u.recoilAt<.58){
    const life=1-(sim.time-u.recoilAt)/.58;
    for(const [t,alpha] of [[0,.14],[.25,.23],[.5,.36],[.75,.48]]){
     ctx.globalAlpha=life*alpha;
     ctx.drawImage(image,-px*k+(u.recoilFromX-u.x)*(1-t)*u.face,-py*k,image.width*k,image.height*k);
    }
   }
   if(airborne&&!flight.reduced){
    for(const [fraction,alpha] of [[.3,.12],[.58,.21],[.81,.28]]){
     const previous=Math.max(0,flightT-fraction*.16),priorX=(flight.fromX-u.x)*Math.pow(1-previous,1.6);
     const priorY=-4*flight.height*previous*(1-previous);
     ctx.globalAlpha=alpha*(1-flightT*.45);
     ctx.drawImage(image,-px*k+(priorX-flightX)*u.face,-py*k+(priorY-flightY),image.width*k,image.height*k);
    }
   }
   if(u.dash>0&&!u.dead&&!airborne){
    for(const [offset,alpha] of [[-69,.12],[-38,.23]]){
     ctx.globalAlpha=alpha*Math.min(1,u.dash/.25);
     ctx.drawImage(image,-px*k+offset,-py*k,image.width*k,image.height*k);
    }
   }
   ctx.globalAlpha=1;ctx.drawImage(image,-px*k,-py*k,image.width*k,image.height*k);ctx.restore();
   if(u.dead)return;
   ctx.save();
   ctx.translate(u.x,u.y);
   ctx.scale(depth,depth);
   ctx.translate(-u.x,-u.y);
   const ally=u.side==='ally';
   const active=(ally&&sim.cover?.id===u.id&&sim.cover.until>sim.time)||
    (!ally&&sim.focus?.id===u.id&&sim.focus.until>sim.time);
   if(active||state.selected===u.id&&state.pickedUntil>sim.time){
    const color=ally?'#5cb9ff':'#ff665c',strength=.72+.28*Math.sin(sim.time*10);
    ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;
    ctx.shadowColor=color;ctx.shadowBlur=16;ctx.globalAlpha=strength;ctx.lineWidth=4;
    ctx.beginPath();ctx.ellipse(u.x,u.y+5,50,15,0,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(u.x-46,u.y-23);ctx.lineTo(u.x-46,u.y-43);ctx.lineTo(u.x-30,u.y-43);
    ctx.moveTo(u.x+46,u.y-23);ctx.lineTo(u.x+46,u.y-43);ctx.lineTo(u.x+30,u.y-43);ctx.stroke();
    ctx.shadowBlur=0;ctx.font='bold 14px sans-serif';ctx.textAlign='center';
    ctx.fillText(active?(ally?'엄호 대상':'집중 대상'):(ally?'아군 지정':'적군 지정'),u.x,u.y-50);
    ctx.restore();
   }
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
   ctx.restore();
  }
  function draw(){
   const mobile=host.clientWidth<=700,field=$('.coop-field');
   const width=mobile?Math.round(field.clientWidth*1.5):1280,height=mobile?Math.round(field.clientHeight*1.5):720;
   if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
   ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#100c09';ctx.fillRect(0,0,width,height);
   if(mobile){const visible=C.alive(sim),xs=visible.map(u=>u.x),left=Math.min(...xs,640),right=Math.max(...xs,640);
    // Keep enough of the arena in view even when only two fighters remain.
    const desired=Math.max(920,right-left+235);
    state.cameraWidth=(state.cameraWidth||1280)+(desired-(state.cameraWidth||1280))*.06;
    const desiredCenter=(left+right)/2;
    state.mobileCenter=(state.mobileCenter??desiredCenter)+(desiredCenter-(state.mobileCenter??desiredCenter))*.07;
    const scale=Math.min(width/state.cameraWidth,height/720);
    ctx.setTransform(scale,0,0,scale,width/2-state.mobileCenter*scale,(height-720*scale)/2);
   }
   const reduced=!!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
   const shot=root.ArenaCombatFeel?.sample?.(state,{reduced,team:true})||{x:0,y:0,angle:0,zoom:1};
   const lens=state.lens||{zoom:1,x:640,y:360};
   // One WORLD camera for the backdrop, corpses, fighters and all raster effects.
   const anchorX=mobile?(state.mobileCenter??640):640;
   const centerX=mobile?anchorX+(lens.x-640)*.40:lens.x;
   ctx.save();ctx.translate(anchorX,360);ctx.scale(lens.zoom,lens.zoom);ctx.translate(-centerX,-lens.y);
   // Keep a readable horizon: a very small nudge only during push-in shots.
   const vibration=Math.min(.46,Math.max(0,(lens.zoom-1)/.04));
   ctx.translate((shot.x||0)*vibration,(shot.y||0)*vibration);
   // 5v5 has its own two-depth-lane ground plane, distinct from Capua's single court.
   // Always use the original Colosseum backdrop here, regardless of venue toggle.
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
     // Position each VFX on a live sprite, including its recoil flight, rather than
     // leaving it at the original hit-event coordinate. Depth follows the feet.
     const target=sim.units.find(u=>u.id===e.target),source=sim.units.find(u=>u.id===e.source);
     const owner=e.type==='parry'?(source||target):(target||source);
     const face=owner?.face<0?-1:1;
     const appearance=owner?(root.PracticeScaleProfiles?.look?.(owner,root.LudusBridge?.state?.()?.roster)||owner.look):null;
     const action=e.type==='parry'?'parry':kind==='special'?'special':'hit';
     const authored=root.PracticeVisualProfiles?.resolve?.(appearance,action);
     const chosen=authored?.effect?.kind&&authored.effect.kind!=='auto'?authored.effect.kind:kind;
     if(chosen==='none')continue;
     const depth=owner?perspectiveScale(owner.y):1,zoom=.60*depth;
     const flight=owner?.flight;
     const ft=flight?Math.max(0,Math.min(1,(sim.time-flight.at)/Math.max(.01,flight.duration))):1;
     const bodyX=owner?owner.x+(ft<1?(flight.fromX-owner.x)*Math.pow(1-ft,1.6):0):e.x;
     const bodyY=owner?owner.y+(ft<1&&!flight.reduced?-4*flight.height*ft*(1-ft)*depth:0):e.y;
     const foot=appearance?(root.PracticeScaleProfiles?.foot?.(appearance)||0):0;
     const geometry=root.PracticeVisualProfiles?.effectGeometry?.({
      kind:chosen,baseX:bodyX+face*(kind==='hit'?0:52*zoom),
      baseY:bodyY+(-113+foot)*zoom,face,zoom,pose:authored,progress:.5
     });
     root.ArenaRasterFX?.draw?.(ctx,chosen,geometry?.x??e.x,geometry?.y??(e.y-80),
      geometry?.width??(big?305:180)*depth,geometry?.height??(big?270:166)*depth,
      age/.52,big?1:.90,geometry?.face??face);
    }
    if(['dash','push','retreat','recover','chase','bait','rescue-call','ambush-call'].includes(e.type)&&age<.9){
     ctx.save();ctx.globalAlpha=Math.max(0,.68-age*.75);ctx.lineWidth=e.type==='push'?5:3;
     ctx.strokeStyle=['recover','rescue-call'].includes(e.type)?'#8ce3a8':['retreat','bait'].includes(e.type)?'#bba6f3':e.type==='chase'?'#ee8d72':'#f9cb82';
     ctx.beginPath();ctx.ellipse(e.x,e.y+7,22+age*65,9+age*19,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    if(e.damage){ctx.save();ctx.globalAlpha=Math.max(0,1-age/1.3);ctx.fillStyle=e.type==='assist'?'#ffdf84':'#fff1dd';ctx.strokeStyle='#29160f';ctx.lineWidth=4;ctx.textAlign='center';ctx.font='bold 22px sans-serif';ctx.strokeText(e.text,e.x,e.y-110-age*35);ctx.fillText(e.text,e.x,e.y-110-age*35);ctx.restore();}
   }
   ctx.restore();
   root.ArenaCombatFeel?.overlay?.(ctx,width,height,shot);
  }
  function hud(){
   const time=Math.ceil(Math.max(0,sim.limit-sim.time));$('.coop-clock').textContent=Math.floor(time/60)+':'+String(time%60).padStart(2,'0');
   for(const u of sim.units){
    const b=$('[data-unit="'+u.id+'"]');if(!b)continue;
    const ally=u.side==='ally';
    const active=ally?sim.cover?.id===u.id&&sim.cover.until>sim.time:
     sim.focus?.id===u.id&&sim.focus.until>sim.time;
    const until=ally?sim.cover?.until:sim.focus?.until;
    const remaining=Math.max(0,Math.ceil((until||0)-sim.time));
    const cooldown=Math.max(0,Math.ceil((ally?sim.coverReady:sim.focusReady)-sim.time));
    const selected=state.selected===u.id&&state.pickedUntil>sim.time||active;
    b.disabled=u.dead||!!sim.result;b.setAttribute('aria-pressed',String(!!selected));
    b.classList.toggle('is-selected',!!selected);
    b.classList.toggle('is-active-command',!!active);
    b.classList.toggle('is-dead',u.dead);
    b.querySelector('progress').value=u.hp;
    b.querySelector('.coop-unit-state').textContent=u.dead?'전투 불능':
     active?(ally?'엄호 '+remaining+'초':'집중 '+remaining+'초'):
     cooldown?'재사용 '+cooldown+'초':ally?'터치 · 엄호':'터치 · 집중';
   }
   $('[data-meter]').textContent=Math.floor(sim.meter)+' / 100';$('progress[max="100"]').value=sim.meter;
   const formationCD=Math.max(0,Math.ceil(sim.formationReady-sim.time));
   const flankCD=Math.max(0,Math.ceil(sim.flankReady-sim.time));
   const formationTime=Math.max(0,Math.ceil((sim.formation?.until||0)-sim.time));
   const flankTime=Math.max(0,Math.ceil((sim.flank?.until||0)-sim.time));
   $('[data-formation]').disabled=!!sim.result||state.paused||formationCD>0;
   $('[data-flank]').disabled=!!sim.result||state.paused||flankCD>0;
   $('[data-formation]').innerHTML='방어진형 <small>'+(formationTime?'유지 '+formationTime+'초':formationCD?'재사용 '+formationCD+'초':'피해 감소 + 패링 강화')+'</small>';
   $('[data-flank]').innerHTML='양익 돌파 <small>'+(flankTime?'돌파 '+flankTime+'초':flankCD?'재사용 '+flankCD+'초':'전원 돌진 4.5초')+'</small>';
   $('[data-rally]').disabled=!!sim.result||state.paused||sim.meter<60;
   $('.coop-enemies').setAttribute('aria-label','적군 · 집중 공격 재사용 '+Math.max(0,Math.ceil(sim.focusReady-sim.time))+'초');
   if(state.calloutUntil<sim.time)$('.coop-callout').textContent='';
  }
  function loop(now){
   if(current!==state)return;
   const dt=state.last?Math.min(.05,(now-state.last)/1000):0;state.last=now;
   const reduced=!!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
   const scaled=root.ArenaCombatFeel?.advance?.(state,sim.units,dt,{paused:state.paused||!!sim.result,reduced})??dt;
   C.step(sim,sim.result?dt:scaled);
   const events=sim.events.filter(e=>e.id>state.eventId);
   for(const e of events){state.eventId=e.id;state.fx.push(e);
    if(['parry','counter','riposte','push','dash','rescue','ambush','hit','assist'].includes(e.type)&&
       (e.type!=='hit'&&e.type!=='assist'||sim.time>=(state.nextImpactAt||0))){
     const a=sim.units.find(u=>u.id===e.source),b=sim.units.find(u=>u.id===e.target);
     const kind=e.type==='riposte'?'reversal':e.type==='counter'?'parry':e.type==='push'?'special':e.type;
     root.ArenaCombatFeel?.event?.(state,kind,a,b,sim.time,{team:true,power:e.type==='push'||e.type==='riposte'?1.25:1});
     state.nextImpactAt=sim.time+.15;
    }
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
   root.ArenaCoopCamera?.record?.(state.director,events);
   state.lens=root.ArenaCoopCamera?.advance?.(state.director,dt,{
    units:sim.units,mobile:host.clientWidth<=700,reduced,
    paused:state.paused,finished:!!sim.result})||{zoom:1,x:640,y:360};
   draw();if(!state.lastHud||now-state.lastHud>100){hud();state.lastHud=now;}
   if(!state.lastPortrait||now-state.lastPortrait>1200){paintThumbnails();state.lastPortrait=now;}
   root.ArenaAudio?.update?.({phase:sim.result?'result':'fight',paused:state.paused,combo:sim.teamwork.ally,health:C.alive(sim,'ally').reduce((n,u)=>n+u.hp/u.maxHp,0)/5,distance:100});
   if(sim.result&&!sim.units.some(u=>u.flight&&sim.time-u.flight.at<u.flight.duration))results();
   state.frame=requestAnimationFrame(loop);
  }
  root.ArenaAudio?.unlock?.();root.ArenaAudio?.enterArena?.();tell('전투 개시 · 적을 지정하고 동료에게 기회를 만드세요');
  $('[data-pause]').focus();state.frame=requestAnimationFrame(loop);return true;
 }
 root.ArenaCoop={open,isOpen:()=>!!current,perspectiveScale,corpseFall};
})(window);
