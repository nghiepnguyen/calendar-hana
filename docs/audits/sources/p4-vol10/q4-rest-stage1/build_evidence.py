"""Q4-REST Stage 1: witness classification for puzhu:06 Q4 on 九空 / 五虛 / 小耗 / 五墓 (audit only).

Run from the repo root, after the model dump:
  Q4R_DUMP=1 npx vitest run shared/lunar/p4Q4RestStage1Models.test.ts -t dumps
  python3 -I docs/audits/sources/p4-vol10/q4-rest-stage1/build_evidence.py [OUTDIR]
Writes evidence.json, matrix.json, coverage.json, acquisition-plan.json and lock.json next to this script, or into
OUTDIR (the determinism test) with lock keys still naming this directory.

Layers stay separate:
  SOURCE_FACT            卷十 entries, 卷十一 heading lists, page readings (raw glyphs)
  SOURCE_INTERPRETATION  own-lifter sets, canonical heading mapping, CLEAN criteria
  OWNER_RULING           Q4 = yes, Q4a block, F1 R2 (p4b-puzhu06-v4.json ownerDecision)
  PRODUCTION_BEHAVIOR    models.json generic (= shipped v4); narrow is a test-only counterfactual
Predictions come mechanically from the shipped composer plus own-lifter sets read from the 卷十 text; the
exclusion sets were not tuned to any page.
"""
import collections
import hashlib
import json
import os
import re
import sys

HERE = os.path.relpath(os.path.dirname(os.path.abspath(__file__)))
P = 'docs/audits/sources/p4-vol10/'
VOL10 = P + 'vol10.raw.txt'
VOL11 = P + 'yi-sources-v1/vol11.raw.txt'
AUTH = 'shared/almanac-data/p4b-puzhu06-v4.json'
MODELS = os.path.join(HERE, 'models.json')
HARNESS = 'shared/lunar/p4Q4RestStage1Models.test.ts'
F1S2 = P + 'f1-wuli-lijuan-stage2/evidence.json'
F1S3 = P + 'f1-wuli-lijuan-stage3/owner-ruling.json'
G2S3 = P + 'g2-n117-stage3/owner-ruling.json'
# Every prior file that stores a 月表 god-list record (the corpus searched); fixed so later audits cannot drift it.
RECORD_FILES = [P + f for f in (
    'chou-bingyin-yuede-v1/yuede-check.json', 'f1-wuli-lijuan-stage1/evidence.json', 'g2-n117-stage1/evidence.json',
    'h1b-yuebiao-witness-v1/lock.json', 'puzhu17-bujiang-v1/witness.json', 'weishen-nacai-puzhu21-v1/witness.json',
    'xiangdi-cancel-both-v1/witness-lock.json', 'yuebiao-witness-lock-v2.json', 'yuebiao-witness-lock.json')]
GODS = ['九空', '五虛', '小耗', '五墓']
HEADINGS = ['安牀', '開市', '立券交易', '納財', '開倉庫出貨財']
B = '子丑寅卯辰巳午未申酉戌亥'
S = '甲乙丙丁戊己庚辛壬癸'
CYCLE = [S[i % 10] + B[i % 12] for i in range(60)]
OFFICERS = '建除滿平定執破危成收開閉'
OFFICER_GOD = {'建': '月建', '破': '月破', '平': '平日', '收': '收日', '閉': '閉日', '滿': '滿日', '成': '成日',
               '開': '開日', '危': '危日', '定': '定日', '執': '執日', '除': '除日'}
# Glyph variants only (徳/德, 虚/虛, 刼/劫, 劵/券, 床/牀, 醖/醞); the raw text is never rewritten.
VARIANTS = str.maketrans({'徳': '德', '虚': '虛', '刼': '劫', '劵': '券', '床': '牀', '醖': '醞'})
norm = lambda s: s.translate(VARIANTS)

# 卷十 entries (SOURCE_FACT). 忌 headings are the entry's list ∩ puzhu:06 IN_SCOPE headings.
ENTRIES = {
    '九空': '忌進人口修倉庫開市立劵交易納財開倉庫出貨財　　寅申月值滿日子午卯酉月值開日與月德天德合月德合併則不忌己亥月值月厭從月厭論辰戌丑未月值破日從月破論',
    '五虛': '忌修倉庫開倉庫出貨財　　與天德月德天德合月德合六合併則不忌{{SK notes|天赦不得與五虛併天願必是六合故不言而已在其中}}',
    '小耗': '忌修倉庫開市立劵交易納財開倉庫出貨財與天德月德天德合月德合天願併則不忌子午卯酉月值刼煞雖與德合併猶忌',
    '五墓': '忌冠帶行幸遣使安撫邊境選將訓兵出師上官赴任臨政親民結婚姻納采問名嫁娶進人口般移安牀解除求醫療病營建宮室修宮室繕城郭興造動土豎柱上梁開市立劵交易修置産室栽種牧養納畜破土安葬啟攢　　{{SK anchor|五月十一月與月德併則不忌}}　　按五墓乃五行旺干臨於墓庫故所忌如此與月德併則為三合旺氣發於天干而不可以墓論矣故不忌也不取德合者不同行也',
}
# Own lifters (SOURCE_INTERPRETATION of the entries above). nonTrigger = own lifters puzhu:06 does not list.
OWN = {
    '九空': {'triggers': ['月德', '天德合', '月德合'], 'nonTrigger': [],
             'note': 'officer clause 寅申→滿, 子午卯酉→開 is descriptive: 九空 (辰丑戌未 by month) always falls on that '
                     'officer in those months (checked below), so the officer-AND-德 and 德-alone readings coincide'},
    '五虛': {'triggers': ['天德', '月德', '天德合', '月德合', '天願'], 'nonTrigger': ['六合'],
             'note': '天願 by the 四庫 note 「天願必是六合故不言而已在其中」; 天赦 never meets 五虛 (same note)'},
    '小耗': {'triggers': ['天德', '月德', '天德合', '月德合', '天願'], 'nonTrigger': [],
             'note': 'own exception 「子午卯酉月值刼煞雖與德合併猶忌」 (猶忌 survives its own lifters)'},
    '五墓': {'triggers': ['月德'], 'nonTrigger': [],
             'note': '「五月十一月與月德併」: 月德 meets the 五墓 day only in 午/子 months (checked below); Q4a 「不取德合者」 '
                     'excludes 天德合/月德合'},
}
DEFER = {'九空': {'巳': '月厭', '亥': '月厭', '辰': '月破', '戌': '月破', '丑': '月破', '未': '月破'}}
# 九空 / 五墓 day by month (常例) for the descriptive-clause checks.
JIUKONG = dict(zip('寅卯辰巳午未申酉戌亥子丑', '辰丑戌未辰丑戌未辰丑戌未'))
WUMU = {**dict.fromkeys('寅卯', '乙未'), **dict.fromkeys('巳午', '丙戌'), **dict.fromkeys('申酉', '辛丑'),
        **dict.fromkeys('亥子', '壬辰'), **dict.fromkeys('辰戌丑未', '戊辰')}
YUEDE = {**dict.fromkeys('寅午戌', '丙'), **dict.fromkeys('申子辰', '壬'), **dict.fromkeys('亥卯未', '甲'),
         **dict.fromkeys('巳酉丑', '庚')}

# Stage 1 readings of stored scans whose prior records carry no full 宜/忌 line (Claude, 2026-10-26, from the
# stored JPG; image unmodified). Every other page uses the full lines of its prior record.
READINGS = {
    '06067692-n126': ('丁巳沙中土專滿日',
                      '祭祀祈福求嗣會親友結婚姻納采問名解除裁衣豎柱上梁經絡開市立券交易納財牧養',
                      '上冊受封上表章出行上官赴任臨政親民嫁娶進人口移徙剃頭求醫療病築隄防修造動土修倉庫開倉庫出貨財修置產室開渠穿井安碓磑補垣修飾垣牆平治道塗破屋壞垣捕捉畋獵取魚乘船渡水栽種破土安葬啟攢'),
    '06067692-n58': ('丙辰沙中土寶滿日',
                     '祭祀祈福求嗣上冊受封上表章襲爵受封會親友出行上官赴任臨政親民結婚姻納采問名嫁娶進人口移徙解除求醫療病裁衣修造動土豎柱上梁修倉庫經絡開市立券交易納財開倉庫出貨財牧養納畜安葬',
                     '鼓鑄補垣塞穴畋獵取魚乘船渡水栽種'),
    '06067692-n59': ('丁巳沙中土專平日', '祭祀平治道塗', '祈福求嗣出行解除剃頭整手足甲求醫療病畋獵取魚'),
    '06067694-n73': ('甲子海中金義執日',
                     '祭祀祈福求嗣上冊受封上表章襲爵受封會親友出行上官赴任臨政親民結婚姻納采問名嫁娶解除沐浴剃頭整手足甲裁衣修造動土豎柱上梁修倉庫捕捉牧養納畜安葬',
                     '移徙遠迴求醫療病鼓鑄開倉庫出貨財補垣塞穴畋獵取魚乘船渡水栽種'),
    '06067696-n111': ('壬寅金箔金寶平日',
                      '上冊受封上表章襲爵受封會親友出行上官赴任臨政親民結婚姻納采問名嫁娶進人口移徙裁衣修造動土豎柱上梁修倉庫經絡醞釀開市立券交易納財開倉庫出貨財修飾垣牆平治道塗栽種牧養納畜',
                      '祭祀祈福求嗣解除求醫療病開渠'),
    '06067694-n28': ('丙戌屋上土寶定日',
                     '祭祀祈福求嗣上冊受封上表章襲爵受封會親友冠帶出行上官赴任臨政親民結婚姻納采問名嫁娶進人口移徙解除裁衣修造動土豎柱上梁修倉庫經絡醞釀立券交易納財安碓磑栽種牧養納畜安葬',
                     '求醫療病畋獵取魚'),
    '06067695-n29': ('丁亥屋上土伐平日',
                     '祭祀上冊受封上表章襲爵受封會親友出行上官赴任臨政親民結婚姻納采問名移徙沐浴裁衣豎柱上梁牧養納畜',
                     '祈福求嗣嫁娶解除剃頭求醫療病築隄防修造動土修倉庫修置產室開渠穿井安碓磑補垣修飾垣牆平治道塗破屋壞垣畋獵取魚栽種破土'),
    '06067697-n34': ('壬辰長流水伐定日',
                     '祭祀祈福求嗣上冊受封上表章襲爵受封會親友冠帶出行上官赴任臨政親民結婚姻納采問名嫁娶進人口移徙解除裁衣修造動土豎柱上梁修倉庫經絡醞釀立券交易納財安碓磑栽種牧養納畜安葬',
                     '求醫療病開渠畋獵取魚'),
}
# Prior record gives a summary only (g2-n117-stage1): no 忌 printed (puzhu:28 day rule), 宜 summarized.
SUMMARY_ONLY = {'06067693-n105': 'no 忌 printed; 宜 summary names 開市立券交易納財開倉庫出貨財; 安牀 not stated'}


def sha(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def split_gods(v):
    return list(v) if isinstance(v, list) else [g for g in re.split(r'[\s|｜]+', v) if g]


def vol11_lists():
    lines = open(VOL11, encoding='utf-8').read().split('\n')
    out = {}
    for h in HEADINGS:
        raw = '立劵交易' if h == '立券交易' else h
        i = next(n for n, l in enumerate(lines) if '{{SK anchor|%s}}' % raw in l)
        out[h] = {'yi': lines[i + 1].strip('　 ')[1:], 'ji': lines[i + 2].strip('　 ')[1:]}
    return out


def operands(text, gods):
    """Gods named in a 卷十一 list, longest name first so 天德合 is not also read as 天德."""
    t, hit = norm(text), []
    for g in sorted(set(gods), key=len, reverse=True):
        if g in t:
            hit.append(g)
            t = t.replace(g, '')
    return sorted(hit)


def collect_pages():
    recs = collections.defaultdict(list)
    for f in RECORD_FILES:
        d = json.load(open(f, encoding='utf-8'))

        def walk(x):
            if isinstance(x, dict):
                for a, b in (('jiShen', 'xiongShen'), ('ji_shen', 'xiong_shen')):
                    if a in x and b in x and x.get('path'):
                        if isinstance(x.get('authentication'), dict) and 'pillar' in x['authentication']:
                            au = x['authentication']  # F1 Stage 1 shape: header facts live under authentication
                            x = {**x, 'pillar': au['pillar'], 'officer': au['officer'], 'month': au['monthFromContent'][0]}
                        recs[os.path.basename(x['path'])[:-4]].append((f, x, split_gods(x[a]) + split_gods(x[b])))
                for v in x.values():
                    walk(v)
            elif isinstance(x, list):
                for v in x:
                    walk(v)
        walk(d)
    return recs


def printed_state(yi, ji, h):
    if yi is None and ji is None:
        return 'ambiguous'
    on_yi, on_ji = (yi is not None and h in yi), (ji is not None and h in ji)
    if yi is None and not on_ji:
        return 'ambiguous'
    return {(True, False): 'only_yi', (False, True): 'only_ji', (True, True): 'both_present'}.get((on_yi, on_ji), 'not_recorded')


def main():
    raw = open(VOL10, encoding='utf-8').read()
    for e in ENTRIES.values():
        for part in filter(None, e.split('　')):
            assert part in raw, part[:12]
    auth = json.load(open(AUTH, encoding='utf-8'))
    triggers = auth['triggers']
    in_scope = [h['p4'] for h in auth['headings'] if h['scope'] == 'IN_SCOPE']
    assert in_scope == ['安牀', '開市', '立券交易', '納財', '開倉庫出貨財']
    for g in GODS:
        assert auth['liftLists'][g]['quote'] in ENTRIES[g] or auth['liftLists'][g]['quote'] in raw
        assert all(t in norm(ENTRIES[g]) for t in OWN[g]['triggers'] if not (g == '五虛' and t == '天願'))
    # Descriptive clauses: 九空 on 滿 (寅申) / 開 (子午卯酉); 月德 meets 五墓 only in 午/子.
    for m in '寅申':
        assert OFFICERS[(B.index(JIUKONG[m]) - B.index(m)) % 12] == '滿'
    for m in '子午卯酉':
        assert OFFICERS[(B.index(JIUKONG[m]) - B.index(m)) % 12] == '開'
    assert sorted(m for m in B if WUMU[m][0] == YUEDE[m]) == ['午', '子']
    lists = vol11_lists()
    god_headings = {g: [h for h in HEADINGS if norm(h) in norm(ENTRIES[g].split('　')[0])] for g in GODS}
    assert god_headings == {'九空': ['開市', '立券交易', '納財', '開倉庫出貨財'], '五虛': ['開倉庫出貨財'],
                            '小耗': ['開市', '立券交易', '納財', '開倉庫出貨財'], '五墓': ['安牀', '開市', '立券交易']}
    for g, hs in god_headings.items():  # the 卷十一 忌 lists agree with the 卷十 entries
        assert all(norm(g) in norm(lists[h]['ji']) for h in hs), g

    models = json.load(open(MODELS, encoding='utf-8'))
    assert models['authority'] == 'p4b-puzhu06-v4'
    assert models['own'] == {g: OWN[g]['triggers'] for g in GODS}
    gen, nar = models['generic']['contexts'], models['narrow']['contexts']

    # ---- inventory ----
    recs = collect_pages()
    pages, cands = {}, []
    for pid, rs in sorted(recs.items()):
        gods = sorted({norm(g) for _, _, gs in rs for g in gs})
        ctx = next(f"{x.get('monthJian') or x.get('month')}-{x['pillar']}" if x.get('pillar') else x.get('context')
                   for _, x, _ in rs if (x.get('monthJian') or x.get('month')) and x.get('pillar') or x.get('context'))
        month, pillar = ctx.split('-')
        officer = next(x['officer'] for _, x, _ in rs if x.get('officer'))
        path = rs[0][1]['path']
        hashes = {x['sha256'] for _, x, _ in rs if x.get('sha256')}
        pages[pid] = {'context': ctx, 'gods': gods, 'officer': officer, 'path': path, 'hashes': hashes,
                      'records': rs}
        if any(g in gods for g in GODS) and any(t in gods for t in triggers):
            cands.append(pid)
    assert len(cands) == 27, len(cands)

    # leaf calibration per (item, month block) from every stored page: leaf = cycle index + offset
    offsets = collections.defaultdict(set)
    for pid, p in pages.items():
        item, leaf = pid.split('-')
        m, pil = p['context'].split('-')
        offsets[(item, m)].add(int(leaf[1:]) - CYCLE.index(pil))
    month_item = {}
    for (item, m), v in offsets.items():
        month_item.setdefault(m, set()).add(item)

    candidates, cells = [], []
    for pid in cands:
        p = pages[pid]
        month, pillar = p['context'].split('-')
        path = p['path']
        file_sha = sha(path)
        month_from_officer = B[(B.index(pillar[1]) - OFFICERS.index(p['officer'])) % 12]
        authenticated = p['hashes'] == {file_sha} and month_from_officer == month
        day_ops = p['gods'] + [OFFICER_GOD[p['officer']]] + (['甲日'] if pillar[0] == '甲' else []) + \
            (['申日'] if pillar[1] == '申' else [])
        if pid in READINGS:
            header, yi, ji = READINGS[pid]
            assert header.startswith(pillar) and header.endswith(p['officer'] + '日')
            tsrc = 'STAGE1_READING'
        elif pid in SUMMARY_ONLY:
            header, yi, ji = None, '開市立券交易納財開倉庫出貨財', ''
            tsrc = 'PRIOR_SUMMARY'
        else:
            full = [x for _, x, _ in p['records'] if 'yiLine' in x]
            assert full, pid
            header, yi, ji = None, full[0]['yiLine'], full[0]['jiLine']
            tsrc = 'PRIOR_RECORD:' + next(f for f, x, _ in p['records'] if 'yiLine' in x)
        yi_n, ji_n = norm(yi), norm(ji)
        trig = [t for t in triggers if t in p['gods']]
        candidates.append({
            'witness': pid, 'context': p['context'], 'month': month, 'pillar': pillar, 'officer': p['officer'],
            'edition': '欽定協紀辨方書 四庫全書本 月表 (archive.org %s.cn)' % pid.split('-')[0],
            'path': path, 'sha256': file_sha, 'priorRecords': sorted({f for f, _, _ in p['records']}),
            'authentication': {'hashMatchesPriorRecords': p['hashes'] == {file_sha},
                               'monthFromOfficer': month_from_officer,
                               'header': header,
                               'status': 'AUTHENTICATED' if authenticated else 'UNAUTHENTICATED'},
            'gods': p['gods'], 'activeGods': [g for g in GODS if g in p['gods']], 'q4Triggers': trig,
            'transcription': tsrc, 'yiRaw': yi, 'jiRaw': ji, 'yiNormalized': yi_n, 'jiNormalized': ji_n,
        })
        for g in [g for g in GODS if g in p['gods']]:
            own = [t for t in OWN[g]['triggers'] + OWN[g]['nonTrigger'] if t in p['gods']]
            non_own = [t for t in trig if t not in OWN[g]['triggers']]
            for h in god_headings[g]:
                ji_ops = operands(lists[h]['ji'], day_ops)
                yi_ops = operands(lists[h]['yi'], day_ops)
                a, b = gen[p['context']].get(h), nar[p['context']].get(h)
                ga = (a or {}).get('action', 'untouched')
                pa = lambda r: None if r is None else r['final']
                model_sources = sorted({s for r in (a, b) if r for s in r['sources'] if s != 'remaining:' + g})
                other_ji = sorted(set(o for o in ji_ops if o != g) |
                                  {norm(s.split(':')[1]) for s in model_sources if s.startswith(('subject', 'youwei'))})
                pr = printed_state(yi_n if tsrc != 'PRIOR_SUMMARY' or h != '安牀' else None, ji_n, h) \
                    if tsrc != 'PRIOR_SUMMARY' else ('only_yi' if h in yi_n else 'ambiguous')
                gen_state = pa(a) or 'untouched'
                nar_state = pa(b) or 'untouched'
                if month in DEFER.get(g, {}):
                    status, reason = 'NOT_Q4', f'{g} defers to {DEFER[g][month]} in {month} months (remainingDefer)'
                elif own:
                    status, reason = 'NON_DISCRIMINATING', f'own lifter present ({"+".join(own)}): both models lift'
                elif (a, b) == (None, None) or (a and b and (a['action'], a['final']) == (b['action'], b['final'])):
                    status = 'NON_DISCRIMINATING'
                    reason = f'puzhu:06 {ga}: models agree' + ('' if a else ' (row not touched: protected, day rule or 忌 already absent)')
                elif other_ji:
                    status, reason = 'CONTAMINATED', f'other 忌 operand(s) on the heading: {"+".join(other_ji)}'
                elif not authenticated:
                    status, reason = 'UNAUTHENTICATED', 'page hash or month check fails'
                elif pr == 'ambiguous':
                    status, reason = 'AMBIGUOUS', 'printed state not recoverable from the transcription'
                else:
                    status, reason = 'CLEAN', 'target god active, non-own trigger only, sole 忌 operand, authenticated'
                ji_of = lambda s: s in ('only_ji', 'both_present')
                if status == 'CLEAN':
                    cls = 'A' if pr == gen_state else 'B' if pr == nar_state else 'C'
                    ji_axis = 'A' if ji_of(pr) == ji_of(gen_state) != ji_of(nar_state) else \
                        'B' if ji_of(pr) == ji_of(nar_state) != ji_of(gen_state) else 'NONE'
                else:
                    cls, ji_axis = None, None
                if status == 'CONTAMINATED' and gen_state != nar_state:
                    support = 'CONTAMINATED_BUT_SUPPORTIVE' if ji_of(pr) and not ji_of(gen_state) else 'CONTAMINATED'
                else:
                    support = None
                cells.append({
                    'god': g, 'heading': h, 'witness': pid, 'context': p['context'],
                    'q4Triggers': trig, 'nonOwnTriggers': non_own, 'ownLifters': own,
                    'otherYi': [o for o in yi_ops], 'otherJi': other_ji, 'modelSources': model_sources,
                    'printed': pr, 'predictGeneric': gen_state, 'predictNarrow': nar_state,
                    'genericClasses': (a or {}).get('classes', ''), 'narrowClasses': (b or {}).get('classes', ''),
                    'status': status, 'reason': reason, 'clean': status == 'CLEAN', 'decisive': status == 'CLEAN',
                    'classification': cls, 'jiAxis': ji_axis, 'contaminatedNote': support,
                    'provenance': 'DIRECT_SOURCE_WITNESS' if status == 'CLEAN' else 'NON_DECISIVE_WITNESS',
                })

    # ---- per god × heading and per god ----
    def cell_class(rows):
        cl = [r['classification'] for r in rows if r['clean']]
        if not cl:
            return 'D'
        if 'C' in cl or ('A' in cl and 'B' in cl):
            return 'C'
        return cl[0] + ('2' if len(cl) > 1 else '1')

    matrix = {}
    for g in GODS:
        matrix[g] = {}
        for h in god_headings[g]:
            rows = [c for c in cells if c['god'] == g and c['heading'] == h]
            disc = sorted(c for c, v in gen.items() if v.get(h) and 'remaining:' + g in v[h]['sources']
                          and (v[h]['action'], v[h]['final']) != (nar[c][h]['action'], nar[c][h]['final']))
            matrix[g][h] = {'classification': cell_class(rows),
                            'witnesses': {s: sorted(r['witness'] for r in rows if r['status'] == s)
                                          for s in sorted({r['status'] for r in rows})},
                            'decisive': sorted(r['witness'] for r in rows if r['clean']),
                            'discriminatingContexts720': disc}

    def aggregate(g):
        cls = [v['classification'][0] for v in matrix[g].values()]
        if 'C' in cls:
            return 'UNRESOLVED_CONFLICT'
        has = set(cls) - {'D'}
        if not has:
            return 'INSUFFICIENT_EVIDENCE'
        if has == {'A'}:
            return 'SUPPORTS_Q4_GENERIC' if 'D' not in cls else 'INSUFFICIENT_EVIDENCE'
        if has == {'B'}:
            return 'SUPPORTS_GOD_NARROW' if 'D' not in cls else 'INSUFFICIENT_EVIDENCE'
        return 'MIXED_BY_HEADING'
    aggregates = {g: aggregate(g) for g in GODS}

    # ---- QL coverage over 2025–2027 (production = generic model) ----
    ql = collections.defaultdict(list)
    distinct = 0
    for date, v in sorted(models['generic']['dated'].items()):
        for h, r in v['rows'].items():
            if r['action'] == 'lift':
                distinct += 1
                for s in r['sources']:
                    if s.startswith('remaining:'):
                        ql[(s[10:], h)].append({'date': date, 'context': v['context'], 'triggers': r['triggers']})
    assert distinct == 56
    cand_ctx = collections.defaultdict(set)
    for c in candidates:
        for g in c['activeGods']:
            cand_ctx[g].add(c['context'])
    clean_ctx = {(c['god'], c['heading']): set() for c in cells}
    for c in cells:
        if c['clean']:
            clean_ctx[(c['god'], c['heading'])].add(c['context'])
    coverage = {'qlLiftRowsDistinct': distinct, 'byGod': {}, 'byGodHeading': {}}
    for g in GODS:
        rows = [r for (gg, h), L in ql.items() if gg == g for r in L]
        wc = sum(r['context'] in cand_ctx[g] for r in rows)
        cc = sum(r['context'] in clean_ctx.get((g, h), set()) for (gg, h), L in ql.items() if gg == g for r in L)
        coverage['byGod'][g] = {'qlRows': len(rows), 'headings': sorted({h for (gg, h) in ql if gg == g}),
                                'witnessCovered': wc, 'cleanCovered': cc, 'uncovered': len(rows) - cc}
        for h in god_headings[g]:
            L = ql.get((g, h), [])
            coverage['byGodHeading'][f'{g}×{h}'] = {
                'qlRows': len(L), 'contexts': dict(collections.Counter(r['context'] for r in L)),
                'witnessCovered': sum(r['context'] in cand_ctx[g] for r in L),
                'cleanCovered': sum(r['context'] in clean_ctx.get((g, h), set()) for r in L)}
    coverage['sharedRows'] = sum(1 for date, v in models['generic']['dated'].items() for r in v['rows'].values()
                                 if r['action'] == 'lift' and sum(s.startswith('remaining:') for s in r['sources']) > 1)
    coverage['godAttributions'] = sum(v['qlRows'] for v in coverage['byGod'].values())
    coverage['stage2Figure'] = {'value': 56, 'how': 'hard-coded 68 - 12 in f1-wuli-lijuan-stage2/build_evidence.py',
                                'recomputed': distinct,
                                'reconciliation': 'reproduced as distinct lift rows of Golden v4 2025–2027; per-god '
                                                  'attributions sum higher because some rows carry 九空 and 五虛 together'}

    # ---- acquisition plan: discriminating contexts without a clean witness ----
    targets = []
    for g in GODS:
        for h in god_headings[g]:
            witnessed = {r['context'] for r in cells if r['god'] == g and r['heading'] == h and r['clean']}
            for c in [c for c in matrix[g][h]['discriminatingContexts720'] if c not in witnessed]:
                m, pil = c.split('-')
                r = gen[c][h]
                others = [s for s in r['sources'] if s != 'remaining:' + g]
                items = sorted(month_item.get(m, []))
                off = offsets.get((items[0], m)) if len(items) == 1 else None
                loc = (f'{items[0]}-n{CYCLE.index(pil) + next(iter(off))}' if off and len(off) == 1 else None)
                targets.append({
                    'god': g, 'heading': h, 'context': c, 'month': m, 'pillar': pil,
                    'requiredTrigger': r['triggers'], 'mustExcludeOwnLifters': OWN[g]['triggers'] + OWN[g]['nonTrigger'],
                    'competing': others,
                    'usable': 'CLEAN_TARGET' if not others else 'JOINT_ONLY' if all(s.startswith('remaining:') for s in others) else 'CONTAMINATED_TARGET',
                    'predictGeneric': r['final'], 'predictNarrow': nar[c][h]['final'],
                    'preferredSource': '月表 (欽定協紀辨方書 四庫全書本), archive.org item ' + (items[0] if items else 'UNKNOWN'),
                    'predictedLocator': {'value': loc, 'status': 'HYPOTHESIS', 'basis': f'leaf - cycle index offsets {sorted(off) if off else None} for item/month block'},
                    'why': f'generic predicts {r["final"]}, narrow {nar[c][h]["final"]}: the 忌 line decides',
                })

    # ---- authority table ----
    authority = {}
    for g in GODS:
        authority[g] = {
            'entry': ENTRIES[g], 'jiHeadingsInPuzhu06Scope': god_headings[g],
            'ownLifters': OWN[g], 'genericTriggersOutsideOwn': [t for t in triggers if t not in OWN[g]['triggers']],
            'defer': DEFER.get(g), 'liftExclusionsV4': auth['liftExclusions'].get(g, {}).get('triggers', []),
            'currentProduction': 'QL: lift on any trigger not in liftExclusionsV4 (Q4 yes' +
                                 (', Q4a block 天德合/月德合' if g == '五墓' else '') + ')',
            'classes': {'entry': 'SOURCE_FACT', 'ownLifters': 'SOURCE_INTERPRETATION', 'Q4': 'OWNER_RULING (2026-10-16)',
                        'Q4a': 'OWNER_RULING (2026-10-16) on SOURCE_FACT 「不取德合者不同行也」' if g == '五墓' else None,
                        'liftLists': 'IMPLEMENTATION (p4b-puzhu06-v4.json liftLists)'},
        }
    q4a = {
        'says': '五墓 「不取德合者不同行也」: 五墓\'s own lift needs 月德 itself; 德合 does not stand in',
        'why': 'without it, puzhu:06\'s 天德合/月德合 triggers would lift 五墓 on days its own entry refuses',
        'headings': god_headings['五墓'], 'excludedTriggers': auth['liftExclusions']['五墓']['triggers'],
        'class': 'OWNER_RULING (Q4a = block, 2026-10-16) applying a SOURCE_FACT clause',
        'f1Validates': False,
        'witnesses': '06067693-n95 巳-丙戌 (天德合): both models keep; consistent with Q4a, non-discriminating',
        'observableQ4Difference': 'none: over 720 contexts generic and narrow agree on every 五墓 row (non-德合 triggers '
                                  'only meet 五墓 alongside a keep-class source)',
    }

    f1 = json.load(open(F1S3, encoding='utf-8'))
    evidence = {
        'version': 'q4-rest-stage1-v1',
        'question': 'for 九空/五虛/小耗/五墓: does a generic puzhu:06 trigger lift the god\'s 忌 (Q4-GENERIC), or only the '
                    'god\'s own lifters (GOD-NARROW)?',
        'base': {'main': '7a38f090bb27d878adba164efcafdb1f6ef731ed', 'authority': auth['version']},
        'authority': authority, 'q4a': q4a,
        'cleanCriteria': ['target god active (on the page, no own lifter, not deferred)',
                          'a generic puzhu:06 trigger present', 'no own lifter of that god present (incl. non-trigger 六合 '
                          'for 五虛)', 'no other 忌 operand on the heading (卷十一 list ∩ page operands, plus graded/又為 '
                          'sources the composer reports)', 'heading not made uninterpretable (day rule, protected row)',
                          'page authenticated (stored hash = prior record hash, month from officer = month block)',
                          'heading maps canonically (劵/券 and glyph variants only)', 'the two models predict different '
                          'final states for the context-heading'],
        'independentYi': 'kept, not contamination: recorded per cell as otherYi',
        'models': {'generic': 'production v4 composer (resolveP4Puzhu06Day)',
                   'narrow': 'same composer, liftExclusions[god] = puzhu:06 triggers outside the god\'s own lifters',
                   'dump': MODELS, 'harness': HARNESS,
                   'antiFitting': 'predictions come mechanically from the shipped composer plus own-lifter sets read '
                                  'from the 卷十 text; the exclusion sets were not tuned to any page. models.json was '
                                  'dumped before the printed states were encoded, but n126 had already been read',
                   'byConstruction': 'outside 九空 defer months, no puzhu:06 row carries a god together with one of its '
                                     'own lifters (P4-C applied the own list first): every QL row discriminates'},
        'inventory': {'recordFiles': RECORD_FILES, 'storedPagesWithGodLists': len(pages), 'candidates': len(cands),
                      'stage2Count': 27, 'reconciled': 'same 27 pages; a first pass missed 4 whose prior records store '
                      'god lists as one space-separated string (n105, n117, 06067694-n93, 06067697-n75)'},
        'candidates': candidates,
        'aggregates': aggregates,
        'globalQ4Rest': 'NOT_RULED',
        'findings': {
            'n126': '卯-丁巳 五虛 × 開倉庫出貨財 is the only clean witness. Printed only_ji. Generic predicts only_yi (wrong on '
                    '宜 and 忌); narrow predicts both_present (right on 忌, wrong on 宜). No model reproduces the page: '
                    'classification C. On the 忌 axis alone the page supports GOD-NARROW.',
            'yiAxis': '開倉庫出貨財 宜 operands 月恩+四相+滿日 are present and the 宜 line omits the heading: with 五虛\'s 忌 '
                      'surviving, the page reads 從忌不從宜, not both_present. F1 R2 rule 3 (owner) states the opposite '
                      'for 五離 × 立券交易 (independent 宜 + surviving 忌 = both_present), which governs the 4 extrapolated '
                      'rows. Different god and heading, so no contradiction is established; open debt, not resolved here.',
            'stage2Testable': 'Stage 2 named 丑-戊寅, 丑-壬寅 and 戌-癸亥 as testable for 五虛: wrong. 劫煞 (and 天賊 on 丑 pages) '
                              'is a second 開倉庫出貨財 忌 operand on all of them; 丑-寅 rows are not even touched by puzhu:06',
            'wumu': 'no observable Q4 difference for 五墓 anywhere in 720 contexts',
            'jiukongXiaohaoKaicang': '九空 × 開倉庫出貨財 discriminating contexts all carry 五虛 too (joint only); 小耗 × '
                                     '開倉庫出貨財 has only 戌-癸卯 with 大時 (contaminated)',
        },
        'f1': {'ruling': f1['decision'], 'rule3': f1['rule'][2], 'scope': '五離 × 立券交易 only; not extended here',
               'extrapolatedRows': 'SEMANTIC_CONSEQUENCE; not used as Q4-REST evidence'},
        'g2W1': json.load(open(G2S3, encoding='utf-8'))['w1'],
        'productionChanged': False,
    }
    outdir = sys.argv[1] if len(sys.argv) > 1 else HERE

    def out(name, obj):
        with open(os.path.join(outdir, name), 'w', encoding='utf-8') as f:
            json.dump(obj, f, ensure_ascii=False, indent=1)
            f.write('\n')
    out('evidence.json', evidence)
    out('matrix.json', {'version': 'q4-rest-stage1-v1', 'cells': cells, 'godHeading': matrix, 'aggregates': aggregates})
    out('coverage.json', coverage)
    out('acquisition-plan.json', {'version': 'q4-rest-stage1-v1', 'status': 'HYPOTHESIS until authenticated',
                                  'targets': targets})
    built = ('evidence.json', 'matrix.json', 'coverage.json', 'acquisition-plan.json')
    files = {os.path.join(HERE, n): sha(os.path.join(outdir, n)) for n in built}
    for p in [os.path.join(HERE, 'models.json'), os.path.join(HERE, 'build_evidence.py'), HARNESS, VOL10, VOL11, AUTH,
              F1S2, F1S3, G2S3, 'shared/lunar/p4Puzhu06.ts', 'shared/almanac-data/golden-p4b-puzhu06-v4.json'] + \
            RECORD_FILES + sorted({c['path'] for c in candidates}):
        files[p] = sha(p)
    out('lock.json', {'version': 'q4-rest-stage1-v1', 'files': files})


if __name__ == '__main__':
    main()
