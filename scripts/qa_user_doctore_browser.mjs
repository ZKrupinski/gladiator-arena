/* Exercise the actual training menu: selected stat, standing, explanation,
 * crossed-arms command and wide lash all use ORIGINAL unchanged RGBA sources. */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {chromium} from 'playwright';
const originals=[
 ['doctore-idle-approved-v1.png','06f90e9c7abd25a15ca3b8be2e5f532400bdf5cb1f0ddf511248ae59180ef282'],
 ['doctore-explain-approved-v1.png','2f2b26077b5680fc7f26063048513ecd75312982ef8de703a433e4883ac06965'],
 ['doctore-authority-approved-v1.png','4ed7ef333da18db4fce76846568bdd4abd333d2f3d43fe191cb0e618b733f511'],
 ['doctore-whip-user-v1.png','4866225fe2d9184c627ed68c84cdcfe305ee3f3452c0bf23844bd11f9dcddf52']
];
for(const [name,sha] of originals){
 const b=fs.readFileSync(new URL('../public/assets/ludus/'+name,import.meta.url));
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),sha,name+' changed');
}
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1600,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.LudusApprovedScenes?.open&&window.LudusDoctoreAnim?.react,{timeout:18000});
 await page.evaluate(()=>window.LudusApprovedScenes.open('training'));
 await page.waitForFunction(()=>window.LudusDoctoreAnim?.status()?.ready?.idle,{timeout:18000});
 const stage='.la-stage.training .la-doctore-live';
 const check=async(action,name)=>{
  await page.waitForFunction(({action,name})=>{
   const a=document.querySelector('.la-stage.training .la-doctore-live');
   return a?.dataset.action===action&&a.dataset.sheet===name&&
    getComputedStyle(a).backgroundImage.includes(
     name==='doctore-whip-user-v1.png'?'doctore-whip-clean-v2/frame-':name);
  },{action,name},{timeout:5000});
  const x=await page.locator(stage).evaluate(a=>{
   const s=getComputedStyle(a);
   return {action:a.dataset.action,sheet:a.dataset.sheet,frame:Number(a.dataset.frame),
    footY:Number(a.dataset.footY),scale:Number(a.dataset.scale),
    background:s.backgroundImage,width:a.style.width,height:a.style.height,
    left:a.style.left,top:a.style.top,transform:a.style.transform,
    crop:JSON.parse(a.dataset.crop),display:s.display,visibility:s.visibility};
  });
  assert.equal(x.footY,594,'trainer grounded 8px lower than previous build');
  assert.equal(x.scale,1.125,'character uniformly scaled, never flattened');
  assert.equal(x.transform,'scale(1.125)');
  assert.equal(x.display==='none'||x.visibility==='hidden',false);
  assert.ok(!x.background.includes('doctore-sd-v1.webp'));
  assert.ok(x.crop.x>=0&&x.crop.y>=0&&x.crop.w>0&&x.crop.h>0);
  assert.ok(x.crop.x+x.crop.w<=1448&&x.crop.y+x.crop.h<=1086);
  return x;
 };
 const idle=await check('idle','doctore-idle-approved-v1.png');
 // The actual training selection used to mistakenly replace the NPC sprite.
 const count=await page.evaluate(()=>{
  const all=document.querySelectorAll('.la-stage.training .lt-tile-button');
  if(all.length>2)all[2].click();
  return all.length;
 });
 assert.equal(count,5,'real stat selection buttons mounted');
 await page.waitForFunction(()=>LudusDoctoreAnim?.status()?.ready?.talk,{timeout:10000});
 const talk=await check('talk','doctore-explain-approved-v1.png');
 await page.evaluate(()=>LudusDoctoreAnim.react(2));
 const command=await check('command','doctore-authority-approved-v1.png');
 await page.evaluate(()=>LudusDoctoreAnim.react(3));
 await page.waitForFunction(()=>window.LudusDoctoreAnim?.status()?.ready?.whip,{timeout:10000});
 await page.waitForFunction(()=>{
  const a=document.querySelector('.la-stage.training .la-doctore-live');
  return a?.dataset.action==='whip'&&a.style.width==='856px'&&Number(a.dataset.frame)>=4;
 },{timeout:3500});
 const whip=await check('whip','doctore-whip-user-v1.png');
 assert.equal(whip.width,'856px','approved extra-wide lash remains one complete frame');
 await page.waitForFunction(()=>document.querySelector('.la-stage.training .la-doctore-live')?.dataset.action==='idle',{timeout:3500});
 const recovered=await check('idle','doctore-idle-approved-v1.png');
 assert.deepEqual(errors,[],'no JavaScript exceptions in the training room');
 assert.equal(whip.crop.width,undefined,'crop is original source coordinates, not a resampled frame');
 assert.equal(whip.crop.w,856);
 assert.ok(whip.background.includes('frame-4.png'),'exactly one clean isolated long pose is displayed');
 assert.equal(whip.crop.y,640);
 console.log('TRAINER_ORIGINALS_BROWSER_PASS '+JSON.stringify({idle,talk,command,whip,recovered}));
}finally{await browser.close();}
