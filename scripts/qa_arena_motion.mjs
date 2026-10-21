// Deterministic bouncy-combat v1 unit tests, not an aesthetic screenshot guess.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context={globalThis:{}};
vm.runInNewContext(fs.readFileSync(new URL('../public/arena-motion.js',import.meta.url),'utf8'),context);
const M=context.globalThis.ArenaMotion;
assert.equal(M.version,'1.2.0');
const actor=(enemy=false)=>({
 enemy,dead:false,face:enemy?-1:1,
 x:enemy?700:480,vx:0,walkT:0,action:'idle',actionT:0,
 actionDuration:0,stagger:0,dodge:0,guard:false,bodySpring:null
});
const almost=(a,b,tol=.00001)=>Math.abs(a-b)<tol;
const p=actor();
const idle=M.pose(p,1.4);
assert.ok(idle.sy>.985&&idle.sy<1.015,'standing breaths are subtle');
assert.ok(idle.y===0,'idle may not lift boots');
p.vx=235;p.walkT=.1;
const walk=M.pose(p,1.4);
assert.ok(walk.y>=-5.6&&walk.y<=0,'stepping has no big bouncing camera-agnostic lift');
assert.ok(Math.abs(walk.x)<=3,'walk never teleports the pivot');
p.vx=0;p.action='attack';p.actionDuration=.35;p.actionT=.17;
const strike=M.pose(p,1.4);
assert.ok(strike.x>idle.x+2,'sword pose pushes forward');
assert.equal(strike.sx,1,'strike preserves body width');
assert.equal(strike.sy,1,'strike preserves body height');
p.actionT=0;p.action='idle';
for(const type of Object.keys(M.RESPONSE)){
 const a=actor(),b=actor(true);
 M.pulse(a,type,'source',1);M.pulse(b,type,'target',1);
 const hit=M.pose(b,0);
 assert.equal(hit.sx,1,type+' contact preserves source width');
 assert.equal(hit.sy,1,type+' contact preserves source height');
 assert.ok(hit.y>=-11&&hit.x>=-28, 'world-space pivot never leaps off-floor');
 M.advance(b,.09);
 const rebound=M.pose(b,0);
 assert.ok(rebound.x!==hit.x||rebound.y!==hit.y||rebound.tilt!==hit.tilt,type+' has secondary recoil');
 for(let i=0;i<20;i++)M.advance(b,.04);
 assert.equal(b.bodySpring,null,type+' must terminate so it cannot wobble forever');
}
const immobile=actor();
M.pulse(immobile,'special','target',1);
assert.equal(JSON.stringify(M.pose(immobile,1,true)),JSON.stringify({x:0,y:0,sx:1,sy:1,tilt:0}),'reduced motion leaves sprites fixed');
for(const [type,preset] of Object.entries(M.PRESETS)){
 const s={fx:true};
 M.shake(s,type,-1);
 assert.equal(s.cameraKick.kind,type);
 let peak=0,x=0,y=0;
 for(let i=0;i<10;i++){
  M.advanceShake(s,.012);
  const offset=M.sampleShake(s);
  peak=Math.max(peak,Math.abs(offset.x)+Math.abs(offset.y));
  x+=Math.abs(offset.x);y+=Math.abs(offset.y);
 }
 assert.ok(peak>.08,'camera shake must be visible on connected hits');
 if(type==='special')assert.ok(y>x*.8,'heavy impact emphasizes vertical motion');
 if(type==='guard')assert.ok(x>y,'guard favors horizontal response');
 assert.deepEqual(JSON.parse(JSON.stringify(M.sampleShake(s,true))),{x:0,y:0,angle:0},'reduced motion disables shake');
 s.fx=false;
 assert.equal(M.sampleShake(s).x,0,'FX disabled stops shaking');
 for(let i=0;i<30;i++)M.advanceShake(s,.04);
 assert.equal(s.cameraKick,null,'camera kick returns to zero');
}
// Identical global feedback for all three gladiator classes and every beast.
for(const cls of ['murmillo','retiarius','thraex','wolf','lion','tiger','elephant']){
 const f={...actor(),cls,beastType:['wolf','lion','tiger','elephant'].includes(cls)?cls:null};
 for(const kind of ['strike','guard','special','dash','parry','reversal']){
  M.impact(f,kind);
  assert.ok(M.visual(f).flash>.07&&M.visual(f).flash<=.29,cls+' '+kind+' short transparent glint');
  assert.equal(M.visual(f).scale,1,'the planted-foot pivot starts at original scale');
  M.advance(f,.025,.085);
  const v=M.visual(f);
  assert.ok(v.scale>.94&&v.scale<1.13,'uniform impact scale bounded');
  assert.ok(v.flash>0,'flash survives into contact frame');
  assert.deepEqual(JSON.parse(JSON.stringify(M.visual(f,true))),{scale:1,flash:0});
  assert.deepEqual(JSON.parse(JSON.stringify(M.visual(f,false,false))),{scale:1,flash:0});
  for(let i=0;i<16;i++)M.advance(f,.05,.05);
  assert.equal(f.hitVisual,null,'impact restores full original size');
  assert.deepEqual(JSON.parse(JSON.stringify(M.visual(f))),{scale:1,flash:0});
 }
}
assert.ok(M.PRESETS.strike.amp>=14);
assert.ok(M.PRESETS.special.amp>=23);
assert.ok(M.PRESETS.reversal.amp>=34);
// Ultra-short blinking flash ends BEFORE the longer body scale recovery.
for(const kind of ['strike','guard','special','dash','parry','reversal']){
 const f=actor();f.hp=99;
 M.impact(f,kind);
 const first=M.visual(f).flash;
 assert.ok(first>.07&&first<=.29,kind+' initial flash partially transparent');
 M.advance(f,0,.040);
 assert.equal(M.visual(f).flash,0,kind+' dark gap after first blink');
 M.advance(f,0,.027);
 assert.ok(M.visual(f).flash>0,kind+' second, dimmer blink');
 M.advance(f,0,.036);
 assert.equal(M.visual(f).flash,0,kind+' off permanently after 103ms');
 // Death frame must not inherit hit white even before the animation resumes.
 f.dead=true;
 assert.deepEqual(JSON.parse(JSON.stringify(M.visual(f))),{scale:1,flash:0});
 f.dead=false;f.action='death';
 assert.deepEqual(JSON.parse(JSON.stringify(M.visual(f))),{scale:1,flash:0});
 f.action='idle';f.hp=0;
 assert.deepEqual(JSON.parse(JSON.stringify(M.visual(f))),{scale:1,flash:0});
 M.impact(f,kind);
 assert.equal(f.hitVisual?.t,.103,'KO never restarts flash');
}
const clashA=actor(),clashB=actor(true);
clashA.x=500;clashB.x=685;clashA.vx=210;clashB.vx=-90;
assert.equal(M.contactPulse(clashA,clashB,200),true,'approach collision produces body recoil');
assert.ok(clashA.bodySpring&&clashB.bodySpring,'both bodies respond to impact');
assert.equal(M.contactPulse(clashA,clashB,200),false,'no per-frame vibration spam');
clashA.contactCooldown=0;clashB.contactCooldown=0;
clashA.vx=0;clashB.vx=0;
assert.equal(M.contactPulse(clashA,clashB,200),false,'idle near-stationary contact is silent');
console.log('PASS: all base poses, anchored feet, spring rebound, strengthened directional shakes and universal hit flash, accessibility, cooldown.');
