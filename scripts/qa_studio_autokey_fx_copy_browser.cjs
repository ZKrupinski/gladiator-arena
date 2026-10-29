'use strict';
// v129: reproduce screenshot workflow with the UPPER "동작 X/Y" controls.
// Verify timeline/side-list keys and independent all-pose FX-only fan-out.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
(async()=>{
 const server=http.createServer((req,res)=>{
  const file=path.join(process.cwd(),'public',decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}
   const ext=path.extname(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp'})[ext]||'application/octet-stream');res.end(data);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1280,height:960}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/tools/practice-scale-calibrator.html',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.SpartacusScaleStudio&&window.PracticeVisualProfiles&&document.querySelector('#frameXNumber')&&document.querySelector('#bulkCopyAllFx')&&document.querySelector('#grid .card'),null,{timeout:90000});
  const result=await page.evaluate(()=>{
   const $=s=>document.querySelector(s),v=window.PracticeVisualProfiles,app=window.SpartacusScaleStudio;
   const source=$('#actionKey').value,pose=$('#actionPose').value,read=(k,p)=>app.actions()[k]?.[p]||v.resolve(k,p);
   const keyTimes=()=>v.motionKeys(read(source,pose)).map(k=>k.t);
   const input=(sel,value)=>{const e=$(sel);e.value=String(value);e.dispatchEvent(new Event('input',{bubbles:true}));};
   const change=(sel,value)=>{const e=$(sel);e.value=String(value);e.dispatchEvent(new Event('change',{bubbles:true}));};
   const seek=percent=>input('#actionTime',percent);
   const oldKeys=keyTimes(),time=[60.6,24.2,76.4,35.7].find(t=>!oldKeys.some(k=>Math.abs(k-t/100)<.00005));
   if(time===undefined)throw Error('no empty key time');
   seek(time);const cursor=$('#motionKey').value;
   const base=read(source,pose),oldX=Number($('#frameX').value),oldY=Number($('#frameY').value);
   const wantedX=Math.min(180,oldX+11),wantedY=Math.max(-180,oldY-9);
   input('#frameX',wantedX);
   const afterX=keyTimes(),xKey=v.motionKeys(read(source,pose)).find(k=>Math.abs(k.t-time/100)<.00005);
   const afterXUI={marker:document.querySelectorAll('#actionKeyMarkers .timeline-marker').length,
    buttons:document.querySelectorAll('#motionKeyTrack button').length,
    selected:$('#motionKey').value,keyTime:Number($('#motionKeyTime').value),frameX:Number($('#frameX').value)};
   input('#frameYNumber',wantedY);
   const afterYUI={marker:document.querySelectorAll('#actionKeyMarkers .timeline-marker').length,
    buttons:document.querySelectorAll('#motionKeyTrack button').length,
    keyTime:Number($('#motionKeyTime').value),frameY:Number($('#frameY').value)};
   const finalKey=v.motionKeys(read(source,pose)).find(k=>Math.abs(k.t-time/100)<.00005);
   const savedKey=v.motionKeys(v.read()?.[source]?.[pose]).find(k=>Math.abs(k.t-time/100)<.00005);
   const marker=[...document.querySelectorAll('#actionKeyMarkers .timeline-marker')].find(b=>Math.abs(parseFloat(b.style.left)-time)<.01);
   if(!marker)throw Error('no actual timeline marker for the newly authored upper position key');
   seek(2.3);marker.click();
   const clicked={time:Number($('#actionTime').value),right:Number($('#motionKeyTime').value),x:Number($('#motionX').value),y:Number($('#motionY').value)};
   // Author deliberately distinct FX for each pose, with frame-specific
   // values, and a unique destination animation curve which must survive.
   const targetOptions=[...$('#actionKey').options].map(o=>o.value).filter(x=>x!==source&&!x.startsWith('beast_')&&!x.startsWith('npc_'));
   const targets=targetOptions.slice(0,2);if(targets.length<2)throw Error('not enough eligible gladiators');
   change('#actionKey',targets[0]);change('#actionPose','attack');
   seek(29.4);input('#motionX',23.4);
   const original=Object.fromEntries(targets.map(k=>[k,Object.fromEntries(v.ACTIONS.map(p=>[p,v.clean(read(k,p))]))]));
   change('#actionKey',source);
   const fxByPose={};
   for(let i=0;i<v.ACTIONS.length;i++){
    const poseName=v.ACTIONS[i];change('#actionPose',poseName);
    input('#fxX',i*3-19);input('#fxY',17-i);
    input('#fxScale',Math.round((.7+i*.08)*100)/100);
    change('#fxDirection',i%2?'reverse':'follow');
    fxByPose[poseName]={...v.clean(read(source,poseName)).effect};
   }
   for(const target of targets){const c=$('#grid [data-look="'+target+'"] input[type=checkbox]');if(!c)throw Error('missing checkbox for '+target);c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));}
   $('#bulkCopyAllFx').click();
   const copied=Object.fromEntries(targets.map(k=>[k,Object.fromEntries(v.ACTIONS.map(p=>[p,v.clean(read(k,p))]))]));
   const stored=v.read();
   const message=$('#batchActionStatus').textContent;
   // Edit source AGAIN; copied targets must remain isolated from source.
   change('#actionPose','attack');input('#fxX',-77);
   const afterSourceUpdate={...v.clean(read(targets[0],'attack')).effect};
   const singleTarget=targets[1],singleBefore=v.clean(read(singleTarget,'idle'));
   change('#actionPose','idle');input('#fxX',44);
   const oneTargetInput=$('#grid [data-look="'+singleTarget+'"] input[type=checkbox]');
   // Limit next copy to only one target; only active pose effect changes.
   for(const target of targets){let input=$('#grid [data-look="'+target+'"] input[type=checkbox]');input.checked=target===singleTarget;input.dispatchEvent(new Event('change',{bubbles:true}));}
   $('#bulkCopyFx').click();
   const afterOne=v.clean(read(singleTarget,'idle'));
   return {source,pose,oldKeys,time,cursor,base,oldX,oldY,wantedX,wantedY,afterX,xKey,afterXUI,afterYUI,finalKey,savedKey,clicked,
    targets,original,copied,stored,fxByPose,message,afterSourceUpdate,singleBefore,afterOne,oneMessage:$('#batchActionStatus').textContent};
  });
  assert.equal(result.cursor,'cursor','time slider first offers an uncommitted playhead');
  assert.equal(result.afterX.length,result.oldKeys.length+1,'UPPER X creates a new key');
  assert(result.xKey,'upper frame X produces persisted motion key');
  assert.equal(result.xKey.y,Math.round(result.base.motion?result.xKey.y*10:0)/10,'first key carries its Y value too');
  assert.equal(result.afterXUI.marker,result.oldKeys.length+1,'left diamond markers update immediately');
  assert.equal(result.afterXUI.buttons,result.oldKeys.length+1,'right key list updates immediately');
  assert.equal(result.afterXUI.keyTime,result.time);
  assert.equal(result.afterYUI.buttons,result.oldKeys.length+1,'Y edit updates same key, no duplicate');
  assert.equal(result.finalKey.t,result.time/100);
  assert(result.savedKey,'new key persists to local storage');
  assert.equal(result.clicked.time,result.time);
  assert.equal(result.clicked.right,result.time);
  assert.equal(result.clicked.x,result.finalKey.x);
  assert.equal(result.clicked.y,result.finalKey.y);
  assert(result.message.includes('15개 동작')&&result.message.includes('독립 복사'),'all-pose FX-only button acknowledges operation');
  for(const target of result.targets){
   for(const pose of Object.keys(result.fxByPose)){
    const before=result.original[target][pose],after=result.copied[target][pose];
    assert.deepEqual(after.effect,result.fxByPose[pose],target+' '+pose+' FX matches source');
    assert.deepEqual(after.motion,before.motion,target+' '+pose+' motion keys/curve untouched');
    assert.equal(after.x,before.x);assert.equal(after.y,before.y);assert.equal(after.scale,before.scale);
    assert.deepEqual(vClean(result.stored[target][pose]).effect,result.fxByPose[pose],target+' '+pose+' independently saved');
   }
  }
  assert.notEqual(result.afterSourceUpdate.x,-77,'target FX remains unchanged after source edit');
  assert.equal(result.afterOne.effect.x,44,'one-pose FX copy updates only specified target and pose');
  assert.deepEqual(result.afterOne.motion,result.singleBefore.motion,'one-pose copy retains unique character motion');
  assert.deepEqual(errors,[],'no runtime script exceptions');
  console.log('PASS v129: upper frame X/Y produce actual keyed motion, left/right markers and persisted coordinates; all 15 FX copies across two characters preserve independent motion');
  console.log(JSON.stringify({time:result.time,keysBefore:result.oldKeys.length,keysAfter:result.afterX.length,targets:result.targets,fxCopied:15},null,2));
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
 function vClean(p){return p;}
})().catch(err=>{console.error(err);process.exitCode=1});
