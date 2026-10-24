'use strict';
// Real practice duel movement and 4-ally occlusion regression. Node only.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const original=fs.readFileSync('public/ludus-practice.js','utf8');
assert.match(original,/keepCourtSpacing\(\);/,'spacing resolver must run in simulation');
const injected=original.replace('root.LudusPractice={',
  'root.__practiceQA={setBattle:b=>battle=b,setCourts:n=>COURTS=courtsForParty(n),act,keepCourtSpacing,courts:()=>COURTS};root.LudusPractice={');
assert.notEqual(injected,original,'QA-only helper attached without shipping a debug API');
const ctx={window:{},console};
vm.runInNewContext(injected,ctx);
const api=ctx.window.__practiceQA,rules=ctx.window.LudusPractice.rules;
const layout=rules.courtsForParty(4);
const alliedHome=layout.map(c=>c.x-87).sort((a,b)=>a-b);
for(let i=1;i<alliedHome.length;i++)
 assert.ok(alliedHome[i]-alliedHome[i-1] >=215,'allied foreground/rear silhouette columns must remain distinct');
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
  assert.ok(enemies[i].x-heroes[i].x>=172-1e-7,'no duel body overlap in court '+i);
  assert.ok(heroes[i].x>=layout[i].x-168&&heroes[i].x<=layout[i].x+168);
  trail[i].push(heroes[i].x);
 }
 const xs=heroes.map(h=>h.x).sort((a,b)=>a-b);
 for(let j=1;j<xs.length;j++)assert.ok(xs[j]-xs[j-1] >=215,'all four allies remain unobscured with split-depth columns');
}
for(const [i,t] of trail.entries()){
 const range=Math.max(...t)-Math.min(...t);
 assert.ok(range>12,'court '+(i+1)+' player footwork range '+range.toFixed(1)+'px must exceed 12px');
}
// Adjacent REAR courts must never put seat 3's enemy body under seat 4's ally.
// The corridor applies even when attacks/parries displace the combatants.
const rearBoundary=(layout[2].x+layout[3].x)/2;
assert.ok(layout[3].x-layout[2].x>=400,'rear station anchors spread out');
assert.ok(enemies[2].x<=rearBoundary-110,"3 rival cannot occupy the 4 ally's artwork");
assert.ok(heroes[3].x>=rearBoundary+110,'4 ally retains his own artwork corridor');
enemies[2].x=rearBoundary+35;heroes[3].x=rearBoundary-35;
api.keepCourtSpacing();
assert.ok(enemies[2].x<=rearBoundary-110,'knockback cannot drag 3 enemy across shared corridor');
assert.ok(heroes[3].x>=rearBoundary+110,"4 ally cannot enter 3 rival's 220px art corridor");
for(let i=0;i<4;i++){
 heroes[i].x=layout[i].x+10;enemies[i].x=layout[i].x-10;
}
api.keepCourtSpacing();
for(let i=0;i<4;i++){
 assert.ok(Math.abs((enemies[i].x-heroes[i].x)-172)<1e-7,'recover from crossed/overlapping centers');
 assert.ok(heroes[i].x<enemies[i].x,'fighter/enemy side order preserved');
}
console.log('PASS: four clear allied columns, paired collision resolution and active left-right footwork');
