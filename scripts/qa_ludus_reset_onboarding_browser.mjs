import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:800}});
const errors=[];page.on('pageerror',error=>errors.push(String(error)));
const storageKey='gladiator.ludus.v1';

try{
 await page.goto('http://127.0.0.1:8765/?qa=ludus-reset-v1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.LudusBridge?.state&&window.SlaveMarket?.open&&window.LudusScene?.open,{timeout:30000});

 // Fresh installation has zero auto-provisioned gladiators and begins at the market.
 const fresh=await page.evaluate(()=>({roster:LudusBridge.state().roster.length,gold:LudusBridge.state().gold,subtitle:document.querySelector('#careerEnter small').textContent}));
 assert.equal(fresh.roster,0,'no free gladiators on a new Ludus');
 assert.equal(fresh.gold,3200,'new-game wallet should be 3200D');
 assert.match(fresh.subtitle,/검투사시장/);
 await page.locator('#careerEnter').click();
 await page.waitForFunction(()=>!document.querySelector('#slaveMarket')?.hidden,{timeout:12000});
 assert.equal(await page.locator('#startScreen').isHidden(),true,'title should not block the market');
 assert.equal(await page.locator('#gmWallet .gm-wallet-amount').innerText(),'3,200');
 
 // Hire a real unit, then verify regular Blood & Glory starts from Ludus.
 await page.locator('#gmHire').click();
 await page.locator('#gmDialog:not([hidden]) #gmConfirm').click();
 await page.waitForFunction(()=>LudusBridge.state().roster.length===1);
 await page.locator('#gmDialog:not([hidden]) #gmConfirm').click();
 await page.waitForFunction(()=>!document.querySelector('#ludusScene')?.hidden,{timeout:12000});
 const savedBefore=await page.evaluate(key=>localStorage.getItem(key),storageKey);
 assert.equal(JSON.parse(savedBefore).roster.length,1);
 assert.equal(JSON.parse(savedBefore).gold,2700);
 await page.locator('#ludusScene [data-action="back"]').click();
 await page.waitForFunction(()=>!document.querySelector('#startScreen').hidden);
 assert.match(await page.locator('#careerEnter small').innerText(),/루두스 입장/);

 // Compact top-right action stays visible at landscape-phone dimensions.
 await page.setViewportSize({width:844,height:390});
 const bounds=await page.locator('#ludusResetOpen').boundingBox();
 assert.ok(bounds&&bounds.width<145&&bounds.height>=30&&bounds.x+bounds.width>690&&bounds.y<55,
  'reset button should be compact, top-right, and tap-friendly: '+JSON.stringify(bounds));
 await page.locator('#ludusResetOpen').click();
 assert.equal(await page.locator('#ludusResetDialog').isVisible(),true);
 assert.equal(await page.locator('#ludusResetMessage').textContent(),'진짜  아가들 다 버리는 겁니까? ㅠㅠ');
 assert.equal(await page.locator('#ludusResetCancel').innerText(),'헉! 취소');
 assert.equal(await page.locator('#ludusResetConfirm').innerText(),'응, 안녕~');

 // Cancel must never touch currency, gladiators or the serialized career.
 await page.locator('#ludusResetCancel').click();
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),storageKey),savedBefore);
 assert.equal(await page.locator('#ludusResetDialog').isHidden(),true);

 // Escape also cancels; Tab stays within the destructive-choice dialog.
 await page.locator('#ludusResetOpen').click();
 await page.keyboard.press('Shift+Tab');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'ludusResetConfirm');
 await page.keyboard.press('Escape');
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),storageKey),savedBefore);

 // Explicit confirmation removes all old heroes, money, opponents and market stock.
 await page.locator('#ludusResetOpen').click();
 await page.locator('#ludusResetConfirm').click();
 assert.equal(await page.locator('#ludusResetDialog').isHidden(),true);
 const cleared=await page.evaluate(key=>({
  career:JSON.parse(localStorage.getItem(key)),
  roster:LudusBridge.state().roster.length,
  subtitle:document.querySelector('#careerEnter small').textContent
 }),storageKey);
 assert.equal(cleared.roster,0);
 assert.equal(cleared.career.roster.length,0);
 assert.equal(cleared.career.gold,3200);
 assert.equal(cleared.career.fights,0);
 assert.equal(cleared.career.wins,0);
 assert.equal(cleared.career.glory,0);
 assert.equal(cleared.career.pendingOpponent,null);
 assert.equal(cleared.career.marketInventory,null);
 assert.equal(cleared.career.marketSeed,0);
 assert.match(cleared.subtitle,/검투사시장/);
 
 // Reload must NOT re-insert the previous two complimentary fighters.
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.LudusBridge?.state&&window.SlaveMarket?.open,{timeout:30000});
 assert.equal(await page.evaluate(()=>LudusBridge.state().roster.length),0);
 await page.locator('#careerEnter').click();
 await page.waitForFunction(()=>!document.querySelector('#slaveMarket')?.hidden);
 assert.equal(await page.locator('#ludusScene').isHidden(),true);
 assert.deepEqual(errors,[],'reset/onboarding must not produce JavaScript page errors');
 console.log('LUDUS_RESET_MARKET_FIRST_BROWSER_PASS '+JSON.stringify({fresh,bounds,cleared}));
}finally{await browser.close();}
