/* Temporary, test-only sprite fixture. GitHub production art remains unchanged.
 * Verify one approved new fighter reaches editor, market, roster and battle art.
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const ID='murmillo_qa_sync_v1',FOLDER='assets/combat/qa-gladiator-sync';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:1});
 const studio=await context.newPage(),errors=[];
 studio.on('pageerror',e=>errors.push('studio: '+e.message));
 await studio.goto('http://127.0.0.1:8765/tools/practice-scale-calibrator.html',{waitUntil:'domcontentloaded'});
 await studio.waitForFunction(()=>Boolean(window.SpartacusScaleStudio?.priceLevels&&window.SpartacusScalePublisher?.source),{timeout:35000});
 assert.equal(await studio.locator('.price-level select').count(),27);
 const form=studio.locator('#registerGladiator');
 await form.locator('[name="visualId"]').fill(ID);
 await form.locator('[name="cls"]').selectOption('murmillo');
 await form.locator('[name="label"]').fill('QA 신규 검투사');
 await form.locator('[name="assetFolder"]').fill(FOLDER);
 await form.locator('[name="priceLevel"]').selectOption('3');
 await Promise.all([
  studio.waitForEvent('load',{timeout:100000}),
  form.locator('[type="submit"]').click()
 ]);
 await studio.waitForFunction(id=>Boolean(
  window.SpartacusScaleStudio?.priceLevels?.()[id]&&window.SpartacusGladiators?.get(id)
 ),ID,{timeout:100000});
 const studioData=await studio.evaluate(id=>{
  const registry=window.SpartacusGladiators,levels=window.SpartacusMarketPricing;
  const values=window.SpartacusScalePublisher.valuesFrom(window.SpartacusScalePublisher.source());
  return {registry:registry.market().length,custom:registry.custom().length,
   cards:document.querySelectorAll('.card').length,prices:document.querySelectorAll('.price-level select').length,
   priceLevel:levels.levelFor(id),published:values.gladiators.find(g=>g.visualId===id),
   scales:Object.keys(values.scales).length,feet:Object.keys(values.feet).length,
   hasActionEditor:[...document.querySelectorAll('#actionKey option')].some(e=>e.value===id),
   priceEditor:!!document.getElementById('price-'+id)};
 },ID);
 assert.equal(studioData.registry,28);
 assert.equal(studioData.custom,1);
 assert.equal(studioData.priceLevel,3);
 assert.equal(studioData.prices,28);
 assert.ok(studioData.scales>=34&&studioData.feet>=34);
 assert.equal(studioData.cards,34);
 assert.ok(studioData.hasActionEditor&&studioData.priceEditor);
 assert.equal(studioData.published.assetFolder,FOLDER);
 assert.equal(studioData.published.cls,'murmillo');
 const game=await context.newPage();game.on('pageerror',e=>errors.push('game: '+e.message));
 await game.goto('http://127.0.0.1:8765/?__arena_qa=1',{waitUntil:'domcontentloaded'});
 await game.waitForFunction(id=>Boolean(
  window.SpartacusGladiators?.get(id)&&window.SlaveMarket?.open&&
  window.LudusBridge?.squadSprite&&window.SpartacusExtraGladiatorArt?.status(id)==='ready'
 ),ID,{timeout:100000});
 const gameInfo=await game.evaluate(id=>{
  const art=window.SpartacusExtraGladiatorArt,roster=window.LudusBridge.state().roster;
  const hero=window.LudusRoster.create('murmillo',roster.length+1,{
   name:'Gaius Valerius',visualId:id,appearance:id,growthType:'murmillo_a'
  });
  roster.push(hero);const index=roster.length-1;
  const portrait=window.LudusBridge.portrait(index);
  const combatFrame=window.LudusBridge.squadSprite(hero,'slash',0);
  const training=window.LudusBridge.trainingFrame(index,'heavy',0);
  const preview=window.LudusBridge.practiceFrame({side:'ally',index},'idle');
  const nominal=window.LudusBridge.practiceNominal({side:'ally',index});
  const s={gold:4500,roster:[],marketSeed:0,marketInventory:null,fights:0};
  window.SlaveMarket.open({state:s,save(){},getSprite:(cls,o)=>art.portrait(o.visualId),
   hire(o){s.gold-=o.cost;s.roster.push(o);return true;}});
  return {registry:window.SpartacusGladiators.market().length,
   stock:s.marketInventory?.length,priceCount:window.SpartacusMarketPricing.LOOK_IDS.length,
   portrait:!!portrait?.width,combatFrame:!!combatFrame?.width,training:!!training?.width,
   practice:!!preview?.canvas?.width,nominal,
   tier:s.marketInventory?.find(x=>x?.visualId===id)?.priceLevel};
 },ID);
 assert.equal(gameInfo.registry,28);
 assert.equal(gameInfo.stock,28);
 assert.equal(gameInfo.priceCount,28);
 assert.equal(gameInfo.tier,3);
 assert.ok(gameInfo.portrait&&gameInfo.combatFrame&&gameInfo.training&&gameInfo.practice,JSON.stringify(gameInfo));
 assert.deepEqual(gameInfo.nominal,{width:960,height:540});
 await game.locator('#gmNextPage').click({timeout:18000});
 for(let i=1;i<9;i++)await game.locator('#gmNextPage').click({timeout:18000});
 const pageStatus=await game.locator('#gmPageStatus').textContent();
 assert.ok(pageStatus.startsWith('10 / 10')&&pageStatus.includes('28종'),pageStatus);
 const name=await game.locator('#gmCard0 .gm-roman-name').textContent();
 assert.match(name,/^[A-Z][a-z]+ [A-Z][a-z]+$/);
 assert.deepEqual(errors,[],errors.join('\n'));
 console.log('GLADIATOR_REGISTRY_BIDIRECTIONAL_PASS '+JSON.stringify({studioData,gameInfo,pageStatus}));
 await context.close();
}finally{await browser.close()}
