'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const profiles=fs.readFileSync('public/practice-visual-profiles.js','utf8');
const storage=new Map();
function load(published={}){
 const window={SpartacusPublishedActions:published,localStorage:{
  getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),
  removeItem:k=>storage.delete(k)
 },PracticeScaleProfiles:{DEFAULTS:{murmillo_a_L1:1,retiarius_a_L3:1}}};
 vm.runInNewContext(profiles,{window,console});
 return window.PracticeVisualProfiles;
}
let p=load();
assert.deepEqual(Array.from(p.DIRECTIONS),['follow','reverse','right','left']);
for(const mode of p.DIRECTIONS){
 const edit=p.clean({effect:{kind:'hit',x:32,y:-25,scale:1.25,direction:mode}});
 assert(p.write({retiarius_a_L3:{hit:edit}}));
 const reload=load();
 assert.equal(reload.resolve('retiarius_a_L3','hit').effect.direction,mode,'saved '+mode);
 for(const face of [-1,1]){
  const g=reload.effectGeometry({kind:'hit',baseX:400,baseY:500,face,zoom:.7,pose:edit});
  const expect=mode==='reverse'?-face:mode==='left'?-1:mode==='right'?1:face;
  assert.equal(g.face,expect,mode+' face '+face);
  assert.equal(g.x,400+face*32*.7,'offset must remain in facing coordinates');
  assert.equal(g.y,500-25*.7,'vertical placement');
  assert(Math.abs(g.width-480*.7*1.25)<1e-8,'FX zoom');
 }
}
const fallback=p.clean({effect:{kind:'hit',direction:'invalid'}});
assert.equal(fallback.effect.direction,'follow');
const editor=fs.readFileSync('public/tools/practice-scale-calibrator.html','utf8');
const inline=[...editor.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
 .map(m=>m[1]).find(s=>s.includes('initActionEditor();build();'));
assert(inline);
new vm.Script(inline);
for(const key of ['fxDirection','fxPreviewFace','fxX','fxY','fxScale','fxKind'])
 assert(editor.includes('id="'+key+'"'),'studio control '+key);
assert.match(inline,/if\(field==='fxDirection'\)cfg\.effect\.direction=value/);
assert.match(inline,/\['fxKind','fxDirection'\]\.includes\(field\)/);
assert.match(inline,/to\.effect=\{\.\.\.from\.effect\}/,'batch settings retain direction');
assert.match(inline,/c\.scale\(box\.face,1\)/,'preview mirrors actual effect');
assert.match(editor,/id="fxDragMode"/,'sprite/effect drag selector');
assert.match(inline,/drag\.mode==='effect'/,'effect drag has a dedicated branch');
assert.match(inline,/cfg\.effect\.x=Math\.max\(-300/,'effect horizontal drag is clamped');
assert.match(inline,/dx\/\(drag\.z\*drag\.face\)/,'left-facing preview saves correct offset');
assert.match(inline,/cfg\.effect\.y=Math\.max\(-300/,'effect vertical drag is clamped');
assert.match(inline,/persistActionEdit\(\);formatAction\(\);previewAction\(\);return/,'effect drag autosaves');

const publish=fs.readFileSync('public/tools/practice-scale-publish.js','utf8');
assert.match(publish,/visual\?\.sanitize/,'publisher includes orientation in Github serialized settings');
const coop=fs.readFileSync('public/arena-coop.js','utf8');
const practice=fs.readFileSync('public/ludus-practice.js','utf8');
const duel=fs.readFileSync('public/index.html','utf8');
new vm.Script(coop);new vm.Script(practice);
assert.match(coop,/owner=e\.type==='parry'\?\(source\|\|target\):\(target\|\|source\)/);
assert.match(coop,/const bodyX=owner\?owner\.x/,'hit effects follow moving body');
assert.match(coop,/const depth=owner\?perspectiveScale\(owner\.y\):1/,'5v5 camera depth parity');
assert.match(coop,/geometry\?\.face\?\?face/,'5v5 effect facing');
assert.match(practice,/face:geometry\.face/,'practice render effect facing');
assert.match(duel,/geom\?\.face\?\?\(v\.flip\?-1:1\)/,'duel effect facing');
assert.match(duel,/arena-coop\.js\?v=fx-body-facing-v82/);
assert.match(duel,/ludus-practice\.js\?v=fx-body-facing-v82/);
console.log('VFX_FACING_PASS: persistent per-pose direction modes, left/right FX, editor, GitHub publisher, duel/practice/5v5 anchor');
