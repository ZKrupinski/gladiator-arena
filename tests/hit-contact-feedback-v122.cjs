'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../public/arena-motion.js'),feel=require('../public/arena-combat-feel.js');
const actor=()=>({hp:100,dead:false,x:400,y:640,face:1,action:'idle'});
for(const type of ['murmillo','retiarius','thraex','wolf','leopard','lion','tiger','elephant']){
 for(const hz of [30,60,120]){
  const f={...actor(),cls:type};const world=[f.x,f.y];
  assert.equal(M.visual(f).flash,0);assert.deepEqual(M.hitOffset(f),{x:0,y:0});
  M.impact(f,'strike');assert(M.visual(f).flash>=.85,'bright white silhouette starts on contact');assert(M.hitOffset(f).x>=15,'body recoil starts on the same contact frame');
  const offsets=[];let flashes=0;
  for(let i=0;i<=Math.ceil(hz*.30);i++){
   const v=M.visual(f),j=M.hitOffset(f);if(v.flash>.02)flashes++;
   assert(v.flash<=.99);assert(Math.abs(j.x)<=19&&Math.abs(j.y)<=2.2);
   offsets.push(j.x);M.advance(f,0,1/hz);
  }
  assert(flashes>=Math.floor(hz*.15),`${type} ${hz}Hz flash persists across multiple distinct rendered frames`);
  assert(offsets.some(x=>x<0)&&offsets.some(x=>x>0),'body vibrates both ways');
  assert.deepEqual(M.hitOffset(f),{x:0,y:0});assert.equal(M.visual(f).flash,0);
  assert.deepEqual([f.x,f.y],world,'render feedback never mutates gameplay position');
 }
}
const f=actor();M.impact(f,'special');M.advance(f,0,.03);M.impact(f,'strike');
assert.equal(f.hitVisual.t,0,'another real hit restarts the contact cue');
for(const disabled of [[true,true],[false,false]]){
 assert.equal(M.visual(f,...disabled).flash,0);assert.deepEqual(M.hitOffset(f,...disabled),{x:0,y:0});
}
f.dead=true;assert.equal(M.visual(f).flash,0);assert.deepEqual(M.hitOffset(f),{x:0,y:0});
M.advance(f,0,.01);assert.equal(f.hitVisual,null);
const source=actor(),target=actor(),state={fx:true};
feel.event(state,'dash',source,target,0);
assert(!target.hitVisual,'attack preparation is not a hit');
feel.event(state,'hit',source,target,.2,{contact:true});
assert(target.hitVisual&&M.visual(target).flash>0);assert(M.hitOffset(target).x!==0);
const before=target.hitVisual.t;feel.advance(state,[target],.04,{paused:true});assert.equal(target.hitVisual.t,before);
feel.advance(state,[target],.04);assert.equal(target.hitVisual.t,.04);
// Match the atlas behavior that assigns alpha internally, instead of multiplying it.
const ctx={filter:'none',globalAlpha:1,save(){this.saved=[this.filter,this.globalAlpha]},restore(){[this.filter,this.globalAlpha]=this.saved}};
let drawn;M.drawHitFlash(ctx,.86,alpha=>{ctx.globalAlpha=alpha;drawn={filter:ctx.filter,alpha:ctx.globalAlpha}});
assert.deepEqual(drawn,{filter:'brightness(0) invert(1)',alpha:.86});
assert.equal(ctx.globalAlpha,1);assert.equal(ctx.filter,'none');
// Exercise the real 5v5 event dispatch slice: both simultaneous victims flash,
// even while the camera's shared impact cooldown suppresses another impulse.
const code=fs.readFileSync('public/arena-coop.js','utf8');
const start=code.indexOf('for(const e of events){state.eventId=e.id;state.fx.push(e);');
const end=code.indexOf("    if(['link','cover'",start);assert(start>0&&end>start);
const a=actor(),b=actor(),c=actor();a.id='a';b.id='b';c.id='c';
const sim={units:[a,b,c],time:10},teamState={fx:[],eventId:0,nextImpactAt:11};
vm.runInNewContext(code.slice(start,end)+'}',{state:teamState,sim,events:[
 {id:1,type:'hit',source:'a',target:'b',damage:4},
 {id:2,type:'assist',source:'a',target:'c',damage:3},
 {id:3,type:'dash',source:'a',target:'a'}],root:{ArenaMotion:M,ArenaCombatFeel:feel}});
assert(b.hitVisual&&c.hitVisual);assert(!a.hitVisual,'dash event cannot flash an unhit unit');
assert(M.visual(b).flash>=.85&&M.visual(c).flash>=.85,'both simultaneous 5v5 victims get bright silhouettes');
for(const kind of ['guard','strike','special','dash','parry','reversal']){
 const h=actor();M.impact(h,kind);
 assert(M.visual(h).flash>.60,'all impact kinds including blocked contacts are legible: '+kind);
 assert(M.hitOffset(h).x>=12,'body vibration remains distinct: '+kind);
 M.advance(h,0,.11);assert(M.visual(h).flash>.20,'flash persists beyond 100ms: '+kind);
}
console.log('PASS v124: prominent white silhouette 0.235s, local 15Hz recoil 0.25s, eight types x 30/60/120Hz, multi-target 5v5, KO/reduced-motion guards');
