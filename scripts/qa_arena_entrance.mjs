/* Battle entry: real walk-on -> victory keypose -> forward rush.
 * Run: node scripts/qa_arena_entrance.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const entry=fs.readFileSync(new URL('../public/arena-entrance.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const root={};
vm.runInNewContext(entry,{globalThis:root});
const A=root.ArenaEntrance;
assert.equal(A.version,'1.0.0');
assert.ok(A.TIME.run<1,'entrance sprint must be brief');
assert.ok(A.TIME.pose>=.4,'triumph keypose must read clearly');
assert.ok(A.TOTAL>1.3&&A.TOTAL<2.1,'keep walk-on cinematic brisk');
const actor=(enemy,x)=>({enemy,x,vx:0,face:enemy?-1:1,action:'idle',walkT:0,guard:false,stagger:0,dodge:0});
const left=actor(false,335),right=actor(true,940);
const pair=A.begin([left,right],1280);
assert.equal(pair.entries.length,2);
assert.equal(left.x,-202,'entire left sprite starts outside the left viewport');
assert.equal(right.x,1482,'entire right sprite starts outside right viewport');
assert.equal(A.pose(pair,left),'walk');
assert.equal(A.pose(pair,right),'walk');
assert.equal(A.advance(pair,A.TIME.run/2),false);
assert.ok(left.x>-202&&left.x<335,'left gladiator actually runs onstage');
assert.ok(right.x<1482&&right.x>940,'right gladiator actually runs onstage');
assert.equal(A.advance(pair,A.TIME.run/2),false);
assert.equal(left.x,335);
assert.equal(right.x,940);
assert.equal(A.pose(pair,left),'finisher','approved authentic victory stance');
assert.equal(A.pose(pair,right),'finisher','both original contestants pose');
assert.equal(left.action,'finisher');
assert.equal(A.advance(pair,A.TIME.pose),false);
assert.equal(left.x,335,'hold victory stationary');
assert.equal(right.x,940);
assert.equal(A.advance(pair,A.TIME.charge/2),false);
assert.ok(left.x>335&&left.x<400,'player surges forward');
assert.ok(right.x<940&&right.x>875,'enemy surges forward');
assert.equal(A.pose(pair,right),'walk','charge reuses fast walk pose');
assert.equal(A.advance(pair,A.TIME.charge/2),true);
assert.equal(left.x,400);assert.equal(right.x,875);
assert.equal(left.vx,0);assert.equal(right.vx,0);
assert.equal(left.action,'idle');assert.equal(right.action,'idle');
assert.equal(A.advance(pair,1),true,'finished entrance is idempotent');
for(const [side,x,target] of [[true,940,875],[false,335,400]]){
 const survivor=actor(!side,side?335:940);
 const incoming=actor(side,x);
 const untouched={x:survivor.x,face:survivor.face,action:survivor.action};
 const reinforcement=A.begin([incoming],1280);
 assert.equal(A.pose(reinforcement,survivor),'idle','survivor must NOT re-enter');
 assert.equal(A.pose(reinforcement,incoming),'walk');
 assert.equal(incoming.x,side?1482:-202,'only incoming fighter starts offscreen');
 A.advance(reinforcement,A.TIME.run);
 assert.equal(A.pose(reinforcement,incoming),'finisher');
 A.advance(reinforcement,A.TIME.pose);
 A.advance(reinforcement,A.TIME.charge);
 assert.equal(incoming.x,target,'reinforcement rushes toward survivor');
 assert.deepEqual({x:survivor.x,face:survivor.face,action:survivor.action},untouched,
  'living veteran is never moved, damaged or changed by reinforcement');
}
assert.match(html,/arena-entrance\.js\?v=[^"\s]+/);
assert.match(html,/if\(!beastMatch\)beginArenaEntrance\(\[S\.player,S\.enemy\]\)/);
assert.match(html,/S\.player\.x=335;\s*beginArenaEntrance\(\[S\.player,S\.enemy\]\)/,
 'rebind first gauntlet opponent without reusing the first entrance\'s offscreen X');
assert.match(html,/beginArenaEntrance\(\[allyWon\?S\.enemy:S\.player\]\)/);
assert.match(html,/if\(S\.phase==='entrance'\)\{/);
assert.match(html,/S\.phase='fight';S\.entrance=null/);
assert.match(html,/return; \/\/ No clock, HP, cooldown, or attack\/AI progress during walk-on/);
assert.match(html,/if\(S\.phase==='entrance'&&S\.entrance\)/);
console.log('PASS: first dual fast walk, two victory keyposes, rush; alternate gauntlet entrances, untouched survivor, locked gameplay and camera.');
