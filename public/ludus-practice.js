/* SPARTACUS · EXERCITIVM INFINITVM — simultaneous survival training.
   Reads all fighter art/stats from LudusBridge; awards XP through one Career callback.
   No gold, loot, honor, arena wins, or permanent injuries are written here.
*/
(function(root){'use strict';
const W=1280,H=720,MAX=4,TYPES=['murmillo','thraex','retiarius'];
// Background sand begins near y=520. Anchors are feet on the ground,
// not floating on the stone walls. Presets are NEAR/FORWARD FIRST.
const COURT_LAYOUTS=Object.freeze({
 1:Object.freeze([{x:640,y:676,scale:1.24}]),
 2:Object.freeze([{x:325,y:689,scale:1.29},{x:955,y:689,scale:1.29}]),
 3:Object.freeze([{x:325,y:689,scale:1.29},{x:955,y:689,scale:1.29},
   {x:640,y:606,scale:1.06}]),
 4:Object.freeze([{x:325,y:689,scale:1.29},{x:955,y:689,scale:1.29},
   {x:422,y:606,scale:1.06},{x:858,y:606,scale:1.06}])
});
function courtsForParty(count){
 // Does not depend on later-initialized variables; works at script load.
 const n=Math.max(1,Math.min(MAX,Math.floor(Number(count)||1)));
 return COURT_LAYOUTS[n].map(c=>({...c}));
}
let COURTS=courtsForParty(4);
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
  windup:0,target:null,guard:0,parry:0,guardCD:0,dodge:0,stun:0,swings:0,special:false,waiting:false,
  entry:0,arrival:0};
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
 // 1 = solo centered, 2 = FRONT pair, 3/4 add distant opponents.
 COURTS=courtsForParty(picks.length);
 $('.ep-selection').hidden=true;$('.ep-combat').hidden=false;$('.ep-result').hidden=true;
 battle={heroes:picks.map(heroFor),enemies:[],queued:[],wave:0,clearedWave:0,kills:0,left:0,serial:0,delay:0,nextSeat:0,
  cleared:false,breakTime:0,knockout:0,finished:false,paused:false,speed:1,shakes:0,
  particles:[],fx:[],exits:[],clock:0};
 prev=0;nextWave();updateButtons();frameId=requestAnimationFrame(loop);
}
function findOpenCourt(heroes,enemies,cursor=0){
 for(let n=0;n<MAX;n++){
  const seat=(cursor+n)%MAX;
  const h=heroes.find(u=>u.seat===seat&&!u.dead);
  if(h&&!enemies.some(e=>!e.dead&&e.seat===seat)&&
    !battle?.exits?.some(exit=>exit.unit.seat===seat&&exit.age<1.75))return h;
 }
 return null;
}
function parkEnemy(e,h){
 const c=COURTS[h.seat];e.seat=h.seat;e.lane=h.seat;e.y=c.y;
 // Original arena entrance rhythm: run on from the right, briefly plant
 // the feet, then begin combat. Each new rival comes in separately.
 e.homeX=c.x+87;
 e.fromX=W+250*c.scale; // fully outside visible arena
 e.entryTotal=Math.max(1.25,(e.fromX-e.homeX)/580);
 e.x=e.fromX;e.entry=e.entryTotal;e.arrival=.18;e.waiting=false;e.cooldown=.35;
}
function spawnMatched(){
 if(!battle||battle.enemies.some(e=>!e.dead&&e.entry>0))return false;
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
// Use the approved 8-frame directional RGBA effects from normal arena fights.
// No fake geometry arcs or newly drawn vector attack effects.
function emitVfx(kind,unit,other,emphasis=false){
 if(!battle||unit.seat<0||!COURTS[unit.seat])return;
 const c=COURTS[unit.seat],duration=root.ArenaRasterFX?.FAMILIES?.[kind]?.duration||.34;
 const face=unit.side==='ally'?1:-1;
 battle.fx.push({kind,x:unit.x+face*43*c.scale,
  y:unit.y-108*c.scale,scale:c.scale,face,age:0,duration,
  alpha:emphasis?1:.87});
}
function beginRemoval(unit){
 if(!battle||unit.retiring||unit.seat<0)return;
 unit.retiring=true;
 const c=COURTS[unit.seat],engine=root.ArenaCarnifex;
 const scale=c.scale*.58;
 const offset=c.x-640*scale;
 const viewport={left:-offset/scale,right:(W-offset)/scale};
 let seq=null;
 if(engine?.begin){
  try{
   const body={x:(unit.x-offset)/scale,enemy:unit.side==='enemy',
    cfg:{name:unit.name},cls:unit.cls,dead:true,hp:0};
   seq=engine.begin(body,unit.side==='enemy',0,viewport);
   engine.preload?.();
  }catch(_){seq=null;}
 }
 battle.exits.push({unit,seq,age:0,scale,court:c,viewport});
}
function drawDeparture(removal){
 const engine=root.ArenaCarnifex,{unit,seq,court,scale}=removal;
 if(!seq||!engine?.draw)return;
 ctx.save();
 ctx.translate(court.x-640*scale,court.y-617*scale);
 ctx.scale(scale,scale);
 engine.draw(ctx,seq,corpse=>{
  const art=rawSprite(unit,'death');
  if(!art)return;
  const bounds=alphaBounds(art),metric=calibration(unit,art);
  if(!bounds||!metric)return;
  // Identical character size as the living model, transformed to
  // Carnifex-local space. Use the same fixed visual scale, same foot pivot.
  const factor=metric.pixels*court.scale/scale;
  const w=bounds.w*factor,h=bounds.h*factor;
  ctx.save();
  ctx.translate(corpse.x,617);
  if(unit.side==='enemy')ctx.scale(-1,1);
  try{ctx.drawImage(art,bounds.x,bounds.y,bounds.w,bounds.h,-w/2,-h,w,h);}catch(_){}
  ctx.restore();
 },617);
 ctx.restore();
}
function updateDepartures(dt){
 if(!battle)return;
 const engine=root.ArenaCarnifex;
 for(const exit of battle.exits){
  exit.age+=dt;
  if(exit.seq&&engine?.advance){
   engine.advance(exit.seq,dt,exit.viewport);
  }
 }
 battle.exits=battle.exits.filter(exit=>
  exit.seq?!exit.seq.finished:exit.age<3.6);
}
function paintVfx(){
 if(!battle)return;
 const fx=root.ArenaRasterFX;
 for(const v of battle.fx){
  const p=clamp(v.age/v.duration,0,.9999);
  fx?.draw?.(ctx,v.kind,v.x,v.y,275*v.scale,270*v.scale,p,
    v.alpha*Math.min(1,(1-p)*2.7),v.face,0);
 }
}
function deal(attacker,target,multiplier=1,style='normal'){
 if(attacker.dead||target.dead)return;
 const crit=Math.random()<(attacker.side==='ally'?.17:.09);
 const raw=attacker.atk*(.88+Math.random()*.24)*(crit?1.43:1)*multiplier;
 const base=root.ArenaBalance?.combatDamage?.(raw,style)
  ?? Math.round(raw*(style==='parry'?.60:style==='special'?.54:.46));
 const damage=Math.max(1,Math.round(base*(1-target.armor)));
 target.hp=Math.max(0,target.hp-damage);target.hit=.25;
 sparks(target,crit||style==='parry'||style==='special');
 emitVfx(crit?'sweep':attacker.swings%3===0?'thrust':'slash',attacker,target,crit);
 const c=COURTS[target.seat],sign=attacker.side==='ally'?1:-1;
 target.x=clamp(target.x+sign*13,c.x-LEASH,c.x+LEASH);
 if(!target.hp){
  target.dead=true;target.fade=1.6;target.windup=0;target.guard=0;
  beginRemoval(target);
  if(attacker.side==='ally'&&target.side==='enemy'){
   attacker.exp+=killXP(battle.wave);attacker.kills++;battle.kills++;
  }
 }
}
function prepareStrike(u,target){
 u.swings++;u.special=false; // Practice deliberately omits dash/special attack.
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
   // Practice retains the parry clang/flash, not the arena's counterattack.
   u.stun=.20;u.cooldown=Math.max(u.cooldown,.48);
   target.swing=.22;emitVfx('parry',target,u,true);return;
  }
  emitVfx('guard',target,u,false);
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
 if(u.side==='enemy'&&u.entry>0){
  u.entry=Math.max(0,u.entry-dt);
  const t=1-u.entry/u.entryTotal;
  const eased=1-Math.pow(1-t,2);
  u.x=u.fromX+(u.homeX-u.fromX)*eased;
  if(!u.entry){u.x=u.homeX;u.cooldown=Math.max(u.cooldown,u.arrival);}
  return;
 }
 // A combatant waits for the arriving enemy instead of lunging mid-entrance.
 if(u.side==='ally'&&target?.entry>0){u.x=u.homeX;return;}
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
 for(const v of battle.fx)v.age+=dt;
 battle.fx=battle.fx.filter(v=>v.age<v.duration);
 updateDepartures(dt);
 if(battle.heroes.every(u=>u.dead)){
  battle.knockout+=dt;if(battle.knockout>.85)finish(false);
  return;
 }
 if(!battle.left&&!battle.queued.length&&!battle.enemies.some(u=>!u.dead)&&
    !battle.exits.length&&!battle.cleared){
  battle.cleared=true;battle.clearedWave=battle.wave;battle.breakTime=1.6;
  battle.heroes.filter(h=>!h.dead).forEach(h=>h.exp+=waveXP(battle.wave));
  announce('WAVE '+battle.wave+' 돌파 · 생존 '+battle.heroes.filter(h=>!h.dead).length+'명');
 }
 if(battle.cleared&&((battle.breakTime-=dt)<=0))nextWave();
}
// Stable model-space pixel scale: measure the idle pose ONCE, including an
// approximate head width from alpha runs. Never fit action frames individually.
function rawSprite(u,kind){
 if(u.side==='ally'){
  const hero=api()?.state()?.roster?.[u.index];
  return api()?.squadSprite?.(hero,kind,Math.floor((battle?.clock||0)*10))||
   api()?.trainingFrame?.(u.index,kind,battle?.clock||0);
 }
 return api()?.practiceEnemySprite?.(u.look,kind);
}
function alphaBounds(art){
 if(!art)return null;
 return root.ArenaPortraitFit?.bounds?.(art)||
  {x:0,y:0,w:art.width||art.naturalWidth||0,h:art.height||art.naturalHeight||0};
}
function measureFace(art,b){
 if(typeof document==='undefined'||!document.createElement)return b.w*.26;
 try{
  const cv=document.createElement('canvas');cv.width=cv.height=96;
  const c=cv.getContext('2d',{willReadFrequently:true});
  if(!c)return b.w*.26;
  c.drawImage(art,b.x,b.y,b.w,b.h,0,0,96,96);
  const data=c.getImageData(0,0,96,96).data,widths=[];
  // Locate the largest connected alpha segment near head height. Daggers,
  // tridents and extended shields are not considered body/face width.
  for(let y=15;y<=38;y+=2){
   let best=0,current=0;
   for(let x=3;x<93;x++){
    if(data[(y*96+x)*4+3]>35){current++;best=Math.max(best,current)}
    else current=0;
   }
   if(best>=7&&best<=68)widths.push(best*b.w/96);
  }
  if(widths.length>=3){
   widths.sort((a,b)=>a-b);
   return Math.max(b.w*.13,Math.min(b.w*.45,widths[Math.floor(widths.length*.55)]));
  }
 }catch(_){}
 return b.w*.26;
}
function calibration(unit,frame){
 if(unit._bodyScale)return unit._bodyScale;
 const idle=rawSprite(unit,'idle')||frame;
 if(!idle)return null;
 const b=alphaBounds(idle);
 if(!b?.w||!b?.h)return null;
 const base=202/b.h;
 const head=b.h*.22;
 // Artist original pose height controls consistent head-to-body proportions;
 // do not enlarge short Thraex or shrink wide-trident Retiarius.
 const correction=1;
 return unit._bodyScale={pixels:base*correction,
  headPixels:head,refW:b.w,refH:b.h,correction};
}
function sprite(unit){
 const kind=unit.dead?'death':unit.entry>0?'walk':unit.hit>0?'hit':unit.guard>0?'guard':
  unit.dodge>0?'dodge':unit.windup>0||unit.swing>0?'attack':
  Math.abs(unit.x-unit.homeX)>13?'walk':'idle';
 return rawSprite(unit,kind);
}
function drawUnit(unit){
 const scale=COURTS[unit.seat]?.scale||.78,height=202*scale;
 ctx.save();ctx.translate(unit.x,unit.y);
 // Approved backdrop already has baked floor lighting: NO vector shadow.
 if(unit.dead)ctx.globalAlpha=1;
 const art=sprite(unit);
 if(art&&(art.width||art.naturalWidth)){
  const bounds=alphaBounds(art),metric=calibration(unit,art);
  if(bounds?.w&&bounds?.h&&metric){
   const k=metric.pixels*scale,w=bounds.w*k,h=bounds.h*k;
   const pose=unit.dead?'death':unit.entry>0?'walk':unit.hit>0?'hit':unit.guard>0?'guard':
    unit.dodge>0?'dodge':unit.windup>0||unit.swing>0?'attack':
    Math.abs(unit.x-unit.homeX)>13?'walk':'idle';
   const atlasFrame=api()?.practiceFrame?.(unit,pose);
   ctx.save(); // Only artwork flips. Original frame pivots stabilize the torso.
   if(unit.side==='enemy')ctx.scale(-1,1);
   try{
    if(atlasFrame?.canvas===art&&Number.isFinite(atlasFrame.pivotX)&&Number.isFinite(atlasFrame.footY))
     ctx.drawImage(art,-atlasFrame.pivotX*k,-atlasFrame.footY*k,art.width*k,art.height*k);
    else ctx.drawImage(art,bounds.x,bounds.y,bounds.w,bounds.h,-w/2,-h,w,h);
   }catch(_){}
   ctx.restore();
  }
 }else{
  ctx.fillStyle=unit.side==='ally'?'#bb915e':'#8b3e2a';ctx.beginPath();
  ctx.ellipse(0,-60*scale,22*scale,60*scale,0,0,Math.PI*2);ctx.fill();
 }
 // Authored slash/thrust/sweep PNG sequences are rendered separately.
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
 // All court floor overlays removed: gladiators stand on the original sand.
 // The original arena's approved Carnifex walks on behind its fallen target.
 // Sort stage actors/departures by real foot depth, not by sprite image size.
 const stageActors=battle.heroes.concat(battle.enemies)
  .filter(u=>!u.retiring&&(!u.dead||u.fade>0))
  .map(unit=>({y:unit.y,draw:()=>drawUnit(unit)}));
 const exits=battle.exits.map(exit=>({y:exit.court.y-.5,draw:()=>drawDeparture(exit)}));
 stageActors.concat(exits).sort((a,b)=>a.y-b.y).forEach(item=>item.draw());
 paintVfx();
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
root.LudusPractice={open,close,isOpen:display,rules:{eligible,waveSize,enemyHP,enemyAttack,waveXP,killXP,enemyFor,courtsForParty}};
if(typeof module!=='undefined')module.exports=root.LudusPractice.rules;
})(typeof window!=='undefined'?window:globalThis);
