/* CARNIFEX — illustrated executioner and dead-sprite retrieval transition.
 * Never redraws or recreates gladiator art: drawBody() receives the *actual*
 * defeated character snapshot and the original drawFighter()/death pose.
 * No team depth changes. Small rear-stage offset keeps collection behind action.
 */
(function(root){
 'use strict';
 const TIME={arrive:.66,grip:.36,haul:1.50,exit:.34};
 TIME.total=TIME.arrive+TIME.grip+TIME.haul+TIME.exit;
 const EASE=x=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
 const LERP=(a,b,t)=>a+(b-a)*t;
 let artwork=null;
 function preload(){
  if(artwork)return artwork;
  if(typeof Image==='undefined')return null;
  artwork=new Image();
  artwork.decoding='async';
  artwork.src='assets/npc/carnifex-executioner.svg?v=1';
  return artwork;
 }
 function begin(loser,allyWon,step){
  if(!loser)throw Error('Missing defeated gladiator for Carnifex retrieval');
  preload();
  const side=loser.enemy?1:-1;
  const body={...loser,cfg:loser.cfg,dead:true,hp:0,
   action:'defeat',actionT:0,actionDuration:0,stagger:0,
   comboDash:null,attackCD:0,vx:0,dodge:0,knockT:0,invuln:0};
  return {body,initialX:loser.x,side,allyWon:!!allyWon,step,
   t:0,total:TIME.total,finished:false,pickedUp:false};
 }
 function positions(seq){
  const side=seq.side,cx=seq.initialX;
  const near=cx+side*148,enter=side>0?1510:-230;
  const beyond=side>0?1530:-250;
  const t=Math.max(0,Math.min(TIME.total,seq.t));
  if(t<TIME.arrive){
   return {executionerX:LERP(enter,near,EASE(t/TIME.arrive)),bodyX:cx,
    rope:0,lift:0,exiting:false,bodyVisible:true};
  }
  if(t<TIME.arrive+TIME.grip){
   const grip=(t-TIME.arrive)/TIME.grip;
   return {executionerX:near,bodyX:cx,rope:EASE(grip),lift:grip*4,
    exiting:false,bodyVisible:true};
  }
  if(t<TIME.arrive+TIME.grip+TIME.haul){
   const k=(t-TIME.arrive-TIME.grip)/TIME.haul;
   // Keep the exact original defeated sprite in tow, with foot/body contact.
   const haul=EASE(k);
   const bodyX=LERP(cx,beyond-side*145,haul);
   return {executionerX:bodyX+side*148,bodyX,rope:1,lift:2+Math.sin(k*Math.PI*7)*1.8,
    exiting:true,bodyVisible:true};
  }
  return {executionerX:beyond,bodyX:beyond-side*148,rope:1,
   lift:0,exiting:true,bodyVisible:false};
 }
 function advance(seq,dt){
  if(!seq||seq.finished)return true;
  seq.t=Math.min(TIME.total,seq.t+Math.max(0,Number(dt)||0));
  seq.pickedUp=seq.t>=TIME.arrive+TIME.grip;
  seq.finished=seq.t>=TIME.total-.000001;
  return seq.finished;
 }
 function draw(ctx,seq,drawBody,floorY=617){
  if(!ctx||!seq||typeof drawBody!=='function')return;
  const pose=positions(seq),side=seq.side;
  // Rear stage is 26px above the front figures and 15% lower in contrast.
  ctx.save();ctx.translate(0,-25);
  const arrival=EASE(seq.t/Math.max(.01,TIME.arrive));
  if(artwork?.complete&&artwork.naturalWidth){
   ctx.save();
   const stride=pose.exiting?Math.sin(seq.t*18)*5:Math.sin(seq.t*21)*7;
   ctx.translate(pose.executionerX,floorY-15+stride);
   if(side>0)ctx.scale(-1,1);
   const gait=pose.exiting?Math.sin(seq.t*14)*.028:Math.sin(seq.t*18)*.022;
   ctx.rotate(gait);
   ctx.filter='contrast(1.08) saturate(.79) brightness(.82)';
   // 415 px NPC silhouette versus 348 px regular fighter.
   ctx.drawImage(artwork,-169,-421,338,444);
   ctx.restore();
  }
  if(pose.rope>.01){
   const handX=pose.executionerX-side*98,hipX=pose.bodyX+side*29;
   const handY=floorY-111,hipY=floorY-74-pose.lift;
   ctx.save();ctx.strokeStyle='#27180f';ctx.lineWidth=10;ctx.lineCap='round';
   ctx.beginPath();ctx.moveTo(handX,handY);
   ctx.quadraticCurveTo((handX+hipX)/2,floorY-120,hipX,hipY);ctx.stroke();
   ctx.strokeStyle='#ac8457';ctx.lineWidth=5;
   ctx.beginPath();ctx.moveTo(handX,handY);
   ctx.quadraticCurveTo((handX+hipX)/2,floorY-120,hipX,hipY);ctx.stroke();
   ctx.strokeStyle='#e5c19777';ctx.lineWidth=1.7;ctx.stroke();
   ctx.restore();
  }
  if(pose.bodyVisible){
   const corpse={...seq.body,x:pose.bodyX,dead:true,hp:0,action:'defeat',actionT:0,
    comboDash:null,vx:0,dodge:0,invuln:0};
   ctx.save();
   ctx.translate(0,-pose.lift);
   // Tint through canvas context, not by modifying or substituting sprite art.
   ctx.filter='saturate(.78) brightness(.84)';
   drawBody(corpse);
   ctx.restore();
  }
  ctx.restore();
 }
 root.ArenaCarnifex={version:'1.0.0',TIME,begin,advance,positions,draw,preload,
  isReady:()=>!!(artwork?.complete&&artwork.naturalWidth)};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.ArenaCarnifex;
})(globalThis);