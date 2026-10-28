'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const server=require('node:http').createServer((req,res)=>{
  const file=path.join(process.cwd(),'public',decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return;}
   const ext=path.extname(file);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.png':'image/png','.webp':'image/webp'})[ext]||'application/octet-stream');res.end(data);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 // Test-only hooks are applied to responses, never written into shipped code.
 await page.route('**/index.html*',async route=>{let s=fs.readFileSync('public/index.html','utf8');s=s.replace('state:S,camera:CAMERA,attack,','state:S,camera:CAMERA,drawFighter,ctx,attack,');await route.fulfill({contentType:'text/html',body:s});});
 await page.route('**/ludus-practice.js*',async route=>{let s=fs.readFileSync('public/ludus-practice.js','utf8');s=s.replace('root.LudusPractice={','root.__hitPracticeQA={drawUnit,deal,prepareStrike,paint,start,getBattle:()=>battle,setBattle:b=>battle=b,setContext:c=>ctx=c,setCourts:n=>COURTS=courtsForParty(n)};root.LudusPractice={');await route.fulfill({contentType:'text/javascript',body:s});});
 await page.route('**/arena-coop.js*',async route=>{let s=fs.readFileSync('public/arena-coop.js','utf8');s=s.replace('current=state;','current=state;root.__hitCoopQA={state,drawUnit,loop,draw};');await route.fulfill({contentType:'text/javascript',body:s});});
 try{
 await page.goto(base+'/index.html?__arena_qa=1',{waitUntil:'load',timeout:120000});
 console.log('ready',await page.evaluate(()=>({qa:!!window.__arenaQA,assets:window.__arenaQA?.assetsReady(),practice:!!window.__hitPracticeQA,motion:!!window.ArenaMotion?.drawHitFlash})),errors);
 await page.waitForFunction(()=>window.__arenaQA&&window.__hitPracticeQA&&window.ArenaMotion?.drawHitFlash,null,{timeout:60000});
 await page.evaluate(()=>window.ArenaBeasts.ensure('lion'));
 await page.waitForFunction(()=>!!window.ArenaBeasts.portrait('lion'),null,{timeout:60000});
 await page.evaluate(()=>{window.requestAnimationFrame=()=>0;});
 await page.waitForTimeout(100);
 const result=await page.evaluate(()=>{
  const Q=window.__arenaQA,M=window.ArenaMotion;
  const canvas=document.getElementById('battle'),ctx=Q.ctx;
  Q.state.phase='fight';Q.state.fx=true;Q.state.paused=true;
  const f=Q.state.player;f.dead=false;f.hp=100;f.action='idle';f.actionT=0;f.stagger=0;f.dodge=0;f.guard=false;f.x=640;f.bodySpring=null;f.specialRecoil=null;f.attackLunge=null;f.dodgeEcho=null;
  const inspect=(draw,context,unit)=>{
   const raw=context.drawImage,translate=context.translate,records=[],moves=[];
   context.drawImage=function(...args){records.push({alpha:this.globalAlpha,filter:this.filter});return raw.apply(this,args)};
   context.translate=function(x,y){moves.push([x,y]);return translate.call(this,x,y)};
   context.save();context.setTransform(1,0,0,1,0,0);context.clearRect(0,0,context.canvas.width,context.canvas.height);
   unit.hitVisual=null;draw();const base=records.slice();
   const brightness=()=>{const d=context.getImageData(0,0,context.canvas.width,context.canvas.height).data;let sum=0;for(let i=0;i<d.length;i+=4)sum+=d[i]+d[i+1]+d[i+2];return sum;};
   const beforeBrightness=brightness();records.length=0;moves.length=0;
   context.clearRect(0,0,context.canvas.width,context.canvas.height);M.impact(unit,'strike');draw();
   const white=records.filter(x=>x.filter==='brightness(0) invert(1)');
   const image=context.getImageData(0,0,context.canvas.width,context.canvas.height).data;
   let ink=0;for(let i=3;i<image.length;i+=4)if(image[i]>0)ink++;
   const output={base:base.length,white:white.length,alpha:white.map(x=>x.alpha),offset:M.hitOffset(unit),ink,beforeBrightness,afterBrightness:brightness(),preview:context.canvas.toDataURL('image/png')};
   context.restore();context.drawImage=raw;context.translate=translate;return output;
  };
  const duel=inspect(()=>Q.drawFighter(f),ctx,f);
  const savedF={...f,cfg:{...f.cfg}};window.ArenaBeasts.apply(f,'lion');
  const beast=inspect(()=>Q.drawFighter(f),ctx,f);Object.assign(f,savedF);f.beastType=null;
  // Actual arena damage resolution starts the same timer, without waiting 100ms.
  const e=Q.state.enemy;Object.assign(e,{dead:false,hp:100,maxHp:100,x:f.x+120,guard:false,parry:0,dodge:0,invuln:0,action:'idle',actionT:0});
  Object.assign(f,{hp:100,maxHp:100,st:100,cd:0,attackCD:0,stagger:0,dodge:0,actionT:0});
  Q.state.paused=false;Q.state.autoplayEnabled=false;Q.state.autoPlaying=false;
  Q.attack(f,e,false,false);for(let n=0;n<30&&e.hp===100;n++)Q.update(.016,.016);
  const actualHit={hp:e.hp,flash:M.visual(e).flash,offset:M.hitOffset(e)};Q.state.paused=true;
  // Use approved loaded art for an isolated practice render; no career writes.
  const P=window.__hitPracticeQA,off=document.createElement('canvas');off.width=1280;off.height=720;const pc=off.getContext('2d');
  P.setContext(pc);P.setCourts(4);
  const hero={side:'ally',index:0,seat:0,x:800,y:689,homeX:800,cls:'murmillo',name:'QA',hp:100,maxHp:100,atk:17,armor:0,swings:1,hit:0,guard:0,dodge:0,windup:0,swing:0,entry:0,dead:false,face:1};
  const enemy={...hero,side:'enemy',x:970,name:'Target',look:'murmillo_a_L1'};
  P.setBattle({clock:0,heroes:[hero],enemies:[enemy],particles:[],fx:[],exits:[],audioTimes:{}});
  const practice=inspect(()=>P.drawUnit(hero),pc,hero);
  P.deal(hero,enemy);const practiceHit={hp:enemy.hp,flash:M.visual(enemy).flash,offset:M.hitOffset(enemy)};
  // Actual ten-unit renderer, using a disposable in-memory squad.
  const team=Array.from({length:5},(_,i)=>({index:i,name:'QA '+i,cls:'murmillo',look:'murmillo_a_L1',combat:{hp:160,atk:18,move:220,parry:0,armor:0}}));
  window.ArenaCoop.open(team,team,{seed:21});
  const C=window.__hitCoopQA;C.state.paused=true;C.state.sim.paused=true;
  const u=C.state.sim.units.find(u=>u.side==='enemy');u.x=640;u.y=600;
  const cc=document.querySelector('.arena-coop canvas').getContext('2d');
  const coop=inspect(()=>C.drawUnit(u),cc,u);
  return {duel,beast,actualHit,practice,practiceHit,coop};
 });
 for(const key of ['duel','beast','practice','coop']){const r=result[key];assert(r.afterBrightness>r.beforeBrightness,key+' actual pixels brighten');
  fs.mkdirSync(process.env.QA_OUT||'/tmp/spartacus-contact-qa',{recursive:true});fs.writeFileSync(path.join(process.env.QA_OUT||'/tmp/spartacus-contact-qa',key+'.png'),Buffer.from(r.preview.split(',')[1],'base64'));delete r.preview;
  assert(r.base>0&&r.ink>100,key+' visible approved art');assert(r.white>0,key+' white silhouette draw');assert(r.alpha.every(a=>a>=.64&&a<=.99),key+' clearly visible white silhouette overlay');assert(Math.abs(r.offset.x)>=12,key+' clearly visible local body vibration');}
 for(const key of ['actualHit','practiceHit']){assert(result[key].hp<100,key+' actual damage');assert(result[key].flash>=.64,key+' strong immediate white flash');assert(Math.abs(result[key].offset.x)>=12,key+' synchronized readable vibration');}
 assert.deepEqual(errors,[]);console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exit(1)});
