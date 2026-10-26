"""F1 Stage 3: lock the R2 owner ruling, the migration envelope, the rollback digests and the new authority / Goldens.

Run from the repo root after the dump (F1S3_DUMP=1 npx vitest run shared/lunar/p4F1R2Migration.test.ts):
  python3 -I docs/audits/sources/p4-vol10/f1-wuli-lijuan-stage3/build_lock.py
"""
import hashlib
import json
import os

HERE = os.path.relpath(os.path.dirname(os.path.abspath(__file__)))
P = 'docs/audits/sources/p4-vol10/'
FILES = [
    os.path.join(HERE, f) for f in ('owner-ruling.json', 'migration-diff.json', 'rollback.json', 'build_lock.py')
] + [
    'shared/almanac-data/p4b-puzhu06-v4.json', 'shared/almanac-data/p4b-puzhu06-v3.json',
    P + 'p4b-puzhu06-authority-v4/lock.json', 'shared/almanac-data/golden-p4b-puzhu06-v4.json',
    P + 'p4b-puzhu06-golden-v4/lock.json', P + 'p4-full-golden-v3/lock.json', P + 'p4-score-golden-v5/lock.json',
    P + 'f1-wuli-lijuan-stage2/impact.json', P + 'f1-wuli-lijuan-stage1/lock.json',
]


def sha(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


with open(os.path.join(HERE, 'lock.json'), 'w', encoding='utf-8') as f:
    json.dump({'version': 'f1-wuli-lijuan-stage3-v1', 'files': {p: sha(p) for p in FILES}}, f, ensure_ascii=False, indent=1)
    f.write('\n')
