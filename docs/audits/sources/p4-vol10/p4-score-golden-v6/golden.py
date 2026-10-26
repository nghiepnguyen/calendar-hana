"""Q4-REST Stage 3 (owner R-JK / R-WX / R-XH / R-F1Y): score Golden v6 = v5 with layer A swapped to full Golden v4
(puzhu:06 authority v5).

    python3 -I docs/audits/sources/p4-vol10/p4-score-golden-v6/golden.py [--write]

Successor to p4-score-golden-v5 (kept, sha-locked; pre-Stage-3 rollback evidence). The v5 generator is loaded
unchanged (sha asserted) with its whole chain; the only input that moves is the day-composition TSV,
p4-full-golden-v4/compose/dated.tsv in place of v3's.
Independent constraint: layer C differs from v5 on exactly the activity rows of the frozen Stage 3 prediction
(q4-rest-stage3/prediction.json, taken on v4 before any Stage 3 code), with the same old/new score and status and
no hard-warning change; layer B moves only on the predicted heading dates.
Default verifies the committed outputs byte-for-byte; --write regenerates them and the lock.
"""
import csv
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

DIR = Path('docs/audits/sources/p4-vol10/p4-score-golden-v6')
V5_DIR = Path('docs/audits/sources/p4-vol10/p4-score-golden-v5')
V5_GOLDEN = V5_DIR / 'golden.py'
V5_SHA = '362f7cb14182c6131ca6a6f53ff63637f3860c438b9b26b73abc2c78bb1ed0c0'  # p4-score-golden-lock-v5
COMPOSE_V4 = Path('docs/audits/sources/p4-vol10/p4-full-golden-v4/compose/dated.tsv')
PREDICTION = Path('docs/audits/sources/p4-vol10/q4-rest-stage3/prediction.json')

assert hashlib.sha256(V5_GOLDEN.read_bytes()).hexdigest() == V5_SHA, 'Golden v5 generator changed'
_spec = importlib.util.spec_from_file_location('p4_score_golden_v5', V5_GOLDEN)
v5 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(v5)
v4 = v5.v4
v4.v3.v2.COMPOSE = COMPOSE_V4


def rows(text):
    return {(r['date'], r['activity']): r for r in csv.DictReader(text.splitlines(), delimiter='\t')}


def check(out):
    pred = json.loads(PREDICTION.read_text(encoding='utf-8'))
    assert pred['authority'] == 'p4b-puzhu06-v4'
    frozen = {(a['date'], a['activityId']): a for a in pred['full']['activity']}
    dates = {h['date'] for h in pred['full']['heading']}
    old_b = rows((V5_DIR / 'activity-states.tsv').read_text(encoding='utf-8'))
    new_b = rows(out['activity-states.tsv'])
    assert old_b.keys() == new_b.keys()
    changed_b = {k for k in new_b if new_b[k] != old_b[k]}
    assert {d for d, _ in changed_b} <= dates, sorted(changed_b)
    old = rows((V5_DIR / 'activity-scores.tsv').read_text(encoding='utf-8'))
    new = rows(out['activity-scores.tsv'])
    assert old.keys() == new.keys()
    changed = {k for k in new if new[k] != old[k]}
    assert changed == set(frozen), sorted(changed ^ set(frozen))
    for k, f in frozen.items():
        o, n = old[k], new[k]
        assert (int(o['score']), o['status'], int(n['score']), n['status']) == \
            (f['production']['score'], f['production']['status'], f['model']['score'], f['model']['status']), k
        assert n['hard_warning'] == o['hard_warning'], k
    return {'layerBChangedRows': len(changed_b), 'changedRows': len(changed),
            'changedDates': sorted({d for d, _ in changed}), 'changedActivities': sorted({a for _, a in changed}),
            'scoreDelta': sorted({int(new[k]['score']) - int(old[k]['score']) for k in changed}),
            'statusChanges': sum(old[k]['status'] != new[k]['status'] for k in changed),
            'layerBTransitions': sorted({f"{old_b[k]['state']}->{new_b[k]['state']}" for k in changed_b})}


def lock_text(out, diff):
    paths = [DIR / 'golden.py', *(DIR / n for n in out if n != 'lock.json'), V5_GOLDEN, V5_DIR / 'lock.json', COMPOSE_V4,
             COMPOSE_V4.parent.parent / 'lock.json', PREDICTION]
    blob = lambda p: out[p.name].encode() if p.parent == DIR and p.name in out else p.read_bytes()
    return json.dumps({
        'version': 'p4-score-golden-lock-v6', 'scope': 'Q4_REST_STAGE3_PUZHU06_AUTHORITY_V5',
        'supersedes': 'p4-score-golden-lock-v5 as forward evidence; v5 files kept unchanged as pre-Stage-3 rollback evidence',
        'ruling': 'docs/audits/sources/p4-vol10/q4-rest-stage3/owner-ruling.json',
        'migration': 'docs/audits/p4-q4-rest-stage3-migration.md',
        'generation': 'python3 -I docs/audits/sources/p4-vol10/p4-score-golden-v6/golden.py --write',
        'headingLookup': 'canonical-v1',
        'method': 'v5 golden.py (sha-asserted chain) with layer A swapped to p4-full-golden-v4/compose/dated.tsv',
        'independentConstraint': 'layer-C rows differing from v5 = the activity rows of the frozen Stage 3 prediction '
                                 '(measured on v4 before any Stage 3 code), same old/new score and status',
        'diffFromV5': diff,
        'files': [{'path': str(p), 'sha256': hashlib.sha256(blob(p)).hexdigest()} for p in paths]},
        ensure_ascii=False, indent=1) + '\n'


def main():
    days = v4.v3.v2.day_headings()
    v4.v3.check_alias(days)
    out = {'activity-states.tsv': v4.v3.build_states(days), 'activity-scores.tsv': v4.v3.build_scores(days)}
    diff = check(out)
    out['diff.json'] = json.dumps(diff, ensure_ascii=False, indent=1) + '\n'
    out['lock.json'] = lock_text(out, diff)
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
    print('v5 → v6:', diff)
    if bad:
        sys.exit('differs: ' + ', '.join(bad))


if __name__ == '__main__':
    main()
