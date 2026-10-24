const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('public/practice-visual-profiles.js','utf8'),cells=new Map();
function load(){const window={PracticeScaleProfiles:{DEFAULTS:{red:1}},localStorage:{getItem:k=>cells.get(k),setItem:(k,v)=>cells.set(k,v)}};vm.runInNewContext(src,{window});return window.PracticeVisualProfiles;}
let p=load();
const keys=[{t:0,x:0,y:0},{t:.123,x:15.2,y:-10.8},{t:.24,x:30.1,y:-20},{t:.72,x:40,y:10},{t:1,x:0,y:0}];
const cfg=p.clean({motion:{keys,interpolation:'smooth'}});
for(const k of keys){const out=p.sampleMotion(cfg,k.t);assert.equal(out.x,k.x);assert.equal(out.y,k.y);}
for(let i=0;i<keys.length-1;i++)for(let n=0;n<100;n++){
 const a=keys[i],b=keys[i+1],q=p.sampleMotion(cfg,a.t+(b.t-a.t)*n/100);
 for(const axis of ['x','y'])assert(q[axis]>=Math.min(a[axis],b[axis])-.001&&q[axis]<=Math.max(a[axis],b[axis])+.001,'smooth path must not overshoot');
}
const t=.123,e=.002,left=(p.sampleMotion(cfg,t).x-p.sampleMotion(cfg,t-e).x)/e,right=(p.sampleMotion(cfg,t+e).x-p.sampleMotion(cfg,t).x)/e;
assert(Math.abs(left-right)<4,'continuous velocity through monotonic key');
p.write({red:{slash:cfg}});p=load();assert.equal(p.resolve('red','slash').motion.keys.length,5);assert.equal(p.resolve('red','slash').motion.keys[1].y,-10.8);
assert.equal(p.resolve('red','slash').motion.interpolation,'smooth');
const many=Array.from({length:201},(_,i)=>({t:i/200,x:i%50,y:0}));assert.equal(p.cleanMotion({keys:many}).keys.length,201,'no fixed key-count cap');
const one={motion:{keys:[{t:.4,x:12.3,y:4.5}]}};assert.equal(p.sampleMotion(one,0).x,12.3);assert.equal(p.sampleMotion(one,1).y,4.5);
const legacy={motion:{start:{x:0},middle:{x:50},end:{x:0}}};assert.equal(p.sampleMotion(legacy,.25).x,25,'legacy interpolation unchanged');
assert.equal(p.sampleMotion({motion:{keys:[{t:0,x:0},{t:1,x:100}],interpolation:'linear'}},.2).x,20);
console.log('PASS: unlimited timed keys, precise coordinates, exact interpolation, no overshoot, continuous tangents, reload, one-key hold and legacy compatibility');
