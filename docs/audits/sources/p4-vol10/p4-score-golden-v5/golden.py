"""F1 Stage 3 (owner R2): score Golden v5 = v4 with layer A swapped to full Golden v3 (puzhu:06 authority v4).

    python3 -I docs/audits/sources/p4-vol10/p4-score-golden-v5/golden.py [--write]

Successor to p4-score-golden-v4 (kept, sha-locked; pre-R2 rollback evidence). The v4 generator is loaded
unchanged (sha asserted) with its whole chain (v3 fold, v2 reference adapter, baseline v2); the only input that
moves is the day-composition TSV, p4-full-golden-v3/compose/dated.tsv in place of v2's.
Independent constraint: layer B differs from v3's activity-states.tsv only on contract / transaction of the
10 R2 dates, and layer C differs from v4 on exactly the 20 activity rows of the frozen F1 Stage 2 impact
(f1-wuli-lijuan-stage2/impact.json, measured before any Stage 3 code), same old/new score and status.
Default verifies the committed outputs byte-for-byte; --write regenerates them.
"""
import csv
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

DIR = Path('docs/audits/sources/p4-vol10/p4-score-golden-v5')
V4_DIR = Path('docs/audits/sources/p4-vol10/p4-score-golden-v4')
V3_DIR = Path('docs/audits/sources/p4-vol10/p4-score-golden-v3')
V4_GOLDEN = V4_DIR / 'golden.py'
V4_SHA = 'fd422cb11b92b51de4ae48fe611c37a96d704b32e12825cc9d6a474aa258ba69'  # p4-score-golden-lock-v4
COMPOSE_V3 = Path('docs/audits/sources/p4-vol10/p4-full-golden-v3/compose/dated.tsv')
FROZEN = Path('docs/audits/sources/p4-vol10/f1-wuli-lijuan-stage2/impact.json')
FROZEN_SHA = 'db675b424f69109e26879a87c6796f9e8f3ed284521352113ed6182e866247ad'  # f1-wuli-lijuan-stage2 lock.json
assert hashlib.sha256(FROZEN.read_bytes()).hexdigest() == FROZEN_SHA, 'Stage 2 impact changed'
R2 = {'contract', 'transaction'}

assert hashlib.sha256(V4_GOLDEN.read_bytes()).hexdigest() == V4_SHA, 'Golden v4 generator changed'
_spec = importlib.util.spec_from_file_location('p4_score_golden_v4', V4_GOLDEN)
v4 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(v4)
v4.v3.v2.COMPOSE = COMPOSE_V3


def rows(text):
    return {(r['date'], r['activity']): r for r in csv.DictReader(text.splitlines(), delimiter='\t')}


def check(out):
    impact = json.loads(FROZEN.read_text(encoding='utf-8'))
    frozen = {(a['date'], a['activityId']): a for a in impact['activity']}
    dates = {h['date'] for h in impact['heading']}
    old_b = rows((V3_DIR / 'activity-states.tsv').read_text(encoding='utf-8'))
    new_b = rows(out['activity-states.tsv'])
    assert old_b.keys() == new_b.keys()
    changed_b = {k for k in new_b if new_b[k] != old_b[k]}
    assert {a for _, a in changed_b} <= R2 and {d for d, _ in changed_b} <= dates, sorted(changed_b)
    old = rows((V4_DIR / 'activity-scores.tsv').read_text(encoding='utf-8'))
    new = rows(out['activity-scores.tsv'])
    assert old.keys() == new.keys()
    changed = {k for k in new if new[k] != old[k]}
    assert changed == set(frozen), sorted(changed ^ set(frozen))
    for k, f in frozen.items():
        o, n = old[k], new[k]
        assert (int(o['score']), o['status'], int(n['score']), n['status']) == \
            (f['current']['score'], f['current']['status'], f['r2']['score'], f['r2']['status']), k
        assert n['hard_warning'] == o['hard_warning'] == 'false', k
    return {'layerBChangedRows': len(changed_b), 'changedRows': len(changed),
            'changedDates': sorted({d for d, _ in changed}), 'changedActivities': sorted({a for _, a in changed}),
            'scoreDelta': sorted({int(new[k]['score']) - int(old[k]['score']) for k in changed}),
            'layerBTransitions': sorted({f"{old_b[k]['state']}->{new_b[k]['state']}" for k in changed_b})}


def main():
    days = v4.v3.v2.day_headings()
    v4.v3.check_alias(days)
    out = {'activity-states.tsv': v4.v3.build_states(days), 'activity-scores.tsv': v4.v3.build_scores(days)}
    diff = check(out)
    out['diff.json'] = json.dumps(diff, ensure_ascii=False, indent=1) + '\n'
    write = '--write' in sys.argv
    bad = []
    for name, text in out.items():
        p = DIR / name
        if write:
            p.write_text(text, encoding='utf-8')
        elif not p.exists() or p.read_text(encoding='utf-8') != text:
            bad.append(name)
    for name, text in out.items():
        print(name, hashlib.sha256(text.encode()).hexdigest())
    print('v4 → v5:', diff)
    if bad:
        sys.exit('differs: ' + ', '.join(bad))


if __name__ == '__main__':
    main()
