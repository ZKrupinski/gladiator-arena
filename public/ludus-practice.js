/* SPARTACUS · EXERCITIVM INFINITVM — simultaneous survival training.
   Reads all fighter art/stats from LudusBridge; awards XP through one Career callback.
   No gold, loot, honor, arena wins, or permanent injuries are written here.
*/
(function(root){'use strict';
const W=1280,H=720,MAX=4,TYPES=['murmillo','thraex','retiarius'];
const COURTS=Object.freeze([{x:335,y:383,scale:.76},{x:945,y:383,scale:.76},
 {x:335,y:608,scale:.98},{x:945,y:608,scale:.98}]);
const LEASH=168;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const number=(x,d=0)=>Number.isFinite(Number(x))?Number(x):d;
const eligible=h=>!!h&&number(h.injury)<80&&number(h.fatigue)<80;
const waveSize=w=>Math.min(12,2+Math.floor((w-1)/2));
const enemyHP=w=>Math.round(43+Math.pow(w,1.09)*13);
const enemyAttack=w=>Math.round(4.3+Math.pow(w,.95)*1.15);
const waveXP=w=>9+Math.round(Math.pow(w,1.18)*4);
const killXP=w=>10+Math.round(Math.pow(w,1.1)*3);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function enemyFor(wave,index,rng=Math.random){
 const cls=TYPES[Math.floor(clamp(rng(),0,.999999)*3)];
 const type=cls==='thraex'?(rng()<.5?'thraex_a':'thraex_b'):cls+'_a';
 const look=type+'_L'+(1+Math.floor(clamp(rng(),0,.999999)*5));
 const hp=enemyHP(wave);
 return {side:'enemy',name:['Varro','Rufus','Gallus','Brutus','Crispus','Atilius'][index%6],
  cls,look,seat:-1,lane:-1,x:0,y:0,hp,maxHp:hp,atk:enemyAttack(wave),
  speed:62+Math.min(42,wave*2.2),armor:Math.min(.25,(wave-1)*.008),
  cooldown:.5+index*.13,swing:0,hit:0,dead:false,fade:1.8,
  windup:0,target:null,guard:0,parry:0,guardCD:0,dodge:0,stun:0,swings:0,special:false,waiting:false};
}
let screen,canvas,ctx,back,chosen=[],battle=null,frameId=0,prev=0,drawTick=0;
const $=selector=>screen?.querySelector(selector);
const api=()=>root.LudusBridge;
const display=()=>!!screen&&!screen.hidden;
function setup(){
 if(screen)return;
 screen=document.createElement('section');screen.className='ep-scene';screen.hidden=true;
 screen.id='endlessPractice';screen.setAttribute('aria-label','실전훈련 무한 생존 모드');
 screen.innerHTML=
 '<header class="ep-head"><div><small>EXERCITIVM · INFINITVM</small><h1>실전훈련 · 끝없는 시련</h1></div>'+
 '<div class="ep-right"><span id="epRecord">최고 0단계</span><button data-do="exit">❮ 루두스 복귀</button></div></header>'+
 '<main class="ep-main"><section class="ep-selection"><div class="ep-intro"><h2>한 명이라도 살아남아라</h2>'+
 '<p>보유 검투사 최대 4명을 동시에 내보내 원근 3개 전투 레이어에서 순차적으로 몰려오는 적들을 막으세요. 마지막 한 명이 쓰러질 때까지 계속됩니다.</p>'+
 '<div class="ep-tags"><span>♜ 1~4인 동시 출전</span><span>∞ 무한 웨이브</span><span>✦ 경험치 획득</span><span>◉ 재화·장비 없음</span></div></div>'+
 '<div class="ep-selection-title"><h3>출전 검투사 선택</h3><strong id="epChosen">0 / 4명</strong></div>'+
 '<div class="ep-roster" id="epRoster"></div><div class="ep-start"><span id="epHint">검투사를 선택하세요.</span>'+
 '<button data-do="start" class="ep-primary" id="epStart">⚔ 생존훈련 시작</button></div></section>'+
 '<section class="ep-combat" hidden><div class="ep-hud"><strong id="epWave">WAVE 1</strong>'+
 '<span id="epKills">격파 0</span><span id="epAlive">생존 0</span><span id="epXP">EXP +0</span></div>'+
 '<div class="ep-arena"><canvas width="1280" height="720" id="epCanvas" aria-label="다수 검투사가 세 깊이 레이어에서 적과 싸우는 전투장"></canvas>'+
 '<div id="epAnnouncement" class="ep-announcement" aria-live="polite"></div></div>'+
 '<div class="ep-health" id="epHealth"></div><div class="ep-actions">'+
 '<p>검투사들은 자동으로 싸웁니다. 생존자가 있으면 다음 단계가 즉시 이어집니다.</p>'+
 '<button data-do="speed" id="epSpeed">속도 ×1</button><button data-do="pause" id="epPause">Ⅱ 일시정지</button>'+
 '<button data-do="finish" class="ep-stop">훈련 종료 · 경험치 정산</button></div></section>'+
 '<section class="ep-result" hidden><small>EXERCITIVM · RECORDVM</small><h2 id="epResultTitle">훈련 결과</h2>'+
 '<p id="epResultText"></p><div class="ep-rewards" id="epRewards"></div>'+
 '<p class="ep-exp-note">✦ 경험치만 획득 · 데나리우스 0D · 장비 0개 · 영구 부상 없음</p>'+
 '<div class="ep-final-buttons"><button data-do="retry" class="ep-primary">↻ 다시 편성하기</button>'+
 '<button data-do="exit">❮ 루두스 복귀</button></div></section></main>';
 document.body.appendChild(screen);canvas=$('#epCanvas');ctx=canvas.getContext('2d');
 back=new Image();back.src='assets/new-era/arena.webp';
 screen.addEventListener('click',event=>{
  const btn=event.target.closest('button');if(!btn||!screen.contains(btn))return;
  const id=btn.dataset.do;
  if(id==='select')select(Number(btn.dataset.index));
  if(id==='start')start();
  if(id==='exit')close();
  if(id==='finish')finish(true);
  if(id==='pause'&&battle){battle.paused=!battle.paused;prev=0;updateButtons();}
  if(id==='speed'&&battle){battle.speed=battle.speed===1?2:1;prev=0;updateButtons();}
  if(id==='retry')showSelection();
 });
}
function drawPortrait(target,index){
 const sprite=api()?.portrait?.(index);
 if(!sprite)return;
 if(root.ArenaPortraitFit?.draw?.(target,sprite,{inset:.07}))return;
 const c=target.getContext('2d'),k=Math.min(target.width/sprite.width,target.height/sprite.height);
 try{c.drawImage(sprite,(target.width-sprite.width*k)/2,target.height-sprite.height*k,sprite.width*k,sprite.height*k);}catch(_){}
}
function selectionUI(){
 const s=api()?.state();if(!s)return;
 const rootEl=$('#epRoster'),oldScroll=rootEl.scrollTop;
 const classes={murmillo:'무르밀로',thraex:'트라엑스',retiarius:'레티아리우스'};
 rootEl.innerHTML=s.roster.map((h,i)=>{
  const selected=chosen.includes(i),blocked=!eligible(h);
  return '<button data-do="select" data-index="'+i+'" class="ep-fighter'+(selected?' selected':'')+
   '" aria-pressed="'+selected+'" '+(blocked?'disabled':'')+'>'+
   '<canvas width="125" height="156" data-art="'+i+'" aria-hidden="true"></canvas><span class="ep-unit-info">'+
   '<strong>'+safe(h.name)+'</strong><small>'+safe(classes[h.cls]||h.cls)+' · Lv.'+Math.floor(number(h.level,1))+'</small>'+
   '<em>'+(blocked?'부상·피로로 출전 불가':'부상 '+Math.round(number(h.injury))+' · 피로 '+Math.round(number(h.fatigue)))+'</em></span>'+
   '<b>'+(selected?'✓ 선발':'＋ 선택')+'</b></button>';
 }).join('');
 rootEl.scrollTop=oldScroll;rootEl.querySelectorAll('[data-art]').forEach(c=>drawPortrait(c,Number(c.dataset.art)));
 $('#epChosen').textContent=chosen.length+' / '+MAX+'명';$('#epStart').disabled=!chosen.length;
 $('#epHint').textContent=chosen.length?'출전자 '+chosen.length+'명 · 자동 전투 · 전멸 시 종료':'1명 이상 선택하세요.';
}
function select(i){
 const roster=api()?.state()?.roster||[];if(battle||!eligible(roster[i]))return;
 if(chosen.includes(i))chosen=chosen.filter(x=>x!==i);
 else if(chosen.length<MAX)chosen.push(i);
 selectionUI();
}
function showSelection(){
 cancelAnimationFrame(frameId);frameId=0;battle=null;prev=0;
 $('.ep-selection').hidden=false;$('.ep-combat').hidden=true;$('.ep-result').hidden=true;
 const state=api().state(),roster=state.roster||[];
 chosen=chosen.filter(i=>eligible(roster[i])).slice(0,MAX);
 if(!chosen.length){
  const active=Number(state.active)||0;
  const first=eligible(roster[active])?active:roster.findIndex(eligible);
  if(first>=0)chosen=[first];
 }
 $('#epRecord').textContent='최고 '+Math.round(number(state.practiceBest))+'단계';
 selectionUI();
}
function open(){
 setup();if(!api()?.state()?.roster?.length)return false;
 screen.hidden=false;showSelection();return true;
}
function heroFor(i,k){
 const h=api().state().roster[i],stats=api()?.combatStats?.(i)||{};
 const maxHp=Math.max(35,Math.round(number(stats.hp,125)-number(h.injury)));
 const c=COURTS[k];
 return {side:'ally',index:i,cls:h.cls,name:h.name,seat:k,lane:k,
  x:c.x-87,y:c.y,homeX:c.x-87,maxHp,hp:maxHp,
  atk:Math.max(8,Math.round(number(stats.atk,17))),
  armor:clamp(number(stats.armor),0,.47),parryChance:clamp(number(stats.parry,.14)+.18,.12,.6),
  speed:84+number(h.stats?.agi)*2,cooldown:.18+k*.12,swing:0,hit:0,dead:false,fade:1.8,
  exp:0,kills:0,level:h.level,windup:0,target:null,guard:0,parry:0,
  guardCD:0,dodge:0,stun:0,swings:0,special:false};
}
function announce(text){
 const el=$('#epAnnouncement');el.textContent=text;el.classList.remove('ep-pop');
 void el.offsetWidth;el.classList.add('ep-pop');
}
function nextWave(){
 if(!battle)return;
 battle.wave++;battle.left=waveSize(battle.wave);battle.serial=0;battle.delay=.65;battle.breakTime=0;battle.cleared=false;
 for(const h of battle.heroes)if(!h.dead){
  h.hp=Math.min(h.maxHp,h.hp+Math.round(h.maxHp*.045));
  h.x=h.homeX;h.windup=0;h.guard=0;h.parry=0;h.stun=0;h.dodge=0;h.cooldown=.15;
 }
 battle.enemies=[];battle.queued=[];
 announce('WAVE '+battle.wave+' · '+battle.left+'명의 적');status();
}
function start(){
 if(battle||!chosen.length)return;
 const state=api().state(),roster=state.roster||[];
 const picks=[...new Set(chosen)].filter(i=>eligible(roster[i])).slice(0,MAX);
 if(!picks.length)return;
 chosen=picks;
 $('.ep-selection').hidden=true;$('.ep-combat').hidden=false;$('.ep-result').hidden=true;
 battle={heroes:picks.map(heroFor),enemies:[],queued:[],wave:0,clearedWave:0,kills:0,left:0,serial:0,delay:0,nextSeat:0,
  cleared:false,breakTime:0,knockout:0,finished:false,paused:false,speed:1,shakes:0,particles:[],clock:0};
 prev=0;nextWave();updateButtons();frameId=requestAnimationFrame(loop);
}
function findOpenCourt(heroes,enemies,cursor=0){
 for(let n=0;n<MAX;n++){
  const seat=(cursor+n)%MAX;
  const h=heroes.find(u=>u.seat===seat&&!u.dead);
  if(h&&!enemies.some(e=>!e.dead&&e.seat===seat))return h;
 }
 return null;
}
function parkEnemy(e,h){
 const c=COURTS[h.seat];e.seat=h.seat;e.lane=h.seat;e.y=c.y;
 e.homeX=c.x+87;e.x=c.x+LEASH;e.waiting=false;e.cooldown=.3;
}
function spawnMatched(){
 if(!battle)return false;
 const h=findOpenCourt(battle.heroes,battle.enemies,battle.nextSeat);
 if(!h)return false;
 const e=battle.queued.length?battle.queued.shift():battle.left>0
  ?enemyFor(battle.wave,battle.serial++,Math.random):null;
 if(!e)return false;
 parkEnemy(e,h);battle.enemies.push(e);
 if(!e.wasSpawned){battle.left--;e.wasSpawned=true;}
 battle.nextSeat=(h.seat+1)%MAX;
 return true;
}
function matched(u){
 return u.side==='ally'
  ?battle.enemies.find(e=>!e.dead&&e.seat===u.seat)||null
  :battle.heroes.find(h=>!h.dead&&h.seat===u.seat)||null;
}
function sparks(target,force=false){
 battle.shakes=Math.max(battle.shakes,force?8:3);
 const s=COURTS[target.seat];
 for(let i=0;i<(force?11:6);i++){
  const rad=Math.random()*Math.PI*2,velocity=30+Math.random()*85;
  battle.particles.push({x:target.x,y:target.y-77*s.scale,
   dx:Math.cos(rad)*velocity,dy:Math.sin(rad)*velocity-40,
   life:.4+Math.random()*.3,critical:force});
 }
}
function deal(attacker,target,multiplier=1,style='normal'){
 if(attacker.dead||target.dead)return;
 const crit=Math.random()<(attacker.side==='ally'?.17:.09);
 const raw=attacker.atk*(.88+Math.random()*.24)*(crit?1.43:1)*multiplier;
 const base=root.ArenaBalance?.combatDamage?.(raw,style)
  ?? Math.round(raw*(style==='parry'?.60:style==='special'?.54:.46));
 const damage=Math.max(1,Math.round(base*(1-target.armor)));
 target.hp=Math.max(0,target.hp-damage);target.hit=.25;sparks(target,crit||style==='parry'||style==='special');
 const c=COURTS[target.seat],sign=attacker.side==='ally'?1:-1;
 target.x=clamp(target.x+sign*13,c.x-LEASH,c.x+LEASH);
 if(!target.hp){
  target.dead=true;target.fade=1.6;target.windup=0;target.guard=0;
  if(attacker.side==='ally'&&target.side==='enemy'){
   attacker.exp+=killXP(battle.wave);attacker.kills++;battle.kills++;
  }
 }
}
function prepareStrike(u,target){
 u.swings++;u.special=u.swings%4===0||(u.side==='ally'&&Math.random()<.07);
 u.windup=u.special?.34:.24;u.target=target;u.swing=u.special?.59:.46;
 u.cooldown=(u.side==='ally'?.81:.94)+(u.special?.24:0)+Math.random()*.17;
 // Original duel-inspired timing: guard can parry during a brief window,
 // otherwise absorbs part of the hit. Foes can also evade.
 if(target.guardCD<=0&&target.stun<=0){
  const chance=target.side==='ally'?target.parryChance:.18+Math.min(.12,battle.wave*.003);
  if(Math.random()<chance){
   target.guard=u.windup+.30;target.parry=u.windup+.10;target.guardCD=1.3+Math.random()*.8;
  }else if(Math.random()<(target.side==='ally'?.08:.06)){
   target.dodge=u.windup+.15;target.guardCD=1.25;
  }
 }
}
function contact(u,target){
 if(u.dead||!target||target.dead||Math.abs(u.x-target.x)>165)return;
 if(target.dodge>0){sparks(target);return;}
 if(target.guard>0){
  if(target.parry>0){
   u.stun=.56;u.cooldown=Math.max(u.cooldown,.68);
   target.swing=.35;deal(target,u,1.16,'parry');return;
  }
  deal(u,target,.33,'normal');return;
 }
 deal(u,target,u.special?1.55:1,u.special?'special':'normal');
}
function act(u,dt){
 if(u.dead){u.fade=Math.max(0,u.fade-dt);return;}
 u.cooldown=Math.max(0,u.cooldown-dt);u.swing=Math.max(0,u.swing-dt);
 u.hit=Math.max(0,u.hit-dt);u.stun=Math.max(0,u.stun-dt);
 u.guard=Math.max(0,u.guard-dt);u.parry=Math.max(0,u.parry-dt);
 u.dodge=Math.max(0,u.dodge-dt);u.guardCD=Math.max(0,u.guardCD-dt);
 const target=matched(u),ring=COURTS[u.seat];
 if(u.windup>0){
  u.windup-=dt;
  if(u.windup<=0){u.windup=0;contact(u,u.target);}
  return;
 }
 if(u.stun>0||u.dodge>0)return;
 if(!target){
  const dx=u.homeX-u.x;
  u.x=clamp(u.x+clamp(dx,-u.speed*dt,u.speed*dt),ring.x-LEASH,ring.x+LEASH);
  return;
 }
 const dx=target.x-u.x;
 if(Math.abs(dx)>140)
  u.x=clamp(u.x+Math.sign(dx)*Math.min(Math.abs(dx)-136,u.speed*dt),
   ring.x-LEASH,ring.x+LEASH);
 else if(u.cooldown<=0)prepareStrike(u,target);
}
function simulate(dt){
 if(!battle||battle.paused||battle.finished)return;
 battle.clock+=dt;battle.shakes=Math.max(0,battle.shakes-24*dt);
 // Assign at most one foe to each living gladiator, only when that
 // court is empty. The queue remains pending instead of clustering.
 if(battle.left>0||battle.queued.length){
  battle.delay-=dt;
  if(battle.delay<=0&&spawnMatched())
   battle.delay=clamp(1.22-battle.wave*.009,.48,1.22);
 }
 battle.heroes.forEach(u=>act(u,dt));battle.enemies.forEach(u=>act(u,dt));
 // Dispatch orphaned enemies IMMEDIATELY after an ally falls this tick.
 // No frame is rendered with an unmatched live enemy in an abandoned court.
 for(const e of battle.enemies){
  if(!e.dead&&!battle.heroes.some(h=>!h.dead&&h.seat===e.seat)){
   e.waiting=true;e.seat=-1;e.x=-999;e.y=-999;e.windup=0;
   battle.queued.push(e);
  }
 }
 battle.enemies=battle.enemies.filter(e=>!e.waiting);
 battle.enemies=battle.enemies.filter(u=>!u.dead||u.fade>0);
 for(const p of battle.particles){p.life-=dt;p.x+=p.dx*dt;p.y+=p.dy*dt;p.dy+=180*dt;}
 battle.particles=battle.particles.filter(p=>p.life>0).slice(-70);
 if(battle.heroes.every(u=>u.dead)){
  battle.knockout+=dt;if(battle.knockout>.85)finish(false);
  return;
 }
 if(!battle.left&&!battle.queued.length&&!battle.enemies.some(u=>!u.dead)&&!battle.cleared){
  battle.cleared=true;battle.clearedWave=battle.wave;battle.breakTime=1.6;
  battle.heroes.filter(h=>!h.dead).forEach(h=>h.exp+=waveXP(battle.wave));
  announce('WAVE '+battle.wave+' 돌파 · 생존 '+battle.heroes.filter(h=>!h.dead).length+'명');
 }
 if(battle.cleared&&((battle.breakTime-=dt)<=0))nextWave();
}
function sprite(unit){
 const kind=unit.dead?'death':unit.hit>0?'hit':unit.guard>0?'guard':
  unit.dodge>0?'dodge':unit.windup>0||unit.swing>0?(unit.special?'special':'attack'):
  Math.abs(unit.x-unit.homeX)>13?'walk':'idle';
 if(unit.side==='ally'){
  const owner=api()?.state()?.roster?.[unit.index];
  return api()?.squadSprite?.(owner,kind,Math.floor((battle?.clock||0)*11))||
   api()?.trainingFrame?.(unit.index,kind,battle?.clock||0);
 }
 return api()?.practiceEnemySprite?.(unit.look,kind);
}
function drawUnit(unit){
 const scale=COURTS[unit.seat]?.scale||.78,size=162*scale,height=202*scale;
 ctx.save();ctx.translate(unit.x,unit.y);
 ctx.fillStyle='#10080677';ctx.beginPath();ctx.ellipse(0,0,46*scale,10*scale,0,0,Math.PI*2);ctx.fill();
 if(unit.dead)ctx.globalAlpha=clamp(unit.fade/1.6,.12,.66);
 const art=sprite(unit);
 if(art&&(art.width||art.naturalWidth)){
  const bounds=root.ArenaPortraitFit?.bounds?.(art)||{x:0,y:0,w:art.width||art.naturalWidth,h:art.height||art.naturalHeight};
  if(bounds.w&&bounds.h){
   const k=Math.min(size/bounds.w,height/bounds.h),w=bounds.w*k,h=bounds.h*k;
   ctx.save(); // Only the enemy SPRITE flips, not name/HP/effect overlays.
   if(unit.side==='enemy')ctx.scale(-1,1);
   try{ctx.drawImage(art,bounds.x,bounds.y,bounds.w,bounds.h,-w/2,-h,w,h);}catch(_){}
   ctx.restore();
  }
 }else{
  ctx.fillStyle=unit.side==='ally'?'#bb915e':'#8b3e2a';ctx.beginPath();
  ctx.ellipse(0,-60*scale,22*scale,60*scale,0,0,Math.PI*2);ctx.fill();
 }
 if(unit.swing>0&&!unit.dead){
  ctx.strokeStyle=unit.side==='ally'?'#ffdda8':'#f58b70';ctx.lineWidth=3.5*scale;
  ctx.beginPath();ctx.arc((unit.side==='ally'?1:-1)*23*scale,-90*scale,38*scale,-.9,1.12);ctx.stroke();
 }
 ctx.globalAlpha=1;
 const bar=78*scale,percent=clamp(unit.hp/Math.max(1,unit.maxHp),0,1);
 ctx.fillStyle='#160b08';ctx.fillRect(-bar/2,-height-26*scale,bar,8*scale);
 ctx.fillStyle=unit.side==='ally'?'#a8e99c':'#e27b68';
 ctx.fillRect(-bar/2,-height-26*scale,bar*percent,8*scale);
 ctx.strokeStyle='#ffdf9a';ctx.lineWidth=.8;ctx.strokeRect(-bar/2,-height-26*scale,bar,8*scale);
 ctx.font='bold '+Math.max(10,Math.round(13*scale))+'px sans-serif';
 ctx.fillStyle='#fff0cf';ctx.textAlign='center';ctx.fillText(unit.name.slice(0,15),0,-height-31*scale);
 ctx.restore();
}
function paint(){
 if(!battle||!ctx)return;
 ctx.save();ctx.clearRect(0,0,W,H);
 if(battle.shakes)ctx.translate((Math.random()-.5)*battle.shakes,(Math.random()-.5)*battle.shakes);
 if(back.complete&&back.naturalWidth)ctx.drawImage(back,0,0,W,H);
 else{const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#24120e');grad.addColorStop(1,'#754328');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);}
 ctx.fillStyle='#160a0929';ctx.fillRect(0,0,W,H);
 COURTS.forEach(c=>{
  ctx.fillStyle='rgba(15,8,5,.13)';ctx.beginPath();
  ctx.ellipse(c.x,c.y+9,190*c.scale,20*c.scale,0,0,Math.PI*2);ctx.fill();
 });
 battle.heroes.concat(battle.enemies).filter(u=>!u.dead||u.fade>0).sort((a,b)=>a.y-b.y||a.x-b.x).forEach(drawUnit);
 for(const p of battle.particles){ctx.globalAlpha=clamp(p.life/.75,0,.9);ctx.fillStyle=p.critical?'#ffe9a3':'#fbb071';ctx.beginPath();ctx.arc(p.x,p.y,p.critical?3.3:2.1,0,Math.PI*2);ctx.fill();}
 ctx.restore();
}
function status(){
 if(!battle)return;
 $('#epWave').textContent='WAVE '+battle.wave;$('#epKills').textContent='격파 '+battle.kills;
 $('#epAlive').textContent='생존 '+battle.heroes.filter(h=>!h.dead).length+'/'+battle.heroes.length;
 $('#epXP').textContent='EXP +'+battle.heroes.reduce((n,h)=>n+h.exp,0);
 $('#epHealth').innerHTML=battle.heroes.map(h=>'<div class="ep-hp-card '+(h.dead?'dead':'')+'">'+
  '<strong>'+safe(h.name)+'</strong><small>Lv.'+h.level+' · '+h.kills+'격파</small>'+
  '<div class="ep-bar"><i style="width:'+Math.round(100*h.hp/h.maxHp)+'%"></i></div>'+
  '<span>HP '+Math.round(h.hp)+'/'+h.maxHp+' · EXP +'+h.exp+'</span></div>').join('');
}
function updateButtons(){
 $('#epSpeed').textContent='속도 ×'+(battle?.speed||1);
 $('#epPause').textContent=battle?.paused?'▶ 재개':'Ⅱ 일시정지';
}
function loop(timestamp){
 if(!display()||!battle||battle.finished){frameId=0;return;}
 const dt=prev?clamp((timestamp-prev)/1000,0,.05)*battle.speed:0;
 prev=timestamp;if(!battle.paused)simulate(dt);
 if(battle&&!battle.finished){
  if(timestamp-drawTick>140){drawTick=timestamp;status();}
  paint();frameId=requestAnimationFrame(loop);
 }else frameId=0;
}
function finish(quit){
 if(!battle||battle.finished)return;
 battle.finished=true;cancelAnimationFrame(frameId);frameId=0;
 const snap=battle,payout={};
 for(const h of snap.heroes)payout[h.index]=h.exp;
 const results=api()?.practiceReward?.(payout,snap.wave,snap.kills,quit)||{awards:[],best:0,totalXp:0};
 $('.ep-selection').hidden=true;$('.ep-combat').hidden=true;$('.ep-result').hidden=false;
 $('#epResultTitle').textContent=quit?'훈련 종료':'전원 전투불능';
 $('#epResultText').textContent='도달 '+snap.wave+'단계 · 돌파 '+snap.clearedWave+'단계 · 적 '+
  snap.kills+'명 격파 · 최고 '+results.best+'단계';
 $('#epRewards').innerHTML=(results.awards||[]).map(x=>'<div class="ep-reward"><strong>'+safe(x.name)+
  '</strong><span>EXP +'+x.xp+'</span><small>Lv.'+x.level+(x.levels?' · LEVEL UP +'+x.levels:'')+'</small></div>').join('');
 $('#epRecord').textContent='최고 '+results.best+'단계';
 battle=null;prev=0;
}
function close(){
 if(battle&&!battle.finished)finish(true);
 cancelAnimationFrame(frameId);frameId=0;prev=0;battle=null;
 if(screen)screen.hidden=true;
 root.LudusScene?.open();
}
if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&battle&&!battle.paused){battle.paused=true;prev=0;updateButtons();}
});
root.LudusPractice={open,close,isOpen:display,rules:{eligible,waveSize,enemyHP,enemyAttack,waveXP,killXP,enemyFor}};
if(typeof module!=='undefined')module.exports=root.LudusPractice.rules;
})(typeof window!=='undefined'?window:globalThis);
