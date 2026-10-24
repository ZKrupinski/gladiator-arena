'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/practice-visual-profiles.js','utf8');
const storage=new Map(),store={
 getItem:key=>storage.get(key)||null,
 setItem:(key,value)=>storage.set(key,value),
 removeItem:key=>storage.delete(key)
};
function load(){
 const root={SpartacusPublishedActions:{},localStorage:store,
  PracticeScaleProfiles:{DEFAULTS:{red:1,blue:1,green:1,unused:1}}};
 vm.runInNewContext(source,{window:root,console});
 return root.PracticeVisualProfiles;
}
const api=load();
const motion={start:{x:-20,y:5},middle:{x:40,y:-30},end:{x:0,y:0}};
const edited=api.clean({x:12,y:-8,scale:1.2,
 effect:{kind:'parry',x:34,y:17,scale:1.35},motion});
assert.equal(api.sampleMotion(edited,0).x,-20);
assert.equal(api.sampleMotion(edited,.25).x,10);
assert.equal(api.sampleMotion(edited,.5).x,40);
assert.equal(api.sampleMotion(edited,.75).x,20);
assert.equal(api.sampleMotion(edited,1).x,0);
assert.equal(api.sampleMotion(edited,.5).y,-30);
assert.equal(api.sampleMotion(edited,.25).y,-12.5);
assert.equal(api.sampleMotion(edited,1).y,0);
assert.equal(api.clean({motion:{start:{x:-999,y:999}}}).motion.start.x,-150);
assert.equal(api.clean({motion:{start:{x:-999,y:999}}}).motion.start.y,150);
assert.equal(api.clean({}).motion.middle.x,0);
assert(api.write({red:{slash:edited}}));
const reload=load(),read=reload.resolve('red','slash');
assert.equal(read.motion.start.x,-20,'animation start X survives reload');
assert.equal(read.motion.middle.y,-30,'animation middle Y survives reload');
assert.equal(read.effect.x,34,'existing effect X survives animation addition');
const geom=reload.effectGeometry({kind:'parry',baseX:100,baseY:200,face:-1,
 zoom:1,pose:read,progress:.5});
assert.equal(geom.x,100-(12+34+40),'effect follows 50% attack motion');
assert.equal(geom.y,200+(-8+17-30),'effect follows 50% actor motion vertically');
const studio=fs.readFileSync('public/tools/practice-scale-calibrator.html','utf8');
const js=[...studio.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
 .map(x=>x[1]).find(x=>x.includes('initActionEditor();build();'));
assert(js);new vm.Script(js);
for(const id of ['actionPlay','actionTime','actionTimeValue','actionSpeed','motionKey',
 'motionX','motionY','bulkCopyFx','bulkCopyMotion','batchActionStatus']){
 assert(studio.includes('id="'+id+'"'),id+' is required on mobile tool');}
assert.match(js,/requestAnimationFrame\(animateStudioPreview\)/);
assert.match(js,/actionFrame\(key,pose,frameNo\)/);
assert.match(js,/effectPreviewFrame\(kind,frameNo\)/);
assert.match(js,/sampleMotion\?\.\(val,progress\)/);
assert.match(js,/\$\('#motionX'\)|\$\('#motion'\+axis\)/);
assert.match(js,/\$\('#bulkCopyFx'\)\.addEventListener/);
assert.match(js,/\$\('#bulkCopyMotion'\)\.addEventListener/);
assert.match(js,/\$\('#actionPlay'\)\.addEventListener/);
assert.match(js,/\$\('#actionTime'\)\.addEventListener/);
const from=js.indexOf('function applyActionToChecked(mode){');
const to=js.indexOf('\nfunction initActionEditor(){',from);
assert(from>=0&&to>from,'batch copy function exists before editor setup');
const actual={red:{slash:edited},blue:{slash:api.clean({x:99,scale:1.77,
 effect:{kind:'hit',x:-7},motion:{start:{x:100,y:90}}})},
 green:{guard:api.clean({x:77,effect:{kind:'guard'}})},unused:{hit:api.clean({x:88})}};
const nodes={
 '#actionKey':{value:'red'},'#actionPose':{value:'slash'},'#batchActionStatus':{textContent:''}
};
let saves=0;
const sandbox={selection:new Set(['red','blue','green']),actions:actual,v:api,
 '$':key=>nodes[key],currentAction:()=>api.clean(actual.red.slash),
 persistActionEdit:()=>{saves++;return true;}};
const copy=vm.runInNewContext(js.slice(from,to)+'\napplyActionToChecked',sandbox);
assert.equal(copy('effect'),2,'source character never overwritten');
assert.equal(actual.blue.slash.effect.kind,'parry');
assert.equal(actual.green.slash.effect.x,34);
assert.equal(actual.blue.slash.x,99,'copy effect must not overwrite its pose position');
assert.equal(actual.blue.slash.motion.start.x,100,'copy effect must not overwrite movement keys');
assert.equal(actual.green.guard.x,77,'copy effect must not overwrite other actions');
assert.equal(actual.unused.hit.x,88,'unchecked character untouched');
assert.equal(copy('motion'),2);
assert.equal(actual.blue.slash.motion.middle.y,-30);
assert.equal(actual.green.slash.motion.start.x,-20);
assert.equal(actual.blue.slash.x,99,'copy movement keys must not overwrite pose scale or offsets');
assert.equal(actual.blue.slash.effect.kind,'parry','copy movement keys must preserve FX');
assert.equal(saves,2,'each bulk copy persists immediately');
const practice=fs.readFileSync('public/ludus-practice.js','utf8');
const duel=fs.readFileSync('public/index.html','utf8');
const training=fs.readFileSync('public/ludus-training-runtime.js','utf8');
assert.match(practice,/sampleMotion\?\.\(t,motionProgress\(unit,pose\)\)/);
assert.match(duel,/sampleMotion\?\.\(\s*authored,duelMotionProgress\(f,editorAction\)\)/);
assert.match(training,/sampleMotion\?\.\(authored,progress\)/);
console.log('PASS: animated 3-key XY curve, local reload, FX motion, 8-frame preview, selective bulk FX/motion transfer, all combat scenes');
