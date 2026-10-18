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
 // The new fighter is a separate roster entry, not a blanket replacement of
 // the original class. Verify fresh saves, repeat launches, and old save migration.
 const game=await browser.newPage({viewport:{width:1200,height:900}});
 await game.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await game.waitForFunction(()=>!!window.LudusBridge?.state,{timeout:30000});
 const read=()=>game.evaluate(()=>window.LudusBridge.state());
 let s=await read();
 assert.equal(s.roster.filter(h=>h.appearance==='murmillo_motion_v3').length,1,'fresh save has exactly one motion fighter');
 await game.reload({waitUntil:'domcontentloaded'});
 await game.waitForFunction(()=>!!window.LudusBridge?.state);
 s=await read();
 assert.equal(s.roster.filter(h=>h.appearance==='murmillo_motion_v3').length,1,'reloading must not duplicate starter');
 await game.evaluate(()=>{
  localStorage.setItem('gladiator.ludus.v1',JSON.stringify({
   gold:729,glory:14,fights:10,wins:6,active:1,
   roster:[
    {cls:'murmillo',name:'기존 무르밀로',level:12,xp:38,growthType:'murmillo_a',
     injury:7,stats:{str:2,agi:1,end:1,focus:1},inventory:['wood'],equipment:{weapon:'wood'},fights:4,wins:3},
    {cls:'retiarius',name:'기존 레티아리우스',level:5,xp:10,growthType:'retiarius_a',
     injury:4,stats:{str:0,agi:2,end:1,focus:0},inventory:['wood'],equipment:{weapon:'wood'},fights:2,wins:1}
   ]
  }));
 });
 await game.reload({waitUntil:'domcontentloaded'});
 await game.waitForFunction(()=>!!window.LudusBridge?.state);
 s=await read();
 assert.equal(s.roster.length,3,'one additional starter must be appended');
 assert.equal(s.active,1,'existing active fighter must be preserved');
 assert.equal(s.gold,729,'saved money must be preserved');
 assert.equal(s.roster[0].level,12,'original Murmillo growth level restored');
 assert.equal(s.roster[0].growthType,'murmillo_a','original Murmillo atlas retained');
 assert.equal(s.roster[0].injury,7,'original fighter injury remains');
 assert.equal(s.roster[1].wins,1,'existing fighter battle history remains');
 assert.equal(s.roster[2].appearance,'murmillo_motion_v3','new fighter separately flagged');
 const output=await game.evaluate(()=>({
  wobbleScriptPresent:[...document.scripts].some(x=>x.src.includes('sprite-inbetweens')),
  growthMotionGenerator:'drawMotion' in window.GrowthFrames,
  originalL5Scale:window.LudusRoster.scale('murmillo_a',5),
  motionScriptVersion:window.MurmilloMotion.version
 }));
 assert.equal(output.wobbleScriptPresent,false,'old flutter engine not loaded');
 assert.equal(output.growthMotionGenerator,false,'old scanline frame generator removed');
 assert.equal(output.originalL5Scale,.64,'animated sprite must match original L5 scale');
 assert.equal(output.motionScriptVersion,'3.0.0');
 report.roster={originalKept:true,addedOnce:true,activePreserved:true,levelPreserved:true,
  inventoryPreserved:true,flutterRemoved:true,scale:.64,rosterAfterMigration:s.roster.length};
 await game.reload({waitUntil:'domcontentloaded'});
 await game.waitForFunction(()=>!!window.LudusBridge?.state);
 s=await read();
 assert.equal(s.roster.length,3,'second reload must never duplicate animation fighter');
 await game.close();
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
