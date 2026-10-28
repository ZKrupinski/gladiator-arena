'use strict';
// Real practice duel movement and 4-ally occlusion regression. Node only.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const original=fs.readFileSync('public/ludus-practice.js','utf8');
assert.match(original,/keepCourtSpacing\(\);/,'spacing resolver must run in simulation');
const injected=original.replace('root.LudusPractice={',
  'root.__practiceQA={setBattle:b=>battle=b,setCourts:n=>COURTS=courtsForParty(n),act,keepCourtSpacing,courts:()=>COURTS};root.LudusPractice={');
assert.notEqual(injected,original,'QA-only helper attached without shipping a debug API');
const ctx={window:{},console};
ctx.window.SpartacusBodyCollision=require('../public/arena-body-collision.js');
vm.runInNewContext(injected,ctx);
const api=ctx.window.__practiceQA,rules=ctx.window.LudusPractice.rules;
const layout=rules.courtsForParty(4);
// Court number 1 must be bottom-right and frontmost:
//       4   3
//       2   1
assert.deepEqual(Array.from(layout,c=>[c.x,c.y]),[
 [990,689],[320,649],[780,608],[480,570]
 ],'right/left courts preserve 4 3 / 2 1 while all four feet occupy distinct depths');
for(let i=1;i<4;i++)assert(layout[i-1].y-layout[i].y>=35,
 'every successive arena layer must have visible vertical depth separation');
for(const c of layout)assert(c.scale>=.70&&c.scale<=1);
for(const c of layout){
 // The approved full 960x540 idle atlas fits inside 1280px at
 // default size; even 1.7x artist-sized NEUTRAL body has edge clearance.
 const halfFrame=202*c.scale*960/540/2;
 for(const x of [c.x-87,c.x+87])
  assert(x-halfFrame>0&&x+halfFrame<1280,
   'entire default frame fits in view without clipping');
 const projectedBody=202*.58*1.7*c.scale;
 assert(c.x-87-projectedBody>20,'1.7x calibrated allied torso stays visible');
 assert(c.x+87+projectedBody<1280,'1.7x calibrated enemy torso stays visible');
}

const alliedHome=layout.map(c=>c.x-87).sort((a,b)=>a-b);
for(let i=1;i<alliedHome.length;i++)
 assert.ok(alliedHome[i]-alliedHome[i-1] >=150,'four allied silhouettes occupy separate X columns');
function actor(side,k,c){
 return {side,seat:k,x:c.x+(side==='ally'?-87:87),homeX:c.x+(side==='ally'?-87:87),y:c.y,
  speed:120,dead:false,retiring:false,entry:0,cooldown:200,swing:0,hit:0,
  stun:0,guard:0,parry:0,guardCD:0,dodge:0,windup:0,swings:0};
}
const heroes=layout.map((c,k)=>actor('ally',k,c));
const enemies=layout.map((c,k)=>actor('enemy',k,c));
const battle={heroes,enemies,clock:0};
api.setCourts(4);api.setBattle(battle);
const trail=heroes.map(h=>[h.x]);
for(let frame=0;frame<220;frame++){
 battle.clock=frame*.05;
 for(const h of heroes)api.act(h,.05);
 for(const e of enemies)api.act(e,.05);
 api.keepCourtSpacing();
 for(let i=0;i<4;i++){
  assert.ok(enemies[i].x-heroes[i].x>=rules.pairBodyGap(heroes[i],enemies[i])-1e-6,'scale-aware duel body clearance in court '+i);
  assert.ok(heroes[i].x>=layout[i].x-168&&heroes[i].x<=layout[i].x+168);
  trail[i].push(heroes[i].x);
 }
 const xs=heroes.map(h=>h.x).sort((a,b)=>a-b);
 for(let j=1;j<xs.length;j++)assert.ok(xs[j]-xs[j-1] >=144,'rear/front columns retain independent body footprint corridors');
}
for(const [i,t] of trail.entries()){
 const range=Math.max(...t)-Math.min(...t);
 assert.ok(range>=8,'court '+(i+1)+' player footwork range '+range.toFixed(1)+'px must remain active after stage margins');
}
// Rear-left court 4 enemy must remain clear of rear-right court 3 ally.
// The corridor applies even when attacks/parries displace the combatants.
const rearBoundary=(layout[2].x+layout[3].x)/2;
assert.ok(layout[2].x-layout[3].x>=290,'rear seats must retain space for rivals after inward shift');
const rearHalf=(rules.pairBodyGap(enemies[3],heroes[2])+22)/2;
assert.ok(enemies[3].x<=rearBoundary-rearHalf,'4 rival has size-aware rear-left corridor');
assert.ok(heroes[2].x>=rearBoundary+rearHalf,'3 ally retains scale-aware rear-right clearance');
enemies[3].x=rearBoundary+35;heroes[2].x=rearBoundary-35;
api.keepCourtSpacing();
assert.ok(enemies[3].x<=rearBoundary-rearHalf,'knockback cannot override 4/3 rear corridor');
assert.ok(heroes[2].x>=rearBoundary+rearHalf,'3 ally cannot enter 4 rival sized corridor');
for(let i=0;i<4;i++){
 heroes[i].x=layout[i].x+10;enemies[i].x=layout[i].x-10;
}
api.keepCourtSpacing();
for(let i=0;i<4;i++){
 assert.ok(Math.abs((enemies[i].x-heroes[i].x)-rules.pairBodyGap(heroes[i],enemies[i]))<1e-5,'recover from crossed/overlapping bodies at their visible sizes');
 assert.ok(heroes[i].x<enemies[i].x,'fighter/enemy side order preserved');
}
console.log('PASS: four clear allied columns, paired collision resolution and active left-right footwork');
