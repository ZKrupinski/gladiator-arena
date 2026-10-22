/* GLADIATOR ARENA / LUDUS training visual regression.
 * Run: node scripts/qa_training_scale_and_poses.mjs
 * Guarantees stable scaling of 3 differently proportioned frames, and prevents
 * accidental growth-atlas dodge, net or defeat poses being used for drills.
 */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const here=new URL('../public/',import.meta.url);
const training=fs.readFileSync(new URL('ludus-training-runtime.js',here),'utf8');
const game=fs.readFileSync(new URL('index.html',here),'utf8');
const motion=fs.readFileSync(new URL('murmillo-motion-v2.js',here),'utf8');
const css=fs.readFileSync(new URL('ludus-training-runtime.css',here),'utf8');
assert.match(game,/const safePose=kind==='idle'\?0:kind==='hit'\?7:kind==='heavy'\?3:2/);
assert.doesNotMatch(game,/const ids=\{idle:9,slash:2,sweep:3,thrust:4,heavy:5\}/);
assert.doesNotMatch(motion,/thrust:\[9,8,/);
assert.match(css,/width:560px;height:440px/);
const rendered=[];
class FakeCanvas {
 constructor(width=120,height=120){this.width=width;this.height=height;this.lastImage=null}
 getContext(){
  return {
   save(){},restore(){},clearRect(){},translate(){},rotate(){},scale(){},
   drawImage:(img,...values)=>{
    if(values.length<=4){this.lastImage=img;return;}
    rendered.push({name:img.name,source:values.slice(0,4),destination:values.slice(4)});
   },
   getImageData:()=>{
    const data=new Uint8ClampedArray(this.width*this.height*4);
    const image=this.lastImage,box=image?.bbox;
    if(box)for(let y=0;y<this.height;y++)for(let x=0;x<this.width;x++){
     const sx=x*image.width/this.width,sy=y*image.height/this.height;
     if(sx>=box.x&&sx<box.x+box.w&&sy>=box.y&&sy<box.y+box.h){
      data[(y*this.width+x)*4+3]=255;
     }
    }
    return {data};
   }
  };
 }
}
const fakeDocument={createElement:()=>new FakeCanvas(120,120)},window={};
const source=training.replace('window.LudusTrainingV2={mount,stop};',
 'window.LudusTrainingV2={mount,stop};window.__TRAINING_QA__={profileFor,paintTrainingFighter,actionAt};');
vm.runInNewContext(source,{document:fakeDocument,window},{filename:'ludus-training-runtime.js'});
const {profileFor,paintTrainingFighter,actionAt}=window.__TRAINING_QA__;
const canvas=new FakeCanvas(560,440);
const frames=[
 {name:'idle',width:960,height:540,bbox:{x:270,y:55,w:305,h:410}},
 {name:'slash',width:960,height:540,bbox:{x:170,y:80,w:560,h:338}},
 {name:'heavy',width:960,height:540,bbox:{x:230,y:110,w:460,h:300}}
];
const scale=profileFor(canvas,frames[0]);
assert.ok(scale.scale>0.5);
for(let i=0;i<frames.length;i++)paintTrainingFighter(canvas,frames[i],
 i===0?'idle':frames[i].name,.6,scale);
assert.equal(rendered.length,3);
const scales=rendered.map(f=>f.destination[2]/f.source[2]);
for(const value of scales)assert.ok(Math.abs(value-scale.scale)<1e-9,
 'all attack poses must use the EXACT idle/reference scale');
const cycle=Array.from({length:48},(_,i)=>actionAt(i).action);
for(const action of new Set(cycle)){
 assert.ok(['idle','slash','sweep','thrust','heavy'].includes(action),
 'training loop must never request defeat/dodge/hit or death frames');
}
console.log('PASS: fixed idle-based scale, safe growth poses, Doctore-facing canvas, no death animation.');
