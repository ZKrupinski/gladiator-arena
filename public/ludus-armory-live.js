/* SPARTACUS Armory V6: visible discoveries, communal storeroom, fighter-allocated equipment. */
(function(){'use strict';
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Math.round(Number(n)||0).toLocaleString('ko-KR');
const labels=window.ArenaGearCatalog.slotNames,slots=window.ArenaGearCatalog.slots;
const rk=['common','uncommon','rare','epic','legendary','relic'];
let onlyOwned=false,onlySet=false,rarity='all',lastScroll=0,lastScreenScroll=0,lastDetailScroll=0,lastRosterScrollLeft=0,statFlash=null,jumpToGearId=null;
function portrait(canvas,source){if(!canvas||!source?.width||!source?.height)return;const c=canvas.getContext('2d'),s=Math.min((canvas.width-12)/source.width,(canvas.height-12)/source.height);try{c.drawImage(source,(canvas.width-source.width*s)/2,canvas.height-source.height*s-3,source.width*s,source.height*s);}catch(_){}}
function render(stage,a,cb){
 const state=a.state(),hero=state.roster[state.active],stock=a.catalog(),eq=hero?.equipment||{},rar=a.gearRarities(),sets=a.gearSets();
 const count=id=>a.gearCount(id),assigned=id=>a.gearAllocated(id),shop=id=>a.shopUnlocked(id);
 const totalCopies=state.armoryInventory?.length||0;
 const cat=cb.category||'all',visible=stock.filter(g=>(cat==='all'||g.slot===cat)&&(rarity==='all'||g.rarity===rarity)&&(!onlyOwned||count(g.id)>0||assigned(g.id)>0)&&(!onlySet||g.setId));
 const sort=cb.sortMode%4;
 if(sort===1)visible.sort((x,y)=>x.cost-y.cost);
 if(sort===2)visible.sort((x,y)=>(count(y)+assigned(y))-(count(x)+assigned(x))||x.index-y.index);
 if(sort===3)visible.sort((x,y)=>rk.indexOf(y.rarity)-rk.indexOf(x.rarity)||y.cost-x.cost);
 const g=visible.find(x=>x.id===cb.selectedGear)||visible[0],wear=!!g&&eq[g.slot]===g.id,qty=g?count(g.id):0;
 const buyAllowed=!!g&&!!hero&&shop(g.id),canBuy=buyAllowed&&state.gold>=g.cost;
 const canEquip=!!hero&&qty>0&&!wear,canSell=!!g&&qty>0&&g.id!=='wood';
 const icon=x=>'<img class="ra-item-img" width="80" height="80" alt="" loading="lazy" src="'+esc(x.icon)+'">';
 const stockBadge=x=>'<em class="ra-flag '+(eq[x.slot]===x.id?'worn':count(x.id)?'owned':'price')+'">'+(eq[x.slot]===x.id?'✦ 장착':count(x.id)?'◆ 보관 ×'+count(x.id):assigned(x.id)?'⚔ 배정 ×'+assigned(x.id):shop(x.id)?'◉ '+fmt(x.cost)+'D':'✦ 전리품')+'</em>';
 const cards=visible.map(x=>'<button type="button" class="ra-item rarity-'+x.rarity+(g?.id===x.id?' selected':'')+(eq[x.slot]===x.id?' equipped':'')+'" data-item="'+esc(x.id)+'" aria-pressed="'+(g?.id===x.id)+'" style="--ra-tone:'+rar[x.rarity].color+'"><span class="ra-art">'+icon(x)+'<span class="ra-stock-count">×'+count(x.id)+'</span></span><span class="ra-item-copy"><small class="ra-tier">'+rar[x.rarity].name+' · '+labels[x.slot]+'</small><strong>'+esc(x.name)+'</strong><small>ATK +'+x.atk+' · HP +'+x.hp+'</small>'+(x.setId?'<i>◈ 세트</i>':'')+'</span>'+stockBadge(x)+'</button>').join('');
 const fighters=state.roster.map((f,i)=>'<button type="button" data-fighter="'+i+'" class="ra-portrait '+(i===state.active?'selected':'')+'" aria-label="'+esc(f.name+' · Lv.'+(f.level||1))+'" title="'+esc(f.name+' · Lv.'+(f.level||1))+'" aria-pressed="'+(i===state.active)+'"><canvas width="132" height="146" data-portrait="'+i+'"></canvas><small class="ra-thumb-level">Lv.'+(f.level||1)+'</small></button>').join('');
 const tabItems=a.allGear();
 const tabGear={weapon:'iron',shield:'wooden_scutum',armor:'leather',helmet:'gaul_iron_cap',bracers:'pit_leather_guard'};
 const cats=[['all','전체 장비'],['weapon','무기'],['shield','방패'],['armor','갑옷'],['helmet','투구'],['bracers','팔 보호대']].map(([key,name])=>{
  const gear=key==='all'?null:tabItems.find(item=>item.id===tabGear[key]);
  const art=gear?'<img class="ra-cat-icon" src="'+esc(gear.icon)+'" alt="" loading="lazy" width="40" height="40">':'<span class="ra-cat-all-icon" aria-hidden="true">▦</span>';
  return '<button type="button" data-cat="'+key+'" class="ra-tab-btn'+(cat===key?' selected':'')+'" aria-label="'+name+'" title="'+name+'" aria-pressed="'+(cat===key)+'">'+art+'</button>';
 }).join('');
 // Equipment worn by this fighter is visually allocated here, not removed from the Ludus vault.
 // Read the complete catalogue so old save equipment is visible even when the shop is filtered.
 const equippedCatalog=a.allGear();
 const wornGear=slot=>equippedCatalog.find(x=>x.id===eq[slot]&&x.slot===slot);
 const equippedSlots=slots.map(slot=>'<div class="ra-eq-line"><span>'+labels[slot]+'</span><strong>'+esc(wornGear(slot)?.name||'미장착')+'</strong></div>').join('');
 const fighterLoadout=slots.map(slot=>{
  const item=wornGear(slot),tier=item&&rar[item.rarity],highlight=!!item&&g?.id===item.id;
  return '<button type="button"'+(item?'':' disabled')+' class="ra-loadout-slot'+(item?' is-equipped rarity-'+item.rarity:' is-empty')+(highlight?' is-selected':'')+'" data-loadout-slot="'+slot+'" data-loadout-gear="'+esc(item?.id||'')+'" title="'+esc(labels[slot]+': '+(item?.name||'미장착'))+'" aria-label="'+esc(labels[slot]+': '+(item?.name||'미장착'))+'" aria-pressed="'+highlight+'" style="--ra-tone:'+(tier?.color||'#816c53')+'"><div class="ra-loadout-art">'+(item?icon(item):'<span class="ra-loadout-empty" aria-hidden="true">+</span>')+'</div><span class="ra-loadout-label">'+labels[slot]+'</span></button>';
 }).join('');
 const now=a.gearSummary(state.active),previewEquipment=g?{...eq,[g.slot]:wear?null:g.id}:eq,after=g?a.gearSummary(state.active,previewEquipment):now;
 const actual=a.combatStats(state.active),preview=g?a.combatStats(state.active,previewEquipment):actual;
 // A selected, already-equipped item should reveal its contribution at once.
 // Recompute real combat stats without this piece (including any lost set bonus).
 const unequippedStats=wear?a.combatStats(state.active,{...eq,[g.slot]:null}):null;
 const measures=[
  {id:'atk',label:'공격력',fmt:v=>fmt(v)},
  {id:'hp',label:'최대 HP',fmt:v=>fmt(v)},
  {id:'armor',label:'피해 감소',fmt:v=>(v*100).toFixed(1)+'%'},
  {id:'parrySeconds',label:'패링 판정',fmt:v=>v.toFixed(2)+'초'},
  {id:'sp',label:'필살기 위력',fmt:v=>fmt(v)},
  {id:'specialCooldown',label:'필살기 쿨',fmt:v=>v.toFixed(1)+'초',inverse:true}
 ];
 const deltaClass=(a,b,inverse=false)=>Math.abs(b-a)<.0001?'zero':((b-a)*(inverse?-1:1)>0?'plus':'minus');
 const deltaLabel=(a,b,m)=>{const d=b-a;if(Math.abs(d)<.0001)return '변화 없음';return (d>0?'+':'−')+m.fmt(Math.abs(d));};
 const quickStats=actual?measures.map(m=>{const value=actual[m.id]||0;const last=statFlash?.fighter===state.active?statFlash.before?.[m.id]:undefined;const changed=Number.isFinite(last)&&Math.abs(value-last)>.0001;const without=unequippedStats?.[m.id];const active=Number.isFinite(without)&&Math.abs(value-without)>.0001;const tone=changed?deltaClass(last,value,m.inverse):'';const contribution=active?'장비 '+deltaLabel(without,value,m):'';return '<div class="ra-live-stat '+(changed?'changed '+tone:'')+(active?' equipped-active':'')+'" data-stat="'+m.id+'"><span>'+m.label+'</span><strong>'+m.fmt(value)+'</strong>'+(changed?'<em>'+deltaLabel(last,value,m)+'</em>':active?'<em>'+contribution+'</em>':'')+'</div>';}).join(''):'<span>검투사 없음</span>';
 const statLines=actual&&preview?measures.map(m=>{const before=actual[m.id]||0,next=preview[m.id]||0,change=deltaClass(before,next,m.inverse);return '<div class="ra-stat-diff '+change+'"><small>'+m.label+'</small><div class="ra-metric-values"><b>'+m.fmt(before)+'</b><span aria-hidden="true">→</span><strong>'+m.fmt(next)+'</strong></div><em>'+deltaLabel(before,next,m)+'</em></div>';}).join(''):'';

 const set=sets[g?.setId],setCount=set?(after.pieces[g.setId]||0):0;
 const setLines=Object.entries(sets).filter(([id])=>now.pieces[id]>0).map(([id,entry])=>{const n=now.pieces[id]||0;return '<div class="ra-set-row '+(n>=2?'active':'')+'"><span>'+esc(entry.name)+'</span><b>'+n+'/3</b><small>'+esc(n>=3?entry.three:n>=2?entry.two:'2세트에서 해금')+'</small></div>';}).join('')||'<small class="ra-set-none">세트 장비 장착 시 효과가 표시됩니다.</small>';
 const effects=g?Object.entries(g.effect||{}).map(([k,v])=>'<b>✦ '+esc(window.ArenaGearCatalog.effectText(k,v))+'</b>').join(''):'';
 const knownCount=stock.length,totalCatalog=a.allGear().length;
 stage.insertAdjacentHTML('beforeend',
 '<section class="ra-screen ra-collection"><header><div class="ra-title"><small>ARMAMENTARIVM · COLLECTIO</small><h1>루두스 장비실</h1></div><div class="ra-gold">◉ '+fmt(state.gold)+' D</div><button id="raHome" class="ra-home">⌂ 루두스 로비</button></header><main>'+
 '<section class="ra-col ra-fighters"><h2>♜ 소속 검투사</h2><div class="ra-roster">'+fighters+'</div><div class="ra-stage"><canvas id="raHero" width="405" height="392"></canvas></div><div class="ra-hero-info"><strong>'+(hero?esc(hero.name):'영입 필요')+'</strong><small>'+(hero?esc(hero.cls)+' · Lv.'+Number(hero.level||1):'')+'</small></div><div class="ra-loadout" aria-label="선택 검투사 착용 장비">'+fighterLoadout+'</div><div class="ra-combat-stats"><h3>실전 능력치 <small>장비 반영</small></h3><div class="ra-combat-grid">'+quickStats+'</div></div><div class="ra-stats">'+(hero?Object.entries({STR:hero.stats?.str||0,AGI:hero.stats?.agi||0,END:hero.stats?.end||0,FOCUS:hero.stats?.focus||0}).map(([k,v])=>'<span>'+k+' <b>'+v+'</b></span>').join(''):'')+'</div><details class="ra-sets"><summary>◈ 활성 세트 효과</summary>'+setLines+'</details></section>'+
 '<section class="ra-col ra-items"><h2>⚔ 루두스 창고 <small>창고 '+totalCopies+' · 발견 '+knownCount+'/'+totalCatalog+'</small></h2><nav class="ra-cats">'+cats+'</nav><div class="ra-filters"><button id="raOwned" class="'+(onlyOwned?'active':'')+'">◆ 보유만</button><button id="raSet" class="'+(onlySet?'active':'')+'">◈ 세트만</button><select id="raRarity" aria-label="희귀도"><option value="all">전체 등급</option>'+rk.map(k=>'<option value="'+k+'" '+(rarity===k?'selected':'')+'>'+rar[k].name+'</option>').join('')+'</select></div><div class="ra-list">'+(cards||'<p class="ra-empty-store">아직 발견한 장비가 없습니다.<br>투기장에서 승리하면 보상으로 장비를 발견할 수 있습니다.<br>일반·고급 장비는 한 번 발견하면 이곳에서 추가 구매 가능!</p>')+'</div><button id="raSort" class="ra-sort">⇅ '+['기본순','가격순','보유순','희귀순'][sort]+'</button></section>'+
 '<section class="ra-col ra-details"><h2>✦ 장비 상세</h2><div class="ra-selected">'+(g?'<div class="ra-detail-head"><div class="ra-detail-image rarity-'+g.rarity+'" style="--ra-tone:'+rar[g.rarity].color+'">'+icon(g)+'</div><div class="ra-detail-title"><small style="color:'+rar[g.rarity].color+'">✦ '+rar[g.rarity].name+'</small><h3>'+esc(g.name)+'</h3><strong>'+(shop(g.id)?'추가 구매 '+fmt(g.cost)+' D':'전투 보상 전용')+'</strong><span class="'+(wear?'worn':qty?'owned':'')+'">루두스 창고 ×'+qty+' · 장착 ×'+assigned(g.id)+'</span></div></div><p>'+esc(g.desc)+'</p><div class="ra-effects"><strong>공격 +'+g.atk+' / 최대 HP +'+g.hp+'</strong>'+effects+'</div>':'전투에서 장비를 획득하면 이곳에 나타납니다.')+'</div>'+
 '<div class="ra-comparison"><h3>'+(wear?'현재 장착 · 해제 시':'장착 시 변화')+' <small>실전 스탯</small></h3><div class="ra-stats-diff">'+statLines+'</div></div>'+
 (set?'<div class="ra-set-detail"><h3>◈ '+esc(set.name)+' <small>'+setCount+'/3</small></h3><p class="'+(setCount>=2?'active':'')+'">2세트 · '+esc(set.two)+'</p><p class="'+(setCount>=3?'active':'')+'">3세트 · '+esc(set.three)+'</p></div>':'')+
 '<div class="ra-equipped"><h3>현재 장착</h3>'+equippedSlots+'</div><div class="ra-buttons"><button id="raEquip" '+(!canEquip?'disabled':'')+'><strong>장착</strong><small>'+(wear?'장착 중':qty?'창고 −1':'재고 없음')+'</small></button><button id="raRemove" '+(!wear?'disabled':'')+'><strong>해제</strong><small>창고 +1</small></button><button id="raBuy" '+(!canBuy?'disabled':'')+'><strong>구매</strong><small>'+(buyAllowed?fmt(g?.cost||0)+' D':'전리품 전용')+'</small></button><button id="raSell" '+(!canSell?'disabled':'')+'><strong>판매</strong><small>'+(g?'+'+fmt(Math.floor(g.cost*.42))+' D':'불가')+'</small></button></div></section></main><footer>미장착 장비는 루두스 공용 · 장착 시 검투사에게 1개 배정 · 희귀 이상은 전투로만 획득</footer></section>');
 const root=stage.querySelector('.ra-collection'),list=root.querySelector('.ra-list'),rosterScroll=root.querySelector('.ra-roster');
 // Visual and keyboard order follow the same left → center → right path.
 const main=root.querySelector('main');main.append(root.querySelector('.ra-fighters'),root.querySelector('.ra-details'),root.querySelector('.ra-items'));
 const detailPane=root.querySelector('.ra-details');detailPane.insertBefore(detailPane.querySelector('.ra-comparison'),detailPane.querySelector('.ra-selected'));
 portrait(root.querySelector('#raHero'),hero&&a.portrait(state.active));
 root.querySelectorAll('[data-portrait]').forEach(c=>portrait(c,a.portrait(Number(c.dataset.portrait))));
 list.scrollTop=lastScroll;root.scrollTop=lastScreenScroll;
 if(jumpToGearId){
  const target=[...list.querySelectorAll('[data-item]')].find(el=>el.dataset.item===jumpToGearId);
  if(target){
   // Scroll only the inventory list, never the entire armory or fighter carousel.
   const from=list.getBoundingClientRect(),to=target.getBoundingClientRect();
   const offset=to.top-from.top,margin=12;
   if(offset<margin)list.scrollTop+=offset-margin;
   else if(to.bottom>from.bottom-margin)list.scrollTop+=to.bottom-from.bottom+margin;
   lastScroll=list.scrollTop;
  }
  jumpToGearId=null;
 }
 // The fighter carousel is rebuilt on every selection; restore the exact user position.
 rosterScroll.scrollLeft=lastRosterScrollLeft;
 rosterScroll.addEventListener('scroll',()=>{lastRosterScrollLeft=rosterScroll.scrollLeft;},{passive:true});
 const details=root.querySelector('.ra-details');if(details)details.scrollTop=lastDetailScroll;
 const keep=(fn,resetDetail=false)=>{lastScroll=list.scrollTop;lastScreenScroll=root.scrollTop;lastRosterScrollLeft=rosterScroll.scrollLeft;lastDetailScroll=resetDetail?0:(details?.scrollTop||0);fn();};
 root.querySelector('#raHome').onclick=cb.goHome;
 root.querySelectorAll('[data-fighter]').forEach(b=>b.onclick=()=>keep(()=>{statFlash=null;cb.selectHero(Number(b.dataset.fighter));}));
 root.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>keep(()=>{statFlash=null;cb.setGear(b.dataset.item);},true));
 root.querySelectorAll('.ra-loadout-slot[data-loadout-gear]').forEach(b=>b.onclick=()=>{
  const itemId=b.dataset.loadoutGear;
  if(!itemId||!eq[b.dataset.loadoutSlot]||eq[b.dataset.loadoutSlot]!==itemId)return;
  keep(()=>{
   // Allocated gear may be hidden by category/rarity/owned/set filtering.
   // A loadout click must always reveal it in both detail and inventory.
   onlyOwned=false;onlySet=false;rarity='all';
   lastScroll=0;jumpToGearId=itemId;statFlash=null;
   cb.focusGear(itemId);
  },true);
 });
 root.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{lastScroll=0;lastDetailScroll=0;lastScreenScroll=root.scrollTop;cb.setCategory(b.dataset.cat);});
 root.querySelector('#raOwned').onclick=()=>{onlyOwned=!onlyOwned;lastScroll=0;lastScreenScroll=root.scrollTop;lastDetailScroll=0;cb.setGear(g?.id||'wood');};
 root.querySelector('#raSet').onclick=()=>{onlySet=!onlySet;lastScroll=0;lastScreenScroll=root.scrollTop;lastDetailScroll=0;cb.setGear(g?.id||'wood');};
 root.querySelector('#raRarity').onchange=e=>{rarity=e.target.value;lastScroll=0;lastScreenScroll=root.scrollTop;lastDetailScroll=0;cb.setGear(g?.id||'wood');};
 root.querySelector('#raSort').onclick=()=>keep(cb.sort);
 root.querySelector('#raEquip').onclick=()=>{if(g)keep(()=>{statFlash={fighter:state.active,before:actual};cb.setCurrentGear(g.id);cb.equip('equip');});};
 root.querySelector('#raRemove').onclick=()=>{if(g)keep(()=>{statFlash={fighter:state.active,before:actual};cb.setCurrentGear(g.id);cb.equip('remove');});};
 root.querySelector('#raBuy').onclick=()=>{if(g)keep(()=>cb.buy(g.id));};
 root.querySelector('#raSell').onclick=()=>{if(g)keep(()=>cb.sell(g.id));};
}
window.LudusLiveArmory={render};
})();
