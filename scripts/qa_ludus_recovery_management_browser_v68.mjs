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
    s.gold-=q.gold;s.glory-=q.glory;h.injury=0;h.severeInjury=false;
    LudusCardScenes.renderRoster();return '치료 완료';},
   rest:()=>{const h=s.roster[s.active],q=LudusRecovery.restQuote(h);
    if(s.gold<q.gold)return '금화 부족';
    s.gold-=q.gold;h.fatigue=Math.max(0,h.fatigue-55);
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
 const fundsBefore=await page.evaluate(()=>({gold:window.__recoveryState.gold,glory:window.__recoveryState.glory}));
 await page.locator('#lcHeal').click();
 const fundsAfter=await page.evaluate(()=>({gold:window.__recoveryState.gold,glory:window.__recoveryState.glory,hero:window.__recoveryState.roster[3]}));
 assert(fundsAfter.gold<fundsBefore.gold&&fundsAfter.glory===fundsBefore.glory-17);
 assert.equal(fundsAfter.hero.injury,0);
 const screenshots=[];
 for(const size of [{width:1182,height:1150},{width:930,height:1050},{width:768,height:1024},{width:430,height:932},{width:390,height:844},{width:360,height:800}]){
  await page.setViewportSize(size);
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
     actionWidth:rect(document.querySelector('#lcHeal')).width};
  });
  assert(!layout.conflict,'header currency/title/back overlap '+JSON.stringify({size,layout}));
  assert(layout.screenWidth<=layout.viewport+2,'horizontal overflow '+JSON.stringify({size,layout}));
  assert(layout.actions===2&&layout.badges===4);
  assert(layout.actionWidth>=90,'recovery buttons too narrow '+JSON.stringify({size,layout}));
  if(size.width===1182||size.width===390){
   await page.screenshot({path:'/tmp/ludus-recovery-v68-'+size.width+'.png',fullPage:true});
   screenshots.push(size.width);
  }
 }
 assert.deepEqual(errors,[],'no browser JS errors');
 console.log('LUDUS_RECOVERY_BROWSER_PASS '+JSON.stringify({initial,card,severe,fundsBefore,fundsAfter,screenshots}));
}finally{await browser.close()}
