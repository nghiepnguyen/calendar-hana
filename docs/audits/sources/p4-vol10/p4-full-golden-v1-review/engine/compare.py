"""Full Golden P4, task 6.0: compare the frozen Golden (b70913f) with the engine, using the stitching
pre-registered in lock.json (`engineComparisonPlan`). Runs after the freeze; the Golden is never edited.

Engine rows come from the committed sweeps, byte-verified against the current code by
p4YiSweep / p4Puzhu06Sweep / p4WarehouseSweep / p4Puzhu06Baseline tests (engine code unchanged since):
- dated: P4-C sweep (resolveP4YiDay, 29 headings) ← puzhu:06 sweep for its 5 headings
  (resolveP4Puzhu06Day) ← P5 sweep for 修倉庫 (resolveP4WarehouseDay);
- context: P4-C context baseline ← puzhu:06 v3 context (engine-equal, validation 0 mismatches); 修倉庫 has no
  engine context row and is not compared.
Every difference must map to a registered class; anything else stops the run and is listed for review.
Labels here are feature-based; attribute.py proves the cause of each class by reverting the rule.

    python3 -I docs/audits/sources/p4-vol10/p4-full-golden-v1-review/engine/compare.py [--write]
"""
import csv
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path

G = Path('docs/audits/sources/p4-vol10/p4-full-golden-v1')
OUT = Path('docs/audits/sources/p4-vol10/p4-full-golden-v1-review/engine')
LOCK = G / 'lock.json'
P4C = Path('docs/audits/p4-vol10-yi-operands-2025-2027.tsv')
PUZHU06 = Path('docs/audits/p4b-puzhu06-2025-2027.tsv')
P5 = Path('docs/audits/p5-warehouse-2025-2027.tsv')
P4C_CTX = Path('docs/audits/sources/p4-vol10/p4b-puzhu06-baseline-v1/context-p4c.tsv')
PUZHU06_CTX = Path('docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v3/context.tsv')
VARIANTS = str.maketrans({'劵': '券', '壞': '壊', '宫': '宮', '㑹': '會', '產': '産'})
FREEZE = 'b70913f14fb24c0d279e0f2031de4979b03146c5'


def read(p):
    with Path(p).open(encoding='utf-8') as f:
        return list(csv.DictReader(f, delimiter='\t'))


def sha256(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def engine_dated():
    eng = {}
    for r in read(P4C):
        eng[(r['date'], r['heading'].translate(VARIANTS))] = {
            'state': r['after_final_state'], 'ji': r['after_final_ji'], 'protected': r['after_final_protected_ji'],
            'src': 'P4-C'}
    for r in read(PUZHU06):
        k = (r['date'], r['heading'].translate(VARIANTS))
        eng[k] = {'state': r['after_final_state'], 'ji': r['after_final_ji'],
                  'protected': r['after_final_protected_ji'], 'src': 'puzhu:06'}
    for r in read(P5):
        k = (r['date'], '修倉庫')
        eng[k] = dict(eng[k], state=r['after_final_state'], ji=r['after_final_ji'], src='P5')
    return eng


def engine_context():
    eng = {}
    for r in read(P4C_CTX):
        eng[(r['id'], r['heading'].translate(VARIANTS))] = {
            'state': r['final_state'], 'ji': r['final_ji'], 'protected': r['final_protected_ji'], 'src': 'P4-C'}
    for r in read(PUZHU06_CTX):
        k = (r['id'], r['heading'].translate(VARIANTS))
        eng[k] = dict(eng[k], state=r['after_state'], ji=r['after_ji'], src='puzhu:06')
    return eng


def golden_facts():
    ctx = {(r['id'], r['heading']): r['facts'] for r in read(G / 'ji/context-ji.tsv')}
    dated = {(r['date'], r['heading']): r['facts'] for r in read(G / 'ji/dated-ji.tsv')}
    return ctx, dated


key_has_de_as_jian = {}


def classify(domain, key, row, eng, facts, h1b, xiangdi_heads):
    """First matching registered class; None = unclassified (stop)."""
    h = row['heading']
    if key in ('2027-08-07', '未-戊午'):
        return 'H2-A'
    if (domain, key, h) in h1b or row['propagated']:
        return 'H1-B/F5 (incl. E3)'
    if h == '行幸遣使' and row['pillar'][1] == '巳' and '百忌巳' in facts:
        return 'SPEC_BUG F1'
    if '|remaining|no_annotation|' in facts or 'no_annotation' in facts:
        return 'ENGINE_BUG E1'
    if (domain, key) == ('dated', '2025-10-08') and h == '修倉庫':
        return 'E2/E4'
    if domain == 'context' and eng['state'] == 'undetermined' and row['code'].startswith('invariant;'):
        return 'CONTEXT_DATE_OPERAND_POLICY (E5)'
    fl = [f.split('|') for f in facts.replace(';', ' ').split(' ') if f.count('|') == 3]
    xd = any(f[3] in ('neither_recorded', 'no_annotation') for f in fl)
    unprot = any(f[3] in ('only_ji', 'kept') and f[1] != 'youwei_zhuanji' for f in fl)
    if xd and unprot and eng['state'] == 'undetermined':
        # Engine A04b judges 相抵 + unprotected 忌 before later protected scopes exist (layering).
        return 'ENGINE_BUG A04b layering'
    if key_has_de_as_jian.get((domain, key)) and any(f[1] == 'remaining' and f[3] == 'kept' and f[0] in ('復日', '重日') for f in fl):
        return 'SPEC_BUG: 德作建論 scope on remaining-ji conditions (Golden applies it, engine does not)'
    return None


def main():
    lock = json.loads(LOCK.read_text(encoding='utf-8'))
    for f in lock['files']:  # the comparison reads exactly the frozen Golden
        assert sha256(f['path']) == f['sha256'], f['path']
    h1b = {(r['domain'], r['id'], r['heading']) for r in read(G / 'compose/h1b-changes.tsv')}
    dej = {r['id'] for r in read(G / 'ji/operands.tsv') if r['de_as_jian']}
    for r in read(G / 'compose/dated.tsv'):
        key_has_de_as_jian[('dated', r['date'])] = f"{r['month_jian']}-{r['pillar']}" in dej
    for c in dej:
        key_has_de_as_jian[('context', c)] = True
    ctx_facts, dated_facts = golden_facts()
    report, diffs = {}, []
    for domain, rows, eng in (('dated', read(G / 'compose/dated.tsv'), engine_dated()),
                              ('context', read(G / 'compose/context.tsv'), engine_context())):
        c, unclassified = Counter(), []
        for r in rows:
            key = r['date'] if domain == 'dated' else r['id']
            if domain == 'context' and (r['heading'] == '修倉庫' or r['state'] == 'undetermined'):
                c['notCompared (E5 / no engine context for 修倉庫)'] += 1
                continue
            e = eng[(key, r['heading'])]
            same = (r['state'] == e['state'] and r['ji'] == e['ji']
                    and (r['protected'] == e['protected'] or e['src'] == 'P5'))
            if same:
                c['equal'] += 1
                continue
            facts = ctx_facts[(r['month_jian'] + '-' + r['pillar'], r['heading'])]
            if domain == 'dated':
                facts += ' ' + dated_facts[(key, r['heading'])]
            why = classify(domain, key, r, e, facts, h1b, {})
            row = {'domain': domain, 'id': key, 'heading': r['heading'], 'golden': f"{r['state']}/ji={r['ji']}/prot={r['protected']}",
                   'engine': f"{e['state']}/ji={e['ji']}/prot={e['protected']}", 'engineSource': e['src'],
                   'class': why or 'UNCLASSIFIED', 'goldenCode': r['code']}
            diffs.append(row)
            c[why or 'UNCLASSIFIED'] += 1
            if not why:
                unclassified.append(row)
        report[domain] = dict(c)
        report[domain + 'Unclassified'] = len(unclassified)
    out = {
        'version': 'p4-full-golden-engine-compare-v1', 'freezeCommit': FREEZE,
        'engineInputs': {str(p): sha256(p) for p in (P4C, PUZHU06, P5, P4C_CTX, PUZHU06_CTX)},
        'engineInputsVerifiedBy': ['p4YiSweep.test.ts', 'p4Puzhu06Sweep.test.ts', 'p4WarehouseSweep.test.ts',
                                   'p4Puzhu06Baseline.test.ts'],
        'summary': report,
    }
    head = ['domain', 'id', 'heading', 'golden', 'engine', 'engineSource', 'class', 'goldenCode']
    files = {OUT / 'summary.json': json.dumps(out, ensure_ascii=False, indent=1) + '\n',
             OUT / 'diffs.tsv': '\t'.join(head) + '\n' + ''.join('\t'.join(d[k] for k in head) + '\n' for d in diffs)}
    if '--write' in sys.argv:
        for p, t in files.items():
            p.write_text(t, encoding='utf-8')
    else:
        for p, t in files.items():
            assert p.read_text(encoding='utf-8') == t, f'{p} differs'
    print(json.dumps(report, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
