/* Approved 1672×941 training/armory art. All interactive state lives in LudusBridge. */
(function(){'use strict';
const W=1672,H=941;
const tiles=[{name:'공격 훈련',stat:'str',help:'공격력 향상'},{name:'방어 훈련',stat:'end',help:'방어 · 지구력 향상'},{name:'체력 훈련',stat:'end',help:'최대 HP 향상'},{name:'민첩 훈련',stat:'agi',help:'행동 속도 향상'},{name:'기술 훈련',stat:'focus',help:'기술 · 집중력 향상'}];
// All dialogue is text, not painted into any image. One script per training
// tile (including separate scripts for END defense and endurance training).
const DOCTORE_SCRIPT=[
 {title:'ARS GLADII · 공격 훈련',
  lines:'칼은 팔이 아니라 온몸으로 휘두르는 것이다.\n발을 딛고 허리를 비틀어라!\n방패 뒤의 적까지 흔들 일격을 만들어라.',
  success:'좋아! 그 일격을 기억해라.\n힘이 아니라 정확한 자세가 적을 쓰러뜨린다.'},
 {title:'SCUTUM · 방어 훈련',
  lines:'방패를 몸에 단단히 붙여라.\n무릎을 굽혀 충격을 땅으로 흘려보내고,\n막아낸 순간 곧바로 반격해라!',
  success:'그래, 그거다!\n칼을 막는 건 시작이다. 살아남는 법을 익혀라.'},
 {title:'FORTITUDO · 체력 훈련',
  lines:'모래바닥 열 바퀴다!\n숨이 턱까지 차올라도 자세를 무너뜨리지 마라.\n마지막까지 선 전사가 승리를 거머쥔다.',
  success:'아직 쓰러지지 않았군.\n더 버틸 수 있는 몸이 네 생명을 지켜줄 것이다.'},
 {title:'CELERITAS · 민첩 훈련',
  lines:'칼끝만 쳐다보지 마라. 적의 어깨를 읽어라!\n한발 먼저 피하고, 한걸음 더 파고들어라.\n빠른 발이 느린 칼을 이긴다.',
  success:'이제야 발이 움직이는군!\n다음에는 적이 검을 빼기도 전에 움직여라.'},
 {title:'DISCIPLINA · 기술 훈련',
  lines:'호흡을 고르고 칼의 궤적을 읽어라.\n패링은 완력이 아니라 찰나의 판단이다.\n그 한순간에 전세를 뒤집는 법을 배워라!',
  success:'눈빛이 달라졌군.\n지금처럼 상대의 빈틈을 읽으면 승산이 생긴다.'}
];
let speechPhase='welcome';
function speechData(){
 const script=DOCTORE_SCRIPT[selectedTraining]||DOCTORE_SCRIPT[0];
 if(speechPhase==='selected')return {title:script.title,lines:script.lines};
 if(speechPhase==='success')return {title:'BENE FACTUM · 훌륭하다!',lines:script.success};
 if(speechPhase==='insufficient')return {title:'NVMMI · 훈련비 부족',lines:'기량을 갈고닦는 데에도 대가가 든다.\n먼저 투기장에서 상금을 벌어 와라.\n그때 다시 혹독하게 훈련시켜 주마!'};
 if(speechPhase==='mastery')return {title:'MAGISTER · 심화 훈련',lines:'한계라고 여겼던 지점을 넘어섰군!\n이제는 작은 진전에도 큰 노력이 필요하다.\n꾸준히 단련하면 더 강해질 수 있다.'};
 return {title:'DOCTORE · 교관',lines:'살아남고 싶다면 나를 똑바로 보아라!\n훈련 항목을 골라라.\n경기장에서는 약자에게 두 번째 기회가 없다.'};
}
function drawTrainingSpeech(){
 if(room!=='training'||!stage)return;
 const data=speechData();
 let bubble=stage.querySelector('.la-training-speech');
 if(!bubble){
  bubble=document.createElement('aside');bubble.className='la-training-speech';
  bubble.setAttribute('role','status');bubble.setAttribute('aria-live','polite');
  bubble.setAttribute('aria-label','훈련소 교관 대화');
  bubble.innerHTML='<span class="la-speech-badge"></span><p class="la-speech-lines"></p>';
  stage.appendChild(bubble);
 }
 bubble.dataset.training=String(selectedTraining);
 bubble.dataset.phase=speechPhase;
 bubble.querySelector('.la-speech-badge').textContent=data.title;
 bubble.querySelector('.la-speech-lines').textContent=data.lines;
}
const equips={wood:{x:-1126,y:-487},iron:{x:-991,y:-486},shield:{x:-1458,y:-486},elite:{x:-1347,y:-486}};
let screen,stage,room='training',selectedTraining=0,selectedGear='iron',category='all',sortMode=0,toastTimer=0,poseTimer=0;
const $=s=>screen?.querySelector(s);
const bridge=()=>window.LudusBridge;
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[c]));
function hit(id,label,x,y,w,h,fn){let b=document.createElement('button');b.className='la-hit';b.type='button';b.dataset.hit=id;b.setAttribute('aria-label',label);b.title=label;b.style.cssText=`left:${x}px;top:${y}px;width:${w}px;height:${h}px`;b.addEventListener('click',fn);stage.appendChild(b);return b;}
function block(cls,x,y){let d=document.createElement('div');d.className='la-v '+cls;d.style.left=x+'px';d.style.top=y+'px';stage.appendChild(d);return d;}
function fit(){
 if(!stage)return;
 const usableW=Math.max(320,innerWidth),usableH=Math.max(320,innerHeight);
 const z=Math.min(usableW/W,usableH/H);
 // Give the self-contained armory more vertical room on tall phones/tablets,
 // without stretching its character art or altering the approved training room.
 const armory=stage.classList.contains('armory');
 stage.style.height=armory?Math.max(H,Math.min(1420,Math.floor(usableH/z)))+'px':'';
 stage.style.transform=`translate(-50%,-50%) scale(${z})`;
}
function toast(msg){let n=$('.la-notice');if(!n)return;n.textContent=msg;n.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.hidden=true,2800);}
function pose(index){window.LudusDoctoreAnim?.react?.(index);}
function moveHero(step){let a=bridge(),s=a?.state();if(!s?.roster?.length){toast('검투사시장에서 먼저 영입하세요.');return;}let i=((s.active||0)+step+s.roster.length)%s.roster.length;a.select(i);refresh();}
function changeRoom(next){room=next;bridge()?.section(next);screen.hidden=false;render();}
function goHome(){window.LudusDoctoreAnim?.unmount?.();window.LudusTrainingV2?.stop();screen.hidden=true;clearTimeout(toastTimer);clearTimeout(poseTimer);pose(-1);bridge()?.returnHome();document.getElementById('careerHub').hidden=true;window.LudusScene?.open();}
function actionTraining(){const s=bridge()?.state();if(!s?.roster?.length){toast('훈련할 검투사가 없습니다.');return;}const opt=tiles[selectedTraining],h=s.roster[s.active];const cost=bridge()?.trainingCost?.(s.active,opt.stat)||12;if(s.gold<cost){speechPhase='insufficient';drawTrainingSpeech();toast('훈련 비용 '+cost+'D가 부족합니다.');pose(2);return;}
 bridge().train(opt.stat);speechPhase=Number(h.stats[opt.stat])>10?'mastery':'success';refresh();pose(3);toast(h.name+' · '+opt.name+' 완료!');}
function changeItem(mode){const a=bridge(),list=a?.catalog()||[],gear=list.find(g=>g.id===selectedGear);if(!gear){toast('장비를 먼저 선택하세요.');return;}const outcome=a.equip(selectedGear,mode);toast(outcome||'장비 상태가 갱신되었습니다.');refresh();}
function drawRoster(parent,isTraining){parent.replaceChildren();const a=bridge(),s=a?.state();if(!s)return;
 const from=Math.max(0,Math.min(s.active-1,Math.max(0,s.roster.length-(isTraining?6:3))));
 s.roster.slice(from,from+(isTraining?6:3)).forEach((hero,n)=>{const i=from+n,b=document.createElement('button');b.type='button';b.className=i===s.active?'selected':'';b.title=hero.name+' · Lv.'+hero.level;b.setAttribute('aria-label',hero.name+' · 검투사 선택');const c=document.createElement('canvas');c.width=104;c.height=87;b.appendChild(c);let t=document.createElement('strong');t.textContent=hero.name+' Lv.'+hero.level;b.appendChild(t);parent.appendChild(b);const im=a.portrait(i);if(im?.width&&im?.height){if(!window.ArenaPortraitFit?.draw?.(c,im,{inset:.045})){const ctx=c.getContext('2d'),k=Math.min(100/im.width,80/im.height);try{ctx.drawImage(im,(104-im.width*k)/2,86-im.height*k,im.width*k,im.height*k);}catch(e){}}}b.addEventListener('click',()=>{a.select(i);refresh();});});}

// Keep the approved architecture but replace the baked sample fighter
// with the real, currently selected Ludus roster fighter.
function liveFighter(a,s,isTraining){
 const source=s.roster[s.active]&&a.portrait(s.active);
 if(!source||!source.width||!source.height)return;
 const cover=document.createElement('div');
 cover.className='la-live-npc-clear '+(isTraining?'training':'armory');
 cover.setAttribute('aria-hidden','true');stage.appendChild(cover);
 const canvas=document.createElement('canvas');
 canvas.className='la-live-fighter '+(isTraining?'training':'armory');
 canvas.width=isTraining?341:304;canvas.height=isTraining?331:381;
 canvas.setAttribute('role','img');canvas.setAttribute('aria-label',s.roster[s.active].name+' · 출전 대기');
 const ctx=canvas.getContext('2d');
 if(ctx){
  if(!window.ArenaPortraitFit?.draw?.(canvas,source,{inset:.045})){
   const scale=Math.min((canvas.width-12)/source.width,(canvas.height-12)/source.height);
   const w=source.width*scale,h=source.height*scale;
   try{ctx.drawImage(source,(canvas.width-w)/2,canvas.height-h-5,w,h);}catch(_){}
  }
 }
 stage.appendChild(canvas);
}
function setup(){if(screen)return;screen=document.createElement('section');screen.className='la-screen';screen.hidden=true;screen.setAttribute('aria-label','승인된 루두스 장비실 및 훈련소');screen.innerHTML='<div class="la-stage"><img class="la-key" draggable="false" alt=""><div class="la-notice" role="status" hidden></div><div class="la-pose"></div></div><div class="la-orient">가로 화면에서 더 크게 볼 수 있습니다.<button type="button">작은 화면으로 계속</button></div>';document.body.appendChild(screen);stage=$('.la-stage');$('.la-orient button').addEventListener('click',()=>screen.classList.add('la-allow-portrait'));addEventListener('resize',fit,{passive:true});document.addEventListener('keydown',e=>{if(screen.hidden)return;if(e.key==='Escape'){e.preventDefault();goHome();}else if(e.key==='ArrowLeft'){e.preventDefault();moveHero(-1);}else if(e.key==='ArrowRight'){e.preventDefault();moveHero(1);}else if(e.key==='Enter'&&room==='training'){e.preventDefault();actionTraining();}});fit();}
function render(){if(!screen||screen.hidden)return;const a=bridge(),s=a?.state();if(!s)return;const h=s.roster[s.active],training=room==='training';stage.className='la-stage '+room;
 const key=$('.la-key');const src=training?'assets/ludus/training_no_dialogue_v1.webp?v=1':'assets/ludus/armory_approved.webp';if(!key.src.endsWith(src))key.src=src;
 // Halt the old RAF before replacing this scene's character node.
 window.LudusDoctoreAnim?.unmount?.();
 // Keep backdrop and transient NPC pose nodes, replace everything else atomically.
 for(const node of [...stage.children])if(!node.matches('.la-key,.la-notice,.la-pose'))node.remove();
 if(training)drawTrainingSpeech();
 if(!training&&window.LudusLiveArmory){
  window.LudusLiveArmory.render(stage,a,{
   selectedGear,category,sortMode,goHome,
   selectHero:i=>{a.select(i);refresh();},
   setGear:id=>{selectedGear=id;refresh();},
   focusGear:id=>{selectedGear=id;category='all';refresh();},
   setCurrentGear:id=>{selectedGear=id;},
   setCategory:c=>{category=c;refresh();},
   sort:()=>{sortMode++;refresh();},
   equip:mode=>changeItem(mode),
    buy:id=>{toast(a.buy(id));refresh();},
    sell:id=>{toast(a.sell(id));refresh();}
  });
  fit();return;
 }
 block('la-gold',1417,27).textContent=Number(s.gold||0).toLocaleString('ko-KR');
 if(training&&window.LudusTrainingV2){
  // The independent roster and actor must BOTH exist before we consider
  // replacement mounted. Otherwise show the older functional training UI.
  try{
   const trainer=document.createElement('div');
   trainer.className='la-doctore-live';trainer.dataset.pose='0';
   trainer.setAttribute('aria-hidden','true');stage.appendChild(trainer);
   window.LudusDoctoreAnim?.mount?.(trainer);
   window.LudusTrainingV2.mount(stage,a,s,{
    selectedTraining,tiles,onHome:goHome,move:moveHero,
    onSelect:i=>{a.select(i);refresh();},
    onTrainingChoice:i=>{selectedTraining=i;speechPhase='selected';refresh();pose(1);},
    onTrain:actionTraining
   });
   if(!stage.querySelector('.lt-roster')||!stage.querySelector('.lt-fighter-canvas')){
    throw new Error('training roster or fighter failed to mount');
   }
   stage.classList.add('lt-runtime-ready');
   fit();return;
  }catch(error){
   console.error('Training room recovery: showing original roster and fighter',error);
   window.LudusTrainingV2?.stop();
   for(const node of [...stage.children]){
    if(!node.matches('.la-key,.la-notice,.la-pose,.la-gold'))node.remove();
   }
   stage.classList.remove('lt-runtime-ready');
  }
 }
 // Legacy fallback for clients that have not yet loaded the new module.
 if(training){
  // Native-size transparent instructor is part of the scene, NOT a popup.
  // Its figure has already been removed from the clean background bitmap.
  const instructor=document.createElement('div');instructor.className='la-doctore-live';
  instructor.dataset.pose='0';instructor.setAttribute('aria-hidden','true');
  stage.appendChild(instructor);window.LudusDoctoreAnim?.mount?.(instructor);
  const st=block('la-training-stats',1471,241);st.innerHTML=h?['str','agi','end','focus'].map(k=>'<div>'+Number(h.stats?.[k]||0)+'</div>').join(''):'—';
  let nm=block('la-training-name',1413,151);nm.innerHTML=h?'<strong>'+escapeHtml(h.name)+'</strong><small>'+escapeHtml(h.cls)+' · Lv.'+Number(h.level||1)+'</small>':'검투사 없음';
  const eff=block('la-training-effect',1309,455);eff.textContent=tiles[selectedTraining].help+'\n훈련 비용 '+(h?a.trainingCost(s.active,tiles[selectedTraining].stat):'—')+' D\n훈련 성공 시 경험치 획득';
  block('la-training-selected',149+selectedTraining*211,608);
  [[153,603,195],[365,603,188],[573,603,198],[784,603,192],[994,603,196]].forEach(([x,y,w],i)=>hit('train'+i,tiles[i].name,x,y,w,158,()=>{selectedTraining=i;speechPhase='selected';render();pose(1);}));
  hit('start-training','훈련 시작',1243,721,393,154,actionTraining);
  const roster=document.createElement('div');roster.className='la-roster training';stage.appendChild(roster);drawRoster(roster,true);
  hit('prev','이전 검투사',225,781,58,101,()=>moveHero(-1));hit('next','다음 검투사',1156,781,59,101,()=>moveHero(1));
 }else{
  let title=block('la-hero-title',531,149);title.innerHTML=h?'<strong>'+escapeHtml(h.name)+'</strong><small>'+escapeHtml(h.cls)+'</small><b>Lv. '+Number(h.level||1)+'</b>':'검투사를 영입하세요';
  let stats=block('la-armory-values',1115,148);stats.innerHTML=h?['str','agi','end','focus'].map(k=>'<div><span>'+Number(h.stats?.[k]||0)+'</span><em>+'+Number(h.stats?.[k]||0)+'</em></div>').join(''):'—';
  let details=block('la-detail-values',1502,153);details.innerHTML=h?[''+(Number(h.level||1)*80),'+'+Number(h.stats.str||0),''+Number(h.stats.end||0),'0%','150%','1.00'].map(x=>'<div>'+x+'</div>').join(''):'—';
  let ct=block('la-inventory-count',1462,375);ct.textContent=(s.armoryInventory?.length||0)+'개 / 공용 창고';
  let inv=document.createElement('div');inv.className='la-inventory-live';stage.appendChild(inv);
  const groups=(a.catalog()||[]).filter(g=>category==='all'||g.slot===category);let sorted=[...groups];if(sortMode%3===1)sorted.sort((x,y)=>x.cost-y.cost);if(sortMode%3===2)sorted.sort((x,y)=>a.gearCount(y.id)-a.gearCount(x.id));
  sorted.forEach(g=>{const b=document.createElement('button');b.type='button';b.className='la-item'+(g.id===selectedGear?' selected':'');b.setAttribute('aria-label',g.name+' '+(a.gearCount(g.id)?'창고 ×'+a.gearCount(g.id):a.shopUnlocked(g.id)?g.cost+'D':'획득 전용'));const pict=equips[g.id]||equips.iron;b.innerHTML='<span class="la-item-art" style="background-position:'+pict.x+'px '+pict.y+'px"></span><strong>'+escapeHtml(g.name)+'</strong>';b.addEventListener('click',()=>{selectedGear=g.id;render();});inv.appendChild(b);});for(let i=inv.childElementCount;i<15;i++){let d=document.createElement('div');d.className='la-item-empty';inv.appendChild(d);}
  [['all',986,110],['weapon',1108,118],['shield',1227,111],['armor',1344,116],['accessory',1463,121]].forEach(([c,x,w])=>hit('cat-'+c,'인벤토리 '+c,x,426,w,57,()=>{category=c;render();}));
  hit('equip','장비 장착 또는 구입',984,822,227,76,()=>changeItem('equip'));hit('remove','장비 해제',1228,820,179,76,()=>changeItem('remove'));hit('sort','인벤토리 정렬',1433,820,178,76,()=>{sortMode++;render();toast('인벤토리를 정렬했습니다.');});
  [['weapon',325,430,141,154],['shield',771,420,143,158],['armor',771,258,144,153]].forEach(([slot,x,y,w,height])=>hit('slot-'+slot,slot+' 장착',x,y,w,height,()=>{const g=(a.catalog()||[]).find(t=>t.slot===slot&&t.id===h?.equipment[slot])||(a.catalog()||[]).find(t=>t.slot===slot);if(g){selectedGear=g.id;render();toast(g.name+' 선택');}}));
  const roster=document.createElement('div');roster.className='la-roster armory';stage.appendChild(roster);drawRoster(roster,false);
  hit('prev','이전 검투사',349,810,49,91,()=>moveHero(-1));hit('next','다음 검투사',781,809,59,91,()=>moveHero(1));
 }
 liveFighter(a,s,training);
 if(training)hit('training-help','훈련 도움말',448,25,73,74,()=>toast('훈련 항목 선택 후 훈련 시작을 누르면 능력치와 경험치가 상승합니다.'));
 const home=document.createElement('button');
 home.type='button';home.className='la-home-nav';home.textContent='⌂ 루두스 로비';
 home.setAttribute('aria-label','메인 루두스 로비로 돌아가기');
 home.title='메인 루두스 로비로 돌아가기';
 home.addEventListener('click',goHome);stage.appendChild(home);
 fit();}
function open(name){setup();room=name==='gear'?'armory':'training';if(room==='training'){
 speechPhase='welcome';
 window.ArenaAudio?.prepareTrainingImpact?.();
}screen.hidden=false;render();}
function close(){window.LudusDoctoreAnim?.unmount?.();window.LudusTrainingV2?.stop();if(screen)screen.hidden=true;}
function refresh(){if(screen&&!screen.hidden)render();}
window.LudusApprovedScenes={open,close,refresh,goHome};
window.addEventListener('arena-gear-atlas-ready',()=>{if(screen&&!screen.hidden&&room==='armory')refresh();});
// Career navigation is still handled by the original engine; these listeners only replace its view.
for(const [id,name] of [['careerTrainTab','training'],['careerGearTab','gear']])document.getElementById(id)?.addEventListener('click',()=>open(name));
document.getElementById('careerRosterTab')?.addEventListener('click',close);
})();
