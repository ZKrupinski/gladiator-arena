/* GLADIATOR / MERCATUS : v4.9 interactive transaction layer on approved 1672x941 key art. */
(function(root){
'use strict';
const WIDTH=1672, HEIGHT=941, RESTOCK_COST=60;
const types=[
 {id:'thraex',className:'트라엑스',names:['Cassius','Decimus','Aulus','Titus','Felix','Flavius'],base:[2,5,2,2],cost:500,desc:'민첩한 움직임과 빠른 공격이 특징인 트라엑스입니다. 날카로운 시카로 적의 허점을 노립니다.',face:[550,258,158,146]},
 {id:'murmillo',className:'무르밀로',names:['Lucius','Marcus','Brutus','Gaius','Publius','Tiberius'],base:[5,3,5,3],cost:500,desc:'견고한 방패와 단검으로 전선을 지키는 강인한 무르밀로입니다. 안정적인 방어에 능합니다.',face:[856,255,163,151]},
 {id:'retiarius',className:'레티아리우스',names:['Marcellus','Quintus','Nero','Sextus','Julius','Valerius'],base:[2,4,1,5],cost:500,desc:'그물과 삼지창으로 원거리를 장악하는 레티아리우스입니다. 높은 기술과 넓은 사거리를 가집니다.',face:[1244,264,176,150]}
];
const labels=[['STR','#ff5554','#bc2223','✊'],['AGI','#66f36e','#238f39','♞'],['DEF','#5796ff','#274cc2','⬟'],['TEC','#a66afa','#6028bd','✥']];
const merchantLines={hello:'좋은 검투사가 필요하신가요? 방금 들어온 유망한 후보들입니다!',select:'훈련만 잘 시킨다면 훌륭한 투사가 될 겁니다!',confirm:'정말 이 검투사를 영입하시겠습니까? 데나리우스를 지불하면 거래가 성사됩니다.',cancel:'마음이 바뀌셨습니까? 다른 후보도 살펴보시지요.',success:'하하하! 안목이 훌륭하시군요! 이 검투사는 이제 당신의 루두스 소속입니다!',poor:'금화가 부족하다니 아쉽군요. 시합에서 승리하고 다시 방문하세요.',empty:'모든 단상이 비었습니다! 후보 갱신으로 새로운 검투사를 불러오십시오.',refresh:'새로운 후보들이 단상에 올랐습니다! 천천히 살펴보시지요.'};
let scene=null,stage=null,opts=null,selection=0,keyImg=null,mode='idle',dialogOffer=null;
let speechReset=null,animateTimer=null,moodTimer=null,previousFocus=null;
const $=s=>scene?.querySelector(s);
const clean=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function newOffer(i,seed){const t=types[i];return {id:t.id,className:t.className,name:t.names[seed%t.names.length],vals:t.base.map((v,j)=>Math.max(1,Math.min(6,v+(seed?((seed+i+j)%3)-1:0)))),cost:t.cost,desc:t.desc,face:t.face};}
function ensureInventory(){
 const state=opts.state;
 if(!Array.isArray(state.marketInventory)||state.marketInventory.length!==3){
  const seed=Math.max(0,Number(state.marketSeed)||0);
  state.marketInventory=types.map((_,i)=>newOffer(i,seed));
  opts.save?.();
 }
 return state.marketInventory;
}
function inventory(){return ensureInventory();}
function available(){return inventory().map((o,i)=>o?i:-1).filter(i=>i>=0);}
function pick(preferred){const live=available();return live.includes(preferred)?preferred:live[0]??-1;}
function fit(){if(!stage)return;const z=Math.min(innerWidth/WIDTH,innerHeight/HEIGHT);stage.style.transform=`translate(-50%,-50%) scale(${z})`;}
function getHeroArtwork(h){if(!h)return null;const art=opts?.getSprite?.(h.id);return art&&art.width&&art.height?art:null;}
function drawPortrait(h){const c=$('#gmPortrait');if(!c||c.parentElement.hidden||!h)return;const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);const image=getHeroArtwork(h);
 if(image){const k=Math.min((c.width-2)/image.width,(c.height-2)/image.height),w=image.width*k,ht=image.height*k;ctx.drawImage(image,(c.width-w)/2,c.height-ht,w,ht);}
 else if(keyImg?.complete&&keyImg.naturalWidth){const [x,y,w,ht]=h.face;ctx.drawImage(keyImg,x,y,w,ht,0,0,c.width,c.height);}
}
function overlayPanel(hero,i,visible){const el=$('#gmPanel'+i);el.hidden=!visible;if(!visible)return;
 el.innerHTML=`<div class="gm-roman-name">${clean(hero.name)}</div><div class="gm-class">${hero.className}</div><div class="gm-lv">Lv.0</div>`+
 hero.vals.map((n,j)=>`<div class="gm-stat"><span class="gm-stat-name"><b style="color:${labels[j][1]}">${labels[j][3]}</b>${labels[j][0]}</span><span class="gm-stat-track"><i style="--value:${n*16}%;--color:${labels[j][1]};--shade:${labels[j][2]}"></i></span></div>`).join('');
}
function render(){if(!scene||scene.hidden)return;
 const list=inventory(),state=opts.state;selection=pick(selection);
 const wallet=$('#gmWallet');wallet.hidden=Number(state.gold)===3200;wallet.textContent=Number(state.gold).toLocaleString('ko-KR');
 for(let i=0;i<3;i++){
  const h=list[i],btn=$('#gmCard'+i),sold=$('#gmVacant'+i),selected=(i===selection&&!!h);
  btn.disabled=!h;btn.setAttribute('aria-pressed',String(selected));
  btn.setAttribute('aria-label',h?h.name+' '+h.className+' Lv.0 선택':'판매 완료 · 비어 있는 단상');
  sold.hidden=!!h;
  const dynamic=!!h&&((Number(state.marketSeed)||0)!==0||h.name!==types[i].names[0]);
  overlayPanel(h,i,dynamic);
  $('#gmSelection'+i).hidden=!selected;
 }
 const hero=selection<0?null:list[selection],detail=$('#gmBottomInfo'),avatar=$('#gmPortraitWrap');
 const untouched=!!hero&&selection===0&&Number(state.marketSeed||0)===0&&list.every(Boolean);
 detail.hidden=avatar.hidden=untouched||!hero;
 if(hero&&!detail.hidden){detail.innerHTML=`<h2>${clean(hero.name)} · ${hero.className}</h2><div class="gm-level">Lv.0 · ${hero.cost} D</div><p>${hero.desc}</p>`;drawPortrait(hero);}
 const hire=$('#gmHire'),price=$('#gmPrice');hire.disabled=!hero||Number(state.gold)<hero.cost;
 hire.setAttribute('aria-label',hero?hero.name+' 구매 확인, '+hero.cost+' 데나리우스':'구매 가능한 검투사가 없습니다');
 price.hidden=!hero||hero.cost===500;price.textContent=hero?Number(hero.cost).toLocaleString('ko-KR'):'';
 $('#gmNoCandidates').hidden=!!hero;
 const restock=$('#gmRestock');restock.disabled=!list.includes(null)||Number(state.gold)<RESTOCK_COST;
 restock.setAttribute('aria-label','빈 단상을 새 검투사로 갱신. 비용 '+RESTOCK_COST+' 데나리우스');
 $('#gmRestockCount').textContent=list.filter(h=>h===null).length+'자리';
}
function face(pose){const img=$('#gmMerchantExpression'),tiny=$('#gmReactionFace');
 if(img)img.src='assets/market/merchant_pose_'+pose+'.webp';
 if(tiny)tiny.src='assets/market/merchant_pose_'+pose+'.webp';
}
function reaction(line,mood='select',duration=4800){
 clearTimeout(speechReset);clearInterval(animateTimer);clearTimeout(moodTimer);
 const text=$('#gmSpeech'),glow=$('#gmTalking'),badge=$('#gmReactionBadge');
 text.hidden=false;text.textContent=line;glow.classList.add('active');badge.hidden=false;
 const poses={hello:[1,2],select:[0,1],confirm:[1,0],cancel:[3],success:[2,1],poor:[3],empty:[3,0],refresh:[2,1]};
 const frames=poses[mood]||poses.select;let index=0;face(frames[0]);
 if(frames.length>1)animateTimer=setInterval(()=>{index=(index+1)%frames.length;face(frames[index]);},490);
 speechReset=setTimeout(()=>{text.hidden=true;glow.classList.remove('active');badge.hidden=true;clearInterval(animateTimer);},duration);
}
function hideDialog(){const modal=$('#gmDialog');modal.hidden=true;dialogOffer=null;mode='idle';previousFocus?.focus?.();previousFocus=null;}
function askPurchase(){if(mode!=='idle')return;const hero=selection>=0?inventory()[selection]:null;
 if(!hero){reaction(merchantLines.empty,'empty');return;}
 if(Number(opts.state.gold)<hero.cost){reaction(merchantLines.poor,'poor');return;}
 mode='confirm';dialogOffer={slot:selection,hero};previousFocus=document.activeElement;
 const modal=$('#gmDialog');modal.hidden=false;modal.dataset.mode='confirm';
 $('#gmDialogHeading').textContent='검투사 고용 계약';
 $('#gmDialogBody').textContent=hero.name+' · '+hero.className+'을(를) '+hero.cost+' 데나리우스에 고용하시겠습니까?';
 $('#gmDialogDetail').textContent='고용하면 데나리우스가 차감되고, 해당 검투사는 LUDUS의 소속 명단에 Lv.1로 등록됩니다.';
 $('#gmConfirm').textContent='◉ '+hero.cost+' D · 고용 확정';$('#gmCancel').textContent='취소하기';
 reaction(merchantLines.confirm,'confirm',7000);$('#gmCancel').focus();
}
function cancel(){if(mode==='confirm'){hideDialog();reaction(merchantLines.cancel,'cancel');}else if(mode==='success'){hideDialog();reaction('다른 후보도 살펴보시겠습니까?','select');}}
function confirm(){if(mode==='success'){close();return;}if(mode!=='confirm'||!dialogOffer)return;
 const {slot,hero}=dialogOffer,stock=inventory();
 if(stock[slot]!==hero){hideDialog();reaction('이미 거래된 후보입니다. 다시 선택해 주세요.','poor');render();return;}
 if(Number(opts.state.gold)<hero.cost){hideDialog();reaction(merchantLines.poor,'poor');render();return;}
 // The supplied hire callback is the single authority for currency deduction and roster insertion.
 let result;try{result=opts.hire(hero);}catch(error){console.error('시장 고용 처리 실패',error);reaction('거래 처리에 문제가 생겼습니다. 다시 시도해 주세요.','poor');hideDialog();return;}
 if(!result){hideDialog();reaction('거래를 마치지 못했습니다. 다시 시도해 주세요.','poor');return;}
 stock[slot]=null;opts.save?.();selection=pick(slot);
 render();mode='success';dialogOffer=null;
 $('#gmDialog').dataset.mode='success';$('#gmDialogHeading').textContent='영입 성공!';
 $('#gmDialogBody').textContent=hero.name+' · '+hero.className+'이(가) LUDUS에 합류했습니다!';
 $('#gmDialogDetail').textContent='구매한 단상은 비워 두었습니다. 새로운 후보를 보려면 갱신 버튼을 누르세요.';
 $('#gmConfirm').textContent='LUDUS로 이동';$('#gmCancel').textContent='시장 계속 보기';
 reaction(merchantLines.success,'success',8800);$('#gmConfirm').focus();
}
function restock(){if(mode!=='idle')return;const state=opts.state,stock=inventory();if(!stock.includes(null)){reaction('아직 단상에 후보가 있습니다. 비어 있는 자리가 생기면 갱신할 수 있습니다.','select');return;}
 if(Number(state.gold)<RESTOCK_COST){reaction('후보를 새로 데려올 '+RESTOCK_COST+' 데나리우스가 부족하군요.','poor');return;}
 state.gold-=RESTOCK_COST;state.marketSeed=Math.max(0,Number(state.marketSeed)||0)+1;
 for(let i=0;i<stock.length;i++)if(stock[i]===null)stock[i]=newOffer(i,state.marketSeed);
 selection=pick(selection);opts.save?.();render();reaction(merchantLines.refresh,'refresh');
}
function close(){if(!scene)return;if(mode==='confirm')cancel();if(mode==='success')hideDialog();scene.hidden=true;clearTimeout(speechReset);clearTimeout(moodTimer);clearInterval(animateTimer);opts?.onExit?.();}
function keydown(e){if(!scene||scene.hidden)return;
 if(e.key==='Escape'){e.preventDefault();if(mode==='confirm'||mode==='success')cancel();else close();return;}
 if(mode!=='idle')return;
 if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
  e.preventDefault();const live=available();if(!live.length)return;
  const x=live.indexOf(selection);selection=live[(x+(e.key==='ArrowRight'?1:live.length-1))%live.length];render();reaction(inventory()[selection].name+'! '+merchantLines.select,'select');
 }
}
function setup(){if(scene)return;
 scene=document.createElement('section');scene.className='gm-screen';scene.id='slaveMarket';scene.hidden=true;scene.setAttribute('role','dialog');scene.setAttribute('aria-label','검투사시장');
 scene.innerHTML=`<div class="gm-stage" id="gmStage">
  <img class="gm-key-art" id="gmKey" src="assets/market/market_keyvisual.webp" alt="" aria-hidden="true" decoding="sync" draggable="false">
  <button type="button" class="gm-back-hit" id="gmBack" aria-label="루두스로 돌아가기" title="루두스로 돌아가기"></button>
  ${types.map((t,i)=>`<button type="button" class="gm-card-hit" data-i="${i}" id="gmCard${i}" aria-label="${t.names[0]} ${t.className} 후보" aria-pressed="${i===0}"></button><div class="gm-selected-wreath" id="gmSelection${i}" data-i="${i}" aria-hidden="true" hidden><span>❧</span><b>선택</b><span>❧</span></div><div class="gm-vacant" id="gmVacant${i}" data-i="${i}" hidden><span class="gm-vacant-badge">✦ 판매 완료 ✦</span><strong>빈 단상</strong><small>신규 후보를 갱신하세요</small></div><div class="gm-card-dynamic" data-i="${i}" id="gmPanel${i}" hidden></div>`).join('')}
  <div class="gm-wallet-value" id="gmWallet" hidden></div>
  <div class="gm-bottom-avatar" id="gmPortraitWrap" hidden><canvas id="gmPortrait" width="120" height="123" aria-hidden="true"></canvas></div>
  <div class="gm-bottom-info" id="gmBottomInfo" hidden></div>
  <div class="gm-price-value" id="gmPrice" hidden></div>
  <div class="gm-no-candidates" id="gmNoCandidates" hidden>검투사 모집 완료<br><small>빈 단상을 갱신하세요</small></div>
  <div class="gm-speech-new" id="gmSpeech" hidden role="status" aria-live="polite"></div>
  <div class="gm-merchant-talk" id="gmTalking" aria-hidden="true"></div>
  <div class="gm-reaction-badge" id="gmReactionBadge" hidden aria-hidden="true"><img id="gmReactionFace" src="assets/market/merchant_pose_0.webp" alt=""></div>
  <button type="button" class="gm-hire-hit" id="gmHire" aria-label="선택한 검투사 구매 확인"></button>
  <button type="button" class="gm-restock" id="gmRestock">✥ 후보 갱신 <span id="gmRestockCount">0자리</span><small>◉ ${RESTOCK_COST} D</small></button>
  <div class="gm-dialog" id="gmDialog" data-mode="confirm" hidden role="dialog" aria-modal="true" aria-label="검투사 구매 계약 확인">
   <div class="gm-dialog-merchant"><img id="gmMerchantExpression" src="assets/market/merchant_pose_0.webp" alt="시장 상인이 말을 건넵니다"></div>
   <div class="gm-dialog-content"><div class="gm-dialog-eyebrow">MERCATUS · 계약 확인</div><h2 id="gmDialogHeading">검투사 고용 계약</h2><p id="gmDialogBody"></p><small id="gmDialogDetail"></small><div class="gm-dialog-buttons"><button id="gmCancel" type="button">취소하기</button><button id="gmConfirm" type="button">고용 확정</button></div></div>
  </div>
  <div class="gm-orient" aria-hidden="true">가로 화면에서 시장을 더 크게 볼 수 있습니다.</div>
 </div>`;
 document.body.appendChild(scene);stage=$('#gmStage');
 window.addEventListener('resize',fit,{passive:true});document.addEventListener('keydown',keydown);
 $('#gmKey').addEventListener('load',e=>{keyImg=e.target;const o=selection<0?null:inventory()[selection];drawPortrait(o);});
 $('#gmBack').addEventListener('click',close);$('#gmHire').addEventListener('click',askPurchase);
 $('#gmRestock').addEventListener('click',restock);$('#gmCancel').addEventListener('click',cancel);$('#gmConfirm').addEventListener('click',confirm);
 for(let i=0;i<3;i++)$('#gmCard'+i).addEventListener('click',()=>{if(mode!=='idle'||!inventory()[i])return;selection=i;render();reaction(inventory()[i].name+'! '+merchantLines.select,'select');});
 fit();
}
function open(options){opts=options;setup();
 // Preserve prior careers; an untouched new Ludus begins with the concept-art starting wallet.
 if((!opts.state.roster||opts.state.roster.length===0)&&(Number(opts.state.fights)||0)===0&&Number(opts.state.gold)<500){opts.state.gold=3200;opts.save?.();}
 ensureInventory();selection=pick(0);mode='idle';$('#gmDialog').hidden=true;
 scene.hidden=false;fit();render();
}
root.SlaveMarket={open,close,refresh:render};
if(typeof module!=='undefined')module.exports={types,newOffer,RESTOCK_COST};
})(globalThis);