"""Full Golden P4, task 3.1: presence of the 35 xieji gods (21 dormant + 14 legacy).

Independent of the engine. Reads only:
- shared/almanac-data/xieji-god-definitions.json (quoted authority; not xieji-god-tables.json, the runtime table);
- the frozen JPL solar-term file pinned by yi-expected-v1 (Month Jian from exact Jie);
- the frozen calendar reference (day-pillar anchor, cross-checked on all 100 records);
- good-gods.json / bad-gods.json (catalog IDs and han, for the alias check only);
- golden-legacy-gods-month-jian.json (frozen Golden, oracle self-check only).
No TypeScript, resolver, evaluator or sweep TSV is read.

Default run verifies the committed bytes; --write regenerates.
Run from the repo root: python3 -I docs/audits/sources/p4-vol10/p4-full-golden-v1/presence/derive.py
"""
import bisect
import datetime as dt
import hashlib
import json
import sys
from pathlib import Path

OUT = Path('docs/audits/sources/p4-vol10/p4-full-golden-v1/presence')
DEFS = Path('shared/almanac-data/xieji-god-definitions.json')
SOLAR = Path('golden-v4/astronomy/solar-terms-jpl-de440s-clock-v1.json')
SOLAR_SHA = '1db7a155f147210cac9db6580e3893dd3603c3d08ac3bea61815af193e9c6a60'
CALENDAR = Path('shared/lunar/audit-fixtures/calendar-golden-v2.1.json')
CATALOG = [Path('shared/almanac-data/good-gods.json'), Path('shared/almanac-data/bad-gods.json')]
LEGACY = Path('shared/almanac-data/golden-legacy-gods-month-jian.json')

STEMS = '甲乙丙丁戊己庚辛壬癸'
BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
MONTHS = '寅卯辰巳午未申酉戌亥子丑'
PILLARS = [STEMS[i % 10] + BRANCHES[i % 12] for i in range(60)]
TZ = dt.timezone(dt.timedelta(hours=7))
EPOCH = dt.datetime(1970, 1, 1, tzinfo=dt.timezone.utc)
ANCHOR = {'date': '1900-01-01', 'pillar': '甲戌', 'jdn': 2415021}  # same anchor as yi-expected-v1 source-basis
FIRST, LAST = dt.date(2025, 1, 1), dt.date(2027, 12, 31)

# Spec §5 groups; the definitions file lists them in this order.
DORMANT = ['thien_nguyen', 'tu_tuong', 'thoi_duc', 'ngu_hop', 'bat_tuong', 'thien_thuong', 'pho_ho',
           'tai_sat', 'nguyet_sat', 'nguyet_hai', 'nguyet_yem', 'yem_doi', 'dai_thoi', 'tu_phe', 'tu_ky',
           'tu_cung', 'ngu_mo', 'ngu_ly', 'vang_vong', 'bat_chuyen', 'quy_ky']
LEGACY_IDS = ['thien_xa', 'nguyet_an', 'dan_nhat', 'tam_hop', 'thien_hy', 'luc_hop', 'ngu_phu', 'giai_than',
              'phuc_sinh', 'thanh_tam', 'ich_hau', 'tuc_the', 'nguyet_hinh', 'thien_lai']
# Same-position names stated in each definition's operand note.
ALIASES = {'月虛': 'nguyet_sat', '地火': 'nguyet_yem', '招搖': 'yem_doi', '大敗': 'dai_thoi', '咸池': 'dai_thoi',
           '天獄': 'tai_sat'}


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_rules():
    items = json.loads(DEFS.read_text(encoding='utf-8'))['items']
    assert [i['id'] for i in items] == DORMANT + LEGACY_IDS
    rules = {}
    for item in items:
        kind = item['operand']['day']
        assert kind in ('DAY_PILLAR', 'DAY_STEM', 'DAY_BRANCH'), item['id']
        table = item['table']
        assert sorted(table, key=int) == [str(m) for m in range(1, 13)], item['id']
        for month, values in item.get('excluded', {}).items():
            assert not set(values) & set(table[month]), (item['id'], 'excluded value still in table')
        for values in table.values():
            assert values and len(set(values)) == len(values), item['id']
            alphabet = PILLARS if kind == 'DAY_PILLAR' else STEMS if kind == 'DAY_STEM' else BRANCHES
            assert all(v in alphabet for v in values), item['id']
        if item['operand']['month'] == 'NONE':
            assert len({tuple(sorted(v)) for v in table.values()}) == 1, item['id']
        if item['operand']['month'] == 'SEASON':  # one value set per 3-month season block
            for s in range(4):
                assert len({tuple(sorted(table[str(3 * s + k)])) for k in (1, 2, 3)}) == 1, item['id']
        rules[item['id']] = (item['han'], kind, {MONTHS[int(m) - 1]: set(v) for m, v in table.items()})
    return rules


def present(rules, ids, month, pillar):
    part = {'DAY_PILLAR': pillar, 'DAY_STEM': pillar[0], 'DAY_BRANCH': pillar[1]}
    return [g for g in ids if part[rules[g][1]] in rules[g][2][month]]


def jdn(day):
    shift = (14 - day.month) // 12
    year = day.year + 4800 - shift
    month = day.month + 12 * shift - 3
    return day.day + (153 * month + 2) // 5 + 365 * year + year // 4 - year // 100 + year // 400 - 32045


def pillar_of(day):
    return PILLARS[(PILLARS.index(ANCHOR['pillar']) + jdn(day) - ANCHOR['jdn']) % 60]


def load_jie():
    assert sha256(SOLAR) == SOLAR_SHA
    jie = []
    for encoded in json.loads(SOLAR.read_text())['rows']:
        f = encoded.split('|')
        year, term = int(f[0]), int(f[1])
        if term % 2:  # odd termIndex = Jie, starts a Month Jian
            jie.append((int(f[4]), MONTHS[((term - 21) % 24) // 2], year, term, f[5]))
    assert [r[0] for r in jie] == sorted(r[0] for r in jie)
    return jie


def month_at(jie, ms):
    return jie[bisect.bisect_right([r[0] for r in jie], ms) - 1][1]


def ms_of(when):
    return (when - EPOCH) // dt.timedelta(milliseconds=1)


def check_calendar():
    records = json.loads(CALENDAR.read_text())['records']
    vn_s = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý']
    vn_b = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi']
    assert records[0]['date'] == ANCHOR['date']
    for r in records:
        day = dt.date.fromisoformat(r['date'])
        p = pillar_of(day)
        assert jdn(day) == r['julianDayNumber']
        assert f'{vn_s[STEMS.index(p[0])]} {vn_b[BRANCHES.index(p[1])]}' == r['canChi']['day'], r['date']
    return len(records)


def tsv(head, rows):
    return '\t'.join(head) + '\n' + ''.join('\t'.join(str(r[h]) for h in head) + '\n' for r in rows)


def build():
    rules = load_rules()
    jie = load_jie()
    calendar_records = check_calendar()
    every = DORMANT + LEGACY_IDS

    catalog = {}
    for path in CATALOG:
        for item in json.loads(path.read_text(encoding='utf-8'))['items']:
            catalog[item['id']] = item['han']
    for g in every:
        assert catalog.get(g) == rules[g][0], (g, 'catalog han differs')
    for alias, g in ALIASES.items():
        assert alias in json.dumps(json.loads(DEFS.read_text(encoding='utf-8'))['items'][every.index(g)]['operand'],
                                   ensure_ascii=False), alias
        assert alias not in {rules[x][0] for x in every}, (alias, 'alias is itself a catalog god')

    context = []
    for month in MONTHS:
        for pillar in PILLARS:
            context.append({'id': f'{month}-{pillar}', 'month_jian': month, 'pillar': pillar,
                            'dormant': ' '.join(present(rules, DORMANT, month, pillar)),
                            'legacy': ' '.join(present(rules, LEGACY_IDS, month, pillar))})

    dated = []
    day = FIRST
    while day <= LAST:
        start = dt.datetime(day.year, day.month, day.day, tzinfo=TZ)
        # Calendar-day convention (yi-dated-inputs-v1): the Jie civil day carries the new Month Jian all day.
        month = month_at(jie, ms_of(start + dt.timedelta(days=1)) - 1)
        noon = month_at(jie, ms_of(start + dt.timedelta(hours=12)))
        pillar = pillar_of(day)
        row = {'date': day.isoformat(), 'pillar': pillar, 'month_jian': month, 'noon_month_jian': noon,
               'dormant': ' '.join(present(rules, DORMANT, month, pillar)),
               'legacy': ' '.join(present(rules, LEGACY_IDS, month, pillar)),
               'noon_dormant': '', 'noon_legacy': ''}
        if noon != month:
            row['noon_dormant'] = ' '.join(present(rules, DORMANT, noon, pillar))
            row['noon_legacy'] = ' '.join(present(rules, LEGACY_IDS, noon, pillar))
        dated.append(row)
        day += dt.timedelta(days=1)

    boundary = []
    for ms, month_after, year, term, iso in jie:
        if not FIRST.year <= year <= LAST.year:
            continue
        before = None
        for offset in (-1, 0, 1):
            when = EPOCH + dt.timedelta(milliseconds=ms + offset)
            month = month_at(jie, ms + offset)
            pillar = pillar_of(when.astimezone(TZ).date())
            ids = present(rules, DORMANT, month, pillar)
            boundary.append({'jie': f'{year}-T{term:02d}', 'jie_utc': iso, 'offset_ms': offset,
                             'instant_utc': when.isoformat(timespec='milliseconds').replace('+00:00', 'Z'), 'month_jian': month,
                             'pillar': pillar, 'dormant': ' '.join(ids),
                             'added': ' '.join(g for g in ids if before is not None and g not in before),
                             'removed': ' '.join(g for g in (before or []) if g not in ids)})
            before = ids
        assert boundary[-3]['month_jian'] != boundary[-2]['month_jian'] == boundary[-1]['month_jian'] == month_after

    # Real 2025-2027 Jie crossings do not flip every god (season/pillar gods rarely sit on a Jie day).
    # Structural witness per dormant god and per Month Jian transition: abstract (before, after, pillar)
    # tuples, not real dates. Each transition gets the first pillar turning on and off, or, when the god
    # cannot change there (month NONE, same season), the first pillar that stays present.
    structural = []
    for g in DORMANT:
        for k, after in enumerate(MONTHS):
            prior = MONTHS[k - 1]
            states = [(p, g in present(rules, [g], prior, p), g in present(rules, [g], after, p)) for p in PILLARS]
            picks = [(kind, next((p for p, b, a in states if (b, a) == want), None))
                     for kind, want in (('on', (False, True)), ('off', (True, False)))]
            if not any(p for _, p in picks):
                picks = [('stable', next(p for p, b, a in states if b and a))]
            for kind, p in picks:
                if p:
                    b = g in present(rules, [g], prior, p)
                    structural.append({'god': g, 'kind': kind, 'month_before': prior, 'month_after': after,
                                       'pillar': p, 'before': str(b).lower(), 'at': str(not b if kind != 'stable' else b).lower(),
                                       'after': str(not b if kind != 'stable' else b).lower()})
    for g in DORMANT:
        assert any(r['god'] == g for r in structural), g

    # Oracle self-check against the frozen Release A Golden (14 legacy gods, Month Jian).
    by_date = {r['date']: r for r in dated}
    legacy_cases = json.loads(LEGACY.read_text(encoding='utf-8'))['cases']
    for case in legacy_cases:
        r = by_date[case['date']]
        assert (r['pillar'], r['month_jian']) == (case['pillar'], case['monthJian']), case
        assert (case['god'] in r['legacy'].split()) == case['present'], case

    count = lambda rows, key, g: sum(g in r[key].split() for r in rows)
    summary = {
        'version': 'p4-full-golden-v1/presence',
        'inputs': {str(p): sha256(p) for p in [DEFS, SOLAR, CALENDAR, *CATALOG, LEGACY]},
        'domains': {'context720': len(context), 'dated1095': len(dated), 'jieBoundary': len(boundary),
                    'structuralBoundary': len(structural)},
        'structuralKinds': {g: sorted({r['kind'] for r in structural if r['god'] == g}) for g in DORMANT},
        'jieCrossings': len(boundary) // 3,
        'jieDaysNoonDiffers': [r['date'] for r in dated if r['noon_month_jian'] != r['month_jian']],
        'contextPresent': {g: count(context, 'dormant' if g in DORMANT else 'legacy', g) for g in every},
        'datedPresent': {g: count(dated, 'dormant' if g in DORMANT else 'legacy', g) for g in every},
        'checks': {'calendarRecords': calendar_records, 'legacyGoldenCases': len(legacy_cases),
                   'aliases': ALIASES, 'catalogHanMatches': len(every)},
    }
    return {
        OUT / 'context.tsv': tsv(['id', 'month_jian', 'pillar', 'dormant', 'legacy'], context),
        OUT / 'dated.tsv': tsv(['date', 'pillar', 'month_jian', 'noon_month_jian', 'dormant', 'legacy',
                                'noon_dormant', 'noon_legacy'], dated),
        OUT / 'jie.tsv': tsv(['jie', 'jie_utc', 'offset_ms', 'instant_utc', 'month_jian', 'pillar', 'dormant',
                              'added', 'removed'], boundary),
        OUT / 'structural.tsv': tsv(['god', 'kind', 'month_before', 'month_after', 'pillar', 'before', 'at', 'after'],
                                    structural),
        OUT / 'summary.json': json.dumps(summary, ensure_ascii=False, indent=1) + '\n',
    }


def main():
    files = build()
    if '--write' in sys.argv:
        for path, text in files.items():
            path.write_text(text, encoding='utf-8')
        print('wrote', len(files), 'files')
        return
    for path, text in files.items():
        assert path.read_text(encoding='utf-8') == text, f'{path} differs; rerun with --write'
    print('verified', len(files), 'files')


if __name__ == '__main__':
    main()
