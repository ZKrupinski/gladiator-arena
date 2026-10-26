import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto('http://127.0.0.1:8765/?__arena_qa=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__arenaQA?.assetsReady());
 await page.evaluate(()=>window.__arenaQA.start('new'));
 const results=[];
 for(const mode of ['duel','lineup'])for(const cause of ['parry','special']){
  const initial=await page.evaluate(({mode,cause})=>{
   const q=window.__arenaQA,s=q.state;s.phase='fight';s.paused=true;s.careerMatch=null;s.resultApplied=false;s.cleanup=null;s.koBout=null;
   s.autoplayEnabled=false;s.autoPlaying=false;s.time=110;s.sparks=[];s.parryBursts=[];
   s.gauntlet=mode==='lineup'?Object.assign(window.ArenaLineup.create('1v2',[0],[{name:'QA'}],{cls:'thraex',name:'QA enemy',level:1,round:1}),{records:{},bouts:{}}):null;
   for(const f of [s.player,s.enemy])Object.assign(f,{dead:false,removedFromArena:false,hp:100,st:100,stagger:0,dodge:0,guard:false,parry:0,guardHold:0,invuln:0,attackCD:0,cd:0,knockT:0,knockVX:0,comboDash:null,parryKO:null,specialRecoil:null,parryChase:null,chainHits:0});
   s.player.x=450;s.enemy.x=640;s.player.face=1;s.enemy.face=-1;s.enemy.hp=1;
   if(cause==='parry'){s.player.guard=true;s.player.parry=.3;q.attack(s.enemy,s.player);}
   else q.attack(s.player,s.enemy,true);
   q.render();return {phase:s.phase,start:s.enemy.x,linked:!!s.enemy.parryKO};
  },{mode,cause});
  assert.equal(initial.phase,mode==='lineup'?'knockout':'finisher');assert.ok(initial.linked);
  const samples=[];
  for(const target of [.05,.25,.50,.74,1.12]){
   samples.push(await page.evaluate(target=>{
    const q=window.__arenaQA,s=q.state;s.paused=false;
    while(s.enemy.parryKO.t<Math.min(target,1.08)-.00001){q.update(.01,.01);if(s.phase==='cleanup')break;}
    s.paused=true;q.render();return {t:s.enemy.parryKO.t,x:s.enemy.x,y:s.enemy.parryKO.y,phase:s.phase,pose:q.debugFighter(s.enemy).drawPose};
   },target));
   if(mode==='lineup'&&cause==='special')await page.locator('#battle').screenshot({path:`/tmp/ko-v2-${target}.png`});
  }
  assert.ok(samples[2].y<-70);assert.equal(samples.at(-1).y,0);
  assert.ok(samples.at(-1).x-initial.start>300);
  if(mode==='lineup')assert.equal(samples.at(-1).phase,'cleanup');
  results.push({mode,cause,initial,samples});
 }
 const entry=await page.evaluate(()=>{
  const q=window.__arenaQA,s=q.state;s.gauntlet=null;s.player.dead=false;s.enemy.dead=false;s.player.hp=100;s.enemy.hp=100;s.flash=1;s.player.hitVisual={kind:'strike',t:0,duration:.22};s.sparks=[{t:0,max:1}];
  q.beginArenaEntrance([s.player,s.enemy]);return {flash:s.flash,hit:s.player.hitVisual,fx:s.sparks.length};
 });assert.deepEqual(entry,{flash:0,hit:null,fx:0});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,results,entry}));
}finally{await browser.close();}
