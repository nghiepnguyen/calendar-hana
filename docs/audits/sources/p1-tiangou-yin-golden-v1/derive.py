"""P1 天狗寅日 Golden v1 (tasks/prd-p1-tiangou-yin.md §5). Independent of the engine: day branch by date
arithmetic (2000-01-07 = 甲子), P4 state from the frozen Full Golden v2 dated.tsv. Writes the JSON to stdout.

Run from the repo root: python3 -I docs/audits/sources/p1-tiangou-yin-golden-v1/derive.py
"""
import csv
import datetime as dt
import hashlib
import json
import sys

VOL10 = 'docs/audits/sources/p4-vol10/vol10.raw.txt'
DATED = 'docs/audits/sources/p4-vol10/p4-full-golden-v2/compose/dated.tsv'
CLAUSE = '凡天狗寅日忌祭祀不註宜求福祈嗣'
OFFSET = 21876
BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
ACTIVITIES = {'pray_blessing': '祈福', 'pray_children': '求嗣'}
LIFTED_BY_P4 = {'only_ji', 'neither_recorded'}  # adapter lifts positives on these (PRD 8 §6.5)


def branch(date):
    return BRANCHES[(dt.date.fromisoformat(date) - dt.date(2000, 1, 7)).days % 12]


def main():
    raw = open(VOL10, encoding='utf-8').read()
    assert raw[OFFSET:OFFSET + len(CLAUSE)] == CLAUSE
    sha1 = hashlib.sha1(open(VOL10, 'rb').read()).hexdigest()
    assert sha1.startswith('355dc6c8fe2d'), sha1

    state = {}
    with open(DATED, encoding='utf-8') as f:
        for row in csv.DictReader(f, delimiter='\t'):
            if row['heading'] in ACTIVITIES.values():
                assert branch(row['date']) == row['pillar'][1], row
                state[(row['date'], row['heading'])] = row['state']

    yin = sorted({d for d, _ in state if branch(d) == '寅'})
    assert len(yin) == 91, len(yin)
    by_state = {}
    for d in yin:
        s = {state[(d, h)] for h in ACTIVITIES.values()}
        assert len(s) == 1, d  # 祈福 and 求嗣 share the state on every 寅 day
        by_state.setdefault(s.pop(), []).append(d)
    assert set(by_state) == {'only_ji', 'neither_recorded', 'not_recorded'}, by_state.keys()

    picks = by_state['only_ji'][::12] + by_state['neither_recorded'][::4] + by_state['not_recorded'][::5]
    outside = [d for y in (2024, 2028, 2035) for d in
               [str(dt.date(y, 1, 1) + dt.timedelta(n)) for n in range(366)] if branch(d) == '寅'][::9]
    controls = ['2025-03-08', '2026-07-14', '2024-05-20', '2028-09-03']
    assert all(branch(d) != '寅' for d in controls)

    cases = []
    for d in sorted(picks + outside + controls):
        yin_day = branch(d) == '寅'
        p4 = state.get((d, '祈福')) if yin_day else None
        for a in (*ACTIVITIES, 'worship'):
            target = yin_day and a in ACTIVITIES
            cases.append({
                'date': d,
                'dayBranch': branch(d),
                'activityId': a,
                'p4State': p4 if a in ACTIVITIES else None,
                # Every expectation below holds with the P4 flag ON and OFF (D3).
                'appliedPositiveRows': 0 if target else None,
                'p1Rows': ('none_p4_lifted' if p4 in LIFTED_BY_P4 else 'only_lifted_positives')
                if target else 'none',
                'statusNotRecommended': target,
            })
    json.dump({
        'version': 'golden-p1-tiangou-yin-v1',
        'status': 'FROZEN_BEFORE_CODE',
        'frozenAt': '2026-10-19',
        'source': {
            'text': CLAUSE, 'offset': OFFSET, 'file': VOL10, 'sha1': sha1,
            'work': '欽定協紀辨方書 (四庫全書本) 卷十 鋪註條例, Wikisource action=raw',
        },
        'marker': {'classicalVersion': 'p1-tiangou-yin-v1', 'entry': 'puzhu:07', 'verdict': 'no_annotation'},
        'policy': 'tiangouYinNoYi',
        'derivation': (
            'Day branch from 2000-01-07 = 甲子 (date arithmetic mod 12), not from the engine. p4State from the '
            'frozen Full Golden v2 dated.tsv (2025–2027 only). Owner D1–D3 + FR-1..FR-8 (2026-10-19): on a 寅 day '
            'pray_blessing/pray_children keep no applied positive row; rows P1 lifts are informational with '
            'rawDelta > 0 and carry the marker; on P4-lifted days (only_ji/neither_recorded) P1 marks nothing '
            '(FR-8); worship and non-寅 days carry no marker; with the policy false no row carries it. Score and '
            'status follow the existing formula on the remaining rows (FR-3), checked by the test.'
        ),
        'cases': cases,
    }, sys.stdout, ensure_ascii=False, indent=1)
    sys.stdout.write('\n')


main()
