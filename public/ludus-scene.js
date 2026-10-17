(function(){
"use strict";
var scene,stage,raf=0,count=0,toastTimer=0;
var W=1448,H=1086,rosterPage=0;
var poses={domina:Array.from({length:6},(_,i)=>"assets/ludus/domina_"+i+".webp"),fighter:Array.from({length:3},(_,r)=>Array.from({length:4},(_,c)=>"assets/ludus/fighter_"+r+"_"+c+".webp"))};
var preload=[];for(var seq of [poses.domina,...poses.fighter])for(var file of seq){var pic=new Image();pic.src=file;preload.push(pic);}

function $(s){return scene&&scene.querySelector(s);}
function bridge(){return window.LudusBridge;}
function fit(){if(stage){var s=Math.min(innerWidth/W,innerHeight/H);stage.style.transform="translate(-50%,-50%) scale("+s+")";}}
function notice(msg){var t=$(".ll-toast");t.textContent=msg;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(function(){t.hidden=true;},2200);}
function close(){if(scene){scene.hidden=true;cancelAnimationFrame(raf);clearTimeout(toastTimer);}}
function action(id,button){
var a=bridge();if(!a)return;
if(id==="select"){var index=Number(button&&button.dataset.index);var hero=a.state().roster[index];if(hero){a.select(index);rosterPage=Math.floor(index/6);refresh();notice(hero.name+" · 출전 검투사 선택");}else notice("비어 있는 슬롯입니다. 검투사시장에서 영입하세요.");return;}
if(id==="dismiss-orientation"){scene.classList.add("ll-allow-portrait");return;}
if(id==="back"){close();a.exit();return;}
if(id==="market"){close();a.market();return;}
if(id==="prev"||id==="next"){var max=Math.max(0,Math.ceil(a.state().roster.length/6)-1);rosterPage=Math.max(0,Math.min(max,rosterPage+(id==="next"?1:-1)));refresh();return;}
if(id==="armory"){close();a.section("gear");return;}
if(id==="roster"||id==="training"||id==="basic"||id==="practice"){close();a.section(id==="roster"?"roster":"training");return;}
if(id==="arena"){var team=a.state().roster;if(!team.length){notice("검투사시장에서 검투사를 먼저 고용하세요.");return;}if(!team.some(function(h){return Number(h.injury||0)<80;})){notice("출전 가능한 검투사가 없습니다. 치료가 필요합니다.");return;}close();a.fight();return;}
/* Lobby actions are intentionally limited to playable destinations. */
}
function setup(){
if(scene)return;
scene=document.createElement("div");scene.className="ll-scene";scene.id="ludusScene";scene.hidden=true;
var html=[
'<div class="ll-stage" role="region" aria-label="루두스 훈련장">',
'<div class="ll-fallback"><div class="ll-domina"><img src="assets/ludus/domina_0.webp" alt=""><span>DOMINA · 루두스의 주인</span></div></div>',
'<img class="ll-key" src="assets/ludus/ludus_ui.webp" alt="" aria-hidden="true">',
'<img class="ll-domina-blink" src="assets/ludus/domina_blink.webp" alt="" aria-hidden="true">',
'<button class="ll-title" data-action="back">❮ 루두스</button>',
'<div class="ll-wallet" aria-label="실시간 루두스 자원"><span>🪙 금화 <strong data-gold>0</strong></span><span>✥ 명예 <strong data-glory>0</strong></span><span>⚔ 소속 <strong data-roster-count>0</strong></span></div>',
'<div class="ll-menu" role="navigation" aria-label="루두스 주요 시설"><button type="button" data-action="training">⚔ 훈련소</button><button type="button" data-action="roster">♜ 검투사 관리</button><button type="button" data-action="armory">🛡 장비실</button><button type="button" data-action="market">🏛 검투사시장</button><button type="button" data-action="arena">⚔ 아레나 출전</button></div>',
'<div class="ll-speech"><b>도미나</b>훌륭해…\n우리의 검투사들이 이렇게 성장하는 걸 보는 게 가장 큰 즐거움이란다.</div>',
'<div class="ll-doctore"><b>독토레</b>좋다, 자세가 잡히고 있어.<br>더 거칠게! 더 강하게!</div>',
'<div class="ll-bgfighters"><img src="assets/ludus/fighter_0_0.webp" alt=""><img src="assets/ludus/fighter_1_0.webp" alt=""><img src="assets/ludus/fighter_2_0.webp" alt=""></div>',
'<div class="ll-bottom"><div class="ll-roster"><h3>검투사 훈련 현황 <span data-count>0명</span><span class="ll-pager"><button data-action="prev" aria-label="이전 검투사">◀</button><span data-roster-page>1/1</span><button data-action="next" aria-label="다음 검투사">▶</button></span></h3><div class="ll-portraits"></div></div>',
'<div class="ll-actions"><button data-action="basic"><span class="ll-thumb">⚔</span><strong>기초 훈련</strong><small>검투사의 기본을 다집니다.</small></button>',
'<button data-action="practice"><span class="ll-thumb">✦</span><strong>실전 훈련</strong><small>경험치와 능력치를 향상시킵니다.</small></button>',
'<button data-action="arena"><span class="ll-thumb">🏟</span><strong>아레나 출전</strong><small>가장 강한 자를 가립니다.</small></button></div></div>',
'<div class="ll-live-counter" data-live-counter>소속 검투사 0명</div>',
'<div class="ll-hitbuttons" aria-label="로비 하단 바로가기">',
'<button data-action="training" style="left:775px;top:762px;width:196px;height:255px" aria-label="훈련소로 이동"></button>',
'<button data-action="training" style="left:981px;top:762px;width:196px;height:255px" aria-label="훈련소로 이동"></button>',
'<button data-action="arena" style="left:1184px;top:762px;width:207px;height:255px" aria-label="아레나 출전"></button>',
'</div><div class="ll-toast" hidden role="status"></div></div><div class="ll-orientation" role="dialog" aria-label="가로 화면 권장"><div class="ll-rotate-icon" aria-hidden="true">↻</div><strong>가로 화면에서 플레이해 주세요</strong><p>루두스는 가로형 게임 화면으로 제작되었습니다.<br>기기를 가로로 돌리면 버튼과 검투사가 크게 보입니다.</p><button data-action="dismiss-orientation">작은 화면으로 계속 보기</button></div>'
];
scene.innerHTML=html.join("");document.body.appendChild(scene);stage=$(".ll-stage");
var art=$(".ll-key");art.addEventListener("load",function(){scene.classList.add("ll-has-art");});art.addEventListener("error",function(){scene.classList.remove("ll-has-art");});if(art.complete&&art.naturalWidth)scene.classList.add("ll-has-art");
scene.addEventListener("click",function(ev){var b=ev.target.closest("button[data-action]");if(b)action(b.dataset.action,b);});
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
var host=$(".ll-portraits");host.replaceChildren();
var maxPage=Math.max(0,Math.ceil(s.roster.length/6)-1);rosterPage=Math.max(0,Math.min(maxPage,rosterPage));
$("[data-roster-page]").textContent=(rosterPage+1)+"/"+(maxPage+1);
$(".ll-pager").hidden=maxPage===0;
s.roster.slice(rosterPage*6,rosterPage*6+6).forEach(function(h,localIndex){var i=rosterPage*6+localIndex;
var b=document.createElement("button");b.className=i===s.active?"selected":"";b.setAttribute("aria-label",h.name+" · Lv."+h.level+" 선택");b.setAttribute("title",h.name+" · "+h.cls+" · Lv."+h.level);b.dataset.index=String(i);
var canvas=document.createElement("canvas");canvas.width=84;canvas.height=68;b.appendChild(canvas);
var label=document.createElement("small");label.textContent="Lv."+h.level;b.appendChild(label);host.appendChild(b);
var src=a.portrait(i);if(src&&src.width&&src.height){var k=Math.min(82/src.width,67/src.height),ctx=canvas.getContext("2d");ctx.drawImage(src,(84-src.width*k)/2,68-src.height*k,src.width*k,src.height*k);}
b.onclick=function(){a.select(i);refresh();notice(h.name+" · 출전 후보 선택");};
});
var add=document.createElement("button");add.setAttribute("aria-label","검투사시장으로 이동");add.textContent="＋";add.className="ll-add";add.onclick=function(){action("market");};host.appendChild(add);
}
function tick(){if(!scene||scene.hidden)return;count++;
if(count%330===0){var eye=$(".ll-domina-blink");if(eye)eye.classList.add("is-blinking");}
if(count%330===8){var eye=$(".ll-domina-blink");if(eye)eye.classList.remove("is-blinking");}if(count%48===0){var n=Math.floor(count/48)%4;[...scene.querySelectorAll(".ll-bgfighters img")].forEach(function(img,i){if(poses.fighter[i][n])img.src=poses.fighter[i][n];});}
if(count%200===0){var img=$(".ll-domina img");if(poses.domina.length)img.src=poses.domina[Math.floor(count/200)%6];}
raf=requestAnimationFrame(tick);}
function open(){setup();if(!bridge())return;rosterPage=Math.floor(Math.max(0,Number(bridge().state().active)||0)/6);scene.hidden=false;refresh();fit();cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);}
window.LudusScene={open:open,close:close,refresh:refresh};
})();