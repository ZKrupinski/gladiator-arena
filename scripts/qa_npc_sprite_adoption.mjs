/* Regression: the prior unattractive Doctore must be gone from EVERY
 * training state, not just the idle and whip screens. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const base=new URL('../public/',import.meta.url);
const html=fs.readFileSync(new URL('index.html',base),'utf8');
const css=fs.readFileSync(new URL('ludus-training-doctore.css',base),'utf8');
const scenes=fs.readFileSync(new URL('ludus-approved-scenes.js',base),'utf8');
const frames=fs.readFileSync(new URL('ludus-doctore-anim.js',base),'utf8');
const carnifex=fs.readFileSync(new URL('arena-carnifex.js',base),'utf8');
const png=fs.readFileSync(new URL('assets/ludus/doctore-whip-user-v1.png',base));
assert.equal(crypto.createHash('sha256').update(png).digest('hex'),
 '4866225fe2d9184c627ed68c84cdcfe305ee3f3452c0bf23844bd11f9dcddf52');
for(const old of ['doctore-sd-v1.webp','doctore_pose_0.webp','doctore_pose_1.webp',
 'doctore_pose_2.webp','doctore_pose_3.webp']){
 assert.equal(fs.existsSync(new URL('assets/ludus/'+old,base)),false,
  old+' must be physically deleted');
 assert.ok(!css.includes(old)&&!frames.includes(old),'old NPC still referenced: '+old);
}
assert.match(html,/ludus-doctore-anim\.js\?v=4/);
assert.match(html,/ludus-approved-scenes\.js\?v=14/);
assert.match(html,/arena-carnifex\.js\?v=5/);
assert.match(css,/doctore-whip-user-v1\.png/);
assert.match(scenes,/LudusDoctoreAnim\?\.mount/);
assert.match(scenes,/LudusDoctoreAnim\?\.react/);
assert.match(scenes,/LudusDoctoreAnim\?\.unmount/);
assert.match(carnifex,/assets\/npc\/carnifex-casual-v5\.webp\?v=5/);
const callbacks=[];let next=1;
const actor={isConnected:true,style:{},dataset:{}};
const window={matchMedia:()=>({matches:false})};
vm.runInNewContext(frames,{window,
 requestAnimationFrame:fn=>{callbacks.push(fn);return next++},
 cancelAnimationFrame(){},performance:{now:()=>1000},console});
const sprite=window.LudusDoctoreAnim;
assert.equal(sprite.sprite.sourcePoses,7);
assert.equal(sprite.sprite.framesPerAction,8);
assert.equal(sprite.sprite.path,'assets/ludus/doctore-whip-user-v1.png?v=2');
sprite.mount(actor);
assert.equal(actor.dataset.action,'idle');
for(const [pose,action] of [[1,'talk'],[2,'command'],[3,'whip'],[-1,'idle']]){
 sprite.react(pose);
 assert.equal(actor.dataset.action,action);
 assert.equal(actor.dataset.source,'user-original');
 assert.match(actor.style.backgroundImage,/doctore-whip-user-v1\.png/);
}
assert.ok(!frames.includes('doctore-sd-v1'),'No hidden fallback to legacy NPC');
sprite.unmount();
console.log('PASS: seven original user PNG poses, all training actions exclusively new Doctore, old sprite files deleted');
