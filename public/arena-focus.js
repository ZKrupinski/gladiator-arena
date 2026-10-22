/* Arena Focus 2.0 — real-time cinematic envelopes independent of simulated combat.
 * Strong visual punctuation for a connected fourth-hit dash or successful parry.
 * The struck pose is frozen during hitstop, the action recovers in deliberately
 * slow time, and all effects are driven by unscaled real elapsed time.
 */
(function(root){
'use strict';
const PRESETS=Object.freeze({
 dodge:Object.freeze({
  // Visible full-body retreat; i-frames remain defined by combat state.
  duration:.58,hitstop:.012,slowEnd:.25,minRate:.29,
  zoom:0,vignette:.045,bloom:.045,letterbox:0
 }),
 special:Object.freeze({
  // Readable 3-beat technique: short impact stop, illustrated release and recovery.
  // Slight zoom only, keeping both duelists inside the arena as with parry.
  duration:1.08,hitstop:.165,slowEnd:.67,minRate:.18,
  zoom:.05,vignette:.14,bloom:.59,letterbox:0
 }),
 dash:Object.freeze({
   duration:1.18,hitstop:.17,slowEnd:.80,minRate:.09,
   zoom:.38,vignette:.41,bloom:.58,letterbox:32
 }),
 reversal:Object.freeze({
  duration:1.28,hitstop:.16,slowEnd:.78,minRate:.18,zoom:.055,vignette:.12,bloom:.37,letterbox:12
 }),
 parry:Object.freeze({
   // Counterstrike must NEVER cut both actors out of view. Keep a short
   // contact freeze, but no forced zoom, recentering, vignette or cinema bars.
   // Fighter bracing, attack cancellation and sound carry the parry triumph.
   duration:.89,hitstop:.115,slowEnd:.55,minRate:.25,
   zoom:0,vignette:0,bloom:.20,letterbox:0
 })
});
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const ease=t=>{const x=clamp(t);return x*x*(3-2*x);};
const empty=dt=>({active:false,state:null,kind:null,elapsed:0,gameDt:dt,timeScale:1,
    zoom:0,shade:0,bloom:0,pulse:0,cinemaBars:0,centerX:null,dir:1,reduced:false});
function start(kind,x,dir=1){
 const preset=PRESETS[kind];
 if(!preset)return null;
 const supplied=Number(x);
 return {kind,centerX:clamp(Number.isFinite(supplied)?supplied:640,100,1180),
         dir:dir<0?-1:1,elapsed:0,duration:preset.duration};
}
function advance(state,realDt,reducedMotion=false){
 const dt=clamp(Number(realDt)||0,0,.05);
 if(!state||!PRESETS[state.kind]||state.elapsed>=state.duration)return empty(dt);
 const spec=PRESETS[state.kind];
 state.elapsed=Math.min(spec.duration,state.elapsed+dt);
 const t=state.elapsed;
 const recovery=ease((t-spec.slowEnd)/(spec.duration-spec.slowEnd));
 const rate=t<spec.hitstop?.03:spec.minRate+(1-spec.minRate)*recovery;
 const intro=ease(t/.065);
 const intensity=intro*(1-recovery);
 // Fast brilliant impact -> sustained action pause -> receding aftermath.
 const flash=clamp(1-t/.26,0,1);
 const pulse=(1-ease((t-spec.hitstop)/.23));
 const active=t<spec.duration;
 if(!active)return empty(dt);
 const factor=reducedMotion?0:1;
 return {
  active,state,kind:state.kind,elapsed:t,duration:spec.duration,
  gameDt:dt*(reducedMotion?1:rate),
  timeScale:reducedMotion?1:rate,
  zoom:spec.zoom*intensity*factor,
  shade:spec.vignette*intensity*factor,
  bloom:spec.bloom*flash*factor,
  pulse:pulse*factor,
  cinemaBars:spec.letterbox*intensity*factor,
  centerX:state.centerX,dir:state.dir,reduced:!!reducedMotion
 };
}
root.ArenaFocus={version:'2.3.0',PRESETS,start,advance};
if(typeof module!=='undefined'&&module.exports)module.exports=root.ArenaFocus;
})(globalThis);
