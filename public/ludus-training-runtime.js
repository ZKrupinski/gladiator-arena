/* LUDUS TRAINING v6.4: actual selected gladiator, real stats, action poses.
 * Approved training buttons and Doctore art stay in their original positions.
 * Nothing in the original image is a clickable dummy or a baked-in roster. */
(function(){
'use strict';
const E=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let timer=null,tick=0,current=null,frameIndex=-1;
const names={murmillo:'무르밀로',thraex:'트라엑스',retiarius:'레티아리우스'};
const FRAME_MS=88;
const ACTION_CYCLE=[
 {name:'slash',ticks:12},{name:'sweep',ticks:12},
 {name:'thrust',ticks:11},{name:'heavy',ticks:13}
];
const artBounds=new WeakMap();
function stop(){if(timer!==null){clearInterval(timer);timer=null;}current=null;tick=0;frameIndex=-1;}
function visibleBounds(img){
 if(artBounds.has(img))return artBounds.get(img);
 // Scan a quarter-resolution copy so padded 960×540 champion frames do not
 // turn into tiny fighters or cause full-resolution per-frame readbacks.
 const sample=document.createElement('canvas'),step=4;
 sample.width=Math.max(1,Math.ceil(img.width/step));
 sample.height=Math.max(1,Math.ceil(img.height/step));
 const g=sample.getContext('2d',{willReadFrequently:true});
 let box={x:0,y:0,w:img.width,h:img.height};
 try{
  g.drawImage(img,0,0,sample.width,sample.height);
  const pixels=g.getImageData(0,0,sample.width,sample.height).data;
  let left=sample.width,top=sample.height,right=-1,bottom=-1;
  for(let y=0;y<sample.height;y++)for(let x=0;x<sample.width;x++){
   if(pixels[(y*sample.width+x)*4+3]<72)continue;
   if(x<left)left=x;if(x>right)right=x;if(y<top)top=y;if(y>bottom)bottom=y;
  }
  if(right>=left&&bottom>=top){
   const x=Math.max(0,(left-1)*step),y=Math.max(0,(top-1)*step);
   box={x,y,w:Math.min(img.width,(right+2)*step)-x,
    h:Math.min(img.height,(bottom+2)*step)-y};
  }
 }catch(error){/* A readable on-site bitmap is expected; keep a safe fallback. */}
 artBounds.set(img,box);
 return box;
}
// Portraits in the training roster and Doctore-side information panel are
// separate from the large animated fighter. This function must stay available
// when mount() paints the first selected gladiator.
function paint(canvas,img){
 if(!canvas)return false;
 const ctx=canvas.getContext('2d');if(!ctx)return false;
 ctx.clearRect(0,0,canvas.width,canvas.height);
 if(!img?.width||!img?.height)return false;
 const size=visibleBounds(img);
 const scale=Math.min((canvas.width-8)/Math.max(1,size.w),
                      (canvas.height-7)/Math.max(1,size.h));
 const w=size.w*scale,h=size.h*scale;
 try{
  ctx.drawImage(img,size.x,size.y,size.w,size.h,
    (canvas.width-w)/2,canvas.height-h-3,w,h);
  return true;
 }catch(error){return false;}
}
function paintTrainingFighter(canvas,img,action,progress){
 if(!canvas)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 ctx.clearRect(0,0,canvas.width,canvas.height);
 if(!img?.width||!img?.height)return;
 const box=visibleBounds(img),maxHeight=340,maxWidth=canvas.width-38;
 const scale=Math.min(maxWidth/box.w,maxHeight/box.h);
 const width=box.w*scale,height=box.h*scale;
 const strike=action!=='idle'?Math.sin(Math.PI*progress):0;
 const anticipation=action!=='idle'?Math.sin(Math.PI*Math.min(1,progress*2))*.015:0;
 // Every class faces LEFT toward Doctore. Keep the same planted floor pivot
 // while gently extending into the attack; the strike never shifts the canvas.
 const towardDoctore=(action==='thrust'?15:action==='heavy'?10:8)*strike;
 const lean=(action==='slash'?.055:action==='sweep'?.038:action==='thrust'?.025:.045)*strike-anticipation;
 ctx.save();
 ctx.translate(canvas.width/2-towardDoctore,canvas.height-9);
 ctx.rotate(-lean);
 ctx.scale(-1,1);
 try{ctx.drawImage(img,box.x,box.y,box.w,box.h,-width/2,-height,width,height);}catch(error){}
 ctx.restore();
}
function actionAt(t){
 let at=t%ACTION_CYCLE.reduce((sum,x)=>sum+x.ticks,0);
 for(const part of ACTION_CYCLE){
  if(at<part.ticks){
   const progress=at/Math.max(1,part.ticks-1);
   // One brief guard/reset between attacks, most frames use real strike poses.
   const attacking=progress>=.12&&progress<.89;
   return {action:attacking?part.name:'idle',progress,frame:Math.min(7,Math.floor(progress*8))};
  }
  at-=part.ticks;
 }
 return {action:'idle',progress:0,frame:0};
}
function animate(a,stage,selected){
 stop();
 const canvas=stage.querySelector('.lt-fighter-canvas');
 if(!canvas||selected==null)return;
 const draw=()=>{
  if(!canvas.isConnected){stop();return;}
  const motion=actionAt(tick);
  const src=a.trainingFrame?.(selected,motion.action,motion.frame)||a.portrait(selected);
  paintTrainingFighter(canvas,src,motion.action,motion.progress);
  canvas.dataset.attack=motion.action;
  canvas.dataset.face='left';
  const ribbon=stage.querySelector('.lt-motion-slash');
  if(ribbon){ribbon.classList.toggle('active',motion.action!=='idle');ribbon.dataset.action=motion.action;}
  tick++;
 };
 draw();timer=setInterval(draw,FRAME_MS);
 current=canvas;
}
function mount(stage,a,s,cbs){
 stop();
 const h=s.roster[s.active],stats=h?.stats||{};
 const statsList=[['STR','공격',stats.str||0],['AGI','민첩',stats.agi||0],['END','방어·체력',stats.end||0],['FOCUS','기술',stats.focus||0]];
 const selected=cbs.selectedTraining||0;
 const details=h?'<div class="lt-selected-unit"><canvas width="84" height="91" id="ltInfoPortrait"></canvas>'+
 '<div><strong>'+E(h.name)+'</strong><small>'+E(names[h.cls]||h.cls)+' · Lv.'+(Number(h.level)||1)+'</small>'+
 '<small>경험치 '+Number(h.xp||0)+' · 부상 '+Number(h.injury||0)+'</small></div></div>':
 '<div class="lt-no-unit">검투사시장에 방문해 검투사를 영입하세요.</div>';
 const panel=document.createElement('section');panel.className='lt-info';
 panel.setAttribute('aria-label','선택 검투사의 실제 훈련 정보');
 panel.innerHTML='<h2>선택된 검투사</h2>'+details+
 '<div class="lt-info-head">현재 능력치</div><div class="lt-stat-list">'+statsList.map(([id,n,v])=>
 '<div><span>'+id+' <small>'+n+'</small></span><strong>'+v+'</strong></div>').join('')+'</div>'+
 '<div class="lt-info-head">훈련 효과</div><div class="lt-effect">'+
 '<strong>'+E(cbs.tiles[selected].name)+'</strong>'+
 '<p>'+E(cbs.tiles[selected].help)+'</p>'+
 '<div class="lt-cost"><span>훈련 비용</span><b>◉ 12 D</b></div>'+
 '<div class="lt-cost"><span>보유 금화</span><b>◉ '+Number(s.gold||0).toLocaleString('ko-KR')+' D</b></div></div>'+
 '<div class="lt-guidance">'+(!h?'검투사를 먼저 영입하세요.':Number(s.gold)<12?'금화가 부족합니다.':'아래 훈련 항목을 선택한 뒤 훈련 시작을 누르세요.')+'</div>';
 stage.appendChild(panel);
 if(h)paint(panel.querySelector('#ltInfoPortrait'),a.portrait(s.active));
 const fighter=document.createElement('div');fighter.className='lt-fighter-zone';
 fighter.setAttribute('aria-label',h?h.name+' · 교관을 바라보고 제자리에서 공격 연습 중':'훈련 중인 검투사 없음');
 fighter.innerHTML='<canvas class="lt-fighter-canvas" width="460" height="425"></canvas><div class="lt-motion-slash" aria-hidden="true"></div>';
 stage.appendChild(fighter);
 const roster=document.createElement('section');roster.className='lt-roster';
 roster.innerHTML='<div class="lt-roster-title"><strong>♜ 소속 검투사</strong><span>'+s.roster.length+'명 · 선택 중 '+(s.roster.length?s.active+1:0)+'명</span>'+
 '<div class="lt-step"><button type="button" id="ltPrevious" aria-label="이전 검투사">❮</button><button type="button" id="ltNext" aria-label="다음 검투사">❯</button></div></div>'+
 '<div class="lt-roster-items">'+(s.roster.length?s.roster.map((unit,i)=>
 '<button type="button" data-unit="'+i+'" class="'+(s.active===i?'selected':'')+'" aria-pressed="'+(i===s.active)+'">'+
 '<canvas width="87" height="83" data-portrait="'+i+'"></canvas><strong>'+E(unit.name)+'</strong>'+
 '<small>Lv.'+(Number(unit.level)||1)+'</small></button>').join(''):
 '<div class="lt-empty">소속 검투사 없음 · 검투사시장에서 영입하세요.</div>')+'</div>';
 stage.appendChild(roster);
 roster.querySelectorAll('[data-portrait]').forEach(canvas=>paint(canvas,a.portrait(Number(canvas.dataset.portrait))));
 roster.querySelectorAll('[data-unit]').forEach(button=>button.onclick=()=>cbs.onSelect(Number(button.dataset.unit)));
 roster.querySelector('#ltPrevious').onclick=()=>cbs.move(-1);
 roster.querySelector('#ltNext').onclick=()=>cbs.move(1);
 // Original approved image contains 5 richly painted training tiles and a
 // large '훈련 시작' button. Give each artwork tile one real interactive hitbox.
 const cards=[[153,603,195],[365,603,188],[573,603,198],[784,603,192],[994,603,196]];
 cards.forEach(([x,y,w],i)=>{
  const b=document.createElement('button');
  b.className='lt-tile-button';b.type='button';
  b.style.left=x+'px';b.style.top=y+'px';b.style.width=w+'px';
  b.setAttribute('aria-label',cbs.tiles[i].name);
  b.setAttribute('aria-pressed',String(i===selected));
  b.onclick=()=>cbs.onTrainingChoice(i);
  stage.appendChild(b);
  if(i===selected){const frame=document.createElement('div');frame.className='lt-tile-selected';frame.style.cssText='left:'+x+'px;top:'+y+'px;width:'+w+'px';stage.appendChild(frame);}
 });
 const start=document.createElement('button');start.className='lt-start-button';start.type='button';
 start.style.cssText='left:1243px;top:721px;width:393px;height:154px';
 start.setAttribute('aria-label',cbs.tiles[selected].name+' 훈련 시작');
 start.disabled=!h;
 start.onclick=cbs.onTrain;stage.appendChild(start);
 const home=document.createElement('button');home.className='la-home-nav lt-home';
 home.type='button';home.textContent='⌂ 루두스 로비';
 home.setAttribute('aria-label','메인 루두스 로비로 돌아가기');home.onclick=cbs.onHome;stage.appendChild(home);
 if(h)animate(a,stage,s.active);
}
window.LudusTrainingV2={mount,stop};
})();