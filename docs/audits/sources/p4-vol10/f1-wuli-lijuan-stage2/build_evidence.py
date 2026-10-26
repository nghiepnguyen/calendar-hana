"""F1 Stage 2: authority reconciliation and impact for 五離 × 立券交易 (audit only).

Run from the repo root, after the impact dump:
  F1S2_DUMP=1 npx vitest run shared/lunar/p4F1WuliStage2Impact.test.ts
  python3 -I docs/audits/sources/p4-vol10/f1-wuli-lijuan-stage2/build_evidence.py
Writes evidence.json and lock.json. Stage 1 images are referenced by path and hash, never copied.
"""
import collections
import hashlib
import json
import os

HERE = os.path.relpath(os.path.dirname(os.path.abspath(__file__)))
P = 'docs/audits/sources/p4-vol10/'
S1 = P + 'f1-wuli-lijuan-stage1/'
VOL10 = P + 'vol10.raw.txt'
PUZHU06 = 'shared/almanac-data/p4b-puzhu06-v3.json'
IMPACT = os.path.join(HERE, 'impact.json')
HARNESS = 'shared/lunar/p4F1WuliStage2Impact.test.ts'

P06 = '凡徳合赦願月恩四相時徳等日不註忌進人口安牀經絡醖釀開市立劵交易納財開倉庫出貨財如遇徳猶忌及從忌不從宜之日則仍註忌'
WULI = '忌慶賜賞賀宴㑹結婚姻納采問名立劵交易與天德月德天德合月德合天赦三合六合併則不忌'
BAZHUAN = '忌安撫邊境選將訓兵出師結婚姻納采問名嫁娶與德合併猶忌與天願併止忌安撫邊境選將訓兵出師餘不忌'
WULI_OWN = ['天德', '月德', '天德合', '月德合', '天赦', '三合', '六合']

# Failing suites when liftExclusions.五離 is added to p4b-puzhu06-v3.json in place (scratch worktree run,
# base 372c6be): the migration must ship a new authority revision and Golden successors, not edit v3.
FALLOUT = {
    'p4Puzhu06AuthorityV3.test.ts': 'authority v3 lock / lineage (needs v4 successor)',
    'p4Puzhu06.test.ts': 'composer vs Golden v2 fixtures, 1,095 dates and 720 contexts',
    'p4Puzhu06GoldenV3.test.ts': 'Golden v3 lock (needs Golden v4 successor)',
    'p4Puzhu06Sweep.test.ts': 'before/after sweep',
    'p4ScoreAdapterAlmanac.test.ts': 'almanac wiring vs Golden v2 layer C',
    'p4ScoreGoldenV3.test.ts': 'P4 score Golden v3',
    'p4ScoreGoldenV4.test.ts': 'P4 score Golden v4 (current)',
    'p4MigrationDiff.test.ts': 'roadmap 9b migration diff lock',
    'p4MigrationDiffV3.test.ts': 'G1-b rollback proof against Golden v2/v3',
    'p4JieshaFaithfulVol10Lock.test.ts': 'faithful 卷十 劫煞 sweep artifact (P4 rows)',
    'p4WeishenNacaiAuditLock.test.ts': '納財 audit artifacts (P4 engine rows)',
}


def sha(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def main():
    raw = open(VOL10, encoding='utf-8').read()
    for t in (P06, WULI, BAZHUAN):
        assert t in raw, t[:12]
    p06 = json.load(open(PUZHU06, encoding='utf-8'))
    s1 = json.load(open(S1 + 'evidence.json', encoding='utf-8'))
    imp = json.load(open(IMPACT, encoding='utf-8'))
    triggers = p06['triggers']

    chain = [
        {'layer': 'literal text', 'class': 'SOURCE_FACT', 'where': f'{VOL10} offset {raw.find(P06)}', 'text': P06},
        {'layer': 'transcription', 'class': 'SOURCE_FACT',
         'where': 'Wikisource 四庫 transcription (vol10.raw.txt); scan check in p4b-puzhu06 authority v1 (718e195)'},
        {'layer': 'normalization', 'class': 'IMPLEMENTATION',
         'where': 'p4b-puzhu06 headings: 立劵交易 → P4 heading 立券交易; 徳 = 德'},
        {'layer': 'classification QL', 'class': 'SOURCE_INTERPRETATION',
         'where': 'tasks/prd-p4b-puzhu06.md §8: class QL = remaining-ji with its own 「與…併則不忌」 list not naming the trigger'},
        {'layer': 'owner ruling Q4 = yes', 'class': 'OWNER_RULING', 'date': '2026-10-16',
         'where': 'p4b-puzhu06-v1.json ownerDecision.Q4 (718e195); liftLists includes 五離',
         'entry': 'HERE: the proposition "四相/月恩 lifts 五離 on 立券交易" enters the project'},
        {'layer': 'authority data', 'class': 'IMPLEMENTATION', 'where': 'p4b-puzhu06-v3.json liftLists.五離, classes.QL'},
        {'layer': 'decision code', 'class': 'IMPLEMENTATION',
         'where': 'shared/lunar/p4Puzhu06.ts classify (LIFT_GODS → QL) / decideP4Puzhu06 (43bffe9 ...)'},
        {'layer': 'runtime consumer', 'class': 'IMPLEMENTATION',
         'where': 'p4OwnerRules.ts resolveP4OwnerRulesDay (4d6ad5c, 2026-10-17) → p4AlmanacHeadings.getP4DayHeadings '
                  '(134ff00, 2026-10-18) → p4ScoreAdapter inside P4_DOMAIN 2025–2027'},
    ]
    literal = {
        'says': 'on 德/合/赦/願/月恩/四相/時德 days, do not note 忌 on the listed headings (立劵交易 among them), '
                'except on days of 遇徳猶忌 and 從忌不從宜, which still note 忌',
        'doesNotSay': 'which 忌 sources are withheld; whether a god with its own trigger-specific clause is covered',
        'exceptionsNamed': ['遇徳猶忌', '從忌不從宜之日'],
        'wuliIsYouJi': False,
        'projectInference': 'Q4 = yes: every remaining-ji god outside the two exceptions is lifted by any trigger '
                            '(literal-leaning, but an inference about scope)',
        'alternativeReading': 'lex specialis: a god whose own entry enumerates its lifters (五離) or trigger-specific '
                              'behaviour (八專 「與德合併猶忌與天願併止忌…」) follows its own entry; puzhu:06 governs the rest. '
                              'SOURCE_INTERPRETATION supported by the 卷十 entry style and the Stage 1 prints.',
    }
    wuli = {
        'entry': WULI, 'ji': ['慶賜賞賀', '宴會', '結婚姻', '納采問名', '立劵交易'],
        'explicitLifters': WULI_OWN, '四相Included': '四相' in WULI, '月恩Included': '月恩' in WULI,
        'triggersOutsideOwnList': [t for t in triggers if t not in WULI_OWN],
        'puzhu06TargetsIntersection': ['立券交易'],
        'note': 'absence of 四相/月恩 is a source fact; read as exclusion only together with the n14/n62 prints',
    }
    witnesses = {
        w['witness']: {
            'context': w['context'], 'sha256': w['page']['sha256'], 'path': w['page']['path'],
            'supports': ['WULI-NARROW (五離 kept under a non-lifter trigger)', 'R2'],
            'contradicts': ['Q4 as applied to 五離 (predicts 立券交易 unnoted)'],
            'cannotTest': ['Q4 for 九空 / 五虛 / 小耗 / 五墓', 'puzhu:21 N-A vs N-C (no 相抵 on the triad)',
                           'other months or officers'],
        } for w in s1['witnesses']
    }
    witnesses['06067694-n117'] = {
        'context': '未-戊申', 'classification': 'CONTAMINATED_BUT_SUPPORTIVE',
        'weight': 'non-decisive: 劫煞 is a second 立券交易 忌 operand; the print is consistent with WULI-NARROW and '
                  'inconsistent with Q4 + N-A, but cannot separate 五離 from 劫煞',
        'g2Cell': 'out of scope: 劫煞 × 立券交易 = BLANK / I1 (LOCAL owner ruling D1(a)), unchanged',
    }

    heading = imp['heading']
    dec = imp['decision']
    lift_keep = [x for x in dec if x['current'][1].startswith('lift') and x['r2'][1].startswith('keep')]
    tag_only = [x for x in dec if x not in lift_keep]
    witnessed = {'戌-壬申', '戌-庚申'}
    group = lambda rows, w: [r for r in rows if (r['context'] in witnessed) == w]
    act = imp['activity']
    ev = imp['event']
    impact = {
        'range': imp['range'],
        'puzhu06LiftToKeep': len(lift_keep),
        'puzhu06TagOnly': len(tag_only),
        'puzhu06TagOnlyContexts': sorted({x['context'] for x in tag_only}),
        'stage1Estimate': 12,
        'headingRows': len(heading),
        'headingRowsByTransition': dict(collections.Counter(
            f"{h['current']['state']}→{h['r2']['state']}" for h in heading)),
        'decisionOnlyRows': ['2026-08-02 未-戊申', '2027-07-28 未-戊申'],
        'decisionOnlyReason': 'R2 keeps 五離 at puzhu:06 (keep:QL_EXCLUDED), then puzhu:21 from 納財 (neither_recorded) '
                              'withholds it under the engine N-A reading; final state stays neither_recorded',
        'activityRows': len(act),
        'activityByTransition': dict(collections.Counter(
            f"{a['activityId']}:{a['current']['status']}→{a['r2']['status']}" for a in act)),
        'scoreDelta': dict(collections.Counter(str(a['r2']['score'] - a['current']['score']) for a in act)),
        'hardWarningChanges': sum(a['current']['hardWarning'] != a['r2']['hardWarning'] for a in act),
        'eventRecordsChanged': len(ev),
        'eventClassificationChanges': sum(e['current']['classification'] != e['r2']['classification'] for e in ev),
        'eventScoreChanges': sum(e['current']['score'] != e['r2']['score'] for e in ev),
        'eventsByType': dict(collections.Counter(e['event'].split('@')[0] for e in ev)),
        'dates': sorted({h['date'] for h in heading}),
        'split': {
            'witnessedShape': {'contexts': sorted(witnessed), 'note': 'no 宜 on 立券交易: the n14/n62 shape',
                               'heading': len(group(heading, True)), 'activity': len(group(act, True)),
                               'event': len(group(ev, True))},
            'extrapolated': {'contexts': sorted({h['context'] for h in group(heading, False)}),
                             'note': '立券交易 has its own 宜 (both_present under R2); no witness tests this shape',
                             'heading': len(group(heading, False)), 'activity': len(group(act, False)),
                             'event': len(group(ev, False))},
        },
    }
    outside = {
        'status': 'KNOWN (production) / NOT_AUDITABLE_WITH_CURRENT_GOLDEN (authority)',
        'why': 'the P4 layer that holds puzhu:06 runs only inside P4_DOMAIN (getP4DayHeadings returns {} outside); '
               'outside it 五離 is not a source-locked presence god, so production has no 五離 row to change',
        'productionImpact': 0,
        'diagnostic': imp['diagnostic'],
        'diagnosticFinalStateContexts': sorted(k for k, v in imp['diagnostic']['contexts'].items()
                                               if v['current'].split('|')[0] != v['r2'].split('|')[0]),
    }
    outside['diagnosticFinalStateDates'] = sum(imp['diagnostic']['datesOutside2025_2027'][k]
                                               for k in outside['diagnosticFinalStateContexts'])

    # Stored pages with another Q4-class god and a puzhu:06 trigger: candidates only, not analysed per heading.
    recs = {}
    for f in [P + 'h1b-yuebiao-witness-v1/lock.json', P + 'yuebiao-witness-lock-v2.json',
              P + 'xiangdi-cancel-both-v1/witness-lock.json']:
        def walk(x):
            if isinstance(x, dict):
                if 'jiShen' in x and 'xiongShen' in x and x.get('path'):
                    recs.setdefault(os.path.basename(x['path']), x)
                for v in x.values():
                    walk(v)
            elif isinstance(x, list):
                for v in x:
                    walk(v)
        walk(json.load(open(f, encoding='utf-8')))
    other_q4 = []
    for pid, x in sorted(recs.items()):
        gods = list(x['jiShen']) + list(x['xiongShen'])
        q = [g for g in ('九空', '五虛', '小耗', '五墓') if g in gods]
        t = [g for g in triggers if g in gods]
        if q and t:
            other_q4.append({'page': pid, 'context': f"{x.get('monthJian')}-{x.get('pillar')}", 'q4Gods': q,
                             'triggers': t, 'ownLiftQuote': {g: p06['liftLists'][g]['quote'] for g in q}})

    evidence = {
        'version': 'f1-wuli-lijuan-stage2-v1',
        'stage1': {'commit': '372c6be', 'classification': s1['classification'],
                   'witnesses': {w['witness']: w['page']['sha256'] for w in s1['witnesses']}},
        'q4Chain': chain, 'puzhu06Literal': literal, 'wuliAuthority': wuli, 'witnesses': witnesses,
        'ruling': 'R2',
        'rulingStatus': 'AUDIT_DETERMINATION; owner adoption required before migration (Q4 stays in force until then)',
        'scopeBasis': 'evidence-limited: n14/n62 test only 五離. The lex specialis reading would reach every Q4-class god; '
                      'R3 is rejected for lack of evidence on 九空/五虛/小耗/五墓, which become an open, suspect class.',
        'otherQ4Gods': {'qlLiftRowsNot五離': 68 - 12, 'storedPageCandidates': other_q4},
        'scope': 'For 五離 only: puzhu:06 triggers do not remove 五離\'s 忌 on 立券交易 unless the trigger is also one of '
                 '五離\'s own lifters (天德 月德 天德合 月德合 天赦; 三合 六合 are not puzhu:06 triggers). '
                 'Not 九空/五虛/小耗/五墓, not other headings, not puzhu:21.',
        'previousOwnerRuling': 'Q4 = yes (2026-10-16), adopted before n117 (2026-10-21) and before n14/n62 (2026-10-26)',
        'impact2025_2027': impact,
        'outside2025_2027': outside,
        'regressionBoundary': {
            'measured': 'R2 impact over 2025–2027: only 立券交易 headings and contract/transaction activities move',
            'mustNotChange': ['G2/W1: 劫煞 × 立券交易 = BLANK / I1 (authority v4 untouched)', '劫煞 cells',
                              '納財 LOCAL ruling', '開市, 納財, 安牀, 開倉庫出貨財 headings', 'puzhu:06 for 九空/五虛/小耗/五墓',
                              'Q4a 五墓 exclusion', 'puzhu:21 behaviour (N-A)', 'G1/G1-b demolition', 'activity aliases',
                              'every activity other than contract/transaction', 'dates outside 2025–2027'],
            'witnessTests': ['p4G2N117Stage3Lock', 'xiejiVol10JieshaAuthority', 'p4OptionCFinalGateLock',
                             'p4Puzhu06 (Q4a 巳丙戌 keep rows)', 'p4F1WuliStage2Impact (the 10-row envelope)'],
        },
        'migrationPlan': {
            'decisionPoint': 'shared/lunar/p4Puzhu06.ts classify(): remaining-ji in LIFT_GODS → QL / QL_EXCLUDED via EXCLUDED',
            'change': 'data only: new authority p4b-puzhu06-v4.json = v3 + liftExclusions.五離 = {triggers: [天願, 月恩, 四相, 時德], '
                      'basis: 卷十 五離 entry quote}; p4Puzhu06.ts import moves v3 → v4. No date or witness condition.',
            'goldens': ['puzhu:06 Golden v4 (successor of v3)', 'P4 score Golden v5 (successor of v4)',
                        'migration-diff successor and lock', 'P4 full Golden layer C re-pin where the 10 rows sit'],
            'failingSuitesIfV3EditedInPlace': FALLOUT,
            'tests': ['R2 envelope = exactly the 10 heading / 20 activity / 100 event rows in impact.json',
                      'rollback to v3 = byte-identical current output', 'mutation: drop the 五離 exclusion → envelope empty',
                      'G2/W1 and 劫煞 cells unchanged'],
            'artifacts': ['docs/audits/p4-f1-wuli-lijuan-stage3-migration.md', 'f1-wuli-lijuan-stage3/ evidence + lock'],
            'forbidden': ['date conditions', 'witness/page conditions', 'editing p4b-puzhu06-v3.json in place'],
        },
        'residual': 'puzhu:21 N-A still withholds 五離 on 未-戊申 立券交易 under R2; N-A vs N-C is a separate open question',
        'g2W1': 'CLOSED / UNCHANGED',
        'productionChanged': False,
    }
    out = os.path.join(HERE, 'evidence.json')
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(evidence, f, ensure_ascii=False, indent=1)
        f.write('\n')
    files = [out, IMPACT, os.path.join(HERE, 'build_evidence.py'), HARNESS, VOL10, PUZHU06, S1 + 'evidence.json',
             S1 + 'lock.json'] + [w['page']['path'] for w in s1['witnesses']]
    with open(os.path.join(HERE, 'lock.json'), 'w', encoding='utf-8') as f:
        json.dump({'version': 'f1-wuli-lijuan-stage2-v1', 'files': {p: sha(p) for p in files}}, f,
                  ensure_ascii=False, indent=1)
        f.write('\n')


if __name__ == '__main__':
    main()
