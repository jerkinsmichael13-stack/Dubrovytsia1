/* ================================================================
   Читальня документів · Цифровий архів Дубровиці
   Один переглядач для всіх архівних справ: скан ліворуч, текст
   праворуч (переклад, оригінал або поруч), гортання аркушів,
   масштаб, посилання на конкретний аркуш (#chytaty-N).
   Дані бере зі сторінки через адаптери (див. ADAPT нижче).
   ================================================================ */
(function () {
    'use strict';
    if (window.DxReader) return;

    var CSS = [
    '.dxr{position:fixed;inset:0;z-index:100000;display:none;flex-direction:column;background:#100d0a;color:#efe6d4;font-family:var(--font-body,"Manrope",sans-serif)}',
    '.dxr.on{display:flex;animation:dxrIn .28s cubic-bezier(.16,1,.3,1)}',
    '@keyframes dxrIn{from{opacity:0}}',
    '.dxr-top{display:flex;align-items:center;gap:1rem;padding:.7rem 1rem .7rem 1.25rem;border-bottom:1px solid rgba(239,230,212,.1);flex:none}',
    '.dxr-ttl{min-width:0;flex:1}',
    '.dxr-ttl small{display:block;font-size:.62rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#c9a75a}',
    '.dxr-ttl b{display:block;margin-top:.1rem;font:500 1.12rem/1.25 var(--font-display,"Cormorant Garamond",serif);color:#f6efe2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.dxr-mode{display:inline-flex;padding:3px;border-radius:999px;background:rgba(239,230,212,.07);border:1px solid rgba(239,230,212,.12)}',
    '.dxr-mode button{padding:.42rem .85rem;border:0;border-radius:999px;background:none;color:#cbbfa8;font:600 .74rem/1 inherit;cursor:pointer}',
    '.dxr-mode button[aria-pressed="true"]{background:#d9b44a;color:#1c1712}',
    '.dxr-ib{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;height:36px;min-width:36px;padding:0 .7rem;border:1px solid rgba(239,230,212,.14);border-radius:999px;background:none;color:#e9dfcb;font:600 .74rem/1 inherit;cursor:pointer}',
    '.dxr-ib:hover{background:rgba(239,230,212,.08)}',
    '.dxr-ib svg{width:17px;height:17px}',
    '.dxr-body{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr)}',
    '.dxr.mode-both .dxr-body{grid-template-columns:minmax(0,.9fr) minmax(0,1.3fr)}',
    '.dxr-scan{position:relative;overflow:hidden;background:#0b0907;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}',
    '.dxr-scan.drag{cursor:grabbing}',
    '.dxr-scan img{position:absolute;left:0;top:0;max-width:none;transform-origin:0 0;will-change:transform;box-shadow:0 20px 60px rgba(0,0,0,.6);filter:sepia(.06)}',
    '.dxr-load{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}',
    '.dxr-load::after{content:"";width:30px;height:30px;border:2px solid rgba(255,255,255,.12);border-top-color:#d9b44a;border-radius:50%;animation:dxrSp .8s linear infinite}',
    '.dxr-load.off{display:none}',
    '@keyframes dxrSp{to{transform:rotate(360deg)}}',
    '.dxr-zoom{position:absolute;right:.8rem;bottom:.8rem;display:flex;flex-direction:column;gap:.35rem;z-index:2}',
    '.dxr-zoom .dxr-ib{background:rgba(16,13,10,.7);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
    '.dxr-nav{position:absolute;top:50%;z-index:2;width:44px;height:44px;margin-top:-22px;border-radius:50%;border:1px solid rgba(239,230,212,.18);background:rgba(16,13,10,.6);color:#f3ead8;cursor:pointer;display:flex;align-items:center;justify-content:center}',
    '.dxr-nav:hover{background:rgba(16,13,10,.85)}',
    '.dxr-nav svg{width:20px;height:20px}',
    '.dxr-prev{left:.8rem}.dxr-next{right:.8rem}',
    '.dxr-cap{position:absolute;left:.9rem;top:.8rem;z-index:2;padding:.35rem .6rem;border-radius:4px;background:rgba(16,13,10,.72);font-size:.72rem;color:#e6dcc7;max-width:70%}',
    '.dxr-text{min-height:0;overflow:auto;background:#f6f0e3;color:#2b2418;padding:2rem clamp(1.2rem,3vw,3rem) 3rem;scroll-behavior:smooth}',
    '[data-theme="dark"] .dxr-text{background:#1c1712;color:#e6dcc7}',
    '.dxr-seg{margin:0 0 1.4rem;padding-bottom:.9rem;border-bottom:1px solid rgba(90,74,46,.18)}',
    '.dxr-seg small{display:block;font-size:.64rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#9a7416}',
    '.dxr-seg b{display:block;margin-top:.25rem;font:500 1.45rem/1.2 var(--font-display,"Cormorant Garamond",serif)}',
    '.dxr-cols{display:grid;gap:2rem}',
    '.dxr.mode-both .dxr-cols{grid-template-columns:1fr 1fr}',
    '.dxr-col h4{margin:0 0 .7rem;font:700 .64rem/1 inherit;letter-spacing:.14em;text-transform:uppercase;color:#8a7a60}',
    '.dxr-col{font:400 1.08rem/1.7 var(--font-display,"Cormorant Garamond",serif)}',
    '.dxr-col p{margin:0 0 .85em}',
    '.dxr-col[data-k="or"]{font-size:1.02rem;color:#4a3f30}',
    '[data-theme="dark"] .dxr-col[data-k="or"]{color:#cbbfa8}',
    '.dxr.mode-tr .dxr-col[data-k="or"],.dxr.mode-or .dxr-col[data-k="tr"]{display:none}',
    '.dxr-strip{flex:none;display:flex;gap:.45rem;padding:.55rem .8rem;overflow-x:auto;border-top:1px solid rgba(239,230,212,.1);scrollbar-width:thin}',
    '.dxr-th{position:relative;flex:none;width:52px;height:68px;padding:0;border:1px solid rgba(239,230,212,.16);border-radius:3px;background:#1d1812;overflow:hidden;cursor:pointer;opacity:.55;transition:opacity .2s,border-color .2s}',
    '.dxr-th img{width:100%;height:100%;object-fit:cover;object-position:top}',
    '.dxr-th span{position:absolute;left:2px;bottom:2px;padding:0 3px;border-radius:2px;background:rgba(16,13,10,.8);font-size:.58rem;color:#f3ead8}',
    '.dxr-th.on{opacity:1;border-color:#d9b44a;box-shadow:0 0 0 1px #d9b44a}',
    '.dxr-th:hover{opacity:.9}',
    '.dxr-gap{flex:none;width:1px;margin:0 .3rem;background:rgba(217,180,74,.35)}',
    '.dxr-toast{position:absolute;left:50%;top:4.2rem;transform:translateX(-50%);padding:.5rem .9rem;border-radius:999px;background:#d9b44a;color:#1c1712;font:600 .78rem/1 inherit;opacity:0;transition:opacity .25s;pointer-events:none;z-index:5}',
    '.dxr-toast.on{opacity:1}',
    '.dxr-cnt{font-size:.74rem;color:#b9ad98;white-space:nowrap;font-variant-numeric:tabular-nums}',
    '@media (max-width:860px){',
    ' .dxr-top{flex-wrap:wrap;gap:.6rem;padding:.6rem .7rem}',
    ' .dxr-ttl{flex-basis:calc(100% - 100px)}',
    ' .dxr-mode{order:3}',
    ' .dxr-mode button{padding:.4rem .7rem}',
    ' .dxr-hide-s{display:none}',
    ' .dxr-body,.dxr.mode-both .dxr-body{grid-template-columns:1fr;grid-template-rows:44vh minmax(0,1fr)}',
    ' .dxr.mode-both .dxr-cols{grid-template-columns:1fr}',
    ' .dxr-text{padding:1.2rem 1.1rem 2rem}',
    ' .dxr-nav{width:38px;height:38px;margin-top:-19px}',
    '}',
    '.dxr-open-btn{margin-top:1.6rem}',
    '.cover-actions .dxr-open-btn{margin-top:0}',
    'html.dxr-lock,html.dxr-lock body{overflow:hidden}',
    'html.dxr-lock .dock{display:none}'
    ].join('\n');

    var SVG = {
        x: '<path d="M6 6l12 12M18 6 6 18"/>', l: '<path d="m15 5-7 7 7 7"/>', r: '<path d="m9 5 7 7-7 7"/>',
        p: '<path d="M12 5v14M5 12h14"/>', m: '<path d="M5 12h14"/>', f: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
        k: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>',
        b: '<path d="M6 4h9l3 3v13H6z"/><path d="M9 10h6M9 13h6M9 16h4"/>'
    };
    function ic(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + SVG[k] + '</svg>'; }
    function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
    function html(list) { return list.filter(Boolean).map(function (e) { return e.innerHTML; }).join('<hr style="border:0;border-top:1px dashed rgba(90,74,46,.25);margin:1.2rem 0">'); }
    function range(a, b) { var r = []; for (var i = a; i <= b; i++) r.push(i); return r; }

    /* ── адаптери сторінок ── */
    var ADAPT = {
        'sumariusz-1642': function () {
            if (!window.SCANS) return null;
            var or = document.querySelectorAll('#panel-transcript .smr-original'), tr = document.querySelectorAll('#panel-translation .smr-translation'),
                lb = document.querySelectorAll('#panel-translation .smr-page-label');
            return { title: 'Сумаріуш маєтку Дубровиця, 1642', scans: SCANS, segs: SCANS.map(function (s, i) {
                return { label: txt(lb[i]) || s.cap, pages: [i], or: or[i] ? or[i].innerHTML : '', tr: tr[i] ? tr[i].innerHTML : '' }; }) };
        },
        'zhaloba-1650': function () {
            if (!window.ZH_SCANS) return null;
            var R = [range(0, 3), range(4, 7), range(8, 11)], nav = document.querySelectorAll('#panel-translation .zh-part-btn');
            return { title: 'Скарга про спустошення Дубровицького маєтку, 1650', scans: ZH_SCANS, segs: R.map(function (pg, k) {
                var n = k + 1;
                return { label: txt(nav[k]) || 'Частина ' + n, pages: pg,
                    or: html([].slice.call(document.querySelectorAll('#part-t' + n + ' .zh-original'))),
                    tr: html([].slice.call(document.querySelectorAll('#part-tr' + n + ' .zh-translation'))) }; }) };
        },
        'rejestr-1665': function () {
            if (!window.RJ_SCANS) return null;
            var R = [range(0, 1), range(2, 3), range(4, 6), range(7, 11)], nav = document.querySelectorAll('#panel-translation .rj-part-btn');
            return { title: 'Реєстр збитків у Дубровицькому маєтку, 1665', scans: RJ_SCANS, segs: R.map(function (pg, k) {
                var n = k + 1;
                return { label: txt(nav[k]) || 'Частина ' + n, pages: pg,
                    or: html([].slice.call(document.querySelectorAll('#part-t' + n + ' .rj-original'))),
                    tr: html([].slice.call(document.querySelectorAll('#part-tr' + n + ' .rj-translation'))) }; }) };
        },
        'akty': function () {
            var arts = document.querySelectorAll('article.ak-doc'); if (!arts.length) return null;
            var scans = [], segs = [];
            arts.forEach(function (a) {
                var pg = [];
                a.querySelectorAll('.ak-scan img').forEach(function (im, j) { pg.push(scans.length); scans.push({ src: im.getAttribute('src'), cap: txt(a.querySelector('.ak-h2')) + ' · скан ' + (j + 1) }); });
                if (!pg.length) return;
                segs.push({ id: a.id, label: ([].map.call((a.querySelector('.ak-date') || { childNodes: [] }).childNodes, function (n) { return n.textContent.trim(); }).filter(Boolean).join(' ') + ' · ' + txt(a.querySelector('.ak-h2'))).replace(/^ · /, ''), pages: pg,
                    or: (document.getElementById(a.id + '-or') || {}).innerHTML || '', tr: (document.getElementById(a.id + '-uk') || {}).innerHTML || '' });
            });
            return { title: txt(document.querySelector('.cover-title')), scans: scans, segs: segs };
        }
    };
    var page = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
    var key = /^akty-/.test(page) ? 'akty' : page;

    var D = null, pageSeg = [], cur = 0, mode = 'tr', root, img, scanEl, load, textEl, strip, cnt, ttlB, ttlS, toast;
    var z = 1, fit = 1, tx = 0, ty = 0;

    function build() {
        var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
        root = document.createElement('div'); root.className = 'dxr mode-tr'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Читальня документа');
        root.innerHTML =
            '<div class="dxr-top"><div class="dxr-ttl"><small>Читальня</small><b></b></div>' +
            '<div class="dxr-mode" role="group" aria-label="Що показувати"><button type="button" data-m="tr" aria-pressed="true">Переклад</button><button type="button" data-m="or" aria-pressed="false">Оригінал</button><button type="button" data-m="both" aria-pressed="false">Поруч</button></div>' +
            '<span class="dxr-cnt dxr-hide-s"></span>' +
            '<button type="button" class="dxr-ib dxr-link" title="Скопіювати посилання на цей аркуш">' + ic('k') + '<span class="dxr-hide-s">Посилання</span></button>' +
            '<button type="button" class="dxr-ib dxr-close" aria-label="Закрити читальню" title="Закрити (Esc)">' + ic('x') + '</button></div>' +
            '<div class="dxr-body"><div class="dxr-scan"><img alt=""><div class="dxr-load"></div><span class="dxr-cap"></span>' +
            '<button type="button" class="dxr-nav dxr-prev" aria-label="Попередній аркуш">' + ic('l') + '</button><button type="button" class="dxr-nav dxr-next" aria-label="Наступний аркуш">' + ic('r') + '</button>' +
            '<div class="dxr-zoom"><button type="button" class="dxr-ib" data-z="1" aria-label="Наблизити">' + ic('p') + '</button><button type="button" class="dxr-ib" data-z="-1" aria-label="Віддалити">' + ic('m') + '</button><button type="button" class="dxr-ib" data-z="0" aria-label="Увесь аркуш">' + ic('f') + '</button></div></div>' +
            '<div class="dxr-text" tabindex="0"></div></div><div class="dxr-strip" aria-label="Аркуші"></div><div class="dxr-toast">Посилання на аркуш скопійовано</div>';
        document.body.appendChild(root);
        img = root.querySelector('.dxr-scan img'); scanEl = root.querySelector('.dxr-scan'); load = root.querySelector('.dxr-load');
        textEl = root.querySelector('.dxr-text'); strip = root.querySelector('.dxr-strip'); cnt = root.querySelector('.dxr-cnt');
        ttlB = root.querySelector('.dxr-ttl b'); ttlS = root.querySelector('.dxr-ttl small'); toast = root.querySelector('.dxr-toast');
        root.querySelector('.dxr-close').onclick = close;
        root.querySelector('.dxr-prev').onclick = function () { go(cur - 1); };
        root.querySelector('.dxr-next').onclick = function () { go(cur + 1); };
        root.querySelectorAll('.dxr-mode button').forEach(function (b) { b.onclick = function () { setMode(b.dataset.m); }; });
        root.querySelectorAll('[data-z]').forEach(function (b) { b.onclick = function () { var d = +b.dataset.z; if (!d) fitImg(); else zoomAt(z * (d > 0 ? 1.5 : 1 / 1.5)); }; });
        root.querySelector('.dxr-link').onclick = copyLink;
        img.addEventListener('load', function () { load.classList.add('off'); fitImg(); });
        bindPan();
        document.addEventListener('keydown', function (e) {
            if (!root.classList.contains('on')) return;
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowRight') go(cur + 1);
            else if (e.key === 'ArrowLeft') go(cur - 1);
            else if (e.key === '+' || e.key === '=') zoomAt(z * 1.4);
            else if (e.key === '-') zoomAt(z / 1.4);
        });
        addEventListener('resize', function () { if (root.classList.contains('on')) fitImg(); });
        var strips = '';
        D.segs.forEach(function (s, si) {
            if (si) strips += '<span class="dxr-gap" aria-hidden="true"></span>';
            s.pages.forEach(function (p) { pageSeg[p] = si; strips += '<button type="button" class="dxr-th" data-p="' + p + '" aria-label="Аркуш ' + (p + 1) + '"><img src="' + thumb(D.scans[p].src) + '" alt="" loading="lazy"><span>' + (p + 1) + '</span></button>'; });
        });
        strip.innerHTML = strips;
        strip.addEventListener('click', function (e) { var b = e.target.closest('.dxr-th'); if (b) go(+b.dataset.p); });
    }
    function thumb(src) { return /i\.imgur\.com\/[A-Za-z0-9]+\.(jpe?g|png)$/.test(src) ? src.replace(/\.(jpe?g|png)$/, 'm.$1') : src; }

    function setMode(m) {
        mode = m; root.classList.remove('mode-tr', 'mode-or', 'mode-both'); root.classList.add('mode-' + m);
        root.querySelectorAll('.dxr-mode button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.m === m ? 'true' : 'false'); });
        try { localStorage.setItem('dxr-mode', m); } catch (e) {}
    }
    var shownSeg = -1;
    function go(p) {
        var n = D.scans.length; p = (p + n) % n; cur = p;
        var s = D.scans[p];
        load.classList.remove('off'); img.style.opacity = '0';
        img.src = s.src;
        root.querySelector('.dxr-cap').textContent = s.cap || ('Аркуш ' + (p + 1));
        cnt.textContent = 'аркуш ' + (p + 1) + ' з ' + n;
        strip.querySelectorAll('.dxr-th').forEach(function (b) { var on = +b.dataset.p === p; b.classList.toggle('on', on); if (on) b.scrollIntoView({ block: 'nearest', inline: 'center' }); });
        var si = pageSeg[p] || 0;
        if (si !== shownSeg) {
            shownSeg = si; var sg = D.segs[si];
            ttlB.textContent = D.title; ttlS.textContent = 'Читальня · ' + (D.segs.length > 1 ? 'частина ' + (si + 1) + ' з ' + D.segs.length : 'документ');
            textEl.innerHTML = '<div class="dxr-seg"><small>' + (D.segs.length > 1 ? 'Частина ' + (si + 1) : 'Документ') + ' · аркуші ' + (sg.pages[0] + 1) + (sg.pages.length > 1 ? '–' + (sg.pages[sg.pages.length - 1] + 1) : '') + '</small><b></b></div>' +
                '<div class="dxr-cols"><div class="dxr-col" data-k="tr"><h4>Переклад українською</h4>' + (sg.tr || '<p><i>Перекладу цієї частини немає.</i></p>') + '</div>' +
                '<div class="dxr-col" data-k="or"><h4>Оригінал</h4>' + (sg.or || '<p><i>Транскрипції цієї частини немає.</i></p>') + '</div></div>';
            textEl.querySelector('.dxr-seg b').textContent = sg.label;
            textEl.scrollTop = 0;
        }
        if (history.replaceState) history.replaceState(null, '', '#chytaty-' + (p + 1));
    }
    function fitImg() {
        if (!img.naturalWidth) return;
        var W = scanEl.clientWidth, H = scanEl.clientHeight, pad = 24;
        fit = Math.min((W - pad * 2) / img.naturalWidth, (H - pad * 2) / img.naturalHeight);
        z = fit; tx = (W - img.naturalWidth * z) / 2; ty = Math.max(pad, (H - img.naturalHeight * z) / 2); apply(); img.style.opacity = '1';
    }
    function apply() { img.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + z + ')'; }
    function zoomAt(nz, cx, cy) {
        var W = scanEl.clientWidth, H = scanEl.clientHeight;
        nz = Math.max(fit, Math.min(fit * 8, nz));
        if (cx == null) { cx = W / 2; cy = H / 2; }
        tx = cx - (cx - tx) * nz / z; ty = cy - (cy - ty) * nz / z; z = nz;
        if (z <= fit * 1.001) { fitImg(); return; }
        apply();
    }
    function bindPan() {
        var pts = {}, sx, sy, stx, sty, d0 = 0, z0 = 1, moved = false, t0 = 0;
        scanEl.addEventListener('wheel', function (e) { e.preventDefault(); var r = scanEl.getBoundingClientRect(); zoomAt(z * (e.deltaY < 0 ? 1.18 : 1 / 1.18), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
        scanEl.addEventListener('dblclick', function (e) { var r = scanEl.getBoundingClientRect(); if (z > fit * 1.05) fitImg(); else zoomAt(fit * 2.6, e.clientX - r.left, e.clientY - r.top); });
        scanEl.addEventListener('pointerdown', function (e) {
            if (e.target.closest('button')) return;
            scanEl.setPointerCapture(e.pointerId); pts[e.pointerId] = [e.clientX, e.clientY];
            var ids = Object.keys(pts);
            if (ids.length === 1) { sx = e.clientX; sy = e.clientY; stx = tx; sty = ty; moved = false; t0 = Date.now(); scanEl.classList.add('drag'); }
            else if (ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]]; d0 = Math.hypot(a[0] - b[0], a[1] - b[1]); z0 = z; }
        });
        scanEl.addEventListener('pointermove', function (e) {
            if (!pts[e.pointerId]) return; pts[e.pointerId] = [e.clientX, e.clientY];
            var ids = Object.keys(pts);
            if (ids.length === 2) {
                var a = pts[ids[0]], b = pts[ids[1]], r = scanEl.getBoundingClientRect();
                zoomAt(z0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / d0, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top); moved = true; return;
            }
            var dx = e.clientX - sx, dy = e.clientY - sy;
            if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
            if (z > fit * 1.01) { tx = stx + dx; ty = sty + dy; apply(); }
        });
        function up(e) {
            if (!pts[e.pointerId]) return;
            var single = Object.keys(pts).length === 1; delete pts[e.pointerId]; scanEl.classList.remove('drag');
            if (single && z <= fit * 1.01) { var dx = e.clientX - sx; if (Math.abs(dx) > 60 && Date.now() - t0 < 600) go(cur + (dx < 0 ? 1 : -1)); }
        }
        scanEl.addEventListener('pointerup', up); scanEl.addEventListener('pointercancel', up);
    }
    function copyLink() {
        var u = location.href.split('#')[0] + '#chytaty-' + (cur + 1);
        var done = function () { toast.classList.add('on'); setTimeout(function () { toast.classList.remove('on'); }, 1600); };
        if (navigator.clipboard) navigator.clipboard.writeText(u).then(done, done); else done();
    }
    var back = null;
    function open(p) {
        if (!D) return;
        if (!root) build();
        try { var m = localStorage.getItem('dxr-mode'); if (m) setMode(m); } catch (e) {}
        back = document.activeElement;
        root.classList.add('on'); document.documentElement.classList.add('dxr-lock');
        shownSeg = -1; go(p || 0);
        root.querySelector('.dxr-close').focus({ preventScroll: true });
    }
    function close() {
        root.classList.remove('on'); document.documentElement.classList.remove('dxr-lock');
        if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
        if (back && back.focus) back.focus({ preventScroll: true });
    }

    function init() {
        var f = ADAPT[key]; if (!f) return;
        try { D = f(); } catch (e) { D = null; }
        if (!D || !D.scans || !D.scans.length) return;
        window.DxReader = { open: open, close: close, data: D };
        /* старі переглядачі сторінок тепер відкривають читальню */
        ['openScanLB', 'zhOpenLB', 'rjOpenLB'].forEach(function (fn) { if (typeof window[fn] === 'function') window[fn] = function (i) { open(i); }; });
        if (key === 'akty') document.addEventListener('click', function (e) {
            var b = e.target.closest('.ak-scan'); if (!b) return;
            e.preventDefault(); e.stopImmediatePropagation();
            var seg = D.segs.filter(function (s) { return s.id === b.dataset.doc; })[0];
            open(seg ? seg.pages[+b.dataset.i || 0] : 0);
        }, true);
        /* кнопка на обкладинці */
        var copy = document.querySelector('.cover-copy') || document.querySelector('.cover-inner');
        if (copy && !copy.querySelector('.dxr-open-btn')) {
            var acts = copy.querySelector('.cover-actions');
            if (!acts) { acts = document.createElement('div'); acts.className = 'cover-actions'; copy.appendChild(acts); }
            var b = document.createElement('button'); b.type = 'button'; b.className = 'cover-btn dxr-open-btn';
            b.innerHTML = ic('b') + '<span>Читати документ</span>';
            b.onclick = function () { open(0); }; acts.insertBefore(b, acts.firstChild);
        }
        var m = /^#chytaty-(\d+)$/.exec(location.hash);
        if (m) open(Math.max(0, +m[1] - 1));
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
