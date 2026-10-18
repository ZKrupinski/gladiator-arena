import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1182,height:1312},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:8765/?__arena_qa=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>Boolean(window.__arenaQA),{timeout:18000});
 await page.locator('#startBtn').click();
 await page.waitForFunction(()=>window.__arenaQA.state.phase==='fight',{timeout:18000});
 const before=await page.evaluate(()=>{
  const s=window.__arenaQA.state;
  s.careerMatch=false;s.gauntlet={round:30,inCleanup:false};
  s.player.dead=false;s.player.removedFromArena=false;s.player.hp=s.player.maxHp;
  s.enemy.dead=true;s.enemy.hp=0;s.enemy.removedFromArena=true;
  s.resultApplied=true;s.resultWin=true;s.phase='result';
  window.__arenaQA.showEnd();
  return {removed:s.enemy.removedFromArena,screen:document.querySelector('#endScreen').hidden};
 });
 assert.equal(before.removed,true,'no corpse resurrection in actual arena state');
 assert.equal(before.screen,false,'result opens');
 await page.waitForTimeout(650);
 const data=await page.evaluate(async()=>{
  const modal=document.querySelector('#endScreen');
  const panel=modal.querySelector('.stage-panel-ending');
  const frame=modal.querySelector('.roman-results-frame');
  const loser=modal.querySelector('#loserPose');
  const winner=modal.querySelector('#winnerPose');
  const rect=panel.getBoundingClientRect();
  const loserRect=loser.getBoundingClientRect();
  const btn=modal.querySelector('#againBtn').getBoundingClientRect();
  const canvas=loser.querySelector('canvas');
  let nonTransparent=0;
  if(canvas){
   const c=canvas.getContext('2d');
   const im=c.getImageData(0,0,canvas.width,canvas.height).data;
   for(let i=3;i<im.length;i+=4*113)if(im[i]>30)nonTransparent++;
  }
  const hasCanvas=!!canvas && nonTransparent>20;
  const hasBg=getComputedStyle(loser).backgroundImage.includes('url(');
  const svgResponse=await fetch('assets/new-era/cinematic/roman-result-frame-v2.svg?v=2');
  const stylesheet=await fetch('arena-result-roman-v2.css?v=2');
  return {
   modalVisible:getComputedStyle(modal).display!=='none',
   frameImage:getComputedStyle(frame).backgroundImage,
   framePresent:!!frame,
   frameUrlOK:svgResponse.ok,
   cssOK:stylesheet.ok,
   winnerVisible:!!winner.querySelector('canvas')||getComputedStyle(winner).backgroundImage.includes('url('),
   loserVisible:hasCanvas||hasBg,
   croppedPanel:rect.top<0||rect.left<0||rect.right>innerWidth+1||rect.bottom>innerHeight+1,
   panelBox:{x:rect.x,y:rect.y,w:rect.width,h:rect.height},
   loserBox:{x:loserRect.x,y:loserRect.y,w:loserRect.width,h:loserRect.height},
   buttonsInside:btn.bottom<=rect.bottom&&btn.left>=rect.left&&btn.right<=rect.right,
   opponentRemoved:window.__arenaQA.state.enemy.removedFromArena,
   crowns:modal.querySelectorAll('.roman-results-pennant').length
  };
 });
 assert.equal(data.framePresent,true);
 assert.equal(data.frameUrlOK,true,'ornate SVG frame is loadable');
 assert.equal(data.cssOK,true,'result CSS is loadable');
 assert.ok(data.frameImage.includes('roman-result-frame-v2.svg'),'frame styling active');
 assert.equal(data.loserVisible,true,'defeated fighter portrait remains in final window');
 assert.equal(data.winnerVisible,true,'winner portrait remains in final window');
 assert.equal(data.opponentRemoved,true,'body stays absent from arena state');
 assert.equal(data.buttonsInside,true,'buttons stay inside ornamented window');
 assert.equal(data.croppedPanel,false,'frame cannot clip outside device viewport');
 assert.equal(data.crowns,2,'balanced Roman standards');
 console.log('RESULT_WINDOW_QA_PASS '+JSON.stringify(data));
 if(process.env.RESULT_PREVIEW==='1'){
  const screenshot=await page.screenshot({type:'jpeg',quality:65});
  console.log('RESULT_WINDOW_PREVIEW_JPEG:'+screenshot.toString('base64'));
 }
}finally{await browser.close()}
