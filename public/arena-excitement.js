/* Spartacus crowd excitement: earned through varied exchanges and cinematic feats. */
(function(root){'use strict';
const spec=Object.freeze({
 // V7: normal exchanges build tension slowly, while spectacular feats still pop.
 clash:{points:.65,delay:.35},guard:{points:1.45,delay:.72},
 parry:{points:6.1,delay:1.5},reversal:{points:9.7,delay:1.55},
 special:{points:5.2,delay:1.65},rush:{points:4.9,delay:1.5},
 combo:{points:2.8,delay:1.15},guardBreak:{points:3.6,delay:1.3},
 dodge:{points:1.2,delay:1},comeback:{points:7,delay:3.3},
 finisher:{points:7.6,delay:2.6},riposte:{points:4.4,delay:1.45}
});
function create(){return {score:0,total:0,counts:{},last:{},variety:0,history:[]};}
function record(state,kind,time=0){
 if(!state||!spec[kind])return 0;
 const clock=Number(time)||0,rule=spec[kind],last=state.last[kind];
 if(last!==undefined&&clock-last<rule.delay)return 0;
 const repeat=Number(state.counts[kind]||0);
 const fresh=repeat===0;
 // Repeating the same punch endlessly is less interesting than varied tactics.
 const multiplier=Math.max(.18,1-repeat*.09);
 // The crowd is harder to impress as it heats up, preventing easy 88–100.
 const saturation=state.total>=90?.42:state.total>=75?.58:state.total>=55?.73:state.total>=30?.87:1;
 const awarded=(rule.points*multiplier+(fresh?.75:0))*saturation;
 state.counts[kind]=repeat+1;state.last[kind]=clock;
 state.total+=awarded;state.score=Math.min(100,Math.max(0,Math.round(state.total*10)/10));
 if(fresh)state.variety++;
 state.history.push({kind,awarded:Math.round(awarded*10)/10});
 if(state.history.length>14)state.history.shift();
 return awarded;
}
function grade(points){
 const x=Math.max(0,Math.min(100,Number(points)||0));
 if(x>=88)return {key:'legend',name:'관중 광란',latin:'FVROR',color:'#ffe19b'};
 if(x>=66)return {key:'epic',name:'대열광',latin:'MAGNA GLORIA',color:'#de97ff'};
 if(x>=44)return {key:'rare',name:'열광',latin:'OVATIO',color:'#82d6ff'};
 if(x>=22)return {key:'uncommon',name:'환호',latin:'CLAMOR',color:'#a9e5b8'};
 return {key:'common',name:'관심',latin:'SPECTATIO',color:'#c9b6a0'};
}
function snapshot(state){return {score:Math.round(state?.score||0),grade:grade(state?.score||0),variety:state?.variety||0,counts:{...(state?.counts||{})}};}
root.ArenaCrowd={create,record,grade,snapshot};
})(globalThis);
