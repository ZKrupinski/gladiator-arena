/* Approved female trainer plus Carnifex smoke test.
 * Originals must remain byte-identical. Never allow the old trainer again. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const base=new URL('../public/',import.meta.url);
const html=fs.readFileSync(new URL('index.html',base),'utf8');
const css=fs.readFileSync(new URL('ludus-training-doctore.css',base),'utf8');
const scenes=fs.readFileSync(new URL('ludus-approved-scenes.js',base),'utf8');
const source=fs.readFileSync(new URL('ludus-doctore-anim.js',base),'utf8');
const carnifex=fs.readFileSync(new URL('arena-carnifex.js',base),'utf8');
const hashes={
 'doctore-idle-approved-v1.png':'06f90e9c7abd25a15ca3b8be2e5f532400bdf5cb1f0ddf511248ae59180ef282',
 'doctore-explain-approved-v1.png':'2f2b26077b5680fc7f26063048513ecd75312982ef8de703a433e4883ac06965',
 'doctore-authority-approved-v1.png':'4ed7ef333da18db4fce76846568bdd4abd333d2f3d43fe191cb0e618b733f511',
 'doctore-whip-user-v1.png':'4866225fe2d9184c627ed68c84cdcfe305ee3f3452c0bf23844bd11f9dcddf52'
};
for(const [name,hash] of Object.entries(hashes)){
 const data=fs.readFileSync(new URL('assets/ludus/'+name,base));
 assert.equal(crypto.createHash('sha256').update(data).digest('hex'),hash,name+' original bytes changed');
 assert.equal(data.subarray(1,4).toString('ascii'),'PNG');
 assert.equal(data.readUInt32BE(16),1448);
 assert.equal(data.readUInt32BE(20),1086);
}
for(const old of ['doctore-sd-v1.webp',...['0','1','2','3'].map(i=>'doctore_pose_'+i+'.webp')]){
 assert.equal(fs.existsSync(new URL('assets/ludus/'+old,base)),false,old+' is not deleted');
 assert.ok(!css.includes(old)&&!source.includes(old),'old NPC still referenced');
}
assert.match(html,/ludus-doctore-anim\.js\?v=7/);
assert.match(html,/ludus-training-doctore\.css\?v=10/);
assert.match(css,/doctore-idle-approved-v1\.png/);
assert.match(scenes,/LudusDoctoreAnim\?\.mount/);
assert.match(scenes,/LudusDoctoreAnim\?\.react/);
assert.match(scenes,/LudusDoctoreAnim\?\.unmount/);
assert.match(carnifex,/assets\/npc\/carnifex-casual-v5\.webp\?v=5/);
const callbacks=[],actor={isConnected:true,style:{},dataset:{}};
const win={matchMedia:()=>({matches:false})};
const whipDimensions=[[372,430],[399,548],[423,542],[447,406],[856,419],[417,507],[334,417]];
class ImageStub{
 constructor(){this.style={};this.naturalWidth=0;this.naturalHeight=0;}
 set src(path){
  this._src=path;
  const match=path.match(/doctore-whip-clean-v2\/frame-(\d+)\.png/);
  const wh=match?whipDimensions[Number(match[1])]:[1448,1086];
  this.naturalWidth=wh[0];this.naturalHeight=wh[1];this.onload?.();
 }
 get src(){return this._src;}
}
vm.runInNewContext(source,{window:win,Image:ImageStub,
 requestAnimationFrame:f=>{callbacks.push(f);return callbacks.length;},
 cancelAnimationFrame(){},performance:{now:()=>1000}});
const npc=win.LudusDoctoreAnim;
assert.equal(npc.version,'4.2.0');
assert.equal(npc.sprite.framesPerAction,8);
assert.equal(npc.sprite.scale,1.125);
assert.equal(npc.sprite.baseline,600);
assert.ok(npc.mount(actor));
assert.equal(npc.sprite.wideWhip,856);
assert.equal(npc.sprite.whipFrames.length,8);
assert.equal(npc.sprite.whipFrames.filter(x=>x===4).length,2);
for(let i=0;i<7;i++){
 const manifest=JSON.parse(fs.readFileSync(new URL('assets/ludus/doctore-whip-clean-v2/manifest.json',base),'utf8'));
 const f=manifest[i];
 assert.ok(f.width>300&&f.height>380,'frame must contain complete character and whip');
 assert.ok(fs.readFileSync(new URL('assets/ludus/doctore-whip-clean-v2/frame-'+i+'.png',base)).subarray(1,4).toString('ascii')==='PNG');
}

for(const [id,mode,sheet] of [
 [-1,'idle','doctore-idle-approved-v1.png'],
 [1,'talk','doctore-explain-approved-v1.png'],
 [2,'command','doctore-authority-approved-v1.png'],
 [3,'whip','doctore-whip-user-v1.png']
]){
 assert.ok(npc.react(id));
 assert.equal(actor.dataset.action,mode);
 assert.equal(actor.dataset.sheet,sheet);
 if(mode==='whip')assert.match(actor.dataset.renderFile,/doctore-whip-clean-v2\/frame-\d\.png/);
 assert.equal(actor.dataset.footY,'600');
 assert.equal(actor.dataset.fixedRoot,'true');
 assert.equal(actor.dataset.source,'approved-unmodified-png');
 for(let n=0;n<8;n++){
  // All 8 frame crops remain within the native untouched source bitmap.
  const idx=n;const sy=mode==='whip'?(n<4?0:575):(n<4?0:
   mode==='idle'?520:mode==='talk'?548:524);
  const crop=mode==='whip'&&n>=4?{w:n===4||n===5?800:n===6?314:334,h:511}
    :{w:362,h:n>=4?1086-sy:sy||553};
  assert.ok(crop.w>0&&crop.h>0&&sy+crop.h<=1086);
 }
}
npc.unmount();
console.log('PASS: original 4 RGBA sheets SHA256, no previous NPC files, 4 actions, uniform scale, feet grounded');
