'use strict';
// Real Chromium: selected Ludus roster identity must survive the normal-duel
// renderer. Separate fighter looks MUST produce distinct pixel signatures.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
(async()=>{
 const server=http.createServer((req,res)=>{
  const file=path.join(process.cwd(),'public',decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return;}
   const ext=path.extname(file);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.png':'image/png','.webp':'image/webp'})[ext]||'application/octet-stream');res.end(data);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/index.html*',async route=>{
  let s=fs.readFileSync('public/index.html','utf8');
  const old='state:S,camera:CAMERA,attack,';
  assert(s.includes(old),'test-only hook splice point');
  s=s.replace(old,'state:S,camera:CAMERA,drawFighter,ctx,startLineupMatch,attack,');
  s=s.replace('assetsReady:()=>','growthReady:()=>[\'murmillo_a_L1\',\'thraex_a_L1\',\'retiarius_a_L1\'].every(k=>GROWTH_IMAGES.has(k)),assetsReady:()=>');
  await route.fulfill({contentType:'text/html',body:s});
 });
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html?__arena_qa=1',{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>window.__arenaQA?.growthReady?.()&&window.__arenaQA?.assetsReady?.(),null,{timeout:110000});
  const result=await page.evaluate(()=>{
   window.requestAnimationFrame=()=>0;
   const Q=window.__arenaQA,a=window.LudusBridge,r=a.state().roster;
   const choices=[
    {cls:'murmillo',key:'murmillo_a_L1',name:'QA Murmillo'},
    {cls:'thraex',key:'thraex_a_L1',name:'QA Thraex'},
    {cls:'retiarius',key:'retiarius_a_L1',name:'QA Retiarius'}
   ];
   const roster=choices.map((c,i)=>window.LudusRoster.create(c.cls,i+1,{name:c.name,growthType:c.key.slice(0,-3),visualId:c.key,appearance:null}));
   r.splice(0,r.length,...roster);
   const signatures=[],captured=[];
   function renderSelected(i,mode){
    a.select(i);
    if(mode==='lineup')Q.startLineupMatch('1v2',[i]);
    else Q.start('career',i);
    const f=Q.state.player;
    Q.state.phase='fight';Q.state.paused=true;Q.state.fx=false;
    f.x=640;f.face=1;f.dead=false;f.action='idle';f.actionT=0;f.stagger=0;f.dodge=0;
    const c=Q.ctx;c.save();c.setTransform(1,0,0,1,0,0);
    c.clearRect(0,0,c.canvas.width,c.canvas.height);
    Q.drawFighter(f);
    const d=c.getImageData(0,0,c.canvas.width,c.canvas.height).data;c.restore();
    let hash=2166136261>>>0,ink=0;
    for(let k=0;k<d.length;k+=16){hash=Math.imul(hash^d[k],16777619)>>>0;hash=Math.imul(hash^d[k+1],16777619)>>>0;hash=Math.imul(hash^d[k+2],16777619)>>>0;if(d[k+3])ink++;}
    captured.push({chosen:i,mode,name:f.cfg.name,cls:f.cls,championVariant:f.championVariant||null,
     growthKey:(f.growthType||'')+'_L'+f.growthLevel,hash,ink});
    if(mode==='duel')signatures.push(hash);
   }
   for(let i=0;i<choices.length;i++)renderSelected(i,'duel');
   renderSelected(1,'lineup');
   return {fighters:captured,unique:new Set(signatures).size};
  });
  assert.deepEqual(errors,[],'no runtime exception in roster selection/render');
  assert.equal(result.unique,3,'three gladiator classes render different approved sprites');
  assert(result.fighters.every(f=>f.ink>100),'each selected fighter has visible drawn pixels');
  for(let i=0;i<3;i++){
   assert.equal(result.fighters[i].chosen,i);
   assert.equal(result.fighters[i].championVariant,null,'renderer never overwrites appearance with champion');
   assert.equal(result.fighters[i].growthKey,['murmillo_a_L1','thraex_a_L1','retiarius_a_L1'][i]);
   assert(result.fighters[i].name.includes(['QA Murmillo','QA Thraex','QA Retiarius'][i]));
  }
  assert.equal(result.fighters[3].mode,'lineup');
  assert.equal(result.fighters[3].cls,'thraex');
  assert.equal(result.fighters[3].championVariant,null);
  console.log('PASS real Chromium: distinct Murmillo/Thraex/Retiarius artwork and correct 1v2 lineup identity');
  console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
