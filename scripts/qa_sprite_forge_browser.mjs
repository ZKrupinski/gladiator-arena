import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1240,height:800},acceptDownloads:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:8765/sprite-forge.html',{waitUntil:'domcontentloaded'});
 assert.match(await page.title(),/SPRITE FORGE/);
 assert.equal(await page.locator('.action').count(),10,'ten distinct actions');
 // Construct ONE valid 4x2 transparent sheet entirely in the test browser.
 // Each cell contains exactly one independently separated circular sprite.
 const sheet=await page.evaluate(()=>{
  const c=document.createElement('canvas');c.width=1600;c.height=840;
  const ctx=c.getContext('2d');
  for(let i=0;i<8;i++){
   const x=(i%4)*400+200, y=Math.floor(i/4)*420+260;
   ctx.fillStyle=['#f2a443','#e39c5a','#db9e6e','#b17a48'][i%4];
   ctx.beginPath();ctx.ellipse(x+i%3*3,y,130,120,0,0,Math.PI*2);ctx.fill();
  }
  return c.toDataURL('image/png').split(',')[1];
 });
 await page.locator('#file').setInputFiles({name:'wolf_idle_demo.png',mimeType:'image/png',buffer:Buffer.from(sheet,'base64')});
 await page.locator('#process').click();
 await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('총 8프레임'),{timeout:14000});
 assert.equal(await page.locator('#frames .frame.ok').count(),8,'nonoverlapping grid accepted');
 assert.equal(await page.locator('#frames .frame.failed').count(),0);
 assert.match(await page.locator('#status').innerText(),/통과 8/);
 assert.ok(await page.locator('#source').evaluate(im=>im.naturalWidth)>0,'original preview not revoked');
 const downloadPromise=page.waitForEvent('download',{timeout:25000});
 await page.locator('#export').click();const d=await downloadPromise;
 assert.match(d.suggestedFilename(),/REVIEW_ONLY/,'partial action never marked game-ready');
 await page.locator('#previewBtn').click();
 await page.waitForTimeout(240);
 await page.locator('#previewBtn').click();
 // Generate a second source whose painted art reaches the edge of cell 1.
 const clipped=await page.evaluate(()=>{
  const c=document.createElement('canvas');c.width=1600;c.height=840;
  const ctx=c.getContext('2d');ctx.fillStyle='#ffcb65';
  for(let i=0;i<8;i++)ctx.fillRect(i%4*400+35,Math.floor(i/4)*420+34,230,250);
  ctx.fillRect(0,80,8,240);
  return c.toDataURL('image/png').split(',')[1];
 });
 await page.locator('#file').setInputFiles({name:'wolf_claw_bad.png',mimeType:'image/png',buffer:Buffer.from(clipped,'base64')});
 await page.locator('#action').selectOption('attack_claw');
 await page.locator('#process').click();
 await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('경고'),{timeout:15000});
 assert.ok(await page.locator('#frames .frame.failed').count()>=1,'clipped sprites must be flagged');
 assert.deepEqual(errors,[],'no browser JS errors');
 console.log('SPRITE_FORGE_8_FRAME_QA_DOWNLOAD_PASS');
}finally{await browser.close();}
