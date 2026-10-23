/* LUDUS collectible-style roster and arena draft, v5.6.
   Visual-only module: all persistence and combat stay in LudusBridge. */
(function(){
'use strict';
var chosen=-1, scrollPosition=0, paintOpponent=null, matchMode='1v1', squadPicks=[];
var $=function(q){return document.querySelector(q);};
function safe(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;','\'':'&#39;'}[c];});}
function bridge(){return window.LudusBridge;}
function state(){return bridge()&&bridge().state();}
function level(h){return Math.max(1,Math.min(20,Number(h.level)||1));}
function rank(h){if(h.appearance==='murmillo_champion_red')return 'CHAMPION';if(h.appearance==='murmillo_motion_v3')return 'MOTION';if(h.appearance==='legacy')return 'CHAMPION';var lv=level(h);return 'GRADE '+(lv>=20?5:lv>=15?4:lv>=10?3:lv>=5?2:1);}
function className(h){var n={murmillo:'무르밀로',thraex:'트라엑스',retiarius:'레티아리우스'};return h.appearance==='murmillo_champion_red'?'신규 챔피언 무르밀로':h.appearance==='murmillo_motion_v3'?'무르밀로 · 애니메이션':(n[h.cls]||h.cls||'검투사');}
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
function draftConfig(){return window.ArenaBalance?.MODES?.[matchMode]||{allies:1,enemies:1,label:'정규 결투'};}
function draft(enemy,painter){
 const a=bridge(),s=state();if(!s||!enemy)return;
 paintOpponent=painter||paintOpponent;
 if(chosen<0||!s.roster[chosen]||wounded(s.roster[chosen]))
  chosen=!wounded(s.roster[s.active])?s.active:s.roster.findIndex(h=>!wounded(h));
 const config=draftConfig();
 squadPicks=squadPicks.filter(i=>s.roster[i]&&!wounded(s.roster[i])).slice(0,config.allies);
 if(!squadPicks.length&&chosen>=0)squadPicks=[chosen];
 if(matchMode==='1v1')squadPicks=chosen>=0?[chosen]:[];
 const ready=squadPicks.length===config.allies,pick=s.roster[squadPicks[0]??chosen];
 // A new choice or changed equipment must immediately refresh the opponent
 // shown on the draft screen, not only the enemy generated at match start.
 enemy=a.matchOpponent?.(squadPicks)||enemy;
 const choices=['1v1','1v2','1v3','2v2','3v3'];
 const controls='<div class="lc-mode-picker" role="group" aria-label="아레나 대전 형식">'+choices.map(mode=>{
  const option=window.ArenaBalance?.MODES?.[mode]||{};
  return '<button type="button" class="'+(mode===matchMode?'selected':'')+'" data-battle-mode="'+mode+
   '" aria-pressed="'+(mode===matchMode)+'">'+mode+' <small>'+safe(option.label||'')+'</small></button>';
 }).join('')+'<button type="button" class="lc-beast-mode" data-beast-hunt="open" aria-label="야수전 스테이지 선택">🐾 야수전 <small>VENATIO</small></button></div>';
 const info=matchMode==='1v1'?'정규 1:1 결투':
  '연속 1:1 · 아군 '+config.allies+'명 / 적 '+config.enemies+'명 · 선택 '+squadPicks.length+'/'+config.allies+'명';
 const enemies=a.previewMatch?.(matchMode,enemy)||[enemy];
 const ourSequence=squadPicks.map((i,order)=>'<span class="lc-lineup-ally"><em>'+(order+1)+'번</em>'+safe(s.roster[i]?.name||'')+'</span>').join('')||
  '<span class="lc-lineup-empty">출전할 검투사를 선택하세요</span>';
 const theirSequence=enemies.map((unit,order)=>'<div class="lc-enemy-slot '+(unit.boss?'is-boss':'')+'"><em>'+(order+1)+'번</em>'+
  '<div><strong>'+safe(unit.name)+'</strong><small>'+safe(className(unit))+' · Lv.'+Number(unit.level||1)+
  (unit.boss?' · ★ 보스급':' · '+safe(window.ArenaBalance?.TRAITS?.[unit.cls]?.role||'일반 도전자'))+'</small></div></div>').join('');
 const strength=squadPicks.reduce((total,i)=>total+(window.ArenaBalance?.heroPower?.(s.roster[i])||0),0);
 const matched=enemy.match;
 const matchSummary=matched?'아군 평균 예상 전력 '+matched.power+' · 예상 접전 · 매칭 Lv.'+enemy.level+
  ' · 장비 '+matched.equipment+'부위 / 훈련 '+matched.training:'기본 대진';
 const rivalRole=window.ArenaBalance?.TRAITS?.[enemy.cls]?.role||'투기장 도전자';
 const host='<section class="lc-screen lc-draft-screen" aria-label="아레나 출전 선수 선택"><div class="lc-top">'+header('아레나 출전',s)+'</div>'+
 '<div class="lc-match-top"><span>도전 '+Number(enemy.round||1)+'회차</span><strong>⚔ '+info+'</strong><span>'+(enemy.boss?'CHAMPION BATTLE':'ARENA CHALLENGE')+'</span></div>'+
 '<div class="lc-mode-note">경기 형태 선택은 현재 개발 확인용 임시 메뉴 · 향후 이벤트에 따라 자동 지정</div>'+controls+
 '<div class="lc-screen-body lc-draft-body"><div class="lc-gallery"><div class="lc-section-head"><h2>♜ 나의 검투사</h2><small>출전 선수 '+config.allies+'명 선택</small></div>'+
 '<div class="lc-ally-order"><strong>아군 출전 순서 · 승자는 다음 상대와 연전</strong><div>'+ourSequence+'</div></div>'+
 '<div class="lc-card-grid">'+s.roster.map((h,i)=>card(h,i,squadPicks.includes(i),true)).join('')+'</div></div>'+
 '<div class="lc-opponent"><div class="lc-section-head"><h2>⚔ 이번 경기의 상대</h2><small>'+(enemy.boss?'보스 · 승리 시 영입':'일반 경기')+'</small></div>'+
 '<div class="lc-enemy-frame"><span class="lc-rank lc-enemy-rank">'+(enemy.boss?'LEGENDARY':'GRADE '+enemy.stage)+'</span>'+
 '<canvas id="ludusOpponentArt" width="355" height="350" aria-label="상대 검투사 대기 자세"></canvas>'+
 '<div class="lc-enemy-name">'+safe(enemy.name)+'<small>'+className(enemy)+' · '+(enemy.boss?'챔피언':'성장 '+Number(enemy.stage||1)+'단계')+' · Lv.'+Number(enemy.level||1)+'</small></div></div>'+
 '<div class="lc-enemy-lineup"><strong>상대 출전 명단 · 1:1 순차 등장</strong><div>'+theirSequence+'</div></div>'+
 '<div class="lc-matchup"><div><small>아군 전력</small><strong>'+safe(pick?pick.name:'선택 필요')+' · '+strength+'</strong></div><span>VS</span><div><small>상대 전술 · '+safe(rivalRole)+'</small><strong>'+safe(enemy.name)+'</strong></div></div>'+
 '<div class="lc-mode-note">'+safe(matchSummary)+'</div>'+
 '<div class="lc-buttons lc-draft-actions"><button id="lcDraftCancel">선택 취소</button><button class="lc-emphasis" id="lcDeploy" '+(!ready?'disabled':'')+'>⚔ '+(ready?(matchMode==='1v1'?safe(pick.name)+' 출전':'연속 1:1 대진 '+matchMode+' 시작'):'검투사 '+config.allies+'명 필요')+'</button></div>'+
 '</div></div><div class="lc-hint">현재 출전한 검투사는 기존 전투 조작 그대로 사용 · 승자는 남은 체력으로 다음 상대와 싸움 · 부상 80 / 피로 80 이상 출전 불가</div></section>';
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
  else a.squadStart?.(matchMode,squadPicks);
 };
}
window.LudusCardScenes={beginDraft:beginDraft,renderRoster:roster,renderDraft:draft,refresh:function(){var root=$('.lc-screen');if(!root||$('#careerHub').hidden)return;drawArt(root);if(root.classList.contains('lc-draft-screen')&&typeof paintOpponent==='function')paintOpponent();}};
})();