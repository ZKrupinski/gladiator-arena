import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const p=await b.newPage({viewport:{width:1280,height:860},deviceScaleFactor:1});
const errors=[];p.on('pageerror',e=>errors.push(String(e)));
try{
 await p.goto('http://127.0.0.1:8765/?__arena_qa=1',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.ArenaRasterFX?.ready?.('combat')&&window.ArenaRasterFX?.ready?.('victory'),{timeout:25000});
 const output=await p.evaluate(async()=>{
   const fx=window.ArenaRasterFX,detail={};
   for(const name of ['combat','victory']){
     const img=await fetch(fx.SOURCE[name]).then(r=>r.blob());
     const raw=await img.arrayBuffer();
     const magic=[...new Uint8Array(raw.slice(0,8))].join(',');
     if(magic!=='137,80,78,71,13,10,26,10')throw Error('NOT PNG '+name);
     const size=img.size;
     const sample=[];
     for(let f=0;f<8;f++){
       const c=document.createElement('canvas');c.width=480;c.height=480;
       const ctx=c.getContext('2d',{willReadFrequently:true});
       const progress=(f+.5)/8;
       fx.draw(ctx,name,240,240,480,480,progress,1,1);
       const pixels=ctx.getImageData(0,0,480,480).data;
       let signature=0,alpha=0,weight=0,xweight=0;
       for(let y=0;y<480;y+=4)for(let x=0;x<480;x+=4){
         const i=(y*480+x)*4;
         const a=pixels[i+3];if(a<13)continue;
         alpha++;weight+=a;xweight+=x*a;
         signature=(Math.imul(signature,33)+pixels[i]+(pixels[i+1]<<1)+a)>>>0;
       }
       sample.push({signature,alpha,meanX:xweight/weight});
     }
     detail[name]={png:true,bytes:size,sample,meta:fx.inspect(name,.52)};
   }
   const mirrors={};
   for(const kind of ['combat','victory']){
    const out=[];
    for(const face of [1,-1]){
      const c=document.createElement('canvas');c.width=640;c.height=600;
      fx.draw(c.getContext('2d'),kind,320,300,530,500,.46,1,face);
      const d=c.getContext('2d').getImageData(0,0,640,600).data;
      let weighted=0,weightedX=0;
      for(let y=0;y<600;y+=3)for(let x=0;x<640;x+=3){
       const a=d[(y*640+x)*4+3];weighted+=a;weightedX+=a*x;
      }
      out.push(weightedX/weighted);
    }
    mirrors[kind]=out;
   }
   let petalStats={pixels:0,differentFromBase:false};
   const back=document.createElement('canvas'),front=document.createElement('canvas');
   for(const c of [back,front]){c.width=480;c.height=480;}
   fx.draw(back.getContext('2d'),'victory',240,240,480,480,.37,1,1,0,'back');
   fx.draw(front.getContext('2d'),'victory',240,240,480,480,.37,1,1,0,'front');
   const base=back.getContext('2d').getImageData(0,0,480,480).data;
   const petals=front.getContext('2d').getImageData(0,0,480,480).data;
   for(let i=3;i<petals.length;i+=4){if(petals[i]>15)petalStats.pixels++;if(base[i]!==petals[i])petalStats.differentFromBase=true;}
   return {status:fx.status(),detail,mirrors,petalStats,hasGameQA:!!window.__arenaQA,
    legacyStillPresent:!!window.ArenaAnimatedFX?.available?.('parry')};
 });
 assert.equal(output.status.version,'2.0.0-png');
 assert.equal(output.status.failures,0);
 assert.equal(output.hasGameQA,true,'actual arena game loaded');
 assert.equal(output.legacyStillPresent,true,'existing distinct painted parry preserved');
 for(const name of ['combat','victory']){
   const d=output.detail[name];
   assert.equal(d.png,true);
   assert.equal(d.meta.frames,8);
   assert.deepEqual(d.meta.nativeImageSize,[1920,960]);
   assert.ok(d.bytes>500000,'actual full-resolution painted PNG, not tiny vector proxy');
   assert.equal(new Set(d.sample.map(s=>s.signature)).size,8,'all 8 original-painted frames visibly distinct');
   assert.ok(d.sample.every(s=>s.alpha>125),name+' sprite cells must have transparent paint');
   assert.ok(Math.abs(output.mirrors[name][0]+output.mirrors[name][1]-639)<4,'facing directions must truly mirror the original PNG');
 }
 assert.ok(output.petalStats.pixels>150,'actual painted front petals extracted from victory PNG');
 assert.ok(output.petalStats.differentFromBase,'front petal layer cannot repaint the entire winner sprite');
 assert.deepEqual(errors,[],'no JS errors on game boot');
 console.log('APPROVED_8FRAME_RASTER_PNG_GAMEPASS '+JSON.stringify({
  version:output.status.version,combat:output.detail.combat.bytes,victory:output.detail.victory.bytes,
  frames:output.detail.combat.sample.length+output.detail.victory.sample.length,
  mirrored:output.mirrors,petals:output.petalStats.pixels
 }));
}finally{await b.close()}
