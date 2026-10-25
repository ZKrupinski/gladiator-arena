import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1680,height:950}});
const errors=[];
page.on('pageerror',err=>errors.push(String(err)));
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.LudusApprovedScenes?.open&&window.LudusDoctoreAnim?.status,{timeout:22000});
 await page.evaluate(()=>LudusApprovedScenes.open('training'));
 await page.waitForFunction(()=>{
  const key=document.querySelector('.la-stage.training .la-key');
  return !!key?.complete&&key.naturalWidth===1672;
 },{timeout:20000});
 const bubble='.la-stage.training .la-training-speech';
 const initial=await page.evaluate(()=>{
  const bg=document.querySelector('.la-stage.training .la-key');
  const speech=document.querySelector('.la-stage.training .la-training-speech');
  const trainer=document.querySelector('.la-stage.training .la-doctore-live');
  const fighter=document.querySelector('.la-stage.training .lt-fighter-zone');
  const s=getComputedStyle(speech);
  return {url:bg.currentSrc,width:bg.naturalWidth,height:bg.naturalHeight,
   text:speech.textContent,phase:speech.dataset.phase,
   training:speech.dataset.training,tag:speech.querySelector('.la-speech-badge').textContent,
   z:Number(s.zIndex),fighterZ:Number(getComputedStyle(fighter).zIndex),
   trainerZ:Number(getComputedStyle(trainer).zIndex),
   left:parseFloat(s.left),top:parseFloat(s.top),
   aria:speech.getAttribute('aria-live'),
   legacy:!!document.querySelector('.la-stage.training .la-doctore-parchment')};
 });
 assert.ok(initial.url.includes('training_blank_v71.webp'),'new key art must have baked fake dialogue removed');
 assert.equal(initial.width,1672);
 assert.equal(initial.height,941);
 assert.ok(initial.z>initial.fighterZ&&initial.z<initial.trainerZ,
  'real speech bubble must appear behind Doctore and above the arena fighter');
 assert.ok(initial.left>=520&&initial.left<545&&initial.top>=105&&initial.top<=125,
  'real speech occupies old painted speech location');
 assert.equal(initial.aria,'polite');
 assert.equal(initial.legacy,false,'legacy baked fake parchment cannot cover dynamic dialogue');
 assert.ok(initial.text.includes('훈련을 골라라'));
 const keywords=[
  ['ARS GLADII','허리를 비틀어라'],
  ['SCUTUM','무릎을 굽혀'],
  ['FORTITUDO','모래바닥 열 바퀴'],
  ['CELERITAS','어깨'],
  ['DISCIPLINA','패링']
 ];
 const initialVisual=await page.evaluate(()=>{
  const stage=document.querySelector('.la-stage.training');
  const bubble=stage.querySelector('.la-training-speech');
  const paragraph=bubble.querySelector('.la-speech-lines');
  const canvas=stage.querySelector('.lt-fighter-canvas');
  const trainer=stage.querySelector('.la-doctore-live');
  return {before:getComputedStyle(bubble,'::before').display,
   after:getComputedStyle(bubble,'::after').display,
   speechFont:parseFloat(getComputedStyle(paragraph).fontSize),
   speechWidth:bubble.clientWidth,speechHeight:bubble.clientHeight,
   paragraphHeight:paragraph.scrollHeight,
   studioScale:canvas?.dataset.fixedScale??null,
   fighterCanvasW:canvas?.width, fighterCanvasH:canvas?.height,
   trainerScale:Number(trainer?.dataset.scale||0),
   trainerFloor:Number(trainer?.dataset.footY||0)};
 });
 assert.equal(initialVisual.before,'none','painted bubble tail must not be duplicated by CSS');
 assert.equal(initialVisual.after,'none','only one bubble tail is allowed');
 assert.ok(initialVisual.speechFont>=18&&initialVisual.speechWidth>=280,'training speech needs large readable text');
 assert.ok(initialVisual.paragraphHeight<=initialVisual.speechHeight+3,
  'initial speech must stay inside painted speech area: '+JSON.stringify(initialVisual));
 assert.equal(initialVisual.fighterCanvasW,1000,'fighter needs wide unclipped canvas');
 assert.equal(initialVisual.fighterCanvasH,800,'fighter needs padded canvas height');
 assert.ok(initialVisual.trainerScale>=.88&&initialVisual.trainerScale<=1.08,'Doctore is resized consistently');
 assert.equal(initialVisual.trainerFloor,575,'Doctore stays on raised floor');
 const selected=[];
 for(let i=0;i<5;i++){
  await page.evaluate(i=>{
   document.querySelectorAll('.la-stage.training .lt-tile-button')[i].click();
  },i);
  await page.waitForFunction(i=>{
   const bubble=document.querySelector('.la-stage.training .la-training-speech');
   return bubble?.dataset.phase==='selected'&&bubble.dataset.training===String(i);
  },i,{timeout:4500});
  const line=await page.locator(bubble).textContent();
  assert.ok(line.includes(keywords[i][0]),'incorrect Latin rubric for training tile '+i);
  assert.ok(line.includes(keywords[i][1]),'missing specific Korean instructional line for tile '+i);
  const fit=await page.evaluate(()=>{
   const b=document.querySelector('.la-stage.training .la-training-speech');
   const p=b.querySelector('.la-speech-lines');
   return {textHeight:p.scrollHeight,bubbleHeight:b.clientHeight,
    textWidth:p.scrollWidth,bubbleWidth:b.clientWidth};
  });
  assert.ok(fit.textHeight<=fit.bubbleHeight+3&&fit.textWidth<=fit.bubbleWidth+3,
   'training '+i+' dialogue overflows its painted bubble: '+JSON.stringify(fit));
  selected.push({i,line,fit});
 }
 // The player can train immediately; show a distinct character reaction,
 // instead of leaving the tile's description frozen.
 await page.locator('.la-stage.training .lt-start-button').click();
 await page.waitForFunction(()=>{
  const speech=document.querySelector('.la-stage.training .la-training-speech');
  return speech?.dataset.phase==='success';
 },{timeout:4500});
 const success=await page.locator(bubble).textContent();
 assert.ok(success.includes('BENE FACTUM'));
 assert.ok(success.includes('눈빛이 달라졌군'));
 assert.deepEqual(errors,[],'no dialogue / scene runtime JS errors');
 console.log('LUDUS_REAL_DIALOGUE_BROWSER_PASS '+JSON.stringify({initial,selected,success}));
}finally{await browser.close()}
