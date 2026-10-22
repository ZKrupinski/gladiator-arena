import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const read=n=>fs.readFileSync(new URL('../public/'+n,import.meta.url),'utf8');
const calls=[];const ctx={globalAlpha:1,save(){},restore(){},translate(){},scale(){},clearRect(){},drawImage(...a){calls.push(a)},getImageData(x,y,w,h){return {data:new Uint8ClampedArray(w*h*4)}}};
const document={createElement(){return {width:0,height:0,getContext:()=>ctx}}};
const actions=Object.fromEntries(['idle','walk','attack1','attack2','attack3','attack4','hit','death','roar'].map(a=>[a,a+'.webp']));
class Image{constructor(){this.naturalWidth=40;this.naturalHeight=20}set src(s){this.url=s;queueMicrotask(()=>s.includes('wolf-v3/')?this.onload?.():this.onerror?.())}}
const window={};const sandbox={window,document,Image,URLSearchParams,location:{search:''},console,
 fetch:async url=>({ok:true,json:async()=>url.includes('manifest')?{version:3,actions,normalizedGeometry:true}:{}})};
vm.runInNewContext(read('arena-beasts.js'),sandbox);
const B=window.ArenaBeasts;B.ensure('wolf');
for(let i=0;i<20;i++)await Promise.resolve();
assert.equal(B.status().wolfV3.status,'ready');
calls.length=0;B.portrait('wolf','defeat');
assert.match(calls.at(-1)[0].url,/wolf-v3\/death.webp/);assert.equal(calls.at(-1)[1],30);assert.equal(calls.at(-1)[2],10,'result portrait uses final frame 7');
for(const [pose,file] of [['idle','idle'],['walk','walk'],['roar','roar'],['defeat','death']]){
 calls.length=0;B.draw(ctx,{fighter:{beastType:'wolf',hp:pose==='defeat'?0:1,_beastDeathSince:0},pose,clock:1,x:0,y:0,w:600,h:400});
 assert.match(calls.at(-1)[0].url,new RegExp('wolf-v3/'+file+'\\.webp'));
}
const gallery=read('arena-beast-stage-previews.js');
const start=gallery.indexOf('function paint('),end=gallery.indexOf('function animate(',start);
const previews=[];vm.runInNewContext(gallery.slice(start,end)+";paint(canvas,'wolf',2000);selected='wolf';selectedAt=2000;paint(canvas,'wolf',2400);",{
 root:{ArenaBeasts:{ensure(){},draw(c,args){previews.push(args)}}},selected:null,selectedAt:0,canvas:{width:600,height:400,getContext:()=>ctx},
 loadIdle(){throw Error('Wolf thumbnail must not load legacy frames')},fps:6});
assert.deepEqual(previews.map(p=>p.pose),['idle','roar']);
const root={};vm.runInNewContext(read('arena-entrance.js'),{globalThis:root});
const wolf={beastType:'wolf',x:940,enemy:true,hp:100};const seq=root.ArenaEntrance.begin([wolf]);assert.equal(seq.entries.length,1);
root.ArenaEntrance.advance(seq,root.ArenaEntrance.TIME.run+.2);assert.equal(root.ArenaEntrance.pose(seq,wolf),'roar');assert.ok(wolf._beastRoarProgress>0);
root.ArenaEntrance.advance(seq,2);assert.equal(seq.finished,true);assert.equal(wolf._beastRoarProgress,undefined);
vm.runInNewContext(read('arena-balance.js'),{globalThis:root});const D=root.ArenaBalance.combatDamage;
for(const damage of [17,48,70,3]){assert.ok(D(damage)<damage);assert.ok(D(damage)>=1)}
assert.equal(Math.ceil(138/D(17)),18);assert.equal(Math.ceil(138/17),9);
const html=read('index.html');assert.ok(html.includes('const counterDamage=ArenaBalance.combatDamage('));assert.ok(html.includes('victim.bleedDPS=ArenaBalance.combatDamage('));assert.ok(html.includes('dmg=ArenaBalance.combatDamage(dmg)'));
for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
console.log('PASS: V3 gallery idle/roar, native death frame 7, all render routes, wolf entrance, shared damage pacing; basic-hit KO 9 -> 18 hits at 138 HP.');
