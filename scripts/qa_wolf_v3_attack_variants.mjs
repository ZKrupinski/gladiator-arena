import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const src=readFileSync(new URL('../public/arena-beasts.js',import.meta.url),'utf8');
const context={window:{},console};vm.runInNewContext(src,context);
const api=context.window.ArenaBeasts;assert.ok(api?.wolfActionFor,'Wolf V3 action selector');
const actor={beastType:'wolf',attackVariant:0,actionDuration:1,actionT:.5,face:-1};
for(let index=0;index<3;index++){
 actor.attackVariant=index;
 assert.equal(api.wolfActionFor(actor,'attack'),'attack'+(index+1));
}
assert.equal(api.wolfActionFor(actor,'comboDash'),'attack4');
assert.equal(api.wolfActionFor(actor,'finisher'),'attack4');
assert.equal(api.wolfActionFor(actor,'special'),'roar');
assert.equal(api.wolfActionFor(actor,'hit'),'hit');
assert.equal(api.wolfActionFor(actor,'defeat'),'death');
assert.equal(api.wolfActionFor(actor,'walk'),'walk');
delete actor._beastDeathSince;
assert.equal(api.wolfFrameIndex(actor,'defeat',40),0);
assert.equal(api.wolfFrameIndex(actor,'defeat',40.60),4);
assert.equal(api.wolfFrameIndex(actor,'defeat',42),7);
// If new art is absent, the existing working 40-frame fallback stays intact.
assert.equal(api.status().wolfV3.status,'unrequested');
assert.deepEqual([...api.status().wolfV3.actions],[]);
console.log('WOLF_V3_9_ACTION_MAPPING_AND_FALLBACK_PASS');
