"""F1 Stage 3 (owner R2): full Golden P4 v3 day states = the frozen v2 composer under puzhu:06 authority v4.

    python3 -I docs/audits/sources/p4-vol10/p4-full-golden-v3/compose/compose.py [--write]

The v2 compose.py is loaded unchanged (sha asserted); only its puzhu:06 authority (v3 → v4), its puzhu:06
oracle Golden (v3 → v4) and its output directory move. Independent constraint, checked before writing:
every row that differs from v2 is a 立券交易 row of the frozen F1 Stage 2 envelope (12 dated rows on the R2
dates, puzhu06 column lift → keep with QL_EXCLUDED), a tag-only QL → QL_EXCLUDED on a row another class already
keeps, 未-戊申 where puzhu:21 then withholds the kept 五離 (state unchanged), or the propagation annotation of
開倉庫出貨財 on the two 未-戊申 dates with its state unchanged. Default verifies the committed outputs byte-for-byte; --write
regenerates them.
"""
import hashlib
import importlib.util
import sys
from pathlib import Path

V2_DIR = Path('docs/audits/sources/p4-vol10/p4-full-golden-v2/compose')
V2_COMPOSE = V2_DIR / 'compose.py'
V2_SHA = 'e6b4dcfc5db5d67aeba106ade7ae52328ea3a3966a8d3ded61314a2ec619c761'
HERE = Path('docs/audits/sources/p4-vol10/p4-full-golden-v3/compose')
R2_DATES = {'2025-01-15', '2025-06-08', '2025-10-18', '2025-10-30', '2026-01-10', '2026-08-02', '2026-10-13',
            '2026-10-25', '2027-01-05', '2027-07-28', '2027-10-08', '2027-10-20'}
WEISHEN = {'2026-08-02', '2027-07-28'}

assert hashlib.sha256(V2_COMPOSE.read_bytes()).hexdigest() == V2_SHA, 'full Golden v2 composer changed'
_spec = importlib.util.spec_from_file_location('p4_full_golden_v2_compose', V2_COMPOSE)
v2 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(v2)
v2.PUZHU06 = Path('shared/almanac-data/p4b-puzhu06-v4.json')
v2.G_PUZHU06_DATED = Path('docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v4/dated.tsv')
v2.G_PUZHU06_CONTEXT = Path('docs/audits/sources/p4-vol10/p4b-puzhu06-golden-v4/context.tsv')
v2.HERE = HERE


def rows(text):
    head, *body = text.splitlines()
    return head.split('\t'), {tuple(r.split('\t')[:4] if r.split('\t')[0][:2] == '20' else r.split('\t')[:4]): r
                              for r in body}


def check(fs):
    """v2 → v3 differences must be the R2 envelope; anything else stops the run."""
    bad, changed = [], []
    for name in ('dated.tsv', 'context.tsv'):
        head, old = rows((V2_DIR / name).read_text(encoding='utf-8'))
        _, new = rows(fs[HERE / name])
        assert old.keys() == new.keys(), name
        col = {c: i for i, c in enumerate(head)}
        for k in old:
            if old[k] == new[k]:
                continue
            a, b = old[k].split('\t'), new[k].split('\t')
            moved = [c for c in head if a[col[c]] != b[col[c]]]
            changed.append(f'{name} {k[0]} {k[3]} {"+".join(moved)}')
            heading, key = k[3], k[0]
            if heading == '立券交易' and set(moved) <= {'puzhu06', 'state', 'ji', 'code', 'reasons'} and \
                    'QL_EXCLUDED' in b[col['puzhu06']] and a[col['puzhu06']].startswith('lift') and \
                    (name == 'context.tsv' or key in R2_DATES):
                continue
            # Tag only: a row already kept by another class gains QL_EXCLUDED; action and state unchanged.
            if heading == '立券交易' and moved == ['puzhu06'] and a[col['puzhu06']].startswith('keep') and \
                    b[col['puzhu06']] == a[col['puzhu06']].replace('QL', 'QL_EXCLUDED'):
                continue
            # 未-戊申: puzhu:06 keeps 五離, then puzhu:21 from 納財 withholds it; the final state is unchanged.
            if heading == '立券交易' and (key in WEISHEN or key == '未-戊申') and \
                    set(moved) <= {'puzhu06', 'propagated', 'code'} and a[col['state']] == b[col['state']]:
                continue
            if heading == '開倉庫出貨財' and set(moved) <= {'blocked'} and \
                    (key in WEISHEN or key == '未-戊申') and a[col['state']] == b[col['state']]:
                continue
            bad.append(changed[-1])
    if bad:
        raise SystemExit('FAIL unexpected v2 → v3 rows:\n' + '\n'.join(bad[:40]))
    return changed


def main():
    fs = v2.files()
    fs[HERE / 'v2-diff.txt'] = '\n'.join(check(fs)) + '\n'
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
