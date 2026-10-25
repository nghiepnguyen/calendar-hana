"""G1 glyph Stage 2 (R3): 卷十 劫煞 authority v3 from the frozen v2 + the Stage 1 candidate table.

    python3 -I docs/audits/sources/p4-vol10/g1-glyph-stage2/build_authority_v3.py [--write]

Spec: docs/audits/p4-g1-glyph-stage2-spec.md §3 (owner ruling 2026-10-25, R3). v3 = v2 plus demolition with
context-level coverage: the 11 date-invariant contexts APPLIED (cell avoid, Stage 1 grade, all three approvals
true); the 5 date-dependent contexts EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY with no cell at all (G1-SOIL,
docs/audits/p4-g1-demolition-soil-authority-item.md). Every other cell, count and coverage entry is copied.
Inputs are sha-asserted; production output is never read. --write writes the authority and
authority-v2-v3.json (then `npx prettier --write` the authority); default verifies both.
"""
import copy
import hashlib
import json
import sys
from pathlib import Path

V2 = Path('shared/almanac-data/xieji-vol10-jiesha-authority-v2.json')
V3 = Path('shared/almanac-data/xieji-vol10-jiesha-authority-v3.json')
CAND = Path('docs/audits/sources/p4-vol10/g1-glyph-stage1/authority-candidate.json')
DIFF = Path('docs/audits/sources/p4-vol10/g1-glyph-stage2/authority-v2-v3.json')
V2_SHA = '4184778d9f4dea8c9e446b29f6c45f6f26c2002477ceec64606d42460eac8baf'  # shipped f3c68c6
STAGE1_LOCK = Path('docs/audits/sources/p4-vol10/g1-glyph-stage1/lock.json')
EXCLUDED = 'EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY'

assert hashlib.sha256(V2.read_bytes()).hexdigest() == V2_SHA, 'authority v2 changed'
pinned = {f['path']: f['sha256'] for f in json.loads(STAGE1_LOCK.read_text(encoding='utf-8'))['files']}
assert hashlib.sha256(CAND.read_bytes()).hexdigest() == pinned[str(CAND)], 'Stage 1 candidate changed'
v2 = json.loads(V2.read_text(encoding='utf-8'))
cand = json.loads(CAND.read_text(encoding='utf-8'))['contexts']
assert v2['runtimeCoverage']['activities']['demolition']['status'] == 'EXCLUDED_PENDING_GLYPH_AUDIT'
assert 'demolition' not in v2['activities'] and len(cand) == 16

v3 = copy.deepcopy(v2)
v3['version'] = 'xieji-vol10-jiesha-faithful-v3'
v3['activities'] = sorted(v2['activities'] + ['demolition'])
contexts = {}
for ctx, x in sorted(cand.items()):
    key = ctx.replace('-', '')
    assert key in v3['cells'], ctx
    if not x['dateDependent']:
        assert x['cellSoilAbsent'] == x['cellSoilPresent'] == 'avoid' and x['gradeSoilAbsent'] in ('A', 'B'), ctx
        v3['cells'][key]['demolition'] = 'avoid'
        contexts[key] = {'status': 'APPLIED', 'cell': 'avoid', 'grade': x['gradeSoilAbsent'],
                         'identityApproved': True, 'authorityApproved': True, 'productionApproved': True}
    else:
        g = x['gradeSoilPresent']
        contexts[key] = {
            'status': EXCLUDED,
            'grade': {'outOfWindow': x['gradeSoilAbsent'], 'inWindow2025_2027': g['2025-2027'],
                      'inWindowOutside': g['outside']},
            'identityApproved': True, 'authorityApproved': False, 'productionApproved': False,
            'reason': ('cell depends on 土王用事 (blank out of window, avoid in window); not representable per '
                       'Month Jian + pillar'),
            'debt': 'G1-SOIL',
        }
values = [v for row in v3['cells'].values() for v in row.values()]
v3['counts'] = {'contexts': 16, 'activities': 25, 'cells': len(values),
                'avoid': values.count('avoid'), 'blank': values.count('blank')}
v3['runtimeCoverage']['projection'] = (
    'faithful-v3: v2 + demolition APPLIED in 11 contexts; 5 date-dependent contexts '
    'EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY (G1 glyph Stage 2, R3; docs/audits/p4-g1-glyph-stage2-spec.md)')
v3['runtimeCoverage']['activities']['demolition'] = {'status': 'APPLIED_BY_CONTEXT', 'contexts': contexts}
v3['provenance']['supersedes'] = {'path': str(V2), 'sha256': V2_SHA, 'version': v2['version']}
v3['provenance']['g1Glyph'] = {
    'spec': 'docs/audits/p4-g1-glyph-stage2-spec.md (owner ruling 2026-10-25, R3)',
    'stage1': 'docs/audits/p4-g1-demolition-glyph-authority.md',
    'candidate': {'path': str(CAND), 'sha256': pinned[str(CAND)]},
    'identity': 'SAME_ACTIVITY_ALIAS_CONFIRMED (G1-a, owner 2026-10-24); NORM 壞→壊 unchanged, no alias',
    'deferred': 'docs/audits/p4-g1-demolition-soil-authority-item.md (G1-SOIL)',
}
v3['provenance']['generator'] = 'docs/audits/sources/p4-vol10/g1-glyph-stage2/build_authority_v3.py'

# Frozen R3 shape (spec §3): nothing else may move.
applied = sorted(k for k, c in contexts.items() if c['status'] == 'APPLIED')
excluded = sorted(k for k, c in contexts.items() if c['status'] == EXCLUDED)
assert len(applied) == 11 and len(excluded) == 5
assert sorted(c['grade'] for c in contexts.values() if c['status'] == 'APPLIED') == ['A'] * 7 + ['B'] * 4
assert excluded == sorted(['丑甲寅', '丑丙寅', '丑壬寅', '丑戊寅', '未戊申'])
assert v3['counts'] == {'contexts': 16, 'activities': 25, 'cells': 395, 'avoid': 188, 'blank': 207}
for ctx, row in v3['cells'].items():
    assert {k: v for k, v in row.items() if k != 'demolition'} == v2['cells'][ctx]
    assert ('demolition' in row) == (ctx in applied)
others = {a: c for a, c in v3['runtimeCoverage']['activities'].items() if a != 'demolition'}
assert others == {a: c for a, c in v2['runtimeCoverage']['activities'].items() if a != 'demolition'}

diff = {
    'version': 'g1-glyph-stage2-authority-diff-v1',
    'from': {'path': str(V2), 'version': v2['version'], 'sha256': V2_SHA},
    'to': {'path': str(V3), 'version': v3['version']},
    'coverageChanged': {'demolition': ['EXCLUDED_PENDING_GLYPH_AUDIT', 'APPLIED_BY_CONTEXT']},
    'demolitionContexts': {'APPLIED': applied, EXCLUDED: excluded},
    'grades': {k: contexts[k]['grade'] for k in applied},
    'cellsAdded': {k: 'avoid' for k in applied},
    'cellsChanged': 0,
    'otherCoverageChanged': 0,
    'counts': {'v2': v2['counts'], 'v3': v3['counts']},
}


def main():
    text = json.dumps(diff, ensure_ascii=False, indent=1) + '\n'
    if '--write' in sys.argv:
        V3.write_text(json.dumps(v3, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        DIFF.write_text(text, encoding='utf-8')
        return
    assert json.loads(V3.read_text(encoding='utf-8')) == v3, 'authority v3 differs from v2 + R3'
    assert DIFF.read_text(encoding='utf-8') == text, 'authority-v2-v3.json differs'
    print('authority v3 = v2 + demolition R3 (11 APPLIED / 5 excluded);',
          hashlib.sha256(V3.read_bytes()).hexdigest())


if __name__ == '__main__':
    main()
