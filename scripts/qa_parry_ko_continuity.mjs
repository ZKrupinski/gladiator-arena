import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto('http://127.0.0.1:8765/?__arena_qa=1');
 await page.waitForFunction(()=>window.__arenaQA?.assetsReady());
 const results=await page.evaluate(()=>{
  const q=window.__arenaQA,s=q.state,out=[];
  for(const dir of [1,-1])for(const fps of [30,60,120]){
   s.phase='fight';s.paused=false;s.gauntlet=null;s.careerMatch=null;s.resultApplied=false;
   const p=s.player,e=s.enemy;
   for(const f of [p,e])Object.assign(f,{dead:false,removedFromArena:false,hp:100,st:100,stagger:0,dodge:0,guard:false,parry:0,guardHold:0,invuln:0,attackCD:0,knockT:0,knockVX:0,comboDash:null,parryKO:null});
   p.x=dir===1?475:805;e.x=p.x+dir*180;p.face=dir;e.face=-dir;e.hp=1;
   p.guard=true;p.parry=.31;q.attack(e,p);
   const phase=s.phase,k=e.parryKO,start=e.x,samples=[];
   if(!k){out.push({phase,missing:true});continue;}
   // Pause the automatic loop; step the actual trajectory deterministically.
   s.paused=true;
   q.update(.1,.1);const paused=k.t===0;
   for(let i=0;i<fps;i++){
    q.advanceParryKO(e,1/fps);q.render();
    samples.push({x:e.x,y:k.y,t:k.t});
   }
   out.push({dir,fps,phase,paused,start,end:e.x,landed:k.landed,y:k.y,
    airborne:samples.some(v=>v.y<-20),frozen:samples.filter(v=>v.t<=.07).every(v=>v.x===start&&v.y===0),
    monotonic:samples.every((v,i)=>!i||dir*(v.x-samples[i-1].x)>=-1e-8),pixels:q.debugFighter(e).count});
  }
  return out;
 });
 for(const r of results){assert.equal(r.phase,'finisher');assert.ok(!r.missing);assert.ok(r.paused&&r.frozen&&r.landed&&r.airborne&&r.monotonic,JSON.stringify(r));assert.equal(r.y,0);assert.ok(r.pixels>100);}
 await page.screenshot({path:'/tmp/parry-ko-final.png'});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,results}));
}finally{await browser.close();}
