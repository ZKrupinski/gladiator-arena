// End-to-end focus QA: actual attack -> slow motion -> camera recovery.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});
try{
 await page.goto('http://127.0.0.1:8765/?__arena_qa=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.__arenaQA&&!!window.ArenaFocus,{timeout:16000});
 // Title now enters Ludus directly; use the supported QA hook rather than a hidden arcade button.
 await page.evaluate(()=>{const s=window.__arenaQA.state;s.phase='fight';s.time=110;s.paused=false;s.gauntlet=null;s.autoplayEnabled=false;s.autoPlaying=false;});
 await page.waitForFunction(()=>window.__arenaQA.state.phase==='fight',{timeout:16000});
 async function trigger(kind){
  return page.evaluate(type=>{
   const {state:s,attack}=window.__arenaQA;
   s.phase='fight';s.paused=false;s.autoPlaying=false;s.autoplayEnabled=false;
   s.cinematic=null;s.focusFrame=null;s.sparks=[];s.parryBursts=[];
   s.player.x=485;s.enemy.x=648;
   for(const f of [s.player,s.enemy]){
    f.dead=false;f.hp=f.maxHp;f.st=100;f.stagger=0;f.dodge=0;
    f.guard=false;f.parry=0;f.guardHold=0;f.invuln=0;f.attackCD=0;
    f.comboDash=null;f.chainHits=0;f.knockVX=0;f.knockT=0;
   }
   if(type==='parry'){s.player.guard=true;s.player.parry=.29;attack(s.enemy,s.player,false,false)}
   else attack(s.player,s.enemy,false,true);
   return {name:s.cinematic?.kind,duration:s.cinematic?.duration,
       hp:s.player.hp,enemyHp:s.enemy.hp,worldActive:s.phase};
  },kind);
 }
 for(const kind of ['parry','dash']){
  const triggered=await trigger(kind);
  assert.equal(triggered.name,kind,kind+' must originate in actual combat');
  assert.equal(triggered.worldActive,'fight','normal combat must continue');
  await page.waitForTimeout(175);
  const sample=await page.evaluate(()=>{
    const {state:s,camera}=window.__arenaQA;
    const f=s.focusFrame;
    return {active:f?.active,kind:f?.kind,timeScale:f?.timeScale,
     zoom:camera.zoom,focusZoom:f?.zoom,bloom:f?.bloom,
     letterbox:f?.cinemaBars,shake:s.shake,noticeOpacity:document.querySelector('#combatNotice')?.style.opacity,hasDrawnVfx:!!document.querySelector('#battle')};
  });
  assert.equal(sample.active,true,kind+' must keep its effect across frames');
  assert.equal(sample.kind,kind);
  if(kind==='dash'){
   assert.ok(sample.timeScale<=.27,'dash slow-motion is visible');
   assert.ok(sample.focusZoom>.17,'dash camera punch');
   assert.ok(sample.zoom>=1.14,'dash magnification');
   assert.ok(sample.letterbox>=14,'dash letterbox');
  }else{
   assert.ok(sample.timeScale<.60,'parry still briefly checks the attack');
   assert.equal(sample.focusZoom,0,'parry never forces a camera cut');
   assert.ok(sample.zoom<=1.26,'parry keeps both fighters on screen');
   assert.equal(sample.letterbox,0,'parry never conceals fighters with cinema bars');
  }
  assert.equal(sample.noticeOpacity,'0','routine notice must not overlap Latin impact title');
  assert.ok(sample.hasDrawnVfx,'arena canvas active');
  console.log('ARENA_FOCUS_V2_IMPACT '+JSON.stringify({kind,...triggered,...sample}));
  if(process.env.FOCUS_PREVIEW==='1'){
   const snap=await page.screenshot({type:'jpeg',quality:67});
   console.log('ARENA_FOCUS_V2_JPEG_'+kind.toUpperCase()+':'+snap.toString('base64'));
  }
  await page.waitForTimeout(1350);
  const after=await page.evaluate(()=>{
   const f=window.__arenaQA.state.focusFrame;
   return {active:!!f,timeScale:f?.timeScale??1,noticeOpacity:document.querySelector('#combatNotice')?.style.opacity};
  });
  assert.equal(after.active,false,kind+' must recover from the cutscene');
  assert.equal(after.timeScale,1);
  assert.equal(after.noticeOpacity,'','routine notice opacity resets after focus');
 }
 // A player who requests reduced motion must keep fight time responsive.
 await page.emulateMedia({reducedMotion:'reduce'});
 const reduced=await trigger('parry');
 assert.equal(reduced.name,'parry');
 await page.waitForTimeout(120);
 const f=await page.evaluate(()=>window.__arenaQA.state.focusFrame);
 assert.equal(f?.timeScale,1);
 assert.equal(f?.zoom,0);
 assert.equal(f?.cinemaBars,0);
 console.log('ARENA_FOCUS_V2_PASS actual collision, camera, both timings, reduced motion');
}finally{await browser.close();}
