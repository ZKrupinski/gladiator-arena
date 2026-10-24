'use strict';
// Replay actual studio timeline + click handlers under a mobile-style DOM.
// Prevent regression: a single tap must NOT be cancelled by a second onclick.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tools/practice-scale-calibrator.html','utf8');
const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
 .map(m=>m[1]).find(script=>script.includes('setupCompareEditor();initActionEditor();build();'));
assert(inline,'live editor script missing');
new vm.Script(inline);
const timelineStart=inline.indexOf('let actionPaintSerial=0,actionProgress=0,actionPlaying=true;');
const timelineEnd=inline.indexOf('async function previewAction(){',timelineStart);
const initStart=inline.indexOf('function initActionEditor(){');
const initEnd=inline.indexOf('\nfunction paint(',initStart);
assert(timelineStart>=0&&timelineEnd>timelineStart&&initStart>=0&&initEnd>initStart);
const handlers={},nodes=new Map();
function node(query){
 if(!nodes.has(query))nodes.set(query,{
  value:query==='#motionKey'?'start':query==='#actionSpeed'?'1':'',
  textContent:'',attributes:{},listeners:{},
  replaceChildren(...children){this.children=children;if(children.length)this.value=children[0].value;},
  setAttribute(name,value){this.attributes[name]=value;},
  addEventListener(event,fn){
   this.listeners[event]??=[];this.listeners[event].push(fn);
   handlers[query+':'+event]=this.listeners[event];
  }
 });
 return nodes.get(query);
}
const model={motion:{start:{x:-30,y:3},middle:{x:60,y:-23},end:{x:0,y:0}},
 effect:{kind:'auto',x:0,y:0,scale:1},x:0,y:0,scale:1};
const actions={red:{slash:model}};
let nextFrame=null,painting=[],edits=0;
const context={
 document:{hidden:false,createElement:()=>({value:'',textContent:''})},
 window:{SpartacusPublishedActions:{}},
 requestAnimationFrame:fn=>{nextFrame=fn;},
 v:{ACTIONS:['slash'],EFFECTS:['auto','none'],fallbackAction:()=>null,
    clean:obj=>obj,cleanMotion:m=>m},
 keys:['red'],nameFor:()=> 'Red Champion',actions,selection:new Set(),
 '$':node,console,
 currentAction:()=>model,
 previewAction:()=>{painting.push(context.__state().progress);},
 updateActionControls:()=>{},
 persistActionEdit:()=>{edits++;return true;},
 formatAction:()=>{},applyActionToChecked:()=>0,actionCache:new Map()
};
const prelude=inline.slice(timelineStart,timelineEnd);
const initialization=inline.slice(initStart,initEnd);
vm.runInNewContext(prelude+'\n'+initialization+
 '\nthis.__state=()=>({progress:actionProgress,playing:actionPlaying});'+
 '\nthis.__init=initActionEditor;',context);
context.__init();
assert.equal((handlers['#actionPlay:click']||[]).length,1,'exactly one Play click handler');
assert.equal(node('#actionPlay').onclick,undefined,'no second onclick to reverse playback');
assert.equal((handlers['#actionTime:input']||[]).length,1,'only one scrub handler');
assert.equal((handlers['#motionX:input']||[]).length,1,'only one motion X editor');
assert.equal((handlers['#motionY:input']||[]).length,1,'only one motion Y editor');
assert.equal((handlers['#motionKey:change']||[]).length,1,'only one key selection handler');
node('#motionKey').value='middle';
handlers['#motionKey:change'][0]();
assert.equal(context.__state().playing,false,'selecting middle key pauses preview');
assert.equal(context.__state().progress,.5,'middle key seeks 50 percent');
node('#motionX').value='65';
handlers['#motionX:input'][0]();
assert.equal(model.motion.middle.x,65,'motion key can be edited and saved');
assert(edits>0);
const play=handlers['#actionPlay:click'][0];
play();
assert.equal(context.__state().playing,true,'one tap starts playback');
assert.match(node('#actionPlay').textContent,/일시정지/);
assert.equal(node('#actionPlay').attributes['aria-pressed'],'true');
assert.equal(typeof nextFrame,'function','rAF playback scheduled');
nextFrame(1000);nextFrame(1017);nextFrame(1035);nextFrame(1069);
assert(context.__state().progress>.55,'progress advances after Play tap');
assert(painting.some(p=>p>.52&&p<.56),
 'between-key motion redraws smoothly, not only at eight sprite frames');
play();
assert.equal(context.__state().playing,false,'second tap pauses playback');
assert.match(node('#actionPlay').textContent,/재생/);
node('#motionKey').value='end';handlers['#motionKey:change'][0]();
assert.equal(context.__state().progress,1,'end key selects 100 percent');
play();assert.equal(context.__state().playing,true,'Play restarts after end key');
nextFrame(1100);nextFrame(1134);
assert(context.__state().progress<.1,'preview loops from 100% to the start');
assert.match(inline,/baseY:anchorY-113\*fxZoom\+Number\(feet\[key\]\)\*fxZoom/,
 'FX preview Y must use live editor boot offset, not undefined offsetY');
assert.doesNotMatch(inline,/\+offsetY\*fxZoom/,
 'old undefined FX offset cannot crash frame rendering');
console.log('PASS: middle/end keys, mobile Play/Pause, single handlers, 30fps interpolation, saved XY and FX height');
