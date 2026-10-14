/* Вікно завантаження 3D: будівля, що малюється золотою лінією, справжній поступ (бібліотека three.js тягнеться з показом відсотків),
   етапи й короткі історії, щоб чекати було цікаво. На сторінках моделей — посередині екрана, на головній — скромна плашка в обкладинці.
   Підключення: <script src="x3d-loader.js"></script> до скрипта моделі. Моделі самі питають X3DLoad.three(url). */
(function(){
'use strict';
var D = document, me = D.currentScript;
var ART = {
  worobin: 'M14 132h212M40 132h104M44 128h96M48 124h88M52 120h80M60 120V72M80 120V72M104 120V72M124 120V72M54 72h76M54 66h76M52 66L92 44L132 66M92 54a4 4 0 1 0 0.1 0M22 120V62h30M132 62h30v58M18 62L44 40h96l26 22M28 80h10v16H28zM146 80h10v16h-10zM34 40V24M56 40V24M32 24h26M32 24L45 8L58 24M118 40v-9h6v9M100 40v-7h5v7',
  kostel: 'M20 132h200M40 132V60h160v72M40 60l-4-6h168l-4 6M60 60V30M100 60V30M140 60V30M180 60V30M60 30h40M140 30h40M80 30c-10-4-10-14 0-20 10 6 10 16 0 20M160 30c-10-4-10-14 0-20 10 6 10 16 0 20M80 10V2M160 10V2M100 60c6-14 34-14 40 0M120 46v-10M113 132v-26a7 7 0 0 1 14 0v26M64 80h12v18H64zM164 80h12v18h-12zM100 82h40',
  cerkva: 'M20 132h200M30 132V84h46v48M30 84l23-12 23 12M53 72V42M43 54h20M43 54l10-30 10 30M53 24V12M76 132V74h120v58M76 74l60-14 60 14M110 60V44h52v16M110 44l26-24 26 24M136 20V8M196 132V94h20v38M44 104h18v28H44zM120 100h32v32h-32z',
  mykolai: 'M20 132h200M30 132V78h44v54M30 78h44M36 78V58h32v20M36 58l16-26 16 26M52 32V20M74 132V86h108v46M74 86l54-16 54 16M112 70V54h32v16M112 54c4-12 28-12 32 0M128 42c-8-6-8-16 0-22 8 6 8 16 0 22M128 20V10M182 132V96h24v36M88 100h14v20H88zM154 100h14v20h-14z'
};
var FACTS = {
  worobin: ['Павільйон звели на схилі над лугами Горині — спершу лише для книжок.', '1914 року бібліотека мала близько 8 000 томів, архів — понад 200 томів листів.', 'Палац, задуманий поруч, так і не збудували: до 1918 року родина жила в офіцинах.', 'У парку росли білі тополі, липи, ялини, ясени й каштани.'],
  kostel: ['Костел — найстаріша збережена споруда Дубровиці.', 'Школа піарів при костелі була другою на Волині після Межиріцької.', 'Мурований костел звели 1740 року, освятили 1742-го.', 'Над входом напис: «Самому Богові честь і слава».'],
  cerkva: ['На місці церкви «вище міста» моляться майже п\'ять століть.', 'Мурований храм звели 1861 року коштом графа Плятера.', '1962 року храм хотіли підірвати — наказ скасували в останню мить.', 'Бані стоять в один ряд, як у дерев\'яних церквах Полісся.'],
  mykolai: ['Церкву збудували 1872 року коштом самих парафіян.', '1913 року сюди принесли мощі святої Іуліанії — зійшлося понад 6 000 людей.', 'Метричні книги парафії велися ще з 1790 року.', 'Місце давнє: тут був Миколаївський монастир.']
};
var STAGE = {three: 'Завантажуємо 3D-рушій', build: 'Будуємо модель', plant: 'Висаджуємо дерева й прокладаємо стежки', done: 'Готово'};

var CSS = [
'.xl{position:fixed;inset:0;z-index:6;display:grid;place-items:center;padding:24px;background:radial-gradient(70% 60% at 50% 45%,rgba(23,18,11,.55),rgba(14,11,7,.86));backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);transition:opacity .8s ease,visibility .8s;color:#f4e9c8}',
'.xl.off{opacity:0;visibility:hidden;pointer-events:none}',
'.xl-c{width:min(380px,100%);text-align:center}',
'.xl svg{width:min(260px,72vw);height:auto;overflow:visible}',
'.xl path{fill:none;stroke:#d4b25a;stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:var(--l);stroke-dashoffset:var(--l);animation:xlDraw 3.6s cubic-bezier(.6,.05,.3,1) .2s forwards}',
'.xl .glow{filter:drop-shadow(0 0 6px rgba(212,178,90,.45))}',
'@keyframes xlDraw{to{stroke-dashoffset:0}}',
'.xl-k{margin:1.3rem 0 .3rem;font:600 .62rem var(--body,system-ui);letter-spacing:.2em;text-transform:uppercase;color:#d4b25a}',
'.xl-t{margin:0;font:400 1.55rem/1.15 var(--display,Georgia,serif)}',
'.xl-b{position:relative;height:2px;margin:1.3rem auto .6rem;width:min(240px,70vw);border-radius:2px;background:rgba(244,233,200,.12);overflow:hidden}',
'.xl-b i{position:absolute;inset:0 auto 0 0;width:0;background:linear-gradient(90deg,#a8852f,#f0d58a);transition:width .5s ease}',
'.xl-b i::after{content:"";position:absolute;right:0;top:-3px;width:24px;height:8px;background:radial-gradient(closest-side,rgba(255,226,150,.9),transparent)}',
'.xl-s{margin:0;font:500 .72rem var(--body,system-ui);letter-spacing:.06em;color:rgba(244,233,200,.6);font-variant-numeric:tabular-nums}',
'.xl-f{min-height:3.2em;margin:1.4rem auto 0;max-width:330px;font:italic 400 1rem/1.5 var(--display,Georgia,serif);color:rgba(244,233,200,.78);transition:opacity .6s}',
'.xl-f b{display:block;margin-bottom:.2rem;font:600 .58rem var(--body,system-ui);font-style:normal;letter-spacing:.18em;text-transform:uppercase;color:rgba(212,178,90,.8)}',
/* the hero variant: a small pill in the cover */
'.xlh{position:absolute;z-index:3;left:3%;bottom:5.4rem;display:flex;align-items:center;gap:.7rem;padding:.55rem .95rem .55rem .7rem;border-radius:999px;background:rgba(23,18,11,.62);border:1px solid rgba(212,178,90,.28);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#f4e9c8;font:500 .7rem var(--ds-body,system-ui);letter-spacing:.04em;transition:opacity .8s,visibility .8s;pointer-events:none}',
'.xlh.off{opacity:0;visibility:hidden}',
'.xlh svg{width:22px;height:22px}.xlh circle{fill:none;stroke-width:2}.xlh .bg{stroke:rgba(244,233,200,.15)}.xlh .fg{stroke:#d4b25a;stroke-linecap:round;transition:stroke-dashoffset .5s;transform:rotate(-90deg);transform-origin:50% 50%}',
'@media(min-width:981px){.hx-land .xlh{left:auto;right:max(2rem,calc((100vw - 1240px)/2));bottom:6.4rem}}',
'@media(prefers-reduced-motion:reduce){.xl path{animation:none;stroke-dashoffset:0}}'
].join('\n');

var ui = null, pct = 0, shown = 0, label = STAGE.three, hero = false, model = null, factT = null, done = false;
function pickModel(){
  var m = /(kostel|cerkva|mykolai|worobin)-3d/.exec(location.pathname); if (m) return m[1];
  var s = D.querySelector('script[data-model]'); if (s && ART[s.dataset.model]) return s.dataset.model;
  return window.__hx3d && window.__hx3d.js ? window.__hx3d.js.replace('-3d.js', '') : 'worobin';
}
function build(){
  if (ui) return ui;
  model = pickModel();
  var st = D.createElement('style'); st.textContent = CSS; D.head.appendChild(st);
  var stage = D.getElementById('hxStage');
  hero = !!stage;
  if (hero){
    ui = D.createElement('div'); ui.className = 'xlh'; ui.setAttribute('role', 'status');
    ui.innerHTML = '<svg viewBox="0 0 24 24"><circle class="bg" cx="12" cy="12" r="9"/><circle class="fg" cx="12" cy="12" r="9" stroke-dasharray="56.5" stroke-dashoffset="56.5"/></svg><span>' + (window.__hx3d && window.__hx3d.land ? 'Оживляємо краєвид' : 'Завантажуємо 3D-модель') + ' · <b>0%</b></span>';
    stage.appendChild(ui);
  } else {
    var old = D.getElementById('load');
    ui = D.createElement('div'); ui.className = 'xl'; ui.id = 'xload'; ui.setAttribute('role', 'status'); ui.setAttribute('aria-live', 'polite');
    var title = (D.querySelector('.top h1') || {}).textContent || '3D-модель';
    ui.innerHTML = '<div class="xl-c"><svg viewBox="0 0 240 140" class="glow" aria-hidden="true">' + ART[model].split('M').filter(Boolean).map(function(d){ return '<path d="M' + d + '"/>'; }).join('') + '</svg>' +
      '<p class="xl-k">3D-реконструкція</p><h2 class="xl-t"></h2><div class="xl-b"><i></i></div><p class="xl-s"></p><p class="xl-f"></p></div>';
    ui.querySelector('.xl-t').textContent = title;
    D.body.appendChild(ui);
    ui.querySelectorAll('path').forEach(function(p){ var l = Math.ceil(p.getTotalLength ? p.getTotalLength() : 300) + 2; p.style.setProperty('--l', l); });
    if (old){ old.style.display = 'none';                                              // the page hides #load when the model is ready: follow it
      new MutationObserver(function(){ if (old.classList.contains('off')) finish(); }).observe(old, {attributes: true, attributeFilter: ['class']}); }
    var F = FACTS[model] || [], fi = 0, fe = ui.querySelector('.xl-f');
    function fact(){ if (!F.length) return; fe.style.opacity = 0; setTimeout(function(){ fe.innerHTML = '<b>Чи знаєте ви</b>' + F[fi++ % F.length]; fe.style.opacity = 1; }, 400); }
    fact(); factT = setInterval(fact, 5200);
  }
  if (hero){ var mo = new MutationObserver(function(){ if (stage.classList.contains('live') || stage.classList.contains('nogl')) finish(); }); mo.observe(stage, {attributes: true, attributeFilter: ['class']}); }
  return ui;
}
function draw(){
  if (!ui) return;
  var p = Math.round(shown);
  if (hero){ ui.querySelector('.fg').setAttribute('stroke-dashoffset', (56.5*(1 - shown/100)).toFixed(1)); ui.querySelector('b').textContent = p + '%'; }
  else { ui.querySelector('.xl-b i').style.width = shown + '%'; ui.querySelector('.xl-s').textContent = label + ' · ' + p + '%'; }
}
/* the bar never stands still: it creeps towards the next milestone while work goes on */
var goal = 0, creepTo = 0;
function set(p, lab){ build(); if (lab) label = lab; goal = Math.max(goal, p); draw(); }
function creep(to){ creepTo = Math.max(creepTo, to); }
(function tick(){ if (done) return; if (shown < goal) shown += Math.max(.4, (goal - shown)*.18); else if (shown < creepTo) shown += (creepTo - shown)*.012; if (shown > 100) shown = 100; draw(); requestAnimationFrame(tick); })();
function finish(){
  if (done || !ui) return; set(100, STAGE.done); shown = 100; draw(); done = true;
  if (factT) clearInterval(factT);
  setTimeout(function(){ ui.classList.add('off'); }, hero ? 300 : 450);
  setTimeout(function(){ if (ui && ui.parentNode) ui.parentNode.removeChild(ui); }, 2000);
}

/* three.js with a real progress bar; if the request fails, fall back to an ordinary script tag */
function three(url){
  build(); set(3, STAGE.three);
  if (window.THREE && THREE.OrbitControls){ set(70, STAGE.build); creep(90); return Promise.resolve(); }
  return new Promise(function(res, rej){
    var x = new XMLHttpRequest(), EST = 634586;
    x.open('GET', url); x.responseType = 'text';
    x.onprogress = function(e){ var tot = e.lengthComputable && e.total > 300000 ? e.total : EST; set(3 + 65*Math.min(1, e.loaded/tot), STAGE.three); };
    x.onload = function(){
      if (x.status >= 200 && x.status < 300 && x.responseText.length > 1000){
        var s = D.createElement('script'); s.text = x.responseText + '\n//# sourceURL=' + url; D.head.appendChild(s);
        set(70, STAGE.build); creep(90); res();
      } else fallback();
    };
    x.onerror = fallback;
    function fallback(){ var s = D.createElement('script'); s.src = url; s.onload = function(){ set(70, STAGE.build); creep(90); res(); }; s.onerror = rej; D.head.appendChild(s); }
    x.send();
  });
}
D.addEventListener('x3d:ready', function(){ set(92, STAGE.plant); creep(99); });
if (!D.getElementById('hxStage')){ if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', function(){ build(); set(2, STAGE.three); }); else { build(); set(2, STAGE.three); } }
window.X3DLoad = {three: three, set: set, done: finish};
})();
