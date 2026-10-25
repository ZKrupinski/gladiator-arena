import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1182,height:1150}});
const errors=[];
page.on('pageerror',error=>errors.push(String(error)));
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:50000});
 await page.waitForFunction(()=>!!window.LudusCardScenes?.renderRoster&&!!window.LudusRecovery?.healQuote,{timeout:25000});
 await page.evaluate(()=>{
  const mk=(name,level,injury,fatigue,severeInjury=false)=>({name,cls:'murmillo',level,injury,fatigue,severeInjury,
   xp:0,stats:{str:10,agi:10,end:10,focus:10},
   equipment:{weapon:null,shield:null,armor:null},wins:1,fights:2});
  const s={gold:1741,glory:9477,active:0,message:'',roster:[
   mk('Atilius',23,0,0),mk('Cato',17,32,25),
   mk('Faustus',18,0,67),mk('Marcus',20,100,20,true)
  ]};
  window.ArenaProgression&& (window.ArenaProgression.describe=()=>null);
  window.__recoveryState=s;
  window.LudusBridge={
   state:()=>s,catalog:()=>[],portrait:()=>null,
   recoveryQuote:i=>({heal:LudusRecovery.healQuote(s.roster[i]),rest:LudusRecovery.restQuote(s.roster[i])}),
   select:i=>{s.active=i;LudusCardScenes.renderRoster();},
   heal:()=>{const h=s.roster[s.active],q=LudusRecovery.healQuote(h);
    if(s.gold<q.gold||s.glory<q.glory)return '재화 부족';
    s.gold-=q.gold;s.glory-=q.glory;h.injury=0;h.severeInjury=false;LudusRecovery.recovered(h);
    LudusCardScenes.renderRoster();return '치료 완료';},
   rest:()=>{const h=s.roster[s.active],q=LudusRecovery.restQuote(h);
    if(s.gold<q.gold)return '금화 부족';
    s.gold-=q.gold;h.fatigue=Math.max(0,h.fatigue-55);LudusRecovery.recovered(h);
    LudusCardScenes.renderRoster();return '휴식 완료';},
   market:()=>{}
  };
  const hub=document.getElementById('careerHub');
  hub.hidden=false;
  window.LudusCardScenes.renderRoster();
 });
 let initial=await page.evaluate(()=>({
   resources:[...document.querySelectorAll('.lc-recovery-funds strong')].map(e=>e.textContent),
   actions:[...document.querySelectorAll('.lc-care-actions button')].map(e=>({id:e.id,disabled:e.disabled})),
   badges:[...document.querySelectorAll('.lc-fighter-card[data-unit]')].map(e=>e.querySelector('.lc-care-tags').textContent),
   removed:[...['lcTraining','lcArmory','lcReady']].every(id=>!document.getElementById(id))
 }));
 assert.deepEqual(initial.actions.map(x=>x.id),['lcHeal','lcRest']);
 assert(initial.removed,'no distracting training, equipment or ready buttons');
 assert(initial.resources.some(x=>x.includes('1,741'))&&initial.resources.some(x=>x.includes('9,477')));
 assert(initial.badges[1].includes('치료 필요')&&initial.badges[1].includes('휴식 필요'));
 assert(initial.badges[2].includes('휴식 필요')&&!initial.badges[2].includes('치료 필요'));
 assert(initial.badges[3].includes('중상 치료'));
 assert(initial.actions.every(x=>x.disabled),'healthy starting gladiator has no recovery actions');
 await page.locator('.lc-fighter-card[data-unit="1"]').click();
 const card=await page.evaluate(()=>({recovery:[...document.querySelectorAll('.lc-care-actions button')].map(n=>({text:n.textContent,disabled:n.disabled})),
 guidance:document.querySelector('.lc-care-guidance').textContent}));
 assert(card.recovery[0].text.includes('20 D')&&card.recovery[1].text.includes('35 D'),'normal recovery pricing must match game');
 await page.locator('#lcRest').click();
 assert.equal(await page.evaluate(()=>window.__recoveryState.roster[1].fatigue),0);
 await page.locator('.lc-fighter-card[data-unit="3"]').click();
 const severe=await page.locator('#lcHeal').textContent();
 assert(severe.includes('중상 치료')&&severe.includes('✥ 17'),'severe treatment needs gold AND honor');
 // Reproduce the screenshot: 684 D cannot pay the 800 D serious surgery.
 await page.evaluate(()=>{window.__recoveryState.gold=684;LudusCardScenes.renderRoster()});
 assert.equal(await page.locator('#lcHeal').isEnabled(),true,
  'insufficient funds must not silently disable the treatment button');
 const noFundsBefore=await page.evaluate(()=>({gold:__recoveryState.gold,glory:__recoveryState.glory}));
 await page.locator('#lcHeal').click();
 const shortage=await page.evaluate(()=>({
  gold:__recoveryState.gold,glory:__recoveryState.glory,
  guidance:document.querySelector('.lc-care-guidance').textContent
 }));
 assert.equal(shortage.gold,noFundsBefore.gold);
 assert.equal(shortage.glory,noFundsBefore.glory);
 assert(shortage.guidance.includes('재화 부족'),'click should explain the missing recovery cost');
 await page.evaluate(()=>{window.__recoveryState.gold=1741;LudusCardScenes.renderRoster()});
 const fundsBefore=await page.evaluate(()=>({gold:window.__recoveryState.gold,glory:window.__recoveryState.glory}));
 await page.locator('#lcHeal').click();
 const fundsAfter=await page.evaluate(()=>({gold:window.__recoveryState.gold,glory:window.__recoveryState.glory,hero:window.__recoveryState.roster[3]}));
 assert(fundsAfter.gold<fundsBefore.gold&&fundsAfter.glory===fundsBefore.glory-17);
 assert.equal(fundsAfter.hero.injury,0);
 const screenshots=[];
 for(const size of [{width:1182,height:1150},{width:930,height:1050},{width:768,height:1024},{width:430,height:932},{width:390,height:844},{width:360,height:800}]){
  await page.setViewportSize(size);
  await page.evaluate(()=>{window.scrollTo(0,0);const sc=document.querySelector('.lc-detail-scroll');if(sc)sc.scrollTop=0});
  const layout=await page.evaluate(()=>{
   const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
   const title=rect(document.querySelector('.lc-banner h1'));
   const funds=rect(document.querySelector('.lc-recovery-funds'));
   const home=document.getElementById('careerVisualHome');
   const homeRect=home?rect(home):null;
   const overlap=(a,b)=>a&&b&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
   return {title,funds,home:homeRect,conflict:overlap(title,funds)||overlap(funds,homeRect)||overlap(title,homeRect),
     screenWidth:document.documentElement.scrollWidth,viewport:innerWidth,
     actions:document.querySelectorAll('.lc-care-actions button').length,
     badges:document.querySelectorAll('.lc-care-tags').length,
     actionWidth:rect(document.querySelector('#lcHeal')).width,
     detail:rect(document.querySelector('.lc-detail')),
     scrollArea:rect(document.querySelector('.lc-detail-scroll')),
     dock:rect(document.querySelector('.lc-recovery-dock')),
     heal:rect(document.querySelector('#lcHeal')),
     rest:rect(document.querySelector('#lcRest')),
     dockPosition:getComputedStyle(document.querySelector('.lc-recovery-dock')).position,
     parentScroll:document.querySelector('.lc-detail').scrollTop,
     noOldBanner:document.querySelectorAll('.lc-roster-screen .lc-unavailable').length===0,
     rosterStatus:[...document.querySelectorAll('.lc-fighter-card[data-unit] .lc-care-tags')].map(e=>({height:rect(e).height,top:rect(e).top,visible:getComputedStyle(e).display!=='none'}))};
  });
  assert(!layout.conflict,'header currency/title/back overlap '+JSON.stringify({size,layout}));
  assert(layout.screenWidth<=layout.viewport+2,'horizontal overflow '+JSON.stringify({size,layout}));
  assert(layout.actions===2&&layout.badges===4);
  assert(layout.actionWidth>=90,'recovery buttons too narrow '+JSON.stringify({size,layout}));
  assert(layout.noOldBanner,'roster should not use draft-style overlapping KO banner');
  assert(layout.rosterStatus.every(x=>x.visible&&x.height>=18),
    'injury/rest status must be visible on cards '+JSON.stringify({size,layout}));
  assert(layout.dock.top>=layout.detail.top-2&&layout.dock.bottom<=layout.detail.bottom+2,
    'recovery buttons must remain INSIDE the detail panel without inner scrolling '+JSON.stringify({size,layout}));
  assert(layout.heal.top>=layout.dock.top-2&&layout.heal.bottom<=layout.dock.bottom+2,
    'treatment button must be fully visible in fixed footer '+JSON.stringify({size,layout}));
  assert(layout.rest.top>=layout.dock.top-2&&layout.rest.bottom<=layout.dock.bottom+2,
    'rest button must be fully visible in fixed footer '+JSON.stringify({size,layout}));
  if(size.width>=768)assert(layout.dock.bottom<=size.height+2,
    'tablet / landscape recovery controls must appear WITHOUT scrolling '+JSON.stringify({size,layout}));
  if(size.width===1182||size.width===390){
   await page.screenshot({path:'/tmp/ludus-recovery-v68-'+size.width+'.png',fullPage:true});
   screenshots.push(size.width);
  }
 }
 assert.deepEqual(errors,[],'no browser JS errors');
 console.log('LUDUS_RECOVERY_V69_BROWSER_PASS '+JSON.stringify({initial,card,severe,fundsBefore,fundsAfter,screenshots}));
}finally{await browser.close()}
