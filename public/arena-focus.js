/* Arena impact focus — real-time cinematic clock, independent of fight dt.
 * Short hitstop -> slow follow-through -> smooth recovery, with soft focal zoom.
 * No gameplay damage, hit detection, or fighter state is altered here.
 */
(function(root){
'use strict';
const PRESETS=Object.freeze({
 dash:{duration:.62,hitstop:.075,slowEnd:.39,minRate:.19,zoom:.19,vignette:.17},
 parry:{duration:.69,hitstop:.09,slowEnd:.46,minRate:.15,zoom:.25,vignette:.21}
});
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
function ease(t){const x=clamp(t);return x*x*(3-2*x);}
function start(kind,x){
 const spec=PRESETS[kind];if(!spec)return null;
 return {kind,centerX:clamp(Number(x)||640,100,1180),elapsed:0,duration:spec.duration};
}
function advance(state,realDt,reducedMotion=false){
 const dt=clamp(Number(realDt)||0,0,.05);
 if(!state||!PRESETS[state.kind]||state.elapsed>=state.duration)
  return {active:false,state:null,gameDt:dt,timeScale:1,zoom:0,shade:0,centerX:null};
 const p=PRESETS[state.kind];
 state.elapsed=Math.min(p.duration,state.elapsed+dt);
 const t=state.elapsed;
 const recovery=ease((t-p.slowEnd)/(p.duration-p.slowEnd));
 const slowRate=t<p.hitstop?.035:p.minRate+(1-p.minRate)*recovery;
 const rate=reducedMotion?1:slowRate;
 const intro=ease(t/.07);
 const emphasis=intro*(1-recovery);
 const active=t<p.duration;
 return {active,state:active?state:null,gameDt:dt*rate,timeScale:rate,
   zoom:active?p.zoom*emphasis*(reducedMotion?.35:1):0,
   shade:active?p.vignette*emphasis*(reducedMotion?.2:1):0,
   centerX:state.centerX};
}
root.ArenaFocus={version:'1.0.0',start,advance,PRESETS};
if(typeof module!=='undefined'&&module.exports)module.exports=root.ArenaFocus;
})(globalThis);
