/* Regression: one registered gladiator identity propagates to market,
 * prices, scale/feet profiles, roster appearances and game sprite lookup.
 * No image copies or existing save overwrites are permitted.
 */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const memory=new Map();
global.localStorage={
 getItem:key=>memory.get(key)??null,
 setItem:(key,value)=>memory.set(key,String(value)),
 removeItem:key=>memory.delete(key)
};
global.Image=class{set src(value){this.source=value}};
const registry=require('../public/gladiator-registry.js');
const prices=require('../public/market-pricing.js');
const sizes=require('../public/practice-scale-profiles.js');
const market=require('../public/market-scene.js');
const motion=require('../public/sprite-motion-registry.js');
const TEST={
 visualId:'murmillo_qa_registered_v1',cls:'murmillo',label:'QA 황금 투구 무르밀로',
 assetFolder:'assets/combat/murmillo-qa-registered-v1',priceLevel:2
};
test('base game and editor include precisely the same 27 human identities',()=>{
 assert.equal(registry.market().length,27);
 assert.deepEqual(registry.ids(),market.MARKET_LOOKS.map(x=>x.visualId));
 assert.deepEqual(registry.ids(),prices.LOOK_IDS);
 assert.ok(registry.ids().every(k=>Object.hasOwn(sizes.DEFAULTS,k)));
 assert.deepEqual(new Set(registry.market().map(x=>x.visualId)).size,27);
 for(const key of [...registry.ids(),'beast_wolf','npc_carnifex']){
  assert.ok(Object.hasOwn(sizes.DEFAULTS,key),'calibration table missing '+key);
 }
 assert.ok(!registry.get('beast_wolf'));
 assert.ok(!prices.isMarketLook('npc_carnifex'));
});
test('a studio-generated new look automatically joins every game table',()=>{
 const baseline=market.makeStock({roster:[],marketSeed:9},()=>.5);
 const saved={...baseline[0],name:'Marcus Valerius',cost:560,vals:[4,6,5,7]};
 const look=registry.register(TEST);
 assert.equal(look.visualId,TEST.visualId);
 assert.equal(look.kind,'custom');
 assert.equal(registry.market().length,28);
 assert.equal(prices.LOOK_IDS.length,28);
 assert.equal(prices.DEFAULTS[look.visualId],2);
 assert.equal(sizes.DEFAULTS[look.visualId],1);
 assert.equal(sizes.FOOT_DEFAULTS[look.visualId],0);
 assert.equal(sizes.look({side:'ally',index:0},[
  {appearance:look.visualId,visualId:look.visualId,cls:'murmillo'}]),look.visualId);
 assert.equal(registry.artPath(look.visualId,'heavy'),
  'assets/combat/murmillo-qa-registered-v1/heavy.png');
 assert.equal(registry.artPath(look.visualId,'not-approved-motion'),null);
 market.syncCatalog();
 const stock=market.makeStock({roster:[],marketSeed:9},()=>.5,[saved]);
 assert.equal(stock.length,28);
 assert.equal(new Set(stock.map(x=>x.visualId)).size,28);
 assert.equal(stock[0].name,saved.name);
 assert.deepEqual(stock[0].vals,saved.vals);
 assert.equal(stock[0].cost,prices.quote(stock[0].visualId,9).cost);
 assert.equal(stock.at(-1).visualId,look.visualId);
 assert.equal(stock.at(-1).appearance,look.visualId);
 assert.equal(stock.at(-1).id,'murmillo');
 assert.equal(stock.at(-1).priceLevel,2);
 assert.equal(market.PAGE_COUNT,10,'all 28 registered looks are paginated dynamically');
 assert.equal(Math.ceil(registry.market().length/3),10);
});
test('a game-side SpriteMotionRegistry addition becomes visible to the same studio API',()=>{
 const record={
  visualId:'thraex_game_qa_v1',cls:'thraex',label:'QA 적색 시카 트라엑스',
  assetFolder:'assets/combat/thraex-game-qa-v1',priceLevel:3
 };
 motion.registerCharacter(record.visualId,{gladiator:record});
 assert.ok(registry.get(record.visualId));
 assert.equal(prices.LEVELS[prices.levelFor(record.visualId)-1].target,780);
 assert.equal(sizes.DEFAULTS[record.visualId],1);
 assert.equal(sizes.look({side:'enemy',look:record.visualId}),record.visualId);
 assert.equal(registry.custom().length,2);
 const stock=market.makeStock({roster:[],marketSeed:11},()=>.42);
 assert.equal(stock.length,29);
 assert.equal(stock.at(-1).visualId,record.visualId);
});
test('distinct IDs and art folder ownership cannot be overwritten or assigned to beasts',()=>{
 assert.throws(()=>registry.register({...TEST,label:'same id different art'}),/ID|이미/);
 assert.throws(()=>registry.register({...TEST,visualId:'murmillo_another_qa',label:'other'}),/이미|폴더/);
 assert.throws(()=>registry.register({...TEST,visualId:'beast_tiger',cls:'wolf'}),/클래스/);
 assert.equal(registry.isCustom('murmillo_champion_red'),false);
 assert.ok(!registry.market().some(x=>/^beast_|^npc_/.test(x.visualId)));
});
test('published defaults and local drafts keep exact custom identity on refresh',()=>{
 const draft=registry.read();
 assert.equal(draft.length,2);
 assert.equal(registry.sanitize(draft).length,2);
 assert.equal(prices.write({...prices.DEFAULTS,[TEST.visualId]:5}),true);
 assert.equal(prices.levelFor(TEST.visualId),5);
 assert.ok(prices.quote(TEST.visualId,0).cost<1450);
 assert.ok(prices.quote(TEST.visualId,0).cost>1200);
 assert.equal(registry.get(TEST.visualId).assetFolder,TEST.assetFolder);
 assert.equal(registry.artPath('murmillo_champion_red','idle'),null,
  'special built-in art must never be replaced by generic copy');
});
