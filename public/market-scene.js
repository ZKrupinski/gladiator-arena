/* GLADIATOR / MERCATUS : v4.9 interactive transaction layer on approved 1672x941 key art. */
(function(root){
'use strict';
const WIDTH=1672, HEIGHT=941, RESTOCK_COST=60, PAGE_SIZE=3;
const types=[
 {id:'thraex',className:'트라엑스',names:['Cassius','Decimus','Aulus','Titus','Felix','Flavius'],base:[2,5,2,2],cost:500,desc:'민첩한 움직임과 빠른 공격이 특징인 트라엑스입니다. 날카로운 시카로 적의 허점을 노립니다.',face:[550,258,158,146]},
 {id:'murmillo',className:'무르밀로',names:['Lucius','Marcus','Brutus','Gaius','Publius','Tiberius'],base:[5,3,5,3],cost:500,desc:'견고한 방패와 단검으로 전선을 지키는 강인한 무르밀로입니다. 안정적인 방어에 능합니다.',face:[856,255,163,151]},
 {id:'retiarius',className:'레티아리우스',names:['Marcellus','Quintus','Nero','Sextus','Julius','Valerius'],base:[2,4,1,5],cost:500,desc:'그물과 삼지창으로 원거리를 장악하는 레티아리우스입니다. 높은 기술과 넓은 사거리를 가집니다.',face:[1244,264,176,150]}
];
// Every playable human appearance has one permanent sale slot. Beasts and NPCs never enter this catalog.
const MARKET_LOOKS=Object.freeze([
 ...[
  ['murmillo','murmillo_a','무르밀로 A'],
  ['thraex','thraex_a','트라엑스 A'],
  ['thraex','thraex_b','트라엑스 B'],
  ['retiarius','retiarius_a','레티아리우스 A']
 ].flatMap(([cls,family,name])=>Array.from({length:5},(_,i)=>({
  cls,visualId:family+'_L'+(i+1),growthType:family,label:name+' · 외형 '+(i+1),appearance:null,special:false
 }))),
 {cls:'murmillo',visualId:'murmillo_champion_red',appearance:'murmillo_champion_red',label:'붉은 투구 챔피언',special:true},
 {cls:'murmillo',visualId:'murmillo_redcrest_new_v1',appearance:'murmillo_redcrest_new_v1',label:'신규 붉은투구 무르밀로',special:true},
 {cls:'murmillo',visualId:'murmillo_redcrest_alt_v1',appearance:'murmillo_redcrest_alt_v1',label:'레드크레스트 II',special:true},
 {cls:'murmillo',visualId:'murmillo_motion_v3',appearance:'murmillo_motion_v3',label:'모션 무르밀로',special:true},
 ...['murmillo','thraex','retiarius'].map(cls=>({cls,visualId:'legacy_'+cls,appearance:'legacy',label:'클래식 '+(cls==='murmillo'?'무르밀로':cls==='thraex'?'트라엑스':'레티아리우스'),special:true}))
]);
const PAGE_COUNT=Math.ceil(MARKET_LOOKS.length/PAGE_SIZE);
const labels=[['STR','#ff5554','#bc2223','✊'],['AGI','#66f36e','#238f39','♞'],['END','#f4bf6a','#9e702a','♥'],['FOC','#a66afa','#6028bd','✥'],['DEF','#5796ff','#274cc2','⬟']];
const merchantLines={hello:'좋은 검투사가 필요하신가요? 방금 들어온 유망한 후보들입니다!',select:'훈련만 잘 시킨다면 훌륭한 투사가 될 겁니다!',confirm:'정말 이 검투사를 영입하시겠습니까? 데나리우스를 지불하면 거래가 성사됩니다.',cancel:'마음이 바뀌셨습니까? 다른 후보도 살펴보시지요.',success:'하하하! 안목이 훌륭하시군요! 이 검투사는 이제 당신의 루두스 소속입니다!',poor:'금화가 부족하다니 아쉽군요. 시합에서 승리하고 다시 방문하세요.',empty:'모든 단상이 비었습니다! 후보 갱신으로 새로운 검투사를 불러오십시오.',refresh:'새로운 후보들이 단상에 올랐습니다! 천천히 살펴보시지요.'};
let scene=null,stage=null,opts=null,selection=0,page=0,keyImg=null,mode='idle',dialogOffer=null;
let speechReset=null,animateTimer=null,moodTimer=null,previousFocus=null;
let sceneEpoch=0,bootTimeout=0;
const merchantFrames=Array.from({length:4},(_,n)=>{const im=new Image();im.src='assets/market/merchant_pose_'+n+'.webp';return im;});
const $=s=>scene?.querySelector(s);
const clean=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// The market is an independent pool. None of its offers carries a bossId,
// champion-only appearance, arena unlock, or any beast identity.
// The slave market uses historically styled Roman praenomen + nomen.
 // Never rename hired gladiators; only unpurchased market offers are normalized.
const ROMAN_PRAENOMINA=Object.freeze([
 'Marcus','Lucius','Gaius','Publius','Quintus','Titus','Sextus','Aulus',
 'Decimus','Tiberius','Gnaeus','Servius','Appius','Numerius','Spurius'
]);
const ROMAN_NOMINA=Object.freeze([
 'Aurelius','Valerius','Julius','Cornelius','Cassius','Claudius',
 'Flavius','Tullius','Manlius','Aemilius','Fabius','Pompeius',
 'Octavius','Licinius','Domitius','Antonius','Calpurnius','Junius',
 'Vibius','Sulpicius','Caecilius','Sempronius','Marcius','Papirius',
 'Plautius','Sergius','Terentius','Atilius','Quinctius','Porcius',
 'Livius','Flaminius','Hostilius','Lucretius','Minucius','Servilius',
 'Petronius','Vitellius','Scribonius','Volumnius','Fabritius','Vettius'
]);
const ROMAN_FIRST_SET=new Set(ROMAN_PRAENOMINA);
const ROMAN_FAMILY_SET=new Set(ROMAN_NOMINA);
function stableNameRoll(identity){
 const text=String(identity||'');let hash=2166136261;
 for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619)>>>0;
 return hash/4294967296;
}
function isRomanFullName(name){
 const p=String(name||'').trim().split(/\s+/);
 return p.length===2&&ROMAN_FIRST_SET.has(p[0])&&ROMAN_FAMILY_SET.has(p[1]);
}
function romanName(previous,usedNames,rng=Math.random){
 const prior=String(previous||'').trim();
 if(isRomanFullName(prior)&&!usedNames.has(prior.toLowerCase())){
  usedNames.add(prior.toLowerCase());return prior;
 }
 const first=ROMAN_FIRST_SET.has(prior)?ROMAN_PRAENOMINA.indexOf(prior):Math.floor(rng()*ROMAN_PRAENOMINA.length)%ROMAN_PRAENOMINA.length;
 const family=ROMAN_FAMILY_SET.has(prior)?ROMAN_NOMINA.indexOf(prior):Math.floor(rng()*ROMAN_NOMINA.length)%ROMAN_NOMINA.length;
 const total=ROMAN_PRAENOMINA.length*ROMAN_NOMINA.length;
 for(let i=0;i<total;i++){
  const candidate=ROMAN_PRAENOMINA[(first+i)%ROMAN_PRAENOMINA.length]+' '+
   ROMAN_NOMINA[(family+Math.floor(i/ROMAN_PRAENOMINA.length))%ROMAN_NOMINA.length];
  if(!usedNames.has(candidate.toLowerCase())){usedNames.add(candidate.toLowerCase());return candidate;}
 }
 throw new Error('Roman market name pool exhausted');
}
const qualities={
 common:{label:'일반',bonus:0,min:320,range:340},
 promising:{label:'유망주',bonus:1,min:610,range:410},
 veteran:{label:'숙련',bonus:2,min:1240,range:830},
 rare:{label:'희귀 특수',bonus:3,min:5300,range:3500}
};
const traits=['강철 수비','빠른 반격','강인한 투지','정교한 무기술','뛰어난 체력','전광석화'];
const randIndex=(rng,n)=>Math.min(n-1,Math.max(0,Math.floor(rng()*n)));
const numberFrom=(v,defaultValue=0)=>Number.isFinite(Number(v))?Number(v):defaultValue;
function newOffer(slot,seed,usedNames=new Set(),usedClasses=[],rng=Math.random,forcedLook=null){
 const candidateClasses=usedClasses.length>=2&&usedClasses.every(x=>x===usedClasses[0])
  ?types.filter(t=>t.id!==usedClasses[0]):types;
 const t=forcedLook?types.find(t=>t.id===forcedLook.cls):candidateClasses[randIndex(rng,candidateClasses.length)];
 if(!t)throw new Error('Unknown human gladiator class in market look');
 // Spread Roman family names across the 27 offers even with a fixed QA RNG.
 const name=romanName(null,usedNames,()=>stableNameRoll('offer|'+seed+'|'+slot+'|'+(forcedLook?.visualId||t.id)));
 usedClasses.push(t.id);
 const roll=rng();
 // A rare market-born special: 0.6% per individual lot (~1.8%/visit).
 // It is NOT any boss-only gladiator; all sprites use regular growth art.
 const quality=forcedLook?.special?'rare':roll<.006?'rare':roll<.096?'veteran':roll<.35?'promising':'common';
 const q=qualities[quality],trait=traits[randIndex(rng,traits.length)];
 // Human gladiator visuals: 4 growth silhouettes x 5 grades, historical
 // legacy boss looks, motion Murmillo and red-plume champion; NEVER beasts.
 const families={murmillo:['murmillo_a'],thraex:['thraex_a','thraex_b'],retiarius:['retiarius_a']};
 const options=families[t.id]||[t.id+'_a'];
 let growthType=options[randIndex(rng,options.length)];
 const usedVisuals=usedNames.usedVisuals||(usedNames.usedVisuals=new Set());
 const picks=[1,2,3,4,5].map(n=>growthType+'_L'+n).filter(id=>!usedVisuals.has(id));
 let visualId=picks.length?picks[randIndex(rng,picks.length)]:growthType+'_L'+(1+randIndex(rng,5));
 let appearance=null,visualLabel='외형 '+(growthType.endsWith('_b')?'B-':'A-')+visualId.slice(-1);
 const kind=rng();
 if(quality==='rare'&&t.id==='murmillo'&&kind<.78){
  appearance=kind<.26?'murmillo_champion_red':kind<.52?'murmillo_motion_v3':'murmillo_redcrest_alt_v1';
  visualId=appearance;
  visualLabel=appearance==='murmillo_champion_red'?'붉은 투구 챔피언':appearance==='murmillo_redcrest_alt_v1'?'레드크레스트 II':'모션 정예';
 }else if((quality==='rare'&&kind<.86)||(quality==='veteran'&&kind<.13)){
  appearance='legacy';visualId='legacy_'+t.id;visualLabel='클래식 챔피언';
 }
 // Fixed look identity takes priority over random variant rolls.
 if(forcedLook){
  growthType=forcedLook.growthType||t.id+'_a';
  visualId=forcedLook.visualId;
  appearance=forcedLook.appearance;
  visualLabel=forcedLook.label;
 }
 usedVisuals.add(visualId);
 const primary=randIndex(rng,4);
 const weakness=(primary+1+randIndex(rng,3))%4;
 const statKeys=['str','agi','end','focus'],statNames=['근력','민첩','체력','집중'];
 const aptitudes={};
 for(let i=0;i<4;i++){
  const value=i===primary?1.30+randIndex(rng,6)*.04:
   i===weakness?.67+randIndex(rng,5)*.04:.90+randIndex(rng,7)*.04;
  aptitudes[statKeys[i]]=+value.toFixed(2);
 }
 const innateSummary=statNames[primary]+' ×'+aptitudes[statKeys[primary]].toFixed(2)+
  ' / '+statNames[weakness]+' ×'+aptitudes[statKeys[weakness]].toFixed(2);
 const vals=t.base.map((base,i)=>{
  const variance=randIndex(rng,3)-1;
  const improved=q.bonus+(i===primary?(quality==='rare'?2:quality==='veteran'?1:0):0);
  return Math.max(1,Math.min(9,base+variance+improved));
 });
 const defense=Math.max(1,Math.min(9,(t.id==='murmillo'?5:3)+q.bonus+randIndex(rng,5)-2));
 aptitudes.def=+(.70+randIndex(rng,21)*.04).toFixed(2);
 const cost=Math.round((q.min+randIndex(rng,q.range+1))/10)*10;
 const premium=
  (appearance==='legacy'?850:appearance==='murmillo_motion_v3'?2600:
   appearance==='murmillo_champion_red'?3600:appearance==='murmillo_redcrest_alt_v1'?2800:appearance==='murmillo_redcrest_new_v1'?3000:0);
 return {id:t.id,className:t.className,name,vals,defense,cost:cost+premium,aptitudes,innateSummary,
  desc:t.desc+' '+(quality==='rare'?'매우 드문 고급 검투사. ':quality==='veteran'?'실전 경험이 풍부한 숙련자. ':'')+
   '특기: '+trait+'.',
  face:t.face,quality,trait,growthType,visualId,appearance,visualLabel,
  marketOrigin:'mercatus',marketLot:Math.trunc(numberFrom(seed))};
}
function makeStock(state,rng=Math.random,existing=[]){
 const slots=Array(MARKET_LOOKS.length).fill(null);
 const usedNames=new Set((state.roster||[]).map(h=>String(h.name||'').toLowerCase()).filter(Boolean));
 const usedClasses=[];
 const old=Array.isArray(existing)?existing:[];
 // Upgrade the old three-offer save without discarding unsold fighters.
 // Match by unique art ID, not by randomly assigned class or podium index.
 for(const offer of old){
  if(!offer||!types.some(t=>t.id===offer.id))continue;
  const key=offer.visualId||(offer.appearance==='legacy'?'legacy_'+offer.id:offer.appearance);
  const position=MARKET_LOOKS.findIndex(look=>look.cls===offer.id&&look.visualId===key);
  if(position<0||slots[position])continue;
  const look=MARKET_LOOKS[position];
  const name=romanName(offer.name,usedNames,()=>stableNameRoll(look.visualId+'|'+(offer.name||'')));
  slots[position]={...offer,name,visualId:look.visualId,appearance:look.appearance,
   growthType:look.growthType||offer.growthType||look.cls+'_a',visualLabel:look.label};
  usedClasses.push(offer.id);
 }
 for(let i=0;i<MARKET_LOOKS.length;i++){
  if(slots[i])continue;
  slots[i]=newOffer(i,state.marketSeed,usedNames,usedClasses,rng,MARKET_LOOKS[i]);
 }
 return slots;
}
function ensureInventory(){
 const state=opts.state;
 if(!Array.isArray(state.marketInventory)||state.marketInventory.length!==MARKET_LOOKS.length){
  state.marketInventory=makeStock(state,Math.random,state.marketInventory);opts.save?.();
 }else{
  let converted=false;
  const usedNames=new Set((state.roster||[]).map(h=>String(h.name||'').trim().toLowerCase()).filter(Boolean));
  for(let i=0;i<state.marketInventory.length;i++){
   const h=state.marketInventory[i];if(!h)continue;
   const look=MARKET_LOOKS[i];
   if(h.visualId!==look.visualId||h.appearance!==look.appearance){
    // Repair only the sale slot's visual mapping; keep its name, price and stats.
    h.visualId=look.visualId;h.appearance=look.appearance;h.growthType=look.growthType||h.growthType;
    converted=true;
   }
   if(h.visualLabel!==look.label){h.visualLabel=look.label;converted=true;}
   // Rename only unpurchased, previously saved single-token offers.
   const updated=romanName(h.name,usedNames,()=>stableNameRoll(look.visualId+'|'+(h.name||'')));
   if(h.name!==updated){h.name=updated;converted=true;}
  }
  if(converted)opts.save?.();
 }
 return state.marketInventory;
}
function inventory(){return ensureInventory();}
function available(){return inventory().map((o,i)=>o?i:-1).filter(i=>i>=0);}
function visibleAvailable(){return available().filter(i=>Math.floor(i/PAGE_SIZE)===page);}
function pick(preferred){const live=visibleAvailable();return live.includes(preferred)?preferred:live[0]??-1;}
function changePage(direction){
 if(mode!=='idle')return;
 const next=Math.max(0,Math.min(PAGE_COUNT-1,page+direction));
 if(next===page)return;
 page=next;selection=pick(page*PAGE_SIZE);render();
 reaction('검투사 외형 '+(page+1)+' / '+PAGE_COUNT+' · '+merchantLines.select,'select',2600);
}
function fit(){if(!stage)return;const z=Math.min(innerWidth/WIDTH,innerHeight/HEIGHT);stage.style.transform=`translate(-50%,-50%) scale(${z})`;}
function getHeroArtwork(h){if(!h)return null;const art=opts?.getSprite?.(h.id,h);return art&&art.width&&art.height?art:null;}
function drawPortrait(h){
 const c=$('#gmPortrait');if(!c||c.parentElement.hidden||!h)return;
 const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
 const image=getHeroArtwork(h);
 if(image){
  // Frame the head and torso instead of shrinking the entire fighter to a
  // thumbnail. Determine the actual nontransparent silhouette dynamically.
  const tmp=document.createElement('canvas');tmp.width=image.width;tmp.height=image.height;
  const off=tmp.getContext('2d',{willReadFrequently:true});off.drawImage(image,0,0);
  const data=off.getImageData(0,0,tmp.width,tmp.height).data;
  let l=tmp.width,t=tmp.height,r=0,b=0;
  for(let y=0;y<tmp.height;y+=2)for(let x=0;x<tmp.width;x+=2){
   if(data[(y*tmp.width+x)*4+3]>18){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
  }
  if(r>l&&b>t){
   const width=Math.max(1,r-l+2),height=Math.min(b-t+2,Math.max(75,width*.95));
   const k=Math.min((c.width-9)/width,(c.height-9)/height);
   const dw=width*k,dh=height*k;
   ctx.drawImage(image,l,t,width,height,(c.width-dw)/2,(c.height-dh)/2,dw,dh);
  }else{
   const k=Math.min(c.width/image.width,c.height/image.height);
   ctx.drawImage(image,0,0,image.width*k,image.height*k);
  }
 }else if(keyImg?.complete&&keyImg.naturalWidth){
  const [x,y,w,ht]=h.face;ctx.drawImage(keyImg,x,y,w,ht,0,0,c.width,c.height);
 }
}
function drawMarketFigure(i,hero){
 const canvas=$('#gmVisual'+i),soft=$('#gmSoft'+i);
 if(!canvas||!soft)return;
 const art=hero&&getHeroArtwork(hero);
 canvas.hidden=soft.hidden=!art;
 if(!art)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 ctx.clearRect(0,0,canvas.width,canvas.height);
 const inset=17,scale=Math.min((canvas.width-2*inset)/art.width,(canvas.height-2*inset)/art.height);
 if(!(scale>0))return;
 const w=art.width*scale,h=art.height*scale;
 try{ctx.drawImage(art,(canvas.width-w)/2,canvas.height-h-inset,w,h);}catch(_){}
}
function overlayPanel(hero,i,visible){const el=$('#gmPanel'+i);el.hidden=!visible;if(!visible)return;
 const q=qualities[hero.quality]||qualities.common;
 el.classList.toggle('gm-rare-panel',hero.quality==='rare');
 el.innerHTML=`<div class="gm-roman-name${hero.name.length>17?' is-long':''}">${clean(hero.name)}</div><div class="gm-class">${clean(hero.className)} · ${q.label} · ${clean(hero.visualLabel||'성장형')}</div><div class="gm-innate">${clean(hero.innateSummary||'성장 적성 · 보통')}</div><div class="gm-lv">Lv.0</div>`+
 [...hero.vals,hero.defense??hero.vals[2]].map((n,j)=>`<div class="gm-stat"><span class="gm-stat-name"><b style="color:${labels[j][1]}">${labels[j][3]}</b>${labels[j][0]}</span><span class="gm-stat-track"><i style="--value:${Math.min(100,n*12)}%;--color:${labels[j][1]};--shade:${labels[j][2]}"></i></span></div>`).join('');
}
function render(){if(!scene||scene.hidden)return;
 const list=inventory(),state=opts.state;selection=pick(selection);
 const wallet=$('#gmWallet');wallet.hidden=false;
 const balanceText=Math.max(0,Number(state.gold)||0).toLocaleString('ko-KR');
 const amount=wallet.querySelector('.gm-wallet-amount');
 amount.textContent=balanceText;
 amount.classList.toggle('is-compact',balanceText.length>8);
 for(let i=0;i<PAGE_SIZE;i++){
  const absolute=page*PAGE_SIZE+i;
  const h=list[absolute],btn=$('#gmCard'+i),sold=$('#gmVacant'+i),selected=(absolute===selection&&!!h);
  btn.disabled=!h;btn.setAttribute('aria-pressed',String(selected));
  btn.setAttribute('aria-label',h?h.name+' '+h.className+' Lv.0 선택':'판매 완료 · 비어 있는 단상');
  sold.hidden=!!h;
  // Keep the approved background painting untouched while a lot is occupied.
  // The curtain only covers already-sold painted fighters on empty podiums.
  // The selected offer's accurate class/appearance is shown in the detail portrait.
  $('#gmEmpty'+i).hidden=!!h;
  drawMarketFigure(i,h);
  const qualityFlag=$('#gmRare'+i);qualityFlag.hidden=!h||h.quality!=='rare';
  overlayPanel(h,i,!!h);
  $('#gmSelection'+i).hidden=!selected;
 }
 const hero=selection<0?null:list[selection],detail=$('#gmBottomInfo'),avatar=$('#gmPortraitWrap');
 // Never trust the screenshot-baked Cassius card: all three recruits must
 // always use the selected offer's portrait, class, price and description.
 detail.hidden=avatar.hidden=!hero;
 if(hero){
  const quality=qualities[hero.quality]||qualities.common;
  detail.innerHTML=`<h2>${clean(hero.name)}</h2><div class="gm-appearance">${clean(hero.className)} · ${clean(hero.visualLabel||'성장형')}</div><div class="gm-level"><strong>Lv.0 · ${quality.label}</strong><span>◉ ${Number(hero.cost).toLocaleString('ko-KR')} D</span></div><p>${clean(hero.innateSummary||hero.desc)} · ${clean(hero.trait||'고유 적성')}</p>`;
  drawPortrait(hero);
 }
 const hire=$('#gmHire'),price=$('#gmPrice');hire.disabled=!hero||Number(state.gold)<hero.cost;
 hire.setAttribute('aria-label',hero?hero.name+' 구매 확인, '+hero.cost+' 데나리우스':'구매 가능한 검투사가 없습니다');
 price.hidden=!hero;price.textContent=hero?'◉ '+Number(hero.cost).toLocaleString('ko-KR')+' D':'';
 $('#gmNoCandidates').hidden=!!hero;
 $('#gmPageStatus').textContent=(page+1)+' / '+PAGE_COUNT+' · 전체 '+MARKET_LOOKS.length+'종';
 $('#gmPrevPage').disabled=page===0;
 $('#gmNextPage').disabled=page===PAGE_COUNT-1;
 const restock=$('#gmRestock');restock.disabled=Number(state.gold)<RESTOCK_COST;
 restock.setAttribute('aria-label','검투사 외형 '+MARKET_LOOKS.length+'종 전체 갱신. 비용 '+RESTOCK_COST+' 데나리우스');
 $('#gmRestockCount').textContent=MARKET_LOOKS.length+'종 전체';
}
function face(pose){
 if(pose===2)pose=1;
 // One actor at the full-sized merchant position, not a floating reaction thumbnail.
 const actor=$('#gmMerchantMain');if(!actor)return;
 actor.className='gm-merchant-full gm-pose-'+pose+(actor.classList.contains('is-speaking')?' is-speaking':'');
 const src=merchantFrames[pose]?.src;
 if(src&&actor.src!==src)actor.src=src;
}
function reaction(line,mood='select',duration=4800){
 clearTimeout(speechReset);clearInterval(animateTimer);clearTimeout(moodTimer);
 const text=$('#gmSpeech'),glow=$('#gmTalking'),actor=$('#gmMerchantMain');
 text.hidden=false;text.textContent=line;glow.classList.add('active');
 actor?.classList.add('is-speaking');
 // Never play the double-outstretched-arm frame 2: its right hand would
 // cover the first auction podium and would be chopped by stage edges.
 // Reactions use arm-at-waist (0), single-hand greeting (1), calm hand (3).
 const poses={hello:[1,0],select:[0,1],confirm:[1,0],cancel:[3],success:[1,3,1],poor:[3],empty:[3,0],refresh:[3,1]};
 const frames=poses[mood]||poses.select;let index=0;face(frames[0]);
 if(frames.length>1)animateTimer=setInterval(()=>{index=(index+1)%frames.length;face(frames[index]);},490);
 speechReset=setTimeout(()=>{
  text.hidden=false;glow.classList.remove('active');clearInterval(animateTimer);
  face(1);$('#gmMerchantMain')?.classList.remove('is-speaking');
 },duration);
}
function hideDialog(){const modal=$('#gmDialog');modal.hidden=true;dialogOffer=null;mode='idle';previousFocus?.focus?.();previousFocus=null;}
function askPurchase(){if(mode!=='idle')return;const hero=selection>=0?inventory()[selection]:null;
 if(!hero){reaction(merchantLines.empty,'empty');return;}
 if(Number(opts.state.gold)<hero.cost){reaction(merchantLines.poor,'poor');return;}
 mode='confirm';dialogOffer={slot:selection,hero};previousFocus=document.activeElement;
 const modal=$('#gmDialog');modal.hidden=false;modal.dataset.mode='confirm';
 $('#gmDialogHeading').textContent='검투사 고용 계약';
 $('#gmDialogBody').textContent=hero.name+' · '+hero.className+'을(를) '+hero.cost+' 데나리우스에 고용하시겠습니까?';
 $('#gmDialogDetail').textContent=(hero.quality==='rare'?'희귀 특수 검투사 · 높은 가격과 강화된 기본 능력. ':'')+'고용하면 데나리우스가 차감되고, 루두스에 Lv.1로 등록됩니다.';
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
 $('#gmDialogDetail').textContent='구매한 자리는 비어 있습니다. 다른 페이지의 검투사도 확인할 수 있으며, 60D를 지불하면 전체 후보가 갱신됩니다.';
 $('#gmConfirm').textContent='LUDUS로 이동';$('#gmCancel').textContent='시장 계속 보기';
 reaction(merchantLines.success,'success',8800);$('#gmConfirm').focus();
}
function restock(){
 if(mode!=='idle')return;
 const state=opts.state;
 if(Number(state.gold)<RESTOCK_COST){
  reaction('검투사 전체 후보를 갱신할 '+RESTOCK_COST+' 데나리우스가 부족합니다.','poor');return;
 }
 // A single paid click replaces all 27 human appearances, regardless of purchase status.
 state.gold-=RESTOCK_COST;
 state.marketSeed=Math.max(0,Math.trunc(numberFrom(state.marketSeed)))+1;
 state.marketInventory=makeStock(state);
 selection=pick(page*PAGE_SIZE);opts.save?.();render();reaction(merchantLines.refresh,'refresh');
}
function close(){if(!scene)return;sceneEpoch++;clearTimeout(bootTimeout);scene.classList.remove('gm-display-ready','gm-art-error');if(mode==='confirm')cancel();if(mode==='success')hideDialog();scene.hidden=true;clearTimeout(speechReset);clearTimeout(moodTimer);clearInterval(animateTimer);face(1);opts?.onExit?.();}
function keydown(e){if(!scene||scene.hidden)return;
 if(e.key==='Escape'){e.preventDefault();if(mode==='confirm'||mode==='success')cancel();else close();return;}
 if(mode!=='idle'){
  if(e.key==='Tab'){e.preventDefault();const confirm=$('#gmConfirm'),cancel=$('#gmCancel');(document.activeElement===confirm?cancel:confirm).focus();}
  e.stopPropagation();return;
 }
 if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
  e.preventDefault();const live=visibleAvailable();if(!live.length)return;
  const x=live.indexOf(selection);selection=live[(x+(e.key==='ArrowRight'?1:live.length-1))%live.length];render();reaction(inventory()[selection].name+'! '+merchantLines.select,'select');
 }
 if(e.key==='PageDown'||e.key==='PageUp'){e.preventDefault();changePage(e.key==='PageDown'?1:-1);}
}
function setup(){if(scene)return;
 scene=document.createElement('section');scene.className='gm-screen';scene.id='slaveMarket';scene.hidden=true;scene.setAttribute('role','dialog');scene.setAttribute('aria-label','검투사시장');
 scene.innerHTML=`<div class="gm-stage" id="gmStage">
  <img class="gm-key-art" id="gmKey" src="assets/market/market_blank_v68.webp" alt="" aria-hidden="true" decoding="sync" draggable="false">
  <img class="gm-merchant-full gm-pose-1" id="gmMerchantMain" src="assets/market/merchant_pose_1.webp" alt="" aria-hidden="true" draggable="false">
  <div class="gm-paper-foreground" aria-hidden="true"></div>
  <nav class="gm-appearance-nav" aria-label="검투사 27종 페이지">
   <button type="button" id="gmPrevPage" aria-label="이전 검투사 외형 3종">❮ 이전 3종</button>
   <span id="gmPageStatus" role="status" aria-live="polite"></span>
   <button type="button" id="gmNextPage" aria-label="다음 검투사 외형 3종">다음 3종 ❯</button>
  </nav>
  <button type="button" class="gm-back-hit" id="gmBack" aria-label="루두스로 돌아가기" title="루두스로 돌아가기"></button>
  ${types.map((t,i)=>`<button type="button" class="gm-card-hit" data-i="${i}" id="gmCard${i}" aria-label="매물 ${i+1} 선택" aria-pressed="${i===0}"></button><div class="gm-empty-podium" id="gmEmpty${i}" data-i="${i}" aria-hidden="true"></div><div class="gm-visual-softener" id="gmSoft${i}" data-i="${i}" hidden aria-hidden="true"></div><canvas class="gm-visual-character" id="gmVisual${i}" data-i="${i}" width="340" height="290" hidden aria-hidden="true"></canvas><span class="gm-rare-marker" id="gmRare${i}" data-i="${i}" hidden aria-hidden="true">✦ RARVS · 희귀 특수 ✦</span><div class="gm-selected-wreath" id="gmSelection${i}" data-i="${i}" aria-hidden="true" hidden><span>❧</span><b>선택</b><span>❧</span></div><div class="gm-vacant" id="gmVacant${i}" data-i="${i}" hidden><span class="gm-vacant-badge">✦ 판매 완료 ✦</span><strong>빈 단상</strong><small>신규 후보를 갱신하세요</small></div><div class="gm-card-dynamic" data-i="${i}" id="gmPanel${i}" hidden></div>`).join('')}
  <div class="gm-wallet-legacy-mask" aria-hidden="true"></div>
  <div class="gm-wallet-value" id="gmWallet" role="status" aria-label="남은 잔고">
   <span class="gm-wallet-label">◉ 남은 잔고</span>
   <strong class="gm-wallet-amount">0</strong>
   <span class="gm-wallet-unit">D</span>
  </div>
  <div class="gm-bottom-avatar" id="gmPortraitWrap" hidden><canvas id="gmPortrait" width="120" height="123" aria-hidden="true"></canvas></div>
  <div class="gm-bottom-info" id="gmBottomInfo" hidden></div>
  <div class="gm-price-value" id="gmPrice" hidden></div>
  <div class="gm-no-candidates" id="gmNoCandidates" hidden>검투사 모집 완료<br><small>빈 단상을 갱신하세요</small></div>
  <div class="gm-speech-new" id="gmSpeech" hidden role="status" aria-live="polite"></div>
  <div class="gm-merchant-talk" id="gmTalking" aria-hidden="true"></div>
  <button type="button" class="gm-hire-hit" id="gmHire" aria-label="선택한 검투사 구매 확인"><span class="gm-hire-label">고용</span></button>
  <button type="button" class="gm-restock" id="gmRestock">✥ 전체 갱신 <span id="gmRestockCount">3명 전체</span><small>◉ ${RESTOCK_COST} D</small></button>
  <div class="gm-dialog" id="gmDialog" data-mode="confirm" hidden role="dialog" aria-modal="true" aria-label="검투사 구매 계약 확인">
   <div class="gm-dialog-content"><div class="gm-dialog-eyebrow">MERCATUS · 계약 확인</div><h2 id="gmDialogHeading">검투사 고용 계약</h2><p id="gmDialogBody"></p><small id="gmDialogDetail"></small><div class="gm-dialog-buttons"><button id="gmCancel" type="button">취소하기</button><button id="gmConfirm" type="button">고용 확정</button></div></div>
  </div>
  <div class="gm-orient" aria-hidden="true">가로 화면에서 시장을 더 크게 볼 수 있습니다.</div>
 </div>`;
 // The loading veil sits outside the native-size stage. During loading, no
 // temporary merchant cards, currency boxes, buttons or silhouettes are visible.
 const boot=document.createElement('div');boot.className='gm-boot';boot.setAttribute('role','status');
 boot.innerHTML='<span class="gm-boot-message">검투사시장 준비 중…</span><div class="gm-boot-actions"><button type="button" data-retry hidden>다시 불러오기</button><button type="button" data-back>루두스로 돌아가기</button></div>';
 scene.appendChild(boot);
 document.body.appendChild(scene);stage=$('#gmStage');
 boot.querySelector('[data-retry]').addEventListener('click',()=>{
  for(const img of [$('#gmKey'),$('#gmMerchantMain'),...merchantFrames])
   if(img?.complete&&!img.naturalWidth)img.src=img.src.split('?')[0]+'?retry='+Date.now();
  prepareMarket(++sceneEpoch);
 });
 boot.querySelector('[data-back]').addEventListener('click',close);
 window.addEventListener('resize',fit,{passive:true});document.addEventListener('keydown',keydown);
 $('#gmKey').addEventListener('load',e=>{keyImg=e.target;const o=selection<0?null:inventory()[selection];drawPortrait(o);});
 $('#gmBack').textContent='⌂ 루두스 로비';$('#gmBack').setAttribute('aria-label','메인 루두스 로비로 돌아가기');$('#gmBack').addEventListener('click',close);$('#gmHire').addEventListener('click',askPurchase);
 $('#gmRestock').addEventListener('click',restock);$('#gmCancel').addEventListener('click',cancel);$('#gmConfirm').addEventListener('click',confirm);
 $('#gmPrevPage').addEventListener('click',()=>changePage(-1));$('#gmNextPage').addEventListener('click',()=>changePage(1));
 for(let i=0;i<PAGE_SIZE;i++)$('#gmCard'+i).addEventListener('click',()=>{const absolute=page*PAGE_SIZE+i;if(mode!=='idle'||!inventory()[absolute])return;selection=absolute;render();reaction(inventory()[absolute].name+'! '+merchantLines.select,'select');});
 fit();
}
function marketAsset(img){
 return new Promise((resolve,reject)=>{
  if(!img?.src)return reject(new Error('market image missing'));
  const finish=()=>{if(!img.naturalWidth)return reject(new Error('market image failed'));if(typeof img.decode==='function')img.decode().then(resolve,reject);else resolve();};
  if(img.complete){finish();return;}
  img.addEventListener('load',finish,{once:true});
  img.addEventListener('error',()=>reject(new Error('market image load failed')),{once:true});
 });
}
async function prepareMarket(epoch){
 if(!scene||scene.hidden||epoch!==sceneEpoch)return;
 clearTimeout(bootTimeout);
 scene.classList.remove('gm-display-ready','gm-art-error');
 const boot=scene.querySelector('.gm-boot'),actions=boot.querySelector('.gm-boot-actions');
 boot.querySelector('.gm-boot-message').textContent='검투사시장 준비 중…';
 actions.querySelector('[data-retry]').hidden=true;
 try{
  // Approved background + first merchant pose + every active merchant motion.
  // Career sprite atlas preparation is shared with the rest of Ludus.
  let timeoutId;const timeout=new Promise((_,reject)=>{timeoutId=setTimeout(()=>reject(new Error('market asset timeout')),25000);bootTimeout=timeoutId;});
  await Promise.race([Promise.all([
   ...[$('#gmKey'),$('#gmMerchantMain'),...merchantFrames].map(marketAsset),
   Promise.resolve().then(()=>opts?.assetsReady?.())
  ]),timeout]);
  if(scene.hidden||epoch!==sceneEpoch)return;
  fit();render();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(!scene||scene.hidden||epoch!==sceneEpoch)return;
   scene.classList.add('gm-display-ready');
   reaction(available().length?merchantLines.hello:merchantLines.empty,available().length?'hello':'empty',5400);
  }));
 }catch(error){
  if(scene.hidden||epoch!==sceneEpoch)return;
  console.warn('Market art readiness failed',error);
  scene.classList.add('gm-art-error');
  boot.querySelector('.gm-boot-message').textContent='시장 그래픽을 준비하지 못했습니다.';
  actions.querySelector('[data-retry]').hidden=false;
 }finally{clearTimeout(timeoutId);if(bootTimeout===timeoutId)bootTimeout=0;}
}
function open(options){opts=options;setup();
 // Preserve prior careers; an untouched new Ludus begins with the concept-art starting wallet.
 if((!opts.state.roster||opts.state.roster.length===0)&&(Number(opts.state.fights)||0)===0&&Number(opts.state.gold)<500){opts.state.gold=3200;opts.save?.();}
 if(scene&&!scene.hidden)return;
 ensureInventory();page=0;selection=pick(0);mode='idle';$('#gmDialog').hidden=true;
 scene.hidden=false;scene.classList.remove('gm-display-ready','gm-art-error');fit();render();prepareMarket(++sceneEpoch);
}
root.SlaveMarket={open,close,refresh:render};
if(typeof module!=='undefined')module.exports={types,newOffer,makeStock,MARKET_LOOKS,PAGE_SIZE,PAGE_COUNT,qualities,RESTOCK_COST,romanName,isRomanFullName,ROMAN_PRAENOMINA,ROMAN_NOMINA};
})(globalThis);