'use strict';
const assert=require('node:assert/strict');
const motion=require('../public/murmillo-motion-v2.js');
function fighter(action='idle',progress=.5,variant=0,vx=0){
 return {cls:'murmillo',action,actionT:action==='idle'||action==='walk'?0:1-progress,
  actionDuration:1,attackVariant:variant,vx,guard:false,dead:false,footworkSeed:0};
}
function active(action,t=.5,variant=0){return motion.poseAt(fighter(action,t,variant),{phase:'fight'},0).index;}
assert.equal(active('attack',.6,0),19,'new forward slash pose');
assert.equal(active('attack',.6,1),20,'new forward sweep pose');
assert.equal(active('attack',.6,2),4,'thrust pose');
assert.equal(active('special',.6),5,'heavy pose');
assert.equal(active('dodge',.6),8,'dodge pose');
assert.equal(active('hit',.6),7,'hit pose');
assert.equal(active('comboDash',.5),4,'dash active pose');
assert.equal(active('guard',.5),6,'guard pose');
const p=fighter('idle');
const idle=new Set(Array.from({length:30},(_,i)=>motion.poseAt(p,{phase:'fight'},i*.1).index));
assert.ok(idle.size>=2,'standing player MUST move between different frames');
const idleMotion=Array.from({length:16},(_,i)=>motion.motionAt(p,{phase:'fight'},i*.12).y);
assert.ok(Math.max(...idleMotion)-Math.min(...idleMotion)>.2,'subtle grounded breathing should remain visible');
const walking=fighter('walk',0,0,135);
const walkingKeys=new Set(Array.from({length:20},(_,i)=>motion.poseAt(walking,{phase:'fight'},i*.07).index));
assert.ok(walkingKeys.size>=3,'walking player MUST use multiple source poses');
const guard=fighter('guard',.5);guard.guard=true;
const guardKeys=new Set(Array.from({length:22},(_,i)=>motion.poseAt(guard,{phase:'fight'},i*.09).index));
assert.ok(guardKeys.size>=2,'guard MUST animate without input');
const fall=fighter('defeat',.4);
const deathScene={phase:'finisher',resultApplied:true,resultWin:false,player:fall};
assert.equal(motion.poseAt(fall,deathScene,0).index,7);
deathScene.resultAnim=.40;
assert.equal(motion.poseAt(fall,deathScene,0).index,21);
deathScene.resultAnim=.80;
assert.equal(motion.poseAt(fall,deathScene,0).index,22);
const victor=fighter('idle');
const victoryScene={phase:'result',resultApplied:true,resultWin:true,player:victor};
assert.equal(motion.poseAt(victor,victoryScene,0).index,10);
victoryScene.resultWin=false;
assert.equal(motion.poseAt(victor,victoryScene,0).index,23);
assert.equal(motion.poseAt({dead:true,actionT:0,vx:0},null,0).index,23);
const drawArgs=[];
const mockCtx={save(){},restore(){},translate(){},rotate(){},scale(){}};
globalThis.GrowthFrames={draw(...args){drawArgs.push(args);return true;}};
const atlas={frames:Array.from({length:12},()=>({canvas:{}}))};
assert.equal(motion.draw(mockCtx,{atlas,fighter:p,scene:{phase:'fight'},clock:1.1,
 x:8,y:23,w:348,h:348,alpha:1}),true);
assert.ok(drawArgs.length>0,'renderer MUST be called');
assert.equal(drawArgs[0][3],8+motion.motionAt(p,{phase:'fight'},1.1).x);
assert.equal(motion.hasStandaloneAssets(),false,'node environment has no network asset loader');
assert.equal(motion.assetStatus(),'loading');
console.log('Murmillo B v4: forward sword, idle, grounded walk, staged death and safe renderer OK');
