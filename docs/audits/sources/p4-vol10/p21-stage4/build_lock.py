"""P21 Stage 4: lock over the partial-migration evidence (audit only).

    python3 -I docs/audits/sources/p4-vol10/p21-stage4/build_lock.py
"""
import hashlib
import json
import os

HERE = os.path.relpath(os.path.dirname(os.path.abspath(__file__)))
FILES = [
    os.path.join(HERE, 'migration-diff.json'), os.path.join(HERE, 'build_lock.py'),
    'shared/almanac-data/p4-puzhu21-v1.json', 'shared/lunar/p4OwnerRules.ts', 'shared/lunar/p21Rollback.ts',
    'shared/lunar/p4P21Stage4Migration.test.ts',
    'docs/audits/sources/p4-vol10/p4-full-golden-v5/lock.json',
    'docs/audits/sources/p4-vol10/p4-score-golden-v7/lock.json',
    'docs/audits/sources/p4-vol10/p21-stage3/lock.json',
    'docs/audits/sources/p4-vol10/p21-stage3/eligibility.json',
]


def sha(p):
    with open(p, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


with open(os.path.join(HERE, 'lock.json'), 'w', encoding='utf-8') as f:
    json.dump({'version': 'p21-stage4-v1', 'authority': 'p4-puzhu21-v1',
               'files': {p: sha(p) for p in FILES}}, f, ensure_ascii=False, indent=1)
    f.write('\n')
