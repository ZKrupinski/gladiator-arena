'use strict';
// Browser regression for real artist UI: left scrub time is the source of truth.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
(async()=>{
 const server=http.createServer((req,res)=>{
  const f=path.join(process.cwd(),'public',decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  fs.readFile(f,(err,data)=>{if(err){res.writeHead(404);res.end();return;}
   const ext=path.extname(f);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp'})[ext]||'application/octet-stream');res.end(data);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1280,height:960}}),errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/tools/practice-scale-calibrator.html',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.SpartacusScaleStudio&&document.querySelector('#motionXNumber')&&document.querySelector('#actionKey').options.length>0,null,{timeout:90000});
  const result=await page.evaluate(()=>{
   const $=s=>document.querySelector(s),v=window.PracticeVisualProfiles,app=window.SpartacusScaleStudio;
   const actor=$('#actionKey').value,pose=$('#actionPose').value;
   const read=()=>v.motionKeys(app.actions()[actor]?.[pose]||v.resolve(actor,pose));
   const initial=read(),count=initial.length;
   const seek=percent=>{$('#actionTime').value=String(percent);$('#actionTime').dispatchEvent(new Event('input',{bubbles:true}));};
   const input=(id,value)=>{const el=$(id);el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));};
   const findGap=blocked=>[13.7,23.1,33.4,37.6,67.8,89.9,93.2,4.4].find(t=>!blocked.some(k=>Math.abs(k.t-t/100)<.0001));
   const first=findGap(initial);if(first===undefined)throw Error('No free test key time');
   seek(first);
   const cursorMode=$('#motionKey').value;
   const oldAtCursor={x:Number($('#motionX').value),y:Number($('#motionY').value)};
   const newX=Math.min(150,oldAtCursor.x+12),newY=Math.max(-150,oldAtCursor.y-7);
   input('#motionX',newX);input('#motionY',newY);
   const after=read(),created=after.find(k=>Math.abs(k.t-first/100)<.00001);
   const marker=$('#actionKeyMarkers .timeline-marker[aria-pressed="true"]');
   const right={key:$('#motionKey').value,time:Number($('#motionKeyTime').value),x:Number($('#motionX').value),y:Number($('#motionY').value)};
   const originalPreserved=initial.every(k=>after.some(c=>c.t===k.t&&c.x===k.x&&c.y===k.y));
   const markerCount=document.querySelectorAll('#actionKeyMarkers .timeline-marker').length;
   const markerAtTime=[...document.querySelectorAll('#actionKeyMarkers .timeline-marker')].find(b=>Math.abs(parseFloat(b.style.left)-first)<.01);
   // A different timeline location + numeric field must create ANOTHER key.
   const second=findGap(after);seek(second);
   const looseBefore=$('#motionKey').value;
   const secondX=Number($('#motionXNumber').value)+8;
   input('#motionXNumber',secondX);
   const afterNumber=read(),createdNumber=afterNumber.find(k=>Math.abs(k.t-second/100)<.00001);
   markerAtTime.click();
   const clicked={time:Number($('#actionTime').value),keyTime:Number($('#motionKeyTime').value),
    x:Number($('#motionX').value),y:Number($('#motionY').value),selected:$('#motionKey').value,
    marker:[...document.querySelectorAll('#actionKeyMarkers .timeline-marker')].filter(x=>x.getAttribute('aria-pressed')==='true').length};
   return {actor,pose,count,first,second,cursorMode,looseBefore,initial,oldAtCursor,after,created,
    markerCount,markerSelected:!!marker,markerAtTime:!!markerAtTime,right,originalPreserved,
    createdNumber,afterNumber,clicked,expected:{x:newX,y:newY}};
  });
  assert.equal(result.cursorMode,'cursor','scrub to unkeyed time displays an uncommitted cursor');
  assert.equal(result.looseBefore,'cursor','second scrub displays uncommitted cursor');
  assert(result.originalPreserved,'existing artist keys must remain untouched');
  assert.equal(result.after.length,result.count+1,'X and Y edits at same time create exactly one key');
  assert(result.created,'new key created at scrubbed playhead');
  assert(Math.abs(result.created.x-result.expected.x)<.0001);
  assert(Math.abs(result.created.y-result.expected.y)<.0001);
  assert.equal(result.right.time,result.first,'right key time follows left scrub after edits');
  assert.equal(result.right.x,result.expected.x);
  assert.equal(result.right.y,result.expected.y);
  assert(result.markerSelected,'a selected marker appears below timeline');
  assert(result.markerCount===result.count+1,'every key appears under timeline');
  assert(result.createdNumber,'numeric X input creates new key at second scrub position');
  assert.equal(result.afterNumber.length,result.count+2);
  assert.equal(result.clicked.time,result.first,'clicking marker seeks timeline');
  assert.equal(result.clicked.keyTime,result.first,'clicking marker updates right key time');
  assert.equal(result.clicked.x,result.expected.x);
  assert.equal(result.clicked.y,result.expected.y);
  assert.equal(result.clicked.marker,1,'only the clicked marker is selected');
  assert.deepEqual(errors,[],'no uncaught exceptions during motion editing');
  console.log('PASS: left scrub auto-key X/Y sliders + numeric edit, original keys safe, visible clickable markers synchronize time and right editor');
  console.log(JSON.stringify({actor:result.actor,pose:result.pose,initialCount:result.count,newTimes:[result.first,result.second],
   firstKey:result.created,numberKey:result.createdNumber,clicked:result.clicked},null,2));
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
