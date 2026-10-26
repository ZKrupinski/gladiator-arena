/* SPARTACUS · Shared combat readability signals v110.
 * Non-interfering canvas HUD: faction-coloured matchup arrows and live XP
 * level milestone ceremony. All anchor coordinates are scene-projected.
 */
(function(root,factory){'use strict';
 const api=factory(root);
 root.ArenaCombatSignals=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis,function(root){'use strict';
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 const xpNeeded=level=>36+Math.max(1,Math.floor(level))*19;
 const cap=()=>root.ArenaProgression?.LEVEL_CAP||50;
 const matchup=(unit,target)=>{
  if(!unit||!target||unit.dead||target.dead||unit.hp<=0||target.hp<=0)return 1;
  return root.ArenaMatchup?.multiplier?.(unit,target)??1;
 };
 const advantage=(unit,target)=>matchup(unit,target)>1.001;
 const tint=unit=>unit?.side==='enemy'||unit?.enemy===true?
  {main:'#ff575b',edge:'#6e0d20',glow:'#ff2934'}:
  {main:'#74ffe4',edge:'#0a5c5b',glow:'#1df5b6'};
 function drawAdvantage(ctx,unit,target,{x=0,y=0,time=0,size=20}={}){
  if(!ctx||!advantage(unit,target))return false;
  const colors=tint(unit),pulse=1+.07*Math.sin(time*5),s=clamp(size,11,33)*pulse;
  ctx.save();ctx.translate(x,y-3*Math.sin(time*3));ctx.scale(s/20,s/20);
  ctx.shadowColor=colors.glow;ctx.shadowBlur=12;
  ctx.fillStyle=colors.main;ctx.strokeStyle=colors.edge;ctx.lineWidth=2.8;
  ctx.beginPath();
  ctx.moveTo(0,-15);ctx.lineTo(14,0);ctx.lineTo(6,0);
  ctx.lineTo(6,13);ctx.lineTo(-6,13);ctx.lineTo(-6,0);
  ctx.lineTo(-14,0);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.restore();return true;
 }
 // Read-only preview of the persisted 50-level rule. The actual save
 // still runs through grantCareerXp() exactly once at settlement.
 function previewLevel(startLevel=1,startingXp=0,gained=0){
  let level=clamp(Math.floor(Number(startLevel)||1),1,cap());
  let xp=Math.max(0,Math.floor(Number(startingXp)||0))+
   Math.max(0,Math.floor(Number(gained)||0));
  while(level<cap()&&xp>=xpNeeded(level)){xp-=xpNeeded(level);level++;}
  if(level>=cap())xp=0;
  return {level,xp};
 }
 function levelUp(unit,from,to,now=0){
  if(!unit||!(to>from))return false;
  unit._levelFx={from,to,at:now,duration:2.25};
  return true;
 }
 function drawLevelUp(ctx,unit,{x=0,y=0,time=0,scale=1}={}){
  const fx=unit?._levelFx;
  if(!fx||!ctx)return false;
  const p=(time-fx.at)/fx.duration;
  if(p<0||p>=1){if(p>=1)unit._levelFx=null;return false;}
  const a=clamp((fx.duration*(1-p))/.38,0,1)*clamp(p/.13,0,1);
  const z=clamp(scale,.55,1.45),r=(25+p*48)*z;
  ctx.save();ctx.globalAlpha*=a;
  ctx.translate(x,y);ctx.shadowColor='#ffe27a';ctx.shadowBlur=20;
  const grd=ctx.createRadialGradient(0,0,0,0,0,100*z);
  grd.addColorStop(0,'#fff4b92c');grd.addColorStop(.65,'#e7be4024');grd.addColorStop(1,'#e7be4000');
  ctx.fillStyle=grd;ctx.beginPath();ctx.arc(0,0,100*z,0,Math.PI*2);ctx.fill();
  ctx.lineWidth=3*z;ctx.strokeStyle='#fff1b1';ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
  const count=8;
  for(let i=0;i<count;i++){const theta=i*Math.PI*2/count+p*.8;
   const distance=(28+50*p)*z,rx=Math.cos(theta)*distance,ry=Math.sin(theta)*distance;
   ctx.fillStyle=i%2?'#ffcc54':'#fff5cb';ctx.beginPath();ctx.arc(rx,ry,(2.5+1.5*(1-p))*z,0,Math.PI*2);ctx.fill();}
  const lineY=-(43+13*p)*z;
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
  ctx.font='900 '+Math.round(23*z)+'px system-ui,sans-serif';
  ctx.strokeStyle='#422007';ctx.lineWidth=5*z;ctx.fillStyle='#fff3ad';
  ctx.strokeText('LEVEL UP!',0,lineY);ctx.fillText('LEVEL UP!',0,lineY);
  ctx.font='900 '+Math.round(15*z)+'px system-ui,sans-serif';
  const caption='Lv.'+fx.from+' → Lv.'+fx.to;
  ctx.strokeText(caption,0,lineY+24*z);ctx.fillText(caption,0,lineY+24*z);
  ctx.restore();return true;
 }
 return {version:'1.0.0',matchup,advantage,tint,drawAdvantage,previewLevel,levelUp,drawLevelUp,xpNeeded};
});
