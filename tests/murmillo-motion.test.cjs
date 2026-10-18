'use strict';
const assert=require('node:assert/strict');
const motion=require('../public/murmillo-motion-v2.js');
function sample(action,at=.5,variant=0){
 const f={cls:'murmillo',action,actionT:1-at,actionDuration:1,attackVariant:variant,vx:0,guard:false,dead:false};
 return motion.poseAt(f,{phase:'fight',resultApplied:false},0).index;
}
assert.equal(sample('idle',1),0);
assert.equal(motion.poseAt({vx:120,actionT:0},null,15).index,1);
assert.equal(sample('attack',.5,0),2,'first attack: slash');
assert.equal(sample('attack',.5,1),3,'second attack: sweep');
assert.equal(sample('attack',.5,2),4,'third attack: thrust');
assert.equal(sample('special',.5),5);
assert.equal(sample('guard',.5),6);
assert.equal(sample('dodge',.5),8);
assert.equal(sample('hit',.5),7);
assert.equal(sample('comboDash',.5),4);
const f={dead:false,actionT:0,vx:0};
let scene={phase:'result',resultApplied:true,resultWin:true,player:f};
assert.equal(motion.poseAt(f,scene,0).index,10,'victory');
scene.resultWin=false;
assert.equal(motion.poseAt(f,scene,0).index,11,'defeat');
assert.equal(motion.poseAt({dead:true,actionT:0,vx:0},null,0).index,11);
assert.equal(motion.poseAt({vx:0,actionT:0},null,0).index,
 motion.poseAt({vx:0,actionT:0},null,100).index,'static idle never flickers');
assert.ok(!motion.draw({},{}),'missing atlas must gracefully use fallback');
let captured=null;
globalThis.GrowthFrames={draw(...args){captured=args;return true;}};
const atlas={frames:Array.from({length:12},()=>({canvas:{}}))};
assert.equal(motion.draw({}, {atlas,fighter:{action:'attack',actionT:.5,actionDuration:1,attackVariant:2},
scene:{phase:'fight'},x:12,y:23,w:348,h:348,alpha:1}),true);
assert.equal(captured[2],4);
assert.deepEqual(captured.slice(3,7),[12,23,348,348]);
console.log('Murmillo v2: 17 timeline/render assertions passed');
