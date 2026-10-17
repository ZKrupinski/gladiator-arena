/* LUDUS collectible-style roster and arena draft, v5.6.
   Visual-only module: all persistence and combat stay in LudusBridge. */
(function(){
'use strict';
var chosen=-1, scrollPosition=0, paintOpponent=null;
var $=function(q){return document.querySelector(q);};
function safe(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;','\'':'&#39;'}[c];});}
function bridge(){return window.LudusBridge;}
function state(){return bridge()&&bridge().state();}
function level(h){return Math.max(1,Math.min(20,Number(h.level)||1));}
function rank(h){if(h.appearance==='legacy')return 'CHAMPION';var lv=level(h);return 'GRADE '+(lv>=20?5:lv>=15?4:lv>=10?3:lv>=5?2:1);}
function className(h){var n={murmillo:'무르밀로',thraex:'트라엑스',retiarius:'레티아리우스'};return n[h.cls]||h.cls||'검투사';}
function injury(h){return Math.max(0,Number(h.injury)||0);}
function wounded(h){return injury(h)>=80;}
function percent(h){return Math.min(100,Math.max(0,Math.round((h.xp||0)/(30+level(h)*15)*100)));}
function card(h,i,selected,draft){
 var off=draft&&wounded(h),condition=wounded(h)?'출전 불가':injury(h)>0?'부상 '+injury(h):'정상';
 return '<button type="button" class="lc-fighter-card '+(selected?'is-selected ':'')+(off?'is-blocked':'')+'" data-'+(draft?'candidate':'unit')+'="'+i+'" '+(off?'disabled ':'')+'aria-pressed="'+selected+'" aria-label="'+safe(h.name)+' '+className(h)+' '+condition+'">'+
 '<span class="lc-card-corner lc-card-corner-a">✦</span><span class="lc-card-corner lc-card-corner-b">✦</span>'+
 '<span class="lc-rank">'+rank(h)+'</span><span class="lc-portrait"><canvas width="222" height="235" data-card-art="'+i+'" aria-hidden="true"></canvas></span>'+
 '<span class="lc-card-title">'+safe(h.name)+'</span><span class="lc-card-class">'+className(h)+' · Lv.'+level(h)+'</span>'+
 '<span class="lc-card-meta"><b>⚔ '+(Number(h.wins)||0)+'승</b><b class="'+(wounded(h)?'lc-danger':'')+'">'+condition+'</b></span>'+
 '<span class="lc-card-foot">'+(draft?(off?'치료 후 출전 가능':selected?'◆ 출전 후보 선택됨':'출전 선수로 선택'):(selected?'◆ 관리 중':'선택하여 관리'))+'</span></button>';
}
function header(heading,s){
 return '<div class="lc-banner"><span class="lc-laurel">❧</span><div><div class="lc-kicker">LVDVS · GLADIATORVM</div><h1>'+heading+'</h1></div><span class="lc-laurel">❧</span></div>'+
 '<div class="lc-resources"><span>◉ '+Number(s.gold||0).toLocaleString('ko-KR')+' D</span><span>✥ '+Number(s.glory||0).toLocaleString('ko-KR')+' 명예</span><span>♜ '+s.roster.length+'명</span></div>';
}
function drawArt(root){
 var a=bridge();if(!a)return;
 root.querySelectorAll('canvas[data-card-art]').forEach(function(canvas){
  var img=a.portrait(Number(canvas.dataset.cardArt));if(!img||!img.width||!img.height)return;
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
   var ctx=heroCanvas.getContext('2d'),scale=Math.min(330/src.width,335/src.height);
   var w=src.width*scale,h=src.height*scale;
   ctx.clearRect(0,0,heroCanvas.width,heroCanvas.height);
   try{ctx.drawImage(src,(heroCanvas.width-w)/2,heroCanvas.height-h-5,w,h);}catch(e){}
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
 (has?'<div class="lc-highlight"><div class="lc-hero-badge">'+rank(h)+'</div><canvas id="lcFeaturedHero" width="355" height="352" aria-label="'+safe(h.name)+' 스탠딩"></canvas><div class="lc-plinth"></div></div>'+
 '<div class="lc-nameplate"><h2>'+safe(h.name)+'</h2><span>'+className(h)+' · Lv.'+level(h)+'</span></div>'+
 '<div class="lc-xp"><div><strong>LEVEL '+level(h)+'</strong><small>경험치 '+Number(h.xp||0)+'</small></div><i><b style="width:'+percent(h)+'%"></b></i></div>'+
 '<div class="lc-stats">'+stats.map(function(p){return '<span><small>'+p[0]+' · '+p[1]+'</small><strong>'+p[2]+'</strong></span>';}).join('')+'</div>'+
 '<div class="lc-record"><span>시합 <b>'+(Number(h.fights)||0)+'전 '+(Number(h.wins)||0)+'승</b></span><span>부상 <b class="'+(wounded(h)?'lc-danger':'')+'">'+injury(h)+'</b></span></div>'+
 '<div class="lc-equipment">'+equip+'</div>'+
 '<div class="lc-buttons"><button id="lcTraining">⚔ 훈련소</button><button id="lcArmory">🛡 장비실</button>'+
 '<button id="lcHeal" '+(injury(h)===0||Number(s.gold)<Math.max(12,Math.ceil(injury(h)*.6))?'disabled':'')+'>✚ 치료 '+Math.max(12,Math.ceil(injury(h)*.6))+' D</button>'+
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
 var ready=root.querySelector('#lcReady');if(ready)ready.onclick=function(){a.fight();};
}
function draft(enemy,painter){
 var a=bridge(),s=state();if(!s||!enemy)return;
 paintOpponent=painter||paintOpponent;
 if(chosen<0||!s.roster[chosen]||wounded(s.roster[chosen]))chosen=!wounded(s.roster[s.active])?s.active:s.roster.findIndex(function(h){return !wounded(h);});
 var pick=s.roster[chosen];
 var host='<section class="lc-screen lc-draft-screen" aria-label="아레나 출전 선수 선택"><div class="lc-top">'+header('아레나 출전',s)+'</div>'+
 '<div class="lc-match-top"><span>도전 '+Number(enemy.round||1)+'회차</span><strong>⚔ 출전 검투사를 선택하세요</strong><span>'+(enemy.boss?'CHAMPION BATTLE':'ARENA CHALLENGE')+'</span></div>'+
 '<div class="lc-screen-body lc-draft-body"><div class="lc-gallery"><div class="lc-section-head"><h2>♜ 나의 검투사</h2><small>카드 선택 후 출전 확정</small></div>'+
 '<div class="lc-card-grid">'+s.roster.map(function(h,i){return card(h,i,i===chosen,true);}).join('')+'</div></div>'+
 '<div class="lc-opponent"><div class="lc-section-head"><h2>⚔ 이번 경기의 상대</h2><small>'+(enemy.boss?'보스 · 승리 시 영입':'일반 경기')+'</small></div>'+
 '<div class="lc-enemy-frame"><span class="lc-rank lc-enemy-rank">'+(enemy.boss?'LEGENDARY':'GRADE '+enemy.stage)+'</span>'+
 '<canvas id="ludusOpponentArt" width="355" height="350" aria-label="상대 검투사 대기 자세"></canvas>'+
 '<div class="lc-enemy-name">'+safe(enemy.name)+'<small>'+safe((enemy.boss?enemy.cls:enemy.growthType)||'')+' · Lv.'+Number(enemy.level||1)+'</small></div></div>'+
 '<div class="lc-matchup"><div><small>나의 출전 후보</small><strong>'+safe(pick?pick.name:'선택 필요')+'</strong></div><span>VS</span><div><small>상대 검투사</small><strong>'+safe(enemy.name)+'</strong></div></div>'+
 '<div class="lc-buttons lc-draft-actions"><button id="lcDraftCancel">선택 취소</button><button class="lc-emphasis" id="lcDeploy" '+(!pick?'disabled':'')+'>⚔ '+(pick?safe(pick.name)+' 출전 확정':'출전 불가')+'</button></div>'+
 '</div></div><div class="lc-hint">부상 80 이상은 출전할 수 없습니다. 선택한 검투사만 경험치와 부상을 받습니다.</div></section>';
 var old=$('.lc-gallery .lc-card-grid');if(old)scrollPosition=old.scrollTop;
 reveal(host,'draft');
 var root=$('.lc-screen'),grid=root.querySelector('.lc-card-grid');if(grid)grid.scrollTop=scrollPosition;
 drawArt(root);if(typeof paintOpponent==='function')paintOpponent();
 root.querySelectorAll('[data-candidate]').forEach(function(b){b.onclick=function(){scrollPosition=grid.scrollTop;chosen=Number(b.dataset.candidate);draft(enemy,paintOpponent);};});
 root.querySelector('#lcDraftCancel').onclick=function(){chosen=-1;scrollPosition=0;a.cancelDraft();};
 root.querySelector('#lcDeploy').onclick=function(){if(chosen<0||wounded(s.roster[chosen]))return;a.deploy(chosen);};
}
window.LudusCardScenes={renderRoster:roster,renderDraft:draft,refresh:function(){var root=$('.lc-screen');if(!root||$('#careerHub').hidden)return;drawArt(root);if(root.classList.contains('lc-draft-screen')&&typeof paintOpponent==='function')paintOpponent();}};
})();