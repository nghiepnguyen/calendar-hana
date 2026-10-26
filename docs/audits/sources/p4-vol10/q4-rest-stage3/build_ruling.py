"""Q4-REST Stage 3, commit 1: freeze the owner rulings and the pre-implementation prediction (audit only).

Run from the repo root, after the prediction dump (taken on the v4 tree, before any Stage 3 engine code):
  Q4R3_DUMP=1 npx vitest run shared/lunar/p4Q4RestStage3Prediction.test.ts
  python3 -I docs/audits/sources/p4-vol10/q4-rest-stage3/build_ruling.py [--write]
Writes owner-ruling.json, prediction-summary.json and ruling-lock.json. Without --write it verifies them.
"""
import collections
import hashlib
import json
import sys
from pathlib import Path

HERE = Path('docs/audits/sources/p4-vol10/q4-rest-stage3')
P = Path('docs/audits/sources/p4-vol10')
PRED = HERE / 'prediction.json'
S2C = P / 'q4-rest-stage2c'
HARNESS = Path('shared/lunar/p4Q4RestStage3Prediction.test.ts')
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()

RULING = {
    'version': 'q4-rest-stage3-owner-ruling-v1',
    'date': '2026-10-26',
    'ruling': 'OWNER_RULING',
    'rulings': {
        'R-JK': {'decision': 'ADOPT', 'god': '九空',
                 'rule': "For 九空's prohibited headings, generic puzhu:06 Q4 triggers do NOT remove 九空's 忌 unless "
                         'an independently established 九空-specific lifter applies.',
                 'scope': '九空 × its own prohibited headings (卷十 九空 忌 ∩ puzhu:06 IN_SCOPE; currently 開市 立券交易 '
                          '納財 開倉庫出貨財), derived from canonical authority',
                 'evidence': ['06067692-n86 卯-丁丑', '06067694-n10 午-戊辰'],
                 'directCells': '開市 立券交易 納財 on both pages',
                 'measured2025_2027': {'testedTrigger': 30, 'untestedOnly': 0, 'kaicangOverlapWith五虛': 7},
                 'provenance': 'OWNER_RULING backed by direct source evidence'},
        'R-WX': {'decision': 'ADOPT', 'god': '五虛',
                 'rule': 'For 五虛 × 開倉庫出貨財, generic puzhu:06 Q4 triggers do NOT remove 五虛\'s 忌 unless an '
                         'independently established 五虛-specific lifter applies.',
                 'scope': '五虛 × 開倉庫出貨財 exactly',
                 'evidence': ['06067692-n126 卯-丁巳', '06067694-n50 午-戊申', '06067697-n8 子-丙寅'],
                 'triggersTested': ['月恩', '四相', '時德 (alone on 子-丙寅)'],
                 'untested': '天赦 (source: never coincides with 五虛)',
                 'provenance': 'OWNER_RULING backed by direct source evidence'},
        'R-XH': {'decision': 'ADOPT', 'god': '小耗',
                 'rule': "For 小耗's own prohibited headings, generic puzhu:06 Q4 triggers do NOT remove 小耗's 忌 "
                         'unless an independently established 小耗-specific lifter applies.',
                 'scope': '小耗 × its own prohibited headings (currently 開市 立券交易 納財 開倉庫出貨財)',
                 'evidence': ['06067693-n107 巳-戊戌', '06067696-n45 戌-癸卯'], 'cleanCells': 7,
                 'triggersTested': ['四相'], 'measured2025_2027': {'rowsWith四相': 9},
                 'unchanged': '子午卯酉 months + 劫煞 → 猶忌',
                 'provenance': 'OWNER_RULING backed by direct source evidence'},
        'R-F1Y': {'decision': 'ADOPT_ALL_21', 'god': '五離',
                  'rule': 'For 五離 × 立券交易, when 五離\'s 忌 survives, 五離 is the only surviving 忌 for the heading, '
                          'and an independent 宜 also applies, the final source state is only_ji, not both_present.',
                  'scope': 'all 21 measured production rows satisfying the exact predicate; no hard-coded dates',
                  'evidence': ['06067694-n50 午-戊申 (宜 滿日)', '06067697-n93 丑-甲申 (宜 五富)'],
                  'control': 'the same 宜 source prints on 開市 and 納財 on both pages',
                  'notGeneralizedTo': ['other 五離 headings', 'other gods', 'U4', 'U7', '百忌', 'global Y composition'],
                  'provenance': 'OWNER_RULING backed by direct source evidence'},
    },
    'scopedY': {'rule': 'for heading rows whose 忌 survives specifically because of R-JK/R-WX/R-XH and that also carry '
                        '宜, the migrated state is only_ji (tag Q4_REST_OWNER_ONLY_JI); not the global Y-CONVENTION',
                'ownerTextCount': '44 heading rows only_yi → both_present under J alone (Stage 2C, per-ruling sum)',
                'measuredCombined': 37,
                'note': 'the owner text sums the single-ruling transitions (27 + 14 + 3); the 7 joint 九空+五虛 開倉庫 '
                        'rows are counted twice there. Combined J alone gives 37 such rows (prediction.json)'},
    'nonDecisions': ['global GOD-NARROW', 'global Y-CONVENTION', 'U4 migration', 'U7 migration', 'BAIJI-Y migration',
                     '五墓 changes', 'P21 changes'],
    'unchanged': ['五墓 and Q4a', 'F1 R2 J-axis', 'G2/W1 CLOSED', 'P21 open'],
    'provenanceRule': 'source-witness provenance stays page/cell specific; extrapolated production rows are never '
                      'SOURCE_WITNESSED',
    'evidenceRefs': {s: str(S2C / f) for s, f in (('packets', 'owner-packets.json'), ('drafts', 'draft-rulings.json'),
                                                  ('diagnostic', 'diagnostic-impact.json'))},
}


def summary(pred, s2c):
    def counts(v):
        a, e = v['activity'], v['event']
        return {'decisionRows': len(v['decision']), 'headingRows': len(v['heading']), 'activityRows': len(a),
                'eventRows': len(e),
                'statusChanges': sum(x['production']['status'] != x['model']['status'] for x in a),
                'activityScoreChanges': sum(x['production']['score'] != x['model']['score'] for x in a),
                'hardWarningChanges': sum(x['production']['hardWarning'] != x['model']['hardWarning'] for x in a),
                'eventClassificationChanges': sum(x['production']['classification'] != x['model']['classification']
                                                  for x in e),
                'eventScoreChanges': sum(x['production']['score'] != x['model']['score'] for x in e),
                'headingTransitions': dict(collections.Counter(
                    f"{(x['production'] or {}).get('state')}→{(x['model'] or {}).get('state')}" for x in v['heading']))}
    key = {'decision': lambda x: (x['date'], x['heading']), 'heading': lambda x: (x['date'], x['heading']),
           'activity': lambda x: (x['date'], x['activityId']), 'event': lambda x: (x['date'], x['event'])}
    c_all, c_f1y = s2c['all'], s2c['f1y']
    recon = {}
    for k, f in key.items():
        full = {f(x): x for x in pred['full'][k]}
        two_c = {f(x): x for x in c_all[k]}
        recon[k] = {'sameKeys': set(full) == set(two_c),
                    'identicalRows': sum(json.dumps(full[q], sort_keys=True) == json.dumps(two_c[q], sort_keys=True)
                                         for q in full if q in two_c),
                    'rows': len(full)}
    j_keys = {key['heading'](x) for x in pred['jOnly']['heading']}
    f_keys = {key['heading'](x) for x in c_f1y['heading']}
    a_keys = {key['heading'](x) for x in c_all['heading']}
    jonly_decisions_equal = json.dumps(pred['jOnly']['decision'], sort_keys=True) == \
        json.dumps(c_all['decision'], sort_keys=True)
    out = {'version': 'q4-rest-stage3-prediction-v1', 'takenOn': 'p4b-puzhu06-v4 tree, before any Stage 3 engine code',
           'baselineDays': len(pred['baseline']),
           'baselineDigest': hashlib.sha256(json.dumps(pred['baseline'], sort_keys=True).encode()).hexdigest(),
           'jOnly': counts(pred['jOnly']), 'full': counts(pred['full']),
           'stage2C': {'reproduced': jonly_decisions_equal and (j_keys | f_keys) == a_keys and not (j_keys & f_keys),
                       'how': 'J-only decisions equal 2C combined row for row; J-only heading rows ∪ 2C R-F1Y heading '
                              'rows = 2C combined heading rows (disjoint)'},
           'fullVs2C': recon,
           'explainedDifference': 'full differs from 2C combined only in model values on the scoped-Y rows: 37 heading '
                                  'rows only_yi→only_ji (2C J-only gave both_present) and their activity/event '
                                  'consequences; keys and counts are identical'}
    assert out['stage2C']['reproduced'], 'Stage 2C not reproduced'
    assert all(r['sameKeys'] for r in recon.values())
    assert out['full']['headingTransitions'] == {'only_yi→only_ji': 37, 'both_present→only_ji': 21,
                                                 'not_recorded→only_ji': 16}, out['full']['headingTransitions']
    assert recon['heading']['rows'] - recon['heading']['identicalRows'] == 37
    return out


def main():
    pred = json.loads(PRED.read_text(encoding='utf-8'))
    assert pred['authority'] == 'p4b-puzhu06-v4'
    s2c = json.loads((S2C / 'runtime.json').read_text(encoding='utf-8'))['impact']
    outs = {HERE / 'owner-ruling.json': json.dumps(RULING, ensure_ascii=False, indent=1) + '\n',
            HERE / 'prediction-summary.json': json.dumps(summary(pred, s2c), ensure_ascii=False, indent=1) + '\n'}
    files = [PRED, HERE / 'build_ruling.py', HARNESS, S2C / 'runtime.json', S2C / 'lock.json',
             Path('shared/almanac-data/p4b-puzhu06-v4.json')]
    lock = {'version': 'q4-rest-stage3-ruling-lock-v1',
            'files': {**{str(p): hashlib.sha256(t.encode()).hexdigest() for p, t in outs.items()},
                      **{str(p): sha(p) for p in files}}}
    outs[HERE / 'ruling-lock.json'] = json.dumps(lock, ensure_ascii=False, indent=1) + '\n'
    for p, t in outs.items():
        if '--write' in sys.argv:
            p.write_text(t, encoding='utf-8')
        elif p.read_text(encoding='utf-8') != t:
            raise SystemExit(f'{p} differs; run with --write')
    print('OK owner ruling + prediction frozen')


if __name__ == '__main__':
    main()
