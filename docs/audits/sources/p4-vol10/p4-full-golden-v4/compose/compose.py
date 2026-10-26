"""Q4-REST Stage 3 (owner R-JK / R-WX / R-XH / R-F1Y): full Golden P4 v4 day states = the frozen v2 composer under
puzhu:06 authority v5.

    python3 -I docs/audits/sources/p4-vol10/p4-full-golden-v4/compose/compose.py [--write]

The v3 compose.py is loaded unchanged (sha asserted); it loads the v2 composer unchanged (sha asserted by v3). On
the v2 module this file moves: its puzhu:06 authority (v4 → v5), its puzhu:06 oracle Golden (v4 → v5), its output
directory, and three functions, all from the v5 authority:
  - puzhu06_classes: a copy of v2's with one line changed — an exclusion's own class (QL_NARROW) is used;
  - propagate: v2's, then the owner 宜 rules after propagation — the scoped rule (a row kept only by QL_NARROW that
    reads both_present is only_ji, reason Q4_REST_OWNER_ONLY_JI) and yiComposition R-F1Y (on 立券交易, a
    both_present row whose only surviving 忌 is 五離 is only_ji, reason R-F1Y);
  - oracles: v2's on a copy where the R-F1Y rows read their pre-rule state (R-F1Y is not a puzhu:06 rule, so the
    puzhu:06 Golden v5 does not carry it); the R-F1Y rows are counted separately.
Independent constraint, checked before writing: every dated row that differs from v3 is in the frozen Stage 3
prediction (q4-rest-stage3/prediction.json, taken on v4 before any engine code) with the predicted final state,
or a tag-only QL → QL_NARROW decision; every context row that differs is explained the same way.
Default verifies the committed outputs byte-for-byte; --write regenerates them and the lock.
"""
import hashlib
import importlib.util
import json
import sys
from collections import Counter
from pathlib import Path

V3_DIR = Path('docs/audits/sources/p4-vol10/p4-full-golden-v3/compose')
V3_COMPOSE = V3_DIR / 'compose.py'
V3_SHA = '4f7518e572bed9234f3869fda8727e339130846291ea19d581f38ae3e8714869'
HERE = Path('docs/audits/sources/p4-vol10/p4-full-golden-v4/compose')
LOCK = HERE.parent / 'lock.json'
PUZHU06 = Path('shared/almanac-data/p4b-puzhu06-v5.json')
G_DATED = Path('docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v5/dated.tsv')
G_CONTEXT = Path('docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v5/context.tsv')
PREDICTION = Path('docs/audits/sources/p4-vol10/q4-rest-stage3/prediction.json')
ONLY_JI = 'Q4_REST_OWNER_ONLY_JI'

assert hashlib.sha256(V3_COMPOSE.read_bytes()).hexdigest() == V3_SHA, 'full Golden v3 composer changed'
_spec = importlib.util.spec_from_file_location('p4_full_golden_v3_compose', V3_COMPOSE)
v3 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(v3)
v2 = v3.v2
AUTH = json.loads(PUZHU06.read_text(encoding='utf-8'))
v2.PUZHU06 = PUZHU06
v2.G_PUZHU06_DATED = G_DATED
v2.G_PUZHU06_CONTEXT = G_CONTEXT
v2.HERE = HERE


def narrow_only_ji(classes):
    return 'QL_NARROW' in classes and all(c == 'QL_NARROW' or AUTH['classes'][c]['action'] == 'lift' for c in classes)


def puzhu06_classes(h, d, facts, scope_rec, grades, month, auth):
    """v2's puzhu06_classes with one change: an excluded god reads its exclusion's own class (v5 QL_NARROW)."""
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
        elif st in v2.JI_STATES:
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
                ex = auth['liftExclusions'].get(f[0], {})
                out.add('QL' if any(t not in ex.get('triggers', []) for t in d['triggers'])
                        else ex.get('class', 'QL_EXCLUDED'))
            else:
                out.add('SPEC_GAP')
    if 'restored' in d and h in d['restored']:
        out.add('PUZHU27')
    d['p06classes'] = sorted(out)  # read by the post-propagation owner 宜 rules
    return sorted(out)


_v2_propagate = v2.propagate


def ji_ids(d):
    part = next((p for p in d['code'].split(';') if p.startswith('ji=')), None)
    return part[3:].split('+') if part else []


def propagate(days, lines, neither_of):
    out = _v2_propagate(days, lines, neither_of)
    for h, d in out.items():
        if d['state'] == 'both_present' and d.get('p06classes') and narrow_only_ji(d['p06classes']) \
                and not d.get('propagated'):
            d.update(state='only_ji', yi_noted=False, reasons=d['reasons'] + [ONLY_JI],
                     code=f'{ONLY_JI}:QL_NARROW>only_ji;' + d['code'])
    for rule in AUTH['yiComposition']:
        d = out.get(rule['heading'])
        if d and d['state'] == rule['from'] and ji_ids(d) == [rule['soleJi']]:
            d.update(state=rule['to'], yi_noted=False, reasons=d['reasons'] + [rule['id']],
                     code=f"{rule['id']}:{rule['soleJi']}>{rule['to']};" + d['code'], f1y_from=rule['from'])
    return out


_v2_oracles = v2.oracles


def oracles(out_ctx, out_dated):
    """v2 oracles on the pre-R-F1Y states (the puzhu:06 Golden carries no R-F1Y); R-F1Y rows counted apart."""
    f1y = Counter()

    def revert(days, domain):
        res = {}
        for h, d in days.items():
            if 'f1y_from' in d:
                f1y[domain] += 1
                d = dict(d, state=d['f1y_from'], reasons=[r for r in d['reasons'] if r != 'R-F1Y'])
            res[h] = d
        return res
    ctx = {k: (revert(days, 'context'), p06) for k, (days, p06) in out_ctx.items()}
    dated = {k: (m, p, revert(days, 'dated'), p06) for k, (m, p, days, p06) in out_dated.items()}
    rep = _v2_oracles(ctx, dated)
    rep = {k.replace('goldenPuzhu06V3', 'goldenPuzhu06V5'): v for k, v in rep.items()}
    rep['R-F1Y (not a puzhu:06 rule)'] = dict(f1y)
    return rep


v2.puzhu06_classes = puzhu06_classes
v2.propagate = propagate
v2.oracles = oracles


def rows(text):
    head, *body = text.splitlines()
    return head.split('\t'), {tuple(r.split('\t')[:4]): r for r in body}


def check(fs):
    """v3 → v4 differences must be the frozen Stage 3 prediction; anything else stops the run."""
    pred = json.loads(PREDICTION.read_text(encoding='utf-8'))
    assert pred['authority'] == 'p4b-puzhu06-v4'
    states = {(x['date'], x['heading']): (x['model'] or {}).get('state') for x in pred['full']['heading']}
    decisions = {(x['date'], x['heading']) for x in pred['full']['decision']}
    bad, changed, seen = [], [], set()
    for name in ('dated.tsv', 'context.tsv'):
        head, old = rows((V3_DIR / name).read_text(encoding='utf-8'))
        _, new = rows(fs[HERE / name])
        assert old.keys() == new.keys(), name
        col = {c: i for i, c in enumerate(head)}
        for k in old:
            if old[k] == new[k]:
                continue
            a, b = old[k].split('\t'), new[k].split('\t')
            moved = [c for c in head if a[col[c]] != b[col[c]]]
            changed.append(f'{name} {k[0]} {k[3]} {"+".join(moved)} {a[col["state"]]}>{b[col["state"]]}')
            key, h, p06 = (k[0], k[3]), k[3], b[col['puzhu06']]
            narrow = 'QL_NARROW' in p06
            f1y = 'R-F1Y' in b[col['reasons']].split(' ')
            if name == 'dated.tsv':
                seen.add(key)
                ok = (key in decisions or f1y) and (
                    a[col['state']] == b[col['state']] or states.get(key) == b[col['state']])
            else:
                ok = (narrow or f1y) and (
                    a[col['state']] == b[col['state']] or b[col['state']] in ('only_ji', 'both_present', 'undetermined'))
            if not ok:
                bad.append(changed[-1])
    missing = {k for k, s in states.items() if (k[0], k[1]) not in seen}
    if missing:
        bad.append(f'predicted heading rows not reproduced: {sorted(missing)[:10]}')
    if bad:
        raise SystemExit('FAIL unexpected v3 → v4 rows:\n' + '\n'.join(bad[:40]))
    return changed


def lock_text(fs):
    paths = [HERE / 'compose.py', *(p for p in fs if p != LOCK), V3_COMPOSE, V3_DIR.parent / 'lock.json',
             v3.V2_COMPOSE, PUZHU06, G_DATED, G_CONTEXT, PREDICTION]
    blob = lambda p: fs[p].encode() if p in fs else p.read_bytes()
    return json.dumps({
        'version': 'p4-full-golden-lock-v4', 'scope': 'Q4_REST_STAGE3_PUZHU06_AUTHORITY_V5',
        'method': 'full Golden v3 composer (sha-asserted, loads v2) with puzhu:06 authority v5, oracle Golden v5, '
                  'QL_NARROW classes and the owner 宜 rules after propagation; v3 kept as the pre-Stage-3 rollback',
        'generation': 'python3 -I docs/audits/sources/p4-vol10/p4-full-golden-v4/compose/compose.py --write',
        'files': [{'path': str(p), 'sha256': hashlib.sha256(blob(p)).hexdigest()} for p in paths]},
        ensure_ascii=False, indent=1) + '\n'


def main():
    fs = v2.files()
    fs[HERE / 'v3-diff.txt'] = '\n'.join(check(fs)) + '\n'
    fs[LOCK] = lock_text(fs)
    if '--write' in sys.argv:
        HERE.mkdir(parents=True, exist_ok=True)
        for p, t in fs.items():
            p.write_text(t, encoding='utf-8')
        print('wrote', len(fs))
        return
    for p, t in fs.items():
        assert p.read_text(encoding='utf-8') == t, f'{p} differs'
    print('verified', len(fs))


if __name__ == '__main__':
    main()
