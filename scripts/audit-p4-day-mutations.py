"""Sequential mutations for the P4 A04b day composition (audit only, before scoring).

Run only while no test/build/edit process is using these files. Every byte is
restored in finally; the frozen Golden and locks are never modified.
"""
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
target = root / 'shared/lunar/p4DayComposition.ts'
original = target.read_bytes()
mutations = [
    ('baiji_unprotected', 'const protectedJi = baiji.has(h) ||', 'const protectedJi ='),
    ('neither_beats_protected', ": neither && !protectedJi\n", ": neither\n"),
    ('suppression_lines_ignored', 'suppressed.has(h) ||', ''),
    ('unknown_yi_as_false', 'seen.includes(undefined) ? undefined : false', 'false'),
    ('lifted_inference_off', "st === 'undetermined' && yiH === false", 'false'),
    ('propagation_ignores_protection', 'if (d.protectedJi) {', 'if (false) {'),
    ('uncovered_inferred_lifted', ' && !s.uncoveredByDeferral?.includes(h)', ''),
    ('propagation_lifts_undetermined', "if (d.state === 'undetermined') continue", 'void 0'),
]
results = []
try:
    for name, old, new in mutations:
        text = original.decode()
        if old not in text:
            raise RuntimeError(f'Mutation did not apply: {name}')
        target.write_text(text.replace(old, new, 1))
        run = subprocess.run(
            ['npx', 'vitest', 'run', 'shared/lunar/p4DayComposition.test.ts'],
            cwd=root, capture_output=True, text=True, timeout=180,
        )
        output = run.stdout + run.stderr
        caught = run.returncode != 0 and ('AssertionError' in output or 'expected' in output)
        results.append({'mutation': name, 'caughtByAssertion': caught, 'exitCode': run.returncode})
        target.write_bytes(original)
finally:
    target.write_bytes(original)

report = {
    'scope': 'AUDIT_A04B_DAY_COMPOSITION_ONLY_NOT_SCORING',
    'mutations': results,
    'restored': True,
    'notCovered': 'Day-level composition and propagation (A04b), target 忌 coverage (A05), scoring, penalty, warehouse and event mutations remain go-live prerequisites.',
}
(root / 'docs/audits/p4-vol10-day-mutation-results.json').write_text(
    json.dumps(report, ensure_ascii=False, indent=2) + '\n'
)
print(json.dumps(results))
