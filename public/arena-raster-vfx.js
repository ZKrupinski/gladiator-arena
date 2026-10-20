/* Directional VFX v4: ten authored eight-frame RGBA sequences.
 * Each image contains ONE frame with >=20px transparent safety gutter.
 * No runtime atlas cuts, fractional source coordinates or neighboring cells.
 */
(function(root){
 'use strict';
 const VERSION='4.0.0',SIZE=512,COUNT=8,BASE='assets/new-era/directional-v4/';
 const durations={slash:.24,sweep:.24,thrust:.26,hit:.22,guard:.32,
  parry:.29,finisher:.60,dash:.54,special:.59,victory:1.87};
 const FAMILIES=Object.freeze(Object.fromEntries(Object.entries(durations).map(([kind,duration])=>
  [kind,Object.freeze({frames:COUNT,width:SIZE,height:SIZE,duration})])));
 const images={},petals=new Map();let failures=0;
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
 for(const kind of Object.keys(FAMILIES)){
  images[kind]=Array.from({length:COUNT},(_,i)=>{
   const img=new Image();img.decoding='async';
   img.onerror=()=>{failures++;console.warn('[Directional VFX] missing frame',kind,i)};
   img.onload=()=>{if(img.naturalWidth!==SIZE||img.naturalHeight!==SIZE){
    failures++;console.warn('[Directional VFX] invalid frame size',kind,i);
   }};
   img.src=BASE+kind+'-'+String(i).padStart(2,'0')+'.png?v=4';return img;
  });
 }
 const ready=kind=>!!images[kind]&&images[kind].every(i=>i.complete&&i.naturalWidth===SIZE&&i.naturalHeight===SIZE);
 const frameIndex=progress=>Math.min(COUNT-1,Math.floor(clamp(progress,0,.999999)*COUNT));
 function frame(kind,index){return ready(kind)?images[kind][Math.max(0,Math.min(COUNT-1,index|0))]:null}
 function frontPetals(index){
  if(petals.has(index))return petals.get(index);
  const image=frame('victory',index);if(!image)return null;
  const c=document.createElement('canvas');c.width=c.height=SIZE;
  const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0);
  const pixels=g.getImageData(0,0,SIZE,SIZE),d=pixels.data;
  for(let i=0;i<d.length;i+=4){
   if(d[i]<150||d[i+2]<100||d[i]<d[i+1]*1.08||d[i+2]<d[i+1]*.80)d[i+3]=0;
  }
  g.putImageData(pixels,0,0);petals.set(index,c);return c;
 }
 function draw(ctx,kind,x,y,w,h,progress=0,alpha=1,face=1,rotation=0,layer='all'){
  const index=frameIndex(progress),image=layer==='front'&&kind==='victory'?frontPetals(index):frame(kind,index);
  if(!ctx||!image)return false;
  ctx.save();ctx.translate(x,y);
  // Mirror the complete local effect, including its angle, around the fighter.
  if(face<0)ctx.scale(-1,1);
  ctx.rotate(rotation);ctx.globalAlpha=clamp(alpha);
  ctx.drawImage(image,-w/2,-h/2,w,h);ctx.restore();return true;
 }
 function inspect(kind,progress=.5){
  const index=frameIndex(progress),image=frame(kind,index);
  return {kind,ready:!!image,index,frame:index,frames:COUNT,width:SIZE,height:SIZE,
   source:image?.src||null,isolated:true,raster:true};
 }
 root.ArenaRasterFX=Object.freeze({version:VERSION,FAMILIES,ready,frameIndex,frame,draw,inspect,
  status:()=>({version:VERSION,frames:COUNT,families:Object.keys(FAMILIES),
   ready:Object.fromEntries(Object.keys(FAMILIES).map(k=>[k,ready(k)])),failures,isolated:true})});
})(globalThis);
