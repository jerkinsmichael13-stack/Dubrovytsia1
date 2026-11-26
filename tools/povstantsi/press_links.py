# -*- coding: utf-8 -*-
"""Зв'язки «людина з реєстру ↔ стаття преси».

Шукає згадки людей реєстру в перекладах статей press-data.json (поле translation та people).
Прізвище знаходиться з будь-яким відмінковим закінченням; якщо в реєстрі кілька людей
з тим самим прізвищем, потрібне ще ім'я або ініціал поруч. Неоднозначні згадки пропускаються.

  links(P, press) -> {person_id: [article_id, ...]}
"""
import re

# інші написання прізвищ у пресі (транскрипції не змінюємо, тому шукаємо й так)
ALT = {
    'teodor-perishko': ['Пиришк', 'Перишк', 'Перішк'],
    'iryna-pyrishko': ['Пиришк'],
    'illia-perishko': ['Пиришк'],
    'onufrii-kharkivets': ['Харковц', 'Харковець'],
    'marko-veliunets': ['Веленц', 'Веленець'],
    'mykola-yefimov': ['Єфимов', 'Ефимов', 'Заграничн'],
    'arvid-skuin': ['Скути'],
    'mykola-hrytsiuk': ['Грицюк-Антонов'],
    'stepan-martynchuk': ['Мартинчик'],
    'slobeda': ['Слобед', 'Слобод'],
    'yevfrosyniia-markovets': ['Марковц', 'Марковець'],
}
# ці люди знайомі пресі лише під прізвищем без імені — дозволяємо збіг за самим прізвищем
SURNAME_ONLY = {'musher', 'fishman', 'slobeda', 'arvid-skuin', 'mykola-yefimov', 'oleksandr-ilin', 'semen-maisuradze',
                'petro-shpakovskyi', 'oleksandr-modek', 'mykola-hrytsiuk', 'pylyp-borko-bruiaka', 'trokhym-kaminskyi',
                'hryhorii-bovhyria', 'a-nahornyi', 'stepan-moiseievych'}
# лише ці форми імені (інакше збігаються однофамільці з тим самим ініціалом)
STRICT = {
    'stepan-lyaskovets': ['Степан', 'Стефан', r'(?<![А-ЯІЇЄҐ]\. )С\. ?[ЙІ]\.'], 'serhii-lyaskovets': ['Сергі'],
    'iryna-pyrishko': ['Ірин', 'Ярин', r'І\. ?Б\.'], 'illia-perishko': ['Ілл', r'І\. ?І\.'],
    'teodor-perishko': ['Федір', 'Федор', 'Теодор', r'Ф\. ?(?:Б\.)?'],
    'hanna-kononchuk': ['Ганн', 'Галин'], 'hryhorii-kononchuk': ['Григор'],
    'kateryna-kononchuk': ['Катерин'],
}
TOPIC = ('повстан', 'Воробин', 'ревком', 'червоногвард', 'Плятер')
# ручні виключення: (person_id, article_id)
SKIP = set()

ENDS = r"(?:а|я|у|ю|ові|еві|ом|ем|ою|ею|ій|ий|ого|ому|им|ім|ими|ами|ями|ах|ях|ів|ї|і|и|е|ці|ця|цю|цем|ців|цям|ець|о)?"


def stem(s):
    s = s.replace('’', "'")
    for suf in ('ський', 'цький', 'ець', 'ко', 'ня', 'ла', 'ра', 'та', 'да', 'ря', 'на'):
        if s.endswith(suf) and len(s) > len(suf) + 2:
            if suf in ('ський', 'цький'): return s[:-2]
            if suf == 'ець': return s[:-3]
            return s[:-1]
    return s


def surnames(p):
    nm = p['name'].replace('(', ' ').replace(')', ' ')
    last = nm.split()[-1]
    out = set()
    for part in last.split('-'):
        if len(part) > 2: out.add(stem(part))
    if '-' in last: out.add(stem(last))
    for a in ALT.get(p['id'], []): out.add(a)
    return out


def first_names(p):
    words = p['name'].split()
    fn = words[0] if len(words) > 1 else ''
    out = set()
    if fn and fn[0].isupper() and not fn.endswith('.'):
        out.add(fn[:-1] if fn[-1] in 'аяоеиіьйа' and len(fn) > 3 else fn)
    alt = p.get('alt') or ''
    for w in re.findall(r"[А-ЯІЇЄҐ][а-яіїєґ']{2,}", alt):
        if w in ('Степанова', 'Справі', 'Польською', 'Бердникова'): continue
    ini = set()
    if fn: ini.add(fn[0])
    for m in re.findall(r"\b([А-ЯІЇЄҐ])\. ?(?:[А-ЯІЇЄҐ]\. ?)?" + re.escape(words[-1][:3]), p.get('alt') or ''):
        ini.add(m)
    return out, ini


EXTRA_FIRST = {  # інші форми імені в пресі
    'oleksandr-kononchuk': ['Олекс'], 'teodor-perishko': ['Федір', 'Федор', 'Ф.'], 'ivan-nashora': ['Іван', 'Ян '],
    'hnat-nashora': ['Гнат', 'Ігнат'], 'yosyp-lyaskovets': ['Йосип'], 'stepan-lyaskovets': ['Степан', 'Стефан'],
    'mykola-yevchuk': ['Микол', 'М. Й.'], 'iryna-pyrishko': ['Ірин', 'Ярин', 'І. Б.'], 'illia-perishko': ['Ілл', 'І. І.'],
    'yevfrosyniia-markovets': ['Єфросин'], 'hanna-krenko': ['Галин'],
}


def links(P, press):
    by_sur = {}
    info = {}
    for p in P:
        sn = surnames(p); fn, ini = first_names(p)
        for x in EXTRA_FIRST.get(p['id'], []):
            (ini if x.endswith('.') and len(x) <= 3 else fn).add(x.rstrip('.') if len(x) <= 2 else x)
        info[p['id']] = (sn, fn, ini)
        for s in sn: by_sur.setdefault(s, set()).add(p['id'])
    out = {}
    for a in press:
        tr = a.get('translation') or ''
        if (a.get('year') or 0) < 1918 or not any(k in tr for k in TOPIC): continue
        txt = tr + ' \n ' + ' ; '.join(a.get('people') or [])
        found = set()
        for s, pids in by_sur.items():
            for m in re.finditer(r"(?<![А-ЯІЇЄҐа-яіїєґ'])" + re.escape(s) + ENDS + r"(?![а-яіїєґ'])", txt):
                before = txt[max(0, m.start() - 40):m.start()]
                cand = []
                for pid in pids:
                    if pid in STRICT:
                        ok = any(re.search(f + r"[а-яіїєґ']{0,4}\s+(?:[А-ЯІЇЄҐ][а-яіїєґ']+\s+)?$", before) for f in STRICT[pid])
                    else:
                        sn, fn, ini = info[pid]
                        ok = any(re.search(re.escape(f) + r"[а-яіїєґ']{0,4}\s+(?:[А-ЯІЇЄҐ][а-яіїєґ']+(?:ович|івна|овна|ич)\s+)?$", before) for f in fn) or \
                             any(re.search(r"(?<![А-ЯІЇЄҐа-яіїєґ])(?<![А-ЯІЇЄҐ]\. )(?<![А-ЯІЇЄҐ]\.)" + re.escape(i) + r"\.\s?(?:[А-ЯІЇЄҐ]\.\s?)?$", before) for i in ini)
                    if ok: cand.append(pid)
                if not cand and not re.search(r"[А-ЯІЇЄҐ][а-яіїєґ']+\s+$|[А-ЯІЇЄҐ]\.\s?$", before):
                    solo = [pid for pid in pids if pid in SURNAME_ONLY]
                    if len(pids) == 1 and solo: cand = solo
                if len(cand) == 1: found.add(cand[0])
        for pid in found:
            if (pid, a['id']) in SKIP: continue
            out.setdefault(pid, []).append(a['id'])
    return out
