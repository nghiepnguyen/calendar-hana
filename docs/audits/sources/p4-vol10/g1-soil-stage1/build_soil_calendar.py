"""G1-SOIL Stage 1 (audit only): independent 土王用事 calendar from the frozen JPL solar-term rows.

    python3 -I docs/audits/sources/p4-vol10/g1-soil-stage1/build_soil_calendar.py [--write]

Derivation 2 (calendar 1 is production shared/lunar/thoVuongDungSu.ts, compared in
shared/lunar/p4G1SoilStage1Audit.test.ts). Reads golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json rows
directly (no engine import): 立 instant (clock-v1 civil epoch ms) → civil date at the project's fixed UTC+7
(shared/lunar/lunar.ts TIME_ZONE_OFFSET) → window [立 − 18, 立 − 1] (rule: soil-rule.json).
Also: boundary cases for representative years, and a sensitivity count of the 5 excluded demolition contexts
under rejected / project-convention alternatives. --write writes soil-calendar.json, soil-boundaries.tsv,
soil-sensitivity.json; default verifies them.
"""
import hashlib
import json
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

OUT = Path('docs/audits/sources/p4-vol10/g1-soil-stage1')
JPL = Path('golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json')
SCOPE = Path('docs/audits/sources/p4-vol10/puzhu17-bujiang-v1/scope-dates.json')
SI_LI = {21: '立春', 3: '立夏', 9: '立秋', 15: '立冬'}
EXCLUDED = ['丑-甲寅', '丑-丙寅', '丑-壬寅', '丑-戊寅', '未-戊申']
BR = '子丑寅卯辰巳午未申酉戌亥'

jpl_raw = JPL.read_bytes()
rows = [r.split('|') for r in json.loads(jpl_raw)['rows']]
li = {}  # (year, termIndex) -> civil epoch ms
for year, idx, _root, _tt, civil_ms, _iso, _regime, _settled in rows:
    if int(idx) in SI_LI:
        li[(int(year), int(idx))] = int(civil_ms)


def civil(ms, offset_h):
    return (datetime.fromtimestamp(ms / 1000, tz=timezone.utc) + timedelta(hours=offset_h)).date()


def windows(year, offset_h=7, instant_onset=False):
    """Four windows of a civil year. instant_onset: the rejected 2-hour reading of 「前一辰」 (onset = civil date of
    立 instant − 2 h − 18 d, end unchanged)."""
    out = []
    for idx in (21, 3, 9, 15):
        ms = li[(year, idx)]
        d_li = civil(ms, offset_h)
        onset = civil(ms - 2 * 3600_000 - 18 * 86400_000, offset_h) if instant_onset else d_li - timedelta(18)
        out.append({'term': SI_LI[idx], 'termIndex': idx, 'li': d_li.isoformat(), 'onset': onset.isoformat(),
                    'eve': (d_li - timedelta(1)).isoformat()})
    return out


def days_of(year, **kw):
    s = set()
    for w in windows(year, **kw):
        d = date.fromisoformat(w['onset'])
        while d <= date.fromisoformat(w['eve']):
            s.add(d.isoformat())
            d += timedelta(1)
    return s


YEARS = range(1900, 2101)
base = {y: windows(y) for y in YEARS}
all_days = sorted(d for y in YEARS for d in days_of(y))
# Structural checks: 4 windows of exactly 18 days a year, all inside the civil year, disjoint.
for y, ws in base.items():
    assert len(ws) == 4
    for w in ws:
        n = (date.fromisoformat(w['eve']) - date.fromisoformat(w['onset'])).days + 1
        assert n == 18 and w['onset'][:4] == str(y), (y, w)
assert len(all_days) == len(set(all_days)) == 201 * 72

calendar = {
    'version': 'g1-soil-stage1-calendar-v1',
    'derivation': 'independent: frozen JPL DE440s rows (clock-v1) read directly; UTC+7 civil date; [立−18, 立−1]',
    'input': {'path': str(JPL), 'sha256': hashlib.sha256(jpl_raw).hexdigest()},
    'range': ['1900-01-01', '2100-12-31'],
    'totalDays': len(all_days),
    'daysPerYear': sorted({len(days_of(y)) for y in YEARS}),
    'windowsPerYear': 4,
    'datesSha256': hashlib.sha256('\n'.join(all_days).encode()).hexdigest(),
    'windows': {str(y): base[y] for y in YEARS},
}

# Boundary cases (spec §7): around each window, representative years.
bt = ['year\tterm\tcase\tdate\tinside']
inside = set(all_days)
for y in (1900, 2024, 2025, 2026, 2027, 2028, 2100):
    for w in base[y]:
        on, ev = date.fromisoformat(w['onset']), date.fromisoformat(w['eve'])
        for case, d in (('day_before_entry', on - timedelta(1)), ('entry', on), ('second', on + timedelta(1)),
                        ('penultimate', ev - timedelta(1)), ('final', ev), ('day_after_exit_li', ev + timedelta(1))):
            bt.append(f"{y}\t{w['term']}\t{case}\t{d.isoformat()}\t{'1' if d.isoformat() in inside else '0'}")
for line in bt[1:]:
    case, flag = line.split('\t')[2], line.split('\t')[4]
    assert flag == ('0' if case in ('day_before_entry', 'day_after_exit_li') else '1'), line

# Sensitivity on the 5 excluded contexts (502 occurrences): which dates change in/out under each alternative.
scope = json.loads(SCOPE.read_text(encoding='utf-8'))
occ = sorted((d, c) for c in EXCLUDED for d in scope[c])
alts = {
    'utc8_li_date': lambda y: days_of(y, offset_h=8),
    'instant_onset_2h_rejected': lambda y: days_of(y, instant_onset=True),
}
sens = {'occurrences': len(occ),
        'inside': sum(d in inside for d, _ in occ), 'outside': sum(d not in inside for d, _ in occ),
        'perContext': {c: {'inside': sum(1 for d, x in occ if x == c and d in inside),
                           'outside': sum(1 for d, x in occ if x == c and d not in inside)} for c in EXCLUDED},
        'alternatives': {}}
for name, fn in alts.items():
    alt = {d for y in YEARS for d in fn(y)}
    flips = [{'date': d, 'context': c, 'base': d in inside, 'alt': d in alt} for d, c in occ
             if (d in inside) != (d in alt)]
    whole = len(alt ^ inside)
    sens['alternatives'][name] = {'windowDaysDiffering': whole, 'fiveContextFlips': len(flips), 'flips': flips}
sens['notAdopted'] = {
    'hengqi_mean_terms': '恆氣 is the Ming 大統 practice; 協紀 is a Qing 時憲 work on 定氣 (true terms), the project-wide basis',
    'solar_longitude_297_27_117_207': 'modern 土用 rule, not in 協紀',
}


def main():
    texts = {'soil-calendar.json': json.dumps(calendar, ensure_ascii=False, indent=1) + '\n',
             'soil-boundaries.tsv': '\n'.join(bt) + '\n',
             'soil-sensitivity.json': json.dumps(sens, ensure_ascii=False, indent=1) + '\n'}
    for k, v in texts.items():
        if '--write' in sys.argv:
            (OUT / k).write_text(v, encoding='utf-8')
        else:
            assert (OUT / k).read_text(encoding='utf-8') == v, f'{k} differs'
    print('calendar', calendar['totalDays'], calendar['datesSha256'][:16], 'sensitivity',
          {k: v['fiveContextFlips'] for k, v in sens['alternatives'].items()}, sens['inside'], sens['outside'])


if __name__ == '__main__':
    main()
