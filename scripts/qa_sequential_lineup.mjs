/* Sequential Arena v1 smoke/regression suite.
 * Run: node scripts/qa_sequential_lineup.mjs
 * The original canvas/hotkey engine stays authoritative; no depth-team renderer.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const base=new URL('../public/',import.meta.url);
const source=file=>fs.readFileSync(new URL(file,base),'utf8');
const root={};
for(const file of ['arena-balance.js','arena-lineup.js']){
 vm.runInNewContext(source(file),{globalThis:root},{filename:file});
}
vm.runInNewContext(source('arena-carnifex.js'),{globalThis:root,Image:class {constructor(){this.complete=true;this.naturalWidth=500;this.naturalHeight=700;}set src(v){this._src=v;}}},{filename:'arena-carnifex.js'});
const {ArenaBalance:B,ArenaLineup:L,ArenaCarnifex:X}=root;
const classes=['murmillo','thraex','retiarius'];
const hero=i=>({name:'영입 검투사 '+i,cls:classes[i%3],level:5,stats:{str:3,agi:3,end:3,focus:3},
  injury:0,fatigue:0,inventory:['wood'],equipment:{}});
const champion={name:'신규 챔피언 무르밀로',cls:'murmillo',level:8,round:5,
 boss:true,bossId:'murmillo_champion_red',appearance:'murmillo_champion_red',
 stage:2,growthType:'murmillo_a'};
const assertFormats=()=>{
 const roster=Array.from({length:5},(_,i)=>hero(i));
 for(const [mode,spec] of Object.entries(B.MODES)){
  const q=L.create(mode,Array.from({length:spec.allies},(_,i)=>i),roster,champion);
  assert.equal(q.allies.length,spec.allies);
  assert.equal(q.enemies.length,spec.enemies);
  assert.equal(q.enemies[q.enemies.length-1].appearance,'murmillo_champion_red');
  assert.ok(q.enemies.slice(0,-1).every(e=>!e.boss));
  const seen=[];
  while(!q.finished){
   seen.push(q.enemies[q.enemyIndex].name);
   L.resolve(q,true);
  }
  assert.equal(seen.length,spec.enemies,mode+' sequential match order');
  assert.equal(q.won,true);
 }
 const q=L.create('2v2',[2,3],roster,champion);
 assert.equal(L.resolve(q,false).nextAllyIndex,3);
 assert.equal(q.enemyIndex,0,'winning opponent must remain in arena');
 L.resolve(q,true);
 assert.equal(q.enemyIndex,1);
 const final=L.resolve(q,false);
 assert.equal(final.finished,true);assert.equal(final.win,false);
 assert.equal(L.condition({...hero(0),fatigue:88}).reason,'탈진');
 assert.equal(L.condition({...hero(0),injury:90}).reason,'중상');
 assert.equal(L.condition({...hero(0),injury:0,fatigue:0}).eligible,true);
 assert.ok(L.fatigueGain(150,0,3)>L.fatigueGain(150,150,1));
};
assertFormats();
const html=source('index.html');
const first=html.indexOf('/* Ordered arena events:');
const last=html.indexOf('function markManualInput(){',first);
const knockout=html.indexOf('function finishFight(winner,loser){');
const knockoutEnd=html.indexOf('function breakAttackChain(f){',knockout);
assert.ok(first>0&&last>first&&knockout>0&&knockoutEnd>knockout);
const mechanicSource=html.slice(first,last)+'\n'+html.slice(knockout,knockoutEnd);
const facadeSource='(function(S,CAREER,ArenaLineup,ArenaBalance,document,LudusRoster,'+
 'fighter,CHAMPION_MURMILLO_VARIANT,ANIMATED_MURMILLO_VARIANT,isChampionMurmillo,'+
 'isAnimatedMurmillo,growthType,careerStage,careerLevel,equipmentBonus,'+
 'setAction,start,saveCareer,grantCareerXp,updateHud,say,clock,clamp,'+
 'emitAttackFx,fxSound,careerEligible,window){let CAREER_SELECTING=true;'+mechanicSource+
 ';return {startLineupMatch,finishFight,resolveLineupBout,finishLineupCleanup,finishLineupCareerMatch};})';
const build=()=>{
 const roster=Array.from({length:5},(_,i)=>({...hero(i),injury:8,fatigue:5}));
 const career={roster,active:0,fights:0,wins:4,gold:300,glory:0,pendingOpponent:champion};
 const S={phase:'title',round:5,time:90,keys:new Set(),sparks:[],parryBursts:[],shake:0,combo:0};
 const hud={hidden:false,textContent:''},saves=[];
 const fighter=(cls,x,enemy)=>({cls,x,enemy,
  cfg:{hp:138,atk:17,move:244,sp:42,name:cls},
  hp:138,maxHp:138,st:100,guard:false,face:enemy?-1:1,dead:false});
 const ludus={encounter:()=>champion,recruitBoss:(state,o)=>{
  if(!o.boss)return null;
  const recruit={...hero(6),name:'챔피언 영입'};
  state.roster.push(recruit);return recruit;
 }};
 const fn=vm.runInNewContext(facadeSource);
 const api=fn(S,career,L,B,{getElementById:()=>hud},ludus,fighter,
  'murmillo_champion_red','murmillo_motion_v3',
  h=>h.appearance==='murmillo_champion_red',h=>h.appearance==='murmillo_motion_v3',
  h=>h.growthType||h.cls+'_a',()=>2,h=>h.level,()=>({atk:0,hp:0}),
  (f,act,duration)=>{f.action=act;f.actionT=duration},
  (mode,index)=>{
   S.phase='fight';S.careerMatch=true;S.round=5;
   S.player=fighter(career.roster[index].cls,335,false);
   S.player.hp=210;S.player.maxHp=210;
   S.enemy=fighter('murmillo',940,true);S.enemy.hp=280;S.enemy.maxHp=280;
  },
  ()=>saves.push(career.message),
  (h,xp)=>{h.xp=(h.xp||0)+xp;return 0},
  ()=>{},t=>{S.notice=t},12,Math.max,()=>{},()=>{},
  h=>L.condition(h).eligible,{ArenaCarnifex:X});
 return {api,career,S,hud,saves};
};
{
 const {api,S,career,saves}=build();
 assert.equal(api.startLineupMatch('1v3',[0]),true);
 assert.equal(S.gauntlet.enemies.length,3);
 for(const [step,hp] of [[1,150],[2,110],[3,60]]){
  S.player.hp=hp;S.enemy.hp=0;
  api.finishFight(S.player,S.enemy);
  assert.equal(S.phase,'cleanup','KO must play Carnifex retrieval BEFORE replacing rival');
  assert.ok(S.cleanup?.body?.dead,'actual original defeated sprite is retained');
  assert.equal(S.player.hp,hp);
  X.advance(S.cleanup,X.TIME.total);
  api.finishLineupCleanup();
  if(step<3){assert.equal(S.gauntlet.enemyIndex,step);assert.equal(S.player.hp,hp);
   assert.equal(S.phase,'fight');}
 }
 assert.equal(S.phase,'finisher');assert.equal(S.gauntlet.won,true);
 api.finishLineupCareerMatch();api.finishLineupCareerMatch();
 assert.equal(career.fights,1);
 assert.equal(career.roster.length,6,'boss recruitment only on victory');
 assert.equal(career.roster[0].fatigue>5,true);
 assert.equal(career.roster[0].injury>8,true);
 assert.equal(saves.length,2,'start plus exactly one reward save');
}
{
 const {api,S,career}=build();
 assert.equal(api.startLineupMatch('2v2',[0,1]),true);
 const remainingHP=S.enemy.hp-40;S.enemy.hp=remainingHP;
 S.player.hp=0;api.finishFight(S.enemy,S.player);
 assert.equal(S.phase,'cleanup');
 assert.equal(S.gauntlet.allyIndex,1);
 assert.equal(S.gauntlet.enemyIndex,0);
 assert.equal(S.enemy.hp,remainingHP,'winning enemy must keep their HP');
 assert.notEqual(S.player.cls,career.roster[1].cls,'new fighter must wait for body retrieval');
 X.advance(S.cleanup,X.TIME.total);api.finishLineupCleanup();
 assert.equal(S.player.cls,career.roster[1].cls,'replacement fighter should be controlled');
 S.enemy.hp=0;api.finishFight(S.player,S.enemy);
 assert.equal(S.phase,'cleanup');X.advance(S.cleanup,X.TIME.total);api.finishLineupCleanup();
 assert.equal(S.gauntlet.enemyIndex,1);
 S.player.hp=0;api.finishFight(S.enemy,S.player);
 assert.equal(S.phase,'cleanup');X.advance(S.cleanup,X.TIME.total);api.finishLineupCleanup();
 assert.equal(S.phase,'finisher');assert.equal(S.gauntlet.won,false);
 api.finishLineupCareerMatch();
 assert.equal(career.fights,1);
 assert.equal(career.roster.length,5,'defeat cannot recruit a champion');
 assert.ok(career.roster[0].fatigue>5&&career.roster[1].fatigue>5);
}
assert.match(html,/id="lineupHud"/);
assert.match(html,/arena-carnifex\.js\?v=2/);
assert.match(html,/arena-lineup-visual\.css\?v=2/);
assert.match(html,/arena-lineup-visual\.js\?v=2/);
assert.match(source('arena-lineup-visual.css'),/background:none;border:0;box-shadow:none/);
assert.match(source('arena-lineup-visual.js'),/CARNIFEX/);
assert.match(source('assets\/npc\/carnifex-executioner.svg'),/Carnifex/);
assert.doesNotMatch(html,/<script src="squad-arena\.js\?/,'old depth squad runtime must be disabled');
const draft=source('ludus-cards.js');
assert.match(draft,/lc-enemy-lineup/);
assert.match(draft,/lc-queue-order/);
assert.match(draft,/lc-unavailable/);
assert.match(draft,/개발 확인용 임시 메뉴/);
console.log('PASS: all lineup modes, staged Carnifex corpse retrieval, fighter replacement, roster UI and boss payout.');
