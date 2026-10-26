"""P21 Stage 3: authority freeze and migration eligibility (audit only).

Run from the repo root, after the matrix dump:
  P21S3_DUMP=1 npx vitest run shared/lunar/p4P21Stage3Affected.test.ts
  python3 -I docs/audits/sources/p4-vol10/p21-stage3/build_stage3.py
Writes authority.json, eligibility.json, impact.json, golden-manifest.json, migration-spec.json, lock.json.
Nothing here is imported by production.
"""
import hashlib
import json
import os

HERE = os.path.relpath(os.path.dirname(os.path.abspath(__file__)))
P = 'docs/audits/sources/p4-vol10/'
S1, S2 = P + 'p21-stage1/', P + 'p21-stage2/'
FULL, SCORE = P + 'p4-full-golden-v4/compose/', P + 'p4-score-golden-v6/'
OWNER_NACAI = P + 'option-c-final-gate-v1/owner-ruling.json'
OWNER_D1A = P + 'g2-n117-stage3/owner-ruling.json'
FAITHFUL = 'shared/almanac-data/xieji-vol10-jiesha-authority-v4.json'

# Per-context provenance of the trigger. Highest evidence level first.
CONTEXT = {
    '亥-丁酉': {
        'eligibility': 'MIGRATE',
        'triggerAuthority': 'SOURCE_AUTHORITY (witness-specific)',
        'evidenceLevel': 'A',
        'evidence': ['P21S2-06067696-n106 (this context: 開市 and 納財 unnoted, 立券交易 printed 忌)',
                     'P21S2-06067696-n82 (亥-癸酉, same clause)', '卷十一 開市 宜 開日 / 納財 宜 母倉'],
        'reason': 'the witness page is this exact context: trigger realised by 相抵 (開市 has 宜 開日, 納財 has 宜 '
                  '母倉) and the target output is observed. The output does not depend on the open X相抵 item: '
                  'with a 宜 on the trigger it is unnoted under either 災煞 reading, and the target ends only_ji '
                  '(五離) whether 災煞 on 立券交易 is cancelled locally (P4) or by puzhu:21 (source). Dated '
                  'operands match the generic page: soil absent, 母倉 present, no protected 忌 on the target',
        'blocking': None,
        'note': 'witness-specific authority; X相抵 (災煞) is NOT closed as a general item',
    },
    '亥-癸酉': {
        'eligibility': 'MIGRATE', 'triggerAuthority': 'SOURCE_AUTHORITY (witness-specific)', 'evidenceLevel': 'A',
        'evidence': ['P21S2-06067696-n82 (this context)'],
        'reason': 'as 亥-丁酉; context-level only, no date in 2025–2027', 'blocking': None,
        'note': 'eligible, 0 production rows in the P4 domain',
    },
    '未-戊申': {
        'eligibility': 'HOLD',
        'triggerAuthority': 'OWNER_CONVENTION (LOCAL ruling) + IMPLEMENTATION_CONVENTION (開市 via cancel_both)',
        'evidenceLevel': 'D',
        'evidence': ['option-c-final-gate-v1 OWNER_RULING_SOURCE_OVERRIDES_INTERNALLY_INCONSISTENT_WITNESS '
                     '(2026-10-22, LOCAL 未-戊申 納財)', 'g2-n117-stage3 D1(a) (2026-10-26, LOCAL; notExtendedTo '
                     '"other 五離 cases")', 'n117: NOT_DISCRIMINATING (納財 printed)'],
        'reason': '納財 is unnoted only by a LOCAL owner ruling against its own page; 開市 has no 宜 (unnoted only '
                  'under P4 cancel_both); 四相 is a puzhu:06 trigger on the day (W6). D1(a) explicitly does not '
                  'extend to 五離, which is exactly what H2 would keep',
        'blocking': 'owner ruling extending the LOCAL 納財 ruling to its H2 consequence on 五離, or a second '
                    'edition of n117 (內府刊本, not acquired)',
        'note': 'if adopted, the basis must read OWNER_CONVENTION, not SOURCE_AUTHORITY',
    },
    '未-丙申': {
        'eligibility': 'QUARANTINE', 'triggerAuthority': 'IMPLEMENTATION_CONVENTION (P4 cancel_both)',
        'evidenceLevel': 'C',
        'evidence': ['n105 (未-丙申) prints 開市, 立券交易 and 納財: trigger not realised at source',
                     'faithful 卷十 authority v4 未丙申 finance/opening/contract = avoid',
                     'H1-B 月表 review contradiction 1 (劫煞 相抵 effect, 辰/戌/未)'],
        'reason': 'Level A contradicts the trigger itself. At source puzhu:21 never fires here; the page prints '
                  '立券交易 because 劫煞 and 五離 both survive. Routing that output through P21 H2 would encode '
                  'the unsupported cancel_both trigger',
        'blocking': 'P4-劫 (P4 layer still runs cancel_both for 劫煞 辰戌丑未 without 德)',
        'note': "the source output (立券交易 忌) coincides with the H2 projection, by a different path; fix belongs "
                'to P4-劫, not P21',
    },
}
for c in ('未-壬申', '未-庚申'):
    CONTEXT[c] = {**CONTEXT['未-丙申'], 'evidence': [f'{"n81" if c == "未-壬申" else "n129"} prints the triad',
                                                     'faithful v4 avoid'],
                  'note': 'quarantined, 0 production rows in the P4 domain'}


def sha(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def tsv(path):
    with open(path, encoding='utf-8') as f:
        head, *rows = [line.rstrip('\n').split('\t') for line in f]
    return [dict(zip(head, r)) for r in rows]


def dump(name, obj):
    with open(os.path.join(HERE, name), 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
        f.write('\n')


def main():
    s2c = json.load(open(S2 + 'conclusion.json', encoding='utf-8'))
    assert s2c['conclusion'] == 'H2_SUPPORTED' and s2c['gate']['cleanH1'] == []
    cells = json.load(open(os.path.join(HERE, 'affected-cells.json'), encoding='utf-8'))['cells']
    s1 = json.load(open(S1 + 'projection.json', encoding='utf-8'))
    s1dates = sorted(c['date'] for c in s1['dated2025_2027']['cells'] if c['line'] == 'puzhu:21')
    assert sorted(c['date'] for c in cells) == s1dates, 'affected set differs from Stage 1/2'
    s2i = json.load(open(S2 + 'impact.json', encoding='utf-8'))
    faithful = json.load(open(FAITHFUL, encoding='utf-8'))['cells']
    nacai, d1a = (json.load(open(p, encoding='utf-8')) for p in (OWNER_NACAI, OWNER_D1A))
    assert nacai['scope'].startswith('LOCAL') and 'other 五離 cases' in d1a['notExtendedTo']

    rows = []
    for c in cells:
        k = CONTEXT[c['context']]
        acts = [a for a in s2i['activity'] if a['date'] == c['date']]
        evs = [e for e in s2i['event'] if e['date'] == c['date']]
        m, p = c['context'].split('-')
        rows.append({
            'date': c['date'], 'context': c['context'], 'triggers': c['triggers'],
            'triggerSourceFaithful': {x: faithful.get(m + p, {}).get(x) for x in ('opening', 'finance')}
            if m + p in faithful else None,
            'target': c['target'], 'independentJi': c['independent'], 'targetProt': c['targetProt'],
            'puzhu06': c['puzhu06'], 'current': c['current'], 'h2': c['h2'],
            'activityDelta': [{'activity': a['activityId'], 'from': a['nA'], 'to': a['nC'],
                               'scoreDelta': a['nC']['score'] - a['nA']['score']} for a in acts],
            'eventRecords': len(evs),
            'eventClassificationChanges': sum(1 for e in evs if e['nA']['classification'] != e['nC']['classification']),
            **{x: k[x] for x in ('eligibility', 'triggerAuthority', 'evidenceLevel', 'reason', 'blocking')},
        })
    contexts = {c: {x: v for x, v in k.items()} for c, k in CONTEXT.items()}
    for c in contexts:
        contexts[c]['productionRows'] = sum(1 for r in rows if r['context'] == c)
    dump('eligibility.json', {'version': 'p21-stage3-eligibility-v1', 'statuses': ['MIGRATE', 'HOLD',
                              'QUARANTINE', 'NO_CHANGE'], 'contexts': contexts, 'rows': rows})

    def impact(sel):
        dates = sorted({r['date'] for r in sel})
        acts = [a for a in s2i['activity'] if a['date'] in dates]
        evs = [e for e in s2i['event'] if e['date'] in dates]
        return {'dates': dates, 'activityRows': len(acts),
                'scoreDelta': sorted({a['nC']['score'] - a['nA']['score'] for a in acts}),
                'statusChanges': sorted({f"{a['nA']['status']}->{a['nC']['status']}" for a in acts}),
                'hardWarningChanges': sum(1 for a in acts if a['nA']['hardWarning'] != a['nC']['hardWarning']),
                'eventRecords': len(evs),
                'eventClassificationChanges': sum(1 for e in evs
                                                  if e['nA']['classification'] != e['nC']['classification'])}
    migrate = [r for r in rows if r['eligibility'] == 'MIGRATE']
    dump('impact.json', {'version': 'p21-stage3-impact-v1', 'source': S2 + 'impact.json',
                         'ALL_H2_PROJECTED': impact(rows), 'MIGRATION_ELIGIBLE_ONLY': impact(migrate)})

    mdates = {r['date'] for r in migrate}
    mctx = sorted(c for c, k in CONTEXT.items() if k['eligibility'] == 'MIGRATE')
    act = {'contract', 'transaction'}
    count = lambda rs, pred: sum(1 for r in rs if pred(r))  # noqa: E731
    manifest = [
        {'golden': 'p4-full-golden-v4', 'successor': 'p4-full-golden-v5', 'file': 'compose/dated.tsv',
         'reason': '立券交易 final state neither_recorded -> only_ji (五離)',
         'expectedRecords': count(tsv(FULL + 'dated.tsv'), lambda r: r['date'] in mdates and r['heading'] == '立券交易')},
        {'golden': 'p4-full-golden-v4', 'successor': 'p4-full-golden-v5', 'file': 'compose/context.tsv',
         'reason': 'same, context level', 'expectedRecords': count(tsv(FULL + 'context.tsv'),
                                                                   lambda r: r['id'] in mctx and r['heading'] == '立券交易')},
        {'golden': 'p4-full-golden-v4', 'successor': 'p4-full-golden-v5', 'file': 'compose/h1b-changes.tsv',
         'reason': 'final_state of the H1-B rows', 'expectedRecords': count(
             tsv(FULL + 'h1b-changes.tsv'), lambda r: r['id'] in mdates | set(mctx) and r['heading'] == '立券交易')},
        {'golden': 'p4-score-golden-v6', 'successor': 'p4-score-golden-v7', 'file': 'activity-states.tsv',
         'reason': 'contract/transaction state', 'expectedRecords': count(
             tsv(SCORE + 'activity-states.tsv'), lambda r: r['date'] in mdates and r['activity'] in act)},
        {'golden': 'p4-score-golden-v6', 'successor': 'p4-score-golden-v7', 'file': 'activity-scores.tsv',
         'reason': 'contract/transaction 50 neutral -> 20 avoid', 'expectedRecords': count(
             tsv(SCORE + 'activity-scores.tsv'), lambda r: r['date'] in mdates and r['activity'] in act)},
    ]
    unchanged = {
        'p4b-puzhu06-golden-v5': 'no puzhu:06 trigger on 亥-丁酉/癸酉; row untouched',
        'p5-warehouse-golden-v1': '開倉庫/修倉庫 unchanged (no warehouse delta in the impact)',
        'p4-adapter-baseline-v1/v2': 'P4 OFF baseline (xiejiVol10BalancingEnabled OFF)',
        'events': 'no event Golden; event deltas go to the Stage 4 migration diff',
    }
    dump('golden-manifest.json', {'version': 'p21-stage3-golden-manifest-v1', 'scope': 'MIGRATE rows only',
                                  'changes': manifest, 'unchanged': unchanged,
                                  'excludedRows': sorted(r['date'] for r in rows if r['eligibility'] != 'MIGRATE')})

    authority = {
        'id': 'p4-puzhu21-semantic-v1', 'rule': 'puzhu:21',
        'source': {'path': P + 'vol10.raw.txt', 'offset': 22390},
        'semantic': 'contribution-scoped-suppression',
        'meaning': "the trigger's 相抵 gods' 忌 is withheld on the target; independent target 忌 survive",
        'label': 'N-C (audit/implementation label, not a source term)',
        'status': 'SUPPORTED_SEMANTIC_AUTHORITY', 'productionStatus': 'NOT_MIGRATED',
        'activeProductionAuthority': 'p4b-puzhu06-v5 (puzhu:21 runs N-A in p4OwnerRules.ts)',
        'evidence': s2c['gate']['cleanH2'], 'evidenceLevel': 'A', 'stage2': 'cbe4cac',
        'scope': 'puzhu:21 only; not puzhu:22 or other propagation lines',
        'eligibleContexts': mctx,
        'debts': {
            'PUZHU22_SEMANTIC_DEBT': 'n82/n106 開倉庫出貨財 absence fits only a contribution-level puzhu:22 '
                                     'trigger; the 2026-10-17 owner precedent (H1-B, puzhu:22 withholds 月虛) '
                                     'stands; no reinterpretation, no change',
            'X相抵': '災煞 相抵 effect witnessed on n30/n82/n106 only; not closed as a general item',
            'P4-劫': 'blocks 未-丙申/壬申/庚申',
        },
    }
    dump('authority.json', authority)

    spec = {
        'version': 'p21-stage4-spec-v1', 'status': 'SPECIFICATION ONLY (not implemented)',
        'successorAuthority': {'id': 'p4-puzhu21-v1', 'path': 'shared/almanac-data/p4-puzhu21-v1.json',
                               'content': {'line': 'puzhu:21', 'semantic': 'contribution-scoped',
                                           'eligibleContexts': mctx}},
        'eligibleRows': sorted(mdates), 'eligibleContexts': mctx,
        'mustStayIdentical': sorted(r['date'] for r in rows if r['eligibility'] != 'MIGRATE'),
        'expectedProductionFiles': ['shared/almanac-data/p4-puzhu21-v1.json (new)',
                                    'shared/lunar/p4OwnerRules.ts (propagation pass, puzhu:21 edges only)',
                                    'shared/almanac-data/manifest.json (policy p4Puzhu21Scope: contribution-v1; '
                                    'heading-v1 = rollback)'],
        'algorithm': [
            'in the propagation pass, for a puzhu:21 edge whose target context is in eligibleContexts:',
            'cancelled = the 卷十 subject scopes whose state on each fired trigger is neither_recorded',
            'remaining = target trace.ji minus cancelled; protected 忌 keep blocking as today',
            'remaining empty -> current behaviour (lift); else keep ji, state only_ji (both_present if 宜 noted)',
            'every other edge, line and context: unchanged (N-A)',
        ],
        'options': {
            'A_rule_filter_with_allowlist': 'contribution filter on puzhu:21 edges, gated by the authority '
                                            'allowlist (recommended: smallest change that encodes the semantic, '
                                            'auditable allowlist, one rollback policy)',
            'B_context_overlay': 'authority lists (context, heading) -> only_ji: smallest diff but encodes the '
                                 'output, not the semantic; drifts if other rules move',
            'C_global_filter_with_blocklist': 'filter on every puzhu:21 edge, block HOLD/QUARANTINE contexts: '
                                              'fails open for new contexts; rejected',
        },
        'provenance': 'trace keeps 五離 in ji; add propagatedFrom and a cancelled list for puzhu:21 rows',
        'goldens': 'golden-manifest.json (successors only for MIGRATE rows)',
        'migrationDiff': 'every changed row must be a MIGRATE date; activity and event deltas must equal '
                         'impact.json MIGRATION_ELIGIBLE_ONLY; any HOLD/QUARANTINE date diff fails',
        'rollback': 'policy p4Puzhu21Scope heading-v1 restores N-A byte-equal; historical tests pin heading-v1',
        'testsToRepoint': ['p4P21Stage1Projection.test.ts (pins N-A on 亥-丁酉/癸酉)',
                           'p4P21Stage2Candidates.test.ts', 'p4P21Stage2Impact.test.ts',
                           'p4P21Stage3Affected.test.ts'],
        'gates': ['npm run check', 'npm test', 'npm run ci:p4:full', 'check:audit-clean',
                  'mutation: removing an eligible context or adding 未-戊申/丙申 to the allowlist must fail'],
    }
    dump('migration-spec.json', spec)

    files = [os.path.join(HERE, x) for x in ('affected-cells.json', 'eligibility.json', 'impact.json',
                                             'golden-manifest.json', 'migration-spec.json', 'authority.json',
                                             'build_stage3.py')]
    files += ['shared/lunar/p4P21Stage3Affected.test.ts', S2 + 'lock.json', S2 + 'conclusion.json',
              S2 + 'impact.json', S1 + 'lock.json', OWNER_NACAI, OWNER_D1A, FAITHFUL]
    dump('lock.json', {'version': 'p21-stage3-v1', 'files': {p: sha(p) for p in files}})


if __name__ == '__main__':
    main()
