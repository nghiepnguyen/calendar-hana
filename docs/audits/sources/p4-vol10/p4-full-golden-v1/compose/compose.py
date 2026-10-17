"""Full Golden P4, task 3.3: day states for 29 headings — context720 and dated1095.

Composes the 3.2 忌 facts with 宜 evidence, then applies, in order: puzhu:28 (諸事不忌), pillar/remaining
諸事皆忌, the owner H1-B rule (extended to canonical by F5), puzhu:06 (authority p4b-puzhu06-v3) and one
pass of the propagation lines (鋪註 11, 16–24).

宜 evidence (卷十一 lists, ANY rule): 德/赦/願/月恩/四相/時德 and dormant/legacy gods from 3.1 presence and
3.2a operands; officers from 3.2a; 王日 from p4-vol10-season-days.json; the 11 P4-C gods from the frozen
yi-domains-v1 Golden; 修倉庫 from the frozen P5 Golden (owner rule D). No engine or sweep input.

    python3 -I docs/audits/sources/p4-vol10/p4-full-golden-v1/compose/compose.py [--write]
"""
import csv
import hashlib
import importlib.util
import json
import sys
from collections import Counter
from pathlib import Path

HERE = Path('docs/audits/sources/p4-vol10/p4-full-golden-v1/compose')
JI = Path('docs/audits/sources/p4-vol10/p4-full-golden-v1/ji')


def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


dj = _load('dated_ji', JI / 'dated_ji.py')
gr = _load('grades', JI / 'grades.py')
cj = dj.cj
sc = cj.sc
op = sc.op

VOL11 = sc.VOL11
SEASON = Path('shared/almanac-data/p4-vol10-season-days.json')
YI_DOMAINS = Path('docs/audits/sources/p4-vol10/yi-domains-v1/expected.tsv')
P5_CONTEXT = Path('docs/audits/sources/p4-vol10/p5-warehouse-golden-v1/context.tsv')
P5_DATED = Path('docs/audits/sources/p4-vol10/p5-warehouse-golden-v1/dated.tsv')
PUZHU06 = Path('shared/almanac-data/p4b-puzhu06-v3.json')
COMPOSITION = cj.COMPOSITION

YI_VOCAB = ('天德合 月德合 天德 月德 天赦 天願 月恩 四相 時德 天巫 開日 普護 福生 聖心 益後 續世 民日 三合 天喜 六合 五合 '
            '不將 驛馬 天馬 成日 危日 滿日 五富 母倉 收日 天倉 王日 建日 吉期 天恩 福德 天后 除日 破日 天醫 解神 除神 鳴吠 月破').split()
OFFICER_YI = {'開日': 'khai', '成日': 'thanh', '危日': 'nguy', '滿日': 'man', '收日': 'thu', '建日': 'kien',
              '除日': 'tru', '破日': 'pha', '月破': 'pha'}
GOD_YI = {'民日': 'dan_nhat', '三合': 'tam_hop', '天喜': 'thien_hy', '六合': 'luc_hop', '五合': 'ngu_hop',
          '不將': 'bat_tuong', '五富': 'ngu_phu', '天倉': 'thien_thuong', '普護': 'pho_ho', '福生': 'phuc_sinh',
          '聖心': 'thanh_tam', '益後': 'ich_hau', '續世': 'tuc_the', '解神': 'giai_than'}
P4C = ['福德', '天巫', '天后', '天醫', '驛馬', '天馬', '吉期', '天恩', '除神', '鳴吠', '母倉']
SEASONS = {m: s for s, ms in (('春', '寅卯辰'), ('夏', '巳午未'), ('秋', '申酉戌'), ('冬', '亥子丑')) for m in ms}
JI_STATES = ('only_ji', 'both_present')
WANG_RI = json.loads(SEASON.read_text(encoding='utf-8'))['days']['王日']['branches']


def sha256(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def split_yi(text):
    out, i = [], 0
    text = sc.norm(text).replace('徳', '德')
    while i < len(text):
        hit = next((v for v in sorted(YI_VOCAB, key=len, reverse=True) if text.startswith(v, i)), None)
        assert hit, f'unknown 宜 token at {text[i:i + 6]}'
        out.append(hit)
        i += len(hit)
    return out


def load_p4c():
    month_pillar, mucang = {}, {}
    with YI_DOMAINS.open(encoding='utf-8') as f:
        for r in csv.DictReader(f, delimiter='\t'):
            inp = json.loads(r['inputs'])
            pillar = json.loads(r['inputProvenance'])['validPillar']
            present = json.loads(r['expected'])['outcome'] == 'present'
            if r['domain'] == 'MONTH_PILLAR_720':
                month_pillar[(r['han'], inp['MONTH_JIAN_BRANCH'], pillar)] = present
            elif r['domain'] == 'DAY_PILLAR_60':
                for m in op.MONTHS:
                    month_pillar[(r['han'], m, pillar)] = present
            elif r['domain'] == 'MU_CANG_CONDITIONAL_1440':
                mucang[(inp['MONTH_JIAN_BRANCH'], pillar, inp['abstractSoilState'])] = present
    return month_pillar, mucang


def load_p5():
    verdict = {'yi': True, 'no_yi': False, 'source_dependent': None}
    ctx = {}
    with P5_CONTEXT.open(encoding='utf-8') as f:
        for r in csv.DictReader(f, delimiter='\t'):
            ctx[(r['month_jian'], r['pillar'], r['soil'])] = verdict[r['xiu_cang_ku']]
    dated = {}
    with P5_DATED.open(encoding='utf-8') as f:
        for r in csv.DictReader(f, delimiter='\t'):
            dated[r['date']] = (r['month_jian'], r['pillar'], verdict[r['xiu_cang_ku']])
    return ctx, dated


def yi_evidence(h, yi_list, month, pillar, soil, ctx, gods, p4c, mucang, p5x):
    """True / False / None (unknown) for heading h; soil None = unknown (context domain)."""
    if h == '修倉庫':
        return p5x, ['P5:' + {True: 'yi', False: 'no_yi', None: 'source_dependent'}[p5x]]
    states = []
    for tok in yi_list:
        if tok in ('天德', '月德', '天德合', '月德合', '天赦', '天願', '月恩', '四相', '時德'):
            states.append(tok in ctx['de'])
        elif tok in OFFICER_YI:
            states.append(ctx['officer'] == OFFICER_YI[tok])
        elif tok == '王日':
            states.append(pillar[1] == WANG_RI[SEASONS[month]])
        elif tok in GOD_YI:
            states.append(GOD_YI[tok] in gods)
        elif tok == '母倉':
            vals = {mucang[(month, pillar, s)] for s in (['absent', 'present'] if soil is None else [soil])}
            states.append(vals.pop() if len(vals) == 1 else None)
        else:
            states.append(p4c[(tok, month, pillar)])
    present = sorted(tok for tok, s in zip(yi_list, states) if s is True)
    unknown = sorted(tok for tok, s in zip(yi_list, states) if s is None)
    return (True if True in states else None if None in states else False), present or unknown


def compose_row(h, facts, yi_pair, yi_off, restored_heads, puzhu28, scope_rec, context_unknown_dated):
    """Pre-propagation day state for one heading; returns dict with reasons and a deciding code."""
    yi_ev, yi_wit = yi_pair
    reasons = []
    subj = [f for f in facts if f[1] == 'subject']
    yw = [f for f in facts if f[1].startswith('youwei')]
    rem = [f for f in facts if f[1] == 'remaining']
    dated = [f for f in facts if f[1] in ('lunar_day', 'phase', 'soil', 'dated')]
    sub_states = []
    for name, _, effect, raw in subj:
        st = sc.annotate(raw, yi_ev) if raw in ('stop', 'lifted') else raw
        if raw == 'lifted' and yi_ev is False and h not in scope_rec[name]['uncovered']:
            st = 'not_avoided'  # A04b: a 止忌 scope undetermined with known-false 宜 is a lifted 忌
        if raw == 'stop':
            st = 'only_ji' if yi_ev is not True else 'both_present'  # 遇德猶忌: 忌 kept whatever 宜
        sub_states.append((name, effect, raw, st))
    kept_sub = [x for x in sub_states if x[3] in JI_STATES]
    neither = any(x[3] == 'neither_recorded' for x in sub_states) or any(f[3] == 'no_annotation' for f in rem)
    ji_src = (bool(kept_sub) or any(f[3] == 'only_ji' for f in yw)
              or any(f[3] in ('kept', 'protected', 'all_taboo') for f in rem)
              or any(f[1] in ('baiji', 'pillar_all') for f in facts)
              or any(f[3] == 'protected' for f in dated) or h in restored_heads)
    prot = (any(x[2] == 'stop' for x in kept_sub) or any(f[1] == 'youwei_zhuanji' for f in yw)
            or any(f[3] in ('protected', 'all_taboo') for f in rem)
            or any(f[1] in ('baiji', 'pillar_all') for f in facts) or any(f[3] == 'protected' for f in dated))
    suppress = (bool(yi_off) or neither or h in restored_heads
                or any(x[1] in ('as_usual', 'still_avoid', 'avoid_all', 'restored_as_usual') for x in kept_sub))
    yi_noted = False if suppress else yi_ev
    all_taboo = any(f[1] == 'pillar_all' for f in facts) or any(f[3] == 'all_taboo' for f in rem)
    undetermined = (any(x[3] == 'undetermined' for x in sub_states)
                    or any(f[3] in ('undetermined', 'unresolved') for f in rem)
                    or (context_unknown_dated and any(f[1] == 'dated' for f in facts)))
    if puzhu28:
        reasons.append('puzhu:28')
        ji, prot = False, False
        state = {True: 'only_yi', False: 'not_recorded', None: 'undetermined'}[yi_noted]
    elif all_taboo:
        reasons.append('all_taboo')
        ji, prot, state = True, True, 'only_ji'
    elif undetermined:
        ji, state = ji_src, 'undetermined'
        reasons.append('undetermined')
    elif neither and ji_src and not prot:
        reasons.append('H1-B')  # owner H1-B/F5: unprotected 忌 survives another scope's 相抵; 宜 not noted
        ji, state = True, 'only_ji'
    elif neither and not prot:
        ji, state = False, 'neither_recorded'
    elif ji_src:
        ji = True
        state = {True: 'both_present', False: 'only_ji', None: 'undetermined'}[yi_noted]
    else:
        ji = False
        state = {True: 'only_yi', False: 'not_recorded', None: 'undetermined'}[yi_noted]
    # Deciding code: every id sorted, so the code does not depend on input order.
    ji_ids = sorted({x[0] for x in kept_sub} | {f[0] for f in yw if f[3] == 'only_ji'}
                    | {f[0] for f in rem if f[3] in ('kept', 'protected', 'all_taboo')}
                    | {f[0] for f in facts if f[1] in ('baiji', 'pillar_all')}
                    | {f[0] for f in dated if f[3] == 'protected'} | ({'puzhu:27'} if h in restored_heads else set()))
    prot_ids = sorted({x[0] for x in kept_sub if x[2] == 'stop'} | {f[0] for f in yw if f[1] == 'youwei_zhuanji'}
                      | {f[0] for f in rem if f[3] in ('protected', 'all_taboo')}
                      | {f[0] for f in facts if f[1] in ('baiji', 'pillar_all')} | {f[0] for f in dated if f[3] == 'protected'})
    xd_ids = sorted({x[0] for x in sub_states if x[3] == 'neither_recorded'} | {f[0] for f in rem if f[3] == 'no_annotation'})
    und_ids = sorted({x[0] for x in sub_states if x[3] == 'undetermined'}
                     | {f[0] for f in rem if f[3] in ('undetermined', 'unresolved')}
                     | ({f[0] for f in facts if f[1] == 'dated'} if context_unknown_dated else set()))
    sup_ids = sorted(set(yi_off) | ({'xiangdi'} if neither else set()) | ({'puzhu:27'} if h in restored_heads else set())
                     | {x[0] for x in kept_sub if x[1] in ('as_usual', 'still_avoid', 'avoid_all', 'restored_as_usual')})
    yi_code = ('suppressed:' + '+'.join(sup_ids) if suppress else
               {True: 'yi:' + '+'.join(yi_wit), False: 'yi_absent', None: 'yi_unknown:' + '+'.join(yi_wit)}[yi_ev])
    primary = (reasons[0] if reasons and reasons[0] != 'undetermined' else
               'undetermined:' + '+'.join(und_ids or ['yi']) if state == 'undetermined' else
               'xiangdi' if state == 'neither_recorded' else 'ji' if ji else 'no_ji')
    parts = [primary]
    if ji_ids and state != 'neither_recorded' and not puzhu28:
        parts.append('ji=' + '+'.join(ji_ids))
    if prot and prot_ids and not puzhu28:
        parts.append('prot=' + '+'.join(prot_ids))
    if xd_ids:
        parts.append('xd=' + '+'.join(xd_ids))
    parts.append(yi_code)
    return {'ji': ji, 'protected': prot, 'state': state, 'yi_ev': yi_ev, 'yi_noted': yi_noted,
            'neither': neither, 'reasons': reasons, 'sub_states': sub_states, 'code': ';'.join(parts)}


def puzhu06_classes(h, d, facts, scope_rec, grades, month, auth):
    """Source classes of an unprotected 忌 row (authority p4b-puzhu06-v3)."""
    def clause_class(name):
        rec = scope_rec.get(name)
        if rec is None or rec['effect'] == 'undetermined':
            return 'UNDETERMINED'
        eff = rec['effect']
        if eff == 'still_avoid':
            return 'YOUJI'
        if eff == 'avoid_all':
            return 'ZHUSHI'
        if eff == 'cancel_both':
            return 'UNDETERMINED'
        if eff == 'only_avoid':
            return 'PROTECTED'
        if eff in ('as_usual', 'restored_as_usual'):
            g = grades.get(name)
            if g is None:
                return 'AU'
            if g['action'] != 'only_ji':
                return 'SPEC_GAP'
            return 'AD' if g['branch'] == 'withDe' else 'AN'
        return 'SPEC_GAP'
    out = set()
    for name, effect, raw, st in d['sub_states']:
        if st == 'undetermined':
            out.add('UNDETERMINED')
        elif st in JI_STATES:
            c = clause_class(name)
            out.add(clause_class(scope_rec[name]['owner']) if c == 'AU' and scope_rec[name]['owner'] != name else c)
    for f in facts:
        if f[1] == 'youwei_zhuanji':
            out.add('PROTECTED')
        elif f[1] == 'youwei_convention':
            out.add(clause_class(auth['inherit']['youwei'][f[0]]))
        elif f[1] == 'remaining' and f[3] in ('kept', 'protected', 'undetermined', 'unresolved'):
            if f[3] == 'protected':
                out.add('PROTECTED')
            elif f[3] in ('undetermined', 'unresolved'):
                out.add('UNDETERMINED')
            elif f[2].startswith('defer'):
                tgt = next((x['target'] for x in auth['inherit']['remainingDefer'][f[0]] if month in x['months']), None)
                out.add(clause_class(tgt) if tgt else 'SPEC_GAP')
            elif f[0] in auth['liftLists']:
                excluded = auth['liftExclusions'].get(f[0], {}).get('triggers', [])
                out.add('QL' if any(t not in excluded for t in d['triggers']) else 'QL_EXCLUDED')
            else:
                out.add('SPEC_GAP')
    if 'restored' in d and h in d['restored']:
        out.add('PUZHU27')
    return sorted(out)


def propagate(days, lines, neither_of):
    out = {h: dict(d) for h, d in days.items()}
    edges = []
    for l in lines:
        if l.get('pairs'):
            edges += [([sc.norm(a)], [sc.norm(b)], False) for a, b in l['pairs']]
        elif l.get('from') and l.get('to'):
            edges.append(([sc.norm(x) for x in l['from']], [sc.norm(x) for x in l['to']], bool(l.get('requireAll'))))
    for frm, to, req in edges:
        fired = [h for h in frm if days.get(h, {}).get('state') == 'neither_recorded']
        if (req and len(fired) != len(frm)) or not fired:
            continue
        for h in to:
            d = days.get(h)
            if not d or not d['ji'] or d['state'] == 'undetermined':
                continue
            if d['protected']:
                out[h]['blocked'] = '+'.join(fired)
                continue
            # A lift that leaves a 相抵 subject on the heading reads neither_recorded (puzhu:05; v3 stateAfterLift).
            state = 'neither_recorded' if neither_of[h] else {True: 'only_yi', False: 'not_recorded', None: 'undetermined'}[d['yi_noted']]
            out[h].update(ji=False, state=state, propagated='+'.join(fired),
                          code=f"propagated:{'+'.join(fired)}>{state};" + d['code'])
    return out


def build():
    vol11 = json.loads(VOL11.read_text(encoding='utf-8'))
    H = cj.headings29()
    yi_lists = {h: split_yi(vol11['entries'][next(k for k in vol11['entries'] if sc.norm(k) == h)]['宜']) for h in H if h != '修倉庫'}
    p4c, mucang = load_p4c()
    p5c, p5d = load_p5()
    auth = json.loads(PUZHU06.read_text(encoding='utf-8'))
    in_scope = [sc.norm(x['p4']) for x in auth['headings'] if x['scope'] == 'IN_SCOPE']
    lines = json.loads(COMPOSITION.read_text(encoding='utf-8'))['propagation']['lines']
    ctxj, _ = cj.build()
    scope_all = sc.build()
    grade_rows, _ = gr.build()
    grades = {}
    for r in grade_rows:
        grades.setdefault(r['id'], {})[r['subject']] = r
    dated_rows, _, _ = dj.build()
    dated_by = {}
    for r in dated_rows:
        dated_by.setdefault(r['date'], {})[r['heading']] = r

    def day(month, pillar, soil, extra_facts, p5x, context_mode):
        c = ctxj[(month, pillar)]
        ctx = c['ctx']
        scope_rec = scope_all[(month, pillar)]['scopes']
        pre = {}
        for h in H:
            facts = list(c['facts'][h]) + extra_facts.get(h, [])
            restored = {f[0] for f in facts if f[2] == 'restored_as_usual'}
            rh = {h} if restored else set()
            yi_ev = yi_evidence(h, yi_lists.get(h, []), month, pillar, soil, ctx, ctx['gods'], p4c, mucang,
                                p5x if h == '修倉庫' else None)
            d = compose_row(h, facts, yi_ev, c['yiOff'][h], rh, c['puzhu28'], scope_rec, context_mode)
            d['facts'] = facts
            pre[h] = d
        triggers = [t for t in auth['triggers'] if t in ctx['de']]
        p06 = {}
        for h in in_scope:
            d = pre[h]
            if not (triggers and d['ji'] and not d['protected'] and not c['puzhu28'] and d['state'] != 'undetermined'):
                continue
            d['triggers'] = triggers
            d['restored'] = {h} if any(f[2] == 'restored_as_usual' for f in d['facts']) else set()
            classes = puzhu06_classes(h, d, d['facts'], scope_rec, grades.get(f'{month}-{pillar}', {}), month, auth)
            actions = {auth['classes'][x]['action'] if x in auth['classes'] else 'specgap' for x in classes}
            assert 'specgap' not in actions, ('puzhu:06 SPEC_GAP: stop, never guess', month, pillar, h, classes)
            action = ('specgap' if 'specgap' in actions else 'hold' if 'hold' in actions
                      else 'keep' if 'keep' in actions or 'untouched' in actions else 'lift')
            p06[h] = (action, classes)
            if action == 'lift':
                d.update(ji=False, state='neither_recorded' if d['neither'] else
                         {True: 'only_yi', False: 'not_recorded', None: 'undetermined'}[d['yi_noted']])
                d['code'] = f"puzhu:06-lift:{'+'.join(classes)}>{d['state']};" + d['code']
        post = propagate(pre, lines, {h: pre[h]['neither'] for h in H})
        return post, p06

    out_ctx, out_dated = {}, {}
    # Context domain: date-only operands (soil — shared by 母倉 and 土王用事後 —, lunar day 12/15/other, a
    # primary phase) are unknown. A heading is determined only if every combination gives the same row.
    lunar_rules = json.loads(dj.LUNAR_DAY.read_text(encoding='utf-8'))['rules']
    phase_auth = json.loads(dj.PHASE.read_text(encoding='utf-8'))
    soil_heads = {sc.norm(x) for x in json.loads(dj.SOIL.read_text(encoding='utf-8'))['headings']}
    for (month, pillar) in ctxj:
        variants = []
        for soil in ('absent', 'present'):
            for lday in (12, 15, 1):
                for phase in (False, True):
                    extra = {h: [] for h in H}
                    for rule in lunar_rules:
                        if lday in rule['days']:
                            extra[sc.norm(rule['heading'])].append((rule['token'], 'lunar_day', rule['sourceActivity'], 'protected'))
                    if phase:
                        extra[sc.norm(phase_auth['heading'])].append((phase_auth['inventoryToken'], 'phase', 'any', 'protected'))
                    if soil == 'present':
                        for h in soil_heads & set(H):
                            extra[h].append(('土王用事後', 'soil', 'any', 'protected'))
                    variants.append(day(month, pillar, soil, extra, p5c[(month, pillar, soil)], False))
        out_ctx[(month, pillar)] = merge_variants(variants, H)
    for date, by_h in dated_by.items():
        r0 = next(iter(by_h.values()))
        month, pillar, soil = r0['month_jian'], r0['pillar'], r0['soil']
        extra = {h: [tuple(x.split('|')) for x in r['facts'].split(';') if x] for h, r in by_h.items()}
        pm, pp, p5x = p5d[date]
        assert (pm, pp) == (month, pillar), date
        out_dated[date] = (month, pillar) + day(month, pillar, soil, extra, p5x, False)
    return out_ctx, out_dated, H


BASE_VARIANT = 4  # order: soil (absent, present) × lunar day (12, 15, 1) × phase (no, yes)


def merge_variants(variants, H):
    """One context row per heading: the common row if all date-operand variants agree, else undetermined."""
    days, p06 = {}, {}
    for h in H:
        rows = [cells(v[0][h], v[1].get(h))[:-1] for v in variants]  # decision columns, not the code
        if all(r == rows[0] for r in rows):
            base = variants[BASE_VARIANT]  # soil absent, lunar day not 12/15, no phase: no date-only 忌
            days[h], p06[h] = dict(base[0][h], code='invariant;' + base[0][h]['code']), base[1].get(h)
        else:
            days[h] = {'yi_ev': None, 'yi_noted': None, 'ji': None, 'protected': None, 'state': 'undetermined',
                       'reasons': ['context:date-operand-dependent'],
                       'code': 'undetermined:context-date-operand;states=' + '+'.join(sorted({r[4] for r in rows}))}
    return days, p06


HEAD = ['heading', 'yi_evidence', 'yi_noted', 'ji', 'protected', 'state', 'reasons', 'puzhu06', 'propagated',
        'blocked', 'code']


def cells(d, p06):
    tf = lambda v: {True: 'true', False: 'false', None: 'unknown'}[v]
    a = p06 or ('', [])
    return [tf(d['yi_ev']), tf(d['yi_noted']), tf(d['ji']), tf(d['protected']), d['state'], ' '.join(d['reasons']),
            (a[0] + ':' + '+'.join(a[1])) if a[0] else '', d.get('propagated', ''), d.get('blocked', ''), d['code']]


def files():
    out_ctx, out_dated, H = build()
    ctx_lines = ['\t'.join(['id', 'month_jian', 'pillar'] + HEAD)]
    for (m, p), (days, p06) in out_ctx.items():
        for h in H:
            ctx_lines.append('\t'.join([f'{m}-{p}', m, p, h] + cells(days[h], p06.get(h))))
    dat_lines = ['\t'.join(['date', 'month_jian', 'pillar'] + HEAD)]
    for date, (m, p, days, p06) in out_dated.items():
        for h in H:
            dat_lines.append('\t'.join([date, m, p, h] + cells(days[h], p06.get(h))))
    def stats(rows):
        return dict(sorted(Counter(r.split('\t')[8] for r in rows[1:]).items()))
    def count(rows, col, pred):
        return sum(1 for r in rows[1:] if pred(r.split('\t')[HEAD.index(col) + 3]))
    summary = {
        'stage': '3.3 day composition',
        'inputs': {str(p): sha256(p) for p in [JI / 'dated_ji.py', JI / 'grades.py', SEASON, YI_DOMAINS, P5_CONTEXT,
                                               P5_DATED, PUZHU06, COMPOSITION]},
        'context': {'rows': len(ctx_lines) - 1, 'states': stats(ctx_lines),
                    'H1-B': count(ctx_lines, 'reasons', lambda v: 'H1-B' in v),
                    'puzhu06': dict(Counter(r.split('\t')[10].split(':')[0] for r in ctx_lines[1:] if r.split('\t')[10])),
                    'propagated': count(ctx_lines, 'propagated', bool), 'blocked': count(ctx_lines, 'blocked', bool)},
        'dated': {'rows': len(dat_lines) - 1, 'states': stats(dat_lines),
                  'H1-B': count(dat_lines, 'reasons', lambda v: 'H1-B' in v),
                  'puzhu06': dict(Counter(r.split('\t')[10].split(':')[0] for r in dat_lines[1:] if r.split('\t')[10])),
                  'propagated': count(dat_lines, 'propagated', bool), 'blocked': count(dat_lines, 'blocked', bool)},
    }
    # Owner H1-B/F5 change list: rows decided by the extended rule, with sources and final state.
    h1b = ['\t'.join(['domain', 'id', 'heading', 'unprotected_ji', 'xiangdi', 'final_state', 'propagated'])]
    def h1b_rows(domain, key, days):
        for h in H:
            d = days[h]
            if 'H1-B' not in d.get('reasons', []):
                continue
            unprot = sorted({f'{f[0]}:{f[1]}' for f in d['facts'] if f[3] in ('only_ji', 'kept')
                             and f[1] not in ('youwei_zhuanji',)})
            xd = sorted({f[0] for f in d['facts'] if f[3] in ('neither_recorded', 'no_annotation')})
            h1b.append('\t'.join([domain, key, h, ' '.join(unprot), ' '.join(xd), d['state'], d.get('propagated', '')]))
    for (m, p), (days, _) in out_ctx.items():
        h1b_rows('context', f'{m}-{p}', days)
    for date, (m, p, days, _) in out_dated.items():
        h1b_rows('dated', date, days)
    summary['H1-B list'] = {k: v for k, v in Counter(
        (r.split('\t')[0], 'convention' if all(':youwei_convention' in s for s in r.split('\t')[3].split(' '))
         else 'canonical', r.split('\t')[5]) for r in h1b[1:]).items()}.__repr__()
    summary['oracles'] = oracles(out_ctx, out_dated)
    return {HERE / 'context.tsv': '\n'.join(ctx_lines) + '\n', HERE / 'dated.tsv': '\n'.join(dat_lines) + '\n',
            HERE / 'h1b-changes.tsv': '\n'.join(h1b) + '\n',
            HERE / 'summary.json': json.dumps(summary, ensure_ascii=False, indent=1) + '\n'}


G_PUZHU06_DATED = Path('docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v3/dated.tsv')
G_PUZHU06_CONTEXT = Path('docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v3/context.tsv')
G_DAY = Path('shared/almanac-data/golden-p4-day-composition.json')


def oracles(out_ctx, out_dated):
    """Compare with frozen Goldens; every difference must carry a known classification."""
    rep = {}
    def classify(domain, key, h, d):
        if key in ('2027-08-07', '未-戊午'):
            return 'OWNER_DECISION H2-A'
        if 'H1-B' in d.get('reasons', []):
            return 'OWNER_DECISION H1-B/F5'
        if domain == 'context' and h == '納財':
            return 'CONTEXT_DATE_OPERAND_POLICY (母倉 soil)'
        if 'context:date-operand-dependent' in d.get('reasons', []):
            return 'CONTEXT_DATE_OPERAND_POLICY (lunar day / phase / soil)'
        return None
    for domain, path, get in (('dated', G_PUZHU06_DATED, lambda k: out_dated[k][2]),
                              ('context', G_PUZHU06_CONTEXT, lambda k: out_ctx[tuple(k.split('-'))][0])):
        c = Counter()
        with path.open(encoding='utf-8') as f:
            for r in csv.DictReader(f, delimiter='\t'):
                d = get(r['id'])[r['heading']]
                if d['state'] == r['after_state']:
                    c['equal'] += 1
                else:
                    why = classify(domain, r['id'], r['heading'], d)
                    assert why, (domain, r['id'], r['heading'], r['after_state'], d['state'])
                    c[why] += 1
        rep[f'goldenPuzhu06V3:{domain}'] = dict(c)
    c, notes = Counter(), []
    for case in json.loads(G_DAY.read_text(encoding='utf-8'))['cases']:
        days = out_ctx[(case['monthJian'], case['pillar'])][0]
        for h, want in case['headings'].items():
            d = days[sc.norm(h)]
            if d['state'] == want:
                c['equal'] += 1
                continue
            # Golden A04b v1 predates the remaining 卷十一 凶 (P4-B), 11 宜 operands (P4-C) and the owner rules.
            later = [f'{f[0]}:{f[3]}' for f in d.get('facts', []) if f[1] in ('remaining', 'baiji', 'dated')]
            why = classify('context', case['monthJian'] + '-' + case['pillar'], sc.norm(h), d) or (
                'LATER_SCOPE (' + ' '.join(later) + ')' if later else None)
            notes.append([case['monthJian'] + case['pillar'], h, want, d['state'], why])
            assert why, notes[-1]
            c['explained'] += 1
        rep['goldenDayCompositionV1'] = dict(c)
    rep['goldenDayCompositionV1:diffs'] = notes
    return rep


def main():
    fs = files()
    if '--write' in sys.argv:
        HERE.mkdir(exist_ok=True)
        for p, t in fs.items():
            p.write_text(t, encoding='utf-8')
        print('wrote', len(fs))
        return
    for p, t in fs.items():
        assert p.read_text(encoding='utf-8') == t, f'{p} differs'
    print('verified', len(fs))


if __name__ == '__main__':
    main()
