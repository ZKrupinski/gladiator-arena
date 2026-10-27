'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/practice-visual-profiles.js','utf8');
const local=new Map(),storage={getItem:key=>local.get(key)||null,
 setItem:(key,value)=>local.set(key,value),removeItem:key=>local.delete(key)};
function profile(published={}){
 const window={SpartacusPublishedActions:published,localStorage:storage,
  PracticeScaleProfiles:{DEFAULTS:{murmillo_a_L1:1,npc_carnifex:1}}};
 vm.runInNewContext(source,{window,console});
 return window.PracticeVisualProfiles;
}
let p=profile();
assert.equal(typeof p.effectGeometry,'function');
const edit=p.clean({x:23,y:-15,scale:1.05,
 effect:{kind:'sweep',x:38,y:20,scale:1.35}});
assert.equal(edit.effect.x,38);
assert.equal(edit.effect.y,20);
assert.equal(edit.effect.scale,1.35);
assert(p.write({murmillo_a_L1:{slash:edit}}));
const s=profile(),reload=s.resolve('murmillo_a_L1','slash');
assert.equal(reload.effect.kind,'sweep','FX kind persists across reload');
assert.equal(reload.effect.x,38,'FX X persists across reload');
assert.equal(reload.effect.y,20,'FX Y persists across reload');
assert.equal(reload.effect.scale,1.35,'FX scale persists across reload');
const x=s.effectGeometry({kind:'sweep',baseX:200,baseY:330,zoom:1,face:1,pose:reload});
assert.deepEqual(JSON.parse(JSON.stringify(x)),{
 kind:'sweep',x:261,y:335,width:655*1.35,height:605*1.35,zoom:1,scale:1.35,face:1
});
const flip=s.effectGeometry({kind:'sweep',baseX:200,baseY:330,zoom:.8,face:-1,pose:reload});
assert(Math.abs(flip.x-(200-(23+38)*.8))<1e-9);
assert(Math.abs(flip.y-(330+(-15+20)*.8))<1e-9);
assert(Math.abs(flip.width-(655*.8*1.35))<1e-9);
const noPose=s.effectGeometry({kind:'sweep',baseX:200,baseY:330,zoom:1,
 face:1,pose:reload,applyPoseOffset:false});
assert.equal(noPose.x,238,'tracked duel effects receive only FX X, not pose X twice');
assert.equal(noPose.y,350,'tracked duel effects receive only FX Y, not pose Y twice');
const practice=fs.readFileSync('public/ludus-practice.js','utf8');
const injected=practice.replace('root.LudusPractice={',
 'root.__fxQA={setBattle:v=>battle=v,setCourts:n=>COURTS=courtsForParty(n),emitVfx,drawVfx};root.LudusPractice={');
assert.notEqual(injected,practice);
const drawArgs=[];
const families=Object.fromEntries(
 ['slash','sweep','thrust','hit','guard','parry','special','finisher'].map(kind=>[kind,{duration:.29}]));
const window={
 PracticeVisualProfiles:s,
 PracticeScaleProfiles:{look:u=>u.look,foot:key=>key==='murmillo_a_L1'?11:0},
 ArenaRasterFX:{FAMILIES:families,draw:(...args)=>{drawArgs.push(args);return true;}},
 LudusBridge:{state:()=>({roster:[]})}
};
vm.runInNewContext(injected,{window,console});
const qa=window.__fxQA;qa.setCourts(4);
const unit={seat:2,side:'ally',look:'murmillo_a_L1',x:440,y:606};
const battle={fx:[],clock:0};qa.setBattle(battle);
qa.emitVfx('slash',unit,null,true);
assert.equal(battle.fx.length,1);
const fx=battle.fx[0],expect=s.effectGeometry({
 kind:'sweep',baseX:unit.x+52*.82,baseY:unit.y+(-113+11)*.82,
 zoom:.82,face:1,pose:reload
});
assert.equal(fx.kind,'sweep','user-selected FX type is applied');
assert.equal(qa.setCourts(4)||window.LudusPractice.rules.courtPerspective(606),.82,'rear PNG effects use the same depth projection as sprites');
assert.equal(fx.x,expect.x,'practice FX X uses exact editor geometry');
assert.equal(fx.y,expect.y,'practice FX Y uses exact editor geometry');
assert.equal(fx.width,expect.width,'practice FX width uses exact editor geometry');
assert.equal(fx.height,expect.height,'practice FX height uses exact editor geometry');
qa.drawVfx(fx);
assert.equal(drawArgs.length,1);
assert.equal(drawArgs[0][2],expect.x);
assert.equal(drawArgs[0][3],expect.y);
assert.equal(drawArgs[0][4],expect.width);
assert.equal(drawArgs[0][5],expect.height);
const normal=fs.readFileSync('public/index.html','utf8');
assert.match(normal,/tool\?\.effectGeometry\?\.\(/,'normal arena uses shared editor FX geometry');
assert.match(normal,/geometry\.width,geometry\.height|fw,fh/,'normal arena renders shared geometry dimensions');
assert(!normal.includes('ORDINARY_ATTACK_FX_BOOST=Object.freeze'),
 'no extra hidden standard sword FX enlargement');
const studio=fs.readFileSync('public/tools/practice-scale-calibrator.html','utf8');
const inline=[...studio.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
 .map(m=>m[1]).find(js=>js.includes('initActionEditor();build();'));
assert(inline);new vm.Script(inline);
assert.match(inline,/function persistActionEdit\(\)/);
assert.match(inline,/actions\[key\]\[pose\]=v\.clean\(cfg\);persistActionEdit\(\)/,
 'FX slider edits save instantly, not only via a separate Save button');
assert.match(inline,/function previewAction\(/);
assert.match(inline,/v\.effectGeometry\(\{/,'studio preview uses same pixel transform as both scenes');
assert.match(inline,/const previewScale=\.52,z=previewScale\*window\.SpartacusStagePreview\.offsetFactor\(key,scene\)/);
assert.match(studio,/id="actionScene"/);
assert.match(studio,/id="actionAutosave"/);
const publisher=fs.readFileSync('public/tools/practice-scale-publish.js','utf8');
assert.match(publisher,/SpartacusPublishedActions=Object\.freeze/,'GitHub publisher saves action FX values');
assert.match(publisher,/studio\(\)\?\.actions\?\.\(\)/);
console.log('PASS: FX X/Y/size reloaded from local storage; shared studio/practice/duel geometry; actual render dimensions; GitHub source publishes actions');
