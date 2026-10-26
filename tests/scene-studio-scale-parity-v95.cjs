
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync('public/'+p,'utf8');
const shared={localStorage:{getItem:()=>null}},ctx={window:shared,globalThis:shared,document:{},console,Image:function(){}};
vm.runInNewContext(read('practice-scale-published.js'),ctx);
vm.runInNewContext(read('practice-scale-profiles.js'),ctx);
const profiles=shared.PracticeScaleProfiles,published=shared.SpartacusPublishedScales;
const training=read('ludus-training-runtime.js'),coop=read('arena-coop.js'),duel=read('index.html'),practice=read('ludus-practice.js');
const subset=training.slice(training.indexOf('function studioProjection('),training.indexOf('function paintTrainingFighter('));
assert(subset.includes('function studioProjection('),'live renderer exports authoring projection');
const derive=vm.runInNewContext('(()=>{const STUDIO_BODY_REFERENCE=202;'+subset+'return studioProjection})()',ctx);
const names=Object.keys(published);assert.equal(names.length,31,'all artist looks are covered');
for(const key of names){
 const basis=key==='murmillo_champion_red'?{width:540,height:540}:
  key.startsWith('legacy_')||key.startsWith('beast_')||key==='npc_carnifex'?{width:512,height:512}:{width:362,height:362};
 const actual=derive(key,{width:960,height:540},basis,profiles),expected=profiles.cellPixels(key,basis.width,basis.height,202);
 assert(Math.abs(actual-expected)<1e-9,'TRAINING/STUDIO mismatch '+key);
 assert.equal(profiles.scale(key),published[key],'published scale '+key);
}
assert.doesNotMatch(training,/PRACTICE_SCALE=0\.70|Math\.min\(350\/reference\.height,520\/reference\.width\)/,'no per-fighter trainer auto-fit or 70%');
assert.match(training,/const nominal=a\.practiceNominal\?\.\(unit\)/);
assert.match(training,/frameMeta\?\.canvas===img/,'studio/source frame boot pivot');
assert.match(training,/k=\(profile\?\.pixels\?\?studioProjection/,'published factor applied once');
assert.match(coop,/const perspectiveScale=\(\)=>1;/,'5v5 keeps calibrated size regardless of foot depth');
assert.match(coop,/COOP_CAMERA_BODY_ZOOM=\.60/,'5v5 camera zoom only');
assert.match(coop,/PracticeScaleProfiles\?\.cellPixels\?\.\(look,basis\.width,basis\.height,202\)/,'5v5 original atlas cell');
assert.match(practice,/cellPixels\?\.\(appearance,w,h,PRACTICE_GLADIATOR_REFERENCE\)/,'1-4 practice source size');
assert.match(practice,/ONE global practice stage scale=1/,'1-4 practice no per-seat class size');
assert.match(duel,/const DUEL_BASE_VISUAL_SCALE=\.82/,'duel art reference matches studio');
assert.match(duel,/return DUEL_BASE_VISUAL_SCALE\*\(window\.PracticeScaleProfiles\?\.scale/,'duel published factor once');
console.log('PASS: 31 artist looks, 1v1, training, 1-4 practical duels, 5v5 reference scale and foot parity');
