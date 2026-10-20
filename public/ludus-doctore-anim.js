/* ORIGINAL USER ASSETS ONLY. No canvas rasterization or sprite repacking.
   Every frame uses native RGBA PNG pixels with a uniform display scale.
   Different transparent margins are corrected through a fixed foot baseline. */
(function(root){
'use strict';
const SCALE=1.125,GROUND=586,DIR='assets/ludus/';
const INFO={
 idle:{file:'doctore-idle-approved-v1.png',split:520,feet:[511,511,511,511,506,506,506,506],duration:155},
 talk:{file:'doctore-explain-approved-v1.png',split:548,feet:[532,532,531,532,478,478,481,481],duration:115},
 command:{file:'doctore-authority-approved-v1.png',split:524,feet:[518,519,518,519,521,522,521,521],duration:130},
 whip:{file:'doctore-whip-user-v1.png',feet:[551,551,551,550,460,460,461,461],duration:118}
};
const WHIP=[
 [0,0,355,553],[355,0,355,553],[710,0,345,553],[1055,0,393,553],
 [0,575,800,511],[0,575,800,511],[800,575,314,511],[1114,575,334,511]
];
let actor=null,frame=-1,mode='idle',stamp=0,elapsed=0,until=0,raf=0;
const ready={};
for(const [name,setting] of Object.entries(INFO)){
 ready[name]=false;
 if(typeof Image==='undefined')continue;
 const im=new Image();
 im.onload=()=>{
  ready[name]=im.naturalWidth===1448&&im.naturalHeight===1086;
  // Refresh the active frame when its PNG finishes loading.
  if(ready[name]&&name===mode&&actor)draw(frame<0?0:frame);
 };
 im.onerror=()=>{ready[name]=false;};
 im.src=DIR+setting.file+'?approved=1';
}
function frameRect(name,n){
 if(name==='whip'){
  const [x,y,w,h]=WHIP[n];return {x,y,w,h};
 }
 const split=INFO[name].split,lower=n>=4;
 return {x:(n%4)*362,y:lower?split:0,w:362,h:lower?1086-split:split};
}
function draw(n){
 if(!actor)return;
 const idx=Math.min(7,Math.max(0,n)),sheet=INFO[mode];
 const r=frameRect(mode,idx);
 actor.style.backgroundImage='url("'+DIR+sheet.file+'?approved=1")';
 actor.style.backgroundSize='1448px 1086px';
 actor.style.backgroundRepeat='no-repeat';
 actor.style.backgroundPosition=(-r.x)+'px '+(-r.y)+'px';
 actor.style.width=r.w+'px';actor.style.height=r.h+'px';
 actor.style.left='185px';
 actor.style.top=Math.round(GROUND-sheet.feet[idx]*SCALE)+'px';
 actor.style.transformOrigin='left top';
 actor.style.transform='scale('+SCALE+')';
 actor.style.overflow='visible';
 actor.dataset.frame=String(idx);actor.dataset.action=mode;
 actor.dataset.sheet=sheet.file;actor.dataset.source='approved-unmodified-png';
 actor.dataset.scale=String(SCALE);actor.dataset.footY=String(GROUND);
 actor.dataset.crop=JSON.stringify(r);frame=idx;
}
function stop(){
 if(raf)cancelAnimationFrame(raf);
 raf=0;actor=null;stamp=0;elapsed=0;until=0;mode='idle';frame=-1;
}
function animate(now){
 if(!actor||!actor.isConnected){stop();return;}
 elapsed+=stamp?Math.max(0,Math.min(80,now-stamp)):0;
 stamp=now;
 const reduced=!!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 if(mode!=='idle'&&now>=until){mode='idle';elapsed=0;frame=-1;}
 const index=reduced?0:Math.floor(elapsed/INFO[mode].duration)%8;
 if(index!==frame)draw(index);
 // Actor position stays fixed to the same ground for every frame.
 raf=requestAnimationFrame(animate);
}
function mount(node){
 stop();if(!node)return false;
 actor=node;draw(0);raf=requestAnimationFrame(animate);return true;
}
function react(id){
 if(!actor)return false;
 mode=id===1?'talk':id===2?'command':id===3?'whip':'idle';
 elapsed=0;frame=-1;
 until=mode==='idle'?0:(stamp||performance.now())+INFO[mode].duration*8*(mode==='whip'?1:1.6);
 draw(0);return true;
}
root.LudusDoctoreAnim={version:'4.0.0',mount,react,unmount:stop,
 sprite:{sheets:Object.fromEntries(Object.entries(INFO).map(([name,x])=>[name,DIR+x.file])),
  framesPerAction:8,scale:SCALE,baseline:GROUND,actions:{idle:0,talk:1,command:2,whip:3}},
 status:()=>({mode,frame,ready:{...ready},baseline:GROUND,scale:SCALE})};
})(window);
