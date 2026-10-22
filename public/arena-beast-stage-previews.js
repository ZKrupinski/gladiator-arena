/* VENATIO selection gallery: NO still thumbnails. Play native idle frames; on selection
 * play one registered optional roar cycle; never substitute an attack for roar.
 */
(function(root){'use strict';
const fps=6,types=['wolf','leopard','tiger','lion','elephant'];
const cache=new Map();
let token=0,raf=0,selected=null,selectedAt=0,lastGallery=null;
function loadIdle(type){
 if(cache.has(type))return cache.get(type);
 const value={frames:new Array(8),loading:true,ready:false};
 cache.set(type,value);
 if(typeof Image==='undefined')return value;
 Promise.all(Array.from({length:8},(_,i)=>new Promise((ok,no)=>{
   const image=new Image();
   image.onload=()=>{value.frames[i]=image;ok(image);};
   image.onerror=()=>no(Error('Missing idle pose '+type+'/'+i));
   image.src='assets/beasts/individual/'+type+'/idle/'+String(i).padStart(2,'0')+'.png?v=3';
 }))).then(()=>value.ready=true).catch(()=>value.ready=false).finally(()=>value.loading=false);
 return value;
}
function drawContain(ctx,image,width,height){
 if(!image?.naturalWidth)return false;
 const ratio=Math.min((width-20)/image.naturalWidth,(height-8)/image.naturalHeight);
 const w=image.naturalWidth*ratio,h=image.naturalHeight*ratio;
 ctx.drawImage(image,(width-w)*.5,height-h,w,h);return true;
}
function paint(canvas,type,now){
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);
 const chosen=selected===type;
 const elapsed=(now-selectedAt)/1000;
 let special=chosen&&elapsed<1.13;
 const registry=root.SpriteMotionRegistry;
 const extra=registry?.getExtraFrames?.(type,'roar');
 // All wolf surfaces use the same approved pack as battle; no legacy idle PNGs.
 if(type==='wolf'){
  root.ArenaBeasts?.ensure?.('wolf');
  const f={beastType:'wolf',hp:1,action:'idle',actionT:0,vx:0,face:-1,
   _beastRoarProgress:Math.max(0,elapsed/1.13)};
  root.ArenaBeasts?.draw?.(ctx,{fighter:f,pose:special?'roar':'idle',clock:now/1000,
   x:w*.09,y:h*.02,w:w*.8,h:h*.9,flip:false,alpha:1});
  return;
 }
 if(special&&extra?.length===8){
  const i=Math.min(7,Math.floor(elapsed*8));
  if(drawContain(ctx,extra[i],w,h))return;
 }
 const idle=loadIdle(type);
 if(idle.ready)drawContain(ctx,idle.frames[Math.floor(now/1000*fps)%8],w,h);
 // Nothing to draw yet? Leave transparent with loading captions from the card.
}
function animate(now){
 raf=0;
 const area=document.getElementById('careerBody');
 const gallery=area?.querySelector('.beast-gallery');
 if(!gallery||!document.getElementById('careerHub')||document.getElementById('careerHub').hidden){
  lastGallery=null;return;
 }
 if(gallery!==lastGallery){lastGallery=gallery;if(!gallery.querySelector('canvas[data-beast-preview="'+selected+'"]')){selected=null;selectedAt=0;}}
 if(!document.hidden){
  gallery.querySelectorAll('canvas[data-beast-preview]').forEach(c=>{
   if(types.includes(c.dataset.beastPreview))paint(c,c.dataset.beastPreview,now);
  });
 }
 raf=requestAnimationFrame(animate);
}
function select(type){
 if(!types.includes(type))return false;
 selected=type;selectedAt=performance.now();
 if(type==='wolf')root.ArenaBeasts?.ensure?.(type);else loadIdle(type);
 const area=document.querySelector('.beast-gallery');
 area?.querySelectorAll('.beast-stage-card').forEach(card=>{
  const active=card.dataset.beastType===type;
  card.classList.toggle('is-selected',active);
  card.setAttribute('aria-selected',String(active));
 });
 root.SpriteMotionRegistry?.loadExtra?.(type,'roar');
 return true;
}
function mount(){
 const gallery=document.querySelector('#careerHub:not([hidden]) .beast-gallery');
 if(!gallery)return false;
 gallery.querySelectorAll('.beast-stage-card').forEach(card=>{
  const type=card.dataset.beastType;
  if(!types.includes(type))return;
  if(type==='wolf')root.ArenaBeasts?.ensure?.(type);else loadIdle(type);
  card.addEventListener('pointerenter',()=>select(type));
  card.addEventListener('focusin',()=>select(type));
  card.addEventListener('click',e=>{
    if(e.target.closest('button[data-beast-stage]'))return;
    select(type);
  });
  card.addEventListener('keydown',e=>{
    if(e.target===card&&(e.key==='Enter'||e.key===' ')){
     e.preventDefault();select(type);
    }
  });
 });
 if(!raf)raf=requestAnimationFrame(animate);
 return true;
}
function stop(){if(raf)cancelAnimationFrame(raf);raf=0;lastGallery=null;}
root.BeastStagePreviews={version:'1.0',mount,select,stop,status:()=>({
 galleryMounted:!!lastGallery,selected,loaded:[...cache].filter(([,v])=>v.ready).map(([k])=>k)})};
})(typeof window!=='undefined'?window:globalThis);
