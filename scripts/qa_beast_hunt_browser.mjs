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
 // Beast menu must exist ONLY inside the Ludus arena preparation screen.
 assert.equal(await page.locator('#titleBeastEnter').count(),0);
 assert.equal(await page.locator('#beastQuickAccess').count(),0);
 assert.ok((await page.locator('#careerEnter').innerText()).includes('BLOOD'));
 assert.equal(await page.locator('#startBtn').isVisible(),false);
 await page.locator('#careerEnter').click();
 assert.equal(await page.locator('#ludusScene .ll-beast-quick').count(),0);
 await page.locator('#ludusScene .ll-menu [data-action="arena"]').click();
 await page.waitForSelector('#careerHub:not([hidden]) .lc-mode-picker');
 assert.equal(await page.locator('.lc-mode-picker button').count(),6);
 const buttons=await page.locator('.lc-mode-picker button').allTextContents();
 assert.equal(buttons[5].includes('야수전'),true);
 const modeRow=await page.locator('.lc-mode-picker button').evaluateAll(items=>items.map(el=>({x:el.getBoundingClientRect().x,w:el.getBoundingClientRect().width})));
 assert.equal(modeRow.every((v,i)=>v.w>30&&(i===0||v.x>modeRow[i-1].x)),true,'six modes fit the same horizontal row');
 await page.locator('.lc-mode-picker [data-beast-hunt]').click();
 await page.waitForSelector('#careerHub:not([hidden]) .venatio-versus-layout');
 assert.equal(await page.locator('.venatio-versus-layout').count(),1);
 const types=['wolf','leopard','tiger','lion','elephant'];
 for(const type of types){
  await page.locator('#beastTypeSelect').selectOption(type);
  assert.equal(await page.locator('#beastSpotlightPreview').getAttribute('data-beast-preview'),type);
  await page.waitForFunction(kind=>kind==='wolf'?ArenaBeasts.status().wolfV3.status==='ready':BeastStagePreviews.status().loaded.includes(kind),type,{timeout:45000});
  await page.waitForFunction(()=>{
   const c=document.getElementById('beastSpotlightPreview'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
   for(let i=3;i<d.length;i+=64)if(d[i]>60)return true;return false;
  },{timeout:15000});
 }
 await page.locator('#beastTypeSelect').selectOption('wolf');
 await page.locator('#beastNext').click();assert.equal(await page.locator('#beastTypeSelect').inputValue(),'leopard');
 await page.locator('#beastPrev').click();assert.equal(await page.locator('#beastTypeSelect').inputValue(),'wolf');
 assert.ok(await page.locator('#beastHeroSelect option').count()>0,'starter gladiator present');
 assert.equal(await page.locator('#beastHeroSelect').isVisible(),false,'old selector must be hidden');
 assert.equal(await page.locator('#beastHeroPortrait').count(),1);
 assert.equal(await page.locator('#beastHeroPrev').count(),1);
 assert.equal(await page.locator('#beastHeroNext').count(),1);
 await page.waitForFunction(()=>{
  const c=document.querySelector('#beastHeroPortrait');
  if(!c)return false;
  const rgba=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
  for(let i=3;i<rgba.length;i+=32)if(rgba[i]>64)return true;
  return false;
 },{timeout:45000});
 // Second available gladiator tests real carousel selection and thumbnail swaps.
 await page.evaluate(()=>{
  const roster=LudusBridge.state().roster,base=roster[0];
  roster.push({...base,name:'QA SECOND GLADIATOR',
   stats:{...base.stats},inventory:[...base.inventory],
   equipment:{...base.equipment},injury:0,fatigue:0});
  LudusBridge.section('beasts');
 });
 assert.equal(await page.locator('#beastHeroSelect option').count(),2);
 const firstHero=await page.locator('#beastHeroName').innerText();
 await page.locator('#beastHeroNext').click();
 assert.equal(await page.locator('#beastHeroSelect').inputValue(),'1');
 assert.equal(await page.locator('#beastHeroPortrait').getAttribute('data-roster-art'),'1');
 assert.match(await page.locator('#beastHeroName').innerText(),/QA SECOND GLADIATOR/);
 await page.locator('#beastHeroPrev').click();
 assert.equal(await page.locator('#beastHeroSelect').inputValue(),'0');
 assert.equal(await page.locator('#beastHeroName').innerText(),firstHero);
 await page.evaluate(()=>{LudusBridge.state().roster.pop();LudusBridge.section('beasts');});
 assert.equal(await page.locator('#beastHeroSelect option').count(),1);
 const initial=await page.evaluate(()=>LudusBridge.state().gold);
 await page.locator('#beastTypeSelect').selectOption('wolf');
 await page.locator('#beastStart').click();
 await page.waitForFunction(()=>__arenaQA.state.phase==='fight',{timeout:12000});
 await win();
 await page.waitForFunction(()=>{
  const canvas=document.querySelector('#loserPose canvas');if(!canvas)return false;
  const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
  for(let i=3;i<pixels.length;i+=32)if(pixels[i]>60)return true;
  return false;
 },{timeout:15000});
 const resultWolfBounds=await page.evaluate(()=>{
  const c=document.querySelector('#loserPose canvas'),a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
  let lo=c.width,hi=-1;
  for(let y=0;y<c.height;y+=2)for(let x=0;x<c.width;x+=2){
   if(a[(y*c.width+x)*4+3]>64){lo=Math.min(lo,x);hi=Math.max(hi,x);}
  }
  return {width:hi-lo+1};
 });
 assert.ok(resultWolfBounds.width>200,'result wolf must render visibly large');
 assert.equal(await page.locator('#againBtn').innerText(),'야수 선택으로 돌아가기');
 assert.equal(await page.locator('#continueBtn').innerText(),'다음 라운드 2/3');
 // Explicit back must NOT start another wolf fight.
 await page.locator('#againBtn').click();
 await page.waitForSelector('#careerHub:not([hidden]) .venatio-versus-layout');
 assert.equal(await page.locator('.venatio-versus-layout').count(),1);
 assert.equal(await page.evaluate(()=>__arenaQA.state.beastHunt),false);
 assert.equal(await page.evaluate(()=>LudusBridge.state().gold),initial,'no payout for abandoning 1/3');
 await page.locator('#beastTypeSelect').selectOption('wolf');
 await page.locator('#beastStart').click();
 for(let i=0;i<3;i++){
  await page.waitForFunction(()=>__arenaQA.state.phase==='fight',{timeout:12000});
  assert.equal(await page.evaluate(()=>__arenaQA.state.enemy.beastType),'wolf');
  await win();
  assert.equal(await page.locator('#againBtn').innerText(),'야수 선택으로 돌아가기');
  assert.equal(await page.locator('#continueBtn').innerText(),i<2?'다음 라운드 '+(i+2)+'/3':'전투 준비로 돌아가기');
  assert.equal(await page.evaluate(()=>LudusBridge.state().gold),initial+(i===2?300:0),'reward on final victory only');
  if(i<2)await page.locator('#continueBtn').click();
 }
 // Final choice A: choose a different species. No forced wolf rematch.
 await page.locator('#againBtn').click();
 await page.waitForSelector('#careerHub:not([hidden]) .venatio-versus-layout');
 const receipt=await page.evaluate(()=>JSON.parse(localStorage.getItem('gladiator.ludus.v1')).lastPrize);
 assert.equal(receipt.mode,'beast_hunt');assert.equal(receipt.gold,300);
 for(const type of types.slice(1)){
  await page.locator('#beastTypeSelect').selectOption(type);
  await page.locator('#beastStart').click();
  await page.waitForFunction(()=>__arenaQA.state.phase==='fight',{timeout:10000});
  assert.equal(await page.evaluate(()=>__arenaQA.state.enemy.beastType),type);
  await page.waitForFunction(type=>ArenaBeasts.status().individual.some(s=>s.name===type&&s.frames===40),type,{timeout:45000});
  const death=await page.evaluate(()=>{
   const e=__arenaQA.state.enemy;delete e._beastDeathSince;
   const one=ArenaBeasts.frameFor(e,'defeat',100).index;
   const two=ArenaBeasts.frameFor(e,'defeat',100.55).index;
   const end=ArenaBeasts.frameFor(e,'defeat',101.32).index;
   return [one,two,end];
  });
  assert.deepEqual(death,[0,3,7],type+' all 8 death frames must advance');
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
  assert.equal(await page.locator('#againBtn').innerText(),'야수 선택으로 돌아가기');
  assert.equal(await page.locator('#continueBtn').innerText(),'같은 야수 재도전');
  // Test-only: reset accumulated injuries after intentionally forcing a loss.
  await page.evaluate(()=>{for(const h of LudusBridge.state().roster){h.injury=0;h.fatigue=0;}});
  if(type==='leopard'){
    await page.locator('#continueBtn').click();
    await page.waitForFunction(()=>__arenaQA.state.phase==='fight',{timeout:10000});
    assert.equal(await page.evaluate(()=>__arenaQA.state.enemy.beastType),'leopard');
    await lose();
  }
  await page.locator('#againBtn').click();
  await page.waitForSelector('#careerHub:not([hidden]) .venatio-versus-layout');
  assert.equal(await page.evaluate(()=>__arenaQA.state.beastHunt),false);
 }
 // Final single-boss clear offers a distinct path to the six-mode draft.
 await page.locator('#beastTypeSelect').selectOption('elephant');
 await page.locator('#beastStart').click();
 await page.waitForFunction(()=>__arenaQA.state.phase==='fight',{timeout:12000});
 await win();
 assert.equal(await page.locator('#againBtn').innerText(),'야수 선택으로 돌아가기');
 assert.equal(await page.locator('#continueBtn').innerText(),'전투 준비로 돌아가기');
 await page.locator('#continueBtn').click();
 await page.waitForSelector('#careerHub:not([hidden]) .lc-mode-picker',{timeout:20000});
 assert.equal(await page.locator('.lc-mode-picker button').count(),6);
 assert.deepEqual(errors,[],'no page script errors');
 console.log('VENATIO_FIVE_BEAST_STAGE_PAYOUT_E2E_PASS');
}finally{await browser.close();}
