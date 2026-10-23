const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
global.Image=class{constructor(){this.src=''}};
const market=require('../public/market-scene.js');
const rng=s=>()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296};
const seen=new Set();
for(let n=1;n<=2000;n++){
 const stock=market.makeStock({marketSeed:n,roster:[]},rng(n*757));
 assert.equal(stock.length,3);
 for(const h of stock){
  assert(!/성장\s*\d+단계/.test(h.visualLabel));
  if(/_L[1-5]$/.test(h.visualId))seen.add(h.visualId);
 }
}
assert.equal(seen.size,20,'20 unique collectible sprite costumes');
const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
assert(html.includes('if(fixedLook(h))changedFixedLooks=true;'));
assert(html.includes('||changedFixedLooks)saveCareer();'));
assert(html.includes('visualId:o.visualId||'));
assert(html.includes('S.player.growthLevel=visualCareerStage(CAREER.hero)'));
assert(html.includes('f.growthLevel=visualCareerStage(h)'));
assert(!html.includes('id="careerGrowthType"'));
assert(!html.includes('승리하면 영입'));
console.log('PASS: 20 individual costumes, existing roster art freeze, no visual growth, stats & level preserved');
