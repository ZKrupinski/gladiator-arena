/* CAPUA VENUE · selectable rough arena proof of composition. Colosseum is untouched. */
(function(root){'use strict';
const VERSION='capua-stand-preview-v1-20261026';
const source='assets/capua/';
const yard=new Image(),audience=new Image();
yard.src=source+'capua-yard.webp?v='+VERSION;
audience.src=source+'capua-crowd-4f.webp?v='+VERSION;
let chosen='capua';
try {const saved=root.localStorage?.getItem('spartacus-arena-venue');if(saved==='colosseum'||saved==='capua')chosen=saved;}catch(_){}
const clamp=(n,a,b)=>Math.max(a,Math.min(n,b));
function select(v){chosen=v==='colosseum'?'colosseum':'capua';try{root.localStorage?.setItem('spartacus-arena-venue',chosen);}catch(_){}return chosen;}
function draw(ctx,settings={}){
 if(chosen!=='capua'||!yard.complete||yard.naturalWidth!==1672||yard.naturalHeight!==941)return false;
 const W=Number(settings.width)||1280,H=Number(settings.height)||720;
 const width=Math.max(W+420,1672*1.06),scale=width/1672;
 const shift=(Number(settings.cameraX)||W/2)-W/2;
 const x=clamp((W-width)*.5-shift*.24,W-width+44,-44),y=H/720*(-76);
 ctx.drawImage(yard,x,y,width,941*scale);
 if(audience.complete&&audience.naturalWidth===2172&&audience.naturalHeight===270){
  const motionOff=!!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const order=[0,1,2,3,2,1],t=Number(settings.time)||0;
  const f=motionOff?0:order[Math.floor(Math.max(0,t)/.33)%order.length];
  // Preview: three correctly scaled groups fill the left, center, and right stands.
  // Keep the sandy fight floor empty; no source below 421px is ever animated.
  for(const position of [-10,552,1114])
   ctx.drawImage(audience,f*543,0,543,270,x+position*scale,y+83*scale,543*scale,270*scale);
 }
 return true;
}
root.CapuaVenue={VERSION,draw,get:()=>chosen,select,toggle:()=>select(chosen==='capua'?'colosseum':'capua'),isReady:()=>yard.complete&&yard.naturalWidth===1672};
})(window);
