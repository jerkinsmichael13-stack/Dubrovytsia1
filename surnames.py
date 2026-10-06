"""Ключ прізвища: зводить українське, російське й польське написання до одного вигляду."""
import re
UA = {'а':'a','б':'b','в':'v','г':'h','ґ':'g','д':'d','е':'e','є':'ie','ж':'zh','з':'z','и':'y','і':'i','ї':'i','й':'i','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ь':'','ю':'iu','я':'ia','ы':'y','э':'e','ъ':'','ё':'io',"'":'','’':'','ʼ':''}
PL = [('szcz','shch'),('sz','sh'),('cz','ch'),('rz','zh'),('ch','kh'),('ż','zh'),('ź','zh'),('ł','l'),('w','v'),('ó','o'),('ą','o'),('ę','e'),('ś','s'),('ć','ts'),('ń','n'),('c','ts'),('j','i'),('x','ks')]
def key(name):
    s = re.sub(r'\(.*?\)', '', str(name or '')).strip().lower()
    s = s.split()[0] if s.split() else s
    if re.search(r'[а-яіїєґё]', s):
        s = ''.join(UA.get(ch, ch) for ch in s)
    else:
        out, i = '', 0
        while i < len(s):
            for a, b in PL:
                if s.startswith(a, i): out += b; i += len(a); break
            else: out += s[i]; i += 1
        s = out
    s = s.replace('g', 'h')
    s = re.sub(r'(?<=[bcdfhklmnprstvz])i(?=[aeou])', '', s)      # пом'якшення: kliuiko → kluiko, liaskovets → laskovets
    s = s.replace('y', 'i').replace('ii', 'i')
    s = re.sub(r'([a-z])\1', r'\1', s)
    for a, b in (('skaia', 'ski'), ('tskaia', 'tski'), ('ska', 'ski'), ('tska', 'tski'), ('owna', 'ov'), ('ovna', 'ov'), ('evna', 'ev'), ('ova', 'ov'), ('eva', 'ev'), ('ina', 'in'), ('aia', 'i')):
        if s.endswith(a) and len(s) > len(a) + 2: s = s[:-len(a)] + b; break
    s = re.sub(r'[^a-z\-]', '', s)
    return s
PL2UA = [('szcz','щ'),('sz','ш'),('cz','ч'),('rz','ж'),('ch','х'),('ż','ж'),('ź','зь'),('ł','л'),('w','в'),('ó','о'),('ą','он'),('ę','ен'),('ś','сь'),('ć','ць'),('ń','нь'),
         ('ia','я'),('ie','є'),('io','ьо'),('iu','ю'),('ja','я'),('je','є'),('jo','йо'),('ju','ю'),('j','й'),('a','а'),('b','б'),('c','ц'),('d','д'),('e','е'),('f','ф'),('g','г'),('h','г'),('i','і'),('k','к'),('l','ль'),('m','м'),('n','н'),('o','о'),('p','п'),('r','р'),('s','с'),('t','т'),('u','у'),('v','в'),('y','и'),('z','з')]
def pl_to_ua(w):
    s, out, i = w.lower(), '', 0
    while i < len(s):
        for a, b in PL2UA:
            if s.startswith(a, i): out += b; i += len(a); break
        else: out += s[i]; i += 1
    out = re.sub(r'ль(?=[аоуеиіяюєї])', 'л', out); out = re.sub(r'ль$', 'ль', out)
    out = re.sub(r'ль(?=[бвгджзйклмнпрстфхцчшщ])', 'л', out)
    return out[:1].upper() + out[1:]
RU2UA = {'и': 'и', 'ы': 'и', 'э': 'е', 'ъ': '', 'ё': 'ьо'}
