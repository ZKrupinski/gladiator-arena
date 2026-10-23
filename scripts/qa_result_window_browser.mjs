import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const photo='assets/new-era/cinematic/roman-colosseum-result-v1.webp?v=1';
async function check(size,preview){
 const page=await browser.newPage({viewport:size,deviceScaleFactor:1});
 try{
  await page.goto('http://127.0.0.1:8765/?__arena_qa=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__arenaQA),{timeout:20000});
  await page.evaluate(()=>document.getElementById('startBtn').click());
  await page.waitForFunction(()=>window.__arenaQA.state.phase==='fight',{timeout:20000});
  await page.evaluate(()=>{
   const s=window.__arenaQA.state;
   s.careerMatch=false;s.gauntlet={round:30,inCleanup:false};
   s.player.dead=false;s.player.removedFromArena=false;s.player.hp=s.player.maxHp;
   s.enemy.dead=true;s.enemy.hp=0;s.enemy.removedFromArena=true;
   s.resultApplied=true;s.resultWin=true;s.phase='result';
   window.__arenaQA.showEnd();
  });
  await page.locator('#endBanner').waitFor({state:'visible',timeout:10000});
  await page.waitForFunction(()=>Boolean(document.querySelector('#loserPose canvas')&&
                         document.querySelector('#winnerPose canvas')),{timeout:16000});
  await page.waitForTimeout(450);
  const result=await page.evaluate(async path=>{
   const modal=document.querySelector('#endScreen');
   const panel=modal.querySelector('.stage-panel-ending');
   const loser=modal.querySelector('#loserPose');
   const winner=modal.querySelector('#winnerPose');
   const rect=panel.getBoundingClientRect();
   const loserRect=loser.getBoundingClientRect();
   const actions=modal.querySelector('.end-actions').getBoundingClientRect();
   const canvas=loser.querySelector('canvas');
   let pixelCount=0, alphaBox=null;
   if(canvas){
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    let l=canvas.width,t=canvas.height,r=0,b=0;
    for(let y=0;y<canvas.height;y+=2)for(let x=0;x<canvas.width;x+=2){
     if(pixels[(y*canvas.width+x)*4+3]>42){
      pixelCount++;
      l=Math.min(l,x);r=Math.max(r,x);
      t=Math.min(t,y);b=Math.max(b,y);
     }
    }
    if(pixelCount)alphaBox={left:l,top:t,width:r-l+1,height:b-t+1};
   }
   const art=await fetch(path);
   const img=new Image();
   img.src=path;await img.decode();
   const test=document.createElement('canvas');test.width=img.width;test.height=img.height;
   const tctx=test.getContext('2d',{willReadFrequently:true});
   tctx.drawImage(img,0,0);
   const corner=tctx.getImageData(0,0,1,1).data[3];
   const inside=tctx.getImageData(Math.round(img.width/2),Math.round(img.height/2),1,1).data[3];
   const panelCSS=getComputedStyle(panel);
   const photoOnly=panelCSS.backgroundImage.includes('roman-colosseum-result-v1.webp') &&
    !panelCSS.backgroundImage.includes(',')&&!panelCSS.backgroundImage.includes('linear-gradient');
   const winnerArt=winner;
   const winnerCSS=getComputedStyle(winnerArt);
   const winnerMatrix=new DOMMatrixReadOnly(winnerCSS.transform);
   const winBox=winnerArt.getBoundingClientRect();
   const rawWinHeight=winnerArt.offsetHeight;
   const winnerScale=rawWinHeight?winBox.height/rawWinHeight:0;
   const cbox=canvas?.getBoundingClientRect();
   const pixelRatio=canvas?cbox.width/cbox.height:null;
   const spriteFit=canvas?getComputedStyle(canvas).objectFit:null;
   return {
    imgOK:art.ok,imgType:art.headers.get('content-type'),
    actualWidth:img.naturalWidth,actualHeight:img.naturalHeight,
    transparentOutside:corner<10,opaqueInside:inside>200,
    panelImageOnly:photoOnly,panelImage:panelCSS.backgroundImage,
    oldOrnaments:modal.querySelectorAll('.roman-results-frame,.roman-results-pennant').length,
    resultHidden:modal.hidden,
    winnerVisible:!!winner.querySelector('canvas')||getComputedStyle(winner).backgroundImage.includes('url('),
    loserVisible:(pixelCount>20)||getComputedStyle(loser).backgroundImage.includes('url('),
    ratio:rect.width/rect.height,
    withinViewport:rect.left>=0&&rect.top>=0&&rect.right<=innerWidth+1&&rect.bottom<=innerHeight+1,
    buttonsBelow:actions.top>=rect.bottom+2,
    buttonsWithin:actions.left>=0&&actions.right<=innerWidth+1&&actions.bottom<=innerHeight+1,
    controls:[...modal.querySelectorAll('.end-actions button')].map(btn=>{
     const box=btn.getBoundingClientRect(),style=getComputedStyle(btn);
     return {text:btn.textContent,oneLine:style.whiteSpace==='nowrap',notCut:btn.scrollWidth<=btn.clientWidth+2,
      textSize:parseFloat(style.fontSize),height:box.height,decorate:getComputedStyle(btn,'::before').content!=='none'};
    }),
    originalLoserStillGone:window.__arenaQA.state.enemy.removedFromArena,
    winnerScale,winnerCssScale:winnerMatrix.a,winnerAnchor:winnerCSS.transformOrigin,
    winnerLayoutBottom:winnerArt.offsetTop+winnerArt.offsetHeight,
    winnerVisualHeight:winBox.height,
    canvasNaturalRatio:canvas?canvas.width/canvas.height:null,
    canvasDisplayedRatio:pixelRatio,
    canvasObjectFit:spriteFit,
    alphaBox,loserSize:{w:loserRect.width,h:loserRect.height},panelSize:{w:rect.width,h:rect.height}
   };
  },photo);
  assert.equal(result.imgOK,true,'real approved raster image must be served');
  assert.equal(result.actualWidth,1448);assert.equal(result.actualHeight,1086);
  assert.equal(result.transparentOutside,true,'the outer frame must be alpha-transparent');
  assert.equal(result.opaqueInside,true,'the Colosseum must be visible');
  assert.equal(result.panelImageOnly,true,'exactly ONE picture; no duplicate SVG or arena background');
  assert.equal(result.oldOrnaments,0,'remove all built-in geometric vector decorations');
  assert.equal(result.winnerVisible,true);assert.equal(result.loserVisible,true);
  assert.ok(result.alphaBox?.width>70,'the defeat frame contains actual isolated sprite pixels');
  assert.ok(result.alphaBox?.height>55,'the defeated gladiator must not collapse to a thin strip');
  assert.ok(result.canvasNaturalRatio>1.4,'defeated pose canvas has correct aspect');
  assert.equal(result.originalLoserStillGone,true,'never restore the body in the real arena');
  assert.ok(Math.abs(result.ratio-4/3)<.015,'the approved artwork cannot be distorted');
  assert.equal(result.withinViewport,true,'no cropped gold frame');
  assert.equal(result.buttonsBelow,true,'decorative action controls must be BELOW the Roman artwork border');
  assert.equal(result.buttonsWithin,true,'actions must stay within visible viewport for non-loot result');
  assert(result.controls.every(b=>b.oneLine&&b.notCut&&b.decorate&&b.textSize<=18),'buttons stay legible, ornamented and on one line: '+JSON.stringify(result.controls));
  assert.ok(result.winnerScale>=1.23&&result.winnerScale<=1.27,'winner is 25% larger than last result layout');
  assert.ok(Math.abs(result.winnerCssScale-1.25)<.005,'winner enlargement comes from proportional uniform scaling');
  assert.ok(result.winnerAnchor.includes('100%')||result.winnerAnchor.endsWith('px'),'victory art has grounded origin');
  assert.equal(result.canvasObjectFit,'contain','sprite source must retain natural aspect inside portrait viewport');
  // Career victory must visibly present ALL five items, with correct tiers
  // and no earned item lost at a cramped mobile result viewport.
  const inventory=await page.evaluate(()=>{
   const S=window.__arenaQA.state;
   S.careerMatch=true;S.careerRewardApplied=true;
   S.matchGold=512;S.matchLoot=[
    {id:'iron',rarity:'common',count:1},
    {id:'trainer_blade',rarity:'rare',count:1},
    {id:'venatio_blade',rarity:'rare',count:2},
    {id:'blood_oath',rarity:'epic',count:1},
    {id:'imperial_aquila',rarity:'relic',count:1}
   ];
   S.crowd={score:93,total:93,variety:7,counts:{clash:13,parry:3,reversal:1}};
   S.resultWin=true;S.resultApplied=true;S.phase='result';
   window.__arenaQA.showEnd();
   const modal=document.getElementById('endScreen');
   const panel=document.querySelector('.stage-panel-ending');
   const tray=document.getElementById('endLoot');
   const rect=panel.getBoundingClientRect(),trayRect=tray.getBoundingClientRect();
   const cards=[...tray.querySelectorAll('.arena-loot-drop')];
   const cardBoxes=cards.map(x=>x.getBoundingClientRect());
   const row=tray.querySelector('.arena-loot-items').getBoundingClientRect();
   const stats=panel.querySelector('#endStats').getBoundingClientRect();
   const buttons=modal.querySelector('.end-actions').getBoundingClientRect();
   const actionLabels=[...modal.querySelectorAll('.end-actions button')].map(el=>({
    text:el.textContent,size:parseFloat(getComputedStyle(el).fontSize),
    overflow:el.scrollWidth>el.clientWidth+2,
    whiteSpace:getComputedStyle(el).whiteSpace
   }));
   const reason=panel.querySelector('#endReason'),reasonCss=getComputedStyle(reason);
   const statsCss=getComputedStyle(panel.querySelector('#endStats'));
   const coin=tray.querySelector('.arena-loot-coin');
   const isCentered=boxes=>boxes.length&&Math.abs((boxes[0].left+boxes.at(-1).right)/2-(row.left+row.right)/2)<3;
   const oneRow=boxes=>boxes.every(rect=>Math.abs(rect.top-boxes[0].top)<2);
   const equalWidths=boxes=>boxes.every(rect=>Math.abs(rect.width-boxes[0].width)<2);
   const wide={oneRow:oneRow(cardBoxes),sameWidth:equalWidths(cardBoxes),centered:isCentered(cardBoxes),
     textNotOverlapped:buttons.top>=rect.bottom+2&&buttons.top>=stats.bottom-2,
     actionNotOverLoot:buttons.bottom<=trayRect.top-2,
     compactCopy:parseFloat(reasonCss.fontSize)<=15&&parseFloat(statsCss.fontSize)<=15&&Number(reasonCss.fontWeight)<800,
     actionLabels,
     coinText:coin?.innerText,coinIcon:!!coin?.querySelector('.arena-loot-coin-icon'),
     noOverflow:cardBoxes.every(box=>box.left>=row.left-2&&box.right<=row.right+2)};

   // Test the longest actual beast-hunt label without changing a fighter,
   // then restore the text before verifying idempotent reward rendering.
   const again=modal.querySelector('#againBtn');
   const previous=again.textContent;
   again.textContent='야수 선택';
   const beastSafe=again.scrollWidth<=again.clientWidth+2&&getComputedStyle(again).whiteSpace==='nowrap';
   again.textContent=previous;
   const before=tray.innerText;
   window.__arenaQA.showEnd();
   const after=tray.innerText;
   const counts=[];
   const completeDrops=S.matchLoot.slice();
   for(const n of [0,1,2,3,4]){
    S.matchLoot=completeDrops.slice(0,n);
    window.__arenaQA.showEnd();
    const children=[...tray.querySelectorAll('.arena-loot-drop')],boxes=children.map(x=>x.getBoundingClientRect());
    counts.push({n,cardCount:children.length,oneRow:oneRow(boxes),sameWidth:equalWidths(boxes),centered:isCentered(boxes),
     coin:children[0]?.classList.contains('arena-loot-coin')});
   }
   S.matchLoot=completeDrops;
   window.__arenaQA.showEnd();
   return {cards:cards.length,wide,counts,beastSafe,
    ids:cards.slice(1).map(x=>x.querySelector('img')?.getAttribute('src')),
    labels:cards.map(x=>x.innerText),
    visible:!tray.hidden,
    score:tray.querySelector('.arena-loot-heading')?.innerText,
    containsD:before.includes('512'),
    idempotent:before===after,
    panelWithin:rect.left>=0&&rect.top>=0&&rect.right<=innerWidth+1&&rect.bottom<=innerHeight+1,
    trayWithin:trayRect.left>=0&&trayRect.top>=0&&trayRect.right<=innerWidth+1&&trayRect.bottom<=innerHeight+1,
    overflow:getComputedStyle(modal).overflowY,
    artAspect:rect.width/rect.height,
    totalAccessible:modal.scrollHeight>=modal.clientHeight,
    selectionCap:cards.length===6};
  });
  assert.equal(inventory.cards,6,'one denarius icon plus five won items occupy six cards');
  assert.equal(inventory.beastSafe,true,'beast selection button must fit on one line');
  assert.equal(inventory.selectionCap,true);
  assert.equal(inventory.wide.oneRow,true,'the six reward slots stay on one row');
  assert.equal(inventory.wide.sameWidth,true,'all six reward slots have identical width');
  assert.equal(inventory.wide.centered,true,'six reward slots form a centered strip');
  assert.equal(inventory.wide.noOverflow,true,'all six cards fit within reward container');
  assert.equal(inventory.wide.coinIcon,true,'denarii card has a visible coin icon');
  assert.match(inventory.wide.coinText,/512/,'the coin card displays earned denarii');
  assert.equal(inventory.wide.textNotOverlapped,true,'buttons clear the result text and bottom painted frame');
  assert.equal(inventory.wide.actionNotOverLoot,true,'buttons fit in their own gap above the loot tray');
  assert.equal(inventory.wide.compactCopy,true,'result reason and statistics use restrained non-bold typography');
  assert(inventory.wide.actionLabels.every(x=>!x.overflow&&x.whiteSpace==='nowrap'&&x.size<=18),
   'career buttons cannot clip or wrap: '+JSON.stringify(inventory.wide.actionLabels));
  for(const test of inventory.counts){
   assert.equal(test.cardCount,test.n+1,'one coin + '+test.n+' earned gear icons');
   assert(test.oneRow&&test.sameWidth&&test.centered&&test.coin,
    'partial loot must be centered, one row, same sized, coin first: '+JSON.stringify(test));
  }
  assert.equal(inventory.visible,true);
  assert.equal(inventory.containsD,true);
  assert.ok(inventory.score.includes('5개 전리품 잭팟'),JSON.stringify(inventory));
  assert.equal(inventory.idempotent,true,'reopening results cannot duplicate reward cards');
  assert.equal(inventory.panelWithin,true,'the approved 4:3 frame fits the viewport');
  assert.ok(Math.abs(inventory.artAspect-4/3)<.015,'reward cards never distort approved artwork');
  assert.equal(inventory.trayWithin,true,'all loot is placed below the frame within viewport');
  assert.equal(inventory.overflow,'auto','the combined result overlay remains vertically scrollable');
  assert.equal(inventory.ids.every(Boolean),true);
  console.log('RESULT_FIVE_LOOT_QA_PASS '+JSON.stringify({viewport:size,inventory}));
  console.log('RESULT_RASTER_QA_PASS '+JSON.stringify({viewport:size,...result}));
  if(preview&&process.env.RESULT_PREVIEW==='1'){
   const buffer=await page.screenshot({type:'jpeg',quality:75});
   console.log('RESULT_RASTER_PREVIEW_JPEG:'+buffer.toString('base64'));
  }
 }finally{await page.close()}
}
try{
 await check({width:1182,height:1312},true);
 await check({width:390,height:844},false);
}finally{await browser.close()}
