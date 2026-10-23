"""Fail when tracked audit artifacts under docs/audits/sources/ differ from HEAD (modified, deleted,
renamed, type-changed; staged or not). Untracked files are ignored. Never reverts anything, so a
failure leaves the evidence in the tree.

Run: python3 -I scripts/check-audit-clean.py   (npm run check:audit-clean; in ci:full right after npm test)
Scope is audit artifacts only: tracked changes elsewhere are out of scope here.
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCOPE = 'docs/audits/sources/'

out = subprocess.run(
    ['git', 'status', '--porcelain=v1', '-z', '--untracked-files=no', '--', SCOPE],
    cwd=ROOT, capture_output=True, check=True,
).stdout.decode()
# -z records are "XY path", plus a second NUL-separated path for renames/copies.
records, dirty = out.split('\0'), []
i = 0
while i < len(records) and records[i]:
    status, path = records[i][:2], records[i][3:]
    moved = status[0] in 'RC'
    dirty.append(f'{status} {path}' + (f' (from {records[i + 1]})' if moved else ''))
    i += 2 if moved else 1
if dirty:
    print(f'Tracked audit artifacts under {SCOPE} differ from HEAD:', *dirty, sep='\n  ', file=sys.stderr)
    sys.exit(1)
print(f'{SCOPE}: clean')
