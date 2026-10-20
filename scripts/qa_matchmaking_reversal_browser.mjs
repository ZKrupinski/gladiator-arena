import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:1280,height:850}});
const errors=[];page.on('pageerror',err=>errors.push(String(err)));
try{
 await page.goto('http://127.0.0.1:8765/?__arena_qa=1');
 await page.waitForFunction(()=>!!window.__arenaQA?.attack&&!!window.LudusBridge?.matchOpponent,{timeout:20000});
 await page.locator('#startBtn').click();
 await page.waitForFunction(()=>window.__arenaQA?.state.phase==='fight'&&window.__arenaQA.assetsReady(),{timeout:60000});
 const matched=await page.evaluate(()=>{
  const bridge=LudusBridge,roster=bridge.state().roster,hero=roster[0];
  const low=bridge.matchOpponent([0]);
  hero.stats={str:8,agi:7,end:8,focus:7};
  hero.equipment={weapon:'iron',shield:'shield',armor:'elite'};
  const high=bridge.matchOpponent([0]);
  return {low:low.level,high:high.level,gear:high.match.equipment};
 });
 assert.ok(matched.high>matched.low,'changing selected gear and training affects actual opponent');
 assert.equal(matched.gear,3);
 const result=await page.evaluate(()=>{
  const {state:s,attack,render}=__arenaQA,p=s.player,e=s.enemy;
  Object.assign(s,{phase:'fight',paused:false,autoplayEnabled:false,
   autoPlaying:false,gauntlet:null,careerMatch:true,sparks:[],parryBursts:[],
   cinematic:null,focusFrame:null,fx:true,shake:0});
  for(const f of [p,e])Object.assign(f,{dead:false,removedFromArena:false,
   invuln:0,stagger:0,dodge:0,st:100,attackCD:0,cd:0,comboDash:null,
   chainHits:0,guard:false,parry:0,knockT:0,knockVX:0});
  p.x=440;e.x=660;p.face=1;e.face=-1;
  p.hp=Math.ceil(p.maxHp*.22);e.hp=e.maxHp;
  p.guard=true;p.parry=.35;p.comebackUsed=false;
  const baseline=ArenaBalance.playerParryDamage(p,e,true),startHp=e.hp;
  attack(e,p,false,false);
  const first={damage:startHp-e.hp,baseline,used:p.comebackUsed,
   focus:s.cinematic?.kind,notice:s.notice,
   bursts:s.parryBursts.map(b=>({critical:b.reversal,bonus:b.bonus})),
   sequences:s.sparks.map(v=>v.sequence),playerHp:p.hp};
  s.paused=true;
  for(const spark of s.sparks)spark.t=(spark.delay||0)+(spark.max-spark.delay)*.5;
  render();
  s.paused=false;s.phase='fight';s.cinematic=null;s.focusFrame=null;
  s.sparks=[];s.parryBursts=[];
  p.x=440;e.x=660;p.guard=true;p.parry=.35;p.invuln=0;p.st=100;
  e.hp=e.maxHp;e.invuln=0;e.stagger=0;e.attackCD=0;e.st=100;e.dodge=0;
  attack(e,p,false,false);
  const second={focus:s.cinematic?.kind,bursts:s.parryBursts.map(b=>b.reversal),
   sequences:s.sparks.map(v=>v.sequence)};
  return {first,second};
 });
 assert.equal(result.first.used,true);
 assert.equal(result.first.focus,'reversal');
 assert.ok(result.first.damage>result.first.baseline,'critical parry deals extra career damage');
 assert.ok(result.first.playerHp>0,'perfect parry prevents incoming hit');
 assert.ok(result.first.sequences.includes('finisher')&&result.first.sequences.includes('special'),
  'approved directional 8-frame artwork used');
 assert.ok(result.first.bursts.some(b=>b.critical&&b.bonus>0));
 assert.ok(result.first.notice.includes('REVERSAL PARRY! BONUS +'));
 assert.equal(result.second.focus,'parry','second parry reverts to standard presentation');
 assert.ok(!result.second.sequences.includes('finisher'),'only one comeback per bout');
 assert.deepEqual(errors,[]);
 console.log('MATCH_REVERSAL_BROWSER_PASS '+JSON.stringify({matched,result}));
}finally{await browser.close()}
