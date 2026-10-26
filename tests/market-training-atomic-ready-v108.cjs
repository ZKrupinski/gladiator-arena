'use strict';
/* Native-image readiness QA for MERCATUS and EXERCITIUM v108. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..','public');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const market=read('market-scene.js'),approved=read('ludus-approved-scenes.js');
const mc=read('market-scene.css'),ac=read('ludus-approved-scenes.css'),html=read('index.html');
new Function(market);new Function(approved);
for(const [code,name] of [[market,'market'],[approved,'approved']]){
 assert(code.includes("requestAnimationFrame(()=>requestAnimationFrame(()=>{"),name+' needs double paint-frame readiness');
 assert(code.includes("epoch!=="),name+' must guard stale navigation');
 assert(code.includes('clearTimeout(timeoutId);'),name+' must cancel only its own timeout');
 assert(code.includes('25000'),name+' must offer recoverable load timeout');
 assert(code.includes("data-retry"),name+' must allow failed art retry');
 assert(code.includes("data-back"),name+' must allow backing out while loading');
 assert(code.includes("assetsReady?.()"),name+' must await shared roster sprite assets');
}
assert(market.includes("...merchantFrames].map(marketAsset)"));
assert(market.includes("$('#gmKey'),$('#gmMerchantMain')"));
assert(market.includes("scene.classList.add('gm-display-ready')"));
assert(market.includes("sceneEpoch++"));
assert(approved.includes("trainingIdleImage.src='assets/ludus/doctore-idle-approved-v1.png?approved=3'"));
assert(approved.includes("imgs=[$('.la-key')]"));
assert(approved.includes("screen.classList.add('la-display-ready')"));
assert(approved.includes('approvedEpoch++'));
assert(mc.includes('.gm-screen:not(.gm-display-ready) .gm-stage{visibility:hidden!important'));
assert(ac.includes('.la-screen:not(.la-display-ready) .la-stage{visibility:hidden!important'));
assert(html.includes("assetsReady:()=>growthLoading||loadGrowthAtlases()"));
for(const pathname of ['market-scene.js','market-scene.css','ludus-approved-scenes.js','ludus-approved-scenes.css']){
 assert(html.includes(pathname+'?v=atomic-market-training-v108-20261027'),pathname+' cache updated');
}
function getFn(code,start,end){
 const first=code.indexOf(start),last=code.indexOf(end,first);
 assert(first>=0&&last>first,start+' missing');
 return new Function('return ('+code.slice(first,last).trim()+')')();
}
const getMarket=getFn(market,'function marketAsset(img){','async function prepareMarket(epoch){');
const getApproved=getFn(approved,'function approvedAsset(img){','async function prepareApproved(epoch){');
async function scenario(waitAsset){
 let onload,decode,settled=false;
 const img={src:'test.png',complete:false,naturalWidth:0,
  addEventListener(name,fn){if(name==='load')onload=fn;},
  decode(){return new Promise(resolve=>{decode=resolve;});}};
 const p=waitAsset(img).then(()=>{settled=true;});
 await Promise.resolve();assert(!settled,'pending image must not reveal scene');
 img.complete=true;img.naturalWidth=256;onload();
 await Promise.resolve();assert(!settled,'loaded but undecoded bitmap must remain hidden');
 decode();await p;assert(settled);
 await assert.rejects(()=>waitAsset({src:'x',complete:true,naturalWidth:0}),/failed/);
}
Promise.all([scenario(getMarket),scenario(getApproved)]).then(()=>{
 console.log('MARKET_TRAINING_ATOMIC_READY_PASS: art decode, assets, stale-navigation gate, cancel/retry, cache');
}).catch(e=>{console.error(e);process.exitCode=1;});
