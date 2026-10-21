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
    press = [[d['id'], d['year'] or '', d['headline'], d['source']] for d in PRESS
             if mentions((d.get('headline') or '') + ' ' + (d.get('subheadline') or '') + ' ' + (d.get('translation') or '')[:8000], d.get('places'), p, k)]
    press.sort(key=lambda x: x[1] or 9999)
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
    add('press', d['headline'], '%s · %s' % (d['year'] or 'без дати', d['source']), 'presa.html?id=' + d['id'], ' '.join((d.get('places') or []) + (d.get('people') or [])))
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
        g['forms'].add(full.strip()); g['n'] += 1
        if d['year']: g['years'].add(d['year'])
for key, g in PPL.items():
    ys = sorted(g['years']); yr = '' if not ys else str(ys[0]) if len(ys) == 1 else '%d–%d' % (ys[0], ys[-1])
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
              ('Граф Плятер', 'Власник Дубровиці 1775–1832', 'plater.html'), ('Князь Радзивілл', 'Власник маєтку 1798', 'radzyvil.html'),
              ('Костел Іоанна Хрестителя · 3D-модель', 'Обертайте й наближайте пам\'ятку', 'kostel-3d.html'),
              ('Церква Різдва Богородиці · 3D-модель', 'Обертайте й наближайте пам\'ятку', 'cerkva-3d.html'),
              ('«Бібліотека» Плятерів у Воробині · 3D-модель', 'Павільйон, що не зберігся, — реконструкція за світлинами', 'worobin-3d.html'),
              ('Свято-Миколаївська церква · 3D-модель', 'Дерев\'яна церква 1872 року, модель за фото', 'mykolai-3d.html'),
              ('Воробин, листопад 1918 · напад на маєток Плятерів', 'Справа Луцького окружного суду № 67/22, 1922–1923', 'worobin-1918.html')]:
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
    b = SR.setdefault(k, {'k': k, 'forms': {}, 'inv': [], 'ww': [], 'vot': [], 'press': [], 'met': [], 'akt': []})
    b['forms'][disp] = b['forms'].get(disp, 0) + (10 if script == 'ua' else 1)
    return b
VILL = {r['mapName']: k for k, r in SELA.items()}
for k, p in PLACES.items(): VILL.setdefault(p['name'], k)
VILL.update({'Орв\'яниця': 'orvianytsia', 'Працуки': 'pratsiuky', 'Ясинець': 'yasenets', 'Заріччя (ст. Дубровиця)': 'dombrovytsia', 'Домбровиця': 'dombrovytsia'})
VKEY0 = {}
for _k, _p in PLACES.items():
    for _n in [_p['name']] + [a for a in _p['alt'] if a]: VKEY0.setdefault(skey(_n), _k)
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
                    VILL.get(w.get('place_ua') or '', 'dombrovytsia' if (w.get('place_ua') or '') in ('Домбровиця', 'Дубровиця') else ''), ln])
for v in VOT:
    ln = (v.get('surname') or '').strip()
    if not ln: continue
    k = skey(ln)
    if len(k) < 3: continue
    b = bucket(k, ln, 'pl')
    b['vot'].append([v.get('first', ''), v.get('born', ''), v.get('village', ''), VILL.get(v.get('village', ''), ''), v.get('addr', ''), v.get('prof', ''), ln])
# ── XVII століття: особи з актів пінських гродських книг і реєстру збитків 1665 р. ──
import html as _html
def _txt(x): return re.sub(r'\s+', ' ', _html.unescape(re.sub(r'<[^>]+>', ' ', x or ''))).strip()
AKT_N = 0
NOT_SURNAME = {'Андрян', 'Давид', 'Филипча', 'Радзивіллова', 'Остап', 'Данило', 'Васько', 'Яцько', 'Гаврило', 'Тимко', 'Овдишка', 'Гарник', 'Цешко', 'Лимха',
               'Шмойло', 'Фалько', 'Правосуд', 'Паламар', 'Рудник', 'Леховіки', 'Лаврів', 'Дрозд', 'Війтова', 'Війт', 'Гуриновича'}
def akt_add(sur, shown, orig, year, title, url, vname, vslug, role):
    global AKT_N
    sur = sur.strip(' ,.')
    if not sur or sur in NOT_SURNAME or len(sur) < 3 or not re.match(r'^[А-ЯІЇЄҐ]', sur): return
    k = skey(sur)
    if len(k) < 3: return
    b = bucket(k, re.sub(r'(с|ц)ька$', r'\1ький', sur), 'ua')
    b['akt'].append([shown, orig, year, title, url, vname, vslug, role[:140]]); AKT_N += 1
AKTY = J('akty-data.json')
for a in AKTY:
    yr = (a.get('sort') or '')[:4]; url = ('akty-yevrei.html' if a.get('group') == 'yevrei' else 'akty-ruina.html') + '#' + a['id']
    for nm, role in re.findall(r'<li><p><strong>(.*?)</strong>\s*(.*?)</p>', a.get('persons') or '', flags=re.S):
        nm = _txt(nm); role = _txt(role).lstrip('— ').strip()
        m = re.match(r'^(.*?)\s*\((.*)\)\s*$', nm); shown, orig = (m.group(1), m.group(2)) if m else (nm, '')
        shown = re.sub(r'«.*?»', '', shown).split(',')[0].strip()
        if ' і ' in shown or re.search(r'(ські|цькі|ові)$', shown.split(' ')[0]): continue      # родини й групи
        parts = [x.strip() for x in shown.split(' ') if x.strip() and x != '/']
        if not parts: continue
        sur = parts[0]
        alt = re.match(r'^(\S+)\s*/\s*(\S+)\s+(.*)$', shown)
        if alt: sur = alt.group(1); shown = alt.group(1) + ' ' + alt.group(3) + ' (' + alt.group(2) + ')'
        if len(parts) >= 2 and parts[0] in NOT_SURNAME: continue
        akt_add(sur, shown, orig.split(' / ')[-1] if orig else '', yr, a.get('title', ''), url, '', '', role)
RJ = open(os.path.join(ROOT, 'rejestr-1665.html'), encoding='utf-8').read()
RJV = {'дубровиця': 'Дубровиця', 'велюнь': 'Велюнь', 'біле': 'Біла', 'людинь': 'Людинь', 'берестя': 'Берестя', "орв'яниця": "Орв'яниця", 'стрільськ': 'Стрільськ',
       'карпилівка': 'Карпилівка', 'нивецьк': 'Нивецьк', 'залішани': 'Залішани', 'мочулища': 'Мочулище', 'позні': 'Позні', 'кунцівці': 'Кунцівці', 'шахи': 'Шахи', 'бровки': 'Бровки'}
RJ_SKIP = ('Вдова', 'Громада', 'Стрільці', 'Брат ', 'Микола з', 'Мельник ', 'Замок', 'Пан Борко', 'Лаворовичі', 'Тишківці', 'Павло та', 'Волониця', 'Давид Старий', 'Шевеля Різник', 'Дмитр Пухар', 'Лешко Мельник', 'Мисько (')
for vil, nm, orig, role in re.findall(r'<div class="rj-person-card" data-village="([^"]*)">\s*<div class="rj-person-name">(.*?)</div>\s*(?:<div class="rj-person-orig">(.*?)</div>)?\s*(?:<div class="rj-person-role">(.*?)</div>)?', RJ, flags=re.S):
    nm = _txt(nm); orig = _txt(orig); role = _txt(role)
    if nm.startswith(RJ_SKIP) or re.search(r'івна$', nm): continue
    vname = RJV.get(vil, ''); vslug = VILL.get(vname, '') or VKEY0.get(skey(vname), '') if vname else ''
    base = re.sub(r'\s*\(.*?\)', '', nm).replace('Пан ', '').replace('Священник ', '').strip()
    if ' та ' in base:                                   # «Селевонович та Гара Симович»
        for piece in base.split(' та '): akt_add(piece.split(' ')[-1], piece, orig, '1665', 'Реєстр збитків 1665 року', 'rejestr-1665.html#panel-people', vname, vslug, role)
        continue
    ws = base.split(' ')
    sur = ws[0] if nm.startswith('Курил ') else (ws[0] if len(ws) > 1 and ws[-1] in ('Старий',) else ws[-1])
    akt_add(sur, base, orig, '1665', 'Реєстр збитків 1665 року', 'rejestr-1665.html#panel-people', vname, vslug, role)
# ── справа Луцького окружного суду № 67/22 про напад на Воробин (1918, суд 1923) ──
SUD_T, SUD_U = 'Справа про напад на Воробин, 1922–1923', 'worobin-1918.html'
SUD1923 = [  # прізвище, як показати, як у документі, поселення, slug, роль, якір
 ('Москальчук', 'Іван Москальчук-Нашора', 'Jan Moskalczuk vel Naszora', 'Дубровиця', 'dombrovytsia', 'підсудний; 1923 — 12 р., в апеляції 8 р. тяжкої тюрми', 'pidsudni'),
 ('Нашора', 'Іван Москальчук-Нашора', 'Jan Moskalczuk vel Naszora', 'Дубровиця', 'dombrovytsia', 'підсудний; 1923 — 12 р., в апеляції 8 р. тяжкої тюрми', 'pidsudni'),
 ('Нашора', 'Анна Нашора', '', 'Дубровиця', 'dombrovytsia', 'донька засудженого Івана Нашори', 'potim'),
 ('Курчик', 'Гаврило Курчик («Заєць»)', 'Hawryło Kurczyk vel Zając', 'Селець', 'selets', 'підсудний; у вироку — Курач; 12 р., в апеляції 6 р. 8 міс.', 'pidsudni'),
 ('Заєць', 'Гаврило Курчик («Заєць»)', 'Hawryło Kurczyk vel Zając', 'Селець', 'selets', 'прізвисько підсудного; 12 р., в апеляції 6 р. 8 міс.', 'pidsudni'),
 ('Шеремета', 'Єремія Шеремета', 'Jeremiasz Szeremeta', 'Мочулище', 'mochulyshche', 'підсудний; затриманий 1921 у справі «Закордот»; 10 р., в апеляції 6 р. 8 міс.', 'pidsudni'),
 ('Перішко', 'Теодор (Федір) Перішко', 'Teodor Periszko / Piryszko', 'Дубровиця', 'dombrovytsia', 'підсудний, швець, 1898 р. н.; засуджений на 10 р., в апеляції виправданий', 'pidsudni'),
 ('Перішко', 'Борис Перішко', 'Borys Piryszko', 'Дубровиця', 'dombrovytsia', 'батько підсудного Теодора; підписувався «Борис Пиришко»', 'pidsudni'),
 ("Дем'янець", "Іван Дем'янець", 'Jan Demjaniec', 'Берестя', 'berestia', 'підсудний; засуджений на 10 р., в апеляції виправданий', 'pidsudni'),
 ("Дем'янець", "Марфа Дем'янець", 'Marfa Demjaniec', 'Берестя', 'berestia', 'мати підсудного Івана; попередила Ліпінського про напад', 'pidsudni'),
 ('Харківець', 'Онуфрій Харківець', 'Onufry Charkowiec', 'Колки', 'kolky', 'підсудний; засуджений на 10 р., в апеляції виправданий', 'pidsudni'),
 ('Харківець', 'Іван Харківець', 'Jan Charkowiec', 'Колки', 'kolky', 'батько підсудного Онуфрія; свідок', 'pidsudni'),
 ('Лясковець', 'Степан Лясковець', 'Stefan Laskowiec / Laskowicz', 'Дубровиця', 'dombrovytsia', 'підсудний; затриманий 1921 у справі «Закордот»; виправданий', 'pidsudni'),
 ('Будкевич', 'Степан Будкевич', 'Stefan Budkiewicz', "Орв'яниця", 'orvianytsia', 'підсудний; виправданий', 'pidsudni'),
 ('Плятер', 'Ігнацій Плятер', '', 'Воробин', 'vorobyn', 'власник маєтку; загинув у Воробині 22.XI.1918', 'zahybli'),
 ('Плятер', 'Антоній Плятер', '', 'Воробин', 'vorobyn', 'власник маєтку; загинув у Воробині 22.XI.1918', 'zahybli'),
 ('Пшезімєрський', 'Юліуш Пшезімєрський', 'Juljusz Przezimierski / Przedmierski', 'Воробин', 'vorobyn', 'повірений Плятерів; загинув 22.XI.1918', 'zahybli'),
 ('Томкевич', 'Станіслав Томкевич', '', 'Воробин', 'vorobyn', 'надлісничий; загинув 22.XI.1918', 'zahybli'),
 ("Вев'юровський", "Ян Вев'юровський", 'Jan Wiewiórowski', 'Воробин', 'vorobyn', 'лісовий контролер; загинув 22.XI.1918', 'zahybli'),
 ('Зелінський', 'Зелінський', 'Zieliński', 'Воробин', 'vorobyn', 'помічник надлісничого; загинув 22.XI.1918', 'zahybli'),
 ('Вахшлянський', 'Стефан Вахшлянський', 'Stefan Wachszlański', 'Воробин', 'vorobyn', 'касир; загинув 22.XI.1918', 'zahybli'),
 ('Гурський', 'Густав Гурський', 'Gustaw Górski', 'Воробин', 'vorobyn', 'лісовий касир; загинув 22.XI.1918', 'zahybli'),
 ('Ойжинський', 'Ойжинський', 'Ojrzyński', 'Воробин', 'vorobyn', 'бухгалтер; загинув 22.XI.1918', 'zahybli'),
 ('Неттер', 'Густав Неттер', 'Gustaw Netter', 'Воробин', 'vorobyn', 'бухгалтер; загинув 22.XI.1918 (у вироку — Меттер)', 'zahybli'),
 ('Ціхий', 'Леон Ціхий', 'Leon Cichy', 'Воробин', 'vorobyn', 'службовець маєтку; загинув 22.XI.1918', 'zahybli'),
 ('Росін', 'Росін', 'Rosin / Rozin', 'Воробин', 'vorobyn', 'ветеринарний лікар; помер від ран', 'zahybli'),
 ('Угринський', 'Угринський', 'Uhryński', 'Воробин', 'vorobyn', 'лісничий; загинув, захищаючи палац', 'zahybli'),
 ('Кальтенберг', 'Кальтенберг', 'Kaltenberg', 'Воробин', 'vorobyn', 'командир варти маєтку з Рівного', 'zahybli'),
 ('Ліпінський', 'Віктор Ліпінський', 'Wiktor Lipiński', 'Воробин', 'vorobyn', 'стражник маєтку, поранений; головний свідок', 'holosy'),
 ('Піскунов', 'Піскунов', 'Piskunow', 'Воробин', 'vorobyn', 'стражник маєтку, поранений', 'zahybli'),
 ('Лукашевич', 'Лукашевич', '', 'Воробин', 'vorobyn', 'стражник маєтку, поранений (за Калінським)', 'zahybli'),
 ("Вев'юровський", "Юзеф Вев'юровський", 'Józef Wiewiórowski', 'Дубровиця', 'dombrovytsia', 'свідок обвинувачення', 'zahybli'),
 ('Мацкевич', 'Філіп Мацкевич', 'Filip Mackiewicz', 'Дубровиця', 'dombrovytsia', 'начальник міліції в Дубровиці 1918; свідок', 'khronika'),
 ('Приходченко', 'Пилип Приходченко', 'Filip Prichodczenko', 'Дубровиця', 'dombrovytsia', 'заступник начальника міліції; мав список учасників нападу', 'povstannia'),
 ('Мольський', 'Зигмунт Мольський, син Анджея', 'Zygmunt Molski', 'Мочулище', 'mochulyshche', 'управитель маєтку; свідок обвинувачення', 'holosy'),
 ('Мольський', 'Зигмунт Мольський, син Зигмунта', 'Zygmunt Molski', 'Дубровиця', 'dombrovytsia', 'свідок обвинувачення', 'pidsudni'),
 ('Паленко', 'Микола Паленко', 'Mikołaj Palenko', 'Дубровиця', 'dombrovytsia', 'фельдшер дубровицької лікарні; свідок', 'khronika'),
 ('Калінський', 'Андрій Калінський', 'Andrzej Kaliński', 'Дубровиця', 'dombrovytsia', 'фельдшер дубровицької лікарні; свідок', 'khronika'),
 ('Радванський', 'Мечислав Радванський', 'Mieczysław Radwański', 'Дубровиця', 'dombrovytsia', 'свідок обвинувачення', 'pidsudni'),
 ('Свириденко', 'Олександр Свириденко', 'Aleksander Swirydenko', 'Воробин', 'vorobyn', 'вартовий і машиніст у Воробині; свідок обвинувачення', 'khronika'),
 ('Сибіковський', 'Аркадій Сибіковський', 'Arkadiusz Sibikowski', 'Воробин', 'vorobyn', 'жив із матір\'ю у Воробині; свідок обвинувачення', 'holosy'),
 ('Литвинчук', 'Михайло Литвинчук', 'Michał Litwińczuk', 'Дубровиця', 'dombrovytsia', 'свідок обвинувачення', 'khronika'),
 ('Щеньовський', 'Леонард Щеньовський', 'Leonard Szczeniowski', 'Дубровиця', 'dombrovytsia', 'комендант поліції в Дубровиці; затримав Шеремету 1921', 'povstannia'),
 ('Латта', 'Антоній Латта', 'Antoni Latta', 'Дубровиця', 'dombrovytsia', 'свідок обвинувачення', 'pidsudni'),
 ('Стасевич', 'Броніслава Стасевич', 'Bronisława Stasiewicz', '', '', 'свідок; переказувала чутки про Перішка', 'pidsudni'),
 ('Гнатовський', 'Хома Гнатовський', 'Tomasz Hnatowski', 'Мочулище', 'mochulyshche', 'свідок', 'khronika'),
 ('Димковський', 'Ян Димковський', 'Jan Dymkowski', 'Дубровиця', 'dombrovytsia', 'лісничий Плятерів, згодом війт ґміни; свідок', 'pidsudni'),
 ('Кустов', 'Петро Кустов', 'Piotr Kustow', 'Воробин', 'vorobyn', 'урятував Сибіковського від розстрілу', 'khronika'),
 ('Конончук', 'Олександр Конончук', 'Aleksander Konończuk', 'Дубровиця', 'dombrovytsia', 'поставив на голосування долю полонених; за Мацкевичем — змовник 1918', 'povstannia'),
 ('Вальковець', 'Ігнацій Вальковець', 'Ignacy Walkowiec', 'Мочулище', 'mochulyshche', 'свідок захисту Шеремети', 'pidsudni'),
 ('Перішко', 'Дмитро Перішко', 'Dymitr Peryszko', 'Мочулище', 'mochulyshche', 'свідок захисту Шеремети', 'pidsudni'),
 ('Деркач', 'Роман Деркач', 'Roman Derkacz', 'Мочулище', 'mochulyshche', 'свідок захисту Шеремети', 'pidsudni'),
 ('Пляшко', 'Пляшко', 'Płaszko / Płasko', '', '', 'голова ґміни Дубровиця 1918; свідок захисту Будкевича', 'holosy'),
 ('Рабешко', 'Григорій Рабешко', '', 'Дубровиця', 'dombrovytsia', 'заступник голови ґміни 1918; свідок захисту Будкевича', 'pidsudni'),
 ('Красько', 'Роман Красько', 'Roman Kraśko', "Орв'яниця", 'orvianytsia', 'солтис Орв\'яниці; свідок', 'pidsudni'),
 ('Кузьмич', 'Трохим Кузьмич', 'Trofim Kuźmicz', "Орв'яниця", 'orvianytsia', 'мельник; свідок захисту Будкевича', 'pidsudni'),
 ('Будкевич', 'Максим Будкевич', 'Maksym Budkiewicz', "Орв'яниця", 'orvianytsia', 'брат підсудного; свідок захисту', 'pidsudni'),
 ('Будкевич', 'Петро Будкевич', '', "Орв'яниця", 'orvianytsia', 'десятник; свідок майнового опису', 'pidsudni'),
 ('Деркач', 'Іван Деркач', 'Jan Derkacz', "Орв'яниця", 'orvianytsia', 'свідок захисту Будкевича', 'pidsudni'),
 ('Гафко', 'Павло Гафко', 'Paweł Hafko', '', '', 'в\'язень, свідок захисту', 'pidsudni'),
 ('Цибульський', 'Никон Цибульський', 'Nikon Cybulski', 'Дубровиця', 'dombrovytsia', 'підмайстер Перішка; свідок захисту', 'pidsudni'),
 ('Мосейчук', 'Єремія Мосейчук', 'Jeremiej Mosiejczuk', 'Дубровиця', 'dombrovytsia', 'шваґер Перішка; свідок захисту', 'pidsudni'),
 ('Юхно', 'Пилип Юхно', 'Filip Juchno', 'Дубровиця', 'dombrovytsia', 'двоюрідний брат Перішка; свідок захисту', 'pidsudni'),
 ('Бернацький', 'Стефан Бернацький', 'Stefan Biernacki', 'Дубровиця', 'dombrovytsia', 'свідок захисту Перішка', 'pidsudni'),
 ('Клюйко', 'Юхим Клюйко', 'Jefim Kłujko', 'Берестя', 'berestia', "свідок захисту Дем'янця", 'pidsudni'),
 ('Подолянко', 'Іван Подолянко', 'Jan Podolanko', 'Берестя', 'berestia', "свідок захисту Дем'янця", 'pidsudni'),
 ('Буковець', 'Григорій Буковець', 'Grzegorz Bukowiec', 'Берестя', 'berestia', "свідок захисту Дем'янця", 'pidsudni'),
 ('Олехнович', 'Христофор Олехнович', 'Chrystofor Olechniejowicz / Aleksiejewicz', 'Колки', 'kolky', 'свідок захисту Харківця', 'pidsudni'),
 ('Яцута', 'Каленик Яцута', 'Kalenik Jacuta', 'Колки', 'kolky', 'свідок захисту Харківця', 'pidsudni'),
 ('Шматюк', 'Микола Шматюк', 'Mikołaj Szmatuk / Zamatiuk', 'Колки', 'kolky', 'свідок захисту Харківця', 'pidsudni'),
 ('Петрушко', 'Григорій Петрушко', 'Grzegorz Pietruszka', 'Селець', 'selets', 'свідок захисту Курчика', 'pidsudni'),
 ('Сидоришин', 'Микола Сидоришин', 'Mikołaj Sidoryszyn', 'Селець', 'selets', 'свідок захисту Курчика', 'pidsudni'),
 ('Петрушко', 'Яків Петрушко', 'Jakób Pietruszka', 'Селець', 'selets', 'свідок захисту Курчика', 'pidsudni'),
 ('Євчук', 'Юзеф Євчук', 'Józef Jewczuk', 'Дубровиця', 'dombrovytsia', 'свідок захисту Нашори', 'pidsudni'),
 ('Салівонов', 'Тит Салівонов', 'Tit Saliwonow', 'Дубровиця', 'dombrovytsia', 'свідок захисту Нашори', 'pidsudni'),
 ('Конончук', 'Самуїл Конончук', 'Samuił Konończuk', 'Дубровиця', 'dombrovytsia', 'свідок захисту Нашори; не з\'явився через хворобу', 'pidsudni'),
 ('Ілюшко', 'Філіп Ілюшко', 'Filip Iluszko', '', '', 'в\'язень, свідок захисту', 'pidsudni'),
 ('Маньковський', 'Абрам Маньковський', 'Abram Mańkowski', 'Дубровиця', 'dombrovytsia', 'купець; 1918 пограбований і вивезений до Коростеня', 'potim'),
 ('Зейгель', 'Манус Зейгель', 'Manus Zejgiel', 'Дубровиця', 'dombrovytsia', 'торговець; переховував Свириденка після нападу', 'potim'),
 ('Шимонський', 'Станіслав Шимонський', 'Stanisław Szymoński', 'Воробин', 'vorobyn', 'робітник тартака у Воробині; свідок 1923', 'potim'),
 ('Лось', 'Пилип Лось', 'Filip Łoś', 'Дубровиця', 'dombrovytsia', 'повернувся 1921 з Шереметою й Лясковцем («Козаки»)', 'liudy'),
 ('Лось', 'Іван Лось', '', 'Дубровиця', 'dombrovytsia', 'табір на болоті «Козаки», 1921', 'liudy'),
 ('Дубинець', 'Роман Дубинець', 'Roman Dubieniec', 'Дубровиця', 'dombrovytsia', 'повернувся 1921 з Шереметою й Лясковцем («Козаки»)', 'liudy'),
 ('Конончук', 'Іван Конончук', 'Iwan Konończuk', 'Дубровиця', 'dombrovytsia', 'повернувся 1921 з Шереметою й Лясковцем («Козаки»)', 'liudy'),
 ('Раськевич', 'Омелян Раськевич', 'Emiljan Raskiewicz', 'Бережки', 'berezhky', 'за поліцейським рапортом 1924 — учасник нападу', 'povstannia'),
 ('Красько', 'Леон Красько', 'Leon Kraśko', '', '', 'у справі є згадки про його участь у нападі', 'povstannia'),
 ('Рабешко', 'Федір Рабешко', 'Fiodor Rabeszko', 'Дубровиця', 'dombrovytsia', 'обвинувачений, розшукуваний', 'pidsudni'),
 ('Правник', 'Олександр Правник', '', "Орв'яниця", 'orvianytsia', 'обвинувачений, розшукуваний', 'pidsudni'),
 ('Будкевич', 'Сергій Будкевич', '', "Орв'яниця", 'orvianytsia', 'обвинувачений, розшукуваний', 'pidsudni'),
 ('Будкевич', 'Федір Будкевич', '', "Орв'яниця", 'orvianytsia', 'обвинувачений, розшукуваний', 'pidsudni'),
 ("Дем'янець", "Матвій Дем'янець", '', '', '', 'обвинувачений, розшукуваний', 'pidsudni'),
 ('Конончук', 'Григорій Конончук', '', '', '', 'обвинувачений, розшукуваний', 'pidsudni'),
 ('Конончук', 'Василь Конончук', '', '', '', 'обвинувачений, розшукуваний', 'pidsudni'),
 ('Конончук', 'Михайло Конончук', '', '', '', 'обвинувачений, розшукуваний', 'pidsudni'),
 ('Велюнець', 'Марко Велюнець', '', '', '', 'обвинувачений, розшукуваний', 'pidsudni'),
 ('Мороз', 'Михайло Мороз', '', 'Мочулище', 'mochulyshche', 'візник Плятерів; обвинувачений, розшукуваний', 'pidsudni'),
 ('Садовський', 'Олександр Садовський', 'Aleksander Sadowski', 'Дубровиця', 'dombrovytsia', 'за Шереметою — організатор загону; втік до Радянської Росії', 'pidsudni'),
 ('Лясковець', 'Микола Лясковець', 'Mikołaj Laskowiec', 'Дубровиця', 'dombrovytsia', 'обвинувачений, розшукуваний; двоюрідний брат Степана', 'pidsudni'),
 ('Петрушко', 'Ісаак Петрушко', 'Isaak Pietruszka', '', '', 'вів загін у Мочулищі; помер у в\'язниці 21.XII.1921', 'pidsudni'),
 ('Гончар', "Лук'ян Гончар", '', '', '', 'обвинувачений; помер під час слідства', 'pidsudni'),
 ('Мозоль', 'Кирило Мозоль', 'Kirył Mozol vel Gerasimczuk vel Bezdietko', "Орв'яниця", 'orvianytsia', 'за слідством — ватажок загону; помер під час слідства', 'pidsudni'),
]
for sur, shown, orig, vname, vslug, role, anc in SUD1923:
    akt_add(sur, shown, orig, '1918', SUD_T, SUD_U + '#' + anc, vname, vslug, role)
# метричні книги: розшифровки додаються у metrics-records.csv (див. шаблон metrics-records-template.csv)
import csv
MBOOKS = {str(b['id']): b for b in J('metrychni-knyhy.json')}
VKEY = {}
for _k, _p in PLACES.items():
    for _n in [_p['name']] + [a for a in _p['alt'] if a]:
        VKEY.setdefault(skey(_n), _k)
for _n in ('Домбровица', 'Домбровиця', 'Dąbrowica', 'Dombrowica', 'Дубровица'): VKEY[skey(_n)] = 'dombrovytsia'
MET_N = 0
mpath = os.path.join(ROOT, 'metrics-records.csv')
if os.path.exists(mpath):
    for row in csv.DictReader(open(mpath, encoding='utf-8-sig')):
        ln = (row.get('surname') or '').strip()
        if not ln or ln.startswith('#'): continue
        k = skey(ln)
        if len(k) < 3: continue
        b = bucket(k, ln, 'ua' if re.search(r'[А-Яа-яІіЇїЄєҐґ]', ln) else 'pl')
        bk = MBOOKS.get((row.get('book_id') or '').strip(), {})
        vraw = (row.get('village') or '').strip(); vslug = VILL.get(vraw, '') or VKEY.get(skey(vraw), '')
        if vslug: row['village'] = PLACES[vslug]['name'] if vslug in PLACES else vraw
        b['met'].append([(row.get('year') or '').strip(), (row.get('event') or '').strip(), (row.get('first') or '').strip(), (row.get('role') or '').strip(),
                         (row.get('village') or '').strip(), vslug, (row.get('notes') or '').strip(),
                         (bk.get('church', '') + (' · ' + bk.get('archive', '') if bk.get('archive') else '')).strip(' ·'), (row.get('page') or '').strip(), (row.get('url') or '').strip()])
        MET_N += 1
for d in PRESS:
    for full in d.get('people') or []:
        s = surname(full)
        k = skey(s)
        if k in SR and len(k) >= 3:
            if d['id'] not in [x[0] for x in SR[k]['press']]:
                SR[k]['press'].append([d['id'], d['year'] or '', d['headline'], full.strip()])
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
def size(b): return len(b['inv']) + len(b['ww']) + len(b['vot']) + len(b['press']) + len(b['met']) + len(b['akt'])
keys = sorted(SR, key=lambda k: -size(SR[k]))
ALIAS = {}
by3 = {}
for k in keys: by3.setdefault(k[:3], []).append(k)
for k in keys:
    if k in ALIAS or len(k) < 6: continue
    for o in by3.get(k[:3], []):
        if o == k or o in ALIAS or len(o) < 6 or o[-2:] != k[-2:]: continue
        so = [f for f in ('akt', 'inv', 'met', 'ww', 'vot') if SR[o][f]]; sk = [f for f in ('akt', 'inv', 'met', 'ww', 'vot') if SR[k][f]]
        cross = len(so) == 1 and so[0] not in sk          # варіант трапляється лише в одному джерелі, і не в тому, де основне написання
        ins_i = len(k) != len(o) and len(set(k) ^ set(o)) <= 1 and ('i' in (set(k) ^ set(o)) or 'e' in (set(k) ^ set(o)))
        ao = len(k) == len(o) and any(i < 4 and {x, y} == {'a', 'o'} for i, (x, y) in enumerate(zip(k, o)) if x != y)
        iko = (k.endswith('ko') and o == k[:-2] + 'iko') or (o.endswith('ko') and k == o[:-2] + 'iko')   # Приходько / Приходико
        if iko or (lev1(k, o) and diff_soft(k, o) and cross and not ao and (len(k) == len(o) or ins_i) and size(SR[o]) <= size(SR[k])):
            t = SR[k]; f = SR.pop(o)
            for fld in ('inv', 'ww', 'vot', 'press', 'met', 'akt'): t[fld] += f[fld]
            for fm, c in f['forms'].items(): t['forms'][fm] = t['forms'].get(fm, 0) + c
            ALIAS[o] = k
by3 = None
# ── ручне зведення написань (surnames-fix.json): помилки писарів і переписувачів ──
FIX = {a: b for a, b in J('surnames-fix.json').items() if a != '_'}
def _res(k, seen=()):
    while k in FIX and k not in seen: seen = seen + (k,); k = FIX[k]
    return ALIAS.get(k, k)
for o in list(FIX):
    k = _res(o)
    if o == k or o not in SR or k not in SR: continue
    t = SR[k]; f = SR.pop(o)
    for fld in ('inv', 'ww', 'vot', 'press', 'met', 'akt'): t[fld] += f[fld]
    for fm, c in f['forms'].items(): t['forms'][fm] = t['forms'].get(fm, 0) + c
    ALIAS[o] = k
for a in list(ALIAS):
    ALIAS[a] = _res(ALIAS[a])
def disp(b):
    cyr = [f for f in b['forms'] if re.search(r'[А-Яа-яІіЇїЄєҐґ]', f)]
    own = [f for f in cyr if skey(f) == b['k']]                     # основне написання — те, що відповідає ключу родини
    pool = own or cyr or list(b['forms'])
    return sorted(pool, key=lambda f: (-b['forms'][f], len(f)))[0]
SUM, CH = [], {}
for k, b in SR.items():
    b['name'] = disp(b); b['variants'] = sorted(b['forms'], key=lambda f: -b['forms'][f])
    del b['forms']
    SUM.append([k, b['name'], len(b['inv']), len(b['ww']), len(b['vot']), len(b['press']), len(b['met']), len(b['akt'])])
    CH.setdefault(k[0], {})[k] = b
for c, part in CH.items():
    json.dump(part, open(os.path.join(ROOT, 'surnames-' + c + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
SUM.sort(key=lambda x: x[1].lower())
json.dump(ALIAS, open(os.path.join(ROOT, 'surnames-alias.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
json.dump(SUM, open(os.path.join(ROOT, 'surnames-index.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
# у пошуку: прізвища ведуть на сторінку прізвища
S[:] = [x for x in S if x['t'] != 'surname']
for k, nm, a, w, v, pr, mt, ak in SUM:
    parts = []
    a20 = sum(1 for x in SR[k]['akt'] if str(x[2]).isdigit() and int(x[2]) >= 1800); ak -= a20
    if ak: parts.append('XVII ст.: %d' % ak)
    if a: parts.append('бл. 1800: %d %s' % (a, 'двір' if a == 1 else 'двори' if a < 5 else 'дворів'))
    if mt: parts.append('XIX ст.: %d' % mt)
    if w: parts.append('1914–1917: %d' % w)
    if a20: parts.append('1918: %d' % a20)
    if v: parts.append('1938: %d' % v)
    if pr: parts.append('преса: %d' % pr)
    if a + w + v + pr + mt + ak + a20 < 1: continue
    S.append({'t': 'surname', 'n': nm, 's': ' · '.join(parts), 'u': 'prizvyshcha.html?s=' + k, 'k': norm(' '.join(SR[k]['variants']))[:200], 'sk': k})
json.dump(S, open(os.path.join(ROOT, 'search-index.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('akt persons:', AKT_N, '| metric records:', MET_N, '| merged variants:', len(ALIAS), '| surnames:', len(SUM), '| multi-source:', sum(1 for x in SUM if sum(1 for y in x[2:] if y) >= 2), '| search items:', len(S))

# ═════════ ПОВНОТЕКСТОВИЙ ПОКАЖЧИК (search-text.json): слова з текстів статей, актів, реєстрів і сторінок ═════════
# Для кожного тексту — набір основ слів (перші 8 літер), щоб пошук знаходив «бурштин» у «бурштину», «бурштиновий».
def words_of(t):
    t = norm(_txt(t))
    return {w[:8] for w in re.findall(r'[a-zа-яіё0-9]+', t.replace('ы', 'и')) if len(w) >= 3 and not w.isdigit() or (w.isdigit() and len(w) == 4)}
STOP = set(norm(x)[:8] for x in 'що як від для або але при про під над між без цей цього цієї того тому також який яка яке які його її їх вони воно він вона було були буде бути має мали році року роки років через після перед після дуже тільки ще вже так все всі всіх '.split())
FT = []
def ft(title, sub, url, kind, *texts):
    ws = set()
    for x in texts: ws |= words_of(x)
    ws -= STOP
    if ws: FT.append([title, sub, url, kind, ' '.join(sorted(ws))])
for d in PRESS:
    ft(d['headline'], '%s · %s' % (d['year'] or 'без дати', d['source']), 'presa.html?id=' + d['id'], 'press',
       d.get('headline'), d.get('subheadline'), d.get('translation'), d.get('historicalNote'), ' '.join(d.get('tags') or []), ' '.join(d.get('themes') or []))
for a in AKTY:
    url = ('akty-yevrei.html' if a.get('group') == 'yevrei' else 'akty-ruina.html') + '#' + a['id']
    ft(a.get('title', ''), (a.get('date') or '') + ' · акти пінських гродських книг', url, 'doc', a.get('title'), a.get('summary'), a.get('translation'), a.get('persons'), a.get('placesIdx'), a.get('subjects'))
PAGES = [('rejestr-1665.html', 'Реєстр збитків 1665 року', '1665 · Пінський гродський суд'), ('zhaloba-1650.html', 'Жалоба про спустошення маєтку 1650', 'реляція, маніфестація й атестація 1650 р.'),
         ('sumariusz-1642.html', 'Сумаріуш маєтку Дубровиця 1642', 'доходи маєтку'), ('inventar-1780.html', 'Інвентар маєтку графа Плятера', 'бл. 1780–1820'),
         ('history.html', 'Історія Дубровиці', 'розділ сайту'), ('plater.html', 'Граф Юзеф Плятер', 'постать'), ('radzyvil.html', 'Князь Домінік Радзивілл', 'постать'),
         ('architecture.html', "Пам'ятки Дубровиці", 'розділ сайту'), ('jewish-history.html', 'Єврейська спадщина Дубровиці', 'розділ сайту'),
         ('atlas-1798.html', 'Атлас Волинської губернії 1798', 'розділ сайту'), ('atlas-1798-analityka.html', 'Аналітика атласу 1798', 'розділ сайту'),
         ('metrychni-knyhy.html', 'Метричні книги', 'каталог'), ('worobin-3d.html', '«Бібліотека» Плятерів у Воробині', '3D-реконструкція'), ('worobin-1918.html', 'Воробин, листопад 1918', 'справа про напад на маєток Плятерів'), ('kostel-3d.html', 'Костел Іоанна Хрестителя', '3D-модель')]
for f, title, sub in PAGES:
    pth = os.path.join(ROOT, f)
    if not os.path.exists(pth): continue
    h = open(pth, encoding='utf-8').read()
    h = re.sub(r'<script.*?</script>|<style.*?</style>|<header.*?</header>|<footer.*?</footer>|<nav.*?</nav>', ' ', h, flags=re.S)
    ft(title, sub, f, 'page', h)
json.dump(FT, open(os.path.join(ROOT, 'search-text.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('full-text docs:', len(FT), '| bytes:', os.path.getsize(os.path.join(ROOT, 'search-text.json')))
# архівні справи — окремими пунктами в пошуку (скарги, реляції, маніфестації, присяги)
for a in AKTY:
    url = ('akty-yevrei.html' if a.get('group') == 'yevrei' else 'akty-ruina.html') + '#' + a['id']
    S.append({'t': 'doc', 'n': a.get('title', ''), 's': (a.get('date') or '') + ' · акти пінських гродських книг', 'u': url,
              'k': norm(_txt(a.get('summary')) + ' ' + ' '.join(a.get('places') or []))[:300]})
for n, s2, u, k in [('Реляція возного 1650 року', '5–13 квітня 1650 · спустошені села маєтку', 'zhaloba-1650.html', 'реляція возний сахновський пусті доми села'),
                    ('Маніфестація 1650 року', '22 вересня 1650 · скарга про татар і голод', 'zhaloba-1650.html', 'маніфестація скарга татари голод березецький'),
                    ('Атестація 1650 року: перепис димів', '14 квітня 1650 · присяга війтів', 'zhaloba-1650.html', 'атестація перепис дими присяга війти касіушич ранонович лукянович'),
                    ('Справа про напад на маєток Плятерів у Воробині', '1918 · Луцький окружний суд, 1922–1923', 'worobin-1918.html', 'воробин плятери напад розгром маєтку повстання 1918 суд вирок апеляція перішко нашора шеремета дем\'янець харківець курчик заєць лясковець будкевич конончук садовський кальтенберг')]:
    S.append({'t': 'doc', 'n': n, 's': s2, 'u': u, 'k': k})
json.dump(S, open(os.path.join(ROOT, 'search-index.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
