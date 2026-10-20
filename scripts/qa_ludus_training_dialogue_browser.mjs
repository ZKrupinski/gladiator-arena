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
 assert.ok(initial.url.includes('training_no_dialogue_v1.webp'),'new key art must have baked fake dialogue removed');
 assert.equal(initial.width,1672);
 assert.equal(initial.height,941);
 assert.ok(initial.z>initial.fighterZ&&initial.z<initial.trainerZ,
  'real speech bubble must appear behind Doctore and above the arena fighter');
 assert.ok(initial.left>=480&&initial.left<520&&initial.top>=85&&initial.top<115,
  'real speech occupies old painted speech location');
 assert.equal(initial.aria,'polite');
 assert.equal(initial.legacy,false,'legacy baked fake parchment cannot cover dynamic dialogue');
 assert.ok(initial.text.includes('두 번째 기회'));
 const keywords=[
  ['ARS GLADII','허리를 비틀어라'],
  ['SCUTUM','무릎을 굽혀'],
  ['FORTITUDO','모래바닥 열 바퀴'],
  ['CELERITAS','어깨'],
  ['DISCIPLINA','패링']
 ];
 const selected=[];
 for(let i=0;i<5;i++){
  await page.evaluate(i=>{
   document.querySelectorAll('.la-stage.training .lt-tile-button')[i].click();
  },i);
  await page.waitForFunction(i=>{
   const bubble=document.querySelector('.la-stage.training .la-training-speech');
   return bubble?.dataset.phase==='selected'&&bubble.dataset.training===String(i);
  },i,{timeout:4500});
  const line=await page.locator(bubble).innerText();
  assert.ok(line.includes(keywords[i][0]),'incorrect Latin rubric for training tile '+i);
  assert.ok(line.includes(keywords[i][1]),'missing specific Korean instructional line for tile '+i);
  selected.push({i,line});
 }
 // The player can train immediately; show a distinct character reaction,
 // instead of leaving the tile's description frozen.
 await page.locator('.la-stage.training .lt-start-button').click();
 await page.waitForFunction(()=>{
  const speech=document.querySelector('.la-stage.training .la-training-speech');
  return speech?.dataset.phase==='success';
 },{timeout:4500});
 const success=await page.locator(bubble).innerText();
 assert.ok(success.includes('BENE FACTUM'));
 assert.ok(success.includes('눈빛이 달라졌군'));
 assert.deepEqual(errors,[],'no dialogue / scene runtime JS errors');
 console.log('LUDUS_REAL_DIALOGUE_BROWSER_PASS '+JSON.stringify({initial,selected,success}));
}finally{await browser.close()}
