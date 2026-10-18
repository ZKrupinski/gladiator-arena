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
 range:[['PROCUL','BEYOND STRIKING DISTANCE']]
};
const tone={cleanup:'iron',defeat:'iron',guard:'iron',stamina:'iron',newcomer:'ember',rush:'ember',bleed:'ember',boss:'ember',victory:'gold'};
let holder=null,lastKey='',seq=0,previousKind='',version=0;
function classify(message){
 const m=String(message).toUpperCase();
 if(/CARNIFEX|CORPUS|TEMPUS FINITUM/.test(m))return 'cleanup';
 if(/VICTORIA|승리!/.test(m))return 'victory';
 if(/DEFEAT|패배/.test(m))return 'defeat';
 if(/다음 상대/.test(m))return 'newcomer';
 if(/다음 아군/.test(m))return 'ally';
 if(/1차전|PUGNA|차전/.test(m))return 'opening';
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
 if(/SECOND WIND/.test(m))return 'boss';
 if(/STAMINA LOW/.test(m))return 'stamina';
 return 'opening';
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
 version++; lastKey=''; previousKind='';
 if(holder)holder.hidden=true;
 if(typeof document!=='undefined')document.querySelector('.arena-wrap')?.classList.remove('arena-herald-mode');
}
function sync(message,context={}){
 const active=!!context.lineup;
 const stage=typeof document!=='undefined'?document.querySelector('.arena-wrap'):null;
 stage?.classList.toggle('arena-herald-mode',active);
 if(!active){reset();return false;}
 const text=String(message||'').trim();
 if(!text){if(lastKey){lastKey='';if(holder)holder.hidden=true;}return false;}
 const key=[text,context.round||0,context.phase||''].join('|');
 if(key===lastKey)return true;
 const node=ensure();if(!node)return false;
 const kind=classify(text),variants=VERSES[kind]||VERSES.opening;
 seq=(kind===previousKind?seq+1:0);
 const [latin,subtitle]=variants[seq%variants.length];
 previousKind=kind;lastKey=key;
 node.dataset.kind=kind;node.dataset.tone=tone[kind]||'gold';
 node.querySelector('.arena-herald-title').textContent=latin;
 node.querySelector('.arena-herald-subtitle').textContent=subtitle;
 node.hidden=false;
 // Replace the animation node only when an announcement really changes,
 // never on every frame. This prevents the old flickering defect.
 node.classList.remove('arena-herald-reveal');
 void node.offsetWidth;
 node.classList.add('arena-herald-reveal');
 return true;
}
root.ArenaHerald={version:'2.0.0',classify,sync,reset};
if(typeof module!=='undefined'&&module.exports)module.exports=root.ArenaHerald;
})(globalThis);
