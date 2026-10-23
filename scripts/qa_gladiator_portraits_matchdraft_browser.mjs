import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1182,height:920},deviceScaleFactor:1});
const errors=[];page.on('pageerror',err=>errors.push(String(err)));
async function draft(){await page.waitForSelector('#careerHub:not([hidden]) .lc-draft-screen',{timeout:18000});}
async function enemyCards(expected,ready){
 const cards=page.locator('.lc-enemy-team .lc-enemy-portrait-card');
 assert.equal(await cards.count(),expected,'entire opposing team visible');
 const found=await page.evaluate(()=>{
  const items=[...document.querySelectorAll('.lc-enemy-team .lc-enemy-portrait-card')];
  const boxes=items.map(x=>x.getBoundingClientRect());
  return {pending:items.filter(x=>x.classList.contains('is-pending')).length,
   allInRow:boxes.every(x=>Math.abs(x.top-boxes[0].top)<2),
   complete:items.filter(x=>x.querySelector('canvas[data-enemy-art]')).length,
   levels:items.map(x=>x.querySelector('.lc-rival-caption small')?.textContent),
   names:items.map(x=>x.querySelector('.lc-rival-caption strong')?.textContent)};
 });
 assert.equal(found.allInRow,true,'enemy portraits displayed side by side '+JSON.stringify(found));
 assert.equal(found.pending,ready?0:expected,'incomplete teams must not show stale enemy');
 if(ready){
  assert.equal(found.complete,expected);
  assert(found.levels.every(v=>v?.includes('Lv.')),'levels shown for every opponent');
  await page.waitForFunction(()=>[...document.querySelectorAll('canvas[data-enemy-art]')].every(c=>{
   const x=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
   for(let i=3;i<x.length;i+=16)if(x[i]>45)return true;
   return false;
  }),{timeout:18000});
 }
 return found;
}
try{
 await page.goto('http://127.0.0.1:8765/?__arena_qa=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__arenaQA&&window.ArenaPortraitFit&&window.LudusBridge,{timeout:25000});
 // Transparent padding must be removed, without clipping actual nontransparent art.
 const fit=await page.evaluate(()=>{
  const original=document.createElement('canvas');original.width=220;original.height=220;
  const g=original.getContext('2d');g.fillStyle='#ebaf65';g.fillRect(96,32,28,177);
  const target=document.createElement('canvas');target.width=140;target.height=170;
  const ok=ArenaPortraitFit.draw(target,original);
  const data=target.getContext('2d').getImageData(0,0,140,170).data;
  let top=170,bottom=-1,left=140,right=-1;
  for(let y=0;y<170;y++)for(let x=0;x<140;x++)if(data[(y*140+x)*4+3]>30){
   top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);
  }
  return {ok,top,bottom,left,right,box:ArenaPortraitFit.bounds(original)};
 });
 assert.equal(fit.ok,true);
 assert(fit.bottom-fit.top>136 && fit.top>=0&&fit.left>=0&&fit.right<140&&fit.bottom<170,
   'portrait nearly fills target without cutting character '+JSON.stringify(fit));
 await page.evaluate(()=>{
  const roster=LudusBridge.state().roster;
  const types=['murmillo','thraex','retiarius','murmillo'];
  while(roster.length<4)roster.push(LudusRoster.create(types[roster.length%4],roster.length+1));
  roster.forEach((h,i)=>{h.level=i===0?2:i===1?11:i===2?6:15;
   h.stats={str:i*2,agi:i*2,end:i*2,focus:i*2};h.injury=0;h.fatigue=0;});
  // Direct adapter entry bypasses title onboarding to the slave market on new saves.
  LudusBridge.fight();
 });
 await draft();
 // Single fighter: immediately matched against the chosen performance.
 await page.locator('[data-battle-mode="1v1"]').click();
 let one=await enemyCards(1,true);
 const initial=await page.evaluate(()=>LudusBridge.matchOpponent([0]).matchKey);
 await page.locator('[data-candidate="1"]').click();
 await enemyCards(1,true);
 const newKey=await page.evaluate(()=>LudusBridge.matchOpponent([1]).matchKey);
 assert.notEqual(initial,newKey,'different fighters produce a different rival match');
 // Team matches: wait for ALL picks rather than showing a stale solo rival.
 await page.locator('[data-battle-mode="2v2"]').click();
 await enemyCards(2,false);
 await page.locator('[data-candidate="2"]').click();
 await enemyCards(2,true);
 const team1=await page.evaluate(()=>LudusBridge.matchOpponent([1,2]));
 assert.equal(team1.match.party,2,'match is based on both selected gladiators');
 await page.locator('[data-candidate="3"]').click();
 await enemyCards(2,true);
 const team2=await page.evaluate(()=>LudusBridge.matchOpponent([2,3]));
 assert.notEqual(team1.matchKey,team2.matchKey,'full team changed -> rival re-matched');
 assert.notEqual(team1.level,team2.level,'average opponent level responds to selected team');
 await page.locator('[data-battle-mode="3v3"]').click();
 await enemyCards(3,false);
 await page.locator('[data-candidate="1"]').click();
 await enemyCards(3,true);
 const team3=await page.evaluate(()=>LudusBridge.matchOpponent([2,3,1]));
 assert.equal(team3.match.party,3);
 // Beast selection uses a compact horizontal strip, never a vertical stack.
 await page.locator('[data-beast-hunt]').click();
 await page.waitForSelector('.venatio-roster-strip');
 let strip=await page.evaluate(()=>{
  const buttons=[...document.querySelectorAll('.venatio-roster-thumb')],rect=buttons.map(x=>x.getBoundingClientRect());
  return {count:buttons.length,sameRow:rect.every(x=>Math.abs(x.top-rect[0].top)<2),
   heights:rect.map(x=>x.height),maxPanel:document.querySelector('.venatio-hero-preview').getBoundingClientRect().height,
   accessible:buttons.every(x=>x.getAttribute('aria-label')?.includes('Lv.'))};
 });
 assert(strip.count>=4&&strip.sameRow&&strip.accessible,'venatio thumbnail row '+JSON.stringify(strip));
 assert(strip.maxPanel<=232,'portrait canvas must not stretch vertically');
 await page.locator('.venatio-roster-thumb').nth(2).click();
 assert.equal(await page.locator('.venatio-roster-thumb.is-selected').count(),1);
 await page.setViewportSize({width:390,height:844});
 strip=await page.evaluate(()=>{
  const buttons=[...document.querySelectorAll('.venatio-roster-thumb')],rect=buttons.map(x=>x.getBoundingClientRect());
  return {sameRow:rect.every(x=>Math.abs(x.top-rect[0].top)<2),
   previewH:document.querySelector('.venatio-hero-preview').getBoundingClientRect().height,
   clipped:buttons.some(x=>x.scrollWidth>x.clientWidth+3)};
 });
 assert(strip.sameRow&&strip.previewH<=157&&!strip.clipped,'mobile beast fighter selector remains compact '+JSON.stringify(strip));
 assert.deepEqual(errors,[],'game has no JS errors');
 console.log('GLADIATOR_PORTRAITS_AND_MATCHDRAFT_PASS');
}finally{await browser.close()}
