// Camera director regression: node tests/arena-coop-camera.js
'use strict';
const assert=require('node:assert/strict');
const Camera=require('../public/arena-coop-camera');
const units=Array.from({length:10},(_,i)=>({
 id:'f'+i,side:i<5?'ally':'enemy',dead:false,
 x:i<5?110+i*110:670+(i-5)*112,y:420+(i%5)*45
}));
const cam=Camera.create();
const snapshots=[];
let previousZoom=cam.zoom,peak=0;
for(let tick=0;tick<900;tick++){
 const t=tick*.05;
 if(tick===29||tick===198||tick===398)
  Camera.record(cam,[{type:'parry',x:880,y:520,time:t}]);
 const view=Camera.advance(cam,.05,{units,mobile:false});
 peak=Math.max(peak,view.zoom);
 assert(view.zoom>=1&&view.zoom<=1.106,'modest readable zoom');
 assert(Math.abs(view.zoom-previousZoom)<.013,'continuous zoom per 50ms frame');
 previousZoom=view.zoom;
 const hw=640/view.zoom,hh=360/view.zoom;
 assert(view.x>=hw-1e-8&&view.x<=1280-hw+1e-8,'never reveal arena side edges');
 assert(view.y>=hh-1e-8&&view.y<=720-hh+1e-8,'never reveal arena top or bottom edges');
 if(tick%20===0)snapshots.push({t:+t.toFixed(2),phase:view.phase,zoom:+view.zoom.toFixed(3)});
}
assert(cam.phaseCounts.close>=4&&cam.phaseCounts.overview>=4,
 'multiple close-up/overview cycles during a normal match');
assert(peak>=1.045,'camera should visibly close up for clashes');
assert(snapshots.some(x=>x.zoom<1.015&&x.t>8),'wide overview returns after close-up');
const mobile=Camera.create();let maxMobile=1;
for(let i=0;i<360;i++){
 const v=Camera.advance(mobile,.05,{units,mobile:true});
 maxMobile=Math.max(maxMobile,v.zoom);
 assert(v.zoom<=1.072,'mobile lens cannot overcrop the team');
}
assert(maxMobile>1.03,'mobile still performs mild close-up');
const paused=Camera.create();
Camera.advance(paused,.05,{units});
const old=paused.clock,oldZoom=paused.zoom,oldPhase=paused.phase;
for(let i=0;i<20;i++)Camera.advance(paused,.05,{units,paused:true});
assert.equal(paused.clock,old,'pause freezes director');
assert.equal(paused.zoom,oldZoom,'pause freezes zoom');
assert.equal(paused.phase,oldPhase,'pause freezes phase');
const accessibility=Camera.advance(cam,.05,{units,reduced:true});
assert.equal(accessibility.zoom,1,'reduced motion stays fully wide');
assert.equal(accessibility.x,640,'reduced motion resets horizontal crop');
assert.equal(accessibility.y,360,'reduced motion resets vertical crop');
console.log('PASS: 45s overview/close-up cycles, bounded camera framing, mobile crop, gentle motion, paused state, reduced motion. Peak desktop '+peak.toFixed(3)+', mobile '+maxMobile.toFixed(3));
