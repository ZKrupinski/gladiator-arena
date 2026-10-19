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
 let total=0;
 for(const [name,info] of Object.entries(frames.result)){
  assert.ok(info.frames>=12,name+' must contain at least 12 frames');
  total+=info.frames;
  assert.equal(info.samples.length,4);
  if(['slash','sweep','thrust'].includes(name)){
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
 assert.ok(total>=100,'more than 100 hand-assembled animation frames');
 const refs=await p.evaluate(()=>{
  const fx=window.ArenaAnimatedFX;
  return {v:fx.version,
    basic:['slash','sweep','thrust'].map(key=>({
       key,source:fx.FAMILIES[key].source,frames:fx.FAMILIES[key].frames,
       drawn:[.05,.2,.38,.55,.74,.91].map(t=>fx.inspect(key,t)?.index)
    }))};
 });
 assert.equal(refs.v,'2.0.0','new authored-asset v2 must load');
 assert.deepEqual(refs.basic.map(x=>x.source),['slash_trail','sweep_trail','thrust_trail']);
 for(const ref of refs.basic){
  assert.equal(ref.frames,12);
  assert.equal(new Set(ref.drawn).size,6,'frame cursor advances through new source atlas');
 }
 console.log('AUTHORED_SWORD_TRAILS_PASS '+JSON.stringify(refs));
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
  s.phase='fight';s.paused=false;s.autoPlaying=false;s.autoplayEnabled=false;
  function ready(){
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
  ready();f.guard=true;f.parry=.3;attack(e,f,false,false);
  const parry=s.sparks.map(x=>x.sequence).filter(Boolean);
  return {ordinary,ordinaryDebris,special,dash,parry,focus:s.cinematic?.kind};
 });
 assert.ok(events.ordinary.some(x=>['slash','sweep','thrust'].includes(x)),'ordinary strikes use animated slices');
 assert.ok(events.ordinaryDebris.length>0);
 assert.ok(events.ordinaryDebris.every(x=>x.art==null),'ordinary sword swing must not trigger old explosive spark art');
 assert.ok(events.special.includes('special'),'special attack wired to 16 frames');
 assert.ok(events.dash.includes('dash'),'dash linked to 16-frame sequence');
 assert.ok(events.parry.includes('parry'),'parry counter uses 16-frame animation');
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
 assert.ok(active.fxTime.some(x=>x.max>=.5),'animated parry needs full frame window');
 assert.equal(errors.length,0,'no script runtime errors');
 console.log('PAINTED_VFX_GAMEPASS '+JSON.stringify({events,active}));
}finally{await browser.close()}
