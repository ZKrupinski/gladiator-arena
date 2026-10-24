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
// Wolf V3 is opt-in and source-complete-only. The original 40-frame art remains
// visible until the full approved atlas manifest and the requested action load.
// Missing unfinished packs never result in invisible opponents.
// The user-approved trial is completely isolated from native V3 production.
const WOLF_TRIAL_ENABLED=typeof location!=='undefined'&&
 new URLSearchParams(location.search).get('wolfTrial')==='1';
const WOLF_V3_DIR=WOLF_TRIAL_ENABLED
 ? 'assets/beasts/wolf-trial/' : 'assets/beasts/wolf-v3/';
const WOLF_MANIFEST_PATH='public/'+WOLF_V3_DIR+'manifest.json';
const WOLF_ACTIONS=Object.freeze([
 'idle','walk','attack1','attack2','attack3','attack4','hit','death','roar'
]);
const wolfV3={state:'unrequested',actions:new Map(),metrics:new Map(),
 normalized:false,error:null,loadingStill:null};
// Small, unified gameplay presentation adjustment. Keep the same world-space
// center and shared paw reference across every V3 motion (including death).
const WOLF_DISPLAY_SCALE=1; // species size comes from the shared calibration only
const WOLF_PAW_RAISE=0;      // all paws use the common ground line
// Read visible alpha extents once per atlas, never trim geometry frame by frame.
// Neighbor-strip pixels thinner than 1.5% of a cell do not define the foot pivot.
function wolfAtlasMetrics(img){
 if(typeof document==='undefined'||!document.createElement)return null;
 try{
  const w=img.naturalWidth,h=img.naturalHeight,cw=w/4,ch=h/2;
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const cx=canvas.getContext('2d',{willReadFrequently:true});
  if(!cx)return null;
  cx.drawImage(img,0,0);
  const bytes=cx.getImageData(0,0,w,h).data;
  const frames=[];
  for(let k=0;k<8;k++){
   const ox=k%4*cw,oy=Math.floor(k/4)*ch;
   const rows=new Uint32Array(ch),cols=new Uint32Array(cw);
   for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
    const alpha=bytes[((oy+y)*w+ox+x)*4+3];
    if(alpha>=56){rows[y]++;cols[x]++;}
   }
   // Avoid sparse antialias particles from a neighboring cell changing pivots.
   const rowFloor=Math.max(2,Math.floor(cw*.014));
   const colFloor=Math.max(2,Math.floor(ch*.009));
   const activeRows=[],activeCols=[];
   for(let y=0;y<ch;y++)if(rows[y]>=rowFloor)activeRows.push(y);
   for(let x=0;x<cw;x++)if(cols[x]>=colFloor)activeCols.push(x);
   if(!activeRows.length||!activeCols.length){frames.push(null);continue;}
   const top=activeRows[0],bottom=activeRows[activeRows.length-1]+1;
   // Use torso opacity, not swinging tail/head, to lock a moving pose.
   const bandTop=Math.max(0,Math.floor(top+(bottom-top)*.29));
   const bandEnd=Math.min(ch,Math.ceil(top+(bottom-top)*.69));
   let weightedX=0,weightedMass=0;
   for(let y=bandTop;y<bandEnd;y++)for(let x=Math.floor(cw*.08);x<Math.ceil(cw*.92);x++){
    const a=bytes[((oy+y)*w+ox+x)*4+3];
    if(a>=96){weightedX+=x*a;weightedMass+=a;}
   }
   const torsoX=weightedMass?weightedX/weightedMass:
    (activeCols[0]+activeCols[activeCols.length-1])*.5;
   // Reject a solid silhouette sliced by the edge of a V6 atlas cell.
   const edgeInk=cols[0]+cols[1]+cols[cw-2]+cols[cw-1];
   frames.push({left:activeCols[0],right:activeCols[activeCols.length-1]+1,
     top,bottom,visibleHeight:bottom-top,torsoX,
     edgeCut:edgeInk>Math.max(12,Math.floor(ch*.065))});
  }
  const centers=frames.filter(Boolean).map(f=>f.torsoX).sort((a,b)=>a-b);
  const middle=centers.length?centers[Math.floor(centers.length/2)]:cw*.5;
  for(const f of frames)if(f)
   f.walkOffset=Math.max(-cw*.18,Math.min(cw*.18,middle-f.torsoX));
  return frames;
 }catch(_){return null;} // Keep the original atlas fallback if inspection fails.
}

function wolfActionFor(f,pose){
 // KO animation supersedes hit/intro/idle and always holds the final corpse.
 if(f?.dead||f?.hp<=0||pose==='defeat'||pose==='death')return 'death';
 if(pose==='hit')return 'hit';
 if(pose==='roar')return 'roar';
 if(pose==='comboDash'||pose==='finisher')return 'attack4';
 // An actual special hit is ATTACK4; only the AI standoff gesture is ROAR.
 if(pose==='special')return f.action==='special'&&f.actionT>0?'attack4':'roar';
 if(pose==='attack'){
  return ['attack1','attack2','attack3'][Math.max(0,Math.min(2,Number(f.attackVariant)||0))];
 }
 if(pose==='walk'||pose==='dodge')return 'walk';
 return 'idle';
}
function wolfFrameIndex(f,pose,clock){
 const act=wolfActionFor(f,pose);
 if(act==='roar'&&Number.isFinite(f._beastRoarProgress))return Math.min(7,Math.max(0,Math.floor(f._beastRoarProgress*8)));
 if(act==='idle'||act==='walk'||act==='roar')
  return Math.floor((Number(clock)||0)*(act==='idle'?6:act==='walk'?7:8))%8;
 const duration=Math.max(.12,Number(f.actionDuration)||.5);
 if(act==='death'){
  if(!Number.isFinite(f._beastDeathSince))f._beastDeathSince=Number(clock)||0;
  return Math.min(7,Math.max(0,Math.floor(((Number(clock)||0)-f._beastDeathSince)/.68*8)));
 }
 const progress=f.actionT>0?Math.max(0,Math.min(.999,1-f.actionT/duration)):0;
 return Math.min(7,Math.floor(progress*8));
}
// Pin cached atlas URLs to the verified uploader release. If the V3 pack
// was installed outside the release uploader, use a fresh session nonce so
// a previously cached 404 or old image cannot silently hide the new sprites.
async function wolfV3CacheKey(){
 const uncached=String(Date.now());
 try{
  const response=await fetch('uploader-release.json',{cache:'no-store'});
  if(!response.ok)return uncached;
  const marker=await response.json();
  const wolfManifestHash=marker?.assetSha256?.[WOLF_MANIFEST_PATH];
  if(marker?.releaseProtocol==='spartacus-uploader-v1'&&
     typeof marker.releaseId==='string'&&
     /^[a-zA-Z0-9][a-zA-Z0-9_-]{5,70}$/.test(marker.releaseId)&&
     typeof wolfManifestHash==='string'&&/^[a-f0-9]{64}$/.test(wolfManifestHash))
   return marker.releaseId;
 }catch(_){}
 return uncached;
}
function loadWolfV3(){
 if(wolfV3.state!=='unrequested'||typeof fetch!=='function')return;
 wolfV3.state='loading';
 Promise.resolve().then(async()=>{
  const version=encodeURIComponent(await wolfV3CacheKey());
  const response=await fetch(WOLF_V3_DIR+'manifest.json?v='+version,{cache:'no-store'});
  if(!response.ok)throw Error('Wolf V3 art pack not published');
  const manifest=await response.json();
  if(manifest.version!==3||!manifest.actions)throw Error('Invalid V3 manifest');
  if(WOLF_TRIAL_ENABLED&&manifest.previewOnly!==true)
   throw Error('Trial atlas manifest must be marked previewOnly');
  if(!WOLF_TRIAL_ENABLED&&manifest.previewOnly===true)
   throw Error('Preview atlas cannot activate production V3');
  wolfV3.normalized=manifest.normalizedGeometry===true;
  for(const action of WOLF_ACTIONS){
   const item=manifest.actions[action];
   if(typeof item!=='string'||item!==action+'.webp')
    throw Error('Wolf V3 missing required action '+action);
  }
  const loaded=await Promise.all(WOLF_ACTIONS.map(action=>new Promise((resolve,reject)=>{
   const image=new Image();
   image.onload=()=>{
    const w=image.naturalWidth,h=image.naturalHeight;
    if(!w||!h||w%4!==0||h%2!==0)
     return reject(Error('Invalid 4x2 wolf atlas '+action+' '+w+'x'+h));
    if(action==='idle')wolfV3.loadingStill=image;
    resolve([action,image]);
   };
   image.onerror=()=>reject(Error('Atlas did not load '+action));
   image.src=WOLF_V3_DIR+manifest.actions[action]+'?v='+version;
  })));
  // Atomic visual activation: never show a partial nine-motion pack.
  wolfV3.metrics.clear();
  for(const [name,img] of loaded){
   wolfV3.actions.set(name,img);
   wolfV3.metrics.set(name,wolfAtlasMetrics(img));
  }
  wolfV3.state='ready';
 }).catch(e=>{
  // Keep using the verified legacy 40-frame art if a V3 pack is incomplete.
  if(wolfV3.state!=='ready'){
   wolfV3.error=String(e);
   wolfV3.loadingStill=null;
   wolfV3.state='unavailable';
  }
 });
}

// Test-only transport for previewing locally approved image art inside the real
// game renderer. No data is persisted, and normal players cannot enable it
// without opening the explicit '?wolfPreview=1' diagnostic URL themselves.
const WOLF_PREVIEW_ENABLED=typeof location!=='undefined'&&
 new URLSearchParams(location.search).get('wolfPreview')==='1';
async function installWolfPreviewAtlasPack(raw){
 if(!WOLF_PREVIEW_ENABLED||!raw||typeof raw!=='object')return false;
 // Don't permit arbitrary remote URLs or SVG/script content.
 const expected='data:image/webp;base64,';
 for(const key of WOLF_ACTIONS){
  const entry=raw[key];
  if(typeof entry!=='string'||!entry.startsWith(expected)||
     entry.length>2800000)return false;
 }
 const decoded=await Promise.all(WOLF_ACTIONS.map(name=>new Promise((ok,no)=>{
  const image=new Image();
  image.onload=()=>{
   if(!image.naturalWidth||!image.naturalHeight||
      image.naturalWidth%4!==0||image.naturalHeight%2!==0)
     no(Error('Preview atlas must be a valid 4x2 grid: '+name));
   else ok([name,image]);
  };
  image.onerror=()=>no(Error('Preview atlas error: '+name));
  image.src=raw[name];
 })));
 wolfV3.actions.clear();
 for(const [name,image] of decoded)wolfV3.actions.set(name,image);
 wolfV3.state='ready';wolfV3.error=null;
 return true;
}
if(WOLF_PREVIEW_ENABLED&&typeof window!=='undefined'){
 window.addEventListener('message',async event=>{
  if(event.source!==window.parent||window.parent===window||
     event.data?.type!=='gladiator:wolf-preview-pack')return;
  let success=false;
  try{success=await installWolfPreviewAtlasPack(event.data.actions);}
  catch(err){wolfV3.error=String(err);}
  event.source.postMessage({
    type:'gladiator:wolf-preview-status',ready:success,
    error:success?null:wolfV3.error,
    actions:[...wolfV3.actions.keys()]
  },event.origin||'*');
 });
}
// Before nine actions load, prevent the FIRST fight from showing the older
// 8x5 rectangular cuts containing art from neighboring animation frames.
// Paint one intact idle source instead, then atomically enter full V3 animation.
function drawWolfPending(ctx,{x,y,w,h,flip=false,alpha=1}){
 const approved=wolfV3.normalized?wolfV3.loadingStill:null;
 // Never flash a legacy wolf while the V3 atlas loads.
 const center=x+w*.5,ground=y+h-WOLF_PAW_RAISE;
 ctx.save();
 ctx.globalAlpha*=Math.max(0,Math.min(1,alpha));
 if(flip){ctx.translate(2*center,0);ctx.scale(-1,1);}
 if(approved){
  const cw=approved.naturalWidth/4,ch=approved.naturalHeight/2;
  const scale=h*.83/512*WOLF_DISPLAY_SCALE;
  ctx.drawImage(approved,0,0,cw,ch,
    center-272*scale,ground-470*scale,cw*scale,ch*scale);
 }else{
  // The new wolf's idle atlas will display as soon as the V3 image is ready.
  // No legacy sprite, and no unsupported canvas drawing methods in QA mocks.
 }
 ctx.restore();
 return true;
}
function drawWolfV3(ctx,args){
 const {fighter,pose='idle',clock=0,x,y,w,h,flip=false,alpha=1}=args;
 if(fighter?.beastType!=='wolf'||wolfV3.state!=='ready')return false;
 const action=wolfActionFor(fighter,pose),img=wolfV3.actions.get(action);
 if(!img)return false;
 let index=wolfFrameIndex(fighter,pose,clock);
 const cellW=img.naturalWidth/4,cellH=img.naturalHeight/2;
 const actionMetrics=wolfV3.metrics.get(action);
 // Never display a walk frame with a substantial neighbor-frame seam.
 // If all eight are invalid, retain the old known-good walk animation.
 if(action==='walk'&&actionMetrics?.[index]?.edgeCut){
  const safe=Array.from({length:8},(_,n)=>(index+n)%8)
   .find(i=>actionMetrics[i]&&!actionMetrics[i].edgeCut);
  if(safe===undefined)return false;
  index=safe;
 }
 // A fixed cell-origin causes row-two wolf feet to rise by 40-75 source
 // pixels. Align the VISIBLE planted paw instead; use one world ground line
 // for every action, with one UNIFORM scale for width and height.
 // Verified V3.1 rebuilt sheets have a baked center and single paw
 // ground-line (x=272,y=470) for all 72 frames. Re-running adaptive
 // bounding-box scale on those frames reintroduces apparent size popping.
 if(wolfV3.normalized){
  const scale=h*.83/512*WOLF_DISPLAY_SCALE; // one uniform scale for every V3 action
  const center=x+w*.5,ground=y+h-WOLF_PAW_RAISE;
  const walkBox=action==='walk'?actionMetrics?.[index]:null;
  // Recenter only the WALK torso, align planted paws to the same world floor.
  // Never rescale each frame; preserve native-resolution pixel detail.
  const anchorX=272-(walkBox?.walkOffset||0);
  const footAdjust=actionMetrics?.[index]?470-actionMetrics[index].bottom:0;
  ctx.save();ctx.globalAlpha*=Math.max(0,Math.min(1,alpha));
  if(flip){ctx.translate(2*center,0);ctx.scale(-1,1);}
  ctx.drawImage(img,(index%4)*cellW,Math.floor(index/4)*cellH,
    cellW,cellH,center-anchorX*scale,ground-(470-footAdjust)*scale,
    cellW*scale,cellH*scale);
  ctx.restore();return true;
 }
 const box=actionMetrics?.[index];
 const baseScale=h*.83/512*WOLF_DISPLAY_SCALE;
 // Small source-art silhouette variations may be normalized slightly,
 // but the pounce, roar and death must keep their authentic changing pose.
 const correction=box&&action!=='death'&&action!=='roar'?
   Math.max(.86,Math.min(1.13,322/Math.max(1,box.visibleHeight))):1;
 const scale=baseScale*correction;
 const center=x+w*.5,ground=y+h-WOLF_PAW_RAISE;
 const sourceX=box?(box.left+box.right)*.5:cellW*.5;
 const sourceBottom=box?box.bottom:cellH*.90;
 // Only render the owned, alpha-inspected region from this cell. Residual
 // foreign art from the previous row may be attached at its upper border,
 // which would otherwise enlarge the wolf even with a correct paw pivot.
 const margin=3;
 const left=box?Math.max(0,box.left-margin):0;
 const top=box?Math.max(0,box.top-margin):0;
 const right=box?Math.min(cellW,box.right+margin):cellW;
 const bottom=box?Math.min(cellH,box.bottom+margin):cellH;
 const sw=Math.max(1,right-left),sh=Math.max(1,bottom-top);
 ctx.save();
 ctx.globalAlpha*=Math.max(0,Math.min(1,alpha));
 if(flip){ctx.translate(center*2,0);ctx.scale(-1,1);}
 ctx.drawImage(img,(index%4)*cellW+left,Math.floor(index/4)*cellH+top,
               sw,sh,center-(sourceX-left)*scale,
               ground-(sourceBottom-top)*scale,sw*scale,sh*scale);
 ctx.restore();
 return true;
}

const ACTION_KEYS=Object.freeze(['idle','walk','attack','hit','defeat']);
const INDEPENDENT_DIR='assets/beasts/individual/';
// Independent 512px source frames are loaded only for the selected opponent.
function loadIndividual(type,entry){
 if(entry.individualLoading)return;
 entry.individualLoading=true;entry.individual=new Map();entry.individualReady=0;
 for(const action of ACTION_KEYS){
  for(let i=0;i<8;i++){
   const src=INDEPENDENT_DIR+type+'/'+action+'/'+String(i).padStart(2,'0')+'.png?v=3';
   const img=new Image();const key=action+':'+i;
   img.onload=()=>{if(img.naturalWidth===512&&img.naturalHeight===512){entry.individual.set(key,img);entry.individualReady++;}};
   img.onerror=()=>{};img.src=src;
  }
 }
}

let loaded=0,failed=0;
function ensure(type){
 if(type==='wolf')loadWolfV3();
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
 if(type==='wolf'){
  ensure(type);
  if(wolfV3.state!=='ready')return null;
  const image=wolfV3.actions.get(pose==='defeat'?'death':'idle');
  if(!image)return null;
  const out=document.createElement('canvas');
  out.width=image.naturalWidth/4;out.height=image.naturalHeight/2;
  const frame=pose==='defeat'?7:0;
  out.getContext('2d').drawImage(image,(frame%4)*out.width,Math.floor(frame/4)*out.height,
   out.width,out.height,0,0,out.width,out.height);
  return out;
 }
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
function paintBeast(ctx,{fighter,pose='idle',clock=0,x,y,w,h,flip=false,alpha=1}){
 if(!fighter?.beastType)return false;
 if(drawWolfV3(ctx,{fighter,pose,clock,x,y,w,h,flip,alpha}))return true;
 // The old wolf 8x5 cutter is not a permitted transient or ready fallback:
 // the first encounter would briefly show neighboring or double poses.
 if(fighter.beastType==='wolf'&&
   ['unrequested','loading','ready'].includes(wolfV3.state))
  return drawWolfPending(ctx,{x,y,w,h,flip,alpha});
 const info=SPEC[fighter.beastType],entry=cache.get(fighter.beastType);
 if(!info)return false;
 // A pending image must not result in invisible foes. Let the existing
 // gladiator fallback paint until all 40 frames have been isolated.
 if(!entry?.ready)return false;
 const n=frameFor(fighter,pose,clock);
 const key=ACTION_KEYS[n.row]||'idle';
 const extra=pose==='special'?root.SpriteMotionRegistry?.getExtraFrames?.(fighter.beastType,'roar'):null;
 if(extra?.length===8){
  const since=Number.isFinite(fighter._beastRoarSince)?fighter._beastRoarSince:clock;
  const idx=Math.min(7,Math.max(0,Math.floor((clock-since)*8)));
  const im=extra[idx];
  if(im?.naturalWidth){
   const scale=h*.83*info.scale/im.naturalHeight;
   const dw=im.naturalWidth*scale,dh=im.naturalHeight*scale;
   const centre=x+w*.5;
   ctx.save();ctx.globalAlpha*=Math.max(0,Math.min(1,alpha));
   if(flip){ctx.translate(centre*2,0);ctx.scale(-1,1);}
   ctx.drawImage(im,centre-dw*.5,y+h-(root.PracticeScaleProfiles?.footY(im,im.naturalHeight)??im.naturalHeight)*scale,dw,dh);ctx.restore();return true;
  }
 }
 const indy=entry.individual?.get(key+':'+n.index);
 if(indy?.naturalWidth){
  // Every independent PNG is exactly 512×512. Feet and body share one
  // constant canvas origin across all 8 frames (no flicker or stretch).
  const factor=info.scale*.83,ww=h*factor,hh=h*factor;
  const centre=x+w*.5,floor=y+h;
  ctx.save();ctx.globalAlpha*=Math.max(0,Math.min(1,alpha));
  if(flip){ctx.translate(centre*2,0);ctx.scale(-1,1);}
  ctx.drawImage(indy,centre-ww*.5,floor-(root.PracticeScaleProfiles?.footY(indy,512*.88)??512*.88)*hh/512,ww,hh);
  ctx.restore();return true;
 }
 const frame=entry.frames?.[n.row]?.[n.index];
 if(!frame?.ink)return false;
 const scale=h*.83*info.scale/frame.canvas.height;
 const ww=frame.canvas.width*scale,hh=frame.canvas.height*scale;
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
// Apply calibrated visual-only size to every beast (including wolf V3, 512px
// standalone poses, roar and fallback), around the real ground-contact pivot.
// Collision, physics, HP and attack ranges retain their original rules.
function draw(ctx,args){
 const type=args?.fighter?.beastType;
 if(!type)return false;
 const raw=root.PracticeScaleProfiles?.scale?.('beast_'+type)??1;
  const foot=root.PracticeScaleProfiles?.foot?.('beast_'+type)??0;
 const factor=Number.isFinite(raw)?Math.max(.65,Math.min(1.85,raw)):1;
 if(!ctx||(factor===1&&!foot))return paintBeast(ctx,args);
 const cx=args.x+args.w*.5,ground=args.y+args.h;
 ctx.save();
 ctx.translate(cx,ground+foot);
 ctx.scale(factor,factor);
 ctx.translate(-cx,-ground);
 try{return paintBeast(ctx,args)}finally{ctx.restore();}
}
root.ArenaBeasts={version:'2.1.0',types:SPEC,rows:ROWS_BY_POSE,
 pick,apply,ensure,frameFor,draw,portrait,wolfActionFor,wolfFrameIndex,installWolfPreviewAtlasPack,
 status:()=>({loaded,failed,ready:[...cache].filter(([,x])=>x.ready).map(([name])=>name),individual:[...cache].map(([name,e])=>({name,frames:e.individualReady||0})),wolfV3:{status:wolfV3.state,trial:WOLF_TRIAL_ENABLED,normalized:wolfV3.normalized,actions:[...wolfV3.actions.keys()],anchoredFrames:[...wolfV3.metrics.values()].reduce((n,frames)=>n+(frames?.filter(Boolean).length||0),0),error:wolfV3.error}})};
})(window);
