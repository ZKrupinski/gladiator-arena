'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const scaleSource=fs.readFileSync('public/practice-scale-profiles.js','utf8');
const visualSource=fs.readFileSync('public/practice-visual-profiles.js','utf8');
const window={localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
 SpartacusPublishedActions:{},
 SpartacusPublishedScales:{},
 PracticeVisualProfiles:null,PracticeScaleProfiles:null};
vm.runInNewContext(scaleSource,{window,console});
vm.runInNewContext(visualSource,{window,console});
const profile=window.PracticeScaleProfiles,artist=window.PracticeVisualProfiles;
assert.equal(Object.keys(profile.BASE).length,31);
assert(Object.values(profile.BASE).every(n=>n===1),
 'every class/grade has neutral artist baseline: no special hidden Murmillo sizing');
assert.equal(artist.ACTIONS.length,15);
for(const action of ['slash','sweep','thrust'])assert.equal(artist.fallbackAction(action),'attack');
assert.equal(artist.fallbackAction('heavy'),'special');
const training=fs.readFileSync('public/ludus-training-runtime.js','utf8');
const injected=training.replace(/window\.LudusTrainingV2=\{[^;]+\};/,
 'window.LudusTrainingV2={mount,stop};window.__TRAINING_QA__={profileFor,paintTrainingFighter,actionAt};');
assert.notEqual(injected,training,'exercise real runtime painter');
const calls=[];
const fakeCanvas={width:560,height:440,getContext:()=>({
 clearRect(){},save(){},restore(){},scale(...x){calls.push(['scale',...x])},
 translate(...x){calls.push(['translate',...x])},
 drawImage(...x){calls.push(['image',...x])}
})};
const winTraining={
 PracticeScaleProfiles:{scale:key=>key==='murmillo_champion_red'?1.40:1,foot:()=>-7},
 PracticeVisualProfiles:{resolve:(key,action)=>action==='slash'?{x:12,y:-6,scale:1.25}: {x:0,y:0,scale:1}}
};
vm.runInNewContext(injected,{window:winTraining,document:{},console});
const qa=winTraining.__TRAINING_QA__;
const idle={width:960,height:540},actionImage={width:960,height:540};
const p=qa.profileFor(fakeCanvas,idle,'murmillo_champion_red');
assert.equal(p.look,'murmillo_champion_red');
assert(Math.abs(p.scale-Math.min(350/540,520/960))<1e-9,'only full authored frame and layout bounds determine baseline');
qa.paintTrainingFighter(fakeCanvas,actionImage,'slash',.7,p);
const translate=calls.find(x=>x[0]==='translate'),draw=calls.find(x=>x[0]==='image');
assert.equal(translate[1],268,'studio X movement respects training left-facing actor');
assert.equal(translate[2],418,'studio pose Y and global feet reach training');
const k=p.scale*1.4*1.25;
assert(Math.abs(draw[8]-actionImage.height*k)<1e-8,'look and action scales applied exactly once');
assert(Math.abs(draw[7]-actionImage.width*k)<1e-8,'same scale for X and Y');
assert.equal(draw[2],0,'full uncropped source frame, no per-pose alpha bounds');
assert.equal(draw[4],960,'full source frame width');
assert.doesNotMatch(training,/const towardDoctore=/);
assert.doesNotMatch(training,/ctx\.rotate\(-lean\)/);
assert.doesNotMatch(training,/isHit\?1-\.055\*recoil:1/);
const main=fs.readFileSync('public/index.html','utf8');
const start=main.indexOf('function drawFighter(f)'),end=main.indexOf('function drawIllustratedEffect(',start);
assert(start>=0&&end>start);
const duel=main.slice(start,end);
assert.match(duel,/PracticeVisualProfiles\?\.resolve\?\.\(duelAppearanceKey\(f\),editorAction\)/);
assert.match(duel,/const variant=\['slash','sweep','thrust'\]/);
assert.match(duel,/ctx\.scale\(authored\.scale,authored\.scale\)/);
assert.doesNotMatch(duel,/drawY-=23\*swing/,'no special-case slash position offset');
assert.doesNotMatch(duel,/drawX\+=dir\*40\*swing/,'no hidden attack thrust offset');
assert.doesNotMatch(duel,/ctx\.scale\(impactVisual\.scale/,'no hidden impact body zoom');
assert.match(main,/appearanceKey:i=>window\.PracticeScaleProfiles\?\.look/);
const practice=fs.readFileSync('public/ludus-practice.js','utf8');
assert.match(practice,/function authoredPose\(unit,pose\)/);
assert.match(practice,/\['thrust','slash','sweep'\]\[unit\.swings%3\]/);
assert.match(practice,/root\.PracticeVisualProfiles\?\.resolve\?\.\(visualLook\(unit\),action\)/);
const studio=fs.readFileSync('public/tools/practice-scale-calibrator.html','utf8');
assert.match(studio,/slash:'종베기',sweep:'횡베기',thrust:'찌르기',heavy:'강베기'/);
assert.match(studio,/\['frameX','frameY','frameScale','fxX','fxY','fxScale','fxKind'\]/);
assert.match(studio,/const fallback=v\.fallbackAction\?\.\(pose\)/);
assert.match(studio,/const special=\{parry:'guard',finisher:'attack',victory:'idle'\}/);
assert.match(main,/ludus-training-runtime\.js\?v=unified-action-v51/);
assert.match(main,/ludus-practice\.js\?v=unified-action-v51/);
assert.match(main,/practice-visual-profiles\.js\?v=unified-action-v51/);
console.log('PASS: one artist action/profile for normal duel, practice and training; 15 poses, no scene-specific offsets or hidden body scaling');
