"""Task 6.0 causal attribution: which rule actually causes each Golden ↔ engine difference.

For every rule the Golden applies and the engine does not, the revert patch is applied in a temporary
worktree at HEAD and the day composition is recomputed in-process (compose.build, no self-checks). A diff
row is attributed to a rule when reverting that rule changes the row; with every rule reverted at once
the row must equal the engine, otherwise the residual is listed (ENGINE_BUG candidates or E5 policy).
The reach of each rule (all rows it changes, diff or not) is reported too.

    python3 docs/audits/sources/p4-vol10/p4-full-golden-v1-review/engine/attribute.py [--write]
"""
import importlib.util
import json
import subprocess
import sys
import tempfile
from collections import Counter
from pathlib import Path

REVIEW = Path('docs/audits/sources/p4-vol10/p4-full-golden-v1-review')
G = 'docs/audits/sources/p4-vol10/p4-full-golden-v1'
OUT = REVIEW / 'engine/attribution.json'


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


runner = load('runner', Path('scripts/audit-p4-full-golden-mutations.py'))
cmp_ = load('compare', REVIEW / 'engine/compare.py')
PATCH = {m[0]: m[2:] for m in runner.MUTATIONS}
RULES = {
    # Revert H2-A the way spec §4 wants an undetermined scope: its own headings undetermined (the frozen
    # derive would drop a whole-scope undetermined silently; none exists after H2-A — latent limit, noted).
    'H2-A': [PATCH['M11'], ('ji/scopes.py',
                            "        return {'effect': 'undetermined', 'named': [], 'headings': {}}",
                            "        return {'effect': 'undetermined', 'named': [], 'headings': {h: 'undetermined' for h in base_list(e, month)}}")],
    'H1-B/F5': [PATCH['M12']],
    'E3': [PATCH['M15']],
    'F1': [PATCH['M13']],
    'E1': [PATCH['M14']],
    'DE_AS_JIAN_REMAINING': [('ji/context_ji.py',
                              "    if ctx['deAsJianRuleIds'] or {'yang_no_de_he', 'yin_no_de_he'} & set(ctx['pillarRuleIds']):\n        de -= set(op.DE_HE)",
                              "    if False:\n        de -= set(op.DE_HE)")],
}
LABEL = {
    'H2-A': 'OWNER H2-A',
    'H1-B/F5': 'OWNER H1-B/F5',
    'E3': 'OWNER H1-B/F5 (E3)',
    'F1': 'SPEC_BUG F1 (P4 authority leaves 巳日 出行 unmapped; owner mapped it)',
    'E1': 'ENGINE_BUG E1 (engine drops 「亦不註宜」)',
    'DE_AS_JIAN_REMAINING': 'SPEC_BUG 德作建論 scope (unregistered Golden choice; owner question)',
}
DRIVER = r'''
import importlib.util, json, sys
from pathlib import Path
spec = importlib.util.spec_from_file_location('compose', Path('docs/audits/sources/p4-vol10/p4-full-golden-v1/compose/compose.py'))
cp = importlib.util.module_from_spec(spec); spec.loader.exec_module(cp)
out_ctx, out_dated, H = cp.build()
tf = lambda v: {True: 'true', False: 'false', None: 'unknown'}[v]
res = {'dated': {}, 'context': {}}
for d, (m, p, days, _) in out_dated.items():
    for h in H:
        x = days[h]; res['dated'][d + '|' + h] = [x['state'], tf(x['ji']), tf(x['protected'])]
for (m, p), (days, _) in out_ctx.items():
    for h in H:
        x = days[h]; res['context'][m + '-' + p + '|' + h] = [x['state'], tf(x['ji']), tf(x['protected'])]
json.dump(res, sys.stdout, ensure_ascii=False)
'''


def run(cmd, cwd, **kw):
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, **kw)


def counterfactual(tmp, patches):
    assert run(['git', 'checkout', '--', '.'], tmp).returncode == 0
    for target, old, new in patches:
        p = tmp / G / target
        t = p.read_text(encoding='utf-8')
        assert t.count(old) == 1, (target, old[:40])
        p.write_text(t.replace(old, new), encoding='utf-8')
    r = run([sys.executable, '-I', '-'], tmp, input=DRIVER)
    assert r.returncode == 0, r.stderr[-500:]
    return json.loads(r.stdout)


def main():
    root = Path(run(['git', 'rev-parse', '--show-toplevel'], '.').stdout.strip())
    golden = {'dated': {}, 'context': {}}
    for r in cmp_.read(Path(G) / 'compose/dated.tsv'):
        golden['dated'][r['date'] + '|' + r['heading']] = r
    for r in cmp_.read(Path(G) / 'compose/context.tsv'):
        golden['context'][r['id'] + '|' + r['heading']] = r
    engine = {'dated': {f'{d}|{h}': v for (d, h), v in cmp_.engine_dated().items()},
              'context': {f'{c}|{h}': v for (c, h), v in cmp_.engine_context().items()}}

    def compared(domain, k):
        g = golden[domain][k]
        return not (domain == 'context' and (g['heading'] == '修倉庫' or g['state'] == 'undetermined'))

    def same(g, e):
        return g[0] == e['state'] and g[1] == e['ji'] and (g[2] == e['protected'] or e['src'] == 'P5')

    gv = {d: {k: [r['state'], r['ji'], r['protected']] for k, r in golden[d].items()} for d in golden}
    diffs = {d: [k for k in golden[d] if compared(d, k) and not same(gv[d][k], engine[d][k])] for d in golden}
    tmp = Path(tempfile.mkdtemp(prefix='p4-attr-')) / 'wt'
    assert run(['git', 'worktree', 'add', '--detach', str(tmp), 'HEAD'], root).returncode == 0
    try:
        base = counterfactual(tmp, [])
        for d in golden:  # the in-process driver reproduces the frozen Golden exactly
            assert all(base[d][k] == gv[d][k] for k in gv[d]), d
        cf = {rule: counterfactual(tmp, patches) for rule, patches in RULES.items()}
        cf['ALL'] = counterfactual(tmp, [p for ps in RULES.values() for p in ps])
    finally:
        run(['git', 'worktree', 'remove', '--force', str(tmp)], root)
    out = {'version': 'p4-full-golden-attribution-v1', 'method': __doc__.strip().splitlines()[2], 'reach': {},
           'diffs': {}, 'residual': {}}
    for rule in RULES:
        out['reach'][rule] = {d: sum(cf[rule][d][k] != gv[d][k] for k in gv[d]) for d in golden}
    for d in golden:
        classes, residual = Counter(), []
        for k in diffs[d]:
            causes = [rule for rule in RULES if cf[rule][d][k] != gv[d][k]]
            resolved = same(cf['ALL'][d][k], engine[d][k])
            if causes and resolved:
                classes[' + '.join(LABEL[c] for c in causes)] += 1
                continue
            g = golden[d][k]
            day = k.split('|')[0]
            if day in ('2027-08-07', '未-戊午') and engine[d][k]['state'] == 'undetermined':
                # Engine marks the whole day undetermined when one scope is; the Golden (spec §4) would mark only
                # 閉日/天吏 headings even without H2-A. With H2-A both resolve.
                classes['OWNER H2-A (engine whole-day undetermined)'] += 1
                continue
            if d == 'context' and engine[d][k]['state'] == 'undetermined' and g['code'].startswith('invariant;'):
                classes['CONTEXT_DATE_OPERAND_POLICY (E5)' + (' + other rules' if causes else '')] += 1
                continue
            if (d == 'dated' and g['heading'] == '栽種' and engine[d][k]['state'] == 'undetermined'
                    and g['protected'] == 'true' and 'xd=月厭' in g['code']):
                classes['ENGINE_BUG A04b layering (相抵 + unprotected 地火 judged before later protected 忌)'] += 1
                continue
            row = {'id': k, 'golden': gv[d][k], 'engine': [engine[d][k]['state'], engine[d][k]['ji'],
                                                          engine[d][k]['protected']],
                   'allReverted': cf['ALL'][d][k], 'causes': causes, 'code': g['code']}
            residual.append(row)
            classes['RESIDUAL'] += 1
        out['diffs'][d] = dict(sorted(classes.items()))
        out['residual'][d] = residual
    text = json.dumps(out, ensure_ascii=False, indent=1) + '\n'
    if '--write' in sys.argv:
        OUT.write_text(text, encoding='utf-8')
    else:
        assert OUT.read_text(encoding='utf-8') == text, 'attribution differs'
    print(json.dumps({k: out[k] for k in ('reach', 'diffs')}, ensure_ascii=False, indent=1))
    for d in golden:
        for r in out['residual'][d][:12]:
            print(d, r)


if __name__ == '__main__':
    main()
