/* Run with Playwright installed. Isolated local save only; never touches a player's save. */
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{spawn}=require('node:child_process');
const server=spawn('python',['-m','http.server','8765','--directory','public'],{stdio:'ignore'});
(async()=>{
 await new Promise(r=>setTimeout(r,700));const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gladiator.ludus.v1')));
 await page.goto('http://127.0.0.1:8765/?__arena_qa=1');await page.waitForFunction(()=>!!window.LudusBridge&&!!window.ArenaCoop);
 await page.evaluate(()=>{const roster=LudusBridge.state().roster;while(roster.length<5)roster.push(LudusRoster.create(['murmillo','retiarius','thraex'][roster.length%3],1));LudusBridge.fight();});
 const pickFive=async()=>{
  await page.locator('[data-battle-mode="5v5"]').click();
  for(let i=0;i<5;i++)if(await page.locator('[data-candidate="'+i+'"]').getAttribute('aria-pressed')!=='true')await page.locator('[data-candidate="'+i+'"]').click();
 };
 await page.locator('[data-battle-mode="5v5"]').click();assert(await page.locator('#lcDeploy').isDisabled());
 await pickFive();assert.equal(await page.locator('[data-enemy-art]').count(),5);assert(await page.locator('#lcDeploy').isEnabled());
 await page.screenshot({path:'/tmp/coop-draft-desktop.png'});
 // Failed initial save must leave participation/fatigue unchanged and explain why.
 const preFail=await page.evaluate(()=>({runs:LudusBridge.state().coopRuns,fatigue:LudusBridge.state().roster.map(h=>h.fatigue||0)}));
 await page.evaluate(()=>{window.realSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('QA quota');};});
 await page.locator('#lcDeploy').click();assert.equal(await page.locator('.arena-coop').count(),0);assert.match(await page.locator('.lc-hint').innerText(),/저장할 수 없어/);
 assert.deepEqual(await page.evaluate(()=>LudusBridge.state().roster.map(h=>h.fatigue||0)),preFail.fatigue);
 await page.evaluate(()=>Storage.prototype.setItem=window.realSetItem);
 const before=await saved();await page.locator('#lcDeploy').click();await page.waitForSelector('.arena-coop');const entered=await saved();assert.equal(await page.locator('.coop-unit').count(),10);
 await page.waitForTimeout(2500);await page.locator('[data-pause]').click();await page.waitForTimeout(150);const time=await page.locator('.coop-clock').innerText();await page.waitForTimeout(450);assert.equal(await page.locator('.coop-clock').innerText(),time);
 await page.locator('[data-resume]').click();await page.locator('[data-unit="ally2"]').click();await page.locator('[data-cover]').click();await page.locator('[data-unit="enemy1"]').click();await page.waitForTimeout(200);assert(await page.locator('[data-cover]').isDisabled());assert.match(await page.locator('[data-focus]').innerText(),/초 후/);
 await page.screenshot({path:'/tmp/coop-battle-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);await page.screenshot({path:'/tmp/coop-battle-mobile.png'});
 assert(await page.locator('[data-rally]').isVisible());assert(await page.evaluate(()=>document.querySelector('.arena-coop').scrollWidth<=innerWidth));
 await page.setViewportSize({width:1440,height:1000});
 // Accelerate the actual stepper, keeping all events and the normal finish callback.
 await page.evaluate(()=>{const step=ArenaCoopCore.step;ArenaCoopCore.step=(s,dt)=>{for(let i=0;i<24;i++)step(s,dt);return s;};});
 await page.waitForSelector('[data-back]',{timeout:20000});const after=await saved();
 assert.equal(after.coopRuns,(before.coopRuns||0)+1);assert.equal(after.fights,before.fights);assert.equal(after.wins,before.wins);assert.deepEqual(after.pendingOpponent,entered.pendingOpponent);
 assert.equal(after.gold,before.gold+(after.coopLast.win?245:0));assert(after.roster.slice(0,5).every(h=>h.fatigue>=8&&h.xp>0));
 await page.waitForTimeout(400);assert.deepEqual(await saved(),after,'result frames do not award twice');
 await page.screenshot({path:'/tmp/coop-result.png'});await page.locator('[data-back]').click();assert.equal(await page.locator('[data-battle-mode="5v5"]').getAttribute('aria-pressed'),'true');
 await page.reload();await page.waitForFunction(()=>!!window.LudusBridge);const reload=await saved();assert.equal(reload.coopRuns,after.coopRuns);assert.equal(reload.gold,after.gold);assert.equal(reload.roster[0].xp,after.roster[0].xp);
 // A second match can retreat. Failed result save is retried without awarding again.
 await page.evaluate(()=>LudusBridge.fight());await pickFive();const beforeRetreat=await saved();await page.locator('#lcDeploy').click();await page.waitForTimeout(2000);
 await page.evaluate(()=>{window.realSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('QA quota');};});
 await page.locator('[data-exit]').click();await page.locator('[data-stay]').click();assert.equal(await page.locator('[data-back]').count(),0);
 await page.locator('[data-exit]').click();await page.locator('[data-retreat]').click();assert(await page.locator('[data-retry]').isVisible());
 await page.evaluate(()=>Storage.prototype.setItem=window.realSetItem);await page.locator('[data-retry]').click();assert(await page.locator('[data-retry]').isDisabled());
 const retreat=await saved();assert.equal(retreat.gold,beforeRetreat.gold);assert.equal(retreat.coopLast.reason,'retreat');assert.equal(retreat.roster[0].xp,beforeRetreat.roster[0].xp);
 await page.locator('[data-back]').click();await page.locator('[data-battle-mode="1v1"]').click();assert.match(await page.locator('#lcDeploy').innerText(),/출전/);assert.equal(await page.locator('[data-enemy-art]').count(),1);
 await page.locator('#lcDeploy').click();await page.waitForFunction(()=>__arenaQA.state.phase==='fight',{timeout:15000});assert.equal(await page.locator('.arena-coop').count(),0);
 await page.reload();await page.waitForFunction(()=>!!window.LudusPractice);await page.evaluate(()=>LudusBridge.practice());assert(await page.locator('#endlessPractice').isVisible());assert.match(await page.locator('#epChosen').innerText(),/4명/);await page.locator('#endlessPractice [data-do="exit"]').first().click();
 assert.deepEqual(errors,[]);console.log('PASS: browser desktop/mobile, five-unit selection, ten live actors, pause, commands, actual full result, once-only rewards, retreat, save failure rollback/retry, reload and 1v1 return.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.kill());
