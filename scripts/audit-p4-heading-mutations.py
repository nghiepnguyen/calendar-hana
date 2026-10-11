"""Sequential mutations for the P4 A04a heading annotation (audit only, before scoring).

Run only while no test/build/edit process is using these files. Every byte is
restored in finally; the frozen Golden and locks are never modified.
"""
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
target = root / 'shared/lunar/p4HeadingAnnotation.ts'
original = target.read_bytes()
mutations = [
    ('xiangdi_keeps_ji', "else if (effect === 'cancel_both') out[h] = 'neither_recorded'", "else if (effect === 'cancel_both') out[h] = 'only_ji'"),
    ('as_usual_follows_yi', "else if (effect === 'as_usual') out[h] = 'only_ji'", "else if (effect === 'as_usual') out[h] = yi[h] ? 'both_present' : 'only_ji'"),
    ('still_avoid_base_only', 'for (const h of split(YUE_PO_STILL_AVOID.headings)) avoided.add(h)', 'void 0'),
    ('stop_list_ignored', 'ji: stop.has(h)', 'ji: avoided.has(h)'),
    ('avoid_all_spares_listed', "if (effect === 'avoid_all') out[h] = 'only_ji'", "if (effect === 'avoid_all' && avoided.has(h)) out[h] = 'only_ji'"),
    ('unknown_yi_as_false', 'yi: yi[h],', 'yi: yi[h] ?? false,'),
    ('youwei_kept_in_base', "&& !SEPARATE.has(x.as ?? '')", ''),
    ('youwei_scopes_dropped', 'youweiScopes: getP4YouweiScopes(Object.keys(ctx.deferrals))', 'youweiScopes: getP4YouweiScopes([])'),
]
results = []
try:
    for name, old, new in mutations:
        text = original.decode()
        if old not in text:
            raise RuntimeError(f'Mutation did not apply: {name}')
        target.write_text(text.replace(old, new, 1))
        run = subprocess.run(
            ['npx', 'vitest', 'run', 'shared/lunar/p4HeadingAnnotation.test.ts', 'shared/lunar/p4YouweiScopes.test.ts'],
            cwd=root, capture_output=True, text=True, timeout=180,
        )
        output = run.stdout + run.stderr
        caught = run.returncode != 0 and ('AssertionError' in output or 'expected' in output)
        results.append({'mutation': name, 'caughtByAssertion': caught, 'exitCode': run.returncode})
        target.write_bytes(original)
finally:
    target.write_bytes(original)

report = {
    'scope': 'AUDIT_A04A_HEADING_ANNOTATION_ONLY_NOT_SCORING',
    'mutations': results,
    'restored': True,
    'notCovered': 'Day-level composition and propagation (A04b), target 忌 coverage (A05), scoring, penalty, warehouse and event mutations remain go-live prerequisites.',
}
(root / 'docs/audits/p4-vol10-heading-mutation-results.json').write_text(
    json.dumps(report, ensure_ascii=False, indent=2) + '\n'
)
print(json.dumps(results))
