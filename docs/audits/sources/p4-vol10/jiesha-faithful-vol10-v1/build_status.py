"""Faithful 劫煞 cells: split CONFIRMED from design/F1-dependent cells, then re-split full-range counts.

Run: python3 -I docs/audits/sources/p4-vol10/jiesha-faithful-vol10-v1/build_status.py
Inputs: faithful.json (verdictTable), sensitivity.json (engine rows per context), raw.json.
- LABEL_DEPENDENT: 劫煞's 忌 survives on the activity only where puzhu:06 returned hold:UNDETERMINED, i.e.
  only because the restored scope still carries the cancel_both label (engine has no valid label for it).
- F1_DEPENDENT: blank only through 鋪註 propagation whose trigger heading is unnoted by another god's
  相抵 (not by 劫煞's own 宜 overlap, nor by 鳴吠對 → 啟攢).
"""
import collections
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[4]
faithful = json.loads((HERE / 'faithful.json').read_text(encoding='utf-8'))
sens = json.loads((HERE / 'sensitivity.json').read_text(encoding='utf-8'))
raw = json.loads((HERE / 'raw.json').read_text(encoding='utf-8'))
acts = json.loads((ROOT / 'shared/almanac-data/xiejibianfangshu-yiji.json').read_text(encoding='utf-8'))['activityEntries']
vol10 = json.loads((ROOT / 'shared/almanac-data/xiejibianfangshu-vol10-yiji.json').read_text(encoding='utf-8'))
norm = lambda s: s.replace('壞', '壊').replace('劵', '券').replace('册', '冊')
JIE = norm(next(e for e in vol10['entries'] if e['id'] == 'jie_sha')['avoid'])
MD = set('丙子 庚子 壬子 甲寅 丙寅 庚寅 壬寅 乙卯 丁卯 辛卯 癸卯'.split())


def survives(r):
    return r['state'] in ('only_ji', 'both_present') and '刼煞' in (r.get('ji') or [])


cells = {}
for ctx, verdicts in faithful['verdictTable']['table'].items():
    rows = sens[ctx]['rows']
    pillar = ctx.split('-')[1]
    for a, v in verdicts.items():
        hs = [h for h in (norm(x) for x in acts[a]) if h in rows and h in JIE]
        status, why = 'CONFIRMED', []
        if v == 'avoid':
            keep = [h for h in hs if survives(rows[h])]
            held = [h for h in keep if (rows[h].get('puzhu06') or '').startswith('hold:UNDETERMINED')]
            if keep and len(held) == len(keep):
                status, why = 'SOURCE_DEPENDENT', [f'LABEL:{h}' for h in held]
        else:
            for h in hs:
                src = rows[h].get('propagatedFrom')
                if not src or survives(rows[h]):
                    continue
                own = [x for x in src.split('+') if x in JIE and (rows.get(x, {}).get('yi') is True
                       or (x == '安葬' and pillar in MD))]
                if not own:
                    why.append(f'F1:{h}<{src}')
            if why and all(w.startswith('F1') for w in why) and not any(
                    rows[h].get('yi') is True and not rows[h].get('propagatedFrom') for h in hs):
                status = 'SOURCE_DEPENDENT'
            else:
                why = []
        cells[f'{ctx}|{a}'] = {'verdict': v, 'status': status, 'why': why}

split = collections.defaultdict(collections.Counter)
for d in raw['days']:
    ctx = f"{d['month']}-{d['pillar']}"
    changed = {x['activityId']: x for x in d['f']['activities']}
    for a, (v, _st) in d['f']['verdicts'].items():
        if v == 'not_listed':
            continue
        st = cells[f'{ctx}|{a}']['status']
        if v == 'avoid':
            split[st]['annotation'] += 1
        x = changed.get(a)
        if x and x['score'][0] != x['score'][1]:
            split[st]['effectiveScore'] += 1
            if x['status'][0] != x['status'][1]:
                split[st]['rating'] += 1
    sd = any(cells[f"{ctx}|{x['activityId']}"]['status'] != 'CONFIRMED'
             for x in d['f']['activities'] if f"{ctx}|{x['activityId']}" in cells)
    for e in d['f']['events']:
        if e['classification'][0] != e['classification'][1]:
            split['SOURCE_DEPENDENT' if sd else 'CONFIRMED']['eventClassification (date-level attribution)'] += 1

kx = sens['戌-癸亥']['rows']['開倉庫出貨財']
out = {
    'version': 'jiesha-faithful-status-v1',
    'note': 'CONFIRMED = decided under the current OWNER_ADOPTED inputs (puzhu:06 Q1–Q4a, P5 rule D, 母倉, '
            'H1-B, soil convention) and invariant to unknown date operands; not out-of-sample confirmation.',
    'cells': collections.Counter(f"{c['status']}:{c['verdict']}" for c in cells.values()),
    'dependentCells': {k: c for k, c in cells.items() if c['status'] != 'CONFIRMED'},
    'fullRangeByStatus': {k: dict(v) for k, v in split.items()},
    'xuGuiHai開倉庫': {'date': sens['戌-癸亥']['date'], **kx},
}
(HERE / 'status.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(json.dumps({k: out[k] for k in ('cells', 'fullRangeByStatus', 'xuGuiHai開倉庫')}, ensure_ascii=False, indent=1))
print(len(out['dependentCells']), list(out['dependentCells'].items())[:12])
