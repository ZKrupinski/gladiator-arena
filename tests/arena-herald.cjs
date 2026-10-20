const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'public/arena-herald.css'),'utf8');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const code=fs.readFileSync(path.join(root,'public/arena-herald.js'),'utf8');
const classList=()=>({
 set:new Set(),add(s){this.set.add(s)},remove(s){this.set.delete(s)},
 contains(s){return this.set.has(s)}
});
const children={'.arena-herald-title':{textContent:''},'.arena-herald-subtitle':{textContent:''}};
const node={isConnected:true,hidden:true,dataset:{},classList:classList(),setAttribute(k,v){this[k]=v},
 querySelector(s){return children[s]},get offsetWidth(){return 220}};
const notice={setAttribute(k,v){this[k]=v},removeAttribute(k){delete this[k]}};
const stage={classList:classList(),appendChild(n){this.node=n}};
const document={createElement:()=>node,querySelector:s=>s==='.arena-wrap'?stage:null,
 getElementById:s=>s==='combatNotice'?notice:null};
const sandbox={document,console};
vm.runInNewContext(code,sandbox,{filename:'arena-herald.js'});
const H=sandbox.ArenaHerald;
assert.equal(H.version,'3.0.0');
assert.equal(H.classify('ENEMY PARRY!'),'parry');
assert.equal(H.classify('4 HIT · RUSH BREAK!'),'rush');
assert.equal(H.classify('BOSS · SECOND WIND!'),'boss');
assert.equal(H.classify('PAUSED'),'paused');
assert.equal(H.classify('some unseen alert'),'notice');
assert.equal(H.sync('PUGNA!',{phase:'fight'}),true);
assert.equal(children['.arena-herald-title'].textContent,'PUGNA INCIPIT');
assert.equal(node.dataset.length,'normal');
assert.equal(node.hidden,false);
assert.equal(node['aria-hidden'],'false');
assert.equal(stage.classList.contains('arena-herald-mode'),true);
assert.equal(notice['aria-hidden'],'true');
assert.equal(H.visible(),true);
const id=children['.arena-herald-title'].textContent;
H.sync('PUGNA!',{phase:'fight'});
assert.equal(children['.arena-herald-title'].textContent,id);
H.sync('PRODEAT GLADIATOR',{phase:'fight',lineup:true});
assert.ok(children['.arena-herald-subtitle'].textContent);
H.sync('AN UNKNOWN HINT',{phase:'fight'});
assert.equal(children['.arena-herald-title'].textContent,'NUNTIUS ARENAE');
assert.equal(children['.arena-herald-subtitle'].textContent,'AN UNKNOWN HINT');
H.sync('4 HIT · LEAP RUSH!',{phase:'fight'});
assert.equal(node.dataset.tone,'ember');
H.sync('',{phase:'fight'});
assert.equal(H.visible(),false);
H.sync('PAUSED',{phase:'fight'});
assert.equal(children['.arena-herald-title'].textContent,'PUGNA SUSPENSA');
H.sync('RESUME',{phase:'fight'});
assert.equal(children['.arena-herald-title'].textContent,'PUGNA REDIIT');
H.sync('',{phase:'title'});
assert.equal(stage.classList.contains('arena-herald-mode'),false);
assert.equal(notice['aria-hidden'],undefined);
const calls=[];
const ctx={save(){calls.push('save')},restore(){calls.push('restore')},
 fillText(s){calls.push('fill:'+s)},strokeText(s){calls.push('stroke:'+s)}};
assert.equal(H.drawCanvasCallout(ctx,'CONTRA!',300,250,{tone:'gold'}),true);
assert.equal(H.drawCanvasCallout(ctx,'FRVSTRA!',700,250,{tone:'iron'}),true);
assert.equal(H.drawCanvasCallout(ctx,'IMPETUS',640,95,{subtitle:'RUSH IMPACT'}),true);
assert.ok(calls.includes('fill:CONTRA!')&&calls.includes('fill:FRVSTRA!')&&calls.includes('fill:RUSH IMPACT'));
assert.ok(html.includes("arena-herald.css?v=3")&&html.includes("arena-herald.js?v=3"));
assert.ok(html.includes("ArenaHerald?.drawCanvasCallout?.(ctx,'CONTRA!'"));
assert.ok(html.includes("ArenaHerald?.drawCanvasCallout?.(ctx,'IMPETUS'"));
assert.ok(css.includes('[data-length="long"]')&&css.includes('prefers-reduced-motion'));
console.log('PASS: identical Roman herald frame in duel and gauntlet, dynamic notice sizing, pause and fallback, canvas parry/rush typography, accessibility, reset.');
