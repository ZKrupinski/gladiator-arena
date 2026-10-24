'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/ludus-practice.js','utf8');
const injected=source.replace('root.LudusPractice={',`root.__practiceScaleQA={
 setCourts:n=>COURTS=courtsForParty(n),setContext:c=>ctx=c,
 drawUnit,calibration,courtsForParty,
};root.LudusPractice={`);
assert.notEqual(injected,source,'exercise actual render functions');
const idle={width:960,height:540,alpha:{x:240,y:115,w:485,h:270}};
const swing={width:960,height:540,alpha:{x:50,y:20,w:840,h:490}};
const values={murmillo_champion_red:1.12};
const renderer={
 state:()=>({roster:[{appearance:'murmillo_champion_red'}]}),
 squadSprite:(h,pose)=>pose==='attack'?swing:idle,
 practiceEnemySprite:(key,pose)=>pose==='attack'?swing:idle,
 practiceFrame:(unit,pose)=>({canvas:pose==='attack'?swing:idle,pivotX:480,footY:530})
};
const window={
 LudusBridge:renderer,
 PracticeScaleProfiles:{
  look:unit=>unit.side==='ally'?'murmillo_champion_red':unit.look,
  scale:key=>values[key]||1,foot:()=>0
 },
 ArenaPortraitFit:{bounds:art=>art.alpha}
};
vm.runInNewContext(injected,{window,console});
const qa=window.__practiceScaleQA,court=qa.courtsForParty(3)[0];
function fighter(side,attack=false){
 return {side,seat:0,look:'murmillo_champion_red',index:0,
  x:side==='ally'?240:470,y:court.y,homeX:side==='ally'?240:470,
  hp:99,maxHp:99,name:'QA',dead:false,entry:0,hit:0,guard:0,dodge:0,
  windup:attack?1:0,swing:0};
}
const calls=[];
const gfx={
 save(){},restore(){},translate(...v){calls.push(['translate',...v])},
 scale(...v){calls.push(['scale',...v])},
 drawImage(...v){calls.push(['image',...v])},
 beginPath(){},ellipse(){},fill(){},fillRect(){},strokeRect(){},fillText(...v){calls.push(['label',...v])}
};
qa.setContext(gfx);
for(let n=1;n<=4;n++){
 qa.setCourts(n);
 for(let side of ['ally','enemy']){
  for(let attack of [false,true]){
   calls.length=0;
   const p=fighter(side,attack),m=qa.calibration(p,attack?swing:idle);
   const courtScale=qa.courtsForParty(n)[0].scale;
   assert.equal(m.reference,idle,'stable authored idle frame, not attack bitmap');
   assert(Math.abs(m.pixels-202/540*1.12)<1e-9,'padded costume is NOT enlarged using visible alpha bounds');
   assert(Math.abs(m.refH-270)<1e-9);
   qa.drawUnit(p);
   const im=calls.find(c=>c[0]==='image'),expected=202*courtScale*1.12;
   assert(im,'fighter artwork rendered');
   assert(Math.abs(im.at(-1)-expected)<1e-9,'exact full-frame dimension for both teams and poses');
   const label=calls.find(c=>c[0]==='label');
   assert(label&&label[3]<p.y,'name is above actor');
   assert(calls.some(c=>c[0]==='translate'&&c[2]===court.y),'both team boot anchors share lane');
  }
 }
}
const m=qa.calibration(fighter('ally'),idle);
const previousAlphaFittedPixels=202/idle.alpha.h*1.12;
assert(m.pixels<previousAlphaFittedPixels*.7,'explicit regression: padded red helmet no longer receives 2x alpha zoom');
const main=fs.readFileSync('public/index.html','utf8');
assert.match(main,/const DUEL_BASE_VISUAL_SCALE=\.82/);
assert.match(source,/referenceH=idle\?\.height\|\|idle\?\.naturalHeight/);
assert.doesNotMatch(source,/202\/bound\.h/);
assert.doesNotMatch(source,/unit\.side==='enemy'\?\.96:1/);
assert.match(source,/ctx\.save\(\);ctx\.translate\(unit\.x,unit\.y\)/,'equal boot height, not special enemy render offset');
console.log('PASS: no artist-overriding alpha zoom or ally boost in 1-4 practice courts; stable action/idle size and feet');
