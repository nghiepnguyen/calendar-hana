"""Sequential mutations for P4 source integrity and annotation, before scoring.

Run only while no test/build/edit process is using these files. This runner
restores every byte in finally; the frozen Golden is never modified.
"""
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
annotation = root / 'shared/lunar/p4Annotation.ts'
classes = root / 'shared/almanac-data/p4-vol10-god-classes.json'
originals = {path: path.read_bytes() for path in (annotation, classes)}
mutations = [
    (
        'both_as_neither', annotation,
        "if (input.yi && input.ji) return 'both_present'",
        "if (input.yi && input.ji) return 'neither_recorded'",
    ),
    (
        'unknown_as_neither', annotation,
        "return 'undetermined'", "return 'neither_recorded'",
    ),
    (
        'protected_baiji_balanced', classes,
        '"classes": ["protected_baiji"]', '"classes": ["yi_subject"]',
    ),
]
results = []
try:
    for name, path, old, new in mutations:
        before = path.read_bytes()
        modified = before.decode().replace(old, new, 1)
        if modified == before.decode():
            raise RuntimeError(f'Mutation did not apply: {name}')
        path.write_text(modified)
        run = subprocess.run(
            ['npx', 'vitest', 'run', 'shared/lunar/p4Vol10Authority.test.ts'],
            cwd=root, capture_output=True, text=True, timeout=120,
        )
        output = run.stdout + run.stderr
        if run.returncode == 0 or 'failed' not in output.lower():
            raise RuntimeError(f'Mutation was not caught: {name}')
        if 'AssertionError' not in output and 'expected' not in output:
            raise RuntimeError(f'Gate failed without an expected assertion: {name}')
        results.append({
            'mutation': name, 'caught': True, 'exitCode': run.returncode,
            'assertions': 'Source/contract gate failed as expected; no test or Golden weakened.',
        })
        path.write_bytes(before)
finally:
    for path, content in originals.items():
        path.write_bytes(content)

report = {
    'scope': 'PRE_SCORING_SOURCE_AND_ANNOTATION_ONLY',
    'frozenSourceCommit': '19e8673',
    'mutations': results,
    'restored': True,
    'notCovered': 'Scoring, penalty implementation, presence activation, event and warehouse mutations remain go-live prerequisites.',
}
(root / 'docs/audits/p4-vol10-mutation-results.json').write_text(
    json.dumps(report, ensure_ascii=False, indent=2) + '\n'
)
print(json.dumps(results))
