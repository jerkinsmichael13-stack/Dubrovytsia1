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
    ('kharkiv-1925', 'Харків, 1925'), ('stepan', 'Степан'), ('lyaskovtsi', 'Лясковці'),
    ('potim', 'Долі'), ('rozbizhnosti', 'Розбіжності'), ('dokumenty', 'Документи'), ('dzherelo', 'Джерела'),
]
ROMAN = {'chastyna-1': 'I', 'chastyna-2': 'II', 'chastyna-3': 'III', 'chastyna-4': 'IV', 'chastyna-5': 'V'}


def rd(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def doc_li(d):
    n = len(d['pages']); a = d.get('all') or n
    sm = (d['arch'] + ' · ' if d.get('arch') else '') + (f'{n} арк.' if n == a else f'{n} з {a} арк.')
    sm += {'ok': '', 'part': ' · звірено частково', 'raw': ' · переклад ще не звірено'}[d['st']]
    e = html.escape
    return (f'<li><button type="button" class="w18-dc" data-doc="{d["id"]}"><span class="w18-dc-im"><img src="w18-scans/t/IMG_{d["pages"][0]}.webp" alt="" width="190" height="260" loading="lazy" decoding="async"></span>'
            f'<span class="w18-dc-tx"><time>{d["date"]}</time><b>{e(d["title"], quote=False)}</b><span>{e(d["note"], quote=False)}</span><small>{e(sm, quote=False)}</small></span></button></li>')


def build():
    docs = sorted(json.loads(rd(R + 'w18-docs.json')), key=lambda d: d['iso'])
    docs_m = '\n'.join(doc_li(d) for d in docs if d['kind'] == 'm')
    docs_s = '\n'.join(doc_li(d) for d in docs if d['kind'] == 's')
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
        s = s.replace('@@DOCS_M@@', docs_m).replace('@@DOCS_S@@', docs_s).replace('@@PEOPLE@@', people)
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
