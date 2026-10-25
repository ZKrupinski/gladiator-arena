/* CONCORDIA · 5v5 camera director: readable overview -> brief clash push-in -> return.
 * Render-only, real-time state. All 10 actors and arena background share one lens.
 * Never modifies fighter position, authored art scale, collision or combat clock.
 */
(function(root){'use strict';
 const clamp=(n,a,b)=>Math.min(b,Math.max(a,Number.isFinite(n)?n:a));
 const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
 const IMPORTANT={riposte:5,rescue:5,ambush:5,parry:4,counter:4,push:4,dash:2,assist:2};
 const create=()=>({clock:0,phase:'overview',phaseTime:0,phaseCounts:{overview:1,close:0,return:0},
  zoom:1,x:640,y:360,focusX:640,focusY:520,focusAt:-100,focusRank:0,
  lockedX:640,lockedY:520,shots:0});
 // A single memorable exchange, not every normal hit, sets the focal action.
 function record(cam,events=[]){
  for(const e of events){
   const rank=IMPORTANT[e.type]||0;
   if(!rank||!Number.isFinite(e.x)||!Number.isFinite(e.y))continue;
   if(rank>cam.focusRank||cam.clock-cam.focusAt>1.25){
    cam.focusX=clamp(e.x,100,1180);cam.focusY=clamp(e.y,390,680);
    cam.focusRank=rank;cam.focusAt=cam.clock;
   }
  }
 }
 function pairFocus(units=[]){
  const living=units.filter(u=>!u.dead&&Number.isFinite(u.x)&&Number.isFinite(u.y));
  let best=null,dist=Infinity;
  for(let i=0;i<living.length;i++)for(let j=i+1;j<living.length;j++){
   const a=living[i],b=living[j];
   if(a.side===b.side)continue;
   const d=Math.hypot(a.x-b.x,(a.y-b.y)*1.3);
   if(d<dist){dist=d;best={x:(a.x+b.x)/2,y:(a.y+b.y)/2};}
  }
  return best||{x:640,y:520};
 }
 function next(cam,phase){
  cam.phase=phase;cam.phaseTime=0;cam.phaseCounts[phase]++;
  if(phase==='close')cam.shots++;
 }
 function advance(cam,dt,{units=[],mobile=false,reduced=false,paused=false,finished=false}={}){
  if(!cam)return {zoom:1,x:640,y:360,phase:'overview'};
  const step=clamp(dt,0,.05);
  if(paused)return {zoom:cam.zoom,x:cam.x,y:cam.y,phase:cam.phase};
  if(finished||reduced){
   // Accessibility and the result screen prefer an unmoving complete battlefield.
   const blend=1-Math.exp(-7*step);
   cam.zoom+=(1-cam.zoom)*blend;cam.x+=(640-cam.x)*blend;cam.y+=(360-cam.y)*blend;
   if(reduced){cam.zoom=1;cam.x=640;cam.y=360;}
   return {zoom:cam.zoom,x:cam.x,y:cam.y,phase:'overview'};
  }
  cam.clock+=step;cam.phaseTime+=step;
  if(cam.phase==='overview'&&(cam.phaseTime>=3.15||
      cam.phaseTime>=1.85&&cam.focusRank>=4&&cam.clock-cam.focusAt<.75)){
   const latest=cam.clock-cam.focusAt<2.4?
    {x:cam.focusX,y:cam.focusY}:pairFocus(units);
   cam.lockedX=latest.x;cam.lockedY=latest.y;cam.focusRank=0;
   next(cam,'close');
  }else if(cam.phase==='close'&&cam.phaseTime>=1.78)next(cam,'return');
  else if(cam.phase==='return'&&cam.phaseTime>=1.02)next(cam,'overview');
  const living=units.filter(u=>!u.dead&&Number.isFinite(u.x));
  const spread=living.length?Math.max(...living.map(u=>u.x))-Math.min(...living.map(u=>u.x)):1100;
  const baseZoom=mobile?1.071:1.105;
  const maxZoom=baseZoom-(spread>900?.026:spread>740?.014:0);
  let envelope=0;
  if(cam.phase==='close')envelope=ease(cam.phaseTime/.62);
  if(cam.phase==='return')envelope=1-ease(cam.phaseTime/.94);
  const wantedZoom=1+envelope*(maxZoom-1);
  // Exponential interpolation smooths entry and exit at variable frame rates.
  const blend=1-Math.exp(-8*step);
  cam.zoom+=(wantedZoom-cam.zoom)*blend;
  cam.zoom=clamp(cam.zoom,1,maxZoom);
  // The backdrop exactly covers [0,1280]x[0,720]; clamping the camera world
  // center to the visible half extents guarantees zero blank-edge exposure.
  const worldW=1280/(cam.zoom*2),worldH=720/(cam.zoom*2);
  const wantedX=clamp(640+(cam.lockedX-640)*.40*envelope,worldW,1280-worldW);
  const wantedY=clamp(360+(cam.lockedY-360)*.16*envelope,worldH,720-worldH);
  cam.x=clamp(cam.x+(wantedX-cam.x)*blend,worldW,1280-worldW);
  cam.y=clamp(cam.y+(wantedY-cam.y)*blend,worldH,720-worldH);
  return {zoom:cam.zoom,x:cam.x,y:cam.y,phase:cam.phase};
 }
 root.ArenaCoopCamera=Object.freeze({create,record,advance,pairFocus,IMPORTANT});
 if(typeof module!=='undefined'&&module.exports)module.exports=root.ArenaCoopCamera;
})(typeof window==='object'?window:globalThis);
