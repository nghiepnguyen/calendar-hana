"""Q4-REST Stage 2B: targeted acquisition of the six primary 月表 witnesses (audit only).

Run from the repo root, after the runtime dump:
  Q4R2B_DUMP=1 npx vitest run shared/lunar/p4Q4RestStage2BRuntime.test.ts
  python3 -I docs/audits/sources/p4-vol10/q4-rest-stage2b/build_evidence.py [OUTDIR]
Writes pages.json, transcriptions.json, operands.json, j-axis.json, y-axis.json, f1-y.json, classification.json,
replication-plan.json and lock.json. Stage 1 / 2A / 2A.1 files are read, never written.

Layers: page readings (SOURCE_FACT, read by Claude from the stored scans at full resolution, single reviewer);
卷十一 heading lists (SOURCE_FACT); predictions from Stage 1 models.json (generic = v4, narrow = own lifters only);
production rows from runtime.json (PRODUCTION_BEHAVIOR, never evidence).
"""
import collections
import hashlib
import json
import os
import sys

HERE = os.path.relpath(os.path.dirname(os.path.abspath(__file__)))
P = 'docs/audits/sources/p4-vol10/'
S1, S2A, S2A1 = P + 'q4-rest-stage1/', P + 'q4-rest-stage2a/', P + 'q4-rest-stage2a1/'
VOL11 = P + 'yi-sources-v1/vol11.raw.txt'
RUNTIME = os.path.join(HERE, 'runtime.json')
HARNESS = 'shared/lunar/p4Q4RestStage2BRuntime.test.ts'
REMAINING_ART = 'shared/almanac-data/p4-vol10-remaining-ji-v7.json'
AUTH = 'shared/almanac-data/p4b-puzhu06-v4.json'
F1S3, G2S3 = P + 'f1-wuli-lijuan-stage3/owner-ruling.json', P + 'g2-n117-stage3/owner-ruling.json'
B = '子丑寅卯辰巳午未申酉戌亥'
S = '甲乙丙丁戊己庚辛壬癸'
CYCLE = [S[i % 10] + B[i % 12] for i in range(60)]
OFFICERS = '建除滿平定執破危成收開閉'
OFFICER_GOD = {o: o + '日' for o in OFFICERS}
VARIANTS = str.maketrans({'劵': '券', '床': '牀', '牀': '牀', '醖': '醞', '壞': '壊', '墻': '牆', '徳': '德'})
norm = lambda s: s.translate(VARIANTS)
TRIGGERS = ['天德', '月德', '天德合', '月德合', '天赦', '天願', '月恩', '四相', '時德']
OWN = json.load(open(S1 + 'models.json', encoding='utf-8'))['own']
OWN = {**OWN, '五離': ['天德', '月德', '天德合', '月德合', '天赦']}
GOD_HEADINGS = {'九空': ['開市', '立券交易', '納財', '開倉庫出貨財'], '五虛': ['開倉庫出貨財'],
                '小耗': ['開市', '立券交易', '納財', '開倉庫出貨財'], '五墓': ['安牀', '開市', '立券交易'],
                '五離': ['立券交易']}
# Headings printed under their P4 name (Stage 2A SAFE); 宴會 prints as 會親友 and is not compared.
SAFE = ['乘船渡水', '修倉庫', '入學', '嫁娶', '安牀', '安葬', '栽種', '求嗣', '求醫療病', '牧養', '破屋壊垣', '祈福',
        '祭祀', '立券交易', '納畜', '納財', '開倉庫出貨財', '納采問名', '結婚姻', '豎柱上梁', '開市', '掃舍宇']

# Readings of the six scans (2026-10-26, curl --fail of the w1200 page image, image unmodified), whole page then
# full-resolution crops; column breaks ｜. The predicted locators (Stage 2A.1) were confirmed by the headers.
PAGES = {
    '06067694-n50': dict(target='午-戊申', priority='P0', header='戊申大驛土寶滿日', foliation='[UNCERTAIN: 二十五]',
                         ji_shen=['月恩', '四相', '相日', '驛馬', '天后', '天巫', '福德', '不將', '除神', '青龍'],
                         xiong_shen=['五虛', '五離'],
                         yi='祭祀祈福求嗣上冊受封上表章襲爵受封｜出行上官赴任臨政親民嫁娶進人口移徙｜解除沐浴剃頭整手足甲求醫療病裁衣修｜造動土豎柱上梁經絡開市納財補垣塞穴｜掃舍宇栽種牧養',
                         ji='會親友結婚姻納采問名安牀修倉庫立券｜交易開倉庫出貨財'),
    '06067697-n8': dict(target='子-丙寅', priority='P0', header='丙寅鑪中火義滿日', foliation='四',
                        ji_shen=['月空', '天恩', '時德', '相日', '驛馬', '天后', '天馬', '天巫', '福德', '福生', '五合', '鳴吠對'],
                        xiong_shen=['五虛', '歸忌', '白虎'],
                        yi='上冊受封上表章會親友出行進人口解除｜裁衣修造動土豎柱上梁經絡開市立券交｜易納財補垣塞穴栽種牧養破土啟攢',
                        ji='祭祀襲爵受封上官赴任臨政親民結婚姻｜納采問名移徙遠迴求醫療病修倉庫開倉｜庫出貨財'),
    '06067693-n107': dict(target='巳-戊戌', priority='P0', header='戊戌平地木專執日', foliation='[UNCERTAIN: 三十]',
                          ji_shen=['四相', '不將', '玉宇', '解神', '金匱'], xiong_shen=['小耗', '天賊'],
                          yi='祭祀祈福求嗣上表章襲爵受封會親友上｜官赴任臨政親民結婚姻納采問名嫁娶移｜徙解除沐浴剃頭整手足甲求醫療病裁衣｜修造動土豎柱上梁捕捉栽種牧養',
                          ji='出行修倉庫開市立券交易納財開倉庫出｜貨財'),
    '06067692-n86': dict(target='卯-丁丑', priority='P1', header='丁丑澗下水寶開日', foliation='[NOT VISIBLE] (margin 卷二十一)',
                         ji_shen=['月恩', '四相', '時陽', '生氣', '天倉', '不將', '敬安'],
                         xiong_shen=['五虛', '八風', '九空', '九坎', '九焦', '勾陳'],
                         yi='祭祀祈福求嗣上冊受封上表章襲爵受封｜會親友入學出行上官赴任臨政親民結婚｜姻納采問名嫁娶移徙解除求醫療病裁衣｜修造動土豎柱上梁修置產室開渠穿井安｜碓磑牧養納畜',
                         ji='冠帶進人口剃頭修倉庫鼓鑄開市立券交｜易納財開倉庫出貨財補垣塞穴伐木畋獵｜取魚乘船渡水栽種'),
    '06067697-n93': dict(target='丑-甲申', priority='P1', header='甲申井泉水伐危日', foliation='十三',
                         ji_shen=['月空', '母倉', '四相', '陽德', '五富', '生生', '除神', '司命', '鳴吠'],
                         xiong_shen=['遊禍', '五離'],
                         yi='祭祀上表章襲爵受封出行上官赴任臨政｜親民移徙沐浴剃頭整手足甲裁衣修造動｜土豎柱上梁修倉庫經絡醞釀開市納財掃｜舍宇伐木畋獵栽種牧養納畜破土安葬',
                         ji='祈福求嗣會親友結婚姻納采問名安牀解｜除求醫療病立券交易開倉庫出貨財'),
    '06067694-n10': dict(target='午-戊辰', priority='P1', header='戊辰大林木專開日', foliation='五',
                         ji_shen=['天恩', '月恩', '四相', '時德', '時陽', '生氣', '要安'], xiong_shen=['五虛', '九空', '天牢'],
                         yi='祭祀祈福求嗣上冊受封上表章襲爵受封｜會親友入學出行上官赴任臨政親民結婚｜姻納采問名移徙解除求醫療病裁衣修造｜動土豎柱上梁修置產室開渠穿井安碓磑｜栽種牧養',
                         ji='進人口修倉庫開市立券交易納財開倉庫｜出貨財伐木畋獵取魚'),
}


def sha(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def vol11():
    lines = open(VOL11, encoding='utf-8').read().split('\n')
    out = {}
    for h in SAFE + ['開市']:
        raw = {'立券交易': '立劵交易', '破屋壊垣': '破屋壞垣'}.get(h, h)
        idx = [n for n, l in enumerate(lines) if '{{SK anchor|%s}}' % raw in l]
        if idx:
            nxt = []
            for l in lines[idx[0] + 1:idx[0] + 4]:  # stop at the next heading anchor (乘船渡水 has no 宜 line)
                if 'SK anchor' in l:
                    break
                nxt.append(l.strip('　 '))
            pick = lambda c: next((norm(l[1:]) for l in nxt if l.startswith(c)), '')
            out[h] = {'yi': pick('宜'), 'ji': pick('忌')}
    return out


def replication_ji(rt):
    return [rt['contexts']['戌-癸卯'][h]['ji'] for h in ('開市', '立券交易', '納財', '開倉庫出貨財')]


def printed(yi, ji, h):
    a, b = h in yi, h in ji
    return {(True, False): 'only_yi', (False, True): 'only_ji', (True, True): 'both_present'}.get((a, b), 'not_recorded')


def main():
    rt = json.load(open(RUNTIME, encoding='utf-8'))
    assert rt['authority'] == 'p4b-puzhu06-v4'
    models = json.load(open(S1 + 'models.json', encoding='utf-8'))
    plan3 = json.load(open(S2A1 + 'acquisition-plan-v3.json', encoding='utf-8'))
    remaining = {e['han'] for e in json.load(open(REMAINING_ART, encoding='utf-8'))['entries']}
    lists = vol11()
    primary = {x['context']: x for x in plan3['pages'] if x['priority'] in ('P0', 'P1')}
    assert sorted(primary) == sorted(p['target'] for p in PAGES.values())

    pages, trans = [], {}
    for pid, p in PAGES.items():
        month, pillar = p['target'].split('-')
        officer = p['header'][-2]
        month_from_officer = B[(B.index(pillar[1]) - OFFICERS.index(officer)) % 12]
        item, leaf = pid.split('-')
        loc = primary[p['target']]['predictedLocator']['value']
        path = os.path.join(HERE, 'pages', pid + '.jpg')
        auth = {'headerPillar': p['header'][:2], 'officer': officer, 'monthFromOfficer': month_from_officer,
                'predictedLocator': loc, 'locatorConfirmed': loc == pid,
                'leafCalibration': f'leaf {leaf[1:]} = cycle {CYCLE.index(pillar)} + {int(leaf[1:]) - CYCLE.index(pillar)}',
                'foliation': p['foliation']}
        ok = p['header'].startswith(pillar) and month_from_officer == month and loc == pid
        auth['status'] = 'AUTHENTICATED' if ok else 'UNAUTHENTICATED'
        pages.append({'witness': pid, 'context': p['target'], 'priority': p['priority'],
                      'archive': f'{item}.cn', 'locator': f'https://archive.org/download/{item}.cn/page/{leaf}_w1200.jpg',
                      'path': path, 'sha256': sha(path), 'retrieval': 'curl --fail, 2026-10-26; image unmodified',
                      'authentication': auth})
        yi_n, ji_n = norm(p['yi'].replace('｜', '')), norm(p['ji'].replace('｜', ''))
        trans[pid] = {'header': p['header'], 'jiShen': p['ji_shen'], 'xiongShen': p['xiong_shen'],
                      'yiRaw': p['yi'], 'jiRaw': p['ji'], 'yiNormalized': yi_n, 'jiNormalized': ji_n,
                      'sha256': {k: hashlib.sha256(v.encode()).hexdigest() for k, v in
                                 (('yiRaw', p['yi']), ('jiRaw', p['ji']))},
                      'uncertain': [p['foliation']] if 'UNCERTAIN' in p['foliation'] else []}
    assert all(x['authentication']['status'] == 'AUTHENTICATED' for x in pages)

    # ---- operands, J and Y per heading ----
    operands, jcells, ycells = {}, [], []
    for pid, p in PAGES.items():
        ctx = p['target']
        month, pillar = ctx.split('-')
        gods = p['ji_shen'] + p['xiong_shen']
        day_ops = gods + [OFFICER_GOD[p['header'][-2]]] + ([f'百忌{pillar[0]}', f'百忌{pillar[1]}'])
        t = trans[pid]
        prod = rt['contexts'][ctx]
        gen, nar = models['generic']['contexts'][ctx], models['narrow']['contexts'][ctx]
        trig = [g for g in TRIGGERS if g in gods]
        ops = {}
        for h in SAFE:
            pr = printed(t['yiNormalized'], t['jiNormalized'], h)
            r = prod.get(h, {'state': 'not_listed', 'ji': [], 'prot': [], 'puzhu06': '', 'yiGods': []})
            ji_list = lists.get(h, {}).get('ji', '')
            yi_list = lists.get(h, {}).get('yi', '')
            ji_ops = sorted({g for g in gods if g in ji_list} | set(r['ji']))
            yi_ops = sorted({g for g in day_ops if g in yi_list and not g.startswith('百忌')} | set(r['yiGods']))
            ops[h] = {'printed': pr, 'jiOperands': ji_ops, 'yiOperands': yi_ops, 'production': r['state'],
                      'productionJi': r['ji'], 'prot': r['prot'], 'puzhu06': r['puzhu06'],
                      'triggers': trig}
        operands[pid] = {'context': ctx, 'triggers': trig, 'headings': ops,
                         'other': {'puzhu21_22': 'no 相抵 on these headings (no neither_recorded state)',
                                   'baiji': [x for x in day_ops if x.startswith('百忌')],
                                   'graded': 'no graded subject among the 忌 sources of the tested headings'}}
        # J: target god × its puzhu:06 headings
        for g in [g for g in GOD_HEADINGS if g in gods]:
            own = [x for x in OWN[g] if x in gods]
            non_own = [x for x in trig if x not in OWN[g]]
            for h in GOD_HEADINGS[g]:
                o = ops[h]
                others = [x for x in o['jiOperands'] if x != g]
                a, b = gen.get(h), nar.get(h)
                if g == '五離':
                    cls, why = 'J-R2-CONSISTENT', 'F1 R2 already closed: 五離 kept (keep:QL_EXCLUDED)'
                elif own or not non_own:
                    cls, why = 'NON_DISCRIMINATING', 'own lifter present or no non-own trigger'
                elif not a or not b or (a['action'], a['final']) == (b['action'], b['final']):
                    cls, why = 'NON_DISCRIMINATING', 'models agree'
                elif others:
                    cls, why = 'CONTAMINATED', f'other 忌 operand(s): {"+".join(others)}'
                else:
                    ji_printed = o['printed'] in ('only_ji', 'both_present')
                    cls = 'J-NARROW' if ji_printed else 'J-GENERIC'
                    why = f'generic predicts {a["final"]} (lift), narrow {b["final"]}; printed {o["printed"]}'
                jcells.append({'witness': pid, 'context': ctx, 'god': g, 'heading': h, 'nonOwnTriggers': non_own,
                               'ownLifters': own, 'otherJi': others, 'printed': o['printed'],
                               'predictGeneric': a['final'] if a else None, 'predictNarrow': b['final'] if b else None,
                               'classification': cls, 'clean': cls in ('J-NARROW', 'J-GENERIC'), 'reason': why})
        # Y: every compared heading where a 忌 is printed and an independent 宜 operand is present
        for h, o in ops.items():
            # 修倉庫 宜 is conditional (owner rule D, P5): a name match is not a 宜 operand; left out of Y.
            if h == '修倉庫' or not o['jiOperands'] or not o['yiOperands']:
                continue
            ungraded = [x for x in o['productionJi'] if x in remaining]
            baiji = [x for x in o['productionJi'] if x.startswith('百忌')]
            if not ungraded and not baiji:
                continue
            off = [x for x in o['yiOperands'] if x.endswith('日') and x[0] in OFFICERS]
            ycls = 'officer' if off and len(off) == len(o['yiOperands']) else 'mixed' if off else 'jishen'
            fam = ('ENGINE_UNDETERMINED' if o['production'] == 'undetermined' else
                   'BAIJI_ONLY (not ungraded)' if not ungraded else
                   'U7' if o['prot'] else 'U4' if len(o['productionJi']) > 1 else
                   'U5' if o['puzhu06'].startswith('keep') else
                   {'officer': 'U2', 'jishen': 'U3', 'mixed': 'U1'}[ycls])
            surviving = o['printed'] in ('only_ji', 'both_present')
            verdict = ('Y-NOT-TESTABLE' if not surviving else
                       {'only_ji': 'Y-ONLY-JI', 'both_present': 'Y-BOTH'}[o['printed']])
            j_lift = o['puzhu06'].startswith('lift')
            ycells.append({'witness': pid, 'context': ctx, 'heading': h, 'jiSources': o['productionJi'],
                           'ungraded': ungraded, 'prot': o['prot'], 'yiOperands': o['yiOperands'], 'family': fam,
                           'production': o['production'], 'printed': o['printed'], 'verdict': verdict,
                           'viaQ4Survival': j_lift,
                           'note': 'production lifts by Q4; the page keeps 忌, so Y is read on the surviving 忌'
                                   if j_lift else ''})

    # ---- aggregates ----
    def j_agg(g):
        clean = [c for c in jcells if c['god'] == g and c['clean']]
        if not clean:
            return 'J-D'
        k = {c['classification'] for c in clean}
        return 'J-C' if len(k) > 1 else 'J-B' if k == {'J-NARROW'} else 'J-A'
    s1 = json.load(open(S1 + 'matrix.json', encoding='utf-8'))
    prior = {'五虛': ['06067692-n126 (卯-丁巳, 月恩+四相; Stage 1/2A: J-NARROW)']}
    jaxis = {}
    for g in ['九空', '五虛', '小耗', '五墓']:
        clean = [c for c in jcells if c['god'] == g and c['clean']]
        pages_g = sorted({c['witness'] for c in clean}) + prior.get(g, [])
        jaxis[g] = {'classification': j_agg(g) if g != '五墓' else 'J-D (no discriminating context exists)',
                    'cleanCells': [f"{c['witness']} {c['heading']}" for c in clean],
                    'witnessPages': pages_g, 'pageCount': len(pages_g),
                    'triggersTested': sorted({t for c in clean for t in c['nonOwnTriggers']}),
                    'triggersUntested': sorted(set(t for t in TRIGGERS if t not in OWN[g]) -
                                               {t for c in clean for t in c['nonOwnTriggers']})}
    jaxis['五虛']['triggersTested'] = sorted(set(jaxis['五虛']['triggersTested']) | {'月恩', '四相'})
    f1_rows = []
    for pid in ('06067694-n50', '06067697-n93'):
        o = operands[pid]['headings']['立券交易']
        others = [x for x in o['jiOperands'] if x != '五離']
        f1_rows.append({'context': PAGES[pid]['target'], 'witness': pid, 'wuliActive': '五離' in o['jiOperands'],
                        'wuliOwnLifters': [x for x in OWN['五離'] if x in PAGES[pid]['ji_shen']],
                        'independentYi': o['yiOperands'], 'otherJi': others, 'printed': o['printed'],
                        'production': o['production'], 'clean': not others and bool(o['yiOperands'])})
    for r in f1_rows:  # control: where the same 宜 source prints, and where it disappears
        pid = r['witness']
        t, ops_p = trans[pid], operands[pid]['headings']
        r['yiSourceControl'] = {h: {'printed': ops_p[h]['printed'], 'otherJi': ops_p[h]['jiOperands']}
                                for h in ('開市', '立券交易', '納財', '開倉庫出貨財')
                                if any(y in lists.get(h, {}).get('yi', '') for y in r['independentYi'])}
    clean_f1 = [r for r in f1_rows if r['clean']]
    f1y = {'version': 'q4-rest-stage2b-v1', 'rows': f1_rows,
           'classification': ('F1Y-E1' if len(clean_f1) == 2 and all(r['printed'] == 'only_ji' for r in clean_f1) else
                              'F1Y-E2' if len(clean_f1) == 1 and clean_f1[0]['printed'] == 'only_ji' else
                              'F1Y-E3' if clean_f1 and all(r['printed'] == 'both_present' for r in clean_f1) else
                              'F1Y-E4' if clean_f1 else 'F1Y-E5'),
           'productionStillBothPresent': all(r['production'] == 'both_present' for r in f1_rows),
           'f1Rule3': json.load(open(F1S3, encoding='utf-8'))['rule'][2],
           'migration': 'NOT PERFORMED (owner gate)'}
    assert f1y['classification'] == 'F1Y-E1'
    yfam = collections.defaultdict(lambda: collections.Counter())
    for c in ycells:
        yfam[c['family']][c['verdict']] += 1
    yaxis = {'version': 'q4-rest-stage2b-v1', 'cells': ycells,
             'byFamily': {k: dict(v) for k, v in sorted(yfam.items())},
             'newOnlyJi': sum(c['verdict'] == 'Y-ONLY-JI' for c in ycells),
             'newOnlyJiUngraded': sum(c['verdict'] == 'Y-ONLY-JI' and c['family'][0] == 'U' for c in ycells),
             'newOnlyJiSoleFamilies': sum(c['verdict'] == 'Y-ONLY-JI' and c['family'] in ('U1', 'U2', 'U3', 'U5')
                                          for c in ycells),
             'newOnlyJiBaiji': sum(c['verdict'] == 'Y-ONLY-JI' and c['family'].startswith('BAIJI') for c in ycells),
             'engineUndetermined': [f"{c['context']} {c['heading']}" for c in ycells if c['family'] == 'ENGINE_UNDETERMINED'],
             'baijiFinding': 'BAIJI-Y: production gives both_present where a 百忌 heading meets an independent 宜; the '
                             'pages print only_ji (子-丙寅 祭祀; 丑-甲申 安牀, 開倉庫出貨財). puzhu:07–10 withhold 宜 even '
                             'from the companion heading. Separate debt; population not measured',
             'newBothPresent': sum(c['verdict'] == 'Y-BOTH' for c in ycells),
             'counterexamples': sum(c['verdict'] in ('Y-BOTH', 'Y-ONLY-YI') for c in ycells),
             'quarantine': 'U4/U7 cells are source examples only; no extrapolation to the 767 U7 / 7 U4 rows',
             'scope': 'no global Y rule; evidence reported per family',
             'excluded': '修倉庫 (conditional 宜, rule D); 宴會 (printed as 會親友); headings printed under other words'}

    replication = {
        'version': 'q4-rest-stage2b-v1', 'needed': True,
        'reasons': ['小耗 has one clean J page (巳-戊戌, 四相)'],
        'minimum': [{'context': '戌-癸卯', 'god': '小耗', 'trigger': '四相',
                     'headings': ['開市', '立券交易', '納財', '開倉庫出貨財'],
                     'locator': {'value': '06067696-n45', 'status': 'HYPOTHESIS'},
                     'productionJi': {h: rt['contexts']['戌-癸卯'][h]['ji'] for h in
                                      ('開市', '立券交易', '納財', '開倉庫出貨財')},
                     'condition': 'clean only if the grade model holds: a graded subject (大時) is present but holds no '
                                  '忌 on these headings (production trace.ji = [小耗]); Stage 1 labelled it '
                                  'CONTAMINATED only because 大時 appears in the source list. Weaker than the six pages'}],
        'optional': [{'context': '午-壬辰', 'why': '九空 under 時德 alone (午-戊辰 carries 時德 with 月恩/四相)',
                      'locator': {'value': '06067694-n34', 'status': 'HYPOTHESIS'}}],
        'f1y': 'not needed: two clean direct witnesses agree',
        'conflicts': 'none',
    }
    gates = {'九空': 'READY_FOR_OWNER_RULING', '五虛': 'READY_FOR_OWNER_RULING',
             '小耗': 'NEEDS_REPLICATION (戌-癸卯, conditional)',
             'F1-Y': 'READY_FOR_OWNER_RULING', 'Y-CONVENTION': 'EVIDENCE_EXPANDED'}
    for g in ('九空', '五虛'):
        assert jaxis[g]['classification'] == 'J-B' and jaxis[g]['pageCount'] >= 2
    assert jaxis['小耗']['classification'] == 'J-B' and jaxis['小耗']['pageCount'] == 1
    assert yaxis['counterexamples'] == 0
    assert all(v == ['小耗'] for v in replication_ji(rt))
    classification = {'version': 'q4-rest-stage2b-v1', 'jAxis': jaxis, 'f1y': f1y['classification'],
                      'yAxis': yaxis['byFamily'], 'gates': gates, 'productionChanged': False,
                      'g2W1': json.load(open(G2S3, encoding='utf-8'))['w1'],
                      'stage1Clean': [c['witness'] for c in s1['cells'] if c['clean']]}

    outdir = sys.argv[1] if len(sys.argv) > 1 else HERE

    def out(name, obj):
        with open(os.path.join(outdir, name), 'w', encoding='utf-8') as f:
            json.dump(obj, f, ensure_ascii=False, indent=1)
            f.write('\n')
    built = {'pages.json': {'version': 'q4-rest-stage2b-v1', 'pages': pages},
             'transcriptions.json': {'version': 'q4-rest-stage2b-v1', 'pages': trans},
             'operands.json': {'version': 'q4-rest-stage2b-v1', 'pages': operands},
             'j-axis.json': {'version': 'q4-rest-stage2b-v1', 'cells': jcells, 'aggregate': jaxis},
             'y-axis.json': yaxis, 'f1-y.json': f1y, 'classification.json': classification,
             'replication-plan.json': replication}
    for n, o in built.items():
        out(n, o)
    files = {os.path.join(HERE, n): sha(os.path.join(outdir, n)) for n in built}
    for p_ in [RUNTIME, os.path.join(HERE, 'build_evidence.py'), HARNESS, VOL11, REMAINING_ART, AUTH, F1S3, G2S3,
               S1 + 'models.json', S1 + 'lock.json', S2A + 'lock.json', S2A1 + 'lock.json',
               S2A1 + 'acquisition-plan-v3.json', 'shared/lunar/p4OwnerRules.ts', 'shared/lunar/p4Puzhu06.ts',
               'shared/almanac-data/golden-p4b-puzhu06-v4.json'] + [x['path'] for x in pages]:
        files[p_] = sha(p_)
    out('lock.json', {'version': 'q4-rest-stage2b-v1', 'files': files})


if __name__ == '__main__':
    main()
