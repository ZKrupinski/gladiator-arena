/* SPARTACUS · shared contact spectacle for arena, practice and 5v5.
 * Effects only. Never mutates health, hitboxes, authored scales or saved profiles.
 */
(function(root){'use strict';
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
 const strong=new Set(['parry','reversal','dash','special','rescue','ambush']);
 const focusKind=k=>k==='rescue'||k==='ambush'?'reversal':k;
 function event(state,kind,attacker,target,clock=0,{team=false,power=1}={}){
  if(!state)return false;
  const motion=root.ArenaMotion;
  const pulseKind={hit:'strike',strike:'strike',guard:'guard',parry:'parry',
   counter:'parry',reversal:'parry',dash:'dash',special:'special',
   rescue:'dash',ambush:'dash',push:'special',assist:'strike'}[kind]||'strike';
  const dir=Math.sign((target?.x??0)-(attacker?.x??0))||attacker?.face||1;
  if(attacker&&!attacker.dead)motion?.pulse?.(attacker,pulseKind,'source',dir);
  if(target&&!target.dead){
   motion?.pulse?.(target,pulseKind,'target',dir);
   motion?.impact?.(target,kind==='parry'||kind==='reversal'?'reversal':pulseKind);
  }
  motion?.shake?.(state,pulseKind,dir,clamp((team?1.24:.84)*power,.24,1.4));
  state.flash=Math.max(state.flash||0,clamp((strong.has(kind)?.48:.15)*power,0,.75));
  const now=Number(clock)||0;
  if(strong.has(kind)&&now>=(state.nextCinematicAt||0)&&root.ArenaFocus?.start){
   state.cinematic=root.ArenaFocus.start(focusKind(kind),target?.x??attacker?.x??640,dir);
   state.nextCinematicAt=now+(team?2.7:2.2);
  }
  return true;
 }
 function advance(state,actors,dt,{paused=false,reduced=false}={}){
  if(!state)return dt;
  const step=paused?0:clamp(dt,0,.05);
  if(step){
   root.ArenaMotion?.advanceShake?.(state,step);
   for(const f of actors||[])if(f)root.ArenaMotion?.advance?.(f,step,step);
   state.flash=Math.max(0,(state.flash||0)-step*1.85);
   if(state.cinematic&&root.ArenaFocus?.advance){
    const shot=root.ArenaFocus.advance(state.cinematic,step,reduced);
    state.cinematic=shot.active?shot.state:null;state.focusFrame=shot.active?shot:null;
   }else state.focusFrame=null;
  }
  return step*(reduced?1:state.focusFrame?.timeScale??1);
 }
 function sample(state,{reduced=false,team=false}={}){
  const kick=root.ArenaMotion?.sampleShake?.(state,reduced)||{x:0,y:0,angle:0};
  const focus=state?.focusFrame;
  const multiplier=team?.28:.22;
  return {x:reduced?0:kick.x,y:reduced?0:kick.y,angle:reduced?0:kick.angle,
   zoom:1+Math.min(team?.12:.085,(focus?.zoom||0)*multiplier),
   flash:reduced?0:clamp((state?.flash||0)*.23+(focus?.bloom||0)*.12,0,.26),
   shade:reduced?0:clamp((focus?.shade||0)*.32,0,.16),
   bars:reduced?0:Math.min(18,(focus?.cinemaBars||0)*.16)};
 }
 function overlay(ctx,w,h,cue){
  if(!ctx||!cue)return;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);
  if(cue.flash>0){ctx.fillStyle='rgba(255,237,197,'+cue.flash+')';ctx.fillRect(0,0,w,h);}
  if(cue.shade>0){
   const grad=ctx.createRadialGradient(w*.5,h*.52,h*.15,w*.5,h*.52,Math.max(w,h)*.77);
   grad.addColorStop(0,'rgba(27,8,4,0)');grad.addColorStop(1,'rgba(27,8,4,'+cue.shade+')');
   ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  }
  if(cue.bars>0){ctx.fillStyle='rgba(15,8,6,.58)';
   ctx.fillRect(0,0,w,cue.bars);ctx.fillRect(0,h-cue.bars,w,cue.bars);}
  ctx.restore();
 }
 root.ArenaCombatFeel=Object.freeze({event,advance,sample,overlay});
 if(typeof module!=='undefined'&&module.exports)module.exports=root.ArenaCombatFeel;
})(typeof window==='object'?window:globalThis);
