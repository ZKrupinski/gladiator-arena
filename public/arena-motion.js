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
 contact:Object.freeze({amp:11,time:.27,hz:25,axis:'x',roll:.0026}),
 strike:Object.freeze({amp:23,time:.34,hz:30,axis:'diag',roll:.0048}),
 guard:Object.freeze({amp:17,time:.30,hz:23,axis:'x',roll:.0035}),
 special:Object.freeze({amp:88,time:1.00,hz:18,axis:'y',roll:.023}),
 dash:Object.freeze({amp:60,time:.83,hz:22,axis:'diag',roll:.019}),
 parry:Object.freeze({amp:56,time:.75,hz:16,axis:'double',roll:.013}),
 reversal:Object.freeze({amp:69,time:.88,hz:16,axis:'double',roll:.018})
});
const RESPONSE=Object.freeze({
 strike:{duration:.29,compression:.065,slide:9},
 guard:{duration:.31,compression:.043,slide:6},
 special:{duration:.42,compression:.075,slide:18},
 dash:{duration:.61,compression:.095,slide:30},
 parry:{duration:.60,compression:.086,slide:23},
 contact:{duration:.26,compression:.047,slide:7}
});
const IMPACTS=Object.freeze({
 strike:Object.freeze({duration:.22,flash:.78,grow:1.055,shrink:.978}),
 guard:Object.freeze({duration:.18,flash:.38,grow:1.028,shrink:.986}),
 special:Object.freeze({duration:.32,flash:.92,grow:1.092,shrink:.961}),
 dash:Object.freeze({duration:.48,flash:1,grow:1.145,shrink:.950}),
 parry:Object.freeze({duration:.43,flash:1,grow:1.117,shrink:.963}),
 reversal:Object.freeze({duration:.49,flash:1,grow:1.145,shrink:.950})
});
const sin=Math.sin,cos=Math.cos,PI=Math.PI;
// Global gladiator+beast hit cue. Never modifies hitboxes or source art.
function impact(f,kind='strike'){
 // Never illuminate a corpse; death/defeat sprites must preserve source art.
 if(!f||f.dead||f.hp<=0||f.action==='defeat'||f.action==='death')return;
 const preset=IMPACTS[kind]||IMPACTS.strike;
 if(f.hitVisual && (IMPACTS[f.hitVisual.kind]?.grow||0)>preset.grow&&
    f.hitVisual.t<preset.duration*.32)return;
 f.hitVisual={kind,t:0,duration:preset.duration};
}
function advanceImpact(f,dt){
 if(!f?.hitVisual)return;
 const state=f.hitVisual;
 state.t=Math.min(state.duration,state.t+clamp(Number(dt)||0,0,.08));
 if(state.t>=state.duration)f.hitVisual=null;
}
function visual(f,reduced=false,fx=true){
 const neutral={scale:1,flash:0};
 if(!f?.hitVisual||f.dead||f.hp<=0||
    f.action==='defeat'||f.action==='death'||reduced||!fx)return neutral;
 const state=f.hitVisual,p=IMPACTS[state.kind]||IMPACTS.strike;
 const phase=clamp(state.t/state.duration);
 let scale;
 if(phase<.20)scale=1+(p.shrink-1)*phase/.20;
 else if(phase<.49)scale=p.shrink+(p.grow-p.shrink)*(phase-.20)/.29;
 else scale=1+(p.grow-1)*Math.pow((1-phase)/.51,2);
 // Two ultra-short translucent glints (0–32 ms, 47–91 ms).
 // The source illustration remains 70%+ visible. Longer body recoil is
 // independent of the flash envelope, even during dramatic slow motion.
 const t=state.t;
 const first=t<.032?Math.max(0,1-t/.032):0;
 const second=t>=.047&&t<.091?Math.max(0,1-Math.abs(t-.067)/.024):0;
 const flash=p.flash*.29*Math.max(first,.72*second);
 return {scale:clamp(scale,.94,1.16),flash:clamp(flash,0,.29)};
}
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
function advance(f,dt,realDt=dt){
 advanceImpact(f,realDt);
 if(!f?.bodySpring)return;
 f.bodySpring.t=Math.min(f.bodySpring.duration,(f.bodySpring.t||0)+clamp(Number(dt)||0,0,.06));
 if(f.bodySpring.t>=f.bodySpring.duration)f.bodySpring=null;
}
function pose(f,clock=0,reduced=false){
 const neutral={x:0,y:0,sx:1,sy:1,tilt:0};
 if(!f||f.dead||reduced)return neutral;
 const seed=f.enemy?1.33:.24,dir=f.face||1;
 const motion={...neutral};
 // Preserve the full original character artwork during every action.
 // Small positional and rotational impulses replace old squash/stretch.
 // Standing feet never climb above the floor.
 const idle=sin(clock*3.9+seed);
 const walking=clamp(Math.abs(f.vx||0)/235,0,1);
 const stride=(f.walkT||0)*15.5+seed;
 const activeFight=f.stagger>0?'hit':f.guard?'guard':f.dodge>0?'dodge':f.action;
 const moving=(activeFight==='idle'||activeFight==='walk')?walking:walking*.25;
 motion.tilt+=dir*idle*.004;
 motion.y-=Math.pow(Math.max(0,sin(stride)),1.2)*moving*5.5;
 motion.x+=sin(stride)*moving*1.9;
 motion.tilt+=sin(stride)*moving*.013;
 // Functional actions animate even for static traditional single-key poses.
 const actionLength=Math.max(.01,f.actionDuration||.35);
 const phase=clamp(1-(f.actionT||0)/actionLength);
 const swing=Math.sin(PI*phase);
 if(f.actionT>0){
  if(activeFight==='attack'){
   motion.x+=dir*swing*6;
   motion.tilt+=dir*.018*swing;
  }else if(activeFight==='special'){
   motion.x+=dir*swing*7;motion.tilt+=dir*.024*swing;
  }else if(activeFight==='guard'){
   motion.tilt-=dir*.016*swing;
  }else if(activeFight==='dodge'){
   motion.y-=swing*6;
  }else if(activeFight==='hit'){
   motion.x-=dir*5*swing;motion.tilt-=dir*.014*swing;
  }else if(activeFight==='comboDash'){
   motion.x+=dir*8*swing;
  }
 }
 if(f.guard){motion.tilt-=dir*.01}
 const b=f.bodySpring;
 if(b){
  const t=clamp(b.t/b.duration,0,1);
  const envelope=(1-t)*(1-t);
  // Contact shock is a brief lean and positional recoil. No sprite deformation.
  // Preserve rendered height and width throughout the impact envelope.
  const contact=cos(t*PI*3.25)*envelope;
  const rebound=sin(t*PI*3.25)*envelope;
  const press=b.compression;
  const roleSign=b.role==='source'?1:-1;
  motion.x+=roleSign*b.dir*(Math.min(4,b.slide*.18)*contact+b.slide*rebound);
  motion.y-=Math.max(0,rebound)*press*60;
  motion.tilt+=b.dir*roleSign*(rebound*.034+contact*.016);
 }
 // A gameplay response may translate or rotate; artwork aspect stays exact.
 motion.sx=1;
 motion.sy=1;
 motion.y=clamp(motion.y,-11,6);
 motion.x=clamp(motion.x,-36,36);
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
root.ArenaMotion={version:'1.4.0',PRESETS,RESPONSE,IMPACTS,pose,pulse,impact,visual,advance,shake,advanceShake,sampleShake,contactPulse};
if(typeof module!=='undefined'&&module.exports)module.exports=root.ArenaMotion;
})(globalThis);
