#!/usr/bin/env python3
"""Перетворює експорт результатів пошуку FamilySearch (XLSX / XLS / CSV / TSV)
у metrics-records.csv для сторінок прізвищ.

Як користуватися:
  1. На FamilySearch: Пошук → Записи, оберіть колекцію й місце, Пошук.
     Над результатами: Налаштування (Preferences) → Експорт результатів → XLSX → Експортувати.
     Повторіть для кожної сторінки результатів (до 100 записів на сторінку).
  2. Покладіть усі завантажені файли в теку fs-export/ поруч із цим скриптом.
  3. Запустіть:  python3 fs_import.py --book 3 --event сповідь
     (--book — номер книги з каталогу metrychni-knyhy.json, --event — тип запису)
  4. Скрипт допише нові рядки в metrics-records.csv (дублікати пропускає),
     далі запустіть:  python3 build_index.py
"""
import argparse, csv, glob, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'metrics-records.csv')
FIELDS = ['book_id', 'year', 'event', 'surname', 'first', 'role', 'village', 'page', 'notes', 'url']

# Можливі назви колонок в експорті FamilySearch (англійською та українською)
COLS = {
    'full':    ['full name', 'name', 'повне ім\'я', 'ім\'я', 'имя', 'primary name'],
    'given':   ['given name', 'given names', 'ім\'я (імена)', 'імена', 'first name'],
    'surname': ['surname', 'last name', 'прізвище', 'фамилия'],
    'role':    ['relationship to head', 'relationship', 'role', 'role in record', 'роль', 'стосунок до голови', 'відношення до голови'],
    'date':    ['event date', 'date', 'дата події', 'дата', 'residence date', 'event year'],
    'place':   ['event place', 'place', 'місце події', 'місце', 'residence place', 'event place (original)'],
    'age':     ['age', 'вік', 'event age'],
    'sex':     ['sex', 'gender', 'стать'],
    'father':  ['father\'s name', 'father', 'батько', 'ім\'я батька'],
    'mother':  ['mother\'s name', 'mother', 'мати', 'ім\'я матері'],
    'spouse':  ['spouse\'s name', 'spouse', 'чоловік/дружина', 'дружина', 'чоловік'],
    'image':   ['image number', 'image', 'номер зображення', 'зображення', 'page'],
    'url':     ['ark id', 'ark', 'url', 'record url', 'link', 'посилання', 'ідентифікатор ark']
}

ROLE = {'head': 'голова двору', 'wife': 'дружина', 'husband': 'чоловік', 'son': 'син', 'daughter': 'дочка', 'mother': 'мати', 'father': 'батько',
        'brother': 'брат', 'sister': 'сестра', 'grandson': 'онук', 'granddaughter': 'онука', 'son-in-law': 'зять', 'daughter-in-law': 'невістка',
        'widow': 'вдова', 'widower': 'вдівець', 'principal': 'основна особа', 'child': 'дитина', 'groom': 'наречений', 'bride': 'наречена',
        'deceased': 'померлий', 'relative': 'родич', 'servant': 'наймит', 'stepson': 'пасинок', 'stepdaughter': 'падчерка', 'nephew': 'небіж', 'niece': 'небога'}
SEX = {'male': 'ч.', 'female': 'ж.', 'чоловіча': 'ч.', 'жіноча': 'ж.'}

def read_rows(path):
    ext = os.path.splitext(path)[1].lower()
    if ext in ('.xlsx', '.xlsm', '.xls', '.ods'):
        try:
            import pandas as pd
        except ImportError:
            sys.exit('Потрібен pandas: pip install pandas openpyxl xlrd odfpy')
        raw = pd.read_excel(path, header=None, dtype=str).fillna('')
        rows = raw.values.tolist()
    else:
        with open(path, encoding='utf-8-sig', errors='replace') as f:
            sample = f.read(4096); f.seek(0)
            delim = '\t' if sample.count('\t') > sample.count(',') else ','
            rows = list(csv.reader(f, delimiter=delim))
    # шукаємо рядок заголовків: у FamilySearch він може бути не першим
    best, hdr = 0, 0
    for i, r in enumerate(rows[:30]):
        cells = [str(c).strip().lower() for c in r]
        score = sum(1 for names in COLS.values() for c in cells if c in names)
        if score > best: best, hdr = score, i
    head = [str(c).strip().lower() for c in rows[hdr]]
    return head, rows[hdr + 1:]

def pick(head, key):
    for n in COLS[key]:
        if n in head: return head.index(n)
    for i, h in enumerate(head):
        if any(n in h for n in COLS[key]): return i
    return None

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--book', default='', help='номер книги з каталогу (metrychni-knyhy.json)')
    ap.add_argument('--event', default='сповідь', help='тип запису: сповідь / народження / шлюб / смерть')
    ap.add_argument('--dir', default=os.path.join(HERE, 'fs-export'), help='тека з файлами експорту')
    a = ap.parse_args()
    files = sorted(sum([glob.glob(os.path.join(a.dir, '*.' + e)) for e in ('xlsx', 'xls', 'ods', 'csv', 'tsv')], []))
    if not files: sys.exit('У теці %s немає файлів експорту.' % a.dir)
    have = set()
    if os.path.exists(OUT):
        for r in csv.DictReader(open(OUT, encoding='utf-8-sig')):
            have.add((r.get('url', ''), r.get('surname', ''), r.get('first', '')))
    new, skipped = [], 0
    for path in files:
        head, rows = read_rows(path)
        ix = {k: pick(head, k) for k in COLS}
        missing = [k for k in ('full', 'surname', 'date', 'place') if ix[k] is None]
        print('•', os.path.basename(path), '— колонки:', ', '.join(head[:12]), ('| не знайдено: ' + ', '.join(missing)) if missing else '')
        for r in rows:
            g = lambda k: str(r[ix[k]]).strip() if ix[k] is not None and ix[k] < len(r) else ''
            full, sur, giv = g('full'), g('surname'), g('given')
            if not sur and full:
                parts = full.split()
                sur, giv = (parts[-1], ' '.join(parts[:-1])) if len(parts) > 1 else (parts[0] if parts else '', '')
            if not sur: continue
            y = re.search(r'(1[6-9]\d\d)', g('date'))
            place = g('place').split(',')[0].strip()
            notes = '; '.join(x for x in [g('age') and 'вік ' + g('age'), SEX.get(g('sex').lower(), g('sex')), g('father') and 'батько ' + g('father'),
                                         g('mother') and 'мати ' + g('mother'), g('spouse') and 'подружжя ' + g('spouse')] if x)
            url = g('url')
            if url and not url.startswith('http'): url = 'https://www.familysearch.org/ark:/61903/' + url.split('ark:/61903/')[-1].lstrip('/')
            key = (url, sur, giv)
            if key in have: skipped += 1; continue
            have.add(key)
            new.append({'book_id': a.book, 'year': y.group(1) if y else '', 'event': a.event, 'surname': sur, 'first': giv, 'role': ROLE.get(g('role').lower(), g('role')),
                        'village': place, 'page': g('image'), 'notes': notes, 'url': url})
    write_head = not os.path.exists(OUT)
    with open(OUT, 'a', encoding='utf-8-sig' if write_head else 'utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        if write_head: w.writeheader()
        w.writerows(new)
    print('Додано записів: %d, пропущено дублікатів: %d → %s' % (len(new), skipped, os.path.basename(OUT)))
    print('Далі: python3 build_index.py')

if __name__ == '__main__':
    main()
