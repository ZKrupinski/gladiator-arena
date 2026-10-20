/* ARENA BESTIAE v1.0 — five approved Roman arena beasts.
 * Each is the user's original 1586x992 8-column x 5-row RGBA PNG:
 * [0] idle / [1] locomotion / [2] strike / [3] damage / [4] defeat
 * 8 animation frames per action; frame art is isolated in-memory.
 * Never use these animals in Ludus personnel, market, training or recruitment.
 */
(function(root){'use strict';
const DIR='assets/beasts/',COLS=8,ROWS=5,WIDTH=1586,HEIGHT=992;
const ROWS_BY_POSE=Object.freeze({idle:0,walk:1,attack:2,special:2,
 comboDash:2,hit:3,defeat:4,finisher:0,guard:0,dodge:1});
const SPEC=Object.freeze({
 wolf:{label:'전투 늑대',latin:'LVPVS',level:4,hp:.83,atk:.93,move:1.23,reach:.91,armor:0,scale:1.00,weight:4,role:'빠른 추격과 연속 물기'},
 leopard:{label:'전투 표범',latin:'PANTHERA',level:6,hp:.88,atk:1.11,move:1.31,reach:.94,armor:0,scale:1.05,weight:3,role:'기습과 날렵한 도약'},
 tiger:{label:'전투 호랑이',latin:'TIGRIS',level:8,hp:1.06,atk:1.17,move:1.11,reach:1.05,armor:.04,scale:1.12,weight:3,role:'강력한 앞발 후려치기'},
 lion:{label:'전투 사자',latin:'LEO',level:10,hp:1.20,atk:1.11,move:1.06,reach:1.07,armor:.05,scale:1.18,weight:2,role:'육중한 포효와 압박'},
 elephant:{label:'전투 코끼리',latin:'ELEPHAS',level:14,hp:1.57,atk:1.12,move:.77,reach:1.16,armor:.12,scale:1.38,weight:1,role:'돌진과 상아 충격'}
});
const BY_ROUND=['wolf','leopard','tiger','lion','elephant'];
const cache=new Map();
const ACTION_KEYS=Object.freeze(['idle','walk','attack','hit','defeat']);
const INDEPENDENT_DIR='assets/beasts/individual/';
// Independent 512px source frames are loaded only for the selected opponent.
function loadIndividual(type,entry){
 if(entry.individualLoading)return;
 entry.individualLoading=true;entry.individual=new Map();entry.individualReady=0;
 for(const action of ACTION_KEYS){
  for(let i=0;i<8;i++){
   const src=INDEPENDENT_DIR+type+'/'+action+'/'+String(i).padStart(2,'0')+'.png?v=1';
   const img=new Image();const key=action+':'+i;
   img.onload=()=>{if(img.naturalWidth===512&&img.naturalHeight===512){entry.individual.set(key,img);entry.individualReady++;}};
   img.onerror=()=>{};img.src=src;
  }
 }
}

let loaded=0,failed=0;
function ensure(type){
 if(!SPEC[type])return false;
 if(cache.has(type)){const saved=cache.get(type);loadIndividual(type,saved);return !!saved.ready;}
 if(typeof Image==='undefined')return false;
 const img=new Image();
 const entry={img,frames:null,error:null,ready:false};
 cache.set(type,entry);
 loadIndividual(type,entry);
 img.onload=()=>{
  if(img.naturalWidth!==WIDTH||img.naturalHeight!==HEIGHT){
   entry.error='Unexpected source dimensions';failed++;return;
  }
  try{
   entry.frames=isolate(img,type);entry.ready=true;loaded++;
  }catch(e){entry.error=String(e);failed++;console.warn('Beast isolation failed',type,e);}
 };
 img.onerror=()=>{entry.error='Asset failed';failed++;};
 img.src=DIR+type+'-40.png?v=1';
 return false;
}
function isolate(img,type){
 const frames=[];
 // Float sheet cell edges cannot be sampled from neighboring frames. A
 // three-pixel safety gutter at every edge prevents alpha/texture bleeding.
 for(let row=0;row<ROWS;row++){
  const part=[];
  for(let col=0;col<COLS;col++){
   const inset=type==='elephant'?1:3;
   const sx=Math.round(col*WIDTH/COLS)+inset;
   const sy=Math.round(row*HEIGHT/ROWS)+inset;
   const ex=Math.round((col+1)*WIDTH/COLS)-inset;
   const ey=Math.round((row+1)*HEIGHT/ROWS)-inset;
   const w=Math.max(1,ex-sx),h=Math.max(1,ey-sy);
   const canvas=document.createElement('canvas');
   canvas.width=w;canvas.height=h;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   ctx.drawImage(img,sx,sy,w,h,0,0,w,h);
   if(type==='elephant')cleanElephantFrame(ctx,w,h);
   const data=ctx.getImageData(0,0,w,h).data;
   let left=w,right=0,top=h,bottom=0,ink=0;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const a=data[(y*w+x)*4+3];
    if(a>24){if(x<left)left=x;if(x>right)right=x;
      if(y<top)top=y;if(y>bottom)bottom=y;ink++;}
   }
   part.push({canvas,bounds:ink?{left,right,top,bottom}:null,ink});
  }
  frames.push(part);
 }
 return frames;
}
// Remove stray neighbouring animation fragments rather than cropping the
// elephant silhouette again. Preserve ALL substantial connected body pieces.
function cleanElephantFrame(ctx,w,h){
 const pixels=ctx.getImageData(0,0,w,h),data=pixels.data,used=new Uint8Array(w*h);
 const components=[];const offsets=[-1,1,-w,w];
 for(let k=0;k<used.length;k++){
  if(used[k]||data[k*4+3]<40)continue;
  const queue=[k];used[k]=1;
  let minX=k%w,maxX=k%w,minY=Math.floor(k/w),maxY=minY;
  for(let head=0;head<queue.length;head++){
   const cur=queue[head],x=cur%w,y=Math.floor(cur/w);
   minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
   for(const o of offsets){
    const n=cur+o;
    if(n<0||n>=used.length||used[n]||data[n*4+3]<40)continue;
    if(o===-1&&x===0||o===1&&x===w-1)continue;
    used[n]=1;queue.push(n);
   }
  }
  components.push({pixels:queue,left:minX,right:maxX,top:minY,bottom:maxY});
 }
 if(!components.length)return;
 components.sort((a,b)=>b.pixels.length-a.pixels.length);
 const main=components[0];
 if(main.pixels.length<w*h*.008)return;
 const keep=new Uint8Array(w*h);
 const nearby=c=>c.left<=main.right+12&&c.right>=main.left-12&&c.top<=main.bottom+12&&c.bottom>=main.top-12;
 for(const c of components){
  if(c!==main&&!(c.pixels.length>=Math.max(25,main.pixels.length*.018)&&nearby(c)))continue;
  for(const px of c.pixels)keep[px]=1;
 }
 // Clear isolated specks; antialiased border pixels near kept shape remain.
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const k=y*w+x;if(!data[4*k+3]||keep[k])continue;
  const close=(x>0&&keep[k-1])||(x+1<w&&keep[k+1])||(y>0&&keep[k-w])||(y+1<h&&keep[k+w]);
  if(!close)data[4*k+3]=0;
 }
 ctx.putImageData(pixels,0,0);
}
function portrait(type,pose='idle'){
 const entry=cache.get(type);
 const kind=pose==='defeat'?'defeat':'idle';
 const indy=entry?.individual?.get(kind+':'+(kind==='defeat'?7:0));
 if(indy?.naturalWidth)return indy;
 if(!entry?.ready)return null;
 const row=ROWS_BY_POSE[pose]??0,frame=entry.frames[row]?.[0];
 if(!frame?.bounds)return null;
 const b=frame.bounds,pad=3,w=b.right-b.left+1,h=b.bottom-b.top+1;
 const out=document.createElement('canvas');
 out.width=w+pad*2;out.height=h+pad*2;
 out.getContext('2d').drawImage(frame.canvas,b.left,b.top,w,h,pad,pad,w,h);
 return out;
}
function pick(round,boss=false,random=Math.random){
 const r=Math.max(1,Math.floor(Number(round)||1));
 if(boss||r<4)return null;
 // Special menagerie events are spaced apart and never replace bosses.
 if(r%4!==0&&!(r>=7&&random()<.075))return null;
 const index=Math.max(0,Math.min(BY_ROUND.length-1,Math.floor(r/4)-1));
 // The scheduled 4th, 8th, 12th, 16th and 20th arena bouts introduce
 // one new species at a time. Past round 20 rare random variety is allowed.
 if(r%4===0)return BY_ROUND[index];
 const available=BY_ROUND.slice(0,index+1);
 return available[Math.min(available.length-1,Math.floor(random()*available.length))];
}
function apply(fighter,type){
 const info=SPEC[type];if(!fighter||!info)return false;
 ensure(type); // Load only the encountered beast; avoid 13 MB at startup.
 fighter.beastType=type;
 fighter.growthType=null;fighter.growthLevel=null;
 fighter.championVariant=null;fighter.motionVariant=null;
 fighter.cfg={...fighter.cfg,name:info.latin+' · '+info.label,
  hp:Math.round(fighter.cfg.hp*info.hp),
  atk:Math.max(1,Math.round(fighter.cfg.atk*info.atk)),
  move:Math.max(80,Math.round(fighter.cfg.move*info.move)),
  reach:Math.round(fighter.cfg.reach*info.reach)};
 fighter.maxHp=Math.max(1,Math.round(fighter.maxHp*info.hp));
 fighter.hp=Math.min(fighter.maxHp,Math.max(1,Math.round(fighter.hp*info.hp)));
 fighter.armor=(fighter.armor||0)+info.armor;
 fighter.beastRole=info.role;
 // Existing attack/collision/parry/scoring remain the same engine.
 return true;
}
function frameFor(f,pose,clock){
 const row=ROWS_BY_POSE[pose]??0;
 const duration=Math.max(.12,Number(f.actionDuration)||.5);
 let progress=f.actionT>0?Math.max(0,Math.min(.999,1-f.actionT/duration)):0;
 // Death is an eight-frame, time-driven animation, never a frozen first cell.
 if(pose==='defeat'){
  if(!Number.isFinite(f._beastDeathSince))f._beastDeathSince=Number(clock)||0;
  progress=Math.max(0,Math.min(.999,((Number(clock)||0)-f._beastDeathSince)/1.18));
 }
 const walking=Math.abs(Number(f.vx)||0)>12;
 const index=(row===0||row===1)?
  Math.floor((Number(clock)||0)*(row===0?5:11))%8:
  Math.min(7,Math.floor(progress*8));
 return {row,index:row===1&&!walking?0:index};
}
function draw(ctx,{fighter,pose='idle',clock=0,x,y,w,h,flip=false,alpha=1}){
 if(!fighter?.beastType)return false;
 const info=SPEC[fighter.beastType],entry=cache.get(fighter.beastType);
 if(!info)return false;
 // A pending image must not result in invisible foes. Let the existing
 // gladiator fallback paint until all 40 frames have been isolated.
 if(!entry?.ready)return false;
 const n=frameFor(fighter,pose,clock);
 const key=ACTION_KEYS[n.row]||'idle';
 const indy=entry.individual?.get(key+':'+n.index);
 if(indy?.naturalWidth){
  // Every independent PNG is exactly 512×512. Feet and body share one
  // constant canvas origin across all 8 frames (no flicker or stretch).
  const factor=info.scale*1.28,ww=w*factor,hh=h*factor;
  const centre=x+w*.5,floor=y+h;
  ctx.save();ctx.globalAlpha*=Math.max(0,Math.min(1,alpha));
  if(flip){ctx.translate(centre*2,0);ctx.scale(-1,1);}
  ctx.drawImage(indy,centre-ww*.5,floor-hh*.88,ww,hh);
  ctx.restore();return true;
 }
 const frame=entry.frames?.[n.row]?.[n.index];
 if(!frame?.ink)return false;
 const scale=info.scale;
 const ww=w*scale,hh=h*scale;
 const drawCentre=x+w*.5;
 const px=ww/frame.canvas.width;
 const x0=drawCentre-((frame.bounds.left+frame.bounds.right)*.5)*px;
 const floor=y+h;
 const y0=floor-(frame.bounds.bottom+1)*(hh/frame.canvas.height);
 ctx.save();
 ctx.globalAlpha*=Math.max(0,Math.min(1,alpha));
 if(flip){
  ctx.translate(drawCentre*2,0);ctx.scale(-1,1);
 }
 ctx.drawImage(frame.canvas,x0,y0,ww,hh);
 ctx.restore();
 return true;
}
root.ArenaBeasts={version:'2.0.0',types:SPEC,rows:ROWS_BY_POSE,
 pick,apply,ensure,frameFor,draw,portrait,status:()=>({loaded,failed,ready:[...cache].filter(([,x])=>x.ready).map(([name])=>name),individual:[...cache].map(([name,e])=>({name,frames:e.individualReady||0}))})};
})(window);
