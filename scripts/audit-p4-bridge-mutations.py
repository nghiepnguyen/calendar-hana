"""Sequential mutations for the P4 context bridge (audit only, before scoring).

Run only while no test/build/edit process is using these files. Every byte is
restored in finally; the frozen Golden and lock are never modified.
"""
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
bridge = root / 'shared/lunar/p4ContextBridge.ts'
original = bridge.read_bytes()
mutations = [
    ('unknown_as_absent', "? 'unknown'\n", "? 'absent'\n"),
    (
        'absent_target_as_terminal',
        "return { status: 'target_absent', path, terminal: null }",
        "return { status: 'named_deferral', path, terminal: edge.target }",
    ),
    ('walk_from_unknown_subject', "if (subjects[s] === 'present')", "if (subjects[s] !== 'absent')"),
    ('single_hop_only', 'for (;;) {', 'for (let hop = 0; hop < 2; hop++) {\n    if (hop) return { status: \'named_deferral\', path, terminal: path.at(-1)! }'),
    ('drop_de_as_jian', 'g.ruleIds.filter((id) => ids.has(id))', '[] as string[]'),
]
results = []
try:
    for name, old, new in mutations:
        text = original.decode()
        if old not in text:
            raise RuntimeError(f'Mutation did not apply: {name}')
        bridge.write_text(text.replace(old, new, 1))
        run = subprocess.run(
            ['npx', 'vitest', 'run', 'shared/lunar/p4ContextBridge.test.ts'],
            cwd=root, capture_output=True, text=True, timeout=120,
        )
        output = run.stdout + run.stderr
        caught = run.returncode != 0 and ('AssertionError' in output or 'expected' in output)
        if not caught:
            raise RuntimeError(f'Mutation was not caught by an assertion: {name}')
        results.append({'mutation': name, 'caughtByAssertion': True, 'exitCode': run.returncode})
        bridge.write_bytes(original)
finally:
    bridge.write_bytes(original)

report = {
    'scope': 'AUDIT_CONTEXT_BRIDGE_ONLY_NOT_SCORING',
    'mutations': results,
    'restored': True,
    'notCovered': 'Grade selection, heading annotation, scoring, penalty, warehouse and event mutations remain go-live prerequisites.',
}
(root / 'docs/audits/p4-vol10-bridge-mutation-results.json').write_text(
    json.dumps(report, ensure_ascii=False, indent=2) + '\n'
)
print(json.dumps(results))
