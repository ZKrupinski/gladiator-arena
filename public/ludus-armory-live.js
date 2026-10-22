/* SPARTACUS illustrated 44-item armory */
(function(){'use strict';
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Math.round(Number(n)||0).toLocaleString('ko-KR');
const labels={weapon:'무기',shield:'방패',armor:'갑옷'};
let onlyOwned=false,onlySet=false,rarity='all',lastScroll=0,lastScreenScroll=0,lastDetailScroll=0;
const rk=['common','uncommon','rare','epic','legendary','relic'];
function portrait(canvas,source){if(!canvas||!source?.width||!source?.height)return;const c=canvas.getContext('2d'),s=Math.min((canvas.width-12)/source.width,(canvas.height-12)/source.height);try{c.drawImage(source,(canvas.width-source.width*s)/2,canvas.height-source.height*s-3,source.width*s,source.height*s);}catch(_){}}
function render(stage,a,cb){
 const s=a.state(),h=s.roster[s.active],stock=a.catalog(),owned=Array.isArray(h?.inventory)?h.inventory:[],eq=h?.equipment||{},rar=a.gearRarities(),sets=a.gearSets();
 const cat=cb.category||'all',filtered=stock.filter(g=>(cat==='all'||g.slot===cat)&&(rarity==='all'||g.rarity===rarity)&&(!onlyOwned||owned.includes(g.id))&&(!onlySet||g.setId));
 const sort=cb.sortMode%4;
 if(sort===1)filtered.sort((a,b)=>a.cost-b.cost);
 if(sort===2)filtered.sort((a,b)=>Number(owned.includes(b.id))-Number(owned.includes(a.id))||a.index-b.index);
 if(sort===3)filtered.sort((a,b)=>rk.indexOf(b.rarity)-rk.indexOf(a.rarity)||a.cost-b.cost);
 const g=filtered.find(x=>x.id===cb.selectedGear)||filtered[0],wear=!!g&&eq[g.slot]===g.id,has=!!g&&owned.includes(g.id),cost=g&&!has?g.cost:0;
 const can=!!h&&!!g&&(has||s.gold>=cost);
 const now=a.gearSummary(s.active),after=g?a.gearSummary(s.active,{...eq,[g.slot]:g.id}):now;
 const icon=x=>'<img class="ra-item-img" width="80" height="80" alt="" loading="lazy" src="'+esc(x.icon)+'">';
 const status=x=>eq[x.slot]===x.id?'<em class="ra-flag worn">✦ 장착 중</em>':owned.includes(x.id)?'<em class="ra-flag owned">◆ 보유 중</em>':'<em class="ra-flag price">◉ '+fmt(x.cost)+' D</em>';
 const cards=filtered.map(x=>'<button type="button" class="ra-item rarity-'+x.rarity+(g?.id===x.id?' selected':'')+(eq[x.slot]===x.id?' equipped':'')+'" data-item="'+esc(x.id)+'" aria-pressed="'+(g?.id===x.id)+'" style="--ra-tone:'+rar[x.rarity].color+'"><span class="ra-art">'+icon(x)+'</span><span class="ra-item-copy"><small class="ra-tier">'+rar[x.rarity].name+' · '+labels[x.slot]+'</small><strong>'+esc(x.name)+'</strong><small>공격 +'+x.atk+' / 체력 +'+x.hp+'</small>'+(x.setId?'<i>◈ 세트</i>':'')+'</span>'+status(x)+'</button>').join('');
 const fighters=s.roster.map((f,i)=>'<button type="button" data-fighter="'+i+'" class="ra-portrait '+(i===s.active?'selected':'')+'"><canvas width="112" height="100" data-portrait="'+i+'"></canvas><strong>'+esc(f.name)+'</strong><small>Lv.'+(f.level||1)+'</small></button>').join('');
 const cats=[['all','전체'],['weapon','⚔ 무기'],['shield','🛡 방패'],['armor','♜ 갑옷']].map(([key,name])=>'<button type="button" data-cat="'+key+'" class="'+(cat===key?'selected':'')+'">'+name+'</button>').join('');
 const eqLines=['weapon','shield','armor'].map(slot=>'<div class="ra-eq-line"><span>'+labels[slot]+'</span><strong>'+esc(stock.find(x=>x.slot===slot&&x.id===eq[slot])?.name||'미장착')+'</strong></div>').join('');
 const statLines=['atk','hp','armor'].map(k=>{const cur=k==='armor'?Math.round(now[k]*1000)/10:now[k],nxt=k==='armor'?Math.round(after[k]*1000)/10:after[k],dif=Math.round((nxt-cur)*10)/10;return '<div class="ra-stat-diff"><small>'+({atk:'공격력',hp:'체력',armor:'피해 감소'}[k])+'</small><b>'+cur+(k==='armor'?'%':'')+'</b><strong class="'+(dif>0?'plus':dif<0?'minus':'zero')+'">'+(dif>0?'▲ +':dif<0?'▼ ':'— ')+dif+(k==='armor'?'%':'')+'</strong></div>';}).join('');
 const set=sets[g?.setId],count=set?(after.pieces[g.setId]||0):0;
 const setLines=Object.entries(sets).map(([id,entry])=>{const n=now.pieces[id]||0;return '<div class="ra-set-row '+(n>=2?'active':'')+'"><span>'+esc(entry.name)+'</span><b>'+n+'/3</b><small>'+esc(n>=3?entry.three:n>=2?entry.two:'2세트에서 해금')+'</small></div>';}).join('');
 const effects=g?Object.entries(g.effect||{}).map(([k,v])=>'<b>✦ '+esc(window.ArenaGearCatalog.effectText(k,v))+'</b>').join(''):'';
 const ownedMark=wear?'✦ 현재 장착 중':has?'◆ 이미 보유 중':'미보유';
 stage.insertAdjacentHTML('beforeend',
 '<section class="ra-screen ra-collection"><header><div class="ra-title"><small>ARMAMENTARIVM · COLLECTIO</small><h1>장비실</h1></div><div class="ra-gold">◉ '+fmt(s.gold)+' D</div><button id="raHome" class="ra-home">⌂ 루두스 로비</button></header><main>'+
 '<section class="ra-col ra-fighters"><h2>♜ 소속 검투사</h2><div class="ra-roster">'+fighters+'</div><div class="ra-stage"><canvas id="raHero" width="405" height="392"></canvas></div><div class="ra-hero-info"><strong>'+(h?esc(h.name):'영입 필요')+'</strong><small>'+(h?esc(h.cls)+' · Lv.'+Number(h.level||1):'')+'</small></div><div class="ra-stats">'+(h?Object.entries({STR:h.stats?.str||0,AGI:h.stats?.agi||0,END:h.stats?.end||0,FOCUS:h.stats?.focus||0}).map(([k,v])=>'<span>'+k+' <b>'+v+'</b></span>').join(''):'')+'</div><div class="ra-sets"><h3>◈ 활성 세트 효과</h3>'+setLines+'</div></section>'+
 '<section class="ra-col ra-items"><h2>⚔ 장비 컬렉션 <small>보유 '+owned.length+' / '+stock.length+'종</small></h2><nav class="ra-cats">'+cats+'</nav><div class="ra-filters"><button id="raOwned" class="'+(onlyOwned?'active':'')+'">◆ 보유만</button><button id="raSet" class="'+(onlySet?'active':'')+'">◈ 세트만</button><select id="raRarity" aria-label="희귀도"><option value="all">전체 등급</option>'+rk.map(k=>'<option value="'+k+'" '+(rarity===k?'selected':'')+'>'+rar[k].name+'</option>').join('')+'</select></div><div class="ra-list">'+(cards||'<p>해당 조건의 장비가 없습니다.</p>')+'</div><button id="raSort" class="ra-sort">⇅ '+['기본순','가격순','보유순','희귀순'][sort]+'</button></section>'+
 '<section class="ra-col ra-details"><h2>✦ 장비 상세</h2><div class="ra-selected">'+(g?'<div class="ra-detail-head"><div class="ra-detail-image" style="--ra-tone:'+rar[g.rarity].color+'">'+icon(g)+'</div><div class="ra-detail-title"><small style="color:'+rar[g.rarity].color+'">✦ '+rar[g.rarity].name+'</small><h3>'+esc(g.name)+'</h3><strong>◉ '+fmt(g.cost)+' D</strong><span class="'+(wear?'worn':has?'owned':'')+'">'+ownedMark+'</span></div></div><p>'+esc(g.desc)+'</p><div class="ra-effects"><strong>기본 능력치 · 공격 +'+g.atk+' / 체력 +'+g.hp+'</strong>'+effects+'</div>':'장비를 선택하세요')+'</div>'+
 '<div class="ra-comparison"><h3>현재 장비와 비교</h3><div class="ra-stats-diff">'+statLines+'</div></div>'+
 (set?'<div class="ra-set-detail"><h3>◈ '+esc(set.name)+' <small>'+count+'/3</small></h3><p class="'+(count>=2?'active':'')+'">2세트 · '+esc(set.two)+'</p><p class="'+(count>=3?'active':'')+'">3세트 · '+esc(set.three)+'</p></div>':'')+
 '<div class="ra-equipped"><h3>현재 장착 슬롯</h3>'+eqLines+'</div><div class="ra-buttons"><button id="raEquip" '+(!can||wear?'disabled':'')+'>'+(!h?'검투사 필요':wear?'✦ 장착 중':!has?'◉ '+fmt(cost)+' D 구매·장착':'◆ 장착하기')+'</button><button id="raRemove" '+(!wear?'disabled':'')+'>해제</button></div></section></main><footer>희귀 장비를 수집하고, 2·3세트 조합으로 자신만의 전술을 완성하세요.</footer></section>');
 const root=stage.querySelector('.ra-collection'),list=root.querySelector('.ra-list');
 portrait(root.querySelector('#raHero'),h&&a.portrait(s.active));
 root.querySelectorAll('[data-portrait]').forEach(c=>portrait(c,a.portrait(Number(c.dataset.portrait))));
 list.scrollTop=lastScroll;
 root.scrollTop=lastScreenScroll;
 const details=root.querySelector('.ra-details');
 if(details)details.scrollTop=lastDetailScroll;
 const keep=(fn,resetDetail=false)=>{
   lastScroll=list.scrollTop;
   lastScreenScroll=root.scrollTop;
   lastDetailScroll=resetDetail?0:(details?.scrollTop||0);
   fn();
 };
 root.querySelector('#raHome').onclick=cb.goHome;
 root.querySelectorAll('[data-fighter]').forEach(b=>b.onclick=()=>keep(()=>cb.selectHero(Number(b.dataset.fighter))));
 root.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>keep(()=>cb.setGear(b.dataset.item),true));
 root.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{lastScroll=0;lastDetailScroll=0;lastScreenScroll=root.scrollTop;cb.setCategory(b.dataset.cat);});
 root.querySelector('#raOwned').onclick=()=>{onlyOwned=!onlyOwned;lastScroll=0;lastScreenScroll=root.scrollTop;lastDetailScroll=0;cb.setGear(g?.id||'wood');};
 root.querySelector('#raSet').onclick=()=>{onlySet=!onlySet;lastScroll=0;lastScreenScroll=root.scrollTop;lastDetailScroll=0;cb.setGear(g?.id||'wood');};
 root.querySelector('#raRarity').onchange=e=>{rarity=e.target.value;lastScroll=0;lastScreenScroll=root.scrollTop;lastDetailScroll=0;cb.setGear(g?.id||'wood');};
 root.querySelector('#raSort').onclick=()=>keep(cb.sort);
 root.querySelector('#raEquip').onclick=()=>{if(g)keep(()=>{cb.setCurrentGear(g.id);cb.equip('equip');});};
 root.querySelector('#raRemove').onclick=()=>{if(g)keep(()=>{cb.setCurrentGear(g.id);cb.equip('remove');});};
}
window.LudusLiveArmory={render};
})();