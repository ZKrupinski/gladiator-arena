const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const rules=require('../public/ludus-practice.js');
const summary=rules.practiceSummary;
assert.equal(typeof summary,'function','endless training exports a single scoreboard model');
assert.deepEqual(summary({wave:15,clearedWave:14,kills:78},{best:15}),
 {reached:15,cleared:14,kills:78,best:15});
assert.deepEqual(summary({wave:6,clearedWave:5,kills:20},{best:17}),
 {reached:6,cleared:5,kills:20,best:17});
assert.deepEqual(summary({wave:1,clearedWave:0,kills:0},{best:1}),
 {reached:1,cleared:0,kills:0,best:1});
assert.deepEqual(summary({wave:3,clearedWave:5,kills:-6},{best:-4}),
 {reached:3,cleared:3,kills:0,best:0});
const js=fs.readFileSync(path.join(__dirname,'../public/ludus-practice.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../public/ludus-practice.css'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
assert(!js.includes('전원 전투불능'),'endless practice must not make failure the primary result');
assert(js.includes("'단계 도달'"),'reached stage is the primary headline');
for(const id of ['epResultTitle','epResultCleared','epResultKills','epResultBest','epRewards'])
 assert(js.includes('id="'+id+'"'),'missing actual result display '+id);
for(const v of ['accomplishment.reached','accomplishment.cleared','accomplishment.kills','accomplishment.best'])
 assert(js.includes(v),'result value must be bound to the actual battle '+v);
assert(js.includes("api()?.practiceReward?.(payout,snap.wave,snap.kills,quit)"),
 'real training rewards must not be replaced by fake demonstration values');
for(const selector of ['.ep-result-metrics','.ep-result-metric','.ep-result-achievement','.ep-rewards-title'])
 assert(css.includes(selector),'styled result visual missing: '+selector);
assert(html.includes('result-honors-v27'),'production index must bust the old asset cache');
console.log('PRACTICE_ACHIEVEMENT_SCOREBOARD_UNIT_PASS');
