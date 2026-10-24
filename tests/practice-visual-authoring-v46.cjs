'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const profileCode=fs.readFileSync('public/practice-visual-profiles.js','utf8');
const storage=new Map();
const localStorage={
 getItem:k=>storage.get(k)||null,setItem:(k,val)=>storage.set(k,val),removeItem:k=>storage.delete(k)
};
const base={murmillo_champion_red:1.5,murmillo_a_L1:1,beast_wolf:1,npc_carnifex:1};
function load(published={}){
 const window={SpartacusPublishedActions:published,localStorage,
  PracticeScaleProfiles:{DEFAULTS:base}};
 vm.runInNewContext(profileCode,{window,console});
 return window.PracticeVisualProfiles;
}
let profile=load();
assert.equal(profile.ACTIONS.length,15);
assert.deepEqual(Array.from(profile.ACTIONS.slice(3,7)),['slash','sweep','thrust','heavy']);
assert.equal(profile.EFFECTS.length,12);
assert.equal(profile.resolve('murmillo_champion_red','attack').scale,1);
assert.equal(profile.resolve('murmillo_champion_red','attack').effect.kind,'auto');
const edit=profile.clean({x:27,y:-14,scale:1.22,effect:{kind:'sweep',x:34,y:-25,scale:1.55}});
assert.equal(edit.x,27);assert.equal(edit.effect.kind,'sweep');
assert.deepEqual(JSON.parse(JSON.stringify(profile.clean({x:999,y:-999,scale:99,effect:{kind:'INVALID',x:999,scale:-20}}))),
 {x:180,y:-180,scale:1.8,effect:{kind:'auto',x:300,y:0,scale:.2},
 motion:{start:{x:0,y:0},middle:{x:0,y:0},end:{x:0,y:0}}});
assert(profile.write({murmillo_champion_red:{attack:edit}}));
profile=load();assert.equal(profile.resolve('murmillo_champion_red','attack').x,27);
assert.equal(profile.resolve('murmillo_champion_red','slash').x,27,'new slash inherits generic attack X');
assert.equal(profile.resolve('murmillo_champion_red','sweep').scale,1.22,'new sweep inherits generic attack size');
assert.equal(profile.resolve('murmillo_champion_red','thrust').effect.kind,'sweep','thrust uses generic attack FX until edited');
assert.equal(profile.fallbackAction('heavy'),'special');
assert.equal(profile.resolve('murmillo_champion_red','attack').effect.kind,'sweep');
assert.equal(profile.resolve('murmillo_champion_red','idle').scale,1);
profile=load({murmillo_champion_red:{attack:{x:8,scale:1.1,effect:{kind:'thrust'}}}});
assert.equal(profile.resolve('murmillo_champion_red','attack').x,27,'an artist draft must survive an unrelated published baseline update');
assert.equal(profile.resolve('murmillo_champion_red','attack').effect.kind,'sweep','unsent user FX selection must survive newer published defaults');
profile.write({murmillo_champion_red:{attack:edit}});
assert.equal(load({murmillo_champion_red:{attack:{x:8,scale:1.1,effect:{kind:'thrust'}}}})
 .resolve('murmillo_champion_red','attack').x,27);
const game=fs.readFileSync('public/ludus-practice.js','utf8');
assert.match(game,/t=visualAction\(unit,pose\)/,'sprite render consumes live authoring transform');
assert.match(game,/metric\.pixels\*scale\*t\.scale/,'one explicit action multiplier');
assert.match(game,/ctx\.translate\(\(t\.x\+motion\.x\)\*scale\*face,\(profilesFoot\(unit\)\+t\.y\+motion\.y\)\*scale\)/,'action and 0/50/100 XY keys control visible feet');
assert.match(game,/ctx\.drawImage\(art,-pivotX\*k,-pivotY\*k/,'render original complete bitmap, no alpha crop');
assert.doesNotMatch(game,/ctx\.drawImage\(art,bounds\.x,bounds\.y,bounds\.w,bounds\.h/);
assert.match(game,/settings\?\.resolve\?\.\(visualLook\(unit\),action\)/,'hit/guard/attack events lookup same editor FX');
assert.match(game,/chosen=!selected\|\|selected==='auto'\?kind:selected/,'artist-selected FX kind applied');
assert.match(game,/settings\?\.effectGeometry\?\.\(/,'shared effect geometry replaces scene multiplication');
assert.match(game,/geometry\.width,height:geometry\.height/,'authored FX pixel size forwarded');
assert(!game.includes('PRACTICE_FX_SIZE='),'no hidden copy of effect dimensions');
const html=fs.readFileSync('public/tools/practice-scale-calibrator.html','utf8');
for(const id of ['actionKey','actionPose','actionCanvas','frameX','frameY','frameScale',
 'fxKind','fxScale','fxX','fxY','actionReset','actionPreviewRefresh']){
 assert(html.includes('id="'+id+'"'),id+' not in editor');}
const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
 .map(x=>x[1]).find(x=>x.includes('initActionEditor();build();'));
assert(inline,'tool editor actual binding script');new vm.Script(inline,{filename:'practice-scale-calibrator.js'});
const publisher=fs.readFileSync('public/tools/practice-scale-publish.js','utf8');
new vm.Script(publisher,{filename:'practice-scale-publish.js'});
assert.match(publisher,/SpartacusPublishedActions=Object\.freeze/,'GitHub source includes all action corrections');
assert.match(publisher,/actions:root\.PracticeVisualProfiles\?\.sanitize/,'saved versions parse action values');
const deployed=fs.readFileSync('public/index.html','utf8');
assert(deployed.includes('practice-visual-profiles.js?v=motion-timeline-v53'));
const indexProfile=deployed.indexOf('practice-visual-profiles.js?v=motion-timeline-v53');
const indexRuntime=deployed.indexOf('ludus-practice.js?v=motion-timeline-v53');
assert(indexProfile>=0&&indexRuntime>indexProfile,'action profiles load before live runtime');
const rules=require('../public/ludus-practice.js');
for(let n=1;n<=4;n++){
 const courts=rules.courtsForParty(n);
 assert.equal(courts.length,n);
 for(const c of courts)assert.equal(c.scale,1,'NO hidden party/seat enlargement: '+n);
}
assert.doesNotMatch(game,/scale:1\.29|scale:1\.06|scale:1\.24/,
 'remove ALL old staggered front/rear scales');
assert(html.includes('const p=202/(348*.82)'),'studio executioner preview equals current arena camera');
assert(html.includes("const previewScale=.52,sceneProjection=scene==='duel'"),'action preview supports correct 52% relative camera preview');
assert(html.includes("slash:'slash',sweep:'sweep',thrust:'thrust'"),'studio previews exact attack FX variants');
console.log('PASS: edits preserved, defaults isolated, true action bitmap rendering, artist FX selection, UI and GitHub source publish');
