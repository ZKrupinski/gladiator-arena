// Browser QA: proves the actual rendered canvas changes over time, not only
// that the animation's index math returns different numbers.
import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1200,height:950},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
const report={testedAt:new Date().toISOString(),source:'local GitHub Pages public/',samples:{}};
function sleep(ms){return new Promise(res=>setTimeout(res,ms));}
async function pixels(){
 return await page.locator('#stage').evaluate(canvas=>{
  const image=canvas.getContext('2d').getImageData(200,90,620,460);
  return Array.from(image.data.filter((_,idx)=>idx%4!==3));
 });
}
function pixelDiff(a,b){let n=0,delta=0;for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-b[i]);if(d>20)n++;delta+=d;}return {changedChannels:n,totalDifference:delta};}
async function check(label,selector,wait,threshold){
 await page.locator(selector).click();
 await sleep(70);
 const a=await pixels();await sleep(wait);
 const b=await pixels(),diff=pixelDiff(a,b);
 report.samples[label]=diff;
 assert.ok(diff.changedChannels>threshold,label+' rendered image is not moving: '+JSON.stringify(diff));
 await page.locator('#stage').screenshot({path:'docs/qa/murmillo-v3-'+label+'.png'});
}
try {
 await page.goto('http://127.0.0.1:8765/murmillo-motion-test.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.MurmilloMotion?.hasStandaloneAssets?.()===true,{timeout:40000});
 await page.waitForFunction(()=>document.getElementById('status')?.textContent?.includes('재생 중'),{timeout:40000});
 report.version=await page.evaluate(()=>window.MurmilloMotion.version);
 assert.equal(report.version,'3.0.0');
 await page.locator('#auto').uncheck();
 await check('idle','[data-motion="idle"]',920,700);
 await check('walk','[data-motion="walk"]',260,1200);
 await check('slash','[data-motion="slash"]',200,2500);
 await check('thrust','[data-motion="thrust"]',220,2500);
 await check('victory','[data-motion="victory"]',550,700);
 assert.deepEqual(errors,[],'uncaught JS runtime errors');
 report.status='PASS';
} catch(e){
 report.status='FAIL';report.error=String(e);report.consoleErrors=errors;
 fs.mkdirSync('docs/qa',{recursive:true});
 fs.writeFileSync('docs/qa/murmillo-v3-browser-report.json',JSON.stringify(report,null,2));
 await browser.close();
 throw e;
}
fs.mkdirSync('docs/qa',{recursive:true});
fs.writeFileSync('docs/qa/murmillo-v3-browser-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
await browser.close();
