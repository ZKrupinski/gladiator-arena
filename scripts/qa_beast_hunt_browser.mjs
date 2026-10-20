import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
assert.ok(!html.includes('maybeArenaBeast(S.enemy,'),'No beast spawns in normal arena or gauntlet');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:740}});
const errors=[];page.on('pageerror',err=>errors.push(err.message));
async function win(){await page.evaluate(()=>{const s=__arenaQA.state;s.resultWin=true;s.resultApplied=true;s.enemy.hp=0;s.enemy.dead=true;s.phase='finisher';s.slow=-1;});await page.waitForFunction(()=>__arenaQA.state.phase==='result',{timeout:10000});}
async function lose(){await page.evaluate(()=>{const s=__arenaQA.state;s.resultWin=false;s.resultApplied=true;s.player.hp=0;s.player.dead=true;s.phase='finisher';s.slow=-1;});await page.waitForFunction(()=>__arenaQA.state.phase==='result',{timeout:10000});}
try{
 await page.goto('http://127.0.0.1:8765/?__arena_qa=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__arenaQA?.state&&window.LudusBridge&&window.LudusScene,{timeout:25000});
 // Entrance must be visible from the title: do not hide VENATIO in the LUDUS artwork.
 assert.equal(await page.locator('#titleBeastEnter').isVisible(),true);
 assert.equal(await page.locator('#beastQuickAccess').isVisible(),true);
 await page.locator('#titleBeastEnter').click();
 await page.waitForSelector('#careerHub:not([hidden]) .beast-stage-card');
 assert.equal((await page.locator('#careerBeastTab').innerText()).includes('야수전'),true);
 await page.locator('#careerExit').click();
 await page.locator('#careerEnter').click();
 assert.equal(await page.locator('#ludusScene .ll-beast-quick').isVisible(),true);
 await page.locator('#ludusScene .ll-beast-quick').click();
 await page.waitForSelector('#careerHub:not([hidden]) .beast-stage-card');
 assert.equal(await page.locator('.beast-stage-card').count(),5);
 const types=['wolf','leopard','tiger','lion','elephant'];
 for(const type of types){
  const card=page.locator('.beast-stage-card').filter({has:page.locator('[data-beast-stage="'+type+'"]')});
  assert.match(await card.locator('.beast-stage-thumb').getAttribute('style'),new RegExp(type+'-40.png'));
 }
 assert.ok(await page.locator('#beastHeroSelect option').count()>0,'starter gladiator present');
 const initial=await page.evaluate(()=>LudusBridge.state().gold);
 await page.locator('[data-beast-stage="wolf"]').click();
 for(let i=0;i<3;i++){
  await page.waitForFunction(()=>__arenaQA.state.phase==='fight',{timeout:12000});
  assert.equal(await page.evaluate(()=>__arenaQA.state.enemy.beastType),'wolf');
  await win();
  assert.equal(await page.locator('#continueBtn').innerText(),i<2?'다음 야수 상대하기':'야수전으로');
  assert.equal(await page.evaluate(()=>LudusBridge.state().gold),initial+(i===2?300:0),'reward on final victory only');
  await page.locator('#continueBtn').click();
 }
 await page.waitForSelector('#careerHub:not([hidden]) .beast-stage-card');
 const receipt=await page.evaluate(()=>JSON.parse(localStorage.getItem('gladiator.ludus.v1')).lastPrize);
 assert.equal(receipt.mode,'beast_hunt');assert.equal(receipt.gold,300);
 for(const type of types.slice(1)){
  await page.locator('[data-beast-stage="'+type+'"]').click();
  await page.waitForFunction(()=>__arenaQA.state.phase==='fight',{timeout:10000});
  assert.equal(await page.evaluate(()=>__arenaQA.state.enemy.beastType),type);
  if(type==='elephant'){
   await page.waitForFunction(()=>ArenaBeasts.status().ready.includes('elephant'),{timeout:30000});
   const visible=await page.evaluate(()=>{
    const c=document.createElement('canvas');c.width=650;c.height=450;
    const g=c.getContext('2d'),active=ArenaBeasts.draw(g,{fighter:__arenaQA.state.enemy,pose:'idle',clock:1,x:90,y:50,w:440,h:320});
    const a=g.getImageData(0,0,650,450).data;let ink=0;for(let i=3;i<a.length;i+=4)if(a[i]>30)ink++;
    return active&&ink>2500;
   });
   assert.ok(visible,'elephant isolated image is visible');
  }
  await lose();
  // Test-only: reset accumulated injuries after intentionally forcing a loss.
  await page.evaluate(()=>{for(const h of LudusBridge.state().roster){h.injury=0;h.fatigue=0;}});
  await page.locator('#continueBtn').click();
  await page.waitForSelector('#careerHub:not([hidden]) .beast-stage-card');
 }
 assert.deepEqual(errors,[],'no page script errors');
 console.log('VENATIO_FIVE_BEAST_STAGE_PAYOUT_E2E_PASS');
}finally{await browser.close();}
