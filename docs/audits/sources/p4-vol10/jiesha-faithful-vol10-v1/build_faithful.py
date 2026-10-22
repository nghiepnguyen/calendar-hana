"""Faithful 卷十 劫煞 simulator: summarise raw.json (p4JieshaFaithfulVol10.test.ts, FULL run).

Run: python3 -I docs/audits/sources/p4-vol10/jiesha-faithful-vol10-v1/build_faithful.py
Audit only. Three ways: production (baseline), upper bound (UB, per-activity 宜 check), faithful (F,
verdict from the P4 composition engine per date). Rows are (date, activity) 卷十 劫煞 verdicts.
"""
import collections
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
P4 = HERE.parent
sys.path.insert(0, str(P4 / 'xiangdi-cancel-both-v1'))
import build_holdout as bh  # noqa: E402  (frozen in 5c35a9e)

raw = json.loads((HERE / 'raw.json').read_text(encoding='utf-8'))
acts = json.loads((P4.parents[3] / 'shared/almanac-data/xiejibianfangshu-yiji.json').read_text(encoding='utf-8'))['activityEntries']
h1b = json.loads((P4 / 'h1b-yuebiao-witness-v1' / 'lock.json').read_text(encoding='utf-8'))
TERM = h1b['headingTerms']['map']
PAGES = {p['monthJian'] + '-' + p['pillar']: p for p in h1b['pages']}
MD = set('丙子 庚子 壬子 甲寅 丙寅 庚寅 壬寅 乙卯 丁卯 辛卯 癸卯'.split())
inwin = lambda d: '2025-01-01' <= d <= '2027-12-31'
C = collections.Counter


def outcome(side):
    out, rating, ev, mags = C(), C(), C(), C()
    dates = set()
    for d in raw['days']:
        s = d[side]
        n_ann = len(s['avoid']) if side == 'ub' else sum(v[0] == 'avoid' for v in s['verdicts'].values())
        if n_ann or s['activities']:
            dates.add(d['date'])
        out['annotation'] += n_ann
        for a in s['activities']:
            out['rawDelta'] += bool(a['changedRows'])
            if a['score'][0] != a['score'][1]:
                out['effectiveScore'] += 1
                mags[a['score'][1] - a['score'][0]] += 1
            if a['status'][0] != a['status'][1]:
                rating[f"{a['status'][0]}→{a['status'][1]}"] += 1
            out['visibleActivity'] += a['status'][0] != a['status'][1] or a['hardWarning'][0] != a['hardWarning'][1]
        for e in s['events']:
            if e['classification'][0] != e['classification'][1]:
                ev[f"{e['classification'][0]}→{e['classification'][1]}"] += 1
    return {'affectedDates': len(dates), **dict(out), 'magnitude': dict(sorted(mags.items())),
            'ratingChanges': dict(rating.most_common()), 'eventClassification': dict(ev.most_common())}


def faithful_split():
    """Faithful verdict rows (activity with a 劫煞-listed heading) by status, and score changes by status."""
    rows, score = C(), C()
    for d in raw['days']:
        f = d['f']
        changed = {a['activityId']: a for a in f['activities'] if a['score'][0] != a['score'][1]}
        for a, (v, st) in f['verdicts'].items():
            if v == 'not_listed':
                continue
            rows[f'{st}:{v}'] += 1
            if a in changed:
                score[st] += 1
    return {'verdictRows': dict(sorted(rows.items())), 'effectiveScoreByStatus': dict(score)}


def reason(d, a):
    """Why faithful leaves activity a unnoted / undecided on day d (per its 劫煞-listed headings)."""
    v, st = d['f']['verdicts'][a]
    if st == 'UNRESOLVED':
        return 'UNRESOLVED'
    if st == 'SOURCE_DEPENDENT':
        return 'SOURCE_DEPENDENT'
    if v == 'avoid':
        return 'FAITHFUL_AVOID'
    why = set()
    for h, r in d['f']['headings'][a].items():
        if r.get('propagatedFrom'):
            why.add('PUZHU_PAIR')
        elif h == '安葬' and d['pillar'] in MD:
            why.add('PUZHU_PAIR(啟攢)')
        elif r.get('yi') is True:
            why.add('OTHER_YI_EVIDENCE')
        elif '刼煞' not in ((r.get('trace') or {}).get('ji') or []):
            why.add('OTHER (puzhu:06 / scope label)')
    return '+'.join(sorted(why)) or 'OTHER'


def context_model(cache, ctx, pillar):
    if ctx not in cache:
        cache[ctx] = {h['heading']: (False if h['heading'] == '安葬' and pillar in MD else h['overlap'])
                      for h in bh.predict(ctx, '刼煞')['headings']}
    return cache[ctx]


def upper_bound_rows():
    """Re-derive the earlier 2,085 notSupported / 2,653 unknownInModel UB rows and explain them."""
    cache, groups = {}, {'notSupported': C(), 'unknownInModel': C(), 'supported': C()}
    for d in raw['days']:
        if inwin(d['date']):
            continue
        m = context_model(cache, f"{d['month']}-{d['pillar']}", d['pillar'])
        for a in set(d['ub']['avoid']):
            states = [m.get(h.replace('壞', '壊').replace('劵', '券')) for h in acts.get(a, [])]
            g = 'supported' if True in states else 'unknownInModel' if None in states else 'notSupported'
            groups[g][reason(d, a)] += 1
    return {k: {'total': sum(v.values()), 'faithful': dict(v.most_common())} for k, v in groups.items()}


def distribution():
    by = {k: C() for k in ('year', 'decade', 'month', 'activity', 'delta', 'rating')}
    per_year_dates = C()
    for d in raw['days']:
        y = int(d['date'][:4])
        per_year_dates[y] += 1
        for a in d['f']['activities']:
            if a['score'][0] == a['score'][1] or d['f']['verdicts'].get(a['activityId'], ['', ''])[1] != 'CONFIRMED':
                continue
            by['year'][y] += 1
            by['decade'][f'{y // 10 * 10}s'] += 1
            by['month'][d['month']] += 1
            by['activity'][a['activityId']] += 1
            by['delta'][a['score'][1] - a['score'][0]] += 1
            by['rating'][f"{a['status'][0]}→{a['status'][1]}"] += 1
    per_date = {y: by['year'][y] / per_year_dates[y] for y in per_year_dates if per_year_dates[y]}
    vals = sorted(per_date.values())
    med = vals[len(vals) // 2]
    flags = {y: round(r, 2) for y, r in per_date.items() if abs(r - med) > 0.5 * med}
    return {**{k: dict(sorted(v.items(), key=lambda kv: str(kv[0]))) for k, v in by.items()},
            'confirmedScoreChangesPerScopeDate': {'median': round(med, 2), 'flaggedYears': dict(sorted(flags.items()))}}


def calibration():
    """2025–2027: faithful P4 heading rows vs every comparable heading of the 16 locked 劫煞 pages."""
    out, f1 = C(), []
    for d in raw['days']:
        if 'rows' not in d:
            continue
        ctx = f"{d['month']}-{d['pillar']}"
        page = PAGES.get(ctx)
        for h, r in d['rows'].items():
            if not page or h not in TERM:
                out['unmodelled (no 月表 term or page)'] += 1
                continue
            printed = TERM[h] in page['jiLine']
            cand = r['state'] in ('only_ji', 'both_present')
            if r['state'] == 'undetermined':
                out['ambiguous (engine undetermined)'] += 1
            elif '土王用事後' in (r.get('ji') or []):
                out['non-comparable (dated 土王 operand; 月表 page is generic)'] += 1
            elif ctx == '丑-丙寅':
                out['ambiguous (丑-丙寅 月德)'] += 1
            else:
                out['exact' if printed == cand else 'contradiction'] += 1
            others = [g for g in (r.get('ji') or []) if g != '刼煞']
            if r.get('propagatedFrom') and others:
                f1.append({'date': d['date'], 'context': ctx, 'heading': h, 'otherJi': others,
                           'propagatedFrom': r['propagatedFrom'], 'state': r['state'], 'printedJi': printed})
    contra = []
    for d in raw['days']:
        if 'rows' not in d:
            continue
        ctx = f"{d['month']}-{d['pillar']}"
        page = PAGES.get(ctx)
        for h, r in d['rows'].items():
            if (page and h in TERM and r['state'] != 'undetermined' and ctx != '丑-丙寅'
                    and '土王用事後' not in (r.get('ji') or [])):
                if (TERM[h] in page['jiLine']) != (r['state'] in ('only_ji', 'both_present')):
                    contra.append({'date': d['date'], 'context': ctx, 'heading': h, 'state': r['state'],
                                   'ji': r.get('ji'), 'propagatedFrom': r.get('propagatedFrom')})
    return {'headingRows': dict(out), 'contradictions': contra, 'f1CrossGodPropagation': f1}


def verdict_table():
    """Option C check: the faithful verdict per (context, activity) over every simulated date."""
    cells = collections.defaultdict(set)
    for d in raw['days']:
        for a, (v, _st) in d['f']['verdicts'].items():
            if v != 'not_listed':
                cells[f"{d['month']}-{d['pillar']}"].add((a, v))
    table, varying = {}, []
    for ctx, pairs in sorted(cells.items()):
        by = collections.defaultdict(set)
        for a, v in pairs:
            by[a].add(v)
        varying += [f'{ctx}:{a}' for a, vs in by.items() if len(vs) > 1]
        table[ctx] = {a: sorted(vs)[0] for a, vs in sorted(by.items())}
    return {'contexts': len(table), 'cells': sum(len(v) for v in table.values()), 'varyingAcrossDates': varying,
            'table': table}


faithful = {
    'version': 'jiesha-faithful-vol10-v1',
    'baselinePolicy': 'production: 卷十 刼煞 辰戌丑未 no 德 = cancel_both (P4 neither_recorded, 卷十 no_annotation)',
    'candidatePolicies': {
        'upperBound': 'OVERLAP per activity in 卷十 (no 鋪註 pairs) + P4 candidate',
        'faithful': '卷十 劫煞 verdict = 劫煞 忌 survives on an activity heading in the P4 composition engine '
                    '(宜, 鋪註 pairs, puzhu:06, H1-B) per date; 鳴吠對 → 宜啟攢 → 「有宜啟攢不註忌安葬」; '
                    'unknown operands enumerated (CONFIRMED if invariant, SOURCE_DEPENDENT if decided only with '
                    'the owner soil convention extended past 2025–2027, else UNRESOLVED)',
    },
    'supportedRange': raw['range'], 'scannedDays': raw['scanned'], 'scopeDates': len(raw['days']),
    'production': 'reference (all changes are measured against it)',
    'upperBound': outcome('ub'),
    'faithful': {**outcome('f'), **faithful_split()},
    'upperBoundRows': upper_bound_rows(),
    'distribution': distribution(),
    'witnessWindow': calibration(),
    'verdictTable': verdict_table(),
}
(HERE / 'faithful.json').write_text(json.dumps(faithful, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(json.dumps({k: faithful[k] for k in ('upperBound', 'faithful', 'upperBoundRows')}, ensure_ascii=False, indent=1))
