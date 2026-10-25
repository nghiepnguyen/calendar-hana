"""G2 Stage 2: exhaustive migration diff from per-row dumps (every day 1900-01-01 … 2100-12-31, no sampling).

    python3 -I docs/audits/sources/p4-vol10/g2-stage2/compare.py DUMPS [--write]

DUMPS holds the outputs of `G2S2_DUMP=<models> npx vitest run shared/lunar/p4G2Stage2Migration.test.ts`:
  fwd/0-forward.tsv                     Stage 2 as shipped
  rb/0-rollback.tsv, rb/1-forward.tsv   rollback (no alias + authority v1), then re-enable, one process
  text/0-text.tsv                       independent mechanism: 卷十 avoid lists respelled, no alias
  weishen/0-weishen.tsv                 text with 未-戊申 contract/transaction = avoid (dependency only)
  pre/0-forward.tsv                     pre-G2 main (58faf3a worktree), same harness
Counts use the Stage 1 semantics (shared/lunar/p4G2Stage1Audit.test.ts `compare`), with two stricter
checks: other activities compare whole-record sha, and an event's 劫煞 authority id is normalized
(v2 → v1) before comparing; evaluations that differ only by that id are counted as authorityStampOnly.
Writes summary.json, activity-diff.tsv, event-diff.json, rollback.json; default verifies them.
"""
import hashlib
import json
import sys
from pathlib import Path

OUT = Path('docs/audits/sources/p4-vol10/g2-stage2')
G2 = ('contract', 'transaction')
DOMAIN = ('2025-01-01', '2027-12-31')
FROZEN = Path('docs/audits/sources/p4-vol10/g2-stage1/range-impact-events.json')
FROZEN_TSV = Path('docs/audits/sources/p4-vol10/g2-stage1/candidate-impact.tsv')


def part(d):
    return 'domain' if DOMAIN[0] <= d <= DOMAIN[1] else 'outside'


def lines(p):
    with open(p, encoding='utf-8') as f:
        for line in f:
            yield line.rstrip('\n').split('\t')


def counts():
    return {k: 0 for k in ('days', 'evidenceOrStateChanged', 'scoreChanged', 'scoreLower', 'scoreHigher',
                           'statusChanged', 'hardWarningChanged', 'conclusionChanged', 'p4StateChanged',
                           'otherActivityChanged', 'eventChanged', 'eventScoreChanged',
                           'eventClassificationChanged', 'eventEvidenceOnly')} | {'statusTransitions': {}}


def compare(base, cand, extra=None):
    """Stage 1 `compare` over two dumps in lockstep. `extra(a, b, set)` sees every row pair."""
    tot = {'domain': counts(), 'outside': counts()}
    stamp = {'domain': 0, 'outside': 0}
    rows, last = [], None
    for a, b in zip(lines(base), lines(cand), strict=True):
        assert a[:3] == b[:3], (a[:3], b[:3])
        kind, d, key = a[:3]
        c = tot[part(d)]
        if d != last:
            c['days'] += 1
            last = d
        if extra:
            extra(a, b, part(d))
        if kind == 'A':
            if key not in G2:
                if a != b:
                    c['otherActivityChanged'] += 1
                continue
            sc, st, hw = a[3] != b[3], a[4] != b[4], a[5] != b[5]
            evid, p4 = a[7] != b[7] or a[8] != b[8], a[9] != b[9]
            if evid or p4 or sc or st or hw:
                c['evidenceOrStateChanged'] += 1
                rows.append((d, key, a, b))
            c['p4StateChanged'] += p4
            if sc:
                c['scoreChanged'] += 1
                c['scoreLower' if int(b[3]) < int(a[3]) else 'scoreHigher'] += 1
            if st:
                c['statusChanged'] += 1
                t = f'{a[4]}>{b[4]}'
                c['statusTransitions'][t] = c['statusTransitions'].get(t, 0) + 1
            c['hardWarningChanged'] += hw
            c['conclusionChanged'] += sc or st or hw
        else:
            if a[5] == b[5]:
                stamp[part(d)] += a[6] != b[6]
                continue
            c['eventChanged'] += 1
            c['eventScoreChanged'] += a[3] != b[3]
            c['eventClassificationChanged'] += a[4] != b[4]
            c['eventEvidenceOnly'] += a[3] == b[3] and a[4] == b[4]
    return tot, stamp, rows


def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def main():
    dumps = Path(sys.argv[1])
    fwd, rb, re_, text, wei, pre = (dumps / p for p in (
        'fwd/0-forward.tsv', 'rb/0-rollback.tsv', 'rb/1-forward.tsv', 'text/0-text.tsv', 'weishen/0-weishen.tsv',
        'pre/0-forward.tsv'))
    # Migration: rollback (= pre-G2) → forward. Event detail per type, and the independent text model.
    by_event = {}

    def per_event(a, b, s):
        if a[0] == 'E' and a[5] != b[5]:
            e = by_event.setdefault(a[2].split('@')[0], {'domain': [0, 0, 0], 'outside': [0, 0, 0]})[s]
            e[0] += 1
            e[1] += a[3] != b[3]
            e[2] += a[4] != b[4]

    mig, stamp, rows = compare(rb, fwd, per_event)
    indep, indep_stamp, _ = compare(text, fwd)
    dep, _, dep_list = compare(text, wei)
    # Rows differing between the independent model and forward (byte compare): must be none.
    indep_rows = sum(1 for a, b in zip(lines(text), lines(fwd)) if a != b)
    hashes = {k: sha(p) for k, p in (('preG2Main', pre), ('stage2Rollback', rb), ('stage2Forward', fwd),
                                       ('stage2ReEnable', re_), ('independentText', text))}
    frozen = json.loads(FROZEN.read_text(encoding='utf-8'))
    dep_rows = {(d, a) for d, a, _, _ in dep_list}
    frozen_domain = {(r[1], r[2]) for r in (l.split('\t') for l in FROZEN_TSV.read_text(encoding='utf-8').splitlines()[1:])
                     if r[0] == 'domain'}
    concl = [(d, a, x, y) for d, a, x, y in rows if x[3:6] != y[3:6]]
    explained = lambda x, y: x[9] == y[9] and x[5] == y[5]  # noqa: E731 (P4 state and hard warning unchanged)
    unexpected = (sum(t['otherActivityChanged'] + t['p4StateChanged'] + t['hardWarningChanged'] for t in mig.values())
                  + indep_rows + sum(not explained(x, y) for _, _, x, y in rows))
    domain_dates = sorted({d for d, _, _, _ in concl if part(d) == 'domain'})
    summary = {
        'version': 'g2-stage2-summary-v1',
        'range': ['1900-01-01', '2100-12-31'],
        'sampling': 'none: every day, every activity, every event × {no hour, hour 9}',
        'migration': mig,
        'authorityStampOnly': stamp,
        'eventChangedTotal': sum(t['eventChanged'] for t in mig.values()),
        'conclusionChangedDomainDates': domain_dates,
        'domainRowsEqualFrozenStage1': {(d, a) for d, a, _, _ in rows if part(d) == 'domain'} == frozen_domain,
        'dependsOnWeishenCell': dep,
        'frozenStage1Equal': {s: all(mig[s][k] == v for k, v in frozen['totals'][s].items()) for s in mig}
        | {'dependsOnWeishenCell': {s: all(dep[s][k] == v for k, v in frozen['dependsOnWeishenCell'][s].items()
                                         if k != 'statusTransitions') for s in dep}},
        'independentTextModel': {'rowsDifferingFromForward': indep_rows,
                                 'eventChanged': sum(t['eventChanged'] for t in indep.values()),
                                 'authorityStampOnly': indep_stamp},
        'unexpected': unexpected,
    }
    activity = ['set\tdate\tactivity\tp4\tscore_old\tscore_new\tstatus_old\tstatus_new\thard_old\thard_new'
                '\tvol10_old\tvol10_new\tweishen_cell_dependent']
    for d, a, x, y in concl:
        activity.append('\t'.join([part(d), d, a, json.loads(y[9])['state'], x[3], y[3], x[4], y[4], x[5], y[5],
                                   x[7], y[7], str((d, a) in dep_rows).lower()]))
    event = {'version': 'g2-stage2-event-diff-v1', 'note': 'changed = event output differs with the 劫煞 authority id '
             'normalized; score / classification counts overlap and are not summed', 'byEvent': {
                 e: {s: dict(zip(('changed', 'score', 'classification'), v)) for s, v in x.items()}
                 for e, x in sorted(by_event.items())},
             'authorityStampOnly': stamp}
    rollback = {
        'version': 'g2-stage2-rollback-v1',
        'phases': {
            'forward': 'shipped: alias + authority v2',
            'rollback': 'alias removed + authority v1 (g2Rollback.ts), same process as re-enable',
            'reEnable': 'alias + authority v2 again, after rollback in one process',
            'preG2Main': 'origin/main 58faf3a (pre-G2) in a worktree, same harness',
        },
        'dumpSha256': hashes,
        'rollbackEqualsPreG2Main': hashes['preG2Main'] == hashes['stage2Rollback'],
        'reEnableEqualsForward': hashes['stage2ReEnable'] == hashes['stage2Forward'],
        'independentTextEqualsForward': hashes['independentText'] == hashes['stage2Forward'],
        'migrationRows': {'activityConclusion': len(concl), 'eventChanged': summary['eventChangedTotal']},
    }
    files = {
        'summary.json': json.dumps(summary, ensure_ascii=False, indent=1) + '\n',
        'activity-diff.tsv': '\n'.join(activity) + '\n',
        'event-diff.json': json.dumps(event, ensure_ascii=False, indent=1) + '\n',
        'rollback.json': json.dumps(rollback, ensure_ascii=False, indent=1) + '\n',
    }
    bad = []
    for name, text_ in files.items():
        p = OUT / name
        if '--write' in sys.argv:
            p.write_text(text_, encoding='utf-8')
        elif p.read_text(encoding='utf-8') != text_:
            bad.append(name)
        print(name, hashlib.sha256(text_.encode()).hexdigest())
    print(json.dumps({k: summary[k] for k in ('frozenStage1Equal', 'unexpected', 'authorityStampOnly')},
                     ensure_ascii=False), rollback['rollbackEqualsPreG2Main'], rollback['reEnableEqualsForward'])
    if bad:
        sys.exit('differs: ' + ', '.join(bad))


if __name__ == '__main__':
    main()
