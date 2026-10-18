/* CARNIFEX SD — oversized Roman arena executioner, using the approved animated sprite artwork.
 * Defeated fighter is NEVER baked into this atlas. drawBody always receives
 * the original, already-knocked-out combat sprite from the real duel renderer.
 */
(function(root){
'use strict';
const TIME={arrive:.96,grip:.48,haul:1.92,exit:.34};
TIME.total=TIME.arrive+TIME.grip+TIME.haul+TIME.exit;
const W=1280,FLOOR=617,ATLAS_COLS=8,CELL_W=340,CELL_H=370;
const SD_ART='assets/npc/carnifex-sd-atlas.webp?v=4';
const OLD_ART='assets/npc/carnifex-executioner.svg?v=1';
const EASE=x=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
const LERP=(a,b,t)=>a+(b-a)*t;
let artwork=null,fallback=null;
function image(source){
 if(typeof Image==='undefined')return null;
 const img=new Image();img.decoding='async';img.src=source;
 return img;
}
function preload(){
 if(!artwork)artwork=image(SD_ART);
 if(!fallback)fallback=image(OLD_ART);
 return artwork||fallback;
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
 const near=cx+side*145,enter=side>0?1510:-230;
 const beyond=side>0?W+480:-480;
 const t=Math.max(0,Math.min(TIME.total,seq.t));
 if(t<TIME.arrive){
  const k=EASE(t/TIME.arrive);
  return {executionerX:LERP(enter,near,k),bodyX:cx,
   rope:0,lift:0,exiting:false,bodyVisible:true,phase:'walk',frame:Math.min(7,Math.floor(t/TIME.arrive*8))};
 }
 if(t<TIME.arrive+TIME.grip){
  const grip=(t-TIME.arrive)/TIME.grip;
  return {executionerX:near,bodyX:cx,rope:EASE(grip),lift:0,
   exiting:false,bodyVisible:true,phase:'grab',frame:Math.min(3,Math.floor(grip*4))};
 }
 if(t<TIME.arrive+TIME.grip+TIME.haul){
  const k=(t-TIME.arrive-TIME.grip)/TIME.haul;
  // The hand and the body stay locked to the same contact point throughout retreat.
  const bodyX=LERP(cx,beyond-side*145,EASE(k));
  const last=Math.min(3,Math.floor(k*4));
  return {executionerX:bodyX+side*145,bodyX,rope:1,lift:0,
   exiting:true,bodyVisible:true,phase:'drag',frame:4+last};
 }
 return {executionerX:beyond,bodyX:beyond-side*145,rope:1,
  lift:0,exiting:true,bodyVisible:false,phase:'exit',frame:7};
}
function advance(seq,dt){
 if(!seq||seq.finished)return true;
 seq.t=Math.min(TIME.total,seq.t+Math.max(0,Number(dt)||0));
 seq.pickedUp=seq.t>=TIME.arrive+TIME.grip;
 seq.finished=seq.t>=TIME.total-.000001;
 return seq.finished;
}
function drawExecutioner(ctx,seq,pose,floorY){
 const art=artwork?.complete&&artwork.naturalWidth===ATLAS_COLS*CELL_W&&artwork.naturalHeight===2*CELL_H
  ?artwork:null;
 const backup=fallback?.complete&&fallback.naturalWidth?fallback:null;
 if(!art&&!backup)return;
 const side=seq.side;
 // Walk into the arena facing the fallen fighter. Turn during the grip,
 // then move out with the dragging hand behind the character, next to the corpse.
 const inward=pose.phase==='walk'||(pose.phase==='grab'&&pose.frame<=1);
 const facing=inward?-side:side;
 const flip=facing<0;
 const gait=pose.phase==='walk'?Math.sin(seq.t*22)*3.1:
   pose.exiting?Math.sin(seq.t*14)*2.0:0;
 const tilt=pose.phase==='walk'?Math.sin(seq.t*9)*.010:pose.exiting?Math.sin(seq.t*8)*.008:0;
 ctx.save();
 ctx.translate(pose.executionerX,floorY+gait);
 ctx.scale(flip?-1:1,1);
 ctx.rotate(tilt);
 ctx.filter='contrast(1.03) saturate(.93) brightness(.92)';
 if(art){
  const row=pose.phase==='walk'?0:1;
  const frame=pose.frame;
  // All sixteen sprites have a cleaned toe silhouette and atlas baseline y=335.
  ctx.drawImage(art,frame*CELL_W,row*CELL_H,CELL_W,CELL_H,
   -218,-444,436,466);
 }else{
  ctx.drawImage(backup,-205,-447,410,466);
 }
 ctx.restore();
}
function draw(ctx,seq,drawBody,floorY=FLOOR){
 if(!ctx||!seq||typeof drawBody!=='function')return;
 const pose=positions(seq);
 // Subtly recessed depth, while feet and the collected corpse remain on the sand.
 ctx.save();
 // Place the bulky executioner 10px farther upstage than the corpse;
 // the new painted atlas also gives the boots a raised, uncropped baseline.
 ctx.save();ctx.translate(0,-24);
 drawExecutioner(ctx,seq,pose,floorY);
 ctx.restore();
 if(pose.bodyVisible){
  const corpse={...seq.body,x:pose.bodyX,dead:true,hp:0,
   action:'defeat',actionT:0,comboDash:null,vx:0,dodge:0,invuln:0};
  ctx.save();ctx.translate(0,-14);ctx.filter='saturate(.82) brightness(.86)';
  drawBody(corpse);
  ctx.restore();
 }
 ctx.restore();
}
root.ArenaCarnifex={version:'4.0.0',TIME,begin,advance,positions,draw,preload,
 isReady:()=>!!(artwork?.complete&&artwork.naturalWidth===ATLAS_COLS*CELL_W),
 sprite:{width:2720,height:740,frameWidth:CELL_W,frameHeight:CELL_H,frames:8,baselineY:335,source:SD_ART}
};
if(typeof module!=='undefined'&&module.exports)module.exports=root.ArenaCarnifex;
})(globalThis);
