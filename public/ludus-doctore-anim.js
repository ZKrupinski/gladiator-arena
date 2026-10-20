/* Roman training Doctore: ONLY user-approved PNG pixels.
 * 3 original eight-frame animations, plus losslessly isolated whip poses.
 * The source PNG stays untouched; adjacent character pixels are excluded
 * from every whip frame. A single 856px-wide frame owns the extended lash.
 */
(function(root){
'use strict';
const SCALE=1.125,GROUND=594,DIR='assets/ludus/';
const INFO={
 idle:{file:'doctore-idle-approved-v1.png',split:520,feet:[511,511,511,511,506,506,506,506],duration:155},
 talk:{file:'doctore-explain-approved-v1.png',split:548,feet:[532,532,531,532,478,478,481,481],duration:115},
 command:{file:'doctore-authority-approved-v1.png',split:524,feet:[518,519,518,519,521,522,521,521],duration:130},
 whip:{file:'doctore-whip-user-v1.png',feet:[419,539,531,386,395,395,475,406],duration:118}
};
// Each source pose is a lossless RGBA separation from the same approved PNG.
// The fifth contact pose stays ONE EXTRA-WIDE 856px frame, held twice for impact.
const WHIP_IDS=[0,1,2,3,4,4,5,6];
const WHIP_BOXES=[
 {x:0,y:132,w:372,h:430},{x:332,y:12,w:399,h:548},
 {x:680,y:20,w:423,h:542},{x:1001,y:165,w:447,h:406},
 {x:0,y:640,w:856,h:419},{x:770,y:560,w:417,h:507},
 {x:1114,y:629,w:334,h:417}
];
const WHIP_FEET_X=[184,181,175,188,184,184,191,168];
const ready={};let actor=null,frame=-1,mode='idle',stamp=0,elapsed=0,until=0,raf=0;
for(const [name,setting] of Object.entries(INFO)){
 ready[name]=false;
 if(typeof Image==='undefined')continue;
 if(name==='whip'){
  let completed=0;let failed=false;
  for(let i=0;i<7;i++){
   const img=new Image();
   img.onload=()=>{
    if(img.naturalWidth!==WHIP_BOXES[i].w||img.naturalHeight!==WHIP_BOXES[i].h)failed=true;
    completed++;
    ready.whip=!failed&&completed===7;
   };
   img.onerror=()=>{failed=true;ready.whip=false;};
   img.src=DIR+'doctore-whip-clean-v2/frame-'+i+'.png?v=2';
  }
 }else{
  const img=new Image();
  img.onload=()=>{ready[name]=img.naturalWidth===1448&&img.naturalHeight===1086;};
  img.onerror=()=>{ready[name]=false;};
  img.src=DIR+setting.file+'?approved=2';
 }
}
function frameRect(name,n){
 if(name==='whip')return WHIP_BOXES[WHIP_IDS[n]];
 const split=INFO[name].split,lower=n>=4;
 return {x:(n%4)*362,y:lower?split:0,w:362,h:lower?1086-split:split};
}
function draw(n){
 if(!actor)return;
 const idx=Math.min(7,Math.max(0,n)),sheet=INFO[mode];
 const r=frameRect(mode,idx),isWhip=mode==='whip';
 const path=isWhip?'doctore-whip-clean-v2/frame-'+WHIP_IDS[idx]+'.png?v=2':
  sheet.file+'?approved=2';
 actor.style.backgroundImage='url("'+DIR+path+'")';
 actor.style.backgroundSize=isWhip?'auto':'1448px 1086px';
 actor.style.backgroundRepeat='no-repeat';
 actor.style.backgroundPosition=isWhip?'0px 0px':(-r.x)+'px '+(-r.y)+'px';
 actor.style.width=r.w+'px';actor.style.height=r.h+'px';
 // Base stance aligns to the same physical feet location across every pose.
 actor.style.left=(185+(isWhip?Math.round((184-WHIP_FEET_X[idx])*SCALE):0))+'px';
 actor.style.top=Math.round(GROUND-sheet.feet[idx]*SCALE)+'px';
 actor.style.transformOrigin='left top';
 actor.style.transform='scale('+SCALE+')';
 actor.style.overflow='visible';
 actor.dataset.frame=String(idx);actor.dataset.action=mode;
 actor.dataset.sheet=sheet.file;actor.dataset.renderFile=path;
 actor.dataset.source='approved-unmodified-png';
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
 until=mode==='idle'?0:(stamp||performance.now())+
  INFO[mode].duration*8*(mode==='whip'?1:1.6);
 draw(0);return true;
}
root.LudusDoctoreAnim={version:'4.1.0',mount,react,unmount:stop,
 sprite:{sheets:Object.fromEntries(Object.entries(INFO).map(([name,x])=>[name,DIR+x.file])),
  whipFrames:WHIP_IDS,wideWhip:WHIP_BOXES[4].w,framesPerAction:8,
  scale:SCALE,baseline:GROUND,actions:{idle:0,talk:1,command:2,whip:3}},
 status:()=>({mode,frame,ready:{...ready},baseline:GROUND,scale:SCALE})};
})(window);
