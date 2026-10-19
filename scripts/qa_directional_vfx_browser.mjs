import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:930},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto('http://127.0.0.1:8765/?__arena_qa=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.ArenaDirectionalFX&&!!window.__arenaQA,{timeout:25000});
 const result=await page.evaluate(()=>{
  const fx=window.ArenaDirectionalFX,kinds=Object.keys(fx.FAMILIES);
  const details={};
  for(const kind of kinds){
   const seen=new Set(),coverage=[];
   for(let frame=0;frame<8;frame++){
    const item=fx.inspect(kind,frame);
    if(!item)throw Error(kind+': missing frame '+frame);
    if(item.frames!==8||item.width!==480||item.height!==480)throw Error(kind+': wrong 8-frame spec');
    const c=item.canvas.getContext('2d'),img=c.getImageData(0,0,480,480).data;
    let signature=0,n=0;
    for(let i=0;i<img.length;i+=320){
     if(img[i+3]>15){n++;signature=(Math.imul(signature,31)+img[i]+img[i+1]*2+img[i+3])>>>0;}
    }
    seen.add(signature);coverage.push(n);
   }
   details[kind]={unique:seen.size,coverage};
  }
  function mirror(kind){
   const left=document.createElement('canvas'),right=document.createElement('canvas');
   for(const c of [left,right]){c.width=580;c.height=510}
   fx.draw(right.getContext('2d'),kind,290,255,470,450,.42,1,+1);
   fx.draw(left.getContext('2d'),kind,290,255,470,450,.42,1,-1);
   const a=right.getContext('2d').getImageData(0,0,580,510).data;
   const b=left.getContext('2d').getImageData(0,0,580,510).data;
   let massRight=0,massLeft=0,weightR=0,weightL=0;
   for(let y=0;y<510;y+=3)for(let x=0;x<580;x+=3){
    const k=(y*580+x)*4,ar=a[k+3],al=b[k+3];
    massRight+=x*ar;massLeft+=x*al;weightR+=ar;weightL+=al;
   }
   return {meanR:massRight/weightR,meanL:massLeft/weightL,coverR:weightR,coverL:weightL};
  }
  const mirrored=Object.fromEntries(['slash','sweep','thrust','guard','parry','dash','finisher','victory'].map(k=>[k,mirror(k)]));
  const state=window.__arenaQA.state;
  state.phase='fight';state.paused=false;state.resultApplied=false;state.fx=true;
  const p=state.player,e=state.enemy;
  p.x=400;p.face=1;e.x=620;e.face=-1;
  const victoryBefore=state.sparks.length;
  state.phase='finisher';state.resultApplied=true;state.resultWin=true;
  state.resultAnim=.90;
  const victoryReady=fx.available('victory');
  return {details,mirrored,victoryReady,victoryBefore,types:kinds,version:fx.version};
 });
 assert.equal(result.types.length,9,'all action types and victory have independent models');
 assert.equal(result.version,'1.0.0');
 for(const [kind,row] of Object.entries(result.details)){
  assert.ok(row.unique>=7,kind+' should be a real eight-frame animation');
  assert.ok(row.coverage.every(n=>n>4),kind+' frame must contain actual transparent VFX pixels');
 }
 for(const [kind,m] of Object.entries(result.mirrored)){
  assert.ok(m.coverR>500&&m.coverL>500,kind+' both facings must render');
  assert.ok(Math.abs((m.meanR+m.meanL)-579)<4,kind+' left must mirror right around the fighter pivot');
 }
 assert.ok(result.victoryReady);
 assert.deepEqual(errors,[],'no exceptions with directional art installed');
 console.log('DIRECTIONAL_8FRAME_VFX_PASS '+JSON.stringify(result));
}finally{await browser.close()}
