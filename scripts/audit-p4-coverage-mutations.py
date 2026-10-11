"""Sequential mutations for the P4 A05 deferral coverage (audit only, before scoring).

Run only while no test/build/edit process is using these files. Every byte is
restored in finally; the artifact and locks are never modified.
"""
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
target = root / 'shared/lunar/p4HeadingAnnotation.ts'
original = target.read_bytes()
mutations = [
    ('uncovered_dropped', "if (headings[h] !== 'only_ji') headings[h] = 'undetermined'", 'void h'),
    ('uncovered_overrides_target_ji', "if (headings[h] !== 'only_ji') headings[h] = 'undetermined'", "headings[h] = 'undetermined'"),
    ('same_as_ignored', 'const src = same ?', 'const src = false ?'),
    ('target_list_as_subject', 'const covered = getP4BaseAvoid(target, month)', 'const covered = getP4BaseAvoid(subject, month)'),
]
results = []
try:
    for name, old, new in mutations:
        text = original.decode()
        if old not in text:
            raise RuntimeError(f'Mutation did not apply: {name}')
        target.write_text(text.replace(old, new, 1))
        run = subprocess.run(
            ['npx', 'vitest', 'run', 'shared/lunar/p4DeferralCoverage.test.ts', 'shared/lunar/p4HeadingAnnotation.test.ts'],
            cwd=root, capture_output=True, text=True, timeout=180,
        )
        output = run.stdout + run.stderr
        caught = run.returncode != 0 and ('AssertionError' in output or 'expected' in output)
        results.append({'mutation': name, 'caughtByAssertion': caught, 'exitCode': run.returncode})
        target.write_bytes(original)
finally:
    target.write_bytes(original)

report = {
    'scope': 'AUDIT_A05_DEFERRAL_COVERAGE_ONLY_NOT_SCORING',
    'mutations': results,
    'restored': True,
}
(root / 'docs/audits/p4-vol10-coverage-mutation-results.json').write_text(
    json.dumps(report, ensure_ascii=False, indent=2) + '\n'
)
print(json.dumps(results))
