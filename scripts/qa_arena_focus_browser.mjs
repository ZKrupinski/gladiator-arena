import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 const page=await browser.newPage({viewport:{width:1200,height:900}});
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.ArenaFocus,{timeout:15000});
 await page.locator('#startBtn').click();
 await page.waitForFunction(()=>eval('S.phase')==='fight',{timeout:15000});
 const result=await page.evaluate(()=>{
  const s=eval('S'),attack=eval('attack');
  s.autoPlaying=false;s.autoplayEnabled=false;s.paused=false;
  const ready=()=>{
   s.phase='fight';s.player.x=480;s.enemy.x=625;
   for(const f of [s.player,s.enemy]){f.dead=false;f.hp=f.maxHp;f.st=100;f.invuln=0;
    f.stagger=0;f.dodge=0;f.guard=false;f.parry=0;f.attackCD=0;f.comboDash=null;f.guardHold=0;}
  };
  ready();s.player.guard=true;s.player.parry=.3;
  attack(s.enemy,s.player,false,false);const parry=s.cinematic?.kind;
  ready();s.cinematic=null;s.focusFrame=null;
  attack(s.player,s.enemy,false,true);const dash=s.cinematic?.kind;
  s.phase='cleanup';s.cinematic=null;s.focusFrame=null;s.gauntlet={inCleanup:true};
  s.enemy.dead=true;s.enemy.hp=0;
  s.cleanup={side:1,allyWon:true,step:{finished:true,win:true}};
  const old=window.ArenaLineupVisual?.paint;
  if(window.ArenaLineupVisual)window.ArenaLineupVisual.paint=()=>{};
  const ended=eval('finishLineupCleanup')(),removed=s.enemy.removedFromArena;
  s.phase='result';eval('showEnd')();
  const element=document.getElementById('loserPose');
  const hidden=element.children.length===0&&element.style.backgroundImage==='none';
  if(window.ArenaLineupVisual)window.ArenaLineupVisual.paint=old;
  return {parry,dash,ended,removed,hidden};
 });
 assert.deepEqual(result,{parry:'parry',dash:'dash',ended:true,removed:true,hidden:true});
 console.log('PASS: real browser parry, dash, permanent removed corpse:',result);
}finally{await browser.close();}
