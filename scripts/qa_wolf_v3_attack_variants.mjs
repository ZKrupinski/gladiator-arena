import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const src=readFileSync(new URL('../public/arena-beasts.js',import.meta.url),'utf8');
const context={window:{},console};vm.runInNewContext(src,context);
const api=context.window.ArenaBeasts;assert.ok(api?.wolfActionFor,'Wolf V3 action selector');
const actor={beastType:'wolf',attackVariant:0,actionDuration:1,actionT:.5,face:-1};
for(let index=0;index<3;index++){
 actor.attackVariant=index;
 assert.equal(api.wolfActionFor(actor,'attack'),'attack'+(index+1));
}
assert.equal(api.wolfActionFor(actor,'comboDash'),'attack4');
assert.equal(api.wolfActionFor(actor,'finisher'),'attack4');
assert.equal(api.wolfActionFor(actor,'special'),'roar');
assert.equal(api.wolfActionFor(actor,'hit'),'hit');
assert.equal(api.wolfActionFor(actor,'defeat'),'death');
assert.equal(api.wolfActionFor(actor,'walk'),'walk');
delete actor._beastDeathSince;
assert.equal(api.wolfFrameIndex(actor,'defeat',40),0);
assert.equal(api.wolfFrameIndex(actor,'defeat',40.60),4);
assert.equal(api.wolfFrameIndex(actor,'defeat',42),7);
// If new art is absent, the existing working 40-frame fallback stays intact.
assert.equal(api.status().wolfV3.status,'unrequested');
assert.deepEqual([...api.status().wolfV3.actions],[]);
console.log('WOLF_V3_9_ACTION_MAPPING_AND_FALLBACK_PASS');


// The real game's optional high-res wolf loader must not reuse a stale ?v=1
// asset after the release uploader publishes nine new sheets.
async function checkNativeLoader(width,height,trial=false){
 const requested=[],images=[];
 const actions=['idle','walk','attack1','attack2','attack3','attack4','hit','death','roar'];
 const release='wolf-release-native-v3';
 const dir=trial?'wolf-trial':'wolf-v3';
 const fetchMock=async(url,options={})=>{
  requested.push({url,cache:options.cache});
  if(url==='uploader-release.json')return {ok:true,json:async()=>({
   releaseProtocol:'spartacus-uploader-v1',releaseId:release,
   assetSha256:{['public/assets/beasts/'+dir+'/manifest.json']:'a'.repeat(64)}
  })};
  if(url.startsWith('assets/beasts/'+dir+'/manifest.json'))
   return {ok:true,json:async()=>({version:3,previewOnly:trial,
    actions:Object.fromEntries(actions.map(k=>[k,k+'.webp']))})};
  throw Error('Unexpected fetch '+url);
 };
 class MockImage{
  constructor(){this.naturalWidth=width;this.naturalHeight=height;}
  set src(url){
   images.push(url);
   if(url.startsWith('assets/beasts/'+dir+'/')){
    Promise.resolve().then(()=>this.onload?.());
   }
  }
 }
 const sandbox={window:{},console,fetch:fetchMock,Image:MockImage,
  URLSearchParams,location:{search:trial?'?wolfTrial=1':''}};
 vm.runInNewContext(src,sandbox);
 sandbox.window.ArenaBeasts.ensure('wolf');
 for(let i=0;i<4;i++)await new Promise(resolve=>setImmediate(resolve));
 return {state:sandbox.window.ArenaBeasts.status().wolfV3,requested,images};
}
const valid=await checkNativeLoader(3072,1536);
assert.equal(valid.state.status,'ready');
assert.equal(valid.state.actions.length,9);
assert.ok(valid.requested.some(r=>r.url==='uploader-release.json'&&r.cache==='no-store'));
assert.ok(valid.requested.some(r=>r.url.endsWith('manifest.json?v=wolf-release-native-v3')&&r.cache==='no-store'));
assert.equal(valid.images.filter(url=>url.includes('assets/beasts/wolf-v3/')&&url.includes('.webp?v=wolf-release-native-v3')).length,9);
const legacy=await checkNativeLoader(1672,940);
assert.equal(legacy.state.status,'unavailable','low-res pack must keep legacy fallback');
assert.equal(legacy.state.actions.length,0,'no partially loaded pack');
assert.match(legacy.state.error,/Non-native 4x2 wolf atlas/);
console.log('WOLF_V3_PRODUCTION_CACHE_VERSION_AND_NATIVE_FALLBACK_PASS');

const trial=await checkNativeLoader(1672,940,true);
assert.equal(trial.state.status,'ready','opt-in trial must display actual lower-res art');
assert.equal(trial.state.actions.length,9);
assert.equal(trial.state.trial,true);
assert.ok(trial.images.every(url=>!url.includes('wolf-v3/')),'trial must be isolated');
assert.ok(trial.images.some(url=>url.includes('wolf-trial/idle.webp?v=')));
console.log('WOLF_TRIAL_EXPLICIT_OPT_IN_LOW_RES_ATLAS_PASS');
