// 5vs5 thumbnail click/command/portrait regression: node tests/arena-coop-ux.js
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const Core=require('../public/arena-coop-core');
const image={width:180,height:240};
const elements=new Map(),drawn=[];
const node=(key)=>{
 if(elements.has(key))return elements.get(key);
 const el={dataset:{},style:{},hidden:false,disabled:false,textContent:'',innerHTML:'',
  setAttribute(){},remove(){},focus(){},addEventListener(){},getClientRects(){return [1]},
  querySelector(){return node(key+' descendant')},querySelectorAll(){return []}};
 if(key==='canvas'){el.width=1280;el.height=720;el.getContext=()=>({});}
 elements.set(key,el);return el;
};
const host=node('host');host.querySelector=selector=>node(selector);
host.addEventListener=(event,fn)=>{host.handlers=host.handlers||{};host.handlers[event]=fn;};
const document={body:{style:{overflow:''},append(){}},activeElement:{isConnected:false},
 createElement:tag=>tag==='section'?host:node('created '+tag),addEventListener(){},removeEventListener(){}};
let sim;
const root={ArenaCoopCore:{...Core,create:(...args)=>(sim=Core.create(...args))},
 LudusBridge:{squadSprite:()=>image,practiceEnemySprite:()=>image,state:()=>({roster:[]})},
 ArenaPortraitFit:{draw:(canvas,source,opts)=>{drawn.push({flip:opts.flipX});return true;}},
 addEventListener(){},removeEventListener(){}};
class Image{constructor(){this.src='';this.complete=false;this.naturalWidth=0;}}
let nextFrame=1;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/arena-coop.js'),'utf8'),
 {window:root,document,Image,requestAnimationFrame:()=>nextFrame++,cancelAnimationFrame(){},console});
const team=()=>Array.from({length:5},(_,i)=>({index:i,name:'Gladiator '+i,cls:['murmillo','retiarius','thraex'][i%3],
 combat:{hp:150,atk:18,move:230,armor:.1,parry:.16}}));
assert.equal(root.ArenaCoop.open(team(),team(),{seed:8}),true);
assert.equal(drawn.length,10,'all ten portraits paint immediately');
assert(drawn.slice(0,5).every(x=>x.flip===false),'ally thumbnails face enemy to the right');
assert(drawn.slice(5).every(x=>x.flip===true),'human enemy thumbnails face the allies on the left');
const html=host.innerHTML;
assert(html.indexOf('class="coop-scoreboard"')>html.indexOf('class="coop-field"'),'portrait panels are below canvas');
assert(html.includes('data-formation')&&html.includes('data-flank')&&html.includes('data-rally'),'whole-squad tactical buttons present');
assert(!html.includes('data-cover>'),'old separate cover button removed');
const click=id=>host.handlers.click({target:{closest:()=>({dataset:{unit:id}})}});
click('ally1');assert.equal(sim.cover.id,'ally1','direct ally tap immediately applies cover');
assert.equal(sim.cover.until,7,'cover lasts seven seconds');
click('enemy3');assert.equal(sim.focus.id,'enemy3','direct enemy tap immediately applies focus');
assert.equal(sim.focus.until,6,'focus lasts six seconds');
node('[data-formation]').onclick();assert(sim.formation.until>0,'formation command immediately active');
node('[data-flank]').onclick();assert(sim.flank.until>0,'flank command immediately active');
sim.meter=60;node('[data-rally]').onclick();assert.equal(sim.meter,0,'allies spend combo meter on team rally');
sim.paused=true;node('[data-formation]').onclick();assert.equal(sim.formationReady,19,'paused commands cannot bypass cooldown');
console.log('PASS: 10 facing thumbnails, under-field panel, ally cover/enemy focus instant taps, team-wide tactics and paused command safety');
