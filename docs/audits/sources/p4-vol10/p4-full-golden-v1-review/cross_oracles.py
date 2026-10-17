"""Task 5.0 (FR-05): cross-check the frozen full Golden against the P5 and P4-C Goldens, which derived the
same operands independently.

- P5 Golden context.tsv (720 × 2 soil states): presence of 天德 月德 天德合 月德合 天赦 天願 三合 滿日 收日 六合 五富
  天倉 月恩 四相 時德 開日 月煞 月厭, 甲日 and puzhu:28. 母倉 is skipped: P5 read it from yi-domains-v1, which the
  full Golden also uses as input, so it is not an independent witness.
- P4-C yi-composition-expected-v1 `dayOverride` (720 contexts): which contexts the puzhu:28 day rule applies to.

    python3 -I docs/audits/sources/p4-vol10/p4-full-golden-v1-review/cross_oracles.py
"""
import csv
import json
from pathlib import Path

G = Path('docs/audits/sources/p4-vol10/p4-full-golden-v1')
P5 = Path('docs/audits/sources/p4-vol10/p5-warehouse-golden-v1/context.tsv')
P4C = Path('docs/audits/sources/p4-vol10/yi-composition-expected-v1/expected.json')
DE = ['天德', '月德', '天德合', '月德合', '天赦', '天願', '月恩', '四相', '時德']
OFFICER = {'滿日': 'man', '收日': 'thu', '開日': 'khai'}
GOD = {'三合': 'tam_hop', '六合': 'luc_hop', '五富': 'ngu_phu', '天倉': 'thien_thuong', '月煞': 'nguyet_sat',
       '月厭': 'nguyet_yem'}


def read(p):
    with Path(p).open(encoding='utf-8') as f:
        return list(csv.DictReader(f, delimiter='\t'))


def main():
    ops = {(r['month_jian'], r['pillar']): r for r in read(G / 'ji/operands.tsv')}
    pres = {(r['month_jian'], r['pillar']): set((r['dormant'] + ' ' + r['legacy']).split())
            for r in read(G / 'presence/context.tsv')}
    p28 = {tuple(r['id'].split('-')): r['puzhu28'] == 'true' for r in read(G / 'ji/context-ji.tsv')}
    cells, mismatches = 0, []
    for r in read(P5):
        k = (r['month_jian'], r['pillar'])
        mine = {g: g in ops[k]['de'].split() for g in DE}
        mine.update({n: ops[k]['officer'] == o for n, o in OFFICER.items()})
        mine.update({n: gid in pres[k] for n, gid in GOD.items()})
        mine['甲日'] = k[1][0] == '甲'
        mine['puzhu28'] = p28[k]
        for col, v in mine.items():
            cells += 1
            if (r[col] == 'present') != v:
                mismatches.append((k, r['soil'], col, r[col], v))
    assert not mismatches, mismatches[:10]
    override = json.loads(P4C.read_text(encoding='utf-8'))['sections']['dayOverride']
    assert len(override) == 720
    bad = [c['id'] for c in override
           if c['expected']['applies'] != p28[(c['input']['monthJian'], c['input']['validPillar'])]]
    assert not bad, bad
    print(json.dumps({'p5PresenceCells': cells, 'p5Mismatches': 0, 'p5Rows': len(read(P5)),
                      'p4cDayOverride': len(override), 'p4cMismatches': 0,
                      'puzhu28Contexts': sum(p28.values())}, ensure_ascii=False))


if __name__ == '__main__':
    main()
