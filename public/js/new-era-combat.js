(()=>{
'use strict';
const $=s=>document.querySelector(s);
const L=window.GladiatorLayerDemo;
const CLASS={murmillo:{name:'무르밀로',hp:120,atk:14,speed:170,special:37,range:140},thraex:{name:'트라에키스',hp:98,atk:13,speed:220,special:23,range:145},retiarius:{name:'레티아리우스',hp:105,atk:12,speed:190,special:28,range:185}};
const G={phase:'intro',time:90,last:0,p:null,e:null,holding:new Set(),effects:[],round:0};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=()=>Math.abs(G.p.x-G.e.x);
function character(id,x,enemy=false){const c=CLASS[id];return {id,x,hp:c.hp,maxHp:c.hp,st:100,act:0,cd:0,dodge:0,stun:0,guard:false,hit:0,dead:false,enemy,shield:true,weapon:true,specialLock:0,nets:0};}
function renderAvatar(f,root){const stage=$('#stage').value;const s=root.querySelector('svg');L.mount(s,{classId:f.id,stage,active:{shield:f.shield,offhand:f.shield,weapon:f.weapon,helmet:stage!=='trainee',cloak:stage==='champion',armor:true,armguard:true}});}
function message(t){const node=$('#message');node.textContent=t;node.classList.remove('show');void node.offsetWidth;node.classList.add('show');}
function reset(){
 const id=$('#playerClass').value;const other={murmillo:'thraex',thraex:'retiarius',retiarius:'murmillo'}[id];
 G.p=character(id,250);G.e=character(other,770,true);G.phase='fight';G.time=90;G.holding.clear();G.round++;
 $('#result').hidden=true;$('#player').className='fighter';$('#enemy').className='fighter enemy';$('#playerLabel').textContent=CLASS[id].name;$('#enemyLabel').textContent=CLASS[other].name;
 renderAvatar(G.p,$('#player'));renderAvatar(G.e,$('#enemy'));message('PUGNA!');sync();
}
function sync(){
 if(!G.p||!G.e)return;
 $('#player').style.left=G.p.x/1024*100+'%';$('#enemy').style.left=G.e.x/1024*100+'%';
 for(const [f,pre,number] of [[G.p,'player','hpNumber'],[G.e,'enemy','enemyNumber']]){
  $('#'+pre+'Hp').style.width=clamp(f.hp/f.maxHp*100,0,100)+'%';
  $('#'+pre+'St').style.width=clamp(f.st,0,100)+'%';
  $('#'+number).textContent=Math.ceil(Math.max(0,f.hp))+'/'+f.maxHp;
  const root=$('#'+(f.enemy?'enemy':'player'));
  root.classList.toggle('guard',f.guard);root.classList.toggle('hit',f.hit>0);root.classList.toggle('attack',f.act>0);root.classList.toggle('dead',f.dead);
 }
 $('#timer').textContent=Math.ceil(Math.max(0,G.time))+' SEC';
}
function spark(x){const n=document.createElement('div');n.className='impact';n.style.left=x/1024*100+'%';n.style.top='64%';$('#arena').append(n);setTimeout(()=>n.remove(),380);}
function strike(att,def,special=false){
 if(G.phase!=='fight'||att.dead||def.dead)return false;
 const c=CLASS[att.id];const reach=c.range+(special?35:0);
 if(distance()>reach||att.stun>0){return false;}
 const cost=special?32:15;if(att.st<cost)return false;
 if(special&&att.cd>0)return false;
 att.st-=cost;att.act=.3;att.specialLock=special?.45:0;
 if(special)att.cd=6.5;
 const dodge=def.dodge>0,guard=def.guard&&def.st>8;
 if(dodge){message('DODGE!');return true;}
 let damage=special?c.special:c.atk;
 if(special&&att.id==='thraex'){damage+=18;message('SICA DOUBLE CUT!');}
 else if(special&&att.id==='retiarius'){def.stun=Math.max(def.stun,1.1);def.nets=1.2;message('RETE CAPTURA!');}
 else if(special&&att.id==='murmillo'){def.st=Math.max(0,def.st-24);message('SHIELD BASH!');}
 if(guard){damage*=.23;def.st=Math.max(0,def.st-(special?30:16));if(def.st<=0)def.guard=false;}
 if(def.nets>0&&att.id==='retiarius')damage*=1.25;
 def.hp=Math.max(0,def.hp-damage);
 def.hit=.26;def.stun=Math.max(def.stun,guard?.08:.26);
 def.x=clamp(def.x+(def.x>att.x?1:-1)*(guard?15:special?63:28),100,925);
 spark(def.x);
 $('#flash').classList.remove('on');void $('#flash').offsetWidth;$('#flash').classList.add('on');
 if(special&&def.hp>0&&Math.random()<.26){def.shield=false;renderAvatar(def,$('#'+(def.enemy?'enemy':'player')));message('SHIELD DROP!');}
 if(def.hp<=0){def.dead=true;end(!G.p.dead);}return true;
}
function end(win){G.phase='result';$('#result').hidden=false;$('#resultTitle').textContent=win?'VICTORIA':'DEFEAT';$('#resultInfo').textContent=win?'투기장 승리 · 새로운 전투 구조 검증 성공':'도전자 패배 · 다시 도전하세요';message(win?'VICTORIA!':'DEFEAT');sync();}
function action(key){
 if(G.phase!=='fight')return;const p=G.p;
 if(key==='attack')strike(p,G.e);
 else if(key==='special')strike(p,G.e,true);
 else if(key==='dodge'&&p.st>=25){p.st-=25;p.dodge=.45;p.x=clamp(p.x+(G.e.x>p.x?-1:1)*72,100,925);}
 else if(key==='pickup'&&(!p.shield||!p.weapon)){p.shield=true;p.weapon=true;renderAvatar(p,$('#player'));message('EQUIPPED!');}
}
function update(dt){
 if(G.phase!=='fight')return;
 dt=Math.min(dt,.05);G.time-=dt;if(G.time<=0){end(G.p.hp>=G.e.hp);return;}
 for(const f of [G.p,G.e]){f.cd=Math.max(0,f.cd-dt);f.act=Math.max(0,f.act-dt);f.dodge=Math.max(0,f.dodge-dt);f.hit=Math.max(0,f.hit-dt);f.stun=Math.max(0,f.stun-dt);f.nets=Math.max(0,f.nets-dt);f.st=clamp(f.st+(f.guard?5:17)*dt,0,100);}
 const p=G.p,e=G.e;
 p.guard=G.holding.has('guard')&&p.st>8&&p.stun<=0;
 if(p.guard)p.st-=dt*8;
 if(p.stun<=0){
  if(G.holding.has('left'))p.x-=CLASS[p.id].speed*dt;
  if(G.holding.has('right'))p.x+=CLASS[p.id].speed*dt;
 }
 p.x=clamp(p.x,80,940);
 if(e.stun<=0){
  const dist=distance();
  if(dist>CLASS[e.id].range*.77)e.x+=(p.x>e.x?1:-1)*CLASS[e.id].speed*.57*dt;
  else if(dist<80)e.x+=(p.x>e.x?-1:1)*CLASS[e.id].speed*.17*dt;
  e.guard=Math.random()<.006&&dist<200&&e.st>15;
  if(dist<CLASS[e.id].range&&e.act<=0&&Math.random()<dt*.9)strike(e,p,Math.random()<.21);
 }else e.guard=false;
 e.x=clamp(e.x,80,940);
 if(Math.abs(p.x-e.x)<72){const mid=(p.x+e.x)/2;p.x=clamp(mid-36,80,940);e.x=clamp(mid+36,80,940);}
 sync();
}
let last=0;function loop(t){if(!last)last=t;const dt=(t-last)/1000;last=t;update(dt);requestAnimationFrame(loop);}
const keymap={KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',KeyJ:'attack',Space:'attack',KeyK:'guard',KeyL:'dodge',KeyI:'special',KeyE:'pickup'};
window.addEventListener('keydown',e=>{const key=keymap[e.code];if(!key||e.repeat&&key!=='guard')return;if(['Space','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(['left','right','guard'].includes(key))G.holding.add(key);else action(key);});
window.addEventListener('keyup',e=>{const k=keymap[e.code];if(k)G.holding.delete(k);});
window.addEventListener('blur',()=>G.holding.clear());
for(const b of document.querySelectorAll('[data-key]')){
 const key=b.dataset.key,continuous=['left','right','guard'].includes(key);
 b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(continuous)G.holding.add(key);else action(key);});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,()=>G.holding.delete(key));
}
$('#restart').onclick=reset;$('#again').onclick=reset;$('#playerClass').onchange=reset;$('#stage').onchange=()=>{if(G.p)renderAvatar(G.p,$('#player'));if(G.e)renderAvatar(G.e,$('#enemy'));};
reset();requestAnimationFrame(loop);
})();
