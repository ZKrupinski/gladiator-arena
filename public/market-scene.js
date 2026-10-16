(function(root){
'use strict';
const classes=[
 {id:'thraex',className:'트라엑스',names:['Cassius','Titus','Decimus','Felix','Aulus','Flavius'],cost:120,desc:'민첩한 움직임과 빠른 곡검 공격이 특징입니다. 작은 방패로 적의 허점을 노립니다.',base:[2,5,2,3]},
 {id:'murmillo',className:'무르밀로',names:['Lucius','Marcus','Brutus','Gaius','Publius','Tiberius'],cost:110,desc:'견고한 장방형 방패와 단검으로 정면을 지키는 강인한 중장 전사입니다.',base:[5,2,5,2]},
 {id:'retiarius',className:'레티아리우스',names:['Marcellus','Quintus','Nero','Sextus','Julius','Valerius'],cost:130,desc:'그물과 삼지창으로 사거리를 장악하는 기술형 검투사입니다.',base:[2,4,2,5]}
];
const stats=[['STR','#e96f63'],['AGI','#7cbd73'],['DEF','#75a5ef'],['TEC','#ac7bea']];
let scene=null,options=null,selected=0,timer=0,speechTimer=0,pose=0,marketImage=null;
const qs=s=>scene?.querySelector(s);
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function offer(entry,slot){
 const seed=(Number(options.state.marketSeed)||0)+slot*7;
 const offset=(Number(options.state.fights)||0)+seed;
 const bonuses=entry.base.map((n,i)=>Math.max(1,Math.min(6,n+((offset*7+i*5)%3)-1)));
 return {...entry,name:entry.names[(offset+Math.floor(seed/4))%entry.names.length],bonuses};
}
function current(){return classes.map(offer);}
function say(message,p=1){
 const speech=qs('#slaveMerchantSpeech');if(speech)speech.textContent=message;
 pose=p;positionMerchant();
 clearTimeout(speechTimer);speechTimer=setTimeout(()=>{pose=0;positionMerchant();},2100);
}
function positionMerchant(){
 const art=qs('#slaveMarketMerchant');if(!art)return;
 const p=['0% 0%','100% 0%','0% 100%','100% 100%'][pose%4];art.style.backgroundPosition=p;
}
function paint(){
 if(!scene||scene.hidden)return;
 const offers=current();
 qs('#slaveMarketGold').textContent=(Number(options.state.gold)||0).toLocaleString('ko-KR');
 qs('#slaveMarketCards').innerHTML=offers.map((o,i)=>`<button type="button" class="slave-market-podium" data-offer="${i}" aria-pressed="${i===selected}"><span class="slave-market-drape" aria-hidden="true"></span><span class="slave-market-display"><canvas width="330" height="350" data-market-art="${i}" aria-label="${escapeHtml(o.className)} 기본 전투 자세"></canvas></span><span class="slave-market-plaque"><h3>${escapeHtml(o.name)}</h3><div class="class">${escapeHtml(o.className)}</div><div class="slave-market-level">Lv.0 · 신참</div><div class="slave-market-bars">${o.bonuses.map((b,k)=>`<span class="slave-market-bar"><b>${stats[k][0]}</b><span class="slave-market-track"><i style="--bar-color:${stats[k][1]};--bar-width:${b*15}%"></i></span></span>`).join('')}</div></span></button>`).join('');
 const o=offers[selected];
 qs('#slaveMarketSelected').innerHTML=`<h2>${escapeHtml(o.name)} · ${o.className}</h2><p><b>Lv.0 · 미훈련 신참</b> / 영입 후 Lv.1부터 육성</p><p>${o.desc}</p><p>기본 능력: ${stats.map((x,i)=>x[0]+' '+o.bonuses[i]).join(' · ')}</p>`;
 const buy=qs('#slaveMarketBuy');buy.innerHTML=`고용<small>◉ ${o.cost} 데나리우스</small>`;
 buy.disabled=Number(options.state.gold)<o.cost;buy.setAttribute('aria-label',o.name+' '+o.cost+' 데나리우스에 고용');
 for(const btn of scene.querySelectorAll('[data-offer]'))btn.onclick=()=>{
  selected=Number(btn.dataset.offer);paint();say(current()[selected].name+'! 이 친구의 기량을 한번 살펴보시죠!',1);
 };
 paintSprites();
}
function paintSprites(){
 for(const c of scene.querySelectorAll('[data-market-art]')){
  const entry=classes[Number(c.dataset.marketArt)];
  const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
  const src=options.getSprite(entry.id);
  if(!src)return;
  const scale=Math.min((c.width-6)/src.width,(c.height-10)/src.height);
  const w=src.width*scale,h=src.height*scale;
  ctx.drawImage(src,(c.width-w)/2,c.height-h-5,w,h);
 }
}
function close(){
 if(!scene)return;
 scene.hidden=true;clearInterval(timer);clearTimeout(speechTimer);timer=0;
 options?.onExit?.();
}
function buy(){
 const o=current()[selected];
 if(Number(options.state.gold)<o.cost){say('데나리우스가 부족하군요. 시합에서 돈을 더 벌어오시지요!',3);return;}
 const result=options.hire(o);
 if(!result)return;
 options.state.marketSeed=(Number(options.state.marketSeed)||0)+1;
 say('축하합니다! '+o.name+'이(가) 루두스에 합류합니다. 훌륭한 투사가 될 거예요!',2);
 paint();
}
function open(data){
 options=data;if(!scene){
  scene=document.createElement('section');scene.className='slave-market';scene.id='slaveMarket';scene.hidden=true;
  scene.setAttribute('aria-label','로마 시대 노예시장');
  scene.innerHTML=`<div class="slave-market-scene"><header class="slave-market-top"><button id="slaveMarketBack" class="slave-market-back" type="button">◀ 루두스로</button><h1 class="slave-market-banner">노예시장</h1><div class="slave-market-wallet"><span>◉</span><b id="slaveMarketGold"></b> D</div></header><main class="slave-market-main"><aside class="slave-market-dealer"><div class="slave-market-merchant-art" id="slaveMarketMerchant" role="img" aria-label="로마 시장 상인 네 가지 손짓과 표정"></div><div class="slave-market-merchant-fallback"><span class="figure">🧔🏻‍♂️</span><small>노예 상인 · MERCATOR</small></div><div id="slaveMerchantSpeech" role="status" aria-live="polite" class="slave-market-speech"></div></aside><div class="slave-market-candidates" id="slaveMarketCards" aria-label="구매 가능한 검투사"></div></main><div class="slave-market-bottom"><div class="slave-market-selected" id="slaveMarketSelected"></div><button class="slave-market-buy" id="slaveMarketBuy" type="button"></button></div></div>`;
  document.body.appendChild(scene);
  qs('#slaveMarketBack').onclick=close;
  qs('#slaveMarketBuy').onclick=buy;
  const img=new Image();img.onload=()=>{marketImage=img;qs('#slaveMarketMerchant')?.removeAttribute('data-missing');};
  img.onerror=()=>qs('#slaveMarketMerchant')?.setAttribute('data-missing','true');
  img.src='assets/market/mercator_sheet.webp';
 }
 selected=0;scene.hidden=false;
 say('어서 오십시오! 오늘 막 들어온 검투사 후보들이 준비되어 있습니다. 단상에서 살펴보시지요!',2);
 paint();
 if(timer)clearInterval(timer);
 timer=setInterval(()=>{if(!scene.hidden){pose=pose===0?1:0;positionMerchant();paintSprites();}},1100);
}
root.SlaveMarket={open,close,refresh:()=>{if(scene&&!scene.hidden){paint();}}};
})(globalThis);