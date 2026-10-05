#!/usr/bin/env python3
"""Збирає розділ «Преса» з одного джерела — press-data.json.
   Вбудовує дані в presa.html (між /*PRESS_DATA_START*/ і /*PRESS_DATA_END*/)
   і перезаписує легкий press-index.json для загального пошуку сайту.
   Запуск з кореня репозиторію або з tools/:  python3 build_press.py"""
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = HERE if os.path.exists(os.path.join(HERE, 'press-data.json')) else os.path.dirname(HERE)
THEMES = {'plater': 'Плятери й маєток', 'jewish': 'Єврейська громада', 'crime': 'Злочини й суди', 'nature': 'Наука й природа', 'education': 'Освіта',
          'transport': 'Залізниця, річка й шляхи', 'economy': 'Господарство', 'culture': 'Культура й спорт', 'war': 'Війни й військо', 'power': 'Влада й політика', 'daily': 'Повсякденне життя'}
data = json.load(open(os.path.join(ROOT, 'press-data.json'), encoding='utf-8'))
ids = [d['id'] for d in data]
assert len(ids) == len(set(ids)), 'дубльовані id'
page = os.path.join(ROOT, 'presa.html')
s = open(page, encoding='utf-8').read()
a = s.index('/*PRESS_DATA_START*/'); b = s.index('/*PRESS_DATA_END*/')
emb = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
s = s[:a] + '/*PRESS_DATA_START*/var PRESS_DATA=' + emb + ';' + s[b:]
open(page, 'w', encoding='utf-8').write(s)
index = [{'id': d['id'], 'date': d['date'], 'year': d['year'], 'headline': d['headline'], 'source': d['source'],
          'language': d.get('language'), 'tags': [THEMES[t] for t in d.get('themes', []) if t in THEMES]} for d in data]
json.dump(index, open(os.path.join(ROOT, 'press-index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok:', len(data), 'статей')
