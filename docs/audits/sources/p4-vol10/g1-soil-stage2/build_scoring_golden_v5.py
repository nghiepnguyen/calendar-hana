"""G1-SOIL Stage 2: 卷十 Scoring Golden v5 from the frozen v4 (golden-xieji-vol10-scoring-v4.json, sha-asserted).

    python3 -I docs/audits/sources/p4-vol10/g1-soil-stage2/build_scoring_golden_v5.py [--write]

Lineage: 卷十 Scoring Golden (golden-xieji-vol10-scoring*); the P4 Score Golden is untouched. v4 stays
byte-frozen as G1-SOIL rollback evidence (xiejiVol10ScoringV4.test.ts runs it on authority v3).

v4's static case model cannot express a date-dependent cell, so v5 cases for the 5 APPLIED_DATE_DEPENDENT contexts
carry an explicit `soilState` and a real civil `date` (the harness checks both as calendar facts). Per context,
one inside and one outside date: the first scope date ≥ 2028-01-01 in each state (scope-dates.json ×
the frozen independent calendar soil-calendar.json). Expectations come from authority v4 alone (selector cells),
never from production output. One more case: a date-dependent lookup without a date throws.
--write writes the file (then `npx prettier --write` it) and golden-diff.json; default verifies.
"""
import copy
import hashlib
import json
import sys
from datetime import date, timedelta
from pathlib import Path

V4 = Path('shared/almanac-data/golden-xieji-vol10-scoring-v4.json')
V5 = Path('shared/almanac-data/golden-xieji-vol10-scoring-v5.json')
AUTH = Path('shared/almanac-data/xieji-vol10-jiesha-authority-v4.json')
CAL = Path('docs/audits/sources/p4-vol10/g1-soil-stage1/soil-calendar.json')
SCOPE = Path('docs/audits/sources/p4-vol10/puzhu17-bujiang-v1/scope-dates.json')
DIFF = Path('docs/audits/sources/p4-vol10/g1-soil-stage2/golden-diff.json')
V4_SHA = '9d69d74f14a673e1698ca6b4e81e9881a2dc7189ba0c9626c13bc87e60dc53da'
ORDER = ['丑甲寅', '丑丙寅', '丑壬寅', '丑戊寅', '未戊申']
IDS = {'丑甲寅': 'chou-jiayin', '丑丙寅': 'chou-bingyin', '丑壬寅': 'chou-renyin', '丑戊寅': 'chou-wuyin',
       '未戊申': 'wei-wushen'}

raw = V4.read_bytes()
assert hashlib.sha256(raw).hexdigest() == V4_SHA, '卷十 Scoring Golden v4 changed'
v4 = json.loads(raw)
auth_raw = AUTH.read_bytes()
auth = json.loads(auth_raw)
assert auth['version'] == 'xieji-vol10-jiesha-faithful-v4'
cov = auth['runtimeCoverage']['activities']['demolition']['contexts']
inside = set()
for ws in json.loads(CAL.read_text(encoding='utf-8'))['windows'].values():
    for w in ws:
        d = date.fromisoformat(w['onset'])
        while d <= date.fromisoformat(w['eve']):
            inside.add(d.isoformat())
            d += timedelta(1)
scope = json.loads(SCOPE.read_text(encoding='utf-8'))
kiep = [{'source': 'bad_god', 'ruleId': 'kiep_sat', 'delta': -15}]


def case(ctx, state):
    e = cov[ctx]
    assert e['status'] == 'APPLIED_DATE_DEPENDENT' and e['selector'] == 'tho-vuong-dung-su-rule-v1'
    assert 'demolition' not in auth['cells'][ctx]
    d = next(x for x in sorted(scope[ctx[0] + '-' + ctx[1:]]) if x >= '2028-01-01' and (x in inside) == (state == 'inside'))
    avoid = e['cells'][state] == 'avoid'
    return {
        'id': f"jie-{IDS[ctx]}-demolition-{state}", 'month': ctx[0], 'pillar': ctx[1:], 'officer': 'tru',
        'gods': ['kiep_sat'], 'activity': 'demolition', 'date': d, 'soilState': state, 'rows': kiep,
        'expect': {'verdicts': {'jie_sha': 'avoid' if avoid else 'no_annotation'},
                   'rows': [{'source': 'bad_god', 'ruleId': 'kiep_sat', 'scoreDelta': -15 if avoid else 0,
                             'status': 'applied' if avoid else 'informational'}],
                   'added': []},
        'derivation': (f"G1-SOIL Stage 2 (authority v4, R2): {ctx} demolition APPLIED_DATE_DEPENDENT, selector "
                       f"tho-vuong-dung-su-rule-v1, {state} 土王用事 → cell {e['cells'][state]}"),
    }


new = [case(c, s) for c in ORDER for s in ('inside', 'outside')]
no_date = {'id': 'jie-chou-renyin-demolition-no-date', 'month': '丑', 'pillar': '壬寅', 'officer': 'tru',
           'gods': ['kiep_sat'], 'activity': 'demolition', 'rows': kiep,
           'expect': {'throws': 'needs a civil date'},
           'derivation': 'G1-SOIL Stage 2: a date-dependent lookup without a civil date fails loud (no silent cell)'}

v5 = copy.deepcopy(v4)
v5['version'] = 'xieji-vol10-scoring-golden-v5'
v5['status'] = ('FROZEN 2026-10-25 before the G1-SOIL Stage 2 switch (劫煞 authority v4, R2); derived from authority '
                'v4 selector cells and the frozen 土王用事 calendar, never regenerate from production')
v5['supersedes'] = 'golden-xieji-vol10-scoring-v4.json (xieji-vol10-scoring-golden-v4, G1-SOIL rollback evidence)'
v5['provenance']['runtimeMigration'] = (
    'authority v4 (shared/almanac-data/xieji-vol10-jiesha-authority-v4.json): v3 + 5 demolition contexts '
    'APPLIED_DATE_DEPENDENT (selector tho-vuong-dung-su-rule-v1)')
v5['provenance']['demolition'] = (
    'APPLIED_BY_CONTEXT (G1-SOIL Stage 2, R2): 11 contexts static avoid; 丑甲寅/丑丙寅/丑壬寅/丑戊寅/未戊申 '
    'APPLIED_DATE_DEPENDENT, inside 土王用事 avoid, outside blank')
v5['provenance']['caseFormat'] = 'date-dependent cases carry date + soilState (calendar facts checked by the harness)'
v5['provenance']['authorityV4Sha256'] = hashlib.sha256(auth_raw).hexdigest()
v5['provenance']['generator'] = 'docs/audits/sources/p4-vol10/g1-soil-stage2/build_scoring_golden_v5.py'
i = next(k for k, c in enumerate(v5['cases']) if c['id'] == 'jie-chou-renyin-demolition-excluded')
v5['cases'][i:i + 1] = new + [no_date]
kept = [c for c in v5['cases'] if c not in new and c is not no_date]
assert kept == [c for c in v4['cases'] if c['id'] != 'jie-chou-renyin-demolition-excluded']

diff = {
    'version': 'g1-soil-stage2-golden-diff-v1',
    'lineage': '卷十 Scoring Golden (golden-xieji-vol10-scoring*); P4 Score Golden v4 unchanged',
    'from': {'path': str(V4), 'version': v4['version'], 'sha256': V4_SHA, 'cases': len(v4['cases'])},
    'to': {'path': str(V5), 'version': v5['version'], 'cases': len(v5['cases'])},
    'inputs': {str(AUTH): hashlib.sha256(auth_raw).hexdigest(),
               str(CAL): hashlib.sha256(CAL.read_bytes()).hexdigest(),
               str(SCOPE): hashlib.sha256(SCOPE.read_bytes()).hexdigest()},
    'removed': ['jie-chou-renyin-demolition-excluded'],
    'added': [{'id': c['id'], 'date': c.get('date'), 'soilState': c.get('soilState'), 'expect': c['expect']}
              for c in new + [no_date]],
    'unrelatedCasesChanged': 0,
}


def main():
    text = json.dumps(diff, ensure_ascii=False, indent=1) + '\n'
    if '--write' in sys.argv:
        V5.write_text(json.dumps(v5, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        DIFF.write_text(text, encoding='utf-8')
        return
    assert json.loads(V5.read_text(encoding='utf-8')) == v5, '卷十 Scoring Golden v5 differs from v4 + R2 derivation'
    assert DIFF.read_text(encoding='utf-8') == text, 'golden-diff.json differs'
    print('卷十 Scoring Golden v5 = v4 − 1 + 11 cases;', len(v5['cases']), 'cases;',
          hashlib.sha256(V5.read_bytes()).hexdigest())


if __name__ == '__main__':
    main()
