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
 root.GrowthFrames={isolate,draw};
 if(typeof module!=='undefined')module.exports=root.GrowthFrames;
})(globalThis);
