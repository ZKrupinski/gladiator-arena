
const HEAD_DATA={"murmillo":"./assets/characters/murmillo/head/face.png","thraex":"./assets/characters/thraex/head/face.png","retiarius":"./assets/characters/retiarius/head/face.png"};
/* GLADIATOR: The Gladius Renaissance — HTML5 2D prototype v1.4
   Original supplied art is used for the character face sprites and title background.
   No external packages, CDN, or online services are required. */
(() => {
'use strict';
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const canvas = $('#game'), ctx = canvas.getContext('2d', {alpha:false});
const W=1200,H=675,GROUND=535,TAU=Math.PI*2,WORLD_W=2200;
const COLORS={gold:'#f4d69a',bronze:'#a77335',cream:'#fdebc4'};
/* Live asset manifest: single source for stats/render settings. */
const ASSET_MANIFEST={"schemaVersion":"1.0","gameVersion":"1.4","renderPolicy":"preserve-original-composite-sprites","coordinates":{"facing":"+x","ground":"feet-baseline","spriteCanvas":[320,320]},"notes":["Current six poses per class remain composite sprites; per-layer images are NOT yet created.","Metadata is live-wired for fighter stats and draw dimensions.","Standalone HTML embeds manifest and sprites; JSON/assets are included separately for further production.","v1.3: independent body/equipment art remains unavailable; pickup and armor states are logical layers over original composite sprites."],"classes":{"murmillo":{"id":"murmillo","displayName":"무르밀로","renderMode":"composite","stats":{"maxHp":110,"maxSt":95,"damage":12,"speed":198,"reach":150,"shield":95,"helm":82,"body":114,"weapon":82,"grip":88,"special":"방패 강타","specialCd":6.7,"latin":"MURMILLO","name":"무르밀로"},"canvas":{"width":320,"height":320,"feetBaseline":300,"bodyPivot":[160,300]},"render":{"height":236,"yOffset":-2,"anchor":0.52},"animations":{"idle":{"composite":"assets/characters/murmillo/composite/idle.webp","layers":{"base":null,"head":null,"helmet":null,"armor":null,"shield":null,"weapon":null,"offhand":null}},"walk":{"composite":"assets/characters/murmillo/composite/walk.webp","layers":{"base":null,"head":null,"helmet":null,"armor":null,"shield":null,"weapon":null,"offhand":null}},"high":{"composite":"assets/characters/murmillo/composite/high.webp","layers":{"base":null,"head":null,"helmet":null,"armor":null,"shield":null,"weapon":null,"offhand":null}},"mid":{"composite":"assets/characters/murmillo/composite/mid.webp","layers":{"base":null,"head":null,"helmet":null,"armor":null,"shield":null,"weapon":null,"offhand":null}},"low":{"composite":"assets/characters/murmillo/composite/low.webp","layers":{"base":null,"head":null,"helmet":null,"armor":null,"shield":null,"weapon":null,"offhand":null}},"guard":{"composite":"assets/characters/murmillo/composite/guard.webp","layers":{"base":null,"head":null,"helmet":null,"armor":null,"shield":null,"weapon":null,"offhand":null}}},"defaultEquipment":{"helmet":"murmillo_helmet","armor":"murmillo_armor","shield":"scutum","weapon":"gladius"},"layerStatus":"not-yet-separated"},"thraex":{"id":"thraex","displayName":"트라에키스","renderMode":"composite","stats":{"maxHp":91,"maxSt":110,"damage":10,"speed":252,"reach":158,"shield":54,"helm":65,"body":96,"weapon":74,"grip":84,"special":"곡검 연격","specialCd":6.3,"latin":"THRAEX","name":"트라에키스"},"canvas":{"width":320,"height":320,"feetBaseline":300,"bodyPivot":[160,300]},"render":{"height":232,"yOffset":-1,"anchor":0.52},"animations":{"idle":{"composite":"assets/characters/thraex/composite/idle.webp","layers":{"base":null,"head":null,"helmet":null,"armor":null,"shield":null,"weapon":null,"offhand":null}},"walk":{"composite":"assets/characters/thraex/composite/walk.webp","layers":{"base":null,"head":null,"helmet":null,"armor":null,"shield":null,"weapon":null,"offhand":null}},"high":{"composite":"assets/characters/thraex/composite/high.webp","layers":{"base":null,"head":null,"helmet":null,"armor":null,"shield":null,"weapon":null,"offhand":null}},"mid":{"composite":"assets/characters/thraex/composite/mid.webp","layers":{"base":null,"head":null,"helmet":null,"armor":null,"shield":null,"weapon":null,"offhand":null}},"low":{"composite":"assets/characters/thraex/composite/low.webp","layers":{"base":null,"head":null,"helmet":null,"armor":null,"shield":null,"weapon":null,"offhand":null}},"guard":{"composite":"assets/characters/thraex/composite/guard.webp","layers":{"base":null,"head":null,"helmet":null,"armor":null,"shield":null,"weapon":null,"offhand":null}}},"defaultEquipment":{"helmet":"thraex_helmet","armor":"thraex_armor","shield":"parmula","weapon":"sica"},"layerStatus":"not-yet-separated"},"retiarius":{"id":"retiarius","displayName":"레티아리우스","renderMode":"composite","stats":{"maxHp":88,"maxSt":114,"damage":11,"speed":230,"reach":196,"shield":0,"helm":0,"body":92,"weapon":80,"grip":92,"special":"투망 던지기","specialCd":8.4,"latin":"RETIARIUS","name":"레티아리우스"},"canvas":{"width":320,"height":320,"feetBaseline":300,"bodyPivot":[160,300]},"render":{"height":233,"yOffset":-2,"anchor":0.52},"animations":{"idle":{"composite":"assets/characters/retiarius/composite/idle.webp","layers":{"base":null,"head":null,"helmet":null,"armor":null,"shield":null,"weapon":null,"offhand":null}},"walk":{"composite":"assets/characters/retiarius/composite/walk.webp","layers":{"base":null,"head":null,"helmet":null,"armor":null,"shield":null,"weapon":null,"offhand":null}},"high":{"composite":"assets/characters/retiarius/composite/high.webp","layers":{"base":null,"head":null,"helmet":null,"armor":null,"shield":null,"weapon":null,"offhand":null}},"mid":{"composite":"assets/characters/retiarius/composite/mid.webp","layers":{"base":null,"head":null,"helmet":null,"armor":null,"shield":null,"weapon":null,"offhand":null}},"low":{"composite":"assets/characters/retiarius/composite/low.webp","layers":{"base":null,"head":null,"helmet":null,"armor":null,"shield":null,"weapon":null,"offhand":null}},"guard":{"composite":"assets/characters/retiarius/composite/guard.webp","layers":{"base":null,"head":null,"helmet":null,"armor":null,"shield":null,"weapon":null,"offhand":null}}},"defaultEquipment":{"helmet":null,"armor":"retiarius_armor","shield":null,"weapon":"trident","offhand":"net"},"layerStatus":"not-yet-separated"}},"equipment":{"gladius":{"slot":"weapon","class":"murmillo","durability":82,"grip":88,"art":null,"dropArt":null},"scutum":{"slot":"shield","class":"murmillo","durability":95,"art":null,"dropArt":null},"murmillo_helmet":{"slot":"helmet","class":"murmillo","durability":82,"art":null,"dropArt":null},"murmillo_armor":{"slot":"armor","class":"murmillo","durability":114,"art":null,"dropArt":null},"sica":{"slot":"weapon","class":"thraex","durability":74,"grip":84,"art":null,"dropArt":null},"parmula":{"slot":"shield","class":"thraex","durability":54,"art":null,"dropArt":null},"thraex_helmet":{"slot":"helmet","class":"thraex","durability":65,"art":null,"dropArt":null},"thraex_armor":{"slot":"armor","class":"thraex","durability":96,"art":null,"dropArt":null},"trident":{"slot":"weapon","class":"retiarius","durability":80,"grip":92,"art":null,"dropArt":null},"net":{"slot":"offhand","class":"retiarius","durability":55,"art":null,"dropArt":null},"retiarius_armor":{"slot":"armor","class":"retiarius","durability":92,"art":null,"dropArt":null}},"background":{"arena":"assets/backgrounds/colosseum/arena.webp"},"fx":{"parry":"procedural-canvas","hit":"procedural-canvas","net":"procedural-canvas"},"assetPipeline":{"layeredAvatarReady":false,"requiredLayers":["base","head","helmet","armor","shield","weapon","offhand"],"requiredStates":["idle","walk","high","mid","low","guard"]},"combatProfiles":{"murmillo":{"approachDistance":125,"aggression":0.66,"parryBias":0.38,"retreatBias":0.16,"specialPreference":"shield_bash"},"thraex":{"approachDistance":100,"aggression":0.81,"parryBias":0.2,"retreatBias":0.12,"specialPreference":"sica_combo"},"retiarius":{"approachDistance":205,"aggression":0.42,"parryBias":0.08,"retreatBias":0.54,"specialPreference":"cast_net"}},"battleSettings":{"pickupRadius":100,"pickupCooldownSeconds":0.85,"equipmentLifetimeSeconds":26,"armorBreakAtFraction":0.4,"armorPickupRestoreFraction":0.4,"cameraCloseDistance":820,"cameraPlayerOffset":0.4}};
const META=Object.fromEntries(Object.entries(ASSET_MANIFEST.classes).map(([id,item])=>[id,item.stats]));
const SPECIAL_LABEL={murmillo:'GLADIUS RUSH',thraex:'HOOK CUT',retiarius:'NET CAST'};
const heads={};for(const n of Object.keys(META)) {heads[n]=new Image();heads[n].src=HEAD_DATA[n];}
const BG_ARENA = new Image(); BG_ARENA.src='./assets/backgrounds/colosseum/arena.webp';
const PICKUP_RANGE=ASSET_MANIFEST.battleSettings.pickupRadius;
const game={phase:'menu', selected:'murmillo',round:1,totalRounds:3,elapsed:0,time:90,crowd:0,particles:[],drops:[],flying:[],texts:[],camera:0,quake:0,flash:0,freeze:0,finisherTime:0,finisherDuration:1.25,finisherWinner:null,finisherLoser:null,finisherWon:false,finisherProgress:0,player:null,enemy:null,paused:false,resultWon:false,goldEarned:0,toastTime:0,toastText:'',last:0,awaiting:false,mute:false,trainingShown:false};
const inp={left:false,right:false,guard:false};
let profile;
try {profile=JSON.parse(localStorage.getItem('gladiator_ludus_v04'))||{};}catch(e){profile={};}
profile={gold:100,wins:0,honor:0,hpTraining:0,stTraining:0,...profile};
const save=()=>{try{localStorage.setItem('gladiator_ludus_v04',JSON.stringify(profile));}catch(e){}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const rand=(a,b)=>a+Math.random()*(b-a);
function show(el,on=true){$(el).classList.toggle('hidden',!on);}
function updateProfile(){ $('#goldCount').textContent=profile.gold;$('#winCount').textContent=profile.wins;$('#honorCount').textContent=profile.honor;$('#trainHp').disabled=profile.gold<120||profile.hpTraining>=8;$('#trainSt').disabled=profile.gold<120||profile.stTraining>=8; }
function inform(msg,sec=1.1){game.toastTime=sec;game.toastText=msg;const el=$('#toast');el.textContent=msg;el.classList.add('show');}
function clearToast(){ $('#toast').classList.remove('show');game.toastTime=0; }
function train(which){if(profile.gold<120)return;if(which==='hp'&&profile.hpTraining>=8)return;if(which==='st'&&profile.stTraining>=8)return;profile.gold-=120;if(which==='hp') profile.hpTraining=Math.min(8,profile.hpTraining+1);else profile.stTraining=Math.min(8,profile.stTraining+1);save();updateProfile();inform('루두스 훈련 완료',1.3);}
$('#trainHp').addEventListener('click',()=>train('hp'));$('#trainSt').addEventListener('click',()=>train('st'));
$$('.class-card').forEach(b=>b.addEventListener('click',()=>{game.selected=b.dataset.class;$$('.class-card').forEach(x=>x.classList.toggle('selected',x===b));audio.click();}));

// Procedural sound: filtered noise, short metallic impacts, footsteps, crowd swell.
let ac, soundEnabled=true;
function initAudio(){if(!soundEnabled)return;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)(); if(ac.state==='suspended')ac.resume();}catch(e){}}
const audio={
  click(){tone(330,.055,'sine',.08)},
  swing(){noise(.11,900,.10);tone(180,.09,'triangle',.05)},
  hit(){noise(.16,410,.22);tone(100,.2,'triangle',.12)},
  block(){noise(.12,1700,.16);tone(390,.13,'triangle',.10)},
  parry(){noise(.17,2800,.17);tone(790,.26,'sine',.14)},
  dodge(){noise(.12,530,.09)},
  win(){[440,554,659,880].forEach((f,i)=>tone(f,.25,'sine',.09,i*.1));},
  lose(){[260,214,160].forEach((f,i)=>tone(f,.32,'sine',.08,i*.12));},
  crowd(){noise(.8,240,.07);noise(.5,650,.05)}
};
function tone(freq,dur,type='sine',vol=.09,delay=0){if(!ac||!soundEnabled)return;try{const t=ac.currentTime+delay,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+dur+.015);}catch(e){}}
function noise(dur,frequency,vol){if(!ac||!soundEnabled)return;try{let rate=ac.sampleRate,n=Math.floor(dur*rate),buf=ac.createBuffer(1,n,rate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);let src=ac.createBufferSource(),filter=ac.createBiquadFilter(),g=ac.createGain();for(let a of [src,filter]){} src.buffer=buf;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.5;g.gain.value=vol;src.connect(filter).connect(g).connect(ac.destination);src.start();}catch(e){}}
$('#muteBtn').addEventListener('click',()=>{soundEnabled=!soundEnabled;$('#muteBtn').innerHTML=soundEnabled?'◖)) <span>사운드 ON</span>':'◖ <span>사운드 OFF</span>';if(soundEnabled)initAudio();});

function fighter(kind,x,side,enemy=false){
  let m=META[kind],bonus=enemy?0:(profile.hpTraining*8),sbonus=enemy?0:(profile.stTraining*8);
  let maxHp=m.maxHp+bonus,maxSt=m.maxSt+sbonus;let waveBonus=enemy?(game.round-1)*13:0;
  const bodyRadius = kind==='murmillo'?62:kind==='thraex'?56:58;
  return {kind,m,x,y:GROUND,facing:side,enemy,maxHp:maxHp+waveBonus,hp:maxHp+waveBonus,maxSt,st:maxSt,
    shieldHp:m.shield,helmHp:m.helm,bodyHp:m.body,weaponHp:m.weapon,gripHp:m.grip,
    maxShieldHp:m.shield,maxHelmHp:m.helm,maxBodyHp:m.body,maxWeaponHp:m.weapon,maxGripHp:m.grip,
    guard:false,guardTime:0,legSlow:0,action:'idle',actionT:0,actionDur:0,hitDone:false,dodgeI:0,dodgeFx:0,parryFx:0,stunned:0,netted:0,exhausted:0,cd:0,attackCd:0,stDelay:0,walk:0,vx:0,knock:0,hurtFlash:0,damageDealt:0,hitCount:0,combo:0,comboT:0,aiWait:.5,aiMood:'approach',disarmed:false,armLost:0,dead:false,shieldDropped:false,helmDropped:false,weaponDropped:false,bodyArmorDropped:false,parryCount:0,pickedCount:0,specialCount:0,pickupTimer:0,finishPose:0,weakenedGrip:false,taunt:0,bodyRadius,dash:0,dashTime:0,counterReady:0,counterFx:0,isCounter:false};
}
function enter(){initAudio();game.round=1;startFight();}
function startFight(){show('#pickupHint',false);$('[data-control="pickup"]').classList.remove('pickup-ready');game.phase='fight';game.paused=false;game.time=90;game.elapsed=0;game.quake=0;game.flash=0;game.freeze=0;game.finisherTime=0;game.finisherWinner=null;game.finisherLoser=null;game.crowd=0;game.camera=0;game.particles=[];game.drops=[];game.flying=[];game.texts=[];clearToast();game.player=fighter(game.selected,360,1,false);const enemyType=['thraex','murmillo','retiarius'][(game.round-1+(game.selected==='thraex'?1:0))%3];game.enemy=fighter(enemyType,WORLD_W-360,-1,true);game.enemy.hp+=5*(game.round-1);game.enemy.maxHp+=5*(game.round-1);game.enemy.m={...game.enemy.m,damage:game.enemy.m.damage+(game.round-1)*2};game.resultWon=false;game.goldEarned=0;$('#roundCount').textContent=`${['Ⅰ','Ⅱ','Ⅲ'][game.round-1]} / Ⅲ`;$('#playerName').textContent=game.player.m.latin;$('#enemyName').textContent=game.enemy.m.latin;$('#playerHpText').textContent=`${Math.ceil(game.player.hp)} / ${game.player.maxHp}`;$('#enemyHpText').textContent=`${Math.ceil(game.enemy.hp)} / ${game.enemy.maxHp}`;show('#menu',false);show('#hud');show('#touchControls');show('#pauseBtn');show('#result',false);show('#pauseBanner',false);inform(['Ⅰ · 입문 검투 경기','Ⅱ · 명예의 결투','Ⅲ · 최후의 도전자'][game.round-1],1.3);resetInputs();}
function resetInputs(){for(const k in inp)inp[k]=false; $$('.control-btn').forEach(b=>b.classList.remove('pressed'));}
function setPause(){if(game.phase!=='fight')return;game.paused=!game.paused;show('#pauseBanner',game.paused);$('#pauseBtn').textContent=game.paused?'▶':'Ⅱ';}
$('#startBtn').addEventListener('click',enter);$('#pauseBtn').addEventListener('click',setPause);$('#pauseBanner').addEventListener('click',setPause);
$('#nextBtn').addEventListener('click',()=>{if(game.resultWon&&game.round<game.totalRounds){game.round++;startFight();}else{game.round=1;startFight();}});
$('#menuBtn').addEventListener('click',menuReturn);
function menuReturn(){show('#pickupHint',false);$('[data-control="pickup"]').classList.remove('pickup-ready');game.phase='menu';game.paused=false;show('#menu');show('#result',false);show('#hud',false);show('#touchControls',false);show('#pauseBtn',false);show('#pauseBanner',false);resetInputs();updateProfile();clearToast();}
function helpOpen(){show('#help');if(game.phase==='fight'&&!game.paused){game.paused=true;show('#pauseBanner',true);$('#pauseBtn').textContent='▶';}}
function helpClose(){show('#help',false);}
$('#helpBtn').addEventListener('click',helpOpen);$('#closeHelp').addEventListener('click',helpClose);

const moves={KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',KeyK:'guard',ShiftLeft:'guard',Space:'attack',KeyJ:'attack',KeyL:'dodge',KeyI:'special',KeyE:'pickup'};
function command(which,down){if(['left','right','guard'].includes(which))inp[which]=down;else if(down&&game.phase==='fight'&&!game.paused){if(which==='attack')attempt(game.player,'attack');if(which==='dodge')attempt(game.player,'dodge');if(which==='special')attempt(game.player,'special');if(which==='pickup')tryPickup(game.player);}}
window.addEventListener('keydown',e=>{if(moves[e.code]){e.preventDefault();if(!e.repeat||['left','right','guard'].includes(moves[e.code]))command(moves[e.code],true);}else if(e.code==='KeyP'||e.code==='Escape'){e.preventDefault();if(!$('#help').classList.contains('hidden'))helpClose();else setPause();}else if(e.code==='Enter'&&game.phase==='menu')enter();});
window.addEventListener('keyup',e=>{if(moves[e.code]){e.preventDefault();command(moves[e.code],false);}});
window.addEventListener('blur',()=>{resetInputs();if(game.phase==='fight'&&!game.paused)setPause();});
$$('[data-control]').forEach(b=>{let which=b.dataset.control;const stop=e=>{if(e.cancelable)e.preventDefault();command(which,false);b.classList.remove('pressed');};b.addEventListener('pointerdown',e=>{if(e.cancelable)e.preventDefault();initAudio();b.classList.add('pressed');b.setPointerCapture?.(e.pointerId);command(which,true);});b.addEventListener('pointerup',stop);b.addEventListener('pointercancel',stop);b.addEventListener('lostpointercapture',()=>{command(which,false);b.classList.remove('pressed');});});
canvas.addEventListener('pointerdown',()=>{if(game.paused)setPause();});

function canAct(f){return !f.dead&&f.stunned<=0&&f.exhausted<=0&&f.actionT<=0&&f.netted<=0;}
function useSt(f,amount){if(f.st<amount)return false;f.st-=amount;f.stDelay=.78;if(f.st<=0){f.st=0;f.exhausted=1.1;addText(f.x,f.y-205,'탈진!', '#f4bd7d');}return true;}
function attempt(f,action){if(game.phase!=='fight'||game.paused||!canAct(f))return false;let cost=action==='attack'?(f.disarmed?8:19):action==='dodge'?23:action==='special'?33:0;if(action==='special'&&(f.cd>0||f.disarmed))return false;if(!useSt(f,cost)){if(!f.enemy)inform('스태미나 부족!',.65);return false;}f.guard=false;f.guardTime=0;f.action=action;if(action==='attack'){f.attackZone=(f.attackSerial||0)%3;f.attackSerial=(f.attackSerial||0)+1;}else if(action==='special'){f.attackZone=f.kind==='retiarius'?1:0;}f.actionT=action==='attack'?.47:action==='dodge'?.42: .72;f.actionDur=f.actionT;f.hitDone=false;f.secondHitDone=false;f.walk=0;
if(action==='dodge'){f.dodgeI=.38;f.dodgeFx=.46;f.dash=-f.facing*480;f.dashTime=.18;f.knock=-f.facing*32;audio.dodge();spawnDust(f.x,f.y,12);addText(f.x,f.y-215,'EVADE','#bfefff');addParticle(f.x,f.y-96,'#dff8ff',18,.82);}if(action==='attack'){if(f.counterReady>0){f.isCounter=true;f.counterReady=0;f.counterFx=.55;f.dash=f.facing*420;f.dashTime=.18;game.flash=Math.max(game.flash,.08);addText(f.x+f.facing*18,f.y-228,'COUNTER!','#ffd56d');addParticle(f.x+f.facing*20,f.y-130,'#ffe2a8',18,1);}else{f.isCounter=false;f.dash=f.facing*260;f.dashTime=.12;}audio.swing();}
if(action==='special'){f.specialCount++;f.cd=f.m.specialCd;f.dash=f.facing*(f.kind==='thraex'?420:380);f.dashTime=.2;game.flash=Math.max(game.flash,.12);f.counterFx=Math.max(f.counterFx,.58); audio.swing();addText(f.x+f.facing*28,f.y-218,SPECIAL_LABEL[f.kind]+'!','#ffe7b2');addParticle(f.x+f.facing*28,f.y-135,'#f7e4b6',18,1);if(f.kind==='retiarius'){
  game.flying.push({x:f.x+f.facing*65,y:f.y-124,vx:f.facing*600,owner:f,life:.88,kind:'net',rot:0});
 }}return true;}
function addText(x,y,text,color='#ffe6a5'){game.texts.push({x,y,text,color,life:.8,max:.8});}
function addParticle(x,y,color,n=13,power=1){for(let i=0;i<n;i++)game.particles.push({x,y,vx:rand(-250,250)*power,vy:rand(-250,40)*power,gravity:640,life:rand(.18,.65),max:.65,r:rand(1.7,4.2)*power,color});}
function spawnDust(x,y,n=7){for(let i=0;i<n;i++)game.particles.push({x:x+rand(-35,35),y:y-5,vx:rand(-140,140),vy:rand(-70,-8),gravity:90,life:rand(.3,.6),max:.6,r:rand(2,8),color:'#e8c793'});}
function crowd(amount){game.crowd=clamp(game.crowd+amount,0,100);if(game.crowd>=95&&Math.random()<.18)audio.crowd();}
function spawnDrop(kind,x,y,opts={}){game.drops.push({kind,x,y,vx:opts.vx??rand(-90,90),vy:opts.vy??rand(-260,-120),gravity:opts.gravity??690,life:opts.life??5.8,rot:opts.rot??rand(-.6,.6),spin:opts.spin??rand(-6,6),scale:opts.scale??1,bounce:opts.bounce??.24,source:opts.source||null,pickable:!!opts.pickable});}
function spawnFragments(x,y,kind,count=4){for(let i=0;i<count;i++)spawnDrop(kind,x+rand(-16,16),y-rand(35,120),{vx:rand(-210,210),vy:rand(-310,-90),life:rand(3.2,6),scale:rand(.55,1.05),spin:rand(-10,10),bounce:.32});}
function partStatusMarkup(f){const pct=(v,m)=>m>0?Math.max(0,Math.ceil(100*v/m)):0;return `HEAD <b>${pct(f.helmHp,f.maxHelmHp)}</b> BODY <b>${pct(f.bodyHp,f.maxBodyHp)}</b> WEAPON <b>${pct(f.weaponHp,f.maxWeaponHp)}</b> SHIELD <b>${pct(f.shieldHp,f.maxShieldHp)}</b> GRIP <b>${pct(f.gripHp,f.maxGripHp)}</b>`;}
function applyDurabilityDamage(a,b,zone,special){let burstY=b.y-140; if(zone===0){ if(b.helmHp>0){b.helmHp-=special?28:16; burstY=b.y-214; if(b.helmHp<=0)breakEquipment(b,'helm'); } b.weaponHp=Math.max(0,b.weaponHp-(special?10:6)); if(b.weaponHp<=0&&!b.disarmed)breakEquipment(b,'weapon'); } else if(zone===1){ b.bodyHp=Math.max(0,b.bodyHp-(special?17:10)); if(b.shieldHp>0){b.shieldHp-=special?20:11; if(b.shieldHp<=0)breakEquipment(b,'shield');}} else { b.bodyHp=Math.max(0,b.bodyHp-(special?14:9)); b.gripHp=Math.max(0,b.gripHp-(special?18:12)); if(b.gripHp<=0&&!b.weakenedGrip){b.weakenedGrip=true; addText(b.x,b.y-214,'GRIP BREAK!','#ffe7aa'); spawnFragments(b.x,b.y,'strap',5);} if((b.gripHp<=0||b.weaponHp<15)&&!b.disarmed&&Math.random()<.28){breakEquipment(b,'weapon');} } if(!b.bodyArmorDropped && b.bodyHp>0 && b.bodyHp<=b.maxBodyHp*ASSET_MANIFEST.battleSettings.armorBreakAtFraction)breakEquipment(b,'armor');if(b.bodyHp>0&&b.bodyHp<26&&Math.random()<.18)spawnFragments(b.x,burstY,'armor',2);}

function doHit(a,b,special=false){if(a.dead||b.dead||game.phase!=='fight')return;
const dist=Math.abs(a.x-b.x);let reach=a.m.reach+(special?38:0)+((a.isCounter)?18:0);if(dist>reach||Math.sign(b.x-a.x)!==a.facing)return;
if(b.dodgeI>0){addText(b.x,b.y-165,'DODGE','#fcf3dd');crowd(7);return;}
const zone=(a.attackZone||0);
const counter=!!a.isCounter;
let damage=(a.disarmed?4:a.m.damage)*((special?1.6:1)*(counter?1.42:1))*rand(.88,1.17),stun=.21;
// Distinct targeting: head = critical chance, body = shield/body damage, legs = mobility + grip.
if(b.netted>0){damage*=1.28;stun+=.18;addText(b.x,b.y-247,'NET COMBO','#ffe29e');if(a.kind==='retiarius'){const pull=Math.min(115,Math.abs(b.x-a.x)*.35);b.x-=Math.sign(b.x-a.x)*pull;spawnDust(b.x,b.y,8);addText(b.x,b.y-285,'NET PULL!','#dcf4cc');}}
if(zone===0)damage*=1.13; if(zone===1)damage*=1.05; if(zone===2){stun+=.12;b.legSlow=Math.max(b.legSlow||0,1.3);}
if(counter)stun+=.14;if(b.bodyArmorDropped)damage*=1.12;
if(special&&a.kind==='murmillo')stun=.76;
if(b.guard&&b.st>7){let perfect=b.guardTime<.22&&b.stunned<=0;
  if(perfect){a.stunned=1.0;a.actionT=0;a.action='stunned';a.st=Math.max(0,a.st-24);a.knock=b.facing*58;b.parryFx=.46;b.counterReady=.95;b.counterFx=.95;b.parryCount++;game.freeze=Math.max(game.freeze,.06);game.flash=Math.max(game.flash,.18);addText(b.x,b.y-245,'PERFECT PARRY!','#fff6ba');addText(b.x,b.y-282,'COUNTER READY','#ffe082');addParticle((a.x+b.x)/2,b.y-150,'#ffefbb',32,1.5);spawnDust(b.x,b.y,12);crowd(23);audio.parry();game.quake=14;return;}
  let absorb=b.shieldHp>0? .88:.62; if(b.weakenedGrip) absorb-=.16; damage*=1-absorb;
  if(special&&a.kind==='murmillo'){b.st=Math.max(0,b.st-29);b.knock=a.facing*62;addText(b.x,b.y-260,'GUARD CRUSH!','#ffe9a8');game.quake=Math.max(12,game.quake);}
  if(b.shieldHp>0){b.shieldHp-=special?27:17;if(b.shieldHp<=0)breakEquipment(b,'shield');}
  b.gripHp=Math.max(0,b.gripHp-(special?12:7)); if(b.gripHp<=0&&!b.weakenedGrip){b.weakenedGrip=true;addText(b.x,b.y-205,'GRIP BREAK!','#ffe7aa');spawnFragments(b.x,b.y,'strap',4);} 
  if(!useSt(b,special?20:14)){damage+=9;stun=.35;}else stun=.04;
  addParticle((a.x+b.x)/2,b.y-134,'#ead6a5',13,.55);addText(b.x,b.y-220,'BLOCK','#ffe5a6');audio.block();crowd(5);
}else{
  game.quake=Math.min(18,game.quake+7);game.flash=.11;audio.hit();let hitHead=(zone===0&&b.helmHp>0)||(zone!==2&&Math.random()<.22&&b.helmHp>0);if(hitHead){b.helmHp-=special?38:21;if(b.helmHp<=0)breakEquipment(b,'helm');}
  if(b.helmHp<=0&&zone===0&&Math.random()<.35){damage*=1.45;addText(b.x,b.y-255,'CRITICAL!','#ff9074');}
  applyDurabilityDamage(a,b,zone,special);
  if(special&&a.kind==='murmillo'){b.knock=a.facing*84;addText(b.x,b.y-279,'SHIELD IMPACT!','#ffe4a6');}
  addParticle(b.x,b.y-(hitHead?204:119),Math.random()<.55?'#f6d29a':'#b94a34',19,1.1);if(counter||special){addParticle(b.x,b.y-148,'#ffe4a3',26,1.4);game.freeze=Math.max(game.freeze,counter?.08:.06);}crowd(7);b.knock=a.facing*(counter?66:(special?54:(zone===2?34:42)));a.knock=-a.facing*(special?8:(counter?14:3));b.stunned=stun;
}
let taken=Math.max(1,Math.round(damage));b.hp=clamp(b.hp-taken,0,b.maxHp);addText(b.x+rand(-10,15),b.y-130,`−${taken}`,'#ffb7a0');if(counter)addText(b.x,b.y-248,'COUNTER SLASH!','#ffe49f');if(special)addText(b.x,b.y-274,'FINISHER!','#ffd36a');const execution=((special||counter)&&b.hp>0&&b.hp<=Math.max(16,b.maxHp*.14));if(execution){game.freeze=Math.max(game.freeze,.11);game.flash=Math.max(game.flash,.2);game.quake=Math.max(game.quake,18);addText(b.x,b.y-302,'EXECUTE CHANCE!','#ffcf73');addParticle(b.x,b.y-160,'#ffe5a8',34,1.6);}b.hurtFlash=.17;a.damageDealt+=taken;a.hitCount++;if(counter){a.isCounter=false;a.counterFx=.72;}
if((b.bodyHp<=0||b.hp<=0)&&!b.dead){
 b.dead=true;b.guard=false;b.actionT=0;b.action='down';
 spawnDust(b.x,b.y,16);spawnFragments(b.x,b.y,'armor',6);spawnFragments(b.x,b.y,'gore',4);
 if(special||counter)beginFinisher(a,b);else finishFight(!game.player.dead&&game.enemy.dead);
}
}
function breakEquipment(f,part){
  if(part==='shield'&&!f.shieldDropped){f.shieldDropped=true;f.shieldHp=0;spawnDrop('shield',f.x-20,GROUND-12,{vx:rand(-180,180),vy:rand(-260,-140),life:ASSET_MANIFEST.battleSettings.equipmentLifetimeSeconds,scale:1.05,pickable:true,source:f.kind});spawnFragments(f.x,f.y-120,'armor',4);addText(f.x,f.y-215,'방패 파괴!','#facc77');crowd(15);audio.hit();}
  if(part==='helm'&&!f.helmDropped){f.helmDropped=true;f.helmHp=0;spawnDrop('helmet',f.x+25,GROUND-12,{vx:rand(-160,160),vy:rand(-280,-160),life:ASSET_MANIFEST.battleSettings.equipmentLifetimeSeconds,scale:1.02,pickable:true,source:f.kind});spawnFragments(f.x,f.y-200,'armor',4);addText(f.x,f.y-230,'투구 파괴!','#facc77');crowd(14);}
  if(part==='weapon'&&!f.weaponDropped){f.weaponDropped=true;f.disarmed=true;f.weaponHp=0;spawnDrop(f.kind==='retiarius'?'trident':'weapon',f.x+32,f.y-118,{vx:rand(-120,220)*f.facing,vy:rand(-280,-170),life:ASSET_MANIFEST.battleSettings.equipmentLifetimeSeconds,scale:1,pickable:true,source:f.kind});addText(f.x,f.y-200,'무기 이탈!','#ffcf83');crowd(18);audio.hit();}
  if(part==='armor'&&!f.bodyArmorDropped){f.bodyArmorDropped=true;spawnDrop('armorplate',f.x+f.facing*25,f.y-110,{vx:rand(-130,140),vy:-220,life:ASSET_MANIFEST.battleSettings.equipmentLifetimeSeconds,scale:1,pickable:true,source:f.kind});addText(f.x,f.y-215,'ARMOR BREAK!','#ffd591');spawnFragments(f.x,f.y-113,'armor',7);crowd(11);audio.hit();}
}
function tryPickup(f){
 if(!f||f.dead||game.phase!=='fight'||f.pickupTimer>0)return false;
 const eligible=game.drops.filter(d=>d.pickable&&d.life>0&&(!d.source||d.source===f.kind)&&Math.abs(d.x-f.x)<PICKUP_RANGE&&d.y>=GROUND-38);
 eligible.sort((a,b)=>Math.abs(a.x-f.x)-Math.abs(b.x-f.x));
 for(const d of eligible){let good=false;
   if((d.kind==='weapon'||d.kind==='trident')&&f.weaponDropped&&(d.kind==='trident')===(f.kind==='retiarius')){f.weaponDropped=false;f.disarmed=false;f.weaponHp=Math.max(25,f.maxWeaponHp*.5);good=true;}
   else if(d.kind==='shield'&&f.shieldDropped&&f.m.shield>0){f.shieldDropped=false;f.shieldHp=Math.max(24,f.maxShieldHp*.45);good=true;}
   else if(d.kind==='helmet'&&f.helmDropped&&f.kind!=='retiarius'){f.helmDropped=false;f.helmHp=Math.max(24,f.maxHelmHp*.45);good=true;}
   else if(d.kind==='armorplate'&&f.bodyArmorDropped){f.bodyArmorDropped=false;f.bodyHp=Math.max(f.bodyHp,Math.round(f.maxBodyHp*ASSET_MANIFEST.battleSettings.armorPickupRestoreFraction));good=true;}
   if(good){d.life=0;f.pickupTimer=ASSET_MANIFEST.battleSettings.pickupCooldownSeconds;f.pickedCount++;spawnDust(f.x,GROUND,9);addText(f.x,f.y-225,'EQUIPPED!','#aef6cb');audio.click();return true;}
 }
 if(!f.enemy)inform('회수할 장비가 가까이 없습니다',.7);
 return false;
}
function pickupCandidate(f){
 if(!f||f.dead)return null;
 return game.drops.filter(d=>d.pickable&&d.life>0&&(!d.source||d.source===f.kind)&&Math.abs(d.x-f.x)<PICKUP_RANGE&&d.y>=GROUND-38).filter(d=>
    ((d.kind==='weapon'||d.kind==='trident')&&f.weaponDropped&&(d.kind==='trident')===(f.kind==='retiarius')) ||
    (d.kind==='helmet'&&f.helmDropped) || (d.kind==='shield'&&f.shieldDropped) || (d.kind==='armorplate'&&f.bodyArmorDropped)
 ).sort((a,b)=>Math.abs(a.x-f.x)-Math.abs(b.x-f.x))[0]||null;
}
function updatePickupHint(){
 const d=pickupCandidate(game.player), el=$('#pickupHint'),btn=$('[data-control="pickup"]');
 el.classList.toggle('hidden',!d);btn.classList.toggle('pickup-ready',!!d);
 if(d){el.textContent='✦ E / 줍기 — '+({weapon:'무기',trident:'삼지창',helmet:'투구',shield:'방패',armorplate:'갑옷'}[d.kind]||'장비')+' 회수';}
}
function playerUpdate(dt){const f=game.player;if(f.dead)return;f.guard=inp.guard&&f.st>5&&canAct(f);if(f.guard){f.guardTime+=dt;f.st=Math.max(0,f.st-4*dt);f.stDelay=.25;if(f.st<=0)f.guard=false;}else f.guardTime=0;
const enemy=game.enemy;if(enemy&&!enemy.dead)f.facing=enemy.x>=f.x?1:-1;
if(canAct(f)&&!f.guard){let dir=(inp.right?1:0)-(inp.left?1:0);if(dir){const moveSign=dir*f.facing;f.vx=moveSign*f.m.speed*(f.legSlow>0?.65:1);f.walk+=dt*9;f.x+=f.vx*dt;}else f.vx=0;}else f.vx=0;}
function enemyUpdate(dt){const a=game.enemy,b=game.player;if(a.dead||b.dead)return;let dist=Math.abs(a.x-b.x),dir=b.x>a.x?1:-1;const ai=ASSET_MANIFEST.combatProfiles[a.kind];if(a.netted>0)a.guard=false;
  a.facing=dir;
  a.aiWait-=dt;if(a.aiWait<=0){a.aiWait=a.kind==='thraex'?rand(.1,.28):a.kind==='retiarius'?rand(.28,.57):rand(.22,.45);a.aiMood='approach';if(canAct(a)){
    if(dist<a.m.reach+(a.kind==='retiarius'?84:42)){if(b.action==='attack'&&b.actionT>.18&&a.st>20&&Math.random()<Math.min(.7,ai.parryBias+(game.round-1)*.08)){a.aiMood='guard';}else if(a.cd<=0&&a.st>44&&Math.random()<(.18+(game.round-1)*.05)){attempt(a,'special');}else if(Math.random()<ai.aggression){attempt(a,'attack');}else if(Math.random()<.16){attempt(a,'dodge');}else a.aiMood='guard';}
    else if(dist>340&&Math.random()<.16&&a.st>50)attempt(a,'dodge');
  }}
  a.guard=canAct(a)&&a.aiMood==='guard'&&dist<190&&a.st>10;
  if(a.guard){a.guardTime+=dt;a.st=Math.max(0,a.st-5*dt);a.stDelay=.2;}else a.guardTime=0;
  if(canAct(a)&&!a.guard){let ideal=ai.approachDistance;let moveDir=dist>ideal+25?dir:dist<ideal-23?-dir:0;if(moveDir){let speedMul=moveDir===dir?(game.round===1?.9:1.04):.98;a.vx=moveDir*a.m.speed*(a.legSlow>0?.65:1)*speedMul;a.x+=a.vx*dt;a.walk+=dt*9;}else a.vx=0;}
}
function sharedUpdate(f,dt){if(!f)return;f.actionT=Math.max(0,f.actionT-dt);f.stunned=Math.max(0,f.stunned-dt);f.legSlow=Math.max(0,(f.legSlow||0)-dt);f.netted=Math.max(0,f.netted-dt);f.dodgeI=Math.max(0,f.dodgeI-dt);f.dodgeFx=Math.max(0,(f.dodgeFx||0)-dt);f.parryFx=Math.max(0,(f.parryFx||0)-dt);f.counterReady=Math.max(0,(f.counterReady||0)-dt);f.counterFx=Math.max(0,(f.counterFx||0)-dt*.72);f.exhausted=Math.max(0,f.exhausted-dt);f.cd=Math.max(0,f.cd-dt);f.stDelay=Math.max(0,f.stDelay-dt);f.hurtFlash=Math.max(0,f.hurtFlash-dt);f.taunt=Math.max(0,f.taunt-dt);f.pickupTimer=Math.max(0,(f.pickupTimer||0)-dt);f.finishPose=Math.max(0,(f.finishPose||0)-dt);f.dashTime=Math.max(0,(f.dashTime||0)-dt);if((f.dashTime||0)>0)f.x+=(f.dash||0)*dt;f.knock*=Math.pow(.05,dt);f.x+=f.knock*dt*16;f.x=clamp(f.x,100,WORLD_W-100);
  if(f.stDelay<=0&&!f.guard)f.st=Math.min(f.maxSt,f.st+(f.exhausted>0?9:27)*dt);
  if(f.actionT<=0&&!f.dead&&!f.stunned)f.action='idle';
  if(f.action==='attack'&&!f.hitDone&&f.actionT<f.actionDur*.65){f.hitDone=true;doHit(f,f.enemy?game.player:game.enemy);}
  if(f.action==='special'&&!f.hitDone&&f.actionT<f.actionDur*.53){f.hitDone=true;
    if(f.kind==='murmillo')doHit(f,f.enemy?game.player:game.enemy,true);
    if(f.kind==='thraex'){doHit(f,f.enemy?game.player:game.enemy,true);const t=f.enemy?game.player:game.enemy;if(t&&!t.dead&&Math.abs(f.x-t.x)<175){t.stunned=Math.max(t.stunned,.32);crowd(4);}}
  }
  if(f.action==='special'&&f.kind==='thraex'&&f.hitDone&&!f.secondHitDone&&f.actionT<f.actionDur*.22){
    f.secondHitDone=true;const t=f.enemy?game.player:game.enemy;
    if(t&&!t.dead){f.attackZone=2;addText(f.x+f.facing*45,f.y-270,'DOUBLE CUT!','#ffd998');doHit(f,t,true);}
  }
}
function resolveFighterSpacing(){
  const a=game.player,b=game.enemy; if(!a||!b||a.dead||b.dead)return;
  let dx=b.x-a.x; let dist=Math.abs(dx)||0.001;
  let min=(a.bodyRadius||56)+(b.bodyRadius||56)-18;
  if(a.action==='attack'||b.action==='attack'||a.action==='special'||b.action==='special') min-=20;
  if(a.dodgeI>0||b.dodgeI>0) min-=10;
  if(dist<min){
    const sign=dx>=0?1:-1, overlap=min-dist;
    let aShare=a.dodgeI>0?0.25:0.5, bShare=b.dodgeI>0?0.25:0.5;
    if(a.guard||a.stunned>0) aShare=.35; if(b.guard||b.stunned>0) bShare=.35;
    const sum=(aShare+bShare)||1; aShare/=sum; bShare/=sum;
    a.x=clamp(a.x-sign*overlap*aShare,100,WORLD_W-100);
    b.x=clamp(b.x+sign*overlap*bShare,100,WORLD_W-100);
  }
  if(a.x>b.x){const mid=(a.x+b.x)/2; a.x=mid-1; b.x=mid+1;}
}
function projectilesUpdate(dt){for(let p of game.flying){p.x+=p.vx*dt;p.rot+=dt*15;p.life-=dt;let target=p.owner.enemy?game.player:game.enemy;if(target&&!target.dead&&Math.abs(target.x-p.x)<76){target.netted=1.55;target.stunned=Math.max(target.stunned,.55);target.hp=Math.max(0,target.hp-9);addText(target.x,target.y-225,'그물 속박!','#ffdf8c');crowd(18);addParticle(target.x,target.y-140,'#e5cfaa',20,1.1);spawnDust(target.x,target.y,8);audio.hit();if(target.hp===0){target.dead=true;finishFight(target!==game.player);}p.life=0;}}game.flying=game.flying.filter(p=>p.life>0);}
function beginFinisher(winner,loser){
 if(game.phase!=='fight')return;
 game.phase='finisher';game.finisherTime=1.25;game.finisherDuration=1.25;game.finisherProgress=0;
 game.finisherWinner=winner;game.finisherLoser=loser;game.finisherWon=!game.player.dead&&game.enemy.dead;
 winner.finishPose=1.25;loser.finishPose=1.25;
 game.freeze=0;game.flash=Math.max(game.flash,.31);game.quake=Math.max(game.quake,19);
 const label=winner.kind==='murmillo'?'GLADIUS EXECUTION':winner.kind==='thraex'?'SICA CROSS CUT':'RETIARIUS DOMINION';
 addText(loser.x,loser.y-303,label,'#ffe3a0');
 addParticle(loser.x,loser.y-130,winner.kind==='retiarius'?'#e5f2d5':'#ffcd79',52,1.5);
 show('#hud',false);show('#touchControls',false);show('#pauseBtn',false);show('#pickupHint',false);clearToast();
 crowd(24);audio.parry();
}
function finisherTick(dt){
 const elapsed=Math.min(.045,dt);
 game.finisherTime=Math.max(0,game.finisherTime-elapsed);
 game.finisherProgress=1-game.finisherTime/game.finisherDuration;
 game.elapsed+=elapsed*.35;game.quake=Math.max(0,game.quake-elapsed*23);game.flash=Math.max(0,game.flash-elapsed*.9);
 if(game.finisherWinner)game.finisherWinner.finishPose=game.finisherTime;
 if(game.finisherLoser)game.finisherLoser.finishPose=game.finisherTime;
 for(const p of game.particles){p.x+=p.vx*elapsed*.6;p.y+=p.vy*elapsed*.6;p.vy+=p.gravity*elapsed*.6;p.life-=elapsed*.75;}
 game.particles=game.particles.filter(p=>p.life>0);
 for(const t of game.texts){t.y-=elapsed*32;t.life-=elapsed*.7;}
 game.texts=game.texts.filter(t=>t.life>0);
 const a=game.finisherWinner,b=game.finisherLoser;
 if(a&&b){const focus=(a.x+b.x)/2-W/2;game.camera=lerp(game.camera,clamp(focus,0,WORLD_W-W),Math.min(1,elapsed*5));}
 if(game.finisherTime<=0)finishFight(game.finisherWon);
}
function finishFight(won){if(game.phase!=='fight'&&game.phase!=='finisher')return;game.phase='result';resetInputs();game.resultWon=won;audio[won?'win':'lose']();let bonus=Math.round(game.crowd*.5),earned=won?75+(game.round-1)*35+bonus:12;game.goldEarned=earned;profile.gold+=earned;if(won){profile.wins++;profile.honor+=Math.floor(game.crowd/15)+8;}save();updateProfile();show('#result');show('#touchControls',false);show('#pauseBtn',false);$('#resultHeading').textContent=won?(game.round===game.totalRounds?'CHAMPION!':'VICTORIA!'):'DEFEAT';$('#resultDesc').textContent=won?(game.round===game.totalRounds?'세 번의 결투를 모두 이겨 경기장의 영웅이 되었습니다.':'투기장에서 살아남았습니다. 다음 상대가 기다립니다.'):'검투사가 쓰러졌습니다. 루두스에서 다시 준비하세요.';$('#resultSeal').textContent=won?'✦':'⚔';$('#resultStats').innerHTML=`<span>획득 데나리우스 <b>+${earned} D</b></span><span>관중 호응 <b>${Math.round(game.crowd)}%</b></span><span>가한 피해 <b>${Math.round(game.player.damageDealt)}</b></span><span>패링 성공 <b>${game.player.parryCount}</b></span><span>장비 회수 <b>${game.player.pickedCount}</b></span>`;$('#nextBtn').textContent=won&&game.round<game.totalRounds?'다음 상대 →':'다시 도전 →';}
function tick(dt){if(game.phase==='finisher'){finisherTick(dt);return;}if(game.phase!=='fight'||game.paused)return;dt=Math.min(dt,.034);if(game.freeze>0){game.freeze=Math.max(0,game.freeze-dt);dt*=0.18;}game.elapsed+=dt;game.time-=dt;game.quake=Math.max(0,game.quake-dt*26);game.flash=Math.max(0,game.flash-dt);game.crowd=Math.max(0,game.crowd-dt*.65);if(game.time<=0){game.time=0;finishFight(game.player.hp>=game.enemy.hp);return;}
if(game.toastTime>0){game.toastTime-=dt;if(game.toastTime<=0)clearToast();}
// Update both before collision queries, then resolve the attack windows.
playerUpdate(dt);enemyUpdate(dt);sharedUpdate(game.player,dt);sharedUpdate(game.enemy,dt);resolveFighterSpacing();projectilesUpdate(dt);
for(let p of game.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.gravity*dt;p.life-=dt;}game.particles=game.particles.filter(p=>p.life>0);
for(let t of game.texts){t.y-=dt*56;t.life-=dt;}game.texts=game.texts.filter(t=>t.life>0);
for(let d of game.drops){d.vy+=(d.gravity||640)*dt;d.x+=(d.vx||0)*dt;d.y+=(d.vy||0)*dt;d.rot+=(d.spin||0)*dt;if(d.y>GROUND-6){d.y=GROUND-6;d.vy*=-(d.bounce||.22);d.vx*=.82;if(Math.abs(d.vy)<30)d.vy=0;}d.life-=dt;}game.drops=game.drops.filter(d=>d.life>0);updatePickupHint();
if(game.player&&game.enemy){const gap=Math.abs(game.player.x-game.enemy.x),close=ASSET_MANIFEST.battleSettings.cameraCloseDistance;const focus=gap>close?game.player.x-W*ASSET_MANIFEST.battleSettings.cameraPlayerOffset:(game.player.x+game.enemy.x)/2-W/2;game.camera=lerp(game.camera,clamp(focus,0,WORLD_W-W),Math.min(1,dt*4.1));}
$('#playerHp').style.width=(100*game.player.hp/game.player.maxHp)+'%';$('#enemyHp').style.width=(100*game.enemy.hp/game.enemy.maxHp)+'%';$('#playerSt').style.width=(100*game.player.st/game.player.maxSt)+'%';$('#enemySt').style.width=(100*game.enemy.st/game.enemy.maxSt)+'%';$('#playerHpText').textContent=`${Math.ceil(game.player.hp)} / ${game.player.maxHp}`;$('#enemyHpText').textContent=`${Math.ceil(game.enemy.hp)} / ${game.enemy.maxHp}`;$('#clock').textContent=Math.ceil(game.time);$('#crowdText').textContent=`관중 호응 ${Math.floor(game.crowd)}%`;$('#crowdFill').style.width=`${game.crowd}%`;$('#playerDurability').innerHTML=partStatusMarkup(game.player);$('#enemyDurability').innerHTML=partStatusMarkup(game.enemy);
const sp=$('[data-control="special"]'),label=$('#specialCd');label.textContent=game.player.cd>0?game.player.cd.toFixed(1)+'s':'✦';sp.classList.toggle('cooldown',game.player.cd>0);
}

function seeded(seed){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
const R=seeded(92185);
const arena=document.createElement('canvas');arena.width=W;arena.height=H;
const g=arena.getContext('2d');
function gradient(c,x,y,x2,y2,stops){let grad=c.createLinearGradient(x,y,x2,y2);stops.forEach(([s,col])=>grad.addColorStop(s,col));return grad;}
function rect(c,x,y,w,h,fill){c.fillStyle=fill;c.fillRect(x,y,w,h);}
function ellipse(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=fill;c.fill();}
function polygon(c,points,fill,stroke){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
function buildArena(){const c=g;
 rect(c,0,0,W,H,gradient(c,0,0,0,500,[[0,'#7c9c98'],[.24,'#c6b99a'],[.55,'#dfc292'],[1,'#ac7040']]));
 // Open-air amphitheatre upper ring
 ellipse(c,600,154,815,283,'#ad835c');ellipse(c,600,113,845,264,'#c89c66');ellipse(c,600,64,740,200,'#b5d3c2');
 // Sunlit upper walls and masonry
 polygon(c,[[0,75],[94,125],[160,181],[220,229],[980,229],[1035,180],[1110,124],[1200,74],[1200,400],[0,400]],gradient(c,0,80,0,410,[[0,'#a06940'],[.6,'#b68152'],[1,'#725036']]));
 // Arena arch tiers
 const tiers=[{y:165,h:74,color:'#cc9860',base:'#745238'},{y:249,h:102,color:'#b97c45',base:'#65422c'}];
 for(let tier of tiers){rect(c,0,tier.y,W,tier.h+19,tier.color);
  for(let j=0;j<17;j++){let x=j*75-22,ww=54,hh=tier.h*.73; c.beginPath();c.moveTo(x,tier.y+tier.h);c.lineTo(x,tier.y+hh*.55);c.bezierCurveTo(x,tier.y-5,x+ww,tier.y-5,x+ww,tier.y+hh*.55);c.lineTo(x+ww,tier.y+tier.h);c.closePath();c.fillStyle=tier.base;c.fill();c.fillStyle='#ecd1a0';c.fillRect(x-7,tier.y,7,tier.h);c.fillStyle='#e5b87f';c.fillRect(x+ww,tier.y,10,tier.h);}
  rect(c,0,tier.y+tier.h,W,15,'#725137');rect(c,0,tier.y+tier.h,W,4,'#e6b87a');}
 // Dark grandstand, crowd silhouettes/dots
 rect(c,0,370,W,72,gradient(c,0,360,0,449,[[0,'#3a2b28'],[.55,'#473328'],[1,'#835738']]));
 for(let i=0;i<2400;i++){let x=R()*W,y=R()*79+351;let col=['#362822','#714b36','#be7e48','#e0b277','#8b493c','#584236','#e0cc98'][Math.floor(R()*7)];ellipse(c,x,y,R()*2.3+.5,R()*2.6+.5,col);}
 // Roman pennants
 for(let i=0;i<8;i++){let x=55+i*161,y=102+(i%2)*27;rect(c,x,y-19,3,116,'#69462e');polygon(c,[[x+3,y],[x+29,y+3],[x+26,y+66],[x+17,y+53],[x+6,y+69]],i%2?'#bd4733':'#9b392d','#dbae75');ellipse(c,x+16,y+16,6,6,'#e3b75d');}
 // Arena wall
 rect(c,0,437,W,92,gradient(c,0,437,0,529,[[0,'#83583f'],[.25,'#d0a574'],[1,'#a67549']]));
 for(let i=0;i<18;i++){let x=i*76;rect(c,x,448,3,81,'#b4865e');rect(c,x,449,73,3,'#e0bd8c');}
 ellipse(c,600,529,850,110,'#b98a57');ellipse(c,600,549,870,117,'#dcb77a');
 // Sand foreground
 rect(c,0,510,W,H-510,gradient(c,0,510,0,H,[[0,'#e5be7e'],[.65,'#c79b5c'],[1,'#ad7843']]));
 for(let i=0;i<1700;i++){let x=R()*W,y=520+R()*170,col=['#edc78c','#edcf95','#99623b','#cf9f65','#b98f55'][Math.floor(R()*5)];ellipse(c,x,y,R()*2+.3,R()*.6+.2,col);}
 // Rim & decorative vignette
 rect(c,0,504,W,4,'#ae7e4e');let light=c.createRadialGradient(570,140,30,570,140,800);light.addColorStop(0,'#fff3b034');light.addColorStop(1,'#fff3b000');rect(c,0,0,W,H,light);
 // Arch lamps
 for(let i=0;i<6;i++){let x=63+i*220;ellipse(c,x,336,8,18,'#e7c277');ellipse(c,x,335,5,11,'#ffe39f');}
}
buildArena();

function drawShield(c,f){if(f.shieldHp<=0||f.m.shield<=0)return;
 const isBig=f.kind==='murmillo';let x=isBig?-33:-24,y=isBig?-116:-109,w=isBig?53:43,h=isBig?113:82;
 c.save();c.translate(x,y);c.rotate(f.guard?.12:-.1);
 c.shadowColor='#27140a85';c.shadowBlur=7;c.shadowOffsetX=-3;c.shadowOffsetY=5;
 const wood=gradient(c,-w/2,-h/2,w/2,h/2,[[0,'#ecbd76'],[.35,'#ad6732'],[.7,'#8a4e2c'],[1,'#e6bb75']]);
 if(isBig){polygon(c,[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2-17],[0,h/2],[-w/2,h/2-17]],wood,'#402916');}else{ellipse(c,0,0,w/2,h/2,wood);}
 c.shadowBlur=0;c.lineWidth=4;c.strokeStyle='#efc88c';c.stroke();c.beginPath();c.moveTo(0,-h/2+6);c.lineTo(0,h/2-6);c.strokeStyle='#6f3e22';c.lineWidth=3;c.stroke();ellipse(c,0,-4,12,12,'#dfb465');ellipse(c,0,-4,7,7,'#8b6d4d');c.restore();}
function swordPath(c,kind){c.beginPath();if(kind==='thraex'){c.moveTo(0,0);c.quadraticCurveTo(17,-60,43,-79);c.quadraticCurveTo(18,-75,22,-47);c.lineTo(8,-2);}else if(kind==='retiarius'){c.moveTo(0,0);c.lineTo(0,-125);c.lineTo(-7,-112);c.lineTo(0,-135);c.lineTo(7,-112);c.lineTo(3,-115);c.lineTo(0,-125);}else{c.moveTo(-6,0);c.lineTo(-9,-70);c.lineTo(0,-88);c.lineTo(9,-70);c.lineTo(6,0);}c.closePath();}
function drawWeapon(c,f){let kind=f.kind,active=f.action==='attack'||f.action==='special',prog=active?1-f.actionT/Math.max(.1,f.actionDur):0;
 c.save();c.translate(40,-103);if(active)c.rotate(Math.sin(prog*Math.PI)*(.7) + .25);else c.rotate(.26+Math.sin(f.walk*1.2)*.07);
 c.lineCap='round';c.strokeStyle='#ad7e49';c.lineWidth=12;c.beginPath();c.moveTo(0,5);c.lineTo(0,-36);c.stroke();
 if(kind==='retiarius'){
 c.strokeStyle='#69401f';c.lineWidth=8;c.beginPath();c.moveTo(0,27);c.lineTo(0,-103);c.stroke();c.fillStyle='#c6cbd1';c.strokeStyle='#705e51';c.lineWidth=2;
 c.beginPath();c.moveTo(-10,-96);c.lineTo(-10,-137);c.lineTo(-16,-153);c.lineTo(-6,-143);c.lineTo(-6,-114);c.lineTo(6,-114);c.lineTo(6,-143);c.lineTo(16,-153);c.lineTo(10,-137);c.lineTo(10,-96);c.fill();c.stroke();
 }else{
 // Bronze grip, guard and reflective sword
 rect(c,-5,-35,10,34,'#59391f');rect(c,-15,-40,30,7,'#d7a45c');swordPath(c,kind);c.fillStyle=gradient(c,-12,-75,25,0,[[0,'#e9ecdc'],[.48,'#99a4a2'],[.7,'#f1eee0'],[1,'#8f8984']]);c.fill();c.lineWidth=2;c.strokeStyle='#7b6960';c.stroke();
 }
 c.restore();
}
function drawHelmet(c,f){if(f.helmHp<=0||f.kind==='retiarius')return;
 const fwd=f.kind==='thraex';c.save();
 // Nostalgic bronze Roman gladiator helmet, stylized open-face visor for expressions
 c.shadowColor='#30200c80';c.shadowBlur=6;
 c.beginPath();c.ellipse(0,-210,68,38,-.07,Math.PI,TAU);c.lineTo(69,-185);c.lineTo(-70,-185);c.closePath();c.fillStyle=gradient(c,-70,-215,65,-190,[[0,'#8c5528'],[.27,'#f5d28a'],[.58,'#ac733e'],[1,'#5e442b']]);c.fill();c.strokeStyle='#6a401f';c.lineWidth=4;c.stroke();
 // brow with engraved rivets
 rect(c,-62,-193,126,12,gradient(c,-65,-194,63,-184,[[0,'#694521'],[.3,'#f3cd80'],[1,'#9f6834']]));
 for(let x=-50;x<=54;x+=16)ellipse(c,x,-188,2.7,2.7,'#f6d897');
 // cheek guards frame the face but keep expression legible
 polygon(c,[[-67,-190],[-56,-186],[-54,-147],[-48,-139],[-64,-153]],'#b78444','#6a4528');
 polygon(c,[[65,-189],[56,-186],[52,-144],[45,-138],[65,-155]],'#be884b','#684326');
 if(fwd){ // Thraex high crest
 polygon(c,[[-12,-230],[-8,-259],[10,-278],[28,-249],[35,-228]],'#bd4733','#d49d54');for(let i=0;i<8;i++)rect(c,i*5-7,-245-Math.sin(i/8*Math.PI)*22,3,16,'#d76d3d');
 }else{ // Murmillo fish-tail-ish crest
 polygon(c,[[-28,-229],[-11,-257],[0,-253],[16,-272],[25,-231]],'#c59b55','#715330');}
 c.shadowBlur=0;c.restore();}

// v0.3 — Images sourced from the approved pixel-art design sheet.
const PIXEL_SPRITES={"murmillo":{"idle":"./assets/characters/murmillo/composite/idle.webp","walk":"./assets/characters/murmillo/composite/walk.webp","high":"./assets/characters/murmillo/composite/high.webp","mid":"./assets/characters/murmillo/composite/mid.webp","low":"./assets/characters/murmillo/composite/low.webp","guard":"./assets/characters/murmillo/composite/guard.webp"},"thraex":{"idle":"./assets/characters/thraex/composite/idle.webp","walk":"./assets/characters/thraex/composite/walk.webp","high":"./assets/characters/thraex/composite/high.webp","mid":"./assets/characters/thraex/composite/mid.webp","low":"./assets/characters/thraex/composite/low.webp","guard":"./assets/characters/thraex/composite/guard.webp"},"retiarius":{"idle":"./assets/characters/retiarius/composite/idle.webp","walk":"./assets/characters/retiarius/composite/walk.webp","high":"./assets/characters/retiarius/composite/high.webp","mid":"./assets/characters/retiarius/composite/mid.webp","low":"./assets/characters/retiarius/composite/low.webp","guard":"./assets/characters/retiarius/composite/guard.webp"}};
const PIXEL_IMAGES = {};
for (const kind of Object.keys(PIXEL_SPRITES)) {
 PIXEL_IMAGES[kind] = {};
 for (const [state,src] of Object.entries(PIXEL_SPRITES[kind])) {
   const img = new Image(); img.src=src; PIXEL_IMAGES[kind][state]=img;
 }
}
const SPRITE_DRAW=Object.fromEntries(Object.entries(ASSET_MANIFEST.classes).map(([id,item])=>[id,{h:item.render.height,y:item.render.yOffset,anchor:item.render.anchor}]));
function drawNetWrap(c,alpha=.76){
 c.save();c.globalAlpha=alpha;c.strokeStyle='#f0dfb0';c.lineWidth=2.1;
 for(let x=-56;x<=64;x+=22){c.beginPath();c.moveTo(x,-184);c.lineTo(x+24,-46);c.stroke();}
 for(let y=-171;y<=-55;y+=22){c.beginPath();c.moveTo(-60,y);c.lineTo(66,y+18);c.stroke();}
 c.strokeStyle='rgba(255,227,173,.95)';c.lineWidth=2.7;c.beginPath();c.moveTo(-62,-184);c.quadraticCurveTo(-84,-115,-58,-48);c.quadraticCurveTo(0,-22,68,-50);c.quadraticCurveTo(87,-111,61,-186);c.quadraticCurveTo(3,-209,-62,-184);c.stroke();
 for(let p of [[-58,-184],[62,-184],[-56,-48],[66,-50],[3,-208]]){c.fillStyle='#d7b25d';c.beginPath();c.arc(p[0],p[1],3.3,0,TAU);c.fill();}
 c.restore();
}
function drawDodgeFx(c,f){
 const t=clamp((f.dodgeFx||0)/.42,0,1); if(t<=0)return;
 c.save();
 for(let i=1;i<=3;i++){
   c.globalAlpha=t*(.14-.025*i); c.translate(-f.facing*9,0); c.scale(f.facing,1);
 }
 c.restore();
 c.save(); c.globalAlpha=.15+.22*t; c.strokeStyle='#c9f4ff'; c.lineWidth=5; c.beginPath(); c.arc(0,-112,92,-1.15,.65); c.stroke(); c.beginPath(); c.arc(-16,-116,72,-1.45,.95); c.stroke(); c.restore();
}
function drawParryFx(c,f){
 const t=clamp((f.parryFx||0)/.46,0,1); if(t<=0)return;
 c.save(); c.globalAlpha=.3+.4*t; c.strokeStyle='#fff1b8'; c.lineWidth=8; c.beginPath(); c.arc(8,-126,108,-1.3,1.15); c.stroke();
 c.lineWidth=3; c.strokeStyle='#f7c15d'; c.beginPath(); c.arc(8,-126,124,-1.15,.96); c.stroke();
 c.globalAlpha=.32*t; for(let i=0;i<8;i++){ const ang=i/8*TAU+game.elapsed*4; c.beginPath(); c.moveTo(Math.cos(ang)*78, -126+Math.sin(ang)*78); c.lineTo(Math.cos(ang)*128, -126+Math.sin(ang)*128); c.stroke(); }
 c.restore();
}
function drawPixelFighter(c,f){
 const state = game.phase==='finisher'&&f===game.finisherWinner ? (f.kind==='thraex'?'mid':'high') : f.dead ? 'guard' : f.hurtFlash>0.07 || f.stunned>0 || f.guard ? 'guard' :
   f.action==='attack'||f.action==='special' ? ['high','mid','low'][f.attackZone||0] :
   Math.abs(f.vx)>15 ? 'walk' : 'idle';
 const im=PIXEL_IMAGES[f.kind]?.[state];
 if(!im || !im.complete || !im.naturalWidth)return false;
 const cfg=SPRITE_DRAW[f.kind]||SPRITE_DRAW.murmillo;
 c.save(); c.translate(f.x,f.y);
 c.globalAlpha=.23; c.fillStyle='#342113';c.beginPath();c.ellipse(0,0,74,12,0,0,Math.PI*2);c.fill();c.globalAlpha=1;
 c.scale(f.facing,1);
 const height = cfg.h;
 const width = height * im.width/im.height;
 const swaying = state==='walk' ? Math.sin(f.walk*2)*3 : 0;
 const drawX = -width*(cfg.anchor||.52);
 const drawY = -height+swaying+(cfg.y||0);
 if(f.dead){c.globalAlpha=.65;c.translate(0,22);c.rotate(-.55);} 
 if(f.dodgeI>0) c.translate(-18,6);
 c.imageSmoothingEnabled=false;
 if((f.dodgeFx||0)>0 && !f.dead){
   const t=clamp((f.dodgeFx||0)/.42,0,1);
   for(let i=1;i<=3;i++){
     c.globalAlpha=t*(.14-.025*i);
     c.drawImage(im,drawX-f.facing*i*16,drawY+i*2,width,height);
   }
   c.globalAlpha=1;
 }
 c.drawImage(im,drawX,drawY,width,height);
 // Equipment state indicators overlay the approved pixel-art sheet; full separated equipment artwork remains future asset work.
 if(f.helmDropped||f.shieldDropped||f.weaponDropped){
  c.save();c.font='bold 12px monospace';c.textAlign='center';
  const missing=[f.helmDropped?'HELM':null,f.shieldDropped?'SHIELD':null,f.weaponDropped?'WEAPON':null,f.bodyArmorDropped?'ARMOR':null].filter(Boolean);
  c.fillStyle='#282019';c.globalAlpha=.86;c.fillRect(-70,-height-27,140,20);c.globalAlpha=1;c.fillStyle='#ffd29b';c.fillText('LOST '+missing.join('/'),0,-height-12);c.restore();
 }
 if(f.finishPose>0){c.save();c.globalAlpha=Math.min(.7,f.finishPose);c.strokeStyle='#ffdea1';c.lineWidth=6;c.beginPath();c.arc(0,-130,116,-1.5,1.5);c.stroke();c.restore();}
 if(f.dodgeFx>0) drawDodgeFx(c,f);
 if((f.counterFx||0)>0){const t=clamp((f.counterFx||0)/.95,0,1);c.save();c.globalAlpha=.18+.18*t;c.strokeStyle='#ffd56d';c.lineWidth=6;c.beginPath();c.arc(6,-128,116,-1.3,1.08);c.stroke();c.lineWidth=3;c.strokeStyle='#fff0b1';c.beginPath();c.arc(6,-128,132,-1.18,.98);c.stroke();c.restore();}
 if(f.parryFx>0) drawParryFx(c,f);
 if(f.action==='special'&&f.actionT>0){const prog=1-f.actionT/Math.max(.1,f.actionDur);c.save();c.globalAlpha=.42*(1-prog)+.18;const strokeA=f.kind==='retiarius'?'#fff0c8':f.kind==='thraex'?'#ffd8a0':'#ffe9b2';const strokeB=f.kind==='retiarius'?'#d7c07b':f.kind==='thraex'?'#ff9c5d':'#f7bf58';const radius=f.kind==='thraex'?118:(f.kind==='retiarius'?138:132);c.strokeStyle=strokeA;c.lineWidth=f.kind==='thraex'?10:8;c.beginPath();c.arc(20,-132,radius,-1.35+prog*.26,.72+prog*.24);c.stroke();c.lineWidth=3;c.strokeStyle=strokeB;c.beginPath();c.arc(20,-132,radius+14,-1.22+prog*.22,.56+prog*.2);c.stroke();if(f.kind==='murmillo'){c.lineWidth=2;c.strokeStyle='#fff3c8';c.beginPath();c.arc(8,-140,106,-1.0+prog*.1,.52+prog*.18);c.stroke();}c.restore();} if(f.guard&&f.parryFx<=0){c.save();c.globalAlpha=.26+.1*Math.sin(game.elapsed*10);c.strokeStyle='#f4db99';c.lineWidth=9;c.beginPath();c.arc(10,-127,98,-1.4,1.1);c.stroke();c.restore();}
 if(f.netted>0) drawNetWrap(c,Math.min(.82,.35+f.netted*.22));
 if(f.legSlow>0){c.save();c.globalAlpha=.2;c.strokeStyle='#efbc76';c.lineWidth=3;c.beginPath();c.ellipse(0,-25,55,13,0,0,TAU);c.stroke();c.restore();}
 if(f.hurtFlash>0){c.globalAlpha=Math.min(.36,f.hurtFlash*1.5);c.fillStyle='#fff0ca';c.fillRect(-width*.35,-height+45,width*.7,height-45);}
 c.restore();return true;
}
function drawFighter(c,f){if(!f)return;if(drawPixelFighter(c,f))return;const walk=Math.sin(f.walk*2)*3,phase=(f.actionT>0?1-f.actionT/f.actionDur:0),swing=f.action==='attack'||f.action==='special';
 c.save();c.translate(f.x, f.y+(f.dead?29:0));c.scale(f.facing,1);
 if(f.dead){c.rotate(-.78);c.translate(18,39);}else if(f.dodgeI>0)c.rotate(-.24);
 else if(f.stunned>0)c.rotate(-.12); else if(swing)c.rotate(.10*Math.sin(phase*Math.PI));
 // ground shadow independent of damage effect
 c.save();c.translate(0,0);c.globalAlpha=.27;ellipse(c,0,2,83,12,'#422d1c');c.restore();
 // feet and shoes
 c.fillStyle='#c28b59';c.strokeStyle='#8e572e';c.lineWidth=3;
 for(let s of [-1,1]){c.save();c.translate(s*27,-14+(f.vx?walk*s:0));c.rotate(s*.16);ellipse(c,s*5,0,21,11,'#9f612f');ellipse(c,s*7,-3,17,8,'#d4a06a');c.restore();}
 // legs
 for(let s of [-1,1]){c.save();c.translate(s*25,-37+(f.vx?walk*s:0));c.rotate((s===1?1:-1)*.07);ellipse(c,0,0,20,38,'#d6a06b');rect(c,-18,18,36,8,'#78522f');rect(c,-18,8,36,8,'#bf9657');c.restore();}
 // small barrel torso / skirt
 ellipse(c,0,-95,53,74,'#bc8054');ellipse(c,0,-100,48,66,gradient(c,-40,-115,40,-55,[[0,'#ffe0aa'],[.6,'#d3a471'],[1,'#ad754a']]));
 polygon(c,[[-40,-61],[-18,-38],[20,-38],[42,-66]],'#a4462b','#724021');
 rect(c,-42,-82,85,15,'#67391f');rect(c,-16,-88,32,26,'#d6a661');rect(c,-11,-84,22,17,'#79562e');
 // naked arm and vambrace, keep cute hands
 c.strokeStyle='#e1ad7c';c.lineWidth=28;c.lineCap='round';c.beginPath();c.moveTo(-32,-127);c.lineTo(-54,-87);c.stroke();
 c.strokeStyle='#9a6433';c.lineWidth=17;c.beginPath();c.moveTo(-49,-97);c.lineTo(-57,-82);c.stroke();ellipse(c,-57,-76,13,13,'#e7bb8d');
 // weapon arm
 c.strokeStyle='#dfab76';c.lineWidth=24;c.beginPath();c.moveTo(32,-122);c.lineTo(47,-95);c.stroke();rect(c,41,-107,16,23,'#b28242');ellipse(c,47,-91,13,12,'#ffd4a0');
 // head from user-provided reference sprite
 const head=heads[f.kind];if(head&&head.complete&&head.naturalWidth){c.drawImage(head,-68,-234,136,137);}else{ellipse(c,0,-175,68,69,'#ffd69d');}
 // minimal facial emotion squint at impact
 if(f.hurtFlash>0){c.fillStyle='#fff6e5';c.globalAlpha=f.hurtFlash*1.6;ellipse(c,0,-174,62,68,'#fa9a7e');c.globalAlpha=1;}
 drawHelmet(c,f);drawShield(c,f);drawWeapon(c,f);
 if(swing&&phase>.2&&phase<.78){c.save();c.globalAlpha=.75;let start=-1.1+phase*.5;c.beginPath();c.arc(48,-137,118,start,start+.78,false);c.strokeStyle=f.kind==='retiarius'?'#fff3c9':'#e7ecdd';c.lineWidth=5;c.stroke();c.beginPath();c.arc(48,-137,130,start,start+.65,false);c.strokeStyle='#f4bd65';c.lineWidth=2;c.stroke();c.restore();}
 if(f.guard){c.save();c.globalAlpha=.23+.08*Math.sin(game.elapsed*9);c.strokeStyle='#f4db99';c.lineWidth=9;c.beginPath();c.arc(10,-127,98,-1.4,1.1);c.stroke();c.restore();}
 if(f.dodgeFx>0) drawDodgeFx(c,f); if(f.parryFx>0) drawParryFx(c,f);
 if(f.netted>0) drawNetWrap(c,Math.min(.82,.35+f.netted*.22));
 if(f.exhausted>0){for(let i=0;i<3;i++){ellipse(c,-43+i*40,-256-8*Math.sin(game.elapsed*5+i),4,4,'#deebf2');}}
 c.restore();}
function drawDrop(c,d){
 c.save();c.globalAlpha=Math.min(1,d.life/1.1+0.15);c.translate(d.x,d.y);c.rotate(d.rot);c.scale(d.scale||1,d.scale||1);
 if(d.kind==='shield'){ellipse(c,0,0,31,13,'#6f4826');rect(c,-30,-16,60,12,'#ad7440');rect(c,-6,-14,12,28,'#7f542d');}
 else if(d.kind==='helmet'){c.beginPath();c.ellipse(0,-6,24,16,0,Math.PI,TAU);c.lineTo(24,8);c.lineTo(-24,8);c.closePath();c.fillStyle='#c79a58';c.fill();rect(c,-18,7,36,6,'#7f582f');}
 else if(d.kind==='weapon'){rect(c,-3,-42,6,46,'#8b6236');polygon(c,[[-8,-42],[0,-67],[8,-42]],'#d7d9d7','#7d6b60');}
 else if(d.kind==='trident'){rect(c,-3,-58,6,62,'#6d4825');for(let dx of [-9,0,9]) polygon(c,[[dx-3,-54],[dx,-74],[dx+3,-54]],'#d8dad8','#7d6b60');}
 else if(d.kind==='armor'){polygon(c,[[-10,-7],[4,-14],[12,-3],[7,10],[-8,8]],'#c69455','#7f542d');}
 else if(d.kind==='armorplate'){polygon(c,[[-24,-13],[21,-14],[26,8],[0,24],[-24,8]],'#cb9954','#8a592c');rect(c,-15,-6,30,7,'#f1c982');}
 else if(d.kind==='strap'){rect(c,-10,-3,20,6,'#8a5a32');}
 else if(d.kind==='gore'){ellipse(c,0,0,8,5,'#b44d38');}
 else {ellipse(c,0,-4,22,14,'#a9854f');ellipse(c,0,0,20,7,'#704821');}
 c.restore();}
function drawFlying(c,p){
 c.save();c.translate(p.x,p.y);c.rotate(p.rot*.35);
 c.globalAlpha=.18;c.strokeStyle='#f6ddb2';c.lineWidth=4;c.beginPath();c.moveTo(-82,8);c.quadraticCurveTo(-44,-22,-8,-4);c.stroke();
 c.strokeStyle='#f4ddb0';c.lineWidth=2.5;c.beginPath();c.moveTo(-44,-34);c.quadraticCurveTo(-6,-58,36,-28);c.quadraticCurveTo(59,1,34,34);c.quadraticCurveTo(0,56,-34,28);c.quadraticCurveTo(-62,-1,-44,-34);c.stroke();
 c.strokeStyle='#f0d6a1'; c.lineWidth=2;
 for(let i=-2;i<=2;i++){
   c.beginPath(); c.moveTo(-36+i*10,-30); c.lineTo(34+i*10,28); c.stroke();
   c.beginPath(); c.moveTo(-34,-26+i*11); c.lineTo(34,28+i*4); c.stroke();
 }
 c.fillStyle='#d7b25d';
 for(let pt of [[-44,-34],[36,-28],[34,34],[-34,28],[0,53]]){c.beginPath();c.arc(pt[0],pt[1],3.2,0,TAU);c.fill();}
 c.restore();}
function drawFx(c){for(const p of game.particles){c.globalAlpha=clamp(p.life/p.max,0,1);ellipse(c,p.x,p.y,p.r,p.r,p.color);}c.globalAlpha=1;for(const t of game.texts){c.globalAlpha=clamp(t.life/t.max,0,1);c.font='bold 21px Georgia, sans-serif';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#4d2718';c.strokeText(t.text,t.x,t.y);c.fillStyle=t.color;c.fillText(t.text,t.x,t.y);}c.globalAlpha=1;}
function render(){
 ctx.save();let dx=game.phase==='fight'||game.phase==='result'||game.phase==='finisher'?rand(-game.quake,game.quake):0,dy=game.phase==='fight'||game.phase==='result'||game.phase==='finisher'?rand(-game.quake*.5,game.quake*.5):0;ctx.translate(dx,dy);
 if(BG_ARENA.complete&&BG_ARENA.naturalWidth){ctx.drawImage(BG_ARENA,-game.camera,0,WORLD_W,H);} else {ctx.drawImage(arena,-6,-4,W+12,H+8);} 
 ctx.save(); ctx.translate(-game.camera,0);
 ctx.lineWidth=3;ctx.strokeStyle='#aa7c4790';ctx.beginPath();ctx.ellipse(WORLD_W/2,556,860,65,0,0,TAU);ctx.stroke();ctx.beginPath();ctx.ellipse(WORLD_W/2,555,620,38,0,0,TAU);ctx.stroke();
 ctx.fillStyle='rgba(232,196,126,.10)'; ctx.fillRect(0,508,WORLD_W,H-508);
 if(game.phase==='fight'||game.phase==='result'||game.phase==='finisher'){
  const fs=[game.player,game.enemy].filter(Boolean).sort((a,b)=>a.x-b.x);
  for(const d of game.drops){drawDrop(ctx,d);if(d.pickable&&d.y>GROUND-45){ctx.save();ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillStyle='#fce1a6';const t=.55+.45*Math.sin(game.elapsed*7);ctx.globalAlpha=t;ctx.fillText('✦',d.x,d.y-40);ctx.restore();}}
  for(const f of fs)drawFighter(ctx,f);
  for(const p of game.flying)drawFlying(ctx,p);
  drawFx(ctx);
 }else{
  let demo1=fighter('murmillo',WORLD_W/2-230,1),demo2=fighter('thraex',WORLD_W/2+230,-1,true); demo1.walk=game.elapsed*2; demo2.walk=game.elapsed*2+3; drawFighter(ctx,demo1); drawFighter(ctx,demo2);
 }
 ctx.restore();
 if(game.phase==='fight'&&game.enemy&&!game.enemy.dead){const ex=game.enemy.x-game.camera;if(ex>W-60||ex<60){ctx.save();ctx.textAlign='center';ctx.font='bold 18px system-ui';ctx.fillStyle='#ffe6b8';ctx.strokeStyle='#3a1e0c';ctx.lineWidth=4;const x=ex>W-60?W-100:100;const msg=ex>W-60?'적 접근 중 ▶':'◀ 적 접근 중';ctx.strokeText(msg,x,330);ctx.fillText(msg,x,330);ctx.restore();}}
 if(game.flash>0){ctx.fillStyle=`rgba(255,237,187,${game.flash*2.1})`;ctx.fillRect(0,0,W,H);}ctx.restore();}
function frame(now){if(!game.last)game.last=now;let dt=Math.min(.045,(now-game.last)/1000);game.last=now;tick(dt);render();requestAnimationFrame(frame);}
updateProfile();requestAnimationFrame(frame);
})();

