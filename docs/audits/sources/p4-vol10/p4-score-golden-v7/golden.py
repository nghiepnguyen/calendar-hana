"""P21 Stage 4 (p4-puzhu21-v1): score Golden v7 = v6 with layer A swapped to full Golden v5 (puzhu:21
contribution-scoped on the authority's eligible contexts).

    python3 -I docs/audits/sources/p4-vol10/p4-score-golden-v7/golden.py [--write]

Successor to p4-score-golden-v6 (kept, sha-locked; pre-P21 rollback evidence). The v6 generator is loaded unchanged
(sha asserted) with its whole chain; the only input that moves is the day-composition TSV,
p4-full-golden-v5/compose/dated.tsv in place of v4's.
Independent constraint: layer B and layer C differ from v6 on exactly the Stage 3 MIGRATE activity rows
(p21-stage3/eligibility.json, golden-manifest.json; measured before any Stage 4 code), with the frozen old/new
score and status and no hard-warning change.
Default verifies the committed outputs byte-for-byte; --write regenerates them and the lock.
"""
import csv
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

DIR = Path('docs/audits/sources/p4-vol10/p4-score-golden-v7')
V6_DIR = Path('docs/audits/sources/p4-vol10/p4-score-golden-v6')
V6_GOLDEN = V6_DIR / 'golden.py'
V6_SHA = '5f969aa6b2bf4dc2b9e9773c0d1195af38fe0387244dfe9b4655daad68e65459'  # p4-score-golden-lock-v6
COMPOSE_V5 = Path('docs/audits/sources/p4-vol10/p4-full-golden-v5/compose/dated.tsv')
S3 = Path('docs/audits/sources/p4-vol10/p21-stage3')

assert hashlib.sha256(V6_GOLDEN.read_bytes()).hexdigest() == V6_SHA, 'Golden v6 generator changed'
_spec = importlib.util.spec_from_file_location('p4_score_golden_v6', V6_GOLDEN)
v6 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(v6)
v4 = v6.v4
v4.v3.v2.COMPOSE = COMPOSE_V5


def rows(text):
    return {(r['date'], r['activity']): r for r in csv.DictReader(text.splitlines(), delimiter='\t')}


def check(out):
    elig = json.loads((S3 / 'eligibility.json').read_text(encoding='utf-8'))
    frozen = {(r['date'], a['activity']): a for r in elig['rows'] if r['eligibility'] == 'MIGRATE'
              for a in r['activityDelta']}
    manifest = {g['file']: g['expectedRecords'] for g in
                json.loads((S3 / 'golden-manifest.json').read_text(encoding='utf-8'))['changes']
                if g['golden'] == 'p4-score-golden-v6'}
    old_b = rows((V6_DIR / 'activity-states.tsv').read_text(encoding='utf-8'))
    new_b = rows(out['activity-states.tsv'])
    assert old_b.keys() == new_b.keys()
    changed_b = {k for k in new_b if new_b[k] != old_b[k]}
    assert changed_b == set(frozen) and len(changed_b) == manifest['activity-states.tsv'], sorted(changed_b)
    old = rows((V6_DIR / 'activity-scores.tsv').read_text(encoding='utf-8'))
    new = rows(out['activity-scores.tsv'])
    assert old.keys() == new.keys()
    changed = {k for k in new if new[k] != old[k]}
    assert changed == set(frozen) and len(changed) == manifest['activity-scores.tsv'], sorted(changed ^ set(frozen))
    for k, f in frozen.items():
        o, n = old[k], new[k]
        assert (int(o['score']), o['status'], int(n['score']), n['status']) == \
            (f['from']['score'], f['from']['status'], f['to']['score'], f['to']['status']), k
        assert n['hard_warning'] == o['hard_warning'], k
    return {'layerBChangedRows': len(changed_b), 'changedRows': len(changed),
            'changedDates': sorted({d for d, _ in changed}), 'changedActivities': sorted({a for _, a in changed}),
            'scoreDelta': sorted({int(new[k]['score']) - int(old[k]['score']) for k in changed}),
            'statusChanges': sum(old[k]['status'] != new[k]['status'] for k in changed),
            'layerBTransitions': sorted({f"{old_b[k]['state']}->{new_b[k]['state']}" for k in changed_b})}


def lock_text(out, diff):
    paths = [DIR / 'golden.py', *(DIR / n for n in out if n != 'lock.json'), V6_GOLDEN, V6_DIR / 'lock.json', COMPOSE_V5,
             COMPOSE_V5.parent.parent / 'lock.json', S3 / 'eligibility.json', S3 / 'golden-manifest.json']
    blob = lambda p: out[p.name].encode() if p.parent == DIR and p.name in out else p.read_bytes()  # noqa: E731
    return json.dumps({
        'version': 'p4-score-golden-lock-v7', 'scope': 'P21_STAGE4_PUZHU21_V1',
        'supersedes': 'p4-score-golden-lock-v6 as forward evidence; v6 files kept unchanged as pre-P21 rollback evidence',
        'migration': 'docs/audits/p21-stage4-partial-migration.md',
        'generation': 'python3 -I docs/audits/sources/p4-vol10/p4-score-golden-v7/golden.py --write',
        'headingLookup': 'canonical-v1',
        'method': 'v6 golden.py (sha-asserted chain) with layer A swapped to p4-full-golden-v5/compose/dated.tsv',
        'independentConstraint': 'layer-B/C rows differing from v6 = the Stage 3 MIGRATE activity rows, same old/new '
                                 'score and status',
        'diffFromV6': diff,
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
    print('v6 → v7:', diff)
    if bad:
        sys.exit('differs: ' + ', '.join(bad))


if __name__ == '__main__':
    main()
