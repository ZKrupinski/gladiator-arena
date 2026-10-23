'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const B=require('../public/arena-balance.js');
const fighter=(points)=>({cls:'murmillo',level:20,stats:{str:points,agi:points,end:points,focus:points},equipment:{weapon:'wood',shield:null,armor:null},injury:0,fatigue:0});
const base={hp:138,atk:17,move:250,sp:36};

assert.equal(B.TRAINING_SOFTCAP,10);
assert.equal(B.trainedStat(0),0);
assert.equal(B.trainedStat(10),10);
assert.ok(B.trainedStat(11)>10,'11th point contributes to combat');
assert.ok(B.trainedStat(20)>B.trainedStat(11));
assert.ok(B.trainedStat(50)>B.trainedStat(20));
assert.ok(B.trainedStat(20)<20,'advanced training has diminishing returns');
assert.ok(B.trainedStat(50)-B.trainedStat(40)<B.trainedStat(20)-B.trainedStat(10));
for(const v of [0,3,9,10,11,20,50]){
 const price=B.trainingCost(fighter(v),'str');
 assert.ok(Number.isFinite(price)&&price>0,'training price must remain finite');
 if(v)assert.ok(price>B.trainingCost(fighter(v-1),'str'),'training cost rises with stat');
}
for(const key of ['atk','hp','move','sp']){
 const v10=B.heroStats(fighter(10),base)[key];
 const v20=B.heroStats(fighter(20),base)[key];
 const v50=B.heroStats(fighter(50),base)[key];
 assert.ok(v20>v10,key+' must improve beyond +10');
 assert.ok(v50>v20,key+' must still improve beyond +20');
}
assert.ok(B.heroPower(fighter(20))>B.heroPower(fighter(10)));
assert.ok(B.matchStrength(fighter(20)).training>B.matchStrength(fighter(10)).training);
assert.ok(B.matchStrength(fighter(20)).hp>B.matchStrength(fighter(10)).hp);
assert.ok(B.makeMatch(30,[fighter(20)]).hp>B.makeMatch(30,[fighter(10)]).hp);
assert.equal(B.trainedStat(10),10,'no retroactive nerf below +10');
const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
const approved=fs.readFileSync(path.join(__dirname,'../public/ludus-approved-scenes.js'),'utf8');
assert.doesNotMatch(html,/h\.stats\[(?:stat|id|k)\]\s*>=\s*10/,'UI/logic cannot stop training at +10');
assert.doesNotMatch(html,/Math\.min\(10,\s*before\s*\+/,'training gains cannot be clamped');
assert.doesNotMatch(approved,/h\.stats\[opt\.stat\]\s*\)?\s*>=\s*10/,'approved training scene cannot stop at +10');
assert.match(html,/function careerTrainingCost\(/,'single discounted training cost source');
assert.match(html,/arena-balance\.js\?v=[\w-]+/,'active balance script is cache-versioned');
assert.match(html,/ludus-approved-scenes\.js\?v=[\w-]+/,'approved screen cache bust');
assert.match(html,/l===20\?'MAX'/,'Lv.20 is intentionally preserved');
console.log('PASS: unlimited stat training, diminishing combat returns, scaled costs, saved data compatibility and 5-tier level rule');
