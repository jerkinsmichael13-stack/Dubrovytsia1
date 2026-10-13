/* «Переглянути у себе»: модель у доповненій реальності, без жодних програм.
   iPhone/iPad — AR Quick Look (файл .usdz), Android — Google Scene Viewer (файл .glb), комп'ютер — QR-код для телефона.
   Підключення:  <script src="ar-3d.js" data-model="mykolai" data-name="Свято-Миколаївська церква" data-scale="1:50" defer></script>
   Файли моделей лежать у ar/<model>.glb, ar/<model>.usdz, QR-коди — у ar/qr-<model>.svg */
(function(){
  'use strict';
  var me = document.currentScript, D = me.dataset, model = D.model;
  if (!model) return;
  var base = new URL('ar/', me.src).href, page = location.href.split('#')[0].split('?')[0];
  var glb = base + model + '.glb', usdz = base + model + '.usdz', name = D.name || document.title;
  var ua = navigator.userAgent, isAndroid = /android/i.test(ua);
  var quickLook = (function(){ var a = document.createElement('a'); return !!(a.relList && a.relList.supports && a.relList.supports('ar')); })();
  var isIOS = quickLook || /iP(hone|ad|od)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  var css = document.createElement('style');
  css.textContent = [
    '.arb{display:inline-flex;align-items:center;gap:.5rem;margin:.9rem 0 0 .5rem;padding:.45rem .95rem .45rem .7rem;border-radius:999px;cursor:pointer;',
    '  border:1px solid rgba(212,178,90,.55);background:linear-gradient(180deg,rgba(212,178,90,.2),rgba(212,178,90,.08));color:var(--text,#f4e9c8);',
    '  font:600 .74rem var(--body,system-ui);letter-spacing:.02em;transition:border-color .2s,background .2s,transform .2s;-webkit-tap-highlight-color:transparent}',
    '.arb:hover{border-color:var(--gold,#d4b25a);background:linear-gradient(180deg,rgba(212,178,90,.3),rgba(212,178,90,.12))}',
    '.arb:active{transform:scale(.97)}',
    '.arb svg{width:18px;height:18px;flex:none;color:var(--gold,#d4b25a)}',
    '.arb.busy{opacity:.7;pointer-events:none}',
    '.arb.nudge{animation:arbPulse 1.6s ease-in-out 3}',
    '@keyframes arbPulse{50%{box-shadow:0 0 0 8px rgba(212,178,90,0),0 0 0 0 rgba(212,178,90,.5)}0%{box-shadow:0 0 0 0 rgba(212,178,90,.55)}}',
    '.arp{position:fixed;inset:0;z-index:20;display:grid;place-items:center;padding:16px;background:rgba(10,8,5,.62);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);',
    '  opacity:0;visibility:hidden;transition:opacity .3s,visibility .3s}',
    '.arp.open{opacity:1;visibility:visible}',
    '.arp-card{position:relative;width:min(440px,100%);padding:1.6rem 1.6rem 1.4rem;border-radius:20px;border:1px solid rgba(212,178,90,.3);',
    '  background:radial-gradient(120% 90% at 50% 0%,#2e2517,#17120b);color:var(--text,#f4e9c8);box-shadow:0 30px 80px rgba(0,0,0,.5);transform:translateY(10px);transition:transform .35s cubic-bezier(.16,1,.3,1)}',
    '.arp.open .arp-card{transform:none}',
    '.arp-k{margin:0 0 .4rem;font:600 .64rem var(--body,system-ui);letter-spacing:.16em;text-transform:uppercase;color:var(--gold,#d4b25a)}',
    '.arp h2{margin:0 0 .5rem;font:400 1.6rem/1.1 var(--display,Georgia,serif)}',
    '.arp p{margin:.4rem 0 0;font:400 .82rem/1.55 var(--body,system-ui);color:rgba(244,233,200,.75)}',
    '.arp-row{display:flex;gap:1.1rem;align-items:center;margin-top:1.1rem}',
    '.arp-qr{flex:none;width:148px;height:148px;padding:9px;border-radius:12px;background:#f4e9c8}',
    '.arp-qr img{display:block;width:100%;height:100%}',
    '.arp ol{margin:0;padding:0 0 0 1.1rem;font:400 .8rem/1.5 var(--body,system-ui);color:rgba(244,233,200,.82)}',
    '.arp li+li{margin-top:.35rem}',
    '.arp-x{position:absolute;right:.7rem;top:.7rem;width:36px;height:36px;border-radius:50%;border:0;background:transparent;color:rgba(244,233,200,.7);cursor:pointer;font-size:1.3rem;line-height:1}',
    '.arp-x:hover{color:var(--text,#f4e9c8);background:rgba(244,233,200,.08)}',
    '.arp-dl{display:inline-block;margin-top:1rem;font:600 .74rem var(--body,system-ui);color:var(--gold,#d4b25a);text-decoration:none}',
    '.arp-dl:hover{text-decoration:underline}',
    '@media(max-width:480px){.arp-row{flex-direction:column;align-items:flex-start}.arp-qr{display:none}}',
    '@media(max-width:640px){.arb{margin-left:0}}',
    '@media(prefers-reduced-motion:reduce){.arp,.arp-card,.arb{transition:none}.arb.nudge{animation:none}}'
  ].join('\n');
  document.head.appendChild(css);

  var icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M12 3.2 19 7v7.6L12 18.5 5 14.6V7z"/><path d="M5 7l7 3.9L19 7M12 10.9v7.6"/><path d="M3 18.2c1.6 1.6 5 2.6 9 2.6s7.4-1 9-2.6"/></svg>';
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'arb'; btn.innerHTML = icon + '<span>Переглянути у себе</span>';
  btn.setAttribute('aria-label', 'Переглянути модель у себе: доповнена реальність через камеру телефона');
  var anchor = document.querySelector('.top .other') || document.querySelector('.top h1');
  if (!anchor) return;
  anchor.insertAdjacentElement('afterend', btn);
  if (/[?&#]ar\b/.test(location.href) && (isIOS || isAndroid)) btn.classList.add('nudge');

  function quickLookOpen(){
    var a = document.createElement('a'); a.rel = 'ar';
    a.href = usdz + '#allowsContentScaling=1&canonicalWebPageURL=' + encodeURIComponent(page);
    a.appendChild(document.createElement('img'));
    document.body.appendChild(a); a.click(); setTimeout(function(){ a.remove(); }, 1000);
  }
  function sceneViewerOpen(){
    var p = 'file=' + encodeURIComponent(glb) + '&mode=ar_preferred&resizable=true&title=' + encodeURIComponent(name) + '&link=' + encodeURIComponent(page);
    location.href = 'intent://arvr.google.com/scene-viewer/1.0?' + p +
      '#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=' +
      encodeURIComponent(glb) + ';end;';
  }

  var pop = null;
  function openPop(){
    if (!pop){
      pop = document.createElement('div'); pop.className = 'arp'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-modal', 'true'); pop.setAttribute('aria-label', 'Переглянути у себе');
      pop.innerHTML = '<div class="arp-card"><button type="button" class="arp-x" aria-label="Закрити">×</button>' +
        '<p class="arp-k">Доповнена реальність</p><h2>Поставте ' + (D.acc || 'модель') + ' у себе</h2>' +
        (isIOS ? '<p>Цей браузер не відкриває доповнену реальність. Відкрийте сторінку в Safari й натисніть кнопку ще раз.</p>' :
        '<p>Камера телефона покаже модель просто на вашому столі чи підлозі, і її можна обійти довкола. Програм встановлювати не треба: це вміють і iPhone, і Android.</p>') +
        '<div class="arp-row"><div class="arp-qr"><img src="' + base + 'qr-' + model + '.svg" alt="QR-код цієї сторінки"></div>' +
        '<ol><li>Наведіть камеру телефона на код.</li><li>Відкрийте сторінку й натисніть «Переглянути у себе».</li>' +
        '<li>Повільно поведіть телефоном над столом — модель стане на нього в масштабі ' + (D.scale || '1:50') + '. Двома пальцями її можна повернути чи збільшити хоч до справжнього розміру.</li></ol></div>' +
        '<a class="arp-dl" href="' + glb + '" download>Завантажити 3D-файл (.glb) →</a></div>';
      document.body.appendChild(pop);
      pop.addEventListener('click', function(e){ if (e.target === pop || e.target.closest('.arp-x')) closePop(); });
      addEventListener('keydown', function(e){ if (e.key === 'Escape') closePop(); });
    }
    requestAnimationFrame(function(){ pop.classList.add('open'); pop.querySelector('.arp-x').focus(); });
  }
  function closePop(){ if (pop) pop.classList.remove('open'); btn.focus(); }

  btn.addEventListener('click', function(){
    if (window.gtag) try { gtag('event', 'ar_open', {model: model, platform: quickLook ? 'ios' : isAndroid ? 'android' : 'desktop'}); } catch(e){}
    if (quickLook) quickLookOpen();
    else if (isAndroid) sceneViewerOpen();
    else openPop();
  });
})();
