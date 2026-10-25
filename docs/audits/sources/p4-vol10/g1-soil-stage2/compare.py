"""G1-SOIL Stage 2 (R2): exhaustive migration diff from per-row dumps (every day 1900-01-01 … 2100-12-31).

    python3 -I docs/audits/sources/p4-vol10/g1-soil-stage2/compare.py DUMPS [--write]

DUMPS holds `G1SOIL2_DUMP=<models> G1SOIL2_OUT=DUMPS/<dir> npx vitest run shared/lunar/p4G1SoilStage2Migration.test.ts`:
  pre/0-pre.tsv                       pre-G1-SOIL main (d5c005f worktree, same harness + g1GlyphRollback.ts)
  fwd/0-forward.tsv                   Stage 2 as shipped (authority v4)
  rb/0-rollback.tsv, rb/1-forward.tsv rollback (authority v3), then re-enable, one process
Gates (spec, owner ruling 2026-10-25): domain 0; outside 298, −15, watch→avoid, per context 61/58/59/60/60; no other
activity; event semantic 0; changed rows = Stage 1 r2-impact.tsv rows; the changed dates predicted from pre + the
independent JPL-row calendar, and from the G1-a scope ∩ that calendar (no dump read); rollback = pre and
re-enable = forward as raw bytes. Writes summary.json, activity-diff.tsv, event-diff.json, rollback.json.
"""
import hashlib
import json
import sys
from datetime import date, timedelta
from pathlib import Path

OUT = Path('docs/audits/sources/p4-vol10/g1-soil-stage2')
S1 = Path('docs/audits/sources/p4-vol10/g1-soil-stage1')
DOMAIN = ('2025-01-01', '2027-12-31')
SOIL = {'丑-甲寅', '丑-丙寅', '丑-壬寅', '丑-戊寅', '未-戊申'}
G2 = ('contract', 'transaction')
SCOPE = json.loads(Path('docs/audits/sources/p4-vol10/puzhu17-bujiang-v1/scope-dates.json').read_text(encoding='utf-8'))
FROZEN = {'outside': [298, 298, 298, 0, 298, 0, 0], 'transitions': {'watch→avoid': 298}, 'deltas': {'-15': 298},
          'byContext': {'丑-丙寅': 61, '丑-壬寅': 58, '丑-戊寅': 59, '丑-甲寅': 60, '未-戊申': 60}}

INSIDE = set()
for ws in json.loads((S1 / 'soil-calendar.json').read_text(encoding='utf-8'))['windows'].values():
    for w in ws:
        d = date.fromisoformat(w['onset'])
        while d <= date.fromisoformat(w['eve']):
            INSIDE.add(d.isoformat())
            d += timedelta(1)


def part(d):
    return 'domain' if DOMAIN[0] <= d <= DOMAIN[1] else 'outside'


def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def days(path):
    cur = None
    with open(path, encoding='utf-8') as f:
        for line in f:
            r = line.rstrip('\n').split('\t')
            if r[0] == 'D':
                if cur:
                    yield cur
                cur = (r[1], r, [])
            else:
                cur[2].append(r)
    if cur:
        yield cur


def kiep(v):
    return next((x for x in v.split(' ') if x.startswith('kiep_sat:')), '-')


def counts():
    return {k: 0 for k in ('days', 'demolitionChangedDays', 'conclusionChanged', 'scoreChanged', 'scoreLower',
                           'scoreHigher', 'statusChanged', 'hardWarningChanged', 'evidenceOnly', 'p4StateChanged',
                           'otherActivityChanged', 'g2ActivityChanged', 'outsideSoilRowsChanged',
                           'eventEvaluations', 'eventSemanticChanged', 'eventScore', 'eventClassification',
                           'eventEvidenceOnly', 'eventStampOnly')} | {
        'statusTransitions': {}, 'scoreDeltas': {}, 'verdictTransitions': {}, 'byContext': {}}


def main(dumps):
    pre, fwd = dumps / 'pre/0-pre.tsv', dumps / 'fwd/0-forward.tsv'
    rb, re = dumps / 'rb/0-rollback.tsv', dumps / 'rb/1-forward.tsv'
    tot = {'domain': counts(), 'outside': counts()}
    rows = ['date\tcontext\tsoil\tbefore\tafter\tbeforeKiep\tafterKiep\tp4']
    predicted, changed = set(), set()
    for (d, D, a), (_, D2, b) in zip(days(pre), days(fwd), strict=True):
        assert D[1:4] == D2[1:4], d
        t = tot[part(d)]
        t['days'] += 1
        ctx, soil, kv = D[2], d in INSIDE, D[4]
        assert (D[3] == 'soil') == soil, ('calendars disagree', d)
        demo = next(r for r in a if r[0] == 'A' and r[2] == 'demolition')
        if ctx in SOIL and d in SCOPE[ctx] and soil and kv == 'no_annotation' and json.loads(demo[9])['state'] == 'baseline':
            predicted.add(d)
        demo_changed = False
        for x, y in zip(a, b, strict=True):
            assert x[:3] == y[:3], (d, x[:3])
            if x[0] == 'E':
                t['eventEvaluations'] += 1
                if x[5] != y[5]:
                    t['eventSemanticChanged'] += 1
                    t['eventScore'] += x[3] != y[3]
                    t['eventClassification'] += x[4] != y[4]
                    t['eventEvidenceOnly'] += (x[3], x[4]) == (y[3], y[4])
                elif x[6] != y[6]:
                    t['eventStampOnly'] += 1
                continue
            if x[2] != 'demolition':
                if x[3:] != y[3:]:
                    t['otherActivityChanged'] += 1
                    t['g2ActivityChanged'] += x[2] in G2
                continue
            if x[3:] == y[3:]:
                continue
            demo_changed = True
            t['outsideSoilRowsChanged'] += not soil
            s0, s1 = int(x[3]), int(y[3])
            if s0 != s1:
                t['scoreChanged'] += 1
                t['scoreLower' if s1 < s0 else 'scoreHigher'] += 1
                t['scoreDeltas'][f'{s1 - s0:+d}'] = t['scoreDeltas'].get(f'{s1 - s0:+d}', 0) + 1
            if x[4] != y[4]:
                t['statusChanged'] += 1
                t['statusTransitions'][f'{x[4]}→{y[4]}'] = t['statusTransitions'].get(f'{x[4]}→{y[4]}', 0) + 1
            t['hardWarningChanged'] += x[5] != y[5]
            if x[7] != y[7]:
                t['conclusionChanged'] += 1
                k = f'{kiep(x[7])}→{kiep(y[7])}'
                t['verdictTransitions'][k] = t['verdictTransitions'].get(k, 0) + 1
            t['p4StateChanged'] += x[9] != y[9]
            t['evidenceOnly'] += (s0, x[4], x[5]) == (s1, y[4], y[5])
            t['byContext'][ctx] = t['byContext'].get(ctx, 0) + 1
            rows.append('\t'.join([d, ctx, 'soil' if soil else '-', f'{x[3]} {x[4]}', f'{y[3]} {y[4]}',
                                   kiep(x[7]), kiep(y[7]), x[9]]))
        if demo_changed:
            t['demolitionChangedDays'] += 1
            changed.add(d)
    for t in tot.values():
        for k in ('statusTransitions', 'scoreDeltas', 'verdictTransitions', 'byContext'):
            t[k] = dict(sorted(t[k].items()))

    def key(t):
        return [t['demolitionChangedDays'], t['scoreChanged'], t['scoreLower'], t['scoreHigher'],
                t['statusChanged'], t['hardWarningChanged'], t['p4StateChanged']]
    stage1 = (S1 / 'r2-impact.tsv').read_text(encoding='utf-8').rstrip('\n').split('\n')
    g1a = {d for c in SOIL for d in SCOPE[c] if d in INSIDE and part(d) == 'outside'}
    checks = {
        'domainEnvelopeFrozen': key(tot['domain']) == [0] * 7 and tot['domain']['otherActivityChanged'] == 0,
        'outsideEnvelopeFrozen': key(tot['outside']) == FROZEN['outside']
        and tot['outside']['statusTransitions'] == FROZEN['transitions']
        and tot['outside']['scoreDeltas'] == FROZEN['deltas'] and tot['outside']['byContext'] == FROZEN['byContext']
        and tot['outside']['otherActivityChanged'] == 0,
        'noChangeOutsideSoil': tot['domain']['outsideSoilRowsChanged'] + tot['outside']['outsideSoilRowsChanged'] == 0,
        'eventSemanticZero': tot['domain']['eventSemanticChanged'] + tot['outside']['eventSemanticChanged'] == 0,
        'rowsEqualStage1R2Rows': rows == stage1,
        'predictionFromPreAndIndependentCalendarEqualsMeasured': predicted == changed,
        'g1aScopeInsideIndependentCalendarEqualsMeasured': g1a == changed,
    }
    hashes = {k: sha(p) for k, p in (('preG1SoilMain', pre), ('stage2Forward', fwd), ('stage2Rollback', rb),
                                     ('stage2ReEnable', re))}
    rollback = {
        'version': 'g1-soil-stage2-rollback-v1',
        'rollback': 'authority v3 imported in place of v4 (g1GlyphRollback.ts at the v4 path); the calendar-rule '
                    'service is only consulted for APPLIED_DATE_DEPENDENT contexts, which v3 does not have',
        'comparison': 'raw dump bytes, no normalization',
        'dumpSha256': hashes,
        'rollbackEqualsPreG1SoilMain': hashes['stage2Rollback'] == hashes['preG1SoilMain'],
        'reEnableEqualsForward': hashes['stage2ReEnable'] == hashes['stage2Forward'],
    }
    summary = {
        'version': 'g1-soil-stage2-summary-v1', 'range': ['1900-01-01', '2100-12-31'], 'sampling': 'none',
        'before': 'shipped d5c005f (authority v3)', 'after': 'G1-SOIL Stage 2 (authority v4, R2)',
        'migration': tot, 'checks': checks,
        'independent': {'measured': len(changed), 'predicted': len(predicted), 'g1aScopeInside': len(g1a),
                        'stage1Rows': len(stage1) - 1},
        'unexpected': sum(not v for v in checks.values()) + int(not rollback['rollbackEqualsPreG1SoilMain'])
        + int(not rollback['reEnableEqualsForward']),
    }
    events = {'version': 'g1-soil-stage2-event-diff-v1',
              'source': 'dump nsha (v4 id normalized to v3) vs rsha; authoritative full-JSON gate: authority-stamp.json',
              'counts': {p: {k: tot[p][k] for k in ('eventEvaluations', 'eventSemanticChanged', 'eventScore',
                                                     'eventClassification', 'eventEvidenceOnly', 'eventStampOnly')}
                         for p in tot}}
    texts = {k: json.dumps(v, ensure_ascii=False, indent=1) + '\n'
             for k, v in (('summary.json', summary), ('event-diff.json', events), ('rollback.json', rollback))}
    texts['activity-diff.tsv'] = '\n'.join(rows) + '\n'
    for k, v in texts.items():
        if '--write' in sys.argv:
            (OUT / k).write_text(v, encoding='utf-8')
        else:
            assert (OUT / k).read_text(encoding='utf-8') == v, f'{k} differs'
    print(json.dumps({'checks': checks, 'rollback': {k: rollback[k] for k in ('rollbackEqualsPreG1SoilMain',
                                                                              'reEnableEqualsForward')},
                      'events': events['counts'], 'unexpected': summary['unexpected']}, ensure_ascii=False))


if __name__ == '__main__':
    main(Path(sys.argv[1]))
