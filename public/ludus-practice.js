/* SPARTACUS · EXERCITIVM INFINITVM — simultaneous survival training.
   Reads all fighter art/stats from LudusBridge; awards XP through one Career callback.
   No gold, loot, honor, arena wins, or permanent injuries are written here.
*/
(function(root){'use strict';
const W=1280,H=720,MAX=4,TYPES=['murmillo','thraex','retiarius'];
const Personality=root.ArenaPersonality;
const Body=root.SpartacusBodyCollision||
 (typeof module==='object'&&module.exports?require('./arena-body-collision.js'):null);
if(!Body)throw Error('Practice requires neutral body collision');
// Background sand begins near y=520. Anchors are feet on the ground.
// A near/far camera plane multiplies the studio-authored size ONCE.
// Four 4-player foot rows at Y 570, 608, 649, 689: 70% -> 79.6% -> 89.9% -> 100%.
const PRACTICE_FAR_Y=570,PRACTICE_NEAR_Y=689,PRACTICE_FAR_SCALE=.70;
function courtPerspective(y){
 const t=Math.max(0,Math.min(1,(Number(y)-PRACTICE_FAR_Y)/(PRACTICE_NEAR_Y-PRACTICE_FAR_Y)));
 return PRACTICE_FAR_SCALE+(1-PRACTICE_FAR_SCALE)*t;
}
const court=(x,y)=>Object.freeze({x,y,scale:courtPerspective(y)});

// Seat index 0/1/2/3 corresponds to visible court 1/2/3/4.
//       back:  4   3
//      front:  2   1  (court 1 is drawn last, topmost).
// Keep this left/right numbering consistent after survivor reflow.
const COURT_LAYOUTS=Object.freeze({
 1:Object.freeze([court(640,676)]),
 2:Object.freeze([court(955,689),court(325,689)]),
 3:Object.freeze([court(955,689),court(325,689),court(640,606)]),
 // Seat order 1,2,3,4 = front right, front left, rear right, rear left.
// X is compressed inside the 1280px viewport so the left-side ally and
// right-side rival can show their full approved neutral bitmap frames.
 4:Object.freeze([court(990,689),court(320,649),
   court(780,608),court(480,570)])
});
function courtsForParty(count){
 // Does not depend on later-initialized variables; works at script load.
 const n=Math.max(1,Math.min(MAX,Math.floor(Number(count)||1)));
 return COURT_LAYOUTS[n].map(c=>({...c}));
}
let COURTS=courtsForParty(4);
// Each court is one indivisible painter block including its fighters,
// VFX, dead bodies, hit sparks and executor: always 4 -> 3 -> 2 -> 1.
// Court 2's executor must NEVER draw above court 1's gladiator.
const COURT_PAINT_STACK=Object.freeze({
 1:Object.freeze([0]),
 2:Object.freeze([1,0]),
 3:Object.freeze([2,1,0]),
 // The left court must paint AFTER the right court: seat 3's enemy
 // is on the near-right edge of court 3, overlapping seat 4's left fighter.
 // Rear row remains underneath the entire front row.
 4:Object.freeze([3,2,1,0])
});
function courtPaintOrder(count=COURTS.length){
 const n=Math.max(1,Math.min(MAX,Math.floor(Number(count)||1)));
 return COURT_PAINT_STACK[n].slice();
}
const LEASH=168,ATTACK_START_RANGE=188,CONTACT_REACH=214;
function neutralBody(unit){
 const look=visualLook(unit),size=root.PracticeScaleProfiles?.scale?.(look)??1;
 const neutral=root.PracticeVisualProfiles?.resolve?.(look,'idle')?.scale??1;
 return Body.footprint('practice',{scale:size*neutral,y:unit?.y??PRACTICE_NEAR_Y});
}
function pairBodyGap(a,b){
 return Body.gap(neutralBody(a),neutralBody(b),3);
}
const REAR_COURT_ART_GAP=160; // unloaded far row: tighter neutral spacing matches its 70-80% projected art
function rearCourtBoundary(){
 if(COURTS.length<4)return null;
 const left=COURTS[3],right=COURTS[2];
 const midpoint=(left.x+right.x)/2;
 const enemy=battle?.enemies?.find(u=>!u.dead&&!u.retiring&&u.seat===3&&u.entry<=0);
 const ally=battle?.heroes?.find(u=>!u.dead&&!u.retiring&&u.seat===2);
 const width=enemy&&ally?pairBodyGap(enemy,ally)+22:REAR_COURT_ART_GAP;
 return {leftMax:midpoint-width/2,rightMin:midpoint+width/2};
}
// Reference on-screen size of the same gladiator in standard duels (348 * .82)
// and in practice (202). Carnifex shares the gladiator's COURT perspective;
// the studio's npc_carnifex scale is then applied ONCE by ArenaCarnifex.
const DUEL_GLADIATOR_REFERENCE=348*.82,PRACTICE_GLADIATOR_REFERENCE=202;
function executionerCourtScale(court){
 return court.scale*PRACTICE_GLADIATOR_REFERENCE/DUEL_GLADIATOR_REFERENCE;
}
function unitPerspective(unit){
 // Animate size smoothly if a survivor shifts from the back court to front.
 return courtPerspective(unit?.y??COURTS[unit?.seat]?.y??PRACTICE_NEAR_Y);
}
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const number=(x,d=0)=>Number.isFinite(Number(x))?Number(x):d;
const eligible=h=>!!h&&number(h.injury)<80&&number(h.fatigue)<80;
const waveSize=w=>Math.min(12,2+Math.floor((w-1)/2));
const enemyHP=w=>Math.round(43+Math.pow(w,1.09)*13);
const enemyAttack=w=>Math.round(4.3+Math.pow(w,.95)*1.15);
const waveXP=w=>9+Math.round(Math.pow(w,1.18)*4);
const killXP=w=>10+Math.round(Math.pow(w,1.1)*3);
const XP_MULTIPLIERS=Object.freeze([0,2.2,1.6,1.3,1]);
const experienceMultiplier=n=>XP_MULTIPLIERS[clamp(Math.round(Number(n)||1),1,4)];
const experienceAward=(base,n)=>Math.max(0,Math.round(Math.max(0,Number(base)||0)*experienceMultiplier(n)));
function engagementBonusRules(wave,n){
 const premium=experienceMultiplier(n)-1,base=waveXP(wave);
 return {every:2.5,chunk:premium>0?Math.max(1,Math.round(base*.11*premium)):0,
  cap:Math.max(0,Math.round(base*.48*premium))};
}
function courtAssignments(survivors){
 const units=survivors.slice().sort((a,b)=>a.seat-b.seat);
 const layout=units.length?courtsForParty(units.length):[];
 return units.map((unit,seat)=>({unit,seat,homeX:layout[seat].x-87,y:layout[seat].y}));
}
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function enemyFor(wave,index,rng=Math.random){
 const cls=TYPES[Math.floor(clamp(rng(),0,.999999)*3)];
 const type=cls==='thraex'?(rng()<.5?'thraex_a':'thraex_b'):cls+'_a';
 const baseLook=type+'_L'+(1+Math.floor(clamp(rng(),0,.999999)*5));
 const custom=root.SpartacusGladiators?.custom?.().filter(item=>item.cls===cls)||[];
 const registered=custom.length&&rng()<.20?
  custom[Math.floor(clamp(rng(),0,.999999)*custom.length)]:null;
 const look=registered?.visualId||baseLook;
 const hp=enemyHP(wave);
 const mindProfile=Personality?.profile?.({cls,name:['Varro','Rufus','Gallus','Brutus','Crispus','Atilius'][index%6],level:wave},
  {atk:enemyAttack(wave),move:230+Math.min(70,wave*3),hp,sp:enemyAttack(wave)*2.3},cls);
 return {personality:mindProfile,side:'enemy',name:['Varro','Rufus','Gallus','Brutus','Crispus','Atilius'][index%6],
  cls,look,seat:-1,lane:-1,x:0,y:0,hp,maxHp:hp,atk:enemyAttack(wave),
  speed:62+Math.min(42,wave*2.2),armor:Math.min(.25,(wave-1)*.008),
  cooldown:.5+index*.13,swing:0,hit:0,dead:false,fade:1.8,face:-1,
  windup:0,target:null,guard:0,parry:0,guardCD:0,dodge:0,stun:0,swings:0,special:false,waiting:false,
  entry:0,arrival:0};
}
let screen,canvas,ctx,back,crowdAtlas,crowdActors,chosen=[],battle=null,frameId=0,prev=0,drawTick=0;
let spectatorClock=0,yardAssetFailed=false;
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
 '<p>보유 검투사 최대 4명을 동시에 내보내 최대 4단계 원근 배치에서 순차적으로 몰려오는 적들을 막으세요. 마지막 한 명이 쓰러질 때까지 계속됩니다.</p>'+
 '<div class="ep-tags"><span>♜ 1~4인 동시 출전</span><span>∞ 무한 웨이브</span><span>✦ 경험치 획득</span><span>◉ 재화·장비 없음</span></div></div>'+
 '<div class="ep-selection-title"><h3>출전 검투사 선택</h3><strong id="epChosen">0 / 4명</strong></div>'+
 '<div class="ep-roster" id="epRoster"></div><div class="ep-start"><span id="epHint">검투사를 선택하세요.</span>'+
 '<button data-do="start" class="ep-primary" id="epStart">⚔ 생존훈련 시작</button></div></section>'+
 '<section class="ep-combat" hidden><div class="ep-hud"><strong id="epWave">WAVE 1</strong>'+
 '<span id="epKills">격파 0</span><span id="epAlive">생존 0</span><span id="epXP">EXP +0</span></div>'+
 '<div class="ep-arena"><canvas width="1280" height="720" id="epCanvas" aria-label="검투사 최대 4명이 네 단계 원근 배치에서 적과 싸우는 전투장"></canvas>'+
 '<div id="epAnnouncement" class="ep-announcement" aria-live="polite"></div></div>'+
 '<div class="ep-health" id="epHealth"></div><div class="ep-actions">'+
 '<p>검투사들은 자동으로 싸웁니다. 생존자가 있으면 다음 단계가 즉시 이어집니다.</p>'+
 '<button data-do="speed" id="epSpeed">속도 ×1</button><button data-do="pause" id="epPause">Ⅱ 일시정지</button>'+
 '<button data-do="finish" class="ep-stop">훈련 종료 · 경험치 정산</button></div></section>'+
 '<section class="ep-result" hidden><small>EXERCITIVM · RECORDVM</small>'+
 '<div class="ep-result-achievement"><span class="ep-result-overline">이번 시련의 성과</span>'+
 '<h2 id="epResultTitle" aria-live="polite">도전 기록</h2>'+
 '<div class="ep-result-metrics" role="group" aria-label="실전훈련 도전 기록">'+
 '<div class="ep-result-metric"><span>돌파 단계</span><strong id="epResultCleared">0</strong><small>WAVES CLEARED</small></div>'+
 '<div class="ep-result-metric"><span>적 격파</span><strong id="epResultKills">0</strong><small>ENEMIES DEFEATED</small></div>'+
 '<div class="ep-result-metric"><span>최고 기록</span><strong id="epResultBest">0</strong><small>PERSONAL BEST</small></div></div></div>'+
 '<h3 class="ep-rewards-title">검투사 성장 <small>EXPERIENTIA</small></h3>'+
 '<div class="ep-rewards" id="epRewards"></div>'+
 '<p class="ep-exp-note">✦ 경험치 획득 · 데나리우스 0D · 장비 0개 · 영구 부상 없음</p>'+
 '<div class="ep-final-buttons"><button data-do="retry" class="ep-primary">↻ 다시 편성하기</button>'+
 '<button data-do="exit">❮ 루두스 복귀</button></div></section></main>';
 document.body.appendChild(screen);canvas=$('#epCanvas');ctx=canvas.getContext('2d');
 // One static Ludus yard background and one small four-frame, alpha-masked balcony group.
  back=new Image();yardAssetFailed=false;
  back.onerror=()=>{yardAssetFailed=true;back.onerror=null;back.src='assets/new-era/arena.webp';};
  back.src='assets/ludus-practice/ludus-practice-yard-empty-v4-game.webp?v=emptyyard-v4';
  crowdAtlas=new Image();crowdAtlas.src='assets/ludus-practice/capua-balcony-full-4f-lossless-v2.webp?v=entirestand-stable-v5';
  // Separate approved alpha sprites let people keep natural proportions.
  // Do not scale the architecture or the canvas to correct spectator heads.
  crowdActors=new Image();crowdActors.src='assets/ludus-practice/ludus-balcony-actors-only-v4-4f.webp?v=balcony-portrait-fit-v98';
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
 $('#epHint').textContent=chosen.length?'출전자 '+chosen.length+'명 · EXP ×'+experienceMultiplier(chosen.length).toFixed(1)+' · 생존자가 줄면 보너스 증가':'1명 이상 선택하세요.';
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
  personality:Personality?.profile?.(h,stats,h.cls),mind:null,
  x:c.x-87,y:c.y,homeX:c.x-87,maxHp,hp:maxHp,
  atk:Math.max(8,Math.round(number(stats.atk,17))),
  armor:clamp(number(stats.armor),0,.62),parryChance:clamp(number(stats.parry,.14)+.18,.12,.6),
  speed:Math.max(50,number(stats.move,244)*.35),
  sp:number(stats.sp,number(stats.atk,17)*1.55/.65),specialCooldown:number(stats.specialCooldown,7),specialReady:4+k*.5,
  recovery:number(stats.recovery,1),dodgeChance:number(stats.dodgeChance,.08),guardEfficiency:number(stats.guardEfficiency),
  cooldown:.18+k*.12,swing:0,hit:0,dead:false,fade:1.8,face:1,
  exp:0,kills:0,level:h.level,initialLevel:h.level,initialXp:number(h.xp,0),windup:0,target:null,guard:0,parry:0,
  guardCD:0,dodge:0,stun:0,swings:0,special:false};
}
function announce(text){
 const el=$('#epAnnouncement');el.textContent=text;el.classList.remove('ep-pop');
 void el.offsetWidth;el.classList.add('ep-pop');
}
function nextWave(){
 if(!battle)return;
 const alive=battle.heroes.filter(h=>!h.dead).length;
 battle.wave++;battle.left=Math.max(waveSize(battle.wave),alive);
 battle.serial=0;battle.delay=.65;battle.breakTime=0;battle.cleared=false;
 for(const h of battle.heroes)if(!h.dead){
  h.hp=Math.min(h.maxHp,h.hp+Math.round(h.maxHp*.045));
  h.x=h.homeX;h.y=COURTS[h.seat].y;h.windup=0;h.guard=0;h.parry=0;h.stun=0;h.dodge=0;h.cooldown=.15;
  h.engagementClock=0;h.engagementBonus=0;h.reflow=null;
 }
 battle.enemies=[];battle.queued=[];
 // All available allies get matched opponents at the SAME wave start.
 // Reinforcements still arrive individually once a combatant wins.
 for(let n=0;n<alive;n++)if(!spawnMatched(true))break;
 battle.delay=clamp(1.22-battle.wave*.009,.48,1.22);
 playCombatSound('start',null,.48);
 announce('WAVE '+battle.wave+' · '+Math.max(waveSize(battle.wave),alive)+'명의 적');status();
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
  cleared:false,breakTime:0,knockout:0,finished:false,paused:false,speed:1,shakes:0,flash:0,fx:true,nextCinematicAt:0,cinematic:null,focusFrame:null,
  particles:[],fx:[],exits:[],clock:0,audioTimes:{}};
 root.ArenaAudio?.enterArena?.();
 prev=0;nextWave();updateButtons();frameId=requestAnimationFrame(loop);
}
function findOpenCourt(heroes,enemies,cursor=0){
 for(let n=0;n<MAX;n++){
  const seat=(cursor+n)%MAX;
  const h=heroes.find(u=>u.seat===seat&&!u.dead);
  if(h&&!enemies.some(e=>!e.dead&&e.seat===seat)&&
    !battle?.exits?.some(exit=>exit.unit.seat===seat))return h;
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
function spawnMatched(opening=false){
 if(!battle||(!opening&&battle.enemies.some(e=>!e.dead&&e.entry>0)))return false;
 const h=findOpenCourt(battle.heroes,battle.enemies,battle.nextSeat);
 if(!h)return false;
 const e=battle.queued.length?battle.queued.shift():battle.left>0
  ?enemyFor(battle.wave,battle.serial++,Math.random):null;
 if(!e)return false;
 parkEnemy(e,h);
 if(opening)e.entryTotal=e.entry=1.70; // All stations start their first duel in sync.
 battle.enemies.push(e);
 if(!e.wasSpawned){battle.left--;e.wasSpawned=true;}
 playCombatSound('dash',e,.30);
 battle.nextSeat=(h.seat+1)%MAX;
 return true;
}
function matched(u){
 return u.side==='ally'
  ?battle.enemies.find(e=>!e.dead&&e.seat===u.seat)||null
  :battle.heroes.find(h=>!h.dead&&h.seat===u.seat)||null;
}
// Reuse the existing Roman arena audio engine and its independently mixed
// swing, shield, parry, impact, evasion, entrance and end-match recordings.
// Per-seat throttling keeps simultaneous 1–4 duels audible without audio spam.
function playCombatSound(kind,unit,gain=.75,delay=0){
 if(!battle||battle.finished)return false;
 const seat=unit?.seat??-1;
 const key=seat+':'+kind,now=battle.clock;
 battle.audioTimes??={};
 if(now-(battle.audioTimes[key]??-999)<.095)return false;
 battle.audioTimes[key]=now;
 const active=Math.max(1,battle.heroes.filter(h=>!h.dead).length);
 const mix=1/Math.sqrt(1+.16*(active-1));
 return root.ArenaAudio?.play?.(kind,{gain:gain*mix,
  pan:clamp(((unit?.x??640)-640)/700,-.78,.78),delay})??false;
}
function sparks(target,force=false){
 battle.shakes=Math.max(battle.shakes,force?8:3);
 const s=COURTS[target.seat];
 for(let i=0;i<(force?11:6);i++){
  const rad=Math.random()*Math.PI*2,velocity=30+Math.random()*85;
  battle.particles.push({seat:target.seat,x:target.x,y:target.y-77*unitPerspective(target),sizeScale:unitPerspective(target),
   dx:Math.cos(rad)*velocity,dy:Math.sin(rad)*velocity-40,
   depth:s.y-(target.side==='enemy'?12:0)+.55,
   front:target.side==='ally'?1:0,
   life:.4+Math.random()*.3,critical:force});
 }
}
// Use the approved 8-frame directional RGBA effects from normal arena fights.
// No fake geometry arcs or newly drawn vector attack effects.
function emitVfx(kind,unit,other,emphasis=false){
 if(!battle||unit.seat<0||!COURTS[unit.seat])return;
 const court=COURTS[unit.seat],perspective=unitPerspective(unit),fx=root.ArenaRasterFX;
 // Match the same orientation used by sprite() / drawDefeatPose().
 // An impact belongs to the person HIT, not the attacker's mirrored artwork.
 const face=unit.side==='ally'?1:-1;
 const action=['slash','sweep','thrust'].includes(kind)?kind:
  kind==='hit'?'hit':kind==='guard'?'guard':kind==='parry'?'parry':
  kind==='dash'?'dodge':kind==='finisher'?'finisher':
  kind==='special'?'special':'attack';
 const settings=root.PracticeVisualProfiles;
 const authored=settings?.resolve?.(visualLook(unit),action);
 const selected=authored?.effect?.kind;
 const chosen=!selected||selected==='auto'?kind:selected;
 if(chosen==='none'||!fx?.FAMILIES?.[chosen])return;
 const geometry=settings?.effectGeometry?.({
  kind:chosen,baseX:unit.x+(kind==='hit'?0:face*52*perspective),
  baseY:unit.y+(-113+profilesFoot(unit))*perspective,
  face,zoom:perspective,pose:authored,progress:.5
 });
 if(!geometry)return;
 battle.fx.push({seat:unit.seat,kind:chosen,x:geometry.x,y:geometry.y,
  width:geometry.width,height:geometry.height,face:geometry.face,
  age:0,duration:fx.FAMILIES[chosen].duration||.34,
  depth:court.y-(unit.side==='enemy'?12:0)+.6,
  front:unit.side==='ally'?1:0,alpha:emphasis?1:.87});
}
function beginRemoval(unit){
 if(!battle||unit.retiring||unit.seat<0)return;
 unit.retiring=true;
 const c={...COURTS[unit.seat],y:unit.y,scale:unitPerspective(unit)},engine=root.ArenaCarnifex;
 const scale=executionerCourtScale(c);
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
const FALL_DURATION=1.16; // Keep the body visible through the complete flight and landing.
function deathFrame(unit,clock){
 const elapsed=Math.max(0,(Number(clock)||0)-(unit.deathAt??(Number(clock)||0)));
 return Math.min(7,Math.floor((elapsed+1e-6)*10));
}
function selectedDeathArt(unit){
 // Prioritize the dedicated approved defeat frame; special art falls back
 // to a hit/idle sprite but is tilted into a clearly prone orientation.
 return api()?.practiceFrame?.(unit,'death')?.canvas||
  rawSprite(unit,'death')||rawSprite(unit,'hit')||null;
}
function drawDefeatPose(unit,zoom,pose='death'){
 const art=pose==='hit'?(api()?.practiceFrame?.(unit,'hit')?.canvas||rawSprite(unit,'hit')||selectedDeathArt(unit)):selectedDeathArt(unit);if(!art)return;
 const metric=calibration(unit,art);if(!metric)return;
 const k=metric.pixels*zoom,meta=api()?.practiceFrame?.(unit,pose);
 // Display the exact approved loss pose, no extraneous 90-degree rotation.
 ctx.save();
 const action=visualAction(unit,pose),face=unit.side==='enemy'?-1:1;
 const motion=root.PracticeVisualProfiles?.sampleMotion?.(action,1)||{x:0,y:0};
 ctx.translate((action.x+motion.x)*zoom*face,(profilesFoot(unit)+action.y+motion.y)*zoom);
 if(face<0)ctx.scale(-1,1);
 const px=meta?.canvas===art&&Number.isFinite(meta.pivotX)?meta.pivotX:(art.width||art.naturalWidth)/2;
 const py=meta?.canvas===art&&Number.isFinite(meta.footY)?meta.footY:(art.height||art.naturalHeight);
 const kk=k*action.scale;
 try{ctx.drawImage(art,-px*kk,-py*kk,
   (art.width||art.naturalWidth)*kk,(art.height||art.naturalHeight)*kk);}catch(_){}
 ctx.restore();
}
function drawFalling(removal){
 const f=removal.unit.flight,age=removal.age;
 const t=f?clamp(age/f.duration,0,1):1;
 // Animate from actual contact to the final landing point; never snap to the corpse.
 const dx=f?(f.fromX-removal.unit.x)*Math.pow(1-t,1.6):0;
 const lift=f&&!f.reduced?-4*f.height*removal.court.scale*t*(1-t):0;
 ctx.save();ctx.translate(removal.unit.x+dx,removal.court.y-4+lift);
 drawDefeatPose(removal.unit,removal.court.scale,f&&t<.76?'hit':'death');
 ctx.restore();
}
function drawDeparture(removal){
 const engine=root.ArenaCarnifex,{unit,seq,court,scale}=removal;
 if(removal.age<FALL_DURATION){drawFalling(removal);return;}
 if(!seq||!engine?.draw){
  ctx.save();ctx.translate(unit.x,court.y);
  drawDefeatPose(unit,court.scale);
  ctx.restore();return;
 }
 ctx.save();ctx.translate(court.x-640*scale,court.y-617*scale);
 ctx.scale(scale,scale);
 engine.draw(ctx,seq,corpse=>{
  ctx.save();ctx.translate(corpse.x,617);
  // Preserve identical source defeat pose from KO until full offscreen exit.
  drawDefeatPose(unit,court.scale/scale);
  ctx.restore();
 },617,{footOffsetFactor:court.scale/scale});
 ctx.restore();
}
function updateDepartures(dt){
 if(!battle)return;
 const engine=root.ArenaCarnifex;
 for(const exit of battle.exits){
  exit.age+=dt;
  if(exit.seq&&engine?.advance){
   if(exit.age>=FALL_DURATION)engine.advance(exit.seq,Math.min(dt,exit.age-FALL_DURATION),exit.viewport);
  }
 }
 battle.exits=battle.exits.filter(exit=>
  exit.seq?!exit.seq.finished:exit.age<3.6);
}
// Authored FX size library lives in PracticeVisualProfiles and is exposed
// to the same editor that controls each action's sprite transform.
function drawVfx(v){
 const fx=root.ArenaRasterFX;
 const p=clamp(v.age/v.duration,0,.9999);
 fx?.draw?.(ctx,v.kind,v.x,v.y,v.width,v.height,p,
  v.alpha*Math.min(1,(1-p)*2.7),v.face,0);
}
function drawSpark(p){
 ctx.save();ctx.globalAlpha=clamp(p.life/.75,0,.9);
 ctx.fillStyle=p.critical?'#ffe9a3':'#fbb071';
 ctx.beginPath();ctx.arc(p.x,p.y,(p.critical?3.3:2.1)*(p.sizeScale||1),0,Math.PI*2);
 ctx.fill();ctx.restore();
}
// Live XP is a read-only preview of career progression. It updates the
// fighter's visible level immediately without ever prematurely modifying
// the persistent roster (which is settled exactly once at match end).
function refreshPracticeLevel(hero){
 if(!battle||hero?.side!=='ally')return;
 const signals=root.ArenaCombatSignals;
 const next=signals?.previewLevel?.(hero.initialLevel,hero.initialXp,hero.exp);
 if(!next||next.level<=hero.level)return;
 signals.levelUp(hero,hero.level,next.level,battle.clock);
 hero.level=next.level;
 root.ArenaAudio?.play?.('victory',{gain:.38});
}
function deal(attacker,target,multiplier=1,style='normal'){
 if(attacker.dead||target.dead)return;
 const crit=Math.random()<(attacker.side==='ally'?.17:.09);
 const power=style==='special'?(attacker.sp??attacker.atk*1.55/.65)*.65:attacker.atk;
 const raw=power*(.88+Math.random()*.24)*(crit?1.43:1)*multiplier;
 const base=root.ArenaBalance?.combatDamage?.(raw,style)
  ?? Math.round(raw*(style==='parry'?.60:style==='special'?.54:.46));
 const damage=root.ArenaMatchup?.damage?.(base*(1-target.armor),attacker,target)??Math.max(1,Math.round(base*(1-target.armor)));
 target.hp=Math.max(0,target.hp-damage);target.hit=.25;
 const isKO=target.hp<=0;
 sparks(target,crit||style==='parry'||style==='special');
 // KO uses a short body impact, NEVER a fresh attack/finisher graphic.
 // Normal surviving targets still show the directional weapon stroke.
 if(isKO)emitVfx('hit',target,attacker,true);
 else emitVfx(crit?'sweep':attacker.swings%3===0?'thrust':'slash',attacker,target,crit);
 playCombatSound(isKO||crit?'heavy_hit':'hit',target,isKO?.98:crit?.87:.70);
 const c=COURTS[target.seat],sign=attacker.side==='ally'?1:-1;
 const contactX=target.x;
 const knock=isKO?(style==='parry'||style==='special'?235:175):style==='parry'?158:style==='special'?112:crit?34:18;
 const reach=isKO?LEASH+125:LEASH;
 target.x=clamp(target.x+sign*knock,c.x-reach,c.x+reach);
 if(isKO||style==='parry'||style==='special'){
  const reduced=!!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  target.flight={fromX:contactX,at:battle.clock,duration:isKO?1.08:.76,
   height:reduced?12:isKO?145:92,reduced,kind:isKO?'death':style};
  if(!isKO){target.stun=Math.max(target.stun,.79);target.windup=0;target.target=null;target.hit=Math.max(target.hit,.76);}
 }
 root.ArenaCombatFeel?.event?.(battle,style==='parry'?'reversal':
   style==='special'?'special':crit?'strike':'hit',
   attacker,target,battle.clock,{power:style==='parry'||style==='special'?1.12:.72});
 if(isKO){
  target.dead=true;target.deathAt=battle.clock;target.fade=1.6;target.windup=0;target.guard=0;
  beginRemoval(target);
  if(attacker.side==='ally'&&target.side==='enemy'){
   attacker.exp+=experienceAward(killXP(battle.wave),battle.heroes.filter(h=>!h.dead).length);attacker.kills++;battle.kills++;
   refreshPracticeLevel(attacker);
  }
 }
}
function prepareStrike(u,target){
 const mood=Personality?.parameters?.(u,battle.clock,Math.random);
 u.swings++;u.special=u.side==='ally'?(battle.clock>=u.specialReady&&u.swings>=4&&(mood?.special||1)*Math.random()>.18):u.swings%4===0||mood?.mode==='burst'&&u.swings%3===0;
 if(u.special&&u.side==='ally')u.specialReady=battle.clock+(u.specialCooldown||7);
 playCombatSound(u.special?'dash':u.swings%3===0?'heavy_swing':'swing',u,
  u.special?.84:u.swings%3===0?.65:.53);
 if(u.special){emitVfx('dash',u,target,true);root.ArenaCombatFeel?.event?.(battle,'dash',u,target,battle.clock);}
 u.windup=u.special?.34:.24;u.windupTotal=u.windup;
 u.target=target;u.swing=u.special?.59:.46;u.swingTotal=u.swing;
 u.cooldown=((u.side==='ally'?.81:.94)+(u.special?.24:0)+Math.random()*.17)*(u.recovery||1)/clamp(mood?.aggression||1,.70,1.6);
 // Original duel-inspired timing: guard can parry during a brief window,
 // otherwise absorbs part of the hit. Foes can also evade.
 if(target.guardCD<=0&&target.stun<=0){
  const chance=target.side==='ally'?target.parryChance:.18+Math.min(.12,battle.wave*.003);
  // A guard stance does not imply an automatic perfect parry. Preserve
  // roughly the original parry frequency but allow real shield blocks.
  const defenseMood=Personality?.parameters?.(target,battle.clock,Math.random);
  const guardChance=Math.min(.82,(chance+.21)*(defenseMood?.guard||1));
  if(Math.random()<guardChance){
   target.guard=u.windup+.30;
   target.parry=Math.random()<chance/guardChance?u.windup+.10:0;
   target.guardCD=1.3+Math.random()*.8;
   playCombatSound('guard',target,.42);
  }else if(Math.random()<(target.side==='ally'?(target.dodgeChance||.08):.06)*(defenseMood?.evade||1)){
   target.dodge=u.windup+.15;target.guardCD=1.25;
  }
 }
}
function contact(u,target){
 if(u.dead||!target||target.dead||
  Math.abs(u.x-target.x)>Math.max(CONTACT_REACH,pairBodyGap(u,target)+30))return;
 if(target.dodge>0){
  sparks(target);playCombatSound('dodge',target,.67);return;
 }
 if(target.guard>0){
  if(target.parry>0){
   // Contact interruption -> one counterstrike. No recursive hit response.
   u.stun=.52;u.cooldown=Math.max(u.cooldown,.85);
   target.swing=.32;target.guard=0;target.parry=0;
   emitVfx('parry',target,u,true);
   playCombatSound('parry',target,.98);
   deal(target,u,.72,'parry');
   return;
  }
  emitVfx('guard',target,u,false);
  playCombatSound('block',target,.74);
  deal(u,target,.33*(1-(target.guardEfficiency||0)),'normal');return;
 }
 deal(u,target,1,u.special?'special':'normal');
}
// Keep ordinary footwork and guard silhouettes on-camera, even after a
// studio artist increases one gladiator's authoring scale. Dash/strike
// keyframed motion and the enemy's cinematic arrival remain untouched.
function safeArenaX(unit,x,ring){
 if(COURTS.length!==4)return clamp(x,ring.x-LEASH,ring.x+LEASH);
 const look=visualLook(unit);
 const size=root.PracticeScaleProfiles?.scale?.(look)??1;
 const neutral=root.PracticeVisualProfiles?.resolve?.(look,'idle')?.scale??1;
 const edge=clamp(202*.58*unitPerspective(unit)*size*neutral+15,96,238);
 const lo=Math.max(ring.x-LEASH,edge),hi=Math.min(ring.x+LEASH,W-edge);
 return clamp(x,lo,Math.max(lo,hi));
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
 if(u.stun>0||u.dodge>0||(u.flight&&battle.clock-u.flight.at<u.flight.duration))return;
 if(!target){
  const dx=u.homeX-u.x;
  u.x=safeArenaX(u,u.x+clamp(dx,-u.speed*dt,u.speed*dt),ring);
  return;
 }
 // Fighters circle forward and back even between attacks, instead of
 // standing immobile at the edge of their weapon's reach.
 const dx=target.x-u.x,dist=Math.abs(dx);
 const side=u.side==='ally'?-1:1;
 const mood=Personality?.parameters?.(u,battle.clock,Math.random);
 const attackRange=Math.max(clamp(ATTACK_START_RANGE-(mood?.spacing||0)*.16,183,197),
  pairBodyGap(u,target)+14);
 const wave=Math.sin(battle.clock*(1.95+u.seat*.09)*(mood?.speed||1)+u.seat*.91);
 const neutral=ring.x+side*(91+wave*(16+(mood?.lateral||0)*.34));
 let goal=neutral;
 if(dist>attackRange)
  goal=u.x+Math.sign(dx)*(dist-attackRange+8);
 else if(dist<pairBodyGap(u,target)+5)
  goal=u.x+side*(pairBodyGap(u,target)+5-dist)*.55;
 if(mood?.mode==='feint'&&dist<245&&u.cooldown>.15)
  goal=u.x+side*(12+(mood.lateral||0)*.35);
 const step=Math.max(0,u.speed*dt)*(dist>attackRange?1:.72)*(mood?.speed||1);
 u.x=safeArenaX(u,u.x+clamp(goal-u.x,-step,step),ring);
 if(Math.abs(target.x-u.x)<=attackRange&&u.cooldown<=0)
  prepareStrike(u,target);
}
// Resolve pair overlap in *world coordinates* after both sides act.
// Preserve hero-left/opponent-right ordering and enforce minimum visible gap.
// Guard four ALLIED silhouettes from adjacent court occlusion, too.
// As rear seats 3/4 spread farther apart their allies sit near front seats
// 1/2: reserve 220px between the four authored 202px-size actors.
// These are X-only visual travel limits; court Y, sprite scale and hurtboxes
// are unchanged.
function keepAlliedColumns(){
 if(COURTS.length!==4||!battle)return;
 const bySeat=new Map(battle.heroes.filter(h=>!h.dead&&!h.retiring).map(h=>[h.seat,h]));
 const leftToRight=[1,3,2,0];
 for(let i=0;i<leftToRight.length-1;i++){
  const leftSeat=leftToRight[i],rightSeat=leftToRight[i+1];
  const left=bySeat.get(leftSeat),right=bySeat.get(rightSeat);
  const gap=left&&right?pairBodyGap(left,right)+24:REAR_COURT_ART_GAP;
  const mid=(COURTS[leftSeat].x+COURTS[rightSeat].x)/2-87;
  if(left)left.x=Math.min(left.x,mid-gap/2);
  if(right)right.x=Math.max(right.x,mid+gap/2);
 }
}
function keepCourtSpacing(){
 // Rear-left court 4's foe cannot overlap rear-right court 3's ally.
 // Preserve their scaled body-size corridor without mixing painter layers.
 const boundary=rearCourtBoundary();
 if(boundary){
  for(const u of battle.enemies){
   if(!u.dead&&!u.retiring&&u.seat===3&&u.entry<=0)
    u.x=Math.min(u.x,boundary.leftMax);
  }
  for(const u of battle.heroes){
   if(!u.dead&&!u.retiring&&u.seat===2)
    u.x=Math.max(u.x,boundary.rightMin);
  }
 }
 for(const h of battle.heroes){
  if(h.dead||h.retiring)continue;
  const e=battle.enemies.find(u=>!u.dead&&!u.retiring&&u.seat===h.seat&&u.entry<=0);
  if(!e)continue;
  const gap=pairBodyGap(h,e);
  if(e.x-h.x>=gap)continue;
  const ring=COURTS[h.seat];
  const middle=clamp((h.x+e.x)*.5,
   ring.x-LEASH+gap/2,ring.x+LEASH-gap/2);
  h.x=middle-gap/2;
  e.x=middle+gap/2;
 }
 // Pair collision recovery cannot undo the rear lane art corridor.
 // Keep both visible bodies apart while retaining their own attack reach.
 if(boundary){
  const e4=battle.enemies.find(u=>!u.dead&&!u.retiring&&u.seat===3&&u.entry<=0);
  const h3=battle.heroes.find(u=>!u.dead&&!u.retiring&&u.seat===2);
  if(e4)e4.x=Math.min(e4.x,boundary.leftMax);
  if(h3)h3.x=Math.max(h3.x,boundary.rightMin);
 }
 keepAlliedColumns();
}
// The XP time bonus requires a live, landed opponent and is capped per wave.
function awardEngagementExperience(dt){
 const live=battle.heroes.filter(h=>!h.dead),rules=engagementBonusRules(battle.wave,live.length);
 if(!rules.chunk)return;
 for(const h of live){
  const foe=battle.enemies.find(e=>!e.dead&&e.seat===h.seat&&e.entry<=0);
  if(!foe||h.stun>0||h.dodge>0||
     h.flight&&battle.clock-h.flight.at<h.flight.duration)continue;
  h.engagementClock=(h.engagementClock||0)+dt;
  while(h.engagementClock>=rules.every){
   h.engagementClock-=rules.every;
   const gained=Math.min(rules.chunk,Math.max(0,rules.cap-(h.engagementBonus||0)));
   if(gained<=0){h.engagementClock=0;break;}
   h.exp+=gained;h.engagementBonus=(h.engagementBonus||0)+gained;refreshPracticeLevel(h);
  }
 }
}
// Only between waves, after corpse retrieval, return living members to
// a 1/2/3/4 person formation by interpolating world-space foot anchors.
function beginSurvivorReflow(){
 const live=battle.heroes.filter(h=>!h.dead);
 if(!live.length||live.length===COURTS.length)return;
 const assignments=courtAssignments(live);
 COURTS=courtsForParty(live.length);
 for(const {unit,seat,homeX,y} of assignments){
  unit.reflow={x:unit.x,y:unit.y,toX:homeX,toY:y,elapsed:0,duration:1.30};
  unit.seat=seat;unit.lane=seat;unit.homeX=homeX;
  unit.windup=0;unit.target=null;unit.guard=0;unit.parry=0;
 }
 battle.nextSeat=0;battle.fx=[];battle.particles=[];
}
function advanceSurvivorReflow(dt){
 for(const h of battle.heroes){
  const r=h.reflow;if(!r)continue;
  r.elapsed=Math.min(r.duration,r.elapsed+dt);
  const ease=1-Math.pow(1-r.elapsed/r.duration,3);
  h.x=r.x+(r.toX-r.x)*ease;h.y=r.y+(r.toY-r.y)*ease;
  if(r.elapsed>=r.duration){h.x=r.toX;h.y=r.toY;h.reflow=null;}
 }
}
function simulate(dt){
 if(!battle||battle.paused||battle.finished)return;
 battle.clock+=dt;battle.shakes=Math.max(0,battle.shakes-24*dt);
 if(battle.cleared){
  advanceSurvivorReflow(dt);
  if((battle.breakTime-=dt)<=0)nextWave();
  return;
 }
 // Assign at most one foe to each living gladiator, only when that
 // court is empty. The queue remains pending instead of clustering.
 if(battle.left>0||battle.queued.length){
  battle.delay-=dt;
  if(battle.delay<=0&&spawnMatched())
   battle.delay=clamp(1.22-battle.wave*.009,.48,1.22);
 }
 battle.heroes.forEach(u=>act(u,dt));battle.enemies.forEach(u=>act(u,dt));
 keepCourtSpacing();
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
  // Final defeat must not interrupt dragging any still-visible corpses.
  if(battle.exits.length){battle.knockout=0;return;}
  battle.knockout+=dt;if(battle.knockout>.65)finish(false);
  return;
 }
 awardEngagementExperience(dt);
 if(!battle.left&&!battle.queued.length&&!battle.enemies.some(u=>!u.dead)&&
    !battle.exits.length&&!battle.cleared){
  const living=battle.heroes.filter(h=>!h.dead),count=living.length;
  battle.cleared=true;battle.clearedWave=battle.wave;battle.breakTime=1.8;
  living.forEach(h=>{h.exp+=experienceAward(waveXP(battle.wave),count);refreshPracticeLevel(h);});
  beginSurvivorReflow();
  announce('WAVE '+battle.wave+' 돌파 · 생존 '+count+'명 · EXP ×'+experienceMultiplier(count).toFixed(1));
 }
}
// Original authored frame geometry is shared with the normal arena duel.
// Do not fit the alpha/opaque head-height here: padded red-helmet or special
// frames would be blown up for practice alone.
function rawSprite(u,kind){
 if(u.side==='ally'){
  const hero=api()?.state()?.roster?.[u.index];
  const tick=kind==='death'?deathFrame(u,battle?.clock||0):Math.floor((battle?.clock||0)*10);
  return api()?.squadSprite?.(hero,kind,tick)||
   api()?.trainingFrame?.(u.index,kind,tick);
 }
 return api()?.practiceEnemySprite?.(u.look,kind);
}
// Artist-adjustable stable scale per costume; no torso/helmet heuristic.
function alphaBounds(art){
 if(!art)return null;
 return root.ArenaPortraitFit?.bounds?.(art)||
  {x:0,y:0,w:art.width||art.naturalWidth||0,h:art.height||art.naturalHeight||0};
}
function visualLook(unit){
 return root.PracticeScaleProfiles?.look?.(unit,api()?.state()?.roster)||null;
}
function authoredPose(unit,pose){
 if(pose==='attack'&&(unit.windup>0||unit.swing>0))
  return ['thrust','slash','sweep'][unit.swings%3]||'attack';
 return pose;
}
function visualAction(unit,pose){
 const action=authoredPose(unit,pose);
 return root.PracticeVisualProfiles?.resolve?.(visualLook(unit),action)||
  {x:0,y:0,scale:1,effect:{kind:'auto',x:0,y:0,scale:1}};
}
function motionProgress(unit,pose){
 if(pose==='attack'){
  if(unit.windup>0)return .4*(1-Math.min(1,unit.windup/(unit.windupTotal||.24)));
  if(unit.swing>0)return .4+.6*(1-Math.min(1,unit.swing/(unit.swingTotal||.46)));
  return 1;
 }
 if(pose==='hit')return 1-Math.min(1,unit.hit/.25);
 if(pose==='guard')return 1-Math.min(1,unit.guard/.54);
 if(pose==='dodge')return 1-Math.min(1,unit.dodge/.42);
 if(pose==='walk')return ((battle?.clock||0)*.8)%1;
 if(pose==='idle')return ((battle?.clock||0)*.3)%1;
 return 1;
}
function actorPose(unit){
 return unit.dead?'death':unit.entry>0?'walk':unit.flight&&battle.clock-unit.flight.at<unit.flight.duration?'hit':unit.hit>0?'hit':unit.guard>0?'guard':
   unit.dodge>0?'dodge':unit.windup>0||unit.swing>0?'attack':
   Math.abs(unit.x-unit.homeX)>13?'walk':'idle';
}
function calibration(unit,frame){
 const profiles=root.PracticeScaleProfiles;
 const appearance=visualLook(unit),factor=profiles?.scale?.(appearance)||1;
 const idle=api()?.practiceFrame?.(unit,'idle')?.canvas||rawSprite(unit,'idle')||frame;
 const referenceH=idle?.height||idle?.naturalHeight||0;
 if(!referenceH)return null;
 const basis=api()?.practiceNominal?.(unit),w=basis?.width||0,h=basis?.height||0;
 if(unit._bodyScale&&unit._bodyScale.relative===factor&&
    unit._bodyScale.reference===idle&&unit._bodyScale.basisW===w&&unit._bodyScale.basisH===h)
  return unit._bodyScale;
 // All 12 isolated poses (including the smallest trimmed idle cell) share
 // the exact original normal-duel source-cell scale, never frame height.
 const sourcePixels=w>0&&h>0?profiles?.cellPixels?.(appearance,w,h,PRACTICE_GLADIATOR_REFERENCE):0;
 const pixels=sourcePixels||
  profiles?.framePixels?.(appearance,referenceH,PRACTICE_GLADIATOR_REFERENCE)||
  PRACTICE_GLADIATOR_REFERENCE/referenceH*factor;
 const visible=alphaBounds(idle);
 return unit._bodyScale={pixels,relative:factor,basisW:w,basisH:h,
  appearance:appearance||'special',refH:visible?.h||referenceH,
  reference:idle,frameH:referenceH};
}
function sprite(unit){return rawSprite(unit,actorPose(unit));}
function profilesFoot(unit){
 const p=root.PracticeScaleProfiles;
 return p?.foot?.(p?.look?.(unit,api()?.state()?.roster))||0;
}
function drawUnit(unit){
 const scale=unitPerspective(unit);
 const height=202*scale;
 let labelHeight=height;
 const flight=unit.flight,flightT=flight?clamp((battle.clock-flight.at)/flight.duration,0,1):1;
 const flightX=flight?(flight.fromX-unit.x)*Math.pow(1-flightT,1.6):0;
 const flightY=flight&&!flight.reduced?-4*flight.height*scale*flightT*(1-flightT):0;
 ctx.save();ctx.translate(unit.x+flightX,unit.y+flightY);
 const reduced=!!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const bodyMotion=root.ArenaMotion?.pose?.(unit,battle?.clock||0,reduced)||{x:0,y:0,tilt:0};
 const impact=root.ArenaMotion?.visual?.(unit,reduced,true)||{scale:1,flash:0};
 // Approved backdrop already has baked floor lighting: NO vector shadow.
 if(unit.dead)ctx.globalAlpha=1;
 const art=sprite(unit);
 if(art&&(art.width||art.naturalWidth)){
  const bounds=alphaBounds(art),metric=calibration(unit,art);
  if(bounds?.w&&bounds?.h&&metric){
   const pose=actorPose(unit),t=visualAction(unit,pose);
   const motion=root.PracticeVisualProfiles?.sampleMotion?.(t,motionProgress(unit,pose))||{x:0,y:0};
   const k=metric.pixels*scale*t.scale;
   // One FULL authored frame, one global artist size, one optional action edit.
   // No alpha-crop, class/squad modifier, or automatic per-pose resizing.
   labelHeight=Math.min(height*1.6,Math.max(72*scale,metric.refH*k));
   const atlasFrame=api()?.practiceFrame?.(unit,pose);
   const pivotX=atlasFrame?.canvas===art&&Number.isFinite(atlasFrame.pivotX)?
     atlasFrame.pivotX:(art.width||art.naturalWidth)/2;
   const pivotY=atlasFrame?.canvas===art&&Number.isFinite(atlasFrame.footY)?
     atlasFrame.footY:(art.height||art.naturalHeight);
   const face=unit.side==='enemy'?-1:1;
   ctx.save();
   if(!unit.dead){
    ctx.translate(bodyMotion.x,bodyMotion.y);
    ctx.rotate(bodyMotion.tilt||0);
    ctx.scale(impact.scale||1,impact.scale||1);
   }
   ctx.translate((t.x+motion.x)*scale*face,(profilesFoot(unit)+t.y+motion.y)*scale);
   if(face<0)ctx.scale(-1,1);
   if(impact.flash>0)ctx.filter='brightness('+(1+impact.flash*2.5).toFixed(2)+')';
   try{ctx.drawImage(art,-pivotX*k,-pivotY*k,
    (art.width||art.naturalWidth)*k,(art.height||art.naturalHeight)*k);}
   catch(_){}
   ctx.restore();
  }
 }else{
  ctx.fillStyle=unit.side==='ally'?'#bb915e':'#8b3e2a';ctx.beginPath();
  ctx.ellipse(0,-60*scale,22*scale,60*scale,0,0,Math.PI*2);ctx.fill();
 }
 // Authored slash/thrust/sweep PNG sequences are rendered separately.
 ctx.globalAlpha=1;
 const bar=78*scale,percent=clamp(unit.hp/Math.max(1,unit.maxHp),0,1);
 ctx.fillStyle='#160b08';ctx.fillRect(-bar/2,-labelHeight-26*scale,bar,8*scale);
 ctx.fillStyle=unit.side==='ally'?'#a8e99c':'#e27b68';
 ctx.fillRect(-bar/2,-labelHeight-26*scale,bar*percent,8*scale);
 ctx.strokeStyle='#ffdf9a';ctx.lineWidth=.8;ctx.strokeRect(-bar/2,-labelHeight-26*scale,bar,8*scale);
 ctx.font='bold '+Math.max(10,Math.round(13*scale))+'px sans-serif';
 ctx.fillStyle='#fff0cf';ctx.textAlign='center';ctx.fillText(unit.name.slice(0,15),0,-labelHeight-31*scale);
 if(!unit.dead){
  // One living opponent per court: arrows update as waves rotate enemies.
  const foe=unit.side==='ally'?
   battle.enemies.find(e=>!e.dead&&e.seat===unit.seat):
   battle.heroes.find(h=>!h.dead&&h.seat===unit.seat);
  if(!unit._levelFx)root.ArenaCombatSignals?.drawAdvantage?.(ctx,unit,foe,{
   x:0,y:-labelHeight-66*scale,time:battle.clock,size:19*scale});
  root.ArenaCombatSignals?.drawLevelUp?.(ctx,unit,{
   x:0,y:-labelHeight-65*scale,time:battle.clock,scale:scale*.82});
 }
 ctx.restore();
}
// A numbered combat court is an independent compositing layer.
function courtPaintQueue(scene){
 const order=courtPaintOrder(COURTS.length);
 const ranks=new Map(order.map((seat,i)=>[seat,i]));
 const result=[];
 let serial=0;
 function add(seat,depth,front,kind,paint){
  if(!ranks.has(seat))return;
  result.push({seat,depth,front,kind,serial:serial++,paint});
 }
 for(const unit of (scene.heroes||[]).concat(scene.enemies||[])){
  if(unit.retiring||(unit.dead&&!(unit.fade>0)))continue;
  add(unit.seat,unit.y-(unit.side==='enemy'?12:0),
   unit.side==='ally'?1:0,'fighter',()=>drawUnit(unit));
 }
 for(const exit of scene.exits||[]){
  add(exit.unit?.seat,exit.court.y-(exit.unit.side==='enemy'?12:0),
   exit.unit.side==='ally'?1:0,'executioner',()=>drawDeparture(exit));
 }
 for(const effect of scene.fx||[]){
  add(effect.seat,effect.depth,effect.front,'effect',()=>drawVfx(effect));
 }
 for(const particle of scene.particles||[]){
  add(particle.seat,particle.depth,particle.front,'spark',()=>drawSpark(particle));
 }
 // Global court rank FIRST; within one court retain actor-depth, faction
 // and stable painter order. Side-by-side duels cannot mix visual layers.
 result.sort((a,b)=>ranks.get(a.seat)-ranks.get(b.seat)||
  a.depth-b.depth||a.front-b.front||a.serial-b.serial);
 return result;
}
function paint(){
 if(!battle||!ctx)return;
 ctx.save();ctx.clearRect(0,0,W,H);
 const reduced=!!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const shot=root.ArenaCombatFeel?.sample?.(battle,{reduced})||{x:0,y:0,angle:0,zoom:1};
 ctx.translate(shot.x||0,shot.y||0);
 if(shot.angle){ctx.translate(W/2,H/2);ctx.rotate(shot.angle);ctx.translate(-W/2,-H/2);}
 if(shot.zoom>1){ctx.translate(W/2,H*.63);ctx.scale(shot.zoom,shot.zoom);ctx.translate(-W/2,-H*.63);}
 if(!root.ArenaCombatFeel&&battle.shakes)ctx.translate((Math.random()-.5)*battle.shakes,(Math.random()-.5)*battle.shakes);
 if(back.complete&&back.naturalWidth)ctx.drawImage(back,0,0,W,H);
 else{const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#24120e');grad.addColorStop(1,'#754328');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);}
 // Spectator portraits alone receive an aspect correction. The plaza, columns,
 // awnings and balcony remain 1:1 with the 1280x720 approved background.
 // The actor-only 4-frame atlas has 467x187 frames (1868x187 total).
 // A gentle horizontal 10% reduction un-squashes the original chibi heads.
  if(!yardAssetFailed){
   const order=[0,1,2,3,2,1],tick=Math.floor(spectatorClock/.33);
   const frame=reduced?0:order[tick%order.length];
   if(crowdActors?.complete&&crowdActors.naturalWidth===1868&&crowdActors.naturalHeight===187&&back.naturalWidth===1280&&back.naturalHeight===720){
    const sourceWidth=467,sourceHeight=187;
    const fittedWidth=sourceWidth*.90;
    const centeredX=760+(480-fittedWidth)/2-16;
    // Keep the people behind the unchanged stone railing: no distorted posts,
    // canopies or banners and no old double-rendered crowd underneath.
    ctx.save();
    ctx.beginPath();ctx.rect(760,0,480,155);ctx.clip();
    ctx.drawImage(crowdActors,frame*sourceWidth,0,sourceWidth,sourceHeight,
     centeredX,0,fittedWidth,sourceHeight);
    ctx.restore();
    // Re-occlude foreground balcony rail and bunting from the approved still.
    ctx.drawImage(back,760,151,480,74,760,151,480,74);
   }else if(crowdAtlas?.complete&&crowdAtlas.naturalWidth===1920&&crowdAtlas.naturalHeight===225){
    // Asset download fallback: preserve the previous approved full-station animation.
    ctx.drawImage(crowdAtlas,frame*480,0,480,225,760,0,480,225);
   }
  }
  ctx.fillStyle='#160a0910';ctx.fillRect(0,0,W,H);
 // All court floor overlays removed: gladiators stand on the original sand.
 // Four full court layers: 4 3 at the back / 2 1 at the front.
  // Court 1 paints last over court 2's gladiators, FX and Carnifex.
  // Each particle, corpse, VFX and executor follows its owner's seat.
  courtPaintQueue(battle).forEach(item=>item.paint());
 ctx.restore();
 root.ArenaCombatFeel?.overlay?.(ctx,W,H,shot);
}
function status(){
 if(!battle)return;
 $('#epWave').textContent='WAVE '+battle.wave;$('#epKills').textContent='격파 '+battle.kills;
 $('#epAlive').textContent='생존 '+battle.heroes.filter(h=>!h.dead).length+'/'+battle.heroes.length;
 $('#epXP').textContent='EXP +'+battle.heroes.reduce((n,h)=>n+h.exp,0)+' · ×'+experienceMultiplier(Math.max(1,battle.heroes.filter(h=>!h.dead).length)).toFixed(1);
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
 const realDt=prev?clamp((timestamp-prev)/1000,0,.05):0;
 prev=timestamp;
 const reduced=!!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const scaled=root.ArenaCombatFeel?.advance?.(battle,battle.heroes.concat(battle.enemies),
  realDt,{paused:battle.paused,reduced})??realDt;
 if(!battle.paused){spectatorClock+=realDt;simulate(scaled*battle.speed);}
 if(battle&&!battle.finished){
  root.ArenaAudio?.update?.({phase:'fight',paused:battle.paused,
   health:battle.heroes.reduce((hp,u)=>hp+Math.max(0,u.hp/u.maxHp),0)/Math.max(1,battle.heroes.length),
   distance:360});
  if(timestamp-drawTick>140){drawTick=timestamp;status();}
  paint();frameId=requestAnimationFrame(loop);
 }else frameId=0;
}
// One success-first scoreboard for both natural KO and voluntary finish.
// No penalty/failure label: the meaningful result is the distance and growth.
function practiceSummary(snap={},results={}){
 const integer=(n,fallback=0)=>{const x=Number(n);return Number.isFinite(x)?Math.max(0,Math.trunc(x)):fallback;};
 const reached=integer(snap.wave),cleared=Math.min(reached,integer(snap.clearedWave));
 return {reached,cleared,kills:integer(snap.kills),best:integer(results.best)};
}
function finish(quit){
 if(!battle||battle.finished)return;
 battle.finished=true;cancelAnimationFrame(frameId);frameId=0;
 root.ArenaAudio?.endMatch?.();
 if(!quit)root.ArenaAudio?.play?.('defeat',{gain:.72});
 const snap=battle,payout={};
 for(const h of snap.heroes)payout[h.index]=h.exp;
 const results=api()?.practiceReward?.(payout,snap.wave,snap.kills,quit)||{awards:[],best:0,totalXp:0};
 $('.ep-selection').hidden=true;$('.ep-combat').hidden=true;$('.ep-result').hidden=false;
 const accomplishment=practiceSummary(snap,results);
 $('#epResultTitle').textContent=accomplishment.reached.toLocaleString('ko-KR')+'단계 도달';
 $('#epResultCleared').textContent=accomplishment.cleared.toLocaleString('ko-KR');
 $('#epResultKills').textContent=accomplishment.kills.toLocaleString('ko-KR');
 $('#epResultBest').textContent=accomplishment.best.toLocaleString('ko-KR');
 $('#epRewards').innerHTML=(results.awards||[]).map(x=>'<div class="ep-reward"><strong>'+safe(x.name)+
  '</strong><span>EXP +'+x.xp+'</span><small>Lv.'+x.level+(x.levels?' · LEVEL UP +'+x.levels:'')+'</small></div>').join('');
 $('#epRecord').textContent='최고 '+results.best+'단계';
 battle=null;prev=0;
}
function close(){
 if(battle&&!battle.finished)finish(true);
 cancelAnimationFrame(frameId);frameId=0;prev=0;battle=null;
 if(screen)screen.hidden=true;
 root.ArenaAudio?.leave?.();
 root.LudusScene?.open();
}
if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&battle&&!battle.paused){battle.paused=true;prev=0;updateButtons();}
});
root.LudusPractice={open,close,isOpen:display,rules:{eligible,waveSize,enemyHP,enemyAttack,waveXP,killXP,enemyFor,courtsForParty,courtAssignments,courtPerspective,unitPerspective,executionerCourtScale,neutralBody,pairBodyGap,experienceMultiplier,experienceAward,engagementBonusRules,deathFrame,practiceSummary}};
if(typeof module!=='undefined')module.exports=root.LudusPractice.rules;
})(typeof window!=='undefined'?window:globalThis);
