import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const src=readFileSync(new URL('../public/sprite-motion-registry.js',import.meta.url),'utf8');
const context={console};context.globalThis=context;
context.Image=class MockImage{
 constructor(){this.naturalWidth=512;this.naturalHeight=512;}
 set src(s){this._src=s;queueMicrotask(()=>this.onload?.());}
 get src(){return this._src;}
};
vm.runInNewContext(src,context);
const r=context.SpriteMotionRegistry;
assert.equal(r.CORE.length,9);
for(const kind of r.BEASTS){const p=r.describe(kind);
 assert.equal(p.core.length,9);
 assert.equal(p.extras[0].name,'roar');
 assert.equal(p.extras[0].status,'awaiting_art');
}
assert.equal(r.canRoar('wolf'),false,'no real roar without art');
assert.equal(r.triggerStandoffRoar({beastType:'wolf',x:0,cfg:{reach:90}},{x:600,cfg:{reach:90}},30,.05,()=>0),false,'missing art cannot masquerade as roar');
assert.throws(()=>r.registerExtra('wolf',{name:'attack',paths:['foo.png']}),/eight/i);
assert.throws(()=>r.registerExtra('wolf',{name:'roar',paths:Array(8).fill('https://untrusted.com/image.png')}),/eight local/i);
r.registerExtra('wolf',{name:'roar',paths:Array.from({length:8},(_,i)=>'assets/beasts/special/wolf/roar/'+String(i).padStart(2,'0')+'.png')});
assert.equal(await r.loadExtra('wolf','roar'),true);
assert.equal(r.hasExtra('wolf','roar'),true);
assert.equal(r.getExtraFrames('wolf','roar').length,8);
const f={beastType:'wolf',cfg:{reach:80},x:200,vx:0,actionT:0,stagger:0,guard:false,knockT:0,comboDash:null};
const enemy={x:700,vx:0,cfg:{reach:60}};
assert.equal(r.triggerStandoffRoar(f,enemy,21,.1,()=>0),true);
assert.equal(r.overridePose(f,'idle',21.3),'special');
assert.equal(r.overridePose(f,'walk',21.3),'special');
assert.equal(r.overridePose(f,'attack',21.3),'attack','cannot override live attack');
assert.equal(r.triggerStandoffRoar(f,enemy,21.4,.1,()=>0),false,'cooldown');
assert.equal(r.overridePose(f,'idle',23),'idle','roar expires');
f.guard=true;assert.equal(r.overridePose(f,'guard',21.3),'guard');
f.guard=false; f.stagger=2;assert.equal(r.triggerStandoffRoar(f,enemy,35,.1,()=>0),false);
r.registerExtra('retiarius',{name:'net_taunt',paths:Array.from({length:8},(_,i)=>'assets/extra/retiarius/taunt'+i+'.webp')});
assert.equal(r.describe('retiarius').extras[0].name,'net_taunt');
console.log('SPRITE_MOTION_REGISTRY_CORE9_OPTIONAL_ROAR_GATES_PASS');
