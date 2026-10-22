import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:844,height:390},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto('http://127.0.0.1:8765/?__arena_qa=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.LudusScene?.open&&window.LudusBridge?.state,{timeout:25000});
 await page.evaluate(()=>{
  const roster=window.LudusBridge.state().roster;
  const base=roster[0]||{name:'루두스 검투사',cls:'murmillo',level:1,stage:1,
    stats:{str:1,agi:1,end:1,focus:1},injury:0,fatigue:0,
    equipment:{weapon:'wood',shield:null,armor:null},inventory:['wood']};
  while(roster.length<10){
   const i=roster.length;roster.push({...base,name:'검투사 '+(i+1),level:i+1,
    stats:{...base.stats},equipment:{...base.equipment},inventory:[...(base.inventory||[])],
    injury:i===6?85:0,fatigue:i===7?90:0});
  }
  window.LudusScene.open();
 });
 await page.waitForSelector('#ludusScene:not([hidden]) .ll-portraits button.ll-fighter-card');
 const meta=await page.evaluate(()=>{
  const root=document.querySelector('#ludusScene');
  const stage=root.querySelector('.ll-stage'),roster=root.querySelector('.ll-roster'),
   strip=root.querySelector('.ll-portraits');
  const rect=roster.getBoundingClientRect(),stageRect=stage.getBoundingClientRect();
  const scale=stageRect.width/1448;
  return {count:strip.querySelectorAll('button.ll-fighter-card').length,
   panelWidth:roster.offsetWidth,panelHeight:roster.offsetHeight,
   cardWidth:strip.querySelector('button').offsetWidth,
   left:(rect.left-stageRect.left)/scale,right:(rect.right-stageRect.left)/scale,
   top:(rect.top-stageRect.top)/scale,bottom:(rect.bottom-stageRect.top)/scale,
   scrollRange:strip.scrollWidth-strip.clientWidth,
   scrollTouch:getComputedStyle(strip).touchAction,
   blockedHitbox:rect.right>stageRect.left+801*scale,
   name:strip.querySelector('button .ll-fighter-name')?.textContent,
   detail:strip.querySelector('button .ll-fighter-meta')?.textContent,
   pager:root.querySelectorAll('[data-action="prev"],[data-action="next"]').length};
 });
 assert.equal(meta.count,10,'all fighters shown without paging');
 assert.ok(meta.panelHeight>=420&&meta.panelWidth>=770,JSON.stringify(meta));
 assert.ok(meta.cardWidth>=148,'larger portrait cards');
 assert.ok(meta.top<=655&&meta.bottom>=1050,'opaque pane covers lower Domina artwork');
 assert.ok(meta.scrollRange>650,'gallery is horizontally swipeable');
 assert.equal(meta.scrollTouch,'pan-x','allow native touch swipe');
 assert.equal(meta.blockedHitbox,false,'cannot overlap painted right-hand arena controls');
 assert.equal(meta.pager,0,'drag replaces pages');
 assert.ok(meta.name&&meta.detail);
 const rect=await page.locator('.ll-portraits').boundingBox();
 const before=await page.evaluate(()=>LudusBridge.state().active);
 await page.mouse.move(rect.x+rect.width*.84,rect.y+rect.height*.48);
 await page.mouse.down();
 for(let i=1;i<=12;i++)
  await page.mouse.move(rect.x+rect.width*(.84-.63*i/12),rect.y+rect.height*.48,{steps:1});
 await page.mouse.up();
 await page.waitForTimeout(120);
 const drag=await page.evaluate(()=>({
  scrollLeft:document.querySelector('.ll-portraits').scrollLeft,
  active:LudusBridge.state().active
 }));
 assert.ok(drag.scrollLeft>90,'drag actually scrolls the fighter gallery: '+JSON.stringify(drag));
 assert.equal(drag.active,before,'drag must not accidentally select a fighter');
 await page.locator('.ll-fighter-card[data-index="7"]').click();
 await page.waitForFunction(()=>window.LudusBridge.state().active===7);
 const selection=await page.evaluate(()=>({
  scrollLeft:document.querySelector('.ll-portraits').scrollLeft,
  pressed:document.querySelector('.ll-fighter-card[data-index="7"]')?.getAttribute('aria-pressed'),
  status:document.querySelector('.ll-fighter-card[data-index="7"] .ll-fighter-condition')?.textContent,
  rightHotspot:document.querySelector('.ll-hit-arena')?.getBoundingClientRect().width
 }));
 assert.ok(selection.scrollLeft>90,'selected fighter retains scroll');
 assert.equal(selection.pressed,'true');
 assert.ok(selection.status.includes('피로'));
 assert.ok(selection.rightHotspot>50,'arena buttons still mounted');
 assert.deepEqual(errors,[],'no JS browser errors');
 console.log('LUDUS_ROSTER_DRAG_PASS '+JSON.stringify({meta,drag,selection}));
}finally{await browser.close();}
