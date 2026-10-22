import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const manifest=JSON.parse(readFileSync(new URL('../public/assets/beasts/manifest.json',import.meta.url),'utf8'));
assert.equal(manifest.species.length,5);
assert.equal(manifest.actions.length,5);
for(const type of manifest.species){
 const bytes=readFileSync(new URL('../public/'+type.path,import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),type.sha256,type.name+' source art modified');
 assert.equal(bytes.readUInt32BE(16),1586);
 assert.equal(bytes.readUInt32BE(20),992);
 assert.equal(bytes[25],6,'RGBA source required');
}
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:720}});
const problems=[];page.on('pageerror',e=>problems.push(e.message));
try{
 await page.goto('http://127.0.0.1:8765/?__arena_qa=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.ArenaBeasts?.pick&&window.__arenaQA?.state&&window.__arenaQA?.advanceBeast,{timeout:20000});
 const checks=await page.evaluate(()=>{
  const B=ArenaBeasts;
  return {early:B.pick(2),boss:B.pick(4,true),scheduled:[4,8,12,16,20].map(n=>B.pick(n)),
   specials:B.rows,boot:B.status()};
 });
 assert.equal(checks.early,null);
 assert.equal(checks.boss,null,'champions never replaced by beasts');
 assert.deepEqual(checks.scheduled,['wolf','leopard','tiger','lion','elephant']);
 assert.equal(checks.boot.loaded,0,'do not download all 13MB at startup');
 await page.evaluate(()=>document.getElementById('startBtn').click());
 await page.waitForFunction(()=>__arenaQA.state.phase==='fight',{timeout:10000});
 await page.evaluate(()=>{__arenaQA.state.paused=true;});
 const results=[];
 for(const name of checks.scheduled){
  const enabled=await page.evaluate(name=>__arenaQA.advanceBeast(name),name);
  assert.equal(enabled,true,'apply beast '+name);
  await page.waitForFunction(type=>ArenaBeasts.status().ready.includes(type),name,{timeout:20000});
  const render=await page.evaluate(name=>{
   const f=__arenaQA.state.enemy, B=ArenaBeasts;
   const contexts=[],canvases={};
   for(const kind of ['idle','walk','attack','hit','defeat']){
    const canvas=document.createElement('canvas');canvas.width=550;canvas.height=450;
    const c=canvas.getContext('2d');
    f.action=kind;f.actionT=kind==='idle'?0:.34;f.actionDuration=.65;f.vx=kind==='walk'?120:0;
    const active=B.draw(c,{fighter:f,pose:kind,clock:1.35,x:10,y:20,w:500,h:390,flip:false,alpha:1});
    const data=c.getImageData(0,0,550,450).data;
    let opaque=0;
    for(let i=3;i<data.length;i+=4)if(data[i]>20)opaque++;
    contexts.push({kind,active,opaque});
   }
   const k=B.frameFor(f,'attack',4.2);
   return {name,beastType:f.beastType,hp:f.hp,maxHp:f.maxHp,cfg:f.cfg,
    role:f.beastRole,rows:contexts,attackCell:k,
    currentStatus:B.status()};
  },name);
  assert.equal(render.beastType,name);
  assert.ok(render.maxHp>0&&render.hp>0);
  assert.ok(render.cfg.atk>0&&render.cfg.move>0);
  assert.equal(render.rows.length,5);
  for(const step of render.rows){
   assert.equal(step.active,true,name+' '+step.kind+' 8-frame row missing');
   assert.ok(step.opaque>2000,name+' '+step.kind+' displayed blank frame');
  }
  assert.equal(render.attackCell.row,2);
  assert.ok(render.attackCell.index>=0&&render.attackCell.index<8);
  results.push({species:name,latin:render.cfg.name,rows:render.rows.map(z=>z.opaque)});
 }
 // The live arena renderer must keep an enemy whose type is the chosen beast.
 await page.evaluate(()=>{__arenaQA.state.paused=false;__arenaQA.render();});
 const actual=await page.evaluate(()=>({
  enemy:__arenaQA.state.enemy.beastType,phase:__arenaQA.state.phase,
  allLoaded:ArenaBeasts.status().ready
 }));
 assert.equal(actual.enemy,'elephant');
 assert.equal(actual.phase,'fight');
 assert.equal(actual.allLoaded.length,5);
 assert.deepEqual(problems,[],'game script runtime errors');
 console.log('ARENA_5_BEASTS_40_FRAMES_PASS '+JSON.stringify({checks,actual,results}));
}finally{await browser.close();}
