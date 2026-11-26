# python3 tools/worobin/docs_fix.py script.py — у script доступні D (словник за id) і L (список); зміни зберігаються в w18-docs.json
import json, os, sys
P = os.path.normpath(os.path.dirname(os.path.abspath(__file__)) + '/../../w18-docs.json')
L = json.load(open(P, encoding='utf-8')); D = {x['id']: x for x in L}
def S(t): return t[1] if isinstance(t[1], str) else ''
exec(open(sys.argv[1], encoding='utf-8').read())
json.dump(L, open(P, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
