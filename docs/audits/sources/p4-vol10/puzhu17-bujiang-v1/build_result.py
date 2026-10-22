"""puzhu:17 不將 audit: score the frozen predictions against the witnesses and summarise table / P4 impact.

Run: python3 -I docs/audits/sources/p4-vol10/puzhu17-bujiang-v1/build_result.py
Inputs: freeze.json (616698a), full.json (PUZHU17_FULL run), witness.json. Audit only.
"""
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
load = lambda n: json.loads((HERE / n).read_text(encoding='utf-8'))
freeze, full, witness = load('freeze.json'), load('full.json'), load('witness.json')
V = ['P17-0', 'P17-A', 'P17-B', 'P17-C']
TERM = {'般移': '移徙'}

# Table: every faithful scope date, one value per (context, activity) under each variant.
varying = [f'{c}:{v}:{a}' for c, x in full.items() for v in V for a, s in x[v].items() if len(s) > 1]
table = {v: {f'{c}:{a}': s[0] for c, x in full.items() for a, s in x[v].items()} for v in V}
table_diff = {v: {k: [table['P17-0'][k], table[v][k]] for k in table[v] if table[v][k] != table['P17-0'][k]}
              for v in V[1:]}
rep_agrees = all(freeze['table'][c][v]['cells'] == {a: s[0] for a, s in full[c][v].items()}
                 for c in full for v in V)

# Witnesses: frozen predictions (faithful layer for 劫煞 scope pages) vs the full-resolution cells.
score = {v: {'supports': 0, 'contradicts': 0, 'cells': []} for v in V}
for page in witness['pages']:
    pred = freeze['witness'][page['context']]['predictions']
    for v in V:
        p = pred[f'faithful:{v}']
        for h, printed in p.items():
            term = TERM.get(h, h)
            if term not in page['cells']:
                continue
            ok = printed == page['cells'][term]
            score[v]['supports' if ok else 'contradicts'] += 1
            score[v]['cells'].append([page['context'], term, printed, page['cells'][term]])
distinguishing = sorted({c for c, x in freeze['witness'].items()
                         for layer in ('production', 'faithful')
                         if len({json.dumps(x['predictions'].get(f'{layer}:{v}')) for v in V}) > 1})

# P4 layer (production, context level): observable state changes.
p4 = {v: [[c, h, ch['from'][0], ch['to'][0]] for c, x in freeze['p4']['contexts'].items()
          for h, ch in x['diff'].get(v, {}).items() if ch['from'][0] != ch['to'][0]] for v in V[1:]}

result = {
    'version': 'puzhu17-bujiang-v1',
    'table': {'contexts': len(full), 'cells': len(table['P17-0']), 'varyingAcrossDates': varying,
              'representativeDatesAgreeWithFullRange': rep_agrees, 'diffVsP17_0': table_diff},
    'witness': {'distinguishingPages': distinguishing, 'score': score},
    'p4': {'bujiangContexts': freeze['p4']['bujiangContexts'], 'observableChanges': p4,
           'clause2PreconditionContexts': freeze['p4']['clause2']},
}
(HERE / 'result.json').write_text(json.dumps(result, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(json.dumps({'table': {k: v for k, v in result['table'].items()}, 'witness': {
    v: {k: s[k] for k in ('supports', 'contradicts')} for v, s in score.items()},
    'distinguishing': distinguishing}, ensure_ascii=False, indent=1))
