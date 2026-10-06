#!/usr/bin/env python3
"""Будує два індекси для сайту:
   places-index.json — усе про кожне поселення (події, преса, фото) для poselennia.html
   search-index.json — пошук на весь сайт (Ctrl+K)
   Запуск з кореня репозиторію або з tools/:  python3 build_index.py"""
import json, os, re, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = HERE if os.path.exists(os.path.join(HERE, 'press-data.json')) else os.path.dirname(HERE)
J = lambda f: json.load(open(os.path.join(ROOT, f), encoding='utf-8'))

def load_js(fname, names):
    """Виконує js-файл у node і повертає вказані глобальні змінні."""
    code = ("global.window={};eval(require('fs').readFileSync(%r,'utf8').replace(/^var /mg,'global.'));"
            "process.stdout.write(JSON.stringify({%s}))") % (os.path.join(ROOT, fname), ','.join('%s:global.%s||window.%s' % (n, n, n) for n in names))
    return json.loads(subprocess.check_output(['node', '-e', code]))

A = load_js('sela_data_embed.js', ['ATLAS_SELA_1798', 'ATLAS_OWNERS_1798'])
SELA, OWN = A['ATLAS_SELA_1798'], A['ATLAS_OWNERS_1798']
I = load_js('inventar-plater-data.js', ['INVENTAR_PLATER', 'INVENTAR_FOLWARKS'])
INV, FW = I['INVENTAR_PLATER'], I['INVENTAR_FOLWARKS'] or {}
PRESS = J('press-data.json'); PHOTOS = J('photos.json'); DOCS = J('docs-data.json')
SITE = J('site-index.json'); PERS = J('personalia.json')

def norm(s): return re.sub(r"[’'ʼ`]", '', str(s or '').lower()).replace('ї', 'і').replace('є', 'е').replace('ґ', 'г')

# ── перелік поселень: атлас + села інвентаря, яких в атласі немає ──
PLACES = {}
for k, r in SELA.items():
    PLACES[k] = {'slug': k, 'name': r['mapName'], 'alt': [r.get('mapNameOrig') or '', r.get('excelName') or ''], 'atlas': True, 'owner': r.get('ownerId')}
inv_for = {}
for k, d in INV.items():
    a = d.get('atlas')
    if a is False:
        PLACES[k] = {'slug': k, 'name': d['name'], 'alt': [d.get('docName') or '', d.get('title') or ''], 'atlas': False, 'owner': 'plater'}
        inv_for[k] = k
    else:
        inv_for[a if isinstance(a, str) else k] = k
PLACES['nyvetsk']['alt'] += ['Грицьки', 'Йовтахи']

# ── події зі Стецького (поділ 1558 р., застава 1645 р.) ──
SISTER = {'Марія': ['dombrovytsia', 'vorobyn', 'selets', 'kryvytsia', 'krupove', 'kolky', 'berezhky', 'biliatychi', 'liubykovychi'],
          'Анна': ['dombrovytsia', 'berestia', 'strilsk', 'liutynsk', 'zolote', 'veliun', 'mochulyshche', 'zalishany', 'nyvetsk', 'sokhy'],
          'Федора': ['vysotsk', 'luko', 'liudyn']}
WHO = {'Марія': 'княжни Марії Гольшанської (згодом дружини Андрія Курбського)', 'Анна': 'княжни Анни Гольшанської, дружини Олізара Кердея-Мильського',
       'Федора': 'княжни Федори Гольшанської-Соломерецької'}
PLEDGE_1645 = ['berestia', 'orvianytsia', 'nyvetsk', 'pratsiuky', 'kurash', 'zalishany', 'mochulyshche', 'vorobyn', 'liutynsk', 'veliun', 'bila', 'strilsk', 'hlushytsia', 'karpylivka']
STECKI = 'Т. Є. Стецький, «Z boru i stepu», 1898'
EV = {k: [] for k in PLACES}
for sis, lst in SISTER.items():
    for k in lst:
        if k in EV:
            t = 'Під час поділу «Великого дзвону Дубровицького» між доньками князя Юрія Гольшанського ' + ('половина міста відійшла до ' if k == 'dombrovytsia' else 'поселення відійшло до ') + WHO[sis] + '.'
            EV[k].append([1558, t, STECKI, 'history.html'])
for k in PLEDGE_1645:
    if k in EV: EV[k].append([1645, 'Назване серед маєтностей Дубровицького ключа, які 1645 р. перейшли в заставу.', STECKI, 'history.html'])
for k in ['strilsk', 'hlushytsia']:
    EV[k].append([1832, 'Після закриття колегіуму піарів маєток піарів забрала держава.', STECKI, 'architecture.html'])
for k, r in SELA.items():
    tot = (r.get('male') or 0) + (r.get('female') or 0)
    txt = 'Атлас Волинської губернії: ' + ('%d дворів, ' % r['dvory'] if r.get('dvory') else '') + ('%d мешканців; ' % tot if tot else '') + 'власник — ' + (OWN.get(r.get('ownerId'), {}).get('name') or '—') + '.'
    EV[k].append([1798, txt, 'Атлас Волинської губернії 1798 р.', 'atlas-1798.html#' + k])
for pk, ik in inv_for.items():
    if pk not in EV: continue
    d = INV[ik]; hh = sum(1 for st in d['streets'] for sd in st['sides'] for it in sd['items'] if not it.get('lm'))
    fwn = FW.get(d.get('folwark'), {}).get('name', '')
    EV[pk].append([1800, 'Інвентар маєтку графа Плятера' + (' (' + fwn.lower() + ')' if fwn else '') + ': ' + d.get('title', d['name']) + ' — %d дворів поіменно.' % hh, 'Інвентар Плятера, бл. 1780–1820', 'inventar-naselennia.html?p=' + ik, 'бл. 1800'])

# ── згадки в пресі й фото ──
# Нестандартні основи назв (відмінки, давні форми) і слова, що лише схожі на назву села
STEMS = {'dombrovytsia': ['Дубровиц', 'Домбровиц'], 'selets': ['Сельц', 'Селець'], 'liutynsk': ['Лютинськ', 'Лютинич'], 'nyvetsk': ['Нивецьк', 'Нивецьк', 'Грицьк', 'Йовтах'],
         'vysotsk': ['Висоцьк'], 'strilsk': ['Стрільськ'], 'stepanhorod': ['Степангород'], 'orvianytsia': ["Орв'яниц", 'Орв’яниц', 'Орвяниц'], 'mochulyshche': ['Мочулищ'],
         'berestia': ['Берест', 'Плоск'], 'vorobyn': ['Воробин'], 'kolky': ['Колк'], 'krupove': ['Крупов'], 'zolote': ['Золот'], 'tryputnia': ['Трипутн'], 'ostrivtsi': ['Острівц'],
         'berezhky': ['Бережк'], 'berezhnytsia': ['Бережниц'], 'liudyn': ['Людин'], 'veliun': ['Велюн'], 'zalishany': ['Залішан'], 'pratsiuky': ['Працюк', 'Працук'], 'kryvytsia': ['Кривиц'],
         'litvytsia': ['Літвиц'], 'yasenets': ['Ясенц', 'Ясинц', 'Ясенець', 'Ясинець'], 'remchytsi': ['Ремчиц'], 'khynochi': ['Хиноч'], 'hlushytsia': ['Глушиц'], 'karpylivka': ['Карпилівк']}
FALSE = {'zolote': ['Золотий', 'Золото', 'Золотих', 'Золотом', 'Золотої', 'Золоту', 'Золота'], 'kolky': ['Колка'], 'liudyn': ['Людина', 'Людини', 'Людину', 'Людиною'],
         'vorobyn': [], 'berestia': ['Берестечк', 'Берестейськ']}
def stems_for(k, p):
    if k in STEMS: return STEMS[k]
    n = p['name'].strip()
    if len(n) < 5: return []
    return [re.sub(r"(ця|ія|ля|ня|ка|на|ла|ра|а|я|е|і|и|ь|о)$", '', n)]
def mentions(text, places_field, p, k=None):
    k = k or p.get('slug')
    st = stems_for(k, p) if k else []
    nm = p['name']
    for pl in places_field or []:
        npl = norm(pl)
        if norm(nm) == npl or any(npl.startswith(norm(x)) and len(x) >= 4 for x in st): return True
    if not text: return False
    for x in st:
        for m in re.finditer(r'(?<![А-Яа-яІіЇїЄєҐґ])(' + re.escape(x) + r"[а-яіїєґ'’]{0,4})(?![А-Яа-яІіЇїЄєҐґ])", text):
            w = m.group(1)
            if any(w.startswith(f) for f in FALSE.get(k, [])): continue
            nxt = text[m.end():m.end() + 2]
            if k == 'zolote' and not re.match(r'^Золот(е|ого|ому|им)$', w): continue
            return True
    return False

def pid(u):
    m = re.search(r'imgur\.com/([A-Za-z0-9]+)\.', u or ''); return m.group(1) if m else ''
OUT = {}
for k, p in PLACES.items():
    press = [[d['id'], d['year'], d['headline'], d['source']] for d in PRESS
             if mentions((d.get('headline') or '') + ' ' + (d.get('subheadline') or '') + ' ' + (d.get('translation') or '')[:8000], d.get('places'), p, k)]
    press.sort(key=lambda x: x[1])
    photos, seen = [], set()
    for ph in PHOTOS:
        if ph.get('imageUrl') in seen: continue
        if mentions(ph.get('title', ''), [], p, k):
            seen.add(ph['imageUrl']); photos.append([pid(ph['imageUrl']), ph['imageUrl'], ph.get('title', ''), str(ph.get('date', ''))])
    OUT[k] = {'name': p['name'], 'atlas': p['atlas'], 'inv': inv_for.get(k, ''), 'events': sorted(EV.get(k, []), key=lambda e: e[0]),
              'press': press, 'photos': photos[:60], 'photosTotal': len(photos)}
json.dump(OUT, open(os.path.join(ROOT, 'places-index.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

# ── пошук на весь сайт ──
S = []
def add(t, n, s, u, k=''): S.append({'t': t, 'n': n, 's': s, 'u': u, 'k': norm(k)[:400]})
KIND = {'town': 'Місто', 'village': 'Село'}
for k, p in PLACES.items():
    r = SELA.get(k, {}); o = OWN.get(p['owner'], {}).get('name', '') if p['owner'] else ''
    sub = (KIND.get(r.get('kind'), 'Поселення')) + (' · ' + o if o else '') + (' · %d дворів у 1798 р.' % r['dvory'] if r.get('dvory') else '')
    add('place', p['name'], sub, 'poselennia.html?p=' + k, ' '.join(p['alt']))
for d in PRESS:
    add('press', d['headline'], '%s · %s' % (d['year'], d['source']), 'presa.html?id=' + d['id'], ' '.join((d.get('places') or []) + (d.get('people') or [])))
seen = set()
for ph in PHOTOS:
    u = ph.get('imageUrl')
    if not u or u in seen: continue
    seen.add(u); add('photo', ph.get('title', 'Світлина'), 'Фотоархів' + (' · ' + str(ph['date']) if ph.get('date') and str(ph['date']) != '2026' else ''), 'photo-archive.html?photo=' + pid(u))
# люди з газет: зводимо варіанти одного прізвища
def surname(n):
    n = re.sub(r'\(.*?\)', ' ', n); n = re.sub(r'^(граф|графиня|пан|пані|князь|ксьондз|поручник|майор|полковник|губернатор|о\.|прот\.)\s+', '', n.strip(), flags=re.I)
    w = [x for x in n.split() if not re.match(r'^[А-ЯІЇЄA-Z]\.$', x)]; return w[-1] if w else n
PPL = {}
for d in PRESS:
    for full in d.get('people') or []:
        s = surname(full)
        if len(s) < 3: continue
        key = norm(s).rstrip('иі'); key = key.split('-')[-1] if '-' in key else key
        g = PPL.setdefault(key, {'name': s, 'forms': set(), 'n': 0, 'years': set()})
        g['forms'].add(full.strip()); g['n'] += 1; g['years'].add(d['year'])
for key, g in PPL.items():
    ys = sorted(g['years']); yr = str(ys[0]) if len(ys) == 1 else '%d–%d' % (ys[0], ys[-1])
    add('person', g['name'], 'У пресі · %d %s · %s' % (g['n'], 'згадка' if g['n'] == 1 else 'згадки' if g['n'] < 5 else 'згадок', yr), 'presa.html?q=' + g['name'], ' '.join(g['forms']))
for p in PERS:
    add('person', p.get('name', ''), ' · '.join(x for x in [p.get('role', ''), p.get('years', '')] if x), p.get('sourceUrl') or 'doslidnyk.html?tab=people', p.get('description', '')[:200])
# прізвища з інвентаря
SN = {}
for k, d in INV.items():
    for st in d['streets']:
        for sd in st['sides']:
            for it in sd['items']:
                if it.get('lm') or not it.get('s') or it.get('c') == 'j' or str(it.get('n', '')).startswith('Пан '): continue
                SN.setdefault(it['s'], {}).setdefault(k, 0); SN[it['s']][k] += 1
for s, at in SN.items():
    ks = sorted(at, key=lambda x: -at[x]); n = sum(at.values())
    add('surname', s, 'Інвентар Плятера · ' + ', '.join(INV[x]['name'] for x in ks[:3]) + ' · %d %s' % (n, 'двір' if n == 1 else 'двори' if n < 5 else 'дворів'),
        'inventar-naselennia.html?p=%s&q=%s' % (ks[0], s))
for d in DOCS:
    add('doc', d.get('title', ''), ' · '.join(str(x) for x in [d.get('year', ''), d.get('type', '')] if x), d.get('url', ''), d.get('summary', '')[:200])
for extra in [('Інвентар маєтку графа Плятера', 'Скани, переклад, аналітика', 'inventar-1780.html'), ('Атлас Волинської губернії 1798', 'Інтерактивна мапа', 'atlas-1798.html'),
              ('Аналітика атласу 1798', 'Стани, власники, млини', 'atlas-1798-analityka.html'), ('Поселення Дубровиччини', 'Усе про кожне село', 'poselennia.html'),
              ('Граф Плятер', 'Власник Дубровиці 1775–1832', 'plater.html'), ('Князь Радзивілл', 'Власник маєтку 1798', 'radzyvil.html')]:
    add('page', extra[0], extra[1], extra[2])
for sec in SITE:
    add('page', sec.get('section', ''), sec.get('summary', '')[:90], sec.get('url', ''))
    for tp in sec.get('topics', []) or []:
        add('page', tp.get('title', ''), sec.get('section', ''), sec.get('url', '') + (('#' + tp['anchor']) if tp.get('anchor') else ''))
json.dump(S, open(os.path.join(ROOT, 'search-index.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
from collections import Counter
print('places:', len(OUT), '| search items:', len(S), dict(Counter(x['t'] for x in S)))

# ═════════ ПРІЗВИЩА: інвентар бл. 1800 · Перша світова · виборці 1938 · преса ═════════
import sys; sys.path.insert(0, HERE if os.path.exists(os.path.join(HERE, 'surnames.py')) else os.path.join(ROOT, 'tools'))
from surnames import key as skey
VOT = J('voters.json')['voters']; WW = J('ww1.json')
SR = {}
def bucket(k, disp, script):
    b = SR.setdefault(k, {'k': k, 'forms': {}, 'inv': [], 'ww': [], 'vot': [], 'press': []})
    b['forms'][disp] = b['forms'].get(disp, 0) + (10 if script == 'ua' else 1)
    return b
VILL = {r['mapName']: k for k, r in SELA.items()}
for k, p in PLACES.items(): VILL.setdefault(p['name'], k)
VILL.update({'Орв\'яниця': 'orvianytsia', 'Працуки': 'pratsiuky', 'Ясинець': 'yasenets', 'Заріччя (ст. Дубровиця)': 'dombrovytsia', 'Домбровиця': 'dombrovytsia'})
for ik, d in INV.items():
    vname = d['name']; pk = next((x for x, y in inv_for.items() if y == ik), ik)
    for st in d['streets']:
        for sd in st['sides']:
            for it in sd['items']:
                if it.get('lm') or not it.get('s') or it.get('c') == 'j' or str(it.get('n', '')).startswith('Пан '): continue
                k = skey(it['s'])
                if len(k) < 3: continue
                b = bucket(k, it['s'], 'ua')
                fam = [m.get('n', '') for m in (it.get('m') or []) if m.get('n')]
                b['inv'].append([ik, pk, vname, it['n'], len(fam), ', '.join(fam[:6])])
for w in WW:
    ln = re.sub(r'\s*\(.*?\)', '', w.get('last_name') or '').strip()
    if not ln: continue
    k = skey(ln)
    if len(k) < 3: continue
    lu = re.sub(r'ский$', 'ський', re.sub(r'цкий$', 'цький', ln)); lu = re.sub(r'ец$', 'ець', lu); lu = re.sub(r'ой$', 'ий', lu).replace('ъ', '')
    b = bucket(k, lu, 'ru')
    b['ww'].append([w.get('first_name', ''), w.get('middle_name', ''), w.get('place_ua') or w.get('birth_place') or '', w.get('cause', ''), w.get('doc_type', ''), w.get('rank', ''),
                    ' '.join(x for x in [w.get('archive', ''), w.get('fond', '') and 'ф. ' + w['fond'], w.get('opis', '') and 'оп. ' + w['opis'], w.get('delo', '') and 'спр. ' + w['delo']] if x), w.get('image_url', ''),
                    VILL.get(w.get('place_ua') or '', 'dombrovytsia' if (w.get('place_ua') or '') in ('Домбровиця', 'Дубровиця') else '')])
for v in VOT:
    ln = (v.get('surname') or '').strip()
    if not ln: continue
    k = skey(ln)
    if len(k) < 3: continue
    b = bucket(k, ln, 'pl')
    b['vot'].append([v.get('first', ''), v.get('born', ''), v.get('village', ''), VILL.get(v.get('village', ''), ''), v.get('addr', ''), v.get('prof', '')])
for d in PRESS:
    for full in d.get('people') or []:
        s = surname(full)
        k = skey(s)
        if k in SR and len(k) >= 3:
            if d['id'] not in [x[0] for x in SR[k]['press']]:
                SR[k]['press'].append([d['id'], d['year'], d['headline'], full.strip()])
                SR[k]['forms'][s] = SR[k]['forms'].get(s, 0) + 5
# ── зведення прізвищ, що різняться однією літерою (Приходько / Приходико) ──
def lev1(a, b):
    """True, якщо слова різняться рівно одною вставкою, пропуском чи заміною."""
    if a == b or abs(len(a) - len(b)) > 1: return False
    if len(a) > len(b): a, b = b, a
    i = 0
    while i < len(a) and a[i] == b[i]: i += 1
    return a[i + (len(a) == len(b)):] == b[i + 1:]
VOW = set('aeiou')
def diff_soft(a, b):
    """Різниця лише в голосній або в i/e (типово для передачі писарем), а не в приголосній."""
    if len(a) == len(b): return [x for x, y in zip(a, b) if x != y][0] in VOW and [y for x, y in zip(a, b) if x != y][0] in VOW
    l, sh = (a, b) if len(a) > len(b) else (b, a)
    i = 0
    while i < len(sh) and sh[i] == l[i]: i += 1
    return l[i] in VOW
def size(b): return len(b['inv']) + len(b['ww']) + len(b['vot']) + len(b['press'])
keys = sorted(SR, key=lambda k: -size(SR[k]))
ALIAS = {}
by3 = {}
for k in keys: by3.setdefault(k[:3], []).append(k)
for k in keys:
    if k in ALIAS or len(k) < 6: continue
    for o in by3.get(k[:3], []):
        if o == k or o in ALIAS or len(o) < 6 or o[-2:] != k[-2:]: continue
        so = [f for f in ('inv', 'ww', 'vot') if SR[o][f]]; sk = [f for f in ('inv', 'ww', 'vot') if SR[k][f]]
        cross = len(so) == 1 and so[0] not in sk          # варіант трапляється лише в одному джерелі, і не в тому, де основне написання
        ins_i = len(k) != len(o) and len(set(k) ^ set(o)) <= 1 and ('i' in (set(k) ^ set(o)) or 'e' in (set(k) ^ set(o)))
        ao = len(k) == len(o) and any(i < 4 and {x, y} == {'a', 'o'} for i, (x, y) in enumerate(zip(k, o)) if x != y)
        iko = (k.endswith('ko') and o == k[:-2] + 'iko') or (o.endswith('ko') and k == o[:-2] + 'iko')   # Приходько / Приходико
        if iko or (lev1(k, o) and diff_soft(k, o) and cross and not ao and (len(k) == len(o) or ins_i) and size(SR[o]) <= size(SR[k])):
            t = SR[k]; f = SR.pop(o)
            for fld in ('inv', 'ww', 'vot', 'press'): t[fld] += f[fld]
            for fm, c in f['forms'].items(): t['forms'][fm] = t['forms'].get(fm, 0) + c
            ALIAS[o] = k
by3 = None
def disp(b):
    cyr = [f for f in b['forms'] if re.search(r'[А-Яа-яІіЇїЄєҐґ]', f)]
    pool = cyr or list(b['forms'])
    return sorted(pool, key=lambda f: (-b['forms'][f], len(f)))[0]
SUM, CH = [], {}
for k, b in SR.items():
    b['name'] = disp(b); b['variants'] = sorted(b['forms'], key=lambda f: -b['forms'][f])
    del b['forms']
    tot = len(b['inv']) + len(b['ww']) + len(b['vot']) + len(b['press'])
    SUM.append([k, b['name'], len(b['inv']), len(b['ww']), len(b['vot']), len(b['press'])])
    CH.setdefault(k[0], {})[k] = b
for c, part in CH.items():
    json.dump(part, open(os.path.join(ROOT, 'surnames-' + c + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
SUM.sort(key=lambda x: x[1].lower())
json.dump(ALIAS, open(os.path.join(ROOT, 'surnames-alias.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
json.dump(SUM, open(os.path.join(ROOT, 'surnames-index.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
# у пошуку: прізвища ведуть на сторінку прізвища
S[:] = [x for x in S if x['t'] != 'surname']
for k, nm, a, w, v, pr in SUM:
    parts = []
    if a: parts.append('бл. 1800: %d %s' % (a, 'двір' if a == 1 else 'двори' if a < 5 else 'дворів'))
    if w: parts.append('1914–1917: %d' % w)
    if v: parts.append('1938: %d' % v)
    if pr: parts.append('преса: %d' % pr)
    if a + w + v + pr < 1: continue
    S.append({'t': 'surname', 'n': nm, 's': ' · '.join(parts), 'u': 'prizvyshcha.html?s=' + k, 'k': norm(' '.join(SR[k]['variants']))[:200]})
json.dump(S, open(os.path.join(ROOT, 'search-index.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('merged variants:', len(ALIAS), '| surnames:', len(SUM), '| multi-source:', sum(1 for x in SUM if sum(1 for y in x[2:] if y) >= 2), '| search items:', len(S))
