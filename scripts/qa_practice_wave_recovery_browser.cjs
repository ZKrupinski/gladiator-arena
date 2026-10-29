'use strict';
// Regression for WAVE 1 (3 kills, 4/4 survivors) getting stuck on an empty arena.
// Reproduces an unfinishable Carnifex retrieval and checks next-wave recovery.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
(async()=>{
 const server=http.createServer((req,res)=>{
  const file=path.join(process.cwd(),'public',decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  fs.readFile(file,(err,bytes)=>{
   if(err){res.writeHead(404);res.end();return;}
   res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');
   res.end(bytes);
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/ludus-practice.js*',async route=>{
  let s=fs.readFileSync('public/ludus-practice.js','utf8');
  const anchor='root.LudusPractice={';
  assert(s.includes(anchor));
  s=s.replace(anchor,'root.__waveQA={setup,simulate,nextWave,loop,setBattle:b=>battle=b,getBattle:()=>battle,setCourts:n=>COURTS=courtsForParty(n),getCourts:()=>COURTS,setContext:c=>ctx=c};'+anchor);
  // Test-only one-frame fault injection; production code stays unchanged.
  s=s.replace('function paint(){','function paint(){if(root.__qaPaintThrowOnce){root.__qaPaintThrowOnce=false;throw Error("forced one-frame painting failure");}');
  await route.fulfill({contentType:'text/javascript',body:s});
 });
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html?__arena_qa=1',{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>window.__waveQA&&window.ArenaCarnifex&&window.LudusPractice,null,{timeout:60000});
  const result=await page.evaluate(()=>{
   const qa=window.__waveQA;qa.setup();qa.setCourts(4);
   document.getElementById('endlessPractice').hidden=false;
   const courts=qa.getCourts();
   function makeHero(seat){
    const c=courts[seat];return {side:'ally',index:seat,name:'QA ally '+seat,cls:'murmillo',seat,lane:seat,
     x:c.x-87,y:c.y,homeX:c.x-87,hp:2000,maxHp:2000,atk:17,armor:0,parryChance:0,
     speed:100,sp:26,level:10,exp:0,kills:seat?1:0,recovery:1,dodgeChance:0,guardEfficiency:0,
     cooldown:999,windup:0,guard:0,parry:0,dodge:0,stun:0,swing:0,swings:0,dead:false,
     entry:0,fade:1.8,specialReady:999};
   }
   const makeBattle=(left)=>({heroes:Array.from({length:4},(_,i)=>makeHero(i)),
    enemies:[],queued:[],wave:1,clearedWave:0,kills:3,left,serial:3,delay:0,nextSeat:0,
    cleared:false,breakTime:0,emptySeconds:0,knockout:0,finished:false,paused:false,speed:1,
    shakes:0,flash:0,fx:[],particles:[],exits:[],clock:0,audioTimes:{},nextCinematicAt:999});
   const original=window.ArenaCarnifex;
   // Precisely the failure: one retrieval never reports "finished".
   window.ArenaCarnifex={...original,advance:()=>false};
   const stuck={unit:{seat:0},seq:{t:0,finished:false},age:0,viewport:{left:0,right:1280}};
   const wait=makeBattle(0);wait.exits.push(stuck);qa.setBattle(wait);
   let elapsed=0;for(let i=0;i<370&&qa.getBattle().wave===1;i++){qa.simulate(.05);elapsed+=.05;}
   const wave2={wave:wait.wave,clearedWave:wait.clearedWave,
    exits:wait.exits.length,clock:wait.clock,kills:wait.kills,alive:wait.heroes.filter(x=>!x.dead).length};
   const blocked=makeBattle(1);blocked.exits.push({unit:{seat:0},seq:{t:0,finished:false},age:0,viewport:{left:0,right:1280}});qa.setBattle(blocked);
   for(let i=0;i<375&&blocked.enemies.length===0;i++)qa.simulate(.05);
   const rescue={remaining:blocked.left,spawned:blocked.enemies.filter(e=>!e.dead).length,
    exits:blocked.exits.length,clock:blocked.clock,paused:blocked.paused};
   window.ArenaCarnifex=original;
   // Four real simultaneous opponents must be defeated and cleanly replaced.
   const natural=makeBattle(0);natural.wave=0;natural.kills=0;
   for(const h of natural.heroes){h.atk=200;h.cooldown=.05;h.kills=0;h.exp=0;}
   qa.setBattle(natural);qa.nextWave();
   const initialSpawn=natural.enemies.length,initialPending=natural.left;
   let ticks=0;
   for(;ticks<1800&&natural.wave===1;ticks++)qa.simulate(.05);
   const normalFight={wave:natural.wave,clearedWave:natural.clearedWave,
    kills:natural.kills,initialSpawn,initialPending,ticks,
    alive:natural.heroes.filter(h=>!h.dead).length,queued:natural.queued.length};
   // A render exception must not stop the next RAF or advancement of clock.
   const pass=makeBattle(1);qa.setBattle(pass);
   const c=document.getElementById('epCanvas');qa.setContext(c.getContext('2d'));
   window.__qaPaintThrowOnce=true;
   qa.loop(100);const clock0=pass.clock;qa.loop(150);const clock1=pass.clock;
   // Cancel possible queued RAFs before leaving this isolated test state.
   pass.paused=true;document.getElementById('endlessPractice').hidden=true;
   return {wave2,rescue,normalFight,clock0,clock1,renderFaultRecovered:!window.__qaPaintThrowOnce};
  });
  assert(result.wave2.wave>=2,'hung retrieval cannot block WAVE 2');
  assert(result.wave2.clearedWave>=1,'WAVE 1 must be counted as cleared');
  assert(result.wave2.alive===4,'all four allies continue');
  assert(result.rescue.spawned>=1,'empty court with pending enemy auto-recovers');
  assert.equal(result.rescue.remaining,0,'pending enemy is actually instantiated');
  assert(!result.rescue.paused);
  assert.equal(result.normalFight.initialSpawn,4,'four chosen gladiators get four initial opponents');
  assert.equal(result.normalFight.initialPending,0,'no hidden initial enemies');
  assert(result.normalFight.kills>=4,'all four first-wave opponents must be defeated');
  assert(result.normalFight.wave>=2,'real 4v4 fight automatically advances to wave 2');
  assert(result.normalFight.alive===4,'normal strong squad remains alive');
  assert(result.renderFaultRecovered,'injected paint error was exercised');
  assert(result.clock1>result.clock0,'RAF continues updating after a render exception');
  // One deliberate synthetic exception is printed by the runtime but caught.
  assert.deepEqual(errors,[],'no uncaught browser errors');
  console.log('PASS v132: WAVE 1 -> WAVE 2 despite an unfinishable corpse, pending rival spawns and an isolated drawing error does not freeze simulation');
  console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(err=>{console.error(err);process.exitCode=1});
