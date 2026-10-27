/* Shared editor display geometry. Every character uses the SAME stage
 * camera. No thumbnail auto-fit and no extra class/pose scaling.
 * Duel: index.html drawGrowthPose + ChampionMurmillo.paint.
 * Practice: ludus-practice.js fixed 202px idle-frame reference.
 */
(function(root){'use strict';
const DUEL=348*.82,PRACTICE=202,BEAST=Object.freeze({
 beast_wolf:1,beast_leopard:1.05,beast_tiger:1.12,
 beast_lion:1.18,beast_elephant:1.38
});
const value=(n,d=0)=>Number.isFinite(Number(n))?Number(n):d;
const width=img=>img?.naturalWidth||img?.width||0;
const height=img=>img?.naturalHeight||img?.height||0;
function rect({key,frame,idle=frame,scene='duel',zoom=1,scale=1}={}){
 const art=frame?.canvas||frame,reference=idle?.canvas||idle||art;
 const w=width(art),h=height(art),refH=height(reference)||h;
 if(!w||!h||!refH)return null;
 const z=value(zoom,1),factor=value(scale,1);
 const px=value(frame?.pivotX,w/2),py=value(frame?.footY,h);
 if(key==='npc_carnifex'){
  // ArenaCarnifex draws 270x342 ink at 436x466 with a fixed toe pivot.
  const k=z*factor*(scene==='practice'?PRACTICE/DUEL:1);
  return {w:436*k,h:466*k,pivotX:218*k,pivotY:(326/342)*466*k};
 }
 if(scene==='practice'){
  const k=PRACTICE/refH*z*factor;
  return {w:w*k,h:h*k,pivotX:px*k,pivotY:py*k};
 }
 if(Object.hasOwn(BEAST,key)){
  const k=348*.83*BEAST[key]/refH*z*factor;
  return {w:w*k,h:h*k,pivotX:px*k,pivotY:py*k};
 }
 if(key==='murmillo_champion_red'||key==='murmillo_redcrest_new_v1'){
  // Important: champion source is 960x540; runtime scales it by w/540,
  // not the preview's old 202/source-height convention.
  const k=DUEL/540*z*factor;
  return {w:w*k,h:h*k,pivotX:px*k,pivotY:py*k};
 }
 if(key.startsWith('legacy_')){
  const side=DUEL*z*factor;
  return {w:side,h:side,pivotX:side/2,pivotY:side*(py/h)};
 }
 // GrowthFrames.draw uses FULL CELL dimensions, not cropped alpha bounds.
 const cw=value(idle?.cellWidth||frame?.cellWidth);
 const ch=value(idle?.cellHeight||frame?.cellHeight);
 const k=DUEL/(Math.max(cw,ch)||refH)*z*factor;
 return {w:w*k,h:h*k,pivotX:px*k,pivotY:py*k};
}
function offsetFactor(key,scene){
 // Duel actor authored positions: 202 -> 348*.82. NPC/beast native pixels.
 return scene==='duel'&&!key.startsWith('beast_')&&key!=='npc_carnifex'
  ?DUEL/PRACTICE:1;
}
function draw(ctx,{key,frame,idle=frame,scene='duel',zoom=1,scale=1,
 x=0,y=0,foot=0,offsetX=0,offsetY=0,face=1}={}){
 const b=rect({key,frame,idle,scene,zoom,scale}),img=frame?.canvas||frame;
 if(!ctx||!b||!img)return null;
 const dir=face<0?-1:1,project=offsetFactor(key,scene);
 const cx=x+dir*value(offsetX)*project*zoom;
 const ground=y+(value(foot)+value(offsetY)*project)*zoom;
 ctx.save();
 if(dir<0){ctx.translate(cx*2,0);ctx.scale(-1,1);}
 ctx.drawImage(img,cx-b.pivotX,ground-b.pivotY,b.w,b.h);
 ctx.restore();
 return {...b,center:cx,ground};
}
root.SpartacusStagePreview=Object.freeze({DUEL,PRACTICE,BEAST,rect,draw,offsetFactor});
if(typeof module!=='undefined')module.exports=root.SpartacusStagePreview;
})(typeof window!=='undefined'?window:globalThis);
