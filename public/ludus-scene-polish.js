/* Ludus v5.3 - non-destructive visual cleanup of the approved composite scene.
   All UI is recreated as real controls. NPC render nodes are independent
   from the painted layout and share the same 1448x1086 stage coordinates. */
(function () {
  'use strict';
  var installed = false;
  var MENU = [
    ['training','⚔  훈련소'],
    ['roster','♜  검투사 관리'],
    ['armory','🛡  장비실'],
    ['market','🏛  검투사시장'],
    ['arena','⚔  아레나 출전']
  ];
  function isolateDoctore(key, host) {
    if (!key || !key.naturalWidth || !key.naturalHeight || host.dataset.cut === 'ready') return;
    try {
      var c = document.createElement('canvas'), w=208,h=265;
      c.width=w;c.height=h;
      var ctx=c.getContext('2d', {willReadFrequently:false});
      if(!ctx)return;
      ctx.drawImage(key,1221,523,208,265,0,0,w,h);
      ctx.globalCompositeOperation='destination-in';
      ctx.fillStyle='#fff';
      ctx.beginPath();
      [[59,38],[72,18],[89,5],[108,8],[126,23],[144,46],
       [153,62],[178,66],[188,101],[199,139],[204,179],
       [197,259],[8,259],[5,194],[10,154],[30,111],[40,80]].forEach(function(p,i){
         if(i===0)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]);
       });
      ctx.closePath();ctx.fill();
      ctx.globalCompositeOperation='source-over';
      host.src=c.toDataURL('image/png');
      host.dataset.cut='ready';
    }catch(e){
      // The rest of the Ludus scene stays playable on low-memory browsers.
      host.hidden=true;
    }
  }
  function apply() {
    if (installed)return;
    var root=document.getElementById('ludusScene');
    if(!root)return;
    var stage=root.querySelector('.ll-stage'), art=root.querySelector('.ll-key');
    if(!stage || !art)return;
    installed=true;
    var layer=document.createElement('div');
    layer.className='ll-art-scrim';
    layer.setAttribute('aria-hidden','true');
    ['hud','rail','domina','training','doctore','lower','upper-dialog','doctore-dialog'].forEach(function(name){
      var part=document.createElement('div');
      part.className='ll-clean ll-clean-'+name;
      layer.appendChild(part);
    });
    stage.insertBefore(layer,stage.querySelector('.ll-domina-blink'));
    var menu=stage.querySelector('.ll-menu');
    if(menu) {
      menu.replaceChildren();
      MENU.forEach(function(pair){
        var btn=document.createElement('button');
        btn.type='button';btn.dataset.action=pair[0];btn.textContent=pair[1];
        btn.setAttribute('aria-label',pair[1].split('  ').pop());
        menu.appendChild(btn);
      });
    }
    var title=stage.querySelector('.ll-title');if(title)title.textContent='❮  루두스';
    var actor=stage.querySelector('.ll-domina img');if(actor)actor.alt='도미나';
    var coach=document.createElement('img');
    coach.className='ll-doctore-art';coach.alt='';coach.setAttribute('aria-hidden','true');
    stage.appendChild(coach);
    var oldHits=stage.querySelector('.ll-hitbuttons');if(oldHits)oldHits.remove();
    var special=stage.querySelector('.ll-special');if(special)special.remove();
    // The visual inventory is live; never expose the still-painted demo portraits.
    var speech=stage.querySelector('.ll-speech');
    if(speech)speech.innerHTML='<b>도미나</b>잘 훈련시켜 보세요. 우리 루두스의 전설은 이제 시작입니다.';
    var doc=stage.querySelector('.ll-doctore');
    if(doc)doc.innerHTML='<b>독토레 · 교관</b>오늘도 강하게! 준비됐나, 검투사들?';
    function updateDoctore(){isolateDoctore(art,coach);}
    if(art.complete && art.naturalWidth)updateDoctore();
    else art.addEventListener('load',updateDoctore,{once:true});
    // Make NPC reactions visible independently of the composite background.
    stage.addEventListener('click',function(e){
      var btn=e.target.closest('button[data-action]');if(!btn)return;
      var a=btn.dataset.action;
      if(a==='training'||a==='basic'||a==='practice') {
        if(doc)doc.innerHTML='<b>독토레 · 교관</b>훈련은 배신하지 않는다. 계속 밀어붙여라!';
      }else if(a==='arena') {
        if(doc)doc.innerHTML='<b>독토레 · 교관</b>아레나에서 네 이름을 증명해라!';
      }else if(a==='market') {
        if(speech)speech.innerHTML='<b>도미나</b>좋은 검투사는 투자할 가치가 있지.';
      }else if(a==='armory') {
        if(speech)speech.innerHTML='<b>도미나</b>잘 갖춘 무장은 승리의 시작이지.';
      }
    },{capture:true});
  }
  if(window.LudusScene && typeof window.LudusScene.open==='function'){
    var originalOpen=window.LudusScene.open;
    window.LudusScene.open=function(){originalOpen.apply(this,arguments);apply();};
  }
})();
