// node tests/arena-progression-lv50.js — original market Lv.0 traits into Lv.50 combat.
'use strict';
const assert=require('node:assert/strict');
const Progress=require('../public/arena-progression');
const Balance=require('../public/arena-balance');
const Roster=require('../public/ludus-roster');
assert.equal(Progress.LEVEL_CAP,50);
assert.equal(Balance.LEVEL_CAP,50);
const born={str:6,agi:4,end:4,focus:4};
const aptitudes={str:1.48,agi:.75,end:1.00,focus:1.04};
const base={atk:18,hp:140,move:200,sp:45};
const fighter=(overrides={})=>({cls:'murmillo',level:1,stats:{str:0,agi:0,end:0,focus:0},
 birthStats:born,aptitudes,injury:0,equipment:{weapon:'wood'},...overrides});
const before=JSON.stringify(fighter());
const start=fighter();
const level20=fighter({level:20}),level21=fighter({level:21}),level50=fighter({level:50});
assert.equal(Progress.growth(start,'str'),0,'growth only accumulates after first usable level');
const bonus20=Progress.growth(level20,'str'),bonus50=Progress.growth(level50,'str');
assert(bonus50>bonus20*2.4,'late innate specialization has nonlinear influence');
assert(Balance.heroStats(level21,base).atk>Balance.heroStats(level20,base).atk,
 'progression continues past the former Lv.20 ceiling');
assert(Balance.heroStats(level50,base).atk>Balance.heroStats(start,base).atk+30,
 'high-level STR specialty becomes meaningful');
assert.equal(JSON.stringify(start),before,'stat calculation does not modify saved progress');
const archetypes={
 str:fighter({level:50,birthStats:{str:8,agi:3,end:3,focus:3},aptitudes:{str:1.5,agi:.65,end:.95,focus:.95}}),
 agi:fighter({level:50,birthStats:{str:3,agi:8,end:3,focus:3},aptitudes:{str:.65,agi:1.5,end:.95,focus:.95}}),
 end:fighter({level:50,birthStats:{str:3,agi:3,end:8,focus:3},aptitudes:{str:.65,agi:.95,end:1.5,focus:.95}}),
 focus:fighter({level:50,birthStats:{str:3,agi:3,end:3,focus:8},aptitudes:{str:.65,agi:.95,end:.95,focus:1.5}})
};
const stats=Object.fromEntries(Object.entries(archetypes).map(([key,h])=>[key,Balance.heroStats(h,base)]));
assert(stats.str.atk>stats.agi.atk+35,'STR specialist deals substantially more damage');
assert(stats.agi.move>stats.str.move*1.2,'AGI specialist moves noticeably faster');
assert(stats.end.hp>stats.str.hp+170,'END specialist has markedly higher HP');
assert(stats.focus.parry>stats.str.parry+.10,'FOCUS specialist performs noticeably more parries');
assert(stats.focus.specialCooldown<stats.str.specialCooldown,
 'FOCUS specialist reaches skill cooldown sooner');
assert.equal(Progress.describe(archetypes.str).best,'str');
assert.equal(Progress.describe(archetypes.end).best,'end');
const training=fighter({level:50,stats:{str:9,agi:3,end:2,focus:5}});
const kept=JSON.stringify(training);
const trained=Balance.heroStats(training,base);
assert(trained.atk>Balance.heroStats(level50,base).atk,'training adds on top of innate bonus');
assert.equal(JSON.stringify(training),kept,'growth never permanently changes earned training points');
const legacy={cls:'murmillo',level:50,stats:{str:15,agi:4,end:7,focus:9},
 aptitudes:{str:1.38,agi:.71,end:.92,focus:1.05}};
const oldStats=JSON.stringify(legacy);
assert(Number.isFinite(Balance.heroPower(legacy))&&Balance.heroStats(legacy,base).atk>0,
 'old saves lacking explicit Lv.0 values remain valid');
assert.equal(JSON.stringify(legacy),oldStats,'old saves are not mutated during derived growth');
assert(Balance.makeMatch(101,[archetypes.str,archetypes.agi],false).level>=22,
 'Lv.50 average opponents can exceed the former Lv.20 limit');
assert(Roster.encounter({wins:90,roster:[]},archetypes.str,()=>.7,[archetypes.str]).level>20,
 'regular career matchmaking is no longer stuck at Lv.20');
// Exercise real inlined Ludus XP functions; don't just assume cap text exists.
const fs=require('node:fs'),path=require('node:path'),index=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
const beginning=index.indexOf('function careerXpNeeded(');
const ending=index.indexOf('function careerProgressLabel(',beginning);
assert(beginning>=0&&ending>beginning,'career XP implementation found');
const xpLogic=index.slice(beginning,ending);
const current=new Function('window',xpLogic+';return {grantCareerXp,careerXpNeeded,careerLevel};')({ArenaProgression:Progress});
const at20={level:20,xp:0};
const need20=current.careerXpNeeded(20);
assert.equal(current.grantCareerXp(at20,need20),1,'Lv.20 fighter can level again');
assert.equal(at20.level,21,'Lv.20 -> Lv.21');
const maxed={level:49,xp:0};
assert.equal(current.grantCareerXp(maxed,current.careerXpNeeded(49)+50000),1,'cap at Lv.50');
assert.equal(maxed.level,50);
assert.equal(maxed.xp,0,'do not retain overflow XP at Lv.50');
assert.equal(current.grantCareerXp(maxed,10000),0,'no Lv.51 overflow');
const look=fs.readFileSync(path.join(__dirname,'../public/ludus-cards.js'),'utf8');
assert(look.includes('LEVEL '+"'"+'+level(h)+\' / 50'), 'Ludus roster shows new maximum level');
console.log('PASS: inherited birth-stat specialization diverges across STR/AGI/END/FOCUS through Lv.50, trained points preserved, old saves and >20 rival matches valid.');
