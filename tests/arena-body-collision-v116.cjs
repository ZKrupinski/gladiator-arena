/* Runtime-sized collider contracts for duel/venatio/practice/5v5.
 * Neutral torso shape (not attack weapon) must respond to published costume scale.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const B=require('../public/arena-body-collision.js');
const eq=(a,b,msg)=>assert(Math.abs(a-b)<1e-8,msg+': '+a+' vs '+b);
const profiles={
 murmillo_a_L1:1,retiarius_a_L1:1,thraex_a_L1:1,
 murmillo_champion_red:1.55,beast_elephant:1.35
};
global.PracticeScaleProfiles={scale:key=>profiles[key]??1};
global.PracticeVisualProfiles={resolve:(key,pose)=>({scale:key==='thraex_a_L1'&&pose==='idle'?1.1:1})};
const C=require('../public/arena-coop-core.js');
const P=require('../public/ludus-practice.js');
const sample=(cls='murmillo',visualId=cls+'_a_L1')=>({index:0,cls,visualId,look:visualId,
 combat:{hp:150,atk:18,move:240}});
function team(){return ['murmillo','retiarius','thraex','murmillo','thraex']
 .map((cls,i)=>({...sample(cls),index:i}));}
const rect=(mode,scale,y)=>B.footprint(mode,{scale,y});
eq(B.depth('practice',570),.70,'practice rear 4 court');
eq(B.depth('practice',608),.70+.30*38/119,'practice rear 3 court');
eq(B.depth('practice',649),.70+.30*79/119,'practice front 2 court');
eq(B.depth('practice',689),1,'practice front 1 court');
assert.equal(B.DEPTH.practice.nearY-B.DEPTH.practice.farY,119);
assert.equal(B.DEPTH.coop.nearY-B.DEPTH.coop.farY,280);
eq(B.depth('coop',395),.70,'5v5 far = 70%');
eq(B.depth('coop',675),1,'5v5 near = 100%');
eq(B.depth('coop',535),.85,'5v5 half-depth');
assert(B.depth('coop',395)<B.depth('practice',606),'larger stage uses stronger perspective');
for(const mode of ['duel','practice','coop']){
 const small=rect(mode,.65,mode==='duel'?0:675),
       normal=rect(mode,1,mode==='duel'?0:675),
       big=rect(mode,1.6,mode==='duel'?0:675);
 assert(small.rx<normal.rx&&normal.rx<big.rx,mode+': X collider must follow sprite');
 assert(small.ry<normal.ry&&normal.ry<big.ry,mode+': Y collider must follow sprite');
 eq(big.rx/normal.rx,1.6,mode+': zoom matches scale exactly');
}
const a=rect('coop',1,675),b=rect('coop',1,675),giant=rect('coop',1.6,675);
assert(B.ellipse({x:0,y:540},{x:107,y:540},a,b),'normal units overlap at 107px');
assert(!B.ellipse({x:0,y:540},{x:116,y:540},a,b),'normal units have clearance at 116px');
assert(B.ellipse({x:0,y:540},{x:116,y:540},giant,b),'larger costume must block an old-safe position');
assert(!B.ellipse({x:0,y:540},{x:200,y:540},giant,b),'larger costume still has finite bounds');
assert(!B.ellipse({x:0,y:540},{x:0,y:660},a,b),'separate depth layers may stack vertically');

const roster=team(),sim=C.create(roster,roster,{seed:29});
assert.equal(sim.units.length,10);
const far=sim.units[0],near=sim.units[4];
eq(far.collisionScale,1,'normal look uses neutral size');
assert(C.bodyShape(far).rx<C.bodyShape(near).rx,'5v5 collider follows body perspective');
assert(!C.bodyBlocked({x:100,y:500,collisionScale:1},
 {x:260,y:500,collisionScale:1}),'distance beyond two body radii is free');
const pressed={x:500,y:500,collisionScale:1};
assert(C.bodyBlocked(pressed,{x:585,y:500,collisionScale:1}),
 'same-size bodies physically overlap at 85px');
assert(!C.bodyBlocked(pressed,{x:640,y:500,collisionScale:1}),
 'normal actors can stand beyond their footprint');

// New match observes the SAME published scale source used by the live renderer.
profiles.murmillo_a_L1=1.75;
const giantTeam=team(),large=C.create(giantTeam,giantTeam,{seed:29});
eq(large.units[0].collisionScale,1.75,'5v5 body reads artist size, not fixed 102px');
assert(C.bodyShape(large.units[0]).rx>C.bodyShape(far).rx*1.70);
assert(large.units.every(u=>u.y>=395&&u.y<=675&&u.x>=85&&u.x<=1195),
 'larger actor setup remains on the arena floor');
profiles.murmillo_a_L1=1;

// Isolated practice has its own four-stage 119px depth, not the 5v5 floor.
const savedLook=global.PracticeScaleProfiles.look;
global.PracticeScaleProfiles.look=u=>u.look;
const actor={look:'murmillo_a_L1',x:200,y:689,seat:0,side:'enemy'};
const opponent={look:'retiarius_a_L1',x:380,y:689,seat:0,side:'enemy'};
const front=P.pairBodyGap(actor,opponent);
eq(front,B.BASE.practice.rx*2+3,'practice normal 202px scene gap');
actor.y=570;opponent.y=570;
const regularRear=P.pairBodyGap(actor,opponent);
assert(regularRear<front,'rear court collision follows 70% sprite');
profiles.murmillo_a_L1=1.5;
assert(P.pairBodyGap(actor,opponent)>regularRear*1.15,
 'larger artist-sized rear actor has a proportionally wider collision footprint');
profiles.murmillo_a_L1=.65;
assert(P.pairBodyGap(actor,opponent)<front*.8,'small rear sprite can stand closer');
global.PracticeScaleProfiles.look=savedLook;

// Source-level fail-fast for physics coupling in duel, Venatio and art editor.
const duel=fs.readFileSync('public/index.html','utf8');
assert.match(duel,/const minGap=duelBodyGap\(p,e\)/);
assert.match(duel,/function duelBodyShape\(f\)/);
assert.match(duel,/f\?\.beastType\?'beast_'/,'Venatio uses elephant/wolf scale');
assert.match(duel,/duelCollisionException\(p\)/,'cinematic attacks exempt');
assert.match(duel,/const preferred=Math\.max\(duelBodyGap\(e,p\)/);
assert.match(duel,/const ideal=Math\.max\(duelBodyGap\(p,e\)/);
assert.match(duel,/reach=Math\.max\(f\.cfg\.reach/,'bigger units must not lose weapon range');
assert.match(duel,/arena-body-collision\.js\?v=practice-fourdepth-v120/);
const coopSource=fs.readFileSync('public/arena-coop.js','utf8');
assert.match(coopSource,/COOP_FAR_SCALE=\.70/);
assert.match(coopSource,/perspectiveScale=y=>root\.SpartacusBodyCollision/);
assert.match(coopSource,/ctx\.scale\(depth,depth\)/);
const practiceSource=fs.readFileSync('public/ludus-practice.js','utf8');
assert.match(practiceSource,/const gap=pairBodyGap\(h,e\)/);
assert.match(practiceSource,/const gap=left&&right\?pairBodyGap\(left,right\)\+24/);
console.log('PASS: 5v5 world floor perspective 70–100%, and duel/beast/practice/5v5 neutral hitboxes track the artist-adjusted screen body scale');
