/* Browser QA for the Spartacus pricing studio and market: no fake deployment state. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:1});
 const studio=await context.newPage();
 await studio.goto('http://127.0.0.1:8765/tools/practice-scale-calibrator.html',{waitUntil:'domcontentloaded'});
 await studio.waitForFunction(()=>Boolean(window.SpartacusScaleStudio?.priceLevels&&window.SpartacusScalePublisher?.source),{timeout:30000});
 assert.equal(await studio.locator('.price-level select').count(),27,'all 27 human looks editable');
 assert.equal(await studio.locator('.card[data-look^="beast_"] .price-level').count(),0,'beasts cannot be priced');
 assert.equal(await studio.locator('.card[data-look^="npc_"] .price-level').count(),0,'executioner cannot be priced');
 const target='#price-murmillo_redcrest_alt_v1',tierBefore=await studio.locator(target).inputValue();
 assert.equal(tierBefore,'4','redcrest II begins with balanced tier four');
 await studio.locator(target).selectOption('1');
 const result=await studio.evaluate(()=>{
  const id='murmillo_redcrest_alt_v1';
  const pricing=window.SpartacusMarketPricing;
  const stored=JSON.parse(localStorage.getItem(pricing.STORAGE_KEY));
  const payload=window.SpartacusScalePublisher.source();
  const decoded=window.SpartacusScalePublisher.valuesFrom(payload);
  return {draft:stored[id],level:pricing.levelFor(id),
    storedCount:Object.keys(stored).length,published:decoded.priceLevels[id],
    publishedCount:Object.keys(decoded.priceLevels).length,
    hasSize:payload.includes('SpartacusPublishedScales'),
    hasFoot:payload.includes('SpartacusPublishedFeet'),
    hasActions:payload.includes('SpartacusPublishedActions'),
    hasPrices:payload.includes('SpartacusPublishedMarketPrices')};
 });
 assert.equal(result.draft,1);assert.equal(result.level,1);
 assert.equal(result.storedCount,27);assert.equal(result.published,1);
 assert.equal(result.publishedCount,27);
 assert.ok(result.hasSize&&result.hasFoot&&result.hasActions&&result.hasPrices);
 await studio.reload({waitUntil:'domcontentloaded'});
 await studio.waitForFunction(()=>Boolean(window.SpartacusScaleStudio?.priceLevels));
 assert.equal(await studio.locator(target).inputValue(),'1','device draft survives reload');
 const game=await context.newPage();
 await game.goto('http://127.0.0.1:8765/?__arena_qa=1',{waitUntil:'domcontentloaded'});
 await game.waitForFunction(()=>Boolean(window.SlaveMarket?.open&&window.SpartacusMarketPricing?.quote&&
   window.SpartacusPublishedMarketPrices),{timeout:30000});
 const market=await game.evaluate(()=>{
  const s={gold:3200,roster:[{name:'Marcus Aurelius',cost:15000,vals:[6,4,7,5]}],
   fights:0,marketSeed:2,marketInventory:null};
  window.__marketPriceQAState=s;
  window.SlaveMarket.open({state:s,save(){},getSprite(){return null},
   hire(offer){if(s.gold<offer.cost)return false;s.gold-=offer.cost;s.roster.push({...offer});return true;}});
  const all=s.marketInventory;
  const id='murmillo_redcrest_alt_v1',special=all.find(o=>o?.visualId===id);
  const before=special?.cost;
  // Reproduce an actual older save with a 10,720 D unsold rare candidate.
  special.cost=10720;special.priceLevel=0;special.priceModelVersion=0;
  window.SlaveMarket.refresh();
  const final=s.marketInventory.find(o=>o?.visualId===id);
  return {count:all.filter(Boolean).length,max:Math.max(...all.filter(Boolean).map(o=>o.cost)),
   min:Math.min(...all.filter(Boolean).map(o=>o.cost)),before,
   cost:final.cost,level:final.priceLevel,model:final.priceModelVersion,
   rosterCost:s.roster[0].cost,rosterStats:s.roster[0].vals.join(',')};
 });
 assert.equal(market.count,27);
 assert.ok(market.max<=1450,JSON.stringify(market));
 assert.ok(market.min>=390,JSON.stringify(market));
 assert.ok(market.cost<=450&&market.cost>=390,JSON.stringify(market));
 assert.equal(market.before,market.cost);assert.equal(market.level,1);
 assert.equal(market.model,2);
 assert.equal(market.rosterCost,15000);assert.equal(market.rosterStats,'6,4,7,5');
 // A reset in the studio restores the published/default tier, not a hard-coded old 10k price.
 studio.on('dialog',dialog=>dialog.accept());
 await studio.locator('#reset').click();
 assert.equal(await studio.locator(target).inputValue(),'4','reset restored published tier');
 assert.equal(await studio.evaluate(()=>window.SpartacusMarketPricing.levelFor('murmillo_redcrest_alt_v1')),4);
 console.log('MARKET_PRICE_STUDIO_PASS '+JSON.stringify({editorLooks:27,market,priceDraft:result}));
 await context.close();
}finally{await browser.close()}
