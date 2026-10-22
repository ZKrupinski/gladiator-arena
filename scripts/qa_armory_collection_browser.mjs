import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {chromium} from 'playwright';
const sandbox={globalThis:{}};
vm.runInNewContext(readFileSync(new URL('../public/arena-gear-catalog.js',import.meta.url),'utf8'),sandbox);
const model=sandbox.globalThis.ArenaGearCatalog;
assert.equal(model.items.length,44);
assert.equal(new Set(model.items.map(g=>g.id)).size,44);
assert.equal(model.items.filter(g=>g.slot==='weapon').length,16);
assert.equal(model.items.filter(g=>g.slot==='shield').length,14);
assert.equal(model.items.filter(g=>g.slot==='armor').length,14);
for(const id of ['wood','iron','shield','elite'])assert.ok(model.items.some(g=>g.id===id));
for(const g of model.items)assert.ok(readFileSync(new URL('../public/'+g.icon,import.meta.url),'utf8').startsWith('<svg '),g.id);
const venatio=model.summary({equipment:{weapon:'venatio_blade',shield:'venatio_shield',armor:'venatio_hide'}});
assert.equal(venatio.pieces.venatio,3);
assert.ok(venatio.beastDamage>=.30&&venatio.injuryReduction===.20);
const training=model.summary({equipment:{weapon:'trainer_blade',shield:'trainer_shield',armor:'trainer_armor'}});
assert.equal(training.pieces.training,3);assert.ok(training.trainingDiscount>=.20);
assert.equal(training.fatigueReduction,.15);
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1672,height:941}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto('http://127.0.0.1:8765/?__arena_qa=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.LudusApprovedScenes?.open&&window.LudusBridge?.gearSummary,{timeout:25000});
 await page.waitForFunction(()=>window.ArenaGearBitmap?.status()==='ready',{timeout:30000});
 const bitmap=await page.evaluate(()=>({
  drawn:ArenaGearBitmap.renderedCount(),
  mapped:Object.keys(ArenaGearBitmap.mapping).length,
  total:LudusBridge.allGear().length,
  bitmapIcons:LudusBridge.allGear().filter(x=>x.icon.startsWith('data:image/webp')).length,
  atlasSources:Object.values(ArenaGearBitmap.atlases).map(x=>x.src),
  invalid:LudusBridge.allGear().filter(x=>!x.atlasSheet||!Number.isInteger(x.atlasIndex)).map(x=>x.id)
 }));
 assert.equal(bitmap.total,76,'all five-slot catalogue items are available to the game');
 assert.equal(bitmap.mapped,76,'each equipment entry has its own reviewed atlas tile');
 assert.equal(bitmap.drawn,76,'all 76 distinct 192px bitmap crops decoded successfully');
 assert.equal(bitmap.bitmapIcons,76,'no inventory icon still uses SVG once atlases load');
 assert.equal(await page.evaluate(()=>ArenaGearCatalog.items.some(g=>g.icon.startsWith('assets/gear-icons/'))),false,'legacy SVG is only a fallback, never the displayed catalogue at successful atlas load');
 assert.deepEqual(bitmap.invalid,[],'all mapped items have stable sprite coordinates');
 assert.equal(new Set(bitmap.atlasSources).size,2,'both reviewed atlases were loaded');
 // Discovery-first economy: fresh Ludus does not expose all 76 items.
 const initial=await page.evaluate(()=>({visible:LudusBridge.catalog().length,total:LudusBridge.allGear().length}));
 assert.equal(initial.total,76);
 assert.ok(initial.visible<8,'undiscovered gear stays hidden');
 await page.evaluate(()=>{
  const s=LudusBridge.state();
  if(!s.roster.length){
   s.roster.push(LudusRoster.create('murmillo',1));
   LudusBridge.select(0);
  }
  const state=LudusBridge.state();
  state.armoryInventory.push('iron','iron','trainer_blade','red_fang','shield');
  state.discoveredGear.push('iron','shield');
  LudusApprovedScenes.open('gear');
 });
 await page.waitForSelector('.ra-collection .ra-list');
 assert.ok(await page.locator('.ra-item').count()>=4);
 await page.waitForFunction(()=>document.querySelector('.ra-item-img')?.naturalWidth>0,{timeout:25000});
 assert.equal(await page.locator('.ra-stat-diff').count(),6,'all six real combat stats compare equipment before and after');
 const geometry=await page.evaluate(()=>{
  const cols=['.ra-fighters','.ra-details','.ra-items'].map(sel=>{
   const e=document.querySelector('.ra-collection '+sel),r=e.getBoundingClientRect();
   return {left:r.left,right:r.right,width:r.width};
  });
  const actions=[...document.querySelectorAll('.ra-buttons button')].map(e=>({title:e.querySelector('strong')?.innerText,subtitle:e.querySelector('small')?.innerText,nowrap:getComputedStyle(e.querySelector('strong')).whiteSpace,overflow:e.scrollWidth>e.clientWidth+2}));
  return {cols,actions};
 });
 assert(geometry.cols[0].right<geometry.cols[1].left&&geometry.cols[1].right<geometry.cols[2].left,'hero → equipment detail → inventory order');
 assert(geometry.cols[0].width<geometry.cols[1].width&&geometry.cols[1].width<geometry.cols[2].width,'24/34/42 width hierarchy');
 assert(geometry.actions.every(x=>x.nowrap==='nowrap'&&!x.overflow&&x.title?.length<=2),'short, single-line armory controls: '+JSON.stringify(geometry.actions));
 assert.equal(await page.locator('.ra-combat-stats .ra-live-stat').count(),6,'actual stats visible in hero pane');
 // Five independent equipment slots appear directly between selected hero and stats.
 const slotLayout=await page.evaluate(()=>{
  const hero=document.querySelector('.ra-hero-info'),loadout=document.querySelector('.ra-loadout'),stats=document.querySelector('.ra-combat-stats');
  const elems=[...hero.parentElement.children];
  return {count:loadout.querySelectorAll('[data-loadout-slot]').length,
   slots:[...loadout.querySelectorAll('[data-loadout-slot]')].map(e=>e.dataset.loadoutSlot),
   ordered:elems.indexOf(hero)<elems.indexOf(loadout)&&elems.indexOf(loadout)<elems.indexOf(stats),
   empty:[...loadout.querySelectorAll('.ra-loadout-slot.is-empty')].map(e=>e.dataset.loadoutSlot),
   disabled:[...loadout.querySelectorAll('.ra-loadout-slot:disabled')].map(e=>e.dataset.loadoutSlot)};
 });
 assert.equal(slotLayout.count,5,'all five gladiator gear slots are always shown');
 assert.deepEqual(slotLayout.slots,['weapon','shield','armor','helmet','bracers']);
 assert(slotLayout.ordered,'gear slots are just below fighter name');
 assert(['shield','armor','helmet','bracers'].every(slotLayout.empty.includes.bind(slotLayout.empty)),'empty defense and gladiator specialty slots show placeholders');
 assert(['shield','armor','helmet','bracers'].every(slotLayout.disabled.includes.bind(slotLayout.disabled)),'empty slots do not navigate');
 assert.equal(await page.locator('[data-item="trainer_blade"]').count(),1);
 assert.equal(await page.locator('[data-item="imperial_aquila"]').count(),0,'undiscovered epic gear hidden');
 await page.locator('[data-item="trainer_blade"]').click();
 assert.ok((await page.locator('.ra-detail-title').innerText()).includes('루두스 훈련검'));
 const before=await page.evaluate(()=>LudusBridge.state().gold);
 const beforeCombat=await page.evaluate(()=>LudusBridge.combatStats(LudusBridge.state().active));
 const preview=await page.locator('.ra-stat-diff.plus').count();
 assert(preview>=2,'equipping rare training sword previews ATK and HP gains');
 assert.equal(await page.locator('#raBuy').isDisabled(),true,'rare gear may never be purchased');
 await page.locator('#raEquip').click();
 const afterCombat=await page.evaluate(()=>LudusBridge.combatStats(LudusBridge.state().active));
 assert.equal(afterCombat.atk-beforeCombat.atk,10,'hero real ATK increases when gear equipped');
 assert.equal(afterCombat.hp-beforeCombat.hp,10,'hero real maximum HP increases when gear equipped');
 assert(await page.locator('.ra-live-stat.changed.plus').count()>=2,'equipped changes glow on hero panel');
 assert.equal(await page.evaluate(()=>LudusBridge.state().gold),before,'equipping stock is free');
 assert.equal(await page.evaluate(()=>LudusBridge.gearCount('trainer_blade')),0,'allocated copy removed from shared warehouse');
 assert.equal(await page.evaluate(()=>LudusBridge.gearAllocated('trainer_blade')),1);
 assert.equal(await page.evaluate(()=>LudusBridge.state().roster[LudusBridge.state().active].equipment.weapon),'trainer_blade');
 assert.equal(await page.locator('[data-loadout-slot="weapon"][data-loadout-gear="trainer_blade"] .ra-item-img').count(),1,'worn sword immediately visible in hero slot');
 await page.waitForFunction(()=>document.querySelector('[data-loadout-slot="weapon"] .ra-item-img')?.naturalWidth>0);
 // Already-worn equipment activates its real stats as soon as it is selected,
 // without first requiring an unequip/re-equip transaction.
 assert.equal(await page.locator('.ra-live-stat.equipped-active[data-stat="atk"]').count(),1);
 assert.equal(await page.locator('.ra-live-stat.equipped-active[data-stat="hp"]').count(),1);
 await page.locator('[data-item="iron"]').click();
 assert.equal(await page.locator('.ra-live-stat.equipped-active').count(),0,'an un-equipped selection is only a preview');
 await page.locator('[data-loadout-slot="weapon"]').click();
 assert.equal(await page.locator('.ra-item.selected[data-item="trainer_blade"]').count(),1,'worn icon focuses gear in inventory');
 assert.equal(await page.locator('.ra-detail-title h3').innerText(),'루두스 훈련검');
 assert.equal(await page.locator('.ra-loadout-slot.is-selected[data-loadout-slot="weapon"]').count(),1);
 await page.locator('[data-cat="shield"]').click();
 assert.equal(await page.locator('[data-item="trainer_blade"]').count(),0,'weapon hidden while shield filter selected');
 await page.locator('[data-loadout-slot="weapon"]').click();
 assert.equal(await page.locator('.ra-item.selected[data-item="trainer_blade"]').count(),1,'worn icon restores hidden weapon card after different category');
 assert.equal(await page.locator('[data-cat="all"].selected').count(),1,'worn icon restores all category');
 assert.equal(await page.locator('.ra-detail-title h3').innerText(),'루두스 훈련검');
 await page.locator('[data-item="trainer_blade"]').click();
 assert.equal(await page.locator('.ra-live-stat.equipped-active[data-stat="atk"]').count(),1,'re-selecting an already worn sword instantly highlights its ATK contribution');
 assert.equal(await page.locator('.ra-live-stat.equipped-active[data-stat="hp"]').count(),1,'re-selecting an already worn sword instantly highlights its HP contribution');
 assert.match(await page.locator('.ra-comparison h3').innerText(),/해제 시/,'worn equipment is compared against its removal');
 assert.equal(await page.evaluate(()=>LudusBridge.combatStats(LudusBridge.state().active).atk),afterCombat.atk,'mere selection never alters equipment');
 await page.locator('#raRemove').click();
 const removedCombat=await page.evaluate(()=>LudusBridge.combatStats(LudusBridge.state().active));
 assert.equal(removedCombat.atk,beforeCombat.atk,'real ATK returns after removing equipment');
 assert.equal(removedCombat.hp,beforeCombat.hp,'real HP returns after removing equipment');
 assert(await page.locator('.ra-live-stat.changed.minus').count()>=2,'removed equipment reductions visibly glow');
 assert.equal(await page.evaluate(()=>LudusBridge.gearCount('trainer_blade')),1,'unequipped copy returns to warehouse');
 assert.equal(await page.locator('.ra-loadout-slot.is-empty[data-loadout-slot="weapon"] .ra-loadout-empty').count(),1,'unequip instantly restores empty slot');
 assert.equal(await page.evaluate(()=>LudusBridge.state().gold),before);
 await page.locator('[data-item="iron"]').click();
 const ironCost=await page.evaluate(()=>ArenaGearCatalog.items.find(g=>g.id==='iron').cost);
 assert.equal(await page.locator('#raBuy').isDisabled(),false,'only previously discovered common gear unlocks purchasing');
 await page.locator('#raBuy').click();
 assert.equal(await page.evaluate(()=>LudusBridge.state().gold),before-ironCost);
 assert.equal(await page.evaluate(()=>LudusBridge.gearCount('iron')),3);
 await page.locator('#raSell').click();
 assert.equal(await page.evaluate(()=>LudusBridge.gearCount('iron')),2);
 // Shield and armor icons must update in their dedicated slots and point to the owned gear.
 await page.evaluate(()=>{
  const state=LudusBridge.state();
  state.armoryInventory.push('leather');
  state.discoveredGear.push('leather');
 });
 await page.locator('[data-item="iron"]').click();
 await page.locator('#raEquip').click();
 assert.equal(await page.locator('.ra-loadout-slot.is-equipped[data-loadout-gear="iron"]').count(),1);
 await page.locator('[data-item="shield"]').click();
 await page.locator('#raEquip').click();
 assert.equal(await page.locator('[data-loadout-slot="shield"][data-loadout-gear="shield"] .ra-item-img').count(),1,'shield icon appears upon equipping');
 await page.locator('[data-loadout-slot="shield"]').click();
 assert.equal(await page.locator('.ra-item.selected[data-item="shield"]').count(),1);
 await page.locator('[data-item="leather"]').click();
 await page.locator('#raEquip').click();
 assert.equal(await page.locator('[data-loadout-slot="armor"][data-loadout-gear="leather"] .ra-item-img').count(),1,'armor icon appears upon equipping');
 await page.locator('[data-loadout-slot="armor"]').click();
 assert.equal(await page.locator('.ra-item.selected[data-item="leather"]').count(),1,'armor slot goes to selected warehouse item');
 await page.locator('[data-cat="all"]').click();
 assert.equal(await page.evaluate(()=>LudusBridge.state().gold),before-ironCost+Math.floor(ironCost*.42));
 await page.locator('[data-cat="shield"]').click();
 assert.equal(await page.locator('[data-item="shield"]').count(),1);
 await page.locator('#raRarity').selectOption('legendary');
 assert.equal(await page.locator('.ra-item').count(),0);
 await page.locator('#raRarity').selectOption('all');
 await page.locator('[data-cat="all"]').click();
 assert.equal(await page.locator('[data-item="red_fang"]').count(),1,'battle reward exclusive legendary gear visible once won');
 await page.locator('#raSet').click();
 assert.ok(await page.locator('.ra-item').count()>=1);
 await page.locator('#raSet').click();
 await page.locator('#raOwned').click();
 assert.ok(await page.locator('.ra-item').count()>=2);
 await page.locator('#raOwned').click();
 assert.ok(await page.locator('.ra-item').count()>=4);
 // Selecting a fighter must NOT snap the horizontal roster back to the left.
 await page.evaluate(()=>{
  const state=LudusBridge.state();
  for(let n=0;n<9;n++)state.roster.push(LudusRoster.create('murmillo',n+2));
  LudusApprovedScenes.open('gear');
 });
 await page.waitForSelector('.ra-roster [data-fighter="8"]');
 const rosterBefore=await page.evaluate(()=>{
  const roster=document.querySelector('.ra-roster');
  roster.scrollLeft=245;
  return roster.scrollLeft;
 });
 assert.ok(rosterBefore>=200,'roster overflow provides horizontal scrolling');
 await page.locator('.ra-roster [data-fighter="4"]').click();
 const rosterAfter=await page.evaluate(()=>document.querySelector('.ra-roster').scrollLeft);
 assert.ok(Math.abs(rosterAfter-rosterBefore)<2,'choosing a fighter keeps carousel scroll offset ('+rosterBefore+' → '+rosterAfter+')');
 await page.locator('.ra-roster [data-fighter="5"]').click();
 const rosterAgain=await page.evaluate(()=>document.querySelector('.ra-roster').scrollLeft);
 assert.ok(Math.abs(rosterAgain-rosterBefore)<2,'multiple fighter choices continue at the same horizontal offset');
 // Portrait phone: armory must NOT be a tiny 1672px image scaled down.
 await page.setViewportSize({width:390,height:844});
 const portraitMetrics=await page.evaluate(()=>{
  const stage=document.querySelector('.la-stage.armory');
  const root=document.querySelector('.ra-collection');
  const body=document.querySelector('.ra-list');
  const flag=document.querySelector('.ra-flag');
  const price=document.querySelector('.ra-detail-title strong');
  const overlay=document.querySelector('.la-orient');
  return {
   stageW:stage.getBoundingClientRect().width,
   stageH:stage.getBoundingClientRect().height,
   rootW:root.getBoundingClientRect().width,
   viewport:window.innerWidth,
   scroll:root.scrollHeight>root.clientHeight,
   textPx:parseFloat(getComputedStyle(flag).fontSize),
   pricePx:parseFloat(getComputedStyle(price).fontSize),
   orientationHidden:getComputedStyle(overlay).display==='none',
   listingWidth:body.getBoundingClientRect().width,
   itemWidth:body.querySelector('.ra-item').getBoundingClientRect().width
  };
 });
 assert.ok(Math.abs(portraitMetrics.stageW-390)<1.5,JSON.stringify(portraitMetrics));
 assert.ok(portraitMetrics.stageH>=840);
 assert.ok(portraitMetrics.scroll,'portrait armory must scroll');
 assert.ok(portraitMetrics.textPx>=16,'ownership and price stamps readable');
 assert.ok(portraitMetrics.pricePx>=24,'important prices bold and large');
 assert.equal(portraitMetrics.orientationHidden,true);
 assert.ok(portraitMetrics.itemWidth<=portraitMetrics.listingWidth+1);
 // Landscape phone: stay in familiar widescreen composition but with
 // visibly enlarged text and stronger purchase / equip indicators.
 await page.setViewportSize({width:844,height:390});
 const landscapeMetrics=await page.evaluate(()=>{
  const flag=document.querySelector('.ra-flag'),name=document.querySelector('.ra-item-copy strong');
  return {flag:parseFloat(getComputedStyle(flag).fontSize),
   name:parseFloat(getComputedStyle(name).fontSize),
   columns:getComputedStyle(document.querySelector('.ra-list')).gridTemplateColumns.split(' ').length};
 });
 assert.ok(landscapeMetrics.flag>=26,JSON.stringify(landscapeMetrics));
 assert.ok(landscapeMetrics.name>=29);
 assert.equal(landscapeMetrics.columns,1,'show full-width inventory rows on mobile landscape');

 // In widescreen the whole detail panel must scroll — the equipment sublist
 // must not steal scrolling or clip the purchase buttons below the viewport.
 const landscapeScroll=await page.evaluate(()=>{
   const panel=document.querySelector('.ra-details');
   const equipment=panel.querySelector('.ra-equipped');
   const controls=panel.querySelector('.ra-buttons');
   const before=panel.scrollTop;
   const max=panel.scrollHeight-panel.clientHeight;
   panel.scrollTop=panel.scrollHeight;
   const after=panel.scrollTop;
   const a=panel.getBoundingClientRect(),b=controls.getBoundingClientRect();
   return {max,before,after,overflow:getComputedStyle(panel).overflowY,
     equipmentOverflow:getComputedStyle(equipment).overflowY,
     controlsVisible:b.bottom<=a.bottom+2&&b.top>=a.top-2};
 });
 assert.ok(landscapeScroll.max>80,JSON.stringify(landscapeScroll));
 assert.ok(landscapeScroll.after>80,'detail article reaches bottom');
 assert.equal(landscapeScroll.overflow,'auto');
 assert.notEqual(landscapeScroll.equipmentOverflow,'auto','equipment sublist must not swallow scroll');
 assert.ok(landscapeScroll.controlsVisible,'equip buttons remain reachable');
 // The portrait phone scrolls the entire armory through comparison, sets and
 // purchase controls rather than truncating the details section.
 await page.setViewportSize({width:390,height:844});
 const portraitScroll=await page.evaluate(()=>{
   const stage=document.querySelector('.la-stage.armory'),root=stage.querySelector('.ra-collection');
   const panel=root.querySelector('.ra-details'),controls=panel.querySelector('.ra-buttons');
   root.scrollTop=root.scrollHeight;
   const view=root.getBoundingClientRect(),b=controls.getBoundingClientRect();
   return {top:root.scrollTop,max:root.scrollHeight-root.clientHeight,
     height:panel.scrollHeight,clientHeight:panel.clientHeight,
     overflow:getComputedStyle(panel).overflowY,
     controlsVisible:b.bottom<=view.bottom+3&&b.top>=view.top-3};
 });
 assert.ok(portraitScroll.top>100,JSON.stringify(portraitScroll));
 assert.ok(portraitScroll.height>=portraitScroll.clientHeight,'details have intrinsic height');
 assert.equal(portraitScroll.overflow,'visible');
 assert.ok(portraitScroll.controlsVisible,'portrait details and action buttons reachable');
 assert.deepEqual(errors,[],'no browser runtime errors');
 console.log('ARMORY_COLLECTION_BROWSER_PASS');
}finally{await browser.close();}
