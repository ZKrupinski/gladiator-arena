const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const rules=require('../public/ludus-practice.js');
assert.equal(rules.waveSize(1),2);assert.equal(rules.waveSize(3),3);
assert(rules.waveSize(10000)<=12);assert(rules.enemyHP(15)>rules.enemyHP(1));
assert(rules.enemyAttack(15)>rules.enemyAttack(1));assert(rules.waveXP(10)>rules.waveXP(1));
assert(rules.killXP(10)>rules.killXP(1));
assert(rules.eligible({injury:0,fatigue:0}));
assert(!rules.eligible({injury:80,fatigue:0}));
assert(!rules.eligible({injury:0,fatigue:80}));
for(let wave=1;wave<=100;wave++){
 const e=rules.enemyFor(wave,wave,()=>.45);
 assert(['murmillo','thraex','retiarius'].includes(e.cls));
 assert(/^(murmillo_a|thraex_a|thraex_b|retiarius_a)_L[1-5]$/.test(e.look));
 assert(e.maxHp>0&&e.atk>0);
}
const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
const scene=fs.readFileSync(path.join(__dirname,'../public/ludus-scene.js'),'utf8');
const practice=fs.readFileSync(path.join(__dirname,'../public/ludus-practice.js'),'utf8');
assert(scene.includes('if(id==="practice")'));
assert(scene.includes('if(id==="roster"||id==="training"||id==="basic")'));
assert(html.includes('practiceReward:(awards,wave,kills,retired)=>'));
assert(html.includes('practiceEnemySprite:(visualId,kind='));
assert(html.includes('ludus-practice.js?v=torso-rear-falling-v31'));
assert(html.includes('ludus-practice.css?v=exercitium-infinitum-v26'));
assert(practice.includes('battle.heroes.every(u=>u.dead)'));
assert(practice.includes('calibration(unit,art)'),'one model-space scale across action frames');
assert(practice.includes('const k=metric.pixels*scale'),'current frame cannot redefine actor size');
assert(practice.includes('atlasFrame.pivotX')&&practice.includes('atlasFrame.footY'),'approved original frame anchor reuse');
assert(practice.includes('e.fromX=W+250*c.scale'),'runner starts beyond full canvas edge');
assert(practice.includes('e.entryTotal'),'run speed depends on travel distance');
assert(practice.includes('exit.seq?!exit.seq.finished:exit.age<3.6'),'corpse never time-fades while on screen');
assert(practice.includes('exit.viewport'),'Carnifex viewport converted to local world');
assert(html.includes('practiceFrame:(unit,kind='),'growth frame metadata wired');
assert(practice.includes('const base=202/b.h'),'stable idle silhouette reference');
assert(practice.includes('measureTorso(idle,b,reference?.pivotX)'),'facegear-independent torso calibration');
assert(practice.includes('torsoCompensation(torsoWidth?torsoWidth*base:0)'),'torso-size correction');
assert(practice.includes('enemies.concat(enemyExits)'),'opponents drawn in rear pass');
assert(practice.includes('ownExits.concat(allies)'),'allies drawn in foreground pass');
assert(practice.includes('FALL_DURATION=.72'),'dedicated death fall');
assert(practice.includes('drawProne(unit,court.scale/scale'),'corpse lying during hauling');
assert(practice.includes('if(battle.exits.length){battle.knockout=0;return;}'),'wait for corpses before results');
assert(!practice.includes("ctx.ellipse(0,0,46*scale"),'vector fighter shadow removed');
assert(!practice.includes('COURTS.forEach(c=>{'),'vector floor pads removed');
assert(practice.includes('drawDeparture(exit)'),'real Carnifex must retrieve loser');
assert(practice.includes('root.ArenaCarnifex'),'actual executioner module reused');
assert(practice.includes('root.ArenaRasterFX'),'original PNG fight effects reused');
assert(practice.includes('if(u.side===\'enemy\'&&u.entry>0)'),'enemy entrance');
assert(!practice.includes("deal(target,u,1.16,'parry')"),'no arena parry counter in practice');
assert(!practice.includes("unit.special?'special':'attack'"),'no dash/special finisher');

assert(practice.includes('battle.heroes.filter(h=>!h.dead)'));
assert(practice.includes('battle.left--'));
assert(practice.includes('battle.finished=true'));
assert(practice.includes('function findOpenCourt(heroes,enemies,cursor=0)'),'matchmaker assigns fixed courts');
assert(practice.includes('!enemies.some(e=>!e.dead&&e.seat===seat)'),'no stacked live foes at station');
assert(practice.includes('function spawnMatched()'),'sequential assigned spawns');
assert(practice.includes('battle.queued.push(e)'),'reassign surviving opponent after teammate dies');
assert(practice.indexOf('battle.heroes.forEach(u=>act(u,dt))')<practice.indexOf('battle.queued.push(e)'),'orphan relocation must happen immediately after contact');
assert(practice.includes('u.homeX-u.x'),'return fighters to station');
assert(practice.includes('root.ArenaBalance?.combatDamage?.(raw,style)'),'original combat damage reused');
assert(practice.includes("api()?.squadSprite?.(owner,kind"),'original fighter attack/guard sprites reused');
assert(practice.includes('target.parry>0')&&practice.includes('target.dodge>0'),'parry and dodge exchanges');
assert(!practice.includes('function closest(unit,opponents)'),'no global chasing');
assert(practice.includes('ctx.save(); // Only the enemy SPRITE flips'),'health labels stay readable');
const reward=html.slice(html.indexOf('practiceReward:(awards'),html.indexOf('practiceEnemySprite:(visualId'));
assert(!/CAREER\.(gold|glory|lastLoot|lastPrize|wins|fights|armoryInventory)\s*(?:=|\+\+|--)/.test(reward));

const layouts=[1,2,3,4].map(count=>rules.courtsForParty(count));
assert(layouts.every((c,i)=>c.length===i+1),'one duel space per fighter');
assert.equal(layouts[0][0].x,640,'solo gladiator and foe centered');
assert(layouts[0][0].y>=665&&layouts[0][0].scale>1.15,'solo pair grounded and close');
for(const size of [2,3,4]){
 const list=layouts[size-1];
 assert(list[0].y>=680&&list[1].y>=680,'front courts are filled before rear courts');
 assert(list[0].scale>=1.24&&list[1].scale>=1.24,'near fighters enlarged toward camera');
 assert(list[0].x<640&&list[1].x>640,'near pairs share opposite halves');
}
for(const size of [3,4]){
 const list=layouts[size-1];
 for(const far of list.slice(2)){
  assert(far.y>=590&&far.y<=625,'rear feet move off horizon onto sand');
  assert(far.scale>=.98&&far.scale<=1.10,'rear units match previous lower-row scale');
  assert(list[0].scale>=far.scale+.18,'foreground larger than background');
 }
}
assert.equal(layouts[2][2].x,640,'three-person rear fighter centered');
for(const group of layouts)
 for(const court of group){
  assert(court.x-87>60&&court.x+87<1220,'the fight pair remains on screen');
  assert(court.y>=590&&court.y<702,'feet are visibly grounded and inside canvas');
  assert(court.y-202*court.scale>275,'silhouettes fit frame');
 }
assert(practice.includes('COURTS=courtsForParty(picks.length)'),'runtime must adapt layout to team count');
assert(practice.includes('const c=COURTS[k]'),'hero uses corresponding foot anchor');
assert(practice.includes('const c=COURTS[h.seat]'),'matched enemy uses same foot anchor');
console.log('PASS: grounded 1–4 party perspective with near-first and solo-centered arrangement');
