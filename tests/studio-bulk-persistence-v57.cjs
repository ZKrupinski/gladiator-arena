const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('public/practice-visual-profiles.js','utf8'),html=fs.readFileSync('public/tools/practice-scale-calibrator.html','utf8');
const cells=new Map(),base={red:1,a:1,b:1,untouched:1};
function load(){const window={PracticeScaleProfiles:{DEFAULTS:base},localStorage:{getItem:k=>cells.get(k),setItem:(k,v)=>cells.set(k,v)}};vm.runInNewContext(src,{window});return window.PracticeVisualProfiles;}
let v=load();const cfg=v.clean({x:11,scale:1.2,effect:{kind:'thrust',x:7},motion:{keys:[{t:0,x:0,y:0},{t:.234,x:15.6,y:-8.7},{t:.721,x:8,y:2},{t:1,x:0,y:0}],interpolation:'smooth'}});
const target=v.clean({x:42,y:3,scale:1.4,effect:{kind:'sweep',x:19,y:-20,scale:1.8}});
const actions={red:{slash:cfg},a:{slash:target,walk:v.clean({x:18})},b:{attack:target},untouched:{slash:v.clean({y:17})}};
const before=JSON.stringify(actions.untouched),nodes={'#actionKey':{value:'red'},'#actionPose':{value:'slash'},'#batchActionStatus':{}};
const ctx={v,actions,selection:new Set(['red','a','b']),$:id=>nodes[id],currentAction:()=>cfg,persistActionEdit:()=>v.write(actions)};
const start=html.indexOf('function applyActionToChecked('),end=html.indexOf('function initMotionDrag(',start);
vm.runInNewContext(html.slice(start,end)+';this.copy=applyActionToChecked;',ctx);
assert.equal(ctx.copy('motion'),2);
for(const key of ['a','b']){assert.equal(actions[key].slash.motion.keys.length,4);assert.equal(actions[key].slash.motion.interpolation,'smooth');assert.equal(actions[key].slash.motion.keys[1].y,-8.7);assert.equal(actions[key].slash.scale,1.4);assert.equal(actions[key].slash.effect.kind,'sweep');assert.equal(actions[key].slash.x,42);}
assert.equal(actions.a.walk.x,18);assert.equal(JSON.stringify(actions.untouched),before);
let reloaded=load();assert.equal(reloaded.resolve('a','slash').motion.keys[2].t,.721);
const exported=JSON.stringify({actions:v.sanitize(actions)}),imported=v.sanitize(JSON.parse(exported).actions);assert.equal(JSON.stringify(imported),JSON.stringify(v.sanitize(actions)));
// Execute the real GitHub publisher serializer and parser; never call its network writer.
const publisher=fs.readFileSync('public/tools/practice-scale-publish.js','utf8');
const root={PracticeScaleProfiles:{DEFAULTS:base,BASE:base,clamp:n=>n,clampFoot:n=>n},PracticeVisualProfiles:v,SpartacusScaleStudio:{values:()=>base,feet:()=>({}),actions:()=>actions}};
const pctx={root,document:{querySelector:()=>null},JSON,Number,Math,Error};
const source=publisher.slice(publisher.indexOf('function source(){'),publisher.indexOf('function base64('));
const parser=publisher.slice(publisher.indexOf('function valuesFrom('),publisher.indexOf('function currentSnapshot('));
vm.runInNewContext('const studio=()=>root.SpartacusScaleStudio;'+source+parser+';this.make=source;this.parse=valuesFrom;',pctx);
const payload=pctx.make(),parsed=pctx.parse(payload);assert.equal(JSON.stringify(parsed.actions),JSON.stringify(imported));
ctx.copy('effect');assert.equal(actions.a.slash.effect.kind,'thrust');assert.equal(actions.a.slash.motion.keys.length,4,'effect copy preserves timed keys');
ctx.selection=new Set(['red']);assert.equal(ctx.copy('motion'),0);
console.log('PASS: source excluded, checked-only bulk keys/interpolation, independent body/FX/other-pose preservation, reload, JSON roundtrip and actual GitHub payload roundtrip');
