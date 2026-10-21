/* Strict, headless-independent test for the eight shared beast art families. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../public');
const js=fs.readFileSync(path.join(root,'arena-beast-vfx.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const beast=fs.readFileSync(path.join(root,'arena-beasts.js'),'utf8');
assert.ok(html.includes('arena-beast-vfx.js?v=1'));
assert.ok(html.includes("if(f.beastType&&f.action==='attack')return 'attack'"));
assert.ok(html.includes("beastFx:kind"));
assert.ok(html.includes("beastFx:'collapse'"));
assert.ok(beast.includes("f.action==='special'&&f.actionT>0?'attack4':'roar'"));
// Regression: switching tabs or taking screenshots must NOT leave an
// unrequested "PUGNA SUSPENSA" overlay on the live fight.
const pauseStart=html.indexOf('function suspendBattle(){');
const pauseEnd=html.indexOf('\n}',pauseStart);
assert.ok(pauseStart>0&&pauseEnd>pauseStart);
const pauseSource=html.slice(pauseStart,pauseEnd+2);
for(const initiallyPaused of [false,true]){
 const S={phase:'fight',paused:initiallyPaused,keys:new Set(['left']),
   autoPlaying:true,lastManualInput:0};
 const sandbox={S,clock:45,togglePause(){throw Error('FOCUS_MUST_NOT_TOGGLE_PAUSE')}};
 vm.runInNewContext(pauseSource+';suspendBattle();',sandbox);
 assert.equal(S.paused,initiallyPaused);
 assert.equal(S.keys.size,0);
}
assert.ok(html.includes("beastFx:kind,w:ground?940:bite?790:860"),
  'beast effects must not regress to undersized, body-hidden 520px canvases');
assert.ok(html.includes("layer:'front'"),
  'beast attacks require foreground layers');
const kinds=['claw','sweep','bite','pounce','hit','step','roar','collapse'];
let urls=[];
function mock({fail=false,odd=false}={}){
 const requests=[];
 class Img{
  set src(value){
   urls.push(value);
   this.naturalWidth=odd?65:1776;
   this.naturalHeight=888;
   Promise.resolve().then(()=>this.onload?.());
  }
 }
 const ctx={
  window:{},Image:Img,
  fetch:async (u,opts)=>{
   requests.push({u,opts});
   if(u==='uploader-release.json')return {ok:true,json:async()=>({
      releaseProtocol:'spartacus-uploader-v1',releaseId:'beast-vfx-test-v1',
      assetSha256:{'public/assets/beasts/effects-v1/manifest.json':'a'.repeat(64)}
    })};
   if(fail)return {ok:false};
   return {ok:true,json:async()=>({version:1,grid:[4,2],frames:8,
     families:Object.fromEntries(kinds.map(k=>[k,k+'.webp']))})};
  },
  Promise,Error,Math,Map,Set,Number,Object,String,RegExp
 };
 vm.runInNewContext(js,ctx);
 return {api:ctx.window.ArenaBeastFX,requests};
}
{
 const {api,requests}=mock();
 assert.deepEqual([...api.types],kinds);
 api.ensure();
 for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r));
 const status=api.status();
 assert.equal(status.state,'ready',status.error);
 assert.equal(status.ready.length,8);
 assert.ok(requests.some(x=>x.u==='uploader-release.json'&&x.opts.cache==='no-store'));
 assert.equal(api.frameFor('claw',.9999),7);
 assert.equal(api.frameFor('claw',.12),0);
 assert.equal(api.frameFor('claw',.55),4);
 let calls=[],ops=[];
 const drawCtx={
  globalAlpha:1,
  save(){ops.push('save')},restore(){ops.push('restore')},
  translate(x,y){ops.push(['translate',x,y])},
  scale(x,y){ops.push(['scale',x,y])},
  drawImage(...args){calls.push(args)}
 };
 assert.equal(api.draw(drawCtx,'bite',100,80,450,400,.62,.8,-1),true);
 assert.equal(calls.length,1);
 assert.equal(calls[0].length,9);
 assert.equal(calls[0][1],0); // index 4: first column, second row
 assert.equal(calls[0][2],444);
 assert.ok(ops.some(x=>Array.isArray(x)&&x[0]==='scale'&&x[1]===-1));
 assert.equal(api.draw(drawCtx,'sword',100,80,50,50),false);
}
{
 const {api}=mock({fail:true});api.ensure();
 for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r));
 assert.equal(api.status().state,'unavailable');
}
{
 const {api}=mock({odd:true});api.ensure();
 for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r));
 assert.equal(api.status().state,'unavailable');
 assert.match(api.status().error,/INVALID_4x2_EFFECT_ATLAS/);
}
console.log('BEAST_EIGHT_ACTION_VFX_RUNTIME_AND_SAFE_FALLBACK_PASS');
