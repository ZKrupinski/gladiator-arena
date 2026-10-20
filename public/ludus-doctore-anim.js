/* Female Roman trainer: EXCLUSIVELY the user's unmodified 1448x1086 PNG.
 * No legacy Doctore SD atlas, no other NPC artwork, no on-the-fly redraw.
 * Seven source poses, including one deliberately 800px-wide whip impact.
 * The 8-frame timeline reuses the contact pose; dimensions are not rescaled.
 */
(function(root){
'use strict';
const USER_PNG='assets/ludus/doctore-whip-user-v1.png?v=2';
const IMAGE_W=1448,IMAGE_H=1086,FRAME_H=538;
const CUTS=[
 {x:0,y:0,w:355}, {x:355,y:0,w:355}, {x:710,y:0,w:350},
 {x:1055,y:0,w:393}, {x:0,y:548,w:800}, {x:800,y:548,w:338},
 {x:1114,y:548,w:334}
];
// Talking is restrained breathing/gesture. A pointed warning precedes the
// wide theatrical lash. All modes come from one approved, unchanged image.
const ACTIONS={
 idle:[0,0,0,0,0,0,0,0],
 talk:[0,0,0,0,0,0,0,0],
 command:[0,0,1,1,1,1,0,0],
 whip:[0,1,2,3,4,4,5,6]
};
const RATE={idle:165,talk:115,command:106,whip:118};
let actor=null,mode='idle',clock=0,stamp=0,until=0,prev=-1,raf=0;
let ready=false,asset=null;
root.__ludusWhipReady=false;
function draw(index){
 if(!actor)return;
 const n=Math.max(0,Math.min(7,index)),part=CUTS[ACTIONS[mode][n]];
 actor.style.backgroundImage='url("'+USER_PNG+'")';
 actor.style.backgroundSize=IMAGE_W+'px '+IMAGE_H+'px';
 actor.style.backgroundRepeat='no-repeat';
 actor.style.backgroundPosition=(-part.x)+'px '+(-part.y)+'px';
 actor.style.width=part.w+'px';
 actor.style.height=FRAME_H+'px';
 // Keep all poses grounded at the same actual stage baseline.
 actor.style.left='185px';actor.style.top='42px';
 actor.style.overflow='visible';
 actor.dataset.frame=String(n);
 actor.dataset.action=mode;
 actor.dataset.source='user-original';
}
if(typeof Image!=='undefined'){
 const im=new Image();
 im.onload=()=>{
  if(im.naturalWidth!==IMAGE_W||im.naturalHeight!==IMAGE_H){
   console.warn('[Ludus Doctore] unexpected original image dimensions');return;
  }
  asset=im;ready=true;root.__ludusWhipReady=true;
  if(actor)draw(prev>=0?prev:0);
 };
 im.onerror=()=>{ready=false;root.__ludusWhipReady=false;};
 im.src=USER_PNG;
}
function stop(){
 if(raf)cancelAnimationFrame(raf);
 raf=0;actor=null;clock=0;stamp=0;until=0;mode='idle';prev=-1;
}
function animate(now){
 if(!actor||!actor.isConnected){stop();return;}
 const dt=stamp?Math.min(80,Math.max(0,now-stamp)):0;
 stamp=now;clock+=dt;
 const reduced=!!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 if(mode!=='idle'&&now>=until){mode='idle';clock=0;prev=-1;}
 const frame=reduced?0:Math.floor(clock/RATE[mode])%8;
 if(frame!==prev){prev=frame;draw(frame);}
 // Tiny movement gives the lecture some life without introducing a foreign
 // character design. The actual PNG pixels always remain untouched.
 const sway=mode==='talk'&&!reduced?Math.sin(clock/360)*2:0;
 actor.style.transform=sway?'translateX('+sway.toFixed(2)+'px)':'';
 raf=requestAnimationFrame(animate);
}
function mount(node){
 stop();if(!node)return false;
 actor=node;mode='idle';clock=0;stamp=0;prev=-1;draw(0);
 raf=requestAnimationFrame(animate);return true;
}
function react(id){
 if(!actor)return false;
 const next=id===1?'talk':id===2?'command':id===3?'whip':'idle';
 mode=next;clock=0;prev=-1;
 until=next==='idle'?0:(stamp||performance.now())+
  8*RATE[next]*(next==='whip'?1:1.6);
 draw(0);
 return true;
}
root.LudusDoctoreAnim={version:'3.0.0',mount,react,unmount:stop,
 userWhip:USER_PNG,
 sprite:{path:USER_PNG,layout:'7 unequal-size poses (one 800px wide)',
  framesPerAction:8,sourcePoses:CUTS.length,actions:ACTIONS},
 status:()=>({ready,mode,frame:prev,source:USER_PNG})};
})(window);
