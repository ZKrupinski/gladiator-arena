const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const api=require('../public/ludus-roster.js');
for(let wins=0;wins<30;wins++)for(const level of [1,5,10,15,20]){
 const state={wins,roster:[]},enemy=api.encounter(state,{level},()=>.75);
 assert.equal(enemy.boss,(wins+1)%5===0);assert(enemy.level>=1&&enemy.level<=20);assert.equal(enemy.stage,api.stage(enemy.level));assert.equal(api.encounter(state,{level:1},()=>0),enemy);
 if(enemy.boss){const h=api.recruitBoss(state,enemy);assert.equal(h.appearance,'legacy');assert.equal(api.recruitBoss(state,enemy),null);}
}
const html=fs.readFileSync(require('node:path').join(__dirname,'../public/index.html'),'utf8');
const nodes={},cache={};let markup='';
const node=id=>nodes[id]??=( {addEventListener(){},setAttribute(){},getContext(){return {clearRect(){}};},style:{},classList:{add(){},remove(){},toggle(){}},value:'random',hidden:false,textContent:'',set innerHTML(v){markup=v;Object.keys(cache).forEach(k=>delete cache[k]);},get innerHTML(){return markup;}} );
const always=new Set(['marketEnter','careerRosterTab','careerTrainTab','careerFightTop','careerBody','careerHub','careerMini','startScreen','endScreen','classChoice','opponentChoice','pauseBtn']);
const doc={getElementById(id){return always.has(id)||markup.includes('id="'+id+'"')?node(id):null;},querySelectorAll(selector){
 if(!selector.startsWith('[data-')||selector==='[data-roster-art]')return [];
 if(cache[selector])return cache[selector];const attr=selector.slice(1,-1),key=attr.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
 return cache[selector]=[...markup.matchAll(new RegExp('<button[^>]*'+attr+'="([^"]+)"[^>]*>','g'))].map(m=>({dataset:{[key]:m[1]},disabled:m[0].includes('disabled')}));
}};
let shop;const saved={};const ctx={console,window:{SlaveMarket:{open(o){shop=o;}},LudusScene:{close(){},refresh(){}}},growthLoading:null,GROWTH_IMAGES:new Map(),LudusRoster:api,document:doc,$:sel=>doc.getElementById(sel.slice(1)),localStorage:{getItem:()=>null,setItem:(k,v)=>saved[k]=v},GEAR:[{id:'wood',slot:'weapon',atk:0,hp:0}],CLEANED_CHARACTER_URLS:{},ASSET:{},GROWTH_TYPES:{murmillo_a:'M',thraex_a:'T',retiarius_a:'R'},growthType:h=>h.growthType,growthImage:()=>null,refreshGrowthAvatar:()=>{},IMG:{},S:{keys:new Set(),phase:'title'},CAMERA:{},clock:0,fxSound(){},updateHud(){}};
vm.createContext(ctx);
vm.runInContext(html.slice(html.indexOf('const DATA='),html.indexOf('const FRAMES=')),ctx);
ctx.fighter=(cls,x)=>({cls,x,cfg:{...vm.runInContext('DATA',ctx)[cls]},maxHp:138,hp:138});
vm.runInContext(html.slice(html.indexOf("const CAREER_KEY="),html.indexOf('function startTraining(')),ctx);
vm.runInContext(html.slice(html.indexOf("function start(mode="),html.indexOf('function markManualInput(')),ctx);
const run=code=>vm.runInContext(code,ctx);
run('renderCareer();openSlaveMarket()');
shop.hire({id:'murmillo',name:'First',className:'M',cost:500});
shop.hire({id:'thraex',name:'Second',className:'T',cost:500});
assert.equal(run('CAREER.roster.length'),2);assert.equal(run('CAREER.gold'),2200);
doc.querySelectorAll('[data-select]')[0].onclick();assert.equal(run('CAREER.active'),0);
run('openCareerDraft()');assert.equal(doc.querySelectorAll('[data-deploy]').length,2);
doc.querySelectorAll('[data-deploy]')[1].onclick();assert.equal(ctx.S.careerParticipant,1);
run('CAREER.roster[1].injury=30;start("career")');
assert.equal(ctx.S.player.hp,run('careerHealth(CAREER.hero).current'));
const beforeInjury=run('CAREER.hero.injury');
assert(ctx.S.player.growthType);assert(ctx.S.enemy.growthType);
run('CAREER.active=0;S.resultWin=true;finishCareerMatch()');assert.equal(run('CAREER.roster[0].fights'),0);assert.equal(run('CAREER.roster[1].fights'),1);assert.equal(run('CAREER.roster[1].injury'),beforeInjury+8,'Existing injury must not be charged again');run('finishCareerMatch()');assert.equal(run('CAREER.fights'),1);
run('CAREER.wins=4;CAREER.pendingOpponent=null;CAREER.active=0;start("career")');assert(ctx.S.careerOpponent.boss);assert.equal(ctx.S.enemy.growthType,undefined);
run('S.resultWin=false;finishCareerMatch()');assert.equal(run('CAREER.roster.length'),2);assert.equal(run('CAREER.wins'),4);assert(run('CAREER.pendingOpponent.boss'));
run('CAREER.roster[0].injury=0;start("career");S.resultWin=true;finishCareerMatch()');assert.equal(run('CAREER.roster.length'),3);assert.equal(run('CAREER.roster[2].appearance'),'legacy');
run('CAREER.active=2;start("career")');assert.equal(ctx.S.player.growthType,undefined);assert(ctx.S.enemy.growthType);
const persisted=JSON.parse(saved['gladiator.ludus.v1']);assert.equal(persisted.roster.length,3);assert.equal(persisted.roster[2].appearance,'legacy');assert(persisted.pendingOpponent);
run('CAREER.roster[0].injury=90;CAREER_SELECTING=true;renderCareer()');assert(doc.querySelectorAll('[data-deploy]')[0].disabled);
node('classChoice').value='murmillo';run('start("new")');assert.equal(ctx.S.careerMatch,false);assert.equal(ctx.S.player.growthType,undefined);assert.equal(ctx.S.enemy.growthType,undefined);
console.log('PASS: persistent multi-roster hiring/selection, participant-only rewards, injury eligibility, opponent grade mapping, boss defeat/recruit/replay, legacy deployment, and arcade separation.');

// Exercise the actual shared keyboard handlers, including paused/background fights.
const handlers={};
ctx.window.addEventListener=(type,fn)=>{handlers[type]=fn;};
ctx.document.addEventListener=(type,fn)=>{handlers[type]=fn;};
ctx.markManualInput=()=>{};ctx.inputAct=()=>{};ctx.say=()=>{};
run(html.slice(html.indexOf('function togglePause(){'),html.indexOf("$('#startBtn').onclick=")));
run(html.slice(html.indexOf('const keymap='),html.indexOf("for(const b of document.querySelectorAll('[data-key]'))")));
const key=(code,target=null)=>{let prevented=false;handlers.keydown({code,target,preventDefault(){prevented=true;}});return prevented;};
ctx.S.phase='title';assert.equal(key('Space'),false);assert.equal(ctx.S.keys.size,0);
ctx.S.phase='fight';ctx.S.paused=false;
assert.equal(key('Space',{closest:()=>({})}),false,'Focused UI buttons retain native keyboard activation');
key('ArrowLeft');assert(ctx.S.keys.has('left'));
handlers.blur();assert(ctx.S.paused);assert.equal(ctx.S.keys.size,0);
key('ArrowRight');assert.equal(ctx.S.keys.size,0);
key('KeyP');assert.equal(ctx.S.paused,false);
ctx.document.hidden=true;handlers.visibilitychange();assert(ctx.S.paused);
console.log('PASS: menu/form keyboard isolation, blur/visibility pause, held-key cleanup and explicit resume.');
ctx.GEAR.push({id:'test-armor',slot:'armor',atk:0,hp:45});
run('CAREER.active=0;CAREER.roster[0].inventory.push("test-armor");CAREER.roster[0].equipment.armor="test-armor";CAREER.roster[0].injury=35;start("career")');
assert.equal(ctx.S.player.maxHp,run('DATA[CAREER.hero.cls].hp+CAREER.hero.stats.end*13+45'));
assert.equal(ctx.S.player.hp,ctx.S.player.maxHp-35);
assert.equal(ctx.S.careerStartingHp,ctx.S.player.hp);
console.log('PASS: equipped armor health matches roster summary and match starting health.');

const market=fs.readFileSync(require('node:path').join(__dirname,'../public/market-scene.js'),'utf8');
let focused='gmConfirm';
const marketContext={scene:{hidden:false},mode:'confirm',document:{get activeElement(){return marketNodes[focused];}},$:selector=>marketNodes[selector.slice(1)]};
const marketNodes={gmConfirm:{focus(){focused='gmConfirm';}},gmCancel:{focus(){focused='gmCancel';}}};
vm.createContext(marketContext);
vm.runInContext(market.slice(market.indexOf('function keydown(e)'),market.indexOf('function setup()')),marketContext);
const tabEvent={key:'Tab',preventDefault(){},stopPropagation(){}};
marketContext.keydown(tabEvent);assert.equal(focused,'gmCancel');
marketContext.keydown({...tabEvent,shiftKey:true});assert.equal(focused,'gmConfirm');
console.log('PASS: purchase confirmation keeps keyboard focus inside the dialog.');
