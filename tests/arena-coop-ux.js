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

// Death must use the approved sprite action, play 0–7 exactly once, and
// never rotate the fighter image sideways as a substitute for the animation.
const deathFrame=root.ArenaCoop.deathFrame;
assert.equal(deathFrame({deathAt:10},9.5),0,'never select negative death frames');
assert.equal(deathFrame({deathAt:10},10),0,'start from frame zero');
assert.equal(deathFrame({deathAt:10},10.35),3,'death sequence advances at 10 FPS');
assert.equal(deathFrame({deathAt:10},10.85),7,'finish on frame seven');
assert.equal(deathFrame({deathAt:10},19),7,'never wrap the corpse back to frame zero');
assert.equal(deathFrame({},19),7,'missing timestamps preserve the final death frame');
const renderer=fs.readFileSync(path.join(__dirname,'../public/arena-coop.js'),'utf8');
assert.match(renderer,/const pose=u\.dead\?'death':/,'dead fighters select death art');
assert.match(renderer,/const tick=u\.dead\?deathFrame\(u,sim\.time\):/,'death pose receives the held frame');
assert.doesNotMatch(renderer,/corpseFall|if\(u\.dead\)ctx\.rotate/,'remove 90-degree corpse rotation');


// Artwork-only 5v5 regression: status cues live in the portrait HUD, not as
// basic canvas geometry (rings, dotted connectors, boxes, bars or damage text).
const rasterOnlySource=fs.readFileSync(path.join(__dirname,'../public/arena-coop.js'),'utf8');
assert.doesNotMatch(rasterOnlySource,/\bctx\.(?:beginPath|setLineDash|moveTo|lineTo|ellipse|arc|stroke|strokeRect|strokeText|fillText)\s*\(/,
 '5v5 battlefield may not draw procedural shapes or canvas labels');
assert.doesNotMatch(rasterOnlySource,/ArenaCombatFeel\?\.overlay\?\./,
 '5v5 must not overlay procedural full-screen flash rectangles');
assert.match(rasterOnlySource,/ArenaRasterFX\?\.draw\?\.\(/,
 'approved directional PNG hit art remains in battle');
assert.match(rasterOnlySource,/const units=C\.depthOrder\(sim\.units\),items=units\.map\([\s\S]*?paint:\(\)=>drawUnit\(u\)/,
 'all ten fighters and dead sprites remain visible');
assert.match(rasterOnlySource,/b\.classList\.toggle\('is-selected'/,
 'selection is still visible on the portrait HUD');

console.log('PASS: 10 facing thumbnails, under-field panel, ally cover/enemy focus instant taps, team-wide tactics and paused command safety');
