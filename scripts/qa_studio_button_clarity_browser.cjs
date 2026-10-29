'use strict';
// v131: verify UI copy conveys actual effect, scope, and save target,
// while actual buttons remain wired and navigable after wording changes.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
(async()=>{
 const root=path.resolve('public');
 const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,data)=>{
   if(err){res.writeHead(404);res.end();return;}
   const ext=path.extname(file);
   res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp'})[ext]||'application/octet-stream');
   res.end(data);
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1390,height:920}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/tools/practice-scale-calibrator.html',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.SpartacusScaleStudio && document.querySelectorAll('#grid .card').length>=30 && document.querySelector('#publishConfirm'),null,{timeout:90000});
  const observed=await page.evaluate(()=>{
   const $=s=>document.querySelector(s),app=window.SpartacusScaleStudio;
   const snapshot=()=>JSON.stringify({values:app.values(),feet:app.feet(),actions:app.actions(),price:app.priceLevels()});
   const required={
    checkAll:['목록의 캐릭터 전부 체크','모든 캐릭터'],
    clearChecks:['모든 체크 해제','값은 지우지'],
    shuffle:['카드 표시 순서 섞기','배치 순서만'],
    bulkReset:['체크한 크기만 기본값 복원','발높이'],
    bulkFootReset:['체크한 발높이 기본값 복원','기본값이 0이 아닐'],
    compareDefaults:['체크 해제하고 기본 4명 비교','체크를 전부 해제'],
    motionAdd:['현재 재생 시점에 위치 키 추가','이동 키'],
    motionDelete:['선택한 위치 키 삭제','키 하나'],
    bulkCopyFx:['현재 동작 이펙트 → 체크한 검투사에게 복사','이동 키는 유지'],
    bulkCopyAllFx:['전체 15동작 이펙트만 → 체크한 검투사에게 복사','이동 키는 복사하지'],
    publishOpen:['GitHub 직접 게시 (토큰 입력)','버튼만 눌러서는 게시되지'],
    githubEdit:['GitHub 편집기 열기·내용 복사','붙여넣기'],
    publishConfirm:['현재 수정값을 GitHub main에 저장','실제 커밋'],
    save:['현재 수정값 이 기기에 저장','이 브라우저에만'],
    reset:['이 기기 수정값 전체 초기화','확인창'],
    actionReset:['현재 동작의 위치·이펙트만 기본값 복원','다른 동작'],
    actionPreviewRefresh:['현재 동작 그림 다시 불러오기','저장한 키'],
    registerGladiatorSubmit:['9종 이미지 검사 후 이 기기에 외형 등록','원격 저장은 별도'],
    actionShowIdle:['대기(기본) 동작으로 전환','대기(idle)'],
    verifySaved:['GitHub 원본과 현재 값 비교','새로 저장하지'],
    export:['설정 백업 JSON 다운로드','JSON 백업'],
    import:['설정 백업 JSON 불러와 적용','백업 파일'],
    undoEdit:['마지막 수정 취소','되돌립니다'],
    redoEdit:['취소한 수정 다시 적용','다시 적용합니다']
   };
   const labels=[];
   for(const [id,[caption,hint]] of Object.entries(required)){
    const btn=$('#'+id);
    if(!btn)throw Error('Missing button: '+id);
    if(btn.textContent.trim()!==caption)throw Error('Misleading label: '+id+' = '+btn.textContent);
    if(!btn.title.includes(hint))throw Error('Missing scope help: '+id+' = '+btn.title);
    if(btn.getAttribute('aria-description')!==btn.title)throw Error('Accessible description missing: '+id);
    labels.push(id);
   }
   const card=$('#grid .card'),cardActions=[...card.querySelectorAll('button')];
   if(cardActions.length<7)throw Error('Expected individual adjustment buttons');
   for(const btn of cardActions)if(!btn.title||!btn.getAttribute('aria-description'))
    throw Error('Missing individual button help: '+btn.textContent);
   const old=snapshot(),cards=document.querySelectorAll('#grid .card').length;
   $('#checkAll').click();
   const allChecked=[...document.querySelectorAll('#grid .card input[type=checkbox]')].filter(x=>x.checked).length;
   const bulkEnabled=!$('#bulkPlus').disabled&&!$('#bulkReset').disabled;
   $('#compareDefaults').click();
   const checkedAfterDefault=[...document.querySelectorAll('#grid .card input[type=checkbox]')].filter(x=>x.checked).length;
   const unchangedAfterCompare=snapshot()===old;
   $('#shuffle').click();
   const unchangedAfterShuffle=snapshot()===old;
   const beforeAuth=$('#gitAuth').hidden;$('#publishOpen').click();
   const opened=!$('#gitAuth').hidden;$('#publishCancel').click();const closed=$('#gitAuth').hidden;
   let confirmCalled=0;window.confirm=()=>{confirmCalled++;return false;};
   $('#reset').click();const unchangedAfterCancelledReset=snapshot()===old;
   const play=$('#actionPlay');play.click();const paused=play.textContent;
   play.click();const resumed=play.textContent;
   const ghost=$('#actionGhost');ghost.click();const off=ghost.textContent;
   ghost.click();const on=ghost.textContent;
   return {labels,cards,cardButtons:cardActions.map(b=>b.textContent.trim()),
    allChecked,bulkEnabled,checkedAfterDefault,unchangedAfterCompare,
    unchangedAfterShuffle,beforeAuth,opened,closed,confirmCalled,
    unchangedAfterCancelledReset,paused,resumed,on,off};
  });
  assert.equal(observed.labels.length,24);
  assert.equal(observed.allChecked,observed.cards);
  assert(observed.bulkEnabled);
  assert.equal(observed.checkedAfterDefault,0);
  assert(observed.unchangedAfterCompare);
  assert(observed.unchangedAfterShuffle);
  assert(observed.beforeAuth&&observed.opened&&observed.closed);
  assert.equal(observed.confirmCalled,1);
  assert(observed.unchangedAfterCancelledReset);
  assert(observed.paused.includes('미리보기 재생'));
  assert(observed.resumed.includes('미리보기 일시정지'));
  assert(observed.on.includes('켜짐')&&observed.off.includes('꺼짐'));
  await page.setViewportSize({width:390,height:844});
  const mobile=await page.evaluate(()=>{
   const ids=['bulkCopyFx','bulkCopyAllFx','save','reset','publishOpen','githubEdit'];
   return ids.map(id=>{
    const el=document.getElementById(id),rect=el.getBoundingClientRect(),computed=getComputedStyle(el);
    return {id,width:rect.width,height:rect.height,text:el.textContent.trim(),fontSize:parseFloat(computed.fontSize)};
   });
  });
  for(const item of mobile){
   assert(item.width>75,'button has usable mobile width: '+JSON.stringify(item));
   assert(item.height>=36,'button allows wrapped mobile text: '+JSON.stringify(item));
   assert(item.fontSize>=12,'button text readable on mobile: '+JSON.stringify(item));
  }
  assert.deepEqual(errors,[],'no runtime errors from changed labels and controls');
  console.log('PASS v131: 24 scoped action labels + 7 individual actions, non-destructive comparison/reorder/reset cancel, playback toggle, authentication input and mobile wrapping');
  console.log(JSON.stringify({labelCount:observed.labels.length,individual:observed.cardButtons,checked:observed.allChecked,paused:observed.paused,mobile},null,2));
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
