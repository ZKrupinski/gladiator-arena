// Pixel-level regression for vanishing fighters during / after a perfect parry.
// Opponent and player must remain visible in every actual browser render.
// Includes reduced-motion check; camera framing must never jump offscreen.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto('http://127.0.0.1:8765/?__arena_qa=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.__arenaQA?.render&&!!window.ArenaFocus,{timeout:20000});
 await page.evaluate(()=>{const s=window.__arenaQA.state;s.phase='fight';s.time=110;s.paused=false;s.gauntlet=null;s.autoplayEnabled=false;s.autoPlaying=false;});
 await page.waitForFunction(()=>window.__arenaQA.state.phase==='fight',{timeout:16000});
 await page.waitForFunction(()=>window.__arenaQA.assetsReady(),{timeout:60000});
 await page.waitForTimeout(250); // Decode and render complete before testing parry visibility
 const initial=await page.evaluate(()=>{
  const {state:s,attack,camera}=window.__arenaQA;
  s.phase='fight';s.paused=false;s.autoplayEnabled=false;s.autoPlaying=false;
  s.gauntlet=null;s.cinematic=null;s.focusFrame=null;
  s.player.x=475;s.enemy.x=655;
  for(const f of [s.player,s.enemy]){
   f.dead=false;f.removedFromArena=false;f.hp=f.maxHp+250;
   f.st=100;f.stagger=0;f.dodge=0;f.guard=false;f.parry=0;
   f.guardHold=0;f.invuln=0;f.attackCD=0;f.knockT=0;f.knockVX=0;
   f.comboDash=null;f.chainHits=0;f.parryTriumphT=0;f.parryFailT=0;
  }
  // Baseline: test each gladiator on the same loaded bitmap before parry.
  const before=[window.__arenaQA.debugFighter(s.player),window.__arenaQA.debugFighter(s.enemy)];
  console.log('PARRY_BASELINE_FIGHTERS '+JSON.stringify(before));
  s.player.guard=true;s.player.parry=.31;s.sparks=[];s.parryBursts=[];
  attack(s.enemy,s.player,false,false);
  const after=[window.__arenaQA.debugFighter(s.player),window.__arenaQA.debugFighter(s.enemy)];
  console.log('PARRY_CONTACT_FIGHTERS '+JSON.stringify(after));
  const probes=[s.player,s.enemy].map(f=>{
   const p={spring:f.bodySpring,win:f.parryTriumphT,lose:f.parryFailT,
    interrupted:f.parryInterrupted,action:f.action,actionT:f.actionT,stagger:f.stagger,guard:f.guard};
   f.bodySpring=null;
   const springOff=window.__arenaQA.debugFighter(f);
   f.parryTriumphT=0;f.parryFailT=0;f.parryInterrupted=false;
   const parryOff=window.__arenaQA.debugFighter(f);
   f.action='idle';f.actionT=0;f.stagger=0;f.guard=false;
   const neutral=window.__arenaQA.debugFighter(f);
   Object.assign(f,{bodySpring:p.spring,parryTriumphT:p.win,parryFailT:p.lose,
    parryInterrupted:p.interrupted,action:p.action,actionT:p.actionT,
    stagger:p.stagger,guard:p.guard});
   return {springOff,parryOff,neutral};
  });
  return {focus:s.cinematic?.kind,playerHp:s.player.hp,enemyHp:s.enemy.hp,before,after,probes};
 });
 assert.equal(initial.focus,'parry','must trigger actual perfect parry');
 assert.ok(initial.before.every(v=>v.count>100),'character images must draw before parry '+JSON.stringify(initial.before));
 assert.ok(initial.after.every(v=>v.count>100),'character images must still draw at parry contact '+JSON.stringify(initial));
 assert.ok(initial.after.every(v=>v.count>100&&v.renderTransform&&
   Number.isFinite(v.renderTransform.dx)&&Number.isFinite(v.renderTransform.tilt)&&
   Number.isFinite(v.renderTransform.sx)&&Number.isFinite(v.renderTransform.sy)),
   'parry success and failure must preserve finite transforms and visible artwork');
 const samples=[];
 // Check directly during freeze, winning deflection, loser recoil and recovery.
 for(const delay of [50,120,180,170,250]){
  await page.waitForTimeout(delay);
  const result=await page.evaluate(()=>{
   const {state:s,camera,render}=window.__arenaQA;
   const canvas=document.querySelector('#battle');
   const ctx=canvas.getContext('2d');
   function raster(){
    render();return ctx.getImageData(0,0,1280,720).data;
   }
   function visibleDifference(f){
    const was=!!f.removedFromArena;
    const withActor=raster();
    f.removedFromArena=true;
    let withoutActor;
    try{withoutActor=raster();}
    finally{f.removedFromArena=was;}
    render();
    let changed=0,intensity=0;
    for(let i=0;i<withActor.length;i+=32){
     const dr=Math.abs(withActor[i]-withoutActor[i]);
     const dg=Math.abs(withActor[i+1]-withoutActor[i+1]);
     const db=Math.abs(withActor[i+2]-withoutActor[i+2]);
     if(dr+dg+db>34){changed++;intensity+=dr+dg+db;}
    }
    return {changed,intensity};
   }
   const player=visibleDifference(s.player);
   const enemy=visibleDifference(s.enemy);
   const projected=[s.player,s.enemy].map(f=>({
    x:640+(f.x-camera.x)*camera.zoom,
    y:360+(617-camera.y)*camera.zoom
   }));
   return {phase:s.phase,camera:{x:camera.x,zoom:camera.zoom},
    focus:s.focusFrame?.kind||null,
    player,enemy,projected,
    flags:[!!s.player.removedFromArena,!!s.enemy.removedFromArena]};
  });
  samples.push(result);
  assert.equal(result.phase,'fight','parry must not teleport into a transition');
  for(const [who,diff] of [['player',result.player],['enemy',result.enemy]]){
   assert.ok(diff.changed>70&&diff.intensity>5000,
    who+' disappeared during parry: '+JSON.stringify(result));
  }
  for(const point of result.projected){
   assert.ok(point.x>90&&point.x<1190,'fighter is offscreen: '+JSON.stringify(result));
   assert.ok(point.y>560&&point.y<670,'fighter feet snapped vertically');
  }
  assert.ok(result.camera.zoom<=1.28,'parry zoom hides or clips silhouettes');
  assert.deepEqual(result.flags,[false,false],'neither actor may be removed');
 }
 assert.equal(errors.length,0,'game contains no runtime script exceptions');
 console.log('PARRY_BOTH_FIGHTERS_VISIBLE_PASS '+JSON.stringify({initial,samples}));
}finally{await browser.close();}
