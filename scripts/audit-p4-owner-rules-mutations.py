"""Sequential mutations of the roadmap 7b owner-rules layer (PRD FR-05).

Each mutation edits shared/lunar/p4OwnerRules.ts in place, runs the owner-rules test against the frozen
full Golden v2 (fast subset: every date the engine comparison flagged + a fixed sample, and a context
sample), and restores the bytes. A clean control run comes first. Never touches the Golden or authority. A mutation counts as caught only when
the owner-rules test itself fails ("Golden" in the output), so an import or syntax error reads as not caught.

    python3 scripts/audit-p4-owner-rules-mutations.py
"""
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
TARGET = root / 'shared/lunar/p4OwnerRules.ts'
TEST = ['shared/lunar/p4OwnerRules.test.ts']
REPORT = root / 'docs/audits/p4-owner-rules-mutation-results.json'
# (name, rule, old, new)
mutations = [
    ('h1b_reverted', 'H1-B/F5', "      row = { state: 'only_ji', ji: true, protectedJi: false, rule: 'H1-B' }",
     "      row = { state: 'undetermined', ji: true, protectedJi: false, rule: 'H1-B' }"),
    ('e3_reverted', 'E3', "          state: xiangdi[h] ? 'neither_recorded' : yiState(d.yiNoted),",
     "          state: yiState(d.yiNoted),"),
    ('h2a_reverted', 'H2-A', '      const resolved = h2aScope(month, pillar, subject)',
     '      const resolved = null as ReturnType<typeof h2aScope>'),
    ('f1_reverted', 'F1', "(r.day === '巳' && r.raw === '出行' ? '行幸遣使' : null)", 'null'),
    ('e1_reverted', 'E1', "fs.some((f) => f.state === 'neither_recorded' || f.state === 'no_annotation')",
     "fs.some((f) => f.state === 'neither_recorded')"),
    ('i_yi_reverted', '(i) 宜', '      .filter((t) => !(drop && DE_HE.includes(t.han)))', '      .filter(() => true)'),
    ('i_rule_d_reverted', '(i) 修倉庫 rule D', 'ruleD(warehouse.presence, drop)', 'ruleD(warehouse.presence, false)'),
    ('i_remaining_reverted', '(i) remaining-ji', 'const remaining = remainingScopes(month, pillar, drop)',
     'const remaining = remainingScopes(month, pillar, false)'),

    ('a04b_layering', 'A04b layering (later protected 忌 ignored)', "(f.kind === 'dated' && f.state === 'protected'),",
     'false,'),
    ('puzhu28_dropped', 'puzhu:28', "    if (dayRule) row =", "    if (false) row ="),
    ('e5_dropped', 'E5 context', 'rows.every((r) => key(r) === key(rows[0]!))', 'true'),
]
# Equivalent on real data: verified once over the whole Golden v2 domain (31,755 dated + 20,880 context
# rows, P4_OWNER_RULES_FULL=1, 2026-10-17) — no row changes, so no witness exists in 2025–2027.
EQUIVALENT = [
    ('i_triggers_reverted', '(i) puzhu:06 triggers',
     'observed effect only: reverting it changes no row of the full Golden v2 domain; the cause was not checked separately'),
]


def run_test():
    return subprocess.run(['npx', 'vitest', 'run', *TEST], cwd=root, capture_output=True, text=True, timeout=1800)


original = TARGET.read_bytes()
results = []
try:
    control = run_test()
    if control.returncode != 0:
        raise RuntimeError('control run failed:\n' + control.stdout[-2000:])
    for name, rule, old, new in mutations:
        text = original.decode()
        if text.count(old) != 1:
            raise RuntimeError(f'mutation does not apply once: {name}: {old!r}')
        TARGET.write_text(text.replace(old, new))
        try:
            r = run_test()
        finally:
            TARGET.write_bytes(original)
        out = r.stdout + r.stderr
        caught = r.returncode != 0 and ' failed' in out and 'Golden' in out
        results.append({'mutation': name, 'rule': rule, 'caughtByTest': caught, 'exitCode': r.returncode})
        print(json.dumps(results[-1], ensure_ascii=False), flush=True)
finally:
    TARGET.write_bytes(original)
report = {
    'version': 'p4-owner-rules-mutations-v1',
    'target': str(TARGET.relative_to(root)),
    'tests': TEST,
    'control': 'clean',
    'mutations': len(results),
    'caught': sum(r['caughtByTest'] for r in results),
    'restored': TARGET.read_bytes() == original,
    'results': results,
    'equivalentOnRealData': [{'mutation': n, 'rule': r, 'evidence': e} for n, r, e in EQUIVALENT],
}
REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
if not report['restored'] or report['caught'] != len(results):
    raise SystemExit(f"FAIL: {report['caught']}/{len(results)} caught, restored={report['restored']}")
print(f"OK {report['caught']} mutations caught")
