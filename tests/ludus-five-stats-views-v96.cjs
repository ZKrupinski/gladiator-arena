'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync('public/'+p,'utf8');
const arm=read('ludus-armory-live.js'),card=read('ludus-cards.js');
const ac=read('ludus-armory-live.css'),cc=read('ludus-cards.css'),html=read('index.html');
new Function(arm);new Function(card);
const keys=['STR','AGI','DEF','END','FOCUS'];
const trained=arm.match(/\['(STR|AGI|DEF|END|FOCUS)','(str|agi|def|end|focus)'\]/g)||[];
assert.equal(trained.length,5,'armory shows five independent trained values');
assert.deepEqual(trained.map(s=>s.match(/'([A-Z]+)'/)[1]),keys);
assert.match(arm,/hero\.stats\?\.\[key\]/,'render live hero stats instead of hardcoded values');
assert.match(arm,/data-stat="'\+key\+'"/,'each armory stat is individually labeled');
assert.match(card,/\['DEF','방어',h\.stats\?\.def\?\?h\.stats\?\.end\?\?0\]/,
 'roster displays new defense score with legacy fallback');
const rosterStats=card.slice(card.indexOf('var stats=has?['),card.indexOf('var equip=has?',card.indexOf('var stats=has?[')));
for(const key of keys)assert(rosterStats.includes("['"+key+"'"),key+' missing in management');
assert.match(card,/lc-stat-code/,'roster splits long stat codes from descriptions');
assert.match(card,/\['def','방어'\]/,'inherited defense aptitude is shown');
assert.match(card,/innate\.growth\[v\[0\]==='def'\?'end':v\[0\]\]/,
 'DEF natural growth correctly inherits END-born predisposition');
assert.match(ac,/\.ra-fighters \.ra-stats\{\s*display:grid;grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
assert.match(cc,/#careerHub \.lc-roster-screen \.lc-stats\{\s*display:grid;grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
assert.match(cc,/#careerHub \.lc-roster-screen \.lc-aptitude>span\{\s*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
for(const f of ['ludus-armory-live.js','ludus-armory-live.css','ludus-cards.js','ludus-cards.css'])assert(html.includes(f+'?v=five-stats-v96'),f+' cache version updated');
console.log('PASS: five live stats, independent DEF, mobile five-column layouts and inherited growth details on BOTH screens');
