"""Roadmap 9b: score Golden v2 for the P4 adapter (flag ON), authored before the 9b adapter code.

    python3 -I docs/audits/sources/p4-vol10/p4-score-golden-v2/golden.py [--write]

Supersedes p4-score-golden-v1 (kept, sha-locked) after the owner policy change of 2026-10-18
(tasks/prd-p4-9b.md): ALL_TABOO_FLOOR_V1 and MULTI_HEADING_JI_WINS_V1. Default verifies the committed
outputs byte-for-byte; --write regenerates them. Independent of the TS scorer/adapter: reads the product
catalogs, the frozen full Golden v2 (day composition + presence), the frozen flag-OFF baseline v1 and the
frozen per-date catalog presence input (role frozen_engine_presence_input, PRD 9b §4, owner §6.4).
"""
import csv
import hashlib
import json
import sys
from pathlib import Path

DIR = Path('docs/audits/sources/p4-vol10/p4-score-golden-v2')
DATA = Path('shared/almanac-data')
GV2 = Path('docs/audits/sources/p4-vol10/p4-full-golden-v2')
COMPOSE = GV2 / 'compose/dated.tsv'
PRESENCE_V2 = GV2 / 'presence/dated.tsv'
BASELINE = Path('docs/audits/sources/p4-vol10/p4-adapter-baseline-v1/activities.tsv')
PRESENCE_INPUT = DIR / 'presence-input.tsv'
OUTSIDE = ['2024-12-31', '2028-01-01', '2035-06-15']


def load(name):
    return json.loads((DATA / name).read_text(encoding='utf-8'))


GOOD, BAD, TRUC = load('good-gods.json'), load('bad-gods.json'), load('truc.json')
MANIFEST, OVERRIDES = load('manifest.json'), load('overrides.json')
HEADINGS = load('xiejibianfangshu-yiji.json')['activityEntries']
ACTIVITIES = [a['id'] for a in load('activities.json')['items'] if a['enabled']]
GOOD_IDS = {g['id'] for g in GOOD['items']}
BAD_IDS = {g['id'] for g in BAD['items']}
DORMANT = {
    'thien_nguyen', 'tu_tuong', 'thoi_duc', 'ngu_hop', 'bat_tuong', 'thien_thuong', 'pho_ho',
    'tai_sat', 'nguyet_sat', 'nguyet_hai', 'nguyet_yem', 'yem_doi', 'dai_thoi', 'tu_phe', 'tu_ky',
    'tu_cung', 'ngu_mo', 'ngu_ly', 'vang_vong', 'bat_chuyen', 'quy_ky',
}
# PRD 8 §6.3/§6.5: fixed order, strictest first.
ORDER = ['only_ji', 'both_present', 'neither_recorded', 'only_yi']
# MULTI_HEADING_JI_WINS_V1 (PRD 9b §2 P2): a not_recorded heading yields to a heading that records 忌.
JI_STATES = {'only_ji', 'both_present'}
PENALTY = -25
FLOOR = 25  # ALL_TABOO_FLOOR_V1 (PRD 9b §2 P1)
POLICY = 'product_policy_default_penalty'
FLOOR_CLAUSE = 'all_taboo_floor_v1'
BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
STEMS = '甲乙丙丁戊己庚辛壬癸'
# Set False only to reproduce the roadmap-8 policy (authoring cross-check against roadmap 9 full).
POLICY_9B = True


def activity_state(activity, headings):
    """headings: {heading: {state, rule?, prot?}} → ('baseline', None) or (state, deciding heading)."""
    hs = HEADINGS.get(activity)
    if not hs:
        return 'baseline', None
    states = [headings.get(h, {}).get('state', 'not_recorded') for h in hs]
    if any(s == 'undetermined' or (s != 'not_recorded' and s not in ORDER) for s in states):
        return 'baseline', None
    if 'not_recorded' in states:
        rest = [s for s in states if s != 'not_recorded']
        if not POLICY_9B or not rest or not any(s in JI_STATES for s in rest):
            return 'baseline', None
    best = min((s for s in states if s != 'not_recorded'), key=ORDER.index)
    return best, hs[states.index(best)]


def protected_match(han, prot):
    # Exact han only: every 百忌日 god (Golden v2 token 百忌X) already carries preserve_bad.
    return han in prot


def preserve_bad(god, activity):
    return any(
        o['enabled'] and o['action'] == 'preserve_bad' and o['when'].get('targetPresent') == god
        and activity in o['activityIds'] for o in OVERRIDES['items'])


def penalty_row(activity, amount, clause):
    return {'source': 'bad_god', 'ruleId': f'p4_default_penalty:{activity}', 'status': 'applied',
            'rawDelta': amount, 'preCapDelta': amount, 'hardWarning': False, '_protected': False,
            'evidenceOrigin': 'product_policy', 'policyId': POLICY, 'sourceClauseId': clause,
            'balancingEligible': False}


def score(case):
    """Reference adapter, flag ON, state not baseline. FR-02/FR-04, PRD 8 §6.5–6.13, PRD 9b §2."""
    activity, officer_id = case['activityId'], case['officerId']
    state, heading = activity_state(activity, case['headings'])
    assert state != 'baseline', case['id']
    prot = sorted({p for h in HEADINGS[activity] for p in case['headings'].get(h, {}).get('prot', [])})
    all_taboo = any(case['headings'].get(h, {}).get('rule') == 'all_taboo' for h in HEADINGS[activity])
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
    # P1 (ii) / PRD 8 §6.7–6.13: one −25 when a 忌 state leaves no applied negative row (subsumed gods
    # are informational, so they never block it). Roadmap 8 fired it on only_ji only.
    trigger = JI_STATES if POLICY_9B else {'only_ji'}
    if state in trigger and not any(r['status'] == 'applied' and r['preCapDelta'] < 0 for r in rows):
        rows.append(penalty_row(activity, PENALTY, f'p4:{heading}' + (':all_taboo' if all_taboo else '')))
    # FR-04: one cap allocation per god source, after resolution, in catalog order; Trực uncapped.
    used = {}
    for source, data in (('good_god', GOOD), ('bad_god', BAD)):
        used[source] = 0
        for r in rows:
            if r['source'] != source or r['status'] != 'applied':
                continue
            take = min(abs(r['preCapDelta']), max(0, abs(data['capPerActivity']) - used[source]))
            r['scoreDelta'] = take if r['preCapDelta'] > 0 else -take
            used[source] += take
    for r in rows:  # Trực is uncapped: its delta is its pre-cap delta
        r.setdefault('scoreDelta', r['preCapDelta'] if r['status'] == 'applied' else 0)
    # P1 (i): on 諸事皆忌 the applied negatives in scope (Trực + catalog gods, after cap) reach −25.
    if POLICY_9B and all_taboo:
        n = sum(-r['scoreDelta'] for r in rows if r['status'] == 'applied' and r['scoreDelta'] < 0)
        if n < FLOOR:
            top = penalty_row(activity, n - FLOOR, f'p4:{heading}:{FLOOR_CLAUSE}')
            assert FLOOR - n <= abs(BAD['capPerActivity']) - used['bad_god'], case['id']
            top['scoreDelta'] = n - FLOOR
            rows.append(top)
    for r in rows:
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
WED = lambda a, b: {'結婚姻': a if isinstance(a, dict) else H(a), '嫁娶': b if isinstance(b, dict) else H(b)}  # noqa: E731
CON = lambda a, b, **k: {'營建宮室': H(a, **k), '興造動土': H(b, **k)}  # noqa: E731
LIV = lambda a, b: {'牧養': H(a), '納畜': H(b)}  # noqa: E731

# v1 cases A01–A25 keep their inputs; only A21 changes expected (P1 (i) floor). A26–A35 are new.
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
    C('A21', '諸事皆忌 with a protected 忌 left (−15) → floor tops up −10 (P1 i; v1: no penalty)', 'opening',
      'khai', ['dan_nhat'], ['tu_phe'], OPEN('only_ji', rule='all_taboo', prot=['四廢'])),
    C('A22', '諸事皆忌 with no negative row → −25 (all_taboo clause)', 'opening', 'khai', ['dan_nhat'], [],
      OPEN('only_ji', rule='all_taboo', prot=['四廢'])),
    C('A23', 'both_present: 月破 subsumed by 破日 keeps its hard warning', 'wedding', 'pha', [],
      ['nguyet_pha'], WED('both_present', 'both_present'), classical=('子', '庚午')),
    C('A24', '6 chains replaced: 收日 chain lifts this pair when OFF; ON reads only_ji', 'opening', 'thu', ['dan_nhat'],
      ['kiep_sat'], OPEN('only_ji'), classical=('寅', '乙亥')),
    C('A25', 'protected on one heading of two (土王用事後, no override) under only_yi', 'construction', 'khai',
      ['thien_duc'], ['kiep_sat', 'tho_vuong_dung_su'], CON('only_yi', 'only_yi', prot=['土王用事後'])),
    C('A26', 'P1 i: 諸事皆忌, only a Trực −15 → floor −10 (Trực counts)', 'opening', 'binh', ['dan_nhat'], [],
      OPEN('only_ji', rule='all_taboo')),
    C('A27', 'P1 i: 諸事皆忌, Trực −15 + 刼煞 −15 = 30 → no floor row', 'opening', 'thu', [], ['kiep_sat'],
      OPEN('only_ji', rule='all_taboo')),
    C('A28', 'P1 i: 諸事皆忌, Trực −25 exactly at the floor → no floor row', 'opening', 'be', [], [],
      OPEN('only_ji', rule='all_taboo')),
    C('A29', 'P1 i: plain only_ji with −15 keeps real weight (no floor; owner 1 (a), 4.1)', 'opening',
      'binh', ['dan_nhat'], [], OPEN('only_ji')),
    C('A30', 'P1 ii: both_present with no negative row → −25', 'opening', 'khai', ['dan_nhat'], [],
      OPEN('both_present')),
    C('A31', 'P1 ii: both_present, a negative Trực blocks the −25', 'opening', 'binh', ['dan_nhat'], [],
      OPEN('both_present')),
    C('A32', 'P1 ii: both_present, protected 忌 −15 blocks the −25', 'opening', 'khai', ['dan_nhat'],
      ['tu_phe'], OPEN('both_present', prot=['四廢'])),
    C('A33', 'P2: only_ji + not_recorded → only_ji, then −25', 'wedding', 'thanh', ['thien_duc'], [],
      WED('only_ji', 'not_recorded')),
    C('A34', 'P2: not_recorded + both_present → both_present, then −25', 'wedding', 'thanh', ['thien_duc'],
      [], WED('not_recorded', 'both_present')),
    C('A35', 'P2 + P1 i: 諸事皆忌 heading + not_recorded, Trực −15 → only_ji, floor −10', 'wedding', 'kien',
      ['thien_duc'], [], WED(H('only_ji', rule='all_taboo'), 'not_recorded')),
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
    C('B06', 'P2: not_recorded + neither_recorded → baseline (only 忌 states win)', 'wedding', 'man',
      ['thien_duc'], ['kiep_sat'], WED('not_recorded', 'neither_recorded')),
    C('B07', 'P2: undetermined + not_recorded → baseline', 'livestock', 'khai',
      ['thien_duc'], [], LIV('undetermined', 'not_recorded')),
]


def build_cases():
    out = []
    for c in CASES:
        out.append({**c, 'expected': score(c)})
    for c in BASELINE_CASES:
        assert activity_state(c['activityId'], c['headings'])[0] == 'baseline', c['id']
        drop = sorted(g for g in c['goodGods'] + c['badGods'] if g in DORMANT)
        out.append({**c, 'expected': {'state': 'baseline', 'equalsFlagOffWithout': drop}})
    return json.dumps({'version': 'p4-score-golden-v2', 'cases': out}, ensure_ascii=False, indent=1) + '\n'


def tsv(path):
    with path.open(encoding='utf-8') as f:
        return list(csv.DictReader(f, delimiter='\t'))


def day_headings():
    days = {}
    for r in tsv(COMPOSE):
        prot = r['code'].split('prot=')[1].split(';')[0].split('+') if 'prot=' in r['code'] else []
        rule = 'all_taboo' if r['code'].startswith('all_taboo') else None
        days.setdefault(r['date'], {})[r['heading']] = H(r['state'], rule, prot)
    return days


def build_states(days):
    """Layer B: activity state for every P4 date × heading activity (+ 3 outside dates)."""
    lines = ['date\tactivity\tstate\tdeciding_heading\tall_taboo']
    for date in sorted(days) + OUTSIDE:
        hs = days.get(date, {})
        for a in ACTIVITIES:
            if not HEADINGS.get(a):
                continue
            state, heading = activity_state(a, hs)
            taboo = state == 'only_ji' and any(hs.get(h, {}).get('rule') == 'all_taboo' for h in HEADINGS[a])
            lines.append('\t'.join([date, a, state, heading or '', 'true' if taboo else 'false']))
    return '\n'.join(lines) + '\n'


def build_scores(days):
    """Layer C: exact score/status for every P4 date × activity. Baseline rows equal flag-OFF baseline v1."""
    base = {(r['date'], r['activity']): r for r in tsv(BASELINE)}
    gv2 = {r['date']: r for r in tsv(PRESENCE_V2)}
    legacy_ids = {g for r in gv2.values() for g in r['legacy'].split()}
    lines = ['date\tactivity\tstate\tscore\tstatus\thard_warning\tpolicy_rows']
    for p in tsv(PRESENCE_INPUT):
        date = p['date']
        engine = set(p['good'].split()) | set(p['bad'].split())
        g = gv2[date]
        # Cross-check the frozen engine input against the frozen Golden v2 presence (legacy 14).
        assert engine & legacy_ids == set(g['legacy'].split()), date
        assert not engine & DORMANT, date
        cday, officer = day(g['month_jian'], g['pillar'])
        assert officer == p['officer'], date
        present = engine | set(g['dormant'].split())
        for a in ACTIVITIES:
            state, _ = activity_state(a, days.get(date, {}))
            if state == 'baseline':
                b = base[(date, a)]
                lines.append('\t'.join([date, a, 'baseline', b['score'], b['status'], b['hard_warning'], '']))
                continue
            r = score({'id': f'{date}:{a}', 'activityId': a, 'officerId': officer,
                       'goodGods': sorted(present & GOOD_IDS), 'badGods': sorted(present & BAD_IDS),
                       'headings': days[date]})
            pol = ' '.join(f"{x['sourceClauseId']}={x['scoreDelta']}" for x in r['rows']
                           if x['evidenceOrigin'] == 'product_policy')
            lines.append('\t'.join([date, a, state, str(r['score']), r['status'],
                                    'true' if r['hardWarning'] else 'false', pol]))
    return '\n'.join(lines) + '\n'


def outputs():
    days = day_headings()
    return {'cases.json': build_cases(), 'activity-states.tsv': build_states(days),
            'activity-scores.tsv': build_scores(days)}


def main():
    out = outputs()
    write = '--write' in sys.argv
    bad = []
    for name, text in out.items():
        p = DIR / name
        if write:
            p.write_text(text, encoding='utf-8')
        elif not p.exists() or p.read_text(encoding='utf-8') != text:
            bad.append(name)
    for name, text in out.items():
        print(name, hashlib.sha256(text.encode()).hexdigest())
    if bad:
        sys.exit('differs: ' + ', '.join(bad))


if __name__ == '__main__':
    main()
