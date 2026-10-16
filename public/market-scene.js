/* GLADIATOR · MERCATUS — approved-market-art interactive scene (1672×941). */
(function(root){
'use strict';
const WIDTH=1672, HEIGHT=941;
const types=[
 {id:'thraex',className:'트라엑스',names:['Cassius','Decimus','Aulus','Titus','Felix','Flavius'],base:[2,5,2,2],cost:500,desc:'민첩한 움직임과 빠른 공격이 특징인 트라엑스입니다. 날카로운 시카로 적의 허점을 노립니다.',face:[550,258,158,146]},
 {id:'murmillo',className:'무르밀로',names:['Lucius','Marcus','Brutus','Gaius','Publius','Tiberius'],base:[5,3,5,3],cost:500,desc:'견고한 방패와 단검으로 전선을 지키는 강인한 무르밀로입니다. 안정적인 방어에 능합니다.',face:[856,255,163,151]},
 {id:'retiarius',className:'레티아리우스',names:['Marcellus','Quintus','Nero','Sextus','Julius','Valerius'],base:[2,4,1,5],cost:500,desc:'그물과 삼지창으로 원거리를 장악하는 레티아리우스입니다. 높은 기술과 넓은 사거리를 가집니다.',face:[1244,264,176,150]}
];
const labels=[['STR','#ff5554','#bc2223','✊'],['AGI','#66f36e','#238f39','♞'],['DEF','#5796ff','#274cc2','⬟'],['TEC','#a66afa','#6028bd','✥']];
let scene=null,stage=null,opts=null,selection=0,keyImg=null,speechReset=null,speechInterval=null,resizeHandler=null;
const $=sel=>scene?.querySelector(sel);
const clean=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function offers(){
 const seed=Math.max(0,Number(opts?.state?.marketSeed)||0);
 return types.map((t,i)=>({...t,name:t.names[seed%t.names.length],vals:t.base.map((n,j)=>{const v=seed?((seed+i+j)%3)-1:0;return Math.min(6,Math.max(1,n+v));})}));
}
function fit(){if(!stage)return;const w=window.innerWidth,h=window.innerHeight;const z=Math.min(w/WIDTH,h/HEIGHT);stage.style.transform=`translate(-50%,-50%) scale(${z})`;}
function getHeroArtwork(hero){const s=opts?.getSprite?.(hero.id);return s&&s.width&&s.height?s:null;}
function drawPortrait(){const c=$('#gmPortrait');if(!c||c.parentElement.hidden)return;const ctx=c.getContext('2d');ctx.clearRect(0,0,120,123);const hero=offers()[selection],img=getHeroArtwork(hero);
 if(img){const k=Math.min(118/img.width,121/img.height);const w=img.width*k,h=img.height*k;ctx.drawImage(img,(120-w)/2,123-h,w,h);}
 else if(keyImg?.complete&&keyImg.naturalWidth){const [x,y,w,h]=hero.face;ctx.drawImage(keyImg,x,y,w,h,0,0,120,123);}
}
function overlayPanel(hero,i,show){
 const el=$('#gmPanel'+i);el.hidden=!show;if(!show)return;
 el.innerHTML=`<div class="gm-roman-name">${clean(hero.name)}</div><div class="gm-class">${hero.className}</div><div class="gm-lv">Lv.0</div>`+
  hero.vals.map((n,j)=>`<div class="gm-stat"><span class="gm-stat-name"><b style="color:${labels[j][1]}">${labels[j][3]}</b>${labels[j][0]}</span><span class="gm-stat-track"><i style="--value:${n*16}%;--color:${labels[j][1]};--shade:${labels[j][2]}"></i></span></div>`).join('');
}
function update(){if(!scene||scene.hidden)return;
 const state=opts.state,heros=offers(),hero=heros[selection],seed=Number(state.marketSeed)||0;
 const wallet=$('#gmWallet');wallet.hidden=Number(state.gold)===3200;wallet.textContent=Number(state.gold).toLocaleString('ko-KR');
 const cost=$('#gmPrice');cost.hidden=hero.cost===500;cost.textContent=hero.cost.toLocaleString('ko-KR');
 for(let i=0;i<3;i++){
  const btn=$('#gmCard'+i);btn.setAttribute('aria-pressed',String(i===selection));btn.setAttribute('aria-label',heros[i].name+', '+heros[i].className+', 0레벨, '+heros[i].cost+' 데나리우스. 후보 선택');
  overlayPanel(heros[i],i,seed>0);
 }
 const detail=$('#gmBottomInfo');const avatar=$('#gmPortraitWrap');detail.hidden=avatar.hidden=(seed===0&&selection===0);
 if(!detail.hidden){detail.innerHTML=`<h2>${clean(hero.name)} · ${hero.className}</h2><div class="gm-level">Lv.0</div><p>${hero.desc}</p>`;drawPortrait();}
 const hire=$('#gmHire');hire.disabled=Number(state.gold)<hero.cost;
 hire.setAttribute('aria-label',hero.name+' 고용, '+hero.cost+' 데나리우스');
}
function talk(message){
 const el=$('#gmSpeech'),glow=$('#gmTalking');clearTimeout(speechReset);
 if(!message){el.hidden=true;glow.classList.remove('active');return;}
 el.hidden=false;el.textContent=message;glow.classList.add('active');
 speechReset=setTimeout(()=>{el.hidden=true;glow.classList.remove('active');},4500);
}
function hire(){const hero=offers()[selection];if(opts.state.gold<hero.cost){talk('데나리우스가 모자라는군요! 승리하고 돌아오시면 좋은 인재를 소개하겠소.');return;}
 const done=opts.hire?.(hero);if(!done){talk('아쉽군요. 다시 한번 확인해 보시지요!');return;}
 opts.state.marketSeed=(Number(opts.state.marketSeed)||0)+1;
 opts.save?.();
 talk(`${hero.name}을(를) 영입했군요! 멋진 선택입니다. 이제 루두스에서 훈련시키십시오!`);
 selection=0;update();
}
function close(){if(!scene)return;scene.hidden=true;clearTimeout(speechReset);clearInterval(speechInterval);opts?.onExit?.();}
function keydown(e){if(!scene||scene.hidden)return;
 if(e.key==='Escape'){e.preventDefault();close();}
 if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();selection=(selection+(e.key==='ArrowRight'?1:2))%3;update();talk(offers()[selection].name+'! 아주 훌륭한 젊은 투사입니다. 살펴보시지요!');}
 if(e.key==='Enter'&&e.target===scene){e.preventDefault();hire();}}
function setup(){if(scene)return;
 scene=document.createElement('section');scene.className='gm-screen';scene.id='slaveMarket';scene.hidden=true;scene.setAttribute('role','dialog');scene.setAttribute('aria-modal','true');scene.setAttribute('aria-label','검투사시장');
 scene.innerHTML=`<div class="gm-stage" id="gmStage">
  <img class="gm-key-art" id="gmKey" src="assets/market/market_keyvisual.webp" alt="" aria-hidden="true" decoding="sync" draggable="false">
  <button type="button" class="gm-back-hit" id="gmBack" aria-label="루두스로 돌아가기" title="루두스로 돌아가기"></button>
  <button type="button" class="gm-card-hit" data-i="0" id="gmCard0" aria-label="Cassius 트라엑스 후보" aria-pressed="true"></button>
  <button type="button" class="gm-card-hit" data-i="1" id="gmCard1" aria-label="Lucius 무르밀로 후보" aria-pressed="false"></button>
  <button type="button" class="gm-card-hit" data-i="2" id="gmCard2" aria-label="Marcellus 레티아리우스 후보" aria-pressed="false"></button>
  <div class="gm-card-dynamic" data-i="0" id="gmPanel0" hidden></div>
  <div class="gm-card-dynamic" data-i="1" id="gmPanel1" hidden></div>
  <div class="gm-card-dynamic" data-i="2" id="gmPanel2" hidden></div>
  <div class="gm-wallet-value" id="gmWallet" hidden></div>
  <div class="gm-bottom-avatar" id="gmPortraitWrap" hidden><canvas id="gmPortrait" width="120" height="123" aria-hidden="true"></canvas></div>
  <div class="gm-bottom-info" id="gmBottomInfo" hidden></div>
  <div class="gm-price-value" id="gmPrice" hidden></div>
  <div class="gm-speech-new" id="gmSpeech" hidden role="status" aria-live="polite"></div>
  <div class="gm-merchant-talk" id="gmTalking" aria-hidden="true"></div>
  <button type="button" class="gm-hire-hit" id="gmHire" aria-label="선택한 검투사 고용"></button>
  <div class="gm-orient" aria-hidden="true">넓은 화면에서는 검투사시장을 더 크게 볼 수 있습니다.</div>
 </div>`;
 document.body.appendChild(scene);stage=$('#gmStage');resizeHandler=fit;window.addEventListener('resize',resizeHandler,{passive:true});document.addEventListener('keydown',keydown);
 $('#gmKey').addEventListener('load',e=>{keyImg=e.target;drawPortrait();});
 $('#gmBack').addEventListener('click',close);$('#gmHire').addEventListener('click',hire);
 for(let i=0;i<3;i++)$('#gmCard'+i).addEventListener('click',()=>{selection=i;update();talk('좋은 검투사를 찾으십니까? '+offers()[i].name+'의 기량을 살펴보시지요!');});
 fit();
}
function open(options){opts=options;setup();
 // The prototype began with 260D and offered 110D hires. This visual's genuine 500D market uses a one-time
 // starter endowment only for a new empty Ludus; established savegames keep their real currency.
 if((!opts.state.roster||opts.state.roster.length===0)&&(Number(opts.state.fights)||0)===0&&Number(opts.state.gold)<500){opts.state.gold=3200;opts.save?.();}
 selection=0;scene.hidden=false;talk(null);fit();update();
}
root.SlaveMarket={open,close,refresh:update};
if(typeof module!=='undefined')module.exports={types,offersForTest:state=>{opts={state};return offers();}};
})(globalThis);