"""Full Golden P4, task 3.2e: 等第 cell, grade and 德 branch per (context, subject); cross-check with clauses.

Two independent encodings of 卷十 are compared on all 720 contexts: the 等第 table transcription
(p4-vol10-authority.json cells, scans n220/n221) and the entry clauses used by 3.2b. Each grid column
must give every Month Jian exactly one cell; the cell's grade action (with/without the clause's named 德)
must equal the clause effect (相抵 = cancel_both counts as agreement). 月建/月破 have no column.

    python3 -I docs/audits/sources/p4-vol10/p4-full-golden-v2/ji/grades.py [--write]
"""
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

HERE = Path('docs/audits/sources/p4-vol10/p4-full-golden-v2/ji')
_spec = importlib.util.spec_from_file_location('scopes', HERE / 'scopes.py')
sc = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(sc)

AUTHORITY = Path('shared/almanac-data/p4-vol10-authority.json')
ACTION_TO_EFFECT = {'only_yi': {'only_avoid'}, 'only_ji': {'as_usual', 'still_avoid'}, 'all_taboo': {'avoid_all'},
                    'both_present': {'cancel_both'}}
MONTH_CHARS = set('子丑寅卯辰巳午未申酉戌亥')


def sha256(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def grid():
    a = json.loads(AUTHORITY.read_text(encoding='utf-8'))
    grade = {g['id']: g for g in a['grades']}
    col = {c['id']: sc.norm(c['han']).replace('劫', '刼') for c in a['columns']}
    cell_of = {}
    for c in a['cells']:
        if c['isBlank']:
            continue
        colid, gid = c['id'].split(':')
        for seg in c['displayReading'].split(' / '):
            months = seg.split('月')[0]
            assert months and set(months) <= MONTH_CHARS, (c['id'], seg)
            for m in months:
                key = (col[colid], m)
                assert key not in cell_of, ('two cells', key)
                cell_of[key] = (c['id'], gid)
    for s in col.values():
        for m in sc.op.MONTHS:
            assert (s, m) in cell_of, ('no cell', s, m)  # gridPredicate: exactly one cell per (subject, month)
    return cell_of, grade


def build():
    cell_of, grade = grid()
    entries = sc.load_entries()[0]
    res = sc.build()
    rows, conflicts = [], []
    for (month, pillar), r in res.items():
        for s, scope in r['scopes'].items():
            if (s, month) not in cell_of:
                assert s in ('月建', '月破'), s
                continue
            cid, gid = cell_of[(s, month)]
            clause = sc.clause_for(entries[scope['owner']], month)
            g = grade[gid]
            if clause.get('with'):
                branch = 'withDe' if scope['named'] else 'withoutDe'
                action = g[branch]
            else:  # unconditional clause: the table must not split on 德
                branch = 'unconditional'
                action = g['withDe']
                if g['withDe'] != g['withoutDe']:
                    conflicts.append((month + pillar, s, cid, 'unconditional clause on a 德-split grade'))
            ok = scope['effect'] in ACTION_TO_EFFECT[action]
            if not ok:
                conflicts.append((month + pillar, s, cid, action, scope['effect']))
            rows.append({'id': f'{month}-{pillar}', 'subject': s, 'cell': cid, 'grade': gid, 'branch': branch,
                         'action': action, 'effect': scope['effect'],
                         'consistency': 'xiangdi' if action == 'both_present' else 'agree' if ok else 'conflict'})
    return rows, conflicts


def files():
    rows, conflicts = build()
    assert not conflicts, conflicts[:10]
    from collections import Counter
    head = ['id', 'subject', 'cell', 'grade', 'branch', 'action', 'effect', 'consistency']
    summary = {
        'stage': '3.2e grade cross-check',
        'inputs': {str(p): sha256(p) for p in [HERE / 'scopes.py', AUTHORITY]},
        'rows': len(rows), 'conflicts': 0,
        'consistency': dict(sorted(Counter(r['consistency'] for r in rows).items())),
        'grades': dict(sorted(Counter(r['grade'] for r in rows).items())),
        'branches': dict(sorted(Counter(r['branch'] for r in rows).items())),
    }
    text = '\t'.join(head) + '\n' + ''.join('\t'.join(r[h] for h in head) + '\n' for r in rows)
    return {HERE / 'grades.tsv': text, HERE / 'grades-summary.json': json.dumps(summary, ensure_ascii=False, indent=1) + '\n'}


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
