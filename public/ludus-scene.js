(function(){
"use strict";
var scene,stage,toastTimer=0,dominaTimer=0,dominaReturnTimer=0,lastDominaPose=0;
var W=1448,H=1086;
// The approved lobby art already contains all the distant gladiators.
 // Do not render smaller, semitransparent fighter sprites on top of them.
var poses={domina:Array.from({length:6},(_,i)=>"assets/ludus/domina_"+i+".webp")};
// All six source artworks are retained. The no-duplicate-body facial sprites
// were visually checked against the approved 1448x1086 lobby key visual.
var dominaExpressions=[1];
var preload=[];
for(var i=0;i<6;i++){
 var pic=new Image();pic.src="assets/ludus/domina_face_aligned_"+i+".webp?v=7";preload.push(pic);
}

function $(s){return scene&&scene.querySelector(s);}
function bridge(){return window.LudusBridge;}
function fit(){if(stage){var s=Math.min(innerWidth/W,innerHeight/H);stage.style.transform="translate(-50%,-50%) scale("+s+")";}}
function notice(msg){var t=$(".ll-toast");t.textContent=msg;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(function(){t.hidden=true;},2200);}
function close(){
 clearTimeout(dominaTimer);clearTimeout(dominaReturnTimer);
 dominaTimer=0;dominaReturnTimer=0;lastDominaPose=0;
 if(scene){scene.hidden=true;var patch=$('.ll-domina-expression');if(patch)patch.src='assets/ludus/domina_face_aligned_0.webp?v=7';clearTimeout(toastTimer);}
}
function animateDomina(){
 if(!scene||scene.hidden)return;
 var patch=$(".ll-domina-expression");
 if(!patch||!scene.classList.contains("ll-has-art")){
  dominaTimer=setTimeout(animateDomina,650);return;
 }
 // Use ONLY a short natural two-eye blink. No single-eye wink, no
 // semi-transparent squint that merely blurs the iris.
 patch.src='assets/ludus/domina_face_aligned_1.webp?v=7';
 patch.dataset.pose='1';
 clearTimeout(dominaReturnTimer);
 dominaReturnTimer=setTimeout(function(){
  if(!scene||scene.hidden)return;
  patch.src='assets/ludus/domina_face_aligned_0.webp?v=7';
  patch.dataset.pose='0';
  dominaTimer=setTimeout(animateDomina,1700+Math.random()*1700);
 },220);
}
function action(id,button){
var a=bridge();if(!a)return;
if(id==="select"){var index=Number(button&&button.dataset.index);var hero=a.state().roster[index];if(hero){a.select(index);refresh();notice(hero.name+" · 출전 검투사 선택");}else notice("비어 있는 슬롯입니다. 검투사시장에서 영입하세요.");return;}
if(id==="dismiss-orientation"){scene.classList.add("ll-allow-portrait");return;}
if(id==="back"){close();a.exit();return;}
if(id==="market"){close();a.market();return;}
if(id==="armory"){close();a.section("gear");return;}
if(id==="practice"){
 const canTrain=a.state().roster.some(function(h){return Number(h.injury||0)<80&&Number(h.fatigue||0)<80;});
 if(!canTrain){notice("실전훈련 가능한 검투사가 없습니다. 영입하거나 치료·휴식하세요.");return;}
 close();a.practice();return;
}
if(id==="roster"||id==="training"||id==="basic"){close();a.section(id==="roster"?"roster":"training");return;}
if(id==="arena"){var team=a.state().roster;if(!team.length){notice("검투사시장에서 검투사를 먼저 고용하세요.");return;}if(!team.some(function(h){return Number(h.injury||0)<80&&Number(h.fatigue||0)<80;})){notice("출전 가능한 검투사가 없습니다. 치료 또는 휴식이 필요합니다.");return;}close();a.fight();return;}
/* Lobby actions are intentionally limited to playable destinations. */
}

function setupRosterDrag(host){
 var gesture=null,suppressClickUntil=0;
 host.addEventListener('pointerdown',function(ev){
  if(ev.pointerType==='touch'||ev.button!==0)return;
  gesture={id:ev.pointerId,x:ev.clientX,left:host.scrollLeft,dragged:false};
 });
 window.addEventListener('pointermove',function(ev){
  if(!gesture||ev.pointerId!==gesture.id)return;
  var dx=ev.clientX-gesture.x;
  if(!gesture.dragged&&Math.abs(dx)<7)return;
  gesture.dragged=true;host.classList.add('is-dragging');
  var scale=host.getBoundingClientRect().width/Math.max(1,host.clientWidth);
  host.scrollLeft=gesture.left-dx/Math.max(.15,scale);
  if(ev.cancelable)ev.preventDefault();
 },{passive:false});
 var finish=function(ev){
  if(!gesture||ev.pointerId!==gesture.id)return;
  if(gesture.dragged)suppressClickUntil=Date.now()+55;
  gesture=null;host.classList.remove('is-dragging');
 };
 window.addEventListener('pointerup',finish);
 window.addEventListener('pointercancel',finish);
 host.addEventListener('click',function(ev){
  if(Date.now()>suppressClickUntil)return;
  ev.preventDefault();ev.stopImmediatePropagation();
 },true);
 host.addEventListener('dragstart',function(ev){ev.preventDefault()});
}
function setup(){
if(scene)return;
scene=document.createElement("div");scene.className="ll-scene";scene.id="ludusScene";scene.hidden=true;
var html=[
'<div class="ll-stage" role="region" aria-label="루두스 훈련장">',
'<div class="ll-fallback"><div class="ll-domina"><img src="assets/ludus/domina_0.webp" alt=""><span>DOMINA · 루두스의 주인</span></div></div>',
'<img class="ll-key" src="assets/ludus/ludus_blank_v70.webp" alt="" aria-hidden="true">',
'<img class="ll-domina-expression" src="assets/ludus/domina_face_aligned_0.webp?v=7" alt="" aria-hidden="true" draggable="false">',
'<button class="ll-title" data-action="back" aria-label="타이틀로 돌아가기">❮ 루두스</button>',
'<div class="ll-wallet" aria-label="실시간 루두스 자원"><span>🪙 금화 <strong data-gold>0</strong></span><span>✥ 명예 <strong data-glory>0</strong></span><span>⚔ 소속 <strong data-roster-count>0</strong></span></div>',
'<div class="ll-menu" role="navigation" aria-label="루두스 주요 시설"><button type="button" data-action="training">⚔ 훈련소</button><button type="button" data-action="roster">♜ 검투사 관리</button><button type="button" data-action="armory">🛡 장비실</button><button type="button" data-action="market">🏛 검투사시장</button><button type="button" data-action="arena">⚔ 아레나 출전</button></div>',
'<div class="ll-speech"><b>도미나</b>훌륭해…\n검투사들이 성장하는 모습이\n내 가장 큰 즐거움이란다.</div>',
'<div class="ll-doctore"><b>독토레</b>좋아, 자세가 잡혔군.<br>더 거칠게! 더 강하게!</div>',
'<div class="ll-hitbuttons" role="group" aria-label="루두스 메인 그림 속 훈련 및 출전 버튼">',
'<button type="button" class="ll-hit-basic" data-action="basic" aria-label="기초 훈련 이동" title="기초 훈련"><strong>기초 훈련</strong><small>검투사의 기본을 다집니다.</small></button>',
'<button type="button" class="ll-hit-practice" data-action="practice" aria-label="실전 훈련 이동" title="실전 훈련"><strong>실전 훈련</strong><small>최대 4명 · 무한 생존<br>경험치 전용</small></button>',
'<button type="button" class="ll-hit-arena" data-action="arena" aria-label="아레나 출전 - 검투사 선택 화면" title="아레나 출전"><strong>아레나 출전</strong><small>가장 강한 자를 가립니다.</small></button>',
'</div>',
'<div class="ll-bottom"><div class="ll-roster"><h3><span class="ll-roster-heading">♜ 검투사 현황</span><span data-count>0명</span><small class="ll-swipe-hint">◀ 좌우 드래그 ▶</small></h3><div class="ll-portraits" role="group" aria-label="모든 소속 검투사: 좌우로 스와이프해 선택"></div></div>',
'<div class="ll-actions"><button data-action="basic"><span class="ll-thumb">⚔</span><strong>기초 훈련</strong><small>검투사의 기본을 다집니다.</small></button>',
'<button data-action="practice"><span class="ll-thumb">✦</span><strong>실전 훈련</strong><small>최대 4명 · 무한 생존 · 경험치 전용</small></button>',
'<button data-action="arena"><span class="ll-thumb">🏟</span><strong>아레나 출전</strong><small>가장 강한 자를 가립니다.</small></button></div></div>',
'<div class="ll-live-counter" data-live-counter>소속 검투사 0명</div>',
'</div><div class="ll-toast" hidden role="status"></div></div><div class="ll-orientation" role="dialog" aria-label="가로 화면 권장"><div class="ll-rotate-icon" aria-hidden="true">↻</div><strong>가로 화면에서 플레이해 주세요</strong><p>루두스는 가로형 게임 화면으로 제작되었습니다.<br>기기를 가로로 돌리면 버튼과 검투사가 크게 보입니다.</p><button data-action="dismiss-orientation">작은 화면으로 계속 보기</button></div>'
];
scene.innerHTML=html.join("");document.body.appendChild(scene);stage=$(".ll-stage");setupRosterDrag($(".ll-portraits"));
var art=$(".ll-key");art.addEventListener("load",function(){scene.classList.add("ll-has-art");});art.addEventListener("error",function(){scene.classList.remove("ll-has-art");});if(art.complete&&art.naturalWidth)scene.classList.add("ll-has-art");
scene.addEventListener("click",function(ev){
 var b=ev.target.closest("button[data-action]");
 if(!b||!scene.contains(b))return;
 ev.preventDefault();
 action(b.dataset.action,b);
});
addEventListener("resize",fit,{passive:true});addEventListener("keydown",function(ev){if(!scene.hidden&&ev.key==="Escape"){ev.preventDefault();action("back");}});
var hub=document.getElementById("careerHub");if(hub&&!hub.querySelector("#careerVisualHome")){var home=document.createElement("button");home.id="careerVisualHome";home.type="button";home.textContent="❮ 루두스 로비";home.setAttribute("aria-label","루두스 메인 로비로 돌아가기");home.onclick=function(){bridge().returnHome();hub.hidden=true;open();};hub.appendChild(home);}
fit();
}
function refresh(){
if(!scene)return;var a=bridge(),s=a&&a.state();if(!s)return;
$("[data-gold]").textContent=(Number(s.gold)||0).toLocaleString("ko-KR");
$("[data-glory]").textContent=(Number(s.glory)||0).toLocaleString("ko-KR");
$("[data-count]").textContent=s.roster.length+"명";
$("[data-roster-count]").textContent=s.roster.length;
$("[data-live-counter]").textContent="소속 검투사 "+s.roster.length+"명 · "+(s.message||"훈련을 시작하세요.");

var host=$(".ll-portraits"),savedScroll=host.scrollLeft;
host.replaceChildren();
var classes={murmillo:'무르밀로',thraex:'트라엑스',retiarius:'레티아리우스'};
s.roster.forEach(function(h,i){
 var b=document.createElement("button");b.type="button";
 b.className="ll-fighter-card"+(i===s.active?" selected":"");
 b.setAttribute("aria-label",h.name+" · "+(classes[h.cls]||h.cls)+" · Lv."+h.level+" 선택");
 b.setAttribute("aria-pressed",String(i===s.active));
 b.title=h.name+" · "+(classes[h.cls]||h.cls)+" · Lv."+h.level;
 b.dataset.index=String(i);
 var canvas=document.createElement("canvas");canvas.width=172;canvas.height=120;
 canvas.setAttribute("aria-hidden","true");b.appendChild(canvas);
 var name=document.createElement("strong");name.className="ll-fighter-name";
 name.textContent=h.name;b.appendChild(name);
 var meta=document.createElement("span");meta.className="ll-fighter-meta";
 meta.textContent=(classes[h.cls]||h.cls)+" · Lv."+h.level;b.appendChild(meta);
 var injury=Math.max(0,Math.round(Number(h.injury)||0));
 var fatigue=Math.max(0,Math.round(Number(h.fatigue)||0));
 var condition=document.createElement("small");condition.className="ll-fighter-condition";
 condition.textContent=injury>=80?"부상 · 출전 불가":fatigue>=80?"피로 · 휴식 필요":
  injury>0?"부상 "+injury:fatigue>0?"피로 "+fatigue:"출전 가능";
 if(injury>=80||fatigue>=80)condition.classList.add("is-unfit");
 b.appendChild(condition);host.appendChild(b);
 var src=a.portrait(i);
 if(src&&src.width&&src.height){
  if(!window.ArenaPortraitFit?.draw?.(canvas,src,{inset:.045})){
   var k=Math.min(170/src.width,118/src.height),ctx=canvas.getContext("2d");
   ctx.drawImage(src,(172-src.width*k)/2,120-src.height*k,src.width*k,src.height*k);
  }
 }
 b.onclick=function(){a.select(i);refresh();notice(h.name+" · 출전 후보 선택");};
});
var add=document.createElement("button");add.type="button";
add.setAttribute("aria-label","검투사시장으로 이동");
add.textContent="＋";add.className="ll-add";
var addNote=document.createElement("small");addNote.textContent="검투사 영입";add.appendChild(addNote);
add.onclick=function(){action("market");};host.appendChild(add);
host.scrollLeft=savedScroll;
}
function open(){
 setup();if(!bridge())return;
 scene.hidden=false;refresh();fit();
 var strip=$(".ll-portraits"),chosen=strip&&strip.querySelector(".selected");
 if(strip&&chosen)strip.scrollLeft=Math.max(0,chosen.offsetLeft-(strip.clientWidth-chosen.offsetWidth)/2);
 clearTimeout(dominaTimer);clearTimeout(dominaReturnTimer);
 dominaTimer=setTimeout(animateDomina,1700+Math.random()*1200);
 // No requestAnimationFrame loop: avoids unnecessary 60fps work on mobile.
}
window.LudusScene={open:open,close:close,refresh:refresh};
})();
