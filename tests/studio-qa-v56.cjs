'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const profileCode=fs.readFileSync('public/practice-visual-profiles.js','utf8');
const cells=new Map(),localStorage={getItem:k=>cells.get(k),setItem:(k,v)=>cells.set(k,v)};
const published={red:{attack:{x:40},slash:{x:15}}};
function load(){const window={localStorage,PracticeScaleProfiles:{DEFAULTS:{red:1}},SpartacusPublishedActions:published};vm.runInNewContext(profileCode,{window});return window.PracticeVisualProfiles;}
let v=load();v.write({red:{attack:{x:40},slash:v.clean()}});v=load();
assert.equal(v.resolve('red','slash').x,0,'explicit neutral must survive reload over published and inherited adjustments');
assert.equal(v.resolve('red','sweep').x,40,'missing subtype must still inherit attack');
assert.equal(v.sanitize(v.all()).red.slash.scale,1,'neutral override included in JSON/GitHub export');
const html=fs.readFileSync('public/tools/practice-scale-calibrator.html','utf8');
const code=html.slice(html.indexOf('function saveAllDraft(){'),html.indexOf('function setupNumbers(){'));
const nodes=new Map();const $=id=>{if(!nodes.has(id))nodes.set(id,{disabled:false,addEventListener(){}});return nodes.get(id)};
let saves=0;const ctx={state:{red:1},feet:{red:0},actions:{},keys:['red'],p:{write:()=>{saves++;return false},writeFeet:()=>{saves++;return true}},v:{write:()=>{saves++;return true}},$,JSON,console,Event,
 document:{addEventListener(){},dispatchEvent(){},activeElement:null},refresh(){},updateBulkState(){},sortCards(){},updateActionControls(){},pauseAtKey(){},selectedKeyIndex:()=>0,announce(){}};
vm.runInNewContext(code+';this.api={recordHistory,undo,redo,saveAllDraft};',ctx);
ctx.api.recordHistory();ctx.state.red=1.25;ctx.api.recordHistory();ctx.feet.red=-8;ctx.api.recordHistory();ctx.actions.red={slash:{x:20}};ctx.api.recordHistory();
ctx.api.undo();assert.equal(ctx.actions.red,undefined);assert.equal(ctx.feet.red,-8);
ctx.api.undo();assert.equal(ctx.feet.red,0);assert.equal(ctx.state.red,1.25);
ctx.api.redo();assert.equal(ctx.feet.red,-8);
ctx.state.red=1.5;ctx.api.recordHistory();assert.equal($('#redoEdit').disabled,true,'new edit clears redo branch');
saves=0;assert.equal(ctx.api.saveAllDraft(),false);assert.equal(saves,3,'one failed storage must not skip remaining stores');
console.log('PASS: explicit neutral persistence/export, inherited poses, undo/redo across size/feet/actions, redo branching, independent save attempts');
