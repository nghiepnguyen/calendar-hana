"""劫煞 OVERLAP impact study: summarise raw.json (written by p4JieshaOverlapImpact.test.ts, FULL run).

Run: python3 -I docs/audits/sources/p4-vol10/jiesha-overlap-impact-v1/build_impact.py
Audit only. Month Jian of a changed day follows from the 劫煞 branch of the scoped clause
(辰→巳, 戌→亥, 未→申, 丑→寅), so the context is month + day pillar.
"""
import collections
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
P4 = HERE.parent
STEMS, BRANCHES = '甲乙丙丁戊己庚辛壬癸', '子丑寅卯辰巳午未申酉戌亥'
MONTH_OF = {'巳': '辰', '亥': '戌', '申': '未', '寅': '丑'}
raw = json.loads((HERE / 'raw.json').read_text(encoding='utf-8'))
freeze = json.loads((P4 / 'xiangdi-cancel-both-v1' / 'freeze.json').read_text(encoding='utf-8'))
witnessed = {(r['context'], r['heading']): r for r in freeze['rows']}
witnessed_ctx = set(freeze['pages'])
with open(P4 / 'p4-full-golden-v2' / 'compose' / 'context.tsv', encoding='utf-8') as f:
    CATALOG = {line.split('\t')[3] for line in f.readlines()[1:]}


def jd(date):
    y, m, d = map(int, date.split('-'))
    a = (14 - m) // 12
    y2, m2 = y + 4800 - a, m + 12 * a - 3
    return d + (153 * m2 + 2) // 5 + 365 * y2 + y2 // 4 - y2 // 100 + y2 // 400 - 32045


def context(date):
    n = jd(date)
    pillar = STEMS[(n + 9) % 10] + BRANCHES[(n + 1) % 12]
    return f'{MONTH_OF[pillar[1]]}-{pillar}'


def witness_class(ctx, heading, to_state):
    if ctx not in witnessed_ctx:
        return 'NO_DIRECT_WITNESS'
    if ctx == '丑-丙寅':
        return 'AMBIGUOUS'
    r = witnessed.get((ctx, heading))
    if r is None or r['printedJi'] is None:
        return 'CONSISTENT_WITH_CANDIDATE'
    # neither_recorded and not_recorded both print no 忌; only_ji prints 忌.
    return 'SUPPORTED_BY_WITNESS' if r['printedJi'] == (to_state == 'only_ji') else 'AMBIGUOUS'


def no_effect_reason(a):
    if a['p4State'][0] == a['p4State'][1] and a['p4State'][0] != 'baseline':
        return 'activity_state_unchanged (another heading already decides the activity)'
    if not a['changedRows']:
        return 'no_contribution_row_changed (no applied 劫煞/chain row to restore)'
    return 'score_unchanged_after_cap_or_aggregation'


def summarise(name, window):
    days = [d for d in raw['days'] if (not window or ('2025-01-01' <= d['date'] <= '2027-12-31'))]
    out = collections.Counter()
    trans, heads, acts, mags, ratings, events, reasons, wclass = (collections.Counter() for _ in range(8))
    ctxs, dates, unresolved, wrows = set(), set(), collections.Counter(), []
    for d in days:
        s = d[name]
        s['vol10Log'] = [dict(x) for x in {(v['activityId'], v['action']): v for v in s['vol10Log']}.values()]
        changed = bool(s['headings']) or any(v['action'] == 'avoid' for v in s['vol10Log']) or bool(s['activities'])
        if not changed:
            continue
        dates.add(d['date'])
        ctxs.add(context(d['date']))
        for h in s['headings']:
            out['p4HeadingRows'] += 1
            trans[f"{h['from']}→{h['to']}"] += 1
            heads[h['heading']] += 1
            if window:
                wc = witness_class(context(d['date']), h['heading'], h['to'])
                wclass[wc] += 1
                if wc != 'SUPPORTED_BY_WITNESS':
                    wrows.append({'date': d['date'], 'context': context(d['date']), **h, 'class': wc})
        out['vol10VerdictRows'] += sum(v['action'] == 'avoid' for v in s['vol10Log'])
        if any(v['action'] == 'avoid' for v in s['vol10Log']):
            trans['no_annotation→avoid (卷十 verdict)'] += sum(v['action'] == 'avoid' for v in s['vol10Log'])
        unresolved['p4 heading 宜 unknown'] += len({x['heading'] for x in s['p4Log'] if x.get('yi') is None and x['heading'] in CATALOG})
        unresolved['卷十 activity 宜 unknown'] += sum(v['action'] == 'unresolved' for v in s['vol10Log'])
        for a in s['activities']:
            if a['annotated']:
                out['annotatedActivityRows'] += 1
            if a['changedRows']:
                out['rawDeltaActivityRows'] += 1
                out['rawDeltaContributionRows'] += a['changedRows']
            if a['score'][0] != a['score'][1]:
                out['effectiveScoreRows'] += 1
                mags[a['score'][1] - a['score'][0]] += 1
                acts[a['activityId']] += 1
            elif a['annotated']:
                reasons[no_effect_reason(a)] += 1
            if a['status'][0] != a['status'][1]:
                ratings[f"{a['status'][0]}→{a['status'][1]}"] += 1
            if a['status'][0] != a['status'][1] or a['hardWarning'][0] != a['hardWarning'][1]:
                out['visibleActivityRows'] += 1
        for e in s['events']:
            if e['classification'][0] != e['classification'][1]:
                events[f"{e['classification'][0]}→{e['classification'][1]}"] += 1
            out['eventScoreRows'] += e['score'][0] != e['score'][1]
    res = {
        'affectedDates': len(dates), 'affectedContexts': len(ctxs),
        'affectedRows': {'annotation': out['p4HeadingRows'] + out['vol10VerdictRows'], **dict(out)},
        'annotationChanges': dict(trans.most_common()), 'headings': dict(heads.most_common()),
        'scoreChanges': {'rawDeltaActivityRows': out['rawDeltaActivityRows'],
                         'effectiveScoreRows': out['effectiveScoreRows'],
                         'magnitude': dict(sorted(mags.items())),
                         'noEffectReasons': dict(reasons.most_common())},
        'ratingChanges': dict(ratings.most_common()),
        'visibleChanges': {'activityStatusOrHardWarningRows': out['visibleActivityRows'],
                           'eventClassification': dict(events.most_common()),
                           'eventScoreRows': out['eventScoreRows']},
        'topActivities': dict(acts.most_common(10)),
        'unresolvedCases': dict(unresolved),
    }
    if window:
        res['witnessClass'] = dict(wclass.most_common())
        res['witnessNonSupported'] = wrows
    return res


def vol10_pairs_check(name):
    """Outside 2025–2027 the 卷十 layer decides per activity without the 鋪註 pairs. Cross-check each
    卷十 'avoid' against the context-level OVERLAP + pairs model (build_holdout.overlap, frozen
    5c35a9e; Scenario B adds the 鳴吠對 → 安葬 chain). Unsupported = no activity heading predicted 忌."""
    import sys
    sys.path.insert(0, str(P4 / 'xiangdi-cancel-both-v1'))
    import build_holdout as bh
    acts = json.loads((P4.parents[3] / 'shared/almanac-data/xiejibianfangshu-yiji.json').read_text(encoding='utf-8'))['activityEntries']
    md = set('丙子 庚子 壬子 甲寅 丙寅 庚寅 壬寅 乙卯 丁卯 辛卯 癸卯'.split())
    cache, out = {}, collections.Counter()
    for d in raw['days']:
        if '2025-01-01' <= d['date'] <= '2027-12-31':
            continue
        ctx = context(d['date'])
        if ctx not in cache:
            pil = ctx.split('-')[1]
            cache[ctx] = {h['heading']: (False if name == 'B' and h['heading'] == '安葬' and pil in md else h['overlap'])
                          for h in bh.predict(ctx, '刼煞')['headings']}
        for a in {v['activityId'] for v in d[name]['vol10Log'] if v['action'] == 'avoid'}:
            hs = [h.replace('壞', '壊').replace('劵', '券') for h in acts.get(a, [])]
            states = [cache[ctx].get(h) for h in hs]
            out['supported' if True in states else 'unknownInModel' if None in states else 'notSupported'] += 1
    return dict(out)


impact = {
    'version': 'jiesha-overlap-impact-v1',
    'baselinePolicy': 'production: 卷十 刼煞 辰戌丑未 without 天德/月德/天德合/月德合 = cancel_both '
                      '(P4 neither_recorded; 卷十 scoring no_annotation)',
    'candidatePolicy': {
        'A': 'OVERLAP: in that scope a 劫煞 heading whose 宜 evidence is false keeps 忌; true/unknown unchanged; '
             'existing 鋪註 propagation and puzhu:06 run as in production',
        'B': 'A + 鳴吠對 (corrected 立成, 11 days) 宜啟攢 → 鋪註 「凡吉凶相抵有宜啟攢不註忌安葬」: 安葬 stays unnoted',
    },
    'supportedRange': raw['range'], 'scannedDays': raw['scanned'],
    'full': {'A': summarise('A', False), 'B': summarise('B', False)},
    'witnessWindow': {'A': summarise('A', True), 'B': summarise('B', True)},
    'vol10LayerPairsCheck': {'A': vol10_pairs_check('A'), 'B': vol10_pairs_check('B')},
}
(HERE / 'impact.json').write_text(json.dumps(impact, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
for scope in ('full', 'witnessWindow'):
    for s in ('A', 'B'):
        r = impact[scope][s]
        print(scope, s, 'dates', r['affectedDates'], 'ctx', r['affectedContexts'], 'rows', r['affectedRows'])
