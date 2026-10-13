/* Додатки до 3D-моделей: «Цікаве» (точки на моделі), «Екскурсія» (камера сама облітає пам'ятку),
   «Звук» (синтезовані дзвони, орган, птахи й вітер — без чужих записів), «Погода» (сніг, дощ, осінь, туман).
   Підключення:  <script src="x3d-extras.js" data-model="mykolai" defer></script>
   Сторінка моделі має віддати api:  window.x3dApi = api; document.dispatchEvent(new CustomEvent('x3d:ready', {detail: api}));
   Усі факти в точках — з описів на самих сторінках сайту та з архіву преси. */
(function(){
'use strict';
var me = document.currentScript, MODEL = me && me.dataset.model;

/* ═══════════ ТОЧКИ: координати моделі (м), заголовок, текст; v — напрям камери на екскурсії, r — відстань ═══════════ */
var SPOTS = {
  mykolai: {sound: 'bells', spots: [
    {p: [-5.4, 3.0, 0], v: [-1, .25, .35], r: 13, t: 'Західний ґанок', d: 'Головний вхід — під дзвіницею, через ґанок із поручнями. Над дверима великий білий наличник і вікно-віяло під фризом.'},
    {p: [-1.9, 9.5, 0], v: [-.6, .3, .8], r: 15, t: 'Дзвіниця', d: 'Опис 1888 року згадує при церкві дерев\'яну дзвіницю. Нині вона стоїть над входом: у кожній стіні арковий проріз із зеленими жалюзі над білою балюстрадою, вище — чотирисхилий шпиль.'},
    {p: [3.3, 3.2, 3.3], v: [.1, .2, 1], r: 13, t: 'Трапезна', d: 'Невисока трапезна на три вікна з кожного боку з\'єднує дзвіницю з центральною частиною. Над кожним вікном — білий наличник із загостреним «будиночком».'},
    {p: [10.7, 12.0, 0], v: [.35, .45, 1], r: 17, y: '1872', t: 'Баня', d: 'Церкву збудовано 1872 року коштом парафіян. «Дерев\'яна, на кам\'яному фундаменті, крита жерстю, всередині й зовні пофарбована», — так її описують «Волинські єпархіальні відомості» 1888 року.'},
    {p: [10.7, 3.4, 9.6], v: [.3, .2, 1], r: 14, y: '1913', t: 'Південний ґанок', d: '23 червня 1913 року сюди принесли раку з мощами святої Іуліанії. До її прибуття в Дубровиці зібралося понад 6 000 прочан; храм і подвір\'я всю ніч були повні людей.'},
    {p: [19.3, 3.2, 0], v: [1, .25, -.3], r: 14, y: '1790', t: 'Вівтар', d: 'Нижча вівтарна частина зі сходу. Метричні книги парафії, за описом 1888 року, зберігалися від 1790-го.'}
  ]},
  cerkva: {sound: 'bells', spots: [
    {p: [-18.1, 5.0, 6.6], v: [-.5, .2, 1], r: 16, y: '1537', t: 'Головний вхід', d: 'Перша відома згадка про Пречистенську церкву «вище міста» — 1537 року, у заповіті князя Юрія Гольшанського-Дубровицького.'},
    {p: [-17.4, 24.0, 0], v: [-.7, .35, .7], r: 20, t: 'Дзвіниця', d: 'Одна з трьох бань стоїть над дзвіницею. Три бані по одній осі — над дзвіницею, над барабаном і над вівтарем — схема, успадкована від дерев\'яних церков Полісся.'},
    {p: [0, 19.5, 0], v: [.2, .45, 1], r: 22, y: '1861', t: 'Барабан і баня', d: 'Нинішню муровану церкву звели 1861 року коштом графа Ігнатія Броель-Плятера. Восьмигранний барабан стоїть над середохрестям.'},
    {p: [0, 7.0, 7.6], v: [0, .2, 1], r: 18, y: '1892', t: 'Бічний фасад', d: '1892 року парафія сягнула 4 439 вірян — найбільше за всю її історію.'},
    {p: [11.0, 10.5, 0], v: [1, .3, .4], r: 18, y: '1962', t: 'Вівтарна баня', d: '1962 року радянська влада закрила храм і зробила в ньому склад солі. Будівлю мали підірвати; наказ скасував начальник міліції Дмитро Башинський. 1992-го громаду зареєстрували знову, храм відреставрували.'}
  ]},
  kostel: {sound: 'organ', spots: [
    {p: [0, 3.2, .6], v: [0, .15, 1], r: 18, y: '1681', t: 'Головний вхід', d: 'Ян Кароль Дольський записує піарам 35 тисяч злотих на костел і колегіум.'},
    {p: [0, 10.7, .6], v: [.15, .2, 1], r: 20, t: 'Напис на фризі', d: '«SAMEMU BOGU CZESC I CHWALA» — «Самому Богові честь і слава». На будівлі напис зроблено без польських діакритиків.'},
    {p: [8.2, 28.0, -2.8], v: [.6, .3, 1], r: 24, y: '1740', t: 'Вежі', d: 'Нинішню муровану базиліку зведено 1740 року, за ректора Казимира Пнєвського. Пам\'ятка архітектури національного значення, № 1497.'},
    {p: [0, 22.0, -14], v: [1, .5, .2], r: 28, y: '1742', t: 'Неф', d: 'Костел освятив 1742 року єпископ Франциск Кобельський.'},
    {p: [0, 13.0, -29.5], v: [.8, .3, -1], r: 22, y: '1945', t: 'Пресвітерій', d: '1945 року костел зачинили: дзвони вивезли, орган знищили, будівлю віддали під склад. 1992-го його повторно освятили й повернули громаді.'}
  ]},
  worobin: {sound: 'nature', spots: [
    {p: [-12.4, 7.0, 0], v: [-1, .2, .25], r: 20, t: 'Західний портик', d: 'Чотири дорицькі колони великого ордера, фронтон із круглим вікном і дев\'ять кам\'яних сходинок на всю ширину; обабіч сходів — кам\'яні плити під вазони.'},
    {p: [0, 6.5, 11.8], v: [.15, .2, 1], r: 22, y: '1775', t: 'Південна колонада', d: 'Шість колон уздовж усього фасаду, над ними аттик. Воробинську книгозбірню 1775 року почав збирати Юзеф Антоній Плятер.'},
    {p: [8.6, 5.0, 0], v: [1, .2, -.2], r: 20, y: '1887', t: 'Фасад до Горині', d: 'П\'ять заокруглених ніш на всю висоту. Схил тут спадає, тож видно цокольний поверх із віконцями. 1887 року павільйон перебудували під житло: великі зали поділили на кімнати.'},
    {p: [0, 15.5, -10.8], v: [-.3, .35, -1], r: 22, t: 'Вежа', d: 'Двоповерхова квадратна вежа на півночі під високим гострим дахом. Північний фасад відтворено за описом.'},
    {p: [-3, 11.5, 0], v: [-.5, .7, .6], r: 26, y: '1917', t: 'Доля бібліотеки', d: '1917 року бібліотеку розграбовано, книжки звалено на купу й спалено. На фотографіях 1937 року павільйон уже покинутий, із забитими вікнами.'}
  ]}
};
var CFG = SPOTS[MODEL]; if (!CFG) return;

var ICON = {
  spots: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17.5s5.5-5 5.5-9.3a5.5 5.5 0 0 0-11 0c0 4.3 5.5 9.3 5.5 9.3z"/><circle cx="10" cy="8.2" r="1.9"/></svg>',
  tour: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="7.2"/><path d="M8.3 6.9v6.2l4.9-3.1z" fill="currentColor" stroke="none"/></svg>',
  sound: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 7.6h2.8L10 4.5v11L6.3 12.4H3.5z"/><path class="w1" d="M13 7.4a3.6 3.6 0 0 1 0 5.2"/><path class="w2" d="M15.2 5.3a6.6 6.6 0 0 1 0 9.4"/><path class="mx" d="M13.2 7.8l4 4.4M17.2 7.8l-4 4.4"/></svg>',
  weather: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14.2h8.2a3.4 3.4 0 0 0 .3-6.8 4.6 4.6 0 0 0-8.9 1.2A2.8 2.8 0 0 0 6 14.2z"/><path d="M7.5 16.8l-.6 1.3M10.5 16.8l-.6 1.3M13.5 16.8l-.6 1.3"/></svg>'
};
var WEATHER = [['clear', 'Ясно'], ['snow', 'Зима'], ['rain', 'Дощ'], ['autumn', 'Осінь'], ['fog', 'Туман']];

var CSS = [
  '.xr{position:fixed;z-index:3;right:clamp(14px,2.4vw,32px);bottom:calc(env(safe-area-inset-bottom,0px) + 24px);display:flex;flex-direction:column;gap:6px;padding:5px;border-radius:999px;border:1px solid var(--faint);background:rgba(23,18,11,.62);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}',
  '.xr button{position:relative;display:grid;place-items:center;width:42px;height:42px;border:0;border-radius:50%;background:none;color:var(--text);cursor:pointer;transition:background .2s,color .2s}',
  '.xr button:hover{background:rgba(244,233,200,.08)}.xr button[aria-pressed="true"]{background:rgba(212,178,90,.2);color:var(--gold)}',
  '.xr svg{width:20px;height:20px}.xr button[aria-pressed="false"] .w1,.xr button[aria-pressed="false"] .w2{display:none}.xr button[aria-pressed="true"] .mx,.xr button:not([aria-pressed]) .mx{display:none}',
  '.xr button::after{content:attr(data-l);position:absolute;right:calc(100% + 10px);top:50%;transform:translateY(-50%);padding:.3rem .6rem;border-radius:8px;background:rgba(23,18,11,.88);color:var(--text);font:500 .72rem var(--body);white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .2s}',
  '.xr button:hover::after,.xr button:focus-visible::after{opacity:1}',
  '.xw{position:fixed;z-index:4;right:calc(clamp(14px,2.4vw,32px) + 62px);bottom:calc(env(safe-area-inset-bottom,0px) + 24px);display:flex;flex-direction:column;gap:2px;padding:5px;border-radius:16px;border:1px solid var(--faint);background:rgba(23,18,11,.82);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);opacity:0;visibility:hidden;transform:translateX(6px);transition:opacity .25s,visibility .25s,transform .25s}',
  '.xw.open{opacity:1;visibility:visible;transform:none}',
  '.xw button{padding:.5rem .95rem;border:0;border-radius:11px;background:none;color:var(--text);font:500 .78rem var(--body);text-align:left;cursor:pointer}',
  '.xw button:hover{background:rgba(244,233,200,.08)}.xw button[aria-pressed="true"]{background:rgba(212,178,90,.2);color:var(--gold)}',
  '.xm{position:fixed;inset:0;z-index:2;pointer-events:none;overflow:hidden}',
  /* markers: a small gilded point with a soft halo; its name slides out on hover and while it is the one being told about */
  '.xp{position:absolute;left:0;top:0;width:30px;height:30px;margin:-15px 0 0 -15px;padding:0;border:0;background:none;cursor:pointer;pointer-events:auto;transition:opacity .35s;will-change:transform;-webkit-tap-highlight-color:transparent}',
  '.xp i{position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff6d8,#e2bd62 55%,#a8822c);',
  '  box-shadow:0 0 0 1.5px rgba(23,18,11,.55),0 0 10px 2px rgba(255,214,120,.55);transition:transform .25s cubic-bezier(.16,1,.3,1)}',
  '.xp i::after{content:"";position:absolute;inset:-7px;border-radius:50%;border:1px solid rgba(240,210,140,.55);animation:xpHalo 3.2s ease-in-out infinite}',
  '.xp span{position:absolute;left:24px;top:50%;transform:translate(-6px,-50%);padding:.28rem .62rem .3rem;border-radius:999px;white-space:nowrap;border:1px solid rgba(212,178,90,.45);',
  '  background:rgba(23,18,11,.8);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);color:#f4e9c8;font:400 .9rem/1 var(--display);letter-spacing:.01em;opacity:0;pointer-events:none;transition:opacity .25s,transform .3s cubic-bezier(.16,1,.3,1)}',
  '.xp.l span{left:auto;right:24px;transform:translate(6px,-50%)}',
  '.xp:hover i,.xp.on i{transform:scale(1.35)}',
  '.xp:hover span,.xp.on span,.xp:focus-visible span{opacity:1;transform:translate(0,-50%)}',
  '.xp:focus-visible{outline:none}.xp:focus-visible i{box-shadow:0 0 0 2px #f4e9c8,0 0 12px 3px rgba(255,214,120,.7)}',
  '.xp.hid{opacity:0;pointer-events:none}.xp.dim{opacity:0;pointer-events:none}.xp.dim.on{opacity:.55}',
  '.xm.off .xp{opacity:0;pointer-events:none}',
  '@keyframes xpHalo{0%,100%{transform:scale(.75);opacity:.85}50%{transform:scale(1.15);opacity:.25}}',
  '.xc{position:fixed;z-index:4;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 132px);width:min(430px,calc(100vw - 32px));padding:1.05rem 1.2rem 1rem;border-radius:18px;border:1px solid rgba(212,178,90,.3);',
  '  background:linear-gradient(180deg,rgba(46,37,23,.94),rgba(23,18,11,.94));backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);color:var(--text);box-shadow:0 18px 50px rgba(0,0,0,.45);',
  '  transform:translate(-50%,10px);opacity:0;visibility:hidden;transition:opacity .3s,visibility .3s,transform .35s cubic-bezier(.16,1,.3,1)}',
  '.xc.open{opacity:1;visibility:visible;transform:translate(-50%,0)}',
  '.xc-h{display:flex;align-items:baseline;gap:.6rem;margin:0 2rem .35rem 0}.xc-h b{font:400 1.35rem/1.1 var(--display)}.xc-h span{font:400 1.05rem var(--display);color:var(--gold)}',
  '.xc p{margin:0;font:400 .84rem/1.55 var(--body);color:rgba(244,233,200,.84)}',
  '.xc-f{display:flex;align-items:center;justify-content:space-between;gap:.6rem;margin-top:.8rem}',
  '.xc-n{font:500 .7rem var(--body);letter-spacing:.08em;color:var(--muted)}',
  '.xc-b{display:flex;gap:.35rem}.xc-b button{display:inline-flex;align-items:center;gap:.35rem;padding:.4rem .8rem;border-radius:999px;border:1px solid var(--faint);background:none;color:var(--text);font:500 .74rem var(--body);cursor:pointer}',
  '.xc-b button:hover{border-color:var(--gold)}.xc-b button.pri{border-color:rgba(212,178,90,.55);background:rgba(212,178,90,.16)}',
  '.xc-x{position:absolute;right:.55rem;top:.55rem;width:32px;height:32px;border:0;border-radius:50%;background:none;color:var(--muted);font-size:1.2rem;cursor:pointer}.xc-x:hover{color:var(--text);background:rgba(244,233,200,.08)}',
  '.xc-p{position:absolute;left:1.2rem;right:1.2rem;bottom:0;height:2px;border-radius:2px;background:rgba(244,233,200,.1);overflow:hidden}.xc-p i{display:block;height:100%;width:0;background:var(--gold)}',
  '.xo{position:fixed;inset:0;z-index:1;pointer-events:none;opacity:0;transition:opacity 1.2s,background 1.2s}',
  '#view{z-index:1}',
  '@media(min-width:900px){.xc{left:clamp(16px,3vw,36px);bottom:calc(env(safe-area-inset-bottom,0px) + 104px);width:min(380px,30vw);transform:translateY(10px)}.xc.open{transform:none}}',
  '@media(max-width:640px){.xr{right:10px;bottom:auto;top:31%;z-index:5}.xr button{width:40px;height:40px}.xr button::after{display:none}',
  '  .xw{right:64px;bottom:auto;top:31%;z-index:5;transform:translateX(6px)}.xw.open{transform:none}',
  '  .xc{left:12px;right:12px;width:auto;bottom:calc(env(safe-area-inset-bottom,0px) + 86px);padding:.85rem .95rem .8rem;transform:translateY(10px)}.xc.open{transform:none}',
  '  body.xc-on .top,body.xc-on .xr~.arb{opacity:0;pointer-events:none}.top{transition:opacity .4s}',
  '  .xc-h b{font-size:1.15rem}.xc p{font-size:.78rem;line-height:1.5}.xc-f{margin-top:.55rem}}',
  '@media(prefers-reduced-motion:reduce){.xp i::after{animation:none}.xc,.xw,.xo{transition:none}}'
].join('\n');

function el(tag, cls, html){ var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function init(api){
  if (init.done || !api || !api.camera || !api.model) return; init.done = true;
  var T = window.THREE, cam = api.camera, ctl = api.controls, scene = api.scene;
  var st = el('style'); st.textContent = CSS; document.head.appendChild(st);

  /* ── rail ── */
  var rail = el('div', 'xr'); rail.setAttribute('role', 'toolbar'); rail.setAttribute('aria-label', 'Додатково');
  function rb(key, label, pressed){ var b = el('button', null, ICON[key]); b.type = 'button'; b.dataset.l = label; b.setAttribute('aria-label', label); if (pressed != null) b.setAttribute('aria-pressed', String(pressed)); rail.appendChild(b); return b; }
  var bSpots = rb('spots', 'Цікаве на моделі', true), bTour = rb('tour', 'Екскурсія'), bSound = rb('sound', 'Звук', false), bWeather = rb('weather', 'Погода й пора року', false);
  document.body.appendChild(rail);

  /* ── markers ── */
  var layer = el('div', 'xm'); document.body.appendChild(layer);
  var spots = CFG.spots.map(function(s, i){
    var b = el('button', 'xp', '<i></i><span></span>'); b.querySelector('span').textContent = s.t; b.type = 'button'; b.setAttribute('aria-label', (i + 1) + '. ' + s.t);
    b.addEventListener('click', function(e){ e.stopPropagation(); stopTour(); show(i); });
    layer.appendChild(b);
    return {s: s, b: b, v: new T.Vector3(s.p[0], s.p[1], s.p[2]), occ: false};
  });
  var ray = new T.Raycaster(), tmp = new T.Vector3(), fwd = new T.Vector3(), lastOcc = 0;
  /* pin each marker to the surface seen from its tour direction, so it is not buried inside a wall or roof */
  api.model.updateMatrixWorld(true);
  spots.forEach(function(o){
    var s = o.s; if (!s.v) return;
    var d = new T.Vector3(s.v[0], s.v[1], s.v[2]).normalize(), from = o.v.clone().addScaledVector(d, 80);
    ray.set(from, d.clone().negate()); ray.far = 80;
    var hit = ray.intersectObject(api.model, true).filter(function(h){ return h.object.material && h.object.material.colorWrite !== false; });
    if (hit.length) o.v.copy(hit[0].point).addScaledVector(d, .35);
  });
  function place(now){
    var w = innerWidth, h = innerHeight, rect = api.renderer.domElement.getBoundingClientRect();
    if (now - lastOcc > 160){ lastOcc = now;
      spots.forEach(function(o){ var d = o.v.distanceTo(cam.position); tmp.copy(o.v).sub(cam.position).normalize(); ray.set(cam.position, tmp); ray.far = d;
        var hit = ray.intersectObject(api.model, true); o.occ = hit.length > 0 && hit[0].distance < d - .6; }); }
    cam.getWorldDirection(fwd);
    spots.forEach(function(o){
      var ahead = tmp.copy(o.v).sub(cam.position).dot(fwd) > .5;
      tmp.copy(o.v).project(cam);
      var vis = ahead && tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05;
      o.b.classList.toggle('hid', !vis); o.b.classList.toggle('dim', vis && o.occ);
      if (vis){ var sx = rect.left + (tmp.x + 1)/2*rect.width; o.b.style.transform = 'translate(' + sx.toFixed(1) + 'px,' + (rect.top + (1 - tmp.y)/2*rect.height).toFixed(1) + 'px)'; o.b.classList.toggle('l', sx > w*.6); }
    });
  }
  var spotsOn = true;
  bSpots.addEventListener('click', function(){ spotsOn = !spotsOn; bSpots.setAttribute('aria-pressed', String(spotsOn)); layer.classList.toggle('off', !spotsOn); if (!spotsOn) closeCard(); });

  /* ── card ── */
  var card = el('section', 'xc'); card.setAttribute('aria-live', 'polite');
  card.innerHTML = '<button type="button" class="xc-x" aria-label="Закрити">×</button><div class="xc-h"><b></b><span></span></div><p></p>' +
    '<div class="xc-f"><span class="xc-n"></span><div class="xc-b"><button type="button" data-a="prev" aria-label="Попередня">←</button><button type="button" data-a="next" class="pri">Далі →</button></div></div><div class="xc-p"><i></i></div>';
  document.body.appendChild(card);
  var cur = -1;
  function show(i, fromTour){
    cur = (i + spots.length) % spots.length; var s = spots[cur].s;
    card.querySelector('.xc-h b').textContent = s.t; card.querySelector('.xc-h span').textContent = s.y || '';
    card.querySelector('p').textContent = s.d; card.querySelector('.xc-n').textContent = (cur + 1) + ' / ' + spots.length;
    card.classList.add('open'); document.body.classList.add('xc-on'); spots.forEach(function(o, k){ o.b.classList.toggle('on', k === cur); });
    if (!fromTour) fly(cur, 1400);
  }
  function closeCard(){ card.classList.remove('open'); document.body.classList.remove('xc-on'); spots.forEach(function(o){ o.b.classList.remove('on'); }); cur = -1; }
  card.querySelector('.xc-x').addEventListener('click', function(){ stopTour(); closeCard(); });
  card.addEventListener('click', function(e){ var a = e.target.closest('[data-a]'); if (!a) return;
    if (touring){ tourStep(a.dataset.a === 'next' ? 1 : -1); return; }
    show(cur + (a.dataset.a === 'next' ? 1 : -1)); });

  /* ── camera flights ── */
  var box = new T.Box3().setFromObject(api.model), centre = box.getCenter(new T.Vector3()), size = box.getSize(new T.Vector3());
  var flight = null;
  function viewFor(i){
    var s = spots[i].s, p = spots[i].v, d;
    if (s.v) d = new T.Vector3(s.v[0], s.v[1], s.v[2]);
    else { d = new T.Vector3(p.x - centre.x, 0, p.z - centre.z); if (d.lengthSq() < .01) d.copy(cam.position).sub(p).setY(0); d.normalize().setY(.3); }
    d.normalize();
    var r = (s.r || Math.max(size.x, size.z)*.6)*Math.max(1.9, size.y/13)*(innerWidth < 700 ? 1.75 : 1);
    var t = p.clone().lerp(new T.Vector3(centre.x, Math.min(p.y, centre.y), centre.z), .35);   // keep the building in frame
    var pos = t.clone().addScaledVector(d, r); pos.y = Math.max(pos.y, 1.2);
    if (innerWidth < 700){ var dy = r*.085; t.y -= dy; pos.y -= dy; }   // the card covers the lower half on a phone: keep the subject above it
    return {t: t, p: pos};
  }
  function fly(i, ms){
    api.autoRotate(false); var v = viewFor(i);
    flight = {t0: performance.now(), ms: reduced ? 1 : ms, a: {t: ctl.target.clone(), p: cam.position.clone()}, b: v};
  }
  function stepFlight(now){
    if (!flight) return;
    var k = Math.min(1, (now - flight.t0)/flight.ms), e = k < .5 ? 4*k*k*k : 1 - Math.pow(-2*k + 2, 3)/2;
    ctl.target.lerpVectors(flight.a.t, flight.b.t, e);
    // swing round the target rather than cutting through the building
    var A = flight.a.p.clone().sub(flight.a.t), B = flight.b.p.clone().sub(flight.b.t);
    var sa = new T.Spherical().setFromVector3(A), sb = new T.Spherical().setFromVector3(B), dt = sb.theta - sa.theta;
    if (dt > Math.PI) dt -= 2*Math.PI; if (dt < -Math.PI) dt += 2*Math.PI;
    var sp = new T.Spherical(sa.radius + (sb.radius - sa.radius)*e, sa.phi + (sb.phi - sa.phi)*e, sa.theta + dt*e);
    cam.position.copy(ctl.target).add(new T.Vector3().setFromSpherical(sp));
    cam.lookAt(ctl.target);
    if (k >= 1) flight = null;
  }
  ctl.addEventListener('start', function(){ flight = null; if (touring) pauseTour(); });

  /* ── tour ── */
  var touring = false, paused = false, tStart = 0, tDur = 0, tIdx = 0, prog = card.querySelector('.xc-p i');
  function readTime(i){ return Math.max(5200, spots[i].s.d.length*55); }
  function tourStep(dir){
    tIdx += dir;
    if (tIdx >= spots.length){ stopTour(); closeCard(); api.reset(); return; }
    if (tIdx < 0) tIdx = 0;
    fly(tIdx, 2300); show(tIdx, true); paused = false; tStart = performance.now() + 2300; tDur = readTime(tIdx);
    card.querySelector('[data-a="next"]').textContent = tIdx === spots.length - 1 ? 'Завершити' : 'Далі →';
  }
  function startTour(){ touring = true; bTour.setAttribute('aria-pressed', 'true'); if (!spotsOn) bSpots.click(); tIdx = -1; tourStep(1); }
  function pauseTour(){ paused = true; prog.style.width = '0'; }
  function stopTour(){ if (!touring) return; touring = false; paused = false; bTour.removeAttribute('aria-pressed'); prog.style.width = '0'; card.querySelector('[data-a="next"]').textContent = 'Далі →'; }
  bTour.addEventListener('click', function(){ if (touring){ stopTour(); closeCard(); } else startTour(); });
  function stepTour(now){
    if (!touring || paused) return;
    var k = (now - tStart)/tDur; prog.style.width = Math.max(0, Math.min(1, k))*100 + '%';
    if (k >= 1) tourStep(1);
  }

  /* ═══════════ WEATHER ═══════════ */
  var wPanel = el('div', 'xw'); wPanel.setAttribute('role', 'group'); wPanel.setAttribute('aria-label', 'Погода');
  WEATHER.forEach(function(w){ var b = el('button', null, w[1]); b.type = 'button'; b.dataset.w = w[0]; b.setAttribute('aria-pressed', String(w[0] === 'clear')); wPanel.appendChild(b); });
  document.body.appendChild(wPanel);
  bWeather.addEventListener('click', function(){ var o = !wPanel.classList.contains('open'); wPanel.classList.toggle('open', o); bWeather.setAttribute('aria-pressed', String(o || weather !== 'clear')); });
  wPanel.addEventListener('click', function(e){ var b = e.target.closest('[data-w]'); if (!b) return; setWeather(b.dataset.w); });
  addEventListener('keydown', function(e){ if (e.key === 'Escape'){ wPanel.classList.remove('open'); bWeather.setAttribute('aria-pressed', String(weather !== 'clear')); } });
  var overlay = el('div', 'xo'); api.renderer.domElement.insertAdjacentElement('afterend', overlay);

  /* snow on every upward-facing surface: one uniform shared by all the model's materials */
  var U = {uSnow: {value: 0}, uUpV: {value: new T.Vector3(0, 1, 0)}}, patched = [];
  scene.traverse(function(o){
    if (!o.isMesh) return; var m = o.material;
    if (!m || !m.isMeshStandardMaterial || patched.indexOf(m) >= 0) return; patched.push(m);
    var prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey;
    m.onBeforeCompile = function(sh, r){
      if (prev) prev.call(this, sh, r);
      sh.uniforms.uSnow = U.uSnow; sh.uniforms.uUpV = U.uUpV;
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uSnow; uniform vec3 uUpV;')
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' +
          'float xsn = uSnow*smoothstep(0.42, 0.78, dot(normal, uUpV));\n' +
          'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.95, 0.99), xsn);\n' +
          'roughnessFactor = mix(roughnessFactor, 0.85, xsn); metalnessFactor *= 1.0 - xsn;');
    };
    m.customProgramCacheKey = function(){ return (prevKey ? prevKey.call(this) : '') + '|xsnow'; };
    m.needsUpdate = true;
  });

  function sprite(draw){ var c = document.createElement('canvas'); c.width = c.height = 64; draw(c.getContext('2d')); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t; }
  var flake = sprite(function(k){ var g = k.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.45, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = g; k.fillRect(0, 0, 64, 64); });
  var leaf = sprite(function(k){ k.translate(32, 32); k.rotate(.6); k.fillStyle = '#fff'; k.beginPath(); k.moveTo(0, -26); k.quadraticCurveTo(20, -4, 0, 26); k.quadraticCurveTo(-20, -4, 0, -26); k.fill(); k.strokeStyle = 'rgba(0,0,0,.35)'; k.lineWidth = 2; k.beginPath(); k.moveTo(0, -22); k.lineTo(0, 24); k.stroke(); });
  var R = Math.max(size.x, size.z)*.75 + 6, HH = size.y + 12;
  function cloud(n, mat, rnd){
    var g = new T.BufferGeometry(), pos = new Float32Array(n*3), sp = new Float32Array(n);
    for (var i = 0; i < n; i++){ var a = Math.random()*Math.PI*2, r = Math.sqrt(Math.random())*R; pos[i*3] = centre.x + Math.cos(a)*r; pos[i*3 + 1] = Math.random()*HH; pos[i*3 + 2] = centre.z + Math.sin(a)*r; sp[i] = Math.random(); }
    g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.userData.sp = sp;
    if (rnd) g.setAttribute('color', new T.BufferAttribute(rnd(n), 3));
    var p = new T.Points(g, mat); p.frustumCulled = false; p.renderOrder = 9; return p;
  }
  var FX = {};
  function makeFx(kind){
    if (FX[kind]) return FX[kind];
    var o;
    if (kind === 'snow') o = cloud(innerWidth < 700 ? 3000 : 6000, new T.PointsMaterial({size: .34, map: flake, transparent: true, depthWrite: false, opacity: .95, color: '#ffffff'}));
    if (kind === 'autumn') o = cloud(innerWidth < 700 ? 600 : 1100, new T.PointsMaterial({size: .62, map: leaf, transparent: true, depthWrite: false, alphaTest: .4, vertexColors: true}),
      function(n){ var c = new Float32Array(n*3), P = [[.85, .45, .1], [.78, .24, .08], [.92, .68, .18], [.6, .3, .1]]; for (var i = 0; i < n; i++){ var q = P[i % 4]; c[i*3] = q[0]; c[i*3 + 1] = q[1]; c[i*3 + 2] = q[2]; } return c; });
    if (kind === 'rain'){
      var n = innerWidth < 700 ? 1800 : 3400, g = new T.BufferGeometry(), pos = new Float32Array(n*6), sp = new Float32Array(n);
      for (var i = 0; i < n; i++){ var a = Math.random()*Math.PI*2, r = Math.sqrt(Math.random())*R, x = centre.x + Math.cos(a)*r, z = centre.z + Math.sin(a)*r, y = Math.random()*HH;
        pos.set([x, y, z, x + .05, y + .9, z + .02], i*6); sp[i] = .8 + Math.random()*.4; }
      g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.userData.sp = sp;
      o = new T.LineSegments(g, new T.LineBasicMaterial({color: '#b9c9dc', transparent: true, opacity: .42, depthWrite: false})); o.frustumCulled = false; o.renderOrder = 9;
    }
    if (o){ o.visible = false; scene.add(o); FX[kind] = o; }
    return o;
  }
  var weather = 'clear', snowTarget = 0, fog0 = scene.fog;
  var OVER = {clear: '', snow: 'radial-gradient(90% 70% at 50% 40%,rgba(200,214,236,.16),rgba(40,52,74,.42))', rain: 'radial-gradient(90% 70% at 50% 40%,rgba(30,40,56,.3),rgba(8,12,20,.6))',
    autumn: 'radial-gradient(80% 60% at 50% 60%,rgba(210,120,40,.18),rgba(40,22,8,.35))', fog: 'radial-gradient(90% 70% at 50% 45%,rgba(160,160,150,.42),rgba(70,70,66,.6))'};
  function setWeather(w){
    weather = w;
    wPanel.querySelectorAll('[data-w]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.w === w)); });
    bWeather.setAttribute('aria-pressed', String(w !== 'clear' || wPanel.classList.contains('open')));
    ['snow', 'rain', 'autumn'].forEach(function(k){ var f = w === k ? makeFx(k) : FX[k]; if (f) f.visible = w === k; });
    snowTarget = w === 'snow' ? 1 : 0;
    scene.fog = w === 'fog' ? new T.FogExp2('#77766f', .028) : w === 'rain' ? new T.FogExp2('#3c4450', .012) : fog0;
    overlay.style.background = OVER[w] || 'none'; overlay.style.opacity = w === 'clear' ? 0 : 1;
    Snd.weather(w);
  }
  var lastT = 0;
  function stepFx(now){
    var dt = Math.min(.05, lastT ? (now - lastT)/1000 : 0); lastT = now;
    U.uSnow.value += (snowTarget - U.uSnow.value)*Math.min(1, dt*1.2);
    U.uUpV.value.set(0, 1, 0).transformDirection(cam.matrixWorldInverse);
    var t = now/1000;
    if (FX.snow && FX.snow.visible){ var a = FX.snow.geometry.attributes.position, sp = FX.snow.geometry.userData.sp, A = a.array;
      for (var i = 0; i < a.count; i++){ var j = i*3; A[j + 1] -= dt*(.9 + sp[i]*.8); A[j] += Math.sin(t*.7 + sp[i]*40)*dt*.35; A[j + 2] += Math.cos(t*.5 + sp[i]*30)*dt*.3; if (A[j + 1] < 0) A[j + 1] += HH; }
      a.needsUpdate = true; }
    if (FX.autumn && FX.autumn.visible){ var b = FX.autumn.geometry.attributes.position, s2 = FX.autumn.geometry.userData.sp, B = b.array;
      for (i = 0; i < b.count; i++){ j = i*3; B[j + 1] -= dt*(.55 + s2[i]*.5); B[j] += (Math.sin(t*1.3 + s2[i]*50)*1.2 + .6)*dt; B[j + 2] += Math.cos(t*1.1 + s2[i]*20)*dt*.8;
        if (B[j + 1] < 0){ B[j + 1] += HH; B[j] -= R*.4; } }
      FX.autumn.material.size = .58 + Math.sin(t*3)*.06; b.needsUpdate = true; }
    if (FX.rain && FX.rain.visible){ var c = FX.rain.geometry.attributes.position, s3 = FX.rain.geometry.userData.sp, C = c.array;
      for (i = 0; i < s3.length; i++){ j = i*6; var dy = dt*22*s3[i]; C[j + 1] -= dy; C[j + 4] -= dy; C[j] -= dy*.05; C[j + 3] -= dy*.05; if (C[j + 1] < 0){ C[j + 1] += HH; C[j + 4] += HH; } }
      c.needsUpdate = true; }
  }

  /* ═══════════ SOUND (Web Audio, all synthesised) ═══════════ */
  var Snd = (function(){
    var ctx = null, master, verb, on = false, timers = [], amb = {}, kind = CFG.sound;
    function mk(){
      if (ctx) return; var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      verb = ctx.createConvolver(); var L = ctx.sampleRate*3.2, ir = ctx.createBuffer(2, L, ctx.sampleRate);
      for (var c = 0; c < 2; c++){ var d = ir.getChannelData(c); for (var i = 0; i < L; i++) d[i] = (Math.random()*2 - 1)*Math.pow(1 - i/L, 3.2); }
      verb.buffer = ir; var vg = ctx.createGain(); vg.gain.value = .55; verb.connect(vg); vg.connect(master);
    }
    function out(g, wet){ g.connect(master); if (wet) { var w = ctx.createGain(); w.gain.value = wet; g.connect(w); w.connect(verb); } }
    function noiseBuf(sec, brown){ var L = ctx.sampleRate*sec, b = ctx.createBuffer(1, L, ctx.sampleRate), d = b.getChannelData(0), last = 0;
      for (var i = 0; i < L; i++){ var w = Math.random()*2 - 1; if (brown){ last = (last + .02*w)/1.02; d[i] = last*3.5; } else d[i] = w; } return b; }
    /* a cast bell: hum, prime, minor third, fifth, nominal and upper partials, each dying at its own rate, plus the clapper's knock */
    function bell(f, t, vol, len){
      var P = [[.5, .9, 1], [1, .7, .72], [1.19, .5, .5], [1.5, .3, .38], [2, .45, .32], [2.51, .22, .22], [2.66, .15, .2], [3.01, .14, .16], [4.16, .08, .1], [5.4, .05, .07]];
      var g = ctx.createGain(); g.gain.value = vol; var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pan){ pan.pan.value = (Math.random() - .5)*.6; g.connect(pan); out(pan, .7); } else out(g, .7);
      P.forEach(function(p){ var o = ctx.createOscillator(), a = ctx.createGain(); o.type = 'sine'; o.frequency.value = f*p[0]*(1 + (Math.random() - .5)*.003);
        a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(p[1], t + .004); a.gain.exponentialRampToValueAtTime(.0001, t + len*p[2]);
        o.connect(a); a.connect(g); o.start(t); o.stop(t + len*p[2] + .05); });
      var n = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), na = ctx.createGain(); n.buffer = noiseBuf(.08); bp.type = 'bandpass'; bp.frequency.value = f*3; bp.Q.value = 4;
      na.gain.setValueAtTime(.35, t); na.gain.exponentialRampToValueAtTime(.001, t + .06); n.connect(bp); bp.connect(na); na.connect(g); n.start(t);
    }
    /* «трезвін»: великий дзвін на сильну долю, середні між ними, малі — дрібним перебором */
    function peal(t0, bars){
      var big = 98, mid = [196, 220], small = [523.3, 587.3, 659.3, 784];
      for (var b = 0; b < bars; b++){ var t = t0 + b*2.4;
        bell(big, t, .5, 7);
        bell(mid[b % 2], t + 1.2, .22, 4);
        for (var k = 0; k < 8; k++) bell(small[(k + b) % 4]*(k % 3 === 2 ? 1.0 : 1), t + .3*k, .07, 1.6); }
    }
    function toll(n){ var t = ctx.currentTime + .05; for (var i = 0; i < n; i++) bell(kind === 'organ' ? 147 : 98, t + i*2.2, .45, 6); }
    /* organ: pipe ranks as stacked harmonics, slow chords in D major */
    function organ(){
      var CH = [[50, 57, 62, 66], [55, 59, 62, 67], [57, 61, 64, 69], [59, 62, 66, 71], [55, 59, 62, 67], [57, 61, 64, 69], [50, 57, 62, 66]], dur = 4.2;
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; var g = ctx.createGain(); g.gain.value = .085; lp.connect(g); out(g, .9);
      function chord(i, t){ CH[i % CH.length].forEach(function(m){ var f = 440*Math.pow(2, (m - 69)/12);
        [[1, 1], [2, .5], [3, .22], [4, .16], [6, .07], [8, .05]].forEach(function(h){ var o = ctx.createOscillator(), a = ctx.createGain(); o.type = h[0] === 1 ? 'triangle' : 'sine'; o.frequency.value = f*h[0];
          a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(h[1]*.25, t + .35); a.gain.setValueAtTime(h[1]*.25, t + dur - .2); a.gain.linearRampToValueAtTime(0, t + dur + .9);
          o.connect(a); a.connect(lp); o.start(t); o.stop(t + dur + 1); }); }); }
      var i = 0, next = ctx.currentTime + .1;
      (function loop(){ if (!on) return; while (next < ctx.currentTime + 1.5){ chord(i++, next); next += dur; } timers.push(setTimeout(loop, 600)); })();
    }
    function chirp(){
      if (!on) return; var t = ctx.currentTime + .02, base = 2600 + Math.random()*1800, n = 2 + (Math.random()*4 | 0), pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null, g = ctx.createGain(); g.gain.value = .05 + Math.random()*.04;
      if (pan){ pan.pan.value = Math.random()*1.6 - .8; g.connect(pan); out(pan, .35); } else out(g, .35);
      for (var i = 0; i < n; i++){ var o = ctx.createOscillator(), a = ctx.createGain(), s = t + i*(.09 + Math.random()*.05);
        o.frequency.setValueAtTime(base, s); o.frequency.exponentialRampToValueAtTime(base*(1.25 + Math.random()*.4), s + .06); o.frequency.exponentialRampToValueAtTime(base*.9, s + .1);
        a.gain.setValueAtTime(0, s); a.gain.linearRampToValueAtTime(1, s + .01); a.gain.exponentialRampToValueAtTime(.001, s + .11); o.connect(a); a.connect(g); o.start(s); o.stop(s + .13); }
      timers.push(setTimeout(chirp, 1200 + Math.random()*4200));
    }
    function loopNoise(name, brown, filt, f, q, vol, lfo){
      if (amb[name]) return; var s = ctx.createBufferSource(); s.buffer = noiseBuf(4, brown); s.loop = true;
      var b = ctx.createBiquadFilter(); b.type = filt; b.frequency.value = f; b.Q.value = q || .7; var g = ctx.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(vol, ctx.currentTime + 2);
      s.connect(b); b.connect(g); out(g, .15);
      if (lfo){ var o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.value = .07 + Math.random()*.05; og.gain.value = vol*.6; o.connect(og); og.connect(g.gain); o.start(); amb[name + 'L'] = o; }
      s.start(); amb[name] = {s: s, g: g};
    }
    function stopNoise(name){ var a = amb[name]; if (!a) return; a.g.gain.cancelScheduledValues(ctx.currentTime); a.g.gain.setValueAtTime(a.g.gain.value, ctx.currentTime); a.g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
      a.s.stop(ctx.currentTime + 1.6); if (amb[name + 'L']) { amb[name + 'L'].stop(ctx.currentTime + 1.6); delete amb[name + 'L']; } delete amb[name]; }
    var w = 'clear';
    function weatherSnd(){
      if (!on) return;
      if (w === 'rain') loopNoise('rain', false, 'highpass', 900, .5, .07); else stopNoise('rain');
      if (w === 'snow' || w === 'autumn' || w === 'fog' || kind === 'nature') loopNoise('wind', true, 'lowpass', 420, .8, w === 'clear' ? .05 : .09, true); else stopNoise('wind');
    }
    return {
      toggle: function(){
        mk(); if (!ctx) return false; on = !on;
        if (ctx.state === 'suspended') ctx.resume();
        master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(on ? .8 : 0, ctx.currentTime + (on ? .6 : .8));
        if (on){
          if (kind === 'bells') peal(ctx.currentTime + .2, 5);
          if (kind === 'organ'){ toll(3); timers.push(setTimeout(organ, 6500)); }
          if (w !== 'rain' && w !== 'snow') timers.push(setTimeout(chirp, kind === 'nature' ? 300 : 9000));
          weatherSnd();
        } else { timers.forEach(clearTimeout); timers = []; Object.keys(amb).forEach(function(k){ if (amb[k].s) stopNoise(k); }); }
        return on;
      },
      weather: function(x){ w = x; if (ctx && on) weatherSnd(); },
      hour: function(h){ if (!on || kind === 'nature') return; toll(h % 12 === 0 ? 3 : 1); },
      on: function(){ return on; }
    };
  })();
  bSound.addEventListener('click', function(){ bSound.setAttribute('aria-pressed', String(Snd.toggle())); });
  /* the sun panel's clock: a toll when the hour turns (churches only) */
  var sunOut = null, lastH = null, lastToll = 0;
  setTimeout(function(){ sunOut = document.getElementById('sunOut'); if (!sunOut || !window.MutationObserver) return;
    new MutationObserver(function(){ var m = /^(\d+):(\d+)/.exec(sunOut.textContent); if (!m) return; var h = +m[1];
      if (lastH !== null && h !== lastH && performance.now() - lastToll > 1500){ lastToll = performance.now(); Snd.hour(h); } lastH = h; }).observe(sunOut, {childList: true, characterData: true, subtree: true}); }, 500);

  /* ── frame loop ── */
  (function frame(now){ stepFlight(now); stepTour(now); stepFx(now); if (spotsOn || cur >= 0) place(now); requestAnimationFrame(frame); })(0);
  window.x3dExtras = {show: show, tour: startTour, weather: setWeather, sound: function(){ bSound.click(); }, spots: spots};
}
if (window.x3dApi) init(window.x3dApi);
document.addEventListener('x3d:ready', function(e){ init(e.detail); });
})();
