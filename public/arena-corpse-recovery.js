/* CARNIFEX · Arena clean-up procession
 * The executioner is a separate, behind-the-fighters illustrated NPC.
 * The corpse is the ORIGINAL defeated combat entity, drawn with the very same
 * sprite renderer and defeat animation (no copy, new silhouette or reslicing).
 * State machine is isolated from duel AI, hitboxes, hotkeys and career logic.
 */
(function(root){
'use strict';
const W=1280,FLOOR=617;
const timing={fall:.34,enter:1.15,grip:.46,drag:2.28,depart:.10};
const total=Object.values(timing).reduce((a,b)=>a+b,0);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const smooth=v=>{const t=clamp(v,0,1);return t*t*(3-2*t)};
const texture=typeof Image!=='undefined'?new Image():null;
if(texture)texture.src='assets/combat/carnifex-executioner.svg?v=1';
function create(defeated,survivor){
 if(!defeated||!survivor)throw Error('missing fighters for corpse recovery');
 const direction=defeated.x>=W*.5?1:-1; // remove bodies through their own gate
 const spawnX=direction>0?W+220:-220;
 const approachX=defeated.x+direction*165;
 const exitX=direction>0?W+560:-560;
 return {defeated,survivor,direction,spawnX,approachX,exitX,
  bodyX:defeated.x,bodyY:FLOOR,originalX:defeated.x,originalFace:defeated.face,
  actorX:spawnX,elapsed:0,stage:'fall',completed:false,
  length:total,hasGrabbed:false};
}
function advance(state,dt){
 if(!state||state.completed)return state;
 const safe=clamp(Number(dt)||0,0,.07),t=state.elapsed=Math.min(total,state.elapsed+safe);
 const first=timing.fall+timing.enter,second=first+timing.grip,third=second+timing.drag;
 let actor,body=state.originalX,stage='fall';
 if(t<=timing.fall){
  actor=state.spawnX;
 }else if(t<first){
  stage='enter';
  actor=state.spawnX+(state.approachX-state.spawnX)*smooth((t-timing.fall)/timing.enter);
 }else if(t<second){
  stage='grip';actor=state.approachX;
 }else if(t<third){
  stage='drag';state.hasGrabbed=true;
  const fraction=smooth((t-second)/timing.drag);
  actor=state.approachX+(state.exitX-state.approachX)*fraction;
  body=state.originalX+(actor-state.approachX);
 }else{
  stage='depart';state.hasGrabbed=true;
  actor=state.exitX;body=state.originalX+state.exitX-state.approachX;
 }
 state.stage=stage;state.actorX=actor;state.bodyX=body;
 state.defeated.x=body;
 // Freeze the original sprite's authentic defeat pose; never force upright idle.
 state.defeated.dead=true;state.defeated.hp=0;
 state.defeated.action='defeat';state.defeated.actionT=Math.max(0,state.defeated.actionT-safe);
 state.defeated.vx=0;
 if(t>=total){state.completed=true;state.stage='complete';}
 return state;
}
function drawChain(ctx,state){
 const dir=state.direction;
 const ax=state.actorX-dir*103,ay=FLOOR-184;
 const bx=state.bodyX+dir*45,by=FLOOR-38;
 // The iron restraint is subdued, kept behind the ORIGINAL defeated sprite.
 ctx.save();
 ctx.strokeStyle='#171715';ctx.lineWidth=7;ctx.lineCap='round';
 ctx.beginPath();ctx.moveTo(ax,ay);ctx.quadraticCurveTo((ax+bx)/2,FLOOR-78,bx,by);ctx.stroke();
 ctx.lineWidth=2;ctx.strokeStyle='#9e8060';ctx.setLineDash?.([6,8]);
 ctx.beginPath();ctx.moveTo(ax,ay);ctx.quadraticCurveTo((ax+bx)/2,FLOOR-78,bx,by);ctx.stroke();
 ctx.setLineDash?.([]);
 ctx.restore();
}
function drawExecutioner(ctx,state){
 if(state.stage==='fall'||state.stage==='complete')return;
 const moving=state.stage==='enter'||state.stage==='drag';
 const stride=moving?Math.sin(state.elapsed*22)*4:0;
 const spriteHeight=497,spriteWidth=spriteHeight*540/740;
 const alpha=state.stage==='depart'?clamp((total-state.elapsed)/timing.depart,0,1):1;
 ctx.save();
 ctx.globalAlpha*=alpha*.96;
 // Slightly behind fighters: feet 14px higher, smaller atmospheric contrast.
 ctx.translate(state.actorX,FLOOR-13+stride);
 if(state.direction<0)ctx.scale(-1,1);
 if(texture?.complete&&texture.naturalWidth>0){
  ctx.drawImage(texture,-spriteWidth/2,-spriteHeight,spriteWidth,spriteHeight);
 }else{
  // Safe silhouette while the artwork downloads (never block the KO sequence).
  ctx.fillStyle='#342620';ctx.beginPath();ctx.ellipse(0,-255,135,190,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#50413b';ctx.fillRect(-92,-225,175,210);
  ctx.fillStyle='#413d39';ctx.beginPath();ctx.arc(0,-425,49,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
function draw(ctx,state,drawOriginalFighter){
 if(!ctx||!state||state.completed)return;
 // 1. Carnifex sprite behind everything.
 drawExecutioner(ctx,state);
 // 2. Its restrained hook/chain behind the actual victim.
 if(state.hasGrabbed)drawChain(ctx,state);
 // 3. The exact defeated gladiator frame stays in the scene and slides away.
 // Only the original fighter's world X changes; no alternate dead-body vector.
 if(typeof drawOriginalFighter==='function')drawOriginalFighter(state.defeated);
}
root.ArenaCorpseRecovery={version:'1.0.0',timing,total,create,advance,draw};
if(typeof module!=='undefined'&&module.exports)module.exports=root.ArenaCorpseRecovery;
})(globalThis);