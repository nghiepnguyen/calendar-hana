"""Focused 5.5 王日/warehouse checks, not the comprehensive 6.x mutation gate.
Run sequentially with no other tests/builds/editors using the target sources.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import tempfile

root = Path(__file__).resolve().parents[5]
TEST = 'shared/lunar/p4YiWarehouse.test.ts'
cases = [
    ('warehouse_resolved_by_any', 'shared/lunar/p4YiEvidence.ts',
     "      yi: undefined,\n      trace,\n",
     "      yi: trace.some((operand) => operand.presence === 'present') ? true : undefined,\n      trace,\n", [TEST]),
    ('warehouse_drops_trace', 'shared/lunar/p4YiEvidence.ts',
     "      yi: undefined,\n      trace,\n", "      yi: undefined,\n      trace: [],\n", [TEST]),
    ('wang_ri_removed', 'shared/lunar/p4YiDayCore.ts',
     ": season[god] === 'present'", ": false", [TEST]),
    ('warehouse_source_refs_direct_only', 'shared/lunar/p4YiDayComposition.ts',
     "'P5_DEFERRED_CO_PRESENCE' : 'DIRECT_YI'", "'DIRECT_YI' : 'DIRECT_YI'", [TEST]),
]
originals = {root / path: (root / path).read_bytes() for _, path, *_ in cases}
results = []
try:
    for name, path, old, new, tests in cases:
        target = root / path
        source = originals[target].decode()
        assert source.count(old) == 1, name
        try:
            target.write_text(source.replace(old, new, 1))
            with tempfile.TemporaryDirectory() as temp:
                output = Path(temp) / 'vitest.json'
                run = subprocess.run(
                    ['npx', 'vitest', 'run', *tests, '--reporter=json', f'--outputFile={output}'],
                    cwd=root, capture_output=True, text=True, timeout=300,
                )
                data = json.loads(output.read_text())
                assertions = [a for suite in data['testResults'] for a in suite['assertionResults']]
                failures = [a for a in assertions if a['status'] == 'failed']
                caught = bool(failures) and all(
                    'AssertionError' in ''.join(a['failureMessages']) for a in failures
                )
                results.append({
                    'mutation': name, 'exitCode': run.returncode,
                    'assertionCaught': caught, 'failedAssertions': len(failures),
                    'failures': [a['fullName'] for a in failures],
                })
                assert run.returncode != 0 and caught, name
        finally:
            target.write_bytes(originals[target])
finally:
    for target, original in originals.items():
        target.write_bytes(original)
report = {
    'scope': 'P4_C_5_5_FOCUSED_NOT_6_X_GATE',
    'mutations': results,
    'restored': all(p.read_bytes() == b for p, b in originals.items()),
    'restoredSha256': {str(p.relative_to(root)): hashlib.sha256(b).hexdigest()
                       for p, b in originals.items()},
}
(root / 'docs/audits/sources/p4-vol10/yi-warehouse-v1/mutations.json').write_text(
    json.dumps(report, ensure_ascii=False, indent=2) + '\n'
)
print(json.dumps(report, ensure_ascii=False))
