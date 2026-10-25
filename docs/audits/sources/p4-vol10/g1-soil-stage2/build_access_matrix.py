"""G1-SOIL Stage 2: the shipped Production Access Matrix, read from authority v4 (no production output).

    python3 -I docs/audits/sources/p4-vol10/g1-soil-stage2/build_access_matrix.py [--write]

APPLIED / APPLIED_DATE_DEPENDENT ⇔ identityApproved ∧ authorityApproved ∧ productionApproved (asserted per context).
"""
import hashlib
import json
import sys
from pathlib import Path

OUT = Path('docs/audits/sources/p4-vol10/g1-soil-stage2/production-access-matrix.json')
V4 = Path('shared/almanac-data/xieji-vol10-jiesha-authority-v4.json')
a = json.loads(V4.read_text(encoding='utf-8'))
rows = []
for act, c in sorted(a['runtimeCoverage']['activities'].items()):
    if c['status'] != 'APPLIED_BY_CONTEXT':
        rows += [{'activity': act, 'context': k, 'access': c['status'], 'cell': a['cells'][k].get(act)}
                 for k in sorted(a['cells'])]
        continue
    for k, e in sorted(c['contexts'].items()):
        assert all(e[f] is True for f in ('identityApproved', 'authorityApproved', 'productionApproved')), k
        rows.append({'activity': act, 'context': k, 'access': e['status'], 'cell': a['cells'][k].get(act),
                     **({'selector': e['selector'], 'cells': e['cells']} if 'selector' in e else {}),
                     'grade': e['grade'], 'identityApproved': True, 'authorityApproved': True,
                     'productionApproved': True})
summary = {}
for r in rows:
    summary.setdefault(r['activity'], {}).setdefault(r['access'], 0)
    summary[r['activity']][r['access']] += 1
assert summary['demolition'] == {'APPLIED': 11, 'APPLIED_DATE_DEPENDENT': 5}
assert all(v == {'APPLIED': 16} for k, v in summary.items() if k != 'demolition')
doc = {'version': 'g1-soil-stage2-production-access-v1', 'authority': a['version'],
       'authoritySha256': hashlib.sha256(V4.read_bytes()).hexdigest(),
       'rule': 'APPLIED / APPLIED_DATE_DEPENDENT ⇔ identity ∧ authority ∧ production; a date-dependent context has no '
               'static cell and needs a civil date',
       'transition': {'demolition': 'APPLIED ×11 + EXCLUDED_PENDING_DATE_DEPENDENT_AUTHORITY ×5 (v3) → APPLIED ×11 + '
                                    'APPLIED_DATE_DEPENDENT ×5 (v4)'},
       'summary': summary, 'rows': rows}
text = json.dumps(doc, ensure_ascii=False, indent=1) + '\n'
if '--write' in sys.argv:
    OUT.write_text(text, encoding='utf-8')
else:
    assert OUT.read_text(encoding='utf-8') == text, 'production-access-matrix.json differs'
    print('access matrix ok', summary['demolition'])
