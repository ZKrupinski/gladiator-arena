(function(){
"use strict";
var scene,stage,raf=0,count=0,toastTimer=0;
var W=1448,H=1086;
function $(s){return scene&&scene.querySelector(s);}
function bridge(){return window.LudusBridge;}
function fit(){if(stage){var s=Math.min(innerWidth/W,innerHeight/H);stage.style.transform="translate(-50%,-50%) scale("+s+")";}}
function notice(msg){var t=$(".ll-toast");t.textContent=msg;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(function(){t.hidden=true;},2200);}
function close(){if(scene){scene.hidden=true;cancelAnimationFrame(raf);}}
function action(id){
var a=bridge();if(!a)return;
if(id==="back"){close();a.exit();return;}
if(id==="market"){close();a.market();return;}
if(id==="roster"||id==="training"||id==="basic"||id==="practice"){close();a.section(id==="roster"?"roster":"training");return;}
if(id==="arena"){if(!a.state().roster.length){notice("검투사시장에서 검투사를 먼저 고용하세요.");return;}close();a.fight();return;}
notice(({coach:"독토레 특훈",upgrade:"시설 강화",elite:"특훈",daily:"보상 수령",boost:"훈련 가속"})[id]+" 기능은 준비 중입니다.");
}
function setup(){
if(scene)return;
scene=document.createElement("div");scene.className="ll-scene";scene.id="ludusScene";scene.hidden=true;
var html=[
'<div class="ll-stage" role="region" aria-label="루두스 훈련장">',
'<div class="ll-fallback"><div class="ll-domina"><img src="assets/ludus/domina_0.webp" alt=""><span>DOMINA · 루두스의 주인</span></div></div>',
'<img class="ll-key" src="assets/ludus/ludus_ui.webp" alt="" aria-hidden="true">',
'<button class="ll-title" data-action="back">❮ 루두스</button>',
'<div class="ll-wallet"><span>🪙 <strong data-gold>0</strong></span><span>✥ <strong data-glory>0</strong></span></div>',
'<div class="ll-menu"><button data-action="basic">▤ 훈련장</button><button data-action="roster">♜ 관리</button><button data-action="coach">⚔ 교관</button><button data-action="upgrade">⚒ 시설 강화</button><button data-action="elite">❧ 특훈</button></div>',
'<div class="ll-speech"><b>도미나</b>훌륭해…\n우리의 검투사들이 이렇게 성장하는 걸 보는 게 가장 큰 즐거움이란다.</div>',
'<div class="ll-doctore"><b>독토레</b>좋다, 자세가 잡히고 있어.<br>더 거칠게! 더 강하게!</div>',
'<div class="ll-bgfighters"><img src="assets/ludus/fighter_0_0.webp" alt=""><img src="assets/ludus/fighter_1_0.webp" alt=""><img src="assets/ludus/fighter_2_0.webp" alt=""></div>',
'<div class="ll-special"><button data-action="training">♜ 일괄 훈련</button><button data-action="daily">♕ 보상 수령</button><button data-action="boost">⌛ 훈련 가속</button></div>',
'<div class="ll-bottom"><div class="ll-roster"><h3>검투사 훈련 현황 <span data-count>0 / 12</span></h3><div class="ll-portraits"></div></div>',
'<div class="ll-actions"><button data-action="basic"><span class="ll-thumb">⚔</span><strong>기초 훈련</strong><small>검투사의 기본을 다집니다.</small></button>',
'<button data-action="practice"><span class="ll-thumb">✦</span><strong>실전 훈련</strong><small>경험치와 능력치를 향상시킵니다.</small></button>',
'<button data-action="arena"><span class="ll-thumb">🏟</span><strong>아레나 출전</strong><small>가장 강한 자를 가립니다.</small></button></div></div>',
'<div class="ll-live-counter" data-live-counter>소속 검투사 0명</div>',
'<div class="ll-hitbuttons">',
'<button data-action="basic" style="left:0;top:95px;width:206px;height:83px" aria-label="훈련장"></button>',
'<button data-action="roster" style="left:0;top:180px;width:206px;height:75px" aria-label="관리"></button>',
'<button data-action="coach" style="left:0;top:260px;width:206px;height:77px" aria-label="교관"></button>',
'<button data-action="upgrade" style="left:0;top:340px;width:206px;height:74px" aria-label="시설 강화"></button>',
'<button data-action="elite" style="left:0;top:418px;width:206px;height:78px" aria-label="특훈"></button>',
'<button data-action="basic" style="left:775px;top:762px;width:196px;height:255px" aria-label="기초 훈련"></button>',
'<button data-action="practice" style="left:981px;top:762px;width:196px;height:255px" aria-label="실전 훈련"></button>',
'<button data-action="arena" style="left:1184px;top:762px;width:207px;height:255px" aria-label="아레나 출전"></button>',
'<button data-action="training" style="left:439px;top:758px;width:93px;height:110px" aria-label="일괄 훈련"></button>',
'<button data-action="daily" style="left:540px;top:758px;width:104px;height:110px" aria-label="보상 수령"></button>',
'<button data-action="boost" style="left:653px;top:758px;width:103px;height:110px" aria-label="훈련 가속"></button>',
'<button data-action="market" style="left:452px;top:887px;width:77px;height:95px" aria-label="검투사시장"></button>',
'</div><div class="ll-toast" hidden role="status"></div></div>'
];
scene.innerHTML=html.join("");document.body.appendChild(scene);stage=$(".ll-stage");
var art=$(".ll-key");art.addEventListener("load",function(){scene.classList.add("ll-has-art");});art.addEventListener("error",function(){scene.classList.remove("ll-has-art");});
scene.addEventListener("click",function(ev){var b=ev.target.closest("button[data-action]");if(b)action(b.dataset.action);});
addEventListener("resize",fit,{passive:true});addEventListener("keydown",function(ev){if(!scene.hidden&&ev.key==="Escape"){ev.preventDefault();action("back");}});
var nav=document.querySelector("#careerHub .ludus-nav");if(nav&&!nav.querySelector("#careerVisualHome")){var home=document.createElement("button");home.id="careerVisualHome";home.textContent="🏛 루두스 홈";home.onclick=function(){bridge().returnHome();open();};nav.prepend(home);}
fit();
}
function refresh(){
if(!scene)return;var a=bridge(),s=a&&a.state();if(!s)return;
$("[data-gold]").textContent=(Number(s.gold)||0).toLocaleString("ko-KR");
$("[data-glory]").textContent=(Number(s.glory)||0).toLocaleString("ko-KR");
$("[data-count]").textContent=s.roster.length+" / 12";
$("[data-live-counter]").textContent="소속 검투사 "+s.roster.length+"명 · "+(s.message||"훈련을 시작하세요.");
var host=$(".ll-portraits");host.replaceChildren();
s.roster.slice(0,6).forEach(function(h,i){
var b=document.createElement("button");b.className=i===s.active?"selected":"";b.setAttribute("aria-label",h.name+" 선택");
var canvas=document.createElement("canvas");canvas.width=84;canvas.height=68;b.appendChild(canvas);
var label=document.createElement("small");label.textContent="Lv."+h.level;b.appendChild(label);host.appendChild(b);
var src=a.portrait(i);if(src&&src.width&&src.height){var k=Math.min(82/src.width,67/src.height),ctx=canvas.getContext("2d");ctx.drawImage(src,(84-src.width*k)/2,68-src.height*k,src.width*k,src.height*k);}
b.onclick=function(){a.select(i);refresh();notice(h.name+" 선택");};
});
var add=document.createElement("button");add.setAttribute("aria-label","검투사시장");add.textContent="＋";add.style.fontSize="55px";add.onclick=function(){action("market");};host.appendChild(add);
}
function tick(){if(!scene||scene.hidden)return;count++;if(count%48===0){var n=Math.floor(count/48)%4;[...scene.querySelectorAll(".ll-bgfighters img")].forEach(function(img,i){img.src="assets/ludus/fighter_"+i+"_"+n+".webp";});}
if(count%200===0){var img=$(".ll-domina img");img.src="assets/ludus/domina_"+Math.floor(count/200)%6+".webp";}
raf=requestAnimationFrame(tick);}
function open(){setup();if(!bridge())return;scene.hidden=false;refresh();fit();cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);}
window.LudusScene={open:open,close:close,refresh:refresh};
})();