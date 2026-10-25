"""G1 glyph Stage 1 (audit only): exhaustive candidate impact from per-row dumps (1900-01-01 … 2100-12-31).

    python3 -I docs/audits/sources/p4-vol10/g1-glyph-stage1/compare.py DUMPS [--write]

DUMPS holds `G1GS1_DUMP=<model> G1GS1_OUT=DUMPS/<model> npx vitest run shared/lunar/p4G1GlyphStage1Audit.test.ts`
for model in forward (shipped production), fit, inwindow. Candidates measured against forward:
  fit       demolition APPLIED with the soil-absent cell (representable in the v2 schema)
  faithful  per day: inwindow inside the 土王用事 period (D line flag), fit outside (date-faithful G1-a cells)
Independent check: the changed-day set predicted from the forward dump + frozen cells alone, and the 劫煞
authority scope compared with puzhu17 scope-dates.json and the G1-a engine's full.json per-context counts.
Writes range-impact.json, range-impact-events.json, candidate-impact.tsv, independent-verification.json,
witnesses.json; default verifies them.
"""
import json
import sys
from pathlib import Path

OUT = Path('docs/audits/sources/p4-vol10/g1-glyph-stage1')
DOMAIN = ('2025-01-01', '2027-12-31')
CELLS = json.loads((OUT / 'authority-candidate.json').read_text(encoding='utf-8'))['contexts']
SCOPE = json.loads(Path('docs/audits/sources/p4-vol10/puzhu17-bujiang-v1/scope-dates.json').read_text(encoding='utf-8'))
G1A_FULL = json.loads(Path('docs/audits/sources/p4-vol10/g1a-demolition-authority-v1/full.json').read_text(encoding='utf-8'))
G2 = ('contract', 'transaction')
SCOPE_DATES = {d for v in SCOPE.values() for d in v}


def part(d):
    return 'domain' if DOMAIN[0] <= d <= DOMAIN[1] else 'outside'


def days(path):
    """Yield (date, D fields, rows) per day; rows = list of split lines after the D line."""
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


def counts():
    return {k: 0 for k in (
        'days', 'demolitionChangedDays', 'conclusionChanged', 'scoreChanged', 'scoreLower', 'scoreHigher',
        'statusChanged', 'hardWarningChanged', 'evidenceOnly', 'p4StateChanged', 'otherActivityChanged',
        'g2ActivityChanged')} | {'statusTransitions': {}, 'scoreDeltas': {}, 'verdictTransitions': {}}


def ecounts():
    return {k: 0 for k in ('evaluations', 'semanticChanged', 'semanticScore', 'semanticClassification',
                           'semanticEvidenceOnly', 'authorityStampOnly')} | {'semanticByEvent': {}}


def kiep(v):
    return next((x for x in v.split(' ') if x.startswith('kiep_sat:')), '-')


def main(dumps):
    fwd = days(dumps / 'forward/0-forward.tsv')
    fit = days(dumps / 'fit/0-fit.tsv')
    inw = days(dumps / 'inwindow/0-inwindow.tsv')
    act = {c: {'domain': counts(), 'outside': counts()} for c in ('fit', 'faithful')}
    ev = {c: {'domain': ecounts(), 'outside': ecounts()} for c in ('fit', 'faithful')}
    approx = {'domain': counts(), 'outside': counts()}  # faithful vs fit: cost of the schema fit
    tsv = ['candidate\tdate\tcontext\tsoil\tbefore\tafter\tbeforeKiep\tafterKiep\tp4Before\tp4After']
    scope_seen, predicted, missing_pred, p4_handled = {}, {'fit': set(), 'faithful': set()}, [], []
    changed = {'fit': set(), 'faithful': set()}
    witness_pool = []
    forward_rows, fit_rows, faithful_rows = {}, {}, {}
    for (d, D, a), (d2, D2, b), (d3, D3, c) in zip(fwd, fit, inw, strict=True):
        assert d == d2 == d3 and D[2:4] == D2[2:4] == D3[2:4], d
        ctx, soil, kv = D[2], D[3] == 'soil', D[4]
        p4 = json.loads(next(r for r in a if r[0] == 'A' and r[2] == 'demolition')[9])['state']
        in_scope = ctx in CELLS and (kv == 'no_annotation' or d in SCOPE_DATES)
        if in_scope:
            # Reached by the vol10 authority branch, or P4-handled (adapter row, no vol10 劫煞 row).
            scope_seen.setdefault(ctx, []).append((d, soil))
            if kv != 'no_annotation':
                p4_handled.append((d, ctx, soil, p4, kv))
            # Prediction: the cell changes the score only on the vol10 path (P4 state baseline).
            if kv == 'no_annotation' and p4 == 'baseline':
                if CELLS[ctx]['cellSoilAbsent'] == 'avoid':
                    predicted['fit'].add(d)
                if CELLS[ctx]['cellSoilAbsent'] == 'avoid' or soil:
                    predicted['faithful'].add(d)
        elif kv == 'no_annotation' and ctx[0] in '辰戌丑未':
            missing_pred.append((d, ctx))
        faithful = c if soil else b
        dem = lambda rows: next(r for r in rows if r[0] == 'A' and r[2] == 'demolition')
        forward_rows[d] = (D, dem(a))
        fit_rows[d] = dem(b)
        faithful_rows[d] = dem(faithful)
        for name, cand, base, tot, etot in (('fit', b, a, act['fit'], ev['fit']),
                                            ('faithful', faithful, a, act['faithful'], ev['faithful']),
                                            ('approx', faithful, b, approx, None)):
            t = tot[part(d)]
            t['days'] += 1
            demo_changed = False
            for x, y in zip(base, cand, strict=True):
                assert x[:3] == y[:3], (d, x[:3], y[:3])
                if x[0] == 'A':
                    if x[2] != 'demolition':
                        if x[3:] != y[3:]:
                            t['otherActivityChanged'] += 1
                            t['g2ActivityChanged'] += x[2] in G2
                        continue
                    if x[3:] == y[3:]:
                        continue
                    demo_changed = True
                    s0, s1 = int(x[3]), int(y[3])
                    if s0 != s1:
                        t['scoreChanged'] += 1
                        t['scoreLower' if s1 < s0 else 'scoreHigher'] += 1
                        k = f'{s1 - s0:+d}'
                        t['scoreDeltas'][k] = t['scoreDeltas'].get(k, 0) + 1
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
                    if (s0, x[4], x[5]) == (s1, y[4], y[5]):
                        t['evidenceOnly'] += 1
                    if name != 'approx':
                        tsv.append('\t'.join([name, d, ctx, 'soil' if soil else '-', f'{x[3]} {x[4]}',
                                              f'{y[3]} {y[4]}', kiep(x[7]), kiep(y[7]), x[9], y[9]]))
                        witness_pool.append((name, d, ctx, soil, x, y))
                elif x[0] == 'E' and etot is not None:
                    e = etot[part(d)]
                    e['evaluations'] += 1
                    if x[5] != y[5]:
                        e['semanticChanged'] += 1
                        e['semanticByEvent'][x[2]] = e['semanticByEvent'].get(x[2], 0) + 1
                        e['semanticScore'] += x[3] != y[3]
                        e['semanticClassification'] += x[4] != y[4]
                        e['semanticEvidenceOnly'] += (x[3], x[4]) == (y[3], y[4])
                    elif x[6] != y[6]:
                        e['authorityStampOnly'] += 1
            if demo_changed:
                t['demolitionChangedDays'] += 1
                if name != 'approx':
                    changed[name].add(d)
    for tot in (*act.values(), approx):
        for t in tot.values():
            for k in ('statusTransitions', 'scoreDeltas', 'verdictTransitions'):
                t[k] = dict(sorted(t[k].items()))
    for tot in ev.values():
        for t in tot.values():
            t['semanticByEvent'] = dict(sorted(t['semanticByEvent'].items()))

    # Independent verification.
    scope_dates = {k: sorted(x for x, _ in v) for k, v in scope_seen.items()}
    g1a = {k: {'inWindow': sum(1 for _, s in v if s), 'outOfWindow': sum(1 for _, s in v if not s)}
           for k, v in scope_seen.items()}
    g1a_ref = {k: {'inWindow': sum(v['inWindow'].values()), 'outOfWindow': sum(v['outOfWindow'].values())}
               for k, v in G1A_FULL.items()}
    ind = {
        'version': 'g1-glyph-stage1-independent-v1',
        'scopeDatesProduction': sum(len(v) for v in scope_dates.values()),
        'scopeEqualsPuzhu17ScopeDates': {k: sorted(v) for k, v in SCOPE.items()} == scope_dates,
        'soilSplitEqualsG1aEngineFull': g1a == g1a_ref,
        'perContext': {k: g1a[k] for k in sorted(g1a)},
        'noAnnotation辰戌丑未OutsideScope': len(missing_pred),
        'p4HandledScopeDates': [{'date': d, 'context': c, 'soil': so, 'p4State': st, 'vol10KiepSat': kv}
                                for d, c, so, st, kv in p4_handled],
        'p4HandledAllInDomain': all(part(d) == 'domain' for d, *_ in p4_handled),
        'note': ('production reaches the vol10 authority branch on scope dates minus P4-handled ones; inside '
                 '2025–2027 demolition is decided by the P4 adapter whenever its state is not baseline, so the '
                 'candidate cell cannot move the score there (measured domain envelope = 0)'),
        'predictedChangedDaysEqualMeasured': {k: predicted[k] == changed[k] for k in changed},
        'predictedChangedDays': {k: len(predicted[k]) for k in predicted},
        'measuredChangedDays': {k: len(changed[k]) for k in changed},
        'method': ['production resolveVol10 + candidate authority via vi.doMock (dump models fit / inwindow)',
                   'prediction from the forward dump (kiep_sat no_annotation days) + frozen cells only',
                   'G1-a corrected faithful engine (separate code path) per-context in/out-window counts'],
    }

    # Witnesses: chosen after the full envelope, deterministically: per category the first date on/after
    # 2028-01-01 (nearest after the P4 domain) and the last date on/before 2024-12-31.
    def pick(pred):
        pool = sorted(witness_pool, key=lambda w: (w[1], w[0]))
        after = next((w for w in pool if w[1] >= '2028-01-01' and pred(*w)), None)
        before = next((w for w in reversed(pool) if w[1] <= '2024-12-31' and pred(*w)), None)
        return [fmt(w) for w in (before, after) if w]

    def fmt(w):
        name, d, ctx, soil, x, y = w
        return {'candidate': name, 'date': d, 'context': ctx, 'soil': soil,
                'before': {'score': int(x[3]), 'status': x[4], 'kiepSat': kiep(x[7])},
                'after': {'score': int(y[3]), 'status': y[4], 'kiepSat': kiep(y[7])}}
    cats = {
        'fit neutral→watch (11 avoid contexts)': lambda n, d, c, s, x, y: n == 'fit' and (x[4], y[4]) == ('neutral', 'watch'),
        'fit watch→avoid (11 avoid contexts)': lambda n, d, c, s, x, y: n == 'fit' and (x[4], y[4]) == ('watch', 'avoid'),
        'faithful only: in-window, date-dependent context': lambda n, d, c, s, x, y: n == 'faithful' and s and CELLS[c]['dateDependent'],
    }
    def ctrl(d, why):
        f = forward_rows[d]
        return {'date': d, 'context': f[0][2], 'why': why, 'forward': f[1][3:5],
                'fit': fit_rows[d][3:5], 'faithful': faithful_rows[d][3:5],
                'unchanged': f[1][3:] == fit_rows[d][3:] == faithful_rows[d][3:]}
    firsts = lambda pred: next(d for d in sorted(forward_rows) if d >= '2028-01-01' and pred(forward_rows[d][0]))
    controls = [
        ctrl(firsts(lambda D: D[4] == '-'), 'first 2028+ day without 劫煞 on demolition'),
        ctrl(firsts(lambda D: D[4] == 'not_avoided'), 'first 2028+ 劫煞 day outside the no-德 authority branch (verdict not_avoided)'),
        ctrl(firsts(lambda D: D[2] in CELLS and CELLS[D[2]]['dateDependent'] and D[3] == '-' and D[4] == 'no_annotation'),
             'first 2028+ out-of-window day in a date-dependent context: blank in both candidates'),
        ctrl('2025-04-06', 'P4 domain scope day (辰-乙巳, avoid cell): P4 state neither_recorded decides, cell inert'),
        ctrl('2025-04-30', 'P4 domain scope day in window (辰-己巳): P4 only_ji decides, no vol10 劫煞 row'),
    ]
    witnesses = {
        'version': 'g1-glyph-stage1-witnesses-v1',
        'rule': 'computed after the full envelope; first date ≥ 2028-01-01 and last ≤ 2024-12-31 per category',
        'domain': 'no witness exists: the 2025–2027 envelope is empty for both candidates',
        'avoidToBlank': 'impossible current→candidate: current production leaves demolition at legacy no_annotation',
        'scoreHigher / scoreOnly / evidenceOnly': 'none in the envelope (every change is −15 with a status change)',
        'witnesses': {k: pick(p) for k, p in cats.items()},
        'controls': controls,
    }
    files = {
        'range-impact.json': {'version': 'g1-glyph-stage1-range-impact-v1', 'range': ['1900-01-01', '2100-12-31'],
                              'sampling': 'none', 'base': 'forward (shipped production)',
                              'candidates': act, 'faithfulVsFit': approx},
        'range-impact-events.json': {'version': 'g1-glyph-stage1-range-impact-events-v1',
                                     'normalized': 'candidate authority id → v2 in nsha; rsha raw',
                                     'candidates': ev},
        'independent-verification.json': ind,
        'witnesses.json': witnesses,
    }
    texts = {k: json.dumps(v, ensure_ascii=False, indent=1) + '\n' for k, v in files.items()}
    texts['candidate-impact.tsv'] = '\n'.join(tsv) + '\n'
    for k, v in texts.items():
        if '--write' in sys.argv:
            (OUT / k).write_text(v, encoding='utf-8')
        else:
            assert (OUT / k).read_text(encoding='utf-8') == v, f'{k} differs'
    print(json.dumps({c: {p: {k: act[c][p][k] for k in ('demolitionChangedDays', 'scoreChanged', 'statusChanged',
                                                         'hardWarningChanged', 'otherActivityChanged')}
                          for p in ('domain', 'outside')} for c in act}, ensure_ascii=False))
    print(json.dumps(ind, ensure_ascii=False)[:600])


if __name__ == '__main__':
    main(Path(sys.argv[1]))
