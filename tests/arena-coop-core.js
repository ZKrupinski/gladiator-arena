const assert=require('node:assert/strict');
const C=require('../public/arena-coop-core');
const team=()=>Array.from({length:5},(_,i)=>({index:i,name:'검투사 '+i,cls:['murmillo','retiarius','thraex'][i%3],combat:{hp:150,atk:18,move:240,parry:.2,armor:.15}}));
assert.throws(()=>C.create(team().slice(1),team()));
assert.throws(()=>C.create(team().map(h=>({...h,index:0})),team()));
assert.throws(()=>C.create(team().map(h=>({...h,fatigue:80})),team()));
let s=C.create(team(),team(),{seed:4});const before=JSON.stringify(s.units);
s.paused=true;C.step(s,1);assert.equal(s.time,0);assert.equal(JSON.stringify(s.units),before);assert.equal(C.command(s,'rally'),false);s.paused=false;
assert.equal(C.command(s,'focus','ally0'),false);assert.equal(C.command(s,'focus','enemy3'),true);assert.equal(C.command(s,'focus','enemy2'),false);
assert.equal(C.command(s,'cover','ally1'),true);assert.equal(C.command(s,'cover','ally2'),false);
assert.equal(C.command(s,'rally'),false);s.meter=60;assert.equal(C.command(s,'rally'),true);assert.equal(s.meter,0);assert.equal(C.command(s,'rally'),false);
// Queued assists must not hit after either actor or target has fallen.
s=C.create(team(),team(),{seed:2});s.units[0].dead=true;s.units[0].hp=0;s.links.push({actor:'ally0',target:'enemy0',due:0,expires:3});C.step(s,.05);assert.equal(s.links.length,0);assert.equal(s.units[5].hp,150);
s=C.create(team(),team(),{seed:2});s.units[5].dead=true;s.units[5].hp=0;s.links.push({actor:'ally0',target:'enemy0',due:0,expires:3});C.step(s,.05);assert.equal(s.links.length,0);
let wins=0,total=0,allKinds=new Set();
for(let seed=1;seed<=100;seed++){
 s=C.create(team(),team(),{seed});let moved=new Set();
 while(!s.result){C.step(s,.05);for(const u of s.units){if(u.moving)moved.add(u.id);assert(Number.isFinite(u.x)&&Number.isFinite(u.y)&&Number.isFinite(u.hp));assert(u.hp>=0);assert(u.x>=85&&u.x<=1195);assert(u.y>=395&&u.y<=675);}for(const e of s.events)allKinds.add(e.type);}
 assert.equal(moved.size,10,'all ten actors move simultaneously');assert(s.time<=120.1);assert(s.teamwork.ally>0);wins+=s.result.win;total+=s.time;
 const result=s.result,after=JSON.stringify(s.units);C.step(s,.05);C.finish(s,'retreat');assert.equal(s.result,result);assert.equal(JSON.stringify(s.units),after);assert.equal(C.command(s,'focus','enemy0'),false);
}
for(const kind of ['net','push','cover','parry','assist','ko'])assert(allKinds.has(kind),kind);
const a=C.create(team(),team(),{seed:123}),b=C.create(team(),team(),{seed:123});for(let i=0;i<800;i++){C.step(a,.05);C.step(b,.05);}assert.deepEqual(a.units,b.units);
s=C.create(team(),team(),{limit:10});while(!s.result)C.step(s,.05);assert.equal(s.result.reason,'timeout');
s=C.create(team(),team());assert.equal(C.finish(s,'retreat').win,false);
console.log('PASS: 100 seeded battles; all ten move, all cooperation types, targeting/death, commands/cooldowns, pause, timeout, retreat and terminal idempotence. Average '+(total/100).toFixed(1)+'s, ally wins '+wins+'%.');
