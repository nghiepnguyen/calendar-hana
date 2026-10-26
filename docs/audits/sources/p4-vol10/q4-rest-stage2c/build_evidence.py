"""Q4-REST Stage 2C: 小耗 replication (戌-癸卯) and owner-ruling evidence packets (audit only).

Run from the repo root, after the impact dump:
  Q4R2C_DUMP=1 npx vitest run shared/lunar/p4Q4RestStage2CImpact.test.ts
  python3 -I docs/audits/sources/p4-vol10/q4-rest-stage2c/build_evidence.py [OUTDIR]
Writes page.json, transcription.json, dashi-authority.json, xiaohao-replication.json, owner-packets.json,
scope-matrix.json, diagnostic-impact.json, draft-rulings.json and lock.json. Earlier stages are read, never written.
Candidate rulings are drafts: none is active and none is a production expectation.
"""
import collections
import hashlib
import json
import os
import sys

HERE = os.path.relpath(os.path.dirname(os.path.abspath(__file__)))
P = 'docs/audits/sources/p4-vol10/'
S1, S2B = P + 'q4-rest-stage1/', P + 'q4-rest-stage2b/'
VOL10, VOL11 = P + 'vol10.raw.txt', P + 'yi-sources-v1/vol11.raw.txt'
RUNTIME = os.path.join(HERE, 'runtime.json')
HARNESS = 'shared/lunar/p4Q4RestStage2CImpact.test.ts'
AUTH = 'shared/almanac-data/p4b-puzhu06-v4.json'
F1S3, G2S3 = P + 'f1-wuli-lijuan-stage3/owner-ruling.json', P + 'g2-n117-stage3/owner-ruling.json'
PAGE = os.path.join(HERE, 'pages', '06067696-n45.jpg')
B = '子丑寅卯辰巳午未申酉戌亥'
S = '甲乙丙丁戊己庚辛壬癸'
CYCLE = [S[i % 10] + B[i % 12] for i in range(60)]
OFFICERS = '建除滿平定執破危成收開閉'
TRIGGERS = ['天德', '月德', '天德合', '月德合', '天赦', '天願', '月恩', '四相', '時德']
XH_HEADINGS = ['開市', '立券交易', '納財', '開倉庫出貨財']
VARIANTS = str.maketrans({'劵': '券', '徳': '德', '虚': '虛'})
norm = lambda s: s.translate(VARIANTS)

# Reading of the stored scan (curl --fail of the w1200 page image, 2026-10-26, image unmodified): whole page, then
# a full-resolution crop of the 忌 block. Column breaks ｜.
READING = dict(
    header='癸卯金箔金寶執日', margin='卷二十八', foliation='[NOT VISIBLE]',
    ji_shen=['四相', '六合', '不將', '聖心', '五合', '鳴吠對'],
    xiong_shen=['大時', '大敗', '咸池', '小耗', '五虛', '勾陳'],
    yi='祭祀祈福求嗣襲爵受封會親友出行上官｜赴任臨政親民結婚姻納采問名嫁娶進人｜口移徙解除求醫療病裁衣修造動土豎柱｜上梁經絡醞釀捕捉畋獵栽種牧養納畜破｜土安葬啟攢',
    ji='修倉庫開市立券交易納財開倉庫出貨財｜穿井',
)
QUOTES = {
    'dashiJi': '忌祈福求嗣上册進表章施恩封拜詔命公卿招賢舉正直',
    'dashiJiTail': '修倉庫開市立劵交易納財開倉庫出貨財修置產室栽種牧養納畜',
    'dashiXuMonth': '辰戌月值執日六合止忌安撫邊境選將訓兵出師餘皆不忌',
    'dashiNote': '辰戌月值執日六合太陽合月建不應以三合敗氣論故即不與德合赦願併亦止忌軍事餘皆不忌也',
    'wuxuLift': '與天德月德天德合月德合六合併則不忌',
    'xiaohao': '忌修倉庫開市立劵交易納財開倉庫出貨財與天德月德天德合月德合天願併則不忌子午卯酉月值刼煞雖與德合併猶忌',
    'baijiMao': '夘日忌穿井',
}


def sha(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def vol11():
    lines = open(VOL11, encoding='utf-8').read().split('\n')
    out = {}
    for h in XH_HEADINGS:
        raw = '立劵交易' if h == '立券交易' else h
        i = next(n for n, l in enumerate(lines) if '{{SK anchor|%s}}' % raw in l)
        nxt = []
        for l in lines[i + 1:i + 4]:
            if 'SK anchor' in l:
                break
            nxt.append(l.strip('　 '))
        out[h] = {k: next((norm(l[1:]) for l in nxt if l.startswith(c)), '') for k, c in (('yi', '宜'), ('ji', '忌'))}
    return out


def counts(v):
    a, e = v['activity'], v['event']
    return {'decisionRows': len(v['decision']), 'headingRows': len(v['heading']), 'activityRows': len(a),
            'eventRows': len(e),
            'statusChanges': sum(x['production']['status'] != x['model']['status'] for x in a),
            'activityScoreChanges': sum(x['production']['score'] != x['model']['score'] for x in a),
            'hardWarningChanges': sum(x['production']['hardWarning'] != x['model']['hardWarning'] for x in a),
            'eventClassificationChanges': sum(x['production']['classification'] != x['model']['classification'] for x in e),
            'eventScoreChanges': sum(x['production']['score'] != x['model']['score'] for x in e),
            'headingTransitions': dict(collections.Counter(
                f"{(x['production'] or {}).get('state')}→{(x['model'] or {}).get('state')}" for x in v['heading'])),
            'byActivity': dict(collections.Counter(x['activityId'] for x in a).most_common()),
            'contexts': sorted({x['context'] for x in v['heading']})}


def main():
    raw = open(VOL10, encoding='utf-8').read()
    for k, q in QUOTES.items():
        assert q in raw, k
    rt = json.load(open(RUNTIME, encoding='utf-8'))
    assert rt['authority'] == 'p4b-puzhu06-v4'
    lists = vol11()
    j2b = json.load(open(S2B + 'j-axis.json', encoding='utf-8'))
    f2b = json.load(open(S2B + 'f1-y.json', encoding='utf-8'))
    plan = json.load(open(S2B + 'replication-plan.json', encoding='utf-8'))

    # ---- page, authentication, transcription ----
    month, pillar, officer = '戌', '癸卯', READING['header'][-2]
    month_from_officer = B[(B.index(pillar[1]) - OFFICERS.index(officer)) % 12]
    predicted = plan['minimum'][0]['locator']['value']
    page = {'witness': '06067696-n45', 'context': f'{month}-{pillar}', 'archive': '06067696.cn',
            'locator': 'https://archive.org/download/06067696.cn/page/n45_w1200.jpg', 'path': PAGE, 'sha256': sha(PAGE),
            'retrieval': 'curl --fail, 2026-10-26; image unmodified',
            'authentication': {'header': READING['header'], 'officer': officer, 'monthFromOfficer': month_from_officer,
                               'predictedLocator': predicted, 'locatorConfirmed': predicted == '06067696-n45',
                               'leafCalibration': f'leaf 45 = cycle {CYCLE.index(pillar)} + 6 (戌 block)',
                               'margin': READING['margin'], 'foliation': READING['foliation'],
                               'godCrossChecks': {'四相': 'autumn 壬癸 ✓', '六合': '戌 ↔ 卯 ✓', '大時': '寅午戌 months → 卯 ✓',
                                                  '小耗': '戌 + 5 = 卯 ✓', '五虛': 'autumn 亥卯未 ✓'}}}
    ok = READING['header'].startswith(pillar) and month_from_officer == month and page['authentication']['locatorConfirmed']
    page['authentication']['status'] = 'AUTHENTICATED' if ok else 'UNAUTHENTICATED'
    assert ok
    yi_n, ji_n = norm(READING['yi'].replace('｜', '')), norm(READING['ji'].replace('｜', ''))
    trans = {'jiShen': READING['ji_shen'], 'xiongShen': READING['xiong_shen'], 'yiRaw': READING['yi'],
             'jiRaw': READING['ji'], 'yiNormalized': yi_n, 'jiNormalized': ji_n,
             'sha256': {k: hashlib.sha256(READING[k].encode()).hexdigest() for k in ('yi', 'ji')},
             'uncertain': [], 'layout': '開倉庫出貨財 and 立券交易 unbroken in 忌 column 1; 穿井 (卯日 百忌) in column 2'}

    # ---- 大時 authority ----
    gods = READING['ji_shen'] + READING['xiong_shen']
    dashi = {
        'entry': {'ji': QUOTES['dashiJi'] + '…' + QUOTES['dashiJiTail'],
                  'listsTestedHeadings': all(h in norm(QUOTES['dashiJiTail']) for h in XH_HEADINGS),
                  'class': 'SOURCE_FACT'},
        'condition': {'clause': QUOTES['dashiXuMonth'], 'note': QUOTES['dashiNote'],
                      'met': {'month': month in '辰戌', 'officer執': officer == '執', '六合': '六合' in gods},
                      'class': 'SOURCE_FACT'},
        'effectOnTestedHeadings': 'none: 大時 keeps 忌 only on 安撫邊境/選將訓兵/出師; 「餘皆不忌」, and the note adds '
                                  'that this holds even without 德合赦願',
        'productionAgrees': {h: rt['xuGuimao'][h]['ji'] for h in XH_HEADINGS},
        'conclusion': 'SOURCE_FACT: 大時 does not produce 忌 on 開市, 立券交易, 納財 or 開倉庫出貨財 on 戌-癸卯',
        'stage1Label': 'CONTAMINATED_TARGET (大時 present in the source list) — superseded by the entry clause',
        'aliases': '大敗 = 大時 (卷十 notes 大敗 咸池); 咸池 is its 又為 (忌取魚乘船渡水), not a tested heading',
    }
    assert all(dashi['condition']['met'].values()) and dashi['entry']['listsTestedHeadings']

    # ---- 小耗 replication per heading ----
    own_xh = ['天德', '月德', '天德合', '月德合', '天願']
    trig = [t for t in TRIGGERS if t in gods]
    cells = []
    for h in XH_HEADINGS:
        ji_ops = sorted(g for g in gods if g in lists[h]['ji'])
        neutral = {'大時': 'clause 「辰戌月值執日六合…餘皆不忌」', '大敗': 'alias of 大時',
                   '五虛': 'lifted by its own 六合 「' + QUOTES['wuxuLift'] + '」'}
        others = [g for g in ji_ops if g not in ('小耗',) and g not in neutral]
        yi_ops = sorted(g for g in gods + [officer + '日'] if g in lists[h]['yi'])
        pr = {(True, False): 'only_yi', (False, True): 'only_ji', (True, True): 'both_present'}.get(
            (h in yi_n, h in ji_n), 'not_recorded')
        j = 'J_CLEAN' if not others else 'J_CONTAMINATED'
        cells.append({'heading': h, 'jiOperands': ji_ops,
                      'neutralised': {g: neutral[g] for g in ji_ops if g in neutral}, 'otherJi': others,
                      'triggers': trig, 'ownLifters': [g for g in own_xh if g in gods], 'yiOperands': yi_ops,
                      'printed': pr, 'production': rt['xuGuimao'][h],
                      'j': j, 'jResult': 'J-NARROW' if j == 'J_CLEAN' and pr in ('only_ji', 'both_present') else
                      'J-GENERIC' if j == 'J_CLEAN' else None,
                      'y': ('Y_CLEAN' if yi_ops and j == 'J_CLEAN' else 'Y_NOT_TESTABLE'),
                      'yResult': (('Y-ONLY-JI' if pr == 'only_ji' else 'Y-BOTH' if pr == 'both_present' else 'Y-OTHER')
                                  if yi_ops and j == 'J_CLEAN' else None)})
    assert all(c['jResult'] == 'J-NARROW' for c in cells)
    first = [c for c in j2b['cells'] if c['god'] == '小耗' and c['clean']]
    xh = {'version': 'q4-rest-stage2c-v1', 'witness': page['witness'], 'context': page['context'],
          'triggers': trig, 'ownLifters': [], 'exception': '子午卯酉月值刼煞猶忌 does not apply (戌 month)',
          'cells': cells,
          'firstWitness': {'witness': '06067693-n107', 'context': '巳-戊戌', 'trigger': '四相',
                           'cells': [f"{c['heading']}: {c['classification']}" for c in first]},
          'classification': 'XH-R1',
          'note': 'clean replication supports J-NARROW; same trigger (四相) as the first witness, so 時德/月恩/天赦 remain '
                  'untested for 小耗'}

    # ---- packets ----
    def packet(g, extra_pages):
        cs = [c for c in j2b['cells'] if c['god'] == g and c['clean']]
        ag = j2b['aggregate'][g]
        return {'directWitnesses': sorted({c['witness'] + ' ' + c['context'] for c in cs}) + extra_pages,
                'cleanCells': [f"{c['context']} {c['heading']} ({'+'.join(c['nonOwnTriggers'])}): {c['printed']}"
                               for c in cs],
                'triggersTested': ag['triggersTested'], 'untested': ag['triggersUntested'],
                'ownLiftersExcluded': True, 'counterexamples': 0}
    pk_jk = packet('九空', [])
    pk_jk['triggerNote'] = '時德 only together with 月恩/四相 (午-戊辰); 天德/天赦/天願 untested'
    pk_wx = packet('五虛', ['06067692-n126 卯-丁巳 (Stage 1/2A)'])
    pk_wx['cleanCells'].append('卯-丁巳 開倉庫出貨財 (月恩+四相): only_ji')
    pk_wx['byTrigger'] = {'月恩': ['卯-丁巳', '午-戊申'], '四相': ['卯-丁巳', '午-戊申'], '時德 alone': ['子-丙寅'],
                          '天赦': 'UNTESTED (天赦 never meets 五虛: 四庫 note 「天赦不得與五虛併」)'}
    pk_xh = packet('小耗', [f"{page['witness']} {page['context']}"])
    pk_xh['cleanCells'] += [f"{page['context']} {c['heading']} (四相): {c['printed']}" for c in cells]
    pk_xh['triggerNote'] = 'both witnesses test 四相 only; 時德/月恩/天赦 untested'
    pk_xh['exceptionKeptSeparate'] = '子午卯酉月值刼煞雖與德合併猶忌 (unchanged)'
    pk_f1 = {'directWitnesses': [f"{r['witness']} {r['context']}" for r in f2b['rows']],
             'independentYi': {r['context']: r['independentYi'] for r in f2b['rows']},
             'printed': {r['context']: r['printed'] for r in f2b['rows']},
             'controls': {r['context']: r['yiSourceControl'] for r in f2b['rows']},
             'counterexamples': 0, 'classification': f2b['classification']}
    imp = {k: counts(v) for k, v in rt['impact'].items()}
    for pk, k in ((pk_jk, 'jk'), (pk_wx, 'wx'), (pk_xh, 'xh'), (pk_f1, 'f1y')):
        pk['diagnosticImpact'] = {x: imp[k][x] for x in ('decisionRows', 'headingRows', 'activityRows', 'eventRows')}
    pk_jk['ready'] = pk_wx['ready'] = pk_xh['ready'] = pk_f1['ready'] = True
    packets = {'version': 'q4-rest-stage2c-v1', 'A_九空': pk_jk, 'B_五虛': pk_wx, 'C_小耗': pk_xh, 'D_F1Y': pk_f1}

    drafts = {
        'version': 'q4-rest-stage2c-v1', 'status': 'DRAFT — not active, not implemented',
        'R-JK': {'text': 'For 九空\'s own prohibited headings within puzhu:06 (開市, 立券交易, 納財, 開倉庫出貨財), generic '
                         'puzhu:06 Q4 triggers do not remove 九空\'s 忌 unless an independently established 九空-specific '
                         'lifter applies (月德, 天德合, 月德合). 九空\'s 巳亥/辰戌丑未 deferrals are unchanged.',
                 'scope': '九空 only', 'mechanism': 'liftExclusions.九空 = [天德, 天赦, 天願, 月恩, 四相, 時德]'},
        'R-WX': {'text': 'For 五虛 × 開倉庫出貨財, generic puzhu:06 Q4 triggers do not remove 五虛\'s 忌 unless an '
                         'independently established 五虛-specific lifter applies (天德, 月德, 天德合, 月德合, 六合; 天願 by '
                         'the 四庫 note).',
                 'scope': '五虛 × 開倉庫出貨財 only', 'mechanism': 'liftExclusions.五虛 = [天赦, 月恩, 四相, 時德]'},
        'R-XH': {'text': 'For 小耗\'s own prohibited headings within puzhu:06 (開市, 立券交易, 納財, 開倉庫出貨財), generic '
                         'puzhu:06 Q4 triggers do not remove 小耗\'s 忌 unless an independently established 小耗-specific '
                         'lifter applies (天德, 月德, 天德合, 月德合, 天願). The 子午卯酉月 + 刼煞 猶忌 clause is unchanged.',
                 'scope': '小耗 only', 'mechanism': 'liftExclusions.小耗 = [天赦, 月恩, 四相, 時德]',
                 'evidenceCaveat': 'two pages, both 四相'},
        'R-F1Y': {'text': 'For 五離 × 立券交易, when 五離\'s 忌 survives as the sole surviving 忌 and an independent 宜 '
                          'also applies, the state is only_ji rather than both_present.',
                  'scope': '五離 × 立券交易 Y composition only; not F1 R2 J-axis, 五離 lifters, other 五離 headings or '
                           'global Y',
                  'reach': f"{imp['f1y']['headingRows']} production rows 2025–2027 (all 五離 × 立券交易 both_present, "
                           "including the 17 that never involved puzhu:06), not only the 4 R2 rows",
                  'mechanism': 'composition rule on 立券交易 when the sole surviving 忌 is 五離'},
    }

    scope = {'version': 'q4-rest-stage2c-v1', 'rows': [
        {'debt': 'Q4-REST', 'god': '九空', 'headings': '開市 立券交易 納財 (direct); 開倉庫出貨財 (same-god heading '
         'extrapolation: only joint 九空+五虛 pages exist)', 'evidence': 'J-NARROW', 'directWitnesses': 2,
         'proposed': 'R-JK', 'extrapolation': ['same-god heading (開倉庫出貨財)', 'same-god trigger (天德, 天赦, 天願)']},
        {'debt': 'Q4-REST', 'god': '五虛', 'headings': '開倉庫出貨財 (direct)', 'evidence': 'J-NARROW',
         'directWitnesses': 3, 'proposed': 'R-WX', 'extrapolation': ['same-god trigger (天赦, which never meets 五虛)']},
        {'debt': 'Q4-REST', 'god': '小耗', 'headings': '開市 立券交易 納財 (2 pages); 開倉庫出貨財 (1 page: 戌-癸卯)',
         'evidence': 'J-NARROW', 'directWitnesses': 2, 'proposed': 'R-XH',
         'extrapolation': ['same-god trigger (月恩, 時德, 天赦)']},
        {'debt': 'Q4-REST', 'god': '五墓', 'headings': 'none', 'evidence': 'no discriminating context',
         'directWitnesses': 0, 'proposed': 'none', 'extrapolation': []},
        {'debt': 'F1-Y', 'god': '五離', 'headings': '立券交易 (direct)', 'evidence': 'only_ji ×2 (F1Y-E1)',
         'directWitnesses': 2, 'proposed': 'R-F1Y',
         'extrapolation': ['same-heading context extrapolation to the 19 other 五離 × 立券交易 contexts/dates']},
    ], 'crossGod': 'NOT AUTHORIZED: no ruling reaches another god'}

    # Evidence-category split of each draft's heading rows (heading counts only; triggers from Stage 1 dated rows).
    dated = json.load(open(S1 + 'models.json', encoding='utf-8'))['generic']['dated']
    tested = {'jk': {'月恩', '四相', '時德'}, 'wx': {'月恩', '四相', '時德'}, 'xh': {'四相'}}
    key = lambda x: (x['date'], x['heading'])
    hsets = {k: {key(x) for x in v['heading']} for k, v in rt['impact'].items()}

    def category(k, x):
        if k == 'f1y':
            return 'a_witnessed_context' if x['context'] in ('丑-甲申', '午-戊申') else 'b_other_context'
        if k == 'jk' and x['heading'] == '開倉庫出貨財':
            return 'c_kaicang_joint'
        trig = set((dated[x['date']]['rows'].get(x['heading']) or {}).get('triggers', '').split('+')) - {''}
        return 'a_tested_trigger' if trig & tested[k] else 'b_untested_trigger_only'
    split = {k: dict(collections.Counter(category(k, x) for x in rt['impact'][k]['heading']))
             for k in ('jk', 'wx', 'xh', 'f1y')}
    overlap = {'jk∩wx': sorted({f"{x['context']} {x['heading']}" for x in rt['impact']['wx']['heading']
                                if key(x) in hsets['jk']}),
               'jk∩wxRows': len(hsets['jk'] & hsets['wx']), 'jk∩xh': len(hsets['jk'] & hsets['xh']),
               'wx∩xh': len(hsets['wx'] & hsets['xh']),
               'f1y∩J': len(hsets['f1y'] & (hsets['jk'] | hsets['wx'] | hsets['xh']))}
    wx_dec = collections.Counter(
        'heading_moved' if key(x) in hsets['wx'] else 'tag_only' if x['production'].startswith('keep')
        else 'lift_to_keep_final_unchanged' for x in rt['impact']['wx']['decision'])
    j_both = sum(imp[k]['headingTransitions'].get('only_yi→both_present', 0) for k in ('jk', 'wx', 'xh'))
    diag = {'version': 'q4-rest-stage2c-v1', 'note': 'diagnostic only; each ruling in its own module graph',
            'yInteraction': f'{j_both} rows move only_yi→both_present under R-JK/R-WX/R-XH alone: the J rulings keep 忌, '
                            'and the current Y default then notes both. Every comparable page prints only_ji there; the '
                            'J rulings do not decide Y, and Y-CONVENTION stays a separate debt',
            'perRuling': {k: imp[k] for k in ('jk', 'wx', 'xh', 'f1y')}, 'combined': imp['all'],
            'headingSplit': split, 'overlap': overlap,
            'overlapNote': 'the joint 九空+五虛 開倉庫 rows move under R-JK alone and under R-WX alone (decideP4Puzhu06 '
                           'keeps a row when any class is keep); sum of single rulings 81 vs combined 74',
            'wxDecisionBreakdown': dict(wx_dec),
            'wxDecisionNote': 'tag-only = QL→QL_EXCLUDED on rows another source already keeps; 戌-癸亥 = 劫煞 相抵 '
                              'leaves the final state unchanged',
            'goldensChanged': False}

    for pk, k in ((pk_jk, 'jk'), (pk_wx, 'wx'), (pk_xh, 'xh'), (pk_f1, 'f1y')):
        pk['headingSplit'] = split[k]
    pk_jk['caveat'] = '天德/天赦/天願 untested; 開倉庫 rows are joint with 五虛 and also move under R-WX'
    pk_wx['caveat'] = '天赦 untested (never meets 五虛)'
    pk_xh['caveat'] = '四相 only on both pages'
    pk_f1['caveat'] = 'witnessed contexts 丑-甲申 / 午-戊申; the draft reaches 17 rows on other contexts'

    outdir = sys.argv[1] if len(sys.argv) > 1 else HERE

    def out(name, obj):
        with open(os.path.join(outdir, name), 'w', encoding='utf-8') as f:
            json.dump(obj, f, ensure_ascii=False, indent=1)
            f.write('\n')
    built = {'page.json': page, 'transcription.json': trans, 'dashi-authority.json': dashi,
             'xiaohao-replication.json': xh, 'owner-packets.json': packets, 'scope-matrix.json': scope,
             'diagnostic-impact.json': diag, 'draft-rulings.json': drafts}
    for n, o in built.items():
        out(n, o)
    files = {os.path.join(HERE, n): sha(os.path.join(outdir, n)) for n in built}
    for p_ in [RUNTIME, os.path.join(HERE, 'build_evidence.py'), HARNESS, VOL10, VOL11, AUTH, F1S3, G2S3, PAGE,
               S1 + 'lock.json', S2B + 'lock.json', S2B + 'j-axis.json', S2B + 'f1-y.json', S2B + 'replication-plan.json',
               'shared/lunar/p4OwnerRules.ts', 'shared/lunar/p4Puzhu06.ts',
               'shared/almanac-data/golden-p4b-puzhu06-v4.json']:
        files[p_] = sha(p_)
    out('lock.json', {'version': 'q4-rest-stage2c-v1', 'files': files})


if __name__ == '__main__':
    main()
