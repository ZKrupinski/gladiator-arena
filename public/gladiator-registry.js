/* Spartacus unified appearance registry.
 * One identity table feeds the slave market, training, roster, duel, squad
 * battles, sprite/calibration studio and market prices.
 * A studio or game contribution is stored once and reused across surfaces.
 * This registry never invents artwork or substitutes another fighter's image.
 */
(function(root){'use strict';
const KEY='spartacus.gladiators.registry.v1';
const CLASS_LABELS=Object.freeze({murmillo:'무르밀로',thraex:'트라엑스',retiarius:'레티아리우스'});
const CLASS_GROWTH=Object.freeze({murmillo:'murmillo_a',thraex:'thraex_a',retiarius:'retiarius_a'});
const ACTIONS=Object.freeze(['idle','walk','slash','sweep','thrust','heavy','guard','hit','death']);
const BASE=Object.freeze([
 ...[
  ['murmillo','murmillo_a','무르밀로 A'],
  ['thraex','thraex_a','트라엑스 A'],
  ['thraex','thraex_b','트라엑스 B'],
  ['retiarius','retiarius_a','레티아리우스 A']
 ].flatMap(([cls,growthType,label])=>Array.from({length:5},(_,i)=>Object.freeze({
  cls,visualId:growthType+'_L'+(i+1),growthType,label:label+' · 외형 '+(i+1),
  appearance:null,kind:'growth',special:false,priceLevel:[1,2,2,3,3][i]
 }))),
 ...[
  ['murmillo_champion_red','붉은 투구 챔피언',5],
  ['murmillo_redcrest_new_v1','신규 붉은투구 무르밀로',4],
  ['murmillo_redcrest_alt_v1','레드크레스트 II',4],
  ['murmillo_motion_v3','모션 무르밀로',4]
 ].map(([visualId,label,priceLevel])=>Object.freeze({
  cls:'murmillo',visualId,growthType:'murmillo_a',appearance:visualId,
  label,kind:'special',special:true,priceLevel
 })),
 ...Object.keys(CLASS_LABELS).map(cls=>Object.freeze({
  cls,visualId:'legacy_'+cls,growthType:CLASS_GROWTH[cls],appearance:'legacy',
  label:'클래식 '+CLASS_LABELS[cls],kind:'legacy',special:true,priceLevel:3
 }))
]);
const BUILTIN_IDS=new Set(BASE.map(x=>x.visualId));
const BUILTIN_FOLDERS=new Set([
 'assets/combat/champion-murmillo','assets/combat/murmillo-redcrest-v1',
 'assets/combat/murmillo-redcrest-alt-v1','assets/combat/murmillo-b',
 'assets/combat/murmillo-v2'
]);
const isId=v=>typeof v==='string'&&/^[a-z][a-z0-9_]{2,47}$/.test(v);
const safeName=v=>typeof v==='string'&&v.trim().length>=2&&v.trim().length<=44&&
 !/[<>\\]/.test(v);
const safeFolder=v=>typeof v==='string'&&
 /^assets\/combat\/[a-z][a-z0-9_-]{2,60}$/.test(v)&&!BUILTIN_FOLDERS.has(v);
function validate(record){
 if(!record||typeof record!=='object'||Array.isArray(record))
  throw Error('검투사 외형 등록 정보가 올바르지 않습니다.');
 const visualId=String(record.visualId||record.id||'').trim(),
  cls=String(record.cls||'').trim(),label=String(record.label||'').trim(),
  assetFolder=String(record.assetFolder||'').trim().replace(/\/$/,'');
 if(!isId(visualId)||BUILTIN_IDS.has(visualId))
  throw Error('신규 외형 ID는 영문 소문자·숫자·밑줄로 만든 고유 ID여야 합니다.');
 if(!Object.hasOwn(CLASS_LABELS,cls))throw Error('현재 전투 규칙에 등록된 검투사 클래스만 선택할 수 있습니다.');
 if(!safeName(label))throw Error('외형 이름은 2~44자이며 HTML 태그는 사용할 수 없습니다.');
 if(!safeFolder(assetFolder))throw Error('전용 스프라이트 경로는 assets/combat/고유폴더 형식이어야 합니다.');
 const priceLevel=Number(record.priceLevel??2);
 if(!Number.isInteger(priceLevel)||priceLevel<1||priceLevel>5)throw Error('가격레벨은 1~5여야 합니다.');
 return Object.freeze({
  visualId,cls,label,kind:'custom',special:true,appearance:visualId,
  growthType:CLASS_GROWTH[cls],assetFolder,priceLevel
 });
}
function sanitize(value){
 if(!Array.isArray(value))return [];
 const out=[],ids=new Set(),folders=new Set();
 for(const item of value){
  try{
   const entry=validate(item);
   if(ids.has(entry.visualId)||folders.has(entry.assetFolder))continue;
   ids.add(entry.visualId);folders.add(entry.assetFolder);out.push(entry);
  }catch(_){}
 }
 return out;
}
function read(){
 try{return sanitize(JSON.parse(root.localStorage?.getItem(KEY)||'[]'));}
 catch(_){return [];}
}
const published=sanitize(root.SpartacusPublishedGladiators||[]);
const listeners=new Set();
function entries(){
 const custom=published.map(x=>({...x})),seen=new Set(custom.map(x=>x.visualId));
 const folders=new Set(custom.map(x=>x.assetFolder));
 for(const v of read())if(!seen.has(v.visualId)&&!folders.has(v.assetFolder)){
  custom.push({...v});seen.add(v.visualId);folders.add(v.assetFolder);
 }
 return BASE.concat(custom);
}
function get(id){return entries().find(x=>x.visualId===String(id))||null;}
function market(){return entries().map(x=>({...x}));}
function custom(){return entries().filter(x=>x.kind==='custom');}
function ids(){return entries().map(x=>x.visualId);}
function subscribe(fn){if(typeof fn!=='function')return()=>{};listeners.add(fn);return()=>listeners.delete(fn);}
function notify(){for(const fn of listeners)try{fn(market());}catch(e){root.console?.warn?.(e);}}
function write(records){
 const cleaned=sanitize(records);
 if(!Array.isArray(records)||cleaned.length!==records.length)
  throw Error('중복 ID·이미지 경로 또는 잘못된 신규 외형이 있습니다.');
 const combined=[...published,...cleaned],used=new Set(),folders=new Set();
 for(const x of combined){
  if(used.has(x.visualId)||folders.has(x.assetFolder)){
   // Identical approved and locally edited registrations are allowed only when unchanged.
   const other=published.find(y=>y.visualId===x.visualId);
   if(!other||JSON.stringify(other)!==JSON.stringify(x))throw Error('게시된 외형 ID나 이미지 경로는 덮어쓸 수 없습니다.');
   continue;
  }
  used.add(x.visualId);folders.add(x.assetFolder);
 }
 if(!root.localStorage)throw Error('로컬 저장소에 접근할 수 없습니다.');
 root.localStorage.setItem(KEY,JSON.stringify(cleaned));
 notify();return market();
}
function register(record){
 const next=validate(record),prior=get(next.visualId);
 if(prior){
  if(JSON.stringify(prior)!==JSON.stringify(next))throw Error('등록된 외형 ID를 다른 그림으로 덮어쓸 수 없습니다.');
  return prior;
 }
 if(entries().some(x=>x.assetFolder===next.assetFolder))
  throw Error('이미 다른 외형에 배정된 스프라이트 폴더입니다.');
 write([...read(),next]);return next;
}
function remove(id){
 if(published.some(x=>x.visualId===id))throw Error('GitHub에 게시된 외형은 조정실 임시 설정으로 삭제할 수 없습니다.');
 write(read().filter(x=>x.visualId!==id));
}
function isCustom(id){return get(id)?.kind==='custom';}
function artPath(id,action='idle'){
 const item=get(id);
 if(item?.kind!=='custom'||!ACTIONS.includes(action))return null;
 return item.assetFolder+'/'+action+'.png';
}
async function verifyArt(record,{prefix=''}={}){
 const entry=validate(record);
 if(typeof Image==='undefined')return {ok:false,error:'이미지 검사는 브라우저에서만 지원합니다.'};
 for(const action of ACTIONS){
  const path=prefix+entry.assetFolder+'/'+action+'.png';
  try{
   const img=await new Promise((resolve,reject)=>{
    const item=new Image();
    item.onload=()=>resolve(item);
    item.onerror=()=>reject(Error(action+' 이미지 파일이 없습니다.'));
    item.src=path+'?check='+Date.now();
   });
   if(img.naturalWidth!==3840||img.naturalHeight!==1080)
    throw Error(action+'은 3840×1080 (4열×2행) 8프레임 투명 이미지여야 합니다.');
  }catch(e){return {ok:false,error:String(e.message||e),path};}
 }
 return {ok:true,record:entry};
}
if(root.addEventListener)root.addEventListener('storage',e=>{
 if(e.key===KEY)notify();
});
const api=Object.freeze({KEY,ACTIONS,BASE,CLASS_LABELS,CLASS_GROWTH,
 validate,sanitize,read,entries,market,custom,ids,get,register,write,remove,
 subscribe,isCustom,artPath,verifyArt});
root.SpartacusGladiators=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
