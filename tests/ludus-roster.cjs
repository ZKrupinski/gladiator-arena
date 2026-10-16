const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const api=require('../public/ludus-roster.js');
for(let wins=0;wins<30;wins++)for(const level of [1,5,10,15,20]){
 const state={wins,roster:[]},enemy=api.encounter(state,{level},()=>.75);
 assert.equal(enemy.boss,(wins+1)%5===0);assert(enemy.level>=1&&enemy.level<=20);assert.equal(enemy.stage,api.stage(enemy.level));assert.equal(api.encounter(state,{level:1},()=>0),enemy);
 if(enemy.boss){const h=api.recruitBoss(state,enemy);assert.equal(h.appearance,'legacy');assert.equal(api.recruitBoss(state,enemy),null);}
}
const html=fs.readFileSync(require('node:path').join(__dirname,'../public/index.html'),'utf8');
const nodes={},cache={};let markup='';
const node=id=>nodes[id]??=( {style:{},classList:{add(){},remove(){},toggle(){}},value:'random',hidden:false,textContent:'',set innerHTML(v){markup=v;Object.keys(cache).forEach(k=>delete cache[k]);},get innerHTML(){return markup;}} );
const always=new Set(['careerBody','careerHub','careerMini','startScreen','endScreen','classChoice','opponentChoice','pauseBtn']);
const doc={getElementById(id){return always.has(id)||markup.includes('id="'+id+'"')?node(id):null;},querySelectorAll(selector){
 if(!selector.startsWith('[data-')||selector==='[data-roster-art]')return [];
 if(cache[selector])return cache[selector];const attr=selector.slice(1,-1),key=attr.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
 return cache[selector]=[...markup.matchAll(new RegExp('<button[^>]*'+attr+'="([^"]+)"[^>]*>','g'))].map(m=>({dataset:{[key]:m[1]},disabled:m[0].includes('disabled')}));
}};
const saved={};const ctx={console,LudusRoster:api,document:doc,$:sel=>doc.getElementById(sel.slice(1)),localStorage:{getItem:()=>null,setItem:(k,v)=>saved[k]=v},GEAR:[{id:'wood',slot:'weapon',atk:0,hp:0}],CLEANED_CHARACTER_URLS:{},ASSET:{},GROWTH_TYPES:{murmillo_a:'M',thraex_a:'T',retiarius_a:'R'},growthType:h=>h.growthType,growthImage:()=>null,refreshGrowthAvatar:()=>{},IMG:{},S:{keys:new Set(),phase:'title'},CAMERA:{},clock:0,fxSound(){},updateHud(){}};
vm.createContext(ctx);
vm.runInContext(html.slice(html.indexOf('const DATA='),html.indexOf('const FRAMES=')),ctx);
ctx.fighter=(cls,x)=>({cls,x,cfg:{...vm.runInContext('DATA',ctx)[cls]},maxHp:138,hp:138});
vm.runInContext(html.slice(html.indexOf("const CAREER_KEY="),html.indexOf('function startTraining(')),ctx);
vm.runInContext(html.slice(html.indexOf("function start(mode="),html.indexOf('function markManualInput(')),ctx);
const run=code=>vm.runInContext(code,ctx);
run('renderCareer()');assert.equal(doc.querySelectorAll('[data-hire]').length,3);
doc.querySelectorAll('[data-hire]')[0].onclick();doc.querySelectorAll('[data-hire]')[1].onclick();
assert.equal(run('CAREER.roster.length'),2);assert.equal(doc.querySelectorAll('[data-hire]').length,3);
doc.querySelectorAll('[data-select]')[0].onclick();assert.equal(run('CAREER.active'),0);
run('openCareerDraft()');assert.equal(doc.querySelectorAll('[data-deploy]').length,2);
doc.querySelectorAll('[data-deploy]')[1].onclick();assert.equal(ctx.S.careerParticipant,1);assert(ctx.S.player.growthType);assert(ctx.S.enemy.growthType);
run('CAREER.active=0;S.resultWin=true;finishCareerMatch()');assert.equal(run('CAREER.roster[0].fights'),0);assert.equal(run('CAREER.roster[1].fights'),1);run('finishCareerMatch()');assert.equal(run('CAREER.fights'),1);
run('CAREER.wins=4;CAREER.pendingOpponent=null;CAREER.active=0;start("career")');assert(ctx.S.careerOpponent.boss);assert.equal(ctx.S.enemy.growthType,undefined);
run('S.resultWin=false;finishCareerMatch()');assert.equal(run('CAREER.roster.length'),2);assert.equal(run('CAREER.wins'),4);assert(run('CAREER.pendingOpponent.boss'));
run('CAREER.roster[0].injury=0;start("career");S.resultWin=true;finishCareerMatch()');assert.equal(run('CAREER.roster.length'),3);assert.equal(run('CAREER.roster[2].appearance'),'legacy');
run('CAREER.active=2;start("career")');assert.equal(ctx.S.player.growthType,undefined);assert(ctx.S.enemy.growthType);
const persisted=JSON.parse(saved['gladiator.ludus.v1']);assert.equal(persisted.roster.length,3);assert.equal(persisted.roster[2].appearance,'legacy');assert(persisted.pendingOpponent);
run('CAREER.roster[0].injury=90;CAREER_SELECTING=true;renderCareer()');assert(doc.querySelectorAll('[data-deploy]')[0].disabled);
run('start("new")');assert.equal(ctx.S.careerMatch,false);assert.equal(ctx.S.player.growthType,undefined);assert.equal(ctx.S.enemy.growthType,undefined);
console.log('PASS: persistent multi-roster hiring/selection, participant-only rewards, injury eligibility, opponent grade mapping, boss defeat/recruit/replay, legacy deployment, and arcade separation.');
