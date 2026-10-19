// Browser verification of 8 high-quality painted sprite sequences. Includes
// transparent alpha, 12–16 distinct frames, and in-game event wiring.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
const p=await browser.newPage({viewport:{width:1280,height:960},deviceScaleFactor:1});
p.on('pageerror',e=>errors.push(String(e)));
try{
 await p.goto('http://127.0.0.1:8765/vfx-gallery.html?__arena_qa=1',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>{
  const f=window.ArenaAnimatedFX;
  return !!f&&Object.keys(f.FAMILIES).length===8&&
   ['slash','thrust','parry','dash','special'].every(k=>f.available(k));
 },{timeout:20000});
 await p.waitForTimeout(200);
 const frames=await p.evaluate(()=>{
  const fx=window.ArenaAnimatedFX,info=fx.specs();
  const result={};
  for(const [name,meta] of Object.entries(info)){
   const samples=[];
   for(const progress of [.1,.38,.67,.86]){
    const frame=fx.inspect(name,progress);
    if(!frame){samples.push(null);continue;}
    const cvs=frame.canvas,ctx=cvs.getContext('2d',{willReadFrequently:true});
    const pix=ctx.getImageData(0,0,cvs.width,cvs.height).data;
    let checksum=0,opaque=0,bright=0;
    for(let i=0;i<pix.length;i+=32){
     if(pix[i+3]>8){opaque++;bright+=pix[i]+pix[i+1]+pix[i+2];
      checksum=(Math.imul(checksum,31)+pix[i]+(pix[i+1]<<1)+(pix[i+3]<<2))>>>0;}
    }
    samples.push({index:frame.index,opaque,checksum,bright,
      corner:pix[3],width:cvs.width,height:cvs.height});
   }
   result[name]={frames:meta.frames,duration:meta.duration,
     width:meta.width,height:meta.height,
     samples,unique:new Set(samples.map(x=>x?.checksum)).size};
  }
  return {result,cache:fx.cacheSize()};
 });
 assert.equal(Object.keys(frames.result).length,8);
 assert.equal(await p.locator('.card').count(),8,'all effect types appear in preview');
 let total=0;
 for(const [name,info] of Object.entries(frames.result)){
  assert.ok(info.frames>=12,name+' must contain at least 12 frames');
  total+=info.frames;
  assert.equal(info.samples.length,4);
  if(['slash','sweep','thrust','guard','parry','dash','special','finisher'].includes(name)){
   assert.equal(info.width,362,'authored sword-light atlas has stable source cell width');
   assert.equal(info.height,362,'authored sword-light atlas has stable source cell height');
   assert.ok(info.samples[1].opaque>200,'sword trail requires bright painted pixels');
  }
  for(const frame of info.samples){
   assert.ok(frame?.opaque>15,name+' raster paint is not empty');
   assert.equal(frame.width,info.width,name+' frame dimensions are stable');
   assert.equal(frame.height,info.height,name+' all frames aligned to a fixed cell');
   assert.ok(frame.corner<20,name+' canvas corners must remain alpha transparent');
  }
  assert.ok(info.unique>=3,name+' frame art must actually change');
 }
 assert.equal(total,96,'8 separately illustrated families each have 12 full animation frames');
 const refs=await p.evaluate(()=>{
  const fx=window.ArenaAnimatedFX;
  return {v:fx.version,
    basic:['slash','sweep','thrust'].map(key=>({
       key,source:fx.FAMILIES[key].source,frames:fx.FAMILIES[key].frames,
       drawn:[.05,.2,.38,.55,.74,.91].map(t=>fx.inspect(key,t)?.index)
    }))};
 });
 assert.equal(refs.v,'3.0.0','fully distinctive sprite-based VFX v3 must load');
 assert.deepEqual(refs.basic.map(x=>x.source),['slash_trail','sweep_trail','thrust_trail']);
 for(const ref of refs.basic){
  assert.equal(ref.frames,12);
  assert.equal(new Set(ref.drawn).size,6,'frame cursor advances through new source atlas');
 }
 console.log('AUTHORED_SWORD_TRAILS_PASS '+JSON.stringify(refs));
 const diverse=await p.evaluate(()=>{
  const engine=window.ArenaAnimatedFX;
  return ['guard','parry','finisher','dash','special'].map(kind=>{
   const meta=engine.FAMILIES[kind],frame=engine.inspect(kind,.38);
   const ctx=frame.canvas.getContext('2d',{willReadFrequently:true});
   const pixel=ctx.getImageData(0,0,frame.width,frame.height).data;
   let signature=0,coverage=0;
   for(let i=0;i<pixel.length;i+=12){
    if(pixel[i+3]>30){coverage++;signature=(Math.imul(signature,33)+pixel[i]+(pixel[i+1]<<1)+pixel[i+3])>>>0}
   }
   return {kind,source:meta.source,n:meta.frames,signature,coverage};
  });
 });
 const expected=['guard_painted','parry_painted','finisher_painted','dash_painted','special_painted'];
 assert.deepEqual(diverse.map(x=>x.source),expected,'each move has an exclusive painted source');
 assert.equal(new Set(diverse.map(x=>x.signature)).size,5,'five sprites have different visual signatures');
 assert.ok(diverse.every(x=>x.n===12&&x.coverage>40));
 console.log('DIVERSE_FIVE_VFX_PASS '+JSON.stringify(diverse));

 console.log('PAINTED_VFX_FRAMES_PASS '+JSON.stringify({families:8,totalFrames:total,
  types:Object.fromEntries(Object.entries(frames.result).map(([k,v])=>[k,{frames:v.frames,unique:v.unique,paint:v.samples[1].opaque}])),
  cache:frames.cache}));
 if(process.env.VFX_GALLERY_PREVIEW==='1'){
  await p.evaluate(()=>{
   window.__arenaVfxGalleryQA.seek(.34);
   window.__arenaVfxGalleryQA.pause(true);
  });
  await p.waitForTimeout(90);
  const jpeg=await p.screenshot({type:'jpeg',quality:68});
  console.log('PAINTED_VFX_GALLERY_JPEG:'+jpeg.toString('base64'));
 }
 // A real exported PNG must exist, not just a decorative gallery control.
 const downloaded=p.waitForEvent('download',{timeout:20000});
 await p.locator('.card button').first().click();
 const exportResult=await downloaded;
 assert.equal(exportResult.suggestedFilename(),'gladiator-vfx-slash-12f.png');
 console.log('PAINTED_VFX_EXPORT_PASS '+exportResult.suggestedFilename());
 await p.goto('http://127.0.0.1:8765/?__arena_qa=1',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>!!window.__arenaQA&&!!window.ArenaAnimatedFX&&
   window.ArenaAnimatedFX.available('slash'),{timeout:20000});
 await p.locator('#startBtn').click();
 await p.waitForFunction(()=>window.__arenaQA.state.phase==='fight',{timeout:20000});
 const events=await p.evaluate(()=>{
  const {state:s,attack}=window.__arenaQA;
  const f=s.player,e=s.enemy,fx=window.ArenaAnimatedFX;
  s.phase='fight';s.paused=false;s.autoPlaying=false;s.autoplayEnabled=false;s.gauntlet=null;s.careerMatch=false;
  function ready(){
   s.phase='fight';s.resultApplied=false;
   f.x=480;e.x=650;
   for(const a of [f,e]){
    a.dead=false;a.hp=a.maxHp;a.st=100;a.stagger=0;a.dodge=0;
    a.guard=false;a.parry=0;a.guardHold=0;a.invuln=0;a.attackCD=0;
    a.cd=0;a.comboDash=null;a.chainHits=0;a.knockT=0;
   }
   s.sparks=[];s.cinematic=null;s.focusFrame=null;
  }
  ready();f.attackVariant=0;attack(f,e,false,false);
  const ordinary=s.sparks.map(x=>x.sequence).filter(Boolean);
  const ordinaryDebris=s.sparks.filter(x=>['slash','sweep','thrust'].includes(x.sequence))
    .map(x=>({sequence:x.sequence,art:x.art}));
  ready();attack(f,e,true,false);
  const special=s.sparks.map(x=>x.sequence).filter(Boolean);
  ready();attack(f,e,false,true);
  const dash=s.sparks.map(x=>x.sequence).filter(Boolean);
  ready();e.guard=true;e.parry=0;attack(f,e,false,false);
  const guard=s.sparks.filter(x=>x.sequence==='guard').map(x=>({
   defenderAnchor:x.owner===e,source:x.art,offset:x.offsetX
  }));
  ready();e.hp=1;attack(f,e,false,false);
  const finisher=s.sparks.filter(x=>x.sequence==='finisher').map(x=>({
   defeatedAnchor:x.owner===e,source:x.art
  }));
  ready();f.guard=true;f.parry=.3;attack(e,f,false,false);
  const parry=s.sparks.map(x=>x.sequence).filter(Boolean);
  const parryBursts=s.sparks.filter(x=>x.sequence==='parry').map(x=>({
   ownerless:x.owner===null,width:x.w,height:x.h,duration:x.max,
   x:x.x,y:x.y,defenderShieldX:f.x+f.face*52,
   recoilingAttackerX:e.x,focusCenter:s.cinematic?.centerX
  }));
  return {ordinary,ordinaryDebris,special,dash,guard,finisher,parry,parryBursts,focus:s.cinematic?.kind};
 });
 assert.ok(events.ordinary.some(x=>['slash','sweep','thrust'].includes(x)),'ordinary strikes use animated slices');
 assert.ok(events.ordinaryDebris.length>0);
 assert.ok(events.ordinaryDebris.every(x=>x.art==null),'ordinary sword swing must not trigger old explosive spark art');
 assert.ok(events.special.includes('special'),'special attack wired to own spiral atlas');
 assert.ok(events.dash.includes('dash'),'dash linked to own horizontal dash atlas');
 assert.ok(!events.dash.includes('parry'),'dash cannot overlay the parry explosion');
 assert.ok(events.guard.length>0&&events.guard.every(x=>x.defenderAnchor&&x.source==null),
   'guarded blows show crescent on defending shield, not the attacking weapon');
 assert.ok(events.finisher.length>0&&events.finisher.every(x=>x.defeatedAnchor&&x.source==null),
   'KO impact uses exclusive radial finisher art on the defeated fighter');
 assert.ok(events.parry.includes('parry'),'parry counter uses precision flash atlas');
 assert.equal(events.parryBursts.length,1,'one contact burst must replace stacked flares');
 const clang=events.parryBursts[0];
 assert.ok(clang.ownerless&&clang.width<=360&&clang.height<=360,'compact fixed metal contact');
 assert.ok(clang.duration>=.28&&clang.duration<=.38,'a brief 12-frame deflection');
 assert.ok(Math.abs(clang.x-clang.defenderShieldX)<=48,'flash stays beside shield rim');
 assert.ok(Math.abs(clang.x-clang.recoilingAttackerX)>80,'flash does not follow attacker knockback');
 assert.ok(Math.abs(clang.focusCenter-clang.x)<1,'focus agrees with shield contact');
 assert.equal(events.focus,'parry');
 await p.waitForTimeout(170);
 const active=await p.evaluate(()=>{
  const s=window.__arenaQA.state;
  return {timeScale:s.focusFrame?.timeScale,
   fxTime:s.sparks.filter(x=>x.sequence).map(x=>({kind:x.sequence,t:x.t,max:x.max})),
   camera:s.focusFrame?.active};
 });
 assert.ok(active.camera,'real perfect-parry freeze remains active');
 assert.ok(active.fxTime.some(x=>x.t>.05),'frames advance with real time through gameplay slow motion');
 assert.ok(active.fxTime.some(x=>x.max>=.28&&x.max<=.38),'parry deflection stays within its contact animation window');
 const sync=await p.evaluate(()=>{
  const {state:s,attack,fxPoint,fxTiming}=window.__arenaQA;
  const f=s.player,e=s.enemy;
  s.phase='fight';s.paused=false;s.autoplayEnabled=false;s.autoPlaying=false;
  f.x=450;e.x=650;f.hp=f.maxHp;e.hp=e.maxHp;
  f.dead=e.dead=false;f.stagger=e.stagger=0;f.dodge=e.dodge=0;
  f.st=100;f.attackCD=0;f.chainHits=0;f.comboDash=null;
  f.attackVariant=2;f.guard=e.guard=false;f.invuln=e.invuln=0;
  e.parry=0;e.guardHold=0;s.sparks=[];
  attack(f,e,false,false);
  const slash=s.sparks.find(x=>x.sequence==='slash'||x.sequence==='sweep'||x.sequence==='thrust');
  if(!slash)return null;
  // Rotate / scale the same actor pivot as drawFighter; the FX cannot drift
  // when a character lunges, recoils, turns or shifts the torso.
  f._fxRender={dx:31,dy:-13,tilt:.12,sx:1.11,sy:.94,pivotX:f.x,pivotY:616};
  const anchor=fxPoint(slash),rawX=f.x+slash.offsetX,rawY=617-348*.53+slash.offsetY;
  const p=fxTiming(slash);
  slash.t=slash.delay+slash.max*.46;
  const live=fxTiming(slash);
  return {delay:slash.delay,track:slash.track,initialHidden:!p.visible,
    live:live.visible,progress:live.progress,anchor,rawX,rawY,
    ownerIsStriker:slash.owner===f,
    source:slash.sequence,initialT:0};
 });
 assert.ok(sync&&sync.track==='body'&&sync.ownerIsStriker,'regular VFX must follow attacker pose');
 assert.ok(sync.delay>=.06&&sync.initialHidden&&sync.live,'FX blade flash begins at sword-contact phase');
 assert.ok(Math.abs(sync.anchor.x-sync.rawX)>5&&Math.abs(sync.anchor.y-sync.rawY)>5,
   'effect position must react to render-space lunge, foot anchor and shoulder turn');
 console.log('VFX_SYNC_POSE_PASS '+JSON.stringify(sync));
 assert.equal(errors.length,0,'no script runtime errors');
 console.log('PAINTED_VFX_GAMEPASS '+JSON.stringify({events,active}));
}finally{await browser.close()}
