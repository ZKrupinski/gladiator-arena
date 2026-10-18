/* Stable Roman lineup HUD regression test.
 * Run: node scripts/qa_lineup_heraldry.mjs
 * Does not require the browser. Covers 1v1 and 3v3 queue UI state,
 * defeat / enemy advance, live HP without rebuilding icons and hidden state.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const dir=new URL('../public/',import.meta.url);
const js=fs.readFileSync(new URL('arena-lineup-visual.js',dir),'utf8');
const css=fs.readFileSync(new URL('arena-lineup-visual.css',dir),'utf8');
const html=fs.readFileSync(new URL('index.html',dir),'utf8');
const root={};
vm.runInNewContext(js,{globalThis:root});
const {ArenaLineupVisual:visual}=root;
assert.ok(visual?.paint);
class Hud {
 constructor(){this.hidden=true;this.dom='';this.bars={};this.attrs={};this.builds=0;}
 set innerHTML(v){
  this.dom=v;this.builds++;this.bars={};
  for(const m of v.matchAll(/data-live-hp="(ally|enemy)"/g)){
   this.bars[m[1]]={style:{width:'100%'},parentElement:{setAttribute(){}}};
  }
 }
 get innerHTML(){return this.dom;}
 querySelector(selector){return this.bars[selector.match(/data-live-hp="([^"]+)"/)?.[1]]||null;}
 setAttribute(name,value){this.attrs[name]=value;}
}
const roster=[
 {name:'Murmillo "A"',cls:'murmillo',appearance:'murmillo_champion_red'},
 {name:'Thraex',cls:'thraex'},
 {name:'Retiarius',cls:'retiarius'}
];
const enemies=[
 {name:'Retiarius 1',cls:'retiarius'},
 {name:'Thraex 2',cls:'thraex'},
 {name:'Murmillo BOSS',cls:'murmillo',boss:true}
];
const hp=(value,maxHp=100)=>({hp:value,maxHp});
function queue(mode='3v3'){
 return {mode,allies:mode==='1v1'?[0]:[0,1,2],
  enemies:mode==='1v1'?[enemies[0]]:enemies,
  allyIndex:0,enemyIndex:0,round:1,defeatedEnemies:0,defeatedAllies:0,finished:false};
}
const hud=new Hud(),q=queue();
assert.equal(visual.paint(hud,q,roster,hp(80),hp(74)),true);
assert.equal(hud.hidden,false);
assert.equal((hud.dom.match(/class="arena-seal /g)||[]).length,6);
assert.ok(hud.dom.includes('arena-seal--murmillo'));
assert.ok(hud.dom.includes('arena-seal--thraex'));
assert.ok(hud.dom.includes('arena-seal--retiarius'));
assert.ok(hud.dom.includes('arena-emblem-laurel'));
assert.ok(hud.dom.includes('Murmillo &quot;A&quot;'),'safe for player names');
assert.equal(hud.bars.ally.style.width,'80.0%');
assert.equal(hud.bars.enemy.style.width,'74.0%');
visual.paint(hud,q,roster,hp(25),hp(12));
assert.equal(hud.builds,1,'damage must not rebuild icon layout');
assert.equal(hud.bars.ally.style.width,'25.0%','real time health is retained');
q.enemyIndex=1;q.defeatedEnemies=1;q.round=2;
visual.paint(hud,q,roster,hp(22),hp(100));
assert.equal(hud.builds,2,'next opponent swaps roster states exactly once');
assert.match(hud.dom,/data-side="enemy" data-index="0" data-state="fallen"/);
assert.match(hud.dom,/data-side="enemy" data-index="1" data-state="active"/);
q.allyIndex=1;q.defeatedAllies=1;q.round=3;
visual.paint(hud,q,roster,hp(100),hp(90));
assert.match(hud.dom,/data-side="ally" data-index="0" data-state="fallen"/);
assert.match(hud.dom,/data-side="ally" data-index="1" data-state="active"/);
q.enemyIndex=3;q.defeatedEnemies=3;q.finished=true;q.round=5;
visual.paint(hud,q,roster,hp(40),hp(0));
assert.match(hud.dom,/FINIS/);
assert.equal((hud.dom.match(/data-state="fallen"/g)||[]).length,4);
assert.equal(visual.paint(hud,null,roster,null,null),false);
assert.equal(hud.hidden,true);
const duel=new Hud();
visual.paint(duel,queue('1v1'),roster,hp(138,138),hp(116,116));
assert.equal((duel.dom.match(/class="arena-seal /g)||[]).length,2);
assert.match(css,/@media\(max-width:720px\)/);
assert.match(css,/prefers-reduced-motion/);
assert.match(html,/arena-lineup-visual\.js\?v=1/);
assert.match(html,/arena-lineup-visual\.css\?v=1/);
assert.match(html,/window\.ArenaLineupVisual\.paint\(hud,q,CAREER\.roster,S\.player,S\.enemy\)/);
assert.match(html,/if\(S\.gauntlet\)updateLineupHud\(\)/);
console.log('PASS: 1v1/3v3 insignia, active/fallen/queued, class emblems, champion laurel and live HP.');
