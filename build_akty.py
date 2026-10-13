#!/usr/bin/env python3
"""Сторінки судових актів XVII ст. з видання Віленської археографічної комісії.

akty-data.json  →  akty-ruina.html   (Руїна: Дубровиця, Воробин, Кураш, 1654–1663)
                →  akty-yevrei.html  (євреї Дубровиці в пінських актах, 1645–1646)

Шапку й підвал сторінок береться з zhaloba-1650.html, тож меню завжди збігається з рештою сайту.
Запуск:  python3 build_akty.py
"""
import json, os, re, html as H

ROOT = os.path.dirname(os.path.abspath(__file__))
DOCS = json.load(open(os.path.join(ROOT, 'akty-data.json'), encoding='utf-8'))
TPL = open(os.path.join(ROOT, 'zhaloba-1650.html'), encoding='utf-8').read()
HEADER = TPL[TPL.index('<!-- Header -->'):TPL.index('</header>') + 9]
FOOTER = TPL[TPL.index('<footer class="footer">'):TPL.index('</footer>') + 9]
HEADER = HEADER.replace(' is-current" aria-current="page"', '"')

VOL = {
    'XXXIV': '«Акты, издаваемые Виленскою коммиссіею для разбора древнихъ актовъ», т. XXXIV: «Акты, относящіеся ко времени войны за Малороссію (1654–1667)». Вильна, 1909',
    'XXVIII': '«Акты, издаваемые Виленскою коммиссіею для разбора древнихъ актовъ», т. XXVIII: «Акты о евреяхъ». Вильна, 1901',
}

PAGES = {
    'ruina': dict(
        file='akty-ruina.html', group='ruina',
        title='Акти Руїни · 1654–1663 — Дубровиця · Цифровий архів',
        desc='П’ять записів пінських гродських книг 1654–1663 років про Дубровицю, Воробин і Кураш у роки війни: оригінальний текст, скани видання 1909 року, покажчики осіб, місць і термінів.',
        crumbs='<a href="metrychni-knyhy.html">Архівні справи</a><span>/</span>Акти Руїни',
        kicker='Пінські гродські книги · 1654–1663',
        h1='Акти <em>Руїни</em>',
        lede='Татари, козацькі залоги й московські полки на Горині: п’ять скарг і присяг, вписаних до пінських гродських книг, про Дубровицю, Воробин і Кураш.',
        intro=('<p>Після 1648 року Дубровиччина опинилася на шляху всіх армій: татар, козацьких залог над Горинню, московських полків, що йшли на Пінськ. '
               'Шляхта й міщани приходили до пінського гродського суду, щоб записати збитки: це звільняло від податків, які платити вже не було з чого.</p>'
               '<p>Оригінальні тексти подано так, як їх надрукувала Віленська археографічна комісія 1909 року: польською з руськими судовими формулами. '
               'До кожного акта — короткий переказ, повний переклад українською, скани друкованого видання й покажчики осіб, місць і термінів.</p>'),
        credit='Друкована сторінка видання 1909 року',
        tag='Архівні справи'),
    'yevrei': dict(
        file='akty-yevrei.html', group='yevrei',
        title='Євреї Дубровиці в актах 1645–1646 — Дубровиця · Цифровий архів',
        desc='Три записи пінських гродських книг 1645–1646 років про євреїв Дубровиці й Пінська: орендар Давид Якович, Зельман Якубович і Випозловський дворик. Оригінальний текст, скани, покажчики.',
        crumbs='<a href="jewish-history.html">Єврейська спадщина</a><span>/</span>Акти 1645–1646',
        kicker='Пінські гродські книги · 1645–1646',
        h1='Євреї Дубровиці <em>в судових актах</em>',
        lede='Три записи пінського суду 1645–1646 років: дубровицький орендар Давид Якович, якого били й обкрадали, і пінський кредитор Зельман Якубович.',
        intro=('<p>За сто років до того, як громада отримала самостійність, євреї вже тримали в Дубровиці оренду: шинки, млини, дрібні податки. '
               'Три записи пінського гродського суду 1645–1646 років показують, як жилося орендареві між панами, їхніми підданими й конкурентами.</p>'
               '<p>Тексти подано за томом «Акты о евреяхъ» Віленської археографічної комісії (1901): польською з руськими судовими формулами. '
               'До кожного акта — короткий переказ, повний переклад українською, скани видання й покажчики осіб, місць і термінів.</p>'),
        credit='Друкована сторінка видання 1901 року',
        tag='Єврейська спадщина'),
}

MON = ['', 'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня']


def esc(s):
    return H.escape(s, quote=True)


def text_html(d):
    """Join the screens into one text, marking where each printed page begins; a paragraph cut by a page break
    is joined back together."""
    out = ''
    for i, sc in enumerate(d['screens']):
        h = sc['html']
        if i == 0:
            out = h
            continue
        mark = '<span class="ak-pg" aria-label="сторінка %d">%d</span>' % (sc['n'], sc['n'])
        m = re.match(r'\s*<p>(.*?)</p>', h, re.S)
        first = m.group(1) if m else ''
        cont = m and (re.match(r'[a-ząćęłńóśźżа-яіїєґ]', first) or out.rstrip().endswith('-</p>'))
        if cont:
            out = re.sub(r'</p>\s*$', '', out.rstrip()) + mark + first + '</p>' + h[m.end():]
        else:
            out += h.replace('<p>', '<p>' + mark, 1)
    # the printed heading (№, Russian title) gets its own styling
    out = re.sub(r'^<p><strong>(№[^<]*)</strong></p>\s*<p><strong>([^<]*)</strong></p>',
                 r'<p class="ak-no">\1</p><p class="ak-ptitle">\2</p>', out)
    return out


def scans(d):
    items = []
    for i, u in enumerate(d['scans']):
        items.append('<button type="button" class="ak-scan" data-doc="%s" data-i="%d" aria-label="Скан %d з %d"><img src="%s" alt="" loading="lazy" decoding="async"><span>%d</span></button>'
                     % (d['id'], i, i + 1, len(d['scans']), esc(u), i + 1))
    return '<div class="ak-scans">' + ''.join(items) + '</div>'


def article(d):
    y = d['sort'][:4]
    return '''
<article class="ak-doc" id="{id}">
  <header class="ak-head">
    <div class="ak-date"><b>{day}</b><span>{mon}</span><i>{y}</i></div>
    <div class="ak-head-main">
      <p class="ak-kick">№ {no} · Пінський гродський суд</p>
      <h2 class="ak-h2">{title}</h2>
      <p class="ak-places">{places}</p>
    </div>
  </header>
  <p class="ak-sum">{summary}</p>
  {scans}
  <details class="ak-block ak-meta"><summary>Опис документа</summary><div class="ak-meta-body">{meta}</div></details>
  <section class="ak-text" aria-label="Текст документа">
    <div class="ak-switch" role="tablist" aria-label="Мова тексту">
      <button type="button" role="tab" aria-selected="true" aria-controls="{id}-uk" id="{id}-tuk">Переклад українською</button>
      <button type="button" role="tab" aria-selected="false" aria-controls="{id}-or" id="{id}-tor">Оригінал</button>
    </div>
    <div class="ak-text-body" role="tabpanel" id="{id}-uk" aria-labelledby="{id}-tuk">{tr}<p class="ak-trnote">Переклад зроблено для «Цифрового архіву Дубровиці». Імена подано за покажчиками, назви сіл — сучасні; у квадратних дужках — пояснення.</p></div>
    <div class="ak-text-body" role="tabpanel" id="{id}-or" aria-labelledby="{id}-tor" hidden><p class="ak-label">Цифри на полях — сторінки видання</p>{text}</div>
  </section>
  <div class="ak-idx">
    <details class="ak-block"><summary>Особи <small>{np}</small></summary><div>{persons}</div></details>
    <details class="ak-block"><summary>Місця</summary><div>{placesIdx}</div></details>
    <details class="ak-block"><summary>Терміни й теми</summary><div>{subjects}</div></details>
  </div>
</article>'''.format(id=d['id'], day=int(d['sort'][8:10]), mon=MON[int(d['sort'][5:7])], y=y, no=d['no'], title=esc(d['title']),
                     places=''.join('<span>%s</span>' % esc(p) for p in d['places']), summary=esc(d['summary']), scans=scans(d),
                     meta=d['meta'], text=text_html(d), tr=d.get('translation', ''), np=d['nPersons'], persons=d['persons'], placesIdx=d['placesIdx'], subjects=d['subjects'])


CSS = r'''
/* layout: a sticky list of acts on the left, the acts themselves on the right; one column on phones */
.ak { background: var(--color-bg); color: var(--color-text); padding: 4.5rem 0 5rem; }
.ak-wrap { max-width: 1180px; margin: 0 auto; padding: 0 2rem; display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 3.5rem; }
@media (max-width: 900px) { .ak-wrap { grid-template-columns: minmax(0, 1fr); gap: 2rem; padding: 0 1.1rem; } .ak { padding-top: 3rem; } }
.ak-toc { position: sticky; top: 96px; align-self: start; }
@media (max-width: 900px) { .ak-toc { position: static; } }
.ak-toc-h { font-family: var(--font-body, 'Manrope', sans-serif); font-size: .62rem; letter-spacing: .26em; text-transform: uppercase; color: var(--color-primary); margin: 0 0 .9rem; }
.ak-toc ol { list-style: none; margin: 0; padding: 0; border-left: 1px solid var(--color-border); }
.ak-toc a { display: block; padding: .55rem 0 .55rem 1rem; margin-left: -1px; border-left: 2px solid transparent; text-decoration: none; color: var(--color-text-secondary); transition: color .2s, border-color .2s; }
.ak-toc a:hover, .ak-toc a.on { color: var(--color-text); border-left-color: var(--color-accent); }
.ak-toc b { display: block; font-family: 'Manrope', sans-serif; font-weight: 600; font-size: .66rem; letter-spacing: .08em; color: var(--color-primary); font-variant-numeric: tabular-nums; }
.ak-toc span { font-family: 'Cormorant Garamond', serif; font-size: 1.05rem; line-height: 1.25; }
.ak-toc .ak-also { margin-top: 1.4rem; font-family: 'Manrope', sans-serif; font-size: .74rem; line-height: 1.55; color: var(--color-text-light); }
.ak-toc .ak-also a { display: inline; padding: 0; border: 0; color: var(--color-primary); }
.ak-main { min-width: 0; }
.ak-intro { max-width: 46rem; margin: 0 0 3rem; }
.ak-intro p { font-family: 'Cormorant Garamond', serif; font-size: 1.22rem; line-height: 1.7; color: var(--color-text-secondary); margin: 0 0 1rem; }
.ak-intro .ak-src { font-family: 'Manrope', sans-serif; font-size: .74rem; line-height: 1.6; color: var(--color-text-light); font-style: italic; }

.ak-doc { padding: 3rem 0 3.2rem; border-top: 1px solid var(--color-border); scroll-margin-top: 90px; }
.ak-head { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 1.4rem; align-items: start; }
.ak-date { width: 5.2rem; padding: .7rem 0 .6rem; text-align: center; border: 1px solid var(--color-border); border-radius: 10px; background: var(--color-bg-card); line-height: 1; }
.ak-date b { display: block; font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: 2.3rem; color: var(--color-text); }
.ak-date span { display: block; margin-top: .25rem; font-family: 'Manrope', sans-serif; font-size: .62rem; letter-spacing: .08em; color: var(--color-text-light); }
.ak-date i { display: block; margin-top: .45rem; padding-top: .45rem; border-top: 1px solid var(--color-border); font-style: normal; font-family: 'Manrope', sans-serif; font-weight: 600; font-size: .78rem; letter-spacing: .06em; color: var(--color-primary); }
.ak-kick { margin: .2rem 0 .4rem; font-family: 'Manrope', sans-serif; font-size: .62rem; letter-spacing: .22em; text-transform: uppercase; color: var(--color-primary); }
.ak-h2 { margin: 0; font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: clamp(1.6rem, 3vw, 2.2rem); line-height: 1.12; color: var(--color-text); text-wrap: balance; }
.ak-places { display: flex; flex-wrap: wrap; gap: .35rem; margin: .8rem 0 0; }
.ak-places span { padding: .2rem .6rem; border-radius: 100px; border: 1px solid var(--color-border); font-family: 'Manrope', sans-serif; font-size: .68rem; color: var(--color-text-secondary); }
.ak-sum { max-width: 46rem; margin: 1.4rem 0 1.6rem; font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; line-height: 1.65; color: var(--color-text-secondary); }

.ak-scans { display: flex; gap: .6rem; overflow-x: auto; padding: .2rem .1rem .6rem; margin: 0 0 1.4rem; scrollbar-width: thin; }
.ak-scan { position: relative; flex: none; width: 128px; height: 168px; padding: 0; border: 1px solid var(--color-border); border-radius: 6px; overflow: hidden; background: #f3eee2; cursor: zoom-in; transition: border-color .2s, transform .2s; }
.ak-scan:hover { border-color: var(--color-accent); transform: translateY(-2px); }
.ak-scan:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.ak-scan img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; filter: sepia(.12); }
.ak-scan span { position: absolute; left: .4rem; bottom: .4rem; min-width: 1.4rem; padding: .1rem .35rem; border-radius: 4px; background: rgba(28,22,10,.78); color: #f4e9c8; font-family: 'Manrope', sans-serif; font-size: .64rem; font-weight: 600; text-align: center; }

.ak-block { border: 1px solid var(--color-border); border-radius: 10px; background: var(--color-bg-card); margin: 0 0 .8rem; }
.ak-block summary { list-style: none; cursor: pointer; padding: .85rem 1.1rem; font-family: 'Manrope', sans-serif; font-size: .7rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--color-text); display: flex; align-items: center; gap: .6rem; }
.ak-block summary::-webkit-details-marker { display: none; }
.ak-block summary::after { content: ''; margin-left: auto; width: .5rem; height: .5rem; border-right: 1.5px solid var(--color-primary); border-bottom: 1.5px solid var(--color-primary); transform: rotate(45deg); transition: transform .2s; }
.ak-block[open] summary::after { transform: rotate(-135deg); }
.ak-block summary small { font-weight: 500; letter-spacing: .04em; color: var(--color-text-light); text-transform: none; }
.ak-block summary:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; border-radius: 10px; }
.ak-block > div { padding: 0 1.2rem 1rem; font-family: 'Manrope', sans-serif; font-size: .84rem; line-height: 1.65; color: var(--color-text-secondary); }
.ak-block ul, .ak-block ol { margin: 0; padding-left: 1.2rem; }
.ak-block li { margin: 0 0 .35rem; }
.ak-block li p { margin: 0; }
.ak-block li ul { margin-top: .35rem; }
.ak-block strong { color: var(--color-text); font-weight: 600; }

.ak-text { margin: 1.4rem 0 1.4rem; padding: 1.6rem 1.8rem 1.4rem 2.6rem; border-radius: 10px; background: var(--color-bg-alt); border: 1px solid var(--color-border-light); position: relative; }
@media (max-width: 560px) { .ak-text { padding: 1.2rem 1rem 1rem 1.9rem; } }
.ak-label { margin: 0 0 1rem; font-family: 'Manrope', sans-serif; font-size: .62rem; font-weight: 600; letter-spacing: .22em; text-transform: uppercase; color: var(--color-primary); }
.ak-label small { margin-left: .6rem; font-weight: 400; letter-spacing: .02em; text-transform: none; color: var(--color-text-light); }
.ak-text-body { max-width: 44rem; font-family: 'Cormorant Garamond', serif; font-size: 1.14rem; line-height: 1.72; color: var(--color-text); overflow-wrap: anywhere; }
.ak-text-body p { margin: 0 0 .9rem; }
.ak-switch { display: inline-flex; gap: 2px; padding: 3px; margin: 0 0 1.3rem; border: 1px solid var(--color-border); border-radius: 100px; background: var(--color-bg-card); }
.ak-switch button { border: 0; background: none; padding: .45rem .95rem; border-radius: 100px; font-family: 'Manrope', sans-serif; font-size: .7rem; font-weight: 600; letter-spacing: .04em; color: var(--color-text-light); cursor: pointer; transition: background .2s, color .2s; }
.ak-switch button[aria-selected="true"] { background: var(--color-primary); color: var(--color-bg); }
.ak-switch button:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.ak-text-body .ak-label { font-weight: 400; letter-spacing: .02em; text-transform: none; color: var(--color-text-light); font-size: .74rem; }
.ak-trnote { font-family: 'Manrope', sans-serif; font-size: .72rem; line-height: 1.6; color: var(--color-text-light); font-style: italic; margin-top: 1.4rem !important; }
.ak-text-body .ak-no { font-family: 'Manrope', sans-serif; font-size: .74rem; font-weight: 600; letter-spacing: .08em; color: var(--color-text-light); margin-bottom: .3rem; }
.ak-text-body .ak-ptitle { font-weight: 500; font-style: italic; color: var(--color-text-secondary); margin-bottom: 1.2rem; }
.ak-pg { position: absolute; left: .7rem; margin-top: .2rem; width: 1.3rem; height: 1.3rem; border-radius: 50%; display: inline-grid; place-items: center; background: var(--color-bg-card); border: 1px solid var(--color-border); font-family: 'Manrope', sans-serif; font-size: .58rem; font-weight: 600; color: var(--color-primary); line-height: 1; }
@media (max-width: 560px) { .ak-pg { left: .35rem; } }
.ak-idx { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .8rem; align-items: start; }
.ak-idx .ak-block { margin: 0; }
@media (max-width: 760px) { .ak-idx { grid-template-columns: minmax(0, 1fr); } }

/* lightbox */
.ak-lb { position: fixed; inset: 0; z-index: 1000; display: none; background: rgba(12,10,6,.94); }
.ak-lb.open { display: grid; grid-template-rows: auto minmax(0, 1fr); }
.ak-lb-bar { display: flex; align-items: center; gap: 1rem; padding: calc(env(safe-area-inset-top, 0px) + .8rem) 1rem .8rem; color: #f4e9c8; font-family: 'Manrope', sans-serif; font-size: .8rem; }
.ak-lb-bar b { font-weight: 500; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ak-lb button { border: 1px solid rgba(244,233,200,.25); background: rgba(244,233,200,.06); color: #f4e9c8; border-radius: 100px; height: 40px; min-width: 40px; padding: 0 .9rem; cursor: pointer; font: inherit; }
.ak-lb button:hover { border-color: #d4b25a; }
.ak-lb-stage { overflow: auto; display: grid; place-items: start center; padding: 0 1rem calc(env(safe-area-inset-bottom, 0px) + 1rem); }
.ak-lb-stage img { max-width: min(100%, 900px); height: auto; background: #f3eee2; border-radius: 4px; }
'''

JS = r'''
(function(){
  var SC = %s;
  var lb = document.getElementById('akLb'), img = document.getElementById('akLbImg'), cap = document.getElementById('akLbCap'), cur = null, k = 0, back = null;
  function show(){ var L = SC[cur]; img.src = L.s[k]; cap.textContent = L.t + ' · скан ' + (k + 1) + ' з ' + L.s.length; }
  function open(id, i){ cur = id; k = i; back = document.activeElement; show(); lb.classList.add('open'); document.body.style.overflow = 'hidden'; document.getElementById('akLbClose').focus(); }
  function close(){ lb.classList.remove('open'); document.body.style.overflow = ''; img.removeAttribute('src'); if (back) back.focus(); }
  function step(d){ var n = SC[cur].s.length; k = (k + d + n) %% n; show(); }
  document.querySelectorAll('.ak-scan').forEach(function(b){ b.addEventListener('click', function(){ open(b.dataset.doc, +b.dataset.i); }); });
  document.getElementById('akLbClose').onclick = close;
  document.getElementById('akLbPrev').onclick = function(){ step(-1); };
  document.getElementById('akLbNext').onclick = function(){ step(1); };
  lb.addEventListener('click', function(e){ if (e.target === lb || e.target.classList.contains('ak-lb-stage')) close(); });
  addEventListener('keydown', function(e){ if (!lb.classList.contains('open')) return; if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1); });
  document.querySelectorAll('.ak-switch').forEach(function(sw){
    var bs = sw.querySelectorAll('button');
    bs.forEach(function(b){ b.addEventListener('click', function(){ bs.forEach(function(x){ var on = x === b; x.setAttribute('aria-selected', String(on)); document.getElementById(x.getAttribute('aria-controls')).hidden = !on; }); }); });
  });
  /* highlight the act being read in the list */
  var links = document.querySelectorAll('.ak-toc ol a');
  if ('IntersectionObserver' in window) {
    var ob = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) links.forEach(function(a){ a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); }); }); }, {rootMargin: '-30%% 0px -60%% 0px'});
    document.querySelectorAll('.ak-doc').forEach(function(a){ ob.observe(a); });
  }
})();
'''


def page(key):
    P = PAGES[key]
    docs = sorted([d for d in DOCS if d['group'] == P['group']], key=lambda d: d['sort'])
    vols = sorted(set(d['volume'] for d in docs))
    header = HEADER
    if key == 'ruina':
        header = header.replace('<a href="akty-ruina.html" class="nav-doc">', '<a href="akty-ruina.html" class="nav-doc is-current" aria-current="page">')
    else:
        header = header.replace('class="nav-link active">Архівні справи', 'class="nav-link">Архівні справи')
        header = header.replace('<a href="jewish-history.html" class="nav-cat">', '<a href="jewish-history.html" class="nav-cat is-current" aria-current="page">')
    nscans = sum(len(d['scans']) for d in docs)
    npers = sum(d['nPersons'] for d in docs)
    toc = ''.join('<li><a href="#%s"><b>%s</b><span>%s</span></a></li>' % (d['id'], '%d %s %s' % (int(d['sort'][8:10]), MON[int(d['sort'][5:7])], d['sort'][:4]), esc(d['title'])) for d in docs)
    also = ('<p class="ak-also">Про євреїв Дубровиці в цих самих книгах: <a href="akty-yevrei.html">акти 1645–1646</a>.</p>' if key == 'ruina'
            else '<p class="ak-also">Про війну 1654–1663 у тих самих книгах: <a href="akty-ruina.html">акти Руїни</a>.</p>')
    sc = {d['id']: {'t': d['title'], 's': d['scans']} for d in docs}
    years = sorted(set(d['sort'][:4] for d in docs))
    out = '''<!DOCTYPE html>
<html lang="uk" data-theme="light">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-WGBZ0BD23K"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-WGBZ0BD23K');
</script>
    <meta charset="UTF-8">
    <link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
    <link rel="icon" type="image/x-icon" href="favicon.ico">
    <link rel="manifest" href="site.webmanifest">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="description" content="{desc}">
    <meta property="og:title" content="{ogt}">
    <meta property="og:description" content="{desc}">
    <meta property="og:type" content="article">
    <title>{title}</title>
    <script>!function(){{var t=localStorage.getItem('theme')||'light';document.documentElement.setAttribute('data-theme',t)}}()</script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="app.css?v=11">
<style>{css}</style>
<link rel="stylesheet" href="ds.css">
</head>
<body class="ak-page">

{header}

<section class="cover" aria-label="{ogt}">
    <img class="cover-img cover-img--paper" src="{cover}" alt="" fetchpriority="high" decoding="async" style="--cover-pos:center 20%">
    <div class="cover-shade"></div>
    <div class="cover-inner">
        <nav class="cover-crumbs" aria-label="Навігаційний ланцюжок">{crumbs}</nav>
        <p class="cover-kicker">{kicker}</p>
        <h1 class="cover-title cover-title--long">{h1}</h1>
        <p class="cover-lede">{lede}</p>
        <dl class="cover-facts">
            <div><dt>{wacts}</dt><dd>{nd}</dd></div>
            <div><dt>роки</dt><dd>{years}</dd></div>
            <div><dt>сканів видання</dt><dd>{ns}</dd></div>
            <div><dt>осіб у покажчиках</dt><dd>{npers}</dd></div>
        </dl>
        <p class="cover-credit"><b>На зображенні</b>{credit}</p>
    </div>
</section>

<main class="ak">
  <div class="ak-wrap">
    <nav class="ak-toc" aria-label="Акти на сторінці">
      <p class="ak-toc-h">{nd} {wacts}</p>
      <ol>{toc}</ol>
      {also}
    </nav>
    <div class="ak-main">
      <div class="ak-intro">{intro}<p class="ak-src">Джерело: {vols}.</p></div>
      {articles}
    </div>
  </div>
</main>

<div class="ak-lb" id="akLb" role="dialog" aria-modal="true" aria-label="Скан сторінки">
  <div class="ak-lb-bar"><b id="akLbCap"></b><button type="button" id="akLbPrev" aria-label="Попередній скан">←</button><button type="button" id="akLbNext" aria-label="Наступний скан">→</button><button type="button" id="akLbClose" aria-label="Закрити">✕</button></div>
  <div class="ak-lb-stage"><img id="akLbImg" alt="Скан сторінки видання"></div>
</div>

{footer}

<script src="app.js?v=11"></script>
<script>{js}</script>
</body>
</html>
'''.format(desc=esc(P['desc']), ogt=esc(re.sub(r'<[^>]+>', '', P['h1'])), title=esc(P['title']), css=CSS, header=header, cover=esc(docs[0]['scans'][0]),
           crumbs=P['crumbs'], kicker=P['kicker'], h1=P['h1'], lede=esc(P['lede']), nd=len(docs), wacts='акти' if len(docs) < 5 else 'актів',
           years=years[0] + ('–' + years[-1] if len(years) > 1 else ''), ns=nscans, npers=npers, credit=P['credit'], toc=toc, also=also,
           intro=P['intro'], vols='; '.join(VOL[v] for v in vols), articles=''.join(article(d) for d in docs), footer=FOOTER,
           js=JS % json.dumps(sc, ensure_ascii=False))
    open(os.path.join(ROOT, P['file']), 'w', encoding='utf-8').write(out)
    print(P['file'], len(out), len(docs))


for k in PAGES:
    page(k)
