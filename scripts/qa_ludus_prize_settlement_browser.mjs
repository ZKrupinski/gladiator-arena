import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:1280,height:850}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto('http://127.0.0.1:8765/?__arena_qa=1');
 await page.waitForFunction(()=>!!window.__arenaQA?.attack&&!!window.LudusBridge?.state,{timeout:18000});
 await page.locator('#startBtn').click();
 await page.waitForFunction(()=>window.__arenaQA?.state.phase==='fight',{timeout:16000});
 // Single fight: award must land on the KO, before the result overlay is shown.
 const duel=await page.evaluate(()=>{
  const game=__arenaQA,s=game.state,p=s.player,e=s.enemy;
  const before=JSON.parse(localStorage.getItem('gladiator.ludus.v1'));
  Object.assign(s,{careerMatch:true,gauntlet:null,careerParticipant:0,
   careerOpponent:{round:3,boss:false},careerStartingHp:p.hp,
   careerRewardApplied:false,phase:'fight',paused:true,
   autoPlaying:false,cinematic:null,focusFrame:null});
  p.x=400;e.x=470;p.face=1;e.face=-1;p.cfg.atk=2000;
  p.st=100;p.attackCD=0;p.comboDash=null;p.chainHits=0;p.stagger=0;
  e.hp=1;e.guard=false;e.dodge=0;e.invuln=0;e.stagger=0;e.dead=false;
  game.attack(p,e,false,false);
  const after=JSON.parse(localStorage.getItem('gladiator.ludus.v1'));
  const expected=ArenaBalance.rewards(true,3,'1v1').gold;
  return {before:before.gold,after:after.gold,expected,prize:after.lastPrize,
   applied:s.careerRewardApplied,phase:s.phase,resultWin:s.resultWin,
   fights:after.fights,previousFights:before.fights};
 });
 assert.equal(duel.phase,'finisher','the real KO occurred');
 assert.equal(duel.applied,true,'reward settled on KO');
 assert.equal(duel.resultWin,true);
 assert.equal(duel.after-duel.before,duel.expected);
 assert.equal(duel.prize.mode,'1v1');
 assert.equal(duel.prize.after,duel.after);
 assert.equal(duel.fights,duel.previousFights+1);
 // The end dialog and a second results render must not award money again.
 const once=await page.evaluate(()=>{
  const s=__arenaQA.state;
  s.phase='result';
  __arenaQA.showEnd();
  __arenaQA.showEnd();
  return JSON.parse(localStorage.getItem('gladiator.ludus.v1')).gold;
 });
 assert.equal(once,duel.after,'reopening the result never duplicates money');
 // Gauntlets used to set rewardApplied before calling the guarded payout,
 // silently dropping ALL 1v2/1v3/2v2/3v3 prizes. Simulate actual final
 // Carnifex cleanup, then verify no second payout at results or on exit.
 const gauntlet=await page.evaluate(()=>{
  const s=__arenaQA.state,saved=JSON.parse(localStorage.getItem('gladiator.ludus.v1'));
  const chosen=[0,1].filter(i=>saved.roster[i]);
  const participants=Object.fromEntries(chosen.map(i=>[i,{
   initialHp:200,lastHp:145,bouts:1
  }]));
  const round=4,mode=chosen.length===2?'2v2':'1v3';
  const queue={mode,finished:true,won:true,allies:chosen,records:participants,
   encounterLeader:{round,boss:false},inCleanup:true,round:5};
  Object.assign(s,{careerMatch:true,gauntlet:queue,careerParticipant:chosen[0],
   careerOpponent:{round,boss:false},careerRewardApplied:false,
   phase:'cleanup',resultApplied:false,resultWin:false,paused:true,slow:0});
  s.cleanup={step:{finished:true,win:true},allyWon:true};
  s.player.hp=145;s.player.dead=false;s.enemy.hp=0;s.enemy.dead=true;
  const finished=__arenaQA.finishLineupCleanup();
  const after=JSON.parse(localStorage.getItem('gladiator.ludus.v1'));
  const expected=ArenaBalance.rewards(true,round,mode).gold;
  const gold=after.gold,number=after.fights;
  s.phase='result';__arenaQA.showEnd();__arenaQA.showEnd();
  const double=JSON.parse(localStorage.getItem('gladiator.ludus.v1'));
  return {finished,mode,before:saved.gold,after:gold,expected,applied:s.careerRewardApplied,
   records:chosen.length,history:after.lastPrize,afterDouble:double.gold,
   fightDelta:double.fights-saved.fights};
 });
 assert.equal(gauntlet.finished,true);
 assert.equal(gauntlet.applied,true);
 assert.equal(gauntlet.after-gauntlet.before,gauntlet.expected,
  '2v2/1v3 complete on real battle settlement pays the whole prize');
 assert.equal(gauntlet.history.mode,gauntlet.mode);
 assert.equal(gauntlet.history.after,gauntlet.after);
 assert.equal(gauntlet.afterDouble,gauntlet.after,'gauntlet results screen cannot duplicate payout');
 assert.equal(gauntlet.fightDelta,1);
 assert.deepEqual(errors,[],'no runtime errors');
 console.log('ARENA_PRIZE_BROWSER_PASS '+JSON.stringify({duel,gauntlet}));
}finally{await browser.close()}
