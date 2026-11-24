# Нормалізація метаданих для прев'ю посилань: абсолютний og:image, og:url, canonical, twitter:card.
import re, html as H, sys
SITE = 'https://dubrovytsia.site/'
DEFAULT_IMG = SITE + 'worobin-3d-poster.jpg'
OVR = {'index.html': DEFAULT_IMG, 'karty.html': 'https://i.imgur.com/Da5KGQSh.jpeg', 'doslidnyk.html': DEFAULT_IMG, 'presa.html': DEFAULT_IMG,
       'prizvyshcha.html': DEFAULT_IMG, 'sela-1798.html': SITE + 'atlas-1798-preview.jpg', 'poselennia.html': SITE + 'atlas-1798-preview.jpg'}

def absimg(u):
    if not u: return None
    if u.startswith('//'): u = 'https:' + u
    if not u.startswith('http'): u = SITE + u.lstrip('./')
    m = re.match(r'(https://i\.imgur\.com/)([A-Za-z0-9]{7})[a-z]?\.(jpe?g|png)$', u)
    if m: u = m.group(1) + m.group(2) + 'h.jpeg'   # 1024 px — достатньо для прев'ю
    return u

def meta(s, name):
    m = re.search(r'<meta\s+(?:property|name)="%s"\s+content="([^"]*)"' % re.escape(name), s)
    return m.group(1) if m else None

def fix(s, fname):
    head_end = s.index('</head>')
    head = s[:head_end]
    img = OVR.get(fname) or absimg(meta(head, 'og:image'))
    if not img:
        m = re.search(r'<img[^>]*class="cover-img[^"]*"[^>]*src="([^"]+)"', s) or re.search(r'<img[^>]*src="([^"]+)"[^>]*class="cover-img', s) \
            or re.search(r'class="hero-doc".*?<img[^>]*src="([^"]+)"', s, re.S) or re.search(r'<main.*?<img[^>]*src="(https://i\.imgur\.com/[^"]+)"', s, re.S)
        img = absimg(m.group(1)) if m else DEFAULT_IMG
    t = re.search(r'<title[^>]*>(.*?)</title>', head, re.S)
    title = H.unescape(t.group(1).strip()) if t else 'Дубровиця — цифровий архів'
    desc = meta(head, 'description') or meta(head, 'og:description') or 'Цифровий архів міста Дубровиця: документи, світлини, карти й історія від 1005 року.'
    url = SITE + ('' if fname == 'index.html' else fname)
    want = [
        ('property', 'og:title', meta(head, 'og:title') or H.escape(title, quote=True)),
        ('property', 'og:description', meta(head, 'og:description') or desc),
        ('property', 'og:type', meta(head, 'og:type') or ('website' if fname == 'index.html' else 'article')),
        ('property', 'og:url', url),
        ('property', 'og:image', img),
        ('property', 'og:site_name', 'Дубровиця · цифровий архів'),
        ('property', 'og:locale', 'uk_UA'),
        ('name', 'twitter:card', 'summary_large_image'),
    ]
    for attr, k, v in want:
        pat = re.compile(r'[ \t]*<meta\s+(?:property|name)="%s"\s+content="[^"]*"\s*/?>\n?' % re.escape(k))
        head = pat.sub('', head)
    block = ''.join('    <meta %s="%s" content="%s">\n' % (a, k, v) for a, k, v in want)
    head = re.sub(r'[ \t]*<link rel="canonical"[^>]*>\n?', '', head)
    block += '    <link rel="canonical" href="%s">\n' % url
    # після <title> (або в кінці head)
    m = re.search(r'</title>\n?', head)
    if m: head = head[:m.end()] + ('' if head[m.end()-1] == '\n' else '\n') + block + head[m.end():]
    else: head = head + block
    return head + s[head_end:]

if __name__ == '__main__':
    for f in sys.argv[1:]:
        path, _, name = f.partition('=')
        name = name or path.split('/')[-1]
        s = open(path, encoding='utf-8').read()
        open(path, 'w', encoding='utf-8').write(fix(s, name)); print('ok', name)
