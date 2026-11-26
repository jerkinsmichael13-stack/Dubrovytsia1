# -*- coding: utf-8 -*-
"""Збирає povstantsi-1918.html з tools/povstantsi/people.py.
Запуск з кореня репозиторію:  python3 tools/povstantsi/build.py
Шапку й підвал бере з worobin-1918.html, щоб меню на обох сторінках збігалося."""
import os, re, html, json
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
HERE = os.path.dirname(os.path.abspath(__file__))
g = {}; exec(open(os.path.join(HERE, 'people.py'), encoding='utf-8').read(), g)
P, TIERS, SUSPECTS = g['P'], g['TIERS'], g['SUSPECTS']
W = open(os.path.join(ROOT, 'worobin-1918.html'), encoding='utf-8').read()
e = lambda s: html.escape(s, quote=False)
ROMAN = {1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI'}
SRC = {'S': ('Справа', 'польська кримінальна справа 1919–1923 років'),
       'T': ('Степанов', 'книжка Л. Степанова «Безсмертя батьків», 1968'),
       'G': ('Газети', 'радянські газети й спогади 1927–1985 років'),
       'R': ('Родина', 'родинна презентація про С. Й. Лясковця й музейна добірка'),
       'F': ('Фото 1925', 'світлина учасників повстання, Харків, 1925')}
BLOCKS = [('S', 'Польська справа'), ('T', 'Степанов, «Безсмертя батьків»'), ('G', 'Газети й спогади'), ('R', 'Родина й музейна добірка')]
byid = {p['id']: p for p in P}

# ── зв'язки з пресою ──
import sys; sys.path.insert(0, HERE)
from press_links import links as _press_links
PRESS = {a['id']: a for a in json.load(open(os.path.join(ROOT, 'press-data.json'), encoding='utf-8'))}
PL = {pid: sorted(set(ids), key=lambda i: (PRESS[i].get('date') or str(PRESS[i].get('year')), i)) for pid, ids in _press_links(P, list(PRESS.values())).items()}
MON = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
def pdate(a):
    p = (a.get('date') or '').split('-')
    if len(p) == 3 and p[1] != '00' and p[2] != '00': return f'{int(p[2])}.{MON[int(p[1]) - 1]}.{p[0]}'
    if len(p) >= 2 and p[1] not in ('', '00'): return f'{MON[int(p[1]) - 1]}.{p[0]}'
    return str(a.get('year') or '')
def press_block(p):
    ids = PL.get(p['id'])
    if not ids: return ''
    li = ''.join(f'<li><a href="presa.html?id={i}"><time>{pdate(PRESS[i])}</time> <b>«{e(PRESS[i]["source"])}»</b> — {e(PRESS[i]["headline"])}</a></li>' for i in ids)
    return f'<section class="pv-blk pv-press"><h4>У пресі</h4><ul>{li}</ul></section>'

def links(s):
    s = e(s)
    def rep(m):
        kind, ref, txt = m.group(1), m.group(2), m.group(3)
        if kind == 'doc': return f'<a href="worobin-1918.html#doc-{ref}">{txt}</a>'
        if kind == 'p':
            assert ref in byid, ref
            return f'<a href="#p-{ref}" class="pv-xref">{txt}</a>'
        if kind == 'sec': return f'<a href="worobin-1918.html#{ref}">{txt}</a>'
    return re.sub(r'\[\[(doc|p|sec):([^|\]]+)\|([^\]]+)\]\]', rep, s)

def initials(name):
    w = [x for x in re.split(r'[\s(]+', name) if x and x[0].isalpha()]
    return (w[0][0] + (w[1][0] if len(w) > 1 else '')).upper()

def tags(src, cls='pv-tag'):
    return ''.join(f'<i class="{cls} pv-t-{k}" title="{SRC[k][1]}">{SRC[k][0]}</i>' for k in src)

def face(p, size='s'):
    if p.get('photo'):
        return f'<img src="{p["photo"]}" alt="" loading="lazy" decoding="async">'
    return f'<span class="pv-mono" aria-hidden="true">{initials(p["name"])}</span>'

def soviet_only(p): return 'S' not in p['src']

# ── плитки покажчика ──
def tile(p):
    so = ' data-sov="1"' if soviet_only(p) else ''
    full = ''
    return (f'<li data-name="{e(p["name"].lower())} {e(p.get("alt","").lower())}" data-tier="{p["tier"]}"{so}>'
            f'<a href="#p-{p["id"]}" class="pv-tile"><span class="pv-face">{face(p)}</span>'
            f'<span class="pv-tile-tx"><b>{e(p["name"])}{full}</b><small>{e(p["place"])} · {e(p["role"])}</small>'
            f'<span class="pv-tags">{tags(p["src"])}</span></span></a></li>')

# ── біографії ──
def bio(p):
    so = ' data-sov="1"' if soviet_only(p) else ''
    head = (f'<header class="pv-bio-h"><button type="button" class="pv-por" {"data-lb=%s data-cap=%s" % (json.dumps(p["big"]), json.dumps(p.get("cap",""), ensure_ascii=False)) if p.get("big") else "disabled"} aria-label="Портрет: {e(p["name"])}">{face(p)}</button>'
            f'<div><p class="pv-bio-k">{ROMAN[p["tier"]]} · {e(p["role"])}</p><h3>{e(p["name"])}</h3>'
            + (f'<p class="pv-alt">{e(p["alt"])}</p>' if p.get('alt') else '')
            + f'<p class="pv-meta">{e(p.get("life") or "роки життя невідомі")} · {e(p["place"])}</p>'
            f'<p class="pv-tags">{tags(p["src"])}</p></div></header>')
    body = f'<p class="pv-lead">{links(p["lead"])}</p>'
    if p['full']:
        for k, title in BLOCKS:
            items = p.get(k) or []
            if items:
                body += f'<section class="pv-blk pv-blk-{k}"><h4><i class="pv-dot pv-t-{k}"></i>{title}</h4><ul>' + ''.join(f'<li>{links(x)}</li>' for x in items) + '</ul></section>'
        if p.get('fate'): body += f'<section class="pv-blk pv-fate"><h4>Доля</h4><p>{links(p["fate"])}</p></section>'
        if p.get('diff'): body += f'<section class="pv-blk pv-diff"><h4>Що розходиться</h4><p>{links(p["diff"])}</p></section>'
    body += press_block(p)
    if p.get('links'):
        body += '<p class="pv-more">' + ' '.join(f'<a href="{h}">{e(t)} →</a>' for t, h in p['links']) + '</p>'
    if not p['full']:
        body += '<p class="pv-wip">Коротка довідка: інших відомостей про цю людину в джерелах немає.</p>'
    cls = 'pv-bio' + ('' if p['full'] else ' pv-bio--short')
    return f'<article class="{cls}" id="p-{p["id"]}" data-tier="{p["tier"]}" data-name="{e(p["name"].lower())} {e(p.get("alt","").lower())}"{so}>{head}<div class="pv-bio-b">{body}</div></article>'

def tier_index():
    out = []
    for t, title, desc in TIERS:
        ps = [p for p in P if p['tier'] == t]
        out.append(f'<section class="pv-tier" data-tier="{t}"><div class="ds-sh"><b>{ROMAN[t]}</b><h2>{title}</h2><span>{len(ps)}</span></div>'
                   f'<p class="pv-tier-d">{desc}</p><ul class="pv-grid">' + ''.join(tile(p) for p in ps) + '</ul></section>')
    return '\n'.join(out)

def bios():
    out = []
    for t, title, desc in TIERS:
        ps = sorted([p for p in P if p['tier'] == t], key=lambda p: (not p['full']))
        out.append(f'<div class="pv-bios-t" data-tier="{t}"><h3 class="pv-bios-th"><b>{ROMAN[t]}</b> {title}</h3>' + ''.join(bio(p) for p in ps) + '</div>')
    return '\n'.join(out)

n_all = len(P); n_full = sum(p['full'] for p in P)
n_case = sum('S' in p['src'] for p in P); n_sov = n_all - n_case
mosaic_ids = ['stepan-lyaskovets','mykola-lyaskovets','viacheslav-lyaskovets','oleksandr-kononchuk','fedir-rabeshko','oleksandr-sadovskyi',
              'mykola-hrytsiuk','hryhorii-bovhyria','oleksandr-modek','pylyp-borko-bruiaka','hnat-nashora','havrylo-kurach']
mosaic = ''.join(f'<a href="#p-{i}" style="--i:{k}"><img src="{byid[i]["photo"]}" alt="{e(byid[i]["name"])}" decoding="async"></a>' for k, i in enumerate(mosaic_ids))

# ── шаблон ──
head_start = W[:W.find('<meta name="description"')]
head_start = re.sub(r'<link rel="preload" as="image"[^>]*>\n?', '', head_start)
fonts_css = re.search(r'<link rel="stylesheet" href="app\.css[^>]*>.*?<link rel="stylesheet" href="ds\.css[^>]*>', W, re.S).group(0)
header = W[W.find('<body>'):W.find('</header>') + len('</header>')]
header = header.replace('class="nav-doc is-current" aria-current="page"', 'class="nav-doc is-current"')
footer = W[W.find('<footer'):W.find('</footer>') + len('</footer>')]
desc = ('Реєстр учасників Дубровицького повстання 1918 року й нападу на Воробин: від керівників ревкому до санітарок. '
        'Кожна біографія показує окремо, що пишуть польська кримінальна справа 1919–1923 років, книжка Л. Степанова, газети й родинні архіви.')

CSS = open(os.path.join(HERE, 'page.css'), encoding='utf-8').read()
JS = open(os.path.join(HERE, 'page.js'), encoding='utf-8').read()

page = f'''{head_start}<meta name="description" content="{e(desc)}">
<title>Учасники повстання 1918 — Дубровиця</title>
    <meta property="og:title" content="Учасники Дубровицького повстання 1918 року">
    <meta property="og:description" content="{e(desc)}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://dubrovytsia.site/povstantsi-1918.html">
    <meta property="og:image" content="https://dubrovytsia.site/w18-port/kh25-1200.webp">
    <meta property="og:site_name" content="Дубровиця · цифровий архів">
    <meta property="og:locale" content="uk_UA">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="canonical" href="https://dubrovytsia.site/povstantsi-1918.html">
<script>!function(){{var t=localStorage.getItem('theme')||'light';document.documentElement.setAttribute('data-theme',t)}}()</script>
{fonts_css}
<style>
{CSS}
</style>
</head>
{header}

<main class="pv">
<section class="pv-hero" aria-label="Учасники повстання">
  <div class="pv-hero-in">
    <div>
      <nav class="cover-crumbs" aria-label="Навігаційний ланцюжок"><a href="metrychni-knyhy.html">Архівні справи</a><span>/</span><a href="plater.html">Плятери</a><span>/</span><a href="worobin-1918.html">Воробин, 1918</a><span>/</span>Учасники</nav>
      <p class="cover-kicker">Дубровицьке повстання · листопад 1918 — січень 1919</p>
      <h1 class="cover-title">Учасники <em>повстання</em></h1>
      <p class="cover-lede">Хто підняв Дубровицю, хто вів загони на Воробин, хто лежав пораненим у лікарні й хто сидів потім на лаві підсудних. Про кожного — окремо, що каже польська кримінальна справа, що пише радянська книжка Лева Степанова, газети й родинні архіви.</p>
      <dl class="cover-facts">
        <div><dt>людей у реєстрі</dt><dd>{n_all}</dd></div>
        <div><dt>згадані в польській справі</dt><dd>{n_case}</dd></div>
        <div><dt>лише в радянських джерелах</dt><dd>{n_sov}</dd></div>
      </dl>
      <p class="pv-hero-back"><a href="worobin-1918.html">← Воробин, листопад 1918</a></p>
    </div>
    <div class="pv-mosaic" aria-label="Портрети учасників">{mosaic}</div>
  </div>
</section>

<div class="pv-wrap">
<section class="pv-intro">
  <p class="pv-lead-big">Реєстр зведено з чотирьох груп джерел, які майже ніколи не говорять про тих самих людей однаково. Польська справа знає нападників з лікарняної книги, доносів і допитів, але майже нічого не знає про ревком. Степанов і газети знають ревком і загони, але мовчать про розстріл полонених і про тих, кого засудили. Тому в кожній біографії джерела подано окремими блоками, і позначки біля імені показують, звідки відома людина.</p>
  <ul class="pv-legend">{''.join(f'<li><i class="pv-tag pv-t-{k}">{v[0]}</i><span>{v[1]}</span></li>' for k, v in SRC.items())}</ul>
  <p class="pv-note">Люди, яких знають тільки радянські тексти, у реєстрі є, але без позначки «Справа». Радянські автори писали ювілейну історію: дати в них зсунуто на 13 днів, а нападників на Воробин подано як учасників бою з «карателями». <a href="worobin-1918.html#dvi-pamiati">Дві версії однієї ночі →</a></p>
</section>

<div class="pv-bar" role="search">
  <label class="pv-search"><span class="sr-only">Пошук за ім'ям</span><input type="search" id="pvQ" placeholder="Знайти за ім'ям або прізвищем…" autocomplete="off"></label>
  <div class="pv-chips" role="group" aria-label="Фільтр">
    <button type="button" class="pv-chip is-on" data-f="all">Усі</button>
    <button type="button" class="pv-chip" data-f="case">Є в польській справі</button>
    <button type="button" class="pv-chip" data-f="sov">Лише радянські джерела</button>
  </div>
  <p class="pv-count" id="pvCount" aria-live="polite"></p>
</div>

<section class="pv-index" aria-label="Покажчик">
{tier_index()}
</section>

<section class="pv-bios" aria-label="Біографії">
  <div class="ds-sh"><b>§</b><h2>Біографії</h2><span>джерела окремо</span></div>
{bios()}
</section>

<section class="pv-susp">
  <div class="ds-sh"><b>—</b><h2>Підозрювані, але не учасники</h2><span>не в реєстрі</span></div>
  <p>{e(SUSPECTS)} <a href="worobin-1918.html#nevynni">Не ті люди →</a></p>
</section>
</div>
</main>

<div class="pv-lb" id="pvLb" hidden><button type="button" class="pv-lb-x" aria-label="Закрити">×</button><figure><img alt=""><figcaption></figcaption></figure></div>

{footer}

<script src="app.js?v=17"></script>
<script>
{JS}
</script>
</body>
</html>
'''
open(os.path.join(ROOT, 'povstantsi-1918.html'), 'w', encoding='utf-8').write(page)
print('povstantsi-1918.html', len(page), 'людей', n_all, 'повних', n_full)

# ── для §13 сторінки worobin-1918: список із фото (вставляє build.py сторінки Воробина) ──
def w18_list():
    out = ['<div class="w18-ppl2">']
    for t, title, desc in TIERS:
        ps = [p for p in P if p['tier'] == t]
        out.append(f'<h3 class="w18-ppl2-h"><b>{ROMAN[t]}</b> {title} <small>{len(ps)}</small></h3><ul class="w18-ppl2-g">')
        for p in ps:
            ph = f'<img src="{p["photo"]}" alt="" loading="lazy" decoding="async">' if p.get('photo') else f'<span>{initials(p["name"])}</span>'
            out.append(f'<li><a href="povstantsi-1918.html#p-{p["id"]}"><i>{ph}</i><b>{e(p["name"])}</b><small>{e(p["role"])}</small></a></li>')
        out.append('</ul>')
    out.append(f'<p class="w18-ppl2-more"><a href="povstantsi-1918.html">Усі {n_all} учасників і біографії з джерелами →</a></p></div>')
    return ''.join(out)
open(os.path.join(HERE, 'w18-list.html'), 'w', encoding='utf-8').write(w18_list())

# ── зв'язки в читалці преси: presa.html, між /*W18_LINKS_START*/ і /*W18_LINKS_END*/ ──
by_art = {}
for p in P:
    for i in PL.get(p['id'], []):
        by_art.setdefault(i, []).append([p['id'], p['name']])
pp = os.path.join(ROOT, 'presa.html')
ps = open(pp, encoding='utf-8').read()
a = ps.index('/*W18_LINKS_START*/'); b = ps.index('/*W18_LINKS_END*/')
ps = ps[:a] + '/*W18_LINKS_START*/var W18_LINKS=' + json.dumps(by_art, ensure_ascii=False, separators=(',', ':')) + ';' + ps[b:]
open(pp, 'w', encoding='utf-8').write(ps)
print('presa.html: зв\'язки для', len(by_art), 'статей,', sum(map(len, by_art.values())), 'згадок')
