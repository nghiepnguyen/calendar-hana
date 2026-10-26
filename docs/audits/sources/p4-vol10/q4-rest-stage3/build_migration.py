"""Q4-REST Stage 3: migration evidence for authority v5 (envelope, attribution, provenance, rollback, source
regression, authority diff).

Run from the repo root, after the migration dump:
  Q4R3M_DUMP=1 npx vitest run shared/lunar/p4Q4RestStage3Migration.test.ts
  python3 -I docs/audits/sources/p4-vol10/q4-rest-stage3/build_migration.py [OUTDIR]
Writes migration-envelope.json, provenance.json, rollback.json, source-regression.json, authority-diff.json and
migration-lock.json (keys always name this directory). The frozen commit-1 files are read, never written.
"""
import collections
import csv
import hashlib
import json
import os
import sys

HERE = os.path.relpath(os.path.dirname(os.path.abspath(__file__)))
P = 'docs/audits/sources/p4-vol10/'
MIG = os.path.join(HERE, 'migration-diff.json')
PRED = os.path.join(HERE, 'prediction.json')
RULING = os.path.join(HERE, 'owner-ruling.json')
HARNESS = 'shared/lunar/p4Q4RestStage3Migration.test.ts'
FULL4 = P + 'p4-full-golden-v4/compose/'
S2A1 = P + 'q4-rest-stage2a1/production-population.json'
S2B, S2C = P + 'q4-rest-stage2b/', P + 'q4-rest-stage2c/'
AUTH_VALID = P + 'p4b-puzhu06-authority-v5/validation.json'
RULES = {'-jk': 'R-JK', '-wx': 'R-WX', '-xh': 'R-XH', '-f1y': 'R-F1Y'}
GOD = {'R-JK': '九空', 'R-WX': '五虛', 'R-XH': '小耗', 'R-F1Y': '五離'}
# Clean source cells per ruling (page context × heading), from the owner packets.
WITNESSED = {
    'R-JK': {(c, h) for c in ('卯-丁丑', '午-戊辰') for h in ('開市', '立券交易', '納財')},
    'R-WX': {(c, '開倉庫出貨財') for c in ('卯-丁巳', '午-戊申', '子-丙寅')},
    'R-XH': {('巳-戊戌', h) for h in ('開市', '立券交易', '納財')} |
            {('戌-癸卯', h) for h in ('開市', '立券交易', '納財', '開倉庫出貨財')},
    'R-F1Y': {('午-戊申', '立券交易'), ('丑-甲申', '立券交易')},
}


def sha(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def counts(v):
    a, e = v['activity'], v['event']
    return {'decisionRows': len(v['decision']), 'headingRows': len(v['heading']), 'activityRows': len(a),
            'eventRows': len(e),
            'statusChanges': sum(x['production']['status'] != x['model']['status'] for x in a),
            'activityScoreChanges': sum(x['production']['score'] != x['model']['score'] for x in a),
            'hardWarningChanges': sum(x['production']['hardWarning'] != x['model']['hardWarning'] for x in a),
            'eventClassificationChanges': sum(x['production']['classification'] != x['model']['classification'] for x in e),
            'eventScoreChanges': sum(x['production']['score'] != x['model']['score'] for x in e),
            'headingTransitions': dict(collections.Counter(
                f"{(x['production'] or {}).get('state')}→{(x['model'] or {}).get('state')}" for x in v['heading']))}


KEY = {'decision': lambda x: (x['date'], x['heading']), 'heading': lambda x: (x['date'], x['heading']),
       'activity': lambda x: (x['date'], x['activityId']), 'event': lambda x: (x['date'], x['event'])}


def tsv(path):
    with open(path, encoding='utf-8') as f:
        return list(csv.DictReader(f, delimiter='\t'))


def main():
    mig = json.load(open(MIG, encoding='utf-8'))
    pred = json.load(open(PRED, encoding='utf-8'))
    assert mig['authority'] == 'p4b-puzhu06-v5' and pred['authority'] == 'p4b-puzhu06-v4'
    s2c = json.load(open(S2C + 'runtime.json', encoding='utf-8'))['impact']['all']

    # ---- envelope: shipped vs prediction (row for row) and vs Stage 2C ----
    vs_pred = {}
    for k, f in KEY.items():
        a = {f(x): x for x in mig['diff'][k]}
        b = {f(x): x for x in pred['full'][k]}
        same = sum(json.dumps(a[q], sort_keys=True) == json.dumps(b[q], sort_keys=True) for q in a if q in b)
        vs_pred[k] = {'shipped': len(a), 'predicted': len(b), 'sameKeys': set(a) == set(b), 'identicalRows': same}
    class_rename = all(a['model'].replace('QL_NARROW', 'QL_EXCLUDED') == b['model'] for a, b in
                       zip(sorted(mig['diff']['decision'], key=KEY['decision']),
                           sorted(pred['full']['decision'], key=KEY['decision'])))
    assert all(v['sameKeys'] for v in vs_pred.values()) and class_rename
    for k in ('heading', 'activity', 'event'):
        assert vs_pred[k]['identicalRows'] == vs_pred[k]['shipped'], k
    env = {'version': 'q4-rest-stage3-v1', 'shipped': counts(mig['diff']),
           'vsPrediction': vs_pred,
           'decisionNote': 'decision rows equal the prediction except the class name: QL_NARROW (v5) where the '
                           'test-only prediction mocked QL_EXCLUDED',
           'vsStage2C': {'stage2C': counts(s2c), 'match': 'DIFFERENCE (explained)',
                         'explanation': 'same keys and counts; the 37 scoped-Y heading rows read only_ji where '
                                        'Stage 2C (J-only diagnostic) gave both_present, with their activity/event '
                                        'values. Frozen before any engine code in prediction-summary.json'}}

    # ---- attribution and provenance ----
    without = {RULES[m]: {KEY['heading'](x) for x in v['heading']} for m, v in mig['withoutRule'].items()}
    # Rows two rulings each keep on their own (九空 + 五虛 開倉庫) revert only when both go; the Stage 2C single-ruling
    # diagnostics (jk ∩ wx) name them.
    imp2c = json.load(open(S2C + 'runtime.json', encoding='utf-8'))['impact']
    joint = {KEY['heading'](x) for x in imp2c['jk']['heading']} & {KEY['heading'](x) for x in imp2c['wx']['heading']}
    rows = []
    for x in sorted(mig['diff']['heading'], key=KEY['heading']):
        k = KEY['heading'](x)
        rules = sorted(r for r, keys in without.items() if k in keys) or (['R-JK', 'R-WX'] if k in joint else [])
        assert rules, f'unattributed row {k}'
        direct = [r for r in rules if (x['context'], x['heading']) in WITNESSED[r]]
        cls = ('OVERLAP_OF_APPROVED_RULES' if len(rules) > 1 else
               'DIRECT_SOURCE_WITNESSED' if direct else 'SEMANTIC_OWNER_RULE')
        rows.append({'date': x['date'], 'context': x['context'], 'heading': x['heading'], 'rules': rules,
                     'from': (x['production'] or {}).get('state'), 'to': (x['model'] or {}).get('state'),
                     'evidenceClass': cls,
                     'note': 'DIRECT = dated row on a page-witnessed context × heading; the page proves the cell, '
                             'not every date' if cls == 'DIRECT_SOURCE_WITNESSED' else ''})
    prov = {'version': 'q4-rest-stage3-v1', 'rows': rows,
            'byClass': dict(collections.Counter(r['evidenceClass'] for r in rows)),
            'byRule': {r: sum(r in x['rules'] for x in rows) for r in RULES.values()},
            'byRuleClass': {r: dict(collections.Counter(x['evidenceClass'] for x in rows if r in x['rules']))
                            for r in RULES.values()},
            'f1y': {'witnessedContexts': ['丑-甲申', '午-戊申'],
                    'rowsOnWitnessedContexts': sum(1 for r in rows if r['rules'] == ['R-F1Y'] and
                                                   r['context'] in ('丑-甲申', '午-戊申')),
                    'rowsElsewhere': sum(1 for r in rows if r['rules'] == ['R-F1Y'] and
                                         r['context'] not in ('丑-甲申', '午-戊申')),
                    'note': 'direct witness contexts ≠ all 21 production rows'}}

    # ---- regression: who moved ----
    pop = json.load(open(S2A1, encoding='utf-8'))['rows']
    changed = {(r['date'], r['heading']) for r in rows}
    pop_changed = [r for r in pop if (r['date'], r['heading']) in changed]
    assert all(r['ungraded'] == ['五離'] and r['heading'] == '立券交易' for r in pop_changed)
    regression = {
        'otherUngradedGods': 'unchanged: of the 1,110 both_present rows with a surviving ungraded 忌 (Stage 2A.1), '
                             f'only {len(pop_changed)} changed, all 五離 × 立券交易 (R-F1Y); U4, U7, BAIJI and the 16 '
                             'other gods are untouched',
        'populationRowsChanged': len(pop_changed),
        'u7Changed': sum(1 for r in pop_changed if r['family'].startswith('U7')),
        'u4Changed': sum(1 for r in pop_changed if r['family'].startswith('U4')),
        'everyRowAttributed': True,
        # 五墓 (Q4a) and 五離 (R2) keep their QL_EXCLUDED class on every changed decision; Golden v5 PRD check keeps
        # q4aRows 9 / r2Rows 19 (p4b-puzhu06-golden-v5/validation.json).
        'qlExcludedPreserved': all('QL_EXCLUDED' in x['model'] for x in mig['diff']['decision']
                                   if 'QL_EXCLUDED' in x['production']),
        'goldenV5Prd': json.load(open(P + 'p4b-puzhu06-golden-v5/validation.json', encoding='utf-8'))['prdCounts'],
    }
    assert regression['qlExcludedPreserved'] and regression['goldenV5Prd']['match']

    # ---- rollback ----
    base = pred['baseline']
    rb, sh = mig['rollbackDigests'], mig['shippedDigests']
    rollback = {'version': 'q4-rest-stage3-v1', 'model': 'v4 at the v5 path (shared/lunar/q4RestRollback.ts)',
                'days': len(base), 'rollbackEqualsBaseline': sum(rb[d] == base[d] for d in base),
                'exact': all(rb[d] == base[d] for d in base),
                'shippedDiffersOn': sum(sh[d] != base[d] for d in base),
                'outsideDomainUnchanged': all(sh[d] == base[d] for d in ('2024-11-04', '2028-10-14')),
                'digest': {'rollback': hashlib.sha256(json.dumps(rb, sort_keys=True).encode()).hexdigest(),
                           'shipped': hashlib.sha256(json.dumps(sh, sort_keys=True).encode()).hexdigest(),
                           'baseline': hashlib.sha256(json.dumps(base, sort_keys=True).encode()).hexdigest()},
                'perRule': {r: {'headingRowsReverted': len(without[r])} for r in RULES.values()}}
    assert rollback['exact'] and rollback['outsideDomainUnchanged']

    # ---- source regression ----
    ctx = {(r['id'], r['heading']): r for r in tsv(FULL4 + 'context.tsv')}
    dated = collections.defaultdict(set)
    for r in tsv(FULL4 + 'dated.tsv'):
        dated[(f"{r['month_jian']}-{r['pillar']}", r['heading'])].add(r['state'])
    j2b = json.load(open(S2B + 'j-axis.json', encoding='utf-8'))['cells']
    xh = json.load(open(S2C + 'xiaohao-replication.json', encoding='utf-8'))['cells']
    f1 = json.load(open(S2B + 'f1-y.json', encoding='utf-8'))['rows']
    printed = {}
    for c in j2b:
        if c['clean']:
            printed[(c['god'], c['context'], c['heading'])] = c['printed']
    printed[('五虛', '卯-丁巳', '開倉庫出貨財')] = 'only_ji'  # n126, Stage 1 / 2A
    for c in xh:
        printed[('小耗', '戌-癸卯', c['heading'])] = c['printed']
    for r in f1:
        printed[('五離', r['context'], '立券交易')] = r['printed']
    cells = []
    for (god, c, h), pr in sorted(printed.items()):
        row = ctx[(c, h)]
        st = row['state']
        level = 'context'
        if st == 'undetermined' and dated.get((c, h)):
            st, level = '+'.join(sorted(dated[(c, h)])), 'dated'
        cells.append({'god': god, 'context': c, 'heading': h, 'printed': pr, 'production': st, 'level': level,
                      'match': st == pr})
    out_of_scope = [
        (('巳-戊戌', '開倉庫出貨財'), 'U7 (天賊 protected) + 小耗: not migrated (U7 quarantined)'),
        (('丑-甲申', '開倉庫出貨財'), '百忌甲 (BAIJI-Y): not migrated'),
        (('丑-甲申', '安牀'), '百忌申 (BAIJI-Y): not migrated'),
        (('子-丙寅', '結婚姻'), '滿日 (another ungraded god): not migrated'),
        (('子-丙寅', '納采問名'), '滿日 (another ungraded god): not migrated'),
        (('午-戊申', '結婚姻'), '五離 on another heading: R-F1Y is 立券交易 only'),
        (('午-戊申', '納采問名'), '五離 on another heading: R-F1Y is 立券交易 only'),
        (('丑-甲申', '結婚姻'), '五離 on another heading: R-F1Y is 立券交易 only'),
        (('丑-甲申', '納采問名'), '五離 on another heading: R-F1Y is 立券交易 only'),
    ]
    out_of_scope = [{'cell': f'{c} {h}', 'printed': 'only_ji', 'production': ctx[(c, h)]['state'], 'why': why}
                    for (c, h), why in out_of_scope]
    src = {'version': 'q4-rest-stage3-v1', 'inScope': cells,
           'inScopeMatches': sum(c['match'] for c in cells), 'inScopeCells': len(cells),
           'mismatches': [c for c in cells if not c['match']],
           'outOfScope': out_of_scope,
           'outOfScopeStillMismatched': sum(o['production'] != o['printed'] for o in out_of_scope)}

    auth = json.load(open(AUTH_VALID, encoding='utf-8'))
    adiff = {'version': 'q4-rest-stage3-v1', 'old': 'p4b-puzhu06-v4', 'new': 'p4b-puzhu06-v5', 'parent': 'p4b-puzhu06-v4',
             'diffFromV4': auth['diffFromV4'], 'derived': auth['derived'],
             'unchanged': {'liftExclusions': auth['unchangedExclusions'], 'liftLists': auth['otherLiftListsUnchanged']},
             'added': ['liftExclusions.九空/五虛/小耗 (class QL_NARROW)', 'classes.QL_NARROW (scoped only_ji rule)',
                       'yiComposition R-F1Y', 'ownerDecision R-JK/R-WX/R-XH/R-F1Y']}

    outdir = sys.argv[1] if len(sys.argv) > 1 else HERE

    def out(name, obj):
        with open(os.path.join(outdir, name), 'w', encoding='utf-8') as f:
            json.dump(obj, f, ensure_ascii=False, indent=1)
            f.write('\n')
    built = {'migration-envelope.json': {**env, 'regression': regression}, 'provenance.json': prov,
             'rollback.json': rollback, 'source-regression.json': src, 'authority-diff.json': adiff}
    for n, o in built.items():
        out(n, o)
    files = {os.path.join(HERE, n): sha(os.path.join(outdir, n)) for n in built}
    for p_ in [MIG, PRED, RULING, os.path.join(HERE, 'build_migration.py'), HARNESS, S2A1, S2C + 'runtime.json',
               S2B + 'j-axis.json', S2B + 'f1-y.json', S2C + 'xiaohao-replication.json', AUTH_VALID,
               'shared/almanac-data/p4b-puzhu06-v5.json', 'shared/almanac-data/p4b-puzhu06-v4.json',
               P + 'p4b-puzhu06-authority-v5/lock.json', 'shared/almanac-data/golden-p4b-puzhu06-v5.json',
               P + 'p4b-puzhu06-golden-v5/lock.json', P + 'p4-full-golden-v4/lock.json',
               P + 'p4-score-golden-v6/lock.json', 'shared/lunar/p4Puzhu06.ts', 'shared/lunar/p4OwnerRules.ts',
               'shared/lunar/q4RestRollback.ts']:
        files[p_] = sha(p_)
    out('migration-lock.json', {'version': 'q4-rest-stage3-migration-v1', 'files': files})


if __name__ == '__main__':
    main()
