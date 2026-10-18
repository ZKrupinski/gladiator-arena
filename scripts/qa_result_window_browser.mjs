import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const photo='assets/new-era/cinematic/roman-colosseum-result-v1.webp?v=1';
async function check(size,preview){
 const page=await browser.newPage({viewport:size,deviceScaleFactor:1});
 try{
  await page.goto('http://127.0.0.1:8765/?__arena_qa=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__arenaQA),{timeout:20000});
  await page.locator('#startBtn').click();
  await page.waitForFunction(()=>window.__arenaQA.state.phase==='fight',{timeout:20000});
  await page.evaluate(()=>{
   const s=window.__arenaQA.state;
   s.careerMatch=false;s.gauntlet={round:30,inCleanup:false};
   s.player.dead=false;s.player.removedFromArena=false;s.player.hp=s.player.maxHp;
   s.enemy.dead=true;s.enemy.hp=0;s.enemy.removedFromArena=true;
   s.resultApplied=true;s.resultWin=true;s.phase='result';
   window.__arenaQA.showEnd();
  });
  await page.locator('#endBanner').waitFor({state:'visible',timeout:10000});
  await page.waitForFunction(()=>Boolean(document.querySelector('#loserPose canvas')&&
                         document.querySelector('#winnerPose canvas')),{timeout:16000});
  await page.waitForTimeout(450);
  const result=await page.evaluate(async path=>{
   const modal=document.querySelector('#endScreen');
   const panel=modal.querySelector('.stage-panel-ending');
   const loser=modal.querySelector('#loserPose');
   const winner=modal.querySelector('#winnerPose');
   const rect=panel.getBoundingClientRect();
   const loserRect=loser.getBoundingClientRect();
   const actions=modal.querySelector('.end-actions').getBoundingClientRect();
   const canvas=loser.querySelector('canvas');
   let pixelCount=0, alphaBox=null;
   if(canvas){
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    let l=canvas.width,t=canvas.height,r=0,b=0;
    for(let y=0;y<canvas.height;y+=2)for(let x=0;x<canvas.width;x+=2){
     if(pixels[(y*canvas.width+x)*4+3]>42){
      pixelCount++;
      l=Math.min(l,x);r=Math.max(r,x);
      t=Math.min(t,y);b=Math.max(b,y);
     }
    }
    if(pixelCount)alphaBox={left:l,top:t,width:r-l+1,height:b-t+1};
   }
   const art=await fetch(path);
   const img=new Image();
   img.src=path;await img.decode();
   const test=document.createElement('canvas');test.width=img.width;test.height=img.height;
   const tctx=test.getContext('2d',{willReadFrequently:true});
   tctx.drawImage(img,0,0);
   const corner=tctx.getImageData(0,0,1,1).data[3];
   const inside=tctx.getImageData(Math.round(img.width/2),Math.round(img.height/2),1,1).data[3];
   const panelCSS=getComputedStyle(panel);
   const photoOnly=panelCSS.backgroundImage.includes('roman-colosseum-result-v1.webp') &&
    !panelCSS.backgroundImage.includes(',')&&!panelCSS.backgroundImage.includes('linear-gradient');
   const cbox=canvas?.getBoundingClientRect();
   const pixelRatio=canvas?cbox.width/cbox.height:null;
   return {
    imgOK:art.ok,imgType:art.headers.get('content-type'),
    actualWidth:img.naturalWidth,actualHeight:img.naturalHeight,
    transparentOutside:corner<10,opaqueInside:inside>200,
    panelImageOnly:photoOnly,panelImage:panelCSS.backgroundImage,
    oldOrnaments:modal.querySelectorAll('.roman-results-frame,.roman-results-pennant').length,
    resultHidden:modal.hidden,
    winnerVisible:!!winner.querySelector('canvas')||getComputedStyle(winner).backgroundImage.includes('url('),
    loserVisible:(pixelCount>20)||getComputedStyle(loser).backgroundImage.includes('url('),
    ratio:rect.width/rect.height,
    withinViewport:rect.left>=0&&rect.top>=0&&rect.right<=innerWidth+1&&rect.bottom<=innerHeight+1,
    buttonsInside:actions.left>=rect.left&&actions.right<=rect.right&&actions.bottom<=rect.bottom,
    originalLoserStillGone:window.__arenaQA.state.enemy.removedFromArena,
    canvasNaturalRatio:canvas?canvas.width/canvas.height:null,
    canvasDisplayedRatio:pixelRatio,
    alphaBox,loserSize:{w:loserRect.width,h:loserRect.height},panelSize:{w:rect.width,h:rect.height}
   };
  },photo);
  assert.equal(result.imgOK,true,'real approved raster image must be served');
  assert.equal(result.actualWidth,1448);assert.equal(result.actualHeight,1086);
  assert.equal(result.transparentOutside,true,'the outer frame must be alpha-transparent');
  assert.equal(result.opaqueInside,true,'the Colosseum must be visible');
  assert.equal(result.panelImageOnly,true,'exactly ONE picture; no duplicate SVG or arena background');
  assert.equal(result.oldOrnaments,0,'remove all built-in geometric vector decorations');
  assert.equal(result.winnerVisible,true);assert.equal(result.loserVisible,true);
  assert.ok(result.alphaBox?.width>70,'the defeat frame contains actual isolated sprite pixels');
  assert.ok(result.alphaBox?.height>55,'the defeated gladiator must not collapse to a thin strip');
  assert.ok(result.canvasNaturalRatio>1.4,'defeated pose canvas has correct aspect');
  assert.equal(result.originalLoserStillGone,true,'never restore the body in the real arena');
  assert.ok(Math.abs(result.ratio-4/3)<.015,'the approved artwork cannot be distorted');
  assert.equal(result.withinViewport,true,'no cropped gold frame');
  assert.equal(result.buttonsInside,true,'native buttons are interactive within frame');
  if(result.canvasNaturalRatio!=null)
   assert.ok(Math.abs(result.canvasDisplayedRatio-result.canvasNaturalRatio)<.03,'lose sprite aspect ratio preserved');
  console.log('RESULT_RASTER_QA_PASS '+JSON.stringify({viewport:size,...result}));
  if(preview&&process.env.RESULT_PREVIEW==='1'){
   const buffer=await page.screenshot({type:'jpeg',quality:75});
   console.log('RESULT_RASTER_PREVIEW_JPEG:'+buffer.toString('base64'));
  }
 }finally{await page.close()}
}
try{
 await check({width:1182,height:1312},true);
 await check({width:390,height:844},false);
}finally{await browser.close()}
