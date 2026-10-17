/* Pixel-exact separation of the approved growth sheets. No grid clipping. */
(function(root){
 'use strict';
 const GUTTER=4;
 function isolate(image,sheet,makeCanvas=()=>document.createElement('canvas')){
  if(!sheet||sheet.frames.length!==12||image.naturalWidth!==sheet.size[0]||image.naturalHeight!==sheet.size[1])throw new Error('성장 시트 규격 불일치');
  const source=makeCanvas();source.width=sheet.size[0];source.height=sheet.size[1];
  const brush=source.getContext('2d',{willReadFrequently:true});brush.drawImage(image,0,0);
  const data=brush.getImageData(0,0,source.width,source.height).data;
  const frames=sheet.frames.map(spec=>{
   const [x,y,w,h]=spec.box,canvas=makeCanvas();canvas.width=w+GUTTER*2;canvas.height=h+GUTTER*2;
   const target=canvas.getContext('2d'),pixels=target.createImageData(canvas.width,canvas.height);
   for(let i=0;i<spec.runs.length;i+=2){
    const offset=spec.runs[i],count=spec.runs[i+1],row=Math.floor(offset/w),col=offset%w;
    if(row>=h||col+count>w)throw new Error('잘못된 성장 프레임 영역');
    const start=((y+row)*source.width+x+col)*4,dest=((row+GUTTER)*canvas.width+col+GUTTER)*4;
    pixels.data.set(data.subarray(start,start+count*4),dest);
   }
   target.putImageData(pixels,0,0);
   return {canvas,pivotX:spec.pivotX+GUTTER,footY:h+GUTTER};
  });
  // Release the temporary full-sheet bitmap. Only isolated pose canvases remain.
  source.width=source.height=1;
  return {frames,cellWidth:sheet.size[0]/4,cellHeight:sheet.size[1]/3};
 }
 function draw(ctx,atlas,index,x,y,w,h,flip=false,alpha=1){
  const frame=atlas?.frames[index];if(!frame)return false;
  const scale=Math.min(w/atlas.cellWidth,h/atlas.cellHeight),anchor=x+w/2;
  ctx.save();ctx.globalAlpha=alpha;
  if(flip){ctx.translate(anchor,0);ctx.scale(-1,1);ctx.translate(-anchor,0);}
  ctx.drawImage(frame.canvas,anchor-frame.pivotX*scale,y+h-frame.footY*scale,frame.canvas.width*scale,frame.canvas.height*scale);
  ctx.restore();return true;
 }

 // Every existing 4x3 SD sprite pose gains four NON-DESTRUCTIVE in-betweens.
 // These are built from the exact original pixels and never redraw armor,
 // face, sword, shield or class identity. Five frames per key pose.
 const MOTION_FRAMES=5;
 const motionCache=new WeakMap();
 const INBETWEEN_PAD=18;
 // Pose-specific movement strength (source sheet frame index, 0..11).
 // The feet never rise in idle, attack, block, impact or victory poses.
 const STRENGTH=[.55,1.02,1.36,1.42,1.46,1.48,.86,1.16,1.24,.55,1.03,.68];
 const MOMENT=[0,-.54,-1,.72,.3]; // ordered by the source timeline
 function createMotionFrame(original,pose,step,makeCanvas=()=>document.createElement('canvas')){
  if(!original||!original.canvas||step<0||step>=MOTION_FRAMES)return null;
  if(step===0)return original; // exact user-approved key pose
  const src=original.canvas,w=src.width,h=src.height;
  const canvas=makeCanvas();canvas.width=w+INBETWEEN_PAD*2;canvas.height=h+INBETWEEN_PAD*2;
  const ctx=canvas.getContext('2d');if(!ctx)return original;
  ctx.imageSmoothingEnabled=true;
  const strength=STRENGTH[pose]??1;
  const movement=MOMENT[step];
  // Piecewise non-rigid deformation of original isolated art. Top/torso
  // pivots, waist counter-rotates very gently, planted feet remain EXACT.
  // Scanline warping keeps original textures, silhouette and all gear.
  const slice=3;
  for(let y=0;y<h;y+=slice){
   const n=Math.min(slice,h-y);
   const height=Math.min(h,n+2);
   const v=y/Math.max(1,h-1);
   const upper=Math.pow(Math.max(0,1-v),1.55);
   const waist=Math.sin(Math.PI*v);
   const dx=movement*strength*(6.1*upper+1.7*waist);
   const dy=(Math.cos(step*Math.PI/2)-1)*strength*1.45*upper;
   ctx.drawImage(src,0,y,w,height,
     INBETWEEN_PAD+dx,INBETWEEN_PAD+y+dy,w,height);
  }
  return {canvas,pivotX:original.pivotX+INBETWEEN_PAD,
          footY:original.footY+INBETWEEN_PAD};
 }
 function motionFrame(atlas,index,step,makeCanvas=()=>document.createElement('canvas')){
  if(!atlas?.frames||!Number.isInteger(index)||index<0||index>=atlas.frames.length)return null;
  const f=Math.max(0,Math.min(MOTION_FRAMES-1,Math.trunc(step)||0));
  if(f===0)return atlas.frames[index];
  let cache=motionCache.get(atlas);
  if(!cache){cache=new Map();motionCache.set(atlas,cache);}
  let pack=cache.get(index);
  if(!pack){
   pack=Array.from({length:MOTION_FRAMES},(_,i)=>
      createMotionFrame(atlas.frames[index],index,i,makeCanvas));
   cache.set(index,pack);
   // Limit high-resolution memory per active class/level. Other poses
   // regenerate on demand rather than retaining every key pose forever.
   if(cache.size>5)cache.delete(cache.keys().next().value);
  }else{
   cache.delete(index);cache.set(index,pack);
  }
  return pack[f];
 }
 function drawMotion(ctx,atlas,index,step,x,y,w,h,flip=false,alpha=1){
  const frame=motionFrame(atlas,index,step);if(!frame)return false;
  const scale=Math.min(w/atlas.cellWidth,h/atlas.cellHeight),anchor=x+w/2;
  ctx.save();ctx.globalAlpha=alpha;
  if(flip){ctx.translate(anchor,0);ctx.scale(-1,1);ctx.translate(-anchor,0);}
  ctx.drawImage(frame.canvas,anchor-frame.pivotX*scale,
    y+h-frame.footY*scale,frame.canvas.width*scale,frame.canvas.height*scale);
  ctx.restore();return true;
 }
 root.GrowthFrames={isolate,draw,drawMotion,motionFrame,createMotionFrame,MOTION_FRAMES};

 if(typeof module!=='undefined')module.exports=root.GrowthFrames;
})(globalThis);
