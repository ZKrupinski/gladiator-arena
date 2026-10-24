'use strict';
// UI + shared runtime integration for one tool-driven 3-key animation and FX.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const profiles=fs.readFileSync('public/practice-visual-profiles.js','utf8');
const storage=new Map(),localStorage={
 getItem:key=>storage.get(key)||null,
 setItem:(key,value)=>storage.set(key,value),
 removeItem:key=>storage.delete(key)
};
const body={murmillo_a_L1:1,murmillo_a_L2:1,thraex_a_L1:1,npc_carnifex:1};
function load(published={}){
 const win={PracticeScaleProfiles:{DEFAULTS:body},SpartacusPublishedActions:published,localStorage};
 vm.runInNewContext(profiles,{window:win,console});
 return win.PracticeVisualProfiles;
}
let p=load();
const motion={start:{x:-46,y:9},middle:{x:52,y:-21},end:{x:0,y:0}};
const raw={x:14,y:-5,scale:1.1,effect:{kind:'sweep',x:38,y:-18,scale:1.37},motion};
const cfg=p.clean(raw);
assert.equal(cfg.motion.start.x,-46);
assert.equal(cfg.motion.middle.y,-21);
assert.equal(cfg.motion.end.x,0);
assert.equal(p.sampleMotion(cfg,0).x,-46);
assert.equal(p.sampleMotion(cfg,.5).x,52);
assert.equal(p.sampleMotion(cfg,1).y,0);
assert.equal(p.sampleMotion(cfg,.25).x,3,'interpolates start and midpoint');
assert.equal(p.sampleMotion(cfg,.75).x,26,'interpolates midpoint and end');
assert.equal(p.sampleMotion(cfg,-6).x,-46,'clamped start');
assert.equal(p.sampleMotion(cfg,6).x,0,'clamped finish');
const result=p.effectGeometry({kind:'sweep',baseX:260,baseY:345,face:1,zoom:.52,
 pose:cfg,progress:.5});
assert(Math.abs(result.x-(260+(14+38+52)*.52))<1e-9);
assert(Math.abs(result.y-(345+(-5-18-21)*.52))<1e-9);
assert(Math.abs(result.width-(655*.52*1.37))<1e-9);
const flip=p.effectGeometry({kind:'sweep',baseX:260,baseY:345,face:-1,zoom:.52,
 pose:cfg,progress:.5});
assert(Math.abs(flip.x-(260-(14+38+52)*.52))<1e-9);
assert(p.write({murmillo_a_L1:{sweep:cfg}}));
p=load({murmillo_a_L1:{sweep:{x:1}}});
assert.equal(p.resolve('murmillo_a_L1','sweep').motion.start.x,-46,'device motion draft preserved across release');
assert.equal(p.resolve('murmillo_a_L1','sweep').effect.scale,1.37);
const studio=fs.readFileSync('public/tools/practice-scale-calibrator.html','utf8');
const inline=[...studio.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
 .map(x=>x[1]).find(x=>x.includes('initActionEditor();build();'));
assert(inline,'editor script present');new vm.Script(inline);
for(const id of ['actionPlay','actionTime','actionTimeValue','actionSpeed',
 'motionKey','motionX','motionY','motionXValue','motionYValue',
 'bulkCopyFx','bulkCopyMotion','batchActionStatus']){
 assert(studio.includes('id="'+id+'"'),id+' control missing');
}
assert.match(inline,/requestAnimationFrame\(animateStudioPreview\)/,'single animation playback loop');
assert.match(inline,/actionFrame\(key,pose,frameNo\)/,'real sprite frame indexed by timeline');
assert.match(inline,/effectPreviewFrame\(kind,frameNo\)/,'8-frame VFX synchronized to sprites');
assert.match(inline,/String\(frameNumber\)\.padStart\(2,'0'\)/,'beast action actual frame numbering');
assert.match(inline,/m\.actions\?\.\[name\]/,'champion action manifest clips');
assert.match(inline,/v\.sampleMotion\?\.\(val,progress\)/,'studio animates user XY keys');
assert.match(inline,/pose:val,progress/,'studio effect and body use same curve time');
assert.match(inline,/const selected=\[\.\.\.selection\]\.filter\(key=>key!==source\)/,
 'bulk excludes the source actor');
assert.match(inline,/if\(mode==='effect'\)to\.effect=\{\.\.\.from\.effect\}/,
 'copy FX without changing destination sprite transforms');
assert.match(inline,/else if\(mode==='motion'\)to\.motion=\{/,
 'copy only 0,50,100% key positions, not FX or body scale');
assert.match(inline,/persistActionEdit\(\)/,'bulk keys saved immediately');
const practice=fs.readFileSync('public/ludus-practice.js','utf8');
assert.match(practice,/sampleMotion/,'practice samples same authoring keys');
const duel=fs.readFileSync('public/index.html','utf8');
assert.match(duel,/sampleMotion/,'1v1 samples same authoring keys');
const training=fs.readFileSync('public/ludus-training-runtime.js','utf8');
assert.match(training,/sampleMotion/,'training room samples same authoring keys');
const publisher=fs.readFileSync('public/tools/practice-scale-publish.js','utf8');
assert.match(publisher,/SpartacusPublishedActions=Object\.freeze/,'source publish includes motion keys');
console.log('PASS: 8-frame preview, scrub/play controls, synced FX, start/mid/end XY interpolation, selected-character FX and motion-only bulk copy');
