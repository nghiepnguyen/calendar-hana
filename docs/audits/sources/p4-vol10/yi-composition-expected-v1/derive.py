#!/usr/bin/env python3
"""Independent composition contract expected for 3.4; never calls a composer.

Isolated operand/scope vectors are synthetic unit contracts, not fictional real
day co-presence. Exact Month Jian/pillar contexts test the adopted override mask
separately. Existing expected and authority bytes remain immutable.
"""
import argparse
import copy
import hashlib
import itertools
import json
import runpy
from pathlib import Path

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[4]
BASIS = json.loads((OUT / 'source-basis.json').read_text())
ENTRIES = {e['han']: e for e in BASIS['entries']}
STATES = ['present', 'absent', 'unknown']


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def norm(heading):
    return BASIS['normalization']['headingMap'].get(heading, heading)


def operand(han, state, ordinal=0):
    canonical = BASIS['normalization']['godAlias'].get(han, han)
    entry = ENTRIES[canonical]
    return {'traceId': f'{canonical}:{ordinal}', 'requestName': han, 'han': canonical,
            'presence': state, 'authorityId': entry['authorityId'], 'ruleId': entry['ruleId'],
            'authorityStatus': entry['status'], 'sourceRefs': sorted({i for h in entry['headingScopes'] for i in h['sourceRefs']}),
            'inputEvidence': {'kind': 'SYNTHETIC_RESOLVED_OPERAND', 'reason': 'missing required input' if state == 'unknown' else 'declared unit state'}}


def any_expected(operands):
    states = [o['presence'] for o in operands]
    result = True if 'present' in states else (None if 'unknown' in states else False)
    return {'yi': result, 'trace': copy.deepcopy(operands),
            'unresolvedTraceIds': [o['traceId'] for o in operands if o['presence'] == 'unknown']}


def build():
    sections = {key: [] for key in ['any', 'headingScope', 'normalization', 'protection', 'dayOverride', 'warehouse', 'sourceContextControls']}
    for size in range(4):
        for vector in itertools.product(STATES, repeat=size):
            operands = [operand(han, state, i) for i, (han, state) in enumerate(zip(['天后', '天醫', '除神'], vector))]
            sections['any'].append({'id': f'any:{size}:' + '-'.join(vector), 'input': {'kind': 'SYNTHETIC_LISTED_OPERANDS', 'heading': '求醫療病', 'operands': operands},
                                    'expected': any_expected(operands), 'derivation': 'PRD FR-08/task5.2: ANY present wins; otherwise unknown if unresolved remains; all absent/empty false; trace always retains unknown'})
    for entry in BASIS['entries']:
        for raw_heading in BASIS['rawCatalogHeadings']:
            heading = norm(raw_heading)
            direct = heading in entry['directHeadings']
            deferred = heading == '修倉庫'
            for state in STATES:
                op = operand(entry['han'], state)
                value = None if deferred else (state == 'present' if state != 'unknown' else None) if direct else False
                scopes = [h for h in entry['headingScopes'] if norm(h['normalized']) == heading]
                sections['headingScope'].append({'id': f'scope:{entry["id"]}:{heading}:{state}',
                    'input': {'kind': 'ISOLATED_SINGLE_GOD_HEADING_CONTRIBUTION', 'heading': heading, 'operand': op},
                    'expected': {'listedDirectYi': direct, 'eligibleYiOperands': [op['traceId']] if direct else [],
                                 'singleGodContribution': value, 'deferred': deferred,
                                 'sourceRefs': sorted({i for h in scopes for i in h['sourceRefs']}),
                                 'unlistedUnknownDoesNotPoisonHeading': not direct and not deferred},
                    'derivation': 'Locked 卷十一 direct heading scope; unlisted god contributes no 宜 even if present/unknown. 修倉庫 remains P5 unknown, not direct ANY.'})
    for raw, canonical in BASIS['normalization']['headingMap'].items():
        for state in STATES:
            op = operand('福德', state)
            sections['normalization'].append({'id': f'heading-norm:{raw}:{state}',
                'input': {'rawHeading': raw, 'canonicalHeading': canonical, 'operands': [op]},
                'expected': {'normalizedHeading': canonical, 'idempotentHeading': canonical,
                             'compositionCanonicalKey': canonical, 'tracePreserved': [op]},
                'derivation': 'Locked spelling normalization only; canonical routing does not infer listedness or add 宜'})
    for state in STATES:
        op = operand('福徳', state)
        sections['normalization'].append({'id': 'god-alias:福徳:' + state, 'input': {'heading': '宴㑹', 'operands': [op]},
            'expected': {'canonicalHan': '福德', 'heading': '宴會', **any_expected([op])},
            'derivation': 'Accepted 福徳→福德 + source 㑹→會; preserve same authority/rule/source/status and unknown trace'})

    # Local annotation/propagation projections: raw facts never disappear.
    # Suppression/cancellation affect recorded 宜, never provider presence.
    for yi_state, protection, cancel_both, suppress_yi, override in itertools.product(STATES, ['none', 'baiji', 'stopJi', 'youweiSpecial'], [False, True], [False, True], [False, True]):
        op = operand('天巫', yi_state)
        evidence = any_expected([op])
        protected = protection != 'none'
        ji = False if override else (protected or not cancel_both)
        yi = False if suppress_yi or cancel_both else evidence['yi']
        sections['protection'].append({'id': f'protect:{yi_state}:{protection}:{int(cancel_both)}:{int(suppress_yi)}:{int(override)}',
            'input': {'kind': 'ISOLATED_SCOPE_PROJECTION', 'heading': '祈福', 'operands': [op],
                      'rawJi': True, 'rawProtection': protection, 'cancelBoth': cancel_both, 'yiSuppression': suppress_yi,
                      'propagationLiftRequested': cancel_both, 'adoptedDayOverrideApplies': override},
            'expected': {'evidenceYi': evidence['yi'], 'recordedYi': yi, 'rawJi': True,
                         'rawProtection': protection, 'effectiveJi': ji,
                         'protectionBlocksOrdinaryLift': protected and cancel_both and not override,
                         'overrideRemovesEffectiveJi': override, 'trace': evidence['trace'],
                         'unresolvedTraceIds': evidence['unresolvedTraceIds']},
            'derivation': 'Raw/protected facts retained; 普通 相抵/propagation cannot lift 專忌/遇德猶忌; puzhu:28 諸事不忌 overrides effective 忌 only. This is projection, not a full real-day state.'})

    adopted = {tuple(x) for x in BASIS['dayOverride']['applied']}
    pillars = ['甲乙丙丁戊己庚辛壬癸'[i % 10] + '子丑寅卯辰巳午未申酉戌亥'[i % 12] for i in range(60)]
    for month, pillar in itertools.product('寅卯辰巳午未申酉戌亥子丑', pillars):
        applies = (month, pillar) in adopted
        sections['dayOverride'].append({'id': f'override:{month}:{pillar}',
            'input': {'kind': 'ADOPTED_OVERRIDE_CONTEXT_MASK_WITH_STUB_SCOPES', 'monthJian': month, 'validPillar': pillar,
                      'rawJiScopes': [{'id': 'protected-scope-stub', 'rawJi': True, 'protected': True}, {'id': 'ordinary-scope-stub', 'rawJi': True, 'protected': False}],
                      'yiEvidence': None, 'unresolvedYiTraceIds': ['missing-yi-stub']},
            'expected': {'ruleId': 'puzhu:28' if applies else None, 'applies': applies,
                         'rawJiScopesRetained': True, 'effectiveJi': not applies, 'yiEvidence': None,
                         'unresolvedYiTraceIds': ['missing-yi-stub']},
            'derivation': 'Exact 8 adopted monthly-pillar list from locked raw + owner 月表 correction: 未/甲午 applies; 未/甲子 does not. Scope stubs test removal of every effective 忌; do not claim actual gods on the date.'})
    for mu_state, co_state, override in itertools.product(STATES, STATES, [False, True]):
        # 四相 is actually in the source warehouse co-presence clause; it is
        # an explicit existing-operand stub, not a fabricated new authority ID.
        existing = {'traceId': 'existing:四相:1', 'requestName': '四相', 'han': '四相',
                    'presence': co_state, 'authorityId': None, 'ruleId': None,
                    'authorityStatus': 'EXISTING_OPERAND_STUB',
                    'sourceReference': {'entryHan': '母倉', 'sourceRefs': [2]},
                    'inputEvidence': {'kind': 'SYNTHETIC_EXISTING_LISTED_OPERAND',
                                      'note': 'No real-date or provider authority claim; adapter binds existing operand in 4.1'}}
        ops = [operand('母倉', mu_state, 0), existing]
        generic = any_expected(ops)
        sections['warehouse'].append({'id': f'warehouse:{mu_state}:{co_state}:{int(override)}',
            'input': {'kind': 'P5_DEFERRED_SENTINEL', 'heading': '修倉庫', 'candidateOperands': ops, 'genericAnyState': generic['yi'], 'rawJi': True, 'adoptedDayOverrideApplies': override},
            'expected': {'yi': None, 'status': 'P5_DEFERRED', 'rawJi': True, 'effectiveJi': not override,
                         'trace': generic['trace'], 'unresolvedTraceIds': generic['unresolvedTraceIds'],
                         'genericAnyMustNotResolveWarehouse': True},
            'derivation': 'PRD FR-11 and source 月恩/月德/co-presence conflict: maternal presence and any other evidence do not select a warehouse predicate; override affects 忌 only.'})

    # Genuine Month Jian/pillar presence controls from independent 3.2 arithmetic.
    # Raw protection/suppression source fact is isolated from all other day scopes.
    ref = runpy.run_path(str(ROOT / 'docs/audits/sources/p4-vol10/yi-expected-v1/derive.py'))
    ref['verify_inputs']()
    for han, month, pillar, heading, protection, suppress in [
        ('天醫', '亥', '癸未', '求醫療病', 'baiji', False),
        ('天恩', '子', '己酉', '宴會', 'baiji', False),
        ('天巫', '申', '甲戌', '祭祀', '天狗', False),
        ('除神', '寅', '丁酉', '整容剃頭', 'baiji', True),
    ]:
        values, context = ref['structural_inputs'](han, month, pillar)
        presence, calculation = ref['source_expected'](han, values, {})
        assert presence['outcome'] == 'present'
        sections['sourceContextControls'].append({'id': f'context:{han}:{month}:{pillar}:{heading}',
            'input': {'kind': 'REAL_STRUCTURAL_CONTEXT_ISOLATED_SOURCE_SCOPE', 'monthJian': month, 'validPillar': pillar, 'heading': heading, 'inputs': values},
            'expected': {'presence': 'present', 'rawJi': True, 'protectedSource': protection,
                         'effectiveJi': True, 'recordedYiFromThisOperand': not suppress},
            'derivation': calculation + '; isolated source scope only: 百忌/天狗 protected persists; 丁日 puzhu:10 suppresses combined 整容剃頭 宜. Other real-day scopes not evaluated.'})
    return {'version': 'p4-yi-composition-independent-expected-v1', 'task': '3.4', 'scope': 'AUDIT_ONLY',
            'date': '2026-10-14', 'status': 'COMPOSITION_EXPECTED_LOCKED_PENDING_3_5_3_6', 'commitFrozen': False,
            'sourceBasisSha256': sha(OUT / 'source-basis.json'), 'counts': {k: len(v) for k, v in sections.items()},
            'unknownEncoding': 'JSON null = unknown 宜; absent is false, never null',
            'sections': sections, 'review': {'reviewer': 'Codex (single agent)', 'independentSecondReview': False},
            'limits': ['Synthetic state/scope tests are isolated contracts; not physical simultaneous god presence or full day verdict',
                       'Heading contribution fixtures do not provide full heading yiEvidence lists from every known god',
                       '3.5 review and 3.6 commit freeze remain open; no production imports/evaluator implementation',
                       'Propagation actual changed rows and full integration Golden belong 5.4/6.8; no fake baseline count preservation',
                       'S1 canonical and P5 warehouse source conflict remain OPEN/deferred']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    for pin in BASIS['inputs']:
        assert sha(ROOT / pin['path']) == pin['sha256'], pin['path']
    for clause in BASIS['rawClauses']:
        path = ROOT / clause['path']
        assert hashlib.sha1(path.read_bytes()).hexdigest() == clause['sha1']
        assert path.read_text()[clause['offset']:clause['offset'] + clause['length']] == clause['quote']
    doc = build()
    ids = [f['id'] for section in doc['sections'].values() for f in section]
    assert len(ids) == len(set(ids))
    path = OUT / 'expected.json'
    if args.write:
        with path.open('x') as handle:
            handle.write(json.dumps(doc, ensure_ascii=False, indent=2) + '\n')
    else:
        assert json.loads(path.read_text()) == doc, 'Expected differs; never overwrite to fit evaluator'
    print('PASS independent composition replay:', doc['counts'])


if __name__ == '__main__':
    main()
