"""H1-B prediction freeze: read Golden v2 compose output, write predictions.json.

Run: python3 -I docs/audits/sources/p4-vol10/h1b-yuebiao-witness-v1/build_predictions.py
Reads only frozen Golden v2 TSVs; never the engine.
"""
import csv
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
COMPOSE = HERE.parent / 'p4-full-golden-v2' / 'compose'
STEMS, BRANCHES = '甲乙丙丁戊己庚辛壬癸', '子丑寅卯辰巳午未申酉戌亥'
PILLARS = [STEMS[i % 10] + BRANCHES[i % 12] for i in range(60)]
# 月表 卷二十–三十一: two Month Jian per Internet Archive item, leaf n6+i / n73+i (yuebiao-witness-lock-v2).
ITEM = {'寅': (92, 0), '卯': (92, 1), '辰': (93, 0), '巳': (93, 1), '午': (94, 0), '未': (94, 1),
        '申': (95, 0), '酉': (95, 1), '戌': (96, 0), '亥': (96, 1), '子': (97, 0), '丑': (97, 1)}


def rows(name):
    with open(COMPOSE / name, encoding='utf-8') as f:
        return list(csv.DictReader(f, delimiter='\t'))


def locator(month, pillar):
    item, second = ITEM[month]
    leaf = (73 if second else 6) + PILLARS.index(pillar)
    return {'item': f'060676{item}.cn', 'leaf': f'n{leaf}',
            'url': f'https://archive.org/download/060676{item}.cn/page/n{leaf}_w1200.jpg'}


changes = rows('h1b-changes.tsv')
dated = rows('dated.tsv')
context = rows('context.tsv')
by_date = {(r['date'], r['heading']): r for r in dated}
by_ctx = {}
for r in context:
    by_ctx.setdefault(r['id'], []).append(r)

targets = {}
for c in changes:
    if c['final_state'] != 'only_ji':
        continue
    if c['domain'] == 'context':
        key = (c['id'], c['heading'])
    else:
        d = by_date[(c['id'], c['heading'])]
        key = (f"{d['month_jian']}-{d['pillar']}", c['heading'])
    t = targets.setdefault(key, {'dates': [], 'contextRow': False, 'ji': c['unprotected_ji'], 'xiangdi': c['xiangdi']})
    if c['domain'] == 'context':
        t['contextRow'] = True
    else:
        t['dates'].append(c['id'])

out = []
for (ctx, heading), t in sorted(targets.items()):
    month, pillar = ctx.split('-')
    sub = 'H1-alpha' if 'youwei_convention' in t['ji'] else 'H1-beta'
    # Premise probe: headings Golden v2 marks neither_recorded purely by the same 相抵 subject.
    probe = sorted(r['heading'] for r in by_ctx.get(ctx, [])
                   if r['state'] == 'neither_recorded' and r['code'].endswith(f"xiangdi;xd={t['xiangdi']};suppressed:xiangdi"))
    out.append({
        'context': ctx, 'monthJian': month, 'pillar': pillar, 'heading': heading,
        'dates': sorted(t['dates']), 'contextRow': t['contextRow'],
        'xiangdiOperand': t['xiangdi'], 'survivingJi': t['ji'], 'gate': sub,
        'predictH1B': 'heading printed on 忌 line, not on 宜 line',
        'predictWholeHeadingXiangdi': 'heading on neither 忌 nor 宜 line',
        'propagation': 'none (final only_ji has no propagation target)',
        'distinguishing': True,
        'premiseProbe': {'xiangdiOnlyHeadings': probe,
                         'predict': 'under Golden v2 these headings are on neither line'},
        'yuebiao': locator(month, pillar),
    })

non = [c for c in changes if c['final_state'] != 'only_ji']
summary = {
    'version': 'h1b-yuebiao-predictions-v1',
    'golden': 'p4-full-golden-v2 (c574e57), compose/h1b-changes.tsv',
    'counts': {
        'h1bRows': {'dated': sum(c['domain'] == 'dated' for c in changes),
                    'context': sum(c['domain'] == 'context' for c in changes)},
        'h1bContexts': len({c['id'] for c in changes if c['domain'] == 'context'}),
        'distinguishingRows': {'dated': sum(c['domain'] == 'dated' and c['final_state'] == 'only_ji' for c in changes),
                               'context': sum(c['domain'] == 'context' and c['final_state'] == 'only_ji' for c in changes)},
        'distinguishingTargets': len(out),
        'distinguishingPages': len({o['context'] for o in out}),
        'nonDistinguishingRows': len(non),
    },
    'nonDistinguishing': 'Rows ending neither_recorded (via puzhu:20/22 propagation or 相抵) read the same under both hypotheses; not counted as confirmation.',
    'targets': out,
}
(HERE / 'predictions.json').write_text(json.dumps(summary, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(json.dumps(summary['counts'], ensure_ascii=False))
