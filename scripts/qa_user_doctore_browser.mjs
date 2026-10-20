import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {chromium} from 'playwright';
const png=fs.readFileSync(new URL('../public/assets/ludus/doctore-whip-user-v1.png',import.meta.url));
assert.equal(crypto.createHash('sha256').update(png).digest('hex'),
 '4866225fe2d9184c627ed68c84cdcfe305ee3f3452c0bf23844bd11f9dcddf52',
 'Do not resize or regenerate the user-supplied PNG; every original byte must match');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1600,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.LudusApprovedScenes?.open&&window.LudusDoctoreAnim?.react,{timeout:18000});
 await page.evaluate(()=>LudusApprovedScenes.open('training'));
 await page.waitForFunction(()=>{
  const actor=document.querySelector('.la-stage.training .la-doctore-live');
  return !!actor&&window.__ludusWhipReady&&actor.dataset.action==='idle'&&
   getComputedStyle(actor).backgroundImage.includes('doctore-whip-user-v1.png');
 },{timeout:18000});
 const idle=await page.evaluate(()=>{
  const actor=document.querySelector('.la-stage.training .la-doctore-live');
  const st=getComputedStyle(actor);
  return {action:actor.dataset.action,image:st.backgroundImage,
   width:actor.style.width,visible:st.display!=='none'&&st.visibility!=='hidden'};
 });
 assert.equal(idle.visible,true,'Approved trainer shown in actual live training screen');
 assert.ok(idle.image.includes('doctore-whip-user-v1.png'),'Trainer is no longer the old sprite sheet');
 assert.equal(idle.width,'355px','Default pose uses full-quality first user PNG cell');
 await page.evaluate(()=>LudusDoctoreAnim.react(3));
 await page.waitForFunction(()=>{
  const actor=document.querySelector('.la-stage.training .la-doctore-live');
  return actor?.dataset.action==='whip'&&actor.style.width==='800px'&&
   actor.style.backgroundPosition.includes('-548px');
 },{timeout:4000});
 const impact=await page.evaluate(()=>{
  const actor=document.querySelector('.la-stage.training .la-doctore-live');
  return {frame:actor.dataset.frame,width:actor.style.width,
   pos:actor.style.backgroundPosition,image:getComputedStyle(actor).backgroundImage};
 });
 assert.equal(impact.width,'800px','Extended whip user frame is a single extra-wide 800px sprite');
 assert.ok(impact.image.includes('doctore-whip-user-v1.png'));
 await page.waitForFunction(()=>document.querySelector('.la-stage.training .la-doctore-live')?.dataset.action==='idle',{timeout:3000});
 assert.deepEqual(errors,[],'No runtime errors in actual training room');
 console.log('PASS: original user PNG verified by SHA256, visible as idle, extra-wide original whip frame displayed, restores to idle');
 console.log(JSON.stringify({idle,impact}));
}finally{await browser.close()}
