// Chromium verifies actual combat logic routes elastic body animation and
// directional camera kicks without changing the strike or defence rules.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:900}});
const errors=[];
page.on('pageerror',err=>errors.push(String(err)));
try{
 await page.goto('http://127.0.0.1:8765/?__arena_qa=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.__arenaQA&&!!window.ArenaMotion,{timeout:16000});
 await page.locator('#startBtn').click();
 await page.waitForFunction(()=>window.__arenaQA.state.phase==='fight',{timeout:16000});
 for(const name of ['strike','guard','special','dash','parry']){
  const impact=await page.evaluate(kind=>{
   const {state:s,attack}=window.__arenaQA;
   s.phase='fight';s.paused=false;s.autoPlaying=false;s.autoplayEnabled=false;
   s.cinematic=null;s.focusFrame=null;s.cameraKick=null;
   s.player.x=480;s.enemy.x=652;s.keys.clear();
   for(const f of [s.player,s.enemy]){
    f.hp=f.maxHp;f.dead=false;f.attackCD=0;f.cd=0;f.invuln=0;
    f.stagger=0;f.dodge=0;f.net=0;f.guard=false;f.parry=0;
    f.guardHold=0;f.guardRecovery=0;f.pressureT=0;
    f.knockVX=0;f.knockT=0;f.st=100;
    f.chainHits=0;f.comboDash=null;f.bodySpring=null;f.contactCooldown=0;
   }
   if(kind==='parry'){
    s.player.guard=true;s.player.parry=.28;
    attack(s.enemy,s.player,false,false);
   }else{
    if(kind==='guard')s.enemy.guard=true;
    attack(s.player,s.enemy,kind==='special',kind==='dash');
   }
   return {kind:s.cameraKick?.kind||null,
    attacker:s.player.bodySpring?.type||null,
    defender:s.enemy.bodySpring?.type||null,
    duration:s.cameraKick?.duration||0,
    distance:Math.abs(s.enemy.x-s.player.x),
    zoom:s.focusFrame?.zoom||0,
    active:s.phase==='fight'};
  },name);
  assert.equal(impact.kind,name,kindToString(name,impact));
  assert.equal(impact.attacker,name,'both fighters have spring on '+name);
  assert.equal(impact.defender,name,'both fighters have spring on '+name);
  assert.equal(impact.active,true,'attacks should not prematurely terminate');
  console.log('ARENA_BOUNCE_HIT '+JSON.stringify(impact));
 }
 // Make sure a normal combat loop completes and neither sprite jumps through
 // the stage ground after natural spring expiration.
 await page.waitForTimeout(650);
 const motion=await page.evaluate(()=>{
  const s=window.__arenaQA.state;
  const m=window.ArenaMotion;
  return {active:s.phase,
   left:s.player.x,right:s.enemy.x,
   anchorLeft:m.pose(s.player,1).y,
   anchorRight:m.pose(s.enemy,1).y,
   springs:[s.player.bodySpring,s.enemy.bodySpring].filter(Boolean).length,
   cameraKick:!!s.cameraKick};
 });
 assert.equal(motion.active,'fight');
 assert.ok(motion.anchorLeft>=-11&&motion.anchorRight>=-11);
 assert.equal(motion.springs,0,'elastic contact returns to idle');
 await page.emulateMedia({reducedMotion:'reduce'});
 const calm=await page.evaluate(()=>{
  const s=window.__arenaQA.state;
  const m=window.ArenaMotion;
  const f=s.player;
  f.vx=220;f.action='attack';f.actionT=.18;f.actionDuration=.35;
  return {pose:m.pose(f,1,true),shake:(m.shake(s,'special',1),m.sampleShake(s,true))};
 });
 assert.deepEqual(calm.pose,{x:0,y:0,sx:1,sy:1,tilt:0});
 assert.deepEqual(calm.shake,{x:0,y:0,angle:0});
 assert.deepEqual(errors,[],'browser has no uncaught JS errors');
 console.log('ARENA_BOUNCE_BROWSER_PASS '+JSON.stringify(motion));
}finally{await browser.close()}
function kindToString(name,state){return 'expected '+name+' hit feedback; received '+JSON.stringify(state)}
