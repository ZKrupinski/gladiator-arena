/* GLADIATOR v1.7 detachable avatar render prototype
 * Original concept sheets are visual references, not deployable isolated sprite art.
 * First playable proof uses independent vector layers on a shared coordinate rig.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.GladiatorLayerDemo=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
const order=['cloak','legs','body','waist','torso','shoulder','bracer','hair','helmet','shield','offhand','weapon'];
const stages=['trainee','novice','gladiator','veteran','champion'];
const parts={
body:`<ellipse cx="160" cy="137" rx="59" ry="52" fill="#f4b989" stroke="#ad704c" stroke-width="4"/><path d="M124 171Q117 200 135 225L186 224Q200 192 189 169" fill="#f5ba88" stroke="#ae7550" stroke-width="4"/><path d="M126 210L113 266Q117 278 137 273L156 222M181 220L183 274Q202 280 208 267L195 208" fill="#e8a475" stroke="#aa6e4e" stroke-width="5"/><ellipse cx="129" cy="279" rx="22" ry="11" fill="#bd7855"/><ellipse cx="193" cy="278" rx="22" ry="11" fill="#bd7855"/><path d="M114 171L92 208M206 170L224 207" stroke="#e7a77b" stroke-width="24" stroke-linecap="round"/><path d="M135 122Q160 113 185 124L192 154Q165 178 128 150Z" fill="#eab184"/><ellipse cx="160" cy="75" rx="61" ry="61" fill="#f4bc94" stroke="#a97557" stroke-width="3"/><ellipse cx="128" cy="85" rx="8" ry="11" fill="#382b25"/><ellipse cx="188" cy="83" rx="8" ry="11" fill="#382b25"/><path d="M120 67L140 65M181 65L200 68" stroke="#493326" stroke-width="7" stroke-linecap="round"/><path d="M153 103Q163 110 174 103" fill="none" stroke="#985d44" stroke-width="3"/><circle cx="119" cy="102" r="7" fill="#e78874" opacity=".45"/><circle cx="198" cy="101" r="7" fill="#e78874" opacity=".45"/>`,
hair:`<path d="M99 77Q90 33 114 22Q141 -8 165 16Q199 0 219 34Q233 66 214 75L202 57L191 63L180 49L160 60L148 45L124 62L110 54Z" fill="#593724" stroke="#2c1d18" stroke-width="5"/><path d="M105 44L136 23L147 40L165 19L173 43L201 28" fill="none" stroke="#9a6343" stroke-width="9" stroke-linecap="round"/>`,
legs:`<path d="M113 246L111 277Q131 291 145 276L145 245M181 244L180 276Q198 290 218 275L211 245" fill="#825139" stroke="#473023" stroke-width="5"/><path d="M119 253L138 261M186 261L210 252" stroke="#e7bf83" stroke-width="5"/>`,
waist:`<path d="M117 195L199 195L214 237L185 249L166 239L145 250L111 238Z" fill="#933c31" stroke="#4a2825" stroke-width="5"/><path d="M124 208L127 242M157 206L156 240M191 208L191 239" stroke="#c79159" stroke-width="6"/><path d="M119 197L201 197" stroke="#c7a061" stroke-width="13"/><circle cx="159" cy="198" r="12" fill="#e2bf79" stroke="#69462d" stroke-width="4"/>`,
torso:`<path d="M128 132Q156 123 192 130L205 185Q174 203 114 185Z" fill="#a16e4e" stroke="#563a2c" stroke-width="6"/><path d="M118 142L200 166M194 139L123 171" fill="none" stroke="#e7a96b" stroke-width="7"/><circle cx="160" cy="158" r="14" fill="#ce9b51" stroke="#644128" stroke-width="4"/>`,
shoulder:`<path d="M114 133Q95 123 83 152L101 176L122 168ZM198 134Q225 122 237 149L218 178L195 165Z" fill="#b1a6a0" stroke="#675652" stroke-width="5"/><path d="M94 143L111 158M208 148L225 160" stroke="#f2d3a2" stroke-width="5"/>`,
bracer:`<path d="M87 181L107 192L100 216L77 205ZM213 186L234 179L241 201L219 215Z" fill="#aa7648" stroke="#49362d" stroke-width="5"/><path d="M83 195L101 204M219 202L234 193" stroke="#e2c38b" stroke-width="4"/>`,
helmet:`<path d="M98 76Q95 20 158 12Q220 17 224 76L211 91L204 68L193 93L181 80L181 68L141 68L140 83L123 95L110 76Z" fill="#a6abae" stroke="#50483f" stroke-width="6"/><path d="M102 55Q154 24 219 53" fill="none" stroke="#f4d8a3" stroke-width="8"/><path d="M150 12Q146 -4 163 -12Q195 -7 198 18" fill="#9e2728" stroke="#5c221e" stroke-width="5"/><path d="M105 88L119 107L131 104L139 74M212 87L200 107L188 103L181 76" fill="#8f9ba1" stroke="#50443c" stroke-width="5"/>`,
shield:`<path d="M64 150Q89 137 112 151L110 251Q85 275 58 252Z" fill="#9d332e" stroke="#5c3027" stroke-width="8"/><path d="M67 165L103 165L104 238L64 245Z" fill="#a9412d" stroke="#e9bd70" stroke-width="3"/><path d="M83 173L83 246M69 204L101 204" stroke="#e4c073" stroke-width="5"/><circle cx="84" cy="202" r="17" fill="#dab475" stroke="#60472d" stroke-width="5"/>`,
offhand:`<path d="M42 201Q81 189 112 212L105 272Q74 291 42 267Z" fill="none" stroke="#d5b37a" stroke-width="6"/><path d="M44 204L102 273M103 212L43 267M56 196L111 258M36 224L94 282M74 196L112 231" stroke="#b08c60" stroke-width="3"/><circle cx="43" cy="265" r="7" fill="#7e7d79"/><circle cx="104" cy="273" r="7" fill="#7e7d79"/>`,
weapon:`<g transform="translate(223 186) rotate(14)"><path d="M-6 0L-9 -103L0 -124L9 -103L6 0Z" fill="#d8dde0" stroke="#606c73" stroke-width="4"/><path d="M-23 3L23 3" stroke="#dca75f" stroke-width="8" stroke-linecap="round"/><path d="M0 7L0 39" stroke="#77492a" stroke-width="12"/><circle cy="43" r="8" fill="#d7ac64"/></g>`,
trident:`<g transform="translate(229 182) rotate(7)"><path d="M0 45L0 -115M-20 -112L-20 -89Q0 -58 20 -89L20 -112" fill="none" stroke="#c3b290" stroke-width="8" stroke-linecap="round"/><path d="M-26 -107L-20 -132L-14 -108M-6 -113L0 -142L6 -113M14 -108L20 -132L26 -107" fill="#dbd1b5" stroke="#786d5d" stroke-width="3"/><path d="M0 46L0 63" stroke="#70452b" stroke-width="13"/></g>`,
sica:`<g transform="translate(224 182) rotate(20)"><path d="M-4 2Q-25 -40 -18 -82Q-26 -112 -7 -130Q-13 -92 3 -85Q17 -36 5 2Z" fill="#d8dde0" stroke="#5e6870" stroke-width="4"/><path d="M-19 4L18 4" stroke="#cb9b63" stroke-width="7"/><path d="M0 8L0 45" stroke="#7d4928" stroke-width="11"/></g>`,
cloak:`<path d="M117 126Q151 115 204 128L237 266Q215 300 160 264Q132 285 90 261Z" fill="#9a2529" stroke="#68222b" stroke-width="8"/><path d="M107 249Q157 271 221 246" stroke="#dfad5c" stroke-width="5"/>`
};
function el(tag,attrs={}){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e;}
function svgMarkupFor(classId,slot,stage){
 let key=slot==='weapon'?(classId==='retiarius'?'trident':classId==='thraex'?'sica':'weapon'):slot;
 if(slot==='shield'&&classId==='retiarius')key='offhand';
 const raw=parts[key]||'';return raw;
}
function mount(svg,opts={}){
 if(!svg||svg.namespaceURI!==NS)throw Error('Expected SVG root');
 const classId=opts.classId||'murmillo',stage=opts.stage||'gladiator',active=opts.active||{};
 while(svg.firstChild)svg.removeChild(svg.firstChild);
 svg.setAttribute('viewBox','0 0 320 320');
 const defs=el('defs'),gradient=el('linearGradient',{id:'avatar-metal',x1:'0',x2:'1'});defs.append(gradient);svg.append(defs);
 for(const slot of order){
  if(slot!=='body'&&active[slot]===false)continue;
  if(slot==='offhand'&&classId!=='retiarius')continue;
  if(slot==='shield'&&classId==='retiarius')continue;
  if(slot==='helmet'&&stage==='trainee'&&active[slot]!==true)continue;
  if(slot==='cloak'&&['trainee','novice','gladiator'].includes(stage)&&active[slot]!==true)continue;
  if(slot==='hair'&&active.helmet!==false&&stage!=='trainee')continue;
  const g=el('g',{'data-slot':slot});g.innerHTML=svgMarkupFor(classId,slot,stage);svg.append(g);
 }
 return svg;
}
function setSlot(svg,slot,enabled){
 const g=svg.querySelector('[data-slot="'+slot+'"]');if(g)g.style.display=enabled?'':'none';
 return !!g;
}
return {order,stages,parts,mount,setSlot};
});