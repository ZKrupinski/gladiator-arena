/* Regression QA: the modern training scene must mount its selected-unit info,
 * full roster and animated fighter together. Run: node scripts/qa_training_modern_mount.mjs
 */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../public/ludus-training-runtime.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
assert.match(source,/function paint\(canvas,img\)/,'portrait helper must not be deleted');
assert.match(html,/ludus-training-runtime\.js\?v=4/,'bust cache for repaired training runtime');

const timers=[],paints=[];
const ctx={
 clearRect(){},drawImage(){paints.push(1)},
 save(){},restore(){},translate(){},rotate(){},scale(){},
 getImageData(){return {data:new Uint8ClampedArray(4)}}
};
class Element {
 constructor(type='div'){
  this.type=type;this.children=[];this.dataset={};this.style={};this.attrs={};
  this.className='';this.id='';this.isConnected=true;this.width=120;this.height=120;
  this.classList={toggle(){}};
 }
 getContext(){return ctx}
 setAttribute(k,v){this.attrs[k]=v}
 appendChild(e){this.children.push(e);return e}
 set innerHTML(src){
  this.html=src;this.children=[];
  const tags=/<(canvas|button|div)\b([^>]*)>/g;let m;
  while((m=tags.exec(src))){
   if(!/(?:\bid=|\bclass=|\bdata-unit=|\bdata-portrait=)/.test(m[2]))continue;
   const e=new Element(m[1]);
   e.id=m[2].match(/id="([^"]+)"/)?.[1]||'';
   e.className=m[2].match(/class="([^"]+)"/)?.[1]||'';
   for(const key of ['unit','portrait']){
    const v=m[2].match(new RegExp('data-'+key+'="([^"]+)"'));
    if(v)e.dataset[key]=v[1];
   }
   e.width=Number(m[2].match(/width="(\d+)"/)?.[1]||120);
   e.height=Number(m[2].match(/height="(\d+)"/)?.[1]||120);
   this.children.push(e);
  }
 }
 querySelector(sel){
  const nodes=[...this.children];
  while(nodes.length){
   const n=nodes.shift();
   if(sel.startsWith('.')&&n.className.split(/\s+/).includes(sel.slice(1)))return n;
   if(sel.startsWith('#')&&n.id===sel.slice(1))return n;
   nodes.push(...n.children);
  }
  return null;
 }
 querySelectorAll(sel){
  const key=sel.match(/\[data-(unit|portrait)\]/)?.[1],nodes=[...this.children],out=[];
  while(nodes.length){
   const n=nodes.shift();
   if(key&&Object.hasOwn(n.dataset,key))out.push(n);
   nodes.push(...n.children);
  }
  return out;
 }
}
const document={createElement:type=>new Element(type)},window={};
vm.runInNewContext(source,{
 document,window,setInterval(fn){timers.push(fn);return timers.length},clearInterval(){}
},{filename:'ludus-training-runtime.js'});
const hero={name:'신규 챔피언 무르밀로',cls:'murmillo',
 stats:{str:2,agi:3,end:2,focus:1},level:3};
const roster=Array.from({length:6},(_,i)=>({...hero,name:'검투사 '+(i+1)}));
const state={roster,active:2,gold:999};
const bridge={portrait:()=>new Element('canvas'),trainingFrame:()=>new Element('canvas')};
const controls={selectedTraining:0,
 tiles:Array.from({length:5},(_,i)=>({name:'훈련 '+i,help:'능력치 향상'})),
 onSelect(){},move(){},onTrainingChoice(){},onTrain(){},onHome(){}};
const stage=new Element();
window.LudusTrainingV2.mount(stage,bridge,state,controls);
assert.ok(stage.querySelector('.lt-info'),'new training info UI');
assert.ok(stage.querySelector('.lt-roster'),'new training roster');
assert.ok(stage.querySelector('.lt-fighter-canvas'),'new stage fighter');
assert.equal(stage.querySelector('.lt-roster').querySelectorAll('[data-unit]').length,6);
assert.equal(timers.length,1,'fighter animation should be running');
assert.ok(paints.length>=6,'portrait draws should complete before animation');
timers[0]();
assert.equal(stage.querySelector('.lt-fighter-canvas').dataset.face,'left');
window.LudusTrainingV2.stop();
console.log('PASS: modern training mounts roster, six fighters, Doctore-facing actor and attack timer.');
