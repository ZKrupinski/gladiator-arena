'use strict';
// The same artist Carnifex scale must mean the same height relative to
// gladiators in a normal duel and in front/rear training courts.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/ludus-practice.js','utf8');
const injected=source.replace('root.LudusPractice={',`root.__executorQA={
  setBattle:b=>battle=b,setCourts:n=>COURTS=courtsForParty(n),
  setContext:c=>ctx=c,beginRemoval,drawDeparture,executionerCourtScale,
  courtsForParty};
  root.LudusPractice={`);
assert.notEqual(injected,source);
const calls=[];
const sceneCtx={save(){},restore(){},translate(...args){calls.push(['translate',...args]);},
 scale(...args){calls.push(['scale',...args]);}};
const engine={
 begin(body,allyWon,step,viewport){return {body,allyWon,step,viewport};},
 preload(){},
 draw(ctx,seq,drawBody,floorY,options){calls.push(['engineDraw',floorY,options]);}
};
const window={ArenaCarnifex:engine};
vm.runInNewContext(injected,{window,console});
const qa=window.__executorQA;
qa.setContext(sceneCtx);
qa.setCourts(4);
const layout=qa.courtsForParty(4);
const battle={exits:[],clock:0};
qa.setBattle(battle);
assert.equal(layout.length,4);
for(let seat=0;seat<4;seat++){
 const court=layout[seat];
 const unit={seat,side:seat%2?'enemy':'ally',x:court.x,y:court.y,retiring:false};
 qa.beginRemoval(unit);
 const removal=battle.exits.at(-1);
 const expected=court.scale*202/(348*.82);
 assert(Math.abs(removal.scale-expected)<1e-10,'same projected size as duel');
 assert(Math.abs((466*removal.scale)/(202*court.scale)-466/(348*.82))<1e-10,'same executor/fighter body ratio');
 assert(Math.abs((466*removal.scale*1.4)/(202*court.scale)-466*1.4/(348*.82))<1e-10,'studio scale is multiplied once');
 removal.age=1;calls.length=0;qa.drawDeparture(removal);
 const outer=calls.find(x=>x[0]==='scale');
 assert(outer&&Math.abs(outer[1]-expected)<1e-10,'scene camera scales only by court projection');
 const rendered=calls.find(x=>x[0]==='engineDraw');
 assert(rendered&&rendered[1]===617,'original Carnifex stage floor preserved');
 assert(Math.abs(rendered[2].footOffsetFactor*court.scale*0+rendered[2].footOffsetFactor*expected-court.scale)<1e-8,
   'foot offsets follow fighter court-space Y scale');
}
assert(!source.includes('c.scale*.58'),'remove legacy hidden scale preset');
const npc=fs.readFileSync('public/arena-carnifex.js','utf8');
assert.match(npc,/const visualScale=root\.PracticeScaleProfiles\?\.scale\?\.\('npc_carnifex'\)/);
assert.match(npc,/footOffsetFactor=1/);
assert.match(npc,/bootOffset=\(root\.PracticeScaleProfiles\?\.foot/);
assert.match(npc,/ctx\.scale\(\(flip\?-1:1\)\*size,size\)/);
assert.match(npc,/drawExecutioner\(ctx,seq,pose,floorY,footFactor\)/);
assert.match(source,/ctx\.translate\(0,profilesFoot\(unit\)\*zoom\)/);
console.log('PASS: all four training courts share duel Carnifex/gladiator ratio, one artist scale and correct floor offsets');
