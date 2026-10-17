"""Full Golden P4, task 3.2d: dated operands and dated 忌 facts for 1,095 dates × 29 headings (2025–2027).

Independent of the engine:
- Month Jian / day pillar: the 3.1 presence Golden (calendar-day Jie convention).
- Lunar day: civil UTC+7 date of the latest USNO New Moon (SHA-locked), day 1 = that date; cross-checked
  on every 2025–2027 record of the frozen calendar reference.
- 朔弦望: civil UTC+7 date containing a USNO primary phase instant.
- 土王用事後: owner convention p4-soil-owner-convention-v1 (18 civil days before 四立, onset in, 四立 out),
  四立 dates from the frozen JPL solar terms, cross-checked against HKO tables.
Context 忌 facts stay in context-ji.tsv; rows here point to the context id.

    python3 -I docs/audits/sources/p4-vol10/p4-full-golden-v1/ji/dated_ji.py [--write]
"""
import csv
import datetime as dt
import hashlib
import importlib.util
import json
import re
import sys
from pathlib import Path

HERE = Path('docs/audits/sources/p4-vol10/p4-full-golden-v1/ji')
_spec = importlib.util.spec_from_file_location('context_ji', HERE / 'context_ji.py')
cj = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(cj)
sc = cj.sc

PRESENCE_DATED = Path('docs/audits/sources/p4-vol10/p4-full-golden-v1/presence/dated.tsv')
USNO = Path('docs/audits/sources/p4-vol10/usno-phase/normalized-response.json')
USNO_SHA = '66118ad3e7e40098fd75d39788583e1677f4992638bf7600cb1b75813e1d7504'
SOLAR = Path('golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json')
SOLAR_SHA = '1db7a155f147210cac9db6580e3893dd3603c3d08ac3bea61815af193e9c6a60'
CALENDAR = Path('shared/lunar/audit-fixtures/calendar-golden-v2.1.json')
LUNAR_DAY = Path('shared/almanac-data/p4-lunar-day-taboo-v1.json')
PHASE = Path('shared/almanac-data/p4-lunar-phase-authority-v1.json')
SOIL = Path('shared/almanac-data/p4-soil-owner-convention-v1.json')
G_LUNAR = Path('shared/almanac-data/golden-p4-lunar-day-v1.json')
G_PHASE = Path('shared/almanac-data/golden-p4-lunar-phase-v1.json')
G_SOIL = Path('shared/almanac-data/golden-p4-soil-owner-convention-v1.json')
HKO = Path('docs/audits/sources/p4-vol10/soil-hko')
TZ = dt.timezone(dt.timedelta(hours=7))
EPOCH = dt.datetime(1970, 1, 1, tzinfo=dt.timezone.utc)
LI_TERMS = {21: '立春', 3: '立夏', 9: '立秋', 15: '立冬'}


def sha256(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def phases():
    assert sha256(USNO) == USNO_SHA
    out = []
    for y in json.loads(USNO.read_text())['years']:
        for p in y['phasedata']:
            h, m = map(int, p['time'].split(':'))
            when = dt.datetime(p['year'], p['month'], p['day'], h, m, tzinfo=dt.timezone.utc)
            out.append((when.astimezone(TZ).date(), p['phase']))
    return sorted(out)


def li_dates():
    assert sha256(SOLAR) == SOLAR_SHA
    out = []
    for enc in json.loads(SOLAR.read_text())['rows']:
        f = enc.split('|')
        if int(f[1]) in LI_TERMS and 2024 <= int(f[0]) <= 2028:
            out.append(((EPOCH + dt.timedelta(milliseconds=int(f[4]))).astimezone(TZ).date(), LI_TERMS[int(f[1])]))
    return sorted(out)


def build():
    ph = phases()
    new_moons = [d for d, p in ph if p == 'New Moon']
    by_date_phase = {}
    for d, p in ph:
        by_date_phase.setdefault(d, []).append(p)
    lis = li_dates()
    soil_auth = json.loads(SOIL.read_text(encoding='utf-8'))
    conv = soil_auth['convention']
    assert (conv['daysBeforeSiLi'], conv['includeOnset'], conv['includeLi']) == (18, True, False)
    soil_heads = [sc.norm(h) for h in soil_auth['headings']]
    lunar_rules = json.loads(LUNAR_DAY.read_text(encoding='utf-8'))['rules']
    phase_auth = json.loads(PHASE.read_text(encoding='utf-8'))
    H = cj.headings29()
    rows = []
    with PRESENCE_DATED.open(encoding='utf-8') as f:
        for r in csv.DictReader(f, delimiter='\t'):
            d = dt.date.fromisoformat(r['date'])
            nm = max(x for x in new_moons if x <= d)
            lunar_day = (d - nm).days + 1
            assert 1 <= lunar_day <= 30
            phase = ' '.join(by_date_phase.get(d, [])) or 'none'
            li, term = min((x for x in lis if x[0] > d), key=lambda x: x[0])
            soil = li - dt.timedelta(days=18) <= d < li
            for h in H:
                facts = []
                for rule in lunar_rules:
                    if sc.norm(rule['heading']) == h and lunar_day in rule['days']:
                        facts.append((rule['token'], 'lunar_day', rule['sourceActivity'], 'protected'))
                if sc.norm(phase_auth['heading']) == h and phase != 'none':
                    assert set(phase.split(' ')) <= {'New', 'Moon', 'First', 'Quarter', 'Full', 'Last'}
                    facts.append((phase_auth['inventoryToken'], 'phase', phase, 'protected'))
                if soil and h in soil_heads:
                    facts.append((soil_auth['inventoryToken'], 'soil', f'{term} {li}', 'protected'))
                rows.append({'date': r['date'], 'month_jian': r['month_jian'], 'pillar': r['pillar'],
                             'context': f"{r['month_jian']}-{r['pillar']}", 'heading': h, 'lunar_day': lunar_day,
                             'phase': phase, 'soil': 'present' if soil else 'absent',
                             'facts': ' '.join('|'.join(x) for x in facts)})
    return rows, H, lis


def self_check(rows, lis):
    by_date = {r['date']: r for r in rows}
    cal = [x for x in json.loads(CALENDAR.read_text())['records'] if '2025' <= x['date'] < '2028']
    for x in cal:
        assert by_date[x['date']]['lunar_day'] == x['lunar']['day'], (x['date'], by_date[x['date']]['lunar_day'])
    for c in json.loads(G_PHASE.read_text(encoding='utf-8'))['cases']:
        if c['date'] not in by_date:  # outside the 2025–2027 domain: the Golden expects unknown
            assert c['phase'] == 'unknown', c
            continue
        assert by_date[c['date']]['phase'] == c['phase'], c
    for c in json.loads(G_SOIL.read_text(encoding='utf-8'))['cases']:
        assert by_date[c['date']]['soil'] == c['presence'], c
    for p in json.loads(G_SOIL.read_text(encoding='utf-8'))['periods']:
        assert (dt.date.fromisoformat(p['li']), p['term']) in lis, p
    lunar_rules = json.loads(LUNAR_DAY.read_text(encoding='utf-8'))['rules']
    for c in json.loads(G_LUNAR.read_text(encoding='utf-8'))['cases']:
        hit = {r['sourceActivity'] for r in lunar_rules if c['day'] in r['days']}
        assert ('剃頭' in hit) == c['haircut'] and ('求醫療病' in hit) == c['medical'], c
    # HKO cross-check of 四立 civil dates (UTC+8 tables vs UTC+7 project convention).
    hko_diff = []
    for li, term in lis:
        if 2025 <= li.year <= 2027:
            raw = (HKO / f'T{li.year}c.txt').read_text()
            line = next(l for l in raw.splitlines() if term in l)
            y, m, d = map(int, re.search(r'(\d+)年(\d+)月(\d+)日', line).groups())
            if dt.date(y, m, d) != li:
                hko_diff.append(str(li))
    assert not hko_diff, hko_diff
    # HKO daily tables (UTC+8): lunar day on every date. A mismatch could only come from a New Moon
    # between 23:00 and 24:00 Vietnam time; none occurs in 2025–2027.
    digits = dict(zip('一二三四五六七八九十', range(1, 11)))
    def hko_day(s):
        if s.endswith('月'):
            return 1
        if s in ('二十', '三十'):
            return digits[s[0]] * 10
        return {'初': 0, '十': 10, '廿': 20}[s[0]] + digits[s[1]]
    n_hko = 0
    for y in (2025, 2026, 2027):
        for line in (HKO / f'T{y}c.txt').read_text(encoding='utf-8-sig').splitlines():
            m = re.match(r'(\d+)年(\d+)月(\d+)日\s+(\S+)', line)
            if m:
                d = dt.date(*map(int, m.groups()[:3])).isoformat()
                assert by_date[d]['lunar_day'] == hko_day(m.group(4)), (d, m.group(4))
                n_hko += 1
    assert n_hko == len(by_date)
    return len(cal)


def files():
    rows, H, lis = build()
    n_cal = self_check(rows, lis)
    head = ['date', 'month_jian', 'pillar', 'context', 'heading', 'lunar_day', 'phase', 'soil', 'facts']
    text = '\t'.join(head) + '\n' + ''.join('\t'.join(str(r[k]) for k in head) + '\n' for r in rows)
    dates = {r['date']: r for r in rows}
    summary = {
        'stage': '3.2d dated 忌 facts',
        'inputs': {str(p): sha256(p) for p in [HERE / 'context_ji.py', PRESENCE_DATED, USNO, SOLAR, CALENDAR,
                                               LUNAR_DAY, PHASE, SOIL, G_LUNAR, G_PHASE, G_SOIL]},
        'rows': len(rows), 'dates': len(dates),
        'phaseDays': sum(r['phase'] != 'none' for r in dates.values()),
        'soilDays': sum(r['soil'] == 'present' for r in dates.values()),
        'lunarDay12or15': sum(r['lunar_day'] in (12, 15) for r in dates.values()),
        'checks': {'calendarReferenceLunarDays': n_cal, 'goldenPhase': 13, 'goldenSoil': 48, 'goldenLunarDay': 9,
                   'hko四立': 'all 2025–2027 四立 civil dates equal',
                   'hkoLunarDays': 'all 1,095 dates equal'},
    }
    return {HERE / 'dated-ji.tsv': text,
            HERE / 'dated-ji-summary.json': json.dumps(summary, ensure_ascii=False, indent=1) + '\n'}


def main():
    fs = files()
    if '--write' in sys.argv:
        for p, t in fs.items():
            p.write_text(t, encoding='utf-8')
        print('wrote', len(fs))
        return
    for p, t in fs.items():
        assert p.read_text(encoding='utf-8') == t, f'{p} differs'
    print('verified', len(fs))


if __name__ == '__main__':
    main()
