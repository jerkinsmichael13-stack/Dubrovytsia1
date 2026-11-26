(function(){
  var q=document.getElementById('pvQ'),cnt=document.getElementById('pvCount'),f='all';
  var tiles=[].slice.call(document.querySelectorAll('.pv-grid li')),bios=[].slice.call(document.querySelectorAll('.pv-bio'));
  function ok(el,s){
    var n=el.getAttribute('data-name')||'';
    if(s&&n.indexOf(s)<0)return false;
    var sov=el.hasAttribute('data-sov');
    if(f==='case'&&sov)return false;
    if(f==='sov'&&!sov)return false;
    if(f==='full'&&!(el.querySelector('.pv-full')||(el.classList.contains('pv-bio')&&!el.classList.contains('pv-bio--short'))))return false;
    return true;
  }
  function run(){
    var s=(q.value||'').trim().toLowerCase(),n=0;
    tiles.forEach(function(li){var v=ok(li,s);li.hidden=!v;if(v)n++});
    bios.forEach(function(a){a.hidden=!ok(a,s)});
    [].forEach.call(document.querySelectorAll('.pv-tier,.pv-bios-t'),function(sec){
      sec.hidden=!sec.querySelector('li:not([hidden]),.pv-bio:not([hidden])');
    });
    cnt.textContent=(s||f!=='all')?('Знайдено: '+n):'';
  }
  q.addEventListener('input',run);
  [].forEach.call(document.querySelectorAll('.pv-chip'),function(b){
    b.addEventListener('click',function(){
      [].forEach.call(document.querySelectorAll('.pv-chip'),function(x){x.classList.toggle('is-on',x===b)});
      f=b.getAttribute('data-f');run();
    });
  });
  var lb=document.getElementById('pvLb'),img=lb.querySelector('img'),cap=lb.querySelector('figcaption');
  document.addEventListener('click',function(ev){
    var b=ev.target.closest('[data-lb]');
    if(b){img.src=b.getAttribute('data-lb');cap.textContent=b.getAttribute('data-cap')||'';lb.hidden=false;return}
    if(ev.target===lb||ev.target.closest('.pv-lb-x'))lb.hidden=true;
  });
  document.addEventListener('keydown',function(ev){if(ev.key==='Escape')lb.hidden=true});
})();
