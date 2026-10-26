import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1680,height:950}});
const errors=[];
page.on('pageerror',err=>errors.push(String(err)));
try{
 await page.addInitScript(()=>{
  // Seed a fixture ONCE. Reload must read the actual saved outcome, not re-seed.
  if(localStorage.getItem('qa-innate-training-seeded-v72'))return;
  localStorage.setItem('qa-innate-training-seeded-v72','1');
  const hero={
   cls:'murmillo',name:'Atilius',level:21,xp:7,stats:{str:5,agi:3,end:6,focus:4},
   birthStats:{str:1,agi:6,end:8,focus:7},
   aptitudes:{str:.8,agi:1,end:1.15,focus:1.1},
   injury:0,fatigue:0,wins:4,fights:7,
   trainingAttempts:{str:10,agi:3,end:2,focus:2},
   growthType:'murmillo_a',appearance:null,
   equipment:{weapon:'wood',shield:null,armor:null,helmet:null,bracers:null},
   inventory:['wood']
  };
  localStorage.setItem('gladiator.ludus.v1',JSON.stringify({
   gold:4800,glory:20,fights:7,wins:4,roster:[hero],active:0,
   message:'훈련소 테스트',armoryInventory:[],discoveredGear:[],gearStorageV2:true
  }));
 });
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.LudusApprovedScenes?.open&&window.LudusTrainingRisk?.quote&&window.LudusBridge?.train,{timeout:25000});
 const info=await page.evaluate(()=>{
  const s=LudusBridge.state(),h=s.roster[0],low=LudusTrainingRisk.quote(h,'str'),
   high=LudusTrainingRisk.quote(h,'end');
  return {gold:s.gold,level:h.level,xp:h.xp,stats:{...h.stats},
   total:low.totalAttempts,low:low.percent,high:high.percent,
   cost:LudusBridge.trainingCost(0,'str')};
 });
 assert.equal(info.total,17);
 assert(info.low>info.high,'weak-at-birth STR should have higher training failure chance');
 await page.evaluate(()=>LudusApprovedScenes.open('training'));
 await page.waitForSelector('.la-stage.training .lt-risk-row',{timeout:25000});
 const riskView=await page.locator('.la-stage.training .lt-risk-row').textContent();
 assert(riskView.includes('총 17회')&&riskView.includes('선택 10회')&&riskView.includes('실패 '+info.low+'%'),
  'training UI should visibly show real saved attempts and odds: '+riskView);
 await page.evaluate(()=>{window.__originalRandom=Math.random;Math.random=()=>0;});
 await page.locator('.la-stage.training .lt-start-button').click();
 assert.equal(await page.locator('.la-stage.training .la-training-feedback').count(),0,
  'result badge must NOT appear on button press');
 assert.equal(await page.locator('.la-stage.training.training-resolving').count(),1,
  'fighter is awaiting real whip contact');
 await page.waitForFunction(()=>document.querySelector('.la-stage.training .lt-fighter-canvas')?.dataset.trainingResponse==='hit',{timeout:3500});
 assert.equal(await page.locator('.la-stage.training .la-training-feedback').count(),0,
  'failed trainee must visibly take the hit BEFORE the badge');
 await page.waitForFunction(()=>document.querySelector('.la-stage.training .la-training-speech')?.dataset.phase==='failed',{timeout:5000});
 const failureBadge=page.locator('.la-stage.training .la-training-feedback');
 assert.equal(await failureBadge.count(),1,'a single, large failure badge must appear after a real failed session');
 const failBadgeData=await failureBadge.evaluate(node=>{
  const b=node.getBoundingClientRect(),stage=document.querySelector('.la-stage.training').getBoundingClientRect();
  const comp=getComputedStyle(node);
  return {kind:node.dataset.outcome,duration:Number(node.dataset.durationMs),text:node.textContent,
   w:b.width,h:b.height,visible:comp.visibility,opacity:parseFloat(comp.opacity),
   svg:node.querySelector('svg')?.outerHTML||'',
   x:(b.left-stage.left)/((stage.width)/1672),y:(b.top-stage.top)/((stage.height)/941)};
 });
 assert.equal(failBadgeData.kind,'fail','actual failed training must show red failure artwork');
 assert(failBadgeData.text.includes('훈련 실패')&&failBadgeData.text.includes('성장 없음'),
  'large failure graphic must name outcome and explain no growth');
 assert(failBadgeData.svg.includes('la-result-glyph'),'training failure emblem SVG must exist');
 assert(failBadgeData.duration>=3000,'result must last long enough to read');
 assert(failBadgeData.w>=80&&failBadgeData.h>=65,'icon text should remain legible on scene');
 assert(failBadgeData.x>420&&failBadgeData.x<800&&failBadgeData.y>180&&failBadgeData.y<560,
  'emblem must appear in the center between instructor and fighter '+JSON.stringify(failBadgeData));
 await page.waitForTimeout(1880);
 assert.equal(await failureBadge.count(),1,'failure graphic must remain visible for at least ~2 seconds');
 assert((await failureBadge.evaluate(n=>parseFloat(getComputedStyle(n).opacity)))>.7,
  'failure graphic should not already be faded out during hold time');
 const failed=await page.evaluate(()=>{
  const s=LudusBridge.state(),h=s.roster[s.active],risk=LudusTrainingRisk.quote(h,'str');
  const stage=document.querySelector('.la-stage.training'),effect=stage.querySelector('.lt-effect'),
   guidance=stage.querySelector('.lt-guidance'),riskNode=stage.querySelector('.lt-risk-row');
  const b=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height}};
  return {gold:s.gold,level:h.level,xp:h.xp,stats:{...h.stats},attempts:h.trainingAttempts.str,
   total:risk.totalAttempts,speech:stage.querySelector('.la-speech-lines').textContent,
   status:s.message,riskText:riskNode.textContent,effect:b(effect),guide:b(guidance),
   count:s.roster.length};
 });
 assert.equal(failed.gold,info.gold-info.cost,'gold should be consumed even if repeated training fails');
 assert.deepEqual(failed.stats,info.stats,'failure cannot grant ANY ability');
 assert.equal(failed.xp,info.xp,'failure cannot grant XP');
 assert.equal(failed.level,info.level,'failure cannot grant levels');
 assert.equal(failed.attempts,11);
 assert.equal(failed.total,18);
 assert(failed.status.startsWith('훈련 실패!'),'failure should be unequivocal');
 assert(failed.speech.includes('훈련은 성과가 없었다'),'instructor should react to failure');
 assert(failed.riskText.includes('총 18회'));
 assert(failed.effect.bottom<failed.guide.top+2,'effect info must not cover guidance');
 const localStorageAfterFail=await page.evaluate(()=>JSON.parse(localStorage.getItem('gladiator.ludus.v1')));
 assert.equal(localStorageAfterFail.roster[0].trainingAttempts.str,11,
  'attempts must be saved in actual career roster');
 await page.evaluate(()=>{Math.random=()=>.999999;});
 await page.locator('.la-stage.training .lt-start-button').click();
 assert.equal(await page.locator('.la-stage.training .la-training-feedback').count(),0,
  'success must wait for the painted shield-block frame');
 await page.waitForFunction(()=>document.querySelector('.la-stage.training .lt-fighter-canvas')?.dataset.trainingResponse==='guard',{timeout:3500});
 assert.equal(await page.locator('.la-stage.training .la-training-feedback').count(),0,
  'blocking must precede success badge');
 await page.waitForFunction(()=>document.querySelector('.la-stage.training .la-training-feedback')?.dataset.outcome==='success',{timeout:5000});
 const successBadge=page.locator('.la-stage.training .la-training-feedback');
 assert.equal(await successBadge.count(),1,'success reuses the one emblem layer');
 const successMarkup=await successBadge.evaluate(n=>({
  kind:n.dataset.outcome,text:n.textContent,
  image:n.querySelector('svg')?.outerHTML||'',duration:Number(n.dataset.durationMs)
 }));
 assert.equal(successMarkup.kind,'success','real training success must display gold check artwork');
 assert(successMarkup.text.includes('훈련 성공')&&successMarkup.text.includes('상승'));
 assert(successMarkup.image.includes('la-result-glyph'));
 assert(successMarkup.duration>=3000);
 await page.waitForTimeout(1960);
 assert.equal(await successBadge.count(),1,'success emblem must stay visible for >1.9 seconds');
 assert((await successBadge.evaluate(n=>parseFloat(getComputedStyle(n).opacity)))>.7,
  'gold success graphic should remain opaque during its long hold');
 await page.waitForTimeout(1510);
 assert.equal(await successBadge.count(),0,'success overlay must remove itself instead of staying over the actors');
 const success=await page.evaluate(()=>{
  const h=LudusBridge.state().roster[0],s=LudusBridge.state();
  return {gold:s.gold,xp:h.xp,str:h.stats.str,attempts:h.trainingAttempts.str,status:s.message};
 });
 assert.equal(success.attempts,12);
 assert(success.str>info.stats.str,'successful training still improves actual stat');
 assert(success.xp>info.xp,'successful training still improves actual XP');
 assert.equal(success.gold,failed.gold-info.cost,'each attempt charges exactly once');
 await page.locator('.la-stage.training .lt-tile-button').nth(2).click();
 const endQuote=await page.evaluate(()=>LudusTrainingRisk.quote(LudusBridge.state().roster[0],'end'));
 const endUI=await page.locator('.la-stage.training .lt-risk-row').textContent();
 assert(endUI.includes('선택 2회')&&endUI.includes('실패 '+endQuote.percent+'%'),
  'changing to an END tile must show the same stored end stat counter');
 await page.locator('.la-stage.training .lt-tile-button').nth(1).click();
 assert((await page.locator('.la-stage.training .lt-risk-row').textContent()).includes('선택 0회'),
  'DEF training has an independent counter from END, migrated without extra attempts');
 for(const size of [{width:1680,height:950},{width:930,height:800},{width:420,height:930}]){
  await page.setViewportSize(size);
  const geom=await page.evaluate(()=>{
   const stage=document.querySelector('.la-stage.training');
   const b=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}};
   return {info:b(stage.querySelector('.lt-info')),risk:b(stage.querySelector('.lt-risk-row')),
    effect:b(stage.querySelector('.lt-effect')),guidance:b(stage.querySelector('.lt-guidance')),
    text:stage.querySelector('.lt-risk-row').textContent};
  });
  assert(geom.risk.bottom<geom.guidance.top,'risk should fit in effect panel '+JSON.stringify({size,geom}));
  assert(geom.guidance.bottom<geom.info.bottom+1,'guidance should fit inside panel '+JSON.stringify({size,geom}));
 }
 await page.evaluate(()=>Math.random=window.__originalRandom);
 await page.reload({waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.LudusTrainingRisk?.quote&&window.LudusBridge?.state,{timeout:25000});
 const saved=await page.evaluate(()=>{
  const s=LudusBridge.state(),h=s.roster[0];
  return {gold:s.gold,xp:h.xp,attempts:h.trainingAttempts.str,
   chances:LudusTrainingRisk.quote(h,'str').percent};
 });
 assert.equal(saved.attempts,12);
 assert.equal(saved.gold,success.gold);
 assert.equal(saved.xp,success.xp);
 assert(saved.chances>0);
 assert.deepEqual(errors,[],'no runtime or animation errors');
 console.log('TRAINING_INNATE_REPETITION_REAL_BROWSER_PASS '+JSON.stringify({info,failed,success,saved}));
}finally{await browser.close()}
