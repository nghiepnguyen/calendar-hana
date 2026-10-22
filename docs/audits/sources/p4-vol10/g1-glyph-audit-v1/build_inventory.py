"""G1 glyph audit: inventory of 破屋壊垣 (U+58CA) and 破屋壞垣 (U+58DE) across tracked files. Audit only.

Run: python3 -I docs/audits/sources/p4-vol10/g1-glyph-audit-v1/build_inventory.py
Writes inventory.tsv (one row per file and class, occurrence counts, not line counts) and
inventory-summary.json next to this script, then run `npx prettier --write` on the JSON. Reads
`git ls-files`; this directory is skipped.
"""
import collections
import json
import pathlib
import re
import subprocess

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[4]
FORMS = {'ja': '破屋壊垣', 'tc': '破屋壞垣'}
SELF = str(HERE.relative_to(ROOT)) + '/'
# A line that pairs or maps the two forms (raw → canonical) is alias/normalization wherever it lives.
ALIAS = re.compile(r'NORM|VARIANTS|replace\(|headingMap|yueBiaoTerm|rawHeading|canonicalHeading|heading-norm|'
                   r'壞→壊|壊→壞|壞/壊|壊/壞|canon')


def path_class(p):
    if p.endswith('.raw.txt') or p.endswith('h1b-yuebiao-witness-v1/lock.json') or p.endswith('witness-lock.json'):
        return 'source/raw evidence'
    if p == 'shared/almanac-data/xiejibianfangshu-yiji.json' or p == 'shared/almanac-data/truc.json':
        return 'canonical activity'
    if p.startswith('shared/lunar/') and not p.endswith('.test.ts'):
        return 'runtime'
    if p.startswith('shared/almanac-data/'):
        return 'authority/golden'
    if re.search(r'p4-vol10/(p4-full-golden-v[12]|p4b-puzhu06-golden-v3|yi-composition-expected-v1)/', p):
        return 'authority/golden'
    if p.endswith('.md'):
        return 'documentation'
    return 'fixture/test/snapshot'


files = subprocess.run(['git', 'ls-files', '-z'], cwd=ROOT, capture_output=True, check=True).stdout.decode().split('\0')
rows = collections.defaultdict(lambda: collections.Counter())
for p in files:
    if not p or p.startswith(SELF):
        continue
    try:
        text = (ROOT / p).read_text(encoding='utf-8')
    except (UnicodeDecodeError, IsADirectoryError, FileNotFoundError):
        continue
    if not any(f in text for f in FORMS.values()):
        continue
    base = path_class(p)
    for line in text.splitlines():
        n = {k: line.count(f) for k, f in FORMS.items()}
        if not any(n.values()):
            continue
        both = n['ja'] and n['tc']
        cls = 'alias/normalization' if both or ALIAS.search(line) else base
        rows[(p, cls)].update({**n, 'lines': 1})

out = ['path\tclass\t壊_occurrences\t壞_occurrences\tlines']
summary = collections.defaultdict(collections.Counter)
for (p, cls), c in sorted(rows.items()):
    out.append(f"{p}\t{cls}\t{c['ja']}\t{c['tc']}\t{c['lines']}")
    summary[cls].update({'files': 1, '壊': c['ja'], '壞': c['tc'], 'lines': c['lines']})
(HERE / 'inventory.tsv').write_text('\n'.join(out) + '\n', encoding='utf-8')
totals = collections.Counter()
for c in summary.values():
    totals.update({k: v for k, v in c.items() if k != 'files'})
(HERE / 'inventory-summary.json').write_text(json.dumps({
    'forms': {'壊': 'U+58CA 破屋壊垣', '壞': 'U+58DE 破屋壞垣'},
    'distinctFiles': len({p for p, _ in rows}),
    'totals': dict(totals),
    'byClass': {k: dict(v) for k, v in sorted(summary.items())},
}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(json.dumps({k: dict(v) for k, v in sorted(summary.items())}, ensure_ascii=False))
