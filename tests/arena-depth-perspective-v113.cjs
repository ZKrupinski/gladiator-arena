/* v113: rear row perspective comes from WORLD foot depth, not studio profile,
 * and same projection reaches fighters, effects, corpse and executioner.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/ludus-practice.js','utf8');
const coopSource=fs.readFileSync('public/arena-coop.js','utf8');
const practice=require('../public/ludus-practice.js');
const {courtPerspective,courtsForParty,unitPerspective,executionerCourtScale}=practice;
function eq(a,b,msg){assert(Math.abs(a-b)<1e-8,msg+': '+a+' vs '+b)}
eq(courtPerspective(606),.82,'practice far row');
eq(courtPerspective(676),1,'practice front row');
eq(courtPerspective(689),1,'practice very-near row');
eq(courtPerspective(640),.82+.18*34/70,'practice continuous mid-depth');
for(const n of [1,2,3,4]){
 const seats=courtsForParty(n);
 assert.equal(seats.length,n);
 for(const c of seats)eq(c.scale,courtPerspective(c.y),'court scale follows foot Y');
}
const seats=courtsForParty(4);
assert.deepEqual(seats.map(s=>s.y),[689,689,606,606]);
assert(seats[2].scale<seats[0].scale);
eq(unitPerspective({seat:2,y:640}),courtPerspective(640),'survivor transition interpolates smoothly');
eq(executionerCourtScale(seats[2])/executionerCourtScale(seats[0]),.82,'Carnifex and corpses share same rear correction');

// Exercise actual artist-sized bitmap renderer with a one-costume, two-seat comparison.
const injected=source.replace('root.LudusPractice={',
 'root.__depthQA={drawUnit,setCourts:n=>COURTS=courtsForParty(n),setContext:c=>ctx=c,setBattle:b=>battle=b};root.LudusPractice={');
assert.notEqual(injected,source);
const idle={width:960,height:540,alpha:{x:50,y:18,w:580,h:490}};
const calls=[],ctx={
 save(){},restore(){},translate(){},rotate(){},scale(){},beginPath(){},ellipse(){},
 fill(){},fillRect(){},strokeRect(){},fillText(){},drawImage(...args){calls.push(args)}
};
const shared={scale:()=>1.15,foot:()=>5,
 look:u=>u.side==='ally'?'murmillo_a_L1':u.look,
 framePixels:(id,h,w)=>w/h*1.15};
const window={
 LudusBridge:{
  state:()=>({roster:[{cls:'murmillo',visualId:'murmillo_a_L1'}]}),
  squadSprite:()=>idle,practiceEnemySprite:()=>idle,
  practiceNominal:()=>({width:960,height:540}),
  practiceFrame:()=>({canvas:idle,pivotX:480,footY:515})
 },
 PracticeScaleProfiles:shared,ArenaPortraitFit:{bounds:img=>img.alpha}
};
vm.runInNewContext(injected,{window,console});
const qa=window.__depthQA;
qa.setCourts(4);qa.setContext(ctx);
qa.setBattle({clock:0,enemies:[],heroes:[]});
function actualFootFrame(y,seat,side='ally'){
 calls.length=0;
 qa.drawUnit({side,seat,index:0,x:300,y,name:'QA',look:'murmillo_a_L1',
  homeX:300,dead:false,entry:0,hit:0,guard:0,dodge:0,windup:0,swing:0,hp:100,maxHp:100});
 assert.equal(calls.length,1);
 return calls[0].at(-1);
}
const near=actualFootFrame(689,0),rear=actualFootFrame(606,2);
eq(rear/near,.82,'same studio costume shrinks 18% in rear');
eq(actualFootFrame(606,2,'enemy'),rear,'same projection applies to rival');
eq(actualFootFrame(640,2)/near,courtPerspective(640),'dynamic foot Y drives intermediate size');
eq(actualFootFrame(689,0)/near,1,'front frame does not accumulate scale');
eq(shared.scale('murmillo_a_L1'),1.15,'artist scale remains unchanged');

const coop={ArenaCoopCore:{}};
vm.runInNewContext(coopSource,{window:coop,console});
const p=coop.ArenaCoop.perspectiveScale;
eq(p(395),.70,'5v5 rear field is 70% at true movement bound');
eq(p(675),1,'5v5 near movement bound is 100%');
eq(p(535),.85,'5v5 interpolates over the full 280px floor');
eq(p(405),.70+.30*10/280,'5v5 rear spawn does not reach world edge');
eq(p(653),.70+.30*258/280,'5v5 front spawn does not reach world edge');
eq(p(350),.70,'5v5 clamped above far floor');
eq(p(700),1,'5v5 clamped beyond near floor');
assert.match(coopSource,/ctx\.scale\(depth,depth\)/,'5v5 applies depth once to the fighter and dash echoes');
assert.match(coopSource,/COOP_CAMERA_BODY_ZOOM\*depth/,"5v5 raster FX scale equals its owner depth perspective");
assert.match(coopSource,/C\.depthOrder\(sim\.units\)/,'5v5 paints back-to-front by foot position');
assert.match(source,/courtPaintQueue\(battle\)\.forEach/,'practice keeps atomic lane layers');
assert.match(source,/zoom:perspective,pose:authored/,'practice FX shares depth');
assert.match(source,/const scale=unitPerspective\(unit\)/,'practice sprite follows unit world depth');
assert.match(source,/scale:unitPerspective\(unit\)/,'practice executioner freeze matches character scale at KO');
console.log('PASS: practice .82–1.0 depth and 5v5 .70–1.0 depth; actor, enemy, reflow, VFX, corpse, executor, studio profiles remain aligned');
