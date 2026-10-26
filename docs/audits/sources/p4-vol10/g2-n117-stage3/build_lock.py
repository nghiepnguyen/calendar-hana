"""G2-n117 Stage 3: lock the D1(a) owner ruling and its frozen inputs.

Run from the repo root: python3 -I docs/audits/sources/p4-vol10/g2-n117-stage3/build_lock.py
"""
import hashlib
import json
import os

HERE = os.path.relpath(os.path.dirname(os.path.abspath(__file__)))
P = 'docs/audits/sources/p4-vol10/'
FILES = [
    os.path.join(HERE, 'owner-ruling.json'),
    os.path.join(HERE, 'build_lock.py'),
    P + 'option-c-final-gate-v1/owner-ruling.json',
    P + 'g2-n117-stage1/evidence.json',
    P + 'g2-n117-stage1/lock.json',
    P + 'g2-n117-stage2/evidence.json',
    P + 'g2-n117-stage2/lock.json',
]


def sha(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


with open(os.path.join(HERE, 'lock.json'), 'w', encoding='utf-8') as f:
    json.dump({'version': 'g2-n117-stage3-v1', 'files': {p: sha(p) for p in FILES}}, f, ensure_ascii=False, indent=1)
    f.write('\n')
