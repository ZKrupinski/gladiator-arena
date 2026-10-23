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
console.log('PASS: drafts survive reload, expire on changed published values, and migrate legacy saves safely');
