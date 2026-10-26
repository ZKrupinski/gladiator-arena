const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/index.html','utf8');
const source=html.slice(html.indexOf('function advanceParryKO('),html.indexOf('function finishFight('));
let impacts=0;
const c={clamp:(v,a,b)=>Math.min(b,Math.max(a,v)),S:{fx:true},sounds:true,window:{ArenaMotion:{shake:()=>impacts++},ArenaAudio:{play:()=>{}}}};
vm.createContext(c);vm.runInContext(source,c);
for(const dir of [-1,1])for(const fps of [30,60,120]){
 impacts=0;const f={x:640,actionDuration:2.2,parryKO:{t:0,fromX:640,toX:640+dir*245,dir,height:58,y:0,landed:false}};
 let prev=f.x,minY=0;
 for(let i=0;i<fps;i++){
  c.advanceParryKO(f,1/fps);assert.ok(dir*(f.x-prev)>=-1e-8);prev=f.x;minY=Math.min(minY,f.parryKO.y);
  if(f.parryKO.t<=.07){assert.equal(f.x,640);assert.ok(f.parryKO.y===0);}
  assert.ok(Number.isFinite(f.x)&&Number.isFinite(f.parryKO.y));
 }
 assert.equal(f.x,640+dir*245);assert.ok(f.parryKO.y===0);assert.equal(impacts,1);assert.ok(minY<-55);
}
assert.match(html,/finishFight\(victim,f,'parry'\)/);assert.match(html,/finishFight\(f,enemy,'parry'\)/);
assert.match(html,/advanceParryKO\(f,realDt\)/);
const motion=fs.readFileSync('public/murmillo-motion-v2.js','utf8');
const m={window:{}};vm.createContext(m);vm.runInContext(motion,m);
for(const [t,action,progress] of [[0,'hit',0],[.07,'hit',0],[.145,'hit',.5],[.22,'death',0],[.47,'death',.5],[.79,'death',1]]){
 const r=m.MurmilloMotion.stateAt({dead:true,parryKO:{t}},null,0);
 assert.equal(r.action,action);assert.ok(Math.abs(r.progress-progress)<1e-8);
}
console.log('PASS: lethal parry routes, 30/60/120fps both directions, hitstop, continuous motion, one landing, death-frame progression');
