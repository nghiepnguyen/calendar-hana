"""F1 Stage 1: acquire, authenticate and transcribe the 戌-壬申 / 戌-庚申 月表 witnesses (audit only).

Run from the repo root: python3 -I docs/audits/sources/p4-vol10/f1-wuli-lijuan-stage1/build_evidence.py
Writes evidence.json and lock.json next to this script.

Four layers stay separate in the output:
  page        manual reading of the stored scan (raw glyphs) plus a normalized copy
  sourceRule  operands from the 卷十一 立劵交易 lists, 五離's own lift list and the puzhu:06 trigger set
  project     the frozen puzhu:06 sweep / raw-忌 baseline (owner-adopted Q4 model)
  production  observed runtime output (Stage 2 probe); not authority
"""
import csv
import hashlib
import json
import os

HERE = os.path.relpath(os.path.dirname(os.path.abspath(__file__)))
P = 'docs/audits/sources/p4-vol10/'
VOL11 = P + 'yi-sources-v1/vol11.raw.txt'
PUZHU06 = 'shared/almanac-data/p4b-puzhu06-v3.json'
SWEEP = 'docs/audits/p4b-puzhu06-2025-2027.tsv'
BASELINE = P + 'p4b-puzhu06-baseline-v1/baseline.tsv'
G2S1 = P + 'g2-n117-stage1/evidence.json'
G2S3 = P + 'g2-n117-stage3/owner-ruling.json'
HEADS = ['開市', '立券交易', '納財']
# Canonical mapping (G2): 卷十 / print glyph 劵 is the same heading as 立券交易. Raw text is never rewritten.
NORMALIZE = {'立劵交易': '立券交易'}

# Leaf calibration for item 06067696 (戌月 block): leaf = 60-cycle index + 6 on every committed 戌月 page.
CALIBRATION = {'n17': '乙亥', 'n29': '丁亥', 'n41': '己亥', 'n53': '辛亥', 'n63': '辛酉', 'n65': '癸亥'}

# Manual readings of the downloaded scans. Column breaks in the 忌/宜 lines are marked ｜.
PAGES = {
    '06067696-n14': dict(
        path=HERE + '/pages/06067696-n14.jpg', url='https://archive.org/download/06067696.cn/page/n14_w1200.jpg',
        predicted='06067696-n14', header='壬申劍鋒金義開日', foliation='七', month='戌', pillar='壬申', officer='開',
        ji_shen=['月空', '四相', '王日', '驛馬', '天后', '時陽', '生氣', '六儀', '金堂', '除神', '金匱', '鳴吠'],
        xiong_shen=['厭對', '招搖', '五離'],
        yi='祭祀祈福求嗣上冊受封上表章襲爵受封｜入學出行上官赴任臨政親民移徙解除沐｜浴剃頭整手足甲求醫療病裁衣修造動土｜豎柱上梁開市納財開倉庫出貨財修置產｜室安碓磑掃舍宇栽種牧養',
        ji='會親友結婚姻納采問名嫁娶安牀立券交｜易開渠伐木畋獵取魚乘船渡水'),
    '06067696-n62': dict(
        path=HERE + '/pages/06067696-n62.jpg', url='https://archive.org/download/06067696.cn/page/n62_w1200.jpg',
        predicted='06067696-n62', header='庚申石榴木專開日', foliation='三十一', month='戌', pillar='庚申', officer='開',
        ji_shen=['月恩', '王日', '驛馬', '天后', '時陽', '生氣', '六儀', '金堂', '除神', '金匱', '鳴吠'],
        xiong_shen=['厭對', '招搖', '五離', '八專'],
        yi='祭祀祈福求嗣上冊受封上表章襲爵受封｜入學出行上官赴任臨政親民移徙解除沐｜浴剃頭整手足甲求醫療病裁衣修造動土｜豎柱上梁開市開倉庫出貨財修置產室開｜渠穿井安碓磑掃舍宇栽種牧養',
        ji='會親友結婚姻納采問名嫁娶安牀經絡立｜券交易伐木畋獵取魚乘船渡水'),
}
DATES = {'壬申': '2025-10-30', '庚申': '2025-10-18'}
PRODUCTION = {
    '2025-10-30': 'contract 50 no_evidence; 立券交易 not_recorded, ji [五離], puzhu06 lift:QL (G2-n117 Stage 2 probe)',
    '2025-10-18': 'contract 50 no_evidence; 立券交易 not_recorded, ji [五離], puzhu06 lift:QL (G2-n117 Stage 2 probe)',
}
OFFICERS = '建除滿平定執破危成收開閉'
BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
# 卷十 entries of the page's 凶神 other than 五離 (raw lines), checked for 立劵交易 and 猶忌 / 從忌 wording.
OTHER_XIONG = {'厭對': '忌嫁娶', '招搖': '忌取魚乘船渡水 (又為招摇)',
               '八專': '忌安撫邊境選將訓兵出師結婚姻納采問名嫁娶與德合併猶忌與天願併止忌安撫邊境選將訓兵出師餘不忌'}
# 等第-graded subject gods (puzhu:06 Q1 / 從忌不從宜 route); none may be on the page for a clean witness.
GRADED = ['月建', '月破', '平日', '收日', '閉日', '劫煞', '刼煞', '災煞', '月煞', '月刑', '月厭', '月害', '大時', '天吏']
TWO_SOLSTICE = '不註上册進表章慶賜賞賀宴㑹行幸遣使安撫邊境選將訓兵出師上官赴任臨政親民結婚姻納采問名嫁娶進人口般移開市立劵交易捕捉畋獵取魚'
CYCLE = ['甲乙丙丁戊己庚辛壬癸'[i % 10] + '子丑寅卯辰巳午未申酉戌亥'[i % 12] for i in range(60)]


def sha(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def vol11_entry(heading):
    lines = open(VOL11, encoding='utf-8').read().split('\n')
    i = next(n for n, l in enumerate(lines) if '{{SK anchor|%s}}' % heading in l)
    return {'yi': lines[i + 1].strip('　 ')[1:], 'ji': lines[i + 2].strip('　 ')[1:]}


def normalized(text):
    out = text.replace('｜', '')
    for raw, canon in NORMALIZE.items():
        out = out.replace(raw, canon)
    return out


def main():
    lijuan = vol11_entry('立劵交易')
    p06 = json.load(open(PUZHU06, encoding='utf-8'))
    triggers, lift_quote = p06['triggers'], p06['liftLists']['五離']['quote']
    lifters_all = ['天德', '月德', '天德合', '月德合', '天赦', '三合', '六合']
    assert all(g in lift_quote for g in lifters_all)
    sweep = [r for r in csv.DictReader(open(SWEEP, encoding='utf-8'), delimiter='\t')]
    base = [r for r in csv.reader(open(BASELINE, encoding='utf-8'), delimiter='\t')]
    raw = open(P + 'vol10.raw.txt', encoding='utf-8').read()
    for v in OTHER_XIONG.values():
        assert v.split(' ')[0] in raw
    assert TWO_SOLSTICE in raw
    calibration = {leaf: int(leaf[1:]) - CYCLE.index(p) for leaf, p in CALIBRATION.items()}
    assert set(calibration.values()) == {6}

    witnesses = []
    for wid, p in PAGES.items():
        gods = p['ji_shen'] + p['xiong_shen']
        ji_n, yi_n = normalized(p['ji']), normalized(p['yi'])
        date = DATES[p['pillar']]
        lif = [g for g in lifters_all if g in gods]
        trig = [g for g in triggers if g in gods]
        ji_ops = [g for g in gods if g in lijuan['ji']]
        yi_ops = [g for g in gods if g in lijuan['yi']]
        wuli_active = '五離' in gods and not lif
        # Month from content: the officer counts from 建 (= month branch), so month = day branch - officer index.
        month_from_officer = BRANCHES[(BRANCHES.index(p['pillar'][1]) - OFFICERS.index(p['officer'])) % 12]
        assert month_from_officer == p['month']
        others = {g: OTHER_XIONG[g] for g in p['xiong_shen'] if g in OTHER_XIONG}
        exceptions = {
            'graded': [g for g in gods if g in GRADED],
            'deForYouJi': [g for g in gods if g in ('天德', '月德', '天德合', '月德合')],
            'otherXiongListLijuan': [g for g, v in others.items() if '立劵交易' in v],
            'otherPuzhu': 'only the 二至二分 line also names 立劵交易; it applies to solstice/equinox dates, not a pillar page',
        }
        clean = not (exceptions['graded'] or exceptions['deForYouJi'] or exceptions['otherXiongListLijuan'])
        decisive = wuli_active and bool(trig) and ji_ops == ['五離'] and not yi_ops and clean
        printed = {h: ('忌' if h in ji_n else '宜' if h in yi_n else '—') for h in HEADS}
        witnesses.append({
            'witness': wid, 'context': f"{p['month']}-{p['pillar']}",
            'page': {
                'collection': 'archive.org 06067696.cn (欽定協紀辨方書 四庫全書本, 月表 卷二十八)',
                'locator': p['url'], 'predicted': p['predicted'], 'actual': wid,
                'predictionCorrect': p['predicted'] == wid,
                'path': p['path'], 'sha256': sha(p['path']),
                'retrieval': 'curl --fail of the w1200 page image, 2026-10-26; image unmodified',
                'authentication': {'header': p['header'], 'foliation': p['foliation'],
                                   'pillar': p['pillar'], 'officer': p['officer'],
                                   'monthFromContent': f"{month_from_officer}: {p['officer']}日 on a {p['pillar'][1]} day puts 建 on {month_from_officer}",
                                   'monthFromItemBlock': '戌 (leaf = cycle index + 6, as on every committed 戌月 leaf; supporting only)',
                                   'archiveFilename': os.path.basename(p['url']),
                                   'glyph': '立券交易 read with 券, as on every prior 月表 read; 劵/券 normalize to one heading',
                                   'result': 'AUTHENTICATED'},
                'jiShen': p['ji_shen'], 'xiongShen': p['xiong_shen'],
                'yiRaw': p['yi'], 'jiRaw': p['ji'], 'yiNormalized': yi_n, 'jiNormalized': ji_n,
                'printed': printed,
            },
            'sourceRule': {
                'wuliPresent': '五離' in gods, 'wuliOwnLifters': lif, 'wuliActive': wuli_active,
                'puzhu06Triggers': trig, 'lijuanJiOperands': ji_ops, 'lijuanYiOperands': yi_ops,
                'otherXiongEntries': others, 'puzhu06Exceptions': exceptions,
                'predictQ4': '立券交易 not on 忌' if decisive else None,
                'predictWuliNarrow': '立券交易 on 忌' if decisive else None,
            },
            'project': {
                'date': date,
                'sweep': {r['heading']: {k: r[k] for k in ['triggers', 'classes', 'action', 'before_final_state',
                                                           'after_final_state']}
                          for r in sweep if r['date'] == date and r['heading'] in HEADS + ['安牀']},
                'rawJiSources': {r[3]: r[10] for r in base if r[0] == date and r[3] in HEADS + ['安牀']},
            },
            'production': PRODUCTION[date],
            'decisive': decisive,
            'observedMatches': ('WULI-NARROW' if printed['立券交易'] == '忌' else 'Q4') if decisive else None,
        })

    s1 = json.load(open(G2S1, encoding='utf-8'))
    n117 = next(p for p in s1['pages'] if p['page'] == '06067694-n117')
    evidence = {
        'version': 'f1-wuli-lijuan-stage1-v1',
        'question': 'Q4 (puzhu:06 trigger lifts 五離 on 立券交易) vs WULI-NARROW (五離 stays 忌 unless its own lifter applies)',
        'repositorySearch': 'no 戌-壬申 / 戌-庚申 scan, transcription or deleted file in tree or history; only model rows',
        'leafCalibration': calibration,
        'vol11立劵交易': lijuan, 'wuliLiftQuote': lift_quote, 'puzhu06Triggers': triggers,
        'witnesses': witnesses,
        'baselineN117': {'context': '未-戊申', 'wuliActive': n117['wuliUnlifted'],
                         'puzhu06Triggers': ['四相'], 'lijuanJiOperands': n117['lijuanJiOperands'],
                         'printed': {h: '忌' if v else '—' for h, v in n117['onJiLine'].items() if h in HEADS},
                         'decisive': False, 'reason': '劫煞 is a second 立券交易 忌 operand'},
        'sideObservations': [
            '安牀 printed 忌 on both pages: raw-忌 sources empty in the baseline (fixed day rule), untouched by puzhu:06 in the model; not a puzhu:06 confound for 立券交易',
            '庚申 page omits 納財 from both lines although 月恩 is in the 卷十一 納財 宜 list; the model has 納財 only_yi. Outside F1.',
            '經絡 printed 忌 on 庚申 (八專 day); not modelled as a P4 heading; outside F1.',
        ],
        'scope': 'F1-B covers 五離 under a non-lifter puzhu:06 trigger (四相, 月恩) on 立券交易 only; not 九空/五虛/小耗/五墓, not other headings',
        'stage2Sizing': {'qlLiftRows2025_2027': 68, 'qlLiftRowsWhereOnlyRemainingSourceIs五離': {'立券交易': 12}},
        'classification': 'F1-B',
        'g2n117W1': json.load(open(G2S3, encoding='utf-8'))['w1'],
        'productionChanged': False,
    }
    out = os.path.join(HERE, 'evidence.json')
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(evidence, f, ensure_ascii=False, indent=1)
        f.write('\n')
    files = [out, os.path.join(HERE, 'build_evidence.py'), VOL11, SWEEP, BASELINE, G2S1, G2S3] + \
        [p['path'] for p in PAGES.values()]
    with open(os.path.join(HERE, 'lock.json'), 'w', encoding='utf-8') as f:
        json.dump({'version': 'f1-wuli-lijuan-stage1-v1', 'files': {p: sha(p) for p in files}}, f,
                  ensure_ascii=False, indent=1)
        f.write('\n')


if __name__ == '__main__':
    main()
