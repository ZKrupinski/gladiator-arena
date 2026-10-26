/* Capua day / Capua moonlit night / classic Colosseum. The 5v5 renderer is separate. */
(function(root){'use strict';
const VERSION='capua-night-crowd-v4-20261026';
const source='assets/capua/';
const yard=new Image(),audience=new Image(),night=new Image();
yard.src=source+'capua-sd-arena-selected.webp?v='+VERSION;
audience.src=source+'capua-sd-crowd-4f-selected.webp?v='+VERSION;
night.src=source+'capua-night-original.png?v='+VERSION;
const choices=['capua','capua-night','colosseum'];
const modes=['random',...choices];
const storageKey='spartacus-arena-venue-v4';
let mode='random', chosen=choices[Math.floor(Math.random()*choices.length)], nightFrames=null;
try{const saved=root.localStorage?.getItem(storageKey);if(modes.includes(saved))mode=saved;}catch(_){}
if(mode!=='random')chosen=mode;
const clamp=(n,a,b)=>Math.max(a,Math.min(n,b));
const reduced=()=>!!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
const frameOrder=[0,1,2,3,2,1];
function pick(){return choices[Math.floor(Math.random()*choices.length)];}
function select(value){mode=modes.includes(value)?value:'random';chosen=mode==='random'?pick():mode;try{root.localStorage?.setItem(storageKey,mode);}catch(_){}return chosen;}
function nextMatch(){if(mode==='random')chosen=pick();return chosen;}
function toggle(){const next=modes[(modes.indexOf(mode)+1)%modes.length];return select(next);}
function status(){const labels={'capua':'카푸아 낮','capua-night':'카푸아 밤','colosseum':'콜로세움'};return mode==='random'?'랜덤 · '+labels[chosen]:labels[chosen];}
function ready(image){return image.complete&&image.naturalWidth>0&&image.naturalHeight>0;}
/* Night animation uses pixels from the provided night image itself, not the
   daytime atlas. This keeps every moving spectator aligned with night art. */
function buildNightFrames(){
 if(nightFrames||!ready(night))return;
 const iw=night.naturalWidth,ih=night.naturalHeight;
 const band=Math.round(ih*.39);
 const positions=[.047,.154,.254,.361,.459,.550,.645,.742,.840,.941];
 const result=[];
 for(let f=0;f<4;f++){
  const c=root.document.createElement('canvas');c.width=iw;c.height=band;
  const g=c.getContext('2d');if(!g)return;
  g.drawImage(night,0,0,iw,band,0,0,iw,band);
  if(f){
   // Independent spectator groups move gently; the playing floor never moves.
   positions.forEach((px,i)=>{
    const phase=f*Math.PI/2+i*1.73;
    const dx=Math.sin(phase)*2.2,dy=Math.cos(phase)*3.3;
    const cx=px*iw,cy=(i%3===0?.245:i%3===1?.276:.259)*ih;
    g.save();g.beginPath();g.ellipse(cx,cy,iw*.055,ih*.113,0,0,Math.PI*2);g.clip();
    g.drawImage(night,dx,dy,iw,ih);g.restore();
   });
  }
  result.push(c);
 }
 nightFrames=result;
}
function draw(ctx,settings={}){
 if(chosen==='colosseum')return false;
 let image=chosen==='capua-night'?night:yard;
 if(!ready(image)){
  // Do not show an empty arena while a newly published image propagates.
  if(chosen==='capua-night'&&ready(yard))image=yard;else return false;
 }
 const W=Number(settings.width)||1280,H=Number(settings.height)||720;
 const width=Math.max(W,H*image.naturalWidth/image.naturalHeight)*1.035;
 const scale=width/image.naturalWidth,shift=(Number(settings.cameraX)||W/2)-W/2;
 const x=clamp((W-width)*.5-shift*.08,W-width,0),y=(H-image.naturalHeight*scale)*.5;
 ctx.drawImage(image,x,y,width,image.naturalHeight*scale);
 const t=Math.max(0,Number(settings.time)||0);
 const frame=reduced()?0:frameOrder[Math.floor(t/.19)%frameOrder.length];
 if(image===yard&&ready(audience)&&audience.naturalWidth===6688&&audience.naturalHeight===264){
  ctx.drawImage(audience,frame*1672,0,1672,264,x,y+78*scale,width,264*scale);
 }else if(image===night&&!reduced()){
  buildNightFrames();
  if(nightFrames){const cover=nightFrames[frame];ctx.drawImage(cover,x,y,width,cover.height*scale);}
  // Warm torches flicker independently of the audience's four-frame loop.
  const flicker=.055+.032*(.5+.5*Math.sin(t*16));
  const spots=[[.167,.286],[.376,.303],[.945,.297]];
  ctx.save();ctx.globalCompositeOperation='screen';
  for(const [sx,sy] of spots){
   const px=x+sx*width,py=y+sy*image.naturalHeight*scale,r=width*.055;
   const grad=ctx.createRadialGradient(px,py,0,px,py,r);
   grad.addColorStop(0,'rgba(255,163,50,'+flicker.toFixed(3)+')');
   grad.addColorStop(1,'rgba(255,145,40,0)');
   ctx.fillStyle=grad;ctx.beginPath();ctx.arc(px,py,r,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
 }
 return true;
}
root.CapuaVenue={VERSION,draw,get:()=>chosen,getMode:()=>mode,status,select,toggle,nextMatch,
 isReady:()=>ready(yard),isNightReady:()=>ready(night)};
})(window);
