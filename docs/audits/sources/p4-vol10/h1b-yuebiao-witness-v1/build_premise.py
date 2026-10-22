"""H1-B premise addendum freeze (written after the first 22 pages were read, before these pages).

Run: python3 -I docs/audits/sources/p4-vol10/h1b-yuebiao-witness-v1/build_premise.py
- liftPremise: contexts where 重日/復日 + 德 is Golden v2's only 安葬 source and 安葬 is left unnoted.
- jieshaClass: the 丑 contexts of the 劫煞 辰戌丑未 class not covered by the first 22 pages.
"""
import csv
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
COMPOSE = HERE.parent / 'p4-full-golden-v2' / 'compose'
STEMS, BRANCHES = '甲乙丙丁戊己庚辛壬癸', '子丑寅卯辰巳午未申酉戌亥'
PILLARS = [STEMS[i % 10] + BRANCHES[i % 12] for i in range(60)]
# Same 月表 leaf map as build_predictions.py (importing it would rewrite the earlier freeze).
ITEM = {'寅': (92, 0), '卯': (92, 1), '辰': (93, 0), '巳': (93, 1), '午': (94, 0), '未': (94, 1),
        '申': (95, 0), '酉': (95, 1), '戌': (96, 0), '亥': (96, 1), '子': (97, 0), '丑': (97, 1)}


def locator(month, pillar):
    item, second = ITEM[month]
    leaf = (73 if second else 6) + PILLARS.index(pillar)
    return {'item': f'060676{item}.cn', 'leaf': f'n{leaf}',
            'url': f'https://archive.org/download/060676{item}.cn/page/n{leaf}_w1200.jpg'}


with open(COMPOSE / 'context.tsv', encoding='utf-8') as f:
    context = list(csv.DictReader(f, delimiter='\t'))
by_ctx = {}
for r in context:
    by_ctx.setdefault(r['id'], []).append(r)

LOCKED = {'寅-乙亥': '06067692-n17.jpg', '午-丁未': '06067694-n49.jpg', '亥-壬寅': '06067696-n111.jpg'}
LIFT_NEW = ['申-己巳', '酉-乙巳', '未-己卯', '辰-戊寅']
JIESHA_NEW = ['丑-甲寅', '丑-丙寅', '丑-戊寅', '丑-壬寅']


def lift(ctx):
    r = next(r for r in by_ctx[ctx] if r['heading'] == '安葬')
    op = r['code'].split('xd=')[1].split(';')[0]
    assert r['state'] == 'neither_recorded' and op in ('重日', '復日'), (ctx, r)
    m, p = ctx.split('-')
    return {'context': ctx, 'operand': op, 'heading': '安葬', 'goldenState': r['state'],
            'predictLiftApplied': '安葬 absent from 忌 line',
            'ifPrinted': 'lift premise mismatch: the seven 德-lift H1-B pages become NOT_DISTINGUISHING',
            'source': 'yuebiao-witness-lock-v2 (reused)' if ctx in LOCKED else 'new',
            'yuebiao': locator(m, p)}


def jiesha(ctx):
    m, p = ctx.split('-')
    probe = sorted(r['heading'] for r in by_ctx[ctx]
                   if r['state'] == 'neither_recorded' and r['code'].endswith('xiangdi;xd=刼煞;suppressed:xiangdi'))
    return {'context': ctx, 'premiseProbe': probe, 'predict': 'under Golden v2 these headings are on neither line',
            'yuebiao': locator(m, p)}


out = {'version': 'h1b-yuebiao-premise-v1',
       'liftPremise': [lift(c) for c in [*LOCKED, *LIFT_NEW]],
       'jieshaClass': [jiesha(c) for c in JIESHA_NEW]}
(HERE / 'premise-predictions.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(len(out['liftPremise']), len(out['jieshaClass']))
