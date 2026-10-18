/* Training-room regression: missing / failing runtime must keep BOTH
 * the selection roster and stage fighter visible. Run with plain Node:
 *   node scripts/qa_training_recovery.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const runtime=fs.readFileSync(new URL('../public/ludus-approved-scenes.js',import.meta.url),'utf8');
const style=fs.readFileSync(new URL('../public/ludus-training-runtime.css',import.meta.url),'utf8');
assert.match(style,/\.la-stage\.training\.lt-runtime-ready \.la-roster\.training/);
assert.match(style,/\.la-stage\.training\.lt-runtime-ready \.la-live-fighter/);
assert.doesNotMatch(style,/\.la-stage\.training \.la-roster\.training,\s*\.la-stage\.training \.la-live/);
class Node {
 constructor(tag='div'){
  this.tag=tag;this.className='';this.children=[];this.style={};
  this.dataset={};this.attrs={};this.parent=null;this.hidden=false;
  this.src='';this.width=104;this.height=87;this.textContent='';
  this.classList={
   add:c=>{this.className=[...this.className.split(/\s+/),c].join(' ').trim()},
   remove:c=>{this.className=this.className.split(/\s+/).filter(x=>x!==c).join(' ')},
   contains:c=>this.className.split(/\s+/).includes(c)
  };
 }
 appendChild(node){this.children.push(node);node.parent=this;return node}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this)}
 replaceChildren(...nodes){this.children=[];for(const n of nodes)this.appendChild(n)}
 setAttribute(key,value){this.attrs[key]=value}
 addEventListener(type,fn){this.attrs['on'+type]=fn}
 matches(selectors){return selectors.split(',').some(s=>s.trim().startsWith('.')&&this.className.split(/\s+/).includes(s.trim().slice(1)))}
 querySelector(selector){
  if(selector==='.la-orient button')return new Node('button');
  const match=selector.startsWith('.')?selector.slice(1):null;
  const queue=[...this.children];
  while(queue.length){
   const node=queue.shift();
   if(match&&node.className.split(/\s+/).includes(match))return node;
   queue.unshift(...node.children);
  }
  return null;
 }
 set innerHTML(source){
  if(this.className==='la-screen'&&source.includes('la-stage')){
   const stage=new Node('div');stage.className='la-stage';
   for(const name of ['la-key','la-notice','la-pose']){
    const node=new Node();node.className=name;stage.appendChild(node);
   }
   this.appendChild(stage);
  }
 }
 getContext(){return {clearRect(){},drawImage(){},save(){},restore(){}}}
}
function inspect(mode){
 const root=new Node('body');
 const errors=[];
 const doc={body:root,createElement:tag=>new Node(tag),getElementById:()=>new Node(),addEventListener(){}};
 const state={gold:300,glory:2,active:0,roster:[{
  cls:'murmillo',name:'신규 챔피언 무르밀로',level:7,
  stats:{str:4,agi:2,end:3,focus:2},injury:0,wins:1
 }]};
 const bridge={state:()=>state,portrait:()=>({width:220,height:230}),select:i=>{state.active=i}};
 const external=mode==='missing'?undefined:mode==='throws'?{
  mount(){throw Error('test: module failed')},stop(){}
 }:{
  mount(stage){
   const roster=new Node();roster.className='lt-roster';stage.appendChild(roster);
   const fighter=new Node();fighter.className='lt-fighter-canvas';stage.appendChild(fighter);
  },stop(){}
 };
 const window={LudusBridge:bridge,LudusTrainingV2:external};
 vm.runInNewContext(runtime,{
  document:doc,window,addEventListener(){},innerWidth:1672,innerHeight:941,
  setTimeout(){},clearTimeout(){},console:{error:(...args)=>errors.push(args)}
 },{filename:'ludus-approved-scenes.js'});
 window.LudusApprovedScenes.open('training');
 const scene=root.querySelector('.la-screen');
 const stage=scene.querySelector('.la-stage');
 const has=cls=>stage.children.some(node=>node.className===cls);
 return {
  mode,ready:stage.classList.contains('lt-runtime-ready'),
  roster:has('lt-roster')||has('la-roster training'),
  fighter:has('lt-fighter-canvas')||has('la-live-fighter training'),
  fallback:has('la-roster training')&&has('la-live-fighter training'),
  errors:errors.length
 };
}
for(const mode of ['missing','throws','works']){
 const result=inspect(mode);
 assert.equal(result.roster,true,mode+' has visible roster');
 assert.equal(result.fighter,true,mode+' has visible fighter');
 assert.equal(result.ready,mode==='works');
 assert.equal(result.fallback,mode!=='works');
 if(mode==='throws')assert.equal(result.errors,1);
 console.log('PASS',JSON.stringify(result));
}
