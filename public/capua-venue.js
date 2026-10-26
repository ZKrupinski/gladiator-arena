/* CAPUA VENUE · second approved SD crowd scene; Colosseum remains untouched. */
(function(root){'use strict';
const VERSION='capua-second-sd-stadium-v2-20261026';
const source='assets/capua/';
const yard=new Image(),audience=new Image();
yard.src=source+'capua-sd-arena-selected.webp?v='+VERSION;
audience.src=source+'capua-sd-crowd-4f-selected.webp?v='+VERSION;
let chosen='capua';
try {const saved=root.localStorage?.getItem('spartacus-arena-venue');if(saved==='colosseum'||saved==='capua')chosen=saved;}catch(_){}
const clamp=(n,a,b)=>Math.max(a,Math.min(n,b));
function select(v){chosen=v==='colosseum'?'colosseum':'capua';try{root.localStorage?.setItem('spartacus-arena-venue',chosen);}catch(_){}return chosen;}
function draw(ctx,settings={}){
 if(chosen!=='capua'||!yard.complete||yard.naturalWidth!==1672||yard.naturalHeight!==941)return false;
 const W=Number(settings.width)||1280,H=Number(settings.height)||720;
 // Preserve the full 16:9 perspective and spectators across the wide stands.
 // Small camera overscan leaves room for parallax without cropping entire wings.
 const width=Math.max(W,H*1672/941)*1.035,scale=width/1672;
 const shift=(Number(settings.cameraX)||W/2)-W/2;
 const x=clamp((W-width)*.5-shift*.08,W-width,0);
 const y=(H-941*scale)*.5;
 ctx.drawImage(yard,x,y,width,941*scale);
 if(audience.complete&&audience.naturalWidth===6688&&audience.naturalHeight===264){
  const motionOff=!!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const order=[0,1,2,3,2,1],t=Number(settings.time)||0;
  const frame=motionOff?0:order[Math.floor(Math.max(0,t)/.35)%order.length];
  // All five crowd groups appear ONCE, in their own original locations.
  // Source alpha excludes the immovable upper canopy, pillars, foreground
  // railing, banners, stone wall and the whole playing floor.
  ctx.drawImage(audience,frame*1672,0,1672,264,x,y+78*scale,width,264*scale);
 }
 return true;
}
root.CapuaVenue={VERSION,draw,get:()=>chosen,select,toggle:()=>select(chosen==='capua'?'colosseum':'capua'),isReady:()=>yard.complete&&yard.naturalWidth===1672};
})(window);
