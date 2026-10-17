"""Full Golden P4, task 3.2c: all 忌 scope facts per (context, heading) for 720 contexts × 29 headings.

Adds to the 3.2b 卷十 scopes: the 26 remaining 卷十一 凶 entries (remaining-ji v7, 21 dormant included),
百忌日, named pillar 諸事皆忌 clauses, puzhu:28 (諸事不忌 days) and puzhu:27 (天吏/大時 仍以死敗論), plus
宜-suppression facts (鋪註 07–10, puzhu:28-first) that 3.3 consumes. Operands that need a date (lunar
day, 朔望, 土王用事後) are listed as `dated` tokens for 3.2d. No composition into day states here.

    python3 -I docs/audits/sources/p4-vol10/p4-full-golden-v1/ji/context_ji.py [--write]
"""
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

HERE = Path('docs/audits/sources/p4-vol10/p4-full-golden-v1/ji')


def _load(name):
    spec = importlib.util.spec_from_file_location(name, HERE / f'{name}.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


sc = _load('scopes')
op = sc.op

REMAINING = Path('shared/almanac-data/p4-vol10-remaining-ji-v7.json')
COMPOSITION = Path('shared/almanac-data/p4-vol10-day-composition-v2.json')
PUZHU_END = Path('shared/almanac-data/p4-puzhu-end-v1.json')
G_REMAINING = Path('shared/almanac-data/golden-p4-remaining-ji-v8.json')
G_PUZHU_END = Path('shared/almanac-data/golden-p4-puzhu-end-v1.json')
MATCHES_SEEN = {}  # (entry, number of matching conditions) → evaluations; reported by checks.py
DATED_TOKENS = {'土王用事後': 'soil', '每月十二日十五日': 'lunar_day', '每月十五日': 'lunar_day', '朔望日': 'phase'}


def sha256(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def headings29():
    vol11 = json.loads(sc.VOL11.read_text(encoding='utf-8'))
    hs = list(dict.fromkeys(sc.norm(h) for v in vol11['activityEntries'].values() for h in v))
    assert len(hs) == 29, len(hs)
    return hs


def entry_present(e, month, pillar, gods):
    mi = op.MONTHS.index(month)
    p = e['presence']
    if 'xiejiGod' in p:
        return p['xiejiGod'] in gods
    if 'officerOffset' in p:
        return op.BRANCHES[(op.BRANCHES.index(month) + p['officerOffset']) % 12] == pillar[1]
    values = p['table'].get(str(mi + 1), [])
    return any(v == pillar if len(v) == 2 else v == (pillar[0] if v in op.STEMS else pillar[1]) for v in values)


def protected_heading(e, month, h):
    if e.get('protected'):
        return True
    pr = e.get('protection')
    if not pr:
        return False
    if month in pr.get('allMonths', []):
        return True
    in_month = pr['months'] == '*' or month in pr['months']
    return in_month and (pr['headings'] == '*' or h in sc.split(pr['headings']))


def eval_entry(e, month, pillar, ctx, scope_res):
    """Heading → outcome (lifted/protected/kept/all_taboo/no_annotation/unresolved/undetermined)."""
    heads = sc.split(e['avoid'])
    for alias_heads in (e.get('aliases') or {}).values():  # 招搖 shares 厭對's 德赦 lift (按 of the entry)
        heads += sc.split(alias_heads)
    heads = list(dict.fromkeys(heads))
    de = set(ctx['de'])
    if ctx['deAsJianRuleIds'] or {'yang_no_de_he', 'yin_no_de_he'} & set(ctx['pillarRuleIds']):
        de -= set(op.DE_HE)
    de |= {'六合'} if 'luc_hop' in ctx['gods'] else set()
    de |= {'三合'} if 'tam_hop' in ctx['gods'] else set()
    matches = []
    for c in e.get('conditions', []):
        if c['months'] != '*' and month not in c['months']:
            continue
        if month in c.get('exceptMonths', []):
            continue
        if c.get('pillar') and c['pillar'] != pillar:
            continue
        if c.get('require') and c['require'] not in ctx['present']:
            continue
        if c['effect'] in ('defer', 'all_taboo') or any(g in de for g in c['withGods']):
            matches.append(c)
    # Precedence by rule, not list position. Only 九空 can match twice (defer + its 「*」 lift); its lift
    # covers 寅申 滿日 / 子午卯酉 開日 only (卷十 offset 18309, puzhu:06 v3 liftLists), so defer wins.
    MATCHES_SEEN[(sc.norm(e['han']), len(matches))] = MATCHES_SEEN.get((sc.norm(e['han']), len(matches)), 0) + 1
    if len({(c['effect'], c.get('keep'), c.get('target')) for c in matches}) > 1:
        assert sc.norm(e['han']) == '九空' and sorted(c['effect'] for c in matches) == ['defer', 'lift'], (e['han'], month, pillar)
        matches = [c for c in matches if c['effect'] == 'defer']
    # Several equivalent matches (same effect/keep/target, e.g. 四耗 辰月 天德 and 三合) give one outcome.
    cond = matches[0] if matches else None
    base = lambda h: 'protected' if protected_heading(e, month, h) else 'kept'
    if cond is None:
        return {h: base(h) for h in heads}, None
    eff = cond['effect']
    if eff == 'all_taboo':
        return {h: 'all_taboo' for h in sc.VOCAB}, eff
    if eff == 'lift':
        return {h: 'protected' if protected_heading(e, month, h) else 'lifted' for h in heads}, eff
    if eff == 'no_annotation':
        return {h: 'no_annotation' for h in heads}, eff
    if eff == 'only_avoid':
        keep = sc.split(cond['keep'])
        return {h: base(h) if h in keep else 'lifted' for h in heads}, eff
    if eff == 'defer':
        target = scope_res['scopes'].get(cond['target'])
        if target is None:
            return {h: 'unresolved' for h in heads}, 'defer:absent'
        out = {}
        for h in heads:
            st = sc.annotate(target['headings'].get(h, 'not_listed'), True)  # read 忌 only (宜 = true)
            out[h] = {'both_present': 'kept', 'only_ji': 'kept', 'only_yi': 'lifted', 'not_avoided': 'lifted',
                      'neither_recorded': 'no_annotation', 'undetermined': 'undetermined'}.get(st, 'unresolved')
        return out, f"defer:{cond['target']}"
    raise AssertionError(eff)


def build():
    rem = json.loads(REMAINING.read_text(encoding='utf-8'))
    comp = json.loads(COMPOSITION.read_text(encoding='utf-8'))
    pend = json.loads(PUZHU_END.read_text(encoding='utf-8'))
    clauses = json.loads(op.CLAUSES.read_text(encoding='utf-8'))
    all_taboo_rules = {r['id'] for r in clauses['pillarRules'] if r['effect'] == 'avoid_all'}
    day28 = {tuple(x) for x in rem['dayRules'][0]['applied']}
    entries = sc.load_entries()[0]
    H = headings29()
    scope_all = sc.build()
    presence = op.load_presence()
    out = {}
    for (month, pillar), r in scope_all.items():
        ctx = dict(r['ctx'], gods=presence[(month, pillar)])
        facts = {h: [] for h in H}
        # 卷十 subject scopes (3.2b) and puzhu:27 restoration.
        restored = []
        triggers = ('tu_phe' in ctx['gods']) or bool({'thin_year', 'pursuit'} & set(ctx['pillarRuleIds']))
        for s, scope in r['scopes'].items():
            heads = dict(scope['headings'])
            effect = scope['effect']
            # Golden puzhu-end (未丙午 天吏 如常例 still listed): restoration applies whenever a trigger is present.
            if triggers and s in pend['deathDefeatSubjects']:
                restored.append(s)
                heads = {h: 'only_ji' for h in sc.base_list(entries[s], month)}
                effect = 'restored_as_usual'
            for h in H:
                if h in heads:
                    facts[h].append((s, 'subject', effect, heads[h]))
        for a, y in r['youwei'].items():
            kind = 'youwei_zhuanji' if y['protected'] else 'youwei_convention'
            for h in H:
                if h in y['headings']:
                    facts[h].append((a, kind, 'only_ji', 'only_ji'))
        # Remaining 卷十一 凶 entries.
        for e in rem['entries']:
            if not entry_present(e, month, pillar, ctx['gods']):
                continue
            res, eff = eval_entry(e, month, pillar, ctx, {'scopes': r['scopes']})
            for h in H:
                if h in res:
                    facts[h].append((sc.norm(e['han']), 'remaining', eff or 'raw', res[h]))
        # 百忌日 (protected 專忌). Owner F1 (2026-10-17): 巳日「出行」 → 行幸遣使 (卷十一 「行幸遣使…出行同」).
        for b in comp['baiji']['rules']:
            heading = b['heading'] or ('行幸遣使' if b['day'] == '巳' and b.get('raw') == '出行' else None)
            if heading and b['day'] in pillar and sc.norm(heading) in facts:
                facts[sc.norm(heading)].append(('百忌' + b['day'], 'baiji', b.get('part', b.get('raw', '')), 'protected'))
        # Named pillar 諸事皆忌.
        for rid in ctx['pillarRuleIds']:
            if rid in all_taboo_rules:
                for h in H:
                    facts[h].append((rid, 'pillar_all', 'avoid_all', 'protected'))
        # Dated operands: tokens from the 卷十一 inventory that need a date.
        inv = {sc.norm(k): v for k, v in rem['jiInventory'].items()}
        for h in H:
            for tok in inv.get(h, []):
                if tok in DATED_TOKENS:
                    facts[h].append((tok, 'dated', DATED_TOKENS[tok], 'pending'))
        # 宜 suppression facts (consumed by 3.3).
        yi_off = {h: [] for h in H}
        for line in comp['yiSuppression']:
            for rule in line.get('rules', [line]):
                if rule.get('day') and rule['day'] in pillar:
                    for h in rule.get('headings', []):
                        if sc.norm(h) in yi_off:
                            yi_off[sc.norm(h)].append(line['id'])
        if set(pend['suppressYiRuleIds']) & set(ctx['pillarRuleIds']):
            for h in sc.base_list(entries['月厭'], month):
                if h in yi_off:
                    yi_off[h].append('puzhu:28-first')
        out[(month, pillar)] = {'facts': facts, 'yiOff': yi_off, 'restored': restored,
                                'puzhu28': (month, pillar) in day28, 'ctx': ctx}
    return out, H


def self_check(res):
    rem = json.loads(REMAINING.read_text(encoding='utf-8'))
    by_han = {sc.norm(e['han']): e for e in rem['entries']}
    g = json.loads(G_REMAINING.read_text(encoding='utf-8'))
    for case in g['cases']:
        r = res[(case['month'], case['pillar'])]
        god = sc.norm(case['god'])
        for h, want in case['headings'].items():
            h = sc.norm(h)
            got = [f for f in r['facts'].get(h, []) if f[0] == god]
            if h not in r['facts']:  # heading outside the 29 day headings: evaluate the entry directly
                e = by_han[god]
                if not entry_present(e, case['month'], case['pillar'], r['ctx']['gods']):
                    state = 'absent'
                else:
                    res_e, _ = eval_entry(e, case['month'], case['pillar'], r['ctx'], {'scopes': {}})
                    state = res_e.get(h, 'not_listed')
            elif not entry_present(by_han[god], case['month'], case['pillar'], r['ctx']['gods']):
                state = 'absent'
            else:
                state = got[0][3] if got else 'not_listed'
            assert state == want, (case['month'] + case['pillar'], god, h, state, want, case['note'])
    for case in g['dayCases']:
        r = res[(case['month'], case['pillar'])]
        assert r['puzhu28'] == (case['rule'] == 'puzhu:28'), case
        for h, want in (case.get('ji') or {}).items():
            assert ji_raw(r['facts'][sc.norm(h)]) == want, case
    for case in json.loads(G_PUZHU_END.read_text(encoding='utf-8'))['cases']:
        r = res[(case['month'], case['pillar'])]
        assert r['restored'] == case['restoredSubjects'], (case, r['restored'])
        for h, want in case['ji'].items():
            assert ji_raw(r['facts'][sc.norm(h)]) == want, (case, h)
        for h, want in (case.get('yi') or {}).items():
            if want is False:
                assert 'puzhu:28-first' in r['yiOff'][sc.norm(h)] or case.get('rule') not in ('thin_year', 'pursuit'), (case, h)
    fw = json.loads(G_PUZHU_END.read_text(encoding='utf-8'))['fourWasteCase']
    r = res[(fw['month'], fw['pillar'])]
    assert r['restored'] == fw['restoredSubjects'], r['restored']
    for h, want in fw['ji'].items():
        assert ji_raw(r['facts'][sc.norm(h)]) == want, h
    return len(g['cases']), len(g['dayCases'])


def ji_raw(facts):
    """Raw 忌 before day composition: any scope keeping 忌 (not lifted, not 不註)."""
    return any(f[3] in ('only_ji', 'kept', 'protected', 'all_taboo', 'stop') for f in facts)


def tsv(res, H):
    lines = ['\t'.join(['id', 'month_jian', 'pillar', 'heading', 'puzhu28', 'restored', 'yi_off', 'facts'])]
    for (m, p), r in res.items():
        for h in H:
            facts = ' '.join(f'{s}|{k}|{e}|{st}' for s, k, e, st in r['facts'][h])
            lines.append('\t'.join([f'{m}-{p}', m, p, h, str(r['puzhu28']).lower(), ' '.join(r['restored']),
                                    ' '.join(r['yiOff'][h]), facts]))
    return '\n'.join(lines) + '\n'


def files():
    res, H = build()
    n_cases, n_days = self_check(res)
    from collections import Counter
    kinds = Counter(f[1] + ':' + f[3] for r in res.values() for fs in r['facts'].values() for f in fs)
    summary = {
        'stage': '3.2c context 忌 facts',
        'inputs': {str(p): sha256(p) for p in [HERE / 'scopes.py', REMAINING, COMPOSITION, PUZHU_END, G_REMAINING,
                                               G_PUZHU_END]},
        'rows': len(res) * len(H), 'headings': H,
        'factKinds': dict(sorted(kinds.items())),
        'puzhu28Contexts': sum(r['puzhu28'] for r in res.values()),
        'restoredContexts': sum(bool(r['restored']) for r in res.values()),
        'checks': {'goldenRemainingJiV8Cases': n_cases, 'goldenRemainingJiV8DayCases': n_days, 'goldenPuzhuEnd': 9},
    }
    return {HERE / 'context-ji.tsv': tsv(res, H),
            HERE / 'context-ji-summary.json': json.dumps(summary, ensure_ascii=False, indent=1) + '\n'}


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
