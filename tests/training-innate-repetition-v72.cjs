const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const model=require('../public/ludus-training-risk.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const blank={birthStats:{str:2,agi:5,end:7,focus:6},aptitudes:{str:.9,agi:1,end:1.05,focus:1},trainingAttempts:{}};
for(const stat of model.KEYS){
 assert.equal(model.quote(blank,stat).percent,0,'initial training must not fail');
 assert.equal(model.quote(blank,stat).totalAttempts,0);
}
const start={...blank,trainingAttempts:{str:4,agi:1,end:1,focus:0}};
assert.equal(model.quote(start,'str').chance,0,'first 7 sessions are safe; total 6');
const ready={...blank,trainingAttempts:{str:5,agi:1,end:1,focus:0}};
assert(model.quote(ready,'str').chance>0,'eighth session has genuine chance');
assert(model.quote(ready,'str').chance<.20);
const weak={...blank,trainingAttempts:{str:10,agi:8,end:8,focus:8}};
const low=model.quote(weak,'str'),strong=model.quote(weak,'end');
assert(low.chance>strong.chance*1.15,'low Lv.0 stats increase repeated training risk');
assert(low.chance<=.72,'chance capped below 100%');
const bornOriginal={...weak,stats:{str:3,agi:5,end:5,focus:4}};
const evolved={...weak,stats:{str:9999,agi:0,end:0,focus:1},level:50};
assert.equal(model.quote(bornOriginal,'str').chance,model.quote(evolved,'str').chance,
 'current stats and level cannot rewrite immutable Lv.0 potential');
const legacy={stats:{str:200,agi:1,end:1,focus:1},trainingAttempts:{str:10,agi:8,end:8,focus:8}};
assert.equal(model.quote(legacy,'str').chance,model.quote({...legacy,stats:{str:0,agi:99,end:99,focus:99}},'str').chance,
 'legacy saves without authentic birth record must remain neutral');
const before=model.quote(weak,'str');
assert.equal(model.attempt(weak,'str',()=>0).failed,true,'eligible random failure must consume attempt');
assert.equal(weak.trainingAttempts.str,11);
assert.equal(model.quote(weak,'str').totalAttempts,before.totalAttempts+1);
assert.equal(model.attempt(weak,'str',()=>.999999).failed,false,'success still possible');
assert.equal(weak.trainingAttempts.str,12);
assert.equal(model.attempt({trainingAttempts:{}},'str',()=>0).failed,false,'new fighter cannot randomly fail');
assert.equal(model.quote({trainingAttempts:{str:100,agi:100,end:100,focus:100}},'str').chance,.72);
const index=read('public/index.html'),scenes=read('public/ludus-approved-scenes.js'),
 runtime=read('public/ludus-training-runtime.js'),css=read('public/ludus-training-clean.css');
assert(index.includes('ludus-training-risk.js?v=innate-repetition-v72'),'game loads risk engine');
assert(index.includes('window.LudusTrainingRisk.attempt(h,stat)'),'normal training uses risk roll');
assert(index.includes('window.LudusTrainingRisk.attempt(CAREER.hero,stat)'),'timing minigame uses risk roll');
assert(index.includes("if(result.failed)"),'failed normal training must skip stat and XP changes');
assert(index.includes('if(!result.failed){'),'failed normal training must not display success FX');
assert(index.includes('const earned=exhausted?0:'),'probabilistic minigame failure must award 0 XP');
assert(scenes.includes("speechPhase=failed?'failed'"),'Doctore reacts correctly to failed sessions');
assert(runtime.includes('lt-risk-row'),'real training info displays risk counter');
assert(runtime.includes('totalAttempts'),'show lifetime per-fighter training count');
assert(css.includes('.lt-risk-row.lt-risk-active'),'training danger highlight exists');
console.log('TRAINING_INNATE_REPETITION_UNIT_PASS',JSON.stringify({weak:low.percent,strong:strong.percent,stage:before.totalAttempts}));
