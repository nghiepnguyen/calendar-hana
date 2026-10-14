#!/usr/bin/env python3
"""Task 3.2 only: independent source arithmetic, never imports a project engine.

Default verifies existing expected.json. --write uses exclusive creation and cannot
replace existing expected bytes. This reference is audit tooling, not the future
presence evaluator. The basis is a manual raw/scan transcription, not a copy of
entry.predicate or production tables. Coverage labels are declarative contract
scenarios, not invented provider cutoffs or a committed runtime API.
"""
import argparse
import bisect
import collections
import copy
import datetime as dt
import hashlib
import json
import re
from pathlib import Path

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[4]
STEMS = '甲乙丙丁戊己庚辛壬癸'
BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
MONTHS = '寅卯辰巳午未申酉戌亥子丑'
PILLARS = [STEMS[i % 10] + BRANCHES[i % 12] for i in range(60)]
TZ = dt.timezone(dt.timedelta(hours=7))
EPOCH = dt.datetime(1970, 1, 1, tzinfo=dt.timezone.utc)
BASIS = json.loads((OUT / 'source-basis.json').read_text())
BY_HAN = {e['han']: e for e in BASIS['entries']}
SOLAR_PATH = BASIS['monthDerivation']['sourcePath']
SOLAR = json.loads((ROOT / SOLAR_PATH).read_text())
JIE = []
LI = []
for solar_index, encoded in enumerate(SOLAR['rows']):
    f = encoded.split('|')
    year, term = int(f[0]), int(f[1])
    if term % 2:
        ms = int(f[4])
        crossing = {'rowIndex': solar_index, 'year': year, 'termIndex': term,
                    'epochMs': ms, 'iso': f[5], 'ttMs': int(f[3]),
                    'month': MONTHS[((term - 21) % 24) // 2]}
        JIE.append(crossing)
        if term in [21, 3, 9, 15]:
            li_date = (EPOCH + dt.timedelta(milliseconds=ms)).astimezone(TZ).date()
            LI.append({**crossing, 'date': li_date,
                       'onset': li_date - dt.timedelta(days=18)})
JIE_MS = [r['epochMs'] for r in JIE]
FIXTURES = []


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def jdn(day):
    """Proleptic Gregorian integer noon JDN, no astronomy/calendar imports."""
    shift = (14 - day.month) // 12
    year = day.year + 4800 - shift
    month = day.month + 12 * shift - 3
    return (day.day + (153 * month + 2) // 5 + 365 * year + year // 4
            - year // 100 + year // 400 - 32045)


def dated_pillar(day):
    anchor = BASIS['dayPillarDerivation']
    index = (PILLARS.index(anchor['anchorPillar']) + jdn(day) - anchor['anchorJdn']) % 60
    return PILLARS[index], {'jdn': jdn(day), 'anchorJdn': anchor['anchorJdn'],
                            'elapsedDays': jdn(day) - anchor['anchorJdn'], 'index': index}


def month_at(ms):
    r = JIE[bisect.bisect_right(JIE_MS, ms) - 1]
    return r['month'], {'path': SOLAR_PATH, **r}


def soil_at(day):
    convention = BASIS['soilConvention']
    covered = convention['coverage'][0] <= day.isoformat() <= convention['coverage'][1]
    next_li = next(r for r in LI if r['date'] > day)
    present = next_li['onset'] <= day < next_li['date']
    return {'state': ('present' if present else 'absent') if covered else 'unknown',
            'authorityId': convention['authorityId'], 'status': convention['status'],
            'timezone': convention['timezone'], 'date': day.isoformat(),
            'coverage': 'inside' if covered else 'outside', 'validated': True,
            'nextLi': next_li['date'].isoformat(), 'onset': next_li['onset'].isoformat(),
            'sourcePath': SOLAR_PATH, 'sourceRowIndex': next_li['rowIndex'],
            'arithmetic': f"{next_li['date']} - 18 civil days = {next_li['onset']}; onset <= date < Li"}


def dated_inputs(han, when):
    day = when.astimezone(TZ).date()
    ms = (when - EPOCH) // dt.timedelta(milliseconds=1)
    pillar, day_math = dated_pillar(day)
    month, month_math = month_at(ms)
    all_values = {'MONTH_JIAN_BRANCH': month, 'DAY_BRANCH': pillar[1],
                  'DAY_PILLAR': pillar, 'SOIL_REIGN_STATE': soil_at(day)}
    values = {key: all_values[key] for key in BY_HAN[han]['requiredInputs']}
    context = {'kind': 'DATED', 'instantUtc': when.astimezone(dt.timezone.utc).isoformat(),
               'civilDateUtc7': day.isoformat(), 'validPillar': pillar,
               'dayCalculation': day_math, 'monthCalculation': month_math}
    return values, context


def structural_inputs(han, month, pillar):
    assert pillar in PILLARS
    assert han != '母倉', '母倉 positive fixtures must have dated soil provenance'
    all_values = {'MONTH_JIAN_BRANCH': month, 'DAY_BRANCH': pillar[1], 'DAY_PILLAR': pillar}
    return ({k: all_values[k] for k in BY_HAN[han]['requiredInputs']},
            {'kind': 'STRUCTURAL', 'validPillar': pillar,
             'note': 'Valid abstract input tuple, not claimed as a real date'})


def source_expected(han, values, provider_states):
    entry = BY_HAN[han]
    for key in entry['requiredInputs']:
        if key not in values:
            return {'outcome': 'unknown', 'reason': 'MISSING_REQUIRED_INPUT'}, f'{key} omitted; audit contract -> unknown'
        if provider_states.get(key) in ['unknown', 'outside']:
            return {'outcome': 'unknown', 'reason': 'OUTSIDE_PROVIDER_COVERAGE' if provider_states[key] == 'outside' else 'UNKNOWN_INPUT'}, f'{key} provider {provider_states[key]}; audit contract -> unknown'
    rule = entry['manualDerivationRule']
    if rule['kind'] == 'seasonal':
        soil = values['SOIL_REIGN_STATE']
        if not soil.get('validated') or not soil.get('date') or not soil.get('sourcePath'):
            return {'outcome': 'unknown', 'reason': 'UNVALIDATED_SOIL_PROVENANCE'}, 'Soil lacks validated date/boundary provenance; no seasonal fallback'
        if soil['coverage'] == 'outside':
            return {'outcome': 'unknown', 'reason': 'OUTSIDE_LOCAL_COVERAGE'}, f"{soil['date']} outside adopted 2025–2027; no seasonal fallback"
        if soil['state'] == 'unknown':
            return {'outcome': 'unknown', 'reason': 'UNKNOWN_SOIL'}, 'Soil unknown; no seasonal fallback even on an ordinary seasonal branch'
        season = MONTHS.index(values['MONTH_JIAN_BRANCH']) // 3
        ordinary = rule['ordinarySets'].split('/')[season]
        chosen = rule['soilSet'] if soil['state'] == 'present' else ordinary
        found = values['DAY_BRANCH'] in chosen
        math = f"Month {values['MONTH_JIAN_BRANCH']} -> season {['春','夏','秋','冬'][season]}, ordinary {ordinary}; soil {soil['state']} -> use {chosen} (replace, never union); {values['DAY_BRANCH']} membership = {found}"
    elif rule['kind'] in ['forward', 'horse', 'sequence']:
        month = values['MONTH_JIAN_BRANCH']
        ordinal = MONTHS.index(month)
        if rule['kind'] == 'forward':
            position = BRANCHES.index(month)
            target = (BRANCHES * 2)[position + rule['steps']]
            math = f'From source forward {rule["steps"]} branch steps: {month} -> {target}'
        elif rule['kind'] == 'horse':
            target = rule['sequenceFromYin'][ordinal % 4]
            math = f'Source 正月起申逆行四孟, monthly ordinal {ordinal} from 寅; 申巳寅亥 repeated -> {target}'
        else:
            sequence = rule['sequence']
            target = (sequence * 3)[sequence.index(rule['first']) + ordinal]
            math = f'Source starts {rule["first"]}, advance along {sequence}; monthly ordinal {ordinal} from 寅 -> {target}'
        found = values['DAY_BRANCH'] == target
        math += f'; day branch {values["DAY_BRANCH"]} == {target} is {found}'
    elif rule['kind'] == 'branchSet':
        found = values['DAY_BRANCH'] in rule['set']
        math = f'Source fixed {rule["set"]}; {values["DAY_BRANCH"]} membership = {found}; stem/month unused'
    elif rule['kind'] == 'ranges':
        index = PILLARS.index(values['DAY_PILLAR'])
        endpoints = rule['scanEndpoints']
        ranges = [(PILLARS.index(endpoints[i]), PILLARS.index(endpoints[i + 1])) for i in [0, 2, 4]]
        found = any(start <= index <= end for start, end in ranges)
        math = f'Scan corrected 己 endpoints {endpoints}; independently generated indices {ranges}; {values["DAY_PILLAR"]} index {index} inside inclusive ranges = {found}'
    else:
        pillar = values['DAY_PILLAR']
        found = any(pillar[0] in group['stems'] and pillar[1] in group['branches'] for group in rule['groups'])
        math = f'Corrected 立成: 甲丙庚壬 × 午申, 乙丁己辛癸 × 酉; {pillar} belongs = {found}; no old14 or 鳴吠對 union'
    return {'outcome': 'present' if found else 'absent'}, math


def add(han, label, categories, values, context, provider_states=None, request_name=None):
    entry = BY_HAN[han]
    states = provider_states or {}
    expected, calculation = source_expected(han, values, states)
    assert request_name in [None, han, *entry['acceptedAliases']]
    fixture_id = entry['id'] + ':' + label
    FIXTURES.append({'id': fixture_id, 'han': han, 'categories': categories,
                     'requestName': request_name or han, 'inputs': copy.deepcopy(values),
                     'providerStates': states, 'inputProvenance': copy.deepcopy(context),
                     'expected': {**expected, 'canonicalHan': han,
                                  'authorityId': entry['authorityId'], 'ruleId': entry['ruleId'],
                                  'authorityStatus': 'OWNER_ADOPTED_SOURCE_DEPENDENT' if han == '母倉' else 'SOURCE_REVIEWED',
                                  'sourceRefs': entry['sourceRefs']},
                     'derivation': {'basisHan': han, 'rawAnchor': entry['rawAnchor'],
                                    'sourceRefs': entry['sourceRefs'], 'calculation': calculation,
                                    'contractReference': 'source-basis.json unknownPolicy' if expected['outcome'] == 'unknown' else None}})


def build():
    matrix_path = ROOT / 'docs/audits/sources/p4-vol10/yi-fixture-matrix-v1/matrix.json'
    matrix = json.loads(matrix_path.read_text())
    for row in matrix['rows']:
        han = row['han']
        if han == '母倉':
            continue
        seen = set()
        for category in ['present', 'absent', 'boundary']:
            plan = row['cells'][category]['selectionPlan']
            for match in re.finditer(r'([子丑寅卯辰巳午未申酉戌亥])/([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])', plan):
                month, pillar = match.groups()
                seen.add(pillar)
                values, context = structural_inputs(han, month, pillar)
                add(han, f'candidate-{category}-{month}-{pillar}', [category], values, context)
            if han in ['天恩', '除神', '鳴吠']:
                for pillar in re.findall(r'[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]', plan):
                    if (category, pillar) in seen:
                        continue
                    seen.add((category, pillar))
                    values, context = structural_inputs(han, '寅', pillar)
                    add(han, f'candidate-{category}-{pillar}', [category], values, context)
        rule = BY_HAN[han]['manualDerivationRule']
        if len(BY_HAN[han]['requiredInputs']) == 2:
            for month in MONTHS:
                # Walk source ordinal sequence; 3 chosen pillars per month, not 720 sweep.
                if rule['kind'] == 'forward':
                    target = (BRANCHES * 2)[BRANCHES.index(month) + rule['steps']]
                elif rule['kind'] == 'horse':
                    target = rule['sequenceFromYin'][MONTHS.index(month) % 4]
                else:
                    seq = rule['sequence']
                    target = (seq * 3)[seq.index(rule['first']) + MONTHS.index(month)]
                for offset in [-1, 0, 1]:
                    branch = BRANCHES[(BRANCHES.index(target) + offset) % 12]
                    pillar = next(p for p in PILLARS if p[1] == branch)
                    values, context = structural_inputs(han, month, pillar)
                    add(han, f'target-neighbor-{month}-{offset}', ['boundary', 'present' if offset == 0 else 'absent'], values, context)
        if han == '除神':
            for branch in '未申酉戌':
                candidates = [p for p in PILLARS if p[1] == branch]
                if branch in '未戌':
                    candidates = candidates[:1]
                for pillar in candidates:
                    values, context = structural_inputs(han, '寅', pillar)
                    add(han, f'branch-edge-{pillar}', ['boundary'], values, context)
        if han == '天恩':
            for index in [59, 0, 4, 5, 14, 15, 19, 20, 44, 45, 49, 50]:
                values, context = structural_inputs(han, '寅', PILLARS[index])
                add(han, f'range-edge-{index}', ['boundary'], values, context)
        if han == '鳴吠':
            rule = BY_HAN[han]['manualDerivationRule']
            selected = [p for p in PILLARS if any(p[0] in g['stems'] and p[1] in g['branches'] for g in rule['groups'])]
            indices = sorted({(PILLARS.index(p) + offset) % 60 for p in selected for offset in [-1, 0, 1]})
            for index in indices:
                values, context = structural_inputs(han, '寅', PILLARS[index])
                add(han, f'corrected-set-neighbor-{index}', ['boundary'], values, context)
        # Input invariance: optional month/lunar/soil/year supplied separately, never required.
        base = next(f for f in FIXTURES if f['han'] == han and f['expected']['outcome'] == 'present')
        for key in BY_HAN[han]['notNeeded']:
            context = {**base['inputProvenance'], 'irrelevantInput': {'key': key, 'variants': ['omitted', 'valid alternative']},
                       'note': 'Use same required tuple with each valid irrelevant-input variant; outcome and trace required fields stay equal'}
            add(han, 'irrelevant-' + key, ['irrelevantInput'], base['inputs'], context)

    # Real dated 母倉 witnesses: each season/set branch and soil override counterexample.
    for season in range(4):
        chosen = {}
        for day_offset in range(365):
            day = dt.date(2025, 1, 1) + dt.timedelta(days=day_offset)
            when = dt.datetime.combine(day, dt.time(12), TZ)
            values, context = dated_inputs('母倉', when)
            if MONTHS.index(values['MONTH_JIAN_BRANCH']) // 3 != season:
                continue
            soil = values['SOIL_REIGN_STATE']
            if soil['state'] != 'absent':
                continue
            outcome, _ = source_expected('母倉', values, {})
            key = ('member-' + values['DAY_BRANCH']) if outcome['outcome'] == 'present' else 'nonmember'
            if key not in chosen:
                chosen[key] = (values, context)
        expected_count = [2, 2, 4, 2][season] + 1
        assert len(chosen) == expected_count
        for key, (values, context) in sorted(chosen.items()):
            add('母倉', f'ordinary-{season}-{key}', ['present' if key != 'nonmember' else 'absent'], values, context)
    override_witnesses = {}
    for offset in range(365):
        when = dt.datetime.combine(dt.date(2025, 1, 1) + dt.timedelta(days=offset), dt.time(12), TZ)
        values, context = dated_inputs('母倉', when)
        if values['SOIL_REIGN_STATE']['state'] != 'present':
            continue
        branch = values['DAY_BRANCH']
        ordinary = BY_HAN['母倉']['manualDerivationRule']['ordinarySets'].split('/')[MONTHS.index(values['MONTH_JIAN_BRANCH']) // 3]
        key = branch if branch in '巳午' else ('ordinary-replaced' if branch in ordinary else 'neither')
        override_witnesses.setdefault(key, (values, context))
    assert set(override_witnesses) == {'巳', '午', 'ordinary-replaced', 'neither'}
    for key, (values, context) in override_witnesses.items():
        add('母倉', 'soil-override-' + key, ['boundary', 'present' if key in '巳午' else 'absent'], values, context)
    for li in LI:
        if not 2025 <= li['year'] <= 2027:
            continue
        for name, day in [('onset-minus1', li['onset'] - dt.timedelta(days=1)), ('onset', li['onset']),
                          ('onset-plus1', li['onset'] + dt.timedelta(days=1)), ('li-minus1', li['date'] - dt.timedelta(days=1)),
                          ('li', li['date']), ('li-plus1', li['date'] + dt.timedelta(days=1))]:
            when = dt.datetime.combine(day, dt.time(12), TZ)
            values, context = dated_inputs('母倉', when)
            context['testedSoilBoundary'] = {'liDate': li['date'].isoformat(), 'onset': li['onset'].isoformat(), 'position': name}
            add('母倉', f'soil-boundary-{li["year"]}-{li["termIndex"]}-{name}', ['boundary'], values, context)
        # Season uses exact Jie; soil uses civil dates. At Li civil day soil is absent
        # even 1 ms BEFORE crossing, so these cases must not use instant soil windows.
        for delta in [-1, 0, 1]:
            when = EPOCH + dt.timedelta(milliseconds=li['epochMs'] + delta)
            values, context = dated_inputs('母倉', when)
            context['testedJieBoundary'] = {'rowIndex': li['rowIndex'], 'deltaMs': delta}
            add('母倉', f'season-jie-{li["year"]}-{li["termIndex"]}-{delta}', ['boundary'], values, context)
    for date_string in ['2024-12-31', '2025-01-01', '2027-12-31', '2028-01-01']:
        when = dt.datetime.combine(dt.date.fromisoformat(date_string), dt.time(12), TZ)
        values, context = dated_inputs('母倉', when)
        add('母倉', 'coverage-edge-' + date_string, ['outsideCoverage', 'boundary'], values, context)
    # Each of 7 monthly rules at all 12 exact Jie crossings in 2025.
    for han in [e['han'] for e in BASIS['entries'] if len(e['requiredInputs']) == 2]:
        for jie in JIE:
            if jie['year'] != 2025:
                continue
            for delta in [-1, 0, 1]:
                when = EPOCH + dt.timedelta(milliseconds=jie['epochMs'] + delta)
                values, context = dated_inputs(han, when)
                context['testedJieBoundary'] = {'rowIndex': jie['rowIndex'], 'deltaMs': delta}
                add(han, f'jie-2025-{jie["termIndex"]}-{delta}', ['boundary'], values, context)

    for entry in BASIS['entries']:
        han = entry['han']
        base = next(f for f in FIXTURES if f['han'] == han and f['expected']['outcome'] == 'present')
        for key in entry['requiredInputs']:
            values = copy.deepcopy(base['inputs'])
            values.pop(key)
            add(han, 'missing-' + key, ['missingInput'], values, base['inputProvenance'])
            for state in ['unknown', 'outside']:
                add(han, f'provider-{state}-{key}', ['missingInput' if state == 'unknown' else 'outsideCoverage'], base['inputs'],
                    {**base['inputProvenance'], 'providerScenario': 'Declarative supplied input evidence; no invented date cutoff'}, {key: state})
        add(han, 'missing-all', ['missingInput'], {}, base['inputProvenance'])
        if han == '母倉':
            for missing in ['date', 'sourcePath', 'validated']:
                values = copy.deepcopy(base['inputs'])
                values['SOIL_REIGN_STATE'].pop(missing)
                add(han, 'soil-provenance-missing-' + missing, ['missingInput'], values, base['inputProvenance'])
            values = copy.deepcopy(base['inputs'])
            values['SOIL_REIGN_STATE']['state'] = 'unknown'
            add(han, 'soil-unknown-no-fallback', ['missingInput'], values, base['inputProvenance'])
            for key in entry['notNeeded']:
                add(han, 'irrelevant-' + key, ['irrelevantInput'], base['inputs'],
                    {**base['inputProvenance'], 'irrelevantInput': {'key': key, 'variants': ['omitted', 'valid alternative']}})
        for alias in entry['acceptedAliases']:
            for state in ['present', 'absent', 'unknown']:
                donor = next(f for f in FIXTURES if f['han'] == han and f['expected']['outcome'] == state)
                add(han, f'alias-{alias}-{state}', ['alias'], donor['inputs'], donor['inputProvenance'], donor['providerStates'], alias)

    # Name identity is a separate assertion, not absent presence or runtime error class.
    rejections = {'母倉': ['母仓'], '福德': ['滿日', '天巫', '四利三元'], '天恩': ['天赦'],
                  '天巫': ['福德', '滿日', '天狗'], '天后': ['驛馬', '天馬'], '天醫': ['成日', '天喜'],
                  '除神': ['除日', '五離', '解神'], '驛馬': ['天后', '天馬', 'Dịch Mã'],
                  '天馬': ['驛馬', '天后', 'Lộc Mã'], '吉期': ['除日', '兵寶'], '鳴吠': ['鳴吠對', '金雞鳴玉犬吠']}
    identity = [{'id': BY_HAN[han]['id'] + ':not-alias:' + name, 'han': han, 'requestName': name,
                 'expected': {'aliasesToThisEntry': False},
                 'derivation': 'Locked authority accepts only 福徳→福德; same position, variant label or related scope does not merge identity',
                 'sourceBasisHan': han} for han, names in rejections.items() for name in names]
    malformed = []
    for entry in BASIS['entries']:
        han = entry['han']
        base = next(f for f in FIXTURES if f['han'] == han and f['expected']['outcome'] == 'present')
        for key in entry['requiredInputs']:
            bad = '甲丑' if key == 'DAY_PILLAR' else 'invalid'
            values = copy.deepcopy(base['inputs'])
            values[key] = bad
            malformed.append({'id': entry['id'] + ':malformed-' + key, 'han': han,
                              'inputs': values, 'expected': {'outcome': 'error', 'reason': 'MALFORMED_REQUIRED_INPUT'},
                              'derivation': 'Audit contract: invalid required chi/pillar/type is error, never missing/coverage unknown'})
    mu_base = next(f for f in FIXTURES if f['han'] == '母倉' and f['expected']['outcome'] == 'present')
    for key, bad in [('authorityId', 'p4-soil-owner-convention-v1'), ('status', 'SOURCE_REVIEWED'),
                     ('timezone', 'Asia/Shanghai'), ('date', '2025-02-30')]:
        values = copy.deepcopy(mu_base['inputs'])
        values['SOIL_REIGN_STATE'][key] = bad
        malformed.append({'id': 'mu-cang:malformed-soil-' + key, 'han': '母倉', 'inputs': values,
                          'expected': {'outcome': 'error', 'reason': 'MALFORMED_SOIL_PROVENANCE'},
                          'derivation': 'Separate adopted 母倉 soil authority/status/UTC+7/date validity; invalid provenance is error'})
    summary = collections.defaultdict(collections.Counter)
    for fixture in FIXTURES:
        summary[fixture['han']][fixture['expected']['outcome']] += 1
    return {'version': 'p4-yi-independent-expected-v1', 'task': '3.2', 'date': '2026-10-14',
            'status': 'EXPECTED_DERIVED_PENDING_3_3_TO_3_6', 'scope': 'AUDIT_ONLY', 'frozen': False,
            'basisPath': str((OUT / 'source-basis.json').relative_to(ROOT)), 'basisSha256': sha(OUT / 'source-basis.json'),
            'inputContract': 'Declarative required input keys/provider evidence for Golden design; not final runtime API (4.1)',
            'summary': dict(summary), 'presenceFixtures': FIXTURES,
            'identityFixtures': identity, 'malformedFixtures': malformed,
            'limits': ['7 full 720-context domains and 3 full 60-pillar domains remain task 3.3',
                       'ANY/heading/protection/override/warehouse expected remain task 3.4',
                       'Single-agent source arithmetic; Golden review 3.5 and commit freeze 3.6 not complete',
                       'Frozen JPL/calendar input references reused, never old P4 presence expected',
                       'S1 canonical remains OPEN; 母倉 OWNER_ADOPTED_SOURCE_DEPENDENT; P5 warehouse deferred']}


def verify_inputs():
    for locked in BASIS['inputs']:
        assert sha(ROOT / locked['path']) == locked['sha256'], locked['path']
    assert sha(ROOT / SOLAR_PATH) == '1db7a155f147210cac9db6580e3893dd3603c3d08ac3bea61815af193e9c6a60'
    for entry in BASIS['entries']:
        for source in entry['rawSources']:
            p = ROOT / source['path']
            raw = p.read_text()
            assert hashlib.sha1(p.read_bytes()).hexdigest() == source['sha1']
            assert raw[source['offset']:source['offset'] + source['length']] == source['quote']
        assert any(entry['rawAnchor'] in s['quote'] for s in entry['rawSources'])
    anchor = BASIS['dayPillarDerivation']
    records = json.loads((ROOT / anchor['sourcePath']).read_text())['records']
    stem_vn = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý']
    branch_vn = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi']
    assert records[0]['date'] == anchor['anchorDate']
    for record in records:
        day = dt.date.fromisoformat(record['date'])
        pillar, _ = dated_pillar(day)
        assert jdn(day) == record['julianDayNumber']
        assert stem_vn[STEMS.index(pillar[0])] + ' ' + branch_vn[BRANCHES.index(pillar[1])] == record['canChi']['day']
    # Civil boundary witness cross-check from locked HKO tables, not P4 soil Golden.
    term_names = {21: '立春', 3: '立夏', 9: '立秋', 15: '立冬'}
    for li in LI:
        if 2025 <= li['year'] <= 2027:
            raw = (ROOT / f'docs/audits/sources/p4-vol10/soil-hko/T{li["year"]}c.txt').read_text()
            line = next(line for line in raw.splitlines() if term_names[li['termIndex']] in line)
            year, month, day = map(int, re.search(r'(\d+)年(\d+)月(\d+)日', line).groups())
            assert dt.date(year, month, day) == li['date'], 'UTC+7/UTC+8 date difference: classify before adoption'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true', help='Exclusive first creation; never overwrite expected')
    args = parser.parse_args()
    verify_inputs()
    document = build()
    ids = [f['id'] for key in ['presenceFixtures', 'identityFixtures', 'malformedFixtures'] for f in document[key]]
    assert len(ids) == len(set(ids))
    result = json.dumps(document, ensure_ascii=False, indent=2) + '\n'
    path = OUT / 'expected.json'
    if args.write:
        with path.open('x') as handle:
            handle.write(result)
    else:
        assert json.loads(path.read_text()) == document, 'Expected differs; never overwrite to make verification pass'
    print('PASS independent derivation:', len(document['presenceFixtures']), 'presence fixtures,',
          len(document['identityFixtures']), 'identity fixtures,', len(document['malformedFixtures']),
          'malformed fixtures; 100 calendar records / 12 HKO Li dates cross-checked; no production calls')


if __name__ == '__main__':
    main()
