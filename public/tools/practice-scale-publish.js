/* Spartacus artist-only GitHub source publisher.
 * No token or credentials are written to storage, bundled or transmitted
 * anywhere except github.com API. All commits are SHA-checked on main.
 */
(function(root){'use strict';
const repo='ZKrupinski/gladiator-arena';
const path='public/practice-scale-published.js';
const api='https://api.github.com/repos/'+repo+'/contents/'+path;
const editor='https://github.com/'+repo+'/edit/main/'+path;
const $=selector=>document.querySelector(selector);
const studio=()=>root.SpartacusScaleStudio;
const request=(url,options={})=>fetch(url,{...options,signal:root.AbortSignal?.timeout?.(15000)});
function describe(message,kind=''){
 const target=$('#publishStatus');
 if(target){target.className=kind;target.textContent=message}
}
function source(){
 const apiScale=root.PracticeScaleProfiles;
 const current=studio()?.values?.();
 if(!current||!apiScale)throw Error('보정실 크기 설정에 접근할 수 없습니다');
 const accepted={};
 for(const key of Object.keys(apiScale.DEFAULTS)){
  const n=Number(current[key]);
  if(!Number.isFinite(n))throw Error(key+' 배율이 숫자가 아닙니다');
  accepted[key]=apiScale.clamp(n);
 }
 return '/* 31 author-approved Spartacus fighter, beast and executioner sizes.\n'+
 ' * Repository source-of-truth: GitHub main. No credentials stored.\n */\n'+
 '(function(root){"use strict";root.SpartacusPublishedScales=Object.freeze('+
 JSON.stringify(accepted,null,2)+');})(typeof window!=="undefined"?window:globalThis);\n';
}
function base64(text){
 const bytes=new TextEncoder().encode(text),chunk=8192;
 let binary='';
 for(let i=0;i<bytes.length;i+=chunk)
  binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));
 return btoa(binary);
}
async function commit(token,payload=source()){
 const headers={'Accept':'application/vnd.github+json',
  'Authorization':'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28'};
 const get=await request(api+'?ref=main&ts='+Date.now(),{headers,cache:'no-store'});
 if(!get.ok)throw Error('GitHub 원본 버전 확인 실패 (HTTP '+get.status+'). 저장소 읽기·쓰기 권한을 확인하세요');
 const old=await get.json();
 if(!/^[0-9a-f]{40}$/.test(old.sha||''))throw Error('저장소 파일 버전을 확인할 수 없습니다');
 const response=await request(api,{method:'PUT',headers:{...headers,'Content-Type':'application/json'},
  body:JSON.stringify({message:'chore(scale): publish 31 calibrated original sizes',
   content:base64(payload),sha:old.sha,branch:'main'})});
 if(!response.ok)throw Error('GitHub 커밋 실패 (HTTP '+response.status+
  '). 저장소 Contents 쓰기 권한 또는 main 브랜치 보호 정책을 확인하세요');
 const data=await response.json();
 if(!data.commit?.sha)throw Error('GitHub 저장 응답에 커밋 번호가 없습니다');
 const check=await request(api+'?ref='+data.commit.sha,{headers,cache:'no-store'});
 if(!check.ok)throw Error('GitHub 응답은 받았으나 저장 내용 재확인에 실패했습니다. 상태 다시 확인을 누르세요.');
 const stored=await check.json();
 if(decode(stored.content)!==payload)throw Error('GitHub 저장 내용이 요청한 배율과 일치하지 않습니다.');
 return data.commit.sha;
}
let repositoryValues=null,liveValues=null,repoError='',liveError='',checking=false;
let lastCommit='',poll=null,pollCount=0;
function decode(content){return new TextDecoder().decode(Uint8Array.from(atob((content||'').replace(/\s/g,'')),c=>c.charCodeAt(0)));}
function valuesFrom(text){
 const match=text.match(/SpartacusPublishedScales\s*=\s*Object\.freeze\(\s*(\{[\s\S]*?\})\s*\)/);
 if(!match)throw Error('저장 파일 형식을 확인할 수 없습니다');
 const data=JSON.parse(match[1]),defaults=root.PracticeScaleProfiles.BASE,out={};
 for(const key of Object.keys(defaults)){
  const n=Object.hasOwn(data,key)?data[key]:defaults[key];
  if(typeof n!=='number'||!Number.isFinite(n)||n<.65||n>1.85)throw Error('저장 배율이 올바르지 않습니다');
  out[key]=n;
 }
 return out;
}
function same(a,b){return !!a&&!!b&&Object.keys(root.PracticeScaleProfiles.DEFAULTS).every(k=>Math.abs(Number(a[k])-Number(b[k]))<1e-8);}
function health(id,text,state){const el=$('#'+id);if(el){el.textContent=text;el.dataset.state=state;}}
function refreshHealth(){
 const now=studio()?.values?.();if(!now)return;
 const local={...root.PracticeScaleProfiles.DEFAULTS,...root.PracticeScaleProfiles.read()};
 health('draftHealth',same(now,local)?'✓ 이 기기: 현재 배율과 적용값 일치':'● 이 기기: 수정한 배율 미저장',same(now,local)?'ok':'warn');
 const repoMatch=same(now,repositoryValues),liveMatch=same(now,liveValues);
 health('repoHealth',repositoryValues?(repoMatch?'✓ GitHub: 현재 배율 저장 확인':'● GitHub: 현재 수정값과 다름 · 원본 게시 필요')+(lastCommit?' · '+lastCommit.slice(0,8):''):
  'GitHub: '+(repoError||'확인 중'),repositoryValues?(repoMatch?'ok':'warn'):repoError?'error':'warn');
 health('liveHealth',liveValues?(liveMatch?'✓ 게임 배포: 현재 배율 반영 확인':repoMatch?'◷ 게임 배포: GitHub 저장 완료 · 배포 대기':'● 게임 배포: 현재 수정값 미반영'):
  '게임 배포: '+(liveError||'확인 중'),liveValues?(liveMatch?'ok':'warn'):liveError?'error':'warn');
}
async function verifySaved(){
 if(checking)return;checking=true;
 const button=$('#verifySaved');if(button)button.disabled=true;
 await Promise.allSettled([
  (async()=>{try{
   const response=await request(api+'?ref=main&ts='+Date.now(),{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
   if(!response.ok)throw Error('확인 불가 (HTTP '+response.status+') · 다시 확인하세요');
   repositoryValues=valuesFrom(decode((await response.json()).content));repoError='';
  }catch(e){repositoryValues=null;repoError=e.message;}})(),
  (async()=>{try{
   const response=await request('../practice-scale-published.js?verify='+Date.now(),{cache:'no-store'});
   if(!response.ok)throw Error('확인 불가 (HTTP '+response.status+')');
   liveValues=valuesFrom(await response.text());liveError='';
  }catch(e){liveValues=null;liveError=e.message;}})()
 ]);
 checking=false;if(button)button.disabled=false;refreshHealth();
 if(same(studio()?.values?.(),repositoryValues)&&same(studio()?.values?.(),liveValues)&&lastCommit){
  describe('✓ GitHub 저장과 게임 배포 확인 완료 · 커밋 '+lastCommit.slice(0,12),'success');
  clearTimeout(poll);poll=null;
 }
}
function watchDeployment(){
 clearTimeout(poll);pollCount=0;
 const check=async()=>{await verifySaved();
  if(!same(repositoryValues,liveValues)&&++pollCount<18)poll=setTimeout(check,5000);
 };check();
}
const open=$('#publishOpen'),auth=$('#gitAuth'),token=$('#githubToken'),save=$('#publishConfirm');
if(!open||!auth||!token||!save)return;
open.addEventListener('click',()=>{
 auth.hidden=!auth.hidden;if(!auth.hidden)token.focus();
});
$('#publishCancel')?.addEventListener('click',()=>{token.value='';auth.hidden=true});
save.addEventListener('click',async()=>{
 const secret=token.value.trim();
 if(!secret){describe('GitHub Contents 쓰기 권한 인증이 필요합니다. 인증 없이 진행하려면 GitHub 편집기를 사용하세요.','error');token.focus();return}
 save.disabled=true;describe('GitHub main에 실제 원본 커밋을 등록하고 확인하는 중입니다.');
 try{
  const payload=source();
  const sha=await commit(secret,payload);
  lastCommit=sha;repositoryValues=valuesFrom(payload);refreshHealth();
  auth.hidden=true;
  describe('GitHub 원본 저장 성공 · 커밋 '+sha.slice(0,12)+
   '. 저장 내용을 재확인했습니다. 게임 배포는 별도로 확인 중입니다.','success');
  watchDeployment();
 }catch(error){describe(error?.message||String(error),'error');health('repoHealth','⚠ GitHub 저장 확인 실패 · 아래 오류 안내를 확인하세요','error')}
 finally{token.value='';save.disabled=false}
});
$('#githubEdit')?.addEventListener('click',async()=>{
 const text=source();
 // Open synchronously from the click gesture; browsers can block windows
 // opened only after an awaited clipboard permission dialog.
 root.open(editor,'_blank','noopener,noreferrer');
 try{
  await navigator.clipboard.writeText(text);
  describe('GitHub 원본 파일을 복사했습니다. 열린 GitHub 편집기에서 전체 내용을 붙여넣고 Commit changes를 누르세요.');
 }catch(_){
  const blob=new Blob([text],{type:'text/javascript'}),url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='practice-scale-published.js';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1200);
  describe('원본 설정 JS 파일을 저장했습니다. GitHub 편집기를 열어 파일 내용을 붙여넣고 Commit changes를 누르세요.');
 }
});
$('#verifySaved')?.addEventListener('click',verifySaved);
document.addEventListener('input',e=>{if(e.target?.id!=='githubToken')refreshHealth();});
document.addEventListener('click',()=>setTimeout(refreshHealth,0));
root.SpartacusScalePublisher={source,commit,valuesFrom,same,verifySaved};
verifySaved();
})(typeof window!=='undefined'?window:globalThis);
