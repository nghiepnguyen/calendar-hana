"""未-戊申 納財 / puzhu:21 audit: score the frozen predictions, compare the three tables, summarise sensitivity.

Run: python3 -I docs/audits/sources/p4-vol10/weishen-nacai-puzhu21-v1/build_result.py
Inputs: predictions.json + freeze.json (718f06c), full.json, sensitivity.json, witness.json, the faithful
table (jiesha-faithful-vol10-v1, d79b08e) and the P17 table (puzhu17-bujiang-v1/full.json, a85ab0f).
"""
import collections
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
load = lambda p: json.loads((HERE / p).read_text(encoding='utf-8'))
pred, freeze, full, sens, wit = (load(n) for n in
                                 ('predictions.json', 'freeze.json', 'full.json', 'sensitivity.json', 'witness.json'))
faithful = load('../jiesha-faithful-vol10-v1/faithful.json')['verdictTable']['table']
p17 = load('../puzhu17-bujiang-v1/full.json')

score = {}
for n in ('N-A', 'N-C', 'N-B', 'N-B6'):
    cells = {h: [p[n], wit['cells'][h]['printed']] for h, p in pred['pageCells'].items()}
    score[n] = {'supports': sum(a == b for a, b in cells.values()),
                'contradicts': [h for h, (a, b) in cells.items() if a != b]}

t0 = {f'{c}:{a}': v for c, x in faithful.items() for a, v in x.items()}
t1 = {f'{c}:{a}': s[0].split(':')[1] for c, x in p17.items() for a, s in x['P17-A'].items()}
nb = {f'未-戊申:{a}': s[0].split(':')[1] for a, s in full['N-B'].items()}
na = {f'未-戊申:{a}': s[0].split(':')[1] for a, s in full['N-A'].items()}
t_nb = {**t1, **nb}
diff = lambda a, b: {k: [a[k], b[k]] for k in a if a[k] != b[k]}
rows = sens['rows']
acts = [r for r in rows if 'activity' in r]
result = {
    'version': 'weishen-nacai-puzhu21-v1',
    'witnessScore': score,
    'tables': {
        'cells': [len(t0), len(t1), len(t_nb)],
        'faithfulToP17A': diff(t0, t1),
        'p17AToSourceReading': diff(t1, {**t1, **na}),
        'p17AToPageLiteralNB': diff(t1, t_nb),
        'avoidCounts': {k: collections.Counter(t.values())['avoid'] for k, t in
                        (('faithful', t0), ('P17-A', t1), ('N-B', t_nb))},
        'varyingAcrossDates': [f'{n}:{a}' for n in ('N-A', 'N-B') for a, s in full[n].items() if len(s) > 1],
    },
    'sensitivityNB': {
        'dates': len({r['date'] for r in rows}),
        'activityRows': len(acts),
        'byActivity': dict(collections.Counter(r['activity'] for r in acts)),
        'scoreDelta': dict(collections.Counter(r['to'][0] - r['from'][0] for r in acts)),
        'ratings': dict(collections.Counter(f"{r['from'][1]}→{r['to'][1]}" for r in acts if r['from'][1] != r['to'][1])),
        'events': dict(collections.Counter(f"{r['event']}:{r['from']}→{r['to']}" for r in rows if 'event' in r)),
    },
}
(HERE / 'result.json').write_text(json.dumps(result, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(json.dumps({k: result[k] for k in ('witnessScore',)}, ensure_ascii=False),
      json.dumps({k: v for k, v in result['tables'].items()}, ensure_ascii=False))
