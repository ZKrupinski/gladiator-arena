/* Approved training NPC. All original paintings remain unchanged.
 * Persistent body and predecoded transparent whip-image layers eliminate
 * frame-to-frame layout changes, background URL flicker and size popping.
 * The extended lash is ONE uninterrupted native-width 856px frame.
 */
(function(root){
'use strict';
const DIR='assets/ludus/',SCALE=0.9,WHIP_SCALE=1.068,GROUND=575;
const WIDE_ID=4,WHIP_ORDER=[0,1,2,3,4,4,5,6];
const WHIP_BOXES=[
 {x:0,y:132,w:372,h:430},{x:332,y:12,w:399,h:548},
 {x:680,y:20,w:423,h:542},{x:1001,y:165,w:447,h:406},
 {x:0,y:640,w:856,h:419},{x:770,y:560,w:417,h:507},
 {x:1114,y:629,w:334,h:417}
];
const WHIP_FEET=[419,539,531,386,395,475,406];
const WHIP_X=[184,181,175,188,184,191,168];
const INFO={
 idle:{file:'doctore-idle-approved-v1.png',split:520,feet:[511,511,511,511,506,506,506,506],duration:155},
 talk:{file:'doctore-explain-approved-v1.png',split:548,feet:[532,532,531,532,478,478,481,481],duration:115},
 command:{file:'doctore-authority-approved-v1.png',split:524,feet:[518,519,518,519,521,522,521,521],duration:130},
 whip:{file:'doctore-whip-user-v1.png',duration:118}
};
const sources={},ready={idle:false,talk:false,command:false,whip:false};
const whipImages=[],whipNodes=[];
let actor=null,body=null,layer=null,frame=-1,mode='idle',stamp=0,clock=0,until=0,raf=0;
let impactSent=false;
for(const [kind,settings] of Object.entries(INFO)){
 if(typeof Image==='undefined')continue;
 if(kind==='whip'){
  let complete=0,failed=false;
  WHIP_BOXES.forEach((rect,n)=>{
   const im=new Image();
   im.className='la-doctore-whip-frame';
   im.dataset.id=String(n);
   im.alt='';im.setAttribute?.('aria-hidden','true');
   im.draggable=false;
   im.style.position='absolute';
   im.style.left=Math.round((184-WHIP_X[n])*WHIP_SCALE)+'px';
   im.style.top=Math.round(GROUND-WHIP_FEET[n]*WHIP_SCALE)+'px';
   im.style.width=Math.round(rect.w*WHIP_SCALE)+'px';
   im.style.height=Math.round(rect.h*WHIP_SCALE)+'px';
   im.style.maxWidth='none';im.style.maxHeight='none';
   im.style.objectFit='fill';im.style.visibility='hidden';im.style.opacity='0';
   im.style.pointerEvents='none';
   im.onload=()=>{
    if(im.naturalWidth!==rect.w||im.naturalHeight!==rect.h)failed=true;
    const done=()=>{complete++;ready.whip=!failed&&complete===7;};
    if(typeof im.decode==='function')im.decode().then(done,done);else done();
   };
   im.onerror=()=>{failed=true;ready.whip=false;};
   im.src=DIR+'doctore-whip-clean-v2/frame-'+n+'.png?v=3';
   whipImages.push(im);
  });
 }else{
  const im=new Image();sources[kind]=im;
  im.onload=()=>{ready[kind]=im.naturalWidth===1448&&im.naturalHeight===1086;};
  im.onerror=()=>{ready[kind]=false;};
  im.src=DIR+settings.file+'?approved=3';
 }
}
function bodyRect(kind,n){
 const spec=INFO[kind],lower=n>=4;
 return {x:(n%4)*362,y:lower?spec.split:0,w:362,
  h:lower?1086-spec.split:spec.split};
}
function hideWhip(){
 for(const image of whipNodes){image.style.visibility='hidden';image.style.opacity='0';}
 if(layer)layer.style.visibility='hidden';
}
function paint(n){
 if(!actor)return;
 const idx=Math.min(7,Math.max(0,n));
 const lash=mode==='whip'&&ready.whip;
 frame=idx;actor.dataset.frame=String(idx);
 actor.dataset.action=mode;
 actor.dataset.footY=String(GROUND);
 actor.dataset.scale=String(lash?WHIP_SCALE:SCALE);
 actor.dataset.source='approved-unmodified-png';
 actor.dataset.fixedRoot='true';
 actor.dataset.whipReady=String(ready.whip);
 if(lash){
  const imageId=WHIP_ORDER[idx],rect=WHIP_BOXES[imageId];
  if(body)body.style.visibility='hidden';
  if(layer)layer.style.visibility='visible';
  for(let j=0;j<whipNodes.length;j++){
   const image=whipNodes[j],show=j===imageId;
   image.style.visibility=show?'visible':'hidden';
   image.style.opacity=show?'1':'0';
  }
  actor.dataset.sheet='doctore-whip-user-v1.png';
  actor.dataset.renderFile='doctore-whip-clean-v2/frame-'+imageId+'.png';
  actor.dataset.crop=JSON.stringify(rect);
  actor.dataset.wide=String(imageId===WIDE_ID);
 }else{
  hideWhip();
  if(body)body.style.visibility='visible';
  const kind=mode==='whip'?'idle':mode,info=INFO[kind];
  const useIdx=mode==='whip'?0:idx,rect=bodyRect(kind,useIdx);
  const dy=Math.round(GROUND-info.feet[useIdx]*SCALE);
  if(body){
   body.style.backgroundImage='url("'+DIR+info.file+'?approved=3")';
   body.style.backgroundPosition=(-rect.x)+'px '+(-rect.y)+'px';
   body.style.backgroundSize='1448px 1086px';
   body.style.width=rect.w+'px';body.style.height=rect.h+'px';
   body.style.left='0px';body.style.top=dy+'px';
   body.style.transform='scale('+SCALE+')';
  }
  actor.dataset.sheet=info.file;
  actor.dataset.renderFile=info.file;
  actor.dataset.crop=JSON.stringify(rect);
  actor.dataset.wide='false';
 }
 // Emit the contact precisely once, at the first extended-whip frame.
 // The mounted trainee responds; scene rerenders remove its old listener.
 if(mode==='whip'&&idx===4&&!impactSent){
  impactSent=true;
  actor.dispatchEvent(new CustomEvent('ludus:whip-impact',{
   bubbles:true,detail:{frame:idx,source:'doctore'}
  }));
 }
}
function stop(){
 if(raf)cancelAnimationFrame(raf);
 raf=0;actor=null;body=null;layer=null;whipNodes.length=0;
 frame=-1;mode='idle';stamp=0;clock=0;until=0;impactSent=false;
}
function tick(now){
 if(!actor||!actor.isConnected){stop();return;}
 clock+=stamp?Math.min(80,Math.max(0,now-stamp)):0;stamp=now;
 const reduced=!!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 if(mode!=='idle'&&now>=until){mode='idle';clock=0;frame=-1;}
 const next=reduced?0:Math.floor(clock/INFO[mode].duration)%8;
 if(next!==frame||((mode==='whip')&&ready.whip&&actor.dataset.whipReady==='false'))paint(next);
 raf=requestAnimationFrame(tick);
}
function mount(node){
 stop();if(!node)return false;
 actor=node;
 if(root.document?.createElement){
  body=root.document.createElement('div');body.className='la-doctore-body';
  layer=root.document.createElement('div');layer.className='la-doctore-whip';
  whipImages.forEach(im=>{layer.appendChild(im);whipNodes.push(im);});
  node.replaceChildren(body,layer);
 }
 paint(0);raf=requestAnimationFrame(tick);return true;
}
function react(id){
 if(!actor)return false;
 mode=id===1?'talk':id===2?'command':id===3?'whip':'idle';
 frame=-1;clock=0;impactSent=false;
 until=mode==='idle'?0:(stamp||performance.now())+
  8*INFO[mode].duration*(mode==='whip'?1:1.6);
 paint(0);return true;
}
root.LudusDoctoreAnim={version:'4.3.0',mount,react,unmount:stop,
 sprite:{sheets:Object.fromEntries(Object.entries(INFO).map(([key,s])=>[key,DIR+s.file])),
  whipFrames:WHIP_ORDER,wideWhip:WHIP_BOXES[WIDE_ID].w,
  framesPerAction:8,scale:SCALE,whipScale:WHIP_SCALE,baseline:GROUND,
  actions:{idle:0,talk:1,command:2,whip:3}},
 status:()=>({mode,frame,ready:{...ready},baseline:GROUND,scale:SCALE,whipScale:WHIP_SCALE})};
})(window);

