/* Real training room regression: fixed NPC root, two permanent layers,
 * predecoded seven-frame whip, 856px contact and character depth ordering. */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {chromium} from 'playwright';
const originals={
 'doctore-idle-approved-v1.png':'06f90e9c7abd25a15ca3b8be2e5f532400bdf5cb1f0ddf511248ae59180ef282',
 'doctore-explain-approved-v1.png':'2f2b26077b5680fc7f26063048513ecd75312982ef8de703a433e4883ac06965',
 'doctore-authority-approved-v1.png':'4ed7ef333da18db4fce76846568bdd4abd333d2f3d43fe191cb0e618b733f511',
 'doctore-whip-user-v1.png':'4866225fe2d9184c627ed68c84cdcfe305ee3f3452c0bf23844bd11f9dcddf52'
};
for(const [name,sha] of Object.entries(originals)){
 const b=fs.readFileSync(new URL('../public/assets/ludus/'+name,import.meta.url));
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),sha,name+' must remain unchanged');
}
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1600,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.LudusApprovedScenes?.open&&window.LudusDoctoreAnim?.react,{timeout:18000});
 await page.evaluate(()=>LudusApprovedScenes.open('training'));
 const root='.la-stage.training .la-doctore-live';
 await page.waitForFunction(()=>window.LudusDoctoreAnim?.status()?.ready?.idle,{timeout:20000});
 const check=async(action,name)=>{
  await page.waitForFunction(({action,name})=>{
   const a=document.querySelector('.la-stage.training .la-doctore-live');
   return !!a&&a.dataset.action===action&&a.dataset.sheet===name;
  },{action,name},{timeout:4500});
  const x=await page.locator(root).evaluate(a=>{
   const b=a.querySelector('.la-doctore-body'),
    w=a.querySelector('.la-doctore-whip'),
    f=document.querySelector('.la-stage.training .lt-fighter-zone');
   const st=getComputedStyle(a),bStyle=b&&getComputedStyle(b);
   return {action:a.dataset.action,sheet:a.dataset.sheet,frame:Number(a.dataset.frame),
    footY:Number(a.dataset.footY),scale:Number(a.dataset.scale),
    rootWidth:a.offsetWidth,rootHeight:a.offsetHeight,rootZ:Number(st.zIndex),
    fighterZ:Number(f?getComputedStyle(f).zIndex:0),visible:st.visibility,
    bodyBackground:bStyle?.backgroundImage||'',
    bodyTransform:bStyle?.transform||'',bodyVisibility:bStyle?.visibility||'',
    whipCount:w?.children.length||0,whipZ:w?Number(getComputedStyle(w).zIndex):null,
    activeWhips:w?[...w.children].filter(el=>getComputedStyle(el).visibility==='visible')
     .map(el=>({id:Number(el.dataset.id),src:el.currentSrc,w:el.style.width,
      h:el.style.height,naturalW:el.naturalWidth,naturalH:el.naturalHeight})):[],
    crop:JSON.parse(a.dataset.crop),ready:window.LudusDoctoreAnim?.status()?.ready||{}};
  });
  assert.equal(x.footY,600,'trainer feet meet the fighter ground at y=600');
  assert.equal(x.rootWidth,1200,'fixed parent container never shrinks between actions');
  assert.equal(x.rootHeight,760,'fixed parent height never changes');
  assert.ok(x.rootZ>x.fighterZ,'trainer & lash render above practice fighter');
  assert.equal(x.whipCount,7,'seven original transparent PNGs remain mounted');
  assert.ok(x.whipZ>1,'whip is higher than the trainer body layer');
  assert.ok(x.crop.w>0&&x.crop.h>0);
  return x;
 };
 const idle=await check('idle','doctore-idle-approved-v1.png');
 assert.ok(idle.bodyBackground.includes('doctore-idle-approved-v1.png'));
 assert.equal(idle.activeWhips.length,0);
 const choices=await page.evaluate(()=>{
  const list=[...document.querySelectorAll('.la-stage.training .lt-tile-button')];
  if(list[2])list[2].click();
  return list.length;
 });
 assert.equal(choices,5);
 const talk=await check('talk','doctore-explain-approved-v1.png');
 assert.ok(talk.bodyBackground.includes('doctore-explain-approved-v1.png'));
 await page.evaluate(()=>LudusDoctoreAnim.react(2));
 const command=await check('command','doctore-authority-approved-v1.png');
 assert.ok(command.bodyBackground.includes('doctore-authority-approved-v1.png'));
 await page.waitForFunction(()=>LudusDoctoreAnim.status().ready.whip,{timeout:20000});
 await page.evaluate(()=>LudusDoctoreAnim.react(3));
 await page.waitForFunction(()=>{
  const a=document.querySelector('.la-stage.training .la-doctore-live');
  return a?.dataset.action==='whip'&&Number(a.dataset.frame)>=4&&a.dataset.wide==='true';
 },{timeout:4000});
 const lash=await check('whip','doctore-whip-user-v1.png');
 assert.equal(lash.crop.w,856,'extended whip is one uninterrupted frame');
 assert.equal(lash.activeWhips.length,1,'only one preloaded whip sprite is shown');
 assert.equal(lash.activeWhips[0].id,4,'one long forward lash retains its own frame');
 assert.equal(lash.activeWhips[0].naturalW,856,'native wide frame is never recropped');
 assert.equal(lash.activeWhips[0].w,Math.round(856*1.335)+'px',
  'whip has independent constant display scale');
 assert.equal(lash.rootWidth,idle.rootWidth,'animation never changes actor root dimensions');
 await page.waitForFunction(()=>{
  const a=document.querySelector('.la-stage.training .la-doctore-live');
  return a?.dataset.action==='idle';
 },{timeout:4000});
 const recovered=await check('idle','doctore-idle-approved-v1.png');
 assert.equal(recovered.activeWhips.length,0,'whip disappears after recovery');
 assert.deepEqual(errors,[],'no runtime exceptions in the real training room');
 console.log('DOCTORE_FIXED_LAYER_BROWSER_PASS '+JSON.stringify({idle,talk,command,lash,recovered}));
}finally{await browser.close();}
