/* GLADIATOR ARENA | Approved 8-frame painted RGBA VFX (raster only).
 * Sources: binary PNG sprites personally approved by the game's art director.
 * 4 columns x 2 rows, each frame exactly 480 x 480 RGBA, 1920x960 atlas.
 * No procedural shapes, paths, fake vector flashes, DOM SVG or line art.
 */
(function(root){
 'use strict';
 const GRID={columns:4,rows:2,frameWidth:480,frameHeight:480,frames:8};
 const SOURCE={
  combat:'assets/new-era/cinematic/combat-directional-8f.png?v=2-actual-png',
  victory:'assets/new-era/cinematic/victory-directional-8f.png?v=2-actual-png'
 };
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
 const images={},maskedPetals=new Map();
 let failures=0;
 for(const [name,url] of Object.entries(SOURCE)){
  const img=new Image();
  img.decoding='async';
  img.onload=()=>{
   if(img.naturalWidth!==1920||img.naturalHeight!==960){
    failures++;
    console.warn('[8-frame PNG]',name,'incorrect atlas dimensions',img.naturalWidth,img.naturalHeight);
   }
  };
  img.onerror=()=>{failures++;console.warn('[8-frame PNG] missing:',name,url)};
  img.src=url;images[name]=img;
 }
 function ready(kind){
  const i=images[kind];return !!i&&i.complete&&i.naturalWidth===1920&&i.naturalHeight===960;
 }
 function frameIndex(progress){
  return Math.min(7,Math.floor(clamp(progress,0,.999999)*8));
 }
 function rect(index){return {sx:(index%4)*480,sy:Math.floor(index/4)*480,sw:480,sh:480}}
 function frontPetals(index){
  if(maskedPetals.has(index))return maskedPetals.get(index);
  if(!ready('victory'))return null;
  // Pixel-mask the PINK petals from the approved painted PNG itself. There are
  // no geometrical/vector additions. The rest of the original PNG remains
  // completely behind the fighter as a glow/halo/ground-light texture.
  const c=document.createElement('canvas');c.width=480;c.height=480;
  const g=c.getContext('2d',{alpha:true,willReadFrequently:true});
  const r=rect(index);
  g.drawImage(images.victory,r.sx,r.sy,480,480,0,0,480,480);
  const img=g.getImageData(0,0,480,480),data=img.data;
  for(let k=0;k<data.length;k+=4){
   const red=data[k],green=data[k+1],blue=data[k+2];
   // Gold halo has low blue. Pink petals are pink-lavender with higher blue.
   // Feathers are retained with their existing anti-aliased alpha edges.
   if(red<150||blue<100||red<green*1.08||blue<green*.80) data[k+3]=0;
  }
  g.putImageData(img,0,0);
  maskedPetals.set(index,c);
  return c;
 }
 function draw(ctx,kind,x,y,w,h,progress=0,alpha=1,face=1,rotation=0,layer='all'){
  if(!ctx||!ready(kind))return false;
  const index=frameIndex(progress),r=rect(index);
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(rotation);
  // Negative face mirrors an already forward-directed painterly source.
  // This yields exactly the matching pre-separated left-hand PNG frames.
  if(face<0)ctx.scale(-1,1);
  ctx.globalAlpha=clamp(alpha);
  if(layer==='front'&&kind==='victory'){
   const petals=frontPetals(index);
   if(petals)ctx.drawImage(petals,-w/2,-h/2,w,h);
  }else{
   ctx.drawImage(images[kind],r.sx,r.sy,r.sw,r.sh,-w/2,-h/2,w,h);
  }
  ctx.restore();
  return true;
 }
 function inspect(kind,progress=.5){
  if(!ready(kind))return {kind,ready:false};
  const frame=frameIndex(progress),bounds=rect(frame);
  return {kind,ready:true,frame,frames:8,width:480,height:480,
   nativeImageSize:[images[kind].naturalWidth,images[kind].naturalHeight],
   bounds,source:SOURCE[kind],raster:true};
 }
 root.ArenaRasterFX=Object.freeze({
  version:'2.0.0-png',GRID,SOURCE,ready,frameIndex,rect,draw,inspect,
  status:()=>({version:'2.0.0-png',frames:8,ready:Object.fromEntries(Object.keys(SOURCE).map(k=>[k,ready(k)])),failures,source:'approved binary PNG only'})
 });
})(globalThis);
