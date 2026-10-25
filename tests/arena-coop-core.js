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
// Portrait-tap commands use these existing ally/foe skills; group buttons use independent cooldowns.
const tactical=C.create(team(),team(),{seed:82});
assert.equal(C.command(tactical,'cover','enemy0'),true,'invalid ally defaults to a real threatened ally');
assert.equal(tactical.cover.id.startsWith('ally'),true);
assert.equal(C.command(tactical,'focus','enemy3'),true);
assert.equal(tactical.focus.id,'enemy3');
assert.equal(C.command(tactical,'formation'),true);
assert.equal(C.command(tactical,'formation'),false,'team defense is cooldown-limited');
assert.equal(tactical.formation.until,5.3);
assert.equal(tactical.formationReady,19);
assert.equal(C.command(tactical,'flank'),true);
assert.equal(C.command(tactical,'flank'),false,'flank is cooldown-limited');
assert.equal(tactical.flank.until,4.5);
assert.equal(tactical.flankReady,17);
assert(tactical.units.filter(u=>u.side==='ally').every(u=>u.dash>=.65),'all five allies take a dash impulse');
assert(tactical.events.some(e=>e.type==='command'&&e.text.includes('방어진형')));
assert(tactical.events.some(e=>e.type==='command'&&e.text.includes('양익 돌파')));
tactical.paused=true;
assert.equal(C.command(tactical,'formation'),false);
assert.equal(C.command(tactical,'flank'),false);
// Queued assists must not hit after either actor or target has fallen.
s=C.create(team(),team(),{seed:2});const enemyStartHp=s.units[5].hp;s.units[0].dead=true;s.units[0].hp=0;s.links.push({actor:'ally0',target:'enemy0',due:0,expires:3});C.step(s,.05);assert.equal(s.links.length,0);assert.equal(s.units[5].hp,enemyStartHp);
s=C.create(team(),team(),{seed:2});s.units[5].dead=true;s.units[5].hp=0;s.links.push({actor:'ally0',target:'enemy0',due:0,expires:3});C.step(s,.05);assert.equal(s.links.length,0);
let wins=0,total=0,allKinds=new Set();
for(let seed=1;seed<=100;seed++){
 s=C.create(team(),team(),{seed});let moved=new Set();
 while(!s.result){C.step(s,.05);for(const [i,u] of s.units.entries()){if(u.moving)moved.add(u.id);assert(Number.isFinite(u.x)&&Number.isFinite(u.y)&&Number.isFinite(u.hp));assert(u.hp>=0);assert(u.x>=85&&u.x<=1195);assert(u.y>=395&&u.y<=675);for(let j=i+1;j<s.units.length;j++)if(!u.dead&&!s.units[j].dead)assert(C.footDistance(u,s.units[j])>=101.9,'living fighters cannot overlap');}for(const e of s.events)allKinds.add(e.type);}
 assert.equal(moved.size,10,'all ten actors move simultaneously');assert(s.time<=120.1);assert(s.teamwork.ally>0);wins+=s.result.win;total+=s.time;
 const result=s.result,after=JSON.stringify(s.units);C.step(s,.05);C.finish(s,'retreat');assert.equal(s.result,result);assert.equal(JSON.stringify(s.units),after);assert.equal(C.command(s,'focus','enemy0'),false);
}
for(const kind of ['net','push','cover','parry','assist','ko','dash','riposte','retreat','feint','recover','rejoin','rescue-call','rescue','ambush-call','ambush','bait','chase'])assert(allKinds.has(kind),kind);
const a=C.create(team(),team(),{seed:123}),b=C.create(team(),team(),{seed:123});for(let i=0;i<800;i++){C.step(a,.05);C.step(b,.05);}assert.deepEqual(a.units,b.units);
s=C.create(team(),team(),{limit:10});while(!s.result)C.step(s,.05);assert.equal(s.result.reason,'timeout');
s=C.create(team(),team());assert.equal(C.finish(s,'retreat').win,false);
// The death pose must share the live-fighter depth axis, not render behind everyone.
const mockDepth=[
 {id:'corpse-near',y:550,dead:true},
 {id:'living-far',y:500,dead:false},
 {id:'living-near',y:610,dead:false},
 {id:'corpse-far',y:440,dead:true}
];
assert.deepEqual(C.depthOrder(mockDepth).map(u=>u.id),
 ['corpse-far','living-far','corpse-near','living-near'],
 'foot Y, not alive/dead state, decides occlusion');
assert.deepEqual(mockDepth.map(u=>u.id),
 ['corpse-near','living-far','living-near','corpse-far'],'sorting must not reorder simulation state');
const equalDepth=[{id:'corpse',y:510,dead:true},{id:'alive',y:510,dead:false}];
assert.deepEqual(C.depthOrder(equalDepth).map(u=>u.id),['corpse','alive'],'equal foot positions retain stable order');
const fallen=C.create(team(),team(),{seed:120});
fallen.units[2].dead=true;fallen.units[2].hp=0;fallen.units[2].deathAt=0;
const body={x:fallen.units[2].x,y:fallen.units[2].y};
for(let i=0;i<160;i++)C.step(fallen,.05);
assert.deepEqual({x:fallen.units[2].x,y:fallen.units[2].y},body,'fallen body remains stationary');
// Place one living fighter on an unobstructed lane with a fallen body directly in the path.
// All other bodies are dead, and the distant surviving enemy is rooted in place.
const passThrough=C.create(team(),team(),{seed:19});
for(const u of passThrough.units){u.dead=true;u.hp=0;u.deathAt=0;}
const runner=passThrough.units[0],corpse=passThrough.units[1],foe=passThrough.units[5];
Object.assign(runner,{dead:false,hp:runner.maxHp,x:420,y:510,attack:null,rooted:0});
Object.assign(corpse,{dead:true,hp:0,x:550,y:510,deathAt:0});
Object.assign(foe,{dead:false,hp:foe.maxHp,x:1100,y:510,rooted:20,attack:null});
let crossedCorpse=false;
for(let i=0;i<100&&!passThrough.result;i++){
 C.step(passThrough,.05);
 if(C.footDistance(runner,corpse)<80)crossedCorpse=true;
}
assert(crossedCorpse,'living fighter moves through a visible nonblocking corpse');
assert(runner.x>corpse.x+102,'living fighter passes fully beyond the fallen body');
assert.deepEqual({x:corpse.x,y:corpse.y},{x:550,y:510},'corpse remains visible in place');
assert(C.footDistance(runner,foe)>=101.9,'living combatant collision remains enabled');
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

console.log('PASS: 100 seeded battles; collision-free living fighters with pass-through corpses, dash/riposte/assist, feints, retreat/recovery, commands/cooldowns, pause, timeout and result idempotence. Average '+(total/100).toFixed(1)+'s, ally wins '+wins+'%.');
