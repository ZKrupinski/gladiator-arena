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
let loaded=0,failed=0;
function ensure(type){
 if(!SPEC[type])return false;
 if(cache.has(type))return !!cache.get(type).ready;
 if(typeof Image==='undefined')return false;
 const img=new Image();
 const entry={img,frames:null,error:null,ready:false};
 cache.set(type,entry);
 img.onload=()=>{
  if(img.naturalWidth!==WIDTH||img.naturalHeight!==HEIGHT){
   entry.error='Unexpected source dimensions';failed++;return;
  }
  try{
   entry.frames=isolate(img);entry.ready=true;loaded++;
  }catch(e){entry.error=String(e);failed++;console.warn('Beast isolation failed',type,e);}
 };
 img.onerror=()=>{entry.error='Asset failed';failed++;};
 img.src=DIR+type+'-40.png?v=1';
 return false;
}
function isolate(img){
 const frames=[];
 // Float sheet cell edges cannot be sampled from neighboring frames. A
 // three-pixel safety gutter at every edge prevents alpha/texture bleeding.
 for(let row=0;row<ROWS;row++){
  const part=[];
  for(let col=0;col<COLS;col++){
   const sx=Math.round(col*WIDTH/COLS)+3;
   const sy=Math.round(row*HEIGHT/ROWS)+3;
   const ex=Math.round((col+1)*WIDTH/COLS)-3;
   const ey=Math.round((row+1)*HEIGHT/ROWS)-3;
   const w=Math.max(1,ex-sx),h=Math.max(1,ey-sy);
   const canvas=document.createElement('canvas');
   canvas.width=w;canvas.height=h;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   ctx.drawImage(img,sx,sy,w,h,0,0,w,h);
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
 const progress=f.actionT>0?Math.max(0,Math.min(.999,1-f.actionT/duration)):0;
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
 const n=frameFor(fighter,pose,clock),frame=entry.frames[n.row][n.index];
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
root.ArenaBeasts={version:'1.0.0',types:SPEC,rows:ROWS_BY_POSE,
 pick,apply,ensure,frameFor,draw,status:()=>({loaded,failed,ready:[...cache].filter(([,x])=>x.ready).map(([name])=>name)})};
})(window);
