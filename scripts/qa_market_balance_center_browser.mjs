// Regression: market balance visible at startup, centered clear of actionable zones,
// actual purchase updates the number and readable sizes survive landscape scaling.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const viewport of [{width:844,height:390},{width:1280,height:720}]){
  const page=await browser.newPage({viewport,deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  try{
   await page.goto('http://127.0.0.1:8765/?__arena_qa=1',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!window.SlaveMarket?.open,{timeout:24000});
   await page.evaluate(()=>{
    const s={gold:3200,roster:[],fights:0,marketSeed:0};
    window.__marketBalanceQAState=s;
    window.SlaveMarket.open({state:s,save(){},getSprite(){return null},
     hire(offer){if(s.gold<offer.cost)return false;s.gold-=offer.cost;s.roster.push({name:offer.name});return true;}
    });
   });
   await page.waitForSelector('#slaveMarket:not([hidden]) #gmWallet:not([hidden])');
   const metrics=await page.evaluate(()=>{
    const $=q=>document.querySelector(q),stage=$('#gmStage'),wallet=$('#gmWallet'),amount=$('.gm-wallet-amount');
    const root=stage.getBoundingClientRect(),rect=wallet.getBoundingClientRect(),scale=root.width/1672;
    const hits=['#gmBack','#gmRestock','#gmHire','#gmCard0','#gmCard1','#gmCard2'];
    const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
                         Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
    return {amount:amount.textContent,visible:!!rect.width&&!!rect.height,
     x:(rect.left-root.left)/scale,y:(rect.top-root.top)/scale,
     width:wallet.offsetWidth,height:wallet.offsetHeight,
     amountSize:parseFloat(getComputedStyle(amount).fontSize),
     visualAmountPx:parseFloat(getComputedStyle(amount).fontSize)*scale,
     amountFits:amount.scrollWidth<=amount.clientWidth,
     overlaps:Object.fromEntries(hits.map(name=>[name,Math.round(overlap(rect,$(name).getBoundingClientRect()))])),
     walletPointer:getComputedStyle(wallet).pointerEvents,
     maskPointer:getComputedStyle($('.gm-wallet-legacy-mask')).pointerEvents};
   });
   assert.equal(metrics.amount,'3,200','initial balance must always be visible');
   assert.ok(metrics.visible&&metrics.x>1120&&metrics.x<1170&&metrics.y>=0&&metrics.y<25,JSON.stringify(metrics));
   assert.ok(metrics.width>=410&&metrics.height>=75&&metrics.amountSize>=45,JSON.stringify(metrics));
   assert.ok(metrics.visualAmountPx>=17,'mobile landscape number remains readable');
   assert.ok(metrics.amountFits,'balance must fit its plaque');
   console.log('MARKET_GEOMETRY_DEBUG '+JSON.stringify(metrics));
   assert.deepEqual(Object.values(metrics.overlaps),[0,0,0,0,0,0],'wallet must not obscure any market button');
   assert.equal(metrics.walletPointer,'none');
   assert.equal(metrics.maskPointer,'none');
   await page.locator('#gmHire').click();
   await page.locator('#gmDialog:not([hidden]) #gmConfirm').click();
   const bought=await page.evaluate(()=>({
    gold:window.__marketBalanceQAState.gold,
    displayed:document.querySelector('.gm-wallet-amount')?.textContent,
    recruits:window.__marketBalanceQAState.roster.length,
    inventory:window.__marketBalanceQAState.marketInventory.filter(Boolean).length
   }));
   assert.equal(bought.gold,2700,'hire charges 500 once');
   assert.equal(bought.displayed,'2,700','live balance updates on the actual purchase');
   assert.equal(bought.recruits,1);
   assert.equal(bought.inventory,2);
   const soldBox=await page.evaluate(()=>{
    const stage=document.querySelector('#gmStage').getBoundingClientRect(),
     pane=document.querySelector('#gmVacant0'),
     rect=pane.getBoundingClientRect(),scale=stage.width/1672;
    return {visible:!pane.hidden,
     x:(rect.left-stage.left)/scale,y:(rect.top-stage.top)/scale,
     w:pane.offsetWidth,h:pane.offsetHeight,
     badge:pane.querySelector('.gm-vacant-badge')?.textContent,
     aboveCharacter:((rect.top-stage.top)/scale)<520};
   });
   assert.equal(soldBox.visible,true,'sold plaque displays for purchased first slot');
   assert.ok(soldBox.y>=525&&soldBox.y<=535&&soldBox.h<=205,
    'sold plaque must cover stats ONLY, not character: '+JSON.stringify(soldBox));
   assert.ok(soldBox.x>=490&&soldBox.x<=495&&soldBox.w<=230);
   assert.equal(soldBox.aboveCharacter,false);
   assert.ok(soldBox.badge.includes('판매 완료'));
   await page.locator('#gmCancel').click();
   // Large figures still use the same panel rather than spilling into a nearby button.
   await page.evaluate(()=>{window.__marketBalanceQAState.gold=987654321;window.SlaveMarket.refresh();});
   const large=await page.evaluate(()=>({
    text:document.querySelector('.gm-wallet-amount').textContent,
    fits:document.querySelector('.gm-wallet-amount').scrollWidth<=document.querySelector('.gm-wallet-amount').clientWidth,
    selected:document.querySelector('#gmCard1').getAttribute('aria-pressed')
   }));
   assert.equal(large.text,'987,654,321');assert.ok(large.fits,'large balances must stay inside plaque');
   await page.evaluate(()=>{
     const stock=window.__marketBalanceQAState.marketInventory;
     stock[1]=null;stock[2]=null;
     window.SlaveMarket.refresh();
   });
   const soldRegions=await page.evaluate(()=>{
     const stage=document.querySelector('#gmStage').getBoundingClientRect(),scale=stage.width/1672;
     return [...document.querySelectorAll('.gm-vacant')].map(el=>{
      const b=el.getBoundingClientRect();
      return {visible:!el.hidden,x:(b.left-stage.left)/scale,y:(b.top-stage.top)/scale,
       width:b.width/scale,height:b.height/scale};
     });
   });
   assert.equal(soldRegions.length,3);
   assert.ok(soldRegions.every(v=>v.visible&&v.y>=525&&v.y<535&&v.height<205),
    'all three sold plaques must stay inside stat area: '+JSON.stringify(soldRegions));
   assert.ok(soldRegions[1].x>=835&&soldRegions[2].x>=1175);
   assert.deepEqual(errors,[],'browser JS errors');
   console.log('MARKET_BALANCE_CENTER_PASS '+JSON.stringify({viewport,metrics,bought,large,soldBox,soldRegions}));
  }finally{await page.close()}
 }
}finally{await browser.close()}
