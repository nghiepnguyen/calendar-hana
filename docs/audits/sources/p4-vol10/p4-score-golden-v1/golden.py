"""Roadmap 8 FR-01: score Golden for the P4 adapter (flag ON), authored before adapter code.

    python3 -I docs/audits/sources/p4-vol10/p4-score-golden-v1/golden.py [--write]

Default verifies the committed outputs byte-for-byte; --write regenerates them. Independent of the TS
engine: reads only the product catalogs (weights, caps, Trực rules, heading map, overrides) and the
frozen full Golden v2 day composition. Policy: tasks/prd-p4-score-adapter.md §5 FR-02, §6.
"""
import csv
import hashlib
import json
import sys
from pathlib import Path

DIR = Path('docs/audits/sources/p4-vol10/p4-score-golden-v1')
DATA = Path('shared/almanac-data')
COMPOSE = Path('docs/audits/sources/p4-vol10/p4-full-golden-v2/compose/dated.tsv')
OUTSIDE = ['2024-12-31', '2028-01-01', '2035-06-15']


def load(name):
    return json.loads((DATA / name).read_text(encoding='utf-8'))


GOOD, BAD, TRUC = load('good-gods.json'), load('bad-gods.json'), load('truc.json')
MANIFEST, OVERRIDES = load('manifest.json'), load('overrides.json')
HEADINGS = load('xiejibianfangshu-yiji.json')['activityEntries']
ACTIVITIES = [a['id'] for a in load('activities.json')['items'] if a['enabled']]
DORMANT = {
    'thien_nguyen', 'tu_tuong', 'thoi_duc', 'ngu_hop', 'bat_tuong', 'thien_thuong', 'pho_ho',
    'tai_sat', 'nguyet_sat', 'nguyet_hai', 'nguyet_yem', 'yem_doi', 'dai_thoi', 'tu_phe', 'tu_ky',
    'tu_cung', 'ngu_mo', 'ngu_ly', 'vang_vong', 'bat_chuyen', 'quy_ky',
}
# PRD §6.3/§6.5: fixed order, strictest first; any of BASELINE_STATES on a heading keeps the baseline.
ORDER = ['only_ji', 'both_present', 'neither_recorded', 'only_yi']
BASELINE_STATES = {'not_recorded', 'undetermined'}
PENALTY = -25
POLICY = 'product_policy_default_penalty'
BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
STEMS = '甲乙丙丁戊己庚辛壬癸'


def activity_state(activity, headings):
    """headings: {heading: {state, rule?, prot?}} → ('baseline', None) or (state, deciding heading)."""
    hs = HEADINGS.get(activity)
    if not hs:
        return 'baseline', None
    states = [headings.get(h, {}).get('state', 'not_recorded') for h in hs]
    if any(s in BASELINE_STATES for s in states):
        return 'baseline', None
    best = min(states, key=ORDER.index)
    return best, hs[states.index(best)]


def protected_match(han, prot):
    # Exact han only: every 百忌日 god (Golden v2 token 百忌X) already carries preserve_bad.
    return han in prot


def preserve_bad(god, activity):
    return any(
        o['enabled'] and o['action'] == 'preserve_bad' and o['when'].get('targetPresent') == god
        and activity in o['activityIds'] for o in OVERRIDES['items'])


def score(case):
    """Reference adapter, flag ON, state not baseline. Mirrors FR-02/FR-04 and §6.5–6.13."""
    activity, officer_id = case['activityId'], case['officerId']
    state, heading = activity_state(activity, case['headings'])
    assert state != 'baseline', case['id']
    prot = sorted({p for h in HEADINGS[activity] for p in case['headings'][h].get('prot', [])})
    all_taboo = any(case['headings'][h].get('rule') == 'all_taboo' for h in HEADINGS[activity])
    officer = next(t for t in TRUC['items'] if t['id'] == officer_id)
    rule = next((r for r in officer['activityRules'] if r['activityId'] == activity), None)
    subsumed = set(officer.get('subsumesGods') or [])
    rows = []

    def lift(row):
        neg = row['rawDelta'] < 0
        if row['status'] != 'applied' or row['rawDelta'] == 0:
            return row
        if neg and (row['_protected'] or row['hardWarning']):
            return row  # 忌 protected and preserve_bad rows are never lifted (§6.9, §6.4)
        if (neg and state in ('only_yi', 'neither_recorded')) or (
                not neg and state in ('only_ji', 'neither_recorded')):
            row.update(status='informational', preCapDelta=0)
        return row

    w = rule['weight'] if rule else 0
    rows.append(lift({
        'source': 'truc', 'ruleId': f'{officer_id}:{activity}', 'status': 'applied' if rule else 'no_evidence',
        'rawDelta': w, 'preCapDelta': w, 'hardWarning': False, '_protected': False}))
    for source, data, present in (('good_god', GOOD, case['goodGods']), ('bad_god', BAD, case['badGods'])):
        for god in data['items']:
            if god['id'] not in present or activity not in god['activityIds']:
                continue
            raw = data['weights'][god['tier']]
            row = {'source': source, 'ruleId': god['id'], 'status': 'applied', 'rawDelta': raw,
                   'preCapDelta': raw, 'hardWarning': source == 'bad_god' and preserve_bad(god['id'], activity),
                   '_protected': source == 'bad_god' and protected_match(god['han'], prot)}
            if rule and god['id'] in subsumed:
                row.update(status='informational', preCapDelta=0)
            rows.append(lift(row))
    # §6.7/§6.8/§6.11/§6.13: one −25 when only_ji (incl. 諸事皆忌) leaves no applied negative row.
    if state == 'only_ji' and not any(r['status'] == 'applied' and r['preCapDelta'] < 0 for r in rows):
        rows.append({
            'source': 'bad_god', 'ruleId': f'p4_default_penalty:{activity}', 'status': 'applied',
            'rawDelta': PENALTY, 'preCapDelta': PENALTY, 'hardWarning': False, '_protected': False,
            'evidenceOrigin': 'product_policy', 'policyId': POLICY,
            'sourceClauseId': f'p4:{heading}' + (':all_taboo' if all_taboo else ''),
            'balancingEligible': False})
    # FR-04: one cap allocation per god source, after resolution, in catalog order; Trực uncapped.
    for source, data in (('good_god', GOOD), ('bad_god', BAD)):
        used = 0
        for r in rows:
            if r['source'] != source or r['status'] != 'applied':
                continue
            take = min(abs(r['preCapDelta']), max(0, abs(data['capPerActivity']) - used))
            r['scoreDelta'] = take if r['preCapDelta'] > 0 else -take
            used += take
    for r in rows:
        r.setdefault('scoreDelta', r['preCapDelta'] if r['status'] == 'applied' else 0)
        r.setdefault('evidenceOrigin', 'canonical')
        del r['_protected']
    applied = [r for r in rows if r['status'] == 'applied']
    pos = sum(max(0, r['scoreDelta']) for r in applied)
    neg = sum(-min(0, r['scoreDelta']) for r in applied)
    s = max(0, min(100, MANIFEST['baseScore'] + pos - neg))
    hard = any(r['hardWarning'] for r in rows)
    lifted = any(r['status'] == 'informational' and r['rawDelta'] != 0 and r['ruleId'] not in subsumed
                 for r in rows)
    pol = MANIFEST['policies']
    assert MANIFEST['baseScore'] == 50 and pol['hardVetoFromClassicalJi'] is False
    assert pol['hardWarningKeepsWorseScoreStatus'] is True
    status = ('neutral' if not applied and lifted else 'no_evidence' if not applied
              else 'consider' if hard and s > 29
              else 'consider' if not hard and pos >= 30 and neg >= 30
              else 'strong_avoid' if s <= 19 else 'avoid' if s <= 29 else 'watch' if neg > 0
              else 'recommended' if s >= 65 else 'neutral')
    return {'state': state, 'score': s, 'status': status, 'positiveMagnitude': pos,
            'negativeMagnitude': neg, 'hardWarning': hard, 'rows': rows}


def H(state, rule=None, prot=()):
    return {'state': state, **({'rule': rule} if rule else {}), **({'prot': list(prot)} if prot else {})}


def day(month_jian, pillar):
    m, s, b = BRANCHES.index(month_jian), STEMS.index(pillar[0]), BRANCHES.index(pillar[1])
    return {'monthJianBranch': m, 'dayStem': s, 'dayBranch': b}, TRUC['calculation']['order'][(b - m) % 12]


def C(cid, intent, activity, officer, good=(), bad=(), headings=None, classical=None):
    case = {'id': cid, 'intent': intent, 'activityId': activity, 'officerId': officer,
            'goodGods': list(good), 'badGods': list(bad), 'headings': headings or {}}
    if classical:
        cday, derived = day(*classical)
        assert derived == officer, (cid, derived)
        case['classicalDay'] = cday
    return case


OPEN = lambda state, **k: {'開市': H(state, **k)}  # noqa: E731
WED = lambda a, b: {'結婚姻': H(a), '嫁娶': H(b)}  # noqa: E731
CON = lambda a, b, **k: {'營建宮室': H(a, **k), '興造動土': H(b, **k)}  # noqa: E731
LIV = lambda a, b: {'牧養': H(a), '納畜': H(b)}  # noqa: E731

CASES = [
    C('A01', 'only_yi: 宜 kept, 忌 lifted', 'opening', 'man', ['dan_nhat'], ['kiep_sat'], OPEN('only_yi')),
    C('A02', 'only_yi: protected 忌 kept (dormant 四廢)', 'opening', 'man', [], ['kiep_sat', 'tu_phe'],
      OPEN('only_yi', prot=['四廢'])),
    C('A03', 'only_yi: preserve_bad 月破 kept with hard warning', 'opening', 'man', [], ['nguyet_pha'],
      OPEN('only_yi')),
    C('A04', 'both_present: nothing lifted; dormant 天願 in the good cap', 'opening', 'khai',
      ['thien_nguyen', 'dan_nhat', 'ngu_phu'], ['kiep_sat', 'tai_sat'], OPEN('both_present')),
    C('A05', 'only_ji: 宜 suppressed, 忌 kept, no penalty', 'opening', 'khai', ['dan_nhat'], ['kiep_sat'],
      OPEN('only_ji')),
    C('A06', 'only_ji: no negative row left → −25 product policy', 'opening', 'khai', ['dan_nhat'], [],
      OPEN('only_ji')),
    C('A07', 'only_ji: a negative Trực row blocks the penalty', 'opening', 'be', ['dan_nhat'], [],
      OPEN('only_ji')),
    C('A08', 'neither_recorded: every row lifted → neutral at 50', 'opening', 'khai', ['dan_nhat'],
      ['kiep_sat'], OPEN('neither_recorded')),
    C('A09', 'neither_recorded: protected 忌 still applies', 'opening', 'khai', ['dan_nhat'],
      ['kiep_sat', 'tu_phe'], OPEN('neither_recorded', prot=['四廢'])),
    C('A10', 'cap reallocation: lifted rows free the bad cap for a protected row', 'opening', 'man', [],
      ['kiep_sat', 'tai_sat', 'tu_phe'], OPEN('only_yi', prot=['四廢'])),
    C('A11', 'both_present: bad cap full (−15, −15, 0)', 'opening', 'man', [],
      ['kiep_sat', 'tai_sat', 'nguyet_sat'], OPEN('both_present')),
    C('A12', 'only_yi: negative Trực lifted', 'opening', 'be', ['dan_nhat'], [], OPEN('only_yi')),
    C('A13', 'both_present: consider when both sides ≥ 30', 'opening', 'khai', ['dan_nhat', 'ngu_phu'],
      ['kiep_sat', 'tai_sat'], OPEN('both_present')),
    C('A14', 'neither_recorded: preserve_bad row kept → avoid with hard warning', 'opening', 'khai',
      ['dan_nhat'], ['nguyet_pha'], OPEN('neither_recorded')),
    C('A15', 'multi-heading: only_yi + both_present → both_present', 'wedding', 'thanh',
      ['thien_duc', 'nguyet_an'], ['kiep_sat'], WED('only_yi', 'both_present')),
    C('A16', 'multi-heading: only_ji + only_yi → only_ji', 'wedding', 'thanh', ['thien_duc'], ['kiep_sat'],
      WED('only_ji', 'only_yi')),
    C('A17', 'multi-heading: neither + only_ji → only_ji, penalty once', 'wedding', 'thanh', ['thien_duc'],
      [], WED('neither_recorded', 'only_ji')),
    C('A18', 'multi-heading: both_present + neither → both_present', 'livestock', 'khai',
      ['thien_duc', 'nguyet_an'], ['kiep_sat'], LIV('both_present', 'neither_recorded')),
    C('A19', 'multi-heading: neither + only_yi → neither_recorded', 'livestock', 'khai', ['thien_duc'],
      ['kiep_sat'], LIV('only_yi', 'neither_recorded')),
    C('A20', 'multi-heading: two only_ji headings, one penalty', 'construction', 'khai', ['thien_duc'], [],
      CON('only_ji', 'only_ji')),
    C('A21', '諸事皆忌 with a protected 忌 left → no penalty', 'opening', 'khai', ['dan_nhat'], ['tu_phe'],
      OPEN('only_ji', rule='all_taboo', prot=['四廢'])),
    C('A22', '諸事皆忌 with no negative row → −25 (all_taboo clause)', 'opening', 'khai', ['dan_nhat'], [],
      OPEN('only_ji', rule='all_taboo', prot=['四廢'])),
    C('A23', 'both_present: 月破 subsumed by 破日 keeps its hard warning', 'wedding', 'pha', [],
      ['nguyet_pha'], WED('both_present', 'both_present'), classical=('子', '庚午')),
    C('A24', '6 chains replaced: 收日 chain lifts this pair when OFF; ON reads only_ji', 'opening', 'thu', ['dan_nhat'],
      ['kiep_sat'], OPEN('only_ji'), classical=('寅', '乙亥')),
    C('A25', 'protected on one heading of two (土王用事後, no override) under only_yi', 'construction', 'khai',
      ['thien_duc'], ['kiep_sat', 'tho_vuong_dung_su'], CON('only_yi', 'only_yi', prot=['土王用事後'])),
]
BASELINE_CASES = [
    C('B01', 'multi-heading: not_recorded + only_yi → baseline, dormant dropped', 'wedding', 'man',
      ['thien_duc', 'thien_nguyen'], ['kiep_sat', 'tai_sat'], WED('not_recorded', 'only_yi'),
      classical=('子', '丙寅')),
    C('B02', 'multi-heading: undetermined + only_ji → baseline', 'construction', 'khai', ['thien_duc'], [],
      CON('undetermined', 'only_ji')),
    C('B03', 'no heading activity → baseline, dormant dropped', 'grave_repair', 'khai', ['thien_nguyen'],
      ['tai_sat'], {}),
    C('B04', 'outside the P4 domain (no heading state) → baseline', 'opening', 'khai', ['dan_nhat'],
      ['kiep_sat', 'tai_sat'], {}, classical=('卯', '丁丑')),
    C('B05', 'single heading undetermined → baseline keeps the 收日 chain (same day as A24)', 'opening',
      'thu', ['dan_nhat'], ['kiep_sat'], OPEN('undetermined'), classical=('寅', '乙亥')),
]


def build_cases():
    out = []
    for c in CASES:
        out.append({**c, 'expected': score(c)})
    for c in BASELINE_CASES:
        assert activity_state(c['activityId'], c['headings'])[0] == 'baseline', c['id']
        drop = sorted(g for g in c['goodGods'] + c['badGods'] if g in DORMANT)
        out.append({**c, 'expected': {'state': 'baseline', 'equalsFlagOffWithout': drop}})
    return json.dumps({'version': 'p4-score-golden-v1', 'cases': out}, ensure_ascii=False, indent=1) + '\n'


def build_states():
    """Layer B: activity state for every P4 date × heading activity, from the frozen day composition."""
    days = {}
    with COMPOSE.open(encoding='utf-8') as f:
        for r in csv.DictReader(f, delimiter='\t'):
            prot = r['code'].split('prot=')[1].split(';')[0].split('+') if 'prot=' in r['code'] else []
            rule = 'all_taboo' if r['code'].startswith('all_taboo') else None
            days.setdefault(r['date'], {})[r['heading']] = H(r['state'], rule, prot)
    lines = ['date\tactivity\tstate\tdeciding_heading\tall_taboo']
    for date in sorted(days) + OUTSIDE:
        hs = days.get(date, {})
        for a in ACTIVITIES:
            if not HEADINGS.get(a):
                continue
            state, heading = activity_state(a, hs)
            taboo = state == 'only_ji' and any(hs[h].get('rule') == 'all_taboo' for h in HEADINGS[a])
            lines.append('\t'.join([date, a, state, heading or '', 'true' if taboo else 'false']))
    return '\n'.join(lines) + '\n'


def main():
    outputs = {'cases.json': build_cases(), 'activity-states.tsv': build_states()}
    write = '--write' in sys.argv
    bad = []
    for name, text in outputs.items():
        p = DIR / name
        if write:
            p.write_text(text, encoding='utf-8')
        elif not p.exists() or p.read_text(encoding='utf-8') != text:
            bad.append(name)
    for name, text in outputs.items():
        print(name, hashlib.sha256(text.encode()).hexdigest())
    if bad:
        sys.exit('differs: ' + ', '.join(bad))


if __name__ == '__main__':
    main()
