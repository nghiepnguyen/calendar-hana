"""Q4-REST Stage 2A: independent review of 06067692-n126, puzhu:06 grammar, corpus pattern search and the
acquisition-plan successor (audit only).

Run from the repo root, after the pattern dump:
  Q4R2A_DUMP=1 npx vitest run shared/lunar/p4Q4RestStage2AModels.test.ts -t dumps
  python3 -I docs/audits/sources/p4-vol10/q4-rest-stage2a/build_review.py [OUTDIR]
Writes n126-review.json, grammar-analysis.json, corpus-pattern-search.json, acquisition-review.json,
acquisition-plan-v2.json and lock.json (keys always name this directory). Stage 1 files are read, never written.
"""
import collections
import hashlib
import json
import os
import sys

HERE = os.path.relpath(os.path.dirname(os.path.abspath(__file__)))
P = 'docs/audits/sources/p4-vol10/'
S1 = P + 'q4-rest-stage1/'
VOL10 = P + 'vol10.raw.txt'
VOL11 = P + 'yi-sources-v1/vol11.raw.txt'
AUTH = 'shared/almanac-data/p4b-puzhu06-v4.json'
INPUT = os.path.join(HERE, 'pattern-input.json')
HARNESS = 'shared/lunar/p4Q4RestStage2AModels.test.ts'
F1S3 = P + 'f1-wuli-lijuan-stage3/owner-ruling.json'
G2S3 = P + 'g2-n117-stage3/owner-ruling.json'
N126 = P + 'yuebiao/06067692-n126.jpg'
N126_SHA = 'df862750b772adf9c08ae7fe248a38b310a9ffd3b3ddc1f0a16686b3b6da6a1e'
VARIANTS = str.maketrans({'徳': '德', '虚': '虛', '刼': '劫', '劵': '券', '床': '牀', '醖': '醞', '壊': '壞', '墻': '牆',
                          '徃': '往'})
norm = lambda s: s.translate(VARIANTS)

# Stage 2A reading of the stored scan at full resolution, five crops (sips, scratch only, not stored):
# margin/header x1750–2250 y250–3150; 神 block x300–1800 y330–1090; 宜/忌 x450–2100 y1080–2850 in two bands.
# Column breaks ｜. Read from the crops, not from the Stage 1 text.
FRESH = {
    'header': '丁巳沙中土專滿日',
    'margin': '卷二十一',
    'foliation': '[NOT VISIBLE: no leaf number printed in the stored margin]',
    'jiShen': ['月恩', '四相', '相日', '驛馬', '天后', '天巫', '福德', '聖心'],
    'xiongShen': ['五虛', '八風', '土符', '大煞', '往[UNCERTAIN: 亡 printed with a 日-like form]', '重日', '朱雀'],
    'yiRaw': '宜祭祀祈福求嗣會親友結婚姻納采問名解｜除裁衣豎柱上梁經絡開市立券交易納財｜牧養',
    'jiRaw': '忌上冊受封上表章出行上官赴任臨政親民｜嫁娶進人口移徙剃頭求醫療病築隄防修｜造動土修倉庫開倉庫出貨財修置產室開｜'
             '渠穿井安碓磑補垣修飾垣牆平治道塗破｜屋壞垣捕捉畋獵取魚乘船渡水栽種破土｜安葬啟攢',
    'target': {'heading': '開倉庫出貨財', 'yi': 'absent: 宜 column 2 ends 開市立券交易納財, column 3 is 牧養 alone',
               'ji': 'present, unbroken in 忌 column 3: 修倉庫｜開倉庫出貨財｜修置產室 (no line break inside the heading)',
               'variants': 'none: no 出貨財/開倉庫 split, abbreviation or absorption; 修倉庫 is a separate heading before it',
               'scan': 'all six glyphs clear at full resolution'},
}
# Stage 2A readings of the five not-yet-searchable pages whose context has a qualifying row (full stored scan,
# read directly; header, 宜, 忌). The other 14 unsearchable pages have no qualifying row and were not read.
READ_2A = {
    '06067692-n10': ('戊辰大林木專滿日', '祭祀祈福上冊受封上表章會親友裁衣經絡',
                     '襲爵受封上官赴任臨政親民結婚姻納采問名嫁娶進人口求醫療病修倉庫鼓鑄開市立券交易納財開倉庫出貨財補垣塞穴取魚乘船渡水栽種'),
    '06067692-n46': ('甲辰覆燈火制滿日', '祭祀祈福上冊受封上表章會親友裁衣經絡',
                     '襲爵受封上官赴任臨政親民結婚姻納采問名嫁娶進人口求醫療病修倉庫鼓鑄開市立券交易納財開倉庫出貨財補垣塞穴取魚乘船渡水栽種破土安葬啟攢'),
    '06067692-n90': ('辛巳白鑞金伐滿日', '祭祀祈福會親友裁衣經絡開市立券交易納財',
                     '上冊受封上表章襲爵受封出行上官赴任臨政親民結婚姻納采問名嫁娶進人口移徙求醫療病築隄防修造動土修倉庫醞釀開倉庫出貨財修置產室開渠穿井安碓磑補垣修飾垣牆平治道塗破屋壞垣捕捉畋獵取魚栽種破土安葬啟攢'),
    '06067692-n114': ('乙巳覆燈火寶滿日', '祭祀祈福會親友裁衣經絡開市立券交易納財',
                      '上冊受封上表章襲爵受封出行上官赴任臨政親民結婚姻納采問名嫁娶進人口移徙求醫療病築隄防修造動土修倉庫開倉庫出貨財修置產室開渠穿井安碓磑補垣修飾垣牆平治道塗破屋壞垣捕捉畋獵取魚栽種破土安葬啟攢'),
    '06067695-n52': ('庚戌釵釧金義滿日', '上冊受封上表章會親友裁衣補垣塞穴栽種牧養納畜',
                     '祭祀襲爵受封上官赴任臨政親民結婚姻納采問名嫁娶進人口求醫療病修倉庫經絡開市立券交易納財開倉庫出貨財取魚乘船渡水破土安葬啟攢'),
}
# 卷十 rules that withhold a heading's 宜 for an ungraded god (beyond graded 「凡所忌者則不註宜」, excluded by the
# filter): 重日/復日 「…與天德月德天德合月德合天赦六合併則不忌亦不註宜」 on its 忌 headings 破土安葬啟攢.
EXPLAINED = [{'gods': ['復日', '重日'], 'with': ['天德', '月德', '天德合', '月德合', '天赦', '六合', '天願'],
              'headings': ['安葬'], 'rule': '重日/復日 「…併則不忌亦不註宜」 (卷十 offset ~19150)'}]
# Stage 1 called the suibao-zhuzhen scans "other volumes"; they are 月表 day leaves (headers read in Stage 2A).
SUIBAO = {'06067693-n115': ('丙午天河水專除日', '巳-丙午'), '06067693-n127': ('戊午天上火義除日', '巳-戊午'),
          '06067694-n115': ('丙午天河水專閉日', '未-丙午'), '06067694-n127': ('戊午天上火義閉日', '未-戊午'),
          '06067696-n97': ('戊子霹靂火制除日', '亥-戊子'), '06067696-n121': ('壬子桑柘木專除日', '亥-壬子'),
          '06067697-n97': ('戊子霹靂火制閉日', '丑-戊子'), '06067697-n121': ('壬子桑柘木專閉日', '丑-壬子')}
STAGE1_JI = ('上冊受封上表章出行上官赴任臨政親民嫁娶進人口移徙剃頭求醫療病築隄防修造動土修倉庫開倉庫出貨財修置產室開渠穿井安碓磑'
             '補垣修飾垣牆平治道塗破屋壞垣捕捉畋獵取魚乘船渡水栽種破土安葬啟攢')
STAGE1_YI = '祭祀祈福求嗣會親友結婚姻納采問名解除裁衣豎柱上梁經絡開市立券交易納財牧養'

# Headings whose P4 name is printed as-is on the 月表 lines (others, e.g. 興造動土 / 般移 / 整容剃頭, are printed
# under different words and are left out rather than aliased).
SAFE = ['乘船渡水', '修倉庫', '入學', '嫁娶', '安牀', '安葬', '栽種', '求嗣', '求醫療病', '牧養', '破屋壞垣', '祈福',
        '祭祀', '立券交易', '納畜', '納財', '開倉庫出貨財', '納采問名', '結婚姻', '豎柱上梁', '開市', '掃舍宇']
RECORD_FILES = json.load(open(S1 + 'evidence.json', encoding='utf-8'))['inventory']['recordFiles']

QUOTES = {
    'puzhu06': '凡徳合赦願月恩四相時徳等日不註忌進人口安牀經絡醖釀開市立劵交易納財開倉庫出貨財如遇徳猶忌及從忌不從宜之日則仍註忌',
    'oldPractice': '舊本凡吉神遇凶煞皆從忌而不從宜',
    'reform': '除建破等日條例簡易及專忌之日無庸分别外餘分為六等',
    'gradeZhong': '中等吉不抵凶遇德則吉勝從宜不從忌不遇從忌不從宜',
    'tableAnchor': '{{SK anchor|宜忌等第表}}',
    'puzhu05': '凡吉凶相抵不註宜亦不註忌者如遇徳猶忌之事則仍註忌',
    'puzhu04': '凡吉足勝凶從宜不從忌者如遇徳猶忌之事則仍註忌',
    'wuxu': '忌修倉庫開倉庫出貨財',
    'yueen': '納財開倉庫出貨財栽種牧養',
    'mandi': '宜進人口裁製修倉庫經絡開市立劵交易納財開倉庫出貨財補垣塞穴',
}


def sha(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def split_gods(v):
    import re
    return list(v) if isinstance(v, list) else [g for g in re.split(r'[\s|｜]+', v) if g]


def pages():
    """Every stored page with full printed 宜 and 忌 lines (prior record or a Stage 1/2A reading)."""
    s1 = json.load(open(S1 + 'evidence.json', encoding='utf-8'))
    readings = {c['witness']: (c['yiRaw'], c['jiRaw']) for c in s1['candidates'] if c['transcription'] == 'STAGE1_READING'}
    readings['06067692-n126'] = (FRESH['yiRaw'][1:], FRESH['jiRaw'][1:])
    readings.update({k: (v[1], v[2]) for k, v in READ_2A.items()})
    out, seen = {}, collections.defaultdict(list)
    for f in RECORD_FILES:
        def walk(x):
            if isinstance(x, dict):
                for a, b in (('jiShen', 'xiongShen'), ('ji_shen', 'xiong_shen')):
                    if a in x and b in x and x.get('path'):
                        seen[os.path.basename(x['path'])[:-4]].append((f, x))
                for v in x.values():
                    walk(v)
            elif isinstance(x, list):
                for v in x:
                    walk(v)
        walk(json.load(open(f, encoding='utf-8')))
    for pid, rs in sorted(seen.items()):
        ctx = None
        for _, x in rs:
            au = x.get('authentication') if isinstance(x.get('authentication'), dict) else {}
            m = x.get('monthJian') or x.get('month') or (au.get('monthFromContent') or ' ')[0].strip()
            p = x.get('pillar') or au.get('pillar')
            ctx = ctx or (f'{m}-{p}' if m and p else x.get('context'))
        if pid in readings:
            yi, ji, src = readings[pid][0], readings[pid][1], 'READING'
        else:
            jiof = lambda x: x.get('jiLine') or x.get('jiRaw') or ''.join(x.get('jiLineColumns') or []) or None
            full = [(f, x) for f, x in rs if (x.get('yiLine') or x.get('yiRaw')) and jiof(x) is not None]
            if not full:
                out[pid] = {'context': ctx, 'searchable': False, 'why': 'no full 宜/忌 line on record'}
                continue
            f, x = full[0]
            yi, ji, src = x.get('yiLine') or x.get('yiRaw'), jiof(x), f
            ji = ji[1:] if ji.startswith('忌') else ji
        gods = sorted({norm(g) for _, x in rs for k in ('jiShen', 'xiongShen', 'ji_shen', 'xiong_shen') if k in x
                       for g in split_gods(x[k])})
        out[pid] = {'context': ctx, 'searchable': True, 'source': src if pid not in READ_2A else 'STAGE2A_READING',
                    'gods': gods,
                    'yi': norm(yi).replace('｜', ''), 'ji': norm(ji).replace('｜', '')}
    return out


def printed(pg, h):
    on_yi, on_ji = h in pg['yi'], h in pg['ji']
    return {(True, False): 'only_yi', (False, True): 'only_ji', (True, True): 'both_present'}.get((on_yi, on_ji), 'not_recorded')


def main():
    raw = open(VOL10, encoding='utf-8').read()
    for k, q in QUOTES.items():
        assert q in raw, k
    assert sha(N126) == N126_SHA
    s1 = json.load(open(S1 + 'evidence.json', encoding='utf-8'))
    s1m = json.load(open(S1 + 'matrix.json', encoding='utf-8'))
    s1plan = json.load(open(S1 + 'acquisition-plan.json', encoding='utf-8'))
    inp = json.load(open(INPUT, encoding='utf-8'))['contexts']
    lists11 = open(VOL11, encoding='utf-8').read()

    # ---- 1–4: n126 ----
    fresh_yi, fresh_ji = norm(FRESH['yiRaw'][1:].replace('｜', '')), norm(FRESH['jiRaw'][1:].replace('｜', ''))
    month_from_officer = '子丑寅卯辰巳午未申酉戌亥'['子丑寅卯辰巳午未申酉戌亥'.index('巳') - '建除滿平定執破危成收開閉'.index('滿')]
    cross = {  # 卯 month identities of the printed 神 (month-only gods computed, not read)
        '月恩': '二月 (卯) 月恩 丁 → 丁巳 ✓', '四相': 'spring 四相 丙丁 → 丁 ✓', '相日': 'spring 相日 巳 ✓',
        '驛馬': '亥卯未 months 驛馬 巳 ✓', '五虛': 'spring 五虛 巳酉丑 days ✓', '天巫/福德': 'listed with 滿日 (卷十 滿日 又為) ✓',
        '往亡': '二月 往亡 巳 ✓ (print glyph uncertain, identity from the cycle)'}
    p = inp['卯-丁巳']['開倉庫出貨財']
    n126 = {
        'witness': '06067692-n126', 'locator': 'https://archive.org/download/06067692.cn/page/n126_w1200.jpg',
        'edition': '欽定協紀辨方書 四庫全書本, 月表 卷二十一 (archive.org 06067692.cn)', 'path': N126, 'sha256': sha(N126),
        'fresh': FRESH, 'normalized': {'yi': fresh_yi, 'ji': fresh_ji},
        'authentication': {'header': FRESH['header'], 'volume': FRESH['margin'], 'foliation': FRESH['foliation'],
                           'officer': '滿', 'monthFromOfficer': month_from_officer, 'godCrossChecks': cross,
                           'leafCalibration': 'item 06067692 卯 block: leaf = cycle index + 73 (丁巳 = 53 → n126)',
                           'status': 'AUTHENTICATED' if month_from_officer == '卯' else 'FAILED'},
        'stage1Agreement': {'yi': fresh_yi == STAGE1_YI, 'ji': fresh_ji == norm(STAGE1_JI)},
        'targetPrinted': 'only_ji',
        'operands': {
            '五虛': {'role': '忌', 'source': QUOTES['wuxu'], 'ownLifterPresent': False},
            '月恩': {'role': '宜 + puzhu:06 trigger', 'source': '卷十 月恩/四相/時德 宜 list (…' + QUOTES['yueen'] + ')'},
            '四相': {'role': '宜 + puzhu:06 trigger', 'source': 'same entry'},
            '滿日': {'role': '宜', 'source': QUOTES['mandi'],
                     'ownJi': '滿日 忌 does not list the heading; 卯月 滿日 on 相日 with 月恩/四相 is itself 不忌'},
            'otherYi': p['yiGods'], 'otherJi': [], 'remainingKept': p['remaining'], 'gradedSubjects': p['subjects'],
            'otherXiong': {'八風': '忌取魚乘船渡水', '土符': '忌…修倉庫…(no 開倉庫)', '大煞': '忌安撫邊境選將訓兵出師',
                           '往亡': '忌…(no 開倉庫)', '重日': '忌破土安葬啟攢', '朱雀': 'follows co-present gods'},
            'puzhuLinesNamingHeading': ['puzhu:06 (trigger lift)', 'puzhu:22 (相抵 開市+立券 → 開倉庫 不註忌; no 相抵 here)',
                                        '百忌日 甲日 (day is 丁)'],
            'yiSuppressionLines': 'none of puzhu:07–10 or the 不註宜 lines names 開倉庫出貨財',
        },
    }
    assert n126['stage1Agreement'] == {'yi': True, 'ji': True}
    assert printed({'yi': fresh_yi, 'ji': fresh_ji}, '開倉庫出貨財') == 'only_ji'
    assert p['subjects'] == [] and p['youwei'] == [] and p['remaining'] == ['五虛']

    # ---- 5–6: grammar ----
    grammar = {
        'puzhu06': {'quote': QUOTES['puzhu06'], 'offset': raw.find(QUOTES['puzhu06']),
                    'clauses': [
                        {'text': '凡徳合赦願月恩四相時徳等日', 'role': 'condition: trigger days'},
                        {'text': '不註忌進人口安牀經絡醖釀開市立劵交易納財開倉庫出貨財', 'role': 'action: do not note 忌 on the listed headings'},
                        {'text': '如遇徳猶忌', 'role': 'exception 1: 猶忌 cases'},
                        {'text': '及從忌不從宜之日', 'role': 'exception 2: days whose outcome is already 從忌不從宜 (之日 = a kind of day)'},
                        {'text': '則仍註忌', 'role': 'consequence of the exceptions: 忌 is still noted'}],
                    'says': 'puzhu:06 only withholds 忌; it never adds, keeps or removes 宜',
                    'congjiScope': '從忌不從宜 is a day-class named as an exception; the rule does not define it, so it '
                                   'refers to an outcome fixed elsewhere (the 等第 grade prose)'},
        'gradeProse': {'oldPractice': QUOTES['oldPractice'], 'oldPracticeOffset': raw.find(QUOTES['oldPractice']),
                       'reform': QUOTES['reform'], 'grades': QUOTES['gradeZhong'] + ' …',
                       'table': '宜忌等第表 is not in the raw text (empty anchor at %d); the project grid holds its '
                                'columns (graded subjects: 月建/月破/平/收/閉/劫煞/災煞/月煞/月刑/月厭/月害/大時/天吏 …)'
                                % raw.find(QUOTES['tableAnchor']),
                       'reading': 'the six grades replace the old blanket 吉神遇凶煞從忌不從宜 for the combinations the table '
                                  'grades; the text does not say what governs an ungraded 凶煞 (五虛, 九空, 小耗, 五墓, 五離 …) '
                                  'that keeps its 忌 against a 吉神\'s 宜'},
        'models': {
            'LIFT_JI': {'grammar': 'permitted: the literal action on trigger days', 'n126': 'contradicted (忌 printed)'},
            'KEEP_JI': {'grammar': 'permitted only if 從忌不從宜之日 or 猶忌 covers the day; the rule itself never yields '
                                   'both_present', 'n126': '忌 fits, 宜 contradicted'},
            'JI_DOMINATES': {'grammar': 'not required by puzhu:06; plausible only if the old blanket 從忌不從宜 (which the '
                                        'compilers present as superseded) still governs '
                                        'ungraded 凶煞, which would also make every such day a 從忌不從宜之日 and so an '
                                        'exception to puzhu:06', 'n126': 'fits both axes'},
        },
        'scope': {'entirePuzhu06': False, 'subsetOfGods': 'UNESTABLISHED (graded subjects certainly; ungraded remaining-ji '
                                                         'only under the old-practice reading)',
                  'specificHeadings': False, 'operandCombos': 'the 等第 grade of the day', 'differentClause': True,
                  'established': False},
        'classification': 'CLAUSE_BOUNDARIES_CLEAR; CONGJI_SCOPE_UNESTABLISHED',
    }

    # ---- 8: corpus pattern search ----
    pg = pages()
    hits = []
    for pid, x in sorted(pg.items()):
        if not x['searchable'] or x['context'] not in inp:
            continue
        for h, r in inp[x['context']].items():
            h_n = norm(h)
            if h_n not in SAFE or r['subjects'] or r['youwei'] or r['protectedJi'] or r['yiOperand'] is not True:
                continue
            kind = 'Q4_LIFT' if r['puzhu06'] == 'lift' else 'SURVIVING' if r['final'] == 'both_present' else \
                'ENGINE_UNDETERMINED'
            expl = [e['rule'] for e in EXPLAINED if h_n in e['headings'] and any(g in x['gods'] for g in e['gods'])
                    and any(g in x['gods'] for g in e['with'])]
            if expl:
                kind = 'EXPLAINED_BY_RULE'
            pr = printed(x, h_n)
            hits.append({'page': pid, 'context': x['context'], 'heading': h_n, 'remaining': r['remaining'],
                         'yiGods': r['yiGods'], 'engineFinal': r['final'], 'puzhu06': r['puzhu06'], 'kind': kind,
                         'printed': pr, 'source': x['source'], 'explainedBy': expl})
    def verdict(h):
        if h['printed'] == 'only_ji':
            return 'MATCH_JI_DOMINATES'
        if h['printed'] == 'both_present':
            return 'COUNTEREXAMPLE_BOTH_PRESENT'
        return 'JI_ABSENT'
    for h in hits:
        h['verdict'] = verdict(h)
    surv = [h for h in hits if h['kind'] == 'SURVIVING']
    corpus = {
        'version': 'q4-rest-stage2a-v1',
        'question': 'surviving ungraded remaining-ji 忌 + independent 宜 present: printed only_ji or both_present?',
        'filter': 'heading printed under its own name (SAFE); 忌 sources = remaining-ji kept only (no graded subject, no '
                  '又為, not protected); 宜 operand present per the 卷十一 list',
        'pages': [{'page': k, 'context': v['context'], 'searchable': v['searchable'],
                   'source': v.get('source'), 'why': v.get('why')} for k, v in sorted(pg.items())],
        'searchable': sum(v['searchable'] for v in pg.values()),
        'hits': hits,
        'surviving': {'rows': len(surv), 'byVerdict': dict(collections.Counter(h['verdict'] for h in surv)),
                      'byGod': dict(collections.Counter('+'.join(h['remaining']) for h in surv))},
        'excluded': {k: [f"{h['page']} {h['heading']}" for h in hits if h['kind'] == k]
                     for k in ('EXPLAINED_BY_RULE', 'ENGINE_UNDETERMINED')},
        'suibaoCorrection': {'stage1Said': 'other volumes', 'actual': '月表 day leaves',
                             'pages': {k: {'header': v[0], 'context': v[1]} for k, v in SUIBAO.items()},
                             'candidateCount': 'unchanged at 27: no suibao context has 九空/五虛/小耗/五墓 (day rules)',
                             'ySearch': 'no qualifying row in any suibao context'},
        'q4Lift': {'rows': len([h for h in hits if h['kind'] == 'Q4_LIFT']),
                   'byVerdict': dict(collections.Counter(h['verdict'] for h in hits if h['kind'] == 'Q4_LIFT'))},
    }
    for _, c in SUIBAO.values():
        assert not [h for h, r in inp[c].items() if norm(h) in SAFE and not r['subjects'] and not r['youwei']
                    and not r['protectedJi'] and r['yiOperand'] is True and r['final'] == 'both_present'], c
    counter = [h for h in surv if h['verdict'] == 'COUNTEREXAMPLE_BOTH_PRESENT']
    match = [h for h in surv if h['verdict'] == 'MATCH_JI_DOMINATES']
    corpus['result'] = ('COUNTEREXAMPLES_PRESENT' if counter else
                        'CONSISTENT_JI_DOMINATES' if match else 'NO_COMPARABLE_ROWS')

    # ---- 7: F1 ----
    f1 = json.load(open(F1S3, encoding='utf-8'))
    f1cmp = {
        'f1Rule3': f1['rule'][2], 'f1Basis': 'OWNER_RULING; the both_present shape is NOT SOURCE_WITNESSED (4 '
                                             'extrapolated rows: 丑-甲申, 午-戊申)',
        'n126Shape': 'surviving remaining-ji 忌 + independent 宜 → printed only_ji',
        'relationship': 'POTENTIAL_F1_CONFLICT' if not counter else 'INSUFFICIENT', 'debt': True,
        'why': 'the F1 witness 06067696-n14 itself prints only_ji on 結婚姻 and 納采問名, where 五離 survives and 四相 '
               'gives independent 宜 (engine both_present); n95 (五墓, 天德合 宜) does the same on 7 headings and n126 '
               '(五虛) on 開倉庫出貨財. No stored page prints both_present for this shape. F1 rule 3 (both_present) and '
               'its 4 extrapolated rows (立券交易 with own 宜) therefore have an untested, likely contrary pattern. Not '
               'established: no page shows 五離 × 立券交易 with independent 宜, and the scope of 從忌不從宜 is '
               'unestablished',
        'n14Rows': [h for h in hits if h['page'] == '06067696-n14'],
        'f1Changed': False,
        'newDebt': 'F1-Y: re-examine F1 R2 rule 3 (both_present) against the 從忌不從宜 question before relying on the 4 '
                   'extrapolated rows as source-faithful',
    }

    # ---- 9: classification ----
    cls = {
        'overall': 'N126-B',
        'jAxis': 'JI_SUPPORTS_NARROW',
        'yAxis': 'YI_SUPPRESSED_UNEXPLAINED',
        'yCandidates': ['卷十 offset 9569 old practice 「舊本凡吉神遇凶煞皆從忌而不從宜」: presented as superseded '
                        '(「於理固屬不合」) by the six grades, so a candidate, not authority',
                        'corpus regularity: every comparable row prints only_ji (corpus-pattern-search.json)'],
        'confidence': {'reading': 'high (same reviewer, full-resolution re-read; no independent second reviewer)',
                       'jAxis': 'medium (single page)', 'yAxis': 'suppression real (corpus), cause unexplained'},
        'replaces': 'Stage 1 single-state C classification for 五虛 × 開倉庫出貨財',
    }

    # ---- 10: acquisition review ----
    out_targets = []
    for t in s1plan['targets']:
        g, h, c = t['god'], t['heading'], t['context']
        yi_pred = t['predictNarrow'] == 'both_present'
        if t['usable'] == 'CONTAMINATED_TARGET':
            use = 'CONTAMINATED'
        elif t['usable'] == 'JOINT_ONLY':
            use = 'NON_DECISIVE'
        else:
            use = 'J_AND_Y' if yi_pred else 'J_ONLY'
        out_targets.append({**{k: t[k] for k in ('god', 'heading', 'context', 'requiredTrigger', 'competing',
                                                  'predictGeneric', 'predictNarrow', 'predictedLocator')},
                            'usefulness': use})
    # One page answers every heading of its context: deduplicate to pages, keep the best use per page.
    rank = {'J_AND_Y': 0, 'J_ONLY': 1, 'Y_ONLY': 2, 'CONTAMINATED': 3, 'NON_DECISIVE': 4}
    by_ctx = collections.defaultdict(list)
    for t in out_targets:
        by_ctx[t['context']].append(t)
    pages_v2 = []
    for c, ts in sorted(by_ctx.items()):
        best = min(ts, key=lambda t: rank[t['usefulness']])
        tests = sorted({f"{t['god']}×{t['heading']}:{t['usefulness']}" for t in ts})
        prio = {'J_AND_Y': 'P0', 'J_ONLY': 'P1', 'Y_ONLY': 'P2', 'CONTAMINATED': 'P3', 'NON_DECISIVE': 'P3'}[best['usefulness']]
        pages_v2.append({'context': c, 'priority': prio, 'tests': tests, 'trigger': best['requiredTrigger'],
                         'predictedLocator': best['predictedLocator']})
    # Proposition dedup: a page whose god keeps its 忌 under several non-own triggers shows that none of them
    # lifts it, so a (god, trigger) proposition needs one clean page. Greedy cover over P0/P1 pages; the rest
    # replicate.
    def props(x):
        gods = {t.split('×')[0] for t in x['tests'] if t.endswith(('J_AND_Y', 'J_ONLY'))}
        return {(g, t) for g in gods for t in x['trigger'].split('+')}
    left = set().union(*(props(x) for x in pages_v2 if x['priority'] in ('P0', 'P1')))
    while left:
        best = max((x for x in pages_v2 if x['priority'] in ('P0', 'P1') and 'role' not in x),
                   key=lambda x: (len(props(x) & left), x['context'] == min(c['context'] for c in pages_v2)))
        best['role'], best['covers'] = 'PRIMARY', sorted('×'.join(pp) for pp in props(best) & left)
        left -= props(best)
    for x in pages_v2:
        x.setdefault('role', 'REPLICATION' if x['priority'] in ('P0', 'P1') else 'SUPPORTIVE')
    review = {'version': 'q4-rest-stage2a-v1', 'axes': {
        'J': 'does the target god\'s 忌 survive generic Q4?',
        'Y': 'if 忌 survives, does conflicting independent 宜 remain (both_present) or go (only_ji)?'},
        'oldTargets': len(s1plan['targets']), 'targets': out_targets,
        'byUsefulness': dict(collections.Counter(t['usefulness'] for t in out_targets)),
        'yOnlyNote': 'no Stage 1 target is Y_ONLY: Y is only observable where 忌 survives; a clean Y_ONLY page is a '
                     'surviving remaining-ji 忌 with independent 宜 and no trigger (the corpus search already holds '
                     'such rows)'}
    # F1-Y: Y rows of the F1 shape (五離 kept on 立券交易 with independent 宜) at the F1 extrapolated contexts.
    for x in pages_v2:
        if x['context'] == '午-戊申':
            x['tests'].append('五離×立券交易:Y_ONLY (F1-Y)')
    pages_v2.append({'context': '丑-甲申', 'priority': 'P2', 'role': 'PRIMARY', 'tests': ['五離×立券交易:Y_ONLY (F1-Y)'],
                     'trigger': 'none required', 'covers': ['F1-Y'],
                     'predictedLocator': {'value': '06067697-n93', 'status': 'HYPOTHESIS',
                                          'basis': 'leaf - cycle index offsets [73] for item/month block'}})
    plan_v2 = {'version': 'q4-rest-stage2a-v1', 'supersedes': S1 + 'acquisition-plan.json',
               'status': 'HYPOTHESIS until authenticated; not acquired', 'pages': pages_v2,
               'byPriority': dict(collections.Counter(x['priority'] for x in pages_v2)),
               'primary': [x['context'] for x in pages_v2 if x['role'] == 'PRIMARY']}

    review_doc = {'version': 'q4-rest-stage2a-v1', 'n126': n126, 'classification': cls, 'f1': f1cmp,
                  'stage1Head': '6b9a9e29a8387927c49e9e1e9557c8d3e3796a6d',
                  'stage1Cell': next(c for c in s1m['cells'] if c['clean']),
                  'g2W1': json.load(open(G2S3, encoding='utf-8'))['w1'], 'productionChanged': False,
                  'stopConditions': {'scanUncertain': False, 'clauseBoundariesAmbiguous': False,
                                     'congjiScopeUnestablished': True, 'otherRuleMayExplainYi': True,
                                     'corpusCounterexamples': bool(counter), 'f1MayBeContradicted': True,
                                     'productionChanged': False},
                  'status': 'NEEDS_OWNER_REVIEW'}
    outdir = sys.argv[1] if len(sys.argv) > 1 else HERE

    def out(name, obj):
        with open(os.path.join(outdir, name), 'w', encoding='utf-8') as f:
            json.dump(obj, f, ensure_ascii=False, indent=1)
            f.write('\n')
    out('n126-review.json', review_doc)
    out('grammar-analysis.json', grammar)
    out('corpus-pattern-search.json', corpus)
    out('acquisition-review.json', review)
    out('acquisition-plan-v2.json', plan_v2)
    built = ('n126-review.json', 'grammar-analysis.json', 'corpus-pattern-search.json', 'acquisition-review.json',
             'acquisition-plan-v2.json')
    files = {os.path.join(HERE, n): sha(os.path.join(outdir, n)) for n in built}
    for p_ in [INPUT, os.path.join(HERE, 'build_review.py'), HARNESS, VOL10, VOL11, AUTH, F1S3, G2S3, N126,
               S1 + 'evidence.json', S1 + 'matrix.json', S1 + 'acquisition-plan.json', S1 + 'lock.json'] + RECORD_FILES:
        files[p_] = sha(p_)
    out('lock.json', {'version': 'q4-rest-stage2a-v1', 'files': files})


if __name__ == '__main__':
    main()
