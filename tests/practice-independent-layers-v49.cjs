'use strict';
// Renderer regression: 3 / 4 (rear), 1 / 2 (front), each complete lane
// is a unit: ally + enemy + both VFX/impact + corpse/executioner.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/ludus-practice.js','utf8');
const injected=source.replace('root.LudusPractice={',
 'root.__layerQA={courtPaintOrder,courtPaintQueue,setCourts:n=>COURTS=courtsForParty(n)};root.LudusPractice={');
assert.notEqual(injected,source);
const win={};win.SpartacusBodyCollision=require('../public/arena-body-collision.js');
vm.runInNewContext(injected,{window:win,console});
const qa=win.__layerQA;
function flat(xs){return Array.from(xs);}
for(const [count,expect] of [[1,[0]],[2,[1,0]],[3,[2,1,0]],[4,[3,2,1,0]]]){
 assert.deepEqual(flat(qa.courtPaintOrder(count)),expect,
  'rear row before front row; within each row left court paints last');
}
const four=Array.from(win.LudusPractice.rules.courtsForParty(4));
assert.deepEqual(four.map(c=>[c.x,c.y]),[[980,689],[320,649],[780,608],[480,570]]);
for(const count of [2,3]){
 const seats=Array.from(win.LudusPractice.rules.courtsForParty(count));
 assert(seats[0].x>seats[1].x);
}
const scene={heroes:[],enemies:[],exits:[],fx:[],particles:[]};
for(let seat=0;seat<4;seat++){
 const y=four[seat].y,base={seat,y,dead:false,retiring:false,fade:1};
 const enemy={...base,side:'enemy',name:'rival'};
 const ally={...base,side:'ally',name:'hero'};
 scene.heroes.push(ally);
 scene.enemies.push(enemy);
 scene.exits.push({unit:enemy,court:{y},age:1,seq:{},scale:1});
 scene.exits.push({unit:ally,court:{y},age:1,seq:{},scale:1});
 // Deliberately adversarial depths so global Y-sort would mix courts.
 for(const side of ['enemy','ally']){
  scene.fx.push({seat,depth:side==='enemy'?99999:-99999,
   front:side==='ally'?1:0,kind:'slash'});
  scene.particles.push({seat,depth:side==='enemy'?99998:-99998,
   front:side==='ally'?1:0,kind:'spark'});
 }
}
qa.setCourts(4);
const items=flat(qa.courtPaintQueue(scene));
assert.equal(items.length,32,'all fighters, VFX, impacts, corpses and executioners retained');
const seatPath=items.map(x=>x.seat);
const blocks=seatPath.filter((seat,i)=>i===0||seat!==seatPath[i-1]);
assert.deepEqual(blocks,[3,2,1,0]);
const firstCourt1=items.findIndex(item=>item.seat===0);
const lastCourt2=items.findLastIndex(item=>item.seat===1);
assert(lastCourt2<firstCourt1,'court 1 must be above every court 2 element');
for(const kind of ['fighter','executioner','effect','spark']){
 assert(items.filter(item=>item.seat===1&&item.kind===kind)
  .every(item=>items.indexOf(item)<firstCourt1));
}
for(const seat of [0,1,2,3]){
 const own=items.filter(x=>x.seat===seat);
 assert.equal(own.length,8,'a court owns two fighters, two executors, two FX and two impacts');
 assert.equal(own.filter(x=>x.kind==='fighter').length,2);
 assert.equal(own.filter(x=>x.kind==='executioner').length,2);
 assert.equal(own.filter(x=>x.kind==='effect').length,2);
 assert.equal(own.filter(x=>x.kind==='spark').length,2);
 assert(own.every(x=>typeof x.paint==='function'));
}
for(let n=1;n<=4;n++){
 qa.setCourts(n);
 const expected=flat(qa.courtPaintOrder(n));
 const arr=flat(qa.courtPaintQueue(scene));
 assert.equal(arr.length,n*8);
 const got=arr.map(x=>x.seat).filter((x,i,list)=>!i||x!==list[i-1]);
 assert.deepEqual(got,expected);
}
const visual=fs.readFileSync('public/index.html','utf8');
assert.match(source,/battle\.particles\.push\(\{seat:target\.seat/,'sparks bound to originating court');
assert.match(source,/battle\.fx\.push\(\{seat:unit\.seat/,'attack FX bound to originating court');
assert.match(source,/courtPaintQueue\(battle\)\.forEach\(item=>item\.paint\(\)\)/);
assert.doesNotMatch(source,/units\.concat\(bodies,effects,sparks\)/,
 'global depth sort removed');
console.log('PASS: inset 4 3 / 2 1 staging, four distinct foot depths and indivisible court 1 top painter');
