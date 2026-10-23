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
async function commit(token){
 const headers={'Accept':'application/vnd.github+json',
  'Authorization':'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28'};
 const get=await fetch(api+'?ref=main&ts='+Date.now(),{headers,cache:'no-store'});
 if(!get.ok)throw Error('GitHub 원본 버전 확인 실패 (HTTP '+get.status+'). 저장소 읽기·쓰기 권한을 확인하세요');
 const old=await get.json();
 if(!/^[0-9a-f]{40}$/.test(old.sha||''))throw Error('저장소 파일 버전을 확인할 수 없습니다');
 const response=await fetch(api,{method:'PUT',headers:{...headers,'Content-Type':'application/json'},
  body:JSON.stringify({message:'chore(scale): publish 31 calibrated original sizes',
   content:base64(source()),sha:old.sha,branch:'main'})});
 if(!response.ok)throw Error('GitHub 커밋 실패 (HTTP '+response.status+
  '). 저장소 Contents 쓰기 권한 또는 main 브랜치 보호 정책을 확인하세요');
 const data=await response.json();
 if(!data.commit?.sha)throw Error('GitHub 저장 응답에 커밋 번호가 없습니다');
 return data.commit.sha;
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
  const sha=await commit(secret);
  studio()?.saveDraft?.();
  auth.hidden=true;
  describe('GitHub 원본 저장 성공 · 커밋 '+sha.slice(0,12)+
   '. 이 설정은 모든 기기에 배포될 기준값입니다. Cloudflare Pages 배포 후 다른 기기에 반영됩니다.','success');
 }catch(error){describe(error?.message||String(error),'error')}
 finally{token.value='';save.disabled=false}
});
$('#githubEdit')?.addEventListener('click',async()=>{
 const text=source();
 try{
  await navigator.clipboard.writeText(text);
  describe('GitHub 원본 파일을 복사했습니다. 열린 GitHub 편집기에서 전체 내용을 붙여넣고 Commit changes를 누르세요.');
 }catch(_){
  const blob=new Blob([text],{type:'text/javascript'}),url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='practice-scale-published.js';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1200);
  describe('원본 설정 JS 파일을 저장했습니다. GitHub 편집기를 열어 파일 내용을 붙여넣고 Commit changes를 누르세요.');
 }
 root.open(editor,'_blank','noopener,noreferrer');
});
root.SpartacusScalePublisher={source,commit};
})(typeof window!=='undefined'?window:globalThis);
