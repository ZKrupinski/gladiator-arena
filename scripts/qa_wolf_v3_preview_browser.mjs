import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1200,height:760}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto('http://127.0.0.1:8765/?__arena_qa=1&wolfPreview=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.ArenaBeasts?.installWolfPreviewAtlasPack&&!!window.__arenaQA?.state,{timeout:20000});
 const data=await page.evaluate(()=>{
  const keys=['idle','walk','attack1','attack2','attack3','attack4','hit','death','roar'];
  const c=document.createElement('canvas');c.width=1200;c.height=650;
  const x=c.getContext('2d');x.fillStyle='#efa869';x.fillRect(100,100,500,300);
  x.fillStyle='#68301d';x.fillRect(200,200,270,125);
  const raw=c.toDataURL('image/webp',.85);
  return Object.fromEntries(keys.map(k=>[k,raw]));
 });
 const ready=await page.evaluate(async pack=>{
  const ok=await ArenaBeasts.installWolfPreviewAtlasPack(pack);
  return {ok,status:ArenaBeasts.status().wolfV3};
 },data);
 assert.equal(ready.ok,true,'nine-frame atlas preview installed');
 assert.equal(ready.status.status,'ready');
 assert.equal(ready.status.actions.length,9);
 const result=await page.evaluate(()=>{
  const actor={beastType:'wolf',attackVariant:1,actionT:.2,actionDuration:.4};
  const c=document.createElement('canvas');c.width=700;c.height=530;
  const ctx=c.getContext('2d'),ok=ArenaBeasts.draw(ctx,{fighter:actor,pose:'attack',clock:10,x:50,y:50,w:450,h:350});
  const pixels=ctx.getImageData(0,0,700,530).data;
  let n=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>30)n++;
  return {ok,n,action:ArenaBeasts.wolfActionFor(actor,'attack'),four:ArenaBeasts.wolfActionFor(actor,'comboDash')};
 });
 assert.equal(result.ok,true);
 assert.ok(result.n>1000,'actual canvas draw should be opaque');
 assert.equal(result.action,'attack2');assert.equal(result.four,'attack4');
 // Browser message pathway: attach a real child game and post 9 images.
 await page.setContent('<iframe src="http://127.0.0.1:8765/?__arena_qa=1&wolfPreview=1" id="child" style="width:900px;height:600px"></iframe>');
 await page.waitForFunction(()=>document.querySelector('#child')?.contentWindow?.ArenaBeasts?.installWolfPreviewAtlasPack,{timeout:20000});
 const msgStatus=await page.evaluate(async pack=>{
  const f=document.querySelector('#child');
  const status=await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(Error('No diagnostic pack acknowledgement')),15000);
   const listener=e=>{
    if(e.data?.type==='gladiator:wolf-preview-status'){
     clearTimeout(timeout);window.removeEventListener('message',listener);resolve(e.data);
    }
   };
   window.addEventListener('message',listener);
   f.contentWindow.postMessage({type:'gladiator:wolf-preview-pack',actions:pack},'*');
  });
  return status;
 },data);
 assert.equal(msgStatus.ready,true);
 assert.equal(msgStatus.actions.length,9);
 assert.deepEqual(errors,[]);
 console.log('WOLF_V3_LIVE_GAME_PREVIEW_BRIDGE_PASS');
}finally{await browser.close();}
