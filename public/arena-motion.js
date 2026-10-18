/* GLADIATOR ARENA | shared combat secondary-motion controller v1.
 * Artist poses and gameplay hitboxes stay authoritative. All springs here are
 * *render-only*, anchored at the existing planted feet. Impacts update only
 * short cosmetic states; camera impulses have a separate real-time clock.
 * All effects automatically respect reduced-motion and the FX toggle.
 */
(function(root){
'use strict';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const MIN_GAP=200;
const PRESETS=Object.freeze({
 brush:Object.freeze({amp:1.8,time:.13,hz:29,axis:'x',roll:0}),
 contact:Object.freeze({amp:5.5,time:.22,hz:25,axis:'x',roll:.0014}),
 strike:Object.freeze({amp:9.5,time:.25,hz:31,axis:'diag',roll:.003}),
 guard:Object.freeze({amp:7.5,time:.25,hz:23,axis:'x',roll:.002}),
 special:Object.freeze({amp:17,time:.39,hz:21,axis:'y',roll:.006}),
 dash:Object.freeze({amp:25,time:.48,hz:24,axis:'diag',roll:.009}),
 parry:Object.freeze({amp:23,time:.49,hz:17,axis:'double',roll:.007})
});
const RESPONSE=Object.freeze({
 strike:{duration:.29,compression:.065,slide:9},
 guard:{duration:.31,compression:.043,slide:6},
 special:{duration:.42,compression:.075,slide:18},
 dash:{duration:.46,compression:.085,slide:21},
 parry:{duration:.47,compression:.080,slide:17},
 contact:{duration:.26,compression:.047,slide:7}
});
const sin=Math.sin,cos=Math.cos,PI=Math.PI;
function pulse(f,type,role,dir=1){
 if(!f||f.dead)return;
 const source=RESPONSE[type]||RESPONSE.strike;
 // Only one envelope is active per actor; a heavier hit supersedes a lighter.
 const newer={type,role:role==='source'?'source':'target',t:0,
  duration:source.duration,compression:source.compression,slide:source.slide,
  dir:dir<0?-1:1};
 const prev=f.bodySpring;
 const currentImpact=prev?(RESPONSE[prev.type]?.slide||0)*Math.max(0,1-(prev.t/prev.duration)):0;
 if(!prev||currentImpact<=source.slide*1.1)f.bodySpring=newer;
}
function advance(f,dt){
 if(!f?.bodySpring)return;
 f.bodySpring.t=Math.min(f.bodySpring.duration,(f.bodySpring.t||0)+clamp(Number(dt)||0,0,.06));
 if(f.bodySpring.t>=f.bodySpring.duration)f.bodySpring=null;
}
function pose(f,clock=0,reduced=false){
 const neutral={x:0,y:0,sx:1,sy:1,tilt:0};
 if(!f||f.dead||reduced)return neutral;
 const seed=f.enemy?1.33:.24,dir=f.face||1;
 const motion={...neutral};
 // Idle breathing is torso-centered via tiny feet-anchored scale, not a
 // sprite-wide jumping sine. Standing feet never climb above the floor.
 const idle=sin(clock*3.9+seed);
 const walking=clamp(Math.abs(f.vx||0)/235,0,1);
 const stride=(f.walkT||0)*15.5+seed;
 const activeFight=f.stagger>0?'hit':f.guard?'guard':f.dodge>0?'dodge':f.action;
 const moving=(activeFight==='idle'||activeFight==='walk')?walking:walking*.25;
 motion.sx+=idle*.010*(1-moving);
 motion.sy-=idle*.013*(1-moving);
 motion.tilt+=dir*idle*.004;
 motion.y-=Math.pow(Math.max(0,sin(stride)),1.2)*moving*5.5;
 motion.x+=sin(stride)*moving*1.9;
 motion.tilt+=sin(stride)*moving*.013;
 motion.sx+=moving*.010*Math.abs(sin(stride));
 motion.sy-=moving*.007*Math.abs(sin(stride));
 // Functional actions animate even for static traditional single-key poses.
 const actionLength=Math.max(.01,f.actionDuration||.35);
 const phase=clamp(1-(f.actionT||0)/actionLength);
 const swing=Math.sin(PI*phase);
 if(f.actionT>0){
  if(activeFight==='attack'){
   motion.sx+=swing*.027;
   motion.sy-=swing*.022;
   motion.x+=dir*swing*6;
   motion.tilt+=dir*.018*swing;
  }else if(activeFight==='special'){
   motion.sx+=swing*.038;motion.sy-=swing*.035;
   motion.x+=dir*swing*7;motion.tilt+=dir*.024*swing;
  }else if(activeFight==='guard'){
   motion.sy-=.025*swing;motion.sx+=.018*swing;
   motion.tilt-=dir*.016*swing;
  }else if(activeFight==='dodge'){
   motion.y-=swing*6;
   motion.sx+=.023*swing;motion.sy-=.016*swing;
  }else if(activeFight==='hit'){
   motion.sx+=.035*swing;motion.sy-=.040*swing;
  }else if(activeFight==='comboDash'){
   motion.sx+=.035*swing;motion.sy-=.030*swing;
  }
 }
 if(f.guard){motion.sx+=.016;motion.sy-=.019;motion.tilt-=dir*.01}
 const b=f.bodySpring;
 if(b){
  const t=clamp(b.t/b.duration,0,1);
  const envelope=(1-t)*(1-t);
  // Squash at contact, stretch immediately afterwards; damped impact pendulum
  // with a small forward recoil and an opposing rebound, all about the boots.
  const contact=cos(t*PI*3.25)*envelope;
  const rebound=sin(t*PI*3.25)*envelope;
  const press=b.compression;
  motion.sy-=press*contact;
  motion.sx+=press*.65*contact;
  motion.x+=(b.role==='source'?-1:1)*b.dir*b.slide*rebound;
  motion.y-=Math.max(0,rebound)*press*60;
  motion.tilt+=b.dir*(b.role==='source'?-1:1)*rebound*.034;
 }
 motion.sx=clamp(motion.sx,.88,1.12);
 motion.sy=clamp(motion.sy,.88,1.12);
 motion.y=clamp(motion.y,-11,6);
 motion.x=clamp(motion.x,-28,28);
 motion.tilt=clamp(motion.tilt,-.10,.10);
 return motion;
}
function shake(state,kind,dir=1,level=1){
 if(!state||!PRESETS[kind])return;
 const p=PRESETS[kind];
 const strength=clamp(Number(level)||1,.25,1.4);
 const existing=state.cameraKick;
 if(existing&&existing.t<existing.duration*.22&&
   (PRESETS[existing.kind]?.amp||0)>p.amp*strength)return;
 state.cameraKick={kind,dir:dir<0?-1:1,t:0,duration:p.time,
  amplitude:p.amp*strength};
}
function advanceShake(state,realDt){
 if(!state?.cameraKick)return;
 const k=state.cameraKick;
 k.t+=clamp(Number(realDt)||0,0,.06);
 if(k.t>=k.duration)state.cameraKick=null;
}
function sampleShake(state,reduced=false){
 const n={x:0,y:0,angle:0};
 const k=state?.cameraKick;
 if(!k||reduced||state?.fx===false)return n;
 const p=PRESETS[k.kind]||PRESETS.strike;
 const progress=clamp(k.t/k.duration);
 const damper=Math.pow(1-progress,2.15);
 const amp=k.amplitude*damper;
 const phase=k.t*p.hz*2*PI;
 const leading=sin(phase),secondary=sin(phase*.56+1.4);
 const dir=k.dir;
 if(p.axis==='x'){n.x=amp*(leading*.85+secondary*.15)*dir;n.y=amp*.19*cos(phase*.67)}
 if(p.axis==='y'){n.x=amp*.37*leading*dir;n.y=amp*(secondary*.72+leading*.28)}
 if(p.axis==='diag'){n.x=amp*(leading*.65+secondary*.26)*dir;n.y=amp*.45*cos(phase*.73+.7)}
 if(p.axis==='double'){
  const second=sin(phase-1.65)*(.35+.65*Math.max(0,1-Math.abs(progress-.35)*2.5));
  n.x=amp*(leading*.65+second*.43)*dir;
  n.y=amp*(cos(phase*.69)*.58+second*.4);
 }
 n.angle=(p.roll||0)*damper*sin(phase*.51);
 return n;
}
function contactPulse(a,b,minGap=MIN_GAP){
 if(!a||!b||a.dead||b.dead)return false;
 const dist=Math.abs(a.x-b.x);
 if(dist>=minGap)return false;
 const closing=Math.abs(a.vx||0)+Math.abs(b.vx||0);
 if(closing<165&&!a.comboDash&&!b.comboDash)return false;
 if((a.contactCooldown||0)>0||(b.contactCooldown||0)>0)return false;
 a.contactCooldown=b.contactCooldown=.23;
 const dir=Math.sign(b.x-a.x)||1;
 pulse(a,'contact','source',dir);
 pulse(b,'contact','target',dir);
 return true;
}
root.ArenaMotion={version:'1.0.0',PRESETS,RESPONSE,pose,pulse,advance,shake,advanceShake,sampleShake,contactPulse};
if(typeof module!=='undefined'&&module.exports)module.exports=root.ArenaMotion;
})(globalThis);
