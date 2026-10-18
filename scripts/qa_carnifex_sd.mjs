/* Carnifex SD integration smoke test. Run: node scripts/qa_carnifex_sd.mjs */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const bin=fs.readFileSync(new URL('../public/assets/npc/carnifex-casual-v5.webp',import.meta.url));
const manifest=JSON.parse(fs.readFileSync(new URL('../public/assets/npc/carnifex-sd-manifest.json',import.meta.url),'utf8'));
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
assert.equal(bin.toString('ascii',0,4),'RIFF');
assert.equal(bin.toString('ascii',8,12),'WEBP');
assert.ok(bin.length>100000,'The actual approved painted sprites must be committed, not a placeholder');
assert.equal(manifest.imageWidth,2560);
assert.equal(manifest.imageHeight,780);
assert.equal(manifest.frameWidth,320);
assert.equal(manifest.frameHeight,390);
assert.equal(manifest.baselineY,352,'new atlas must lift boots clear of ground and corpse');
assert.match(html,/arena-carnifex\.js\?v=5/);
const source=fs.readFileSync(new URL('../public/arena-carnifex.js',import.meta.url),'utf8');
let requested=[];
class Sprite {
 constructor(){this.complete=true;this.naturalWidth=2560;this.naturalHeight=780;}
 set src(x){requested.push(x);}
}
const root={};
vm.runInNewContext(source,{globalThis:root,Image:Sprite});
const C=root.ArenaCarnifex;
assert.equal(C.version,'5.0.0');
assert.equal(C.sprite.baselineY,352);
const enemy={enemy:true,cls:'thraex',x:940,hp:0,cfg:{name:'Fallen gladiator'}};
const s=C.begin(enemy,true,{finished:false});
assert.ok(requested.some(x=>x.includes('carnifex-casual-v5.webp')),'preload the new WebP');
assert.equal(s.body.cfg,enemy.cfg,'retain defeated fighter configuration/sprite');
const arriving=C.positions({...s,t:C.TIME.arrive*.4});
assert.equal(arriving.phase,'walk');
assert.ok(arriving.executionerX>940);
const contact=C.positions({...s,t:C.TIME.arrive+C.TIME.grip+C.TIME.haul*.73});
assert.equal(contact.phase,'drag');
assert.equal(contact.executionerX-contact.bodyX,145,'no sliding away from gripping hand');
assert.ok(contact.frame>=4&&contact.frame<=7,'retreat must hold floor-level dragging hand');
const ending=C.positions({...s,t:C.TIME.total-.001});
assert.equal(ending.frame,7);
assert.equal(ending.bodyVisible,false);
const draws=[],verticalPlanes=[];
const ctx={save(){},restore(){},translate(x,y){if(x===0&&y<0)verticalPlanes.push(y);},scale(){},rotate(){},
 set filter(x){},drawImage(...a){draws.push(a)}};
let actualBodies=0;
C.draw(ctx,{...s,t:C.TIME.arrive+C.TIME.grip+C.TIME.haul*.5},f=>{
 actualBodies++;assert.equal(f.cfg,enemy.cfg);assert.equal(f.action,'defeat');
});
assert.equal(actualBodies,1,'must draw the original fallen gladiator behind the next bout');
assert.deepEqual(verticalPlanes,[-24,-14],'executioner stands higher upstage than the corpse');
assert.equal(draws.length,1,'draw just the executioner from the clean SD sprite sheet');
assert.equal(draws[0].length,9);
assert.equal(draws[0][2],390,'dragging animation must read row 2');
const front=ctx;
assert.equal(C.advance(s,C.TIME.total),true);
assert.equal(C.positions(s).bodyVisible,false);
console.log('PASS: real WebP atlas, aligned SD keyframes, original corpse, hand-locked dragging, full offscreen exit.');
