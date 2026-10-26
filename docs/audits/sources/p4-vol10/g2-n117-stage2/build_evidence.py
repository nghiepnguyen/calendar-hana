"""G2-n117 Stage 2: targeted authority evidence for 未-戊申 × 立券交易 (audit only).

Run from the repo root: python3 -I docs/audits/sources/p4-vol10/g2-n117-stage2/build_evidence.py
Writes evidence.json and lock.json next to this script. Stage 1 (g2-n117-stage1/) is read, never written.

Printed columns come from the page records already committed in the witness locks, plus the Stage 1
manual re-reads. Pages this Stage re-read against the scan are flagged `scanReread`. Derived columns come
from the frozen puzhu:06 sweep (p4b-puzhu06-2025-2027.tsv) and its raw-忌 baseline; they are model output,
not print.
"""
import csv
import glob
import hashlib
import json
import os

HERE = os.path.relpath(os.path.dirname(os.path.abspath(__file__)))
P = 'docs/audits/sources/p4-vol10/'
S1 = P + 'g2-n117-stage1/'
LOCKS = [P + 'h1b-yuebiao-witness-v1/lock.json', P + 'yuebiao-witness-lock-v2.json',
         P + 'xiangdi-cancel-both-v1/witness-lock.json']
SUIBAO = P + 'puzhu-end-lock-v1.json'
SWEEP = 'docs/audits/p4b-puzhu06-2025-2027.tsv'
BASELINE = P + 'p4b-puzhu06-baseline-v1/baseline.tsv'
PUZHU06 = 'shared/almanac-data/p4b-puzhu06-v3.json'
VOL10 = P + 'vol10.raw.txt'
HEADS = ['開市', '立券交易', '納財']
# Re-read against the stored scan in Stage 2 (in addition to the Stage 1 re-reads).
REREAD_S2 = {'06067696-n63', '06067692-n93'}
# Decisive comparators named by the sweep; not stored in the repository.
TARGETS = [('戌', '壬申'), ('戌', '庚申')]

P21 = '凡吉凶相抵不註忌開市亦不註忌立劵交易納財不註忌納財亦不註忌開市立劵交易不註忌立劵交易亦不註忌開市納財'
P22 = '凡吉凶相抵不註忌開市立劵交易亦不註忌開倉庫出貨財如遇專忌之日則仍註忌'
P06 = '凡徳合赦願月恩四相時徳等日不註忌進人口安牀經絡醖釀開市立劵交易納財開倉庫出貨財如遇徳猶忌及從忌不從宜之日則仍註忌'


def sha(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def page_id(path):
    return os.path.basename(path).rsplit('.', 1)[0]


def records():
    """Every committed 月表 page record with god lists, keyed by page id (first lock wins)."""
    out = {}

    def walk(x, src):
        if isinstance(x, dict):
            if 'jiShen' in x and 'xiongShen' in x and x.get('path'):
                out.setdefault(page_id(x['path']), dict(x, lock=src))
            for v in x.values():
                walk(v, src)
        elif isinstance(x, list):
            for v in x:
                walk(v, src)

    for f in LOCKS:
        walk(json.load(open(f, encoding='utf-8')), f)
    return out


def main():
    s1 = json.load(open(S1 + 'evidence.json', encoding='utf-8'))
    vol11 = s1['vol11']['立劵交易']
    p06 = json.load(open(PUZHU06, encoding='utf-8'))
    triggers, wuli_lift = p06['triggers'], p06['liftLists']['五離']['quote']
    raw = open(VOL10, encoding='utf-8').read()
    recs = records()
    suibao = [x for x in json.load(open(SUIBAO, encoding='utf-8'))['pages'] if 'suibao-zhuzhen' in x['path']]
    s1_pages = {p['page']: p for p in s1['pages']}
    s1_texts = s1['pageTexts']

    sweep = list(csv.DictReader(open(SWEEP, encoding='utf-8'), delimiter='\t'))
    base = {}
    for r in csv.reader(open(BASELINE, encoding='utf-8'), delimiter='\t'):
        if len(r) > 10 and r[3] == '立券交易':
            base.setdefault((r[1], r[2]), (r[0], json.loads(r[10]) if r[10].startswith('[') else r[10]))

    def derived(month, pillar):
        rows = [r for r in sweep if r['month_jian'] == month and r['pillar'] == pillar and r['heading'] in HEADS]
        if not rows:
            return None
        first = min(r['date'] for r in rows)
        return {'dates': sorted({r['date'] for r in rows}), 'firstDate': first, **{
            r['heading']: {k: r[k] for k in ['triggers', 'classes', 'action', 'before_final_state', 'after_final_state',
                                            'after_final_protected_ji']}
            for r in rows if r['date'] == first},
            'rawJiSources立券交易': base.get((month, pillar), (None, None))[1]}

    matrix = []
    for pid, x in sorted(recs.items(), key=lambda t: (t[1].get('monthJian', ''), t[1].get('pillar', ''))):
        pillar = x.get('pillar', '')
        gods = list(x['jiShen']) + list(x['xiongShen'])
        if not (pillar.endswith('申') or pillar.endswith('酉')) and '五離' not in gods:
            continue
        text = s1_texts[pid]['ji'].replace('｜', '') if pid in s1_texts else x.get('jiLine', '').replace(' ', '')
        lifters = [g for g in gods if g in wuli_lift and g != '併則不忌']
        trig = [g for g in gods if g in triggers]
        matrix.append({
            'page': pid, 'context': f"{x.get('monthJian')}-{pillar}", 'officer': x.get('officer'),
            'sha256': sha(x['path']), 'lock': x['lock'],
            'scanReread': 'stage1' if pid in s1_pages else ('stage2' if pid in REREAD_S2 else 'prior transcription'),
            'wuli': '五離' in gods, 'wuliOwnLifters': lifters, 'puzhu06Triggers': trig,
            'puzhu06TriggerIsAlsoWuliLifter': bool(trig) and all(t in lifters for t in trig),
            'lijuanJiOperands': [g for g in gods if g in vol11['ji']],
            'lijuanYiOperands': [g for g in gods if g in vol11['yi']],
            'printedJi': {h: h in text for h in HEADS},
            'derived': derived(x.get('monthJian'), pillar),
        })
    for row in matrix:
        clean = (row['wuli'] and not row['wuliOwnLifters'] and row['lijuanJiOperands'] == ['五離']
                 and not row['lijuanYiOperands'] and row['puzhu06Triggers'])
        row['decisiveForQ4'] = clean

    evidence = {
        'version': 'g2-n117-stage2-v1',
        'stage1': {'commit': '3afb22d6ce367d1fe13713c1eb66dd35164cbbd4', 'ruling': s1['ruling'],
                   'evidenceSha256': sha(S1 + 'evidence.json')},
        'sweepScope': {
            'structuredPageRecords': len(recs), 'suibaoPages': len(suibao),
            'suibaoPillars': sorted({x.get('month', '') + '-' + x.get('pillar', '') for x in suibao}),
            'excluded': 'yi-*/ phase-clause/ shixian-tohoku/ g1-glyph-stage1/ g2-stage1/: 卷五/十/十一 or non-月表 scans',
            'shenYouPages': len(matrix),
        },
        'matrix': matrix,
        'decisiveStored': [r['page'] for r in matrix if r['decisiveForQ4']],
        'decisiveTargetsNotStored': [{'context': f'{m}-{p}', 'derived': derived(m, p)} for m, p in TARGETS],
        'puzhu06': {
            'text': P06, 'inVol10Raw': P06 in raw, 'triggers': triggers, 'wuliOwnLiftList': wuli_lift,
            'ownerDecision': p06['ownerDecision'], 'qlClass': p06['classes']['QL'],
        },
        'puzhu21': {'text': P21, 'inVol10Raw': P21 in raw, 'next': P22, 'nextInVol10Raw': P22 in raw},
        'runtimeObservation': {
            'note': 'resolveP4OwnerRulesDay via getP4DayHeadings (production P4 path), Stage 2 base 3afb22d; current behaviour, not authority',
            '2026-08-02 未戊申 立券交易': 'neither_recorded; rule H1-B (五離 忌 kept) then puzhu06 lift:QL; contract 50 neutral, kiep_sat and ngu_ly no_annotation',
            '2025-10-30 戌壬申 立券交易': 'not_recorded; ji [五離], puzhu06 lift:QL; contract 50 no_evidence',
            '2025-10-18 戌庚申 立券交易': 'not_recorded; ji [五離], puzhu06 lift:QL; contract 50 no_evidence',
            '2025-03-16 卯甲申 立券交易': 'only_ji protected (小耗 猶忌); contract 20 avoid, kiep_sat and ngu_ly applied',
        },
        'classification': 'C',
        'ruling': 'UNRESOLVED_CONFLICT',
        'ownerDecisionRequired': True,
        'productionState': 'BLANK / I1',
        'sourceWitnessed': False,
    }
    out = os.path.join(HERE, 'evidence.json')
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(evidence, f, ensure_ascii=False, indent=1)
        f.write('\n')
    files = [out, os.path.join(HERE, 'build_evidence.py'), S1 + 'evidence.json', S1 + 'lock.json', SWEEP, BASELINE,
             VOL10] + sorted({recs[r['page']]['path'] for r in matrix})
    with open(os.path.join(HERE, 'lock.json'), 'w', encoding='utf-8') as f:
        json.dump({'version': 'g2-n117-stage2-v1', 'files': {p: sha(p) for p in files}}, f, ensure_ascii=False, indent=1)
        f.write('\n')


if __name__ == '__main__':
    main()
