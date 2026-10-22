"""相抵 audit holdout: freeze predictions for 14 unread 月表 pages before fetching them.

Run: python3 -I docs/audits/sources/p4-vol10/xiangdi-cancel-both-v1/build_holdout.py
Two readings of 「凡所忌者則不註宜所宜者亦不註忌」 for a 劫煞 cancel_both scope:
- CANCEL_BOTH (production, Golden v2): every 劫煞 heading is on neither line.
- OVERLAP (text-literal, written after seeing the 16 frozen pages): a 劫煞 heading
  with 宜 evidence is on neither line; without 宜 it stays 忌; then the 鋪註
  「凡吉凶相抵不註忌X亦不註忌Y」 pairs carry a dropped X to Y.
Other states use Golden v2 for both readings. 宜 evidence is Golden v2's
(modelled 宜 gods only).
"""
import csv
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
COMPOSE = HERE.parent / 'p4-full-golden-v2' / 'compose'
STEMS, BRANCHES = '甲乙丙丁戊己庚辛壬癸', '子丑寅卯辰巳午未申酉戌亥'
PILLARS = [STEMS[i % 10] + BRANCHES[i % 12] for i in range(60)]
ITEM = {'寅': (92, 0), '卯': (92, 1), '辰': (93, 0), '巳': (93, 1), '午': (94, 0), '未': (94, 1),
        '申': (95, 0), '酉': (95, 1), '戌': (96, 0), '亥': (96, 1), '子': (97, 0), '丑': (97, 1)}
# 卷十 鋪註條例 (vol10.raw offsets 21980–22513), in 卷十一 heading names; 修造動土 read as 興造動土.
PUZHU_PAIRS = [
    (('祈福',), ('求嗣',)),
    (('結婚姻',), ('納采問名', '嫁娶')),
    (('嫁娶',), ('結婚姻', '納采問名', '般移', '安牀')),
    (('般移',), ('安牀',)), (('安牀',), ('般移',)),
    (('興造動土',), ('豎柱上梁', '修宮室', '修倉庫', '破屋壊垣')),
    (('開市',), ('立券交易',)), (('納財',), ('開市', '立券交易')), (('立券交易',), ('開市', '納財')),
    (('開市', '立券交易'), ('開倉庫出貨財',)),
    (('牧養',), ('納畜',)), (('納畜',), ('牧養',)),
]
# (context, 相抵 subject): contexts where the two readings disagree, other subjects than 劫煞
# are tested as their own rules (X4), never by extrapolation from 劫煞.
CANCEL = [('寅-戊子', '災煞'), ('巳-癸卯', '災煞'), ('卯-戊戌', '月煞'), ('酉-甲辰', '月煞'),
          ('辰-壬辰', '月刑'), ('戌-辛酉', '天吏')]
CONTROLS = {'午-辛亥': ('刼煞', '劫煞 子午卯酉 執日 + 月德/月德合: readings coincide (all 宜)'),
            '卯-甲申': ('刼煞', '劫煞 子午卯酉 執日 + 月德/月德合: readings coincide (all 宜)'),
            '酉-庚寅': ('刼煞', '劫煞 子午卯酉 執日 + 月德/月德合: readings coincide (all 宜)'),
            '子-丁巳': ('刼煞', 'Golden as_usual (德作建論 named override)'),
            '辰-丁巳': ('刼煞', '劫煞 + 德 (only_avoid)'), '戌-辛亥': ('刼煞', '劫煞 + 德 (only_avoid)'),
            '未-甲申': ('刼煞', '劫煞 + 德 (only_avoid)'), '丑-庚寅': ('刼煞', '劫煞 + 德 (only_avoid)')}


def locator(month, pillar):
    item, second = ITEM[month]
    leaf = (73 if second else 6) + PILLARS.index(pillar)
    return {'item': f'060676{item}.cn', 'leaf': f'n{leaf}',
            'url': f'https://archive.org/download/060676{item}.cn/page/n{leaf}_w1200.jpg'}


def xd(code):
    return code.split('xd=')[1].split(';')[0].split('+') if 'xd=' in code else []


def printed(state):
    return {'only_ji': True, 'both_present': True, 'neither_recorded': False,
            'not_recorded': False, 'only_yi': False}.get(state)


def overlap(rows, subject):
    """Heading -> predicted printed 忌 under OVERLAP for one context and 相抵 subject."""
    out = {h: printed(r['state']) for h, r in rows.items()}
    cancel = {h for h, r in rows.items()
              if r['state'] == 'neither_recorded' and subject in xd(r['code']) and 'ji=' not in r['code']}
    dropped = set()
    for h in cancel:
        out[h] = rows[h]['yi_evidence'] != 'true'
        if not out[h]:
            dropped.add(h)
    changed = True
    while changed:
        changed = False
        for src, dst in PUZHU_PAIRS:
            if all(s in dropped for s in src):
                for t in dst:
                    if t in cancel and t not in dropped:
                        out[t] = False
                        dropped.add(t)
                        changed = True
    return out


def predict(ctx, subject):
    rows = {}
    with open(COMPOSE / 'context.tsv', encoding='utf-8') as f:
        for r in csv.DictReader(f, delimiter='\t'):
            if r['id'] == ctx:
                rows[r['heading']] = r
    ov = overlap(rows, subject)
    m, p = ctx.split('-')
    return {'context': ctx, 'subject': subject, 'yuebiao': locator(m, p), 'headings': [
        {'heading': h, 'goldenState': r['state'], 'yiEvidence': r['yi_evidence'],
         'xiangdiSubject': subject in xd(r['code']),
         'cancelBoth': printed(r['state']), 'overlap': ov[h]}
        for h, r in rows.items()]}


if __name__ == '__main__':
    out = {'version': 'xiangdi-cancel-both-holdout-v1',
           'note': 'Frozen before these 14 pages were fetched. OVERLAP was formed after reading the 16 frozen pages; '
                   'these pages are its first out-of-sample test. Printed = heading on the 忌 line.',
           'puzhuPairs': [[list(s), list(t)] for s, t in PUZHU_PAIRS],
           'cancelTest': [predict(c, s) for c, s in CANCEL],
           'controls': [{**predict(c, s), 'role': role} for c, (s, role) in CONTROLS.items()]}
    (HERE / 'holdout-predictions.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    for t in out['cancelTest']:
        diff = [(x['heading'], x['overlap']) for x in t['headings'] if x['cancelBoth'] != x['overlap']]
        print(t['context'], 'readings differ on', diff)
