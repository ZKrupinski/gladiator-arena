const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const model=require('../public/ludus-recovery.js');
assert.deepEqual(model.healQuote({injury:32,level:17}),{needed:true,severe:false,gold:20,glory:0});
assert.deepEqual(model.restQuote({fatigue:67}),{needed:true,gold:66,glory:0});
assert.deepEqual(model.healQuote({injury:0}),{needed:false,severe:false,gold:12,glory:0});
assert.deepEqual(model.restQuote({fatigue:0}),{needed:false,gold:18,glory:0});
assert.deepEqual(model.healQuote({injury:100,level:20}),{needed:true,severe:true,gold:800,glory:17});
assert(model.healQuote({injury:85,level:20}).gold>model.healQuote({injury:50,level:20}).gold*8);
assert.equal(model.maybeSevere({injury:0,level:20},{knockout:true,glory:100,rosterCount:1,roll:()=>0}),false,
 'early single-player squad cannot be trapped behind honor cost');
assert.equal(model.maybeSevere({injury:0,level:20},{knockout:true,glory:0,rosterCount:4,roll:()=>0}),false,
 'no unaffordable serious injury event when the squad has zero renown');
const hero={injury:34,level:20};
assert.equal(model.maybeSevere(hero,{knockout:true,glory:100,rosterCount:4,roll:()=>0.074}),true);
assert.equal(hero.severeInjury,true);assert(hero.injury>=80);
assert.equal(model.maybeSevere(hero,{knockout:true,glory:100,rosterCount:4,roll:()=>0}),false,
 'repeat settlement cannot give a second spike');
assert.equal(model.maybeSevere({injury:30,level:20},{knockout:true,glory:100,rosterCount:4,roll:()=>0.076}),false);
assert.equal(model.maybeSevere({injury:30,level:20},{damageRatio:.70,glory:100,rosterCount:4,roll:()=>.024}),true);
assert.equal(model.maybeSevere({injury:30,level:20},{damageRatio:.30,glory:100,rosterCount:4,roll:()=>0}),false);
const cards=source('public/ludus-cards.js'),css=source('public/ludus-cards.css'),
      index=source('public/index.html');
assert(cards.includes("header('검투사 관리',s,true)"));
assert(cards.includes('lc-recovery-funds'));
assert(cards.includes('lc-care-injury')&&cards.includes('lc-care-fatigue'));
assert(cards.includes('lc-care-actions')&&cards.includes('lc-major-action'));
const roster=cards.slice(cards.indexOf('function roster(){'),cards.indexOf('function beginDraft('));
for(const absent of ['id="lcTraining"','id="lcArmory"','id="lcReady"'])
 assert(!roster.includes(absent),absent+' should not distract from treatment');
for(const present of ['id="lcHeal"','id="lcRest"','a.recoveryQuote?.(s.active)','a.heal()','a.rest?.()'])
 assert(roster.includes(present),present+' should be connected to real game recovery');
assert(index.includes('ludus-recovery.js?v=healing-v68'));
assert(index.includes('ludus-cards.js?v=recovery-management-v68'));
assert(index.includes('ludus-cards.css?v=recovery-management-v68'));
assert(index.includes('CAREER.gold-=quote.gold;CAREER.glory-=quote.glory'));
assert(index.includes('h.severeInjury=false'));
assert(index.includes('recoveryQuote:(i)=>'));
assert((index.match(/window.LudusRecovery.maybeSevere\(h,/g)||[]).length>=4,
 'regular duel, gauntlet, beast hunt, and co-op all apply optional serious-injury rolls');
assert(css.includes('.lc-roster-screen .lc-top')&&css.includes('.lc-roster-screen .lc-care-actions>button'));
console.log('LUDUS_RECOVERY_MANAGEMENT_UNIT_PASS');
