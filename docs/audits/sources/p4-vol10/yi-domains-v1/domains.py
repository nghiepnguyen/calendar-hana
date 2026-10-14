#!/usr/bin/env python3
"""Full source-derived domains for task 3.3; locked audit reference only.

No production imports. --write exclusively creates artifacts, never replaces
expected. Lower-level 母倉 soil tuples are conditional truth-table inputs, never
validated dated provider evidence. Real dated fixtures are stored separately.
"""
import argparse
import collections
import datetime as dt
import hashlib
import itertools
import json
import runpy
from pathlib import Path

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[4]
FIELDS = ['id', 'domain', 'han', 'authorityId', 'ruleId', 'authorityStatus',
          'inputs', 'providerStates', 'inputProvenance', 'expected', 'derivation']


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def reference():
    pins = json.loads((OUT / 'inputs.json').read_text())['files']
    for pin in pins:
        assert sha(ROOT / pin['path']) == pin['sha256'], pin['path']
    # This fixed, hash-bound file is the separate source-arithmetic reference
    # from 3.2, not any production or future presence implementation.
    ref = runpy.run_path(str(ROOT / 'docs/audits/sources/p4-vol10/yi-expected-v1/derive.py'))
    ref['verify_inputs']()
    return ref


def build():
    ref = reference()
    basis = ref['BASIS']
    months = ref['MONTHS']
    pillars = ref['PILLARS']
    records = []
    evidence_counts = collections.defaultdict(collections.Counter)
    entry_by_han = {e['han']: e for e in basis['entries']}

    def add(han, domain, suffix, inputs, provenance, expected, calculation):
        e = entry_by_han[han]
        records.append({'id': e['id'] + ':' + domain + ':' + suffix,
                        'domain': domain, 'han': han, 'authorityId': e['authorityId'],
                        'ruleId': e['ruleId'],
                        'authorityStatus': 'OWNER_ADOPTED_SOURCE_DEPENDENT' if han == '母倉' else 'SOURCE_REVIEWED',
                        'inputs': inputs, 'providerStates': {}, 'inputProvenance': provenance,
                        'expected': expected,
                        'derivation': {'sourceBasisHan': han, 'sourceRefs': e['sourceRefs'],
                                       'rawAnchor': e['rawAnchor'], 'calculation': calculation}})
        evidence_counts[han + ':' + domain][expected['outcome']] += 1

    monthly = [e for e in basis['entries'] if len(e['requiredInputs']) == 2]
    day_only = [e for e in basis['entries'] if len(e['requiredInputs']) == 1]
    assert len(monthly) == 7 and len(day_only) == 3
    for e in monthly:
        for month, pillar in itertools.product(months, pillars):
            values, context = ref['structural_inputs'](e['han'], month, pillar)
            outcome, calculation = ref['source_expected'](e['han'], values, {})
            add(e['han'], 'MONTH_PILLAR_720', month + '-' + pillar, values, context, outcome, calculation)
    for e in day_only:
        for pillar in pillars:
            values, context = ref['structural_inputs'](e['han'], '寅', pillar)
            assert 'MONTH_JIAN_BRANCH' not in values
            outcome, calculation = ref['source_expected'](e['han'], values, {})
            add(e['han'], 'DAY_PILLAR_60', pillar, values, context, outcome, calculation)

    # A distinct conditional predicate domain, NOT fabricated soil provenance.
    # Use manual source literals; do not call the dated-soil contract with
    # synthetic date, validated=true, or borrowed P4-B authority evidence.
    rule = entry_by_han['母倉']['manualDerivationRule']
    for month, pillar, soil_state in itertools.product(months, pillars, ['absent', 'present']):
        season = months.index(month) // 3
        ordinary = rule['ordinarySets'].split('/')[season]
        target = rule['soilSet'] if soil_state == 'present' else ordinary
        outcome = 'present' if pillar[1] in target else 'absent'
        inputs = {'MONTH_JIAN_BRANCH': month, 'DAY_BRANCH': pillar[1], 'abstractSoilState': soil_state}
        context = {'kind': 'PREDICATE_ONLY', 'validPillar': pillar,
                   'providerValidated': False,
                   'note': 'Conditional truth table only; no date or soil evidence supplied; cannot call full provider'}
        calculation = f'Source seasonal set {ordinary}; assumed soil {soil_state} -> {target}; {pillar[1]} membership = {outcome}; date/coverage unasserted'
        add('母倉', 'MU_CANG_CONDITIONAL_1440', month + '-' + pillar + '-' + soil_state,
            inputs, context, {'outcome': outcome}, calculation)

    # Exhaust actual adopted civil dates, separately from the conditional table.
    first, last = dt.date(2025, 1, 1), dt.date(2027, 12, 31)
    for offset in range((last - first).days + 1):
        day = first + dt.timedelta(days=offset)
        when = dt.datetime.combine(day, dt.time(12), ref['TZ'])
        values, context = ref['dated_inputs']('母倉', when)
        outcome, calculation = ref['source_expected']('母倉', values, {})
        add('母倉', 'MU_CANG_DATED_1095', day.isoformat(), values, context, outcome, calculation)
    for jie in ref['JIE']:
        if not 2025 <= jie['year'] <= 2027:
            continue
        for delta in [-1, 0, 1]:
            when = ref['EPOCH'] + dt.timedelta(milliseconds=jie['epochMs'] + delta)
            values, context = ref['dated_inputs']('母倉', when)
            context['testedJieBoundary'] = {'rowIndex': jie['rowIndex'], 'deltaMs': delta}
            outcome, calculation = ref['source_expected']('母倉', values, {})
            add('母倉', 'MU_CANG_EXACT_JIE_108', f'{jie["year"]}-{jie["termIndex"]}-{delta}', values, context, outcome, calculation)

    prior = json.loads((ROOT / 'docs/audits/sources/p4-vol10/yi-expected-v1/expected.json').read_text())
    # Task 3.2 edge, missing, coverage and malformed cases remain locked refs,
    # not copied/relabelled as new domain coverage.
    prior_refs = [f['id'] for f in prior['presenceFixtures'] if f['han'] == '母倉' and any(c in f['categories'] for c in ['boundary', 'missingInput', 'outsideCoverage'])]
    summary = {'version': 'p4-yi-full-domains-v1', 'task': '3.3', 'date': '2026-10-14',
               'status': 'DOMAIN_EXPECTED_COMPLETE_PENDING_3_4_TO_3_6',
               'scope': 'AUDIT_ONLY', 'frozen': False, 'recordCount': len(records),
               'domains': [{'han': key.split(':')[0], 'domain': key.split(':')[1],
                            'count': sum(counts.values()), 'expectedCounts': dict(counts)}
                           for key, counts in evidence_counts.items()],
               'muCangPriorFixtureRefs': prior_refs,
               'domainContract': {'monthly': '7 × (12 exact-Jie Month Jian × 60 valid pillars); inherited provider coverage assumed inside for structural tuple',
                                 'dayOnly': '3 × 60 valid pillars; Month Jian is not required',
                                 'muCangConditional': '12 × 60 × 2 soil assumptions, predicate-only; not claimed calendar/provider reachability',
                                 'muCangDated': 'All 1095 adopted civil dates at noon UTC+7 plus 36 Jie × before/equal/after 1 ms; locked prior soil edges/missing/coverage cases referenced separately'},
               'sourceBasisPath': 'docs/audits/sources/p4-vol10/yi-expected-v1/source-basis.json',
               'inputPinsPath': str((OUT / 'inputs.json').relative_to(ROOT)),
               'review': {'reviewer': 'Codex (single agent)', 'independentSecondReview': False,
                          'method': 'Independent source-reference arithmetic/domain enumeration and exact-set validation; not review 3.5'},
               'limits': ['Coverage is not inferred from a count alone: validator asserts exact Cartesian sets and dated provenance',
                          'Dated noon is a day-level fixture, not every intraday instant; exact crossing variants handle Month Jian change. Soil uses civil dates',
                          'Conditional 母倉 tuples cannot certify provider date/provenance or widen 2025–2027 adopted coverage',
                          '3.4 composition, 3.5 review, 3.6 commit freeze and parent 3.0/P4-C remain open',
                          'Canonical S1/P5 deferred unchanged; runtime/scoring untouched']}
    return records, summary


def tsv(records):
    lines = ['\t'.join(FIELDS)]
    for row in records:
        values = [json.dumps(row[k], ensure_ascii=False, separators=(',', ':')) if isinstance(row[k], dict) else row[k] for k in FIELDS]
        assert all('\t' not in value and '\n' not in value for value in values)
        lines.append('\t'.join(values))
    return '\n'.join(lines) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    records, summary = build()
    assert len({r['id'] for r in records}) == len(records)
    expected_text = tsv(records)
    if args.write:
        # Refuse any partial overwrite before opening either artifact.
        assert not any((OUT / name).exists() for name in ['expected.tsv', 'summary.json'])
        with (OUT / 'expected.tsv').open('x') as handle:
            handle.write(expected_text)
        with (OUT / 'summary.json').open('x') as handle:
            handle.write(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
    else:
        assert (OUT / 'expected.tsv').read_text() == expected_text, 'Domain expected differs; do not overwrite'
        assert json.loads((OUT / 'summary.json').read_text()) == summary
    print(f'PASS source-domain replay: {len(records)} unique records; 7×720 + 3×60 + 母倉 1440 conditional / 1095 dated / 108 Jie')


if __name__ == '__main__':
    main()
