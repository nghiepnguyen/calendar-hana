"""G1 glyph Stage 2: 卷十 Scoring Golden v4 from the frozen v3 (golden-xieji-vol10-scoring-v3.json, sha-asserted).

    python3 -I docs/audits/sources/p4-vol10/g1-glyph-stage2/build_scoring_golden_v4.py [--write]

Lineage: 卷十 Scoring Golden (golden-xieji-vol10-scoring*), not the P4 Score Golden (p4-score-golden-v*), which
G1 glyph Stage 2 does not touch (docs/audits/p4-g1-glyph-stage2-spec.md §10). v3 stays byte-frozen as the
G1 glyph rollback evidence (xiejiVol10ScoringV3.test.ts runs it on the authority v2 graph).

v4 = v3 with every demolition × 劫煞-authority case re-derived from authority v3 (sha-asserted) cells and
context coverage, never from production output:
  APPLIED context    cell avoid → 劫煞 avoid → kiep_sat −15 applied; cell blank → no_annotation, informational
  EXCLUDED context   EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY → legacy no_annotation, informational (no cell)
The builder selects the cases (demolition, 劫煞 present, 辰戌丑未 authority context), re-derives them, adds one
excluded-context case, and asserts that nothing else differs. --write writes the file (then
`npx prettier --write` it); default verifies it.
"""
import copy
import hashlib
import json
import sys
from pathlib import Path

V3 = Path('shared/almanac-data/golden-xieji-vol10-scoring-v3.json')
V4 = Path('shared/almanac-data/golden-xieji-vol10-scoring-v4.json')
AUTH = Path('shared/almanac-data/xieji-vol10-jiesha-authority-v3.json')
DIFF = Path('docs/audits/sources/p4-vol10/g1-glyph-stage2/golden-diff.json')
V3_SHA = 'cb18c3c2df864350ac5bccc707f76913d3e9d02bc98d83faf2a58e9c67944e78'
EXCLUDED = 'EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY'

raw = V3.read_bytes()
assert hashlib.sha256(raw).hexdigest() == V3_SHA, '卷十 Scoring Golden v3 changed'
v3 = json.loads(raw)
auth_raw = AUTH.read_bytes()
auth = json.loads(auth_raw)
assert auth['version'] == 'xieji-vol10-jiesha-faithful-v3'
cov = auth['runtimeCoverage']['activities']['demolition']['contexts']
kiep = [{'source': 'bad_god', 'ruleId': 'kiep_sat', 'delta': -15}]


def derive(case):
    """One demolition case from authority v3 alone."""
    ctx = cov[case['month'] + case['pillar']]
    if ctx['status'] == 'APPLIED':
        cell = auth['cells'][case['month'] + case['pillar']]['demolition']
        assert cell == ctx['cell']
        avoid = cell == 'avoid'
        why = (f"G1 glyph Stage 2 (authority v3, R3): {case['month']}{case['pillar']} demolition APPLIED, cell = "
               f"{cell} (grade {ctx['grade']})")
    else:
        assert ctx['status'] == EXCLUDED and 'demolition' not in auth['cells'][case['month'] + case['pillar']]
        avoid = False
        why = (f"G1 glyph Stage 2 (authority v3, R3): {case['month']}{case['pillar']} demolition {EXCLUDED} "
               '(no cell; G1-SOIL): legacy cancel_both kept')
    return {
        **case,
        'rows': kiep,
        'expect': {'verdicts': {'jie_sha': 'avoid' if avoid else 'no_annotation'},
                   'rows': [{'source': 'bad_god', 'ruleId': 'kiep_sat', 'scoreDelta': -15 if avoid else 0,
                             'status': 'applied' if avoid else 'informational'}],
                   'added': []},
        'derivation': why,
    }


def in_authority(c):
    return (c['activity'] == 'demolition' and 'kiep_sat' in c['gods'] and c['month'] in '辰戌丑未'
            and c['month'] + c['pillar'] in cov and set(c['gods']) == {'kiep_sat'})


v4 = copy.deepcopy(v3)
v4['version'] = 'xieji-vol10-scoring-golden-v4'
v4['status'] = ('FROZEN 2026-10-25 before the G1 glyph Stage 2 switch (劫煞 authority v3, R3); derived from '
                'authority v3 cells and context coverage, never regenerate from production')
v4['supersedes'] = 'golden-xieji-vol10-scoring-v3.json (xieji-vol10-scoring-golden-v3, G1 glyph rollback evidence)'
v4['provenance']['runtimeMigration'] = (
    'authority v3 (shared/almanac-data/xieji-vol10-jiesha-authority-v3.json runtimeCoverage): v2 + demolition '
    'APPLIED_BY_CONTEXT (11 APPLIED, 5 EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY)')
v4['provenance']['demolition'] = (
    'APPLIED_BY_CONTEXT (G1 glyph Stage 2, R3): 11 contexts cell avoid; 丑甲寅/丑丙寅/丑壬寅/丑戊寅/未戊申 '
    'EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY, legacy cancel_both kept (G1-SOIL)')
v4['provenance']['normalization'] = 'unchanged (NORM 壞→壊, no new alias)'
v4['provenance']['authorityV3Sha256'] = hashlib.sha256(auth_raw).hexdigest()
v4['provenance']['generator'] = 'docs/audits/sources/p4-vol10/g1-glyph-stage2/build_scoring_golden_v4.py'

renames = {'jie-chen-demolition-excluded': 'jie-chen-demolition-applied'}
changed = []
for i, c in enumerate(v4['cases']):
    if in_authority(c):
        new = derive({**c, 'id': renames.get(c['id'], c['id'])})
        changed.append({'from': c, 'to': new})
        v4['cases'][i] = new
excluded_case = derive({'id': 'jie-chou-renyin-demolition-excluded', 'month': '丑', 'pillar': '壬寅',
                        'officer': 'tru', 'gods': ['kiep_sat'], 'activity': 'demolition'})
at = next(i for i, c in enumerate(v4['cases']) if c['id'] == 'jie-chen-demolition-applied')
v4['cases'].insert(at + 1, excluded_case)

# The builder, not grep, decides the diff: assert it is exactly what the derivation selected.
assert [x['from']['id'] for x in changed] == ['jie-chen-demolition-excluded'], [x['from']['id'] for x in changed]
untouched = [c for c in v4['cases'] if c['id'] not in ('jie-chen-demolition-applied', excluded_case['id'])]
assert untouched == [c for c in v3['cases'] if c['id'] != 'jie-chen-demolition-excluded']

diff = {
    'version': 'g1-glyph-stage2-golden-diff-v1',
    'lineage': '卷十 Scoring Golden (golden-xieji-vol10-scoring*); P4 Score Golden v4 unchanged',
    'from': {'path': str(V3), 'version': v3['version'], 'sha256': V3_SHA, 'cases': len(v3['cases'])},
    'to': {'path': str(V4), 'version': v4['version'], 'cases': len(v4['cases'])},
    'inputs': {str(AUTH): hashlib.sha256(auth_raw).hexdigest()},
    'selection': 'demolition × kiep_sat only × 辰戌丑未 context in authority v3 coverage',
    'rederived': [{'id': x['from']['id'], 'newId': x['to']['id'], 'expectBefore': x['from']['expect'],
                   'expectAfter': x['to']['expect']} for x in changed],
    'added': [{'id': excluded_case['id'], 'expect': excluded_case['expect']}],
    'removed': [],
    'affectedRule': 'kiep_sat (劫煞 jie_sha verdict)',
    'affectedActivity': 'demolition',
    'unrelatedCasesChanged': 0,
}


def main():
    text = json.dumps(diff, ensure_ascii=False, indent=1) + '\n'
    if '--write' in sys.argv:
        V4.write_text(json.dumps(v4, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        DIFF.write_text(text, encoding='utf-8')
        return
    assert json.loads(V4.read_text(encoding='utf-8')) == v4, '卷十 Scoring Golden v4 differs from v3 + R3 derivation'
    assert DIFF.read_text(encoding='utf-8') == text, 'golden-diff.json differs'
    print('卷十 Scoring Golden v4 = v3 with', len(changed), 're-derived + 1 added;', len(v4['cases']), 'cases;',
          hashlib.sha256(V4.read_bytes()).hexdigest())


if __name__ == '__main__':
    main()
