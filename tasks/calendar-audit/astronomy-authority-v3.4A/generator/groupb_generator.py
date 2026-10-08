"""Phase 3B.4.4A GENERATOR: Group B Golden vNext (golden-v4/group-b).

Expected values come only from:
  A. the JPL authority dataset (Jie canonical T, clock-v1 civil ms), and
  B. the frozen Group B source rule tables (calendar-rule-extraction-v3.json).
Day operand: Asia/Ho_Chi_Minh UTC+7 civil 00:00, cycle index anchored on the
reviewed HKO oracle (2014-02-05 = index 43, 0-based from 甲子).
This audit evaluator never imports production Group B code or any production module.

Usage: python3 groupb_generator.py <authority.json> <rule-extraction.json> <outDir>
"""
import hashlib
import json
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

authority_path, extraction_path, out_dir = sys.argv[1:4]
GENERATOR_VERSION = 'groupb-vnext-generator 1.0.0'
STEMS = '甲乙丙丁戊己庚辛壬癸'
BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
VN = timezone(timedelta(hours=7))
RULES = [  # (ruleId, index in calendar-rule-extraction-v3.json rules[])
    ('month-breaker', 3), ('robbery-sha', 4), ('disaster-sha', 5), ('month-sha', 6), ('month-virtue', 7)]
# Fixture design: the 21 representative Jie transitions reviewed in Phase 3B.1
# (year, Jie longitude). Only their identity is reused; every instant is re-anchored.
TRANSITIONS = [(2014, 315), (2014, 345), (2014, 15), (2014, 45), (2023, 345), (2023, 15), (2023, 45),
               (2024, 285), (2024, 315), (2024, 345), (2024, 15), (2024, 45), (2024, 75), (2024, 105),
               (2024, 135), (2024, 165), (2024, 195), (2024, 225), (2024, 255), (2025, 285), (2025, 105)]
ORACLE_DATE, ORACLE_INDEX = date(2014, 2, 5), 43
IDENTITY_LABELS = ['月煞', '月殺', '月虚']  # identity design carried from the previous Golden alias case (labels only)

authority_text = Path(authority_path).read_text()
authority = json.loads(authority_text)
assert authority['clockPolicy'] == 'clock-v1'
extraction = json.loads(Path(extraction_path).read_text())

# ---- Authority: Jie boundaries on the civil axis -------------------------------
jie = []  # (civilMs, ttMs, rootTtMs, year, longitude, monthBranch)
for encoded in authority['rows']:
    f = encoded.split('|')
    year, term, root, tt, civil, civil_iso, regime = int(f[0]), int(f[1]), f[2], int(f[3]), int(f[4]), f[5], f[6]
    lon = term * 15
    if lon % 30 == 15:
        branch = BRANCHES[((lon - 315) // 30 + 2) % 12]
        jie.append(dict(civilMs=civil, ttMs=tt, rootTtMs=root, year=year, longitude=lon, branch=branch, civilIso=civil_iso, regime=regime))
jie.sort(key=lambda j: j['civilMs'])


def active_jie(civil_ms):
    """Half-open [T, next T): last Jie with civil T <= t."""
    found = None
    for j in jie:
        if j['civilMs'] <= civil_ms:
            found = j
        else:
            break
    if found is None:
        raise ValueError('instant before authority range')
    return found


def transition(year, lon):
    return next(j for j in jie if j['year'] == year and j['longitude'] == lon)


def previous_jie(j):
    return jie[jie.index(j) - 1]


# ---- Day operand ----------------------------------------------------------------
def civil_date(civil_ms):
    return datetime.fromtimestamp(civil_ms / 1000, VN).date()


def day_operands(d):
    idx = (ORACLE_INDEX + (d - ORACLE_DATE).days) % 60
    return idx, STEMS[idx % 10], BRANCHES[idx % 12]


# ---- Rule table ---------------------------------------------------------------------
tables = {}
for rule_id, i in RULES:
    rule = extraction['rules'][i]
    assert rule['id'] == rule_id
    rows = {}
    for n, row in enumerate(rule['rule']['lookup']):
        kind = row['target']['kind']
        rows[row['sourceMonthJianBranch']] = dict(
            target=row['target']['value'], operandType={'day_branch': 'DAY_BRANCH', 'day_stem': 'DAY_STEM'}[kind],
            sourceRow=row['sourceMonthOrdinal'], pointer=f'calendar-rule-extraction-v3.json#/rules/{i}/rule/lookup/{n}')
    assert len(rows) == 12
    tables[rule_id] = rows


def iso_offset(civil_ms, hours):
    tz = timezone(timedelta(hours=hours))
    t = datetime.fromtimestamp(civil_ms // 1000, tz).replace(microsecond=(civil_ms % 1000) * 1000)
    text = t.isoformat(timespec='milliseconds')
    return text.replace('+00:00', 'Z')


def evaluate(rule_id, civil_ms):
    a = active_jie(civil_ms)
    d = civil_date(civil_ms)
    idx, stem, branch = day_operands(d)
    cell = tables[rule_id][a['branch']]
    observed = stem if cell['operandType'] == 'DAY_STEM' else branch
    return dict(
        context=dict(monthJian=a['branch'], dayStem=stem, dayBranch=branch, civilDate=d.isoformat()),
        expected=observed == cell['target'],
        derivation=dict(ruleId=rule_id, operandType=cell['operandType'], observedOperand=observed,
                        expectedTarget=cell['target'], comparison='equal' if observed == cell['target'] else 'not-equal',
                        sourceMonthJian=a['branch'], sourceRow=cell['sourceRow'], sourceExtraction=cell['pointer']),
        provenance=dict(activeJie=dict(year=a['year'], longitudeDeg=a['longitude'], ttMs=a['ttMs'],
                                       civilEpochMs=a['civilMs'], clockRegime=a['regime']),
                        dayCycleIndex=idx, dayOperandOracle='HKO 2014-02-05 = 丁未 (index 43)'),
    )


def fixture(rule_id, cls, civil_ms, instant=None, **extra):
    e = evaluate(rule_id, civil_ms)
    return dict(id=None, fixtureClass=cls, instant=instant or iso_offset(civil_ms, 7), timezone='Asia/Ho_Chi_Minh',
                civilEpochMs=civil_ms, **e, **extra)


def noon(d):
    return int(datetime(d.year, d.month, d.day, 12, tzinfo=VN).timestamp() * 1000)


def interior_days(j):
    nxt = jie[jie.index(j) + 1]
    d, end = civil_date(j['civilMs']) + timedelta(days=1), civil_date(nxt['civilMs']) - timedelta(days=1)
    while d <= end:
        yield d
        d += timedelta(days=1)


def cycle(year):  # 12 Jie from Lap xuan of `year`
    start = transition(year, 315)
    i = jie.index(start)
    return jie[i:i + 12]


out = {}
for rule_id, _ in RULES:
    fx = []
    # Interior positives / negatives: 2024 and 2014 cycles cover all 12 Month Jian;
    # 1900 and 2100 add one case each at the supported-range edges.
    for want in (True, False):
        cls = 'interior-positive' if want else 'interior-negative'
        picks = []
        for year in (2024, 2014):
            for j in cycle(year):
                d = next(d for d in interior_days(j) if evaluate(rule_id, noon(d))['expected'] == want)
                picks.append(d)
        for year in (1900, 2100):
            j = cycle(year)[3 if year == 1900 else 6]
            picks.append(next(d for d in interior_days(j) if evaluate(rule_id, noon(d))['expected'] == want))
        fx += [fixture(rule_id, cls, noon(d)) for d in picks]
    # Exact boundary: T - 1 ms, T, T + 1 ms at the NEW canonical JPL boundary.
    at_ids = {}
    for year, lon in TRANSITIONS:
        j = transition(year, lon)
        tid = f'jie-{year}-{lon:03d}'
        samples = [fixture(rule_id, 'exact-boundary', j['civilMs'] + off,
                           boundary=dict(transitionId=tid, sample=s, offsetMs=off, projectConvention='[T,next T)',
                                         canonicalTtMs=j['ttMs'], rootTtMs=j['rootTtMs'], canonicalCivilEpochMs=j['civilMs']))
                   for s, off in (('before', -1), ('at', 0), ('after', 1))]
        killer = samples[0]['expected'] != samples[1]['expected']
        for s in samples:
            s['boundary']['effectiveCutoffKiller'] = killer
        fx += samples
        at_ids[tid] = len(fx) - 2
    # Timezone-equivalent: the same canonical instant written with other offsets.
    j = transition(2024, 15)
    for hours in (8, 0, 9):
        fx.append(fixture(rule_id, 'timezone-equivalent', j['civilMs'], instant=iso_offset(j['civilMs'], hours),
                          equivalenceGroup=f'@{at_ids["jie-2024-015"]}'))
    # Timezone civil-date trap: 23:30 at UTC+7 is the next day at UTC+8.
    j = transition(2024, 285)
    for d in interior_days(j):
        t = int(datetime(d.year, d.month, d.day, 23, 30, tzinfo=VN).timestamp() * 1000)
        here, wrong = evaluate(rule_id, t), day_operands(d + timedelta(days=1))
        wrong_operand = wrong[1] if here['derivation']['operandType'] == 'DAY_STEM' else wrong[2]
        if here['expected'] and wrong_operand != here['derivation']['expectedTarget']:
            fx.append(fixture(rule_id, 'timezone-civil-date', t, sourceClockRepresentation=iso_offset(t, 8),
                              wrongCivilDate=(d + timedelta(days=1)).isoformat()))
            break
    # Lunar leap-month regression (HKO 2023: leap second month); lunar data is not an operand.
    fx.append(fixture(rule_id, 'lunar-leap-regression', noon(date(2023, 4, 10)),
                      lunarMetadata=dict(lunarMonth=2, isLeapMonth=True, notRuleOperand=True,
                                         source='https://www.hko.gov.hk/en/gts/astron2023/files/2023cal04.pdf')))
    # Rounded-minute discriminators, recomputed from the new authority.
    def vn_seconds(ms):
        return (ms // 1000) % 60
    low = next(transition(y, l) for y, l in TRANSITIONS if vn_seconds(transition(y, l)['civilMs']) < 30)
    high = next(transition(y, l) for y, l in TRANSITIONS if vn_seconds(transition(y, l)['civilMs']) >= 30)
    floor_minute = low['civilMs'] // 60000 * 60000
    t = floor_minute + (low['civilMs'] - floor_minute) // 2
    fx.append(fixture(rule_id, 'rounded-minute-discriminator', t, roundedMinuteMutation=dict(
        kind='nearest-minute and truncated-minute', publishedMinute=iso_offset(floor_minute, 7),
        canonicalBoundary=iso_offset(low['civilMs'], 7), wrongMonthJian=low['branch'],
        transitionId=f"jie-{low['year']}-{low['longitude']:03d}")))
    next_minute = (high['civilMs'] // 60000 + 1) * 60000
    t = high['civilMs'] + (next_minute - high['civilMs']) // 2
    fx.append(fixture(rule_id, 'rounded-minute-discriminator', t, roundedMinuteMutation=dict(
        kind='nearest-minute (rounds up)', publishedMinute=iso_offset(next_minute, 7),
        canonicalBoundary=iso_offset(high['civilMs'], 7), wrongMonthJian=previous_jie(high)['branch'],
        transitionId=f"jie-{high['year']}-{high['longitude']:03d}")))
    if rule_id == 'month-sha':
        j = cycle(2014)[0]
        d = next(d for d in interior_days(j) if evaluate(rule_id, noon(d))['expected'])
        fx.append(fixture(rule_id, 'alias-identity', noon(d), identityContract=dict(
            inputLabels=IDENTITY_LABELS, expectedCanonicalRuleIds=['month-sha'], expectedCanonicalMatchCount=1,
            scope='canonical identity only; no scoring or effect resolver')))
    for n, f in enumerate(fx, 1):
        f['id'] = f'{rule_id}-v4-{n:03d}'
    for f in fx:
        if f.get('equivalenceGroup', '').startswith('@'):
            f['equivalenceGroup'] = fx[int(f['equivalenceGroup'][1:])]['id']
    out[rule_id] = fx

authority_sha = hashlib.sha256(authority_text.encode()).hexdigest()
Path(out_dir).mkdir(parents=True, exist_ok=True)
for rule_id, fx in out.items():
    doc = dict(
        goldenVersion='group-b-golden-v4', reviewStatus='CANDIDATE', ruleId=rule_id,
        authorityVersion=authority['authorityVersion'], authorityDataset=authority['datasetId'],
        authorityDatasetSha256=authority_sha, referenceEngine=authority['referenceEngine'],
        referenceKernelSha256=authority['referenceKernelSha256'], observable=authority['observable'],
        frame=authority['frame'], timeScale=authority['timeScale'],
        numericalBoundaryPolicy=authority['numericalBoundaryPolicy'], clockPolicy=authority['clockPolicy'],
        serializationPolicy=authority['serializationPolicy'], monthJianConvention='[Jie_n, Jie_n+1), exact canonical T',
        dayBoundary='00:00 civil Asia/Ho_Chi_Minh (UTC+7)', excludedRules={'heaven-virtue': 'EXCLUDED (unresolved DAY semantics)'},
        generatorVersion=GENERATOR_VERSION, productionUsed=False, fixtures=fx)
    Path(out_dir, f'{rule_id}.json').write_text(json.dumps(doc, ensure_ascii=False, indent=2) + '\n')
    counts = {}
    for f in fx:
        counts[f['fixtureClass']] = counts.get(f['fixtureClass'], 0) + 1
    print(rule_id, len(fx), counts)
