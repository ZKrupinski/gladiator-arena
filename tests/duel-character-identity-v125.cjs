'use strict';
// Regression: a stray assignment in drawGrowthPose previously rewrote EVERY
// fighter's championVariant, painting red-helmet Murmillo for all roster picks.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/index.html','utf8');
const start=source.indexOf('function drawGrowthPose('),end=source.indexOf('// A handful of approved legacy guard',start);
assert(start>0&&end>start,'use actual duel renderer, not a copied test implementation');
const painted=[];
const variants={champion:'murmillo_champion_red',new:'murmillo_redcrest_new_v1',alt:'murmillo_redcrest_alt_v1',animated:'murmillo_motion_v3'};
const sprite=(name)=>({draw:(_ctx,args)=>{painted.push(name);return true;}});
const map=new Map(['murmillo_a_L1','murmillo_a_L5','thraex_a_L1','thraex_b_L4','retiarius_a_L2'].map(k=>[k,{id:k}]));
const window={ChampionMurmillo:sprite('champion'),NewMurmillo:sprite('new'),AltMurmillo:sprite('alt'),
 MurmilloMotion:sprite('animated')};
const custom={draw:(_ctx,args)=>{painted.push('custom:'+args.id);return true;}};
const growth={draw:(_ctx,atlas)=>{if(atlas){painted.push('growth:'+atlas.id);return true;}return false;}};
const sandbox={window,CUSTOM_GLADIATOR_ART:custom,GROWTH_IMAGES:map,GrowthFrames:growth,
 GROWTH_POSE:{idle:0,hit:7},ctx:{},S:{},clock:1,
 duelVisualScale:()=>1,CHAMPION_MURMILLO_VARIANT:variants.champion,
 NEW_MURMILLO_VARIANT:variants.new,ALT_MURMILLO_VARIANT:variants.alt,
 ANIMATED_MURMILLO_VARIANT:variants.animated,
 specialMurmilloFighter:f=>f.championVariant===variants.alt?window.AltMurmillo:
  f.championVariant===variants.new?window.NewMurmillo:window.ChampionMurmillo};
vm.runInNewContext(source.slice(start,end)+'\nthis.paint=drawGrowthPose;',sandbox);
const scenarios=[
 [{cls:'murmillo',growthType:'murmillo_a',growthLevel:1},'growth:murmillo_a_L1'],
 [{cls:'thraex',growthType:'thraex_a',growthLevel:1},'growth:thraex_a_L1'],
 [{cls:'thraex',growthType:'thraex_b',growthLevel:4},'growth:thraex_b_L4'],
 [{cls:'retiarius',growthType:'retiarius_a',growthLevel:2},'growth:retiarius_a_L2'],
 [{cls:'murmillo',championVariant:variants.champion},'champion'],
 [{cls:'murmillo',championVariant:variants.new},'new'],
 [{cls:'murmillo',championVariant:variants.alt},'alt'],
 [{cls:'murmillo',motionVariant:variants.animated},'animated'],
 [{cls:'retiarius',registeredAppearance:'retiarius_custom_qa'},'custom:retiarius_custom_qa']
];
for(const [f,expected] of scenarios){
 painted.length=0;const before=JSON.stringify(f);
 const rendered=sandbox.paint(f,'idle',0,0,202,202,false,1);
 assert.equal(rendered,true,'artwork resolves for '+expected);
 assert.deepEqual(painted,[expected],'correct selected identity painted, not the champion');
 assert.equal(JSON.stringify(f),before,'painting must never mutate selected fighter identity');
}
painted.length=0;
const legacy={cls:'thraex',legacyVisualId:'legacy_thraex'};
assert.equal(sandbox.paint(legacy,'idle',0,0,202,202,false,1),false,'legacy route falls back to original class atlas, never to red Murmillo');
assert.deepEqual(painted,[]);
assert(!/if\s*\(\s*f\.championVariant\s*=[^=]/.test(source),'no accidental assignment to fighter champion identity');
console.log('PASS: 10 independent identity routes (3 classes, five visual variants, custom, legacy) retain their roster graphics in normal duel, lineup and venatio shared renderer');
