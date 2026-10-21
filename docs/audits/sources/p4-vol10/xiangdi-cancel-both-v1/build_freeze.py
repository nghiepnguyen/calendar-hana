"""相抵 / cancel_both audit: freeze the 劫煞 contradiction found by the H1-B witness review.

Run: python3 -I docs/audits/sources/p4-vol10/xiangdi-cancel-both-v1/build_freeze.py
Reads frozen Golden v2 compose TSVs and the H1-B witness lock only; never the engine.
Production equals Golden v2 here: p4-owner-rules-summary.json reports 0 mismatches.
"""
import csv
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
P4 = HERE.parent
COMPOSE = P4 / 'p4-full-golden-v2' / 'compose'
LOCK = P4 / 'h1b-yuebiao-witness-v1' / 'lock.json'
VIRTUE = ('天德', '月德', '天德合', '月德合')  # 德神 named by the 劫煞 clause
OTHER_GOOD = ('時德', '四相', '天願', '六合', '天赦', '月恩', '天恩', '鳴吠', '鳴吠對')


def rows(name):
    with open(COMPOSE / name, encoding='utf-8') as f:
        return list(csv.DictReader(f, delimiter='\t'))


lock = json.loads(LOCK.read_text(encoding='utf-8'))
term = lock['headingTerms']['map']
pages = {f"{p['monthJian']}-{p['pillar']}": p for p in lock['pages']
         if p['monthJian'] in '辰戌未丑' and '劫煞' in p['xiongShen']}
context = rows('context.tsv')
dated = rows('dated.tsv')
dates = {}
for r in dated:
    dates.setdefault(f"{r['month_jian']}-{r['pillar']}", {}).setdefault(r['heading'], []).append((r['date'], r['state'], r['code']))


def category(state, printed, code):
    if printed is None:
        return 'NOT_COMPARED'
    other_ji = 'ji=' in code
    if state == 'neither_recorded' and printed:
        return 'B_AMBIGUOUS' if other_ji else 'A_CONTRADICTION'
    if state == 'neither_recorded' and not printed:
        return 'C_MATCH'
    if state in ('only_ji', 'both_present') and printed:
        return 'C_MATCH'
    return 'D_OTHER'


out = []
for r in context:
    page = pages.get(r['id'])
    xd = r['code'].split('xd=')[1].split(';')[0].split('+') if 'xd=' in r['code'] else []
    if not page or '刼煞' not in xd:
        continue
    t = term.get(r['heading'])
    printed = None if t is None else t in page['jiLine']
    out.append({
        'context': r['id'], 'monthJian': r['month_jian'], 'pillar': r['pillar'], 'officer': page['officer'],
        'virtue': [g for g in page['jiShen'] if g in VIRTUE],
        'otherGood': [g for g in page['jiShen'] if g in OTHER_GOOD],
        'heading': r['heading'], 'yueBiaoTerm': t,
        'goldenState': r['state'], 'productionState': r['state'],
        'yiEvidence': r['yi_evidence'], 'otherModelledJi': 'ji=' in r['code'], 'code': r['code'],
        'printedJi': printed, 'category': category(r['state'], printed, r['code']),
        'dated': [{'date': d, 'state': s, 'code': c} for d, s, c in dates.get(r['id'], {}).get(r['heading'], [])],
        'witness': {'path': page['path'], 'sha256': page['sha256']},
    })

summary = {}
for o in out:
    k = f"{o['monthJian']}|{o['category']}"
    summary[k] = summary.get(k, 0) + 1
freeze = {
    'version': 'xiangdi-cancel-both-freeze-v1',
    'golden': 'p4-full-golden-v2 (c574e57) compose/context.tsv + dated.tsv',
    'witnessLock': 'docs/audits/sources/p4-vol10/h1b-yuebiao-witness-v1/lock.json',
    'scope': 'context rows whose Golden code names 刼煞 as a 相抵 (xd) subject, on the 16 locked 劫煞 pages of months 辰/戌/未/丑',
    'pages': sorted(pages),
    'summary': dict(sorted(summary.items())),
    'rows': out,
}
(HERE / 'freeze.json').write_text(json.dumps(freeze, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(len(pages), len(out), json.dumps(freeze['summary'], ensure_ascii=False))
