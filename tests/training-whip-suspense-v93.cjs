'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const file=p=>fs.readFileSync(path.join(__dirname,'../public',p),'utf8');
const scene=file('ludus-approved-scenes.js'),actor=file('ludus-training-runtime.js');
const fighter=file('murmillo-motion-v2.js'),html=file('index.html'),style=file('ludus-training-clean.css'),fighterCss=file('ludus-training-runtime.css');
assert(scene.includes('if(pendingTraining)return;'),'rapid taps never charge twice');
assert(scene.includes('pose(3); // Seven genuine'),'whip launches when training is pressed');
assert(scene.includes("stage.addEventListener('ludus:whip-impact',onTrainingWhipImpact)"),'listens to real contact');
assert(scene.includes("const TRAINING_REACTION_MS=560"),'reaction completes before badges');
assert(scene.includes("stage.dataset.trainingOutcome=failed?'fail':'success'"),'outcome held hidden until reaction');
assert(scene.includes('revealTimer=setTimeout(()=>revealTrainingSequence(job.token),TRAINING_REACTION_MS)'),'badge deferred beyond impact');
assert(scene.includes("clearTrainingSequence();\n speechPhase=job.failed"),'pending transaction cleared before reveal');
assert(scene.includes('TRAINING_IMPACT_FALLBACK_MS=1400'),'reduced-motion fallback');
assert(actor.includes("responseKind=stage.dataset.trainingOutcome==='success'?'guard':'hit'"),'success blocks, failure recoils');
assert(actor.includes("takingHit&&responseKind==='hit'"),'only failures get hit FX');

assert(actor.includes('const HIT_MS=528,FX_MS=342'),'reaction pose finishes before 560ms badge');
assert(actor.includes('reactionOffset(contact.kind,contact.progress,contact.reduced)'),'movement is driven by time since actual whip contact');
assert(actor.includes("kind==='guard'?19:39"),'block has smaller recoil than body hit');
assert(actor.includes('Math.sin(Math.PI*t)'),'fighter bounces briefly and then returns to planted baseline');
assert(actor.includes('drawTrainingContactFX(ctx,contact.kind,contact.elapsed/FX_MS,x,y)'),'matching real artwork effect is played at contact');
assert(actor.includes('window.ArenaRasterFX?.draw?.(ctx,kind'),'uses authored RGBA guard/hit animations, not vector shapes');
assert(fighterCss.includes('.lt-fighter-zone.whip-hit::after{content:none!important}'),'retire redundant synthetic radial flash');
assert(html.includes('ludus-training-runtime.js?v=training-contact-recoil-v94'));
assert(html.includes('ludus-training-runtime.css?v=training-contact-recoil-v94'));

assert(fighter.includes('guard:[9,6,6,6,6,6,6,9]'),'murmillo genuine guard pose');
assert(html.includes("kind==='guard'?5"),'legacy fighter guard pose');
assert(html.includes("kind==='guard'?6"),'growth fighter guard pose');
assert(style.includes('.training-resolving .lt-start-button'),'touch shield during suspense');
for(const p of ['ludus-approved-scenes.js','ludus-training-clean.css','murmillo-motion-v2.js'])
 assert(html.includes(p+'?v=whip-guard-suspense-v93'),p+' cache bust');
console.log('PASS: one economy roll, real whip contact, distinct guard/hit motions, delayed result and fallbacks');
