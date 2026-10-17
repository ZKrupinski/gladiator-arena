/* Data-driven Ludus armory. All displayed data comes from LudusBridge. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={weapon:'무기',shield:'방패',armor:'갑옷'}, icons={weapon:'⚔',shield:'🛡',armor:'♜'};
function portrait(c,im){if(!c||!im||!im.width||!im.height)return;const ctx=c.getContext('2d');if(!ctx)return;const k=Math.min((c.width-12)/im.width,(c.height-12)/im.height),w=im.width*k,h=im.height*k;try{ctx.drawImage(im,(c.width-w)/2,c.height-h-3,w,h)}catch(_){}}
function render(stage,a,cb){
 const s=a.state(),hero=s.roster[s.active],catalog=a.catalog()||[],owned=hero&&Array.isArray(hero.inventory)?hero.inventory:[],equip=hero&&hero.equipment||{},cat=cb.category||'all';
 const filtered=catalog.filter(g=>cat==='all'||g.slot===cat);
 if(cb.sortMode%3===1)filtered.sort((x,y)=>x.cost-y.cost);
 if(cb.sortMode%3===2)filtered.sort((x,y)=>Number(owned.includes(y.id))-Number(owned.includes(x.id)));
 const chosen=filtered.find(g=>g.id===cb.selectedGear)||filtered[0];
 const wearing=!!hero&&!!chosen&&equip[chosen.slot]===chosen.id;
 const cost=chosen&&!owned.includes(chosen.id)?Number(chosen.cost)||0:0;
 const canUse=!!hero&&!!chosen&&(owned.includes(chosen.id)||Number(s.gold)>=cost);
 let bonusAtk=0,bonusHp=0;catalog.forEach(g=>{if(equip[g.slot]===g.id){bonusAtk+=Number(g.atk)||0;bonusHp+=Number(g.hp)||0;}});
 const roster=s.roster.map((f,i)=>'<button class="ra-portrait '+(i===s.active?'selected':'')+'" data-fighter="'+i+'"><canvas width="112" height="100" data-portrait="'+i+'"></canvas><strong>'+esc(f.name)+'</strong><small>Lv.'+(Number(f.level)||1)+'</small></button>').join('');
 const items=filtered.map(g=>'<button class="ra-item '+(chosen&&chosen.id===g.id?'selected':'')+'" data-item="'+esc(g.id)+'" aria-pressed="'+(chosen&&chosen.id===g.id)+'"><b>'+icons[g.slot]+'</b><span><strong>'+esc(g.name)+'</strong><small>'+esc(g.desc)+'</small></span><em>'+(equip[g.slot]===g.id?'✓ 장착 중':owned.includes(g.id)?'보유':'◉ '+g.cost+' D')+'</em></button>').join('');
 const equipped=['weapon','shield','armor'].map(k=>'<div><span>'+labels[k]+'</span><strong>'+esc(catalog.find(g=>g.id===equip[k])?.name||'미장착')+'</strong></div>').join('');
 const stats=hero?Object.entries({STR:hero.stats?.str||0,AGI:hero.stats?.agi||0,END:hero.stats?.end||0,FOCUS:hero.stats?.focus||0}).map(p=>'<span>'+p[0]+' <b>'+p[1]+'</b></span>').join(''):'';
 const categories=[['all','전체'],['weapon','무기'],['shield','방패'],['armor','갑옷']].map(p=>'<button data-cat="'+p[0]+'" class="'+(cat===p[0]?'selected':'')+'">'+p[1]+'</button>').join('');
 stage.insertAdjacentHTML('beforeend',
 '<section class="ra-screen"><header><div class="ra-title"><small>ARMAMENTARIVM · LVDVS</small><h1>장비실</h1></div><div class="ra-gold">◉ '+Number(s.gold||0).toLocaleString('ko-KR')+' D</div><button id="raHome" class="ra-home">⌂ 루두스 로비</button></header>'+
 '<main><section class="ra-col ra-fighters"><h2>♜ 소속 검투사</h2><div class="ra-roster">'+roster+'</div><div class="ra-stage"><canvas id="raHero" width="405" height="392"></canvas></div>'+
 '<div class="ra-hero-info"><strong>'+(hero?esc(hero.name):'검투사를 영입하세요')+'</strong><small>'+(hero?esc(({murmillo:'무르밀로',thraex:'트라엑스',retiarius:'레티아리우스'})[hero.cls]||hero.cls)+' · Lv.'+Number(hero.level||1):'소속 검투사 없음')+'</small></div><div class="ra-stats">'+stats+'</div></section>'+
 '<section class="ra-col ra-items"><h2>⚔ 장비 목록 <small>보유 '+owned.length+'종 / 전체 '+catalog.length+'종</small></h2><nav class="ra-cats">'+categories+'</nav><div class="ra-list">'+(items||'<p>해당 분류에 장비가 없습니다.</p>')+'</div><button id="raSort" class="ra-sort">⇅ '+['기본순','가격순','보유순'][cb.sortMode%3]+'</button></section>'+
 '<section class="ra-col ra-details"><h2>🛡 장비 상세</h2><div class="ra-selected"><div class="ra-icon">'+(chosen?icons[chosen.slot]:'✦')+'</div><h3>'+(chosen?esc(chosen.name):'장비를 선택하세요')+'</h3><p>'+(chosen?esc(chosen.desc):'')+'</p><small>'+(chosen?(wearing?'현재 장착 중':owned.includes(chosen.id)?'보유 중':'가격 '+cost+' D'):'')+'</small></div>'+
 '<div class="ra-equipped"><h3>현재 장착 장비</h3>'+equipped+'<div><span>장비 공격력</span><strong>+'+bonusAtk+'</strong></div><div><span>장비 최대 체력</span><strong>+'+bonusHp+'</strong></div></div>'+
 '<div class="ra-buttons"><button id="raEquip" '+(!canUse||wearing?'disabled':'')+'>'+(!hero?'검투사 필요':wearing?'장착 중':cost?'◉ '+cost+' D 구매·장착':'장착하기')+'</button><button id="raRemove" '+(!wearing?'disabled':'')+'>장착 해제</button></div></section></main>'+
 '<footer>검투사별 보유 장비와 장착 정보는 실제 루두스 저장 데이터에 반영됩니다.</footer></section>');
 const root=stage.querySelector('.ra-screen');portrait(root.querySelector('#raHero'),hero&&a.portrait(s.active));
 root.querySelectorAll('[data-portrait]').forEach(c=>portrait(c,a.portrait(Number(c.dataset.portrait))));
 root.querySelector('#raHome').onclick=cb.goHome;
 root.querySelectorAll('[data-fighter]').forEach(b=>b.onclick=()=>cb.selectHero(Number(b.dataset.fighter)));
 root.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>cb.setGear(b.dataset.item));
 root.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>cb.setCategory(b.dataset.cat));
 root.querySelector('#raSort').onclick=cb.sort;
 root.querySelector('#raEquip').onclick=()=>{if(chosen){cb.setCurrentGear(chosen.id);cb.equip('equip');}};
 root.querySelector('#raRemove').onclick=()=>{if(chosen){cb.setCurrentGear(chosen.id);cb.equip('remove');}};
}
window.LudusLiveArmory={render};
})();