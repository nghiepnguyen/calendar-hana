"""相抵 audit: annotation-level dry run of the OVERLAP reading. Changes nothing at runtime.

Run: python3 -I docs/audits/sources/p4-vol10/xiangdi-cancel-both-v1/build_dryrun.py
Applies build_holdout.overlap (frozen in 5c35a9e) to Golden v2 dated/context rows for each
相抵 subject on its no-德 cancel clause. Only annotation states are computed: scores, ratings
and UI need an engine variant and are not derived here.
"""
import csv
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from build_holdout import COMPOSE, overlap  # noqa: E402

# Subject -> Month Jian of the clause read as cancel_both when no 德 is present.
SCOPES = {'刼煞': '辰戌丑未', '災煞': '寅申巳亥', '月煞': '卯酉'}


def load(name, key):
    groups = {}
    with open(COMPOSE / name, encoding='utf-8') as f:
        for r in csv.DictReader(f, delimiter='\t'):
            groups.setdefault(r[key], {})[r['heading']] = r
    return groups


out = {'version': 'xiangdi-cancel-both-dryrun-v1', 'note': __doc__.strip().splitlines()[2], 'subjects': {}}
for subject, months in SCOPES.items():
    res = {}
    for domain, name, key in (('dated', 'dated.tsv', 'date'), ('context', 'context.tsv', 'id')):
        changes = []
        for gid, rows in load(name, key).items():
            month = next(iter(rows.values()))['month_jian']
            if month not in months:
                continue
            ov = overlap(rows, subject)
            for h, r in rows.items():
                if r['state'] == 'neither_recorded' and ov[h]:
                    changes.append({'id': gid, 'heading': h, 'from': 'neither_recorded', 'to': 'only_ji'})
        heads = {}
        for c in changes:
            heads[c['heading']] = heads.get(c['heading'], 0) + 1
        res[domain] = {'rows': len(changes), 'ids': len({c['id'] for c in changes}),
                       'headings': dict(sorted(heads.items(), key=lambda kv: -kv[1])), 'changes': changes}
    out['subjects'][subject] = res
(HERE / 'dryrun.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
for s, r in out['subjects'].items():
    print(s, 'dated', r['dated']['rows'], 'rows /', r['dated']['ids'], 'dates;', 'context', r['context']['rows'], 'rows /', r['context']['ids'], 'ctx')
    print('  ', r['dated']['headings'])
