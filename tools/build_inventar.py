#!/usr/bin/env python3
"""Збирає inventar-plater-data.js з робочого джерела inventar-plater-src.txt.

Запуск із кореня репозиторію:  python3 tools/build_inventar.py

Формат джерела (inventar-plater-src.txt):
  # коментар
  @place slug | Назва | Назва в документі | kind | Заголовок      — нове поселення (необов'язково для першого)
  @set ключ = <JSON>                                            — будь-яке інше поле поселення (опис, зображення, підсумки)
  @street id | zone | Назва | Назва в оригіналі (або —)
  <рядок опису вулиці>
  @side Назва ряду | звідки починається опис
  ! Текст орієнтира | вид                                       — будівля чи ділянка без мешканців
  Ім'я Прізвище || родина || ключі                              — двір
    родина:  «син Якуб; дочка Параска; дружина*; ? Григорій» (через «;»)
             «дружина*» — дружина, ім'я не вписане (чия — ключ wife=);
             «дружина» — теж без імені; «? Ім'я» — спорідненість не вказана
    ключі:   cat=j|g|p|t|b (євреї / християни ґрунтові / плацові / тяглі / бояри), no=номер в інвентарі,
             prof=заняття, orig=написання в оригіналі, note=примітка,
             widow=1, disp=як показувати ім'я, sur=прізвище, wife=чия дружина
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'inventar-plater-src.txt')
OUT = os.path.join(ROOT, 'inventar-plater-data.js')

# Родичі з іншої родини: прізвище господаря їм не дописуємо
NO_SURNAME = {'зять', 'пасерб', 'пасинок', 'швагер', 'вітчим', 'сестринець'}
FEMALE = {'дочка', 'сестра', 'мати', 'дружина', 'синовиця'}


def fem(sur):
    """Жіноча форма прізвища: Гладкий → Гладка, Несторов → Несторова."""
    if re.search(r'ський$|цький$', sur):
        return sur[:-2] + 'а'
    if sur.endswith('ий'):
        return sur[:-2] + 'а'
    if re.search(r'(ов|ев|єв|ін|їн)$', sur) or re.search(r'(?<!ан)ин$', sur):
        return sur + 'а'
    return sur


def opts(s):
    d = {}
    for part in s.split(';'):
        part = part.strip()
        if not part:
            continue
        k, _, v = part.partition('=')
        d[k.strip()] = v.strip()
    return d


def member(tok, sur, o):
    tok = tok.strip()
    if tok.startswith('?'):
        return {'r': '', 'n': tok[1:].strip(), 'unk': 1}
    rel, _, name = tok.partition(' ')
    star = tok.endswith('*')
    if rel.rstrip('*') == 'дружина':
        m = {'r': 'дружина'}
        name = name.rstrip('*').strip()
        if name:                      # «дружина Лукаша*»
            m['of'] = name
        elif star and o.get('wife'):
            m['of'] = o['wife']
        m['u'] = 1
        return m
    name = name.strip()
    if not name:
        return {'r': rel, 'u': 1}                    # родич без імені
    extra = ''
    mm = re.match(r'^(\S+)\s*(\(.*\))$', name)
    if mm:
        name, extra = mm.group(1), ' ' + mm.group(2)
    elif ' ' in name:
        return {'r': rel, 'n': name}                 # повне ім'я вже вказане
    if sur and rel not in NO_SURNAME:
        s = fem(sur) if rel in FEMALE else sur
        return {'r': rel, 'n': name + ' ' + s + extra}
    return {'r': rel, 'n': name + extra}


def build(text):
    places, cur, st, side = {}, None, None, None
    hid = 0
    lines = text.split('\n')
    i = 0
    while i < len(lines):
        raw = lines[i]
        line = raw.strip()
        i += 1
        if not line or line.startswith('#'):
            continue
        if line.startswith('@place'):
            f = [x.strip() for x in line[6:].split('|')]
            cur = places.setdefault(f[0], {'name': f[1], 'docName': f[2], 'kind': f[3], 'title': f[4], 'streets': []})
            hid = 0
            continue
        if line.startswith('@set'):
            k, _, v = line[4:].partition('=')
            cur[k.strip()] = json.loads(v.strip())
            continue
        if cur is None:
            cur = places.setdefault('dombrovytsia', {'streets': []})
        if line.startswith('@street'):
            f = [x.strip() for x in line[7:].split('|')]
            desc = lines[i].strip(); i += 1
            st = {'id': f[0], 'zone': f[1], 'name': f[2], 'orig': '' if f[3] == '—' else f[3], 'desc': desc, 'sides': []}
            cur['streets'].append(st)
            continue
        if line.startswith('@side'):
            f = [x.strip() for x in line[5:].split('|')]
            side = {'label': f[0], 'from': f[1] if len(f) > 1 else '', 'items': []}
            st['sides'].append(side)
            continue
        if line.startswith('!'):
            t, _, k = line[1:].rpartition('|')
            side['items'].append({'lm': 1, 'k': k.strip(), 't': t.strip()})
            continue
        parts = [x.strip() for x in line.split('||')]
        name = parts[0]
        fam = parts[1] if len(parts) > 1 else ''
        o = opts(parts[2]) if len(parts) > 2 else {}
        hid += 1
        it = {'id': hid}
        if o.get('cat'):
            it['c'] = o['cat']
        if o.get('no'):
            it['no'] = int(o['no'])
        it['n'] = o.get('disp') or name
        if o.get('widow'):
            it['w'] = 1
        if o.get('sur'):
            sur = o['sur']
        elif not o.get('widow') and ' ' in name:
            sur = name.split(' ', 1)[1]
        else:
            sur = ''
        if sur and not (o.get('widow') and not o.get('sur')):
            it['s'] = sur
        if o.get('prof'):
            it['p'] = o['prof']
        if o.get('orig'):
            it['o'] = o['orig']
        if o.get('q'):
            it['q'] = o['q']
        if o.get('note'):
            it['t'] = o['note']
        if fam:
            it['m'] = [member(t, sur, o) for t in fam.split(';') if t.strip()]
        side['items'].append(it)
    return places


def main():
    text = open(SRC, encoding='utf-8').read()
    places = build(text)
    old = open(OUT, encoding='utf-8').read()
    head = old[:old.index('window.INVENTAR_PLATER')]
    prev = json.loads(old[old.index('{', old.index('window.INVENTAR_PLATER')):old.rindex('}') + 1])
    # метадані (зони, підсумкова таблиця, джерело) беремо з поточного файлу
    for slug, p in places.items():
        base = prev.get(slug, {})
        merged = {k: v for k, v in base.items() if k != 'streets'}
        merged.update({k: v for k, v in p.items() if k != 'streets'})
        merged['streets'] = p['streets']
        places[slug] = merged
    js = head + 'window.INVENTAR_PLATER = ' + json.dumps(places, ensure_ascii=False, separators=(',', ':')) + ';\n'
    if '--check' in sys.argv:
        print('same' if js == old else 'DIFFERENT')
        return
    open(OUT, 'w', encoding='utf-8').write(js)
    n = sum(1 for p in places.values() for s in p['streets'] for sd in s['sides'] for it in sd['items'] if not it.get('lm'))
    print('ok:', n, 'дворів')


if __name__ == '__main__':
    main()
