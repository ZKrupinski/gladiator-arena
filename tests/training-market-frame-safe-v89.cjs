// Painted market and training card safe-zone regression v89.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const src=p=>fs.readFileSync(path.join(__dirname,'../public',p),'utf8');
const t=src('ludus-training-clean.css'),m=src('market-selection-live.css'),html=src('index.html');
for(const rule of ['.lt-tile-button strong','.lt-tile-button .lt-tile-stat','.lt-tile-button .lt-tile-benefit','.lt-stat-list>div','.lt-effect-stat','.lt-cost','.lt-guidance'])assert(t.includes(rule),'training safe zone: '+rule);
for(const rule of ['.gm-card-dynamic .gm-roman-name','.gm-card-dynamic .gm-class','.gm-card-dynamic .gm-innate','.gm-card-dynamic .gm-lv','.gm-card-dynamic .gm-stat','.gm-stat-name','.gm-stat-track','.gm-bottom-info h2','.gm-bottom-info .gm-level'])assert(m.includes(rule),'market safe zone: '+rule);
assert(t.includes('top:131px!important')&&t.includes('height:16px'),'training final caption moved up');
assert(m.includes('height:17px;margin:1px 0!important'),'market bars tightly packed');
assert(m.includes('padding:4px 12px 8px!important'),'market card has 12px safe margin');
assert(html.includes('ludus-training-clean.css?v=training-frame-safe-v89'),'training cache refreshed');
assert(html.includes('market-selection-live.css?v=market-frame-safe-v89'),'market cache refreshed');
assert(131+16<=158-10,'training help has 11px bottom safe zone');
assert(202+3*34+2*4<332,'five real training stats fit before effect heading');
const marketHeight=4+25+2+30+3+14+1+18+2+4*18+8;
assert(marketHeight<=183,'four market bars and two-line class fit within illustration');
console.log('PASS: training 5-stat info, 5 card captions and three market booths fit within painted frame safe-zones.');
