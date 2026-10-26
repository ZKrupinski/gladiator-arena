'use strict';
/* v110 common canvas combat signals: faction colours, matchup target, XP.
 * No sprite asset modifications and no speculative saved XP mutation.
 */
const assert=require('node:assert/strict'),fs=require('node:fs');
const matchup=require('../public/arena-matchup.js');
const signals=require('../public/arena-combat-signals.js');
const read=name=>fs.readFileSync('public/'+name,'utf8');
const hero=(cls,side='ally')=>({cls,side,hp:100,dead:false});
for(const [strong,weak] of [
 ['retiarius','murmillo'],['murmillo','thraex'],['thraex','retiarius']
]){
 assert.equal(signals.advantage(hero(strong,'ally'),hero(weak,'enemy')),true);
 assert.equal(signals.advantage(hero(weak,'enemy'),hero(strong,'ally')),false);
 assert.equal(signals.advantage(hero(strong,'enemy'),hero(weak,'ally')),true);
}
for(const species of ['wolf','lion','tiger','leopard','elephant']){
 const beast={cls:'thraex',side:'enemy',hp:100,beastType:species};
 assert(signals.advantage(hero('retiarius'),beast));
 assert(signals.advantage(beast,hero('murmillo')));
 assert(signals.advantage(beast,hero('thraex')));
}
assert.equal(signals.advantage(hero('thraex'),hero('thraex')),false);
assert.equal(signals.advantage({...hero('retiarius'),hp:0},hero('murmillo')),false);
assert.equal(signals.tint(hero('retiarius','ally')).main,'#74ffe4');
assert.equal(signals.tint(hero('retiarius','enemy')).main,'#ff575b');
assert.equal(signals.tint({enemy:true}).main,'#ff575b');
assert.equal(signals.xpNeeded(1),55);
assert.deepEqual(signals.previewLevel(1,0,54),{level:1,xp:54});
assert.deepEqual(signals.previewLevel(1,0,55),{level:2,xp:0});
assert.deepEqual(signals.previewLevel(1,54,74),{level:2,xp:73});
assert.equal(signals.previewLevel(49,0,100000).level,50);
const unit=hero('retiarius');
assert.equal(signals.levelUp(unit,3,4,17.1),true);
assert.deepEqual(unit._levelFx,{from:3,to:4,at:17.1,duration:2.25});
assert.equal(signals.levelUp(unit,4,4,17.1),false);
function context(){
 const o={calls:0,save(){this.calls++},restore(){},translate(){},scale(){},beginPath(){},
 moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},arc(){},fillText(){},
 strokeText(){},createRadialGradient(){return {addColorStop(){}}}};
 return o;
}
const ctx=context();
assert(signals.drawAdvantage(ctx,hero('retiarius'),hero('murmillo'),{x:50,y:80,time:1}));
assert.equal(signals.drawAdvantage(ctx,hero('murmillo'),hero('retiarius'),{x:50,y:80,time:1}),false);
assert(signals.drawLevelUp(ctx,unit,{x:10,y:20,time:17.6}));
assert.equal(signals.drawLevelUp(ctx,unit,{x:10,y:20,time:20}),false);
assert.equal(unit._levelFx,null);
const index=read('index.html'),practice=read('ludus-practice.js'),
 coop=read('arena-coop.js'),squad=read('squad-arena.js');
assert(index.includes('arena-combat-signals.js?v=affinity-levelup-v110-20261027'));
assert(index.indexOf('arena-combat-signals.js?')<index.indexOf('ludus-practice.js?'));
assert(index.includes('arena-coop.js?v=affinity-levelup-v110-20261027'));
assert(index.includes('ludus-practice.js?v=affinity-levelup-v110-20261027'));
assert(index.includes('signals?.drawAdvantage?.(ctx,f,opponent'));
assert(index.includes('window.ArenaCombatSignals?.levelUp?.(S.player,oldLevel,h.level,clock)'));
assert(practice.includes('refreshPracticeLevel(attacker)'));
assert(practice.includes('refreshPracticeLevel(h)'));
assert(practice.includes('initialXp:number(h.xp,0)'));
assert(practice.includes('root.ArenaCombatSignals?.drawAdvantage?.(ctx,unit,foe'));
assert(coop.includes('signals?.drawAdvantage?.(ctx,u,opponent'));
assert(coop.includes('✦ LEVEL UP!'));
assert(squad.includes('root.ArenaCombatSignals?.drawAdvantage?.(ctx,u,opponent'));
new Function(practice);new Function(coop);new Function(squad);
const start=index.lastIndexOf('<script>',index.indexOf('function enterCareer()'));
new Function(index.slice(start+8,index.indexOf('</script>',start)));
console.log('COMBAT_SIGNALS_V110_PASS: ally aqua/enemy red, all RPS/beasts, live XP levels, all scene hooks');
