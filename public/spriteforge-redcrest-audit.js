/* SpriteForge V3 — published Redcrest Murmillo 9x8 non-destructive audit.
 * Inspection is not approval. This tool never rewrites / rescales source pixels.
 * 4x2 cells here are ALREADY EXPORTED image slots; new generated source art must
 * pass scripts/spriteforge_connected_mask_v6.py before importing into a release.
 */
(function(root){'use strict';
const CHARACTER='murmillo_redcrest_new_v1';
const ACTIONS=['idle','walk','slash','sweep','thrust','heavy','guard','hit','death'];
const BASE='assets/combat/murmillo-redcrest-v1/';
const $=id=>document.getElementById(id);
const descriptions={idle:'대기',walk:'걷기',slash:'종베기',sweep:'횡베기',thrust:'찌르기',heavy:'강베기',guard:'방어',hit:'피격',death:'사망'};
const fps={idle:6,walk:9,slash:14,sweep:14,thrust:14,heavy:12,guard:7,hit:10,death:10};
let records={},frames=[],action='',playing=false,animation=0,lastIndex=-1,inspectBusy=false;
function status(message){const e=$('redcrestStatus');if(e)e.textContent=message;}
function create(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function loadImage(path){return new Promise((resolve,reject)=>{
 const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('파일을 불러올 수 없음: '+path));
 img.src=path+'?v=20261027-redcrest-v1';
});}
function inspectFrame(c,index){
 const ctx=c.getContext('2d',{willReadFrequently:true}),w=c.width,h=c.height;
 const rgba=ctx.getImageData(0,0,w,h).data;
 let minX=w,minY=h,maxX=-1,maxY=-1,count=0,hash=2166136261>>>0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const k=4*(y*w+x),a=rgba[k+3];if(a<=31)continue;
  count++;if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
  if((x&7)===0&&(y&7)===0) {
   hash=Math.imul((hash^(rgba[k+0]+rgba[k+1]*3+rgba[k+2]*5+a*7))>>>0,16777619)>>>0;
  }
 }
 const margins=count?[minX,minY,w-1-maxX,h-1-maxY]:[0,0,0,0];
 const issues=[];
 if(count<Math.max(50,w*h*.0005))issues.push('EMPTY_OR_TINY');
 if(count&&Math.min(...margins)<8)issues.push('BORDER_TOUCH_REVIEW');
 return {index:index+1,alphaPixels:count,margins,issues,poseFingerprint:hash.toString(16)};
}
async function inspectAction(name,keepFrames=false){
 const im=await loadImage(BASE+name+'.png');
 if(!im.width||!im.height||im.width%4||im.height%2)throw Error('INVALID_4x2 '+name);
 const w=im.width/4,h=im.height/2,records=[],seen=new Set(),tiles=[];
 for(let i=0;i<8;i++){
  const c=create(w,h);
  c.getContext('2d').drawImage(im,(i%4)*w,Math.floor(i/4)*h,w,h,0,0,w,h);
  const r=inspectFrame(c,i);
  if(seen.has(r.poseFingerprint))r.issues.push('POSSIBLE_DUPLICATE');
  seen.add(r.poseFingerprint);records.push(r);
  if(keepFrames)tiles.push(c);
 }
 return {name,width:im.width,height:im.height,cellWidth:w,cellHeight:h,
  frames:8,checks:records,blocked:records.filter(r=>r.issues.length).length,tiles};
}
function renderResults(){
 const host=$('redcrestActions');if(!host)return;host.replaceChildren();
 for(const name of ACTIONS){
  const item=records[name],btn=document.createElement('button');
  btn.type='button';btn.className='secondary';
  btn.style.cssText='text-align:left;min-height:62px';
  btn.textContent=descriptions[name]+' · '+name+' — '+(!item?'미확인':item.error?'파일 오류':item.blocked?'경계 검토 '+item.blocked+'/8':'8/8 경계 통과');
  if(item?.blocked||item?.error)btn.style.borderColor='#e07860';
  btn.onclick=()=>preview(name);host.append(btn);
 }
}
function paint(i){
 const stage=$('redcrestStage');if(!stage||!frames.length)return;
 const fr=frames[i%8];if(!fr)return;
 if(stage.width!==fr.width||stage.height!==fr.height){stage.width=fr.width;stage.height=fr.height;}
 const ctx=stage.getContext('2d');ctx.clearRect(0,0,stage.width,stage.height);
 ctx.drawImage(fr,0,0);
 const indicator=$('redcrestFrameLabel');if(indicator)indicator.textContent=descriptions[action]+' · '+(i%8+1)+'/8 · 원본 픽셀 그대로';
}
function loop(timestamp){
 if(!playing||!frames.length)return;
 const i=Math.floor(timestamp/1000*(fps[action]||8))%8;
 if(i!==lastIndex){paint(i);lastIndex=i}
 animation=requestAnimationFrame(loop);
}
async function preview(name){
 playing=false;cancelAnimationFrame(animation);status(descriptions[name]+' 8프레임 불러오는 중…');
 try {
  const item=await inspectAction(name,true);
  records[name]={...item,tiles:undefined};action=name;frames=item.tiles;lastIndex=-1;paint(0);
  status(descriptions[name]+' · '+(item.blocked?'경계 위험 '+item.blocked+'개 — 정식 V6 검수 필요':'셀 경계 이상 없음')+' · 8프레임 그대로 재생');
  playing=true;animation=requestAnimationFrame(loop);renderResults();
 }catch(e){frames=[];status('동작 미리보기 실패: '+e.message);}
}
async function inspectAll(){
 if(inspectBusy)return;inspectBusy=true;playing=false;cancelAnimationFrame(animation);
 const run=$('redcrestRunQA');if(run)run.disabled=true;
 records={};renderResults();
 for(let i=0;i<ACTIONS.length;i++){
  const name=ACTIONS[i];status('출시 PNG 검사 '+(i+1)+'/9 · '+descriptions[name]);
  try{
   const data=await inspectAction(name,false);records[name]={...data,tiles:undefined};
  }catch(e){records[name]={error:e.message,blocked:8,frames:0}}
  renderResults();
 }
 const fail=ACTIONS.filter(a=>records[a].blocked||records[a].error);
 const flagged=fail.length;
 status('9개 동작 / 각 8프레임 확인. '+(flagged?'경계 또는 파일 경고 '+flagged+'종 ('+fail.join(', ')+'); 승인 아님.':'셀 경계 경고 0종; 아트 육안 검수와 V6 승인 별도 필요.')+' 기존 리소스는 수정하지 않음.');
 const report={character:CHARACTER,inspector:'SpriteForge V3 published-asset audit',approved:false,
  actions:records,blocking:fail,coreActions:ACTIONS,generatedFrames:0,sourceArtRewritten:false,
  note:'검수용. 4x2 rectangular crop is allowed only for already-exported padded slot art. Original overlapping artwork requires V6 full-alpha connected ownership.'};
 root.SpriteForgeRedcrestQA={character:CHARACTER,report:()=>report,preview,inspectAll};
 if(run)run.disabled=false;inspectBusy=false;
}
function init(){
 if(!$('redcrestRunQA'))return;
 $('redcrestRunQA').onclick=inspectAll;
 $('redcrestDownloadQA').onclick=()=>{
  const payload=JSON.stringify(root.SpriteForgeRedcrestQA?.report?.()||{approved:false,missing:true},null,2);
  const u=URL.createObjectURL(new Blob([payload],{type:'application/json'}));
  const a=document.createElement('a');a.href=u;a.download='murmillo-redcrest-spriteforge-QA.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
 };
 $('redcrestOpenGame').href='./?redcrestQA=1';
 const q=new URLSearchParams(location.search);
 if(q.get('character')===CHARACTER)inspectAll();
}
root.SpriteForgeRedcrestQA={character:CHARACTER,preview,inspectAll,report:()=>({approved:false,uninspected:true})};
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();}
})(typeof window!=='undefined'?window:globalThis);
