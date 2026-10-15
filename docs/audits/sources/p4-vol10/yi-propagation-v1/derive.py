#!/usr/bin/env python3
"""P4-C 5.4 independent propagation/protection/override expected; never calls a resolver.

Inputs are hash-bound: the frozen P4-B baseline facts (task 1.4, evaluator db382ba), the
frozen 11-operand domain Golden (3.3), the locked authority (2.14), source-transcribed
artifacts and raw 卷十. New 宜 evidence is recomputed from those inputs only. Rows are
1,095 civil dates x 29 headings, the same domain as the baseline.
"""
import argparse
import collections
import csv
import hashlib
import json
from pathlib import Path

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[4]
INPUTS = {
    'baseline': 'docs/audits/sources/p4-vol10/yi-baseline-v1/baseline.tsv',
    'domains': 'docs/audits/sources/p4-vol10/yi-domains-v1/expected.tsv',
    'composition': 'docs/audits/sources/p4-vol10/yi-composition-expected-v1/expected.json',
    'compositionBasis': 'docs/audits/sources/p4-vol10/yi-composition-expected-v1/source-basis.json',
    'authority': 'shared/almanac-data/p4-yi-operands-v1.json',
    'dayComposition': 'shared/almanac-data/p4-vol10-day-composition-v2.json',
    'remainingJi': 'shared/almanac-data/p4-vol10-remaining-ji-v7.json',
    'vol10': 'docs/audits/sources/p4-vol10/vol10.raw.txt',
}
# Prior locks: baseline lock (1.4), Golden index (3.6), composition integrity lock (3.4).
PINNED = {
    'baseline': '6484bab71f7c7762a916ea792e305183311c9d62e43deb48b762813b35fec1d2',
    'domains': '5bca2923e5f12cfd84a6fece3f64e53f3aea51f208b8b11aab1ba56c9e685e32',
    'composition': '1203bf64af5fab303a7a9d89b69ba80206af7b91e0e02b8e3860a50391651994',
    'authority': '8c15e14bf21277004158b87c5ca36b285b44766c7704e1014e2f5ec94fe8a3fb',
    'dayComposition': 'fbd601faa2a84be78912d4f778a8c498dd095d2bb6f8e585addfef861172ea12',
    'remainingJi': 'da9aa906ac6694bca84f498d00f5327081d7ffa955d787d650c98c5de54f691c',
}
VOL10_SHA1 = '355dc6c8fe2d815c2fdec51b25228836cfea6025'
BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
# 卷十 刼煞 entry: 寅申月 收日 (月令長生 + 六合) keeps only these 忌 (止忌), every other 忌 lifted.
JIESHA_STOP = ('寅申巳亥月值收日為月令長生寅申月又值六合止忌安撫邊境選將訓兵出師求醫療病', 11351)
JIESHA_ANCHOR = ('{{SK anchor|刼煞}}', 11115)


def sha256(rel):
    return hashlib.sha256((ROOT / rel).read_bytes()).hexdigest()


def load():
    for key, digest in PINNED.items():
        if sha256(INPUTS[key]) != digest:
            raise SystemExit(f'pinned input changed: {key}')
    vol10 = (ROOT / INPUTS['vol10']).read_text(encoding='utf-8')
    if hashlib.sha1((ROOT / INPUTS['vol10']).read_bytes()).hexdigest() != VOL10_SHA1:
        raise SystemExit('vol10 raw changed')
    for text, offset in (JIESHA_STOP, JIESHA_ANCHOR):
        if vol10[offset:offset + len(text)] != text:
            raise SystemExit(f'source slice mismatch at {offset}')
    rows = list(csv.DictReader((ROOT / INPUTS['baseline']).open(newline='', encoding='utf-8'), delimiter='\t'))
    domains = {r['id']: r for r in csv.DictReader((ROOT / INPUTS['domains']).open(newline='', encoding='utf-8'), delimiter='\t')}
    load_json = lambda key: json.loads((ROOT / INPUTS[key]).read_text(encoding='utf-8'))
    return rows, domains, vol10, {k: load_json(k) for k in ('composition', 'compositionBasis', 'authority', 'dayComposition', 'remainingJi')}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--write', action='store_true', help='exclusive creation; never overwrites')
    args = parser.parse_args()
    rows, domains, vol10, data = load()
    heading_map = data['compositionBasis']['normalization']['headingMap']
    norm = lambda h: heading_map.get(h, h)
    entries = data['authority']['entries']
    eligible = collections.defaultdict(list)
    for entry in entries:
        for scope in entry['headingScopes']:
            if scope['mode'] == 'DIRECT_YI':
                eligible[norm(scope['normalized'])].append(entry)
    trace_id = {e['han']: 'p4yi:' + e['id'] for e in entries}

    def presence(entry, row):
        gid, month, pillar = entry['id'], row['month_jian'], row['pillar']
        if gid == 'mu-cang':
            record = domains[f'mu-cang:MU_CANG_DATED_1095:{row["date"]}']
            inputs = json.loads(record['inputs'])
            if inputs['DAY_BRANCH'] != pillar[1]:
                raise SystemExit(f'dated day mismatch {row["date"]}')
            if inputs['MONTH_JIAN_BRANCH'] != month:
                # Jie civil day: the almanac/baseline assigns the new Month Jian to the whole day,
                # the dated domain samples local noon. Use the frozen conditional truth table with
                # the baseline Month Jian and the date-only soil state (CONVENTION_DIFFERENCE).
                jie_days[row['date']] = {'baselineMonthJian': month, 'noonMonthJian': inputs['MONTH_JIAN_BRANCH'],
                                         'soil': inputs['SOIL_REIGN_STATE']['state']}
                record = domains[f'mu-cang:MU_CANG_CONDITIONAL_1440:{month}-{pillar}-{inputs["SOIL_REIGN_STATE"]["state"]}']
        else:
            record = domains.get(f'{gid}:DAY_PILLAR_60:{pillar}') or domains[f'{gid}:MONTH_PILLAR_720:{month}-{pillar}']
        return json.loads(record['expected'])['outcome']

    jie_days = {}
    by_date = collections.defaultdict(dict)
    evidence = {}
    tsv = [['date', 'month_jian', 'pillar', 'heading', 'eligible_p4c', 'p4c_presence', 'legacy_present',
            'expected_evidence_yi', 'expected_unresolved_p4c', 'baseline_pre_yi', 'expected_recorded_yi']]
    ambiguous_recorded = []
    for row in rows:
        h = row['heading']
        if h in by_date[row['date']]:
            raise SystemExit('duplicate row')
        by_date[row['date']][h] = row
        gods = [] if row['raw_yi'] == 'deferred' else eligible.get(h, [])
        states = [presence(e, row) for e in gods]
        if row['raw_yi'] == 'deferred':
            ev = None  # 修倉庫 compound warehouse clause stays P5.
        elif row['known_present_yi_gods'] or 'present' in states:
            ev = True
        elif 'unknown' in states:
            ev = None
        else:
            ev = False
        # Recorded 宜 only changes where the baseline recorded value was unknown; a recorded false
        # was either suppression or known absence, a recorded true was legacy evidence.
        pre = row['pre_yi']
        recorded = ev if pre == 'unknown' else pre == 'true'
        if pre == 'false' and ev is not False and row['raw_yi'] == 'false':
            ambiguous_recorded.append(f'{row["date"]}:{h}')
        evidence[(row['date'], h)] = (ev, recorded)
        enc = lambda v: 'null' if v is None else str(v).lower()
        tsv.append([row['date'], row['month_jian'], row['pillar'], h,
                    '+'.join(e['han'] for e in gods), '+'.join(states), row['known_present_yi_gods'],
                    enc(ev), '+'.join(trace_id[e['han']] for e, s in zip(gods, states) if s == 'unknown'),
                    pre, enc(recorded)])
    if len(rows) != 31755 or len(by_date) != 1095 or any(len(v) != 29 for v in by_date.values()):
        raise SystemExit('baseline domain shape changed')
    if ambiguous_recorded:
        raise SystemExit(f'ambiguous recorded 宜 rows: {ambiguous_recorded[:5]}')

    # Propagation bound. Lines come from 鋪註 11, 16-24; a heading outside the 29-heading catalog
    # is never evaluated, so it neither fires nor receives.
    edges = []
    for line in data['dayComposition']['propagation']['lines']:
        if 'pairs' in line:
            edges += [(line['id'], [norm(a)], [norm(b)], False) for a, b in line['pairs']]
        elif 'from' in line:
            edges.append((line['id'], [norm(x) for x in line['from']], [norm(x) for x in line['to']], line.get('requireAll', False)))

    def resolves(row):
        # A 宜 that was unknown before P4-C and is known now; only such rows may change state.
        return row['pre_state'] == 'undetermined' and row['pre_yi'] == 'unknown' and evidence[(row['date'], row['heading'])][1] is not None

    reveal = {(r['date'], r['heading']) for r in rows if resolves(r) and r['pre_ji'] == 'false'}
    candidates = collections.defaultdict(set)
    for date, day in by_date.items():
        for line_id, sources, targets, require_all in edges:
            present = [s for s in sources if s in day]
            new_trigger = [s for s in present if resolves(day[s])]
            fired = [s for s in present if day[s]['pre_state'] == 'neither_recorded']
            for t in targets:
                if t not in day:
                    continue
                target = day[t]
                if new_trigger and (target['pre_ji'] == 'true' or (date, t) in reveal):
                    candidates[(date, t)].add(f'{line_id}:new-trigger:{"+".join(new_trigger)}')
                if fired and (resolves(target) or target['propagated_from']):
                    candidates[(date, t)].add(f'{line_id}:fired-target-resolves:{"+".join(fired)}')

    # 刼煞 止忌 reveal: day branch = 收日 (Month Jian + 9) in 寅/申 months; 求醫療病 is in the 止忌
    # list, protected (only_avoid). With 宜 now known false, the proved 忌 is recorded.
    stop = []
    for row in rows:
        m, b = row['month_jian'], row['pillar'][1]
        if m in '寅申' and BRANCHES[(BRANCHES.index(m) + 9) % 12] == b and row['heading'] == '求醫療病':
            ev, recorded = evidence[(row['date'], row['heading'])]
            stop.append({'date': row['date'], 'monthJian': m, 'pillar': row['pillar'],
                         'heading': row['heading'], 'baseline': {k: row[k] for k in ('pre_yi', 'pre_ji', 'pre_protected_ji', 'pre_state')},
                         'expectedEvidenceYi': ev,
                         'expected': ({'ji': True, 'protectedJi': True, 'state': 'only_ji' if recorded is False else 'both_present'}
                                      # Correction 2: a resolving row records the proved 止忌 whether or not
                                      # the baseline already showed ji; known 宜 decides only_ji/both_present.
                                      if resolves(row) and recorded is not None
                                      else {'ji': row['pre_ji'] == 'true', 'protectedJi': row['pre_protected_ji'] == 'true', 'state': row['pre_state']}),
                         'reveal': (row['date'], row['heading']) in reveal,
                         'derivation': f'{m}+9 = {b} (收日 = 六合 = 刼煞); 卷十 offset {JIESHA_STOP[1]} 止忌 includes 求醫療病; eligible 宜 '
                                       f'{"+".join(e["han"] for e in eligible["求醫療病"])} from frozen domains -> {ev}'})

    # puzhu:28 adopted day override (owner print correction 六月甲子 -> 甲午) and 百忌 raw 忌.
    day_rule = data['remainingJi']['dayRules'][0]
    applied = [tuple(x) for x in day_rule['applied']]
    frozen_applies = sorted((x['input']['monthJian'], x['input']['validPillar'])
                            for x in data['composition']['sections']['dayOverride'] if x['expected']['applies'])
    if sorted(applied) != frozen_applies or ('未', '甲午') not in applied or ('未', '甲子') in applied:
        raise SystemExit('override contexts disagree with frozen 3.4 mask')
    baiji = data['dayComposition']['baiji']
    if vol10[baiji['source']['offset']:baiji['source']['offset'] + len(baiji['source']['text'])] != baiji['source']['text']:
        raise SystemExit('百忌 source slice mismatch')
    catalog = set(next(iter(by_date.values())))
    all_baiji = lambda pillar: sorted({norm(r['heading']) for r in baiji['rules'] if r['heading'] and r['day'] in pillar})
    # Correction 1: only the 29 evaluated headings carry a day record; 經絡/醞釀/苫蓋 are listed apart.
    raw_baiji = lambda pillar: [h for h in all_baiji(pillar) if h in catalog]
    context = lambda m, p, applies: {'monthJian': m, 'pillar': p, 'applies': applies, 'rawProtectedBaiji': raw_baiji(p),
                                     'rawProtectedBaijiOutsideCatalog': [h for h in all_baiji(p) if h not in catalog]}
    override_contexts = [context(m, p, True) for m, p in applied]
    override_contexts.append({**context('未', '甲子', False),
                              'note': 'Printed 六月甲子 is not adopted; its 百忌 甲日 忌 stays effective and protected'})
    dated_override = []
    for date, day in sorted(by_date.items()):
        any_row = next(iter(day.values()))
        ctx = (any_row['month_jian'], any_row['pillar'])
        if ctx in applied or ctx == ('未', '甲子'):
            for h, row in day.items():
                ev, recorded = evidence[(date, h)]
                if ctx in applied:
                    state = 'undetermined' if recorded is None else 'only_yi' if recorded else 'not_recorded'
                    exp = {'ji': False, 'protectedJi': False, 'state': state, 'propagatedFrom': None, 'propagationBlocked': None}
                else:
                    exp = {'ji': row['pre_ji'] == 'true', 'protectedJi': row['pre_protected_ji'] == 'true'}
                dated_override.append({'date': date, 'monthJian': ctx[0], 'pillar': ctx[1], 'heading': h,
                                       'applies': ctx in applied, 'expectedEvidenceYi': ev, 'expectedRecordedYi': recorded,
                                       'rawProtectedBaiji': h in raw_baiji(ctx[1]), 'expected': exp})

    expected = {
        'version': 'p4-yi-propagation-independent-expected-v1',
        'task': '5.4',
        'scope': 'AUDIT_ONLY',
        'date': '2026-10-15',
        'inputs': {k: {'path': v, 'sha256': sha256(v)} for k, v in INPUTS.items()},
        'unknownEncoding': 'JSON null = unknown 宜; false = known absent',
        'counts': {'rows': len(rows), 'dates': len(by_date), 'resolvingRows': sum(resolves(r) for r in rows),
                   'revealCandidates': len(reveal), 'propagationCandidateTargets': len(candidates),
                   'stopJiRows': len(stop), 'stopJiReveal': sum(x['reveal'] for x in stop),
                   'overrideDatedRows': len(dated_override), 'jieDayConventionDates': len(jie_days)},
        'jieDayConvention': {'classification': 'CONVENTION_DIFFERENCE', 'dates': jie_days,
                             'note': '母倉 on these civil Jie days follows the baseline Month Jian via the frozen 1,440 conditional table; '
                                     'dated provenance/instant handling belongs to 5.6.'},
        'sections': {
            'propagationBound': {
                'rule': 'Outside candidate targets, propagated_from/propagation_blocked equal the frozen baseline; '
                        'candidates need a resolving source (new-trigger) or a fired source with resolving target; '
                        'pre-propagation ji/protectedJi may change only on revealCandidates.',
                'candidateTargets': [{'date': d, 'heading': h, 'reasons': sorted(r)} for (d, h), r in sorted(candidates.items())],
                'revealCandidates': [f'{d}:{h}' for d, h in sorted(reveal)],
            },
            'stopJiReveal': stop,
            'override': {'source': day_rule['source'], 'printCorrection': day_rule['printCorrection'],
                         'contexts': override_contexts, 'dated': dated_override},
        },
        'review': {'reviewer': 'Claude (single agent)', 'independentSecondReview': False},
        'limits': [
            'Baseline columns are P4-B adopted facts from the historical evaluator at db382ba, not code under test; '
            'they are inputs, not P4-C expected outcomes.',
            'propagationBound is an upper bound; candidate outcomes are observed and explained, not predicted, '
            'and stay on the 6.8 review list.',
            'stopJiReveal covers only the 刼煞 收日 寅申月 止忌 clause on dated rows; other 止忌 reveals are bounded by revealCandidates.',
            'Override dated state assumes recorded 宜 is unchanged where the baseline already recorded it.',
            'Golden composed after 5.3 code existed; derived only from frozen inputs above, never from resolver output.',
        ],
    }
    body = json.dumps(expected, ensure_ascii=False, indent=1) + '\n'
    table = '\n'.join('\t'.join(r) for r in tsv) + '\n'
    if args.write:
        for name, text in (('expected.json', body), ('evidence.tsv', table)):
            with (OUT / name).open('x', encoding='utf-8') as handle:
                handle.write(text)
    else:
        for name, text in (('expected.json', body), ('evidence.tsv', table)):
            if (OUT / name).read_text(encoding='utf-8') != text:
                raise SystemExit(f'replay mismatch: {name}')
    print(json.dumps(expected['counts'], ensure_ascii=False))


if __name__ == '__main__':
    main()
