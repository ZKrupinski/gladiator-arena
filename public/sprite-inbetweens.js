/* SPARTACUS — original-art, five-frame in-between animation v1.
 * No replacement art: each frame is generated strictly from the existing
 * isolated key-pose canvas. The approved center key pose remains pixel-exact.
 * Warps happen above the planted boots, without changing gameplay hitboxes.
 */
(function(root){
'use strict';
const sequence=[
 {lean:0,breath:0,spread:0},
 {lean:.44,breath:-1.2,spread:.008},
 {lean:1,breath:-2.5,spread:.017},
 {lean:-.72,breath:.8,spread:-.009},
 {lean:-.19,breath:.2,spread:.003}
];
const modes={
 0:{amplitude:5.8,rate:.21}, // ready / breathing
 1:{amplitude:9.4,rate:.10}, // walk / footwork
 2:{amplitude:14,rate:.07},  // slash
 3:{amplitude:17,rate:.075}, // heavy/special
 4:{amplitude:4.5,rate:.12},
 5:{amplitude:11,rate:.075},
 6:{amplitude:4.6,rate:.125},
 7:{amplitude:10.5,rate:.09},
 8:{amplitude:13,rate:.085},
 9:{amplitude:5,rate:.16},
 10:{amplitude:8,rate:.17},
 11:{amplitude:5.5,rate:.20}
};
const MAX_POSES=14;
const PAD=22;
const cache=new Map();
function canvas(w,h){
 const out=document.createElement('canvas');out.width=w;out.height=h;
 return out;
}
function warp(source,style,phase){
 const p=sequence[phase],w=source.width,h=source.height;
 const out=canvas(w+PAD*2,h+PAD*2),g=out.getContext('2d');
 // Directly draw the original, unchanged key pose as frame zero.
 if(phase===0){
  g.drawImage(source,PAD,PAD);return out;
 }
 const step=3;
 for(let y=0;y<h;y+=step){
  const height=Math.min(step+1,h-y),local=y/Math.max(1,h);
  // Torso, arms and head sway. No translation at boots (bottom 24%).
  const upper=Math.pow(Math.max(0,1-local/.78),1.45);
  const cloth=Math.sin(local*11+phase*.73)*Math.max(0,1-Math.abs(local-.66)/.21);
  const dx=PAD+style.amplitude*p.lean*upper + cloth*1.7*p.lean;
  const dy=PAD+style.amplitude*.11*p.breath*upper;
  const stretch=1+p.spread*upper;
  const destWidth=w*stretch;
  const left=dx+(w-destWidth)/2;
  g.drawImage(source,0,y,w,height,left,dy+y,destWidth,height);
 }
 return out;
}
function framesFor(source,pose){
 if(!source||!source.width||!source.height)return null;
 const hit=cache.get(source);
 if(hit){
  cache.delete(source);cache.set(source,hit);return hit;
 }
 const style=modes[pose]||modes[0];
 const variants=sequence.map((_,i)=>warp(source,style,i));
 const pack={variants,pivotPadding:PAD};
 cache.set(source,pack);
 // All classes and growth tiers can be encountered: bound mobile GPU memory.
 while(cache.size>MAX_POSES){
  const key=cache.keys().next().value;
  const evicted=cache.get(key);cache.delete(key);
  for(const c of evicted.variants){c.width=1;c.height=1;}
 }
 return pack;
}
function phaseFor(pose,clock,progress,offset=0){
 if(Number.isFinite(progress)){
  return Math.min(4,Math.max(0,Math.floor(progress*5)));
 }
 const st=(modes[pose]||modes[0]).rate;
 return Math.floor((Math.max(0,clock)+offset)/st)%5;
}
function render(ctx,source,pose,x,y,w,h,flip,alpha,clock,progress,offset=0,pivotX=null,footY=null,scale=1){
 const pack=framesFor(source,pose);if(!pack)return false;
 const phase=phaseFor(pose,clock,progress,offset);
 const pic=pack.variants[phase];
 const pw=pivotX==null?source.width/2:pivotX;
 const fy=footY==null?source.height:footY;
 const center=x+w/2;
 ctx.save();ctx.globalAlpha*=alpha;
 if(flip){ctx.translate(center,0);ctx.scale(-1,1);ctx.translate(-center,0);}
 ctx.drawImage(pic,
   center-(pw+PAD)*scale,
   y+h-(fy+PAD)*scale,
   pic.width*scale,pic.height*scale);
 ctx.restore();return true;
}
function drawGrowth(ctx,atlas,pose,x,y,w,h,flip=false,alpha=1,clock=0,progress=null,offset=0){
 const f=atlas?.frames?.[pose];if(!f)return false;
 const scale=Math.min(w/atlas.cellWidth,h/atlas.cellHeight);
 return render(ctx,f.canvas,pose,x,y,w,h,flip,alpha,clock,progress,offset,
   f.pivotX,f.footY,scale);
}
function drawLegacy(ctx,source,pose,x,y,w,h,flip=false,alpha=1,clock=0,progress=null,offset=0){
 if(!source||!source.width||!source.height)return false;
 const pack=framesFor(source,pose);if(!pack)return false;
 const pic=pack.variants[phaseFor(pose,clock,progress,offset)];
 // Legacy uses a screen-sized sprite cell, not growth-sheet foot pivots.
 // Keep EXACT existing x/y/w/h while expanding the crop gutter outside it.
 const padX=PAD*w/source.width,padY=PAD*h/source.height;
 ctx.save();ctx.globalAlpha*=alpha;
 if(flip){ctx.translate(x+w/2,0);ctx.scale(-1,1);ctx.translate(-(x+w/2),0);}
 ctx.drawImage(pic,x-padX,y-padY,w+padX*2,h+padY*2);
 ctx.restore();return true;
}
root.SpriteInbetweens={drawGrowth,drawLegacy,phaseFor,
 // Exposes only additional ORIGINAL-ART frames, suitable for training UI.
 frame(source,pose,phase=0){
  const pack=framesFor(source,pose);
  return pack?.variants?.[Math.abs(Math.floor(phase))%5]||source;
 },
 clear(){
 for(const pack of cache.values())for(const canvas of pack.variants){canvas.width=1;canvas.height=1;}
 cache.clear();
}};
})(globalThis);
