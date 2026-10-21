/* ARENA ENTRANCE v1 — fast walk-on from the real screen edges, authentic
 * triumph keypose, short forward charge. Only NEW actors walk in after KO.
 * No gameplay timer, AI attack, input, or stamina changes during entrance.
 */
(function(root){
'use strict';
const W=1280,HALF=174,OFFSCREEN_PAD=28;
const TIME=Object.freeze({run:.86,pose:.46,charge:.28});
const TOTAL=TIME.run+TIME.pose+TIME.charge;
const LANDING=Object.freeze({player:335,enemy:940});
const ease=t=>{const p=Math.max(0,Math.min(1,t));return p*p*(3-2*p);};
const lerp=(a,b,t)=>a+(b-a)*t;
function begin(actors,width=W){
 if(!Array.isArray(actors)||!actors.length)return null;
 const valid=actors.filter(f=>f&&!f.dead&&!f.beastType);
 if(!valid.length)return null;
 const entries=valid.map(actor=>{
  const side=actor.enemy?-1:1;
  const target=Number.isFinite(actor.x)?actor.x:LANDING[actor.enemy?'enemy':'player'];
  const from=actor.enemy?width+HALF+OFFSCREEN_PAD:-HALF-OFFSCREEN_PAD;
  const charge=side*65;
  actor.x=from;actor.vx=0;actor.face=side;
  actor.guard=false;actor.dodge=0;actor.stagger=0;
  actor.action='walk';actor.actionT=0;
  actor.walkT=0;actor._entranceStepT=0;
  return {actor,from,target,charge,side};
 });
 return {entries,t:0,total:TOTAL,finished:false};
}
function stage(t){
 if(t<TIME.run)return 'run';
 if(t<TIME.run+TIME.pose)return 'pose';
 return 'charge';
}
function pose(seq,actor){
 if(!seq)return 'idle';
 if(!seq.entries.some(e=>e.actor===actor))return 'idle';
 return stage(seq.t)==='pose'?'finisher':'walk';
}
function advance(seq,dt){
 if(!seq)return true;
 if(seq.finished)return true;
 const step=Math.max(0,Number(dt)||0);
 seq.t=Math.min(TOTAL,seq.t+step);
 const phase=stage(seq.t);
 for(const e of seq.entries){
  const f=e.actor;
  let next=e.target+e.charge;
  if(phase==='run')next=lerp(e.from,e.target,ease(seq.t/TIME.run));
  else if(phase==='pose')next=e.target;
  else if(seq.t<TOTAL){
   next=lerp(e.target,e.target+e.charge,ease((seq.t-TIME.run-TIME.pose)/TIME.charge));
  }
  const delta=next-f.x;
  f.x=next;
  f.face=e.side;
  f.vx=phase==='pose'?0:delta/Math.max(.001,step);
  f._entranceStepT=phase==='pose'?0:(f._entranceStepT||0)+step*(phase==='charge'?24:15);
  f.walkT=(f.walkT||0)+step*8;
  f.action=phase==='pose'?'finisher':'walk';f.actionT=0;
 }
 if(seq.t>=TOTAL){
  for(const e of seq.entries){
   e.actor.x=e.target+e.charge;
   e.actor.vx=0;e.actor.action='idle';e.actor.actionT=0;
   e.actor._entranceStepT=0;
  }
  seq.finished=true;
 }
 return seq.finished;
}
root.ArenaEntrance={version:'1.0.0',TIME,TOTAL,begin,advance,pose,stage};
})(globalThis);
