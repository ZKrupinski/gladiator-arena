const assert=require('node:assert/strict');
const roster=require('../public/ludus-roster.js');
const old=[
 {cls:'murmillo',appearance:'murmillo_champion_red',name:'신규 챔피언 무르밀로',level:14,injury:25,wins:7,equipment:{weapon:'wood'}},
 {cls:'murmillo',appearance:'murmillo_motion_v3',name:'무르밀로 · 애니메이션',level:9},
 {cls:'thraex',appearance:'legacy',name:'챔피언 검투사',level:12},
 {cls:'retiarius',name:'레티아리우스 도전자',level:5},
 {cls:'murmillo',name:'Marcellus',level:7},
 {cls:'murmillo',name:'Aurelius',level:8}
];
const n=roster.normalizeNames(old);
assert.equal(n,4,'change placeholder names only');
assert.equal(roster.normalizeNames(old),0,'idempotent reload');
assert.equal(old[4].name,'Marcellus');
assert.equal(old[5].name,'Aurelius');
assert.equal(old[0].level,14);
assert.equal(old[0].injury,25);
assert.equal(old[0].wins,7);
assert.equal(old[0].equipment.weapon,'wood');
assert.equal(new Set(old.map(h=>h.name)).size,old.length,'unique fighter identities');
assert(old.every(h=>!roster.isPlaceholderName(h.name)));
const starter=roster.create('murmillo',7,{name:'챔피언 무르밀로',appearance:'murmillo_champion_red'});
assert(!roster.isPlaceholderName(starter.name),'starter uses a personal name');
const matchState={wins:4,roster:old};
const hero=old[0];
const first=roster.encounter(matchState,hero,()=>.5);
assert(first.boss);
assert(!roster.isPlaceholderName(first.name),'arena champion uses a Roman name');
assert.strictEqual(roster.encounter(matchState,hero,()=>.1),first,'opponent is stable until selection changes');
assert(roster.recruitBoss(matchState,first)?.name===first.name,'boss recruitment retains name');
assert.equal(roster.recruitBoss(matchState,first),null,'no duplicate recruitment');
assert(roster.isPlaceholderName('무르밀로 1'));
assert(!roster.isPlaceholderName('Marcus'));
console.log('PASS: Roman identity migration, uniqueness, custom names, persistence, boss names and recruitment');
