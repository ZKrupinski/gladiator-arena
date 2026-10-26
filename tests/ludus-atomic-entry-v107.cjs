/* v107: title and Ludus transitions must never expose the obsolete dashboard
 * or a partially rendered fallback Domina/menu before approved art is decoded. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..','public');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),css=read('ludus-scene.css'),scene=read('ludus-scene.js');
assert.doesNotThrow(()=>new Function(scene));
const inline=html.slice(html.lastIndexOf('<script>',html.indexOf('function enterCareer()'))+8,
 html.indexOf('</script>',html.indexOf('function enterCareer()')));
assert.doesNotThrow(()=>new Function(inline));
assert(!html.includes('<h2>루두스 현황</h2>'),'obsolete career dashboard removed');
assert(!html.includes('roster+summary'),'legacy fallback not reachable');
assert(/if\(CAREER_TAB==='roster'\)\{\s*\/\/ Never fall back/.test(html));
assert(/if\(!window\.LudusCardScenes\)\{\$\('#careerBody'\)\.replaceChildren\(\);return;\}/.test(html));
assert(html.includes("$('#careerHub').hidden=true;\n if(CAREER.roster.length===0)"),
 'main title routes to approved illustration, never renders the legacy career hub');
assert(html.includes("$('#titleCareerFight').onclick=enterCareer;"),
 'old title shortcut never jumps to legacy draft');
assert(html.includes("onExit:()=>{$('#careerHub').hidden=true;window.LudusScene?.open();}"),
 'market returns directly to modern lobby');
assert(html.includes("returnHome:()=>{CAREER_SELECTING=false;CAREER_TAB='roster';$('#careerHub').hidden=true"),
 'approved room return never exposes legacy career hub');
assert(!scene.includes('class="ll-domina"><img'),'remove temporary Domina fallback markup');
assert(scene.includes('art.decode().then(reveal'),'decode before showing illustrated lobby');
assert(scene.includes('var token=++openEpoch;'),'new transition generation for each open');
assert(scene.includes("if(!scene||scene.hidden||token!==openEpoch)return;"),
 'cancel late show when closing or reopening');
assert(scene.includes("scene.classList.add(\"ll-display-ready\")"),'single reveal');
assert(scene.includes("scene.classList.remove('ll-display-ready')"),'hide all child art during transition');
assert(css.includes('.ll-scene:not(.ll-display-ready) .ll-stage'));
assert(css.includes('.ll-scene:not(.ll-display-ready)::after'));
assert(css.includes('.ll-scene:not(.ll-display-ready) .ll-orientation'));
assert(html.includes('/* First-paint guard: never draw half-built Domina boxes or buttons. */'));
assert(html.includes('ludus-scene.js?v=atomic-lobby-reveal-v107-20261026'));
assert(html.includes('ludus-scene.css?v=atomic-lobby-reveal-v107-20261026'));
console.log('LUDUS_ATOMIC_ENTRY_PASS: title, market, approved room, missing cards, slow image load');
