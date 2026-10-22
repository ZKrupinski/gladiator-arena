import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
const between=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));
const fighter=()=>({hp:50,maxHp:100,attackCD:.1,stagger:0,st:100,cd:0,dead:false,comboDash:null});
const calls=[];
const s={phase:'fight',paused:false,player:fighter(),enemy:fighter(),keys:new Set(),time:0,shake:0,flash:0,noticeT:0,sparks:[],parryBursts:[]};
const context=vm.createContext({S:s,clock:10,document:{hidden:false},window:{},
 attack:(p,e,special)=>calls.push({p,e,special}),dodge:()=>calls.push('dodge'),
 setAction:()=>{},say:()=>{},updateHud:()=>{},resolveLineupBout:win=>calls.push(win)});
vm.runInContext(between('function inputAct(action)','function choosePose(f)'),context);
vm.runInContext(between('function update(dt,realDt=dt)','function showEnd()'),context);
const run=code=>vm.runInContext(code,context);
run("inputAct('attack')");assert.ok(s.pendingInput);assert.equal(calls.length,0);
s.player.attackCD=0;run('clock+=.1;flushCombatInput();flushCombatInput()');
assert.equal(calls.length,1,'one tap produces exactly one attack');
s.player.attackCD=.4;run("inputAct('attack')");assert.equal(s.pendingInput,null,'early tap is not stored for a distant future attack');
s.player.attackCD=.1;run("inputAct('attack');clock+=.2;flushCombatInput()");assert.equal(s.pendingInput,null,'expired tap cannot attack');
run("inputAct('attack')");s.player=fighter();run('flushCombatInput()');assert.equal(s.pendingInput,null,'replacement fighter cannot inherit input');
run("inputAct('attack')");s.keys.add('guard');run('flushCombatInput()');assert.equal(s.pendingInput,null,'guard cancels queued attack');s.keys.clear();
s.player.cd=3;run("inputAct('special')");assert.equal(s.pendingInput,null,'special cooldown cannot be bypassed');
s.paused=true;const clock=run('clock');run('update(5)');assert.equal(run('clock'),clock,'pause freezes combo/AI clock');
s.paused=false;context.document.hidden=true;run('update(5)');assert.equal(run('clock'),clock,'hidden tab cannot advance simulation');context.document.hidden=false;
// Actual timeout branch: 60/200 loses to 40/100, despite more absolute HP.
s.player.hp=60;s.player.maxHp=200;s.enemy.hp=40;s.enemy.maxHp=100;
run('update(.01)');assert.equal(s.resultWin,false);assert.equal(s.phase,'finisher');
s.phase='fight';s.time=0;s.player.hp=80;s.player.maxHp=100;s.enemy.hp=100;s.enemy.maxHp=200;
run('update(.01)');assert.equal(s.resultWin,true,'80% beats 50% despite lower absolute HP');
s.phase='fight';s.time=0;s.player.hp=50;s.enemy.hp=100;run('update(.01)');assert.equal(s.resultWin,false,'tie retains challenger loss rule');
console.log('PASS combat QA: syntax, one-shot buffer, expiry, cooldown, fighter change, guard cancel, pause/hidden clock, normalized timeout and ties');
