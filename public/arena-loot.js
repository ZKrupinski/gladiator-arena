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
// Roman arena gear recovered from conquered lands; indices match the 128px square atlas.
const expandedArmor=[{"id":"worn_cloth_hood","slot":"helmet","name":"구겨진 노예 두건","rarity":"common","cost":85,"atk":0,"hp":6,"effect":{},"minLevel":1,"desc":"투기장의 흙먼지를 막는 낡은 천 두건","atlasSheet":"conquered_gladiators","atlasIndex":40,"setId":null,"art":"helm"},{"id":"numidian_headwrap","slot":"helmet","name":"누미디아 천두건","rarity":"common","cost":110,"atk":0,"hp":8,"effect":{"stamina":0.012},"minLevel":1,"desc":"사막의 기수들이 사용하던 가벼운 두건","atlasSheet":"conquered_gladiators","atlasIndex":41,"setId":null,"art":"helm"},{"id":"gaul_iron_cap","slot":"helmet","name":"갈리아 철테 투구","rarity":"common","cost":145,"atk":0,"hp":10,"effect":{"armor":0.003},"minLevel":1,"desc":"갈리아 부족 용병의 투박한 철테","atlasSheet":"conquered_gladiators","atlasIndex":42,"setId":null,"art":"helm"},{"id":"thracian_plume","slot":"helmet","name":"트라키아 붉은 깃투구","rarity":"uncommon","cost":380,"atk":1,"hp":13,"effect":{"parryWindow":0.012},"minLevel":3,"desc":"트라키아 투사의 시선을 가리는 깃장식","atlasSheet":"conquered_gladiators","atlasIndex":43,"setId":null,"art":"helm"},{"id":"celtic_horn_helm","slot":"helmet","name":"켈트 야생뿔 투구","rarity":"uncommon","cost":485,"atk":2,"hp":15,"effect":{"armor":0.006},"minLevel":4,"desc":"켈트 전사의 투구를 검투장용으로 개조","atlasSheet":"conquered_gladiators","atlasIndex":44,"setId":null,"art":"helm"},{"id":"retiarius_mesh_helm","slot":"helmet","name":"철망 격투 가면","rarity":"rare","cost":1020,"atk":2,"hp":23,"effect":{"parryWindow":0.018},"minLevel":5,"desc":"근접 투사에게 위협적인 격자형 안면 보호구","atlasSheet":"conquered_gladiators","atlasIndex":45,"setId":null,"art":"helm"},{"id":"hispanic_falcon_mask","slot":"helmet","name":"히스파니아 매가면","rarity":"rare","cost":1190,"atk":3,"hp":25,"effect":{"beastDamage":0.035},"minLevel":6,"desc":"히스파니아 출신의 매 전사 투구","atlasSheet":"conquered_gladiators","atlasIndex":46,"setId":null,"art":"helm"},{"id":"minotaur_helm","slot":"helmet","name":"미노타우로스 투구","rarity":"epic","cost":2890,"atk":5,"hp":37,"effect":{"armor":0.014},"minLevel":9,"desc":"그리스 미궁의 괴수처럼 위압적인 투구","atlasSheet":"conquered_gladiators","atlasIndex":47,"setId":null,"art":"helm"},{"id":"champion_crested_helm","slot":"helmet","name":"챔피언의 자주빛 투구","rarity":"legendary","cost":6800,"atk":7,"hp":51,"effect":{"parryWindow":0.04},"minLevel":15,"desc":"검투장의 우승자에게 내린 월계와 자주빛 깃","atlasSheet":"conquered_gladiators","atlasIndex":48,"setId":null,"art":"helm"},{"id":"apollos_radiance_helm","slot":"helmet","name":"아폴론의 광휘","rarity":"relic","cost":11200,"atk":11,"hp":70,"effect":{"armor":0.022,"sp":6},"minLevel":20,"desc":"황금 익장식에 신성한 후광이 깃든 유물","atlasSheet":"conquered_gladiators","atlasIndex":49,"setId":null,"art":"helm"},{"id":"slave_wrist_wrap","slot":"bracers","name":"노예의 낡은 팔감개","rarity":"common","cost":80,"atk":0,"hp":5,"effect":{"stamina":0.012},"minLevel":1,"desc":"밧줄과 거친 천을 감은 초라한 팔보호구","atlasSheet":"conquered_gladiators","atlasIndex":60,"setId":null,"art":"bracer"},{"id":"pit_leather_guard","slot":"bracers","name":"투기장 가죽 완갑","rarity":"common","cost":120,"atk":1,"hp":5,"effect":{},"minLevel":1,"desc":"안쪽에 땀과 모래가 밴 가죽 완갑","atlasSheet":"conquered_gladiators","atlasIndex":61,"setId":null,"art":"bracer"},{"id":"bronze_wrist_plates","slot":"bracers","name":"청동 손목판","rarity":"common","cost":155,"atk":0,"hp":9,"effect":{"armor":0.003},"minLevel":2,"desc":"손등까지 덮는 값싼 청동 손목판","atlasSheet":"conquered_gladiators","atlasIndex":62,"setId":null,"art":"bracer"},{"id":"numidian_hunter_guard","slot":"bracers","name":"누미디아 사냥꾼 완갑","rarity":"uncommon","cost":360,"atk":2,"hp":10,"effect":{"stamina":0.022},"minLevel":3,"desc":"가벼운 사냥용 가죽 완갑","atlasSheet":"conquered_gladiators","atlasIndex":63,"setId":null,"art":"bracer"},{"id":"thracian_layered_guard","slot":"bracers","name":"트라키아 겹가죽 완갑","rarity":"uncommon","cost":490,"atk":1,"hp":15,"effect":{"armor":0.006},"minLevel":4,"desc":"트라키아식 겹가죽과 철테 보호대","atlasSheet":"conquered_gladiators","atlasIndex":64,"setId":null,"art":"bracer"},{"id":"retiarius_galerus","slot":"bracers","name":"레티아리우스 갈레루스","rarity":"rare","cost":1150,"atk":3,"hp":20,"effect":{"parryWindow":0.026},"minLevel":5,"desc":"그물 검투사의 투망팔과 어깨를 지키는 장비","atlasSheet":"conquered_gladiators","atlasIndex":65,"setId":null,"art":"bracer"},{"id":"gaul_lion_plates","slot":"bracers","name":"갈리아 사자 완갑","rarity":"rare","cost":1350,"atk":4,"hp":23,"effect":{"beastDamage":0.045},"minLevel":6,"desc":"사자 문양을 쳐 넣은 갈리아의 전리품","atlasSheet":"conquered_gladiators","atlasIndex":66,"setId":null,"art":"bracer"},{"id":"consuls_vambraces","slot":"bracers","name":"집정관의 금장 완갑","rarity":"epic","cost":3100,"atk":5,"hp":40,"effect":{"cooldown":0.15},"minLevel":10,"desc":"관중의 환호를 이끌어내는 화려한 완갑","atlasSheet":"conquered_gladiators","atlasIndex":67,"setId":null,"art":"bracer"},{"id":"blood_oath_gauntlet","slot":"bracers","name":"피의 맹세 완갑","rarity":"legendary","cost":7200,"atk":8,"hp":48,"effect":{"execute":0.045},"minLevel":15,"desc":"강공의 피니시를 강화하는 검붉은 팔보호구","atlasSheet":"conquered_gladiators","atlasIndex":68,"setId":null,"art":"bracer"},{"id":"emperor_right_hand","slot":"bracers","name":"황제의 오른손","rarity":"relic","cost":12800,"atk":11,"hp":62,"effect":{"sp":7,"parryWindow":0.035},"minLevel":20,"desc":"승리자를 결정하는 황금 팔보호구","atlasSheet":"conquered_gladiators","atlasIndex":69,"setId":null,"art":"bracer"}];
for(const item of expandedArmor){
 if(catalog.items.some(x=>x.id===item.id))continue;
 // Existing catalogue image remains a safe fallback until the approved bitmap
 // atlas assets are uploaded under assets/gear-atlas/.
 catalog.items.push({...item,index:catalog.items.length,icon:'assets/gear-icons/'+(item.slot==='helmet'?'bronze_cuirass.svg':'leather.svg')});
}

const extraEffects={execute:'빈사 처형 피해',lifesteal:'피해 흡수',secondWind:'빈사 자동 회복',reflect:'가드 반사 피해',lootLuck:'전리품 발견 확률',xpBonus:'승리 경험치'};
Object.assign(catalog.labels,extraEffects);
const oldText=catalog.effectText;
catalog.effectText=(key,value)=>extraEffects[key]?extraEffects[key]+' +'+Math.round(Number(value)*100)+'%':oldText(key,value);
const find=id=>catalog.items.find(x=>x.id===id);
const isShopItem=g=>!!g&&rank.indexOf(g.rarity)<2&&g.id!=='wood';
const level=g=>Number(g.minLevel)||(
 g.rarity==='relic'?19:g.rarity==='legendary'?13:g.rarity==='epic'?7:g.rarity==='rare'?3:
 g.rarity==='uncommon'?Math.max(2,Math.ceil(g.cost/230)):1);
/* One shared Ludus storeroom. Equipped items are allocated, never duplicated. */
function ensure(career){
 if(!Array.isArray(career.armoryInventory))career.armoryInventory=[];
 const prior=career.roster||[];
 if(career.gearStorageV2!==true){
  // Old saves stored inventory on each fighter, including equipped gear.
  // Move every unequipped copy into the Ludus store without duplicating worn copies.
  for(const h of prior){
   const incoming=Array.isArray(h.inventory)?h.inventory.slice():[];
   for(const slot of catalog.slots){
    const worn=h.equipment?.[slot],at=incoming.indexOf(worn);
    if(worn&&at>=0)incoming.splice(at,1);
   }
   for(const id of incoming)if(find(id))career.armoryInventory.push(id);
   h.inventory=[];
  }
  career.gearStorageV2=true;
 }
 // Newly recruited fighters may still arrive with a legacy starter inventory.
 for(const h of prior)if(Array.isArray(h.inventory)&&h.inventory.length){
  const incoming=h.inventory.slice();
  for(const slot of catalog.slots){
   const worn=h.equipment?.[slot],at=incoming.indexOf(worn);
   if(worn&&at>=0)incoming.splice(at,1);
  }
  for(const id of incoming)if(find(id))career.armoryInventory.push(id);
  h.inventory=[];
 }
 if(!Array.isArray(career.discoveredGear)){
  career.discoveredGear=[...new Set([...career.armoryInventory,...prior.flatMap(h=>Object.values(h.equipment||{}))].filter(id=>isShopItem(find(id))))];
 }
 if(!Number.isFinite(career.lootDryStreak))career.lootDryStreak=0;
 if(!Number.isFinite(career.lootRareStreak))career.lootRareStreak=0;
 return career;
}
const quantity=(career,id)=>ensure(career).armoryInventory.filter(v=>v===id).length;
const allocated=(career,id)=>ensure(career).roster.filter(h=>Object.values(h.equipment||{}).includes(id)).length;
const total=(career,id)=>quantity(career,id)+allocated(career,id);
function visible(career,hero,g){ensure(career);return !!g&&(total(career,g.id)>0||(isShopItem(g)&&career.discoveredGear.includes(g.id)));}
function offer(career,hero){return catalog.items.filter(g=>visible(career,hero,g));}
function shopEnabled(career,g){return isShopItem(g)&&ensure(career).discoveredGear.includes(g.id);}
function buy(career,id){
 const g=find(id);
 if(!shopEnabled(career,g))return {ok:false,message:'발견한 일반·고급 장비만 구매할 수 있습니다. 희귀 이상은 전투 전리품 전용입니다.'};
 if(career.gold<g.cost)return {ok:false,message:g.name+' 구매에 '+g.cost+'D가 필요합니다.'};
 career.gold-=g.cost;career.armoryInventory.push(id);
 return {ok:true,message:'루두스 창고에 '+g.name+' ×1 추가 · '+g.cost+'D 사용 · 보관 ×'+quantity(career,id)};
}
function equip(career,hero,id){
 const g=find(id);if(!hero||!g)return {ok:false,message:'장비와 검투사를 선택하세요.'};
 ensure(career);
 hero.equipment=hero.equipment||{};
 if(hero.equipment[g.slot]===id)return {ok:true,message:g.name+' · 이미 장착 중입니다.'};
 if(quantity(career,id)<1)return {ok:false,message:g.name+' 창고 재고가 없습니다. 발견한 일반·고급 장비는 추가 구입할 수 있습니다.'};
 // Allocate one store copy to this fighter, release previous equipped item to store.
 const prev=hero.equipment[g.slot];
 const index=career.armoryInventory.indexOf(id);
 career.armoryInventory.splice(index,1);
 if(prev&&find(prev))career.armoryInventory.push(prev);
 hero.equipment[g.slot]=id;
 return {ok:true,message:hero.name+'에게 '+g.name+' 배정 완료 · 루두스 보관 ×'+quantity(career,id)};
}
function remove(career,hero,id){
 const g=find(id);if(!hero||!g||hero.equipment?.[g.slot]!==id)return {ok:false,message:'선택한 장비를 장착 중이지 않습니다.'};
 ensure(career);hero.equipment[g.slot]=null;career.armoryInventory.push(id);
 return {ok:true,message:hero.name+'의 '+g.name+' 해제 → 루두스 공용 창고 ×'+quantity(career,id)};
}
function sell(career,id){
 const g=find(id),q=quantity(career,id);
 if(!g||!q||g.id==='wood')return {ok:false,message:'루두스 창고에 판매할 미착용 장비가 없습니다.'};
 const price=Math.max(1,Math.floor(g.cost*.42));
 if(!price)return {ok:false,message:'판매 불가능한 장비입니다.'};
 career.armoryInventory.splice(career.armoryInventory.indexOf(id),1);career.gold+=price;
 return {ok:true,message:g.name+' ×1 판매 +'+price+'D · 창고 재고 ×'+quantity(career,id),gold:price};
}
function choose(career,hero,context={},rng=Math.random){
 ensure(career);
 const heat=Math.max(0,Math.min(100,Number(context.excitement)||0));
 const bonus=(catalog.summary(hero).lootLuck||0);
 const base=(context.beast?.35:context.boss?.46:context.lineup?.31:.26);
 // Excitement opens more chances but none are guaranteed, even at score 100.
 const chance=Math.min(.88,Math.max(.03,
  (base+heat*.0041+Math.min(.12,bonus)+Math.min(.07,career.lootDryStreak*.011))
  *Math.max(0,Number(context.rollModifier??1))));
 if(rng()>=chance){career.lootDryStreak++;return null;}
 career.lootDryStreak=0;
 const lv=Math.max(1,Number(hero?.level)||1);
 let weights={common:56,uncommon:28,rare:11,epic:3.6,legendary:1.2,relic:.2};
 if(lv<3){weights={common:83,uncommon:17,rare:0,epic:0,legendary:0,relic:0};}
 else if(lv<7){weights={common:60,uncommon:32,rare:8,epic:0,legendary:0,relic:0};}
 else if(lv<13){weights.legendary=0;weights.relic=0;weights.epic=3;}
 else if(lv<19){weights.relic=0;}
 if(context.boss||context.beast){weights.rare*=1.35;weights.epic*=1.25;}
 // A spectacular fight increases the actual chance of rare+ gear, not merely item count.
 weights.rare*=1+heat/80;
 weights.epic*=1+heat/58;
 weights.legendary*=1+heat/48;
 weights.relic*=1+heat/40;
 if(career.lootRareStreak>=12&&lv>=3)weights.rare*=1.7;
 const bands=rank.map(r=>({r,items:catalog.items.filter(g=>g.id!=='wood'&&g.rarity===r&&level(g)<=lv),w:weights[r]})).filter(x=>x.items.length&&x.w>0);
 const weightTotal=bands.reduce((sum,x)=>sum+x.w,0);if(!weightTotal)return null;
 let pick=rng()*weightTotal,band=bands[bands.length-1];for(const x of bands){pick-=x.w;if(pick<0){band=x;break;}}
 const variants=band.items.filter(g=>!total(career,g.id));
 const pool=variants.length&&rng()<.76?variants:band.items;
 const item=pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))];
 if(rank.indexOf(item.rarity)>=2)career.lootRareStreak=0;else career.lootRareStreak++;
 return item;
}
function award(career,hero,context={},rng=Math.random){
 const item=choose(career,hero,context,rng);if(!item)return null;
 career.armoryInventory.push(item.id);
 if(isShopItem(item)&&!career.discoveredGear.includes(item.id))career.discoveredGear.push(item.id);
 return {id:item.id,name:item.name,rarity:item.rarity,level:level(item),count:quantity(career,item.id),unlocked:isShopItem(item),hero:hero.name};
}
function awardBattle(career,hero,context={},rng=Math.random){
 // Extra slots are EARNED by spectacular exchanges, not bought. A game
 // with zero fighting still has at most one low-probability drop attempt.
 const heat=Math.max(0,Math.min(100,Number(context.excitement)||0));
 const slots=Math.min(5,1+(heat>=22?1:0)+(heat>=44?1:0)+(heat>=66?1:0)+(heat>=88?1:0));
 const loot=[];
 // Each additional drop is another independent roll, with sharply diminishing odds.
 // 5/5 requires a true jackpot streak, not merely reaching 88 crowd heat.
 const rollStrength=[1,.84,.66,.42,.21];
 for(let i=0;i<slots;i++){
  const item=award(career,hero,{...context,excitement:heat,rollModifier:rollStrength[i]},rng);
  if(item)loot.push(item);
 }
 return loot;
}
root.ArenaLoot={rank,quantity,allocated,total,level,ensure,visible,offer,shopEnabled,buy,equip,remove,sell,choose,award,awardBattle,isShopItem};
})(globalThis);
