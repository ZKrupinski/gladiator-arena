/* Ludus female Doctore — one actor, four grounded 8-frame cycles.
 * Approved same-world character, alpha-connected frame extraction.
 * Background offsets are integral: no fractional texture seam or feet jitter.
 */
(function(root){
'use strict';
const CELL_W=360,CELL_H=620,COLS=8;
const ACTIONS={idle:0,talk:1,command:2,walk:3,whip:4};
// Unmodified user-edited PNG: 4 normal-width top poses, plus the deliberately
// extra-wide extended lash on the bottom left (seven distinct art poses).
const USER_WHIP_IMAGE="https://d2ol7oe51mr4n9.cloudfront.net/user_3KlCHKRIJO34SPkOC5UMUPo7vEp/66b8f68a-f680-437b-877a-63e128e9e67f.png";
const WHIP_CUTS=[
 {x:0,y:0,w:355},{x:355,y:0,w:355},{x:710,y:0,w:350},{x:1055,y:0,w:393},
 {x:0,y:548,w:800},{x:800,y:548,w:338},{x:1114,y:548,w:334}
];
// Hold the wide contact once; the original supplied drawing has seven poses.
const WHIP_ORDER=[0,1,2,3,4,4,5,6];
const RATE={idle:165,talk:115,command:106,walk:118,whip:118};
let actor=null,clock=0,stamp=0,mode='idle',until=0,idleLoops=0,previousFrame=-1,raf=0;
root.__ludusWhipReady=false;
const whipImage=new Image();
whipImage.onload=()=>{root.__ludusWhipReady=true;};
whipImage.onerror=()=>{root.__ludusWhipReady=false;};
whipImage.src=USER_WHIP_IMAGE;
function draw(frame){
 if(!actor)return;
 const col=Math.max(0,Math.min(7,frame));
 const row=ACTIONS[mode];
 if(mode==='whip'&&root.__ludusWhipReady){
  const cut=WHIP_CUTS[WHIP_ORDER[col]];
  actor.style.backgroundImage='url("'+USER_WHIP_IMAGE+'")';
  actor.style.backgroundSize='1448px 1086px';
  actor.style.backgroundPosition=(-cut.x)+'px '+(-cut.y)+'px';
  actor.style.width=cut.w+'px';
  actor.style.height='538px';
  actor.style.top='42px';
  actor.style.left='185px';
 }else{
  actor.style.backgroundImage='';
  actor.style.backgroundSize='';
  actor.style.width='';actor.style.height='';
  actor.style.top='';actor.style.left='';
  actor.style.backgroundPosition=(-col*CELL_W)+'px '+(-Math.min(row,3)*CELL_H)+'px';
 }
 actor.dataset.frame=String(col);
 actor.dataset.action=mode;
}
function stop(){
 if(raf)cancelAnimationFrame(raf);
 raf=0;actor=null;clock=0;stamp=0;mode='idle';until=0;idleLoops=0;previousFrame=-1;
}
function animate(now){
 if(!actor||!actor.isConnected){stop();return;}
 const dt=stamp?Math.min(80,Math.max(0,now-stamp)):0;
 stamp=now;clock+=dt;
 const reduced=!!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 if(mode!=='idle'&&now>=until){mode='idle';clock=0;previousFrame=-1;}
 let frame=reduced?0:Math.floor(clock/RATE[mode])%8;
 if(frame!==previousFrame){
  if(mode==='idle'&&previousFrame===7&&frame===0){
   idleLoops++;
   // An occasional shift of weight, not a constant distracting gesture.
   if(idleLoops%7===0&&!reduced){
    mode='walk';until=now+8*RATE.walk;clock=0;frame=0;
   }
  }
  previousFrame=frame;draw(frame);
 }
 actor.style.transform=mode==='walk'&&!reduced?'translateX('+(Math.sin(clock/940*Math.PI)*10).toFixed(1)+'px)':'';
 raf=requestAnimationFrame(animate);
}
function mount(node){
 stop();if(!node)return;
 actor=node;clock=0;stamp=0;mode='idle';previousFrame=-1;idleLoops=0;
 draw(0);raf=requestAnimationFrame(animate);
}
function react(id){
 if(!actor)return false;
 const next=id===1?'talk':id===2?'command':id===3?'whip':'idle';
 mode=next;clock=0;previousFrame=-1;
 until=next==='idle'?0:(stamp||performance.now())+8*RATE[next]*(next==='whip'?1:1.6);
 draw(0);return true;
}
root.LudusDoctoreAnim={version:'2.0.0',mount,react,unmount:stop,userWhip:USER_WHIP_IMAGE,
 sprite:{path:'assets/ludus/doctore-sd-v1.webp?v=1',columns:COLS,rows:4,
 cellWidth:CELL_W,cellHeight:CELL_H,framesPerAction:8,actions:ACTIONS}};
})(window);
