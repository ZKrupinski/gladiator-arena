/* Carnifex SD integration smoke test. Run: node scripts/qa_carnifex_sd.mjs */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const bin=fs.readFileSync(new URL('../public/assets/npc/carnifex-casual-v5.webp',import.meta.url));
const manifest=JSON.parse(fs.readFileSync(new URL('../public/assets/npc/carnifex-sd-manifest.json',import.meta.url),'utf8'));
const newArt=[
 ['walk','75c2a95c9a02814c1b9d14bb1bf97a6d5fd6db71b36ce2a1cc687a26e208e476'],
 ['haul','60f7bac6d4590ee9ca760dab103c4b257c04936a0a011e88d6f66b048846127b']
];
for(const [name,sha256] of newArt){
 const bytes=fs.readFileSync(new URL('../public/assets/npc/carnifex-'+name+'-ink-v1.webp',import.meta.url));
 assert.equal(bytes.toString('ascii',0,4),'RIFF');
 assert.equal(bytes.toString('ascii',8,12),'WEBP');
 assert.ok(bytes.length>120000,name+' detailed ink frames must not be placeholders');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),sha256,
  name+' source bytes changed after review');
}
const inkManifest=JSON.parse(fs.readFileSync(new URL('../public/assets/npc/carnifex-ink-v1.json',import.meta.url),'utf8'));
assert.equal(inkManifest.grid.cols,4);
assert.equal(inkManifest.grid.rows,2);
assert.equal(inkManifest.cell.width,270);
assert.equal(inkManifest.cell.height,342);
assert.equal(inkManifest.groundY,326);
assert.deepEqual(Object.keys(inkManifest.actions),['walk','haul']);
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
assert.equal(bin.toString('ascii',0,4),'RIFF');
assert.equal(bin.toString('ascii',8,12),'WEBP');
assert.ok(bin.length>100000,'The actual approved painted sprites must be committed, not a placeholder');
assert.equal(manifest.imageWidth,2560);
assert.equal(manifest.imageHeight,780);
assert.equal(manifest.frameWidth,320);
assert.equal(manifest.frameHeight,390);
assert.equal(manifest.baselineY,352,'new atlas must lift boots clear of ground and corpse');
assert.match(html,/arena-carnifex\.js\?v=[^"']+/,'versioned current executioner renderer loaded');
const source=fs.readFileSync(new URL('../public/arena-carnifex.js',import.meta.url),'utf8');
let requested=[];
class Sprite {
 constructor(){this.complete=true;this.naturalWidth=0;this.naturalHeight=0;}
 set src(x){
  requested.push(x);
  if(x.includes('ink-v1.webp')){this.naturalWidth=1080;this.naturalHeight=684;}
  else if(x.includes('casual-v5.webp')){this.naturalWidth=2560;this.naturalHeight=780;}
  else{this.naturalWidth=410;this.naturalHeight=466;}
 }
}
const root={};
vm.runInNewContext(source,{globalThis:root,Image:Sprite});
const C=root.ArenaCarnifex;
assert.equal(C.version,'6.0.0');
assert.equal(C.sprite.baselineY,326);
assert.equal(C.sprite.actions,2);
assert.equal(C.sprite.frameWidth,270);
assert.equal(C.sprite.frameHeight,342);
assert.equal(requested.length,0,'preload remains lazy');
const enemy={enemy:true,cls:'thraex',x:940,hp:0,cfg:{name:'Fallen gladiator'}};
const s=C.begin(enemy,true,{finished:false});
assert.ok(requested.some(x=>x.includes('carnifex-walk-ink-v1.webp')),'load walk V6');
assert.ok(requested.some(x=>x.includes('carnifex-haul-ink-v1.webp')),'load haul V6');
assert.ok(requested.some(x=>x.includes('carnifex-casual-v5.webp')),'keep V5 fallback');
assert.equal(C.isReady(),true,'both ink atlases loaded');
assert.equal(s.body.cfg,enemy.cfg,'retain defeated fighter configuration/sprite');
const arriving=C.positions({...s,t:C.TIME.arrive*.4});
assert.equal(arriving.phase,'walk');
assert.ok(arriving.executionerX>940);
const contact=C.positions({...s,t:C.TIME.arrive+C.TIME.grip+C.TIME.haul*.73});
assert.equal(contact.phase,'drag');
assert.equal(contact.executionerX-contact.bodyX,145,'no sliding away from gripping hand');
assert.ok(contact.frame>=4&&contact.frame<=7,'retreat must hold floor-level dragging hand');
// Body and worker stay visible through the full exit, with no position jump
// when the haul animation gives way to the final offscreen animation.
const haulEnd=C.TIME.arrive+C.TIME.grip+C.TIME.haul;
const before=C.positions({...s,t:haulEnd-0.00001});
const after=C.positions({...s,t:haulEnd+0.00001});
assert.equal(before.bodyVisible,true);
assert.equal(after.bodyVisible,true);
assert.equal(after.phase,'exit');
assert.ok(Math.abs(after.executionerX-before.executionerX)<.04,'worker must not teleport');
assert.ok(Math.abs(after.bodyX-before.bodyX)<.04,'dragged gladiator must not teleport');
assert.equal(after.executionerX-after.bodyX,145,'same hand-to-corpse contact');
const ending=C.positions({...s,t:C.TIME.total-.001});
assert.equal(ending.frame,7);
assert.equal(ending.bodyVisible,true);
assert.ok(ending.executionerX>after.executionerX,'retreat continues offscreen');
for(const [isEnemy,view] of [
 [true,{left:0,right:1280}],
 [false,{left:0,right:1280}],
 [true,{left:300,right:1580}],
 [false,{left:-300,right:980}]
]){
 const other=C.begin({enemy:isEnemy,x:isEnemy?940:335,
  cfg:{name:'loser'},hp:0},true,{finished:false},view);
 const final=C.positions({...other,t:C.TIME.total});
 assert.equal(final.bodyVisible,true);
 assert.equal(Math.abs(final.executionerX-final.bodyX),145);
 assert.equal(C.advance(other,C.TIME.total,view),true,
  'both full silhouettes must clear the visible viewport before cleanup finishes');
}
{
 const moving=C.begin(enemy,true,{finished:false},{left:0,right:1280});
 const shifted={left:1000,right:2100};
 assert.equal(C.advance(moving,C.TIME.total,shifted),false,
  'camera pan must not erase a still-visible body or worker');
 const prior=C.positions(moving);
 assert.equal(prior.bodyVisible,true);
 assert.equal(C.advance(moving,4.0,shifted),true,
  'extend the retreat until BOTH bodies clear a shifted camera viewport');
 assert.ok(C.positions(moving).executionerX>prior.executionerX);
}
const draws=[],verticalPlanes=[];
const ctx={save(){},restore(){},translate(x,y){if(x===0&&y<0)verticalPlanes.push(y);},scale(){},rotate(){},
 set filter(x){},drawImage(...a){draws.push(a)}};
let actualBodies=0;
C.draw(ctx,{...s,t:C.TIME.arrive+C.TIME.grip+C.TIME.haul*.5},f=>{
 actualBodies++;assert.equal(f.cfg,enemy.cfg);assert.equal(f.action,'defeat');
});
assert.equal(actualBodies,1,'must draw the original fallen gladiator behind the next bout');
assert.deepEqual(verticalPlanes,[-14],'executioner boots use shared arena floor; corpse keeps the existing depth offset');
assert.equal(draws.length,1,'draw just the executioner from the clean SD sprite sheet');
assert.equal(draws[0].length,9);
assert.equal(draws[0][2],342,'dragging frame from haul atlas row two');
assert.equal(draws[0][3],270);
assert.equal(draws[0][4],342);
assert.ok(Math.abs(draws[0][6]+326/342*466)<1e-8,'ink toe anchor remains planted at shared floor');
for(const [phase,t,name] of [
 ['walk',C.TIME.arrive*.4,'carnifex-walk-ink-v1.webp'],
 ['grab',C.TIME.arrive+C.TIME.grip*.5,'carnifex-haul-ink-v1.webp'],
 ['drag',C.TIME.arrive+C.TIME.grip+C.TIME.haul*.85,'carnifex-haul-ink-v1.webp'],
 ['exit',C.TIME.total-.001,'carnifex-haul-ink-v1.webp']
]){
 const images=[];const dummy={save(){},restore(){},translate(){},scale(){},rotate(){},set filter(v){},
  drawImage(...args){images.push(args)}};
 C.draw(dummy,{...s,t},()=>{});
 assert.equal(images.length,1,phase+' must draw exactly one NPC sprite');
 const actual=images[0],expected='assets/npc/'+name+'?v=1';
 assert.ok(requested.includes(expected),phase+' motion family was not preloaded');
 assert.equal(actual[3],270,phase+' cropped 4x2 frame');
 assert.equal(actual[4],342,phase+' cropped 4x2 frame height');
}

const front=ctx;
assert.equal(C.advance(s,C.TIME.total),true);
assert.equal(C.positions(s).bodyVisible,true,'keep dragged sprite during last drawn frame');
console.log('PASS: approved transparent 4x2 ink atlases (2x8), stable feet, original KO sprite and hand-locked Carnifex drag.');
