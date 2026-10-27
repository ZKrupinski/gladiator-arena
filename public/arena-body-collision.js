/* Arena neutral-body collision. All modes share this SCALE-aware silhouette,
 * NEVER the weapon/full animation PNG bounds. Visual attacks/dashes are transient
 * render/motion events: no enlarged body collision during those keyframes.
 */
(function(root,factory){'use strict';
 const api=factory();
 root.SpartacusBodyCollision=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
 // World-space neutral torso+shield half extents at normal artist size.
 // DUEL : 348px stage * .82 global body scale.
 // PRACTICE: 202px stage.
 // COOP: 202px stage * .60 common camera body zoom.
 const BASE=Object.freeze({
  duel:Object.freeze({rx:100,ry:72}),
  practice:Object.freeze({rx:86,ry:66}),
  coop:Object.freeze({rx:57,ry:57})
 });
 const DEPTH=Object.freeze({
  practice:Object.freeze({farY:606,nearY:676,farScale:.82}),
  coop:Object.freeze({farY:395,nearY:675,farScale:.70})
 });
 function depth(scene,y){
  const d=DEPTH[scene];if(!d)return 1;
  return d.farScale+(1-d.farScale)*clamp((Number(y)-d.farY)/(d.nearY-d.farY),0,1);
 }
 function footprint(scene,{scale=1,y=675,depthScale,footprintWidth=1}={}){
  const base=BASE[scene];if(!base)throw Error('Unknown collision scene: '+scene);
  // Size exactly follows one current character's studio body scale; no
  // per-class permanent adjustment, no attack pose's weapon length.
  const factor=clamp(scale,.40,2.50)*(Number.isFinite(depthScale)?depthScale:depth(scene,y));
  const widthFactor=clamp(footprintWidth,.72,1.20);
  return {rx:base.rx*factor*widthFactor,ry:base.ry*factor,
   scale:factor,scene};
 }
 function gap(a,b,padding=0){return a.rx+b.rx+Math.max(0,Number(padding)||0);}
 function ellipse(a,b,shapeA,shapeB,{slack=1}={}){
  const dx=(Number(a.x)||0)-(Number(b.x)||0);
  const dy=(Number(a.y)||0)-(Number(b.y)||0);
  const rx=(shapeA.rx+shapeB.rx)*slack,ry=(shapeA.ry+shapeB.ry)*slack;
  if(!(rx>0&&ry>0))return false;
  return dx*dx/(rx*rx)+dy*dy/(ry*ry)<1-1e-7;
 }
 // Two broad body silhouettes in top-down coordinates; weapon, cape,
 // sudden lunge and hit VFX have no influence on the neutral shapes.
 function penetration(a,b,shapeA,shapeB,{slack=1}={}){
  const dx=(Number(b.x)||0)-(Number(a.x)||0),dy=(Number(b.y)||0)-(Number(a.y)||0);
  const rx=(shapeA.rx+shapeB.rx)*slack,ry=(shapeA.ry+shapeB.ry)*slack;
  const q=Math.sqrt(dx*dx/(rx*rx)+dy*dy/(ry*ry));
  if(!Number.isFinite(q)||q>=1-1e-9)return null;
  // Favor the horizontal axis when reasonable; depth Y is the tighter
  // vertical theater and should not be changed unless necessary.
  const sx=rx-Math.abs(dx),sy=ry-Math.abs(dy);
  const axis=sx<=sy*1.20?'x':'y';
  return {axis,amount:axis==='x'?sx:sy,sign:axis==='x'?(dx>=0?1:-1):(dy>=0?1:-1)};
 }
 return Object.freeze({BASE,DEPTH,depth,footprint,gap,ellipse,penetration});
});
