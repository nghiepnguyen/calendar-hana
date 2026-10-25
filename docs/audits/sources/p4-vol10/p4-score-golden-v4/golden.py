"""G2 Stage 2: score Golden v4 (立劵交易 → 立券交易 卷十 alias + 劫煞 authority v2).

    python3 -I docs/audits/sources/p4-vol10/p4-score-golden-v4/golden.py [--write]

Successor to p4-score-golden-v3 (kept, sha-locked; pre-G2 rollback evidence). The v3 generator is loaded
unchanged (sha asserted); it runs the frozen v2 reference adapter with the G1-a lookup fold. The only
input that moves is the flag-OFF baseline that layer C reads for `baseline` rows: p4-adapter-baseline-v2
in place of v1 (G2 reaches the vol10 / legacy path only). P4 states (layer B) cannot change: v4 asserts that and reuses v3's activity-states.tsv.
Independent constraint: the layer-C rows that differ from v3 must be exactly the frozen Stage 1 domain
rows (g2-stage1/candidate-impact.tsv, measured before any Stage 2 code), with the same new score/status.
Default verifies the committed outputs byte-for-byte; --write regenerates them.
"""
import csv
import hashlib
import importlib.util
import sys
from pathlib import Path

DIR = Path('docs/audits/sources/p4-vol10/p4-score-golden-v4')
V3_DIR = Path('docs/audits/sources/p4-vol10/p4-score-golden-v3')
V3_GOLDEN = V3_DIR / 'golden.py'
V3_SHA = '071ffae33bc90767ca226854fa2aa4538806492f146c7573bfc8d69553fb22ac'  # p4-score-golden-lock-v3
BASELINE_V2 = Path('docs/audits/sources/p4-vol10/p4-adapter-baseline-v2/activities.tsv')
FROZEN = Path('docs/audits/sources/p4-vol10/g2-stage1/candidate-impact.tsv')
FROZEN_SHA = 'b99de42b65e6ffce313095c9f7efc55f2a13682ee5519413ef52da8b6a45a955'  # g2-stage1 lock.json
G2 = {'contract', 'transaction'}

assert hashlib.sha256(V3_GOLDEN.read_bytes()).hexdigest() == V3_SHA, 'Golden v3 generator changed'
assert hashlib.sha256(FROZEN.read_bytes()).hexdigest() == FROZEN_SHA, 'Stage 1 candidate impact changed'
_spec = importlib.util.spec_from_file_location('p4_score_golden_v3', V3_GOLDEN)
v3 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(v3)
v3.v2.BASELINE = BASELINE_V2


def rows(text):
    return {(r['date'], r['activity']): r for r in csv.DictReader(text.splitlines(), delimiter='\t')}


def check(out):
    """Layer B equals v3 byte for byte; layer C differs from v3 on exactly the frozen G2 rows."""
    assert out['activity-states.tsv'] == (V3_DIR / 'activity-states.tsv').read_text(encoding='utf-8'), 'layer B'
    old = rows((V3_DIR / 'activity-scores.tsv').read_text(encoding='utf-8'))
    new = rows(out['activity-scores.tsv'])
    assert old.keys() == new.keys()
    changed = {k for k in new if new[k] != old[k]}
    frozen = {(r['date'], r['activity']): r for r in csv.DictReader(FROZEN.open(encoding='utf-8'), delimiter='\t')
              if r['set'] == 'domain' and (r['score_old'], r['status_old']) != (r['score_new'], r['status_new'])}
    assert changed == set(frozen), sorted(changed ^ set(frozen))
    for k, f in frozen.items():
        o, n = old[k], new[k]
        assert (o['score'], o['status'], n['score'], n['status']) == \
            (f['score_old'], f['status_old'], f['score_new'], f['status_new']), k
        assert n['state'] == o['state'] == 'baseline' and n['hard_warning'] == o['hard_warning'] == 'false', k
    assert {a for _, a in changed} == G2
    return {'changedRows': len(changed), 'changedDates': sorted({d for d, _ in changed}),
            'changedActivities': sorted(G2)}


def main():
    days = v3.v2.day_headings()
    v3.check_alias(days)
    states = v3.build_states(days)
    out = {'activity-scores.tsv': v3.build_scores(days)}
    diff = check({'activity-states.tsv': states, **out})
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
    print('v3 → v4:', diff['changedRows'], 'rows,', len(diff['changedDates']), 'dates,', diff['changedActivities'])
    if bad:
        sys.exit('differs: ' + ', '.join(bad))


if __name__ == '__main__':
    main()
