"""G1-SOIL Stage 1 (audit only): exhaustive candidate impact against shipped authority v3 (1900-01-01 … 2100-12-31).

    python3 -I docs/audits/sources/p4-vol10/g1-soil-stage1/compare.py DUMPS [--write]

DUMPS holds `G1SOIL_DUMP=<model> G1SOIL_OUT=DUMPS/<model> npx vitest run shared/lunar/p4G1SoilStage1Audit.test.ts`
for forward (v3), avoid5, blank5. Candidates against forward:
  R2        per day: avoid5 inside 土王用事 (D-line flag = production calendar), forward outside
  R1        blank5 (static blank)
  avoid     avoid5 (static avoid)
Independent checks: the R2 changed set predicted from the forward dump + the independent JPL-row calendar
(soil-calendar.json) + the 5 contexts; the G1-a engine's per-context in/out counts; every soil day in a 季月.
Writes r2-impact.json, r2-impact.tsv, event-impact.json, counterfactuals.json, witnesses.json; default verifies.
"""
import hashlib
import json
import sys
from datetime import date, timedelta
from pathlib import Path

OUT = Path('docs/audits/sources/p4-vol10/g1-soil-stage1')
DOMAIN = ('2025-01-01', '2027-12-31')
EXCLUDED = {'丑-甲寅', '丑-丙寅', '丑-壬寅', '丑-戊寅', '未-戊申'}
CAL = json.loads((OUT / 'soil-calendar.json').read_text(encoding='utf-8'))
G1A = json.loads(Path('docs/audits/sources/p4-vol10/g1a-demolition-authority-v1/full.json').read_text(encoding='utf-8'))
SCOPE = json.loads(Path('docs/audits/sources/p4-vol10/puzhu17-bujiang-v1/scope-dates.json').read_text(encoding='utf-8'))
G2 = ('contract', 'transaction')


def soil_days():
    s = set()
    for ws in CAL['windows'].values():
        for w in ws:
            d = date.fromisoformat(w['onset'])
            while d <= date.fromisoformat(w['eve']):
                s.add(d.isoformat())
                d += timedelta(1)
    return s


INSIDE = soil_days()
ONSETS = {w['onset'] for ws in CAL['windows'].values() for w in ws}
EVES = {w['eve'] for ws in CAL['windows'].values() for w in ws}


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
                           'otherActivityChanged', 'g2ActivityChanged', 'insideSoil', 'outsideSoil',
                           'eventEvaluations', 'eventSemanticChanged', 'eventScore', 'eventClassification',
                           'eventEvidenceOnly', 'eventStampOnly')} | {
        'statusTransitions': {}, 'scoreDeltas': {}, 'verdictTransitions': {}, 'byContext': {}}


def diff(t, d, ctx, soil, a, b, rows=None):
    changed = False
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
        changed = True
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
        t['insideSoil' if soil else 'outsideSoil'] += 1
        if rows is not None:
            rows.append((d, ctx, soil, x, y))
    if changed:
        t['demolitionChangedDays'] += 1
    return changed


def main(dumps):
    f, av, bl = dumps / 'forward/0-forward.tsv', dumps / 'avoid5/0-avoid5.tsv', dumps / 'blank5/0-blank5.tsv'
    tot = {c: {'domain': counts(), 'outside': counts()} for c in ('R2', 'R1_staticBlank', 'staticAvoid')}
    r2rows, predicted, changed_r2, wrong = [], set(), set(), {'staticBlankWrong': 0, 'staticAvoidWrong': 0}
    occ = {'total': 0, 'inside': 0, 'outside': 0, 'insideDomain': 0, 'p4Handled': []}
    struct_bad, calendar_flag_mismatch, controls_src = [], [], {}
    for (d, D, a), (_, D2, b), (_, D3, c) in zip(days(f), days(av), days(bl), strict=True):
        assert D[1:4] == D2[1:4] == D3[1:4], d
        ctx, soil_ts, kv = D[2], D[3] == 'soil', D[4]
        soil = d in INSIDE
        if soil != soil_ts:
            calendar_flag_mismatch.append(d)
        if soil and ctx[0] not in '辰未戌丑':
            struct_bad.append((d, ctx))
        p = part(d)
        for t in tot.values():
            t[p]['days'] += 1
        r2 = b if soil_ts else a
        if diff(tot['R2'][p], d, ctx, soil, a, r2, r2rows):
            changed_r2.add(d)
        diff(tot['R1_staticBlank'][p], d, ctx, soil, a, c)
        diff(tot['staticAvoid'][p], d, ctx, soil, a, b)
        demo = next(r for r in a if r[0] == 'A' and r[2] == 'demolition')
        if ctx in EXCLUDED and d in {x for x in SCOPE[ctx]}:
            occ['total'] += 1
            occ['inside' if soil else 'outside'] += 1
            occ['insideDomain'] += soil and p == 'domain'
            if kv != 'no_annotation':
                occ['p4Handled'].append({'date': d, 'context': ctx, 'soil': soil, 'p4': json.loads(demo[9])['state']})
            wrong['staticBlankWrong' if soil else 'staticAvoidWrong'] += 1
            # Mechanism 2: changes only where the vol10 path decides (P4 state baseline) and the date is inside.
            if soil and kv == 'no_annotation' and json.loads(demo[9])['state'] == 'baseline':
                predicted.add(d)
        if d in ('2028-01-01', '2028-01-06', '2028-04-14', '2025-04-06', '2025-04-30', '2025-02-02'):
            controls_src[d] = (ctx, soil, a, r2)
    for c in tot.values():
        for t in c.values():
            for k in ('statusTransitions', 'scoreDeltas', 'verdictTransitions', 'byContext'):
                t[k] = dict(sorted(t[k].items()))
    g1a_inside = sum(sum(G1A[k]['inWindow'].values()) for k in EXCLUDED)
    g1a_outside = sum(sum(G1A[k]['outOfWindow'].values()) for k in EXCLUDED)
    observable_blank_wrong = len(changed_r2)
    independent = {
        'version': 'g1-soil-stage1-independent-v1',
        'calendarsAgreeOnEveryDay': not calendar_flag_mismatch,
        'soilDaysAllInJiYue': not struct_bad,
        'predictedFromV3PlusIndependentCalendarEqualsMeasured': predicted == changed_r2,
        'measuredR2ChangedDays': len(changed_r2), 'predicted': len(predicted),
        'g1aEngineInside': g1a_inside, 'g1aEngineOutside': g1a_outside,
        'occurrencesMatchG1a': (occ['inside'], occ['outside']) == (g1a_inside, g1a_outside),
        # Mechanism 3 on dates, without the dump: G1-a-tied scope dates of the 5 contexts ∩ the independent
        # calendar's inside days, minus 2025–2027 (P4-handled).
        'g1aScopeInsideOutsideDomainEqualsMeasured': {d for c in EXCLUDED for d in SCOPE[c]
                                                      if d in INSIDE and part(d) == 'outside'} == changed_r2,
        'r2ChangesOnlyInExcludedContexts': set(tot['R2']['outside']['byContext']) <= EXCLUDED
        and not tot['R2']['domain']['byContext'],
    }
    stake = {
        'occurrences': occ['total'], 'inside': occ['inside'], 'outside': occ['outside'],
        'insideInP4Domain': occ['insideDomain'],
        'staticBlankWrong': wrong['staticBlankWrong'], 'staticAvoidWrong': wrong['staticAvoidWrong'],
        'staticBlankWrongObservable': observable_blank_wrong,
        'currentlyExcludedByV3': occ['total'],
        'p4HandledOccurrences': occ['p4Handled'],
        'explanation': ('static blank is wrong on every inside occurrence (303); it is observable only where the '
                        'vol10 path decides demolition: the 5 inside occurrences in 2025–2027 are P4-handled '
                        '(state only_ji, 土王用事後 protected), so 303 − 5 = 298 change output'),
    }
    rows = ['date\tcontext\tsoil\tbefore\tafter\tbeforeKiep\tafterKiep\tp4']
    for d, ctx, soil, x, y in r2rows:
        rows.append('\t'.join([d, ctx, 'soil' if soil else '-', f'{x[3]} {x[4]}', f'{y[3]} {y[4]}', kiep(x[7]),
                               kiep(y[7]), x[9]]))
    pool = sorted(r2rows)

    def w(pred):
        for d, ctx, soil, x, y in pool:
            if pred(d, ctx):
                return {'date': d, 'context': ctx, 'soil': soil, 'before': f'{x[3]} {x[4]}', 'after': f'{y[3]} {y[4]}',
                        'kiep': f'{kiep(x[7])} → {kiep(y[7])}'}
    same_ctx = []
    for d, ctx, soil, x, y in pool:
        if d >= '2028-01-01':
            outs = sorted((o for o in SCOPE[ctx] if o not in INSIDE),
                          key=lambda o: abs((date.fromisoformat(o) - date.fromisoformat(d)).days))  # one per 季月 a year
            if outs:
                same_ctx = [{'date': d, 'context': ctx, 'soil': True, 'cell': 'avoid', 'r2': f'{y[3]} {y[4]}',
                             'v3': f'{x[3]} {x[4]}'},
                            {'date': outs[0], 'context': ctx, 'soil': False, 'cell': 'blank',
                             'r2': 'unchanged (= v3 legacy output)'}]
                break
    witnesses = {
        'version': 'g1-soil-stage1-witnesses-v1',
        'rule': 'computed after the full envelope; first date ≥ 2028 per category unless noted',
        'sameContextTwoDates': same_ctx,
        'entryBoundary': w(lambda d, c: d in ONSETS),
        'exitBoundary': w(lambda d, c: d in EVES),
        'watchToAvoid': w(lambda d, c: d >= '2028-01-01'),
        'firstAfterDomain': w(lambda d, c: d > DOMAIN[1]),
        'lastBeforeDomain': next(({'date': d, 'context': ctx} for d, ctx, *_ in reversed(pool) if d < DOMAIN[0]), None),
        'p4Masked': occ['p4Handled'],
        'controls': {d: {'context': v[0], 'soil': v[1],
                         'demolitionUnchanged': next(r for r in v[2] if r[0] == 'A' and r[2] == 'demolition')[3:] ==
                         next(r for r in v[3] if r[0] == 'A' and r[2] == 'demolition')[3:],
                         'allActivitiesUnchanged': [r[3:] for r in v[2] if r[0] == 'A'] ==
                         [r[3:] for r in v[3] if r[0] == 'A']} for d, v in sorted(controls_src.items())},
    }
    files = {
        'r2-impact.json': {'version': 'g1-soil-stage1-r2-impact-v1', 'range': ['1900-01-01', '2100-12-31'],
                           'sampling': 'none', 'base': 'shipped d5c005f (authority v3)',
                           'calendar': 'production thoVuongDungSu (D-line flag); = soil-calendar.json on every day',
                           'R2': tot['R2'], 'stake': stake, 'independent': independent},
        'counterfactuals.json': {'version': 'g1-soil-stage1-counterfactuals-v1', 'R1_staticBlank': tot['R1_staticBlank'],
                                 'staticAvoid': tot['staticAvoid'], 'R3_current': 'baseline (0 by definition)'},
        'event-impact.json': {'version': 'g1-soil-stage1-event-impact-v1',
                              'source': 'dump nsha (candidate id normalized to v3) vs rsha (raw)',
                              'R2': {p: {k: tot['R2'][p][k] for k in ('eventEvaluations', 'eventSemanticChanged',
                                                                      'eventScore', 'eventClassification',
                                                                      'eventEvidenceOnly', 'eventStampOnly')}
                                     for p in ('domain', 'outside')}},
        'witnesses.json': witnesses,
    }
    files['r2-impact.json']['dumpSha256'] = {k: sha(p) for k, p in (('forward', f), ('avoid5', av), ('blank5', bl))}
    texts = {k: json.dumps(v, ensure_ascii=False, indent=1) + '\n' for k, v in files.items()}
    texts['r2-impact.tsv'] = '\n'.join(rows) + '\n'
    for k, v in texts.items():
        if '--write' in sys.argv:
            (OUT / k).write_text(v, encoding='utf-8')
        else:
            assert (OUT / k).read_text(encoding='utf-8') == v, f'{k} differs'
    print(json.dumps({'R2': {p: {k: tot['R2'][p][k] for k in ('demolitionChangedDays', 'scoreChanged', 'statusChanged',
                                                              'otherActivityChanged', 'eventSemanticChanged',
                                                              'eventStampOnly')} for p in ('domain', 'outside')},
                      'R2tx': tot['R2']['outside']['statusTransitions'], 'stake': {k: v for k, v in stake.items()
                                                                                   if k != 'p4HandledOccurrences'},
                      'independent': independent,
                      'R1': tot['R1_staticBlank']['outside']['demolitionChangedDays'],
                      'avoid': tot['staticAvoid']['outside']['demolitionChangedDays']}, ensure_ascii=False))


if __name__ == '__main__':
    main(Path(sys.argv[1]))
