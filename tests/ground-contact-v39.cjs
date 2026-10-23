const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const base='public/';
let call;
const ctx={globalAlpha:1,save(){},restore(){},translate(){},scale(){},transform(){},drawImage(...v){call=v}};
const champ=fs.readFileSync(base+'champion-murmillo.js','utf8');
const paint=champ.slice(champ.indexOf('function paint('),champ.indexOf('function draw(ctx,options)'));
vm.runInNewContext(paint+';paint(ctx,frame,0,0,348,348,false,1)',{ctx,frame:{canvas:{width:960,height:540},pivotX:480,footY:512}});
assert(Math.abs(call[2]+512*call[4]/540-348)<1e-8);
assert.equal(call[4],348);assert(!champ.includes('f.championBoss?1.07:1'));
const beasts=fs.readFileSync(base+'arena-beasts.js','utf8');
const window={PracticeScaleProfiles:{scale:()=>1,footY:im=>im.toe}};
const exposed=beasts.replace('root.ArenaBeasts={','root.__frames=cache;root.__wolf=wolfV3;root.ArenaBeasts={');
vm.runInNewContext(exposed,{window,console,URLSearchParams});
window.__wolf.state='error';
for(const [type,toe] of [['leopard',427],['tiger',437],['lion',455],['elephant',426]]){
 const im={naturalWidth:512,naturalHeight:512,toe};
 window.__frames.set(type,{ready:true,individual:new Map([['idle:0',im]])});
 assert(window.ArenaBeasts.draw(ctx,{fighter:{beastType:type},x:0,y:0,w:348,h:348,clock:0}));
 assert(Math.abs(call[2]+toe*call[4]/512-348)<1e-8,type+' feet');
 assert(Math.abs(call[3]-348*.83*window.ArenaBeasts.types[type].scale)<1e-8,type+' one species scale');
 assert.equal(call[3],call[4],type+' uniform proportions');
}
assert(beasts.includes('const WOLF_PAW_RAISE=0'));
console.log('PASS: champion and four beasts share exact floor contact; no boss boost; uniform calibrated sizes');
