"""G1 glyph Stage 2: the shipped Production Access Matrix, read from authority v3 (no production output).

    python3 -I docs/audits/sources/p4-vol10/g1-glyph-stage2/build_access_matrix.py [--write]

APPLIED ⇔ identityApproved ∧ authorityApproved ∧ productionApproved (asserted per context).
"""
import hashlib
import json
import sys
from pathlib import Path

OUT = Path('docs/audits/sources/p4-vol10/g1-glyph-stage2/production-access-matrix.json')
V3 = Path('shared/almanac-data/xieji-vol10-jiesha-authority-v3.json')
a = json.loads(V3.read_text(encoding='utf-8'))
cov = a['runtimeCoverage']['activities']
rows = []
for act in sorted(cov):
    c = cov[act]
    if c['status'] == 'APPLIED_BY_CONTEXT':
        for key, e in sorted(c['contexts'].items()):
            approved = all(e[k] is True for k in ('identityApproved', 'authorityApproved', 'productionApproved'))
            assert (e['status'] == 'APPLIED') == approved, key
            rows.append({'activity': act, 'context': key, 'access': e['status'], 'cell': a['cells'][key].get(act),
                         'grade': e['grade'], 'identityApproved': e['identityApproved'],
                         'authorityApproved': e['authorityApproved'], 'productionApproved': e['productionApproved'],
                         **({'reason': e['reason'], 'debt': e['debt']} if 'reason' in e else {})})
    else:
        for key in sorted(a['cells']):
            rows.append({'activity': act, 'context': key, 'access': c['status'], 'cell': a['cells'][key].get(act),
                         'identityApproved': True, 'authorityApproved': c['status'] == 'APPLIED',
                         'productionApproved': c['status'] == 'APPLIED'})
summary = {}
for r in rows:
    s = summary.setdefault(r['activity'], {})
    s[r['access']] = s.get(r['access'], 0) + 1
assert summary['demolition'] == {'APPLIED': 11, 'EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY': 5}
assert all(v == {'APPLIED': 16} for k, v in summary.items() if k != 'demolition')
doc = {'version': 'g1-glyph-stage2-production-access-v1', 'authority': a['version'],
       'authoritySha256': hashlib.sha256(V3.read_bytes()).hexdigest(),
       'rule': 'APPLIED ⇔ identityApproved ∧ authorityApproved ∧ productionApproved; resolver reachable ≠ applicable',
       'transition': {'demolition': 'EXCLUDED_PENDING_GLYPH_AUDIT (v2) → APPLIED ×11 + '
                                    'EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY ×5 (v3)'},
       'summary': summary, 'rows': rows}
text = json.dumps(doc, ensure_ascii=False, indent=1) + '\n'
if '--write' in sys.argv:
    OUT.write_text(text, encoding='utf-8')
else:
    assert OUT.read_text(encoding='utf-8') == text, 'production-access-matrix.json differs'
    print('access matrix ok', summary['demolition'])
