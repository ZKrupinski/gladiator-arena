const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const model=require('../public/ludus-recovery.js');
assert.deepEqual(model.healQuote({injury:32,level:17}),{needed:true,severe:false,gold:20,glory:0});
assert.deepEqual(model.restQuote({fatigue:67}),{needed:true,gold:66,glory:0});
assert.deepEqual(model.healQuote({injury:0}),{needed:false,severe:false,gold:12,glory:0});
assert.deepEqual(model.restQuote({fatigue:0}),{needed:false,gold:18,glory:0});
assert.deepEqual(model.healQuote({injury:100,level:20}),{needed:true,severe:false,gold:60,glory:0},
 'unrelated accumulated injuries are NOT automatically a severe-injury event');
assert.deepEqual(model.healQuote({injury:100,level:20,severeInjury:true}),
 {needed:true,severe:true,gold:800,glory:17});
function bout(h,conditions={},roll=()=>0){
 return model.maybeSevere(h,{injuryBefore:conditions.injuryBefore??h.injury,
  fatigueBefore:conditions.fatigueBefore??h.fatigue,
  glory:conditions.glory??100,rosterCount:conditions.rosterCount??4,roll});
}
const defeated={injury:0,fatigue:0,level:20};
assert.equal(bout(defeated,{injuryBefore:0,fatigueBefore:0},()=>0),false,
 'a knockout alone must NEVER create severe injury');
assert.equal(defeated.untreatedBouts,0);
const onlyHurt={injury:35,fatigue:0,level:20};
const onlyTired={injury:0,fatigue:43,level:20};
for(let i=0;i<15;i++){
 assert.equal(bout(onlyHurt,{},()=>0),false);
 assert.equal(bout(onlyTired,{},()=>0),false);
}
assert.equal(onlyHurt.untreatedBouts,0);assert.equal(onlyTired.untreatedBouts,0);
const tiredAndHurt={injury:34,fatigue:30,level:20};
assert.equal(bout(tiredAndHurt,{},()=>0),false,'first reckless bout is not enough');
assert.equal(bout(tiredAndHurt,{},()=>0),false,'second reckless bout is not enough');
assert.equal(tiredAndHurt.untreatedBouts,2);
assert.equal(bout(tiredAndHurt,{},()=>.01001),false,'third bout chance must be at most 1%');
assert.equal(bout(tiredAndHurt,{},()=>.01501),false,'fourth bout chance must be at most 1.5%');
assert.equal(bout(tiredAndHurt,{},()=>.01999),true,'fifth risky bout caps at 2%');
assert.equal(tiredAndHurt.severeInjury,true);assert(tiredAndHurt.injury>=85);
assert.equal(bout(tiredAndHurt,{},()=>0),false,'severe injury must not be applied twice');
model.recovered(tiredAndHurt);
assert.equal(tiredAndHurt.untreatedBouts,0,'a genuine treatment/rest clears streak');
tiredAndHurt.severeInjury=false;tiredAndHurt.injury=25;tiredAndHurt.fatigue=10;
assert.equal(bout(tiredAndHurt,{},()=>0),false,'post-treatment first sortie not risky');
const breakByCare={injury:42,fatigue:54,level:21,untreatedBouts:2};
assert.equal(bout(breakByCare,{injuryBefore:0},()=>0),false);
assert.equal(breakByCare.untreatedBouts,0,'not simultaneously hurt and tired resets risk');
const broke={injury:20,fatigue:20,level:20};
for(let i=0;i<6;i++)assert.equal(bout(broke,{glory:0},()=>0),false,
 'cannot create fame-locked serious injury when funds unavailable');
assert.equal(broke.severeInjury,undefined);
const lone={injury:20,fatigue:20,level:20};
for(let i=0;i<6;i++)assert.equal(bout(lone,{rosterCount:1},()=>0),false);
const cards=source('public/ludus-cards.js'),css=source('public/ludus-cards.css'),
      index=source('public/index.html');
assert(cards.includes("header('검투사 관리',s,true)"));
assert(cards.includes('lc-recovery-funds'));
assert(cards.includes('lc-care-injury')&&cards.includes('lc-care-fatigue'));
assert(cards.includes('lc-recovery-dock')&&cards.includes('lc-detail-scroll'));
assert(cards.includes('lc-care-actions')&&cards.includes('lc-major-action'));
const roster=cards.slice(cards.indexOf('function roster(){'),cards.indexOf('function beginDraft('));
for(const absent of ['id="lcTraining"','id="lcArmory"','id="lcReady"','lc-care-overview'])
 assert(!roster.includes(absent),'duplicate or unnecessary action on roster: '+absent);
for(const required of ['id="lcHeal"','id="lcRest"','a.recoveryQuote?.(s.active)','a.heal()','a.rest?.()'])
 assert(roster.includes(required),'missing real recovery action: '+required);
assert(cards.includes("draft&&severity?"),'big overlapping blocked-state banner must be draft-only');
assert(cards.includes("h?.severeInjury?'중상"),'severe tag must require actual severe event');
assert(index.includes('ludus-recovery.js?v=overexertion-v69'));
assert(index.includes('ludus-cards.js?v=arena-draft-header-v71'));
assert(index.includes('ludus-cards.css?v=arena-draft-header-v71'));
assert(index.includes('CAREER.gold-=quote.gold;CAREER.glory-=quote.glory'));
assert(index.includes('h.severeInjury=false'));
assert(index.includes('recoveryQuote:(i)=>'));
assert((index.match(/window.LudusRecovery.maybeSevere\(h,/g)||[]).length>=4);
assert((index.match(/injuryBefore,fatigueBefore/g)||[]).length>=3,
 'capture pre-match injuries and exhaustion, not newly inflicted battle wounds');
assert((index.match(/window.LudusRecovery.recovered\(h\)/g)||[]).length===3,
 'all 2 treatment paths and rest must reset the overexertion streak');
assert(css.includes('.lc-roster-screen .lc-recovery-dock'));
assert(css.includes('V71 · single horizontal header baseline'),'draft header must use compact responsive baseline');
assert(cards.includes("header('아레나 출전',s,true)"),'all arena modes use the finance-only compact header');
assert(cards.includes("heading==='아레나 출전'?'보유 금화':'회복 금화'"),'arena shows spendable gold instead of recovery currency label');

console.log('LUDUS_RECOVERY_MANAGEMENT_V69_UNIT_PASS');
