/* ARENA HERALD — stable, event-driven Latin proclamation art. No game state changes. */
(function(root){
'use strict';
const VERSES={
 opening:[['PUGNA INCIPIT','THE DUEL BEGINS'],['IN ARENA','THE SANDS AWAIT'],['AD GLORIAM','FOR GLORY']],
 newcomer:[['NOVUS ADVERSARIUS','A NEW RIVAL ENTERS'],['PRODEAT GLADIATOR','LET THE GLADIATOR COME FORTH'],['ITERUM PUGNA','THE CONTEST RESUMES']],
 ally:[['NOSTER GLADIATOR','OUR CHAMPION ENTERS'],['FORTES FORTUNA IUVAT','FORTUNE FAVOURS THE BRAVE'],['SURGAT VINDEX','LET THE AVENGER RISE']],
 cleanup:[['CORPUS TOLLITUR','THE FALLEN ARE CARRIED AWAY'],['FINIS GLADIATORIS','ONE FIGHTER HAS FALLEN'],['CARNIFEX VENIT','THE EXECUTIONER APPROACHES']],
 victory:[['VICTORIA','THE CROWD SALUTES THE VICTOR'],['LAUS VICTORI','HONOUR TO THE WINNER'],['GLORIA AETERNA','GLORY IN THE ARENA']],
 defeat:[['VICTUS EST','THE CHAMPION FALLS'],['FORTUNA CECIDIT','FORTUNE HAS TURNED'],['HONOR IN PULVERE','HONOUR IN THE DUST']],
 parry:[['ICTUS REPULSUS','A PERFECT PARRY'],['SCUTUM TENET','THE SHIELD HOLDS']],
 guard:[['SCUTUM FRACTUM','THE GUARD IS BROKEN'],['VIS CONTRA VIS','FORCE MEETS FORCE']],
 guarded:[['FORTITER DEFENDIT','A STOUT DEFENCE']],
 dodge:[['EVASIT','THE BLOW IS AVOIDED']],
 net:[['RETE IACTUM','THE NET IS CAST']],
 spear:[['SCUTUM FERIT','A SHIELDING BLOW']],
 bleed:[['SICA VULNERAT','A WOUNDING SLASH']],
 rush:[['IMPETUS FEROX','A FIERCE CHARGE'],['FEROX ASSULTUS','A STORM OF STEEL']],
 combo:[['ICTUS TRIPLEX','THREE STRIKES LANDED']],
 boss:[['FUROR REDIVIVUS','THE CHAMPION RISES AGAIN']],
 stamina:[['VIRES DEFICIUNT','STAMINA RUNNING LOW']],
 range:[['PROCUL','BEYOND STRIKING DISTANCE']],
 paused:[['PUGNA SUSPENSA','COMBAT PAUSED']],
 resume:[['PUGNA REDIIT','COMBAT RESUMED']],
 notice:[['NUNTIUS ARENAE','THE ARENA ANNOUNCES']]
};
const tone={cleanup:'iron',defeat:'iron',guard:'iron',guarded:'iron',stamina:'iron',paused:'iron',newcomer:'ember',rush:'ember',bleed:'ember',boss:'ember',victory:'gold'};
const ACTIVE_PHASES=new Set(['fight','cleanup','finisher']);
let holder=null,lastKey='',seq=0,previousKind='',version=0;
function classify(message){
 const m=String(message).toUpperCase();
 if(/CARNIFEX|CORPUS|TEMPUS FINITUM/.test(m))return 'cleanup';
 if(/PAUSED/.test(m))return 'paused';
 if(/RESUME/.test(m))return 'resume';
 if(/VICTORIA|승리!/.test(m))return 'victory';
 if(/DEFEAT|패배/.test(m))return 'defeat';
 if(/다음 상대/.test(m))return 'newcomer';
 if(/다음 아군/.test(m))return 'ally';
 if(/1차전|PUGNA|차전|ARENA/.test(m))return 'opening';
 if(/PARRY/.test(m))return 'parry';
 if(/GUARD BREAK/.test(m))return 'guard';
 if(/GUARDED/.test(m))return 'guarded';
 if(/DODGE/.test(m))return 'dodge';
 if(/OUT OF RANGE/.test(m))return 'range';
 if(/NET TRAP/.test(m))return 'net';
 if(/SCUTUM/.test(m))return 'spear';
 if(/SICA/.test(m))return 'bleed';
 if(/3 HIT/.test(m))return 'combo';
 if(/4 HIT|RUSH/.test(m))return 'rush';
 if(/SECOND WIND|CHAMPION|BOSS/.test(m))return 'boss';
 if(/STAMINA LOW/.test(m))return 'stamina';
 return 'notice';
}
function ensure(){
 if(holder&&holder.isConnected)return holder;
 if(typeof document==='undefined')return null;
 const stage=document.querySelector('.arena-wrap');
 if(!stage)return null;
 holder=document.createElement('div');
 holder.id='arenaHerald';
 holder.className='arena-herald';
 holder.hidden=true;
 holder.setAttribute('role','status');
 holder.setAttribute('aria-live','polite');
 holder.setAttribute('aria-atomic','true');
 holder.setAttribute('aria-hidden','true');
 holder.innerHTML='<div class="arena-herald-crown" aria-hidden="true">✦ ❧ ✦</div>'+
 '<div class="arena-herald-rule" aria-hidden="true"></div>'+
 '<div class="arena-herald-title"></div>'+
 '<div class="arena-herald-subtitle"></div>'+
 '<div class="arena-herald-rule arena-herald-rule--foot" aria-hidden="true"></div>';
 stage.appendChild(holder);
 return holder;
}
function reset(){
 if(lastKey||holder&&!holder.hidden)version++;
 lastKey='';previousKind='';
 if(holder){holder.hidden=true;holder.setAttribute('aria-hidden','true');}
 if(typeof document!=='undefined'){
  document.querySelector('.arena-wrap')?.classList.remove('arena-herald-mode');
  document.getElementById('combatNotice')?.removeAttribute('aria-hidden');
 }
}
function visible(){return !!(holder&&holder.isConnected&&!holder.hidden)}
function sync(message,context={}){
 // One presentation system in both single-duel and ordered-lineup modes.
 const active=ACTIVE_PHASES.has(context.phase);
 const stage=typeof document!=='undefined'?document.querySelector('.arena-wrap'):null;
 if(!active){reset();return false;}
 const node=ensure();
 if(!node)return false; // The original notice remains available as fallback.
 stage?.classList.add('arena-herald-mode');
 document.getElementById('combatNotice')?.setAttribute('aria-hidden','true');
 const text=String(message||'').trim();
 if(!text){
  lastKey='';
  node.hidden=true;node.setAttribute('aria-hidden','true');
  return false;
 }
 const key=[text,context.round||0,context.phase||''].join('|');
 if(key===lastKey)return true;
 const kind=classify(text),variants=VERSES[kind]||VERSES.notice;
 seq=(kind===previousKind?seq+1:0);
 let [latin,subtitle]=variants[seq%variants.length];
 if(kind==='notice')subtitle=text.toUpperCase().slice(0,90);
 previousKind=kind;lastKey=key;
 node.dataset.kind=kind;node.dataset.tone=tone[kind]||'gold';
 node.dataset.length=latin.length>24?'xl':latin.length>17?'long':'normal';
 node.querySelector('.arena-herald-title').textContent=latin;
 node.querySelector('.arena-herald-subtitle').textContent=subtitle;
 node.hidden=false;node.setAttribute('aria-hidden','false');
 // Restart only for a NEW proclamation, never on each animation frame.
 node.classList.remove('arena-herald-reveal');
 void node.offsetWidth;
 node.classList.add('arena-herald-reveal');
 return true;
}
// Fighter-adjacent counterwords and screen-centre rush share the exact
// Roman font/engraving language, while remaining at their original positions.
function drawCanvasCallout(ctx,label,x,y,options={}){
 if(!ctx||!label)return false;
 const size=options.size||26;
 const t=options.tone||'gold';
 const colors=t==='iron'?['#e3cfbf','#a49083']:t==='ember'?['#ffc59a','#dc9363']:['#f9e1b1','#d3a568'];
 const subtitle=options.subtitle||'';
 const maxWidth=options.maxWidth||300;
 const scale=label.length>20?.72:label.length>14?.84:1;
 ctx.save();
 ctx.globalAlpha=Math.max(0,Math.min(1,options.alpha??1));
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
 ctx.shadowColor='#100704';ctx.shadowBlur=10;
 ctx.font='700 '+Math.max(9,Math.round(size*.37))+'px Georgia,serif';
 ctx.fillStyle=colors[1];
 ctx.fillText('✦',x,y-size*.95,maxWidth);
 ctx.font='900 '+Math.round(size*scale)+'px "Palatino Linotype","Book Antiqua",Georgia,serif';
 ctx.lineWidth=Math.max(2,Math.round(size*.12));
 ctx.strokeStyle='#30180f';ctx.fillStyle=colors[0];
 ctx.strokeText(label,x,y,maxWidth);
 ctx.fillText(label,x,y,maxWidth);
 if(subtitle){
  ctx.font='800 '+Math.max(9,Math.round(size*.40))+'px "Palatino Linotype",Georgia,serif';
  ctx.fillStyle='#fce0b9';ctx.fillText(subtitle,x,y+size*.67,maxWidth);
 }
 ctx.restore();
 return true;
}

root.ArenaHerald={version:'3.0.0',classify,sync,reset,visible,drawCanvasCallout};
if(typeof module!=='undefined'&&module.exports)module.exports=root.ArenaHerald;
})(globalThis);
