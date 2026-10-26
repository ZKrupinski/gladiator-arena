const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const scenes=fs.readFileSync(path.join(__dirname,'../public/ludus-approved-scenes.js'),'utf8');
const runtime=fs.readFileSync(path.join(__dirname,'../public/ludus-training-runtime.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../public/ludus-training-clean.css'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
const match=scenes.match(/const tiles=(\[[\s\S]*?\]);\n\/\/ All dialogue/);
assert(match,'training tile mapping defined in one place');
const tiles=Function('return '+match[1])();
assert.equal(tiles.length,5);
assert.equal(new Set(tiles.map(t=>t.stat)).size,4,'five training types -> four underlying stats');
assert.deepEqual(tiles.map(t=>t.stat),['str','end','end','agi','focus']);
assert.deepEqual(tiles.map(t=>t.statLabel),['STR · 근력','END · 지구력','END · 지구력','AGI · 민첩','FOCUS · 집중']);
for(const tile of tiles){assert(tile.name&&tile.statLabel&&tile.help,'every training button has explicit growth target');}
assert(tiles[1].shared&&tiles[2].shared,'defense and endurance share one END track');
assert.match(runtime,/class="lt-tile-stat"/,'stat labels appear directly on each tile');
assert.match(runtime,/class="lt-effect-stat"/,'selected stat appears in details');
assert.match(runtime,/data-stat="'+key+'"/,'highlight which stat changes');
assert.match(scenes,/statName:opt\.statLabel/,'result names actual grown stat');
assert.match(scenes,/tiles\[selectedTraining\]\.statLabel/,'fallback view is also accurate');
assert.match(css,/\.lt-tile-benefit/,'tile labels have dedicated CSS rather than covering art');
for(const ref of ['ludus-training-runtime.js','ludus-approved-scenes.js','ludus-training-clean.css']){
 assert(html.includes(ref+'?v=stat-target-v87'),ref+' cache busted');
}
console.log('PASS: five painted training options correctly identify four actual growth stats, shared END, selection, result and cache.');
