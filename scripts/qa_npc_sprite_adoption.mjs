/* Female Doctore + Carnifex re-art smoke checks. Run: node scripts/qa_npc_sprite_adoption.mjs */
import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';
const base=new URL('../public/',import.meta.url);
const html=fs.readFileSync(new URL('index.html',base),'utf8');
const css=fs.readFileSync(new URL('ludus-training-doctore.css',base),'utf8');
const scenes=fs.readFileSync(new URL('ludus-approved-scenes.js',base),'utf8');
const frames=fs.readFileSync(new URL('ludus-doctore-anim.js',base),'utf8');
const x=fs.readFileSync(new URL('arena-carnifex.js',base),'utf8');
for(const path of ['assets/ludus/doctore-sd-v1.webp','assets/npc/carnifex-casual-v5.webp']){
 const bin=fs.readFileSync(new URL(path,base));
 assert.equal(bin.toString('ascii',0,4),'RIFF',path);
 assert.equal(bin.toString('ascii',8,12),'WEBP',path);
 assert.ok(bin.byteLength>120000,path+' is not a placeholder');
}
assert.match(html,/ludus-doctore-anim\.js\?v=1/);
assert.match(html,/ludus-approved-scenes\.js\?v=12/);
assert.match(html,/arena-carnifex\.js\?v=5/);
assert.match(css,/left:185px;top:25px;width:360px;height:620px/);
assert.match(css,/doctore-sd-v1\.webp/);
assert.doesNotMatch(css,/animation:la-doctore-idle/);
assert.match(scenes,/LudusDoctoreAnim\?\.mount/);
assert.match(scenes,/LudusDoctoreAnim\?\.react/);
assert.match(scenes,/LudusDoctoreAnim\?\.unmount/);
assert.doesNotMatch(scenes,/trainer\.src='assets\/ludus\/doctore_pose_/);
assert.doesNotMatch(scenes,/actor\.src='assets\/ludus\/doctore_pose_/);
assert.match(x,/assets\/npc\/carnifex-casual-v5\.webp\?v=5/);
assert.doesNotMatch(x,/brightness\(\.92\)/);
const callbacks=[];let next=1;
const actor={isConnected:true,style:{},dataset:{}};
const window={matchMedia:()=>({matches:false})};
vm.runInNewContext(frames,{window,
 requestAnimationFrame:fn=>{callbacks.push(fn);return next++},
 cancelAnimationFrame(){},
 performance:{now:()=>1000}});
const sprite=window.LudusDoctoreAnim;
assert.equal(sprite.sprite.columns,8);
assert.equal(sprite.sprite.rows,4);
for(const [name,row] of Object.entries(sprite.sprite.actions))
 assert.ok(['idle','talk','command','walk','whip'].includes(name)&&row>=0&&row<=4);
sprite.mount(actor);
assert.equal(actor.dataset.action,'idle');
for(const [pose,action] of [[1,'talk'],[2,'command'],[3,'whip']]){
 sprite.react(pose);assert.equal(actor.dataset.action,action);
}
assert.match(sprite.userWhip,/66b8f68a-f680-437b-877a-63e128e9e67f\.png/);
assert.match(scenes,/refresh\(\);pose\(3\)/);
sprite.react(-1);assert.equal(actor.dataset.action,'idle');
sprite.unmount();
console.log('PASS: approved NPC 32+16 atlas refs, fixed 8-frame actions, raised toe baseline and replacement cleanup');
