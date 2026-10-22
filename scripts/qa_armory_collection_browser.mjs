import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {chromium} from 'playwright';
const sandbox={globalThis:{}};
vm.runInNewContext(readFileSync(new URL('../public/arena-gear-catalog.js',import.meta.url),'utf8'),sandbox);
const model=sandbox.globalThis.ArenaGearCatalog;
assert.equal(model.items.length,44);
assert.equal(new Set(model.items.map(g=>g.id)).size,44);
assert.equal(model.items.filter(g=>g.slot==='weapon').length,16);
assert.equal(model.items.filter(g=>g.slot==='shield').length,14);
assert.equal(model.items.filter(g=>g.slot==='armor').length,14);
for(const id of ['wood','iron','shield','elite'])assert.ok(model.items.some(g=>g.id===id));
for(const g of model.items)assert.ok(readFileSync(new URL('../public/'+g.icon,import.meta.url),'utf8').startsWith('<svg '),g.id);
const venatio=model.summary({equipment:{weapon:'venatio_blade',shield:'venatio_shield',armor:'venatio_hide'}});
assert.equal(venatio.pieces.venatio,3);
assert.ok(venatio.beastDamage>=.30&&venatio.injuryReduction===.20);
const training=model.summary({equipment:{weapon:'trainer_blade',shield:'trainer_shield',armor:'trainer_armor'}});
assert.equal(training.pieces.training,3);assert.ok(training.trainingDiscount>=.20);
assert.equal(training.fatigueReduction,.15);
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1672,height:941}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto('http://127.0.0.1:8765/?__arena_qa=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.LudusApprovedScenes?.open&&window.LudusBridge?.gearSummary,{timeout:25000});
 await page.evaluate(()=>LudusApprovedScenes.open('gear'));
 await page.waitForSelector('.ra-collection .ra-list');
 assert.equal(await page.locator('.ra-item').count(),44);
 assert.equal(await page.locator('.ra-item-img').count(),45);
 await page.waitForFunction(()=>document.querySelector('.ra-collection .ra-item-img')?.naturalWidth>0,{timeout:25000});
 assert.ok(await page.locator('.ra-flag').count()>=40);
 assert.equal(await page.locator('.ra-stat-diff').count(),3);
 await page.locator('[data-item="trainer_blade"]').click();
 assert.ok((await page.locator('.ra-detail-title').innerText()).includes('루두스 훈련검'));
 const before=await page.evaluate(()=>LudusBridge.state().gold);
 await page.locator('#raEquip').click();
 const after=await page.evaluate(()=>LudusBridge.state().gold);
 assert.equal(before-after,950);
 assert.equal(await page.locator('.ra-detail-title span.worn').count(),1);
 assert.equal(await page.evaluate(()=>LudusBridge.state().roster[LudusBridge.state().active].equipment.weapon),'trainer_blade');
 await page.locator('#raRemove').click();
 assert.equal(await page.locator('.ra-detail-title span.owned').count(),1);
 assert.equal(await page.evaluate(()=>LudusBridge.state().roster[LudusBridge.state().active].equipment.weapon),null);
 assert.equal(await page.evaluate(()=>LudusBridge.state().gold),after);
 await page.locator('[data-cat="shield"]').click();
 assert.equal(await page.locator('.ra-item').count(),14);
 await page.locator('#raRarity').selectOption('legendary');
 assert.equal(await page.locator('.ra-item').count(),2);
 await page.locator('#raRarity').selectOption('all');
 await page.locator('[data-cat="all"]').click();
 await page.locator('#raSet').click();
 assert.equal(await page.locator('.ra-item').count(),15);
 await page.locator('#raSet').click();
 await page.locator('#raOwned').click();
 assert.ok(await page.locator('.ra-item').count()>=2);
 await page.locator('#raOwned').click();
 assert.equal(await page.locator('.ra-item').count(),44);
 // Portrait phone: armory must NOT be a tiny 1672px image scaled down.
 await page.setViewportSize({width:390,height:844});
 const portraitMetrics=await page.evaluate(()=>{
  const stage=document.querySelector('.la-stage.armory');
  const root=document.querySelector('.ra-collection');
  const body=document.querySelector('.ra-list');
  const flag=document.querySelector('.ra-flag');
  const price=document.querySelector('.ra-detail-title strong');
  const overlay=document.querySelector('.la-orient');
  return {
   stageW:stage.getBoundingClientRect().width,
   stageH:stage.getBoundingClientRect().height,
   rootW:root.getBoundingClientRect().width,
   viewport:window.innerWidth,
   scroll:root.scrollHeight>root.clientHeight,
   textPx:parseFloat(getComputedStyle(flag).fontSize),
   pricePx:parseFloat(getComputedStyle(price).fontSize),
   orientationHidden:getComputedStyle(overlay).display==='none',
   listingWidth:body.getBoundingClientRect().width,
   itemWidth:body.querySelector('.ra-item').getBoundingClientRect().width
  };
 });
 assert.ok(Math.abs(portraitMetrics.stageW-390)<1.5,JSON.stringify(portraitMetrics));
 assert.ok(portraitMetrics.stageH>=840);
 assert.ok(portraitMetrics.scroll,'portrait armory must scroll');
 assert.ok(portraitMetrics.textPx>=16,'ownership and price stamps readable');
 assert.ok(portraitMetrics.pricePx>=24,'important prices bold and large');
 assert.equal(portraitMetrics.orientationHidden,true);
 assert.ok(portraitMetrics.itemWidth<=portraitMetrics.listingWidth+1);
 // Landscape phone: stay in familiar widescreen composition but with
 // visibly enlarged text and stronger purchase / equip indicators.
 await page.setViewportSize({width:844,height:390});
 const landscapeMetrics=await page.evaluate(()=>{
  const flag=document.querySelector('.ra-flag'),name=document.querySelector('.ra-item-copy strong');
  return {flag:parseFloat(getComputedStyle(flag).fontSize),
   name:parseFloat(getComputedStyle(name).fontSize),
   columns:getComputedStyle(document.querySelector('.ra-list')).gridTemplateColumns.split(' ').length};
 });
 assert.ok(landscapeMetrics.flag>=26,JSON.stringify(landscapeMetrics));
 assert.ok(landscapeMetrics.name>=29);
 assert.equal(landscapeMetrics.columns,1,'show full-width inventory rows on mobile landscape');
 assert.deepEqual(errors,[],'no browser runtime errors');
 console.log('ARMORY_COLLECTION_BROWSER_PASS');
}finally{await browser.close();}
