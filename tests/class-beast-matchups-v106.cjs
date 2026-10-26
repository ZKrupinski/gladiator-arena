/* ArenaMatchup v106: durable RPS and beast relationship checks for all battle engines. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),MATCH=require('../public/arena-matchup.js');
const fighter=cls=>({cls}),animal=beastType=>({cls:'thraex',beastType});
for(const [winner,loser] of [['retiarius','murmillo'],['murmillo','thraex'],['thraex','retiarius']]){
 assert.equal(MATCH.multiplier(fighter(winner),fighter(loser)),1.16);
 assert.equal(MATCH.multiplier(fighter(loser),fighter(winner)),.88);
 assert.equal(MATCH.multiplier(fighter(winner),fighter(winner)),1);
}
const species=['wolf','leopard','tiger','lion','elephant'];
for(const speciesId of species){
 for(const [cls,attack,defense] of [['retiarius',1.22,.82],['murmillo',.80,1.30],['thraex',.92,1.10]]){
  assert.equal(MATCH.multiplier(fighter(cls),animal(speciesId)),attack);
  assert.equal(MATCH.multiplier(animal(speciesId),fighter(cls)),defense);
 }
 assert.equal(MATCH.multiplier(animal(speciesId),animal('tiger')),1);
}
assert.equal(MATCH.damage(100,fighter('retiarius'),fighter('murmillo')),116);
assert.equal(MATCH.damage(100,fighter('murmillo'),fighter('retiarius')),88);
assert.equal(MATCH.damage(100,animal('wolf'),fighter('murmillo')),130);
assert.equal(MATCH.damage(100,fighter('retiarius'),animal('wolf')),122);
assert.equal(MATCH.multiplier({cls:'unknown'},{cls:'unknown'}),1);
MATCH.registerClass('dimachaerus');
MATCH.setRivalry('dimachaerus','murmillo');
MATCH.setBeastMatchup('dimachaerus',{vsBeast:1.05,beastVs:.99});
assert.equal(MATCH.multiplier(fighter('dimachaerus'),fighter('murmillo')),1.16);
assert.equal(MATCH.multiplier(animal('wolf'),fighter('dimachaerus')),.99);
assert.equal(MATCH.multiplier(fighter('dimachaerus'),fighter('retiarius')),1);
assert.throws(()=>MATCH.setMatchup('thraex','murmillo',3));
assert.throws(()=>MATCH.registerClass('../bad'));
const read=f=>fs.readFileSync(path.join(root,'public',f),'utf8');
const html=read('index.html'),practice=read('ludus-practice.js'),coop=read('arena-coop-core.js'),squad=read('squad-arena.js');
assert(html.includes('arena-matchup.js?v=class-beast-rps-v106-20261026'));
assert(html.indexOf('arena-matchup.js?')<html.indexOf('arena-balance.js?'),
 'load matchup before any duel and team combat engines');
assert(html.includes('ArenaMatchup?.damage?.(dmg,f,victim)'),'duel normal/special/dash');
assert(html.includes("ArenaMatchup?.damage?.(ArenaBalance.combatDamage(reversal"),'duel parry');
assert(coop.includes('Matchup?.damage?.(amount,a,target)'),'5vs5 redirected attacks');
assert(practice.includes('ArenaMatchup?.damage?.(base*(1-target.armor)'),'practice 1-4');
assert(squad.includes('Math.round(dmg*affinity)'),'squad attacks');
assert(squad.includes('const nearbyAffinity=root.ArenaMatchup?.multiplier?.(unit,nearby)'),'squad splash selects real target');
console.log('CLASS_BEAST_RPS_PASS: configurable future classes, full directional matrix, five beasts and all engines');
