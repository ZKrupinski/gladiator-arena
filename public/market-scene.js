(function(root){
'use strict';
// One approved 1672x941 composition. All artwork, typography, banners, podiums,
// merchant, cards and buttons remain baked into the approved image.
// Invisible semantic hit targets provide input at the ORIGINAL coordinates.
const OFFERS=[
 {id:'thraex',name:'Cassius',className:'트라엑스',cost:120,bonuses:[2,5,2,2],desc:'민첩한 움직임과 빠른 공격이 특징인 트라엑스입니다. 날카로운 시카로 적의 허점을 노립니다.'},
 {id:'murmillo',name:'Lucius',className:'무르밀로',cost:110,bonuses:[5,3,5,3],desc:'견고한 장방형 방패와 짧은 검을 사용하는 강인한 전사입니다. 방어와 근접전에 특화되어 있습니다.'},
 {id:'retiarius',name:'Marcellus',className:'레티아리우스',cost:130,bonuses:[2,4,1,5],desc:'그물과 삼지창으로 긴 사거리를 장악하는 기술형 검투사입니다. 상대의 틈을 노리는 데 능합니다.'}
];
let scene=null,options=null,selected=0,sold=new Set(),speechTimeout=0;
const $=id=>scene?.querySelector('#'+id);
const pos=(x,y,w,h)=>'left:'+(x/1672*100)+'%;top:'+(y/941*100)+'%;width:'+(w/1672*100)+'%;height:'+(h/941*100)+'%';
function spriteFor(o){return options?.getSprite?.(o.id)||null;}
function updateWallet(){
 const label=$('marketExactGold');if(label)label.textContent=Number(options?.state?.gold||0).toLocaleString('ko-KR');
}
function dialogue(text){
 const d=$('marketExactDialogue');if(!d)return;
 d.hidden=false;d.textContent=text;
 const mouth=$('marketExactMouth');if(mouth){mouth.classList.remove('talking');void mouth.offsetWidth;mouth.classList.add('talking');}
 clearTimeout(speechTimeout);speechTimeout=setTimeout(()=>{mouth?.classList.remove('talking');},1500);
}
function drawPortrait(o){
 const img=spriteFor(o),canvas=$('marketExactPortrait');if(!canvas)return;
 const context=canvas.getContext('2d');context.clearRect(0,0,canvas.width,canvas.height);
 if(!img)return;
 const scale=Math.min((canvas.width-10)/img.width,(canvas.height-6)/img.height);
 const w=img.width*scale,h=img.height*scale;
 context.drawImage(img,(canvas.width-w)/2,canvas.height-h,w,h);
}
function paint(){
 if(!scene||scene.hidden)return;
 updateWallet();
 for(let i=0;i<3;i++){
  const btn=$('marketOffer'+i);btn.setAttribute('aria-pressed',String(selected===i));btn.disabled=sold.has(i);
  const flag=$('marketSold'+i);flag.hidden=!sold.has(i);
 }
 const o=OFFERS[selected],alt=$('marketExactDetail');
 // The original Cassius detail panel is kept pixel-for-pixel until a different
 // candidate is selected. Dynamic detail only paints inside its existing panel.
 alt.hidden=selected===0;
 if(selected!==0){
  $('marketExactTitle').textContent=o.name+' · '+o.className;
  $('marketExactSummary').textContent='Lv.0';
  $('marketExactDescription').textContent=o.desc;
  drawPortrait(o);
 }
 $('marketExactPrice').textContent=String(o.cost);
 const buy=$('marketExactBuy');
 buy.disabled=sold.has(selected)||Number(options.state.gold)<o.cost;
 buy.setAttribute('aria-label',o.name+' '+o.className+' 고용 · '+o.cost+' 데나리우스'+(sold.has(selected)?' · 이미 고용됨':''));
}
function select(i){
 if(sold.has(i))return;
 selected=i;paint();
 dialogue(OFFERS[i].name+'! '+(i===0?'매우 민첩한 친구죠.':i===1?'묵직한 방패로 버티는 장사가 될 겁니다.':'그물과 삼지창을 다룰 줄 아는 인재입니다.') );
}
function purchase(){
 const o=OFFERS[selected];
 if(sold.has(selected)){dialogue('이 검투사는 방금 고용하셨습니다. 다른 단상을 살펴보세요!');return;}
 if(Number(options.state.gold)<o.cost){dialogue('데나리우스가 부족하군요. 투기장에 나가 승리를 거두고 오시죠.');return;}
 const same=options.state.roster.filter(h=>h.name===o.name||h.name.startsWith(o.name+' ')).length;
 const roman=['',' II',' III',' IV',' V',' VI',' VII'];
 const chosen={...o,name:o.name+(roman[same]??' '+String(same+1))};
 if(!options.hire(chosen))return;
 sold.add(selected);options.save?.();
 paint();
 dialogue('훌륭합니다! '+chosen.name+'이(가) 루두스에 합류했습니다. 다음 후보도 살펴보시겠습니까?');
}
function close(){
 if(!scene)return;
 scene.hidden=true;clearTimeout(speechTimeout);options?.onExit?.();
}
function makeHit(id,label,rect,extra=''){
 return '<button class="market-hit '+extra+'" type="button" id="'+id+'" aria-label="'+label+'" style="'+pos(...rect)+'"></button>';
}
function build(){
 scene=document.createElement('section');scene.className='market-exact';scene.id='slaveMarket';scene.hidden=true;
 scene.setAttribute('aria-label','로마 노예시장');
 scene.innerHTML='<div class="market-viewport"><div class="market-stage" id="marketExactStage">'+
 '<img class="market-plate" src="assets/market/roman_market_exact.webp" alt="승인된 로마 시대 노예시장 전체 UI — 상인, 세 개의 단상, 능력치, 이름표, 대화창, 고용 버튼" draggable="false">'+
 '<div class="market-wallet" id="marketExactGold" aria-label="현재 데나리우스"></div>'+
 OFFERS.map((o,i)=>makeHit('marketOffer'+i,o.name+' · '+o.className+' · Lv.0 후보 선택',[
 [442,265,314,487],[785,260,322,490],[1151,252,367,498]][i],'market-choice')).join('')+
 OFFERS.map((o,i)=>'<div class="market-sold" id="marketSold'+i+'" style="'+pos(...[[482,498,255,54],[828,499,255,54],[1191,499,283,54]][i])+'" hidden>고용 완료</div>').join('')+
 '<div class="market-detail" id="marketExactDetail" hidden>'+
 '<div class="market-detail-portrait"><canvas id="marketExactPortrait" width="240" height="240"></canvas></div>'+
 '<div class="market-detail-description"><h3 id="marketExactTitle"></h3><small id="marketExactSummary"></small><p id="marketExactDescription"></p></div></div>'+
 '<div class="market-price" id="marketExactPrice"></div>'+
 '<div class="market-dialog" id="marketExactDialogue" role="status" aria-live="polite" hidden></div>'+
 '<div class="market-merchant-mouth" id="marketExactMouth" aria-hidden="true"></div>'+
 makeHit('marketExactBack','루두스로 돌아가기',[16,844,180,77],'market-back')+
 makeHit('marketExactBuy','검투사 고용하기',[1031,780,337,115],'market-buy')+
 '</div></div>';
 document.body.appendChild(scene);
 $('marketExactBack').addEventListener('click',close);
 $('marketExactBuy').addEventListener('click',purchase);
 OFFERS.forEach((o,i)=>$('marketOffer'+i).addEventListener('click',()=>select(i)));
 // Tap the original parchment dialogue to hear a different short merchant line.
 const originalDialogue=document.createElement('button');originalDialogue.className='market-hit';
 originalDialogue.setAttribute('aria-label','상인에게 이야기 듣기');originalDialogue.style.cssText=pos(23,713,440,116);
 originalDialogue.onclick=()=>dialogue('세 명 모두 훌륭한 재능을 지녔습니다! 마음에 드는 후보를 고르시죠.');
 $('marketExactStage').appendChild(originalDialogue);
}
function open(data){
 options=data;if(!scene)build();
 selected=0;sold=new Set();scene.hidden=false;
 const dlg=$('marketExactDialogue');dlg.hidden=true;dlg.textContent='';
 paint();
}
root.SlaveMarket={open,close,refresh:()=>{if(scene&&!scene.hidden)paint();}};
})(globalThis);