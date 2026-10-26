/* v105: practice time-on-task XP and survivor-only layout regression. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const rules=require('../public/ludus-practice.js');
const source=fs.readFileSync(path.join(root,'public/ludus-practice.js'),'utf8');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
assert.equal(rules.experienceMultiplier(4),1);
assert.equal(rules.experienceMultiplier(3),1.3);
assert.equal(rules.experienceMultiplier(2),1.6);
assert.equal(rules.experienceMultiplier(1),2.2);
for(const n of [1,2,3,4]){
 assert.equal(rules.experienceAward(100,n),[0,220,160,130,100][n]);
 const survivors=Array.from({length:n},(_,i)=>({seat:4-n+i}));
 const result=rules.courtAssignments(survivors),layout=rules.courtsForParty(n);
 assert.equal(result.length,n);
 assert(result.every((a,i)=>a.seat===i&&a.homeX===layout[i].x-87&&a.y===layout[i].y));
 assert(result.every(a=>a.unit===survivors.find(u=>u.seat===4-n+a.seat)));
}
assert.deepEqual(rules.courtAssignments([]),[]);
assert.equal(rules.engagementBonusRules(10,4).chunk,0);
for(const n of [1,2,3]){
 const b=rules.engagementBonusRules(10,n);
 assert(b.every>0&&b.cap>0&&b.chunk>0&&b.cap<b.chunk*15,'bounded combat reward');
}
assert(source.includes("e.entry<=0"),'only landed opponents grant time XP');
assert(source.includes("rules.cap-(h.engagementBonus||0)"),'per-wave farming cap');
assert(source.includes("h.engagementClock=0;h.engagementBonus=0"),'reset each wave');
assert(source.includes("!battle.exits.length&&!battle.cleared"),'do not reflow over Carnifex');
assert(source.includes("beginSurvivorReflow();"),'reflow invoked after wave clear');
assert(source.includes("advanceSurvivorReflow(dt)"),'smooth movement during break');
assert(source.includes("COURTS=courtsForParty(live.length)"),'survivor layout');
assert(source.includes("battle.breakTime=1.8"),'transition duration longer than interpolation');
assert(!source.includes("battle.heroes.filter(h=>!h.dead).forEach(h=>h.exp+=waveXP(battle.wave))"),
 'old unweighted clear removed');
assert(html.includes("ludus-practice.js?v=survivor-xp-reflow-v105-20261026"));
console.log('PRACTICE_SURVIVOR_EXP_REFLOW_PASS: weighted rewards, capped engagement, 1-4 layout, safe tween');
