const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync('public/practice-scale-profiles.js','utf8');
let stored=null;
function load(published={}){
 const window={SpartacusPublishedScales:published,localStorage:{getItem:()=>stored,setItem:(k,v)=>stored=v,removeItem:()=>stored=null}};
 vm.runInNewContext(code,{window});return window.PracticeScaleProfiles;
}
let p=load();p.write({beast_wolf:1.3});
assert.equal(load().scale('beast_wolf'),1.3);
p=load({beast_wolf:.9});assert.equal(p.scale('beast_wolf'),.9);
p.write({beast_wolf:1.1});assert.equal(load({beast_wolf:.9}).scale('beast_wolf'),1.1);
assert.equal(load({beast_wolf:1.2}).scale('beast_wolf'),1.2);
stored=JSON.stringify({version:32,overrides:{beast_wolf:1.8}});
assert.equal(load({beast_wolf:1.2}).scale('beast_wolf'),1.2);
assert.equal(load().scale('beast_wolf'),1.8);
// Changing one published gladiator must not discard draft sizes of ALL others.
stored=null;
p=load({murmillo_champion_red:1.507175});
p.write({murmillo_champion_red:1.65,thraex_a_L3:1.12,beast_wolf:1.25});
const revised=load({murmillo_champion_red:1.16});
assert.equal(revised.scale('murmillo_champion_red'),1.16,'new published size takes precedence over old champion draft');
assert.equal(revised.scale('thraex_a_L3'),1.12,'unrelated gladiator draft survives published champion correction');
assert.equal(revised.scale('beast_wolf'),1.25,'unrelated beast draft survives published champion correction');
console.log('PASS: drafts survive reload and per-look source updates without wiping unrelated edits');
