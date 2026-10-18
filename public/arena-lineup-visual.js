/* GLADIATOR ARENA — Signa Legionis: class heraldry, ordered roster status. */
(function(root){
'use strict';
const NAMES={murmillo:'무르밀로',thraex:'트라엑스',retiarius:'레티아리우스'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const numeral=n=>['I','II','III','IV','V','VI','VII','VIII','IX','X'][Math.max(0,Math.min(9,n-1))]||String(n);
const paths={
 murmillo:'<path d="M9 38c0-13 9-25 23-25s23 12 23 25v12l-9 9H17l-8-9Z" fill="currentColor" opacity=".21"/><path d="M9 38c0-13 9-25 23-25s23 12 23 25v12l-9 9H17l-8-9Z" stroke="currentColor" stroke-width="3.5" fill="none"/><path d="M16 16C22 7 39 5 49 17M20 12c1-9 20-11 26-3" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" fill="none"/><path d="M12 35h40l-8 8H20Zm8 13h24M25 35v8m14-8v8M14 47l5 12m31-12-5 12" stroke="currentColor" stroke-width="2.8" fill="none" stroke-linejoin="round"/>',
 thraex:'<path d="m17 48 9-12 14-13c7-6 8-14 5-18 10 8 9 19 1 27L32 45l-6 9-9-6Z" fill="currentColor" opacity=".19"/><path d="m17 48 9-12 14-13c7-6 8-14 5-18 10 8 9 19 1 27L32 45l-6 9m-9-6-9-6Z" stroke="currentColor" stroke-width="3.3" fill="none" stroke-linejoin="round"/><path d="m21 42-9 12 8 6 10-14M9 34c-3 10-2 16 5 21m0-36C5 23 4 33 9 41" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M46 15 34 34" stroke="currentColor" stroke-width="1.8"/>',
 retiarius:'<path d="M35 56V11M25 9v15c0 6 4 10 10 10s10-4 10-10V9M35 8v-3m-6 51h12" stroke="currentColor" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M9 31 20 19l13 14-12 15ZM12 34l13 8m-10-13 13 8M20 20l-5 21m11-16-6 22" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" fill="none"/><circle cx="35" cy="35" r="3" fill="currentColor"/>'
};
function crest(cls,boss){
 const kind=paths[cls]?cls:'murmillo';
 return '<svg class="arena-emblem-svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false">'+paths[kind]+'</svg>'+
  (boss?'<span class="arena-emblem-laurel" aria-hidden="true">✦</span>':'');
}
function seal(item,index,state,side){
 const boss=!!(item.boss||item.appearance==='murmillo_champion_red'||item.bossId==='murmillo_champion_red');
 const kind=paths[item.cls]?item.cls:'murmillo';
 const cls='arena-seal arena-seal--'+kind+(boss?' arena-seal--boss':'')+' arena-seal--'+state;
 const role=side==='ally'?'아군':'적군',stateName=state==='active'?'현재 출전':state==='fallen'?'탈락':'대기 중';
 const name=esc(item.name||NAMES[kind]);
 const aria=esc(role+' '+(index+1)+'번 '+NAMES[kind]+' '+(boss?'보스 ':'')+stateName);
 return '<div class="'+cls+'" data-side="'+side+'" data-index="'+index+'" data-state="'+state+'" title="'+name+'" aria-label="'+aria+'">'+
  '<span class="arena-seal-order">'+numeral(index+1)+'</span>'+
  '<span class="arena-seal-icon">'+crest(kind,boss)+'</span>'+
  '<span class="arena-seal-status" aria-hidden="true">'+(state==='active'?'◆':state==='fallen'?'×':'·')+'</span>'+
  (state==='active'?'<span class="arena-seal-life"><span data-live-hp="'+side+'" style="width:100%"></span></span>':'')+
  '</div>';
}
const cache=new WeakMap();
function paint(hud,queue,roster,player,enemy){
 if(!hud)return false;
 if(!queue||!queue.allies?.length||!queue.enemies?.length){
  hud.hidden=true;cache.delete(hud);return false;
 }
 const active=!queue.finished;
 const signature=[queue.mode,queue.allyIndex,queue.enemyIndex,queue.round,queue.finished,
  queue.allies.join(','),queue.enemies.map(x=>x.name+'-'+x.cls+(x.boss?'B':'')).join(',')].join('|');
 hud.hidden=false;
 if(cache.get(hud)!==signature){
  const allies=queue.allies.map((index,i)=>seal(roster[index]||{name:'GLADIATOR',cls:'murmillo'},i,
    i<queue.allyIndex?'fallen':active&&i===queue.allyIndex?'active':'queued','ally')).join('');
  const enemies=queue.enemies.map((item,i)=>seal(item,i,
    i<queue.enemyIndex?'fallen':active&&i===queue.enemyIndex?'active':'queued','enemy')).join('');
  hud.innerHTML='<div class="arena-march arena-march--ally" role="group" aria-label="아군 출전 순서">'+
   '<div class="arena-march-head"><span class="arena-march-flourish" aria-hidden="true">❦</span><strong>LUDUS NOSTER</strong>'+
   '<span class="arena-march-counter">'+Math.max(0,queue.allies.length-queue.allyIndex)+' / '+queue.allies.length+'</span></div>'+
   '<div class="arena-march-tokens">'+allies+'</div></div>'+
   '<div class="arena-march-centre" aria-hidden="true"><span class="arena-march-roman">'+(active?'PUGNA':'FINIS')+'</span>'+
   '<span class="arena-march-number">'+numeral(active?queue.round:Math.max(1,queue.round-1))+'</span>'+
   '<span class="arena-march-score">'+(queue.defeatedEnemies||0)+' <b>✶</b> '+(queue.defeatedAllies||0)+'</span></div>'+
   '<div class="arena-march arena-march--enemy" role="group" aria-label="상대 출전 순서">'+
   '<div class="arena-march-head"><span class="arena-march-counter">'+Math.max(0,queue.enemies.length-queue.enemyIndex)+' / '+queue.enemies.length+
   '</span><strong>ADVERSARII</strong><span class="arena-march-flourish" aria-hidden="true">❦</span></div>'+
   '<div class="arena-march-tokens">'+enemies+'</div></div>';
  cache.set(hud,signature);
  hud.setAttribute('aria-label','연속 결투 '+queue.mode+' · 아군 '+Math.min(queue.allies.length,queue.allyIndex+1)+
   '번, 상대 '+Math.min(queue.enemies.length,queue.enemyIndex+1)+'번, 격파 '+(queue.defeatedEnemies||0)+'명');
 }
 if(active){
  for(const [side,f] of [['ally',player],['enemy',enemy]]){
   const bar=hud.querySelector('[data-live-hp="'+side+'"]');
   if(!bar)continue;
   const amount=Math.max(0,Math.min(100,(f?.hp??0)/Math.max(1,f?.maxHp??1)*100));
   const width=amount.toFixed(1)+'%';
   if(bar.style.width!==width)bar.style.width=width;
  }
 }
 return true;
}
root.ArenaLineupVisual={version:'1.0.0',paint,crest};
if(typeof module!=='undefined'&&module.exports)module.exports=root.ArenaLineupVisual;
})(globalThis);