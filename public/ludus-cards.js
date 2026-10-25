/* LUDUS collectible-style roster and arena draft, v5.6.
   Visual-only module: all persistence and combat stay in LudusBridge. */
(function(){
'use strict';
var chosen=-1, scrollPosition=0, paintOpponent=null, matchMode='1v1', squadPicks=[],draftEnemies=[];
var $=function(q){return document.querySelector(q);};
function safe(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;','\'':'&#39;'}[c];});}
function bridge(){return window.LudusBridge;}
function state(){return bridge()&&bridge().state();}
function level(h){return Math.max(1,Math.min(20,Number(h.level)||1));}
function rank(h){if(h.marketOrigin==='mercatus'&&h.marketQuality==='rare')return 'RARVS';if(h.marketOrigin==='mercatus'&&h.marketQuality==='veteran')return 'VETERAN';if(h.appearance==='murmillo_champion_red')return 'CHAMPION';if(h.appearance==='murmillo_motion_v3')return 'MOTION';if(h.appearance==='legacy')return 'CHAMPION';return 'GLADIATOR · Lv.'+level(h);}
function className(h){var n={murmillo:'무르밀로',thraex:'트라엑스',retiarius:'레티아리우스'};return h.appearance==='murmillo_champion_red'?'무르밀로 · 챔피언':h.appearance==='murmillo_motion_v3'?'무르밀로 · 정예':(n[h.cls]||h.cls||'검투사');}
function injury(h){return Math.max(0,Number(h.injury)||0);}
function fatigue(h){return Math.max(0,Math.min(100,Number(h?.fatigue)||0));}
function wounded(h){return injury(h)>=80||fatigue(h)>=80;}
function conditionText(h){return injury(h)>=80?'중상 · 출전 불가':fatigue(h)>=80?'탈진 · 출전 불가':injury(h)>0||fatigue(h)>0?'부상 '+injury(h)+' · 피로 '+fatigue(h):'출전 가능';}
function percent(h){return level(h)>=20?100:Math.min(100,Math.max(0,Math.round((h.xp||0)/(36+level(h)*19)*100)));}
function card(h,i,selected,draft){
 const off=draft&&wounded(h),order=draft?squadPicks.indexOf(i)+1:0;
 const severity=injury(h)>=80?'중상':fatigue(h)>=80?'탈진':'';
 return '<button type="button" class="lc-fighter-card '+(selected?'is-selected ':'')+(off?'is-blocked':'')+'" data-'+(draft?'candidate':'unit')+'="'+i+'" '+(off?'disabled ':'')+'aria-pressed="'+selected+'" aria-label="'+safe(h.name)+' · '+safe(conditionText(h))+' · '+(order?'출전 '+order+'번':'출전 미선택')+'">'+
 '<span class="lc-card-corner lc-card-corner-a">✦</span><span class="lc-card-corner lc-card-corner-b">✦</span>'+
 (draft&&order?'<span class="lc-queue-order" aria-label="출전 순서 '+order+'번">'+order+'번 출전</span>':'')+
 (severity?'<span class="lc-unavailable" role="status">'+severity+' · 출전 불가</span>':'')+
 '<span class="lc-rank">'+rank(h)+'</span><span class="lc-portrait"><canvas width="222" height="235" data-card-art="'+i+'" aria-hidden="true"></canvas></span>'+
 '<span class="lc-card-title">'+safe(h.name)+'</span><span class="lc-card-class">'+className(h)+' · Lv.'+level(h)+'</span>'+
 '<span class="lc-card-meta"><b>⚔ '+(Number(h.wins)||0)+'승</b><b class="'+(wounded(h)?'lc-danger':'')+'">부상 '+injury(h)+' / 피로 '+fatigue(h)+'</b></span>'+
 '<span class="lc-card-foot">'+(draft?(off?'치료 또는 휴식 필요':order?order+'번 출전 · 누르면 제외':'출전 순서에 등록'):(selected?'◆ 관리 중':'선택하여 관리'))+'</span></button>';
}
function header(heading,s){
 return '<div class="lc-banner"><span class="lc-laurel">❧</span><div><div class="lc-kicker">LVDVS · GLADIATORVM</div><h1>'+heading+'</h1></div><span class="lc-laurel">❧</span></div>'+
 '<div class="lc-resources"><span>◉ '+Number(s.gold||0).toLocaleString('ko-KR')+' D</span><span>✥ '+Number(s.glory||0).toLocaleString('ko-KR')+' 명예</span><span>♜ '+s.roster.length+'명</span></div>';
}
function drawArt(root){
 var a=bridge();if(!a)return;
 root.querySelectorAll('canvas[data-card-art]').forEach(function(canvas){
  var img=a.portrait(Number(canvas.dataset.cardArt));if(!img||!img.width||!img.height)return;
  if(window.ArenaPortraitFit?.draw?.(canvas,img,{inset:.045}))return;
  var ctx=canvas.getContext('2d');if(!ctx)return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  var scale=Math.min(213/img.width,224/img.height);
  var w=img.width*scale,h=img.height*scale;
  try{ctx.drawImage(img,(canvas.width-w)/2,canvas.height-h-3,w,h);}catch(e){}
 });
 root.querySelectorAll('canvas[data-enemy-art]').forEach(function(canvas){
  var unit=draftEnemies[Number(canvas.dataset.enemyArt)];
  var image=unit&&a.enemyPortrait?.(unit);
  if(!image)return;
  if(window.ArenaPortraitFit?.draw?.(canvas,image,{inset:.052,flipX:!unit?.beastType}))return;
  var ctx=canvas.getContext('2d'),scale=Math.min((canvas.width-12)/image.width,(canvas.height-12)/image.height);
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();
  if(!unit?.beastType){ctx.translate(canvas.width,0);ctx.scale(-1,1);}
  try{ctx.drawImage(image,(canvas.width-image.width*scale)/2,canvas.height-image.height*scale-6,image.width*scale,image.height*scale)}catch(_){}
  ctx.restore();
 });
 var heroCanvas=root.querySelector('#lcFeaturedHero');
 if(heroCanvas){
  var st=state(),src=a.portrait(st.active);
  if(src&&src.width&&src.height){
   if(!window.ArenaPortraitFit?.draw?.(heroCanvas,src,{inset:.055})){
    var ctx=heroCanvas.getContext('2d'),scale=Math.min(330/src.width,335/src.height);
    var w=src.width*scale,h=src.height*scale;
    ctx.clearRect(0,0,heroCanvas.width,heroCanvas.height);
    try{ctx.drawImage(src,(heroCanvas.width-w)/2,heroCanvas.height-h-5,w,h);}catch(e){}
   }
  }
 }
}
function reveal(root,mode){
 var body=$('#careerBody');if(!body)return;
 body.innerHTML=root;
 body.className='career-grid lc-content';
 var hub=$('#careerHub');if(hub){hub.dataset.lcView=mode;}
}
function roster(){
 var a=bridge(),s=state();if(!s)return;
 var h=s.roster[s.active],gear=a.catalog(),has=!!h;
 var stats=has?[
  ['STR','공격',h.stats.str||0],['AGI','민첩',h.stats.agi||0],
  ['END','체력',h.stats.end||0],['FOCUS','기술',h.stats.focus||0]
 ]:[];
 var equip=has?['weapon','shield','armor'].map(function(slot){
  var label={weapon:'무기',shield:'방패',armor:'갑옷'}[slot];
  var item=gear.find(function(g){return g.id===h.equipment[slot];});
  return '<span>'+label+' <strong>'+safe(item?item.name:'미장착')+'</strong></span>';
 }).join(''):'';
 var host='<section class="lc-screen lc-roster-screen" aria-label="검투사 관리"><div class="lc-top">'+header('검투사 관리',s)+'</div>'+
 '<div class="lc-screen-body"><div class="lc-gallery"><div class="lc-section-head"><h2>⚔ 소속 검투사</h2><small>'+s.roster.length+'명 · 카드를 선택하세요</small></div>'+
 '<div class="lc-card-grid">'+s.roster.map(function(item,i){return card(item,i,i===s.active,false);}).join('')+
 '<button type="button" class="lc-hire-card" id="lcHire"><span>＋</span><strong>검투사 영입</strong><small>검투사시장 방문</small></button></div></div>'+
 '<div class="lc-detail"><div class="lc-section-head"><h2>♜ 전투 명부</h2><small>선택된 검투사</small></div>'+
 (has?'<div class="lc-highlight"><div class="lc-hero-badge">'+rank(h)+'</div><canvas id="lcFeaturedHero" width="355" height="352" aria-label="'+safe(h.name)+' 스탠딩"></canvas></div>'+
 '<div class="lc-nameplate"><h2>'+safe(h.name)+'</h2><span>'+className(h)+' · Lv.'+level(h)+'</span></div>'+
 '<div class="lc-xp"><div><strong>LEVEL '+level(h)+'</strong><small>경험치 '+Number(h.xp||0)+'</small></div><i><b style="width:'+percent(h)+'%"></b></i></div>'+
 '<div class="lc-stats">'+stats.map(function(p){return '<span><small>'+p[0]+' · '+p[1]+'</small><strong>'+p[2]+'</strong></span>';}).join('')+'</div>'+ 
 (h.aptitudes?'<div class="lc-aptitude"><strong>타고난 성장 적성</strong><span>'+[['str','근력'],['agi','민첩'],['end','체력'],['focus','집중']].map(function(v){var n=Number(h.aptitudes[v[0]])||1;return '<em class="'+(n>=1.22?'apt-strong':n<.89?'apt-weak':'')+'">'+v[1]+' ×'+n.toFixed(2)+'</em>';}).join('')+'</span></div>':'')+
 '<div class="lc-record"><span>시합 <b>'+(Number(h.fights)||0)+'전 '+(Number(h.wins)||0)+'승</b></span><span>부상 <b class="'+(injury(h)>=80?'lc-danger':'')+'">'+injury(h)+'</b></span><span>피로 <b class="'+(fatigue(h)>=80?'lc-danger':'')+'">'+fatigue(h)+'</b></span></div>'+
 '<div class="lc-equipment">'+equip+'</div>'+
 '<div class="lc-buttons"><button id="lcTraining">⚔ 훈련소</button><button id="lcArmory">🛡 장비실</button>'+
 '<button id="lcHeal" '+(injury(h)===0||Number(s.gold)<Math.max(12,Math.ceil(injury(h)*.6))?'disabled':'')+'>✚ 치료 '+Math.max(12,Math.ceil(injury(h)*.6))+' D</button>'+
 '<button id="lcRest" '+(fatigue(h)===0||Number(s.gold)<Math.max(18,Math.round(16+fatigue(h)*.75))?'disabled':'')+'>☾ 휴식 '+Math.max(18,Math.round(16+fatigue(h)*.75))+' D</button>'+
 '<button class="lc-emphasis" id="lcReady" '+(wounded(h)?'disabled':'')+'>⚔ 출전 준비</button></div>':
 '<div class="lc-empty"><strong>아직 소속 검투사가 없습니다</strong><p>검투사시장에서 첫 검투사를 영입하세요.</p></div>')+
 '</div></div><div class="lc-hint">'+safe(s.message||'선수를 선택해 훈련하거나 아레나에 출전하세요.')+'</div></section>';
 var old=$('.lc-gallery .lc-card-grid');if(old)scrollPosition=old.scrollTop;
 reveal(host,'roster');
 var root=$('.lc-screen');drawArt(root);
 var grid=root.querySelector('.lc-card-grid');if(grid)grid.scrollTop=scrollPosition;
 root.querySelectorAll('[data-unit]').forEach(function(b){
  b.onclick=function(){var i=Number(b.dataset.unit);if(!s.roster[i])return;scrollPosition=grid.scrollTop;a.select(i);};
 });
 var hire=root.querySelector('#lcHire');if(hire)hire.onclick=function(){var hub=$('#careerHub');if(hub)hub.hidden=true;a.market();};
 var training=root.querySelector('#lcTraining');if(training)training.onclick=function(){a.section('training');};
 var armory=root.querySelector('#lcArmory');if(armory)armory.onclick=function(){a.section('gear');};
 var heal=root.querySelector('#lcHeal');if(heal)heal.onclick=function(){a.heal();};
 var rest=root.querySelector('#lcRest');if(rest)rest.onclick=function(){a.rest?.();};
 var ready=root.querySelector('#lcReady');if(ready)ready.onclick=function(){a.fight();};
}
function beginDraft(selectedIndex){
 chosen=Number.isInteger(selectedIndex)?selectedIndex:-1;
 matchMode='1v1';squadPicks=chosen>=0?[chosen]:[];scrollPosition=0;
}
function draftConfig(){if(matchMode==='5v5')return {allies:5,enemies:5,label:'실시간 협동전'};return window.ArenaBalance?.MODES?.[matchMode]||{allies:1,enemies:1,label:'정규 결투'};}
function draft(enemy,painter){
 const a=bridge(),s=state();if(!s||!enemy)return;
 paintOpponent=painter||paintOpponent;
 if(chosen<0||!s.roster[chosen]||wounded(s.roster[chosen]))
  chosen=!wounded(s.roster[s.active])?s.active:s.roster.findIndex(h=>!wounded(h));
 const config=draftConfig(),coop=matchMode==='5v5';
 squadPicks=squadPicks.filter(i=>s.roster[i]&&!wounded(s.roster[i])).slice(0,config.allies);
 if(!squadPicks.length&&chosen>=0)squadPicks=[chosen];
 if(matchMode==='1v1')squadPicks=chosen>=0?[chosen]:[];
 const ready=squadPicks.length===config.allies,pick=s.roster[squadPicks[0]??chosen];
 // A new choice or changed equipment must immediately refresh the opponent
 // shown on the draft screen, not only the enemy generated at match start.
 if(ready&&!coop)enemy=a.matchOpponent?.(squadPicks)||enemy;
 // Incomplete squads never advertise a stale single-fighter enemy as their matched team.
 const choices=['1v1','1v2','1v3','2v2','3v3','5v5'];
 const controls='<div class="lc-mode-picker" role="group" aria-label="아레나 대전 형식">'+choices.map(mode=>{
  const option=mode==='5v5'?{label:'실시간 협동전'}:window.ArenaBalance?.MODES?.[mode]||{};
  return '<button type="button" class="'+(mode===matchMode?'selected':'')+'" data-battle-mode="'+mode+
   '" aria-pressed="'+(mode===matchMode)+'">'+mode+' <small>'+safe(option.label||'')+'</small></button>';
 }).join('')+'<button type="button" class="lc-beast-mode" data-beast-hunt="open" aria-label="야수전 스테이지 선택">🐾 야수전 <small>VENATIO</small></button></div>';
 const info=coop?'5vs5 동시 전투 · 선택 '+squadPicks.length+'/5명':matchMode==='1v1'?'정규 1:1 결투':
  '연속 1:1 · 아군 '+config.allies+'명 / 적 '+config.enemies+'명 · 선택 '+squadPicks.length+'/'+config.allies+'명';
 const enemies=ready?(coop?a.coopPreview(squadPicks):(a.previewMatch?.(matchMode,enemy)||[enemy])):[];
 draftEnemies=enemies;
 const ourSequence=squadPicks.map((i,order)=>'<span class="lc-lineup-ally"><em>'+(order+1)+'번</em>'+safe(s.roster[i]?.name||'')+'</span>').join('')||
  '<span class="lc-lineup-empty">출전할 검투사를 선택하세요</span>';
 const theirSequence=Array.from({length:config.enemies},(_,order)=>{
  const unit=enemies[order];
  return '<div class="lc-enemy-slot lc-enemy-portrait-card '+(unit?.boss?'is-boss':'')+(unit?'':' is-pending')+'" data-enemy-index="'+order+'">'+
   '<em>'+(order+1)+'번</em><div class="lc-rival-art">'+
   (unit?'<canvas width="184" height="196" data-enemy-art="'+order+'" role="img" aria-label="'+safe(unit.name+' 상대 검투사 그림')+'"></canvas>':
   '<span class="lc-rival-placeholder" aria-hidden="true">?</span>')+'</div>'+
   '<div class="lc-rival-caption"><strong>'+safe(unit?.name||'편성 대기')+'</strong>'+
   '<small>'+(unit?safe(className(unit))+' · Lv.'+Number(unit.level||1):'아군 '+config.allies+'명 선택 후 공개')+'</small></div></div>';
 }).join('');
 const strength=squadPicks.reduce((total,i)=>total+(window.ArenaBalance?.heroPower?.(s.roster[i])||0),0);
 const matched=coop?null:enemy.match;
 const matchSummary=!ready?'출전 '+squadPicks.length+'/'+config.allies+'명 선택 중 · 모두 선택하면 상대팀 전원이 해당 전력으로 갱신됩니다.':
  coop?'10명 동시 전투 · 패링 반격 / 포획 협공 / 방패 엄호 / 측면 협공 · 120초 제한':matched?'아군 평균 예상 전력 '+matched.power+' · 매칭 Lv.'+enemy.level+
   ' · 장비 '+matched.equipment+'부위 / 훈련 '+matched.training:'기본 대진';
 const rivalRole=coop?'협동 전술':ready?(window.ArenaBalance?.TRAITS?.[enemy.cls]?.role||'투기장 도전자'):'편성 대기';
 const host='<section class="lc-screen lc-draft-screen" aria-label="아레나 출전 선수 선택"><div class="lc-top">'+header('아레나 출전',s)+'</div>'+
 '<div class="lc-match-top"><span>도전 '+Number(enemy.round||1)+'회차</span><strong>⚔ '+info+'</strong><span>'+(coop?'CONCORDIA · TEAM BATTLE':enemy.boss?'CHAMPION BATTLE':'ARENA CHALLENGE')+'</span></div>'+
 '<div class="lc-mode-note">경기 형태 선택은 현재 개발 확인용 임시 메뉴 · 향후 이벤트에 따라 자동 지정</div>'+controls+
 '<div class="lc-screen-body lc-draft-body"><div class="lc-gallery"><div class="lc-section-head"><h2>♜ 나의 검투사</h2><small>출전 선수 '+config.allies+'명 선택</small></div>'+
 '<div class="lc-ally-order"><strong>'+(coop?'동시 출전 · 선택한 5명이 한 팀으로 싸웁니다':'아군 출전 순서 · 승자는 다음 상대와 연전')+'</strong><div>'+ourSequence+'</div></div>'+
 '<div class="lc-card-grid">'+s.roster.map((h,i)=>card(h,i,squadPicks.includes(i),true)).join('')+'</div></div>'+
 '<div class="lc-opponent"><div class="lc-section-head"><h2>⚔ 이번 경기의 상대</h2><small>'+(coop?'5vs5 협동전':enemy.boss?'챔피언 보스전':'일반 경기')+'</small></div>'+
 '<div class="lc-enemy-lineup lc-team-lineup"><strong>상대팀 전원 · '+config.enemies+'명 '+(ready?' · 매칭 완료':' · 출전자 선택 대기')+'</strong>'+
 '<div class="lc-enemy-team lc-team-count-'+config.enemies+'">'+theirSequence+'</div></div>'+
 '<div class="lc-matchup"><div><small>아군 전력</small><strong>'+safe(pick?pick.name:'선택 필요')+' · '+strength+'</strong></div><span>VS</span><div><small>상대 전술 · '+safe(rivalRole)+'</small><strong>'+safe(ready?(coop?'상대 검투사 5명':enemy.name):'선택 완료 시 공개')+'</strong></div></div>'+
 '<div class="lc-mode-note">'+safe(matchSummary)+'</div>'+
 '<div class="lc-buttons lc-draft-actions"><button id="lcDraftCancel">선택 취소</button><button class="lc-emphasis" id="lcDeploy" '+(!ready?'disabled':'')+'>⚔ '+(ready?(coop?'5vs5 협동전 시작':matchMode==='1v1'?safe(pick.name)+' 출전':'연속 1:1 대진 '+matchMode+' 시작'):'검투사 '+config.allies+'명 필요')+'</button></div>'+
 '</div></div><div class="lc-hint">'+(coop?'자동 전투 · 아군 썸네일 터치=엄호 / 적 썸네일 터치=집중 공격 · 방어진형/양익 돌파/총공세 · 출전 피로 8 · 결과에 따라 경험치·보상·부상 저장 · 일반 결투 진행도 별도':'현재 출전한 검투사는 기존 전투 조작 그대로 사용 · 승자는 남은 체력으로 다음 상대와 싸움 · 부상 80 / 피로 80 이상 출전 불가')+'</div></section>';
 const old=$('.lc-gallery .lc-card-grid');if(old)scrollPosition=old.scrollTop;
 reveal(host,'draft');
 const root=$('.lc-screen'),grid=root.querySelector('.lc-card-grid');if(grid)grid.scrollTop=scrollPosition;
 drawArt(root);if(typeof paintOpponent==='function')paintOpponent();
 root.querySelector('[data-beast-hunt]')?.addEventListener('click',()=>a.section('beasts'));
 root.querySelectorAll('[data-battle-mode]').forEach(button=>{
  button.onclick=()=>{scrollPosition=grid.scrollTop;matchMode=button.dataset.battleMode;
   squadPicks=squadPicks.slice(0,draftConfig().allies);draft(enemy,paintOpponent);};
 });
 root.querySelectorAll('[data-candidate]').forEach(button=>{
  button.onclick=()=>{
   const i=Number(button.dataset.candidate);if(wounded(s.roster[i]))return;
   scrollPosition=grid.scrollTop;
   if(matchMode==='1v1'){chosen=i;squadPicks=[i];}
   else if(squadPicks.includes(i)){
    if(squadPicks.length>1)squadPicks=squadPicks.filter(n=>n!==i);
   }else{
    if(squadPicks.length>=draftConfig().allies)squadPicks.shift();
    squadPicks.push(i);
   }
   chosen=squadPicks[0]??-1;
   draft(enemy,paintOpponent);
  };
 });
 root.querySelector('#lcDraftCancel').onclick=()=>{chosen=-1;squadPicks=[];scrollPosition=0;a.cancelDraft();};
 root.querySelector('#lcDeploy').onclick=()=>{
  if(!ready)return;
  if(matchMode==='1v1')a.deploy(squadPicks[0]);
  else if(coop)a.coopStart?.(squadPicks);
  else a.squadStart?.(matchMode,squadPicks);
 };
}
window.LudusCardScenes={beginDraft:beginDraft,renderRoster:roster,renderDraft:draft,refresh:function(){var root=$('.lc-screen');if(!root||$('#careerHub').hidden)return;drawArt(root);if(root.classList.contains('lc-draft-screen')&&typeof paintOpponent==='function')paintOpponent();}};
})();