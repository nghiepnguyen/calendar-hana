"""Mutation runner for the full Golden P4 v1 derive (roadmap 7, owner option (b), task 7.0).

Each mutation edits one derive script in a temporary detached git worktree at HEAD, regenerates the whole
chain with --write, and records what catches it:
  self_check    a derive assertion fails (oracle comparison, invariant, coverage, owner-rule check);
  frozen_bytes  every stage passes but an expected output differs from the frozen bytes (lock);
  survived      nothing changes.
Runs sequentially; the worktree is reset after every mutation and removed at the end.

    python3 scripts/audit-p4-full-golden-mutations.py            # verify the tracked report
    python3 scripts/audit-p4-full-golden-mutations.py --write    # rewrite it
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

G = 'docs/audits/sources/p4-vol10/p4-full-golden-v2'
REVIEW = 'docs/audits/sources/p4-vol10/p4-full-golden-v2-review'
REPORT = Path(REVIEW) / 'mutation/report.json'
STAGES = ['presence/derive.py', 'ji/operands.py', 'ji/scopes.py', 'ji/context_ji.py', 'ji/dated_ji.py',
          'ji/grades.py', 'compose/compose.py', 'compose/checks.py', '../p4-full-golden-v2-review/owner_checks.py']

MUTATIONS = [
    ('M01', 'FR-07 bỏ một thần dormant (四窮 vắng mọi ngày)', 'presence/derive.py',
     "return [g for g in ids if part[rules[g][1]] in rules[g][2][month]]",
     "return [g for g in ids if part[rules[g][1]] in rules[g][2][month] and g != 'tu_cung']"),
    ('M02', 'FR-07 Month Jian sai tháng (lệch một tiết, proxy cho operand tháng âm)', 'presence/derive.py',
     "return jie[bisect.bisect_right([r[0] for r in jie], ms) - 1][1]",
     "return jie[bisect.bisect_right([r[0] for r in jie], ms) - 2][1]"),
    ('M03', 'FR-07 ANY partner thành ALL (宜 evidence)', 'compose/compose.py',
     "return (True if True in states else None if None in states else False), present or unknown",
     "return (True if states and all(s is True for s in states) else None if None in states else False), present or unknown"),
    ('M04', 'FR-07 bỏ ngoại lệ 專忌 (百忌日 không được bảo vệ)', 'ji/context_ji.py',
     "'baiji', b.get('part', b.get('raw', '')), 'protected'",
     "'remaining', 'raw', 'kept'"),
    ('M05', 'FR-07 unknown thành absent (P5 SOURCE_DEPENDENT → không 宜)', 'compose/compose.py',
     "verdict = {'yi': True, 'no_yi': False, 'source_dependent': None}",
     "verdict = {'yi': True, 'no_yi': False, 'source_dependent': False}"),
    ('M06', 'FR-07 gộp 亦從宜亦從忌 với 不註 (相抵 giữ 忌 + 宜)', 'ji/scopes.py',
     "heads = {h: 'neither_recorded' for h in base}",
     "heads = {h: 'stop' for h in base}"),
    ('M07', 'FR-07 bỏ nhánh 德 (nhóm 德 có tên luôn rỗng)', 'ji/scopes.py',
     "named = [g for g in clause.get('with') or [] if g in ctx['de']]",
     "named = []"),
    ('M08', 'FR-07 duplicate effect (lan truyền chạy hai lượt)', 'compose/compose.py',
     "post = propagate(pre, lines, {h: pre[h]['neither'] for h in H})",
     "post = propagate(propagate(pre, lines, {h: pre[h]['neither'] for h in H}), lines, {h: pre[h]['neither'] for h in H})"),
    ('M09', 'Lan truyền bỏ qua 忌 được bảo vệ', 'compose/compose.py',
     "            if d['protected']:\n                out[h]['blocked'] = '+'.join(fired)",
     "            if False:\n                out[h]['blocked'] = '+'.join(fired)"),
    ('M10', 'Bỏ puzhu:28 (諸事不忌)', 'ji/context_ji.py',
     "'puzhu28': (month, pillar) in day28",
     "'puzhu28': False"),
    ('M11', 'Hoàn H2-A (德願 trở lại undetermined)', 'ji/scopes.py',
     "named = [g for g in named if g != '天願']",
     "return None"),
    ('M12', 'Hoàn H1-B/F5 (相抵 + 忌 không bảo vệ → undetermined)', 'compose/compose.py',
     "        reasons.append('H1-B')  # owner H1-B/F5: unprotected 忌 survives another scope's 相抵; 宜 not noted\n        ji, state = True, 'only_ji'",
     "        reasons.append('undetermined')\n        ji, state = True, 'undetermined'"),
    ('M13', 'Hoàn F1 (巳日 出行 unmapped)', 'ji/context_ji.py',
     "('行幸遣使' if b['day'] == '巳' and b.get('raw') == '出行' else None)",
     "None"),
    ('M14', 'Hoàn E1 (復日/重日 不註 không chặn 宜)', 'compose/compose.py',
     "or any(f[3] == 'no_annotation' for f in rem)",
     "or False"),
    ('M15', 'Hoàn E3 (lan truyền bỏ qua 相抵 còn lại)', 'compose/compose.py',
     "state = 'neither_recorded' if neither_of[h] else {True",
     "state = {True"),
    ('M16', 'Bỏ 德作建論 (德 vẫn tính trên ngày 陰陽錯)', 'ji/scopes.py',
     "if ctx['deAsJianRuleIds'] or 'yang_no_de_he' in rules or 'yin_no_de_he' in rules:",
     "if False:"),
    ('M17', 'Biên Jie theo trưa thay vì calendar-day', 'presence/derive.py',
     "month = month_at(jie, ms_of(start + dt.timedelta(days=1)) - 1)",
     "month = month_at(jie, ms_of(start + dt.timedelta(hours=12)))"),
    ('M18', 'Chọn clause theo vị trí (bỏ precedence riêng tháng > 「*」)', 'ji/scopes.py',
     "return (specific or hits or [None])[0]",
     "return (hits or [None])[0]"),
    ('M19', 'Hoàn quyết định (i): 德作建論 chỉ cho A03 / remaining-ji, không cho 宜 / trigger / quy tắc D', 'compose/compose.py',
     "    return [g for g in ctx['de'] if not (de_as_jian(ctx) and g in DE_HE)]",
     "    return list(ctx['de'])"),
    ('M20', 'Hoàn quyết định (i) ở quy tắc D của 修倉庫 (德合 vẫn làm partner / thần trực tiếp)', 'compose/compose.py',
     "                v = xiu_cang_ku_d(r, (r['month_jian'], r['pillar']) in dej)",
     "                v = xiu_cang_ku_d(r, False)"),
]
OUT_OF_SCOPE = ['cap trước resolution', 'event đọc raw thay applied', 'penalty −25 trùng'
                ' (roadmap 8: score adapter / cap / event)']


def run(cmd, cwd):
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)


def main():
    root = Path(run(['git', 'rev-parse', '--show-toplevel'], '.').stdout.strip())
    tmp = Path(tempfile.mkdtemp(prefix='p4-full-golden-mut-')) / 'wt'
    assert run(['git', 'worktree', 'add', '--detach', str(tmp), 'HEAD'], root).returncode == 0
    # Owner rule 2026-10-17 (shared/lunar/lockAnchor.ts): inputs outside the Golden directory are the bytes
    # committed at the lock's anchor (G2 Stage 2 later added a 卷十 headingAliases entry to one of them).
    lock = json.loads((root / G / 'lock.json').read_text(encoding='utf-8'))
    anchor = run(['git', 'log', '--reverse', '--format=%H', 'HEAD', '--', f'{G}/lock.json'], root).stdout.split()[0]
    outside = [f['path'] for f in lock['files'] if not f['path'].startswith(G + '/')]
    assert run(['git', 'checkout', anchor, '--', *outside], tmp).returncode == 0
    run(['git', 'reset', '-q'], tmp)
    results = []
    try:
        # Control: the unmutated chain must pass every stage and reproduce the frozen bytes exactly.
        for stage in STAGES:
            r = run([sys.executable, '-I', f'{G}/{stage}', '--write'], tmp)
            assert r.returncode == 0, ('control run failed', stage, r.stderr[-400:])
        assert not run(['git', 'status', '--porcelain', '--', G, REVIEW], tmp).stdout.strip(), 'control changed bytes'
        print('control clean', flush=True)
        for mid, desc, target, old, new in MUTATIONS:
            path = tmp / G / target
            text = path.read_text(encoding='utf-8')
            assert text.count(old) == 1, (mid, 'mutation anchor must occur exactly once')
            path.write_text(text.replace(old, new), encoding='utf-8')
            caught = None
            for stage in STAGES:
                r = run([sys.executable, '-I', f'{G}/{stage}', '--write'], tmp)
                if r.returncode:
                    last = [l for l in r.stderr.strip().splitlines() if l.strip()][-1][:300]
                    caught = {'by': 'self_check', 'stage': stage, 'error': last}
                    break
            if caught is None:
                changed = run(['git', 'diff', '--name-only', '--', G], tmp).stdout.split()
                changed = [c for c in changed if not c.endswith(target)]
                caught = ({'by': 'frozen_bytes', 'changedOutputs': sorted(changed)} if changed
                          else {'by': 'survived'})
            results.append({'id': mid, 'mutation': desc, 'target': target, **caught})
            assert run(['git', 'checkout', '--', '.'], tmp).returncode == 0
            assert run(['git', 'clean', '-fdq', '--', G, REVIEW], tmp).returncode == 0
            print(mid, caught['by'], caught.get('stage', ''), flush=True)
    finally:
        run(['git', 'worktree', 'remove', '--force', str(tmp)], root)
    report = {
        'version': 'p4-full-golden-mutations-v1',
        'option': 'owner (b), 2026-10-17: mutate the Python derive',
        'control': 'unmutated chain passes every stage and reproduces the frozen bytes',
        'mutations': len(results),
        'caught': sum(r['by'] != 'survived' for r in results),
        'bySelfCheck': sum(r['by'] == 'self_check' for r in results),
        'byFrozenBytesOnly': [r['id'] for r in results if r['by'] == 'frozen_bytes'],
        'survived': [r['id'] for r in results if r['by'] == 'survived'],
        'outOfScope': OUT_OF_SCOPE,
        'results': results,
    }
    text = json.dumps(report, ensure_ascii=False, indent=1) + '\n'
    out = root / REPORT
    if '--write' in sys.argv:
        out.parent.mkdir(exist_ok=True)
        out.write_text(text, encoding='utf-8')
        print('wrote', REPORT)
    else:
        assert out.read_text(encoding='utf-8') == text, 'mutation report differs; rerun with --write'
        print('verified', REPORT)
    assert not report['survived'], report['survived']


if __name__ == '__main__':
    main()
