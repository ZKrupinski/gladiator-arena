/* SPARTACUS — unified no-crop portrait fit for gladiators and opponents.
 * Transparencies differ by class/grade: fit VISIBLE alpha bounds, not the padded atlas frame.
 * Never stretch or crop character pixels; keep a small safety margin and a common baseline.
 */
(function(root){'use strict';
const cache=new WeakMap();
function bounds(source){
 if(!source||!(source.width||source.naturalWidth)||!(source.height||source.naturalHeight))return null;
 if(cache.has(source))return cache.get(source);
 const sw=source.naturalWidth||source.width,sh=source.naturalHeight||source.height;
 let result={x:0,y:0,w:sw,h:sh};
 try{
  const scan=document.createElement('canvas');scan.width=128;scan.height=128;
  const c=scan.getContext('2d',{willReadFrequently:true});
  c.drawImage(source,0,0,128,128);
  const p=c.getImageData(0,0,128,128).data;
  let l=128,t=128,r=-1,b=-1;
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
   if(p[(y*128+x)*4+3]<18)continue;
   l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);
  }
  if(r>=l&&b>=t){
   const pad=2;
   l=Math.max(0,l-pad);t=Math.max(0,t-pad);r=Math.min(127,r+pad);b=Math.min(127,b+pad);
   result={x:l*sw/128,y:t*sh/128,w:(r-l+1)*sw/128,h:(b-t+1)*sh/128};
  }
 }catch(_){/* no alpha read access: fall back to containing the entire frame */}
 cache.set(source,result);
 return result;
}
function draw(canvas,source,opts={}){
 if(!canvas||!source)return false;
 const ctx=canvas.getContext('2d');if(!ctx)return false;
 const w=canvas.width,h=canvas.height;
 ctx.clearRect(0,0,w,h);
 const b=bounds(source);if(!b||!b.w||!b.h)return false;
 const inset=Math.max(.03,Math.min(.14,Number(opts.inset??.055)));
 const availableW=w*(1-inset*2),availableH=h*(1-inset*2);
 const scale=Math.min(availableW/b.w,availableH/b.h);
 const dw=b.w*scale,dh=b.h*scale;
 const destX=(w-dw)/2,destY=h-h*inset-dh;
 try{
  ctx.save();
  if(opts.flipX){ctx.translate(w,0);ctx.scale(-1,1);}
  ctx.drawImage(source,b.x,b.y,b.w,b.h,destX,destY,dw,dh);
  ctx.restore();return true;
 }catch(_){ctx.restore();return false}
}
root.ArenaPortraitFit={bounds,draw};
})(globalThis);
