/* SPARTACUS V6 loot economy — fighter-bound copies, discovery-driven shop, battle-only rare drops. */
(function(root){'use strict';
const catalog=root.ArenaGearCatalog;
if(!catalog)throw Error('Gear catalog must load before ArenaLoot');
const rank=['common','uncommon','rare','epic','legendary','relic'];
const premiums=[
 {id:'wolves_oath',slot:'weapon',name:'늑대왕의 송곳니',rarity:'rare',cost:1880,atk:17,hp:8,effect:{execute:.12},desc:'체력 35% 아래의 적에게 처형 피해 +12%',art:'serrated',setId:'venatio',minLevel:4},
 {id:'arena_fortune',slot:'weapon',name:'승리의 주사위검',rarity:'rare',cost:1740,atk:13,hp:12,effect:{lootLuck:.12},desc:'승리 후 전리품 드롭 확률 +12%p',art:'curve',setId:null,minLevel:3},
 {id:'mirage_sica',slot:'weapon',name:'신기루 시카',rarity:'epic',cost:3900,atk:27,hp:0,effect:{cooldown:.4,execute:.16},desc:'필살기 쿨타임 -0.4초 · 빈사 적 추가 피해 +16%',art:'curve',setId:null,minLevel:8},
 {id:'sanguine_edge',slot:'weapon',name:'피를 마시는 검',rarity:'legendary',cost:8400,atk:37,hp:8,effect:{lifesteal:.11},desc:'명중 피해 일부를 흡수해 최대 HP 4%까지 회복',art:'serrated',setId:null,minLevel:14},
 {id:'mars_judgement',slot:'weapon',name:'마르스의 최후통첩',rarity:'relic',cost:15000,atk:48,hp:25,effect:{execute:.25,sp:16},desc:'빈사 대상 처형 피해 +25% · 필살기 위력 +16',art:'gladius',setId:null,minLevel:20},
 {id:'parry_wolf',slot:'shield',name:'사슬늑대 버클러',rarity:'rare',cost:1770,atk:5,hp:67,effect:{parryWindow:.07},desc:'패링 성공을 노리는 늑대 문양 방패',art:'buckler',setId:'venatio',minLevel:4},
 {id:'thorax_reflector',slot:'shield',name:'불굴의 반사경',rarity:'epic',cost:4000,atk:4,hp:98,effect:{reflect:.16,armor:.025},desc:'막은 공격의 일부를 상대에게 되돌림',art:'shield',setId:null,minLevel:8},
 {id:'aegis_rebirth',slot:'shield',name:'불사조의 방패',rarity:'legendary',cost:8700,atk:5,hp:122,effect:{secondWind:.14},desc:'경기당 1회 빈사 시 최대 HP 14% 회복',art:'shield',setId:null,minLevel:15},
 {id:'trainer_favor',slot:'armor',name:'독토레의 비밀 갑옷',rarity:'rare',cost:1900,atk:4,hp:84,effect:{xpBonus:.17,trainingDiscount:.05},desc:'시합 경험치 +17% · 훈련 비용 -5%',art:'armor',setId:'training',minLevel:4},
 {id:'laurel_gambit',slot:'armor',name:'승부사의 월계 흉갑',rarity:'epic',cost:4200,atk:10,hp:99,effect:{lootLuck:.09,goldBonus:.06},desc:'전리품 +9%p · 승리 데나리우스 +6%',art:'armor',setId:'champion',minLevel:9},
 {id:'lionheart_armor',slot:'armor',name:'사자심장의 성의',rarity:'legendary',cost:9200,atk:12,hp:145,effect:{secondWind:.1,injuryReduction:.15},desc:'빈사 회복 +10% · 부상 축적 -15%',art:'armor',setId:'venatio',minLevel:15},
 {id:'emperors_miracle',slot:'armor',name:'황제의 기적',rarity:'relic',cost:15500,atk:19,hp:175,effect:{secondWind:.2,lootLuck:.08},desc:'경기당 1회 체력 20% 회복 · 전리품 +8%p',art:'armor',setId:'laurel',minLevel:20}
];
for(const item of premiums)if(!catalog.items.some(x=>x.id===item.id))catalog.items.push({...item,index:catalog.items.length,icon:'assets/gear-icons/'+({weapon:'iron',shield:'shield',armor:'bronze_cuirass'}[item.slot])+'.svg'});
const extraEffects={execute:'빈사 처형 피해',lifesteal:'피해 흡수',secondWind:'빈사 자동 회복',reflect:'가드 반사 피해',lootLuck:'전리품 발견 확률',xpBonus:'승리 경험치'};
Object.assign(catalog.labels,extraEffects);
const oldText=catalog.effectText;
catalog.effectText=(key,value)=>extraEffects[key]?extraEffects[key]+' +'+Math.round(Number(value)*100)+'%':oldText(key,value);
const find=id=>catalog.items.find(x=>x.id===id);
const isShopItem=g=>!!g&&rank.indexOf(g.rarity)<2&&g.id!=='wood';
const quantity=(hero,id)=>Array.isArray(hero?.inventory)?hero.inventory.filter(v=>v===id).length:0;
const level=g=>Number(g.minLevel)||(
 g.rarity==='relic'?19:g.rarity==='legendary'?13:g.rarity==='epic'?7:g.rarity==='rare'?3:
 g.rarity==='uncommon'?Math.max(2,Math.ceil(g.cost/230)):1);
function ensure(career){
 if(!Array.isArray(career.discoveredGear)){
  // Legacy purchases count as discovered; do not delete or reassign existing equipment.
  career.discoveredGear=[...new Set((career.roster||[]).flatMap(h=>Array.isArray(h.inventory)?h.inventory:[]).filter(id=>isShopItem(find(id))))];
 }
 if(!Number.isFinite(career.lootDryStreak))career.lootDryStreak=0;
 if(!Number.isFinite(career.lootRareStreak))career.lootRareStreak=0;
 return career;
}
function visible(career,hero,g){ensure(career);return !!g&&(g.id==='wood'?quantity(hero,'wood')>0:quantity(hero,g.id)>0||(isShopItem(g)&&career.discoveredGear.includes(g.id)));}
function offer(career,hero){return catalog.items.filter(g=>visible(career,hero,g));}
function shopEnabled(career,g){return isShopItem(g)&&ensure(career).discoveredGear.includes(g.id);}
function buy(career,hero,id){
 const g=find(id);if(!hero||!shopEnabled(career,g))return {ok:false,message:'이 장비는 전리품으로 발견한 후에만 구매할 수 있습니다. 희귀 이상은 오직 전투 보상입니다.'};
 if(career.gold<g.cost)return {ok:false,message:g.name+' 구매에 '+g.cost+'D가 필요합니다.'};
 career.gold-=g.cost;if(!Array.isArray(hero.inventory))hero.inventory=[];
 hero.inventory.push(id);
 return {ok:true,message:'구매 성공! '+g.name+' · '+g.cost+'D 사용 · 보유 ×'+quantity(hero,id)};
}
function sell(career,hero,id){
 const g=find(id),q=quantity(hero,id);
 if(!hero||!g||!q||g.id==='wood')return {ok:false,message:'판매할 장비가 없습니다.'};
 if(hero.equipment?.[g.slot]===id&&q<2)return {ok:false,message:'마지막 장착 장비는 먼저 해제해야 판매할 수 있습니다.'};
 const price=Math.max(1,Math.floor(g.cost*.42));
 if(!price)return {ok:false,message:'판매 가능한 장비가 아닙니다.'};
 hero.inventory.splice(hero.inventory.indexOf(id),1);career.gold+=price;
 return {ok:true,message:g.name+' 판매 +'+price+'D · 남은 수량 ×'+quantity(hero,id),gold:price};
}
function choose(career,hero,context={},rng=Math.random){
 ensure(career);
 const chance=Math.min(.82,(context.beast?.53:context.boss?.67:context.lineup?.43:.36)+Math.min(.16,(hero?.equipment&&catalog.summary(hero).lootLuck)||0)+Math.min(.10,career.lootDryStreak*.014));
 if(rng()>=chance){career.lootDryStreak++;career.lootRareStreak++;return null;}
 career.lootDryStreak=0;
 const lv=Math.max(1,Number(hero?.level)||1);
 let weights={common:56,uncommon:28,rare:11,epic:3.6,legendary:1.2,relic:.2};
 if(lv<3){weights={common:83,uncommon:17,rare:0,epic:0,legendary:0,relic:0};}
 else if(lv<7){weights={common:60,uncommon:32,rare:8,epic:0,legendary:0,relic:0};}
 else if(lv<13){weights.legendary=0;weights.relic=0;weights.epic=3;}
 else if(lv<19){weights.relic=0;}
 if(context.boss||context.beast){weights.rare*=1.4;weights.epic*=1.3;}
 if(career.lootRareStreak>=12&&lv>=3)weights.rare*=1.7;
 const bands=rank.map(r=>({r,items:catalog.items.filter(g=>g.id!=='wood'&&g.rarity===r&&level(g)<=lv),w:weights[r]})).filter(x=>x.items.length&&x.w>0);
 const total=bands.reduce((s,x)=>s+x.w,0);if(!total)return null;
 let pick=rng()*total,band=bands[bands.length-1];for(const x of bands){pick-=x.w;if(pick<0){band=x;break;}}
 const variants=band.items.filter(g=>!quantity(hero,g.id));
 const pool=variants.length&&rng()<.76?variants:band.items;
 const item=pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))];
 if(rank.indexOf(item.rarity)>=2)career.lootRareStreak=0;else career.lootRareStreak++;
 return item;
}
function award(career,hero,context={},rng=Math.random){
 const item=choose(career,hero,context,rng);if(!item)return null;
 if(!Array.isArray(hero.inventory))hero.inventory=[];
 hero.inventory.push(item.id);
 if(isShopItem(item)&&!career.discoveredGear.includes(item.id))career.discoveredGear.push(item.id);
 return {id:item.id,name:item.name,rarity:item.rarity,level:level(item),count:quantity(hero,item.id),unlocked:isShopItem(item),hero:hero.name};
}
root.ArenaLoot={rank,quantity,level,ensure,visible,offer,shopEnabled,buy,sell,choose,award,isShopItem};
})(globalThis);
