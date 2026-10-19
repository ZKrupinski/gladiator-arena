/* GLADIATOR ARENA — Directional 8-frame VFX v1.
 * Replaces left/right symmetrical combat splashes. Generated alpha painting
 * follows the attacker's FORWARD direction; mirrored at render time for left.
 *
 * 9 independently authored effect profiles, 8 stable cinematic frames each.
 * Victory is separated into behind-body golden halo and forward drifting
 * petal / gold-leaf layer. No fighter body scaling or rendering altered.
 *
 * An authored original preview exists as reference concept; this module
 * draws native-resolution animated alpha assets at runtime, because the
 * generated image files were not yet committed as binary spritesheets.
 */
(function(root){
'use strict';
const TAU=Math.PI*2,FRAME_COUNT=8,SIZE=480;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
const TYPES=['slash','sweep','thrust','guard','parry','special','dash','finisher','victory'];
const DURATIONS={slash:.25,sweep:.27,thrust:.26,guard:.34,parry:.43,
 special:.54,dash:.48,finisher:.64,victory:1.72};
const FRAME_STORE=new Map(),MAX_CACHE=39;
const MODELS=Object.freeze(Object.fromEntries(TYPES.map(k=>[k,Object.freeze({frames:8,duration:DURATIONS[k],width:SIZE,height:SIZE,source:'procedural-directional-paint',direction:'forward'})])));
const color={ivory:'#fff6da',white:'#fff8ec',silver:'#d7e6ec',gold:'#fff0a4',amber:'#f5aa42',hot:'#ffdf78',metal:'#8e9ba2',coal:'#4c3829',dust:'#9b7860',leaf:'#cd9a4a',pink:'#f2adc1'};
const hash=(n)=>{let s=Math.sin(n*127.1+91.7)*43758.5453;return s-Math.floor(s)};
const rnd=(seed,index)=>hash(seed*13.7+index*47.11);
const ease=t=>1-Math.pow(1-clamp(t),2);
function paintStroke(c,coords,w,tint,alpha=.9,blur=0){
 c.save();c.globalAlpha=alpha;c.lineCap='round';c.lineJoin='round';
 c.strokeStyle=tint;c.lineWidth=w;c.shadowColor=tint;c.shadowBlur=blur;
 c.beginPath();c.moveTo(coords[0][0],coords[0][1]);
 for(let i=1;i<coords.length;i++){
  if(i+1<coords.length){
   const mx=(coords[i][0]+coords[i+1][0])/2,my=(coords[i][1]+coords[i+1][1])/2;
   c.quadraticCurveTo(coords[i][0],coords[i][1],mx,my);i++;
  }else c.lineTo(coords[i][0],coords[i][1]);
 }
 c.stroke();c.restore();
}
function softGlow(c,x,y,s,colorStr,a=.7){
 const g=c.createRadialGradient(x,y,0,x,y,s);
 g.addColorStop(0,colorStr.replace('ALPHA',a.toFixed(3)));
 g.addColorStop(.21,colorStr.replace('ALPHA',(a*.34).toFixed(3)));
 g.addColorStop(1,colorStr.replace('ALPHA','0'));
 c.fillStyle=g;c.fillRect(x-s,y-s,s*2,s*2);
}
function shard(c,x,y,vx,vy,size,tint,opacity=1){
 const angle=Math.atan2(vy,vx);
 c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha=opacity;
 c.fillStyle=tint;c.beginPath();c.moveTo(size*1.8,0);
 c.lineTo(-size*.63,-size*.46);c.lineTo(-size*.28,size*.72);
 c.closePath();c.fill();
 c.fillStyle='rgba(255,240,204,.55)';
 c.beginPath();c.moveTo(size*1.6,-size*.05);c.lineTo(-size*.2,-size*.25);
 c.lineTo(-size*.15,size*.1);c.fill();c.restore();
}
function beam(c,x1,y1,x2,y2,thick,glow=1){
 paintStroke(c,[[x1,y1],[x2,y2]],thick*3,'rgba(255,117,24,.13)',.6,14*glow);
 paintStroke(c,[[x1,y1],[x2,y2]],thick*1.4,color.amber,.61,5*glow);
 paintStroke(c,[[x1,y1],[x2,y2]],Math.max(1,thick*.39),color.white,.85,3*glow);
}
function groundDust(c,stage,seed=0,center=64,y=168,size=1){
 const t=stage/7,peak=Math.sin(Math.PI*Math.min(1,t+.055));
 c.save();
 for(let k=0;k<24;k++){
  const a=rnd(seed,k*3),b=rnd(seed,k*3+1),d=rnd(seed,k*3+2);
  const travel=(17+265*t)*(a*.8+.25)*size;
  const x=center+travel+(-25+30*b),cy=y+(b-.5)*61-24*d*t;
  const r=(7+d*28)*(1+.35*t)*size;
  const grad=c.createRadialGradient(x,cy,0,x,cy,r);
  grad.addColorStop(0,'rgba(169,133,87,'+(peak*.15).toFixed(3)+')');
  grad.addColorStop(1,'rgba(93,67,51,0)');
  c.fillStyle=grad;c.fillRect(x-r,cy-r,r*2,r*2);
 }
 c.restore();
}
function strike(c,kind,step){
 const t=step/7,e=ease(Math.min(1,t*1.43)),fade=.18+.82*clamp((1-t)*1.4,0,1);
 const peak=Math.max(.14,Math.sin(Math.PI*clamp(t+.08,0,1)));
 const coreX=-152+287*e,coreY=33-30*Math.sin(e*Math.PI);
 const curve=kind==='slash'?1:kind==='sweep'?-1:kind==='thrust'?0:kind==='dash'?.35:kind==='special'?.7:.2;
 const force=kind==='finisher'?1.44:kind==='special'?1.10:kind==='dash'?1.18:1;
 c.save();c.translate(-34,0);
 // Instead of radial/symmetrical impact, the sweep's source is left of the
 // facing target and energy is pushed into +X.
 const y=kind==='sweep'?52:kind==='thrust'?2:kind==='dash'?123:40;
 const impactX=(kind==='dash'?82:coreX);
 softGlow(c,impactX,y,102+88*peak*force,'rgba(255,188,69,ALPHA)',peak*.23);
 if(kind!=='thrust'){
  const base=[[-150,118],[-75,126-72*curve],[18+145*e,42-102*curve],[115+130*e,-28-73*curve]];
  const width=(kind==='finisher'?37:kind==='dash'?20:kind==='special'?28:25)*(.48+peak);
  paintStroke(c,base,width*3.9,'rgba(201,77,21,.20)',fade*.64,19);
  paintStroke(c,base,width*1.7,color.amber,fade*.91,12);
  paintStroke(c,base,Math.max(2,width*.57),color.white,fade*.96,7);
  paintStroke(c,base,Math.max(1,width*.17),color.ivory,fade,2);
 }
 if(kind==='thrust'){
  for(let i=0;i<7;i++){
   let d=rnd(77,i),bend=(d-.5)*115,xx=-122+320*e+(i-3)*6;
   beam(c,-154,36+bend*.22,xx,36+bend+20*t,4+(i%2)*2);
  }
 }
 if(kind==='dash'){
  for(let i=0;i<9;i++){
   const yy=-70+i*30+(rnd(31,i)-.5)*25;
   const shift=260*e;
   paintStroke(c,[[-190,yy],[-40+shift*.55,yy+(i%3-1)*16],[120+shift,yy-4]],
    2.0+(i%3)*2,color.ivory,fade*.27,4);
  }
 }
 if(kind==='special'){
  // Charged spin: force points forward, not a centered equal-sided aura.
  for(let j=0;j<3;j++){
   const phase=(j/3+t*.46)*TAU;
   const r=54+60*e;
   const p=[[0,-145],[95+r*Math.cos(phase),-140+r*Math.sin(phase)],
    [178+90*e,35+r*Math.sin(phase+.7)]];
   paintStroke(c,p,10,color.gold,fade*.46,17);
  }
 }
 // Moving metal chips, tiny embers and rock debris spread only in the strike
 // direction. Their displaced centers advance from origin to the opponent.
 for(let j=0;j<(kind==='finisher'?48:36);j++){
  const r1=rnd(153+kind.length,j*3),r2=rnd(153+kind.length,j*3+1),r3=rnd(153+kind.length,j*3+2);
  const vx=70+400*r1*e*force,vy=(r2-.52)*230*e+(kind==='slash'?-60:kind==='sweep'?35:0);
  const x=coreX*.43+vx-60,y0=y+vy;
  const alpha=fade*(.45+.55*r3);
  if(j%3===0)beam(c,x-22*r1,y0+9,x+28+33*r2,y0+(r2-.5)*17,1.8+r3*2.5,.3);
  else shard(c,x,y0,1,.25*(r2-.5),2+r3*5,j%5===0?color.metal:color.coal,alpha);
 }
 groundDust(c,step,kind.length*37,coreX*.4,y+119,force);
 c.restore();
}
function shield(c,kind,frame){
 const t=frame/7,burst=clamp(Math.sin(Math.PI*(t+.13))*1.20,0,1),out=ease(t);
 c.save();c.translate(6,8);
 // The shield stands angled between defender (left) and enemy (right).
 const hand=[[8,-113],[49,-56],[46,52],[13,125]];
 const base=kind==='parry'?'rgba(222,242,255,.92)':'rgba(244,220,182,.80)';
 paintStroke(c,hand,27,'rgba(49,61,65,.29)',burst*.53,12);
 paintStroke(c,hand,14,base,burst*.89,8);
 paintStroke(c,hand,3,color.white,burst,4);
 if(kind==='parry'){
  const endX=50+190*out;
  beam(c,45,-22,endX+30,-125+130*t,14*burst,1.3);
  beam(c,53,-14,endX+100,22+50*t,7*burst,1.0);
  softGlow(c,49,-21,98+49*burst,'rgba(216,231,255,ALPHA)',burst*.43);
 }else{
  beam(c,45,-17,70+95*out,46+80*t,7*burst,1.0);
 }
 // Contact focus biased forward, fragments fly past the defender's shield.
 for(let j=0;j<(kind==='parry'?39:24);j++){
  const r=rnd(41+kind.length,j*4),s=rnd(41+kind.length,j*4+1),d=rnd(41+kind.length,j*4+2);
  const x=55+out*(65+240*r),y=-24+(s-.5)*220*out;
  if(j%3===0)beam(c,x-15,y,x+13+15*r,y+(s-.5)*19,2.2,.3);
  else shard(c,x,y,1,.7*(s-.5),2+d*4,j%4?color.gold:color.silver,burst*(.6+.4*d));
 }
 groundDust(c,frame,91,55,111,.65);
 c.restore();
}
function petal(c,x,y,a,size,colorStr,opacity=1){
 c.save();c.translate(x,y);c.rotate(a);c.globalAlpha=opacity;
 c.fillStyle=colorStr;c.beginPath();c.moveTo(0,-size);
 c.quadraticCurveTo(size*.7,0,0,size*1.4);
 c.quadraticCurveTo(-size*.6,0,0,-size);c.fill();
 c.strokeStyle='rgba(255,253,226,.46)';c.lineWidth=.6;
 c.beginPath();c.moveTo(0,-size*.8);c.lineTo(0,size*.8);c.stroke();c.restore();
}
function victory(c,frame){
 const t=frame/7,enter=clamp(t*2.2+.12),out=.22+.78*clamp((1-t)*2,0,1);
 const height=ease(clamp(t*1.7))*210;
 // The hero belongs at (0,0); the backlit source grows BEHIND to the right
 // rather than forming a symmetrical circle around the body.
 c.save();c.translate(0,-14);
 const centerX=-55+125*t,centerY=88-height*.44;
 const golden=c.createRadialGradient(centerX,centerY,5,centerX,centerY,210);
 golden.addColorStop(0,'rgba(255,248,206,'+(.44*enter*out).toFixed(3)+')');
 golden.addColorStop(.4,'rgba(253,194,104,'+(.24*enter*out).toFixed(3)+')');
 golden.addColorStop(1,'rgba(255,188,63,0)');
 c.fillStyle=golden;c.fillRect(-250,-230,550,500);
 // Incomplete laurel halo, opening toward the fighter's facing direction.
 c.save();c.translate(centerX,centerY);
 for(let j=0;j<4;j++){
  const radius=70+j*24;
  c.beginPath();c.ellipse(0,-10,radius,radius*.9,-.20,1.03*Math.PI,1.94*Math.PI);
  c.strokeStyle=j%2?'rgba(253,207,108,.30)':'rgba(255,245,190,.45)';
  c.lineWidth=2.4+j*.7;c.shadowColor='#ffd482';c.shadowBlur=16;
  c.globalAlpha=enter*out;c.stroke();
 }
 c.restore();
 for(let j=0;j<13;j++){
  const d=rnd(28,j),r=rnd(21,j);
  const x=-92+98*r,y=136-40*d;
  const tx=x+35+150*d*t,ty=y-(135+115*r)*enter;
  paintStroke(c,[[x,y],[x+20*r,y-20],[tx,ty]],
   1.6+2*r,'rgba(255,221,147,.84)',enter*out*(.3+.4*d),8);
 }
 // Gold laurel fragments and petal-shaped pollen drift UP and FORWARD.
 for(let j=0;j<47;j++){
  const d=rnd(62,j),r=rnd(63,j),s=rnd(64,j);
  const travel=220*t*(.45+d);
  const x=-116+travel+118*r;
  const y=171-(60+298*d)*ease(t)+(s-.5)*46;
  const a=3*t+r*4;
  petal(c,x,y,a,2+4*d,j%4===0?color.pink:j%3===0?color.ivory:color.leaf,enter*out*(.4+.55*r));
 }
 groundDust(c,frame,61,-95,162,.42);
 c.restore();
}
function frameFor(kind,idx){
 if(!MODELS[kind]||!root.document)return null;
 const key=kind+':'+idx;
 if(FRAME_STORE.has(key)){
  const item=FRAME_STORE.get(key);FRAME_STORE.delete(key);FRAME_STORE.set(key,item);return item;
 }
 const canvas=document.createElement('canvas');canvas.width=SIZE;canvas.height=SIZE;
 const c=canvas.getContext('2d',{alpha:true});if(!c)return null;
 c.translate(SIZE/2,SIZE/2);
 if(kind==='victory')victory(c,idx);
 else if(kind==='guard'||kind==='parry')shield(c,kind,idx);
 else strike(c,kind,idx);
 // At most ~39 * 480² RGBA pixel buffers in memory on low RAM phones.
 while(FRAME_STORE.size>=MAX_CACHE)FRAME_STORE.delete(FRAME_STORE.keys().next().value);
 FRAME_STORE.set(key,canvas);
 return canvas;
}
function draw(ctx,kind,x,y,w,h,progress=0,alpha=1,face=1,rotation=0,slot='all'){
 if(!ctx||!MODELS[kind])return false;
 const reduced=root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const frame=Math.min(7,Math.floor(clamp(reduced?.48:progress,0,.9999)*8));
 const atlas=frameFor(kind,frame);
 if(!atlas)return false;
 ctx.save();ctx.translate(x,y);ctx.rotate(rotation);
 if(face<0)ctx.scale(-1,1);
 ctx.globalAlpha=clamp(alpha);
 if(kind==='victory'&&slot!=='all'){
  // Behind = halo, around = petals; both display on opposite sides of the
  // actual fighter WITHOUT painting over the original character pixels.
  if(slot==='back'){ctx.globalAlpha*=.72;ctx.globalCompositeOperation='screen';}
  if(slot==='front'){ctx.globalAlpha*=.28;ctx.globalCompositeOperation='screen';}
 }
 ctx.drawImage(atlas,-w/2,-h/2,w,h);
 ctx.restore();
 return true;
}
function available(kind){return !!MODELS[kind]&&typeof document!=='undefined';}
function inspect(kind,index){
 const idx=clamp(Math.floor(index),0,7),canvas=frameFor(kind,idx);
 return canvas?{kind,index:idx,frames:8,width:SIZE,height:SIZE,alpha:true,canvas}:null;
}
root.ArenaDirectionalFX=Object.freeze({
 version:'1.0.0',FAMILIES:MODELS,frames:8,specs:()=>MODELS,
 draw,available,inspect,cacheSize:()=>FRAME_STORE.size,
 frameIndex:(kind,progress)=>MODELS[kind]?Math.min(7,Math.floor(clamp(progress,0,.9999)*8)):-1
});
})(globalThis);
