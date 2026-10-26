'use strict';
/* Regression for VENATIO results => beast selection rather than frozen 1v1. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('public/index.html','utf8');
const begin=html.indexOf('function returnToBeastHunt(){');
const end=html.indexOf('function finishBeastMatch(){',begin);
assert(begin>0&&end>begin,'Must find unique beast-gallery return handler');
const fn=html.slice(begin,end);
assert(fn.includes("$('#careerHub').hidden=false"),'beast gallery container must be revealed');
assert(fn.indexOf("$('#careerHub').hidden=false")<fn.indexOf('renderCareer()'),
 'visible hub is required before beast preview mount');
assert(!fn.includes('returnToCareer();'),'do not navigate via main Ludus lobby');
assert(html.includes("$('#againBtn').onclick=()=>{if(S.beastHunt&&BEAST_RUN){returnToBeastHunt();}"),
 'result beast-select button must use direct beast-gallery return');
assert(html.includes("$('#againBtn').textContent='야수 선택';"));
const make=new Function('S','window','$','renderCareer','returnToLudus',
 "let BEAST_RUN={stage:{id:'wolf'},roundIndex:0},CAREER_SELECTING=true,CAREER_TAB='roster';"+
 fn+";return {invoke:returnToBeastHunt,state:()=>({BEAST_RUN,CAREER_SELECTING,CAREER_TAB})}");
for(const resultWin of [true,false]){
 const S={beastHunt:true,careerMatch:true,lastResultWin:resultWin};
 const dom={endScreen:{hidden:false},startScreen:{hidden:false},careerHub:{hidden:true}},steps=[];
 const actions=make(S,
  {LudusScene:{close:()=>steps.push('close lobby')},LudusApprovedScenes:{close:()=>steps.push('close rooms')}},
  sel=>dom[sel.slice(1)],
  ()=>{assert.equal(dom.careerHub.hidden,false,'gallery must be visible before render');steps.push('gallery rendered');},
  ()=>{steps.push('reset combat');dom.endScreen.hidden=true;dom.startScreen.hidden=false;});
 actions.invoke();const state=actions.state();
 assert.equal(S.beastHunt,false);assert.equal(S.careerMatch,false);
 assert.equal(state.BEAST_RUN,null);assert.equal(state.CAREER_SELECTING,false);
 assert.equal(state.CAREER_TAB,'beasts');assert.equal(dom.careerHub.hidden,false);
 assert.equal(dom.endScreen.hidden,true);assert.equal(dom.startScreen.hidden,true);
 assert.deepEqual(steps,['reset combat','close lobby','close rooms','gallery rendered']);
}
console.log('PASS: result VENATIO beast selection restores gallery after win/loss, no inert 1v1');
