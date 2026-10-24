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
 while(!s.result){C.step(s,.05);for(const [i,u] of s.units.entries()){if(u.moving)moved.add(u.id);assert(Number.isFinite(u.x)&&Number.isFinite(u.y)&&Number.isFinite(u.hp));assert(u.hp>=0);assert(u.x>=85&&u.x<=1195);assert(u.y>=395&&u.y<=675);for(let j=i+1;j<s.units.length;j++)assert(C.footDistance(u,s.units[j])>=101.9,'no living fighter or permanent corpse may be crossed');}for(const e of s.events)allKinds.add(e.type);}
 assert.equal(moved.size,10,'all ten actors move simultaneously');assert(s.time<=120.1);assert(s.teamwork.ally>0);wins+=s.result.win;total+=s.time;
 const result=s.result,after=JSON.stringify(s.units);C.step(s,.05);C.finish(s,'retreat');assert.equal(s.result,result);assert.equal(JSON.stringify(s.units),after);assert.equal(C.command(s,'focus','enemy0'),false);
}
for(const kind of ['net','push','cover','parry','assist','ko','dash','riposte','retreat','feint','recover','rejoin','rescue-call','rescue','ambush-call','ambush','bait','chase'])assert(allKinds.has(kind),kind);
const a=C.create(team(),team(),{seed:123}),b=C.create(team(),team(),{seed:123});for(let i=0;i<800;i++){C.step(a,.05);C.step(b,.05);}assert.deepEqual(a.units,b.units);
s=C.create(team(),team(),{limit:10});while(!s.result)C.step(s,.05);assert.equal(s.result.reason,'timeout');
s=C.create(team(),team());assert.equal(C.finish(s,'retreat').win,false);
const fallen=C.create(team(),team(),{seed:120});
fallen.units[2].dead=true;fallen.units[2].hp=0;fallen.units[2].deathAt=0;
const body={x:fallen.units[2].x,y:fallen.units[2].y};
for(let i=0;i<160;i++)C.step(fallen,.05);
assert.deepEqual({x:fallen.units[2].x,y:fallen.units[2].y},body,'body remains stationary and fully solid');
for(const v of fallen.units.filter(u=>u!==fallen.units[2]))assert(C.footDistance(v,fallen.units[2])>=101.9,'body cannot be crossed');
const noCascade=C.create(team(),team(),{seed:7});
noCascade.units[0].reaction={kind:'rescue',target:'enemy0',ward:'ally1',due:0,expires:2};
noCascade.units[0].x=680;noCascade.units[0].y=405;
noCascade.units[5].x=800;noCascade.units[5].y=405;
noCascade.units[5].hp=120;
noCascade.units[0].attack=null;
C.step(noCascade,.05);
assert(!noCascade.units[0].reaction,'rescue resolves into one attack');
assert(noCascade.units[5].hp<120,'rescue attack strikes the attacker');
assert(noCascade.units[1].protectedUntil>0,'rescued fighter gets temporary protection');
assert(noCascade.events.some(e=>e.type==='rescue'),'rescue completion event is emitted');

console.log('PASS: 100 seeded battles; collision-free alive/corpse footprints, dash/riposte/assist, feints, retreat/recovery, commands/cooldowns, pause, timeout and result idempotence. Average '+(total/100).toFixed(1)+'s, ally wins '+wins+'%.');
