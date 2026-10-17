"""Full Golden P4, task 3.4: self-checks and the spec §7.1 coverage matrix (resolution layer).

1. Exact Cartesian sets and uniqueness (1,095 dates × 29, 720 contexts × 29).
2. Output invariants (ji/state consistency, puzhu:28, protected 忌, codes on every row).
3. Input-order invariance: every fact list, scope dict and dated fact string is shuffled (3 seeds) and the
   composition is re-derived; output must be byte-identical to the committed files.
4. Coverage matrix (spec §7.1, resolution layer only — score adapter/cap/event are roadmap 8).

    python3 -I docs/audits/sources/p4-vol10/p4-full-golden-v2/compose/checks.py [--write]
"""
import csv
import hashlib
import importlib.util
import json
import random
import sys
from collections import Counter
from pathlib import Path

HERE = Path('docs/audits/sources/p4-vol10/p4-full-golden-v2/compose')
ROOT = HERE.parent
_spec = importlib.util.spec_from_file_location('compose', HERE / 'compose.py')
cp = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(cp)
cj, dj, sc, op = cp.cj, cp.dj, cp.sc, cp.op


def sha256(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def read(path):
    with path.open(encoding='utf-8') as f:
        return list(csv.DictReader(f, delimiter='\t'))


def check_sets(dated, ctx, H):
    dates = sorted({r['date'] for r in dated})
    assert len(dates) == 1095 and dates[0] == '2025-01-01' and dates[-1] == '2027-12-31'
    assert {(r['date'], r['heading']) for r in dated} == {(d, h) for d in dates for h in H}
    assert len(dated) == 1095 * 29
    want = {(f'{m}-{p}', h) for m in op.MONTHS for p in op.PILLARS for h in H}
    assert {(r['id'], r['heading']) for r in ctx} == want and len(ctx) == 720 * 29
    for r in ctx:  # valid 60 can-chi only (stem/branch parity)
        assert (op.STEMS.index(r['pillar'][0]) - op.BRANCHES.index(r['pillar'][1])) % 2 == 0


def check_invariants(rows, facts_of, domain):
    n = Counter()
    for r in rows:
        assert r['code'], (domain, r)
        st, ji = r['state'], r['ji']
        if ji == 'true':
            assert st in ('only_ji', 'both_present', 'undetermined'), (domain, r)
        if ji == 'false':
            assert st not in ('only_ji', 'both_present'), (domain, r)
        if st == 'neither_recorded':
            assert ji != 'true', (domain, r)
        if r['protected'] == 'true':
            assert not r['propagated'] and not r['puzhu06'].startswith('lift'), (domain, r)
        fs = facts_of(r)
        if 'puzhu:28' in r['reasons']:
            assert ji == 'false', (domain, r)
            n['puzhu28'] += 1
        elif any(f[1] in ('baiji', 'pillar_all') or (f[1] in ('lunar_day', 'phase', 'soil') and f[3] == 'protected')
                 for f in fs):
            if 'context:date-operand-dependent' not in r['reasons']:
                assert ji == 'true', (domain, r)
                n['protectedJiHeld'] += 1
    return dict(n)


def shuffled(seed):
    """Patch the stage builders so every fact list / scope order is permuted."""
    rng = random.Random(seed)
    orig_cj, orig_dj, orig_sc = cj.build, dj.build, sc.build

    def cj_build():
        out, H = orig_cj()
        for v in out.values():
            for h in v['facts']:
                rng.shuffle(v['facts'][h])
        return out, H

    def dj_build():
        rows, H, lis = orig_dj()
        for r in rows:
            parts = [x for x in r['facts'].split(';') if x]
            rng.shuffle(parts)
            r['facts'] = ';'.join(parts)
        return rows, H, lis

    def sc_build():
        res = orig_sc()
        for v in res.values():
            items = list(v['scopes'].items())
            rng.shuffle(items)
            v['scopes'] = dict(items)
        return res
    return (orig_cj, orig_dj, orig_sc), (cj_build, dj_build, sc_build)


SHUFFLED_AUTHORITY_KEYS = ('clauses', 'conditions')  # entry clauses (卷十) and remaining-ji conditions


def check_order():
    committed = {p: p.read_text(encoding='utf-8') for p in (HERE / 'dated.tsv', HERE / 'context.tsv', HERE / 'h1b-changes.tsv')}
    for seed in (1, 2, 3):
        orig, patched = shuffled(seed)
        rng = random.Random(seed + 100)
        real_loads = json.loads

        def loads(s, *a, **k):  # authority lists the derive scans: order must not matter
            obj = real_loads(s, *a, **k)
            stack = [obj]
            while stack:
                x = stack.pop()
                if isinstance(x, dict):
                    for key, v in x.items():
                        if key in SHUFFLED_AUTHORITY_KEYS and isinstance(v, list):
                            rng.shuffle(v)
                        stack.append(v)
                elif isinstance(x, list):
                    stack.extend(x)
            return obj
        cj.build, dj.build, sc.build = patched
        json.loads = loads
        try:
            fs = cp.files()
        finally:
            cj.build, dj.build, sc.build = orig
            json.loads = real_loads
        for p, text in committed.items():
            assert fs[p] == text, f'order dependence in {p.name} (seed {seed})'
    return 3


def coverage(dated, ctx, H):
    cov = {}
    ctx_facts = {(r['id'], r['heading']): [f.split('|') for f in r['facts'].split(' ') if f]
                 for r in read(ROOT / 'ji/context-ji.tsv')}
    # 等第 cell × grade × 德 branch over the exhaustive 720 contexts (absent combination = impossible).
    grades = read(ROOT / 'ji/grades.tsv')
    cov['gradeByBranch'] = {f'{g}:{b}': c for (g, b), c in sorted(Counter((r['grade'], r['branch']) for r in grades).items())}
    cells = Counter((r['cell'], r['branch']) for r in grades)
    cov['cellBranchWitnesses'] = {f'{c}:{b}': n for (c, b), n in sorted(cells.items())}
    with_clause = {r['cell'] for r in grades if r['branch'] != 'unconditional'}
    cov['cellBranchImpossible'] = sorted(f'{c}:{b}' for c in with_clause for b in ('withDe', 'withoutDe')
                                         if (c, b) not in cells)
    # Annotation states, both domains.
    cov['statesDated'] = dict(sorted(Counter(r['state'] for r in dated).items()))
    cov['statesContext'] = dict(sorted(Counter(r['state'] for r in ctx).items()))
    for s in ('both_present', 'only_yi', 'only_ji', 'neither_recorded', 'not_recorded'):
        assert cov['statesDated'].get(s, 0) > 0, s
    # Remaining 卷十一 entries: condition outcomes over the 720 contexts (21 dormant included).
    rem = Counter()
    for fs in ctx_facts.values():
        for f in fs:
            if f[1] == 'remaining':
                rem[(f[0], f[2].split(':')[0], f[3])] += 1
    cov['remainingOutcomes'] = {f'{g}|{e}|{s}': n for (g, e, s), n in sorted(rem.items())}
    entries = {sc.norm(e['han']) for e in json.loads(cj.REMAINING.read_text(encoding='utf-8'))['entries']}
    cov['remainingEntriesWithoutRow'] = sorted(entries - {g for g, _, _ in rem})
    # 百忌日 (9 rules on the 29 headings, 巳 via owner F1) on real dates.
    by_ctx = {}
    for r in dated:
        by_ctx.setdefault(r['month_jian'] + '-' + r['pillar'], set()).add(r['date'])
    baiji = Counter()
    for (cid, h), fs in ctx_facts.items():
        for f in fs:
            if f[1] == 'baiji':
                baiji[f'{f[0]}:{h}'] += len(by_ctx.get(cid, ()))
    cov['baijiDatedRows'] = dict(sorted(baiji.items()))
    assert len(baiji) == 9 and all(baiji.values()), baiji
    # 21 dormant gods on real dates (3.1 presence) + structural Jie witnesses.
    pres = read(ROOT / 'presence/dated.tsv')
    dormant = Counter(g for r in pres for g in r['dormant'].split())
    cov['dormantDatedDays'] = dict(sorted(dormant.items()))
    assert len(dormant) == 21, dormant
    cov['dormantStructuralKinds'] = json.loads((ROOT / 'presence/summary.json').read_text(encoding='utf-8'))['structuralKinds']
    # Warehouse 修倉庫 (P5 rule D) × final state; 開倉庫 separately.
    cov['warehouse'] = {f'{h}|{y}|{s}': n for (h, y, s), n in sorted(Counter(
        (r['heading'], r['yi_evidence'], r['state']) for r in dated if r['heading'] in ('修倉庫', '開倉庫出貨財')).items())}
    # Unknown 宜 on real dates must be limited to the P5 SOURCE_DEPENDENT row.
    unknown = [(r['date'], r['heading']) for r in dated if r['yi_evidence'] == 'unknown']
    assert unknown == [('2025-10-08', '修倉庫')], unknown
    cov['datedUnknownYi'] = unknown
    # puzhu:06 classes and propagation lines.
    cov['puzhu06Dated'] = dict(sorted(Counter(r['puzhu06'] for r in dated if r['puzhu06']).items()))
    assert not any('SPEC_GAP' in r['puzhu06'] for r in dated + ctx)
    cov['propagationDated'] = {'lifted': dict(Counter(r['propagated'] + '>' + r['heading'] for r in dated if r['propagated'])),
                               'blocked': dict(Counter(r['blocked'] + '>' + r['heading'] for r in dated if r['blocked']))}
    cov['ownerRulesDated'] = dict(Counter(x for r in dated for x in r['reasons'].split() if x in ('H1-B', 'puzhu:28', 'all_taboo')))
    # Several entries on one context (spec 7.1 「nhiều entry khớp / không entry」).
    scopes = read(ROOT / 'ji/scopes.tsv')
    per_ctx = {}
    for r in scopes:
        if r['kind'] == 'subject':
            per_ctx.setdefault(r['id'], {})[r['scope']] = r['effect']
    n_subj = Counter(min(len(per_ctx.get(f'{m}-{p}', {})), 2) for m in op.MONTHS for p in op.PILLARS)
    cov['subjectsPerContext'] = {'0': n_subj[0], '1': n_subj[1], '2+': n_subj[2]}
    cov['multiSubjectMixedEffects'] = sum(1 for v in per_ctx.values() if len(v) > 1 and len(set(v.values())) > 1)
    cj.MATCHES_SEEN.clear()
    cj.build()
    cov['remainingConditionMatches'] = {f'{g}:{n}': c for (g, n), c in sorted(cj.MATCHES_SEEN.items()) if n > 1}
    cov['outOfScope'] = ['score adapter, cap reallocation, event very_high, penalty −25: roadmap 8 (owner 2026-10-17)']
    return cov


def files():
    H = cj.headings29()
    dated, ctx = read(HERE / 'dated.tsv'), read(HERE / 'context.tsv')
    check_sets(dated, ctx, H)
    ctx_facts = {(r['id'], r['heading']): [f.split('|') for f in r['facts'].split(' ') if f]
                 for r in read(ROOT / 'ji/context-ji.tsv')}
    dfacts = {(r['date'], r['heading']): [f.split('|') for f in r['facts'].split(';') if f]
              for r in read(ROOT / 'ji/dated-ji.tsv')}
    inv = {'dated': check_invariants(dated, lambda r: ctx_facts[(r['month_jian'] + '-' + r['pillar'], r['heading'])]
                                     + dfacts[(r['date'], r['heading'])], 'dated'),
           'context': check_invariants(ctx, lambda r: ctx_facts[(r['id'], r['heading'])], 'context')}
    seeds = check_order()
    out = {'stage': '3.4 checks', 'inputs': {str(p): sha256(p) for p in [HERE / 'compose.py', HERE / 'dated.tsv',
                                                                          HERE / 'context.tsv']},
           'cartesian': {'dated': '1,095 × 29 exact, unique', 'context': '720 valid can-chi × 29 exact, unique'},
           'invariants': inv,
           'orderInvariance': f'{seeds} seeds: facts, scope dicts, dated facts and authority clauses/conditions shuffled; byte-identical', 'puzhu06SpecGap': 0,
           'coverage': coverage(dated, ctx, H)}
    return {HERE / 'checks.json': json.dumps(out, ensure_ascii=False, indent=1) + '\n'}


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
