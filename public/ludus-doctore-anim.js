/* Ludus female Doctore — one actor, four grounded 8-frame cycles.
 * Approved same-world character, alpha-connected frame extraction.
 * Background offsets are integral: no fractional texture seam or feet jitter.
 */
(function(root){
'use strict';
const CELL_W=360,CELL_H=620,COLS=8;
const ACTIONS={idle:0,talk:1,command:2,walk:3};
const RATE={idle:165,talk:115,command:106,walk:118};
let actor=null,clock=0,stamp=0,mode='idle',until=0,idleLoops=0,previousFrame=-1,raf=0;
function draw(frame){
 if(!actor)return;
 const col=Math.max(0,Math.min(7,frame));
 const row=ACTIONS[mode];
 actor.style.backgroundPosition=(-col*CELL_W)+'px '+(-row*CELL_H)+'px';
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
 const next=id===1?'talk':id===2?'command':id===3?'command':'idle';
 mode=next;clock=0;previousFrame=-1;
 until=next==='idle'?0:(stamp||performance.now())+8*RATE[next]*1.6;
 draw(0);return true;
}
root.LudusDoctoreAnim={version:'1.0.0',mount,react,unmount:stop,
 sprite:{path:'assets/ludus/doctore-sd-v1.webp?v=1',columns:COLS,rows:4,
 cellWidth:CELL_W,cellHeight:CELL_H,framesPerAction:8,actions:ACTIONS}};
})(window);
