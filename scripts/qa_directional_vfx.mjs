import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{}),args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const base=process.env.ARENA_URL||'http://127.0.0.1:8765';
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
// The arcade arena is intentionally hidden on the Blood & Glory Ludus title.
// Export rendered canvas pixels directly instead of asking Playwright to
// screenshot a hidden DOM element.
async function captureBattle(filename){
 const png=await page.evaluate(()=>document.querySelector('#battle').toDataURL('image/png').split(',')[1]);
 fs.writeFileSync('docs/vfx-v4/'+filename,Buffer.from(png,'base64'));
}
fs.mkdirSync('docs/vfx-v4',{recursive:true});
try{
 await page.goto(base+'/vfx-gallery.html?__arena_qa=1');
 await page.waitForFunction(()=>Object.values(ArenaRasterFX.status().ready).every(Boolean));
 const pixels=await page.evaluate(()=>{
  const fx=ArenaRasterFX,out={};
  for(const kind of Object.keys(fx.FAMILIES)){
   const hashes=[],mirrors=[];
   for(let f=0;f<8;f++){
    const canvases=[1,-1].map(face=>{
     const c=document.createElement('canvas');c.width=c.height=512;
     fx.draw(c.getContext('2d'),kind,256,256,512,512,(f+.5)/8,1,face);
     return c.getContext('2d').getImageData(0,0,512,512).data;
    });
    let hash=0,ink=0,border=0,diff=0;
    const [a,b]=canvases;
    for(let y=0;y<512;y++)for(let x=0;x<512;x++){
     const i=(y*512+x)*4,j=(y*512+511-x)*4;
     if(a[i+3]){ink++;if(x<20||x>=492||y<20||y>=492)border++;}
     hash=(Math.imul(hash,31)+a[i]+a[i+1]+a[i+2]+a[i+3])>>>0;
     for(let k=0;k<4;k++)diff=Math.max(diff,Math.abs(a[i+k]-b[j+k]));
    }
    if(border||ink<100||diff>1)throw Error(JSON.stringify({kind,f,border,ink,diff}));
    hashes.push(hash);mirrors.push(diff);
   }
   out[kind]={unique:new Set(hashes).size,mirrors};
  }
  return out;
 });
 for(const result of Object.values(pixels))assert.equal(result.unique,8);
 await page.locator('#next').click();await page.locator('#frame').fill('3');
 await page.screenshot({path:'docs/vfx-v4/gallery-right.png',fullPage:true});
 await page.locator('#face').selectOption('-1');
 await page.screenshot({path:'docs/vfx-v4/gallery-left.png',fullPage:true});
 await page.goto(base+'/?__arena_qa=1');
 await page.waitForFunction(()=>window.__arenaQA&&Object.values(ArenaRasterFX.status().ready).every(Boolean));
 await page.evaluate(()=>{const s=window.__arenaQA.state;s.phase='fight';s.time=110;s.paused=false;s.gauntlet=null;s.autoplayEnabled=false;s.autoPlaying=false;});
 await page.waitForFunction(()=>window.__arenaQA?.state.phase==='fight'&&window.__arenaQA.assetsReady());
 const events=[];
 for(const direction of [1,-1])for(const action of ['ordinary','guard','parry','special','dash','finisher']){
  const event=await page.evaluate(({direction,action})=>{
   const {state:s,attack,render}=__arenaQA,f=s.player,v=s.enemy;
   Object.assign(s,{phase:'fight',paused:false,autoplayEnabled:false,autoPlaying:false,gauntlet:null,careerMatch:false,
    resultApplied:false,cinematic:null,focusFrame:null,sparks:[],parryBursts:[],fx:true,shake:0,cameraKick:null});
   for(const actor of [f,v])Object.assign(actor,{hp:actor.maxHp,dead:false,removedFromArena:false,st:100,stagger:0,dodge:0,
    guard:false,parry:0,guardHold:0,invuln:0,attackCD:0,cd:0,comboDash:null,chainHits:0,knockT:0,knockVX:0,
    parryTriumphT:0,parryFailT:0,bodySpring:null});
   f.x=direction>0?480:680;v.x=direction>0?660:500;f.face=direction;v.face=-direction;
   if(action==='guard'||action==='parry'){v.guard=true;v.parry=action==='parry'?.3:0;}
   if(action==='finisher')v.hp=1;
   const calls=[],sounds=[];
   const originalDraw=CanvasRenderingContext2D.prototype.drawImage,originalPlay=ArenaAudio.play;
   CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
    if(image?.src?.includes('/directional-v4/')){
     const matrix=this.getTransform();calls.push({source:image.src.split('/').pop().split('?')[0],
      args:args.length,width:args.length===4?args[2]:null,
      height:args.length===4?args[3]:null,
      sign:Math.sign(matrix.a*matrix.d-matrix.b*matrix.c)});
    }
    return originalDraw.call(this,image,...args);
   };
   ArenaAudio.play=(kind,opt)=>{sounds.push(kind);return true;};
   try{
    attack(f,v,action==='special',action==='dash');
    s.paused=true;
    for(const spark of s.sparks)spark.t=(spark.delay||0)+(spark.max-(spark.delay||0))*.4;
    if(action==='finisher')s.resultAnim=.7;
    render();
   }finally{CanvasRenderingContext2D.prototype.drawImage=originalDraw;ArenaAudio.play=originalPlay;}
   return {direction,action,calls,sounds,phase:s.phase,
    sparks:s.sparks.map(x=>({sequence:x.sequence,width:x.w,height:x.h,art:x.art})),
    sequences:s.sparks.map(x=>x.sequence),
    focus:s.cinematic?.kind,kick:s.cameraKick?.kind,shake:s.shake,playerHp:f.hp,enemyHp:v.hp};
  },{direction,action});
  assert.ok(event.calls.length>0,JSON.stringify(event));
  assert.ok(event.calls.every(c=>c.args===4||c.args===2),'no source atlas slicing, including petal extraction');
  const wanted=action==='ordinary'?['slash','sweep','thrust']:action==='special'?['special','hit']:action==='finisher'?['finisher','victory']:[action];
  assert.ok(wanted.some(k=>event.calls.some(c=>c.source.startsWith(k+'-'))),JSON.stringify(event));
  assert.ok(event.calls.some(c=>c.sign===(action==='guard'||action==='parry'?-direction:direction)),JSON.stringify(event));
  if(action==='ordinary'){
   assert.ok(!event.sequences.includes('hit'),'ordinary trail has no extra debris burst');
   const spark=event.sparks.find(x=>['slash','sweep','thrust'].includes(x.sequence));
   assert.ok(spark,'ordinary strike emits a directional PNG trail');
   const drawn=event.calls.find(x=>x.source.startsWith(spark.sequence+'-'));
   assert.ok(drawn,'ordinary PNG frame is drawn to canvas');
   const multiplier=spark.sequence==='thrust'?2.0:1.6;
   const originalScale=(.9+.13*.4)*1.31*.65*1.20;
   assert.ok(Math.abs(drawn.width-spark.width*originalScale*multiplier)<.1,
    'ordinary strike width must use the approved 1.6x slash/sweep or 2.0x thrust');
   assert.ok(Math.abs(drawn.height-spark.height*originalScale*multiplier)<.1,
    'ordinary strike height must use the approved 1.6x slash/sweep or 2.0x thrust');
  }
  if(action==='parry'||action==='dash')assert.equal(event.focus,action);
  if(action!=='finisher')assert.ok(event.kick&&event.shake>0,JSON.stringify(event));
  assert.ok(event.sounds.includes(({ordinary:'hit',guard:'block',parry:'parry',special:'heavy_hit',dash:'dash_hit',finisher:'finisher'})[action]),JSON.stringify(event));
  events.push(event);
  if(direction===1)await captureBattle('game-'+action+'.png');
 }
 await page.evaluate(()=>{const s=__arenaQA.state;s.sparks=[];s.resultAnim=.9;__arenaQA.render();});
 await captureBattle('game-victory.png');
 // Focus slows only simulation; the independent presentation clock can advance.
 const timing=await page.evaluate(()=>['parry','dash'].map(kind=>{
  const state=ArenaFocus.start(kind,640,1),first=ArenaFocus.advance(state,.02);
  let out;for(let i=0;i<70;i++)out=ArenaFocus.advance(state,.02);
  return {kind,firstRate:first.timeScale,finalRate:out.timeScale,ended:!out.active};
 }));
 assert.ok(timing.every(t=>t.firstRate<.1&&t.finalRate===1&&t.ended));
 await page.emulateMedia({reducedMotion:'reduce'});
 const reduced=await page.evaluate(()=>ArenaFocus.advance(ArenaFocus.start('dash',640,1),.02,true));
 assert.equal(reduced.timeScale,1);assert.equal(reduced.zoom,0);
 assert.deepEqual(errors,[]);
 fs.writeFileSync('docs/vfx-v4/browser-qa.json',JSON.stringify({base,pixels,events,timing,errors},null,2)+'\n');
 console.log('PASS: 80 frames, pixel-perfect left/right mirrors, 12 real combat cases, SFX/shake/focus synchronization, reduced motion.');
}finally{await browser.close()}
