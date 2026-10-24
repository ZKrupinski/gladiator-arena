'use strict';
// The effect controls must save immediately, reopen exactly and render at the
// same scene-space dimensions in studio, 1v1 and multi-court practice.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync('public/practice-visual-profiles.js','utf8');
const cells=new Map(),storage={
 getItem:key=>cells.get(key)||null,setItem:(key,value)=>cells.set(key,value),
 removeItem:key=>cells.delete(key)};
const looks={murmillo_champion_red:1,murmillo_a_L1:1,thraex_a_L5:1,
 beast_wolf:1,npc_carnifex:1};
function load(published={}){
 const win={SpartacusPublishedActions:published,localStorage:storage,
  PracticeScaleProfiles:{DEFAULTS:looks}};
 vm.runInNewContext(code,{window:win,console});
 return win.PracticeVisualProfiles;
}
let p=load(),look='murmillo_champion_red';
const edited=p.clean({x:13,y:-9,scale:1.13,effect:{kind:'thrust',x:69,y:-34,scale:1.78}});
assert(p.write({[look]:{slash:edited}}),"artist's effect edits must be written to device");
const stored=JSON.parse(cells.get(p.KEY));
assert.equal(stored.actions[look].slash.effect.x,69);
assert.equal(stored.actions[look].slash.effect.y,-34);
assert.equal(stored.actions[look].slash.effect.scale,1.78);
p=load();
assert.equal(p.resolve(look,'slash').effect.x,69,'device reload remembers effect X');
assert.equal(p.resolve(look,'slash').effect.y,-34,'device reload remembers effect Y');
assert.equal(p.resolve(look,'slash').effect.scale,1.78,'device reload remembers effect scale');
p=load({[look]:{slash:{effect:{kind:'slash',x:3,y:2,scale:1.1}}}});
assert.equal(p.resolve(look,'slash').effect.x,69,
 'a background GitHub publish must not silently delete uncommitted artist work');
const zoom=.8,baseX=260+52*zoom,baseY=448-113*zoom;
const authoring=p.resolve(look,'slash');
const preview=p.effectGeometry({kind:'thrust',baseX,baseY,face:1,zoom,pose:authoring});
assert.equal(preview.kind,'thrust');
assert(Math.abs(preview.x-(baseX+(13+69)*zoom))<1e-8);
assert(Math.abs(preview.y-(baseY+(-9-34)*zoom))<1e-8);
assert(Math.abs(preview.width-710*zoom*1.78)<1e-8);
assert(Math.abs(preview.height-570*zoom*1.78)<1e-8);
const battle=p.effectGeometry({kind:'thrust',baseX:260+52,baseY:448-113,
 face:1,zoom:1,pose:authoring});
assert(Math.abs((preview.x-260)-(battle.x-260)*zoom)<1e-8,
 'studio edit offset uses identical placement after projection');
assert(Math.abs(preview.width/battle.width-zoom)<1e-8);
assert(Math.abs(preview.height/battle.height-zoom)<1e-8);
const mirrored=p.effectGeometry({kind:'thrust',baseX:260-52,baseY:448-113,
 face:-1,zoom:1,pose:authoring});
assert(Math.abs((mirrored.x-260)+(battle.x-260))<1e-8,
 'left-facing opponent flips BOTH default anchor and user FX X');
const html=fs.readFileSync('public/tools/practice-scale-calibrator.html','utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
const inline=scripts.map(x=>x[1]).find(s=>s.includes('initActionEditor();build();'));
assert(inline,'studio editor script must be present');
new vm.Script(inline);
assert.match(inline,/function persistActionEdit\(/,'editor has immediate device persistence');
assert.match(inline,/actions\[key\]\[pose\]=v\.clean\(cfg\);persistActionEdit\(\)/,
 'slider event commits updated values instead of leaving an unsaved draft');
assert.match(inline,/v\.write\(actions\)/,'save uses shared action profile storage');
assert.match(inline,/v\.effectGeometry\(\{/,'preview consumes shared FX dimensions/offsets');
assert.match(html,/id="actionAutosave"/,'show local auto-save state explicitly');
const practice=fs.readFileSync('public/ludus-practice.js','utf8');
assert.match(practice,/settings\?\.effectGeometry\?\.\(\{/,
 'practice mode computes effect XY and size with same helper');
const index=fs.readFileSync('public/index.html','utf8');
assert.match(index,/const geom=tool\?\.effectGeometry\?\.\(\{/,
 'normal arena computes effect geometry with same helper');
assert.doesNotMatch(index,/ORDINARY_ATTACK_FX_BOOST/,
 'no hidden normal-combat 1.6x to 2x weapon-only multiplier');
assert.doesNotMatch(index,/\*1\.20\*normalAttackBoost/,
 'no post-authoring scene-specific second scale');
const publish=fs.readFileSync('public/tools/practice-scale-publish.js','utf8');
assert.match(publish,/SpartacusPublishedActions=Object\.freeze/,
 'GitHub source contains artist FX values as well as actor poses');
const editorVersion=html.match(/practice-visual-profiles\.js\?v=([^"'<>]+)/)?.[1];
const gameVersion=index.match(/practice-visual-profiles\.js\?v=([^"'<>]+)/)?.[1];
assert.equal(gameVersion,editorVersion,'tool and game must load the same FX profile revision');
console.log('PASS: FX X/Y/size automatically saved and retained; one geometry in studio, practice and duel');
