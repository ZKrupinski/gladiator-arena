import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1182,height:990}});
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:40000});
 await page.waitForFunction(()=>typeof window.LudusPractice?.rules?.practiceSummary==='function',{timeout:30000});
 const snapshot=await page.evaluate(()=>{
  // Use a controlled training record without changing persistent game saves.
  window.LudusBridge={
   state:()=>({roster:[{name:'Lucius',cls:'murmillo',level:19,injury:0,fatigue:0}],active:0,practiceBest:15}),
   portrait:()=>null
  };
  if(!window.LudusPractice.open())throw Error('Practice scene could not open');
  const r=window.LudusPractice.rules.practiceSummary(
   {wave:15,clearedWave:14,kills:78},{best:15});
  const result=document.querySelector('.ep-result');
  document.querySelector('.ep-selection').hidden=true;
  document.querySelector('.ep-combat').hidden=true;
  result.hidden=false;
  document.querySelector('#epResultTitle').textContent=r.reached+'단계 도달';
  document.querySelector('#epResultCleared').textContent=r.cleared;
  document.querySelector('#epResultKills').textContent=r.kills;
  document.querySelector('#epResultBest').textContent=r.best;
  document.querySelector('#epRewards').innerHTML=
   '<div class="ep-reward"><strong>Lucius</strong><span>EXP +1078</span><small>Lv.19 · LEVEL UP +3</small></div>'+
   '<div class="ep-reward"><strong>Cassius</strong><span>EXP +1162</span><small>Lv.23 · LEVEL UP +3</small></div>'+
   '<div class="ep-reward"><strong>Valerius</strong><span>EXP +2035</span><small>Lv.24 · LEVEL UP +4</small></div>'+
   '<div class="ep-reward"><strong>Aulus</strong><span>EXP +1709</span><small>Lv.24 · LEVEL UP +4</small></div>';
  return {
   title:document.querySelector('#epResultTitle').textContent,
   metrics:[...document.querySelectorAll('.ep-result-metric strong')].map(n=>n.textContent),
   cards:document.querySelectorAll('.ep-reward').length,
   css:getComputedStyle(document.querySelector('.ep-result-metrics')).display,
   html:result.textContent
  };
 });
 assert.equal(snapshot.title,'15단계 도달');
 assert.deepEqual(snapshot.metrics,['14','78','15']);
 assert.equal(snapshot.cards,4);
 assert.equal(snapshot.css,'grid');
 assert(!snapshot.html.includes('전원 전투불능'));
 for(const size of [{width:1182,height:990},{width:768,height:900},{width:390,height:844},{width:320,height:650}]){
  await page.setViewportSize(size);
  const layout=await page.evaluate(()=>{
   const result=document.querySelector('.ep-result'),metrics=document.querySelector('.ep-result-metrics');
   const boxes=[...metrics.children].map(e=>e.getBoundingClientRect());
   const allLabels=[...metrics.children].map(e=>e.querySelector('strong').textContent);
   return {scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,
    resultRight:result.getBoundingClientRect().right,
    cols:getComputedStyle(metrics).gridTemplateColumns.split(' ').length,
    boxes:boxes.map(b=>({x:b.x,right:b.right,width:b.width})),labels:allLabels};
  });
  assert(layout.scrollWidth<=layout.viewport+2,'horizontal overflow '+JSON.stringify({size,layout}));
  assert(layout.resultRight<=size.width+2,'result panel outside viewport '+JSON.stringify({size,layout}));
  assert.equal(layout.cols,3,'all three metrics must be legible in one row');
  assert(layout.boxes.every(b=>b.width>=65),'stat cards too narrow '+JSON.stringify({size,layout}));
  assert.deepEqual(layout.labels,['14','78','15']);
 }
 await page.setViewportSize({width:1182,height:990});
 await page.screenshot({path:'/tmp/practice-result-honors-v27.png',fullPage:true});
 console.log('PRACTICE_ACHIEVEMENT_BROWSER_PASS '+JSON.stringify(snapshot));
}finally{await browser.close();}
