"""G2-n117 Stage 1: freeze the 未-戊申 × 立券交易 authority discrepancy (audit only).

Run from the repo root: python3 docs/audits/sources/p4-vol10/g2-n117-stage1/build_evidence.py
Writes evidence.json and lock.json next to this script. Page readings are manual re-reads of the stored
JPGs (no OCR); everything else is read from committed files.
"""
import hashlib
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
REL = os.path.relpath(HERE)
P = 'docs/audits/sources/p4-vol10/'
AUTH = 'shared/almanac-data/xieji-vol10-jiesha-authority-v{}.json'
VOL11 = P + 'yi-sources-v1/vol11.raw.txt'
ACT_MAP = 'shared/almanac-data/xiejibianfangshu-yiji.json'
VOL10_DATA = 'shared/almanac-data/xiejibianfangshu-vol10-yiji.json'
BAD_GODS = 'shared/almanac-data/bad-gods.json'

# Manual re-reads (this Stage) of the stored 月表 pages. 忌 text in print order; '' = no 忌 line on the page.
PAGES = {
    '06067694-n117': dict(path=P + 'h1b-yuebiao-witness-v1/pages/06067694-n117.jpg', context='未-戊申', officer='除',
        ji_shen='四相 陽德 相日 吉期 不將 益後 除神 司命', xiong_shen='劫煞 天賊 五虛 五離',
        yi='祭祀沐浴掃舍宇',
        ji='上冊受封上表章會親友出行結婚姻納采｜問名安牀求醫療病修倉庫立券交易納財｜開倉庫出貨財破土安葬啟攢'),
    '06067694-n81': dict(path=P + 'h1b-yuebiao-witness-v1/pages/06067694-n81.jpg', context='未-壬申', officer='除',
        ji_shen='陽德 相日 吉期 不將 益後 除神 司命 鳴吠', xiong_shen='劫煞 天賊 五虛 五離',
        yi='祭祀沐浴掃舍宇',
        ji='上冊受封上表章會親友冠帶出行結婚姻｜納采問名進人口移徙安牀求醫療病裁衣｜築隄防修造動土豎柱上梁修倉庫鼓鑄經｜絡醞釀開市立券交易納財開倉庫出貨財｜修置產室開渠穿井安碓磑補垣塞穴修飾｜垣牆破屋壞垣栽種牧養納畜'),
    '06067694-n105': dict(path=P + 'h1b-yuebiao-witness-v1/pages/06067694-n105.jpg', context='未-丙申', officer='除',
        ji_shen='陽德 相日 吉期 益後 除神 司命 鳴吠', xiong_shen='劫煞 天賊 五虛 五離',
        yi='祭祀沐浴掃舍宇',
        ji='上冊受封上表章會親友冠帶出行結婚姻｜納采問名嫁娶進人口移徙安牀求醫療病｜裁衣築隄防修造動土豎柱上梁修倉庫鼓｜鑄經絡醞釀開市立券交易納財開倉庫出｜貨財修置產室開渠穿井安碓磑補垣塞穴｜修飾垣牆破屋壞垣栽種牧養納畜'),
    '06067694-n129': dict(path=P + 'h1b-yuebiao-witness-v1/pages/06067694-n129.jpg', context='未-庚申', officer='除',
        ji_shen='月空 陽德 相日 吉期 益後 除神 司命 鳴吠', xiong_shen='劫煞 天賊 五虛 五離 八專',
        yi='祭祀沐浴掃舍宇',
        ji='上冊受封上表章會親友冠帶出行結婚姻｜納采問名嫁娶進人口移徙安牀求醫療病｜裁衣築隄防修造動土豎柱上梁修倉庫鼓｜鑄經絡醞釀開市立券交易納財開倉庫出｜貨財修置產室開渠穿井安碓磑補垣塞穴｜修飾垣牆破屋壞垣栽種牧養納畜'),
    '06067694-n93': dict(path=P + 'xiangdi-cancel-both-v1/pages/06067694-n93.jpg', context='未-甲申', officer='除',
        ji_shen='天德 月德 陽德 相日 吉期 不將 益後 除神 司命 鳴吠', xiong_shen='劫煞 天賊 五虛 八風 五離',
        yi='(long list; 立券交易 and 納財 absent from both lines)',
        ji='出行安牀求醫療病修倉庫開倉庫出貨財｜畋獵取魚'),
    '06067695-n50': dict(path=P + 'yuebiao/06067695-n50.jpg', context='申-戊申', officer='建',
        ji_shen='天德合 天赦 王日 天倉 不將 除神', xiong_shen='月建 小時 土府 五離 天牢',
        yi='(long list ending …納財掃舍宇牧養納畜安葬; 立券交易 absent)', ji=''),
    '06067693-n105': dict(path=P + 'yuebiao/06067693-n105.jpg', context='巳-丙申', officer='平',
        ji_shen='天德合 天願 相日 六合 五富 不將 續世 除神 鳴吠', xiong_shen='河魁 死神 月刑 遊禍 五虛 血忌 復日 五離 天刑',
        yi='(long list containing …開市立券交易納財開倉庫出貨財…)', ji=''),
    '06067692-n51': dict(path=P + 'yuebiao/06067692-n51.jpg', context='寅-己酉', officer='危',
        ji_shen='天恩 陰德 福生 除神 鳴吠', xiong_shen='天吏 致死 五虛 五離 元武',
        yi='祭祀沐浴剃頭整手足甲掃舍宇取魚破土安葬',
        ji='祈福求嗣上冊受封上表章襲爵受封會親｜友冠帶出行上官赴任臨政親民結婚姻納｜采問名嫁娶進人口移徙安牀解除求醫療｜病築隄防修造動土豎柱上梁修倉庫開市｜立券交易納財開倉庫出貨財修置產室栽｜種牧養納畜'),
}

WULI_LIFTERS = ['天德', '月德', '天德合', '月德合', '天赦', '三合', '六合']


def sha(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def vol11_entry(heading):
    """卷十一 用事 entry: the 宜 and 忌 lines that follow the anchor."""
    lines = open(VOL11, encoding='utf-8').read().split('\n')
    i = next(n for n, l in enumerate(lines) if '{{SK anchor|%s}}' % heading in l)
    yi, ji = lines[i + 1].strip('　 '), lines[i + 2].strip('　 ')
    assert yi.startswith('宜') and ji.startswith('忌'), heading
    return {'line': i + 1, 'yi': yi[1:], 'ji': ji[1:]}


def page_row(pid, p, lijuan):
    ji = p['ji'].replace('｜', '')
    gods = (p['ji_shen'] + ' ' + p['xiong_shen']).split()
    wuli = '五離' in gods
    lifters = [g for g in WULI_LIFTERS if g in gods]
    return {
        'page': pid, 'context': p['context'], 'sha256': sha(p['path']),
        'jieshaPresent': '劫煞' in gods, 'sixiangPresent': '四相' in gods,
        'wuliPresent': wuli, 'wuliLifters': lifters,
        'wuliUnlifted': wuli and not lifters,
        # Operands for 立券交易 from the 卷十一 lists; a page discriminates 五離-alone only with exactly [五離] and no 宜.
        'lijuanJiOperands': [g for g in gods if g in lijuan['ji']],
        'lijuanYiOperands': [g for g in gods if g in lijuan['yi']],
        'onJiLine': {h: h in ji for h in ['開市', '立券交易', '納財', '開倉庫出貨財']},
    }


def main():
    cells = {}
    for v in (1, 2, 3, 4):
        a = json.load(open(AUTH.format(v), encoding='utf-8'))
        cells[f'v{v}'] = {
            'version': a['version'],
            'sha256': sha(AUTH.format(v)),
            'cells': {k: {x: a['cells'][k].get(x) for x in ['contract', 'transaction', 'finance', 'opening', 'business']}
                      for k in ['未戊申', '未壬申', '未丙申', '未庚申']},
            'coverage': {x: a['runtimeCoverage']['activities'][x]['status'] for x in ['contract', 'transaction']},
            'provenanceNote': a['provenance']['evidence'].get('未-戊申 納財'),
        }
    amap = json.load(open(ACT_MAP, encoding='utf-8'))['activityEntries']
    aliases = json.load(open(VOL10_DATA, encoding='utf-8'))['headingAliases']
    ngu_ly = next(g for g in json.load(open(BAD_GODS, encoding='utf-8'))['items'] if g['id'] == 'ngu_ly')
    vol10_raw = open(P + 'vol10.raw.txt', encoding='utf-8').read()
    p21 = '凡吉凶相抵不註忌開市亦不註忌立劵交易納財不註忌納財亦不註忌開市立劵交易不註忌立劵交易亦不註忌開市納財'
    p06 = '凡徳合赦願月恩四相時徳等日不註忌進人口安牀經絡醖釀開市立劵交易納財開倉庫出貨財如遇徳猶忌及從忌不從宜之日則仍註忌'
    lijuan, nacai = vol11_entry('立劵交易'), vol11_entry('納財')
    n117_gods = (PAGES['06067694-n117']['ji_shen'] + ' ' + PAGES['06067694-n117']['xiong_shen']).split()
    evidence = {
        'version': 'g2-n117-stage1-v1',
        'target': {'context': '未-戊申', 'cellKey': '未戊申', 'activities': ['contract', 'transaction'],
                   'heading': '立券交易', 'witness': '06067694-n117 (卷二十五, 未月 戊申, 除)'},
        'framingCorrection': (
            'The 四相 宜 納財 vs n117 忌 納財 conflict is the 納財 (finance) cell, already owner-ruled LOCAL in '
            'docs/audits/p4-option-c-final-gate.md. The target cell is 劫煞 × 立券交易; its conflict is n117 printing '
            '立券交易 on the 忌 line while the 劫煞 cell is blank.'),
        'canonical': {
            '立劵交易↔立券交易': 'SAME_ACTIVITY_ALIAS_CONFIRMED (G2): headingAliases ' + json.dumps(aliases.get('立劵交易'), ensure_ascii=False),
            'activityMap': {k: amap[k] for k in ['contract', 'transaction', 'finance', 'opening', 'business']},
            'aliasesTouching納財': [k for k, v in aliases.items() if '納財' in k or any('納財' in x for x in v)],
            '納財→立券交易': 'NOT a taxonomy/alias mapping. Source rule puzhu:21 (卷十 鋪註, triad 開市/立劵交易/納財) '
                           'propagates 納財 unnoted-by-相抵 to 立券交易.',
            'puzhu21InVol10Raw': p21 in vol10_raw,
            'puzhu06InVol10Raw': p06 in vol10_raw,
        },
        'vol11': {'立劵交易': lijuan, '納財': nacai,
                  'operandsOnN117For立券交易忌': [g for g in n117_gods if g in lijuan['ji']],
                  'operandsOnN117For立券交易宜': [g for g in n117_gods if g in lijuan['yi']],
                  'operandsOnN117For納財忌': [g for g in n117_gods if g in nacai['ji']],
                  'operandsOnN117For納財宜': [g for g in n117_gods if g in nacai['yi']]},
        'pages': [page_row(k, v, lijuan) for k, v in PAGES.items()],
        'pageTexts': PAGES,
        'authority': cells,
        'productionNguLy': ngu_ly,
        'baselineHashes': {f: sha(f) for f in [VOL10_DATA, ACT_MAP, BAD_GODS]},
        'runtimeObservation': {
            'note': 'getAlmanac at main aebcf2e, current behaviour, not authority',
            '2026-08-02': 'contract/transaction 50 neutral; kiep_sat no_annotation, ngu_ly no_annotation (P4 domain, N-A via puzhu:21: F1 debt)',
            '2027-07-28': 'same as 2026-08-02',
            '2028-07-22': 'contract/transaction 50 neutral; kiep_sat no_annotation (cell blank, I1); ngu_ly/tu_tuong not in auditedGodIds outside 2025-2027',
        },
        'hypotheses': {
            'H1_printing_anomaly': 'PARTIAL: n117 is irreconcilable on {納財 noted, 開市 unnoted}; nothing shows the 立券交易 print itself is an error',
            'H2_month_table_precedence': 'NO_EVIDENCE: no documented 月表-over-rule precedence; both prior owner rulings were LOCAL and went to the source side',
            'H3_semantic_scope': 'SOURCE_SUPPORTED_UNDER_PLAIN_TEXT, CONTRADICTED_BY_OWNER_ADOPTED_PUZHU06_Q4: 五離 explains the print, '
                                 'but owner Q4 (2026-10-16) makes 四相 lift 五離 on 立券交易, which n117 does not do',
        },
        'ruling': 'UNRESOLVED_CONFLICT',
        'witnessConflict': True,
        'productionState': 'BLANK / I1',
        'sourceWitnessed': False,
    }
    out = os.path.join(REL, 'evidence.json')
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(evidence, f, ensure_ascii=False, indent=1)
        f.write('\n')
    # Immutable inputs only. Production data files (authority v4, activity map, 卷十 data, bad-gods) are hashed in
    # evidence.json at the baseline; the test checks their live state through the runtime instead.
    files = [out, os.path.join(REL, 'build_evidence.py'), VOL11, P + 'vol10.raw.txt',
             P + 'weishen-nacai-puzhu21-v1/lock.json', P + 'option-c-final-gate-v1/owner-ruling.json'] + \
        [p['path'] for p in PAGES.values()]
    with open(os.path.join(REL, 'lock.json'), 'w', encoding='utf-8') as f:
        json.dump({'version': 'g2-n117-stage1-v1', 'files': {p: sha(p) for p in files}}, f, ensure_ascii=False, indent=1)
        f.write('\n')


if __name__ == '__main__':
    main()
