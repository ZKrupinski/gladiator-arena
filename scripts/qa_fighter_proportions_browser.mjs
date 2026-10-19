// Aspect ratio fidelity test for all combatant categories and key action poses.
// Ensures no flattened characters while preserving translational hit reaction.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto('http://127.0.0.1:8765/?__arena_qa=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.__arenaQA?.render&&!!window.ArenaMotion,{timeout:18000});
 await page.locator('#startBtn').click();
 await page.waitForFunction(()=>window.__arenaQA.state.phase==='fight');
 await page.waitForFunction(()=>window.__arenaQA.assetsReady(),{timeout:45000});
 const result=await page.evaluate(()=>{
  const {state:s,render}=window.__arenaQA;
  s.phase='fight';s.paused=false;s.autoplayEnabled=false;s.autoPlaying=false;
  s.cinematic=null;s.focusFrame=null;s.gauntlet=null;
  s.sparks=[];s.parryBursts=[];s.player.x=430;s.enemy.x=820;
  const samples=[],motion=window.ArenaMotion;
  function record(tag,f){
   render();
   const t=f._fxRender;
   samples.push({tag,actor:f.cls,scaled:[t?.sx,t?.sy],
    finite:Number.isFinite(t?.dx)&&Number.isFinite(t?.dy)&&Number.isFinite(t?.tilt),
    natural:t?.sx===1&&t?.sy===1,
    secondary:motion.pose(f,1.6,false)});
  }
  for(const f of [s.player,s.enemy]){
   f.dead=false;f.removedFromArena=false;f.guard=false;
   f.invuln=0;f.comboDash=null;f.bodySpring=null;f.parryTriumphT=0;f.parryFailT=0;
   const actions=['idle','walk','guard','hit','special','dodge','attack'];
   for(const action of actions){
    f.action=action;f.actionDuration=.5;f.actionT=action==='idle'||action==='walk'?0:.25;
    f.vx=action==='walk'?200:0;f.stagger=action==='hit'?.3:0;
    f.guard=action==='guard';record(action,f);
   }
   for(let variant=0;variant<3;variant++){
    f.action='attack';f.actionT=.22;f.actionDuration=.4;
    f.attackVariant=variant;f.guard=false;record('attack-'+variant,f);
   }
   for(const stage of [.12,.3,.5]){
    f.action='comboDash';f.actionT=.45;f.comboDash={t:stage,hit:false};record('comboDash-'+stage,f);
   }
   f.comboDash=null;f.action='idle';f.actionT=0;f.stagger=0;
   for(const type of Object.keys(motion.RESPONSE)){
    f.bodySpring=null;motion.pulse(f,type,'target',f.face);
    for(let k=0;k<4;k++){record(type+' spring '+k,f);motion.advance(f,.07);}
   }
   f.bodySpring=null;f.parryTriumphT=.35;record('parry triumph',f);
   f.parryTriumphT=0;f.parryFailT=.43;record('parry failure',f);
   f.parryFailT=0;f.action='idle';f.vx=0;
  }
  return {samples,customMurmillo:['idle','guard','walk','attack','hit','comboDash'].map(action=>{
   const f={...s.player,motionVariant:'murmillo_motion_v3',action,actionT:action==='idle'?0:.23,actionDuration:.48,
     comboDash:action==='comboDash'?{t:.3}:null,guard:action==='guard',vx:action==='walk'?170:0};
   const out=window.MurmilloMotion?.motionAt?.(f,s,1.5);
   return {action,sx:out?.sx,sy:out?.sy};
  })};
 });
 assert.ok(result.samples.length>=70,'covers both combatants across all pose and reaction types');
 for(const sample of result.samples){
  assert.ok(sample.finite,'invalid transform: '+JSON.stringify(sample));
  assert.ok(sample.natural,'stretched or squashed: '+JSON.stringify(sample));
  assert.equal(sample.secondary.sx,1,'motion controller must retain original width');
  assert.equal(sample.secondary.sy,1,'motion controller must retain original height');
 }
 for(const sample of result.customMurmillo){
  assert.ok(sample.sx===1&&sample.sy===1,'motion fighter was distorted: '+JSON.stringify(sample));
 }
 assert.deepEqual(errors,[],'no browser runtime rendering errors');
 console.log('FIGHTER_PROPORTIONS_PASS '+JSON.stringify({
  total:result.samples.length,murmilloActions:result.customMurmillo.length,
  widthRatio:1,heightRatio:1}));
}finally{await browser.close();}
