# python3 tools/worobin/docs_add.py file.py — file defines D=[doc,...]; додає/оновлює документи в w18-docs.json (сортує за iso)
import json, os, sys
R = os.path.normpath(os.path.dirname(os.path.abspath(__file__)) + '/../..') + '/'
g = {}; exec(open(sys.argv[1], encoding='utf-8').read(), g); D = g['D']
docs = json.load(open(R + 'w18-docs.json', encoding='utf-8')); idx = {d['id']: i for i, d in enumerate(docs)}
for d in D:
    d.setdefault('kind', 's'); d.setdefault('st', 'ok'); d['all'] = max(d.get('all') or 0, len(d['pages']))
    imgs = [t[1].split(' ')[0].replace('IMG_', '') for t in d['tr'] if t[0] == 'img']
    for p in d['pages']:
        if str(p) not in imgs: print('WARN немає тегу img для', d['id'], p)
        if not os.path.exists(R + f'w18-scans/IMG_{p}.webp'): print('WARN немає скану', p)
    if d['id'] in idx: docs[idx[d['id']]] = d
    else: docs.append(d)
docs.sort(key=lambda x: x['iso'])
json.dump(docs, open(R + 'w18-docs.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('docs', len(docs))
