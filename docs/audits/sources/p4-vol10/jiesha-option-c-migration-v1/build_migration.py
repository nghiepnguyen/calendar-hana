"""Option C v1 projection: summarise the real production migration (migration-rows.json, written by
xiejiVol10JieshaMigration.test.ts with JIESHA_MIGRATION_FULL=1) and reconcile it with the faithful simulator.

Run: python3 -I docs/audits/sources/p4-vol10/jiesha-option-c-migration-v1/build_migration.py
"""
import collections
import hashlib
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
P4 = HERE.parent
ROOT = HERE.parents[4]
load = lambda p: json.loads(p.read_text(encoding='utf-8'))
mig = load(HERE / 'migration-rows.json')
cov = load(HERE / 'coverage.json')
raw = load(P4 / 'jiesha-faithful-vol10-v1' / 'raw.json')
scope = load(P4 / 'puzhu17-bujiang-v1' / 'scope-dates.json')
ctx_of = {d: c for c, ds in scope.items() for d in ds}
inw = lambda d: '2025-01-01' <= d <= '2027-12-31'
C = collections.Counter

acts = [r for r in mig['rows'] if 'activity' in r]
events = [r for r in mig['rows'] if 'event' in r]
applied_avoid = C(r['context'] for r in cov['rows'] if r['runtimeStatus'] == 'APPLIED' and r['auditVerdict'] == 'avoid')
verdicts = sum(applied_avoid[c.replace('-', '')] for c in ctx_of.values())
cls = lambda e: (e['result'][0].split(':')[1], e['result'][1].split(':')[1])
impact = {
    'datesRun': mig['dates'], 'scopeDates': mig['scopeDates'],
    'affectedDates': len({r['date'] for r in mig['rows']}),
    'rowsOutsideScope': sum(1 for r in mig['rows'] if not r.get('context')),
    'verdictChanges': verdicts,
    # 2025–2027 scope dates: resolveVol10 verdicts change but P4 balancing owns those activities' scores.
    'verdictChangesWithoutScoreEffect2025_2027': sum(applied_avoid[c.replace('-', '')] for d, c in ctx_of.items() if inw(d)),
    'rawScoreChanges': sum(r['rowsChanged'] for r in acts),
    'effectiveScoreChanges': sum(r['score'][0] != r['score'][1] for r in acts),
    'scoreDelta': dict(C(r['score'][1] - r['score'][0] for r in acts)),
    'ratingChanges': dict(C('→'.join(r['status']) for r in acts if r['status'][0] != r['status'][1]).most_common()),
    'visibleActivityChanges': sum(r['status'][0] != r['status'][1] or r['hardWarning'][0] != r['hardWarning'][1] for r in acts),
    'cellOfChangedRows': dict(C(str(r['cell']) for r in acts)),
    'byActivity': dict(sorted(C(r['activity'] for r in acts).items())),
    'activityRowsIn2025_2027': sum(inw(r['date']) for r in acts),
    'eventScoreChanges': sum(r['result'][0].split(':')[0] != r['result'][1].split(':')[0] for r in events),
    'eventRows': len(events),
    'eventClassificationChanges': dict(C(f"{r['event']}:{'→'.join(cls(r))}" for r in events if cls(r)[0] != cls(r)[1]).most_common()),
}

# Reconciliation with the d79b08e simulator (P17-0 table, P4 candidate applied in 2025–2027).
prod = {(r['date'], r['activity']): (r['score'][0], r['score'][1], r['status'][0], r['status'][1]) for r in acts}
sim = {(d['date'], a['activityId']): (a['score'][0], a['score'][1], a['status'][0], a['status'][1])
       for d in raw['days'] for a in d['f']['activities'] if a['score'][0] != a['score'][1] or a['status'][0] != a['status'][1]}
pev = {(r['date'], r['event']): cls(r) for r in events}
sev = {(d['date'], e['id']): tuple(e['classification']) for d in raw['days'] for e in d['f']['events']}


def reconcile(p, s, key_activity):
    out, residual = C(), []
    for k in sorted(set(p) | set(s)):
        a, b = p.get(k), s.get(k)
        if a == b:
            out['identical'] += 1
        elif inw(k[0]) and a is None:
            out['simulatorOnly2025_2027 (P4 candidate; P4 not migrated)'] += 1
        elif ctx_of.get(k[0]) == '未-壬申' and b is None and (not key_activity or k[1] in ('wedding', 'engagement', 'moving')):
            out['productionOnly 未-壬申 (P17-A, approved authority)'] += 1
        else:
            residual.append([*k, a, b])
    return dict(out), residual


act_rec, act_res = reconcile(prod, sim, True)
ev_rec, ev_res = reconcile(pev, sev, False)
glyph = {a: {'simulatorOutside2025_2027': sum(1 for (d, x) in sim if x == a and not inw(d)),
             'productionOutside2025_2027': sum(1 for (d, x) in prod if x == a and not inw(d)),
             'simulator2025_2027': sum(1 for (d, x) in sim if x == a and inw(d)),
             'production2025_2027': sum(1 for (d, x) in prod if x == a and inw(d))}
         for a in ('demolition', 'contract', 'transaction')}
summary = {
    'version': 'jiesha-option-c-migration-v1',
    'coverage': cov['summary'],
    'impact': impact,
    'reconciliation': {
        'approvedCandidateSimulator': 'exact: xiejiVol10JieshaMigration.test.ts compares production with a legacy '
                                      'runtime + candidate-table wrapper on every date run (0 mismatches)',
        'd79b08eSimulator': {'activities': act_rec, 'events': ev_rec, 'residualActivities': act_res,
                             'residualEvents': ev_res, 'glyphActivities': glyph},
    },
    'inputs': {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest()
               for p in (HERE / 'migration-rows.json', HERE / 'coverage.json', P4 / 'jiesha-faithful-vol10-v1' / 'raw.json')},
}
(HERE / 'migration-summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(json.dumps({k: summary[k] for k in ('impact',)}, ensure_ascii=False, indent=1))
print(json.dumps(summary['reconciliation']['d79b08eSimulator']['glyphActivities'], ensure_ascii=False), len(act_res), len(ev_res))
