"""G1 glyph Stage 2 (R3): exhaustive migration diff from per-row dumps (every day 1900-01-01 … 2100-12-31).

    python3 -I docs/audits/sources/p4-vol10/g1-glyph-stage2/compare.py DUMPS STAGE1_DUMPS [--write]

DUMPS holds `G1GS2_DUMP=<models> G1GS2_OUT=DUMPS/<dir> npx vitest run shared/lunar/p4G1GlyphStage2Migration.test.ts`:
  pre/0-pre.tsv                       pre-G1-glyph main (f3c68c6 worktree, same harness + g1GlyphRollback.ts)
  fwd/0-forward.tsv                   Stage 2 as shipped (authority v3)
  rb/0-rollback.tsv, rb/1-forward.tsv rollback (authority v2), then re-enable, one process
STAGE1_DUMPS holds the Stage 1 dumps (lock.json reproduce): fit/0-fit.tsv is the frozen R3 candidate model.
Gates (spec §6, §7, §13; owner ruling R3): domain 0; outside 1,119 / −15 / 464 / 655; no other activity; changed
rows = Stage 1 candidate-impact.tsv fit rows; prediction from pre + v3 cells and the G1-a scope agree; forward =
Stage 1 fit model on every semantic field; rollback = pre and re-enable = forward as raw bytes.
Writes summary.json, activity-diff.tsv, event-diff.json, rollback.json; default verifies them.
"""
import hashlib
import json
import sys
from pathlib import Path

OUT = Path('docs/audits/sources/p4-vol10/g1-glyph-stage2')
DOMAIN = ('2025-01-01', '2027-12-31')
G2 = ('contract', 'transaction')
AUTH = json.loads(Path('shared/almanac-data/xieji-vol10-jiesha-authority-v3.json').read_text(encoding='utf-8'))
COV = AUTH['runtimeCoverage']['activities']['demolition']['contexts']
APPLIED = {k[0] + '-' + k[1:] for k, c in COV.items() if c['status'] == 'APPLIED'}
EXCLUDED = {k[0] + '-' + k[1:] for k, c in COV.items() if c['status'] != 'APPLIED'}
STAGE1_TSV = Path('docs/audits/sources/p4-vol10/g1-glyph-stage1/candidate-impact.tsv')
SCOPE = json.loads(Path('docs/audits/sources/p4-vol10/puzhu17-bujiang-v1/scope-dates.json').read_text(encoding='utf-8'))
FROZEN = {'domain': [0, 0, 0, 0, 0, 0, 0],
          'outside': [1119, 1119, 1119, 0, 1119, 0, 0],
          'transitions': {'neutral→watch': 464, 'watch→avoid': 655}, 'deltas': {'-15': 1119}}


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
                           'otherActivityChanged', 'g2ActivityChanged', 'excludedContextRowsChanged',
                           'eventEvaluations', 'eventSemanticChanged', 'eventScore', 'eventClassification',
                           'eventEvidenceOnly', 'eventStampOnly')} | {
        'statusTransitions': {}, 'scoreDeltas': {}, 'verdictTransitions': {}, 'changedByContext': {}}


def main(dumps, s1):
    pre, fwd = dumps / 'pre/0-pre.tsv', dumps / 'fwd/0-forward.tsv'
    rb, re = dumps / 'rb/0-rollback.tsv', dumps / 'rb/1-forward.tsv'
    fit = s1 / 'fit/0-fit.tsv'
    tot = {'domain': counts(), 'outside': counts()}
    rows = ['date\tcontext\tsoil\tbefore\tafter\tbeforeKiep\tafterKiep\tp4Before\tp4After']
    predicted, changed, cand_diff = set(), set(), []
    for (d, D, a), (_, D2, b), (_, D3, c) in zip(days(pre), days(fwd), days(fit), strict=True):
        assert D[1:4] == D2[1:4] == D3[1:4], d
        t = tot[part(d)]
        t['days'] += 1
        ctx, soil, kv = D[2], D[3] == 'soil', D[4]
        # Candidate equivalence: forward = Stage 1 fit model on every semantic field.
        for y, z in zip(b, c, strict=True):
            same = y[:7] == z[:7] and y[7:] == z[7:] if y[0] == 'A' else y[:6] == z[:6]
            if not same:
                cand_diff.append((d, y[:3]))
        if D2[4] != D3[4]:
            cand_diff.append((d, 'D'))
        demo = next(r for r in a if r[0] == 'A' and r[2] == 'demolition')
        if kv == 'no_annotation' and json.loads(demo[9])['state'] == 'baseline' and ctx in APPLIED:
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
            t['excludedContextRowsChanged'] += ctx in EXCLUDED
            s0, s1_ = int(x[3]), int(y[3])
            if s0 != s1_:
                t['scoreChanged'] += 1
                t['scoreLower' if s1_ < s0 else 'scoreHigher'] += 1
                t['scoreDeltas'][f'{s1_ - s0:+d}'] = t['scoreDeltas'].get(f'{s1_ - s0:+d}', 0) + 1
            if x[4] != y[4]:
                t['statusChanged'] += 1
                k = f'{x[4]}→{y[4]}'
                t['statusTransitions'][k] = t['statusTransitions'].get(k, 0) + 1
            t['hardWarningChanged'] += x[5] != y[5]
            if x[7] != y[7]:
                t['conclusionChanged'] += 1
                k = f'{kiep(x[7])}→{kiep(y[7])}'
                t['verdictTransitions'][k] = t['verdictTransitions'].get(k, 0) + 1
            t['p4StateChanged'] += x[9] != y[9]
            t['evidenceOnly'] += (s0, x[4], x[5]) == (s1_, y[4], y[5])
            t['changedByContext'][ctx] = t['changedByContext'].get(ctx, 0) + 1
            rows.append('\t'.join([d, ctx, 'soil' if soil else '-', f'{x[3]} {x[4]}', f'{y[3]} {y[4]}',
                                   kiep(x[7]), kiep(y[7]), x[9], y[9]]))
        if demo_changed:
            t['demolitionChangedDays'] += 1
            changed.add(d)
    for t in tot.values():
        for k in ('statusTransitions', 'scoreDeltas', 'verdictTransitions', 'changedByContext'):
            t[k] = dict(sorted(t[k].items()))

    def key(t):
        return [t['demolitionChangedDays'], t['scoreChanged'], t['scoreLower'], t['scoreHigher'],
                t['statusChanged'], t['hardWarningChanged'], t['p4StateChanged']]
    stage1 = [r.split('\t')[1:] for r in STAGE1_TSV.read_text(encoding='utf-8').rstrip('\n').split('\n')[1:]
              if r.startswith('fit\t')]
    g1a = {d for k, v in SCOPE.items() if k in APPLIED for d in v if part(d) == 'outside'}
    checks = {
        'domainEnvelopeFrozen': key(tot['domain']) == FROZEN['domain'] and tot['domain']['otherActivityChanged'] == 0,
        'outsideEnvelopeFrozen': key(tot['outside']) == FROZEN['outside']
        and tot['outside']['statusTransitions'] == FROZEN['transitions']
        and tot['outside']['scoreDeltas'] == FROZEN['deltas'] and tot['outside']['otherActivityChanged'] == 0,
        'excludedContextsUnchanged': tot['domain']['excludedContextRowsChanged'] + tot['outside']['excludedContextRowsChanged'] == 0,
        'eventSemanticZero': tot['domain']['eventSemanticChanged'] + tot['outside']['eventSemanticChanged'] == 0,
        'rowsEqualStage1FitRows': [r.split('\t') for r in rows[1:]] == stage1,
        'predictionFromPreAndV3CellsEqualsMeasured': predicted == changed,
        'g1aScopeOfAppliedContextsEqualsMeasured': g1a == changed,
        'changedContextsSubsetOfApplied': set(tot['outside']['changedByContext']) <= APPLIED,
        'forwardEqualsStage1FitModel': not cand_diff,
    }
    hashes = {k: sha(p) for k, p in (('preG1GlyphMain', pre), ('stage2Forward', fwd), ('stage2Rollback', rb),
                                     ('stage2ReEnable', re), ('stage1FitModel', fit))}
    rollback = {
        'version': 'g1-glyph-stage2-rollback-v1',
        'rollback': 'authority v2 imported in place of v3 (g1GlyphRollback.ts at the v3 path); nothing else differs',
        'comparison': 'raw dump bytes, no normalization',
        'dumpSha256': hashes,
        'rollbackEqualsPreG1GlyphMain': hashes['stage2Rollback'] == hashes['preG1GlyphMain'],
        'reEnableEqualsForward': hashes['stage2ReEnable'] == hashes['stage2Forward'],
    }
    summary = {
        'version': 'g1-glyph-stage2-summary-v1',
        'range': ['1900-01-01', '2100-12-31'], 'sampling': 'none',
        'before': 'shipped f3c68c6 (authority v2)', 'after': 'G1 glyph Stage 2 (authority v3, R3)',
        'migration': tot,
        'checks': checks,
        'candidateDifferences': len(cand_diff),
        'independent': {
            'measured': len(changed), 'predictedFromPreAndV3Cells': len(predicted),
            'g1aScopeAppliedOutside': len(g1a), 'stage1FitRows': len(stage1),
        },
        'unexpected': sum(not v for v in checks.values()) + int(not rollback['rollbackEqualsPreG1GlyphMain'])
        + int(not rollback['reEnableEqualsForward']),
    }
    events = {
        'version': 'g1-glyph-stage2-event-diff-v1',
        'source': 'dump nsha (authority id normalized v3 → v2) vs rsha (raw); authoritative full-JSON gate: authority-stamp.json',
        'counts': {p: {k: tot[p][k] for k in ('eventEvaluations', 'eventSemanticChanged', 'eventScore',
                                               'eventClassification', 'eventEvidenceOnly', 'eventStampOnly')}
                   for p in tot},
    }
    texts = {'summary.json': summary, 'event-diff.json': events, 'rollback.json': rollback}
    texts = {k: json.dumps(v, ensure_ascii=False, indent=1) + '\n' for k, v in texts.items()}
    texts['activity-diff.tsv'] = '\n'.join(rows) + '\n'
    for k, v in texts.items():
        if '--write' in sys.argv:
            (OUT / k).write_text(v, encoding='utf-8')
        else:
            assert (OUT / k).read_text(encoding='utf-8') == v, f'{k} differs'
    print(json.dumps({'checks': checks, 'rollback': {k: rollback[k] for k in ('rollbackEqualsPreG1GlyphMain',
                                                                              'reEnableEqualsForward')},
                      'unexpected': summary['unexpected'], 'cand_diff_sample': cand_diff[:5]}, ensure_ascii=False))


if __name__ == '__main__':
    main(Path(sys.argv[1]), Path(sys.argv[2]))
