"""G1-SOIL Stage 2 (R2): 卷十 劫煞 authority v4 from the frozen v3 + the Stage 1 candidate table.

    python3 -I docs/audits/sources/p4-vol10/g1-soil-stage2/build_authority_v4.py [--write]

Spec: docs/audits/p4-g1-soil-stage2-spec.md (owner ruling 2026-10-25). v4 = v3 with the 5 demolition contexts
moved from EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY to APPLIED_DATE_DEPENDENT: selector
tho-vuong-dung-su-rule-v1, cells {inside: avoid, outside: blank}, grade B, all three approvals true, and still no
static cell in the table (counts unchanged). Every other cell, count and coverage entry is copied. Inputs are
sha-asserted; production output is never read. --write writes the authority and authority-v3-v4.json (then
`npx prettier --write` the authority); default verifies both.
"""
import copy
import hashlib
import json
import sys
from pathlib import Path

V3 = Path('shared/almanac-data/xieji-vol10-jiesha-authority-v3.json')
V4 = Path('shared/almanac-data/xieji-vol10-jiesha-authority-v4.json')
CAND = Path('docs/audits/sources/p4-vol10/g1-soil-stage1/authority-candidate.json')
STAGE1_LOCK = Path('docs/audits/sources/p4-vol10/g1-soil-stage1/lock.json')
DIFF = Path('docs/audits/sources/p4-vol10/g1-soil-stage2/authority-v3-v4.json')
V3_SHA = '4b6d2c7c241c521a719fb1733ddffd6cbd2a283da441a3324158a4476b8446fe'  # shipped d5c005f
SELECTOR = 'tho-vuong-dung-su-rule-v1'
EXCLUDED = ['丑甲寅', '丑丙寅', '丑壬寅', '丑戊寅', '未戊申']

assert hashlib.sha256(V3.read_bytes()).hexdigest() == V3_SHA, 'authority v3 changed'
pinned = {f['path']: f['sha256'] for f in json.loads(STAGE1_LOCK.read_text(encoding='utf-8'))['files']}
assert hashlib.sha256(CAND.read_bytes()).hexdigest() == pinned[str(CAND)], 'Stage 1 candidate changed'
v3 = json.loads(V3.read_text(encoding='utf-8'))
cand = json.loads(CAND.read_text(encoding='utf-8'))['contexts']

v4 = copy.deepcopy(v3)
v4['version'] = 'xieji-vol10-jiesha-faithful-v4'
ctxs = v4['runtimeCoverage']['activities']['demolition']['contexts']
for k in EXCLUDED:
    assert ctxs[k]['status'] == 'EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY' and 'demolition' not in v4['cells'][k]
    c = cand[k]
    assert (c['outside']['cell'], c['inside']['cell']) == ('blank', 'avoid'), k
    ctxs[k] = {
        'status': 'APPLIED_DATE_DEPENDENT',
        'selector': SELECTOR,
        'cells': {'inside': 'avoid', 'outside': 'blank'},
        'grade': 'B',
        'gradeDetail': {'outside': c['outside']['grade'], 'inside': 'B', 'rule': 'B'},
        'identityApproved': True, 'authorityApproved': True, 'productionApproved': True,
    }
v4['runtimeCoverage']['projection'] = (
    'faithful-v4: v3 + the 5 date-dependent demolition contexts APPLIED_DATE_DEPENDENT (selector '
    'tho-vuong-dung-su-rule-v1: inside 土王用事 avoid, outside blank); G1-SOIL Stage 2, '
    'docs/audits/p4-g1-soil-stage2-spec.md')
v4['provenance']['supersedes'] = {'path': str(V3), 'sha256': V3_SHA, 'version': v3['version']}
v4['provenance']['g1Soil'] = {
    'spec': 'docs/audits/p4-g1-soil-stage2-spec.md (owner ruling 2026-10-25)',
    'stage1': 'docs/audits/p4-g1-soil-authority.md',
    'candidate': {'path': str(CAND), 'sha256': pinned[str(CAND)]},
    'selector': f'{SELECTOR}: shared/lunar/thoVuongDungSuRule.ts (calendar-rule service)',
    'limitation': 'no dated 時憲書 witness; grade B, not A',
}
v4['provenance']['generator'] = 'docs/audits/sources/p4-vol10/g1-soil-stage2/build_authority_v4.py'

# Nothing else may move: cells, counts and every other coverage entry equal v3.
assert v4['cells'] == v3['cells'] and v4['counts'] == v3['counts'] and v4['activities'] == v3['activities']
assert {a: c for a, c in v4['runtimeCoverage']['activities'].items() if a != 'demolition'} == \
    {a: c for a, c in v3['runtimeCoverage']['activities'].items() if a != 'demolition'}
dem = v4['runtimeCoverage']['activities']['demolition']
assert dem['status'] == 'APPLIED_BY_CONTEXT'
assert sorted(k for k, c in dem['contexts'].items() if c['status'] == 'APPLIED') == sorted(
    k for k, c in v3['runtimeCoverage']['activities']['demolition']['contexts'].items() if c['status'] == 'APPLIED')
assert sorted(k for k, c in dem['contexts'].items() if c['status'] == 'APPLIED_DATE_DEPENDENT') == sorted(EXCLUDED)
assert not [k for k, c in dem['contexts'].items() if c['status'] == 'EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY']

diff = {
    'version': 'g1-soil-stage2-authority-diff-v1',
    'from': {'path': str(V3), 'version': v3['version'], 'sha256': V3_SHA},
    'to': {'path': str(V4), 'version': v4['version']},
    'demolitionContexts': {'APPLIED (static, unchanged)': 11,
                           'EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY → APPLIED_DATE_DEPENDENT': EXCLUDED},
    'selector': SELECTOR, 'selectorCells': {'inside': 'avoid', 'outside': 'blank'},
    'cellsChanged': 0, 'countsChanged': False, 'otherCoverageChanged': 0,
}


def main():
    text = json.dumps(diff, ensure_ascii=False, indent=1) + '\n'
    if '--write' in sys.argv:
        V4.write_text(json.dumps(v4, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        DIFF.write_text(text, encoding='utf-8')
        return
    assert json.loads(V4.read_text(encoding='utf-8')) == v4, 'authority v4 differs from v3 + R2'
    assert DIFF.read_text(encoding='utf-8') == text, 'authority-v3-v4.json differs'
    print('authority v4 = v3 + 5 APPLIED_DATE_DEPENDENT;', hashlib.sha256(V4.read_bytes()).hexdigest())


if __name__ == '__main__':
    main()
