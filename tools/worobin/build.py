# -*- coding: utf-8 -*-
"""Збирає worobin-1918.html із джерел у цій папці.

    python3 tools/worobin/build.py        (з кореня репозиторію)

Джерела:
  shell.html          — оболонка сторінки (head, шапка, футер) з мітками @@CSS@@ @@JS@@ @@TOC@@ @@BODY@@
  worobin.css/.js     — стилі й скрипт сторінки (вбудовуються в сторінку)
  sections/<id>.html  — розділи; номер «§ @@N@@» ставиться автоматично за порядком ORDER
  ../../w18-docs.json — документи справи (список у розділі «Документи» генерується з нього)
  ../povstantsi/w18-list.html — список учасників (генерує tools/povstantsi/build.py)
  norm_names.py       — єдине написання імен і назв (застосовується до всієї сторінки)

Після збірки: python3 build_index.py (пошук по сайту).
"""
import html, json, os, re, sys

T = os.path.dirname(os.path.abspath(__file__)) + '/'
R = os.path.normpath(T + '../..') + '/'
sys.path.insert(0, T)
from norm_names import norm

# Порядок розділів. Рядок 'chastyna-N' — заставка частини; кортеж (id, назва в змісті).
ORDER = [
    ('sprava', 'Справа'),
    'chastyna-1',
    ('vlada', 'Влада'), ('peredistoriia', 'Передісторія'), ('chomu', 'Причини'),
    'chastyna-2',
    ('khronika', 'Хроніка'), ('svidok', 'Свідок'), ('mapa', 'Мапа'), ('zahybli', 'Загиблі'),
    ('poraneni', 'Книга хворих'), ('dvi-pamiati', 'Дві версії'),
    'chastyna-3',
    ('povstannia', 'Ревком'), ('respublika', 'Республіка'), ('liudy', 'Люди'),
    'chastyna-4',
    ('sud', 'Слідство й суд'), ('pidsudni', 'Підсудні'), ('holosy', 'Голоси'), ('nevynni', 'Не ті люди'),
    'chastyna-5',
    ('kharkiv-1925', 'Харків, 1925'), ('lyaskovtsi', 'Лясковці'), ('stepan', 'Степан'),
    ('potim', 'Долі'), ('rozbizhnosti', 'Розбіжності'), ('dokumenty', 'Документи'), ('dzherelo', 'Джерела'),
]
ROMAN = {'chastyna-1': 'I', 'chastyna-2': 'II', 'chastyna-3': 'III', 'chastyna-4': 'IV', 'chastyna-5': 'V'}


def rd(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


from docs_facets import doc_type, doc_people, TYPE_NAMES, TYPES, OTHER, PEOPLE


def doc_li(d):
    n = len(d['pages']); a = d.get('all') or n
    sm = (d['arch'] + ' · ' if d.get('arch') else '') + (f'{n} арк.' if n == a else f'{n} з {a} арк.')
    sm += {'ok': '', 'part': ' · звірено частково', 'raw': ' · переклад ще не звірено'}[d['st']]
    e = html.escape
    t = doc_type(d)
    attrs = f' data-y="{d["iso"][:4]}" data-t="{t}" data-p="{" ".join(doc_people(d))}" data-m="{1 if d["kind"] == "m" else 0}"'
    return (f'<li{attrs}><button type="button" class="w18-dc" data-doc="{d["id"]}"><span class="w18-dc-im"><img src="w18-scans/t/IMG_{d["pages"][0]}.webp" alt="" width="190" height="260" loading="lazy" decoding="async"></span>'
            f'<span class="w18-dc-tx"><time>{d["date"]}</time><b>{e(d["title"], quote=False)}</b><span>{e(d["note"], quote=False)}</span>'
            f'<small><i>{TYPE_NAMES[t]}</i> · {e(sm, quote=False)}</small></span></button></li>')


def docs_block(docs):
    """Список документів із групами за роками + панель пошуку й фільтрів."""
    from collections import Counter, OrderedDict
    e = html.escape
    yr = lambda d: d['iso'][:4] if d['iso'][:4] <= '1925' else 'пізніше'
    groups = OrderedDict()
    for d in docs: groups.setdefault(yr(d), []).append(d)
    tc = Counter(doc_type(d) for d in docs)
    pc = Counter(p for d in docs for p in doc_people(d))
    opt_t = ''.join(f'<option value="{c}">{n} ({tc[c]})</option>' for c, n in [(c, n) for c, n, _ in TYPES] + [OTHER] if tc[c])
    opt_y = ''.join(f'<option value="{y}">{y} ({len(v)})</option>' for y, v in groups.items())
    og = OrderedDict()
    for c, n, g, _ in PEOPLE:
        if pc[c] >= 2: og.setdefault(g, []).append(f'<option value="{c}">{n} ({pc[c]})</option>')
    opt_p = ''.join(f'<optgroup label="{g}">{"".join(v)}</optgroup>' for g, v in og.items())
    nm = sum(d['kind'] == 'm' for d in docs)
    bar = (f'<div class="w18-df" role="search">'
           f'<label class="w18-df-q"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10.4 10.4l3.6 3.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
           f'<input type="search" id="w18-df-q" placeholder="Пошук у назвах, анотаціях і перекладах" autocomplete="off" aria-label="Пошук документів"></label>'
           f'<select id="w18-df-t" aria-label="Тип документа"><option value="">Усі типи</option>{opt_t}</select>'
           f'<select id="w18-df-p" aria-label="Особа"><option value="">Усі особи</option>{opt_p}</select>'
           f'<select id="w18-df-y" aria-label="Рік"><option value="">Усі роки</option>{opt_y}</select>'
           f'<label class="w18-df-m"><input type="checkbox" id="w18-df-m"> лише основні <small>{nm}</small></label>'
           f'<p class="w18-df-n" aria-live="polite"><span id="w18-df-n">{len(docs)}</span> з {len(docs)} документів <button type="button" id="w18-df-r" hidden>скинути фільтри</button></p></div>')
    out = [bar, '<div class="w18-dl" id="w18-dl">']
    for y, ds in groups.items():
        out.append(f'<section class="w18-dl-y" data-yr="{y}"><h3 class="w18-dl-h">{y}<small>{len(ds)}</small></h3><ol class="w18-docs">'
                   + '\n'.join(doc_li(d) for d in ds) + '</ol></section>')
    out.append('<p class="w18-dl-none" id="w18-dl-none" hidden>Нічого не знайдено. Спробуйте інше слово або скиньте фільтри.</p></div>')
    return '\n'.join(out)


def build():
    docs = sorted(json.loads(rd(R + 'w18-docs.json')), key=lambda d: d['iso'])
    docs_html = docs_block(docs)
    people = rd(R + 'tools/povstantsi/w18-list.html')

    body, toc, num = [], [], 0
    for item in ORDER:
        if isinstance(item, str):
            body.append(rd(T + f'sections/{item}.html'))
            toc.append(f'        <li class="w18-toc-act" aria-hidden="true">{ROMAN[item]}</li>')
            continue
        sid, label = item
        num += 1
        s = rd(T + f'sections/{sid}.html')
        assert s.count('@@N@@') == 1, sid
        s = s.replace('@@N@@', str(num))
        s = s.replace('@@DOCS@@', docs_html).replace('@@PEOPLE@@', people)
        body.append(f'<!-- § {num} -->\n' + s)
        toc.append(f'        <li><a href="#{sid}"><b>{num}</b>{label}</a></li>')
    toc_html = '<nav class="w18-toc" aria-label="Розділи сторінки">\n    <ol>\n' + '\n'.join(toc) + '\n    </ol>\n</nav>'

    h = rd(T + 'shell.html')
    for k, v in (('@@CSS@@', rd(T + 'worobin.css')), ('@@JS@@', rd(T + 'worobin.js')),
                 ('@@TOC@@', toc_html), ('@@BODY@@', '\n\n'.join(body))):
        assert h.count(k) == 1, k
        h = h.replace(k, v)
    return norm(h)


if __name__ == '__main__':
    out = build()
    if sys.argv[1:] == ['--check']:
        cur = rd(R + 'worobin-1918.html')
        print('однакові' if cur == out else 'РІЗНЯТЬСЯ', len(cur), len(out))
    else:
        with open(R + 'worobin-1918.html', 'w', encoding='utf-8') as f:
            f.write(out)
        print('worobin-1918.html', len(out))
