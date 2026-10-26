"""Q4-REST Stage 2A.1: Y-axis impact and provenance (audit only).

Run from the repo root, after the runtime dump:
  Q4R2A1_DUMP=1 npx vitest run shared/lunar/p4Q4RestStage2A1Impact.test.ts -t dumps
  python3 -I docs/audits/sources/p4-vol10/q4-rest-stage2a1/build_evidence.py [OUTDIR]
Writes source-pattern.json, production-population.json, semantic-families.json, f1-y.json, provenance.json,
diagnostic-impact.json, acquisition-plan-v3.json and lock.json. Stage 1 / 2A files are read, never written.
The Y-NARROW model in runtime.json is a diagnostic, not approved behaviour.
"""
import collections
import hashlib
import json
import os
import sys

HERE = os.path.relpath(os.path.dirname(os.path.abspath(__file__)))
P = 'docs/audits/sources/p4-vol10/'
S1, S2A = P + 'q4-rest-stage1/', P + 'q4-rest-stage2a/'
VOL10 = P + 'vol10.raw.txt'
RUNTIME = os.path.join(HERE, 'runtime.json')
PAGES = os.path.join(HERE, 'page-contexts.json')
HARNESS = 'shared/lunar/p4Q4RestStage2A1Impact.test.ts'
F1S1, F1S3 = P + 'f1-wuli-lijuan-stage1/evidence.json', P + 'f1-wuli-lijuan-stage3/owner-ruling.json'
G2S3 = P + 'g2-n117-stage3/owner-ruling.json'
AUTH = 'shared/almanac-data/p4b-puzhu06-v4.json'
TARGET = ['九空', '五虛', '小耗', '五墓', '五離']
OFFICER = {'建日', '除日', '滿日', '平日', '定日', '執日', '破日', '危日', '成日', '收日', '開日', '閉日'}
QUOTES = {
    'old': '舊本凡吉神遇凶煞皆從忌而不從宜',
    'critique': '於理固屬不合於事尤為不便',
    'replace': '除建破等日條例簡易及專忌之日無庸分别外餘分為六等',
    'grades': '其上吉足勝凶從宜不從忌上次吉足抵凶遇德從宜不從忌不遇從宜亦從忌中等吉不抵凶遇德則吉勝從宜不從忌不遇從忌不從宜'
              '中次凶勝於吉遇德始相抵從宜亦從忌不遇從忌不從宜其下凶又逢凶遇德從忌不從宜不遇諸事皆忌最下凶叠大凶遇德仍諸事皆忌',
    'table': '{{SK anchor|宜忌等第表}}',
    'chongri': '則不忌亦不註宜',
}
norm = lambda h: h.replace('壞', '壊')


def sha(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def yi_class(gods):
    off = [g for g in gods if g in OFFICER]
    return 'officer' if off and len(off) == len(gods) else 'jishen' if not off else 'mixed'


DATED = ('朔望日', '土王用事後', '每月')


def u7_sub(row):
    """Which source protects the 忌 on a U7 row (first match wins)."""
    prot = row['prot']
    if set(prot) & set(row['ungraded']):
        return 'U7a_SELF_PROTECTED_UNGRADED'
    if any(x.startswith('百忌') for x in prot):
        return 'U7b_BAIJI_ZHUANJI'
    if any(x.startswith(DATED) for x in prot):
        return 'U7c_DATED'
    return 'U7d_SUBJECT_OR_OTHER'


def family(row):
    """Primary family for a both_present row with a surviving ungraded 忌 (first match wins)."""
    if row['protectedJi']:
        return 'U7_PROTECTED_CO_OPERAND'
    if len(row['ji']) > 1:
        return 'U4_MULTIPLE_JI'
    if row['puzhu06'].startswith('keep'):
        return 'U5_PUZHU06_KEPT'
    return {'officer': 'U2_SOLE_OFFICER_YI', 'jishen': 'U3_SOLE_JISHEN_YI', 'mixed': 'U1_SOLE_MIXED_YI'}[
        yi_class(row['yiGods'])]


FAMILIES = {
    'U1_SOLE_MIXED_YI': 'one ungraded 忌, 宜 from officer and 吉神 together',
    'U2_SOLE_OFFICER_YI': 'one ungraded 忌, 宜 from the day officer only (滿日 …)',
    'U3_SOLE_JISHEN_YI': 'one ungraded 忌, 宜 from 吉神 only (德, 月恩/四相/時德, 三合 …)',
    'U4_MULTIPLE_JI': 'two or more surviving 忌 operands',
    'U5_PUZHU06_KEPT': 'one ungraded 忌 kept by puzhu:06 (QL_EXCLUDED: Q4a / F1 R2)',
    'U7_PROTECTED_CO_OPERAND': '忌 protected by a co-operand (百忌, 專忌, 八專 …)',
}


def main():
    raw = open(VOL10, encoding='utf-8').read()
    for k, q in QUOTES.items():
        assert q in raw, k
    rt = json.load(open(RUNTIME, encoding='utf-8'))
    assert rt['authority'] == 'p4b-puzhu06-v4'
    c2a = json.load(open(S2A + 'corpus-pattern-search.json', encoding='utf-8'))
    plan2 = json.load(open(S2A + 'acquisition-plan-v2.json', encoding='utf-8'))
    f1s1 = json.load(open(F1S1, encoding='utf-8'))
    f1s3 = json.load(open(F1S3, encoding='utf-8'))

    # ---- 4. source pattern, re-checked against production (owner-rules runtime) ----
    src = []
    for h in c2a['hits']:
        if h['kind'] != 'SURVIVING':
            continue
        prod = rt['pages'][h['context']][norm(h['heading'])]
        row = {'ji': prod['ji'], 'protectedJi': bool(prod['prot']), 'puzhu06': prod['puzhu06'], 'yiGods': h['yiGods']}
        assert prod['state'] == 'both_present' and prod['ji'] == h['remaining'] and h['printed'] == 'only_ji', h
        src.append({'witness': h['page'], 'context': h['context'], 'god': h['remaining'][0], 'heading': h['heading'],
                    'yiSource': h['yiGods'], 'jiSource': prod['ji'], 'production': prod['state'],
                    'printed': h['printed'], 'family': family(row)})
    assert len(src) == 21
    patterns = collections.defaultdict(lambda: {'witnesses': set(), 'contexts': set(), 'headings': set(), 'rows': 0})
    for s in src:
        p = patterns[(s['god'], s['family'], '+'.join(s['yiSource']))]
        p['witnesses'].add(s['witness'])
        p['contexts'].add(s['context'])
        p['headings'].add(s['heading'])
        p['rows'] += 1
    pattern_list = [{'god': g, 'family': f, 'yiSource': y, 'rows': v['rows'], 'witnesses': sorted(v['witnesses']),
                     'contexts': sorted(v['contexts']), 'headings': sorted(v['headings'])}
                    for (g, f, y), v in sorted(patterns.items())]
    excluded = c2a['excluded']
    source = {
        'version': 'q4-rest-stage2a1-v1', 'rawRows': len(src), 'rows': src,
        'witnessPages': sorted({s['witness'] for s in src}),
        'independentPatterns': pattern_list,
        'independentPatternCount': len(pattern_list),
        'gods': sorted({s['god'] for s in src}), 'headings': sorted({s['heading'] for s in src}),
        'families': dict(collections.Counter(s['family'] for s in src)),
        'counterexamples': 0, 'excluded': excluded,
        'q4LiftRow': '06067692-n126 卯-丁巳 五虛 × 開倉庫出貨財 (production only_yi after puzhu:06 lift; printed only_ji)',
        'note': '21 rows are 4 god × 宜-source propositions on 7 pages, not 21 rules',
    }

    # ---- 2–3. production population 2025–2027 ----
    rows = []
    for d, v in sorted(rt['population'].items()):
        for h, r in sorted(v['rows'].items()):
            rows.append({'date': d, 'context': v['context'], 'heading': h, 'ji': r['ji'], 'ungraded': r['ungraded'],
                         'prot': r['prot'], 'protectedJi': r['protectedJi'], 'puzhu06': r['puzhu06'],
                         'propagationBlocked': r['propagationBlocked'], 'yiGods': r['yiGods'],
                         'yiClass': yi_class(r['yiGods']), 'family': family(r),
                         'target': sorted(set(r['ungraded']) & set(TARGET)) or ['other']})
            if rows[-1]['family'].startswith('U7'):
                rows[-1]['u7'] = u7_sub(rows[-1])
    src_keys = {(s['context'], norm(s['heading'])) for s in src}
    pat_keys = {(p['god'], p['family']) for p in pattern_list}
    for r in rows:
        r['coverage'] = 'DIRECT_SOURCE_COVERED' if (r['context'], r['heading']) in src_keys else \
            'PATTERN_COVERED' if any((g, r['family']) in pat_keys for g in r['ungraded']) else 'UNCOVERED'
    by_god = collections.Counter(g for r in rows for g in r['ungraded'])
    by_target = collections.Counter(t for r in rows for t in r['target'])
    population = {
        'version': 'q4-rest-stage2a1-v1', 'range': rt['range'],
        'filter': 'production final state both_present and at least one surviving 忌 id is a 卷十 remaining-ji '
                  '(ungraded) entry; all P4 headings, not only puzhu:06',
        'rows': rows, 'total': len(rows), 'days': len({r['date'] for r in rows}),
        'contexts': len({r['context'] for r in rows}),
        'byUngradedGod': dict(by_god.most_common()),
        'byTarget': {t: by_target.get(t, 0) for t in TARGET + ['other']},
        'byHeading': dict(collections.Counter(r['heading'] for r in rows).most_common()),
        'puzhu06Participated': sum(bool(r['puzhu06']) for r in rows),
        'propagationBlocked': sum(bool(r['propagationBlocked']) for r in rows),
    }

    # ---- families ----
    fam = {
        'version': 'q4-rest-stage2a1-v1', 'definitions': FAMILIES,
        'u7Total': sum('u7' in r for r in rows),
        'u7Split': dict(collections.Counter(r['u7'] for r in rows if 'u7' in r).most_common()),
        'u7SelfProtectedGods': dict(collections.Counter(g for r in rows if r.get('u7') == 'U7a_SELF_PROTECTED_UNGRADED'
                                                        for g in sorted(set(r['prot']) & set(r['ungraded']))).most_common()),
        'u7SourceLines': {
            'zhuanji': '「除建破等日條例簡易及專忌之日無庸分别」 takes 專忌 days out of the grade framework; puzhu:22 '
                       '「如遇專忌之日則仍註忌」 keeps their 忌. Neither line says how 宜 combines',
            'tufu': '「凡土府土符地囊止註忌補垣亦不註宜塞穴」: 宜 withheld for 塞穴 only (not a P4 heading)',
            'siji': '「凡四忌四窮止忌安葬如遇鳴吠鳴吠對亦不註宜破土啟攢」: specific headings only',
            'heidao': '六黑道 「與凶神併則從所忌與吉神併則從所宜」 concerns the 黑道 gods themselves',
            'result': 'no general source line on 宜 against a protected 忌; U7 rows reach both_present through the same '
                      'A05 default in code, but their provenance is UNVERIFIED, not established',
        },
        'population': dict(collections.Counter(r['family'] for r in rows).most_common()),
        'source': source['families'],
        'sourceSpansFamilies': sorted(source['families']),
        'familiesWithoutSource': sorted(set(r['family'] for r in rows) - set(source['families'])),
        'provenanceScope': 'IMPLEMENTATION_DEFAULT is established for the sole-ungraded families U1, U2, U3, U5; U4 and '
                           'U7 are unverified',
        'note': 'puzhu:21/22 and 相抵 never produce both_present rows (they end in neither_recorded / lifted); '
                'propagation shows only as propagationBlocked on protected rows',
    }

    # ---- 10. coverage ----
    def cov_table(key):
        out = {}
        for k in sorted({x for r in rows for x in key(r)}):
            rs = [r for r in rows if k in key(r)]
            out[k] = {'production': len(rs),
                      'direct': sum(r['coverage'] == 'DIRECT_SOURCE_COVERED' for r in rs),
                      'pattern': sum(r['coverage'] == 'PATTERN_COVERED' for r in rs),
                      'uncovered': sum(r['coverage'] == 'UNCOVERED' for r in rs)}
        return out
    coverage = {'byGod': cov_table(lambda r: r['ungraded']), 'byHeading': cov_table(lambda r: [r['heading']]),
                'total': {k: sum(r['coverage'] == k for r in rows)
                          for k in ('DIRECT_SOURCE_COVERED', 'PATTERN_COVERED', 'UNCOVERED')}}
    coverage['directPercent'] = round(100 * coverage['total']['DIRECT_SOURCE_COVERED'] / len(rows), 1)
    coverage['patternOrDirectPercent'] = round(
        100 * (len(rows) - coverage['total']['UNCOVERED']) / len(rows), 1)
    population['coverage'] = coverage

    # ---- 5–6. F1-Y ----
    wuli = [r for r in rows if '五離' in r['ungraded']]
    lijuan_all = [r for r in wuli if r['heading'] == '立券交易']
    lijuan = [r for r in lijuan_all if r['puzhu06'].startswith('keep')]  # the F1 R2 rows (puzhu:06 keeps 五離)
    wit_rows = []
    pg = {'06067696-n14': '戌-壬申', '06067696-n62': '戌-庚申', '06067694-n117': '未-戊申'}
    lines = {w['witness']: (w['page']['yiNormalized'], w['page']['jiNormalized']) for w in f1s1['witnesses']}
    n117 = next(p for p in c2a['pages'] if p['page'] == '06067694-n117')
    for wid, ctx in pg.items():
        if wid in lines:
            yi, ji = lines[wid]
        else:
            yi, ji = '祭祀沐浴掃舍宇', '上冊受封上表章會親友出行結婚姻納采問名安牀求醫療病修倉庫立券交易納財開倉庫出貨財破土安葬啟攢'
            assert n117['searchable']
        for h in ('宴會', '結婚姻', '納采問名', '立券交易'):
            prod = rt['pages'][ctx][h]
            printed = 'NOT_COMPARED (printed as 會親友, not aliased)' if h == '宴會' else \
                {(True, False): 'only_yi', (False, True): 'only_ji', (True, True): 'both_present'}.get(
                    (h in yi, h in ji), 'not_recorded')
            evidence = ('Y_ONLY_JI_SOLE' if prod['state'] == 'both_present' and prod['ji'] == ['五離'] and printed == 'only_ji'
                        else 'Y_ONLY_JI_PROTECTED_CO_OPERAND' if prod['state'] == 'both_present' and printed == 'only_ji'
                        else 'NO_INDEPENDENT_YI' if prod['state'] == 'only_ji'
                        else 'NOT_Y (相抵 / other state)' if h != '宴會' else 'NOT_COMPARED')
            wit_rows.append({'witness': wid, 'context': ctx, 'heading': h, 'production': prod['state'],
                             'jiSources': prod['ji'], 'printed': printed, 'yEvidence': evidence})
    f1y = {
        'version': 'q4-rest-stage2a1-v1',
        'question': 'when 五離\'s 忌 survives and an independent 宜 exists: only_ji or both_present?',
        'f1Rule3': f1s3['rule'][2], 'r2JAxis': 'unchanged: generic triggers do not lift 五離 on 立券交易 (v4)',
        'productionRows': len(wuli), 'byHeading': dict(collections.Counter(r['heading'] for r in wuli)),
        'byFamily': dict(collections.Counter(r['family'] for r in wuli)),
        'lijuanRows': [{k: r[k] for k in ('date', 'context', 'heading', 'yiGods', 'ji', 'puzhu06', 'coverage')}
                       for r in lijuan],
        'lijuanContexts': sorted({r['context'] for r in lijuan}),
        'lijuanAllRows': len(lijuan_all),
        'lijuanPreExistingRows': {'count': len(lijuan_all) - len(lijuan),
                                  'contexts': sorted({r['context'] for r in lijuan_all if r not in lijuan}),
                                  'note': 'no puzhu:06 trigger: both_present before and after F1; same composer default'},
        'scope': 'WIDER_COMPOSER: F1 R2 rows are 4 of %d 五離 × 立券交易 both_present rows and %d 五離 rows; all come '
                 'from the same IMPLEMENTATION_DEFAULT' % (len(lijuan_all), len(wuli)),
        'lijuanDirectlyCovered': sum(r['coverage'] == 'DIRECT_SOURCE_COVERED' for r in lijuan),
        'lijuanStatus': 'SEMANTIC_ONLY (no page tests 五離 × 立券交易 with independent 宜)',
        'otherHeadingsDirect': sum(r['coverage'] == 'DIRECT_SOURCE_COVERED' for r in wuli),
        'witnessTable': wit_rows,
        'classification': 'F1Y-B',
    }
    assert len(lijuan) == 4 and f1y['lijuanContexts'] == ['丑-甲申', '午-戊申'] and not f1y['lijuanDirectlyCovered']

    # ---- 7–8. provenance and six grades ----
    provenance = {
        'version': 'q4-rest-stage2a1-v1',
        'rule': 'surviving 忌 + independent 宜 → both_present (for an ungraded 凶煞)',
        'chain': [
            {'layer': '卷十 等第 prose', 'class': 'SOURCE_FACT', 'scope': 'graded subjects only',
             'text': QUOTES['grades'][:40] + '…', 'note': 'both_present = 從宜亦從忌, defined only per grade (上次/中次)'},
            {'layer': 'A04a heading annotation state model (P4HeadingState)', 'class': 'IMPLEMENTATION',
             'where': 'shared/lunar/p4HeadingAnnotation.ts (3800d99, 2026-10-16)', 'note': 'state vocabulary, per subject scope'},
            {'layer': 'A05 day composition rule', 'class': 'IMPLEMENTATION_DEFAULT',
             'where': 'docs/audits/p4-vol10-day-composition.md 「宜 bị chặn nếu có phạm vi 從忌不從宜 / 不註 liệt kê heading '
                      'đó」; shared/lunar/p4DayComposition.ts (3800d99, 2026-10-16)',
             'note': '宜 is suppressed only by a scope marked 從忌不從宜 / 不註; ungraded scopes carry no such mark, so '
                     'ji + 宜 falls through to both_present'},
            {'layer': 'P4-B remaining-ji', 'class': 'IMPLEMENTATION',
             'where': 'docs/audits/p4-vol10-remaining-ji.md 「P4-B đặt 宜 = true để chỉ đọc 忌 (both_present = kept)」',
             'note': 'remaining scopes carry 忌 only; 宜 composed later by the A05 rule'},
            {'layer': 'owner-rules runtime', 'class': 'IMPLEMENTATION',
             'where': 'shared/lunar/p4OwnerRules.ts resolveP4OwnerRulesDay (aef0a1e/4d6ad5c, 2026-10-17): suppress = '
                      'yiOff | 相抵 | puzhu:27 | subject as_usual/still_avoid/avoid_all',
             'note': 'reproduces full Golden v2; remaining facts never suppress 宜'},
            {'layer': 'full Golden v2 acceptance', 'class': 'OWNER_ACCEPTED_GOLDEN (wholesale, no Y-specific review)',
             'where': 'docs/audits/p4-full-golden-review.md (roadmap 7 acceptance, 2026-10-17); owner questions '
                      'p4-full-golden-hold-questions.md were H1/H2 (相抵 / 德願); owner_checks.py checks (i), E1, E3, D',
             'note': 'the owner accepted the computed output as a whole; no question or check addressed ungraded 忌 + '
                     '宜. H1-B (an unprotected 忌 meeting another scope\'s 相抵 → 宜 not noted) is the nearest owner '
                     'Y decision and points the other way for its own case'},
            {'layer': 'puzhu:06 PRD', 'class': 'IMPLEMENTATION (inherited)',
             'where': 'tasks/prd-p4b-puzhu06.md: 「2025-01-15 丑甲申 立券交易 … Trạng thái hiện tại both_present」',
             'note': 'reads the existing state; makes no Y decision'},
            {'layer': 'F1 R2 rule 3', 'class': 'OWNER_RULING (2026-10-26)',
             'where': F1S3, 'note': 'first explicit statement of the rule; it adopted the composer state measured in F1 '
                                    'Stage 2 (4 rows both_present) rather than a source finding'},
        ],
        'firstArtifact': 'docs/audits/p4-vol10-day-composition.md + shared/lunar/p4DayComposition.ts (3800d99, 2026-10-16)',
        'classification': 'IMPLEMENTATION_DEFAULT, accepted wholesale in Golden v2 (no Y-specific review); F1 rule 3 '
                          'inherited it. Scope: sole-ungraded families U1–U3, U5; U4 and U7 unverified',
        'sixGrades': {
            'old': QUOTES['old'], 'critique': QUOTES['critique'], 'replacement': QUOTES['replace'],
            'grades': QUOTES['grades'],
            'tableInRaw': False, 'tableAnchorOffset': raw.find(QUOTES['table']),
            'gradedVsUngraded': 'grades attach to the 宜忌等第表 cells (subject × month); ungraded 凶煞 entries carry only '
                                '「與…併則不忌」 / 猶忌 / 不註宜 clauses about their own 忌',
            'ungradedVsYiDefined': False,
            'absenceImplies': 'NO_CONCLUSION: the prose replaces the blanket rule for what it grades and says nothing of '
                              'the rest; 重日/復日 「則不忌亦不註宜」 speaks of 宜 only for the lifted case',
            'yuebiaoConvention': 'the 月表 prints only_ji on every comparable row: a printed convention not stated in the '
                                 'prose',
        },
    }

    # ---- 9. diagnostic impact ----
    pop_key = {(r['date'], r['heading']): r for r in rows}
    wuli_sole = [r for r in rows if r['ungraded'] == ['五離']]

    def stats(imp):
        hd, act, ev = imp['heading'], imp['activity'], imp['event']
        return {
            'headingRows': len(hd), 'activityRows': len(act), 'eventRecords': len(ev),
            'activityStatusChanges': sum(a['production']['status'] != a['ynarrow']['status'] for a in act),
            'activityScoreChanges': sum(a['production']['score'] != a['ynarrow']['score'] for a in act),
            'hardWarningChanges': sum(a['production']['hardWarning'] != a['ynarrow']['hardWarning'] for a in act),
            'eventClassificationChanges': sum(e['production']['classification'] != e['ynarrow']['classification']
                                              for e in ev),
            'eventScoreChanges': sum(e['production']['score'] != e['ynarrow']['score'] for e in ev),
            'statusMoves': dict(collections.Counter(f"{a['production']['status']}→{a['ynarrow']['status']}"
                                                    for a in act).most_common()),
            'byActivity': dict(collections.Counter(a['activityId'] for a in act).most_common()),
            'headingByHeading': dict(collections.Counter(x['heading'] for x in hd).most_common()),
            'headingByGod': dict(collections.Counter(g for x in hd for g in pop_key[(x['date'], x['heading'])]['ungraded'])
                                 .most_common()),
            'headingByFamily': dict(collections.Counter(pop_key[(x['date'], x['heading'])]['family'] for x in hd)),
            'headingByCoverage': dict(collections.Counter(pop_key[(x['date'], x['heading'])]['coverage'] for x in hd)),
        }
    imp = rt['impact']
    for k in imp:
        assert all((x['date'], x['heading']) in pop_key for x in imp[k]['heading'])
    scopes = {k: stats(v) for k, v in imp.items()}
    assert scopes['all']['headingRows'] == len(rows)
    fam_match = [r for r in rows if any((g, r['family']) in pat_keys for g in r['ungraded'])]
    assert scopes['evidence']['headingRows'] == len(fam_match)
    off_family_direct = [f"{r['date']} {r['context']} {r['heading']} ({r['family']})" for r in rows
                         if r['coverage'] == 'DIRECT_SOURCE_COVERED' and r not in fam_match]
    assert scopes['f1y']['headingRows'] == len(wuli_sole)
    assert scopes['u7']['headingRows'] == sum(r['family'].startswith('U7') for r in rows)
    diag = {
        'version': 'q4-rest-stage2a1-v1', 'model': 'Y-NARROW (diagnostic only; not approved)',
        'hypothesis': 'a both_present row whose surviving 忌 includes an ungraded remaining-ji god reads only_ji',
        'scopes': {
            'all': 'every such row (the full hypothesis)',
            'evidence': 'evidence-bounded: rows whose ungraded god × family matches a source pattern (direct + pattern '
                        'covered)',
            'f1y': 'F1-Y: rows where 五離 is the sole ungraded source',
            'u7': 'extrapolation cost: protected (U7) rows only',
        },
        **scopes,
        'evidenceScopeNote': 'family match; direct rows whose dated 宜 changes the family are outside it',
        'directOutsideEvidenceScope': off_family_direct,
        'goldensChanged': False,
    }

    # ---- 11. acquisition plan v3 ----
    pop_ctx = collections.Counter(r['context'] for r in rows)
    uncovered_ctx = collections.Counter(r['context'] for r in rows if r['coverage'] == 'UNCOVERED')
    pages = []
    for x in plan2['pages']:
        if x['context'] == '丑-甲申' or x['priority'] == 'P3':
            continue
        y_rows = pop_ctx.get(x['context'], 0)
        f1 = any('F1-Y' in t for t in x['tests'])
        prio = 'P0' if x['role'] == 'PRIMARY' and (f1 or y_rows) else 'P1' if x['role'] == 'PRIMARY' else 'P2'
        pages.append({**x, 'prodYRows2025_2027': y_rows, 'priority': prio,
                      'gain': 'J' + ('+Y' if y_rows else '') + ('+F1-Y' if f1 else '')})
    pages.append({'context': '丑-甲申', 'priority': 'P1', 'role': 'PRIMARY', 'tests': ['五離×立券交易:Y (F1-Y)'],
                  'gain': 'F1-Y', 'prodYRows2025_2027': pop_ctx.get('丑-甲申', 0),
                  'predictedLocator': {'value': '06067697-n93', 'status': 'HYPOTHESIS'}})
    # Y family gaps: the highest-impact uncovered production context per family the source does not span.
    for f in fam['familiesWithoutSource']:
        taken = {x['context'] for x in pages}
        ctxs = collections.Counter(r['context'] for r in rows if r['family'] == f and r['coverage'] == 'UNCOVERED')
        hit = [x for x in pages if x['context'] in ctxs]
        if hit:  # an already-planned page also covers this family
            hit[0]['tests'] = hit[0]['tests'] + [f'{f}:Y']
            if hit[0]['priority'] == 'P2':  # a replication page that fills a Y family gap gains a role
                hit[0].update(priority='P1', role='PRIMARY_Y_FAMILY', gain=hit[0]['gain'] + '+Yfamily')
            continue
        ctxs = collections.Counter({c: n for c, n in ctxs.items() if c not in taken})
        if ctxs:
            c, n = sorted(ctxs.items(), key=lambda kv: (-kv[1], kv[0]))[0]
            pages.append({'context': c, 'priority': 'P2', 'role': 'Y_FAMILY_GAP', 'tests': [f'{f}:Y'], 'gain': 'Y',
                          'prodYRows2025_2027': pop_ctx[c], 'predictedLocator': {'value': None, 'status': 'HYPOTHESIS'}})
    for x in plan2['pages']:
        if x['priority'] == 'P3':
            pages.append({**x, 'gain': 'contaminated', 'prodYRows2025_2027': pop_ctx.get(x['context'], 0)})
    rank = {'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3}
    pages.sort(key=lambda x: (rank[x['priority']], -x['gain'].count('+'), -x['prodYRows2025_2027'], x['context']))
    plan3 = {'version': 'q4-rest-stage2a1-v1', 'supersedes': S2A + 'acquisition-plan-v2.json',
             'status': 'HYPOTHESIS until authenticated; not acquired', 'ranking': 'information gain (J, Y, F1-Y), then '
             '2025–2027 production Y rows', 'pages': pages,
             'byPriority': dict(collections.Counter(x['priority'] for x in pages)),
             'primary': [x['context'] for x in pages if x['priority'] in ('P0', 'P1')],
             'wumu': 'no J target (models coincide); Y for 五墓 already direct (n95)'}

    outdir = sys.argv[1] if len(sys.argv) > 1 else HERE

    def out(name, obj):
        with open(os.path.join(outdir, name), 'w', encoding='utf-8') as f:
            json.dump(obj, f, ensure_ascii=False, indent=1)
            f.write('\n')
    built = {'source-pattern.json': source, 'production-population.json': population,
             'semantic-families.json': fam, 'f1-y.json': f1y, 'provenance.json': provenance,
             'diagnostic-impact.json': diag, 'acquisition-plan-v3.json': plan3}
    for n, o in built.items():
        out(n, o)
    files = {os.path.join(HERE, n): sha(os.path.join(outdir, n)) for n in built}
    for p_ in [RUNTIME, PAGES, os.path.join(HERE, 'build_evidence.py'), HARNESS, VOL10, AUTH, F1S1, F1S3, G2S3,
               S1 + 'lock.json', S2A + 'lock.json', S2A + 'corpus-pattern-search.json', S2A + 'acquisition-plan-v2.json',
               'shared/lunar/p4OwnerRules.ts', 'shared/lunar/p4Puzhu06.ts',
               'shared/almanac-data/golden-p4b-puzhu06-v4.json']:
        files[p_] = sha(p_)
    out('lock.json', {'version': 'q4-rest-stage2a1-v1', 'files': files})


if __name__ == '__main__':
    main()
