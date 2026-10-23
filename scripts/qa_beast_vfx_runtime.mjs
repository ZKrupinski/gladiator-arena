/* Strict, headless-independent test for the eight shared beast art families. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../public');
const js=fs.readFileSync(path.join(root,'arena-beast-vfx.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const beast=fs.readFileSync(path.join(root,'arena-beasts.js'),'utf8');
assert.ok(html.includes('arena-beast-vfx.js?v=2-upper-strike'));
assert.ok(html.includes("if(f.beastType&&f.action==='attack')return 'attack'"));
assert.ok(html.includes("beastFx:kind"));
assert.ok(html.includes("beastFx:'collapse'"));
assert.ok(beast.includes("f.action==='special'&&f.actionT>0?'attack4':'roar'"));
// Regression: switching tabs or taking screenshots must NOT leave an
// unrequested "PUGNA SUSPENSA" overlay on the live fight.
const pauseStart=html.indexOf('function suspendBattle(){');
const pauseEnd=html.indexOf('\n}',pauseStart);
assert.ok(pauseStart>0&&pauseEnd>pauseStart);
const pauseSource=html.slice(pauseStart,pauseEnd+2);
for(const initiallyPaused of [false,true]){
 const S={phase:'fight',paused:initiallyPaused,keys:new Set(['left']),
   autoPlaying:true,lastManualInput:0};
 const sandbox={S,clock:45,togglePause(){throw Error('FOCUS_MUST_NOT_TOGGLE_PAUSE')}};
 vm.runInNewContext(pauseSource+';suspendBattle();',sandbox);
 assert.equal(S.paused,initiallyPaused);
 assert.equal(S.keys.size,0);
}
// Anatomical world-space anchors must not regress to oversized actor-centered FX.
assert.ok(html.includes("const frontX=attacker.x+dir*clamp(foeGap-50,167,270)"));
assert.ok(html.includes("const contactY=attacker.beastType==='wolf' ? FLOOR-82 : FLOOR-(ground?252:bite?288:276)"));
assert.ok(html.includes("flightX:dir*(ground?92:65),flightY:ground?-78:-96"));
assert.ok(html.includes("rotation:dir>0?-.20:.20"));
assert.ok(html.includes("flip:beastFxFlip(attacker),layer:'front'"));
assert.ok(html.includes("flip:beastFxFlip(loser),alpha:.9,layer:'back'"));
assert.ok(html.includes("flip:beastFxFlip(victim),alpha:.82,duration:.25"));
assert.ok(html.includes("flip:beastFxFlip(beast),layer:'back',alpha:.7"));
// Actual runtime regression: mirror only the wolf strike art, not its spawn.
{
 const start=html.indexOf('function beastFxFlip(');
 const end=html.indexOf('\nfunction ',html.indexOf('function emitAttackFx(')+1);
 assert.ok(start>=0&&end>start,'combat attack FX function exists');
 const emitted=[];
 const runtime={window:{ArenaBeastFX:{ensure(){}}},FLOOR:600,
  clamp:(v,min,max)=>Math.max(min,Math.min(max,v)),
  addFx:(frame,x,y,opt)=>emitted.push({frame,x,y,opt})};
 vm.runInNewContext(html.slice(start,end),runtime);
 for(const dir of [-1,1]){
  const victim={x:400+dir*220,face:-dir};
  const wolf={beastType:'wolf',x:400,face:dir};
  const lion={beastType:'lion',x:400,face:dir};
  assert.equal(runtime.beastFxFlip(wolf),dir<0);
  assert.equal(runtime.beastFxFlip(lion),dir>0);
  const floor=runtime.beastGroundFx(wolf,400,550,400,172);
  assert.equal(floor.x,400);
  assert.equal(floor.y,550,'wolf ground effect aligns to shared arena floor');
  assert.equal(floor.w,360);
  assert.ok(Math.abs(floor.h-154.8)<1e-9);
  const unchanged=runtime.beastGroundFx(lion,400,550,400,172);
  assert.equal(unchanged.y,550);
  assert.equal(unchanged.w,400);
  emitted.length=0;runtime.emitAttackFx(wolf,victim);
  const wolfAttack=emitted.find(v=>v.opt.beastFx==='claw');
  assert.equal(wolfAttack?.opt.flip,dir<0,'wolf attack sprite must be mirrored');
  assert.equal(wolfAttack?.x,400+dir*170);
  assert.equal(wolfAttack?.y,600-82,
   'wolf attack near gladiator foot line');
  for(const [variant,kind] of [[0,'claw'],[1,'sweep'],[2,'bite']]){
   emitted.length=0;runtime.emitAttackFx(wolf,victim,false,false,false,variant);
   const fx=emitted.find(v=>v.opt.beastFx===kind);
   assert.equal(fx?.y,600-82,kind+' grounded wolf strike');
   assert.equal(fx?.x,400+dir*170,kind+' original enemy-facing X');
   assert.equal(fx?.opt.flip,dir<0,kind+' prior directional mirroring');
  }
  emitted.length=0;runtime.emitAttackFx(wolf,victim,true);
  const pounce=emitted.find(v=>v.opt.beastFx==='pounce');
  assert.equal(pounce?.y,600-82,'wolf pounce grounded');
  assert.equal(pounce?.opt.flightY,-78,'pounce upward movement preserved');
  assert.equal(pounce?.opt.flip,dir<0,'pounce orientation preserved');
  emitted.length=0;runtime.emitAttackFx(wolf,victim,false,true);
  assert.equal(emitted.find(v=>v.opt.beastFx==='hit')?.y,600-82,
   'guarded wolf impact grounded');
  assert.equal(wolfAttack?.opt.flightX,dir*65);
  assert.equal(wolfAttack?.opt.flightY,-96);
  emitted.length=0;runtime.emitAttackFx(lion,victim);
  const lionAttack=emitted.find(v=>v.opt.beastFx==='claw');
  assert.equal(lionAttack?.opt.flip,dir>0,'other beasts keep prior facing');
  assert.equal(lionAttack?.x,wolfAttack.x,'same spawn as before');
  assert.equal(lionAttack?.y,600-276,'other beasts retain upper body attacks');
  emitted.length=0;runtime.emitAttackFx(lion,victim,false,false,false,2);
  assert.equal(emitted.find(v=>v.opt.beastFx==='bite')?.y,600-288,'lion bite unchanged');
  emitted.length=0;runtime.emitAttackFx(lion,victim,true);
  assert.equal(emitted.find(v=>v.opt.beastFx==='pounce')?.y,600-252,'lion pounce unchanged');
 }
}

assert.ok(html.includes("cx+(v.flightX||0)*rise,cy+(v.flightY||0)*rise"));
assert.ok(html.includes("beastFx:kind,w:(ground?730:bite?560:650)*size"));
assert.ok(html.includes("const stomp=beastGroundFx(attacker,footX,FLOOR-49,750*size,318*size)"));
assert.ok(html.includes("const gaitFrame=Math.floor(clock*7)%8"));
assert.ok(html.includes("gaitFrame===1||gaitFrame===5"));
assert.ok(html.includes("beastFx:'step',w:step.w,h:step.h"));
assert.ok(html.includes("flip:beastFxFlip(beast),layer:'back'"));
assert.ok(html.includes("const p=beastGroundFx(f,f.x+f.face*75,FLOOR-46,560,250)"),'beast dodge keeps its world-grounded step effect');
assert.ok(html.includes("flip:beastFxFlip(f),alpha:.76"));
assert.ok(beast.includes("if(wolfV3.normalized){"),'clean sheet must avoid adaptive size hopping');
assert.ok(beast.includes("return drawWolfPending(ctx,{x,y,w,h,flip,alpha})"),
 'first appearance cannot show the mixed-frame legacy atlas');
assert.ok(beast.includes("wolfV3.loadingStill=image"),'approved idle pose must show while streaming');
assert.ok(beast.includes("ground-(470-footAdjust)*scale"),'all planted paws share one ground line');
assert.ok(beast.includes("walkBox?.walkOffset"),'walk torso drift should be compensated');
assert.ok(beast.includes("actionMetrics?.[index]?.edgeCut"),'corrupt seams must not draw');
assert.ok(beast.includes("act==='walk'?7:8"),'walk animation must not plow at 11fps');
assert.ok(html.includes("requestAnimationFrame(loop);\n if(!t0)t0=t;"),
  'next frame must already be scheduled before optional visual Canvas calls');
assert.ok(html.includes("console.error('ARENA_RENDER_RECOVERED'"),
  'render faults must no longer stop combat updates');
assert.ok(html.includes("f.centerX,f.shade,f.bloom,f.cinemaBars,f.elapsed,f.duration"),
  'invalid cinematic gradients must be skipped before reaching Canvas');
assert.ok(html.includes("S.cinematic=null;S.focusFrame=null;"),
  'manual resume must discard interrupted hitstop');
assert.ok(html.includes("if(f.beastType&&f.actionT<=0&&f.stagger<=0&&!f.comboDash&&"),
  'expired beast attack state must recover independently of any VFX');
assert.ok(html.includes("layer:'front'"),
  'beast attacks require foreground layers');
const kinds=['claw','sweep','bite','pounce','hit','step','roar','collapse'];
let urls=[];
function mock({fail=false,odd=false}={}){
 const requests=[];
 class Img{
  set src(value){
   urls.push(value);
   this.naturalWidth=odd?65:1776;
   this.naturalHeight=888;
   Promise.resolve().then(()=>this.onload?.());
  }
 }
 const ctx={
  window:{},Image:Img,
  fetch:async (u,opts)=>{
   requests.push({u,opts});
   if(u==='uploader-release.json')return {ok:true,json:async()=>({
      releaseProtocol:'spartacus-uploader-v1',releaseId:'beast-vfx-test-v1',
      assetSha256:{'public/assets/beasts/effects-v1/manifest.json':'a'.repeat(64)}
    })};
   if(fail)return {ok:false};
   return {ok:true,json:async()=>({version:1,grid:[4,2],frames:8,
     families:Object.fromEntries(kinds.map(k=>[k,k+'.webp']))})};
  },
  Promise,Error,Math,Map,Set,Number,Object,String,RegExp
 };
 vm.runInNewContext(js,ctx);
 return {api:ctx.window.ArenaBeastFX,requests};
}
{
 const {api,requests}=mock();
 assert.deepEqual([...api.types],kinds);
 api.ensure();
 for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r));
 const status=api.status();
 assert.equal(status.state,'ready',status.error);
 assert.equal(status.ready.length,8);
 assert.ok(requests.some(x=>x.u==='uploader-release.json'&&x.opts.cache==='no-store'));
 assert.equal(api.frameFor('claw',.9999),7);
 assert.equal(api.frameFor('claw',.12),0);
 assert.equal(api.frameFor('claw',.55),4);
 let calls=[],ops=[];
 const drawCtx={
  globalAlpha:1,
  save(){ops.push('save')},restore(){ops.push('restore')},
  translate(x,y){ops.push(['translate',x,y])},
  rotate(r){ops.push(['rotate',r])},
  scale(x,y){ops.push(['scale',x,y])},
  drawImage(...args){calls.push(args)}
 };
 assert.equal(api.draw(drawCtx,'bite',100,80,450,400,.62,.8,-1,-.20),true);
 assert.ok(ops.some(x=>Array.isArray(x)&&x[0]==='rotate'&&x[1]===-.20));
 assert.equal(calls.length,1);
 assert.equal(calls[0].length,9);
 assert.equal(calls[0][1],0); // index 4: first column, second row
 assert.equal(calls[0][2],444);
 assert.ok(ops.some(x=>Array.isArray(x)&&x[0]==='scale'&&x[1]===-1));
 assert.equal(api.draw(drawCtx,'sword',100,80,50,50),false);
}
{
 const {api}=mock({fail:true});api.ensure();
 for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r));
 assert.equal(api.status().state,'unavailable');
}
{
 const {api}=mock({odd:true});api.ensure();
 for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r));
 assert.equal(api.status().state,'unavailable');
 assert.match(api.status().error,/INVALID_4x2_EFFECT_ATLAS/);
}
console.log('BEAST_EIGHT_ACTION_VFX_RUNTIME_AND_SAFE_FALLBACK_PASS');
