"""Sequential mutations for the P4 A03 grade resolver (audit only, before scoring).

Run only while no test/build/edit process is using these files. Every byte is
restored in finally; the frozen Golden and locks are never modified.
"""
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
target = root / 'shared/lunar/p4GradeResolution.ts'
original = target.read_bytes()
mutations = [
    ('global_de_boolean', 'let named = group.filter((g) => de.has(g))', 'let named = [...de]'),
    ('ignore_de_as_jian', 'DE_AS_JIAN.has(rule.id) ||', 'false ||'),
    ('de_yuan_as_absent', 'undetermined = true', 'undetermined = false'),
    ('swap_de_branches', '(dePresent ? grade.withDe : grade.withoutDe)', '(dePresent ? grade.withoutDe : grade.withDe)'),
    ('own_clause_not_terminal', 'const owner = walk.terminal', 'const owner = subject'),
    ('xiangdi_as_agree', "? 'xiangdi'", "? 'agree'"),
]
results = []
try:
    for name, old, new in mutations:
        text = original.decode()
        if old not in text:
            raise RuntimeError(f'Mutation did not apply: {name}')
        target.write_text(text.replace(old, new, 1))
        run = subprocess.run(
            ['npx', 'vitest', 'run', 'shared/lunar/p4GradeResolution.test.ts'],
            cwd=root, capture_output=True, text=True, timeout=180,
        )
        output = run.stdout + run.stderr
        caught = run.returncode != 0 and ('AssertionError' in output or 'expected' in output)
        results.append({'mutation': name, 'caughtByAssertion': caught, 'exitCode': run.returncode})
        target.write_bytes(original)
finally:
    target.write_bytes(original)

report = {
    'scope': 'AUDIT_A03_GRADE_RESOLUTION_ONLY_NOT_SCORING',
    'mutations': results,
    'restored': True,
    'notCovered': 'Heading annotation (A04), target 忌 scope (A05), scoring, penalty, warehouse and event mutations remain go-live prerequisites.',
}
(root / 'docs/audits/p4-vol10-grade-mutation-results.json').write_text(
    json.dumps(report, ensure_ascii=False, indent=2) + '\n'
)
print(json.dumps(results))
